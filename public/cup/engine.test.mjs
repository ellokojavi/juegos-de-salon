// Tests del motor de La Copa: node public/cup/engine.test.mjs
import assert from 'node:assert/strict';
import { zonaDeIdioma, ZONA, DIAS_MIN, DIAS_MAX, FINAL_DESDE, FINAL_RONDAS, FINAL_FIVE_FROM, finalRounds, largoValido, admiteFinal } from './engine.js';
import {
  CALENDARIOS, POZO, POZO_ABIERTO, POZO_FIJO, calendarioValido, calendarioAlAzar, PUNTOS, esCodigo, codigoAlAzar, pidAlAzar, PID, limpiarNombre, claveNombre, esPin, hashPin,
  fechaEn, sumarDias, medianoche, ventanas, nuevaMeta, diaActual, abierto, cerrado, terminada, inscripcionAbierta,
  aliasLimpio, esAlias, menosJuegos, provisoria, ultimoDiaVisto, marcaDelDia, aliasHasta, ALIAS_LIBRE_MS,
  estadoDia, puedeComodin, multiplicador, comodinAuto, comodinEfectivo, ultimoDiaComodin, AUTO_WILD_FROM, posicionesDelDia, tabla, desempate, faltan, medallas, reloj, pausaDeLectura, mmss, juegoDelDia, evolucion,
  fuera, enRiesgo, AUSENCIAS, cerrarEn, conCierre, cerradaAntes, anulado, puedeCerrar, VARIANTES, diaDeCal, entradaCal, varianteDelDia, calendario,
  semanaAlAzar, ESTILOS_SEMANA, tieneFinal, SIN_FINAL, esFinal,
  TRIO, findeAlAzar, findeAbierto, FINDE_HASTA, rondasDelDia, estadoEnLista, recorteLista,
} from './engine.js';
import { JUEGOS_COPA } from './rules.js';

let n = 0;
const test = (name, fn) => { fn(); n++; };
const H = 60 * 60 * 1000;

test('variants (D-331): a day is `id` or `id:variant`, and the default one is written bare', () => {
  for (const [id, vs] of Object.entries(VARIANTES)) {
    assert.ok(POZO.includes(id), `${id} is in the pool`);
    assert.ok(vs.length >= 2, `${id} has at least two variants`);
    assert.equal(entradaCal(id, vs[0]), id, 'the default one goes bare');
    assert.equal(entradaCal(id, vs[1]), `${id}:${vs[1]}`);
    assert.deepEqual(diaDeCal(entradaCal(id, vs[1])), { id, variante: vs[1] });
    assert.deepEqual(diaDeCal(id), { id, variante: vs[0] });
  }
  assert.deepEqual(diaDeCal('reinas'), { id: 'reinas', variante: null }, 'a game without variants has none');
  assert.equal(entradaCal('reinas', 'hard'), 'reinas');
  assert.ok(calendarioValido(['pintaminas:hard', 'loteo:utilities', 'final'], 3));
  assert.ok(calendarioValido(['pintaminas', 'loteo', 'final'], 3));
  assert.ok(!calendarioValido(['pintaminas:hard', 'pintaminas', 'final'], 3), 'one day per game, whatever its variant');
  assert.ok(!calendarioValido(['pintaminas:x', 'loteo', 'final'], 3), 'only its own variants');
  assert.ok(!calendarioValido(['reinas:hard', 'loteo', 'final'], 3), 'a game without variants takes none');
  const meta = { cal: 'pintaminas:hard,loteo,rutas,final' };
  assert.deepEqual(calendario(meta), ['pintaminas', 'loteo', 'rutas', 'final'], 'the calendar names the games, without variants');
  assert.equal(juegoDelDia(meta, 1), 'pintaminas');
  assert.equal(varianteDelDia(meta, 1), 'hard');
  assert.equal(varianteDelDia(meta, 2), 'numbers');
  assert.equal(varianteDelDia(meta, 3), null);
  // The longest week still fits the 100 characters the Firebase rules allow for `cal`
  const largo = [...POZO].sort((a, b) => entradaCal(b, VARIANTES[b]?.at(-1)).length - entradaCal(a, VARIANTES[a]?.at(-1)).length).slice(0, 6).map(id => entradaCal(id, VARIANTES[id]?.at(-1)));
  assert.ok([...largo, 'final'].join(',').length <= 100, [...largo, 'final'].join(','));
});

test('calendarios: la final siempre al final', () => {
  // Agentes took Conexiones' place (D-421)
  assert.deepEqual(CALENDARIOS[3], ['linea', 'agentes', 'final']);
  assert.deepEqual(CALENDARIOS[7], ['linea', 'numero', 'agentes', 'reinas', 'letras', 'anio', 'final']);
  assert.ok(POZO.includes('agentes') && !POZO.includes('conexiones'), 'a new cup offers Agentes, not Conexiones (D-421)');
  assert.equal(CALENDARIOS[7].length, 7);
  assert.equal(CALENDARIOS[7][6], 'final');
  assert.equal(new Set(CALENDARIOS[7]).size, 7);
});

test('calendario a elección (D-163): juegos del pozo sin repetir y la final al último', () => {
  assert.ok(calendarioValido(['donde', 'tango', 'final'], 3));
  assert.ok(calendarioValido(CALENDARIOS[7], 7));
  assert.ok(!calendarioValido(['linea', 'final', 'tango'], 3), 'la final va al último');
  assert.ok(!calendarioValido(['linea', 'linea', 'final'], 3), 'sin repetir');
  assert.ok(!calendarioValido(['linea', 'final'], 3), 'uno por día');
  assert.ok(!calendarioValido(['linea', 'dudo', 'final'], 3), 'solo juegos del pozo');
  assert.ok(!calendarioValido(['final', 'linea', 'final'], 3), 'una sola final');
  assert.ok(!POZO.includes('final'));
  // La propuesta al azar: siempre válida, y sin dos días seguidos de la misma familia
  const familia = id => ({ reinas: 'l', zip: 'l', tango: 'l', numero: 'd', letras: 'd' })[id] || id;
  let semilla = 7;
  const rand = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const vistos = new Set();
  for (let i = 0; i < 300; i++) {
    for (const dias of [3, 7]) {
      const cal = calendarioAlAzar(dias, { rand, familia });
      assert.ok(calendarioValido(cal, dias), cal.join());
      cal.slice(1, -1).forEach((id, k) => assert.notEqual(familia(id), familia(cal[k]), cal.join()));
      vistos.add(cal[0]);
    }
  }
  // The games still waiting for their launch flag (D-517) are not drawn: in node no flag is saved
  assert.equal(vistos.size, POZO_ABIERTO.length, 'cualquier juego puede tocar el primer día');
  assert.ok(POZO_ABIERTO.length < POZO.length && !POZO_ABIERTO.includes('stick') && POZO_FIJO.every(id => POZO_ABIERTO.includes(id)), 'a flag-launched game is in POZO but not drawn before its launch');
  // nuevaMeta guarda el calendario elegido y rechaza uno que no se puede jugar
  const base = { nombre: 'X', dias: 3, inicio: '2026-10-01', admin: 'abc123', creada: 0 };
  assert.equal(nuevaMeta({ ...base, cal: ['donde', 'zip', 'final'] }).cal, 'donde,zip,final');
  assert.equal(nuevaMeta(base).cal, 'linea,agentes,final');
  assert.throws(() => nuevaMeta({ ...base, cal: ['zip', 'zip', 'final'] }), /calendario/);
  // El público (D-187): se escribe si es uno de los tres; sin él, como las copas de antes
  assert.equal(nuevaMeta({ ...base, aud: 'br' }).aud, 'br');
  assert.ok(!('aud' in nuevaMeta(base)));
  assert.ok(!('aud' in nuevaMeta({ ...base, aud: 'xx' })));
  // El idioma de las palabras (D-170): el español no se escribe, como en las copas de antes
  assert.equal(nuevaMeta(base).lang, undefined);
  assert.equal(nuevaMeta({ ...base, lang: 'es' }).lang, undefined);
  assert.equal(nuevaMeta({ ...base, lang: 'pt' }).lang, 'pt');
});

