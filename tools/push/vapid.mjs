#!/usr/bin/env node
/**
 * El par de claves VAPID de los avisos al celular (D-223). Lo corre el dueño **una sola vez**:
 *
 *   node tools/push/vapid.mjs            # genera el par, escribe la pública y carga la privada
 *   node tools/push/vapid.mjs --forzar   # lo rehace (borra en la práctica todas las suscripciones)
 *
 * - La pública va a `public/assets/js/vapid.js` (es pública: se commitea).
 * - La privada nunca se muestra. Con la CLI de GitHub (`gh`) se carga directo como el secreto
 *   `VAPID_PRIVADA`, que usará el workflow que manda los avisos. Sin `gh`, queda en
 *   ~/.config/juegos-de-salon/vapid-privada.txt (solo legible por ti) con el comando para cargarla.
 *
 * Cambiar el par invalida las suscripciones que ya existen: los navegadores las atan a la pública.
 * Por eso, si ya hay una, se niega sin --forzar.
 */
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVO = join(RAIZ, 'public/assets/js/vapid.js');
const RESPALDO = join(homedir(), '.config/juegos-de-salon/vapid-privada.txt');
const salir = (msg, code = 1) => { console.error(msg); process.exit(code); };

/** El par en el formato de Web Push: la pública sin comprimir (65 bytes) y la privada (32), en base64url. */
export function parVapid() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pub = publicKey.export({ format: 'jwk' });
  const priv = privateKey.export({ format: 'jwk' });
  const bytes = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64url'), Buffer.from(pub.y, 'base64url')]);
  return { publica: bytes.toString('base64url'), privada: priv.d };
}

/** El archivo de la pública con otra clave adentro. */
export const conClave = (texto, clave) => texto.replace(/export const VAPID_PUBLICA = '[^']*';/, `export const VAPID_PUBLICA = '${clave}';`);

if (import.meta.url === `file://${process.argv[1]}`) {
  const actual = readFileSync(ARCHIVO, 'utf8');
  if (!/export const VAPID_PUBLICA = '[^']*';/.test(actual)) salir(`${ARCHIVO} no tiene la línea VAPID_PUBLICA.`);
  if (!/VAPID_PUBLICA = '';/.test(actual) && !process.argv.includes('--forzar')) {
    salir('Ya hay una clave VAPID. Rehacerla deja sin avisos a todos los suscritos; si de verdad hace falta: --forzar', 2);
  }
  const { publica, privada } = parVapid();
  const gh = spawnSync('gh', ['secret', 'set', 'VAPID_PRIVADA'], { cwd: RAIZ, input: privada, encoding: 'utf8' });
  if (gh.status === 0) {
    console.log('✓ La privada quedó como el secreto VAPID_PRIVADA de GitHub.');
  } else {
    mkdirSync(dirname(RESPALDO), { recursive: true });
    writeFileSync(RESPALDO, privada + '\n', { mode: 0o600 });
    console.log(`No se pudo cargar el secreto con gh (${(gh.stderr || gh.error?.message || '').trim().split('\n')[0] || 'sin gh'}).`);
    console.log(`La privada quedó en ${RESPALDO}. Cárgala con:\n  gh secret set VAPID_PRIVADA < "${RESPALDO}"`);
  }
  writeFileSync(ARCHIVO, conClave(actual, publica));
  console.log(`✓ La pública quedó en public/assets/js/vapid.js. Commitea ese archivo: con él, los avisos se ofrecen en las copas.`);
}
