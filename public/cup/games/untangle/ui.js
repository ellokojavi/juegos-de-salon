/**
 * 🧶 Desenredo — pantalla. Un tablero SVG de 1000 × 1000 con los hilos abajo y los nudos
 * encima. Se arrastra un nudo con el dedo: sigue al dedo desde donde se lo tomó, sus vecinos y
 * sus hilos se resaltan, y los hilos que se cruzan se ven en rojo mientras se mueve. Si al
 * soltarlo no queda ningún cruce, el nivel está resuelto.
 *
 * El gesto toma el puntero en el tablero, igual que Zip y el arrastre compartido (D-85): el
 * tablero sobrevive a los redibujos. El nudo se elige por cercanía y no por el círculo que se ve,
 * así el área que se toca mide 48 px aunque el nudo se dibuje más chico (C-8).
 *
 * Por niveles contra el reloj, como Zip (D-103, D-179): diez niveles y cuatro minutos de tiempo
 * activo (se pausa con la pantalla oculta). Las jugadas son la partida entera:
 * `{ hechos, pos, usado, ultimo }`.
 *
 * "Reiniciar nivel" devuelve los nudos a donde partió el nivel; como Borrar todo en Zip y Reinas,
 * el primer toque lo arma y el segundo lo hace, y el reloj sigue.
 */
import * as motor from './engine.js';

const NS = 'http://www.w3.org/2000/svg';
/** El radio con que se dibuja un nudo y el radio en que se lo puede tomar, en píxeles de pantalla. */
const RADIO_PX = 11;
const TOMAR_PX = 24;
/** Cuánto dura armado "Reiniciar nivel" esperando el segundo toque, como Borrar todo en Zip. */
const CONFIRMAR_MS = 3000;

/**
 * Un hilo dibujado como cuerda (D-182): un borde oscuro, el alma del color del hilo y encima las
 * hebras: una oscura y una clara que se alternan, como los dos cabos de una cuerda torcida (D-183).
 * Las cuatro capas comparten el mismo trazo.
 */
const hiloNuevo = () => {
  const g = svgEl('g', { class: 'des-hilo' });
  g.append(svgEl('path', { class: 'borde' }), svgEl('path', { class: 'alma' }), svgEl('path', { class: 'hebra' }), svgEl('path', { class: 'brillo' }));
  return g;
};
const ponerTrazo = (g, d) => { for (const x of g.children) x.setAttribute('d', d); };

const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

/**
 * El dibujo de las reglas, como el de Zip y Reinas (D-134): los mismos cuatro nudos con sus seis
 * hilos, dos veces. Desenredados, con uno al medio, no se cruza ninguno; en cuadrado, las dos
 * diagonales se cruzan y se ven en rojo.
 */
const EJ_HILOS = [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3]];
const EJ_BIEN = [[60, 14], [106, 100], [14, 100], [60, 68]];
const EJ_MAL = [[18, 18], [102, 18], [102, 102], [18, 102]];

function tableroEjemplo(pos, bien) {
  const svg = svgEl('svg', { viewBox: '0 0 120 120', class: 'des-ej' + (bien ? ' fin' : ''), 'aria-hidden': 'true' });
  const malos = new Set(bien ? [] : [2, 4]); // las diagonales del cuadrado: 2–0 y 1–3
  EJ_HILOS.forEach(([a, b], i) => {
    const g = hiloNuevo();
    if (malos.has(i)) g.classList.add('mal');
    ponerTrazo(g, motor.trazoCuerda(pos[a], pos[b], a * 64 + b, { tope: 6, tope2: 1.5 }));
    svg.append(g);
  });
  pos.forEach(([x, y]) => svg.append(svgEl('circle', { cx: x, cy: y, r: 8 })));
  return svg;
}

export function ejemplo({ el, T }) {
  return el('div', { class: 'rej-ejemplo' },
    el('figure', {}, tableroEjemplo(EJ_BIEN, true), el('figcaption', {}, `✅ ${T.desExOk}`)),
    el('figure', {}, tableroEjemplo(EJ_MAL, false), el('figcaption', {}, `❌ ${T.desExBad}`)));
}

