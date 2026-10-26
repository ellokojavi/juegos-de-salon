/**
 * 📣 Campaigns (D-454): the splash campaigns (splash.js, D-351) as the panel runs them from a phone.
 * The campaigns are made in a PR (texts, clips); here they are only switched on or off, given a
 * start and an end day and put in order. What is saved is Firebase `splash/<id>`, which the home
 * page reads on each visit (`fromRemote` in splash.js).
 *
 * Pure and without a DOM, so node tests it (`node public/panel/campaigns.test.mjs`). Days are
 * 'YYYY-MM-DD' strings, compared as text, and `today` is one of them: the player's own day decides
 * on the phone, so the panel shows the owner's.
 */

const DAY = 86400000;
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Today, or `n` days from it, as 'YYYY-MM-DD' in this device's time. */
export const dayPlus = (today, n) => { const [y, m, d] = today.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
export const todayOf = (now = Date.now()) => iso(new Date(now));

/**
 * The switches the panel edits: Firebase's when it has them; before the first save, ACTIVE's (in
 * its order, on) and every other campaign off. Each: { id, on, order, from, until }, one per
 * campaign of CAMPAIGNS, in order (the ones on first).
 */
export function switches({ remote, active = [], campaigns = {} }) {
  const ids = Object.keys(campaigns);
  const saved = remote && typeof remote === 'object' ? remote : null;
  const rows = ids.map((id, i) => {
    if (saved) {
      const c = saved[id] || {};
      return { id, on: c.on === true, order: Number.isFinite(c.order) ? c.order : 1000 + i, from: c.from || null, until: c.until || null };
    }
    const k = active.findIndex(a => a.id === id);
    return { id, on: k >= 0, order: k >= 0 ? k : 1000 + i, from: active[k]?.from || null, until: active[k]?.until || null };
  });
  return rows.sort((a, b) => a.order - b.order || ids.indexOf(a.id) - ids.indexOf(b.id));
}

/** Where a campaign stands today: 'off', 'scheduled' (its start is ahead), 'live' or 'ended'. */
export function status(s, today) {
  if (!s.on) return 'off';
  if (s.from && today < s.from) return 'scheduled';
  if (s.until && today > s.until) return 'ended';
  return 'live';
}

/**
 * Days in the next `days` (from today) when two or more campaigns are on together: each run of
 * days with the same set, as { from, to, ids } in the queue's order. A player who has seen none
 * gets the first on one visit and the next on the following one (D-430, D-431).
 */
export function overlaps(rows, today, days = 60) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const day = dayPlus(today, i);
    const ids = rows.filter(s => status(s, day) === 'live').map(s => s.id);
    const last = out[out.length - 1];
    if (ids.length < 2) continue;
    if (last && last.ids.join() === ids.join() && dayPlus(last.to, 1) === day) last.to = day;
    else out.push({ from: day, to: day, ids });
  }
  return out;
}

/** The rows with `id` moved one place up (-1) or down (+1), and every order renumbered 0…n. */
export function move(rows, id, dir) {
  const list = [...rows];
  const i = list.findIndex(s => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list.map((s, k) => ({ ...s, order: k }));
  [list[i], list[j]] = [list[j], list[i]];
  return list.map((s, k) => ({ ...s, order: k }));
}

/** What is written to Firebase `splash/`: every campaign, its switch and its days (no empty fields). */
export function toRemote(rows, at = Date.now()) {
  return Object.fromEntries(rows.map((s, k) => [s.id, {
    on: !!s.on, order: k, at,
    ...(s.from ? { from: s.from } : {}),
    ...(s.until ? { until: s.until } : {}),
  }]));
}

/** A bar for the strip of the next `days`: the first and last day index it covers, or null. */
export function span(s, today, days) {
  if (!s.on) return null;
  const last = dayPlus(today, days - 1);
  const a = s.from && s.from > today ? s.from : today;
  const b = s.until && s.until < last ? s.until : last;
  if (a > b) return null;
  const idx = d => Math.round((Date.parse(`${d}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / DAY);
  return { start: idx(a), end: idx(b), open: !s.until || s.until > last };
}
