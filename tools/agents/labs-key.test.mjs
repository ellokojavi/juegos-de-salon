// The lab keys (D-284): reading, adding and removing fingerprints from labs-puerta.js without
// breaking it, and that the repo's door has its block in the shape the tool knows how to edit.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readKeys, add, remove, fingerprint, newKey } from './labs-key.mjs';

const H1 = 'a'.repeat(64);
const SOURCE = `(function () {
  // comment
  var HUELLAS = {
    'dueño': '${H1}',
  };
  var OTHER = 1;
})();
`;

assert.deepEqual(readKeys(SOURCE), [{ label: 'dueño', fingerprint: H1 }]);

const withKey = add(SOURCE, 'MI', 'key-of-mi');
assert.deepEqual(readKeys(withKey), [{ label: 'dueño', fingerprint: H1 }, { label: 'MI', fingerprint: fingerprint('key-of-mi') }]);
assert.ok(!withKey.includes('key-of-mi'), 'the key is not written, only its fingerprint');
assert.ok(withKey.includes('  var OTHER = 1;'), 'the rest stays the same');
assert.equal(remove(withKey, 'mi'), SOURCE, 'removing leaves the source as it was (case-insensitive)');

assert.throws(() => add(withKey, 'Mi', 'other'), /already has a key/);
assert.throws(() => add(SOURCE, "O'Brien", 'x'), /invalid label/);
assert.throws(() => add(SOURCE, '', 'x'), /invalid label/);
assert.throws(() => remove(SOURCE, 'nobody'), /has no key/);
assert.throws(() => remove(SOURCE, 'dueño'), /last key/);

const k = newKey();
assert.match(k, /^[a-z2-9]{20}$/);
assert.notEqual(k, newKey());
assert.match(newKey('ratoncito'), /^ratoncito-[a-z2-9]{20}$/, 'the key starts with the label');
assert.match(newKey('Dueño Mayor'), /^dueno_mayor-[a-z2-9]{20}$/, 'no accents, capitals or spaces in the link');

// The real door: its block reads, with distinct fingerprints and unique labels
const real = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/assets/js/labs-puerta.js'), 'utf8');
const keys = readKeys(real);
assert.ok(keys.length >= 1, 'the door has at least one key');
assert.equal(new Set(keys.map(l => l.fingerprint)).size, keys.length, 'each key is different');
assert.equal(new Set(keys.map(l => l.label.toLowerCase())).size, keys.length, 'each label is unique');

console.log(`✓ lab keys · ${keys.length} in the door`);
