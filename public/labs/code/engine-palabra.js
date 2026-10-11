/**
 * La clave con palabra — el motor (D-270). Una palabra de 5 letras dibujada con catorce segmentos
 * (como las calculadoras viejas) y repartida entre una base fija y 4 cartas de **dos caras**. Cada
 * carta tiene una cara con trazos de la palabra y otra con trazos que despistan; voltearla muestra
 * la otra cara, y girarla le da media vuelta. Hay que encontrar, para cada carta, la cara y el giro.
 *
 * Con la palabra, leer a medias ya ayuda ("LL_VE" es LLAVE) y se puede arriesgar antes de terminar.
 * Con las dos caras, mirar una carta no dice qué trazos tiene la otra: hay que voltearla. Un trazo
 * encima de otro no vale, como en la de cifras. Sin DOM: lo prueba engine-palabra.test.mjs.
 */
import { PALABRAS } from '../../cup/games/word/palabras.js';

export const LETRAS_PALABRA = 5;
export const CARTAS_PALABRA = 4;

/**
 * Los catorce segmentos: T arriba, TR arriba a la derecha, BR abajo a la derecha, B abajo, BL abajo a
 * la izquierda, TL arriba a la izquierda, ML y MR el medio (mitad izquierda y derecha), VT y VB la
 * vertical del centro (arriba y abajo), y las diagonales del centro a cada esquina: DTL, DTR, DBL, DBR.
 */
export const SEGS = ['T', 'TR', 'BR', 'B', 'BL', 'TL', 'ML', 'MR', 'VT', 'VB', 'DTL', 'DTR', 'DBL', 'DBR'];
export const LETRAS = {
  A: 'T TR BR TL BL ML MR', B: 'T TR BR B VT VB MR', C: 'T TL BL B', D: 'T TR BR B VT VB', E: 'T TL BL B ML',
  F: 'T TL BL ML', G: 'T TL BL B BR MR', H: 'TL BL TR BR ML MR', I: 'T B VT VB', J: 'TR BR B BL',
  K: 'TL BL ML DTR DBR', L: 'TL BL B', M: 'TL BL TR BR DTL DTR', N: 'TL BL TR BR DTL DBR', O: 'T TR BR B BL TL',
  P: 'T TR TL BL ML MR', Q: 'T TR BR B BL TL DBR', R: 'T TR TL BL ML MR DBR', S: 'T TL ML MR BR B', T: 'T VT VB',
  U: 'TL BL B BR TR', V: 'TL BL DBL DTR', W: 'TL BL TR BR DBL DBR', X: 'DTL DTR DBL DBR', Y: 'DTL DTR VB', Z: 'T DTR DBL B',
};
const bit = s => 1 << SEGS.indexOf(s);
const MASCARA = Object.fromEntries(Object.entries(LETRAS).map(([l, v]) => [v.split(' ').reduce((m, s) => m | bit(s), 0), l]));
/** La letra que dibujan esos segmentos, o null. */
export const letraDe = m => MASCARA[m] ?? null;

/** Las palabras que se pueden dibujar: las de Toque y Fama: Palabra sin Ñ. */
export const PALABRAS_CLAVE = PALABRAS.filter(p => /^[A-Z]{5}$/.test(p));

/** Media vuelta: la letra i pasa a la del otro extremo y cada segmento a su opuesto. */
const OPUESTO = { T: 'B', B: 'T', TR: 'BL', BL: 'TR', BR: 'TL', TL: 'BR', ML: 'MR', MR: 'ML', VT: 'VB', VB: 'VT', DTL: 'DBR', DBR: 'DTL', DTR: 'DBL', DBL: 'DTR' };
export const girar = ({ i, s }) => ({ i: LETRAS_PALABRA - 1 - i, s: OPUESTO[s] });
/** Un trazo visto con la carta girada (`r` true) o no. */
export const ver = (r, x) => (r ? girar(x) : x);

/** Los estados de una carta: la cara (0 o 1) y si está girada. */
export const ESTADOS = [[0, false], [0, true], [1, false], [1, true]];
/** Los trazos que se ven de una carta en un estado. */
export const visibles = (carta, [cara, r]) => carta.caras[cara].map(x => ver(r, x));

const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const mascaras = segs => { const m = new Array(LETRAS_PALABRA).fill(0); for (const { i, s } of segs) m[i] |= bit(s); return m; };

