// Generala en todos los idiomas que se ofrecen (D-199): cada pantalla de paths.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/generala/languages.mjs <carpeta-salida>
import { revisarIdiomas } from '../languages-common.mjs';
import { LOCALES } from '../../../public/generala/rules.js';

await revisarIdiomas('generala', { dicts: [LOCALES], port: 9468 });
