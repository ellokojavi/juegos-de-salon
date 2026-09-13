/**
 * El Ahorcado — motor puro (sin DOM). Testeable con node.
 *
 * Todo el estado se deriva de la lista de mensajes. Con mazo, la palabra sale de la
 * semilla y todos los aparatos la tienen, así que cada uno calcula lo mismo; con cadena,
 * la palabra vive en el celular de quien la escribió y el patrón se arma con sus
 * respuestas (canon C-7, C-10).
 */

/** Alfabeto del teclado. La Ñ es una letra distinta y existe solo en español (D-57). */
export const ALPHABETS = {
  es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ',
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  pt: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
};

/**
 * Letras de cada idioma de la más común a la más rara. La usa el celular para adivinar
 * y "comprar una letra" para elegir cuál revelar: la más rara es la que más informa.
 */
export const FREQ = {
  es: 'EAOSRNIDLCTUMPBGVYQHFZJÑXWK',
  en: 'ETAOINSHRDLCUMWFGYPBVKJXQZ',
  pt: 'AEOSRINDMUTCLPVGHQBFZJXKWY',
};

export const LIVES_OPTIONS = [5, 6, 8];
export const MIN_LETTERS = 3;
export const MAX_LETTERS = 14;
/** Tope por jugada al sumar tiempo: una interrupción larga no puede decidir un desempate. */
const MAX_MS = 120000;
/** Marca de uso privado para apartar la Ñ mientras se le quitan las tildes al resto. */
const KEEP = '\ue000';

/**
 * Mayúsculas, sin tildes y con Ç plegada a C; la Ñ sobrevive (D-57).
 * Se aparta antes de descomponer, porque en NFD la Ñ es una N con una tilde encima.
 */
