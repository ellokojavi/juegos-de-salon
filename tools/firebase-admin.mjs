/**
 * Entrar a Firebase como administrador desde las herramientas (D-122), sin dependencias: solo
 * `node:crypto` y `fetch`.
 *
 * Usa una llave de cuenta de servicio del proyecto (un JSON que el dueño genera una vez en
 * Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada). La llave NO va
 * en el repo: se lee de $FIREBASE_LLAVE o de ~/.config/juegos-de-salon/firebase-admin.json.
 * Con ella se pide un token de Google (JWT firmado con la llave), que pasa por encima de las reglas.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { firebaseConfig } from '../assets/js/firebase-config.js';

export const LLAVE = process.env.FIREBASE_LLAVE || join(homedir(), '.config/juegos-de-salon/firebase-admin.json');
const SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email';

export const salir = (msg, code = 1) => { console.error(msg); process.exit(code); };

export function leerLlave() {
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

export async function token(k = leerLlave()) {
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

/** Lee un nodo de la base como administrador; `null` si no hay nada. */
export async function leer(ruta, t) {
  const res = await fetch(`${firebaseConfig.databaseURL}/${ruta}.json?access_token=${encodeURIComponent(t)}`);
  if (!res.ok) salir(`No se pudo leer ${ruta}/ (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
