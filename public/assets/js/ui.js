/**
 * Utilidades de interfaz compartidas: partículas de fondo, confeti, vibración,
 * wake lock (que no se apague la pantalla) y helpers de DOM.
 */
import { canShare, shareLink, compartir, comparteArchivos, EMOJI_OSCUROS } from './compartir.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/**
 * Emojis que se dibujan casi negros (〰️, el de Zip) y sobre el fondo morado no se ven: donde van
 * solos, sobre fondo oscuro, llevan un contorno claro (`.emoji-claro` en base.css). Es el mismo
 * emoji; dentro de un botón amarillo o de un texto para compartir queda tal cual.
 */
export { EMOJI_OSCUROS }; // vive en compartir.js: la imagen que se comparte también los aclara
export const claseEmoji = e => (EMOJI_OSCUROS.includes(e) ? 'emoji-claro' : '');
/** Una clase más la del emoji, si le toca: `con('trophy pop', J.emoji)`. */
export const con = (clase, e) => [clase, claseEmoji(e)].filter(Boolean).join(' ');
/** "〰️ Zip" como nodos: el emoji en su propio span, para que el contorno no tome el texto. */
export const conEmoji = (e, texto) => [el('span', { class: con('', e) }, e), ` ${texto}`];

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function vibrate(pattern = 30) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) { /* sin soporte */ }
}

/** Fondo con partículas flotantes, estilo luces de fiesta. */
export function sparkles(count = 18) {
  if (document.querySelector('.bg-sparkles')) return;
  const wrap = el('div', { class: 'bg-sparkles', 'aria-hidden': 'true' });
  const colors = ['#ffd23f', '#ff2e88', '#2ee6d6', '#9dff3a', '#8a4dff'];
  for (let i = 0; i < count; i++) {
    const s = el('span');
    const size = 4 + Math.random() * 10;
    s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;background:${pick(colors)};animation-duration:${12 + Math.random() * 18}s;animation-delay:-${Math.random() * 20}s;`;
    wrap.append(s);
  }
  document.body.prepend(wrap);
}

/** Mantiene la pantalla encendida mientras se juega (si el navegador lo permite). */
export async function keepAwake() {
  try {
    if ('wakeLock' in navigator) {
      let lock = await navigator.wakeLock.request('screen');
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          try { lock = await navigator.wakeLock.request('screen'); } catch (_) { /* ignorar */ }
        }
      });
    }
  } catch (_) { /* sin soporte o denegado */ }
}

/** Lluvia de confeti sobre toda la pantalla. */
export function confetti({ duration = 2500, count = 160 } = {}) {
  let canvas = document.getElementById('confetti');
  if (!canvas) {
    canvas = el('canvas', { id: 'confetti' });
    document.body.append(canvas);
  }
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ['#ffd23f', '#ff2e88', '#2ee6d6', '#9dff3a', '#8a4dff', '#ff7a1a', '#ffffff'];
  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
    w: 6 + Math.random() * 8, h: 8 + Math.random() * 10,
    vx: -2 + Math.random() * 4, vy: 3 + Math.random() * 5,
    rot: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4,
    color: pick(colors),
  }));
  const start = performance.now();
  function frame(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.05;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t - start < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  requestAnimationFrame(frame);
}

// Compartir vive en compartir.js (D-165); se reexporta para los que ya lo importan de aquí
export { canShare, shareLink };

/**
 * El ícono de compartir de los sistemas operativos (una caja abierta con una flecha hacia arriba),
 * dibujado en SVG con el color del texto: un emoji se ve distinto en cada celular (D-242).
 */
const ICONO_COMPARTIR = '<svg class="icon-share" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg>';

/**
 * Botón redondo de la barra de arriba para compartir un link. Donde hay diálogo nativo
 * abre el del sistema; donde no, copia y lo avisa cambiando el ícono por un ✅ dos segundos,
 * que se entiende sin traducir y no mueve nada de lugar en la barra. Con `imagen` (una función
 * que da el archivo, o `null`), donde el celular manda archivos va la imagen junto al texto
 * (D-226); en un computador no se descarga nada: se copia el texto, como siempre.
 */
export function shareButton({ title, text, url, label, imagen }) {
  const btn = el('button', { type: 'button', class: 'icon-btn', title: label, 'aria-label': label });
  btn.innerHTML = ICONO_COMPARTIR;
  btn.addEventListener('click', async () => {
    if (btn.textContent === '✅') return;
    const archivo = imagen && comparteArchivos() ? await imagen() : null;
    const r = archivo ? await compartir({ titulo: title, texto: text, url, imagen: archivo }) : await shareLink({ title, text, url });
    if (r !== 'copied') return;
    btn.textContent = '✅';
    setTimeout(() => { btn.innerHTML = ICONO_COMPARTIR; }, 2000);
  });
  return btn;
}
