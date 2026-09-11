/**
 * Limpieza de salas viejas en Firebase (canon C-7).
 *
 * Una sala vence a las 6 horas, pero nadie la borra: el creador ya cerró el navegador.
 * La papelera es el índice que permite encontrarlas sin poder listar `rooms/`:
 *
 *   cleanup/
 *     sweptDay: <día ya barrido>          marca de agua, para no revisar lo mismo dos veces
 *     days/<día>/
 *       lastAt: <marca del último apunte> el reloj del servidor, no el del celular
 *       rooms/<CÓDIGO>: true
 *
 * Al crear (y al entrar a) una sala se apunta su código en el balde de su día. Las reglas
 * solo dejan leer un balde cuando pasaron 6 horas desde su último apunte: cuando se puede
 * leer, todas sus salas están vencidas, así que el índice nunca revela una sala viva.
 *
 * Barrer es entonces: leer los baldes de los días que faltan, borrar esas salas y borrar
 * el balde. Lo hace cualquier celular que cree o entre a una sala, en segundo plano y como
 * mucho una vez cada 6 horas (no hay servidor: el plan gratuito no tiene Cloud Functions).
 *
 * Todo el acceso a la base entra por `api` para poder probar esto con node sin Firebase:
 *   { read(ruta), update(ruta, cambios), remove(ruta), stamp() }
 */
export const ROOM_TTL = 6 * 60 * 60 * 1000;   // vida de una sala (igual que en las reglas)
const DAY = 24 * 60 * 60 * 1000;
const RESCUE_DAYS = 8;                        // días que se revisan siempre, ignorando la marca
const MAX_DAYS = 30;                          // tope de baldes por barrido
const SWEEP_EVERY = 6 * 60 * 60 * 1000;       // un barrido por celular cada 6 horas
const SWEEP_KEY = 'juegos-de-salon:sweep';

/** Día (balde) al que pertenece una marca de tiempo. */
export const dayOf = ts => Math.floor(ts / DAY);

/**
 * Días que toca revisar: desde el siguiente a la marca de agua hasta ayer.
 * Siempre se vuelven a mirar los últimos RESCUE_DAYS días, porque la marca es pública y
 * alguien podría adelantarla; y nunca más de MAX_DAYS baldes, para no gastar cuota de golpe.
 * Hoy no se toca: todavía se están creando salas en ese balde.
 */
export function daysToSweep(sweptDay, today) {
  const fromMark = typeof sweptDay === 'number' ? sweptDay + 1 : today - RESCUE_DAYS;
  const first = Math.max(Math.min(fromMark, today - RESCUE_DAYS), today - MAX_DAYS);
  const days = [];
  for (let d = first; d < today; d++) days.push(d);
  return days;
}

/**
 * Apunta una sala en la papelera, en el balde del día en que se creó.
 * Las reglas solo dejan escribir un código que no está (`!data.exists()`), así que el apunte
 * va aparte del `lastAt`: si la sala ya estaba apuntada, el rechazo no arrastra al resto.
 * `note: false` es para el que entra a una sala ajena: solo refresca la marca del balde.
 */
export async function noteRoom(api, code, createdAt, { note = true } = {}) {
  const day = `cleanup/days/${dayOf(createdAt)}`;
  await api.update(day, { lastAt: api.stamp() });
  if (note) await api.update(day, { [`rooms/${code}`]: true });
}

/**
 * Borra las salas vencidas que estén apuntadas. Devuelve { days, rooms } con lo borrado.
 * Un balde que todavía no se puede leer (o que no se dejó borrar entero) corta el barrido:
 * la marca de agua no lo pasa y el próximo barrido lo vuelve a intentar.
 */
export async function sweep(api, now = Date.now()) {
  const today = dayOf(now);
  const mark = await api.read('cleanup/sweptDay');
  const swept = typeof mark === 'number' ? mark : null;
  let rooms = 0, days = 0, last = null;
  for (const day of daysToSweep(swept, today)) {
    let bucket;
    try { bucket = await api.read(`cleanup/days/${day}`); }
    catch (_) { break; } // las reglas no dejan leer un balde con salas todavía vivas
    if (bucket) {
      if (!(bucket.lastAt < now - ROOM_TTL)) break; // aún puede haber una sala viva adentro
      let failed = false;
      for (const code of Object.keys(bucket.rooms || {})) {
        try { await api.remove(`rooms/${code}`); rooms++; continue; } catch (_) { /* ver si sigue ahí */ }
        // Las reglas no dejan borrar una sala que no existe, y eso pasa seguido: la reusó
        // otro código o la borró un barrido anterior que se cortó a medias. Un apunte sin
        // sala es trabajo hecho, no un fracaso; si se tratara como fracaso, un solo código
        // fantasma dejaría su balde (y todos los días siguientes) sin barrer para siempre.
        try { if ((await api.read(`rooms/${code}`)) == null) continue; } catch (__) { /* ni leerla se pudo */ }
        failed = true;
      }
      if (failed) break;
      await api.remove(`cleanup/days/${day}`);
      days++;
    }
    last = day;
  }
  if (last !== null && (swept === null || last > swept)) await api.update('cleanup', { sweptDay: last });
  return { days, rooms };
}

/** ¿Le toca barrer a este celular? Como mucho una vez cada 6 horas. */
export function dueForSweep(now = Date.now()) {
  try { return now - Number(localStorage.getItem(SWEEP_KEY) || 0) > SWEEP_EVERY; }
  catch (_) { return false; } // modo privado: que barra otro
}

/** Se anota antes de barrer, para que dos pestañas no barran a la vez. */
export function markSwept(now = Date.now()) {
  try { localStorage.setItem(SWEEP_KEY, String(now)); } catch (_) { /* nada */ }
}
