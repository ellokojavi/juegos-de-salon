/**
 * El caso — prototipo de laboratorio (D-256), al estilo de *Clues by Sam*. Reglas puras, sin DOM.
 *
 * Veinte sospechosos en una grilla de 4 columnas por 5 filas. Cada uno es inocente o criminal. Al
 * empezar se sabe qué es uno y lo que dice; cada vez que el jugador marca bien a alguien, ese
 * alguien da su pista. **Las pistas son siempre verdad, y nunca hay que adivinar**: el generador
 * arma las pistas de modo que, en cada momento, al menos una persona más se pueda deducir con lo
 * que ya se sabe. Marcar a alguien que todavía no se puede deducir no se acepta (no da error,
 * pero tampoco dice nada).
 *
 * Todo sale de una semilla de texto: el mismo código arma el mismo caso en cualquier celular.
 */
import { hash32 } from '../../cup/games/semilla.js';
import { rng as mulberry } from '../../timeline/engine.js';

export const COLS = 4;
export const FILAS = 5;
export const N = COLS * FILAS;
export const LETRAS_COL = ['A', 'B', 'C', 'D'];

/** Los nombres van en orden alfabético por la grilla, como en el original: uno por letra. */
const NOMBRES = [
  ['Ana', 'Andrés', 'Antonia', 'Agustín'], ['Beto', 'Bárbara', 'Benja', 'Belén'], ['Cata', 'Camilo', 'Coni', 'Cristián'],
  ['Diego', 'Daniela', 'Dani', 'Dominga'], ['Ema', 'Esteban', 'Elisa', 'Eduardo'], ['Fran', 'Felipe', 'Fernanda', 'Flo'],
  ['Gabo', 'Gaby', 'Gonzalo', 'Gloria'], ['Hugo', 'Helena', 'Héctor', 'Hilda'], ['Isi', 'Ignacio', 'Isabel', 'Iván'],
  ['Javi', 'Josefa', 'Joaquín', 'Julia'], ['Kari', 'Kevin', 'Karen', 'Koke'], ['Lalo', 'Lucía', 'Lucho', 'Laura'],
  ['Maca', 'Matías', 'Mauro', 'Marta'], ['Nico', 'Nati', 'Nacho', 'Nora'], ['Olga', 'Óscar', 'Olivia', 'Omar'],
  ['Pato', 'Pía', 'Pablo', 'Paula'], ['Quique', 'Quena', 'Quintín', 'Queti'], ['Rocío', 'Raúl', 'Rosa', 'Rodrigo'],
  ['Seba', 'Sofía', 'Simón', 'Sara'], ['Tere', 'Tomás', 'Tati', 'Tito'],
];

/** Oficios que no cambian con el género: "la dentista", "el dentista", "los dentistas". */
export const OFICIOS = [
  { id: 'chef', emoji: '🧑‍🍳', uno: 'chef', varios: 'chefs' },
  { id: 'guardia', emoji: '💂', uno: 'guardia', varios: 'guardias' },
  { id: 'artista', emoji: '🎨', uno: 'artista', varios: 'artistas' },
  { id: 'dentista', emoji: '🦷', uno: 'dentista', varios: 'dentistas' },
  { id: 'periodista', emoji: '📰', uno: 'periodista', varios: 'periodistas' },
  { id: 'piloto', emoji: '✈️', uno: 'piloto', varios: 'pilotos' },
  { id: 'taxista', emoji: '🚕', uno: 'taxista', varios: 'taxistas' },
  { id: 'pianista', emoji: '🎹', uno: 'pianista', varios: 'pianistas' },
  { id: 'electricista', emoji: '🔌', uno: 'electricista', varios: 'electricistas' },
  { id: 'astronauta', emoji: '🧑‍🚀', uno: 'astronauta', varios: 'astronautas' },
];

