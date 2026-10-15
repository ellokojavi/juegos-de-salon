/**
 * 📅 ¿En qué año? — pantalla. El año se escribe con el teclado de Toque y Fama (D-102), con un
 * interruptor aparte para antes de Cristo. Las jugadas son los años respondidos (negativos: a. C.).
 */
import * as motor from './engine.js';
import { teclado, CIFRAS } from '../../../assets/js/teclado.js';
import { bloqueDato, PAUSA_DATO_MS } from '../../../assets/js/dato.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let ac = false;
  let revelado = null;
  let seguir = null;   // termina la pausa del reloj mientras se lee el dato (D-277)
  const leido = () => { seguir?.(); seguir = null; };

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.(e);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack anio-juego' });
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, `${p.temaEmoji} ${p.temaNombre}`));
    if (revelado !== null) {
      const f = e.filas[revelado];
      poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.yearOf, { i: revelado + 1, n: p.hitos.length })),
        el('div', { class: 'carta actual' }, el('span', { class: 'carta-emoji' }, f.hito.emoji), el('b', {}, f.hito.texto)),
        el('div', { class: 'aviso ' + (f.pts >= 50 ? 'bien' : 'mal') }, `${motor.marca(f.hito.year, f.r)} ${fmt(f.pts === 1 ? T.yearWasOne : T.yearWas, { v: motor.anioLabel(f.hito.year, ctx.lang), pts: f.pts })}`),
        el('p', { class: 'muted center' }, `${T.yearAnswer}: ${motor.anioLabel(f.r, ctx.lang)}`),
        bloqueDato(el, f.hito.dato, { pausa: seguir ? PAUSA_DATO_MS : 0 }),
        e.fin
          ? el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)
          : el('button', { class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => { SFX.tap(); leido(); revelado = null; dibujar(); } }, T.next));
      poner(raiz, caja);
      return;
    }
    if (e.fin) { revelado = e.filas.length - 1; dibujar(); return; }
    const h = e.actual;
    // Switching the era changes the buttons and the label in place, so what was typed stays (no redraw)
    const botonEra = (bc, texto, id) => el('button', { type: 'button', ...(id ? { id } : {}), onClick: () => { SFX.tap(); ac = bc; marcarEra(); } }, texto);
    const btnDc = botonEra(false, T.dc), btnAc = botonEra(true, T.bc, 'btn-ac');
    const era = el('div', { class: 'seg anio-era' }, btnDc, btnAc);
    // With a. C. on, it shows next to the boxes too: four boxes alone read as "this year" (player feedback)
    const etiquetaEra = el('span', { class: 'anio-era-marca', 'aria-hidden': 'true' }, T.bc);
    const marcarEra = () => {
      for (const [b, on] of [[btnDc, !ac], [btnAc, ac]]) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
      etiquetaEra.hidden = !ac;
    };
    marcarEra();
    // The label goes inside the row of boxes, after the last one
    const conEra = kb => { kb.querySelector('.entry')?.append(etiquetaEra); return kb; };
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.yearOf, { i: e.filas.length + 1, n: p.hitos.length })),
      el('div', { class: 'carta actual pop' }, el('span', { class: 'carta-emoji' }, h.emoji), el('b', {}, h.texto)),
      p.ac === false ? null : era,
      conEra(teclado({
        largo: 4, teclas: CIFRAS, submitLabel: T.confirmShort,
        valido: v => v.length >= 1 && v[0] !== '0',
        puede: (v, d) => v.length < 4 && !(v.length === 0 && d === '0'),
        onSubmit: v => {
          const valor = ac ? -Number(v) : Number(v);
          jugadas.push(valor);
          ctx.guardar(jugadas);
          ac = false;
          revelado = jugadas.length - 1;
          // Con el año a la vista viene el dato del hito, y el reloj se pausa mientras se lee (D-277)
          if (h.dato && jugadas.length < p.hitos.length) seguir = ctx.pausa?.(PAUSA_DATO_MS) || null;
          const pts = motor.puntos(h.year, valor);
          if (pts >= 80) SFX.reveal(); else if (pts >= 20) SFX.tap(); else SFX.error();
          dibujar();
        },
      })));
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
