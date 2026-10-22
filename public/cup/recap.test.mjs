// The recap of an ended cup on the home page (D-423): which cup is due, and what its window draws.
import assert from 'node:assert/strict';
import { cupRecap, demoRecap, loadCupRecap } from './recap.js';
import { escena } from './demo.js';
import { createCuenta } from './cuenta.js';
import { sparkPoints, cupLead, TEXTS, dueCup, seenCups, markCupSeen, minePlayed, RECAP_MS, OPEN_CUPS } from '../assets/js/recap.js';
import { esCodigo } from './code.js';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-10-22T18:00:00Z');

// Which cup: ended, less than a week ago, not seen, the most recent
assert.equal(dueCup({ mine: [], now }), null, 'no cups, nothing');
assert.equal(dueCup({ mine: [{ code: 'AAAAA', fin: now + DAY }], now }), null, 'still running');
assert.equal(dueCup({ mine: [{ code: 'AAAAA', fin: now - RECAP_MS - 1 }], now }), null, 'ended more than a week ago');
assert.equal(dueCup({ mine: [{ code: 'AAAAA', fin: now - DAY }], seen: ['AAAAA'], now }), null, 'already seen');
assert.equal(dueCup({ mine: [{ code: 'AAAAA', fin: now - 3 * DAY }, { code: 'BBBBB', fin: now - DAY }, { code: 'CCCCC', fin: now + DAY }], now }).code, 'BBBBB', 'the most recent that ended');
assert.equal(dueCup({ mine: [{ code: 'AAAAA' }], now }), null, 'a cup remembered without its end');

// What it draws: the podium demo, from whoever looks
const { L, e, meta } = escena('podium', { now });
const end = Math.max(now, meta.end);
const r = cupRecap(L, e.yo, end);
assert.equal(r.rows.length, 5);
assert.deepEqual(r.rows.map(x => x.lugar), [...r.rows.map(x => x.lugar)].sort((a, b) => a - b), 'in table order');
assert.equal(r.rows.filter(x => x.mine).length, 1, 'one row is mine');
for (const x of r.rows) {
  assert.equal(x.lugares.length, 7, 'a place after each day');
  assert.equal(x.lugares.at(-1), x.lugar, 'the last place is the final one');
  assert.equal(x.delta, x.lugares[0] - x.lugar);
}
assert.equal(cupRecap(L, e.yo, meta.end - 1), null, 'not ended: nothing');
assert.equal(cupRecap(L, 'nadie9', end), null, 'not in the cup: nothing');
const empty = escena('waiting', { now });
assert.equal(cupRecap(empty.L, empty.e.yo, Math.max(now, empty.meta.end)), null, 'nobody scored: nothing');
assert.ok((await demoRecap()).path.includes('demo=podium'), 'the demo opens the podium demo');

// The lead says who won and where this player finished
const row = (name, lugar, mine = false) => ({ name, lugar, mine });
const lead = (rows, lang = 'es') => cupLead({ rows, me: rows.find(x => x.mine), winners: rows.filter(x => x.lugar === 1) }, lang);
assert.equal(lead([row('Ana', 1, true), row('Beto', 2)]), '🥇 ¡Ganaste la copa!');
assert.equal(lead([row('Ana', 1, true), row('Beto', 1)]), '🥇 ¡Ganaste la copa junto con Beto!');
assert.equal(lead([row('Ana', 1), row('Beto', 2, true)], 'en'), '🥇 Ana won. You finished #2.');
assert.equal(lead([row('Ana', 1), row('Beto', 1), row('Caro', 3, true)], 'pt'), '🥇 Ana e Beto ganharam. Você ficou em 3º.');

// The four languages, with the same words (C-3)
for (const l of ['en', 'pt', 'de']) assert.deepEqual(Object.keys(TEXTS[l]).sort(), Object.keys(TEXTS.es).sort(), `recap texts in ${l}`);

// The line: 1st at the top, last at the bottom, inside its box
const pts = sparkPoints([3, 1, 5], 5, { w: 56, h: 20, pad: 3 });
assert.deepEqual(pts, [[3, 10], [28, 3], [53, 17]]);
assert.deepEqual(sparkPoints([1], 1, { w: 56, h: 20 }), [[28, 10]], 'one day, one player: the middle');

// The whole way: what the phone remembers, the cup over REST, and seen only when there is nothing to tell
const mem = {};
globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
// What La Copa remembers (cuenta.js) is what the home page reads (MINE_KEY)
createCuenta().recordar('PQRST', e.yo, { nombre: 'Javi', copa: meta.name, fin: meta.end });
assert.deepEqual(minePlayed().map(c => c.code), ['PQRST'], "the home page reads La Copa's memory");
let asked = 0;
const fetchOk = async url => { asked++; assert.ok(url.endsWith('/torneos/PQRST.json'), url); return { ok: true, json: async () => L }; };
const got = await loadCupRecap({ now: end, fetchFn: fetchOk });
assert.equal(got.code, 'PQRST');
assert.equal(got.recap.me.name, 'Javi');
assert.deepEqual(seenCups(), [], 'not seen until the window closes');
assert.equal(await loadCupRecap({ now: end, fetchFn: async () => { throw new Error('offline'); } }), null, 'offline: nothing now');
assert.deepEqual(seenCups(), [], 'and it is tried again next visit');
assert.equal(await loadCupRecap({ now: end, fetchFn: async () => ({ ok: true, json: async () => empty.L }) }), null, 'a cup with nothing to tell');
assert.deepEqual(seenCups(), ['PQRST'], 'is marked seen, so it is not fetched again');
asked = 0;
assert.equal(await loadCupRecap({ now: end, fetchFn: fetchOk }), null);
assert.equal(asked, 0, 'a seen cup is not fetched');
markCupSeen('AAAAA');
assert.deepEqual(seenCups(), ['AAAAA', 'PQRST']);

// The cups opened to all their players (D-426) are cup codes
// and one of them goes first, even if another cup ended after it (D-426)
assert.equal(dueCup({ mine: [{ code: 'BBBBB', fin: now - DAY }, { code: OPEN_CUPS[0], fin: now - 3 * DAY }], now }).code, OPEN_CUPS[0]);
assert.equal(dueCup({ mine: [{ code: 'BBBBB', fin: now - DAY }, { code: OPEN_CUPS[0], fin: now - 3 * DAY }], seen: [OPEN_CUPS[0]], now }).code, 'BBBBB', 'once seen, the next one');
assert.ok(OPEN_CUPS.every(esCodigo), `OPEN_CUPS holds cup codes: ${OPEN_CUPS}`);

console.log('✓ recap: which cup is due, its table and its line');
