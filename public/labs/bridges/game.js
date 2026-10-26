/**
 * 🚂 Tren en Vilo — lab demo: build a bridge of beams over a gap, then the train crosses; if a beam
 * stretches too much it snaps. Five stages in 7 minutes; the score is the stages done and the speed,
 * like Rutas rotas (D-295). Spanish only, a prototype. The engine (physics, stages, score) is
 * engine.js. It sends no usage signal and has no comment form: it is a local demo for the owner.
 */
import { el, vibrate, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { ETAPAS, TIEMPO_S, fijos, crearSim, paso, DT, FISICA, puntajePartida, PUNTOS_ETAPA, PUNTOS_AHORRO, PUNTOS_SOLIDEZ, MARGEN_SOLIDO, BONO_RAPIDEZ, RAPIDO_S, picoDe, picoReferencia, costo, aceroUsado, unirViga, puntosMedios, partir, trazo, cubierta, esCubierta } from './engine.js';
import { QUIETO, pct, aMundo, esfuerzoAhora, colorTension, timeOfDay, DEMO, trenMini, lienzo, medidor, dibujar, fueraDeEscena } from './scene.js';

// The visitors' parameters are internal (the owner's request): they work in the workshop (a local server,
// or the Tailscale link for a phone) and on the site only for someone who came in with a lab key
// (labs-puerta.js keeps it), never for a player without one
const CON_LLAVE = (() => { try { return !!localStorage.getItem('juegos-de-salon:labs-llave'); } catch { return false; } })();
const INTERNO = CON_LLAVE || /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.ts\.net$/.test(location.hostname);
const URL_INTERNA = new URLSearchParams(INTERNO ? location.search : '');
// `?ovni`: the saucer comes right away (to look at it without waiting for chance)
const OVNI_YA = URL_INTERNA.has('ovni');
// `?ovni=mira` or `?ovni=pesca` picks the saucer's act; without it, chance picks one
const OVNI_MODO = URL_INTERNA.get('ovni') || '';
// `?ballena`: the whale jumps right away
const BALLENA_YA = URL_INTERNA.has('ballena');
// `?topo`: the mole comes right away
const TOPO_YA = URL_INTERNA.has('topo');
// `?ballena=salto` or `?ballena=chorro` picks the whale's act; without it, chance picks one
const BALLENA_MODO = URL_INTERNA.get('ballena') || '';
// `?wake`: the green boat and its wake rider cross right away; `?wake=carve|jump|fall|sink` picks the act
const WAKE_YA = URL_INTERNA.has('wake');
// `?wake=sink`: the rider sinks, only the head pops up, and the boat comes back with an orange flag raised
const WAKE_MODO = URL_INTERNA.get('wake') || '';
const POLY_BRIDGE = 'https://en.wikipedia.org/wiki/Poly_Bridge';
const T = {
  nombre: 'Tren en Vilo',
  lema: 'Arma un puente que aguante el tren.',
  como: [
    ['🌉', 'Arrastra de un punto a otro para reforzar la vía con vigas. Toca una para quitarla.'],
    ['🚂', 'Toca Probar: cruza el tren. Si una viga se estira de más, se corta.'],
    ['⏱', `Son ${ETAPAS.length} etapas en ${TIEMPO_S / 60} minutos, con poca madera. Suman las etapas superadas, la madera que sobra, la solidez y la rapidez.`],
  ],
  empezar: '🚂 Empezar', aJugar: '¡A construir!',
  etapa: 'Etapa {n} de {total}', vigas: 'Vigas: {n} de {max}', madera: 'Madera: {n} de {max} m', acero: '🔩 {n} de {max} m', materialMadera: '🪵 Madera', materialAcero: '🔩 Acero', carga: 'Tren {x} más pesado', cargaNormal: 'Tren de peso normal',
  probar: '🚂 Probar', arreglar: '✏️ Arreglar', deshacer: '↩ Deshacer', borrar: '🧹 Borrar', borrarSeguro: '🧹 ¿Seguro?',
  saltar: 'Saltar etapa', rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  aviso: {
    inicio: 'La vía ya está puesta: arrastra desde un punto marcado para reforzarla.',
    larga: 'Ese trazo no se parte en vigas: prueba uno más corto o más recto.', fuera: 'Fuera del área de construcción.',
    repetida: 'Ya hay una viga ahí.', presupuesto: 'No te quedan vigas: quita alguna.', sinMadera: 'No te alcanza la madera: quita alguna viga.', sinAcero: 'No te queda acero: usa madera o quita una viga de acero.', acero: 'El acero aguanta el doble, pero hay poco.', suelta: 'Empieza en un punto marcado.',
    quitada: 'Viga quitada.', via: 'La vía no se quita: el tren la necesita.', borrado: 'Borraste el puente: ↩ Deshacer lo trae de vuelta.',
    cruza: '🚂 Cruzando…', paso: '✅ ¡El tren pasó!', cayo: '💥 Se cayó el puente. Arréglalo y prueba otra vez.', cortada: '💥 Se cortó una viga: el puente tiene que quedar en pie. Refuérzalo y prueba otra vez.',
  },
  maximo: 'máx. {p}', carga_titulo: 'Carga',
  felicita: {
    titulo: '¡Etapa {n} superada!',
    madera: '🪵 Madera', maderaValor: '{n} de {max} m', vigasValor: '{n} de {max} vigas', minimo: 'mínimo conocido: {n}',
    esfuerzo: '🧱 Esfuerzo máximo', esfuerzoValor: '{p}', referencia: 'el puente más barato: {r}',
    tiempo: '⏱ Tiempo', puntos: '⭐ Puntos', puntosDetalle: 'etapa {e} + ahorro {a} + solidez {s}',
    seguir: 'Siguiente etapa ▶', resultado: '🏁 Ver el resultado',
  },
  fin: { todas: '¡Todos los puentes en pie!', tiempo: 'Se acabó el tiempo', rendido: 'Te rendiste' },
  cuenta: {
    titulo: '🧮 Cómo se calculó',
    cabeza: ['Etapa', 'Madera', 'Esfuerzo', 'Puntos'], cabezaVigas: 'Vigas',
    minimo: 'mín. {n}', referencia: 'vs. {n}',
    subtotal: 'Suma',
    notas: [
      '✅ Etapa: {e} por cada una que pasó el tren.',
      '🪵 Ahorro: hasta {a} por etapa, todo con lo mínimo conocido, nada si usaste todo.',
      '🧱 Solidez: hasta {s} por etapa, todo si el puente se esforzó {m} puntos menos que el más barato, nada si igual o más.',
    ],
    rapidez: '⏱ Rapidez ({t})',
    notaRapidez: 'Hasta {u}: todo en {rapido} o menos, nada a los {max}. Te tocó el {f}, por {n} de {total} etapas.',
    total: 'Total: {a} + {b} + {c} + {d}',
  },
  solucion: '💡 Así se podía cruzar la etapa {n}', solucionMadera: 'Usa {n} m de madera de los {max} m que tenías, con un esfuerzo máximo de {p}.', solucionVigas: 'Usa {n} vigas de las {max} que tenías, con un esfuerzo máximo de {p}.',
  otraVez: '🔁 Jugar otra vez', laboratorio: '‹ Volver al laboratorio',
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const vista = document.getElementById('vista');
const CONFIRMAR_MS = 3000;

const tituloJuego = (chico = false) => el('h1', { class: `titulo-tv${chico ? ' chico' : ''}` },
  el('span', { class: 'tren', 'aria-hidden': 'true' }, '🚂'), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: POLY_BRIDGE, target: '_blank', rel: 'noopener' }, 'Poly Bridge'), ', de Dry Cactus.');


