#!/usr/bin/env node
/**
 * La memoria y las comprobaciones del agente de documentación (D-172). Lo usa el agente en su
 * ronda diaria y lo puede correr cualquier sesión antes de proponer una fusión.
 *
 *   node tools/agents/documentar.mjs revisar [--desde <commit>]   # qué entró y qué falta documentar
 *   node tools/agents/documentar.mjs anotar --hasta <commit> [--pr <url>] [--pendiente "texto"]…
 *   node tools/agents/documentar.mjs historial                    # las rondas anteriores y lo pendiente
 *
 * `revisar` parte del commit guardado en docs/documentacion.json (o de `--desde`), lista lo que
 * entró a main y comprueba lo que se puede comprobar sin leer prosa:
 *   - cada D-n citado en el repo existe en docs/DECISIONES.md, y ninguno está dos veces;
 *   - las decisiones van en orden y sin huecos (un número vacío se anota "(número sin usar)");
 *   - cada decisión tiene un Estado de los cuatro (D-213), y lo que su Estado cita existe;
 *   - si una decisión cambia, corrige o reemplaza a otra, el Estado de la otra la nombra;
 *   - ningún ID de docs/REQUERIMIENTOS.md ni U-n de docs/USABILIDAD.md está dos veces;
 *   - las rutas entre comillas invertidas de las guías (no de la historia) existen;
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

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MEMORIA = join(RAIZ, 'docs/documentacion.json');

/* ------------------------------------------------------------------ */
/* Comprobaciones puras (las prueba tools/agents/documentar.test.mjs)         */
/* ------------------------------------------------------------------ */

/**
 * Los números de decisión que tienen su título "## D-n" en DECISIONES.md, los repetidos, los que
 * faltan entre D-1 y el más alto, y los que llegan fuera de orden (`[n, el anterior]`).
 */
