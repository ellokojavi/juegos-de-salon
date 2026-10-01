/**
 * 👑 Reinas — pantalla. Un toque pasa la casilla por vacía → reina → X → vacía (D-167); el toque
 * largo pone o saca una X para descartar la casilla (D-103), como las notas de Toque y Fama, y arrastrar desde una casilla vacía
 * pinta X en las vacías por donde pasa, para descartar una fila entera de una pasada (D-166). Las
 * zonas se distinguen solo por el color, con la misma línea fina entre todas las casillas, como en
 * el juego original. Las reinas que chocan se ven en rojo en el acto. Las jugadas son los toques,
 * en orden (`'c' + i` el toque; el largo y cada X pintada, en negativo).
 */
import * as motor from './reinas.js';

/**
 * Colores de zona: claros, para que la reina negra y la X se lean encima (contraste ≥ 9:1), y
 * lejos entre sí, porque las zonas se distinguen solo por el color (D-134). Entre los ocho primeros
 * (el tablero más grande es de 8 × 8) ningún par queda a menos de 17 de ΔE2000. Sin rojos: el
 * rojo es el de las reinas que chocan.
 */
export const ZONAS = ['#f6a96b', '#9ed48a', '#80aef5', '#ffe169', '#c9a2ec', '#ffa3c4', '#6fd3c8', '#e4e4e4', '#c9b48f', '#d7ef6e'];

const LARGO_MS = 450;

/** Las casillas entre `a` y `b` (sin `a`, con `b`): un arrastre rápido salta casillas entre dos movimientos. */
export function camino(n, a, b) {
  const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
  const pasos = Math.max(Math.abs(rb - ra), Math.abs(cb - ca));
  const out = [];
  for (let k = 1; k <= pasos; k++) out.push(Math.round(ra + ((rb - ra) * k) / pasos) * n + Math.round(ca + ((cb - ca) * k) / pasos));
  return out;
}

/**
 * El dibujo de las reglas: un tablero de 5 × 5 resuelto y, al lado, dos reinas que se tocan en
 * diagonal. Se entiende mirando antes de leer. Mismos colores que el tablero de verdad.
 */
const EJ_ZONAS = [
  0, 0, 1, 1, 1,
  0, 0, 1, 1, 2,
  3, 0, 0, 2, 2,
  3, 3, 4, 4, 2,
  3, 4, 4, 4, 2,
];
const EJ_REINAS = [1, 8, 10, 17, 24];

function tableroEjemplo(el, n, zonas, reinas, choque = false) {
  const g = el('div', { class: 'rej-ej', 'aria-hidden': 'true', style: `grid-template-columns: repeat(${n}, 1fr)` });
  zonas.forEach((z, i) => {
    const reina = reinas.includes(i);
    g.append(el('span', {
      class: reina && choque ? 'choque' : '',
      style: `background:${ZONAS[z % ZONAS.length]}`,
    }, reina ? '👑' : ''));
  });
  return g;
}

