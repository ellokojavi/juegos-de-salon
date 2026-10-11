// El feedback 🐞 como issues (D-275): sin nombre ni navegador, sin menciones, y nunca dos veces el mismo reporte.
import assert from 'node:assert/strict';
import { titulo, cuerpo, pendientes, subidos, marca, donde } from './feedback.mjs';

const r = {
  id: '-P3bm', at: Date.parse('2026-10-10T18:28:23Z'), v: '0.144.0', nombre: 'Tu admirador secreto',
  texto: 'Se podrian auto tachar las pistas ya usadas. @alguien mira el #12',
  contexto: JSON.stringify({ juego: 'caso', semilla: 'HEJWN', resumen: '75/100', tiempo: '4:59', url: '/labs/case/?labs', pantallaTam: '448×891', navegador: 'Mozilla/5.0 (Linux; Android 10)' }),
};

const c = cuerpo(r);
assert.doesNotMatch(c, /admirador/, 'sin el nombre del jugador');
assert.doesNotMatch(c, /Mozilla|Android/, 'sin el navegador');
assert.match(c, /^> Se podrian auto tachar/, 'el texto tal cual, citado');
assert.match(c, /\*\*Juego:\*\* caso/);
assert.match(c, /\*\*Versión:\*\* v0\.144\.0/);
assert.match(c, /2026-10-10 18:28 UTC/);
assert.ok(c.endsWith(marca('-P3bm')));
assert.doesNotMatch(c, /@alguien|#12/, 'un @ o un # del jugador no menciona ni enlaza');
assert.match(titulo(r), /^🐞 caso: Se podrian/);
assert.ok(titulo({ ...r, texto: 'x'.repeat(200) }).length < 90, 'el título se corta');

// Dónde, con lo que haya
assert.equal(donde({ contexto: '{"labs":"de"}' }), 'laboratorio de');
assert.equal(donde({ contexto: 'no es json' }), 'la app');

// Nunca dos veces, ni vacíos, del más viejo al más nuevo
const ya = subidos([{ body: `algo\n${marca('a')}` }, { body: null }]);
assert.deepEqual([...ya], ['a']);
const lista = [{ id: 'a', texto: 'x', at: 1 }, { id: 'c', texto: 'z', at: 3 }, { id: 'b', texto: 'y', at: 2 }, { id: 'd', texto: '  ', at: 4 }];
assert.deepEqual(pendientes(lista, ya).map(x => x.id), ['b', 'c']);

console.log('feedback: ok');