export function decisionesEscritas(decisiones) {
  const vistos = new Set(), repetidos = new Set(), desordenados = [];
  let anterior = 0;
  for (const m of decisiones.matchAll(/^## D-(\d+)\b/gm)) {
    const n = Number(m[1]);
    if (vistos.has(n)) repetidos.add(n);
    else if (n < anterior) desordenados.push([n, anterior]);
    vistos.add(n);
    anterior = Math.max(anterior, n);
  }
  const huecos = [];
  for (let i = 1; i < anterior; i++) if (!vistos.has(i)) huecos.push(i);
  return { escritas: vistos, repetidos: [...repetidos].sort((a, b) => a - b), huecos, desordenados };
}

/** Los IDs repetidos de una lista, en el orden en que se repiten. */
const repetidosDe = ids => [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

/** Los IDs de REQUERIMIENTOS.md (la primera columna, `| RP-01 |`) que están en más de una fila. */
export const requerimientosRepetidos = texto => repetidosDe([...texto.matchAll(/^\|\s*([A-Z]+-\d+[a-z]?)\s*\|/gm)].map(m => m[1]));

/** Las reglas de USABILIDAD.md (`**U-n · …`) definidas dos veces. */
export const usabilidadRepetidas = texto => repetidosDe([...texto.matchAll(/\*\*U-(\d+[a-z]?) ·/g)].map(m => `U-${m[1]}`));

/** Cada "## D-n · título" con su Estado y su Relación (null si no los tiene). */
export function entradas(decisiones) {
  const partes = decisiones.split(/^(?=## D-\d+\b)/m).filter(p => p.startsWith('## D-'));
  return partes.map(p => {
    const [titulo] = p.split('\n');
    const campo = nombre => { const m = p.match(new RegExp(`\\*\\*${nombre}:\\*\\*[ \\t]*([^\\n]*?)[ \\t]*(?: · \\*\\*|$)`, 'm')); return m ? m[1] : null; };
    return { n: Number(titulo.match(/D-(\d+)/)[1]), titulo, sinUsar: /\(número sin usar\)/.test(titulo), estado: campo('Estado'), relacion: campo('Relación') };
  });
}

/** El Estado, si es uno de los cuatro de D-213: `{ tipo, por }`, con los D-n que lo corrigen o reemplazan. */
export function leerEstado(estado) {
  if (estado === 'vigente' || estado === 'derogada') return { tipo: estado, por: [] };
  const m = (estado || '').match(/^(corregida|reemplazada) por (D-\d+(?:, D-\d+)*)$/);
  return m ? { tipo: m[1], por: [...m[2].matchAll(/D-(\d+)/g)].map(x => Number(x[1])) } : null;
}

/**
 * Las decisiones que una Relación dice que cambia, corrige o reemplaza. Cuenta lo que viene después
 * del verbo hasta el verbo siguiente o el punto y coma: "corrige D-75 (el alto) y ajusta D-76" es
 * solo D-75; "D-176 cambia la invitación" no es nada (ahí D-176 es quien cambia).
 */
const VERBOS = /\b(cambia|corrige|reemplaza|amplía|ajusta|acota|completa|cierra|deroga|revisa|ordena|quita|saca|sube|es excepción)\b/;
export function corregidas(relacion) {
  const n = new Set();
  for (const clausula of (relacion || '').split(';')) {
    const trozos = clausula.split(new RegExp(VERBOS.source, 'g'));
    // split con un grupo deja [antes, verbo, después, verbo, después…]
    for (let i = 1; i < trozos.length; i += 2) {
      if (!/^(cambia|corrige|reemplaza)$/.test(trozos[i])) continue;
      for (const m of trozos[i + 1].matchAll(/\bD-(\d+)\b/g)) n.add(Number(m[1]));
    }
  }
  return [...n];
}

/** Lo que está mal en los Estados y Relaciones de DECISIONES.md (D-213). */
export function problemasDeEstado(decisiones) {
  const todas = entradas(decisiones), problemas = [];
  const porNumero = new Map(todas.map(e => [e.n, e]));
  for (const e of todas) {
    if (e.sinUsar) continue;
    const estado = leerEstado(e.estado);
    if (e.estado === null) problemas.push(`D-${e.n} no tiene **Estado:** en docs/DECISIONES.md`);
    else if (!estado) problemas.push(`D-${e.n} tiene un Estado que no es de los cuatro: "${e.estado}"`);
    else for (const x of estado.por) if (!porNumero.has(x) || porNumero.get(x).sinUsar) problemas.push(`D-${e.n} está ${estado.tipo} por D-${x}, que no existe`);
    for (const x of corregidas(e.relacion)) {
      const otra = porNumero.get(x);
      if (!otra || otra.sinUsar || x === e.n) continue;
      const suyo = leerEstado(otra.estado);
      if (!suyo || !['corregida', 'reemplazada'].includes(suyo.tipo) || !suyo.por.includes(e.n)) {
        problemas.push(`D-${e.n} cambia, corrige o reemplaza D-${x}, y el Estado de D-${x} no la nombra ("${otra.estado}")`);
      }
    }
  }
  return problemas;
}

/**
 * Las rutas del repo citadas entre comillas invertidas: empiezan por una carpeta del repo y no son
 * moldes (`<carpeta>`, `*`, `{a,b}`, `…`) ni frases. Sin `:línea`, `#ancla` ni `?consulta`. Los
 * bloques de código no cuentan: ahí van comandos, no citas.
 */
const CARPETAS = /^(public|tools|docs|firebase|marketing|\.github|\.claude)\//;
export const rutasCitadas = texto => [...new Set([...texto.replace(/```[\s\S]*?```/g, '').matchAll(/`([^`\n]+)`/g)]
  .map(m => m[1])
  .filter(r => CARPETAS.test(r) && !/[\s<*{…]/.test(r))
  .map(r => r.replace(/[?#].*$/, '').replace(/:\d.*$/, '')))];

/** Los D-n citados en un texto. */
export const decisionesCitadas = texto => new Set([...texto.matchAll(/\bD-(\d+)\b/g)].map(m => Number(m[1])));

/** Lo que falta de `lista` en `texto` (por nombre de archivo, con o sin ruta). */
// Un guion de punta a punta se nombra desde tools/e2e/ ("hangman/local.mjs"); los demás, por su ruta o su nombre
const corto = f => (f.startsWith('tools/e2e/') ? f.slice('tools/e2e/'.length) : f.split('/').pop());
export const sinMencionar = (lista, texto) => lista.filter(f => !texto.includes(f) && !texto.includes(corto(f)));

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

/**
 * Cierra una ronda: avanza hasta dónde se revisó y reemplaza lo pendiente. Si la última ronda ya
 * llegó a ese mismo commit, es la misma ronda: se completa (el link del PR, que se sabe después de
 * abrirlo) en vez de duplicarse, y lo pendiente solo cambia si se anota algo.
 */
export function anotarRonda(memoria, { fecha, desde, hasta, pr = null, pendientes = [] }) {
  const rondas = memoria.rondas || [];
  const ultima = rondas.at(-1);
  if (ultima && ultima.hasta === hasta) {
    const suyos = pendientes.length ? pendientes : ultima.pendientes || [];
    return {
      ...memoria,
      revisadoHasta: hasta,
      pendientes: pendientes.length ? pendientes : memoria.pendientes || [],
      rondas: [...rondas.slice(0, -1), { ...ultima, pr: pr || ultima.pr, pendientes: suyos }],
    };
  }
  return {
    ...memoria,
    revisadoHasta: hasta,
    pendientes,
    rondas: [...rondas, { fecha, desde, hasta, pr, pendientes }].slice(-60),
  };
}

/** Lo que muestra `revisar`: una ronda mira main desde la memoria; un PR, su rama desde la base. */
export const rango = ({ desde, memoria, main, head }) => (desde
  ? { inicio: desde, punta: head, donde: 'esta rama' }
  : { inicio: memoria.revisadoHasta, punta: main, donde: 'main' });

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

  // Numeración, Estados y correcciones sin marcar (D-213)
  const { huecos, desordenados } = decisionesEscritas(leer('docs/DECISIONES.md'));
  // Un número que falta aquí puede ser el de un PR abierto (CLAUDE.md, D-135): ese no es un hueco
  const ramas = git('for-each-ref', '--format=%(refname)', 'refs/remotes').split('\n').filter(r => r && !r.endsWith('/HEAD'));
  const enOtraRama = n => { try { return !!git('grep', '-l', '-E', `^## D-[0]*${n} `, ...ramas, '--', 'docs/DECISIONES.md'); } catch (_) { return false; } };
  for (const n of huecos.filter(n => !enOtraRama(n))) problemas.push(`D-${n} falta en docs/DECISIONES.md: un número que no se usó se anota "## D-${n} · (número sin usar)"`);
  for (const [n, antes] of desordenados) problemas.push(`D-${n} está fuera de orden en docs/DECISIONES.md (viene después de D-${antes})`);
  problemas.push(...problemasDeEstado(leer('docs/DECISIONES.md')));

  // IDs repetidos
  for (const id of requerimientosRepetidos(leer('docs/REQUERIMIENTOS.md'))) problemas.push(`${id} está en más de una fila de docs/REQUERIMIENTOS.md`);
  for (const id of usabilidadRepetidas(leer('docs/USABILIDAD.md'))) problemas.push(`${id} está dos veces en docs/USABILIDAD.md`);

  // Rutas que no existen, en las guías de hoy (DECISIONES, CHANGELOG y REQUERIMIENTOS son historia)
  const guias = archivos.filter(f => /^(CLAUDE\.md|CONTRIBUTING\.md|docs\/(CANONES|AGREGAR-JUEGO|USABILIDAD|PANEL)\.md|docs\/games\/[^/]+\.md|\.claude\/agents\/[^/]+\.md)$/.test(f));
  for (const f of guias) {
    for (const r of rutasCitadas(leer(f))) if (!existsSync(join(RAIZ, r))) problemas.push(`${f} cita \`${r}\`, que no existe`);
  }

  // Guiones de punta a punta que su README no nombra
  const guiones = archivos.filter(f => /^tools\/e2e\/.+\.mjs$/.test(f) && !/cdp\.mjs$/.test(f));
  for (const f of sinMencionar(guiones, leer('tools/e2e/README.md'))) problemas.push(`el guion ${f} no está en tools/e2e/README.md`);

  // La versión publicada tiene su entrada
  const version = versionDe(leer('public/index.html'));
  if (version && !changelogTiene(leer('CHANGELOG.md'), version)) problemas.push(`la versión ${version} no tiene entrada en CHANGELOG.md`);

  return problemas;
}

function revisar(desde) {
  const m = leerMemoria();
  // Con --desde es el modo PR: lo que trae esta rama desde su base, no lo que entró a main
  const { inicio: pedido, punta, donde } = rango({ desde, memoria: m, main: puntaMain(), head: git('rev-parse', 'HEAD') });
  const inicio = pedido ? git('rev-parse', pedido) : null;
  if (m.pendientes?.length) {
    console.log('Pendiente de la ronda anterior:');
    for (const p of m.pendientes) console.log(`  · ${p}`);
    console.log('');
  }
  if (inicio) {
    const log = git('log', '--first-parent', '--format=%h %ad %s', '--date=short', `${inicio}..${punta}`);
    console.log(log ? `Entró a ${donde} desde ${inicio.slice(0, 7)}:\n${log.split('\n').map(l => `  ${l}`).join('\n')}\n` : `Nada nuevo en ${donde} desde ${inicio.slice(0, 7)}.\n`);
    if (log) {
      const tocados = git('diff', '--stat=120', `${inicio}..${punta}`).split('\n').slice(-1)[0];
      console.log(`  (${tocados.trim()})\n`);
    }
  } else console.log('Primera ronda: no hay commit guardado. Revisa desde donde corresponda con --desde.\n');
  const { nuevos, viejos } = separar(comprobar(), m.conocidos);
  if (nuevos.length) {
    console.log('Falta documentar:');
    for (const p of nuevos) console.log(`  ✗ ${p}`);
  } else console.log('✓ Decisiones, IDs, rutas, guiones y CHANGELOG al día.');
  if (viejos.length) {
    console.log('\nYa conocidos (esperan al dueño, en "conocidos" de docs/documentacion.json):');
    for (const p of viejos) console.log(`  · ${p}`);
  }
  if (!desde) console.log(`\nAl cerrar la ronda: node tools/agents/documentar.mjs anotar --hasta ${punta.slice(0, 7)} [--pendiente "…"], y con el PR abierto: anotar --hasta ${punta.slice(0, 7)} --pr <url>`);
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
    : (console.error('Uso: node tools/agents/documentar.mjs revisar [--desde <commit>] | anotar --hasta <commit> [--pr <url>] [--pendiente "…"] | historial'), 2);
  process.exit(codigo);
}
