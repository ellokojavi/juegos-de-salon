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

/** A bird, 11 × 5: a small dark-lilac silhouette, its wings up, spread or down. */
const pajaro = ala => ctx => {
  const color = '#8a76b8';
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0.5, -1.8, 2.4, 0.9, -0.1, 0, Math.PI * 2); ctx.fill();
  circulo(ctx, 2.8, -2.2, 0.8, color);
  ctx.fillStyle = '#e0b060'; ctx.beginPath(); ctx.moveTo(3.5, -2.4); ctx.lineTo(4.6, -2.1); ctx.lineTo(3.5, -1.9); ctx.closePath(); ctx.fill();
  const punta = [[-3.6, -5], [-5, -2.6], [-3.4, 0]][ala], codo = [[-1.6, -3.6], [-2.6, -2.4], [-1.4, -0.8]][ala];
  for (const s of [1, -0.6]) trazo(ctx, color, 0.8, () => { ctx.moveTo(0.2, -1.9); ctx.quadraticCurveTo(codo[0] * s + (s < 0 ? 1.4 : 0), codo[1], punta[0] * s + (s < 0 ? 2.6 : 0), punta[1]); });
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

/** The mole, 11 × 6, digging: velvet brown, a pink nose, its big front claws in two positions. */
const topo = cuadro => ctx => {
  ctx.fillStyle = grad(ctx, -6, 0, '#b07a50', '#7a4a2a', '#4e2c18');
  ctx.beginPath(); ctx.ellipse(-0.6, -3, 4.8, 2.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(-1.2, -4.8, 3, 0.7, 0, 0, Math.PI * 2); ctx.fill();
  // The snout and its pink nose
  ctx.fillStyle = '#9a6440'; ctx.beginPath(); ctx.ellipse(3.8, -2.8, 1.6, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  circulo(ctx, 5.3, -2.9, 0.75, '#ff8aa8');
  // A tiny eye
  circulo(ctx, 2.6, -3.8, 0.35, OSCURO);
  // The claws
  const [cx, cy] = cuadro ? [5, -0.6] : [3.8, -0.3];
  ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.ellipse(cx, cy, 1.2, 0.6, cuadro ? -0.6 : 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a341e'; ctx.beginPath(); ctx.ellipse(-3, -0.4, 1, 0.5, 0, 0, Math.PI * 2); ctx.fill();
};
/** The mole falling, scared, from the front, 11 × 10: eyes wide, mouth open, arms waving. */
const topoMiedo = cuadro => ctx => {
  const brazo = cuadro ? -8 : -6.4;
  for (const s of [-1, 1]) trazo(ctx, '#7a4a2a', 1.1, () => { ctx.moveTo(s * 2.6, -5.6); ctx.lineTo(s * 4.6, brazo); });
  for (const s of [-1, 1]) circulo(ctx, s * 4.7, brazo - 0.2, 0.7, '#e8c8a0');
  ctx.fillStyle = grad(ctx, -8, 0, '#b07a50', '#7a4a2a', '#4e2c18');
  ctx.beginPath(); ctx.ellipse(0, -4.2, 3.2, 3.9, 0, 0, Math.PI * 2); ctx.fill();
  for (const s of [-1, 1]) { circulo(ctx, s * 1.2, -5.6, 1, '#ffffff'); circulo(ctx, s * 1.2, -5.4, 0.4, OSCURO); }
  circulo(ctx, 0, -4.2, 0.5, '#ff8aa8');
  ctx.fillStyle = '#c2185b'; ctx.beginPath(); ctx.ellipse(0, -2.4, 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
};

/** The boat, 16 × 8, facing right: a glossy petrol-green hull, a white stripe, the windscreen, the driver and the wake tower at the stern. */
const lancha = ctx => {
  // The wake tower: two posts and its roof (the rope hangs from its rear top corner, 6 back and 8 up)
  trazo(ctx, '#d8dcf0', 0.45, () => { ctx.moveTo(-6, -4); ctx.lineTo(-6, -8); ctx.lineTo(-2, -8); ctx.lineTo(-2, -4); });
  caja(ctx, -6.4, -8.5, 4.8, 0.8, 0.3, '#2f6570');
  // The driver and the windscreen
  circulo(ctx, 0.4, -5.4, 0.8, '#ffd0a0'); caja(ctx, -0.4, -6.5, 1.6, 0.7, 0.3, '#ff5a3d');
  ctx.fillStyle = 'rgba(155,232,255,0.75)'; ctx.beginPath(); ctx.moveTo(1.6, -4); ctx.lineTo(2.6, -6.2); ctx.lineTo(3.2, -6.2); ctx.lineTo(3, -4); ctx.closePath(); ctx.fill();
  // The hull, rising to a pointed bow
  ctx.fillStyle = grad(ctx, -4.4, 0, '#5aa0ac', '#2f6570', '#163036');
  ctx.beginPath(); ctx.moveTo(-7.6, -4.2); ctx.lineTo(6.4, -4.2); ctx.quadraticCurveTo(8.4, -4.2, 8, -3); ctx.quadraticCurveTo(6.6, 0, 3, 0); ctx.lineTo(-6, 0); ctx.quadraticCurveTo(-7.6, -0.6, -7.6, -4.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-7.2, -2.6, 13, 0.55);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-7.2, -4, 13.6, 0.35);
};

/** The wake rider on the board, 7 × 9: standing tall, crouched to carve, or falling. */
const jinete = pose => ctx => {
  const piel = '#ffd0a0', traje = '#ff3d7f';
  if (pose === 'cae') {
    // Tumbling, flat in the air
    caja(ctx, -2.8, -4.6, 5, 1.6, 0.8, traje);
    circulo(ctx, 2.8, -4, 0.9, piel); circulo(ctx, 3, -4.5, 0.6, OSCURO);
    trazo(ctx, piel, 0.6, () => { ctx.moveTo(-1, -4.6); ctx.lineTo(-3.2, -6); ctx.moveTo(1, -4.6); ctx.lineTo(3.2, -6.2); });
    trazo(ctx, '#2b2b3a', 0.7, () => { ctx.moveTo(-2.6, -3.6); ctx.lineTo(-3.6, -2.4); });
    return;
  }
  // The board, orange, rocker up at the nose
  ctx.fillStyle = grad(ctx, -2, 0, '#ffb060', '#ff8a3d'); ctx.beginPath(); ctx.moveTo(-3.4, -1.6); ctx.lineTo(2.4, -1.6); ctx.quadraticCurveTo(3.6, -1.8, 3.4, -2.4); ctx.lineTo(3, -0.6); ctx.lineTo(-3, -0.6); ctx.quadraticCurveTo(-3.6, -0.8, -3.4, -1.6); ctx.closePath(); ctx.fill();
  const baja = pose === 'agachado' ? 1.6 : 0;
  // Legs, bent when crouched
  trazo(ctx, '#2b2b3a', 0.75, () => { ctx.moveTo(-1.2, -1.7); ctx.lineTo(-0.8 - baja * 0.4, -3.6 + baja * 0.4); ctx.lineTo(-0.4, -5 + baja); ctx.moveTo(1.2, -1.7); ctx.lineTo(1.2 + baja * 0.4, -3.6 + baja * 0.4); ctx.lineTo(0.6, -5 + baja); });
  // Torso with its yellow stripe, arms out toward the rope
  caja(ctx, -1.1, -7.4 + baja, 2.2, 2.8, 0.8, traje);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(-0.25, -7.2 + baja, 0.5, 2.5);
  trazo(ctx, piel, 0.55, () => { ctx.moveTo(0.8, -6.6 + baja); ctx.lineTo(2.6, -6.2 + baja); ctx.moveTo(-0.8, -6.6 + baja); ctx.lineTo(-2.2, -5.6 + baja); });
  // Head and hair
  circulo(ctx, 0, -8.4 + baja, 0.95, piel);
  ctx.fillStyle = OSCURO; ctx.beginPath(); ctx.arc(0, -8.6 + baja, 0.95, Math.PI, 0); ctx.fill();
};

const FORMAS = new Map([
  ...PAJARO.map((s, k) => [s, pajaro(k)]),
  ...PLATILLO.map((s, k) => [s, platillo(k)]),
  [PREGUNTA, ctx => signo(ctx, '?')], [EXCLAMACION, ctx => signo(ctx, '!')],
  [PEZ, pez],
  [BALLENA.sube, ballena(-0.16)], [BALLENA.arriba, ballena(0)], [BALLENA.baja, ballena(0.16)],
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
    /** The boat's wave: a smooth swell over the points [[x, top], …], a white crest that fades behind. */
    ola(puntos, yAgua) {
      ctx.fillStyle = 'rgba(122,240,255,0.85)'; ctx.beginPath(); ctx.moveTo(puntos[0][0], yAgua);
      for (const [x, y] of puntos) ctx.lineTo(x, y);
      ctx.lineTo(puntos[puntos.length - 1][0], yAgua); ctx.closePath(); ctx.fill();
      const [xa] = puntos[0], [xb] = puntos[puntos.length - 1], g = ctx.createLinearGradient(xa, 0, xb, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      trazo(ctx, g, 0.7, () => puntos.forEach(([x, y], k) => (k ? ctx.lineTo(x, y - 0.2) : ctx.moveTo(x, y - 0.2))));
    },
    /** The rider in the water: the head bobbing up to `asoma` (0 to 1) of its height, the board floating at `tabla`. */
    nadador(x, yAgua, { asoma, vaiven, tabla }) {
      caja(ctx, tabla, yAgua - 0.8, 4.4, 1, 0.5, '#ff8a3d');
      if (asoma <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 3, yAgua - 6, 6, 6); ctx.clip();
      const y = yAgua + 1.6 - asoma * 1.6 + vaiven * 0.4;
      circulo(ctx, x, y - 1.2, 1, '#ffd0a0');
      ctx.fillStyle = OSCURO; ctx.beginPath(); ctx.arc(x, y - 1.4, 1, Math.PI, 0); ctx.fill();
      ctx.restore();
      trazo(ctx, 'rgba(255,255,255,0.7)', 0.3, () => { ctx.ellipse(x, yAgua, 1.8, 0.4, 0, 0, Math.PI * 2); });
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
