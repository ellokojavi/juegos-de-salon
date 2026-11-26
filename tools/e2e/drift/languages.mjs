// Drift in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/drift/languages.mjs <output-folder>. Born from tools/generators/new-game.mjs.
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/drift/rules.js';

await checkLanguages('drift', { dicts: [LOCALES] });
