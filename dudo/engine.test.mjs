// Ejecutar: node dudo/engine.test.mjs
import assert from 'node:assert/strict';
import {
  PINTAS, DICE_PER_PLAYER, rollDice, readDice, writeDice, countPinta,
  minBid, bidOk, calzarOk, MIN_CALZAR, binomExact, binomAtLeast, credibility, botMove,
  buildState, sha256, randomSalt, verifyOpen,
} from './engine.js';

/* ---------- dados ---------- */
{
  const d = rollDice(5);
  assert.equal(d.length, 5);
  assert.ok(d.every(x => x >= 1 && x <= 6), 'las caras van de 1 a 6');
  // Las seis caras salen parejas: con 6000 dados ninguna baja de 800 ni pasa de 1200
  const cuenta = [0, 0, 0, 0, 0, 0, 0];
  rollDice(6000).forEach(x => cuenta[x]++);
  for (const p of PINTAS) assert.ok(cuenta[p] > 800 && cuenta[p] < 1200, `la cara ${p} salió ${cuenta[p]} veces`);
}
assert.deepEqual(readDice('3,3,5,1,6'), [3, 3, 5, 1, 6]);
assert.deepEqual(readDice([2, 4]), [2, 4]);
assert.equal(readDice(''), null, 'sin dados no hay jugada');
assert.equal(readDice('3,7'), null, 'un dado de siete caras no existe');
assert.equal(readDice('3,x'), null);
assert.equal(writeDice([3, 3, 5]), '3,3,5');

/* ---------- contar con ases comodín ---------- */
assert.equal(countPinta([3, 3, 5, 1, 6], 3), 3, 'dos treses y un as');
assert.equal(countPinta([3, 3, 5, 1, 6], 5), 2, 'un cinco y un as');
assert.equal(countPinta([3, 3, 5, 1, 6], 1), 1, 'pidiendo ases, el as vale uno solo');
assert.equal(countPinta([3, 3, 5, 1, 6], 3, { acesWild: false }), 2, 'sin comodín (ronda obligada)');

/* ---------- qué apuesta le gana a cuál ---------- */
assert.equal(minBid(null, 4), 1, 'abrir la ronda cuesta uno');
assert.equal(minBid({ n: 4, p: 5 }, 5), 5, 'misma pinta: una más');
assert.equal(minBid({ n: 4, p: 5 }, 6), 4, 'pinta mayor: alcanza la misma cantidad');
assert.equal(minBid({ n: 4, p: 5 }, 3), 5, 'pinta menor: hay que subir la cantidad');
assert.equal(minBid({ n: 6, p: 5 }, 1), 3, 'entrar a los ases cuesta la mitad');
assert.equal(minBid({ n: 5, p: 5 }, 1), 3, 'la mitad se redondea hacia arriba');
assert.equal(minBid({ n: 3, p: 1 }, 1), 4, 'de ases a ases, una más');
assert.equal(minBid({ n: 3, p: 1 }, 6), 7, 'salir de los ases cuesta el doble más uno');

assert.ok(bidOk({ n: 4, p: 5 }, { n: 4, p: 6 }, 20));
assert.ok(!bidOk({ n: 4, p: 5 }, { n: 4, p: 4 }, 20), 'no se puede bajar de pinta sin subir cantidad');
assert.ok(!bidOk({ n: 4, p: 5 }, { n: 4, p: 5 }, 20), 'repetir la apuesta no es subir');
assert.ok(!bidOk(null, { n: 21, p: 5 }, 20), 'no se puede apostar más dados de los que hay');
assert.ok(!bidOk(null, { n: 2, p: 7 }, 20), 'no existe la pinta 7');
assert.ok(!bidOk(null, { n: 0, p: 5 }, 20), 'cero dados no es una apuesta');

/* ---------- calzar: desde la mitad de la mesa y con tres jugadores (D-71) ---------- */
assert.ok(!calzarOk({ n: 4, p: 5 }, 20, 4), 'con 20 dados en la mesa, cuatro es muy poco');
assert.ok(calzarOk({ n: 10, p: 5 }, 20, 4), 'la mitad justa ya deja calzar');
assert.ok(!calzarOk(null, 10, 4), 'sin apuesta no hay nada que calzar');
assert.ok(!calzarOk({ n: 6, p: 5 }, 10, 2), 'en un duelo no se calza: solo hay una mano tapada');
assert.ok(calzarOk({ n: 6, p: 5 }, 10, MIN_CALZAR), 'con tres ya se puede');

