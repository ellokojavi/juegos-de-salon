// Liar's Dice in every language offered (D-199): each screen in paths.mjs, in each one,
// against Spanish. Usage: node tools/e2e/liars-dice/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/liars-dice/rules.js';

await checkLanguages('dudo', { dicts: [LOCALES], port: 9462 });
