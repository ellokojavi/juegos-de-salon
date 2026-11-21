// Run: node tools/e2e/footer-bottom.test.mjs
// Nothing under the footer, on every page (D-599): each page of the site is measured by one script, or says why it has
// no footer. A new page fails here until it is placed; an entry for a page that no longer exists fails too (R-4).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifestFolders } from '../generators/manifests.mjs';
import { COVER_GAMES } from './footer-bottom.mjs';
import { PAGES, NO_FOOTER } from './pages-footer-bottom.mjs';

const ROOT = fileURLToPath(new URL('../../public/', import.meta.url));
const pages = [];
const walk = dir => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n === 'index.html' && !readFileSync(p, 'utf8').includes('Bridge page')) pages.push(relative(ROOT, dir).split('\\').join('/'));
  }
};
walk(ROOT);

const byScript = { 'conformance.mjs': manifestFolders(), 'cup-games/footer-bottom.mjs': COVER_GAMES, 'pages-footer-bottom.mjs': PAGES };
const placed = new Set([...Object.values(byScript).flat(), ...Object.keys(NO_FOOTER)]);
const lost = pages.filter(p => !placed.has(p));
assert.deepEqual(lost, [], `pages no script measures under the footer: ${lost.map(p => '/' + p).join(', ')}.
Add each to PAGES in tools/e2e/pages-footer-bottom.mjs, or to NO_FOOTER with why it has no footer.`);
const stale = [...PAGES, ...Object.keys(NO_FOOTER)].filter(p => !existsSync(join(ROOT, p, 'index.html')));
assert.deepEqual(stale, [], `entries for pages that do not exist: ${stale.join(', ')}`);
const both = PAGES.filter(p => p in NO_FOOTER);
assert.deepEqual(both, [], `measured and excused at once: ${both.join(', ')}`);
assert.ok(Object.values(NO_FOOTER).every(why => why.length > 15), 'every page without a footer says why');
console.log(`✓ footer-bottom: ${pages.length} pages, each measured or excused (D-599)`);
