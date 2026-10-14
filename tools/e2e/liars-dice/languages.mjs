// Dudo en todos los idiomas que se ofrecen (D-199): cada pantalla de paths.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/liars-dice/languages.mjs <carpeta-salida>
import { revisarIdiomas } from '../languages-common.mjs';
import { LOCALES } from '../../../public/liars-dice/rules.js';

await revisarIdiomas('dudo', { dicts: [LOCALES], port: 9462 });
