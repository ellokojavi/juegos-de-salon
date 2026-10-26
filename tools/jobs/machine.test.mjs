// MAC-MINI.md (D-383) names every job that runs on the Mac mini and every ~/.config/juegos-de-salon/
// file the code reads, so moving to another machine leaves nothing behind.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { jobs } from './jobs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const doc = readFileSync(join(ROOT, 'tools/jobs/MAC-MINI.md'), 'utf8');
const missing = [];
for (const j of jobs().filter(j => j.where === 'mac')) {
  if (!doc.includes(`\`${j.id}\``)) missing.push(`job ${j.id}`);
}
const code = execFileSync('git', ['ls-files', 'tools', 'public'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => /\.(mjs|js|py)$/.test(f));
const files = new Set();
for (const f of code) for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(/\.config\/juegos-de-salon\/([A-Za-z0-9_-]+(?:\.[a-z]+)?)/g)) files.add(m[1]);
for (const f of files) if (!doc.includes(`\`${f}`)) missing.push(`~/.config/juegos-de-salon/${f}`);
if (missing.length) { console.log(`✗ tools/jobs/MAC-MINI.md does not name: ${missing.join(', ')}`); process.exit(1); }
console.log(`✓ MAC-MINI.md names the ${files.size} config files and every mac job`);
