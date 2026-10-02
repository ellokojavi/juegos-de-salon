#!/usr/bin/env node
/**
 * La memoria y las comprobaciones del agente de documentación (D-172). Lo usa el agente en su
 * ronda diaria y lo puede correr cualquier sesión antes de proponer una fusión.
 *
 *   node tools/documentar.mjs revisar [--desde <commit>]   # qué entró y qué falta documentar
 *   node tools/documentar.mjs anotar --hasta <commit> [--pr <url>] [--pendiente "texto"]…
 *   node tools/documentar.mjs historial                    # las rondas anteriores y lo pendiente
 *
 * `revisar` parte del commit guardado en docs/documentacion.json (o de `--desde`), lista lo que
 * entró a main y comprueba lo que se puede comprobar sin leer prosa:
 *   - cada D-n citado en el repo existe en docs/DECISIONES.md, y ninguno está dos veces;
 *   - cada `*.test.mjs` y `*.test.py` aparece en CLAUDE.md;
 *   - cada guion de tools/e2e/ aparece en tools/e2e/README.md;
 *   - la versión publicada tiene su entrada en CHANGELOG.md.
 * Lo demás (que la prosa diga lo que el código hace) lo lee el agente. Sale con 1 si algo falta.
 *
 * `anotar` cierra una ronda: guarda hasta dónde se revisó, el PR y lo que quedó pendiente, que la
 * ronda siguiente muestra primero. Así el agente recuerda lo que no alcanzó a hacer.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MEMORIA = join(RAIZ, 'docs/documentacion.json');

/* ------------------------------------------------------------------ */
/* Comprobaciones puras (las prueba tools/documentar.test.mjs)         */
/* ------------------------------------------------------------------ */

