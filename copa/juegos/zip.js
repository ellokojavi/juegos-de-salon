/**
 * 〰️ Zip — motor puro. El Zip de LinkedIn: un solo trazo que parte en el 1, pasa por todas las
 * casillas una sola vez y toca los números en orden, terminando en el último. La solución es
 * única: el generador suma números sobre un camino al azar hasta que el resolvedor encuentra
 * uno solo.
 *
 * Se juega por niveles contra el reloj (D-103): tres minutos para resolver la mayor cantidad de
 * tableros, cada uno igual o más grande que el anterior. Todos ven los mismos niveles.
 */
import { azar } from './semilla.js';

const vecinos = (n, i) => {
  const r = Math.floor(i / n), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
};
export const adyacentes = (n, a, b) => vecinos(n, a).includes(b);

/** Un camino que pasa por todas las casillas (Warnsdorff al azar: siempre hacia la vecina con menos salidas). */
function caminoAlAzar(a, n) {
  for (let intento = 0; intento < 200; intento++) {
    const visto = new Uint8Array(n * n);
    let i = a.entero(n * n);
    const camino = [i]; visto[i] = 1;
    while (camino.length < n * n) {
      const libres = vecinos(n, i).filter(j => !visto[j]);
      if (!libres.length) break;
      const grado = j => vecinos(n, j).filter(k => !visto[k] && k !== j).length;
      const minimo = Math.min(...libres.map(grado));
      const mejores = libres.filter(j => grado(j) === minimo);
      i = mejores[a.entero(mejores.length)];
      camino.push(i); visto[i] = 1;
    }
    if (camino.length === n * n) return camino;
  }
  throw new Error('sin camino');
}

/**
 * Cuenta caminos válidos hasta `tope`. `numeros` es { casilla: número }. Se poda cuando las
 * casillas libres quedan partidas en dos (no se podrían recorrer todas).
 */
export function resolver({ n, numeros }, tope = 2) {
  const porNumero = {};
  for (const [i, k] of Object.entries(numeros)) porNumero[k] = Number(i);
  const ultimo = Math.max(...Object.values(numeros));
  const inicio = porNumero[1];
  const visto = new Uint8Array(n * n);
  let cuantas = 0;
  const conexo = (desde, libres) => {
    // ¿Las libres son alcanzables desde la cabeza del camino?
    const pila = [desde], ok = new Uint8Array(n * n); ok[desde] = 1;
    let vistas = 0;
    while (pila.length) {
      const x = pila.pop();
      for (const y of vecinos(n, x)) if (!visto[y] && !ok[y]) { ok[y] = 1; vistas++; pila.push(y); }
    }
    return vistas === libres;
  };
  const paso = (i, largo, siguiente) => {
    if (cuantas >= tope) return;
    if (largo === n * n) { if (siguiente > ultimo) cuantas++; return; }
    if (siguiente > ultimo) return;   // el último número cierra el trazo: no se sigue después
    if (!conexo(i, n * n - largo)) return;
    for (const j of vecinos(n, i)) {
      if (visto[j]) continue;
      const k = numeros[j];
      if (k !== undefined && k !== siguiente) continue;
      visto[j] = 1;
      paso(j, largo + 1, k !== undefined ? siguiente + 1 : siguiente);
      visto[j] = 0;
    }
  };
  visto[inicio] = 1;
  paso(inicio, 1, 2);
  return cuantas;
}

export function generar(codigo, dia, { n = 6, sal = 'zip' } = {}) {
  const a = azar(codigo, dia, sal);
  const camino = caminoAlAzar(a, n);
  // Siempre el principio y el final; en el medio, se suman en orden hasta que sea único
  const posiciones = [0, camino.length - 1];
  const medio = a.barajar([...Array(camino.length - 2).keys()].map(x => x + 1));
  const numerar = () => {
    const orden = [...new Set(posiciones)].sort((x, y) => x - y);
    return Object.fromEntries(orden.map((pos, k) => [camino[pos], k + 1]));
  };
  let numeros = numerar();
  for (const pos of medio) {
    if (resolver({ n, numeros }) === 1) break;
    posiciones.push(pos);
    numeros = numerar();
  }
  // Se sacan los que sobran: con menos números hay más que deducir y el trazo no se dibuja solo
  for (const pos of a.barajar(posiciones.filter(x => x !== 0 && x !== camino.length - 1))) {
    posiciones.splice(posiciones.indexOf(pos), 1);
    numeros = numerar();
    if (resolver({ n, numeros }) !== 1) { posiciones.push(pos); numeros = numerar(); }
  }
  return { n, numeros, sol: camino };
}

