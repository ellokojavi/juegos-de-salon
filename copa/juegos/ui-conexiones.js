/**
 * 🔗 Conexiones — pantalla. Las jugadas son los intentos (cada uno, cuatro palabras).
 */
import * as motor from './conexiones.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.map(x => x.slice()) : [];
  let orden = p.orden.slice();
  let sel = [];
  let aviso = null;
  // Los grupos ya mostrados no se vuelven a animar: la pantalla se redibuja en cada toque y la
  // animación de entrada los hacía parpadear (reporte del laboratorio). Solo el recién resuelto la lleva.
  const mostrados = new Set();

  const barajar = () => {
    for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
  };

  const grupo = g => {
    const nuevo = !mostrados.has(g.nivel);
    mostrados.add(g.nivel);
    return el('div', { class: `grupo nivel${g.nivel}` + (nuevo ? ' pop' : ''), 'data-nivel': g.nivel },
      el('b', {}, g.nombre), el('span', {}, g.palabras.join(' · ')));
  };

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack conexiones-juego' });
    const resueltos = e.fin ? [...e.resueltos, ...p.grupos.map(g => g.nivel).filter(n => !e.resueltos.includes(n))] : e.resueltos;
    poner(caja, el('div', { class: 'grupos' }, resueltos.map(n => grupo(p.grupos[n]))));
    if (!e.fin) {
      const quedan = orden.filter(w => e.restantes.includes(w));
      poner(caja, el('div', { class: 'palabras' }, quedan.map(w => el('button', {
        type: 'button', class: 'palabra' + (sel.includes(w) ? ' on' : '') + (w.length > 9 ? ' larga' : ''), 'aria-pressed': sel.includes(w) ? 'true' : 'false',
        onClick: () => {
          SFX.tap(); aviso = null;
          if (sel.includes(w)) sel = sel.filter(x => x !== w);
          else if (sel.length < 4) sel = [...sel, w];
          dibujar();
        },
      }, w))));
      const vidas = motor.ERRORES - e.errores;
      poner(caja, el('p', { class: 'muted center vidas', style: 'margin:0' }, `${fmt(T.mistakesLeft, { n: vidas })} ${'●'.repeat(vidas)}${'○'.repeat(e.errores)}`));
      if (aviso) poner(caja, aviso);
      poner(caja, el('div', { class: 'btn-row' },
        el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); barajar(); dibujar(); } }, T.shuffle),
        el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-limpiar', disabled: !sel.length, onClick: () => { SFX.tap(); sel = []; aviso = null; dibujar(); } }, T.deselect)));
      poner(caja, el('button', {
        class: 'btn btn--yellow', id: 'btn-confirmar', disabled: sel.length !== 4,
        onClick: () => {
          if (motor.repetido(jugadas, sel)) { aviso = el('div', { class: 'aviso' }, T.alreadyTried); SFX.tap(); dibujar(); return; }
          jugadas.push(sel.slice());
          ctx.guardar(jugadas);
          const e2 = motor.estado(p, jugadas);
          if (e2.resueltos.length > e.resueltos.length) { SFX.reveal(); vibrate(30); aviso = null; sel = []; }
          else {
            SFX.error(); vibrate([40, 40, 40]);
            aviso = el('div', { class: 'aviso mal shake' }, motor.aUna(p, sel) ? T.oneAway : T.wrongGroup);
          }
          dibujar();
        },
      }, sel.length === 4 ? `${T.confirm} · ${sel.join(', ')}` : T.select4));
    } else {
      poner(caja, el('div', { class: 'aviso ' + (e.perdio ? 'mal' : 'bien') }, e.perdio ? T.groupsFail : `🎉 ${T.groupsOk}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
    }
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
