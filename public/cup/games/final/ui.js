/**
 * 🏁 La Gran Final — pantalla. One round per game of the week (D-418), each with its game's screen.
 * Las jugadas son { ronda, sub: { <ronda>: jugadas }, hechas: { <ronda>: true }, pts, t0 }: `pts` keeps
 * the score of each round played whole (a game without a short version), taken from its own
 * `resultado()` when it ends, and `t0` when it started on the final's clock, so a game that scores
 * its time counts only its own round.
 *
 * Antes de cada ronda se explica cómo se juega (LIG-36).
 */
import * as final from './engine.js';
import * as linea from '../timeline/engine.js';
import * as numero from '../number/engine.js';
import * as reinas from '../queens/engine.js';
import * as letras from '../word/engine.js';
import * as anio from '../year/engine.js';
import * as uiLinea from '../timeline/ui.js';
import * as uiNumero from '../number/ui.js';
import * as uiReinas from '../queens/ui.js';
import * as uiLetras from '../word/ui.js';
import { leerJugadas } from '../number/ui.js';
import * as uiAnio from '../year/ui.js';
import { juegosCopa, rondasFinal, conVariante } from '../../rules.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

const UI = { linea: uiLinea, numero: uiNumero, reinas: uiReinas, letras: uiLetras, anio: uiAnio };

/** El estado de una ronda corta a partir de sus jugadas (lo que cada pantalla le pasa a `terminar`). */
const ESTADO = {
  linea: (p, j) => linea.estado(p, Array.isArray(j) ? j : []),
  numero: (p, j) => numero.estado(p, leerJugadas(j).i, final.NUMERO_INTENTOS),
  reinas: (p, j) => reinas.estado(p, j || []),
  letras: (p, j) => letras.estado(p, leerJugadas(j).i),
  anio: (p, j) => anio.estado(p, j || []),
};

const rondasDe = p => (Array.isArray(p?.rondas) ? p.rondas : final.RONDAS);

/** The result so far: `{ rondas, pts }` with the rounds finished, for the score and the card. */
export function estados(p, jugadas) {
  const rondas = rondasDe(p), pts = {};
  for (const r of rondas) {
    if (!jugadas?.hechas?.[r]) continue;
    pts[r] = ESTADO[r] ? final.puntosRonda[r](ESTADO[r](p[r], jugadas.sub?.[r])) : jugadas.pts?.[r] || 0;
  }
  return { rondas, pts };
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  const JUEGOS_COPA = juegosCopa(ctx.lang), RONDAS_FINAL = rondasFinal(ctx.lang);
  const rondas = rondasDe(p), n = rondas.length;
  const j = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? ctx.jugadas : {};
  const J = { ronda: j.ronda || 0, sub: { ...(j.sub || {}) }, hechas: { ...(j.hechas || {}) }, pts: { ...(j.pts || {}) }, t0: { ...(j.t0 || {}) }, jugando: !!j.jugando };
  const guardar = () => ctx.guardar(J);
  const ficha = r => conVariante(JUEGOS_COPA[r], p[r]?.variante ?? null) || JUEGOS_COPA[r];
  const ahora = () => ctx.tiempo?.() ?? 0;

  const intro = () => {
    raiz.innerHTML = '';
    const r = rondas[J.ronda];
    const M = ficha(r);
    const lleva = Object.values(estados(p, J).pts).reduce((a, b) => a + b, 0);
    poner(raiz, el('div', { class: 'stack' },
      el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.roundOf, { i: J.ronda + 1, n })),
      el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, M.emoji), el('h2', { class: 'display display--md' }, M.nombre)),
      el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay),
        RONDAS_FINAL[r] ? el('p', {}, RONDAS_FINAL[r]) : el('ol', { class: 'como' }, M.como.map(x => el('li', {}, x))),
        // A game played whole says how it scores, as each short round's text does (U-18)
        RONDAS_FINAL[r] ? null : [el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, M.puntaje)]),
      J.ronda > 0 ? el('p', { class: 'muted center' }, fmt(T.finalSoFar, { pts: lleva, max: J.ronda * 100 })) : null,
      el('button', { class: 'btn btn--yellow', id: 'btn-ronda', onClick: () => {
        SFX.tap(); J.jugando = true; if (!ESTADO[r] && J.t0[r] === undefined) J.t0[r] = ahora(); guardar(); ronda();
      } }, `${M.emoji} ${T.roundStart}`)));
  };

  const ronda = () => {
    raiz.innerHTML = '';
    const r = rondas[J.ronda];
    const M = ficha(r);
    const corta = !!ESTADO[r];
    const mod = corta ? UI[r] : ctx.juegos?.[r];
    const caja = el('div', { class: 'final-ronda' });
    poner(raiz, el('p', { class: 'muted center', style: 'margin:0 0 8px' }, `${fmt(T.roundOf, { i: J.ronda + 1, n })} · ${M.emoji} ${M.nombre}`), caja);
    const ultima = J.ronda === n - 1;
    // A game played whole scores with its own result (0 to 100) the moment its board ends (D-150)
    const puntos = e => (corta ? final.puntosRonda[r](e) : mod.resultado(e).s);
    const anotar = e => { if (!corta && e) J.pts[r] = puntos(e); };
    if (!corta) ctx.pantallaCompleta?.(mod.pantallaCompleta);
    // Solo la última ronda detiene el reloj de la final (D-130), y con ella sale el resultado de
    // todas (D-150). A game played whole in an earlier round only keeps its score
    const pararReloj = ultima
      ? e => { anotar(e); const res = estados(p, J); ctx.pararReloj?.(e ? { ...res, pts: { ...res.pts, [r]: puntos(e) } } : undefined); }
      : corta ? undefined : e => { anotar(e); guardar(); };
    mod.montar(caja, {
      ...ctx,
      p: p[r],
      variante: p[r]?.variante ?? null,
      jugadas: J.sub[r],
      max: r === 'numero' ? final.NUMERO_INTENTOS : undefined,
      textoFin: ultima ? T.seeResults : T.roundNext,
      cierreAbajo: true, // en la final, el botón para seguir va debajo del tablero, en todas las rondas
      ...(corta ? {} : { tiempo: () => Math.max(0, ahora() - (J.t0[r] || 0)) }),
      pararReloj,
      guardar(x) { J.sub[r] = x; guardar(); },
      terminar(e) {
        anotar(e);
        J.hechas[r] = true;
        J.jugando = false;
        if (!corta) ctx.pantallaCompleta?.(false);
        if (ultima) { guardar(); ctx.terminar(estados(p, J)); return; }
        J.ronda++;
        guardar();
        intro();
      },
    });
  };

  if (J.jugando && J.ronda < n) ronda(); else intro();
}

export const resultado = res => {
  const s = final.puntaje(res);
  return { s, t: final.tarjeta(res), resumen: `${s}/100` };
};
