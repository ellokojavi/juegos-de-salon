// The end-to-end scope never falls back to "run everything" without saying so (D-391). The graph in
// affected.mjs runs every script when a changed file is one no page loads, or a script names no page:
// it cannot tell what they reach. Those are found here, when they are written, instead of costing all
// 76 jobs on every PR that touches them.
import assert from 'node:assert/strict';
import { siteGraph, siteFiles, scriptPages, dynamicPages, EVERY_PAGE } from './affected.mjs';
import { scripts, PARTS, chosenJobs, jobs } from './ci.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const graph = siteGraph();
const pages = Object.keys(graph);

// 1. Every file of the site is loaded by some page: by a tag, an import, an `import('…')` or
//    `new URL('assets/css/x.css', ROOT)`. One that is not makes any PR touching it run all.
const reached = new Set(Object.values(graph).flatMap(s => [...s]));
const lost = Object.keys(siteFiles()).filter(f => !reached.has(f));
assert.deepEqual(lost, [], `no page loads ${lost.join(', ')}, so a change to it runs every end-to-end script.
Load it from a page with a tag, an import, import('./path.js') or new URL('path', …), so tools/e2e/affected.mjs can follow it.`);

// 2. Every script GitHub runs names the pages it opens (`${SITE}/hangman/`, or the strings of the
//    games it loops over), or is one of EVERY_PAGE. One that names none runs on every PR.
//    A script split in parts named after games (`cup-games/languages.mjs:hangman`) is narrowed by them.
const isPage = part => pages.some(p => p === part || p.endsWith(`/${part}`));
const blind = scripts().filter(name => {
  if (EVERY_PAGE.has(name)) return false;
  if (PARTS[name]?.every(isPage)) return false;
  const source = readFileSync(join(HERE, name), 'utf8');
  const own = scriptPages(source, pages);
  const dyn = dynamicPages(source, pages);
  dyn.found.forEach(p => own.add(p));
  const folder = name.includes('/') ? name.split('/')[0] : null;
  if (folder) pages.filter(p => p === folder || p.endsWith(`/${folder}`)).forEach(p => own.add(p));
  return (dyn.dynamic && !dyn.found.size) || !own.size;
});
assert.deepEqual(blind, [], `${blind.join(', ')} name no page, so they run on every PR.
Open pages as \`\${SITE}/<page>/\`, name the games you loop over as strings, or add the script to EVERY_PAGE in affected.mjs if it really opens them all.`);

// 3. A script CI never runs (it opens rooms in the production Firebase) runs no job when it changes;
// a shared e2e tool still runs them all
assert.deepEqual(chosenJobs(['tools/e2e/rooms/online.mjs', 'tools/e2e/bulls-and-cows/online.mjs']), [],
  'changing a script left out of CI made the PR run end-to-end scripts');
assert.equal(chosenJobs(['tools/e2e/cdp.mjs']).length, jobs().length, 'changing cdp.mjs must run every script');

console.log(`scope guard: ${Object.keys(siteFiles()).length} site files and ${scripts().length} scripts, all placed, green`);
