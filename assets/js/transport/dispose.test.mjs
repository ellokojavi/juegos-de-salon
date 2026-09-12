// Ejecutar: node assets/js/transport/dispose.test.mjs
import assert from 'node:assert/strict';
import { deserted, disposeRoom, farewell } from './dispose.js';

/**
 * Base de datos falsa que imita las reglas de firebase/database.rules.json: una sala viva
 * solo se puede borrar cuando todos los que están adentro se despidieron.
 */
function fakeDb(rooms) {
  const api = {
    removed: [],
    read(path) {
      const [, code, child] = path.split('/');
      const room = rooms[code];
      return Promise.resolve(child ? room?.[child] ?? null : room ?? null);
    },
    update(path, changes) {
      const [, code, , role] = path.split('/');
      const room = rooms[code];
      if (!room) return Promise.reject(new Error('permission-denied'));
      room.players[role] = { ...room.players[role], ...changes };
      return Promise.resolve();
    },
    remove(path) {
      const code = path.split('/')[1];
      const room = rooms[code];
      if (!room || !deserted(room.players)) return Promise.reject(new Error('permission-denied'));
      delete rooms[code];
      api.removed.push(code);
      return Promise.resolve();
    },
  };
  return api;
}

/* Sala cancelada: el que la creó se va y nadie más llegó, así que la sala se borra */
{
  const rooms = { ABCD: { players: { A: { name: 'Javi', online: true } } } };
  const api = fakeDb(rooms);
  assert.deepEqual(await disposeRoom(api, 'ABCD', 'A'), { left: true, removed: true });
  assert.equal(rooms.ABCD, undefined);
}

/* Se va uno de dos: la sala es del que se queda y no se toca */
{
  const rooms = { EFGH: { players: { A: { name: 'Ana', online: true }, B: { name: 'Beto', online: true } } } };
  const api = fakeDb(rooms);
  assert.deepEqual(await disposeRoom(api, 'EFGH', 'B'), { left: true, removed: false });
  assert.deepEqual(rooms.EFGH.players.B, { name: 'Beto', online: false, left: true }, 'el nombre no se borra');
  assert.equal(rooms.EFGH.players.A.left, undefined);
  // Cuando también se va el otro, ahí sí desaparece
  assert.deepEqual(await disposeRoom(api, 'EFGH', 'A'), { left: true, removed: true });
  assert.deepEqual(api.removed, ['EFGH']);
}

/* Los dos se despiden a la vez: el segundo borrado rebota y no rompe nada */
{
  const rooms = { IJKL: { players: { A: { name: 'Ana' }, B: { name: 'Beto' } } } };
  const api = fakeDb(rooms);
  const [a, b] = await Promise.all([disposeRoom(api, 'IJKL', 'A'), disposeRoom(api, 'IJKL', 'B')]);
  assert.equal(a.left && b.left, true);
  assert.equal(Number(a.removed) + Number(b.removed), 1, 'la borra uno solo');
  assert.deepEqual(api.removed, ['IJKL']);
}

/* Una sala que ya no está: irse nunca falla */
{
  const api = fakeDb({});
  assert.deepEqual(await disposeRoom(api, 'MNPQ', 'A'), { left: false, removed: false });
  assert.deepEqual(await disposeRoom(api, null, null), { left: false, removed: false });
}

/* Una desconexión no es una despedida: `online: false` solo no vacía la sala */
{
  assert.equal(deserted({ A: { online: false }, B: { online: false } }), false);
  assert.equal(deserted({ A: { left: true }, B: { online: true } }), false);
  assert.equal(deserted({ A: { left: true }, B: { left: true } }), true);
  assert.equal(deserted({}), false, 'una sala sin nadie apuntado todavía no es una sala vacía');
  assert.equal(deserted(null), false);
  assert.deepEqual(farewell(), { online: false, left: true });
}

console.log('dispose: todo en verde');
