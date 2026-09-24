/**
 * 〰️ Zip — pantalla. Como el Zip de LinkedIn: se arrastra el dedo desde el 1 y el trazo va
 * pasando de casilla en casilla. Volver por el mismo camino lo deshace y tocar una casilla del
 * trazo lo corta ahí. El gesto toma el puntero en la grilla, igual que el arrastre compartido
 * (D-85): la grilla sobrevive a los redibujos, las casillas no. Las jugadas son el trazo.
 */
import * as motor from './zip.js';

export function montar(raiz, ctx) {
  const { p, T, el, SFX, vibrate } = ctx;
  let trazo = Array.isArray(ctx.jugadas) && motor.valido(p, ctx.jugadas) ? ctx.jugadas.slice() : [];
  const { n } = p;
  let dibujando = false;

  raiz.innerHTML = '';
  const caja = el('div', { class: 'stack zip-juego' });
  const cierre = el('div', { class: 'stack' });
  const grilla = el('div', { class: 'zip-grid', style: `grid-template-columns: repeat(${n}, 1fr)` });
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${n} ${n}`);
  svg.setAttribute('class', 'zip-trazo');
  const linea = document.createElementNS(NS, 'polyline');
  svg.append(linea);
  const celdas = [];
  for (let i = 0; i < n * n; i++) {
    const num = p.numeros[i];
    const c = el('div', { class: 'zc' + (num !== undefined ? ' num' : ''), 'data-i': i }, num !== undefined ? el('span', {}, String(num)) : null);
    celdas.push(c); grilla.append(c);
  }
  grilla.append(svg);
  caja.append(cierre, el('p', { class: 'muted center', style: 'margin:0' }, T.zipHint), grilla);
  raiz.append(caja);

  const pintar = () => {
    const e = motor.estado(p, trazo);
    const en = new Map(trazo.map((i, k) => [i, k]));
    celdas.forEach((c, i) => {
      c.classList.toggle('on', en.has(i));
      c.classList.toggle('cabeza', trazo[trazo.length - 1] === i);
    });
    linea.setAttribute('points', trazo.map(i => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`).join(' '));
    grilla.classList.toggle('fin', e.fin);
    cierre.innerHTML = '';
    if (e.fin) {
      cierre.append(el('div', { class: 'aviso bien' }, `🎉 ${T.zipOk}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
    }
    return e;
  };

  const celdaEn = (x, y) => {
    const d = document.elementFromPoint(x, y)?.closest('.zc');
    return d && grilla.contains(d) ? +d.dataset.i : null;
  };

  /** Mover la cabeza del trazo a `i`: avanzar, o retroceder si es la casilla anterior. */
  const ir = i => {
    if (i === null || motor.estado(p, trazo).fin) return;
    const cabeza = trazo[trazo.length - 1];
    if (i === cabeza) return;
    if (trazo.length >= 2 && i === trazo[trazo.length - 2]) { trazo.pop(); SFX.tap(); pintar(); return; }
    if (motor.puedeIr(p, trazo, i)) {
      trazo.push(i); vibrate(6);
      const e = pintar();
      if (e.fin) { SFX.win(); vibrate([30, 50, 30]); }
    }
  };

  grilla.addEventListener('pointerdown', ev => {
    const i = celdaEn(ev.clientX, ev.clientY);
    if (i === null || motor.estado(p, trazo).fin) return;
    if (!trazo.length) {
      if (p.numeros[i] !== 1) return;
      trazo = [i]; SFX.tap(); pintar();
    } else if (trazo.includes(i) && i !== trazo[trazo.length - 1]) {
      // Tocar una casilla del trazo lo corta ahí y se sigue desde ella
      trazo = trazo.slice(0, trazo.indexOf(i) + 1); SFX.tap(); pintar();
    } else if (i !== trazo[trazo.length - 1]) { ir(i); }
    dibujando = true;
    try { grilla.setPointerCapture(ev.pointerId); } catch (_) { /* nada */ }
    ev.preventDefault();
  });
  grilla.addEventListener('pointermove', ev => { if (dibujando) { ir(celdaEn(ev.clientX, ev.clientY)); ev.preventDefault(); } });
  const soltar = () => { if (!dibujando) return; dibujando = false; ctx.guardar(trazo.slice()); };
  grilla.addEventListener('pointerup', soltar);
  // El teclado y los guiones llegan como click sin puntero (detail 0): cada uno es un paso del trazo
  grilla.addEventListener('click', ev => {
    if (ev.detail !== 0) return;
    const d = ev.target.closest('.zc');
    if (!d) return;
    const i = +d.dataset.i;
    if (!trazo.length) { if (p.numeros[i] === 1) { trazo = [i]; pintar(); } }
    else ir(i);
    ctx.guardar(trazo.slice());
  });
  grilla.addEventListener('pointercancel', soltar);

  pintar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
