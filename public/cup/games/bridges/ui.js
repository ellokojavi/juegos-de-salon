/**
 * 🚅 Tren en Vilo: the screen for its own page (/bridges/), Uno al día and La Copa, out of the lab since
 * D-456 with everything the owner approved there: the deck already laid, steel on the later crossings,
 * the visitors, a summary after each stage and, at the end, how the stage it stopped at could be
 * crossed. Lay beams over a gap, test, and the train crosses or the bridge falls. Five crossings in 7
 * minutes, drawn from the catalog with the day's seed, so everyone builds the same.
 *
 * The clock is the cup's (`ctx.tiempo()`), which pauses with the screen hidden and survives a reload.
 * The moves are `{ etapa, hechas: [{ usada, pico }], vigas, fin, seg, puntos }`: a reload rebuilds the
 * stage with the beams laid so far. The score is the lab's (`puntajePartida`), kept in `puntos` when the
 * game ends, so the result needs neither the catalog nor the physics.
 */
import { el, confetti } from '../../../assets/js/ui.js';
import { fijos, crearSim, paso, DT, puntajePartida, picoDe, picoReferencia, costo, unirViga, puntosMedios, partir, trazo, cubierta, esCubierta, PUNTOS_ETAPA } from './physics.js';
import { QUIETO, pct, aMundo, esfuerzoAhora, timeOfDay, DEMO, trenMini, lienzo, medidor, dibujar, fueraDeEscena } from './scene.js';
import { etapasDe, tarjeta, CATALOGO_URL, NIVELES, TIEMPO_S } from './engine.js';

const POLY_BRIDGE = 'https://en.wikipedia.org/wiki/Poly_Bridge';
/** How long Clear and Give up wait for the second tap, like Clear all in Zip. */
const CONFIRMAR_MS = 3000;
/** How long a stage's summary stays before it goes on its own; the clock stops meanwhile. */
const FELICITA_MS = 10000;

// The visitors' parameters (`?ovni`, `?ballena`, `?topo`, `?wake`, each with its act) are the owner's, to
// look at one without waiting for chance: they work in the workshop (a local server, or the Tailscale link
// for a phone) and for someone who came in with a lab key, never for a player without one
const CON_LLAVE = (() => { try { return !!localStorage.getItem('juegos-de-salon:labs-llave'); } catch { return false; } })();
const INTERNO = CON_LLAVE || /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.ts\.net$/.test(globalThis.location?.hostname ?? '');
const URL_INTERNA = new URLSearchParams(INTERNO ? globalThis.location?.search ?? '' : '');
const QUIENES = ['ovni', 'ballena', 'topo', 'wake'];
const MODOS = { ovni: ['mira', 'pesca'], ballena: ['salto', 'chorro'], wake: ['carve', 'jump', 'fall', 'sink'] };
const FORZADO = QUIENES.find(q => URL_INTERNA.has(q)) || null;
const azar = xs => xs[Math.floor(Math.random() * xs.length)];

/**
 * The game's visitor: one character per game (the saucer, the whale, the mole or the boat with its wake
 * rider), with its act, in a random stage, 5 to 25 s into it. One whose stage is passed first moves to the
 * next one and comes 3 s in; one that doesn't fit a crossing hands over to another. Only for the eye: it is
 * not saved, so a reload may draw another.
 */
