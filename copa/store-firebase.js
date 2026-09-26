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
import { aliasHasta } from './engine.js';

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
        // El link propio, en la misma escritura: si otro lo tomó justo antes, no se crea nada (D-121)
        ...(meta.alias ? { [`torneoAlias/${meta.alias}`]: { code, hasta: aliasHasta(meta) } } : {}),
      }, meta.alias ? 'alias' : 'ocupado');
    },

    /** A qué copa apunta un link propio: `{ code, hasta }` o null (D-121). */
    async alias(a) {
      await listo();
      await waitConnected(conectado);
      return (await withTimeout(get(ref(db, `torneoAlias/${a}`)), OP_MS)).val();
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

    /**
     * Con mala conexión la escritura puede llegar aunque el celular se canse de esperar, y el
     * reintento choca con "ya existe" (D-123). Si falla, se mira si quedó hecho: entonces no falló.
     */
    async yaEsta(ruta) {
      try { return (await withTimeout(get(ref(db, ruta)), OP_MS)).exists(); } catch (_) { return false; }
    },

    async empezar(code, dia, pid) {
      try { await escribir({ [`torneos/${code}/started/${dia}/${pid}`]: serverTimestamp() }, 'ventana'); } catch (e) {
        if (await this.yaEsta(`torneos/${code}/started/${dia}/${pid}`)) return;
        throw e;
      }
    },

    async comodin(code, dia, pid) {
      await escribir({ [`torneos/${code}/wild/${pid}`]: String(dia) }, 'comodin');
    },

    async resultado(code, dia, pid, r) {
      try { await escribir({ [`torneos/${code}/results/${dia}/${pid}`]: { ...r, at: serverTimestamp() } }, 'ventana'); } catch (e) {
        // Si el resultado ya quedó guardado (llegó aunque el celular no se enteró), cuenta como enviado
        if (await this.yaEsta(`torneos/${code}/results/${dia}/${pid}`)) throw Object.assign(new Error('ya-jugado'), { code: 'ya-jugado' });
        throw e;
      }
    },

    async sacar(code, pid, out) {
      await escribir({ [`torneos/${code}/players/${pid}/out`]: out ? true : null });
    },

    /** Eliminar la copa entera (D-117): la copa, los hashes de los PIN y los asientos, de una vez. */
    async eliminar(code) {
      const alias = (await withTimeout(get(ref(db, `torneos/${code}/meta/alias`)), OP_MS)).val();
      await escribir({
        [`torneos/${code}`]: null, [`torneoKeys/${code}`]: null, [`torneoSeats/${code}`]: null,
        // El link propio queda libre de inmediato (D-121)
        ...(alias ? { [`torneoAlias/${alias}`]: null } : {}),
      }, 'permiso');
    },

    /** Cerrar o reabrir la inscripción (D-110). */
    async cerrarInscripcion(code, cerrada) {
      await escribir({ [`torneos/${code}/closed`]: cerrada ? true : null });
    },

    /** Mover el inicio mientras nadie haya jugado (D-110). Las reglas lo niegan si alguien empezó. */
    async reprogramar(code, meta) {
      // Si la copa tiene link propio, se mueve con ella hasta cuándo queda tomado (D-121)
      await escribir({ [`torneos/${code}/meta`]: meta, ...(meta.alias ? { [`torneoAlias/${meta.alias}`]: { code, hasta: aliasHasta(meta) } } : {}) }, 'empezada');
    },

    /** Cambiar el nombre de la copa (D-148): solo su admin y mientras no termine. */
    async renombrarCopa(code, name) {
      await escribir({ [`torneos/${code}/meta/name`]: name }, 'terminada');
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

