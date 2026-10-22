// The 🐞 feedback as issues (D-275, D-279): with the name and without the browser, without mentions, and never the same report twice.
import assert from 'node:assert/strict';
import { greetingName, title, body, pending, uploaded, looksShort, marker, where, idOf, wantsEmail, handled, readAnswers, textOf, nameOf, EMAILED, FORGOTTEN } from './feedback.mjs';

const r = {
  id: '-P3bm', at: Date.parse('2026-10-10T18:28:23Z'), v: '0.144.0', nombre: 'Tu admirador secreto',
  texto: 'Se podrian auto tachar las pistas ya usadas. @alguien mira el #12',
  contexto: JSON.stringify({ juego: 'caso', semilla: 'HEJWN', resumen: '75/100', tiempo: '4:59', url: '/labs/case/?labs', pantallaTam: '448×891', navegador: 'Mozilla/5.0 (Linux; Android 10)' }),
};

const c = body(r);
assert.match(c, /\*\*Who:\*\* T\* a\*{8} s\*{6}$/m, 'the name masked, each word by its first letter (D-279, D-366)');
assert.doesNotMatch(c, /admirador/, 'never the full name on the public issue (D-366)');
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

// The optional email (D-317): the issue shows the mask, never an address, and says it wants a reply
const withEmail = body({ ...r, correoMascara: 'j********n@g********m' });
assert.match(withEmail, /^- \*\*Email:\*\* `j\*{8}n@g\*{8}m`/m);
assert.match(body({ ...r, correoMascara: 'j********@********m' }), /`j\*{8}@\*{8}m`/, 'the older mask, from a cached app, still shows');
assert.doesNotMatch(body({ ...r, correoMascara: 'jirigoyen@gmail.com' }), /Email/, 'never an address');
assert.ok(wantsEmail(withEmail) && !wantsEmail(c));
assert.equal(idOf(withEmail), '-P3bm');
assert.ok(!handled([]) && !handled([{ body: 'thanks' }]));
assert.ok(handled([{ body: `📧 sent\n${EMAILED}` }]) && handled([{ body: FORGOTTEN }]));
// One answer, or one per issue under "#<n>" (several comments of a player in one email)
assert.deepEqual(readAnswers('  Ya está arreglado.\n', ['383']), { 383: 'Ya está arreglado.' });
assert.deepEqual(readAnswers('#383\nUno.\n\n#401\nDos,\nen dos líneas.\n', ['383', '401']), { 383: 'Uno.', 401: 'Dos,\nen dos líneas.' });
assert.throws(() => readAnswers('Ya está — arreglado.', ['1']), /dash/);
assert.throws(() => readAnswers('   ', ['1']));
assert.throws(() => readAnswers('Una sola para dos', ['1', '2']), /#<n>/);
assert.throws(() => readAnswers('#1\nUno.', ['1', '2']), /missing #2/);
assert.throws(() => readAnswers('#1\nUno.\n#3\nTres.', ['1']), /extra #3/);
assert.throws(() => readAnswers('Hola\n#1\nUno.', ['1']), /before/);
assert.equal(textOf('> uno\n> dos\n\n- x'), 'uno\ndos');
assert.equal(textOf(c), 'Se podrian auto tachar las pistas ya usadas. @alguien mira el #12');
assert.equal(nameOf(withEmail), 'T* a******** s******');
assert.equal(nameOf('> hola\n\n- **Quién:** Cris\n- **Juego:** loteo'), 'Cris', 'issues from before D-316 say Quién');
assert.equal(nameOf(body({ ...r, nombre: '@cris' })), '@****');
assert.equal(nameOf(body({ ...r, nombre: '' })), '');

// A report that arrived by email to hola@ (D-318) says so
const byEmail = { ...r, contexto: JSON.stringify({ canal: 'email', idioma: 'es' }) };
assert.equal(where(byEmail), 'email');
assert.match(body(byEmail), /Arrived by email to hola@juegosdesalon\.cl/);
assert.doesNotMatch(body(byEmail), /🐞 button/);
assert.match(title(byEmail), /^🐞 email: /);

console.log('feedback: ok');

// D-328: the doubt's public pointer carries no private detail, only the issue number
{
  const { doubtSubject, gmailSearch } = await import('./feedback.mjs');
  if (!doubtSubject(435).startsWith('[JdS duda 435]')) throw new Error('doubt subject');
  if (decodeURIComponent(gmailSearch(435).split('#search/')[1]) !== 'subject:"JdS duda 435"') throw new Error('gmail search');
  console.log('feedback doubt: ok');
}

// The inbox's kind (D-345): a known one adds its label, an unknown one or none adds nothing
{
  const { labelsOf, KIND_LABELS } = await import('./feedback.mjs');
  assert.deepEqual(labelsOf({ texto: 'x' }), ['feedback'], 'without a kind, only feedback');
  assert.deepEqual(labelsOf({ texto: 'x', tipo: 'idea' }), ['feedback', 'feedback:game-idea'], 'a game idea gets its label');
  assert.deepEqual(labelsOf({ texto: 'x', tipo: 'hack' }), ['feedback'], 'an unknown kind adds nothing');
  assert.deepEqual(Object.keys(KIND_LABELS).sort(), ['idea', 'otro', 'problema', 'sugerencia'], 'the same list the rules accept');
}

// The reply greets with the real name from the report, never the issue's mask (D-366)
assert.equal(greetingName({ nombre: ' Tu admirador secreto ' }, c), 'Tu admirador secreto');
assert.equal(greetingName(null, c), '', 'no report: no name, never the mask');
assert.equal(greetingName(null, '- **Quién:** Cris'), 'Cris', 'an old issue with the name unmasked');

// The emailed comment quotes what the player was told and still marks the issue handled (D-368)
{
  const { emailedComment, handled } = await import('./feedback.mjs');
  const body = emailedComment({ mask: 'c****o@g****m', answer: 'Line one.\nLine two.' });
  assert.ok(body.includes('> Line one.\n> Line two.'), 'quotes the answer');
  assert.ok(body.includes('closed as resolved'), 'says it was resolved');
  assert.ok(!body.includes('@g****m`') || body.includes('c****o@g****m'), 'only the mask');
  assert.ok(handled([{ body }]), 'counts as handled');
}

// In the sender's own thread the email is not quoted again; outside it, it is (D-370)
{
  const { inThread } = await import('./feedback.mjs');
  const thread = { id: '<a@mail>', subject: 'Hola' };
  assert.equal(inThread({ thread }, thread), true, 'the email of the thread');
  assert.equal(inThread({ thread: null }, thread), false, 'a 🐞 report');
  assert.equal(inThread({ thread: { id: '<b@mail>' } }, thread), false, 'another thread');
  assert.equal(inThread({ thread }, null), false, 'no thread (test email)');
}

// An empty or partial issue list is not taken as 20 new reports (2026-10-22: 40 duplicates)
const twenty = Array.from({ length: 20 }, (_, i) => ({ id: `r${i}`, texto: 'x', at: i }));
assert.ok(looksShort(twenty, pending(twenty, uploaded([]))), 'an empty list uploads nothing');
assert.ok(!looksShort(twenty, twenty.slice(0, 2)), 'two new reports go up');
assert.ok(!looksShort(twenty.slice(0, 3), twenty.slice(0, 3)), 'the first few reports ever go up');
