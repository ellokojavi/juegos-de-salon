// El Ahorcado en todos los idiomas que se ofrecen (D-199): cada pantalla de caminos.mjs, en cada
// uno, contra el español. Uso: node tools/e2e/hangman/idiomas.mjs <carpeta-salida>
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { LOCALES } from '../../../public/hangman/rules.js';

await revisarIdiomas('ahorcado', { dicts: [LOCALES], port: 9461 });
