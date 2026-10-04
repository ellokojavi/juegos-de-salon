/**
 * La Copa en el panel del dueño. Funciones puras, sin DOM ni Firebase, para poder probarlas
 * con node (`node public/panel/copas.test.mjs`).
 *
 * Entra `torneos/` tal como está en la base: por código, `meta`, `players`, `started/<día>`,
 * `results/<día>` y `wild`. No hace falta ninguna señal aparte: el calendario de cada copa
 * dice qué juego tocó cada día, y cada resultado trae su puntaje (`s`), su tiempo (`ms`)
 * y su hora (`at`). Las reglas de la copa (qué día va, quién va primero) salen del motor de
 * la copa y no se repiten acá.
 *
 * `torneos/` no está separado por entorno como `stats/`: una copa de prueba es tan real como
 * la de un grupo de amigos. Por eso cada copa trae su marca de laboratorio.
 */
import { juegoDelDia, diaActual, terminada, abierto, cerrado, activos, tabla, inscripcionAbierta, calendario, cerrarEn, comodinDe, esFinal } from '../cup/engine.js';
import { dayOf } from './aggregate.js';

/**
 * Cuánto se da por "jugando ahora" a quien tocó Empezar y no ha terminado. Un juego se
 * juega en minutos; pasada media hora sin resultado, lo más probable es que lo haya dejado.
 */
export const JUGANDO_MS = 30 * 60 * 1000;

/** `started` y `results` llegan como arreglo (días 1..7, con el 0 vacío) o como objeto. */
function porDia(nodo) {
  const out = {};
  for (const [d, v] of Object.entries(nodo || {})) if (v && /^[1-9]$/.test(d)) out[Number(d)] = v;
  return out;
}

/**
 * Una copa como la entiende el motor, o `null` si no alcanza a ser una (le falta el calendario).
 *
 * Si el admin la terminó antes (`fin`, D-161), se ve como quedó: termina ahí y los días que no
 * alcanzaron a abrir no cuentan. Sin esto el panel la seguía mostrando en curso hasta su fecha.
 */
export function copaDe(code, x) {
  const m = x?.meta;
  if (!m?.days || !m.win?.[1] || typeof m.end !== 'number') return null;
  const fin = typeof x.fin === 'number' ? x.fin : null;
  return { code, meta: fin ? cerrarEn(m, fin) : m, players: x.players || {}, started: porDia(x.started), results: porDia(x.results), wild: x.wild || {}, closed: x.closed === true, fin };
}

/** El país de un jugador de la copa (`co`, dos letras), si se inscribió con una versión que lo guarda. */
export const paisDe = (L, pid) => (/^[A-Z]{2}$/.test(L.players?.[pid]?.co || '') ? L.players[pid].co : '');

/** Todas las copas de `torneos/`, las rotas fuera. */
export function copasDe(torneos) {
  return Object.entries(torneos || {}).map(([code, x]) => copaDe(code, x)).filter(Boolean);
}

/**
 * ¿Le tocaba jugar el día `d` a este jugador? Quien se inscribió después de que ese día cerró
 * no pudo jugarlo: no cuenta como juego que faltó.
 */
const debia = (m, d, j) => !(typeof j.at === 'number' && j.at >= m.win[d].b);

/** La hora del último resultado de la copa, o 0 si nadie ha jugado. */
export function ultimoResultado(L) {
  let max = 0;
  for (const dia of Object.values(L.results)) for (const r of Object.values(dia || {})) if (r?.at > max) max = r.at;
  return max;
}

