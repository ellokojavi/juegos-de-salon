// Run: node tools/agents/clean-worktrees.test.mjs
// Removing the worktrees that are no longer used (D-218, D-252), in a real test repository.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWorktrees, classify, classifyBranches, readStatus, isLitter } from './clean-worktrees.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'clean-worktrees.mjs');

// The format of git worktree list --porcelain
const worktrees = readWorktrees('worktree /r/main\nHEAD a\nbranch refs/heads/main\n\nworktree /r/x\nHEAD b\nbranch refs/heads/tema\n\nworktree /r/y\nHEAD c\ndetached\n');
assert.deepEqual(worktrees, [
  { path: '/r/main', branch: 'main', detached: false },
  { path: '/r/x', branch: 'tema', detached: false },
  { path: '/r/y', branch: null, detached: true },
]);
const plan = classify([...worktrees, { path: '/r/main/.claude/worktrees/w', branch: 'w', detached: false }], { here: '/r/main', merged: () => true, dirty: () => false });
assert.deepEqual(plan.map(c => c.what), ['main', 'remove', 'detached', 'remove'], "the app's ones are removed too when merged");

// The unmerged ones: by their own commits, their days still, their PR and their changes
const one = (o) => classify([worktrees[0], { path: '/r/z', branch: 'z', detached: false }], {
  here: '/r/main', merged: () => false, dirty: () => !!o.dirty, ownCommits: () => o.own, days: () => o.days, hasPr: () => o.pr,
})[1].what;
assert.equal(one({ own: 0, days: 2, pr: false }), 'empty');
assert.equal(one({ own: 0, days: 2, pr: null }), 'empty', 'empty is known without gh');
assert.equal(one({ own: 0, days: 0.5, pr: false }), 'open', 'just created: another session is starting');
assert.equal(one({ own: 2, days: 5, pr: false }), 'abandoned');
assert.equal(one({ own: 2, days: 1, pr: false }), 'open', 'it moved recently');
assert.equal(one({ own: 2, days: 5, pr: true }), 'open', 'with an open PR');
assert.equal(one({ own: 2, days: 5, pr: null }), 'open', 'without gh it is not considered abandoned');
assert.equal(one({ own: 0, days: 9, pr: false, dirty: true }), 'open', 'with uncommitted changes, never');

// The local branches without a worktree (D-315)
const branches = classifyBranches(['main', 'viva', 'pr', 'vieja', 'gh', 'sola', 'respaldo'], {
  inWorktree: r => r === 'viva', merged: r => r === 'vieja', hasPr: r => r === 'pr',
  onGithub: r => r === 'gh', unpushed: r => (r === 'sola' ? 2 : 0),
});
assert.deepEqual(branches.map(r => r.what), ['main', 'in-worktree', 'open', 'merged', 'on-github', 'unpushed', 'no-remote']);
const noGh = classifyBranches(['vieja', 'respaldo'], { inWorktree: () => false, merged: r => r === 'vieja', onGithub: () => false, unpushed: () => 0 });
assert.deepEqual(noGh.map(r => r.what), ['merged', 'unknown'], 'without gh, only the merged ones');

// Test litter (D-315): only with a lost-argument name and only profiles and screenshots
const status = readStatus(' M a.js\n?? undefined/\n?? --parte/\n?? notas/\n?? null/\n', '/r', (_, n) => n !== 'notas' && n !== 'null');
assert.deepEqual(status, { real: [' M a.js', '?? notas/', '?? null/'], litter: ['undefined', '--parte'] });

