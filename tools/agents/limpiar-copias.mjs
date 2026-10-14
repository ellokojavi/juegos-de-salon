#!/usr/bin/env node
/**
 * Borra las copias de trabajo (worktrees) que ya no se usan (D-206, D-218, D-252). Con el
 * auto-merge (D-216) un PR se fusiona solo, sin que la sesión que lo abrió se entere: esto corre al
 * empezar cada sesión de Claude Code (hook SessionStart en .claude/settings.json) y deja una sola
 * carpeta `juegos-de-salon`, más las copias con trabajo en curso. Se borran:
 *
 * - las **fusionadas**: su rama entró a `main` por un merge;
 * - las **vacías**: sin commits propios ni cambios, creadas hace más de un día;
 * - las **abandonadas**: con commits que no están en `main`, sin PR abierto y sin moverse hace
 *   más de tres días. Antes de borrarlas, su rama se sube a GitHub: el trabajo no se pierde y se
 *   retoma con `git worktree add ../juegos-de-salon-<tema> <rama>`.
 *
 * La **basura de pruebas** no cuenta como cambio (D-315): una carpeta sin seguimiento en la raíz de
 * la copia con nombre de argumento perdido (`undefined/`, `null/`, `--parte/`…) y dentro solo
 * perfiles de Chrome y capturas. La dejaba un guion de `tools/e2e/` corrido sin carpeta de salida
 * (hoy `tools/e2e/salida.mjs` lo impide). Al borrar la copia, se borra con ella.
 *
 * Y las **ramas locales sin copia** (D-315), que se acumulaban de a decenas en la carpeta
 * principal: se borran las que ya entraron a `main` y las que no tienen rama en GitHub (la
 * remota se borró al fusionar, o nunca se subió) pero cuyos commits están todos en GitHub. Una con
 * commits que no están en GitHub se nombra y se deja (no se sube: podría ser historia vieja, de
 * antes de reescribirla). Nunca `main`, la rama de una copia viva ni la de un PR abierto; sin `gh`
 * solo se borran las que ya entraron a `main`.
 *
 *   node tools/agents/limpiar-copias.mjs           # borra las fusionadas, vacías y abandonadas, y cuenta qué quedó
 *   node tools/agents/limpiar-copias.mjs --ver     # solo dice qué borraría
 *   node tools/agents/limpiar-copias.mjs --hook    # igual que sin nada, en una línea (para la sesión)
 *
 * Vale también para las copias de la app de Claude (`.claude/worktrees/`). Nunca toca la carpeta
 * principal, la copia desde donde se corre, una copia con cambios sin commitear ni una con PR
 * abierto: esas se nombran y se dejan. Sin `gh` (no se sabe qué PR están abiertos) no se da nada
 * por abandonado.
 */
import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { realpathSync, statSync, readdirSync, rmSync } from 'node:fs';
import { esCarpeta } from '../e2e/salida.mjs';

const args = process.argv.slice(2);
const VER = args.includes('--ver');
const HOOK = args.includes('--hook');

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const intenta = f => { try { return f(); } catch (_) { return null; } };
/** La ruta sin enlaces simbólicos (en macOS, /var es /private/var): así se compara la copia propia. */
const real = p => intenta(() => realpathSync(p)) || resolve(p);

