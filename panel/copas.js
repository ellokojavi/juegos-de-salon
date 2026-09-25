/**
 * La Copa en el panel del dueño. Funciones puras, sin DOM ni Firebase, para poder probarlas
 * con node (`node panel/copas.test.mjs`).
 *
 * Entra `torneos/` tal como está en la base: por código, `meta`, `players`, `started/<día>`,
 * `results/<día>` y `wild`. No hace falta ninguna señal aparte: el calendario de cada copa
 * dice qué minijuego tocó cada día, y cada resultado trae su puntaje (`s`), su tiempo (`ms`)
 * y su hora (`at`). Las reglas de la copa (qué día va, quién va primero) salen del motor de
 * la copa y no se repiten acá.
 *
 * `torneos/` no está separado por entorno como `stats/`: una copa de prueba es tan real como
 * la de un grupo de amigos. Por eso cada copa trae su marca de laboratorio.
 */
import { juegoDelDia, diaActual, terminada, abierto, cerrado, activos, tabla, inscripcionAbierta, calendario } from '../copa/engine.js';
import { dayOf } from './aggregate.js';

/**
 * Cuánto se da por "jugando ahora" a quien tocó Empezar y no ha terminado. Un minijuego se
 * juega en minutos; pasada media hora sin resultado, lo más probable es que lo haya dejado.
 */
export const JUGANDO_MS = 30 * 60 * 1000;

/** `started` y `results` llegan como arreglo (días 1..7, con el 0 vacío) o como objeto. */
function porDia(nodo) {
  const out = {};
  for (const [d, v] of Object.entries(nodo || {})) if (v && /^[1-9]$/.test(d)) out[Number(d)] = v;
  return out;
}

/** Una copa como la entiende el motor, o `null` si no alcanza a ser una (le falta el calendario). */
export function copaDe(code, x) {
  const m = x?.meta;
  if (!m?.days || !m.win?.[1] || typeof m.end !== 'number') return null;
  return { code, meta: m, players: x.players || {}, started: porDia(x.started), results: porDia(x.results), wild: x.wild || {}, closed: x.closed === true };
}

/** Todas las copas de `torneos/`, las rotas fuera. */
export function copasDe(torneos) {
  return Object.entries(torneos || {}).map(([code, x]) => copaDe(code, x)).filter(Boolean);
}

/**
 * ¿Le tocaba jugar el día `d` a este jugador? Quien se inscribió después de que ese día cerró
 * no pudo jugarlo: no cuenta como minijuego que faltó.
 */
const debia = (m, d, j) => !(typeof j.at === 'number' && j.at >= m.win[d].b);

/** La hora del último resultado de la copa, o 0 si nadie ha jugado. */
export function ultimoResultado(L) {
  let max = 0;
  for (const dia of Object.values(L.results)) for (const r of Object.values(dia || {})) if (r?.at > max) max = r.at;
  return max;
}

/**
 * Qué pasa en una copa ahora: en qué día va, qué minijuego toca, quién lo jugó, quién lo está
 * jugando, quién va primero y cuánto se ha jugado de lo que había para jugar.
 *
 * Puede haber más de un día abierto a la vez (el de ayer se puede jugar hasta el fin de hoy),
 * así que "jugando ahora" mira todos los días abiertos y no solo el último.
 *
 * El dueño ve la tabla completa, con los días que los jugadores todavía no pueden ver: por
 * eso se le pide al motor tal como quedará cuando la copa termine.
 */
