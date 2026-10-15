/**
 * Pintaminas — the engine (D-289; out of the lab and into La Copa since D-331). Inspired by
 * ColorSweeper (ARRKKA): a Minesweeper where each cell is painted or not, and its number says how
 * many of its 8 neighbors are like it. Once solved, the paint makes a drawing (the nonogram part).
 *
 * The board is built from a 7×7 drawing: some cells are given with their color and number, and the
 * rest is deduced. Each cell the player gets right shows its number, which gives more clues. The
 * generator adds given cells until `resolver` finishes it without guessing, and then removes the
 * extra ones: it is always solved with logic.
 *
 * Two variants (D-331): `easy` (one color) and `hard` (two colors). Both score 0 to 100.
 */
import { DIBUJOS, DIBUJOS2, PALETA } from './dibujos.js';

export const LADO = 7;
export const RESTA_ERROR = 15;
/** What each 💡 hint costs (D-292). */
export const RESTA_AYUDA = 10;
/** The variants (D-331, the same list as VARIANTES.pintaminas in ../../engine.js): the first one is the default. */
export const VARIANTES = ['easy', 'hard'];
/** How many cells the trial session (D-103) leaves to paint: the same game, shorter. */
export const LIBRES_ENSAYO = 15;

function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Each cell's neighbors (up to 8). */
export const VECINAS = Array.from({ length: LADO * LADO }, (_, i) => {
  const f = Math.floor(i / LADO), c = i % LADO, v = [];
  for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
    if (!df && !dc) continue;
    const ff = f + df, cc = c + dc;
    if (ff >= 0 && ff < LADO && cc >= 0 && cc < LADO) v.push(ff * LADO + cc);
  }
  return v;
});

/** A cell's number: how many of its neighbors are the same color as it. */
export const numero = (sol, i) => VECINAS[i].filter(j => sol[j] === sol[i]).length;

/**
 * What can be deduced from the known cells, the way a player would. Each cell carries the colors it
 * can still have (0 is unpainted; 1, and 2 in the two-color variant). Each known cell of color v says
 * how many of its neighbors are v: if they are all there, the rest are not v; if the ones that can be
 * are exactly the ones missing, they are. And if a cell's possible neighbors are all among another's
 * (for the same color), the difference says something too (as in Minesweeper). A cell with a single
 * possible color is known, shows its number, and it goes on. Returns the map of known cells.
 */
export const resolver = (sol, dadas) => deducir(sol, dadas).sabe;

/**
 * The hint (D-292): the first cell that can be deduced from the known ones, and the numbers that
 * explain it (the known cells whose rules touched it). `null` if there is nothing left to deduce.
 */
export function ayuda(sol, conocidas) {
  const { primera } = deducir(sol, conocidas, true);
  return primera;
}

function deducir(sol, dadas, soloLaPrimera = false) {
  const colores = Math.max(...sol) + 1;
  const posibles = sol.map(() => (1 << colores) - 1);
  const sabe = new Map(), fuentes = new Map();
  let primera = null;
  const conocer = j => {
    sabe.set(j, Math.log2(posibles[j]));
    if (soloLaPrimera && !primera) primera = { celda: j, por: [...(fuentes.get(j) || [])] };
  };
  for (const i of dadas) { posibles[i] = 1 << sol[i]; sabe.set(i, sol[i]); }
  const anotar = (j, de) => { if (!fuentes.has(j)) fuentes.set(j, new Set()); for (const i of de) fuentes.get(j).add(i); };
  let cambio = true;
  const quitar = (des, v, de) => {
    for (const j of des) if (!sabe.has(j) && (posibles[j] >> v) & 1) {
      posibles[j] &= ~(1 << v); cambio = true; anotar(j, de);
      if (!(posibles[j] & (posibles[j] - 1))) conocer(j);
    }
  };
  const poner = (des, v, de) => { for (const j of des) if (!sabe.has(j)) { posibles[j] = 1 << v; anotar(j, de); conocer(j); cambio = true; } };
  while (cambio && !primera) {
    cambio = false;
    // Each known cell: its neighbors that can still be its color, and how many of them are
    const reglas = [];
    for (const [i, v] of sabe) {
      const des = VECINAS[i].filter(j => !sabe.has(j) && (posibles[j] >> v) & 1);
      if (!des.length) continue;
      reglas.push({ i, des, v, n: numero(sol, i) - VECINAS[i].filter(j => sabe.get(j) === v).length });
    }
    for (const r of reglas) {
      if (primera) break;
      if (r.n === 0) quitar(r.des, r.v, [r.i]);
      else if (r.n === r.des.length) poner(r.des, r.v, [r.i]);
    }
    if (cambio) continue;
    // One inside another, for the same color: what is left of the bigger one holds the difference
    for (const a of reglas) for (const b of reglas) {
      if (primera || a === b || a.v !== b.v || a.des.length >= b.des.length || !a.des.every(j => b.des.includes(j))) continue;
      const resto = b.des.filter(j => !a.des.includes(j)), n = b.n - a.n;
      if (n === 0) quitar(resto, a.v, [a.i, b.i]);
      else if (n === resto.length) poner(resto, a.v, [a.i, b.i]);
    }
  }
  return { sabe, primera };
}

