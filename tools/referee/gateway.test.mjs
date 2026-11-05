// The referee gateway (piece 6, D-532): templates only, a lab key, limits, timeout, breaker, cache,
// and no player text in what it keeps. A fake Ollama answers; no model and no network are needed.
import assert from 'node:assert/strict';
import { createGateway, DEFAULTS, fingerprint, limiter, breaker } from './gateway.mjs';
import { readFields, questionKey, TEMPLATES } from './templates.mjs';

let failed = 0;
const check = async (name, fn) => { try { await fn(); console.log(`✓ ${name}`); } catch (e) { failed++; console.log(`✗ ${name}: ${e.message}`); } };

const KEY = 'test-key', HEX = fingerprint(KEY);
let clock = 1_000_000;
const now = () => clock;
let model = { ok: true, slow: false, content: JSON.stringify({ valid: true, reason: 'un gato es un animal' }) };
const fakeFetch = async (url, init) => {
  if (url.includes('/labsLlaves/')) return { ok: true, json: async () => (url.includes(fingerprint('firebase-key')) ? 'JI' : null) };
  if (url.endsWith('/api/chat')) {
    const body = JSON.parse(init.body);
    assert.equal(body.model, 'test-model'); assert.equal(body.stream, false); assert.ok(body.format, 'structured output');
    if (model.slow) await new Promise((r, j) => init.signal.addEventListener('abort', () => j(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
    if (!model.ok) return { ok: false, status: 500 };
    return { ok: true, json: async () => ({ message: { content: model.content } }) };
  }
  throw new Error(`unexpected ${url}`);
};
const cfg = { ...DEFAULTS, model: 'test-model', keys: [HEX], perKeyPerMin: 3, globalPerMin: 100, timeoutMs: 50, breakerFailures: 2, breakerOpenMs: 1000, heartbeat: '/dev/null/never' };
const fresh = () => createGateway({ ...cfg }, { fetch: fakeFetch, now });
const Q = { key: KEY, template: 'bachillerato', fields: { category: 'animal', letter: 'g', answer: 'gato' } };

await check('templates bound their fields and refuse what is not a word', () => {
  assert.deepEqual(readFields('bachillerato', { category: ' animal ', letter: 'g', answer: 'gato' }).fields, { category: 'animal', letter: 'g', answer: 'gato' });
  assert.match(readFields('bachillerato', { category: 'animal', letter: 'g' }).error, /answer is missing/);
  assert.match(readFields('bachillerato', { category: 'animal', letter: 'g', answer: 'x'.repeat(41) }).error, /longer/);
  assert.match(readFields('bachillerato', { category: 'animal', letter: 'g', answer: 'gato <script>' }).error, /characters/);
  assert.match(readFields('nope', {}).error, /unknown template/);
  assert.equal(questionKey('bachillerato', { answer: 'Gato', category: 'animal' }), questionKey('bachillerato', { category: 'animal', answer: 'gato' }), 'the same question, whatever the case and order');
  for (const [id, t] of Object.entries(TEMPLATES)) assert.ok(t.system && t.user && t.schema && t.check && t.fields, id);
});

await check('a verdict comes back with its time, and the same question again from the cache', async () => {
  const g = fresh();
  const r = await g.judge(Q);
  assert.equal(r.status, 200); assert.equal(r.body.answer.valid, true); assert.equal(r.body.cached, false); assert.equal(typeof r.body.ms, 'number');
  const again = await g.judge({ ...Q, fields: { ...Q.fields, answer: 'GATO' } });
  assert.equal(again.status, 200); assert.equal(again.body.cached, true);
  assert.equal(g.health().answered, 2); assert.equal(g.health().cached, 1);
});

await check('without a valid lab key nothing is asked; a key in Firebase is accepted and remembered', async () => {
  const g = fresh();
  assert.equal((await g.judge({ ...Q, key: 'wrong' })).status, 401);
  assert.equal((await g.judge({ ...Q, key: undefined })).status, 401);
  assert.equal((await g.judge({ ...Q, key: 'firebase-key' })).status, 200);
  assert.equal(g.health().refused, 2);
});

await check('bad fields are refused before the model is called', async () => {
  const g = fresh();
  assert.equal((await g.judge({ key: KEY, template: 'nope', fields: {} })).status, 400);
  assert.equal((await g.judge({ key: KEY, template: 'bachillerato', fields: { category: 'animal', letter: 'g', answer: 'a;b' } })).status, 400);
  assert.equal((await g.judge('text')).status, 400);
  assert.equal(g.health().answered, 0);
});

await check('the per-key limit answers 429 with retry, and refills with the minute', async () => {
  const g = fresh();
  for (let i = 0; i < 3; i++) assert.equal((await g.judge({ ...Q, fields: { ...Q.fields, answer: `g${i}` } })).status, 200);
  const r = await g.judge({ ...Q, fields: { ...Q.fields, answer: 'g9' } });
  assert.equal(r.status, 429); assert.equal(r.body.retry, true);
  clock += 60000;
  assert.equal((await g.judge({ ...Q, fields: { ...Q.fields, answer: 'g9' } })).status, 200);
});

await check('a slow model is a 504 within the timeout, and the game is told the table decides', async () => {
  const g = fresh();
  model = { ...model, slow: true };
  const r = await g.judge(Q);
  assert.equal(r.status, 504); assert.match(r.body.error, /table decides/); assert.equal(r.body.retry, true);
  assert.equal(g.health().timeouts, 1);
  model = { ...model, slow: false };
});

await check('after failures in a row the breaker answers 503 at once, then tries again', async () => {
  const g = createGateway({ ...cfg, perKeyPerMin: 10 }, { fetch: fakeFetch, now });
  model = { ...model, ok: false };
  assert.equal((await g.judge({ ...Q, fields: { ...Q.fields, answer: 'a1' } })).status, 502);
  assert.equal((await g.judge({ ...Q, fields: { ...Q.fields, answer: 'a2' } })).status, 502);
  model = { ...model, ok: true };
  const open = await g.judge({ ...Q, fields: { ...Q.fields, answer: 'a3' } });
  assert.equal(open.status, 503); assert.equal(g.health().ok, false);
  clock += 1001;
  assert.equal((await g.judge({ ...Q, fields: { ...Q.fields, answer: 'a3' } })).status, 200);
  assert.equal(g.health().ok, true);
});

await check('an answer off the schema is a failure, never passed on', async () => {
  const g = fresh();
  model = { ...model, content: JSON.stringify({ valid: 'yes' }) };
  assert.equal((await g.judge(Q)).status, 502);
  model = { ...model, content: 'not json' };
  assert.equal((await g.judge({ ...Q, fields: { ...Q.fields, answer: 'otro' } })).status, 502);
  model = { ...model, content: JSON.stringify({ valid: true, reason: 'ok' }) };
});

await check('the model is asked at most `concurrency` at a time; the rest wait', async () => {
  const g = createGateway({ ...cfg, concurrency: 1, perKeyPerMin: 10, timeoutMs: 5000 }, { fetch: fakeFetch, now });
  let gate; const slow = new Promise(r => { gate = r; });
  const slowFetch = async (url, init) => { if (url.endsWith('/api/chat')) await slow; return fakeFetch(url, init); };
  const g2 = createGateway({ ...cfg, concurrency: 1, perKeyPerMin: 10, timeoutMs: 5000 }, { fetch: slowFetch, now });
  const a = g2.judge({ ...Q, fields: { ...Q.fields, answer: 'uno' } }), b = g2.judge({ ...Q, fields: { ...Q.fields, answer: 'dos' } });
  await new Promise(r => setTimeout(r, 5));
  assert.equal(g2.health().running, 1); assert.equal(g2.health().waiting, 1);
  gate();
  assert.equal((await a).status, 200); assert.equal((await b).status, 200);
  assert.equal(g.health().running, 0);
});

await check('health and the heartbeat carry counters and times, never a word of a player', async () => {
  const g = fresh();
  await g.judge(Q);
  const h = JSON.stringify(g.health());
  assert.doesNotMatch(h, /gato|animal/); assert.match(h, /"answered":1/); assert.match(h, /"p95Ms"/);
});

await check('the pieces: a limiter refills by the clock, a breaker opens and closes', () => {
  let t = 0; const l = limiter(2, () => t);
  assert.ok(l.take('a')); assert.ok(l.take('a')); assert.ok(!l.take('a')); t += 30000; assert.ok(l.take('a'));
  const b = breaker(2, 100, () => t);
  b.fail(); assert.ok(!b.open); b.fail(); assert.ok(b.open); t += 101; assert.ok(!b.open); b.ok(); b.fail(); assert.ok(!b.open);
});

await check('the HTTP door: health, CORS for the site, a judgment, and nothing else', async () => {
  const g = fresh();
  await new Promise(r => g.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${g.server.address().port}`;
  const h = await fetch(`${base}/health`); assert.equal(h.status, 200); assert.equal((await h.json()).model, 'test-model');
  const o = await fetch(`${base}/v1/judge`, { method: 'OPTIONS', headers: { origin: 'https://juegosdesalon.cl' } });
  assert.equal(o.status, 204); assert.equal(o.headers.get('access-control-allow-origin'), 'https://juegosdesalon.cl');
  const x = await fetch(`${base}/health`, { headers: { origin: 'https://evil.example' } });
  assert.equal(x.headers.get('access-control-allow-origin'), null);
  const j = await fetch(`${base}/v1/judge`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Q) });
  assert.equal(j.status, 200); assert.equal((await j.json()).answer.valid, true);
  const bad = await fetch(`${base}/v1/judge`, { method: 'POST', body: '{' }); assert.equal(bad.status, 400);
  const nf = await fetch(`${base}/other`); assert.equal(nf.status, 404);
  g.server.close();
});

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log('referee gateway: ok');
