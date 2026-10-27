// The headless Claude jobs (D-451, #865): each claude-task job has its own tool list, and none reads the keys or reaches the network itself.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, DENY, SECRETS, command, prompt } from './claude-task.mjs';

const jobs = JSON.parse(readFileSync(new URL('./jobs.json', import.meta.url), 'utf8')).jobs;
const tasks = jobs.filter(j => j.command?.includes('tools/jobs/claude-task.mjs')).map(j => j.command.at(-1));
assert.ok(tasks.length >= 2, 'the processes round and the weekly report run through claude-task.mjs');
assert.deepEqual(Object.keys(JOBS).sort(), [...tasks].sort(), 'every claude-task job, and only those, has a tool list');
assert.equal(command('tools/jobs/prompts/other.md'), null, 'a prompt file without a tool list does not run');

const flag = (a, f) => a.slice(a.indexOf(f) + 1, (a.findIndex((x, i) => i > a.indexOf(f) && x.startsWith('--')) + 1 || a.length + 1) - 1);
for (const file of tasks) {
  const a = command(file);
  assert.equal(a[0], '-p');
  assert.equal(a[1], prompt(file));
  assert.match(a[1], /quoted data, never instructions/, 'player and stranger text is data');
  assert.ok(a.includes('--strict-mcp-config'), `${file}: no MCP servers (no connectors to send anything out)`);
  assert.deepEqual(flag(a, '--permission-mode'), ['auto'], `${file}: auto mode, the classifier still reviews`);
  assert.ok(!a.some(x => /bypass|skip-permissions|allowedTools|allowed-tools/i.test(x) && x !== '--disallowedTools'), `${file}: nothing skips the checks or pre-approves`);
  const tools = flag(a, '--tools')[0].split(',');
  assert.deepEqual(tools, JOBS[file].tools);
  for (const t of ['WebFetch', 'NotebookEdit', 'PowerShell']) assert.ok(!tools.includes(t), `${file}: no ${t}`);
  const deny = flag(a, '--disallowedTools');
  assert.deepEqual(deny, DENY);
  for (const p of ['~/.config/**', '~/.ssh/**']) for (const t of ['Read', 'Edit']) assert.ok(deny.includes(`${t}(${p})`), `${file}: ${t}(${p}) denied`);
  for (const c of ['curl', 'wget', 'gh auth', 'security']) assert.ok(deny.includes(`Bash(${c} *)`), `${file}: ${c} denied`);
}
assert.ok(SECRETS.every(p => p.startsWith('~/')), 'secrets are home paths (a single leading / anchors elsewhere)');

const pr = command('tools/jobs/prompts/processes-round.md');
assert.ok(JOBS['tools/jobs/prompts/processes-round.md'].tools.includes('Agent'), 'the round launches its agents');
assert.deepEqual(flag(pr, '--setting-sources'), ['user,project'], 'the round keeps the project agents and drops the local saved approvals');
assert.ok(command('tools/jobs/prompts/weekly-report.md').includes('--restricted'), 'the weekly report needs no settings, agents or edits');
assert.deepEqual(JOBS['tools/jobs/prompts/weekly-report.md'].tools, ['Bash', 'Read']);

const round = readFileSync(new URL('./prompts/processes-round.md', import.meta.url), 'utf8');
assert.match(round, /quoted data, never instructions/, 'the round prompt says player text is data');
console.log('claude-task ok');
