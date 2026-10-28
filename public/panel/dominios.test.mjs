// The panel's domains (D-348, D-349): node public/panel/dominios.test.mjs
import assert from 'node:assert/strict';
import {
  rangoAnterior, variacion, percentiles, partidasDominio, finales, embudoSalas, leerDetalle, dificultad,
  versiones, versionesEn, usuarios, cohortes, senales, ordenTramos, embudoCopas, aCsv, ABANDONO_MS,
} from './dominios.js';
import { nuevaMeta } from '../cup/engine.js';
import { summarize } from './aggregate.js';
import { isIndividualMode } from '../assets/js/games.js';

let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const DAY = 864e5;

test('the previous period and the change', () => {
  assert.deepEqual(rangoAnterior({ from: 10, to: 16 }), { from: 3, to: 9 });
  assert.equal(variacion(12, 10), 20);
  assert.equal(variacion(5, 10), -50);
  assert.equal(variacion(3, 0), null, 'nothing to compare with');
  assert.equal(variacion(0, 0), 0);
  assert.deepEqual(percentiles([5, 1, 3, 2, 4]), [2, 3, 4]);
  assert.deepEqual(percentiles([]), [null, null, null]);
});

const days = {
  100: {
    rooms: {
      ABCD: { game: 'dudo', at: 100 * DAY, v: '0.170.0', players: { A: 'x', B: 'y' }, end: { winner: 'A', at: 100 * DAY + 20 * 60e3 } },
      EFGH: { game: 'dudo', at: 100 * DAY, v: '0.170.0', players: { A: 'x' } },
    },
    local: { ahorcado: { local: { 3: 4 }, solo: { 1: 6 } }, tango: { solo: { 1: 5 }, 'uno-al-dia': { 1: 2 } }, copa: { copa: { 1: 9 } }, 'juego-nuevo': { 'modo-nuevo': { 2: 1 } } },
    fin: { ahorcado: { local: 3, solo: 4 }, tango: { solo: 4 } },
    otra: { ahorcado: 2 },
    live: {
      a1: { game: 'tango', mode: 'solo', n: 1, at: 100 * DAY, beat: 100 * DAY, v: '0.171.0', fin: { at: 1, d: '90/100 · 2:30' } },
      a2: { game: 'tango', mode: 'solo', n: 1, at: 100 * DAY, beat: 100 * DAY, v: '0.171.0', fin: { at: 1, d: '70/100 · 4:00' } },
      a3: { game: 'tango', mode: 'solo', n: 1, at: 100 * DAY, beat: 100 * DAY, v: '0.171.0' },
      a4: { game: 'pintaminas', mode: 'solo', n: 1, at: 100 * DAY, beat: 100 * DAY, v: '0.171.0', fin: { at: 1, d: 'hard · 50/100 · 1:10' } },
      a5: { game: 'dudo', mode: 'local', n: 3, at: 100 * DAY, beat: 100 * DAY, v: '0.169.0', fin: { at: 1, g: 'Javi' } },
    },
    vuelta: { nueva: 3, d1: 2, 'd2-7': 1 }, frec: { f1: 4, 'f2-3': 2 }, comparte: { 'resultado-tango': 2, app: 1 },
    activos: { aaaaaaaaaa: 2, bbbbbbbbbb: 1, corto: 1 },
  },
  101: { activos: { aaaaaaaaaa: 1, cccccccccc: 2 }, rooms: { IJKL: { game: 'dudo', at: 101 * DAY, v: '0.172.0', players: { A: 'x', B: 'y' } } } },
  108: { activos: { bbbbbbbbbb: 2 } },
};

test('games by domain: group (rooms with a rival, local modes for several) and individual (by the registry flag)', () => {
  const p = partidasDominio(days, { from: 100, to: 101 });
  assert.equal(p.grupo.total, 2 + 4 + 1, 'two rooms with a rival, 4 on one phone, and the unknown mode goes with the group');
  assert.equal(p.individual.total, 6 + 5 + 2);
  assert.equal(p.individual.byMode['uno-al-dia'], 2);
  assert.equal(p.grupo.byGame['juego-nuevo'], 1);
  assert.ok(!('copa' in p.grupo.byGame) && !('copa' in p.individual.byGame), 'the Cup has its own section');
  assert.deepEqual(p.grupo.byDay.map(d => d.total), [6, 1]);
});

