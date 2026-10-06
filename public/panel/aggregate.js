/**
 * Agregación de las señales de uso para el panel (D-44). Funciones puras, sin DOM ni
 * Firebase, para poder probarlas con node (`node public/panel/aggregate.test.mjs`).
 *
 * Entra lo que hay en la base:
 *   - `rooms`: las salas de `rooms/`, tal como están (solo el dueño puede listarlas)
 *   - `days`: `stats/<env>/days`, un objeto por día con rooms/local/origin/lang/applang/hour
 * Sale lo que el panel dibuja: totales, por juego, por modo, por jugadores, por día,
 * origen, idioma y hora.
 */
import { deserted } from '../assets/js/transport/dispose.js';
import { MODE_IDS, isLocalMode, MAX_PLAYERS, gameById, MODO_UNO_AL_DIA } from '../assets/js/games.js';
import { LATIDO_MS } from '../assets/js/transport/stats.js';

export const DAY = 24 * 60 * 60 * 1000;
export const ROOM_TTL = 6 * 60 * 60 * 1000;   // tope duro de una sala (transporte y reglas)
export const IDLE_TTL = 30 * 60 * 1000;       // media hora sin jugadas y la sala vence (D-89)
export const ACTIVE_MS = 10 * 60 * 1000;      // una sala está "en juego" si hubo jugada hace poco

export const dayOf = ts => Math.floor(ts / DAY);

/**
 * La hora del panel: la del Pacífico (Los Ángeles), la misma con que La Copa parte sus días, así
 * que la hora de un juego y la ventana de su día se leen en el mismo reloj (D-207). Vale para
 * todo lo que la base guarda con hora exacta. Lo que solo se sabe por día (los contadores de
 * `stats/`) sigue en días UTC, y el panel lo rotula así.
 */
export const ZONA_PANEL = 'America/Los_Angeles';
export const ZONA_NOMBRE = 'hora del Pacífico';

/** "14:05", en la hora del panel. 24 horas: "02:05 p. m." ocupa el doble en una lista. */
export function horaLabel(ts) {
  return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA_PANEL });
}

/** "sáb 4 oct", en la hora del panel. */
export function fechaLabel(ts) {
  return new Date(ts).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA_PANEL });
}

/** El día del calendario en la hora del panel, como texto ordenable ("2026-10-04"): para agrupar eventos. */
export const diaPanel = ts => new Date(ts).toLocaleDateString('en-CA', { timeZone: ZONA_PANEL });

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
    // Se suma cada cifra de la fila, sea cual sea: el panel junta así las partidas de los juegos
    // con los juegos de un torneo sin que esto tenga que saber de ninguno de los dos.
    const caja = cajones.get(clave) || { day: clave };
    for (const [k, v] of Object.entries(fila)) if (k !== 'day' && typeof v === 'number') caja[k] = (caja[k] || 0) + v;
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
 * Una partida sin red está en juego si latió hace menos de tres latidos (D-140): uno que se
 * pierde por la red no la apaga, y a los tres minutos de soltar el celular desaparece.
 */
export const VIVA_SIN_RED_MS = 3 * LATIDO_MS;

/**
 * Las partidas sin red que se están jugando ahora, de la más reciente a la más vieja. Se miran
 * hoy y ayer: una partida late en el día en que empezó, aunque cruce la medianoche UTC. Vienen
 * de `stats/<env>`, así que ya están separadas por entorno.
 */
export function liveLocal(days, now = Date.now()) {
  const hoy = dayOf(now);
  const out = [];
  for (const d of [hoy, hoy - 1]) {
    for (const [id, r] of Object.entries(days?.[String(d)]?.live || {})) {
      const beat = Math.max(Number(r?.beat) || 0, Number(r?.at) || 0);
      if (!r?.game || now - beat > VIVA_SIN_RED_MS) continue;
      out.push({ id, game: r.game, mode: r.mode, n: Number(r.n) || 1, co: r.co || '', lang: r.l || '', name: r.name || '', at: Number(r.at) || beat, beat });
    }
  }
  return out.sort((a, b) => b.beat - a.beat);
}

/**
 * Las partidas sin red del rango con hora (D-140), de la más nueva a la más vieja: juego, modo,
 * cuántos juegan, país, versión, cuándo empezó y su última señal, que dice cuánto se jugó como
 * mínimo. Antes de la v0.64.7 no hay de estas: de esos días solo quedan los contadores.
 */