/* ---------- probabilidad ---------- */
assert.ok(Math.abs(binomExact(0, 5, 1 / 3) - Math.pow(2 / 3, 5)) < 1e-12);
assert.equal(binomAtLeast(0, 5, 1 / 3), 1, 'pedir cero es seguro');
assert.equal(binomAtLeast(6, 5, 1 / 3), 0, 'no se puede sacar más de lo que hay');
{
  const suma = [0, 1, 2, 3, 4, 5].reduce((a, k) => a + binomExact(k, 5, 1 / 3), 0);
  assert.ok(Math.abs(suma - 1) < 1e-12, 'la distribución suma uno');
}
assert.equal(credibility({ myDice: [5, 5, 5], bid: { n: 3, p: 5 }, totalDice: 10 }), 1,
  'la apuesta que ya está en mi propia mano es segura');
assert.ok(credibility({ myDice: [2, 2, 2], bid: { n: 9, p: 5 }, totalDice: 10 }) < 0.01,
  'nueve cincos con siete dados desconocidos es un disparate');

/* ---------- el celular juega con sus dados y nada más ---------- */
{
  const dudar = botMove({ myDice: [2, 2, 3, 4, 6], bid: { n: 9, p: 5 }, totalDice: 10 });
  assert.equal(dudar.t, 'dudo', 'una apuesta imposible se duda');

  const sube = botMove({ myDice: [5, 5, 5, 5, 1], bid: { n: 3, p: 5 }, totalDice: 10, rand: () => 1 });
  assert.equal(sube.t, 'bid', 'con cinco cincos en la mano no se duda');
  assert.ok(sube.n >= minBid({ n: 3, p: 5 }, sube.p), 'la subida del celular es legal');

  const abre = botMove({ myDice: [4, 4, 4, 2, 6], bid: null, totalDice: 10, rand: () => 1 });
  assert.equal(abre.t, 'bid');
  assert.ok(abre.n >= 1 && PINTAS.includes(abre.p));

  const calza = botMove({
    myDice: [5, 5, 5, 5, 5], bid: { n: 5, p: 5 }, totalDice: 6, canCalzar: true, rand: () => 1,
  });
  assert.equal(calza.t, 'calza', 'con la cantidad exacta en la mano, calzar es lo obvio');

  // Nunca propone algo que el motor vaya a descartar
  for (let i = 0; i < 200; i++) {
    const mine = rollDice(5);
    const bid = { n: 3 + (i % 5), p: 2 + (i % 5) };
    const m = botMove({ myDice: mine, bid, totalDice: 10, canCalzar: true });
    if (m.t === 'bid') assert.ok(bidOk(bid, m, 10), `apuesta ilegal del celular: ${JSON.stringify(m)}`);
  }
}

/* ---------- una ronda completa ---------- */
const P = ['A', 'B'];
const ronda = (a, b) => [{ t: 'roll', from: 'A', d: a }, { t: 'roll', from: 'B', d: b }];
const abrir = (a, b) => [{ t: 'open', from: 'A', d: a }, { t: 'open', from: 'B', d: b }];