function portada() {
  const e = ETAPAS[0];
  // The cover shows only the bridge and the water right under it
  const c = lienzo(e, { arriba: 1.9, abajo: -2.2 });
  vista.replaceChildren(
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), el('div', { class: 'tv-demo', 'aria-hidden': 'true' }, c)),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); parar(); empezar(); } }, T.empezar),
    // The steps go after Empezar, so it is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))));
  c._ajustar();
  let sim = crearSim(e, DEMO), vivo = true;
  window.__portada = () => sim;
  const parar = () => { vivo = false; };
  if (QUIETO) { dibujar(c, e, { vigas: DEMO }); return; }
  const cuadro = () => {
    if (!vivo || !c.isConnected) return;
    for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
    dibujar(c, e, { sim });
    // Once the train is gone, the empty bridge rests a few seconds before the next one comes: not a hard loop
    if (sim.fin && (sim.tren.cayo || fueraDeEscena(sim, e))) {
      pausa ||= performance.now() + 3000 + Math.random() * 2000;
      if (performance.now() >= pausa) { sim = crearSim(e, DEMO); pausa = 0; }
    }
    requestAnimationFrame(cuadro);
  };
  let pausa = 0;
  requestAnimationFrame(cuadro);
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

const P = { etapas: ETAPAS, topo: { etapa: -1, retraso: 0, visto: true }, ovni: { etapa: -1, retraso: 0, visto: true, modo: 'mira' }, ballena: { etapa: -1, retraso: 0, visto: true, modo: 'chorro' }, wake: { etapa: -1, retraso: 0, visto: true, modo: 'carve' }, rotasAntes: new Set(), etapa: 0, hechas: 0, usadas: [], picos: [], inicio: 0, fin: null, vigas: [], historial: [], reloj: null, simulando: false };
const segundos = () => (P.fin?.segundos ?? (Date.now() - P.inicio) / 1000);

/**
 * The game's five crossings: one per level, drawn from the catalog (catalogo.json, made by
 * tools/generators/bridges.mjs), so a regular player rarely meets the same ones. Without the catalog,
 * the five fixed stages.
 */
