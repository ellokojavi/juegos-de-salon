/**
 * La Copa — the day's result screen, loaded the first time it opens (#860).
 * Everything else it needs from game.js comes in `c`, the screen's context.
 */
import { $, con, el } from '../assets/js/ui.js';
import { SFX } from '../assets/js/sound.js';
import { abierto, activos, cerrado, comodinEfectivo, diaActual, esFinal, juegoDelDia, mmss, multiplicador, posicionesDelDia, tabla, terminada, tieneFinal } from './engine.js';
import { cabecera, laminaResultado, nombreArchivo, puntajeYTiempo } from '../assets/js/compartir.js';

let c;
let CON_RONDAS, G, L, S, T, ahora, avisos, bajoElPuntaje, botonReporte, cabCopa, claseX2, compartir, conBoton, detalle, explicacion, fmt, juegoDia, mensajeCopa, mostrar, nombreDe, ord, poner, tablero, urlPublica;

/** Draws it; `ctx` is game.js's context (its `let`s are read live). */
export function resultado(ctx, ...args) {
  c = ctx;
  ({ CON_RONDAS, G, L, S, T, ahora, avisos, bajoElPuntaje, botonReporte, cabCopa, claseX2, compartir, conBoton, detalle, explicacion, fmt, juegoDia, mensajeCopa, mostrar, nombreDe, ord, poner, tablero, urlPublica } = ctx);
  return pantallaResultado(...args);
}

function pantallaResultado(d, { recien = false, det = null } = {}) {
  const Lc = L(), { meta } = Lc;
  const mio = Lc.results?.[d]?.[S.yo];
  if (!mio) { tablero(); return; }
  S.verDia = d;
  mostrar('resultado');
  const id = juegoDelDia(meta, d), J = juegoDia(meta, d);
  const now = ahora();
  const jug = activos(Lc);
  const pos = posicionesDelDia(Lc.results[d], jug.map(j => j.pid));
  const n = Object.keys(pos).length;
  const x = multiplicador(Lc, d, S.yo, now);
  const wAuto = comodinEfectivo(Lc, S.yo, now);
  const autoAqui = wAuto.auto && wAuto.dia === d;
  const yo = pos[S.yo];
  const body = $('#resultado-body');
  body.innerHTML = '';
  const ranking = jug.filter(j => pos[j.pid]).sort((a, b) => pos[a.pid].pos - pos[b.pid].pos);
  poner(body, 
    el('div', { class: 'result-hero' },
      el('span', { class: con('trophy' + (recien ? ' pop' : ''), J.emoji) }, J.emoji),
      el('h2', { class: 'display display--md' }, fmt(T.resultTitle, { d, juego: J.nombre })),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, mio.r || String(mio.s)),
      ...bajoElPuntaje(mio.t, mio.ms, id)),
    el('p', { class: 'lead center' }, cerrado(meta, d, now) || terminada(meta, now)
      ? fmt(T.finalPos, { pos: ord(yo.pos), n, pts: yo.pts * x })
      : fmt(T.provisional, { pos: ord(yo.pos), n })),
    // The unused wildcard that landed here on its own says so, next to the points it doubled (D-444)
    autoAqui ? el('p', { class: 'ok center', id: 'comodin-auto' }, fmt(tieneFinal(meta) ? T.wildAutoNote : T.wildAutoNoteLast, { d })) : null,
    // The end-screen order (C-19): the way back to the board first, then share and the next-day
    // notice (share before the notice: the notice's card is tall and pushed share under the fold
    // in German and Portuguese at 320 px); the breakdown folded and the day table below (C-8)
    el('button', { class: 'btn btn--yellow', id: 'btn-volver', onClick: () => { SFX.tap(); S.verDia = null; tablero(); } }, T.toBoard),
    el('button', { class: 'btn btn--cyan', id: 'btn-tarjeta', onClick: ev => conBoton(ev, () => compartirResultado(d)) }, T.shareCard),
    // Ofrece avisar del próximo día que todavía no se abre: no siempre es d + 1 (un día viejo, o
    // jugado con el siguiente ya abierto)
    diaActual(meta, now) < meta.days && !terminada(meta, now) ? avisos().tarjeta({ dia: diaActual(meta, now) + 1 }) : null,
    explicacion(J, { s: mio.s, ms: mio.ms, det, x, final: esFinal(meta, d), auto: autoAqui && (tieneFinal(meta) ? 'final' : 'last') }),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.dayTable),
      el('div', { class: 'tabla' }, ranking.map(j => el('div', { class: 'fila' + (j.pid === S.yo ? ' yo' : '') },
        el('span', { class: 'lugar' }, `${pos[j.pid].pos}`),
        el('span', { class: 'flecha' }),
        // Quien usó el comodín (o todos, en la final) lleva "×2" junto al nombre: explica por qué
        // sus puntos no calzan con su lugar. El de la final va en otro color (D-151)
        el('div', { class: 'quien' }, multiplicador(Lc, d, j.pid, now) === 2
          ? el('div', { class: 'con-x2' }, el('b', {}, j.name), el('span', { class: `${claseX2(esFinal(meta, d))} md-x2` }, !esFinal(meta, d) && comodinEfectivo(Lc, j.pid, now).auto ? T.x2Auto : T.x2))
          : el('b', {}, j.name), el('small', { class: 'muted' }, `${Lc.results[d][j.pid].r || Lc.results[d][j.pid].s} · ⏱ ${mmss(Lc.results[d][j.pid].ms)}`),
          // En la final, las rondas de cada uno (⏳75 🔢85 …), para comparar ronda a ronda (#259)
          CON_RONDAS.includes(id) && Lc.results[d][j.pid].t ? el('small', { class: 'muted rondas' }, Lc.results[d][j.pid].t) : null),
        el('span', { class: 'total' }, `+${pos[j.pid].pts * multiplicador(Lc, d, j.pid, now)}`))))),
    botonReporte({ juego: id, dia: d }),
  );
}

/**
 * El resultado del día, completo (D-124) y con su imagen (D-165): la cabecera de la copa con el
 * día ("🏆 *La Copa: …* · Día 3 de 7"), el juego, quién lo jugó, cómo le fue y la tarjeta de
 * colores. La imagen dice lo mismo, en el mismo orden.
 */
async function compartirResultado(d) {
  const Lc = L(), { meta } = Lc;
  const mio = Lc.results[d][S.yo];
  const J = G().J[juegoDelDia(meta, d)];
  const cab = cabCopa('🏆', fmt(G().T.ctxDay, { d, n: meta.days }));
  const puntaje = mio.r || String(mio.s), tiempo = mmss(mio.ms);
  // El juego, quién, el puntaje, el tiempo y la tarjeta van en la imagen: el texto no los repite (D-171)
  const texto = mensajeCopa(cab);
  const imagen = await laminaResultado({
    cab, url: urlPublica(S.code), juego: J, nombre: nombreDe(S.yo), puntaje,
    detalle: puntajeYTiempo('', tiempo, mio.t), tarjeta: mio.t,
    archivo: nombreArchivo('copa', meta.alias || S.code, 'dia', d, nombreDe(S.yo)),
  });
  await compartir(texto, imagen);
}
