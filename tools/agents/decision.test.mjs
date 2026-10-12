// Ejecutar: node tools/agents/decision.test.mjs
// Los números de decisión y el driver de DECISIONES.md (D-301): dos ramas con decisiones distintas
// se juntan solas; dos cambios a lo mismo quedan en conflicto. Arma un repo de git temporal.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { numeros, numerosAgregados, siguienteLibre, partir, armar, fusionar, fusionarCabeza, fila } from './decision.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

assert.deepEqual(numeros('## D-01 · a\n## D-12 · b\n### D-5 no\n'), [1, 12]);
assert.deepEqual(numerosAgregados('@@\n+## D-12 · x\n ## D-11 · y\n-## D-1 · z'), [12]);
assert.equal(siguienteLibre([1, 296], [298, 297], [299]), 300);
assert.equal(siguienteLibre([], []), 1);

const CAB = '# Decisiones\n\n| Tema | D |\n|---|---|\n| Pruebas | D-1 |\n| Publicar | D-2 |\n\n---\n\n';
const d = (n, t = 'texto') => `## D-${n} · título ${n}\n**Estado:** vigente\n${t}\n\n`;
const doc = (cab, ...ds) => armar(cab, new Map(ds.map(x => [Number(x.match(/D-(\d+)/)[1]), x])));
const BASE = doc(CAB, d(1), d(2));

// El archivo del repo se arma igual que se parte
const repo = readFileSync(join(AQUI, '../../docs/DECISIONES.md'), 'utf8');
const p = partir(repo);
assert.equal(armar(p.cabeza, p.decisiones), repo, 'partir y armar DECISIONES.md lo deja igual');

// Dos decisiones nuevas, una en cada lado: entran las dos, en orden
let r = fusionar(BASE, doc(CAB, d(1), d(2), d(3)), doc(CAB, d(1), d(2), d(4)));
assert.ok(r.limpio); assert.deepEqual(numeros(r.texto), [1, 2, 3, 4]);
// Y llegan en desorden (la de mayor número fusionada antes): igual quedan en orden
r = fusionar(BASE, doc(CAB, d(1), d(2), d(4)), doc(CAB, d(1), d(2), d(3)));
assert.ok(r.limpio); assert.deepEqual(numeros(r.texto), [1, 2, 3, 4]);
// Un lado marca una vieja como corregida y el otro agrega una: limpio
r = fusionar(BASE, doc(CAB, d(1, 'corregida por D-3'), d(2), d(3)), doc(CAB, d(1), d(2), d(4)));
assert.ok(r.limpio); assert.match(r.texto, /corregida por D-3/);
// Filas distintas del índice: limpio; la misma fila: conflicto
const cabA = CAB.replace('| Pruebas | D-1 |', '| Pruebas | D-1, D-3 |'), cabB = CAB.replace('| Publicar | D-2 |', '| Publicar | D-2, D-4 |');
r = fusionar(BASE, doc(cabA, d(1), d(2), d(3)), doc(cabB, d(1), d(2), d(4)));
assert.ok(r.limpio); assert.match(r.texto, /D-1, D-3/); assert.match(r.texto, /D-2, D-4/);
assert.equal(r.texto.split('| Pruebas').length, 2, 'la fila no se duplica');
// Las dos suman una decisión a la misma fila: se juntan, en orden
r = fusionar(BASE, doc(cabA, d(1), d(2), d(3)), doc(CAB.replace('| Pruebas | D-1 |', '| Pruebas | D-1, D-4 |'), d(1), d(2), d(4)));
assert.ok(r.limpio); assert.match(r.texto, /\| Pruebas \| D-1, D-3, D-4 \|/);
// Una quita una decisión de la fila y la otra suma: se respeta lo quitado
assert.equal(fila('| T | D-1, D-2 |', '| T | D-2, D-3 |', '| T | D-1, D-2, D-4 |'), '| T | D-2, D-3, D-4 |');
// Otra cosa de la misma fila cambiada en los dos lados: conflicto
assert.equal(fusionar(BASE, doc(CAB.replace('| Pruebas |', '| Pruebas (C-12) |'), d(1)), doc(CAB.replace('| Pruebas |', '| Pruebas y CI |'), d(1))).limpio, false, 'el mismo tema renombrado distinto es un conflicto');
// Dos filas nuevas en el mismo lugar: el esqueleto choca
assert.equal(fusionarCabeza(CAB, CAB.replace('| Publicar | D-2 |', '| Publicar | D-2 |\n| Nuevo A | D-3 |'), CAB.replace('| Publicar | D-2 |', '| Publicar | D-2 |\n| Nuevo B | D-4 |')), null);
// El mismo número para dos decisiones distintas: conflicto (es lo que la reserva evita)
assert.equal(fusionar(BASE, doc(CAB, d(1), d(2), d(3, 'una')), doc(CAB, d(1), d(2), d(3, 'otra'))).limpio, false);
// La misma decisión cambiada distinto en los dos lados: conflicto
assert.equal(fusionar(BASE, doc(CAB, d(1, 'a')), doc(CAB, d(1, 'b'))).limpio, false);

// Con git de verdad: el driver configurado como lo deja `instalar`, desde la raíz de la copia
const dir = mkdtempSync(join(tmpdir(), 'decision-'));
try {
  const g = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const escribir = (f, t) => { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), t); };
  g('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'tools/agents'), { recursive: true });
  copyFileSync(join(AQUI, 'decision.mjs'), join(dir, 'tools/agents/decision.mjs'));
  escribir('.gitattributes', 'docs/DECISIONES.md merge=decisiones\n');
  escribir('docs/DECISIONES.md', BASE); g('add', '.'); g('commit', '-qm', 'base');
  g('config', 'merge.decisiones.driver', 'node tools/agents/decision.mjs driver %O %A %B');
  g('checkout', '-qb', 'otra'); escribir('docs/DECISIONES.md', doc(cabB, d(1), d(2), d(4))); g('commit', '-qam', 'D-4');
  g('checkout', '-q', 'main'); escribir('docs/DECISIONES.md', doc(cabA, d(1), d(2), d(3))); g('commit', '-qam', 'D-3');
  g('merge', '-q', '-m', 'merge', 'otra');
  const t = readFileSync(join(dir, 'docs/DECISIONES.md'), 'utf8');
  assert.deepEqual(numeros(t), [1, 2, 3, 4]); assert.ok(!/<<<<<<<|>>>>>>>/.test(t));
  // Un choque de verdad queda en conflicto, con sus marcas
  g('checkout', '-qb', 'choque'); escribir('docs/DECISIONES.md', doc(cabA, d(1), d(2), d(3), d(4), d(5, 'una'))); g('commit', '-qam', 'D-5 una');
  g('checkout', '-q', 'main'); escribir('docs/DECISIONES.md', doc(cabA, d(1), d(2), d(3), d(4), d(5, 'otra'))); g('commit', '-qam', 'D-5 otra');
  const m = spawnSync('git', ['merge', '-q', '-m', 'merge', 'choque'], { cwd: dir, encoding: 'utf8' });
  assert.notEqual(m.status, 0, 'D-5 en los dos lados no se junta solo');
  assert.match(readFileSync(join(dir, 'docs/DECISIONES.md'), 'utf8'), /<<<<<<< /);
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log('decision: números y driver de DECISIONES.md en verde');
