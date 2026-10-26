/**
 * 🚂 Tren en Vilo: the screen for a La Copa day and its trial. The lab's game (labs/bridges/), with the
 * cup's clock and texts: lay beams over a gap, test, and the train crosses or the bridge falls. Five
 * crossings in 7 minutes, drawn from the lab's catalog with the day's seed, so everyone builds the same.
 *
 * The clock is the cup's (`ctx.tiempo()`), which pauses with the screen hidden and survives a reload.
 * The moves are `{ etapa, hechas: [{ usada, pico }], vigas, fin, seg, puntos }`: a reload rebuilds the
 * stage with the beams laid so far. The score is the lab's (`puntajePartida`), kept in `puntos` when the
 * game ends, so the result needs neither the catalog nor the physics.
 */
import { el } from '../../../assets/js/ui.js';
import { fijos, crearSim, paso, DT, puntajePartida, picoDe, picoReferencia, costo, unirViga, puntosMedios, partir, trazo } from '../../../labs/bridges/engine.js';
import { QUIETO, aMundo, esfuerzoAhora, timeOfDay, DEMO, trenMini, lienzo, medidor, dibujar, fueraDeEscena } from '../../../labs/bridges/scene.js';
import { etapasDe, tarjeta, CATALOGO_URL, NIVELES, TIEMPO_S } from './engine.js';

