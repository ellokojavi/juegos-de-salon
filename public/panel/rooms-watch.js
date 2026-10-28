/**
 * The panel's live rooms, read without their messages (D-474, #848).
 *
 * Firebase cannot leave a child out of a query, and a room's `messages` are most of its bytes:
 * every move of every room used to reach the panel. Now each room keeps `counts/<t>` (the
 * transport bumps it on every message), so the panel lists the room codes with a shallow REST
 * read every half minute and listens, per room, only to the fields it shows. A room with no
 * `counts` (from before the counters, or one where nobody wrote yet) is read with its messages,
 * as before, until its counters show up: its numbers stay the same.
 *
 * `fb` is `{ db, ref, onValue }`; `codes()` resolves to the room codes; `onChange(rooms)` gets the
 * same shape the old query gave (`{ CODE: { createdAt, lastAt, game, players, counts, messages? } }`).
 */
export const FIELDS = ['lastAt', 'game', 'players', 'counts'];
export const LIST_EVERY = 30_000;

export function watchRooms({ fb, codes, since, onChange, onError = () => {}, every = LIST_EVERY }) {
  const { db, ref, onValue } = fb;
  const rooms = {};
  const subs = {};  // code → { createdAt, fields: [unsub], messages }
  let stopped = false;
  const emit = () => { if (!stopped) onChange({ ...rooms }); };

  const drop = code => {
    const s = subs[code];
    if (!s) return;
    s.createdAt?.(); s.messages?.();
    for (const f of s.fields || []) f();
    delete subs[code];
    if (rooms[code]) { delete rooms[code]; emit(); }
  };

  const follow = code => {
    const s = subs[code] = { fields: null, messages: null };
    s.createdAt = onValue(ref(db, `rooms/${code}/createdAt`), snap => {
      const createdAt = snap.val();
      if (typeof createdAt !== 'number' || createdAt < since()) {
        // Gone, or older than six hours: nothing to show, nothing else to download
        for (const f of s.fields || []) f();
        s.messages?.(); s.fields = null; s.messages = null;
        if (rooms[code]) { delete rooms[code]; emit(); }
        return;
      }
      rooms[code] = { ...(rooms[code] || {}), createdAt };
      if (!s.fields) {
        s.fields = FIELDS.map(f => onValue(ref(db, `rooms/${code}/${f}`), sn => {
          const room = rooms[code];
          if (!room) return;
          const v = sn.val();
          if (v == null) delete room[f]; else room[f] = v;
          if (f === 'counts') {
            if (v == null && !s.messages) {
              s.messages = onValue(ref(db, `rooms/${code}/messages`), m => {
                if (!rooms[code]) return;
                rooms[code].messages = m.val() || {};
                emit();
              }, onError);
            } else if (v != null && s.messages) {
              s.messages(); s.messages = null;
              delete room.messages;
            }
          }
          emit();
        }, onError));
      }
      emit();
    }, onError);
  };

  const list = async () => {
    let now;
    try { now = await codes(); } catch (e) { onError(e); return; }
    if (stopped) return;
    const set = new Set(now);
    for (const code of Object.keys(subs)) if (!set.has(code)) drop(code);
    for (const code of set) if (!subs[code]) follow(code);
    emit();
  };

  list();
  const timer = setInterval(list, every);
  return () => {
    stopped = true;
    clearInterval(timer);
    for (const code of Object.keys(subs)) drop(code);
  };
}

/** The room codes, from a shallow REST read (keys only, no data): `{ ABCD: true, ... }`. */
export async function shallowCodes(databaseURL, token, fetchFn = fetch) {
  const res = await fetchFn(`${databaseURL}/rooms.json?shallow=true&auth=${encodeURIComponent(token)}`);
  if (res.status === 401 || res.status === 403) throw new Error('permission_denied');
  if (!res.ok) throw new Error(`rooms list: HTTP ${res.status}`);
  return Object.keys((await res.json()) || {}).filter(c => /^[A-Z]{4}$/.test(c));
}