export function localLog(days, { from, to, game = null } = {}) {
  const out = [];
  for (let d = from; d <= to; d++) {
    for (const [id, r] of Object.entries(days?.[String(d)]?.live || {})) {
      if (!r?.game || (game && r.game !== game)) continue;
      const at = Number(r.at) || 0;
      const beat = Math.max(Number(r.beat) || 0, at);
      // Quién jugó y cómo terminó, si la app lo supo (D-210). Con final, lo que duró es exacto
      const fin = r.fin && typeof r.fin === 'object' ? { at: Number(r.fin.at) || 0, ganador: r.fin.g || '', empate: !!r.fin.e, detalle: r.fin.d || '' } : null;
      const hasta = fin?.at > at ? fin.at : beat;
      out.push({ id, day: d, game: r.game, mode: r.mode, n: Number(r.n) || 1, co: r.co || '', lang: r.l || '', name: r.name || '', v: r.v || '', at, beat, fin, minMs: Math.max(0, hasta - at) });
    }
  }
  return out.sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
}

/**
 * El país de cada jugador de las salas registradas hoy y ayer, por código: `{ ABCD: { A: 'CL' } }`.
 * La sala viva (`rooms/`) no lo trae; lo anotó `stats/` al entrar cada uno (D-79).
 */
export function paisesDeSalas(days, now = Date.now()) {
  const hoy = dayOf(now);
  const out = {};
  for (const d of [hoy - 1, hoy]) {
    for (const [code, r] of Object.entries(days?.[String(d)]?.rooms || {})) if (r?.co) out[code] = { ...(out[code] || {}), ...r.co };
  }
  return out;
}

/** El idioma de cada jugador de las salas registradas hoy y ayer, por código (D-211): `{ ABCD: { A: 'es' } }`. */
export function idiomasDeSalas(days, now = Date.now()) {
  const hoy = dayOf(now);
  const out = {};
  for (const d of [hoy - 1, hoy]) {
    for (const [code, r] of Object.entries(days?.[String(d)]?.rooms || {})) if (r?.l) out[code] = { ...(out[code] || {}), ...r.l };
  }
  return out;
}

/**
 * En qué idioma se jugó en el rango (D-211): una vez por jugador de cada sala con rival y una
 * vez por partida sin red. Lo de antes de que se anotara no cuenta: no se sabe.
 */
export function idiomasDelRango(days, { from, to, incluye = () => true }) {
  const out = {};
  for (let d = from; d <= to; d++) {
    const b = days?.[String(d)] || {};
    for (const r of Object.values(b.rooms || {})) {
      if (!r || !incluye(r.game || '?') || Object.keys(r.players || {}).length < 2) continue;
      for (const l of Object.values(r.l || {})) add(out, l);
    }
    for (const r of Object.values(b.live || {})) if (r?.l && incluye(r.game || '?')) add(out, r.l);
  }
  return out;
}

/**
 * Cuántos jugadores de las salas del rango había de cada país (`co`). Cuenta una vez a cada
 * jugador de cada sala: el mismo celular en cinco revanchas suma cinco. No son personas.
 */
