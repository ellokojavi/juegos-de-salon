/**
 * Pintaminas — el motor (laboratorio, D-289). Inspirado en ColorSweeper (ARRKKA): un Buscaminas en que
 * cada casilla es de tinta o de fondo, y su número dice cuántas de sus 8 vecinas son de su mismo color.
 * Al resolverlo, la tinta forma un dibujo (lo que toma de los nonogramas).
 *
 * El tablero se arma desde un dibujo de 7×7: se dan algunas casillas con su color y su número, y el
 * resto se deduce. Cada casilla que el jugador acierta muestra su número, que da más pistas. El
 * generador agrega casillas dadas hasta que `resolver` lo termina sin adivinar, y después saca las
 * que sobran: siempre se resuelve con lógica.
 */
import { DIBUJOS, DIBUJOS2, PALETA } from './dibujos.js';

export const LADO = 7;
export const RESTA_ERROR = 15;
/** Lo que cuesta cada ayuda 💡 (D-292). */
export const RESTA_AYUDA = 10;
/** El premio del modo difícil (dos colores): el puntaje se multiplica (pedido del dueño). */
export const PREMIO_DIFICIL = 1.5;

function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Las vecinas de cada casilla (hasta 8). */
export const VECINAS = Array.from({ length: LADO * LADO }, (_, i) => {
  const f = Math.floor(i / LADO), c = i % LADO, v = [];
  for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
    if (!df && !dc) continue;
    const ff = f + df, cc = c + dc;
    if (ff >= 0 && ff < LADO && cc >= 0 && cc < LADO) v.push(ff * LADO + cc);
  }
  return v;
});

/** El número de una casilla: cuántas de sus vecinas son de su mismo color. */
export const numero = (sol, i) => VECINAS[i].filter(j => sol[j] === sol[i]).length;

/**
 * Lo que se puede deducir desde las casillas conocidas, como lo haría un jugador. Cada casilla lleva
 * los colores que todavía puede tener (0 es sin pintar; 1, y 2 en el modo de dos colores). Cada
 * casilla conocida de color v dice cuántas de sus vecinas son v: si ya están todas, las demás no son
 * v; si las que pueden serlo son justo las que faltan, lo son. Y si las vecinas posibles de una
 * casilla están todas entre las de otra (para el mismo color), la diferencia también dice algo (como
 * en el Buscaminas). Una casilla con un solo color posible se conoce, muestra su número y se sigue.
 * Devuelve el mapa de conocidas.
 */
export const resolver = (sol, dadas) => deducir(sol, dadas).sabe;

/**
 * La ayuda (D-292): la primera casilla que se puede deducir desde las conocidas, y los números que la
 * explican (las casillas conocidas cuyas reglas la tocaron). `null` si ya no queda nada por deducir.
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
    // Cada conocida: sus vecinas que todavía pueden ser de su color, y cuántas de ellas lo son
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
    // Una dentro de otra, para el mismo color: lo que sobra de la grande tiene la diferencia
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
 * El tablero de una semilla: `{ dibujo: { nombre, emoji, pinturas }, sol: [0..colores ×49], dadas }`.
 * Con `colores: 2` (el modo difícil) usa los dibujos de dos colores. El dibujo puede salir espejado,
 * y se pinta con sus colores de verdad (`colores` de cada dibujo). Con las dadas se resuelve entero.
 */
export function generar(semilla, { colores = 1 } = {}) {
  const r = azar(String(semilla));
  const lista = colores === 2 ? DIBUJOS2 : DIBUJOS;
  const d = lista[Math.floor(r() * lista.length)];
  const espejo = r() < 0.5;
  // Cada dibujo con sus colores de verdad (pedido del dueño). La baraja de antes se sigue sacando, sin
  // usarla, para que el azar de lo que viene (las dadas) no cambie: los links de antes dan el mismo tablero
  barajar(PALETA.slice(0, 6), r);   // los 6 colores que había entonces
  const pinturas = d.colores.slice(0, colores).map(n => PALETA.find(p => p.nombre === n));
  const valor = { '#': 1, '+': 2, '.': 0 };
  const sol = d.filas.flatMap(fila => [...(espejo ? [...fila].reverse().join('') : fila)].map(x => valor[x]));
  const todas = [...sol.keys()];
  // Se agregan dadas al azar hasta que se resuelve entero
  const dadas = new Set(barajar(todas, r).slice(0, 3));
  while (resolver(sol, dadas).size < sol.length) {
    const sabe = resolver(sol, dadas);
    const faltan = todas.filter(i => !sabe.has(i));
    dadas.add(faltan[Math.floor(r() * faltan.length)]);
  }
  // Y se sacan las que no hacen falta: más deducción, menos regalo
  for (const i of barajar([...dadas], r)) {
    dadas.delete(i);
    if (resolver(sol, dadas).size < sol.length) dadas.add(i);
  }
  return { dibujo: { nombre: d.nombre, emoji: d.emoji, pinturas }, colores, sol, dadas: [...dadas].sort((a, b) => a - b) };
}

/**
 * El estado tras las jugadas (`{ i, color }`, en orden): qué casillas se conocen (las dadas, las
 * acertadas y las erradas, que se destapan con su color verdadero), cuáles fueron error, y si terminó.
 */
export function estado(t, jugadas = []) {
  const conocidas = new Set(t.dadas), errores = new Set();
  let ayudas = 0;
  for (const { i, color, ayuda: pedida } of jugadas) {
    if (pedida) { ayudas++; continue; }
    if (conocidas.has(i)) continue;
    conocidas.add(i);
    if (t.sol[i] !== color) errores.add(i);
  }
  // avance: qué parte de lo que había que pintar ya se pintó (para quien se rinde)
  const avance = (conocidas.size - t.dadas.length) / Math.max(1, t.sol.length - t.dadas.length);
  return { conocidas, errores, ayudas, avance, fin: conocidas.size === t.sol.length };
}

/** De 0 a 100: cada error resta RESTA_ERROR. */
// Quien se rinde se lleva la parte que pintó: el puntaje vale ese avance (D-296)
export const puntaje = (e, { colores = 1, rendido = false } = {}) => Math.round(Math.max(0, 100 - RESTA_ERROR * e.errores.size - RESTA_AYUDA * (e.ayudas || 0)) * (rendido ? e.avance : 1) * (colores === 2 ? PREMIO_DIFICIL : 1));
/** El máximo posible: 100, o 150 en el modo difícil. */
export const maximo = colores => Math.round(100 * (colores === 2 ? PREMIO_DIFICIL : 1));

/** La tarjeta para compartir, sin delatar el dibujo: dónde se equivocó (🟥) en la grilla. */
export const tarjeta = (t, e) => Array.from({ length: LADO }, (_, f) =>
  Array.from({ length: LADO }, (_, c) => (e.errores.has(f * LADO + c) ? '🟥' : '⬛')).join('')).join('\n');
