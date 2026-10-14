// The 🐞 feedback as issues (D-275, D-279): with the name and without the browser, without mentions, and never the same report twice.
import assert from 'node:assert/strict';
import { title, body, pending, uploaded, marker, where } from './feedback.mjs';

const r = {
  id: '-P3bm', at: Date.parse('2026-10-10T18:28:23Z'), v: '0.144.0', nombre: 'Tu admirador secreto',
  texto: 'Se podrian auto tachar las pistas ya usadas. @alguien mira el #12',
  contexto: JSON.stringify({ juego: 'caso', semilla: 'HEJWN', resumen: '75/100', tiempo: '4:59', url: '/labs/case/?labs', pantallaTam: '448×891', navegador: 'Mozilla/5.0 (Linux; Android 10)' }),
};

const c = body(r);
assert.match(c, /\*\*Who:\*\* Tu admirador secreto/, 'with the name, for the follow-up (D-279)');
assert.doesNotMatch(body({ ...r, nombre: undefined }), /Who/, 'without a name, without the line');
assert.match(body({ ...r, tester: 'ratoncito' }), /\*\*Lab key:\*\* ratoncito/, 'with the label of the lab key (D-306)');
assert.doesNotMatch(c, /Mozilla|Android/, 'without the browser');
assert.match(c, /^> Se podrian auto tachar/, 'the text as is, quoted');
assert.match(c, /\*\*Game:\*\* caso/);
assert.match(c, /\*\*Version:\*\* v0\.144\.0/);
assert.match(c, /2026-10-10 18:28 UTC/);
assert.ok(c.endsWith(marker('-P3bm')));
assert.doesNotMatch(c, /@alguien|#12/, "a player's @ or # neither mentions nor links");
assert.match(title(r), /^🐞 caso: Se podrian/);
assert.ok(title({ ...r, texto: 'x'.repeat(200) }).length < 90, 'the title is cut');

// Where, with whatever there is
assert.equal(where({ contexto: '{"labs":"de"}' }), 'lab de');
assert.equal(where({ contexto: 'no es json' }), 'the app');

// Never twice, nor empty ones, oldest to newest
const already = uploaded([{ body: `something\n${marker('a')}` }, { body: null }]);
assert.deepEqual([...already], ['a']);
const list = [{ id: 'a', texto: 'x', at: 1 }, { id: 'c', texto: 'z', at: 3 }, { id: 'b', texto: 'y', at: 2 }, { id: 'd', texto: '  ', at: 4 }];
assert.deepEqual(pending(list, already).map(x => x.id), ['b', 'c']);

console.log('feedback: ok');
