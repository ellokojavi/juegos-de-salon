// Dudo en todos los idiomas que se ofrecen (D-199): cada pantalla de caminos.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/liars-dice/idiomas.mjs <carpeta-salida>
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { LOCALES } from '../../../public/liars-dice/rules.js';

await revisarIdiomas('dudo', { dicts: [LOCALES], port: 9462 });
