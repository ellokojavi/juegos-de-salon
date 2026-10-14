// El CHANGELOG por archivo (D-300): cada PR deja su entrada en `changelog/<rama>.md`, sin número, y
// la versión se asigna sola, en el orden en que los PR entran a `main`. Así dos PR abiertos ya no
// chocan en la primera línea de CHANGELOG.md (64 de 89 puestas al día del 3 al 12 de octubre).
//
// La versión de hoy = la primera entrada de CHANGELOG.md, subida una vez por cada entrada pendiente
// de changelog/, en el orden en que llegaron a main (el commit de main que agregó cada archivo:
// `git log --first-parent`). `publicar.yml` la estampa así; la ronda de procesos las junta en
// CHANGELOG.md con su número (`juntar`) en un PR, y la versión no cambia al juntarlas.
//
// Uso:
//   node tools/release/changelog.mjs nueva [parche|menor]   # crea changelog/<rama>.md para escribir
//   node tools/release/changelog.mjs version                # la versión de hoy (la que se publica)
//   node tools/release/changelog.mjs ver                    # las pendientes, con el número que les toca
//   node tools/release/changelog.mjs revisar [--base <ref>] # el formato; con --base, lo que trae el PR
//   node tools/release/changelog.mjs migrar [--base <ref>]  # una entrada vieja de CHANGELOG.md → changelog/
//   node tools/release/changelog.mjs juntar                 # las pendientes, a CHANGELOG.md (ronda de procesos)
//
// Una entrada:
//   nivel: parche          (parche, menor o mayor: cuánto sube la versión)
//
//   - **Qué cambió** para quien juega, en el tono de las anteriores.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const CARPETA = 'changelog';
export const NIVELES = ['parche', 'menor', 'mayor'];
const ENCABEZADO = /^## (\d+\.\d+\.\d+)\b/m;

/** X.Y.Z de la primera entrada de un CHANGELOG, o null. */
export const primeraVersion = texto => (ENCABEZADO.exec(texto) || [, null])[1];

/** La versión que sigue a `v` según el nivel. */
export function subir(v, nivel) {
  const [a, b, c] = v.split('.').map(Number);
  if (nivel === 'mayor') return `${a + 1}.0.0`;
  if (nivel === 'menor') return `${a}.${b + 1}.0`;
  return `${a}.${b}.${c + 1}`;
}

/** `{ nivel, cuerpo }` de una entrada, o `{ error }` si no se entiende. */
export function leerEntrada(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n');
  const i = lineas.findIndex(l => l.trim());
  const m = i < 0 ? null : lineas[i].trim().match(/^nivel:\s*(\S+)$/);
  if (!m) return { error: 'la primera línea tiene que ser "nivel: parche" (o menor, o mayor)' };
  if (!NIVELES.includes(m[1])) return { error: `nivel "${m[1]}" no existe: parche, menor o mayor` };
  const cuerpo = lineas.slice(i + 1).join('\n').trim();
  if (!/^- /m.test(cuerpo)) return { error: 'no tiene ninguna línea "- …" que cuente qué cambió' };
  if (ENCABEZADO.test(cuerpo)) return { error: 'no lleva "## X.Y.Z": el número se pone solo (D-300)' };
  return { nivel: m[1], cuerpo };
}

