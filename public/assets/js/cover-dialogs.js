/**
 * A game's cover with two buttons and two dialogs (the owner, 2026-11-14; lab: #seccion-cover-dialogs,
 * flag `cover-dialogs`). Under the start action the cover keeps one row of two equal buttons:
 * «📖 Instrucciones», which opens the steps in a dialog, and «👤 Entrar» (or «🏅 <name>» once signed
 * in), which opens the ranking's sign-in (or the account) in another. The rankings stay open below.
 * «🏠 Volver al menú» leaves the cover (the top bar's ‹ Menú already goes there), and on every game
 * screen the top bar loses the game's name chip, with ‹ Menú as tall as the icons beside it.
 *
 * It works on the cover as each game already draws it, for every game (C-21): the shared cover of
 * cup/game.js and the six games with their own (#screen-intro). The steps are the cover's own
 * «Cómo se juega» panel and the sign-in is the ranking's own block (`bloqueJugador`), moved into the
 * dialogs as they are, so they keep working (signing in, changing the PIN, signing out).
 */
import { el } from './ui.js';
import { COMMON, getLang } from './i18n.js';
import { leerYo } from './jugador.js';
import { flag } from './flags.js';

const ON = 'portada-v2';
let encendido = null;
/** Whether this visitor gets the new cover: read once per page. */
const activo = () => (encendido ??= flag('cover-dialogs').catch(() => false));

/** The top bar on every game screen: no game name chip, ‹ Menú 44 px tall (CSS under body.portada-v2). */
export async function gameTopBar() {
  if (await activo()) document.body.classList.add(ON);
}

/**
 * A centred dialog over the page, built from the bottom sheet's pieces (.hoja-capa, .hoja). It lives
 * in the page from the start, hidden, as the folded «Cómo se juega» panel did: the steps stay in the
 * page's text (the FAQ's structured data is that text, structured-data.mjs). In <body>, not in the
 * cover: a screen's entrance animation leaves a transform that would pin a fixed layer to it.
 */
function ventana({ id, titulo, cuerpo, T }) {
  document.querySelectorAll(`.portada-ventana[data-v="${id}"]`).forEach(x => x.remove());   // a cover drawn again
  const h2 = el('h2', { id: `${id}-titulo` }, titulo);
  const cerrarBtn = el('button', { type: 'button', class: 'icon-btn portada-cerrar', 'aria-label': T.cerrar }, '✕');
  const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${id}-titulo`, id },
    el('div', { class: 'hoja-cabeza' }, h2, cerrarBtn), cuerpo);
  const capa = el('div', { class: 'hoja-capa portada-ventana', 'data-v': id, hidden: true }, el('div', { class: 'hoja-fondo' }), panel);
  document.body.append(capa);
  let antes = null, fijo = null;
  const onKey = e => { if (e.key === 'Escape') cerrar(); };
  // The page behind does not scroll while the dialog is open: <body> is pinned where it was, as the
  // support sheet does (support.js), and put back on closing
  const fijar = () => {
    const y = scrollY;
    fijo = { y, style: document.body.getAttribute('style') };
    Object.assign(document.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  };
  const soltar = () => {
    if (!fijo) return;
    if (fijo.style === null) document.body.removeAttribute('style'); else document.body.setAttribute('style', fijo.style);
    scrollTo(0, fijo.y); fijo = null;
  };
  const cerrar = () => {
    if (capa.hidden) return;
    capa.hidden = true; soltar(); document.removeEventListener('keydown', onKey); antes?.focus?.();
  };
  // Any tap outside the dialog's panel closes it, the ✕ too
  capa.addEventListener('click', e => { if (!panel.contains(e.target)) cerrar(); });
  cerrarBtn.addEventListener('click', cerrar);
  const abrir = texto => {
    h2.textContent = texto;
    antes = document.activeElement;
    fijar();
    capa.hidden = false; document.addEventListener('keydown', onKey);
    cerrarBtn.focus();
  };
  return { abrir, cerrar };
}

/**
 * The cover's two buttons and their dialogs, if the flag is on. `raiz`: the cover's screen. Does
 * nothing on a cover with neither a «Cómo se juega» panel nor a sign-in block.
 */
export async function coverWithDialogs(raiz, { lang = getLang(), alTocar = () => {} } = {}) {
  if (!raiz || raiz.querySelector('.portada-acciones') || !(await activo())) return;
  document.body.classList.add(ON);
  const T = (COMMON[lang] || COMMON.es).portada;
  // The cover's «Cómo se juega»: the folded panel that is not the ranking's sign-in or account
  const como = [...raiz.querySelectorAll('details.panel')].find(d => !d.closest('.rk-jugador'));
  const yo = raiz.querySelector('.rk-jugador');
  if (!como && !yo) return;
  // «Volver al menú» goes: the top bar's ‹ Menú is the way back from a cover
  raiz.querySelector('#fin-salidas')?.remove();
  const fila = el('div', { class: 'opciones dos portada-acciones' });
  // Where the row goes: in place of «Cómo se juega», else of the sign-in
  (como || yo).before(fila);

  if (como) {
    const pasos = el('div', { class: 'stack portada-pasos' }, ...[...como.childNodes].filter(n => n.nodeName !== 'SUMMARY'));
    // Only the steps: the start button stays on the cover (the owner, 2026-11-14)
    const v = ventana({ id: 'portada-instrucciones', titulo: T.instrucciones, T, cuerpo: pasos });
    fila.append(el('button', { type: 'button', class: 'opcion', id: 'btn-instrucciones', 'aria-haspopup': 'dialog', onClick: () => { alTocar(); v.abrir(T.instrucciones); } }, el('b', {}, T.instrucciones)));
    como.remove();
  }
  if (yo) {
    const caja = el('div', { class: 'portada-cuenta' });
    const boton = el('button', { type: 'button', class: 'opcion', id: 'btn-cuenta', 'aria-haspopup': 'dialog' });
    const v = ventana({ id: 'portada-cuenta', T, cuerpo: caja });
    // Signed in, the button carries the name; not yet, «Entrar» in the cyan of signing in
    const titulo = () => { const p = leerYo(); return p ? `🏅 ${p.n}` : T.entrar; };
    const pintar = () => {
      boton.classList.toggle('portada-entrar', !leerYo());
      boton.replaceChildren(el('b', {}, titulo()));
      // signing in or out inside the open dialog renames it too: «👤 Entrar» becomes «🏅 <name>»
      document.getElementById('portada-cuenta-titulo')?.replaceChildren(titulo());
      // the block redraws itself on signing in or out: its panel stays open inside the dialog
      yo.querySelectorAll('details').forEach(d => { d.open = true; });
    };
    boton.addEventListener('click', () => { alTocar(); v.abrir(titulo()); });
    fila.append(boton);
    caja.append(yo);
    pintar();
    new MutationObserver(pintar).observe(yo, { childList: true });
  }
}
