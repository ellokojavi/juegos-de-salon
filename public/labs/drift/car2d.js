/**
 * Drift: the car seen from above, drawn once at the screen's scale (the owner, 2026-11-27: «más
 * definición … al vehículo mismo»). What never changes goes in one sprite: the body with its volume
 * (lit along its spine, darker at its flanks), the fenders over the wheels, the bonnet,
 * the windscreen with its reflection, the roof with its scoop, the rear window, the mirrors, the
 * spoiler, the stripes and the panel lines. A rally car (the owner, 2026-11-27: «una especie de auto de
 * rally»; then «más realista»): wide flares in the body's colour over the wheels, a pod of four
 * spotlights on the nose, red tow hooks, a roof vent and an aerial, a roof wing with white end plates,
 * laid out where car3d.js has them (windscreen, roof and hatch glass at the same lengths). The scene draws on top, every frame, what changes: the
 * wheels (under the body), the lights, the dents, the flame.
 *
 *   carSprite(ppm) → { img, hx, hy }   the sprite and the half sizes it covers, m (car frame: x forward)
 *   shadowSprite(ppm) → { img, hx, hy } a soft shadow, darker under the middle
 */
export const CAR = {
  body: '#ff2e88', light: '#ff8fc0', dark: '#b0175c', deep: '#7a0d3e', roof: '#e0206f',
  stripe: '#ffffff', stripeEdge: 'rgba(0, 0, 0, 0.22)', glass: '#1d0a16', glassLight: '#5a3550',
  reflect: 'rgba(255, 255, 255, 0.38)', seam: 'rgba(60, 0, 25, 0.45)', outline: 'rgba(40, 0, 18, 0.85)',
  vent: '#2a0a1c', spoiler: '#c81a66', mirror: '#d81f70',
  plastic: '#1c1c22', spot: '#fff3b0', spotRim: '#2a2a30', hook: '#e8302a', plate: '#ffffff',
};
const L = 4.2, W = 1.8;
const PAD = 0.35;

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}

/** The body's outline in the car frame: a long rounded shape, a little narrower at the nose and the tail. */
function bodyPath(x) {
  const hl = L / 2, hw = W / 2 - 0.05;
  x.beginPath();
  x.moveTo(hl - 0.5, -hw + 0.06);
  x.quadraticCurveTo(hl - 0.04, -hw + 0.1, hl, -hw + 0.45);
  x.lineTo(hl, hw - 0.45);
  x.quadraticCurveTo(hl - 0.04, hw - 0.1, hl - 0.5, hw - 0.06);
  x.quadraticCurveTo(0, hw + 0.02, -hl + 0.4, hw - 0.04);
  x.quadraticCurveTo(-hl, hw - 0.08, -hl, hw - 0.4);
  x.lineTo(-hl, -hw + 0.4);
  x.quadraticCurveTo(-hl, -hw + 0.08, -hl + 0.4, -hw + 0.04);
  x.quadraticCurveTo(0, -hw - 0.02, hl - 0.5, -hw + 0.06);
  x.closePath();
}

const rrect = (x, bx, by, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(bx, by, w, h, r); else x.rect(bx, by, w, h); };