let CATALOGO = null;
// The wood catalog (each beam costs its length) is the game; `?catalogo=vigas` loads the old beam-count
// one and `?catalogo=prueba` the heavier-train one, kept for comparison
// The game is in the lab while its page is under /labs/: there it offers lab-only tools (the stage skip)
const EN_LABS = /\/labs\//.test(location.pathname);
const ARCHIVO_CATALOGO = { prueba: './catalogo-prueba.json', vigas: './catalogo.json' }[new URLSearchParams(location.search).get('catalogo')] || './catalogo-madera.json';
fetch(new URL(ARCHIVO_CATALOGO, import.meta.url)).then(r => (r.ok ? r.json() : null)).then(c => { CATALOGO = Array.isArray(c) && c.length ? c : null; }).catch(() => {});
function sortearEtapas() {
  if (!CATALOGO) return ETAPAS;
  return [1, 2, 3, 4, 5].map((nivel, k) => {
    const de = CATALOGO.filter(c => c.nivel === nivel);
    return de.length ? de[Math.floor(Math.random() * de.length)] : ETAPAS[k];
  });
}

/**
 * What may visit the current stage. One character per game, drawn at the start: the saucer (it looks
 * and asks, or it fishes), the whale (it jumps, or it blows its spout) or the mole (it digs a
 * tunnel through a cliff and falls into the water) or the green boat with its wake rider (carving, a
 * jump, or a fall and a pick-up), once, in one stage. Birds
 * and clouds are the background: they come and go on their own.
 */
/** The game's visitor: who, in which stage, after how many seconds into it; the others don't come. */
function asignarVisita(quien, etapa, retraso) {
  P.ovni = { etapa: quien === 'ovni' ? etapa : -1, retraso, visto: quien !== 'ovni',
    modo: ['mira', 'pesca'].includes(OVNI_MODO) ? OVNI_MODO : Math.random() < 0.5 ? 'mira' : 'pesca' };
  P.ballena = { etapa: quien === 'ballena' ? etapa : -1, retraso, visto: quien !== 'ballena',
    modo: ['salto', 'chorro'].includes(BALLENA_MODO) ? BALLENA_MODO : Math.random() < 0.5 ? 'salto' : 'chorro' };
  P.topo = { etapa: quien === 'topo' ? etapa : -1, retraso, visto: quien !== 'topo' };
  P.wake = { etapa: quien === 'wake' ? etapa : -1, retraso, visto: quien !== 'wake',
    modo: ['carve', 'jump', 'fall', 'sink'].includes(WAKE_MODO) ? WAKE_MODO : ['carve', 'jump', 'fall', 'sink'][Math.floor(Math.random() * 4)] };
}
/** A visitor whose stage was passed before its moment moves to the next one and comes a few seconds in. */
function mudarVisita() {
  for (const q of ['ovni', 'ballena', 'topo', 'wake']) if (P[q].etapa === P.etapa && !P[q].visto) Object.assign(P[q], { etapa: P.etapa + 1, retraso: 3 });
}

const visitasDe = () => ({
  // One that doesn't fit this crossing (the whale in narrow water, the mole with no rock to dig) hands over to one that does
  noCabe: q => asignarVisita(q === 'ballena' ? 'wake' : 'ovni', P.etapa, 0),
  ovni: P.ovni.etapa === P.etapa && !P.ovni.visto, retraso: P.ovni.retraso, modoOvni: P.ovni.modo, verOvni: () => { P.ovni.visto = true; },
  topo: P.topo.etapa === P.etapa && !P.topo.visto, retrasoTopo: P.topo.retraso, verTopo: () => { P.topo.visto = true; },
  ballena: P.ballena.etapa === P.etapa && !P.ballena.visto, retrasoBallena: P.ballena.retraso, modoBallena: P.ballena.modo, verBallena: () => { P.ballena.visto = true; },
  wake: P.wake.etapa === P.etapa && !P.wake.visto, retrasoWake: P.wake.retraso, modoWake: P.wake.modo, verWake: () => { P.wake.visto = true; },
});

function empezar() {
  cuentaRegresiva({ titulo: `🚂 ${T.nombre}`, ya: T.aJugar }).then(() => {
    // One character per game, drawn at the start: the saucer or the whale (never both), with its act,
    // its stage and its moment. `?ovni[=mira|pesca]` or `?ballena[=salto|chorro]` picks it, in stage 1
    const forzado = OVNI_YA || BALLENA_YA || TOPO_YA || WAKE_YA;
    const quien = OVNI_YA ? 'ovni' : BALLENA_YA ? 'ballena' : TOPO_YA ? 'topo' : WAKE_YA ? 'wake' : ['ovni', 'ballena', 'topo', 'wake'][Math.floor(Math.random() * 4)];
    const etapaSorteada = forzado ? 0 : Math.floor(Math.random() * P.etapas.length);
    asignarVisita(quien, etapaSorteada, forzado ? 0.8 : 5 + Math.random() * 20);   // between 5 and 25 s into its stage
    P.etapas = sortearEtapas();
    Object.assign(P, { rotasAntes: new Set(), etapa: 0, hechas: 0, usadas: [], picos: [], inicio: Date.now(), fin: null, vigas: cubierta(P.etapas[0]), historial: [] });
    jugar();
    clearInterval(P.reloj);
    P.reloj = setInterval(() => {
      const quedan = TIEMPO_S - segundos();
      const r = document.getElementById('tv-reloj');
      if (r) { r.textContent = `⏱ ${mmss(Math.max(0, quedan))}`; r.classList.toggle('apurado', quedan <= 60); }
      if (quedan <= 0) terminar('tiempo');
    }, 250);
  });
}

