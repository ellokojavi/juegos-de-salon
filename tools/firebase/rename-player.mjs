#!/usr/bin/env node
/**
 * Renames a rankings player (D-513), for an offensive name that slipped past the sign-up list or
 * was there before it. The rules require every table row to carry the player's name
 * (`records/<t>/<p>/<jid>.n === jugadores/<jid>/n`), so it changes the name, its search key and
 * every row of that player, in one write. The player keeps their scores and their PIN, and signs
 * in with the new name; their phone picks it up the next time it signs in. The month's season
 * view (`uadTemporada`) takes the new name on the next hourly rebuild.
 *
 *   node tools/firebase/rename-player.mjs <jid | current name>                 # lists the matches, touching nothing
 *   node tools/firebase/rename-player.mjs <jid> "New name"                     # shows what it would write
 *   node tools/firebase/rename-player.mjs <jid> "New name" --write             # writes it (as administrator)
 *
 * With no new name given it suggests "Jugador <4 letters of the jid>". Needs the key at
 * ~/.config/juegos-de-salon/firebase-admin.json. Firebase paths keep their Spanish names (D-316).
 */
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { claveNombre, limpiarNombre, esJid } from '../../public/assets/js/records.js';
import { token, read, write, fail } from './firebase-admin.mjs';

/** The writes that rename `jid` from `viejo` to `nuevo`, given the paths of its rows. Pure, for node. */
export function cambiosRenombre(jid, viejo, nuevo, filas) {
  const c = {
    [`jugadores/${jid}/n`]: nuevo,
    [`jugadorNombres/${claveNombre(nuevo)}/${jid}`]: true,
  };
  if (claveNombre(viejo) !== claveNombre(nuevo)) c[`jugadorNombres/${claveNombre(viejo)}/${jid}`] = null;
  for (const f of filas) c[`${f}/n`] = nuevo;
  return c;
}

/** Keys of a node without its contents (REST `shallow`). */
async function hijos(path, t) {
  const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json?shallow=true&access_token=${encodeURIComponent(t)}`);
  if (!res.ok) fail(`Could not list ${path}/ (HTTP ${res.status})`);
  return Object.keys((await res.json()) || {});
}

async function main() {
  const [quien, nombre, ...resto] = process.argv.slice(2);
  if (!quien) fail('Usage: node tools/firebase/rename-player.mjs <jid | current name> ["New name"] [--write]');
  const t = await token();

  if (!esJid(quien)) {
    const jids = Object.keys((await read(`jugadorNombres/${claveNombre(quien)}`, t)) || {});
    if (!jids.length) fail(`No player is named "${quien}".`);
    for (const j of jids) console.log(`${j}  ${await read(`jugadores/${j}/n`, t)}`);
    console.log('\nRun it again with the jid and the new name.');
    return;
  }
  const jid = quien;
  const viejo = await read(`jugadores/${jid}/n`, t);
  if (viejo == null) fail(`There is no player ${jid}.`);
  const nuevo = limpiarNombre(nombre && nombre !== '--write' ? nombre : `Jugador ${jid.slice(0, 4).toUpperCase()}`);

  const filas = [];
  for (const tb of await hijos('records', t)) {
    for (const p of await hijos(`records/${tb}`, t)) {
      if ((await read(`records/${tb}/${p}/${jid}/n`, t)) != null) filas.push(`records/${tb}/${p}/${jid}`);
    }
  }
  const c = cambiosRenombre(jid, viejo, nuevo, filas);
  console.log(`${jid}: "${viejo}" → "${nuevo}", ${filas.length} table rows.`);
  if (![nombre, ...resto].includes('--write')) { console.log('Dry run: add --write to write it.'); return; }
  await write('', 'PATCH', c, t);
  console.log('✓ renamed');
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
