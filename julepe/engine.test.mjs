// Ejecutar: node julepe/engine.test.mjs
import assert from 'node:assert/strict';
import {
  MANO, RESERVA, MIN_BAZAS, ENTRADA, PREMIO, leerPuestos, verifica,
  palo, rango, valor, esCarta, leerCartas, escribirCartas, mazo, barajar, reparte, enMano, enReserva,
  legales, ganador, fuerza, botDeclara, botCambia, botJuega, botRegala, buildState, puedeJugar,
} from './engine.js';

/** Azar de prueba: siempre el mismo, para que un test que falla vuelva a fallar igual. */
function azar(semilla = 1) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- cartas ---------- */
assert.equal(mazo().length, 52, 'mazo inglés completo, sin comodines');
assert.equal(new Set(mazo()).size, 52, 'sin cartas repetidas');
assert.equal(palo('10♦'), '♦');
assert.equal(rango('10♦'), '10');
assert.ok(valor('A♠') > valor('K♠') && valor('K♠') > valor('Q♠') && valor('Q♠') > valor('J♠'));
assert.ok(valor('J♠') > valor('10♠') && valor('3♠') > valor('2♠'), 'del as al dos, sin saltos');
assert.ok(esCarta('2♣') && !esCarta('1♣') && !esCarta('A') && !esCarta('A★'));
assert.deepEqual(leerCartas('A♠,10♦'), ['A♠', '10♦']);
assert.deepEqual(leerCartas(''), [], 'no cambiar ninguna carta también es jugada');
assert.equal(leerCartas('A♠,A♠'), null, 'una carta repetida no existe en el mazo');
assert.equal(leerCartas('A♠,X'), null);
assert.equal(escribirCartas(['A♠', '10♦']), 'A♠,10♦');

/* ---------- reparto ---------- */
{
  const players = ['A', 'B', 'C', 'D', 'E', 'F'];
  const { manos, triunfo } = reparte(players, azar(7));
  const todas = players.flatMap(p => manos[p]).concat(triunfo);
  assert.ok(players.every(p => manos[p].length === MANO + RESERVA), 'cinco en mano y tres de reserva');
  assert.equal(new Set(todas).size, todas.length, 'nadie recibe la misma carta dos veces');
  assert.equal(todas.length, 49, 'con seis jugadores caben en las 52 y sobran tres');
  assert.ok(esCarta(triunfo));
  assert.equal(enMano(manos.A).length, MANO);
  assert.equal(enReserva(manos.A).length, RESERVA);
  // Barajar no pierde ni inventa cartas
  assert.deepEqual([...barajar(mazo(), azar(3))].sort(), [...mazo()].sort());
}

/* ---------- obligación de asistir, montar y fallar ---------- */
{
  const mano = ['K♠', '3♠', 'A♥', '5♦', '2♦'];
  // asistir y montar: con la mesa en Q♠, el K obliga; el 3 no sirve aunque sea del palo
  assert.deepEqual(legales(mano, [{ p: 'B', c: 'Q♠' }], '♦'), ['K♠'], 'si puede montar, monta');
  // asistir sin poder montar: quedan todas las del palo
  assert.deepEqual(legales(mano, [{ p: 'B', c: 'A♠' }], '♦'), ['K♠', '3♠'], 'no le gana: asiste con lo que sea');
  // fallar: sin tréboles y con triunfos, tiene que fallar
  assert.deepEqual(legales(mano, [{ p: 'B', c: '9♣' }], '♦'), ['5♦', '2♦'], 'sin el palo y con triunfo, falla');
  // ni el palo ni triunfo: tira lo que quiera
  assert.deepEqual(legales(['K♠', 'A♥'], [{ p: 'B', c: '9♣' }], '♦'), ['K♠', 'A♥']);
  // abriendo la baza no hay obligación
  assert.equal(legales(mano, [], '♦').length, 5);
  // la carta más alta del palo de salida manda, aunque haya un triunfo más alto en la mesa:
  // el que ya falló no cambia lo que le exigen a los demás
  assert.deepEqual(legales(['K♠', '3♠'], [{ p: 'B', c: 'Q♠' }, { p: 'C', c: 'A♦' }], '♦'), ['K♠']);
}