{
  const s = buildState({ players: P, plays: ronda('1,1,1,1,1', '2,2,2,2,2') });
  assert.equal(s.phase, 'bid', 'con todos los dados tirados se puede apostar');
  assert.equal(s.current, 'A', 'abre el primero');
  assert.equal(s.totalDice, 10);
  assert.equal(s.bid, null);
}
{
  // A apuesta cuatro cincos, B duda: hay cinco (los ases de A) → pierde B
  const s = buildState({
    players: P,
    plays: [
      ...ronda('1,1,1,1,1', '2,2,2,2,2'),
      { t: 'bid', from: 'A', n: 4, p: 5 },
      { t: 'dudo', from: 'B' },
      ...abrir('1,1,1,1,1', '2,2,2,2,2'),
    ],
  });
  assert.equal(s.last.count, 5, 'los cinco ases cuentan como cincos');
  assert.equal(s.last.loser, 'B', 'dudó de una apuesta que era cierta');
  assert.equal(s.st.B.dice, 4);
  assert.equal(s.st.A.dice, 5);
  assert.equal(s.opener, 'B', 'abre la ronda siguiente quien perdió el dado');
  assert.equal(s.phase, 'roll', 'y arranca una ronda nueva');
}
{
  // A apuesta seis cincos, B duda: hay cinco → pierde A
  const s = buildState({
    players: P,
    plays: [
      ...ronda('1,1,1,1,1', '2,2,2,2,2'),
      { t: 'bid', from: 'A', n: 6, p: 5 },
      { t: 'dudo', from: 'B' },
      ...abrir('1,1,1,1,1', '2,2,2,2,2'),
    ],
  });
  assert.equal(s.last.loser, 'A', 'apostó más de los que había');
  assert.equal(s.st.A.dice, 4);
}
/* ---------- calzar, con la mesa de tres que la regla pide ---------- */
const P3 = ['A', 'B', 'C'];
const ronda3 = (a, b, c) => [
  { t: 'roll', from: 'A', d: a }, { t: 'roll', from: 'B', d: b }, { t: 'roll', from: 'C', d: c },
];
{
  // Diez cincos en la mesa (cinco de A, tres de B y sus dos ases). B calza justo y recupera…
  // pero ya tiene cinco dados, así que el tope lo deja igual.
  const s = buildState({
    players: P3,
    plays: [
      ...ronda3('5,5,5,5,5', '5,5,5,1,1', '2,2,2,2,2'),
      { t: 'bid', from: 'A', n: 10, p: 5 },
      { t: 'calza', from: 'B' },
    ],
  });
  assert.equal(s.last.count, 10);
  assert.ok(s.last.exact, 'diez cincos eran exactamente diez');
  assert.equal(s.last.gainer, 'B');
  assert.equal(s.st.B.dice, 5, 'nadie pasa de cinco dados');
  assert.equal(s.opener, 'B', 'quien calza bien abre la ronda siguiente');
}
{
  // Calzar de más: se pierde el dado
  const s = buildState({
    players: P3,
    plays: [
      ...ronda3('5,5,5,5,5', '5,5,5,1,1', '2,2,2,2,2'),
      { t: 'bid', from: 'A', n: 11, p: 5 },
      { t: 'calza', from: 'B' },
    ],
  });
  assert.equal(s.last.gainer, null);
  assert.equal(s.last.loser, 'B');
  assert.equal(s.st.B.dice, 4);
}
{
  // Empezar con tres y quedar en dos apaga el calzar (D-71). C duda cinco veces de una
  // apuesta cierta —A y B tienen diez ases, que valen como cualquier pinta— y se queda sin dados.
  const plays = [];
  for (let i = 5; i >= 1; i--) {
    const dadosC = '2,2,2,2,2'.split(',').slice(0, i).join(',');
    plays.push({ t: 'roll', from: 'A', d: '1,1,1,1,1' }, { t: 'roll', from: 'B', d: '1,1,1,1,1' }, { t: 'roll', from: 'C', d: dadosC });
    if (i < 5) plays.push({ t: 'bid', from: 'C', n: 1, p: 5 });
    plays.push({ t: 'bid', from: 'A', n: 10, p: 5 }, { t: 'bid', from: 'B', n: 10, p: 6 }, { t: 'dudo', from: 'C' });
  }
  const fuera = buildState({ players: P3, plays });
  assert.ok(fuera.st.C.out, 'C se quedó sin dados');
  assert.deepEqual(fuera.alive, ['A', 'B']);
  assert.equal(fuera.done, false, 'quedan dos: la partida sigue');

  const duelo = buildState({
    players: P3,
    plays: [...plays,
      { t: 'roll', from: 'A', d: '1,1,1,1,1' }, { t: 'roll', from: 'B', d: '1,1,1,1,1' },
      { t: 'bid', from: 'A', n: 10, p: 5 }],
  });
  assert.equal(duelo.bid.n, 10, 'la apuesta pasa la mitad de la mesa');
  assert.equal(duelo.canCalzar, false, 'pero ya son dos, así que no se puede calzar');
}

