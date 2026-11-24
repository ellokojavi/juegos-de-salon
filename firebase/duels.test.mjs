// Duels (lab flag rivals, public/assets/js/duels.js): who may create a duel, begin a round and write
// its result, run on the real rules (tools/firebase/rules-sim.mjs) and on the test store
// (jugador-local.js) with the same steps; then how a duel is decided, which is pure.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';
import { crearAlmacenLocal } from '../public/assets/js/jugador-local.js';
import { crearJugador } from '../public/assets/js/jugador.js';
import { estado, record, nemesis, rivalidades, archirrival, estadisticas, sugeridos, ganaRonda, roundGame, DURACION } from '../public/assets/js/duels.js';

const T0 = 1_800_000_000_000;
const A = 'aaaa1111', B = 'bbbb2222', C = 'cccc3333', DID = 'duel000001';
const ok = (r, msg, db) => assert.equal(r, true, `${msg} (${db?.why?.join(', ')})`);
const no = (r, msg) => assert.equal(r, false, msg);
const duelo = (f = 'bo3') => ({ a: A, b: B, an: 'Ana', bn: 'Beto', f, g: 'desenredo', sd: f === 'bo5' ? ['ABCDE', 'FGHJK', 'LMNPQ', 'RSTUV', 'WXYZA'] : ['ABCDE', 'FGHJK', 'LMNPQ'], at: { '.sv': 'timestamp' } });
const crear = (d = duelo()) => ({ [`duelos/${DID}`]: d, [`jugadorDuelos/${A}/${DID}`]: { '.sv': 'timestamp' }, [`jugadorDuelos/${B}/${DID}`]: { '.sv': 'timestamp' }, [`duelosRecientes/${DID}`]: { '.sv': 'timestamp' } });

{
  const base = {
    jugadores: { [A]: { n: 'Ana', at: T0 }, [B]: { n: 'Beto', at: T0 }, [C]: { n: 'Caro', at: T0 } },
    jugadorSeats: { [A]: { ua: 'x'.repeat(64) }, [B]: { ub: 'y'.repeat(64) }, [C]: { uc: 'z'.repeat(64) } },
  };
  const db = createDb(undefined, base);
  const w = (uid, ch, t = T0 + 1000) => db.update(ch, { uid, now: t });
  no(w('ub', crear()), 'only a phone seated as the challenger creates the duel');
  no(w('ua', crear({ ...duelo(), b: A })), 'nobody challenges themselves');
  no(w('ua', crear({ ...duelo(), b: 'zzzz9999' })), 'the rival is a player');
  no(w('ua', crear({ ...duelo(), f: 'bo7' })), 'only the formats there are');
  no(w('ua', crear({ ...duelo('bo5'), sd: ['ABCDE', 'FGHJK', 'LMNPQ'] })), 'best of five carries five seeds');
  no(w('ua', crear({ ...duelo(), r: { [A]: { 0: { s: 100, ms: 1, at: T0 } } } })), 'a duel is born with no results');
  no(w('uc', { [`jugadorDuelos/${C}/${DID}`]: { '.sv': 'timestamp' } }), 'no stray entry in a list');
  no(w('ua', crear({ ...duelo(), gr: ['reinas', 'tango', 'zip', 'anio'] })), 'a custom duel names a game only for the rounds it has');
  no(w('ua', crear({ ...duelo(), gr: ['Reinas!', 'tango', 'zip'] })), "a round's game is a game id");
  ok(w('ua', crear()), 'the challenger creates the duel and both lists', db);
  no(w('ua', crear()), 'a duel is written once');
  no(w('ua', { [`duelosRecientes/${DID}`]: { '.sv': 'timestamp' } }), 'the recent list takes a duel only with its creation');
  no(w('uc', { 'duelosRecientes/zzzzzzzzzz': { '.sv': 'timestamp' } }), 'no stray entry in the recent list');
  no(w('uc', { [`jugadorDuelos/${C}/${DID}`]: { '.sv': 'timestamp' } }), 'nobody else joins it later');
  no(w('ub', { [`duelos/${DID}/r/${B}/0`]: { s: 90, ms: 5000, at: { '.sv': 'timestamp' } } }), 'a result needs its round begun');
  no(w('ua', { [`duelos/${DID}/e/${B}/0`]: { '.sv': 'timestamp' } }), 'only the player begins their round');
  no(w('uc', { [`duelos/${DID}/e/${C}/0`]: { '.sv': 'timestamp' } }), 'someone outside the duel plays nothing');
  no(w('ub', { [`duelos/${DID}/e/${B}/3`]: { '.sv': 'timestamp' } }), 'no round past the format');
  ok(w('ub', { [`duelos/${DID}/e/${B}/0`]: { '.sv': 'timestamp' } }), 'the rival begins round 1', db);
  no(w('ub', { [`duelos/${DID}/e/${B}/0`]: { '.sv': 'timestamp' } }), 'a round begins once');
  no(w('ub', { [`duelos/${DID}/r/${B}/0`]: { s: 200000, ms: 5000, at: { '.sv': 'timestamp' } } }), 'a score within the bounds');
  ok(w('ub', { [`duelos/${DID}/r/${B}/0`]: { s: 90, ms: 5000, at: { '.sv': 'timestamp' } } }), 'and writes its result', db);
  no(w('ub', { [`duelos/${DID}/r/${B}/0`]: { s: 100, ms: 4000, at: { '.sv': 'timestamp' } } }), 'a result is written once');
  no(w('ua', { [`duelos/${DID}/e/${A}/0`]: { '.sv': 'timestamp' } }, T0 + 1000 + DURACION), 'after three days nothing is played');
}

