/**
 * Agregación de las señales de uso para el panel (D-44). Funciones puras, sin DOM ni
 * Firebase, para poder probarlas con node (`node panel/aggregate.test.mjs`).
 *
 * Entra lo que hay en la base:
 *   - `rooms`: las salas de `rooms/`, tal como están (solo el dueño puede listarlas)
 *   - `days`: `stats/<env>/days`, un objeto por día con rooms/local/origin/lang/applang/hour
 * Sale lo que el panel dibuja: totales, por juego, por modo, por jugadores, por día,
 * origen, idioma y hora.
 */
import { deserted } from '../assets/js/transport/dispose.js';
import { MODE_IDS, isLocalMode, MAX_PLAYERS } from '../assets/js/games.js';

export const DAY = 24 * 60 * 60 * 1000;
export const ROOM_TTL = 6 * 60 * 60 * 1000;   // igual que en el transporte y las reglas
export const ACTIVE_MS = 10 * 60 * 1000;      // una sala está "en juego" si hubo jugada hace poco

export const dayOf = ts => Math.floor(ts / DAY);

/**
 * Los rangos que el panel ofrece (D-80). Viven acá y no en el HTML: el selector, el título, la
 * ventana que se baja de la base y el grano de la barra por día salen todos de esta lista, así
 * que agregar un rango es sumar una línea.
 *
 * `grano` es cada cuánto se agrupa la barra "cuándo se juega": un año en barras diarias son 365
 * barras de un píxel, que no se leen. Por día hasta 30, por semana hasta 90, por mes de ahí en
 * adelante.
 */
export const RANGOS = [
  { id: '7d', etiqueta: '7 días', titulo: 'Últimos 7 días', dias: 7, grano: 'dia' },
  { id: '30d', etiqueta: '30 días', titulo: 'Últimos 30 días', dias: 30, grano: 'dia' },
  { id: '60d', etiqueta: '60 días', titulo: 'Últimos 60 días', dias: 60, grano: 'semana' },
  { id: '90d', etiqueta: '90 días', titulo: 'Últimos 90 días', dias: 90, grano: 'semana' },
  { id: '1y', etiqueta: '1 año', titulo: 'Último año', dias: 365, grano: 'mes' },
  { id: 'ytd', etiqueta: 'Este año', titulo: 'Lo que va del año', dias: null, grano: 'mes' },
];

export const RANGO_POR_DEFECTO = '7d';

/**
 * De qué día a qué día va un rango, en números de día.
 *
 * "Este año" no es una cantidad de días: empieza el 1 de enero. El año se toma en UTC, igual que
 * los números de día y que todas las fechas que el panel rotula: mezclar el año local con días
 * numerados en UTC hace que en las primeras horas del 1 de enero el rango arranque en enero del
 * año pasado y termine mañana. La diferencia dura unas horas al año; la incoherencia, todas.
 */
export function rangeOf(id, now = Date.now()) {
  const r = RANGOS.find(x => x.id === id) || RANGOS.find(x => x.id === RANGO_POR_DEFECTO);
  const hoy = dayOf(now);
  const desde = r.dias === null
    ? dayOf(Date.UTC(new Date(now).getUTCFullYear(), 0, 1))
    : hoy - r.dias + 1;
  return { ...r, from: Math.min(desde, hoy), to: hoy };
}

/** Lunes de la semana de ese día, en número de día: el día 0 fue jueves. */
const lunesDe = d => d - ((d + 3) % 7);

/**
 * Agrupa las filas por día en semanas o meses, para que la barra se pueda leer en un rango
 * largo. Con grano 'dia' devuelve lo mismo que entró: agrupar por uno es no agrupar.
 */
