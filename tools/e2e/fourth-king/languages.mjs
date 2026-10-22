// Fourth King in every language offered (D-199): each screen in paths.mjs, in each one,
// against Spanish. Usage: node tools/e2e/fourth-king/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/fourth-king/rules.js';

await checkLanguages('cuarto-rey', { dicts: [LOCALES], port: 9467 });
