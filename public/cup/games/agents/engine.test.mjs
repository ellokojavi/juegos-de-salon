// Agentes (D-286, D-421): every deck, in the four languages, is fair —each agent goes only with its
// clue, the assassin and the neutrals tempt but go with none— and the state and the score add up.
import assert from 'node:assert/strict';
import { MAZOS, generar, generarDia, estado, puntaje, tarjeta, agentesDe, AGENTES, CUANTAS, NEUTRALES, ENSAYO } from './engine.js';

// The letters each language writes its words with: one word per card, in capitals
const LETRAS = { es: /^[A-ZÁÉÍÓÚÑÜ]+$/, en: /^[A-Z]+$/, pt: /^[A-ZÁÂÃÀÇÉÊÍÓÔÕÚ]+$/, de: /^[A-ZÄÖÜ]+$/ };

// A season has no month or Easter in a language spoken in both hemispheres: JULIO is winter in
// Santiago and summer in Madrid (a player's report). German is spoken only in the north.
const ESTACIONES = {
  es: { pistas: ['INVIERNO', 'VERANO', 'PRIMAVERA', 'OTOÑO'], meses: ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE', 'PASCUA'] },
  pt: { pistas: ['INVERNO', 'VERÃO', 'PRIMAVERA', 'OUTONO'], meses: ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO', 'PÁSCOA'] },
  en: { pistas: ['WINTER', 'SUMMER', 'SPRING', 'AUTUMN'], meses: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'EASTER'] },
};
for (const [lang, { pistas, meses }] of Object.entries(ESTACIONES)) {
  for (const x of MAZOS[lang].filter(x => pistas.includes(x.pista))) {
    const mes = [...x.si, ...x.casi].find(w => meses.includes(w));
    assert.ok(!mes, `${lang} ${x.pista}: ${mes} depends on the hemisphere`);
  }
}

for (const [lang, PISTAS] of Object.entries(MAZOS)) {
  assert.ok(PISTAS.length >= 100, `${lang}: only ${PISTAS.length} clues`);
  const nombres = PISTAS.map(x => x.pista);
  assert.equal(new Set(nombres).size, nombres.length, `${lang}: repeated clues`);
  for (const x of PISTAS) {
    assert.ok(x.si.length >= 9 && x.casi.length >= 3, `${lang} ${x.pista}: too few words`);
    assert.ok(!x.si.includes(x.pista) && !x.casi.includes(x.pista) && !x.casi.some(w => x.si.includes(w)), `${lang} ${x.pista}: a word in si and in casi`);
    assert.equal(new Set(x.si).size, x.si.length, `${lang} ${x.pista}: a repeated word`);
    for (const w of [x.pista, ...x.si, ...x.casi]) {
      assert.match(w, LETRAS[lang], `${lang} ${x.pista}: ${w}`);
      assert.ok(w.length <= 15, `${lang} ${x.pista}: ${w} does not fit on a card`);
    }
  }

  for (let n = 0; n < 300; n++) {
    const t = generar(`prueba-${n}`, { lang });
    assert.deepEqual(generar(`prueba-${n}`, { lang }), t, 'the same seed, the same board');
    assert.equal(t.cartas.length, AGENTES + NEUTRALES + 1);
    assert.equal(new Set(t.cartas.map(c => c.w)).size, AGENTES + NEUTRALES + 1, `${lang} ${n}: repeated words`);
    const elegidas = t.pistas.map(p => PISTAS.find(x => x.pista === p.pista));
    // Each clue says how many agents it has, and they add up to AGENTES (one is shorter)
    t.pistas.forEach((p, k) => assert.equal(t.cartas.filter(c => c.tipo === 'agente' && c.p === k).length, p.n, `${lang} ${n}: ${p.pista} does not have ${p.n}`));
    assert.equal(agentesDe(t), AGENTES);
    assert.deepEqual(t.pistas.map(p => p.n).sort(), [2, 3, 3, 3]);
    for (const c of t.cartas) {
      const van = elegidas.map((x, p) => (x.si.includes(c.w) ? p : -1)).filter(p => p >= 0);
      if (c.tipo === 'agente') assert.deepEqual(van, [c.p], `${lang} ${n}: ${c.w} goes with ${van}`);
      else assert.deepEqual(van, [], `${lang} ${n}: the ${c.tipo} ${c.w} goes with a clue`);
      if (c.tipo !== 'agente') assert.ok(elegidas[c.tienta]?.casi.includes(c.w), `${lang} ${n}: the ${c.tipo} ${c.w} does not tempt the clue it says`);
    }
    assert.ok(!t.cartas.some(c => t.pistas.some(p => p.pista === c.w)), `${lang} ${n}: a clue is on the board`);
  }
}

// A cup day: the same for everybody with the same code and day, in the cup's words; the trial is shorter
{
  const t = generarDia('KQRST', 3, { lang: 'de', palabras: 'es' });
  assert.deepEqual(t, generarDia('KQRST', 3, { lang: 'pt', palabras: 'es' }), 'the cup decides the words, not the player');
  assert.ok(MAZOS.es.some(x => x.pista === t.pistas[0].pista));
  assert.notDeepEqual(generarDia('KQRST', 4), t);
  const e = generarDia('KQRST', 3, { sal: 'ensayo', ensayo: true });
  assert.equal(e.pistas.length, ENSAYO.cuantas);
  assert.equal(e.cartas.length, agentesDe(e) + ENSAYO.neutrales + 1);
  assert.equal(agentesDe(e), 5);
}

// The state and the score
const t = generar('prueba-estado');
const de = p => t.cartas.map((c, i) => [c, i]).filter(([c]) => c.tipo === 'agente' && c.p === p).map(([, i]) => i);
const neutral = t.cartas.findIndex(c => c.tipo === 'neutral'), asesino = t.cartas.findIndex(c => c.tipo === 'asesino');
// All perfect: 100
const perfecto = [...Array(CUANTAS).keys()].flatMap(p => de(p).map(i => ({ i })));
let e = estado(t, perfecto);
assert.ok(e.fin && e.encontrados === AGENTES && puntaje(e) === 100);
// An agent of another clue scores and does not cut: that clue has one less to find
e = estado(t, [{ i: de(1)[0] }]);
assert.equal(e.actual, 0); assert.equal(e.encontrados, 1);
// A neutral cuts the clue and subtracts
e = estado(t, [{ i: de(0)[0] }, { i: neutral }]);
assert.equal(e.actual, 1); assert.equal(e.neutrales, 1);
// Passing cuts the clue without subtracting
e = estado(t, [{ pasar: true }]);
assert.equal(e.actual, 1); assert.equal(puntaje(e), 0);
// The assassin subtracts 40 (every clue but the last complete, and in the last the assassin: it ends)
e = estado(t, [...[...Array(CUANTAS - 1).keys()].flatMap(p => de(p).map(i => ({ i }))), { i: asesino }]);
assert.ok(e.fin && e.asesino); assert.equal(puntaje(e), Math.max(0, Math.round(100 * (AGENTES - t.pistas.at(-1).n) / AGENTES) - 40));
assert.equal(tarjeta(t, e).split('\n').length, (AGENTES + NEUTRALES + 1) / 3);
// A move with no card (a stale save) is ignored
assert.equal(estado(t, [{ i: 99 }]).tocadas.size, 0);
console.log('✓ Agentes');
