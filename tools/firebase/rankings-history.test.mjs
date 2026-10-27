// Run: node tools/firebase/rankings-history.test.mjs
// The Cup's history in the rankings (D-212): legacy players, records of the "Cup" tab, podiums and each player's cups (D-220).
import assert from 'node:assert/strict';
import { history, legacyJid, missingPodiums } from './rankings-history.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';
import { esJid, claveOrden } from '../../public/assets/js/records.js';
import { crearAlmacenLocal } from '../../public/assets/js/jugador-local.js';
import { crearJugador } from '../../public/assets/js/jugador.js';

const meta = (o = {}) => nuevaMeta({ nombre: 'Copa Pirata', dias: 3, inicio: '2026-09-01', admin: 'p00001', creada: 0, cal: ['reinas', 'zip', 'final'], ...o });
const cup = (m, players, results) => ({ meta: m, players, results });
const P = (name, at = 1, co) => ({ name, at, ...(co ? { co } : {}) });
const finished = cup(meta(), { p00001: P('Pancho', 1, 'CL'), p00002: P('Cata', 1, 'AR'), p00003: P('Javi') }, {
  1: { p00001: { s: 90, ms: 40000, at: 10 }, p00002: { s: 100, ms: 50000, at: 11 }, p00003: { s: 100, ms: 30000, at: 12 } },
  2: { p00001: { s: 70, ms: 1, at: 20 }, p00002: { s: 20, ms: 1, at: 21 } },
  3: { p00001: { s: 100, ms: 1, at: 30 }, p00002: { s: 50, ms: 1, at: 31 }, p00003: { s: 40, ms: 1, at: 32 } },
});
const other = cup(meta({ nombre: 'Otra', inicio: '2026-09-10' }), { q00001: P('pancho '), q00002: P('Ñandú') }, {
  1: { q00001: { s: 95, ms: 1000, at: 40 }, q00002: { s: 10, ms: 1, at: 41 } },
});
const lab = cup(meta({ nombre: 'Lab', lab: true }), { r00001: P('Labo') }, { 1: { r00001: { s: 100, ms: 1 } } });
const now = Date.UTC(2026, 9, 4);

// A name's jid is always the same and valid
assert.equal(legacyJid('pancho'), legacyJid('pancho'));
assert.ok(esJid(legacyJid('pancho')));
assert.notEqual(legacyJid('pancho'), legacyJid('cata'));

const { changes, people, podiums } = history({ AAAAA: finished, BBBBB: other, CCCCC: lab }, {}, now);
// "Pancho" and "pancho " are the same person; the lab's does not count
assert.deepEqual(people.map(p => p.key).sort(), ['cata', 'javi', 'nandu', 'pancho']);
const pancho = legacyJid('pancho');
assert.deepEqual(changes[`jugadores/${pancho}`].legado, true);
assert.equal(changes[`jugadorNombres/pancho/${pancho}`], true);
// Each one's best day in each standalone game, in its cup table; the final is not a standalone game
assert.deepEqual(changes[`records/reinas_copa/siempre/${pancho}`], { s: 95, ms: 1000, k: claveOrden(95, 1000), at: 40, n: 'pancho', co: 'CL' });
assert.equal(changes[`records/zip_copa/siempre/${pancho}`].s, 70);
assert.ok(!Object.keys(changes).some(r => r.startsWith('records/final')));
assert.ok(!Object.keys(changes).some(r => r.includes(legacyJid('labo'))));
// The finished cup's podium, with the legacy players
assert.deepEqual(Object.keys(podiums).sort(), ['AAAAA', 'BBBBB']);
assert.equal(Object.values(podiums.AAAAA.p).find(x => x.l === 1).j, pancho);
// The flags (D-219): the legacy player, their records and the podium carry the cup's country
assert.equal(changes[`jugadores/${pancho}`].co, 'CL');
assert.equal(changes[`records/reinas_copa/siempre/${pancho}`].co, 'CL');
assert.equal(Object.values(podiums.AAAAA.p).find(x => x.n === 'Cata').co, 'AR');
// Each player's cups (D-220): "Pancho" and "pancho " have both, each with its pid
assert.deepEqual(changes[`jugadorCopas/${pancho}/AAAAA`], { p: 'p00001', at: 1 });
assert.equal(changes[`jugadorCopas/${pancho}/BBBBB`].p, 'q00001');
// One linked to their player records it to that player, also if the cup is the lab's
const linked = cup(meta({ nombre: 'Piratotes', lab: true }), { s00001: { ...P('Jiri', 5), j: 'jiri0001' } }, {});
assert.deepEqual(history({ DDDDD: linked }, { jugadores: { jiri0001: { n: 'Jiri' } } }, now).changes, { 'jugadorCopas/jiri0001/DDDDD': { p: 's00001', at: 5 } });
// With --with-labs, the lab's counts too
assert.ok(Object.keys(history({ CCCCC: lab }, {}, now, { withLabs: true }).changes).some(r => r.includes(legacyJid('labo'))));
// Running it again with what was written repeats nothing
const base = { jugadores: {}, records: {}, torneoPodios: {} };
for (const [r, v] of Object.entries(changes)) {
  const ps = r.split('/'); let o = base;
  for (const p of ps.slice(0, -1)) o = (o[p] ||= {});
  o[ps.at(-1)] = v;
}
assert.deepEqual(history({ AAAAA: finished, BBBBB: other }, base, now).changes, {});
// What was saved before the flags gets them without being rewritten whole
const noCo = JSON.parse(JSON.stringify(base));
delete noCo.jugadores[pancho].co; delete noCo.records.reinas_copa.siempre[pancho].co; delete noCo.torneoPodios.AAAAA.p.p00001.co;
assert.deepEqual(history({ AAAAA: finished, BBBBB: other }, noCo, now).changes, {
  [`jugadores/${pancho}/co`]: 'CL', [`records/reinas_copa/siempre/${pancho}/co`]: 'CL', 'torneoPodios/AAAAA/p/p00001/co': 'CL',
});
// The games-played table starts with what each player had already played
const withGames = { ...base, jugadores: { ...base.jugadores, zzzzzzzz: { n: 'Zoe', co: 'PE', juegos: { reinas: { n: 3 }, dudo: { n: 2 } } } } };
assert.deepEqual(history({}, withGames, now).changes['records/partidas/siempre/zzzzzzzz'], { s: 5, ms: 0, k: claveOrden(5, 0), at: now, n: 'Zoe', co: 'PE' });