/**
 * Las palabras que se pueden leer con todas las cartas puestas en algún estado, sin trazos uno
 * encima de otro. Una clave buena tiene una sola: la suya.
 */
export function lecturas(clave) {
  const opciones = clave.cartas.map(c => ESTADOS.map(e => mascaras(visibles(c, e))));
  const out = new Set();
  const ir = (k, m) => {
    if (k === opciones.length) {
      const l = m.map(letraDe);
      if (l.every(x => x !== null)) out.add(l.join(''));
      return;
    }
    for (const op of opciones[k]) if (m.every((x, i) => !(x & op[i]))) ir(k + 1, m.map((x, i) => x | op[i]));
  };
  ir(0, mascaras(clave.base));
  return out;
}

/**
 * Arma una clave: la palabra, los trazos de la base y, de cada carta, sus dos caras tal como se ven
 * sin girar (`caras`) y el estado que la arregla (`bien`: [cara, girada]). La cara buena tiene los
 * trazos de la palabra (girados si hay que girarla); la otra, trazos que despistan: algunos de la
 * palabra en otro lugar y otros sueltos, para que se vea como una cara posible.
 */
export function generar(r = Math.random, { palabra: fija = null } = {}) {
  for (let intento = 0; intento < 600; intento++) {
    const palabra = fija || PALABRAS_CLAVE[Math.floor(r() * PALABRAS_CLAVE.length)];
    const trazos = barajar([...palabra].flatMap((l, i) => LETRAS[l].split(' ').map(s => ({ i, s }))), r);
    const enBase = Math.max(3, Math.round(trazos.length / 6));
    const base = trazos.slice(0, enBase), resto = trazos.slice(enBase);
    const pilas = Array.from({ length: CARTAS_PALABRA }, () => []);
    resto.forEach((x, k) => pilas[k % CARTAS_PALABRA].push(x));
    const cartas = pilas.map(bien => {
      const cara = Math.floor(r() * 2), girada = r() < 0.5;
      // La cara que despista: tantos trazos como la buena, de las letras de la palabra en otras
      // posiciones y algunos al azar, sin repetir
      const vistos = new Set();
      const otra = [];
      while (otra.length < bien.length) {
        const x = r() < 0.6
          ? (() => { const i = Math.floor(r() * LETRAS_PALABRA); const s = LETRAS[palabra[Math.floor(r() * LETRAS_PALABRA)]].split(' '); return { i, s: s[Math.floor(r() * s.length)] }; })()
          : { i: Math.floor(r() * LETRAS_PALABRA), s: SEGS[Math.floor(r() * SEGS.length)] };
        const k = `${x.i}${x.s}`;
        if (!vistos.has(k)) { vistos.add(k); otra.push(x); }
      }
      const caras = [];
      caras[cara] = bien.map(x => ver(girada, x));
      caras[1 - cara] = otra;
      return { caras, bien: [cara, girada] };
    });
    const clave = { palabra, base, cartas };
    const leidas = lecturas(clave);
    if (leidas.size === 1 && leidas.has(palabra)) return clave;
  }
  throw new Error('no se pudo armar una clave con una sola lectura');
}

/** Lo que se ve con esas cartas puestas y en esos estados: los segmentos de cada letra. */
export function juntos(clave, estados, puestas = clave.cartas.map(() => true)) {
  const out = Array.from({ length: LETRAS_PALABRA }, () => new Set());
  for (const x of clave.base) out[x.i].add(x.s);
  clave.cartas.forEach((c, k) => { if (puestas[k]) for (const x of visibles(c, estados[k])) out[x.i].add(x.s); });
  return out;
}
export const leer = segs => letraDe([...segs].reduce((m, s) => m | bit(s), 0));

/** Los trazos uno encima de otro, con las capas que los pisan ('base' o el número de carta). */
export function choques(clave, estados, puestas = clave.cartas.map(() => true)) {
  const vistos = new Map();
  const anotar = (capa, { i, s }) => { const k = `${i}:${s}`; vistos.set(k, [...(vistos.get(k) || []), capa]); };
  clave.base.forEach(x => anotar('base', x));
  clave.cartas.forEach((c, k) => { if (puestas[k]) visibles(c, estados[k]).forEach(x => anotar(k, x)); });
  return [...vistos].filter(([, capas]) => capas.length > 1).map(([k, capas]) => { const [i, s] = k.split(':'); return { i: Number(i), s, capas }; });
}