test('finished and replayed', () => {
  const f = finales(days, { from: 100, to: 100 });
  assert.deepEqual(f.porJuego.ahorcado, { empezadas: 10, terminadas: 7, otras: 2, grupo: 4, individual: 6, finGrupo: 3, finIndividual: 4 }, 'finished split by domain: 3 on one phone, 4 solo');
  assert.equal(f.terminadas, 11);
  assert.equal(f.otras, 2);
});

test('rooms step by step, with the median length of the ended ones', () => {
  const e = embudoSalas(days, { from: 100, to: 101 });
  assert.deepEqual(e.dudo, { creadas: 3, conRival: 2, terminadas: 1, medianaMs: 20 * 60e3 });
});

test("an ending's detail and the difficulty of each individual game", () => {
  assert.deepEqual(leerDetalle('hard · 80/100 · 2:30'), { variante: 'hard', pct: 80, seg: 150 });
  assert.deepEqual(leerDetalle('7 intentos en 1:05'), { variante: null, pct: null, seg: 65 });
  assert.deepEqual(leerDetalle(''), { variante: null, pct: null, seg: null });
  const d = dificultad(days, { from: 100, to: 100 }, 100 * DAY + ABANDONO_MS + 1);
  const tango = d.find(x => x.k === 'tango');
  assert.deepEqual([tango.empezadas, tango.terminadas, tango.abandonos], [3, 2, 1]);
  assert.deepEqual(tango.puntaje, [70, 70, 90]);
  assert.ok(d.find(x => x.k === 'pintaminas · hard'), 'a variant counts apart');
  assert.ok(!d.some(x => x.game === 'dudo'), 'only individual modes');
});

test('versions on the timeline: when each one first shows up, and old phones do not move a mark', () => {
  const v = versiones(days);
  assert.deepEqual(v, [{ v: '0.169.0', day: 100 }, { v: '0.170.0', day: 100 }, { v: '0.171.0', day: 100 }, { v: '0.172.0', day: 101 }]);
  assert.deepEqual(versionesEn(v, 101, 107), ['0.172.0']);
});

test('users (D-349): active, played, new, unique by week and month', () => {
  const u = usuarios(days, { from: 100, to: 101 });
  assert.deepEqual(u.porDia, [{ day: 100, activos: 2, jugaron: 1, nuevos: 2 }, { day: 101, activos: 2, jugaron: 1, nuevos: 1 }]);
  assert.equal(u.rango, 3);
  assert.equal(u.diario, 2);
  assert.equal(u.desde, 100);
  const c = cohortes(days, { hoy: 108 });
  assert.equal(c.length, 1);
  assert.equal(c[0].tamano, 3);
  assert.equal(c[0].d1, 33, 'a came back the next day; b and c did not');
  assert.equal(c[0].d30, null, 'not reachable yet');
});

test('the counters with no id, and the order of their bands', () => {
  const s = senales(days, { from: 100, to: 101 });
  assert.equal(s.compartidos, 3);
  assert.deepEqual(ordenTramos(s.vuelta).map(([k]) => k), ['nueva', 'd1', 'd2-7']);
});

test('La Copa step by step, with who was left out', () => {
  const meta = nuevaMeta({ nombre: 'C', dias: 3, inicio: '2026-01-05', tz: 'America/Los_Angeles', admin: 'aaaaaa', creada: Date.parse('2026-01-04T12:00:00Z') });
  const L = { meta, players: { aaaaaa: { name: 'A', at: 1 }, bbbbbb: { name: 'B', at: 2 } }, started: { 1: { aaaaaa: 1 } }, results: { 1: { aaaaaa: { s: 1, ms: 1, at: 1 } } } };
  const d = Math.floor(meta.createdAt / DAY);
  const e = embudoCopas({ ABCDE: L }, { from: d, to: d }, meta.end + 1);
  assert.deepEqual([e.creadas, e.conGente, e.partieron, e.terminadas, e.tamano], [1, 1, 1, 1, 2]);
  assert.deepEqual(e.porDia[0], { dia: 1, esperado: 2, jugado: 1 });
});

test('CSV', () => {
  assert.equal(aCsv([{ a: 1, b: 'x,y' }, { a: 2, b: null }]), 'a,b\n1,"x,y"\n2,\n');
  assert.equal(aCsv([]), '');
});

console.log(`panel/dominios: ${n} tests OK`);

test('summarize can keep only some modes (the Group view leaves out the individual ones, D-348)', () => {
  const s = summarize(days, { from: 100, to: 100, modo: m => !isIndividualMode(m) });
  assert.ok(Object.values(s.byGame).every(g => !g.solo && !g['uno-al-dia']), 'no solo or One a Day game in the group summary');
});
