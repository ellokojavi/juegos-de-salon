/**
 * 🗼 Babel — the engine (out of the lab, D-445, into La Copa, Uno al día and its own page): a slab
 * slides over the tower, a tap drops it, and whatever hangs over the edge is cut off. Pure functions,
 * no DOM.
 *
 * Fair on every phone: where the sliding slab is depends only on the time since it appeared, never on
 * how many frames were drawn. A drop is judged at the moment of the tap (the event's own timestamp),
 * so a 60 Hz and a 120 Hz screen play the same game.
 *
 * Units: the tower's base is 1 × 1; a slab is SLAB tall. A slab is { x, z, w, d }: its center and its
 * size along x and along z.
 *
 * La Copa's interface is at the end: `generarDia`, `puntaje` and `tarjeta`. A finished game, as the
 * screen (ui.js) saves it and hands it to the cup, is
 * `{ fin: true, n, perfects, best, kinds, ms, tope }`: blocks placed, perfect drops, longest perfect
 * streak, each block's kind ('perfect' | 'cut'), the playing time without pauses, and the trial's cap.
 */

export const BASE = 1;                 // the base's side
export const SLAB = 0.12;              // a slab's height
export const RANGE = 1.5;              // how far from the tower's center the slab swings, each way
export const PERFECT = 0.035;          // a drop this close to the slab below is perfect: nothing is cut
export const GROW_FROM = 4;            // from the 4th perfect in a row, each perfect grows the slab back…
export const GROW = 0.05;              // …by this much, up to the base's side
export const SPEED_START = 1.25;       // units a second, on the first slab
export const SPEED_STEP = 0.025;       // faster with each slab placed…
export const SPEED_MAX = 2.6;          // …up to this

/** How fast the slab on level `n` (0 = the first one dropped) slides, in units a second. */
export const speed = n => Math.min(SPEED_MAX, SPEED_START + n * SPEED_STEP);

/** The axis a level slides along: the first along x, then z, then x… */
export const axisOf = n => (n % 2 === 0 ? 'x' : 'z');
const sizeKey = axis => (axis === 'x' ? 'w' : 'd');

/** A new game: the base, and the first slab sliding in from `t0` (ms). */
export function newGame(t0 = 0) {
  const g = { slabs: [{ x: 0, z: 0, w: BASE, d: BASE }], combo: 0, perfects: 0, best: 0, over: false, moving: null };
  spawn(g, t0);
  return g;
}

/** The score: the slabs placed on the base. */
export const score = g => g.slabs.length - 1;

/** The slab on top of the tower. */
export const top = g => g.slabs[g.slabs.length - 1];

function spawn(g, t0) {
  const n = score(g), axis = axisOf(n), below = top(g);
  g.moving = { ...below, axis, t0, level: n };
}

/**
 * Where the sliding slab's center is, along its axis, at time `t` (ms): it comes in from −RANGE, goes
 * to +RANGE and back, again and again, at its level's speed.
 */
export function offsetAt(m, t) {
  const travel = 2 * RANGE;
  const dist = Math.max(0, t - m.t0) / 1000 * speed(m.level);
  const phase = dist % (2 * travel);
  return phase < travel ? -RANGE + phase : RANGE - (phase - travel);
}

/** The sliding slab as it is at time `t`: a slab, moved along its axis. */
export function movingAt(g, t) {
  const m = g.moving, below = top(g);
  return { ...m, [m.axis]: below[m.axis] + offsetAt(m, t) };
}

/**
 * Drops the sliding slab at time `t` (ms). Returns what happened:
 * - `{ kind: 'perfect', slab, grew }`: within PERFECT of the slab below, it lands exactly on it (and,
 *   from GROW_FROM perfects in a row, a little bigger on each side that was cut);
 * - `{ kind: 'cut', slab, piece }`: it lands on the overlap, and `piece` is what was cut off and falls;
 * - `{ kind: 'miss', piece }`: it missed the tower: the game is over and the whole slab falls.
 */
