/**
 * The home page's One a Day card arrives together with La Copa only if every module it statically
 * imports is fetched with the page (`<link rel="modulepreload">`). A module it imports that is not
 * in that list is found only once its importer arrives, one round trip later each level down, and
 * the empty 📅 card shows that long before turning into the real one (320 ms on a slow 4G, when
 * fin.js and daily-points.js were added without a preload). This walks the import graph and fails
 * on the module that is missing.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(site, 'index.html'), 'utf8');
const preloaded = new Set([...html.matchAll(/<link rel="modulepreload" href="([^"?]+)"/g)].map(m => m[1]));

// The static imports only: a dynamic import() is loaded later on purpose
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^;'"]*?(?:from\s*)?['"](\.[^'"]+\.js)['"]/g;
const graph = roots => {
  const seen = new Set(), queue = roots.map(r => resolve(site, r));
  while (queue.length) {
    const f = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(IMPORT)) queue.push(resolve(dirname(f), m[1]));
  }
  return [...seen].map(f => relative(site, f));
};

// What the page's own module imports is fetched with it anyway, at the same depth or earlier
const page = html.slice(html.lastIndexOf('<script type="module">'));
const home = new Set(graph([...page.matchAll(/^\s*import\s[^;]*?from\s*'\.\/([^']+\.js)'/gm)].map(m => m[1])));
const daily = graph(['assets/js/uno-al-dia.js', 'assets/js/uno-al-dia-ui.js']).filter(f => !home.has(f) || preloaded.has(f));
const missing = daily.filter(f => !preloaded.has(f));
assert.deepEqual(missing, [], `public/index.html does not preload what One a Day's card imports: add <link rel="modulepreload" href="…"> for ${missing.join(', ')}`);
assert.ok(home.size > 5, 'the home page module was not read');
console.log(`  ✓ the ${daily.length} modules only One a Day's card brings are preloaded`);

const stale = [...preloaded].filter(f => !daily.includes(f));
assert.deepEqual(stale, [], `public/index.html preloads modules One a Day's card no longer imports: ${stale.join(', ')}`);
console.log('  ✓ no preload is left over');
