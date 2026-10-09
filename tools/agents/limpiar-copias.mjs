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
import { realpathSync, statSync } from 'node:fs';

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
  intenta(() => git(raiz, 'fetch', '-q', 'origin', 'main'));
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
  const sucia = ruta => (intenta(() => git(ruta, 'status', '--porcelain')) ?? 'x') !== '';
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
    const ok = intenta(() => { git(raiz, 'worktree', 'remove', c.ruta); git(raiz, 'branch', '-D', c.rama); return true; });
    if (ok) (c.que === 'abandonada' ? guardadas : borradas).push(c);
  }
  if (!VER) intenta(() => git(raiz, 'worktree', 'prune'));

  const nombre = c => `${c.ruta.split(sep).pop()} (${c.rama || 'sin rama'})`;
  const sucias = plan.filter(c => c.que === 'sucia');
  const abiertas = plan.filter(c => c.que === 'abierta');
  if (HOOK) {
    const partes = [];
    if (borradas.length) partes.push(`borré ${borradas.length} copia(s) fusionada(s) o vacía(s): ${borradas.map(nombre).join(', ')}`);
    if (guardadas.length) partes.push(`borré ${guardadas.length} copia(s) abandonada(s), con su rama subida a GitHub: ${guardadas.map(nombre).join(', ')}`);
    if (sucias.length) partes.push(`ojo: fusionadas pero con cambios sin commitear: ${sucias.map(nombre).join(', ')}`);
    if (abiertas.length) partes.push(`en curso: ${abiertas.map(nombre).join(', ')}`);
    if (partes.length) console.log(`Copias de trabajo (D-252): ${partes.join(' · ')}.`);
    return;
  }
  console.log(VER ? 'Borraría:' : 'Borradas:', borradas.length ? '' : 'ninguna');
  for (const c of borradas) console.log(`  ✓ ${nombre(c)}`);
  if (guardadas.length) { console.log(VER ? 'Abandonadas (subiría su rama a GitHub y las borraría):' : 'Abandonadas (su rama quedó en GitHub):'); for (const c of guardadas) console.log(`  ✓ ${nombre(c)}`); }
  if (sucias.length) { console.log('Fusionadas, pero con cambios sin commitear (se dejan; mirarlas antes de borrar):'); for (const c of sucias) console.log(`  ⚠️  ${c.ruta}`); }
  if (abiertas.length) { console.log('En curso (su rama no está en main):'); for (const c of abiertas) console.log(`  · ${nombre(c)}`); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { main(); } catch (e) {
    // En el hook, nunca frena la sesión: si algo falla, lo dice y sigue
    if (HOOK) console.log(`Copias de trabajo (D-252): no pude revisarlas (${String(e.message).split('\n')[0]}).`);
    else { console.error(e.message); process.exit(1); }
  }
}
