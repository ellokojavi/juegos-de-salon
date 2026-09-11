/**
 * Agregación de las señales de uso para el panel (D-44). Funciones puras, sin DOM ni
 * Firebase, para poder probarlas con node (`node panel/aggregate.test.mjs`).
 *
 * Entra lo que hay en la base:
 *   - `rooms`: las salas vivas, tal como están en `rooms/` (solo el dueño puede listarlas)
 *   - `days`: `stats/<env>/days`, un objeto por día con rooms/local/origin/lang/applang/hour
 * Sale lo que el panel dibuja: totales, por juego, por modo, por jugadores, por día,
 * origen, idioma y hora.
 */
export const DAY = 24 * 60 * 60 * 1000;
export const ROOM_TTL = 6 * 60 * 60 * 1000;   // igual que en el transporte y las reglas
export const ACTIVE_MS = 10 * 60 * 1000;      // una sala está "en juego" si hubo jugada hace poco

export const MODES = ['online', 'local', 'cpu', 'solo'];
export const dayOf = ts => Math.floor(ts / DAY);

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

/** Las salas vivas, ordenadas de la más reciente actividad a la más vieja. */
export function liveRooms(rooms, now = Date.now()) {
  const out = [];
  for (const [code, r] of Object.entries(rooms || {})) {
    if (!r || typeof r.createdAt !== 'number' || r.createdAt < now - ROOM_TTL) continue;
    const players = Object.entries(r.players || {}).sort(([a], [b]) => a.localeCompare(b))
      .map(([role, p]) => ({ role, name: p?.name || '?', online: !!p?.online }));
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
const bump = (obj, key) => { if (!obj[key]) obj[key] = { total: 0, online: 0, local: 0, cpu: 0, solo: 0 }; return obj[key]; };

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
      add(byPlayers, Math.min(6, Math.max(1, Object.keys(r.players || {}).length)));
    }
    for (const [game, modes] of Object.entries(bucket.local || {})) {
      for (const [mode, ns] of Object.entries(modes || {})) {
        if (!['local', 'cpu', 'solo'].includes(mode)) continue;
        for (const [n, count] of Object.entries(ns || {})) {
          const c = Number(count) || 0;
          const g = bump(byGame, game);
          g.total += c; g[mode] += c; row.local += c;
          add(byPlayers, Math.min(6, Math.max(1, Number(n) || 1)), c);
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

  return { partidas: online + local, online, local, devices, byGame, byPlayers, byDay, origin, lang, applang, hour };
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
