// The site an e2e script tests must be the tree the script runs from (pattern stale-port-server):
// twice a usability round found its port held by a leftover http.server from a removed worktree,
// and tournament.mjs failed against an old copy of the site as if the code were broken.
// launch() calls sameTree() once per process when SITE points at this machine.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PROBE = 'assets/js/games.js';

export const isLocal = site => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(String(site || ''));

/** Resolves when `site` serves this tree's public/; rejects naming the port when it serves another one. */
export async function sameTree(site, root = ROOT) {
  const base = String(site).replace(/\/$/, '');
  let served;
  try {
    const r = await fetch(`${base}/${PROBE}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    served = await r.text();
  } catch (e) {
    throw new Error(`SITE ${base}: nothing serves ${PROBE} there (${e.message}); serve this tree: python3 -m http.server <port> -d ${root}public`);
  }
  const mine = readFileSync(`${root}public/${PROBE}`, 'utf8');
  if (served !== mine) throw new Error(`SITE ${base} serves another tree, not ${root} (a leftover server from another worktree?). Find it with lsof -nP -iTCP:${new URL(base).port || 80} -sTCP:LISTEN, stop that PID, and serve this tree`);
}

let checked = null;
/** Once per process, only for an explicit local SITE (CI and the default port serve the checkout itself). */
export function checkSiteOnce(site = process.env.SITE) {
  if (!isLocal(site)) return Promise.resolve();
  return (checked ??= sameTree(site));
}