/**
 * El estado a partir del trazo actual (la lista de casillas, desde el 1). Un trazo es válido
 * mientras cada paso sea a una vecina libre y los números aparezcan en orden.
 */
export function valido(p, trazo) {
  if (!trazo.length || p.numeros[trazo[0]] !== 1) return false;
  let siguiente = 2;
  const ultimo = ultimoNumero(p);
  const visto = new Set([trazo[0]]);
  for (let k = 1; k < trazo.length; k++) {
    const i = trazo[k];
    // El último número cierra el trazo: después de él no se sigue
    if (siguiente > ultimo) return false;
    if (visto.has(i) || !adyacentes(p.n, trazo[k - 1], i)) return false;
    const num = p.numeros[i];
    if (num !== undefined) { if (num !== siguiente) return false; siguiente++; }
    visto.add(i);
  }
  return true;
}

export const ultimoNumero = p => Math.max(...Object.values(p.numeros));

/** ¿Se puede extender el trazo hasta `i`? */
export function puedeIr(p, trazo, i) {
  return valido(p, [...trazo, i]);
}

export function estado(p, trazo) {
  const t = valido(p, trazo) ? trazo : [];
  const enElUltimo = t.length > 0 && p.numeros[t[t.length - 1]] === ultimoNumero(p);
  const fin = enElUltimo && t.length === p.n * p.n;
  // Llegar al último número sin pasar por todas: el aviso que faltaba (el trazo no terminaba y no decía por qué)
  return { trazo: t, fin, faltan: enElUltimo && !fin ? p.n * p.n - t.length : 0 };
}

/* ------------------------------------------------------------------ */
/* Niveles contra el reloj (D-103)                                     */
/* ------------------------------------------------------------------ */

export const TIEMPO_MS = 3 * 60 * 1000;
/** El tamaño de cada nivel: empiezan chicos y crecen. Pasado el último, se repite el 7 × 7. */
export const TAMANOS = [4, 4, 5, 5, 5, 6, 6, 6, 6, 7];
export const tamanoDe = k => TAMANOS[Math.min(k, TAMANOS.length - 1)];

/** El nivel `k` (desde 0) de ese día: el mismo para todos. Se guarda el último armado: el siguiente se prepara antes de llegar. */
const hechos = new Map();
export function nivel(codigo, dia, k) {
  const clave = `${codigo}:${dia}:${k}`;
  if (!hechos.has(clave)) { if (hechos.size > 20) hechos.clear(); hechos.set(clave, generar(codigo, dia, { n: tamanoDe(k), sal: `zip-${k}` })); }
  return hechos.get(clave);
}

/**
 * La partida por niveles: `{ hechos, trazo, usado, ultimo }` —niveles resueltos, el trazo del
 * nivel en curso, el tiempo activo gastado y en qué momento se resolvió el último nivel—.
 * El puntaje son los niveles resueltos; el desempate, cuánto se tardó en llegar al último.
 */
export const partidaNueva = () => ({ hechos: 0, trazo: [], usado: 0, ultimo: 0 });
export const finPartida = j => j.usado >= TIEMPO_MS;

/**
 * El puntaje de Zip son los niveles resueltos en los tres minutos.
 */
/** De 0 a 100 (D-113): 10 por nivel resuelto, hasta 100. */
export const PUNTOS_NIVEL = 10;
export const puntaje = j => Math.min(100, PUNTOS_NIVEL * (j.hechos || 0));
export const tarjeta = j => `〰️ ${'🟩'.repeat(j.hechos || 0)}${j.hechos ? '' : '⬛'}`;
