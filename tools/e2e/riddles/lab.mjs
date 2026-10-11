// Acertijos (prototipo del laboratorio, D-269) de punta a punta: el laboratorio lo ofrece, los
// cinco acertijos se resuelven con el gesto de cada uno —tocar, elegir, arrastrar la pregunta y
// arrastrar la nube, con el puntero de verdad—, la respuesta obvia cuenta como error, la pista
// se anota, el link al comentario está al final de cada vista y el resultado termina con el
// formulario. A 320 px y en los cuatro idiomas, sin desbordar. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/acertijos-lab';
const b = await launch({ port: 9393, dir: `${OUT}/p`, out: OUT, width: 320, height: 700 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const centro = sel => ev(`JSON.stringify((()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]})())`).then(JSON.parse);
const clic = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click(); 1`);
const narrador = () => ev(`document.querySelector('.narrador').textContent`);
const siguiente = async () => { await clic('#btn-siguiente'); await sleep(250); };
const sinDesborde = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const pieAlFinal = () => ev(`!!document.querySelector('#pie #btn-comentario')`);

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.getElementById('btn-acertijos')?.getAttribute('href')`) === 'riddles/', 'el laboratorio ofrece Acertijos');

for (const lang of ['es', 'en', 'pt', 'de']) {
  await b.go(`${SITIO}/labs/riddles/`);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); 1`);
  await b.go(`${SITIO}/labs/riddles/`, 900);
  ok(await ev(`!!document.getElementById('btn-empezar')`) && await pieAlFinal() && await sinDesborde(), `${lang}: la portada, con el link al comentario al final`);
  await clic('#btn-empezar'); await sleep(250);

  // 1. El animal más grande: el ratón dibujado enorme es error; el elefante chiquito, la respuesta
  await clic('.escena .cosa:nth-child(1)'); await sleep(120);
  ok(await ev(`window.__acertijos.P.errores[0]`) === 1, `${lang}: 1 · el dibujo más grande es error`);
  await clic('.escena .cosa:nth-child(2)'); await sleep(150);
  ok(await ev(`!!document.getElementById('btn-siguiente')`) && await pieAlFinal(), `${lang}: 1 · el elefante es la respuesta`);
  if (lang === 'es') await b.shot('1-animal');
  await siguiente();

  // 2. Los cuadrados: con pista, y son cinco
  await clic('#btn-pista'); await sleep(120);
  ok(await ev(`window.__acertijos.P.pistas[1]`) === true && /💡/.test(await narrador()), `${lang}: 2 · la pista se dice y se anota`);
  await clic('[data-n="5"]'); await sleep(150);
  ok(await ev(`!!document.getElementById('btn-siguiente')`), `${lang}: 2 · son cinco cuadrados`);
  await siguiente();

  // 3. La llave: tocar las cosas no sirve; arrastrar la pregunta la destapa
  await clic('.escena .cosa'); await sleep(120);
  const [px, py] = await centro('#pregunta');
  await b.arrastre(px, py, px, py + 260);
  const [kx, ky] = await centro('#llave');
  await b.toque(kx, ky);
  ok(await ev(`!!document.getElementById('btn-siguiente')`), `${lang}: 3 · arrastrar la pregunta destapa la llave`);
  if (lang === 'es') await b.shot('3-llave');
  await siguiente();

  // 4. El sol: tocarlo quema; la nube del borde lo tapa
  await clic('#sol'); await sleep(120);
  ok(await ev(`window.__acertijos.P.errores[3]`) === 1, `${lang}: 4 · tocar el sol es error`);
  const [sx, sy] = await centro('#sol');
  const borde = await ev(`Math.round(document.getElementById('escena').getBoundingClientRect().right) - 20`);
  const [, ny] = await centro('#nube');
  const [nx] = await centro('#nube');
  await b.arrastre(borde, ny, sx - (nx - borde), sy + 0, 10);
  ok(await ev(`!!document.getElementById('btn-siguiente')`), `${lang}: 4 · la nube tapa el sol`);
  if (lang === 'es') await b.shot('4-sol');
  await siguiente();

  // 5. El kilo: pesan lo mismo
  await clic('[data-op="b"]'); await sleep(120);
  await clic('[data-op="c"]'); await sleep(150);
  ok(await ev(`!!document.getElementById('btn-siguiente')`) && await sinDesborde(), `${lang}: 5 · pesan lo mismo`);
  await siguiente();

  // El resultado: el resumen, la tarjeta, compartir y el formulario al final de todo
  const fin = await ev(`JSON.stringify({ r: document.getElementById('resumen')?.textContent, t: document.querySelector('.tarjeta')?.textContent, c: !!document.getElementById('btn-compartir-resultado'), f: document.querySelector('.resultado')?.lastElementChild?.classList.contains('comentario'), pie: document.getElementById('pie').children.length })`).then(JSON.parse);
  ok(fin.t === '🟥🟨🟥🟥🟥' && /4/.test(fin.r) && fin.c && fin.f && fin.pie === 0, `${lang}: el resultado (${fin.r} ${fin.t}), con el formulario al final y sin el link de abajo`);
  if (lang === 'es') await b.shot('5-resultado');
}
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ acertijos (labs)');
