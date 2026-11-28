// sameTree: an e2e script refuses a SITE that serves another worktree (pattern stale-port-server)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sameTree, isLocal } from './same-tree.mjs';

const tree = text => {
  const root = mkdtempSync(join(tmpdir(), 'same-tree-')) + '/';
  mkdirSync(`${root}public/assets/js`, { recursive: true });
  writeFileSync(`${root}public/assets/js/games.js`, text);
  return root;
};
const serve = root => new Promise(res => {
  const s = createServer((req, rsp) => {
    try { rsp.end(readFileSync(`${root}public${req.url}`)); } catch { rsp.statusCode = 404; rsp.end(); }
  }).listen(0, '127.0.0.1', () => res(s));
});

test('isLocal: only this machine', () => {
  assert.ok(isLocal('http://localhost:8799'));
  assert.ok(isLocal('http://127.0.0.1:8765/'));
  assert.ok(!isLocal('https://juegosdesalon.cl'));
  assert.ok(!isLocal(undefined));
});

test('sameTree passes for this tree and fails for another one', async () => {
  const mine = tree('export const A = 1;\n');
  const other = tree('export const A = 0;\n');
  const s = await serve(other);
  const site = `http://127.0.0.1:${s.address().port}`;
  try {
    await sameTree(site, other);
    await assert.rejects(sameTree(site, mine), /serves another tree/);
  } finally { s.close(); }
});

test('sameTree names a port with nothing behind it', async () => {
  const s = await serve(tree('x'));
  const port = s.address().port;
  await new Promise(r => s.close(r));
  await assert.rejects(sameTree(`http://127.0.0.1:${port}`, tree('x')), /nothing serves/);
});