test('códigos y pids', () => {
  for (let i = 0; i < 200; i++) {
    const c = codigoAlAzar();
    assert.ok(esCodigo(c), c);
    assert.ok(!/[IO]/.test(c));
    assert.ok(PID.test(pidAlAzar()));
  }
  assert.ok(!esCodigo('ABCD'));
  assert.ok(!esCodigo('ABCDI'));
  assert.ok(!esCodigo('abcde'));
});

test('nombres y PIN', () => {
  assert.equal(limpiarNombre('  Cata   la  grande '), 'Cata la grande');
  assert.equal(limpiarNombre('x'.repeat(30)).length, 20);
  assert.equal(claveNombre('JOSÉ '), claveNombre('jose'));
  assert.ok(esPin('0123'));
  assert.ok(!esPin('123'));
  assert.ok(!esPin('12a4'));
});

test('hash del PIN: atado a la copa y al jugador', async () => {
  const a = await hashPin('KQRST', 'abc123', '1234');
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, await hashPin('KQRST', 'abc124', '1234'));
  assert.notEqual(a, await hashPin('KQRSU', 'abc123', '1234'));
  assert.equal(a, await hashPin('KQRST', 'abc123', '1234'));
});

test('fechas en Chile', () => {
  assert.equal(sumarDias('2026-09-30', 1), '2026-10-01');
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  // Septiembre de 2026 en Chile: UTC-3 (horario de verano desde el 6 de septiembre)
  const m = medianoche('2026-09-23', 'America/Santiago');
  assert.equal(new Date(m).toISOString(), '2026-09-23T03:00:00.000Z');
  assert.equal(fechaEn(m, 'America/Santiago'), '2026-09-23');
  assert.equal(fechaEn(m - 1, 'America/Santiago'), '2026-09-22');
  // Julio: UTC-4
  assert.equal(new Date(medianoche('2026-07-10', 'America/Santiago')).toISOString(), '2026-07-10T04:00:00.000Z');
});

test('medianoche en un día con cambio de horario (Chile adelanta la hora el 6 de septiembre de 2026)', () => {
  const a = medianoche('2026-09-06', 'America/Santiago');
  const b = medianoche('2026-09-07', 'America/Santiago');
  assert.equal(fechaEn(a, 'America/Santiago'), '2026-09-06');
  assert.equal(fechaEn(a - 1, 'America/Santiago'), '2026-09-05');
  assert.equal(b - a, 23 * H); // ese día dura 23 horas
});

test('ventanas: día de gracia y la final sin gracia', () => {
  const w = ventanas('2026-09-28', 7, 'America/Santiago');
  const d = k => medianoche(sumarDias('2026-09-28', k), 'America/Santiago');
  assert.equal(w[1].a, d(0));
  assert.equal(w[1].h, d(1));
  assert.equal(w[1].b, d(2));
  assert.equal(w[6].b, d(7)); // la gracia del penúltimo vence con la copa
  assert.equal(w[7].a, d(6));
  assert.equal(w[7].b, d(7)); // la final no tiene gracia
  const w3 = ventanas('2026-09-28', 3, 'America/Santiago');
  assert.equal(w3[3].b, d(3));
  assert.equal(w3[2].b, d(3));
});

const meta7 = nuevaMeta({ nombre: 'Copa de la oficina', dias: 7, inicio: '2026-09-28', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0 });
const dia = (k, horas = 12) => meta7.win[1].a + k * 24 * H + horas * H; // k = 0 es el día 1

test('meta y día actual', () => {
  assert.equal(meta7.name, 'Copa de la oficina');
  assert.equal(meta7.joinUntil, meta7.win[7].a);
  assert.equal(meta7.final, '7');
  assert.equal(juegoDelDia(meta7, 4), 'reinas');
  // Una copa vieja con el Solitario en el calendario lo juega como Reinas (D-102)
  assert.equal(juegoDelDia({ ...meta7, cal: 'linea,numero,conexiones,solitario,dudo,anio,final' }, 5), 'letras');
  assert.equal(diaActual(meta7, meta7.win[1].a - 1), 0);
  assert.equal(diaActual(meta7, dia(0)), 1);
  assert.equal(diaActual(meta7, dia(6)), 7);
  assert.equal(diaActual(meta7, meta7.end), 8);
  assert.ok(abierto(meta7, 1, dia(1)));      // gracia
  assert.ok(!abierto(meta7, 1, dia(2)));
  assert.ok(cerrado(meta7, 1, dia(2)));
  assert.ok(!abierto(meta7, 7, dia(5)));
  assert.ok(terminada(meta7, meta7.end));
  assert.ok(inscripcionAbierta(meta7, dia(5)));
  assert.ok(!inscripcionAbierta(meta7, dia(6)));
});

const players = {
  aaaaaa: { name: 'Cata', at: 1 }, bbbbbb: { name: 'Javi', at: 2 }, cccccc: { name: 'Pancho', at: 3 }, dddddd: { name: 'Tomás', at: 4 },
};

test('estado de un día para un jugador', () => {
  const L = { meta: meta7, players, started: { 2: { aaaaaa: 1 } }, results: { 1: { aaaaaa: { s: 5, ms: 1 } } } };
  assert.equal(estadoDia(L, 1, 'aaaaaa', dia(0)), 'jugado');
  assert.equal(estadoDia(L, 1, 'bbbbbb', dia(0)), 'hoy');
  assert.equal(estadoDia(L, 1, 'bbbbbb', dia(1)), 'gracia');
  assert.equal(estadoDia(L, 1, 'bbbbbb', dia(2)), 'perdido');
  assert.equal(estadoDia(L, 2, 'aaaaaa', dia(1)), 'en-curso');
  assert.equal(estadoDia(L, 3, 'aaaaaa', dia(1)), 'futuro');
});

