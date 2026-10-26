/**
 * 🚂 Tren en Vilo — the bullet train's colors (lab, owner's request 2026-10-25): one crossing at the
 * game's size that changes color each pass, and each color up close, the whole train with a nose at both
 * ends, with a button to play with it (`?style=neon&train=<id>`).
 */
import { el } from '../../../assets/js/ui.js';
import { BALAS } from '../trains.js';

const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoja = document.getElementById('hoja');

/** A canvas `alto` CSS pixels high, sized to its box. */
function lienzo(alto) {
  const c = el('canvas', {});
  c._ajustar = () => {
    const dpr = devicePixelRatio || 1, w = c.clientWidth || 340;
    c.width = Math.round(w * dpr); c.height = Math.round(alto * dpr); c.style.height = `${alto}px`;
    c._w = w; c._h = alto; c._dpr = dpr;
  };
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
/** The whole train as the game places it: the front car at x, a wagon 20 art units back, the tail 37 back. */
function tren(ctx, t, x, y, giro) {
  t.cola(ctx, x - 37, y, { giro: giro + 2 }); t.vagon(ctx, x - 20, y, 1, giro + 1); t.frente(ctx, x, y, { giro });
}
/** The headlight's soft cone ahead of the train. */
function cono(ctx, t, x) {
  const g = ctx.createLinearGradient(x + t.luz.dx, 0, x + t.luz.dx + 26, 0);
  g.addColorStop(0, 'rgba(255,243,160,0.4)'); g.addColorStop(1, 'rgba(255,243,160,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + t.luz.dx, t.luz.dy - 0.8); ctx.lineTo(x + t.luz.dx + 26, t.luz.dy - 5); ctx.lineTo(x + t.luz.dx + 26, t.luz.dy + 5); ctx.lineTo(x + t.luz.dx, t.luz.dy + 0.8); ctx.closePath(); ctx.fill();
}

const cruza = lienzo(120);
hoja.append(el('section', { class: 'panel tren-op' }, el('h2', {}, 'Cruzando'), el('p', { class: 'muted', style: 'margin:0' }, 'Al tamaño del juego. Cambia de color en cada pasada.'), cruza));
cruza._ajustar();
const cuadros = BALAS.map(t => {
  const cerca = lienzo(130);
  hoja.append(el('section', { class: 'panel tren-op', id: `tren-${t.id}` },
    el('h2', {}, t.nombre), cerca,
    el('a', { class: 'btn btn--yellow', href: `../?style=neon&train=${t.id}` }, `🚄 Jugar con el ${t.nombre.toLowerCase()}`)));
  cerca._ajustar();
  return { t, cerca };
});

function cerca({ t, cerca: c }) {
  const ctx = c.getContext('2d'), W = c._w, H = c._h, piso = H - 22;
  ctx.setTransform(c._dpr, 0, 0, c._dpr, 0, 0);
  noche(ctx, W, H, piso);
  const k = W / 66;
  cubierta(ctx, W, piso, k);
  ctx.save(); ctx.translate(W / 2 + 19 * k, piso); ctx.scale(k, k);
  tren(ctx, t, 0, 0, 0);
  ctx.restore();
}
cuadros.forEach(cerca);

function pintar(ahora) {
  const ctx = cruza.getContext('2d'), W = cruza._w, H = cruza._h, piso = H - 30, k = 3;
  ctx.setTransform(cruza._dpr, 0, 0, cruza._dpr, 0, 0);
  noche(ctx, W, H, piso); cubierta(ctx, W, piso, k);
  const vuelta = W / k + 80, d = QUIETO ? W / k * 0.8 : (ahora / 1000) * 16;
  const x = d % vuelta - 20 + 60, t = BALAS[Math.floor(d / vuelta) % BALAS.length];
  ctx.save(); ctx.translate(0, piso); ctx.scale(k, k);
  cono(ctx, t, x); tren(ctx, t, x, 0, x * 0.44);
  ctx.restore();
  if (!QUIETO) requestAnimationFrame(pintar);
}
requestAnimationFrame(pintar);
addEventListener('resize', () => { cruza._ajustar(); cuadros.forEach(q => { q.cerca._ajustar(); cerca(q); }); });
