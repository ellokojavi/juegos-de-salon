// La Copa's standalone games in every offered language (D-199): each one's lobby and started
// game (Tango adds its full board and its clash), in each language, against Spanish. A new one in
// SUELTOS joins on its own. Usage: node tools/e2e/cup-games/languages.mjs <output-folder>
// With --part <folder> it checks only that game (queens, tango…): GitHub runs one per job, in
// parallel, because running them all in a row was the slowest script in CI.
import { output } from '../output.mjs';
import { checkLanguages } from '../languages-common.mjs';
import { SUELTOS } from '../../../public/assets/js/games.js';
import { IDIOMAS } from '../../../public/assets/js/i18n.js';
import { LOCALES } from '../../../public/cup/rules.js';

const OUT = output('/tmp/languages-cup-games');
// What the registry says about each one (name and tagline) is also shown in the lobby
const REGISTRY = Object.fromEntries(IDIOMAS.map(l => [l, Object.fromEntries(SUELTOS.map(m => [m.id, { name: m.name[l], tagline: m.tagline[l] }]))]));

const part = process.argv.includes('--part') ? process.argv[process.argv.indexOf('--part') + 1] : null;
if (part && !SUELTOS.some(m => m.slug === part)) throw new Error(`--part ${part}: not a standalone game (${SUELTOS.map(m => m.slug).join(', ')})`);

let failures = 0;
for (const [i, { id, slug }] of SUELTOS.entries()) {
  if (part && slug !== part) continue;
  failures += await checkLanguages(id, { dicts: [LOCALES, REGISTRY], port: 9470 + i, out: `${OUT}/${slug}` });
}
console.log(failures ? `✗ La Copa games: ${failures} check(s) in red` : `La Copa games: ${part || `all ${SUELTOS.length}`} in every language`);
