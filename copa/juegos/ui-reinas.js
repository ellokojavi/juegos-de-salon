/**
 * 👑 Reinas — pantalla. Como el Queens de LinkedIn: un toque marca una X, otro pone la reina,
 * otro limpia. Las zonas se distinguen por color y además por un borde grueso, para no depender
 * solo del color (C-8). Las reinas que chocan se ven en rojo en el acto. Las jugadas son los
 * índices tocados, en orden.
 */
import * as motor from './reinas.js';

/** Colores de zona: claros, para que la reina negra y la X se lean encima. */
export const ZONAS = ['#f4b183', '#a9d18e', '#9dc3e6', '#ffd966', '#c9a0dc', '#f8cbad', '#b4dfe0', '#e6e6e6', '#d5e8a4', '#f2a7c3'];

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  const { n, zonas } = p;

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack reinas-juego' });
    const grilla = el('div', { class: 'rej-grid' + (e.fin ? ' fin' : ''), style: `grid-template-columns: repeat(${n}, 1fr)` });
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, z = zonas[i];
      const borde = (rr, cc) => (rr < 0 || cc < 0 || rr >= n || cc >= n || zonas[rr * n + cc] !== z ? '3px' : '1px');
      const v = e.marcas[i];
      grilla.append(el('button', {
        type: 'button', class: 'rej' + (v === motor.REINA ? ' reina' : v === motor.MARCA ? ' marca' : '') + (e.conflictos.has(i) ? ' choque' : ''),
        'data-i': i, disabled: e.fin, 'aria-label': `${r + 1}-${c + 1}`,
        style: `background:${ZONAS[z % ZONAS.length]};border-width:${borde(r - 1, c)} ${borde(r, c + 1)} ${borde(r + 1, c)} ${borde(r, c - 1)}`,
        onClick: () => {
          jugadas.push(i); ctx.guardar(jugadas);
          const x = motor.estado(p, jugadas);
          if (x.errores > e.errores) { SFX.error(); vibrate([40, 40, 40]); }
          else if (x.fin) { SFX.win(); vibrate([30, 50, 30]); }
          else SFX.tap();
          dibujar();
        },
      }, v === motor.REINA ? '👑' : v === motor.MARCA ? '✕' : ''));
    }
    const reinas = e.marcas.filter(v => v === motor.REINA).length;
    caja.append(el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.queensLeft, { m: reinas, n })));
    if (e.fin) {
      caja.append(el('div', { class: 'aviso bien' }, `🎉 ${T.queensOk}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
    }
    caja.append(grilla);
    if (e.conflictos.size && !e.fin) caja.append(el('div', { class: 'aviso mal' }, T.queensClash));
    if (e.errores) caja.append(el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.clashCount, { n: e.errores })));
    raiz.append(caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
