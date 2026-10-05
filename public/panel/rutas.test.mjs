// Las rutas del panel: secciones y fichas en el # de la URL (D-207). Ejecutar: node public/panel/rutas.test.mjs
import assert from 'node:assert/strict';
import { SECCIONES, leerRuta, rutaA, seccionDe } from './rutas.js';

const sin = { r: null, e: null };
assert.equal(SECCIONES[0], 'ahora', 'el panel abre en lo que está pasando');
assert.deepEqual(leerRuta(''), { sec: 'ahora', args: [], ...sin });
assert.deepEqual(leerRuta('#/torneo'), { sec: 'torneo', args: [], ...sin });
assert.deepEqual(leerRuta('#/torneo/OFICI'), { sec: 'torneo', args: ['OFICI'], ...sin });
assert.deepEqual(leerRuta('#/sala/ABCD/20342'), { sec: 'sala', args: ['ABCD', '20342'], ...sin });
assert.deepEqual(leerRuta('#/juego/batalla-naval?r=30d&e=dev'), { sec: 'juego', args: ['batalla-naval'], r: '30d', e: 'dev' });

// Lo que no se entiende cae en la primera sección
assert.equal(leerRuta('#/nada').sec, 'ahora');
assert.equal(leerRuta('#/trafico').sec, 'trafico');
assert.equal(leerRuta('#/sala').sec, 'ahora', 'una ficha sin código no es una ficha');

// Los enlaces de antes de D-207 siguen sirviendo
assert.equal(leerRuta('#torneo').sec, 'torneo');
assert.equal(leerRuta('#resumen').sec, 'ahora');
assert.equal(leerRuta('#juegos').sec, 'juegos');

// Ida y vuelta, con lo de siempre fuera de la URL
const def = { rDefecto: '7d', eDefecto: 'prod' };
assert.equal(rutaA('torneo', ['OFICI'], { r: '7d', e: 'prod', ...def }), '#/torneo/OFICI');
assert.equal(rutaA('torneo', [], { r: '30d', e: 'prod', ...def }), '#/torneo?r=30d');
assert.deepEqual(leerRuta(rutaA('juego', ['linea-de-tiempo'], { r: '90d', e: 'dev', ...def })), { sec: 'juego', args: ['linea-de-tiempo'], r: '90d', e: 'dev' });

// La navegación marca la sección de la ficha
assert.equal(seccionDe(leerRuta('#/juego/dudo')), 'juegos');
assert.equal(seccionDe(leerRuta('#/sala/ABCD')), 'juegos');
assert.equal(seccionDe(leerRuta('#/torneo/OFICI')), 'torneo');

console.log('rutas.test.mjs: todo en verde');
