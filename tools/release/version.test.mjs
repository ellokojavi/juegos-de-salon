// Ejecutar: node tools/release/version.test.mjs
// La versión sale de la primera entrada del CHANGELOG (D-205), no de las páginas.
import assert from 'node:assert/strict';
import { versionDe, versionHoy } from './version.mjs';

assert.equal(versionDe('# Changelog\n\n## 0.98.1 — 2026-10-04\n- algo\n\n## 0.98.0 — 2026-10-04\n'), '0.98.1');
assert.equal(versionDe('# Changelog\n\nTexto que nombra 1.2.3 antes de las entradas\n## 2.0.0 — hoy'), '2.0.0');
assert.equal(versionDe('# Changelog\n\n### 9.9.9 no es una entrada'), null);
assert.match(versionHoy(), /^\d+\.\d+\.\d+$/, 'el CHANGELOG del repo tiene que empezar con una entrada X.Y.Z');
console.log(`version: ${versionHoy()} · en verde`);