test('"Tus copas": where each cup stands for the player, in one line', () => {
  const L = { meta: meta7, players, started: { 2: { aaaaaa: 1 } }, results: { 1: { aaaaaa: { s: 5, ms: 1 } } } };
  const antes = estadoEnLista(L, 'aaaaaa', meta7.win[1].a - 3 * H);
  assert.equal(antes.tipo, 'empieza');
  assert.equal(antes.en, 3 * H);
  assert.deepEqual(estadoEnLista(L, 'bbbbbb', dia(0)), { tipo: 'jugar', dias: [1], enCurso: false, hoy: false }, 'day 1, with its grace day ahead');
  assert.deepEqual(estadoEnLista(L, 'aaaaaa', dia(0)), { tipo: 'al-dia', dia: 2, en: meta7.win[2].a - dia(0) }, 'played: the next day and when it opens');
  assert.deepEqual(estadoEnLista(L, 'bbbbbb', dia(1)), { tipo: 'jugar', dias: [1, 2], enCurso: false, hoy: true }, 'yesterday in its grace day closes tonight');
  assert.deepEqual(estadoEnLista(L, 'aaaaaa', dia(1)), { tipo: 'jugar', dias: [2], enCurso: true, hoy: false }, 'started and not finished');
  assert.deepEqual(estadoEnLista(L, 'cccccc', dia(3)), { tipo: 'fuera' }, 'two days missed in a row (D-347)');
  assert.deepEqual(estadoEnLista({ ...L, players: { ...players, dddddd: { ...players.dddddd, out: 1 } } }, 'dddddd', dia(0)), { tipo: 'fuera' }, 'taken out by the admin');
  const todos = { ...L, results: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(d => [d, { bbbbbb: { s: 1, ms: 1 } }])) };
  assert.deepEqual(estadoEnLista(todos, 'bbbbbb', dia(6)), { tipo: 'al-dia', dia: 0, en: 0 }, 'every day played');
  const sinFinal = { ...todos, results: { ...todos.results, 7: {} } };
  assert.deepEqual(estadoEnLista(sinFinal, 'bbbbbb', dia(6)), { tipo: 'jugar', dias: [7], enCurso: false, hoy: true }, 'the last day has no grace day');
  assert.equal(estadoEnLista(L, 'bbbbbb', meta7.end), null, 'over');
  assert.equal(estadoEnLista(L, 'zzzzzz', dia(0)), null, 'not in the cup');
});

test('"Tus copas" from what the phone kept: the same line as from the whole cup', () => {
  const L = { meta: meta7, players, started: { 2: { aaaaaa: 1, bbbbbb: 1 } }, results: { 1: { aaaaaa: { s: 5, ms: 1 }, cccccc: { s: 2, ms: 1 } } } };
  for (const pid of Object.keys(players)) for (const k of [-1, 0, 1, 2, 3, 6]) {
    const now = k < 0 ? meta7.win[1].a - H : dia(k);
    assert.deepEqual(estadoEnLista(recorteLista(L, pid), pid, now), estadoEnLista(L, pid, now), `${pid} on day ${k}`);
  }
  const r = recorteLista(L, 'aaaaaa');
  assert.deepEqual(Object.keys(r.players), ['aaaaaa'], 'only their own player');
  assert.deepEqual(r.results, { 1: { aaaaaa: 1 } }, 'only their own results, without the scores');
  assert.equal(recorteLista(L, 'zzzzzz'), null);
  const cerrada = recorteLista({ ...L, fin: dia(1) }, 'bbbbbb');
  assert.equal(cerrada.fin, dia(1), 'the early close goes with it');
  assert.equal(estadoEnLista(cerrada, 'bbbbbb', dia(2)), null);
});

test('comodín: antes de empezar, una vez, no en la final', () => {
  const L = { meta: meta7, players, started: { 2: { aaaaaa: 1 } }, results: {}, wild: { bbbbbb: '3' } };
  assert.ok(puedeComodin(L, 1, 'aaaaaa', dia(0)));
  assert.ok(!puedeComodin(L, 2, 'aaaaaa', dia(1)));  // ya empezó
  assert.ok(!puedeComodin(L, 4, 'bbbbbb', dia(3)));  // ya lo usó
  assert.ok(!puedeComodin(L, 7, 'aaaaaa', dia(6)));  // final
  assert.ok(!puedeComodin(L, 3, 'aaaaaa', dia(0)));  // no abierto aún
  assert.equal(multiplicador(L, 3, 'bbbbbb'), 2);
  assert.equal(multiplicador(L, 3, 'aaaaaa'), 1);
  assert.equal(multiplicador(L, 7, 'aaaaaa'), 2);
});

