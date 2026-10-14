/**
 * The lab keys (D-281, D-284). Each person who enters /labs/ has their key and their link; in
 * public/assets/js/labs-puerta.js only each key's fingerprint is kept, with a label.
 *
 *   node tools/agents/labs-key.mjs new <label>      creates a key and shows its link (only once)
 *   node tools/agents/labs-key.mjs remove <label>   takes that person out; the others keep entering
 *   node tools/agents/labs-key.mjs list             who has a key
 *
 * The key is not saved anywhere: it is shown once and whoever receives it keeps it. If it is lost,
 * it is removed and another is created. The label is public (the repo is): initials or a nickname.
 * The change to labs-puerta.js goes in with a PR, and the key opens only when the site is published.
 * The block it edits in labs-puerta.js is `var HUELLAS = { 'label': 'fingerprint', … };`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DOOR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'js', 'labs-puerta.js');
export const SITE = 'https://juegosdesalon.cl';

const BLOCK = /( *)var HUELLAS = \{\n([\s\S]*?)\n?\1\};/;
const LINE = /^ *'([^']+)': '([0-9a-f]{64})',$/;
const LABEL = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,23}$/u;

/** The keys the door accepts: [{ label, fingerprint }]. Pure: tested without disk. */
export function readKeys(source) {
  const m = source.match(BLOCK);
  if (!m) throw new Error('labs-puerta.js does not have the `var HUELLAS = { … };` block');
  return m[2].split('\n').filter(l => l.trim()).map(l => {
    const x = l.match(LINE);
    if (!x) throw new Error(`line in HUELLAS I do not understand: ${l.trim()}`);
    return { label: x[1], fingerprint: x[2] };
  });
}

function write(source, keys) {
  return source.replace(BLOCK, (_, indent) =>
    `${indent}var HUELLAS = {\n${keys.map(k => `${indent}  '${k.label}': '${k.fingerprint}',`).join('\n')}\n${indent}};`);
}

export const fingerprint = key => createHash('sha256').update(key).digest('hex');

/** A random key: 20 lowercase letters and digits, easy to copy and without case ambiguity.
 *  With a label, the key starts with it (`ratoncito-…`), so each person recognizes their link. */
export function newKey(label = '') {
  const A = 'abcdefghijkmnpqrstuvwxyz23456789';
  const random = Array.from({ length: 20 }, () => A[randomInt(A.length)]).join('');
  const prefix = label.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '_');
  return prefix ? `${prefix}-${random}` : random;
}

export function add(source, label, key) {
  if (!LABEL.test(label)) throw new Error(`invalid label: "${label}" (letters, digits, space, . _ -; up to 24)`);
  const keys = readKeys(source);
  const existing = keys.find(k => k.label.toLowerCase() === label.toLowerCase());
  if (existing) throw new Error(`"${existing.label}" already has a key: remove it before giving them another`);
  return write(source, [...keys, { label, fingerprint: fingerprint(key) }]);
}

export function remove(source, label) {
  const keys = readKeys(source);
  const left = keys.filter(k => k.label.toLowerCase() !== label.toLowerCase());
  if (left.length === keys.length) throw new Error(`"${label}" has no key (list says who does)`);
  if (!left.length) throw new Error('it is the last key: without any, nobody enters the lab');
  return write(source, left);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  const label = rest.join(' ').trim();
  const source = readFileSync(DOOR, 'utf8');
  try {
    if (cmd === 'list') {
      for (const k of readKeys(source)) console.log(`${k.label.padEnd(24)} ${k.fingerprint.slice(0, 12)}…`);
    } else if (cmd === 'new' && label) {
      const key = newKey(label);
      writeFileSync(DOOR, add(source, label, key));
      console.log(`Key for ${label}. It is shown only this time: copy it now.\n`);
      console.log(`  ${SITE}/labs/?key=${key}\n`);
      console.log('The link opens only when the change to public/assets/js/labs-puerta.js goes in with a PR and the site is published.');
    } else if (cmd === 'remove' && label) {
      const name = readKeys(source).find(k => k.label.toLowerCase() === label.toLowerCase())?.label ?? label;
      writeFileSync(DOOR, remove(source, label));
      console.log(`Key of ${name} removed. It stops entering when the change to public/assets/js/labs-puerta.js goes in with a PR and the site is published.`);
    } else {
      console.log('Usage: node tools/agents/labs-key.mjs new <label> | remove <label> | list');
      process.exit(cmd ? 1 : 0);
    }
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
