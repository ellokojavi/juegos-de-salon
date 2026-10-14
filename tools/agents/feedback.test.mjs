// El feedback 🐞 como issues (D-275, D-279): con el nombre y sin el navegador, sin menciones, y nunca dos veces el mismo reporte.
import assert from 'node:assert/strict';
import { titulo, cuerpo, pendientes, subidos, marca, donde, idDe, quiereCorreo, atendido, leerRespuestas, textoDe, nombreDe, RESPONDIDO, OLVIDADO } from './feedback.mjs';

const r = {
  id: '-P3bm', at: Date.parse('2026-10-10T18:28:23Z'), v: '0.144.0', nombre: 'Tu admirador secreto',
  texto: 'Se podrian auto tachar las pistas ya usadas. @alguien mira el #12',
  contexto: JSON.stringify({ juego: 'caso', semilla: 'HEJWN', resumen: '75/100', tiempo: '4:59', url: '/labs/case/?labs', pantallaTam: '448×891', navegador: 'Mozilla/5.0 (Linux; Android 10)' }),
};

const c = cuerpo(r);
assert.match(c, /\*\*Who:\*\* Tu admirador secreto/, 'con el nombre, para el seguimiento (D-279)');
assert.doesNotMatch(cuerpo({ ...r, nombre: undefined }), /Who/, 'sin nombre, sin la línea');
assert.match(cuerpo({ ...r, tester: 'ratoncito' }), /\*\*Lab key:\*\* ratoncito/, 'con la etiqueta de la llave del laboratorio (D-306)');
assert.doesNotMatch(c, /Mozilla|Android/, 'sin el navegador');
assert.match(c, /^> Se podrian auto tachar/, 'el texto tal cual, citado');
assert.match(c, /\*\*Game:\*\* caso/);
assert.match(c, /\*\*Version:\*\* v0\.144\.0/);
assert.match(c, /2026-10-10 18:28 UTC/);
assert.ok(c.endsWith(marca('-P3bm')));
assert.doesNotMatch(c, /@alguien|#12/, 'un @ o un # del jugador no menciona ni enlaza');
assert.match(titulo(r), /^🐞 caso: Se podrian/);
assert.ok(titulo({ ...r, texto: 'x'.repeat(200) }).length < 90, 'el título se corta');

// Dónde, con lo que haya
assert.equal(donde({ contexto: '{"labs":"de"}' }), 'lab de');
assert.equal(donde({ contexto: 'no es json' }), 'the app');

// Nunca dos veces, ni vacíos, del más viejo al más nuevo
const ya = subidos([{ body: `algo\n${marca('a')}` }, { body: null }]);
assert.deepEqual([...ya], ['a']);
const lista = [{ id: 'a', texto: 'x', at: 1 }, { id: 'c', texto: 'z', at: 3 }, { id: 'b', texto: 'y', at: 2 }, { id: 'd', texto: '  ', at: 4 }];
assert.deepEqual(pendientes(lista, ya).map(x => x.id), ['b', 'c']);

// The optional email (D-317): the issue shows the mask, never an address, and says it wants a reply
const conCorreo = cuerpo({ ...r, correoMascara: 'j********@********m' });
assert.match(conCorreo, /^- \*\*Email:\*\* `j\*{8}@\*{8}m`/m);
assert.ok(quiereCorreo(conCorreo) && !quiereCorreo(c));
assert.equal(idDe(conCorreo), '-P3bm');
assert.ok(!atendido([]) && !atendido([{ body: 'thanks' }]));
assert.ok(atendido([{ body: `📧 sent\n${RESPONDIDO}` }]) && atendido([{ body: OLVIDADO }]));
// One answer, or one per issue under "#<n>" (several comments of a player in one email)
assert.deepEqual(leerRespuestas('  Ya está arreglado.\n', ['383']), { 383: 'Ya está arreglado.' });
assert.deepEqual(leerRespuestas('#383\nUno.\n\n#401\nDos,\nen dos líneas.\n', ['383', '401']), { 383: 'Uno.', 401: 'Dos,\nen dos líneas.' });
assert.throws(() => leerRespuestas('Ya está — arreglado.', ['1']), /dash/);
assert.throws(() => leerRespuestas('   ', ['1']));
assert.throws(() => leerRespuestas('Una sola para dos', ['1', '2']), /#<n>/);
assert.throws(() => leerRespuestas('#1\nUno.', ['1', '2']), /missing #2/);
assert.throws(() => leerRespuestas('#1\nUno.\n#3\nTres.', ['1']), /extra #3/);
assert.throws(() => leerRespuestas('Hola\n#1\nUno.', ['1']), /before/);
assert.equal(textoDe(c), 'Se podrian auto tachar las pistas ya usadas. @alguien mira el #12');
assert.equal(nombreDe(conCorreo), 'Tu admirador secreto');
assert.equal(nombreDe('> hola\n\n- **Quién:** Cris\n- **Juego:** loteo'), 'Cris', 'issues from before D-316 say Quién');
assert.equal(nombreDe(cuerpo({ ...r, nombre: '@cris' })), '@cris');
assert.equal(nombreDe(cuerpo({ ...r, nombre: '' })), '');

console.log('feedback: ok');
