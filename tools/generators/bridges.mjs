// Tren en Vilo (lab): builds the catalog of crossings, public/labs/bridges/catalogo.json.
//   node tools/generators/bridges.mjs [--por-nivel 12] [--nivel 1..5]   (one level writes catalogo-<n>.json, to run them in parallel)
//   node tools/generators/bridges.mjs --juntar                          (joins catalogo-1..5.json into catalogo.json)
//   node tools/generators/bridges.mjs --legible [catalogo-madera.json] (replaces each solution with a readable, solid truss)
// For each difficulty level (1 to 5) it makes crossings of different kinds — anchors low on the cliff
// faces, stone towers above the deck, rock pillars out of the water, or a mix — searches each one's
// cheapest bridge that holds (greedy removal from rich starts, like the first stages), and keeps those
// whose bare deck falls. The budget is that minimum plus the level's spare beams (3, 3, 2, 1, 0).
// Each game draws one crossing per level, so a regular player rarely meets the same five.
import { writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { probar, vigaValida, fijos, costo, fijarDT, DT } from '../../public/labs/bridges/engine.js';

const arg = n => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const POR_NIVEL = Number(arg('--por-nivel')) || 12;
const SOLO = Number(arg('--nivel')) || 0;
const CARPETA = new URL('../../public/labs/bridges/', import.meta.url);
if (process.argv.includes('--juntar')) {
  const todo = [];
  const base = `catalogo${process.argv.includes('--madera') ? '-madera' : process.argv.includes('--prueba') ? '-prueba' : ''}`;
  for (let n = 1; n <= 5; n++) { const f = new URL(`${base}-${n}.json`, CARPETA); if (existsSync(f)) { todo.push(...JSON.parse(readFileSync(f, 'utf8'))); rmSync(f); } }
  writeFileSync(new URL(`${base}.json`, CARPETA), JSON.stringify(todo) + '\n');
  console.log(`✓ ${todo.length} crossings in public/labs/bridges/${base}.json`);
  process.exit(0);
}
// `--prueba`: the tighter version under evaluation (catalogo-prueba.json): fewer spare beams, one helper
// per crossing (mixed ones only at levels 4 and 5) and a stronger search
// `--madera`: the budget in wood (each beam costs its length), set by a build-up search that minimizes wood
const MADERA = process.argv.includes('--madera');
const PRUEBA = process.argv.includes('--prueba') || MADERA;
const HOLGURA = PRUEBA ? [2, 1, 1, 0, 0] : [3, 3, 2, 1, 0];
const ANCHOS = [[4, 5], [5, 6], [6, 7], [7, 8], [8, 8]];   // at 9 wide the search left bridges of 33 to 40 beams: too long to build
let semilla = 20261016 + (Number(process.argv[process.argv.indexOf('--nivel') + 1]) || 0) * 7919;
const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const entre = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const V = (a, b) => ({ a, b });
const llega = (e, v) => probar(e, v).llego;

/** A crossing of one kind: its anchors, besides the deck's two edges. */
function cruce(nivel) {
  // The test version: with the heavy train, the last levels are narrower, so the load forces the shape, not the length
  const W = entre(...(MADERA ? ANCHOS_MADERA : PRUEBA ? [[4, 5], [5, 6], [6, 7], [6, 7], [6, 7]] : ANCHOS)[nivel]);
  const tipos = PRUEBA ? (nivel >= 3 ? ['bajo', 'torres', 'pilar', 'pilar-lado', 'mixto'] : ['bajo', 'torres', 'pilar', 'pilar-lado'])
    : nivel === 0 ? ['bajo', 'torres'] : ['bajo', 'torres', 'pilar', 'pilar-lado', 'mixto'];
  const tipo = tipos[Math.floor(rnd() * tipos.length)];
  const anclas = [];
  const bajos = () => { anclas.push([0, -entre(1, 2)], [W, -entre(1, 2)]); };
  const torres = () => { anclas.push([0, 2], [W, 2]); };
  const pilar = lado => { const k = lado ? (rnd() < 0.5 ? 2 : W - 2) : Math.round(W / 2); anclas.push([k, -entre(2, 3)]); };
  if (tipo === 'bajo') bajos();
  // In the test version each crossing has a single helper: the towers alone, the pillar alone
  if (tipo === 'torres') { torres(); if (!PRUEBA && rnd() < 0.5) anclas.push([0, -1], [W, -1]); }
  if (tipo === 'pilar') { pilar(false); if (!PRUEBA) anclas.push([0, -1], [W, -1]); }
  if (tipo === 'pilar-lado') { pilar(true); if (!PRUEBA) anclas.push([0, -1], [W, -1]); }
  if (tipo === 'mixto') { torres(); pilar(rnd() < 0.5); }
  // The test version loads the train more at each level: ×1 to ×2
  return { ancho: W, anclas, tipo, nivel: nivel + 1, ...(PRUEBA ? { carga: [1, 1.25, 1.5, 1.75, 2][nivel] } : {}), ...(MADERA ? { madera: true, firme: true } : {}) };
}

/** Every valid beam up to 1.5 long between grid points from y = −3 to 2: the rich start of the search. */
function rico(e) {
  const pts = []; for (let x = 0; x <= e.ancho; x++) for (let y = -3; y <= 2; y++) pts.push([x, y]);
  const v = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const a = pts[i], b = pts[j];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= 1.5 && !vigaValida(e, v, a, b)) v.push(V(a, b));
  }
  return v;
}
/** Only the beams that hang from something fixed. */
function conectadas(e, v) {
  const ok = new Set(fijos(e).map(p => p.join(','))), res = new Set();
  for (let cambio = true; cambio;) {
    cambio = false;
    v.forEach((b, k) => { if (res.has(k)) return; const a = b.a.join(','), c = b.b.join(','); if (ok.has(a) || ok.has(c)) { res.add(k); ok.add(a); ok.add(c); cambio = true; } });
  }
  return v.filter((_, k) => res.has(k));
}
const barajar = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** Known trusses (above and below the deck): starts the search shrinks far better than the rich one. */
const cubierta = W => Array.from({ length: W }, (_, i) => V([i, 0], [i + 1, 0]));
const cercha = (W, h) => {
  const v = cubierta(W);
  for (let i = 1; i < W - 1; i++) v.push(V([i, h], [i + 1, h]));
  for (let i = 1; i < W; i++) v.push(V([i, 0], [i, h]));
  v.push(V([0, 0], [1, h]), V([W, 0], [W - 1, h]));
  for (let i = 1; i < W - 1; i++) v.push(i < W / 2 ? V([i, h], [i + 1, 0]) : V([i + 1, h], [i, 0]));
  return v;
};
function minimo(e, intentos = 12) {
  const W = e.ancho;
  const inicios = [rico(e), cercha(W, 1), cercha(W, -1), [...cercha(W, 1), ...cercha(W, -1).slice(W)]].map(v => conectadas(e, v)).filter(v => llega(e, v));
  if (!inicios.length) return null;
  let mejor = null;
  for (let k = 0; k < intentos; k++) {
    let v = [...inicios[k % inicios.length]];
    const base = v;
    for (const b of barajar(base)) { const sin = conectadas(e, v.filter(x => x !== b)); if (sin.length < v.length && llega(e, sin)) v = sin; }
    if (!mejor || v.length < mejor.length) mejor = v;
  }
  // Stronger search (test version): from the best, try taking two beams out and putting one back
  if (PRUEBA && mejor) {
    const todas = rico(e);
    for (let it = 0; it < 120; it++) {
      const [x, y] = barajar(mejor).slice(0, 2);
      const sin = mejor.filter(b => b !== x && b !== y);
      for (const c of barajar(todas).slice(0, 15)) {
        if (sin.some(b => (b.a + '|' + b.b) === (c.a + '|' + c.b))) continue;
        const prueba = conectadas(e, [...sin, c]);
        if (prueba.length < mejor.length && llega(e, prueba)) { mejor = prueba; break; }
      }
    }
  }
  return mejor;
}

