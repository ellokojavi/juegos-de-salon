/**
 * 📅 ¿En qué año? — pantalla. El año se escribe con el teclado de Toque y Fama (D-102), con un
 * interruptor aparte para antes de Cristo. Las jugadas son los años respondidos (negativos: a. C.).
 */
import * as motor from './anio.js';
import { teclado, CIFRAS } from '../../assets/js/teclado.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let ac = false;
  let revelado = null;

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack anio-juego' });
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, `${p.temaEmoji} ${p.temaNombre}`));
    if (revelado !== null) {
      const f = e.filas[revelado];
      poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.yearOf, { i: revelado + 1, n: p.hitos.length })),
        el('div', { class: 'carta actual' }, el('span', { class: 'carta-emoji' }, f.hito.emoji), el('b', {}, f.hito.texto)),
        el('div', { class: 'aviso ' + (f.pts >= 50 ? 'bien' : 'mal') }, `${motor.marca(f.hito.year, f.r)} ${fmt(T.yearWas, { v: motor.anioLabel(f.hito.year), pts: f.pts })}`),
        el('p', { class: 'muted center' }, `${T.yearPh}: ${motor.anioLabel(f.r)}`),
        e.fin
          ? el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)
          : el('button', { class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => { SFX.tap(); revelado = null; dibujar(); } }, T.next));
      poner(raiz, caja);
      return;
    }
    if (e.fin) { revelado = e.filas.length - 1; dibujar(); return; }
    const h = e.actual;
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.yearOf, { i: e.filas.length + 1, n: p.hitos.length })),
      el('div', { class: 'carta actual pop' }, el('span', { class: 'carta-emoji' }, h.emoji), el('b', {}, h.texto)),
      el('div', { class: 'seg anio-era' },
        el('button', { type: 'button', class: ac ? '' : 'on', 'aria-pressed': ac ? 'false' : 'true', onClick: () => { SFX.tap(); ac = false; dibujar(); } }, T.dc),
        el('button', { type: 'button', id: 'btn-ac', class: ac ? 'on' : '', 'aria-pressed': ac ? 'true' : 'false', onClick: () => { SFX.tap(); ac = true; dibujar(); } }, T.bc)),
      teclado({
        largo: 4, teclas: CIFRAS, submitLabel: T.confirmShort,
        valido: v => v.length >= 1 && v[0] !== '0',
        puede: (v, d) => v.length < 4 && !(v.length === 0 && d === '0'),
        onSubmit: v => {
          const valor = ac ? -Number(v) : Number(v);
          jugadas.push(valor);
          ctx.guardar(jugadas);
          ac = false;
          revelado = jugadas.length - 1;
          const pts = motor.puntos(h.year, valor);
          if (pts >= 80) SFX.reveal(); else if (pts >= 20) SFX.tap(); else SFX.error();
          dibujar();
        },
      }));
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/${e.filas.length * 100}` });
