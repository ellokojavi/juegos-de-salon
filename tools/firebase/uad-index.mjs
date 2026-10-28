#!/usr/bin/env node
/**
 * Uno al día's index by day (D-475, #848 step 4): copies every played day of the history
 * (`unoAlDia/<jid>/<n>`) to `unoAlDiaDias/<n>/<jid>` = its score, checks the copy, and only then
 * marks the index complete (`unoAlDiaIndice` = `{ desde, at }`), which is what makes the readers
 * (the panel, the nightly rebuild, the weekly report, the ideas agent) switch to it. Phones write
 * both from the merge on; this fills in what was played before, and what an old cached page wrote
 * only to the history. The history is not deleted: it stays the player's own record, the one the
 * game reads and the rules check against.
 *
 *   node tools/firebase/uad-index.mjs            dry run: what is missing from the index
 *   node tools/firebase/uad-index.mjs --apply    copies it, re-reads, checks, then marks it complete
 *
 * Running it twice writes nothing new. Needs the service account key (firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { UAD_DIAS, UAD_INDICE, indiceDe, historiaDeDias } from '../../public/assets/js/uad-days.js';

/** The entries of `want` (`{ n: { jid: s } }`) that `have` lacks or holds with another score. */
export function faltantes(want = {}, have = {}) {
  const out = {};
  for (const [n, porJid] of Object.entries(want)) for (const [jid, s] of Object.entries(porJid)) {
    if (have?.[n]?.[jid] !== s) out[`${n}/${jid}`] = s;
  }
  return out;
}

/**
 * Everyone's Uno al día history from day `from` on, as `{ jid: { n: { s } } }` (days played only),
 * for the readers that need everyone. With the index complete it reads only those days; before the
 * migration, the whole history (and then the days before `from` are left out, so both give the same).
 */
export async function readHistory(t, from, { databaseURL } = {}) {
  const url = databaseURL || (await import('../../public/assets/js/firebase-config.js')).firebaseConfig.databaseURL;
  const get = async (ruta, q = {}) => {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(q).map(([k, v]) => [k, JSON.stringify(v)])), access_token: t });
    const res = await fetch(`${url}/${ruta}.json?${qs}`);
    if (!res.ok) throw new Error(`Could not read ${ruta}/ (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
    return res.json();
  };
  if (await get(UAD_INDICE)) return historiaDeDias((await get(UAD_DIAS, { orderBy: '$key', startAt: String(from) })) || {});
  return desde(historiaDeDias(indiceDe((await get('unoAlDia')) || {})), from);
}

/** A history `{ jid: { n: x } }` from day `from` on. */
export function desde(historia, from) {
  const out = {};
  for (const [jid, h] of Object.entries(historia || {})) {
    const dias = Object.fromEntries(Object.entries(h || {}).filter(([n]) => Number(n) >= from));
    if (Object.keys(dias).length) out[jid] = dias;
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write, fail } = await import('./firebase-admin.mjs');
  const apply = process.argv.includes('--apply');
  const t = await token();
  const [historia, indice, marca] = await Promise.all([read('unoAlDia', t), read(UAD_DIAS, t), read(UAD_INDICE, t)]);
  const want = indiceDe(historia || {});
  const falta = faltantes(want, indice || {});
  const dias = Object.keys(want).map(Number).sort((a, b) => a - b);
  const total = Object.values(want).reduce((a, x) => a + Object.keys(x).length, 0);
  console.log(`History: ${Object.keys(historia || {}).length} players, ${total} days played (${dias.length ? `days ${dias[0]} to ${dias.at(-1)}` : 'none'})`);
  console.log(`Index: ${Object.values(indice || {}).reduce((a, x) => a + Object.keys(x || {}).length, 0)} entries · ${Object.keys(falta).length} missing or different · marked complete: ${marca ? `yes, since day ${marca.desde}` : 'no'}`);
  if (!apply) { console.log('Dry run: nothing written. Run it with --apply to copy, check and mark the index complete.'); process.exit(0); }
  const claves = Object.keys(falta);
  for (let i = 0; i < claves.length; i += 500) {
    await write(UAD_DIAS, 'PATCH', Object.fromEntries(claves.slice(i, i + 500).map(k => [k, falta[k]])), t);
  }
  // Copy, then verify against a fresh read, and only then switch the readers
  const despues = faltantes(want, (await read(UAD_DIAS, t)) || {});
  if (Object.keys(despues).length) fail(`✗ ${Object.keys(despues).length} entries still differ after the copy (e.g. ${Object.keys(despues)[0]}): the index is not marked complete.`);
  await write(UAD_INDICE, 'PUT', { desde: dias[0] ?? 0, at: Date.now() }, t);
  console.log(`✓ Copied ${claves.length} entries, checked all ${total}, and marked the index complete.`);
}
