#!/usr/bin/env node
/**
 * Sends the La Copa notifications that are due now (D-224). `.github/workflows/notifications.yml`
 * runs it every 15 minutes; it can also be run by hand:
 *
 *   node tools/push/notify.mjs                # sends what is due
 *   node tools/push/notify.mjs --dry-run      # says what it would send, without sending or recording anything
 *   node tools/push/notify.mjs --test KQRST   # a test notification to each phone of that cup
 *
 * It signs in to the database as administrator (the service account key, D-122) and reads who
 * wants notifications (`pushCopa`), the subscriptions (`push`) and what was already sent
 * (`pushEnviados`). What is due is decided by schedule.mjs; how it is sent, by webpush.mjs. Then:
 * - it merges into one notification the new days of several cups for the same phone (D-229);
 * - it records each delivered notification in `pushEnviados/<code>/<subId>/<key>`, so as not to repeat it;
 * - it deletes the subscriptions the service declared dead (404 or 410) and their cups;
 * - it cleans what belongs to cups that ended more than a week ago or no longer exist;
 * - it also sends One a Day's (`pushDia`, daily.mjs, D-230) and records them in
 *   `pushEnviadosDia/<subId>/<key>`;
 * - it adds up what was delivered per day and kind in `stats/prod/days/<day>/mandados/<kind>` and
 *   leaves in `stats/prod/push` the round's time and how many subscriptions are still alive
 *   (D-233): the dashboard shows them, and if the time falls behind, GitHub stopped running the workflow.
 * The Firebase paths and fields named here are persisted data: they keep their Spanish names (D-316).
 *
 * The VAPID private key comes from $VAPID_PRIVADA (the GitHub secret, a name the owner decided to
 * keep); the public one, from vapid.js. Without either there is nothing to send, and it exits
 * without error.
 */
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { VAPID_PUBLICA } from '../../public/assets/js/vapid.js';
import { cupNotifications, testNotifications, merge } from './schedule.mjs';
import { dailyNotifications, stale } from './daily.mjs';
import { sumarDias } from '../../public/assets/js/uno-al-dia.js';
import { send } from './webpush.mjs';

const WEEK = 7 * 24 * 3600e3;
const DAY = 24 * 3600e3;
/** The notifications' signals go with the published site's (D-44): `stats/prod`. */
export const STATS_ENV = 'prod';

/**
 * A full round, with the database and the sending injectable (the tests do not touch the network).
 * `db.read(path)` and `db.update({ path: value|null })`; `deliver(sub, notification)` → { status, dead, text }.
 */
