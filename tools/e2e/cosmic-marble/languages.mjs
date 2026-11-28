// Cosmic Marble in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/cosmic-marble/languages.mjs <output-folder>. Born from tools/generators/new-game.mjs.
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES, COURSE_TEXTS } from '../../../public/labs/cosmic-marble/rules.js';

await checkLanguages('cosmic-marble', { dicts: [LOCALES, COURSE_TEXTS] });
