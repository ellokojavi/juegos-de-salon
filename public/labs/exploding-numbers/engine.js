/**
 * Números explosivos — el motor (laboratorio, D-297). Inspirado en Number Match (Easybrain), que viene de un juego
 * de lápiz y papel (Take Ten): una grilla de 9 columnas con números del 1 al 9. Se tachan de a pares
 * dos números iguales o que suman 10, si están juntos en línea (de lado, arriba o abajo, o en
 * diagonal) o uno al final de una fila y el otro al comienzo de la siguiente; lo tachado no estorba.
 * Una fila tachada entera se va. Sin pares, ➕ copia al final los números que quedan.
 *
 * El tablero se arma con una salida: sus pares van anidados como paréntesis en el orden de lectura,
 * así que tacharlos de adentro hacia afuera lo limpia entero sin ➕ (el orden de lectura no cambia
 * cuando una fila se va). Un mal orden igual puede trabarlo, y los pares que se ven de arriba abajo o
 * en diagonal salen al azar.
 */
export const COLUMNAS = 9;
/** El tablero del día: 4 filas. */
export const INICIALES = 36;
/** Las veces que se puede usar ➕ en una partida. */
export const MAS = 3;
/** Lo que vale limpiar el tablero, y cada ➕ que sobra; la ayuda resta. Suman 100. */
export const PUNTOS_LIMPIO = 70;
export const PUNTOS_MAS = 10;
export const RESTA_AYUDA = 10;
export const MAXIMO = PUNTOS_LIMPIO + MAS * PUNTOS_MAS;

function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

/** ¿Hacen pareja? Iguales, o que suman 10. */
export const pareja = (a, b) => a === b || a + b === 10;

/**
 * El camino entre dos casillas (índices de la grilla de ahora): las del medio, o null si no hay línea.
 * En el orden de lectura vale siempre (de lado, y del final de una fila al comienzo de otra); de
 * arriba abajo y en diagonal, solo si están en la misma columna o en la misma diagonal.
 */
function caminos(i, j) {
  if (i > j) [i, j] = [j, i];
  const fi = Math.floor(i / COLUMNAS), ci = i % COLUMNAS, fj = Math.floor(j / COLUMNAS), cj = j % COLUMNAS;
  const out = [{ tipo: 'lectura', medio: Array.from({ length: j - i - 1 }, (_, k) => i + 1 + k) }];
  const df = fj - fi, dc = cj - ci;
  if (df && !dc) out.push({ tipo: 'columna', medio: Array.from({ length: df - 1 }, (_, k) => i + (k + 1) * COLUMNAS) });
  if (df && Math.abs(dc) === df) out.push({ tipo: 'diagonal', medio: Array.from({ length: df - 1 }, (_, k) => i + (k + 1) * (COLUMNAS + Math.sign(dc))) });
  return out;
}
/** La línea que une i con j por casillas vacías (`libre(k)`), o null. */
export function linea(i, j, libre) {
  return caminos(i, j).find(c => c.medio.every(libre)) || null;
}
/** ¿Están en una misma fila, columna o diagonal? (para decir por qué no se unen) */
const alineadas = (i, j) => caminos(i, j).length > 1 || Math.floor(i / COLUMNAS) === Math.floor(j / COLUMNAS);

/**
 * El tablero de una semilla: los números y el orden en que se limpia (pares de ids). `n` par.
 */
export function generar(semilla, { n = INICIALES } = {}) {
  const r = azar(String(semilla));
  // Los pares anidados como paréntesis en el orden de lectura: cada uno encierra solo pares que se
  // tachan antes, así que al llegar su turno lo de entre medio ya no está. Se abre con más ganas al
  // comienzo, para que haya pares largos que crucen filas y no todo esté a la vista
  const abiertos = [], pares = [];
  for (let k = 0; k < n; k++) {
    const quedan = n - k;
    const abrir = !abiertos.length || (quedan > abiertos.length && r() < 0.55);
    if (abrir) abiertos.push(k); else pares.push([abiertos.pop(), k]);
  }
  const numeros = new Array(n).fill(0);
  for (const [i, j] of pares) {
    const v = 1 + Math.floor(r() * 9);
    [numeros[i], numeros[j]] = r() < 0.5 ? [v, v] : r() < 0.5 ? [v, 10 - v] : [10 - v, v];
  }
  // El orden: los de adentro primero (encierran menos)
  const orden = pares.sort((x, y) => (x[1] - x[0]) - (y[1] - y[0]) || r() - 0.5);
  return { semilla: String(semilla), numeros, orden };
}