export function normalize(word) {
  return String(word == null ? '' : word)
    .replace(/[ñÑ]/g, KEEP)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(KEEP).join('Ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** La forma de la palabra: un punto por letra y el espacio tal cual (no revela nada). */
export function shapeOf(word) {
  return normalize(word).replace(/[^ ]/g, '.');
}

/** Posiciones (dentro de la palabra normalizada) donde aparece la letra. */
export function positionsOf(word, letter) {
  const w = normalize(word), l = normalize(letter);
  const out = [];
  if (!l) return out;
  for (let i = 0; i < w.length; i++) if (w[i] === l) out.push(i);
  return out;
}

/**
 * Las posiciones de una respuesta, tal como viajan: "1,4,8", o "" si la letra no está.
 * Van como texto y no como lista porque Firebase no guarda una lista vacía, y una letra
 * que no está es justamente la lista vacía (D-60). Se acepta también la lista cruda, que
 * es lo que manda el transporte local. Devuelve null si el mensaje no sirve.
 */
export function readPos(raw) {
  if (Array.isArray(raw)) raw = raw.join(',');
  if (raw == null) raw = '';
  if (typeof raw !== 'string') return null;
  if (!raw.trim()) return [];
  const out = raw.split(',').map(x => Number(x));
  return out.every(n => Number.isInteger(n) && n >= 0) ? out : null;
}

/** Letras distintas que tiene la palabra, sin espacios. */
export function lettersOf(word) {
  return [...new Set(normalize(word).split('').filter(c => c !== ' '))];
}

/**
 * ¿Sirve como palabra para el rival? Devuelve null si está bien, o la clave del error.
 * Se acepta una frase corta: los espacios vienen revelados y no cuestan nada.
 */
export function wordProblem(word, lang = 'es') {
  const alpha = ALPHABETS[lang] || ALPHABETS.es;
  const solo = normalize(word).split('').filter(c => c !== ' ');
  if (solo.length < MIN_LETTERS) return 'errWordShort';
  if (solo.length > MAX_LETTERS) return 'errWordLong';
  if (solo.some(c => !alpha.includes(c))) return 'errWordLetters';
  if (new Set(solo).size < 2) return 'errWordPoor';
  return null;
}

/** La letra que falta más rara del idioma: la que más ayuda al comprarla (D-58). */
export function rarest(word, used = [], lang = 'es') {
  const freq = FREQ[lang] || FREQ.es;
  const pend = lettersOf(word).filter(c => !used.includes(c));
  if (!pend.length) return null;
  return pend.slice().sort((a, b) => freq.indexOf(b) - freq.indexOf(a))[0];
}

/* ------------------------------------------------------------------ */
/* Reparto del mazo                                                    */
/* ------------------------------------------------------------------ */

/** Generador con semilla (mulberry32): el mismo reparto en todos los celulares. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded(arr, seed) {
  const a = arr.slice();
  const rand = rng(seed);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function randomSeed() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/**
 * Reparte una carta del mazo a cada rol que la necesite. Con `same` toda la mesa recibe
 * la misma palabra, que es la comparación más justa y solo vale cuando juegan a la vez (D-54).
 */
export function dealWords({ cards, seed, roles, same = false }) {
  const order = shuffleSeeded(cards.map(c => c.id), seed);
  const out = {};
  roles.forEach((r, i) => { out[r] = same ? order[0] : order[i % order.length]; });
  return out;
}

/* ------------------------------------------------------------------ */
/* Estado derivado                                                     */
/* ------------------------------------------------------------------ */

/**
 * El siguiente que sigue vivo, empezando por el que va después de `desde`. Puede ser `desde`
 * otra vez, si es el único que queda con palabra sin terminar.
 */
/**
 * El siguiente que sigue jugando. Saltea a quien ya terminó su palabra y también a quien se
 * fue de la sala: en varios celulares el turno no puede quedarse esperando a un celular que
 * cerró la pestaña (D-66). Si el ausente vuelve, vuelve a entrar en la rueda.
 */
function nextAlive(players, st, desde, ausentes = []) {
  const i = players.indexOf(desde);
  for (let k = 1; k <= players.length; k++) {
    const c = players[(i + k) % players.length];
    if (!st[c].done && !ausentes.includes(c)) return c;
  }
  // Si no queda nadie presente, el turno igual tiene que ser de alguien que siga vivo
  for (let k = 1; k <= players.length; k++) {
    const c = players[(i + k) % players.length];
    if (!st[c].done) return c;
  }
  return null;
}

/**
 * Arma el estado completo de la partida.
 *
 *  players  roles en orden de juego
 *  config   { lives, buy, turns }
 *  words    palabras en claro que este aparato conoce, por rol (mazo siempre; cadena al revelar)
 *  declared { rol: { shape, hint } }: lo que se anunció de cada palabra sin revelarla
 *  plays    jugadas en orden: { from, letter, buy, pos, ms }; `pos` falta mientras se espera respuesta
 */
export function buildState({ players, config = {}, words = {}, declared = {}, plays = [], lang = 'es' }) {
  const maxLives = config.lives || 6;
  const st = {};
  for (const p of players) {
    const word = words[p] ? normalize(words[p]) : null;
    const shape = declared[p]?.shape || (word ? shapeOf(word) : null);
    st[p] = {
      word, shape, hint: declared[p]?.hint || '',
      ready: !!shape, used: [], shown: new Set(), at: {}, wrong: 0, bought: 0, boughtSet: new Set(),
      ms: 0, pending: false, last: null, closed: false,
    };
  }
  let ultimo = null;   // quién hizo la última jugada que contó: de ahí sale el turno
  for (const play of plays) {
    const s = st[play.from];
    if (!s || !s.ready || s.closed) continue;
    ultimo = play.from;
    let letter = play.letter ? normalize(play.letter) : null;
    let pos = play.pos;
    // Con la palabra a la vista, el aparato resuelve solo y no espera respuesta de nadie
    if (s.word) {
      if (play.buy) letter = rarest(s.word, s.used, lang);
      pos = letter ? positionsOf(s.word, letter) : null;
    }
    if (!letter || !pos) { s.pending = true; continue; }
    s.pending = false;
    if (s.used.includes(letter)) continue;
    s.used.push(letter);
    pos.forEach(i => { s.shown.add(i); s.at[i] = letter; });
    if (play.buy) { s.bought++; s.boughtSet.add(letter); }
    if (play.buy || !pos.length) s.wrong++;
    s.last = { letter, ok: pos.length > 0, buy: !!play.buy };
    s.ms += Math.min(Math.max(0, play.ms || 0), MAX_MS);
    // Sin vidas o sin huecos, esa palabra ya no acepta más jugadas
    const left = s.shape.split('').filter((c, i) => c !== ' ' && !s.shown.has(i)).length;
    if (maxLives - s.wrong <= 0 || left === 0) s.closed = true;
  }
  for (const p of players) {
    const s = st[p];
    const chars = s.shape ? s.shape.split('') : [];
    s.lives = maxLives - s.wrong;
    s.total = chars.filter(c => c !== ' ').length;
    s.left = chars.filter((c, i) => c !== ' ' && !s.shown.has(i)).length;
    s.solved = s.ready && s.left === 0;
    s.hanged = s.ready && !s.solved && s.lives <= 0;
    s.done = s.solved || s.hanged;
    s.score = s.solved ? s.lives : 0;
    // Lo que ve el jugador: la letra si salió, un punto si falta, el espacio tal cual
    s.pattern = chars.map((c, i) => (c === ' ' ? ' ' : s.shown.has(i) ? (s.at[i] || (s.word ? s.word[i] : '?')) : '.')).join('');
    s.canBuy = !!config.buy && !s.done && s.lives >= 2 && s.left > 0 && !s.pending;
  }
  const ready = players.length > 0 && players.every(p => st[p].ready);
  const done = ready && players.every(p => st[p].done);
  const ausentes = config.away || [];
  const current = !config.turns || !ready || done ? null
    : ultimo == null ? players.find(p => !st[p].done && !ausentes.includes(p)) || players.find(p => !st[p].done) || null
    : st[ultimo].pending ? ultimo                       // esperando respuesta: el turno no se mueve
    : nextAlive(players, st, ultimo, ausentes);
  // Primero los que sacaron la palabra: más margen gana y, a igualdad, con menos letras y
  // en menos tiempo. Los colgados van después y entre ellos ordena quién llegó más lejos:
  // colgarse gastando menos letras es haber revelado menos, o sea peor, no mejor (D-61).
  const rank = players.slice().sort((a, b) =>
    (st[b].solved ? 1 : 0) - (st[a].solved ? 1 : 0)
    || (st[a].solved
      ? st[b].score - st[a].score || st[a].used.length - st[b].used.length
      : (st[a].total - st[a].left) === (st[b].total - st[b].left) ? 0 : (st[b].total - st[b].left) - (st[a].total - st[a].left))
    || st[a].ms - st[b].ms);
  const top = rank[0];
  // Colgarse no gana nunca: si no la sacó nadie, no hay a quién coronar
  const tied = p => top && st[top].solved && st[p].solved
    && st[p].score === st[top].score && st[p].used.length === st[top].used.length && st[p].ms === st[top].ms;
  return { phase: !ready ? 'words' : done ? 'done' : 'play', players, st, current, rank, done, ready, winner: done ? players.filter(tied) : null };
}

/** SHA-256 en hexadecimal (requiere contexto seguro: https o localhost). */
export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Nonce aleatorio en hexadecimal. */
export function randomNonce(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica a quien puso una palabra (C-10): que la palabra revelada sea la que comprometió
 * con el hash, y que todas las respuestas que fue dando calcen con ella, letra por letra.
 */
export async function verifySetter({ word, salt, commit, replies = [] }) {
  const w = normalize(word);
  const hashOk = (await sha256(w + salt)) === commit;
  const repliesOk = replies.every(r => {
    const real = positionsOf(w, r.letter);
    return real.length === (r.pos || []).length && real.every(i => (r.pos || []).includes(i));
  });
  return { hashOk, repliesOk, ok: hashOk && repliesOk };
}
