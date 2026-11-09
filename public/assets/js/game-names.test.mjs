// C-3 (the owner, 2026-11-09, after Aletazo reached production named "Aletazo" in English and
// Portuguese): every game's name is translated. A name the same as Spanish in another language fails
// unless it is listed in SAME_NAME with the reason, and the name a game's own texts show must match
// games.js in every language. Usage: node public/assets/js/game-names.test.mjs
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { ALL_GAMES } from './games.js';

const LANGS = ['es', 'en', 'pt'];
/** id → { lang: why the name stays as in Spanish }. A new entry needs a reason a player would accept. */
const SAME_NAME = {
  generala: { en: 'the dice game\'s own name, with no English one' },
  tango: { en: 'a proper name (the dance)', pt: 'a proper name (the dance)' },
  zip: { en: 'an English word already', pt: 'an English word already' },
  agentes: { pt: 'the same word in Portuguese' },
  stick: { en: 'a Japanese word, the same everywhere', pt: 'a Japanese word, the same everywhere' },
  stack: { en: 'a proper name (the tower)', pt: 'a proper name (the tower)' },
};

const bad = [];
for (const g of ALL_GAMES) {
  for (const l of LANGS) if (!g.name?.[l]?.trim()) bad.push(`${g.id}: no name in ${l}`);
  for (const l of ['en', 'pt']) {
    if (g.name?.[l] === g.name?.es && !SAME_NAME[g.id]?.[l]) bad.push(`${g.id}: «${g.name.es}» is not translated to ${l} (translate it, or list it in SAME_NAME with the reason)`);
  }
}
for (const [id, langs] of Object.entries(SAME_NAME)) {
  const g = ALL_GAMES.find(x => x.id === id);
  for (const l of Object.keys(langs)) if (!g || g.name[l] !== g.name.es) bad.push(`SAME_NAME.${id}.${l} is stale: remove it`);
}

// The name La Copa's texts show for each game is the one games.js has
const dir = new URL('../../cup/games/', import.meta.url);
let checked = 0;
for (const f of readdirSync(dir)) {
  const p = new URL(`${f}/texts.js`, dir);
  if (!existsSync(p)) continue;
  const T = (await import(p)).default;
  const nombre = T.es?.juego?.nombre;
  if (!nombre) continue;
  const g = ALL_GAMES.find(x => x.name?.es === nombre);
  if (!g) continue;
  checked++;
  for (const l of LANGS) if (T[l]?.juego?.nombre !== g.name[l]) bad.push(`cup/games/${f}/texts.js: ${l} name «${T[l]?.juego?.nombre}», games.js has «${g.name[l]}»`);
}
assert.deepEqual(bad, [], bad.join('\n'));
console.log(`✓ game-names: ${ALL_GAMES.length} games named in ${LANGS.length} languages, ${checked} texts.js agree`);
