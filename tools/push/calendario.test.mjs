// Qué aviso de La Copa toca, a quién y cuándo (D-224), con relojes inventados sobre una copa de
// 7 días armada con cup/engine.js. Uso: node tools/push/calendario.test.mjs
import assert from 'node:assert/strict';
import { avisosDeCopa, avisosDePrueba, horaLocal, juntar, mandadosHoy, TOPE } from './calendario.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';

let n = 0;
const caso = async (nombre, fn) => { try { await fn(); n++; } catch (e) { console.error(`✗ ${nombre}`); throw e; } };
const HORA = 3600e3;

const TZ = 'America/Santiago';
const meta = nuevaMeta({ nombre: 'Los Primos', dias: 7, inicio: '2026-10-12', tz: TZ, admin: 'aaaaaa', creada: Date.parse('2026-10-05T12:00:00Z') });
const copaBase = () => ({
  meta: JSON.parse(JSON.stringify(meta)),
  players: { aaaaaa: { name: 'Ana', at: 1 }, bbbbbb: { name: 'Beto', at: 2 } },
  results: {}, started: {},
});
const S1 = 'a'.repeat(32), S2 = 'b'.repeat(32);
const subs = { [S1]: { lang: 'es', tz: TZ }, [S2]: { lang: 'pt', tz: 'America/Sao_Paulo' } };
const quiere = (p = { dia: true, plazo: true, at: 0 }) => ({ aaaaaa: { [S1]: p }, bbbbbb: { [S2]: p } });
/** La hora local `hh` del día `d` de la copa, en Santiago. */
const enDia = (d, hh) => meta.win[d].a + hh * HORA;
const de = (out, sub) => out.filter(x => x.subId === sub);

await caso('la hora local de quien recibe', () => {
  assert.equal(horaLocal(enDia(1, 9), TZ), 9);
  assert.equal(horaLocal(Date.parse('2026-10-12T12:00:00Z'), 'Europe/Berlin'), 14);
  assert.equal(horaLocal(Date.parse('2026-10-12T12:00:00Z'), 'no/existe'), 12);
});

await caso('se abrió el día: desde las 9 de quien recibe, con el juego, una vez', () => {
  const copa = copaBase();
  assert.equal(avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, now: enDia(2, 8) }).length, 0, 'a las 8 todavía no');
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, now: enDia(2, 9.25) });
  const ana = de(out, S1)[0];
  assert.deepEqual(ana.claves, ['dia:2']);
  assert.equal(ana.aviso.title, '🏆 La Copa: Los Primos');
  assert.match(ana.aviso.body, /^🔢 Día 2: .+\. Ya puedes jugar\.$/);
  assert.equal(ana.aviso.url, 'https://juegosdesalon.cl/cup/?KQRST&dia=2', 'abre ese día (D-229)');
  assert.deepEqual(ana.aviso.acciones.map(a => [a.action, a.title, a.url]), [['jugar', 'Jugar', ana.aviso.url], ['silenciar', 'Silenciar esta copa', 'https://juegosdesalon.cl/cup/?KQRST&silenciar']]);
  assert.equal(ana.aviso.tag, 'copa-KQRST-d2');
  assert.match(de(out, S2)[0].aviso.body, /^🔢 Dia 2: .+\. Já dá para jogar\.$/, 'en el idioma de cada suscripción');
  const enviados = { [S1]: { 'dia:2': 1 } };
  assert.equal(de(avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, enviados, now: enDia(2, 10) }), S1).length, 0, 'no se repite');
});

await caso('quien ya jugó o ya empezó el día no recibe el aviso del día', () => {
  const copa = copaBase();
  copa.results[2] = { aaaaaa: { s: 80, ms: 1000 } };
  copa.started[2] = { bbbbbb: 123 };
  assert.equal(avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, now: enDia(2, 11) }).length, 0);
});

