#!/usr/bin/env node
/**
 * The reports and comments people sent from The Cup (D-104) and the lab (D-191, D-265), read from
 * `feedback/` in Firebase. No account: the node is readable by anyone.
 *
 *   node tools/firebase/reports.mjs              all of them, newest to oldest
 *   node tools/firebase/reports.mjs --days 3     only those from the last 3 days
 *   node tools/firebase/reports.mjs --json       as is, to process them
 */
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';

const args = process.argv.slice(2);
// --dias: the name from before D-316
const flag = args.includes('--days') ? '--days' : args.includes('--dias') ? '--dias' : null;
const days = flag ? Number(args[args.indexOf(flag) + 1]) || 1 : 0;
const res = await fetch(`${firebaseConfig.databaseURL}/feedback.json`);
if (!res.ok) {
  console.error(`Could not read feedback/ (HTTP ${res.status}). Are the new rules published? See firebase/README.md.`);
  process.exit(1);
}
// The fields (texto, nombre, contexto…) are the ones stored in Firebase: persisted, not renamed (D-316)
const all = Object.entries((await res.json()) || {}).map(([id, r]) => ({ id, ...r }));
const since = days ? Date.now() - days * 864e5 : 0;
const list = all.filter(r => (r.at || 0) >= since).sort((a, b) => (b.at || 0) - (a.at || 0));
if (args.includes('--json')) { console.log(JSON.stringify(list, null, 2)); process.exit(0); }
if (!list.length) { console.log(days ? `No reports in the last ${days} days.` : 'No reports yet.'); process.exit(0); }
const date = ms => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
console.log(`${list.length} report(s)${days ? ` in the last ${days} days` : ''}\n`);
for (const r of list) {
  let ctx = {};
  try { ctx = JSON.parse(r.contexto || '{}'); } catch (_) { /* nothing */ }
  const where = [ctx.labs && `🧪 labs ${ctx.labs}`, ctx.copa && `cup ${ctx.copa}`, ctx.dia && `day ${ctx.dia}`, ctx.juego, ctx.semilla && `seed ${ctx.semilla}`,
    // How the commenter did on The Case (D-265)
    ctx.errores !== undefined && `${ctx.errores} errors`, ctx.ayudas !== undefined && `${ctx.ayudas} hints`, ctx.tiempo, ctx.url, ctx.pantalla, ctx.pantallaTam].filter(Boolean).join(' · ');
  console.log(`── ${r.at ? date(r.at) : '(no date)'} · ${r.nombre || 'anonymous'}${r.tester ? ` (key ${r.tester})` : ''} · v${r.v || '?'}`);
  if (where) console.log(`   ${where}`);
  console.log(`   ${String(r.texto || '').replace(/\n/g, '\n   ')}`);
  if (ctx.navegador) console.log(`   (${ctx.navegador.slice(0, 90)})`);
  console.log('');
}
