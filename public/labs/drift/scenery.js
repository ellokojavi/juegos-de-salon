/**
 * Drift: the settings and their scenery (docs/rally/path-1-top-down.md, "The scene"). What the scene
 * draws around the road, and nothing the engine reads: no prop is solid, so the physics stays flat.
 *
 * A setting is a palette and the props that grow in it. Three, as the plan asks:
 *
 *   meadow  a green meadow by day, on gravel
 *   forest  a burnt forest at sunset, on gravel: dead trees, stumps, long warm shadows
 *   plain   a plain at dusk, on asphalt: bushes, hay bales, rocks, a blue tint
 *
 * The props come from a seeded generator fed by the stage's id and the setting, so everyone sees the
 * same trees on the same stage (the scene's own random, never the engine's: it decides nothing a
 * time depends on). They are kept off the road and its shoulder, and stored in a coarse grid so the
 * scene draws only the cells in view.
 */

/** Every colour of a setting, declared once (DESIGN.md §4: what is drawn inside the canvas is the game's). */
export const SETTINGS = {
  meadow: {
    ground: '#3f6b34', patches: ['rgba(90, 140, 70, 0.16)', 'rgba(40, 80, 35, 0.18)', 'rgba(140, 150, 80, 0.14)'],
    shoulder: '#7a6a4a', road: '#b59d72', ruts: 'rgba(120, 96, 64, 0.28)', lines: null, centre: null,
    shadow: 'rgba(10, 30, 10, 0.35)', sun: [0.55, -0.45],
    trees: [['#2e5a26', '#3f7532', '#5a9444'], ['#28502a', '#356b38', '#4f8a4d'], ['#3a5e22', '#4e7a2c', '#6c9a3c']],
    bush: ['#4d7d36', '#66984a'], rock: ['#8f8b80', '#b3afa4'], hay: null, dead: null,
    props: { tree: 0.55, bush: 0.3, rock: 0.15 }, density: 1,
    dust: [205, 185, 140], tint: null, tyre: 'rgba(70, 52, 32, A)',
  },
  forest: {
    ground: '#3a2c21', patches: ['rgba(20, 14, 10, 0.25)', 'rgba(120, 110, 100, 0.14)', 'rgba(90, 60, 35, 0.2)'],
    shoulder: '#6b5238', road: '#b8946a', ruts: 'rgba(110, 80, 52, 0.3)', lines: null, centre: null,
    shadow: 'rgba(20, 8, 0, 0.45)', sun: [1.5, -0.35],
    trees: null, bush: ['#4a3b22', '#6a5530'], rock: ['#6f665c', '#968a7a'], hay: null,
    dead: { trunk: '#1d1712', branch: '#2b221b', ember: '#c8642a' },
    props: { dead: 0.6, stump: 0.2, rock: 0.2 }, density: 1.2,
    dust: [190, 150, 110], tint: 'rgba(255, 120, 40, 0.13)', tyre: 'rgba(30, 20, 12, A)',
  },
  plain: {
    ground: '#556238', patches: ['rgba(120, 120, 60, 0.16)', 'rgba(50, 65, 35, 0.18)', 'rgba(150, 140, 90, 0.14)'],
    shoulder: '#77705c', road: '#4a4a50', ruts: null, lines: 'rgba(245, 245, 240, 0.8)', centre: 'rgba(255, 214, 90, 0.85)',
    shadow: 'rgba(10, 10, 30, 0.4)', sun: [-1.1, -0.7],
    trees: null, bush: ['#566b32', '#73884a'], rock: ['#8a857a', '#aaa596'], hay: ['#c9a54a', '#a7843a'], dead: null,
    props: { bush: 0.5, hay: 0.25, rock: 0.25 }, density: 0.75,
    dust: [150, 150, 150], tint: 'rgba(40, 40, 120, 0.22)', tyre: 'rgba(20, 20, 24, A)',
  },
};
export const SETTING_NAMES = Object.keys(SETTINGS);

