// An e2e script must read La Copa's open pool from the page, never import POZO_ABIERTO in Node (D-517):
// Node does not see the site's live launch flags, so a game launched by flag broke cup/tournament.mjs
// on every PR (CI signature 6fad0784f2, pattern e2e-stale-assertion, 2026-11-12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const scripts = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'node_modules') walk(p); } else if (f.endsWith('.mjs') && !f.endsWith('.test.mjs')) scripts.push(p); } };
walk(root);

test('no e2e script imports the open cup pool in Node', () => {
  const bad = scripts.filter(p => /import\s*\{[^}]*\bPOZO_ABIERTO\b[^}]*\}\s*from/.test(readFileSync(p, 'utf8')));
  assert.deepEqual(bad.map(p => p.slice(root.length)), [], 'read it in the page: import(new URL(\'engine.js\', location.href).href)');
});