const git = (raiz, ...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const hoy = () => new Date().toISOString().slice(0, 10);

/** Los archivos de changelog/ que hay en la copia, sin el README. */
export const archivos = (raiz = RAIZ) => existsSync(join(raiz, CARPETA))
  ? readdirSync(join(raiz, CARPETA)).filter(f => f.endsWith('.md') && f !== 'README.md').map(f => `${CARPETA}/${f}`)
  : [];

/**
 * Las entradas pendientes en el orden en que llegaron a main: `[{ archivo, fecha }]`. Manda el commit
 * de la línea principal (`--first-parent`) que agregó cada archivo; en un PR, GitHub prueba un merge
 * con main como primer padre, así que la entrada del PR queda al final. Una que git no conoce (sin
 * commit todavía, o una copia sin historia) va al final, por nombre, con la fecha de hoy.
 */
export function ordenDeLlegada(raiz = RAIZ) {
  const hay = new Set(archivos(raiz));
  const orden = new Map();
  let log = '';
  try { log = git(raiz, 'log', '--first-parent', '--reverse', '--diff-filter=A', '--name-only', '--format=@@%cs', '--', `${CARPETA}/`); } catch (_) { /* sin git */ }
  let fecha = hoy();
  for (const l of log.split('\n')) {
    if (l.startsWith('@@')) fecha = l.slice(2);
    else if (hay.has(l)) { orden.delete(l); orden.set(l, fecha); } // si volvió a agregarse, vale la última vez
  }
  for (const f of [...hay].sort()) if (!orden.has(f)) orden.set(f, hoy());
  return [...orden].map(([archivo, fecha]) => ({ archivo, fecha }));
}

/** Las pendientes, leídas: `[{ archivo, fecha, nivel, cuerpo }]`, o `error` en las que no se entienden. */
export const pendientes = (raiz = RAIZ) => ordenDeLlegada(raiz)
  .map(e => ({ ...e, ...leerEntrada(readFileSync(join(raiz, e.archivo), 'utf8')) }));

/** El número de cada pendiente, sobre la primera versión del CHANGELOG. */
export function calcular(changelog, lista) {
  const base = primeraVersion(changelog);
  if (!base) throw new Error('CHANGELOG.md no tiene ninguna entrada "## X.Y.Z — fecha"');
  let v = base;
  const entradas = lista.filter(e => !e.error).map(e => ({ ...e, version: (v = subir(v, e.nivel)) }));
  return { base, entradas, version: v };
}

/** La versión de hoy: la que estampa publicar.yml (D-205, D-300). */
export const versionHoy = (raiz = RAIZ) => calcular(readFileSync(join(raiz, 'CHANGELOG.md'), 'utf8'), pendientes(raiz)).version;

/** El CHANGELOG con las entradas arriba, la más nueva primero. */
export function juntar(changelog, entradas) {
  const bloque = [...entradas].reverse().map(e => `## ${e.version} — ${e.fecha}\n${e.cuerpo}\n\n`).join('');
  const i = changelog.search(ENCABEZADO);
  return i < 0 ? changelog.trimEnd() + '\n\n' + bloque : changelog.slice(0, i) + bloque + changelog.slice(i);
}

/** Las entradas `## X.Y.Z` de `ahora` que no estaban en `antes`: `[{ version, fecha, cuerpo }]`. */
export function entradasNuevas(antes, ahora) {
  const ya = new Set([...antes.matchAll(/^## (\d+\.\d+\.\d+)\b/gm)].map(m => m[1]));
  const bloques = ahora.split(/^(?=## \d+\.\d+\.\d+\b)/m).slice(1);
  return bloques.map(b => {
    const [cab, ...resto] = b.split('\n');
    const [, version, fecha] = cab.match(/^## (\d+\.\d+\.\d+)(?:\s+—\s+(\S+))?/);
    return { version, fecha: fecha || hoy(), cuerpo: resto.join('\n').trim(), bloque: b };
  }).filter(e => !ya.has(e.version));
}

/** Cuánto subió `b` respecto de `a`. */
export const nivelEntre = (a, b) => {
  const [x, y] = [a, b].map(v => v.split('.').map(Number));
  return y[0] !== x[0] ? 'mayor' : y[1] !== x[1] ? 'menor' : 'parche';
};

/**
 * Lo que trae un PR respecto de su base: errores (frenan `pruebas`) y avisos.
 * - Una entrada nueva "## X.Y.Z" en CHANGELOG.md es de antes de D-300: se pasa a changelog/ con `migrar`.
 *   La excepción es el PR que las junta (borra las de changelog/ que pasa a CHANGELOG.md).
 * - Un PR que toca public/ sin entrada en changelog/ recibe un aviso, no un error: la ronda de
 *   usabilidad y los arreglos chicos pueden no tenerla.
 */
export function revisarPR({ changelogBase, changelogAhora, cambios }) {
  const errores = [], avisos = [];
  const juntando = cambios.some(c => c.estado === 'D' && c.archivo.startsWith(`${CARPETA}/`));
  const nuevas = entradasNuevas(changelogBase, changelogAhora);
  if (nuevas.length && !juntando) errores.push(`CHANGELOG.md trae ${nuevas.map(e => e.version).join(', ')}: desde D-300 la entrada va sin número en changelog/<rama>.md. Pásala con: node tools/release/changelog.mjs migrar`);
  const conEntrada = cambios.some(c => c.estado !== 'D' && c.archivo.startsWith(`${CARPETA}/`));
  if (!juntando && !conEntrada && cambios.some(c => c.archivo.startsWith('public/'))) avisos.push('el PR cambia public/ y no trae su entrada en changelog/ (node tools/release/changelog.mjs nueva)');
  return { errores, avisos };
}

/* ------------------------------------------------------------------ */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  const opcion = (n, porDefecto) => args.includes(n) ? args[args.indexOf(n) + 1] : porDefecto;
  const leer = f => readFileSync(join(RAIZ, f), 'utf8');
  const rama = () => git(RAIZ, 'rev-parse', '--abbrev-ref', 'HEAD').trim();
  const nombreDe = r => `${CARPETA}/${r.replace(/[^A-Za-z0-9._-]+/g, '-')}.md`;
  const enGit = (ref, f) => { try { return git(RAIZ, 'show', `${ref}:${f}`); } catch (_) { return ''; } };
  const superficial = () => { try { return git(RAIZ, 'rev-parse', '--is-shallow-repository').trim() === 'true'; } catch (_) { return false; } };

  if (cmd === 'version') {
    if (superficial() && archivos().length > 1) console.error('⚠️ copia sin historia completa: el orden de las entradas pendientes puede no ser el de main');
    console.log(versionHoy());
  } else if (cmd === 'ver') {
    const { base, entradas, version } = calcular(leer('CHANGELOG.md'), pendientes());
    console.log(`CHANGELOG.md: ${base}. Pendientes: ${entradas.length}. Versión de hoy: ${version}.`);
    for (const e of entradas) console.log(`\n### ${e.version} — ${e.fecha} (${e.archivo}, ${e.nivel})\n${e.cuerpo}`);
  } else if (cmd === 'nueva') {
    const nivel = args[0] || 'parche';
    if (!NIVELES.includes(nivel)) { console.error(`nivel: ${NIVELES.join(', ')}`); process.exit(1); }
    const r = rama();
    if (r === 'main' || r === 'HEAD') { console.error('en una rama de tema, no en main'); process.exit(1); }
    const f = nombreDe(r);
    if (existsSync(join(RAIZ, f))) { console.log(`ya existe: ${f}`); process.exit(0); }
    mkdirSync(join(RAIZ, CARPETA), { recursive: true });
    writeFileSync(join(RAIZ, f), `nivel: ${nivel}\n\n- **Qué cambió**, para quien juega.\n`);
    console.log(`escribe la entrada en ${f} (sin número: se pone al fusionar, D-300)`);
  } else if (cmd === 'revisar') {
    let mal = 0;
    for (const e of pendientes()) if (e.error) { console.log(`✗ ${e.archivo}: ${e.error}`); mal++; }
    // Contra el punto donde la rama salió de la base (en CI, HEAD^1 del merge de prueba es esa base)
    const base = opcion('--base') && git(RAIZ, 'merge-base', opcion('--base'), 'HEAD').trim();
    if (base) {
      const cambios = git(RAIZ, 'diff', '--name-status', '--no-renames', base, 'HEAD').split('\n').filter(Boolean)
        .map(l => { const [estado, archivo] = l.split('\t'); return { estado: estado[0], archivo }; });
      const { errores, avisos } = revisarPR({ changelogBase: enGit(base, 'CHANGELOG.md'), changelogAhora: leer('CHANGELOG.md'), cambios });
      for (const e of errores) { console.log(`✗ ${e}`); mal++; }
      for (const a of avisos) console.log(process.env.GITHUB_ACTIONS ? `::warning title=CHANGELOG::${a}` : `⚠️ ${a}`);
    }
    if (mal) process.exit(1);
    const { entradas, version } = calcular(leer('CHANGELOG.md'), pendientes());
    console.log(`✓ changelog/: ${entradas.length} entrada(s) pendiente(s); la versión de hoy sería ${version}`);
  } else if (cmd === 'migrar') {
    const base = opcion('--base') || git(RAIZ, 'merge-base', 'origin/main', 'HEAD').trim();
    const antes = enGit(base, 'CHANGELOG.md'), ahora = leer('CHANGELOG.md');
    const nuevas = entradasNuevas(antes, ahora);
    if (!nuevas.length) { console.log('CHANGELOG.md no trae entradas nuevas: nada que migrar'); process.exit(0); }
    const tope = primeraVersion(antes);
    const nivel = nuevas.map(e => nivelEntre(tope, e.version)).sort((a, b) => NIVELES.indexOf(b) - NIVELES.indexOf(a))[0];
    const f = nombreDe(rama());
    mkdirSync(join(RAIZ, CARPETA), { recursive: true });
    writeFileSync(join(RAIZ, f), `nivel: ${nivel}\n\n${[...nuevas].reverse().map(e => e.cuerpo).join('\n')}\n`);
    writeFileSync(join(RAIZ, 'CHANGELOG.md'), nuevas.reduce((t, e) => t.replace(e.bloque, ''), ahora));
    console.log(`${nuevas.map(e => e.version).join(', ')} → ${f} (nivel: ${nivel}). Revisa, haz commit y trae main: CHANGELOG.md ya no choca.`);
  } else if (cmd === 'juntar') {
    // La entrada de la rama que junta no es de main todavía: si se juntara, tomaría un número que
    // puede ser de otro PR que entre antes (pasó en la ronda del 14/10). Queda en changelog/
    const propia = nombreDe(rama());
    const lista = pendientes().filter(e => e.archivo !== propia);
    if (existsSync(join(RAIZ, propia))) console.log(`${propia} es de esta rama: queda sin número hasta que entre a main.`);
    const malas = lista.filter(e => e.error);
    if (malas.length) { for (const e of malas) console.error(`✗ ${e.archivo}: ${e.error}`); process.exit(1); }
    if (superficial()) { console.error('✗ copia sin historia completa: el orden no sería el de main (git fetch --unshallow)'); process.exit(1); }
    const { entradas, version } = calcular(leer('CHANGELOG.md'), lista);
    if (!entradas.length) { console.log('nada que juntar'); process.exit(0); }
    writeFileSync(join(RAIZ, 'CHANGELOG.md'), juntar(leer('CHANGELOG.md'), entradas));
    for (const e of entradas) unlinkSync(join(RAIZ, e.archivo));
    console.log(`${entradas.length} entrada(s) a CHANGELOG.md, hasta ${version}: la versión no cambia al fusionar esto.`);
  } else {
    console.error('Uso: node tools/release/changelog.mjs nueva [nivel] | version | ver | revisar [--base <ref>] | migrar [--base <ref>] | juntar');
    process.exit(1);
  }
}
