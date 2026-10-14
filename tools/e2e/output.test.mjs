// Run: node tools/e2e/output.test.mjs
// The scripts' output folder (D-315): without a folder, or with a flag first, `undefined/` or
// `--part/` never end up inside the worktree.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { output as output, isFolder as isFolder } from './output.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

assert.equal(output(null, ['node', 'g.mjs', '/tmp/x']), '/tmp/x');
assert.equal(output('/tmp/cup', ['node', 'tournament.mjs', '--part', 'cup']), '/tmp/cup', 'a flag is not the folder');
assert.equal(output('/tmp/cup', ['node', 'tournament.mjs']), '/tmp/cup');
assert.equal(output('/tmp/cup', ['node', 'tournament.mjs', 'undefined']), '/tmp/cup', '`undefined` turned into text is not the folder');
const fresh = output(null, ['node', '/r/tools/e2e/room-error.mjs']);
assert.ok(fresh.startsWith(join(tmpdir(), 'room-error-')) && existsSync(fresh), `without a folder, a new one in the temp directory (${fresh})`);
rmSync(fresh, { recursive: true, force: true });
for (const bad of [undefined, null, '', 'undefined', 'undefined/p', '--part', '--part/p', '/x/undefined/p', 'null']) assert.equal(isFolder(bad), false, String(bad));
for (const good of ['/tmp/cup', 'out', '/private/tmp/usability-2026-10-14-screenshots', '/tmp/undefinedo']) assert.equal(isFolder(good), true, good);

// No script reads its folder from process.argv[2] by hand: they all go through output()
const scripts = [];
const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.mjs') && !n.endsWith('.test.mjs') && n !== 'output.mjs') scripts.push(p); } };
walk(HERE);
const byHand = scripts.filter(p => /process\.argv\[2\]/.test(readFileSync(p, 'utf8'))).map(p => relative(HERE, p));
assert.deepEqual(byHand, [], `read process.argv[2] without output() (D-315): ${byHand.join(', ')}`);

console.log(`✓ output: ${scripts.length} scripts without process.argv[2] by hand`);
