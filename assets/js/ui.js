/**
 * Utilidades de interfaz compartidas: partículas de fondo, confeti, vibración,
 * wake lock (que no se apague la pantalla) y helpers de DOM.
 */

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
