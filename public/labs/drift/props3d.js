/**
 * Drift: what stands around the road in 3D, drawn into a world chunk's mesh (the owner, 2026-11-27:
 * «aumenta el detalle y definición de las personas que se ven en la pista y en los objetos alrededor»).
 * Only the look: where each thing stands and which are solid stays in scenery.js, so the circuits'
 * pars do not move.
 *
 *   addProp(m, it, ctx)   a tree, a dead tree, a stump, a bush, a rock, a bale or a fan
 *   addStand(m, st, ctx)  a grandstand: three tiers of seated fans, a roof on posts, a rail and a banner
 *
 * `ctx` is { S (the setting), wetK, shadow(m, x, y, r, len), face(x, y) (the heading toward the
 * road), trackId, z (the ground's height there, 0 on a flat circuit) }. Every height below is above z.
 * With `fans: []` the fans are listed instead of baked (the scene draws them jumping, personMesh), and
 * with `rows: []` and `newMesh()` each grandstand tier's people get their own meshes (seated and
 * standing), so the scene can lift them in a wave.
 */
import { rgb } from './gl3d.js';
import { CROWD, seeded } from './scenery.js';

const LOOK = {
  trunk: '#4a3424', trunkDark: '#3a281b', jeans: ['#2a2f45', '#3a3a40', '#4a3a2c', '#24345a'], shoe: '#1a1a1e',
  phone: '#15151a', screen: '#bfe8ff', strap: '#c9a248',
  banner: ['#ff2e88', '#ffd23f', '#3ad1ff'], bannerText: '#ffffff', seat: '#3a4050',
};
const col = (list, i) => rgb(list[i % list.length]);

/** One person standing at (x, y) facing `h`: legs, hips, a jacket, arms in one of five poses, a head with hair or a cap. */
function person(m, x, y, z, h, v, k = 1, cheering = false) {
  const c = Math.cos(h), s = Math.sin(h);
  // A point `f` m forward (toward the road), `l` m to the person's left, `u` m up
  const P = (f, l, u) => [x + c * f - s * l, y + s * f + c * l, z + u * k];
  const box = (f, l, u, hf, hl, hu, colour) => { const [bx, by, bz] = P(f, l, u); m.box(bx, by, bz, hf * k, hl * k, hu * k, h, colour); };
  const shirt = col(CROWD.shirts, v), skin = col(CROWD.skin, v >> 3), legs = col(LOOK.jeans, v >> 1);
  const shoe = rgb(LOOK.shoe), dark = rgb(CROWD.shirts[v % CROWD.shirts.length], 0.72);
  // Legs, apart; shoes pointing at the road
  for (const l of [-0.09, 0.09]) { box(0, l, 0.42, 0.08, 0.075, 0.38, legs); box(0.04, l, 0.04, 0.12, 0.08, 0.04, shoe); }
  box(0, 0, 0.86, 0.11, 0.18, 0.08, legs);
  // The jacket: the body, a darker collar and a zip down its front
  box(0, 0, 1.2, 0.12, 0.2, 0.28, [shirt, shirt]);
  box(0, 0, 1.47, 0.1, 0.16, 0.03, [dark, dark]);
  box(0.125, 0, 1.2, 0.005, 0.015, 0.26, [dark, dark]);
  box(0, 0, 1.53, 0.05, 0.05, 0.04, skin);
  // The head: a face with a nose, then hair or a cap with its peak toward the road
  box(0, 0, 1.68, 0.1, 0.095, 0.12, skin);
  box(0.11, 0, 1.66, 0.02, 0.02, 0.025, skin);
  if (v % 3 === 0) {
    const cap = col(CROWD.caps, v >> 2);
    box(-0.01, 0, 1.81, 0.11, 0.105, 0.04, cap); box(0.13, 0, 1.775, 0.07, 0.085, 0.01, cap);
  } else {
    const hair = col(CROWD.hair, v >> 1);
    box(-0.02, 0, 1.8, 0.105, 0.105, 0.03, hair); box(-0.08, 0, 1.7, 0.04, 0.1, 0.09, hair);
  }
  // The arms: 0 down, 1 both up (cheering), 2 one up with a flag, 3 holding a phone up, 4 hands on hips
  // Cheering (the car near): whoever had their arms down or on their hips throws them up
  const calm = (v >> 2) % 5, pose = cheering && calm !== 2 && calm !== 3 ? 1 : calm;
  for (const side of [1, -1]) {
    const l = side * 0.27;
    if (pose === 1 || (pose === 2 && side > 0)) {
      box(0, l * 1.05, 1.68, 0.055, 0.055, 0.22, shirt); box(0, l * 1.1, 1.95, 0.05, 0.05, 0.06, skin);
      if (pose === 2) {
        const [bx, by, bz] = P(0, l * 1.1, 2.25);
        m.box(bx, by, bz, 0.012 * k, 0.012 * k, 0.3 * k, h, rgb('#e8e8ea'));
        box(0, l * 1.1 + 0.25, 2.35, 0.006, 0.24, 0.15, col(CROWD.flags, v));
      }
    } else if (pose === 3) {
      box(0.12, l * 0.75, 1.36, 0.14, 0.05, 0.05, shirt);
      if (side > 0) { box(0.3, 0, 1.52, 0.012, 0.06, 0.1, rgb(LOOK.phone)); box(0.29, 0, 1.52, 0.005, 0.05, 0.085, rgb(LOOK.screen)); }
    } else if (pose === 4) {
      box(0.02, l * 1.02, 1.22, 0.055, 0.05, 0.14, shirt); box(0.02, l * 0.82, 1.03, 0.05, 0.05, 0.05, skin);
    } else {
      box(0, l, 1.12, 0.055, 0.055, 0.25, shirt); box(0, l, 0.82, 0.05, 0.05, 0.06, skin);
    }
  }
}

