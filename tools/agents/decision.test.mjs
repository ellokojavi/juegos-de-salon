// Run: node tools/agents/decision.test.mjs
// Decision numbers and the DECISIONES.md driver (D-301): two branches with different decisions
// come together on their own; two changes to the same thing stay in conflict. Builds a temporary git repo.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { numbers, addedNumbers, nextFree, splitDecisions, build, merge, mergeHead, row } from './decision.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

assert.deepEqual(numbers('## D-01 · a\n## D-12 · b\n### D-5 no\n'), [1, 12]);
assert.deepEqual(addedNumbers('@@\n+## D-12 · x\n ## D-11 · y\n-## D-1 · z'), [12]);
assert.equal(nextFree([1, 296], [298, 297], [299]), 300);
assert.equal(nextFree([], []), 1);

const CAB = '# Decisiones\n\n| Tema | D |\n|---|---|\n| Pruebas | D-1 |\n| Publicar | D-2 |\n\n---\n\n';
const d = (n, t = 'text') => `## D-${n} · título ${n}\n**Estado:** vigente\n${t}\n\n`;
const doc = (cab, ...ds) => build(cab, new Map(ds.map(x => [Number(x.match(/D-(\d+)/)[1]), x])));
const BASE = doc(CAB, d(1), d(2));

// The repo's file is built back the same as it is split
const repo = readFileSync(join(HERE, '../../docs/DECISIONES.md'), 'utf8');
const p = splitDecisions(repo);
assert.equal(build(p.head, p.decisions), repo, 'splitting and building DECISIONES.md leaves it the same');

// Two new decisions, one on each side: both go in, in order
let r = merge(BASE, doc(CAB, d(1), d(2), d(3)), doc(CAB, d(1), d(2), d(4)));
assert.ok(r.clean); assert.deepEqual(numbers(r.text), [1, 2, 3, 4]);
// And they arrive out of order (the higher number merged first): they still end up in order
r = merge(BASE, doc(CAB, d(1), d(2), d(4)), doc(CAB, d(1), d(2), d(3)));
assert.ok(r.clean); assert.deepEqual(numbers(r.text), [1, 2, 3, 4]);
// One side marks an old one as amended and the other adds one: clean
r = merge(BASE, doc(CAB, d(1, 'corregida por D-3'), d(2), d(3)), doc(CAB, d(1), d(2), d(4)));
assert.ok(r.clean); assert.match(r.text, /corregida por D-3/);
// Different rows of the index: clean; the same row: conflict
const cabA = CAB.replace('| Pruebas | D-1 |', '| Pruebas | D-1, D-3 |'), cabB = CAB.replace('| Publicar | D-2 |', '| Publicar | D-2, D-4 |');
r = merge(BASE, doc(cabA, d(1), d(2), d(3)), doc(cabB, d(1), d(2), d(4)));
assert.ok(r.clean); assert.match(r.text, /D-1, D-3/); assert.match(r.text, /D-2, D-4/);
assert.equal(r.text.split('| Pruebas').length, 2, 'the row is not duplicated');
// Both add a decision to the same row: they are joined, in order
r = merge(BASE, doc(cabA, d(1), d(2), d(3)), doc(CAB.replace('| Pruebas | D-1 |', '| Pruebas | D-1, D-4 |'), d(1), d(2), d(4)));
assert.ok(r.clean); assert.match(r.text, /\| Pruebas \| D-1, D-3, D-4 \|/);
// One removes a decision from the row and the other adds: the removal is kept
assert.equal(row('| T | D-1, D-2 |', '| T | D-2, D-3 |', '| T | D-1, D-2, D-4 |'), '| T | D-2, D-3, D-4 |');
// Something else of the same row changed on both sides: conflict
assert.equal(merge(BASE, doc(CAB.replace('| Pruebas |', '| Pruebas (C-12) |'), d(1)), doc(CAB.replace('| Pruebas |', '| Pruebas y CI |'), d(1))).clean, false, 'the same topic renamed differently is a conflict');
// Two new rows in the same place: the skeleton clashes
assert.equal(mergeHead(CAB, CAB.replace('| Publicar | D-2 |', '| Publicar | D-2 |\n| Nuevo A | D-3 |'), CAB.replace('| Publicar | D-2 |', '| Publicar | D-2 |\n| Nuevo B | D-4 |')), null);
// The same number for two different decisions: conflict (that is what the reservation prevents)
assert.equal(merge(BASE, doc(CAB, d(1), d(2), d(3, 'one')), doc(CAB, d(1), d(2), d(3, 'other'))).clean, false);
// The same decision changed differently on both sides: conflict
assert.equal(merge(BASE, doc(CAB, d(1, 'a')), doc(CAB, d(1, 'b'))).clean, false);

// With real git: the driver set up as `install` leaves it, from the worktree's root
const dir = mkdtempSync(join(tmpdir(), 'decision-'));
try {
  const g = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const write = (f, t) => { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), t); };
  g('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'tools/agents'), { recursive: true });
  copyFileSync(join(HERE, 'decision.mjs'), join(dir, 'tools/agents/decision.mjs'));
  write('.gitattributes', 'docs/DECISIONES.md merge=decisions\n');
  write('docs/DECISIONES.md', BASE); g('add', '.'); g('commit', '-qm', 'base');
  g('config', 'merge.decisions.driver', 'node tools/agents/decision.mjs driver %O %A %B');
  g('checkout', '-qb', 'other'); write('docs/DECISIONES.md', doc(cabB, d(1), d(2), d(4))); g('commit', '-qam', 'D-4');
  g('checkout', '-q', 'main'); write('docs/DECISIONES.md', doc(cabA, d(1), d(2), d(3))); g('commit', '-qam', 'D-3');
  g('merge', '-q', '-m', 'merge', 'other');
  const t = readFileSync(join(dir, 'docs/DECISIONES.md'), 'utf8');
  assert.deepEqual(numbers(t), [1, 2, 3, 4]); assert.ok(!/<<<<<<<|>>>>>>>/.test(t));
  // A real clash stays in conflict, with its markers
  g('checkout', '-qb', 'clash'); write('docs/DECISIONES.md', doc(cabA, d(1), d(2), d(3), d(4), d(5, 'one'))); g('commit', '-qam', 'D-5 one');
  g('checkout', '-q', 'main'); write('docs/DECISIONES.md', doc(cabA, d(1), d(2), d(3), d(4), d(5, 'other'))); g('commit', '-qam', 'D-5 other');
  const m = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'merge', '-q', '-m', 'merge', 'clash'], { cwd: dir, encoding: 'utf8' });
  assert.notEqual(m.status, 0, 'D-5 on both sides does not come together on its own');
  assert.match(readFileSync(join(dir, 'docs/DECISIONES.md'), 'utf8'), /<<<<<<< /);
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log('decision: numbers and the DECISIONES.md driver green');
