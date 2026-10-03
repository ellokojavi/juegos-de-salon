/**
 * El teclado de Toque y Fama, compartido (D-102).
 *
 * Salió de toque-y-fama/game.js para que La Copa use el mismo: las casillas de arriba, las
 * teclas, borrar y confirmar, y las **notas**: un toque largo sobre una tecla la tacha (🚫) y
 * deja de escribirse, para descartar cifras o letras que ya se sabe que no van. Un toque
 * normal sobre una tachada solo la sacude. Nada de esto sabe de las reglas del juego: qué es
 * un valor válido y qué tecla se puede agregar lo dice quien lo usa.
 *
 * Los estilos están en assets/css/teclado.css.
 */
import { el, vibrate } from './ui.js';
import { SFX } from './sound.js';

const LONG_PRESS_MS = 450;

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
 */
export function teclado({ largo, teclas, valido, puede, onSubmit, submitLabel, columnas = 3, acciones = 'fin', hidden = false, notes = null, onNotesChange = null }) {
  let value = '';
  const boxes = Array.from({ length: largo }, () => el('div', { class: 'box' }));
  const entry = el('div', { class: 'entry' }, ...boxes);
  const keys = [];
  const ok = el('button', { class: 'ok', disabled: true, onClick: () => { if (valido(value)) { SFX.tap(); const v = value; value = ''; refresh(); onSubmit(v); } } }, submitLabel);
  const del = el('button', { class: 'del', 'aria-label': '⌫', onClick: () => { value = value.slice(0, -1); SFX.tap(); refresh(); } }, '⌫');
  const refresh = () => {
    boxes.forEach((b, i) => { b.textContent = value[i] || ''; b.className = 'box' + (value[i] ? ' filled' : '') + (hidden && value[i] ? ' hidden-digit' : '') + (i === value.length ? ' active' : ''); });
    keys.forEach(k => { const d = k.dataset.d; const blocked = notes ? notes.has(d) : false; k.classList.toggle('blocked', blocked); k.disabled = !blocked && !puede(value, d); });
    ok.disabled = !valido(value);
  };
  const key = d => {
    let timer = null, longPressed = false;
    const b = el('button', { 'data-d': d,
      onClick: () => {
        if (longPressed) { longPressed = false; return; }
        if (notes && notes.has(d)) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); vibrate([20, 30, 20]); return; }
        if (puede(value, d)) { value += d; vibrate(8); SFX.tap(); refresh(); }
      },
      onPointerdown: () => {
        if (!notes) return;
        timer = setTimeout(() => {
          timer = null; longPressed = true;
          if (notes.has(d)) notes.delete(d); else { notes.add(d); value = value.split(d).join(''); }
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
  for (const d of teclas) keys.push(key(d));
  const pad = acciones === 'fin'
    ? el('div', { class: 'keypad' }, ...keys.slice(0, -1), del, keys[keys.length - 1], ok)
    : el('div', { class: 'keypad keypad--letras', style: `grid-template-columns: repeat(${columnas}, 1fr)` }, ...keys, del, ok);
  refresh();
  return el('div', {}, entry, pad);
}

/** Las diez cifras en el orden del teclado de Toque y Fama: 1 a 9 y el 0 al final. */
export const CIFRAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
