// Los números de decisión (D-n) sin choques (D-301).
//
// Antes, cada sesión tomaba "el siguiente al más alto en main y en los PR abiertos" (D-135), y dos
// sesiones a la vez tomaban el mismo: 10 renumeraciones del 3 al 12 de octubre, con el número
// cambiado en el código, los commits y las guías. Ahora el número se reserva en GitHub antes de
// escribirlo: una rama `reserva/D-n` que se sube con `git push --force-with-lease=<rama>:` (vacío:
// "que no exista"), y GitHub la niega si ya existe. Dos sesiones a la vez nunca reciben el mismo.
//
// Y DECISIONES.md tiene su forma de fusionarse (`.gitattributes`: merge=decisiones): dos ramas que
// agregan decisiones distintas al final, o que tocan filas distintas del índice, se juntan solas
// al traer main. Si las dos cambian la misma decisión o la misma fila, queda el conflicto de
// siempre, para resolverlo a mano. GitHub no usa este driver (solo git, en la copia local).
//
// Uso:
//   node tools/agents/decision.mjs reservar [--cuantas n]   # reserva el siguiente libre y lo imprime
//   node tools/agents/decision.mjs siguiente               # cuál tocaría, sin reservarlo
//   node tools/agents/decision.mjs reservas                # las reservadas que todavía no están en main
//   node tools/agents/decision.mjs limpiar                 # borra las reservas que ya están en main
//   node tools/agents/decision.mjs instalar                # configura el driver en esta copia (reservar lo hace solo)
//   node tools/agents/decision.mjs driver %O %A %B         # lo llama git al fusionar DECISIONES.md
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = process.env.REPO || 'ellokojavi/juegos-de-salon';
const ARCHIVO = 'docs/DECISIONES.md';

