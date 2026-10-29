/**
 * Uno al día con jugador (D-230): lo que va a Firebase y lo que se lee de ahí. Sin jugador, Uno al
 * día funciona igual con lo del celular (`uno-al-dia.js`); con jugador, la historia pasa de un
 * celular a otro, entra a los rankings (del día, de la semana y de rachas) y las invitaciones dan
 * comodines. Todo es de mejor esfuerzo: sin red, la pantalla sigue con lo del celular.
 *
 * Las invitaciones: el link `today/?inv=<jid>` deja anotado en el celular quién invitó. Cuando ese
 * celular termina su primer Uno al día, se lo cuenta a Firebase (`invitados/<jid>/<uid>`) y quien
 * invitó gana un comodín, que su celular suma al leer la lista.
 */
import {
  estado, leer, juntar, numDia, fechaDeNum, semanaDe, recorrer, porJuego, fechaLocal, KEY,
} from './uno-al-dia.js';
import { UNO_AL_DIA, UAD_RACHA, periodoDia, periodoMes, SIEMPRE, esJid, ordenar } from './records.js';
import { walk, lateDays, seasonOf } from './daily-points.js';
import { trackUnoAlDia } from './transport/stats.js';
import { flag } from './flags.js';
import { tiene } from './parametros.js';

/**
 * The night's totals (D-500), behind their flag (D-498). lab: #seccion-uad-night-totals. On, this
 * phone writes only raw events (the history, its 🧊 markers, the day's row, the acceptances): the
 * month's points, the +10 per friend, the week's sum and the best streak are written only by the
 * rebuild (`uad-rebuild.yml`, every hour), and /today/ adds this phone's own days the rebuild has
 * not counted yet (`conMiCuenta`). Test scripts get it only with `?lab`; node, only through `forzarNoche`.
 */
let forzada = null;
export const forzarNoche = v => { forzada = v; };
export const nocheTotales = async () => {
  if (forzada != null) return forzada;
  if (!globalThis.location || (tiene('test') && !tiene('lab'))) return false;
  return flag('uad-night-totals').catch(() => false);
};

/** Quién invitó a este celular (el `jid` del link), si alguien. */
export const INV_KEY = 'juegos-de-salon:uno-al-dia:inv';
/** Cuántos desafíos aceptados ya vio quien invita: los nuevos se le avisan una vez. */
const VISTOS_KEY = 'juegos-de-salon:uno-al-dia:aceptados';

const leerLs = (k, def = null) => { try { return localStorage.getItem(k) ?? def; } catch (_) { return def; } };
const ponerLs = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); } catch (_) { /* sin memoria */ } };

/** El jugador, o null si los rankings no se ven (y entonces Uno al día queda en el celular). */
async function J() {
  const m = await import('./jugador.js');
  return m.rankingsVisibles() ? m.jugador() : null;
}

/** Anota quién invitó, al abrir el link (no si es uno mismo). */
export async function recordarInvitacion(jid) {
  if (!esJid(jid)) return null;
  const j = await J().catch(() => null);
  if (j?.yo()?.jid === jid) return null;
  // Se cuenta una vez por celular y por quien invita, aunque se vuelva a abrir el link
  if (leerLs(INV_KEY) !== jid) trackUnoAlDia('invitacion');
  ponerLs(INV_KEY, jid);
  return jid;
}
export const invitador = () => { const j = leerLs(INV_KEY); return esJid(j) ? j : null; };

/**
 * Después de terminar el de hoy: sube el primer intento (historia, día, semana, racha) y, si fue el
 * primer Uno al día de este celular y alguien lo invitó, se lo cuenta. Devuelve lo que pasó.
 */
