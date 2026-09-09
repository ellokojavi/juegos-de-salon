/**
 * Transporte remoto: sala en Firebase Realtime Database.
 * Los mensajes son append-only en rooms/<CODE>/messages; cada cliente reconstruye el estado leyéndolos en orden.
 * Reglas de seguridad: firebase/database.rules.json.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getDatabase, ref, get, set, update, push, onChildAdded, onValue, onDisconnect, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { firebaseConfig } from '../../assets/js/firebase-config.js';
import { randomRoomCode } from '../engine.js';

const ROOM_TTL = 6 * 60 * 60 * 1000;
let db = null;
function getDb() {
  if (!db) db = getDatabase(initializeApp(firebaseConfig));
  return db;
}

export function createFirebaseTransport({ game }) {
  const t = {
    kind: 'firebase',
    code: null,
    role: null,
    roles: [],
    _unsubs: [],

    /** Crea una sala nueva con un código libre. Devuelve el código. */
    async create({ config, name }) {
      const d = getDb();
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
        return code;
      }
      throw new Error('no-code');
    },

    /** Se une a una sala existente. Si este dispositivo ya tenía un rol en la sala, lo retoma. */
    async join(code, { name, previousRole = null }) {
      const d = getDb();
      const snap = await get(ref(d, `rooms/${code}`));
      if (!snap.exists()) throw new Error('not-found');
      const room = snap.val();
      if (room.game !== game) throw new Error('other-game');
      if (Date.now() - (room.createdAt || 0) > ROOM_TTL) throw new Error('expired');
      const players = room.players || {};
      let role = previousRole;
      if (!role) {
        if (!players.A) role = 'A';
        else if (!players.B) role = 'B';
        else throw new Error('full');
      }
      await this._enter(code, role, name);
      return { role, config: room.config };
    },

    async _enter(code, role, name) {
      const d = getDb();
      this.code = code; this.role = role; this.roles = [role];
      const meRef = ref(d, `rooms/${code}/players/${role}`);
      await set(meRef, { name, online: true });
      onDisconnect(meRef).update({ online: false });
      // Reconexión: al volver, marcar online de nuevo
      const connRef = ref(d, '.info/connected');
      this._unsubs.push(onValue(connRef, s => { if (s.val()) { update(meRef, { online: true }); onDisconnect(meRef).update({ online: false }); } }));
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

    leave() {
      this._unsubs.forEach(u => { try { u(); } catch (_) { /* nada */ } });
      this._unsubs = [];
    },
  };
  return t;
}
