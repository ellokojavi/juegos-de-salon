/**
 * 🧶 Desenredo — motor puro. El Untangle de Simon Tatham (que viene de Planarity, de John
 * Tantalo): nudos unidos por hilos que se cruzan, y hay que arrastrar los nudos hasta que ningún
 * hilo cruce a otro. Siempre tiene solución, porque el dibujo se arma primero sin cruces y
 * después se desordena; pero no una sola: cualquier dibujo sin cruces sirve.
 *
 * Todo en enteros sobre un tablero de 1000 × 1000: las posiciones se guardan redondeadas y el
 * cruce de dos hilos se decide con productos cruzados exactos, igual en cualquier navegador.
 *
 * Se juega por niveles contra el reloj, como Zip (D-103, D-179): diez niveles, cada uno con más
 * nudos que el anterior. Todos ven los mismos.
 */
import { azar } from './semilla.js';

export const LADO = 1000;
/** Lo más cerca del borde que puede quedar un nudo. */
export const MARGEN = 40;
/**
 * Un hilo que pasa a menos de esto del centro de un nudo que no es suyo cuenta como cruce: en
 * pantalla se ve pasando por encima del nudo. Cierra también la trampa de amontonar los nudos.
 */
export const CERCA = 24;
/** Al generar, la holgura es mayor: el dibujo resuelto tiene que verse limpio, no al filo. */
const HOLGURA = 70;

/* ------------------------------------------------------------------ */
/* Geometría                                                           */
/* ------------------------------------------------------------------ */

const orient = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
const entre = (a, b, c) => Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);

/** ¿Se tocan los segmentos ab y cd? Cuenta también tocarse en un punto o encimarse. */
export function seCruzan(a, b, c, d) {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && entre(a, b, c)) || (o2 === 0 && entre(a, b, d)) || (o3 === 0 && entre(c, d, a)) || (o4 === 0 && entre(c, d, b));
}

