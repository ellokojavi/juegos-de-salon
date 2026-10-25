/**
 * Stick Ninja — the engine of the lab prototype (D-446), inspired by Stick Hero (Ketchapp, 2014): hold to
 * stretch a stick, let go and it falls across the gap; land it on the next pillar and the ninja runs over.
 * Pure functions, no DOM.
 *
 * Fair on every phone: the stick's length depends only on how long the finger was held (the press's and
 * the release's own timestamps), and where the running ninja is depends only on the time since the stick
 * fell, never on how many frames were drawn.
 *
 * Fair between players: the course (the pillars, the gaps, the stars) comes from a seed, and the page
 * seeds it with the day, so everyone who plays today crosses the same gaps.
 *
 * Units: the screen is VIEW wide; x grows to the right and a pillar is { x, w, star? }: its left edge, its
 * width, and the x of the star hanging in the gap before it, if there is one.
 */
import { rng } from '../../assets/js/rng.js';

export const VIEW = 360;              // the screen's width, in world units
export const HOLD_X = 92;             // where the current pillar's right edge sits on the screen
export const GROW = 330;              // the stick grows this many units a second while held…
export const MAX_STICK = 460;         // …up to this
export const PERFECT = 4.5;           // a tip this close to the next pillar's center is perfect (the flag)
export const MAX_BONUS = 5;           // a perfect is worth +1, +2… for each one in a row, up to this
export const TURN_MS = 320;           // the stick takes this long to fall across
export const RUN = 310;               // the ninja runs this many units a second
export const NINJA = 18;              // the ninja's width
export const FIRST = { x: 0, w: 84 }; // the starting pillar

const half = NINJA / 2;
const right = p => p.x + p.w;

