/**
 * Los parámetros de la URL, en inglés (C-18, D-266). Lo que se ve en una dirección va en inglés:
 * las carpetas (D-192), los nombres de los parámetros y sus valores en palabras. Los nombres de
 * antes, en español, siguen circulando en WhatsApp (salas, copas, avisos, invitaciones): se leen
 * igual, pero lo que la app escribe o genera usa siempre el nombre en inglés.
 *
 *   param('room')        lee `?room=ABCD`, o `?sala=ABCD` de un link viejo
 *   tiene('test')        `?test`, o `?prueba`
 *   enIngles('?prueba&semilla=K7Q2X')   → '?test&seed=K7Q2X'
 *
 * Puro y sin DOM, para probarlo con node (`node public/assets/js/parametros.test.mjs`).
 */

/** Los parámetros con valor: el nombre en inglés y el de antes. */
export const ALIAS = {
  room: 'sala',          // el código de una sala (los juegos de grupo)
  seed: 'semilla',       // el contenido de una partida suelta, para repetirla (D-97)
  practice: 'practica',  // /cup/?practice=<juego>: un juego suelto desde el laboratorio
  day: 'dia',            // el día de una copa que abre un aviso (D-229), o el de El caso (#273)
  notif: 'aviso',        // qué aviso abrió la página, para contarlo en el panel (D-233)
  from: 'de',            // la marca de un link compartido: `from=link` (D-208)
  timer: 'zipSeg',       // solo en prueba: el reloj de Zip y Desenredo, en segundos
  daily: 'uad',          // dónde va el acceso a Uno al día en la portada (D-239)
};

/** Los que van solos, sin valor (`?test`), y su nombre de antes. */
export const BANDERAS = {
  test: 'prueba',        // el almacén local, para los guiones (D-110)
  three: 'tres',         // ofrece La Copa de 3 días (D-100)
  today: 'hoy',          // Uno al día: el desafío de hoy (D-230)
  mute: 'silenciar',     // el botón del aviso de una copa que la silencia (D-229)
};

/** Los valores en palabras: el de antes → el de ahora. */
export const VALORES = {
  // Las escenas de La Copa en el modo de prueba (D-110)
  demo: { nueva: 'new', invitado: 'guest', espera: 'waiting', 'sin-jugar': 'not-started', jugador: 'player', podio: 'podium', llena: 'full' },
  daily: { boton: 'button', tarjeta: 'card', no: 'off' },
  // Los avisos (D-233, D-230). La clave que cuenta el panel sigue siendo la de antes: ver AVISO_CLAVE
  notif: { dia: 'day', plazo: 'deadline', fin: 'end', insc: 'signup', copas: 'cups', prueba: 'test', uaddia: 'dailyday', uadracha: 'dailystreak', uadsemana: 'dailyweek', uadadios: 'dailybye' },
};

/** De un aviso de la URL (`notif=deadline`) a su contador en el panel (`aviso/plazo`), que no cambia. */
export const AVISO_CLAVE = { ...Object.fromEntries(Object.entries(VALORES.notif).map(([es, en]) => [en, es])), final: 'final' };

const ANTES = { ...ALIAS, ...BANDERAS };
const PORNOMBRE = Object.fromEntries(Object.entries(ANTES).map(([en, es]) => [es, en]));

const consulta = search => (search instanceof URLSearchParams ? search : new URLSearchParams(String(search ?? globalThis.location?.search ?? '')));

/** El valor en inglés de un valor de antes; uno que no está en la lista queda igual. */
const traducir = (nombre, v) => (v != null && Object.hasOwn(VALORES[nombre] || {}, v) ? VALORES[nombre][v] : v);

/**
 * El valor de un parámetro por su nombre en inglés, o por el de antes si el link es viejo; `null`
 * si no viene. Los valores en palabras salen en inglés (`?uad=boton` → 'button').
 */
export function param(nombre, search) {
  const q = consulta(search);
  if (q.has(nombre)) return traducir(nombre, q.get(nombre));
  const viejo = ANTES[nombre];
  return viejo && q.has(viejo) ? traducir(nombre, q.get(viejo)) : null;
}

/** ¿Viene el parámetro, con su nombre en inglés o con el de antes? */
export function tiene(nombre, search) {
  const q = consulta(search);
  return q.has(nombre) || (!!ANTES[nombre] && q.has(ANTES[nombre]));
}

/** Todos los nombres con que puede venir un parámetro: para borrarlo de una dirección. */
export const nombres = nombre => [nombre, ANTES[nombre]].filter(Boolean);

/**
 * La búsqueda con los nombres y valores de antes pasados al inglés, sin tocar lo demás: el orden,
 * las palabras sueltas (`?K7Q2X`, `?pirata`, que La Copa lee sin `=`) y cómo vienen escritas. Una
 * palabra suelta solo se traduce si es una bandera (`?prueba` → `?test`); un parámetro con valor,
 * solo si trae `=`. Devuelve '' o '?…', como `location.search`.
 */
export function enIngles(search = '') {
  const partes = String(search || '').replace(/^\?/, '').split('&').filter(Boolean);
  const out = partes.map(p => {
    const i = p.indexOf('=');
    if (i < 0) {
      const en = PORNOMBRE[p];
      return en && BANDERAS[en] ? en : p;
    }
    const k = p.slice(0, i);
    let v = p.slice(i + 1);
    const en = PORNOMBRE[k] || k;
    // Una bandera con `=` vacío (`?prueba=`, como la deja URLSearchParams) vuelve a ir sola
    if (BANDERAS[en]) return v ? p : en;
    try {
      const antes = decodeURIComponent(v), ahora = traducir(en, antes);
      if (ahora !== antes) v = encodeURIComponent(ahora);
    } catch (_) { /* queda como venía */ }
    return `${en}=${v}`;
  });
  return out.length ? `?${out.join('&')}` : '';
}

/**
 * Si la dirección trae nombres de antes, la reescribe en inglés sin recargar: lo que se copie de la
 * barra ya es el link nuevo. Lo llama `trackVisit` al abrir cada página. Devuelve si cambió.
 */
export function normalizarUrl({ loc = globalThis.location, hist = globalThis.history } = {}) {
  try {
    const nueva = enIngles(loc?.search);
    if (!loc || nueva === loc.search || (!nueva && !loc.search)) return false;
    hist?.replaceState(hist.state, '', `${loc.pathname}${nueva}${loc.hash || ''}`);
    return true;
  } catch (_) { return false; }
}
