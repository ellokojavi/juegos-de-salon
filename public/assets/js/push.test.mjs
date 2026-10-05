// Los avisos al celular (D-223): qué camino le toca a cada celular, la puerta del laboratorio, la
// clave VAPID (la que genera tools/push/vapid.mjs sirve en un navegador) y lo que se guarda.
// Uso: node public/assets/js/push.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { celular, camino, avisosVisibles, activarAvisos, heredarLabsDeApp, bytesDeClave, subIdDe, paraGuardar, permiso, clavePublica, LABS_AVISOS_KEY, VAPID_PRUEBA_KEY } from './push.js';
import { VAPID_PUBLICA } from './vapid.js';
import { parVapid, conClave } from '../../../tools/push/vapid.mjs';

let n = 0;
const caso = async (nombre, fn) => { await fn(); n++; };

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  iphone18: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphone15: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1',
  iphoneInstagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  firefoxViejo: 'Mozilla/5.0 (X11; Linux x86_64; rv:40.0) Gecko/20100101 Firefox/40.0',
};
const con = (ua, { push = false, instalada = false, touch = 0 } = {}) => celular({
  nav: { userAgent: ua, maxTouchPoints: touch, standalone: instalada, ...(push ? { serviceWorker: {} } : {}) },
  win: { matchMedia: () => ({ matches: instalada }), ...(push ? { PushManager: {}, Notification: {} } : {}) },
});

await caso('el camino de cada celular', () => {
  assert.equal(camino(con(UA.android, { push: true })), 'push');
  assert.equal(camino(con(UA.iphone18)), 'instalar', 'iPhone en Safari: agregar a inicio');
  assert.equal(camino(con(UA.iphone18, { push: true, instalada: true })), 'push', 'iPhone con la app instalada');
  assert.equal(camino(con(UA.iphoneChrome)), 'instalar', 'Chrome en iPhone también agrega a inicio (iOS 16.4+)');
  assert.equal(camino(con(UA.iphoneInstagram)), 'otra-app');
  assert.equal(camino(con(UA.iphone15)), 'no', 'iOS 15 no tiene avisos web');
  assert.equal(camino(con(UA.ipad, { touch: 5 })), 'instalar', 'el iPad se presenta como Mac');
  assert.equal(camino(con(UA.ipad, { push: true })), 'push', 'Safari de Mac sí tiene avisos');
  assert.equal(camino(con(UA.firefoxViejo)), 'no');
});

await caso('puerta del laboratorio: sin clave nunca; con clave en dev o con /labs/ activado', () => {
  const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
  const prod = { hostname: 'juegosdesalon.cl' }, dev = { hostname: 'localhost' };
  const s = mem();
  assert.equal(avisosVisibles({ storage: s, loc: dev, clave: '' }), false);
  assert.equal(avisosVisibles({ storage: s, loc: dev, clave: 'x' }), true);
  assert.equal(avisosVisibles({ storage: s, loc: prod, clave: 'x' }), false);
  activarAvisos(true, s);
  assert.equal(s.getItem(LABS_AVISOS_KEY), '1');
  assert.equal(avisosVisibles({ storage: s, loc: prod, clave: 'x' }), true);
  activarAvisos(false, s);
  assert.equal(avisosVisibles({ storage: s, loc: prod, clave: 'x' }), false);
});

await caso('la app instalada que abre con &app= hereda el laboratorio de Safari (D-225)', () => {
  const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
  const prod = { hostname: 'juegosdesalon.cl' };
  const s = mem();
  assert.equal(heredarLabsDeApp({ search: '?K7Q2X&app=ab12cd', instalada: false, storage: s }), false, 'en una pestaña, no: el link pudo llegar copiado');
  assert.equal(heredarLabsDeApp({ search: '?K7Q2X', instalada: true, storage: s }), false, 'sin &app=, no');
  assert.equal(avisosVisibles({ storage: s, loc: prod, clave: 'x' }), false);
  assert.equal(heredarLabsDeApp({ search: '?K7Q2X&app=ab12cd', instalada: true, storage: s }), true);
  assert.equal(avisosVisibles({ storage: s, loc: prod, clave: 'x' }), true, 'la campana se ve en la app instalada');
});

await caso('la clave de vapid.js manda; sin ella, la de prueba vale solo en el sitio local', () => {
  const m = new Map([[VAPID_PRUEBA_KEY, 'BPRUEBA']]);
  const storage = { getItem: k => m.get(k) ?? null };
  if (VAPID_PUBLICA) {
    assert.equal(bytesDeClave(VAPID_PUBLICA).length, 65, 'vapid.js trae una pública P-256 sin comprimir');
    assert.equal(clavePublica({ storage, loc: { hostname: 'localhost' } }), VAPID_PUBLICA);
    assert.equal(clavePublica({ storage, loc: { hostname: 'juegosdesalon.cl' } }), VAPID_PUBLICA);
  } else {
    assert.equal(clavePublica({ storage, loc: { hostname: 'localhost' } }), 'BPRUEBA');
    assert.equal(clavePublica({ storage, loc: { hostname: 'juegosdesalon.cl' } }), '');
  }
});

await caso('la clave de vapid.mjs: 65 bytes que un navegador acepta (P-256 sin comprimir)', async () => {
  const { publica, privada } = parVapid();
  const bytes = bytesDeClave(publica);
  assert.equal(bytes.length, 65);
  assert.equal(bytes[0], 4);
  assert.equal(Buffer.from(privada, 'base64url').length, 32);
  // La misma importación que hace el navegador al suscribirse
  await webcrypto.subtle.importKey('raw', bytes, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
  assert.notEqual(parVapid().publica, publica, 'cada par es nuevo');
});

await caso('vapid.js: una línea con la pública, y vapid.mjs solo cambia esa línea', () => {
  const texto = readFileSync(new URL('./vapid.js', import.meta.url), 'utf8');
  assert.match(texto, /export const VAPID_PUBLICA = '[A-Za-z0-9_-]*';/);
  const otro = conClave(texto, 'ABC_-1');
  assert.ok(otro.includes("export const VAPID_PUBLICA = 'ABC_-1';"));
  assert.equal(otro.split('\n').length, texto.split('\n').length);
});

await caso('subId: corto, estable y sin la dirección adentro', async () => {
  const a = await subIdDe('https://fcm.googleapis.com/fcm/send/abc', webcrypto.subtle);
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.equal(a, await subIdDe('https://fcm.googleapis.com/fcm/send/abc', webcrypto.subtle));
  assert.notEqual(a, await subIdDe('https://fcm.googleapis.com/fcm/send/abd', webcrypto.subtle));
});

await caso('lo que se guarda: endpoint, claves, idioma y zona', () => {
  const g = paraGuardar({ endpoint: 'https://web.push.apple.com/x', keys: { p256dh: 'p', auth: 'a' }, expirationTime: null }, { lang: 'pt', tz: 'America/Sao_Paulo' });
  assert.deepEqual(g, { endpoint: 'https://web.push.apple.com/x', keys: { p256dh: 'p', auth: 'a' }, lang: 'pt', tz: 'America/Sao_Paulo' });
});

await caso('permiso: sin Notification se trata como bloqueado', () => {
  assert.equal(permiso({}), 'denied');
  assert.equal(permiso({ Notification: { permission: 'default' } }), 'default');
});

console.log(`push: ${n} casos en verde`);