/** Los números de los encabezados "## D-n" de un texto. */
export const numeros = texto => [...texto.matchAll(/^## D-[0]*(\d+)\b/gm)].map(m => Number(m[1]));
/** Los números de las líneas agregadas "+## D-n" de un diff. */
export const numerosAgregados = patch => [...(patch || '').matchAll(/^\+## D-[0]*(\d+)\b/gm)].map(m => Number(m[1]));
/** El siguiente libre: uno más que el más alto de todos. */
export const siguienteLibre = (...listas) => Math.max(0, ...listas.flat()) + 1;

/* ---------------------------- el driver ---------------------------- */

/** La cabeza (todo lo de antes de la primera decisión, con el índice) y las decisiones por número. */
export function partir(texto) {
  const partes = texto.split(/^(?=## D-\d+ )/m);
  const decisiones = new Map();
  for (const p of partes.slice(1)) {
    const n = Number(p.match(/^## D-[0]*(\d+)/)[1]);
    if (decisiones.has(n)) return null; // un número repetido: que lo vea una persona
    decisiones.set(n, p);
  }
  return { cabeza: partes[0], decisiones };
}

/** Las decisiones en orden, con una línea en blanco entre ellas y el archivo terminado en "\n". */
export function armar(cabeza, decisiones) {
  const orden = [...decisiones.keys()].sort((a, b) => a - b);
  return cabeza + orden.map((n, i) => {
    const d = decisiones.get(n), cuerpo = d.replace(/\n*$/, ''), fin = d.slice(cuerpo.length);
    return cuerpo + (i === orden.length - 1 ? '\n' : fin.length >= 2 ? fin : '\n\n');
  }).join('');
}

/** Fusión de tres versiones de un trozo: el cambio de un solo lado gana; los dos distintos, null. */
const tres = (o, a, b) => a === b ? a : a === o ? b : b === o ? a : null;

/** git merge-file sobre tres textos: `{ texto, limpio }`. */
function mergeFile(o, a, b) {
  const dir = mkdtempSync(join(tmpdir(), 'decisiones-'));
  try {
    const [fo, fa, fb] = ['base', 'nuestro', 'suyo'].map((n, i) => { const f = join(dir, n); writeFileSync(f, [o, a, b][i]); return f; });
    const r = spawnSync('git', ['merge-file', '-p', '-L', 'nuestro', '-L', 'base', '-L', 'suyo', fa, fo, fb], { encoding: 'utf8' });
    return { texto: r.stdout, limpio: r.status === 0 };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** La celda de una fila que es una lista de decisiones ("D-1, D-24"), o null. */
const lista = celda => /^\s*D-\d+(, D-\d+)*\s*$/.test(celda) ? celda.trim().split(', ') : null;

/**
 * Una fila de tabla cambiada en los dos lados: si lo único distinto son listas de decisiones, se
 * juntan (lo que un lado agregó y el otro no quitó), en orden. Si no, null.
 */
export function fila(o, a, b) {
  const [co, ca, cb] = [o, a, b].map(f => f.split('|'));
  if (co.length !== ca.length || co.length !== cb.length) return null;
  const celdas = [];
  for (let i = 0; i < co.length; i++) {
    const r = tres(co[i], ca[i], cb[i]);
    if (r !== null) { celdas.push(r); continue; }
    const [lo, la, lb] = [co[i], ca[i], cb[i]].map(lista);
    if (!lo || !la || !lb) return null;
    const quedan = [...new Set([...la, ...lb])].filter(x => !(lo.includes(x) && (!la.includes(x) || !lb.includes(x))));
    celdas.push(` ${quedan.sort((x, y) => Number(x.slice(2)) - Number(y.slice(2))).join(', ')} `);
  }
  return celdas.join('|');
}

/**
 * La cabeza (la introducción y el índice): las filas de tabla se fusionan por su primera celda (el
 * tema), y el resto, línea por línea. Dos lados que suman decisiones distintas a la misma fila se
 * juntan; dos que cambian otra cosa de la misma fila, o el mismo texto, no.
 */
export function fusionarCabeza(o, a, b) {
  const r = tres(o, a, b);
  if (r !== null) return r;
  const clave = l => /^\| /.test(l) && !/^\|\s*-/.test(l) ? `\u0000${l.split('|')[1].trim()}` : null;
  const desarmar = t => {
    const filas = new Map(), lineas = t.split('\n').map(l => { const k = clave(l); if (!k) return l; if (filas.has(k)) throw new Error('fila repetida'); filas.set(k, l); return k; });
    return { esqueleto: lineas.join('\n'), filas };
  };
  let po, pa, pb;
  try { [po, pa, pb] = [o, a, b].map(desarmar); } catch (_) { return null; }
  const esqueleto = tres(po.esqueleto, pa.esqueleto, pb.esqueleto) ?? (() => { const m = mergeFile(po.esqueleto, pa.esqueleto, pb.esqueleto); return m.limpio ? m.texto : null; })();
  if (esqueleto === null) return null;
  const filas = new Map();
  for (const k of new Set([...po.filas.keys(), ...pa.filas.keys(), ...pb.filas.keys()])) {
    const [fo, fa, fb] = [po, pa, pb].map(p => p.filas.get(k));
    let f = tres(fo, fa, fb);
    if (f === null && fo && fa && fb) f = fila(fo, fa, fb);
    if (f === null) return null;
    filas.set(k, f);
  }
  const lineas = [];
  for (const l of esqueleto.split('\n')) {
    if (!l.startsWith('\u0000')) { lineas.push(l); continue; }
    if (!filas.has(l)) return null; // una fila que el esqueleto nombra y nadie tiene
    if (filas.get(l) !== undefined) lineas.push(filas.get(l));
  }
  return lineas.join('\n');
}

/**
 * Fusiona DECISIONES.md por decisión: `{ texto, limpio }`. Una decisión nueva de cualquier lado entra
 * en su lugar; una cambiada de un solo lado, con ese cambio; el índice, fila por fila
 * (`fusionarCabeza`). Si los dos lados cambian lo mismo (la misma decisión, el mismo número para dos
 * decisiones distintas, otra cosa de la misma fila), no es limpio: el llamador cae al merge de
 * siempre, con sus marcas de conflicto.
 */
export function fusionar(base, nuestro, suyo) {
  const [o, a, b] = [base, nuestro, suyo].map(partir);
  if (!o || !a || !b) return { limpio: false };
  const cabeza = fusionarCabeza(o.cabeza, a.cabeza, b.cabeza);
  if (cabeza === null) return { limpio: false };
  const decisiones = new Map();
  for (const n of new Set([...o.decisiones.keys(), ...a.decisiones.keys(), ...b.decisiones.keys()])) {
    const r = tres(o.decisiones.get(n), a.decisiones.get(n), b.decisiones.get(n));
    if (r === null) return { limpio: false };
    if (r !== undefined) decisiones.set(n, r);
  }
  return { texto: armar(cabeza, decisiones), limpio: true };
}

/* ---------------------------- con GitHub ---------------------------- */

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const gh = (...args) => sh('gh', args);
const api = (ruta, ...extra) => JSON.parse(gh('api', ruta, ...extra) || 'null');

/** Las reservas en GitHub: `[{ n, ref }]`. */
const reservas = () => sh('git', ['ls-remote', 'origin', 'refs/heads/reserva/D-*']).split('\n').filter(Boolean)
  .map(l => { const ref = l.split('\t')[1]; return { n: Number(ref.split('/D-')[1]), ref }; }).filter(r => r.n);

/** Los números en main, en los PR abiertos y en las reservas. */
function ocupados() {
  sh('git', ['fetch', '-q', 'origin', 'main']);
  const main = numeros(sh('git', ['show', `origin/main:${ARCHIVO}`]));
  const prs = [];
  for (const pr of api(`repos/${REPO}/pulls?state=open&per_page=100`) || []) {
    const f = (api(`repos/${REPO}/pulls/${pr.number}/files?per_page=100`) || []).find(x => x.filename === ARCHIVO);
    if (!f) continue;
    let ns = numerosAgregados(f.patch);
    if (!f.patch) { try { ns = numeros(gh('api', `repos/${REPO}/contents/${ARCHIVO}?ref=${pr.head.sha}`, '-H', 'Accept: application/vnd.github.raw')); } catch (_) { /* sin acceso */ } }
    prs.push(...ns);
  }
  return { main, prs, reservas: reservas().map(r => r.n) };
}

/** Configura el driver de DECISIONES.md en esta copia (la config de git es de todas sus copias). */
export function instalar() {
  sh('git', ['config', 'merge.decisiones.name', 'DECISIONES.md, decisión por decisión (D-301)']);
  sh('git', ['config', 'merge.decisiones.driver', 'node tools/agents/decision.mjs driver %O %A %B']);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'driver') {
    // git: %O base, %A nuestro (aquí va el resultado), %B suyo. 0 si quedó limpio.
    const [fo, fa, fb] = args;
    const [o, a, b] = [fo, fa, fb].map(f => readFileSync(f, 'utf8'));
    const r = fusionar(o, a, b);
    if (r.limpio) { writeFileSync(fa, r.texto); process.exit(0); }
    const m = mergeFile(o, a, b);
    writeFileSync(fa, m.texto);
    process.exit(m.limpio ? 0 : 1);
  } else if (cmd === 'siguiente') {
    const oc = ocupados();
    console.log(`D-${siguienteLibre(oc.main, oc.prs, oc.reservas)} (main hasta D-${Math.max(...oc.main)}; PR abiertos: ${oc.prs.map(n => `D-${n}`).join(', ') || 'ninguno'}; reservas: ${oc.reservas.map(n => `D-${n}`).join(', ') || 'ninguna'})`);
  } else if (cmd === 'reservar') {
    const cuantas = Number(args.includes('--cuantas') ? args[args.indexOf('--cuantas') + 1] : 1);
    const oc = ocupados();
    const sha = sh('git', ['rev-parse', 'origin/main']).trim();
    let n = siguienteLibre(oc.main, oc.prs, oc.reservas);
    const mias = [];
    for (let intentos = 0; mias.length < cuantas; intentos++) {
      if (intentos > 50) { console.error(`✗ 50 números seguidos rechazados desde D-${n - 50}: algo más que reservas ajenas`); process.exit(1); }
      const ref = `refs/heads/reserva/D-${n}`;
      try { sh('git', ['push', '-q', `--force-with-lease=${ref}:`, 'origin', `${sha}:${ref}`]); mias.push(n); }
      catch (e) { if (!/stale info|already exists|rejected/.test(String(e.stderr || e.message))) { console.error(`✗ no se pudo reservar D-${n}: ${String(e.stderr || e.message).trim()}\n  En un fork, la decisión va como D-?? (D-189).`); process.exit(1); } }
      n++;
    }
    try { instalar(); } catch (_) { /* sin git */ }
    console.log(mias.map(x => `D-${x}`).join(' '));
  } else if (cmd === 'reservas' || cmd === 'limpiar') {
    sh('git', ['fetch', '-q', 'origin', 'main']);
    const enMain = new Set(numeros(sh('git', ['show', `origin/main:${ARCHIVO}`])));
    for (const r of reservas()) {
      if (cmd === 'limpiar' && enMain.has(r.n)) { sh('git', ['push', '-q', 'origin', '--delete', r.ref]); console.log(`D-${r.n}: ya está en main, reserva borrada`); }
      else if (!enMain.has(r.n)) console.log(`D-${r.n}: reservada, todavía no está en main`);
    }
  } else if (cmd === 'instalar') {
    instalar();
    console.log('driver de DECISIONES.md configurado (merge.decisiones)');
  } else {
    console.error('Uso: node tools/agents/decision.mjs reservar [--cuantas n] | siguiente | reservas | limpiar | instalar | driver %O %A %B');
    process.exit(1);
  }
}
