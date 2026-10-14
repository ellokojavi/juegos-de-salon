#!/usr/bin/env node
/**
 * The usability dilemmas (D-132): GitHub issues with the `usability` label, handled from the
 * conversation with Claude, not from GitHub.
 *
 *   node tools/agents/dilemmas.mjs list [--all]             # open ones (or all) with their state
 *   node tools/agents/dilemmas.mjs show <n>                 # the dilemma and its comments
 *   node tools/agents/dilemmas.mjs create <file.md>         # the 1st line "# Title", the rest is the body
 *   node tools/agents/dilemmas.mjs resolve <n> "decision"   # records the decision and closes it as resolved
 *   node tools/agents/dilemmas.mjs archive <n> "reason"     # closes it as discarded
 *   node tools/agents/dilemmas.mjs reopen <n>
 *
 * States: `usability` + `pending` (waiting for the owner) → `resolved` (closed with the decision)
 * or `archived` (closed without being done). Uses the `gh` CLI, already authenticated.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPO = 'ellokojavi/juegos-de-salon';
const LABELS = {
  usability: ['1d76db', 'Usability dilemma (D-132)'],
  pending: ['fbca04', "Waiting for the owner's decision"],
  resolved: ['0e8a16', 'Decided and recorded in docs/USABILIDAD.md'],
  archived: ['cfd3d7', 'Discarded'],
};
const USAGE = 'Usage: node tools/agents/dilemmas.mjs list [--all] | show <n> | create <file.md> | resolve <n> "decision" | archive <n> "reason" | reopen <n>';

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const exit = (msg, code = 1) => { console.error(msg); process.exit(code); };

function ensureLabels() {
  const existing = new Set(JSON.parse(gh('label', 'list', '-R', REPO, '--json', 'name', '--limit', '200')).map(l => l.name));
  for (const [name, [color, desc]] of Object.entries(LABELS)) {
    if (!existing.has(name)) gh('label', 'create', name, '-R', REPO, '--color', color, '--description', desc);
  }
}

const number = x => (/^\d+$/.test(x || '') ? x : exit('The dilemma number is missing.', 2));
const [command, a1, a2] = process.argv.slice(2);

switch (command) {
  case 'list': {
    const state = process.argv.includes('--all') ? 'all' : 'open';
    const list = JSON.parse(gh('issue', 'list', '-R', REPO, '--label', 'usability', '--state', state, '--limit', '100', '--json', 'number,title,state,labels,createdAt,comments'));
    if (!list.length) { console.log(state === 'open' ? 'No open dilemmas.' : 'No dilemmas.'); break; }
    for (const i of list) {
      const labels = i.labels.map(l => l.name).filter(n => n !== 'usability').join(', ');
      console.log(`#${i.number} · ${i.state === 'OPEN' ? 'open' : 'closed'}${labels ? ` (${labels})` : ''} · ${i.createdAt.slice(0, 10)} · ${i.comments.length} comment(s) · ${i.title}`);
    }
    break;
  }
  case 'show': {
    const i = JSON.parse(gh('issue', 'view', number(a1), '-R', REPO, '--json', 'number,title,state,labels,body,comments,url'));
    console.log(`#${i.number} · ${i.title} · ${i.state} · ${i.labels.map(l => l.name).join(', ')}\n${i.url}\n\n${i.body}`);
    for (const c of i.comments) console.log(`\n── ${c.author.login} · ${c.createdAt.slice(0, 16)}\n${c.body}`);
    break;
  }
  case 'create': {
    if (!a1) exit('Usage: node tools/agents/dilemmas.mjs create <file.md>', 2);
    const text = readFileSync(a1, 'utf8');
    const [first, ...rest] = text.split('\n');
    const title = first.replace(/^#\s*/, '').trim();
    if (!title) exit('The first line of the file has to be the title ("# …").', 2);
    ensureLabels();
    const body = `${rest.join('\n').trim()}\n\n---\n_Usability agent dilemma (D-132). Decided in the conversation with Claude._`;
    console.log(gh('issue', 'create', '-R', REPO, '--title', `Usability: ${title}`, '--body', body, '--label', 'usability', '--label', 'pending').trim());
    break;
  }
  case 'resolve': {
    const n = number(a1);
    if (!a2) exit('Usage: node tools/agents/dilemmas.mjs resolve <n> "decision"', 2);
    ensureLabels();
    gh('issue', 'comment', n, '-R', REPO, '--body', `✅ **Owner's decision:** ${a2}\n\n_Recorded in docs/USABILIDAD.md._`);
    gh('issue', 'edit', n, '-R', REPO, '--add-label', 'resolved', '--remove-label', 'pending');
    gh('issue', 'close', n, '-R', REPO, '--reason', 'completed');
    console.log(`#${n} resolved. The decision still has to be recorded in docs/USABILIDAD.md (section of what was resolved with the owner).`);
    break;
  }
  case 'archive': {
    const n = number(a1);
    ensureLabels();
    gh('issue', 'comment', n, '-R', REPO, '--body', `🗄️ **Archived:** ${a2 || 'discarded.'}`);
    gh('issue', 'edit', n, '-R', REPO, '--add-label', 'archived', '--remove-label', 'pending');
    gh('issue', 'close', n, '-R', REPO, '--reason', 'not planned');
    console.log(`#${n} archived.`);
    break;
  }
  case 'reopen': {
    const n = number(a1);
    ensureLabels();
    gh('issue', 'reopen', n, '-R', REPO);
    gh('issue', 'edit', n, '-R', REPO, '--add-label', 'pending', '--remove-label', 'resolved', '--remove-label', 'archived');
    console.log(`#${n} reopened.`);
    break;
  }
  default:
    exit(USAGE, 2);
}
