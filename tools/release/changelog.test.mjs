// Ejecutar: node tools/release/changelog.test.mjs
// El CHANGELOG por archivo (D-300): el número de cada entrada sale del orden en que llegó a main, y
// juntarlas no cambia la versión. Arma un repo de git de prueba en una carpeta temporal.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { subir, leerEntrada, calcular, juntar, entradasNuevas, nivelEntre, revisarPR, ordenDeLlegada, pendientes, versionHoy, primeraVersion, RAIZ } from './changelog.mjs';

// Subir y leer
assert.equal(subir('0.167.3', 'parche'), '0.167.4');
assert.equal(subir('0.167.3', 'menor'), '0.168.0');
assert.equal(subir('0.167.3', 'mayor'), '1.0.0');
assert.deepEqual(leerEntrada('nivel: menor\n\n- **Algo** nuevo.\n'), { nivel: 'menor', cuerpo: '- **Algo** nuevo.' });
assert.match(leerEntrada('- sin nivel').error, /primera línea/);
assert.match(leerEntrada('nivel: grande\n\n- x').error, /no existe/);
assert.match(leerEntrada('nivel: parche\n\nsolo prosa').error, /ninguna línea/);
assert.match(leerEntrada('nivel: parche\n\n## 1.2.3 — hoy\n- x').error, /número/);

// Calcular y juntar
const CL = '# Changelog\n\n## 0.10.2 — 2026-10-01\n- viejo\n';
const lista = [{ archivo: 'changelog/a.md', fecha: '2026-10-02', nivel: 'parche', cuerpo: '- a' }, { archivo: 'changelog/b.md', fecha: '2026-10-03', nivel: 'menor', cuerpo: '- b' }, { archivo: 'changelog/c.md', fecha: '2026-10-03', nivel: 'parche', cuerpo: '- c' }];
const r = calcular(CL, lista);
assert.deepEqual(r.entradas.map(e => e.version), ['0.10.3', '0.11.0', '0.11.1']);
assert.equal(r.version, '0.11.1');
const junto = juntar(CL, r.entradas);
assert.equal(junto, '# Changelog\n\n## 0.11.1 — 2026-10-03\n- c\n\n## 0.11.0 — 2026-10-03\n- b\n\n## 0.10.3 — 2026-10-02\n- a\n\n## 0.10.2 — 2026-10-01\n- viejo\n');
assert.equal(calcular(junto, []).version, r.version, 'juntar no cambia la versión');

// Una entrada vieja en CHANGELOG.md (antes de D-300): se nota y se puede migrar
const conVieja = '# Changelog\n\n## 0.11.0 — 2026-10-04\n- nuevo\n- otra línea\n\n## 0.10.2 — 2026-10-01\n- viejo\n';
const nuevas = entradasNuevas(CL, conVieja);
assert.deepEqual(nuevas.map(e => [e.version, e.cuerpo]), [['0.11.0', '- nuevo\n- otra línea']]);
assert.equal(conVieja.replace(nuevas[0].bloque, ''), CL, 'migrar deja el CHANGELOG como estaba');
assert.equal(nivelEntre('0.10.2', '0.11.0'), 'menor');
assert.equal(nivelEntre('0.10.2', '0.10.3'), 'parche');
const pr = (cambios, ahora = CL) => revisarPR({ changelogBase: CL, changelogAhora: ahora, cambios });
assert.equal(pr([{ estado: 'M', archivo: 'CHANGELOG.md' }], conVieja).errores.length, 1, 'una entrada con número en CHANGELOG.md frena el PR');
assert.deepEqual(pr([{ estado: 'M', archivo: 'CHANGELOG.md' }, { estado: 'D', archivo: 'changelog/a.md' }], conVieja).errores, [], 'el PR que junta sí escribe números');
assert.equal(pr([{ estado: 'M', archivo: 'public/index.html' }]).avisos.length, 1, 'public/ sin entrada: aviso');
assert.deepEqual(pr([{ estado: 'M', archivo: 'public/index.html' }, { estado: 'A', archivo: 'changelog/x.md' }]), { errores: [], avisos: [] });
assert.deepEqual(pr([{ estado: 'M', archivo: 'tools/agents/processes.mjs' }]), { errores: [], avisos: [] }, 'sin public/, sin aviso');

// El orden es el de llegada a main, no el del nombre ni el de creación
const dir = mkdtempSync(join(tmpdir(), 'changelog-'));
try {
  const g = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const escribir = (f, t) => { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), t); };
  g('init', '-q', '-b', 'main');
  escribir('CHANGELOG.md', CL); g('add', '.'); g('commit', '-qm', 'base');
  // Dos ramas: "zeta" se crea primero pero entra segunda; "alfa", menor, entra primero
  g('checkout', '-qb', 'zeta'); escribir('changelog/zeta.md', 'nivel: parche\n\n- zeta\n'); g('add', '.'); g('commit', '-qm', 'zeta');
  g('checkout', '-q', 'main'); g('checkout', '-qb', 'alfa'); escribir('changelog/alfa.md', 'nivel: menor\n\n- alfa\n'); g('add', '.'); g('commit', '-qm', 'alfa');
  g('checkout', '-q', 'main');
  g('merge', '-q', '--no-ff', '-m', 'Merge alfa', 'zeta'); // zeta primero
  g('merge', '-q', '--no-ff', '-m', 'Merge alfa', 'alfa'); // alfa después
  assert.deepEqual(ordenDeLlegada(dir).map(e => e.archivo), ['changelog/zeta.md', 'changelog/alfa.md']);
  assert.deepEqual(calcular(CL, pendientes(dir)).entradas.map(e => e.version), ['0.10.3', '0.11.0']);
  assert.equal(versionHoy(dir), '0.11.0');
  // Una sin commit va al final
  escribir('changelog/aaa.md', 'nivel: parche\n\n- aaa\n');
  assert.deepEqual(ordenDeLlegada(dir).map(e => e.archivo), ['changelog/zeta.md', 'changelog/alfa.md', 'changelog/aaa.md']);
  unlinkSync(join(dir, 'changelog/aaa.md'));
  // Juntar en una rama, mientras otra entra a main: la versión publicada nunca retrocede
  const antes = versionHoy(dir);
  g('checkout', '-qb', 'juntar');
  const { entradas } = calcular(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8'), pendientes(dir));
  writeFileSync(join(dir, 'CHANGELOG.md'), juntar(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8'), entradas));
  for (const e of entradas) unlinkSync(join(dir, e.archivo));
  g('add', '-A'); g('commit', '-qm', 'juntar');
  g('checkout', '-q', 'main'); g('checkout', '-qb', 'tarde'); escribir('changelog/tarde.md', 'nivel: parche\n\n- tarde\n'); g('add', '.'); g('commit', '-qm', 'tarde');
  g('checkout', '-q', 'main'); g('merge', '-q', '--no-ff', '-m', 'Merge tarde', 'tarde');
  const conTarde = versionHoy(dir);
  assert.equal(conTarde, subir(antes, 'parche'));
  g('merge', '-q', '--no-ff', '-m', 'Merge juntar', 'juntar');
  assert.equal(versionHoy(dir), conTarde, 'fusionar lo juntado no cambia la versión publicada');
  assert.equal(primeraVersion(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8')), antes);
} finally { rmSync(dir, { recursive: true, force: true }); }

// Las entradas del repo se entienden
for (const e of pendientes(RAIZ)) assert.ok(!e.error, `${e.archivo}: ${e.error}`);
console.log(`changelog: en verde · versión de hoy ${versionHoy()}`);