function visitante(total) {
  const V = {};
  const asignar = (quien, etapa, retraso) => {
    for (const q of QUIENES) {
      const pedido = URL_INTERNA.get(q);
      V[q] = { etapa: q === quien ? etapa : -1, retraso, visto: q !== quien,
        modo: MODOS[q] ? (MODOS[q].includes(pedido) ? pedido : azar(MODOS[q])) : '' };
    }
  };
  asignar(FORZADO || azar(QUIENES), FORZADO ? 0 : Math.floor(Math.random() * total), FORZADO ? 0.8 : 5 + Math.random() * 20);
  return {
    mudar(etapa) { for (const q of QUIENES) if (V[q].etapa === etapa && !V[q].visto) Object.assign(V[q], { etapa: etapa + 1, retraso: 3 }); },
    de: etapa => ({
      noCabe: q => asignar(q === 'ballena' ? 'wake' : 'ovni', etapa, 0),
      ovni: V.ovni.etapa === etapa && !V.ovni.visto, retraso: V.ovni.retraso, modoOvni: V.ovni.modo, verOvni: () => { V.ovni.visto = true; },
      topo: V.topo.etapa === etapa && !V.topo.visto, retrasoTopo: V.topo.retraso, verTopo: () => { V.topo.visto = true; },
      ballena: V.ballena.etapa === etapa && !V.ballena.visto, retrasoBallena: V.ballena.retraso, modoBallena: V.ballena.modo, verBallena: () => { V.ballena.visto = true; },
      wake: V.wake.etapa === etapa && !V.wake.visto, retrasoWake: V.wake.retraso, modoWake: V.wake.modo, verWake: () => { V.wake.visto = true; },
    }),
  };
}
const mmss = ms => { const t = Math.max(0, Math.round((ms || 0) / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
/** A number with at most one decimal, with a comma in Spanish and Portuguese and German, a dot in English. */
const num = (x, lang = 'es') => { const s = (Math.round(x * 10) / 10).toString(); return lang === 'en' ? s : s.replace('.', ','); };

let catalogo = null;
const cargarCatalogo = () => (catalogo ||= fetch(CATALOGO_URL).then(r => (r.ok ? r.json() : null)).catch(() => null));

/** The cover: the demo truss with the train crossing it, over and over. */
export function portada() {
  const e = { ancho: 4, anclas: [[0, -1], [4, -1]], presupuesto: 10, minimo: 7 };
  const caja = el('div', { class: 'tv-tablero tv-demo', 'aria-hidden': 'true' });
  const c = lienzo(e, { arriba: 1.9, abajo: -2.2 });
  caja.append(c);
  // The waiting room puts the cover on screen after this returns: start once it is there
  let intentos = 0;
  const empezar = () => {
    if (!c.isConnected) { if (++intentos < 120) requestAnimationFrame(empezar); return; }
    c._ajustar();
    if (QUIETO) { dibujar(c, e, { vigas: DEMO }); return; }
    let sim = crearSim(e, DEMO), pausa = 0;
    const cuadro = () => {
      if (!c.isConnected) return;
      for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
      dibujar(c, e, { sim });
      if (sim.fin && (sim.tren.cayo || fueraDeEscena(sim, e))) {
        pausa ||= performance.now() + 2500;
        if (performance.now() >= pausa) { sim = crearSim(e, DEMO); pausa = 0; }
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(empezar);
  return caja;
}

/** Under the rules, the credit to Poly Bridge. */
export function ejemplo({ el: h = el, T }) {
  const [a, b] = String(T.tvCredit).split('{juego}');
  return h('p', { class: 'tv-credito', id: 'tv-credito' }, a, h('a', { href: POLY_BRIDGE, target: '_blank', rel: 'noopener' }, 'Poly Bridge'), b || '');
}

export function montar(raiz, ctx) {
  const { T, fmt, SFX, vibrate, p, lang } = ctx;
  const niveles = p.niveles || NIVELES, total = niveles.length, limite = p.tiempo || TIEMPO_S * 1000;
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) ? ctx.jugadas : {};
  const J = { etapa: 0, hechas: [], vigas: [], fin: null, seg: 0, puntos: null, ...previa };
  J.hechas = (J.hechas || []).slice(0, total); J.vigas = Array.isArray(J.vigas) ? J.vigas : [];
  J.etapa = Math.min(J.etapa | 0, total - 1);
  const copia = () => ({ ...J, hechas: J.hechas.map(x => ({ ...x })), vigas: J.vigas.map(v => ({ a: [...v.a], b: [...v.b] })) });
  const guardar = () => ctx.guardar(copia());
  const final = () => ({ ...copia(), etapas: total, tiempo: limite });
  const usado = () => ctx.tiempo?.() ?? 0;
  const n1 = x => num(x, lang);

  raiz.replaceChildren(el('p', { class: 'muted center' }, T.tvLoading));
  let etapas = null, acabado = !!J.fin, reloj = null, relojNodo = null, simulando = false, historial = [], rotasAntes = new Set(), inicioEtapa = null;
  const visita = visitante(total);
  window.__trenCopa = { J, get etapas() { return etapas; } };

  const puntaje = () => puntajePartida(J.hechas.map(x => x.usada), J.seg, etapas, J.hechas.map(x => x.pico));

  const progreso = () => el('div', { class: 'tv-puntos', 'aria-hidden': 'true' },
    ...Array.from({ length: total }, (_, k) => el('span', { class: k < J.hechas.length ? 'hecha' : k === J.etapa && !J.fin ? 'actual' : '' })));

  function jugarEtapa() {
    simulando = false; historial = []; rotasAntes = new Set(); inicioEtapa = usado();
    const e = etapas[J.etapa];
    // Each stage starts with the deck laid, one beam per square from bank to bank: the train always needs it
    if (!J.vigas.some(esCubierta)) J.vigas = [...cubierta(e), ...J.vigas];
    const visitas = () => visita.de(J.etapa);
    const c = lienzo(e);
    c._time = timeOfDay(J.etapa / Math.max(1, total - 1));
    const aguja = medidor(picoReferencia(e), { carga_titulo: T.tvGauge, maximo: T.tvPeak });
    const aviso = el('p', { class: 'tv-aviso', 'aria-live': 'polite' }, T.tvStart);
    const cuenta = el('span', { class: 'tv-cuenta', id: 'tv-cuenta' });
    // What is left as planks, one per meter (the last one shorter when the budget has decimals), or as
    // gray bars on the steel crossings
    const tablones = el('div', { class: `tv-tablones ${e.acero ? 'acero' : 'madera'}`, 'aria-hidden': 'true' },
      ...Array.from({ length: Math.ceil(e.presupuesto - 1e-9) }, (_, k) => el('span', { style: `flex: ${Math.min(1, e.presupuesto - k)}` }, el('i'))));
    const llenar = queda => [...tablones.children].forEach((t, k) => {
      const largo = Math.min(1, e.presupuesto - k);
      t.firstChild.style.width = `${(Math.max(0, Math.min(largo, queda - k)) / largo) * 100}%`;
    });
    relojNodo = el('span', { class: 'tv-reloj', id: 'tv-reloj' });
    const botonProbar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-probar', onClick: () => probarPuente() }, T.tvTest);
    const armados = {};
    const conConfirmacion = (clave, rotulo, rotuloArmado, accion, attrs = {}) => {
      const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', ...attrs, onClick: () => {
        if (acabado) return;
        if (armados[clave]) { clearTimeout(armados[clave]); armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); accion(); return; }
        SFX.tap(); vibrate(15); b.textContent = rotuloArmado; b.classList.add('armado');
        armados[clave] = setTimeout(() => { armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); }, CONFIRMAR_MS);
      } }, rotulo);
      return b;
    };
    const botonDeshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
      if (!historial.length || simulando || acabado) return;
      J.vigas = historial.pop(); SFX.tap(); guardar(); repintar();
    } }, `↩ ${T.undo}`);
    // Clearing leaves the deck: it is never removed
    const botonBorrar = conConfirmacion('borrar', `🧹 ${T.tvClear}`, `🧹 ${T.tvSure}`, () => {
      if (!J.vigas.some(v => !esCubierta(v)) || simulando) return;
      historial.push(J.vigas); J.vigas = cubierta(e); aviso.textContent = T.tvCleared; guardar(); repintar();
    }, { id: 'btn-borrar' });
    const botonRendirse = conConfirmacion('rendirse', `🏳️ ${T.giveUp}`, `🏳️ ${T.tvSure}`, () => acabar('rendido'), { id: 'btn-rendirse' });

    raiz.replaceChildren(el('div', { class: 'stack tv-juego' },
      el('div', { class: 'tv-cabeza' }, progreso(), relojNodo),
      el('div', { class: 'tv-titulo-etapa' },
        el('h2', { class: 'tv-etapa', id: 'tv-etapa' }, fmt(T.tvStage, { n: J.etapa + 1, t: total })),
        el('p', { class: `tv-carga${e.carga > 1 ? ' pesado' : ''}`, id: 'tv-carga' }, trenMini(e.carga, e, c._time.t), e.carga > 1 ? fmt(T.tvLoad, { x: `×${n1(e.carga)}` }) : T.tvLoadNormal)),
      el('div', { class: 'tv-tablero' }, c, aguja.caja),
      el('div', { class: 'tv-barra' }, tablones, cuenta, aviso),
      botonProbar,
      el('div', { class: 'tv-acciones' }, botonDeshacer, botonBorrar, botonRendirse)));
    c._ajustar();
    tic();

    const usados = () => new Set([...fijos(e).map(([x, y]) => `${x},${y}`), ...J.vigas.flatMap(v => [v.a.join(','), v.b.join(',')])]);
    function repintar(arrastre = null) {
      const gastado = costo(e, J.vigas);
      cuenta.textContent = fmt(e.acero ? T.tvSteel : T.tvWood, { n: n1(gastado), max: n1(e.presupuesto) });
      cuenta.classList.toggle('lleno', gastado >= e.presupuesto - 0.05);
      llenar(e.presupuesto - gastado);
      botonDeshacer.disabled = !historial.length || simulando;
      botonProbar.disabled = simulando;
      botonBorrar.disabled = simulando || !J.vigas.some(v => !esCubierta(v));
      dibujar(c, e, { vigas: J.vigas, grilla: !simulando, arrastre, usados: usados(), rotasAntes, visitas: visitas() });
    }
    repintar();
    let ultimoArrastre = null;
    const vivo = () => {
      if (!c.isConnected || acabado) return;
      if (!simulando) dibujar(c, e, { vigas: J.vigas, grilla: true, arrastre: ultimoArrastre, usados: usados(), rotasAntes, visitas: visitas() });
      requestAnimationFrame(vivo);
    };
    if (!QUIETO) requestAnimationFrame(vivo);

    // Dragging from a joint in use to any grid point lays a beam; a tap on a beam removes it
    const punto = ev => { const r = c.getBoundingClientRect(); return aMundo(c, ev.clientX - r.left, ev.clientY - r.top); };
    const cercano = ([x, y]) => [Math.round(x), Math.round(y)];
    const cerca = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= 0.45;
    let desde = null, inicioPx = null;
    c.addEventListener('pointerdown', ev => {
      if (simulando || acabado) return;
      const m = punto(ev), g = cercano(m);
      inicioPx = [ev.clientX, ev.clientY];
      desde = cerca(m, g) && (usados().has(g.join(',')) || (e.madera && puntosMedios(J.vigas).has(g.join(',')))) ? g : null;
      c.setPointerCapture(ev.pointerId);
    });
    c.addEventListener('pointermove', ev => {
      if (!desde) return;
      const m = punto(ev), g = cercano(m);
      const hasta = cerca(m, g) ? g : m;
      const t = Number.isInteger(hasta[0]) && Number.isInteger(hasta[1]) ? trazo(e, J.vigas, desde, hasta) : { piezas: [], motivo: 'suelta' };
      ultimoArrastre = { a: desde, b: hasta, ok: !t.motivo && costo(e, J.vigas) + costo(e, t.piezas) <= e.presupuesto + 1e-9 };
      repintar(ultimoArrastre);
    });
    c.addEventListener('pointerup', ev => {
      if (simulando || acabado) { desde = null; return; }
      const m = punto(ev), g = cercano(m);
      const toque = inicioPx && Math.hypot(ev.clientX - inicioPx[0], ev.clientY - inicioPx[1]) < 8;
      if (toque) {
        const i = vigaBajo(m);
        if (i >= 0 && esCubierta(J.vigas[i])) { SFX.error(); vibrate([30, 30, 30]); aviso.textContent = T.tvDeck; }
        else if (i >= 0) { historial.push(J.vigas); J.vigas = J.vigas.filter((_, k) => k !== i); SFX.tap(); aviso.textContent = T.tvRemoved; guardar(); }
        else if (!desde) aviso.textContent = T.tvLoose;
        desde = null; ultimoArrastre = null; repintar(); return;
      }
      if (desde) {
        const hasta = cerca(m, g) ? g : null;
        const base = e.madera && hasta ? partir(partir(J.vigas, desde), hasta) : J.vigas;
        const t = hasta ? trazo(e, base, desde, hasta) : { piezas: [], motivo: 'fuera' };
        let vs = J.vigas;
        for (const pz of t.piezas) vs = e.madera ? unirViga(vs, pz.a, pz.b, usados()) : [...vs, pz];
        // What it costs is measured after joining: a long beam over the deck adds only what is not there yet
        const motivo = t.motivo || (costo(e, vs) === costo(e, J.vigas) && vs.length === J.vigas.length ? 'repetida'
          : costo(e, vs) > e.presupuesto + 1e-9 ? (e.acero ? 'sinAcero' : 'sinMadera') : null);
        const textos = { larga: T.tvTooLong, fuera: T.tvOutside, repetida: T.tvRepeated, presupuesto: T.tvNoWood, sinMadera: T.tvNoWood, sinAcero: T.tvNoSteel, suelta: T.tvLoose };
        if (motivo) { if (motivo !== 'cero') { aviso.textContent = textos[motivo] || T.tvOutside; SFX.error(); vibrate([30, 30, 30]); } }
        else {
          historial.push(J.vigas);
          J.vigas = vs; SFX.tap(); vibrate(10); aviso.textContent = '';
          guardar();
        }
      }
      desde = null; ultimoArrastre = null; repintar();
    });
    function vigaBajo([x, y]) {
      let mejor = -1, d = 0.22;
      J.vigas.forEach((v, k) => {
        const [ax, ay] = v.a, [bx, by] = v.b, dx = bx - ax, dy = by - ay;
        const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        const dd = Math.hypot(x - (ax + u * dx), y - (ay + u * dy));
        if (dd < d) { d = dd; mejor = k; }
      });
      return mejor;
    }

    // Testing: the train crosses in real time; the beams change color with the strain
    function probarPuente() {
      if (acabado) return;
      if (simulando) {
        simulando = false; botonProbar.textContent = T.tvTest; aviso.textContent = ''; aguja.ver(false); repintar(); return;
      }
      SFX.tap();
      simulando = true; botonProbar.textContent = T.tvFix; botonProbar.disabled = true;
      aviso.textContent = T.tvCrossing;
      repintar();
      const sim = crearSim(e, J.vigas);
      aguja.ver(true);
      let rotas = 0, cierre = 0, avisado = false;
      const cuadro = () => {
        if (!simulando || !c.isConnected || acabado) return;
        for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
        const ahora = sim.vigas.filter(v => v.rota).length;
        if (ahora > rotas) { rotas = ahora; SFX.error(); vibrate(40); }
        dibujar(c, e, { sim, visitas: visitas() });
        aguja.poner(esfuerzoAhora(sim), picoDe(sim));
        if (!sim.fin) { requestAnimationFrame(cuadro); return; }
        if (sim.tren.llego) {
          if (!avisado) {
            avisado = true; aviso.textContent = T.tvPassed; SFX.win(); vibrate([30, 50, 30]);
            // Saved now, so a reload after the train made it does not ask for the stage again
            J.hechas.push({ usada: costo(e, J.vigas), pico: picoDe(sim) });
            if (J.hechas.length < total) { visita.mudar(J.etapa); J.etapa++; J.vigas = []; }
            guardar();
          }
          if (!fueraDeEscena(sim, e)) { requestAnimationFrame(cuadro); return; }
          setTimeout(() => {
            if (acabado || !raiz.isConnected) return;
            felicitar(e, J.hechas.length - 1, () => {
              if (acabado || !raiz.isConnected) return;
              if (J.hechas.length >= total) acabar('todas'); else jugarEtapa();
            });
          }, 600);
          return;
        }
        if (!cierre) cierre = performance.now();
        if (!avisado) {
          avisado = true; aviso.textContent = sim.cortada ? T.tvSnapped : T.tvFell; botonProbar.disabled = false;
          // The beams that snapped stay marked while the bridge is fixed
          rotasAntes = Object.assign(new Set(sim.vigas.map((v, k) => (v.rota ? `${J.vigas[k].a}|${J.vigas[k].b}` : null)).filter(Boolean)), { desde: Date.now() });
        }
        if (performance.now() - cierre < 1800) requestAnimationFrame(cuadro);
      };
      requestAnimationFrame(cuadro);
    }
  }

  /**
   * The stage's summary, the only place it is shown (the owner's request): over the screen when a stage
   * passes, with the wood, the peak strain, the time and the points of that stage. It goes with its button,
   * a tap outside, or on its own after `FELICITA_MS`, with a bar that empties; the clock stops meanwhile.
   */
  function felicitar(e, k, seguir) {
    const a = puntajePartida(J.hechas.map(x => x.usada), 0, etapas, J.hechas.map(x => x.pico)).ahorros[k];
    const ahora = usado(), segs = (ahora - (inicioEtapa ?? ahora)) / 1000, ultima = J.hechas.length >= total;
    const reanudar = ctx.pausa?.(FELICITA_MS + 1000) || (() => {});
    const fila = (rotulo, valor, chico) => el('div', { class: 'tv-fel-fila' }, el('span', {}, rotulo), el('b', {}, valor), chico ? el('small', {}, chico) : null);
    let listo = false;
    const cerrar = () => {
      if (listo) return;
      listo = true; clearTimeout(tope); capa.remove(); reanudar();
      seguir();
    };
    const capa = el('div', { class: 'tv-felicitacion', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tv-fel-titulo', onClick: ev => { if (ev.target === capa) cerrar(); } },
      el('div', { class: 'panel tv-fel-caja' },
        el('h2', { id: 'tv-fel-titulo' }, fmt(T.tvStageDone, { n: k + 1 })),
        fila(e.acero ? T.tvSumSteel : T.tvSumWood, fmt(T.tvSumUsed, { n: n1(a.usadas), max: n1(e.presupuesto) }), fmt(T.tvSumMin, { n: n1(e.minimo) })),
        fila(T.tvSumStrain, pct(a.pico), fmt(T.tvSumRef, { r: pct(a.referencia) })),
        fila(T.tvSumTime, mmss(segs * 1000)),
        fila(T.tvSumPoints, n1(PUNTOS_ETAPA + a.puntos + a.puntosSolidez), fmt(T.tvSumDetail, { e: PUNTOS_ETAPA, a: n1(a.puntos), s: n1(a.puntosSolidez) })),
        el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-seguir', onClick: () => { SFX.tap(); cerrar(); } }, ultima ? T.tvLast : T.tvNext),
        el('div', { class: 'tv-fel-barra', 'aria-hidden': 'true' }, el('span', { style: `animation-duration: ${FELICITA_MS}ms` }))));
    document.body.append(capa);
    capa.querySelector('#btn-seguir').focus({ preventScroll: true });
    if (!QUIETO) confetti({ count: 60, duration: 1200 });
    const tope = setTimeout(cerrar, FELICITA_MS);
  }

  /**
   * The stage the game stopped at (not crossed): the catalog's bridge for it, with the train looping over
   * it, so the player learns how it could be done.
   */
  function solucionVista() {
    const k = J.hechas.length, e = etapas?.[k];
    if (!e?.solucion?.length) return null;
    const vigas = e.solucion.map(([a, b]) => ({ a, b }));
    const c = lienzo(e);
    c._time = timeOfDay(k / Math.max(1, total - 1));
    const caja = el('div', { class: 'panel tv-solucion', id: 'tv-solucion' },
      el('p', { class: 'lead' }, fmt(T.tvSolution, { n: k + 1 })),
      el('div', { class: 'tv-tablero' }, c),
      el('p', { class: 'muted tv-nota' }, fmt(T.tvSolutionNote, { n: n1(costo(e, vigas)), max: n1(e.presupuesto), p: pct(picoReferencia(e)) })));
    requestAnimationFrame(() => {
      c._ajustar();
      let sim = crearSim(e, vigas);
      if (QUIETO) { dibujar(c, e, { vigas }); return; }
      const cuadro = () => {
        if (!c.isConnected) return;
        for (let n = 0; n < Math.round(1 / 60 / DT); n++) paso(sim);
        dibujar(c, e, { sim });
        if (sim.fin && (sim.tren.cayo || fueraDeEscena(sim, e))) sim = crearSim(e, vigas);
        requestAnimationFrame(cuadro);
      };
      requestAnimationFrame(cuadro);
    });
    return caja;
  }

  /** The end of the game: every crossing done, out of time or given up. The cup clock stops right here (D-130). */
  function acabar(motivo) {
    if (acabado && J.fin) return;
    acabado = true; clearInterval(reloj);
    document.querySelector('.tv-felicitacion')?.remove();   // time ran out with a stage's summary open
    J.fin = motivo;
    J.seg = Math.min(limite, usado()) / 1000;
    const r = puntaje();
    J.puntos = { total: r.total, etapas: r.etapas, ahorro: r.ahorro, solidez: r.solidez, rapidez: r.rapidez, pasadas: r.pasadas,
      detalle: J.hechas.map((x, k) => ({ usada: x.usada, max: etapas[k].presupuesto, minimo: etapas[k].minimo })) };
    guardar();
    ctx.pararReloj?.(final());
    if (motivo === 'todas') SFX.win();
    else if (motivo === 'tiempo') { SFX.timeUp?.(); vibrate([60, 40, 60]); }
    else { SFX.error(); vibrate([40, 40, 40]); }
    fin();
  }

  function fin() {
    const todas = J.fin === 'todas';
    const sello = todas ? T.tvEndAll : J.fin === 'tiempo' ? T.tvEndTime : T.tvEndGaveUp;
    raiz.replaceChildren(el('div', { class: 'stack tv-juego center' },
      el('div', { class: 'tv-cabeza', style: 'justify-content:center' }, progreso()),
      el('p', { class: `tv-sello${todas ? '' : ' mal'}`, id: 'tv-sello' }, sello),
      el('p', { class: 'score-big', id: 'tv-puntaje' }, `${J.puntos?.total ?? 0}/100`),
      todas ? null : solucionVista(),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(final()); } }, ctx.textoFin || T.seeResults)));
    relojNodo = null;
  }

  /** The countdown of the 7 minutes, against the cup's clock; red in the last minute. */
  function tic() {
    if (!raiz.isConnected) { clearInterval(reloj); return; }
    if (acabado) return;
    const quedan = Math.max(0, limite - usado());
    if (relojNodo) {
      relojNodo.textContent = fmt(T.tvClock, { t: mmss(Math.ceil(quedan / 1000) * 1000) });
      relojNodo.classList.toggle('apurado', quedan <= 60000);
    }
    if (quedan <= 0) acabar('tiempo');
  }

  cargarCatalogo().then(cat => {
    if (!raiz.isConnected) return;
    etapas = etapasDe(cat, p.semilla, niveles);
    if (J.fin) { ctx.pararReloj?.(final()); fin(); return; }
    jugarEtapa();
    if (usado() >= limite) { acabar('tiempo'); return; }
    reloj = setInterval(tic, 250);
  });
}

export function resultado(e) {
  const s = e?.puntos?.total ?? 0;
  return { s, t: tarjeta(e?.hechas || [], e?.etapas || NIVELES.length), resumen: `${s}/100` };
}

/** How the score was reached (D-106): the four parts, then the wood of each crossing. */
export function desglose(e, { T, fmt, mmss: tiempo = mmss, lang }) {
  const r = e?.puntos;
  if (!r) return [];
  const n1 = x => num(x, lang);
  const lineas = [
    fmt(T.tvBdStages, { n: r.pasadas, t: e.etapas || NIVELES.length, p: r.etapas }),
    fmt(T.tvBdWood, { p: r.ahorro }),
    fmt(T.tvBdSolid, { p: r.solidez }),
    fmt(T.tvBdSpeed, { t: tiempo((e.seg || 0) * 1000), p: r.rapidez }),
  ];
  lineas.push(...(r.detalle || []).map((x, k) => fmt(T.tvBdStage, { n: k + 1, w: n1(x.usada), max: n1(x.max), m: n1(x.minimo) })));
  return lineas;
}

