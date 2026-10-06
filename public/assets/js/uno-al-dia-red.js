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
import { UNO_AL_DIA, UAD_RACHA, periodoDia, SIEMPRE, esJid } from './records.js';
import { trackUnoAlDia } from './transport/stats.js';

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
  if (j.yo()) out.subido = await j.anotarDia({ n, j: dia.j, s: dia.s, ms: dia.ms, semanaP: semanaDe(fecha), mejor: e.mejor }).catch(() => null);
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

/**
 * Al abrir /today/ (o entrar con el jugador): junta la historia de Firebase y los comodines por
 * invitar con lo del celular, suma a Amigos a quienes aceptaron los desafíos, y sube el de hoy si se
 * jugó antes de entrar. Devuelve `{ nuevos }`: los desafíos aceptados desde la última vez, con nombre.
 */
export async function sincronizar() {
  const j = await J().catch(() => null);
  const yo = j?.yo();
  if (!yo) return { nuevos: [] };
  const [hist, invitados] = await Promise.all([j.historialDia().catch(() => ({})), j.invitados().catch(() => [])]);
  const dias = Object.fromEntries(Object.entries(hist).filter(([k]) => /^[0-9]{5}$/.test(k)).map(([k, x]) => [fechaDeNum(Number(k)), x]));
  juntar({ dias, regalos: invitados.map(x => fechaDeNum(x.d)) });
  // Lo de hoy jugado en este celular antes de entrar con el jugador
  const hoy = fechaLocal(), locales = leer().dias, mio = locales[hoy];
  if (mio && !dias[hoy]) await j.anotarDia({ n: numDia(hoy), j: mio.j, s: mio.s, ms: mio.ms, semanaP: semanaDe(hoy), mejor: estado().mejor }).catch(() => null);
  // Los días viejos de este celular que Firebase no tiene van a la historia (no a los rankings de su
  // día ni de su semana, que ya pasaron): así la racha sigue en otro celular
  for (const [f, x] of Object.entries(locales)) {
    if (f === hoy || dias[f] || !x?.j) continue;
    await j.anotarDia({ n: numDia(f), j: x.j, s: x.s, ms: x.ms, soloHistoria: true }).catch(() => null);
  }
  // Los que aceptaron y tienen jugador quedan en Amigos
  const conNombre = await Promise.all(invitados.map(async x => ({ ...x, n: x.j ? (await j.publico(x.j).catch(() => null))?.n || null : null })));
  j.conocer(Object.fromEntries(conNombre.filter(x => x.j && x.n).map(x => [x.j, x.n])));
  const vistos = Number(leerLs(VISTOS_KEY, '0')) || 0;
  ponerLs(VISTOS_KEY, conNombre.length);
  return { nuevos: conNombre.length > vistos ? conNombre.slice(vistos) : [] };
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
