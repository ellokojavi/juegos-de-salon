import assert from 'node:assert/strict';
import { labelProblem, newKey, linkOf, fingerprint, usageByKey, keyRows, ACTIVE_DAYS } from './lab-keys.js';

assert.equal(labelProblem('Pepa'), '');
assert.match(labelProblem('pepa', ['Pepa']), /already has a key/);
assert.match(labelProblem(''), /letters/);
assert.match(labelProblem('x'.repeat(25)), /up to 24/);

const k = newKey('Ñandú Ríos', n => Array.from({ length: n }, (_, i) => i));
assert.equal(k, 'nandu_rios-abcdefghijkmnpqrstuv');
assert.equal(linkOf('a-b'), 'https://juegosdesalon.cl/labs/?key=a-b');
assert.equal(await fingerprint('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

const uso = { stick: { 20400: { n: 3, k: { aaaaaaaa: true } }, 20410: { n: 1, k: { aaaaaaaa: true, bbbbbbbb: true } } }, stack: { 20300: { k: { bbbbbbbb: true } } } };
assert.deepEqual(usageByKey(uso), { aaaaaaaa: { day: 20410, flags: 1 }, bbbbbbbb: { day: 20410, flags: 2 } });

const llaves = { ['aaaaaaaa' + '0'.repeat(56)]: 'Ana', ['cccccccc' + '0'.repeat(56)]: 'Cris', ['bbbbbbbb' + '0'.repeat(56)]: 'Beto' };
const day = 24 * 3600 * 1000;
const rows = keyRows(llaves, uso, (20410 + ACTIVE_DAYS) * day);
assert.deepEqual(rows.map(r => [r.label, r.status]), [['Ana', 'active'], ['Beto', 'active'], ['Cris', 'never']]);
assert.equal(keyRows(llaves, uso, (20411 + ACTIVE_DAYS) * day)[0].status, 'quiet');
console.log('✓ lab-keys');
