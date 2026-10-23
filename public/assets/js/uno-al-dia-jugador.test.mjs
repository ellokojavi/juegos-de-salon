// Ejecutar: node public/assets/js/uno-al-dia-jugador.test.mjs
// Uno al día con jugador (D-230), contra el almacén de prueba, que hace cumplir lo mismo que las
// reglas de Firebase: la historia de cada día se escribe una vez, el ranking del día es el de la
// historia, la semana suma cada día una sola vez, y las invitaciones dan comodines.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { crearAlmacenLocal } from './jugador-local.js';
import { crearJugador } from './jugador.js';
import { UNO_AL_DIA, UAD_RACHA, UAD_PUNTOS, periodoDia, periodoMes, PERIODO, SIEMPRE } from './records.js';
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

// Un día viejo de este celular, al entrar: solo a la historia, sin rankings
r = await cel1.anotarDia({ n: n - 3, j: 'zip', s: 70, ms: 1, soloHistoria: true });
assert.deepEqual(r, { historia: true, dia: false, semana: false, racha: false });
assert.equal((await db.get(`unoAlDia/${sara.jid}/${n - 3}`)).s, 70);
assert.equal(await db.get(`records/${UNO_AL_DIA}/${periodoDia(n - 3)}/${sara.jid}`), null);

// Las reglas: nadie anota un día con otro puntaje que el de su historia, ni suma un día dos veces
const intento = async cambios => { try { await crearAlmacenLocal({ storage, uid: 'uid1', now: () => ahora.t }).update(cambios); return true; } catch (_) { return false; } };
const fila = (s, extra = {}) => ({ s, ms: 0, k: (100000 - s) * 100000000, at: ahora.t, n: 'Sara', ...extra });
assert.equal(await intento({ [`records/${UNO_AL_DIA}/${periodoDia(n + 2)}/${sara.jid}`]: fila(99) }), false, 'un día sin historia no entra al ranking');
assert.equal(await intento({ [`records/${UNO_AL_DIA}/${sem}/${sara.jid}`]: fila(227, { u: String(n) }) }), false, 'la semana no suma dos veces el mismo día');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n}`]: { j: 'reinas', s: 100, ms: 1, at: ahora.t } }), false, 'la historia de un día no se reescribe');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n + 3}`]: { j: 'reinas', s: 101, ms: 1, at: ahora.t } }), false, 'el puntaje va de 0 a 100');

// Uno al día points (lab, D-412): game score plus streak bonus, each day once, the streak growing
// at most one a day
const mes = periodoMes('2026-10-07'), pts = `records/${UAD_PUNTOS}/${mes}/${sara.jid}`;
assert.equal(await cel1.anotarPuntosDia({ n, mesP: mes, racha: 3 }), true);
assert.deepEqual([(await db.get(pts)).s, (await db.get(pts)).r], [87 + 15, 3]);
assert.equal(await cel1.anotarPuntosDia({ n, mesP: mes, racha: 3 }), false, 'a day adds its points once');
assert.equal(await cel1.anotarPuntosDia({ n: n + 1, mesP: mes, racha: 9 }), true);
assert.deepEqual([(await db.get(pts)).s, (await db.get(pts)).r], [102 + 40 + 20, 4], 'the streak grows one a day, whatever the phone says');
assert.equal(await cel1.anotarPuntosDia({ n: n + 5, mesP: mes, racha: 5 }), false, 'a day without history adds nothing');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n - 3}/p`]: true, [pts]: fila(162 + 70 + 50, { u: String(n - 3), r: 10 }) }), false, 'the streak cannot jump');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n - 3}/p`]: true, [pts]: fila(162 + 99, { u: String(n - 3), r: 5 }) }), false, 'the points are the history plus the bonus');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n - 3}/p`]: true, [pts]: fila(162 + 70 + 25, { u: String(n - 3), r: 5 }) }), true, 'an honest day goes in');

// A day a 🧊 saved (D-415): only the marker, once, never over a day played, and it adds no points
assert.equal(await cel1.anotarSalvado({ n: n - 2 }), true);
assert.deepEqual(Object.keys(await db.get(`unoAlDia/${sara.jid}/${n - 2}`)).sort(), ['at', 'c']);
assert.equal(await cel1.anotarSalvado({ n: n - 2 }).catch(() => false), false, 'a saved day is marked once');
assert.equal(await cel1.anotarSalvado({ n }).catch(() => false), false, 'a day played is never marked saved');
assert.equal(await cel1.anotarPuntosDia({ n: n - 2, mesP: mes, racha: 6 }), false, 'a saved day adds no points');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n - 4}`]: { c: true, s: 50, at: ahora.t } }), false, 'a marker carries no score');
assert.equal(await intento({ [`unoAlDia/${sara.jid}/${n - 2}/p`]: true }), false, 'a marker never gets p');

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