export const fila = i => Math.floor(i / COLS);
export const col = i => i % COLS;
export const celda = (f, c) => f * COLS + c;
/** "B3": la columna con letra y la fila con número, como en la grilla. */
export const coord = i => `${LETRAS_COL[col(i)]}${fila(i) + 1}`;

const todas = Array.from({ length: N }, (_, i) => i);
export const vecinos = i => todas.filter(j => j !== i && Math.abs(fila(j) - fila(i)) <= 1 && Math.abs(col(j) - col(i)) <= 1);

/* ------------------------------------------------------------------ */
/* Conjuntos de personas y pistas                                      */
/* ------------------------------------------------------------------ */

/**
 * Los grupos de los que hablan las pistas. Cada uno: `ids` (las celdas), `en` (cómo se dice en
 * "Hay 2 criminales …": "en la fila 2", "entre los vecinos de Ana") y `todos` (el sujeto de "… son
 * criminales": "Todos los de la fila 2"). `de` es la persona de la que se habla, si el grupo es
 * suyo; cuando la pista la dice esa misma persona (`quien`), habla en primera persona: "entre mis
 * vecinos", "a mi izquierda".
 */
function grupos(caso, quien) {
  const { nombres, oficios, oficioDe } = caso;
  const gs = [];
  for (let f = 0; f < FILAS; f++) gs.push({ ids: todas.filter(i => fila(i) === f), en: `en la fila ${f + 1}`, todos: `Todos los de la fila ${f + 1}` });
  for (let c = 0; c < COLS; c++) gs.push({ ids: todas.filter(i => col(i) === c), en: `en la columna ${LETRAS_COL[c]}`, todos: `Todos los de la columna ${LETRAS_COL[c]}` });
  for (const o of oficios) gs.push({ ids: todas.filter(i => oficioDe[i] === o.id), en: `entre los ${o.varios}`, todos: `Todos los ${o.varios}` });
  gs.push({ ids: todas.filter(i => fila(i) === 0 || fila(i) === FILAS - 1 || col(i) === 0 || col(i) === COLS - 1), en: 'en el borde', todos: 'Todos los del borde' });
  gs.push({ ids: [0, COLS - 1, N - COLS, N - 1], en: 'en las esquinas', todos: 'Todos los de las esquinas' });
  for (const i of todas) {
    const yo = i === quien, n = nombres[i];
    const de = yo ? 'de mí' : `de ${n}`;
    gs.push({ ids: vecinos(i), en: yo ? 'entre mis vecinos' : `entre los vecinos de ${n}`, todos: yo ? 'Todos mis vecinos' : `Todos los vecinos de ${n}`, de: i });
    gs.push({ ids: todas.filter(j => col(j) === col(i) && fila(j) < fila(i)), en: `arriba ${de}`, todos: `Todos los que están arriba ${de}`, de: i });
    gs.push({ ids: todas.filter(j => col(j) === col(i) && fila(j) > fila(i)), en: `abajo ${de}`, todos: `Todos los que están abajo ${de}`, de: i });
    gs.push({ ids: todas.filter(j => fila(j) === fila(i) && col(j) < col(i)), en: yo ? 'a mi izquierda' : `a la izquierda de ${n}`, todos: yo ? 'Todos los que están a mi izquierda' : `Todos los que están a la izquierda de ${n}`, de: i });
    gs.push({ ids: todas.filter(j => fila(j) === fila(i) && col(j) > col(i)), en: yo ? 'a mi derecha' : `a la derecha de ${n}`, todos: yo ? 'Todos los que están a mi derecha' : `Todos los que están a la derecha de ${n}`, de: i });
  }
  return gs.filter(g => g.ids.length >= 2);
}

const cuenta = (ids, v) => ids.reduce((s, i) => s + (v[i] === 1 ? 1 : 0), 0);
const plural = (k, uno, varios) => (k === 1 ? `un ${uno}` : `${k} ${varios}`);

