#!/usr/bin/env node
/**
 * Names in the usage statistics are kept 24 months (D-472, amends D-463). The only parts of
 * `stats/<env>/days/<day>` that hold a name a player typed are `rooms/` (`players`, `end.name`) and
 * `live/` (`name`) and `seen/` (`name`, D-503); see public/assets/js/transport/stats.js. Once a day is older than
 * STATS_NAME_MONTHS, this deletes those subtrees and leaves the day's nameless counts
 * (games, languages, hours, pages…) as they are. /privacy/ states the same period
 * (`public/privacy/texts.test.mjs` checks it).
 *
 *   node tools/firebase/stats-retention.mjs           dry run: what it would delete
 *   node tools/firebase/stats-retention.mjs --apply   deletes it
 *
 * The `uad-rebuild` workflow runs it every night. Running it twice deletes nothing new.
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { dayOf } from '../../public/assets/js/transport/cleanup.js';

export const STATS_NAME_MONTHS = 24;
/** The parts of a stats day that carry names. */
export const NAMED = ['rooms', 'live', 'seen'];
/** The cutoff in days: 24 months of 365/12 days, rounded (730). */
export const RETENTION_DAYS = Math.round(STATS_NAME_MONTHS * 365 / 12);

/**
 * The paths to delete, from a shallow view `{ env: { day: { rooms: true, live: true, ... } } }`:
 * only the named parts of days strictly older than the cutoff.
 */
export function toDelete(view, now = Date.now()) {
  const cutoff = dayOf(now) - RETENTION_DAYS;
  const out = [];
  for (const [env, days] of Object.entries(view || {})) {
    for (const [day, parts] of Object.entries(days || {})) {
      if (!/^\d{5}$/.test(day) || Number(day) >= cutoff) continue;
      for (const k of NAMED) if (parts?.[k]) out.push(`stats/${env}/days/${day}/${k}`);
    }
  }
  return out;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const { token, write, fail } = await import('./firebase-admin.mjs');
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  const t = await token();
  const shallow = async path => {
    const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json?shallow=true&access_token=${encodeURIComponent(t)}`);
    if (!res.ok) fail(`Could not read ${path}/ (HTTP ${res.status})`);
    return (await res.json()) || {};
  };
  const cutoff = dayOf(Date.now()) - RETENTION_DAYS;
  const view = {};
  for (const env of Object.keys(await shallow('stats'))) {
    view[env] = {};
    // Only the old days need their parts listed
    for (const day of Object.keys(await shallow(`stats/${env}/days`))) {
      if (/^\d{5}$/.test(day) && Number(day) < cutoff) view[env][day] = await shallow(`stats/${env}/days/${day}`);
    }
  }
  const paths = toDelete(view);
  console.log(`Stats names older than ${STATS_NAME_MONTHS} months (before day ${cutoff}): ${paths.length} part(s) to delete${apply ? '' : ' (dry run)'}`);
  for (const p of paths) {
    console.log(`  ${p}`);
    if (apply) await write(p, 'DELETE', undefined, t);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