/**
 * Build-up search (with `--madera`): from the bare deck, add the beam that takes the train farthest
 * (sampling the candidates), until it crosses; then drop whatever is left over, the longest first.
 * It explores with a coarser step and confirms with the game's own.
 */
function todasLasVigas(e) {
  const pts = []; for (let x = 0; x <= e.ancho; x++) for (let y = -3; y <= 3; y++) pts.push([x, y]);
  const v = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (!vigaValida(e, v, pts[i], pts[j])) v.push(V(pts[i], pts[j]));
  return v;
}
const clave = b => b.a + '|' + b.b;
function crecer(e, azar) {
  const todas = todasLasVigas(e);
  let v = cubierta(e.ancho);
  const nota = w => { const r = probar(e, w); return r.llego ? 1e6 - costo(e, w) : r.x * 100 - r.rotas; };
  for (let paso = 0; paso < 40 && !probar(e, v).llego; paso++) {
    const usados = new Set([...fijos(e).map(p => p.join(',')), ...v.flatMap(b => [b.a.join(','), b.b.join(',')])]);
    const tiene = new Set(v.map(clave));
    const opciones = barajar(todas.filter(c => !tiene.has(clave(c)) && (usados.has(c.a.join(',')) || usados.has(c.b.join(','))))).slice(0, 70);
    const puntuadas = opciones.map(c => [nota([...v, c]), c]).sort((p, q) => q[0] - p[0]);
    if (!puntuadas.length) return null;
    v = [...v, puntuadas[Math.min(puntuadas.length - 1, Math.floor(rnd() * azar))][1]];
  }
  if (!probar(e, v).llego) return null;
  for (const b of [...v].sort((p, q) => Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) - Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]))) {
    const sin = conectadas(e, v.filter(x => x !== b));
    if (probar(e, sin).llego) v = sin;
  }
  return v;
}
/** The bridge mirrored left to right (x → width − x). */
const espejo = (e, v) => v.map(b => V([e.ancho - b.a[0], b.a[1]], [e.ancho - b.b[0], b.b[1]]));
/** Is the crossing the same mirrored? Then a symmetric bridge is the natural one. */
const simetrico = e => e.anclas.every(([x, y]) => e.anclas.some(([x2, y2]) => x2 === e.ancho - x && y2 === y));
/**
 * The symmetric version of a bridge: it with its mirror, then dropping mirrored pairs while it still
 * holds. On a symmetric crossing it is preferred if it costs at most 15 % more: the intuitive design fits.
 */