/** The scene's own seeded random (mulberry32). */
export function seeded(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The size of a grid cell, m. */
export const CELL = 40;
const key = (x, y) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;

/** How far a point is from the road's edge, m (negative on the road), from a grid of the centreline's points. */
function edgeDistance(track) {
  const grid = new Map();
  for (const p of track.pts) {
    const k = key(p.x, p.y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
  }
  return (x, y) => {
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    let best = Infinity;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (const p of grid.get(`${cx + i},${cy + j}`) || []) {
        const d = Math.hypot(p.x - x, p.y - y) - p.w / 2;
        if (d < best) best = d;
      }
    }
    return best;
  };
}

/** The props' size range, m (radius). */
const SIZE = { tree: [2.2, 4.2], dead: [1.6, 3], bush: [0.9, 1.8], rock: [0.6, 1.4], hay: [0.9, 1.1], stump: [0.5, 0.8] };

/**
 * The scenery of `track` in `setting`: `{ patches, cells }`, the ground's patches and the props by
 * grid cell, each `{ kind, x, y, r, v }` (`v` picks a colour variant).
 */
export function scenery(track, setting) {
  const S = SETTINGS[setting] || SETTINGS.meadow;
  const rnd = seeded(`${track.id}:${setting}`);
  const edge = edgeDistance(track);
  const kinds = Object.entries(S.props);
  const pick = () => { let u = rnd(); for (const [k, p] of kinds) { if ((u -= p) <= 0) return k; } return kinds[0][0]; };
  const cells = new Map(), patches = new Map();
  const put = (map, item) => { const k = key(item.x, item.y); if (!map.has(k)) map.set(k, []); map.get(k).push(item); };
  const P = track.pts;
  for (let i = 0; i < P.length; i += 2) {
    const p = P[i], nx = -Math.sin(p.h), ny = Math.cos(p.h);
    for (const side of [-1, 1]) {
      // Props: up to two every 4 m on each side, most of them near the road where the player sees them
      for (let tries = 0; tries < 2; tries++) {
        if (rnd() >= 0.8 * S.density) continue;
        const kind = pick();
        const r = SIZE[kind][0] + rnd() * (SIZE[kind][1] - SIZE[kind][0]);
        const d = p.w / 2 + 3 + r + Math.pow(rnd(), 2) * 50;
        const along = (rnd() - 0.5) * 4;
        const x = p.x + nx * side * d + Math.cos(p.h) * along, y = p.y + ny * side * d + Math.sin(p.h) * along;
        // Off the road and its shoulder everywhere, also where another bend passes near
        if (edge(x, y) > r + 2.5) put(cells, { kind, x, y, r, v: Math.floor(rnd() * 3) });
      }
      // The ground's patches: under everything, the road paints over them
      if (rnd() < 0.5) {
        const d = p.w / 2 + rnd() * 60;
        put(patches, { x: p.x + nx * side * d, y: p.y + ny * side * d, r: 2 + rnd() * 4, v: Math.floor(rnd() * 3) });
      }
    }
  }
  return { patches, cells };
}

/** The items of `map` in the cells within `reach` of (cx, cy), into `out`. */
export function near(map, cx, cy, reach, out = []) {
  out.length = 0;
  const x0 = Math.floor((cx - reach) / CELL), x1 = Math.floor((cx + reach) / CELL);
  const y0 = Math.floor((cy - reach) / CELL), y1 = Math.floor((cy + reach) / CELL);
  for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
    const items = map.get(`${i},${j}`);
    if (items) for (const it of items) out.push(it);
  }
  return out;
}

/** The setting a stage is drawn in: the lab panel's pick, or the stage's own. */
export const settingOf = (track, pick) => (SETTINGS[pick] ? pick : SETTINGS[track.setting] ? track.setting : 'meadow');

/**
 * What the car can hit, as circles for the engine (`track.solids`): a tree's trunk (its crown is
 * above the car, so only the trunk stops it), a dead tree's trunk, a stump, a rock, a hay bale.
 * Bushes are soft: the car drives through them.
 */
const SOLID = { tree: r => 0.25 * r, dead: r => 0.22 * r, stump: r => r, rock: r => 0.85 * r, hay: r => 0.9 * r };
export function solids({ cells }) {
  const out = [];
  for (const it of [...cells.values()].flat()) {
    const f = SOLID[it.kind];
    if (f) out.push({ x: it.x, y: it.y, r: Math.round(f(it.r) * 100) / 100 });
  }
  return out;
}
