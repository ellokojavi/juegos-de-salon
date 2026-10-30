import assert from 'node:assert/strict';
import { stageOf, feedbackRows, countStages } from './feedback.js';

assert.equal(stageOf(null), 'new');
assert.equal(stageOf({ issue: 5, state: 'open', prs: [] }), 'open');
assert.equal(stageOf({ issue: 5, state: 'open', prs: [{ n: 9, state: 'merged' }, { n: 10, state: 'open' }] }), 'in-pr');
assert.equal(stageOf({ issue: 5, state: 'open', prs: [{ n: 9, state: 'merged' }] }), 'merged');
assert.equal(stageOf({ issue: 5, state: 'closed', prs: [{ n: 10, state: 'open' }] }), 'closed');

const fb = {
  a: { at: 1, nombre: 'Ana', texto: 'Hola', tipo: 'idea', contexto: { juego: 'ahorcado' } },
  b: { at: 3, texto: 'Falla', correoMascara: 'a***@g***m' },
  c: { at: 2, texto: '   ' },
};
const est = { a: { issue: 7, state: 'closed', replied: true, prs: [] } };
const all = feedbackRows(fb, est);
assert.deepEqual(all.map(r => r.id), ['b', 'a'], 'newest first, empty messages out');
assert.equal(all[1].replied, true);
assert.equal(all[1].game, 'ahorcado');
assert.deepEqual(feedbackRows(fb, est, 'open').map(r => r.id), ['b']);
assert.deepEqual(feedbackRows(fb, est, 'closed').map(r => r.id), ['a']);
assert.deepEqual(countStages(all), { new: 1, open: 0, 'in-pr': 0, merged: 0, closed: 1 });
console.log('feedback panel: ok');
