// Run: node tools/agents/decision.test.mjs
// Decisions, one file each (D-394): reading and writing a file, the old file split into files with
// its text word for word, and the index built from them. And the numbers to reserve (D-301).
import assert from 'node:assert/strict';
import { numbers, nextFree, fileOf, numberOf, parse, format, englishMeta, splitLegacy, buildIndex, kind, topicsOf } from './decision.mjs';

assert.deepEqual(numbers('## D-01 · a\n## D-12 · b\n### D-5 no\n'), [1, 12]);
assert.equal(nextFree([1, 296], [298, 297], [299]), 300);
assert.equal(nextFree([], []), 1);
assert.equal(fileOf(7), 'D-7.md');
assert.equal(numberOf('D-07.md'), 7);
assert.equal(numberOf('topics.json'), null);

// A file read and written back is the same
const one = '## D-5 · A title\n**Date:** 2026-01-01 · **Status:** amended by D-9 · **Relation:** extends D-2 · **Topics:** tests, cup\n**Decision:** x.\n\n**Why:** y.\n';
const d = parse(one);
assert.equal(d.n, 5);
assert.equal(d.meta.get('Status'), 'amended by D-9');
assert.deepEqual(topicsOf(d), ['tests', 'cup']);
assert.equal(kind(d), 'amended');
assert.equal(format(d), one);
assert.equal(kind(parse('## D-6 · (unused number)\nNot used.')), 'unused');

// The old labels and Statuses go to English; the Relation's prose stays
const m = englishMeta(new Map([['Fecha', '2026-01-01'], ['Estado', 'corregida por D-9, D-12'], ['Relación', 'amplía D-2']]));
assert.deepEqual([...m], [['Date', '2026-01-01'], ['Status', 'amended by D-9, D-12'], ['Relation', 'amplía D-2']]);
assert.equal(englishMeta(new Map([['Estado', 'reemplazada por D-3']])).get('Status'), 'replaced by D-3');
assert.equal(englishMeta(new Map([['Estado', 'vigente']])).get('Status'), 'current');

// The old file split: the text word for word (links one folder deeper), topics from the old index's rows
const TOPICS = [{ key: 'tests', name: 'Tests', rule: 'C-12', es: 'Pruebas' }, { key: 'cup', name: 'La Copa', rule: '`docs/games/cup.md`', es: 'La Copa' }];
const LEGACY = '# Decisiones\n\n| Tema | Regla | D |\n|---|---|---|\n| Pruebas | C-12 | D-01, D-2 |\n| La Copa | x | D-2 |\n\n---\n\n'
  + '## D-01 · Uno\n**Fecha:** 2026-01-01 · **Estado:** vigente\n**Decisión:** ver [CANONES.md](CANONES.md) y [web](https://x.cl).\n\n---\n\n'
  + '## D-2 · Dos\n**Fecha:** 2026-01-02 · **Estado:** derogada\nTexto.\n\n'
  + '## D-3 · (número sin usar)\nNo se usó.\n';
const { files } = splitLegacy(LEGACY, TOPICS, { 1: 'One' });
assert.deepEqual([...files.keys()], ['D-1.md', 'D-2.md', 'D-3.md']);
assert.equal(files.get('D-1.md'), '## D-1 · One\n**Date:** 2026-01-01 · **Status:** current · **Topics:** tests\n**Decisión:** ver [CANONES.md](../CANONES.md) y [web](https://x.cl).\n');
assert.equal(files.get('D-2.md'), '## D-2 · Dos\n**Date:** 2026-01-02 · **Status:** revoked · **Topics:** tests, cup\nTexto.\n');
assert.equal(files.get('D-3.md'), '## D-3 · (número sin usar)\nNo se usó.\n');
assert.throws(() => splitLegacy('| Otro | x | D-1 |\n## D-1 · a\n**Estado:** vigente\n', TOPICS), /not in/);

// The index: by topic, in force, no longer in force, unused
const all = [...files.values()].map(parse);
const index = buildIndex(all, TOPICS);
assert.match(index, /^\| Tests \| C-12 \| D-1, D-2 \|$/m);
assert.match(index, /## In force \(1\)\n\n\| D \| Title \| Status \|\n\|---\|---\|---\|\n\| \[D-1\]\(decisions\/D-1\.md\) \| One \| current \|/);
assert.match(index, /## No longer in force \(1\)[\s\S]*\[D-2\]\(decisions\/D-2\.md\) \| Dos \| revoked \|/);
assert.match(index, /Numbers never used: D-3\./);
assert.match(buildIndex([parse('## D-4 · a | b\n**Status:** current')], TOPICS), /\| a \\\| b \|/);

console.log('decision: files, split, index and numbers green');
