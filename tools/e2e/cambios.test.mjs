// Ejecutar: node tools/e2e/cambios.test.mjs
// Qué PR se salta las pruebas de punta a punta (D-205): solo los que no tocan nada del navegador.
import assert from 'node:assert/strict';
import { soloDocumentos } from './cambios.mjs';

// Se saltan: la ronda de documentación, la de usabilidad sin arreglos, el video
assert.equal(soloDocumentos(['CHANGELOG.md', 'docs/DECISIONES.md', 'docs/documentacion.json']), true);
assert.equal(soloDocumentos(['docs/screenshots/cup/01.png', 'README.md', 'CLAUDE.md']), true);
assert.equal(soloDocumentos(['marketing/registro.json', '.claude/agents/usabilidad.md']), true);
// Se corren: cualquier cosa del sitio, de las pruebas o de los workflows
assert.equal(soloDocumentos(['docs/DECISIONES.md', 'public/cup/rules.js']), false);
assert.equal(soloDocumentos(['public/hangman/README.md']), false, 'un .md dentro del sitio se publica');
assert.equal(soloDocumentos(['tools/e2e/caminos.mjs']), false);
assert.equal(soloDocumentos(['tools/e2e/README.md']), false, 'el README de las pruebas va junto a ellas');
assert.equal(soloDocumentos(['.github/workflows/e2e.yml']), false);
assert.equal(soloDocumentos(['tools/release/og/tarjeta.html']), false, 'ante la duda, se corren');
// Sin lista (un push a main, o la API no respondió): se corren
assert.equal(soloDocumentos([]), false);
assert.equal(soloDocumentos(['', '  ']), false);
console.log('cambios: qué PR se salta las pruebas de punta a punta, en verde');
