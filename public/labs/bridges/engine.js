/**
 * 🚂 Tren en Vilo — pure engine (lab prototype). A bridge of beams between grid points over a gap;
 * then a train crosses. Beams are springs that snap when stretched or squeezed too much.
 *
 * Coordinates are in grid units, y up; the deck is y = 0. The simulation uses a fixed step and only
 * + − × ÷ and sqrt, so the same bridge gives the same result in every browser.
 */

/**
 * The stages: gap width, anchors (besides the two cliff edges), the budget in beams and the fewest
 * beams a known bridge needs (`minimo`, from soluciones.json, which engine.test.mjs runs). The
 * budget leaves room in the first ones and none in the last: stage 5 is meant to stop most players.
 */
export const ETAPAS = [
  { ancho: 4, anclas: [[0, -1], [4, -1]], presupuesto: 10, minimo: 7 },
  { ancho: 5, anclas: [[0, -1], [5, -1]], presupuesto: 14, minimo: 11 },
  { ancho: 6, anclas: [[0, -1], [6, -1], [3, -3]], presupuesto: 17, minimo: 15 },
  { ancho: 7, anclas: [[0, -1], [7, -1]], presupuesto: 19, minimo: 17 },
  { ancho: 8, anclas: [[0, -1], [8, -1], [4, -3]], presupuesto: 21, minimo: 21 },
];
export const TIEMPO_S = 7 * 60;
export const LARGO_MAX = 2.25;     // the longest beam: two squares, or a 1 × 2 diagonal
export const ALTO = [-3, 3];       // where nodes may go, from y = −3 to y = 3

/** The fixed nodes of a stage: the deck's edges at both cliffs plus the extra anchors. */
export const fijos = e => [[0, 0], [e.ancho, 0], ...e.anclas];
const clave = (x, y) => `${x},${y}`;
export const esFijo = (e, x, y) => fijos(e).some(([a, b]) => a === x && b === y);

/**
 * The deck (owner's request): the train always needs a road across the gap, so every stage starts with
 * it laid, one beam per square at y = 0, and those beams cannot be removed. They cost wood like any other.
 */
export const cubierta = e => Array.from({ length: e.ancho }, (_, k) => ({ a: [k, 0], b: [k + 1, 0] }));
export const esCubierta = v => v.a[1] === 0 && v.b[1] === 0 && Math.abs(v.b[0] - v.a[0]) === 1;

/** May a beam go from (x1,y1) to (x2,y2)? Inside the area, not too long, not repeated, not zero. */
export function vigaValida(e, vigas, a, b) {
  if (a[0] === b[0] && a[1] === b[1]) return 'cero';
  for (const [x, y] of [a, b]) if (x < 0 || x > e.ancho || y < ALTO[0] || y > ALTO[1]) return 'fuera';
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) > LARGO_MAX + 1e-9) return 'larga';
  const k = clave(...a) + '|' + clave(...b), k2 = clave(...b) + '|' + clave(...a);
  if (vigas.some(v => { const s = clave(...v.a) + '|' + clave(...v.b); return s === k || s === k2; })) return 'repetida';
  return null;
}

/**
 * Joints in the middle of a beam (owner's request): a beam may start or end on a grid point inside
 * another beam, and that beam is split there in two, so it looks and works like any joint between
 * ends; and a new beam that runs over a joint is split at it too. Splitting keeps the wood (the
 * pieces add up to the same length), so it only applies to wood budgets.
 */
const EPS = 1e-9;
/** Is grid point `p` strictly inside beam `v` (on its line, between its ends)? */
export function enMedio(v, p) {
  const [ax, ay] = v.a, [bx, by] = v.b, [px, py] = p;
  if (Math.abs((bx - ax) * (py - ay) - (by - ay) * (px - ax)) > EPS) return false;
  const t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2);
  return t > EPS && t < 1 - EPS;
}
/** The beams with each one that has `p` inside split in two there. */
export const partir = (vigas, p) => vigas.flatMap(v => (enMedio(v, p) ? [{ ...v, a: v.a, b: p }, { ...v, a: p, b: v.b }] : [v]));
/** The grid points inside beams (where a beam can now start or end): 'x,y'. */
export function puntosMedios(vigas) {
  const out = new Set();
  for (const v of vigas) {
    const [ax, ay] = v.a, [bx, by] = v.b, n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let k = 1; k < n; k++) { const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n; if (Number.isInteger(x) && Number.isInteger(y)) out.add(`${x},${y}`); }
  }
  return out;
}
/**
 * The bridge with beam a→b added and joined everywhere it touches: the beams it starts or ends inside
 * are split there, and it is split at every joint (`nudos`, 'x,y') it runs over.
 */