/* ---------- quién se lleva la baza ---------- */
assert.equal(ganador([{ p: 'A', c: 'K♠' }, { p: 'B', c: 'A♠' }], '♦'), 'B', 'la más alta del palo');
assert.equal(ganador([{ p: 'A', c: 'A♠' }, { p: 'B', c: '2♦' }], '♦'), 'B', 'el triunfo más chico gana al as');
assert.equal(ganador([{ p: 'A', c: '2♦' }, { p: 'B', c: '3♦' }], '♦'), 'B', 'entre triunfos, el más alto');
assert.equal(ganador([{ p: 'A', c: 'K♠' }, { p: 'B', c: 'A♥' }], '♦'), 'A', 'el as de otro palo no gana nada');

/* ---------- el celular que juega ---------- */
{
  assert.ok(fuerza(['A♦', 'K♦', 'Q♦', 'A♠', '2♣'], '♦', 3) > 2.5, 'tres triunfos altos y un as es mano de ir');
  assert.ok(fuerza(['2♠', '5♠', '7♣', '3♥', '9♥'], '♦', 3) < 0.8, 'sin triunfos ni figuras, no hay nada');
  assert.ok(fuerza(['A♠', 'K♠'], '♦', 1) > fuerza(['A♠', 'K♠'], '♦', 5), 'la misma mano vale menos con más rivales');

  const brava = { mano: ['A♦', 'K♦', 'Q♦', 'A♠', '2♣'], triunfo: '♦', rivales: 3 };
  const mala = { mano: ['2♠', '5♠', '7♣', '3♥', '9♥'], triunfo: '♦', rivales: 3 };
  const veces = (arg, n = 200) => { let v = 0; const r = azar(11); for (let i = 0; i < n; i++) if (botDeclara({ ...arg, rand: r })) v++; return v; };
  assert.equal(veces(mala), 0, 'con esa mano se pasa siempre');
  assert.equal(veces(brava), 200, 'con esa mano va siempre');
  // Una mano del filo: con el plato recién puesto entra, con veinte tragos adentro no
  const media = { mano: ['A♦', '10♦', 'A♠', '3♥', '9♥'], triunfo: '♦', rivales: 3 };
  assert.ok(veces({ ...media, plato: ENTRADA * 4 }) > 150, 'con el plato chico, esa mano casi siempre se juega');
  assert.equal(veces({ ...media, plato: 40 }), 0, 'con el plato grande se arruga');

  assert.deepEqual(botCambia({ mano: ['A♦', 'K♦', 'A♠', '3♥', '9♥'], triunfo: '♦' }).sort(), ['3♥', '9♥'],
    'suelta las bajas y guarda triunfos y ases');
  assert.equal(botCambia({ mano: ['A♦', 'K♦', 'Q♦', 'A♠', 'K♣'], triunfo: '♦' }).length, 0, 'una mano así no se toca');
  assert.equal(botCambia({ mano: ['2♠', '5♠', '7♣', '3♥', '9♥'], triunfo: '♦' }).length, RESERVA, 'nunca más de tres');

  assert.equal(botJuega({ mano: ['A♦', 'K♦', 'Q♠', '3♥'], triunfo: '♦', rand: azar(2) }), 'A♦', 'con dos triunfos, arrastra');
  assert.equal(botJuega({ mano: ['A♠', '3♥', '4♥'], triunfo: '♦', rand: azar(2) }), 'A♠', 'sin triunfos, sale con el as');
  assert.equal(botJuega({ mano: ['K♠', '3♠', '4♥'], baza: [{ p: 'B', c: 'Q♠' }], triunfo: '♦', rand: azar(2) }), 'K♠', 'gana si puede');
  assert.equal(botJuega({ mano: ['3♠', '2♠', 'A♥'], baza: [{ p: 'B', c: 'Q♠' }], triunfo: '♦', rand: azar(2) }), '2♠', 'perdida la baza, la peor carta');
  assert.equal(botJuega({ mano: ['2♦', 'A♠', '3♥'], baza: [{ p: 'B', c: 'Q♣' }], triunfo: '♦', rand: azar(2) }), '2♦', 'obligado a fallar, falla barato');
  assert.deepEqual(botRegala({ yo: 'A', bazas: 3, tragos: { B: 10, C: 2, D: 8 }, players: ['A', 'B', 'C', 'D'], rand: azar(5) }),
    ['C', 'C', 'C'], 'todos los tragos al que va más seco');
}

