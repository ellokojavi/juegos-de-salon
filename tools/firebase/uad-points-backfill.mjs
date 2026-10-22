#!/usr/bin/env node
/**
 * Uno al día points, a month's backfill (D-414). When the points reached everyone, October 2026 had
 * already been played: this gives every player the October season they would have had, from the
 * history Firebase keeps (`unoAlDia/<jid>/<n>`), the same way their phone adds a day.
 *
 *   node tools/firebase/uad-points-backfill.mjs                      dry run: what it would write
 *   node tools/firebase/uad-points-backfill.mjs --apply              writes it
 *   node tools/firebase/uad-points-backfill.mjs --month 2026-10      another month (default 2026-10)
 *   node tools/firebase/uad-points-backfill.mjs --rebuild [--apply]  recomputes the whole month (D-415)
 *
 * `--rebuild` also writes the season's places by week (`uadTemporada/s<yyyy-mm>`, D-424) for the
 * recap the home page shows when the month ends.
 *
 * `--rebuild` recomputes each player's month from scratch, from the history and the days their 🧊
 * saved (the markers a phone uploads, `{ c: true }`, D-415), plus +10 for each invited friend already
 * counted (`invitados/<jid>/<uid>/p`) that accepted in that month, and rewrites the row when it
 * differs (and gives `p` to any played day of the month that lacks it). It fixes a total a phone or
 * this backfill added with a streak the server didn't know. Running it twice writes nothing new.
 *
 * For each player, the days of their history are walked as `walk()` does on the phone
 * (`daily-points.js`: the streak, and the 🧊 earned every 7 days in a row that saves a missed
 * day), and each day of the month not yet counted (`p`) is added in order, as
 * `jugador.anotarPuntosDia` does: its game score plus the bonus of the streak `r`, which grows at
 * most one a day and up to 10, exactly what the rules accept. Each counted day gets its `p`, so no
 * phone adds it again; a day a phone already counted is left alone, so running it twice writes
 * nothing new. Only what Firebase has counts: days played on a phone without signing in were never
 * uploaded. The 🧊 won by inviting (`invitados/`) and the days a phone's 🧊 saved (its markers, D-415)
 * count here as on the phone.
 * The next month starts at 0 on its own: its table is another period (`s2026-11`).
 *
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { fechaDeNum, numDia } from '../../public/assets/js/uno-al-dia.js';
import { walk, bonusFor } from '../../public/assets/js/daily-points.js';
import { UAD_PUNTOS, RACHA_TOPE, bonoRacha, claveOrden, esPais } from '../../public/assets/js/records.js';

/**
 * A player's month from their history `{ n: { j, s, ms, p? } }`: the days to add, in order, and the
 * row the table ends with. `antes` is the row already in the table (a phone may have added days).
 * Returns null when there is nothing to add.
 */
