#!/usr/bin/env node
/**
 * Publica las reglas de Realtime Database sin pasar por la consola (D-122).
 *
 *   node tools/reglas.mjs revisar     # ¿las reglas publicadas son las del repo?
 *   node tools/reglas.mjs publicar    # sube firebase/database.rules.json y verifica que quedó
 *
 * Usa una llave de cuenta de servicio del proyecto (un JSON que el dueño genera una vez en
 * Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada). La llave NO va
 * en el repo: se lee de $FIREBASE_LLAVE o de ~/.config/juegos-de-salon/firebase-admin.json.
 * Con ella se pide un token de Google (JWT firmado con la llave) y se escribe
 * `<databaseURL>/.settings/rules.json`, que es lo mismo que el botón Publicar de la consola.
 * Sin dependencias: solo `node:crypto` y `fetch`.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from '../assets/js/firebase-config.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGLAS = join(RAIZ, 'firebase/database.rules.json');
const LLAVE = process.env.FIREBASE_LLAVE || join(homedir(), '.config/juegos-de-salon/firebase-admin.json');
const SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email';

const salir = (msg, code = 1) => { console.error(msg); process.exit(code); };

function leerLlave() {
  if (!existsSync(LLAVE)) {
    salir(`No encuentro la llave de la cuenta de servicio en ${LLAVE}.
Para crearla (una sola vez), con la cuenta dueña del proyecto:
  https://console.firebase.google.com/u/0/project/${firebaseConfig.projectId}/settings/serviceaccounts/adminsdk
  → "Generar nueva clave privada" y guarda el archivo en ${LLAVE}
  (o indica otra ruta con FIREBASE_LLAVE=/ruta/al/archivo.json).`);
  }
  const modo = statSync(LLAVE).mode & 0o777;
  if (modo & 0o077) console.warn(`Aviso: ${LLAVE} lo pueden leer otros usuarios del equipo. Sugerencia: chmod 600 "${LLAVE}"`);
  const k = JSON.parse(readFileSync(LLAVE, 'utf8'));
  if (!k.client_email || !k.private_key) salir(`${LLAVE} no parece una llave de cuenta de servicio (faltan client_email o private_key).`);
  if (k.project_id && k.project_id !== firebaseConfig.projectId) salir(`La llave es del proyecto "${k.project_id}", no de "${firebaseConfig.projectId}".`);
  return k;
}

const b64url = x => Buffer.from(x).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function token(k) {
  const ahora = Math.floor(Date.now() / 1000);
  const cabeza = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({ iss: k.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 }));
  const firma = createSign('RSA-SHA256').update(`${cabeza}.${cuerpo}`).sign(k.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cabeza}.${cuerpo}.${b64url(firma)}` }),
  });
  const j = await res.json();
  if (!res.ok || !j.access_token) salir(`Google no entregó el token (HTTP ${res.status}): ${j.error_description || j.error || ''}`);
  return j.access_token;
}

const url = t => `${firebaseConfig.databaseURL}/.settings/rules.json?access_token=${encodeURIComponent(t)}`;
const normal = texto => JSON.stringify(JSON.parse(texto));

async function publicadas(t) {
  const res = await fetch(url(t));
  const texto = await res.text();
  if (!res.ok) salir(`No se pudieron leer las reglas publicadas (HTTP ${res.status}): ${texto.slice(0, 200)}`);
  return texto;
}

const accion = process.argv[2];
if (!['revisar', 'publicar'].includes(accion)) salir('Uso: node tools/reglas.mjs revisar | publicar', 2);

const locales = readFileSync(REGLAS, 'utf8');
normal(locales); // que el archivo del repo sea JSON válido antes de tocar nada
const t = await token(leerLlave());
const antes = await publicadas(t);
const iguales = normal(antes) === normal(locales);

if (accion === 'revisar') {
  console.log(iguales ? '✓ Las reglas publicadas son las del repo.' : '✗ Las reglas publicadas NO son las del repo: falta publicar (node tools/reglas.mjs publicar).');
  process.exit(iguales ? 0 : 1);
}

if (iguales) { console.log('✓ Ya estaban publicadas: no hay nada que subir.'); process.exit(0); }
const res = await fetch(url(t), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: locales });
if (!res.ok) salir(`Firebase rechazó las reglas (HTTP ${res.status}): ${(await res.text()).slice(0, 500)}`);
const despues = await publicadas(t);
if (normal(despues) !== normal(locales)) salir('Se subieron, pero al leerlas de vuelta no coinciden con las del repo. Revisa la consola.');
console.log(`✓ Reglas publicadas y verificadas (${firebaseConfig.projectId}).`);
