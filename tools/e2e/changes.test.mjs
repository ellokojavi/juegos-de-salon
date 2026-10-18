// Run: node tools/e2e/changes.test.mjs
// Which PR skips the end-to-end tests (D-205): only those that touch nothing in the browser.
import assert from 'node:assert/strict';
import { noBrowser as docsOnly } from './changes.mjs';

// Skipped: the documentation round, the usability one without fixes, the video
assert.equal(docsOnly(['CHANGELOG.md', 'docs/DECISIONES.md', 'docs/documentation.json']), true);
assert.equal(docsOnly(['docs/screenshots/cup/01.png', 'README.md', 'CLAUDE.md']), true);
assert.equal(docsOnly(['marketing/registro.json', '.claude/agents/usability.md']), true);
// D-299: also the workshop that neither the site nor the scripts import, the rules and the other workflows
assert.equal(docsOnly(['CHANGELOG.md', 'tools/agents/processes.mjs', 'tools/agents/processes.test.mjs']), true);
assert.equal(docsOnly(['tools/firebase/rules.mjs', 'firebase/database.rules.json']), true);
assert.equal(docsOnly(['.github/workflows/feedback.yml', '.github/workflows/publish.yml']), true);
assert.equal(docsOnly(['tools/agents/processes.mjs', 'public/assets/js/compartir.js']), false);
assert.equal(docsOnly(['tools/push/vapid.mjs']), false, 'daily-notifications.mjs imports it');
assert.equal(docsOnly(['tools/generators/map.mjs']), false, 'it generates site data');
// Run: anything of the site, of the tests or of the workflows
assert.equal(docsOnly(['docs/DECISIONES.md', 'public/cup/rules.js']), false);
assert.equal(docsOnly(['public/hangman/README.md']), false, 'a .md inside the site gets published');
assert.equal(docsOnly(['tools/e2e/paths.mjs']), false);
assert.equal(docsOnly(['tools/e2e/README.md']), false, "the tests' README goes with them");
assert.equal(docsOnly(['.github/workflows/e2e.yml']), false);
assert.equal(docsOnly(['tools/release/og.mjs']), false, 'when in doubt, they run');
// No list (a push to main, or the API didn't answer): they run
assert.equal(docsOnly([]), false);
assert.equal(docsOnly(['', '  ']), false);
console.log('changes: which PR skips the end-to-end tests, green');