// A real repository: an origin, the main folder and four worktrees
const base = mkdtempSync(join(tmpdir(), 'limpiar-'));
const g = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  const origin = join(base, 'origen.git');
  g(base, 'init', '-q', '--bare', '-b', 'main', origin);
  const root = join(base, 'juegos');
  g(base, 'clone', '-q', origin, root);
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 't'], ['commit.gpgsign', 'false']]) g(root, 'config', k, v);
  writeFileSync(join(root, 'a.txt'), 'a');
  g(root, 'add', '.'); g(root, 'commit', '-qm', 'uno'); g(root, 'push', '-q', 'origin', 'main');
  const makeWorktree = (name, branch, commit) => {
    const wtPath = join(base, name);
    g(root, 'worktree', 'add', '-q', wtPath, '-b', branch);
    if (commit) { writeFileSync(join(wtPath, `${branch}.txt`), branch); g(wtPath, 'add', '.'); g(wtPath, 'commit', '-qm', branch); }
    return wtPath;
  };
  const mergedWt = makeWorktree('juegos-fusionada', 'fusionada', true);
  const inProgress = makeWorktree('juegos-en-curso', 'en-curso', true);
  const dirtyWt = makeWorktree('juegos-sucia', 'sucia', true);
  // Just created from main, no commits of its own: it is work starting, not removed
  const fresh = makeWorktree('juegos-nueva', 'nueva', false);
  // No commits nor PR for days: empty, removed; with commits: abandoned, pushed and removed
  const old = (Date.now() - 5 * 864e5) / 1000;
  const age = wtPath => utimesSync(join(g(wtPath, 'rev-parse', '--absolute-git-dir'), 'HEAD'), old, old);
  const emptyWt = makeWorktree('juegos-vacia', 'vacia', false);
  age(emptyWt);
  const abandonedWt = join(base, 'juegos-abandonada');
  g(root, 'worktree', 'add', '-q', abandonedWt, '-b', 'abandonada');
  writeFileSync(join(abandonedWt, 'b.txt'), 'b'); g(abandonedWt, 'add', '.');
  execFileSync('git', ['commit', '-qm', 'abandonada'], { cwd: abandonedWt, env: { ...process.env, GIT_COMMITTER_DATE: `@${Math.round(old)}`, GIT_AUTHOR_DATE: `@${Math.round(old)}` } });
  age(abandonedWt);
  // With old commits but with an open PR: left
  const withPr = join(base, 'juegos-con-pr');
  g(root, 'worktree', 'add', '-q', withPr, '-b', 'con-pr');
  writeFileSync(join(withPr, 'c.txt'), 'c'); g(withPr, 'add', '.');
  execFileSync('git', ['commit', '-qm', 'con-pr'], { cwd: withPr, env: { ...process.env, GIT_COMMITTER_DATE: `@${Math.round(old)}`, GIT_AUTHOR_DATE: `@${Math.round(old)}` } });
  age(withPr);
  // The Claude app creates its own inside .claude/worktrees: merged, they are removed too
  mkdirSync(join(root, '.claude', 'worktrees'), { recursive: true });
  const app = join(root, '.claude', 'worktrees', 'app');
  g(root, 'worktree', 'add', '-q', app, '-b', 'app');
  writeFileSync(join(app, 'app.txt'), 'app'); g(app, 'add', '.'); g(app, 'commit', '-qm', 'app');
  // They are merged into main with a merge commit, like GitHub's button (--merge), and pushed
  g(root, 'merge', '-q', '--no-ff', '--no-edit', 'fusionada'); g(root, 'merge', '-q', '--no-ff', '--no-edit', 'sucia'); g(root, 'merge', '-q', '--no-ff', '--no-edit', 'app');
  g(root, 'push', '-q', 'origin', 'main');
  writeFileSync(join(dirtyWt, 'pending.txt'), 'uncommitted');

  // Test litter: the merged one has a Chrome profile and screenshots in undefined/, and a worktree
  // in progress a --parte/ with a profile; in another, an undefined/ with code is not litter
  const litter = (wtPath, name, extra) => {
    mkdirSync(join(wtPath, name, 'p', 'Default'), { recursive: true });
    writeFileSync(join(wtPath, name, 'p', 'Local State'), '{}'); writeFileSync(join(wtPath, name, 'p', 'Default', 'Cookies'), 'x');
    writeFileSync(join(wtPath, name, '01-inicio.png'), 'png');
    if (extra) writeFileSync(join(wtPath, name, extra), 'real');
  };
  litter(mergedWt, 'undefined');
  litter(withPr, '--parte');
  assert.equal(isLitter(mergedWt, 'undefined'), true);
  assert.equal(isLitter(mergedWt, 'p'), false, 'un nombre normal nunca es basura');
  const withCode = join(base, 'con-codigo'); mkdirSync(withCode); litter(withCode, 'undefined', 'juego.mjs');
  assert.equal(isLitter(withCode, 'undefined'), false, 'with something that is not from tests, it is real');

  // Local branches without a worktree: one already merged, one whose GitHub branch was deleted (its
  // commit is in another), one with a commit that is only here, one with its branch on GitHub and one with an open PR
  g(root, 'branch', 'vieja', 'fusionada');
  g(root, 'branch', 'otra', 'con-pr'); g(root, 'push', '-q', 'origin', 'otra');
  g(root, 'branch', 'respaldo', 'otra'); g(root, 'push', '-q', 'origin', 'respaldo'); g(root, 'branch', '-u', 'origin/respaldo', 'respaldo');
  g(origin, 'branch', '-D', 'respaldo');
  g(root, 'branch', 'sola', 'en-curso');
  g(root, 'branch', 'pr-sin-copia', 'en-curso');

  const env = { ...process.env, CLEAN_OPEN_PRS: 'con-pr,en-curso,sucia,pr-sin-copia' };
  const shown = execFileSync('node', [SCRIPT, '--show'], { cwd: root, encoding: 'utf8', env });
  assert.match(shown, /juegos-fusionada \(fusionada\)/);
  assert.ok(existsSync(mergedWt), '--show removes nothing');

  assert.match(shown, /would push their branch to GitHub[\s\S]*juegos-abandonada/);
  assert.match(shown, /Test litter in juegos-fusionada: undefined/);
  assert.match(shown, /Test litter in juegos-con-pr: --parte \(does not count as a change\)/);
  assert.match(shown, /Local branches it would delete: .*vieja/);
  assert.ok(g(root, 'branch', '--list', 'vieja'), '--show deletes no branches');
  const output = execFileSync('node', [SCRIPT, '--hook'], { cwd: root, encoding: 'utf8', env });
  assert.match(output, /removed 3 merged or empty worktree\(s\): .*juegos-fusionada/);
  assert.match(output, /abandoned worktree\(s\), with their branch pushed to GitHub: juegos-abandonada/);
  assert.ok(!existsSync(emptyWt) && !existsSync(app), 'the empty one and the merged app one were removed');
  assert.ok(!existsSync(abandonedWt), 'the abandoned one was removed');
  assert.ok(g(origin, 'branch', '--list', 'abandonada'), 'and its branch stayed on the origin');
  assert.ok(existsSync(withPr), 'the one with an open PR stays');
  assert.ok(existsSync(join(withPr, '--parte')), 'and its litter too: the worktree is still alive');
  assert.match(output, /test litter \(undefined\)/);
  assert.match(output, /deleted 2 local branch\(es\)[^·]*: (respaldo, vieja|vieja, respaldo)/);
  assert.match(output, /not on GitHub \(left\): sola/);
  for (const r of ['vieja', 'respaldo']) assert.ok(!g(root, 'branch', '--list', r), `branch ${r} was deleted`);
  for (const r of ['main', 'otra', 'sola', 'pr-sin-copia', 'en-curso', 'nueva']) assert.ok(g(root, 'branch', '--list', r), `la rama ${r} queda`);
  assert.match(output, /uncommitted changes: juegos-sucia/);
  assert.match(output, /in progress: .*juegos-en-curso/);
  assert.ok(!existsSync(mergedWt), 'the merged one was removed');
  assert.ok(!g(root, 'branch', '--list', 'fusionada'), 'and its branch too');
  assert.ok(existsSync(inProgress) && existsSync(dirtyWt), 'the others stay');
  assert.ok(existsSync(fresh), 'the one just created, without commits, stays');
  assert.match(output, /in progress: .*juegos-nueva/);

  // From inside a worktree, that worktree is not removed even if merged
  g(root, 'merge', '-q', '--no-ff', '--no-edit', 'en-curso'); g(root, 'push', '-q', 'origin', 'main');
  execFileSync('node', [SCRIPT, '--hook'], { cwd: inProgress, encoding: 'utf8', env });
  assert.ok(existsSync(inProgress), 'the worktree it runs from is not removed');
  // Outside a repository, the hook does not stop the session
  const outside = execFileSync('node', [SCRIPT, '--hook'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.match(outside, /could not check them/);
} finally {
  rmSync(base, { recursive: true, force: true });
}

console.log('clean-worktrees: ok');
