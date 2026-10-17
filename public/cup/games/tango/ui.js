/**
 * ☀️ Tango — pantalla. Como el Tango de LinkedIn: un toque pone un sol, otro una luna, otro
 * limpia. Las casillas dadas no se tocan. Las marcas = y ≠ van sobre el borde entre dos
 * casillas. Lo que rompe una regla se ve en rojo, pero no en el acto: para poner una luna hay
 * que pasar por el sol, y ese sol de paso no debe acusar nada. El choque se marca recién cuando
 * el jugador toca otra casilla (o borra todo o pide pista), sin apuro de reloj: igual que lo
 * cuenta el puntaje (motor.estado), así lo rojo es exactamente lo que se cobra (#135). Con el
 * tablero lleno no queda otra casilla que tocar: ahí el choque se muestra, sin sonar ni contarse,
 * para que el jugador vea qué arreglar.
 * Either way the red, its sound and the counter wait ROJO_MS (1.5 s) after the tap that brings them.
 *
 * Además (D-103): **borrar todo**, que pide un segundo toque para confirmar; una **pista** que
 * revela una casilla y cuesta 15 puntos, también con segundo toque; y **consejos** para cuando
 * uno se queda atascado. Las jugadas son los índices tocados, 'C' (borrar todo) y { h } (pista).
 * ↩️ Undo (D-342) takes back the last tap or Clear all, one per tap; it is a play too ('U'), so an
 * error already counted stays counted and a hint stays revealed.
 */
import * as motor from './engine.js';
import { botonDeshacer } from '../deshacer.js';

const ICONO = { [motor.SOL]: '☀️', [motor.LUNA]: '🌙' };
const CLASE = { [motor.SOL]: 'sol', [motor.LUNA]: 'luna' };
/** Los dos emojis son amarillos: la casilla de noche y la luna plateada los separan (D-146). */
const icono = (el, v) => el('span', { class: `tan-ico ${CLASE[v]}` }, ICONO[v]);
const CONFIRMAR_MS = 3000;
/** A clash turns red (and sounds) this long after it would count, so the player can finish the thought. */
const ROJO_MS = 1500;

/**
 * El dibujo de las reglas, como el de Reinas (D-134): un tablero de 6 × 6 resuelto, con una
 * marca = y una ≠ que se cumplen, y al lado tres soles seguidos, que no valen. Se entiende
 * mirando antes de leer. Mismas casillas y marcas que el tablero de verdad, en chico.
 */
const EJ_FILAS = ['SSLSLL', 'SLSLSL', 'LSLSLS', 'LLSLSS', 'SLLSSL', 'LSSLLS'];
const EJ_MARCAS = [{ a: 0, b: 1, t: '=' }, { a: 14, b: 20, t: 'x' }];

function tableroEjemplo(el, n, valores, marcas = [], choque = false) {
  const g = el('div', { class: 'tan-ej', 'aria-hidden': 'true', style: `grid-template-columns: repeat(${n}, 1fr)` });
  valores.forEach((v, i) => {
    const celda = el('span', { class: `${CLASE[v]}${choque ? ' choque' : ''}` }, icono(el, v));
    for (const m of marcas) {
      if (m.a !== i) continue;
      celda.append(el('i', { class: `${m.b === i + 1 ? 'der' : 'abajo'} ${m.t === '=' ? 'igual' : 'distinto'}` }, m.t === '=' ? '=' : '≠'));
    }
    g.append(celda);
  });
  return g;
}

