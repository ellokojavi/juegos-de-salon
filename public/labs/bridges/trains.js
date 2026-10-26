/**
 * 🚂 Tren en Vilo — the train for the house style (lab, owner's request 2026-10-25): the first neon train
 * looked too childish. Of four smoother, metallic designs (a bullet train, a 1930s streamliner, a metro and
 * a neon-outlined one) the owner chose the bullet train, the same nose at both ends, in several colors.
 * `?train=<id>` picks a color in the game (with `?style=neon`); `trains/` shows them all side by side.
 *
 * Each design draws in art units (16 per grid unit) with its bottom-centre on the rails, at the sizes the
 * game expects: the front car about 22 long and the wagons 16, up to 14 high. `humo` is where the smoke
 * comes out (null: an electric train, no smoke) and `luz` where the headlight is, both from the front
 * car's bottom-centre.
 */

const OSCURO = '#14081f';

function caja(ctx, x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function circulo(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function brilla(ctx, color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
/** Fills a path and keeps it as a clip for what follows (stripes, windows), until restore. */
function cuerpo(ctx, trazar, relleno) {
  ctx.save(); ctx.beginPath(); trazar(); ctx.fillStyle = relleno; ctx.fill(); ctx.clip();
}

/** Polished metal, lit from above: bright top, a sharp highlight, a dark band, the floor's reflection low. */
function cromo(ctx, top, bottom, tinte = [200, 205, 230]) {
  const g = ctx.createLinearGradient(0, top, 0, bottom), [r, gg, b] = tinte;
  const c = (k, a = 1) => `rgba(${Math.round(r * k)},${Math.round(gg * k)},${Math.round(b * k)},${a})`;
  g.addColorStop(0, c(1.08)); g.addColorStop(0.18, c(0.92)); g.addColorStop(0.24, '#ffffff'); g.addColorStop(0.3, c(0.95));
  g.addColorStop(0.58, c(0.55)); g.addColorStop(0.8, c(0.38)); g.addColorStop(0.9, c(0.7)); g.addColorStop(1, c(0.45));
  return g;
}
/** A glossy dark finish (window glass, black enamel): a reflection streak over a deep color. */
function vidrio(ctx, top, bottom, base = '#140a2a') {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#3a2a6a'); g.addColorStop(0.35, base); g.addColorStop(1, '#07030f');
  return g;
}
/** A diagonal reflection streak across a window, from (x, top) leaning right. */
function reflejo(ctx, x, top, bottom, ancho = 1.2) {
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + ancho, top); ctx.lineTo(x + ancho - (bottom - top) * 0.5, bottom); ctx.lineTo(x - (bottom - top) * 0.5, bottom); ctx.closePath(); ctx.fill();
}
/** Small bogie wheels peeking under a skirt. */
function bogies(ctx, xs, giro, r = 1.15) {
  for (const x of xs) {
    circulo(ctx, x, -r, r, '#1a1030');
    ctx.strokeStyle = 'rgba(210,215,240,0.6)'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(x, -r, r - 0.25, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,215,240,0.35)'; ctx.beginPath(); ctx.moveTo(x - Math.cos(giro) * (r - 0.4), -r - Math.sin(giro) * (r - 0.4)); ctx.lineTo(x + Math.cos(giro) * (r - 0.4), -r + Math.sin(giro) * (r - 0.4)); ctx.stroke();
  }
}
/** A row of lit windows (the warm light of the passengers), each with its reflection. */
function ventanas(ctx, xs, top, alto, ancho, r = 0.6, luz = '#ffd98a') {
  brilla(ctx, luz, 3, () => { for (const x of xs) caja(ctx, x, top, ancho, alto, r, luz); });
  for (const x of xs) { ctx.save(); ctx.beginPath(); ctx.roundRect(x, top, ancho, alto, r); ctx.clip(); reflejo(ctx, x + ancho * 0.55, top, top + alto, ancho * 0.18); ctx.restore(); }
}

/* ------------------------------------------------------------------ */
/* The bullet train: chrome with a long nose at each end              */
/* ------------------------------------------------------------------ */
/**
 * The bullet train in one color: `tinte` is the metal's color (silver, pearl, ruby…), `franja` and `filo`
 * the two stripes along its side. Both ends are the same nose (owner's request): it can run either way, so
 * the last car is the front car turned around, with red tail lights instead of the headlight.
 */
function balaDe({ id, nombre, lema, tinte, franja, filo }) {
  const metal = ctx => cromo(ctx, -11.2, -2.4, tinte);
  const rayas = (ctx, x0, w) => { ctx.fillStyle = franja; ctx.fillRect(x0, -5.4, w, 0.8); ctx.fillStyle = filo; ctx.fillRect(x0, -4.4, w, 0.3); };
  /** An end car, its nose to the right; `cola` lights it as the back of the train. */
  const punta = (ctx, x, y, { giro = 0, cola = false } = {}) => {
    ctx.save(); ctx.translate(x, y);
    caja(ctx, -11, -2.6, 20, 1.4, 0.4, OSCURO);
    bogies(ctx, [-8, -4.6, 2.4, 5.8], giro);
    cuerpo(ctx, () => {
      ctx.moveTo(-11, -2.4); ctx.lineTo(-11, -10); ctx.quadraticCurveTo(-11, -11.2, -9.8, -11.2); ctx.lineTo(0, -11.2);
      ctx.bezierCurveTo(6.5, -11.2, 11.4, -7.4, 11.9, -3.6); ctx.quadraticCurveTo(12, -2.4, 10.6, -2.4); ctx.closePath();
    }, metal(ctx));
    // The stripes sweeping along the side and down the nose
    rayas(ctx, -11, 24);
    // The windows band and the cockpit's sloped windscreen
    ctx.fillStyle = vidrio(ctx, -9.6, -7.2); ctx.beginPath(); ctx.roundRect(-10.2, -9.4, 10.2, 2, 0.8); ctx.fill();
    ventanas(ctx, [-9.6, -6.6, -3.6], -9.1, 1.4, 2.2, 0.5);
    ctx.fillStyle = vidrio(ctx, -10, -7); ctx.beginPath(); ctx.moveTo(1.6, -10.4); ctx.bezierCurveTo(5, -10.3, 7.6, -8.6, 8.6, -7.2); ctx.lineTo(2.2, -7.2); ctx.closePath(); ctx.fill();
    reflejo(ctx, 4.6, -10, -7.4, 0.7);
    ctx.restore();
    // The headlight in front, red tail lights at the back
    const [luz, halo] = cola ? ['#ff3a5a', '#ff2e4a'] : ['#fffbe6', '#ffffff'];
    brilla(ctx, halo, cola ? 4 : 6, () => { ctx.fillStyle = luz; ctx.beginPath(); ctx.ellipse(10.6, -3.9, 0.9, 0.4, -0.5, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  };
  return {
    id, nombre, lema, humo: null, luz: { dx: 11, dy: -3.8 },
    frente: punta,
    /**
     * The last car: the front car turned around. Its centre is the last wagon's place in the train, but it
     * is longer than a wagon, so it is drawn 3 art units back to keep the same gap to the wagon ahead.
     */
    cola(ctx, x, y, { giro = 0 } = {}) {
      ctx.save(); ctx.translate(x - 3, y); ctx.scale(-1, 1);
      punta(ctx, 0, 0, { giro: -giro, cola: true });
      ctx.restore();
    },
    vagon(ctx, x, y, carga = 1, giro = 0) {
      ctx.save(); ctx.translate(x, y);
      caja(ctx, -8, -2.6, 16, 1.4, 0.4, OSCURO);
      bogies(ctx, [-5.8, -3, 3, 5.8], giro);
      cuerpo(ctx, () => ctx.roundRect(-8, -11.2, 16, 8.8, [1.4, 1.4, 0.4, 0.4]), metal(ctx));
      rayas(ctx, -8, 16);
      ctx.fillStyle = vidrio(ctx, -9.6, -7.2); ctx.beginPath(); ctx.roundRect(-7.2, -9.4, 14.4, 2, 0.8); ctx.fill();
      ventanas(ctx, [-6.6, -3.4, -0.2, 3], -9.1, 1.4, 2.4, 0.5);
      ctx.restore();
      ctx.restore();
    },
  };
}
/** The bullet train's colors: the same design, painted differently. */
export const BALAS = [
  { id: 'bala', nombre: 'Plata', tinte: [200, 205, 230], franja: '#ff2e88', filo: '#2ee6d6' },
  { id: 'bala-perla', nombre: 'Perla', tinte: [246, 242, 252], franja: '#2ee6d6', filo: '#5b2ea6' },
  { id: 'bala-grafito', nombre: 'Grafito', tinte: [104, 98, 134], franja: '#ffd23f', filo: '#ff2e88' },
  { id: 'bala-rubi', nombre: 'Rubí', tinte: [236, 64, 108], franja: '#fff6e0', filo: '#ffd23f' },
  { id: 'bala-oro', nombre: 'Oro', tinte: [240, 196, 104], franja: '#5b2ea6', filo: '#ff2e88' },
  { id: 'bala-menta', nombre: 'Menta', tinte: [96, 222, 196], franja: '#5b2ea6', filo: '#fff6e0' },
  { id: 'bala-lila', nombre: 'Lila', tinte: [176, 140, 255], franja: '#ffd23f', filo: '#2ee6d6' },
].map(c => balaDe({ ...c, lema: `Tren bala ${c.nombre.toLowerCase()}.` }));
export const TRENES = Object.fromEntries(BALAS.map(t => [t.id, t]));
