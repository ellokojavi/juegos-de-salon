#!/usr/bin/env node
/**
 * The VAPID key pair for phone notifications (D-223). The owner runs it **only once**:
 *
 *   node tools/push/vapid.mjs            # generates the pair, writes the public key and uploads the private one
 *   node tools/push/vapid.mjs --force    # remakes it (in practice deletes every subscription)
 *
 * - The public key goes to `public/assets/js/vapid.js` (it is public: it gets committed).
 * - The private key is never shown. With the GitHub CLI (`gh`) it is uploaded directly as the
 *   secret `VAPID_PRIVADA` (the owner decided to keep that name, D-316), used by the workflow that
 *   sends the notifications. Without `gh`, it stays in ~/.config/juegos-de-salon/vapid-privada.txt
 *   (readable only by you) with the command to upload it.
 *
 * Changing the pair invalidates the existing subscriptions: browsers tie them to the public key.
 * That is why, if there already is one, it refuses without --force.
 */
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = join(ROOT, 'public/assets/js/vapid.js');
const BACKUP = join(homedir(), '.config/juegos-de-salon/vapid-privada.txt');
const SECRET = 'VAPID_PRIVADA';
const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

/** The pair in Web Push format: the uncompressed public key (65 bytes) and the private one (32), in base64url. */
export function vapidPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pub = publicKey.export({ format: 'jwk' });
  const priv = privateKey.export({ format: 'jwk' });
  const bytes = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64url'), Buffer.from(pub.y, 'base64url')]);
  return { publicKey: bytes.toString('base64url'), privateKey: priv.d };
}

/** The public key's file with another key inside (`VAPID_PUBLICA` is the app's name, phase 4). */
export const withKey = (text, key) => text.replace(/export const VAPID_PUBLICA = '[^']*';/, `export const VAPID_PUBLICA = '${key}';`);

if (import.meta.url === `file://${process.argv[1]}`) {
  const current = readFileSync(FILE, 'utf8');
  if (!/export const VAPID_PUBLICA = '[^']*';/.test(current)) fail(`${FILE} has no VAPID_PUBLICA line.`);
  // --forzar: the name from before D-316
  const force = process.argv.includes('--force') || process.argv.includes('--forzar');
  if (!/VAPID_PUBLICA = '';/.test(current) && !force) {
    fail('There already is a VAPID key. Remaking it leaves every subscriber without notifications; if it is really needed: --force', 2);
  }
  const { publicKey, privateKey } = vapidPair();
  const gh = spawnSync('gh', ['secret', 'set', SECRET], { cwd: ROOT, input: privateKey, encoding: 'utf8' });
  if (gh.status === 0) {
    console.log(`✓ The private key is now GitHub's ${SECRET} secret.`);
  } else {
    mkdirSync(dirname(BACKUP), { recursive: true });
    writeFileSync(BACKUP, privateKey + '\n', { mode: 0o600 });
    console.log(`Could not upload the secret with gh (${(gh.stderr || gh.error?.message || '').trim().split('\n')[0] || 'no gh'}).`);
    console.log(`The private key is in ${BACKUP}. Upload it with:\n  gh secret set ${SECRET} < "${BACKUP}"`);
  }
  writeFileSync(FILE, withKey(current, publicKey));
  console.log('✓ The public key is in public/assets/js/vapid.js. Commit that file: with it, the cups offer notifications.');
}
