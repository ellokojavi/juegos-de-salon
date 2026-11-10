import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPush, problems } from './push-guard.mjs';

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
    ? { status: args[0].includes('design-lint') ? 0 : 1, stdout: '' }
    : { status: 1, stdout: 'ERROR · the block "tests" went stale  →  python3 tools/release/readme.py update\nERROR · screenshot x outdated\n' };
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 2);
  assert.match(found[0], /decision\.mjs index/);
  assert.match(found[1], /block "tests"/);
  assert.doesNotMatch(found[1], /screenshot/);
});

test('problems names a design-lint gate failure', () => {
  const run = (cmd, args) => ({ status: cmd === 'node' && args[0].includes('design-lint') ? 1 : 0, stdout: '' });
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 1);
  assert.match(found[0], /design-lint\.mjs --gate/);
});

test('problems is empty when everything is up to date', () => {
  assert.deepEqual(problems(process.cwd(), () => ({ status: 0, stdout: '' })), []);
});

test('.claude/settings.json runs the guard before Bash', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const cmds = (s.hooks.PreToolUse || []).filter(h => h.matcher === 'Bash').flatMap(h => h.hooks.map(x => x.command));
  assert.ok(cmds.some(c => c.includes('tools/agents/push-guard.mjs')));
});
