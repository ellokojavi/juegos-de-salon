#!/usr/bin/env node
/**
 * A headless Claude session for a `mac` job (D-451): the daily processes round and the weekly
 * report. launchd starts it through `jobs.mjs run`, so it runs whenever the Mac mini is on, with
 * or without the desktop app open (the app's scheduled tasks stopped unseen on 2026-10-18, when
 * the app was closed). The instructions are the prompt file read from origin/main, as before (D-440).
 *
 *   node tools/jobs/claude-task.mjs tools/jobs/prompts/processes-round.md
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const file = process.argv[2];
if (!file || !existsSync(file)) { console.log(`❌ no prompt file: ${file}`); process.exit(2); }

const PROMPT = `You are running unattended, started by launchd on the owner's Mac mini (no one will answer questions). `
  + `Run \`git fetch -q origin main\`, then read \`${file}\` from origin/main (\`git show origin/main:${file}\`) and follow it to the end.`;

// auto: the session acts on its own but the classifier still stops the dangerous actions
const r = spawnSync('claude', ['-p', PROMPT, '--permission-mode', 'auto'], { encoding: 'utf8', maxBuffer: 64 << 20 });
console.log((r.stdout || '').trim());
if (r.status !== 0) { console.log(`❌ claude exited ${r.status ?? r.signal}: ${(r.stderr || '').trim().slice(0, 300)}`); process.exit(1); }
