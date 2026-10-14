// Battleship in every language offered (D-199): each screen in paths.mjs, in each one,
// against Spanish. Usage: node tools/e2e/battleship/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/battleship/rules.js';

await checkLanguages('batalla-naval', { dicts: [LOCALES], port: 9463 });
