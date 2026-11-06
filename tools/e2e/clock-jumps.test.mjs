// The first clock jump in an end-to-end script is anchored to the cup's midnight (pattern
// e2e-clock-assumption, D-518): a fixed jump (a day, a day and three hours) lands on a different
// day depending on the hour CI runs and on summer time ending (#1162, #1163).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (n !== 'node_modules') walk(p); }
    else if (n.endsWith('.mjs') && !n.endsWith('.test.mjs')) files.push(p);
  }
})(root);

const bad = [];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  const i = s.indexOf('adelantar(');
  if (i < 0) continue;
  const line = s.slice(s.lastIndexOf('\n', i) + 1, s.indexOf('\n', i));
  if (!line.includes('medianoche(')) bad.push(`${f.slice(root.length + 1)}: ${line.trim().slice(0, 120)}`);
}
assert.deepEqual(bad, [], `the first adelantar() of each script must be anchored with medianoche(start, tz):\n${bad.join('\n')}`);
console.log(`✓ clock jumps anchored in ${files.length} scripts`);
