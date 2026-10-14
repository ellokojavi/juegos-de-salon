#!/usr/bin/env node
/**
 * El feedback 🐞 como issues de GitHub (D-275): cada reporte que la gente manda desde La Copa o
 * el laboratorio (`feedback/` en Firebase, D-104, D-191, D-265) se vuelve un issue con la etiqueta
 * `feedback`, y el agente de procesos lo atiende en su ronda. Lo corre cada 15 minutos
 * `.github/workflows/feedback.yml`: así cada reporte le llega por correo al dueño y queda enlazado
 * con su respuesta y su arreglo.
 *
 *   node tools/agents/feedback.mjs sincronizar [--simular]   # crea los issues que faltan
 *
 * El repo es público: el issue lleva el texto tal cual, el juego, la versión y la pantalla, pero
 * el nombre que puso el jugador, para que el dueño le haga seguimiento (D-279), pero no su
 * navegador. Cada issue lleva
 * `<!-- feedback:<id> -->`, así un reporte nunca se sube dos veces, aunque su issue esté cerrado.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';

export const ETIQUETA = 'feedback';
const REPO = process.env.GITHUB_REPOSITORY || 'ellokojavi/juegos-de-salon';
const SITIO = 'https://juegosdesalon.cl';

/* ------------------------------------------------------------------ */
/* Lo puro (lo prueba tools/agents/feedback.test.mjs)                 */
/* ------------------------------------------------------------------ */

export const marca = id => `<!-- feedback:${id} -->`;

/** Los ids de reporte que ya tienen issue, leídos de los cuerpos. */
export const subidos = issues => new Set(issues.flatMap(i => [...(i.body || '').matchAll(/<!-- feedback:([^\s>]+) -->/g)].map(m => m[1])));

/** Los reportes sin issue, del más viejo al más nuevo (así los números de issue siguen el orden). */
export const pendientes = (reportes, ya) => reportes.filter(r => r.id && !ya.has(r.id) && String(r.texto || '').trim()).sort((a, b) => (a.at || 0) - (b.at || 0));

const contexto = r => { try { return JSON.parse(r.contexto || '{}') || {}; } catch { return {}; } };

/** Dónde se escribió, en pocas palabras: el juego o la página. */
export function donde(r) {
  const c = contexto(r);
  return c.juego || (c.labs && `lab ${c.labs}`) || (c.copa && `cup ${c.copa}`) || c.pantalla || c.url || 'the app';
}

/** Un @ o un # del jugador no menciona a nadie ni enlaza nada. */
const inerte = t => String(t).replace(/@/g, '@​').replace(/#(\d)/g, '#​$1');

export function titulo(r) {
  const t = inerte(String(r.texto).replace(/\s+/g, ' ').trim());
  return `🐞 ${donde(r)}: ${t.length > 70 ? `${t.slice(0, 69)}…` : t}`;
}

/** El cuerpo: el texto tal cual, quién lo mandó y el contexto, sin el navegador. */
export function cuerpo(r) {
  const c = contexto(r);
  const fecha = r.at ? new Date(r.at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'no date';
  const datos = [
    ['Who', r.nombre && String(r.nombre).trim()], ['Lab key', r.tester && String(r.tester).trim()], ['Game', c.juego], ['Lab', c.labs], ['Cup', c.copa], ['Day', c.dia], ['Seed', c.semilla],
    ['Result', c.resumen ?? c.puntaje], ['Mistakes', c.errores], ['Hints', c.ayudas], ['Time', c.tiempo],
    ['Page', c.url && (String(c.url).startsWith('/') ? `${SITIO}${c.url}` : c.url)], ['Screen', c.pantalla], ['Window size', c.pantallaTam], ['Version', r.v && `v${r.v}`], ['Date', fecha],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');
  return [
    inerte(String(r.texto).trim()).split('\n').map(l => `> ${l}`).join('\n'),
    '',
    datos.map(([k, v]) => `- **${k}:** ${inerte(v)}`).join('\n'),
    '',
    'Sent with the app\'s 🐞 button (D-275). The processes agent handles it in its round.',
    marca(r.id),
  ].join('\n');
}

/* ------------------------------------------------------------------ */

const gh = (...args) => execFileSync('gh', [...args, '-R', REPO], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

async function sincronizar(simular) {
  const res = await fetch(`${firebaseConfig.databaseURL}/feedback.json`);
  if (!res.ok) throw new Error(`No se pudo leer feedback/ (HTTP ${res.status}).`);
  const reportes = Object.entries((await res.json()) || {}).map(([id, r]) => ({ id, ...r }));
  const issues = JSON.parse(gh('issue', 'list', '--label', ETIQUETA, '--state', 'all', '--limit', '1000', '--json', 'body'));
  const nuevos = pendientes(reportes, subidos(issues));
  if (!nuevos.length) return console.log(`Nada nuevo (${reportes.length} reporte(s), todos con issue).`);
  if (simular) { for (const r of nuevos) console.log(`${titulo(r)}\n${cuerpo(r)}\n`); return; }
  const hay = JSON.parse(gh('label', 'list', '--limit', '200', '--json', 'name')).some(l => l.name === ETIQUETA);
  if (!hay) gh('label', 'create', ETIQUETA, '--color', 'd93f0b', '--description', 'Reporte 🐞 de un jugador (D-275)');
  for (const r of nuevos) console.log(gh('issue', 'create', '--title', titulo(r), '--label', ETIQUETA, '--body', cuerpo(r)).trim());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [orden] = process.argv.slice(2);
  if (orden !== 'sincronizar') { console.error('Uso: node tools/agents/feedback.mjs sincronizar [--simular]'); process.exit(2); }
  sincronizar(process.argv.includes('--simular')).catch(e => { console.error(e.message); process.exit(1); });
}
