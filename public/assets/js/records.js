/**
 * Los récords y rankings de los jugadores (D-212): lógica pura, sin DOM ni red. La usan
 * `jugador.js` (el almacén), `ranking.js` (la pantalla) y las reglas de Firebase repiten lo que
 * hace falta para que nadie escriba un récord peor, con otro nombre o fuera de orden.
 *
 * Un jugador es un nombre y un PIN de 4 dígitos, como en La Copa (D-96), pero vale para todos
 * los juegos: su `jid` (8 letras y números) es lo que guardan los rankings. Dos personas pueden
 * llamarse igual; con distinto PIN son dos jugadores.
 *
 * Una tabla es `records/<tabla>/<periodo>/<jid>` = { s, ms, k, at, n }: el mejor puntaje del
 * jugador en ese juego y ese período, nada más. `k` es la clave de orden (menos es mejor), así
 * el top se lee con una sola consulta ordenada por `k`.
 */

/** El id de un jugador: 8 letras minúsculas y números, como el `pid` de La Copa pero más largo. */
export const JID = /^[a-z0-9]{8}$/;
export const esJid = j => typeof j === 'string' && JID.test(j);
export const NOMBRE_MAX = 20;
export const esPin = p => typeof p === 'string' && /^\d{4}$/.test(p);

/** Un jid nuevo. `rand` se puede fijar en las pruebas. */
export function nuevoJid(rand = Math.random) {
  const A = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += A[Math.floor(rand() * A.length)];
  return s;
}

/** El nombre tal como se muestra: sin espacios de más y a lo más 20 caracteres. */
export const limpiarNombre = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, NOMBRE_MAX);

/**
 * La clave de un nombre en Firebase: "Cata", " cata " y "CATA" son el mismo; también "Ñandú" y
 * "nandu". Lo que no es letra ni número queda como guion. Un nombre de puros emojis también
 * tiene clave, para que se pueda buscar.
 */
export function claveNombre(s) {
  const k = limpiarNombre(s).toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  return k || 'sin-letras';
}
export const CLAVE_NOMBRE = /^[a-z0-9-]{1,24}$/;

