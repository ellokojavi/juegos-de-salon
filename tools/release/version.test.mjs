// Run: node tools/release/version.test.mjs
// The version comes from the CHANGELOG and the entries in changelog/ (D-205, D-300), not from the pages.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { versionOf, todayVersion, outOfOrder, ROOT } from './version.mjs';
import { join } from 'node:path';

assert.equal(versionOf('# Changelog\n\n## 0.98.1 — 2026-10-04\n- something\n\n## 0.98.0 — 2026-10-04\n'), '0.98.1');
assert.equal(versionOf('# Changelog\n\nText that names 1.2.3 before the entries\n## 2.0.0 — today'), '2.0.0');
assert.equal(versionOf('# Changelog\n\n### 9.9.9 is not an entry'), null);
assert.match(versionOf(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')) || '', /^\d+\.\d+\.\d+$/, 'the repo CHANGELOG must start with an X.Y.Z entry');
assert.match(todayVersion(), /^\d+\.\d+\.\d+$/);
// A new entry goes on top with a higher version: otherwise the site is published with a version
// going backwards (0.148.6 over 0.153.0 happened on 2026-10-11, with two PRs merged at once).
assert.deepEqual(outOfOrder('## 0.153.1 — x\n## 0.153.0 — x\n## 0.98.10 — x\n## 0.98.9 — x'), []);
assert.deepEqual(outOfOrder('## 0.148.6 — x\n## 0.153.0 — x'), [['0.148.6', '0.153.0']]);
assert.deepEqual(outOfOrder(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')), [], 'the CHANGELOG must go from the newest version to the oldest: the top one is the one published');
console.log(`version: ${todayVersion()} · green`);
