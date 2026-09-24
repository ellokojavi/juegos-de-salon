/**
 * Almacén de La Copa en Firebase Realtime Database, con acceso anónimo de Firebase Auth
 * (D-96). Misma interfaz que store-local.js.
 *
 * Rutas (reglas en firebase/database.rules.json):
 *   torneos/<código>/meta · players/<pid> · started/<día>/<pid> · results/<día>/<pid> · wild/<pid>
 *   torneoKeys/<código>/<pid>          sha256 del PIN. Nadie lo puede leer.
 *   torneoSeats/<código>/<pid>/<uid>   el celular `uid` puede escribir por `pid`. Las reglas
 *                                    aceptan el asiento solo si trae el mismo hash que torneoKeys.
 */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getDatabase, ref, get, update, onValue, serverTimestamp, push,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { OP_MS, waitConnected, withTimeout } from '../assets/js/transport/errors.js';
import { enviarReporte } from './reportes.js';

const falla = code => Object.assign(new Error(code), { code });

/** Un rechazo de las reglas se ve como PERMISSION_DENIED; lo traducimos a lo que pasó. */
function traducir(e, siNoHayPermiso = 'permiso') {
  if (e?.code && !/^PERMISSION|permission/i.test(String(e.code)) && !String(e.code).startsWith('auth/')) return e;
  const msg = String(e?.code || e?.message || '');
  if (/PERMISSION_DENIED|permission/i.test(msg)) return falla(siNoHayPermiso);
  if (/auth\/(operation-not-allowed|admin-restricted-operation)/.test(msg)) return falla('config');
  if (/auth\/network|network/i.test(msg)) return falla('offline');
  return e;
}

export function createFirebaseStore() {
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);
  let offset = 0;
  onValue(ref(db, '.info/serverTimeOffset'), s => { offset = Number(s.val()) || 0; });
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

  const escribir = async (cambios, siNoHayPermiso) => {
    await listo();
    await waitConnected(conectado);
    try { await withTimeout(update(ref(db), cambios), OP_MS); } catch (e) { throw traducir(e, siNoHayPermiso); }
  };

  return {
    tipo: 'firebase',
    get uid() { return auth.currentUser?.uid || null; },
    listo,
    now: () => Date.now() + offset,

    async existe(code) {
      await listo();
      await waitConnected(conectado);
      return (await withTimeout(get(ref(db, `torneos/${code}/meta/v`)), OP_MS)).exists();
    },

    async crear(code, meta, { pid, name, at, pinHash }) {
      const uid = await listo();
      await escribir({
        [`torneos/${code}/meta`]: { ...meta, createdAt: serverTimestamp() },
        [`torneos/${code}/players/${pid}`]: { name, at: serverTimestamp() },
        [`torneoKeys/${code}/${pid}`]: pinHash,
        [`torneoSeats/${code}/${pid}/${uid}`]: pinHash,
      }, 'ocupado');
    },

    escuchar(code, cb, onError = () => {}) {
      let off = () => {};
      listo().then(() => {
        off = onValue(ref(db, `torneos/${code}`), s => cb(s.val()), e => onError(traducir(e)));
      }).catch(onError);
      return () => off();
    },

    async leer(code) {
      await listo();
      await waitConnected(conectado);
      return (await withTimeout(get(ref(db, `torneos/${code}`)), OP_MS)).val();
    },

    async inscribir(code, { pid, name, pinHash }) {
      const uid = await listo();
      await escribir({
        [`torneos/${code}/players/${pid}`]: { name, at: serverTimestamp() },
        [`torneoKeys/${code}/${pid}`]: pinHash,
        [`torneoSeats/${code}/${pid}/${uid}`]: pinHash,
      }, 'llena');
    },

    async sentarse(code, pid, pinHash) {
      const uid = await listo();
      await escribir({ [`torneoSeats/${code}/${pid}/${uid}`]: pinHash }, 'pin');
    },

    async empezar(code, dia, pid) {
      await escribir({ [`torneos/${code}/started/${dia}/${pid}`]: serverTimestamp() }, 'ventana');
    },

    async comodin(code, dia, pid) {
      await escribir({ [`torneos/${code}/wild/${pid}`]: String(dia) }, 'comodin');
    },

    async resultado(code, dia, pid, r) {
      await escribir({ [`torneos/${code}/results/${dia}/${pid}`]: { ...r, at: serverTimestamp() } }, 'ventana');
    },

    async sacar(code, pid, out) {
      await escribir({ [`torneos/${code}/players/${pid}/out`]: out ? true : null });
    },

    async renombrar(code, pid, name) {
      await escribir({ [`torneos/${code}/players/${pid}/name`]: name });
    },

    /** Un reporte o comentario (LIG-42). Va por REST, sin cuenta: ver `enviarReporte`. */
    reportar: r => enviarReporte(r),

    async cambiarPin(code, pid, pinHash) {
      // El PIN nuevo invalida los celulares que ya estaban sentados como ese jugador.
      await escribir({ [`torneoKeys/${code}/${pid}`]: pinHash, [`torneoSeats/${code}/${pid}`]: null });
    },
  };
}