function simetrizar(e, v) {
  const k = b => [b.a, b.b].map(String).sort().join('|');
  const unidas = new Map(); for (const b of [...v, ...espejo(e, v)]) unidas.set(k(b), b);
  let w = [...unidas.values()];
  if (!llega(e, w)) return null;
  for (const b of [...w].sort((p, q) => Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) - Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]))) {
    if (!w.includes(b)) continue;
    const par = espejo(e, [b])[0], sin = conectadas(e, w.filter(x => k(x) !== k(b) && k(x) !== k(par)));
    if (llega(e, sin)) w = sin;
  }
  return w;
}
function minimoMadera(e, intentos = 4) {
  const fino = DT;
  fijarDT(1 / 480);
  let mejor = null;
  for (let k = 0; k < intentos; k++) { const v = crecer(e, k === 0 ? 1 : 2); if (v && (!mejor || costo(e, v) < costo(e, mejor))) mejor = v; }
  if (mejor && simetrico(e)) { const sim = simetrizar(e, mejor); if (sim && costo(e, sim) <= costo(e, mejor) * 1.15) mejor = sim; }
  fijarDT(fino);
  return mejor && probar(e, mejor).llego ? mejor : null;   // confirmed with the game's step
}
const HOLGURA_MADERA = [2.5, 2, 1.5, 1, 0.5];   // a little more room than the first test (+1 m per level): there was too little to try things
const ANCHOS_MADERA = [[4, 5], [5, 6], [6, 7], [6, 7], [7, 8]];

/**
 * Readable solutions (`--legible`, owner's request): the cheapest bridge a search finds can be a tangle
 * of stays at 100 % strain that no person would build. This starts from trusses a person would draw
 * (triangles under the deck, over it, or both, tied to the crossing's anchors), mirrored when the
 * crossing is symmetric, and trims beams only while the peak strain stays under `LEGIBLE`. The
 * cheapest of those is the solution, the known minimum and the base of the budget.
 */
