/**
 * Which La Copa notification is due now, and to whom (D-224). A pure function: it takes the cup,
 * who wants notifications, the subscriptions and what was already sent, and returns the list.
 * notify.mjs runs it every 15 minutes; the tests, with made-up clocks. It uses the cup's logic
 * (cup/engine.js): the days, their windows and the table are the same the player sees.
 *
 * The notifications (docs/PWA-NOTIFICACIONES.md), by kind (the kinds and keys are stored in
 * Firebase and counted by the dashboard: they keep their Spanish names, D-316):
 *   dia:<d>     day d opened (not the final)                if they asked for "When a day opens"
 *   plazo:<d>   day d is about to close and they have not played it   if they asked for "Before closing"
 *   final       today is The Grand Final                    always, with their place in the table
 *   fin         the cup ended                               always, with who won and a tap to see the table
 *   insc:<pid>  someone signed up (only to the admin)       always
 *
 * When: in the recipient's time (their zone comes with the subscription), never at night
 * (before 8:00 or from 22:00). The day's one, from 9:00; the deadline's, when 4 hours or less are
 * left, or from 20:00 if the closing falls at night for them. Each round sends at most one per
 * cup and phone: the next one goes out in the following round.
 *
 * D-229: at most CAP notifications per cup and phone on the same day of the recipient; if two
 * deadlines expire at once, they go in a single notification. A tie for first place names everyone
 * who won. The day's, the deadline's and the final's open that day of the cup (`&day=<d>`), and on
 * Android they bring the Play and Mute this cup buttons (`acciones`, the key sw.js reads). The new
 * days of several cups at once are merged into one notification (`merge`, used by notify.mjs).
 */
import { conCierre, diaActual, esFinal, anulado, tabla, juegoDelDia, terminada, fuera, enRiesgo } from '../../public/cup/engine.js';
import { LOCALES, juegosCopa } from '../../public/cup/rules.js';
import { VALORES } from '../../public/assets/js/parametros.js';

/** The notification in the URL, in English (`notif=deadline`, D-266); the dashboard counts it with its usual kind. */
const notif = kind => `notif=${VALORES.notif[kind] || kind}`;

export const SITE = 'https://juegosdesalon.cl/';
export const FROM_HOUR = 8, TO_HOUR = 22, MORNING = 9, EVENING = 20;
const HOUR = 60 * 60 * 1000;
export const DEADLINE_MS = 4 * HOUR;
export const DEADLINE_NIGHT_MS = 10 * HOUR;
export const END_VALIDITY = 24 * HOUR;
/** At most this many notifications per cup and phone on the same day of the recipient (D-229). */
export const CAP = 2;
/** The order they are preferred in, if more than one is due in a round. */
const PRIORITY = ['fin', 'plazo', 'final', 'dia', 'insc'];

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));

/** "Ana y Beto", "Ana, Beto y Caro": the list in the recipient's language. */
export const listOf = (names, lang) => {
  try { return new Intl.ListFormat(lang, { type: 'conjunction' }).format(names); } catch (_) { return names.join(', '); }
};

/** The date (yyyy-mm-dd) in the recipient's zone; an invalid zone counts as UTC. */
export function localDate(t, tz) {
  const f = z => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: z }).format(t);
  try { return f(tz || 'UTC'); } catch (_) { return f('UTC'); }
}

/** How many of this cup's notifications reached this phone today (in its zone): one delivery, one notification. */
export function sentToday(sentToSub = {}, now, tz) {
  const today = localDate(now, tz);
  return new Set(Object.values(sentToSub || {}).filter(t => typeof t === 'number' && localDate(t, tz) === today)).size;
}

/** The hour (0–23) in the recipient's zone; an invalid zone counts as UTC. */
export function localHour(now, tz) {
  const f = z => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: z }).format(now));
  try { return f(tz || 'UTC'); } catch (_) { return f('UTC'); }
}

/**
 * @param {string} code  the cup's code
 * @param {object} cup   torneos/<code> as it is in the database
 * @param {object} wants pushCopa/<code>: { <pid>: { <subId>: { dia, plazo, at } } }
 * @param {object} subs  push: { <subId>: { endpoint, keys, lang, tz, uid, at } }
 * @param {object} sent  pushEnviados/<code>: { <subId>: { <key>: at } }
 * @param {number} now
 * @returns {{ subId, pid, code, kind, keys: string[], notification: { title, body, url, tag, acciones? } }[]}
 */
