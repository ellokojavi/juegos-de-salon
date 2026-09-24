/**
 * ⏳ Línea Relámpago — pantalla. Las jugadas son los huecos elegidos, en orden.
 */
import * as motor from './linea.js';
import { anioLabel } from './anio.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let hueco = null;
  let aviso = null;

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack linea-juego' });
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, `${p.temaEmoji} ${p.temaNombre}`));
    if (e.actual) {
      poner(caja, el('div', { class: 'carta actual pop' },
        el('small', { class: 'muted' }, fmt(T.cardOf, { i: e.marcas.length + 1, n: p.mano.length })),
        el('span', { class: 'carta-emoji' }, e.actual.emoji), el('b', {}, e.actual.texto)));
    }
    if (aviso) poner(caja, aviso);
    const linea = el('div', { class: 'linea' });
    const slot = at => el('button', {
      type: 'button', class: 'hueco' + (hueco === at ? ' on' : ''), 'data-at': at, 'aria-label': T.placeHere, disabled: !e.actual,
      onClick: () => { SFX.tap(); hueco = hueco === at ? null : at; aviso = null; dibujar(); },
    }, hueco === at ? `⬇ ${T.placeHere}` : '＋');
    e.linea.forEach((c, i) => {
      if (e.actual) linea.append(slot(i));
      linea.append(el('div', { class: 'carta' + (c.ok === true ? ' ok' : c.ok === false ? ' mal' : ''), 'data-year': c.year },
        el('span', { class: 'anio' }, anioLabel(c.year)), el('span', { class: 'carta-emoji' }, c.emoji), el('span', {}, c.texto)));
    });
    if (e.actual) linea.append(slot(e.linea.length));
    poner(caja, linea);
    if (e.actual) {
      poner(caja, el('div', { class: 'flota-btn' }, el('button', {
        class: 'btn btn--yellow', id: 'btn-colocar', disabled: hueco === null,
        onClick: () => {
          const carta = e.actual;
          const ok = motor.correcto(e.linea, carta, hueco);
          jugadas.push(hueco);
          ctx.guardar(jugadas);
          if (ok) { SFX.reveal(); aviso = el('div', { class: 'aviso bien' }, `✅ ${anioLabel(carta.year)}`); }
          else {
            SFX.error(); vibrate([40, 40, 40]);
            const l2 = motor.estado(p, jugadas).linea;
            const i = l2.findIndex(c => c.id === carta.id);
            const antes = l2[i - 1], despues = l2[i + 1];
            aviso = el('div', { class: 'aviso mal shake' }, fmt(T.wentWrong, { c: carta.texto, y: anioLabel(carta.year) }),
              antes || despues ? ` ${[antes && fmt(T.wentAfter, { c: antes.texto, y: anioLabel(antes.year) }), despues && fmt(antes ? T.wentBefore : T.wentBeforeSolo, { c: despues.texto, y: anioLabel(despues.year) })].filter(Boolean).join(T.wentJoin)}.` : '');
          }
          hueco = null;
          dibujar();
        },
      }, hueco === null ? T.pickSlot : `${T.placeHere} · ${e.actual.emoji} ${e.actual.texto}`)));
    } else {
      // Al terminar, el cierre va arriba de la línea: tiene que verse sin desplazar (C-8)
      caja.insertBefore(el('div', { class: 'stack' },
        el('div', { class: 'aviso bien' }, `${e.aciertos} / ${p.mano.length}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)), linea);
    }
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${e.aciertos}/${e.marcas.length}` });