export function estadoCopa(L, now = Date.now()) {
  const m = L.meta;
  const dia = diaActual(m, now);
  const jug = activos(L);
  const pids = new Set(jug.map(j => j.pid));
  const nombre = pid => jug.find(j => j.pid === pid)?.name || '?';
  const estado = terminada(m, now) ? 'terminada' : dia === 0 ? 'por-empezar' : 'en-curso';

  const jugando = [];
  for (let d = 1; d <= m.days; d++) {
    if (!abierto(m, d, now)) continue;
    for (const [pid, at] of Object.entries(L.started[d] || {})) {
      if (!pids.has(pid) || L.results[d]?.[pid] || typeof at !== 'number' || now - at > JUGANDO_MS) continue;
      jugando.push({ pid, name: nombre(pid), dia: d, juego: juegoDelDia(m, d), desde: at });
    }
  }

  const hoy = estado === 'en-curso' ? {
    dia, juego: juegoDelDia(m, dia),
    jugadores: jug.map(j => ({
      pid: j.pid, name: j.name,
      jugo: !!L.results[dia]?.[j.pid],
      jugando: jugando.some(x => x.pid === j.pid && x.dia === dia),
    })),
  } : null;
  if (hoy) hoy.jugaron = hoy.jugadores.filter(j => j.jugo).length;

  // De los días que ya cerraron, cuántos minijuegos se jugaron de los que se podían jugar
  let esperado = 0, jugado = 0;
  for (let d = 1; d <= m.days; d++) {
    if (!cerrado(m, d, now)) continue;
    const tocaba = jug.filter(j => debia(m, d, j));
    esperado += tocaba.length;
    jugado += tocaba.filter(j => L.results[d]?.[j.pid]).length;
  }

  const filas = jug.length ? tabla(L, null, Math.max(now, m.end)) : [];
  const primero = filas[0] && filas[0].total > 0 ? { name: filas[0].name, total: filas[0].total, empatados: filas.filter(f => f.lugar === 1).length } : null;

  return {
    code: L.code, name: m.name, alias: m.alias || null, lab: !!m.lab, days: m.days, start: m.start, tz: m.tz,
    createdAt: m.createdAt || 0, end: m.end, estado, dia, hoy, jugando,
    jugadores: jug.length, inscripcion: estado !== 'terminada' && inscripcionAbierta(m, now, L.closed),
    participacion: { jugado, esperado }, primero, ultimo: ultimoResultado(L),
    calendario: calendario(m),
  };
}

/**
 * Las copas que no han terminado, de la que se jugó más recién a la más quieta; las que todavía
 * no empiezan, al final.
 */
export function copasEnCurso(torneos, now = Date.now()) {
  const orden = { 'en-curso': 0, 'por-empezar': 1 };
  return copasDe(torneos).map(L => estadoCopa(L, now)).filter(c => c.estado !== 'terminada')
    .sort((a, b) => orden[a.estado] - orden[b.estado] || (b.jugando.length - a.jugando.length) || (b.ultimo || b.createdAt) - (a.ultimo || a.createdAt));
}

/** ¿La copa estuvo viva en algún momento del rango (números de día)? */
const tocaRango = (m, from, to) => dayOf(m.createdAt || m.win[1].a) <= to && dayOf(m.end - 1) >= from;

const mediana = xs => {
  if (!xs.length) return 0;
  const o = [...xs].sort((a, b) => a - b);
  const k = Math.floor(o.length / 2);
  return o.length % 2 ? o[k] : Math.round((o[k - 1] + o[k]) / 2);
};

/**
 * Las cifras de La Copa en un rango de días (números de día, como el resto del panel).
 *
 * - Una **jugada** es un minijuego terminado: un resultado cuya hora cae en el rango.
 * - Un **abandono** es un minijuego empezado que no terminó: tocó Empezar y no dejó resultado,
 *   y ya no lo está jugando (el día cerró o pasó media hora).
 * - La **participación** es cuántos minijuegos se jugaron de los que se podían jugar: en cada
 *   día cerrado de cada copa, uno por jugador inscrito antes de que ese día cerrara.
 *
 * Por minijuego salen jugadas, abandonos, puntaje promedio (0 a 100) y tiempo mediano: el
 * promedio del tiempo lo arrastra una sola persona que dejó el celular media hora encendido.
 */
