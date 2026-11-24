/**
 * 🎖️ Profile (D-615): how many open the player profile, who, what they use there, and whether it moves
 * signing in and coming back. Pure, for node (`profile-report.test.mjs`); panel.js draws it.
 *
 * Reads the Pacific days (`toPacificDays`): `perfil/<event>` (profile-usage.js' EVENTS), `perfilIds/<id>`
 * (browsers that opened it) and `activos/<id>` (every active browser); the named `perfilUso/<jid>/<YYYY-MM-DD>`;
 * and the players created by day (`jugadores/<jid>/at`, read by the owner).
 */
const DAY = 864e5;

/** The profile went live for everyone on 2026-11-23 03:33 UTC (flag profile): the evening of 2026-11-22, Pacific. */
export const LAUNCH_MS = Date.UTC(2026, 10, 23, 3, 33);
/** The Pacific day number of a `YYYY-MM-DD`. */
export const dayNum = s => Math.floor(Date.parse(`${s}T00:00:00Z`) / DAY);
export const dayStr = d => new Date(d * DAY).toISOString().slice(0, 10);
/** The launch's Pacific day: half before and half after, so left out of both sides. */
export const LAUNCH_DAY = dayNum(new Date(LAUNCH_MS - 8 * 3600e3).toISOString().slice(0, 10));

const sum = xs => xs.reduce((a, b) => a + b, 0);
const ids = o => Object.keys(o || {});
const inRange = (pt, from, to) => Object.keys(pt || {}).map(Number).filter(d => d >= from && d <= to).sort((a, b) => a - b);

/** The events of the profile, summed over [from, to]. */
export function eventTotals(pt, { from, to }) {
  const out = {};
  for (const d of inRange(pt, from, to)) for (const [k, v] of Object.entries(pt[d].perfil || {})) out[k] = (out[k] || 0) + (Number(v) || 0);
  return out;
}

/** Distinct browsers that opened the profile in [from, to], and distinct active browsers. */
export function distinct(pt, { from, to }) {
  const vis = new Set(), act = new Set();
  for (const d of inRange(pt, from, to)) { ids(pt[d].perfilIds).forEach(x => vis.add(x)); ids(pt[d].activos).forEach(x => act.add(x)); }
  return { browsers: vis.size, active: act.size, share: act.size ? vis.size / act.size : null };
}

/**
 * Day by day in [from, to]: profile visits (guests and players), browsers that opened it, active browsers
 * and the share of them. Every day of the range, empty ones too.
 */
export function pulseByDay(pt, { from, to }) {
  const out = [];
  for (let d = from; d <= to; d++) {
    const x = pt?.[d] || {}, e = x.perfil || {};
    const browsers = ids(x.perfilIds).length, active = ids(x.activos).length;
    out.push({ day: d, visits: (e['visit-guest'] || 0) + (e['visit-signed'] || 0), guests: e['visit-guest'] || 0, signed: e['visit-signed'] || 0,
      browsers, active, share: active ? browsers / active : null });
  }
  return out;
}

/** The pulse of a range against the one before: visits, browsers, share of active ones. */
export function pulse(pt, rango, antes) {
  const now = eventTotals(pt, rango), prev = eventTotals(pt, antes);
  const v = t => (t['visit-guest'] || 0) + (t['visit-signed'] || 0);
  return { visits: v(now), visitsPrev: v(prev), signed: now['visit-signed'] || 0, guests: now['visit-guest'] || 0,
    ...distinct(pt, rango), prev: distinct(pt, antes) };
}

export const VIAS = [['via-pill', 'The top bar\'s pill'], ['via-bubble', 'The pill\'s bubble'], ['via-window', 'An achievement window\'s «Ver mis logros»'], ['via-link', 'A link on the site'], ['via-direct', 'Straight in (typed, a bookmark, outside)']];
export const USES = [['tab-badges', '🎖️ Badges tab'], ['tab-rankings', '🏅 Rankings tab'], ['tab-settings', '⚙️ Settings tab'], ['peek', '👀 Another player\'s sheet'], ['public', '🪞 «Ver cómo me ven los demás»'], ['aw-shown', '🏆 Achievement window shown'], ['aw-go', '👉 «Ver mis logros» tapped'], ['signin-start', '🔐 Sign-in started on the profile']];

