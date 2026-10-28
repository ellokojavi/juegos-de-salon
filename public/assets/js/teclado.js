/**
 * El teclado de Toque y Fama, compartido (D-102).
 *
 * Salió de bulls-and-cows/game.js para que La Copa use el mismo: las casillas de arriba, las
 * teclas, borrar y confirmar, y las **notas**: un toque largo sobre una tecla la tacha (🚫) y
 * deja de escribirse, para descartar cifras o letras que ya se sabe que no van. Un toque
 * normal sobre una tachada solo la sacude. Nada de esto sabe de las reglas del juego: qué es
 * un valor válido y qué tecla se puede agregar lo dice quien lo usa.
 *
 * Los estilos están en assets/css/teclado.css.
 */
import { el, vibrate } from './ui.js';
import { SFX } from './sound.js';

// El toque largo de las notas: lo usan también las marcas de Agentes
export const LONG_PRESS_MS = 450;

/**
 * @param {object} o
 * @param {number} o.largo                  cuántas casillas
 * @param {string[]} o.teclas               las teclas, en orden de dibujo
 * @param {(valor: string) => boolean} o.valido         si ya se puede confirmar
 * @param {(valor: string, tecla: string) => boolean} o.puede   si esa tecla se puede agregar
 * @param {(valor: string) => void} o.onSubmit
 * @param {string} o.submitLabel
 * @param {number} [o.columnas]             columnas de la grilla (3 para cifras)
 * @param {'fin'|'abajo'} [o.acciones]      cifras: borrar y confirmar entre las teclas, como
 *   siempre (⌫ 0 OK en la última fila); letras: en una fila propia abajo
 * @param {boolean} [o.hidden]              tapar lo escrito (el número secreto en un celular)
 * @param {Set<string>|null} [o.notes]      las teclas tachadas, si el juego tiene notas
 * @param {() => void} [o.onNotesChange]
 * @param {boolean} [o.elegir]              tapping a box chooses it: the next key goes there, not
 *   always to the right of what is written (#604; for everyone in Toque y Fama since D-409).
 *   `puede` then receives what is in the other boxes and the chosen box. It can also be turned
 *   on later with `activarElegir()` on the returned element.
 */