/* ---------- lo que se descarta (C-7) ---------- */
{
  const base = ronda('1,1,1,1,1', '2,2,2,2,2');
  const fuera = buildState({ players: P, plays: [...base, { t: 'bid', from: 'B', n: 2, p: 3 }] });
  assert.equal(fuera.bid, null, 'una apuesta fuera de turno no cuenta');

  const baja = buildState({
    players: P,
    plays: [...base, { t: 'bid', from: 'A', n: 4, p: 5 }, { t: 'bid', from: 'B', n: 4, p: 4 }],
  });
  assert.equal(baja.bid.n, 4);
  assert.equal(baja.bid.p, 5, 'la apuesta que no sube se descarta y queda la anterior');
  assert.equal(baja.current, 'B', 'y el turno sigue siendo suyo');

  const dudaSinApuesta = buildState({ players: P, plays: [...base, { t: 'dudo', from: 'A' }] });
  assert.equal(dudaSinApuesta.phase, 'bid', 'no se puede dudar de nada');

  const calzaTemprano = buildState({
    players: P,
    plays: [...base, { t: 'bid', from: 'A', n: 2, p: 5 }, { t: 'calza', from: 'B' }],
  });
  assert.equal(calzaTemprano.phase, 'bid', 'calzar antes de la mitad de la mesa no cuenta');

  const duelo = buildState({
    players: P,
    plays: [...base, { t: 'bid', from: 'A', n: 6, p: 5 }, { t: 'calza', from: 'B' }],
  });
  assert.equal(duelo.canCalzar, false, 'en un duelo no se ofrece calzar');
  assert.equal(duelo.phase, 'bid', 'y el mensaje se descarta aunque la apuesta pase la mitad');

  const dadosDeMas = buildState({ players: P, plays: [{ t: 'roll', from: 'A', d: '1,1,1,1,1,1' }] });
  assert.deepEqual(dadosDeMas.waiting, ['A', 'B'], 'seis dados cuando tocan cinco no es una tirada');
}

/* ---------- en la sala los dados no viajan hasta el final (C-10) ---------- */
{
  const conHash = [{ t: 'roll', from: 'A', h: 'aaa' }, { t: 'roll', from: 'B', h: 'bbb' }];
  const enJuego = buildState({ players: P, plays: [...conHash, { t: 'bid', from: 'A', n: 4, p: 5 }] });
  assert.equal(enJuego.phase, 'bid', 'se juega sin conocer los dados del rival');
  assert.equal(enJuego.bid.n, 4);

  const esperando = buildState({
    players: P,
    plays: [...conHash, { t: 'bid', from: 'A', n: 4, p: 5 }, { t: 'dudo', from: 'B' },
      { t: 'open', from: 'A', d: '1,1,1,1,1', salt: 'x' }],
  });
  assert.equal(esperando.phase, 'open');
  assert.deepEqual(esperando.waiting, ['B'], 'falta que B destape');
  assert.equal(esperando.last, null, 'nadie pierde un dado hasta que se cuenta todo');

  const listo = buildState({
    players: P,
    plays: [...conHash, { t: 'bid', from: 'A', n: 4, p: 5 }, { t: 'dudo', from: 'B' },
      { t: 'open', from: 'A', d: '1,1,1,1,1', salt: 'x' }, { t: 'open', from: 'B', d: '2,2,2,2,2', salt: 'y' }],
  });
  assert.equal(listo.last.count, 5);
  assert.equal(listo.last.loser, 'B');
}