const LEGIBLE = 0.85;
function legible(e, vueltas = 10) {
  const W = e.ancho, k = b => [b.a, b.b].map(String).sort().join('|');
  const nodos = v => new Set(v.flatMap(b => [b.a.join(','), b.b.join(',')]));
  const atar = v => {
    const n = [...nodos(v)].map(x => x.split(',').map(Number)), extra = [];
    for (const a of e.anclas) for (const p of n) {
      const l = Math.hypot(a[0] - p[0], a[1] - p[1]);
      if (l > 0 && l <= 2.25 && !vigaValida(e, [...v, ...extra], a, p)) extra.push(V(a, p));
    }
    // A pillar too low to reach the truss: a post up to it
    for (const a of e.anclas) if (a[1] <= -2 && !extra.some(b => b.a === a)) { const m = [a[0], a[1] + 2]; extra.push(V(a, m)); if (!vigaValida(e, [...v, ...extra], m, [a[0], 0])) extra.push(V(m, [a[0], 0])); }
    return [...v, ...extra];
  };
  const unir = (...ls) => { const m = new Map(); for (const b of ls.flat()) m.set(k(b), b); return [...m.values()]; };
  const inicios = [cercha(W, -1), cercha(W, 1), unir(cercha(W, -1), cercha(W, 1))].map(atar).map(v => conectadas(e, v));
  const sim = simetrico(e), par = b => espejo(e, [b])[0];
  const vale = (v, tope) => { const r = probar(e, v); return r.llego && r.pico <= tope; };
  let mejor = null;
  for (const tope of [LEGIBLE, 0.95]) {
    for (const inicio of inicios) {
      if (!vale(inicio, tope)) continue;
      for (let t = 0; t < vueltas; t++) {
        let v = [...inicio];
        const orden = t === 0 ? [...v].sort((p, q) => Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) - Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1])) : barajar(v);
        for (const b of orden) {
          if (!v.some(x => k(x) === k(b))) continue;
          const fuera = new Set([k(b), ...(sim ? [k(par(b))] : [])]);
          const sin = conectadas(e, v.filter(x => !fuera.has(k(x))));
          if (sin.length < v.length && vale(sin, tope)) v = sin;
        }
        if (!mejor || costo(e, v) < costo(e, mejor)) mejor = v;
      }
    }
    if (mejor) break;
  }
  return mejor;
}
if (process.argv.includes('--legible')) {
  const nombre = process.argv[process.argv.indexOf('--legible') + 1]?.endsWith('.json') ? process.argv[process.argv.indexOf('--legible') + 1] : 'catalogo-madera.json';
  const f = new URL(nombre, CARPETA), cat = JSON.parse(readFileSync(f, 'utf8'));
  for (const e of cat) {
    const antes = probar(e, e.solucion.map(([a, b]) => V(a, b)));
    const v = legible(e);
    if (!v) { console.log(`level ${e.nivel}: ${e.tipo} — no readable truss, kept`); continue; }
    const r = probar(e, v), min = Math.ceil(costo(e, v) * 10) / 10;
    e.solucion = v.map(b => [b.a, b.b]); e.minimo = min; e.presupuesto = Math.round((min + HOLGURA_MADERA[e.nivel - 1]) * 10) / 10;
    console.log(`level ${e.nivel}: ${e.tipo} — ${v.length} beams, ${min} m, peak ${Math.round(antes.pico * 100)} % → ${Math.round(r.pico * 100)} %, budget ${e.presupuesto}`);
  }
  writeFileSync(f, JSON.stringify(cat) + '\n');
  process.exit(0);
}

const catalogo = [];
for (let nivel = 0; nivel < 5; nivel++) {
  if (SOLO && nivel !== SOLO - 1) continue;
  let hechos = 0, intentos = 0;
  while (hechos < POR_NIVEL && intentos < POR_NIVEL * 4) {
    intentos++;
    const e = cruce(nivel);
    if (llega(e, cubierta(e.ancho))) continue;                    // a bare deck must fall
    const sol = MADERA ? minimoMadera(e) : minimo(e, nivel >= 3 ? 24 : 12);
    if (!sol) continue;
    if (MADERA) {
      const min = Math.ceil(costo(e, sol) * 10) / 10;
      catalogo.push({ ...e, minimo: min, presupuesto: Math.round((min + HOLGURA_MADERA[nivel]) * 10) / 10, solucion: sol.map(v => [v.a, v.b]) });
    } else catalogo.push({ ...e, minimo: sol.length, presupuesto: sol.length + HOLGURA[nivel], solucion: sol.map(v => [v.a, v.b]) });
    hechos++;
    console.log(`level ${nivel + 1}: ${e.tipo} ancho ${e.ancho} → ${sol.length} beams${MADERA ? `, ${costo(e, sol).toFixed(1)} m of wood` : ''}`);
  }
}
const archivo = `catalogo${MADERA ? '-madera' : PRUEBA ? '-prueba' : ''}${SOLO ? `-${SOLO}` : ''}.json`;
writeFileSync(new URL(archivo, CARPETA), JSON.stringify(catalogo) + '\n');
console.log(`✓ ${catalogo.length} crossings in public/labs/bridges/${archivo}`);
