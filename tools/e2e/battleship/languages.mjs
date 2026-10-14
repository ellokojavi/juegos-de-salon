// Batalla Naval en todos los idiomas que se ofrecen (D-199): cada pantalla de paths.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/battleship/languages.mjs <carpeta-salida>
import { revisarIdiomas } from '../languages-common.mjs';
import { LOCALES } from '../../../public/battleship/rules.js';

await revisarIdiomas('batalla-naval', { dicts: [LOCALES], port: 9463 });