/* ---------- el plato, la declaración y el julepe ---------- */
const P3 = ['A', 'B', 'C'];
const rep = (dador, triunfo, manos) => ({ t: 'reparte', from: dador, triunfo, m: Object.fromEntries(Object.entries(manos).map(([p, cs]) => [p, escribirCartas(cs)])) });

{
  // Estado 1: el plato parte con la entrada de todos
  const s = buildState({ players: P3, plays: [] });
  assert.equal(s.plato, ENTRADA * 3, 'entran dos tragos por cabeza');
  assert.equal(s.entrada, ENTRADA);
  assert.equal(s.phase, 'reparte');
  assert.equal(s.dador, 'A', 'reparte el primero de la mesa');
  assert.equal(s.turno, 'A', 'y se espera que reparta');
}

const MANOS3 = {
  A: ['A♦', 'K♦', 'Q♦', 'J♦', '10♦', '2♠', '3♠', '4♠'],
  B: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠', '2♥', '3♥', '4♥'],
  C: ['A♣', 'K♣', 'Q♣', 'J♣', '10♣', '9♠', '9♥', '9♣'],
};

{
  // Estado 2: si todos se pasan, la mano se anula, el plato queda y reparte el siguiente
  const plays = [rep('A', '7♦', MANOS3), { t: 'paso', from: 'B' }, { t: 'paso', from: 'C' }, { t: 'paso', from: 'A' }];
  const s = buildState({ players: P3, plays });
  assert.equal(s.historia.length, 1);
  assert.equal(s.ultima.vacia, true, 'mano nula');
  assert.equal(s.plato, ENTRADA * 3, 'el plato sigue puesto y no se vuelve a poner');
  assert.equal(s.entrada, 0);
  assert.equal(s.dador, 'B', 'el reparto corre para la derecha');
  assert.equal(s.phase, 'reparte');
  assert.deepEqual(P3.map(p => s.st[p].tragos), [0, 0, 0], 'pasarse no cuesta nada');
}

{
  // Si va uno solo, el dador se queda obligado (D-83)
  const plays = [rep('A', '7♦', MANOS3), { t: 'va', from: 'B' }, { t: 'paso', from: 'C' }, { t: 'paso', from: 'A' }];
  const s = buildState({ players: P3, plays });
  assert.deepEqual(s.va, ['B', 'A'], 'el dador entra a la fuerza, en su lugar de la mesa');
  assert.equal(s.decl.A, 'obligado');
  assert.equal(s.phase, 'cambia');
  assert.equal(s.turno, 'B');
}

