// Tren en Vilo (lab): builds the catalog of crossings, public/labs/bridges/catalogo.json.
//   node tools/generators/bridges.mjs [--por-nivel 12] [--nivel 1..5]   (one level writes catalogo-<n>.json, to run them in parallel)
//   node tools/generators/bridges.mjs --juntar                          (joins catalogo-1..5.json into catalogo.json)
// For each difficulty level (1 to 5) it makes crossings of different kinds — anchors low on the cliff
// faces, stone towers above the deck, rock pillars out of the water, or a mix — searches each one's
// cheapest bridge that holds (greedy removal from rich starts, like the first stages), and keeps those
// whose bare deck falls. The budget is that minimum plus the level's spare beams (3, 3, 2, 1, 0).
// Each game draws one crossing per level, so a regular player rarely meets the same five.
import { writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { probar, vigaValida, fijos } from '../../public/labs/bridges/engine.js';

const arg = n => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const POR_NIVEL = Number(arg('--por-nivel')) || 12;
const SOLO = Number(arg('--nivel')) || 0;
const CARPETA = new URL('../../public/labs/bridges/', import.meta.url);
if (process.argv.includes('--juntar')) {
  const todo = [];
  for (let n = 1; n <= 5; n++) { const f = new URL(`catalogo-${n}.json`, CARPETA); if (existsSync(f)) { todo.push(...JSON.parse(readFileSync(f, 'utf8'))); rmSync(f); } }
  writeFileSync(new URL('catalogo.json', CARPETA), JSON.stringify(todo) + '\n');
  console.log(`✓ ${todo.length} crossings in public/labs/bridges/catalogo.json`);
  process.exit(0);
}
const HOLGURA = [3, 3, 2, 1, 0];
const ANCHOS = [[4, 5], [5, 6], [6, 7], [7, 8], [8, 8]];   // at 9 wide the search left bridges of 33 to 40 beams: too long to build
let semilla = 20261016 + (Number(process.argv[process.argv.indexOf('--nivel') + 1]) || 0) * 7919;
const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const entre = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const V = (a, b) => ({ a, b });
const llega = (e, v) => probar(e, v).llego;

/** A crossing of one kind: its anchors, besides the deck's two edges. */
function cruce(nivel) {
  const W = entre(...ANCHOS[nivel]);
  const tipos = nivel === 0 ? ['bajo', 'torres'] : ['bajo', 'torres', 'pilar', 'pilar-lado', 'mixto'];
  const tipo = tipos[Math.floor(rnd() * tipos.length)];
  const anclas = [];
  const bajos = () => { anclas.push([0, -entre(1, 2)], [W, -entre(1, 2)]); };
  const torres = () => { anclas.push([0, 2], [W, 2]); };
  const pilar = lado => { const k = lado ? (rnd() < 0.5 ? 2 : W - 2) : Math.round(W / 2); anclas.push([k, -entre(2, 3)]); };
  if (tipo === 'bajo') bajos();
  if (tipo === 'torres') { torres(); if (rnd() < 0.5) anclas.push([0, -1], [W, -1]); }
  if (tipo === 'pilar') { pilar(false); anclas.push([0, -1], [W, -1]); }
  if (tipo === 'pilar-lado') { pilar(true); anclas.push([0, -1], [W, -1]); }
  if (tipo === 'mixto') { torres(); pilar(rnd() < 0.5); }
  return { ancho: W, anclas, tipo, nivel: nivel + 1 };
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
  return mejor;
}

const catalogo = [];
for (let nivel = 0; nivel < 5; nivel++) {
  if (SOLO && nivel !== SOLO - 1) continue;
  let hechos = 0, intentos = 0;
  while (hechos < POR_NIVEL && intentos < POR_NIVEL * 4) {
    intentos++;
    const e = cruce(nivel);
    if (llega(e, cubierta(e.ancho))) continue;                    // a bare deck must fall
    const sol = minimo(e, nivel >= 3 ? 24 : 12);
    if (!sol) continue;
    catalogo.push({ ...e, minimo: sol.length, presupuesto: sol.length + HOLGURA[nivel], solucion: sol.map(v => [v.a, v.b]) });
    hechos++;
    console.log(`level ${nivel + 1}: ${e.tipo} ancho ${e.ancho} → ${sol.length} beams`);
  }
}
const archivo = SOLO ? `catalogo-${SOLO}.json` : 'catalogo.json';
writeFileSync(new URL(archivo, CARPETA), JSON.stringify(catalogo) + '\n');
console.log(`✓ ${catalogo.length} crossings in public/labs/bridges/${archivo}`);
