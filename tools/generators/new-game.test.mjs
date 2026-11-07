// node tools/generators/new-game.test.mjs — a generated game passes every rule as born (#1249 step 9).
// It generates one into a temp folder that mirrors the repo's paths, untouched, and runs on it the
// conformance node checks, its engine test, the design lint and the usability lint.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { generate, newGameFiles } from './new-game.mjs';
import { staticConformance } from './conformance.mjs';
import { renderModule } from './manifests.mjs';
import { lintCss, tokens, sharedClasses } from '../agents/design-lint.mjs';
import { lint as usabilityLint, walk, LANGS } from '../agents/usability-lint.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const root = mkdtempSync(join(tmpdir(), 'new-game-'));
try {
  // What the generated files import from the site: the shared modules and the lab's index
  mkdirSync(join(root, 'public/labs'), { recursive: true });
  copyFileSync(join(REPO, 'public/labs/index.html'), join(root, 'public/labs/index.html'));

  const id = 'sample-race';
  const written = await generate(id, { nameEs: 'Carrera', nameEn: 'Race', namePt: 'Corrida', emoji: '🏁' }, root);
  const dir = join(root, 'public/labs', id);
  for (const f of ['game.json', 'index.html', 'style.css', 'rules.js', 'engine.js', 'engine.test.mjs', 'game.js'])
    assert.ok(existsSync(join(dir, f)), `writes ${f}`);
  for (const f of [`docs/games/${id}.md`, `tools/e2e/${id}/game.mjs`, `public/assets/js/manifests/labs/${id}.js`]) assert.ok(written.includes(f) && existsSync(join(root, f)), `writes ${f}`);

  // The conformance node checks, as for any game in the repo
  assert.deepEqual(await staticConformance(join(root, 'public'), `labs/${id}`), [], 'conforms as born');
  const m = JSON.parse(readFileSync(join(dir, 'game.json'), 'utf8'));
  assert.equal(readFileSync(join(root, `public/assets/js/manifests/labs/${id}.js`), 'utf8'), renderModule(m), 'its manifest module is fresh');
  assert.equal(m.labs, true, 'born in the lab (D-395)');

  // Its engine test passes
  execFileSync(process.execPath, [join(dir, 'engine.test.mjs')], { stdio: 'pipe' });

  // The lab: the door, noindex, back to /labs/, and its card in /labs/
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  assert.match(html, /labs-puerta\.js/);
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /<a class="back" href="\.\.\/"/);
  assert.match(readFileSync(join(root, 'public/labs/index.html'), 'utf8'), new RegExp(`id="seccion-${id}"[\\s\\S]*href="${id}/"`));

  // The design lint: zero hits on its stylesheet, nothing allowlisted (DESIGN.md)
  const hits = lintCss(readFileSync(join(dir, 'style.css'), 'utf8'), `public/labs/${id}/style.css`, tokens(), sharedClasses());
  assert.deepEqual(hits, [], 'the design lint finds nothing');

  // The usability lint on its texts (U-2, U-4, U-5, U-6, U-17) and its how-to-play (U-18)
  const { LOCALES } = await import(pathToFileURL(join(dir, 'rules.js')).href);
  const texts = walk(LOCALES, 'LOCALES').filter(t => t.lang).map(t => ({ file: `public/labs/${id}/rules.js`, ...t }));
  assert.ok(texts.length > 30, 'reads its texts');
  const found = (await usabilityLint({ texts })).filter(h => h.file.includes(id));
  assert.deepEqual(found, [], 'the usability lint finds nothing');
  for (const lang of LANGS) {
    const steps = LOCALES[lang].como;
    assert.ok(steps.length <= 3 && steps.map(p => p.replace(/^\S+ /, '')).join(' ').length <= 280, `${lang}: how to play within U-18`);
  }

  // It refuses a Spanish or malformed id, and never overwrites
  assert.throws(() => newGameFiles('Carrera'), /English id/);
  await assert.rejects(generate(id, {}, root), /already exists/);
  console.log(`new-game: ${id} generated with ${written.length} files, conforms and lints clean`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
