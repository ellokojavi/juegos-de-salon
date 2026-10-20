// The checks and the memory of the documentation agent (D-172).
// Usage: node tools/agents/document.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { readAll, readTopics, allText, parse } from './decision.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writtenDecisions, citedDecisions, notMentioned, changelogHas, versionOf, newMemory, recordRound, split, range,
  repeatedRequirements, repeatedUsabilityRules, entries, readStatus, amendedBy, statusProblems, fileProblems, citedPaths, MEMORY,
} from './document.mjs';

let n = 0;
const test = (name, fn) => { fn(); n++; };

test('the written decisions and the repeated ones', () => {
  const { written, repeated } = writtenDecisions('## D-1 · a\ntexto D-9\n## D-2 · b\n## D-2 · c\n### D-3 no es título');
  assert.deepEqual([...written], [1, 2]);
  assert.deepEqual(repeated, [2]);
});

test('the decisions missing between D-1 and the highest, and those out of order', () => {
  const r = writtenDecisions('## D-01 · a\n## D-02 · b\n## D-05 · c\n## D-04 · d\n## D-06 · e');
  assert.deepEqual(r.gaps, [3]);
  assert.deepEqual(r.outOfOrder, [[4, 5]]);
  assert.deepEqual(writtenDecisions('## D-1 · a\n## D-2 · (número sin usar)\n## D-3 · c').gaps, [], 'an unused number is not a gap');
  assert.deepEqual(writtenDecisions('## D-1 · a\n## D-2 · b\n## D-2 · c').outOfOrder, [], 'a repeated one counts as repeated, not as out of order');
});

test('the repeated IDs of REQUERIMIENTOS and USABILIDAD', () => {
  const req = '| ID | Requerimiento |\n|---|---|\n| RP-01 | a |\n| RP-02 | b, como RP-01 |\n| RP-01 | c |\n| CR-01 | d |';
  assert.deepEqual(repeatedRequirements(req), ['RP-01'], 'citing an ID in another column does not repeat it');
  const usa = '- **U-1 · Frases.** ver U-2 · nada\n- **U-2 · Emojis**\n- **U-1 · Otra vez**';
  assert.deepEqual(repeatedUsabilityRules(usa), ['U-1']);
});

const DECISIONS = [
  '## D-01 · Uno', '**Fecha:** x · **Estado:** corregida por D-03, D-04', '**Decisión:** a',
  '## D-02 · Dos', '**Fecha:** x · **Estado:** reemplazada por D-04', '**Relación:** la cambió D-04',
  '## D-03 · Tres', '**Fecha:** x · **Estado:** vigente · **Relación:** corrige D-01 (el alto) y ajusta D-02',
  '## D-04 · Cuatro', '**Fecha:** x · **Estado:** vigente', '**Relación:** reemplaza el mapa de D-02; D-09 cambia lo demás; cambia D-01',
  '## D-05 · (número sin usar)', 'Este número no se usó.',
].join('\n');

test('each decision with its Status and its Relation, on the same line or apart', () => {
  const e = entries(DECISIONS);
  assert.deepEqual(e.map(x => x.n), [1, 2, 3, 4, 5]);
  assert.equal(e[0].status, 'corregida por D-03, D-04');
  assert.equal(e[0].relation, null);
  assert.equal(e[2].status, 'vigente');
  assert.equal(e[2].relation, 'corrige D-01 (el alto) y ajusta D-02');
  assert.equal(e[1].relation, 'la cambió D-04');
  assert.ok(e[4].unused);
  assert.ok(entries('## D-7 · (unused number)')[0].unused, 'also in English');
});

test('the Status is one of the four (Spanish)', () => {
  assert.deepEqual(readStatus('vigente'), { type: 'current', by: [] });
  assert.deepEqual(readStatus('derogada'), { type: 'revoked', by: [] });
  assert.deepEqual(readStatus('corregida por D-66, D-77'), { type: 'amended', by: [66, 77] });
  assert.deepEqual(readStatus('reemplazada por D-213'), { type: 'replaced', by: [213] });
  for (const bad of ['vigente (en parte)', 'corregida', 'corregida por D-66 y D-77', 'superada por D-5', 'Vigente', null]) assert.equal(readStatus(bad), null, String(bad));
});

