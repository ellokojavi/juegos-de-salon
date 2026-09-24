/**
 * ⚓ Batalla Naval: Solitario — motor puro. El Bimaru de Jaime Poniachik (Humor & Juegos,
 * 1982) con la flota de Batalla Naval: la flota está escondida, cada fila y cada columna dice
 * cuántas casillas de barco tiene, los barcos no se tocan ni en diagonal y algunas casillas
 * vienen destapadas. La solución es única: el generador agrega pistas hasta que lo es.
 */
import { azar } from './semilla.js';

/** La flota de Batalla Naval, de mayor a menor (los ids calzan con el pixel art de flota.js). */
export const FLOTA = [
  { id: 'carrier', size: 5 }, { id: 'battleship', size: 4 }, { id: 'cruiser', size: 3 },
  { id: 'submarine', size: 3 }, { id: 'destroyer', size: 2 },
];
export const FLOTA_CHICA = [{ id: 'cruiser', size: 3 }, { id: 'submarine', size: 3 }, { id: 'destroyer', size: 2 }];

export const VACIO = 0, AGUA = 1, BARCO = 2;

const celdas = (size, { r, c, dir }) => Array.from({ length: size }, (_, i) => (dir === 'h' ? [r, c + i] : [r + i, c]));

/** Todas las posiciones posibles de un barco en un tablero n×n. */
function posiciones(n, size) {
  const out = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (c + size <= n) out.push({ r, c, dir: 'h' });
    if (size > 1 && r + size <= n) out.push({ r, c, dir: 'v' });
  }
  return out;
}

/** ¿Cabe sin tocar a nadie (ni en diagonal)? `ocupado` es un arreglo n×n de 0/1. */
function cabe(n, ocupado, cs) {
  for (const [r, c] of cs) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < n && cc < n && ocupado[rr * n + cc]) return false;
    }
  }
  return true;
}

/** Una flota al azar que respeta la regla del solitario. */
function flotaAlAzar(a, n, flota) {
  for (let intento = 0; intento < 200; intento++) {
    const ocupado = new Uint8Array(n * n);
    const layout = {};
    let ok = true;
    for (const f of flota) {
      const opciones = a.barajar(posiciones(n, f.size)).filter(p => cabe(n, ocupado, celdas(f.size, p)));
      if (!opciones.length) { ok = false; break; }
      layout[f.id] = opciones[0];
      for (const [r, c] of celdas(f.size, opciones[0])) ocupado[r * n + c] = 1;
    }
    if (ok) return layout;
  }
  throw new Error('no cupo la flota');
}

export function mapa(n, layout, flota) {
  const m = new Uint8Array(n * n);
  for (const f of flota) for (const [r, c] of celdas(f.size, layout[f.id])) m[r * n + c] = 1;
  return m;
}

/**
 * Cuenta soluciones hasta `tope`. Coloca los barcos de mayor a menor; dos barcos del mismo
 * largo van en orden de posición para no contar la misma solución dos veces. Devuelve
 * { cuantas, otra } con una solución distinta de `evitar` si la encontró.
 */
export function resolver({ n, filas, cols, pistas, flota }, { tope = 2, evitar = null } = {}) {
  const fijo = new Int8Array(n * n);
  for (const p of pistas) fijo[p.r * n + p.c] = p.v;
  const ocupado = new Uint8Array(n * n);
  const enFila = new Int8Array(n), enCol = new Int8Array(n);
  const opciones = flota.map(f => posiciones(n, f.size));
  let cuantas = 0, otra = null;

  const completo = () => {
    for (let i = 0; i < n; i++) if (enFila[i] !== filas[i] || enCol[i] !== cols[i]) return false;
    for (let i = 0; i < n * n; i++) if (fijo[i] === BARCO && !ocupado[i]) return false;
    return true;
  };

  const paso = (k, desde) => {
    if (cuantas >= tope) return;
    if (k === flota.length) {
      if (!completo()) return;
      cuantas++;
      if (evitar && !otra && ocupado.some((v, i) => v !== evitar[i])) otra = Uint8Array.from(ocupado);
      return;
    }
    const mismo = k > 0 && flota[k].size === flota[k - 1].size;
    const lista = opciones[k];
    for (let i = mismo ? desde + 1 : 0; i < lista.length; i++) {
      const cs = celdas(flota[k].size, lista[i]);
      if (!cabe(n, ocupado, cs)) continue;
      let ok = true;
      for (const [r, c] of cs) {
        if (fijo[r * n + c] === AGUA) { ok = false; break; }
      }
      if (!ok) continue;
      for (const [r, c] of cs) { enFila[r]++; enCol[c]++; }
      if (cs.every(([r, c]) => enFila[r] <= filas[r] && enCol[c] <= cols[c])) {
        for (const [r, c] of cs) ocupado[r * n + c] = 1;
        paso(k + 1, i);
        for (const [r, c] of cs) ocupado[r * n + c] = 0;
      }
      for (const [r, c] of cs) { enFila[r]--; enCol[c]--; }
      if (cuantas >= tope && (!evitar || otra)) return;
    }
  };
  paso(0, -1);
  return { cuantas, otra };
}