export function montar(raiz, ctx) {
  const { T, fmt, el, SFX, vibrate } = ctx;
  const { codigo, dia } = ctx.p;
  const J = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? { ...motor.partidaNueva(), ...ctx.jugadas } : motor.partidaNueva();
  const tiempo = ctx.p.tiempo || motor.TIEMPO_MS;
  let desde = document.hidden ? null : Date.now();
  let p = null, pos = [];
  let vilo = null;            // { v, dx, dy, id }: el nudo que se arrastra y desde dónde se tomó
  let reloj = null;
  let terminado = false, cambiando = false;
  const guardar = () => ctx.guardar({ ...J, pos: J.pos ? J.pos.map(q => q.slice()) : null });
  const usado = () => J.usado + (desde === null ? 0 : Date.now() - desde);

  raiz.innerHTML = '';
  const caja = el('div', { class: 'stack des-juego' });
  const cabeza = el('div', { class: 'zip-cabeza' });
  const estado = el('p', { class: 'des-estado center', 'aria-live': 'polite' });
  const aviso = el('div', { class: 'stack zip-aviso' });
  const tablero = svgEl('svg', { viewBox: `0 0 ${motor.LADO} ${motor.LADO}`, class: 'des-tablero', role: 'img' });
  const capaHilos = svgEl('g', { class: 'des-hilos' });
  const capaNudos = svgEl('g', { class: 'des-nudos' });
  tablero.append(capaHilos, capaNudos);
  let armado = false, armadoTimer = null;
  const desarmar = () => { armado = false; clearTimeout(armadoTimer); };
  const reiniciar = el('button', {
    type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-reiniciar',
    onClick: () => {
      if (quieto() || vilo) return;
      if (armado) {
        desarmar();
        J.pos = null; guardar();
        SFX.splash(); vibrate([20, 30, 20]);
        // Mientras los nudos vuelven no se pueden tomar
        cambiando = true;
        llevarA(p.inicio, () => { cambiando = false; pintar(); });
        return;
      }
      armado = true; SFX.tap(); vibrate(15);
      clearTimeout(armadoTimer);
      armadoTimer = setTimeout(() => { armado = false; if (raiz.isConnected) pintarReiniciar(); }, CONFIRMAR_MS);
      pintarReiniciar();
    },
  });
  const acciones = el('div', { class: 'btn-row zip-acciones' }, reiniciar);
  /** Sin nada movido desde que partió el nivel, no hay qué reiniciar. */
  const pintarReiniciar = () => {
    reiniciar.disabled = !p || quieto() || pos.every((q, v) => q[0] === p.inicio[v][0] && q[1] === p.inicio[v][1]);
    if (reiniciar.disabled) desarmar();
    reiniciar.classList.toggle('armado', armado);
    reiniciar.textContent = armado ? T.desResetSure : `🔄 ${T.desReset}`;
  };
  // El aviso del final va debajo del tablero: si fuera arriba, al aparecer lo correría bajo el dedo
  caja.append(cabeza, el('p', { class: 'muted center', style: 'margin:0' }, T.desHint), tablero, estado, acciones, aviso);
  raiz.append(caja);

  let hilos = [], circulos = [];

  /** Cuántas unidades del tablero mide un píxel de pantalla. */
  const escala = () => motor.LADO / (tablero.getBoundingClientRect().width || motor.LADO);

  const armar = (k = J.hechos) => {
    p = motor.nivel(codigo, dia, k);
    const guardadas = Array.isArray(J.pos) && J.pos.length === p.n ? J.pos : null;
    pos = (guardadas || p.inicio).map(q => q.slice());
    capaHilos.replaceChildren(); capaNudos.replaceChildren();
    hilos = p.hilos.map(() => { const g = hiloNuevo(); capaHilos.append(g); return g; });
    circulos = pos.map((_, v) => { const c = svgEl('circle', { 'data-v': v }); capaNudos.append(c); return c; });
    tablero.setAttribute('aria-label', fmt(T.desLevel, { k: k + 1, total: motor.NIVELES }));
    tablero.classList.remove('fin', 'solucion');
    // El nivel siguiente se prepara mientras se juega este
    setTimeout(() => { try { if (k + 1 < motor.NIVELES) motor.nivel(codigo, dia, k + 1); } catch (_) { /* nada */ } }, 50);
  };

  const pintarCabeza = () => {
    const quedan = Math.max(0, tiempo - usado());
    cabeza.replaceChildren(...[
      terminado ? null : el('span', { class: 'zip-nivel' }, fmt(T.desLevel, { k: J.hechos + 1, total: motor.NIVELES })),
      el('span', { class: 'zip-hechos' }, fmt(T.desDone, { n: J.hechos })),
      terminado ? null : el('span', { class: 'zip-reloj' + (quedan < 30000 ? ' poco' : '') }, `⏳ ${Math.floor(quedan / 60000)}:${String(Math.floor((quedan % 60000) / 1000)).padStart(2, '0')}`),
    ].filter(Boolean));
  };

  /** Dibuja los nudos donde están y pinta en rojo lo que se cruza. Devuelve cuántos cruces quedan. */
  const pintar = () => {
    const r = RADIO_PX * escala();
    const { pares, encima, total } = motor.cruces(p.hilos, pos);
    const malos = new Set(), nudosMal = new Set();
    for (const [i, j] of pares) { malos.add(i); malos.add(j); }
    for (const [v, i] of encima) { malos.add(i); nudosMal.add(v); }
    const v0 = vilo?.v;
    p.hilos.forEach(([a, b], i) => {
      const g = hilos[i];
      // La forma sale de los dos nudos del hilo: se mantiene cuando se mueven
      ponerTrazo(g, motor.trazoCuerda(pos[a], pos[b], a * 64 + b));
      g.setAttribute('class', ['des-hilo', malos.has(i) && 'mal', v0 !== undefined && (a === v0 || b === v0) && 'propio'].filter(Boolean).join(' '));
    });
    const vecinos = new Set(v0 === undefined ? [] : p.hilos.filter(h => h.includes(v0)).map(([a, b]) => (a === v0 ? b : a)));
    circulos.forEach((c, v) => {
      c.setAttribute('cx', pos[v][0]); c.setAttribute('cy', pos[v][1]);
      c.setAttribute('r', v === v0 ? r * 1.45 : r);
      c.setAttribute('class', [v === v0 && 'tomado', vecinos.has(v) && 'vecino', nudosMal.has(v) && 'mal'].filter(Boolean).join(' '));
    });
    // El nudo en vilo va encima de todos
    if (v0 !== undefined && capaNudos.lastChild !== circulos[v0]) capaNudos.append(circulos[v0]);
    if (!vilo) pintarReiniciar();
    if (!terminado && !tablero.classList.contains('fin')) {
      estado.textContent = total === 0 ? T.desNone : total === 1 ? T.desLeftOne : fmt(T.desLeft, { n: total });
      estado.classList.toggle('ok', total === 0);
    }
    return total;
  };

  const terminar = () => {
    clearInterval(reloj);
    vilo = null;
    // Si el tiempo se acabó con un nivel a medias, se muestra una forma de resolverlo (D-109)
    const aMedias = J.hechos < motor.NIVELES && !tablero.classList.contains('fin');
    J.usado = Math.min(tiempo, usado()); desde = null;
    guardar();
    terminado = true;
    desarmar(); acciones.hidden = true;
    ctx.pararReloj?.({ ...J });
    aviso.innerHTML = '';
    estado.textContent = '';
    if (aMedias) {
      tablero.classList.add('solucion');
      llevarA(p.sol);
    } else tablero.classList.add('fin');
    const todos = J.hechos >= motor.NIVELES;
    if (todos) { SFX.win(); } else SFX.timeUp();
    aviso.append(...[el('div', { class: 'aviso bien' }, todos ? T.desAll : J.hechos === 1 ? T.desTimeOne : fmt(T.desTime, { n: J.hechos })),
      aMedias ? el('p', { class: 'muted center', id: 'des-solucion', style: 'margin:0' }, fmt(T.desSolution, { k: J.hechos + 1 })) : null,
      el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar({ ...J }); } }, ctx.textoFin || T.seeResults)].filter(Boolean));
    pintarCabeza();
  };

  /** Lleva los nudos a otras posiciones, de a poco salvo que se pida menos movimiento. */
  const llevarA = (destino, listo) => {
    const origen = pos.map(q => q.slice());
    const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (quieto) { pos = destino.map(q => q.slice()); pintar(); listo?.(); return; }
    const t0 = performance.now(), DUR = 700;
    const paso = ahora => {
      const t = Math.min(1, (ahora - t0) / DUR), e = 1 - (1 - t) ** 3;
      pos = origen.map((q, v) => [q[0] + (destino[v][0] - q[0]) * e, q[1] + (destino[v][1] - q[1]) * e]);
      pintar();
      if (t < 1 && raiz.isConnected) requestAnimationFrame(paso);
      else if (t >= 1) listo?.();
    };
    requestAnimationFrame(paso);
  };

  /** Nivel resuelto: se anota, se celebra un momento y aparece el siguiente (o se termina). */
  const resuelto = () => {
    J.hechos++; J.ultimo = usado(); J.pos = null;
    SFX.win(); vibrate([30, 50, 30]);
    tablero.classList.add('fin');
    estado.textContent = T.desSolved; estado.classList.add('ok');
    guardar();
    cambiando = true;
    setTimeout(() => {
      cambiando = false;
      if (!raiz.isConnected || terminado) return;
      if (J.hechos >= motor.NIVELES || usado() >= tiempo) { terminar(); return; }
      armar(); pintar(); pintarCabeza();
    }, 650);
  };

  /** El punto del tablero bajo el dedo. */
  const punto = ev => {
    const rect = tablero.getBoundingClientRect(), k = motor.LADO / rect.width;
    return [(ev.clientX - rect.left) * k, (ev.clientY - rect.top) * k];
  };
  const quieto = () => terminado || cambiando || usado() >= tiempo || tablero.classList.contains('fin');

  tablero.addEventListener('pointerdown', ev => {
    if (vilo || quieto()) return;
    // Tocar el tablero deja "Reiniciar nivel" sin armar: el segundo toque tiene que ser seguido
    if (armado) desarmar();
    const [x, y] = punto(ev), alcance = TOMAR_PX * escala();
    // El nudo más cercano dentro del alcance: los que se dibujan juntos se pueden tomar igual
    let v = null, mejor = alcance;
    pos.forEach((q, i) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d <= mejor) { mejor = d; v = i; } });
    if (v === null) return;
    vilo = { v, dx: pos[v][0] - x, dy: pos[v][1] - y, id: ev.pointerId };
    try { tablero.setPointerCapture(ev.pointerId); } catch (_) { /* nada */ }
    SFX.tap(); vibrate(8);
    pintar();
    ev.preventDefault();
  });
  tablero.addEventListener('pointermove', ev => {
    if (!vilo || ev.pointerId !== vilo.id) return;
    const [x, y] = punto(ev);
    pos[vilo.v] = motor.dentro([x + vilo.dx, y + vilo.dy]);
    pintar();
    ev.preventDefault();
  });
  const soltar = ev => {
    if (!vilo || ev.pointerId !== vilo.id) return;
    vilo = null;
    J.pos = pos.map(q => q.slice());
    guardar();
    if (quieto()) { pintar(); return; }
    if (pintar() === 0) resuelto();
  };
  tablero.addEventListener('pointerup', soltar);
  tablero.addEventListener('pointercancel', soltar);
  // Al cambiar el ancho de la pantalla, los nudos se vuelven a medir en píxeles
  const alCrecer = () => { if (raiz.isConnected && p) pintar(); };
  window.addEventListener('resize', alCrecer);

  // El reloj corre solo con la pantalla a la vista (D-95)
  const alCambiar = () => {
    if (document.hidden) { J.usado = usado(); desde = null; guardar(); } else if (desde === null) desde = Date.now();
  };
  document.addEventListener('visibilitychange', alCambiar);

  if (motor.finPartida({ ...J, usado: usado() }, tiempo)) {
    // Retomar una partida ya terminada. Con los diez resueltos, el último queda a la vista desenredado
    if (J.hechos >= motor.NIVELES) { armar(motor.NIVELES - 1); pos = p.sol.map(q => q.slice()); tablero.classList.add('fin'); } else armar();
    pintar(); terminar(); return;
  }
  armar(); pintar(); pintarCabeza();
  // El primer dibujo se hizo antes de que el tablero tuviera ancho: se repite con el tamaño real
  requestAnimationFrame(() => { if (raiz.isConnected) pintar(); });
  reloj = setInterval(() => {
    if (!raiz.isConnected) { clearInterval(reloj); document.removeEventListener('visibilitychange', alCambiar); window.removeEventListener('resize', alCrecer); return; }
    pintarCabeza();
    if (usado() >= tiempo && !vilo) terminar();
  }, 250);
}

/**
 * El puntaje son los niveles resueltos; el desempate, el tiempo en que se resolvió el último.
 */
export const resultado = j => ({ s: motor.puntaje(j), t: motor.tarjeta(j), resumen: `${motor.puntaje(j)}/100`, ms: Math.round(j.ultimo || motor.TIEMPO_MS) });