{
  // Una mano completa: A se lleva las cinco bazas con puros triunfos, B y C se julepean
  const plays = [
    rep('A', '7♦', MANOS3),
    { t: 'va', from: 'B' }, { t: 'va', from: 'C' }, { t: 'va', from: 'A' },
    { t: 'cambia', from: 'B', i: '' }, { t: 'cambia', from: 'C', i: '' }, { t: 'cambia', from: 'A', i: '' },
  ];
  let s = buildState({ players: P3, plays });
  assert.equal(s.phase, 'baza');
  assert.equal(s.turno, 'B', 'sale el de la derecha del dador');
  assert.deepEqual(s.cartas.A, ['A♦', 'K♦', 'Q♦', 'J♦', '10♦'], 'quien no cambia se queda con su mano');

  // Estado 4: cinco bazas. A no tiene picas ni tréboles, así que está obligado a fallar
  plays.push({ t: 'juega', from: 'B', c: 'A♠' }, { t: 'juega', from: 'C', c: '10♣' }, { t: 'juega', from: 'A', c: '10♦' });
  s = buildState({ players: P3, plays });
  assert.equal(s.ganadas.A, 1, 'el triunfo más chico se lleva al as de picas');
  assert.equal(s.turno, 'A', 'abre quien ganó la baza');

  const sigue = (a, b, c) => plays.push({ t: 'juega', from: 'A', c: a }, { t: 'juega', from: 'B', c: b }, { t: 'juega', from: 'C', c });
  sigue('J♦', '10♠', 'J♣');
  sigue('Q♦', 'J♠', 'Q♣');
  sigue('K♦', 'Q♠', 'K♣');
  sigue('A♦', 'K♠', 'A♣');
  s = buildState({ players: P3, plays });
  assert.equal(s.phase, 'regala', 'auditado: falta que A reparta');
  assert.equal(s.ganadas.A, 5);
  assert.deepEqual(s.resultado.julepes, ['B', 'C'], 'sin dos bazas, julepe');
  assert.equal(s.st.B.tragos, ENTRADA * 3, 'el julepe se toma el plato entero');
  assert.equal(s.st.C.tragos, ENTRADA * 3);
  assert.equal(s.turno, 'A');

  // Estado 5: dos tragos por baza, repartidos a gusto
  plays.push({ t: 'regala', from: 'A', a: 'B,B,C' });          // le faltan dos: no es reparto válido
  assert.equal(buildState({ players: P3, plays }).phase, 'regala', 'repartir de menos no cierra la mano');
  plays.pop();
  plays.push({ t: 'regala', from: 'A', a: 'B,B,C,C,A' });      // no se puede regalar a uno mismo
  assert.equal(buildState({ players: P3, plays }).phase, 'regala');
  plays.pop();
  plays.push({ t: 'regala', from: 'A', a: 'B,B,C,C,C' });
  s = buildState({ players: P3, plays });
  assert.equal(s.st.B.tragos, ENTRADA * 3 + 2 * PREMIO);
  assert.equal(s.st.C.tragos, ENTRADA * 3 + 3 * PREMIO);
  assert.equal(s.st.A.tragos, 0, 'quien se salva no toma nada');
  assert.equal(s.plato, ENTRADA * 3 * 2, 'dos julepes dejan el plato al doble');
  assert.equal(s.entrada, 0, 'con el plato lleno nadie vuelve a poner');
  assert.equal(s.dador, 'B');
  assert.equal(s.historia.length, 1);
}

