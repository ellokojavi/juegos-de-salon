/**
 * Web Push sin dependencias (D-224): cifrar un aviso para un celular (RFC 8291, `aes128gcm`) y
 * firmar quién lo manda (VAPID, RFC 8292). Solo `node:crypto` y `fetch`, como el resto de tools/.
 *
 *   const r = await mandar(suscripcion, { title, body, url, tag }, { publica, privada });
 *   r.estado  → 201 entregado al servicio · 404/410 la suscripción murió (se borra) · otro: falla
 *
 * El servicio de avisos (el de Google para Chrome, el de Apple para Safari, el de Mozilla…) solo ve
 * bytes cifrados: el texto lo descifra el celular con las claves de su suscripción.
 */
import { createECDH, createHmac, createCipheriv, randomBytes, createPrivateKey, sign } from 'node:crypto';

const b64u = b => Buffer.from(b).toString('base64url');
const deB64u = s => Buffer.from(String(s), 'base64url');
const hmac = (clave, ...datos) => { const h = createHmac('sha256', clave); for (const d of datos) h.update(d); return h.digest(); };
/** HKDF-Expand de un solo bloque (todo lo que se pide aquí mide 32 bytes o menos). */
const expandir = (prk, info, largo) => hmac(prk, info, Buffer.from([1])).subarray(0, largo);

/** Tamaño de registro: los avisos caben en uno solo (el texto va muy por debajo de 4 KB). */
const RS = 4096;

/**
 * El cuerpo cifrado de un aviso (RFC 8291 §3 y §4). `efimera` (la clave del que manda, de un solo
 * uso) y `salt` se pasan solo en las pruebas, para comparar con el ejemplo del RFC.
 */
export function cifrar(texto, { p256dh, auth }, { efimera = null, salt = randomBytes(16) } = {}) {
  const uaPublica = deB64u(p256dh);
  const secretoAuth = deB64u(auth);
  if (uaPublica.length !== 65 || secretoAuth.length !== 16) throw new Error('suscripción con claves inválidas');
  const ecdh = createECDH('prime256v1');
  if (efimera) ecdh.setPrivateKey(deB64u(efimera)); else ecdh.generateKeys();
  const asPublica = ecdh.getPublicKey();
  const compartido = ecdh.computeSecret(uaPublica);

  // §3.4: la clave de entrada sale del secreto ECDH, el secreto de autenticación y las dos públicas
  const prkClave = hmac(secretoAuth, compartido);
  const ikm = expandir(prkClave, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublica, asPublica]), 32);
  // RFC 8188 §2.2: la clave del contenido y el nonce del único registro
  const prk = hmac(salt, ikm);
  const cek = expandir(prk, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = expandir(prk, Buffer.from('Content-Encoding: nonce\0'), 12);

  const cifrador = createCipheriv('aes-128-gcm', cek, nonce);
  // El último (y único) registro termina en 0x02 (RFC 8188 §2)
  const cuerpo = Buffer.concat([cifrador.update(Buffer.concat([Buffer.from(texto), Buffer.from([2])])), cifrador.final(), cifrador.getAuthTag()]);
  const cabeza = Buffer.alloc(21);
  Buffer.from(salt).copy(cabeza, 0);
  cabeza.writeUInt32BE(RS, 16);
  cabeza.writeUInt8(asPublica.length, 20);
  return Buffer.concat([cabeza, asPublica, cuerpo]);
}

/** La firma VAPID (RFC 8292): un JWT ES256 para el origen del servicio, válido 12 horas. */
export function firmaVapid(endpoint, { publica, privada, contacto = 'https://juegosdesalon.cl/', ahora = Date.now() }) {
  const pub = deB64u(publica);
  const clave = createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: privada, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
  const cabeza = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const cuerpo = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(ahora / 1000) + 12 * 3600, sub: contacto }));
  const firma = sign('sha256', Buffer.from(`${cabeza}.${cuerpo}`), { key: clave, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${cabeza}.${cuerpo}.${b64u(firma)}, k=${publica}`;
}

/**
 * Manda un aviso. `aviso` es lo que lee sw.js: `{ title, body, url, tag }`. Un aviso que no se
 * entrega en 12 horas ya no sirve (`TTL`): el día ya cambió.
 */
export async function mandar(sub, aviso, vapid, { hacer = globalThis.fetch, ttl = 12 * 3600 } = {}) {
  const cuerpo = cifrar(JSON.stringify(aviso), sub.keys);
  const res = await hacer(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: firmaVapid(sub.endpoint, vapid),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: 'normal',
    },
    body: cuerpo,
  });
  return { estado: res.status, muerta: res.status === 404 || res.status === 410, texto: res.ok ? '' : (await res.text().catch(() => '')).slice(0, 200) };
}