/** El PIN nunca se guarda: se guarda este hash, atado al jugador. */
export async function hashPinJugador(jid, pin) {
  const data = new TextEncoder().encode(`jugador:${jid}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ */
/* Tablas y períodos                                                   */
/* ------------------------------------------------------------------ */

/**
 * El nombre de una tabla: el id del juego (`reinas`) o el id con su variante (`reinas_copa`, los
 * puntajes de un día de copa). Las reglas aceptan la forma, no una lista de juegos (C-16).
 */
export const tablaId = (juego, variante = '') => (variante ? `${juego}_${variante}` : juego);
export const TABLA = /^[a-z][a-z0-9-]{0,24}(_[a-z0-9-]{1,16})?$/;
/** La suma de los mejores puntajes en todos los juegos sueltos: el que juega a todo. */
export const TODOTERRENO = 'todoterreno';
export const VARIANTE_COPA = 'copa';
/**
 * Las victorias de los juegos de grupo van en la misma forma de tabla (`batalla-naval_victorias`),
 * con `s` = cuántas y `ms` = 0: más es mejor, como un puntaje, y las reglas exigen que suba de a uno.
 */
export const VARIANTE_VICTORIAS = 'victorias';
export const esVictorias = t => String(t).endsWith(`_${VARIANTE_VICTORIAS}`);
/** Cuántas partidas terminó cada jugador, en todos los juegos (D-219): sube de a uno, como las victorias. */
export const PARTIDAS = 'partidas';
/** Las tablas que cuentan (victorias, partidas) en vez de guardar un puntaje: las reglas exigen +1. */
export const esCuenta = t => esVictorias(t) || t === PARTIDAS;

/** El país, como lo guardan La Copa y las salas: dos letras mayúsculas (D-79, D-209). */
export const esPais = co => typeof co === 'string' && /^[A-Z]{2}$/.test(co);
/** La bandera de un país (🇨🇱), o '' si no se sabe. */
export const bandera = co => (esPais(co) ? String.fromCodePoint(...[...co].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)) : '');

export const SIEMPRE = 'siempre';
/**
 * Los períodos: siempre, una semana (`s2026-41`) o, para Uno al día (D-230), un día: `d` y el
 * número del día desde el 1 de enero de 1970 (`d20731`, el 5 de octubre de 2026): así la clave del
 * ranking del día es la misma que la de la historia (`unoAlDia/<jid>/<n>`), que las reglas cruzan.
 */
export const PERIODO = /^(siempre|s[0-9]{4}-[0-9]{2}|d[0-9]{5})$/;
/** Las tablas de Uno al día (D-230): el puntaje del día y la suma de la semana, y la mejor racha. */
export const UNO_AL_DIA = 'uno-al-dia';
export const UAD_RACHA = 'uno-al-dia-racha';
/** El período de un día de Uno al día, por su número. */
export const periodoDia = n => `d${n}`;
/** Las semanas parten el lunes a medianoche en Chile, donde vive la app. */
export const ZONA_SEMANA = 'America/Santiago';

/** El año y el día de una fecha en la zona dada, como números (para no depender del navegador). */
function fechaEn(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(ms)).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day);
}

/** La semana ISO de un instante, como período: `s2026-40`. */
export function semana(ms, tz = ZONA_SEMANA) {
  const d = new Date(fechaEn(ms, tz));
  const dow = (d.getUTCDay() + 6) % 7;            // lunes = 0
  d.setUTCDate(d.getUTCDate() - dow + 3);          // el jueves de esa semana decide el año
  const anio = d.getUTCFullYear();
  const primerJueves = new Date(Date.UTC(anio, 0, 4));
  primerJueves.setUTCDate(primerJueves.getUTCDate() - ((primerJueves.getUTCDay() + 6) % 7) + 3);
  const n = 1 + Math.round((d - primerJueves) / (7 * 86400000));
  return `s${anio}-${String(n).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Orden                                                               */
/* ------------------------------------------------------------------ */

/** Los topes que las reglas también imponen. */
export const S_MAX = 100000;
export const MS_MAX = 99999999;
/**
 * La clave de orden: más puntos primero y, a igual puntaje, menos tiempo (D-95, D-142). Las
 * reglas la recalculan, así que no se puede escribir una que no corresponda al puntaje.
 */
export const claveOrden = (s, ms) => (S_MAX - s) * 100000000 + ms;

/** Un resultado tal como se guarda, o null si no se puede guardar. */
export function normalizar({ s, ms }) {
  const S = Math.round(Number(s)), M = Math.round(Number(ms) || 0);
  if (!Number.isFinite(S) || S < 0 || S > S_MAX) return null;
  const msOk = Math.min(Math.max(0, M), MS_MAX);
  return { s: S, ms: msOk, k: claveOrden(S, msOk) };
}

/** ¿`nuevo` es mejor que `antes`? Sin anterior, sí. */
export const esMejor = (nuevo, antes) => !antes || claveOrden(nuevo.s, nuevo.ms) < claveOrden(antes.s, antes.ms);

/** Ordena filas `{ jid, s, ms }` y les pone puesto; los que empatan en todo comparten puesto. */
export function ordenar(filas) {
  const out = filas.map(f => ({ ...f, k: claveOrden(f.s, f.ms) })).sort((a, b) => a.k - b.k || (a.jid < b.jid ? -1 : 1));
  out.forEach((f, i) => { f.puesto = i && out[i - 1].k === f.k ? out[i - 1].puesto : i + 1; });
  return out;
}

/**
 * Lo que se muestra de una tabla: el top y, si el jugador quedó más abajo, sus vecinos. Recibe
 * el top ya leído (los primeros `leidos`, en orden) y, si hace falta, los vecinos leídos aparte.
 * Devuelve `{ top, yo, vecinos, fuera }`: `fuera` si está más abajo de lo leído (sin puesto exacto).
 */
export function vistaTabla(leidas, jid, { top = 10, alrededor = 2, vecinosLeidos = null } = {}) {
  const filas = ordenar(leidas);
  const i = jid ? filas.findIndex(f => f.jid === jid) : -1;
  const yo = i >= 0 ? filas[i] : null;
  const primeras = filas.slice(0, top);
  if (!jid || (yo && i < top)) return { top: primeras, yo, vecinos: [], fuera: false };
  if (yo) {
    const vecinos = filas.slice(Math.max(top, i - alrededor), i + alrededor + 1);
    return { top: primeras, yo, vecinos, fuera: false };
  }
  // Más abajo de lo leído: los vecinos vienen de otra consulta y no se sabe el puesto exacto
  if (vecinosLeidos?.yo) {
    const vec = [...(vecinosLeidos.arriba || []), vecinosLeidos.yo, ...(vecinosLeidos.abajo || [])]
      .map(f => ({ ...f, k: claveOrden(f.s, f.ms), puesto: null }));
    return { top: primeras, yo: vec.find(f => f.jid === jid), vecinos: vec, fuera: true };
  }
  return { top: primeras, yo: null, vecinos: [], fuera: false };
}

/* ------------------------------------------------------------------ */
/* Todoterreno                                                         */
/* ------------------------------------------------------------------ */

/**
 * El Todoterreno de un jugador: la suma de sus mejores puntajes en cada juego, y de sus tiempos
 * para desempatar. Como cada mejor solo puede mejorar, la suma también: las reglas le exigen lo
 * mismo que a cualquier récord. `mejores` es `{ juego: { s, ms } }`; cuentan solo los `juegos` dados.
 */
export function todoterreno(mejores, juegos) {
  let s = 0, ms = 0, n = 0;
  for (const j of juegos) {
    const m = mejores?.[j];
    if (!m) continue;
    s += Number(m.s) || 0; ms += Number(m.ms) || 0; n++;
  }
  return n ? { s, ms: Math.min(ms, MS_MAX), n } : null;
}

/* ------------------------------------------------------------------ */
/* Campeones de La Copa                                                */
/* ------------------------------------------------------------------ */

/**
 * El podio de una copa terminada, para guardarlo: los tres primeros lugares de su tabla (con
 * empates puede haber más de tres). `filas` es lo que devuelve `tabla()` de cup/engine.js.
 */
export function podioDe(filas, jugadores = {}) {
  const p = {};
  for (const f of filas) {
    if (f.lugar > 3) continue;
    const j = jugadores[f.pid]?.j, co = jugadores[f.pid]?.co;
    p[f.pid] = { n: f.name, l: f.lugar, ...(esJid(j) ? { j } : {}), ...(esPais(co) ? { co } : {}) };
  }
  return p;
}

/**
 * El medallero: cuántos oros, platas y bronces tiene cada uno, de todas las copas guardadas.
 * Quien entró con su jugador suma por su jid; quien no, por su nombre (y dos con el mismo nombre
 * suman juntos: es lo que se puede saber). Orden olímpico: oros, después platas, después bronces.
 */
export function medallero(podios) {
  const por = new Map();
  for (const [code, c] of Object.entries(podios || {})) {
    for (const x of Object.values(c?.p || {})) {
      const id = esJid(x.j) ? x.j : `n:${claveNombre(x.n)}`;
      const f = por.get(id) || { id, jid: esJid(x.j) ? x.j : null, n: x.n, co: null, oro: 0, plata: 0, bronce: 0, copas: [] };
      if (esPais(x.co)) f.co = x.co;
      if (x.l === 1) f.oro++; else if (x.l === 2) f.plata++; else if (x.l === 3) f.bronce++;
      f.copas.push(code);
      if ((c.end || 0) >= (f.ultima || 0)) { f.n = x.n; f.ultima = c.end || 0; }
      por.set(id, f);
    }
  }
  const filas = [...por.values()].sort((a, b) => b.oro - a.oro || b.plata - a.plata || b.bronce - a.bronce || a.n.localeCompare(b.n, 'es'));
  filas.forEach((f, i) => {
    const p = filas[i - 1];
    f.puesto = p && p.oro === f.oro && p.plata === f.plata && p.bronce === f.bronce ? p.puesto : i + 1;
  });
  return filas;
}

/** Las últimas copas terminadas con su campeón, de la más nueva a la más vieja. */
export function ultimasCopas(podios, n = 5) {
  return Object.entries(podios || {})
    .map(([code, c]) => ({ code, name: c.name, end: c.end || 0, de: c.de || 0, campeones: Object.values(c.p || {}).filter(x => x.l === 1).map(x => ({ n: x.n, co: esPais(x.co) ? x.co : null })) }))
    .sort((a, b) => b.end - a.end)
    .slice(0, n);
}