/** The named fields (profile-usage.js FIELDS) and their column names. */
export const COLUMNS = [['v', 'Visits'], ['b', '🎖️'], ['r', '🏅'], ['s', '⚙️'], ['p', '👀'], ['o', '🪞'], ['w', '🏆→'], ['i', 'Signed in here'], ['c', 'Created here']];

/**
 * Who used it, from `perfilUso`: one row per player with a visit in [from, to] (Pacific day numbers), their first
 * and last day ever, days with a visit in the range and each field summed in the range. Most recent first.
 */
export function whoRows(uso, names = {}, { from = -Infinity, to = Infinity } = {}) {
  const rows = [];
  for (const [jid, days] of Object.entries(uso || {})) {
    const all = Object.keys(days || {}).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
    if (!all.length) continue;
    const here = all.filter(k => { const d = dayNum(k); return d >= from && d <= to; });
    if (!here.length) continue;
    const r = { jid, name: names[jid] || jid, first: all[0], last: all.at(-1), days: here.filter(k => days[k]?.v).length };
    for (const [c] of COLUMNS) r[c] = sum(here.map(k => Number(days[k]?.[c]) || 0));
    rows.push(r);
  }
  return rows.sort((a, b) => (a.last < b.last ? 1 : a.last > b.last ? -1 : b.v - a.v));
}

/** Accounts per day: created (from the players' `at`, every place) and the counters split by place, where they exist. */
export function accountsByDay(pt, players, { from, to }, pacificDay) {
  const created = {};
  for (const p of Object.values(players || {})) if (Number.isFinite(p?.at)) { const d = pacificDay(p.at); created[d] = (created[d] || 0) + 1; }
  const out = [];
  for (let d = from; d <= to; d++) {
    const e = pt?.[d]?.perfil || {};
    out.push({ day: d, created: created[d] || 0, createProfile: e['create-profile'] || 0, createOther: e['create-other'] || 0,
      signinProfile: e['signin-profile'] || 0, signinOther: e['signin-other'] || 0, counted: !!pt?.[d]?.perfil });
  }
  return out;
}

/**
 * Before and after the launch, per day on average, over the same number of whole days on each side (at most
 * `span`), leaving the launch day out. `today` is not whole: left out too. Null on a side with no day.
 */
export function beforeAfter(rows, { today, span = 28, launch = LAUNCH_DAY } = {}) {
  const after = rows.filter(r => r.day > launch && r.day < today).slice(0, span);
  const n = after.length || Math.min(span, 14);
  const before = rows.filter(r => r.day < launch && r.day >= launch - n);
  const avg = (xs, k) => (xs.length ? sum(xs.map(r => r[k] || 0)) / xs.length : null);
  const side = xs => ({ days: xs.length, created: avg(xs, 'created'), createProfile: avg(xs, 'createProfile'), createOther: avg(xs, 'createOther'),
    signinProfile: avg(xs, 'signinProfile'), signinOther: avg(xs, 'signinOther') });
  return { before: side(before), after: side(after) };
}

/**
 * Coming back: of the browsers active on day d, those that opened the profile and those that did not, how many
 * were active again the next day, and within the next 7. Only days whose window is over (before `today`).
 */
export function returns(pt, { from, to, today }) {
  const t = { v1: [0, 0], n1: [0, 0], v7: [0, 0], n7: [0, 0] };
  const act = d => pt?.[d]?.activos || {};
  for (let d = from; d <= to; d++) {
    const a = ids(act(d));
    if (!a.length) continue;
    const vis = pt?.[d]?.perfilIds || {};
    for (const id of a) {
      const v = id in vis ? 'v' : 'n';
      if (d + 1 < today) { t[`${v}1`][1]++; if (id in act(d + 1)) t[`${v}1`][0]++; }
      if (d + 7 < today) {
        t[`${v}7`][1]++;
        for (let k = 1; k <= 7; k++) if (id in act(d + k)) { t[`${v}7`][0]++; break; }
      }
    }
  }
  const r = ([a, b]) => ({ back: a, of: b, rate: b ? a / b : null });
  return { visitors: { next: r(t.v1), week: r(t.v7) }, others: { next: r(t.n1), week: r(t.n7) } };
}

/** The first Pacific day with profile counters, or null: before it nothing was recorded. */
export function countedSince(pt) {
  const ds = Object.keys(pt || {}).map(Number).filter(d => pt[d]?.perfil || pt[d]?.perfilIds);
  return ds.length ? Math.min(...ds) : null;
}
