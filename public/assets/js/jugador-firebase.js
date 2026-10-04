/**
 * El almacén de los jugadores y sus récords en Firebase Realtime Database (D-211), con acceso
 * anónimo, como La Copa (D-96). Misma interfaz que `jugador-local.js`; las reglas están en
 * firebase/database.rules.json.
 */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getDatabase, ref, get, update, query, orderByChild, limitToFirst, limitToLast, endBefore, startAfter, onValue,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';
import { OP_MS, waitConnected, withTimeout } from './transport/errors.js';

const falla = code => Object.assign(new Error(code), { code });

/** Un rechazo de las reglas se ve como PERMISSION_DENIED: para quien llama es 'permiso'. */
function traducir(e) {
  const msg = String(e?.code || e?.message || '');
  if (/PERMISSION_DENIED|permission/i.test(msg)) return falla('permiso');
  if (/auth\/(operation-not-allowed|admin-restricted-operation)/.test(msg)) return falla('config');
  if (/auth\/network|network|offline|timeout/i.test(msg)) return falla('offline');
  return e;
}

const filas = snap => {
  const out = [];
  snap.forEach(h => { out.push({ jid: h.key, ...h.val() }); });
  return out;
};

export function crearAlmacenFirebase() {
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);
  const conectado = cb => onValue(ref(db, '.info/connected'), s => cb(!!s.val()));

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
  const leer = async q => {
    await waitConnected(conectado);
    try { return await withTimeout(get(q), OP_MS); } catch (e) { throw traducir(e); }
  };

  return {
    tipo: 'firebase',
    listo,
    async get(ruta) { return (await leer(ref(db, ruta))).val(); },
    async update(cambios) {
      await listo();
      await waitConnected(conectado);
      try { await withTimeout(update(ref(db), cambios), OP_MS); } catch (e) { throw traducir(e); }
    },
    async top(t, periodo, n) {
      return filas(await leer(query(ref(db, `records/${t}/${periodo}`), orderByChild('k'), limitToFirst(n))));
    },
    async vecinos(t, periodo, k, n) {
      const base = ref(db, `records/${t}/${periodo}`);
      const [arriba, abajo] = await Promise.all([
        leer(query(base, orderByChild('k'), endBefore(k), limitToLast(n))),
        leer(query(base, orderByChild('k'), startAfter(k), limitToFirst(n))),
      ]);
      return { arriba: filas(arriba), abajo: filas(abajo) };
    },
    async podios(n) {
      const snap = await leer(query(ref(db, 'torneoPodios'), orderByChild('end'), limitToLast(n)));
      const out = {};
      snap.forEach(h => { out[h.key] = h.val(); });
      return out;
    },
  };
}
