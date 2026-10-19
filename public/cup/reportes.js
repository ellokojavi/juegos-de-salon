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
 *
 * Optional email (D-317): whoever wants to hear back leaves an address. It never goes to the public
 * `feedback/` node: that one only gets the mask (`j********@********m`, shown in the GitHub issue),
 * and the address goes to `feedbackContacto/<id>`, which nobody can read without the owner's key.
 * The processes agent emails the reply from there and then deletes it.
 */
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { OP_MS, withTimeout } from '../assets/js/transport/errors.js';

const PENDIENTES = 'juegos-de-salon:copa:reportes-pendientes';
const QUIEN = 'juegos-de-salon:labs-quien';   // la pone labs-puerta.js
const MAX_PENDIENTES = 20;

/** A plausible email address, or '' (D-317). */
export function correoValido(c) {
  const t = String(c || '').trim();
  return t.length <= 120 && /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(t) ? t : '';
}

/**
 * The mask the GitHub issue shows (D-317, D-366): the first and last letter on each side of the @,
 * with a fixed eight asterisks between them so the length says nothing (`j********n@g********m`).
 */
export const enmascarar = c => { const [u, d] = String(c).split('@'); return `${u[0]}********${u.at(-1)}@${d[0]}********${d.at(-1)}`; };

/** A player's name as the GitHub issue shows it (D-366): each word's first letter, the rest asterisks. */
export const enmascararNombre = n => String(n || '').trim().split(/\s+/u).filter(Boolean)
  .map(w => { const [first, ...rest] = [...w]; return first + '*'.repeat(rest.length); }).join(' ');

const leer = almacen => { try { return JSON.parse(almacen.getItem(PENDIENTES) || '[]'); } catch (_) { return []; } };
const escribir = (almacen, lista) => {
  try { if (lista.length) almacen.setItem(PENDIENTES, JSON.stringify(lista.slice(-MAX_PENDIENTES))); else almacen.removeItem(PENDIENTES); } catch (_) { /* nada */ }
};

async function publicar(r, doFetch) {
  // A contact left over from a report that already went out (the address alone failed): only that
  if (r.contactoDe) return guardarContacto(r.contactoDe, r.correo, doFetch, r.hilo);
  // `hilo` (an email's Message-ID and subject, D-327) goes only with the private address
  const { correo: c, hilo, ...publico } = r;
  const correo = correoValido(c);
  if (correo) publico.correoMascara = enmascarar(correo);
  let res = null;
  try {
    res = await withTimeout(doFetch(`${firebaseConfig.databaseURL}/feedback.json`, {
      method: 'POST', body: JSON.stringify({ ...publico, at: { '.sv': 'timestamp' } }),
    }), OP_MS);
  } catch (_) { /* sin red o se colgó: abajo */ }
  if (!(res && res.ok)) return false;
  if (!correo) return true;
  let id = null;
  try { id = (await res.json())?.name || null; } catch (_) { /* no id: nothing to attach the address to */ }
  if (!id) return true;
  // The report is out: if the address fails, only the address is retried later
  return (await guardarContacto(id, correo, doFetch, hilo)) || { contactoDe: id, correo, ...(hilo ? { hilo } : {}) };
}

/** The thread of the email a report came from, so the reply lands in it (D-327). */
const hiloDe = h => {
  const idMensaje = String(h?.idMensaje || '').trim().slice(0, 200);
  return idMensaje ? { idMensaje, asunto: String(h.asunto || '').slice(0, 200) } : {};
};

/** The address, in the private node, under the report's id (D-317). */
async function guardarContacto(id, correo, doFetch, hilo = null) {
  let res = null;
  try {
    res = await withTimeout(doFetch(`${firebaseConfig.databaseURL}/feedbackContacto/${encodeURIComponent(id)}.json`, {
      method: 'PUT', body: JSON.stringify({ correo, at: { '.sv': 'timestamp' }, ...hiloDe(hilo) }),
    }), OP_MS);
  } catch (_) { /* abajo */ }
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
  const hecho = await publicar(r, doFetch);
  if (hecho === true) return;
  if (hecho) { if (almacen) escribir(almacen, [...leer(almacen), hecho]); return; }
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
  for (const r of lista) {
    const hecho = await publicar(r, doFetch);
    if (hecho === true) enviados++;
    else if (hecho) { enviados++; quedan.push(hecho); }
    else quedan.push(r);
  }
  escribir(almacen, quedan);
  return enviados;
}