{
  // Lo que no corresponde se descarta en silencio (C-7)
  const plays = [rep('A', '7♦', MANOS3)];
  plays.push({ t: 'va', from: 'C' });                                   // fuera de turno
  assert.equal(buildState({ players: P3, plays }).turno, 'B');
  plays.push({ t: 'va', from: 'B' }, { t: 'va', from: 'C' }, { t: 'va', from: 'A' });
  plays.push({ t: 'cambia', from: 'B', i: '0,1,2,3' });                 // cuatro cartas
  assert.equal(buildState({ players: P3, plays }).turno, 'B');
  plays.push({ t: 'cambia', from: 'B', i: '7' });                       // ese puesto no existe
  assert.equal(buildState({ players: P3, plays }).turno, 'B');
  plays.push({ t: 'cambia', from: 'B', i: '4,3' });                     // el 10♠ y la J♠
  let s = buildState({ players: P3, plays });
  assert.deepEqual(s.cartas.B, ['A♠', 'K♠', 'Q♠', '2♥', '3♥'], 'las que cambia salen de su propia reserva');
  assert.equal(s.cambios.B, 2);
  plays.push({ t: 'cambia', from: 'C', i: '' }, { t: 'cambia', from: 'A', i: '' });
  plays.push({ t: 'juega', from: 'B', c: '3♥' });
  s = buildState({ players: P3, plays });
  assert.equal(s.baza.length, 1, 'abriendo puede tirar lo que quiera');
  plays.push({ t: 'juega', from: 'C', c: 'A♣' });                       // tiene que asistir a corazones… no tiene
  s = buildState({ players: P3, plays });
  assert.equal(s.baza.length, 2);
  plays.push({ t: 'juega', from: 'A', c: 'A♦' });
  s = buildState({ players: P3, plays });
  assert.equal(s.ganadas.A, 1, 'falló con triunfo y se la llevó');
  assert.deepEqual(puedeJugar(s, 'A'), s.cartas.A, 'abriendo, todas sirven');
  assert.deepEqual(puedeJugar(s, 'B'), [], 'sin turno, ninguna');
}

/* ---------- el destape del final de la mano (C-10) ---------- */
assert.deepEqual(leerPuestos(''), [], 'no cambiar nada es una jugada');
assert.deepEqual(leerPuestos('0,4'), [0, 4]);
assert.equal(leerPuestos('0,0'), null, 'el mismo puesto dos veces no existe');
assert.equal(leerPuestos('5'), null, 'la mano tiene cinco cartas: del 0 al 4');
assert.equal(leerPuestos('0,1,2,3'), null, 'nunca más de tres');

