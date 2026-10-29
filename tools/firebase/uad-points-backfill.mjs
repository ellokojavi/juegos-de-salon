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
 * saved (the markers a phone uploads, `{ c: true }`, D-415), plus +10 for each invited friend that
 * accepted in that month, and rewrites the row when it differs (and gives `p` to any played day of
 * the month and any acceptance that lacks it, so a phone outside the lab never adds them again). It
 * fixes a total a phone or this backfill added with a streak the server didn't know. Running it
 * twice writes nothing new.
 *
 * It is the single writer of Uno al día's totals for phones in the night's totals lab (D-500), so it
 * also rewrites the week's sum (`records/uno-al-dia/s<yyyy-ww>`, each week with a day in the month)
 * when it differs and raises the best streak (`records/uno-al-dia-racha/siempre`), never lowering it:
 * a phone's own days played without signing in may have made it longer.
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
 * Only days whose result reached the server near their date earn points (`onTime`, D-465), the
 * same window the rules give a day's `p`; a day uploaded later still keeps the streak.
 * The next month starts at 0 on its own: its table is another period (`s2026-11`).
 *
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { fechaDeNum, numDia, semanaDe } from '../../public/assets/js/uno-al-dia.js';
import { walk, bonusFor, onTime } from '../../public/assets/js/daily-points.js';
import { UAD_PUNTOS, UNO_AL_DIA, UAD_RACHA, SIEMPRE, MS_MAX, RACHA_TOPE, bonoRacha, claveOrden, esPais } from '../../public/assets/js/records.js';

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
    if (hist[n]?.p || !onTime(n, hist[n])) continue;
    const r = Math.max(1, Math.min(RACHA_TOPE, d.streak, fila ? fila.r + 1 : RACHA_TOPE));
    fila = { s: (fila?.s || 0) + d.score + bonoRacha(r), r, u: String(n) };
    nuevos.push({ n, date: d.date, score: d.score, r, s: fila.s });
  }
  return nuevos.length ? { nuevos, fila } : null;
}

/** Whether a played day reached the server on time for points (D-465): one definition, in the browser's module. */
export { onTime };

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
  const dias = walkServer(hist, month, gifts).days.filter(d => d.played && d.date.startsWith(month) && onTime(numDia(d.date), hist[numDia(d.date)]));
  if (!dias.length) return null;
  const last = dias.at(-1);
  const s = dias.reduce((a, d) => a + d.score + bonusFor(Math.min(RACHA_TOPE, d.streak)), 0) + invites * 10;
  return { s, r: Math.max(1, Math.min(RACHA_TOPE, last.streak)), u: String(numDia(last.date)), faltaP: dias.map(d => numDia(d.date)).filter(n => !hist[n]?.p) };
}

/** The weeks (`s<yyyy-ww>`, Uno al día's, D-230) with a day in `month`. */
export const semanasDelMes = month => [...new Set(Array.from({ length: Number(lastDay(month).slice(8)) }, (_, i) => semanaDe(`${month}-${String(i + 1).padStart(2, '0')}`)))];

/**
 * A player's week sums (D-500), as a phone adds them: each day played on time with points (`s` > 0)
 * adds its score and time to its week. `{ <week>: { s, ms, u } }` for the weeks in `semanas`, `u` the
 * week's last day counted.
 */
export function semanasDe(hist, semanas) {
  const out = {};
  for (const [k, x] of Object.entries(hist || {}).sort((a, b) => a[0] - b[0])) {
    if (!/^[0-9]{5}$/.test(k) || !x?.j || !(x.s > 0) || !onTime(Number(k), x)) continue;
    const w = semanaDe(fechaDeNum(Number(k)));
    if (!semanas.includes(w)) continue;
    const a = out[w] || { s: 0, ms: 0 };
    out[w] = { s: a.s + x.s, ms: Math.min(MS_MAX, a.ms + (x.ms || 0)), u: k };
  }
  return out;
}

