// La versión de hoy: la de la primera entrada de CHANGELOG.md (`## 0.98.1 — 2026-10-04`). Desde
// D-205 las páginas de public/ no la llevan en git; set-version.py la estampa al publicar.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** X.Y.Z de un texto de CHANGELOG, o null si no tiene ninguna entrada. */
export const versionDe = texto => (/^## (\d+\.\d+\.\d+)\b/m.exec(texto) || [, null])[1];

export const versionHoy = () => versionDe(readFileSync(join(RAIZ, 'CHANGELOG.md'), 'utf8'));
