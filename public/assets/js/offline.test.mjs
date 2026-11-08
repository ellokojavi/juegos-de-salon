// Run: node public/assets/js/offline.test.mjs
// Offline mode, PR 1 (D-538, docs/OFFLINE.md): which games are offline-capable comes from the games
// manifest, and no offline-capable page loads anything from another site when it opens. A static
// `import … from 'https://…'` (the Firebase SDK on gstatic) would break the whole page with no
// signal; it has to stay a dynamic `import()` reached only when a room or a ranking is needed.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { offlineOk, OFFLINE_PAGES, ALL_GAMES } from './games.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ALL = ALL_GAMES;

// The manifest: `offline` is only ever written as `false`, to opt a game out
for (const g of ALL) {
  assert.ok(!('offline' in g) || g.offline === false, `${g.id}: \`offline\` is only written as false (a game is offline-capable by default)`);
}
assert.equal(offlineOk(ALL.find(g => g.id === 'copa')), false, 'La Copa is never offline: its days, deadlines and PIN need the server');
for (const g of ALL.filter(x => x.torneo)) assert.equal(offlineOk(g), false, `${g.id}: a tournament is never offline`);
assert.ok(ALL.filter(offlineOk).length >= 20, 'the minigames and the party games are offline-capable');

// The static import graph of each offline-capable page reaches no other site
const STATIC = /(?:^|[;\n}])\s*(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const strip = code => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function modules(html, base) {
  const out = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/g)) {
    const src = m[0].match(/\bsrc=["']([^"']+)["']/);
    out.push(src ? { file: resolve(base, src[1].split('?')[0]) } : { code: m[1], file: resolve(base, 'index.html') });
  }
  return out;
}

function remote(entry, seen, chain) {
  if (!entry.code && !existsSync(entry.file)) return [];
  const code = strip(entry.code ?? readFileSync(entry.file, 'utf8'));
  const found = [];
  for (const [, spec] of code.matchAll(STATIC)) {
    if (/^(https?:)?\/\//.test(spec)) { found.push([...chain, spec].join(' → ')); continue; }
    if (!/^\.{0,2}\//.test(spec)) continue;
    const file = spec.startsWith('/') ? resolve(ROOT, '.' + spec) : resolve(dirname(entry.file), spec.split('?')[0]);
    if (seen.has(file)) continue;
    seen.add(file);
    found.push(...remote({ file }, seen, [...chain, file.slice(ROOT.length + 1)]));
  }
  return found;
}

let pages = 0;
for (const g of [...ALL.filter(x => offlineOk(x) && x.path), ...OFFLINE_PAGES.map(path => ({ id: path, path }))]) {
  const html = resolve(ROOT, g.path, 'index.html');
  assert.ok(existsSync(html), `${g.id}: its page exists at ${g.path}`);
  const seen = new Set();
  const found = modules(readFileSync(html, 'utf8'), dirname(html)).flatMap(m => remote(m, seen, [g.path]));
  assert.deepEqual([...new Set(found)], [], `${g.id}: an offline-capable page imports nothing from another site when it opens; load it with import() when it is needed`);
  assert.ok(seen.size > 3, `${g.id}: the walk followed its modules (${seen.size} files)`);
  pages++;
}

// The walker itself: a static remote import is caught, a dynamic one is not
const probe = { code: "import { a } from './x.js';\nimport {\n  b,\n} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';\nconst c = () => import('https://www.gstatic.com/x.js');", file: resolve(ROOT, 'index.html') };
assert.equal(remote(probe, new Set(), ['probe']).length, 1, 'the check catches a static remote import and lets a dynamic one through');

console.log(`✓ offline: ${pages} offline-capable pages, none imports another site when it opens; La Copa stays online`);
