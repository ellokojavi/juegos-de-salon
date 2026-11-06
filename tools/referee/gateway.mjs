/**
 * The referee gateway (learning programme, piece 6, D-532): the one door between the games and
 * an open model running on the owner's Mac mini (Ollama on 127.0.0.1). Nothing else is exposed:
 * a Cloudflare Tunnel brings https://referee.juegosdesalon.cl to this process on 127.0.0.1, and
 * Ollama itself is never reachable from outside. Never the owner's Claude plan.
 *
 *   node tools/referee/gateway.mjs            # serves; launchd keeps it alive (jobs.json `referee`)
 *   GET  /health                              # ok, model, uptime, counters (no player text)
 *   POST /v1/judge  { key, template, fields } # a verdict, or a fast refusal
 *
 * What keeps the Mac mini and the players safe (tools/referee/README.md has the runbook):
 *  - only templates: the client picks `template` and sends short fields; the prompt is ours;
 *  - a lab key (D-281): its SHA-256 fingerprint must be in Firebase labsLlaves/ (cached 5 min);
 *  - limits: per key and global per minute, at most `concurrency` model calls at once, a timeout
 *    per call, a breaker that answers 503 at once while the model is down; the game then says
 *    "the table decides" (graceful degradation is the product's SLA);
 *  - no player text is kept: counters and timings only (REFEREE_LOG_TEXT=1 prints it, for debugging);
 *  - a cache: the same question gets the same answer, free and consistent.
 *
 * Config: ~/.config/juegos-de-salon/referee.json (every key optional), or REFEREE_CONFIG=<file>.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, readFields, questionKey } from './templates.mjs';

export const DEFAULTS = {
  port: 8790,
  host: '127.0.0.1',
  ollama: 'http://127.0.0.1:11434',
  model: 'gemma3:4b', // the eval of piece 1 picks the model; this is the placeholder
  concurrency: 2,
  timeoutMs: 6000,
  perKeyPerMin: 30,
  globalPerMin: 120,
  breakerFailures: 3,
  breakerOpenMs: 30000,
  cacheSize: 1000,
  keyCacheMs: 300000,
  firebase: 'https://juegos-de-salon-default-rtdb.firebaseio.com',
  origins: ['https://juegosdesalon.cl', 'https://ellokojavi.github.io', 'http://localhost'],
  keys: [], // fingerprints accepted without Firebase (tests, the owner's own)
  heartbeat: join(homedir(), '.config/juegos-de-salon/jobs/referee.json'),
};

export function loadConfig(file = process.env.REFEREE_CONFIG || join(homedir(), '.config/juegos-de-salon/referee.json')) {
  const cfg = { ...DEFAULTS };
  if (existsSync(file)) Object.assign(cfg, JSON.parse(readFileSync(file, 'utf8')));
  return cfg;
}

export const fingerprint = key => createHash('sha256').update(String(key)).digest('hex');

/** A token bucket per name: `take(name)` is true while the minute's budget lasts. */
export function limiter(perMin, now = Date.now) {
  const seen = new Map();
  return {
    take(name) {
      const t = now(), b = seen.get(name) || { tokens: perMin, at: t };
      b.tokens = Math.min(perMin, b.tokens + ((t - b.at) / 60000) * perMin); b.at = t;
      if (b.tokens < 1) { seen.set(name, b); return false; }
      b.tokens -= 1; seen.set(name, b); return true;
    },
  };
}

/** The breaker: opens after `failures` in a row, answers at once while open, tries again after `openMs`. */
export function breaker(failures, openMs, now = Date.now) {
  let bad = 0, openedAt = 0;
  return {
    get open() { return openedAt > 0 && now() - openedAt < openMs; },
    ok() { bad = 0; openedAt = 0; },
    fail() { bad++; if (bad >= failures) openedAt = now(); },
  };
}

