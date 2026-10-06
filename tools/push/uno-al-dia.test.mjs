// Ejecutar: node tools/push/uno-al-dia.test.mjs
// Los avisos de Uno al día (D-230): cuándo sale cada uno, a quién, en qué idioma y cuándo no.
import assert from 'node:assert/strict';
import { avisosUnoAlDia, rachaViva, viejos } from './uno-al-dia.mjs';
import { numDia, numeroDel } from '../../public/assets/js/uno-al-dia.js';

const sub = (tz = 'America/Santiago', lang = 'es') => ({ endpoint: 'https://x', keys: {}, lang, tz, uid: 'u', at: 0 });
// Santiago está en UTC-3 en octubre de 2026: 12:00 UTC son las 9:00 allá
const en = (fecha, horaSantiago) => Date.parse(`${fecha}T00:10:00Z`) + (horaSantiago + 3) * 3600e3;
const N = numDia('2026-10-07');
const base = { h: 9, d: true, r: true, w: true, u: N - 1, c: 5, k: 0, m: 5 };
const correr = (q, now, enviados = {}, s = sub()) => avisosUnoAlDia({ quiere: { a: q }, subs: { a: s }, enviados: { a: enviados }, now });

// El de hoy: desde su hora, con la racha y el número, sin decir el juego
assert.deepEqual(correr(base, en('2026-10-07', 8)), [], 'antes de su hora no sale');
let r = correr(base, en('2026-10-07', 9));
assert.equal(r.length, 1);
assert.equal(r[0].clave, `dia:${N}`);
assert.equal(r[0].aviso.body, `📅 Uno al día n.° ${numeroDel('2026-10-07')} ya está. 🔥 Racha: 5 días.`);
assert.match(r[0].aviso.url, /today\/\?aviso=uad-dia$/, 'el panel lo cuenta aparte de los de La Copa');
assert.deepEqual(correr(base, en('2026-10-07', 10), { [`dia:${N}`]: en('2026-10-07', 9) }), [], 'no se repite');
assert.deepEqual(correr({ ...base, u: N }, en('2026-10-07', 10)), [], 'si ya jugó hoy, nada');
assert.deepEqual(correr({ ...base, d: false }, en('2026-10-07', 10)), [], 'si apagó el diario, nada');
assert.equal(correr({ ...base, u: N - 5, c: 0 }, en('2026-10-07', 9))[0].aviso.body, `📅 Uno al día n.° ${numeroDel('2026-10-07')} ya está.`, 'sin racha, sin la línea de la racha');

// El de la racha: a las 21:00, si no jugó y la racha es de 2 o más; con comodín, dice que lo gasta
r = correr(base, en('2026-10-07', 21), { [`dia:${N}`]: en('2026-10-07', 9) });
assert.equal(r[0].clave, `racha:${N}`);
assert.equal(r[0].aviso.body, '🔥 Tu racha de 5 días se corta a medianoche. Te quedan 3 horas.');
assert.equal(correr({ ...base, k: 1 }, en('2026-10-07', 21), { [`dia:${N}`]: 1 })[0].aviso.body, '🧊 Si no juegas hoy, gastas un comodín para salvar tu racha de 5 días. Te quedan 3 horas.');
assert.deepEqual(correr({ ...base, c: 1 }, en('2026-10-07', 21), { [`dia:${N}`]: en('2026-10-07', 9) }), [], 'con racha de 1 no vale la pena');
assert.deepEqual(correr(base, en('2026-10-07', 22)), [], 'de noche nunca');
// A lo más 2 al día
assert.deepEqual(correr(base, en('2026-10-07', 21), { x: en('2026-10-07', 9), y: en('2026-10-07', 12) }), [], 'a lo más 2 al día');

// La racha viva: ayer jugó; anteayer jugó y tiene un comodín; si no, se cortó
assert.equal(rachaViva({ u: N - 1, c: 4, k: 0 }, N), 4);
assert.equal(rachaViva({ u: N - 2, c: 4, k: 1 }, N), 4);
assert.equal(rachaViva({ u: N - 2, c: 4, k: 0 }, N), 0);

// La semana: el lunes, si jugó la semana anterior
const lunes = '2026-10-12', NL = numDia(lunes);
r = correr({ ...base, u: NL - 1, sp: 's2026-41', sn: 6 }, en(lunes, 9));
assert.equal(r[0].clave, 'semana:s2026-41');
assert.equal(r[0].aviso.body, '📊 Tu semana: jugaste 6 de 7 días.');
assert.equal(correr({ ...base, u: NL - 1, sp: 's2026-41', sn: 6 }, en(lunes, 9), { 'semana:s2026-41': 1 })[0].clave, `dia:${NL}`, 'después de la semana, el de hoy');

// Se calman solos: día por medio a los 14 días, y uno último a los 30
const cal = n => correr({ ...base, u: N - n, c: 0 }, en('2026-10-07', 10));
assert.equal(cal(15).length + correr({ ...base, u: N - 14, c: 0 }, en('2026-10-08', 10)).length, 1, 'con 14 días sin jugar, día por medio');
r = cal(30);
assert.equal(r[0].clave, 'adios');
assert.equal(r[0].borrar, true);
assert.match(r[0].aviso.body, /mejor racha fue de 5 días/);

// En el idioma de quien recibe
assert.match(correr(base, Date.parse('2026-10-07T07:10:00Z'), {}, sub('Europe/Berlin', 'de'))[0].aviso.body, /^📅 Spiel des Tages Nr\./);
assert.match(correr(base, Date.parse('2026-10-07T07:10:00Z'), {}, sub('Europe/Berlin', 'de'))[0].aviso.url, /&lang=de$/);

// Sin suscripción, nada; lo viejo se limpia
assert.deepEqual(avisosUnoAlDia({ quiere: { a: base }, subs: {}, enviados: {}, now: en('2026-10-07', 10) }), []);
assert.deepEqual(viejos({ a: { 'dia:1': 0, 'dia:2': Date.parse('2026-10-07') } }, Date.parse('2026-10-08')), ['pushEnviadosDia/a/dia:1']);

console.log('avisos de Uno al día: ok');
