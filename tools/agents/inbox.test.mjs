// The hola@ inbox tool (D-318): an email becomes the same report as the app's 🐞, with the address only in the private part; never the admin key.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { report, show } from './inbox.mjs';

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
assert.ok(m.includes('A********@********l') && !m.includes('Correo.cl'));
assert.ok(m.includes('⚠️ automatic sender') && m.includes('  el botón no responde') && m.includes('2026-10-14 20:00 UTC'));

// Never the admin key: the inbox user only
const source = readFileSync(new URL('./inbox.mjs', import.meta.url), 'utf8');
assert.ok(!/firebase-admin|access_token/.test(source), 'inbox.mjs must not use the owner\'s admin key');
console.log('inbox: ok');
