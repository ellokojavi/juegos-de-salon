/**
 * ☀️ Tango — pantalla. Como el Tango de LinkedIn: un toque pone un sol, otro una luna, otro
 * limpia. Las casillas dadas no se tocan. Las marcas = y ≠ van sobre el borde entre dos
 * casillas. Lo que rompe una regla se ve en rojo en el acto.
 *
 * Además (D-103): **borrar todo**, que pide un segundo toque para confirmar; una **pista** que
 * revela una casilla y cuesta 15 puntos, también con segundo toque; y **consejos** para cuando
 * uno se queda atascado. Las jugadas son los índices tocados, 'C' (borrar todo) y { h } (pista).
 */
import * as motor from './tango.js';

const ICONO = { [motor.SOL]: '☀️', [motor.LUNA]: '🌙' };
const CLASE = { [motor.SOL]: 'sol', [motor.LUNA]: 'luna' };
/** Los dos emojis son amarillos: la casilla de noche y la luna plateada los separan (D-144). */
const icono = (el, v) => el('span', { class: `tan-ico ${CLASE[v]}` }, ICONO[v]);
const CONFIRMAR_MS = 3000;

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
  const { n } = p;

  const jugar = j => {
    const antes = motor.estado(p, jugadas);
    jugadas.push(j); ctx.guardar(jugadas);
    const x = motor.estado(p, jugadas);
    if (x.errores > antes.errores) { SFX.error(); vibrate([40, 40, 40]); }
    else if (x.fin) { SFX.win(); vibrate([30, 50, 30]); }
    else SFX.tap();
    dibujar();
  };

  /** Un botón que pide confirmación con un segundo toque (el primero solo lo arma). */
  const conConfirmacion = (clave, rotulo, rotuloArmado, accion, attrs = {}) => el('button', {
    type: 'button', class: 'btn btn--ghost btn--sm' + (armado === clave ? ' armado' : ''), ...attrs,
    onClick: () => {
      if (armado === clave) { armado = null; clearTimeout(armadoTimer); accion(); return; }
      armado = clave; SFX.tap(); vibrate(15);
      clearTimeout(armadoTimer);
      armadoTimer = setTimeout(() => { armado = null; if (raiz.isConnected) dibujar(); }, CONFIRMAR_MS);
      dibujar();
    },
  }, armado === clave ? rotuloArmado : rotulo);

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.();
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack tango-juego' });
    const grilla = el('div', { class: 'tan-grid' + (e.fin ? ' fin' : ''), style: `grid-template-columns: repeat(${n}, 1fr)` });
    for (let i = 0; i < n * n; i++) {
      const v = e.g[i];
      const dada = motor.esDada(p, i), revelada = e.fijas.has(i);
      const celda = el('button', {
        type: 'button', class: 'tan' + (dada ? ' dada' : '') + (revelada ? ' revelada' : '') + (e.mal.has(i) ? ' choque' : ''),
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
    if (e.mal.size && !e.fin) caja.append(el('div', { class: 'aviso mal' }, T.tangoClash));
    if (e.errores || e.pistas) caja.append(el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.tangoCount, { e: e.errores, p: e.pistas })));
    if (!e.fin) {
      caja.append(el('div', { class: 'btn-row tango-acciones' },
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
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
