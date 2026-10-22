#!/usr/bin/env node
/**
 * Uno al día points, a month's backfill (D-414). When the points reached everyone, October 2026 had
 * already been played: this gives every player the October season they would have had, from the
 * history Firebase keeps (`unoAlDia/<jid>/<n>`), the same way their phone adds a day.
 *
 *   node tools/firebase/uad-points-backfill.mjs                      dry run: what it would write
 *   node tools/firebase/uad-points-backfill.mjs --apply              writes it
 *   node tools/firebase/uad-points-backfill.mjs --month 2026-10      another month (default 2026-10)
 *
 * For each player, the days of their history are walked as `walk()` does on the phone
 * (`daily-points.js`: the streak, and the 🧊 earned every 7 days in a row that saves a missed
 * day), and each day of the month not yet counted (`p`) is added in order, as
 * `jugador.anotarPuntosDia` does: its game score plus the bonus of the streak `r`, which grows at
 * most one a day and up to 10, exactly what the rules accept. Each counted day gets its `p`, so no
 * phone adds it again; a day a phone already counted is left alone, so running it twice writes
 * nothing new. Only what Firebase has counts: days played on a phone without signing in were never
 * uploaded, and the 🧊 won by inviting (`invitados/`) is not used by the walk, on the phone or here.
 * The next month starts at 0 on its own: its table is another period (`s2026-11`).
 *
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { fechaDeNum, numDia } from '../../public/assets/js/uno-al-dia.js';
import { walk } from '../../public/assets/js/daily-points.js';
import { UAD_PUNTOS, RACHA_TOPE, bonoRacha, claveOrden, esPais } from '../../public/assets/js/records.js';

/**
 * A player's month from their history `{ n: { j, s, ms, p? } }`: the days to add, in order, and the
 * row the table ends with. `antes` is the row already in the table (a phone may have added days).
 * Returns null when there is nothing to add.
 */
export function mesDe(hist, month, antes = null) {
  const dias = {};
  for (const [k, x] of Object.entries(hist || {})) if (/^[0-9]{5}$/.test(k) && x?.j) dias[fechaDeNum(Number(k))] = { j: x.j, s: x.s || 0 };
  const fin = lastDay(month);
  const w = walk(dias, fin);
  let fila = antes ? { s: antes.s, r: antes.r, u: antes.u } : null;
  const nuevos = [];
  for (const d of w.days) {
    if (!d.played || !d.date.startsWith(month)) continue;
    const n = numDia(d.date);
    if (hist[n]?.p) continue;
    const r = Math.max(1, Math.min(RACHA_TOPE, d.streak, fila ? fila.r + 1 : RACHA_TOPE));
    fila = { s: (fila?.s || 0) + d.score + bonoRacha(r), r, u: String(n) };
    nuevos.push({ n, date: d.date, score: d.score, r, s: fila.s });
  }
  return nuevos.length ? { nuevos, fila } : null;
}

/** The last day of `yyyy-mm`. */
export const lastDay = month => {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write, fail } = await import('./firebase-admin.mjs');
  const apply = process.argv.includes('--apply');
  const i = process.argv.indexOf('--month');
  const month = i > 0 ? process.argv[i + 1] : '2026-10';
  if (!/^[0-9]{4}-[0-9]{2}$/.test(month || '')) fail('--month takes yyyy-mm');
  const period = `s${month}`;
  const t = await token();
  const [todos, tabla, jugadores] = await Promise.all([read('unoAlDia', t), read(`records/${UAD_PUNTOS}/${period}`, t), read('jugadores', t)]);
  const filas = [];
  for (const [jid, hist] of Object.entries(todos || {})) {
    if (!/^[a-z0-9]{8}$/.test(jid)) continue;
    const m = mesDe(hist, month, tabla?.[jid] || null);
    const yo = jugadores?.[jid];
    if (!m || !yo?.n) continue;
    filas.push({ jid, n: yo.n, co: esPais(yo.co) ? yo.co : null, ...m });
  }
  const total = Object.fromEntries(Object.entries(tabla || {}).map(([jid, f]) => [jid, { n: f.n, s: f.s }]));
  for (const f of filas) total[f.jid] = { n: f.n, s: f.fila.s };
  const top = Object.values(total).sort((a, b) => b.s - a.s);
  console.log(`${period}: ${Object.keys(todos || {}).length} players with a history · ${filas.length} to update (${filas.reduce((a, f) => a + f.nuevos.length, 0)} days) · ${top.length} in the table after`);
  top.slice(0, 5).forEach((x, k) => console.log(`  #${k + 1}  ${x.n}  ${x.s} pts`));
  if (!apply) { console.log('Dry run: nothing written. Run it with --apply to write.'); process.exit(0); }
  for (const f of filas) {
    const cambios = { [`records/${UAD_PUNTOS}/${period}/${f.jid}`]: { s: f.fila.s, ms: 0, k: claveOrden(f.fila.s, 0), at: Date.now(), n: f.n, ...(f.co ? { co: f.co } : {}), u: f.fila.u, r: f.fila.r } };
    for (const d of f.nuevos) cambios[`unoAlDia/${f.jid}/${d.n}/p`] = true;
    await write('', 'PATCH', cambios, t);
  }
  console.log(`Written: ${filas.length} players.`);
}