/** A player's best streak as the server's walk sees it up to `month`'s end (D-500). */
export const mejorRachaDe = (hist, month, gifts = []) => walkServer(hist, month, gifts).best;

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
    const dias = walkServer(p.hist, month, p.gifts).days.filter(d => d.played && d.date.startsWith(month) && onTime(numDia(d.date), p.hist[numDia(d.date)]));
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

import { seasonTop } from '../../public/assets/js/daily-recap.js';
import { UAD_INDICE } from '../../public/assets/js/uad-days.js';
import { readHistory } from './uad-index.mjs';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write, fail } = await import('./firebase-admin.mjs');
  const apply = process.argv.includes('--apply'), rebuild = process.argv.includes('--rebuild');
  const i = process.argv.indexOf('--month');
  const month = i > 0 ? process.argv[i + 1] : '2026-10';
  if (!/^[0-9]{4}-[0-9]{2}$/.test(month || '')) fail('--month takes yyyy-mm');
  const period = `s${month}`;
  const t = await token();
  const [tabla, jugadores, invitados, indexed] = await Promise.all([read(`records/${UAD_PUNTOS}/${period}`, t), read('jugadores', t), read('invitados', t), read(UAD_INDICE, t)]);
  // With the index by day complete (D-475), the rebuild reads only the players who played from the
  // month's first day on, or had a friend accept in it, each one's whole history (their streak walks
  // back past the month); before it, the whole history, as before
  let todos;
  if (rebuild && indexed) {
    const jids = new Set([...Object.keys(await readHistory(t, numDia(`${month}-01`))),
      ...Object.entries(invitados || {}).filter(([, porUid]) => Object.values(porUid || {}).some(x => Number.isInteger(x?.d) && fechaDeNum(x.d).startsWith(month))).map(([jid]) => jid)]);
    todos = Object.fromEntries(await Promise.all([...jids].filter(j => /^[a-z0-9]{8}$/.test(j)).map(async j => [j, (await read(`unoAlDia/${j}`, t)) || {}])));
  } else todos = await read('unoAlDia', t);
  // The dates a friend accepted (the 🧊 they gave), and how many of them already gave +10 this month
  const giftsOf = jid => Object.values(invitados?.[jid] || {}).filter(x => Number.isInteger(x?.d)).map(x => fechaDeNum(x.d));
  // Every friend who accepted in the month counts (D-500): phones in the lab no longer mark them `p`
  const aceptadosDe = jid => Object.entries(invitados?.[jid] || {}).filter(([, x]) => Number.isInteger(x?.d) && fechaDeNum(x.d).startsWith(month));
  const invitesOf = jid => aceptadosDe(jid).length;
  if (rebuild) {
    const cambios = [];
    for (const [jid, hist] of Object.entries(todos || {})) {
      if (!/^[a-z0-9]{8}$/.test(jid) || !jugadores?.[jid]?.n) continue;
      const m = rehacerMes(hist, month, { gifts: giftsOf(jid), invites: invitesOf(jid) });
      const antes = tabla?.[jid] || null;
      const sinP = aceptadosDe(jid).filter(([, x]) => !x.p).map(([uid]) => uid);
      if (!m || (antes && antes.s === m.s && antes.r === m.r && antes.u === m.u && !m.faltaP.length && !sinP.length)) continue;
      cambios.push({ jid, n: jugadores[jid].n, co: esPais(jugadores[jid].co) ? jugadores[jid].co : null, antes: antes?.s ?? null, i: antes?.i, sinP, ...m });
    }
    // The week's sums and the best streak (D-500): the rows that differ from the history's
    const semanas = semanasDelMes(month);
    const [porSemana, rachas] = await Promise.all([Promise.all(semanas.map(w => read(`records/${UNO_AL_DIA}/${w}`, t))), read(`records/${UAD_RACHA}/${SIEMPRE}`, t)]);
    const otras = {};
    const quien = jid => ({ n: jugadores[jid].n, ...(esPais(jugadores[jid].co) ? { co: jugadores[jid].co } : {}) });
    for (const [jid, hist] of Object.entries(todos || {})) {
      if (!/^[a-z0-9]{8}$/.test(jid) || !jugadores?.[jid]?.n) continue;
      for (const [w, x] of Object.entries(semanasDe(hist, semanas))) {
        const antes = porSemana[semanas.indexOf(w)]?.[jid];
        if (antes && antes.s === x.s && antes.ms === x.ms) continue;
        console.log(`  ${jugadores[jid].n} (${jid})  week ${w}: ${antes?.s ?? '—'} → ${x.s}`);
        otras[`records/${UNO_AL_DIA}/${w}/${jid}`] = { s: x.s, ms: x.ms, k: claveOrden(x.s, x.ms), at: Date.now(), ...quien(jid), u: x.u };
      }
      const mejor = mejorRachaDe(hist, month, giftsOf(jid));
      if (mejor > (rachas?.[jid]?.s || 0)) console.log(`  ${jugadores[jid].n} (${jid})  best streak: ${rachas?.[jid]?.s ?? '—'} → ${mejor}`);
      if (mejor > (rachas?.[jid]?.s || 0)) otras[`records/${UAD_RACHA}/${SIEMPRE}/${jid}`] = { s: mejor, ms: 0, k: claveOrden(mejor, 0), at: Date.now(), ...quien(jid) };
    }
    console.log(`Weeks ${semanas.join(', ')} and best streaks: ${Object.keys(otras).length} rows to rewrite`);
    console.log(`${period} rebuild: ${Object.keys(todos || {}).length} players with a history · ${cambios.length} to rewrite`);
    for (const c of cambios) console.log(`  ${c.n} (${c.jid})  ${c.antes ?? '—'} → ${c.s} pts · streak ${c.r}${c.faltaP.length ? ` · ${c.faltaP.length} days get p` : ''}`);
    // The season's places by week (D-424), every night: the home page's recap reads them once the month is over
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
    const datesOf = jid => aceptadosDe(jid).map(([, x]) => fechaDeNum(x.d));
    const temporada = temporadaDe(Object.entries(todos || {}).filter(([jid]) => /^[a-z0-9]{8}$/.test(jid) && jugadores?.[jid]?.n)
      .map(([jid, hist]) => ({ jid, n: jugadores[jid].n, co: esPais(jugadores[jid].co) ? jugadores[jid].co : null, hist, gifts: giftsOf(jid), invites: datesOf(jid) })), month, hoy);
    const podio = Object.entries(temporada.j).filter(([, x]) => x.l.at(-1) && x.l.at(-1) <= 3).sort((a, b) => a[1].l.at(-1) - b[1].l.at(-1));
    console.log(`${TEMPORADA}/${period}: ${Object.keys(temporada.j).length} players, places on ${temporada.c.join(', ')} · ${podio.map(([, x]) => `#${x.l.at(-1)} ${x.n} ${x.s}`).join(' · ') || 'nobody yet'}`);
    if (!apply) { console.log('Dry run: nothing written. Run it with --rebuild --apply to write.'); process.exit(0); }
    // With its `top` (D-473): the home page's recap reads that and the player's own row, not the whole table
    await write(`${TEMPORADA}/${period}`, 'PUT', { ...temporada, top: seasonTop(temporada) }, t);
    for (const c of cambios) {
      const w = { [`records/${UAD_PUNTOS}/${period}/${c.jid}`]: { s: c.s, ms: 0, k: claveOrden(c.s, 0), at: Date.now(), n: c.n, ...(c.co ? { co: c.co } : {}), u: c.u, r: c.r, ...(c.i ? { i: c.i } : {}) } };
      for (const n of c.faltaP) w[`unoAlDia/${c.jid}/${n}/p`] = true;
      for (const uid of c.sinP) w[`invitados/${c.jid}/${uid}/p`] = true;
      await write('', 'PATCH', w, t);
    }
    if (Object.keys(otras).length) await write('', 'PATCH', otras, t);
    console.log(`Rewritten: ${cambios.length} players, ${Object.keys(otras).length} week or streak rows.`);
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
