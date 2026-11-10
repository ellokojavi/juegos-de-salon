/**
 * 🔑 Lab keys in the panel (D-345): who has a key to /labs/, whether they use it, and giving or
 * taking one away without a terminal. The keys live in Firebase, `labsLlaves/<SHA-256 of the key>`
 * = label; only the fingerprint is kept, so a new key's link is shown once and never again.
 * Use comes from `labsUso/<flag>/<day>/k/<first 8 hex>` (lab-usage.js, D-528): the last day a key
 * turned a lab flag on. Same rules as `tools/agents/labs-key.mjs`, which stays for the terminal.
 * Pure (Web Crypto aside), for node: `node public/panel/lab-keys.test.mjs`.
 */
export const SITE = 'https://juegosdesalon.cl';
const LABEL = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,23}$/u;
const DAY_MS = 24 * 3600 * 1000;
/** Used within this many days: 🟢 active; before that 🟡 quiet; no use recorded: ⚪ never used. */
export const ACTIVE_DAYS = 14;

/** Why a label cannot be used, or '' when it can: letters, digits, space, . _ -; up to 24; not taken. */
export function labelProblem(label, taken = []) {
  if (!LABEL.test(label)) return 'Use letters, digits, space, . _ or -, up to 24 characters, starting with a letter or digit.';
  const same = taken.find(t => t.toLowerCase() === label.toLowerCase());
  return same ? `"${same}" already has a key: remove it first to give them a new one.` : '';
}

/** A key: the label as prefix (so each person recognizes their link) and 20 random characters. */
export function newKey(label, random = n => crypto.getRandomValues(new Uint32Array(n))) {
  const A = 'abcdefghijkmnpqrstuvwxyz23456789';
  const tail = [...random(20)].map(x => A[x % A.length]).join('');
  const prefix = label.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '_');
  return prefix ? `${prefix}-${tail}` : tail;
}

export const linkOf = key => `${SITE}/labs/?key=${encodeURIComponent(key)}`;

export async function fingerprint(key) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** The last day (days since epoch) each 8-hex key hash used a flag, and how many flags: { hash: { day, flags } }. */
export function usageByKey(labsUso = {}) {
  const out = {};
  for (const [flag, days] of Object.entries(labsUso || {})) {
    for (const [day, rec] of Object.entries(days || {})) {
      for (const h of Object.keys(rec?.k || {})) {
        const u = out[h] ||= { day: -1, flags: new Set() };
        u.day = Math.max(u.day, Number(day));
        u.flags.add(flag);
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([h, u]) => [h, { day: u.day, flags: u.flags.size }]));
}

/** One row per key, most recently used first, never-used at the end: { fingerprint, label, lastDay, flags, status }. */
export function keyRows(labsLlaves = {}, labsUso = {}, now = Date.now()) {
  const use = usageByKey(labsUso), today = Math.floor(now / DAY_MS);
  return Object.entries(labsLlaves || {})
    .filter(([, label]) => typeof label === 'string')
    .map(([fp, label]) => {
      const u = use[fp.slice(0, 8)];
      const status = !u ? 'never' : today - u.day <= ACTIVE_DAYS ? 'active' : 'quiet';
      return { fingerprint: fp, label, lastDay: u ? u.day : null, flags: u ? u.flags : 0, status };
    })
    .sort((a, b) => (b.lastDay ?? -1) - (a.lastDay ?? -1) || a.label.localeCompare(b.label));
}