/** Una partida: las casillas de ahora ({ id, v, fuera }), los ➕ que quedan, y lo que pasó. */
export function nuevaPartida(t) {
  return { celdas: t.numeros.map((v, id) => ({ id, v, fuera: false })), mas: MAS, ayudas: 0, pares: 0, filas: 0, total: t.numeros.length, sigId: t.numeros.length };
}
export const indice = (p, id) => p.celdas.findIndex(c => c.id === id);
const libreEn = p => k => p.celdas[k].fuera;

/** ¿Se pueden tachar i y j? { ok } o { ok: false, motivo: 'numeros' | 'tapado' | 'linea' }. */
export function une(p, i, j) {
  const a = p.celdas[i], b = p.celdas[j];
  if (!a || !b || i === j || a.fuera || b.fuera) return { ok: false, motivo: 'linea' };
  if (!pareja(a.v, b.v)) return { ok: false, motivo: 'numeros' };
  if (linea(i, j, libreEn(p))) return { ok: true };
  return { ok: false, motivo: alineadas(i, j) ? 'tapado' : 'linea' };
}

/**
 * Tacha i y j y saca las filas que quedaron enteras tachadas (también la última, aunque esté corta).
 * Devuelve las filas que se fueron (su número antes de irse) y si el tablero quedó limpio.
 */
export function quitar(p, i, j) {
  const u = une(p, i, j);
  if (!u.ok) return u;
  p.celdas[i].fuera = p.celdas[j].fuera = true;
  p.pares++;
  const filas = [];
  const nFilas = Math.ceil(p.celdas.length / COLUMNAS);
  for (let f = nFilas - 1; f >= 0; f--) {
    const fila = p.celdas.slice(f * COLUMNAS, (f + 1) * COLUMNAS);
    if (fila.every(c => c.fuera)) { p.celdas.splice(f * COLUMNAS, fila.length); filas.unshift(f); }
  }
  p.filas += filas.length;
  return { ok: true, filas, limpio: p.celdas.length === 0 };
}

/** ➕: copia al final, en orden, los números que quedan. Devuelve cuántos agregó. */
export function agregar(p) {
  if (p.mas <= 0) return 0;
  const quedan = p.celdas.filter(c => !c.fuera);
  for (const c of quedan) p.celdas.push({ id: p.sigId++, v: c.v, fuera: false });
  p.mas--;
  p.total += quedan.length;
  return quedan.length;
}

/** Los pares que se pueden tachar ahora, los más cercanos primero. */
export function pares(p) {
  const out = [], libre = libreEn(p), n = p.celdas.length;
  for (let i = 0; i < n; i++) {
    if (p.celdas[i].fuera) continue;
    for (let j = i + 1; j < n; j++) {
      if (p.celdas[j].fuera || !pareja(p.celdas[i].v, p.celdas[j].v)) continue;
      const c = linea(i, j, libre);
      if (c) out.push({ i, j, largo: c.medio.length });
    }
  }
  return out.sort((a, b) => a.largo - b.largo);
}

export const quedan = p => p.celdas.filter(c => !c.fuera).length;
/** Cuánto se tachó, de todo lo que hubo en el tablero (lo agregado con ➕ también cuenta). */
export const avance = p => (p.total ? (p.total - quedan(p)) / p.total : 0);

/**
 * El puntaje, sobre 100: limpiar el tablero vale 70 y cada ➕ que sobra 10; si no se limpia (al
 * rendirse o al trabarse sin ➕), vale la parte tachada de los 70. Cada ayuda resta 10.
 */
export function puntaje(p) {
  const base = p.celdas.length === 0 ? PUNTOS_LIMPIO + p.mas * PUNTOS_MAS : Math.round(PUNTOS_LIMPIO * avance(p));
  return Math.max(0, base - RESTA_AYUDA * p.ayudas);
}

/** La tarjeta para compartir: los ➕ usados y si quedó limpio, sin delatar el tablero. */
export function tarjeta(p) {
  const usados = MAS - p.mas;
  const signos = '➕'.repeat(usados) + '⬜'.repeat(p.mas);
  const fin = p.celdas.length === 0 ? '✨ Tablero limpio' : `🧹 ${Math.round(100 * avance(p))} % estallado`;
  return [fin, `${signos} ${usados} de ${MAS} ➕`, p.ayudas ? `💡 ${p.ayudas}` : null].filter(Boolean).join('\n');
}
