// Tests de los reportes sin cuenta (D-104, D-109): node public/cup/reportes.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enviarReporte, reenviarPendientes, correoValido, enmascarar, enmascararNombre } from './reportes.js';

const almacen = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
const falla = async () => ({ ok: false, status: 401 });
const anda = enviados => async (_, o) => { enviados.push(JSON.parse(o.body)); return { ok: true }; };

const a = almacen();
await enviarReporte({ texto: 'hola' }, anda([]), a);
assert.equal(a.getItem('juegos-de-salon:copa:reportes-pendientes'), null);

// Si las reglas lo rechazan, queda guardado y se avisa
await assert.rejects(enviarReporte({ texto: 'uno' }, falla, a), e => e.code === 'reporte' && e.guardado === true);
await assert.rejects(enviarReporte({ texto: 'dos' }, falla, a), e => e.guardado);
assert.equal(await reenviarPendientes(falla, a), 0);
assert.equal(JSON.parse(a.getItem('juegos-de-salon:copa:reportes-pendientes')).length, 2);

// Cuando vuelve a andar, se envían y el dispositivo queda limpio
const enviados = [];
assert.equal(await reenviarPendientes(anda(enviados), a), 2);
assert.deepEqual(enviados.map(r => r.texto), ['uno', 'dos']);
assert.ok(enviados.every(r => r.at['.sv'] === 'timestamp'));
assert.equal(a.getItem('juegos-de-salon:copa:reportes-pendientes'), null);

// Quien entró al laboratorio con su llave manda su etiqueta, nunca la llave (D-306)
const conLlave = almacen();
conLlave.setItem('juegos-de-salon:labs-quien', 'ratoncito');
conLlave.setItem('juegos-de-salon:labs-llave', 'ratoncito-secreta');
const conTester = [];
await enviarReporte({ texto: 'hola' }, anda(conTester), conLlave);
assert.equal(conTester[0].tester, 'ratoncito');
assert.ok(!JSON.stringify(conTester[0]).includes('secreta'), 'la llave no viaja');
const sinTester = [];
await enviarReporte({ texto: 'hola' }, anda(sinTester), almacen());
assert.ok(!('tester' in sinTester[0]), 'sin llave, no va el campo');

// The optional email (D-317): the public node only gets the mask; the address goes to the private node
assert.equal(enmascarar('jirigoyen@gmail.com'), 'j********n@g********m');
assert.equal(enmascarar('a@b.cl'), 'a********a@b********l');
assert.equal(enmascararNombre('  Cristina   Alvarado '), 'C******* A*******');
assert.equal(enmascararNombre('Ñandú'), 'Ñ****');
assert.equal(enmascararNombre(''), '');
assert.equal(correoValido(' ana@correo.cl '), 'ana@correo.cl');
for (const malo of ['', 'ana', 'ana@correo', '@correo.cl', 'a b@correo.cl', `${'a'.repeat(110)}@correo.cl`]) assert.equal(correoValido(malo), '', malo);
{
  const pedidos = [];
  const red = async (url, o) => { pedidos.push({ url, o, body: JSON.parse(o.body) }); return { ok: true, json: async () => ({ name: '-Nabc' }) }; };
  await enviarReporte({ texto: 'hola', correo: 'ana@correo.cl' }, red, almacen());
  assert.equal(pedidos.length, 2);
  assert.match(pedidos[0].url, /\/feedback\.json$/);
  assert.ok(!JSON.stringify(pedidos[0].body).includes('ana@'), 'the address never reaches the public node');
  assert.equal(pedidos[0].body.correoMascara, 'a********a@c********l');
  assert.match(pedidos[1].url, /\/feedbackContacto\/-Nabc\.json$/);
  assert.equal(pedidos[1].o.method, 'PUT');
  assert.equal(pedidos[1].body.correo, 'ana@correo.cl');
  // Without an address (or with a bad one), one request and no mask
  pedidos.length = 0;
  await enviarReporte({ texto: 'hola', correo: 'nada' }, red, almacen());
  assert.equal(pedidos.length, 1);
  assert.ok(!('correoMascara' in pedidos[0].body) && !('correo' in pedidos[0].body));
  // If only the address fails, the report counts as sent and only the address is retried
  const a2 = almacen();
  const soloReporte = async url => (url.includes('feedbackContacto') ? { ok: false } : { ok: true, json: async () => ({ name: '-Nxyz' }) });
  await enviarReporte({ texto: 'hola', correo: 'ana@correo.cl' }, soloReporte, a2);
  assert.deepEqual(JSON.parse(a2.getItem('juegos-de-salon:copa:reportes-pendientes')), [{ contactoDe: '-Nxyz', correo: 'ana@correo.cl' }]);
  pedidos.length = 0;
  assert.equal(await reenviarPendientes(red, a2), 1);
  assert.deepEqual(pedidos.map(p => p.url.split('/').slice(-2).join('/')), ['feedbackContacto/-Nxyz.json']);
  assert.equal(a2.getItem('juegos-de-salon:copa:reportes-pendientes'), null);
}

// The rules keep it that way: the address node is never readable without the owner's key, and
// the public node only takes the mask (D-317)
{
  const reglas = JSON.parse(readFileSync(new URL('../../firebase/database.rules.json', import.meta.url), 'utf8')).rules;
  assert.equal(reglas.feedbackContacto['.read'], false);
  // The emails to hola@ (D-318): only the inbox user reads or writes them
  // Only the inbox user, never anyone else, and never the whole tree
  const BUZON = "auth != null && auth.uid === '12ld0xRh0CM3BodWvKh8bCRmZ232'";
  assert.equal(reglas.buzon['.read'], BUZON);
  assert.equal(reglas.buzon.$id['.write'], BUZON);
  assert.ok(!('.write' in reglas.buzon), 'nobody writes the whole inbox at once');
  assert.ok(!JSON.stringify(reglas.feedbackContacto).includes('".read":true'));
  const mascara = new RegExp(reglas.feedback.$id.correoMascara['.validate'].match(/matches\(\/(.*)\/\)/)[1]);
  assert.ok(mascara.test(enmascarar('jirigoyen@gmail.com')) && !mascara.test('jirigoyen@gmail.com'));
  assert.ok(mascara.test('j********@********m'), 'the older mask, from a cached app, still gets in (D-366)');
  assert.ok(!('correo' in reglas.feedback.$id), 'the public node has no field for the address');
}

console.log('copa/reportes: OK');