export function groupDays(byDay, grano = 'dia') {
  if (grano === 'dia') return byDay.map(d => ({ ...d, label: dayLabel(d.day) }));
  const cajones = new Map();
  for (const fila of byDay) {
    const f = new Date(fila.day * DAY);
    const clave = grano === 'mes' ? dayOf(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), 1)) : lunesDe(fila.day);
    const caja = cajones.get(clave) || { day: clave, total: 0, online: 0, local: 0 };
    caja.total += fila.total; caja.online += fila.online; caja.local += fila.local;
    cajones.set(clave, caja);
  }
  return [...cajones.values()].sort((a, b) => a.day - b.day).map(c => ({ ...c, label: periodLabel(c.day, grano) }));
}

/** Cómo se llama un cajón: "8 sep" la semana, "sep 2026" el mes. */
export function periodLabel(day, grano) {
  const d = new Date(day * DAY);
  if (grano === 'mes') return d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  if (grano === 'semana') return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return dayLabel(day);
}

/**
 * Códigos de sala que el entorno cargado registró hoy y ayer. Una sala vive seis horas como
 * mucho, así que dos días alcanzan de sobra y evitan que un código reciclado de hace semanas
 * —son cuatro letras, se repiten— haga pasar por buena una sala que no lo es.
 */
export function codesOfDays(days, now = Date.now()) {
  const hoy = dayOf(now);
  const set = new Set();
  for (const d of [hoy, hoy - 1]) {
    for (const code of Object.keys(days?.[String(d)]?.rooms || {})) set.add(code);
  }
  return set;
}

/**
 * Parte las salas vivas entre las del entorno mirado y las demás (D-45).
 * `rooms/` es el nodo real del transporte y no está separado por entorno: una partida de
 * prueba en localhost es una sala igual de real que la de un jugador. El entorno se sabe por
 * fuera, en `stats/<env>/days/<día>/rooms/<CÓDIGO>`, así que se cruza por código.
 *
 * Sin ese registro cargado todavía no se filtra nada: preferimos mostrar de más un instante
 * antes que dejar el panel en blanco mientras llega el segundo snapshot.
 */
export function splitByEnv(live, codes, { loaded = true } = {}) {
  if (!loaded) return { propias: live, ajenas: [] };
  const propias = [], ajenas = [];
  for (const r of live) (codes.has(r.code) ? propias : ajenas).push(r);
  return { propias, ajenas };
}

/**
 * Las salas vivas, ordenadas de la más reciente actividad a la más vieja.
 *
 * Quedan fuera las vencidas y las **cerradas**: aquellas donde todos los jugadores se
 * despidieron (`left`, ver `transport/dispose.js`). Una sala cerrada se borra sola en el
 * acto; si alguna sobrevive es porque el borrado no alcanzó a salir, y mostrarla sería
 * decir que hay gente jugando donde ya no hay nadie (D-50).
 *
 * Nadie conectado no es lo mismo que cerrada: los dos pueden volver a retomar la partida
 * hasta que la sala venza (C-6), así que esas siguen apareciendo, apagadas.
 */
export function liveRooms(rooms, now = Date.now()) {
  const out = [];
  for (const [code, r] of Object.entries(rooms || {})) {
    if (!r || typeof r.createdAt !== 'number' || r.createdAt < now - ROOM_TTL) continue;
    if (deserted(r.players)) continue;
    const players = Object.entries(r.players || {}).sort(([a], [b]) => a.localeCompare(b))
      .map(([role, p]) => ({ role, name: p?.name || '?', online: !!p?.online, left: !!p?.left }));
    const msgs = Object.values(r.messages || {});
    // `hello` lo manda el transporte solo al entrar cada jugador, así que una sala recién
    // creada ya trae uno por cabeza. Contarlos hacía que una sala sin jugadas dijera "2 msj".
    const dichos = msgs.filter(x => x?.t !== 'hello');
    // La hora sí sale de todos: que alguien acabe de entrar también es actividad.
    const lastAt = msgs.reduce((m, x) => (typeof x?.at === 'number' && x.at > m ? x.at : m), r.createdAt);
    const online = players.filter(p => p.online).length;
    out.push({
      code, game: r.game || '?', createdAt: r.createdAt, players, online,
      messages: dichos.length, lastAt,
      active: online > 0 || lastAt > now - ACTIVE_MS,
    });
  }
  return out.sort((a, b) => b.lastAt - a.lastAt);
}

