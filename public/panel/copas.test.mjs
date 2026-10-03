// Ejecutar: node panel/copas.test.mjs
import assert from 'node:assert/strict';
import { nuevaMeta, DIA_MS } from '../copa/engine.js';
import { summarize, groupDays, dayOf } from './aggregate.js';
import { isTorneo, GAMES } from '../assets/js/games.js';
import { JUGANDO_MS, copaDe, copasDe, estadoCopa, copasEnCurso, resumenCopas, bitacoraCopas, pct, duracion, inicioLabel } from './copas.js';

// Una copa de 7 días que empezó hace dos días y medio: el día 1 cerró, el 2 y el 3 están abiertos
const ZONA = 'America/Santiago';
const inicio = '2026-09-20';
const meta = nuevaMeta({ nombre: 'Copa de la oficina', dias: 7, inicio, tz: ZONA, admin: 'aaaaaa', creada: Date.UTC(2026, 8, 19, 12), lab: true, alias: 'oficina' });
const now = meta.win[3].a + 10 * 60 * 60 * 1000; // día 3, a media mañana
assert.ok(now >= meta.win[1].b, 'el día 1 ya cerró');
assert.ok(now < meta.win[2].b, 'el día 2 sigue abierto (se juega hasta el fin del día 3)');

const players = {
  aaaaaa: { name: 'Javi', at: 1 },
  bbbbbb: { name: 'Cata', at: 2 },
  cccccc: { name: 'Fausto', at: 3 },
  dddddd: { name: 'Sacado', at: 4, out: true },
};
const r = (s, ms, at) => ({ s, ms, at, r: `${s}/100`, t: '' });
const torneos = {
  OFICI: {
    meta, players,
    // Firebase devuelve los días como arreglo, con el 0 vacío
    started: [null,
      { aaaaaa: meta.win[1].a + 1000, bbbbbb: meta.win[1].a + 2000, cccccc: meta.win[1].a + 3000 },
      { aaaaaa: meta.win[2].a + 1000, cccccc: now - 5 * 60 * 1000 },        // Fausto juega el 2 ahora
      { aaaaaa: now - 2 * 60 * 1000, bbbbbb: now - 2 * 60 * 60 * 1000 }],  // Javi juega el 3; Cata lo dejó
    results: [null,
      { aaaaaa: r(90, 60000, meta.win[1].a + 61000), bbbbbb: r(90, 50000, meta.win[1].a + 52000) }, // Fausto no terminó el 1
      { aaaaaa: r(40, 200000, meta.win[2].a + 201000) }],
  },
  // Una rota no rompe nada
  MALAA: { players: {} },
};

// --- Una copa por dentro ------------------------------------------------
assert.equal(copaDe('X', {}), null);
assert.equal(copasDe(torneos).length, 1, 'la rota se descarta');
const c = estadoCopa(copaDe('OFICI', torneos.OFICI), now);
assert.equal(c.estado, 'en-curso');
assert.equal(c.dia, 3);
assert.equal(c.jugadores, 3, 'el sacado no cuenta');
assert.equal(c.hoy.juego, 'conexiones');
assert.equal(c.hoy.jugaron, 0);
assert.deepEqual(c.jugando.map(x => [x.name, x.dia]).sort(), [['Fausto', 2], ['Javi', 3]], 'jugando ahora mira todos los días abiertos');
assert.equal(c.hoy.jugadores.find(j => j.name === 'Javi').jugando, true);
assert.equal(c.hoy.jugadores.find(j => j.name === 'Cata').jugando, false, 'empezó hace dos horas: ya no cuenta como jugando');
// Del día 1, que cerró, jugaron 2 de 3
assert.deepEqual(c.participacion, { jugado: 2, esperado: 3 });
assert.equal(pct(c.participacion), 67);
// Día 1: empate en puntaje y gana quien tardó menos (Cata 10, Javi 8). Día 2: solo Javi (10).
// El dueño ve la tabla completa, con el día 2 que los demás todavía no pueden ver.
assert.deepEqual({ ...c.primero }, { name: 'Javi', total: 18, empatados: 1 });
assert.equal(c.ultimo, meta.win[2].a + 201000);
assert.equal(c.lab, true);
assert.equal(c.alias, 'oficina');

// --- La lista de "Ahora" -------------------------------------------------
const futura = nuevaMeta({ nombre: 'Copa del finde', dias: 3, inicio: '2026-09-30', tz: ZONA, admin: 'eeeeee', creada: now - 1000 });
const vieja = nuevaMeta({ nombre: 'Copa de agosto', dias: 3, inicio: '2026-08-01', tz: ZONA, admin: 'ffffff', creada: Date.UTC(2026, 6, 31) });
const conOtras = {
  ...torneos,
  FUTUR: { meta: futura, players: { eeeeee: { name: 'Ana', at: 1 } } },
  VIEJA: { meta: vieja, players: { ffffff: { name: 'Beto', at: 1 } }, results: [null, { ffffff: r(100, 1000, vieja.win[1].a + 5000) }] },
};
const vivas = copasEnCurso(conOtras, now);
assert.deepEqual(vivas.map(x => x.code), ['OFICI', 'FUTUR'], 'la terminada se va, la que no empieza va al final');
assert.equal(vivas[1].estado, 'por-empezar');
assert.equal(vivas[1].hoy, null);
assert.equal(vivas[1].inscripcion, true);