/** The sprite of the body, at `ppm` pixels a metre. Drawn in the car frame, x forward and y to its left. */
export function carSprite(ppm) {
  const hx = L / 2 + PAD, hy = W / 2 + PAD;
  const c = canvasOf(2 * hx * ppm, 2 * hy * ppm), x = c.getContext('2d');
  // Row 0 is the car's −y: the scene draws the sprite from (−hx, −hy) in the car's frame, so it lands right
  x.translate(hx * ppm, hy * ppm); x.scale(ppm, ppm);

  // The flares: the body's colour swelling out over each wheel, wider than the body, a dark lip at their edge
  for (const fx of [1.302, -1.26]) for (const s of [-1, 1]) {
    x.fillStyle = CAR.plastic; rrect(x, fx - 0.6, s * (W / 2 + 0.04) - 0.17, 1.2, 0.34, 0.17); x.fill();
    x.fillStyle = CAR.dark; rrect(x, fx - 0.56, s * (W / 2 + 0.02) - 0.15, 1.12, 0.3, 0.15); x.fill();
  }
  // The red tow hooks, one at the nose, one at the tail
  x.fillStyle = CAR.hook; x.fillRect(L / 2 - 0.02, 0.38, 0.14, 0.09); x.fillRect(-L / 2 - 0.12, -0.47, 0.14, 0.09);

  // The body, lit along its spine and dark at its flanks: the volume
  const side = x.createLinearGradient(0, -W / 2, 0, W / 2);
  side.addColorStop(0, CAR.dark); side.addColorStop(0.12, CAR.body); side.addColorStop(0.4, CAR.body);
  side.addColorStop(0.5, CAR.light); side.addColorStop(0.6, CAR.body); side.addColorStop(0.88, CAR.body); side.addColorStop(1, CAR.dark);
  bodyPath(x); x.fillStyle = side; x.fill();
  // Nose and tail a touch darker, where the body curves down
  const ends = x.createLinearGradient(-L / 2, 0, L / 2, 0);
  ends.addColorStop(0, 'rgba(60, 0, 25, 0.25)'); ends.addColorStop(0.1, 'rgba(60, 0, 25, 0)');
  ends.addColorStop(0.9, 'rgba(60, 0, 25, 0)'); ends.addColorStop(1, 'rgba(60, 0, 25, 0.3)');
  bodyPath(x); x.fillStyle = ends; x.fill();

  // The rally stripes over the bonnet, with a hairline shadow so they sit on the paint
  for (const o of [-0.2, 0.2]) {
    x.fillStyle = CAR.stripeEdge; x.fillRect(0.8, o - 0.1, 1.2, 0.2);
    x.fillStyle = CAR.stripe; x.fillRect(0.8, o - 0.085, 1.2, 0.17);
  }

  // The bonnet's seam, where it meets the wings
  x.strokeStyle = CAR.seam; x.lineWidth = 0.03;
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(1.95, s * 0.66); x.quadraticCurveTo(1.4, s * 0.72, 0.82, s * 0.7); x.stroke(); }

  // The windscreen: wider at its foot, dark glass, the sky caught in a diagonal
  const ws = [[0.8, -0.74], [0.8, 0.74], [0.05, 0.62], [0.05, -0.62]];
  const glass = x.createLinearGradient(0.8, 0, 0.05, 0);
  glass.addColorStop(0, CAR.glassLight); glass.addColorStop(1, CAR.glass);
  x.fillStyle = glass; x.beginPath(); ws.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
  x.fillStyle = CAR.reflect;
  x.beginPath(); x.moveTo(0.74, -0.5); x.lineTo(0.74, -0.28); x.lineTo(0.12, 0.2); x.lineTo(0.12, -0.02); x.closePath(); x.fill();

  // The roof, its own curve of light, and a scoop on top
  const roof = x.createLinearGradient(0, -0.62, 0, 0.62);
  roof.addColorStop(0, CAR.roof); roof.addColorStop(0.5, CAR.light); roof.addColorStop(1, CAR.roof);
  x.fillStyle = roof; rrect(x, -1.52, -0.62, 1.57, 1.24, 0.18); x.fill();
  for (const o of [-0.2, 0.2]) { x.fillStyle = CAR.stripe; x.fillRect(-1.5, o - 0.085, 1.5, 0.17); }
  x.fillStyle = CAR.vent; rrect(x, -0.52, -0.16, 0.34, 0.32, 0.06); x.fill();
  x.fillStyle = 'rgba(255, 255, 255, 0.18)'; rrect(x, -0.48, -0.12, 0.12, 0.24, 0.05); x.fill();
  // Side windows: thin dark strips along the roof's edges, the B pillar between them
  for (const s of [-1, 1]) {
    x.fillStyle = CAR.glass; x.beginPath(); x.moveTo(0.05, s * 0.62); x.lineTo(-1.52, s * 0.6); x.lineTo(-1.52, s * 0.7); x.lineTo(0.05, s * 0.74); x.closePath(); x.fill();
    x.fillStyle = CAR.roof; x.fillRect(-0.74, s * 0.67 - 0.06, 0.14, 0.12);
  }

  // The hatch glass, sloping down behind the roof
  const rw = [[-1.52, -0.6], [-1.52, 0.6], [-1.95, 0.5], [-1.95, -0.5]];
  x.fillStyle = CAR.glass; x.beginPath(); rw.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();

  // Door seams down each flank
  x.strokeStyle = CAR.seam; x.lineWidth = 0.025;
  for (const xl of [0.8, -0.78]) for (const s of [-1, 1]) { x.beginPath(); x.moveTo(xl, s * (W / 2 - 0.12)); x.lineTo(xl, s * (W / 2 - 0.02)); x.stroke(); }

  // The mirrors, sticking out by the windscreen's foot
  for (const s of [-1, 1]) {
    x.fillStyle = CAR.mirror; x.beginPath(); x.ellipse(0.66, s * (W / 2 + 0.06), 0.07, 0.11, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = CAR.glass; x.beginPath(); x.ellipse(0.61, s * (W / 2 + 0.06), 0.025, 0.08, 0, 0, Math.PI * 2); x.fill();
  }

  // The rally wing at the roof's end, over the hatch glass, with white end plates
  const wing = x.createLinearGradient(-1.94, 0, -1.5, 0);
  wing.addColorStop(0, CAR.deep); wing.addColorStop(1, CAR.spoiler);
  x.fillStyle = wing; rrect(x, -1.94, -0.79, 0.44, 1.58, 0.05); x.fill();
  x.fillStyle = CAR.plate; for (const s of [-1, 1]) x.fillRect(-1.97, s * 0.79 - 0.03, 0.5, 0.06);

  // The roof's aerial, at the back of the roof
  x.fillStyle = CAR.plastic; x.beginPath(); x.arc(-1.25, 0.33, 0.05, 0, Math.PI * 2); x.fill();

  // The pod of four spotlights over the nose: a black bar, four lamps with dark rims and a glint
  x.fillStyle = CAR.plastic; rrect(x, L / 2 - 0.32, -0.66, 0.16, 1.32, 0.05); x.fill();
  for (const o of [-0.45, -0.15, 0.15, 0.45]) {
    x.fillStyle = CAR.spotRim; x.beginPath(); x.arc(L / 2 - 0.2, o, 0.14, 0, Math.PI * 2); x.fill();
    x.fillStyle = CAR.spot; x.beginPath(); x.arc(L / 2 - 0.18, o, 0.1, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255, 255, 255, 0.85)'; x.beginPath(); x.arc(L / 2 - 0.15, o - 0.03, 0.035, 0, Math.PI * 2); x.fill();
  }

  // A crisp outline around the body for definition at any zoom
  bodyPath(x); x.strokeStyle = CAR.outline; x.lineWidth = 0.045; x.stroke();
  return { img: c, hx, hy };
}

/** A soft shadow: layers of a rounded shape, wider and fainter outward (no canvas filter: Safari has none). */
export function shadowSprite(ppm, colour = 'rgba(0, 0, 0, 1)') {
  const hx = L / 2 + 0.9, hy = W / 2 + 0.9;
  const c = canvasOf(2 * hx * ppm, 2 * hy * ppm), x = c.getContext('2d');
  x.translate(hx * ppm, hy * ppm); x.scale(ppm, ppm);
  x.fillStyle = colour;
  for (let k = 7; k >= 0; k--) {
    const g = k * 0.1;
    x.globalAlpha = k === 0 ? 0.35 : 0.07;
    rrect(x, -L / 2 - g, -W / 2 - g, L + 2 * g, W + 2 * g, 0.5 + g);
    x.fill();
  }
  return { img: c, hx, hy };
}
