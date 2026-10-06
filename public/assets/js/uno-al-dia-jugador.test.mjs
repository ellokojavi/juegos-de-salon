// Ejecutar: node public/assets/js/uno-al-dia-jugador.test.mjs
// Uno al día con jugador (D-230), contra el almacén de prueba, que hace cumplir lo mismo que las
// reglas de Firebase: la historia de cada día se escribe una vez, el ranking del día es el de la
// historia, la semana suma cada día una sola vez, y las invitaciones dan comodines.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { crearAlmacenLocal } from './jugador-local.js';
import { crearJugador } from './jugador.js';
import { UNO_AL_DIA, UAD_RACHA, periodoDia, PERIODO, SIEMPRE } from './records.js';
import { numDia, semanaDe } from './uno-al-dia.js';

const ls = new Map();
const storage = { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) };
const ahora = { t: Date.UTC(2026, 9, 7, 15) };
const mk = uid => crearJugador({ almacen: crearAlmacenLocal({ storage, uid, now: () => ahora.t }), storage: { getItem: k => storage.getItem(`${uid}:${k}`), setItem: (k, v) => storage.setItem(`${uid}:${k}`, v), removeItem: k => storage.removeItem(`${uid}:${k}`) }, now: () => ahora.t, juegos: [] });
const db = crearAlmacenLocal({ storage, uid: 'nadie', now: () => ahora.t });

const cel1 = mk('uid1'), cel2 = mk('uid2'), cel3 = mk('uid3');
const sara = await cel1.crear('Sara', '1111');
assert.equal(await cel1.anotarDia({ n: 1, j: 'reinas', s: 50, ms: 1 }), null, 'un día que no es un número de día no se anota');
assert.ok(cel1.yo(), 'y no saca al jugador');

// El primer intento del día: historia, día, semana y racha
const n = numDia('2026-10-07'), sem = semanaDe('2026-10-07');
assert.ok(PERIODO.test(periodoDia(n)));
let r = await cel1.anotarDia({ n, j: 'reinas', s: 87, ms: 60000, semanaP: sem, mejor: 3 });
assert.deepEqual(r, { historia: true, dia: true, semana: true, racha: true });
assert.equal((await db.get(`unoAlDia/${sara.jid}/${n}`)).s, 87);
assert.equal((await db.get(`records/${UNO_AL_DIA}/${periodoDia(n)}/${sara.jid}`)).s, 87);
assert.equal((await db.get(`records/${UNO_AL_DIA}/${sem}/${sara.jid}`)).s, 87);
assert.equal((await db.get(`records/${UAD_RACHA}/${SIEMPRE}/${sara.jid}`)).s, 3);

// Otra vez el mismo día (otro celular, o un error): nada cambia y la semana no suma dos veces
r = await cel1.anotarDia({ n, j: 'reinas', s: 100, ms: 1, semanaP: sem, mejor: 3 });
assert.deepEqual(r, { historia: false, dia: false, semana: false, racha: false });
assert.equal((await db.get(`records/${UNO_AL_DIA}/${sem}/${sara.jid}`)).s, 87);

// El día siguiente suma a la semana
r = await cel1.anotarDia({ n: n + 1, j: 'anio', s: 40, ms: 30000, semanaP: sem, mejor: 4 });
assert.equal(r.semana, true);
assert.equal((await db.get(`records/${UNO_AL_DIA}/${sem}/${sara.jid}`)).s, 127);
assert.equal(Object.keys(await cel1.historialDia()).length, 2);

// Las reglas: nadie anota un día con otro puntaje que el de su historia, ni suma un día dos veces
const intento = async cambios => { try { await crearAlmacenLocal({ storage, uid: 'uid1', now: () => ahora.t }).update(cambios); return true; } catch (_) { return false; } };
const fila = (s, extra = {}) => ({ s, ms: 0, k: (100000 - s) * 100000000, at: ahora.t, n: 'Sara', ...extra });
assert.equal(await intento({ [`records/${UNO_AL_DIA}/${periodoDia(n + 2)}/${sara.jid}`]: fila(99) }), false, 'un día sin historia no entra al ranking');
assert.equal(await intento({ [`records/${UNO_AL_DIA}/${sem}/${sara.jid}`]: fila(227, { u: String(n) }) }), false, 'la semana no suma dos veces el mismo día');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n}`]: { j: 'reinas', s: 100, ms: 1, at: ahora.t } }), false, 'la historia de un día no se reescribe');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n + 3}`]: { j: 'reinas', s: 101, ms: 1, at: ahora.t } }), false, 'el puntaje va de 0 a 100');

// Invitar: el celular invitado deja su marca una vez, y nadie se invita a sí mismo
assert.equal(await cel1.aceptarInvitacion(sara.jid, n), false, 'invitarse a sí mismo no vale');
assert.equal(await cel2.aceptarInvitacion(sara.jid, n), true, 'un celular sin jugador acepta la invitación');
assert.equal(await cel2.aceptarInvitacion(sara.jid, n + 1), false, 'y una sola vez');
await cel3.crear('Pedro', '2222');
assert.equal(await cel3.aceptarInvitacion(sara.jid, n + 1), true);
const inv = await cel1.invitados();
assert.equal(inv.length, 2);
assert.ok(inv.some(x => x.j === cel3.yo().jid), 'el invitado con jugador queda nombrado (para Amigos)');
assert.deepEqual(await cel1.publico(sara.jid), { n: 'Sara', co: null });

// Las reglas de Firebase tienen las mismas ramas y lo mismo que revisa el almacén de prueba
const reglas = JSON.parse(await readFile(new URL('../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules;
assert.ok(reglas.unoAlDia?.$jid?.$d && reglas.invitados?.$jid?.$uid, 'faltan unoAlDia o invitados en las reglas');
assert.match(reglas.records.$t.$p.$jid['.write'], /uno-al-dia/);
assert.match(reglas.records.$t.$p['.read'], /d\[0-9\]\{5\}/, 'las reglas no aceptan el período de un día');
assert.match(reglas.invitados.$jid.$uid['.write'], /!root\.child\('jugadorSeats/, 'invitarse a sí mismo');

console.log('uno-al-dia-jugador: ok');
