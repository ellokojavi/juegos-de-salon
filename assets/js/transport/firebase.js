/**
 * Transporte remoto compartido por los juegos: sala en Firebase Realtime Database.
 * Se crea con createFirebaseTransport({ game }) y el campo `game` de la sala separa los juegos.
 * Los mensajes son append-only en rooms/<CODE>/messages; cada cliente reconstruye el estado leyéndolos en orden.
 * Reglas de seguridad: firebase/database.rules.json.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getDatabase, ref, get, set, update, push, onChildAdded, onValue, onDisconnect, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { firebaseConfig } from '../firebase-config.js';
import { ROOM_TTL, dueForSweep, markSwept, noteRoom, sweep } from './cleanup.js';
import { disposeRoom } from './dispose.js';
import { CONNECT_MS, LEAVE_MS, OP_MS, waitConnected, withTimeout } from './errors.js';
import { checkQuota, noteCreated } from './ratelimit.js';
import { stats, noteRoom as recordRoom, notePlayer as recordPlayer, noteStart as recordStart } from './stats.js';

/** Código de sala: 4 letras mayúsculas sin las ambiguas (I, O). */
export function randomRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => letters[b % letters.length]).join('');
}
let db = null;
function getDb() {
  if (!db) db = getDatabase(initializeApp(firebaseConfig));
  return db;
}

const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Avisa si hay conexión con la base. Lo usa `waitConnected` antes de crear o entrar.
 * `.info/connected` es local del SDK: no gasta cuota y responde apenas se sabe.
 */
const connWatch = d => cb => onValue(ref(d, '.info/connected'), s => cb(!!s.val()));

/** Acceso a la base que usan la papelera (cleanup.js) y la despedida (dispose.js). */
const dbApi = d => ({
  read: async path => (await get(ref(d, path))).val(),
  update: (path, changes) => update(ref(d, path), changes),
  remove: path => set(ref(d, path), null),
  stamp: () => serverTimestamp(),
});

/**
 * Deja constancia para el panel del dueño (D-44): la sala nueva o el que entró a una ajena,
 * y los contadores de origen. Mejor esfuerzo y en segundo plano, igual que la papelera.
 */
function record(game, code, createdAt, { role, name, created }) {
  try {
    const { api, fp } = stats();
    if (created) recordRoom(api, fp, { code, createdAt, game, role, name });
    else recordPlayer(api, fp, { code, createdAt, role, name });
    recordStart(api, fp, { game, mode: 'online', players: 1 });
  } catch (_) { /* nada */ }
}

/**
 * Apunta la sala en la papelera y, si a este celular le toca, barre las salas vencidas
 * (canon C-7). No se espera ni se muestra: si algo falla, la partida sigue igual.
 */
async function cleanup(d, code, createdAt, { note = true } = {}) {
  try { await noteRoom(dbApi(d), code, createdAt, { note }); } catch (_) { /* mejor esfuerzo */ }
  if (!dueForSweep()) return;
  markSwept();
  setTimeout(() => { sweep(dbApi(d)).catch(() => { /* nada */ }); }, 10000); // primero que arranque la partida
}