{
  // La misma mano de antes, jugada entera, y al final cada uno destapa lo que le tocó
  const plays = [
    rep('A', '7♦', MANOS3),
    { t: 'va', from: 'B' }, { t: 'va', from: 'C' }, { t: 'va', from: 'A' },
    { t: 'cambia', from: 'B', i: '' }, { t: 'cambia', from: 'C', i: '' }, { t: 'cambia', from: 'A', i: '' },
    { t: 'juega', from: 'B', c: 'A♠' }, { t: 'juega', from: 'C', c: '10♣' }, { t: 'juega', from: 'A', c: '10♦' },
  ];
  const vuelta = (a, b, c) => plays.push({ t: 'juega', from: 'A', c: a }, { t: 'juega', from: 'B', c: b }, { t: 'juega', from: 'C', c });
  vuelta('J♦', '10♠', 'J♣'); vuelta('Q♦', 'J♠', 'Q♣'); vuelta('K♦', 'Q♠', 'K♣'); vuelta('A♦', 'K♠', 'A♣');
  plays.push({ t: 'regala', from: 'A', a: 'B,B,C,C,C' });

  const destape = m => Object.entries(MANOS3).map(([p, cs]) => ({ t: 'revela', from: p, n: 0, cs: escribirCartas(m[p] || cs) }));
  let s = buildState({ players: P3, plays: [...plays, ...destape({})] });
  assert.equal(s.historia[0].verificacion.ok, true, 'todos jugaron con lo que les tocó');
  assert.deepEqual(s.historia[0].verificacion.faltan, []);

  // Una carta que no le tocó: A destapa una mano sin el as de triunfo, pero lo jugó
  const trampa = { A: ['2♣', 'K♦', 'Q♦', 'J♦', '10♦', '2♠', '3♠', '4♠'] };
  s = buildState({ players: P3, plays: [...plays, ...destape(trampa)] });
  assert.deepEqual(s.historia[0].verificacion.culpables, ['A'], 'jugó una carta que no tenía');

  // Dos manos con la misma carta: caen las dos, porque no se sabe cuál es la buena
  const repetida = { B: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠', '2♥', '3♥', '10♦'] };
  s = buildState({ players: P3, plays: [...plays, ...destape(repetida)] });
  assert.deepEqual(s.historia[0].verificacion.culpables.sort(), ['A', 'B'], 'la misma carta en dos manos');

  // Sin destape no hay veredicto, y se dice quién falta
  s = buildState({ players: P3, plays });
  assert.equal(s.historia[0].verificacion.hubo, false);
  assert.deepEqual(s.historia[0].verificacion.faltan.sort(), ['A', 'B', 'C']);
}

/* ---------- partidas completas contra el celular ---------- */
{
  const jugar = (players, manos, semilla) => {
    const rand = azar(semilla);
    const config = { manos };
    const plays = [];
    let s = buildState({ players, config, plays });
    let guard = 0;
    while (!s.done && guard++ < 3000) {
      const p = s.turno;
      if (s.phase === 'reparte') {
        const r = reparte(players, rand);
        plays.push(rep(s.dador, r.triunfo, r.manos));
      } else if (s.phase === 'declara') {
        const va = botDeclara({ mano: s.cartas[p], triunfo: s.triunfo, rivales: players.length - 1, plato: s.plato, rand });
        plays.push({ t: va ? 'va' : 'paso', from: p });
      } else if (s.phase === 'cambia') {
        const suelta = botCambia({ mano: s.cartas[p], triunfo: s.triunfo });
        plays.push({ t: 'cambia', from: p, i: suelta.map(c => s.cartas[p].indexOf(c)).join(',') });
      } else if (s.phase === 'baza') {
        plays.push({ t: 'juega', from: p, c: botJuega({ mano: s.cartas[p], baza: s.baza, triunfo: s.triunfo, rand }) });
      } else if (s.phase === 'regala') {
        const tragos = Object.fromEntries(players.map(q => [q, s.st[q].tragos]));
        plays.push({ t: 'regala', from: p, a: botRegala({ yo: p, bazas: s.ganadas[p], tragos, players, rand }).join(',') });
      }
      s = buildState({ players, config, plays });
    }
    assert.ok(s.done, `la partida de ${players.length} no terminó: el celular se quedó pegado`);
    return s;
  };

  for (let n = 2; n <= 6; n++) {
    const players = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, n);
    for (let semilla = 1; semilla <= 12; semilla++) {
      const s = jugar(players, 6, semilla * n);
      assert.equal(s.historia.length, 6, 'se jugaron las manos pedidas');
      let esperado = 0;
      for (const h of s.historia) {
        if (h.vacia) { assert.equal(h.va.length, 0); continue; }
        assert.ok(h.va.length >= 2, 'nunca se juega una mano de a uno: está el obligado');
        assert.equal(h.bazas.length, MANO, 'cinco bazas, ni una más');
        assert.equal(Object.values(h.ganadas).reduce((a, b) => a + b, 0), MANO);
        for (const p of h.va) {
          const b = h.ganadas[p] || 0;
          assert.equal(b >= MIN_BAZAS, h.salvados.includes(p), 'se salva justo el que hizo dos bazas');
        }
        esperado += h.plato * h.julepes.length;
        esperado += Object.values(h.regalos).flat().length * PREMIO;
        // El plato de la mano siguiente sale de lo que se bebieron los julepes
        const sig = s.historia[h.n + 1];
        if (sig) assert.equal(sig.plato, h.julepes.length ? h.plato * h.julepes.length : ENTRADA * n, 'el plato se acumula o se vuelve a poner');
      }
      const bebido = players.reduce((a, p) => a + s.st[p].tragos, 0);
      assert.equal(bebido, esperado, 'cada trago que alguien se tomó salió del plato o de un reparto');
      assert.ok(s.ganadores.length >= 1, 'gana el que terminó más seco');
      const menos = Math.min(...players.map(p => s.st[p].tragos));
      assert.ok(s.ganadores.every(p => s.st[p].tragos === menos));
    }
  }
}

console.log('julepe: cartas, obligaciones, plato, julepe, el celular que juega y las manos completas en orden');