test('the Status also reads in English (D-316)', () => {
  assert.deepEqual(readStatus('current'), { type: 'current', by: [] });
  assert.deepEqual(readStatus('revoked'), { type: 'revoked', by: [] });
  assert.deepEqual(readStatus('amended by D-66, D-77'), { type: 'amended', by: [66, 77] });
  assert.deepEqual(readStatus('replaced by D-213'), { type: 'replaced', by: [213] });
  for (const bad of ['amended por D-5', 'corregida by D-5', 'Current', 'superseded by D-5']) assert.equal(readStatus(bad), null, bad);
  const mixed = [
    '## D-01 · Uno', '**Fecha:** x · **Estado:** reemplazada por D-02', '',
    '## D-02 · Two', '**Date:** x · **Status:** current · **Relation:** replaces D-01; amends D-03', '',
    '## D-03 · Three', '**Date:** x · **Status:** current', '',
  ].join('\n');
  assert.deepEqual(entries(mixed)[1].relation, 'replaces D-01; amends D-03');
  assert.deepEqual(amendedBy('replaces D-01; amends D-03 and extends D-04'), [1, 3]);
  assert.deepEqual(statusProblems(mixed), ['D-2 changes, amends or replaces D-3, and the Status of D-3 does not name it ("current")']);
});

test('what a Relation changes, amends or replaces', () => {
  assert.deepEqual(amendedBy('corrige D-53 y D-59'), [53, 59]);
  assert.deepEqual(amendedBy('corrige D-75 (el alto) y ajusta D-76'), [75], 'what it adjusts does not count');
  assert.deepEqual(amendedBy('corrige D-47, D-48 y D-74'), [47, 48, 74]);
  assert.deepEqual(amendedBy('reemplaza el solitario de D-27 y D-129; D-149 quita el filtro'), [27, 129], 'D-149 is the one that removes');
  assert.deepEqual(amendedBy('D-176 cambia la invitación'), [], 'there another one changes it');
  assert.deepEqual(amendedBy('cierra el paso de D-191; corrige D-47; completa D-189'), [47]);
  assert.deepEqual(amendedBy('amplía D-72; desde D-205 frena el check'), []);
  assert.deepEqual(amendedBy(null), []);
});

test('a Status outside the four, one citing what does not exist and an unmarked amendment', () => {
  assert.deepEqual(statusProblems(DECISIONS), [], 'the example is in order');
  const bad = DECISIONS
    .replace('**Estado:** reemplazada por D-04', '**Estado:** superada')
    .replace('corregida por D-03, D-04', 'corregida por D-03, D-08')
    .replace('**Fecha:** x · **Estado:** vigente\n', '**Fecha:** x\n');
  assert.deepEqual(statusProblems(bad), [
    'D-1 is amended by D-8, which does not exist',
    'D-2 has a Status that is not one of the four: "superada"',
    'D-4 has no **Status:** in docs/decisions/D-4.md',
    'D-4 changes, amends or replaces D-2, and the Status of D-2 does not name it ("superada")',
    'D-4 changes, amends or replaces D-1, and the Status of D-1 does not name it ("corregida por D-03, D-08")',
  ]);
  const unmarked = DECISIONS.replace('reemplazada por D-04', 'vigente');
  assert.deepEqual(statusProblems(unmarked), ['D-4 changes, amends or replaces D-2, and the Status of D-2 does not name it ("vigente")']);
  assert.deepEqual(statusProblems(DECISIONS.replace('corregida por D-03, D-04', 'corregida por D-05')), [
    'D-1 is amended by D-5, which does not exist',
    'D-3 changes, amends or replaces D-1, and the Status of D-1 does not name it ("corregida por D-05")',
    'D-4 changes, amends or replaces D-1, and the Status of D-1 does not name it ("corregida por D-05")',
  ], 'an unused number amends nothing');
});

test('the cited paths, without templates, phrases or code blocks', () => {
  const text = [
    'Ver `public/hangman/engine.js:120`, `docs/CANONES.md#c-8` y `tools/e2e/`.',
    'Moldes: `docs/games/<carpeta>.md`, `public/minijuegos/…`, `tools/e2e/*.mjs`, `public/{a,b}/`.',
    'No son rutas: `public/ es el sitio`, `assets/js/i18n.js`, `node tools/e2e/ci.mjs`, `/cup/?x=1`.',
    'Con consulta: `public/cup/?practica=zip`.',
    '```bash', 'node `tools/no/existe.mjs`', '```',
  ].join('\n');
  assert.deepEqual(citedPaths(text), ['public/hangman/engine.js', 'docs/CANONES.md', 'tools/e2e/', 'public/cup/']);
});

test('the cited decisions, without confusing other acronyms', () => {
  assert.deepEqual([...citedDecisions('ver D-12 y (D-170), no LIG-32 ni C-3 ni ID-5x')].sort(), [12, 170]);
});

test('the scripts its README does not mention, with or without the folder', () => {
  assert.deepEqual(notMentioned(['tools/e2e/cup/tournament.mjs', 'tools/e2e/hangman/new.mjs'], 'cup/tournament.mjs'), ['tools/e2e/hangman/new.mjs']);
  // tools/e2e/README.md names the scripts without the folder
  assert.deepEqual(notMentioned(['tools/e2e/cup/tournament.mjs'], '`node tools/e2e/cup/tournament.mjs <out>`'), []);
  assert.deepEqual(notMentioned(['tools/e2e/cup/tournament.mjs'], 'the script cup/tournament.mjs'), []);
});

