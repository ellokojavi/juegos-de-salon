import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isPush, problems, pushDir, missingChangelog } from './push-guard.mjs';

test('isPush sees a git push, not other commands', () => {
  assert.ok(isPush('git push -u origin x'));
  assert.ok(isPush('cd a && git push'));
  assert.ok(isPush('git -C ../wt push origin b'));
  assert.ok(!isPush('git pushd'));
  assert.ok(!isPush('git status'));
  assert.ok(!isPush('echo "do not push"'));
});

test('problems names the stale index and the stale README block', () => {
  const run = (cmd, args) => cmd === 'node'
    ? { status: /design-lint|landing-stamp|document/.test(args[0]) ? 0 : 1, stdout: '' }
    : { status: 1, stdout: 'ERROR · the block "tests" went stale  →  python3 tools/release/readme.py update\nERROR · screenshot x outdated\n' };
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 2);
  assert.match(found[0], /decision\.mjs index/);
  assert.match(found[1], /block "tests"/);
  assert.doesNotMatch(found[1], /screenshot/);
});

test('problems names a decision file document.test.mjs would fail (#1492, #1574)', () => {
  const bad = 'D-583 has the topic "games", which is not in docs/decisions/topics.json';
  const run = (cmd, args) => cmd === 'node' && args[0].includes('document.mjs')
    ? { status: 1, stdout: `✗ ${bad}\n` } : { status: 0, stdout: '' };
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 1);
  assert.match(found[0], /document\.test\.mjs/);
  assert.ok(found[0].includes(bad));
});

test('the real decisions check runs and is clean on this repo', async () => {
  const { decisionProblems } = await import('./document.mjs');
  assert.deepEqual(decisionProblems(), []);
});

test('problems names a design-lint gate failure', () => {
  const run = (cmd, args) => ({ status: cmd === 'node' && args[0].includes('design-lint') ? 1 : 0, stdout: '' });
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 1);
  assert.match(found[0], /design-lint\.mjs --gate/);
});

test('problems names a cover changed without its landing-fold run (#1624, #1629)', () => {
  const msg = 'a cover changed without its landing-fold run on this content (labs/croc/): node tools/e2e/landing-fold.mjs --only croc';
  const run = (cmd, args) => ({ status: cmd === 'node' && args[0].includes('landing-stamp') ? 1 : 0, stdout: cmd === 'node' && args[0].includes('landing-stamp') ? `${msg}\n` : '' });
  const found = problems(process.cwd(), run);
  assert.deepEqual(found, [msg]);
});

test('problems names a /labs/ card over its word limit (#1696, #1699, #1667)', () => {
  const err = 'AssertionError [ERR_ASSERTION]: card text over 25 words in public/labs/index.html: say what it tries\n  #seccion-cup-big: 27 words\n';
  const run = (cmd, args) => cmd === 'node' && args[0].includes('short-cards') ? { status: 1, stdout: '', stderr: err } : { status: 0, stdout: '' };
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 1);
  assert.match(found[0], /word limit/);
  assert.match(found[0], /#seccion-cup-big: 27 words/);
  // a crash with no card named (a markup change) is not this guard's to stop
  assert.deepEqual(problems(process.cwd(), (cmd, args) => cmd === 'node' && args[0].includes('short-cards') ? { status: 1, stdout: '', stderr: 'boom' } : { status: 0, stdout: '' }), []);
});

test('problems is empty when everything is up to date', () => {
  assert.deepEqual(problems(process.cwd(), () => ({ status: 0, stdout: '' })), []);
});

test('.claude/settings.json runs the guard before Bash', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const cmds = (s.hooks.PreToolUse || []).filter(h => h.matcher === 'Bash').flatMap(h => h.hooks.map(x => x.command));
  assert.ok(cmds.some(c => c.includes('tools/agents/push-guard.mjs')));
});

test('pushDir checks the worktree a cd moved to, not the session folder (#1416, #1436)', () => {
  assert.equal(pushDir('git push', '/repo'), '/repo');
  assert.equal(pushDir('cd ../wt && git push -u origin b', '/repo'), '/wt');
  assert.equal(pushDir('cd "/tmp/a b" && git add . && git push', '/repo'), '/tmp/a b');
  assert.equal(pushDir('cd /x && cd y; git push', '/repo'), '/x/y');
  assert.equal(pushDir('git -C ../wt push origin b', '/repo'), '/wt');
  assert.equal(pushDir('git push && cd /elsewhere', '/repo'), '/repo');
});

test('missingChangelog asks for the entry only on a topic branch that brings changes without one (D-300)', () => {
  const git = (branch, diff, status = 0) => (cmd, args) => args[0] === 'rev-parse' ? { status: 0, stdout: `${branch}\n` } : { status, stdout: diff };
  assert.equal(missingChangelog(git('topic', 'public/a.js\n')).length, 1);
  assert.match(missingChangelog(git('topic', 'public/a.js\n'))[0], /changelog\.mjs new/);
  assert.deepEqual(missingChangelog(git('topic', 'public/a.js\nchangelog/topic.md\n')), []);
  assert.equal(missingChangelog(git('topic', 'changelog/README.md\n')).length, 1);
  assert.deepEqual(missingChangelog(git('topic', '')), []);
  assert.deepEqual(missingChangelog(git('main', 'public/a.js\n')), []);
  assert.deepEqual(missingChangelog(git('topic', 'x', 128)), []);
});