// --- Las cifras de un rango ---------------------------------------------
const semana = { from: dayOf(now) - 6, to: dayOf(now) };
const rc = resumenCopas(conOtras, semana, now);
assert.equal(rc.copas, 2, 'la de agosto no toca la semana');
assert.equal(rc.nuevas, 2, 'las dos se crearon en la semana');
assert.equal(resumenCopas(conOtras, { from: dayOf(now), to: dayOf(now) }, now).nuevas, 1, 'hoy solo se creó la del finde');
assert.equal(rc.inscripciones, 4);
assert.equal(rc.jugadas, 3);
// Fausto dejó el 1 (el día cerró) y Cata el 3 (pasó media hora); Javi y Fausto siguen jugando
assert.equal(rc.abandonos, 2);
const linea = rc.porMinijuego.find(m => m.id === 'linea');
assert.deepEqual({ ...linea }, { id: 'linea', jugadas: 2, abandonos: 1, copas: 1, promedio: 90, medianaMs: 55000 });
assert.equal(rc.porMinijuego[0].id, 'linea', 'el más jugado primero');
assert.equal(rc.porMinijuego.find(m => m.id === 'conexiones').jugadas, 0);
assert.equal(rc.porMinijuego.find(m => m.id === 'conexiones').promedio, null, 'sin jugadas no hay promedio');
assert.equal(rc.porDia.length, 7);
assert.equal(rc.porDia.reduce((k, d) => k + d.total, 0), 3);
assert.deepEqual(rc.participacion, { jugado: 2, esperado: 3 });
// Un rango sin nada
const vacio = resumenCopas(conOtras, { from: 100, to: 106 }, now);
assert.equal(vacio.jugadas, 0);
assert.equal(pct(vacio.participacion), null, 'sin días cerrados no hay porcentaje, no un 0%');

// --- La bitácora de copas -----------------------------------------------
assert.deepEqual(bitacoraCopas(conOtras, semana, now).map(x => x.code), ['FUTUR', 'OFICI'], 'la más nueva primero');
const agosto = bitacoraCopas(conOtras, { from: dayOf(vieja.win[1].a), to: dayOf(vieja.end) }, now);
assert.equal(agosto[0].estado, 'terminada');
assert.equal(agosto[0].primero.name, 'Beto');

// --- Juegos por un lado y torneo por otro -------------------------------
// Separa por la marca `torneo` del registro, no por nombre (C-16)
const torneo = GAMES.find(g => g.torneo).id;
assert.equal(isTorneo(torneo), true);
assert.equal(isTorneo('dudo'), false);
assert.equal(isTorneo('juego-nuevo'), false, 'uno que no se conoce cuenta como juego');
const dia = 20342;
const days = { [dia]: {
  local: { [torneo]: { [torneo]: { 1: 5 } }, dudo: { cpu: { 1: 2 } } },
  rooms: { ABCD: { game: 'dudo', players: { A: 'a', B: 'b' } } },
  origin: { America__Santiago: 8 },
} };
const soloJuegos = summarize(days, { from: dia, to: dia, incluye: id => !isTorneo(id) });
assert.equal(soloJuegos.partidas, 3, 'los días del torneo no se cuentan como partidas');
assert.equal(soloJuegos.byGame[torneo], undefined);
assert.equal(soloJuegos.devices, 8, 'los celulares se cuentan enteros: son del celular, no del juego');
assert.equal(summarize(days, { from: dia, to: dia }).partidas, 8, 'sin filtro, todo');

// groupDays suma cualquier cifra de la fila, no solo las de las salas
const semanas = groupDays([{ day: dia, juegos: 2, torneo: 1 }, { day: dia + 1, juegos: 3, torneo: 4 }], 'semana');
assert.equal(semanas.reduce((k, s) => k + s.juegos, 0), 5);
assert.equal(semanas.reduce((k, s) => k + s.torneo, 0), 5);

// --- Rótulos ------------------------------------------------------------
assert.equal(duracion(55000), '0:55');
assert.equal(duracion(3723000), '1:02:03');
assert.equal(duracion(undefined), '0:00');
assert.match(inicioLabel('2026-09-24'), /24/);
assert.equal(inicioLabel(''), '?');
assert.ok(JUGANDO_MS > 0 && JUGANDO_MS < DIA_MS);

// --- Inscripción cerrada por el admin y quien llegó tarde ---------------
const cerrada = estadoCopa(copaDe('OFICI', { ...torneos.OFICI, closed: true }), now);
assert.equal(c.inscripcion, true, 'sin cerrar, la inscripción sigue abierta');
assert.equal(cerrada.inscripcion, false, 'el admin la cerró: no se puede decir abierta');
// Leo entra el día 3: el día 1 ya había cerrado, así que no le faltó ese minijuego
const tarde = { ...torneos.OFICI, players: { ...players, gggggg: { name: 'Leo', at: meta.win[1].b + 1000 } } };
assert.deepEqual(estadoCopa(copaDe('OFICI', tarde), now).participacion, { jugado: 2, esperado: 3 }, 'el día 1 no se le cobra a quien llegó después');
assert.deepEqual(resumenCopas({ OFICI: tarde }, semana, now).participacion, { jugado: 2, esperado: 3 });

console.log('copas.test.mjs: todo en verde');
