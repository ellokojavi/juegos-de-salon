// Room and cleanup limits (issue #849): a room is created with its cleanup note, its config, seats and
// messages take only the fields the games send, and a bucket's lastAt only moves forward on a
// current day. Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';
import { roomCreation, dayOf } from '../public/assets/js/transport/cleanup.js';

const T0 = 1_800_000_000_000;
const DAY = dayOf(T0);
const TS = { '.sv': 'timestamp' };
const ok = (r, msg, db) => assert.equal(r, true, `${msg} (${db?.why?.join(', ')})`);
const no = (r, msg) => assert.equal(r, false, msg);
const at = (now = T0) => ({ uid: null, now });

const fresh = () => createDb(undefined, {});
const create = (db, code, config = { lives: 6, buy: true, theme: 'mezcla', seed: 123 }, day = DAY, now = T0) =>
  db.update(roomCreation(code, { game: 'ahorcado', config, day, stamp: TS }), at(now));

// ---- Creating a room ----
{
  const db = fresh();
  ok(create(db, 'ABCD'), 'the app creates a room with its note in one write', db);
  no(db.update({ 'rooms/WXYZ/createdAt': TS, 'rooms/WXYZ/game': 'ahorcado', 'rooms/WXYZ/config': { lives: 6 } }, at()), 'a room without its cleanup note is refused');
  ok(create(db, 'BCDE', undefined, DAY - 1), "a note in yesterday's bucket (phone clock near midnight) is accepted", db);
  ok(create(db, 'CDEF', undefined, DAY + 1), "and in tomorrow's", db);
  no(create(db, 'DEFG', undefined, DAY - 5), 'a note in an old bucket is not the note');
  no(create(db, 'EFGH', { lives: 6, extra: 'x' }), 'config takes only known settings');
  no(create(db, 'FGHJ', { theme: 'x'.repeat(101) }), 'config values are short');
  no(create(db, 'FGHK', { lives: { a: { b: 1 } } }), 'config values are not objects');
  ok(create(db, 'GHJK', { theme: 'historia', handSize: 5, shared: true, spread: true, seed: 9, skip: Array.from({ length: 200 }, (_, i) => `card-${i}`) }), "Timeline's config with its 200 skipped cards", db);
  ok(create(db, 'HJKL', { dice: 5, calzar: true, chileno: true, shake: false, turnSecs: 30, players: null }), "Liar's dice config", db);
}

