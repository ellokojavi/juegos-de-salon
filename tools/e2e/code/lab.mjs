// La clave (prototipo del laboratorio, D-270) de punta a punta: el laboratorio la ofrece; la figura
// móvil se arrastra con el puntero de verdad y se encaja sobre la fija; con la orientación mala no
// se abre y con ↻ / ⇋ hasta la buena sí; un código equivocado cuenta, el bueno abre; el link al
// comentario va al final de cada vista y el resultado termina con el formulario. A 320 px y en
// los cuatro idiomas, sin desbordar. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/clave-lab';
const b = await launch({ port: 9394, dir: `${OUT}/p`, out: OUT, width: 320, height: 760 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const centro = sel => ev(`JSON.stringify((()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]})())`).then(JSON.parse);
const clic = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click(); 1`);
const abierta = () => ev(`document.getElementById('escenario').classList.contains('abierta')`);
const teclear = async v => { for (const d of v) await ev(`[...document.querySelectorAll('.keypad button')].find(b=>b.dataset.d==='${d}').click(); 1`); await clic('.keypad .ok'); await sleep(250); };
// Los botones que llevan de una orientación a otra (cada una es su propia inversa)
const PASOS = { R: ['#btn-girar'], H: ['#btn-voltear'], V: ['#btn-girar', '#btn-voltear'] };

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.getElementById('btn-clave')?.getAttribute('href')`) === 'code/', 'el laboratorio ofrece La clave');

for (const lang of ['es', 'en', 'pt', 'de']) {
  await b.go(`${SITIO}/labs/code/`);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); 1`);
  await b.go(`${SITIO}/labs/code/`, 900);
  ok(await ev(`!!document.querySelector('#pie #btn-comentario')`) && await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang}: la portada, con el link al comentario al final`);
  await clic('#btn-empezar'); await sleep(300);
  const { codigo, o } = await ev(`JSON.stringify(window.__clave.P.clave)`).then(JSON.parse);
  ok(!await abierta(), `${lang}: separadas, no se lee nada`);
  if (lang === 'es') await b.shot('1-separadas');
  // Arrastrar la móvil cerca de la fija: se encaja, pero con la orientación mala no se abre
  const [mx, my] = await centro('#figura-movil'), [fx, fy] = await centro('#figura-fija');
  await b.arrastre(mx, my, fx + 8, fy + 10, 10);
  const encajada = await ev(`window.__clave.P.encajada`);
  const [mx2, my2] = await centro('#figura-movil');
  ok(encajada && Math.abs(mx2 - fx) < 2 && Math.abs(my2 - fy) < 2, `${lang}: soltada cerca, se encaja justo encima`);
  ok(!await abierta(), `${lang}: encajada pero sin girar (${o}), todavía no se abre`);
  if (lang === 'es') await b.shot('2-encajada');
  for (const sel of PASOS[o]) { await clic(sel); await sleep(450); }
  ok(await abierta() && /\S/.test(await ev(`document.getElementById('aviso').textContent`)), `${lang}: con la orientación buena se abre y lo dice`);
  if (lang === 'es') await b.shot('3-abierta');
  // Un código equivocado cuenta; el bueno abre
  await teclear(codigo === '0000' ? '1111' : '0000');
  ok(await ev(`window.__clave.P.errores`) === 1, `${lang}: un código equivocado cuenta como intento fallido`);
  ok(await ev(`!!document.querySelector('#pie #btn-comentario')`) && await ev(`document.documentElement.scrollWidth <= innerWidth`), `${lang}: el juego termina con el link al comentario y no desborda`);
  await teclear(codigo);
  const fin = await ev(`JSON.stringify({ c: document.getElementById('codigo')?.textContent, r: document.getElementById('resumen')?.textContent, f: document.querySelector('.resultado')?.lastElementChild?.classList.contains('comentario'), pie: document.getElementById('pie').children.length, s: !!document.getElementById('btn-compartir-resultado') })`).then(JSON.parse);
  ok(fin.c === codigo && /1/.test(fin.r) && fin.f && fin.pie === 0 && fin.s, `${lang}: el código bueno abre (${fin.r}), con compartir y el formulario al final`);
  if (lang === 'es') await b.shot('4-abierto');
}
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ la clave (labs)');
