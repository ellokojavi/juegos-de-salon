#!/usr/bin/env node
/**
 * Borra las copias de trabajo (worktrees) cuya rama ya entró a `main` (D-206, D-218). Con el
 * auto-merge (D-216) un PR se fusiona solo, sin que la sesión que lo abrió se entere: esto corre al
 * empezar cada sesión de Claude Code (hook SessionStart en .claude/settings.json) y deja una sola
 * carpeta `juegos-de-salon`, más las copias con trabajo en curso.
 *
 *   node tools/agents/limpiar-copias.mjs           # borra las fusionadas y cuenta qué quedó
 *   node tools/agents/limpiar-copias.mjs --ver     # solo dice qué borraría
 *   node tools/agents/limpiar-copias.mjs --hook    # igual que sin nada, en una línea (para la sesión)
 *
 * Nunca toca la carpeta principal, la copia desde donde se corre, las que maneja la app de Claude
 * (`.claude/worktrees/`) ni una copia con cambios sin commitear: esas se nombran y se dejan. Una
 * rama cuenta como fusionada si su último commit ya está en `origin/main` y entró por un merge (una
 * rama recién creada, sin commits propios, no cuenta).
 */
import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { realpathSync } from 'node:fs';

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

/** Qué hacer con cada copia: 'principal', 'propia', 'app', 'separada', 'sucia', 'abierta' o 'borrar'. */
export function clasificar(copias, { aqui, fusionada, sucia }) {
  return copias.map((c, i) => {
    let que;
    if (i === 0) que = 'principal';
    else if (real(c.ruta) === real(aqui)) que = 'propia';
    else if (c.ruta.includes(`${sep}.claude${sep}worktrees${sep}`)) que = 'app';
    else if (c.separada || !c.rama) que = 'separada';
    else if (!fusionada(c.rama)) que = 'abierta';
    else if (sucia(c.ruta)) que = 'sucia';
    else que = 'borrar';
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
  const plan = clasificar(copias, { aqui, fusionada, sucia });

  const borradas = [];
  for (const c of plan.filter(x => x.que === 'borrar')) {
    if (VER) { borradas.push(c); continue; }
    const ok = intenta(() => { git(raiz, 'worktree', 'remove', c.ruta); git(raiz, 'branch', '-D', c.rama); return true; });
    if (ok) borradas.push(c);
  }
  if (!VER) intenta(() => git(raiz, 'worktree', 'prune'));

  const nombre = c => `${c.ruta.split(sep).pop()} (${c.rama || 'sin rama'})`;
  const sucias = plan.filter(c => c.que === 'sucia');
  const abiertas = plan.filter(c => c.que === 'abierta');
  if (HOOK) {
    const partes = [];
    if (borradas.length) partes.push(`borré ${borradas.length} copia(s) ya fusionada(s): ${borradas.map(nombre).join(', ')}`);
    if (sucias.length) partes.push(`ojo: fusionadas pero con cambios sin commitear: ${sucias.map(nombre).join(', ')}`);
    if (abiertas.length) partes.push(`en curso: ${abiertas.map(nombre).join(', ')}`);
    if (partes.length) console.log(`Copias de trabajo (D-218): ${partes.join(' · ')}.`);
    return;
  }
  console.log(VER ? 'Borraría:' : 'Borradas:', borradas.length ? '' : 'ninguna');
  for (const c of borradas) console.log(`  ✓ ${nombre(c)}`);
  if (sucias.length) { console.log('Fusionadas, pero con cambios sin commitear (se dejan; mirarlas antes de borrar):'); for (const c of sucias) console.log(`  ⚠️  ${c.ruta}`); }
  if (abiertas.length) { console.log('En curso (su rama no está en main):'); for (const c of abiertas) console.log(`  · ${nombre(c)}`); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { main(); } catch (e) {
    // En el hook, nunca frena la sesión: si algo falla, lo dice y sigue
    if (HOOK) console.log(`Copias de trabajo (D-218): no pude revisarlas (${String(e.message).split('\n')[0]}).`);
    else { console.error(e.message); process.exit(1); }
  }
}
