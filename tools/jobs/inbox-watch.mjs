#!/usr/bin/env node
/**
 * The hola@ inbox watcher (D-369), a `mac` job in tools/jobs/jobs.json, every 5 minutes. It counts
 * the emails waiting in `buzon/` with the inbox user (D-318), which costs nothing; only when there
 * is one it runs the support agent headless (`claude -p --agent support`, Haiku), limited to
 * `inbox.mjs` and its scratch files, and then asks GitHub to upload the reports as issues at once
 * (`feedback.yml`) instead of waiting for its quarter hour. The daily processes round still
 * triages whatever this misses.
 *
 *   node tools/jobs/inbox-watch.mjs     # usually run by `jobs.mjs run inbox-watch`
 */
import { spawnSync } from 'node:child_process';
import { count } from '../agents/inbox.mjs';

const PROMPT = 'Triage every email waiting in the hola@juegosdesalon.cl inbox (node tools/agents/inbox.mjs list), '
  + 'following your instructions: ingest or skip each one. End with one line per email: ingested or skipped.';

const before = await count();
if (before === null) { console.log('⚠️ no inbox user credential (~/.config/juegos-de-salon/buzon.json)'); process.exit(1); }
if (before === 0) { console.log('inbox empty'); process.exit(0); }

const r = spawnSync('claude', ['-p', PROMPT, '--agent', 'support', '--model', 'haiku',
  '--allowedTools', 'Bash(node tools/agents/inbox.mjs:*)', 'Read', 'Write'], { encoding: 'utf8', timeout: 600000 });
console.log((r.stdout || '').trim());
if (r.status !== 0) { console.log(`❌ claude exited ${r.status}: ${(r.stderr || '').trim().slice(0, 300)}`); process.exit(1); }

const after = await count();
if (after < before) spawnSync('gh', ['workflow', 'run', 'feedback.yml'], { encoding: 'utf8' });
console.log(`${before - after} of ${before} email(s) triaged${after < before ? '; feedback.yml launched' : ''}`);
process.exit(after === 0 ? 0 : 1);