const POLY_BRIDGE = 'https://en.wikipedia.org/wiki/Poly_Bridge';
/** How long Clear and Give up wait for the second tap, like Clear all in Zip. */
const CONFIRMAR_MS = 3000;
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
  let etapas = null, acabado = !!J.fin, reloj = null, relojNodo = null, simulando = false, historial = [];
  window.__trenCopa = { J, get etapas() { return etapas; } };

  const puntaje = () => puntajePartida(J.hechas.map(x => x.usada), J.seg, etapas, J.hechas.map(x => x.pico));

  const progreso = () => el('div', { class: 'tv-puntos', 'aria-hidden': 'true' },
    ...Array.from({ length: total }, (_, k) => el('span', { class: k < J.hechas.length ? 'hecha' : k === J.etapa && !J.fin ? 'actual' : '' })));

  function jugarEtapa() {
    simulando = false; historial = [];
    const e = etapas[J.etapa];
    const c = lienzo(e);
    c._time = timeOfDay(J.etapa / Math.max(1, total - 1));
    const aguja = medidor(picoReferencia(e), { carga_titulo: T.tvGauge, maximo: T.tvPeak });
    const aviso = el('p', { class: 'tv-aviso', 'aria-live': 'polite' }, T.tvStart);
    const cuenta = el('span', { class: 'tv-cuenta', id: 'tv-cuenta' });
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
    const botonBorrar = conConfirmacion('borrar', `🧹 ${T.tvClear}`, `🧹 ${T.tvSure}`, () => {
      if (!J.vigas.length || simulando) return;
      historial.push(J.vigas); J.vigas = []; aviso.textContent = T.tvCleared; guardar(); repintar();
    }, { id: 'btn-borrar' });
    const botonRendirse = conConfirmacion('rendirse', `🏳️ ${T.giveUp}`, `🏳️ ${T.tvSure}`, () => acabar('rendido'), { id: 'btn-rendirse' });

    raiz.replaceChildren(el('div', { class: 'stack tv-juego' },
      el('div', { class: 'tv-cabeza' }, progreso(), relojNodo),
      el('div', { class: 'tv-titulo-etapa' },
        el('h2', { class: 'tv-etapa', id: 'tv-etapa' }, fmt(T.tvStage, { n: J.etapa + 1, t: total })),
        el('p', { class: `tv-carga${e.carga > 1 ? ' pesado' : ''}`, id: 'tv-carga' }, trenMini(e.carga, e), e.carga > 1 ? fmt(T.tvLoad, { x: `×${n1(e.carga)}` }) : T.tvLoadNormal)),
      el('div', { class: 'tv-tablero' }, c, aguja.caja),
      el('div', { class: 'tv-barra' }, cuenta, aviso),
      botonProbar,
      el('div', { class: 'tv-acciones' }, botonDeshacer, botonBorrar, botonRendirse)));
    c._ajustar();
    tic();

    const usados = () => new Set([...fijos(e).map(([x, y]) => `${x},${y}`), ...J.vigas.flatMap(v => [v.a.join(','), v.b.join(',')])]);
    function repintar(arrastre = null) {
      const gastado = costo(e, J.vigas);
      cuenta.textContent = fmt(T.tvWood, { n: n1(gastado), max: n1(e.presupuesto) });
      cuenta.classList.toggle('lleno', gastado >= e.presupuesto - 0.05);
      botonDeshacer.disabled = !historial.length || simulando;
      botonProbar.disabled = simulando || !J.vigas.length;
      botonBorrar.disabled = simulando || !J.vigas.length;
      dibujar(c, e, { vigas: J.vigas, grilla: !simulando, arrastre, usados: usados() });
    }
    repintar();
    let ultimoArrastre = null;
    const vivo = () => {
      if (!c.isConnected || acabado) return;
      if (!simulando) dibujar(c, e, { vigas: J.vigas, grilla: true, arrastre: ultimoArrastre, usados: usados() });
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
        if (i >= 0) { historial.push(J.vigas); J.vigas = J.vigas.filter((_, k) => k !== i); SFX.tap(); aviso.textContent = T.tvRemoved; guardar(); }
        else if (!desde) aviso.textContent = T.tvLoose;
        desde = null; ultimoArrastre = null; repintar(); return;
      }
      if (desde) {
        const hasta = cerca(m, g) ? g : null;
        const base = e.madera && hasta ? partir(partir(J.vigas, desde), hasta) : J.vigas;
        const t = hasta ? trazo(e, base, desde, hasta) : { piezas: [], motivo: 'fuera' };
        const motivo = t.motivo || (costo(e, J.vigas) + costo(e, t.piezas) > e.presupuesto + 1e-9 ? 'sinMadera' : null);
        const textos = { larga: T.tvTooLong, fuera: T.tvOutside, repetida: T.tvRepeated, presupuesto: T.tvNoWood, sinMadera: T.tvNoWood, suelta: T.tvLoose };
        if (motivo) { if (motivo !== 'cero') { aviso.textContent = textos[motivo] || T.tvOutside; SFX.error(); vibrate([30, 30, 30]); } }
        else {
          historial.push(J.vigas);
          let vs = J.vigas;
          for (const pz of t.piezas) vs = e.madera ? unirViga(vs, pz.a, pz.b, usados()) : [...vs, pz];
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
        dibujar(c, e, { sim });
        aguja.poner(esfuerzoAhora(sim), picoDe(sim));
        if (!sim.fin) { requestAnimationFrame(cuadro); return; }
        if (sim.tren.llego) {
          if (!avisado) {
            avisado = true; aviso.textContent = T.tvPassed; SFX.win(); vibrate([30, 50, 30]);
            J.hechas.push({ usada: costo(e, J.vigas), pico: picoDe(sim) });
            if (J.hechas.length >= total) { acabar('todas'); return; }
            J.etapa++; J.vigas = [];
            guardar();
          }
          if (!fueraDeEscena(sim, e)) { requestAnimationFrame(cuadro); return; }
          aviso.textContent = fmt(T.tvStageDone, { n: J.hechas.length });
          setTimeout(() => { if (!acabado && raiz.isConnected) jugarEtapa(); }, QUIETO ? 600 : 1200);
          return;
        }
        if (!cierre) cierre = performance.now();
        if (!avisado) { avisado = true; aviso.textContent = sim.cortada ? T.tvSnapped : T.tvFell; botonProbar.disabled = false; }
        if (performance.now() - cierre < 1800) requestAnimationFrame(cuadro);
      };
      requestAnimationFrame(cuadro);
    }
  }

  /** The end of the game: every crossing done, out of time or given up. The cup clock stops right here (D-130). */
  function acabar(motivo) {
    if (acabado && J.fin) return;
    acabado = true; clearInterval(reloj);
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