export function ejemplo({ el, T }) {
  const bien = EJ_FILAS.join('').split('').map(c => (c === 'S' ? motor.SOL : motor.LUNA));
  return el('div', { class: 'rej-ejemplo' },
    el('figure', {}, tableroEjemplo(el, 6, bien, EJ_MARCAS), el('figcaption', {}, `✅ ${T.tangoExOk}`)),
    el('figure', {}, tableroEjemplo(el, 3, [motor.SOL, motor.SOL, motor.SOL], [], true), el('figcaption', {}, `❌ ${T.tangoExBad}`)));
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let armado = null;          // qué acción espera su segundo toque: 'borrar' | 'pista'
  let armadoTimer = null;
  let visto = new Set();      // cells already painted red
  let erroresVistos = 0;      // the error count already shown
  let rojoTimer = null, sonar = false;
  const { n } = p;

  const avisar = () => { SFX.error(); vibrate([40, 40, 40]); };

  const jugar = j => {
    const antes = motor.estado(p, jugadas);
    jugadas.push(j); ctx.guardar(jugadas);
    const x = motor.estado(p, jugadas);
    // Dejó atrás una casilla en choque: ahora sí cuenta, y ahora se ve y suena
    const dejado = antes.pendiente >= 0 && antes.pendiente !== j;
    // The red and its sound wait ROJO_MS: see dibujar
    if (dejado) sonar = true;
    if (x.fin) { sonar = false; SFX.win(); vibrate([30, 50, 30]); }
    else SFX.tap();
    dibujar();
  };

  /** Un botón que pide confirmación con un segundo toque (el primero solo lo arma). */
  // Armed, a button keeps the width it had: its long phrase does not push it down a line, so the
  // confirming tap lands on it and not on ↩️ Undo, which would take its place (as in Reinas, D-283)
  let anchoArmado = 0;
  const conConfirmacion = (clave, rotulo, rotuloArmado, accion, attrs = {}) => el('button', {
    type: 'button', class: 'btn btn--ghost btn--sm' + (armado === clave ? ' armado' : ''), ...attrs,
    style: armado === clave && anchoArmado ? `flex: 0 0 ${anchoArmado}px` : null,
    onClick: ev => {
      if (armado === clave) { armado = null; clearTimeout(armadoTimer); accion(); return; }
      armado = clave; anchoArmado = ev.currentTarget.getBoundingClientRect().width; SFX.tap(); vibrate(15);
      clearTimeout(armadoTimer);
      armadoTimer = setTimeout(() => { armado = null; if (raiz.isConnected) dibujar(false, false); }, CONFIRMAR_MS);
      dibujar(false, false);
    },
  }, armado === clave ? rotuloArmado : rotulo);

  const revelar = () => {
    rojoTimer = null;
    if (!raiz.isConnected) return;
    if (sonar) { sonar = false; avisar(); }
    dibujar(true);
  };

  const dibujar = (ahora = false, reiniciar = true) => {
    const e = motor.estado(p, jugadas);
    // El último toque rompió una regla, pero todavía se perdona si se vuelve a tocar la misma
    // casilla: no se cuenta ni se pinta lo que trajo ese toque, solo lo que ya estaba en rojo.
    // Con el tablero lleno sí se pinta, porque ya no hay otra casilla que tocar.
    let mal = e.mal, errores = e.errores;
    if (e.pendiente >= 0) {
      errores--;
      if (!e.g.every(Boolean)) {
        const previo = motor.estado(p, jugadas.slice(0, -1)).mal;
        mal = new Set([...e.mal].filter(i => previo.has(i)));
      }
    }
    // A new red cell waits ROJO_MS (restarted by each tap) before it is painted and counted on screen
    if (ahora || e.fin || [...mal].every(i => visto.has(i))) {
      clearTimeout(rojoTimer); rojoTimer = null;
      // Fixed (or cleared) before the red showed: a clash already counted still sounds, now
      if (sonar && !ahora) { sonar = false; if (errores > erroresVistos) avisar(); }
      visto = mal; erroresVistos = errores;
    } else {
      // Arming a two-tap button is not a cell tap: it does not restart the wait
      if (reiniciar || !rojoTimer) { clearTimeout(rojoTimer); rojoTimer = setTimeout(revelar, ROJO_MS); }
      visto = new Set([...mal].filter(i => visto.has(i)));
      mal = visto; errores = erroresVistos;
    }
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.(e);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack tango-juego' });
    const grilla = el('div', { class: 'tan-grid' + (e.fin ? ' fin' : ''), 'data-tablero': 'tango', style: `grid-template-columns: repeat(${n}, 1fr)` });
    for (let i = 0; i < n * n; i++) {
      const v = e.g[i];
      const dada = motor.esDada(p, i), revelada = e.fijas.has(i);
      const celda = el('button', {
        type: 'button', class: 'tan' + (dada ? ' dada' : '') + (revelada ? ' revelada' : '') + (mal.has(i) ? ' choque' : ''),
        'data-i': i, 'data-v': v, disabled: dada || revelada || e.fin,
        'aria-label': `${Math.floor(i / n) + 1}-${(i % n) + 1}`,
        onClick: () => { armado = null; jugar(i); },
      }, v ? icono(el, v) : '');
      for (const m of p.marcas) {
        if (m.a !== i) continue;
        // Igual (=) o distinto (≠), sobre el borde que comparten las dos casillas
        celda.append(el('span', { class: `tan-marca ${m.b === i + 1 ? 'der' : 'abajo'} ${m.t === '=' ? 'igual' : 'distinto'}`, 'aria-hidden': 'true' }, m.t === '=' ? '=' : '≠'));
      }
      grilla.append(celda);
    }
    if (e.fin) {
      caja.append(el('div', { class: 'aviso bien' }, `🎉 ${T.tangoOk}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
    }
    caja.append(grilla);
    if (mal.size && !e.fin) caja.append(el('div', { class: 'aviso mal' }, T.tangoClash));
    if (errores || e.pistas) caja.append(el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.tangoCount, { e: errores, p: e.pistas })));
    if (!e.fin) {
      caja.append(el('div', { class: 'btn-row tango-acciones' },
        // Undo is not a cell tap: it neither sounds a clash nor restarts the red wait's count
        botonDeshacer({ el, T, SFX, vibrate, puede: e.deshacibles > 0, alDeshacer: () => {
          armado = null; clearTimeout(armadoTimer);
          jugadas.push(motor.DESHACER); ctx.guardar(jugadas); dibujar();
        } }),
        conConfirmacion('borrar', `🧹 ${T.clearAll}`, T.clearAllSure, () => { SFX.splash(); jugar(motor.BORRAR); }, { id: 'btn-borrar' }),
        conConfirmacion('pista', `💡 ${fmt(T.hintCost, { n: motor.COSTO_PISTA })}`, fmt(T.hintSure, { n: motor.COSTO_PISTA }), () => {
          const i = motor.pista(p, e.g, e.fijas);
          if (i < 0) return;
          SFX.reveal(); jugar({ h: i });
        }, { id: 'btn-pista' })),
        el('details', { class: 'panel tips' },
          el('summary', {}, `🧭 ${T.tipsTitle}`),
          el('ul', {}, T.tangoTips.map(t => el('li', {}, t)))));
    }
    raiz.append(caja);
  };
  dibujar(true);
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
