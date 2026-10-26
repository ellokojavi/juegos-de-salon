/**
 * 🚂 Tren en Vilo — the visitors in the house style (lab, owner's request 2026-10-25): the bird, the
 * flying saucer and its fish, the whale, the boat and its wake rider, and the mole, drawn as smooth shapes
 * with soft light instead of pixel sprites. visitors.js moves them; it draws through a renderer, and
 * `pincel(ctx)` is the smooth one: it has the pixel renderer's methods, and its `sprite()` draws each pixel
 * sprite's shape instead, at the same size and anchor (bottom-centre, facing right).
 */
import { PAJARO, PLATILLO, PREGUNTA, BALLENA, PEZ, TOPO, TOPO_MIEDO, EXCLAMACION, LANCHA, SURFISTA } from './pixel.js';

const OSCURO = '#14081f';
function circulo(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function caja(ctx, x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function brilla(ctx, color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
function trazo(ctx, color, ancho, fn) { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); fn(); ctx.stroke(); }
function grad(ctx, y0, y1, ...colores) { const g = ctx.createLinearGradient(0, y0, 0, y1); colores.forEach((c, i) => g.addColorStop(i / (colores.length - 1), c)); return g; }
/** A sign over a visitor's head ("?" or "!"): the display font, yellow with a dark edge. */
function signo(ctx, texto) {
  ctx.font = '10px Bangers, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 2; ctx.strokeStyle = OSCURO; ctx.strokeText(texto, 0, 0.5);
  brilla(ctx, '#ffd23f', 4, () => { ctx.fillStyle = '#ffd23f'; ctx.fillText(texto, 0, 0.5); });
}

/* ------------------------------------------------------------------ */
/* Each sprite as shapes: (ctx) → draws it around its bottom-centre       */
/* ------------------------------------------------------------------ */

/**
 * A bird, 11 × 5, facing right: a soft lilac body with a lighter belly, a fanned tail, a beak and an
 * eye, and two wings as feathered shapes (the far one darker, behind the body) up, spread or down.
 */
const ALAS = [
  // [tip, elbow on the leading edge, curve of the trailing edge] for up, spread and down
  { t: [-1.6, -6.4], c: [1, -4.8], d: [-1.8, -3.2] },
  { t: [-4.4, -3.3], c: [-0.8, -3.9], d: [-2.8, -2.2] },
  { t: [-1.4, 0.7], c: [0.8, -0.6], d: [-1.6, -1.1] },
];
const pajaro = ala => ctx => {
  const { t, c, d } = ALAS[ala];
  const alaDe = (dx, color, borde) => {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(1.1 + dx, -2.3); ctx.quadraticCurveTo(c[0] + dx, c[1], t[0] + dx, t[1]);
    ctx.quadraticCurveTo(d[0] + dx, d[1], -0.9 + dx, -1.9); ctx.closePath(); ctx.fill();
    if (borde) trazo(ctx, borde, 0.3, () => { ctx.moveTo(1.1 + dx, -2.3); ctx.quadraticCurveTo(c[0] + dx, c[1], t[0] + dx, t[1]); });
  };
  // The far wing, behind
  alaDe(0.9, '#5a4788');
  // The tail, a small fan
  ctx.fillStyle = '#6f5a9e'; ctx.beginPath(); ctx.moveTo(-1.6, -2.1); ctx.lineTo(-3.9, -2.6); ctx.quadraticCurveTo(-3.6, -1.9, -3.9, -1.3); ctx.lineTo(-1.6, -1.6); ctx.closePath(); ctx.fill();
  // The body and the head, lighter underneath
  ctx.fillStyle = grad(ctx, -3, -0.8, '#8a76b8', '#a08ccc', '#cbbbe8');
  ctx.beginPath(); ctx.ellipse(0.3, -1.9, 2.3, 0.95, -0.08, 0, Math.PI * 2); ctx.fill();
  circulo(ctx, 2.6, -2.35, 0.85, '#8a76b8');
  ctx.fillStyle = '#e0b060'; ctx.beginPath(); ctx.moveTo(3.3, -2.6); ctx.lineTo(4.5, -2.25); ctx.lineTo(3.3, -2); ctx.closePath(); ctx.fill();
  circulo(ctx, 2.9, -2.55, 0.2, OSCURO);
  // The near wing, in front, its leading edge catching the light
  alaDe(0, '#7d68b0', 'rgba(230,220,255,0.55)');
};

/** The flying saucer, 14 × 8: a chrome disc, a glass dome with a highlight and a ring of lights that blink. */
const platillo = cuadro => ctx => {
  // The glow underneath
  const g = ctx.createRadialGradient(0, -1, 0, 0, -1, 6);
  g.addColorStop(0, 'rgba(155,232,255,0.45)'); g.addColorStop(1, 'rgba(155,232,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-6, -5, 12, 6);
  // The dome
  ctx.fillStyle = grad(ctx, -8, -4.6, '#e6fbff', '#9be8ff', '#3a8ab0');
  ctx.beginPath(); ctx.ellipse(0, -4.6, 3.2, 3.2, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-1.1, -6.3, 0.9, 0.5, -0.5, 0, Math.PI * 2); ctx.fill();
  // The disc
  ctx.fillStyle = grad(ctx, -5.4, -1.6, '#ffffff', '#c9cde0', '#6c7090', '#3a3e58');
  ctx.beginPath(); ctx.ellipse(0, -3.4, 7, 1.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(20,8,31,0.6)'; ctx.beginPath(); ctx.ellipse(0, -2.2, 4, 0.9, 0, 0, Math.PI); ctx.fill();
  // The lights, around the rim
  const colores = cuadro ? ['#ff2e88', '#2ee6d6', '#ffd23f'] : ['#ffd23f', '#ff2e88', '#2ee6d6'];
  for (let k = 0; k < 5; k++) { const x = -5 + k * 2.5, c = colores[k % 3]; brilla(ctx, c, 4, () => circulo(ctx, x, -3.2, 0.5, c)); }
};

/** The fish, 7 × 4: orange with a golden belly, a forked tail and a bright eye. */
const pez = ctx => {
  ctx.fillStyle = grad(ctx, -4, 0, '#ffb060', '#ff8a3d', '#ffd23f');
  ctx.beginPath(); ctx.ellipse(0.6, -2, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(-1.6, -2); ctx.lineTo(-3.5, -3.6); ctx.lineTo(-3, -2); ctx.lineTo(-3.5, -0.4); ctx.closePath(); ctx.fill();
  circulo(ctx, 2, -2.5, 0.5, '#ffffff'); circulo(ctx, 2.1, -2.5, 0.25, OSCURO);
};

/** The whale, 22 × 8, level; `giro` tilts it (head up going out, down coming back). */
const ballena = giro => ctx => {
  ctx.save(); ctx.translate(0, -4); ctx.rotate(giro);
  // Body: a long rounded shape, the head to the right, narrowing to the tail
  const cuerpo = () => {
    ctx.beginPath(); ctx.moveTo(-8, -0.6);
    ctx.bezierCurveTo(-4, -4.4, 6, -4.8, 9.6, -1.4);
    ctx.quadraticCurveTo(11.4, 0.6, 9, 2.6);
    ctx.bezierCurveTo(4, 4.2, -3, 3, -8, 0.8); ctx.closePath();
  };
  ctx.fillStyle = grad(ctx, -4.6, 3.6, '#7a9be0', '#3d5a9e', '#24386e'); cuerpo(); ctx.fill();
  // The pale belly with its grooves
  ctx.save(); cuerpo(); ctx.clip();
  ctx.fillStyle = '#c4d2f2'; ctx.beginPath(); ctx.ellipse(4, 3, 6.4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(61,90,158,0.5)'; ctx.lineWidth = 0.25;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(1 + k, 1.4 + k * 0.4); ctx.lineTo(9 - k * 0.5, 1.2 + k * 0.5); ctx.stroke(); }
  // A highlight along the back
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(2, -3.2, 5, 0.6, -0.05, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // The tail's flukes and a fin
  ctx.fillStyle = '#3d5a9e';
  ctx.beginPath(); ctx.moveTo(-7.4, 0); ctx.quadraticCurveTo(-9.6, -1, -11, -3.4); ctx.quadraticCurveTo(-10, -0.6, -11.2, 1.8); ctx.quadraticCurveTo(-9.4, 1, -7.4, 0.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#24386e'; ctx.beginPath(); ctx.moveTo(2, 2); ctx.quadraticCurveTo(0, 4.4, -1.6, 4.6); ctx.quadraticCurveTo(0.6, 3, 0.6, 1.8); ctx.closePath(); ctx.fill();
  // The eye
  circulo(ctx, 7.2, 0.2, 0.55, '#ffffff'); circulo(ctx, 7.35, 0.2, 0.3, OSCURO);
  ctx.restore();
};

/** Three short claws off a paw at (x, y), fanned along `ang`. */
function garras(ctx, x, y, ang, largo = 0.9) {
  trazo(ctx, '#fff3e0', 0.22, () => { for (const d of [-0.45, 0, 0.45]) { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang + d) * largo, y + Math.sin(ang + d) * largo); } });
}

/**
 * The mole, 11 × 6, digging, facing right: a velvet body that tapers to the snout, a little fur along the
 * back, a pink nose with whiskers, a tiny eye, a short tail, and its big spade hands with their claws
 * reaching forward and sweeping back in turn.
 */
const topo = cuadro => ctx => {
  // The far hand, behind the body
  const [lx, ly, la] = cuadro ? [2.6, -0.8, 0.6] : [4.4, -1.2, -0.2];
  ctx.fillStyle = '#c99a78'; ctx.beginPath(); ctx.ellipse(lx, ly, 1.1, 0.7, la, 0, Math.PI * 2); ctx.fill();
  // The tail and the hind foot
  trazo(ctx, '#d8a888', 0.4, () => { ctx.moveTo(-5.2, -3); ctx.quadraticCurveTo(-6.2, -3.4, -6.4, -4.2); });
  ctx.fillStyle = '#5a341e'; ctx.beginPath(); ctx.ellipse(-3.2, -0.4, 1.1, 0.5, 0, 0, Math.PI * 2); ctx.fill();
  // The body, round behind and narrowing to the snout
  ctx.fillStyle = grad(ctx, -6, 0, '#a87450', '#7a4a2a', '#4e2c18');
  ctx.beginPath(); ctx.moveTo(-5.4, -3); ctx.bezierCurveTo(-5.4, -6.4, 2, -6.6, 4.2, -3.8); ctx.quadraticCurveTo(5.6, -2.8, 4.6, -2); ctx.bezierCurveTo(2.6, -0.2, -5.4, 0.6, -5.4, -3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,230,200,0.14)'; ctx.beginPath(); ctx.ellipse(-1.2, -4.9, 3, 0.65, -0.05, 0, Math.PI * 2); ctx.fill();
  // A little fur along the back
  trazo(ctx, 'rgba(40,20,10,0.35)', 0.18, () => { for (let k = 0; k < 6; k++) { const x = -4.2 + k * 1.3, y = -5.1 - Math.sin((k + 0.5) / 6 * Math.PI) * 0.35; ctx.moveTo(x, y + 0.5); ctx.lineTo(x - 0.4, y); } });
  // The pink nose and its whiskers, the tiny eye
  ctx.fillStyle = '#ff8aa8'; ctx.beginPath(); ctx.ellipse(5.4, -2.9, 0.7, 0.6, 0, 0, Math.PI * 2); ctx.fill();
  circulo(ctx, 5.6, -3.1, 0.2, 'rgba(255,255,255,0.7)');
  trazo(ctx, 'rgba(255,240,230,0.55)', 0.12, () => { for (const d of [-0.6, 0, 0.6]) { ctx.moveTo(4.8, -2.6); ctx.lineTo(6.4, -2.4 + d); } });
  circulo(ctx, 3, -3.9, 0.3, OSCURO); circulo(ctx, 3.08, -3.98, 0.1, 'rgba(255,255,255,0.8)');
  // The near hand: a broad pale spade, palm out, with its claws
  const [cx, cy, ca] = cuadro ? [5, -0.7, -0.5] : [3.6, -0.4, 0.3];
  ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.ellipse(cx, cy, 1.25, 0.8, ca, 0, Math.PI * 2); ctx.fill();
  garras(ctx, cx + Math.cos(ca) * 1, cy + Math.sin(ca) * 1, ca);
};
/** The mole falling, scared, from the front, 11 × 10: eyes wide, mouth open on two teeth, arms and feet flailing. */
const topoMiedo = cuadro => ctx => {
  const brazo = cuadro ? -8 : -6.4;
  for (const s of [-1, 1]) trazo(ctx, '#7a4a2a', 1.1, () => { ctx.moveTo(s * 2.6, -5.4); ctx.quadraticCurveTo(s * 4, -5.4 + (brazo + 5.4) * 0.2, s * 4.6, brazo); });
  for (const s of [-1, 1]) { ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.ellipse(s * 4.8, brazo - 0.3, 0.9, 0.65, s * 0.5, 0, Math.PI * 2); ctx.fill(); garras(ctx, s * 5, brazo - 0.8, -Math.PI / 2 + s * 0.4, 0.75); }
  // The feet, kicking
  for (const s of [-1, 1]) { ctx.fillStyle = '#d8a888'; ctx.beginPath(); ctx.ellipse(s * 1.6, -0.3 + (cuadro === (s > 0) ? -0.3 : 0), 0.9, 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = grad(ctx, -8, 0, '#b07a50', '#7a4a2a', '#4e2c18');
  ctx.beginPath(); ctx.ellipse(0, -4.2, 3.2, 3.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,225,190,0.22)'; ctx.beginPath(); ctx.ellipse(0, -2.6, 1.9, 2, 0, 0, Math.PI * 2); ctx.fill();
  for (const s of [-1, 1]) { circulo(ctx, s * 1.2, -5.6, 1, '#ffffff'); circulo(ctx, s * 1.2, -5.4, 0.4, OSCURO); circulo(ctx, s * 1.2 - 0.15, -5.6, 0.14, '#ffffff'); }
  circulo(ctx, 0, -4.2, 0.5, '#ff8aa8');
  trazo(ctx, 'rgba(255,240,230,0.5)', 0.12, () => { for (const s of [-1, 1]) for (const d of [-0.4, 0.3]) { ctx.moveTo(s * 0.6, -4.1); ctx.lineTo(s * 2.2, -4.2 + d); } });
  ctx.fillStyle = '#c2185b'; ctx.beginPath(); ctx.ellipse(0, -2.4, 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff6e0'; ctx.fillRect(-0.45, -3.55, 0.4, 0.5); ctx.fillRect(0.05, -3.55, 0.4, 0.5);
};

/**
 * The boat, 16 × 8, facing right (its bottom 2 under the water): a petrol-green hull under white topsides
 * whose sheer rises to the bow, a pink stripe, a raked windscreen, the driver at the wheel, the wake tower
 * arched over the stern (the rope hangs from its rear top corner, 6 back and 8 up) and white water at
 * the bow and the stern.
 */
const lancha = ctx => {
  const ahora = performance.now() / 1000;
  // The wake tower: an arch with a lighter edge, and the tow point
  for (const [color, ancho] of [['#8a90b0', 0.75], ['#e6e9f8', 0.35]]) trazo(ctx, color, ancho, () => {
    ctx.moveTo(-6.6, -4.3); ctx.quadraticCurveTo(-6.4, -8, -5.2, -8.1); ctx.lineTo(-3, -8.1); ctx.quadraticCurveTo(-1.8, -8, -1.6, -4.3);
  });
  circulo(ctx, -6, -8, 0.4, '#ffd23f');
  // The driver: a cap, a vest, an arm on the wheel
  caja(ctx, -0.5, -6.2, 1.7, 2.2, 0.6, '#ff5a3d');
  circulo(ctx, 0.4, -6.9, 0.75, '#ffd0a0');
  ctx.fillStyle = '#2ee6d6'; ctx.beginPath(); ctx.arc(0.4, -7.05, 0.78, Math.PI, 0); ctx.fill(); ctx.fillRect(0.4, -7.15, 1.2, 0.3);
  trazo(ctx, '#ffd0a0', 0.4, () => { ctx.moveTo(0.8, -5.6); ctx.lineTo(1.9, -5.2); });
  circulo(ctx, 2.1, -5.1, 0.45, OSCURO);
  // The windscreen, raked back, with a glint
  ctx.fillStyle = 'rgba(155,232,255,0.55)'; ctx.beginPath(); ctx.moveTo(2.2, -4.3); ctx.lineTo(3, -6.3); ctx.lineTo(3.7, -6.3); ctx.lineTo(4.2, -4.3); ctx.closePath(); ctx.fill();
  trazo(ctx, 'rgba(255,255,255,0.8)', 0.22, () => { ctx.moveTo(3.1, -4.6); ctx.lineTo(3.5, -5.9); });
  // The hull: white topsides whose sheer rises to the bow, over the green bottom
  const casco = () => { ctx.beginPath(); ctx.moveTo(-7.6, -4.4); ctx.quadraticCurveTo(2, -4.5, 8.8, -5.2); ctx.quadraticCurveTo(7.6, -1.2, 3.4, 0); ctx.lineTo(-6.4, 0); ctx.quadraticCurveTo(-7.6, -0.6, -7.6, -4.4); ctx.closePath(); };
  ctx.save(); casco(); ctx.clip();
  ctx.fillStyle = grad(ctx, -5.2, -2.6, '#ffffff', '#d8dcf0'); ctx.fillRect(-8, -6, 17, 3.4);
  ctx.fillStyle = grad(ctx, -2.8, 0, '#4a8a96', '#2f6570', '#163036'); ctx.beginPath(); ctx.moveTo(-8, -2.6); ctx.quadraticCurveTo(2, -2.7, 9, -3.6); ctx.lineTo(9, 1); ctx.lineTo(-8, 1); ctx.closePath(); ctx.fill();
  trazo(ctx, '#ff2e88', 0.4, () => { ctx.moveTo(-7.6, -3.1); ctx.quadraticCurveTo(2, -3.2, 8.4, -4); });
  ctx.restore();
  // The gunwale's bright edge
  trazo(ctx, 'rgba(255,255,255,0.95)', 0.3, () => { ctx.moveTo(-7.4, -4.4); ctx.quadraticCurveTo(2, -4.5, 8.6, -5.2); });
  // White water: the bow cutting through and the stern's churn, soft and flickering
  const f = k => 0.5 + 0.5 * Math.sin(ahora * 9 + k);
  const espuma = (x, y, rx, a) => { ctx.fillStyle = `rgba(235,250,255,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.45, 0, 0, Math.PI * 2); ctx.fill(); };
  for (let k = 0; k < 3; k++) espuma(6.6 + k * 0.7, -1 - k * 0.15, 0.5 + f(k) * 0.3, 0.35 + f(k + 1) * 0.3);
  for (let k = 0; k < 4; k++) espuma(-7.2 - k * 1.1, -0.9 - f(k + 2) * 0.2, 0.9 - k * 0.12 + f(k + 5) * 0.25, 0.45 - k * 0.08);
};

/** A wakeboard, its rocker curving up at both ends, with two bindings; `y` is its bottom. */
function tabla(ctx, y = -0.6) {
  ctx.fillStyle = grad(ctx, y - 1.2, y, '#ffc070', '#ff8a3d'); ctx.beginPath();
  ctx.moveTo(-3.6, y - 1.3); ctx.quadraticCurveTo(-3.2, y - 0.9, -2.6, y - 0.9); ctx.lineTo(2.6, y - 0.9); ctx.quadraticCurveTo(3.2, y - 0.9, 3.6, y - 1.3);
  ctx.quadraticCurveTo(3.4, y, 2.4, y); ctx.lineTo(-2.4, y); ctx.quadraticCurveTo(-3.4, y, -3.6, y - 1.3); ctx.closePath(); ctx.fill();
  trazo(ctx, 'rgba(255,255,255,0.6)', 0.2, () => { ctx.moveTo(-2.6, y - 0.85); ctx.lineTo(2.6, y - 0.85); });
}

/**
 * The wake rider, 7 × 9, facing right, its bottom-centre on the board: a helmet, a pink vest with its
 * yellow stripe, bent knees and elbows, both hands on the handle 2 ahead and 6 up (where the rope ends),
 * leaning back against the pull. Standing tall, crouched to carve, or tumbling off the board.
 */
const jinete = pose => ctx => {
  const piel = '#ffd0a0', traje = '#ff3d7f', pierna = '#3a2f5a', casco = '#2ee6d6';
  const cabeza = (x, y) => {
    circulo(ctx, x, y, 0.95, piel);
    ctx.fillStyle = casco; ctx.beginPath(); ctx.arc(x - 0.1, y - 0.15, 1.05, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    circulo(ctx, x + 0.5, y + 0.05, 0.16, OSCURO);
  };
  if (pose === 'cae') {
    // Tumbling head first, limbs flailing, the board kicked away behind
    ctx.save(); ctx.translate(-3, -6.4); ctx.rotate(0.9); tabla(ctx, 0.6); ctx.restore();
    trazo(ctx, pierna, 0.8, () => { ctx.moveTo(-1.6, -4.4); ctx.lineTo(-3, -5.8); ctx.lineTo(-3.6, -4.8); ctx.moveTo(-1.4, -3.8); ctx.lineTo(-2.8, -2.8); ctx.lineTo(-2.4, -1.8); });
    ctx.save(); ctx.translate(0.4, -4); ctx.rotate(-0.25); caja(ctx, -1.8, -0.9, 3.6, 1.9, 0.8, traje); ctx.fillStyle = '#ffd23f'; ctx.fillRect(-1.6, -0.15, 3.2, 0.4); ctx.restore();
    trazo(ctx, piel, 0.5, () => { ctx.moveTo(1.4, -4.8); ctx.lineTo(2.2, -6.4); ctx.lineTo(3.4, -6.8); ctx.moveTo(0.6, -4.9); ctx.lineTo(0.2, -6.6); ctx.lineTo(-0.6, -7.4); });
    cabeza(3, -3.4);
    return;
  }
  const baja = pose === 'agachado' ? 1.5 : 0;
  tabla(ctx);
  // Boots in the bindings, then the legs, knees bent forward (more when crouched)
  caja(ctx, -2, -2.1, 1.3, 0.8, 0.3, OSCURO); caja(ctx, 0.9, -2.1, 1.3, 0.8, 0.3, OSCURO);
  const cadera = [-0.6, -5 + baja], rodilla = 0.6 + baja * 0.7;
  trazo(ctx, pierna, 0.85, () => {
    ctx.moveTo(-1.35, -1.9); ctx.lineTo(-1.35 + rodilla, -3.5 + baja * 0.4); ctx.lineTo(...cadera);
    ctx.moveTo(1.55, -1.9); ctx.lineTo(1.55 + rodilla * 0.8, -3.6 + baja * 0.4); ctx.lineTo(cadera[0] + 0.5, cadera[1]);
  });
  // The torso, leaning back against the pull: the vest and its stripe
  const hombro = [-0.9 - baja * 0.2, -7.6 + baja];
  ctx.save(); ctx.translate((cadera[0] + hombro[0]) / 2 + 0.2, (cadera[1] + hombro[1]) / 2); ctx.rotate(-0.22 - baja * 0.08);
  caja(ctx, -1.1, -1.6, 2.2, 3.3, 0.9, traje); ctx.fillStyle = '#ffd23f'; ctx.fillRect(-0.22, -1.4, 0.44, 2.9);
  ctx.restore();
  // Both arms out to the handle, elbows a little bent, and the handle itself
  const mano = [2, -6];
  trazo(ctx, piel, 0.5, () => {
    ctx.moveTo(hombro[0] + 0.6, hombro[1] + 0.5); ctx.lineTo((hombro[0] + mano[0]) / 2 + 0.2, (hombro[1] + mano[1]) / 2 + 0.6); ctx.lineTo(...mano);
    ctx.moveTo(hombro[0] + 0.2, hombro[1] + 0.8); ctx.lineTo((hombro[0] + mano[0]) / 2, (hombro[1] + mano[1]) / 2 + 0.9); ctx.lineTo(mano[0] - 0.1, mano[1] + 0.3);
  });
  caja(ctx, mano[0] - 0.15, mano[1] - 0.6, 0.45, 1.5, 0.2, OSCURO);
  cabeza(hombro[0] + 0.3, hombro[1] - 1.1);
};

const FORMAS = new Map([
  ...PAJARO.map((s, k) => [s, pajaro(k)]),
  ...PLATILLO.map((s, k) => [s, platillo(k)]),
  [PREGUNTA, ctx => signo(ctx, '?')], [EXCLAMACION, ctx => signo(ctx, '!')],
  [PEZ, pez],
  // Steep on the way out and back in (owner's request), so it reads as a leap out of the water
  [BALLENA.sube, ballena(-0.55)], [BALLENA.arriba, ballena(0)], [BALLENA.baja, ballena(0.55)],
  ...TOPO.map((s, k) => [s, topo(k)]), ...TOPO_MIEDO.map((s, k) => [s, topoMiedo(k)]),
  [LANCHA, lancha],
  [SURFISTA.arriba, jinete('arriba')], [SURFISTA.agachado, jinete('agachado')], [SURFISTA.cae, jinete('cae')],
]);

/**
 * A smooth renderer over `ctx` (already scaled to art units), with the pixel renderer's methods, so
 * visitors.js draws the same visitors in this style. `W` and `H` are the scene's size in art units.
 */
export function pincel(ctx, W, H) {
  return {
    W, H,
    punto(x, y, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 0.6, 0, Math.PI * 2); ctx.fill(); },
    rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); },
    linea(x0, y0, x1, y1, color, grosor = 1) { trazo(ctx, color, grosor * 0.5, () => { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }); },
    circulo(x, y, r, color) { circulo(ctx, x, y, r, color); },
    /** The saucer's beam: a soft cone of light from `top` down `alto`, `abajo` wide at its foot. */
    haz(x, top, alto, abajo, alfa) {
      const g = ctx.createLinearGradient(0, top, 0, top + alto);
      g.addColorStop(0, `rgba(155,232,255,${alfa * 1.6})`); g.addColorStop(1, 'rgba(155,232,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 2, top); ctx.lineTo(x + 2, top); ctx.lineTo(x + abajo / 2, top + alto); ctx.lineTo(x - abajo / 2, top + alto); ctx.closePath(); ctx.fill();
    },
    /**
     * The boat's wave: a smooth swell over the points [[x, top], …], bright at its crest and fading into
     * the water, a line of foam that thins behind, and spray flicking off where it peaks.
     */
    ola(puntos, yAgua) {
      const top = Math.min(...puntos.map(([, y]) => y)), ahora = performance.now() / 1000;
      const cuerpo = ctx.createLinearGradient(0, top, 0, yAgua + 0.5);
      cuerpo.addColorStop(0, 'rgba(160,245,255,0.95)'); cuerpo.addColorStop(0.5, 'rgba(90,200,235,0.75)'); cuerpo.addColorStop(1, 'rgba(60,140,210,0.2)');
      ctx.fillStyle = cuerpo; ctx.beginPath(); ctx.moveTo(puntos[0][0], yAgua + 0.5);
      for (const [x, y] of puntos) ctx.lineTo(x, y);
      ctx.lineTo(puntos[puntos.length - 1][0], yAgua + 0.5); ctx.closePath(); ctx.fill();
      // The foam line: brightest on the crest, thinning toward the stern and fading away behind
      const [xa] = puntos[0], [xb] = puntos[puntos.length - 1], [cx, cy] = puntos.reduce((a, b) => (b[1] < a[1] ? b : a));
      const g = ctx.createLinearGradient(xa, 0, xb, 0), pico = Math.min(0.9, Math.max(0.1, (cx - xa) / (xb - xa || 1)));
      g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(pico, 'rgba(255,255,255,0.95)'); g.addColorStop(Math.min(1, pico + 0.3), 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      trazo(ctx, g, 0.7, () => puntos.forEach(([x, y], k) => (k ? ctx.lineTo(x, y - 0.2) : ctx.moveTo(x, y - 0.2))));
      // Spray off the crest: a few drops that rise and fall back, each on its own beat
      const lado = Math.sign(xb - xa) || 1;
      for (let k = 0; k < 5; k++) {
        const t = (ahora * 1.6 + k * 0.37) % 1, dx = lado * (k - 1) * 0.9 + lado * t * 1.5, dy = -2.4 * t * (1 - t) * 4 * (0.6 + (k % 3) * 0.2);
        circulo(ctx, cx + dx, cy - 0.3 + dy, 0.28 * (1 - t * 0.6), `rgba(255,255,255,${0.9 * (1 - t)})`);
      }
    },
    /**
     * The mole's tunnel through the first `n` points it dug: a bore of dug brown earth, warm against the
     * purple rock at any time of day (a dark bore vanished in the night's rock), its rim of loose earth
     * lighter, the ceiling in shadow and the floor a little lit.
     */
    tunel(camino, n) {
      if (n < 1) return;
      // Its heights averaged over a few points, so the bore curves instead of stepping
      const alto = k => { let t = 0, c = 0; for (let j = Math.max(0, k - 2); j <= Math.min(n - 1, k + 2); j++, c++) t += camino[j][1]; return t / c; };
      const via = () => { ctx.beginPath(); for (let k = 0; k < n; k++) ctx[k ? 'lineTo' : 'moveTo'](camino[k][0] + 0.5, alto(k) - 2.5); };
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      via(); ctx.strokeStyle = '#b07a50'; ctx.lineWidth = 8; ctx.stroke();
      via(); ctx.strokeStyle = '#341c0e'; ctx.lineWidth = 6.6; ctx.stroke();
      ctx.translate(0, -1.6); via(); ctx.strokeStyle = 'rgba(14,6,2,0.6)'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.translate(0, 3.6); via(); ctx.strokeStyle = 'rgba(176,122,80,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    },
    /** The rider in the water: the head bobbing up to `asoma` (0 to 1) of its height, the board floating at `tabla`. */
    nadador(x, yAgua, { asoma, vaiven, tabla: tx }) {
      ctx.save(); ctx.translate(tx + 2.2, yAgua + 0.2); ctx.rotate(Math.sin(vaiven) * 0.06); tabla(ctx, 0); ctx.restore();
      if (asoma <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 3, yAgua - 6, 6, 6); ctx.clip();
      const y = yAgua + 1.6 - asoma * 1.6 + vaiven * 0.4;
      // The vest's shoulders keep the rider afloat, the helmet on top
      caja(ctx, x - 1.4, y - 0.6, 2.8, 1.6, 0.7, '#ff3d7f');
      circulo(ctx, x, y - 1.3, 0.95, '#ffd0a0');
      ctx.fillStyle = '#2ee6d6'; ctx.beginPath(); ctx.arc(x - 0.1, y - 1.45, 1.05, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
      circulo(ctx, x + 0.5, y - 1.25, 0.16, OSCURO);
      ctx.restore();
      trazo(ctx, 'rgba(255,255,255,0.7)', 0.3, () => { ctx.ellipse(x, yAgua, 2 + Math.sin(vaiven) * 0.2, 0.4, 0, 0, Math.PI * 2); });
    },
    /** The rider picked up, sitting at the stern: the helmet and the vest's shoulders over the gunwale, at (x, y). */
    pasajero(x, y) {
      caja(ctx, x - 0.9, y + 0.2, 1.8, 1.6, 0.6, '#ff3d7f');
      circulo(ctx, x, y - 0.4, 0.8, '#ffd0a0');
      ctx.fillStyle = '#2ee6d6'; ctx.beginPath(); ctx.arc(x, y - 0.55, 0.88, Math.PI, 0); ctx.fill();
    },
    /** "Rider down": a small orange flag waving on a pole over the tower, at (x, base). */
    bandera(x, base, dir, ahora) {
      trazo(ctx, '#d8dcf0', 0.35, () => { ctx.moveTo(x, base); ctx.lineTo(x, base - 5.4); });
      const ola = Math.sin(ahora * 8) * 0.5, s = -dir;
      brilla(ctx, '#ff7a1a', 4, () => {
        ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x, base - 5.4);
        ctx.quadraticCurveTo(x + s * 1.6, base - 5.4 + ola, x + s * 3.2, base - 4.8); ctx.quadraticCurveTo(x + s * 1.6, base - 4 - ola, x, base - 3.8); ctx.closePath(); ctx.fill();
      });
    },
    sprite(filas, paleta, x, y, { voltear = false, cortarY = Infinity, escala = 1 } = {}) {
      const forma = FORMAS.get(filas);
      ctx.save();
      // Under the water's line nothing shows (the whale coming up, the boat's hull)
      if (Number.isFinite(cortarY)) { ctx.beginPath(); ctx.rect(-1e4, -1e4, 2e4, cortarY + 1e4 + 0.5); ctx.clip(); }
      ctx.translate(x, y);
      if (voltear) ctx.scale(-1, 1);
      if (escala !== 1) ctx.scale(escala, escala);
      if (forma) forma(ctx);
      else {
        // A sprite with no shape yet: its pixels, as small squares
        const h = filas.length, w = filas[0].length;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          const c = filas[j][i];
          if (c !== '.' && c !== ' ') { ctx.fillStyle = paleta[c] || '#f0f'; ctx.fillRect(i - w / 2, j - h, 1, 1); }
        }
      }
      ctx.restore();
    },
  };
}
