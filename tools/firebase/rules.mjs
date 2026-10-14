#!/usr/bin/env node
/**
 * Publishes the Realtime Database rules without going through the console (D-122).
 *
 *   node tools/firebase/rules.mjs check      # are the published rules the repo's?
 *   node tools/firebase/rules.mjs publish    # uploads firebase/database.rules.json and verifies it took
 *
 * It signs in as administrator with the service account key (see tools/firebase/firebase-admin.mjs)
 * and writes `<databaseURL>/.settings/rules.json`, which is the same as the console's Publish button.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { token, fail } from './firebase-admin.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RULES = join(ROOT, 'firebase/database.rules.json');

const url = t => `${firebaseConfig.databaseURL}/.settings/rules.json?access_token=${encodeURIComponent(t)}`;
const normal = text => JSON.stringify(JSON.parse(text));

async function published(t) {
  const res = await fetch(url(t));
  const text = await res.text();
  if (!res.ok) fail(`Could not read the published rules (HTTP ${res.status}): ${text.slice(0, 200)}`);
  return text;
}

const action = process.argv[2];
if (!['check', 'publish'].includes(action)) fail('Usage: node tools/firebase/rules.mjs check | publish', 2);

const local = readFileSync(RULES, 'utf8');
normal(local); // the repo file must be valid JSON before touching anything
const t = await token();
const before = await published(t);
const same = normal(before) === normal(local);

if (action === 'check') {
  console.log(same ? '✓ The published rules are the repo\'s.' : '✗ The published rules are NOT the repo\'s: they still need publishing (node tools/firebase/rules.mjs publish).');
  process.exit(same ? 0 : 1);
}

if (same) { console.log('✓ They were already published: nothing to upload.'); process.exit(0); }
const res = await fetch(url(t), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: local });
if (!res.ok) fail(`Firebase rejected the rules (HTTP ${res.status}): ${(await res.text()).slice(0, 500)}`);
const after = await published(t);
if (normal(after) !== normal(local)) fail('They were uploaded, but reading them back they do not match the repo\'s. Check the console.');
console.log(`✓ Rules published and verified (${firebaseConfig.projectId}).`);