export function teclado({ largo, teclas, valido, puede, onSubmit, submitLabel, columnas = 3, acciones = 'fin', hidden = false, notes = null, onNotesChange = null, elegir: elegirAlInicio = false }) {
  // Una casilla por posición: con `elegir` puede quedar un hueco al medio
  let elegir = elegirAlInicio;
  const slots = Array(largo).fill('');
  let cursor = 0;
  const value = () => slots.join('');
  const firstEmpty = (from = 0) => { for (let k = 0; k < largo; k++) { const i = (from + k) % largo; if (!slots[i]) return i; } return from; };
  // Dónde va la próxima tecla: sin `elegir` y con todo lleno, ninguna (como antes, a la derecha)
  const at = () => (!elegir && slots.every(Boolean) ? largo : cursor);
  const others = () => slots.filter((x, i) => x && i !== at()).join('');
  const full = () => slots.every(Boolean);
  // Con `elegir` un hueco al medio no se confirma; sin él, lo escrito es siempre contiguo
  const listo = () => !marcando && (!elegir || full()) && valido(value());
  // Notes mode (#895, lab): a tap cycles the key's mark instead of typing it. The marks live in
  // `notes` too, so they persist wherever the strikes already do: a bare key is struck (✕), and
  // '?<key>' and '★<key>' are maybe and sure (they still type).
  let marcando = false;
  const marca = d => (notes?.has(d) ? 'x' : notes?.has('?' + d) ? '?' : notes?.has('★' + d) ? '★' : '');
  const boxes = Array.from({ length: largo }, (_, i) => el('div', { class: 'box', onClick: () => { if (!elegir) return; cursor = i; SFX.tap(); refresh(); } }));
  const entry = el('div', { class: 'entry' + (elegir ? ' entry--elegir' : '') }, ...boxes);
  const keys = [];
  const clear = () => { slots.fill(''); cursor = 0; };
  const ok = el('button', { class: 'ok', disabled: true, onClick: () => { if (listo()) { SFX.tap(); const v = value(); clear(); refresh(); onSubmit(v); } } }, submitLabel);
  const del = el('button', { class: 'del', 'aria-label': '⌫', onClick: () => {
    if (elegir && slots[cursor]) slots[cursor] = '';
    else { let i = elegir ? cursor - 1 : largo - 1; while (i >= 0 && !slots[i]) i--; if (i >= 0) { slots[i] = ''; cursor = i; } }
    if (!elegir) cursor = firstEmpty();
    SFX.tap(); refresh();
  } }, '⌫');
  const refresh = () => {
    boxes.forEach((b, i) => { b.textContent = slots[i]; b.className = 'box' + (slots[i] ? ' filled' : '') + (hidden && slots[i] ? ' hidden-digit' : '') + (i === cursor && !full() || elegir && i === cursor ? ' active' : ''); });
    keys.forEach(k => { const d = k.dataset.d; const m = marca(d); k.classList.toggle('blocked', m === 'x'); k.classList.toggle('mark-maybe', m === '?'); k.classList.toggle('mark-sure', m === '★'); k.disabled = !marcando && m !== 'x' && !puede(others(), d, at()); });
    ok.disabled = !listo(); del.disabled = marcando;
    pad?.classList.toggle('keypad--marcando', marcando);
  };
  const tachar = d => {
    notes.delete('?' + d); notes.delete('★' + d); notes.add(d);
    slots.forEach((x, i) => { if (x === d) slots[i] = ''; });
    if (!elegir) { const v = value(); slots.fill(''); [...v].forEach((x, i) => { slots[i] = x; }); }
    cursor = firstEmpty(elegir ? cursor : 0);
  };
  // none → ✕ → ? → ★ → none
  const ciclar = d => {
    const m = marca(d);
    notes.delete(d); notes.delete('?' + d); notes.delete('★' + d);
    if (m === '') tachar(d); else if (m === 'x') notes.add('?' + d); else if (m === '?') notes.add('★' + d);
  };
  let pad = null;
  const key = d => {
    let timer = null, longPressed = false;
    const b = el('button', { 'data-d': d,
      onClick: () => {
        if (longPressed) { longPressed = false; return; }
        if (marcando) { ciclar(d); vibrate(8); SFX.tap(); refresh(); onNotesChange && onNotesChange(); return; }
        if (notes && notes.has(d)) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); vibrate([20, 30, 20]); return; }
        if (puede(others(), d, at())) { slots[at()] = d; cursor = firstEmpty(cursor); vibrate(8); SFX.tap(); refresh(); }
      },
      onPointerdown: () => {
        if (!notes || marcando) return;
        timer = setTimeout(() => {
          timer = null; longPressed = true;
          if (notes.has(d)) notes.delete(d); else tachar(d);
          vibrate([30, 40, 30]); SFX.dice(); refresh(); onNotesChange && onNotesChange();
        }, LONG_PRESS_MS);
      },
      onPointerup: () => { if (timer) { clearTimeout(timer); timer = null; } },
      onPointerleave: () => { if (timer) { clearTimeout(timer); timer = null; } },
      onPointercancel: () => { if (timer) { clearTimeout(timer); timer = null; } },
      onContextmenu: e => { if (notes) e.preventDefault(); },
    }, d);
    return b;
  };
  // Una tecla `null` es un hueco: ocupa su lugar en la grilla y no se aprieta
  const celdas = teclas.map(d => (d === null ? el('span', { class: 'hueco', 'aria-hidden': 'true' }) : key(d)));
  for (const c of celdas) if (c.dataset.d !== undefined) keys.push(c);
  pad = acciones === 'fin'
    ? el('div', { class: 'keypad' }, ...celdas.slice(0, -1), del, celdas[celdas.length - 1], ok)
    : el('div', { class: 'keypad keypad--letras', style: `grid-template-columns: repeat(${columnas}, 1fr)` }, ...celdas, del, ok);
  refresh();
  const root = el('div', {}, entry, pad);
  /** Notes mode (#895): a ✏️ toggle under the keypad; `t` = { notes, typing, hint }. */
  root.activarMarcas = t => {
    if (!notes || root.querySelector('.marcas')) return;
    const hint = el('span', { class: 'marcas-hint', hidden: true }, t.hint);
    const btn = el('button', { type: 'button', class: 'marcas-toggle', 'aria-pressed': 'false', onClick: () => {
      marcando = !marcando; btn.textContent = marcando ? t.typing : t.notes; btn.setAttribute('aria-pressed', String(marcando)); hint.hidden = !marcando; SFX.tap(); refresh();
    } }, t.notes);
    root.append(el('div', { class: 'marcas' }, btn, hint));
  };
  root.activarElegir = () => { if (elegir) return; elegir = true; entry.classList.add('entry--elegir'); cursor = firstEmpty(); refresh(); };
  return root;
}

/** Las diez cifras en el orden del teclado de Toque y Fama: 1 a 9 y el 0 al final. */
export const CIFRAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
