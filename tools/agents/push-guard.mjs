// Push guard: a Claude Code PreToolUse hook (.claude/settings.json) that stops a `git push` while a
// generated file is stale, so CI does not go red for it (D-518 signatures decisions-index-stale and
// readme-tests-block-stale: four red `tests` runs on #1253, #1273, #1284, #1286).
// It checks the worktree the push runs from:
//   - docs/DECISIONS.md against docs/decisions/  → node tools/agents/decision.mjs index
//   - README.md generated blocks (ERROR lines)   → python3 tools/release/readme.py update
//   - stylesheets against the design-lint gate    → node tools/agents/design-lint.mjs --gate
//     (signature design-lint-gate: red `tests` on #1244 and #1245)
// Exit 2 blocks the push and tells the session what to run; anything unexpected lets it through.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function isPush(command) {
  return /(^|[;&|\s(])git\s+(-C\s+\S+\s+)?push(\s|$)/.test(command || '');
}

export function problems(cwd, run = (cmd, args) => spawnSync(cmd, args, { cwd, encoding: 'utf8' })) {
  const out = [];
  if (existsSync(join(cwd, 'tools/agents/decision.mjs'))) {
    const r = run('node', ['tools/agents/decision.mjs', 'index', '--check']);
    if (r.status === 1) out.push('docs/DECISIONS.md is stale: node tools/agents/decision.mjs index, then commit it');
  }
  if (existsSync(join(cwd, 'tools/release/readme.py'))) {
    const r = run('python3', ['tools/release/readme.py', 'check']);
    const errors = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter(l => /^\s*ERROR\b/.test(l) && /went stale/.test(l));
    if (errors.length) out.push(`README.md has stale generated blocks: python3 tools/release/readme.py update, then commit it\n  ${errors.join('\n  ')}`);
  }
  if (existsSync(join(cwd, 'tools/agents/design-lint.mjs'))) {
    const r = run('node', ['tools/agents/design-lint.mjs', '--gate']);
    if (r.status === 1) out.push('a stylesheet breaks the design-lint gate: node tools/agents/design-lint.mjs --gate, then use the token or allowlist the hit with its reason (docs/DESIGN.md §4)');
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const command = input?.tool_input?.command;
  if (!isPush(command)) process.exit(0);
  const m = command.match(/git\s+-C\s+(\S+)/);
  const cwd = m ? join(input.cwd || process.cwd(), m[1]) : (input.cwd || process.cwd());
  let found = [];
  try { found = problems(cwd); } catch { process.exit(0); }
  if (!found.length) process.exit(0);
  console.error(`Push stopped (push-guard.mjs, D-518): a generated file is stale and the tests check would go red.\n- ${found.join('\n- ')}`);
  process.exit(2);
}
