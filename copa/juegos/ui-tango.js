/**
 * ☀️ Tango — pantalla. Como el Tango de LinkedIn: un toque pone un sol, otro una luna, otro
 * limpia. Las casillas dadas no se tocan. Las marcas = y × van sobre el borde entre dos
 * casillas. Lo que rompe una regla se ve en rojo en el acto. Las jugadas son los índices tocados.
 */
import * as motor from './tango.js';

const ICONO = { [motor.SOL]: '☀️', [motor.LUNA]: '🌙' };

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  const { n } = p;

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack tango-juego' });
    const grilla = el('div', { class: 'tan-grid' + (e.fin ? ' fin' : ''), style: `grid-template-columns: repeat(${n}, 1fr)` });
    for (let i = 0; i < n * n; i++) {
      const v = e.g[i];
      const dada = motor.esDada(p, i);
      const celda = el('button', {
        type: 'button', class: 'tan' + (dada ? ' dada' : '') + (e.mal.has(i) ? ' choque' : ''), 'data-i': i, 'data-v': v, disabled: dada || e.fin,
        'aria-label': `${Math.floor(i / n) + 1}-${(i % n) + 1}`,
        onClick: () => {
          jugadas.push(i); ctx.guardar(jugadas);
          const x = motor.estado(p, jugadas);
          if (x.errores > e.errores) { SFX.error(); vibrate([40, 40, 40]); }
          else if (x.fin) { SFX.win(); vibrate([30, 50, 30]); }
          else SFX.tap();
          dibujar();
        },
      }, v ? ICONO[v] : '');
      for (const m of p.marcas) {
        if (m.a !== i) continue;
        celda.append(el('span', { class: 'tan-marca ' + (m.b === i + 1 ? 'der' : 'abajo'), 'aria-hidden': 'true' }, m.t === '=' ? '=' : '×'));
      }
      grilla.append(celda);
    }
    if (e.fin) {
      caja.append(el('div', { class: 'aviso bien' }, `🎉 ${T.tangoOk}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
    }
    caja.append(grilla);
    if (e.mal.size && !e.fin) caja.append(el('div', { class: 'aviso mal' }, T.tangoClash));
    if (e.errores) caja.append(el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.clashCount, { n: e.errores })));
    raiz.append(caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