export async function subirHoy({ fecha, dia }) {
  const out = { subido: null, invitacion: false };
  const j = await J().catch(() => null);
  if (!j) return out;
  const e = estado();
  const n = numDia(fecha);
  const noche = await nocheTotales();
  // The points need the day's start on the server (D-433, D-465): written when the attempt began,
  // or now if that write did not get through
  if (j.yo()) await j.empezarDia({ n }).catch(() => false);
  if (j.yo()) out.subido = await j.anotarDia({ n, j: dia.j, s: dia.s, ms: dia.ms, semanaP: semanaDe(fecha), mejor: e.mejor, totales: !noche }).catch(() => null);
  // Uno al día points (D-412, D-414): today's, into the month's season (with the night's totals, the rebuild's)
  if (j.yo() && !noche) out.puntos = await j.anotarPuntosDia({ n, mesP: periodoMes(fecha), racha: e.racha }).catch(() => false);
  const inv = invitador();
  // El primero de este celular: solo hay un día jugado, el de hoy
  if (inv && e.jugados === 1 && e.dias[fecha]) {
    out.invitacion = await j.aceptarInvitacion(inv, n).catch(() => false);
    if (out.invitacion) trackUnoAlDia('aceptada');
    const quien = await j.publico(inv).catch(() => null);
    if (quien) j.conocer({ [inv]: quien.n });
  }
  return out;
}

/** The start of today's first attempt in Firebase (D-433), with a player. Best effort. */
export async function empezarEnRed(fecha) {
  const j = await J().catch(() => null);
  return j?.yo() ? j.empezarDia({ n: numDia(fecha) }).catch(() => false) : false;
}

/**
 * Today's first attempt started on another phone (or on this one before its memory was cleared)
 * and never finished (D-433): `{ at }`, the server time it started, or null. Without a player, or
 * if Firebase does not answer within `ms`, null: the attempt is not lost on a doubt.
 */
export async function empezadoEnOtro(fecha, { ms = 2500 } = {}) {
  const leerlo = (async () => {
    const j = await J().catch(() => null);
    if (!j?.yo()) return null;
    const n = numDia(fecha);
    const [at, hist] = await Promise.all([j.inicioDia(n), j.historialDia()]);
    return typeof at === 'number' && !hist?.[n]?.j ? { at } : null;
  })().catch(() => null);
  return Promise.race([leerlo, new Promise(r => setTimeout(() => r(null), ms))]);
}

/**
 * Al abrir /today/ (o entrar con el jugador): junta la historia de Firebase y los comodines por
 * invitar con lo del celular, suma a Amigos a quienes aceptaron los desafíos, y sube el de hoy si se
 * jugó antes de entrar. Devuelve `{ nuevos, late }`: los desafíos aceptados desde la última vez, con
 * nombre, and the dates uploaded too late for points (`lateDays`, #879), for the calendar.
 */
export async function sincronizar() {
  const j = await J().catch(() => null);
  const yo = j?.yo();
  if (!yo) return { nuevos: [], late: [] };
  const [hist, invitados] = await Promise.all([j.historialDia().catch(() => ({})), j.invitados().catch(() => [])]);
  const dias = Object.fromEntries(Object.entries(hist).filter(([k]) => /^[0-9]{5}$/.test(k)).map(([k, x]) => [fechaDeNum(Number(k)), x]));
  juntar({ dias, regalos: invitados.map(x => fechaDeNum(x.d)) });
  // Lo de hoy jugado en este celular antes de entrar con el jugador
  const hoy = fechaLocal(), locales = leer().dias, mio = locales[hoy];
  const noche = await nocheTotales();
  if (mio && !dias[hoy]) await j.empezarDia({ n: numDia(hoy) }).catch(() => false);
  if (mio && !dias[hoy]) await j.anotarDia({ n: numDia(hoy), j: mio.j, s: mio.s, ms: mio.ms, semanaP: semanaDe(hoy), mejor: estado().mejor, totales: !noche }).catch(() => null);
  // Los días viejos de este celular que Firebase no tiene van a la historia (no a los rankings de su
  // día ni de su semana, que ya pasaron): así la racha sigue en otro celular
  for (const [f, x] of Object.entries(locales)) {
    if (f === hoy || dias[f] || !x?.j) continue;
    await j.anotarDia({ n: numDia(f), j: x.j, s: x.s, ms: x.ms, soloHistoria: true }).catch(() => null);
  }
  // The days this phone's 🧊 saved go up as markers (D-415), so the server's walk keeps the streak
  // through them as this phone does (the backfill's rebuild corrects the month's total with them)
  const w = walk(leer().dias, hoy, { gifts: leer().regalos || [] });
  for (const d of w.days.filter(x => x.saved && !hist[numDia(x.date)])) await j.anotarSalvado({ n: numDia(d.date) }).catch(() => false);
  // Uno al día points (D-414): this month's days that don't count yet, in order (the streak of
  // each, as walk() gives it); the history read above says which already do (`p`). Only today and
  // yesterday: the rules let a day's points in only near its own date (D-465)
  const mes = hoy.slice(0, 7);
  if (!noche) for (const d of w.days.filter(x => x.played && x.date.startsWith(mes) && numDia(x.date) >= numDia(hoy) - 1 && !hist[numDia(x.date)]?.p)) {
    await j.anotarPuntosDia({ n: numDia(d.date), mesP: periodoMes(hoy), racha: d.streak }).catch(() => false);
  }
  // Each friend who accepted adds +10 to the month they accepted in, once (D-414)
  if (!noche && invitados.some(x => !x.p && periodoMes(fechaDeNum(x.d)) >= 's2026-10')) {
    for (const x of invitados.filter(x => !x.p && periodoMes(fechaDeNum(x.d)) >= 's2026-10')) await j.anotarInvitado({ uid: x.uid, mesP: periodoMes(fechaDeNum(x.d)) }).catch(() => false);
  }
  // Los que aceptaron y tienen jugador quedan en Amigos
  const conNombre = await Promise.all(invitados.map(async x => ({ ...x, n: x.j ? (await j.publico(x.j).catch(() => null))?.n || null : null })));
  j.conocer(Object.fromEntries(conNombre.filter(x => x.j && x.n).map(x => [x.j, x.n])));
  const vistos = Number(leerLs(VISTOS_KEY, '0')) || 0;
  ponerLs(VISTOS_KEY, conNombre.length);
  return { nuevos: conNombre.length > vistos ? conNombre.slice(vistos) : [], late: lateDays(hist) };
}