/**
 * Las pistas posibles que son verdad con la solución `v` (1 criminal, 0 inocente), dichas por
 * `quien` (si se sabe: habla de sí en primera persona). Cada pista es
 * `{ t, a, b?, k?, texto }`: `t` dice qué compara y el solver la entiende sin mirar el texto.
 *   eq   en `a` hay exactamente `k` criminales        ge / le   al menos / a lo más `k`
 *   gt   hay más criminales en `a` que en `b`          igual     la misma cantidad en `a` y en `b`
 *   par / impar   la cantidad de criminales en `a`     es        `a` es una persona y `k` lo que es
 */
export function pistasVerdaderas(caso, v, r, quien) {
  const gs = grupos(caso, quien);
  const out = [];
  for (const g of gs) {
    const c = cuenta(g.ids, v), n = g.ids.length, inoc = n - c;
    if (c === 0) out.push({ t: 'eq', a: g.ids, k: 0, texto: `No hay criminales ${g.en}.` });
    else if (inoc === 0) out.push({ t: 'eq', a: g.ids, k: n, texto: `${g.todos} son criminales.` });
    else {
      out.push({ t: 'eq', a: g.ids, k: c, texto: `Hay exactamente ${plural(c, 'criminal', 'criminales')} ${g.en}.` });
      out.push({ t: 'eq', a: g.ids, k: c, texto: `Hay exactamente ${plural(inoc, 'inocente', 'inocentes')} ${g.en}.` });
    }
    if (c >= 2) out.push({ t: 'ge', a: g.ids, k: c - 1, texto: `Hay al menos ${plural(c - 1, 'criminal', 'criminales')} ${g.en}.` });
    if (c <= n - 2 && c >= 1) out.push({ t: 'le', a: g.ids, k: c + 1, texto: `Hay a lo más ${plural(c + 1, 'criminal', 'criminales')} ${g.en}.` });
    if (n >= 3) out.push({ t: c % 2 ? 'impar' : 'par', a: g.ids, texto: `Hay un número ${c % 2 ? 'impar' : 'par'} de criminales ${g.en}.` });
  }
  // Comparaciones entre dos grupos del mismo tipo (dos filas, dos columnas, dos oficios, los vecinos de dos personas)
  for (let k = 0; k < 60; k++) {
    const a = gs[Math.floor(r() * gs.length)], b = gs[Math.floor(r() * gs.length)];
    if (a === b || (a.de === undefined) !== (b.de === undefined)) continue;
    const ca = cuenta(a.ids, v), cb = cuenta(b.ids, v);
    if (ca > cb) out.push({ t: 'gt', a: a.ids, b: b.ids, texto: `Hay más criminales ${a.en} que ${b.en}.` });
    else if (ca === cb) out.push({ t: 'igual', a: a.ids, b: b.ids, texto: `Hay tantos criminales ${a.en} como ${b.en}.` });
  }
  return out;
}

/** La pista más directa, de respaldo: lo que es otra persona. */
export const pistaDirecta = (caso, v, j) => ({ t: 'es', a: [j], k: v[j], texto: `${caso.nombres[j]} es ${v[j] ? 'criminal' : 'inocente'}.` });

/* ------------------------------------------------------------------ */
/* El solver                                                           */
/* ------------------------------------------------------------------ */

/** Mínimo y máximo de criminales posibles en `ids` con lo asignado hasta ahora. */
function rango(ids, x) {
  let c = 0, u = 0;
  for (const i of ids) { if (x[i] === 1) c++; else if (x[i] === -1) u++; }
  return [c, c + u, u];
}

/** ¿La pista puede seguir siendo verdad? (Exacto si todo está asignado; si no, una cota.) */
function posible(p, x) {
  const [lo, hi, u] = rango(p.a, x);
  switch (p.t) {
    case 'eq': case 'es': return lo <= p.k && p.k <= hi;
    case 'ge': return hi >= p.k;
    case 'le': return lo <= p.k;
    case 'par': return u > 0 || lo % 2 === 0;
    case 'impar': return u > 0 || lo % 2 === 1;
    case 'gt': { const [blo, bhi, bu] = rango(p.b, x); return (u === 0 && bu === 0) ? lo > blo : hi > blo; }
    case 'igual': { const [blo, bhi, bu] = rango(p.b, x); return (u === 0 && bu === 0) ? lo === blo : lo <= bhi && blo <= hi; }
    default: return true;
  }
}

