/**
 * 👑 Reinas — motor puro. El Queens de LinkedIn: una reina por fila, una por columna y una por
 * zona de color, y dos reinas nunca se tocan, ni en diagonal. La solución es única: el
 * generador rehace las zonas hasta que el resolvedor encuentra una sola.
 */
import { azar } from './semilla.js';

export const VACIO = 0, MARCA = 1, REINA = 2;

/** Una reina por fila y por columna, sin tocarse: columnas de filas vecinas a más de 1. */
function reinasAlAzar(a, n) {
  for (let intento = 0; intento < 500; intento++) {
    const cols = [];
    const usadas = new Set();
    let ok = true;
    for (let r = 0; r < n && ok; r++) {
      const opciones = a.barajar([...Array(n).keys()]).filter(c => !usadas.has(c) && (r === 0 || Math.abs(c - cols[r - 1]) > 1));
      if (!opciones.length) { ok = false; break; }
      cols.push(opciones[0]); usadas.add(opciones[0]);
    }
    if (ok) return cols;
  }
  throw new Error('sin reinas');
}

/** Zonas que crecen desde cada reina, al azar, hasta cubrir el tablero. */
function zonasAlAzar(a, n, cols) {
  const zona = new Int8Array(n * n).fill(-1);
  const frentes = cols.map((c, r) => [r * n + c]);
  cols.forEach((c, r) => { zona[r * n + c] = r; });
  let libres = n * n - n;
  while (libres > 0) {
    const k = a.entero(n);
    const frente = frentes[k];
    if (!frente.length) continue;
    const i = frente[a.entero(frente.length)];
    const r = Math.floor(i / n), c = i % n;
    const vecinos = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < n && cc < n && zona[rr * n + cc] === -1);
    if (!vecinos.length) { frente.splice(frente.indexOf(i), 1); continue; }
    const [rr, cc] = vecinos[a.entero(vecinos.length)];
    zona[rr * n + cc] = k; frente.push(rr * n + cc); libres--;
  }
  return Array.from(zona);
}

/** Cuenta soluciones hasta `tope`, fila por fila. */
export function resolver({ n, zonas }, tope = 2) {
  let cuantas = 0;
  const cols = [];
  const colUsada = new Array(n).fill(false), zonaUsada = new Array(n).fill(false);
  const paso = r => {
    if (cuantas >= tope) return;
    if (r === n) { cuantas++; return; }
    for (let c = 0; c < n; c++) {
      const z = zonas[r * n + c];
      if (colUsada[c] || zonaUsada[z] || (r > 0 && Math.abs(c - cols[r - 1]) <= 1)) continue;
      colUsada[c] = zonaUsada[z] = true; cols[r] = c;
      paso(r + 1);
      colUsada[c] = zonaUsada[z] = false;
    }
  };
  paso(0);
  return cuantas;
}

/** ¿La zona `z` sigue conectada si se le quita la casilla `sin`? */
function conectada(n, zonas, z, sin) {
  const celdas = [];
  zonas.forEach((v, i) => { if (v === z && i !== sin) celdas.push(i); });
  if (!celdas.length) return false;
  const visto = new Set([celdas[0]]), pila = [celdas[0]];
  while (pila.length) {
    const i = pila.pop(), r = Math.floor(i / n), c = i % n;
    for (const [rr, cc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      const j = rr * n + cc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || j === sin || zonas[j] !== z || visto.has(j)) continue;
      visto.add(j); pila.push(j);
    }
  }
  return visto.size === celdas.length;
}

/**
 * Zonas que crecen al azar desde cada reina casi nunca dan solución única. Se corrigen de a
 * poco: una casilla del borde pasa a la zona vecina (sin cortar ninguna zona y sin mover las
 * reinas de la solución) cuando eso no aumenta la cantidad de soluciones. Converge rápido.
 */
export function generar(codigo, dia, { n = 8, sal = 'reinas' } = {}) {
  const a = azar(codigo, dia, sal);
  for (let intento = 0; intento < 50; intento++) {
    const cols = reinasAlAzar(a, n);
    const reinas = new Set(cols.map((c, r) => r * n + c));
    const zonas = zonasAlAzar(a, n, cols);
    let cuantas = resolver({ n, zonas }, 500);
    for (let paso = 0; paso < 4000 && cuantas > 1; paso++) {
      const i = a.entero(n * n);
      if (reinas.has(i)) continue;
      const r = Math.floor(i / n), c = i % n;
      const otras = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
        .filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < n && cc < n)
        .map(([rr, cc]) => zonas[rr * n + cc]).filter(z => z !== zonas[i]);
      if (!otras.length) continue;
      const antes = zonas[i];
      if (!conectada(n, zonas, antes, i)) continue;
      zonas[i] = otras[a.entero(otras.length)];
      const nuevas = resolver({ n, zonas }, 500);
      if (nuevas <= cuantas) cuantas = nuevas; else zonas[i] = antes;
    }
    if (cuantas === 1) return { n, zonas, sol: cols };
  }
  throw new Error('sin reinas únicas');
}

/** Qué reinas están en conflicto: misma fila, columna o zona, o tocándose. */
export function conflictos(p, marcas) {
  const { n, zonas } = p;
  const reinas = [];
  marcas.forEach((v, i) => { if (v === REINA) reinas.push(i); });
  const mal = new Set();
  for (let x = 0; x < reinas.length; x++) for (let y = x + 1; y < reinas.length; y++) {
    const a = reinas[x], b = reinas[y];
    const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
    if (ra === rb || ca === cb || zonas[a] === zonas[b] || (Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1)) { mal.add(a); mal.add(b); }
  }
  return mal;
}

export const resuelto = (p, marcas) => marcas.filter(v => v === REINA).length === p.n && conflictos(p, marcas).size === 0;

/**
 * Un toque pone o saca la reina; un toque largo pone o saca la X, que es solo una ayuda para
 * descartar casillas (D-103). Las jugadas guardan el toque como el índice y el toque largo como
 * `-(índice + 1)`.
 */
export const toqueLargo = i => -(i + 1);
export function tocar(marcas, j) {
  const m = marcas.slice();
  if (j >= 0) m[j] = m[j] === REINA ? VACIO : REINA;
  else { const i = -j - 1; m[i] = m[i] === MARCA ? VACIO : MARCA; }
  return m;
}

/**
 * El estado a partir de las jugadas, en orden. Un error es poner una reina que choca con otra:
 * el tablero lo muestra en el acto, y cuesta puntos.
 */
export function estado(p, jugadas) {
  let marcas = new Array(p.n * p.n).fill(VACIO);
  let errores = 0;
  for (const j of jugadas) {
    const antes = conflictos(p, marcas).size;
    marcas = tocar(marcas, j);
    if (j >= 0 && marcas[j] === REINA && conflictos(p, marcas).size > antes) errores++;
  }
  return { marcas, errores, fin: resuelto(p, marcas), conflictos: conflictos(p, marcas) };
}

/** 100 menos 10 por reina puesta en conflicto, con piso de 10. */
export const puntaje = e => (e.fin ? Math.max(10, 100 - 10 * e.errores) : 0);
export const tarjeta = e => `👑${'❌'.repeat(e.errores)}✅`;
