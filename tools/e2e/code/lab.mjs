// La clave (prototipo del laboratorio, D-270) de punta a punta, con sus 4 cartas: el laboratorio
// la ofrece; tocar una carta la pone sobre la base y la elige; ↻ y ⇋ la orientan y ✕ la saca; un
// trazo encima de otro se marca en rojo y se dice; con todas derechas se lee el código (y no
// antes) sin choques; uno equivocado cuenta y el bueno
// abre; el link al comentario va al final de cada vista y el resultado termina con el formulario.
// A 320 px y en los cuatro idiomas, sin desbordar. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/clave-lab';
const b = await launch({ port: 9394, dir: `${OUT}/p`, out: OUT, width: 320, height: 760 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const clic = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click(); 1`);
const teclear = async v => { for (const d of v) await ev(`[...document.querySelectorAll('.keypad button')].find(b=>b.dataset.d==='${d}').click(); 1`); await clic('.keypad .ok'); await sleep(250); };
// Lo que se lee ahora en la base, con el motor y lo que hizo el jugador
const lectura = () => ev(`(async()=>{const m=await import('/labs/code/engine.js');const P=window.__clave.P;return m.juntos(P.clave,P.g,P.puestas).map(m.leer).map(x=>x??'·').join('')})()`);
const PASOS = { I: [], R: ['#btn-girar'], H: ['#btn-voltear'], V: ['#btn-girar', '#btn-voltear'] };
const sinDesborde = () => ev(`document.documentElement.scrollWidth <= innerWidth`);

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.getElementById('btn-clave')?.getAttribute('href')`) === 'code/', 'el laboratorio ofrece La clave');

for (const lang of ['es', 'en', 'pt', 'de']) {
  const n = 4;
  await b.go(`${SITIO}/labs/code/`);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); 1`);
  await b.go(`${SITIO}/labs/code/`, 900);
  ok(await ev(`!!document.querySelector('#pie #btn-comentario')`) && await sinDesborde() && !await ev(`!!document.querySelector('[id^="btn-empezar-"]')`), `${lang}: la portada, una sola partida de 4 cartas, con el link al comentario al final`);
  await clic('#btn-empezar'); await sleep(300);
  const { codigo, cartas } = await ev(`JSON.stringify(window.__clave.P.clave)`).then(JSON.parse);
  ok(cartas.length === n && await ev(`document.querySelectorAll('.carta').length`) === n, `${lang}: ${n} cartas en la bandeja`);
  ok(await ev(`[...document.querySelectorAll('.controles button')].every(x => x.disabled)`), `${lang}: sin carta elegida, ↻ ⇋ ✕ no hacen nada`);
  // Tocar una carta la pone y la elige; ✕ la saca
  await clic('.carta[data-k="0"]'); await sleep(120);
  ok(await ev(`window.__clave.P.puestas[0] && window.__clave.P.elegida === 0 && document.querySelector('.carta[data-k="0"]').classList.contains('elegida')`), `${lang}: tocar una carta la pone y la elige`);
  await clic('#btn-quitar'); await sleep(120);
  ok(!await ev(`window.__clave.P.puestas[0]`), `${lang}: ✕ la saca`);
  // Ponerlas todas, sin orientar (ninguna viene derecha): no se lee el código
  for (let k = 0; k < n; k++) { await clic(`.carta[data-k="${k}"]`); await sleep(40); }
  ok(await lectura() !== codigo, `${lang}: puestas pero sin orientar, no se lee el código (${await lectura()})`);
  // Una combinación con trazos encima de otros: se marcan en rojo y se dice
  const choque = await ev(`(async()=>{const m=await import('/labs/code/engine.js');const c=window.__clave.P.clave;const O=m.ORIENTACIONES;for(const a of O)for(const b of O)for(const d of O)for(const e of O){const g=[a,b,d,e];const ch=m.choques(c,g);if(ch.length)return JSON.stringify({g,n:ch.length})}return 'null'})()`).then(JSON.parse);
  if (choque) {
    const orientar = async g => { for (let k = 0; k < n; k++) { const ahora = await ev(`window.__clave.P.g[${k}]`); const falta = await ev(`(async()=>{const m=await import('/labs/code/engine.js');return m.componer('${ahora}','${g[k]}')})()`); await clic(`.carta[data-k="${k}"]`); for (const sel of PASOS[falta]) { await clic(sel); await sleep(30); } } };
    await orientar(choque.g); await sleep(200);
    ok(await ev(`document.querySelectorAll('#choques line.choque').length`) === choque.n && /⚠️/.test(await ev(`document.getElementById('aviso').textContent`)), `${lang}: ${choque.n} trazo(s) encima de otros, en rojo y avisado`);
    if (lang === 'es') await b.shot('1-choque');
  }
  // Orientar cada una a la buena
  for (let k = 0; k < n; k++) {
    const falta = await ev(`(async()=>{const m=await import('/labs/code/engine.js');return m.componer(window.__clave.P.g[${k}], window.__clave.P.clave.cartas[${k}].o)})()`);
    await clic(`.carta[data-k="${k}"]`); await sleep(40);
    for (const sel of PASOS[falta]) { await clic(sel); await sleep(40); }
  }
  await sleep(500);
  ok(await lectura() === codigo && await ev(`document.querySelectorAll('#choques line').length`) === 0, `${lang}: con todas derechas se lee ${codigo}, sin choques`);
  ok(await sinDesborde() && await ev(`!!document.querySelector('#pie #btn-comentario')`), `${lang}: el juego no desborda y termina con el link al comentario`);
  if (lang === 'es') await b.shot('2-derechas');
  // Un código equivocado cuenta; el bueno abre
  await teclear(codigo === '0000' ? '1111' : '0000');
  ok(await ev(`window.__clave.P.errores`) === 1, `${lang}: un código equivocado cuenta como intento fallido`);
  await teclear(codigo);
  const fin = await ev(`JSON.stringify({ c: document.getElementById('codigo')?.textContent, r: document.getElementById('resumen')?.textContent, f: document.querySelector('.resultado')?.lastElementChild?.classList.contains('comentario'), pie: document.getElementById('pie').children.length, s: !!document.getElementById('btn-compartir-resultado') })`).then(JSON.parse);
  ok(fin.c === codigo && fin.f && fin.pie === 0 && fin.s, `${lang}: el código bueno abre (${fin.r}), con compartir y el formulario al final`);
  if (lang === 'es') await b.shot('3-abierto');
}
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ la clave (labs)');