export function mesDe(hist, month, antes = null, { gifts = [] } = {}) {
  const w = walkServer(hist, month, gifts);
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

/**
 * The server's walk of a player's history up to the month's last day: the days played, and the
 * missed days their phone said a 🧊 saved (D-415). `gifts` are the dates a friend accepted.
 */
export function walkServer(hist, month, gifts = []) {
  const dias = {}, saved = [];
  for (const [k, x] of Object.entries(hist || {})) {
    if (!/^[0-9]{5}$/.test(k)) continue;
    if (x?.j) dias[fechaDeNum(Number(k))] = { j: x.j, s: x.s || 0 };
    else if (x?.c === true) saved.push(fechaDeNum(Number(k)));
  }
  return walk(dias, lastDay(month), { saved, gifts });
}

/**
 * A player's month recomputed from scratch (`--rebuild`, D-415): `{ s, r, u, faltaP }`, with
 * `faltaP` the played days of the month without their `p`. `invites` is how many friends already
 * counted (`p`) accepted in that month. null when the month has no day played.
 */
export function rehacerMes(hist, month, { gifts = [], invites = 0 } = {}) {
  const dias = walkServer(hist, month, gifts).days.filter(d => d.played && d.date.startsWith(month));
  if (!dias.length) return null;
  const last = dias.at(-1);
  const s = dias.reduce((a, d) => a + d.score + bonusFor(Math.min(RACHA_TOPE, d.streak)), 0) + invites * 10;
  return { s, r: Math.max(1, Math.min(RACHA_TOPE, last.streak)), u: String(numDia(last.date)), faltaP: dias.map(d => numDia(d.date)).filter(n => !hist[n]?.p) };
}

/** Where the season's places by week are kept (D-424): `uadTemporada/s<yyyy-mm>`, public to read. */
export const TEMPORADA = 'uadTemporada';

/**
 * The days a season's places are taken (D-424): each Sunday of the month (Uno al día's weeks start
 * on Monday) and its last day, the end of the season.
 */
export function cortesDe(month) {
  const last = lastDay(month);
  const out = [];
  for (let d = `${month}-01`; d <= last; d = fechaDeNum(numDia(d) + 1)) if (new Date(`${d}T12:00:00Z`).getUTCDay() === 0 && d !== last) out.push(d);
  return [...out, last];
}

/**
 * The season's places by week (D-424), for the recap window the home page opens when a month ends:
 * `{ c: [cut dates], t: the day it was computed, j: { <jid>: { n, co?, s, l: [place at each cut, or 0] } } }`.
 * Each player's points walk their history as `rehacerMes` does, plus +10 on the day each counted
 * friend accepted; at each cut, everyone with points is ranked by points, ties sharing the place
 * (as the table does, `ordenar`). 0 means no points yet by that cut. `players`: `[{ jid, n, co, hist, gifts, invites: [dates] }]`.
 */
export function temporadaDe(players, month, today) {
  const cortes = cortesDe(month);
  const filas = [];
  for (const p of players) {
    const dias = walkServer(p.hist, month, p.gifts).days.filter(d => d.played && d.date.startsWith(month));
    const sumas = [...dias.map(d => [d.date, d.score + bonusFor(Math.min(RACHA_TOPE, d.streak))]), ...(p.invites || []).map(f => [f, 10])];
    if (!sumas.length) continue;
    const at = cortes.map(c => sumas.reduce((a, [f, x]) => a + (f <= c ? x : 0), 0));
    filas.push({ p, at });
  }
  const j = {};
  for (const { p, at } of filas) j[p.jid] = { n: p.n, ...(p.co ? { co: p.co } : {}), s: at.at(-1), l: [] };
  cortes.forEach((_, i) => {
    const conPuntos = filas.filter(f => f.at[i] > 0).sort((a, b) => b.at[i] - a.at[i]);
    conPuntos.forEach((f, k) => { const prev = conPuntos[k - 1]; f.lugar = prev && prev.at[i] === f.at[i] ? prev.lugar : k + 1; });
    for (const f of filas) j[f.p.jid].l.push(f.at[i] > 0 ? f.lugar : 0);
  });
  return { c: cortes, t: today, j };
}

/** The last day of `yyyy-mm`. */
export const lastDay = month => {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write, fail } = await import('./firebase-admin.mjs');
  const apply = process.argv.includes('--apply'), rebuild = process.argv.includes('--rebuild');
  const i = process.argv.indexOf('--month');
  const month = i > 0 ? process.argv[i + 1] : '2026-10';
  if (!/^[0-9]{4}-[0-9]{2}$/.test(month || '')) fail('--month takes yyyy-mm');
  const period = `s${month}`;
  const t = await token();
  const [todos, tabla, jugadores, invitados] = await Promise.all([read('unoAlDia', t), read(`records/${UAD_PUNTOS}/${period}`, t), read('jugadores', t), read('invitados', t)]);
  // The dates a friend accepted (the 🧊 they gave), and how many of them already gave +10 this month
  const giftsOf = jid => Object.values(invitados?.[jid] || {}).filter(x => Number.isInteger(x?.d)).map(x => fechaDeNum(x.d));
  const invitesOf = jid => Object.values(invitados?.[jid] || {}).filter(x => x?.p === true && Number.isInteger(x.d) && fechaDeNum(x.d).startsWith(month)).length;
  if (rebuild) {
    const cambios = [];
    for (const [jid, hist] of Object.entries(todos || {})) {
      if (!/^[a-z0-9]{8}$/.test(jid) || !jugadores?.[jid]?.n) continue;
      const m = rehacerMes(hist, month, { gifts: giftsOf(jid), invites: invitesOf(jid) });
      const antes = tabla?.[jid] || null;
      if (!m || (antes && antes.s === m.s && antes.r === m.r && antes.u === m.u && !m.faltaP.length)) continue;
      cambios.push({ jid, n: jugadores[jid].n, co: esPais(jugadores[jid].co) ? jugadores[jid].co : null, antes: antes?.s ?? null, i: antes?.i, ...m });
    }
    console.log(`${period} rebuild: ${Object.keys(todos || {}).length} players with a history · ${cambios.length} to rewrite`);
    for (const c of cambios) console.log(`  ${c.n} (${c.jid})  ${c.antes ?? '—'} → ${c.s} pts · streak ${c.r}${c.faltaP.length ? ` · ${c.faltaP.length} days get p` : ''}`);
    // The season's places by week (D-424), every night: the home page's recap reads them once the month is over
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
    const datesOf = jid => Object.values(invitados?.[jid] || {}).filter(x => x?.p === true && Number.isInteger(x.d) && fechaDeNum(x.d).startsWith(month)).map(x => fechaDeNum(x.d));
    const temporada = temporadaDe(Object.entries(todos || {}).filter(([jid]) => /^[a-z0-9]{8}$/.test(jid) && jugadores?.[jid]?.n)
      .map(([jid, hist]) => ({ jid, n: jugadores[jid].n, co: esPais(jugadores[jid].co) ? jugadores[jid].co : null, hist, gifts: giftsOf(jid), invites: datesOf(jid) })), month, hoy);
    const podio = Object.entries(temporada.j).filter(([, x]) => x.l.at(-1) && x.l.at(-1) <= 3).sort((a, b) => a[1].l.at(-1) - b[1].l.at(-1));
    console.log(`${TEMPORADA}/${period}: ${Object.keys(temporada.j).length} players, places on ${temporada.c.join(', ')} · ${podio.map(([, x]) => `#${x.l.at(-1)} ${x.n} ${x.s}`).join(' · ') || 'nobody yet'}`);
    if (!apply) { console.log('Dry run: nothing written. Run it with --rebuild --apply to write.'); process.exit(0); }
    await write(`${TEMPORADA}/${period}`, 'PUT', temporada, t);
    for (const c of cambios) {
      const w = { [`records/${UAD_PUNTOS}/${period}/${c.jid}`]: { s: c.s, ms: 0, k: claveOrden(c.s, 0), at: Date.now(), n: c.n, ...(c.co ? { co: c.co } : {}), u: c.u, r: c.r, ...(c.i ? { i: c.i } : {}) } };
      for (const n of c.faltaP) w[`unoAlDia/${c.jid}/${n}/p`] = true;
      await write('', 'PATCH', w, t);
    }
    console.log(`Rewritten: ${cambios.length} players.`);
    process.exit(0);
  }
  const filas = [];
  for (const [jid, hist] of Object.entries(todos || {})) {
    if (!/^[a-z0-9]{8}$/.test(jid)) continue;
    const m = mesDe(hist, month, tabla?.[jid] || null, { gifts: giftsOf(jid) });
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
