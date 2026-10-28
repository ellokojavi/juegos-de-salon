// Run: node tools/release/changelog.test.mjs
// The CHANGELOG, one file per PR (D-300): each entry's number comes from the order it reached main,
// and collecting them does not change the version. Builds a test git repo in a temporary folder.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { bump, parseEntry, compute, collect, newEntries, levelBetween, checkPR, arrivalOrder, pending, todayVersion, firstVersion, archive, ROOT } from './changelog.mjs';

// Bump and parse
assert.equal(bump('0.167.3', 'patch'), '0.167.4');
assert.equal(bump('0.167.3', 'minor'), '0.168.0');
assert.equal(bump('0.167.3', 'major'), '1.0.0');
assert.equal(bump('0.167.3', 'menor'), '0.168.0', 'the old Spanish level names still count');
assert.deepEqual(parseEntry('level: minor\n\n- **Something** new.\n'), { level: 'minor', body: '- **Something** new.' });
// Entries written before the switch to English (D-316) are still read, in English
assert.deepEqual(parseEntry('nivel: parche\n\n- **Algo** nuevo.\n'), { level: 'patch', body: '- **Algo** nuevo.' });
assert.deepEqual(parseEntry('nivel: mayor\n\n- x\n').level, 'major');
assert.match(parseEntry('- no level').error, /first line/);
assert.match(parseEntry('level: big\n\n- x').error, /does not exist/);
assert.match(parseEntry('level: patch\n\njust prose').error, /no "- …" line/);
assert.match(parseEntry('level: patch\n\n## 1.2.3 — today\n- x').error, /number/);

// Compute and collect
const CL = '# Changelog\n\n## 0.10.2 — 2026-10-01\n- old\n';
const list = [{ file: 'changelog/a.md', date: '2026-10-02', level: 'patch', body: '- a' }, { file: 'changelog/b.md', date: '2026-10-03', level: 'minor', body: '- b' }, { file: 'changelog/c.md', date: '2026-10-03', level: 'patch', body: '- c' }];
const r = compute(CL, list);
assert.deepEqual(r.entries.map(e => e.version), ['0.10.3', '0.11.0', '0.11.1']);
assert.equal(r.version, '0.11.1');
const collected = collect(CL, r.entries);
assert.equal(collected, '# Changelog\n\n## 0.11.1 — 2026-10-03\n- c\n\n## 0.11.0 — 2026-10-03\n- b\n\n## 0.10.3 — 2026-10-02\n- a\n\n## 0.10.2 — 2026-10-01\n- old\n');
assert.equal(compute(collected, []).version, r.version, 'collecting does not change the version');

// An old entry in CHANGELOG.md (before D-300): it is noticed and can be migrated
const withOld = '# Changelog\n\n## 0.11.0 — 2026-10-04\n- new\n- another line\n\n## 0.10.2 — 2026-10-01\n- old\n';
const added = newEntries(CL, withOld);
assert.deepEqual(added.map(e => [e.version, e.body]), [['0.11.0', '- new\n- another line']]);
assert.equal(withOld.replace(added[0].block, ''), CL, 'migrate leaves the CHANGELOG as it was');
assert.equal(levelBetween('0.10.2', '0.11.0'), 'minor');
assert.equal(levelBetween('0.10.2', '0.10.3'), 'patch');
const pr = (changes, now = CL) => checkPR({ changelogBase: CL, changelogNow: now, changes });
assert.equal(pr([{ status: 'M', file: 'CHANGELOG.md' }], withOld).errors.length, 1, 'a numbered entry in CHANGELOG.md blocks the PR');
assert.deepEqual(pr([{ status: 'M', file: 'CHANGELOG.md' }, { status: 'D', file: 'changelog/a.md' }], withOld).errors, [], 'the PR that collects does write numbers');
assert.equal(pr([{ status: 'M', file: 'public/index.html' }]).warnings.length, 1, 'public/ without an entry: warning');
assert.deepEqual(pr([{ status: 'M', file: 'public/index.html' }, { status: 'A', file: 'changelog/x.md' }]), { errors: [], warnings: [] });
assert.deepEqual(pr([{ status: 'M', file: 'tools/agents/processes.mjs' }]), { errors: [], warnings: [] }, 'without public/, no warning');

