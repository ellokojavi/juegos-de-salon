// Tests del motor de La Copa: node copa/engine.test.mjs
import assert from 'node:assert/strict';
import {
  CALENDARIOS, PUNTOS, esCodigo, codigoAlAzar, pidAlAzar, PID, limpiarNombre, claveNombre, esPin, hashPin,
  fechaEn, sumarDias, medianoche, ventanas, nuevaMeta, diaActual, abierto, cerrado, terminada, inscripcionAbierta,
  estadoDia, puedeComodin, multiplicador, posicionesDelDia, tabla, faltan, medallas, reloj, mmss, juegoDelDia, evolucion,
} from './engine.js';

let n = 0;
const test = (name, fn) => { fn(); n++; };
const H = 60 * 60 * 1000;

test('calendarios: la final siempre al final', () => {
  assert.deepEqual(CALENDARIOS[3], ['linea', 'conexiones', 'final']);
  assert.deepEqual(CALENDARIOS[7], ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'anio', 'final']);
  assert.equal(CALENDARIOS[7].length, 7);
  assert.equal(CALENDARIOS[7][6], 'final');
  assert.equal(new Set(CALENDARIOS[7]).size, 7);
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
  // Cata 10+6+12=28 · Javi 8+10+16=34 · Pancho 6+8+20=34 · Tomás 5
  const m = medallas(L);
  // Javi y Pancho empatan en 34 y en 1 día ganado; desempata la final: Pancho
  assert.deepEqual(m.campeon.map(f => f.name), ['Pancho']);
  assert.equal(m.farolito[0].name, 'Tomás');
  assert.equal(m.remontada.filas[0].name, 'Pancho');
  assert.equal(m.ganador.n, 1);
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

test('el nombre de la copa llega a 40 caracteres; el de un jugador, a 20 (D-119)', () => {
  const m = nuevaMeta({ nombre: 'Copa Pirata (1ra prueba)', dias: 7, inicio: '2026-10-01', admin: 'aaaaaa', creada: 1 });
  assert.equal(m.name, 'Copa Pirata (1ra prueba)');
  assert.equal(nuevaMeta({ nombre: 'x'.repeat(60), dias: 7, inicio: '2026-10-01', admin: 'a', creada: 1 }).name.length, 40);
  assert.equal(limpiarNombre('y'.repeat(30)).length, 20);
});

await new Promise(r => setTimeout(r, 50));
console.log(`copa/engine: ${n} tests OK`);