export function drop(g, t) {
  if (g.over) return null;
  const m = movingAt(g, t), below = top(g), axis = m.axis, k = sizeKey(axis);
  const delta = m[axis] - below[axis], size = below[k];
  let r;
  if (Math.abs(delta) <= PERFECT) {
    g.combo++; g.perfects++;
    // Growing back: both sides, toward the base, whichever was cut
    const grew = g.combo >= GROW_FROM && (below.w < BASE || below.d < BASE);
    const slab = { x: below.x, z: below.z, w: below.w, d: below.d };
    if (grew) { slab.w = Math.min(BASE, slab.w + GROW); slab.d = Math.min(BASE, slab.d + GROW); }
    r = { kind: 'perfect', slab, grew };
  } else if (Math.abs(delta) >= size) {
    g.combo = 0; g.over = true; g.moving = null;
    return { kind: 'miss', piece: { x: m.x, z: m.z, w: m.w, d: m.d } };
  } else {
    g.combo = 0;
    const kept = size - Math.abs(delta), cut = Math.abs(delta), sign = Math.sign(delta);
    const slab = { x: below.x, z: below.z, w: below.w, d: below.d };
    slab[axis] = below[axis] + delta / 2; slab[k] = kept;
    const piece = { x: m.x, z: m.z, w: m.w, d: m.d };
    piece[axis] = below[axis] + sign * (size / 2 + cut / 2); piece[k] = cut;
    r = { kind: 'cut', slab, piece };
  }
  g.best = Math.max(g.best, g.combo);
  g.slabs.push(r.slab);
  spawn(g, t);
  return r;
}

/**
 * A pause of `ms` (the page hidden by a call, another app, the screen locked): the sliding slab's clock
 * moves forward by that much, so it comes back exactly where it was, at the same speed. Pausing gives no
 * advantage: the slab is frozen, not slowed.
 */
export function pause(g, ms) {
  if (g.moving && ms > 0) g.moving.t0 += ms;
}

/**
 * When, from `t` on, the sliding slab is exactly over the slab below (for the end-to-end script and
 * the cover's demo): the next time its offset crosses zero.
 */
export function perfectTime(g, t) {
  const m = g.moving, s = speed(m.level) / 1000, travel = 2 * RANGE, cycle = 2 * travel / s;
  const base = m.t0 + Math.floor(Math.max(0, t - m.t0) / cycle) * cycle;
  // Zero is crossed at RANGE (going out) and at travel + RANGE (coming back) along each cycle
  for (const k of [0, 1]) for (const at of [RANGE, travel + RANGE]) {
    const when = base + k * cycle + at / s;
    if (when >= t) return when;
  }
  return t;
}

/** The share card's line: the tower in blocks, a 🟩 a perfect drop, a 🟨 a cut one, ten to a line at most. */
export function card(kinds) {
  const last = kinds.slice(-20).map(k => (k === 'perfect' ? '🟩' : '🟨'));
  const rows = [];
  for (let i = 0; i < last.length; i += 10) rows.push(last.slice(i, i + 10).join(''));
  return rows.reverse().join('\n');
}

/* ------------------------------------------------------------------ */
/* La Copa                                                            */
/* ------------------------------------------------------------------ */

/**
 * The trial (D-103) ends after this many blocks, placed without missing: long enough to feel the
 * slide, the cut and a perfect drop, short enough not to tire before the real game.
 */
export const BLOQUES_ENSAYO = 8;
/** Each block is worth 1 point, and a perfect drop 1 more: height and precision weigh the same. */
export const PUNTOS_BLOQUE = 1;
export const PUNTOS_PERFECTA = 1;

/**
 * The day's game. Every game starts the same (nothing is random: the slide only depends on the time),
 * so the code and the day only name it; `semilla` is kept for anything seeded later, which must use
 * `hash32` (../semilla.js) on it. `tope` is the trial's cap of blocks (null: until the tower is missed).
 */
export function generarDia(codigo, dia, { variante = null, sal = '', ensayo = false, lang } = {}) {
  return { semilla: `${codigo}:${dia}${sal ? `:${sal}` : ''}`, ensayo: !!ensayo, tope: ensayo ? BLOQUES_ENSAYO : null, variante, lang };
}

/** The blocks of a finished (or saved) game. */
const bloques = e => Math.max(0, Math.floor(Number(e?.n) || 0));

/** The perfect drops of a finished (or saved) game, never more than its blocks. */
const perfectas = e => Math.min(bloques(e), Math.max(0, Math.floor(Number(e?.perfects) || 0)));

/**
 * The score, 0 to 100: blocks + perfect drops (a cut block 1 point, a perfect one 2), up to 100.
 * Height and precision weigh the same, and precision only counts while the tower grows: 100 takes
 * 50 perfect blocks, or a taller tower with fewer. The longest streak does not add: it already pays
 * in height (from GROW_FROM in a row the slab grows back) and one slip would erase a good game.
 */
export const puntaje = e => Math.min(100, PUNTOS_BLOQUE * bloques(e) + PUNTOS_PERFECTA * perfectas(e));

/** The share card: the tower's last twenty blocks (🟩 perfect, 🟨 cut), and 💥 if none was placed. */
export function tarjeta(e) {
  const kinds = Array.isArray(e?.kinds) ? e.kinds : [];
  return kinds.length ? card(kinds) : '💥';
}
