// Bulls and Cows in every language offered (D-199): each screen in paths.mjs, in each one,
// against Spanish. Usage: node tools/e2e/bulls-and-cows/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/bulls-and-cows/rules.js';

await checkLanguages('toque-y-fama', { dicts: [LOCALES], port: 9464 });
