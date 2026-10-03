/**
 * 〰️ Zip — pantalla. Como el Zip de LinkedIn: se arrastra el dedo desde el 1 y el trazo va
 * pasando de casilla en casilla. Volver por el mismo camino lo deshace y tocar una casilla del
 * trazo lo corta ahí. El gesto toma el puntero en la grilla, igual que el arrastre compartido
 * (D-85): la grilla sobrevive a los redibujos, las casillas no. **Borrar todo** deja solo el 1,
 * con el mismo segundo toque de confirmación que en Tango.
 *
 * Por niveles contra el reloj (D-103): tres minutos de tiempo activo (se pausa con la pantalla
 * oculta) para resolver la mayor cantidad de tableros. Las jugadas son la partida entera:
 * `{ hechos, trazo, usado, ultimo }`.
 */
import * as motor from './zip.js';

const NS = 'http://www.w3.org/2000/svg';
/** Cuánto espera Borrar todo el segundo toque, como en Tango. */
const CONFIRMAR_MS = 3000;

/**
 * El dibujo de las reglas, como el de Reinas (D-134): el mismo 4 × 4 dos veces. En el primero el
 * trazo pasa por todas las casillas; en el segundo toca los números en orden pero deja cuatro
 * casillas sin pintar, que es el error más fácil de cometer. Se entiende mirando antes de leer.
 */
const EJ_NUMEROS = { 0: 1, 13: 2, 3: 3, 11: 4 };
const EJ_BIEN = [0, 4, 8, 12, 13, 9, 5, 1, 2, 3, 7, 6, 10, 14, 15, 11];
const EJ_MAL = [0, 4, 8, 12, 13, 9, 5, 1, 2, 3, 7, 11];

function tableroEjemplo(el, n, trazo, bien) {
  const g = el('div', { class: 'zip-ej' + (bien ? ' fin' : ''), 'aria-hidden': 'true', style: `grid-template-columns: repeat(${n}, 1fr)` });
  for (let i = 0; i < n * n; i++) {
    const num = EJ_NUMEROS[i];
    g.append(el('span', { class: (trazo.includes(i) ? 'on' : 'falta') + (num ? ' num' : '') }, num ? el('b', {}, String(num)) : null));
  }
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${n} ${n}`);
  svg.setAttribute('class', 'zip-trazo');
  const linea = document.createElementNS(NS, 'polyline');
  linea.setAttribute('points', trazo.map(i => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`).join(' '));
  svg.append(linea);
  g.append(svg);
  return g;
}

export function ejemplo({ el, T }) {
  return el('div', { class: 'rej-ejemplo' },
    el('figure', {}, tableroEjemplo(el, 4, EJ_BIEN, true), el('figcaption', {}, `✅ ${T.zipExOk}`)),
    el('figure', {}, tableroEjemplo(el, 4, EJ_MAL, false), el('figcaption', {}, `❌ ${T.zipExBad}`)));
}

export function montar(raiz, ctx) {
  const { T, fmt, el, SFX, vibrate } = ctx;
  const { codigo, dia } = ctx.p;
  const J = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? { ...motor.partidaNueva(), ...ctx.jugadas } : motor.partidaNueva();
  const tiempo = ctx.p.tiempo || motor.TIEMPO_MS;
  let desde = document.hidden ? null : Date.now();
  let p = null;
  let dibujando = false;
  let reloj = null;
  let terminado = false;
  const guardar = () => ctx.guardar({ ...J, trazo: J.trazo.slice() });
  const usado = () => J.usado + (desde === null ? 0 : Date.now() - desde);

  raiz.innerHTML = '';
  const caja = el('div', { class: 'stack zip-juego' });
  const cabeza = el('div', { class: 'zip-cabeza' });
  const aviso = el('div', { class: 'stack zip-aviso' });
  const grilla = el('div', { class: 'zip-grid' });
  // Borrar todo, igual que en Tango: el primer toque lo arma y el segundo borra
  let armado = false, armadoTimer = null;
  const desarmar = () => { armado = false; clearTimeout(armadoTimer); };
  // Como en Tango, tocar la grilla deja Borrar todo sin armar: el segundo toque tiene que ser seguido
  const soltarBorrar = () => { if (armado) { desarmar(); pintarBorrar(); } };
  const borrar = el('button', {
    type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-borrar',
    onClick: () => {
      if (grilla.classList.contains('fin')) return;
      if (armado) { desarmar(); J.trazo = J.trazo.slice(0, 1); SFX.splash(); pintar(); guardar(); return; }
      armado = true; SFX.tap(); vibrate(15);
      clearTimeout(armadoTimer);
      armadoTimer = setTimeout(() => { armado = false; if (raiz.isConnected) pintarBorrar(); }, CONFIRMAR_MS);
      pintarBorrar();
    },
  });
  const acciones = el('div', { class: 'btn-row zip-acciones' }, borrar);
  const pintarBorrar = () => {
    borrar.disabled = J.trazo.length < 2;
    if (borrar.disabled) desarmar();
    borrar.classList.toggle('armado', armado);
    borrar.textContent = armado ? T.clearAllSure : `🧹 ${T.clearAll}`;
  };
  // El aviso va debajo de la grilla y del botón: si fuera arriba, al aparecer los correría bajo el dedo
  caja.append(cabeza, el('p', { class: 'muted center', style: 'margin:0' }, T.zipHint), grilla, acciones, aviso);
  raiz.append(caja);

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
    cabeza.replaceChildren(...[
      terminado ? null : el('span', { class: 'zip-nivel' }, fmt(T.zipLevel, { k: J.hechos + 1, n: p ? p.n : '' })),
      el('span', { class: 'zip-hechos' }, fmt(T.zipDone, { n: J.hechos })),
      terminado ? null : el('span', { class: 'zip-reloj' + (quedan < 30000 ? ' poco' : '') }, `⏳ ${Math.floor(quedan / 60000)}:${String(Math.floor((quedan % 60000) / 1000)).padStart(2, '0')}`),
    ].filter(Boolean));
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
    desarmar(); acciones.remove();
    // Se acabó: los relojes dejan de correr. El de arriba queda en el tiempo final y la cuenta
    // regresiva, que ya no dice nada, desaparece
    ctx.pararReloj?.({ ...J });
    terminado = true;
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
    pintarBorrar();
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
    soltarBorrar();
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
    if (d) { soltarBorrar(); empezarEn(+d.dataset.i); guardar(); }
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
export const resultado = j => ({ s: motor.puntaje(j), t: motor.tarjeta(j), resumen: `${motor.puntaje(j)}/100`, ms: Math.round(j.ultimo || motor.TIEMPO_MS) });
