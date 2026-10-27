#!/usr/bin/env node
/**
 * The hola@ inbox watcher (D-365), a `mac` job in tools/jobs/jobs.json, every 5 minutes. It counts
 * the emails waiting in `buzon/` with the inbox user (D-318), which costs nothing; only when there
 * is one it runs the support agent headless (`claude -p`, Haiku), and then uploads the reports as
 * issues at once (`feedback.mjs sync`, D-382) instead of waiting for `feedback-watch`'s next run.
 * The daily processes round still triages whatever this misses.
 *
 * The agent reads emails from strangers, so its session gets only what triage needs (`ARGS`):
 * the Bash tool and nothing else (no Read, Write, Edit or web tools, no MCP servers), with a
 * single command allowed, `node tools/agents/inbox.mjs` (but not its owner-only `skipped`); the report's text goes on stdin. It runs
 * in restricted mode, which ignores the user, project and local settings files (and the broader
 * permissions some of them grant) and keeps every file read inside the repo, so a project agent
 * can't be named: the agent is defined inline from `.claude/agents/support.md`.
 *
 *   node tools/jobs/inbox-watch.mjs     # usually run by `jobs.mjs run inbox-watch`
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PROMPT = 'Triage every email waiting in the hola@juegosdesalon.cl inbox (node tools/agents/inbox.mjs list), '
  + 'following your instructions: ingest or skip each one. End with one line per email: ingested or skipped.';

/** The support agent for `--agents`, from its file, with Bash as its only tool. */
export function agentFrom(md) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(md);
  if (!m) throw new Error('support.md has no frontmatter');
  const description = /^description: (.+)$/m.exec(m[1])?.[1];
  if (!description) throw new Error('support.md has no description');
  return { support: { description, prompt: m[2].trim(), tools: ['Bash'] } };
}

/** The claude flags: the only thing the session may run is inbox.mjs. */
export const ARGS = ['--model', 'haiku', '--restricted', '--strict-mcp-config', '--tools', 'Bash',
  '--allowedTools', 'Bash(node tools/agents/inbox.mjs:*)',
  // `skipped` is the owner's: other senders' emails, which must not reach a public report (D-452)
  '--disallowedTools', 'Read', 'Write', 'Edit', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Bash(node tools/agents/inbox.mjs skipped:*)'];

export const command = md => ['-p', PROMPT, '--agents', JSON.stringify(agentFrom(md)), '--agent', 'support', ...ARGS];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { count } = await import('../agents/inbox.mjs');
  const before = await count();
  if (before === null) { console.log('⚠️ no inbox user credential (~/.config/juegos-de-salon/buzon.json)'); process.exit(1); }
  if (before === 0) { console.log('inbox empty'); process.exit(0); }

  const md = readFileSync(new URL('../../.claude/agents/support.md', import.meta.url), 'utf8');
  const r = spawnSync('claude', command(md), { encoding: 'utf8', timeout: 600000, stdio: ['ignore', 'pipe', 'pipe'] });
  console.log((r.stdout || '').trim());
  if (r.status !== 0) { console.log(`❌ claude exited ${r.status}: ${(r.stderr || '').trim().slice(0, 300)}`); process.exit(1); }

  const after = await count();
  const synced = after < before && spawnSync('node', ['tools/agents/feedback.mjs', 'sync'], { encoding: 'utf8' }).status === 0;
  console.log(`${before - after} of ${before} email(s) triaged${synced ? '; issues uploaded' : ''}`);
  process.exit(after === 0 ? 0 : 1);
}