export function createFirebaseTransport({ game, maxPlayers = 2 }) {
  // Identificador de este dispositivo: sirve para resolver quién se quedó con un rol
  // cuando dos personas entran a la sala en el mismo instante.
  const uid = randomRoomCode() + Date.now().toString(36);
  const t = {
    uid,
    kind: 'firebase',
    code: null,
    role: null,
    roles: [],
    _me: null,
    _unsubs: [],

    /**
     * Crea una sala nueva con un código libre. Devuelve el código.
     *
     * Antes de tocar la base se espera la conexión, y la operación entera lleva tope. Sin
     * eso, quedarse sin señal —o toparse con el tope de conexiones del plan gratuito— se ve
     * como una espera eterna con el botón pegado, y el juego terminaba culpando a la
     * internet del jugador sin saberlo (C-14, D-40).
     */
    async create(opts) {
      checkQuota(); // antes de tocar la red: una sala de más no se pide y después se descarta
      const d = getDb();
      await waitConnected(connWatch(d), CONNECT_MS);
      const code = await withTimeout(this._create(d, opts), OP_MS);
      noteCreated(); // solo cuenta la que quedó creada de verdad
      return code;
    },

    async _create(d, { config, name }) {
      for (let i = 0; i < 8; i++) {
        const code = randomRoomCode();
        const roomRef = ref(d, `rooms/${code}`);
        const snap = await get(roomRef);
        if (snap.exists()) {
          const createdAt = snap.val().createdAt || 0;
          if (Date.now() - createdAt > ROOM_TTL) { try { await set(roomRef, null); } catch (_) { continue; } }
          else continue;
        }
        await update(roomRef, { createdAt: serverTimestamp(), game, config });
        await this._enter(code, 'A', name);
        // La hora la pone el servidor: si el reloj del celular está corrido, el apunte
        // igual cae en el balde correcto. En segundo plano, la sala ya está lista.
        get(ref(d, `rooms/${code}/createdAt`)).then(snap => {
          const createdAt = snap.val() || Date.now();
          cleanup(d, code, createdAt);
          record(game, code, createdAt, { role: 'A', name, created: true });
        });
        return code;
      }
      throw new Error('no-code');
    },

    /**
     * Se une a una sala existente. Si este dispositivo ya tenía un rol en la sala, lo retoma.
     * Espera conexión y lleva tope, por lo mismo que `create`.
     */
    async join(code, opts) {
      const d = getDb();
      await waitConnected(connWatch(d), CONNECT_MS);
      return withTimeout(this._join(d, code, opts), OP_MS);
    },

    async _join(d, code, { name, previousRole = null }) {
      const snap = await get(ref(d, `rooms/${code}`));
      if (!snap.exists()) throw new Error('not-found');
      const room = snap.val();
      if (room.game !== game) throw new Error('other-game');
      if (Date.now() - (room.createdAt || 0) > ROOM_TTL) throw new Error('expired');
      const players = room.players || {};
      let role = previousRole;
      if (!role) role = await this._claimRole(code, ROLES.slice(0, maxPlayers).filter(r => !players[r]), name);
      await this._enter(code, role, name);
      // El que entra no vuelve a apuntar el código (las reglas no dejan pisar el apunte):
      // solo refresca la marca del balde y, si le toca, barre.
      cleanup(d, code, room.createdAt, { note: false });
      // Solo cuenta la entrada nueva: retomar la partida no es empezar otra.
      if (!previousRole) record(game, code, room.createdAt, { role, name, created: false });
      return { role, config: room.config, players };
    },

    /**
     * Reclama el primer rol libre. Escribe y vuelve a leer: si otro dispositivo ganó
     * la carrera, su identificador quedará en el nodo y probamos con el rol siguiente.
     */
    async _claimRole(code, candidates, name) {
      const d = getDb();
      for (const role of candidates) {
        const meRef = ref(d, `rooms/${code}/players/${role}`);
        if ((await get(meRef)).exists()) continue;
        await set(meRef, { name, online: true, uid });
        if ((await get(meRef)).val()?.uid === uid) return role;
      }
      throw new Error('full');
    },

    async _enter(code, role, name) {
      const d = getDb();
      this.code = code; this.role = role; this.roles = [role];
      const meRef = ref(d, `rooms/${code}/players/${role}`);
      this._me = meRef;
      // `set` y no `update`: entrar borra la despedida de la vez anterior (dispose.js).
      await set(meRef, { name, online: true, uid });
      onDisconnect(meRef).update({ online: false });
      // Reconexión: al volver, marcar online de nuevo. `left: false` porque volver de un
      // túnel es lo contrario de irse: si quedó una despedida a medias, se deshace acá.
      const connRef = ref(d, '.info/connected');
      this._unsubs.push(onValue(connRef, s => { if (s.val()) { update(meRef, { online: true, left: false }); onDisconnect(meRef).update({ online: false }); } }));
    },

    send(msg) {
      const d = getDb();
      return push(ref(d, `rooms/${this.code}/messages`), { ...msg, from: this.role, at: serverTimestamp() });
    },

    onMessage(cb) {
      const d = getDb();
      this._unsubs.push(onChildAdded(ref(d, `rooms/${this.code}/messages`), snap => cb({ ...snap.val(), id: snap.key })));
    },

    onPresence(cb) {
      const d = getDb();
      this._unsubs.push(onValue(ref(d, `rooms/${this.code}/players`), snap => cb(snap.val() || {})));
    },

    /** Suelta los oyentes de este celular. La sala queda como está, esperando (C-6). */
    leave() {
      this._unsubs.forEach(u => { try { u(); } catch (_) { /* nada */ } });
      this._unsubs = [];
    },

    /**
     * Despedida limpia: este rol queda fuera de la sala y, si con eso no queda nadie, la
     * sala se borra en el acto en vez de esperar seis horas (dispose.js, D-50).
     *
     * Es para cuando la persona se va **a propósito**: cancelar la sala, salirse de ella,
     * cambiar de modo. Cerrar la pestaña o quedarse sin señal no pasa por acá: eso solo
     * apaga `online`, porque esa partida se puede retomar y la sala tiene que esperarla.
     *
     * Lleva tope y nunca lanza: quien ya se está yendo no puede quedarse con el botón
     * pegado ni ver un error de algo que no le importa (C-14).
     */
    async dispose() {
      const { code, role, _me: me } = this;
      this.leave();                       // primero soltar los oyentes: al reconectar no debe volver a marcarse online
      this.code = null; this.role = null; this.roles = []; this._me = null;
      if (!code || !role) return { left: false, removed: false };
      try { await withTimeout(onDisconnect(me).cancel(), LEAVE_MS); } catch (_) { /* igual se va */ }
      try { return await withTimeout(disposeRoom(dbApi(getDb()), code, role), LEAVE_MS); }
      catch (_) { return { left: false, removed: false }; }
    },
  };
  return t;
}
