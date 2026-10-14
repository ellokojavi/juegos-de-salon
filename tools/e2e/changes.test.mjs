// Ejecutar: node tools/e2e/changes.test.mjs
// Qué PR se salta las pruebas de punta a punta (D-205): solo los que no tocan nada del navegador.
import assert from 'node:assert/strict';
import { sinNavegador as soloDocumentos } from './changes.mjs';

// Se saltan: la ronda de documentación, la de usabilidad sin arreglos, el video
assert.equal(soloDocumentos(['CHANGELOG.md', 'docs/DECISIONES.md', 'docs/documentation.json']), true);
assert.equal(soloDocumentos(['docs/screenshots/cup/01.png', 'README.md', 'CLAUDE.md']), true);
assert.equal(soloDocumentos(['marketing/registro.json', '.claude/agents/usability.md']), true);
// D-299: también el taller que ni el sitio ni los guiones importan, las reglas y los otros workflows
assert.equal(soloDocumentos(['CHANGELOG.md', 'tools/agents/processes.mjs', 'tools/agents/processes.test.mjs']), true);
assert.equal(soloDocumentos(['tools/firebase/rules.mjs', 'firebase/database.rules.json']), true);
assert.equal(soloDocumentos(['.github/workflows/feedback.yml', '.github/workflows/publish.yml']), true);
assert.equal(soloDocumentos(['tools/agents/processes.mjs', 'public/assets/js/compartir.js']), false);
assert.equal(soloDocumentos(['tools/push/vapid.mjs']), false, 'daily-notifications.mjs lo importa');
assert.equal(soloDocumentos(['tools/generators/map.mjs']), false, 'genera datos del sitio');
// Se corren: cualquier cosa del sitio, de las pruebas o de los workflows
assert.equal(soloDocumentos(['docs/DECISIONES.md', 'public/cup/rules.js']), false);
assert.equal(soloDocumentos(['public/hangman/README.md']), false, 'un .md dentro del sitio se publica');
assert.equal(soloDocumentos(['tools/e2e/paths.mjs']), false);
assert.equal(soloDocumentos(['tools/e2e/README.md']), false, 'el README de las pruebas va junto a ellas');
assert.equal(soloDocumentos(['.github/workflows/e2e.yml']), false);
assert.equal(soloDocumentos(['tools/release/og/card.html']), false, 'ante la duda, se corren');
// Sin lista (un push a main, o la API no respondió): se corren
assert.equal(soloDocumentos([]), false);
assert.equal(soloDocumentos(['', '  ']), false);
console.log('cambios: qué PR se salta las pruebas de punta a punta, en verde');