/** Creates the gateway; `deps` lets the tests swap the model, the key check and the clock. */
export function createGateway(cfg = loadConfig(), deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const now = deps.now || Date.now;
  const perKey = limiter(cfg.perKeyPerMin, now), global = limiter(cfg.globalPerMin, now);
  const brk = breaker(cfg.breakerFailures, cfg.breakerOpenMs, now);
  const cache = new Map(), keys = new Map();
  const counts = { requests: 0, answered: 0, cached: 0, refused: 0, limited: 0, failed: 0, timeouts: 0 };
  const times = [];
  let running = 0; const waiting = [];
  const started = now();

  const acquire = () => new Promise(r => { if (running < cfg.concurrency) { running++; r(); } else waiting.push(r); });
  const release = () => { if (waiting.length) waiting.shift()(); else running--; };

  async function keyOk(key) {
    if (!key || typeof key !== 'string' || key.length > 200) return false;
    const hex = fingerprint(key);
    if (cfg.keys.includes(hex)) return true;
    const c = keys.get(hex);
    if (c && now() - c.at < cfg.keyCacheMs) return c.ok;
    let ok = false;
    try {
      const r = await fetchFn(`${cfg.firebase}/labsLlaves/${hex}.json`);
      const label = r.ok ? await r.json() : null;
      ok = typeof label === 'string' && label !== '';
    } catch { ok = c ? c.ok : false; }
    keys.set(hex, { ok, at: now() });
    return ok;
  }

  async function ask(template, fields) {
    const t = TEMPLATES[template];
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), cfg.timeoutMs);
    try {
      const r = await fetchFn(`${cfg.ollama}/api/chat`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model, stream: false, format: t.schema, keep_alive: '24h',
          options: { temperature: 0, num_predict: 160 },
          messages: [{ role: 'system', content: t.system }, { role: 'user', content: t.user(fields) }],
        }),
      });
      if (!r.ok) throw new Error(`ollama ${r.status}`);
      const body = await r.json();
      const answer = JSON.parse(body?.message?.content ?? '');
      if (!t.check(answer)) throw new Error('answer off schema');
      return answer;
    } finally { clearTimeout(timer); }
  }

  const p95 = () => { if (!times.length) return 0; const s = [...times].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]; };
  const health = () => ({ ok: !brk.open, model: cfg.model, upSeconds: Math.round((now() - started) / 1000), breakerOpen: brk.open, running, waiting: waiting.length, p95Ms: p95(), ...counts });

  /** One request, as a plain function so the tests call it without sockets. */
  async function judge(body) {
    counts.requests++;
    const refuse = (status, error) => { counts.refused++; return { status, body: { error } }; };
    if (!body || typeof body !== 'object') return refuse(400, 'json body expected');
    if (!(await keyOk(body.key))) return refuse(401, 'a lab key is needed');
    const read = readFields(body.template, body.fields);
    if (read.error) return refuse(400, read.error);
    const hex = fingerprint(body.key);
    if (!perKey.take(hex) || !global.take('*')) { counts.limited++; return { status: 429, body: { error: 'too many questions, wait a minute', retry: true } }; }
    const q = questionKey(body.template, read.fields);
    if (cache.has(q)) { counts.cached++; counts.answered++; const v = cache.get(q); cache.delete(q); cache.set(q, v); return { status: 200, body: { ...v, cached: true } }; }
    if (brk.open) { counts.failed++; return { status: 503, body: { error: 'the referee is away, the table decides', retry: true } }; }
    await acquire();
    const t0 = now();
    try {
      const answer = await ask(body.template, read.fields);
      const ms = now() - t0; times.push(ms); if (times.length > 500) times.shift();
      brk.ok(); counts.answered++;
      const v = { answer, ms };
      cache.set(q, v); if (cache.size > cfg.cacheSize) cache.delete(cache.keys().next().value);
      if (process.env.REFEREE_LOG_TEXT === '1') console.log(JSON.stringify({ template: body.template, fields: read.fields, answer, ms }));
      return { status: 200, body: { ...v, cached: false } };
    } catch (e) {
      brk.fail();
      if (e.name === 'AbortError') { counts.timeouts++; return { status: 504, body: { error: 'the referee took too long, the table decides', retry: true } }; }
      counts.failed++;
      return { status: 502, body: { error: 'the referee could not answer, the table decides', retry: true } };
    } finally { release(); }
  }

  const cors = (req, res) => {
    const o = req.headers.origin || '';
    if (cfg.origins.some(a => o === a || o.startsWith(`${a}:`))) res.setHeader('access-control-allow-origin', o);
    res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type');
    res.setHeader('access-control-max-age', '600');
  };
  const send = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };

  const server = createServer(async (req, res) => {
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method === 'GET' && req.url === '/health') return send(res, brk.open ? 503 : 200, health());
    if (req.method === 'POST' && req.url === '/v1/judge') {
      let raw = '';
      req.on('data', c => { raw += c; if (raw.length > 4096) { req.destroy(); } });
      req.on('end', async () => {
        let body;
        try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'json body expected' }); }
        const r = await judge(body);
        send(res, r.status, r.body);
      });
      return;
    }
    send(res, 404, { error: 'not here' });
  });

  /** The heartbeat `jobs.mjs status` reads, like any mac job's last run; and a warm-up so the first player does not pay the model's load. */
  function keepWarm() {
    const beat = () => {
      try {
        mkdirSync(join(cfg.heartbeat, '..'), { recursive: true });
        const h = health();
        writeFileSync(cfg.heartbeat, JSON.stringify({ at: new Date(now()).toISOString(), exit: h.ok ? 0 : 1, ms: 0, summary: `${h.ok ? 'up' : 'model down'} · ${h.answered} answered · p95 ${h.p95Ms} ms · ${h.timeouts} timeouts` }));
      } catch { /* the heartbeat is a nicety */ }
    };
    beat();
    const warm = () => judge({ key: cfg.keys[0] || '', template: 'bachillerato', fields: { category: 'animal', letter: 'g', answer: 'gato' } }).catch(() => {});
    if (cfg.keys.length) warm();
    return [setInterval(beat, 60000), setInterval(warm, 20 * 60000)];
  }

  return { server, judge, health, keepWarm, fingerprint };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cfg = loadConfig();
  const g = createGateway(cfg);
  g.server.listen(cfg.port, cfg.host, () => {
    console.log(`referee on http://${cfg.host}:${cfg.port} → ${cfg.ollama} (${cfg.model})`);
    g.keepWarm();
  });
}
