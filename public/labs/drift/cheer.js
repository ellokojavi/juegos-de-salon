/**
 * Drift: the crowd comes alive as the car goes by (the owner, 2026-11-27: «agrega movimiento al
 * público y que además puedan lanzar serpentina … una sensación explosiva de alegría»). The same for
 * both views; each scene draws it its own way.
 *
 *   cheer() → { setup(fans, stands), update(car, dt, still), lift(fan, now), excite(x, y), parts }
 *
 * - Every fan jumps, more the nearer the car is (`lift`: metres off the ground, 0 with reduced motion).
 * - A crowd (the fans at one bend, or one grandstand) bursts when the car comes near at speed:
 *   confetti thrown up from its people, fluttering down and turning, and a few streamers whose long
 *   tails follow them. Once per pass: it bursts again only after the car has gone away.
 * - Reduced motion: no jumping, no bursts.
 *
 * Particles live in world metres (x, y on the ground, z up), like the rest of the scenes.
 */
import { CROWD } from './scenery.js';

/** How near (m) the car must be for a crowd to burst, how fast (m/s), and how far it must go to arm it again. */
const BURST_NEAR = 55, BURST_SPEED = 8, REARM = 90;
const MAX_PARTS = 600, TAIL = 12;
export const CONFETTI = [...CROWD.shirts, '#ffffff', '#ffd23f', '#3ad1ff'];

/** Fans within `gap` metres of each other are one crowd. */
function groupsOf(fans, gap = 14) {
  const groups = [];
  for (const f of fans) {
    let g = groups.find(c => Math.hypot(c.x - f.x, c.y - f.y) < gap + c.r);
    if (!g) groups.push((g = { x: f.x, y: f.y, r: 0, fans: [] }));
    g.fans.push(f);
    g.x = g.fans.reduce((a, b) => a + b.x, 0) / g.fans.length;
    g.y = g.fans.reduce((a, b) => a + b.y, 0) / g.fans.length;
    g.r = Math.max(...g.fans.map(o => Math.hypot(o.x - g.x, o.y - g.y)));
  }
  return groups.map(g => ({ ...g, armed: true }));
}

export function cheer() {
  let groups = [], car = { x: 0, y: 0 }, quiet = false;
  const parts = [];

  /** A crowd bursts: confetti from its people, and a few streamers. */
  function burst(from, toward) {
    const n = Math.min(130, 30 + from.length * 4), room = MAX_PARTS - parts.length;
    for (let i = 0; i < Math.min(n, room); i++) {
      const f = from[Math.floor(Math.random() * from.length)];
      const streamer = i % 9 === 0;
      // Up and a little toward the road, spread
      const a = Math.random() * Math.PI * 2, out = 1.5 + Math.random() * 3;
      parts.push({
        kind: streamer ? 'streamer' : 'confetti',
        // From the hands: a fan's are 1.9 m above the ground it stands on (z), a grandstand's are given
        x: f.x, y: f.y, z: f.hand ?? (f.z || 0) + 1.9,
        vx: Math.cos(a) * out + toward[0] * 4.5, vy: Math.sin(a) * out + toward[1] * 4.5,
        vz: (streamer ? 10 : 7) + Math.random() * 4,
        spin: Math.random() * 6, rate: 4 + Math.random() * 8, w: streamer ? 0.12 : 0.16 + Math.random() * 0.08,
        col: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
        age: 0, life: streamer ? 3.6 : 3 + Math.random() * 1.8, tail: streamer ? [] : null, tailT: 0,
      });
    }
  }

  return {
    parts,
    /** The fans (scenery's crowd) and the grandstands' front rows, once per track. */
    setup(fans, stands = []) {
      parts.length = 0;
      groups = groupsOf(fans);
      for (const st of stands) {
        // A grandstand's people, as points along its tiers (enough to throw from)
        const c = Math.cos(st.h), s = Math.sin(st.h), from = [];
        for (let t = 0; t < 3; t++) for (let a = -st.len / 2 + 1; a < st.len / 2 - 0.5; a += 1.5) {
          const o = (-st.dep / 2 + st.dep / 6 + t * st.dep / 3) * st.side;
          from.push({ x: st.x + c * a - s * o, y: st.y + s * a + c * o, hand: (st.z || 0) + 2 + t * 1.2 });
        }
        groups.push({ x: st.x, y: st.y, r: st.len / 2, fans: from, armed: true });
      }
    },
    /** 0…1: how excited a fan at (x, y) is, by the car's distance. */
    excite(x, y) { return Math.max(0, 1 - Math.hypot(x - car.x, y - car.y) / 40); },
    /** How high a fan is off the ground now (m): a jump with its own phase, bigger near the car. */
    lift(f, now) {
      if (quiet) return 0;
      const e = this.excite(f.x, f.y);
      return e > 0 ? e * 0.45 * Math.abs(Math.sin(now / 150 + (f.ph || 0))) : 0;
    },
    update(c, dt, still) {
      car = c; quiet = !!still;
      const speed = Math.hypot(c.vx || 0, c.vy || 0);
      for (const g of groups) {
        const d = Math.hypot(g.x - c.x, g.y - c.y) - g.r;
        if (d > REARM) g.armed = true;
        else if (g.armed && d < BURST_NEAR && speed > BURST_SPEED && !quiet) {
          g.armed = false;
          const k = Math.hypot(c.x - g.x, c.y - g.y) || 1;
          burst(g.fans, [(c.x - g.x) / k, (c.y - g.y) / k]);
        }
      }
      // Confetti flutters: strong drag, a slow fall, a sideways wobble; streamers fall a bit faster
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        const drag = p.kind === 'streamer' ? 1.6 : 2.6;
        p.vx -= p.vx * drag * dt; p.vy -= p.vy * drag * dt;
        // Thrown up almost freely, then caught by the air on the way down
        p.vz -= (9.8 + p.vz * (p.vz > 0 ? 0.5 : drag)) * dt;
        const fall = p.kind === 'streamer' ? -2.2 : -1.1;
        if (p.vz < fall) p.vz = fall;
        p.spin += p.rate * dt;
        p.x += (p.vx + Math.sin(p.spin) * 0.6) * dt; p.y += (p.vy + Math.cos(p.spin * 0.7) * 0.6) * dt;
        p.z = Math.max(0.05, p.z + p.vz * dt);
        if (p.tail) {
          p.tailT += dt;
          if (p.tailT > 0.04) { p.tailT = 0; p.tail.unshift([p.x, p.y, p.z]); if (p.tail.length > TAIL) p.tail.pop(); }
        }
      }
    },
    reset() { parts.length = 0; groups.forEach(g => { g.armed = true; }); },
  };
}
