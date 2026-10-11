#!/usr/bin/env node
/**
 * La memoria y las señales del agente de procesos (D-273): el que cierra lo que quedó abierto y
 * convierte un error que se repite en un mecanismo que lo frena solo.
 *
 *   node tools/agents/procesos.mjs revisar                  # las señales de hoy
 *   node tools/agents/procesos.mjs decidir <archivo.json>   # abre el issue de decisiones de un toque
 *   node tools/agents/procesos.mjs patron <clave> "qué pasó" [--commit <sha>]   # anota una vez que se vio
 *   node tools/agents/procesos.mjs mecanismo <clave> "qué lo frena ahora" --pr <url>
 *   node tools/agents/procesos.mjs anotar --hasta <commit> [--issue <url>] [--pr <url>] [--nota "…"]
 *   node tools/agents/procesos.mjs historial
 *
 * `revisar` junta, sin opinar, lo que el agente tiene que mirar:
 *   - los PR abiertos que esperan: sin auto-merge, apilados sobre otra rama, con conflicto o en rojo;
 *   - los issues "main en rojo" cuando main ya está en verde (nadie los cerró);
 *   - la última corrida de cada workflow en main;
 *   - los dilemas de usabilidad que esperan al dueño hace más de tres días;
 *   - lo que la memoria del agente de documentación arrastra de una ronda a otra;
 *   - los commits de main desde la última ronda que arreglan algo que quedó atrás;
 *   - las decisiones que el dueño aprobó como "en cola" y siguen sin hacerse;
 *   - los patrones vistos dos veces o más que todavía no tienen mecanismo.
 *
 * `decidir` recibe `{ titulo, resumen, decisiones: [{ pregunta, contexto?, si: [acciones], no?: [acciones] }] }`
 * y abre un issue con una casilla Sí y una No por decisión; marcar una la cumple al instante
 * (tools/agents/aprobar.mjs, .github/workflows/aprobar.yml). Las acciones son las de la lista
 * cerrada de aprobar.mjs: preparar el trabajo antes, para que el Sí solo tenga que fusionarlo.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { invalida, casillas, hechas, leerAcciones, ETIQUETA } from './aprobar.mjs';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MEMORIA = join(RAIZ, 'docs/procesos.json');
const REPO = 'ellokojavi/juegos-de-salon';
const DIA = 24 * 3600 * 1000;

/** Los asuntos de commit que delatan algo que se atrasó o se olvidó. */
export const ARREGLO = /quedó atrás|quedaba atrás|atrasad|desactualizad|faltaba|se olvid|no se actualiz|(?<!Uno )al día con|estaba mal|corrige|arregla/i;

/* ------------------------------------------------------------------ */
/* Lo puro (lo prueban aprobar.test.mjs y procesos.test.mjs)          */
/* ------------------------------------------------------------------ */

/** El cuerpo del issue de decisiones: casillas `<!-- op:n:si -->` y el bloque de acciones al final. */
export function cuerpoDecisiones({ resumen = '', decisiones }) {
  if (!decisiones?.length) throw new Error('No hay decisiones.');
  const acciones = {}, partes = [];
  if (resumen) partes.push(resumen.trim(), '');
  partes.push('Marca **Sí** o **No**: se cumple apenas la marcas, y el resultado queda anotado al lado.', '');
  decisiones.forEach((d, i) => {
    const n = i + 1;
    for (const op of ['si', 'no']) {
      const lista = d[op]?.length ? d[op] : [{ tipo: 'nada' }];
      const mala = lista.map(invalida).find(Boolean);
      if (mala) throw new Error(`Decisión ${n}, ${op}: ${mala}`);
      acciones[`${n}:${op}`] = lista;
    }
    partes.push(`### ${n}. ${d.pregunta}`);
    if (d.contexto) partes.push(d.contexto.trim());
    partes.push(`- [ ] Sí <!-- op:${n}:si -->`, `- [ ] No <!-- op:${n}:no -->`, '');
  });
  partes.push(`<!-- acciones ${JSON.stringify(acciones)} -->`);
  return partes.join('\n');
}

/** Las decisiones aprobadas que piden trabajo a la ronda siguiente: `[{ id: "#n:d", tarea }]`. */
export function enCola(issues) {
  const res = [];
  for (const { number, body } of issues) {
    const acc = leerAcciones(body) || {}, marcadas = casillas(body), listas = hechas(body);
    for (const [op, lista] of Object.entries(acc)) {
      const [d] = op.split(':');
      if (!marcadas[op] || !listas.has(d)) continue;
      for (const a of lista) if (a.tipo === 'encolar') res.push({ id: `#${number}:${d}`, tarea: a.tarea });
    }
  }
  return res;
}