test('unused wildcard: it lands on the last day played before the final, once there is no choice left (D-444)', () => {
  // A cup still running when D-444 was published: it reaches it retroactively
  const meta7 = nuevaMeta({ nombre: 'Copa de la oficina', dias: 7, inicio: '2026-10-20', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0 });
  const dia = (k, horas = 12) => meta7.win[1].a + k * 24 * H + horas * H;
  const r = { s: 5, ms: 1 };
  const base = { meta: meta7, players, started: {}, results: { 1: { aaaaaa: r }, 5: { aaaaaa: r }, 6: { aaaaaa: r } }, wild: {} };
  // Day 6 played, day 5 played: on the final's day no day before it is left to choose
  assert.deepEqual(comodinEfectivo(base, 'aaaaaa', dia(6)), { dia: 6, auto: true });
  assert.equal(multiplicador(base, 6, 'aaaaaa', dia(6)), 2);
  assert.equal(multiplicador(base, 6, 'aaaaaa'), 1, 'without now nothing is automatic');
  // On day 6 itself, day 6 is played but day 7 is the final: nothing left, so it already applies
  assert.equal(comodinAuto(base, 'aaaaaa', dia(5)), 6);
  // Day 6 played but day 5 still in its grace day and not played: the player can still use it there
  const gracia = { ...base, results: { 1: { aaaaaa: r }, 6: { aaaaaa: r } } };
  assert.equal(comodinAuto(gracia, 'aaaaaa', dia(5)), 0);
  // Day 5 closed without playing it: the card goes on day 6
  assert.equal(comodinAuto(gracia, 'aaaaaa', dia(6)), 6);
  // Did not play day 6: it goes on the last day they played (day 1), not on a 0
  const sin6 = { ...base, results: { 1: { aaaaaa: r } } };
  assert.equal(comodinAuto(sin6, 'aaaaaa', dia(7)), 1);
  // A day started and not finished cannot take the card, so it does not hold the choice open
  const empezado = { ...base, started: { 6: { aaaaaa: 1 } }, results: { 1: { aaaaaa: r }, 5: { aaaaaa: r } } };
  assert.equal(comodinAuto(empezado, 'aaaaaa', dia(5)), 5);
  // Chosen by hand: never automatic
  assert.deepEqual(comodinEfectivo({ ...base, wild: { aaaaaa: '1' } }, 'aaaaaa', dia(7)), { dia: 1, auto: false });
  // Played nothing: nothing to double
  assert.equal(comodinAuto({ ...base, results: {} }, 'aaaaaa', dia(7)), 0);
  // Never on the final
  assert.equal(multiplicador({ ...base, results: { 7: { aaaaaa: r } } }, 7, 'aaaaaa', dia(7)), 2);
  // A cup without a final (D-438): it lands on the last day played, the last day of the cup included
  const sinFinal = nuevaMeta({ nombre: 'x', dias: 3, inicio: '2026-10-24', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0, cal: ['linea', 'numero', 'reinas'] });
  const enDia3 = sinFinal.win[3].a + 12 * H;
  const sf = res => ({ meta: sinFinal, players, started: {}, results: res });
  assert.equal(ultimoDiaComodin(sinFinal), 3);
  assert.equal(comodinAuto(sf({ 2: { aaaaaa: r }, 3: { aaaaaa: r } }), 'aaaaaa', enDia3), 3, 'played the last day: applied right away');
  assert.equal(comodinAuto(sf({ 1: { aaaaaa: r }, 2: { aaaaaa: r } }), 'aaaaaa', enDia3), 0, 'the last day is still open: they can still use it');
  assert.equal(comodinAuto(sf({ 1: { aaaaaa: r }, 2: { aaaaaa: r } }), 'aaaaaa', sinFinal.end), 2, 'skipped the last day: the last one played');
  assert.equal(multiplicador(sf({ 3: { aaaaaa: r } }), 3, 'aaaaaa', sinFinal.end), 2);
  // Retroactive for the cups still running when it was published; one already ended keeps its table
  assert.ok(meta7.end > AUTO_WILD_FROM, 'the test cup ends after it was published');
  const vieja = { ...base, meta: { ...meta7, end: AUTO_WILD_FROM - 1 } };
  assert.equal(comodinAuto(vieja, 'aaaaaa', dia(7)), 0);
  assert.equal(comodinAuto({ ...base, meta: { ...meta7, end: AUTO_WILD_FROM + 1 } }, 'aaaaaa', dia(6)), 6, 'a cup whose final is on the day it was published gets it');
  // A cup the admin ended before its final (D-161) leaves it unused
  assert.equal(comodinAuto(conCierre({ ...base, fin: dia(5) }), 'aaaaaa', dia(6)), 0);
  // The table counts it
  const t = tabla(base, 'aaaaaa', dia(7)).find(f => f.pid === 'aaaaaa');
  assert.equal(t.dias[6].x, 2);
});

test('posiciones: puntaje, luego tiempo; empate total comparte', () => {
  const p = posicionesDelDia({
    aaaaaa: { s: 7, ms: 90000 }, bbbbbb: { s: 7, ms: 60000 }, cccccc: { s: 5, ms: 10 }, dddddd: { s: 5, ms: 10 },
  }, ['aaaaaa', 'bbbbbb', 'cccccc', 'dddddd']);
  assert.deepEqual(p.bbbbbb, { pos: 1, pts: 10 });
  assert.deepEqual(p.aaaaaa, { pos: 2, pts: 8 });
  assert.deepEqual(p.cccccc, { pos: 3, pts: 6 });
  assert.deepEqual(p.dddddd, { pos: 3, pts: 6 });
  const diez = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`p${i}`, { s: 10 - i, ms: 0 }]));
  const q = posicionesDelDia(diez, Object.keys(diez));
  assert.deepEqual(Object.values(q).map(x => x.pts), PUNTOS);
});

test('tabla: oculta lo que no jugaste, suma comodín y final', () => {
  const L = {
    meta: meta7, players,
    results: {
      1: { aaaaaa: { s: 7, ms: 5 }, bbbbbb: { s: 6, ms: 5 }, cccccc: { s: 3, ms: 5 } },
      2: { bbbbbb: { s: 9, ms: 5 }, cccccc: { s: 4, ms: 5 } },
    },
    wild: { cccccc: 2 },
  };
  // Día 2 abierto, Cata no lo jugó: no ve el día 2
  const t = tabla(L, 'aaaaaa', dia(1));
  const cata = t.find(f => f.pid === 'aaaaaa');
  assert.equal(cata.total, 10);
  assert.ok(t.find(f => f.pid === 'bbbbbb').dias[2].oculto);
  assert.equal(t[0].pid, 'aaaaaa');
  // Javi jugó el 2: lo ve. Pancho sacó 2º con comodín: 8 × 2
  const tj = tabla(L, 'bbbbbb', dia(1));
  assert.equal(tj.find(f => f.pid === 'bbbbbb').total, 8 + 10);
  assert.equal(tj.find(f => f.pid === 'cccccc').total, 6 + 16);
  assert.equal(tj[0].pid, 'cccccc');
  assert.equal(tj[0].flecha, 1);  // subió desde el 3º
  // Al cerrar el día 2 lo ve todo el mundo
  const tc = tabla(L, 'aaaaaa', dia(3));
  assert.equal(tc.find(f => f.pid === 'aaaaaa').dias[2].pts, 0);
  assert.equal(tc.find(f => f.pid === 'dddddd').total, 0);
});

test('tabla: un jugador sacado no cuenta ni empuja posiciones', () => {
  const L = {
    meta: meta7, players: { ...players, aaaaaa: { name: 'Cata', at: 1, out: true } },
    results: { 1: { aaaaaa: { s: 7, ms: 5 }, bbbbbb: { s: 6, ms: 5 } } },
  };
  const t = tabla(L, 'bbbbbb', dia(0));
  assert.equal(t.length, 3);
  assert.equal(t[0].pid, 'bbbbbb');
  assert.equal(t[0].total, 10);
});

test('evolución: lugares día por día, sin delatar lo que no se ve', () => {
  const L = {
    meta: meta7, players,
    results: {
      1: { aaaaaa: { s: 7, ms: 5 }, bbbbbb: { s: 6, ms: 5 } },
      2: { bbbbbb: { s: 9, ms: 5 }, aaaaaa: { s: 1, ms: 5 }, cccccc: { s: 5, ms: 5 } },
      3: { cccccc: { s: 9, ms: 5 } },
    },
  };
  const e = evolucion(L, 'aaaaaa', dia(2)); // día 3 abierto y Cata no lo jugó
  assert.deepEqual(e.dias, [1, 2]);
  const lug = pid => e.filas.find(f => f.pid === pid).lugares;
  assert.deepEqual(lug('aaaaaa'), [1, 2]); // 10 · 10+6=16 vs Javi 8+10=18
  assert.deepEqual(lug('bbbbbb'), [2, 1]);
  assert.equal(lug('dddddd').length, 2);
  const e3 = evolucion(L, 'cccccc', dia(2));
  assert.deepEqual(e3.dias, [1, 2, 3]);
});