export function unirViga(vigas, a, b, nudos = new Set(), acero = false) {
  const partidas = partir(partir(vigas, a), b);
  let nueva = [acero ? { a, b, acero } : { a, b }];
  for (const k of nudos) { const p = k.split(',').map(Number); nueva = partir(nueva, p); }
  // A piece that lands on a beam already there (a long beam over the deck) is not laid twice
  const ya = new Set(partidas.flatMap(v => [`${v.a}|${v.b}`, `${v.b}|${v.a}`]));
  return [...partidas, ...nueva.filter(v => !ya.has(`${v.a}|${v.b}`))];
}

/**
 * A stroke longer than one beam (owner's request: the whole deck in one drag): a straight drag between
 * two grid points becomes a beam for each step between the grid points on its line, so it joins at
 * every one. `{ piezas, motivo }`: the new beams (those already there are left out), or why not.
 * Within one beam's length it is a single beam, as before.
 */
const mcd = (x, y) => (y ? mcd(y, x % y) : x);
export function trazo(e, vigas, a, b) {
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) <= LARGO_MAX + 1e-9) { const m = vigaValida(e, vigas, a, b); return { piezas: m ? [] : [{ a, b }], motivo: m }; }
  const dx = b[0] - a[0], dy = b[1] - a[1], g = mcd(Math.abs(dx), Math.abs(dy));
  const ux = dx / g, uy = dy / g;
  if (Math.hypot(ux, uy) > LARGO_MAX + 1e-9) return { piezas: [], motivo: 'larga' };
  const piezas = [];
  for (let k = 0; k < g; k++) {
    const p = [a[0] + ux * k, a[1] + uy * k], q = [a[0] + ux * (k + 1), a[1] + uy * (k + 1)];
    const m = vigaValida(e, vigas, p, q);
    if (m === 'repetida') continue;
    if (m) return { piezas: [], motivo: m };
    piezas.push({ a: p, b: q });
  }
  return piezas.length ? { piezas, motivo: null } : { piezas: [], motivo: 'repetida' };
}

/**
 * What a bridge costs. A crossing with `madera` measures its budget in wood: each beam costs its
 * length (a two-square beam costs double), so a few long beams are no longer a free trick. Without it,
 * one beam is one unit, as in the first stages.
 */
export const largoViga = v => Math.hypot(v.b[0] - v.a[0], v.b[1] - v.a[1]);
export const costoViga = (e, v) => (v.acero ? 0 : e.madera ? largoViga(v) : 1);
export const costo = (e, vigas) => vigas.reduce((s, v) => s + costoViga(e, v), 0);

/**
 * Steel (owner's request): on a crossing with `acero` (meters of steel, besides the wood) a beam may be
 * laid in steel, which snaps at `FISICA.acero` times the strain of wood. Steel is measured by length
 * like wood, from its own small reserve, so splitting a steel beam keeps it whole.
 */
export const aceroUsado = vigas => vigas.reduce((s, v) => s + (v.acero ? largoViga(v) : 0), 0);

/** A beam is road when both its ends are on the deck (y = 0): the train runs on those. */
export const esCamino = v => v.a[1] === 0 && v.b[1] === 0;

/* ------------------------------------------------------------------ */
/* The simulation                                                      */
/* ------------------------------------------------------------------ */

/** The physics, tuned so a bare deck sags and snaps and a truss holds (engine.test.mjs checks both). */
export const FISICA = {
  g: 9.8,
  masaNudo: 0.2, masaViga: 0.2,     // per beam, split between its two ends
  rigidez: 30000,                  // spring force per unit of strain
  amort: 0.985,                    // velocity kept each step
  quiebre: 0.007,                  // strain at which a beam snaps
  acero: 2,                        // steel snaps at this many times wood's strain
  tren: 50,                        // the locomotive's weight, applied at its wheels
  vagon: 12,                       // each wagon's
  velTren: 1.6,                    // grid units per second
};
export let DT = 1 / 960;
export const fijarDT = x => { DT = x; };

/**
 * The train: the locomotive and two wagons behind it, coupled, at fixed distances in grid units
 * (the sprites are drawn at 16 art pixels per unit, so they touch). Each one weighs on the deck.
 */
export const PIEZAS = [{ dx: 0, peso: 'tren' }, { dx: -1.25, peso: 'vagon' }, { dx: -2.31, peso: 'vagon' }];
const COLA = PIEZAS[PIEZAS.length - 1].dx;

