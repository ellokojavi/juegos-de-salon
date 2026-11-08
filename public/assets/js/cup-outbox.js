/**
 * La Copa offline (D-544, docs/OFFLINE.md): a pending day played with no signal is kept on the phone
 * and uploaded when the signal is back, if its day is still open then.
 *
 * - **The copy of the cup**: while online, each read of a cup this phone is seated in is kept whole
 *   (`cuenta.copia`), with the server's clock offset. Offline, the board, the day's game and its
 *   result screen are drawn from that copy; a cup never opened online on this phone cannot open.
 * - **The outbox** (`OUTBOX_KEY`): one entry per day played offline, `{ id, code, d, pid, b, started,
 *   res, at }`. `b` is when the day closes (`meta.win[d].b`): the expiry. The server's rules already
 *   refuse a start or a result outside the day's window with the server's clock, so the expiry is
 *   theirs, not the phone's: a game that reaches the server after its day closed counts as not played.
 * - **Upload** (`subirCopa`, from any page: it is shared code, so it writes through the rankings'
 *   Firebase store, `jugador-firebase.js`, with the same anonymous sign-in the cup is seated with):
 *   for each entry, first the start (`started/<d>/<pid>`, which the rules refuse to a player out of the
 *   cup or after the admin ended it), then the result. A result already on the server (the same day
 *   played on another phone) wins: this one is dropped. A refused write while the day is still open is
 *   the seat (a new PIN): kept, so it goes up once the player enters the cup again. A network error
 *   keeps the entry for the next try. The page is told with `pendientes-subidas` (offline-ui's toast).
 *
 * Nothing here loads Firebase until there is something to upload.
 */
export const OUTBOX_KEY = 'juegos-de-salon:copa:outbox';
/** An entry still unsent this long after its day closed is dropped without asking the server. */
const MARGEN = 10 * 60 * 1000;

