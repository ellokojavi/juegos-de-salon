// What a PR's push must test (D-392): only what changed since its last commit that passed the
// end-to-end check, not the whole PR again. A PR is pushed several times (a fix, the agents'
// commits, a merge of main); before, each push ran the scope of the whole PR, so a one-line fix to
// a test or a changelog entry ran the same 76 jobs as the first push.
//
// Each e2e.yml run on a PR that passes leaves a mark: an artifact `e2e-head-<sha>`, with the PR's
// head commit it tested. Here, for the push being tested:
//   1. the PR's commits, newest first: the first one before the head with a valid mark is the last
//      that passed;
//   2. the files changed from that commit to the head (GitHub's compare, which counts what a merge
//      of main brought in) are what this push tests;
//   3. no commit passed, history was rewritten (a force push), the compare fails or is too long:
//      the PR's files, as before.
// What main changed without the PR merging it is not retested here: main passed it, and publish.yml
// runs the whole suite on what it publishes unless that exact tree passed (D-302, D-308).
//
//   node tools/e2e/since-passed.mjs --pr <n> --head <sha> > changes   # also writes `since` to $GITHUB_OUTPUT
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validMark } from './already-tested.mjs';

export const HEAD_MARK = sha => `e2e-head-${sha}`;
// GitHub's compare lists at most 300 files: past that, the PR's own list is safer
export const COMPARE_LIMIT = 300;

/**
 * The commit to test from, or null for the whole PR.
 * @param {string[]} commits  the PR's commits, oldest first (GitHub's order)
 * @param {string} head       the commit being tested
 * @param {(sha: string) => boolean} passed  whether that commit has a valid mark
 */
export function lastPassed(commits, head, passed) {
  const i = commits.indexOf(head);
  if (i < 0) return null; // the head is not among the PR's commits: something is off, test it all
  for (let j = i - 1; j >= 0; j--) if (passed(commits[j])) return commits[j];
  return null;
}

/** The files to test: those since `since`, or the PR's when there is no `since` or the compare can't be trusted. */
export function filesToTest({ since, compared, prFiles }) {
  if (!since || !compared || compared.length >= COMPARE_LIMIT) return { files: prFiles, since: null };
  return { files: compared, since };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const pr = arg('--pr'), head = arg('--head');
  const repo = process.env.GITHUB_REPOSITORY;
  const gh = (...a) => execFileSync('gh', ['api', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const lines = s => s.split('\n').filter(Boolean);
  const prFiles = lines(gh(`repos/${repo}/pulls/${pr}/files`, '--paginate', '--jq', '.[].filename'));
  let result = { files: prFiles, since: null };
  try {
    const commits = lines(gh(`repos/${repo}/pulls/${pr}/commits`, '--paginate', '--jq', '.[].sha'));
    const passed = sha => !!validMark(JSON.parse(gh(`repos/${repo}/actions/artifacts?name=${HEAD_MARK(sha)}`)).artifacts || []);
    const since = lastPassed(commits, head, passed);
    const compared = since ? lines(gh(`repos/${repo}/compare/${since}...${head}`, '--jq', '.files[].filename')) : null;
    result = filesToTest({ since, compared, prFiles });
  } catch (e) {
    console.error(`since-passed: ${e.message.split('\n')[0]}; testing the whole PR`);
  }
  console.error(result.since
    ? `since-passed: ${result.files.length} file(s) changed since ${result.since.slice(0, 7)}, the last commit of this PR that passed`
    : `since-passed: no earlier commit of this PR passed: the whole PR (${result.files.length} file(s))`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `since=${result.since || ''}\n`);
  process.stdout.write(result.files.join('\n') + (result.files.length ? '\n' : ''));
}