/**
 * Builds the simulation of a bridge. Returns a state you advance with `paso(s)`;
 * `s.nudos` [{x,y,fijo}], `s.vigas` [{i,j,largo,rota,tension}], `s.tren` {x,y,cayo,llego}.
 */
export function crearSim(e, vigas) {
  const idx = new Map(), nudos = [];
  const nudo = ([x, y]) => {
    const k = clave(x, y);
    if (!idx.has(k)) { idx.set(k, nudos.length); nudos.push({ x, y, px: x, py: y, m: FISICA.masaNudo, fijo: esFijo(e, x, y), x0: x, y0: y }); }
    return idx.get(k);
  };
  for (const f of fijos(e)) nudo(f);
  const vs = vigas.map(v => {
    const i = nudo(v.a), j = nudo(v.b);
    nudos[i].m += FISICA.masaViga / 2; nudos[j].m += FISICA.masaViga / 2;
    return { i, j, largo: Math.hypot(v.b[0] - v.a[0], v.b[1] - v.a[1]), rota: false, tension: 0, camino: esCamino(v), acero: !!v.acero, quiebre: FISICA.quiebre * (v.acero ? FISICA.acero : 1) };
  });
  return { e, nudos, vigas: vs, t: 0, tren: { x: -1.2, y: 0, cayo: false, llego: false }, fin: false };
}

/** The road beam under the train, and where along it (0..1), or null if there is none. */
function bajoTren(s, x) {
  let mejor = null;
  for (const v of s.vigas) {
    if (v.rota || !v.camino) continue;
    const a = s.nudos[v.i], b = s.nudos[v.j];
    const [p, q] = a.x0 <= b.x0 ? [a, b] : [b, a];
    if (x < p.x0 - 1e-9 || x > q.x0 + 1e-9) continue;
    const u = (x - p.x0) / (q.x0 - p.x0 || 1);
    const y = p.y + (q.y - p.y) * u;
    if (!mejor || y > mejor.y) mejor = { p, q, u, y };
  }
  return mejor;
}

/**
 * The deck's height at `x` (for drawing the wagons on it): 0 on the cliffs, the road beam's
 * height over the gap, or null where there is no road (a gap, or a beam that snapped).
 */
export function alturaCamino(s, x) {
  if (x <= 0 || x >= s.e.ancho) return 0;
  const b = bajoTren(s, x);
  return b ? b.y : null;
}

/** One fixed step of the simulation. */
export function paso(s) {
  // Decided: if it made it, the train keeps rolling (only for the eye) until it leaves the scene
  if (s.fin) { if (s.tren.llego) { s.tren.x += FISICA.velTren * DT; s.t += DT; } return s; }
  const { nudos, vigas } = s;
  const fx = new Float64Array(nudos.length), fy = new Float64Array(nudos.length);
  for (let k = 0; k < nudos.length; k++) fy[k] -= nudos[k].m * FISICA.g;
  for (const v of vigas) {
    if (v.rota) continue;
    const a = nudos[v.i], b = nudos[v.j];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx * dx + dy * dy) || 1e-9;
    const deform = (l - v.largo) / v.largo;
    v.tension = deform;
    // The peak strain while the train is on the bridge, as a fraction of the snapping point: how hard it worked
    if (s.t > 0.6 && !s.fin) s.pico = Math.max(s.pico || 0, Math.abs(deform) / v.quiebre);
    if (deform > v.quiebre || deform < -v.quiebre) {
      v.rota = true;
      // A crossing with `firme` asks for a bridge that stays standing: the first beam that snaps ends the test
      if (s.e.firme) { s.cortada = true; s.fin = true; }
      continue;
    }
    const f = FISICA.rigidez * deform, ux = dx / l, uy = dy / l;
    fx[v.i] += f * ux; fy[v.i] += f * uy; fx[v.j] -= f * ux; fy[v.j] -= f * uy;
  }
  // The train: on the cliffs the ground holds it; over the gap, the road beam under it does
  // Every piece of the train over the gap weighs on the road beam under it; with none, it falls
  const tr = s.tren;
  if (s.t > 0.6) tr.x += FISICA.velTren * DT;
  tr.y = 0;
  for (const [k, pz] of PIEZAS.entries()) {
    const x = tr.x + pz.dx;
    if (x <= 0 || x >= s.e.ancho) continue;
    const b = bajoTren(s, x);
    if (!b || b.y < -1.5) { tr.cayo = true; tr.cayoPieza = k; s.fin = true; break; }
    if (k === 0) tr.y = b.y;
    // A crossing may carry a heavier train (`carga`, by level in the catalog): locomotive and wagons alike
    const peso = FISICA[pz.peso] * (s.e.carga || 1);
    fy[nudos.indexOf(b.p)] -= peso * (1 - b.u);
    fy[nudos.indexOf(b.q)] -= peso * b.u;
  }
  // It made it when the last wagon is on the far cliff
  if (!s.fin && tr.x + COLA > s.e.ancho + 0.4) { tr.llego = true; s.fin = true; }
  for (let k = 0; k < nudos.length; k++) {
    const n = nudos[k];
    if (n.fijo) continue;
    // While the bridge settles (before the train starts) it is damped hard: it sags into place without swinging
    const am = s.t < 0.6 ? 0.9 : FISICA.amort;
    const vx = (n.x - n.px) * am, vy = (n.y - n.py) * am;
    n.px = n.x; n.py = n.y;
    n.x += vx + (fx[k] / n.m) * DT * DT;
    n.y += vy + (fy[k] / n.m) * DT * DT;
  }
  s.t += DT;
  if (s.t > 30) s.fin = true;
  return s;
}

