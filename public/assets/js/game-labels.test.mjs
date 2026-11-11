// Every game that sends usage signals is named in the lists inside (the owner, 2026-11-11: the panel's
// activity monitor showed ¡Al toque! as "microgames"). Each `GAME_ID` a game's code declares must resolve
// through gameLabel (games.js) to its emoji and name, from games.js, a lab manifest or LAB_NAMES.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gameLabel, LAB_NAMES } from './games.js';

const PUBLIC = new URL('../../', import.meta.url).pathname;
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const ids = new Set();
for (const f of walk(PUBLIC).filter(f => f.endsWith('.js') && !f.endsWith('.test.mjs'))) {
  for (const [, id] of readFileSync(f, 'utf8').matchAll(/const GAME_ID = '([^']+)'/g)) ids.add(id);
}
assert.ok(ids.size > 10, `found only ${ids.size} GAME_ID declarations`);
for (const id of ids) {
  for (const lang of ['es', 'en', 'pt']) {
    const label = gameLabel(id, lang);
    assert.notEqual(label, id, `${id}: no name in the lists inside; add it to games.js, a lab manifest or LAB_NAMES`);
    assert.match(label, /^\S+ \S/, `${id}: its label "${label}" has no emoji and name`);
  }
}
for (const [id, g] of Object.entries(LAB_NAMES)) for (const lang of ['es', 'en', 'pt']) assert.ok(g.name[lang], `LAB_NAMES.${id} without its ${lang} name`);
console.log(`✓ game labels: ${ids.size} game ids, each with its name in the lists inside`);