export async function round({ db, deliver, now = Date.now(), dryRun = false, testCode = '', log = console.log }) {
  const [allWants, subs, allSent] = await Promise.all([db.read('pushCopa'), db.read('push'), db.read('pushEnviados')]);
  const summary = { cups: 0, notifications: 0, delivered: 0, dead: 0, failures: 0, cleaned: 0 };
  const changes = {};
  const dead = new Set();
  const all = [], names = {}, byKind = {};
  for (const [code, wants] of Object.entries(allWants || {})) {
    if (testCode && code !== testCode) continue;
    const cup = await db.read(`torneos/${code}`);
    // A deleted cup, or one that ended more than a week ago: its notifications are no longer useful
    if (!testCode && (!cup?.meta || now - (cup.fin || cup.meta.end) > WEEK)) {
      changes[`pushCopa/${code}`] = null;
      changes[`pushEnviados/${code}`] = null;
      summary.cleaned++;
      continue;
    }
    summary.cups++;
    names[code] = cup.meta.name;
    all.push(...(testCode ? testNotifications({ code, cup, wants, subs: subs || {} }) : cupNotifications({ code, cup, wants, subs: subs || {}, sent: allSent?.[code] || {}, now })));
  }
  for (const p of merge(all, subs || {}, names)) {
    summary.notifications++;
    log(`${dryRun ? '· would send' : '→'} ${p.code} ${p.pid} ${p.subId.slice(0, 8)} [${p.keys.join(',')}] ${p.notification.body}`);
    if (dryRun) continue;
    let r;
    try { r = await deliver(subs[p.subId], p.notification); } catch (e) { r = { status: 0, text: String(e?.message || e) }; }
    if (r.status >= 200 && r.status < 300) {
      summary.delivered++;
      byKind[p.kind] = (byKind[p.kind] || 0) + 1;
      for (const { code, keys } of p.perCup) for (const k of keys) changes[`pushEnviados/${code}/${p.subId}/${k}`] = now;
    } else if (r.dead) {
      summary.dead++;
      dead.add(p.subId);
    } else {
      summary.failures++;
      log(`  ✗ ${r.status} ${r.text || ''}`);
    }
  }
  // One a Day (D-230): they do not go with a cup's test
  if (!testCode) {
    // The seasons already computed to their end (D-424): this UTC month's and the one before, whichever a phone's date is in
    const utcMonth = new Date(now).toISOString().slice(0, 7);
    const months = [utcMonth, sumarDias(`${utcMonth}-01`, -1).slice(0, 7)];
    const [dailyWants, dailySent, ...ends] = await Promise.all([db.read('pushDia'), db.read('pushEnviadosDia'), ...months.map(m => db.read(`uadTemporada/s${m}/t`))]);
    const seasonsDone = months.filter((m, i) => typeof ends[i] === 'string' && ends[i] > `${m}-31`);
    for (const p of dailyNotifications({ wants: dailyWants || {}, subs: subs || {}, sent: dailySent || {}, now, seasonsDone })) {
      summary.notifications++;
      log(`${dryRun ? '· would send' : '→'} one-a-day ${p.subId.slice(0, 8)} [${p.key}] ${p.notification.body}`);
      if (dryRun) continue;
      let r;
      try { r = await deliver(subs[p.subId], p.notification); } catch (e) { r = { status: 0, text: String(e?.message || e) }; }
      if (r.status >= 200 && r.status < 300) {
        summary.delivered++;
        byKind[`uad${p.kind}`] = (byKind[`uad${p.kind}`] || 0) + 1;
        changes[`pushEnviadosDia/${p.subId}/${p.key}`] = now;
        if (p.remove) { changes[`pushDia/${p.subId}`] = null; changes[`pushEnviadosDia/${p.subId}`] = null; }
      } else if (r.dead) { summary.dead++; dead.add(p.subId); } else { summary.failures++; log(`  ✗ ${r.status} ${r.text || ''}`); }
    }
    for (const path of stale(dailySent || {}, now)) if (!(path in changes)) changes[path] = null;
    // One a Day's data of a subscription that no longer exists
    for (const subId of Object.keys(dailyWants || {})) if (!subs?.[subId]) changes[`pushDia/${subId}`] = null;
  }
  // A dead subscription is deleted, with every cup that used it
  for (const subId of dead) {
    changes[`push/${subId}`] = null;
    changes[`pushDia/${subId}`] = null;
    for (const [code, wants] of Object.entries(allWants || {})) {
      for (const [pid, bySub] of Object.entries(wants || {})) if (bySub?.[subId]) changes[`pushCopa/${code}/${pid}/${subId}`] = null;
    }
  }
  // What the dashboard looks at (D-233): what was delivered today by kind, this round's time and the live subscriptions
  const day = Math.floor(now / DAY);
  for (const [kind, k] of Object.entries(byKind)) changes[`stats/${STATS_ENV}/days/${day}/mandados/${kind}`] = { '.sv': { increment: k } };
  changes[`stats/${STATS_ENV}/push/vuelta`] = now;
  changes[`stats/${STATS_ENV}/push/vivas`] = Object.keys(subs || {}).filter(s => !dead.has(s)).length;
  changes[`stats/${STATS_ENV}/push/torneos`] = summary.cups;
  if (!dryRun) await db.update(changes);
  return summary;
}

/** The database over REST, as administrator (the other tools/firebase do the same). */
async function realDb() {
  const { token, read } = await import('../firebase/firebase-admin.mjs');
  const t = await token();
  return {
    read: path => read(path, t),
    async update(changes) {
      const res = await fetch(`${firebaseConfig.databaseURL}/.json?access_token=${encodeURIComponent(t)}`, { method: 'PATCH', body: JSON.stringify(changes) });
      if (!res.ok) throw new Error(`Could not record in the database (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // --simular and --prueba: the names from before D-316
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--simular');
  const i = Math.max(process.argv.indexOf('--test'), process.argv.indexOf('--prueba'));
  const testCode = i > 0 ? String(process.argv[i + 1] || '').trim().toUpperCase() : '';
  if (i > 0 && !/^[A-HJ-NP-Z]{5}$/.test(testCode)) { console.error('Usage: node tools/push/notify.mjs --test <cup code, 5 letters>'); process.exit(2); }
  const privateKey = process.env.VAPID_PRIVADA || '';
  if (!VAPID_PUBLICA || (!privateKey && !dryRun)) {
    console.log(`No ${VAPID_PUBLICA ? 'private ($VAPID_PRIVADA)' : 'public (vapid.js)'} VAPID key: no notifications to send. See tools/push/vapid.mjs.`);
    process.exit(0);
  }
  const db = await realDb();
  const deliver = (sub, notification) => send(sub, notification, { publicKey: VAPID_PUBLICA, privateKey });
  const r = await round({ db, deliver, dryRun, testCode });
  if (testCode && !r.notifications) console.log(`Cup ${testCode} has no phones with notifications on.`);
  console.log(`${dryRun ? 'Dry run: ' : ''}${r.cups} cups with notifications · ${r.notifications} ${dryRun ? 'to send' : `sent (${r.delivered} delivered, ${r.dead} dead subscriptions, ${r.failures} failures)`} · ${r.cleaned} cups cleaned`);
  if (r.failures && r.failures === r.notifications) process.exit(1);
}
