/**
 * Transporte remoto compartido por los juegos: sala en Firebase Realtime Database.
 * Se crea con createFirebaseTransport({ game }) y el campo `game` de la sala separa los juegos.
 * Los mensajes son append-only en rooms/<CODE>/messages; cada cliente reconstruye el estado leyéndolos en orden.
 * Reglas de seguridad: firebase/database.rules.json.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getDatabase, ref, get, set, update, push, onChildAdded, onValue, onDisconnect, runTransaction, serverTimestamp, increment,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { firebaseConfig } from '../firebase-config.js';
import { IDLE_TTL, ROOM_TTL, dayOf, noteRoom, roomCreation } from './cleanup.js';
import { message, quiet } from './best-effort.js';
import { disposeRoom } from './dispose.js';
import { claimSeat } from './seat.js';
import { CONNECT_MS, LEAVE_MS, OP_MS, waitConnected, withTimeout } from './errors.js';
import { checkQuota, noteCreated } from './ratelimit.js';
import { stats, noteRoom as recordRoom, notePlayer as recordPlayer, noteStart as recordStart, noteEnd as recordEnd } from './stats.js';

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

/** Cada cuánto, como mucho, este celular refresca el latido de su sala. */
const TOUCH_EVERY = 60 * 1000;

/**
 * ¿Esta sala ya venció? Media hora sin jugadas o seis horas desde que nació (D-89).
 * Una sala sin `lastAt` es de antes de que existiera el latido: vale el tope de seis horas.
 */
export const roomExpired = (room, now = Date.now()) => !room
  || now - (room.createdAt || 0) > ROOM_TTL
  || (typeof room.lastAt === 'number' && now - room.lastAt > IDLE_TTL);

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
  transact: async (path, fn) => {
    const r = await runTransaction(ref(d, path), fn);
    return { committed: r.committed, value: r.snapshot.val() };
  },
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
 * The server clock as this phone estimates it. `.info/serverTimeOffset` is local to the SDK and
 * known once connected: it puts a new room's note in the server's day even if the phone's clock
 * is off (D-321).
 */
const serverNow = d => new Promise(resolve => onValue(ref(d, '.info/serverTimeOffset'),
  s => resolve(Date.now() + (Number(s.val()) || 0)), { onlyOnce: true }));

/**
 * El que entra a una sala ajena refresca la marca de su balde (canon C-7): the bucket stays closed
 * while a room in it can be alive. The sweep itself is the nightly job's (D-499).
 * No se espera ni se muestra: si algo falla, la partida sigue igual.
 */
async function cleanup(d, code, createdAt) {
  try { await noteRoom(dbApi(d), code, createdAt, { note: false }); } catch (_) { /* mejor esfuerzo */ }
}

