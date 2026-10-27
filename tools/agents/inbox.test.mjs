// The hola@ inbox tool (D-318): an email becomes the same report as the app's 🐞, with the address only in the private part; never the admin key.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { report, show, skipsSince, kept } from './inbox.mjs';
import { enmascarar as maskEmail } from '../../public/cup/reportes.js';
import { enviarReporte } from '../../public/cup/reportes.js';

const email = { de: 'Ana@Correo.cl', nombre: 'Ana Pérez de la Fuente Larguísima y Más', asunto: 'Mi teléfono es 555', texto: 'Hola\nel botón no responde', at: Date.parse('2026-10-14T20:00:00Z') };
const r = report(email, '  El botón de Enviar no responde en La Copa.\n', 'es');
assert.equal(r.texto, 'El botón de Enviar no responde en La Copa.');
assert.equal(r.correo, 'Ana@Correo.cl', 'the address goes to enviarReporte, which keeps it out of the public node');
assert.ok(r.nombre.length <= 40 && r.nombre.startsWith('Ana Pérez'));
assert.deepEqual(JSON.parse(r.contexto), { canal: 'email', idioma: 'es' });
assert.ok(!JSON.stringify(r).includes('555'), 'the subject is not published');
assert.ok(!('correo' in report({ ...email, de: 'no es correo' }, 'x', 'en')), 'no valid address, no contact');
assert.throws(() => report(email, ' ', 'es'), /empty/);
assert.throws(() => report(email, 'x'.repeat(1001), 'es'), /summarize/);
assert.throws(() => report(email, 'x', 'fr'), /--lang/);

// What the agent reads: the address masked, the text indented, automatic senders flagged
const m = show('-Nabc', { ...email, automatico: true });
assert.ok(m.includes('A********a@C********l') && !m.includes('Correo.cl'));
assert.ok(m.includes('⚠️ automatic sender') && m.includes('  el botón no responde') && m.includes('2026-10-14 20:00 UTC'));

// Never the admin key: the inbox user only
const source = readFileSync(new URL('./inbox.mjs', import.meta.url), 'utf8');
assert.ok(!/firebase-admin|access_token/.test(source), 'inbox.mjs must not use the owner\'s admin key');
// The reply goes in the sender's thread (D-327): Message-ID and subject travel only with the private address
const threaded = report({ de: 'ana@correo.cl', nombre: 'Ana', asunto: 'Hola', idMensaje: '<x@mail.cl>' }, 'Me gustó', 'es');
assert.deepEqual(threaded.hilo, { idMensaje: '<x@mail.cl>', asunto: 'Hola' });
assert.equal(report({ de: 'ana@correo.cl', asunto: 'Hola' }, 'Me gustó', 'es').hilo, undefined);
const sent = [];
await enviarReporte(threaded, async (url, o) => { sent.push({ url, body: JSON.parse(o.body) }); return { ok: true, json: async () => ({ name: 'r1' }) }; }, null);
assert.ok(!('hilo' in sent[0].body) && !JSON.stringify(sent[0].body).includes('x@mail.cl'), 'the thread never goes in the public report');
assert.ok(sent[1].url.includes('feedbackContacto/r1') && sent[1].body.idMensaje === '<x@mail.cl>' && sent[1].body.asunto === 'Hola');
console.log('inbox: ok');

// A skip stays checkable (D-452): the round lists skips by reason only, the owner reads the kept text
const logText = [
  { at: '2026-10-25T10:00:00Z', email: 'a', action: 'ingest', from: 'x' },
  { at: '2026-10-26T02:29:16Z', email: 'b', action: 'skip', reason: 'manipulation', from: 'c********u@g********m' },
  { at: '2026-10-20T00:00:00Z', email: 'c', action: 'skip', reason: 'spam', from: null },
].map(e => JSON.stringify(e)).join('\n') + '\nnot json\n';
assert.deepEqual(skipsSince(logText, '2026-10-21').map(e => e.email), ['b']);
const k = kept('b', { ...email, de: 'friend@mail.com' }, 'manipulation');
assert.equal(k.from, maskEmail('friend@mail.com'));
assert.ok(!JSON.stringify(k).includes('friend@mail.com'), 'the kept copy carries no address');
assert.equal(k.text, email.texto);
assert.equal(k.received, '2026-10-14T20:00:00Z');

// A text that looks like a key or a token is refused before it becomes a report (#838)
assert.throws(() => report(email, '{"type": "service_account", "private_key": "-----BEGIN PRIVATE KEY-----"}', 'en'), /key or a token/);
