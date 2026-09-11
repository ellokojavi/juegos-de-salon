// Ejecutar: node panel/aggregate.test.mjs
import assert from 'node:assert/strict';
import { DAY, ROOM_TTL, liveRooms, connections, summarize, top, tzLabel, ago, dayLabel, codesOfDays, splitByEnv } from './aggregate.js';

const now = 20342 * DAY + 15 * 60 * 60 * 1000; // día 20342, 15:00 UTC

// Salas vivas: se descartan las vencidas, se cuentan conectados y mensajes
const rooms = {
  ABCD: { createdAt: now - 5 * 60 * 1000, game: 'toque-y-fama', players: { A: { name: 'Javi', online: true }, B: { name: 'Cata', online: false } }, messages: { m1: { t: 'hello', at: now - 4 * 60 * 1000 }, m2: { t: 'guess', at: now - 60 * 1000 } } },
  EFGH: { createdAt: now - 3 * 60 * 60 * 1000, game: 'linea-de-tiempo', players: { A: { name: 'Fausto', online: false } } },
  VIEJ: { createdAt: now - ROOM_TTL - 1000, game: 'batalla-naval', players: { A: { name: 'x', online: true } } },
  MALA: { game: 'sin-fecha' },
};
const live = liveRooms(rooms, now);
assert.deepEqual(live.map(r => r.code), ['ABCD', 'EFGH']);
assert.equal(live[0].online, 1);
assert.equal(live[0].messages, 2);
assert.equal(live[0].lastAt, now - 60 * 1000);
assert.equal(live[0].active, true);
assert.equal(live[1].active, false);          // nadie conectado y sin jugadas hace 3 horas
assert.equal(live[1].lastAt, live[1].createdAt);
assert.deepEqual(live[0].players.map(p => p.name), ['Javi', 'Cata']);
assert.equal(connections(live), 1);
assert.deepEqual(liveRooms(null, now), []);

// Resumen de días
const days = {
  20340: { local: { 'cuarto-rey': { local: { 5: 2 } } }, origin: { America__Santiago: 2 }, lang: { 'es-CL': 2 }, hour: { 22: 2 } },
  20341: {
    rooms: { ABCD: { game: 'toque-y-fama', at: 1, v: '0.20.0', players: { A: 'Javi', B: 'Cata' } }, EFGH: { game: 'linea-de-tiempo', at: 1, v: '0.20.0', players: { A: 'a', B: 'b', C: 'c' } } },
    local: { 'toque-y-fama': { cpu: { 1: 3 }, local: { 2: 1 } }, 'linea-de-tiempo': { solo: { 1: 4 } } },
    origin: { America__Santiago: 5, America__Sao_Paulo: 2 }, lang: { 'es-CL': 5, 'pt-BR': 2 }, hour: { 21: 4, 22: 3 },
  },
  20342: { local: { 'batalla-naval': { cpu: { 1: 1 } } }, origin: { Europe__Madrid: 1 }, lang: { 'es-ES': 1 }, hour: { 9: 1 } },
};
const s = summarize(days, { from: 20341, to: 20342 });
assert.equal(s.online, 2);
assert.equal(s.local, 9);
assert.equal(s.partidas, 11);
assert.equal(s.devices, 8);
assert.deepEqual(s.byGame['toque-y-fama'], { total: 5, online: 1, local: 1, cpu: 3, solo: 0 });
assert.deepEqual(s.byGame['linea-de-tiempo'], { total: 5, online: 1, local: 0, cpu: 0, solo: 4 });
assert.deepEqual(s.byGame['batalla-naval'], { total: 1, online: 0, local: 0, cpu: 1, solo: 0 });
assert.equal(s.byGame['cuarto-rey'], undefined);   // fuera del rango
assert.deepEqual(s.byPlayers, { 1: 8, 2: 2, 3: 1 });
assert.deepEqual(s.byDay, [{ day: 20341, total: 10, online: 2, local: 8 }, { day: 20342, total: 1, online: 0, local: 1 }]);
assert.deepEqual(s.origin, { America__Santiago: 5, America__Sao_Paulo: 2, Europe__Madrid: 1 });
assert.deepEqual(s.lang, { 'es-CL': 5, 'pt-BR': 2, 'es-ES': 1 });
assert.equal(s.hour[21], 4); assert.equal(s.hour[22], 3); assert.equal(s.hour[9], 1); assert.equal(s.hour[0], 0);

