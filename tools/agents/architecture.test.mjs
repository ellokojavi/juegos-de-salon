// node tools/agents/architecture.test.mjs — the architecture boundary (#1249 step 5, docs/ARCHITECTURE.md),
// a ratchet: each rule on synthetic input, then the gate: no hit outside docs/architecture-allowlist.json
// and no stale entry in it (docs/RULES.md, rule 4). Firebase paths are only counted until step 7.
import assert from 'node:assert/strict';
import { scan, folderOf, allowedImport, check } from './architecture.mjs';

let n = 0;
const test = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const rules = hits => hits.map(h => `${h.rule} ${h.what}`);

await test('a file belongs to its deepest game folder', () => {
  const f = ['public/cup/', 'public/cup/games/zip/', 'public/hangman/'];
  assert.equal(folderOf('public/cup/games/zip/ui.js', f), 'public/cup/games/zip/');
  assert.equal(folderOf('public/cup/app.js', f), 'public/cup/');
  assert.equal(folderOf('public/panel/x.js', f), null);
});

await test('import: assets, own folder and the host\'s shared modules pass; another game is a hit', () => {
  assert.ok(allowedImport('public/assets/js/i18n.js', 'public/hangman/'));
  assert.ok(allowedImport('public/cup/games/solo.js', 'public/cup/games/zip/'));
  assert.ok(allowedImport('public/labs/bodega.js', 'public/labs/pips/'));
  assert.ok(!allowedImport('public/cup/games/zip/engine.js', 'public/cup/games/tango/'));
  const src = `import { t } from '../assets/js/i18n.js';\nimport './own.js';\nimport { e } from '../timeline/engine.js';\n// import '../x/y.js';\nconst m = await import('/cup/code.js');\nexport { z } from '../word/z.js';`;
  assert.deepEqual(rules(scan(src, 'public/hangman/game.js', 'public/hangman/')), ['import ../timeline/engine.js', 'import /cup/code.js', 'import ../word/z.js']);
});

await test('external: another host is a hit, the site itself is not', () => {
  const src = `fetch('https://api.example.com/x'); fetch('https://juegosdesalon.cl/a.json'); fetch('/local');\nnew WebSocket("wss://x.io"); new WebSocket('ws://x.io');\nimport { a } from 'https://cdn.example.com/a.js';\nconst x = new XMLHttpRequest(); x.open('GET', 'http://evil.test/p');`;
  assert.deepEqual(rules(scan(src, 'public/g/a.js', 'public/g/')), ['external https://cdn.example.com/a.js', 'external https://api.example.com', 'external http://evil.test']);
});

await test('storage-key: a literal key without the prefix is a hit', () => {
  const src = `localStorage.getItem('uad-pts-cache'); localStorage.setItem('juegos-de-salon:x', 1); sessionStorage['tmp']; localStorage.getItem(KEY);`;
  assert.deepEqual(rules(scan(src, 'public/g/a.js', 'public/g/')), ['storage-key uad-pts-cache', 'storage-key tmp']);
});

await test('firebase-path: literal ref/child paths are listed', () => {
  assert.deepEqual(rules(scan(`ref(db, 'rooms/x'); child(r, "players"); ref(db, path);`, 'public/g/a.js', 'public/g/')), ['firebase-path rooms/x', 'firebase-path players']);
});

await test('the gate: every hit is allowlisted with its reason, no entry is stale', async () => {
  const { hits, stale } = await check();
  const open = hits.filter(h => !h.allowed && h.rule !== 'firebase-path');
  assert.deepEqual(open.map(h => `${h.file}:${h.line} ${h.rule} ${h.what}`), [], 'a new hit: fix it, or add an entry with its why to docs/architecture-allowlist.json (docs/ARCHITECTURE.md)');
  assert.deepEqual(stale.map(e => `${e.file} ${e.rule} ${e.what}`), [], 'stale entries: remove them from docs/architecture-allowlist.json');
});

await test('every allowlist entry has a reason', async () => {
  const { allowlist } = await import('./architecture.mjs');
  for (const e of allowlist()) assert.ok(e.why && e.why.trim(), `${e.file} ${e.what} has no why`);
});

console.log(`architecture: ${n} tests passed`);
