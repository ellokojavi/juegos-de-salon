/**
 * The profile's welcome (lab flag `profile`; the owner, 2026-11-22): a small bubble rises from the top bar's
 * profile pill and says the player's things now live there, only while a player is signed in. It stays, on every page with the pill, until the
 * player closes it or opens the profile; then it never comes back. The profile page itself greets the first
 * visit with its own card (profile.js `introCard`).
 *
 * `?profile-intro=demo` forgets both, to show them again.
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';
import { leerYo } from './jugador.js';
import { markVia } from './profile-usage.js';

export const BUBBLE_KEY = 'juegos-de-salon:profile-bubble';
export const INTRO_KEY = 'juegos-de-salon:profile-intro';

export const TEXTS = {
  es: { title: '🎖️ Tu perfil vive aquí', text: 'Tus logros, tus rankings y tus ajustes, en un solo lugar.', close: 'Cerrar' },
  en: { title: '🎖️ Your profile lives here', text: 'Your badges, your rankings and your settings, all in one place.', close: 'Close' },
  pt: { title: '🎖️ Seu perfil mora aqui', text: 'Suas conquistas, seus rankings e seus ajustes, em um só lugar.', close: 'Fechar' },
};

const ROOT = new URL('../../', import.meta.url);
const get = k => { try { return localStorage.getItem(k); } catch (_) { return '1'; } };
export const mark = k => { try { localStorage.setItem(k, String(Date.now())); } catch (_) { /* not kept */ } };

/** `?profile-intro=demo`: the bubble and the profile's card show again, as on a first visit. */
export function demoReset(loc = globalThis.location) {
  if (!/[?&]profile-intro=demo\b/.test(loc?.search || '')) return false;
  try { localStorage.removeItem(BUBBLE_KEY); localStorage.removeItem(INTRO_KEY); } catch (_) { /* nothing kept */ }
  return true;
}

/**
 * The bubble as wide as its text (the owner, 2026-11-22): a box with wrapped text keeps its widest width, so its
 * width is set to the longest line it ended up with, measured, plus its padding and the ✕.
 */
function fit(box, doc = document) {
  const txt = box.querySelector('.pf-bubble-txt');
  if (!txt) return;
  box.style.width = '';   // measured at its widest, every time: a second fit must not shrink the first
  // It may be mid-animation (scaled): lines are measured on screen, then brought back to its own size
  const box0 = txt.getBoundingClientRect(), left = box0.left, scale = box0.width ? txt.offsetWidth / box0.width : 1;
  let w = 0;
  for (const c of txt.children) {
    const r = doc.createRange();
    r.selectNodeContents(c);
    for (const q of r.getClientRects()) w = Math.max(w, q.right - left);
  }
  if (!w) return;
  w *= scale;
  const cs = getComputedStyle(box), x = box.querySelector('.pf-bubble-x');
  box.style.width = `${Math.ceil(w + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.columnGap || 0) + (x?.offsetWidth || 44)) + 1}px`;
}

/**
 * Shows the bubble under `pill` (an `a.pf-home`), once nothing else covers the page (a splash, a sheet).
 * Returns a function that removes it.
 */
export function pillBubble(pill, { doc = document, lang = getLang(), tries = 6 } = {}) {
  // Only for a signed-in player (the owner, 2026-11-23): a guest has no profile of their own to find yet
  if (!pill || !leerYo() || get(BUBBLE_KEY) || doc.getElementById('pf-bubble')) return () => {};
  const busy = () => doc.querySelector('.splash-capa, .hoja-capa, .globo-instalar, #pf-bubble');
  if (busy()) {
    if (tries > 0) setTimeout(() => pillBubble(pill, { doc, lang, tries: tries - 1 }), 2500);
    return () => {};
  }
  // Its stylesheet first: the bubble is measured to fit its text, which needs its own sizes
  if (!doc.getElementById('pf-bubble-css')) {
    const link = el('link', { rel: 'stylesheet', id: 'pf-bubble-css', href: new URL('assets/css/profile-hint.css', ROOT).href });
    link.addEventListener('load', () => pillBubble(pill, { doc, lang, tries }), { once: true });
    doc.head.append(link);
    return () => {};
  }
  const T = TEXTS[lang] || TEXTS.es;
  let box = null;
  const place = () => {
    if (!box || !pill.isConnected) return;
    const r = pill.getBoundingClientRect(), w = doc.documentElement.clientWidth;
    const right = Math.max(8, w - r.right);
    box.style.top = `${r.bottom + (doc.defaultView?.scrollY || 0) + 12}px`;
    box.style.right = `${right}px`;
    // The tail points at the pill's middle, whatever the pill's width
    box.style.setProperty('--tail', `${Math.max(16, w - right - (r.left + r.width / 2) - 8)}px`);
  };
  const close = () => {
    if (!box) return;
    mark(BUBBLE_KEY);
    const b = box; box = null;
    b.classList.add('fuera');
    setTimeout(() => b.remove(), 250);
    doc.defaultView?.removeEventListener('resize', place);
  };
  box = el('div', { class: 'pf-bubble', id: 'pf-bubble', role: 'status' },
    el('a', { class: 'pf-bubble-txt', href: pill.href, onClick: () => { mark(BUBBLE_KEY); markVia('bubble'); } }, el('b', {}, T.title), el('span', {}, T.text)),
    el('button', { type: 'button', class: 'pf-bubble-x', 'aria-label': T.close, title: T.close, onClick: close }, '✕'));
  doc.body.append(box);
  fit(box, doc);
  place();
  doc.fonts?.ready.then(() => { if (box) { fit(box, doc); place(); } });
  doc.defaultView?.addEventListener('resize', place);
  pill.addEventListener('click', () => mark(BUBBLE_KEY), { once: true });
  return close;
}
