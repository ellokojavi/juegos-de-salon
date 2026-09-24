/**
 * Los reportes y comentarios de La Copa (LIG-42, D-104): van por REST a `feedback/` de Firebase,
 * sin cuenta ni sesión anónima, así que cualquiera que abra la página puede mandar uno. `at` lo
 * pone el servidor. Se leen con `node tools/reportes.mjs`.
 *
 * Módulo aparte y sin el SDK de Firebase: la práctica del laboratorio lo usa sin cargar nada más.
 */
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { OP_MS, withTimeout } from '../assets/js/transport/errors.js';

export async function enviarReporte(r, doFetch = globalThis.fetch) {
  let res = null;
  try {
    res = await withTimeout(doFetch(`${firebaseConfig.databaseURL}/feedback.json`, {
      method: 'POST', body: JSON.stringify({ ...r, at: { '.sv': 'timestamp' } }),
    }), OP_MS);
  } catch (_) { /* sin red o se colgó: abajo */ }
  if (!res || !res.ok) throw Object.assign(new Error('reporte'), { code: 'reporte' });
}