/** Cuántos celulares hay conectados a salas ahora: es la mejor aproximación a la cuota de conexiones. */
export function connections(live) {
  return live.reduce((n, r) => n + r.online, 0);
}

const add = (obj, key, n = 1) => { obj[key] = (obj[key] || 0) + n; };
/** La fila de un juego: un casillero por modo conocido, y los que aparezcan se suman solos. */
const bump = (obj, key) => {
  if (!obj[key]) obj[key] = { total: 0, ...Object.fromEntries(MODE_IDS.map(m => [m, 0])) };
  return obj[key];
};

/**
 * Los modos que hay que dibujar: los conocidos en su orden (C-5) y detrás los que llegaron
 * de la base sin estar en el registro, en orden alfabético. Así una versión nueva de la app
 * que empezó a mandar un modo que el panel no conoce se ve igual, con su clave por nombre,
 * en vez de desaparecer de las barras (C-16).
 */
export function modesOf(byGame) {
  const vistos = new Set();
  for (const fila of Object.values(byGame || {})) {
    for (const [modo, v] of Object.entries(fila)) if (modo !== 'total' && v > 0) vistos.add(modo);
  }
  const nuevos = [...vistos].filter(m => !MODE_IDS.includes(m)).sort();
  return [...MODE_IDS, ...nuevos];
}

/**
 * Resume los días entre `from` y `to` (inclusive, números de día).
 * `days` es el objeto tal como viene de `stats/<env>/days`.
 */
export function summarize(days, { from, to }) {
  const byGame = {}, byPlayers = {}, origin = {}, lang = {}, applang = {}, hour = Array(24).fill(0);
  const byDay = [];
  let online = 0, local = 0, devices = 0;

  for (let d = from; d <= to; d++) {
    const bucket = (days || {})[String(d)] || {};
    const row = { day: d, total: 0, online: 0, local: 0 };

    for (const r of Object.values(bucket.rooms || {})) {
      if (!r) continue;
      const g = bump(byGame, r.game || '?');
      g.total++; g.online++; row.online++;
      add(byPlayers, Math.min(MAX_PLAYERS, Math.max(1, Object.keys(r.players || {}).length)));
    }
    for (const [game, modes] of Object.entries(bucket.local || {})) {
      for (const [mode, ns] of Object.entries(modes || {})) {
        // Se acepta por forma, no por lista: un modo que el código empezó a mandar ayer
        // cuenta hoy, sin tocar el panel (C-16). Lo que no tiene forma de modo es basura.
        if (!isLocalMode(mode)) continue;
        for (const [n, count] of Object.entries(ns || {})) {
          const c = Number(count) || 0;
          const g = bump(byGame, game);
          g.total += c; g[mode] = (g[mode] || 0) + c; row.local += c;
          add(byPlayers, Math.min(MAX_PLAYERS, Math.max(1, Number(n) || 1)), c);
        }
      }
    }
    for (const [k, v] of Object.entries(bucket.origin || {})) { add(origin, k, Number(v) || 0); devices += Number(v) || 0; }
    for (const [k, v] of Object.entries(bucket.lang || {})) add(lang, k, Number(v) || 0);
    for (const [k, v] of Object.entries(bucket.applang || {})) add(applang, k, Number(v) || 0);
    for (const [h, v] of Object.entries(bucket.hour || {})) { const i = Number(h); if (i >= 0 && i < 24) hour[i] += Number(v) || 0; }

    row.total = row.online + row.local;
    online += row.online; local += row.local;
    byDay.push(row);
  }

  return { partidas: online + local, online, local, devices, byGame, byPlayers, byDay, origin, lang, applang, hour, modes: modesOf(byGame) };
}