// +10 per invited friend (D-414): once per acceptance, marked `p` in the same write, exactly +10
const antesInv = (await db.get(pts)).s;
const uno = inv.find(x => x.uid === 'uid2');
assert.ok(uno, 'invitados() says who accepted (the phone)');
assert.equal(await cel1.anotarInvitado({ uid: 'uid2', mesP: mes }), true);
assert.equal((await db.get(pts)).s, antesInv + 10, 'a friend who accepted adds +10');
assert.equal(await cel1.anotarInvitado({ uid: 'uid2', mesP: mes }), false, 'once per friend');
assert.equal(await cel1.anotarInvitado({ uid: 'uidX', mesP: mes }), false, 'no acceptance, no points');
assert.equal(await intento({ [`invitados/${sara.jid}/uid3/p`]: true, [pts]: fila(antesInv + 30, { u: (await db.get(pts)).u, r: (await db.get(pts)).r, i: 'uid3' }) }), false, 'exactly +10');
assert.equal(await intento({ [pts]: fila(antesInv + 20, { u: (await db.get(pts)).u, r: (await db.get(pts)).r, i: 'uid3' }) }), false, 'the acceptance must be marked in the same write');
assert.equal(await cel1.anotarInvitado({ uid: 'uid3', mesP: periodoMes('2026-11-02') }), true, 'a month with no days yet starts with the friend\'s +10');
assert.equal(await cel1.anotarPuntosDia({ n: n + 2, mesP: periodoMes('2026-11-02'), racha: 1 }), false, 'a day without history still adds nothing');

// The start of a day's first attempt (D-433): once, by a phone seated as the player
assert.equal(await cel1.inicioDia(n + 5), null, 'no start yet');
assert.equal(await cel1.empezarDia({ n: n + 5 }), true);
assert.equal(await cel1.inicioDia(n + 5), ahora.t, 'the start is the server time');
assert.equal(await intento({ [`unoAlDiaInicio/${sara.jid}/${n + 5}`]: ahora.t + 1 }), false, 'a start is not rewritten');
assert.equal(await crearAlmacenLocal({ storage, uid: 'uidX', now: () => ahora.t }).update({ [`unoAlDiaInicio/${sara.jid}/${n + 6}`]: ahora.t }).then(() => true, () => false), false, 'only a phone seated as the player marks it');

// Las reglas de Firebase tienen las mismas ramas y lo mismo que revisa el almacén de prueba
const reglas = JSON.parse(await readFile(new URL('../../../firebase/database.rules.json', import.meta.url), 'utf8')).rules;
assert.ok(reglas.unoAlDia?.$jid?.$d && reglas.invitados?.$jid?.$uid, 'faltan unoAlDia o invitados en las reglas');
assert.match(reglas.records.$t.$p.$jid['.write'], /uno-al-dia/);
assert.match(reglas.records.$t.$p.$jid['.write'], /'uno-al-dia-pts'.*\/p'\)\.exists\(\).*>= 10 \? 50 : newData\.child\('r'\)\.val\(\) \* 5/, 'the rules check the points like the test store');
assert.ok(reglas.unoAlDia.$jid.$d.p && reglas.records.$t.$p.$jid.r, 'the rules know p and r');
assert.ok(reglas.unoAlDia.$jid.$d.c && /hasChildren\(\['c', 'at'\]\)/.test(reglas.unoAlDia.$jid.$d['.validate']), 'the rules know the saved marker (D-415)');
assert.match(reglas.records.$t.$p['.read'], /d\[0-9\]\{5\}/, 'las reglas no aceptan el período de un día');
assert.match(reglas.invitados.$jid.$uid['.write'], /!root\.child\('jugadorSeats/, 'invitarse a sí mismo');
assert.match(reglas.records.$t.$p.$jid['.write'], /invitados\/.*\/p'\)\.val\(\) === true.*\+ 10\)/, 'the rules check the invite +10 like the test store');
assert.ok(reglas.invitados.$jid.$uid.p && reglas.records.$t.$p.$jid.i, 'the rules know the acceptance p and i');
assert.match(reglas.unoAlDiaInicio?.$jid?.$d?.['.write'] || '', /!data\.exists\(\).*jugadorSeats/, 'the rules write a start once, by the player (D-433)');

console.log('uno-al-dia-jugador: ok');