/* ---------- la partida se termina cuando queda uno ---------- */
{
  const plays = [];
  // Cinco rondas iguales: A tiene cinco ases (o sea, cinco cincos) y B duda de que los tenga.
  // Desde la segunda ronda abre B, porque abre quien perdió el dado.
  for (let i = 5; i >= 1; i--) {
    const dadosB = '2,2,2,2,2'.split(',').slice(0, i).join(',');
    plays.push({ t: 'roll', from: 'A', d: '1,1,1,1,1' }, { t: 'roll', from: 'B', d: dadosB });
    if (i < 5) plays.push({ t: 'bid', from: 'B', n: 1, p: 5 });
    plays.push({ t: 'bid', from: 'A', n: 5, p: 5 });
    plays.push({ t: 'dudo', from: 'B' });
    plays.push({ t: 'open', from: 'A', d: '1,1,1,1,1' }, { t: 'open', from: 'B', d: dadosB });
  }
  const s = buildState({ players: P, plays });
  assert.ok(s.done, 'con un solo jugador con dados, se acabó');
  assert.equal(s.winner, 'A');
  assert.equal(s.st.B.dice, 0);
  assert.ok(s.st.B.out);
  assert.equal(s.history.length, 5, 'cinco rondas, un dado por ronda');
  assert.equal(s.current, null, 'no hay a quién darle el turno');
}

/* ---------- tres jugadores: el turno gira y quien sale deja de contar ---------- */
{
  const T = ['A', 'B', 'C'];
  const tirar = () => [
    { t: 'roll', from: 'A', d: '6,6,6,6,6' },
    { t: 'roll', from: 'B', d: '2,2,2,2,2' },
    { t: 'roll', from: 'C', d: '3,3,3,3,3' },
  ];
  const s = buildState({
    players: T,
    plays: [...tirar(), { t: 'bid', from: 'A', n: 3, p: 6 }, { t: 'bid', from: 'B', n: 4, p: 6 }],
  });
  assert.equal(s.current, 'C', 'después de B le toca a C');
  assert.equal(s.totalDice, 15);

  const dudaC = buildState({
    players: T,
    plays: [...tirar(), { t: 'bid', from: 'A', n: 3, p: 6 }, { t: 'bid', from: 'B', n: 9, p: 6 },
      { t: 'dudo', from: 'C' },
      { t: 'open', from: 'A', d: '6,6,6,6,6' }, { t: 'open', from: 'B', d: '2,2,2,2,2' }, { t: 'open', from: 'C', d: '3,3,3,3,3' }],
  });
  assert.equal(dudaC.last.count, 5, 'solo los seises de A');
  assert.equal(dudaC.last.loser, 'B', 'nueve seises no había');
  assert.equal(dudaC.st.B.dice, 4);
  assert.equal(dudaC.opener, 'B');
}

/* ---------- anti-trampa ---------- */
{
  const dados = [3, 3, 5, 1, 6];
  const salt = randomSalt();
  const commit = await sha256(writeDice(dados) + salt);
  assert.deepEqual(await verifyOpen({ dice: dados, salt, commit }), { ok: true, sinHash: false });
  const cambiados = await verifyOpen({ dice: [6, 6, 6, 6, 6], salt, commit });
  assert.equal(cambiados.ok, false, 'cambiar los dados al destapar se nota');
  const sinHash = await verifyOpen({ dice: dados, salt, commit: null });
  assert.ok(sinHash.ok && sinHash.sinHash, 'en un celular no hay hash que verificar');
}

/* ---------- una partida entera contra el celular, sin jugadas ilegales ---------- */
{
  for (let partida = 0; partida < 20; partida++) {
    const plays = [];
    let guard = 0;
    let s = buildState({ players: P, plays });
    while (!s.done && guard++ < 400) {
      if (s.phase === 'roll') {
        s.waiting.forEach(p => plays.push({ t: 'roll', from: p, d: writeDice(rollDice(s.st[p].dice)) }));
      } else if (s.phase === 'bid') {
        const mine = readDice(s.rolls[s.current].d);
        const m = botMove({ myDice: mine, bid: s.bid, totalDice: s.totalDice, canCalzar: s.canCalzar });
        plays.push({ ...m, from: s.current });
      } else if (s.phase === 'open') {
        s.waiting.forEach(p => plays.push({ t: 'open', from: p, d: s.rolls[p].d }));
      }
      s = buildState({ players: P, plays });
    }
    assert.ok(s.done, `la partida ${partida} no terminó: el celular se quedó pegado`);
    assert.ok(['A', 'B'].includes(s.winner));
    assert.equal(s.st[s.winner].out, false);
  }
}

console.log('dudo: dados, apuestas, calzar, rondas, el celular que juega y el anti-trampa en orden');