await caso('quien apagó "Cuando se abre un día" no lo recibe', () => {
  const out = avisosDeCopa({ code: 'KQRST', copa: copaBase(), quiere: quiere({ dia: false, plazo: true, at: 0 }), subs, now: enDia(2, 11) });
  assert.equal(out.length, 0);
});

await caso('de noche no se manda nada', () => {
  const out = avisosDeCopa({ code: 'KQRST', copa: copaBase(), quiere: quiere(), subs: { [S1]: subs[S1] }, now: enDia(2, 23) });
  assert.equal(out.length, 0);
});

await caso('el plazo: el día de gracia, 4 horas antes del cierre o desde las 20, solo si no lo jugó', () => {
  const copa = copaBase();
  const q = { aaaaaa: { [S1]: { dia: false, plazo: true, at: 0 } } };
  // El día 2 se puede jugar hasta la medianoche del día 3 (su día de gracia)
  assert.equal(avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, now: enDia(3, 18) }).length, 0, 'a las 18 faltan 6 horas: todavía no');
  const noche = avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, now: enDia(3, 20.1) });
  assert.deepEqual(noche[0].claves, ['plazo:2']);
  assert.equal(noche[0].aviso.body, '⏳ Te quedan 4 horas para jugar el día 2. Si no lo juegas, son 0 puntos.');
  assert.equal(noche[0].aviso.tag, 'copa-KQRST-d2', 'reemplaza al aviso de la mañana de ese día');
  copa.results[2] = { aaaaaa: { s: 1, ms: 1 } };
  assert.equal(avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, now: enDia(3, 21) }).length, 0, 'ya lo jugó');
  const una = avisosDeCopa({ code: 'KQRST', copa: copaBase(), quiere: q, subs, now: enDia(3, 21.5) });
  assert.match(una[0].aviso.body, /^⏳ Te quedan 3 horas/);
  const ultima = avisosDeCopa({ code: 'KQRST', copa: copaBase(), quiere: q, subs, now: enDia(4, -0.6) });
  assert.equal(ultima.length, 0, 'a las 23:24 es de noche: no se manda');
});

await caso('el plazo gana a otro aviso en la misma vuelta: de a uno por copa y celular', () => {
  const out = avisosDeCopa({ code: 'KQRST', copa: copaBase(), quiere: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } }, subs, now: enDia(3, 20.5) });
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].claves, ['plazo:2']);
});

await caso('La Gran Final: con su lugar en la tabla, aunque haya apagado los del día', () => {
  const copa = copaBase();
  for (let d = 1; d <= 6; d++) copa.results[d] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 50, ms: 1000 } };
  const q = quiere({ dia: false, plazo: false, at: 0 });
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, now: enDia(7, 10) });
  assert.equal(de(out, S1)[0].aviso.body, '🏁 Hoy es La Gran Final y vale doble. Vas 1º: ¡a defender el primer lugar!');
  assert.equal(de(out, S2)[0].aviso.body, '🏁 Hoje é a Grande Final e vale o dobro. Você está em 2º, a 12 pontos de Ana.');
  assert.deepEqual(de(out, S1)[0].claves, ['final']);
});

await caso('La Gran Final empatado en puntos con el 1.º (perdió el desempate): sin "a 0 puntos"', () => {
  const copa = copaBase();
  copa.players.cccccc = { name: 'Caro', at: 3 };
  const r = (a, b, c) => ({ aaaaaa: { s: a, ms: 1000 }, bbbbbb: { s: b, ms: 1000 }, cccccc: { s: c, ms: 1000 } });
  copa.results[1] = r(90, 50, 10);
  copa.results[2] = r(10, 50, 90);
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: quiere({ dia: false, plazo: false, at: 0 }), subs, now: enDia(7, 10) });
  assert.equal(de(out, S2)[0].aviso.body, '🏁 Hoje é a Grande Final e vale o dobro. Você está em 3º, com os mesmos pontos que Ana.');
});

