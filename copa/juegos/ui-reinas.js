/**
 * 👑 Reinas — pantalla. Un toque pone o saca la reina; un toque largo pone o saca una X para
 * descartar la casilla (D-103), como las notas de Toque y Fama. Las zonas se distinguen por color
 * y además por un borde grueso, para no depender solo del color (C-8). Las reinas que chocan se
 * ven en rojo en el acto. Las jugadas son los toques, en orden (el largo, en negativo).
 */
import * as motor from './reinas.js';

/** Colores de zona: claros, para que la reina negra y la X se lean encima. */
export const ZONAS = ['#f4b183', '#a9d18e', '#9dc3e6', '#ffd966', '#c9a0dc', '#f8cbad', '#b4dfe0', '#e6e6e6', '#d5e8a4', '#f2a7c3'];

const LARGO_MS = 450;

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  const { n, zonas } = p;
  // El toque largo termina con un click del mismo gesto (al levantar el dedo) que no tiene que
  // poner una reina. Se traga ese click y nada más: cualquier gesto nuevo empieza limpio.
  let tragar = false;

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.();
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack reinas-juego' });
    const grilla = el('div', { class: 'rej-grid' + (e.fin ? ' fin' : ''), style: `grid-template-columns: repeat(${n}, 1fr)` });
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, z = zonas[i];
      const borde = (rr, cc) => (rr < 0 || cc < 0 || rr >= n || cc >= n || zonas[rr * n + cc] !== z ? '3px' : '1px');
      const v = e.marcas[i];
      let timer = null;
      const jugar = j => {
        jugadas.push(j); ctx.guardar(jugadas);
        const x = motor.estado(p, jugadas);
        if (x.errores > e.errores) { SFX.error(); vibrate([40, 40, 40]); }
        else if (x.fin) { SFX.win(); vibrate([30, 50, 30]); }
        else if (j < 0) { SFX.dice(); vibrate([20, 30, 20]); }
        else SFX.tap();
        dibujar();
      };
      grilla.append(el('button', {
        type: 'button', class: 'rej' + (v === motor.REINA ? ' reina' : v === motor.MARCA ? ' marca' : '') + (e.conflictos.has(i) ? ' choque' : ''),
        'data-i': i, disabled: e.fin, 'aria-label': `${r + 1}-${c + 1}`,
        style: `background:${ZONAS[z % ZONAS.length]};border-width:${borde(r - 1, c)} ${borde(r, c + 1)} ${borde(r + 1, c)} ${borde(r, c - 1)}`,
        // El toque largo marca la X; el toque normal, la reina (como las notas del teclado de Toque y Fama)
        onPointerdown: () => { tragar = false; timer = setTimeout(() => { timer = null; tragar = true; jugar(motor.toqueLargo(i)); }, LARGO_MS); },
        onPointerup: () => { if (timer) { clearTimeout(timer); timer = null; } },
        onPointerleave: () => { if (timer) { clearTimeout(timer); timer = null; } },
        onPointercancel: () => { if (timer) { clearTimeout(timer); timer = null; } },
        onContextmenu: ev => ev.preventDefault(),
        onClick: () => { if (tragar) { tragar = false; return; } jugar(i); },
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
