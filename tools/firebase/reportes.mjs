#!/usr/bin/env node
/**
 * Los reportes y comentarios que la gente mandó desde La Copa (D-104), leídos de `feedback/` en
 * Firebase. Sin cuenta: el nodo se lee libre.
 *
 *   node tools/reportes.mjs              todos, del más nuevo al más viejo
 *   node tools/reportes.mjs --dias 3     solo los de los últimos 3 días
 *   node tools/reportes.mjs --json       tal cual, para procesarlos
 */
import { firebaseConfig } from '../assets/js/firebase-config.js';

const args = process.argv.slice(2);
const dias = Number(args[args.indexOf('--dias') + 1]) || (args.includes('--dias') ? 1 : 0);
const res = await fetch(`${firebaseConfig.databaseURL}/feedback.json`);
if (!res.ok) {
  console.error(`No se pudo leer feedback/ (HTTP ${res.status}). ¿Están publicadas las reglas nuevas? Ver firebase/README.md.`);
  process.exit(1);
}
const todo = Object.entries((await res.json()) || {}).map(([id, r]) => ({ id, ...r }));
const desde = dias ? Date.now() - dias * 864e5 : 0;
const lista = todo.filter(r => (r.at || 0) >= desde).sort((a, b) => (b.at || 0) - (a.at || 0));
if (args.includes('--json')) { console.log(JSON.stringify(lista, null, 2)); process.exit(0); }
if (!lista.length) { console.log(dias ? `Sin reportes en los últimos ${dias} días.` : 'Sin reportes todavía.'); process.exit(0); }
const fecha = ms => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
console.log(`${lista.length} reporte(s)${dias ? ` en los últimos ${dias} días` : ''}\n`);
for (const r of lista) {
  let ctx = {};
  try { ctx = JSON.parse(r.contexto || '{}'); } catch (_) { /* nada */ }
  const donde = [ctx.copa && `copa ${ctx.copa}`, ctx.dia && `día ${ctx.dia}`, ctx.juego, ctx.semilla && `semilla ${ctx.semilla}`, ctx.pantalla].filter(Boolean).join(' · ');
  console.log(`── ${r.at ? fecha(r.at) : '(sin fecha)'} · ${r.nombre || 'anónimo'} · v${r.v || '?'}`);
  if (donde) console.log(`   ${donde}`);
  console.log(`   ${String(r.texto || '').replace(/\n/g, '\n   ')}`);
  if (ctx.navegador) console.log(`   (${ctx.navegador.slice(0, 90)})`);
  console.log('');
}