export function paisesDelRango(days, { from, to, incluye = () => true }) {
  const out = {};
  for (let d = from; d <= to; d++) {
    for (const r of Object.values(days?.[String(d)]?.rooms || {})) {
      if (!r || !incluye(r.game || '?') || Object.keys(r.players || {}).length < 2) continue;
      for (const role of Object.keys(r.players || {})) add(out, r.co?.[role] || 'desconocido');
    }
  }
  return out;
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
 * ¿Este mensaje de sala es una jugada de una persona? (D-138)
 *
 * Cada juego declara en `games.js` cuáles de sus mensajes lo son (`jugadas`). De uno que no
 * declara nada —recién publicado, o que ya no está en el registro— se cuenta todo lo que no
 * sea una entrada ni el chat: puede quedar inflado, pero no en cero (C-16).
 */
export function esJugada(game, t) {
  const lista = gameById(game)?.jugadas;
  if (Array.isArray(lista)) return lista.includes(t);
  return !!t && t !== 'hello' && t !== 'chat';
}

/**
 * Última señal de vida de una sala: el latido que escribe el transporte (`lastAt`), la última
 * jugada que llegó, o su nacimiento. Se miran los tres porque no siempre están los tres: una
 * sala de antes del latido no tiene `lastAt`, y una recién creada no tiene mensajes.
 */
export function actividad(r) {
  const msgs = Object.values(r?.messages || {});
  const ultima = msgs.reduce((m, x) => (typeof x?.at === 'number' && x.at > m ? x.at : m), 0);
  return Math.max(r?.createdAt || 0, typeof r?.lastAt === 'number' ? r.lastAt : 0, ultima);
}

/**
 * Las salas vivas, ordenadas de la más reciente actividad a la más vieja.
 *
 * Vencida es la que lleva media hora sin latido o seis horas desde que nació (D-89). Se
 * miran las mismas dos cuentas que hacen las reglas —y el latido igual que ellas, solo si
 * está— para que el panel no muestre viva una sala donde ya nadie puede escribir, ni muerta
 * una de las de antes del latido, que todavía aceptan jugadas hasta las seis horas.
 *
 * Quedan fuera también las **cerradas**: aquellas donde todos los jugadores se
 * despidieron (`left`, ver `transport/dispose.js`). Una sala cerrada se borra sola en el
 * acto; si alguna sobrevive es porque el borrado no alcanzó a salir, y mostrarla sería
 * decir que hay gente jugando donde ya no hay nadie (D-50).
 *
 * Nadie conectado no es lo mismo que cerrada: los dos pueden volver a retomar la partida
 * hasta que la sala venza (C-6), así que esas siguen apareciendo, apagadas.
 */
export function liveRooms(rooms, now = Date.now(), paises = {}, idiomas = {}) {
  const out = [];
  for (const [code, r] of Object.entries(rooms || {})) {
    if (!r || typeof r.createdAt !== 'number' || r.createdAt < now - ROOM_TTL) continue;
    if (typeof r.lastAt === 'number' && r.lastAt < now - IDLE_TTL) continue;
    if (deserted(r.players)) continue;
    const players = Object.entries(r.players || {}).sort(([a], [b]) => a.localeCompare(b))
      .map(([role, p]) => ({ role, name: p?.name || '?', online: !!p?.online, left: !!p?.left, co: paises[code]?.[role] || '', lang: idiomas[code]?.[role] || '' }));
    const msgs = Object.values(r.messages || {}).filter(Boolean);
    const game = r.game || '?';
    // Se separan las jugadas de la charla (D-138). Una sala trae además mensajes que nadie
    // escribió: un `hello` por cabeza al entrar y, según el juego, la respuesta automática a
    // cada disparo o intento y los compromisos del anti-trampa. Contar todo junto hacía decir
    // "176 msjs" a una Batalla Naval donde nadie escribió nada: eran 86 disparos y sus respuestas.
    const jugadas = msgs.filter(x => esJugada(game, x.t));
    const chat = msgs.filter(x => x.t === 'chat').length;
    const lastPlayAt = jugadas.reduce((m, x) => (typeof x.at === 'number' && x.at > m ? x.at : m), 0) || null;
    // La hora de vida sí sale de todo: que alguien acabe de entrar también es actividad.
    const lastAt = actividad(r);
    const online = players.filter(p => p.online).length;
    // "En juego" pide rival: una sala con uno solo esperando en el lobby no es una partida.
    const rival = players.filter(p => !p.left).length >= 2;
    out.push({
      code, game, createdAt: r.createdAt, players, online,
      jugadas: jugadas.length, chat, lastPlayAt, lastAt,
      active: rival && (online > 0 || lastAt > now - ACTIVE_MS),
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
 *
 * `incluye(juego)` deja fuera las partidas de los juegos que no pasan: el panel separa así los
 * torneos del resto. Zona horaria, idiomas y hora no son de un juego sino del celular, y se
 * cuentan siempre enteros.
 */
export function summarize(days, { from, to, incluye = () => true }) {
  const byGame = {}, byPlayers = {}, origin = {}, lang = {}, applang = {}, hour = Array(24).fill(0);
  const byDay = [];
  let online = 0, local = 0, devices = 0, sinRival = 0;

  for (let d = from; d <= to; d++) {
    const bucket = (days || {})[String(d)] || {};
    const row = { day: d, total: 0, online: 0, local: 0 };

    for (const r of Object.values(bucket.rooms || {})) {
      if (!r || !incluye(r.game || '?')) continue;
      // Una sala donde nunca entró un segundo jugador no es una partida (D-138): alguien la abrió
      // y no llegó nadie, o la revancha que el otro no aceptó. Se cuenta aparte, igual que la
      // bitácora las deja fuera por defecto; si no, "en dos celulares" y la bitácora no cuadran.
      if (Object.keys(r.players || {}).length < 2) { sinRival++; continue; }
      const g = bump(byGame, r.game || '?');
      g.total++; g.online++; row.online++;
      add(byPlayers, Math.min(MAX_PLAYERS, Math.max(1, Object.keys(r.players || {}).length)));
    }
    for (const [game, modes] of Object.entries(bucket.local || {})) {
      if (!incluye(game)) continue;
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

  return { partidas: online + local, online, local, devices, sinRival, byGame, byPlayers, byDay, origin, lang, applang, hour, modes: modesOf(byGame) };
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
        .map(([role, name]) => ({ role, name: String(name || '?'), co: r.co?.[role] || '', lang: r.l?.[role] || '' }));
      if (soloJugadas && players.length < 2) continue;
      const fin = r.end || null;
      const rol = fin && /^[A-F]$/.test(fin.winner || '') ? fin.winner : '';
      const at = Number(r.at) || d * DAY;
      const endAt = Number(fin?.at) || 0;
      filas.push({
        code, day: d, at, game: r.game || '?', v: r.v || '',
        players, endAt: endAt || null,
        // En qué idioma se jugó: el de cada jugador, sin repetir (D-211); vacío en las de antes
        langs: [...new Set(players.map(p => p.lang).filter(Boolean))],
        // Desde que se creó hasta que alguien ganó: incluye la espera del rival
        durMs: endAt > at ? endAt - at : null,
        // Empate es un resultado, no un dato que falte: se distingue de la sala sin registro.
        empate: !!fin && fin.winner === 'tie',
        winner: rol,
        winnerName: rol ? (fin.name || players.find(p => p.role === rol)?.name || rol) : '',
      });
    }
  }
  return filas.sort((a, b) => b.at - a.at || a.code.localeCompare(b.code));
}

/** La mediana de una lista de números, o `null` si está vacía: el tiempo típico sin que lo arrastre uno. */
export function mediana(xs) {
  const o = xs.filter(x => typeof x === 'number' && x >= 0).sort((a, b) => a - b);
  if (!o.length) return null;
  const k = Math.floor(o.length / 2);
  return o.length % 2 ? o[k] : Math.round((o[k - 1] + o[k]) / 2);
}

/**
 * Una sala registrada, por código. Los códigos son de cuatro letras y se reciclan, así que se
 * puede pedir la de un día; sin día, la más nueva de las bajadas. `null` si no está.
 */
export function salaDe(days, code, day = null) {
  const dias = Object.keys(days || {}).map(Number).filter(d => !Number.isNaN(d));
  if (!dias.length) return null;
  const from = day ?? Math.min(...dias), to = day ?? Math.max(...dias);
  return roomLog(days, { from, to, soloJugadas: false }).find(f => f.code === code) || null;
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

/** Día y hora de una sala, en la hora del panel (D-207). */
export function whenLabel(ts) {
  const dia = new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: ZONA_PANEL });
  return `${dia}, ${horaLabel(ts)}`;
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

/* ------------------------------------------------------------------ */
/* Tráfico del sitio (D-208)                                           */
/* ------------------------------------------------------------------ */
/**
 * Las visitas del rango, de `stats/<env>/days/<día>`: cuántas, cuántas páginas vieron, cuántas
 * llegaron a jugar, y de cada una su página de entrada, de dónde llegó, por qué enlace, si es
 * nueva o vuelve, el aparato y el país. Antes de la versión que lo anota no hay nada, y se dice:
 * `desde` es el primer día con visitas registradas.
 */
export function trafico(days, { from, to }) {
  const paginas = {}, ref = {}, via = {}, retorno = {}, disp = {}, pais = {};
  const porDia = [];
  let visitas = 0, vistas = 0, juegan = 0, desde = null;
  const pagina = k => (paginas[k] ||= { vistas: 0, entradas: 0, juegan: 0 });
  for (let d = from; d <= to; d++) {
    const b = (days || {})[String(d)] || {};
    const fila = { day: d, visitas: 0, vistas: 0, juegan: 0 };
    for (const [k, v] of Object.entries(b.vistas || {})) { pagina(k).vistas += Number(v) || 0; fila.vistas += Number(v) || 0; }
    for (const [k, v] of Object.entries(b.entradas || {})) { pagina(k).entradas += Number(v) || 0; fila.visitas += Number(v) || 0; }
    for (const [k, v] of Object.entries(b.juegan || {})) { pagina(k).juegan += Number(v) || 0; fila.juegan += Number(v) || 0; }
    for (const [k, v] of Object.entries(b.ref || {})) add(ref, k, Number(v) || 0);
    for (const [k, v] of Object.entries(b.via || {})) add(via, k, Number(v) || 0);
    for (const [k, v] of Object.entries(b.retorno || {})) add(retorno, k, Number(v) || 0);
    for (const [k, v] of Object.entries(b.disp || {})) add(disp, k, Number(v) || 0);
    for (const [k, v] of Object.entries(b.pais || {})) add(pais, k, Number(v) || 0);
    if (desde === null && (fila.visitas || fila.vistas)) desde = d;
    visitas += fila.visitas; vistas += fila.vistas; juegan += fila.juegan;
    porDia.push(fila);
  }
  return { visitas, vistas, juegan, desde, porDia, paginas, ref, via, retorno, disp, pais };
}

/**
 * Sitios conocidos, para leer los orígenes de un vistazo: `google_cl` y `google_com` son
 * Google. No es una lista de lo que se cuenta: un dominio que no está aparece con su nombre.
 */
const SITIOS = [
  // Lo más específico primero: la app de Gmail también dice google
  [/^com_google_android_gm$/, 'Gmail'],
  [/(^|_)google(_|$)|^com_google_android_googlequicksearchbox$/, 'Google'],
  [/(^|_)(instagram)_com$/, 'Instagram'], [/(^|_)facebook_com$|^fb_me$/, 'Facebook'],
  [/(^|_)whatsapp_(com|net)$|^wa_me$/, 'WhatsApp'], [/^t_co$|(^|_)(x|twitter)_com$/, 'X (Twitter)'],
  [/(^|_)bing_com$/, 'Bing'], [/(^|_)duckduckgo_com$/, 'DuckDuckGo'], [/(^|_)yahoo_com$/, 'Yahoo'],
  [/(^|_)(chatgpt_com|openai_com)$/, 'ChatGPT'], [/(^|_)perplexity_ai$/, 'Perplexity'], [/(^|_)claude_ai$/, 'Claude'],
  [/(^|_)youtube_com$|^youtu_be$/, 'YouTube'], [/(^|_)tiktok_com$/, 'TikTok'], [/(^|_)linkedin_com$|^lnkd_in$/, 'LinkedIn'],
  [/(^|_)reddit_com$/, 'Reddit'], [/(^|_)github_com$|_github_io$/, 'GitHub'],
];

/** El nombre de un origen: `google_cl` → Google, `directo` → Directo o sin dato, `algo_cl` → algo.cl. */
export function origenLabel(k) {
  if (!k || k === 'directo') return 'Directo o sin dato';
  for (const [re, nombre] of SITIOS) if (re.test(k)) return nombre;
  return k.replace(/_/g, '.');
}

/** Suma los orígenes por su nombre: dos dominios de Google son una sola barra. */
export function origenesAgrupados(ref) {
  const out = {};
  for (const [k, v] of Object.entries(ref || {})) add(out, origenLabel(k), v);
  return out;
}

/**
 * Los avisos de La Copa en el rango (D-233): los que mandó avisar.mjs (`mandados/<tipo>`), los que
 * se tocaron (`aviso/<tipo>`, la página que abrió el aviso) y las aperturas desde la app instalada
 * (`pwa/<sistema>`). Por tipo, y el total de cada uno.
 */
export const AVISO_TIPOS = ['dia', 'plazo', 'final', 'fin', 'insc', 'copas', 'prueba'];
export function avisosDelRango(days, { from, to }) {
  const mandados = {}, tocados = {}, pwa = {};
  for (let d = from; d <= to; d++) {
    const b = (days || {})[String(d)] || {};
    for (const [k, v] of Object.entries(b.mandados || {})) add(mandados, k, Number(v) || 0);
    for (const [k, v] of Object.entries(b.aviso || {})) add(tocados, k, Number(v) || 0);
    for (const [k, v] of Object.entries(b.pwa || {})) add(pwa, k, Number(v) || 0);
  }
  const suma = o => Object.values(o).reduce((a, v) => a + v, 0);
  return { mandados, tocados, pwa, totalMandados: suma(mandados), totalTocados: suma(tocados), totalPwa: suma(pwa) };
}

/** El workflow corre cada 15 minutos (D-224, con atrasos de GitHub): más de una hora sin vuelta es para mirar. */
export const VUELTA_ATRASADA_MS = 60 * 60 * 1000;
export const vueltaAtrasada = (vuelta, now = Date.now()) => !vuelta || now - vuelta > VUELTA_ATRASADA_MS;


/**
 * Uno al día en el rango (D-230). `days` son las señales (`stats/<env>/days`): las partidas del modo
 * de Uno al día (`MODO_UNO_AL_DIA`), de todos (con o sin jugador). `historia` es `unoAlDia/` (solo los que entraron con
 * jugador: `{ jid: { n: { j, s } } }`, con `n` el día desde 1970, el mismo número que los días UTC de
 * las señales); `invitados` es `invitados/` (`{ jid: { uid: { d } } }`); `rachas`, las filas de la
 * tabla de mejores rachas (`records/uno-al-dia-racha/siempre`).
 *
 * Devuelve las partidas (total y por día, y por juego), los jugadores con jugador que jugaron, la
 * vuelta al día siguiente y a los 7 días (de quienes jugaron un día del rango cuyo día siguiente, o
 * séptimo, ya pasó), las rachas por tramo y las invitaciones aceptadas.
 */
export const TRAMOS_RACHA = [['1', 1, 1], ['2 a 6', 2, 6], ['7 a 29', 7, 29], ['30 o más', 30, Infinity]];
export function unoAlDiaDelRango({ days = {}, historia = {}, invitados = {}, rachas = {} } = {}, { from, to, hoy = to }) {
  const porDia = [], porJuego = {};
  let partidas = 0;
  for (let d = from; d <= to; d++) {
    const fila = { day: d, total: 0 };
    for (const [game, modos] of Object.entries((days || {})[String(d)]?.local || {})) {
      const k = Object.values(modos?.[MODO_UNO_AL_DIA] || {}).reduce((a, v) => a + (Number(v) || 0), 0);
      if (!k) continue;
      partidas += k; fila.total += k; add(porJuego, game, k);
    }
    porDia.push(fila);
  }
  const jugadores = new Set();
  const vuelta = { d1: [0, 0], d7: [0, 0] };
  for (const [jid, h] of Object.entries(historia || {})) {
    const nums = new Set(Object.keys(h || {}).map(Number).filter(Number.isInteger));
    for (const n of nums) {
      if (n < from || n > to) continue;
      jugadores.add(jid);
      if (n + 1 < hoy) { vuelta.d1[1]++; if (nums.has(n + 1)) vuelta.d1[0]++; }
      if (n + 7 < hoy) { vuelta.d7[1]++; if (nums.has(n + 7)) vuelta.d7[0]++; }
    }
  }
  const tramos = TRAMOS_RACHA.map(([label]) => [label, 0]);
  for (const f of Object.values(rachas || {})) {
    const s = Number(f?.s) || 0;
    const i = TRAMOS_RACHA.findIndex(([, a, b]) => s >= a && s <= b);
    if (i >= 0) tramos[i][1]++;
  }
  // Lo que se hace en Uno al día (`uad/<evento>`, de todos): botón, dado, jugar, compartir, invitar, avisos…
  const eventos = {};
  let vistas = 0, entradas = 0;
  for (let d = from; d <= to; d++) {
    const b = (days || {})[String(d)] || {};
    for (const [k, v] of Object.entries(b.uad || {})) add(eventos, k, Number(v) || 0);
    // El tráfico de /today/: páginas vistas y visitas que entraron por ahí (un link compartido, un aviso, una invitación)
    vistas += Number(b.vistas?.today) || 0; entradas += Number(b.entradas?.today) || 0;
  }
  let aceptadas = 0;
  for (const porUid of Object.values(invitados || {})) for (const x of Object.values(porUid || {})) if (x?.d >= from && x.d <= to) aceptadas++;
  const pct = ([a, b]) => (b ? Math.round((a / b) * 100) : null);
  return { partidas, porDia, porJuego, jugadores: jugadores.size, d1: pct(vuelta.d1), d7: pct(vuelta.d7), base: { d1: vuelta.d1[1], d7: vuelta.d7[1] }, tramos, aceptadas, eventos, vistas, entradas };
}
