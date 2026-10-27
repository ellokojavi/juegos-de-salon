// Uno al día's season recap on the home page (D-424): which season is due, the window's rows and its lead.
import assert from 'node:assert/strict';
import { dueSeason, seasonRecap, seasonTop, loadSeasonRecap, demoSeason, monthBefore, lastDayOf, seenSeasons, markSeasonSeen, DAILY_KEY, PLAYER_KEY, TOP } from './daily-recap.js';
import { KEY as UAD_KEY } from './uno-al-dia.js';
import { seasonLead, seasonView, sparkPoints, TEXTS } from './recap.js';

// The keys are the ones the rest of the app writes
assert.equal(DAILY_KEY, UAD_KEY, "Uno al día's history key");
assert.equal(PLAYER_KEY, 'juegos-de-salon:jugador', "jugador.js's key");
assert.equal(monthBefore('2026-11'), '2026-10');
assert.equal(monthBefore('2027-01'), '2026-12');
assert.equal(lastDayOf('2026-10'), '2026-10-31');

// Due: the first week of a month, if this phone played last month and has not seen it
const oct = ['2026-10-20', '2026-10-31'];
assert.equal(dueSeason({ today: '2026-11-01', days: oct, seen: [] }), '2026-10');
assert.equal(dueSeason({ today: '2026-11-07', days: oct, seen: [] }), '2026-10', 'all the first week');
assert.equal(dueSeason({ today: '2026-11-08', days: oct, seen: [] }), null, 'not after it');
assert.equal(dueSeason({ today: '2026-11-02', days: oct, seen: ['2026-10'] }), null, 'seen');
assert.equal(dueSeason({ today: '2026-11-02', days: ['2026-09-30', '2026-11-01'], seen: [] }), null, 'did not play that month');
assert.equal(dueSeason({ today: '2027-01-01', days: ['2026-12-05'], seen: [] }), '2026-12', 'across the year');

// The rows: in place order, the top and this player's own further down, null before the first points
const many = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`jid0000${String(i).padStart(2, '0')}`, { n: `P${i}`, s: 1000 - i * 10, l: [i === 13 ? 0 : i + 1, i + 1] }]));
const r = seasonRecap({ c: ['2026-10-25', '2026-10-31'], t: '2026-11-01', j: many }, 'jid000013');
assert.equal(r.players, 14);
assert.equal(r.rows.length, TOP + 1, 'the top ten and the player, 14th');
assert.equal(r.rows.at(-1).mine, true);
assert.deepEqual(r.rows.at(-1).lugares, [null, 14]);
assert.equal(r.rows.at(-1).delta, 0, 'from their first place');
assert.equal(seasonRecap({ c: [], t: 'x', j: {} }), null, 'nobody: nothing');
assert.equal(seasonRecap({ c: ['2026-10-31'], t: '2026-11-01', j: many }).me, null, 'not signed in: no own row');

// The line skips the weeks with no points yet
assert.deepEqual(sparkPoints([null, 2, 1], 2, { w: 56, h: 20, pad: 3 }), [null, [28, 17], [53, 3]]);

// The lead: won, tied, a place, or who won for a phone not signed in
const d = demoSeason();
assert.equal(seasonLead(d.recap, 'es'), 'Quedaste #3 de 8, con 901 pts. Ganó Chan.');
assert.equal(seasonLead(d.recap, 'en'), 'You finished #3 of 8, with 901 pts. Chan won.');
assert.equal(seasonLead({ ...d.recap, me: null }, 'es'), '🥇 Ganó Chan con 1098 pts.');
const won = seasonRecap({ c: ['2026-10-31'], t: '2026-11-01', j: { aaaaaaaa: { n: 'Ana', s: 900, l: [1] }, bbbbbbbb: { n: 'Beto', s: 900, l: [1] } } }, 'aaaaaaaa');
assert.equal(seasonLead(won, 'pt'), '🥇 Você ganhou a temporada com 900 pts, junto com Beto!');
assert.equal(seasonLead({ ...won, me: null }, 'es'), '🥇 Ganaron Ana y Beto con 900 pts.', 'a tie for first, not signed in: plural (U-6)');
const v = seasonView(d, 'de');
assert.equal(v.title, 'Spiel des Tages: Oktober');
assert.equal(v.note, 'Die Saison im November hat begonnen: Alle starten bei 0.');
assert.equal(v.scale, 8);
for (const l of ['en', 'pt', 'de']) assert.deepEqual(Object.keys(TEXTS[l]).sort(), Object.keys(TEXTS.es).sort(), `recap texts in ${l}`);

// Loading: only once its last night was computed; a season with nobody is marked seen
const mem = {};
globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, x) => { mem[k] = String(x); }, removeItem: k => { delete mem[k]; } };
const store = data => async url => {
  const m = url.match(/\/uadTemporada\/s2026-10\/(top|j\/[a-z]+)\.json$/);
  assert.ok(m, `only the top and the own row are read: ${url}`);
  const top = data && seasonTop(data);
  return { ok: true, json: async () => (m[1] === 'top' ? top : data?.j?.[m[1].slice(2)] ?? null) };
};
const full = { c: ['2026-10-31'], t: '2026-11-01', j: { aaaaaaaa: { n: 'Ana', s: 900, l: [1] }, bbbbbbbb: { n: 'Beto', s: 800, l: [2] } } };
assert.equal((await loadSeasonRecap({ month: '2026-10', jid: 'bbbbbbbb', fetchFn: store(full) })).recap.me.name, 'Beto');
assert.equal(await loadSeasonRecap({ month: '2026-10', fetchFn: store({ ...full, t: '2026-10-31' }) }), null, 'the last day not computed yet');
assert.equal(await loadSeasonRecap({ month: '2026-10', fetchFn: store(null) }), null, 'nothing written yet');
assert.equal(await loadSeasonRecap({ month: '2026-10', fetchFn: async () => { throw new Error('offline'); } }), null);
// The top and the own row give the same recap as the whole table, for every player of a big season
const big = { c: ['2026-10-18', '2026-10-31'], t: '2026-11-01', j: {} };
for (let k = 0; k < 40; k++) big.j[`p${String.fromCharCode(97 + (k % 26))}${String.fromCharCode(97 + Math.floor(k / 26))}aaaaa`] = { n: `P${k}`, s: 1000 - k * 20 + (k === 9 || k === 10 ? 0 : 0), l: [k % 7 ? k + 1 : 0, k < 3 ? 1 : k === 10 ? 10 : k + 1] };
assert.ok(Object.keys(seasonTop(big).j).length < 15, 'the top is small');
assert.equal(seasonTop(big).p, 40);
for (const jid of [null, ...Object.keys(big.j)]) {
  const a = (await loadSeasonRecap({ month: '2026-10', jid, fetchFn: store(big) })).recap, b = seasonRecap(big, jid);
  assert.deepEqual(a, b, `same recap for ${jid}`);
}
assert.deepEqual(seenSeasons(), [], 'none of those is seen');
assert.equal(await loadSeasonRecap({ month: '2026-10', fetchFn: store({ ...full, j: {} }) }), null);
assert.deepEqual(seenSeasons(), ['2026-10'], 'a season with nobody is');
markSeasonSeen('2026-11');
assert.deepEqual(seenSeasons(), ['2026-11', '2026-10']);

console.log('✓ daily-recap: which season is due, its rows, its lead and its loading');
