// Hangman in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/hangman/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/hangman/rules.js';

await checkLanguages('ahorcado', { dicts: [LOCALES], port: 9461 });
