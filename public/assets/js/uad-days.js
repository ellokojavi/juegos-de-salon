/**
 * Uno al día's index by day (D-475, #848 step 4). The history stays keyed by player
 * (`unoAlDia/<jid>/<n>`: the player's own page reads only theirs, and the rules check against it),
 * and every played day is also written, in the same update, to `unoAlDiaDias/<n>/<jid>` = its score
 * `s`. A reader that needs everyone (the panel, the nightly rebuild, the weekly report, the ideas
 * agent) asks for a range of days (`orderBy $key`, `startAt`) instead of the whole history.
 *
 * A day a 🧊 saved (the marker `{ c: true }`, D-415) is not in the index: it was not played.
 * `unoAlDiaIndice` = `{ desde, at }` is written by `tools/firebase/uad-index.mjs --apply` once the
 * old history is copied and checked; until it exists, readers read the whole history as before, so
 * nothing changes between the merge and the migration.
 */
export const UAD_DIAS = 'unoAlDiaDias';
export const UAD_INDICE = 'unoAlDiaIndice';

/** The index entries of a history `{ jid: { n: { s, c? } } }`: `{ n: { jid: s } }`, played days only. */
export function indiceDe(historia = {}) {
  const out = {};
  for (const [jid, h] of Object.entries(historia || {})) {
    if (!/^[a-z0-9]{8}$/.test(jid)) continue;
    for (const [n, x] of Object.entries(h || {})) {
      if (!/^[0-9]{5}$/.test(n) || x?.c || typeof x?.s !== 'number') continue;
      (out[n] ||= {})[jid] = x.s;
    }
  }
  return out;
}

/** The index read back as the history's shape `{ jid: { n: { s } } }`, which the panel's sums take. */
export function historiaDeDias(dias = {}) {
  const out = {};
  for (const [n, porJid] of Object.entries(dias || {})) {
    if (!/^[0-9]{5}$/.test(n)) continue;
    for (const [jid, s] of Object.entries(porJid || {})) (out[jid] ||= {})[n] = { s };
  }
  return out;
}
