/**
 * 🏁 La Gran Final — pantalla. Cinco rondas cortas, cada una con la pantalla de su minijuego.
 * Las jugadas son { ronda, sub: { <ronda>: jugadas }, hechas: { <ronda>: true } }.
 *
 * Antes de cada ronda se explica cómo se juega (LIG-36): en la Copa de 3 días la final
 * mezcla juegos que nadie ha visto.
 */
import * as final from './final.js';
import * as linea from './linea.js';
import * as numero from './numero.js';
import * as reinas from './reinas.js';
import * as letras from './letras.js';
import * as anio from './anio.js';
import * as uiLinea from './ui-linea.js';
import * as uiNumero from './ui-numero.js';
import * as uiReinas from './ui-reinas.js';
import * as uiLetras from './ui-letras.js';
import { leerJugadas } from './ui-numero.js';
import * as uiAnio from './ui-anio.js';
import { MINIJUEGOS, RONDAS_FINAL } from '../rules.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

const UI = { linea: uiLinea, numero: uiNumero, reinas: uiReinas, letras: uiLetras, anio: uiAnio };

/** El estado de una ronda a partir de sus jugadas (lo que cada pantalla le pasa a `terminar`). */
const ESTADO = {
  linea: (p, j) => linea.estado(p, Array.isArray(j) ? j : []),
  numero: (p, j) => numero.estado(p, leerJugadas(j).i, final.NUMERO_INTENTOS),
  reinas: (p, j) => reinas.estado(p, j || []),
  letras: (p, j) => letras.estado(p, leerJugadas(j).i),
  anio: (p, j) => anio.estado(p, j || []),
};

/** Los estados de las rondas terminadas, para el puntaje y la tarjeta. */
export function estados(p, jugadas) {
  const out = {};
  for (const r of final.RONDAS) if (jugadas?.hechas?.[r]) out[r] = ESTADO[r](p[r], jugadas.sub?.[r]);
  return out;
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  const j = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? ctx.jugadas : {};
  const J = { ronda: j.ronda || 0, sub: { ...(j.sub || {}) }, hechas: { ...(j.hechas || {}) }, jugando: !!j.jugando };
  const guardar = () => ctx.guardar(J);

  const intro = () => {
    raiz.innerHTML = '';
    const r = final.RONDAS[J.ronda];
    const M = MINIJUEGOS[r];
    const hechos = estados(p, J);
    const lleva = final.puntaje(hechos);
    poner(raiz, el('div', { class: 'stack' },
      el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.roundOf, { i: J.ronda + 1 })),
      el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, M.emoji), el('h2', { class: 'display display--md' }, M.nombre)),
      el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), el('p', {}, RONDAS_FINAL[r])),
      J.ronda > 0 ? el('p', { class: 'muted center' }, fmt(T.finalSoFar, { pts: lleva, max: J.ronda * 100 })) : null,
      el('button', { class: 'btn btn--yellow', id: 'btn-ronda', onClick: () => { SFX.tap(); J.jugando = true; guardar(); ronda(); } }, `${M.emoji} ${T.roundStart}`)));
  };

  const ronda = () => {
    raiz.innerHTML = '';
    const r = final.RONDAS[J.ronda];
    const caja = el('div');
    poner(raiz, el('p', { class: 'muted center', style: 'margin:0 0 8px' }, `${fmt(T.roundOf, { i: J.ronda + 1 })} · ${MINIJUEGOS[r].emoji} ${MINIJUEGOS[r].nombre}`), caja);
    const ultima = J.ronda === final.RONDAS.length - 1;
    UI[r].montar(caja, {
      ...ctx,
      p: p[r],
      jugadas: J.sub[r],
      max: r === 'numero' ? final.NUMERO_INTENTOS : undefined,
      textoFin: ultima ? T.seeResults : T.roundNext,
      cierreAbajo: true, // en la final, el botón para seguir va debajo del tablero, en todas las rondas
      // Solo la última ronda detiene el reloj de la final (D-130), y con ella sale el resultado
      // de las cinco (D-150)
      pararReloj: ultima ? e => ctx.pararReloj?.({ ...estados(p, J), [r]: e }) : undefined,
      guardar(x) { J.sub[r] = x; guardar(); },
      terminar() {
        J.hechas[r] = true;
        J.jugando = false;
        if (ultima) { guardar(); ctx.terminar(estados(p, J)); return; }
        J.ronda++;
        guardar();
        intro();
      },
    });
  };

  if (J.jugando) ronda(); else intro();
}

export const resultado = rondas => {
  const s = final.puntaje(rondas);
  return { s, t: final.tarjeta(rondas), resumen: `${s}/100` };
};
