/**
 * Limpieza de salas viejas en Firebase (canon C-7).
 *
 * Una sala vence sola —media hora quieta, o seis horas en total— pero nadie la borra: el
 * creador ya cerró el navegador.
 * La papelera es el índice que permite encontrarlas sin poder listar `rooms/`:
 *
 *   cleanup/
 *     sweptDay: <día ya barrido>          marca de agua, para no revisar lo mismo dos veces
 *     days/<día>/
 *       lastAt: <marca del último apunte> el reloj del servidor, no el del celular
 *       rooms/<CÓDIGO>: true
 *
 * Al crear una sala se apunta su código en el balde de su día, en la misma escritura que la
 * crea (D-321); al entrar a una sala se refresca la marca del balde. Las reglas
 * solo dejan leer un balde cuando pasaron 6 horas desde su último apunte: como ninguna sala
 * pasa de seis horas (ROOM_TTL, el tope duro), cuando el balde se puede leer todas sus salas
 * están vencidas y el índice nunca revela una sala viva.
 *
 * Barrer es entonces: leer los baldes de los días que faltan, borrar esas salas y borrar
 * el balde. Since D-499 the phones no longer sweep: the nightly job does it as administrator
 * (`tools/firebase/room-sweep.mjs`, with this same `sweep()`), and the rules leave reading and
 * deleting a bucket to the owner alone.
 *
 * Todo el acceso a la base entra por `api` para poder probar esto con node sin Firebase:
 *   { read(ruta), update(ruta, cambios), remove(ruta), stamp() }
 */

/**
 * Una sala tiene dos relojes, y el primero que llegue la mata (D-89):
 *   - IDLE_TTL: media hora sin que nadie juegue. Cada jugada refresca `rooms/<CÓDIGO>/lastAt`.
 *   - ROOM_TTL: seis horas desde que nació, juegue quien juegue. Es el tope duro, y es lo que
 *     le permite a la papelera prometer que un balde que se puede leer no tiene salas vivas:
 *     sin tope, una sala con gente jugando podría sobrevivir a su propio balde.
 * Los dos números están también en las reglas (`firebase/database.rules.json`).
 */
export const ROOM_TTL = 6 * 60 * 60 * 1000;   // tope duro desde que se creó
export const IDLE_TTL = 30 * 60 * 1000;       // media hora sin jugadas
const DAY = 24 * 60 * 60 * 1000;
const RESCUE_DAYS = 8;                        // días que se revisan siempre, ignorando la marca
const MAX_DAYS = 30;                          // tope de baldes por barrido

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
 * The app no longer notes a new room here: it does it in the write that creates it
 * (`roomCreation`, D-321). The note still goes apart from `lastAt`, as it did when the rules
 * would not take a code twice: if it is rejected, the rejection does not drag `lastAt` with it.
 * `note: false` es para el que entra a una sala ajena: solo refresca la marca del balde.
 */
export async function noteRoom(api, code, createdAt, { note = true } = {}) {
  const day = `cleanup/days/${dayOf(createdAt)}`;
  await api.update(day, { lastAt: api.stamp() });
  if (note) await api.update(day, { [`rooms/${code}`]: true });
}

/**
 * The writes that create a room, for a single multi-path update from the root (D-321): the room
 * and its note in the bucket land together or not at all. A note written afterwards was lost
 * whenever the page died or the connection dropped in between, and an unnoted room is never swept.
 *
 * `day` comes from the phone's estimate of the server clock, so near midnight (UTC) the note can
 * land in the bucket next to the one of `createdAt`. That is harmless: the bucket's `lastAt` is
 * the same server stamp as `createdAt`, and `lastAt` is what keeps a bucket closed while a room
 * in it can still be alive.
 */
export function roomCreation(code, { game, config, day, stamp }) {
  return {
    [`rooms/${code}/createdAt`]: stamp,
    [`rooms/${code}/game`]: game,
    [`rooms/${code}/config`]: config,
    [`cleanup/days/${day}/lastAt`]: stamp,
    [`cleanup/days/${day}/rooms/${code}`]: true,
  };
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