/** `git worktree list --porcelain` → [{ ruta, rama, separada }]; la primera es la principal. */
export function leerCopias(texto) {
  const out = [];
  let actual = null;
  for (const linea of String(texto).split('\n')) {
    if (linea.startsWith('worktree ')) { actual = { ruta: linea.slice(9), rama: null, separada: false }; out.push(actual); }
    else if (linea.startsWith('branch ') && actual) actual.rama = linea.slice(7).replace(/^refs\/heads\//, '');
    else if (linea === 'detached' && actual) actual.separada = true;
  }
  return out;
}

/** Lo que deja un guion de punta a punta: capturas, videos y datos sueltos. */
const ARCHIVO_DE_PRUEBA = /\.(png|jpe?g|webm|json|txt|log)$/i;

/**
 * ¿Es basura de pruebas esta carpeta sin seguimiento? Solo si su nombre es un argumento perdido
 * (`undefined`, `null`, uno que empieza con `-`) y todo lo de adentro son perfiles de Chrome
 * (una carpeta con `Local State`) o archivos de prueba. Cualquier otra cosa la hace real.
 */
export function esBasura(ruta, nombre) {
  if (esCarpeta(nombre)) return false;
  const solo = d => {
    const hay = intenta(() => readdirSync(d, { withFileTypes: true }));
    if (!hay) return false;
    if (hay.some(e => e.name === 'Local State' && e.isFile())) return true; // un perfil de Chrome, entero
    return hay.every(e => e.isDirectory() ? solo(resolve(d, e.name)) : e.isFile() && ARCHIVO_DE_PRUEBA.test(e.name));
  };
  return solo(resolve(ruta, nombre));
}

/** `git status --porcelain` → { reales, basura }: la basura son carpetas sin seguimiento de la raíz. */
export function leerEstado(texto, ruta, basura = esBasura) {
  const reales = [], tiradas = [];
  for (const linea of String(texto).split('\n').filter(Boolean)) {
    const m = /^\?\? ([^/]+)\/$/.exec(linea);
    if (m && basura(ruta, m[1])) tiradas.push(m[1]); else reales.push(linea);
  }
  return { reales, basura: tiradas };
}

/**
 * Qué hacer con cada rama local: 'main', 'en-copia', 'abierta' (PR abierto), 'fusionada' (borrar),
 * 'sin-remota' (sin rama en GitHub y todo subido: borrar), 'sin-subir' (commits que solo están
 * aquí: se deja y se nombra), 'en-github' (tiene su rama en GitHub: se deja) o 'sin-saber' (sin gh).
 */
export function clasificarRamas(ramas, { enCopia, fusionada, conPr = () => null, enGithub, sinSubir }) {
  return ramas.map(rama => {
    let que;
    if (rama === 'main') que = 'main';
    else if (enCopia(rama)) que = 'en-copia';
    else if (conPr(rama)) que = 'abierta';
    else if (fusionada(rama)) que = 'fusionada';
    else if (conPr(rama) === null) que = 'sin-saber';
    else if (enGithub(rama)) que = 'en-github';
    else que = sinSubir(rama) > 0 ? 'sin-subir' : 'sin-remota';
    return { rama, que };
  });
}

export const DIAS_VACIA = 1;
export const DIAS_ABANDONADA = 3;

/**
 * Qué hacer con cada copia: 'principal', 'propia', 'separada', 'sucia' (fusionada con cambios),
 * 'abierta', 'borrar' (fusionada), 'vacia' o 'abandonada'. `propios(rama)` son sus commits que no
 * están en `origin/main`; `dias(copia)`, cuánto lleva sin moverse; `conPr(rama)`, si tiene un PR
 * abierto (`null` si no se sabe).
 */
export function clasificar(copias, { aqui, fusionada, sucia, propios = () => 1, dias = () => 0, conPr = () => null }) {
  return copias.map((c, i) => {
    let que;
    if (i === 0) que = 'principal';
    else if (real(c.ruta) === real(aqui)) que = 'propia';
    else if (c.separada || !c.rama) que = 'separada';
    else if (fusionada(c.rama)) que = sucia(c.ruta) ? 'sucia' : 'borrar';
    else if (sucia(c.ruta) || conPr(c.rama)) que = 'abierta';
    else if (propios(c.rama) === 0) que = dias(c) >= DIAS_VACIA ? 'vacia' : 'abierta';
    // Sin saber qué PR están abiertos, nada se da por abandonado
    else if (conPr(c.rama) === null) que = 'abierta';
    else que = dias(c) >= DIAS_ABANDONADA ? 'abandonada' : 'abierta';
    return { ...c, que };
  });
}

function main() {
  const aqui = process.cwd();
  const comun = resolve(aqui, git(aqui, 'rev-parse', '--git-common-dir'));
  const raiz = resolve(comun, '..');
  // Sin red, se usa el origin/main que ya hay: a lo más se borra menos
  // --prune: así se sabe qué ramas ya no están en GitHub
  intenta(() => git(raiz, 'fetch', '-q', '--prune', 'origin'));
  const copias = leerCopias(git(raiz, 'worktree', 'list', '--porcelain'));
  // Fusionada = su último commit está en origin/main, pero no en la línea principal: entró por un
  // merge. Una rama recién creada desde main (sin commits propios) también "está en main", y no se
  // borra: es el trabajo que otra sesión está empezando.
  const principal = new Set((intenta(() => git(raiz, 'rev-list', '--first-parent', 'origin/main')) || '').split('\n'));
  const fusionada = rama => {
    const punta = intenta(() => git(raiz, 'rev-parse', rama));
    if (!punta || principal.has(punta)) return false;
    return intenta(() => { git(raiz, 'merge-base', '--is-ancestor', rama, 'origin/main'); return true; }) === true;
  };
  const estados = new Map();
  const estado = ruta => {
    if (!estados.has(ruta)) {
      const texto = intenta(() => git(ruta, 'status', '--porcelain'));
      estados.set(ruta, texto == null ? { reales: ['?'], basura: [] } : leerEstado(texto, ruta));
    }
    return estados.get(ruta);
  };
  const sucia = ruta => estado(ruta).reales.length > 0;
  const propios = rama => Number(intenta(() => git(raiz, 'rev-list', '--count', `origin/main..${rama}`)) ?? 1);
  // Sin moverse desde: su último commit propio o, si es más nueva, la creación de la copia (su
  // HEAD privado en .git/worktrees/<nombre>, que cambia también al cambiar de rama). Una vacía
  // cuenta solo desde que se creó: su último commit es el de main.
  const dias = c => {
    const commit = propios(c.rama) ? 1000 * Number(intenta(() => git(raiz, 'log', '-1', '--format=%ct', c.rama)) || 0) : 0;
    const head = intenta(() => statSync(resolve(git(c.ruta, 'rev-parse', '--absolute-git-dir'), 'HEAD')));
    // Solo mtime: git escribe HEAD al crear la copia, y la fecha de creación (birthtime) no se
    // puede retroceder en Linux, así que la prueba no podría envejecer una copia
    const creada = head ? head.mtimeMs : Date.now();
    return (Date.now() - Math.max(commit, creada)) / 864e5;
  };
  // LIMPIAR_PRS_ABIERTOS="rama1,rama2" reemplaza a gh (en la prueba)
  const abiertos = process.env.LIMPIAR_PRS_ABIERTOS != null ? new Set(process.env.LIMPIAR_PRS_ABIERTOS.split(',').filter(Boolean)) : intenta(() => new Set(execFileSync('gh', ['pr', 'list', '--state', 'open', '--limit', '200', '--json', 'headRefName', '-q', '.[].headRefName'],
    { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }).split('\n').filter(Boolean)));
  const conPr = rama => (abiertos ? abiertos.has(rama) : null);
  const plan = clasificar(copias, { aqui, fusionada, sucia, propios, dias, conPr });

  const borradas = [], guardadas = [];
  for (const c of plan.filter(x => ['borrar', 'vacia', 'abandonada'].includes(x.que))) {
    if (VER) { (c.que === 'abandonada' ? guardadas : borradas).push(c); continue; }
    // La abandonada se sube antes a GitHub; si no se puede, se deja
    if (c.que === 'abandonada' && !intenta(() => { git(raiz, 'push', '-q', 'origin', `${c.rama}:refs/heads/${c.rama}`); return true; })) continue;
    // La basura de pruebas se va con la copia: sin ella, `worktree remove` no la suelta
    for (const n of estado(c.ruta).basura) intenta(() => rmSync(resolve(c.ruta, n), { recursive: true, force: true }));
    const ok = intenta(() => { git(raiz, 'worktree', 'remove', c.ruta); git(raiz, 'branch', '-D', c.rama); return true; });
    if (ok) (c.que === 'abandonada' ? guardadas : borradas).push(c);
  }
  if (!VER) intenta(() => git(raiz, 'worktree', 'prune'));

  // Las ramas locales sin copia (D-315)
  const vivas = new Set(leerCopias(git(raiz, 'worktree', 'list', '--porcelain')).map(c => c.rama).filter(Boolean));
  const remotas = new Set((intenta(() => git(raiz, 'for-each-ref', 'refs/remotes/origin', '--format=%(refname:short)')) || '').split('\n').filter(Boolean));
  const ramas = (intenta(() => git(raiz, 'for-each-ref', 'refs/heads', '--format=%(refname:short)')) || '').split('\n').filter(Boolean);
  const planRamas = clasificarRamas(ramas, {
    enCopia: r => vivas.has(r),
    fusionada: r => intenta(() => { git(raiz, 'merge-base', '--is-ancestor', r, 'origin/main'); return true; }) === true,
    conPr,
    enGithub: r => remotas.has(`origin/${r}`),
    sinSubir: r => Number(intenta(() => git(raiz, 'rev-list', '--count', r, '--not', '--remotes=origin')) ?? 1),
  });
  const ramasBorradas = [];
  for (const r of planRamas.filter(x => x.que === 'fusionada' || x.que === 'sin-remota')) {
    if (VER || intenta(() => { git(raiz, 'branch', '-D', r.rama); return true; })) ramasBorradas.push(r.rama);
  }
  const sinSubir = planRamas.filter(r => r.que === 'sin-subir').map(r => r.rama);
  const conBasura = plan.filter(c => estado(c.ruta).basura.length && ['borrar', 'vacia', 'abandonada'].includes(c.que));

  const nombre = c => `${c.ruta.split(sep).pop()} (${c.rama || 'sin rama'})`;
  const sucias = plan.filter(c => c.que === 'sucia');
  const abiertas = plan.filter(c => c.que === 'abierta');
  if (HOOK) {
    const partes = [];
    if (borradas.length) partes.push(`borré ${borradas.length} copia(s) fusionada(s) o vacía(s): ${borradas.map(nombre).join(', ')}`);
    if (guardadas.length) partes.push(`borré ${guardadas.length} copia(s) abandonada(s), con su rama subida a GitHub: ${guardadas.map(nombre).join(', ')}`);
    if (sucias.length) partes.push(`ojo: fusionadas pero con cambios sin commitear: ${sucias.map(nombre).join(', ')}`);
    if (abiertas.length) partes.push(`en curso: ${abiertas.map(nombre).join(', ')}`);
    if (conBasura.length) partes.push(`con basura de pruebas (${conBasura.map(c => estado(c.ruta).basura.join(', ')).join('; ')}), que se fue con la copia`);
    if (ramasBorradas.length) partes.push(`borré ${ramasBorradas.length} rama(s) local(es) ya fusionada(s) o sin rama en GitHub: ${ramasBorradas.join(', ')}`);
    if (sinSubir.length) partes.push(`ramas con commits que no están en GitHub (se dejan): ${sinSubir.join(', ')}`);
    if (partes.length) console.log(`Copias de trabajo (D-252): ${partes.join(' · ')}.`);
    return;
  }
  console.log(VER ? 'Borraría:' : 'Borradas:', borradas.length ? '' : 'ninguna');
  for (const c of borradas) console.log(`  ✓ ${nombre(c)}`);
  if (guardadas.length) { console.log(VER ? 'Abandonadas (subiría su rama a GitHub y las borraría):' : 'Abandonadas (su rama quedó en GitHub):'); for (const c of guardadas) console.log(`  ✓ ${nombre(c)}`); }
  if (sucias.length) { console.log('Fusionadas, pero con cambios sin commitear (se dejan; mirarlas antes de borrar):'); for (const c of sucias) console.log(`  ⚠️  ${c.ruta}`); }
  if (abiertas.length) { console.log('En curso (su rama no está en main):'); for (const c of abiertas) console.log(`  · ${nombre(c)}`); }
  for (const c of plan.filter(x => estado(x.ruta).basura.length)) console.log(`Basura de pruebas en ${c.ruta.split(sep).pop()}: ${estado(c.ruta).basura.join(', ')} (no cuenta como cambio${conBasura.includes(c) ? (VER ? '; se borraría con la copia' : '; se borró con la copia') : ''})`);
  console.log(VER ? 'Ramas locales que borraría:' : 'Ramas locales borradas:', ramasBorradas.length ? ramasBorradas.join(', ') : 'ninguna');
  if (sinSubir.length) console.log(`Ramas con commits que no están en GitHub (se dejan; mirarlas): ${sinSubir.join(', ')}`);
  const quedan = planRamas.filter(r => ['abierta', 'en-github', 'sin-saber'].includes(r.que));
  if (quedan.length) console.log(`Ramas que quedan: ${quedan.map(r => `${r.rama} (${{ abierta: 'PR abierto', 'en-github': 'su rama sigue en GitHub', 'sin-saber': 'sin gh, no sé si tiene PR' }[r.que]})`).join(', ')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { main(); } catch (e) {
    // En el hook, nunca frena la sesión: si algo falla, lo dice y sigue
    if (HOOK) console.log(`Copias de trabajo (D-252): no pude revisarlas (${String(e.message).split('\n')[0]}).`);
    else { console.error(e.message); process.exit(1); }
  }
}
