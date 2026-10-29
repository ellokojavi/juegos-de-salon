#!/usr/bin/env node
/**
 * The owner's release notifications (D-504): when publish.yml puts a merged PR live, or fails to,
 * this sends one notification to each of the owner's devices (Firebase `ownerPush/`, subscribed from
 * the panel's 🔔 button). A tap opens exactly what the PR launched, not the home page:
 *
 *   ✅ v0.233.0 en vivo · PR #981          ❌ PR #981 no se publicó
 *   Teasers de Stack y Stick Ninja…        Fallaron las pruebas en main.
 *   👉 Ver en 📣 Campañas                   👉 Ver el error
 *
 * Where it goes is the PR's own `Ver en:` line (docs/MERGING.md), and what it says its `Qué:` line;
 * without them, it is worked out from the files the PR changed (`destination`). A PR that changed
 * nothing the site serves and has no `Ver en:` line sends nothing: there is nothing to look at.
 * The notification text is the owner's language, Spanish; the rest is English (D-316).
 *
 *   node tools/push/release.mjs --pr 981 --version 0.233.0 [--failed "the tests"] [--run-url URL] [--dry-run]
 *
 * In publish.yml it reads the PR with `gh` (GH_TOKEN), the devices as administrator ($FIREBASE_KEY)
 * and signs with $VAPID_PRIVADA, as notify.mjs does.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GAMES, SUELTOS } from '../../public/assets/js/games.js';
import { ACTIVE } from '../../public/assets/js/splash.js';
import { STEPS, prOf } from '../release/merge-report.mjs';

const SITE = 'https://juegosdesalon.cl';

/** The `Ver en:` and `Qué:` lines of a PR body (English `See at:` / `What:` work too). */
export function declared(body = '') {
  const line = re => (String(body).match(re)?.[1] || '').trim();
  const at = line(/^\s*(?:\*\*)?(?:Ver en|See at)(?:\*\*)?\s*:\s*(?:\*\*)?\s*`?([^`\s]+)`?/im);
  const what = line(/^\s*(?:\*\*)?(?:Qué|What)(?:\*\*)?\s*:\s*(?:\*\*)?\s*(.+)$/im);
  return { at: at ? toPath(at) : '', what };
}

/** A path of the site, from a path or a full link to it. Anything else is not a destination. */
function toPath(x) {
  try {
    const u = new URL(x, SITE);
    if (u.origin !== SITE && !/^juegosdesalon\.cl$/.test(u.hostname)) return '';
    return `${u.pathname}${u.search}${u.hash}`;
  } catch (_) { return ''; }
}

/** The call to action for a path: what the owner will see on tapping. */
export function ctaFor(path) {
  if (path.startsWith('/panel/#/campaigns/flags')) return 'Ver en 🚩 Lab flags';
  if (path.startsWith('/panel/#/campaigns')) return 'Ver en 📣 Campañas';
  if (path.startsWith('/panel/')) return 'Abrir el panel';
  if (/[?&]splash=/.test(path)) return 'Ver el splash';
  if (path.startsWith('/labs/')) return path === '/labs/' ? 'Abrir el lab' : 'Abrir en el lab';
  const game = [...GAMES, ...(SUELTOS || [])].find(g => g.path && path.startsWith(`/${g.path}`));
  if (game) return `Abrir ${game.name?.es || game.id}`;
  return 'Abrir el sitio';
}

/**
 * Where a PR is seen, from the files it changed. `splashOn(id)` says whether a campaign is on today.
 * The first that applies wins: a splash campaign, a lab game, a lab flag, a game, the panel, the site.
 * Null when the PR changed nothing the site serves.
 */
export function destination(files, { splashOn = () => false } = {}) {
  const f = files.map(String);
  const campaign = f.map(x => x.match(/^marketing\/splash\/campaigns\/([a-z0-9-]+)\//)?.[1]).find(Boolean);
  if (campaign) return splashOn(campaign) ? `/?splash=${campaign}` : `/panel/#/campaigns/splash/${campaign}`;
  const lab = f.map(x => x.match(/^public\/labs\/([a-z0-9-]+)\//)?.[1]).find(Boolean);
  if (lab) return `/labs/${lab}/`;
  if (f.includes('public/assets/js/flags.js')) return '/labs/';
  for (const x of f) {
    const game = [...GAMES, ...(SUELTOS || [])].find(g => g.path && g.path !== './' && x.startsWith(`public/${g.path}`));
    if (game) return `/${game.path}`;
  }
  if (f.some(x => x.startsWith('public/panel/'))) return '/panel/';
  if (f.some(x => x.startsWith('public/') || x === 'firebase/database.rules.json')) return '/';
  return null;
}

/**
 * The notification: `{ title, body, url, tag }`, as sw.js shows it. `failed` is the step that
 * stopped the publish, as a sentence (FAILED), empty when it went live.
 */
export function message({ pr, title, version, failed = '', runUrl = '', at, what }) {
  const feature = (what || title || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  if (failed) {
    return { title: `❌ PR #${pr} no se publicó`, body: `${feature}\n${failed}.\n👉 Ver el error`, url: runUrl || '/panel/', tag: `release-${pr}` };
  }
  const v = String(version || '?').replace(/^v?/, 'v');
  return { title: `✅ ${v} en vivo · PR #${pr}`, body: `${feature}\n👉 ${ctaFor(at)}`, url: at, tag: `release-${pr}` };
}

/** The step names publish.yml's jobs carry, as the notification says them. */
export const FAILED = { tests: 'Fallaron las pruebas', e2e: 'Fallaron las pruebas de punta a punta', rules: 'No se publicaron las reglas de Firebase', publish: 'No se publicó el sitio' };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = n => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] || '' : ''; };
  const dryRun = process.argv.includes('--dry-run');
  const repo = process.env.GITHUB_REPOSITORY || 'ellokojavi/juegos-de-salon';
  const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  // In publish.yml: the PR that merged $GITHUB_SHA, and the first job of $RESULTS that did not pass
  let pr = arg('pr');
  if (!pr && process.env.GITHUB_SHA) pr = String(prOf(JSON.parse(gh('api', `repos/${repo}/commits/${process.env.GITHUB_SHA}/pulls`)), process.env.GITHUB_SHA) || '');
  if (!pr && process.env.GITHUB_SHA) { console.log('A push without a merged PR: no notification'); process.exit(0); }
  if (!/^\d+$/.test(pr)) { console.error('Usage: node tools/push/release.mjs --pr <n> --version <x.y.z> [--failed <job>] [--run-url URL] [--dry-run]'); process.exit(2); }
  const results = JSON.parse(process.env.RESULTS || '{}');
  if ([results.rules, results.publish].some(j => j?.outputs?.newest === 'false')) { console.log('A newer merge publishes this one (D-506): its run notifies'); process.exit(0); }
  const stopped = results.publish && results.publish.result !== 'success' ? STEPS.map(([job]) => job).find(j => ['failure', 'cancelled'].includes(results[j]?.result)) || 'publish' : '';
  const info = JSON.parse(gh('pr', 'view', pr, '--repo', repo, '--json', 'title,body,files'));
  const files = (info.files || []).map(x => x.path);

  let db = null;
  if (!dryRun || process.env.FIREBASE_KEY) {
    const { token, read } = await import('../firebase/firebase-admin.mjs');
    const t = await token();
    db = { read: p => read(p, t), t };
  }
  const remote = db ? await db.read('splash').catch(() => null) : null;
  const splashOn = id => (remote && remote[id] ? !!remote[id].on : (ACTIVE || []).some(a => a?.id === id));
  const own = declared(info.body);
  const at = own.at || destination(files, { splashOn });
  const failedJob = arg('failed') || stopped;
  if (!at && !failedJob) { console.log(`#${pr} changed nothing the site serves and has no "Ver en:" line: no notification`); process.exit(0); }
  const n = message({ pr, title: info.title, what: own.what, version: arg('version') || process.env.VERSION, failed: FAILED[failedJob] || failedJob, runUrl: arg('run-url') || process.env.RUN_URL, at: at || '/' });
  console.log(`${n.title}\n${n.body}\n→ ${n.url}`);
  if (dryRun) process.exit(0);

  const { send } = await import('./webpush.mjs');
  const { VAPID_PUBLICA } = await import('../../public/assets/js/vapid.js');
  const privateKey = process.env.VAPID_PRIVADA || '';
  if (!VAPID_PUBLICA || !privateKey) { console.log('No VAPID key: nothing sent (tools/push/vapid.mjs).'); process.exit(0); }
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  const devices = (await db.read('ownerPush')) || {};
  let sent = 0;
  for (const [id, sub] of Object.entries(devices)) {
    const r = await send(sub, n, { publicKey: VAPID_PUBLICA, privateKey }).catch(e => ({ status: 0, error: e }));
    if (r?.status === 404 || r?.status === 410) {
      await fetch(`${firebaseConfig.databaseURL}/ownerPush/${id}.json?access_token=${encodeURIComponent(db.t)}`, { method: 'DELETE' });
      console.log(`${sub.device || id}: gone, removed`);
    } else if (r?.status >= 200 && r?.status < 300) { sent++; console.log(`${sub.device || id}: delivered`); }
    else console.log(`::warning::${sub.device || id}: not delivered (${r?.status || r?.error?.message})`);
  }
  console.log(`${sent} of ${Object.keys(devices).length} devices notified`);
}
