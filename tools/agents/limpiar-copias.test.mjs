// Ejecutar: node tools/agents/limpiar-copias.test.mjs
// Borrar las copias de trabajo que ya no se usan (D-218, D-252), en un repositorio de prueba de verdad.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, rmSync, utimesSync } from 'node:fs';
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
assert.deepEqual(plan.map(c => c.que), ['principal', 'borrar', 'separada', 'borrar'], 'las de la app también se borran al fusionarse');

// Las no fusionadas: según sus commits propios, sus días quieta, su PR y sus cambios
const una = (o) => clasificar([copias[0], { ruta: '/r/z', rama: 'z', separada: false }], {
  aqui: '/r/main', fusionada: () => false, sucia: () => !!o.sucia, propios: () => o.propios, dias: () => o.dias, conPr: () => o.pr,
})[1].que;
assert.equal(una({ propios: 0, dias: 2, pr: false }), 'vacia');
assert.equal(una({ propios: 0, dias: 2, pr: null }), 'vacia', 'vacía se sabe sin gh');
assert.equal(una({ propios: 0, dias: 0.5, pr: false }), 'abierta', 'recién creada: otra sesión está empezando');
assert.equal(una({ propios: 2, dias: 5, pr: false }), 'abandonada');
assert.equal(una({ propios: 2, dias: 1, pr: false }), 'abierta', 'se movió hace poco');
assert.equal(una({ propios: 2, dias: 5, pr: true }), 'abierta', 'con PR abierto');
assert.equal(una({ propios: 2, dias: 5, pr: null }), 'abierta', 'sin gh no se da por abandonada');
assert.equal(una({ propios: 0, dias: 9, pr: false, sucia: true }), 'abierta', 'con cambios sin commitear, nunca');

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
  // Sin commits ni PR desde hace días: vacía, se borra; con commits: abandonada, se sube y se borra
  const viejo = (Date.now() - 5 * 864e5) / 1000;
  const envejecer = ruta => utimesSync(join(g(ruta, 'rev-parse', '--absolute-git-dir'), 'HEAD'), viejo, viejo);
  const vacia = copia('juegos-vacia', 'vacia', false);
  envejecer(vacia);
  const abandonada = join(base, 'juegos-abandonada');
  g(raiz, 'worktree', 'add', '-q', abandonada, '-b', 'abandonada');
  writeFileSync(join(abandonada, 'b.txt'), 'b'); g(abandonada, 'add', '.');
  execFileSync('git', ['commit', '-qm', 'abandonada'], { cwd: abandonada, env: { ...process.env, GIT_COMMITTER_DATE: `@${Math.round(viejo)}`, GIT_AUTHOR_DATE: `@${Math.round(viejo)}` } });
  envejecer(abandonada);
  // Con commits viejos pero con PR abierto: se deja
  const conPr = join(base, 'juegos-con-pr');
  g(raiz, 'worktree', 'add', '-q', conPr, '-b', 'con-pr');
  writeFileSync(join(conPr, 'c.txt'), 'c'); g(conPr, 'add', '.');
  execFileSync('git', ['commit', '-qm', 'con-pr'], { cwd: conPr, env: { ...process.env, GIT_COMMITTER_DATE: `@${Math.round(viejo)}`, GIT_AUTHOR_DATE: `@${Math.round(viejo)}` } });
  envejecer(conPr);
  // La app de Claude crea las suyas dentro de .claude/worktrees: fusionadas, se borran igual
  mkdirSync(join(raiz, '.claude', 'worktrees'), { recursive: true });
  const app = join(raiz, '.claude', 'worktrees', 'app');
  g(raiz, 'worktree', 'add', '-q', app, '-b', 'app');
  writeFileSync(join(app, 'app.txt'), 'app'); g(app, 'add', '.'); g(app, 'commit', '-qm', 'app');
  // Se fusionan en main con commit de merge, como el botón de GitHub (--merge), y se suben
  g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'fusionada'); g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'sucia'); g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'app');
  g(raiz, 'push', '-q', 'origin', 'main');
  writeFileSync(join(sucia, 'pendiente.txt'), 'sin commitear');

  const env = { ...process.env, LIMPIAR_PRS_ABIERTOS: 'con-pr,en-curso,sucia' };
  const ver = execFileSync('node', [GUION, '--ver'], { cwd: raiz, encoding: 'utf8', env });
  assert.match(ver, /juegos-fusionada \(fusionada\)/);
  assert.ok(existsSync(fusionada), '--ver no borra nada');

  assert.match(ver, /subiría su rama a GitHub[\s\S]*juegos-abandonada/);
  const salida = execFileSync('node', [GUION, '--hook'], { cwd: raiz, encoding: 'utf8', env });
  assert.match(salida, /borré 3 copia\(s\) fusionada\(s\) o vacía\(s\): .*juegos-fusionada/);
  assert.match(salida, /abandonada\(s\), con su rama subida a GitHub: juegos-abandonada/);
  assert.ok(!existsSync(vacia) && !existsSync(app), 'la vacía y la de la app fusionada se borraron');
  assert.ok(!existsSync(abandonada), 'la abandonada se borró');
  assert.ok(g(origen, 'branch', '--list', 'abandonada'), 'y su rama quedó en el origin');
  assert.ok(existsSync(conPr), 'la que tiene PR abierto queda');
  assert.match(salida, /cambios sin commitear: juegos-sucia/);
  assert.match(salida, /en curso: .*juegos-en-curso/);
  assert.ok(!existsSync(fusionada), 'la fusionada se borró');
  assert.ok(!g(raiz, 'branch', '--list', 'fusionada'), 'y su rama también');
  assert.ok(existsSync(enCurso) && existsSync(sucia), 'las demás quedan');
  assert.ok(existsSync(nueva), 'la recién creada, sin commits, queda');
  assert.match(salida, /en curso: .*juegos-nueva/);

  // Desde dentro de una copia, esa copia no se borra aunque esté fusionada
  g(raiz, 'merge', '-q', '--no-ff', '--no-edit', 'en-curso'); g(raiz, 'push', '-q', 'origin', 'main');
  execFileSync('node', [GUION, '--hook'], { cwd: enCurso, encoding: 'utf8', env });
  assert.ok(existsSync(enCurso), 'la copia desde donde se corre no se borra');
  // Fuera de un repositorio, el hook no frena la sesión
  const fuera = execFileSync('node', [GUION, '--hook'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.match(fuera, /no pude revisarlas/);
} finally {
  rmSync(base, { recursive: true, force: true });
}

console.log('limpiar-copias: ok');
