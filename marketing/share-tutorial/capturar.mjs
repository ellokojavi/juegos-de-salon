// Las pantallas reales del tutorial: la portada y la hoja de compartir abierta (D-253), en español
// y con el ancho de un iPhone (390×844). Anota dónde están el botón de compartir y las dos opciones.
//   node capturar.mjs   → capturas/portada.png, capturas/hoja.png y capturas/puntos.json (y .js)
// Necesita el sitio servido (SITIO, por defecto http://localhost:8765) y Playwright (ver ../promo-video/navegador.mjs).
import { abrir, SITIO } from '../promo-video/navegador.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, 'capturas'); fs.mkdirSync(OUT, { recursive: true });
const b = await abrir();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERROR', e.message));
await p.goto(SITIO + '/');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); localStorage.setItem('juegos-de-salon:instalar:no', '1'); });
await p.goto(SITIO + '/'); await p.waitForTimeout(1500);
// Sin las partículas que flotan: en el video la pantalla queda quieta y no parpadea
await p.addStyleTag({ content: '.bg-sparkles{display:none!important}' });
const centro = async sel => { const r = await (await p.$(sel)).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
const puntos = { compartir: await centro('#btn-compartir-portada') };
await p.screenshot({ path: path.join(OUT, 'portada.png') });
await p.click('#btn-compartir-portada'); await p.waitForTimeout(900);
puntos.invitar = await centro('#btn-invitar-portada');
puntos.video = await centro('#btn-compartir-video');
puntos.hoja = await p.evaluate(() => Math.round(document.getElementById('hoja-compartir').getBoundingClientRect().top));
await p.screenshot({ path: path.join(OUT, 'hoja.png') });
fs.writeFileSync(path.join(OUT, 'puntos.json'), JSON.stringify(puntos));
// tutorial.html se abre como file://, que no puede pedir el JSON: va también como script
fs.writeFileSync(path.join(OUT, 'puntos.js'), `window.PUNTOS = ${JSON.stringify(puntos)};\n`);
console.log('listo', JSON.stringify(puntos));
await b.close();
