// The hola@ Worker's email parsing (D-318): plain text first, encodings, headers, automatic senders; and the DB URL is the app's.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker, { registro, texto, palabras, remitente, transferencia, token, USUARIO, MAX_TEXTO } from './hola-worker.js';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';

const bin = s => String.fromCharCode(...new TextEncoder().encode(s));

// A plain email in UTF-8, 8bit
const simple = bin('From: "Ana Pérez" <Ana@Correo.cl>\r\nTo: hola@juegosdesalon.cl\r\nSubject: =?UTF-8?Q?Pregunta_sobre_La_Copa?=\r\nMessage-ID: <x1@correo.cl>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n¿Cómo invito a mis amigos?\r\n\r\n\r\n\r\nGracias');
const r = registro(simple);
assert.deepEqual({ de: r.de, nombre: r.nombre, asunto: r.asunto, texto: r.texto, automatico: r.automatico }, { de: 'ana@correo.cl', nombre: 'Ana Pérez', asunto: 'Pregunta sobre La Copa', texto: '¿Cómo invito a mis amigos?\n\nGracias', automatico: false });

// multipart/alternative: the plain part wins; quoted-printable and base64 decoded
const qp = bin('From: Bob <bob@x.com>\r\nSubject: =?utf-8?B?SG9sYSDwn5GL?=\r\nContent-Type: multipart/alternative; boundary="b1"\r\n\r\n--b1\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<p>html</p>\r\n--b1\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nEl bot=C3=B3n no responde, =\r\nni en el celular.\r\n--b1--\r\n');
assert.equal(registro(qp).texto, 'El botón no responde, ni en el celular.');
assert.equal(registro(qp).asunto, 'Hola 👋');
// Only HTML: without tags; an attachment is ignored; nested multipart
const html = bin('From: c@x.com\r\nContent-Type: multipart/mixed; boundary=m\r\n\r\n--m\r\nContent-Type: multipart/alternative; boundary=a\r\n\r\n--a\r\nContent-Type: text/html; charset=iso-8859-1\r\nContent-Transfer-Encoding: base64\r\n\r\n' + Buffer.from('<div>Me encant\xf3<br>el juego &amp; m&aacute;s</div>', 'latin1').toString('base64') + '\r\n--a--\r\n--m\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename=x.pdf\r\n\r\nJVBERi0=\r\n--m--\r\n');
assert.equal(registro(html).texto, 'Me encantó\nel juego & m&aacute;s');
assert.equal(registro(html).de, 'c@x.com');
// Helpers
assert.equal(palabras('=?iso-8859-1?Q?Sal=F3n?= de =?utf-8?B?SnVlZ29z?='), 'Salón de Juegos');
assert.deepEqual(remitente('plain@x.com'), { nombre: '', correo: 'plain@x.com' });
assert.equal(new TextDecoder().decode(transferencia('aG9sYQ==', 'base64')), 'hola');
assert.equal(texto(bin('Content-Type: image/png\r\n\r\nxx')), '');
// Bounces and no-reply senders are marked, for the agent to skip
assert.ok(registro(bin('From: MAILER-DAEMON@x.com\r\n\r\nfail')).automatico);
assert.ok(registro(bin('From: a@x.com\r\nAuto-Submitted: auto-replied\r\n\r\nvacaciones')).automatico);
// Long texts are cut; no From header falls back to the envelope sender
assert.equal(registro(bin('From: a@x.com\r\n\r\n' + 'x'.repeat(MAX_TEXTO + 50))).texto.length, MAX_TEXTO + 1);
assert.equal(registro(bin('Subject: s\r\n\r\nhola'), 'Env@X.com').de, 'env@x.com');
// The Worker writes to the app's database
assert.ok(readFileSync(new URL('./hola-worker.js', import.meta.url), 'utf8').includes(`const DB = '${firebaseConfig.databaseURL}'`));
// The Worker signs in as the inbox user (never the admin key) and writes buzon/ with its token
{
  assert.ok(!readFileSync(new URL('./hola-worker.js', import.meta.url), 'utf8').includes('private_key'), 'no service account in the Worker');
  assert.ok(readFileSync(new URL('./hola-worker.js', import.meta.url), 'utf8').includes(`const API_KEY = '${firebaseConfig.apiKey}'`));
  const pedidos = [];
  globalThis.fetch = async (url, o) => {
    pedidos.push({ url: String(url), o });
    if (String(url).includes('signInWithPassword')) return { ok: true, json: async () => ({ idToken: 'tok', expiresIn: '3600' }) };
    return { ok: true };
  };
  assert.equal(await token('secreta'), 'tok');
  assert.deepEqual(JSON.parse(pedidos[0].o.body), { email: USUARIO, password: 'secreta', returnSecureToken: true });
  // The whole Worker: forwards first, then writes to buzon/ with the token
  const reenvios = [];
  const raw = new Blob([Buffer.from('From: Ana <ana@x.cl>\r\nSubject: Hola\r\n\r\nUn comentario', 'utf8')]).stream();
  await worker.email({ raw, from: 'ana@x.cl', forward: async a => reenvios.push(a) }, { BUZON_PASSWORD: 'secreta', FORWARD_TO: 'owner@gmail.com' });
  assert.deepEqual(reenvios, ['owner@gmail.com']);
  const escrito = pedidos.at(-1);
  assert.match(escrito.url, /\/buzon\.json\?auth=tok$/);
  assert.equal(JSON.parse(escrito.o.body).texto, 'Un comentario');
  assert.deepEqual(JSON.parse(escrito.o.body).at, { '.sv': 'timestamp' });
}
console.log('hola-worker: ok');
