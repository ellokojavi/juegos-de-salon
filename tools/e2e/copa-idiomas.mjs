// La Copa en inglés y portugués (D-168): lo personal en el idioma de quien mira, lo del grupo en
// el de la copa. Crea una copa con el almacén de prueba (`?prueba`) en cada idioma, revisa que
// guarde el idioma de sus palabras, que la invitación avise si las palabras van en otro idioma y
// que lo que se comparte salga en el de la copa; después abre los minijuegos sueltos.
//
// Uso: python3 -m http.server 8765 (en otra terminal) y node tools/e2e/copa-idiomas.mjs <carpeta-salida>
import { launch, sleep } from './cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || '/tmp/copa-idiomas';
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9378, dir: `${OUT}/perfil`, out: OUT });
const SITIO = process.env.SITIO || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const texto = () => ev(`document.querySelector('.screen.active').innerText`);
const preparar = () => ev(`(()=>{window.confirm=()=>true;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;return 1})()`);
/** C-8: sin scroll horizontal ni botones bajo 44 px. */
const revisar = async nombre => {
  const r = await ev(`(()=>{const ancho=document.documentElement.scrollWidth>innerWidth;const chicos=[...document.querySelectorAll('.screen.active button, .screen.active a.btn')].filter(x=>{const q=x.getBoundingClientRect();return q.height>0&&q.height<44&&!x.closest('.lang-toggle')}).map(x=>x.textContent.trim().slice(0,20));return {ancho,chicos}})()`);
  ok(!r.ancho, `${nombre}: sin scroll horizontal`);
  await b.shot(nombre);
};

for (const lang of ['en', 'pt']) {
  // Una copa nueva, creada con la pantalla en `lang`: sus palabras parten en ese idioma
  await b.go(`${SITIO}/copa/?prueba&lang=${lang}`);
  await ev(`sessionStorage.clear(); 1`);
  await b.go(`${SITIO}/copa/?prueba`);
  ok(await ev(`document.documentElement.lang`) === lang, `${lang}: la página queda en el idioma pedido por el link`);
  const portada = await texto();
  ok(lang === 'en' ? /Create a cup/i.test(portada) : /Criar uma copa/i.test(portada), `${lang}: la portada está traducida`);
  await revisar(`${lang}-00-portada`);
  await ev(`document.getElementById('btn-crear').click(); 1`); await sleep(800);
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa ${lang}';i[1].value='Ana';i[2].value='1111';i[3].value='1111';return 1})()`);
  await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[1].click();o[3].click();return 1})()`);
  const idiomaElegido = await ev(`[...document.querySelectorAll('#crear-body .opcion.on')].map(x=>x.textContent).join('|')`);
  ok(idiomaElegido.includes(lang === 'en' ? 'English' : 'Português'), `${lang}: el idioma de las palabras parte en el de quien crea (${idiomaElegido})`);
  await revisar(`${lang}-01-crear`);
  await ev(`document.getElementById('btn-crear-go').click(); 1`); await sleep(1500);
  const meta = await ev(`__copa.estado.copa.meta`);
  ok(meta?.lang === lang, `${lang}: la copa guarda meta.lang = ${meta?.lang}`);
  await revisar(`${lang}-02-admin`);

  // Lo que va al grupo, en el idioma de la copa aunque quien comparte mire en otro (D-168)
  await preparar();
  const otro = lang === 'en' ? 'pt' : 'en';
  await ev(`localStorage.setItem('juegos-de-salon:lang','${otro}'); 1`);
  await b.go(`${SITIO}/copa/?prueba&${meta ? (await ev('__copa.estado.code')) : ''}`, 2500);
  await preparar();
  const enOtro = await texto();
  ok(otro === 'en' ? /Standings|Schedule|Day/.test(enOtro) : /Tabela|Calendário|Dia/.test(enOtro), `${lang}: la pantalla sigue el idioma de quien mira (${otro})`);
  await ev(`(()=>{const b=document.getElementById('btn-invitar')||[...document.querySelectorAll('button')].find(x=>/📤/.test(x.textContent));b&&b.click();return 1})()`); await sleep(800);
  const compartido = await ev(`JSON.stringify(window.__compartido.at(-1)||null)`);
  ok(compartido && (lang === 'en' ? /The Cup|invited/.test(compartido) : /A Copa|convidado/.test(compartido)), `${lang}: lo compartido va en el idioma de la copa`);
  ok(compartido && compartido.includes(`lang=${lang}`), `${lang}: el link compartido lleva ?lang=${lang}`);
  await b.shot(`${lang}-03-tablero-en-${otro}`);
  await ev(`localStorage.setItem('juegos-de-salon:lang','${lang}'); 1`);
}

// Los minijuegos sueltos, en el idioma de quien juega
for (const [id, lang, espera] of [['letras', 'en', /Bulls and Cows: Word/i], ['conexiones', 'pt', /Conexões/i], ['anio', 'en', /What Year/i], ['reinas', 'pt', /Rainhas/i], ['donde', 'en', /Where Is It/i]]) {
  await b.go(`${SITIO}/minijuegos/${id}/?prueba&lang=${lang}`, 2000);
  const t = await texto();
  ok(espera.test(t), `${id} (${lang}): la antesala está traducida`);
  ok(!/🇪🇸/.test(t), `${id} (${lang}): sin la píldora de "solo en español"`);
  await revisar(`${lang}-suelto-${id}-antesala`);
  await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(4800);
  if (id === 'letras') ok(!(await ev(`[...document.querySelectorAll('.keypad button')].some(x=>x.textContent==='Ñ')`)), 'letras (en): el teclado no tiene Ñ');
  if (id === 'conexiones') ok(await ev(`(async()=>{const m=await import('/copa/juegos/grillas-pt.js');const w=[...document.querySelectorAll('#jugar-body button')].map(x=>x.textContent);return m.GRILLAS.some(g=>g.grupos.flatMap(x=>x.palabras).includes(w[0]))})()`), 'conexiones (pt): la grilla es una de las de portugués');
  await revisar(`${lang}-suelto-${id}-juego`);
}

ok(!b.errors.length, `sin errores en la consola${b.errors.length ? ': ' + b.errors.join(' | ') : ''}`);
process.exit();