/**
 * The stage's summary, the only place it is shown (owner's request): over the screen when a stage
 * passes, with the wood, the peak strain, the time and the points of that stage. It goes with its
 * button, a tap anywhere, or on its own after `FELICITA_MS`, with a bar that empties until then. The
 * game's clock stops while it is open.
 */
const FELICITA_MS = 10000;
function felicitar(e, k, seguir) {
  const F = T.felicita, a = puntajePartida(P.usadas, 0, P.etapas, P.picos).ahorros[k], abierta = Date.now();
  const segs = Math.round((abierta - (P.inicioEtapa || abierta)) / 1000), ultima = P.hechas >= P.etapas.length;
  const fila = (rotulo, valor, chico) => el('div', { class: 'tv-fel-fila' }, el('span', {}, rotulo), el('b', {}, valor), chico ? el('small', {}, chico) : null);
  let listo = false, reloj = 0;
  const cerrar = () => {
    if (listo) return;
    listo = true; clearTimeout(reloj); capa.remove();
    P.inicio += Date.now() - abierta;   // the paused seconds don't count against the clock
    seguir();
  };
  const capa = el('div', { class: 'tv-felicitacion', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tv-fel-titulo', onClick: ev => { if (ev.target === capa) cerrar(); } },
    el('div', { class: 'panel tv-fel-caja' },
      el('h2', { id: 'tv-fel-titulo' }, `✅ ${fmt(F.titulo, { n: k + 1 })}`),
      fila(F.madera, e.madera ? fmt(F.maderaValor, { n: num(a.usadas), max: num(e.presupuesto) }) : fmt(F.vigasValor, { n: a.usadas, max: e.presupuesto }), fmt(F.minimo, { n: num(e.minimo) })),
      fila(F.esfuerzo, fmt(F.esfuerzoValor, { p: pct(a.pico) }), fmt(F.referencia, { r: pct(a.referencia) })),
      fila(F.tiempo, mmss(segs)),
      fila(F.puntos, num(PUNTOS_ETAPA + a.puntos + a.puntosSolidez), fmt(F.puntosDetalle, { e: PUNTOS_ETAPA, a: num(a.puntos), s: num(a.puntosSolidez) })),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-seguir', onClick: () => { SFX.tap(); cerrar(); } }, ultima ? F.resultado : F.seguir),
      el('div', { class: 'tv-fel-barra', 'aria-hidden': 'true' }, el('span', { style: `animation-duration: ${FELICITA_MS}ms` }))));
  document.body.append(capa);
  capa.querySelector('#btn-seguir').focus({ preventScroll: true });
  if (!QUIETO) confetti({ count: 60, duration: 1200 });
  reloj = setTimeout(cerrar, FELICITA_MS);
}

function jugar() {
  P.inicioEtapa = Date.now();
  const e = P.etapas[P.etapa];
  const c = lienzo(e);
  c._time = timeOfDay(P.etapa / Math.max(1, P.etapas.length - 1));
  const aguja = medidor(picoReferencia(e), T);
  const aviso = el('p', { class: 'tv-aviso', 'aria-live': 'polite' }, e.acero ? T.aviso.acero : T.aviso.inicio);
  const puntos = el('div', { class: 'tv-puntos', 'aria-hidden': 'true' },
    ...P.etapas.map((_, k) => el('span', { class: k < P.hechas ? 'hecha' : k === P.etapa ? 'actual' : '' })));
  const cuenta = el('span', { class: 'tv-cuenta', id: 'tv-cuenta' });
  // On wood, what is left as planks, one per meter (the last one shorter when the budget has decimals);
  // steel, when the crossing has it, as gray bars beside them
  const tiras = (total, clase) => el('div', { class: `tv-tablones ${clase}`, 'aria-hidden': 'true' },
    ...Array.from({ length: Math.ceil(total - 1e-9) }, (_, k) => el('span', { style: `flex: ${Math.min(1, total - k)}` }, el('i'))));
  const llenar = (fila, total, queda) => [...fila.children].forEach((t, k) => {
    const largo = Math.min(1, total - k);
    t.firstChild.style.width = `${(Math.max(0, Math.min(largo, queda - k)) / largo) * 100}%`;
  });
  const tablones = e.madera ? tiras(e.presupuesto, 'madera') : null;
  if (tablones && e.acero) tablones.style.flex = e.presupuesto;
  const barras = e.acero ? tiras(e.acero, 'acero') : null;
  if (barras) barras.style.flex = e.acero;
  const cuentaAcero = e.acero ? el('span', { class: 'tv-cuenta tv-cuenta-acero', id: 'tv-cuenta-acero' }) : null;
  // The material the next beam is laid in: only on crossings with steel
  P.material = 'madera';
  const materiales = e.acero ? el('div', { class: 'tv-material', role: 'group' }, ...['madera', 'acero'].map(m =>
    el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: `btn-${m}`, 'aria-pressed': String(m === P.material), onClick: ev => {
      P.material = m; SFX.tap();
      for (const b of ev.currentTarget.parentNode.children) b.setAttribute('aria-pressed', String(b === ev.currentTarget));
    } }, m === 'madera' ? T.materialMadera : T.materialAcero))) : null;
  const botonProbar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-probar', onClick: () => probarPuente() }, T.probar);
  const armados = {};
  const conConfirmacion = (clave, rotulo, rotuloArmado, accion, attrs = {}) => {
    const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', ...attrs, onClick: () => {
      if (armados[clave]) { clearTimeout(armados[clave]); armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); accion(); return; }
      SFX.tap(); vibrate(15); b.textContent = rotuloArmado; b.classList.add('armado');
      armados[clave] = setTimeout(() => { armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); }, CONFIRMAR_MS);
    } }, rotulo);
    return b;
  };
  const botonDeshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
    if (!P.historial.length) return;
    P.vigas = P.historial.pop(); SFX.tap(); repintar();
  } }, T.deshacer);
  const botonBorrar = conConfirmacion('borrar', T.borrar, T.borrarSeguro, () => {
    if (!P.vigas.some(v => !esCubierta(v))) return;
    // Clearing leaves the deck: it is never removed
    P.historial.push(P.vigas); P.vigas = cubierta(e); SFX.splash?.(); aviso.textContent = T.aviso.borrado; repintar();
  }, { id: 'btn-borrar' });
  const botonRendirse = conConfirmacion('rendirse', T.rendirse, T.rendirseSeguro, () => terminar('rendido'), { id: 'btn-rendirse' });
  const fila = el('div', { class: 'tv-acciones' }, botonDeshacer, botonBorrar, botonRendirse);
  // While the game is in the lab (owner's request): jump to the next stage without building, to try the
  // later ones. A skipped stage counts as passed with all its wood spent and no strain, so the score holds
  const botonSaltar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm tv-saltar', id: 'btn-saltar', 'aria-label': T.saltar, title: T.saltar, onClick: () => {
    if (P.simulando || P.fin) return;
    SFX.tap(); P.hechas++; P.usadas.push(e.presupuesto); P.picos.push(null);
    if (P.hechas >= P.etapas.length) { terminar('todas'); return; }
    mudarVisita(); P.etapa++; P.vigas = cubierta(P.etapas[P.etapa]); P.historial = []; P.rotasAntes = new Set(); jugar();
  } }, '⏭');

  vista.replaceChildren(
    // On top, the progress and the clock; then the stage as the screen's title, with the train's weight
    // always in view (it was a sign that slid away); the board; what is spent and the notice; the buttons
    el('div', { class: 'tv-cabeza' }, puntos,
      el('span', { class: 'tv-reloj', id: 'tv-reloj' }, `⏱ ${mmss(Math.max(0, TIEMPO_S - segundos()))}`), ...(EN_LABS ? [botonSaltar] : [])),
    el('div', { class: 'tv-titulo-etapa' },
      el('h2', { class: 'tv-etapa' }, fmt(T.etapa, { n: P.etapa + 1, total: P.etapas.length })),
      el('p', { class: `tv-carga${e.carga > 1 ? ' pesado' : ''}`, id: 'tv-carga' }, trenMini(e.carga, e), e.carga > 1 ? fmt(T.carga, { x: `×${String(e.carga).replace('.', ',')}` }) : T.cargaNormal)),
    el('div', { class: 'tv-tablero' }, c, aguja.caja),
    ...(materiales ? [materiales] : []),
    el('div', { class: 'tv-barra' },
      barras ? el('div', { class: 'tv-tiras' }, tablones, barras) : tablones,
      barras ? el('p', { class: 'tv-cuentas' }, cuenta, cuentaAcero) : cuenta, aviso),
    botonProbar, fila);
  c._ajustar();

  const usados = () => new Set([...fijos(e).map(([x, y]) => `${x},${y}`), ...P.vigas.flatMap(v => [v.a.join(','), v.b.join(',')])]);
  function repintar(arrastre = null) {
    const gastado = costo(e, P.vigas);
    cuenta.textContent = e.madera ? fmt(T.madera, { n: num(gastado), max: num(e.presupuesto) }) : fmt(T.vigas, { n: P.vigas.length, max: e.presupuesto });
    cuenta.classList.toggle('lleno', gastado >= e.presupuesto - 0.05);
    if (tablones) llenar(tablones, e.presupuesto, e.presupuesto - gastado);
    if (barras) {
      const acero = aceroUsado(P.vigas);
      llenar(barras, e.acero, e.acero - acero);
      cuentaAcero.textContent = fmt(T.acero, { n: num(acero), max: num(e.acero) });
      cuentaAcero.classList.toggle('lleno', acero >= e.acero - 0.05);
    }
    botonDeshacer.disabled = !P.historial.length || P.simulando;
    botonProbar.disabled = P.simulando;
    botonBorrar.disabled = P.simulando || !P.vigas.some(v => !esCubierta(v));
    dibujar(c, e, { vigas: P.vigas, grilla: !P.simulando, arrastre, usados: usados(), rotasAntes: P.rotasAntes, visitas: visitasDe() });
  }
  repintar();
  // While building, the scene stays alive (clouds, water, stars): repaint every frame
  let ultimoArrastre = null;
  const vivo = () => {
    if (!c.isConnected || P.fin) return;
    if (!P.simulando) dibujar(c, e, { vigas: P.vigas, grilla: true, arrastre: ultimoArrastre, usados: usados(), rotasAntes: P.rotasAntes, visitas: visitasDe() });
    requestAnimationFrame(vivo);
  };
  if (!QUIETO) requestAnimationFrame(vivo);

  // Dragging from a joint in use to any grid point lays a beam; a tap on a beam removes it
  const punto = ev => { const r = c.getBoundingClientRect(); return aMundo(c, ev.clientX - r.left, ev.clientY - r.top); };
  const cercano = ([x, y]) => [Math.round(x), Math.round(y)];
  const cerca = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= 0.45;
  let desde = null, inicioPx = null;
  c.addEventListener('pointerdown', ev => {
    if (P.simulando || P.fin) return;
    const m = punto(ev), g = cercano(m);
    inicioPx = [ev.clientX, ev.clientY];
    // Also from a point inside a beam (a mid joint), on wood budgets
    desde = cerca(m, g) && (usados().has(g.join(',')) || (e.madera && puntosMedios(P.vigas).has(g.join(',')))) ? g : null;
    c.setPointerCapture(ev.pointerId);
  });
  c.addEventListener('pointermove', ev => {
    if (!desde) return;
    const m = punto(ev), g = cercano(m);
    const hasta = cerca(m, g) ? g : m;
    const t = Array.isArray(hasta) && Number.isInteger(hasta[0]) && Number.isInteger(hasta[1]) ? trazo(e, P.vigas, desde, hasta) : { piezas: [], motivo: 'suelta' };
    const conAcero = !!e.acero && P.material === 'acero', piezas = conAcero ? t.piezas.map(p => ({ ...p, acero: true })) : t.piezas;
    ultimoArrastre = { a: desde, b: hasta, ok: !t.motivo && costo(e, P.vigas) + costo(e, piezas) <= e.presupuesto + 1e-9 && aceroUsado(P.vigas) + aceroUsado(piezas) <= (e.acero || 0) + 1e-9 };
    repintar(ultimoArrastre);
  });
  c.addEventListener('pointerup', ev => {
    const m = punto(ev), g = cercano(m);
    const toque = inicioPx && Math.hypot(ev.clientX - inicioPx[0], ev.clientY - inicioPx[1]) < 8;
    if (toque) {
      // A tap: removes the beam under the finger, if there is one
      const i = vigaBajo(m);
      if (i >= 0 && esCubierta(P.vigas[i])) { SFX.error(); vibrate([30, 30, 30]); aviso.textContent = T.aviso.via; }
      else if (i >= 0) { P.historial.push(P.vigas); P.vigas = P.vigas.filter((_, k) => k !== i); SFX.tap(); aviso.textContent = T.aviso.quitada; }
      else if (!desde) aviso.textContent = T.aviso.suelta;
      desde = null; ultimoArrastre = null; repintar(); return;
    }
    if (desde) {
      const hasta = cerca(m, g) ? g : null;
      // On wood, a beam that ends inside another, or runs over a joint, joins there (unirViga); a stroke
      // longer than one beam is laid as a beam per grid step (trazo), the whole deck in one drag
      const base = e.madera && hasta ? partir(partir(P.vigas, desde), hasta) : P.vigas;
      const t = hasta ? trazo(e, base, desde, hasta) : { piezas: [], motivo: 'fuera' };
      let vs = P.vigas;
      const deAcero = !!e.acero && P.material === 'acero';
      for (const pz of t.piezas) vs = e.madera ? unirViga(vs, pz.a, pz.b, usados(), deAcero) : [...vs, pz];
      // What it costs is measured after joining: a long beam over the deck adds only what is not there yet
      const motivo = t.motivo || (costo(e, vs) === costo(e, P.vigas) && vs.length === P.vigas.length && aceroUsado(vs) === aceroUsado(P.vigas) ? 'repetida'
        : costo(e, vs) > e.presupuesto + 1e-9 ? (e.madera ? 'sinMadera' : 'presupuesto')
        : aceroUsado(vs) > (e.acero || 0) + 1e-9 ? 'sinAcero' : null);
      if (motivo) { if (motivo !== 'cero') { aviso.textContent = T.aviso[motivo] || T.aviso.fuera; SFX.error(); vibrate([30, 30, 30]); } }
      else { P.historial.push(P.vigas); P.vigas = vs; SFX.tap(); vibrate(10); aviso.textContent = ''; }
    }
    desde = null; ultimoArrastre = null; repintar();
  });
  function vigaBajo([x, y]) {
    let mejor = -1, d = 0.22;
    P.vigas.forEach((v, k) => {
      const [ax, ay] = v.a, [bx, by] = v.b, dx = bx - ax, dy = by - ay;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      const dd = Math.hypot(x - (ax + u * dx), y - (ay + u * dy));
      if (dd < d) { d = dd; mejor = k; }
    });
    return mejor;
  }

  // Testing: the train crosses in real time; the beams change color with the strain
  function probarPuente() {
    if (P.simulando) {
      // ✏️ Arreglar: back to building, with the same beams
      P.simulando = false; botonProbar.textContent = T.probar; aviso.textContent = ''; aguja.ver(false); repintar(); return;
    }
    SFX.tap();
    P.simulando = true; botonProbar.textContent = T.arreglar; botonProbar.disabled = true;
    aviso.textContent = T.aviso.cruza;
    repintar();
    const sim = crearSim(e, P.vigas);
    aguja.ver(true);
    let rotas = 0, cierre = 0, avisado = false;
    const cuadro = () => {
      if (!P.simulando || !c.isConnected || P.fin) return;
      for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
      const ahora = sim.vigas.filter(v => v.rota).length;
      if (ahora > rotas) { rotas = ahora; SFX.error(); vibrate(40); }
      dibujar(c, e, { sim, visitas: visitasDe() });
      // The needle is the load right now, also after the test (zero if nothing weighs on it); the arrow keeps the peak
      aguja.poner(esfuerzoAhora(sim), picoDe(sim));
      if (!sim.fin) { requestAnimationFrame(cuadro); return; }
      // It made it: the notice now, and the scene runs on until the last wagon leaves the screen
      if (sim.tren.llego) {
        if (!avisado) { avisado = true; aviso.textContent = T.aviso.paso; SFX.win(); vibrate([30, 50, 30]); P.hechas++; P.usadas.push(costo(e, P.vigas)); P.picos.push(picoDe(sim)); P.rotasAntes = new Set(); }
        if (!fueraDeEscena(sim, e)) { requestAnimationFrame(cuadro); return; }
        setTimeout(() => {
          if (P.fin) return;
          felicitar(e, P.hechas - 1, () => {
          if (P.fin) return;
          P.simulando = false;
          if (P.hechas >= P.etapas.length) { terminar('todas'); return; }
          mudarVisita(); P.etapa++; P.vigas = cubierta(P.etapas[P.etapa]); P.historial = []; P.rotasAntes = new Set(); jugar();
          });
        }, 600);
        return;
      }
      // It fell: the scene keeps moving a moment (the fall, the splash, the smoke clearing)
      if (!cierre) cierre = performance.now();
      if (!avisado) {
        avisado = true; aviso.textContent = sim.cortada ? T.aviso.cortada : T.aviso.cayo; botonProbar.disabled = false;
        // The beams that snapped stay marked while you fix the bridge
        P.rotasAntes = Object.assign(new Set(sim.vigas.map((v, k) => (v.rota ? `${P.vigas[k].a}|${P.vigas[k].b}` : null)).filter(Boolean)), { desde: Date.now() });
      }
      if (performance.now() - cierre < 1800) requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  }
}