await caso('terminó la copa: quién ganó, durante un día', () => {
  const copa = copaBase();
  for (let d = 1; d <= 7; d++) copa.results[d] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 50, ms: 1000 } };
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, now: meta.end + 10 * HORA });
  assert.equal(de(out, S1)[0].aviso.body, '🥇 ¡Ganaste la copa!');
  assert.equal(de(out, S2)[0].aviso.body, '🥇 Ana ganhou. Você ficou em 2º.');
  assert.equal(avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, now: meta.end + 34 * HORA }).length, 0, 'pasado un día, ya no');
});

await caso('el admin la terminó antes: el aviso del cierre sale igual', () => {
  const copa = copaBase();
  copa.results[1] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 50, ms: 1000 } };
  copa.fin = enDia(3, 11);
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: quiere(), subs, now: enDia(3, 12) });
  assert.deepEqual(de(out, S1)[0].claves, ['fin']);
});

await caso('al admin: quién se inscribió desde que pidió avisos, juntos', () => {
  const copa = copaBase();
  const ahora = enDia(1, -38); // dos días antes de partir, a las 10:00
  copa.players.cccccc = { name: 'Cata', at: ahora - 2 * HORA };
  copa.players.dddddd = { name: 'Dani', at: ahora - HORA };
  const q = { aaaaaa: { [S1]: { dia: true, plazo: true, at: 2 } }, bbbbbb: { [S2]: { dia: true, plazo: true, at: 0 } } };
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, now: ahora });
  assert.equal(out.length, 1, 'solo el admin');
  assert.equal(out[0].aviso.body, 'Cata y Dani se inscribieron en tu copa. Ya son 4 jugadores inscritos.');
  assert.deepEqual(out[0].claves, ['insc:cccccc', 'insc:dddddd']);
  const una = avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, enviados: { [S1]: { 'insc:cccccc': 1 } }, now: ahora });
  assert.equal(una[0].aviso.body, 'Dani se inscribió en tu copa. Ya son 4 jugadores inscritos.');
});

await caso('sin suscripción, jugador sacado o copa borrada: nada', () => {
  const copa = copaBase();
  copa.players.bbbbbb.out = true;
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: { ...quiere(), aaaaaa: { ['c'.repeat(32)]: { dia: true } } }, subs, now: enDia(2, 10) });
  assert.equal(out.length, 0);
  assert.deepEqual(avisosDeCopa({ code: 'KQRST', copa: null, quiere: quiere(), subs, now: 0 }), []);
});

await caso('tope (D-229): a lo más 2 avisos de una copa por celular en un día de quien recibe', () => {
  assert.equal(TOPE, 2);
  const copa = copaBase();
  const q = { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } };
  const ahora = enDia(3, 20.5);
  const hoy = { [S1]: { 'dia:3': enDia(3, 9.1), 'insc:cccccc': enDia(3, 11) } };
  assert.equal(mandadosHoy(hoy[S1], ahora, TZ), 2);
  assert.equal(avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, enviados: hoy, now: ahora }).length, 0, 'ya van 2 hoy: el plazo no sale');
  const ayer = { [S1]: { 'dia:2': enDia(2, 9.1), 'plazo:1': enDia(2, 20.1), 'dia:3': enDia(3, 9.1) } };
  assert.equal(mandadosHoy(ayer[S1], ahora, TZ), 1, 'los de ayer no cuentan');
  assert.deepEqual(avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, enviados: ayer, now: ahora })[0].claves, ['plazo:2']);
  // Varias claves anotadas en la misma entrega son un solo aviso
  assert.equal(mandadosHoy({ 'insc:a': 5, 'insc:b': 5 }, 5, TZ), 1);
});

await caso('la final y el día anterior se vencen a la vez: un solo aviso con los dos (D-229)', () => {
  const copa = copaBase();
  const q = { aaaaaa: { [S1]: { dia: false, plazo: true, at: 0 } } };
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs, now: enDia(7, 20.5) });
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].claves, ['plazo:6', 'plazo:7']);
  assert.equal(out[0].aviso.body, '⏳ Te quedan 4 horas para jugar los días 6 y 7. Si no los juegas, son 0 puntos.');
  assert.equal(out[0].aviso.url, 'https://juegosdesalon.cl/cup/?KQRST&dia=6', 'abre el más viejo: el que se pierde primero');
});

