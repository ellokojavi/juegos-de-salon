// Today's version: the first entry of CHANGELOG.md (`## 0.98.1 — 2026-10-04`) bumped by the
// pending entries in changelog/, in the order they reached main (D-300, changelog.mjs). Since
// D-205 the pages in public/ do not carry it in git; set-version.py stamps it at publish time.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** X.Y.Z of a CHANGELOG text, or null if it has no entry. */
export const versionOf = text => (/^## (\d+\.\d+\.\d+)\b/m.exec(text) || [, null])[1];

/** The versions of all the entries, top to bottom. */
export const versions = text => [...text.matchAll(/^## (\d+\.\d+\.\d+)\b/gm)].map(m => m[1]);

/** The entries that are not lower than the one above: `[[above, below]]`. Empty if in order. */
export function outOfOrder(text) {
  const n = v => v.split('.').map(Number), lower = (a, b) => { const [x, y] = [n(a), n(b)]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; };
  const vs = versions(text), res = [];
  for (let i = 1; i < vs.length; i++) if (!lower(vs[i], vs[i - 1])) res.push([vs[i - 1], vs[i]]);
  return res;
}

export { todayVersion } from './changelog.mjs';
