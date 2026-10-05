// Web Push sin dependencias (D-224): el cifrado contra el ejemplo del RFC 8291 (Apéndice A), y que
// un celular pueda descifrar y verificar lo que se manda. Uso: node tools/push/webpush.test.mjs
import assert from 'node:assert/strict';
import { createECDH, createHmac, createDecipheriv, createPublicKey, verify } from 'node:crypto';
import { cifrar, firmaVapid, mandar } from './webpush.mjs';
import { parVapid } from './vapid.mjs';

let n = 0;
const caso = async (nombre, fn) => { await fn(); n++; };
const hmac = (k, ...d) => { const h = createHmac('sha256', k); d.forEach(x => h.update(x)); return h.digest(); };

/** Lo que hace el celular al recibir un aviso (RFC 8291 §3 al revés). */
function descifrar(cuerpo, uaPrivada, auth) {
  const salt = cuerpo.subarray(0, 16), idlen = cuerpo[20], asPublica = cuerpo.subarray(21, 21 + idlen);
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(uaPrivada, 'base64url'));
  const uaPublica = ecdh.getPublicKey();
  const compartido = ecdh.computeSecret(asPublica);
  const prkClave = hmac(Buffer.from(auth, 'base64url'), compartido);
  const ikm = hmac(prkClave, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublica, asPublica]), Buffer.from([1])).subarray(0, 32);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0'), Buffer.from([1])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0'), Buffer.from([1])).subarray(0, 12);
  const datos = cuerpo.subarray(21 + idlen);
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(datos.subarray(datos.length - 16));
  const claro = Buffer.concat([d.update(datos.subarray(0, datos.length - 16)), d.final()]);
  assert.equal(claro[claro.length - 1], 2, 'el último registro termina en 0x02');
  return claro.subarray(0, claro.length - 1).toString();
}

// RFC 8291, Apéndice A
const RFC = {
  texto: 'When I grow up, I want to be a watermelon',
  uaPrivada: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  uaPublica: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  asPrivada: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  cuerpo: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};

await caso('el ejemplo del RFC 8291: mismo cuerpo, byte a byte', () => {
  const cuerpo = cifrar(RFC.texto, { p256dh: RFC.uaPublica, auth: RFC.auth }, { efimera: RFC.asPrivada, salt: Buffer.from(RFC.salt, 'base64url') });
  assert.equal(cuerpo.toString('base64url'), RFC.cuerpo);
});

await caso('un celular descifra lo que se le manda (claves nuevas cada vez)', () => {
  const cel = createECDH('prime256v1'); cel.generateKeys();
  const auth = Buffer.from('0123456789abcdef').toString('base64url');
  const aviso = JSON.stringify({ title: '🏆 La Copa: Los Primos', body: '👑 Día 4: Reinas. Ya puedes jugar.', url: 'https://juegosdesalon.cl/cup/?primos' });
  const a = cifrar(aviso, { p256dh: cel.getPublicKey().toString('base64url'), auth });
  const b = cifrar(aviso, { p256dh: cel.getPublicKey().toString('base64url'), auth });
  assert.notEqual(a.toString('hex'), b.toString('hex'), 'cada aviso lleva su propia sal y clave de un uso');
  assert.equal(descifrar(a, cel.getPrivateKey().toString('base64url'), auth), aviso);
  assert.throws(() => cifrar('x', { p256dh: 'corta', auth }), /claves inválidas/);
});

await caso('la firma VAPID: JWT ES256 para el origen del servicio, que se verifica con la pública', () => {
  const { publica, privada } = parVapid();
  const cab = firmaVapid('https://fcm.googleapis.com/fcm/send/abc', { publica, privada, ahora: 1_700_000_000_000 });
  const [, t, k] = /^vapid t=([^,]+), k=(.+)$/.exec(cab);
  assert.equal(k, publica);
  const [h, c, f] = t.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { typ: 'JWT', alg: 'ES256' });
  const claims = JSON.parse(Buffer.from(c, 'base64url'));
  assert.equal(claims.aud, 'https://fcm.googleapis.com');
  assert.equal(claims.exp, 1_700_000_000 + 12 * 3600);
  const pub = Buffer.from(publica, 'base64url');
  const clave = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' });
  assert.ok(verify('sha256', Buffer.from(`${h}.${c}`), { key: clave, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url')));
});

await caso('mandar: cabeceras, y 404/410 marcan la suscripción como muerta', async () => {
  const cel = createECDH('prime256v1'); cel.generateKeys();
  const sub = { endpoint: 'https://web.push.apple.com/QGuQyavXut', keys: { p256dh: cel.getPublicKey().toString('base64url'), auth: Buffer.alloc(16, 7).toString('base64url') } };
  const vapid = parVapid();
  let pedido;
  const r = await mandar(sub, { title: 't', body: 'b' }, vapid, { hacer: async (url, op) => { pedido = { url, op }; return { status: 201, ok: true }; } });
  assert.deepEqual(r, { estado: 201, muerta: false, texto: '' });
  assert.equal(pedido.url, sub.endpoint);
  assert.equal(pedido.op.headers['Content-Encoding'], 'aes128gcm');
  assert.equal(pedido.op.headers.TTL, '43200');
  assert.match(pedido.op.headers.Authorization, /^vapid t=.+, k=/);
  assert.equal(JSON.parse(descifrar(pedido.op.body, cel.getPrivateKey().toString('base64url'), sub.keys.auth)).title, 't');
  for (const estado of [404, 410]) {
    const m = await mandar(sub, { title: 't' }, vapid, { hacer: async () => ({ status: estado, ok: false, text: async () => 'gone' }) });
    assert.equal(m.muerta, true);
  }
  assert.equal((await mandar(sub, { title: 't' }, vapid, { hacer: async () => ({ status: 429, ok: false, text: async () => 'lento' }) })).muerta, false);
});

console.log(`webpush: ${n} casos en verde`);
