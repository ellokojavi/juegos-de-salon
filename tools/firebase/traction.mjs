// The making-of page's Traction numbers (/making-of/#traction), counted once a day and written as
// five public totals to `controls/traction`, so the page shows them fresh without the owner's access.
// It counts with the panel's own functions (the panel's "games finished" and its different browsers),
// over the last whole UTC day: games finished in all (rooms with an ending, offline games finished,
// La Copa games), in the last 7 days, the best day so far, and different browsers in 7 and 30 days.
// Only these totals go out: no id, game, country or time.
//
//   node tools/firebase/traction.mjs           # print what it would write
//   node tools/firebase/traction.mjs --write   # write it (the `traction` workflow, every day)
import { fileURLToPath } from 'node:url';
import { finales, embudoSalas, usuarios } from '../../public/panel/dominios.js';
import { resumenCopas } from '../../public/panel/copas.js';
import { dayOf } from '../../public/panel/aggregate.js';

const finished = (days, torneos, d, now) => {
  const r = { from: d, to: d };
  return finales(days, r).terminadas
    + Object.values(embudoSalas(days, r)).reduce((k, g) => k + g.terminadas, 0)
    + resumenCopas(torneos, r, now).jugadas;
};
const iso = d => new Date(d * 864e5).toISOString().slice(0, 10);

/** The five totals, up to the last whole UTC day before `now`. */
export function traction(days = {}, torneos = {}, now = Date.now()) {
  const to = dayOf(now) - 1;
  const ks = Object.keys(days).map(Number).filter(d => d <= to);
  const first = ks.length ? Math.min(...ks) : to;
  let total = 0, week = 0, best = 0, bestDay = null;
  for (let d = first; d <= to; d++) {
    const n = finished(days, torneos, d, now);
    total += n;
    if (d > to - 7) week += n;
    if (n > best) { best = n; bestDay = d; }
  }
  const u = usuarios(days, { from: to - 29, to });
  return {
    total, week, best, bestDay: bestDay === null ? null : iso(bestDay),
    phones7: u.semana, phones30: u.mes, asOf: iso(to), at: now,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write } = await import('./firebase-admin.mjs');
  const t = await token();
  const [days, torneos] = await Promise.all([read('stats/prod/days', t), read('torneos', t)]);
  const out = traction(days || {}, torneos || {});
  console.log(JSON.stringify(out));
  if (process.argv.includes('--write')) {
    await write('controls/traction', 'PUT', out, t);
    console.log('✓ controls/traction');
  }
}