// Un día sin datos no rompe y aparece en cero
const vacio = summarize({}, { from: 20350, to: 20351 });
assert.equal(vacio.partidas, 0);
assert.deepEqual(vacio.byDay, [{ day: 20350, total: 0, online: 0, local: 0 }, { day: 20351, total: 0, online: 0, local: 0 }]);
assert.equal(summarize(null, { from: 1, to: 1 }).partidas, 0);

// Basura en la base no cuenta ni revienta
const sucio = summarize({ 20341: { local: { x: { raro: { 1: 5 }, cpu: { 9: 'dos' } } }, rooms: { ZZZZ: null } } }, { from: 20341, to: 20341 });
assert.equal(sucio.partidas, 0);

// Utilidades
assert.deepEqual(top({ a: 1, b: 3, c: 3 }, 2), [['b', 3], ['c', 3]]);
assert.deepEqual(tzLabel('America__Santiago'), { city: 'Santiago', region: 'America' });
assert.deepEqual(tzLabel('America__Sao_Paulo'), { city: 'Sao Paulo', region: 'America' });
assert.deepEqual(tzLabel('America__Argentina__Buenos_Aires'), { city: 'Buenos Aires', region: 'America/Argentina' });
assert.deepEqual(tzLabel('Etc__GMT+3'), { city: 'GMT+3', region: '' });
assert.deepEqual(tzLabel('desconocida'), { city: 'Sin zona horaria', region: '' });
assert.equal(ago(now - 10 * 1000, now), 'recién');
assert.equal(ago(now - 3 * 60 * 1000, now), 'hace 3 min');
assert.equal(ago(now - 2 * 60 * 60 * 1000, now), 'hace 2 h');
assert.ok(/\d/.test(dayLabel(20342)));

// --- Separar las salas del entorno de las de prueba (D-45) ---
// `rooms/` es uno solo para todos los entornos; el entorno se sabe por los códigos que
// `stats/<env>` registró. Se miran hoy y ayer, no más: los códigos de 4 letras se reciclan.
const hoy = 20342;
const dias = {
  [hoy]: { rooms: { ABCD: { game: 'toque-y-fama' } } },
  [hoy - 1]: { rooms: { EFGH: { game: 'linea-de-tiempo' } } },
  [hoy - 20]: { rooms: { ZZZZ: { game: 'batalla-naval' } } },
};
const codigos = codesOfDays(dias, now);
assert.deepEqual([...codigos].sort(), ['ABCD', 'EFGH'], 'solo hoy y ayer');
assert.equal(codigos.has('ZZZZ'), false, 'un código de hace 20 días no cuenta aunque se repita');
assert.deepEqual([...codesOfDays({}, now)], [], 'sin días cargados, ningún código');

const vivas = [{ code: 'ABCD' }, { code: 'EFGH' }, { code: 'TEST' }];
const { propias, ajenas } = splitByEnv(vivas, codigos);
assert.deepEqual(propias.map(r => r.code), ['ABCD', 'EFGH']);
assert.deepEqual(ajenas.map(r => r.code), ['TEST'], 'la que nadie registró en este entorno queda aparte');

// Mientras el snapshot de días no llegue no se filtra: si no, el panel parpadearía vacío
const sinCargar = splitByEnv(vivas, new Set(), { loaded: false });
assert.deepEqual(sinCargar.propias.map(r => r.code), ['ABCD', 'EFGH', 'TEST']);
assert.deepEqual(sinCargar.ajenas, []);

// Ya cargado y sin ningún código, todas quedan aparte: se ocultan, pero se nombran en pantalla
const ninguna = splitByEnv(vivas, new Set(), { loaded: true });
assert.deepEqual(ninguna.propias, []);
assert.equal(ninguna.ajenas.length, 3);

console.log('aggregate.test.mjs: todo en verde');
