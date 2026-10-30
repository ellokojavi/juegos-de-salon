// Every splash campaign in every offered language (D-199, D-355): each one as `?splash=<id>` shows
// it, against Spanish. Usage: node tools/e2e/splash/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { CAMPAIGNS } from '../../../public/assets/js/splash.js';

// The campaigns' texts as a dictionary per language, so nothing is left in Spanish
const LANGS = ['es', 'en', 'pt'];
const texts = Object.fromEntries(LANGS.map(l => [l, Object.fromEntries(Object.entries(CAMPAIGNS).flatMap(([id, c]) =>
  ['kicker', 'title', 'lead'].filter(k => c[k]?.[l]).map(k => [`${id}.${k}`, c[k][l]])))]));

await checkLanguages('splash', { dicts: [texts], port: 9497 });