export function cupNotifications({ code, cup, wants = {}, subs = {}, sent = {}, now }) {
  if (!cup?.meta) return [];
  const L = conCierre(cup);
  const { meta } = L;
  const url = `${SITE}cup/?${meta.alias || code}`;
  const out = [];
  for (const [pid, bySub] of Object.entries(wants || {})) {
    const player = L.players?.[pid];
    if (!player || player.out) continue;
    // Out of the cup for missing two days in a row (D-347): nothing more to remind them of
    if (!terminada(meta, now) && fuera(L, pid, now)) continue;
    for (const [subId, pref] of Object.entries(bySub || {})) {
      const sub = subs[subId];
      if (!sub) continue;
      const h = localHour(now, sub.tz);
      if (h < FROM_HOUR || h >= TO_HOUR) continue;
      if (sentToday(sent?.[subId], now, sub.tz) >= CAP) continue;
      const already = key => !!sent?.[subId]?.[key];
      const lang = LOCALES[sub.lang] ? sub.lang : 'es';
      const T = LOCALES[lang];
      const title = `🏆 ${fmt(T.shareHead, { copa: meta.name })}`;
      const candidates = [];
      const ord = n => fmt(T.ord, { n });

      if (terminada(meta, now)) {
        // It ended: who won and in which place they finished, once and during the next day
        if (now - meta.end <= END_VALIDITY && !already('fin')) {
          const rows = tabla(L, pid, now);
          const mine = rows.find(f => f.pid === pid);
          if (rows.length && mine) {
            // A tie for first place (same points, days won and final): they all won (D-229)
            const winners = rows.filter(f => f.lugar === 1);
            const others = winners.filter(f => f.pid !== pid).map(f => f.name);
            const body = mine.lugar === 1
              ? (others.length ? fmt(T.avMsgWinTie, { names: listOf(others, lang) }) : T.avMsgWin)
              : winners.length > 1 ? fmt(T.avMsgEndMany, { names: listOf(winners.map(f => f.name), lang), pos: ord(mine.lugar) })
              : fmt(T.avMsgEnd, { name: rows[0].name, pos: ord(mine.lugar) });
            // It says what the tap opens: the cup's final table (D-423)
            candidates.push({ kind: 'fin', keys: ['fin'], body: `${body} ${T.avEndSee}`, tag: `copa-${code}-fin` });
          }
        }
      } else {
        const d = diaActual(meta, now);
        const played = k => !!L.results?.[k]?.[pid];
        if (d >= 1 && d <= meta.days && !anulado(meta, d) && h >= MORNING && !played(d) && !L.started?.[d]?.[pid]) {
          if (esFinal(meta, d)) {
            if (!already('final')) {
              const rows = tabla(L, pid, now);
              const mine = rows.find(f => f.pid === pid);
              if (mine) {
                const leader = rows[0];
                const pts = leader.total - mine.total;
                // With a tiebreak, 2nd may have the same points as 1st (U-6: "1 point")
                const msg = pts === 0 ? T.avMsgFinalTie : pts === 1 ? T.avMsgFinalOne : T.avMsgFinal;
                const body = mine.lugar === 1 ? fmt(T.avMsgFinalLead, { pos: ord(1) })
                  : fmt(msg, { pos: ord(mine.lugar), pts, lider: leader.name });
                candidates.push({ kind: 'final', keys: ['final'], body, tag: `copa-${code}-d${d}`, day: d });
              }
            }
          } else if (pref.dia !== false && !already(`dia:${d}`)) {
            const J = juegosCopa(lang)[juegoDelDia(meta, d)] || {};
            candidates.push({ kind: 'dia', keys: [`dia:${d}`], body: fmt(T.avMsgDay, { emoji: J.emoji || '🏆', d, juego: J.nombre || '' }), tag: `copa-${code}-d${d}`, day: d });
          }
        }
        // The deadline: today's day and yesterday's (still in its grace day). If both expire at
        // once (the final and the day before), they go together in one notification (D-229)
        if (pref.plazo !== false) {
          const expiring = [];
          for (const k of [d - 1, d]) {
            const w = meta.win[k];
            if (!w || anulado(meta, k) || played(k) || now < w.a || now >= w.b || already(`plazo:${k}`)) continue;
            const left = w.b - now;
            if (left <= DEADLINE_MS || (h >= EVENING && left <= DEADLINE_NIGHT_MS)) expiring.push({ k, hours: Math.ceil(left / HOUR) });
          }
          if (expiring.length) {
            const hours = Math.min(...expiring.map(v => v.hours)), k = expiring[0].k;
            const body = expiring.length > 1
              ? fmt(hours <= 1 ? T.avMsgDueManyOne : T.avMsgDueMany, { h: hours, dias: listOf(expiring.map(v => String(v.k)), lang) })
              // One missed day already: this one would leave them out (D-347)
              : enRiesgo(L, pid, now) === k ? fmt(hours <= 1 ? T.avMsgDueOutOne : T.avMsgDueOut, { h: hours, d: k })
              : fmt(hours <= 1 ? T.avMsgDueOne : T.avMsgDue, { h: hours, d: k });
            candidates.push({ kind: 'plazo', keys: expiring.map(v => `plazo:${v.k}`), body, tag: `copa-${code}-d${expiring[expiring.length - 1].k}`, day: k });
          }
        }
        // To the admin: who signed up since they asked for notifications (in the last day)
        if (pid === meta.admin) {
          const joined = Object.entries(L.players || {})
            .filter(([p, x]) => p !== pid && x && !x.out && (x.at || 0) > (pref.at || 0) && now - (x.at || 0) <= END_VALIDITY && !already(`insc:${p}`))
            .sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
          if (joined.length) {
            const n = Object.values(L.players).filter(x => x && !x.out).length;
            const names = joined.map(([, x]) => x.name);
            const body = names.length === 1 ? fmt(T.avMsgJoin, { name: names[0], n }) : fmt(T.avMsgJoinMany, { names: listOf(names, lang), n });
            candidates.push({ kind: 'insc', keys: joined.map(([p]) => `insc:${p}`), body, tag: `copa-${code}-insc` });
          }
        }
      }
      if (!candidates.length) continue;
      candidates.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
      const c = candidates[0];
      // `&notif=<kind>`: the page counts it when it opens, and the dashboard sees how many are tapped (D-233)
      const notification = { title, body: c.body, url: `${url}&${notif(c.kind)}`, tag: c.tag };
      if (c.day) {
        // It opens that day of the cup, and on Android brings the buttons (D-229)
        notification.url = `${url}&day=${c.day}&${notif(c.kind)}`;
        notification.acciones = [
          { action: 'jugar', title: T.play, url: notification.url },
          { action: 'silenciar', title: T.avMute, url: `${url}&mute` },
        ];
      }
      out.push({ subId, pid, code, kind: c.kind, keys: c.keys, notification });
    }
  }
  return out;
}

