// Repo weight guard (D-494, #856): no blob over 5 MB and no Chrome profile enters git.
// Checks the tracked files and, when origin/main is there (the `tests` check fetches the whole
// history), every blob the branch's own commits add, so a file added and deleted in the same PR
// still fails: it would stay in history forever. The files already over the limit are listed in
// GRANDFATHERED until docs/REPO-WEIGHT.md moves them out; that list may only shrink.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const LIMIT = 5 * 1024 * 1024;
const GRANDFATHERED = new Set([]);
// Marketing videos go to GitHub Releases whatever their size (tools/release/video-release.mjs).
const VIDEO = /^marketing\/.*\.(mp4|mov|webm)$/;
// A Chrome profile left by a test (c77d0836 committed one with a 37 MB model.tflite).
const PROFILE = /(^|\/)(Default|Crash Reports|ShaderCache|GrShaderCache|optimization_guide_model_store)\/|(^|\/)(Local State|First Run)$|\.tflite$/;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
const errors = [];

for (const path of git('ls-files', '-z').split('\0').filter(Boolean)) {
  if (PROFILE.test(path)) errors.push(`${path}: looks like a Chrome profile file`);
  let size = 0;
  try { size = statSync(path).size; } catch { continue; }
  if (size > LIMIT && !GRANDFATHERED.has(path)) errors.push(`${path}: ${mb(size)} (limit ${mb(LIMIT)})`);
}

let base = null;
try { base = git('merge-base', 'origin/main', 'HEAD').trim(); } catch {}
if (base) {
  // Each path a branch commit adds or modifies, with the blob it wrote.
  const log = git('log', '--no-renames', '--no-abbrev', '--raw', '--format=', '--diff-filter=AM', `${base}..HEAD`);
  const blobs = new Map();
  for (const line of log.split('\n')) {
    const m = line.match(/^:\d+ \d+ [0-9a-f]+ ([0-9a-f]+) [AM]\t(.+)$/);
    if (m) blobs.set(m[1], m[2]);
  }
  if (blobs.size) {
    const sizes = execFileSync('git', ['cat-file', '--batch-check=%(objectname) %(objectsize)'],
      { input: [...blobs.keys()].join('\n') + '\n', encoding: 'utf8', maxBuffer: 1 << 28 });
    for (const line of sizes.trim().split('\n')) {
      const [sha, size] = line.split(' ');
      const path = blobs.get(sha);
      if (PROFILE.test(path)) errors.push(`${path} (in a branch commit): looks like a Chrome profile file`);
      else if (VIDEO.test(path)) errors.push(`${path} (in a branch commit): a marketing video, publish it with tools/release/video-release.mjs`);
      else if (Number(size) > LIMIT && !GRANDFATHERED.has(path)) errors.push(`${path} (in a branch commit): ${mb(Number(size))}`);
    }
  }
}

for (const path of GRANDFATHERED) {
  try { if (statSync(path).size <= LIMIT) errors.push(`${path} is under the limit now: take it out of GRANDFATHERED`); }
  catch { errors.push(`${path} left the repo: take it out of GRANDFATHERED`); }
}

if (errors.length) {
  console.error('✗ Repo weight (D-494): host big files outside git (docs/REPO-WEIGHT.md).\n  ' + errors.join('\n  '));
  console.error('  A blob added and deleted in the same branch still needs the commit rewritten before the PR merges.');
  process.exit(1);
}
console.log(`✓ Repo weight: no file over ${mb(LIMIT)} beyond the ${GRANDFATHERED.size} grandfathered, no Chrome profile`);
