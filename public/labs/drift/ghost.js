/**
 * Drift: the ghost (the owner, 2026-11-27: «seguir la mejor versión de uno mismo … el récord actual de
 * uno, como fantasma»; docs/rally/core.md §9). This phase races your own record on this phone: every
 * clean run is recorded, and the best one on each circuit comes back as a translucent car that drives
 * its line, with the gap to it on the clock. Racing the next one up the ranking, and the leader's ghost
 * made 1 % faster, come with the ranking (they need the runs uploaded).
 *
 * A run is recorded as the car's pose every SAMPLE_MS of the race clock (`g.t`, which leaves out the
 * penalty seconds): x, y, heading, height and progress along the lap. Poses, not the thumb's inputs, so
 * a ghost stays right when the car's handling is tuned. It is kept per circuit, with the circuit's
 * length, so a circuit drawn again drops its old ghost. A real player's run keeps their profile's name
 * (`name`), drawn over the ghost (ghost-label.js); a simulated driver's ghost (`sim`) has no name.
 *
 *   recorder() → { add(g), ghost(g) }      add a pose each frame; the finished run's ghost
 *   load(trackId, length) / keep(ghost)     the saved record of a circuit (localStorage)
 *   better(ghost, saved)                    whether a run beats the saved one
 *   poseAt(ghost, tMs, pace = 1)            where the ghost is at the race clock tMs (pace 1.01: 1 % faster),
 *                                           with the name to show over it (`ghostName`: none for a simulated driver)
 *   gapAt(ghost, progress, tMs, pace = 1)   seconds behind the ghost (negative: ahead) at this progress
 *   lapProgress(g)                          the car's progress (m), 0 on the start line until the first gate
 */
import { doneShare } from './minimap.js';
import { leerYo } from '../../assets/js/jugador.js';

export const SAMPLE_MS = 100;
/** How far along the lap the car is (m), the start line counted as 0 until the first gate (as the minimap). */
export const lapProgress = g => doneShare(g) * g.track.length;
const KEY = id => `juegos-de-salon:drift:ghost:${id}`;
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;

export function recorder() {
  let s = [], next = 0;
  return {
    /** Adds the car's pose when the race clock has passed the next sample. */
    add(g) {
      if (g.mode !== 'play' && g.mode !== 'done') return;
      while (g.t >= next) {
        const c = g.car;
        s.push(r1(c.x), r1(c.y), r2(c.h), r1((c.e || 0) + Math.max(0, c.z || 0)), r1(lapProgress(g)));
        next += SAMPLE_MS;
      }
    },
    /** The finished run as a ghost: null for a wreck or a run that did not finish. */
    ghost(g) {
      if (g.mode !== 'done' || g.wrecked) return null;
      const name = playerName();
      return { v: 1, track: g.track.id, len: Math.round(g.track.length), time: Math.max(0, Math.round(g.t) + g.penalty - (g.bonus || 0)), clock: Math.round(g.t), s: s.slice(), ...(name ? { name } : {}) };
    },
    reset() { s = []; next = 0; },
  };
}

/** The name of the player on this phone (their profile's), or null. */
export function playerName(storage = globalThis.localStorage) {
  try { const n = leerYo(storage)?.n; return typeof n === 'string' && n.trim() ? n.trim().slice(0, 20) : null; } catch (_) { return null; }
}

/**
 * The name to show over a ghost: a real player's run carries its driver's name; a record kept on this
 * phone before names were kept is this phone's player. A simulated driver's ghost (`sim`) has none.
 */
export function ghostName(ghost, storage = globalThis.localStorage) {
  if (!ghost || ghost.sim) return null;
  return ghost.name || playerName(storage);
}

/** Each ghost's name, worked out once (the scenes ask every frame). */
const names = new WeakMap();
const nameOf = ghost => { if (!names.has(ghost)) names.set(ghost, ghostName(ghost)); return names.get(ghost); };

export function load(trackId, length, storage = globalThis.localStorage) {
  try {
    const o = JSON.parse(storage?.getItem(KEY(trackId)) || 'null');
    return o && o.v === 1 && o.len === Math.round(length) && Array.isArray(o.s) && o.s.length >= 10 ? o : null;
  } catch (_) { return null; }
}

export function keep(ghost, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY(ghost.track), JSON.stringify(ghost)); return true; } catch (_) { return false; }
}

/** A run beats the saved record with a lower official time (the clock plus the penalty seconds). */
export const better = (ghost, saved) => !!ghost && (!saved || ghost.time < saved.time);

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

/** The ghost's pose at the race clock tMs; with pace above 1 it runs that much faster. Past its finish it stays there. */
export function poseAt(ghost, tMs, pace = 1) {
  const s = ghost.s, n = s.length / 5;
  const f = Math.max(0, (tMs * pace) / SAMPLE_MS), i = Math.min(n - 1, Math.floor(f)), j = Math.min(n - 1, i + 1), u = Math.min(1, f - i);
  const a = i * 5, b = j * 5;
  const x = s[a] + (s[b] - s[a]) * u, y = s[a + 1] + (s[b + 1] - s[a + 1]) * u;
  const h = s[a + 2] + wrap(s[b + 2] - s[a + 2]) * u, z = s[a + 3] + (s[b + 3] - s[a + 3]) * u;
  // Its nose follows the slope between the two samples
  const run = Math.hypot(s[b] - s[a], s[b + 1] - s[a + 1]);
  const pitch = run > 0.3 ? -Math.atan2(s[b + 3] - s[a + 3], run) : 0;
  return { x, y, h, z, pitch, done: f >= n - 1, name: nameOf(ghost) };
}

/**
 * How far behind the ghost (s) the car is at this progress: the clock now minus the ghost's clock
 * when it first got this far. Null before the ghost has data for it.
 */
export function gapAt(ghost, progress, tMs, pace = 1) {
  const s = ghost.s, n = s.length / 5;
  let best = -Infinity;
  for (let i = 0; i < n; i++) {
    const p = s[i * 5 + 4];
    if (p > best) best = p;
    // The first sample that reaches this progress (the start line's wrap is before the first gate)
    if (best >= progress && progress > 1) {
      const prev = i ? s[(i - 1) * 5 + 4] : 0, k = p > prev ? (progress - prev) / (p - prev) : 1;
      const tg = (i - 1 + Math.max(0, Math.min(1, k))) * SAMPLE_MS / pace;
      return (tMs - tg) / 1000;
    }
  }
  return null;
}
