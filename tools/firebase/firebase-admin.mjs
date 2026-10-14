/**
 * Signing in to Firebase as an administrator from the tools (D-122), with no dependencies: only
 * `node:crypto` and `fetch`.
 *
 * It uses a service account key of the project (a JSON the owner generates once in Project
 * settings → Service accounts → Generate new private key). The key is NOT in the repo: it is read
 * from $FIREBASE_KEY (or the old $FIREBASE_LLAVE) or from ~/.config/juegos-de-salon/firebase-admin.json.
 * With it a Google token is requested (a JWT signed with the key), which goes over the rules.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';

export const KEY = process.env.FIREBASE_KEY || process.env.FIREBASE_LLAVE || join(homedir(), '.config/juegos-de-salon/firebase-admin.json');
const SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email';

export const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

export function readKey() {
  if (!existsSync(KEY)) {
    fail(`The service account key is not at ${KEY}.
To create it (only once), with the account that owns the project:
  https://console.firebase.google.com/u/0/project/${firebaseConfig.projectId}/settings/serviceaccounts/adminsdk
  → "Generate new private key" and save the file at ${KEY}
  (or give another path with FIREBASE_KEY=/path/to/file.json).`);
  }
  const mode = statSync(KEY).mode & 0o777;
  if (mode & 0o077) console.warn(`Warning: other users on this machine can read ${KEY}. Suggestion: chmod 600 "${KEY}"`);
  const k = JSON.parse(readFileSync(KEY, 'utf8'));
  if (!k.client_email || !k.private_key) fail(`${KEY} does not look like a service account key (client_email or private_key is missing).`);
  if (k.project_id && k.project_id !== firebaseConfig.projectId) fail(`The key belongs to project "${k.project_id}", not "${firebaseConfig.projectId}".`);
  return k;
}

const b64url = x => Buffer.from(x).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

export async function token(k = readKey()) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ iss: k.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const signature = createSign('RSA-SHA256').update(`${head}.${body}`).sign(k.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${body}.${b64url(signature)}` }),
  });
  const j = await res.json();
  if (!res.ok || !j.access_token) fail(`Google did not hand over the token (HTTP ${res.status}): ${j.error_description || j.error || ''}`);
  return j.access_token;
}

/** Reads a node of the database as administrator; `null` if there is nothing. */
export async function read(path, t) {
  const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json?access_token=${encodeURIComponent(t)}`);
  if (!res.ok) fail(`Could not read ${path}/ (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/** Writes as administrator: `method` is PATCH, PUT or DELETE, as in the REST API. */
export async function write(path, method, body, t) {
  const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json?access_token=${encodeURIComponent(t)}`, {
    method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) fail(`Could not write ${path}/ (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
