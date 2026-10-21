// The game-ideas agent (D-360): the lab's projects, today's order against the fixed one, the weakest finishes, the ledger and the owner's issue.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { laboratorio, popularidadHoy, deriva, debiles, embudoGrupo, validateIdea, ideasDecisions, addIdeas, setStatus, questionOf, MEMORY, ROOT, STATUSES, LANES } from './ideas.mjs';
import { nuevoOrden } from './popularity.mjs';
import { POPULARIDAD } from '../../public/assets/js/games.js';

// The lab page: active projects before La Bodega, shelved ones inside it
const html = `
<section class="grupo" id="activos"><h2>🧪 Proyectos activos</h2>
  <section class="panel seccion" id="seccion-agentes"><h2>🕵️ Agentes</h2></section>
  <section class="panel seccion" id="seccion-puentes"><h2>🚂 Tren en Vilo</h2></section>
</section>
<section class="grupo" id="mejoras"><h2>✨ Mejoras en prueba</h2>
  <section class="panel seccion" id="seccion-splash"><h2>🎉 Splash</h2></section>
</section>
<section class="grupo" id="bodega"><h2>📦 La Bodega</h2>
  <section class="panel seccion plegada" id="seccion-caso"><details><summary><h2>🔍 El caso</h2></summary></details></section>
</section>`;
assert.deepEqual(laboratorio(html), { active: [{ id: 'agentes', title: '🕵️ Agentes' }, { id: 'puentes', title: '🚂 Tren en Vilo' }], improvements: [{ id: 'splash', title: '🎉 Splash' }], shelved: [{ id: 'caso', title: '🔍 El caso' }] });
const real = laboratorio(readFileSync(join(ROOT, 'public/labs/index.html'), 'utf8'));
assert.ok(real.active.length >= 1 && real.shelved.some(p => p.id === 'portada'), 'the real lab page has games and a Bodega, where the home page experiments went once all launched (D-403)');
assert.ok(!real.active.some(p => p.id === 'portada'), 'the home page experiments are an improvement, not a game');

// Today's order counts offline games, rooms and cup days under the game's id, La Copa as its days
const hoy = popularidadHoy({
  grupo: { byGame: { dudo: 3, 'linea-de-tiempo': 2 } },
  individual: { byGame: { reinas: 10, 'linea-de-tiempo': 4 } },
  copa: { porJuego: [{ id: 'linea', jugadas: 5 }, { id: 'pintaminas:hard', jugadas: 2 }, { id: 'final', jugadas: 1 }] },
});
assert.deepEqual(hoy, [
  { id: 'linea-de-tiempo', plays: 11 }, { id: 'reinas', plays: 10 }, { id: 'copa', plays: 8 }, { id: 'dudo', plays: 3 }, { id: 'pintaminas', plays: 2 },
]);
assert.deepEqual(popularidadHoy({}), [], 'nothing played, nothing listed');

// Right after `popularity.mjs update` the order is nuevoOrden(conteo, ofrecidos, POPULARIDAD) = POPULARIDAD: no drift
const ofrecidosT = ['a', 'b', 'c', 'd', 'e'];
const conteoT = { e: 9, d: 7, a: 1 };
const ordenT = nuevoOrden(conteoT, ofrecidosT, ['a', 'b', 'c', 'd', 'e']);
assert.equal(deriva(ordenT.map(id => ({ id, finished: conteoT[id] || 0 })), ['a', 'b', 'c', 'd', 'e']).length, 1, 'finishes that reorder the list drift it');
assert.deepEqual(deriva(nuevoOrden(conteoT, ofrecidosT, ordenT).map(id => ({ id, finished: conteoT[id] || 0 })), ordenT), [], 'refreshed by popularity.mjs, nothing drifts');

// Drift: three places or more, or a game missing from the fixed list
const fixed = ['copa', 'a', 'b', 'c', 'd', 'e'];
assert.deepEqual(deriva([{ id: 'copa', finished: 9 }, { id: 'b', finished: 5 }, { id: 'a', finished: 4 }], fixed), [], 'one place is no drift');
assert.deepEqual(deriva([{ id: 'e', finished: 9 }, { id: 'copa', finished: 8 }, { id: 'x', finished: 1 }], fixed), [
  { id: 'e', finished: 9, was: 6, now: 1 }, { id: 'x', finished: 1, was: null, now: 3 },
]);
assert.ok(POPULARIDAD.includes('copa'), 'the fixed order the check compares against still exists');