/**
 * Busca una asignación de las celdas sin saber (-1) que cumpla todas las pistas, partiendo de `x`
 * (0, 1 o -1 por celda). Devuelve la asignación o null.
 */
export function resolver(pistas, x) {
  const v = x.slice();
  const libres = todas.filter(i => v[i] === -1);
  // Primero las celdas que más pistas tocan: cortan antes las ramas que no sirven
  const peso = new Array(N).fill(0);
  for (const p of pistas) { for (const i of p.a) peso[i]++; for (const i of p.b || []) peso[i]++; }
  libres.sort((a, b) => peso[b] - peso[a]);
  const toca = Array.from({ length: N }, () => []);
  pistas.forEach(p => { for (const i of new Set([...p.a, ...(p.b || [])])) toca[i].push(p); });
  if (!pistas.every(p => posible(p, v))) return null;
  const ir = k => {
    if (k === libres.length) return true;
    const i = libres[k];
    for (const val of [0, 1]) {
      v[i] = val;
      if (toca[i].every(p => posible(p, v)) && ir(k + 1)) return true;
    }
    v[i] = -1;
    return false;
  };
  return ir(0) ? v : null;
}

/**
 * Las celdas que ya se pueden deducir: las que valen lo mismo en todas las soluciones. Devuelve un
 * mapa celda → valor (solo las que todavía no se sabían).
 */
