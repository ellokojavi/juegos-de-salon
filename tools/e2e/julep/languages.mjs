// Julepe in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/julep/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/julep/rules.js';

await checkLanguages('julepe', { dicts: [LOCALES], port: 9466 });