const store = () => globalThis.localStorage;
export function leerCola(storage = store()) {
  try { const v = JSON.parse(storage?.getItem(OUTBOX_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; }
}
function escribirCola(cola, storage = store()) {
  try { if (cola.length) storage.setItem(OUTBOX_KEY, JSON.stringify(cola)); else storage.removeItem(OUTBOX_KEY); } catch (_) { /* no storage */ }
}
const idDe = (code, d, pid) => `${code}:${d}:${pid}`;

/** Days waiting to upload (the offline chip counts them with the other games). */
export const pendientesCopa = (storage = store()) => leerCola(storage).filter(x => x.res).length;

/** The day was started offline (Empezar): kept, so the start reaches the server before the result. */
export function anotarInicio({ code, d, pid, b, at }, storage = store()) {
  const cola = leerCola(storage);
  if (cola.some(x => x.id === idDe(code, d, pid))) return;
  cola.push({ id: idDe(code, d, pid), code, d, pid, b, started: at });
  escribirCola(cola, storage);
}

/** The day's result, played offline: `res` is what `store.resultado` would write (`{ s, ms, t, r }`). */
export function anotarResultado({ code, d, pid, b, at, res }, storage = store()) {
  const cola = leerCola(storage);
  const id = idDe(code, d, pid);
  const i = cola.findIndex(x => x.id === id);
  if (i >= 0 && cola[i].res) throw Object.assign(new Error('ya-jugado'), { code: 'ya-jugado' });
  const x = { ...(i >= 0 ? cola[i] : { id, code, d, pid, b, started: at }), res, at };
  if (i >= 0) cola[i] = x; else cola.push(x);
  escribirCola(cola, storage);
}

/**
 * The cup as this phone sees it offline: the kept copy with what the outbox holds on top (the day
 * started, its result), so the board shows the day as played. Returns a new object.
 */
export function conCola(L, code, storage = store()) {
  if (!L) return L;
  const out = { ...L, started: { ...(L.started || {}) }, results: { ...(L.results || {}) } };
  for (const x of leerCola(storage).filter(y => y.code === code)) {
    if (x.started && !out.started[x.d]?.[x.pid]) out.started[x.d] = { ...(out.started[x.d] || {}), [x.pid]: x.started };
    if (x.res && !out.results[x.d]?.[x.pid]) out.results[x.d] = { ...(out.results[x.d] || {}), [x.pid]: { ...x.res, at: x.at, local: true } };
  }
  return out;
}

/** Whether `d` of `code` was played offline on this phone and is still waiting to upload. */
export const enCola = (code, d, pid, storage = store()) => leerCola(storage).some(x => x.id === idDe(code, d, pid) && x.res);

const SERVIDOR = { '.sv': 'timestamp' };
/** Whether `ruta` is on the server; unknown (no network) is false. */
const hay = async (api, ruta) => { try { return (await api.get(ruta)) != null; } catch (_) { return false; } };

/**
 * Uploads the outbox through `api` (`{ update(cambios), get(ruta) }`, the rankings' Firebase store).
 * Returns `{ cupSent, cupLate, cupDup }` and leaves in the queue only what can still go: the network
 * did not let it through, or the seat was refused while the day is open. `now` is the phone's clock:
 * an entry far past its day's close is not even tried.
 */
export async function subirCola(api, { storage = store(), now = () => Date.now() } = {}) {
  const r = { cupSent: 0, cupLate: 0, cupDup: 0 };
  const quitar = x => escribirCola(leerCola(storage).filter(y => y.id !== x.id), storage);
  for (const x of leerCola(storage)) {
    if (!x.res) { if (now() >= x.b + MARGEN) quitar(x); continue; }   // started and never finished: nothing to send
    if (now() >= x.b + MARGEN) { quitar(x); r.cupLate++; continue; }
    const base = `torneos/${x.code}`;
    try {
      // The start first: the rules refuse it to a player out of the cup or after the admin ended it.
      // Already there (pressed online before, or a cut try that got through) is fine
      try { await api.update({ [`${base}/started/${x.d}/${x.pid}`]: SERVIDOR }); } catch (e) {
        if (!(await hay(api, `${base}/started/${x.d}/${x.pid}`))) throw e;
      }
      try { await api.update({ [`${base}/results/${x.d}/${x.pid}`]: { ...x.res, at: SERVIDOR } }); } catch (e) {
        if (await hay(api, `${base}/results/${x.d}/${x.pid}`)) { quitar(x); r.cupDup++; continue; }
        throw e;
      }
      quitar(x); r.cupSent++;
    } catch (e) {
      if (e?.code !== 'permiso') break;   // the network: kept for the next try
      // Refused: after the close it is the day's window (not played); before, the seat (kept)
      if (now() >= x.b) { quitar(x); r.cupLate++; }
    }
  }
  return r;
}

let subiendo = null;
/**
 * Uploads the outbox with the real store when there is one and the phone has signal. One run at a
 * time; tells the page with `pendientes-subidas` when anything changed.
 */
export function subirCopa({ win = globalThis, crear = () => import('./jugador-firebase.js').then(m => m.crearAlmacenFirebase()) } = {}) {
  if (!leerCola().length) return Promise.resolve(null);
  if (win.navigator?.onLine === false || win.document?.documentElement?.dataset.connection === 'offline') return Promise.resolve(null);
  return subiendo ||= (async () => {
    const api = await crear();
    await api.listo();
    const r = await subirCola(api);
    if (r.cupSent || r.cupLate || r.cupDup) {
      try { win.dispatchEvent?.(new CustomEvent('pendientes-subidas', { detail: r })); } catch (_) { /* not a page */ }
    }
    return r;
  })().catch(() => null).finally(() => { subiendo = null; });
}

/** On every page while offline mode is on: now, and each time the signal comes back. */
export function subirCopaAlVolver({ win = globalThis } = {}) {
  const ir = () => { subirCopa({ win }); };
  ir();
  win.addEventListener?.('online', ir);
  win.addEventListener?.('connection', e => { if (e.detail?.mode === 'online') ir(); });
}