/**
 * La bitácora de salas: una fila por sala registrada en el rango, de la más nueva a la más
 * vieja (D-79). Sale de `stats/<env>/days/<día>/rooms`, así que ya viene separada por entorno:
 * mirando producción no aparece ninguna sala de prueba, que corren todas en local (D-45).
 *
 * `soloJugadas` deja fuera las salas donde nunca entró un segundo jugador: alguien abrió una
 * sala y no llegó nadie, y eso no es una partida. Es lo que se muestra por defecto.
 *
 * Lo que no se sabe se deja vacío y la lista muestra un guion: las salas jugadas antes de que
 * esto existiera no tienen país ni ganador, y no hay de dónde sacarlos.
 */
export function roomLog(days, { from, to, soloJugadas = true } = {}) {
  const filas = [];
  for (let d = from; d <= to; d++) {
    const bucket = (days || {})[String(d)] || {};
    for (const [code, r] of Object.entries(bucket.rooms || {})) {
      if (!r) continue;
      const players = Object.entries(r.players || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([role, name]) => ({ role, name: String(name || '?'), co: r.co?.[role] || '' }));
      if (soloJugadas && players.length < 2) continue;
      const fin = r.end || null;
      const rol = fin && /^[A-F]$/.test(fin.winner || '') ? fin.winner : '';
      filas.push({
        code, day: d, at: Number(r.at) || d * DAY, game: r.game || '?', v: r.v || '',
        players,
        // Empate es un resultado, no un dato que falte: se distingue de la sala sin registro.
        empate: !!fin && fin.winner === 'tie',
        winner: rol,
        winnerName: rol ? (fin.name || players.find(p => p.role === rol)?.name || rol) : '',
      });
    }
  }
  return filas.sort((a, b) => b.at - a.at || a.code.localeCompare(b.code));
}

/** Una página de la bitácora, y cuántas hay. `page` empieza en 1 y se acota a lo que existe. */
export function paginate(filas, { page = 1, perPage = 20 } = {}) {
  const total = filas.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const actual = Math.min(Math.max(1, Math.round(page) || 1), pages);
  const desde = (actual - 1) * perPage;
  return { rows: filas.slice(desde, desde + perPage), page: actual, pages, total, desde };
}

/**
 * La bandera de un país en dos letras: `CL` → 🇨🇱. Son los dos caracteres de indicador
 * regional, que el sistema dibuja como bandera; si el país no se sabe, no va nada.
 */
export function flagOf(co) {
  if (!/^[A-Za-z]{2}$/.test(co || '')) return '';
  return String.fromCodePoint(...[...co.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Día y hora de una sala, en la zona horaria de quien mira el panel. */
export function whenLabel(ts) {
  const d = new Date(ts);
  const dia = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  // 24 horas: "02:00 p. m." ocupa el doble y en una lista de veinte filas se lee peor
  const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia}, ${hora}`;
}

/** Pares [clave, valor] de mayor a menor, con tope. */
export function top(obj, limit = 12) {
  return Object.entries(obj || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

/**
 * Zona horaria legible de vuelta desde la clave: `America__Sao_Paulo` → { city: 'Sao Paulo',
 * region: 'America' }. La ciudad va primero porque es lo que se lee de un vistazo.
 */
export function tzLabel(key) {
  if (!key || key === 'desconocida') return { city: 'Sin zona horaria', region: '' };
  const parts = key.split('__');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts.slice(0, -1).filter(p => p !== 'Etc').join('/');
  return { city, region };
}

/** "hace 3 min", "hace 2 h", para la lista de salas. */
export function ago(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return 'recién';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return `hace ${h} h`;
}

/** Fecha corta de un número de día, en la zona horaria del panel. */
export function dayLabel(day) {
  const d = new Date(day * DAY);
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
