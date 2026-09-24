/**
 * 🎲 ¿Dudo o le creo? — pantalla. Las jugadas son las elecciones ('dudo' | 'creo'), en orden.
 */
import * as motor from './dudo.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let eleccion = null;
  let revelado = null;

  const dado = (v, { chico = false, on = false, off = false } = {}) => el('span', {
    class: ['die', v === 1 ? 'ace' : '', chico ? 'die--sm' : '', on ? 'on' : '', off ? 'off' : ''].filter(Boolean).join(' '), 'aria-label': String(v),
  }, ...PIPS[v].map(pos => el('i', { style: `grid-area:${Math.ceil(pos / 3)}/${((pos - 1) % 3) + 1}` })));
  const cuenta = (m, v) => v === m.apuesta.p || (m.apuesta.p !== 1 && v === 1);

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack dudo-juego' });
    const i = revelado !== null ? revelado : e.filas.length;
    const m = p.manos[i];
    if (!m) { revelado = e.filas.length - 1; dibujar(); return; }
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.handOf, { i: i + 1, n: p.manos.length })),
      el('div', { class: 'panel center' },
        el('p', { class: 'muted', style: 'margin:0 0 6px' }, T.bid),
        el('div', { class: 'apuesta' }, el('b', {}, String(m.apuesta.n)), '×', dado(m.apuesta.p)),
        el('p', { class: 'lead', style: 'margin:8px 0 0' }, fmt(T.tableDice, { n: m.total }))),
      el('div', { class: 'panel center' },
        el('p', { class: 'muted', style: 'margin:0 0 6px' }, T.yourDice),
        el('div', { class: 'dice-row' }, m.mios.map(v => dado(v, { on: revelado !== null && cuenta(m, v) })))));

    if (revelado !== null) {
      const f = e.filas[revelado];
      poner(caja, 
        el('div', { class: 'otros' }, m.otros.map(o => el('div', { class: 'dice-row' }, o.map(v => dado(v, { chico: true, on: cuenta(m, v), off: !cuenta(m, v) }))))),
        el('div', { class: 'aviso ' + (f.mejor ? 'bien' : 'mal') },
          fmt(T.thereWere, { n: f.hay, v: f.cierta ? T.trueWord : T.falseWord }), ' ',
          fmt(T.chanceWas, { p: Math.round(motor.creible(m) * 100), pts: f.pts })),
        e.fin && revelado === e.filas.length - 1
          ? el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)
          : el('button', { class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => { SFX.tap(); revelado = null; eleccion = null; dibujar(); } }, T.next));
    } else {
      const opcion = (valor, rotulo) => el('button', {
        type: 'button', class: 'opcion' + (eleccion === valor ? ' on' : ''), 'data-e': valor, 'aria-pressed': eleccion === valor ? 'true' : 'false',
        onClick: () => { SFX.tap(); eleccion = valor; dibujar(); },
      }, el('b', {}, rotulo));
      poner(caja, el('div', { class: 'opciones dos' }, opcion('dudo', T.doubt), opcion('creo', T.believe)),
        el('button', {
          class: 'btn btn--yellow', id: 'btn-decidir', disabled: !eleccion,
          onClick: () => {
            jugadas.push(eleccion);
            ctx.guardar(jugadas);
            revelado = jugadas.length - 1;
            SFX.dice();
            dibujar();
          },
        }, eleccion ? `${T.confirm} · ${eleccion === 'dudo' ? T.doubt : T.believe}` : `${T.doubt} / ${T.believe}`));
    }
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/${e.filas.length * 100}` });