function terminar(motivo) {
  if (P.fin) return;
  clearInterval(P.reloj);
  P.simulando = false;
  document.querySelector('.tv-felicitacion')?.remove();   // time ran out with a stage's summary open
  P.fin = { motivo, segundos: Math.min(TIEMPO_S, (Date.now() - P.inicio) / 1000) };
  resultado();
}

/** A number with at most one decimal, with a comma: 3,3. */
const num = x => (Math.round(x * 10) / 10).toString().replace('.', ',');

/**
 * The result: the score, and under it the arithmetic as a table, one row per stage (passed or
 * not, with its beams and its points), then the three parts and the total.
 */
/**
 * The stage where the game stopped (not crossed): a bridge that works, with the train crossing it over
 * and over, so the player learns how it could be done. It is the catalog's own solution for that crossing.
 */
function solucionVista() {
  if (P.hechas >= P.etapas.length) return null;
  const e = P.etapas[P.hechas];
  if (!e?.solucion?.length) return null;
  const vigas = e.solucion.map(([a, b]) => ({ a, b }));
  const c = lienzo(e);
  c._time = timeOfDay(P.hechas / Math.max(1, P.etapas.length - 1));
  const caja = el('div', { class: 'panel tv-solucion', id: 'solucion' },
    el('p', { class: 'lead' }, fmt(T.solucion, { n: P.hechas + 1 })),
    el('div', { class: 'tv-tablero' }, c),
    el('p', { class: 'muted tv-nota' }, e.madera ? fmt(T.solucionMadera, { n: num(costo(e, vigas)), max: num(e.presupuesto), p: pct(picoReferencia(e)) }) : fmt(T.solucionVigas, { n: vigas.length, max: e.presupuesto, p: pct(picoReferencia(e)) })));
  requestAnimationFrame(() => {
    c._ajustar();
    let sim = crearSim(e, vigas);
    if (QUIETO) { dibujar(c, e, { vigas }); return; }
    const cuadro = () => {
      if (!c.isConnected) return;
      for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
      dibujar(c, e, { sim });
      if (sim.fin && (sim.tren.cayo || fueraDeEscena(sim, e))) sim = crearSim(e, vigas);
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  });
  return caja;
}

function resultado() {
  const { motivo, segundos: seg } = P.fin;
  const p = puntajePartida(P.usadas, seg, P.etapas, P.picos);
  const todas = P.hechas === P.etapas.length, C = T.cuenta;
  const td = (x, cls = '') => el('td', { class: cls }, x);
  // A number with a small line under it: what it is measured against, or how it adds up
  const doble = (grande, chico, attrs = {}) => [el('b', attrs, grande), el('small', {}, chico)];
  const filas = P.etapas.map((e, k) => {
    const a = p.ahorros[k];
    if (!a) return el('tr', { class: 'no' }, td(`${k + 1} ⬛`), td('—', 'num'), td('—', 'num'), td('0', 'num'));
    const suma = PUNTOS_ETAPA + a.puntos + a.puntosSolidez;
    return el('tr', {},
      td(`${k + 1} ✅`),
      td(doble(`${num(a.usadas)}/${num(e.presupuesto)}`, fmt(C.minimo, { n: num(e.minimo) })), 'num'),
      td(a.pico === null ? '—' : doble(pct(a.pico), fmt(C.referencia, { n: pct(a.referencia) }), { style: `color: ${colorTension(a.pico * FISICA.quiebre)}` }), 'num'),
      td(doble(num(suma), `${PUNTOS_ETAPA} + ${num(a.puntos)} + ${num(a.puntosSolidez)}`), 'num'));
  });
  const tabla = el('table', { class: 'tv-tabla' },
    el('thead', {}, el('tr', {}, ...C.cabeza.map((x, k) => el('th', { class: k ? 'num' : '' }, k === 1 && !P.etapas.some(e => e.madera) ? C.cabezaVigas : x)))),
    el('tbody', {}, ...filas),
    el('tfoot', {}, el('tr', {}, el('td', { colspan: '3' }, C.subtotal), td(`${p.etapas + p.ahorro + p.solidez}`, 'num'))));
  const cuenta = el('div', { class: 'panel tv-cuenta-final', id: 'cuenta' },
    el('p', { class: 'lead' }, C.titulo),
    el('div', { class: 'tv-tabla-caja' }, tabla),
    el('ul', { class: 'muted tv-nota tv-leyenda' }, ...C.notas.map(x => el('li', {}, fmt(x, { e: PUNTOS_ETAPA, a: PUNTOS_AHORRO, s: PUNTOS_SOLIDEZ, m: Math.round(MARGEN_SOLIDO * 100) })))),
    el('div', { class: 'tv-linea' }, el('span', {}, fmt(C.rapidez, { t: mmss(seg) })), el('b', {}, `+${p.rapidez}`)),
    el('p', { class: 'muted tv-nota' }, fmt(C.notaRapidez, { u: BONO_RAPIDEZ, rapido: mmss(RAPIDO_S), max: mmss(TIEMPO_S), f: pct(p.fraccionTiempo), n: p.pasadas, total: P.etapas.length })),
    el('div', { class: 'tv-linea total' }, el('span', {}, fmt(C.total, { a: p.etapas, b: p.ahorro, c: p.solidez, d: p.rapidez })), el('b', {}, `${p.total}`)));
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: `tv-sello${todas ? '' : ' mal'}` }, T.fin[motivo]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${p.total}/100`),
    cuenta,
    solucionVista(),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otro', onClick: () => { SFX.tap(); empezar(); } }, T.otraVez),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio)));
  scrollTo(0, 0);
  if (todas) { SFX.win(); vibrate([40, 30, 40, 30, 120]); if (!QUIETO) confetti({ count: 160, duration: 2200 }); }
  else SFX.tap();
}

document.getElementById('sound-slot').append(soundToggle());
initSound?.();
// While building, the page doesn't scroll under the finger that drags a beam
addEventListener('resize', () => { const c = document.querySelector('.tv-lienzo'); if (c?._ajustar && !P.simulando) { c._ajustar(); } });
portada();
// For the end-to-end scripts and the owner's console
window.__trenEnVilo = { P, ETAPAS, timeOfDay };
