// Generala in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/generala/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/generala/rules.js';

await checkLanguages('generala', { dicts: [LOCALES], port: 9468 });
