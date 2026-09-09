/**
 * Transiciones compartidas para juegos de "pasar el celular":
 *  - showHandoff(stages, onDone): overlay con etapas; tocar fuera de un botón avanza.
 *  - passStage({ label, name, button, onAdvance }): etapa "Pásale el celular a X" con botón.
 *  - showCover({ label, name, button, onReveal }): pantalla opaca "toca para ver" (rol privado).
 * Los textos se pasan desde cada juego (i18n). Estilos en assets/css/base.css (.handoff, .cover).
 */
import { el, vibrate } from './ui.js';

export function showHandoff(stages, onDone, { tapAdvances = true } = {}) {
  const box = document.getElementById('handoff');
  box.hidden = false; box.className = 'handoff'; box.innerHTML = '';
  let i = 0;
  const next = () => {
    if (i >= stages.length) { box.classList.add('leaving'); setTimeout(() => { box.hidden = true; box.innerHTML = ''; onDone && onDone(); }, 300); return; }
    const stage = stages[i++];
    box.innerHTML = ''; box.append(stage); vibrate(15);
    if (stage.setAdvance) stage.setAdvance(next);
  };
  box.onclick = tapAdvances ? (e => { if (!e.target.closest('button')) next(); }) : null;
  next();
  return next;
}

/** Bloque "Pásale el celular a X" con botón. Se puede usar solo o anidado en otra etapa. */
export function passBlock({ label, name, button, onAdvance, small = false }) {
  let adv = onAdvance || null;
  const block = el('div', { class: 'stage pop' },
    el('div', { class: 'phone', style: small ? 'font-size:3rem' : '' }, '📱'),
    el('div', { class: 'hint', style: 'font-size:1.05rem' }, label),
    el('div', { class: 'next-name', style: small ? 'font-size:clamp(2.4rem, 12vw, 3.6rem)' : '' }, name),
    el('button', { class: 'btn btn--cyan', onClick: e => { e.stopPropagation(); adv && adv(); } }, button),
  );
  block.setAdvance = fn => { adv = fn; };
  return block;
}

export function showCover({ label, name, button, onReveal }) {
  const c = document.getElementById('cover');
  c.hidden = false; c.innerHTML = '';
  c.append(el('div', {}, el('div', { class: 'eye' }, '🙈'), el('div', { class: 'hint', style: 'color:var(--muted);font-weight:800' }, label), el('div', { class: 'big' }, name),
    el('button', { class: 'btn btn--cyan', style: 'margin-top:18px', onClick: () => { c.hidden = true; onReveal && onReveal(); } }, button)));
}
