/**
 * Which One a Day notification is due now, and to whom (D-230). A pure function, like schedule.mjs:
 * it takes who asked for notifications (`pushDia`), the subscriptions (`push`) and what was already
 * sent (`pushEnviadosDia`), and returns the list. notify.mjs runs it every 15 minutes.
 *
 * The phone writes `pushDia/<subId>` when it turns notifications on and after each One a Day:
 *   { h: the daily notification's hour (0–23), d, r, w: whether it wants the daily, the streak and
 *     the weekly ones, u: the last day played (number since 1970, in its date), c: its streak that
 *     day, k: its freezes, m: its best streak, sp/sn: the week of its last day and how many days it
 *     played in it, at }
 *
 * The notifications (docs/UNO-AL-DIA.md), by kind and key (stored in Firebase and counted by the
 * dashboard: they keep their Spanish names, D-316):
 *   dia:<n>      today's is ready          from their hour (h), if they have not played today
 *   racha:<n>    the streak is ending      from 21:00, if they have not played and the streak is 2 or more
 *   semana:<s>   their week                on Mondays from their hour, if they played any day the week before
 *   temporada:<m> the month's season ended   on the 1st to the 3rd from their hour, if they played since that month began (D-424)
 *   adios        they calm down on their own   after 30 days without playing, one last; then deleted
 * Never at night (before 8:00 or from 22:00) and at most 2 a day per phone. The notification does
 * not say which game is due (the owner's decision): the surprise belongs to the die. After 14 days
 * without playing, the daily one goes out every other day.
 */
import { COMMON } from '../../public/assets/js/i18n.js';
import { numeroDel, fechaDeNum, numDia, semanaDe, sumarDias } from '../../public/assets/js/uno-al-dia.js';
import { localDate, localHour, FROM_HOUR, TO_HOUR, SITE } from './schedule.mjs';
import { VALORES } from '../../public/assets/js/parametros.js';

export const STREAK_HOUR = 21;
/** The season's notification goes out on the first days of the next month, from their hour (D-424). */
export const SEASON_DAYS = 3;
/**
 * The season's notification (D-424), in the four languages: here and not in i18n.js, which every
 * page loads, because only this sender says it. Its link opens the season's recap on the home page.
 */
export const SEASON_TEXT = {
  es: '🏆 Terminó la temporada de {mes}. Toca para ver cómo quedaste.',
  en: "🏆 {mes}'s season is over. Tap to see where you finished.",
  pt: '🏆 A temporada de {mes} terminou. Toque para ver como você ficou.',
  de: '🏆 Die Saison im {mes} ist vorbei. Tippe, um deine Platzierung zu sehen.',
};
const monthName = (m, lang) => new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' }).format(new Date(`${m}-15T12:00:00Z`));
export const DAILY_CAP = 2;
export const CALM_DAYS = 14;
export const GOODBYE_DAYS = 30;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));

/** The streak still alive today: the last day played's if it was yesterday (or the day before, with a freeze). */
export function liveStreak(q, todayN) {
  if (!Number.isInteger(q?.u) || !q.c) return 0;
  const missed = todayN - q.u - 1;              // days without playing between the last one and today
  return missed <= 0 ? q.c : missed <= (q.k || 0) ? q.c : 0;
}

/**
 * @param {object} wants  pushDia: { <subId>: { h, d, r, w, u, c, k, m, sp, sn, at } }
 * @param {object} subs   push: { <subId>: { endpoint, keys, lang, tz, uid, at } }
 * @param {object} sent   pushEnviadosDia: { <subId>: { <key>: at } }
 * @param {string[]} seasonsDone  the months whose places the rebuild already computed to their end
 *   (`uadTemporada/s<m>/t`, D-424): the season's notification waits for them, or its link would open nothing
 * @returns {{ subId, kind, key, remove?, notification: { title, body, url, tag } }[]}
 */
