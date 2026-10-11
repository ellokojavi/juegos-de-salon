// La versión de hoy: la de la primera entrada de CHANGELOG.md (`## 0.98.1 — 2026-10-04`). Desde
// D-205 las páginas de public/ no la llevan en git; set-version.py la estampa al publicar.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** X.Y.Z de un texto de CHANGELOG, o null si no tiene ninguna entrada. */
export const versionDe = texto => (/^## (\d+\.\d+\.\d+)\b/m.exec(texto) || [, null])[1];

/** Las versiones de todas las entradas, de arriba abajo. */
export const versiones = texto => [...texto.matchAll(/^## (\d+\.\d+\.\d+)\b/gm)].map(m => m[1]);

/** Las entradas que no son menores que la de arriba: `[[arriba, abajo]]`. Vacío si van en orden. */
export function desordenadas(texto) {
  const n = v => v.split('.').map(Number), menor = (a, b) => { const [x, y] = [n(a), n(b)]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; };
  const vs = versiones(texto), res = [];
  for (let i = 1; i < vs.length; i++) if (!menor(vs[i], vs[i - 1])) res.push([vs[i - 1], vs[i]]);
  return res;
}

export const versionHoy = () => versionDe(readFileSync(join(RAIZ, 'CHANGELOG.md'), 'utf8'));
