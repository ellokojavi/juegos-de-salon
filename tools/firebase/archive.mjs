#!/usr/bin/env node
/**
 * Moves what nobody reads any more out of the live tree, into `archive/` in the same database
 * (D-476, issue #848 step 3). The archive mirrors the live path: `torneos/ABCD` goes to
 * `archive/torneos/ABCD`, `records/t/d20300` to `archive/records/t/d20300`, so putting one back is
 * moving it back. `archive/` is admin-only (no player and no panel reads it).
 *
 * What moves, and when (every reader was checked, see D-476):
 * - **Finished Cups** (`torneos/<code>` with its `torneoIntentos`, `torneoSeats` and `torneoKeys`)
 *   ended more than CUP_DAYS ago whose podium is already saved in `torneoPodios/` (or that never
 *   get one: lab Cups, Cups with fewer than two players). The panel's longest view (a year, and the
 *   year before it to compare, D-348) never reaches them, the medal table reads `torneoPodios/`.
 * - **Old stats days** (`stats/<env>/days/<day>`) older than STATS_DAYS, for the same panel reason.
 *   Their named parts (`rooms/`, `live/`) are not copied: D-472 deletes them at 24 months anyway.
 * - **Old daily tables** (`records/<t>/d<day>`) and **day starts** (`unoAlDiaInicio/<jid>/<day>`)
 *   older than DAILY_DAYS: the app only ever reads today's.
 * Uno al día's history (`unoAlDia/`) is not touched here (step 4 of #848 shards it by month).
 *
 *   node tools/firebase/archive.mjs           dry run: what it would move
 *   node tools/firebase/archive.mjs --apply   moves it: copies, reads the copy back, compares, and
 *                                             only then deletes the live node
 *
 * The `firebase-archive` workflow runs it every night. Running it twice moves nothing new.
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { dayOf } from '../../public/assets/js/transport/cleanup.js';
import { missingPodiums } from './rankings-history.mjs';
import { NAMED } from './stats-retention.mjs';

export const ARCHIVE = 'archive';
/** The panel reads back to today − 729 (a year and the year before it) and two days of margin. */
export const CUP_DAYS = 733;
export const STATS_DAYS = 733;
/** Daily tables and day starts: the app reads only today's; a month is kept to look at. */
export const DAILY_DAYS = 35;
/** The nodes that belong to a Cup besides `torneos/<code>`. */
export const CUP_SIDE = ['torneoIntentos', 'torneoSeats', 'torneoKeys'];
const DAY_MS = 86400000;

/** The Cups to archive, from the old ones (`torneos` read up to the cutoff) and the saved podiums. */
export function cupsToArchive(cups, podiums = {}, now = Date.now()) {
  const cutoff = now - CUP_DAYS * DAY_MS;
  return Object.entries(cups || {})
    .filter(([code, L]) => Number(L?.meta?.end) > 0 && L.meta.end < cutoff
      && !Object.keys(missingPodiums({ [code]: L }, podiums, now)).length)
    .map(([code]) => code)
    .sort();
}

/** The stats days to archive, from a shallow view `{ env: { day: true } }`. */
export function statsToArchive(view, now = Date.now()) {
  const cutoff = dayOf(now) - STATS_DAYS;
  const out = [];
  for (const [env, days] of Object.entries(view || {})) {
    for (const day of Object.keys(days || {})) if (/^\d{5}$/.test(day) && Number(day) < cutoff) out.push(`stats/${env}/days/${day}`);
  }
  return out.sort();
}

/** The daily tables to archive, from a view `{ table: { period: true } }`: only `d<day>` periods. */
export function tablesToArchive(view, now = Date.now()) {
  const cutoff = dayOf(now) - DAILY_DAYS;
  const out = [];
  for (const [t, periods] of Object.entries(view || {})) {
    for (const p of Object.keys(periods || {})) if (/^d\d{5}$/.test(p) && Number(p.slice(1)) < cutoff) out.push(`records/${t}/${p}`);
  }
  return out.sort();
}

/** The day starts to archive, from `unoAlDiaInicio` as it is: one path per old day. */
export function startsToArchive(starts, now = Date.now()) {
  const cutoff = dayOf(now) - DAILY_DAYS;
  const out = [];
  for (const [jid, days] of Object.entries(starts || {})) {
    for (const d of Object.keys(days || {})) if (/^\d{5}$/.test(d) && Number(d) < cutoff) out.push(`unoAlDiaInicio/${jid}/${d}`);
  }
  return out.sort();
}