const fanScale = v => 0.94 + ((v * 7) % 5) * 0.03;

/**
 * A fan of variant `v` (0…31) at the origin facing +x, calm or cheering: the scene draws it each frame
 * where the fan stands, lifted while it jumps.
 */
export function personMesh(m, v, cheering) { person(m, 0, 0, 0, 0, v, fanScale(v), cheering); return m; }

export function addProp(m, it, { S, wetK = 1, shadow, face, z = 0, fans = null }) {
  const { x, y, r, v } = it, tw = v * 0.7 + x * 0.01;
  if (it.kind === 'tree') {
    const [dark, mid, light] = S.trees[v % S.trees.length].map(c => rgb(c, wetK));
    shadow(m, x, y, r * 0.75, r * 1.2);
    // A trunk with roots, then four layers of foliage, each a little turned from the one below
    m.cone(x, y, z, z + r * 0.9, r * 0.16, r * 0.1, 6, rgb(LOOK.trunk, wetK), tw, false);
    for (let i = 0; i < 3; i++) {
      const a = tw + i * 2.1;
      m.box(x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16, z + r * 0.04, r * 0.12, r * 0.04, r * 0.05, a, rgb(LOOK.trunkDark, wetK));
    }
    m.cone(x, y, z + r * 0.55, z + r * 1.7, r * 1.0, r * 0.45, 8, dark, tw, true);
    m.cone(x, y, z + r * 1.25, z + r * 2.25, r * 0.82, r * 0.25, 8, rgb(S.trees[v % S.trees.length][0], wetK * 1.12), tw + 0.4, true);
    m.cone(x, y, z + r * 1.85, z + r * 2.75, r * 0.6, 0, 7, mid, tw + 0.8);
    m.cone(x, y, z + r * 2.4, z + r * 3.15, r * 0.34, 0, 6, light, tw + 1.2);
  } else if (it.kind === 'dead') {
    const { trunk, branch, ember } = S.dead;
    shadow(m, x, y, r * 0.35, r * 1.4);
    m.cone(x, y, z, z + r * 2.4, r * 0.17, r * 0.05, 6, rgb(trunk), tw);
    for (let i = 0; i < 6; i++) {
      const a = tw + i * 1.05, zz = z + r * (0.9 + i * 0.22), len = r * (0.45 + (i % 3) * 0.15);
      const bx = x + Math.cos(a) * len, by = y + Math.sin(a) * len, bz = zz + len * 0.6;
      m.quad([x, y, zz], [bx, by, bz], [bx, by, bz + 0.12], [x, y, zz + 0.25], rgb(branch));
      m.quad([x, y, zz + 0.25], [bx, by, bz + 0.12], [bx, by, bz], [x, y, zz], rgb(branch));
      // A twig off the end of every other branch
      if (i % 2 === 0) {
        const tx = bx + Math.cos(a + 0.8) * len * 0.4, ty = by + Math.sin(a + 0.8) * len * 0.4;
        m.quad([bx, by, bz], [tx, ty, bz + len * 0.35], [tx, ty, bz + len * 0.35 + 0.07], [bx, by, bz + 0.1], rgb(branch));
        m.quad([bx, by, bz + 0.1], [tx, ty, bz + len * 0.35 + 0.07], [tx, ty, bz + len * 0.35], [bx, by, bz], rgb(branch));
      }
    }
    if (v === 0) m.blob(x + 0.3, y, z, 0.25, 0.2, 5, rgb(ember));
  } else if (it.kind === 'stump') {
    // Bark around, the cut on top in rings, a root or two
    m.cone(x, y, z, z + r * 0.9, r, r * 0.85, 8, rgb(S.dead.branch), tw, true);
    m.cone(x, y, z + r * 0.9, z + r * 0.92, r * 0.7, r * 0.7, 8, rgb(S.dead.trunk), tw, true);
    m.cone(x, y, z + r * 0.92, z + r * 0.94, r * 0.35, r * 0.35, 8, rgb(S.dead.branch), tw, true);
    for (const a of [tw, tw + 2.4]) m.box(x + Math.cos(a) * r, y + Math.sin(a) * r, z + r * 0.12, r * 0.35, r * 0.14, r * 0.12, a, rgb(S.dead.branch));
  } else if (it.kind === 'bush') {
    shadow(m, x, y, r * 0.8, r * 0.5);
    m.blob(x, y, z, r, r * 1.1, 8, rgb(S.bush[0], wetK), tw);
    m.blob(x + r * 0.25, y - r * 0.25, z + r * 0.3, r * 0.6, r * 1.0, 7, rgb(S.bush[1], wetK), tw + 1);
    m.blob(x - r * 0.35, y + r * 0.2, z + r * 0.15, r * 0.55, r * 0.8, 6, rgb(S.bush[0], wetK * 1.15), tw + 2);
    // A few flowers or berries on top, in the crowd's colours
    if (v % 2 === 0) for (let i = 0; i < 4; i++) {
      const a = tw + i * 1.6;
      m.box(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, z + r * 0.95, 0.06, 0.06, 0.05, 0, col(CROWD.shirts, v + i * 3));
    }
  } else if (it.kind === 'rock') {
    shadow(m, x, y, r * 0.8, r * 0.4);
    m.blob(x, y, z - 0.1, r, r * 0.9, 7, rgb(S.rock[0], wetK), tw);
    m.blob(x - r * 0.2, y + r * 0.1, z + r * 0.25, r * 0.55, r * 0.75, 6, rgb(S.rock[1], wetK), tw + 2);
    // Pebbles at its foot
    for (let i = 0; i < 3; i++) {
      const a = tw + i * 2.3 + 0.5;
      m.blob(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15, z, r * 0.18, r * 0.16, 5, rgb(S.rock[i % 2], wetK), a);
    }
  } else if (it.kind === 'hay' || it.kind === 'bale') {
    const cols = it.kind === 'hay' ? S.hay : CROWD.bale, c0 = rgb(cols[v % 2], wetK), c1 = rgb(cols[(v + 1) % 2], wetK * 0.9);
    shadow(m, x, y, r * 0.9, r * 0.6);
    // A round bale: the straw, two twine bands, the face spiralled in two shades
    m.cone(x, y, z, z + r * 1.3, r, r, 10, c0, tw, false);
    for (const u of [0.35, 0.95]) m.cone(x, y, z + r * u, z + r * (u + 0.05), r * 1.01, r * 1.01, 10, rgb(LOOK.strap), tw, false);
    m.cone(x, y, z + r * 1.3, z + r * 1.3, r, r, 10, c1, tw, true);
    m.cone(x, y, z + r * 1.3, z + r * 1.32, r * 0.6, r * 0.6, 10, c0, tw, true);
    m.cone(x, y, z + r * 1.32, z + r * 1.34, r * 0.25, r * 0.25, 10, c1, tw, true);
  } else if (it.kind === 'fan') {
    shadow(m, x, y, 0.35, 0.3);
    const h = face ? face(x, y) : tw;
    // With a list to fill, the fan is drawn on its own each frame (it jumps: cheer.js), else baked in
    if (fans) fans.push({ x, y, z: z + (m.lift || 0), h, v, ph: it.ph || 0 });
    else person(m, x, y, z, h, v, fanScale(v));
  }
}