/** La distancia del punto p al segmento ab. */
export function distancia(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/**
 * Los cruces de un dibujo: pares de hilos sin nudo en común que se tocan, y nudos con un hilo
 * ajeno encima. `hilos` son pares de índices y `pos` la posición de cada nudo.
 */
export function cruces(hilos, pos) {
  const pares = [], encima = [];
  for (let i = 0; i < hilos.length; i++) {
    const [a, b] = hilos[i];
    for (let j = i + 1; j < hilos.length; j++) {
      const [c, d] = hilos[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (seCruzan(pos[a], pos[b], pos[c], pos[d])) pares.push([i, j]);
    }
    for (let v = 0; v < pos.length; v++) {
      if (v === a || v === b) continue;
      if (distancia(pos[v], pos[a], pos[b]) < CERCA) encima.push([v, i]);
    }
  }
  return { pares, encima, total: pares.length + encima.length };
}

/** Un nudo siempre adentro del tablero, en enteros. */
export const dentro = ([x, y]) => [
  Math.max(MARGEN, Math.min(LADO - MARGEN, Math.round(x))),
  Math.max(MARGEN, Math.min(LADO - MARGEN, Math.round(y))),
];

/* ------------------------------------------------------------------ */
/* La cuerda (D-182)                                                   */
/* ------------------------------------------------------------------ */

/**
 * Cuánto se curva un hilo, como fracción de su largo, y lo más que se aparta de la recta. Es una
 * curva leve y solo de dibujo: los cruces se siguen decidiendo sobre la recta (`cruces`), así que
 * tiene que ser lo bastante chica para que lo que se ve y lo que se cuenta no se contradigan.
 */
export const ONDA = 0.06;
export const ONDA_MAX = 34;

/** Un entero de 32 bits revuelto: la forma de cada hilo sale de sus dos nudos, igual en cada redibujo. */
const revolver = n => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; };

/**
 * Los dos puntos de control de la curva de Bézier de un hilo entre `a` y `b`. Cada hilo tiene su
 * forma, fija mientras no cambien sus nudos de identidad: unos en S suave y otros en arco, como una
 * cuerda que no está del todo tensa. La curva sigue al hilo cuando se mueven los nudos.
 */
export function cuerda(a, b, semilla, { onda = ONDA, tope = ONDA_MAX } = {}) {
  const h = revolver(semilla + 1);
  const dx = b[0] - a[0], dy = b[1] - a[1], largo = Math.hypot(dx, dy) || 1;
  const nx = -dy / largo, ny = dx / largo;
  const k = Math.min(tope, onda * largo) * (h & 1 ? 1 : -1);
  const f1 = 0.6 + 0.4 * ((h >>> 2) & 255) / 255, f2 = 0.6 + 0.4 * ((h >>> 10) & 255) / 255;
  const ese = (h >>> 1) & 1;                     // 1: en S; 0: en arco
  const o1 = k * f1, o2 = (ese ? -1 : 1) * k * f2;
  return [[a[0] + dx / 3 + nx * o1, a[1] + dy / 3 + ny * o1], [a[0] + 2 * dx / 3 + nx * o2, a[1] + 2 * dy / 3 + ny * o2]];
}

/**
 * La segunda onda (D-183): sobre la curva leve, una ondulación más corta y más baja, como la que
 * deja la torsión de una cuerda. Va de 2 a 4 vueltas según el largo, con su fase propia, y se
 * apaga en las puntas (envolvente seno) para que el hilo siga naciendo en el centro del nudo.
 */
export const ONDA2 = 0.016;
export const ONDA2_MAX = 8;
const VUELTA = 150;   // cuánto mide, en unidades del tablero, una vuelta de la segunda onda

/** Los puntos de una cuerda: la curva leve con la segunda onda encima, de `a` a `b`. */
export function puntosCuerda(a, b, semilla, { onda = ONDA, tope = ONDA_MAX, onda2 = ONDA2, tope2 = ONDA2_MAX } = {}) {
  const [c1, c2] = cuerda(a, b, semilla, { onda, tope });
  const h = revolver(semilla * 7 + 3);
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const vueltas = Math.max(2, Math.min(4, Math.round(largo / VUELTA)));
  const fase = (h & 1023) / 1023 * 2 * Math.PI;
  const alto = Math.min(tope2, onda2 * largo);
  const n = Math.max(10, Math.min(48, Math.round(largo / 18)));
  const bez = t => { const u = 1 - t; return [0, 1].map(k => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k]); };
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = bez(t);
    // La normal de la curva en ese punto, por diferencia
    const q = bez(Math.min(1, t + 0.01)), o = bez(Math.max(0, t - 0.01));
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
    const d = alto * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * vueltas * t + fase);
    out.push([p[0] - (dy / l) * d, p[1] + (dx / l) * d]);
  }
  return out;
}

