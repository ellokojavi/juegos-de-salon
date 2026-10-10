/**
 * 🔍 El caso — motor puro (D-256, D-257). Un misterio de deducción al estilo de *Clues by Sam*.
 *
 * Veinte sospechosos en una grilla de 4 columnas por 5 filas; cada uno es inocente o criminal. Se
 * parte sabiendo qué es uno y lo que dice; cada persona que se marca bien da su pista. **Las pistas
 * son siempre verdad y nunca hay que adivinar**: el generador simula al jugador y arma las pistas de
 * modo que, en cada momento, al menos una persona más se pueda deducir con lo que ya se sabe.
 *
 * Las pistas son datos, no frases: `{ t, a, b?, k?, g, h?, inoc? }`, donde `g` y `h` dicen de qué
 * grupo hablan (una fila, los vecinos de alguien…). La frase la arma `texto()` en el idioma de quien
 * juega, con las plantillas de `rules.js` (C-3): el caso es el mismo en todos los idiomas.
 */
import { hash32 } from '../semilla.js';
import { rng as mulberry } from '../../../timeline/engine.js';

export const COLS = 4;
export const FILAS = 5;
export const N = COLS * FILAS;
export const LETRAS_COL = ['A', 'B', 'C', 'D'];
/** Cuánto resta cada error, y el mínimo con el caso resuelto. */
export const COSTO_ERROR = 10;
export const MINIMO = 10;

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

/**
 * Los nombres de mujer: en portugués "criminoso" concuerda con quien es ("Ana é criminosa"). Los
 * que sirven para los dos (Dani, Fran, Isi) se leen como en Chile: Dani es él; Fran e Isi, ellas.
 */
const FEMENINOS = new Set(['Ana', 'Antonia', 'Bárbara', 'Belén', 'Cata', 'Coni', 'Daniela', 'Dominga', 'Ema', 'Elisa',
  'Fran', 'Fernanda', 'Flo', 'Gaby', 'Gloria', 'Helena', 'Hilda', 'Isi', 'Isabel', 'Josefa', 'Julia', 'Kari', 'Karen',
  'Lucía', 'Laura', 'Maca', 'Marta', 'Nati', 'Nora', 'Olga', 'Olivia', 'Pía', 'Paula', 'Quena', 'Queti', 'Rocío',
  'Rosa', 'Sofía', 'Sara', 'Tere', 'Tati']);
export const femenino = nombre => FEMENINOS.has(nombre);

/** Los oficios: el emoji y el id. Cómo se dicen está en `casoOficios` de rules.js, por idioma. */
export const OFICIOS = [
  { id: 'chef', emoji: '🧑‍🍳' }, { id: 'guardia', emoji: '💂' }, { id: 'artista', emoji: '🎨' },
  { id: 'dentista', emoji: '🦷' }, { id: 'periodista', emoji: '📰' }, { id: 'piloto', emoji: '✈️' },
  { id: 'taxista', emoji: '🚕' }, { id: 'pianista', emoji: '🎹' }, { id: 'electricista', emoji: '🔌' },
  { id: 'astronauta', emoji: '🧑‍🚀' },
];
export const oficio = id => OFICIOS.find(o => o.id === id);

export const fila = i => Math.floor(i / COLS);
export const col = i => i % COLS;
/** "B3": la columna con letra y la fila con número, como en la grilla. */
export const coord = i => `${LETRAS_COL[col(i)]}${fila(i) + 1}`;

const todas = Array.from({ length: N }, (_, i) => i);
export const vecinos = i => todas.filter(j => j !== i && Math.abs(fila(j) - fila(i)) <= 1 && Math.abs(col(j) - col(i)) <= 1);

/* ------------------------------------------------------------------ */
/* Los grupos y las pistas                                             */
/* ------------------------------------------------------------------ */

/**
 * Los grupos de los que hablan las pistas: `{ tipo, ids, n?, c?, o?, de? }`. `de` es la persona de
 * la que se habla (los vecinos de Ana, los que están arriba de Ana).
 */
function grupos(caso) {
  const gs = [];
  for (let f = 0; f < FILAS; f++) gs.push({ tipo: 'fila', n: f + 1, ids: todas.filter(i => fila(i) === f) });
  for (let c = 0; c < COLS; c++) gs.push({ tipo: 'col', c: LETRAS_COL[c], ids: todas.filter(i => col(i) === c) });
  for (const o of caso.oficios) gs.push({ tipo: 'oficio', o, ids: todas.filter(i => caso.oficioDe[i] === o) });
  gs.push({ tipo: 'borde', ids: todas.filter(i => fila(i) === 0 || fila(i) === FILAS - 1 || col(i) === 0 || col(i) === COLS - 1) });
  gs.push({ tipo: 'esquinas', ids: [0, COLS - 1, N - COLS, N - 1] });
  for (const i of todas) {
    gs.push({ tipo: 'vecinos', de: i, ids: vecinos(i) });
    gs.push({ tipo: 'arriba', de: i, ids: todas.filter(j => col(j) === col(i) && fila(j) < fila(i)) });
    gs.push({ tipo: 'abajo', de: i, ids: todas.filter(j => col(j) === col(i) && fila(j) > fila(i)) });
    gs.push({ tipo: 'izq', de: i, ids: todas.filter(j => fila(j) === fila(i) && col(j) < col(i)) });
    gs.push({ tipo: 'der', de: i, ids: todas.filter(j => fila(j) === fila(i) && col(j) > col(i)) });
  }
  return gs.filter(g => g.ids.length >= 2);
}

