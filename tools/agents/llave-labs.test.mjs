// Las llaves del laboratorio (D-284): leer, agregar y quitar huellas de labs-puerta.js sin romperlo,
// y que la puerta del repo tenga su bloque en la forma que la herramienta sabe editar.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { leer, agregar, quitar, huella, llaveNueva } from './llave-labs.mjs';

const H1 = 'a'.repeat(64);
const FUENTE = `(function () {
  // comentario
  var HUELLAS = {
    'dueño': '${H1}',
  };
  var OTRA = 1;
})();
`;

assert.deepEqual(leer(FUENTE), [{ etiqueta: 'dueño', huella: H1 }]);

const con = agregar(FUENTE, 'MI', 'llave-de-mi');
assert.deepEqual(leer(con), [{ etiqueta: 'dueño', huella: H1 }, { etiqueta: 'MI', huella: huella('llave-de-mi') }]);
assert.ok(!con.includes('llave-de-mi'), 'la llave no queda escrita, solo su huella');
assert.ok(con.includes('  var OTRA = 1;'), 'lo demás queda igual');
assert.equal(quitar(con, 'mi'), FUENTE, 'quitar deja la fuente como estaba (sin importar mayúsculas)');

assert.throws(() => agregar(con, 'Mi', 'otra'), /ya tiene llave/);
assert.throws(() => agregar(FUENTE, "O'Brien", 'x'), /etiqueta no válida/);
assert.throws(() => agregar(FUENTE, '', 'x'), /etiqueta no válida/);
assert.throws(() => quitar(FUENTE, 'nadie'), /no tiene llave/);
assert.throws(() => quitar(FUENTE, 'dueño'), /última llave/);

const k = llaveNueva();
assert.match(k, /^[a-z2-9]{20}$/);
assert.notEqual(k, llaveNueva());

// La puerta de verdad: su bloque se lee, con huellas distintas y etiquetas únicas
const real = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/assets/js/labs-puerta.js'), 'utf8');
const llaves = leer(real);
assert.ok(llaves.length >= 1, 'la puerta tiene al menos una llave');
assert.equal(new Set(llaves.map(l => l.huella)).size, llaves.length, 'cada llave es distinta');
assert.equal(new Set(llaves.map(l => l.etiqueta.toLowerCase())).size, llaves.length, 'cada etiqueta es única');

console.log(`✓ llaves del laboratorio · ${llaves.length} en la puerta`);