// The weakest finish needs a minimum of starts and sorts by finish rate
const rows = [
  { k: 'zip', empezadas: 20, terminadas: 5, abandonos: 12, puntaje: [10, 40, 70], tiempo: [30, 90, 200] },
  { k: 'reinas', empezadas: 40, terminadas: 36, abandonos: 2, puntaje: [50, 80, 100], tiempo: [20, 60, 120] },
  { k: 'tango', empezadas: 3, terminadas: 0, abandonos: 3, puntaje: [], tiempo: [] },
];
assert.deepEqual(debiles(rows).map(g => [g.k, g.rate, g.mediana, g.segundos]), [['zip', 25, 40, 90], ['reinas', 90, 80, 60]]);
assert.deepEqual(embudoGrupo({ dudo: { creadas: 12, conRival: 6, terminadas: 3 }, julepe: { creadas: 2, conRival: 2, terminadas: 2 } }), [
  { id: 'dudo', creadas: 12, conRival: 6, terminadas: 3, rival: 50, fin: 50 },
]);

// An idea's card: every field, a slug id, a known lane, and an inspiration for a new game
const idea = { id: 'cup-seasons', title: 'Seasons in La Copa', lane: 'meta', evidence: 'D7 return 12%', cost: '2 PRs', prototype: 'a lab flag', proof: 'D7 return up 5 points', recommendation: 'Yes: cheap and measurable.' };
assert.deepEqual(validateIdea({ ...idea, extra: 'ignored' }), idea);
assert.throws(() => validateIdea({ ...idea, proof: '' }), /without "proof"/);
assert.throws(() => validateIdea({ ...idea, id: 'Cup Seasons' }), /not a slug/);
assert.throws(() => validateIdea({ ...idea, lane: 'other' }), /lane/);
assert.throws(() => validateIdea({ ...idea, lane: 'new-game' }), /inspiration/);
assert.equal(questionOf(idea), 'Try «Seasons in La Copa» in the lab?');
assert.equal(questionOf({ ...idea, question: 'Refresh the home page order?' }), 'Refresh the home page order?');

// The owner's issue: one decision per idea, the Yes queued, at most three
const d = ideasDecisions([idea, { ...idea, id: 'two', lane: 'new-game', inspiration: 'Shikaku, Nikoli, https://…' }], { summary: 'Two ideas', date: '2026-10-18' });
assert.equal(d.title, 'Ideas: 2026-10-18');
assert.equal(d.decisions.length, 2);
assert.deepEqual(d.decisions[0].yes, [{ type: 'queue', task: 'ideas cup-seasons: a lab flag' }]);
assert.match(d.decisions[1].context, /^Yes: cheap and measurable\.\nEvidence: D7 return 12%\nInspired by Shikaku/);
assert.equal(d.decisions[0].no, undefined, 'a No is only recorded');
assert.throws(() => ideasDecisions([idea, idea]), /twice/);
assert.throws(() => ideasDecisions([idea, { ...idea, id: 'b' }, { ...idea, id: 'c' }, { ...idea, id: 'd' }]), /at most three/);
assert.throws(() => ideasDecisions([]), /at least one/);

// The ledger: proposed → approved or discarded → …; a repeat is refused, a return is explicit
const m = { taste: [], ideas: [], rounds: [] };
addIdeas(m, [idea], { date: '2026-10-18', issue: 'https://github.com/x/1' });
assert.equal(m.ideas[0].status, 'proposed');
assert.equal(m.ideas[0].issue, 'https://github.com/x/1');
assert.throws(() => addIdeas(m, [idea]), /already in the ledger as proposed/);
assert.throws(() => setStatus(m, 'cup-seasons', 'graduated', 'no'), /can go to approved or discarded/);
assert.throws(() => setStatus(m, 'cup-seasons', 'approved', ''), /say why/);
assert.throws(() => setStatus(m, 'nope', 'approved', 'x'), /no idea "nope"/);
setStatus(m, 'cup-seasons', 'discarded', 'the owner: La Copa already has weeks', { date: '2026-10-19', link: 'https://github.com/x/1' });
assert.equal(m.ideas[0].status, 'discarded');
assert.throws(() => addIdeas(m, [idea]), /discarded \(the owner: La Copa already has weeks\)/);
setStatus(m, 'cup-seasons', 'proposed', 'the numbers changed: D7 fell to 5%');
assert.equal(m.ideas[0].history.length, 3);
for (const s of Object.keys({ proposed: 1, approved: 1, prototyped: 1, graduated: 1, shelved: 1, discarded: 1 })) assert.ok(STATUSES.includes(s));
assert.deepEqual(LANES, ['meta', 'existing', 'new-game']);

// The repo's memory has the shape the tool reads, and its seed taste names where it came from
const memory = JSON.parse(readFileSync(MEMORY, 'utf8'));
for (const k of ['taste', 'ideas', 'rounds']) assert.ok(Array.isArray(memory[k]), `docs/ideas.json without "${k}"`);
for (const i of memory.ideas) { assert.ok(STATUSES.includes(i.status), `unknown status in the ledger: ${i.status}`); assert.ok(LANES.includes(i.lane)); }
for (const t of memory.taste) assert.ok(t.what && t.date, 'each taste line has a date and a text');

console.log('✓ ideas.test.mjs');
