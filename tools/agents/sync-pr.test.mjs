import assert from 'node:assert/strict';
import { onlyInBlocks, keepOurs, classify } from './sync-pr.mjs';

const conflict = '<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> origin/main\n';
const inBlock = `prose\n<!-- generated: tests -->\n${conflict}<!-- /generated -->\nmore\n`;
const inProse = `prose\n${conflict}<!-- generated: tests -->\nx\n<!-- /generated -->\n`;

assert.equal(onlyInBlocks(inBlock), true, 'a conflict inside a generated block is not real');
assert.equal(onlyInBlocks(inProse), false, 'a conflict in prose is real');
assert.equal(keepOurs(inBlock), 'prose\n<!-- generated: tests -->\nours\n<!-- /generated -->\nmore\n');

const files = { 'README.md': inBlock, 'CONTRIBUTING.md': conflict };
assert.deepEqual(classify(['docs/DECISIONS.md', 'docs/facts.json', 'README.md'], f => files[f]), { auto: ['docs/DECISIONS.md', 'docs/facts.json', 'README.md'], real: [] });
assert.deepEqual(classify(['docs/DECISIONS.md', 'CONTRIBUTING.md'], f => files[f]), { auto: ['docs/DECISIONS.md'], real: ['CONTRIBUTING.md'] });
assert.deepEqual(classify(['README.md'], () => inProse), { auto: [], real: ['README.md'] });
const counts = '<<<<<<< HEAD\n72 rules: 42 checked\n=======\n73 rules: 43 checked\n>>>>>>> origin/main\n';
assert.deepEqual(classify(['docs/RULES.md'], () => counts), { auto: ['docs/RULES.md'], real: [] }, 'rule counts are generated');
assert.deepEqual(classify(['docs/RULES.md'], () => conflict), { auto: [], real: ['docs/RULES.md'] }, 'a rule text conflict is real');
console.log('✓ sync-pr: generated conflicts resolve themselves, real ones are left to the session');