/**
 * The board of a seed: `{ dibujo: { id, emoji, pinturas }, colores, sol: [0..colores ×49], dadas }`.
 * With `colores: 2` (the hard variant) it uses the two-color drawings. The drawing may come out
 * mirrored, and it is painted in its real colors (each drawing's `colores`). With the given cells it
 * is solved whole.
 */
export function generar(semilla, { colores = 1 } = {}) {
  const r = azar(String(semilla));
  const lista = colores === 2 ? DIBUJOS2 : DIBUJOS;
  const d = lista[Math.floor(r() * lista.length)];
  const espejo = r() < 0.5;
  // Each drawing in its real colors (the owner's request). The old color shuffle is still drawn, unused,
  // so the randomness of what follows (the given cells) does not change: old seeds give the same board
  barajar(PALETA.slice(0, 6), r);   // the 6 colors there were then
  const pinturas = d.colores.slice(0, colores).map(n => PALETA.find(p => p.id === n));
  const valor = { '#': 1, '+': 2, '.': 0 };
  const sol = d.filas.flatMap(fila => [...(espejo ? [...fila].reverse().join('') : fila)].map(x => valor[x]));
  const todas = [...sol.keys()];
  // Given cells are added at random until it is solved whole
  const dadas = new Set(barajar(todas, r).slice(0, 3));
  while (resolver(sol, dadas).size < sol.length) {
    const sabe = resolver(sol, dadas);
    const faltan = todas.filter(i => !sabe.has(i));
    dadas.add(faltan[Math.floor(r() * faltan.length)]);
  }
  // And the ones that are not needed are removed: more deduction, fewer gifts
  for (const i of barajar([...dadas], r)) {
    dadas.delete(i);
    if (resolver(sol, dadas).size < sol.length) dadas.add(i);
  }
  return { dibujo: { id: d.id, emoji: d.emoji, pinturas }, colores, sol, dadas: [...dadas].sort((a, b) => a - b) };
}

/**
 * The board of a cup day or a standalone game (D-331): the same for everyone with the same code, day
 * and variant. `hard` is two colors. The trial (`ensayo: true`, D-103) is another board with more
 * given cells, so only LIBRES_ENSAYO are left to paint: the same mechanics, shorter.
 */
export function generarDia(codigo, dia, { variante = VARIANTES[0], sal = '', ensayo = false } = {}) {
  const v = VARIANTES.includes(variante) ? variante : VARIANTES[0];
  const semilla = `${codigo}:${dia}:${v}${sal ? `:${sal}` : ''}`;
  const t = generar(semilla, { colores: v === 'hard' ? 2 : 1 });
  if (ensayo) {
    const r = azar(`${semilla}:mas`);
    const dadas = new Set(t.dadas);
    for (const i of barajar([...t.sol.keys()].filter(i => !dadas.has(i)), r)) {
      if (t.sol.length - dadas.size <= LIBRES_ENSAYO) break;
      dadas.add(i);
    }
    t.dadas = [...dadas].sort((a, b) => a - b);
  }
  return { ...t, variante: v, ensayo: !!ensayo };
}

/**
 * The state after the moves, in order: `{ i, color }` paints a cell, `{ ayuda: true, c }` is a paid
 * hint (D-292; `c`, the cell it pointed at, so a reloaded cup day can show it again for free) and
 * `{ rendido: true }` is giving up (D-296). Which cells are known (the given ones, the right ones and
 * the wrong ones, which are uncovered with their true color), which were mistakes, and whether it
 * ended: `fin` is the board painted whole, `terminado` that or given up.
 */
export function estado(t, jugadas = []) {
  const conocidas = new Set(t.dadas), errores = new Set();
  let ayudas = 0, rendido = false, pista = null;
  for (const j of jugadas) {
    if (rendido) break;
    if (j.rendido) { rendido = true; continue; }
    if (j.ayuda) { ayudas++; pista = Number.isInteger(j.c) ? j.c : null; continue; }
    const { i, color } = j;
    if (!Number.isInteger(i) || i < 0 || i >= t.sol.length || conocidas.has(i)) continue;
    conocidas.add(i);
    if (t.sol[i] !== color) errores.add(i);
  }
  const fin = conocidas.size === t.sol.length;
  // avance: how much of what had to be painted was painted (for whoever gives up)
  const avance = (conocidas.size - t.dadas.length) / Math.max(1, t.sol.length - t.dadas.length);
  // The last paid hint, while its cell is still unpainted: seeing it again is free (#351)
  const pagada = pista !== null && !conocidas.has(pista) ? pista : null;
  return { conocidas, errores, ayudas, avance, pagada, fin, rendido: rendido && !fin, terminado: fin || rendido };
}

/**
 * From 0 to 100, in both variants (D-113, D-331): each mistake subtracts RESTA_ERROR and each hint
 * RESTA_AYUDA. Whoever gives up takes the part they painted: the score is worth that much (D-296).
 */
export const puntaje = (e, { rendido = !!e.rendido } = {}) => Math.round(Math.max(0, 100 - RESTA_ERROR * e.errores.size - RESTA_AYUDA * (e.ayudas || 0)) * (rendido ? e.avance : 1));

/** The share card, without giving the drawing away: where the mistakes were (🟥) on the grid. */
export const tarjeta = e => Array.from({ length: LADO }, (_, f) =>
  Array.from({ length: LADO }, (_, c) => (e.errores.has(f * LADO + c) ? '🟥' : '⬛')).join('')).join('\n');