// The order is the order of arrival to main, not by name or by creation
const dir = mkdtempSync(join(tmpdir(), 'changelog-'));
try {
  const g = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const write = (f, t) => { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), t); };
  g('init', '-q', '-b', 'main');
  write('CHANGELOG.md', CL); g('add', '.'); g('commit', '-qm', 'base');
  // Two branches: "zeta" is created first but gets in second; "alfa", minor, gets in first
  g('checkout', '-qb', 'zeta'); write('changelog/zeta.md', 'level: patch\n\n- zeta\n'); g('add', '.'); g('commit', '-qm', 'zeta');
  g('checkout', '-q', 'main'); g('checkout', '-qb', 'alfa'); write('changelog/alfa.md', 'nivel: menor\n\n- alfa\n'); g('add', '.'); g('commit', '-qm', 'alfa');
  g('checkout', '-q', 'main');
  g('merge', '-q', '--no-ff', '-m', 'Merge alfa', 'zeta'); // zeta first
  g('merge', '-q', '--no-ff', '-m', 'Merge alfa', 'alfa'); // alfa after
  assert.deepEqual(arrivalOrder(dir).map(e => e.file), ['changelog/zeta.md', 'changelog/alfa.md']);
  assert.deepEqual(compute(CL, pending(dir)).entries.map(e => e.version), ['0.10.3', '0.11.0']);
  assert.equal(todayVersion(dir), '0.11.0');
  // One without a commit goes last
  write('changelog/aaa.md', 'level: patch\n\n- aaa\n');
  assert.deepEqual(arrivalOrder(dir).map(e => e.file), ['changelog/zeta.md', 'changelog/alfa.md', 'changelog/aaa.md']);
  unlinkSync(join(dir, 'changelog/aaa.md'));
  // Collect on a branch while another gets into main: the published version never goes back
  const before = todayVersion(dir);
  g('checkout', '-qb', 'collect');
  const { entries } = compute(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8'), pending(dir));
  writeFileSync(join(dir, 'CHANGELOG.md'), collect(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8'), entries));
  for (const e of entries) unlinkSync(join(dir, e.file));
  g('add', '-A'); g('commit', '-qm', 'collect');
  g('checkout', '-q', 'main'); g('checkout', '-qb', 'late'); write('changelog/late.md', 'level: patch\n\n- late\n'); g('add', '.'); g('commit', '-qm', 'late');
  g('checkout', '-q', 'main'); g('merge', '-q', '--no-ff', '-m', 'Merge late', 'late');
  const withLate = todayVersion(dir);
  assert.equal(withLate, bump(before, 'patch'));
  g('merge', '-q', '--no-ff', '-m', 'Merge collect', 'collect');
  assert.equal(todayVersion(dir), withLate, 'merging what was collected does not change the published version');
  assert.equal(firstVersion(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8')), before);
} finally { rmSync(dir, { recursive: true, force: true }); }

// The repo's entries can be understood
for (const e of pending(ROOT)) assert.ok(!e.error, `${e.file}: ${e.error}`);
console.log(`changelog: green · today's version ${todayVersion()}`);

// Archive by month (D-497): CHANGELOG.md keeps the newest entry's month, older months leave it
{
  const { kept, months } = archive('# Changelog\n\n## 0.3.0 — 2026-11-01\n- c\n\n## 0.2.0 — 2026-10-31\n- b\n\n## 0.1.0 — 2026-09-30\n- a\n');
  assert.equal(kept, '# Changelog\n\n## 0.3.0 — 2026-11-01\n- c\n');
  assert.deepEqual(Object.keys(months).sort(), ['2026-09', '2026-10']);
  assert.equal(months['2026-10'], '## 0.2.0 — 2026-10-31\n- b\n\n');
  assert.equal(firstVersion(kept), '0.3.0');
  assert.deepEqual(archive('# Changelog\n\n## 0.1.0 — 2026-10-01\n- a\n').months, {});
}
