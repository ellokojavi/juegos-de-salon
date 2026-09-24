/**
 * ☀️ Tango — motor puro. El Tango de LinkedIn: llenar la grilla de soles y lunas con la misma
 * cantidad de cada uno por fila y por columna, nunca tres iguales seguidos, y respetando las
 * marcas entre casillas vecinas: "=" (iguales) y "×" (distintas). Algunas casillas vienen puestas.
 * La solución es única: el generador suma pistas hasta que el resolvedor encuentra una sola.
 */
import { azar } from './semilla.js';

export const VACIO = 0, SOL = 1, LUNA = 2;

/** ¿La línea (fila o columna) respeta las reglas, con casillas vacías permitidas? */
function lineaOk(vals, n) {
  let s = 0, l = 0;
  for (let i = 0; i < n; i++) {
    if (vals[i] === SOL) s++; else if (vals[i] === LUNA) l++;
    if (i >= 2 && vals[i] && vals[i] === vals[i - 1] && vals[i] === vals[i - 2]) return false;
  }
  return s <= n / 2 && l <= n / 2;
}

const fila = (g, n, r) => g.slice(r * n, r * n + n);
const col = (g, n, c) => Array.from({ length: n }, (_, r) => g[r * n + c]);

/** Todas las violaciones de reglas de una grilla (parcial o llena): índices de casillas. */
export function violaciones(p, g) {
  const { n, marcas } = p;
  const mal = new Set();
  for (let k = 0; k < n; k++) {
    if (!lineaOk(fila(g, n, k), n)) for (let c = 0; c < n; c++) if (g[k * n + c]) mal.add(k * n + c);
    if (!lineaOk(col(g, n, k), n)) for (let r = 0; r < n; r++) if (g[r * n + k]) mal.add(r * n + k);
  }
  for (const m of marcas) {
    const x = g[m.a], y = g[m.b];
    if (!x || !y) continue;
    if ((m.t === '=' && x !== y) || (m.t === 'x' && x === y)) { mal.add(m.a); mal.add(m.b); }
  }
  return mal;
}

/** Cuenta soluciones hasta `tope` con las casillas dadas y las marcas. */
export function resolver({ n, dadas, marcas }, tope = 2) {
  const g = new Array(n * n).fill(VACIO);
  for (const [i, v] of Object.entries(dadas)) g[i] = v;
  const porCasilla = Array.from({ length: n * n }, () => []);
  for (const m of marcas) { porCasilla[m.a].push(m); porCasilla[m.b].push(m); }
  let cuantas = 0;
  const cabe = i => {
    const r = Math.floor(i / n), c = i % n;
    if (!lineaOk(fila(g, n, r), n) || !lineaOk(col(g, n, c), n)) return false;
    for (const m of porCasilla[i]) {
      const x = g[m.a], y = g[m.b];
      if (x && y && ((m.t === '=' && x !== y) || (m.t === 'x' && x === y))) return false;
    }
    return true;
  };
  const paso = i => {
    if (cuantas >= tope) return;
    if (i === n * n) { cuantas++; return; }
    if (g[i]) { if (cabe(i)) paso(i + 1); return; }
    for (const v of [SOL, LUNA]) {
      g[i] = v;
      if (cabe(i)) paso(i + 1);
      g[i] = VACIO;
    }
  };
  paso(0);
  return cuantas;
}

function solucionAlAzar(a, n) {
  const g = new Array(n * n).fill(VACIO);
  const paso = i => {
    if (i === n * n) return true;
    for (const v of a.barajar([SOL, LUNA])) {
      g[i] = v;
      const r = Math.floor(i / n), c = i % n;
      if (lineaOk(fila(g, n, r), n) && lineaOk(col(g, n, c), n) && paso(i + 1)) return true;
      g[i] = VACIO;
    }
    return false;
  };
  paso(0);
  return g;
}

export function generar(codigo, dia, { n = 6, sal = 'tango' } = {}) {
  const a = azar(codigo, dia, sal);
  const sol = solucionAlAzar(a, n);
  // Pistas posibles: casillas dadas y marcas entre vecinas
  const candidatas = [];
  for (let i = 0; i < n * n; i++) {
    candidatas.push({ tipo: 'dada', i });
    const r = Math.floor(i / n), c = i % n;
    if (c < n - 1) candidatas.push({ tipo: 'marca', a: i, b: i + 1 });
    if (r < n - 1) candidatas.push({ tipo: 'marca', a: i, b: i + n });
  }
  const orden = a.barajar(candidatas);
  const dadas = {}, marcas = [];
  const poner = p => { if (p.tipo === 'dada') dadas[p.i] = sol[p.i]; else marcas.push({ a: p.a, b: p.b, t: sol[p.a] === sol[p.b] ? '=' : 'x' }); };
  const sacar = p => { if (p.tipo === 'dada') delete dadas[p.i]; else marcas.splice(marcas.findIndex(m => m.a === p.a && m.b === p.b), 1); };
  const usadas = [];
  for (const p of orden) {
    poner(p); usadas.push(p);
    if (resolver({ n, dadas, marcas }) === 1) break;
  }
  // Se sacan las que sobran, para que cada pista haga falta
  for (const p of a.barajar(usadas)) {
    sacar(p);
    if (resolver({ n, dadas, marcas }) !== 1) poner(p);
  }
  return { n, dadas, marcas, sol };
}

export const esDada = (p, i) => p.dadas[i] !== undefined;

export function inicial(p) {
  const g = new Array(p.n * p.n).fill(VACIO);
  for (const [i, v] of Object.entries(p.dadas)) g[i] = v;
  return g;
}

/** Vacío → sol → luna → vacío. Las dadas no se tocan. */
export function tocar(p, g, i) {
  if (esDada(p, i)) return g;
  const h = g.slice();
  h[i] = h[i] === VACIO ? SOL : h[i] === SOL ? LUNA : VACIO;
  return h;
}

/**
 * El estado a partir de las jugadas (los índices tocados). Para poner una luna hay que pasar
 * por el sol, así que un toque que rompe una regla solo cuenta como error si el jugador **deja**
 * la casilla así: si el toque siguiente es sobre la misma casilla, era un paso de camino.
 */
export function estado(p, jugadas) {
  let g = inicial(p);
  let errores = 0;
  jugadas.forEach((i, k) => {
    const antes = violaciones(p, g).size;
    g = tocar(p, g, i);
    if (g[i] && violaciones(p, g).size > antes && jugadas[k + 1] !== i) errores++;
  });
  const mal = violaciones(p, g);
  return { g, errores, mal, fin: g.every(Boolean) && mal.size === 0 };
}

/** 100 menos 10 por jugada que rompe una regla, con piso de 10. */
export const puntaje = e => (e.fin ? Math.max(10, 100 - 10 * e.errores) : 0);
export const tarjeta = e => `☀️🌙${'❌'.repeat(e.errores)}✅`;
