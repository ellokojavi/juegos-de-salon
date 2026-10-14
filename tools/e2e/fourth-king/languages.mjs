// El Cuarto Rey en todos los idiomas que se ofrecen (D-199): cada pantalla de paths.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/fourth-king/languages.mjs <carpeta-salida>
import { revisarIdiomas } from '../languages-common.mjs';
import { LOCALES } from '../../../public/fourth-king/rules.js';

await revisarIdiomas('cuarto-rey', { dicts: [LOCALES], port: 9467 });