{
  // The same steps on the test store, through the duels' own API
  const mem = new Map();
  const storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let t = T0;
  const now = () => t;
  const almacen = crearAlmacenLocal({ storage, now });
  const J = crearJugador({ almacen, storage, now, esperar: async ms => { t += ms; } });
  const beto = await J.crear('Beto', '1234');
  J.salir?.();
  const ana = await J.crear('Ana', '4321');
  const D = await J.duelos();
  const d = await D.retar({ b: beto.jid, bn: 'Beto', g: 'desenredo', f: 'bo3' });
  assert.equal((await D.mios()).length, 1, "the duel is in the challenger's list");
  assert.deepEqual((await D.recientes()).map(x => x.id), [d.id], 'and in the public list of recent duels');
  assert.ok(await almacen.get(`jugadorDuelos/${beto.jid}/${d.id}`), "and in the rival's");
  assert.equal(await D.empezar(d.id, 0), true);
  assert.equal(await D.empezar(d.id, 0), false, 'a round begins once');
  assert.equal(await D.anotar(d.id, 0, { s: 80, ms: 60000 }), true);
  await assert.rejects(D.anotar(d.id, 0, { s: 90, ms: 1 }), 'and is written once');
  const e = estado(await D.leer(d.id), ana.jid, t);
  assert.deepEqual([e.mias[0].s, e.turno, e.termino], [80, 1, false], 'round 2 is next');
  assert.equal((await D.buscar('beto'))[0]?.jid, beto.jid, 'a rival is found by name');
  assert.equal((await D.buscar('be'))[0]?.jid, beto.jid, 'and by the start of the name, as it is typed');
  assert.deepEqual(await D.buscar('zz'), [], 'nobody, no result');
  // A custom duel: each round its own game
  const c = await D.retar({ b: beto.jid, bn: 'Beto', g: 'reinas', f: 'pts', gr: ['reinas', 'tango', 'desenredo'] });
  const c2 = await D.leer(c.id);
  assert.deepEqual([0, 1, 2].map(i => roundGame(c2, i)), ['reinas', 'tango', 'desenredo'], "a custom duel's rounds play their own games");
  const q = await D.retar({ b: beto.jid, bn: 'Beto', g: 'zip', f: 'bo3', gr: ['zip', 'zip', 'zip'] });
  assert.equal((await D.leer(q.id)).gr, undefined, 'the same game every round is a quick duel: no gr');
}