/**
 * The month's table with this phone's own count (D-500): the rebuild's row `fila` (null before it
 * counted anyone's day) plus the points of the days this phone played after its last counted day
 * `u`, so /today/ shows today's points before the rebuild runs. `filas` are the table read, best
 * first; `w` this phone's walk. Returns `{ fila, delante }` with the place among the others, or
 * the same ones when nothing is pending.
 */
export function conMiCuenta({ filas, jid, w, hoy }) {
  const i = filas.findIndex(f => f.jid === jid);
  const fila = i >= 0 ? filas[i] : null;
  const u = Number(fila?.u) || 0;
  const mes = seasonOf(hoy);
  const pend = w.days.filter(d => d.played && d.date.startsWith(mes) && numDia(d.date) > u).reduce((a, d) => a + d.points, 0);
  if (!pend) return { fila, delante: i > 0 ? filas[i - 1] : null };
  const s = (fila?.s || 0) + pend;
  // Ties share the place, as the table does (the month's rows all have ms 0)
  const arriba = filas.filter(f => f.jid !== jid && f.s > s);
  return { fila: { ...(fila || { jid }), s, puesto: arriba.length + 1 }, delante: arriba.at(-1) || null };
}

/**
 * The month's ranking as /today/ lists it (D-500): this player's row with the same total the big
 * number shows (`conMiCuenta`), and the list ordered again, so the two never disagree. `v` is a read
 * table, `{ top, vecinos }`; a row among the neighbours only changes its points and place.
 */
export function tablaConMiCuenta(v, { jid, w, hoy }) {
  const top = v?.top || [], vecinos = v?.vecinos || [];
  const c = conMiCuenta({ filas: [...top, ...vecinos], jid, w, hoy });
  const antes = [...top, ...vecinos].find(f => f.jid === jid);
  // Not listed (no row before the rebuild counts a day) or nothing pending: the table as read
  if (!antes || c.fila === antes) return v;
  if (vecinos.some(f => f.jid === jid)) return { ...v, vecinos: vecinos.map(f => (f.jid === jid ? { ...f, s: c.fila.s, puesto: c.fila.puesto } : f)) };
  return { ...v, top: ordenar(top.map(f => (f.jid === jid ? { ...f, s: c.fila.s, ms: 0 } : f))) };
}

/** Las filas leídas de una tabla de Uno al día (hasta 100, en orden). */
async function filas(tabla, periodo) {
  const j = await J().catch(() => null);
  if (!j) return null;
  const v = await j.tabla(tabla, periodo, { top: 100 }).catch(() => null);
  return v ? v.top : null;
}

