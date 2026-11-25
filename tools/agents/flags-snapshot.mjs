#!/usr/bin/env node
/**
 * The flags the end-to-end tests see (D-578). The site reads `flags/` live from Firebase, and the owner
 * flips a flag to *all* from /labs/ with no PR (D-498); when the tests read it live too, that flip
 * turned every open PR red at once (install-invite on 2026-11-17: five PRs). So `launch()` in cdp.mjs
 * answers the page's request for flags.json with `flags-snapshot.json`, the states as of the last
 * refresh, and a flip reaches the tests only through a PR that refreshes this file, where a test it
 * breaks is fixed once.
 *
 *   node tools/agents/flags-snapshot.mjs check     # says whether Firebase differs from the snapshot (exit 3 if it does)
 *   node tools/agents/flags-snapshot.mjs refresh   # rewrites the snapshot from Firebase (then a PR)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FILE = fileURLToPath(new URL('../e2e/flags-snapshot.json', import.meta.url));
const REMOTE = 'https://juegos-de-salon-default-rtdb.firebaseio.com/flags.json';

/** Only each flag's state, sorted, so the file changes only when a state does. */
export const states = flags => Object.fromEntries(Object.keys(flags || {}).sort().map(id => [id, { state: flags[id]?.state || 'lab' }]));
export const snapshot = () => JSON.parse(readFileSync(FILE, 'utf8'));
/**
 * The flags the tests hold at a state whatever Firebase says (`tools/e2e/flags-held.json`): a lab treatment that
 * replaces a whole page (the home page as carousels), or adds to a screen every game shares (Uno al día's line
 * under a result, `solo-result-today-card`), would otherwise be on in every script that opens it, since
 * localhost holds the lab key. Its own script turns it on with `browser.flags()`. A row leaves
 * this file in the PR that removes the flag's gate.
 *
 * A flag Firebase does not know yet is 'lab', so on in every script; four red end-to-end runs on four PRs
 * (#1662, #1777, #1812, #1829) were a new flag on in scripts that never asked for it. So every flag of
 * FLAGS has a known state for the tests: in the snapshot, or a row here, at 'off' (only its own script
 * turns it on) or at 'lab' (every script may see it, a choice made when the flag is written).
 */
export const HELD = fileURLToPath(new URL('../e2e/flags-held.json', import.meta.url));
export const held = () => JSON.parse(readFileSync(HELD, 'utf8'));
/** The flags with no state the tests know: in `ids` (FLAGS), not in the snapshot nor held. */
export const undecided = (ids, snap, hold) => ids.filter(id => !snap[id] && !hold[id]);
/** The rows held at 'lab' whose flag the snapshot now knows: the snapshot says what players see, the row goes. */
export const staleLab = (snap, hold) => Object.keys(hold).filter(id => hold[id]?.state === 'lab' && snap[id]);
/** What changed: [{ id, from, to }]. */
export const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(id => a[id]?.state !== b[id]?.state).map(id => ({ id, from: a[id]?.state ?? '-', to: b[id]?.state ?? '-' }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  const live = states(await (await fetch(REMOTE)).json());
  const changes = diff(snapshot(), live);
  if (cmd === 'refresh') {
    writeFileSync(FILE, JSON.stringify(live, null, 2) + '\n');
    console.log(changes.length ? changes.map(c => `${c.id}: ${c.from} → ${c.to}`).join('\n') : 'unchanged');
    // A flag held at 'lab' only until Firebase knew it: now the snapshot says its state
    const hold = held(), stale = staleLab(live, hold);
    if (stale.length) { for (const id of stale) delete hold[id]; writeFileSync(HELD, JSON.stringify(hold, null, 2) + '\n'); console.log(`flags-held.json: dropped the 'lab' rows of ${stale.join(', ')}`); }
  }
  else if (cmd === 'check') { if (!changes.length) console.log('the snapshot matches Firebase'); else { for (const c of changes) console.log(`${c.id}: ${c.from} → ${c.to}`); process.exit(3); } }
  else { console.error('Usage: flags-snapshot.mjs check | refresh'); process.exit(2); }
}
