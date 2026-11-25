/**
 * Duels' test data (lab flag rivals, the owner, 2026-11-25): a tester switch on the /labs/ card of
 * Duels adds made-up duels to the signed-in player's own, so the nemesis, the arch rival, the stats
 * and the duel's page can be tried without dozens of real duels. Nothing is written anywhere: the
 * duels live only in this module, are rebuilt around the current time on each read and only this
 * phone sees them. Their ids start with `demo`, so the round pages never get a real one.
 */
const KEY = 'juegos-de-salon:duels-demo';
export const DEMO = /^demo[0-9]{6}$/;
export const isDemo = id => DEMO.test(String(id || ''));

export function demoOn(store = globalThis.localStorage) {
  try { return store.getItem(KEY) === '1'; } catch (_) { return false; }
}
export function setDemo(on, store = globalThis.localStorage) {
  try { on ? store.setItem(KEY, '1') : store.removeItem(KEY); } catch (_) { /* no storage: stays off */ }
}

// The made-up rivals: Ana is the nemesis, Beto the arch rival, the rest fill the list
const RIVALES = { ana: ['demoana1', 'Ana'], beto: ['demobeto', 'Beto'], caro: ['democaro', 'Caro'], diego: ['demodieg', 'Diego'], gabi: ['demogabi', 'Gabi'] };
const H = 3600000;

/**
 * The made-up duels of `me` ({ jid, n }) at time `t`. Each is given as rounds of [my score, theirs]
 * (null: not played yet), so every state shows: decided, waiting for the rival, my turn, not needed.
 */
export function demoDuels(me, t = Date.now()) {
  if (!me?.jid) return [];
  let k = 0;
  const duelo = (rival, f, g, horas, rondas, { gr = null, yoReto = true } = {}) => {
    const [rj, rn] = RIVALES[rival];
    const id = `demo${String(++k).padStart(6, '0')}`;
    const at = t - horas * H;
    const [a, an, b, bn] = yoReto ? [me.jid, me.n, rj, rn] : [rj, rn, me.jid, me.n];
    const r = { [me.jid]: {}, [rj]: {} }, e = { [me.jid]: {}, [rj]: {} };
    rondas.forEach(([mio, suyo], i) => {
      for (const [jid, x] of [[me.jid, mio], [rj, suyo]]) {
        if (x == null) continue;
        const cuando = at + (i + 1) * H * 0.6;
        r[jid][i] = { s: x, ms: 45000 + ((x * 37 + i * 911) % 60) * 1000, at: cuando };
        e[jid][i] = cuando - 90000;
      }
    });
    const sd = rondas.map((_, i) => `DEMO${'ABCDEFGHJ'[i]}`);
    return { id, a, b, an, bn, f, g, sd, at, r, e, ...(gr ? { gr } : {}) };
  };
  return [
    // Open: my turn in round 3 of a best of 5 (1–1 so far)
    duelo('beto', 'bo5', 'reinas', 20, [[92, 80], [70, 88], [null, 95], [null, null], [null, null]]),
    // Open: a custom duel, a different game each round, Ana already played round 2
    duelo('ana', 'pts4', 'tango', 8, [[85, 85], [null, 90], [null, null], [null, null]], { gr: ['tango', 'zip', 'reinas', 'desenredo'], yoReto: false }),
    // Open: I played everything I could, waiting for Caro
    duelo('caro', 'bo3', 'zip', 30, [[77, 60], [88, null], [90, null]]),
    // Finished: the nemesis, Ana, beats me again and again
    duelo('ana', 'bo3', 'desenredo', 50, [[60, 90], [75, 82], [null, null]]),
    duelo('ana', 'pts', 'zip', 130, [[70, 95], [90, 60], [55, 88]], { yoReto: false }),
    duelo('ana', 'bo3', 'reinas', 200, [[95, 70], [65, 80], [72, 91]]),
    duelo('ana', 'bo5', 'tango', 300, [[88, 90], [80, 81], [92, 70], [60, 99], [null, null]], { yoReto: false }),
    // Finished: Beto, the arch rival, close every time
    duelo('beto', 'bo3', 'tango', 100, [[90, 85], [70, 72], [88, 80]], { yoReto: false }),
    duelo('beto', 'bo3', 'zip', 170, [[60, 75], [80, 70], [66, 70]]),
    duelo('beto', 'pts', 'desenredo', 260, [[80, 80], [75, 70], [90, 92]], { yoReto: false }),
    duelo('beto', 'bo5', 'reinas', 380, [[95, 90], [70, 88], [90, 60], [85, 86], [99, 97]]),
    // Finished: the easy wins
    duelo('diego', 'bo3', 'reinas', 60, [[90, 50], [85, 60], [null, null]]),
    duelo('gabi', 'pts', 'tango', 150, [[80, 70], [92, 90], [75, 60]], { yoReto: false }),
    duelo('diego', 'bo3', 'desenredo', 420, [[70, 70], [88, 60], [90, 75]]),
  ];
}