export function dailyNotifications({ wants = {}, subs = {}, sent = {}, now, seasonsDone = [] }) {
  const out = [];
  for (const [subId, q] of Object.entries(wants || {})) {
    const sub = subs[subId];
    if (!sub || !q) continue;
    const tz = sub.tz, hour = localHour(now, tz);
    if (hour < FROM_HOUR || hour >= TO_HOUR) continue;
    const today = localDate(now, tz), todayN = numDia(today);
    const already = sent[subId] || {};
    // At most 2 a day per phone, in its date
    if (Object.values(already).filter(t => typeof t === 'number' && localDate(t, tz) === today).length >= DAILY_CAP) continue;
    const lang = COMMON[sub.lang] ? sub.lang : 'es';
    const T = COMMON[lang].uad;
    // `uad<kind>`: the dashboard counts the taps apart from La Copa's, which also have `dia` (D-233);
    // no dash, because the rules of `aviso/` and `mandados/` ask for letters only
    const url = kind => `${SITE}today/?notif=${VALORES.notif[`uad${kind}`]}${lang === 'es' ? '' : `&lang=${lang}`}`;
    const playedToday = q.u === todayN;
    const idle = Number.isInteger(q.u) ? todayN - q.u : 0;
    const one = (kind, key, body, extra = {}) => { if (!already[key]) out.push({ subId, kind, key, notification: { title: T.avTitulo, body, url: url(kind), tag: `uad-${kind}` }, ...extra }); return !already[key]; };

    // They calm down on their own: after 30 days without playing, one last, and they are deleted
    if (idle >= GOODBYE_DAYS) {
      const m = Math.max(q.m || 0, q.c || 0);   // with a best streak of 1, "fue de 1 días" is not said (U-6)
      one('adios', 'adios', m >= 2 ? fmt(T.avAdios, { m }) : T.avAdiosSin, { remove: true }); continue;
    }
    const c = liveStreak(q, todayN);
    // The streak's, at night: it is the one that matters most, it goes first
    if (q.r !== false && !playedToday && c >= 2 && hour >= STREAK_HOUR) {
      const left = 24 - hour;   // at 21:xx, "te quedan 3 horas", rounded up like La Copa's
      // The freezes left: if they did not play yesterday, one was already spent to reach today
      const freezesLeft = (q.k || 0) - Math.max(0, todayN - q.u - 1);
      if (one('racha', `racha:${todayN}`, fmt(freezesLeft > 0 ? T.avRachaCom : T.avRacha, { c, h: left }))) continue;
    }
    // The month's season ended (D-424): in its first days, from their hour, if they played since it began
    const day = Number(today.slice(8, 10));
    const month = sumarDias(`${today.slice(0, 7)}-01`, -1).slice(0, 7);
    if (day <= SEASON_DAYS && seasonsDone.includes(month) && hour >= (q.h ?? 9) && Number.isInteger(q.u) && q.u >= numDia(`${month}-01`)) {
      const n = { title: T.avTitulo, body: fmt(SEASON_TEXT[lang], { mes: monthName(month, lang) }), url: `${SITE}?recap=season&notif=dailyseason${lang === 'es' ? '' : `&lang=${lang}`}`, tag: 'uad-temporada' };
      if (!already[`temporada:${month}`]) { out.push({ subId, kind: 'temporada', key: `temporada:${month}`, notification: n }); continue; }
    }
    // The week, on Mondays: only if they played any day the week before
    const monday = new Date(`${today}T12:00:00Z`).getUTCDay() === 1;
    const lastWeek = semanaDe(sumarDias(today, -7));
    if (q.w !== false && monday && hour >= (q.h ?? 9) && q.sp === lastWeek && q.sn > 0) {
      if (one('semana', `semana:${lastWeek}`, fmt(T.avSemana, { n: q.sn }))) continue;
    }
    // Today's: from their hour, if they have not played; after 14 days without playing, every other day
    if (q.d !== false && !playedToday && hour >= (q.h ?? 9) && !(idle >= CALM_DAYS && todayN % 2)) {
      // The streak, only of 2 or more, like the streak notification: "Racha: 1 días" is not said (U-6)
      one('dia', `dia:${todayN}`, c >= 2 ? fmt(T.avDia, { n: numeroDel(today), c }) : fmt(T.avDiaSin, { n: numeroDel(today) }));
    }
  }
  return out;
}

/** What was sent more than a week ago: it gets cleaned. */
export function stale(sent = {}, now) {
  const out = [];
  for (const [subId, byKey] of Object.entries(sent || {})) {
    for (const [key, t] of Object.entries(byKey || {})) if (typeof t !== 'number' || now - t > 8 * 864e5) out.push(`pushEnviadosDia/${subId}/${key}`);
  }
  return out;
}

export { fechaDeNum };
