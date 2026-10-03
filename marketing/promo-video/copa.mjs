// La pantalla de La Copa terminada, entera de arriba abajo, para la escena de La Copa.
//   node copa.mjs   → plays/copa-larga.png (la demo «podio» del laboratorio, con el almacén de prueba)
import { abrir, SITIO } from './navegador.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(dir, 'plays'), { recursive: true });
const b = await abrir();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto(SITIO + '/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); });
await p.goto(SITIO + '/copa/?prueba&labs&demo=podio'); await p.waitForTimeout(4000);
await p.screenshot({ path: path.join(dir, 'plays/copa-larga.png'), fullPage: true });
await b.close();
console.log('listo plays/copa-larga.png');