export function deducibles(pistas, x) {
  const base = resolver(pistas, x);
  if (!base) return null;
  const dudosas = new Set();
  const out = {};
  for (const i of todas) {
    if (x[i] !== -1 || dudosas.has(i)) continue;
    const prueba = x.slice();
    prueba[i] = 1 - base[i];
    const otra = resolver(pistas, prueba);
    if (otra) { for (const j of todas) if (x[j] === -1 && otra[j] !== base[j]) dudosas.add(j); }
    else out[i] = base[i];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* El generador                                                        */
/* ------------------------------------------------------------------ */

const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * Arma el caso de la semilla `semilla`: los nombres, los oficios, quién es criminal (`v`), con quién
 * se parte (`inicio`) y la pista de cada uno (`pistas[i]`). Garantiza que se resuelve sin adivinar:
 * simula al jugador, y si en algún momento nadie más se puede deducir, cambia la última pista
 * repartida por una que destrabe; si no hay, prueba con otra solución.
 */
export function generar(semilla) {
  for (let intento = 0; intento < 40; intento++) {
    const r = mulberry(hash32(`caso:${semilla}:${intento}`));
    const caso = armarCaso(r);
    if (repartir(caso, r)) return { ...caso, semilla };
  }
  throw new Error(`no salió un caso con la semilla ${semilla}`);
}

function armarCaso(r) {
  const nombres = NOMBRES.map(op => op[Math.floor(r() * op.length)]);
  const oficios = barajar(OFICIOS, r).slice(0, 5);
  const oficioDe = barajar(oficios.flatMap(o => [o.id, o.id, o.id, o.id]), r);
  const criminales = 7 + Math.floor(r() * 4);   // de 7 a 10
  const quien = barajar(todas, r).slice(0, criminales);
  const v = todas.map(i => (quien.includes(i) ? 1 : 0));
  return { nombres, oficios, oficioDe, v, inicio: Math.floor(r() * N), pistas: new Array(N).fill(null) };
}

/**
 * Reparte una pista a cada persona en el orden en que el jugador las iría destapando. Elige, entre
 * unas cuantas pistas verdaderas al azar, una que destape pocas personas a la vez (una o dos, para
 * que el caso dure), y nunca una que diga directamente lo que ya se sabe.
 */
function repartir(caso, r) {
  const { v } = caso;
  const x = new Array(N).fill(-1);
  const dadas = [];
  const darPista = (i, necesita) => {
    const candidatas = barajar(pistasVerdaderas(caso, v, r, i), r).slice(0, 14);
    let mejor = null, mejorNota = -Infinity;
    for (const p of candidatas) {
      // Una pista sobre uno mismo no aporta: se sabe lo que es quien habla
      if (p.a.length === 1 && p.a[0] === i) continue;
      const d = deducibles([...dadas, p], x);
      if (!d) continue;
      const nuevas = Object.keys(d).length;
      const nota = necesita
        ? (nuevas === 0 ? -100 : nuevas <= 2 ? 10 - nuevas : 5 - nuevas)
        : (nuevas <= 2 ? 3 : 1 - nuevas) + r();
      if (nota > mejorNota) { mejor = p; mejorNota = nota; }
    }
    if (necesita && (!mejor || mejorNota <= -100)) {
      // De respaldo, decir lo que es alguien que todavía no se sabe
      const sinSaber = todas.filter(j => x[j] === -1 && j !== i);
      if (!sinSaber.length) return false;
      mejor = pistaDirecta(caso, v, sinSaber[Math.floor(r() * sinSaber.length)]);
    }
    if (!mejor) mejor = pistaDirecta(caso, v, todas.find(j => j !== i));
    caso.pistas[i] = mejor;
    dadas.push(mejor);
    return true;
  };

  x[caso.inicio] = v[caso.inicio];
  if (!darPista(caso.inicio, true)) return false;
  let pendientes = [];
  for (let vuelta = 0; vuelta < N * 2; vuelta++) {
    if (x.every(y => y !== -1)) return true;
    const d = deducibles(dadas, x);
    const nuevas = Object.keys(d || {}).map(Number);
    if (!nuevas.length) {
      // Trabado: la última pista que se dio se cambia por una que destrabe
      const ultima = pendientes.at(-1) ?? caso.inicio;
      dadas.splice(dadas.indexOf(caso.pistas[ultima]), 1);
      if (!darPista(ultima, true)) return false;
      continue;
    }
    // El jugador las marca de a una: cada una da su pista al marcarla
    pendientes = [];
    for (const i of nuevas) {
      x[i] = v[i];
      pendientes.push(i);
      if (!darPista(i, false)) return false;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */

/**
 * Lo que se sabe hasta ahora: `x` (-1 sin saber) con las marcas del jugador, y qué se puede marcar.
 * `marcas` es la lista de celdas marcadas, en orden; cada una vale lo que es de verdad.
 */
export function estado(caso, marcas) {
  const x = new Array(N).fill(-1);
  x[caso.inicio] = caso.v[caso.inicio];
  for (const i of marcas) x[i] = caso.v[i];
  const conocidas = todas.filter(i => x[i] !== -1);
  const pistas = conocidas.map(i => caso.pistas[i]).filter(Boolean);
  return { x, conocidas, pistas, terminado: conocidas.length === N };
}

/**
 * Marcar a `i` como `valor` (1 criminal, 0 inocente). Devuelve 'ok' si está bien y se podía deducir,
 * 'error' si está mal (y se podía deducir: eso es una equivocación) o 'falta' si todavía no se puede
 * saber con las pistas que hay (no se cuenta como error y no dice si estaba bien).
 */
export function marcar(caso, marcas, i, valor) {
  const { x, pistas } = estado(caso, marcas);
  if (x[i] !== -1) return 'ya';
  const prueba = x.slice();
  prueba[i] = 1 - caso.v[i];
  if (resolver(pistas, prueba)) return 'falta';
  return valor === caso.v[i] ? 'ok' : 'error';
}

/** La semilla de un día: el mismo caso para todos ese día. */
export const semillaDelDia = fecha => `dia:${fecha}`;