/** Run a hook's command the way Claude Code does (a shell, CLAUDE_PROJECT_DIR set) against a stub
 *  script that exits with `code`. */
function hookStatus(command, script, code) {
  const dir = mkdtempSync(join(tmpdir(), 'hook-'));
  try {
    if (code !== null) {
      mkdirSync(join(dir, 'tools/agents'), { recursive: true });
      writeFileSync(join(dir, 'tools/agents', script), `process.exit(${code});\n`);
    }
    return spawnSync('sh', ['-c', command], { env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, input: '{}' }).status;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Hooks whose script exits 2 on purpose but whose command still swallows it, each with why.
const ADVISORY = {
  // Cloud sessions edit their clone's main folder, which is all they have: blocking would stop them.
  'worktree-guard.mjs': 'cloud sessions work in their clone itself (processes round 2026-11-20)',
};

test('a hook whose script blocks with exit 2 passes the 2 on to Claude Code (#1582, #1667, #1699)', () => {
  // From 2026-11-09 to 2026-11-20 the push guard's command ended in `|| true`, which turned its
  // exit 2 into 0: it never stopped a push, and design-lint went red on three PRs it should have caught.
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const hooks = Object.values(s.hooks).flat().flatMap(h => h.hooks.map(x => x.command));
  let checked = 0;
  for (const command of hooks) {
    const script = (command.match(/tools\/agents\/([\w-]+\.mjs)/) || [])[1];
    if (!script || ADVISORY[script]) continue;
    if (!/process\.exit\(2\)/.test(readFileSync(join('tools/agents', script), 'utf8'))) continue;
    checked++;
    assert.equal(hookStatus(command, script, 2), 2, `${script}: its hook command must exit 2 when the script does`);
    assert.equal(hookStatus(command, script, 1), 0, `${script}: anything else lets the tool run`);
    assert.equal(hookStatus(command, script, null), 0, `${script}: a checkout without the script lets the tool run`);
  }
  assert.ok(checked >= 2, 'push-guard and stop-tests are checked');
});

// A page no footer script places stops the push, naming it (signature 03ba96abef)
{
  const err = "AssertionError [ERR_ASSERTION]: pages no script measures under the footer: /badges/.\nAdd each to PAGES";
  const run = (cmd, args) => cmd === 'node' && args[0].includes('footer-bottom') ? { status: 1, stdout: '', stderr: err } : { status: 0, stdout: '' };
  const hit = problems(process.cwd(), run).find(p => p.includes('D-599'));
  assert.ok(hit && hit.includes('/badges/'), 'footer-bottom failure blocks the push');
  assert.ok(!problems(process.cwd(), (cmd, args) => cmd === 'node' && args[0].includes('footer-bottom') ? { status: 1, stdout: '', stderr: 'boom' } : { status: 0, stdout: '' }).some(p => p.includes('D-599')), 'an unexpected crash lets it through');
}

// A new architecture hit and a new Spanish exported name stop the push (signatures ea485401a9, 965641ffe6)
{
  const arch = "AssertionError [ERR_ASSERTION]: a new hit: fix it, or add an entry with its why to docs/architecture-allowlist.json (docs/ARCHITECTURE.md)\n+ actual - expected\n\n+ [\n+   'public/assets/js/season.js:3 layers imports up'\n+ ]\n- []";
  const ids = 'AssertionError [ERR_ASSERTION]: new Spanish exported names (name them in English, D-316): public/assets/js/duels-ui.js listaLinea';
  const run = (cmd, args) => cmd !== 'node' ? { status: 0, stdout: '' }
    : args[0].includes('architecture.test') ? { status: 1, stdout: '', stderr: arch }
    : args[0].includes('identifiers.test') ? { status: 1, stdout: '', stderr: ids }
    : { status: 0, stdout: '' };
  const found = problems(process.cwd(), run);
  assert.ok(found.some(p => p.includes('architecture-allowlist') && p.includes('season.js:3')), 'a new architecture hit blocks the push, naming it');
  assert.ok(found.some(p => p.includes('D-316') && p.includes('duels-ui.js listaLinea')), 'a new Spanish export blocks the push, naming it');
  const crash = (cmd, args) => cmd === 'node' && /architecture|identifiers/.test(args[0]) ? { status: 1, stdout: '', stderr: 'boom' } : { status: 0, stdout: '' };
  assert.ok(!problems(process.cwd(), crash).some(p => /architecture hit|Spanish exported/.test(p)), 'an unexpected crash lets it through');
}
