// Generala en todos los idiomas que se ofrecen (D-199): cada pantalla de caminos.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/generala/idiomas.mjs <carpeta-salida>
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { LOCALES } from '../../../public/generala/rules.js';

await revisarIdiomas('generala', { dicts: [LOCALES], port: 9468 });