const cuenta = (ids, v) => ids.reduce((s, i) => s + (v[i] === 1 ? 1 : 0), 0);
/** Lo que un grupo es, sin sus celdas: lo que guarda la pista para armar su frase. */
const sinIds = ({ ids, ...g }) => g;

/**
 * Las pistas posibles que son verdad con la solución `v` (1 criminal, 0 inocente). Cada pista es
 * `{ t, a, b?, k?, g, h?, inoc? }`: `t` dice qué compara y el solver la entiende sin mirar la frase.
 *   eq   en `a` hay exactamente `k` criminales (con `inoc`, se dice contando los inocentes)
 *   ge / le   al menos / a lo más `k`               gt     hay más criminales en `a` que en `b`
 *   igual     la misma cantidad en `a` y en `b`     par / impar   la cantidad de criminales en `a`
 *   es        `a` es una persona y `k` lo que es
 */
export function pistasVerdaderas(caso, v, r) {
  const gs = grupos(caso);
  const out = [];
  for (const grupo of gs) {
    const g = sinIds(grupo), a = grupo.ids;
    const c = cuenta(a, v), n = a.length;
    out.push({ t: 'eq', a, k: c, g });
    if (c > 0 && c < n) out.push({ t: 'eq', a, k: c, g, inoc: true });
    if (c >= 2) out.push({ t: 'ge', a, k: c - 1, g });
    if (c <= n - 2 && c >= 1) out.push({ t: 'le', a, k: c + 1, g });
    // Con 0 sería verdad pero se lee como trampa (#272): ahí ya está "No hay criminales"
    if (n >= 3 && c > 0) out.push({ t: c % 2 ? 'impar' : 'par', a, g });
  }
  // Comparaciones entre dos grupos del mismo tipo (dos filas, dos columnas, dos oficios, los vecinos de dos personas)
  for (let k = 0; k < 60; k++) {
    const x = gs[Math.floor(r() * gs.length)], y = gs[Math.floor(r() * gs.length)];
    if (x === y || (x.de === undefined) !== (y.de === undefined)) continue;
    const cx = cuenta(x.ids, v), cy = cuenta(y.ids, v);
    if (cx > cy) out.push({ t: 'gt', a: x.ids, b: y.ids, g: sinIds(x), h: sinIds(y) });
    else if (cx === cy) out.push({ t: 'igual', a: x.ids, b: y.ids, g: sinIds(x), h: sinIds(y) });
  }
  return out;
}

/** La pista más directa, de respaldo: lo que es otra persona. */
export const pistaDirecta = (caso, v, j) => ({ t: 'es', a: [j], k: v[j] });

/* ------------------------------------------------------------------ */
/* La frase de una pista                                               */
/* ------------------------------------------------------------------ */

const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));

/** "en la fila 2", "entre mis vecinos" (si el grupo es de quien habla) o "Todos los de la fila 2" (`todos`). */
function grupoTexto(g, caso, quien, L, todos = false) {
  const plant = todos ? L.todos : L.grupo;
  const yo = g.de !== undefined && g.de === quien;
  const clave = yo ? `${g.tipo}Yo` : g.tipo;
  const of = g.o ? L.oficios[g.o] : null;
  return fmt(plant[clave], { n: g.n, c: g.c, x: g.de !== undefined ? caso.nombres[g.de] : '', o: of?.varios, oen: of?.en });
}

/**
 * La frase de la pista de la persona `i`, con las plantillas `L` del idioma (`casoTexto` de
 * rules.js). Quien habla de sí mismo habla en primera persona: "entre mis vecinos", "a mi izquierda".
 */
