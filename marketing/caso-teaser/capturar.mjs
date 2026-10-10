// Las pantallas reales del teaser de El caso: el prototipo del laboratorio (/labs/case/?c=PRUEBA)
// a 390×844 (un iPhone), en español. Cuatro momentos: el caso recién abierto, una persona elegida,
// el sello al marcarla bien y su pista tocada. Anota dónde caen los toques.
//   node capturar.mjs   → capturas/*.png y capturas/puntos.js
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
const URL = `${SITIO}/labs/case/?c=PRUEBA`;
await p.goto(URL);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); });
await p.goto(URL); await p.waitForTimeout(2200);   // las cartas terminan de darse vuelta
// Sin las partículas que flotan: en el video la pantalla queda quieta y no parpadea
await p.addStyleTag({ content: '.bg-sparkles{display:none!important}' });
// La pantalla queda quieta en el mismo lugar en las cinco fotos: sin que un toque la desplace
const Y = 150;
await p.evaluate(() => { Element.prototype.scrollIntoView = () => {}; });
const quieta = () => p.evaluate(y => scrollTo(0, y), Y);
const centro = sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; }, sel);
const tocar = sel => p.evaluate(s => document.querySelector(s).click(), sel);
const foto = async n => { await quieta(); await p.screenshot({ path: path.join(OUT, `${n}.png`) }); };
// Alguien que ya se puede deducir, para marcarlo bien
const [i, v] = await p.evaluate(async () => {
  const { deducibles } = await import('/labs/case/engine.js');
  const e = window.__caso.estado(); const d = deducibles(e.pistas, e.x); const k = Object.keys(d)[0];
  return [Number(k), d[k]];
});
await quieta();
const puntos = { persona: await centro(`.persona[data-i="${i}"]`) };
await foto('1-inicio');
await tocar(`.persona[data-i="${i}"]`); await p.waitForTimeout(500); await quieta();
const boton = v ? '#btn-criminal' : '#btn-inocente';
puntos.boton = await centro(boton);
await foto('2-elegida');
await tocar(boton); await p.waitForTimeout(260);
await foto('3-sello');
await p.waitForTimeout(900); await quieta();
puntos.pista = await centro('.pista.ultima .texto');
await foto('4-bien');
await tocar('.pista.ultima .texto'); await p.waitForTimeout(500);
await foto('5-pista');
puntos.valor = v;
// teaser.html se abre como file://, que no puede pedir un JSON: va como script
fs.writeFileSync(path.join(OUT, 'puntos.js'), `window.PUNTOS = ${JSON.stringify(puntos)};\n`);
console.log('listo', JSON.stringify(puntos));
await b.close();
