// The support agent's headless session (D-318, D-365, #838): it reads strangers' emails, so it gets Bash for inbox.mjs and nothing else.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentFrom, ARGS, command } from './inbox-watch.mjs';

const md = readFileSync(new URL('../../.claude/agents/support.md', import.meta.url), 'utf8');
const a = agentFrom(md).support;
assert.deepEqual(a.tools, ['Bash'], 'the inline agent has Bash only');
assert.match(a.prompt, /^You are the support agent/, 'the prompt is the file body, without the frontmatter');
assert.match(a.description, /^Support agent/);
assert.match(md, /^tools: Bash$/m, 'support.md itself asks for Bash only (the processes round launches it too)');
assert.doesNotMatch(md, /text\.txt|\/tmp\//, 'the report text goes on stdin, never through a file');

const after = flag => ARGS.slice(ARGS.indexOf(flag) + 1, ARGS.findIndex((x, i) => i > ARGS.indexOf(flag) && x.startsWith('--')) >>> 0);
assert.ok(ARGS.includes('--restricted'), 'restricted: no settings files, file reads only inside the repo');
assert.ok(ARGS.includes('--strict-mcp-config'), 'no MCP servers (no connectors to send anything out)');
assert.deepEqual(after('--tools'), ['Bash']);
assert.deepEqual(after('--allowedTools'), ['Bash(node tools/agents/inbox.mjs:*)'], 'one command allowed, nothing else');
for (const t of ['Read', 'Write', 'Edit', 'WebFetch', 'Bash(node tools/agents/inbox.mjs skipped:*)']) assert.ok(after('--disallowedTools').includes(t), `${t} denied`);
assert.ok(!ARGS.some(x => /permission-mode|bypass|skip-permissions/i.test(x)), 'no permission mode that skips the checks');

const c = command(md);
assert.equal(c[0], '-p');
assert.deepEqual(JSON.parse(c[c.indexOf('--agents') + 1]), agentFrom(md));
assert.equal(c[c.indexOf('--agent') + 1], 'support');
console.log('inbox-watch ok');