// ---- Seats and messages ----
{
  const db = fresh();
  ok(create(db, 'ABCD'), 'room', db);
  const seat = (p, v) => db.update({ [`rooms/ABCD/players/${p}`]: v }, at(T0 + 1000));
  ok(seat('A', { name: 'Ana', online: true, uid: 'XYZW' + 'lmn0p' }), 'a seat as the app writes it', db);
  ok(db.update({ 'rooms/ABCD/players/A/online': false, 'rooms/ABCD/players/A/left': true }, at(T0 + 2000)), 'the farewell', db);
  no(seat('B', { name: 'Beto', online: true, uid: 'u', blob: 'x' }), 'a seat takes no other field');
  no(seat('B', { name: 'Beto', online: true, uid: 'u'.repeat(41) }), 'the device id is short');

  let i = 0;
  const send = m => db.update({ [`rooms/ABCD/messages/m${i++}`]: { ...m, at: TS } }, at(T0 + 3000));
  const good = [
    { t: 'hello', from: 'A', name: 'Ana' },
    { t: 'start', from: 'A', order: ['A', 'B', 'C'], seed: 42 },
    { t: 'chat', from: 'B', text: 'hola' },
    { t: 'word', from: 'A', to: 'B', shape: '.... ...', hint: 'animal', hash: 'f'.repeat(64) },
    { t: 'reply', from: 'B', n: 3, result: 'hundido', ship: 'carrier', cells: [{ r: 1, c: 2 }, { r: 1, c: 3 }] },
    { t: 'shot', from: 'A', cell: { r: 4, c: 5 } },
    { t: 'reveal', from: 'A', layout: { carrier: { r: 0, c: 0, dir: 'h' }, sub: { r: 2, c: 3, dir: 'v' } }, salt: 'abc' },
    { t: 'reparte', from: 'A', n: 1, triunfo: '3o', s: { A: 'x'.repeat(344), B: 'y'.repeat(344) } },
    { t: 'hello', from: 'B', name: 'Beto', pub: 'k'.repeat(392) },
    { t: 'rematch', from: 'A', code: 'QRST' },
    // Liar's dice
    { t: 'roll', from: 'A', h: 'a'.repeat(64) }, { t: 'roll', from: 'B', d: '12345' }, { t: 'open', from: 'A', d: '12345', salt: 's'.repeat(32) },
    { t: 'bid', from: 'A', n: 3, p: 5 }, { t: 'dudo', from: 'B' }, { t: 'calza', from: 'A' }, { t: 'timeout', from: 'A', r: 2 },
    // Generala
    { t: 'roll', from: 'A', d: '12345', k: '10100' }, { t: 'score', from: 'A', c: 'full' },
    // Julep
    { t: 'revela', from: 'A', n: 1, cs: 'x'.repeat(40) }, { t: 'reparte', from: 'A', n: 2, triunfo: '1e', m: { A: '1e2e3e', B: '4o5o6o' } },
    { t: 'va', from: 'A' }, { t: 'paso', from: 'B' }, { t: 'cambia', from: 'A', i: '0,2' }, { t: 'juega', from: 'A', c: '7o' }, { t: 'regala', from: 'A', a: 'B,C' },
    // Hangman
    { t: 'reply', from: 'A', to: 'B', n: 1, letter: 'E', pos: '1,4' }, { t: 'reveal', from: 'A', to: 'B', word: 'gato', salt: 'abc' },
    { t: 'guess', from: 'B', letter: 'E', n: 1, ms: 2300 }, { t: 'buy', from: 'B', n: 2, ms: 900 },
    // Battleship
    { t: 'commit', from: 'A', hash: 'b'.repeat(64) }, { t: 'reply', from: 'A', n: 2, result: 'agua' },
    // Bulls and cows
    { t: 'reply', from: 'B', of: 'A', n: 1, famas: 1, toques: 2 }, { t: 'reply', from: 'B', round: 3, famas: 0, toques: 0 },
    { t: 'guess', from: 'A', value: '1234' }, { t: 'reveal', from: 'A', secret: '1234', salt: 'abc' },
    // Timeline
    { t: 'place', from: 'A', card: 'hist-12', slot: 3, ms: 4000 },
  ];
  for (const m of good) ok(send(m), `the games' ${m.t} message`, db);
  no(send({ t: 'chat', from: 'A', text: 'hi', blob: 'x' }), 'a message takes only the fields the games send');
  no(send({ t: 'word', from: 'A', hint: 'x'.repeat(201) }), 'its fields are short');
  no(send({ t: 'shot', from: 'A', cell: { r: { deep: 1 } } }), 'and not deeper than the games write');
  no(send({ t: 'start', from: 'A', order: ['A', 'Z'] }), 'an order lists seats');
}

// ---- A bucket's lastAt ----
{
  const db = fresh();
  ok(create(db, 'ABCD'), 'room', db);
  const bump = (day, now) => db.update({ [`cleanup/days/${day}/lastAt`]: TS }, at(now));
  ok(bump(DAY, T0 + 60000), "a player who joins refreshes today's bucket", db);
  ok(bump(DAY, T0 + 86400000), "and the day after (a room from before midnight)", db);
  no(bump(DAY, T0 + 3 * 86400000), 'an old bucket can no longer be kept from being swept');
  no(db.update({ [`cleanup/days/${DAY}/lastAt`]: T0 }, at(T0 + 120000)), 'lastAt never moves back');
}
// ---- The room's own counters (D-474) ----
{
  const db = fresh();
  ok(create(db, 'ABCD'), 'room', db);
  const INC = { '.sv': { increment: 1 } };
  const count = (t, v = { n: INC, at: TS }, now = T0 + 1000) => db.update({ [`rooms/ABCD/counts/${t}`]: v }, at(now));
  ok(count('hello'), 'the first message of a type starts its counter at 1', db);
  ok(count('hello'), 'and the next one adds 1', db);
  no(count('shot', { n: 5, at: TS }), 'a counter does not jump');
  no(count('hello', { n: 1, at: TS }), 'nor go back');
  no(count('bad.type'), 'the type is a plain key');
  no(count('shot', { n: INC, at: TS, x: 1 }), 'a counter takes no other field');
  no(count('shot', undefined, T0 + 7 * 3600000), 'a dead room counts nothing');
}
console.log('room limits: ok');