/** El trazo SVG de un hilo como cuerda: los puntos unidos con curvas suaves (Catmull-Rom). */
export function trazoCuerda(a, b, semilla, opciones) {
  const P = puntosCuerda(a, b, semilla, opciones);
  const r = x => Math.round(x * 10) / 10;
  let d = `M${r(P[0][0])} ${r(P[0][1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* Generador                                                           */
/* ------------------------------------------------------------------ */

/** Nudos al azar, bien repartidos: cada uno a una distancia mínima de los demás. */
function nudosAlAzar(a, n) {
  const lejos = Math.floor(0.62 * LADO / Math.sqrt(n));
  const borde = 90;
  for (let intento = 0; intento < 60; intento++) {
    const pos = [];
    for (let k = 0; k < 4000 && pos.length < n; k++) {
      const p = [borde + a.entero(LADO - 2 * borde), borde + a.entero(LADO - 2 * borde)];
      if (pos.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) >= lejos)) pos.push(p);
    }
    if (pos.length === n) return pos;
  }
  throw new Error('sin nudos');
}

/**
 * Los hilos: de los pares más cercanos a los más lejanos (con algo de azar en el orden), cada uno
 * entra si no cruza a los que ya están, no pasa cerca de otro nudo y ninguno de sus dos nudos
 * tiene ya `grado` hilos. Sale un dibujo casi todo de triángulos, que es lo que lo hace difícil.
 */
function hilosSinCruces(a, pos, grado) {
  const n = pos.length, cand = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    cand.push({ i, j, peso: Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]) * (0.75 + 0.5 * a.real()) });
  }
  cand.sort((x, y) => x.peso - y.peso);
  const hilos = [], deg = new Array(n).fill(0);
  for (const { i, j } of cand) {
    if (deg[i] >= grado || deg[j] >= grado) continue;
    if (hilos.some(([c, d]) => c !== i && c !== j && d !== i && d !== j && seCruzan(pos[i], pos[j], pos[c], pos[d]))) continue;
    if (pos.some((p, v) => v !== i && v !== j && distancia(p, pos[i], pos[j]) < HOLGURA)) continue;
    hilos.push([i, j]); deg[i]++; deg[j]++;
  }
  return { hilos, deg };
}

/** Los nudos repartidos en un círculo, en desorden: la posición de partida de Planarity. */
function enCirculo(a, n) {
  const orden = a.barajar([...Array(n).keys()]);
  const r = LADO / 2 - MARGEN - 30;
  const pos = new Array(n);
  orden.forEach((v, k) => {
    const ang = (2 * Math.PI * k) / n - Math.PI / 2;
    pos[v] = [Math.round(LADO / 2 + r * Math.cos(ang)), Math.round(LADO / 2 + r * Math.sin(ang))];
  });
  return pos;
}

/**
 * Un tablero de `n` nudos: `{ n, hilos, inicio, sol }`. `sol` es el dibujo sin cruces del que
 * salió (una de las soluciones) e `inicio`, el desorden con que se empieza.
 */
export function generar(codigo, dia, { n = 8, sal = 'desenredo', grado = 4 } = {}) {
  const a = azar(codigo, dia, sal);
  for (let intento = 0; ; intento++) {
    const sol = nudosAlAzar(a, n);
    const { hilos, deg } = hilosSinCruces(a, sol, grado);
    // Un nudo con un solo hilo se acomoda solo: no aporta nada
    if (deg.some(g => g < 2) && intento < 40) continue;
    // El desorden tiene que dar trabajo: se busca uno con cruces de sobra
    const minimo = Math.ceil(hilos.length * 0.6);
    let inicio = null, mejor = -1;
    for (let k = 0; k < 40; k++) {
      const pos = enCirculo(a, n);
      const t = cruces(hilos, pos).total;
      if (t > mejor) { mejor = t; inicio = pos; }
      if (t >= minimo) break;
    }
    return { n, hilos, inicio, sol };
  }
}

/** ¿Está resuelto ese dibujo? */
export const resuelto = (p, pos) => cruces(p.hilos, pos).total === 0;

/* ------------------------------------------------------------------ */
/* Niveles contra el reloj (D-103, D-179)                              */
/* ------------------------------------------------------------------ */

export const TIEMPO_MS = 4 * 60 * 1000;
/** Los nudos de cada nivel: diez niveles, cada uno con uno más que el anterior. */
export const NUDOS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export const NIVELES = NUDOS.length;

/** El nivel `k` (desde 0) de ese día: el mismo para todos. */
const hechos = new Map();
export function nivel(codigo, dia, k) {
  const clave = `${codigo}:${dia}:${k}`;
  if (!hechos.has(clave)) { if (hechos.size > 30) hechos.clear(); hechos.set(clave, generar(codigo, dia, { n: NUDOS[k], sal: `desenredo-${k}` })); }
  return hechos.get(clave);
}

/**
 * La partida por niveles: `{ hechos, pos, usado, ultimo }` —niveles resueltos, cómo están los
 * nudos del nivel en curso (`null` si todavía no se mueve ninguno), el tiempo activo gastado y en
 * qué momento se resolvió el último nivel—.
 */
export const partidaNueva = () => ({ hechos: 0, pos: null, usado: 0, ultimo: 0 });
/** Se acaba con el tiempo, o antes si se resolvieron los diez. */
export const finPartida = (j, tiempo = TIEMPO_MS) => j.usado >= tiempo || j.hechos >= NIVELES;

/** De 0 a 100 (D-113): 10 por nivel resuelto. */
export const PUNTOS_NIVEL = 10;
export const puntaje = j => Math.min(100, PUNTOS_NIVEL * (j.hechos || 0));
export const tarjeta = j => `🧶 ${'🟩'.repeat(j.hechos || 0)}${j.hechos ? '' : '⬛'}`;
