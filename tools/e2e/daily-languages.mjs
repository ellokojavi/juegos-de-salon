// Uno al día with its points (D-414) in every offered language: the page (${SITE}/today/), the rules,
// a day's details and the footer, against Spanish (D-199). Usage: node tools/e2e/daily-languages.mjs <output-folder>
import { checkLanguages } from './languages-common.mjs';

await checkLanguages('today', { port: 9498 });