export function ejemplo({ el, T }) {
  return el('div', { class: 'rej-ejemplo' },
    el('figure', {}, tableroEjemplo(el, 5, EJ_ZONAS, EJ_REINAS), el('figcaption', {}, `✅ ${T.queensExOk}`)),
    el('figure', {}, tableroEjemplo(el, 2, [0, 0, 1, 1], [0, 3], true), el('figcaption', {}, `❌ ${T.queensExBad}`)));
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  const { n, zonas } = p;
  // El toque largo termina con un click del mismo gesto (al levantar el dedo) que no tiene que
  // poner una reina. Se traga ese click y nada más: cualquier gesto nuevo empieza limpio.
  let tragar = false;
  // El gesto en curso: dónde empezó, si pinta X (empezó en una casilla vacía) y si ya es arrastre.
  // Mientras se arrastra no se redibuja la grilla (se perdería el dedo): se tocan solo las casillas.
  let gesto = null;
  let marcas = [];

  const celdaEn = (x, y) => {
    const d = document.elementFromPoint(x, y)?.closest('.rej');
    return d && raiz.contains(d) ? +d.dataset.i : null;
  };
  /** Pinta la X en una casilla vacía durante el arrastre: es la misma jugada que el toque largo. */
  const pintarX = i => {
    if (marcas[i] !== motor.VACIO) return;
    jugadas.push(motor.toqueLargo(i)); ctx.guardar(jugadas);
    marcas[i] = motor.MARCA;
    const b = raiz.querySelector(`.rej[data-i="${i}"]`);
    if (b) { b.classList.add('marca'); b.textContent = '✕'; }
    vibrate(8);
  };
  const mover = ev => {
    if (!gesto || ev.pointerId !== gesto.id) return;
    const i = celdaEn(ev.clientX, ev.clientY);
    if (i === null || i === gesto.ultimo) return;
    // Salir de la casilla ya no es un toque largo
    if (gesto.timer) { clearTimeout(gesto.timer); gesto.timer = null; }
    if (gesto.pintar) {
      if (!gesto.arrastre) { gesto.arrastre = true; tragar = true; SFX.dice(); pintarX(gesto.i); }
      camino(n, gesto.ultimo, i).forEach(pintarX);
    }
    gesto.ultimo = i;
  };
  const soltar = ev => {
    if (!gesto || ev.pointerId !== gesto.id) return;
    if (gesto.timer) clearTimeout(gesto.timer);
    const arrastre = gesto.arrastre;
    gesto = null;
    window.removeEventListener('pointermove', mover);
    window.removeEventListener('pointerup', soltar);
    window.removeEventListener('pointercancel', soltar);
    if (arrastre) dibujar();
  };

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    marcas = e.marcas.slice();
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.({ ...e, ms: ctx.tiempo?.() });
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack reinas-juego' });
    const grilla = el('div', { class: 'rej-grid' + (e.fin ? ' fin' : ''), style: `grid-template-columns: repeat(${n}, 1fr)` });
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, z = zonas[i];
      const v = e.marcas[i];
      const jugar = j => {
        jugadas.push(j); ctx.guardar(jugadas);
        const x = motor.estado(p, jugadas);
        if (x.errores > e.errores) { SFX.error(); vibrate([40, 40, 40]); }
        else if (x.fin) { SFX.win(); vibrate([30, 50, 30]); }
        else if (x.marcas[motor.casilla(j)] === motor.MARCA) { SFX.dice(); vibrate([20, 30, 20]); }
        else SFX.tap();
        dibujar();
      };
      grilla.append(el('button', {
        type: 'button', class: 'rej' + (v === motor.REINA ? ' reina' : v === motor.MARCA ? ' marca' : '') + (e.conflictos.has(i) ? ' choque' : ''),
        'data-i': i, disabled: e.fin, 'aria-label': `${r + 1}-${c + 1}`,
        style: `background:${ZONAS[z % ZONAS.length]}`,
        // El toque largo marca la X (como las notas del teclado de Toque y Fama); el toque normal
        // pasa por reina, X y vacía. Si el dedo se va a otra casilla antes, es un arrastre: pinta X si empezó en una vacía.
        onPointerdown: ev => {
          if (!ev.isPrimary || e.fin) return;
          // Un dedo primario nuevo: el gesto anterior ya terminó aunque no llegara su pointerup
          if (gesto) soltar({ pointerId: gesto.id });
          tragar = false;
          gesto = { id: ev.pointerId, i, ultimo: i, pintar: v === motor.VACIO, arrastre: false };
          gesto.timer = setTimeout(() => {
            if (!gesto) return;
            // Si el dedo sigue y se arrastra, esta X ya está puesta y pinta las siguientes
            gesto.timer = null; tragar = true; jugar(motor.toqueLargo(i));
          }, LARGO_MS);
          window.addEventListener('pointermove', mover);
          window.addEventListener('pointerup', soltar);
          window.addEventListener('pointercancel', soltar);
        },
        onContextmenu: ev => ev.preventDefault(),
        // El teclado y los guiones llegan como click sin puntero (detail 0): esos nunca se tragan
        onClick: ev => { if (tragar && ev.detail !== 0) { tragar = false; return; } jugar(motor.toque(i)); },
      }, v === motor.REINA ? '👑' : v === motor.MARCA ? '✕' : ''));
    }
    const reinas = e.marcas.filter(v => v === motor.REINA).length;
    caja.append(el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.queensLeft, { m: reinas, n })));
    const cierre = e.fin ? [el('div', { class: 'aviso ' + (e.rendido ? 'mal' : 'bien') }, e.rendido ? T.queensGaveUp : `🎉 ${T.queensOk}`),
        // El puntaje es el tiempo (D-107): la pantalla lo lee del reloj de la partida al terminar
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar({ ...e, ms: ctx.tiempo?.() }); } }, ctx.textoFin || T.seeResults)] : [];
    // El cierre va arriba de la grilla; en la final (ctx.cierreAbajo), debajo
    if (!ctx.cierreAbajo) caja.append(...cierre);
    caja.append(grilla, el('p', { class: 'block-hint' }, T.queensHint));
    if (ctx.cierreAbajo) caja.append(...cierre);
    if (e.conflictos.size && !e.fin) caja.append(el('div', { class: 'aviso mal' }, T.queensClash));
    if (!e.fin) {
      // Rendirse es definitivo: pide confirmar, como el comodín (D-110)
      caja.append(el('button', {
        type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-rendirse',
        onClick: () => {
          SFX.tap();
          if (!confirm(T.giveUpConfirm)) return;
          jugadas.push(motor.RENDIRSE); ctx.guardar(jugadas); SFX.error(); vibrate([40, 40, 40]); dibujar();
        },
      }, `🏳️ ${T.giveUp}`));
    }
    raiz.append(caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