export function addStand(m, st, { trackId, z = 0, rows = null, newMesh = null }) {
  const c = Math.cos(st.h), s = Math.sin(st.h), out = st.side;   // out 1: the stand is on the road's left
  const toRoad = st.h - out * Math.PI / 2;
  // Three tiers rising away from the road, each with a seat rail and its fans seated on it
  for (let t = 0; t < 3; t++) {
    const o = (-st.dep / 2 + st.dep / 6 + t * st.dep / 3) * out;
    m.box(st.x - s * o, st.y + c * o, z + 0.5 + t * 0.6, st.len / 2, st.dep / 6, 0.5 + t * 0.6, st.h, [rgb(CROWD.step), rgb(CROWD.stand)]);
    const so = o + out * 0.25;
    m.box(st.x - s * so, st.y + c * so, z + 1.08 + t * 1.2, st.len / 2 - 0.1, 0.12, 0.08, st.h, rgb(LOOK.seat));
    const rs = seeded(`${trackId}:stand${st.v}:${t}`);
    // With a list to fill, each tier's people are their own two meshes (seated, and on their feet
    // cheering) that the scene lifts in a wave as the car passes; else they are baked in
    const row = rows && newMesh ? { calm: newMesh(), up: newMesh(), t, x: st.x, y: st.y } : null;
    if (row) { row.calm.lift = row.up.lift = m.lift; rows.push(row); }   // the ground's height, as the stand's
    for (let a = -st.len / 2 + 0.8; a < st.len / 2 - 0.5; a += 0.9) {
      if (rs() < 0.12) continue;   // a gap here and there
      const v = Math.floor(rs() * 32), fo = o - out * 0.05;
      const fx = st.x + c * a - s * fo, fy = st.y + s * a + c * fo, zz = z + 1 + t * 1.2;
      const shirt = col(CROWD.shirts, v), skin = col(CROWD.skin, v >> 3);
      const P = (f, l, u) => { const hc = Math.cos(toRoad), hs = Math.sin(toRoad); return [fx + hc * f - hs * l, fy + hs * f + hc * l, zz + u]; };
      const seated = (pm, up) => {
        const box = (f, l, u, hf, hl, hu, cl) => { const [bx, by, bz] = P(f, l, u); pm.box(bx, by, bz, hf, hl, hu, toRoad, cl); };
        const r = up ? 0.12 : 0;   // on their feet: the body rises off the seat
        box(0.15, 0, 0.12 + r * 0.6, 0.2 - r, 0.16, 0.07 + r, col(LOOK.jeans, v));   // thighs (or legs, standing)
        box(0, 0, 0.42 + r, 0.11, 0.19, 0.25, shirt);                                 // the body
        box(0, 0, 0.8 + r, 0.09, 0.09, 0.11, skin);                                   // the head
        if (v % 3 === 0) box(-0.01, 0, 0.93 + r, 0.1, 0.1, 0.03, col(CROWD.caps, v));
        else box(-0.02, 0, 0.91 + r, 0.095, 0.095, 0.025, col(CROWD.hair, v));
        if (up || v % 4 === 0) for (const l of [-0.24, 0.24]) box(0, l, 0.85 + r, 0.05, 0.05, 0.22, shirt);   // arms up
        else for (const l of [-0.24, 0.24]) box(0.05, l, 0.38, 0.05, 0.05, 0.2, shirt);
      };
      if (row) { seated(row.calm, false); seated(row.up, true); } else seated(m, false);
    }
  }
  // The roof on four posts, a rail along the front and a banner hanging from it
  const ro = (st.dep / 2 - 0.3) * out;
  m.box(st.x - s * ro, st.y + c * ro, z + 5, st.len / 2 + 0.4, st.dep / 2 + 0.4, 0.15, st.h, rgb(CROWD.roof));
  m.box(st.x - s * ro, st.y + c * ro, z + 5.18, st.len / 2 + 0.2, st.dep / 2 + 0.2, 0.04, st.h, rgb(CROWD.roof, 0.8));
  for (const a of [-st.len / 2, st.len / 2]) for (const k of [1.6, -1.4]) {
    m.box(st.x + c * a - s * ro * k, st.y + s * a + c * ro * k, z + 2.5, 0.12, 0.12, 2.5, st.h, rgb(CROWD.rail));
  }
  const fo = (-st.dep / 2 - 0.1) * out;
  for (const u of [0.55, 1.1]) m.box(st.x - s * fo, st.y + c * fo, z + u, st.len / 2, 0.03, 0.03, st.h, rgb(CROWD.rail));
  for (let a = -st.len / 2; a <= st.len / 2 + 0.01; a += st.len / 6) m.box(st.x + c * a - s * fo, st.y + s * a + c * fo, z + 0.55, 0.03, 0.03, 0.55, st.h, rgb(CROWD.rail));
  // The banner: panels in the crowd's colours with a white stripe, hung on the rail's road side
  const bo = fo - out * 0.06, n = 3, w = st.len / n;
  for (let i = 0; i < n; i++) {
    const a = -st.len / 2 + w * (i + 0.5);
    m.box(st.x + c * a - s * bo, st.y + s * a + c * bo, z + 0.82, w / 2 - 0.15, 0.015, 0.25, st.h, col(LOOK.banner, st.v + i));
    m.box(st.x + c * a - s * (bo - out * 0.02), st.y + s * a + c * (bo - out * 0.02), z + 0.82, w / 2 - 0.5, 0.015, 0.05, st.h, rgb(LOOK.bannerText));
  }
}
