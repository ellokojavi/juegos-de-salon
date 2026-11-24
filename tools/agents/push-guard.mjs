// Push guard: a Claude Code PreToolUse hook (.claude/settings.json) that stops a `git push` while a
// generated file is stale, so CI does not go red for it (D-518 signatures decisions-index-stale and
// readme-tests-block-stale: four red `tests` runs on #1253, #1273, #1284, #1286).
// It checks the worktree the push runs from:
//   - docs/DECISIONS.md against docs/decisions/  → node tools/agents/decision.mjs index
//   - README.md generated blocks (ERROR lines)   → python3 tools/release/readme.py update
//   - the decision files themselves (unknown topic, Status not canonical, a number twice)
//     → node tools/agents/document.mjs decisions (signature 754d57b1bc: red `tests` on #1492, #1574)
//   - stylesheets against the design-lint gate    → node tools/agents/design-lint.mjs --gate
//     (signature design-lint-gate: red `tests` on #1244 and #1245)
//   - a game's cover changed without landing-fold.mjs passing on it here (#1624, #1629: five pushes
//     each) → node tools/e2e/landing-fold.mjs --only <game> (tools/e2e/landing-stamp.mjs)
//   - a /labs/ card over its word limit            → node public/labs/short-cards.test.mjs
//     (signature 97c0b5ca90: red `tests` on #1696, #1699, #1667, each after bringing main in, D-594)
//   - a page under public/ that no footer script measures or excuses (D-599)
//     → node tools/e2e/footer-bottom.test.mjs (signature 03ba96abef: red `tests` on #1809, #1851)
//   - a branch that brings changes but no changelog/<branch>.md entry (D-300)
//     → node tools/release/changelog.mjs new [patch|minor]
// Exit 2 blocks the push and tells the session what to run; anything unexpected lets it through.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function isPush(command) {
  return /(^|[;&|\s(])git\s+(-C\s+\S+\s+)?push(\s|$)/.test(command || '');
}

/** The folder a push runs in: `git -C <dir>`, else the last `cd <dir>` before the push, else the
 *  session's cwd. Sessions work in worktrees with `cd <worktree> && git push`, while the hook's cwd
 *  is the main folder: checking that let stale README blocks through (#1416, #1436). */
export function pushDir(command, cwd) {
  const at = command.search(/(^|[;&|\s(])git\s+(-C\s+\S+\s+)?push(\s|$)/);
  const before = at < 0 ? command : command.slice(0, at + 1);
  const unq = x => x.replace(/^["']|["']$/g, '');
  const c = before.match(/git\s+-C\s+(\S+)/) || command.match(/git\s+-C\s+(\S+)\s+push/);
  if (c) return resolve(cwd, unq(c[1]));
  let dir = cwd;
  for (const m of before.matchAll(/(?:^|[;&|(]\s*)cd\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/g)) dir = resolve(dir, unq(m[1]));
  return dir;
}

export function problems(cwd, run = (cmd, args) => spawnSync(cmd, args, { cwd, encoding: 'utf8' })) {
  const out = [];
  if (existsSync(join(cwd, 'tools/agents/decision.mjs'))) {
    const r = run('node', ['tools/agents/decision.mjs', 'index', '--check']);
    if (r.status === 1) out.push('docs/DECISIONS.md is stale: node tools/agents/decision.mjs index, then commit it');
  }
  if (existsSync(join(cwd, 'tools/agents/document.mjs'))) {
    const r = run('node', ['tools/agents/document.mjs', 'decisions']);
    const lines = (r.stdout || '').split('\n').filter(l => l.startsWith('✗')).map(l => l.replace(/^✗\s*/, ''));
    if (r.status === 1 && lines.length) out.push(`a decision file would fail document.test.mjs: fix it in docs/decisions/, then commit it\n  ${lines.join('\n  ')}`);
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
  if (existsSync(join(cwd, 'tools/e2e/landing-stamp.mjs'))) {
    const r = run('node', ['tools/e2e/landing-stamp.mjs', '--check']);
    if (r.status === 1) out.push((r.stdout || '').trim() || 'a cover changed without its landing-fold run: node tools/e2e/landing-fold.mjs --only <game>');
  }
  if (existsSync(join(cwd, 'public/labs/short-cards.test.mjs'))) {
    const r = run('node', ['public/labs/short-cards.test.mjs']);
    const long = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter(l => /^\s+#seccion-/.test(l)).map(l => l.trim());
    if (r.status === 1 && long.length) out.push(`a /labs/ card is over its word limit (D-594): shorten it in public/labs/index.html, then commit it\n  ${long.join('\n  ')}`);
  }
  if (existsSync(join(cwd, 'tools/e2e/footer-bottom.test.mjs'))) {
    const r = run('node', ['tools/e2e/footer-bottom.test.mjs']);
    const why = `${r.stdout || ''}${r.stderr || ''}`.split('\n').find(l => /pages no script measures|entries for pages that do not exist|measured and excused at once/.test(l));
    if (r.status === 1 && why) out.push(`a page is not placed for the footer check (D-599): add it to PAGES or NO_FOOTER in tools/e2e/pages-footer-bottom.mjs, then commit it\n  ${why.replace(/^.*?(pages no|entries|measured)/, '$1').trim()}`);
  }
  out.push(...missingChangelog(run));
  return out;
}

/** A topic branch that brings changes must bring its changelog entry (D-300). Silent when git
 *  cannot answer (no origin/main, detached HEAD) or on main itself. */
export function missingChangelog(run) {
  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const name = (branch.stdout || '').trim();
  if (branch.status !== 0 || !name || name === 'HEAD' || name === 'main') return [];
  const diff = run('git', ['diff', '--name-only', 'origin/main...HEAD']);
  if (diff.status !== 0) return [];
  const files = (diff.stdout || '').split('\n').filter(Boolean);
  if (!files.length || files.some(f => /^changelog\/[^/]+\.md$/.test(f) && f !== 'changelog/README.md')) return [];
  return [`the branch has no changelog entry (D-300): node tools/release/changelog.mjs new [patch|minor], write it, then commit it`];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const command = input?.tool_input?.command;
  if (!isPush(command)) process.exit(0);
  const cwd = pushDir(command, input.cwd || process.cwd());
  let found = [];
  try { found = problems(cwd); } catch { process.exit(0); }
  if (!found.length) process.exit(0);
  console.error(`Push stopped (push-guard.mjs, D-518): CI would go red for something found here.\n- ${found.join('\n- ')}`);
  process.exit(2);
}