/**
 * The new days of several cups due to the same phone in the same round go in a single
 * notification (D-229): "Tienes un día nuevo en 2 copas: Los Primos y La Oficina." It opens The
 * Cup's home page, with "Tus copas". The rest passes as is. Each one carries `perCup`: what to
 * record in each cup.
 */
export function merge(pending, subs = {}, names = {}) {
  const out = [], days = new Map();
  for (const p of pending) {
    if (p.kind === 'dia') { if (!days.has(p.subId)) days.set(p.subId, []); days.get(p.subId).push(p); }
    else out.push({ ...p, perCup: [{ code: p.code, keys: p.keys }] });
  }
  for (const [subId, ps] of days) {
    if (ps.length === 1) { out.push({ ...ps[0], perCup: [{ code: ps[0].code, keys: ps[0].keys }] }); continue; }
    const lang = LOCALES[subs[subId]?.lang] ? subs[subId].lang : 'es';
    const T = LOCALES[lang];
    const cups = listOf(ps.map(p => names[p.code] || p.code), lang);
    out.push({
      subId, pid: ps.map(p => p.pid).join(','), code: ps.map(p => p.code).join(','), kind: 'dia',
      keys: ps.flatMap(p => p.keys),
      perCup: ps.map(p => ({ code: p.code, keys: p.keys })),
      notification: { title: T.chip, body: fmt(T.avMsgDayMany, { n: ps.length, copas: cups }), url: `${SITE}cup/?${notif('copas')}`, tag: 'copas-dia' },
    });
  }
  return out;
}

/**
 * The test notification the server sends (`notify.mjs --test <code>`): one to each phone with
 * notifications for that cup, at any time and without recording it. It shows that the real
 * sending arrives.
 */
export function testNotifications({ code, cup, wants = {}, subs = {} }) {
  if (!cup?.meta) return [];
  const out = [];
  for (const [pid, bySub] of Object.entries(wants || {})) {
    for (const subId of Object.keys(bySub || {})) {
      const sub = subs[subId];
      if (!sub) continue;
      const T = LOCALES[sub.lang] || LOCALES.es;
      out.push({ subId, pid, code, kind: 'prueba', keys: [], notification: { title: `🏆 ${fmt(T.shareHead, { copa: cup.meta.name })}`, body: T.avTestBody, url: `${SITE}cup/?${cup.meta.alias || code}&${notif('prueba')}`, tag: `copa-${code}-prueba` } });
    }
  }
  return out;
}