test('faltan: quién no jugó un día abierto', () => {
  const L = { meta: meta7, players, results: { 1: { aaaaaa: { s: 1, ms: 1 } } } };
  assert.deepEqual(faltan(L, 1, dia(0)).map(j => j.name), ['Javi', 'Pancho', 'Tomás']);
  assert.deepEqual(faltan(L, 1, dia(2)), []);
});

test('provisoria: la tabla puede cambiar mientras alguien no juega el último día que se ve', () => {
  const r1 = { aaaaaa: { s: 9, ms: 1 }, bbbbbb: { s: 5, ms: 1 } };
  const L = { meta: meta7, players, results: { 1: r1 } };
  const prov = (yo, now, Lx = L) => provisoria(Lx, tabla(Lx, yo, now), now);
  assert.equal(prov('aaaaaa', dia(0)), true);  // faltan dos en el día 1, que sigue abierto
  assert.equal(prov('aaaaaa', dia(1)), true);  // día de gracia: todavía pueden jugarlo
  assert.equal(prov('aaaaaa', dia(2)), false); // el día 1 cerró: los que faltaron quedan con (-1J)
  assert.equal(prov('cccccc', dia(0)), false); // quien no jugó no ve el día: la tabla no muestra nada
  const todos = { meta: meta7, players, results: { 1: { ...r1, cccccc: { s: 3, ms: 1 }, dddddd: { s: 1, ms: 1 } } } };
  assert.equal(prov('aaaaaa', dia(0), todos), false); // ya jugaron todos
  // El número del título: el último día que se ve (#67)
  assert.equal(ultimoDiaVisto(tabla(L, 'aaaaaa', dia(0))), 1);
  assert.equal(ultimoDiaVisto(tabla(L, 'aaaaaa', dia(1))), 1); // el día 2 no lo ha jugado: su tabla llega al 1
  assert.equal(ultimoDiaVisto(tabla(L, 'cccccc', dia(0))), 0);
});

test('medallas', () => {
  const meta3 = nuevaMeta({ nombre: 'x', dias: 3, inicio: '2026-09-28', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0 });
  const L = {
    meta: meta3, players,
    results: {
      1: { aaaaaa: { s: 7, ms: 1 }, bbbbbb: { s: 6, ms: 1 }, cccccc: { s: 5, ms: 1 }, dddddd: { s: 1, ms: 1 } },
      2: { aaaaaa: { s: 10, ms: 1 }, bbbbbb: { s: 60, ms: 1 }, cccccc: { s: 50, ms: 1 } },
      3: { cccccc: { s: 500, ms: 1 }, bbbbbb: { s: 400, ms: 1 }, aaaaaa: { s: 10, ms: 1 } },
    },
  };
  // Cata 10+6+12=28 · Javi 8+10+16=34 · Pancho 6+8+20=34 · Tomás 5 (a cup that ended before D-444:
  // the unused wildcards stay unused)
  const m = medallas(L);
  // Javi y Pancho empatan en 34 y en 1 día ganado; desempata la final: Pancho
  assert.deepEqual(m.campeon.map(f => f.name), ['Pancho']);
  assert.equal(m.farolito[0].name, 'Tomás');
  assert.equal(m.remontada.filas[0].name, 'Pancho');
  assert.equal(m.ganador.n, 1);
});

test('la pausa para leer un dato: una sola vez, al cerrar o al tope (D-277)', () => {
  const log = [];
  const fin = pausaDeLectura({ ms: 20, pausar: () => log.push('pausa'), seguir: () => log.push('sigue'), alCambiar: p => log.push(p) });
  fin(); fin();
  assert.deepEqual(log, ['pausa', true, 'sigue', false]);
  const solo = [];
  pausaDeLectura({ ms: 5, pausar: () => solo.push('pausa'), seguir: () => solo.push('sigue') });
  setTimeout(() => assert.deepEqual(solo, ['pausa', 'sigue'], 'el tope la termina sola'), 30);
});

test('reloj activo', () => {
  let r = reloj.nuevo(1000);
  r = reloj.pausar(r, 4000);
  assert.equal(reloj.leer(r, 99999), 3000);
  r = reloj.seguir(r, 10000);
  assert.equal(reloj.leer(r, 12000), 5000);
  assert.equal(mmss(65000), '1:05');
  assert.equal(mmss(3725000), '1:02:05');
});

test('juegos de menos en la tabla parcial (D-126)', () => {
  const filas = [
    { pid: 'a', dias: { 1: { jugo: true }, 2: { jugo: true } } },
    { pid: 'b', dias: { 1: { jugo: true }, 2: { jugo: false } } },
    { pid: 'c', dias: { 1: { jugo: false }, 2: { oculto: true, jugo: true } } },
  ];
  assert.deepEqual(menosJuegos(filas), { a: 0, b: 1, c: 2 });
});

test('whoever is out of the cup has no games left, and does not set the max (D-347, D-376)', () => {
  const filas = [
    { pid: 'a', dias: { 1: { jugo: true }, 2: { jugo: false } } },
    { pid: 'b', dias: { 1: { jugo: false }, 2: { jugo: false } } },
    { pid: 'x', dias: { 1: { jugo: true }, 2: { jugo: true } }, fuera: { desde: 3, hasta: 4 } },
    { pid: 'y', dias: { 1: { jugo: false }, 2: { jugo: false } }, fuera: { desde: 1, hasta: 2 } },
  ];
  assert.deepEqual(menosJuegos(filas), { a: 0, b: 1, x: 0, y: 0 });
});

test('la marca de cada día en la imagen: puntos, comodín, no jugó o falta jugar (D-153)', () => {
  const L = {
    meta: meta7, players, wild: { bbbbbb: 1 },
    results: { 1: { aaaaaa: { s: 9, ms: 1 }, bbbbbb: { s: 5, ms: 1 } }, 7: { aaaaaa: { s: 9, ms: 1 } } },
  };
  const marca = (pid, d, now) => marcaDelDia(L, tabla(L, pid, now).find(f => f.pid === pid), d, now);
  assert.deepEqual(marca('aaaaaa', 1, dia(0)), { tipo: 'pts', pts: 10, final: false });
  assert.deepEqual(marca('bbbbbb', 1, dia(0)), { tipo: 'comodin', pts: 16, final: false }); // 8 × 2
  assert.equal(marca('cccccc', 1, dia(1)).tipo, 'falta'); // día de gracia: todavía puede
  assert.equal(marca('cccccc', 1, dia(2)).tipo, 'no');    // el día cerró
  assert.deepEqual(marca('aaaaaa', 7, dia(6)), { tipo: 'pts', pts: 20, final: true }); // la final vale doble
});

