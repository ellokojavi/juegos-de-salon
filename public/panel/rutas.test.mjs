// Las rutas del panel: secciones y fichas en el # de la URL (D-207). Ejecutar: node public/panel/rutas.test.mjs
import assert from 'node:assert/strict';
import { SECCIONES, leerRuta, rutaA, rutaEnIngles, seccionDe } from './rutas.js';

const sin = { r: null, e: null };
assert.equal(SECCIONES[0], 'resumen', 'the panel opens on the summary (D-348)');
assert.deepEqual(leerRuta(''), { sec: 'resumen', args: [], ...sin });
assert.deepEqual(leerRuta('#/now'), { sec: 'ahora', args: [], ...sin }, 'Now still opens, as part of Summary');
assert.equal(seccionDe(leerRuta('#/now')), 'resumen');
assert.equal(leerRuta('#/games').sec, 'grupo', 'the sections before D-348 open the one that took their place');
assert.equal(leerRuta('#/audience').sec, 'usuarios');
assert.equal(leerRuta('#/individual').sec, 'individuales');
assert.equal(leerRuta('#/daily').sec, 'unoaldia');
assert.equal(rutaA('usuarios', [], {}), '#/users');
assert.deepEqual(leerRuta('#/cup'), { sec: 'torneo', args: [], ...sin });
assert.deepEqual(leerRuta('#/cup/OFICI'), { sec: 'torneo', args: ['OFICI'], ...sin });
assert.deepEqual(leerRuta('#/room/ABCD/20342'), { sec: 'sala', args: ['ABCD', '20342'], ...sin });
assert.deepEqual(leerRuta('#/game/battleship?r=30d&e=dev'), { sec: 'juego', args: ['batalla-naval'], r: '30d', e: 'dev' });

// Las direcciones en español (antes de D-266) se leen igual
assert.deepEqual(leerRuta('#/torneo/OFICI'), { sec: 'torneo', args: ['OFICI'], ...sin });
assert.deepEqual(leerRuta('#/sala/ABCD/20342'), { sec: 'sala', args: ['ABCD', '20342'], ...sin });
assert.deepEqual(leerRuta('#/juego/batalla-naval'), { sec: 'juego', args: ['batalla-naval'], ...sin });
assert.equal(leerRuta('#/trafico').sec, 'trafico');

// Lo que no se entiende cae en la primera sección
assert.equal(leerRuta('#/nada').sec, 'resumen');
assert.equal(leerRuta('#/traffic').sec, 'trafico');
assert.equal(leerRuta('#/room').sec, 'resumen', 'una ficha sin código no es una ficha');

// Los enlaces de antes de D-207 siguen sirviendo
assert.equal(leerRuta('#torneo').sec, 'torneo');
assert.equal(leerRuta('#resumen').sec, 'resumen');
assert.equal(leerRuta('#juegos').sec, 'grupo');

// Ida y vuelta, en inglés y con lo de siempre fuera de la URL
const def = { rDefecto: '7d', eDefecto: 'prod' };
assert.equal(rutaA('torneo', ['OFICI'], { r: '7d', e: 'prod', ...def }), '#/cup/OFICI');
assert.equal(rutaA('torneo', [], { r: '30d', e: 'prod', ...def }), '#/cup?r=30d');
assert.equal(rutaA('juego', ['ahorcado'], def), '#/game/hangman');
assert.equal(rutaA('sala', ['ABCD', '20342'], def), '#/room/ABCD/20342');
assert.deepEqual(leerRuta(rutaA('juego', ['linea-de-tiempo'], { r: '90d', e: 'dev', ...def })), { sec: 'juego', args: ['linea-de-tiempo'], r: '90d', e: 'dev' });

// Una dirección de antes queda en inglés, con su rango y su entorno
assert.equal(rutaEnIngles('#/torneo/OFICI?r=30d'), '#/cup/OFICI?r=30d');
assert.equal(rutaEnIngles('#/juego/ahorcado'), '#/game/hangman');
assert.equal(rutaEnIngles('#torneo'), '#/cup');
assert.equal(rutaEnIngles('#/cup/OFICI'), '#/cup/OFICI');
assert.equal(rutaEnIngles(''), '');

// La navegación marca la sección de la ficha
assert.equal(seccionDe(leerRuta('#/game/liars-dice')), 'grupo');
assert.equal(seccionDe(leerRuta('#/room/ABCD')), 'grupo');
assert.equal(seccionDe(leerRuta('#/cup/OFICI')), 'torneo');

console.log('rutas.test.mjs: todo en verde');
