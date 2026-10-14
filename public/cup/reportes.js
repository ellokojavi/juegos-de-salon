/**
 * Los reportes y comentarios de La Copa (LIG-42, D-104): van por REST a `feedback/` de Firebase,
 * sin cuenta ni sesión anónima, así que cualquiera que abra la página puede mandar uno. `at` lo
 * pone el servidor. Se leen con `node tools/firebase/reports.mjs`.
 *
 * Si no se puede enviar (sin red, o las reglas lo rechazan), el reporte queda guardado en el
 * dispositivo y se reintenta la próxima vez que se abra La Copa (D-109): un reporte escrito no
 * se pierde.
 *
 * Quien entró al laboratorio con su llave (D-284) manda también su etiqueta (`tester`), la que
 * el dueño le puso al darle el link: así sabe de quién es el comentario aunque no escriba su nombre.
 * Nunca la llave.
 *
 * Módulo aparte y sin el SDK de Firebase: la práctica del laboratorio lo usa sin cargar nada más.
 */
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { OP_MS, withTimeout } from '../assets/js/transport/errors.js';

const PENDIENTES = 'juegos-de-salon:copa:reportes-pendientes';
const QUIEN = 'juegos-de-salon:labs-quien';   // la pone labs-puerta.js
const MAX_PENDIENTES = 20;

const leer = almacen => { try { return JSON.parse(almacen.getItem(PENDIENTES) || '[]'); } catch (_) { return []; } };
const escribir = (almacen, lista) => {
  try { if (lista.length) almacen.setItem(PENDIENTES, JSON.stringify(lista.slice(-MAX_PENDIENTES))); else almacen.removeItem(PENDIENTES); } catch (_) { /* nada */ }
};

async function publicar(r, doFetch) {
  let res = null;
  try {
    res = await withTimeout(doFetch(`${firebaseConfig.databaseURL}/feedback.json`, {
      method: 'POST', body: JSON.stringify({ ...r, at: { '.sv': 'timestamp' } }),
    }), OP_MS);
  } catch (_) { /* sin red o se colgó: abajo */ }
  return !!(res && res.ok);
}

/**
 * Envía un reporte. Si no se puede, lo guarda para después y lanza `{ code: 'reporte', guardado }`
 * (`guardado` dice si quedó en el dispositivo).
 */
export async function enviarReporte(r, doFetch = globalThis.fetch, almacen = globalThis.localStorage) {
  let tester = '';
  try { tester = (almacen?.getItem(QUIEN) || '').slice(0, 24); } catch (_) { /* sin almacenamiento */ }
  if (tester && !r.tester) r = { ...r, tester };
  if (await publicar(r, doFetch)) return;
  let guardado = false;
  if (almacen) { escribir(almacen, [...leer(almacen), r]); guardado = leer(almacen).length > 0; }
  throw Object.assign(new Error('reporte'), { code: 'reporte', guardado });
}

/** Reintenta los reportes que quedaron guardados. Devuelve cuántos se enviaron. */
export async function reenviarPendientes(doFetch = globalThis.fetch, almacen = globalThis.localStorage) {
  if (!almacen) return 0;
  const lista = leer(almacen);
  const quedan = [];
  let enviados = 0;
  for (const r of lista) { if (await publicar(r, doFetch)) enviados++; else quedan.push(r); }
  escribir(almacen, quedan);
  return enviados;
}