/**
 * Qué pasa en una copa ahora: en qué día va, qué juego toca, quién lo jugó, quién lo está
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
      jugando.push({ pid, name: nombre(pid), co: paisDe(L, pid), dia: d, juego: juegoDelDia(m, d), desde: at });
    }
  }

  const hoy = estado === 'en-curso' ? {
    dia, juego: juegoDelDia(m, dia),
    jugadores: jug.map(j => ({
      pid: j.pid, name: j.name, co: paisDe(L, j.pid),
      jugo: !!L.results[dia]?.[j.pid],
      jugando: jugando.some(x => x.pid === j.pid && x.dia === dia),
    })),
  } : null;
  if (hoy) hoy.jugaron = hoy.jugadores.filter(j => j.jugo).length;

  // De los días que ya cerraron, cuántos juegos se jugaron de los que se podían jugar
  let esperado = 0, jugado = 0;
  for (let d = 1; d <= m.days; d++) {
    if (!cerrado(m, d, now)) continue;
    const tocaba = jug.filter(j => debia(m, d, j));
    esperado += tocaba.length;
    jugado += tocaba.filter(j => L.results[d]?.[j.pid]).length;
  }

  const filas = jug.length ? tabla(L, null, Math.max(now, m.end)) : [];
  const primero = filas[0] && filas[0].total > 0 ? { name: filas[0].name, co: paisDe(L, filas[0].pid), total: filas[0].total, empatados: filas.filter(f => f.lugar === 1).length } : null;

  return {
    code: L.code, name: m.name, alias: m.alias || null, lab: !!m.lab, days: m.days, start: m.start, tz: m.tz, fin: L.fin || null,
    // El idioma de la copa (D-211): la meta solo lo guarda si no es español
    lang: m.lang || 'es',
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
 * - Una **jugada** es un juego terminado: un resultado cuya hora cae en el rango.
 * - Un **abandono** es un juego empezado que no terminó: tocó Empezar y no dejó resultado,
 *   y ya no lo está jugando (el día cerró o pasó media hora).
 * - La **participación** es cuántos juegos se jugaron de los que se podían jugar: en cada
 *   día cerrado de cada copa, uno por jugador inscrito antes de que ese día cerrara.
 *
 * Por juego salen jugadas, abandonos, puntaje promedio (0 a 100) y tiempo mediano: el
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

  const porJuego = Object.values(mini).map(c => ({
    id: c.id, jugadas: c.jugadas, abandonos: c.abandonos, copas: c.copas.size,
    promedio: c.jugadas ? Math.round(c.suma / c.jugadas) : null, medianaMs: mediana(c.tiempos),
  })).sort((a, b) => b.jugadas - a.jugadas || b.abandonos - a.abandonos || a.id.localeCompare(b.id));

  const porDia = [];
  for (let d = from; d <= to; d++) porDia.push({ day: d, total: porDiaN[d] || 0 });

  return {
    copas: enRango.length,
    nuevas: enRango.filter(L => enElRango(L.meta.createdAt)).length,
    inscripciones, jugadas, abandonos, participacion: { jugado, esperado }, porJuego, porDia,
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

/** "2:15" o "1:02:15": el tiempo de un juego. */
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


/* ------------------------------------------------------------------ */
/* La ficha de una copa                                                */
/* ------------------------------------------------------------------ */