/** What a stats day keeps in the archive: everything but its names (D-472). */
export const withoutNames = day => Object.fromEntries(Object.entries(day || {}).filter(([k]) => !NAMED.includes(k)));

/** JSON with sorted keys, to compare what was written with what reads back. */
export const canonical = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x);

/**
 * Moves one live node: writes `value` to `archive/<path>`, reads it back and compares, and only if
 * it matches deletes `path`. `io` is { read(path), write(path, method, body) }. Returns 'moved',
 * 'gone' (nothing live any more) or throws if the copy does not match (nothing is deleted then).
 */
export async function move(path, value, io) {
  if (value === null || value === undefined) return 'gone';
  await io.write(`${ARCHIVE}/${path}`, 'PUT', value);
  const back = await io.read(`${ARCHIVE}/${path}`);
  if (canonical(back) !== canonical(value)) throw new Error(`The copy of ${path} does not match: nothing deleted`);
  await io.write(path, 'DELETE');
  return 'moved';
}

async function main() {
  const apply = process.argv.includes('--apply');
  const { token, read, write, fail } = await import('./firebase-admin.mjs');
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  const t = await token();
  const get = async (path, query = {}) => {
    const q = new URLSearchParams({ ...query, access_token: t });
    const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json?${q}`);
    if (!res.ok) fail(`Could not read ${path}/ (HTTP ${res.status})`);
    return (await res.json()) || {};
  };
  const shallow = path => get(path, { shallow: 'true' });
  const io = { read: p => read(p, t), write: (p, m, b) => write(p, m, b, t) };
  const now = Date.now();

  // Only the Cups that ended before the cutoff are downloaded (`.indexOn` meta/end, D-473)
  const oldCups = await get('torneos', { orderBy: '"meta/end"', endAt: String(now - CUP_DAYS * DAY_MS) });
  const codes = cupsToArchive(oldCups, await shallow('torneoPodios'), now);
  const statsView = {};
  for (const env of Object.keys(await shallow('stats'))) statsView[env] = await shallow(`stats/${env}/days`);
  const stats = statsToArchive(statsView, now);
  const tablesView = {};
  for (const tb of Object.keys(await shallow('records'))) tablesView[tb] = await shallow(`records/${tb}`);
  const tables = tablesToArchive(tablesView, now);
  const startsAll = await get('unoAlDiaInicio');
  const starts = startsToArchive(startsAll, now);

  const say = (label, list) => console.log(`${label}: ${list.length}${apply ? '' : ' (dry run)'}${list.length ? `\n  ${list.slice(0, 20).join('\n  ')}${list.length > 20 ? `\n  … and ${list.length - 20} more` : ''}` : ''}`);
  say(`Finished Cups ended more than ${CUP_DAYS} days ago, podium saved`, codes);
  say(`Stats days older than ${STATS_DAYS} days`, stats);
  say(`Daily tables older than ${DAILY_DAYS} days`, tables);
  say(`Day starts older than ${DAILY_DAYS} days`, starts);
  if (!apply) { console.log('\nNothing was moved. To move it: node tools/firebase/archive.mjs --apply'); return; }

  let moved = 0;
  for (const code of codes) {
    for (const root of CUP_SIDE) moved += (await move(`${root}/${code}`, await io.read(`${root}/${code}`), io)) === 'moved';
    moved += (await move(`torneos/${code}`, oldCups[code], io)) === 'moved';
  }
  for (const p of stats) {
    const day = await io.read(p);
    // The names are not copied (D-472): they go with the live day
    const kept = withoutNames(day);
    if (Object.keys(kept).length) moved += (await move(p, kept, io)) === 'moved';
    else if (day) { await io.write(p, 'DELETE'); moved++; }
  }
  for (const p of tables) moved += (await move(p, await io.read(p), io)) === 'moved';
  for (const p of starts) {
    const [, jid, d] = p.split('/');
    moved += (await move(p, startsAll[jid][d], io)) === 'moved';
  }
  console.log(`\n✓ Moved ${moved} node(s) to ${ARCHIVE}/.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