/** Lo que un PR abierto espera, o [] si nada: cada motivo, una frase. */
export function esperas(pr, ahora = Date.now()) {
  const m = [];
  const dias = Math.floor((ahora - Date.parse(pr.createdAt)) / DIA);
  if (pr.isDraft) return m;
  if (pr.baseRefName !== 'main') m.push(`apilado sobre ${pr.baseRefName}: no entra a main hasta que entre esa`);
  if (pr.mergeable === 'CONFLICTING') m.push('tiene conflicto con su base');
  const rojos = (pr.statusCheckRollup || []).filter(c => ['FAILURE', 'TIMED_OUT', 'CANCELLED'].includes(c.conclusion)).map(c => c.name);
  if (rojos.length) m.push(`en rojo: ${[...new Set(rojos)].join(', ')}`);
  if (!pr.autoMergeRequest && dias >= 1) m.push(`sin auto-merge hace ${dias} día${dias === 1 ? '' : 's'}`);
  return m;
}

/** Anota que un patrón se vio otra vez (o la primera). Devuelve cuántas veces va. */
export function anotarPatron(memoria, clave, que, { fecha, commit = null }) {
  let p = memoria.patrones.find(x => x.clave === clave);
  if (!p) memoria.patrones.push(p = { clave, que, vistos: [], mecanismo: null });
  if (!p.vistos.some(v => v.commit && v.commit === commit)) p.vistos.push({ fecha, que, commit });
  return p.vistos.length;
}

/* ------------------------------------------------------------------ */
/* Lo que lee el repo y GitHub                                         */
/* ------------------------------------------------------------------ */

const sh = (cmd, args) => execFileSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gh = (...args) => JSON.parse(sh('gh', [...args, '-R', REPO]));
const vacia = () => ({ revisadoHasta: null, patrones: [], mecanismos: [], colaHecha: [], rondas: [] });
export const leerMemoria = () => (existsSync(MEMORIA) ? { ...vacia(), ...JSON.parse(readFileSync(MEMORIA, 'utf8')) } : vacia());
const guardar = m => writeFileSync(MEMORIA, JSON.stringify(m, null, 2) + '\n');
const hoy = () => new Date().toISOString().slice(0, 10);