export function texto(caso, i, L) {
  const p = caso.pistas[i];
  const F = L.frases;
  if (p.t === 'es') {
    const x = caso.nombres[p.a[0]];
    return fmt(p.k ? (femenino(x) ? F.esCF : F.esC) : F.esI, { x });
  }
  const g = grupoTexto(p.g, caso, i, L);
  const n = p.a.length;
  switch (p.t) {
    case 'eq':
      if (p.k === 0) return fmt(F.cero, { g });
      if (p.k === n) return fmt(F.todos, { T: grupoTexto(p.g, caso, i, L, true) });
      if (p.inoc) return fmt(n - p.k === 1 ? F.in1 : F.inN, { n: n - p.k, g });
      return fmt(p.k === 1 ? F.eq1 : F.eqN, { n: p.k, g });
    case 'ge': return fmt(p.k === 1 ? F.ge1 : F.geN, { n: p.k, g });
    case 'le': return fmt(p.k === 1 ? F.le1 : F.leN, { n: p.k, g });
    case 'par': return fmt(F.par, { g });
    case 'impar': return fmt(F.impar, { g });
    case 'gt': return fmt(F.gt, { g, h: grupoTexto(p.h, caso, i, L) });
    case 'igual': return fmt(F.igual, { g, h: grupoTexto(p.h, caso, i, L) });
    default: return '';
  }
}

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
 * Arma el caso de la semilla `semilla` (un texto): los nombres, los oficios, quién es criminal (`v`), con quién
 * se parte (`inicio`) y la pista de cada uno (`pistas[i]`). Garantiza que se resuelve sin adivinar:
 * simula al jugador, y si en algún momento nadie más se puede deducir, cambia la última pista
 * repartida por una que destrabe; si no hay, prueba con otra solución.
 */
export function deSemilla(semilla) {
  for (let intento = 0; intento < 40; intento++) {
    const r = mulberry(hash32(`caso:${semilla}:${intento}`));
    const caso = armarCaso(r);
    if (repartir(caso, r)) return { ...caso, semilla };
  }
  throw new Error(`no salió un caso con la semilla ${semilla}`);
}

/** El caso de un día de La Copa (D-97): el mismo para todos los de la copa ese día. */
export const generar = (codigo, dia, { sal = '' } = {}) => deSemilla(`${codigo}:${dia}:${sal}`);

function armarCaso(r) {
  const nombres = NOMBRES.map(op => op[Math.floor(r() * op.length)]);
  const oficios = barajar(OFICIOS, r).slice(0, 5).map(o => o.id);
  const oficioDe = barajar(oficios.flatMap(o => [o, o, o, o]), r);
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
    // Cuando hay que destrabar se miran más: una pista directa es el último recurso
    const candidatas = barajar(pistasVerdaderas(caso, v, r), r).slice(0, necesita ? 40 : 14);
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
 * El estado a partir de las jugadas (C-7), que son los intentos de marcar: `{ i, v }` (persona y
 * lo que el jugador dijo, 1 criminal o 0 inocente). Un intento que acierta marca a la persona y
 * suma su pista; uno que yerra cuenta un error. Los intentos de antes de tiempo no se guardan.
 *
 * Devuelve `x` (lo que se sabe de cada celda, -1 sin saber), `marcas` (en orden), `errores` (la
 * cantidad), `conError` (las celdas donde hubo alguno), `pistas` (las sabidas) y `fin`.
 */
export function estado(p, jugadas = []) {
  const x = new Array(N).fill(-1);
  x[p.inicio] = p.v[p.inicio];
  const marcas = [], conError = new Set();
  let errores = 0;
  for (const j of jugadas) {
    if (!j || x[j.i] !== -1) continue;
    if (j.v === p.v[j.i]) { x[j.i] = p.v[j.i]; marcas.push(j.i); }
    else { errores++; conError.add(j.i); }
  }
  const conocidas = todas.filter(i => x[i] !== -1);
  const pistas = conocidas.map(i => p.pistas[i]).filter(Boolean);
  return { x, marcas, errores, conError, conocidas, pistas, fin: conocidas.length === N };
}

/**
 * Qué pasaría al marcar a `i` como `v`: 'ok' si se podía deducir y está bien, 'error' si se podía
 * deducir y está mal, 'falta' si todavía no se puede saber (no cuenta y no dice si estaba bien) o
 * 'ya' si ya se sabía.
 */
export function intento(p, jugadas, i, v) {
  const { x, pistas } = estado(p, jugadas);
  if (x[i] !== -1) return 'ya';
  const prueba = x.slice();
  prueba[i] = 1 - p.v[i];
  if (resolver(pistas, prueba)) return 'falta';
  return v === p.v[i] ? 'ok' : 'error';
}

/** El puntaje: 100 con el caso resuelto, menos 10 por error, hasta 10. Sin resolver, 0. */
export const puntaje = e => (e.fin ? Math.max(MINIMO, 100 - COSTO_ERROR * e.errores) : 0);

/** La tarjeta para compartir: una fila de cuadrados por fila de la grilla; rojo donde hubo error. */
export const tarjeta = e => Array.from({ length: FILAS }, (_, f) => Array.from({ length: COLS }, (_, c) => (e.conError.has(f * COLS + c) ? '🟥' : '🟩')).join('')).join('\n');