/** The peak strain of a run, from 0 to 1. */
export const picoDe = s => Math.min(1, s.pico || 0);

/** Runs a bridge to the end, without drawing. `{ llego, cayo, rotas, t }`. */
export function probar(e, vigas, maxPasos = Math.ceil(30 / DT)) {
  const s = crearSim(e, vigas);
  for (let k = 0; k < maxPasos && !s.fin; k++) paso(s);
  // `x`: how far the train got (for a search that builds bridges up)
  // `pico`: the peak strain while it crossed, from 0 to 1 (1 is a beam at its snapping point)
  return { llego: s.tren.llego, cayo: s.tren.cayo, rotas: s.vigas.filter(v => v.rota).length, t: s.t, x: s.tren.x, pico: picoDe(s) };
}

/* ------------------------------------------------------------------ */
/* The score: stages passed, wood saved, solidity and time             */
/* ------------------------------------------------------------------ */

export const PUNTOS_ETAPA = 10;       // 50 for the five
export const PUNTOS_AHORRO = 5;       // per stage passed, all of it at the known minimum: 25 for the five
export const PUNTOS_SOLIDEZ = 3;      // per stage passed, all of it with a bridge clearly more solid than the known one: 15
export const MARGEN_SOLIDO = 0.15;    // how much lower the peak strain must be than the known bridge's for all of it
export const BONO_RAPIDEZ = 10;       // all of it in 1:30 or less, none when time runs out; scaled by stages passed
export const RAPIDO_S = 90;

const entre01 = x => Math.min(1, Math.max(0, x));

/** The known bridge's peak strain on a crossing: what solidity is measured against. Memoized per crossing. */
const referencias = new WeakMap();
export function picoReferencia(e) {
  if (!referencias.has(e)) referencias.set(e, e.solucion?.length ? probar(e, e.solucion.map(([a, b]) => ({ a, b }))).pico : 1);
  return referencias.get(e);
}

/**
 * The score of a game, by layers, with each part separate for the breakdown. `usadas` is the wood (or
 * beams) of the bridge that passed in each stage done (its length is the stages passed), `picos` the
 * peak strain of each of those bridges. Saving wood and building solid pull against each other:
 * the known bridge is the cheapest, so being more solid than it costs wood.
 */
export function puntajePartida(usadas, segundos, lista = ETAPAS, picos = []) {
  const pasadas = usadas.length;
  const etapas = PUNTOS_ETAPA * pasadas;
  const ahorros = usadas.map((n, k) => {
    const e = lista[k], margen = e.presupuesto - e.minimo;
    const fraccion = margen > 0 ? entre01((e.presupuesto - n) / margen) : 1;
    const pico = picos[k] ?? null, referencia = pico === null ? null : picoReferencia(e);
    const solida = pico === null ? 0 : entre01((referencia - pico) / MARGEN_SOLIDO);
    return { etapa: k + 1, usadas: n, presupuesto: e.presupuesto, minimo: e.minimo, fraccion, puntos: PUNTOS_AHORRO * fraccion,
      pico, referencia, solida, puntosSolidez: PUNTOS_SOLIDEZ * solida };
  });
  const ahorro = Math.round(ahorros.reduce((s, a) => s + a.puntos, 0));
  const solidez = Math.round(ahorros.reduce((s, a) => s + a.puntosSolidez, 0));
  const fraccionTiempo = entre01((TIEMPO_S - segundos) / (TIEMPO_S - RAPIDO_S));
  const rapidez = Math.round(BONO_RAPIDEZ * fraccionTiempo * (pasadas / lista.length));
  return { pasadas, etapas, ahorros, ahorro, solidez, fraccionTiempo, rapidez, total: etapas + ahorro + solidez + rapidez };
}