/**
 * "Mejor que el 64 % de los que jugaron hoy": solo con 20 o más jugadores y menos de 100 leídos
 * (con más, el total no se sabe y el porcentaje sería inventado). null si no se puede decir.
 */
export async function porcentajeHoy(fecha, s) {
  const f = await filas(UNO_AL_DIA, periodoDia(numDia(fecha)));
  if (!f || f.length < 20 || f.length >= 100) return null;
  return Math.floor((f.filter(x => x.s < s).length / f.length) * 100);
}

/** Un porcentaje de arriba de una tabla, subido al escalón siguiente (10, 15, 20, 25): nunca miente. */
export const escalon = p => Math.max(10, Math.ceil(p / 5) * 5);

/**
 * El dato de quien invita (D-230): los dos primeros que son verdad, en este orden: racha (7 o más),
 * puesto (en el 25 % mejor de la semana o de las rachas, con 20 o más en la tabla), hoy (mejor que la
 * mitad, con 20 o más), mejora (su flecha sube en algún juego) y, si nada, cuántos días lleva.
 * Devuelve las claves y sus números, `[{ k, ... }]`; la pantalla los escribe en primera o tercera persona.
 */
export async function datosDe({ dias, hoy = fechaLocal(), jid = null, regalos = [] }) {
  const r = recorrer(dias, hoy, { regalos });
  const out = [];
  if (r.racha >= 7) out.push({ k: 'racha', n: r.racha });
  if (jid) {
    for (const [tabla, periodo, cual] of [[UNO_AL_DIA, semanaDe(hoy), 'semana'], [UAD_RACHA, SIEMPRE, 'rachas']]) {
      if (out.length >= 2 || out.some(x => x.k === 'puesto')) break;
      const f = await filas(tabla, periodo);
      if (!f || f.length < 20 || f.length >= 100) continue;
      const i = f.findIndex(x => x.jid === jid);
      if (i < 0) continue;
      const p = ((i + 1) / f.length) * 100;
      if (p <= 25) out.push({ k: 'puesto', p: escalon(p), tabla: cual });
    }
  }
  if (out.length < 2 && dias[hoy]) {
    const pct = jid ? await porcentajeHoy(hoy, dias[hoy].s) : null;
    if (pct != null && pct >= 50) out.push({ k: 'hoy', s: dias[hoy].s, p: pct });
  }
  if (out.length < 2) {
    const sube = porJuego(dias).filter(g => g.tendencia > 0).sort((a, b) => b.tendencia - a.tendencia)[0];
    if (sube) out.push({ k: 'mejora', id: sube.id });
  }
  if (!out.length) out.push({ k: 'constancia', n: Object.keys(dias).length });
  return out.slice(0, 2);
}

/** Lo de quien invitó, para su tarjeta: nombre y datos de hoy. null si no se puede leer. */
export async function quienInvita(jid) {
  const j = await J().catch(() => null);
  if (!j || !esJid(jid)) return null;
  const p = await j.publico(jid).catch(() => null);
  if (!p) return null;
  const hist = await j.historialDia(jid).catch(() => ({}));
  const dias = Object.fromEntries(Object.entries(hist).filter(([k]) => /^[0-9]{5}$/.test(k)).map(([k, x]) => [fechaDeNum(Number(k)), x]));
  return { jid, n: p.n, co: p.co, dias, datos: await datosDe({ dias, jid }) };
}

/** Los datos de este celular, para el mensaje de invitar. */
export async function misDatos() {
  const d = leer();
  const j = await J().catch(() => null);
  return datosDe({ dias: d.dias, jid: j?.yo()?.jid || null, regalos: d.regalos || [] });
}

/** El link para invitar: con mi `jid` si tengo jugador (así el amigo ve quién lo desafía). */
export async function linkInvitar(base) {
  const j = await J().catch(() => null);
  const yo = j?.yo();
  // La base puede traer ya `?lang=de`: el invitador va como un parámetro más
  return yo ? `${base}${base.includes('?') ? '&' : '?'}inv=${yo.jid}` : base;
}
export const tengoJugador = async () => !!(await J().catch(() => null))?.yo();

export { KEY };
