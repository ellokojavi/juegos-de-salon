// Everything behind the lab key is listed in /labs/ (D-409): a page players visit that asks
// labAccess() names, in a `lab: #<id>` comment, the card in public/labs/index.html where a key
// holder finds it. Without it, the owner could not find what they were asked to validate (#611).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('..', import.meta.url));
const labs = readFileSync(join(PUBLIC, 'labs/index.html'), 'utf8');
const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(PUBLIC).filter(p => /\.(js|html)$/.test(p)).map(p => relative(PUBLIC, p))
  .filter(p => !p.startsWith('labs/') && p !== 'assets/js/lab-access.js' && !p.endsWith('.test.mjs'));

let checked = 0;
for (const f of files) {
  const src = readFileSync(join(PUBLIC, f), 'utf8');
  if (!/\blabAccess\b/.test(src)) continue;
  checked++;
  const ids = [...src.matchAll(/\blab: #([\w-]+)/g)].map(m => m[1]);
  assert.ok(ids.length, `${f} asks labAccess() but names no card: add a "lab: #<id>" comment and the card in public/labs/index.html (D-409)`);
  for (const id of ids) assert.ok(labs.includes(`id="${id}"`), `${f} names lab: #${id}, but public/labs/index.html has no card with that id`);
}
assert.ok(checked >= 1, 'no page asks labAccess(): did lab-access.js move?');
console.log(`✓ lab listed: ${checked} page(s) behind the lab key, each with its card in /labs/`);
