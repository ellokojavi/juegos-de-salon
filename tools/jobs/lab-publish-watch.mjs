#!/usr/bin/env node
/**
 * The lab's 🚀 Publicar watcher (D-480), a `mac` job in tools/jobs/jobs.json, every 5 minutes. It
 * follows the requests' open PRs (`lab-publish.mjs sync`), which costs nothing, and only when the
 * owner asked for a feature to go live from /labs/ it runs a headless Claude session through
 * claude-task.mjs, with the round's tools, following tools/jobs/prompts/lab-publish.md: one
 * request per session, the oldest first. A request the session claimed but left without a PR
 * fails here, so the card on /labs/ never waits forever. A PR that stayed in conflict with main
 * or with red checks (sync marks it, lab-publish.mjs CONFLICT_MS) gets one session that brings it up to date
 * (tools/jobs/prompts/lab-publish-conflict.md), started only on the sync that marks it.
 *
 *   node tools/jobs/lab-publish-watch.mjs     # usually run by `jobs.mjs run lab-publish-watch`
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PROMPT_FILE = 'tools/jobs/prompts/lab-publish.md';
export const CONFLICT_PROMPT = 'tools/jobs/prompts/lab-publish-conflict.md';

/** The requests this sync just sent to be fixed (`<id>: conflict, sent to be fixed`). */
export const toFix = out => out.split('\n').map(l => l.match(/^(\S+): conflict, sent to be fixed$/)?.[1]).filter(Boolean);

const node = (...args) => spawnSync('node', args, { encoding: 'utf8' });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sync = node('tools/agents/lab-publish.mjs', 'sync');
  if (sync.status !== 0) { console.log(`❌ sync: ${(sync.stderr || sync.stdout).trim().slice(0, 300)}`); process.exit(1); }
  if (toFix(sync.stdout).length) {
    const f = node('tools/jobs/claude-task.mjs', CONFLICT_PROMPT);
    console.log(`conflict fix: ${(f.stdout || '').trim().split('\n').at(-1) || f.status}`);
  }
  const pending = node('tools/agents/lab-publish.mjs', 'pending');
  if (pending.status === 3) { console.log(`no requests; ${sync.stdout.trim().split('\n').at(-1)}`); process.exit(0); }
  if (pending.status !== 0) { console.log(`❌ pending: ${(pending.stderr || pending.stdout).trim().slice(0, 300)}`); process.exit(1); }

  const r = node('tools/jobs/claude-task.mjs', PROMPT_FILE);
  console.log((r.stdout || '').trim());
  // what the session claimed and left without a PR fails now, not in four hours
  const left = node('tools/agents/lab-publish.mjs', 'list').stdout.split('\n').filter(l => /^\S+\s+working\b/.test(l));
  for (const l of left) node('tools/agents/lab-publish.mjs', 'failed', l.split(/\s+/)[0], 'La sesión terminó sin abrir un PR. Revisa el log del Mac mini (lab-publish-watch).');
  console.log(left.length ? `❌ ${left.length} request(s) left without a PR` : 'request handled');
  process.exit(r.status === 0 && !left.length ? 0 : 1);
}