export function createFirebaseTransport({ game, maxPlayers = 2 }) {
  // Identificador de este dispositivo: sirve para resolver quién se quedó con un rol
  // cuando dos personas entran a la sala en el mismo instante.
  const uid = randomRoomCode() + Date.now().toString(36);
  const t = {
    uid,
    kind: 'firebase',
    code: null,
    createdAt: 0,   // cuándo nació la sala: el registro del panel vive en el día de esa fecha
    role: null,
    roles: [],
    _me: null,
    _touchedAt: 0,
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

    /**
     * El latido de la sala: `lastAt` con la hora del servidor, que es la que miran las reglas.
     *
     * Va aparte de la jugada y sin esperarlo a propósito. Si las reglas publicadas todavía no
     * conocen `lastAt` el escrito se rechaza, y entonces la sala se comporta como siempre
     * (vence a las seis horas): una partida en curso no se cae porque falte publicar reglas.
     */
    _touch(d) {
      const now = Date.now();
      if (!this.code || now - this._touchedAt < TOUCH_EVERY) return;
      this._touchedAt = now;
      try { set(ref(d, `rooms/${this.code}/lastAt`), serverTimestamp()).catch(() => { /* mejor esfuerzo */ }); }
      catch (_) { /* nada */ }
    },

    async _create(d, { config, name }) {
      for (let i = 0; i < 8; i++) {
        const code = randomRoomCode();
        const roomRef = ref(d, `rooms/${code}`);
        const snap = await get(roomRef);
        if (snap.exists()) {
          if (roomExpired(snap.val())) { try { await set(roomRef, null); } catch (_) { continue; } }
          else continue;
        }
        // The room and its note in the cleanup bucket in one write: a room that exists is
        // always noted, even if the page dies right after (D-321).
        const day = dayOf(await serverNow(d));
        await update(ref(d), roomCreation(code, { game, config, day, stamp: serverTimestamp() }));
        await claimSeat(dbApi(d), code, ['A'], { uid, name });
        await this._enter(code, 'A', name, { claimed: true });
        // La hora la pone el servidor: el panel la usa para su registro. En segundo plano,
        // la sala ya está lista.
        quiet(get(ref(d, `rooms/${code}/createdAt`)).then(snap => {
          const createdAt = snap.val() || Date.now();
          this.createdAt = createdAt;
          record(game, code, createdAt, { role: 'A', name, created: true });
        }), 'room note');
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
      if (roomExpired(room)) throw new Error('expired');
      const players = room.players || {};
      let role = previousRole;
      // A new player takes a free seat with a transaction (seat.js); resuming rewrites its own.
      if (!role) role = await claimSeat(dbApi(d), code, ROLES.slice(0, maxPlayers).filter(r => !players[r]), { uid, name });
      await this._enter(code, role, name, { claimed: !previousRole });
      // El que entra no vuelve a apuntar el código (las reglas no dejan pisar el apunte):
      // solo refresca la marca del balde y, si le toca, barre.
      this.createdAt = room.createdAt || 0;
      cleanup(d, code, room.createdAt);
      // Solo cuenta la entrada nueva: retomar la partida no es empezar otra.
      if (!previousRole) record(game, code, room.createdAt, { role, name, created: false });
      return { role, config: room.config, players };
    },

    /**
     * Sits in `role`. A seat just `claimed` was already written by its transaction (seat.js) and
     * is not written again; resuming (`previousRole`) rewrites it, with this page's new `uid`.
     */
    async _enter(code, role, name, { claimed = false } = {}) {
      const d = getDb();
      this.code = code; this.role = role; this.roles = [role];
      const meRef = ref(d, `rooms/${code}/players/${role}`);
      this._me = meRef;
      // `set` y no `update`: entrar borra la despedida de la vez anterior (dispose.js).
      if (!claimed) await set(meRef, { name, online: true, uid });
      this._touch(d);   // entrar es actividad: la sala empieza (o sigue) viva
      // Presence is best effort, and nobody waits for it (best-effort.js, D-320)
      quiet(onDisconnect(meRef).update({ online: false }), 'presence');
      // Reconexión: al volver, marcar online de nuevo. `left: false` porque volver de un
      // túnel es lo contrario de irse: si quedó una despedida a medias, se deshace acá.
      const connRef = ref(d, '.info/connected');
      this._unsubs.push(onValue(connRef, s => {
        if (!s.val()) return;
        quiet(update(meRef, { online: true, left: false }), 'presence');
        quiet(onDisconnect(meRef).update({ online: false }), 'presence');
      }));
    },

    /**
     * Apunta quién ganó esta sala para el panel del dueño (D-79). Lo llama el juego cuando
     * llega a su pantalla final; en los transportes sin sala no existe, así que el juego lo
     * llama con `?.` y en un celular no pasa nada. Mejor esfuerzo, como todo lo del panel.
     */
    noteWinner({ role, name } = {}) {
      try {
        if (!this.code || !this.createdAt) return;
        const { api, fp } = stats();
        recordEnd(api, fp, { code: this.code, createdAt: this.createdAt, role, name });
      } catch (_) { /* nada */ }
    },

    /**
     * The games fire and forget: a rejection is handled here, and a resend the rules deny
     * because the message is already in the room is not a failure (best-effort.js, D-320).
     */
    send(msg) {
      const d = getDb();
      this._touch(d);
      const path = `rooms/${this.code}/messages`;
      const p = push(ref(d, path), { ...msg, from: this.role, at: serverTimestamp() });
      // The room counts its own messages by type, once the message is in, so the panel reads the
      // room without them (D-474). Best effort: a missed count only makes the panel's number low.
      const t = msg?.t;
      if (typeof t === 'string' && /^[A-Za-z0-9_-]{1,19}$/.test(t)) {
        p.then(() => update(ref(d, `rooms/${this.code}/counts/${t}`), { n: increment(1), at: serverTimestamp() }))
          .catch(() => { /* best effort */ });
      }
      return message(p, async () => (await get(ref(d, `${path}/${p.key}`))).exists());
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
     * sala se borra en el acto en vez de esperar a que venza (dispose.js, D-50).
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