test('terminar la copa antes (D-161): todo cierra en `fin` y lo que no se abrió no cuenta', () => {
  // El admin la termina el día 4 a mediodía: el día 3 estaba en su gracia y el 4 abierto
  const fin = dia(3);
  const L = conCierre({
    meta: meta7, players, fin,
    results: {
      1: { aaaaaa: { s: 9, ms: 1 }, bbbbbb: { s: 5, ms: 1 }, cccccc: { s: 3, ms: 1 }, dddddd: { s: 1, ms: 1 } },
      4: { bbbbbb: { s: 9, ms: 1 } },
    },
  });
  const m = L.meta;
  assert.ok(cerradaAntes(m) && !cerradaAntes(meta7));
  assert.equal(m.end, fin);
  assert.ok(terminada(m, fin) && !terminada(m, fin - 1));
  assert.equal(diaActual(m, fin + 3 * 24 * H), 8);
  assert.ok(abierto(m, 4, fin - 1) && !abierto(m, 4, fin));
  assert.ok(!abierto(m, 3, fin));                       // su gracia se corta
  assert.ok(!puedeCerrar(m, fin - 1));                  // ya tiene su cierre
  assert.ok(puedeCerrar(meta7, dia(0)) && !puedeCerrar(meta7, meta7.win[1].a - 1) && !puedeCerrar(meta7, meta7.end));
  // Los días 5 a 7 no se abrieron: anulados, fuera de la tabla, aunque el reloj pase por ellos
  assert.ok(anulado(m, 5) && anulado(m, 7) && !anulado(m, 4));
  assert.equal(estadoDia(L, 6, 'aaaaaa', dia(6)), 'anulado');
  assert.equal(estadoDia(L, 4, 'aaaaaa', dia(6)), 'perdido');
  const t = tabla(L, 'aaaaaa', dia(6));
  assert.deepEqual(Object.keys(t[0].dias).map(Number), [1, 2, 3, 4]);
  assert.equal(t.find(f => f.pid === 'bbbbbb').total, 8 + 10); // la final nunca llegó: nada vale doble
  assert.equal(t.find(f => f.pid === 'aaaaaa').dias[4].jugo, false);
  assert.ok(!provisoria(L, t, dia(6)));
  assert.deepEqual(evolucion(L, 'aaaaaa', dia(6)).dias, [1, 2, 3, 4]);
  assert.equal(medallas(L).campeon[0].name, 'Javi');
  // Sin `fin`, la copa queda igual
  assert.equal(conCierre({ meta: meta7 }).meta, meta7);
  assert.equal(cerrarEn(meta7, meta7.end + 1), meta7);
});

test('el link propio: se normaliza y no se confunde con un código (D-121)', () => {
  assert.equal(aliasLimpio('  Copa Pirata (1ra) '), 'copa-pirata-1ra');
  assert.equal(aliasLimpio('Ñandú'), 'nandu');
  assert.ok(esAlias('pirata') && esAlias('la-copa-2026'));
  assert.ok(!esAlias('kqrst') && !esAlias('pi') && !esAlias('-pirata') && !esAlias('x'.repeat(21)));
  assert.equal(aliasHasta({ end: 1000 }), 1000 + ALIAS_LIBRE_MS);
});

test('el nombre de la copa llega a 40 caracteres; el de un jugador, a 20 (D-119)', () => {
  const m = nuevaMeta({ nombre: 'Copa Pirata (1ra prueba)', dias: 7, inicio: '2026-10-01', admin: 'aaaaaa', creada: 1 });
  assert.equal(m.name, 'Copa Pirata (1ra prueba)');
  assert.equal(nuevaMeta({ nombre: 'x'.repeat(60), dias: 7, inicio: '2026-10-01', admin: 'a', creada: 1 }).name.length, 40);
  assert.equal(limpiarNombre('y'.repeat(30)).length, 20);
});

// Las copas nuevas, del Pacífico en todo idioma (D-514); una copa que ya guardó la zona de Berlín
// cambia de día a medianoche de Europa central (D-194)
for (const l of ['es', 'en', 'pt', 'de', undefined]) assert.equal(zonaDeIdioma(l), ZONA);
{ const m = nuevaMeta({ nombre: 'Büro-Pokal', dias: 7, inicio: '2026-10-05', tz: 'Europe/Berlin', admin: 'A', creada: Date.UTC(2026, 9, 3), lang: 'en' });
  assert.equal(m.tz, 'Europe/Berlin');
  assert.equal(new Date(m.win[1].a).toISOString(), '2026-10-04T22:00:00.000Z', 'el día 1 parte a medianoche de Berlín (UTC+2 en octubre)'); }

test('desempate del primer lugar: más días ganados y después la final (#79)', () => {
  const fin = meta7.end;
  // Cata gana los días 1 y 2 sola (20); Javi gana el 3 sola con comodín (20): más días ganados
  const porDias = { meta: meta7, players, wild: { bbbbbb: 3 }, results: {
    1: { aaaaaa: { s: 5, ms: 5 } }, 2: { aaaaaa: { s: 5, ms: 5 } }, 3: { bbbbbb: { s: 5, ms: 5 } },
  } };
  const t1 = tabla(porDias, null, fin);
  assert.deepEqual([t1[0].name, t1[0].total, t1[1].name, t1[1].total], ['Cata', 20, 'Javi', 20]);
  assert.deepEqual(desempate(t1), { pts: 20, criterio: 'dias' });
  // Un día ganado cada uno y 26 puntos: Javi gana el 1 (10) y es 2.° en la final (16); Cata es
  // 3.ª el día 2 (6) y gana la final (20). Desempata la final
  const porFinal = { meta: meta7, players, results: {
    1: { bbbbbb: { s: 5, ms: 5 } },
    2: { cccccc: { s: 9, ms: 5 }, dddddd: { s: 7, ms: 5 }, aaaaaa: { s: 5, ms: 5 } },
    7: { aaaaaa: { s: 9, ms: 5 }, bbbbbb: { s: 5, ms: 5 } },
  } };
  const t2 = tabla(porFinal, null, fin);
  assert.deepEqual([t2[0].name, t2[0].total, t2[1].name, t2[1].total], ['Cata', 26, 'Javi', 26]);
  assert.deepEqual(desempate(t2), { pts: 26, criterio: 'final' });
  // Iguales en todo: comparten el primer lugar y no hay desempate que contar
  const iguales = tabla({ meta: meta7, players, results: { 1: { aaaaaa: { s: 5, ms: 5 } }, 2: { bbbbbb: { s: 5, ms: 5 } } } }, null, fin);
  assert.equal(iguales[0].lugar, iguales[1].lugar);
  assert.equal(desempate(iguales), null);
  // Sin empate en puntos, nada
  assert.equal(desempate(tabla({ meta: meta7, players, results: { 1: { aaaaaa: { s: 5, ms: 5 }, bbbbbb: { s: 1, ms: 5 } } } }, null, fin)), null);
  assert.equal(desempate([]), null);
});