// In the app: whoever signs in with that name sees their scores and keeps them with their PIN
const ls = new Map();
const storage = { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) };
ls.set('juegos-de-salon:prueba:records-db', JSON.stringify(base));
let skew = 0; // the phone waits between PIN attempts (D-464): here the clock moves instead
const mk = uid => crearJugador({ esperar: async ms => { skew += ms; }, almacen: crearAlmacenLocal({ storage, uid, now: () => now + skew }), storage: { getItem: k => storage.getItem(`${uid}:${k}`), setItem: (k, v) => storage.setItem(`${uid}:${k}`, v), removeItem: k => storage.removeItem(`${uid}:${k}`) }, now: () => now + skew });
const phone = mk('u1');
const r = await phone.entrar('Pancho', '1234');
assert.deepEqual(r, { estado: 'nuevo', otros: 0, heredado: pancho, nombreHeredado: 'pancho' });
await phone.reclamar(pancho, '1234');
assert.equal(phone.yo().jid, pancho);
assert.equal((await phone.tabla('reinas_copa', 'siempre')).yo.s, 95);
// Already taken: another phone signs in with the same name and PIN, and with another PIN it is no longer offered
assert.deepEqual(await mk('u2').entrar('pancho', '1234'), { estado: 'dentro', jid: pancho });
assert.deepEqual(await mk('u3').entrar('Pancho', '9999'), { estado: 'nuevo', otros: 1 });

// D-450: the podium of a finished cup nobody reopened, as the app saves it; not for a saved one, a lab one or one still running
const linkedCup = cup(meta(), { p00001: { ...P('Pancho', 1, 'CL'), j: 'jiri0001' }, p00002: P('Cata', 1, 'AR'), p00003: P('Javi') }, finished.results);
const mp = missingPodiums({ AAAAA: linkedCup, BBBBB: other, CCCCC: lab }, { BBBBB: { end: 1 } }, now);
assert.deepEqual(Object.keys(mp), ['torneoPodios/AAAAA']);
assert.equal(mp['torneoPodios/AAAAA'].p.p00001.j, 'jiri0001');
assert.equal(mp['torneoPodios/AAAAA'].p.p00002.j, undefined, 'an unlinked player adds up by name, as in the app');
assert.equal(mp['torneoPodios/AAAAA'].p.p00001.l, 1);
assert.deepEqual(missingPodiums({ AAAAA: linkedCup }, {}, Date.UTC(2026, 8, 2)), {});

console.log('rankings-history: ok');
