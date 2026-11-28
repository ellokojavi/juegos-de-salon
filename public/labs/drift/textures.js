/**
 * Drift: the top-down scene's textures (the owner, 2026-11-27: «más definición tanto al entorno como
 * al vehículo»). Each is a small square tile drawn once per setting from its own seed, seamless (what
 * crosses an edge is drawn again on the other side), and repeated in the world as a pattern, so the
 * ground, the shoulder and the road show grain at any zoom without drawing anything per frame.
 *
 *   tile(kind, S) → { img, metres }   kind: 'ground' | 'gravel' | 'asphalt'
 *
 * The tiles over the road are mostly transparent marks (lighter and darker grains), so the same tile
 * works on any road colour; the ground's carries the setting's own grass, ash or dry stalks.
 */
import { seeded } from './scenery.js';

/** Pixels a tile side, and the metres it covers. */
const PX = 512;
const METRES = { ground: 9, gravel: 6, asphalt: 5 };

function canvasOf(n) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return c;
}

/** Draws `fn(x, y)` at (x, y) and at its copies across the tile's edges, so the tile repeats seamlessly. */
const wrapped = (x, y, reach, fn) => {
  for (const dx of [0, x < reach ? PX : x > PX - reach ? -PX : 0]) for (const dy of [0, y < reach ? PX : y > PX - reach ? -PX : 0]) fn(x + dx, y + dy);
};

const GRASS = {
  meadow: { blades: ['rgba(120, 180, 90, 0.28)', 'rgba(40, 85, 35, 0.25)', 'rgba(160, 190, 100, 0.2)'], n: 1500, len: [6, 13], dots: 'rgba(255, 240, 160, 0.4)' },
  forest: { blades: ['rgba(20, 12, 8, 0.28)', 'rgba(110, 90, 70, 0.2)', 'rgba(160, 90, 40, 0.2)'], n: 1100, len: [3, 8], dots: 'rgba(230, 110, 40, 0.4)' },
  plain: { blades: ['rgba(170, 160, 90, 0.24)', 'rgba(60, 75, 40, 0.26)', 'rgba(120, 130, 70, 0.22)'], n: 1400, len: [7, 15], dots: null },
};

/** A tile of `kind` for the setting S (its name is S.name, given by the scene). */
export function tile(kind, S, name = 'meadow') {
  const c = canvasOf(PX), x = c.getContext('2d');
  const rnd = seeded(`tile:${kind}:${name}`);
  if (kind === 'ground') {
    const G = GRASS[name] || GRASS.meadow;
    // Soft mottling first: large faint blots, lighter and darker
    for (let i = 0; i < 90; i++) {
      const px = rnd() * PX, py = rnd() * PX, r = 25 + rnd() * 55, a = 0.025 + rnd() * 0.03;
      x.fillStyle = rnd() < 0.5 ? `rgba(0, 0, 0, ${a})` : `rgba(255, 255, 230, ${a * 0.7})`;
      wrapped(px, py, r, (X, Y) => { x.beginPath(); x.ellipse(X, Y, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2); x.fill(); });
    }
    // Then the blades (or the ash and needles): short strokes leaning with the wind
    x.lineCap = 'round';
    for (let i = 0; i < G.n; i++) {
      const px = rnd() * PX, py = rnd() * PX, len = G.len[0] + rnd() * (G.len[1] - G.len[0]), a = -0.5 + rnd() * 1.0 - Math.PI / 2;
      x.strokeStyle = G.blades[Math.floor(rnd() * G.blades.length)];
      x.lineWidth = 1.4 + rnd() * 1.4;
      wrapped(px, py, len, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * len, Y + Math.sin(a) * len); x.stroke(); });
    }
    // Specks: flowers in the meadow, embers in the burnt forest
    if (G.dots) for (let i = 0; i < 60; i++) {
      const px = rnd() * PX, py = rnd() * PX, r = 1.5 + rnd() * 2;
      x.fillStyle = G.dots;
      wrapped(px, py, r, (X, Y) => { x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill(); });
    }
  } else if (kind === 'gravel') {
    // Fine grain, then pebbles: each a lit top and a shadow below
    for (let i = 0; i < 3500; i++) {
      const px = rnd() * PX, py = rnd() * PX;
      x.fillStyle = rnd() < 0.5 ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 240, 0.07)';
      x.fillRect(px, py, 1.5 + rnd() * 1.5, 1.5 + rnd() * 1.5);
    }
    for (let i = 0; i < 360; i++) {
      const px = rnd() * PX, py = rnd() * PX, r = 2.5 + rnd() * 4.5, rot = rnd() * 3;
      wrapped(px, py, r + 3, (X, Y) => {
        x.fillStyle = 'rgba(0, 0, 0, 0.13)';
        x.beginPath(); x.ellipse(X + 1.2, Y + 1.6, r, r * 0.7, rot, 0, Math.PI * 2); x.fill();
        x.fillStyle = `rgba(${200 + Math.floor(rnd() * 55)}, ${185 + Math.floor(rnd() * 55)}, ${160 + Math.floor(rnd() * 60)}, 0.22)`;
        x.beginPath(); x.ellipse(X, Y, r, r * 0.7, rot, 0, Math.PI * 2); x.fill();
      });
    }
  } else {
    // Asphalt: a dense aggregate of light and dark specks, a few patches and hairline cracks
    for (let i = 0; i < 9000; i++) {
      const px = rnd() * PX, py = rnd() * PX;
      x.fillStyle = rnd() < 0.55 ? 'rgba(0, 0, 0, 0.11)' : 'rgba(255, 255, 255, 0.07)';
      x.fillRect(px, py, 1 + rnd() * 1.4, 1 + rnd() * 1.4);
    }
    for (let i = 0; i < 6; i++) {
      const px = rnd() * PX, py = rnd() * PX, r = 20 + rnd() * 40;
      x.fillStyle = rnd() < 0.5 ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.04)';
      wrapped(px, py, r, (X, Y) => { x.beginPath(); x.ellipse(X, Y, r, r * 0.6, rnd() * 3, 0, Math.PI * 2); x.fill(); });
    }
    x.strokeStyle = 'rgba(0, 0, 0, 0.3)'; x.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      let px = rnd() * PX, py = rnd() * PX;
      x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 6; k++) { px += (rnd() - 0.5) * 50; py += (rnd() - 0.5) * 50; x.lineTo(px, py); }
      x.stroke();
    }
  }
  return { img: c, metres: METRES[kind] };
}

/**
 * The pattern of a tile for `ctx`, sized in metres (the scene draws in metres). Null where the phone
 * cannot scale a pattern (no DOMMatrix): the scene then draws without grain.
 */
export function pattern(ctx, { img, metres }) {
  const p = ctx.createPattern(img, 'repeat');
  if (!p || !p.setTransform || typeof DOMMatrix === 'undefined') return null;
  p.setTransform(new DOMMatrix().scale(metres / PX));
  return p;
}
