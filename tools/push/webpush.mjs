/**
 * Web Push with no dependencies (D-224): encrypting a notification for a phone (RFC 8291,
 * `aes128gcm`) and signing who sends it (VAPID, RFC 8292). Only `node:crypto` and `fetch`, like the
 * rest of tools/.
 *
 *   const r = await send(subscription, { title, body, url, tag }, { publicKey, privateKey });
 *   r.status  → 201 delivered to the service · 404/410 the subscription died (it is deleted) · other: failure
 *
 * The push service (Google's for Chrome, Apple's for Safari, Mozilla's…) only sees encrypted
 * bytes: the phone decrypts the text with its subscription's keys.
 */
import { createECDH, createHmac, createCipheriv, randomBytes, createPrivateKey, sign } from 'node:crypto';

const b64u = b => Buffer.from(b).toString('base64url');
const fromB64u = s => Buffer.from(String(s), 'base64url');
const hmac = (key, ...data) => { const h = createHmac('sha256', key); for (const d of data) h.update(d); return h.digest(); };
/** Single-block HKDF-Expand (everything asked for here is 32 bytes or less). */
const expand = (prk, info, length) => hmac(prk, info, Buffer.from([1])).subarray(0, length);

/** Record size: notifications fit in a single one (the text is far below 4 KB). */
const RS = 4096;

/**
 * A notification's encrypted body (RFC 8291 §3 and §4). `ephemeral` (the sender's single-use key)
 * and `salt` are only passed in the tests, to compare with the RFC's example.
 */
export function encrypt(text, { p256dh, auth }, { ephemeral = null, salt = randomBytes(16) } = {}) {
  const uaPublic = fromB64u(p256dh);
  const authSecret = fromB64u(auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error('subscription with invalid keys');
  const ecdh = createECDH('prime256v1');
  if (ephemeral) ecdh.setPrivateKey(fromB64u(ephemeral)); else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);

  // §3.4: the input key comes from the ECDH secret, the authentication secret and both public keys
  const prkKey = hmac(authSecret, shared);
  const ikm = expand(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32);
  // RFC 8188 §2.2: the content key and the nonce of the only record
  const prk = hmac(salt, ikm);
  const cek = expand(prk, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = expand(prk, Buffer.from('Content-Encoding: nonce\0'), 12);

  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  // The last (and only) record ends in 0x02 (RFC 8188 §2)
  const body = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(text), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const head = Buffer.alloc(21);
  Buffer.from(salt).copy(head, 0);
  head.writeUInt32BE(RS, 16);
  head.writeUInt8(asPublic.length, 20);
  return Buffer.concat([head, asPublic, body]);
}

/** The VAPID signature (RFC 8292): an ES256 JWT for the service's origin, valid for 12 hours. */
export function vapidAuth(endpoint, { publicKey, privateKey, contact = 'https://juegosdesalon.cl/', now = Date.now() }) {
  const pub = fromB64u(publicKey);
  const key = createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: contact }));
  const signature = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(signature)}, k=${publicKey}`;
}

/**
 * Sends a notification. `notification` is what sw.js reads: `{ title, body, url, tag, acciones? }`.
 * A notification not delivered within 12 hours is no longer useful (`TTL`): the day already changed.
 */
export async function send(sub, notification, vapid, { doFetch = globalThis.fetch, ttl = 12 * 3600 } = {}) {
  const body = encrypt(JSON.stringify(notification), sub.keys);
  const res = await doFetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuth(sub.endpoint, vapid),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: 'normal',
    },
    body,
  });
  return { status: res.status, dead: res.status === 404 || res.status === 410, text: res.ok ? '' : (await res.text().catch(() => '')).slice(0, 200) };
}