/** Los números de decisión que tienen su título "## D-n" en DECISIONES.md, y los repetidos. */
export function decisionesEscritas(decisiones) {
  const vistos = new Set(), repetidos = new Set();
  for (const m of decisiones.matchAll(/^## D-(\d+)\b/gm)) {
    const n = Number(m[1]);
    if (vistos.has(n)) repetidos.add(n);
    vistos.add(n);
  }
  return { escritas: vistos, repetidos: [...repetidos].sort((a, b) => a - b) };
}

/** Los D-n citados en un texto. */
export const decisionesCitadas = texto => new Set([...texto.matchAll(/\bD-(\d+)\b/g)].map(m => Number(m[1])));

/** Lo que falta de `lista` en `texto` (por nombre de archivo, con o sin ruta). */
export const sinMencionar = (lista, texto) => lista.filter(f => !texto.includes(f) && !texto.includes(f.split('/').pop()));

/** ¿CHANGELOG.md tiene la entrada "## <versión>"? */
export const changelogTiene = (changelog, version) => new RegExp(`^## ${version.replace(/\./g, '\\.')}\\b`, 'm').test(changelog);

/** La versión estampada en el importmap de la portada (`?v=0.81.0`). */
export const versionDe = html => (html.match(/\?v=(\d+\.\d+\.\d+)/) || [])[1] || null;

/** Una memoria vacía, para la primera ronda. */
export const memoriaNueva = () => ({ revisadoHasta: null, pendientes: [], conocidos: [], rondas: [] });

/** Separa lo nuevo de lo ya conocido: `conocidos` son problemas anotados que esperan al dueño. */
export const separar = (problemas, conocidos = []) => ({
  nuevos: problemas.filter(p => !conocidos.includes(p)),
  viejos: problemas.filter(p => conocidos.includes(p)),
});

/** Cierra una ronda: avanza hasta dónde se revisó y reemplaza lo pendiente. */
export function anotarRonda(memoria, { fecha, desde, hasta, pr = null, pendientes = [] }) {
  return {
    ...memoria,
    revisadoHasta: hasta,
    pendientes,
    rondas: [...(memoria.rondas || []), { fecha, desde, hasta, pr, pendientes }].slice(-60),
  };
}

/* ------------------------------------------------------------------ */
/* Con el repo                                                         */
/* ------------------------------------------------------------------ */

const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim();
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

export function leerMemoria() {
  if (!existsSync(MEMORIA)) return memoriaNueva();
  const m = JSON.parse(readFileSync(MEMORIA, 'utf8'));
  return { ...memoriaNueva(), ...m };
}
const guardarMemoria = m => writeFileSync(MEMORIA, JSON.stringify(m, null, 2) + '\n');

/** La punta de main: la remota si existe (lo que está publicado), si no la local. */
function puntaMain() {
  for (const r of ['origin/main', 'main']) { try { return git('rev-parse', r); } catch (_) { /* la siguiente */ } }
  return git('rev-parse', 'HEAD');
}

/** Todo lo que se puede comprobar sin leer prosa. Devuelve una lista de problemas. */
export function comprobar() {
  const problemas = [];
  const archivos = git('ls-files').split('\n');
  const textos = archivos.filter(f => /\.(js|mjs|py|md|json|html|css)$/.test(f) && !f.startsWith('docs/screenshots/'));

  // Decisiones citadas que no existen, y repetidas
  const { escritas, repetidos } = decisionesEscritas(leer('docs/DECISIONES.md'));
  for (const n of repetidos) problemas.push(`D-${n} está dos veces en docs/DECISIONES.md`);
  const faltan = new Map();
  for (const f of textos) {
    for (const n of decisionesCitadas(leer(f))) if (!escritas.has(n)) faltan.set(n, [...(faltan.get(n) || []), f]);
  }
  for (const [n, fs] of [...faltan].sort((a, b) => a[0] - b[0])) problemas.push(`D-${n} se cita (${fs.slice(0, 3).join(', ')}${fs.length > 3 ? '…' : ''}) y no está en docs/DECISIONES.md`);

  // Pruebas que CLAUDE.md no nombra
  const pruebas = archivos.filter(f => /\.test\.(mjs|py)$/.test(f));
  for (const f of sinMencionar(pruebas, leer('CLAUDE.md'))) problemas.push(`la prueba ${f} no está en la lista de CLAUDE.md`);

  // Guiones de punta a punta que su README no nombra
  const guiones = archivos.filter(f => /^tools\/e2e\/[^/]+\.mjs$/.test(f) && !/cdp\.mjs$/.test(f));
  for (const f of sinMencionar(guiones, leer('tools/e2e/README.md'))) problemas.push(`el guion ${f} no está en tools/e2e/README.md`);

  // La versión publicada tiene su entrada
  const version = versionDe(leer('index.html'));
  if (version && !changelogTiene(leer('CHANGELOG.md'), version)) problemas.push(`la versión ${version} no tiene entrada en CHANGELOG.md`);

  return problemas;
}

function revisar(desde) {
  const m = leerMemoria();
  const inicio = desde || m.revisadoHasta;
  const punta = puntaMain();
  if (m.pendientes?.length) {
    console.log('Pendiente de la ronda anterior:');
    for (const p of m.pendientes) console.log(`  · ${p}`);
    console.log('');
  }
  if (inicio) {
    const log = git('log', '--first-parent', '--format=%h %ad %s', '--date=short', `${inicio}..${punta}`);
    console.log(log ? `Entró a main desde ${inicio.slice(0, 7)}:\n${log.split('\n').map(l => `  ${l}`).join('\n')}\n` : `Nada nuevo en main desde ${inicio.slice(0, 7)}.\n`);
    if (log) {
      const tocados = git('diff', '--stat=120', `${inicio}..${punta}`).split('\n').slice(-1)[0];
      console.log(`  (${tocados.trim()})\n`);
    }
  } else console.log('Primera ronda: no hay commit guardado. Revisa desde donde corresponda con --desde.\n');
  const { nuevos, viejos } = separar(comprobar(), m.conocidos);
  if (nuevos.length) {
    console.log('Falta documentar:');
    for (const p of nuevos) console.log(`  ✗ ${p}`);
  } else console.log('✓ Decisiones, pruebas, guiones y CHANGELOG al día.');
  if (viejos.length) {
    console.log('\nYa conocidos (esperan al dueño, en "conocidos" de docs/documentacion.json):');
    for (const p of viejos) console.log(`  · ${p}`);
  }
  console.log(`\nAl cerrar la ronda: node tools/documentar.mjs anotar --pr <url> --hasta ${punta.slice(0, 7)}`);
  return nuevos.length ? 1 : 0;
}

function anotar(args) {
  const valor = n => { const i = args.indexOf(n); return i < 0 ? null : args[i + 1]; };
  const pendientes = args.flatMap((a, i) => (a === '--pendiente' ? [args[i + 1]] : []));
  const m = leerMemoria();
  const hasta = valor('--hasta') ? git('rev-parse', valor('--hasta')) : puntaMain();
  const nueva = anotarRonda(m, { fecha: new Date().toISOString().slice(0, 10), desde: m.revisadoHasta, hasta, pr: valor('--pr'), pendientes });
  guardarMemoria(nueva);
  console.log(`Anotado: revisado hasta ${hasta.slice(0, 7)}${pendientes.length ? `, ${pendientes.length} pendiente(s)` : ''}. Va en el PR de la ronda.`);
  return 0;
}

function historial() {
  const m = leerMemoria();
  for (const r of m.rondas || []) console.log(`${r.fecha}  ${(r.desde || '—').slice(0, 7)}..${(r.hasta || '').slice(0, 7)}  ${r.pr || 'sin PR'}${r.pendientes?.length ? `  (${r.pendientes.length} pendiente/s)` : ''}`);
  if (!m.rondas?.length) console.log('Todavía no hay rondas anotadas.');
  if (m.pendientes?.length) { console.log('\nPendiente:'); for (const p of m.pendientes) console.log(`  · ${p}`); }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [orden, ...resto] = process.argv.slice(2);
  const i = resto.indexOf('--desde');
  const codigo = orden === 'revisar' ? revisar(i < 0 ? null : resto[i + 1])
    : orden === 'anotar' ? anotar(resto)
    : orden === 'historial' ? historial()
    : (console.error('Uso: node tools/documentar.mjs revisar [--desde <commit>] | anotar --hasta <commit> [--pr <url>] [--pendiente "…"] | historial'), 2);
  process.exit(codigo);
}
