// Nightly archive (D-476): what moves out of the live tree, and that nothing is deleted before its copy matches.
import assert from 'node:assert/strict';
import { cupsToArchive, statsToArchive, tablesToArchive, startsToArchive, withoutNames, move, canonical, CUP_DAYS, DAILY_DAYS, STATS_DAYS } from './archive.mjs';
import { dayOf } from '../../public/assets/js/transport/cleanup.js';

const now = Date.UTC(2028, 9, 27), today = dayOf(now), DAY = 86400000;
assert.ok(CUP_DAYS >= 732 && STATS_DAYS >= 732, 'the panel reads a year and the year before it (D-348)');

// Cups: old enough and nothing left to save in torneoPodios
const old = now - (CUP_DAYS + 1) * DAY;
const cup = (end, extra = {}) => ({ meta: { end, days: 1, createdAt: end - DAY, ...extra }, players: {} });
const cups = { AAAA: cup(old), BBBB: cup(now - 10 * DAY), CCCC: cup(old, { lab: true }), DDDD: { meta: {} } };
assert.deepEqual(cupsToArchive(cups, {}, now), ['AAAA', 'CCCC']);

// Stats days, daily tables, day starts
assert.deepEqual(statsToArchive({ prod: { [today - STATS_DAYS - 1]: true, [today - STATS_DAYS]: true, x: true } }, now), [`stats/prod/days/${today - STATS_DAYS - 1}`]);
const oldD = today - DAILY_DAYS - 1;
assert.deepEqual(tablesToArchive({ t: { [`d${oldD}`]: true, [`d${today}`]: true, siempre: true, 's2028-10': true } }, now), [`records/t/d${oldD}`]);
assert.deepEqual(startsToArchive({ abcdefgh: { [oldD]: 1, [today]: 2 } }, now), [`unoAlDiaInicio/abcdefgh/${oldD}`]);
assert.deepEqual(withoutNames({ rooms: {}, live: {}, juegos: { a: 1 } }), { juegos: { a: 1 } });

// Copy, read back, compare, then delete; a copy that does not match deletes nothing
const fake = (mangle = x => x) => {
  const db = { 'records/t/d1': { a: { s: 1, k: 2 } } }, log = [];
  return { db, log, read: async p => mangle(db[p] ?? null), write: async (p, m, b) => { log.push(`${m} ${p}`); if (m === 'DELETE') delete db[p]; else db[p] = b; } };
};
const ok = fake();
assert.equal(await move('records/t/d1', ok.db['records/t/d1'], ok), 'moved');
assert.deepEqual(ok.log, ['PUT archive/records/t/d1', 'DELETE records/t/d1']);
assert.equal(ok.db['records/t/d1'], undefined);
const bad = fake(x => (x ? { ...x, extra: 1 } : x));
await assert.rejects(() => move('records/t/d1', bad.db['records/t/d1'], bad));
assert.ok(bad.db['records/t/d1'], 'the live node stays');
assert.equal(await move('x', null, ok), 'gone');
assert.equal(canonical({ b: 1, a: { d: 1, c: 2 } }), canonical({ a: { c: 2, d: 1 }, b: 1 }));
console.log('archive: ok');
