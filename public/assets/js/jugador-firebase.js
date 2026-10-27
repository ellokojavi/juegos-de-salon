/**
 * El almacén de los jugadores y sus récords en Firebase Realtime Database (D-212), con acceso
 * anónimo, como La Copa (D-96). Misma interfaz que `jugador-local.js`; las reglas están en
 * firebase/database.rules.json.
 *
 * Reads go over the REST API with `fetch` (D-470): a page that only shows a ranking opens no
 * websocket and loads no SDK, because the free plan caps simultaneous connections at about 100
 * and past it the app goes down. The SDK (and its anonymous sign-in and websocket) loads only
 * when the player writes: saving a score, signing in, the Uno al día network. The two paths the
 * rules let only a seated phone read (`invitados/`, `jugadorCopas/`) go over REST too, with the
 * anonymous sign-in's ID token, which loads only the SDK's auth half (HTTP, no websocket).
 */
import { firebaseConfig } from './firebase-config.js';
import { OP_MS, waitConnected, withTimeout } from './transport/errors.js';

const falla = code => Object.assign(new Error(code), { code });

/** Un rechazo de las reglas se ve como PERMISSION_DENIED: para quien llama es 'permiso'. */
function traducir(e) {
  const msg = String(e?.code || e?.message || '');
  if (/PERMISSION_DENIED|permission/i.test(msg)) return falla('permiso');
  if (/auth\/(operation-not-allowed|admin-restricted-operation)/.test(msg)) return falla('config');
  if (/auth\/network|network|offline|timeout|abort|fetch/i.test(msg)) return falla('offline');
  return e;
}

/** Paths whose read rule asks for a seated phone (`auth`): read with the SDK, signed in. */
const CON_SESION = /^(invitados|jugadorCopas)\//;

/**
 * Rows of a REST query, in the SDK's order (by `k`, then by key): the REST API answers a
 * filtered query with an object, whose order JSON does not keep.
 */
export function filasRest(obj) {
  const out = Object.entries(obj || {}).map(([jid, v]) => ({ jid, ...v }));
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  return out.sort((a, b) => cmp(a.k, b.k) || cmp(a.jid, b.jid));
}

/** The store. `fetchFn` and `sdk` come in from outside so node can test it without a network. */
export function crearAlmacenFirebase({ fetchFn = (...a) => globalThis.fetch(...a), sdk = cargarSdk, base = firebaseConfig.databaseURL } = {}) {
  // Query values go as the REST API reads them: JSON (`orderBy="k"`, `endAt=12` or `endAt="a"`)
  const rest = async (ruta, params = {}) => {
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctl && setTimeout(() => ctl.abort(), OP_MS);
    try {
      const r = await fetchFn(`${base}/${ruta}.json${qs ? `?${qs}` : ''}`, ctl ? { signal: ctl.signal } : undefined);
      if (r.status === 401 || r.status === 403) throw falla('permiso');
      if (!r.ok) throw falla('offline');
      return await r.json();
    } catch (e) { throw e?.code ? e : traducir(e); } finally { if (t) clearTimeout(t); }
  };
  // k is a number or a string: the REST API wants it as JSON either way
  const valor = k => (typeof k === 'string' ? k : Number(k));

  let conSdk = null;
  const s = () => (conSdk ||= sdk().catch(e => { conSdk = null; throw traducir(e); }));

  return {
    tipo: 'firebase',
    listo: async () => (await s()).listo(),
    async get(ruta) {
      if (!CON_SESION.test(ruta)) return rest(ruta);
      let auth;
      try { auth = await (await s()).token(); } catch (e) { throw e?.code ? e : traducir(e); }
      return rest(ruta, { auth });
    },
    async update(cambios) { return (await s()).update(cambios); },
    async top(t, periodo, n) {
      return filasRest(await rest(`records/${t}/${periodo}`, { orderBy: '"k"', limitToFirst: n })).slice(0, n);
    },
    async vecinos(t, periodo, k, n) {
      // The SDK's endBefore/startAfter are not in the REST API: endAt/startAt with a margin for
      // ties on k, which are then left out like the SDK did
      const ruta = `records/${t}/${periodo}`, extra = n + 5, kv = valor(k);
      const [arriba, abajo] = await Promise.all([
        rest(ruta, { orderBy: '"k"', endAt: JSON.stringify(kv), limitToLast: extra }),
        rest(ruta, { orderBy: '"k"', startAt: JSON.stringify(kv), limitToFirst: extra }),
      ]);
      return {
        arriba: filasRest(arriba).filter(f => f.k < kv).slice(-n),
        abajo: filasRest(abajo).filter(f => f.k > kv).slice(0, n),
      };
    },
    async podios(n) {
      const obj = (await rest('torneoPodios', { orderBy: '"end"', limitToLast: n })) || {};
      // Oldest first, as the SDK's forEach gave them
      return Object.fromEntries(Object.entries(obj).sort(([, a], [, b]) => (a?.end || 0) - (b?.end || 0)));
    },
  };
}

/**
 * The SDK, in two halves. Auth alone (the anonymous sign-in and its ID token) talks HTTP and opens
 * no websocket: it is enough for the seated reads, which go over REST with `?auth=`. The database
 * half, and its websocket, loads only for the first write.
 */
async function cargarSdk() {
  const [{ initializeApp, getApps }, { getAuth, signInAnonymously, onAuthStateChanged }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
  ]);
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const auth = getAuth(app);
  let uidPromesa = null;
  const listo = () => {
    uidPromesa ||= new Promise((resolve, reject) => {
      const off = onAuthStateChanged(auth, user => {
        if (user) { off(); resolve(user.uid); return; }
        signInAnonymously(auth).catch(e => { off(); uidPromesa = null; reject(traducir(e)); });
      });
    });
    return uidPromesa;
  };
  let base = null;
  const db = () => (base ||= import('https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js')
    .then(D => ({ D, db: D.getDatabase(app) })).catch(e => { base = null; throw e; }));
  return {
    listo,
    async token() { await listo(); return auth.currentUser.getIdToken(); },
    async update(cambios) {
      await listo();
      const { D: { ref, update, onValue }, db: d } = await db();
      await waitConnected(cb => onValue(ref(d, '.info/connected'), x => cb(!!x.val())));
      try { await withTimeout(update(ref(d), cambios), OP_MS); } catch (e) { throw traducir(e); }
    },
  };
}
