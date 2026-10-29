// Has what is about to be published already passed the end-to-end run? (D-308) publish.yml runs
// it before deciding whether to repeat it. From October 2 to 12, in 79 of 96 merged PRs, the tree
// that reached main was identical, file by file, to the one the end-to-end run had already tested
// on the PR: repeating it on main cost ~8 minutes of publishing without testing anything new.
//
// Each e2e.yml run that passes with scripts leaves a mark: an artifact `e2e-tree-<tree>`, with
// the SHA of the tree it tested (on a PR, the test merge with main that GitHub builds). Here:
//   1. if the tree of the commit being published has its mark, from a run of this same repo
//      (not from a fork, which runs its own version of the workflow), it is already tested;
//   2. if not, but the commit only changes what doesn't reach the browser (tools/e2e/changes.mjs)
//      and its parent's tree has a mark, it is too: it inherits the parent's, and leaves its own;
//   3. if not, but the commit is a merge whose PR head passed its own end-to-end run (the
//      `e2e-head-<sha>` mark, D-392), only what is new to that head is retested (D-496, D-506): smoke.mjs plus
//      the scripts affected.mjs selects for the diff against the second parent (the PR head): the
//      commits that reached main after the PR last passed. The first parent retested the PR's whole
//      diff again (#985, 2026-10-29: all 18 groups, 20 minutes);
//   4. otherwise, or if asking fails, it is not tested and the end-to-end run goes whole.
//
//   node tools/e2e/already-tested.mjs        # writes tested, inherited, tree and base in $GITHUB_OUTPUT
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { noBrowser } from './changes.mjs';

export const MARK = tree => `e2e-tree-${tree}`;

/** Is any of these artifacts a valid mark? From this repo and not expired. */
export const validMark = artifacts => artifacts.find(a => !a.expired && a.workflow_run
  && a.workflow_run.head_repository_id === a.workflow_run.repository_id) || null;

/**
 * The decision: `{ tested, inherited, reason }`.
 * @param {object} o
 * @param {object|null} o.mark          the mark of the tree being published
 * @param {object|null} o.parentMark    the one of the parent commit's tree
 * @param {string[]|null} o.changes     what changed since the parent (null if there is no parent)
 * @param {object|null} [o.headMark]    the mark of the merged PR's head, if the commit is a merge
 * @param {string} [o.base]             the merge's second parent (the PR head), the diff the narrowed run tests (D-506)
 */
export function decide({ mark, parentMark, changes, headMark = null, base = '' }) {
  if (mark) return { tested: true, inherited: false, reason: `this same tree passed the end-to-end run in run ${mark.workflow_run.id}` };
  if (changes && noBrowser(changes) && parentMark) return { tested: true, inherited: true, reason: `it only changes what doesn't reach the browser, and its parent passed in run ${parentMark.workflow_run.id}` };
  if (headMark && base) return { tested: false, inherited: false, base, reason: `the merged PR's head passed in run ${headMark.workflow_run.id}: smoke plus the scripts the merge reaches (D-496)` };
  return { tested: false, inherited: false, reason: 'no identical tree passed the end-to-end run: it runs whole' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sh = (...a) => execFileSync(a[0], a.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const repo = process.env.GITHUB_REPOSITORY || 'ellokojavi/juegos-de-salon';
  const output = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };
  let tree = '', r;
  try {
    tree = sh('git', 'rev-parse', 'HEAD^{tree}');
    const markOf = t => validMark(JSON.parse(sh('gh', 'api', `repos/${repo}/actions/artifacts?name=${MARK(t)}&per_page=20`)).artifacts || []);
    let changes = null, parentMark = null, headMark = null, base = '';
    const mark = markOf(tree);
    if (!mark) {
      // A merge commit (`gh pr merge --merge`): its second parent is the PR's head
      try {
        const [, , second] = sh('git', 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ');
        if (second) {
          headMark = validMark(JSON.parse(sh('gh', 'api', `repos/${repo}/actions/artifacts?name=e2e-head-${second}&per_page=20`)).artifacts || []);
          base = second; // D-506: what main brought since the PR head passed
        }
      } catch (_) { headMark = null; }
      try {
        changes = sh('git', 'diff', '--name-only', 'HEAD^1', 'HEAD').split('\n').filter(Boolean);
        if (noBrowser(changes)) parentMark = markOf(sh('git', 'rev-parse', 'HEAD^1^{tree}'));
      } catch (_) { changes = null; } // no parent at hand (a single-commit clone)
    }
    r = decide({ mark, parentMark, changes, headMark, base });
  } catch (e) {
    r = { tested: false, inherited: false, reason: `couldn't ask (${String(e.message).split('\n')[0]}): it runs whole` };
  }
  console.log(`${r.tested ? '✓' : '·'} ${r.reason}`);
  output('tested', r.tested); output('inherited', r.inherited); output('tree', tree); output('base', r.base || '');
}