/** The day's seed: the same number for everyone who plays on that date (yyyy-mm-dd). */
export function daySeed(date) {
  let h = 2166136261;
  for (const ch of `stick:${date}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** A new game on the course of `seed`. */
export function newGame(seed = 1) {
  return {
    seed, rand: rng(seed), pillars: [{ ...FIRST }], i: 0,
    score: 0, bridges: 0, perfects: 0, bonus: 0, stars: 0, streak: 0, bestStreak: 0,
    phase: 'ready',        // ready → growing → walking → ready…, or over; 'held' when paused mid-hold
    hold: null, held: 0, stick: 0, walk: null, kinds: [],
  };
}

/** How hard pillar `k` is: 0 at the start, 1 from the 45th on. */
const hardness = k => Math.min(1, k / 45);

/** Pillar `k` of the course, made the first time it is asked for: always in the same order, so a seed is a course. */
export function pillar(g, k) {
  while (g.pillars.length <= k) {
    const n = g.pillars.length, prev = g.pillars[n - 1], d = hardness(n), r = g.rand;
    const w = Math.round(16 + (1 - d) * 38 + r() * (34 - d * 14));
    // The whole next pillar always fits on the screen, with a little room to spare
    const room = VIEW - HOLD_X - 14 - w;
    const gap = Math.round(Math.min(room, 34 + r() * (110 + d * 120)));
    const p = { x: right(prev) + gap, w };
    // Now and then a star hangs in a wide gap, under the bridge's line
    const s = r();
    if (n > 2 && gap >= 70 && s < 0.38) p.star = Math.round(right(prev) + gap * (0.32 + r() * 0.36));
    g.pillars.push(p);
  }
  return g.pillars[k];
}

/** The pillar the ninja stands on, and the one to reach. */
export const current = g => pillar(g, g.i);
export const next = g => pillar(g, g.i + 1);

/** Where the ninja's center stands, at rest, on pillar `p`: at its right edge. */
export const restX = p => right(p) - half - 1;

/** The stick's length at moment `t` (ms): it grows while held, and stays as it was once let go. */
export function stickAt(g, t) {
  if (g.phase === 'growing') return Math.min(MAX_STICK, g.held + Math.max(0, t - g.hold) * GROW / 1000);
  return g.phase === 'held' ? g.held : g.stick;
}

/** A finger down at `t`: the stick starts growing (or goes on growing, after a pause in the middle of a hold). */
export function press(g, t) {
  if (g.phase !== 'ready' && g.phase !== 'held') return false;
  if (g.phase === 'ready') g.held = 0;
  g.phase = 'growing'; g.hold = t;
  return true;
}

/** The page was hidden in the middle of a hold: the stick stops where it was, and a new press goes on from there. */
export function suspend(g, t) {
  if (g.phase !== 'growing') return;
  g.held = stickAt(g, t); g.phase = 'held';
}

/**
 * The finger up at `t`: the stick falls. Returns what will happen when it lands:
 * - `perfect`: its tip lands within PERFECT of the next pillar's center (on its flag);
 * - `land`: on the next pillar;
 * - `short` or `long`: in the gap, or past the pillar: the ninja runs to the tip and falls.
 * The ninja starts running when the stick is down (TURN_MS later).
 */
export function release(g, t) {
  if (g.phase !== 'growing') return null;
  const len = stickAt(g, t), cur = current(g), nx = next(g), tip = right(cur) + len;
  const center = nx.x + nx.w / 2;
  const kind = tip < nx.x ? 'short' : tip > right(nx) ? 'long' : Math.abs(tip - center) <= PERFECT ? 'perfect' : 'land';
  const ok = kind === 'perfect' || kind === 'land';
  g.stick = len; g.phase = 'walking';
  g.walk = {
    t0: t + TURN_MS, from: restX(cur), to: ok ? restX(nx) : tip, kind, tip, ok,
    wall: nx.x - half,                 // upside down, the ninja hits the next pillar here
    star: nx.star ?? null, flips: [], starTaken: false, done: false,
  };
  return { kind, len, tip, offset: tip - center };
}

/** The x of the running ninja's center at `t`. */
export function runX(w, t) {
  return w.from + Math.min(w.to - w.from, Math.max(0, (t - w.t0) / 1000 * RUN));
}
/** When the running ninja's center reaches `x`. */
const timeAt = (w, x) => w.t0 + (x - w.from) / RUN * 1000;
/** Whether the ninja hangs under the bridge at `t`: each flip, before `t`, turns it over. */
export const upsideAt = (w, t) => w.flips.filter(f => f <= t).length % 2 === 1;

/**
 * A tap while running, at `t`: the ninja flips under the bridge (or back on top). Only while it is over
 * the gap: once it reaches the pillar, or before it starts running, a tap does nothing.
 */
export function flip(g, t) {
  const w = g.walk;
  if (g.phase !== 'walking' || !w || w.done || t < w.t0) return false;
  const x = runX(w, t);
  if (x >= Math.min(w.to, w.ok ? w.wall : w.to) || x >= w.to) return false;
  w.flips.push(t);
  return true;
}

/**
 * Moves the game on to moment `t` and says what happened since the last call, in order:
 * `{ type: 'star' }` (the ninja grabbed the gap's star, hanging under the bridge), `{ type: 'crash' }`
 * (it was still upside down when it reached the next pillar: the game is over), `{ type: 'fall' }` (the
 * stick missed: it ran to the tip and fell), or `{ type: 'arrive', kind, gain, bonus, streak }` (it is on
 * the next pillar: a point, and a perfect's bonus).
 * Everything follows from the flips' and the release's timestamps, so it does not matter how often it is called.
 */
export function advance(g, t) {
  const w = g.walk, out = [];
  if (g.phase !== 'walking' || !w || w.done) return out;
  const crashAt = w.ok && w.flips.length && upsideAt(w, timeAt(w, w.wall)) ? timeAt(w, w.wall) : Infinity;
  const end = Math.min(crashAt, timeAt(w, w.to));
  if (w.star != null && !w.starTaken && w.star >= w.from && w.star <= w.to) {
    const ts = timeAt(w, w.star);
    if (ts <= t && ts <= end && upsideAt(w, ts)) { w.starTaken = true; g.stars++; g.score++; out.push({ type: 'star' }); }
  }
  if (t < end) return out;
  w.done = true;
  if (crashAt <= end && crashAt !== Infinity) { over(g, 'crash'); out.push({ type: 'crash' }); return out; }
  if (!w.ok) { over(g, w.kind); out.push({ type: 'fall', kind: w.kind }); return out; }
  g.i++; g.bridges++;
  let bonus = 0;
  if (w.kind === 'perfect') { g.streak++; g.perfects++; bonus = Math.min(g.streak, MAX_BONUS); g.bonus += bonus; } else g.streak = 0;
  g.bestStreak = Math.max(g.bestStreak, g.streak);
  g.score += 1 + bonus;
  g.kinds.push(w.kind);
  g.phase = 'ready'; g.stick = 0; g.held = 0;
  out.push({ type: 'arrive', kind: w.kind, gain: 1 + bonus, bonus, streak: g.streak, star: w.starTaken });
  return out;
}

function over(g, kind) { g.phase = 'over'; g.kinds.push(kind === 'crash' ? 'crash' : 'fall'); }

/** When the ninja is done with this walk (it arrived, fell or crashed): for the page's animation. */
export function walkEnd(g) {
  const w = g.walk;
  if (!w) return 0;
  const crash = w.ok && upsideAt(w, timeAt(w, w.wall)) ? timeAt(w, w.wall) : Infinity;
  return Math.min(crash, timeAt(w, w.to));
}

/** A pause of `ms` while the ninja runs: its clock and its flips move forward by that much, so it comes back where it was. */
export function pause(g, ms) {
  const w = g.walk;
  if (g.phase !== 'walking' || !w || ms <= 0) return;
  w.t0 += ms; w.flips = w.flips.map(f => f + ms);
}

/** How long to hold for a stick whose tip lands `offset` from the next pillar's center (the demo and the end-to-end script). */
export function holdFor(g, offset = 0) {
  const cur = current(g), nx = next(g);
  return (nx.x + nx.w / 2 + offset - right(cur)) / GROW * 1000;
}

/** When the running ninja is right over the gap's star (the demo and the end-to-end script), or null. */
export function starTime(g) {
  const w = g.walk;
  return w && w.star != null ? timeAt(w, w.star) : null;
}

/** The share card's line: each bridge a 🎯 perfect or a 🟩, then how it ended; the last 20, ten to a line. */
export function card(kinds) {
  const last = kinds.slice(-20).map(k => ({ perfect: '🎯', land: '🟩', crash: '💥', fall: '🕳️' }[k] || '🟩'));
  const rows = [];
  for (let i = 0; i < last.length; i += 10) rows.push(last.slice(i, i + 10).join(''));
  return rows.join('\n');
}