test('the stamped version and its CHANGELOG entry', () => {
  assert.equal(versionOf('<script src="a.js?v=0.81.0">'), '0.81.0');
  assert.equal(versionOf('<p>no version</p>'), null);
  assert.ok(changelogHas('# Changelog\n\n## 0.81.0 — 2026-10-01\n', '0.81.0'));
  assert.ok(!changelogHas('## 0.81.10 — x', '0.81.1'), 'a version does not match another that starts the same');
  assert.ok(!changelogHas('## 0x81y0', '0.81.0'), 'the dots are dots');
});

test('recording a round advances the memory and replaces what is pending', () => {
  let m = newMemory();
  m = recordRound(m, { date: '2026-10-02', from: null, to: 'aaa', pr: 'https://x/1', pending: ['online screenshots'] });
  assert.equal(m.checkedUpTo, 'aaa');
  assert.deepEqual(m.pending, ['online screenshots']);
  m = recordRound(m, { date: '2026-10-03', from: 'aaa', to: 'bbb', pr: null });
  assert.equal(m.checkedUpTo, 'bbb');
  assert.deepEqual(m.pending, [], 'what is not recorded again is no longer pending');
  assert.deepEqual(m.rounds.map(r => r.to), ['aaa', 'bbb']);
  assert.deepEqual(m.known, [], 'recording does not touch the known ones');
});

test('what is already known does not count as new', () => {
  const r = split(['D-73 is twice', 'version 1.0.0 is missing'], ['D-73 is twice']);
  assert.deepEqual(r.fresh, ['version 1.0.0 is missing']);
  assert.deepEqual(r.old, ['D-73 is twice']);
});

test('the memory keeps the last 60 rounds', () => {
  let m = newMemory();
  for (let i = 0; i < 70; i++) m = recordRound(m, { date: String(i), from: null, to: String(i) });
  assert.equal(m.rounds.length, 60);
  assert.equal(m.rounds[0].to, '10');
});

test('recording the same round twice completes it, it does not duplicate it', () => {
  let m = recordRound(newMemory(), { date: '2026-10-02', from: null, to: 'aaa', pending: ['online screenshots'] });
  m = recordRound(m, { date: '2026-10-02', from: 'aaa', to: 'aaa', pr: 'https://x/7' });
  assert.equal(m.rounds.length, 1);
  assert.equal(m.rounds[0].pr, 'https://x/7');
  assert.equal(m.rounds[0].from, null, 'the round keeps where it started from');
  assert.deepEqual(m.pending, ['online screenshots'], 'adding the link does not erase what is pending');
  assert.deepEqual(m.rounds[0].pending, ['online screenshots']);
});

test('a round looks at main from the memory; a PR, its branch from the base', () => {
  const memory = { checkedUpTo: 'r0' };
  assert.deepEqual(range({ from: null, memory, main: 'm1', head: 'h1' }), { start: 'r0', tip: 'm1', where: 'main' });
  assert.deepEqual(range({ from: 'origin/main', memory, main: 'm1', head: 'h1' }), { start: 'origin/main', tip: 'h1', where: 'this branch' });
});

test("the repo's memory has the keys the tool reads (English since D-316)", () => {
  const m = JSON.parse(readFileSync(MEMORY, 'utf8'));
  for (const k of ['checkedUpTo', 'pending', 'known', 'rounds']) assert.ok(k in m, `docs/documentation.json without "${k}"`);
  for (const r of m.rounds) assert.ok('date' in r && 'to' in r, `round without date or to: ${JSON.stringify(r).slice(0, 80)}`);
});

// In the real repo, not in examples (D-394): each decision in its own file, named after its
// heading, with English labels and known topics, its Statuses consistent, and the index up to date.
test("the repo's docs/decisions/: files, statuses and the index", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
  assert.ok(!existsSync(join(root, 'docs/DECISIONES.md')), 'docs/DECISIONES.md is back (a branch from before D-394): node tools/agents/decision.mjs split');
  const index = existsSync(join(root, 'docs/DECISIONS.md')) ? readFileSync(join(root, 'docs/DECISIONS.md'), 'utf8') : '';
  assert.deepEqual(fileProblems(readAll(root), readTopics(root), index), []);
  assert.deepEqual(statusProblems(allText(root)), []);
  assert.deepEqual(writtenDecisions(allText(root)).repeated, []);
});

test('a decision file named after another number, with an old label or an unknown topic', () => {
  const d = parse('## D-5 · x\n**Fecha:** 2026-01-01 · **Status:** current · **Topics:** nope\nText');
  const p = fileProblems([{ file: 'D-6.md', ...d }], [{ key: 'tests', name: 'Tests', rule: 'C-12' }], 'stale');
  assert.equal(p.length, 4, p.join('\n'));
});

console.log(`document: ${n} cases green`);
