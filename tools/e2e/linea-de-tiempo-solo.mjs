/**
 * Jugar solo en Línea de Tiempo: la ⏳ Línea Relámpago de La Copa (D-142).
 *
 *   1. la configuración pide solo la temática (las seis, Brasil incluida) y explica cómo se juega
 *   2. diez hitos: uno puesto y nueve en la mano; un error deja la carta en su lugar, en rojo
 *   3. recargar a mitad ofrece retomar, y al retomar vuelve con las mismas jugadas
 *   4. el resultado: puntaje de 0 a 100, aciertos, tiempo, tarjeta, récord por temática, y los
 *      botones del final a la vista en 812 px (C-8)
 *   5. jugar otra vez deja fuera las cartas recién vistas (D-34) y bate el récord
 *   6. una partida guardada del solitario viejo (con `messages`) no se ofrece
 *   7. inglés y portugués
 *
 * Uso: SITIO=http://localhost:87xx PUERTO_CDP=94xx node tools/e2e/linea-de-tiempo-solo.mjs <salida>
 */
import { launch, sleep } from './cdp.mjs';

const OUT = process.argv[2] || '/tmp/ldt-solo';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const CDP = Number(process.env.PUERTO_CDP) || 9456;
const URL = `${SITIO}/linea-de-tiempo/`;
const b = await launch({ port: CDP, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ok = (cond, texto) => console.log(`  ${cond ? '✅' : '❌'} ${texto}`);
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const solo = () => b.evaluate(`JSON.stringify(window.__ldt.solo())`).then(JSON.parse);
const tablero = () => b.evaluate(`JSON.stringify({
  linea: document.querySelectorAll('#solo-juego .line .event').length,
  mano: document.querySelectorAll('#solo-juego .hand .card').length,
  rojas: document.querySelectorAll('#solo-juego .line .event.fallo').length,
  reloj: document.getElementById('solo-cron').textContent,
  estado: document.querySelector('#solo-juego .status').innerText.replace(/\\n/g,' · '),
})`).then(JSON.parse);
const sinScrollLateral = () => b.evaluate(`document.documentElement.scrollWidth <= window.innerWidth`);
/** Las diez cartas de la partida guardada, del mismo motor que las reparte */
const cartasDe = () => b.evaluate(`(async()=>{const L=await import('${SITIO}/copa/juegos/linea.js');const s=JSON.parse(localStorage.getItem('juegos-de-salon:linea-de-tiempo:session'));const p=L.generar(s.codigo,1,{tema:s.tema,excluir:s.skip});return JSON.stringify([p.base.id,...p.mano.map(c=>c.id)])})()`).then(JSON.parse);

/** Juega la primera carta de la mano, bien o mal. El año sale del mismo motor que la reparte. */
async function jugar(bien) {
  const info = await b.evaluate(`(async()=>{
    const L = await import('${SITIO}/copa/juegos/linea.js');
    const s = window.__ldt.solo();
    const p = L.generar(s.codigo, 1, { tema: s.tema, excluir: s.skip });
    const e = L.estado(p, s.jugadas);
    const id = document.querySelector('#solo-juego .hand .card').dataset.card;
    const carta = p.mano.find(c => c.id === id);
    const at = L.huecoCorrecto(e.linea, carta);
    return JSON.stringify({ at, mal: at === 0 ? e.linea.length : 0 });
  })()`).then(JSON.parse);
  await b.evaluate(`document.querySelector('#solo-juego .hand .card').click(); 1`); await sleep(80);
  await b.evaluate(`document.querySelector('#solo-juego .line .slot[data-slot="${bien ? info.at : info.mal}"]').click(); 1`); await sleep(80);
  await click('#btn-colocar'); await sleep(500);
}
const cerrarVeredicto = async () => { await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(350); };
const terminar = async () => {
  for (let g = 0; g < 12 && (await b.evaluate(`document.querySelectorAll('#solo-juego .hand .card').length`)); g++) { await jugar(true); await cerrarVeredicto(); }
  await sleep(300);
};

async function configurar(tema, lang = '') {
  await b.go(URL + (lang ? `?lang=${lang}` : ''), 1200);
  await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho/i.test(m.textContent)).click(); 1`); await sleep(300);
  if (tema) { await b.evaluate(`document.querySelector('.theme-card[data-tema="${tema}"]').click(); 1`); await sleep(100); }
}

await b.go(URL); await b.evaluate(`localStorage.clear(); 1`);

/* 1 · Configuración ----------------------------------------------------------- */
await b.go(URL, 1200);
console.log('modos:', await b.evaluate(`[...document.querySelectorAll('.mode')].map(x=>x.innerText.replace(/\\n/g,' — ')).join(' | ')`));
await b.shot('solo-0-intro');
await configurar('chile');
const setup = await b.evaluate(`JSON.stringify({
  tematicas: [...document.querySelectorAll('.theme-card')].map(c=>c.dataset.tema),
  nombre: !!document.querySelector('#setup-form input'),
  repartir: !!document.querySelector('#setup-form .seg'),
  como: document.querySelectorAll('.solo-como li').length,
  abiertas: document.querySelector('.solo-como').open,
  empezarVisible: document.getElementById('btn-solo-empezar').getBoundingClientRect().bottom <= innerHeight,
})`).then(JSON.parse);
console.log('configuración:', JSON.stringify(setup));
ok(setup.tematicas.length === 6 && setup.tematicas.includes('brasil'), 'las seis temáticas, Brasil incluida');
ok(!setup.nombre && !setup.repartir, 'sin nombre, sin forma de repartir ni tamaño de mano');
ok(setup.como === 3 && setup.abiertas, 'explica cómo se juega, a la vista la primera vez');
await b.shot('solo-1-config');

/* 2 · La partida --------------------------------------------------------------- */
await click('#btn-solo-empezar'); await sleep(900);
console.log('pantalla:', await b.active(), '| inicio:', JSON.stringify(await tablero()));
const t0 = await tablero();
ok(t0.linea === 1 && t0.mano === 9, 'uno puesto y nueve en la mano');
ok((await solo())?.tema === 'chile', 'guardada con la temática elegida');
await b.shot('solo-2-juego');
await jugar(false);
const err = await b.evaluate(`JSON.stringify({visible:!document.getElementById('handoff').hidden, rojo:document.getElementById('handoff').classList.contains('bad'), texto:document.getElementById('handoff').innerText.replace(/\\n+/g,' | ').slice(0,200)})`).then(JSON.parse);
console.log('error:', JSON.stringify(err));
ok(err.visible && err.rojo, 'el error se muestra en rojo');
await b.shot('solo-3-error');
await sleep(2000);
ok(await b.evaluate(`!document.getElementById('handoff').hidden`), 'y se queda hasta tocarlo (C-8b)');
await cerrarVeredicto();
const t1 = await tablero();
console.log('tras el error:', JSON.stringify(t1));
ok(t1.linea === 2 && t1.rojas === 1 && t1.mano === 8, 'la carta quedó en la línea, marcada en rojo');
await jugar(true); await sleep(1600);
ok(await b.evaluate(`document.getElementById('handoff').hidden`), 'el acierto se cierra solo');

/* 3 · Retomar ------------------------------------------------------------------- */
const antes = await solo();
await b.go(URL, 1200);
console.log('retomar ofrece:', await b.evaluate(`document.querySelector('#resume-slot .muted')?.textContent`));
await click('#resume-slot .btn'); await sleep(900);
const t2 = await tablero();
console.log('retomado:', await b.active(), JSON.stringify(t2), '| guardado antes:', antes.jugadas.length, 'jugadas,', antes.ms, 'ms');
ok(t2.linea === 3 && t2.mano === 7 && t2.rojas === 1, 'vuelve con las mismas jugadas');
ok((await solo()).ms >= antes.ms, 'el reloj sigue desde donde iba');

/* 4 · El resultado --------------------------------------------------------------- */
await terminar();
console.log('al terminar la mano:', JSON.stringify(await tablero()));
ok(await b.evaluate(`!!document.getElementById('btn-fin')`), 'aparece Ver resultado');
await b.shot('solo-4-fin-de-linea');
await click('#btn-fin'); await sleep(1200);
const res = () => b.evaluate(`JSON.stringify({
  pantalla: document.querySelector('.screen.active').id,
  trofeo: document.getElementById('sr-trophy').textContent,
  titulo: document.getElementById('sr-title').textContent,
  puntos: document.getElementById('sr-puntos').textContent,
  sub: document.getElementById('sr-sub').textContent,
  record: document.getElementById('sr-record').hidden ? '' : document.getElementById('sr-record').textContent,
  tarjeta: document.getElementById('sr-tarjeta').textContent,
  botones: [...document.querySelectorAll('#sr-actions .btn')].map(x=>x.textContent),
  botonesVisibles: [...document.querySelectorAll('#sr-actions .btn')].every(x=>x.getBoundingClientRect().bottom <= innerHeight),
  lineaFinal: document.querySelectorAll('#sr-line .event').length,
})`).then(JSON.parse);
const r1 = await res();
console.log('resultado 1:', JSON.stringify(r1));
ok(r1.puntos === '89' && r1.tarjeta === '🟥🟩🟩🟩🟩🟩🟩🟩🟩', '8 de 9 son 89 puntos, con su tarjeta');
ok(r1.botonesVisibles, 'los botones del final se ven sin desplazar en 812 px (C-8)');
ok(r1.lineaFinal === 10, 'la línea final tiene los diez hitos');
ok(await b.evaluate(`JSON.parse(localStorage.getItem('juegos-de-salon:linea-de-tiempo:session')).done === true`), 'terminada: queda marcada done');
ok(await sinScrollLateral(), 'sin scroll horizontal');
await b.shot('solo-5-resultado');
await b.evaluate(`document.getElementById('sr-replay').open = true; 1`); await sleep(300);
await b.shot('solo-6-linea-final');
await b.evaluate(`document.getElementById('sr-replay').open = false; window.scrollTo(0,0); 1`);

/* 5 · Jugar otra vez: otras cartas y récord ---------------------------------------- */
const vistas1 = await cartasDe();
await click('#btn-solo-otra'); await sleep(900);
const s2 = await solo();
const vistas2 = await cartasDe();
const repetidas = vistas2.filter(id => vistas1.includes(id)).length;
console.log('otra vez:', await b.active(), '| tema:', s2.tema, '| excluidas:', s2.skip.length, '| repetidas con la anterior:', repetidas);
ok(s2.tema === 'chile' && s2.jugadas.length === 0, 'misma temática, partida nueva');
ok(repetidas === 0, 'no repite las cartas recién vistas (D-34)');
await terminar(); await click('#btn-fin'); await sleep(1200);
const r2 = await res();
console.log('resultado 2:', JSON.stringify(r2));
ok(r2.puntos === '100' && /récord/i.test(r2.record), 'línea perfecta: 100 puntos y nuevo récord');
await b.shot('solo-7-perfecta');
// Cambiar de modo vuelve a la intro sin nada que retomar
await b.evaluate(`[...document.querySelectorAll('#sr-actions .btn')][1].click(); 1`); await sleep(500);
ok((await b.active()) === 'screen-intro' && (await b.evaluate(`!document.querySelector('#resume-slot .panel')`)), 'Cambiar modo vuelve a la intro');

/* 6 · El solitario viejo no se ofrece ---------------------------------------------- */
await b.evaluate(`localStorage.setItem('juegos-de-salon:linea-de-tiempo:session', JSON.stringify({v:1,game:'linea-de-tiempo',at:Date.now(),mode:'solo',config:{theme:'historia',handSize:5,shared:false,spread:false,seed:1,players:['A']},messages:[{t:'hello',from:'A',name:'Javi'}],done:false})); 1`);
await b.go(URL, 1200);
ok(await b.evaluate(`!document.querySelector('#resume-slot .panel')`), 'una partida del solitario viejo no se ofrece para retomar');

/* 7 · Inglés y portugués ----------------------------------------------------------- */
for (const lang of ['en', 'pt']) {
  await configurar('brasil', lang);
  const plegado = await b.evaluate(`JSON.stringify({abiertas: document.querySelector('.solo-como').open, empezar: document.getElementById('btn-solo-empezar').getBoundingClientRect().bottom <= innerHeight})`).then(JSON.parse);
  ok(!plegado.abiertas && plegado.empezar, `${lang}: ya jugó, así que las reglas van plegadas y Empezar se ve sin desplazar`);
  await b.shot(`solo-${lang}-1-config`);
  await click('#btn-solo-empezar'); await sleep(900);
  console.log(`${lang} juego:`, JSON.stringify(await tablero()));
  await b.shot(`solo-${lang}-2-juego`);
  await jugar(false);
  await b.shot(`solo-${lang}-3-error`);
  await cerrarVeredicto();
  await terminar(); await click('#btn-fin'); await sleep(1200);
  const r = await res();
  console.log(`${lang} resultado:`, JSON.stringify(r));
  ok(r.botonesVisibles && (await sinScrollLateral()), `${lang}: botones a la vista y sin scroll horizontal`);
  await b.shot(`solo-${lang}-4-resultado`);
}
await b.go(`${URL}?lang=es`, 600);

console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
process.exit(0);
