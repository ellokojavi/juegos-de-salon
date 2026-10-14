// Ejecutar: node tools/e2e/already-tested.test.mjs
// Cuándo publish.yml no repite la punta a punta (D-308): mismo árbol ya probado, o un cambio que no
// llega al navegador sobre un padre probado. Una marca de un fork no vale.
import assert from 'node:assert/strict';
import { decidir, marcaValida, MARCA } from './already-tested.mjs';

const run = (id, propio = true) => ({ expired: false, workflow_run: { id, repository_id: 1, head_repository_id: propio ? 1 : 2 } });

assert.equal(MARCA('abc'), 'e2e-arbol-abc');
assert.equal(marcaValida([]), null);
assert.equal(marcaValida([run(5, false)]), null, 'la marca de un fork no vale: corre su propia versión del workflow');
assert.equal(marcaValida([{ ...run(5), expired: true }]), null, 'una marca vencida no vale');
assert.equal(marcaValida([run(5, false), run(7)]).workflow_run.id, 7);

assert.equal(decidir({ marca: run(7), marcaPadre: null, cambios: null }).probado, true);
const docs = decidir({ marca: null, marcaPadre: run(3), cambios: ['docs/DECISIONES.md', 'changelog/x.md'] });
assert.deepEqual([docs.probado, docs.heredado], [true, true]);
assert.equal(decidir({ marca: null, marcaPadre: run(3), cambios: ['public/index.html'] }).probado, false, 'un cambio del sitio sin su árbol probado corre entera');
assert.equal(decidir({ marca: null, marcaPadre: null, cambios: ['docs/x.md'] }).probado, false, 'sin padre probado, no hay de quién heredar');
assert.equal(decidir({ marca: null, marcaPadre: null, cambios: null }).probado, false);
console.log('ya-probado: en verde');
