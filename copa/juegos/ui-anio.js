/**
 * 📅 ¿En qué año? — pantalla. Las jugadas son los años respondidos (negativos: a. C.).
 */
import * as motor from './anio.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let escrito = '';
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
      el('div', { class: 'anio-entry' }, escrito || el('span', { class: 'muted' }, T.yearPh), ac ? el('small', {}, ` ${T.bc}`) : null));
    const teclado = el('div', { class: 'teclado' });
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', T.bc, '0', '⌫']) {
      teclado.append(el('button', {
        type: 'button', class: 'tecla' + (d === T.bc ? ' ac' + (ac ? ' on' : '') : '') + (d === '⌫' ? ' borrar' : ''), 'data-k': d,
        disabled: d === '⌫' ? !escrito : d === T.bc ? false : escrito.length >= 4 || (d === '0' && !escrito),
        onClick: () => {
          SFX.tap();
          if (d === '⌫') escrito = escrito.slice(0, -1);
          else if (d === T.bc) ac = !ac;
          else escrito += d;
          dibujar();
        },
      }, d));
    }
    poner(caja, teclado);
    const valor = escrito ? (ac ? -Number(escrito) : Number(escrito)) : null;
    poner(caja, el('button', {
      class: 'btn btn--yellow', id: 'btn-anio', disabled: valor === null,
      onClick: () => {
        jugadas.push(valor);
        ctx.guardar(jugadas);
        escrito = ''; ac = false;
        revelado = jugadas.length - 1;
        const pts = motor.puntos(h.year, valor);
        if (pts >= 80) SFX.reveal(); else if (pts >= 20) SFX.tap(); else SFX.error();
        dibujar();
      },
    }, valor === null ? T.yearPh : `${T.confirm} · ${motor.anioLabel(valor)}`));
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/${e.filas.length * 100}` });