{
  // How a duel is decided
  const at = T0;
  const r = (s, ms = 1000) => ({ s, ms, at });
  const d = (f, ra = {}, rb = {}, e = {}) => ({ a: A, b: B, an: 'Ana', bn: 'Beto', f, at, sd: {}, r: { [A]: ra, [B]: rb }, e });
  assert.equal(ganaRonda(r(80), r(70)), 1);
  assert.equal(ganaRonda(r(80, 900), r(80, 1000)), 1, 'the same score: the faster wins');
  assert.equal(ganaRonda(r(80), r(80)), 0);
  assert.equal(ganaRonda(null, r(0)), -1, 'a round played beats one not played, even at 0');
  let e = estado(d('bo3', { 0: r(90), 1: r(90) }, { 0: r(50), 1: r(50) }), A, at + 1);
  assert.deepEqual([e.termino, e.gano, e.puntos], [true, 1, [2, 0]], 'best of three ends at two');
  e = estado(d('bo3', { 0: r(90), 1: r(90), 2: r(90) }, { 0: r(50) }), A, at + 1);
  assert.deepEqual([e.termino, e.rondas], [false, ['w', null, null]], 'a round counts once both played it');
  e = estado(d('bo3', { 0: r(90), 1: r(90), 2: r(90) }, { 0: r(50) }), B, at + 1);
  assert.equal(e.turno, 1, "the rival's turn is their next round");
  e = estado(d('bo3', { 0: r(90) }, {}), A, at + DURACION);
  assert.deepEqual([e.termino, e.gano, e.rondas], [true, 1, ['w', 't', 't']], 'after three days what was not played is a 0');
  e = estado(d('bo3', {}, {}, { [B]: { 0: at } }), A, at + DURACION);
  assert.deepEqual([e.termino, e.gano], [true, 0], 'a round begun and left is worth nothing');
  e = estado(d('pts', { 0: r(90), 1: r(10), 2: r(10) }, { 0: r(40), 1: r(40), 2: r(40) }), A, at + 1);
  assert.deepEqual([e.termino, e.gano, e.puntos], [true, -1, [110, 120]], 'most points adds every round');
  const lista = [
    { ...d('bo3', { 0: r(9), 1: r(9) }, { 0: r(1), 1: r(1) }), id: 'x1', at: at + 3 },
    { ...d('bo3', { 0: r(1), 1: r(1) }, { 0: r(9), 1: r(9) }), id: 'x2', at: at + 2 },
    { ...d('bo3', { 0: r(1), 1: r(1) }, { 0: r(9), 1: r(9) }), id: 'x3', at: at + 1 },
  ];
  assert.deepEqual(record(lista, A, at + 10), { g: 1, p: 2, e: 0, pct: 33, racha: 1 });
  assert.equal(nemesis(lista, A, at + 10)?.jid, B, 'the rival I lose to most');
  assert.deepEqual(rivalidades(lista, A, at + 10).map(x => [x.jid, x.g, x.p, x.total]), [[B, 1, 2, 3]], 'head to head with each rival');
  assert.equal(archirrival(lista, A, at + 10)?.jid, B, 'three duels with the same rival make an arch rival');
  assert.equal(archirrival(lista.slice(0, 2), A, at + 10), null, 'two duels are not a rivalry yet');
  const st = estadisticas(lista, A, at + 10);
  assert.deepEqual([st.jugados, st.g, st.p, st.rondasG, st.rondasP, st.rivales, st.abiertos], [3, 1, 2, 2, 4, 1, 0], 'the stats panel');
  assert.deepEqual(sugeridos(lista, A, { [C]: 'Caro', [B]: 'Beto' }).map(x => x.jid), [B, C], 'rivals first, then cup friends, once each');
}