/**
 * El tablero del día: la flota, los números de filas y columnas, y las pistas mínimas para que
 * la solución sea única (más una casilla de barco de regalo, para arrancar por algún lado).
 */
export function generar(codigo, dia, { n = 8, flota = FLOTA, sal = 'solitario' } = {}) {
  const a = azar(codigo, dia, sal);
  const layout = flotaAlAzar(a, n, flota);
  const sol = mapa(n, layout, flota);
  const filas = Array.from({ length: n }, (_, r) => sol.slice(r * n, r * n + n).reduce((s, v) => s + v, 0));
  const cols = Array.from({ length: n }, (_, c) => { let s = 0; for (let r = 0; r < n; r++) s += sol[r * n + c]; return s; });
  const barcos = a.barajar([...sol.keys()].filter(i => sol[i]));
  const pistas = [{ r: Math.floor(barcos[0] / n), c: barcos[0] % n, v: BARCO }];
  for (let vueltas = 0; vueltas < n * n; vueltas++) {
    const { cuantas, otra } = resolver({ n, filas, cols, pistas, flota }, { tope: 2, evitar: sol });
    if (cuantas <= 1) break;
    // Se destapa una casilla donde la otra solución se equivoca: la elimina a ella y a sus parecidas
    const distintas = a.barajar([...sol.keys()].filter(i => otra[i] !== sol[i]));
    const i = distintas[0];
    pistas.push({ r: Math.floor(i / n), c: i % n, v: sol[i] ? BARCO : AGUA });
  }
  return { n, flota, layout, filas, cols, pistas };
}

/** La solución como arreglo n×n de 0/1. */
export const solucion = p => mapa(p.n, p.layout, p.flota);

/**
 * Cuántas casillas no calzan: marcadas como barco donde no hay, o sin marcar donde hay.
 * Las marcas de agua no cuentan, son ayuda para quien juega.
 */
export function errores(p, marcas) {
  const sol = solucion(p);
  let e = 0;
  for (let i = 0; i < sol.length; i++) if ((marcas[i] === BARCO) !== !!sol[i]) e++;
  return e;
}

/** Las marcas iniciales: las pistas ya puestas. */
export function marcasIniciales(p) {
  const m = new Array(p.n * p.n).fill(VACIO);
  for (const q of p.pistas) m[q.r * p.n + q.c] = q.v;
  return m;
}

/** Vacío → agua → barco → vacío. Las pistas no se tocan. */
export function tocar(p, marcas, i) {
  if (p.pistas.some(q => q.r * p.n + q.c === i)) return marcas;
  const m = marcas.slice();
  m[i] = m[i] === VACIO ? AGUA : m[i] === AGUA ? BARCO : VACIO;
  return m;
}

/** Cuántas marcas de barco lleva cada fila y columna (para pintar los números completos). */
export function cuentas(p, marcas) {
  const fil = new Array(p.n).fill(0), col = new Array(p.n).fill(0);
  marcas.forEach((v, i) => { if (v === BARCO) { fil[Math.floor(i / p.n)]++; col[i % p.n]++; } });
  return { fil, col };
}

export const PUNTOS_BASE = 100;
export const CASTIGO = 15;
export const PISO = 10;

/** 100 menos 15 por revisión fallida, con piso de 10 si lo resolvió; 0 si se rindió. */
export const puntaje = ({ resuelto, fallidas }) => (resuelto ? Math.max(PISO, PUNTOS_BASE - CASTIGO * fallidas) : 0);

export const tarjeta = ({ resuelto, fallidas }) => (resuelto ? `⚓${'❌'.repeat(fallidas)}✅` : `⚓${'❌'.repeat(fallidas)}🏳️`);
