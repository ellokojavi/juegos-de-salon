// Toque y Fama en todos los idiomas que se ofrecen (D-199): cada pantalla de paths.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/bulls-and-cows/languages.mjs <carpeta-salida>
import { revisarIdiomas } from '../languages-common.mjs';
import { LOCALES } from '../../../public/bulls-and-cows/rules.js';

await revisarIdiomas('toque-y-fama', { dicts: [LOCALES], port: 9464 });