/** La copa con ese código, o la que tiene ese link propio (`/oficina`). `null` si no hay ninguna. */
export function buscarCopa(torneos, q) {
  const t = String(q || '').trim().replace(/^\//, '');
  if (!t) return null;
  const copas = copasDe(torneos);
  return copas.find(L => L.code === t.toUpperCase()) || copas.find(L => L.meta.alias && L.meta.alias === t.toLowerCase()) || null;
}

/**
 * Qué pasó con un jugador en un día de la copa: una casilla de la grilla jugador × día.
 *
 *   jugo          tiene resultado: puntaje, tiempo y los puntos que le dio en la tabla
 *   jugando       tocó Empezar hace menos de media hora y el día sigue abierto
 *   sin-terminar  tocó Empezar y no dejó resultado (pasó media hora o el día cerró)
 *   abierto       el día está abierto y todavía no lo empieza
 *   no-jugo       el día cerró sin que lo empezara
 *   no-debia      se inscribió después de que ese día cerró: no le tocaba
 *   anulado       el admin terminó la copa antes de que ese día abriera
 *   futuro        el día todavía no abre
 *
 * `x2` dice si ese día vale doble para él: la final, o el día que eligió de comodín.
 */
export function casilla(L, d, j, filaTabla, now = Date.now()) {
  const m = L.meta;
  const w = m.win[d];
  const x2 = esFinal(m, d) || comodinDe(L, j.pid) === d;
  const comodin = comodinDe(L, j.pid) === d;
  const r = L.results[d]?.[j.pid];
  if (r) return { tipo: 'jugo', s: Number(r.s) || 0, ms: Number(r.ms) || 0, at: r.at || 0, pts: filaTabla?.dias?.[d]?.pts ?? null, x2, comodin };
  if (L.fin && w.a >= L.fin) return { tipo: 'anulado', x2, comodin };
  if (now < w.a) return { tipo: 'futuro', x2, comodin };
  const empezo = L.started[d]?.[j.pid];
  if (typeof empezo === 'number') {
    const sigue = abierto(m, d, now) && now - empezo <= JUGANDO_MS;
    return { tipo: sigue ? 'jugando' : 'sin-terminar', desde: empezo, x2, comodin };
  }
  if (abierto(m, d, now)) return { tipo: 'abierto', x2, comodin };
  if (!debia(m, d, j)) return { tipo: 'no-debia', x2, comodin };
  return { tipo: 'no-jugo', x2, comodin };
}

/**
 * Lo que pasó en la copa, del más nuevo al más viejo. Cada evento: `{ at, tipo, texto, pid? }`.
 * Lo que la base guarda sin hora (el comodín, el retiro, la inscripción cerrada) va aparte, en
 * `sinHora`: ponerle una hora inventada sería mentir sobre cuándo pasó.
 */
export function historiaCopa(L, now = Date.now()) {
  const m = L.meta;
  const ev = [];
  const sinHora = [];
  const nombre = pid => L.players[pid]?.name || '?';
  const admin = nombre(m.admin);
  if (m.createdAt) ev.push({ at: m.createdAt, tipo: 'creada', pid: m.admin, texto: `${admin} creó la copa: ${m.days} días` });
  for (const [pid, p] of Object.entries(L.players)) {
    if (typeof p?.at === 'number' && p.at > 1e12 && pid !== m.admin) ev.push({ at: p.at, tipo: 'inscripcion', pid, texto: `${p.name} se inscribió` });
    if (p?.out) sinHora.push({ tipo: 'retiro', pid, texto: `${p.name} salió de la copa: lo retiró el admin` });
  }
  const jug = activos(L);
  for (let d = 1; d <= m.days; d++) {
    const juego = juegoDelDia(m, d);
    for (const [pid, at] of Object.entries(L.started[d] || {})) {
      if (typeof at !== 'number') continue;
      ev.push({ at, tipo: 'empezo', pid, dia: d, juego, texto: `${nombre(pid)} empezó el día ${d}` });
      const r = L.results[d]?.[pid];
      if (r?.at) ev.push({ at: r.at, tipo: 'termino', pid, dia: d, juego, s: Number(r.s) || 0, ms: Number(r.ms) || 0, texto: `${nombre(pid)} terminó el día ${d}` });
      else if (!abierto(m, d, now) || now - at > JUGANDO_MS) ev.push({ at: Math.min(at + JUGANDO_MS, m.win[d].b), tipo: 'sin-terminar', pid, dia: d, juego, texto: `${nombre(pid)} dejó sin terminar el día ${d}` });
    }
    // Un resultado sin "empezó" (de antes de que se anotara) igual cuenta
    for (const [pid, r] of Object.entries(L.results[d] || {})) {
      if (r?.at && typeof L.started[d]?.[pid] !== 'number') ev.push({ at: r.at, tipo: 'termino', pid, dia: d, juego, s: Number(r.s) || 0, ms: Number(r.ms) || 0, texto: `${nombre(pid)} terminó el día ${d}` });
    }
    if (m.win[d].a <= now && !(L.fin && m.win[d].a >= L.fin)) ev.push({ at: m.win[d].a, tipo: 'abrio', dia: d, juego, texto: `Abrió el día ${d}` });
    if (cerrado(m, d, now) && !(L.fin && m.win[d].a >= L.fin)) {
      const tocaba = jug.filter(j => debia(m, d, j));
      const jugaron = tocaba.filter(j => L.results[d]?.[j.pid]).length;
      ev.push({ at: m.win[d].b, tipo: 'cerro', dia: d, juego, texto: `Cerró el día ${d}: jugaron ${jugaron} de ${tocaba.length}` });
    }
  }
  for (const [pid, d] of Object.entries(L.wild || {})) sinHora.push({ tipo: 'comodin', pid, dia: Number(d), texto: `${nombre(pid)} usó el comodín en el día ${d}` });
  // Con el pid del admin, para que su nombre lleve la bandera como los demás
  if (L.closed) sinHora.push({ tipo: 'cerrada', pid: m.admin, texto: `${admin} cerró la inscripción` });
  if (L.fin) ev.push({ at: L.fin, tipo: 'fin', pid: m.admin, texto: `${admin} terminó la copa antes de tiempo` });
  else if (terminada(m, now)) ev.push({ at: m.end, tipo: 'fin', texto: 'La copa terminó' });
  // A igual hora, primero lo que ocurrió después en la lógica: el cierre antes que la apertura del día siguiente
  const peso = { fin: 0, cerro: 1, termino: 2, 'sin-terminar': 3, empezo: 4, abrio: 5, inscripcion: 6, creada: 7 };
  ev.sort((a, b) => b.at - a.at || (peso[a.tipo] ?? 9) - (peso[b.tipo] ?? 9));
  return { eventos: ev, sinHora };
}

/**
 * Todo lo de una copa para su ficha: lo de `estadoCopa`, más la tabla completa, cada día con su
 * juego y su ventana, la grilla jugador × día, los retirados y la historia.
 */
export function fichaCopa(L, now = Date.now()) {
  const m = L.meta;
  const base = estadoCopa(L, now);
  const jug = activos(L);
  const filas = jug.length ? tabla(L, null, Math.max(now, m.end)) : [];
  const porPid = Object.fromEntries(filas.map(f => [f.pid, f]));
  const dias = [];
  for (let d = 1; d <= m.days; d++) {
    const w = m.win[d];
    const anuladoDia = !!L.fin && w.a >= L.fin;
    const estado = anuladoDia ? 'anulado' : now < w.a ? 'futuro' : abierto(m, d, now) ? 'abierto' : 'cerrado';
    const tocaba = jug.filter(j => debia(m, d, j));
    dias.push({ d, juego: juegoDelDia(m, d), a: w.a, b: w.b, estado, final: esFinal(m, d), jugaron: tocaba.filter(j => L.results[d]?.[j.pid]).length, de: tocaba.length });
  }
  const orden = filas.length ? filas.map(f => jug.find(j => j.pid === f.pid)) : jug;
  const grilla = orden.map(j => {
    const f = porPid[j.pid];
    return { pid: j.pid, name: j.name, co: paisDe(L, j.pid), at: j.at, lugar: f?.lugar ?? null, total: f?.total ?? 0, comodin: comodinDe(L, j.pid) || null,
      casillas: dias.map(x => casilla(L, x.d, j, f, now)) };
  });
  const retirados = Object.entries(L.players).filter(([, p]) => p?.out).map(([pid, p]) => ({ pid, name: p.name, co: paisDe(L, pid) }));
  const abiertoHoy = dias.filter(x => x.estado === 'abierto').map(x => x.d);
  return {
    ...base,
    admin: { pid: m.admin, name: L.players[m.admin]?.name || '?', co: paisDe(L, m.admin) },
    lang: m.lang || 'es', aud: m.aud || null, closed: L.closed, joinUntil: m.joinUntil ?? null,
    dias, abiertos: abiertoHoy, grilla, retirados, historia: historiaCopa(L, now),
  };
}