test('out of the cup (D-347): two days in a row closed without playing, grace day included', () => {
  assert.equal(AUSENCIAS, 2);
  const r = { 1: { aaaaaa: { s: 9, ms: 1 } }, 2: { aaaaaa: { s: 9, ms: 1 }, bbbbbb: { s: 5, ms: 1 } }, 3: { aaaaaa: { s: 9, ms: 1 } } };
  const L = { meta: meta7, players, results: r };
  // Day 1 closes at the start of day 3 (its grace day), day 2 at the start of day 4
  assert.equal(fuera(L, 'cccccc', dia(2)), null, 'day 2 is still in its grace day');
  assert.equal(enRiesgo(L, 'cccccc', dia(2)), 2, 'the warning: play day 2 or you are out');
  assert.deepEqual(fuera(L, 'cccccc', dia(3)), { desde: 1, hasta: 2 });
  assert.equal(enRiesgo(L, 'cccccc', dia(3)), 0, 'already out: no warning');
  assert.equal(fuera(L, 'bbbbbb', dia(4)), null, 'missing days 1 and 3, not in a row');
  assert.equal(enRiesgo(L, 'aaaaaa', dia(3)), 0, 'who plays is never warned');
  // The table keeps their points, below everyone still playing, and nobody waits for them
  const t = tabla(L, 'aaaaaa', dia(3));
  assert.deepEqual(t.slice(-2).map(f => f.pid).sort(), ['cccccc', 'dddddd']);
  assert.ok(t.at(-1).fuera && !t[0].fuera);
  assert.ok(t.find(f => f.pid === 'bbbbbb').lugar < t.find(f => f.pid === 'cccccc').lugar);
  assert.deepEqual(faltan(L, 4, dia(3)).map(j => j.pid), ['aaaaaa', 'bbbbbb']);
  // The history is not affected: it ranks by points
  assert.ok(evolucion(L, 'aaaaaa', dia(3)).filas.every(f => f.lugares.length));
});

const r1 = () => ({ 1: { aaaaaa: { s: 1, ms: 1 } } });
test('out of the cup (D-347): late signups, the admin bringing them back, and the last days', () => {
  // Signed up on day 3: days 1 and 2 had closed or were closing; only what they could play counts
  const tarde = { ...players, eeeeee: { name: 'Ema', at: dia(2, 1) } };
  const L = { meta: meta7, players: tarde, results: {} };
  assert.equal(fuera(L, 'eeeeee', dia(3)), null, 'day 1 closed before they signed up');
  assert.deepEqual(fuera(L, 'eeeeee', dia(4)), { desde: 2, hasta: 3 }, 'day 2 was still in its grace day');
  // The admin brings them back: the days closed before that are forgiven
  const vuelta = { ...L, players: { ...tarde, cccccc: { ...players.cccccc, back: dia(3, 6) } } };
  assert.equal(fuera(vuelta, 'cccccc', dia(3, 7)), null);
  assert.equal(fuera(vuelta, 'cccccc', dia(4, 12)), null, 'only day 3 missed since then');
  assert.deepEqual(fuera(vuelta, 'cccccc', dia(5, 12)), { desde: 3, hasta: 4 });
  // The admin's own removal is something else
  assert.equal(fuera({ ...L, players: { ...tarde, cccccc: { ...players.cccccc, out: true } } }, 'cccccc', dia(6)), null);
  // Days 6 and the final close with the cup: nobody is left out at the end for them
  const solo15 = { meta: meta7, players, results: Object.fromEntries([1, 2, 3, 4, 5].map(d => [d, { cccccc: { s: 1, ms: 1 } }])) };
  assert.equal(fuera(solo15, 'cccccc', meta7.end + 1), null);
  assert.equal(enRiesgo(solo15, 'cccccc', dia(6)), 0, 'no warning for the last days');
  // A cup the admin closed early: the unopened days do not count
  const cerrada = conCierre({ meta: meta7, players, results: r1(), fin: dia(1) });
  assert.equal(fuera(cerrada, 'cccccc', dia(6)), null);
});
test('the 🎲 of the new create screen (D-425): styles and balance', () => {
  // The real skills, in Spanish, as the screen compares them
  const familia = id => JUEGOS_COPA[id].habilidad;
  let semilla = 11;
  const rand = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const cuenta = w => w.reduce((c, id) => ({ ...c, [familia(id)]: (c[familia(id)] || 0) + 1 }), {});
  for (const id of POZO) assert.ok(JUEGOS_COPA[id]?.habilidad, `${id} has a skill`);
  for (const lista of Object.values(ESTILOS_SEMANA)) for (const id of lista || []) assert.ok(POZO.includes(id), `${id} is in the pool`);
  const nuevos = ['agentes', 'rutas', 'loteo', 'pintaminas'];
  for (let i = 0; i < 300; i++) {
    for (const estilo of Object.keys(ESTILOS_SEMANA)) {
      for (const dias of [3, 7]) {
        const cal = semanaAlAzar(dias, { rand, familia, estilo, nuevos });
        assert.ok(calendarioValido(cal, dias), `${estilo}: ${cal.join()}`);
        const w = cal.slice(0, -1);
        w.slice(1).forEach((id, k) => assert.notEqual(familia(id), familia(w[k]), `${estilo}: no two days in a row of one skill (${cal.join()})`));
        if (estilo === 'equilibrada' || estilo === 'nuevo') assert.ok(Object.values(cuenta(w)).every(c => c <= 2), `${estilo}: at most two of one skill (${cal.join()})`);
        if (ESTILOS_SEMANA[estilo] && dias === 7) assert.ok(w.every(id => ESTILOS_SEMANA[estilo].includes(id)), `${estilo}: only its games (${cal.join()})`);
        if (estilo === 'nuevo' && dias === 7) assert.ok(nuevos.every(id => w.includes(id)), `nuevo: every new game is in (${cal.join()})`);
      }
    }
  }
});
test('the 3-day cup without the final (D-438)', () => {
  assert.deepEqual(SIN_FINAL, [3]);
  assert.ok(calendarioValido(['linea', 'tango', 'donde'], 3), 'three games of the pool');
  assert.ok(calendarioValido(['linea', 'tango', 'final'], 3), 'the 3-day cups from before keep their final');
  // Since D-521 a 7-day cup may go without the final (the admin's switch)
  assert.ok(calendarioValido(['linea', 'tango', 'donde', 'zip', 'reinas', 'anio', 'letras'], 7), 'a 7-day cup without the final (D-521)');
  for (let k = 0; k < 30; k++) {
    const w = semanaAlAzar(3, { final: false });
    assert.ok(w.length === 3 && !w.includes('final') && calendarioValido(w, 3), w.join());
  }
  const m = nuevaMeta({ nombre: 'Finde', dias: 3, inicio: '2026-09-28', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0, cal: ['linea', 'tango', 'donde'] });
  assert.equal(m.final, '0', 'the database knows there is no final: the wildcard works on day 3');
  assert.ok(!tieneFinal(m) && !esFinal(m, 3));
  const L = { meta: m, players: { aaaaaa: { name: 'Ana', at: 0 }, bbbbbb: { name: 'Beto', at: 0 } }, results: {}, wild: {} };
  assert.equal(multiplicador(L, 3, 'aaaaaa'), 1, 'the last day is not worth double');
  assert.ok(puedeComodin(L, 3, 'aaaaaa', m.win[3].a + 3600000), 'the wildcard can go on the last day');
  const old = nuevaMeta({ nombre: 'Prueba', dias: 3, inicio: '2026-09-28', tz: 'America/Santiago', admin: 'aaaaaa', creada: 0, cal: ['linea', 'tango', 'final'] });
  assert.ok(old.final === '3' && tieneFinal(old) && esFinal(old, 3));
  assert.ok(tieneFinal(meta7) && esFinal(meta7, 7));
  // A tie in points and days won is broken by the last day, and it says so
  const T = { meta: m, players: L.players, results: { 1: { aaaaaa: { s: 9, ms: 5 }, bbbbbb: { s: 5, ms: 5 } }, 2: {}, 3: { aaaaaa: { s: 5, ms: 5 }, bbbbbb: { s: 9, ms: 5 } } } };
  const filas = tabla(T, null, m.end);
  assert.equal(filas[0].name, 'Beto');
  assert.deepEqual(desempate(filas, m), { pts: 18, criterio: 'ultimo' });
});