function revisar() {
  const m = leerMemoria();
  sh('git', ['fetch', '-q', 'origin', 'main']);
  const punta = sh('git', ['rev-parse', 'origin/main']).trim();
  const titulo = t => console.log(`\n## ${t}`);
  console.log(`# Procesos · ${hoy()} · main en ${punta.slice(0, 7)}${m.revisadoHasta ? ` · última ronda hasta ${m.revisadoHasta.slice(0, 7)}` : ' · primera ronda'}`);

  titulo('PR que esperan');
  const prs = gh('pr', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,createdAt,baseRefName,isDraft,mergeable,autoMergeRequest,statusCheckRollup,headRefName');
  let n = 0;
  for (const pr of prs) {
    const e = esperas(pr);
    if (e.length) { n++; console.log(`- #${pr.number} ${pr.title} (${pr.createdAt.slice(0, 10)}): ${e.join('; ')}`); }
  }
  if (!n) console.log('Ninguno.');

  titulo('Workflows en main');
  for (const w of ['publicar.yml', 'e2e.yml', 'avisos.yml']) {
    const [r] = gh('run', 'list', '--workflow', w, '--branch', 'main', '--limit', '1', '--json', 'conclusion,status,createdAt,url');
    console.log(`- ${w}: ${r ? `${r.conclusion || r.status} (${r.createdAt.slice(0, 16)})${r.conclusion === 'failure' ? ` ${r.url}` : ''}` : 'sin corridas'}`);
  }

  titulo('Issues');
  const issues = gh('issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,createdAt,labels,body');
  const verdeE2E = gh('run', 'list', '--workflow', 'e2e.yml', '--branch', 'main', '--status', 'completed', '--limit', '1', '--json', 'conclusion')[0]?.conclusion === 'success';
  for (const i of issues.filter(i => /^main en rojo/.test(i.title)))
    console.log(`- #${i.number} ${i.title} (${i.createdAt.slice(0, 10)})${verdeE2E ? ': main ya está en verde, se puede cerrar' : ': sigue en rojo'}`);
  const dilemas = issues.filter(i => i.labels.some(l => l.name === 'usabilidad') && Date.now() - Date.parse(i.createdAt) > 3 * DIA);
  for (const i of dilemas) console.log(`- dilema #${i.number} espera al dueño desde ${i.createdAt.slice(0, 10)}: ${i.title}`);
  if (!dilemas.length && !issues.some(i => /^main en rojo/.test(i.title))) console.log('Nada atrasado.');

  titulo('Lo que el agente de documentación arrastra');
  const doc = JSON.parse(readFileSync(join(RAIZ, 'docs/documentacion.json'), 'utf8'));
  const ultima = doc.rondas.at(-1);
  console.log(`Última ronda anotada: ${ultima?.fecha || 'ninguna'}.`);
  for (const p of doc.pendientes || []) console.log(`- ${p.slice(0, 220)}${p.length > 220 ? '…' : ''}`);

  titulo(`Commits que arreglan algo que quedó atrás${m.revisadoHasta ? ` (desde ${m.revisadoHasta.slice(0, 7)})` : ' (últimos 7 días)'}`);
  const rango = m.revisadoHasta ? [`${m.revisadoHasta}..origin/main`] : ['--since=7.days', 'origin/main'];
  const commits = sh('git', ['log', '--no-merges', '--format=%h %ad %s', '--date=short', ...rango]).split('\n').filter(l => ARREGLO.test(l));
  for (const c of commits) console.log(`- ${c}`);
  if (!commits.length) console.log('Ninguno.');

  titulo('Aprobado y en cola');
  const procesos = gh('issue', 'list', '--label', ETIQUETA, '--state', 'all', '--limit', '30', '--json', 'number,body');
  const cola = enCola(procesos).filter(c => !m.colaHecha.includes(c.id));
  for (const c of cola) console.log(`- ${c.id}: ${c.tarea}  (al terminar: anotar --cola ${c.id})`);
  if (!cola.length) console.log('Nada.');

  titulo('Patrones');
  for (const p of m.patrones) console.log(`- ${p.clave} · ${p.vistos.length} vez/veces · ${p.mecanismo ? `frenado: ${p.mecanismo.que}` : p.vistos.length >= 2 ? '⚠️ LISTO PARA MECANISMO' : 'en observación'}: ${p.que}`);
  if (!m.patrones.length) console.log('Todavía no hay.');

  console.log(`\nAl cerrar: node tools/agents/procesos.mjs anotar --hasta ${punta.slice(0, 7)} [--issue <url>] [--pr <url>] [--nota "…"]`);
}

function decidir(archivo) {
  if (!archivo) throw new Error('Uso: node tools/agents/procesos.mjs decidir <archivo.json>');
  const d = JSON.parse(readFileSync(archivo, 'utf8'));
  const cuerpo = cuerpoDecisiones(d);
  const hay = gh('label', 'list', '--limit', '200', '--json', 'name').some(l => l.name === ETIQUETA);
  if (!hay) sh('gh', ['label', 'create', ETIQUETA, '-R', REPO, '--color', '5319e7', '--description', 'Decisiones de un toque del agente de procesos (D-273)']);
  console.log(sh('gh', ['issue', 'create', '-R', REPO, '--title', d.titulo, '--label', ETIQUETA, '--body', cuerpo]).trim());
}

const valor = (args, flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };

function anotar(args) {
  const m = leerMemoria(), hasta = valor(args, '--hasta'), cola = valor(args, '--cola');
  if (cola) { if (!m.colaHecha.includes(cola)) m.colaHecha.push(cola); }
  if (hasta) {
    m.rondas.push({ fecha: hoy(), desde: m.revisadoHasta, hasta, issue: valor(args, '--issue'), pr: valor(args, '--pr'), nota: valor(args, '--nota') });
    m.revisadoHasta = hasta;
  }
  if (!hasta && !cola) throw new Error('Uso: anotar --hasta <commit> [--issue <url>] [--pr <url>] [--nota "…"] | anotar --cola <#n:d>');
  guardar(m);
  console.log('Anotado en docs/procesos.json.');
}

function principal([orden, ...args]) {
  const m = leerMemoria();
  switch (orden) {
    case 'revisar': return revisar();
    case 'decidir': return decidir(args[0]);
    case 'patron': {
      const [clave, que] = args;
      if (!clave || !que) throw new Error('Uso: patron <clave> "qué pasó" [--commit <sha>]');
      const veces = anotarPatron(m, clave, que, { fecha: hoy(), commit: valor(args, '--commit') });
      guardar(m);
      return console.log(`${clave}: ${veces} vez/veces.${veces >= 2 ? ' Ya merece un mecanismo.' : ''}`);
    }
    case 'mecanismo': {
      const [clave, que] = args, pr = valor(args, '--pr');
      const p = m.patrones.find(x => x.clave === clave);
      if (!p || !que || !pr) throw new Error('Uso: mecanismo <clave existente> "qué lo frena" --pr <url>');
      p.mecanismo = { fecha: hoy(), que, pr };
      m.mecanismos.push({ fecha: hoy(), clave, que, pr });
      guardar(m);
      return console.log(`${clave}: frenado por ${que}.`);
    }
    case 'anotar': return anotar(args);
    case 'historial':
      for (const r of m.rondas) console.log(`${r.fecha} · ${r.desde?.slice(0, 7) || '—'}..${r.hasta.slice(0, 7)}${r.issue ? ` · ${r.issue}` : ''}${r.pr ? ` · ${r.pr}` : ''}${r.nota ? ` · ${r.nota}` : ''}`);
      for (const x of m.mecanismos) console.log(`mecanismo ${x.fecha} · ${x.clave}: ${x.que} (${x.pr})`);
      return;
    default:
      console.error('Uso: node tools/agents/procesos.mjs revisar | decidir <archivo.json> | patron <clave> "…" | mecanismo <clave> "…" --pr <url> | anotar --hasta <commit> | historial');
      process.exit(2);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { principal(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
