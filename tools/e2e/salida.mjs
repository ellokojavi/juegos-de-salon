/**
 * La carpeta de salida de un guion de punta a punta (capturas y el perfil de Chrome), D-315.
 *
 * Antes cada guion hacía `const OUT = process.argv[2]`: corrido sin carpeta quedaba `undefined/`, y
 * corrido con un flag primero (`torneo.mjs --parte copa`) quedaba `--parte/`, las dos dentro de la
 * copia de trabajo, con un perfil de Chrome de decenas de MB que dejaba la copia "con cambios" y
 * frenaba su limpieza (`limpiar-copias.mjs`). Ahora la salida es el primer argumento solo si es una
 * carpeta de verdad; si no, la que el guion dé por defecto o una nueva en el directorio temporal.
 *
 *   const OUT = salida();              // argv[2], o /tmp/<guion>-XXXX
 *   const OUT = salida('/tmp/copa');   // argv[2], o /tmp/copa
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename } from 'node:path';

/** ¿Sirve como carpeta de salida? No vacía, no un flag, no `undefined`/`null` hechos texto. */
export const esCarpeta = a => typeof a === 'string' && a.trim() !== '' && !a.startsWith('-') && !/(^|\/)(undefined|null)(\/|$)/.test(a);

export function salida(porDefecto = null, argv = process.argv) {
  if (esCarpeta(argv[2])) return argv[2];
  if (porDefecto) return porDefecto;
  return mkdtempSync(`${tmpdir()}/${basename(argv[1] || 'e2e', '.mjs')}-`);
}
