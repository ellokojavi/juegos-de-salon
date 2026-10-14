// Web Push with no dependencies (D-224): the encryption against RFC 8291's example (Appendix A), and
// that a phone can decrypt and verify what is sent. Usage: node tools/push/webpush.test.mjs
import assert from 'node:assert/strict';
import { createECDH, createHmac, createDecipheriv, createPublicKey, verify } from 'node:crypto';
import { encrypt, vapidAuth, send } from './webpush.mjs';
import { vapidPair } from './vapid.mjs';

let n = 0;
const test = async (name, fn) => { await fn(); n++; };
const hmac = (k, ...d) => { const h = createHmac('sha256', k); d.forEach(x => h.update(x)); return h.digest(); };

/** What the phone does when it gets a notification (RFC 8291 §3 backwards). */
function decrypt(body, uaPrivate, auth) {
  const salt = body.subarray(0, 16), idlen = body[20], asPublic = body.subarray(21, 21 + idlen);
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(uaPrivate, 'base64url'));
  const uaPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(asPublic);
  const prkKey = hmac(Buffer.from(auth, 'base64url'), shared);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), Buffer.from([1])).subarray(0, 32);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0'), Buffer.from([1])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0'), Buffer.from([1])).subarray(0, 12);
  const data = body.subarray(21 + idlen);
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(data.subarray(data.length - 16));
  const plain = Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2, 'the last record ends in 0x02');
  return plain.subarray(0, plain.length - 1).toString();
}

// RFC 8291, Appendix A
const RFC = {
  text: 'When I grow up, I want to be a watermelon',
  uaPrivate: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  body: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};

await test("the RFC 8291 example: same body, byte for byte", () => {
  const body = encrypt(RFC.text, { p256dh: RFC.uaPublic, auth: RFC.auth }, { ephemeral: RFC.asPrivate, salt: Buffer.from(RFC.salt, 'base64url') });
  assert.equal(body.toString('base64url'), RFC.body);
});

await test('a phone decrypts what is sent to it (new keys every time)', () => {
  const phone = createECDH('prime256v1'); phone.generateKeys();
  const auth = Buffer.from('0123456789abcdef').toString('base64url');
  const notification = JSON.stringify({ title: '🏆 La Copa: Los Primos', body: '👑 Día 4: Reinas. Ya puedes jugar.', url: 'https://juegosdesalon.cl/cup/?primos' });
  const a = encrypt(notification, { p256dh: phone.getPublicKey().toString('base64url'), auth });
  const b = encrypt(notification, { p256dh: phone.getPublicKey().toString('base64url'), auth });
  assert.notEqual(a.toString('hex'), b.toString('hex'), 'each notification carries its own salt and single-use key');
  assert.equal(decrypt(a, phone.getPrivateKey().toString('base64url'), auth), notification);
  assert.throws(() => encrypt('x', { p256dh: 'short', auth }), /invalid keys/);
});

await test("the VAPID signature: an ES256 JWT for the service's origin, verified with the public key", () => {
  const { publicKey, privateKey } = vapidPair();
  const header = vapidAuth('https://fcm.googleapis.com/fcm/send/abc', { publicKey, privateKey, now: 1_700_000_000_000 });
  const [, t, k] = /^vapid t=([^,]+), k=(.+)$/.exec(header);
  assert.equal(k, publicKey);
  const [h, c, f] = t.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { typ: 'JWT', alg: 'ES256' });
  const claims = JSON.parse(Buffer.from(c, 'base64url'));
  assert.equal(claims.aud, 'https://fcm.googleapis.com');
  assert.equal(claims.exp, 1_700_000_000 + 12 * 3600);
  const pub = Buffer.from(publicKey, 'base64url');
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' });
  assert.ok(verify('sha256', Buffer.from(`${h}.${c}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url')));
});

await test('send: headers, and 404/410 mark the subscription as dead', async () => {
  const phone = createECDH('prime256v1'); phone.generateKeys();
  const sub = { endpoint: 'https://web.push.apple.com/QGuQyavXut', keys: { p256dh: phone.getPublicKey().toString('base64url'), auth: Buffer.alloc(16, 7).toString('base64url') } };
  const vapid = vapidPair();
  let request;
  const r = await send(sub, { title: 't', body: 'b' }, vapid, { doFetch: async (url, op) => { request = { url, op }; return { status: 201, ok: true }; } });
  assert.deepEqual(r, { status: 201, dead: false, text: '' });
  assert.equal(request.url, sub.endpoint);
  assert.equal(request.op.headers['Content-Encoding'], 'aes128gcm');
  assert.equal(request.op.headers.TTL, '43200');
  assert.match(request.op.headers.Authorization, /^vapid t=.+, k=/);
  assert.equal(JSON.parse(decrypt(request.op.body, phone.getPrivateKey().toString('base64url'), sub.keys.auth)).title, 't');
  for (const status of [404, 410]) {
    const m = await send(sub, { title: 't' }, vapid, { doFetch: async () => ({ status, ok: false, text: async () => 'gone' }) });
    assert.equal(m.dead, true);
  }
  assert.equal((await send(sub, { title: 't' }, vapid, { doFetch: async () => ({ status: 429, ok: false, text: async () => 'slow' }) })).dead, false);
});

console.log(`webpush: ${n} cases green`);
