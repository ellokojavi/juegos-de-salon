/**
 * 🔢 El Número del Día — pantalla. Las jugadas son los intentos, como texto.
 */
import * as motor from './numero.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  const max = ctx.max || motor.MAX_INTENTOS;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let escrito = '';

  const dibujar = () => {
    const e = motor.estado(p, jugadas, max);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack numero-juego' });
    const historial = el('div', { class: 'historial' }, e.filas.map((f, i) => el('div', { class: 'intento' + (f.famas === p.cifras ? ' ok' : '') },
      el('span', { class: 'n' }, `${i + 1}.`),
      el('span', { class: 'v' }, f.v),
      el('span', { class: 'r' }, `${f.famas === 1 ? T.fama1 : fmt(T.famas, { n: f.famas })} · ${f.toques === 1 ? T.toque1 : fmt(T.toques, { n: f.toques })}`),
      el('span', { class: 'bolitas' }, '🟢'.repeat(f.famas) + '🟡'.repeat(f.toques)))));
    poner(caja, historial);
    if (e.fin) {
      poner(caja, el('div', { class: 'aviso ' + (e.resuelto ? 'bien' : 'mal') }, e.resuelto ? `🎉 ${T.solved}` : fmt(T.notSolved, { v: p.secreto })),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
      poner(raiz, caja);
      return;
    }
    const quedan = max - e.usados;
    poner(caja, el('p', { class: 'muted center', style: 'margin:0' }, quedan === 1 ? T.tryLeft1 : fmt(T.triesLeft, { n: quedan })));
    poner(caja, el('div', { class: 'entry' }, Array.from({ length: p.cifras }, (_, i) => el('div', { class: 'box' + (escrito[i] ? ' filled' : '') + (i === escrito.length ? ' active' : '') }, escrito[i] || ''))));
    const teclado = el('div', { class: 'teclado' });
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '']) {
      if (!d) { teclado.append(el('span')); continue; }
      teclado.append(el('button', {
        type: 'button', class: 'tecla' + (d === '⌫' ? ' borrar' : ''), 'data-k': d,
        disabled: d === '⌫' ? !escrito.length : escrito.includes(d) || escrito.length >= p.cifras,
        onClick: () => { SFX.tap(); escrito = d === '⌫' ? escrito.slice(0, -1) : escrito + d; dibujar(); },
      }, d));
    }
    poner(caja, teclado);
    const listo = motor.valido(escrito, p.cifras);
    poner(caja, el('button', {
      class: 'btn btn--yellow', id: 'btn-probar', disabled: !listo,
      onClick: () => {
        jugadas.push(escrito);
        escrito = '';
        ctx.guardar(jugadas);
        const e2 = motor.estado(p, jugadas, max);
        const u = e2.filas[e2.filas.length - 1];
        if (u.famas === p.cifras) { SFX.win(); vibrate([30, 50, 30]); } else if (u.famas || u.toques) SFX.reveal(); else SFX.splash();
        dibujar();
      },
    }, listo ? fmt(T.guess, { v: escrito }) : fmt(T.typeDigits, { n: p.cifras })));
    poner(raiz, caja);
  };
  dibujar();
}

export const resultado = (e, max = motor.MAX_INTENTOS) => ({ s: motor.puntaje(e, max), t: motor.tarjeta(e), resumen: `${e.resuelto ? e.usados : 'X'}/${max}` });
