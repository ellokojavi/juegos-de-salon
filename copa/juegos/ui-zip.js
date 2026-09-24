/**
 * 〰️ Zip — pantalla. Como el Zip de LinkedIn: se arrastra el dedo desde el 1 y el trazo va
 * pasando de casilla en casilla. Volver por el mismo camino lo deshace y tocar una casilla del
 * trazo lo corta ahí. El gesto toma el puntero en la grilla, igual que el arrastre compartido
 * (D-85): la grilla sobrevive a los redibujos, las casillas no.
 *
 * Por niveles contra el reloj (D-103): tres minutos de tiempo activo (se pausa con la pantalla
 * oculta) para resolver la mayor cantidad de tableros. Las jugadas son la partida entera:
 * `{ hechos, trazo, usado, ultimo }`.
 */
import * as motor from './zip.js';

export function montar(raiz, ctx) {
  const { T, fmt, el, SFX, vibrate } = ctx;
  const { codigo, dia } = ctx.p;
  const J = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? { ...motor.partidaNueva(), ...ctx.jugadas } : motor.partidaNueva();
  const tiempo = ctx.p.tiempo || motor.TIEMPO_MS;
  let desde = document.hidden ? null : Date.now();
  let p = null;
  let dibujando = false;
  let reloj = null;
  const guardar = () => ctx.guardar({ ...J, trazo: J.trazo.slice() });
  const usado = () => J.usado + (desde === null ? 0 : Date.now() - desde);

  raiz.innerHTML = '';
  const caja = el('div', { class: 'stack zip-juego' });
  const cabeza = el('div', { class: 'zip-cabeza' });
  const aviso = el('div', { class: 'stack zip-aviso' });
  const grilla = el('div', { class: 'zip-grid' });
  // El aviso va debajo de la grilla: si fuera arriba, al aparecer la correría bajo el dedo
  caja.append(cabeza, el('p', { class: 'muted center', style: 'margin:0' }, T.zipHint), grilla, aviso);
  raiz.append(caja);

  const NS = 'http://www.w3.org/2000/svg';
  let celdas = [], linea = null;

  const armar = () => {
    p = motor.nivel(codigo, dia, J.hechos);
    const { n } = p;
    grilla.innerHTML = '';
    grilla.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${n} ${n}`);
    svg.setAttribute('class', 'zip-trazo');
    linea = document.createElementNS(NS, 'polyline');
    svg.append(linea);
    celdas = [];
    for (let i = 0; i < n * n; i++) {
      const num = p.numeros[i];
      const c = el('div', { class: 'zc' + (num !== undefined ? ' num' : ''), 'data-i': i }, num !== undefined ? el('span', {}, String(num)) : null);
      celdas.push(c); grilla.append(c);
    }
    grilla.append(svg);
    if (!motor.valido(p, J.trazo)) J.trazo = [];
    // El nivel siguiente se prepara mientras se juega este: un 7 × 7 tarda en generarse
    setTimeout(() => { try { motor.nivel(codigo, dia, J.hechos + 1); } catch (_) { /* nada */ } }, 50);
  };

  const pintarCabeza = () => {
    const quedan = Math.max(0, tiempo - usado());
    cabeza.replaceChildren(
      el('span', { class: 'zip-nivel' }, fmt(T.zipLevel, { k: J.hechos + 1, n: p ? p.n : '' })),
      el('span', { class: 'zip-hechos' }, fmt(T.zipDone, { n: J.hechos })),
      el('span', { class: 'zip-reloj' + (quedan < 30000 ? ' poco' : '') }, `⏳ ${Math.floor(quedan / 60000)}:${String(Math.floor((quedan % 60000) / 1000)).padStart(2, '0')}`));
  };

  const terminar = () => {
    clearInterval(reloj);
    // Si el tiempo se acabó con un nivel a medias, se muestra cómo se resolvía (D-109). Si justo
    // se había resuelto (la grilla ya está en verde), no hay nada que mostrar.
    const aMedias = !grilla.classList.contains('fin') && p?.sol;
    J.usado = Math.min(tiempo, usado()); desde = null;
    guardar();
    aviso.innerHTML = '';
    if (aMedias) {
      celdas.forEach(c => { c.classList.add('on'); c.classList.remove('cabeza'); });
      linea.setAttribute('points', p.sol.map(i => `${(i % p.n) + 0.5},${Math.floor(i / p.n) + 0.5}`).join(' '));
      grilla.classList.add('solucion');
    }
    grilla.classList.add('fin');
    SFX.timeUp();
    aviso.append(el('div', { class: 'aviso bien' }, J.hechos === 1 ? T.zipTimeOne : fmt(T.zipTime, { n: J.hechos })),
      aMedias ? el('p', { class: 'muted center', id: 'zip-solucion', style: 'margin:0' }, fmt(T.zipSolution, { k: J.hechos + 1 })) : null,
      el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar({ ...J }); } }, ctx.textoFin || T.seeResults));
    pintarCabeza();
  };

  const pintar = () => {
    const e = motor.estado(p, J.trazo);
    const en = new Set(J.trazo);
    celdas.forEach((c, i) => { c.classList.toggle('on', en.has(i)); c.classList.toggle('cabeza', J.trazo[J.trazo.length - 1] === i); });
    linea.setAttribute('points', J.trazo.map(i => `${(i % p.n) + 0.5},${Math.floor(i / p.n) + 0.5}`).join(' '));
    aviso.innerHTML = '';
    if (e.faltan) aviso.append(el('div', { class: 'aviso mal' }, e.faltan === 1 ? T.zipMissingOne : fmt(T.zipMissing, { n: e.faltan })));
    return e;
  };

  /** Nivel resuelto: se anota, se celebra un momento y aparece el siguiente. */
  const resuelto = () => {
    J.hechos++; J.ultimo = usado(); J.trazo = [];
    SFX.win(); vibrate([30, 50, 30]);
    grilla.classList.add('fin');
    guardar();
    setTimeout(() => { if (usado() >= tiempo) return; grilla.classList.remove('fin'); armar(); pintar(); pintarCabeza(); }, 450);
  };

  const celdaEn = (x, y) => {
    const d = document.elementFromPoint(x, y)?.closest('.zc');
    return d && grilla.contains(d) ? +d.dataset.i : null;
  };

  /** Mover la cabeza del trazo a `i`: avanzar, o retroceder si es la casilla anterior. */
  const ir = i => {
    if (i === null || usado() >= tiempo || grilla.classList.contains('fin')) return;
    const t = J.trazo;
    if (i === t[t.length - 1]) return;
    if (t.length >= 2 && i === t[t.length - 2]) { t.pop(); SFX.tap(); pintar(); return; }
    if (motor.puedeIr(p, t, i)) {
      t.push(i); vibrate(6);
      if (pintar().fin) resuelto();
    }
  };

  const empezarEn = i => {
    const t = J.trazo;
    if (!t.length) { if (p.numeros[i] === 1) { J.trazo = [i]; SFX.tap(); pintar(); } return; }
    if (t.includes(i) && i !== t[t.length - 1]) { J.trazo = t.slice(0, t.indexOf(i) + 1); SFX.tap(); pintar(); return; }
    ir(i);
  };

  grilla.addEventListener('pointerdown', ev => {
    const i = celdaEn(ev.clientX, ev.clientY);
    if (i === null || usado() >= tiempo || grilla.classList.contains('fin')) return;
    empezarEn(i);
    dibujando = true;
    try { grilla.setPointerCapture(ev.pointerId); } catch (_) { /* nada */ }
    ev.preventDefault();
  });
  grilla.addEventListener('pointermove', ev => { if (dibujando) { ir(celdaEn(ev.clientX, ev.clientY)); ev.preventDefault(); } });
  const soltar = () => { if (!dibujando) return; dibujando = false; guardar(); };
  grilla.addEventListener('pointerup', soltar);
  grilla.addEventListener('pointercancel', soltar);
  // El teclado y los guiones llegan como click sin puntero (detail 0): cada uno es un paso del trazo
  grilla.addEventListener('click', ev => {
    if (ev.detail !== 0) return;
    const d = ev.target.closest('.zc');
    if (d) { empezarEn(+d.dataset.i); guardar(); }
  });

  // El reloj corre solo con la pantalla a la vista (D-95)
  const alCambiar = () => {
    if (document.hidden) { J.usado = usado(); desde = null; guardar(); } else if (desde === null) desde = Date.now();
  };
  document.addEventListener('visibilitychange', alCambiar);

  if (J.usado >= tiempo) { armar(); pintar(); terminar(); return; }
  armar(); pintar(); pintarCabeza();
  reloj = setInterval(() => {
    if (!raiz.isConnected) { clearInterval(reloj); document.removeEventListener('visibilitychange', alCambiar); return; }
    pintarCabeza();
    if (usado() >= tiempo) terminar();
  }, 250);
}

/**
 * El puntaje son los niveles resueltos; el desempate, el tiempo en que se resolvió el último
 * (no los tres minutos, que todos gastan).
 */
export const resultado = j => ({ s: motor.puntaje(j), t: motor.tarjeta(j), resumen: `${j.hechos || 0} ✅`, ms: Math.round(j.ultimo || motor.TIEMPO_MS) });
