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

/**
 * How a campaign did (D-461), from the day's counters `splash/<id>/<event>` (splash.js) in
 * `stats/<env>/days/<day>`, over the UTC days `from`…`to`. A campaign can be switched off and on
 * again, so its exposure is the days it was actually shown, not the calendar: `exposed` counts the
 * days with at least one window, and each day carries its exposure index `n` (1 = its first day
 * shown, gaps not counted). Days in between with nothing shown are kept, `off`, so the gap is seen.
 *
 * - reach: phones that saw it for the first time (unique phones); shown: windows opened.
 * - play / close: taps on its link, and closes; `rest` of the windows got neither (the tab was left).
 * - ctr: play over reach. coverage: windows over home page views on its days (`vistas/inicio`).
 * - start / finish (D-466): after a tap, a game started and finished in that tab; startRate and
 *   finishRate are over taps, conversion is finishes over reach.
 * - dwell: of the windows answered, how many stayed open 3 s or more, and 10 s or more.
 * - early / late: reach per exposed day in its first 3 days shown and after them; halfDays: how many
 *   days shown it took to gather half its reach. Together they say whether it is still finding new
 *   phones or already reached the ones that come. `clipped` says it was already showing on `from`:
 *   then its days count from the range, not from its real start.
 */
export const EARLY_DAYS = 3;
export function campaignStats(days, id, { from, to }) {
  const rows = [];
  for (let d = from; d <= to; d++) {
    const c = days?.[d]?.splash?.[id] || {};
    const v = k => Number(c[k]) || 0;
    rows.push({ day: d, shown: v('shown'), reach: v('reach'), play: v('play'), close: v('close'), start: v('start'), finish: v('finish'), t0: v('t0'), t1: v('t1'), t2: v('t2'), home: Number(days?.[d]?.vistas?.inicio) || 0 });
  }
  const first = rows.findIndex(r => r.shown || r.reach || r.play || r.close);
  if (first < 0) return null;
  let last = rows.length - 1;
  while (last > first && !(rows[last].shown || rows[last].play || rows[last].close)) last--;
  let n = 0;
  const series = rows.slice(first, last + 1).map(r => (r.shown ? { ...r, n: ++n, off: false } : { ...r, n: null, off: true }));
  const sum = k => series.reduce((s, r) => s + r[k], 0);
  const t = { shown: sum('shown'), reach: sum('reach'), play: sum('play'), close: sum('close'), start: sum('start'), finish: sum('finish'), t0: sum('t0'), t1: sum('t1'), t2: sum('t2') };
  const home = series.filter(r => !r.off).reduce((s, r) => s + r.home, 0);
  const answered = t.t0 + t.t1 + t.t2;
  const on = series.filter(r => !r.off);
  const early = on.slice(0, EARLY_DAYS), late = on.slice(EARLY_DAYS);
  const avg = list => (list.length ? list.reduce((s, r) => s + r.reach, 0) / list.length : null);
  let acc = 0;
  const half = t.reach ? on.findIndex(r => (acc += r.reach) * 2 >= t.reach) + 1 : null;
  const ratio = (a, b) => (b ? a / b : null);
  return {
    id, series, ...t, exposed: on.length, firstDay: series[0].day, lastDay: series.at(-1).day,
    // Shown on the range's first day: it may have started before, so its day numbers count from the range
    clipped: first === 0,
    rest: Math.max(0, t.shown - t.play - t.close),
    ctr: ratio(t.play, t.reach), closeRate: ratio(t.close, t.reach), perPhone: ratio(t.shown, t.reach),
    // Conversion (D-466): of the taps, how many started a game and finished it; and finished over reach
    startRate: ratio(t.start, t.play), finishRate: ratio(t.finish, t.play), conversion: ratio(t.finish, t.reach),
    coverage: ratio(t.shown, home), stay3: ratio(t.t1 + t.t2, answered), stay10: ratio(t.t2, answered),
    early: avg(early), late: avg(late), halfDays: half || null,
  };
}