test('the weekend cup: three days of three games (D-439)', () => {
  for (let k = 0; k < 30; k++) {
    const cal = findeAlAzar();
    const ids = cal.flatMap(x => x.split('+'));
    assert.ok(cal.length === 3 && ids.length === 9 && new Set(ids).size === 9 && ids.every(id => POZO.includes(id)) && calendarioValido(cal, 3), cal.join());
  }
  assert.ok(calendarioValido(['linea+tango+donde', 'zip+reinas+anio', 'numero+letras+loteo:utilities'], 3), 'variants inside a day of three');
  assert.ok(!calendarioValido(['linea+tango+donde', 'zip+reinas+linea', 'numero+letras+loteo'], 3), 'no game twice in the weekend');
  assert.ok(!calendarioValido(['linea+tango', 'zip+reinas+anio', 'numero+letras+loteo'], 3), 'three a day');
  assert.ok(!calendarioValido(['linea+tango+donde', 'zip', 'numero+letras+loteo'], 3), 'every day of three, or none');
  assert.ok(!calendarioValido(['linea+tango+donde', 'zip+reinas+anio', 'final'], 3), 'no final');
  assert.ok(!calendarioValido(['a+b+c', 'linea', 'zip', 'reinas', 'anio', 'numero', 'final'], 7), 'only the 3-day cup');
  const m = nuevaMeta({ nombre: 'Finde', dias: 3, inicio: '2026-10-23', tz: 'America/Los_Angeles', admin: 'aaaaaa', creada: 0, cal: ['linea+tango+donde', 'zip+reinas+anio', 'numero+letras+loteo:utilities'] });
  assert.equal(m.final, '0');
  assert.equal(juegoDelDia(m, 1), TRIO);
  assert.deepEqual(rondasDelDia(m, 3), ['numero', 'letras', 'loteo:utilities']);
  assert.equal(rondasDelDia(meta7, 1), null);
  assert.equal(varianteDelDia(m, 3), null);
  assert.ok(!esFinal(m, 3));
  // Offered until Friday 2026-10-23 at 22:00 Pacific, when the owner closed it (it was until Sunday night)
  assert.ok(findeAbierto(Date.parse('2026-10-23T21:59:00-07:00')) && !findeAbierto(Date.parse('2026-10-23T22:00:00-07:00')) && FINDE_HASTA === Date.parse('2026-10-24T05:00:00Z'));
});

await new Promise(r => setTimeout(r, 50));
console.log(`copa/engine: ${n} tests OK`);

test('the length is the admin\'s choice, 3 to 14 days, the final from 5 (D-521)', () => {
  assert.deepEqual([DIAS_MIN, DIAS_MAX, FINAL_DESDE, FINAL_RONDAS], [3, 14, 5, 5]);
  assert.ok(!largoValido(2) && largoValido(3) && largoValido(14) && !largoValido(15) && !largoValido(4.5));
  assert.ok(!admiteFinal(4) && admiteFinal(5) && admiteFinal(3), 'no final at 4 days; the 3-day cups from before keep theirs');
  const pozo = ['linea', 'numero', 'agentes', 'reinas', 'letras', 'anio', 'zip', 'tango', 'donde', 'desenredo', 'rutas', 'loteo', 'pintaminas'];
  assert.ok(calendarioValido(pozo.slice(0, 4), 4), 'four games, no final');
  assert.ok(!calendarioValido([...pozo.slice(0, 3), 'final'], 4), 'a 4-day cup cannot end with the final');
  assert.ok(calendarioValido([...pozo.slice(0, 13), 'final'], 14), 'fourteen days: thirteen games and the final');
  assert.ok(!calendarioValido([...pozo, 'linea', 'final'], 15), 'not fifteen');
  const meta = nuevaMeta({ nombre: 'Larga', dias: 10, inicio: '2026-11-09', admin: 'abc123', creada: FINAL_FIVE_FROM + 1, cal: [...pozo.slice(0, 9), 'final'] });
  assert.equal(meta.days, 10); assert.equal(meta.final, '10'); assert.equal(Object.keys(meta.win).length, 10);
  const r = finalRounds(meta);
  assert.equal(r.length, 5, 'five rounds');
  assert.deepEqual(r, pozo.slice(0, 9).filter(id => r.includes(id)), 'in the order they were played, from the cup\'s games');
  assert.deepEqual(finalRounds({ ...meta }), r, 'the same on every phone');
  assert.equal(finalRounds({ ...meta, createdAt: FINAL_FIVE_FROM - 1 }).length, 9, 'a cup created before keeps every game of its week');
  const sin = nuevaMeta({ nombre: 'Corta', dias: 4, inicio: '2026-11-09', admin: 'abc123', creada: 1, cal: pozo.slice(0, 4) });
  assert.equal(sin.final, '0');
  assert.throws(() => nuevaMeta({ nombre: 'X', dias: 9, inicio: '2026-11-09', admin: 'abc123', creada: 1 }), /modalidad/, 'a new length needs its calendar');
});
