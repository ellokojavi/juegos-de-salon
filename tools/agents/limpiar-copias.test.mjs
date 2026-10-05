// Ejecutar: node tools/agents/limpiar-copias.test.mjs
// Borrar las copias de trabajo ya fusionadas (D-218), en un repositorio de prueba de verdad.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerCopias, clasificar } from './limpiar-copias.mjs';

const GUION = join(dirname(fileURLToPath(import.meta.url)), 'limpiar-copias.mjs');

// El formato de git worktree list --porcelain
const copias = leerCopias('worktree /r/main\nHEAD a\nbranch refs/heads/main\n\nworktree /r/x\nHEAD b\nbranch refs/heads/tema\n\nworktree /r/y\nHEAD c\ndetached\n');
assert.deepEqual(copias, [
  { ruta: '/r/main', rama: 'main', separada: false },
  { ruta: '/r/x', rama: 'tema', separada: false },
  { ruta: '/r/y', rama: null, separada: true },
]);
const plan = clasificar([...copias, { ruta: '/r/main/.claude/worktrees/w', rama: 'w', separada: false }], { aqui: '/r/main', fusionada: () => true, sucia: () => false });
assert.deepEqual(plan.map(c => c.que), ['principal', 'borrar', 'separada', 'app']);

// Un repositorio de verdad: un origin, la carpeta principal y cuatro copias
const base = mkdtempSync(join(tmpdir(), 'limpiar-'));
const g = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  const origen = join(base, 'origen.git');
  g(base, 'init', '-q', '--bare', '-b', 'main', origen);
  const raiz = join(base, 'juegos');
  g(base, 'clone', '-q', origen, raiz);
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 't'], ['commit.gpgsign', 'false']]) g(raiz, 'config', k, v);
  writeFileSync(join(raiz, 'a.txt'), 'a');
  g(raiz, 'add', '.'); g(raiz, 'commit', '-qm', 'uno'); g(raiz, 'push', '-q', 'origin', 'main');
  const copia = (nombre, rama, commit) => {
    const ruta = join(base, nombre);
    g(raiz, 'worktree', 'add', '-q', ruta, '-b', rama);
    if (commit) { writeFileSync(join(ruta, `${rama}.txt`), rama); g(ruta, 'add', '.'); g(ruta, 'commit', '-qm', rama); }
    return ruta;
  };
  const fusionada = copia('juegos-fusionada', 'fusionada', true);
  const enCurso = copia('juegos-en-curso', 'en-curso', true);
  const sucia = copia('juegos-sucia', 'sucia', true);
  // Recién creada desde main, sin commits propios: es trabajo que empieza, no se borra
  const nueva = copia('juegos-nueva', 'nueva', false);
  // La app de Claude crea las suyas dentro de .claude/worktrees: no se tocan
  mkdirSync(join(raiz, '.claude', 'worktrees'), { recursive: true });
  const app = join(raiz, '.claude', 'worktrees', 'app');
  g(raiz, 'worktree', 'add', '-q', app, '-b', 'app');
  // Se fusionan en main con commit de merge, como el botón de GitHub (--merge), y se suben
  g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'fusionada'); g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'sucia'); g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'app');
  g(raiz, 'push', '-q', 'origin', 'main');
  writeFileSync(join(sucia, 'pendiente.txt'), 'sin commitear');

  const ver = execFileSync('node', [GUION, '--ver'], { cwd: raiz, encoding: 'utf8' });
  assert.match(ver, /juegos-fusionada \(fusionada\)/);
  assert.ok(existsSync(fusionada), '--ver no borra nada');

  const salida = execFileSync('node', [GUION, '--hook'], { cwd: raiz, encoding: 'utf8' });
  assert.match(salida, /borré 1 copia\(s\) ya fusionada\(s\): juegos-fusionada/);
  assert.match(salida, /cambios sin commitear: juegos-sucia/);
  assert.match(salida, /en curso: juegos-en-curso/);
  assert.ok(!existsSync(fusionada), 'la fusionada se borró');
  assert.ok(!g(raiz, 'branch', '--list', 'fusionada'), 'y su rama también');
  assert.ok(existsSync(enCurso) && existsSync(sucia) && existsSync(app), 'las demás quedan');
  assert.ok(existsSync(nueva), 'la recién creada, sin commits, queda');
  assert.match(salida, /en curso: .*juegos-nueva/);

  // Desde dentro de una copia, esa copia no se borra aunque esté fusionada
  g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'en-curso'); g(raiz, 'push', '-q', 'origin', 'main');
  execFileSync('node', [GUION, '--hook'], { cwd: enCurso, encoding: 'utf8' });
  assert.ok(existsSync(enCurso), 'la copia desde donde se corre no se borra');
  // Fuera de un repositorio, el hook no frena la sesión
  const fuera = execFileSync('node', [GUION, '--hook'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.match(fuera, /no pude revisarlas/);
} finally {
  rmSync(base, { recursive: true, force: true });
}

console.log('limpiar-copias: ok');