export function resumenCopas(torneos, { from, to }, now = Date.now()) {
  const copas = copasDe(torneos);
  const enRango = copas.filter(L => tocaRango(L.meta, from, to));
  const mini = {};
  const porDiaN = {};
  let jugadas = 0, abandonos = 0, esperado = 0, jugado = 0, inscripciones = 0;
  const caja = id => (mini[id] ||= { id, jugadas: 0, abandonos: 0, suma: 0, tiempos: [], copas: new Set() });
  const enElRango = ts => typeof ts === 'number' && dayOf(ts) >= from && dayOf(ts) <= to;

  for (const L of copas) {
    const m = L.meta;
    const pids = new Set(activos(L).map(j => j.pid));
    for (let d = 1; d <= m.days; d++) {
      const id = juegoDelDia(m, d) || '?';
      for (const [pid, r] of Object.entries(L.results[d] || {})) {
        if (!r || !enElRango(r.at)) continue;
        const c = caja(id);
        c.jugadas++; c.suma += Number(r.s) || 0; c.copas.add(L.code);
        if (Number(r.ms) > 0) c.tiempos.push(Number(r.ms));
        jugadas++;
        const k = dayOf(r.at); porDiaN[k] = (porDiaN[k] || 0) + 1;
      }
      for (const [pid, at] of Object.entries(L.started[d] || {})) {
        if (L.results[d]?.[pid] || !pids.has(pid) || !enElRango(at)) continue;
        if (!cerrado(m, d, now) && now - at <= JUGANDO_MS) continue; // todavía lo está jugando
        caja(id).abandonos++; abandonos++;
      }
    }
  }

  for (const L of enRango) {
    const m = L.meta;
    const jug = activos(L);
    inscripciones += jug.length;
    for (let d = 1; d <= m.days; d++) {
      if (!cerrado(m, d, now) || !enElRango(m.win[d].a)) continue;
      const tocaba = jug.filter(j => debia(m, d, j));
      esperado += tocaba.length;
      jugado += tocaba.filter(j => L.results[d]?.[j.pid]).length;
    }
  }

  const porMinijuego = Object.values(mini).map(c => ({
    id: c.id, jugadas: c.jugadas, abandonos: c.abandonos, copas: c.copas.size,
    promedio: c.jugadas ? Math.round(c.suma / c.jugadas) : null, medianaMs: mediana(c.tiempos),
  })).sort((a, b) => b.jugadas - a.jugadas || b.abandonos - a.abandonos || a.id.localeCompare(b.id));

  const porDia = [];
  for (let d = from; d <= to; d++) porDia.push({ day: d, total: porDiaN[d] || 0 });

  return {
    copas: enRango.length,
    nuevas: enRango.filter(L => enElRango(L.meta.createdAt)).length,
    inscripciones, jugadas, abandonos, participacion: { jugado, esperado }, porMinijuego, porDia,
  };
}

/** Las copas del rango, de la más nueva a la más vieja, con lo que el panel pone en cada fila. */
export function bitacoraCopas(torneos, { from, to }, now = Date.now()) {
  return copasDe(torneos).filter(L => tocaRango(L.meta, from, to))
    .map(L => estadoCopa(L, now))
    .sort((a, b) => b.createdAt - a.createdAt || a.code.localeCompare(b.code));
}

/** Porcentaje entero, o `null` si no había nada que jugar todavía. */
export const pct = ({ jugado, esperado }) => (esperado ? Math.round((jugado / esperado) * 100) : null);

/** "2:15" o "1:02:15": el tiempo de un minijuego. */
export function duracion(ms) {
  const s = Math.round((Number(ms) || 0) / 1000);
  const h = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  const dos = x => String(x).padStart(2, '0');
  return h ? `${h}:${dos(mm)}:${dos(ss)}` : `${mm}:${dos(ss)}`;
}

/** Fecha corta del primer día de la copa ("24 sept"), leída como texto para no correrla de zona. */
export function inicioLabel(start) {
  const [y, mo, d] = String(start || '').split('-').map(Number);
  if (!y || !mo || !d) return '?';
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

