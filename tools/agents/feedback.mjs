#!/usr/bin/env node
/**
 * The 🐞 feedback as GitHub issues (D-275): each report people send from La Copa or the lab
 * (`feedback/` in Firebase, D-104, D-191, D-265) becomes an issue with the `feedback` label, and
 * the processes agent handles it in its round. `.github/workflows/feedback.yml` runs it every 15
 * minutes: that way each report reaches the owner by email and stays linked to its reply and its fix.
 *
 *   node tools/agents/feedback.mjs sync [--dry-run]   # creates the missing issues
 *
 * The repo is public: the issue carries the text as is, the game, the version and the screen, and
 * the name the player gave, so the owner can follow up (D-279), but not their browser. Each issue
 * carries `<!-- feedback:<id> -->`, so a report is never uploaded twice, even if its issue is closed.
 * The report's fields (`texto`, `nombre`, `contexto`, and inside it `juego`, `copa`…) are Firebase
 * data and keep their names.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';

export const LABEL = 'feedback';
const REPO = process.env.GITHUB_REPOSITORY || 'ellokojavi/juegos-de-salon';
const SITE = 'https://juegosdesalon.cl';

/* ------------------------------------------------------------------ */
/* Pure logic (tested by tools/agents/feedback.test.mjs)              */
/* ------------------------------------------------------------------ */

export const marker = id => `<!-- feedback:${id} -->`;

/** The report ids that already have an issue, read from the bodies. */
export const uploaded = issues => new Set(issues.flatMap(i => [...(i.body || '').matchAll(/<!-- feedback:([^\s>]+) -->/g)].map(m => m[1])));

/** The reports without an issue, oldest to newest (so the issue numbers follow the order). */
export const pending = (reports, already) => reports.filter(r => r.id && !already.has(r.id) && String(r.texto || '').trim()).sort((a, b) => (a.at || 0) - (b.at || 0));

const context = r => { try { return JSON.parse(r.contexto || '{}') || {}; } catch { return {}; } };

/** Where it was written, in a few words: the game or the page. */
export function where(r) {
  const c = context(r);
  return c.juego || (c.labs && `lab ${c.labs}`) || (c.copa && `cup ${c.copa}`) || c.pantalla || c.url || 'the app';
}

/** A player's @ or # mentions no one and links nothing. */
const inert = t => String(t).replace(/@/g, '@​').replace(/#(\d)/g, '#​$1');

export function title(r) {
  const t = inert(String(r.texto).replace(/\s+/g, ' ').trim());
  return `🐞 ${where(r)}: ${t.length > 70 ? `${t.slice(0, 69)}…` : t}`;
}

/** The body: the text as is, who sent it and the context, without the browser. */
export function body(r) {
  const c = context(r);
  const date = r.at ? new Date(r.at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'no date';
  const data = [
    ['Who', r.nombre && String(r.nombre).trim()], ['Lab key', r.tester && String(r.tester).trim()], ['Game', c.juego], ['Lab', c.labs], ['Cup', c.copa], ['Day', c.dia], ['Seed', c.semilla],
    ['Result', c.resumen ?? c.puntaje], ['Mistakes', c.errores], ['Hints', c.ayudas], ['Time', c.tiempo],
    ['Page', c.url && (String(c.url).startsWith('/') ? `${SITE}${c.url}` : c.url)], ['Screen', c.pantalla], ['Window size', c.pantallaTam], ['Version', r.v && `v${r.v}`], ['Date', date],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');
  return [
    inert(String(r.texto).trim()).split('\n').map(l => `> ${l}`).join('\n'),
    '',
    data.map(([k, v]) => `- **${k}:** ${inert(v)}`).join('\n'),
    '',
    'Sent with the app\'s 🐞 button (D-275). The processes agent handles it in its round.',
    marker(r.id),
  ].join('\n');
}

/* ------------------------------------------------------------------ */

const gh = (...args) => execFileSync('gh', [...args, '-R', REPO], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

async function sync(dryRun) {
  const res = await fetch(`${firebaseConfig.databaseURL}/feedback.json`);
  if (!res.ok) throw new Error(`Could not read feedback/ (HTTP ${res.status}).`);
  const reports = Object.entries((await res.json()) || {}).map(([id, r]) => ({ id, ...r }));
  const issues = JSON.parse(gh('issue', 'list', '--label', LABEL, '--state', 'all', '--limit', '1000', '--json', 'body'));
  const fresh = pending(reports, uploaded(issues));
  if (!fresh.length) return console.log(`Nothing new (${reports.length} report(s), all with an issue).`);
  if (dryRun) { for (const r of fresh) console.log(`${title(r)}\n${body(r)}\n`); return; }
  const exists = JSON.parse(gh('label', 'list', '--limit', '200', '--json', 'name')).some(l => l.name === LABEL);
  if (!exists) gh('label', 'create', LABEL, '--color', 'd93f0b', '--description', 'A player\'s 🐞 report (D-275)');
  for (const r of fresh) console.log(gh('issue', 'create', '--title', title(r), '--label', LABEL, '--body', body(r)).trim());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command] = process.argv.slice(2);
  if (command !== 'sync') { console.error('Usage: node tools/agents/feedback.mjs sync [--dry-run]'); process.exit(2); }
  sync(process.argv.includes('--dry-run')).catch(e => { console.error(e.message); process.exit(1); });
}
