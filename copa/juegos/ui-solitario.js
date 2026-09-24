/**
 * ⚓ Batalla Naval: Solitario — pantalla. Las jugadas son { marcas, fallidas, resuelto, rendido }.
 *
 * Los números de filas y columnas van dentro de la misma grilla CSS, como una fila y una
 * columna más (C-8): así no se desalinean en ningún navegador. Al terminar, la flota se
 * dibuja con el pixel art de Batalla Naval.
 */
import * as motor from './solitario.js';
import { barcoEn, FONDO_AGUA } from '../../batalla-naval/flota.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  const j = ctx.jugadas && Array.isArray(ctx.jugadas.marcas) ? ctx.jugadas : null;
  let marcas = j ? j.marcas.slice() : motor.marcasIniciales(p);
  let fallidas = j?.fallidas || 0;
  let resuelto = !!j?.resuelto, rendido = !!j?.rendido;
  let aviso = null;
  const fijas = new Set(p.pistas.map(q => q.r * p.n + q.c));
  const total = p.flota.reduce((s, f) => s + f.size, 0);
  const guardar = () => ctx.guardar({ marcas, fallidas, resuelto, rendido });

  const dibujar = () => {
    raiz.innerHTML = '';
    const fin = resuelto || rendido;
    const caja = el('div', { class: 'stack solitario-juego' });
    const { fil, col } = motor.cuentas(p, marcas);
    const grilla = el('div', { class: 'sol-grid' + (fin ? ' fin' : ''), style: `grid-template-columns: repeat(${p.n}, 1fr) auto; --agua: ${FONDO_AGUA}` });
    for (let r = 0; r < p.n; r++) {
      for (let c = 0; c < p.n; c++) {
        const i = r * p.n + c;
        const v = marcas[i];
        const cls = ['sc', v === motor.AGUA ? 'agua' : '', v === motor.BARCO ? 'barco' : '', fijas.has(i) ? 'fija' : ''];
        const celda = el('button', {
          type: 'button', class: cls.filter(Boolean).join(' '), 'data-i': i, disabled: fin || fijas.has(i),
          'aria-label': `${r + 1}-${c + 1}`,
          onClick: () => { SFX.tap(); marcas = motor.tocar(p, marcas, i); aviso = null; guardar(); dibujar(); },
        });
        if (fin) {
          const svg = barcoEn(p.layout, r, c);
          if (svg) { celda.classList.add('real'); celda.append(svg); }
        }
        grilla.append(celda);
      }
      grilla.append(el('span', { class: 'lbl' + (fil[r] === p.filas[r] ? ' completo' : fil[r] > p.filas[r] ? ' pasado' : '') }, String(p.filas[r])));
    }
    for (let c = 0; c < p.n; c++) grilla.append(el('span', { class: 'lbl' + (col[c] === p.cols[c] ? ' completo' : col[c] > p.cols[c] ? ' pasado' : '') }, String(p.cols[c])));
    grilla.append(el('span', { class: 'lbl' }));
    poner(caja, grilla);
    const puestos = marcas.filter(v => v === motor.BARCO).length;
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.shipsLeft, { m: puestos, t: total })));
    if (aviso) poner(caja, aviso);
    if (fin) {
      poner(caja, el('div', { class: 'aviso ' + (resuelto ? 'bien' : 'mal') }, resuelto ? `🎉 ${T.checkOk}` : T.gaveUp),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar({ resuelto, fallidas }); } }, ctx.textoFin || T.seeResults));
    } else {
      poner(caja, el('button', {
        class: 'btn btn--yellow', id: 'btn-revisar', disabled: puestos !== total,
        onClick: () => {
          if (motor.errores(p, marcas) === 0) {
            resuelto = true; SFX.sink(); vibrate([30, 60, 30]);
          } else {
            fallidas++; SFX.error(); vibrate([40, 40, 40]);
            aviso = el('div', { class: 'aviso mal shake' }, T.checkBad);
          }
          guardar(); dibujar();
        },
      }, puestos === total ? T.check : fmt(T.shipsLeft, { m: puestos, t: total })),
      el('button', {
        class: 'btn btn--ghost btn--sm', id: 'btn-rendirse',
        onClick: () => { if (!confirm(T.giveUpConfirm)) return; rendido = true; SFX.siren(); guardar(); dibujar(); },
      }, T.giveUp));
    }
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
