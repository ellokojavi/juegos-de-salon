// La Copa en cada idioma que se ofrece fuera del español (D-170, D-199): lo personal en el idioma
// de quien mira, lo del grupo en el de la copa. Crea una copa con el almacén de prueba (`?prueba`)
// en cada idioma, revisa que guarde el idioma de sus palabras, que la invitación avise si las
// palabras van en otro idioma y que lo que se comparte salga en el de la copa; después abre los
// juegos sueltos. Los textos esperados salen de los diccionarios: un idioma nuevo entra solo.
//
// Uso: python3 -m http.server 8765 (en otra terminal) y node tools/e2e/cup/idiomas.mjs <carpeta-salida>
import { launch, sleep } from '../cdp.mjs';
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { mkdirSync } from 'node:fs';
import { LANGS } from '../../../public/assets/js/i18n.js';
import { SUELTOS } from '../../../public/assets/js/games.js';
import { LOCALES } from '../../../public/cup/rules.js';

const OUT = process.argv[2] || '/tmp/copa-idiomas';
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9378, dir: `${OUT}/perfil`, out: OUT });
const SITIO = process.env.SITIO || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const texto = () => ev(`document.querySelector('.screen.active').innerText`);
const preparar = () => ev(`(()=>{window.confirm=()=>true;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;return 1})()`);
/** C-8: sin scroll horizontal ni botones bajo 44 px (en los tableros, las casillas no cuentan). */
const revisar = async (nombre, { botones = true } = {}) => {
  const r = await ev(`(()=>{const ancho=document.documentElement.scrollWidth>innerWidth;const chicos=[...document.querySelectorAll('.screen.active button, .screen.active a.btn')].filter(x=>{const q=x.getBoundingClientRect();return q.width&&q.height&&q.height<43.5&&!x.closest('.sol-grid')}).map(x=>x.textContent.trim().slice(0,20));return {ancho,chicos}})()`);
  ok(!r.ancho, `${nombre}: sin scroll horizontal`);
  if (botones) ok(!r.chicos.length, `${nombre}: botones de 44 px o más ${r.chicos.length ? JSON.stringify(r.chicos) : ''}`);
  await b.shot(nombre);
};

const OTROS = LANGS.filter(l => l !== 'es');
const sinEmoji = t => t.replace(/^\P{L}+/u, '').trim();
const tiene = (texto, buscado) => texto.toLowerCase().includes(buscado.toLowerCase());

