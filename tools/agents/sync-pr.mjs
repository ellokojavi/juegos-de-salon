#!/usr/bin/env node
/**
 * A PR in conflict only because of generated files is brought up to date by itself (D-580). Many
 * sessions work at once, and every merge to `main` rewrites the same generated files (the decisions
 * index, docs/facts.json, the README's generated blocks, the rule counts), so open PRs went into conflict for hours
 * with nothing of theirs actually clashing (2026-11-17: DECISIONS.md touched by 60 merges in 3 days).
 *
 *   node tools/agents/sync-pr.mjs          # in the PR's worktree, on its branch, with nothing uncommitted
 *
 * It merges origin/main. If the only conflicts are in generated files, it regenerates them, commits
 * and pushes (the push starts CI again). If any other file conflicts, it undoes the merge and lists
 * them: that clash is real and the session resolves it. wait-pr.mjs runs it on a conflict (D-400).
 * Exit 0 synced (or already up to date), 1 real conflict, 2 cannot run here.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Files whose content is generated from others: a conflict in them is never real. */
export const GENERATED = ['docs/DECISIONS.md', 'docs/facts.json'];
/** Files whose only conflicts are the rule counts and lists that rules.mjs writes from docs/rules.json. */
export const RULE_COUNTS = ['docs/RULES.md', 'CONTRIBUTING.md', '.github/pull_request_template.md'];
/** A conflict hunk that only differs in numbers (the counts a generator writes). */
export const numbersOnly = text => [...text.matchAll(/^<<<<<<< [^\n]*\n([\s\S]*?)^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm)]
  .every(([, a, b]) => a.replace(/\d+/g, '#') === b.replace(/\d+/g, '#'));
/** Files with generated blocks among prose: automatic only when every conflict sits inside a block. */
export const BLOCKS = ['README.md'];

/** Whether every conflict hunk of `text` lies inside a `<!-- generated: … -->` block. */
export function onlyInBlocks(text) {
  let inside = false;
  for (const line of text.split('\n')) {
    if (/^<!-- generated: /.test(line)) inside = true;
    else if (/^<!-- \/generated -->/.test(line)) inside = false;
    else if (/^<<<<<<< /.test(line) && !inside) return false;
  }
  return true;
}

/** The text with each conflict resolved to the PR's side (the block is regenerated afterwards anyway). */
export const keepOurs = text => text.replace(/^<<<<<<< [^\n]*\n([\s\S]*?)^=======\n[\s\S]*?^>>>>>>> [^\n]*\n/gm, '$1');

/** Which conflicted files can be resolved by regenerating, and which cannot. */
export function classify(files, read = f => readFileSync(f, 'utf8')) {
  const real = files.filter(f => !GENERATED.includes(f) && !(BLOCKS.includes(f) && onlyInBlocks(read(f))) && !(RULE_COUNTS.includes(f) && numbersOnly(read(f))));
  return { auto: files.filter(f => !real.includes(f)), real };
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const sh = (cmd, ...a) => execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export function sync({ push = true } = {}) {
  if (git('status', '--porcelain')) { console.log('sync-pr: uncommitted changes here; not touching them'); return 2; }
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch === 'HEAD' || branch === 'main') { console.log(`sync-pr: not on a PR branch (${branch})`); return 2; }
  git('fetch', '-q', 'origin', 'main');
  try { git('merge', '--no-edit', '-q', 'origin/main'); } catch (_) { /* conflicts: handled below */ }
  const conflicted = git('diff', '--name-only', '--diff-filter=U').split('\n').filter(Boolean);
  const { auto, real } = classify(conflicted);
  if (real.length) {
    git('merge', '--abort');
    console.log(`sync-pr: real conflict in ${real.join(', ')}: the session resolves it`);
    return 1;
  }
  for (const f of auto) {
    if (GENERATED.includes(f) || RULE_COUNTS.includes(f)) git('checkout', '--theirs', f);
    else writeFileSync(f, keepOurs(readFileSync(f, 'utf8')));
  }
  // Regenerated even when git merged them by itself: a clean merge of two index edits can still be wrong
  sh('node', 'tools/agents/decision.mjs', 'index');
  sh('node', 'tools/agents/rules.mjs', 'index');
  sh('node', 'tools/agents/rules.mjs', 'contributing');
  sh('python3', 'tools/release/readme.py', 'update');
  if (auto.includes('docs/facts.json')) sh('python3', 'tools/release/readme.py', 'seal');
  if (conflicted.length) { git('add', '-A'); git('commit', '-q', '--no-edit'); }
  else if (git('status', '--porcelain')) { git('add', '-A'); git('commit', '-q', '-m', 'Generated files regenerated after merging main (sync-pr.mjs, D-580)'); }
  let ahead = '1';
  try { ahead = git('rev-list', '--count', `origin/${branch}..HEAD`); } catch (_) { /* no remote branch yet */ }
  if (ahead === '0') { console.log('sync-pr: already up to date'); return 0; }
  if (push) git('push', '-q', 'origin', `HEAD:${branch}`);
  console.log(`sync-pr: merged main${auto.length ? `, regenerated ${auto.join(', ')}` : ''}${push ? ', pushed' : ' (not pushed)'}`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(sync({ push: !process.argv.includes('--no-push') }));
