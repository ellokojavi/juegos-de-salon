// Ejecutar: node tools/release/version.test.mjs
// La versión sale de la primera entrada del CHANGELOG (D-205), no de las páginas.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { versionDe, versionHoy, desordenadas, RAIZ } from './version.mjs';
import { join } from 'node:path';

assert.equal(versionDe('# Changelog\n\n## 0.98.1 — 2026-10-04\n- algo\n\n## 0.98.0 — 2026-10-04\n'), '0.98.1');
assert.equal(versionDe('# Changelog\n\nTexto que nombra 1.2.3 antes de las entradas\n## 2.0.0 — hoy'), '2.0.0');
assert.equal(versionDe('# Changelog\n\n### 9.9.9 no es una entrada'), null);
assert.match(versionHoy(), /^\d+\.\d+\.\d+$/, 'el CHANGELOG del repo tiene que empezar con una entrada X.Y.Z');
// Una entrada nueva va arriba con una versión mayor: si no, el sitio se publica con una versión
// hacia atrás (0.148.6 sobre 0.153.0 pasó el 2026-10-11, con dos PR fusionados a la vez).
assert.deepEqual(desordenadas('## 0.153.1 — x\n## 0.153.0 — x\n## 0.98.10 — x\n## 0.98.9 — x'), []);
assert.deepEqual(desordenadas('## 0.148.6 — x\n## 0.153.0 — x'), [['0.148.6', '0.153.0']]);
assert.deepEqual(desordenadas(readFileSync(join(RAIZ, 'CHANGELOG.md'), 'utf8')), [], 'el CHANGELOG tiene que ir de la versión más nueva a la más vieja: la de arriba es la que se publica');
console.log(`version: ${versionHoy()} · en verde`);