await caso('empate en el primer lugar (D-229): ganaron los dos, en plural', () => {
  const copa = copaBase();
  copa.players.cccccc = { name: 'Caro', at: 3 };
  for (let d = 1; d <= 7; d++) copa.results[d] = { aaaaaa: { s: 90, ms: 1000 }, bbbbbb: { s: 90, ms: 1000 }, cccccc: { s: 10, ms: 1000 } };
  const S3 = 'c'.repeat(32);
  const s3 = { ...subs, [S3]: { lang: 'en', tz: TZ } };
  const q = { ...quiere(), cccccc: { [S3]: { dia: true, plazo: true, at: 0 } } };
  const out = avisosDeCopa({ code: 'KQRST', copa, quiere: q, subs: s3, now: meta.end + 10 * HORA });
  assert.equal(de(out, S1)[0].aviso.body, '🥇 ¡Ganaste la copa junto con Beto!');
  assert.equal(de(out, S2)[0].aviso.body, '🥇 Você ganhou a copa junto com Ana!');
  assert.equal(de(out, S3)[0].aviso.body, '🥇 Ana and Beto won. You finished #3.');
  assert.equal(de(out, S1)[0].aviso.acciones, undefined, 'el del cierre no trae botones: abre el podio');
});

await caso('días nuevos de varias copas para un celular: un solo aviso (D-229)', () => {
  const otra = { ...copaBase(), meta: { ...JSON.parse(JSON.stringify(meta)), name: 'La Oficina' } };
  const a = avisosDeCopa({ code: 'KQRST', copa: copaBase(), quiere: quiere(), subs, now: enDia(2, 9.5) });
  const b = avisosDeCopa({ code: 'MNPQR', copa: otra, quiere: quiere(), subs, now: enDia(2, 9.5) });
  const plazo = { subId: S1, pid: 'aaaaaa', code: 'WXYZA', tipo: 'plazo', claves: ['plazo:1'], aviso: { body: 'p' } };
  const out = juntar([...a, ...b, plazo], subs, { KQRST: 'Los Primos', MNPQR: 'La Oficina' });
  const ana = de(out, S1);
  assert.equal(ana.length, 2, 'los dos días en uno, y el plazo aparte');
  const junto = ana.find(x => x.tipo === 'dia');
  assert.equal(junto.aviso.title, '🏆 La Copa');
  assert.equal(junto.aviso.body, '🎲 Tienes un día nuevo en 2 copas: Los Primos y La Oficina.');
  assert.equal(junto.aviso.url, 'https://juegosdesalon.cl/cup/');
  assert.deepEqual(junto.porCopa, [{ code: 'KQRST', claves: ['dia:2'] }, { code: 'MNPQR', claves: ['dia:2'] }]);
  assert.deepEqual(ana.find(x => x.tipo === 'plazo').porCopa, [{ code: 'WXYZA', claves: ['plazo:1'] }]);
  assert.equal(de(out, S2)[0].aviso.body, '🎲 Você tem um dia novo em 2 copas: Los Primos e La Oficina.');
  const solo = juntar(a, subs, {});
  assert.equal(de(solo, S1)[0].aviso.url, 'https://juegosdesalon.cl/cup/?KQRST&dia=2', 'una sola copa: queda igual');
});

await caso('el aviso de prueba: a cada celular de la copa, en su idioma, a cualquier hora', () => {
  const out = avisosDePrueba({ code: 'KQRST', copa: copaBase(), quiere: quiere(), subs });
  assert.equal(out.length, 2);
  assert.equal(de(out, S1)[0].aviso.body, 'Así se verán los avisos de esta copa.');
  assert.equal(de(out, S2)[0].aviso.body, 'É assim que vão ficar os avisos desta copa.');
  assert.deepEqual(de(out, S1)[0].claves, []);
});

console.log(`calendario: ${n} casos en verde`);
