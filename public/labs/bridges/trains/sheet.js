/**
 * 🚂 Tren en Vilo — the sheet of train designs (lab, owner's request 2026-10-25): each design from
 * trains.js (and the first neon train, to compare) up close and crossing a deck at the game's size, with
 * a button to play with it (`?style=neon&train=<id>`).
 */
import { el } from '../../../assets/js/ui.js';
import { TRENES } from '../trains.js';
import { CLASICO } from '../neon.js';

const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoja = document.getElementById('hoja');

/** A canvas `alto` CSS pixels high, drawn in art units at `k` CSS px each. */
function lienzo(alto) {
  const c = el('canvas', {});
  const ajustar = () => {
    const dpr = devicePixelRatio || 1, w = c.clientWidth || 340;
    c.width = Math.round(w * dpr); c.height = Math.round(alto * dpr); c.style.height = `${alto}px`;
    c._w = w; c._h = alto; c._dpr = dpr;
  };
  c._ajustar = ajustar;
  return c;
}
/** The night of the house: a gradient, a few stars, a far ridge. */
function noche(ctx, W, H, piso) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#12052a'); g.addColorStop(0.6, '#2a0c4e'); g.addColorStop(1, '#4a1a6e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let s = 0; s < 30; s++) { const a = Math.sin(s * 127.1) * 43758.5, b = Math.sin(s * 311.7) * 12345.6; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect((a - Math.floor(a)) * W, (b - Math.floor(b)) * piso * 0.7, 1.2, 1.2); }
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 6; x += 6) ctx.lineTo(x, piso - 18 - 14 * (0.5 + 0.3 * Math.sin(x * 0.02) + 0.2 * Math.sin(x * 0.05 + 2)));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = '#2e1258'; ctx.fill();
  ctx.fillStyle = '#170838'; ctx.fillRect(0, piso, W, H - piso);
}
/** The deck: a glowing yellow beam with its bolts, at `piso`, `k` px per art unit. */
function cubierta(ctx, W, piso, k) {
  ctx.save(); ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 6;
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.6 * k; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, piso + 0.8 * k); ctx.lineTo(W, piso + 0.8 * k); ctx.stroke(); ctx.restore();
  for (let x = 16 * k; x < W; x += 16 * k) { ctx.fillStyle = '#14081f'; ctx.beginPath(); ctx.arc(x, piso + 0.8 * k, 1.3 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(x, piso + 0.8 * k, 0.7 * k, 0, 7); ctx.fill(); }
}
/** The front car and two wagons, the front's bottom-centre at (x, y), in art units. */
function tren(ctx, t, x, y, giro) {
  t.vagon(ctx, x - 37, y, 1, giro + 2); t.vagon(ctx, x - 20, y, 1, giro + 1); t.frente(ctx, x, y, { giro });
}

const cuadros = [];
for (const t of [...Object.values(TRENES), CLASICO]) {
  const cerca = lienzo(170), cruza = lienzo(120);
  hoja.append(el('section', { class: 'panel tren-op', id: `tren-${t.id}` },
    el('h2', {}, t.nombre), el('p', { class: 'muted', style: 'margin:0' }, t.lema),
    cerca, cruza,
    el('a', { class: `btn ${t.id === 'clasico' ? 'btn--ghost' : 'btn--yellow'}`, href: `../?style=neon&train=${t.id}` }, `🚂 Jugar con ${t.nombre === 'Clásico' ? 'el clásico' : `el ${t.nombre}`}`)));
  cerca._ajustar(); cruza._ajustar();
  cuadros.push({ t, cerca, cruza });
}

function pintar(ahora) {
  for (const { t, cerca, cruza } of cuadros) {
    // Up close: the front car and a wagon, big
    let ctx = cerca.getContext('2d'), W = cerca._w, H = cerca._h, piso = H - 26;
    ctx.setTransform(cerca._dpr, 0, 0, cerca._dpr, 0, 0);
    noche(ctx, W, H, piso);
    const k = Math.min(7, W / 44);
    cubierta(ctx, W, piso, k);
    ctx.save(); ctx.translate(W / 2 + 8 * k, piso); ctx.scale(k, k);
    t.vagon(ctx, -20, 0, 1, 0); t.frente(ctx, 0, 0, { giro: 0 });
    ctx.restore();
    // Crossing, at about the game's size, slowly, over and over
    ctx = cruza.getContext('2d'); W = cruza._w; H = cruza._h; piso = H - 30;
    ctx.setTransform(cruza._dpr, 0, 0, cruza._dpr, 0, 0);
    noche(ctx, W, H, piso);
    const k2 = 3; cubierta(ctx, W, piso, k2);
    const vuelta = W / k2 + 80, x = QUIETO ? W / k2 * 0.7 : ((ahora / 1000) * 14) % vuelta - 20;
    ctx.save(); ctx.translate(0, piso); ctx.scale(k2, k2);
    if (t.luz) { const g = ctx.createLinearGradient(x + t.luz.dx, 0, x + t.luz.dx + 26, 0); g.addColorStop(0, 'rgba(255,243,160,0.4)'); g.addColorStop(1, 'rgba(255,243,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + t.luz.dx, t.luz.dy - 0.8); ctx.lineTo(x + t.luz.dx + 26, t.luz.dy - 5); ctx.lineTo(x + t.luz.dx + 26, t.luz.dy + 5); ctx.lineTo(x + t.luz.dx, t.luz.dy + 0.8); ctx.closePath(); ctx.fill(); }
    tren(ctx, t, x, 0, x * 0.44);
    ctx.restore();
  }
  if (!QUIETO) requestAnimationFrame(pintar);
}
requestAnimationFrame(pintar);
addEventListener('resize', () => cuadros.forEach(({ cerca, cruza }) => { cerca._ajustar(); cruza._ajustar(); }));