for (const [i, lang] of OTROS.entries()) {
  const T = LOCALES[lang];
  // Una copa nueva, creada con la pantalla en `lang`: sus palabras parten en ese idioma
  await b.go(`${SITIO}/cup/?prueba&lang=${lang}`);
  await ev(`sessionStorage.clear(); 1`);
  await b.go(`${SITIO}/cup/?prueba`);
  // Con varios Chrome a la vez (o el primero de un runner) la portada tarda más que la espera fija
  for (let k = 0; k < 40 && !(await ev(`!!document.getElementById('btn-crear')?.offsetParent && document.documentElement.lang === '${lang}'`)); k++) await sleep(250);
  ok(await ev(`document.documentElement.lang`) === lang, `${lang}: la página queda en el idioma pedido por el link`);
  const portada = await texto();
  ok(tiene(portada, sinEmoji(T.create)), `${lang}: la portada está traducida (${sinEmoji(T.create)})`);
  await revisar(`${lang}-00-portada`);
  await ev(`document.getElementById('btn-crear').click(); 1`); await sleep(800);
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa ${lang}';i[1].value='Ana';i[2].value='1111';i[3].value='1111';return 1})()`);
  await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[1].click();o[3].click();return 1})()`);
  const idiomaElegido = await ev(`[...document.querySelectorAll('#crear-body .opcion.on')].map(x=>x.textContent).join('|')`);
  ok(tiene(idiomaElegido, T.langNames[lang]), `${lang}: el idioma de las palabras parte en el de quien crea (${idiomaElegido})`);
  await revisar(`${lang}-01-crear`);
  await ev(`document.getElementById('btn-crear-go').click(); 1`); await sleep(1500);
  const meta = await ev(`__copa.estado.copa.meta`);
  ok(meta?.lang === lang, `${lang}: la copa guarda meta.lang = ${meta?.lang}`);
  await revisar(`${lang}-02-admin`);

  // Lo que va al grupo, en el idioma de la copa aunque quien comparte mire en otro (D-170)
  await preparar();
  // Quien mira lo hace en otro idioma: el siguiente de la lista
  const otro = OTROS[(i + 1) % OTROS.length];
  await ev(`localStorage.setItem('juegos-de-salon:lang','${otro}'); 1`);
  await b.go(`${SITIO}/cup/?prueba&${meta ? (await ev('__copa.estado.code')) : ''}`, 2500);
  await preparar();
  const enOtro = await texto();
  ok(tiene(enOtro, LOCALES[otro].tableTitle) || tiene(enOtro, LOCALES[otro].calendarTitle), `${lang}: la pantalla sigue el idioma de quien mira (${otro})`);
  await ev(`(()=>{const b=document.getElementById('btn-invitar')||[...document.querySelectorAll('button')].find(x=>/📤/.test(x.textContent));b&&b.click();return 1})()`); await sleep(800);
  const compartido = await ev(`JSON.stringify(window.__compartido.at(-1)||null)`);
  ok(compartido && (compartido.includes(T.title) || compartido.includes(T.ctxInvite)), `${lang}: lo compartido va en el idioma de la copa`);
  ok(compartido && compartido.includes(`lang=${lang}`), `${lang}: el link compartido lleva ?lang=${lang}`);
  await b.shot(`${lang}-03-tablero-en-${otro}`);
  await ev(`localStorage.setItem('juegos-de-salon:lang','${lang}'); 1`);
}

// Los juegos sueltos, en el idioma de quien juega, en todos los idiomas. El id es el de siempre
// ('letras'); la carpeta, en inglés ('word'): D-192. Todas sus pantallas en todos los idiomas las
// recorre cup-games/idiomas.mjs; aquí, lo que depende del contenido de cada idioma.
const SUELTO = Object.fromEntries(SUELTOS.map(m => [m.id, m]));
for (const id of ['letras', 'conexiones', 'anio', 'reinas', 'donde']) for (const lang of OTROS) {
  await b.go(`${SITIO}/${SUELTO[id].slug}/?prueba&lang=${lang}`, 2000);
  const t = await texto();
  ok(tiene(t, SUELTO[id].name[lang]), `${id} (${lang}): la antesala está traducida (${SUELTO[id].name[lang]})`);
  ok(!/🇪🇸/.test(t), `${id} (${lang}): sin la píldora de "solo en español"`);
  await revisar(`${lang}-suelto-${id}-antesala`);
  await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(4800);
  if (id === 'letras') ok(!(await ev(`[...document.querySelectorAll('.keypad button')].some(x=>x.textContent==='Ñ')`)), `letras (${lang}): el teclado no tiene Ñ`);
  if (id === 'conexiones') ok(await ev(`(async()=>{const m=await import('/cup/games/connections/grillas-${lang}.js');const w=[...document.querySelectorAll('#jugar-body button')].map(x=>x.textContent);return m.GRILLAS.some(g=>g.grupos.flatMap(x=>x.palabras).includes(w[0]))})()`), `conexiones (${lang}): la grilla es una de las de su idioma`);
  await revisar(`${lang}-suelto-${id}-juego`, { botones: false });
}

// Las pantallas de caminos.mjs en todos los idiomas, contra el español (D-199)
b.close();
await revisarIdiomas('copa', { dicts: [LOCALES], port: 9379, consulta: '?prueba', salida: `${OUT}/pantallas` });

ok(!b.errors.length, `sin errores en la consola${b.errors.length ? ': ' + b.errors.join(' | ') : ''}`);
process.exit();
