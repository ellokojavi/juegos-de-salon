// Julepe de punta a punta, sin red: mesa de tres contra el celular y partida en un celular.
// Comprueba que nadie pueda tirar una carta ilegal, que el plato se acumule con cada julepe,
// que el reparto de tragos cuadre y que la partida se pueda retomar (C-6). Las tomas llevan el
// nombre de las capturas del README (docs/capturas.json).
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9387, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITIO = 'http://localhost:8765';
const sacadas = new Set();
const toma = async nombre => { if (!sacadas.has(nombre)) { sacadas.add(nombre); await b.shot(nombre); } };
const pantalla = () => ev(`document.querySelector('.screen.active').id`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const vista = () => ev(`JSON.stringify(window.__julepe.view() || null)`).then(t => JSON.parse(t || 'null'));
const guardado = () => ev(`JSON.parse(localStorage.getItem('juegos-de-salon:julepe:session') || 'null')`);
const seguir = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);

/** El turno del jugador humano, sea cual sea la fase. Siempre va, nunca se pasa. */
const jugar = () => ev(`(()=>{
  const v = window.__julepe.view(); if (!v) return 'sin partida';
  const btn = () => document.querySelector('#actions .btn--yellow');
  if (v.phase === 'declara') { const b = btn(); if (!b) return 'no'; b.click(); return 'voy'; }
  if (v.phase === 'cambia') {
    const c = document.querySelector('#mine .pcard'); if (c) c.click();
    const b = btn(); if (!b) return 'no'; b.click(); return 'cambia';
  }
  if (v.phase === 'baza') {
    const c = document.querySelector('#mine .pcard:not(.off)'); if (!c) return 'sin carta';
    c.click();
    const b = btn(); if (!b || b.disabled) return 'sin boton';
    const t = b.textContent.trim(); b.click(); return t;
  }
  if (v.phase === 'regala') {
    for (let i = 0; i < 12; i++) {
      const b = btn(); if (b && !b.disabled) { b.click(); return 'regala'; }
      const mas = [...document.querySelectorAll('.give-pm button')].filter(x => x.textContent === '+' && !x.disabled)[0];
      if (!mas) return 'sin mas';
      mas.click();
    }
  }
  return 'nada';
})()`);

/** ¿Alguna carta apagada podría tirarse de verdad? Es la pregunta que vale del juego. */
const legalesOk = () => ev(`(()=>{
  const v = window.__julepe.view();
  if (!v || v.phase !== 'baza') return 'n/a';
  const yo = window.__julepe.session().mode === 'online' ? window.__julepe.session().role : (window.__julepe.session().uiRole || 'A');
  if (v.turno !== yo || !v.cartas[yo]) return 'n/a';
  const puestas = [...document.querySelectorAll('#mine .pcard')].map(c => c.getAttribute('aria-label'));
  const apagadas = [...document.querySelectorAll('#mine .pcard.off')].length;
  return puestas.length - apagadas;
})()`);

await b.go(`${SITIO}/`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITIO}/julepe/`);
await toma('01-intro');
console.log('modos:', await ev(`[...document.querySelectorAll('.mode')].map(m=>m.innerText.split('\\n')[0]).join(' | ')`));

/* ---------------- Contra el celular ---------------- */
await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await toma('02-configuracion');
await ev(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(700);
{
  const v = await vista();
  console.log('mano 1 · plato:', v.plato, '· triunfo:', v.triunfo, '· mis cartas:', v.cartas.A?.join(' '));
}

let vueltas = 0, julepes = 0, ilegal = 0, platoMax = 0;
while ((await pantalla()) !== 'screen-result' && vueltas++ < 400) {
  if (await overlay()) {
    if (await ev(`!!document.querySelector('#handoff .julepe')`)) { julepes++; await toma('06-julepe'); }
    await seguir(); await sleep(300); continue;
  }
  const v = await vista();
  if (!v) { await sleep(200); continue; }
  platoMax = Math.max(platoMax, v.plato);
  if (v.phase === 'declara' && v.turno === 'A') await toma('03-declaracion');
  if (v.phase === 'cambia' && v.turno === 'A') await toma('04-cambio');
  if (v.phase === 'baza' && v.turno === 'A' && v.bazas.length >= 1) await toma('05-baza');
  if (v.phase === 'regala' && v.turno === 'A') await toma('07-reparto');
  if (v.turno !== 'A') { await sleep(250); continue; }
  const legales = await legalesOk();
  if (legales === 0) ilegal++;
  const r = await jugar();
  if (r === 'sin carta' || r === 'sin boton' || r === 'sin mas') { console.log('⚠️ turno pegado:', r, v.phase); break; }
  await sleep(220);
}
{
  const v = await vista();
  console.log('contra el celular →', await pantalla(), '·', await ev(`document.getElementById('result-title').textContent`));
  console.log('manos:', v.historia.length, '· julepes vistos:', julepes, '· plato más alto:', platoMax, '· turnos sin carta legal:', ilegal);
  const bebido = v.players.reduce((a, p) => a + v.st[p].tragos, 0);
  const salido = v.historia.reduce((a, h) => a + (h.vacia ? 0 : h.plato * h.julepes.length + Object.values(h.regalos).flat().length * 2), 0);
  console.log('tragos tomados:', bebido, '· tragos repartidos por las reglas:', salido, bebido === salido ? '(cuadra)' : '⚠️ NO CUADRA');
}
await ev(`document.getElementById('result-history').open = true; 1`); await sleep(300);
await sleep(4200);   // el confeti dura 4 s y taparía el título de la captura (D-76)
await toma('08-resultado');

/* ---------------- Tres en un celular ---------------- */
await b.go(`${SITIO}/julepe/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITIO}/julepe/`);
await ev(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(300);
await ev(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await ev(`document.querySelectorAll('.largos button')[0].click(); 1`);   // partida corta
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(600);
// El reparto tarda un parpadeo, así que se espera a que aparezca la pantalla de pase en vez
// de mirar una sola vez: sin eso, la prueba decía "no" según cómo hubiera caído el reloj.
let apareceElPase = false;
for (let i = 0; i < 12 && !apareceElPase; i++) { apareceElPase = await overlay(); if (!apareceElPase) await sleep(250); }
await toma('09-pase');
console.log('en un celular, antes de mirar las cartas se pide el pase:', apareceElPase ? 'sí' : '⚠️ no');

let pases = 0, retomada = false;
vueltas = 0;
while ((await pantalla()) !== 'screen-result' && vueltas++ < 500) {
  if (await overlay()) { pases++; await seguir(); await sleep(260); continue; }
  const v = await vista();
  if (!v) { await sleep(200); continue; }
  // A mitad de la segunda mano se recarga: la partida tiene que volver donde estaba (C-6)
  if (!retomada && v.manoN === 1 && v.phase === 'baza') {
    retomada = true;
    const antes = JSON.stringify(v.historia.length) + '/' + v.manoN;
    await b.go(`${SITIO}/julepe/`); await sleep(400);
    await ev(`(()=>{const b=[...document.querySelectorAll('#resume-slot .btn')][0]; if(b) b.click(); return 1})()`);
    await sleep(700);
    const ahora = await vista();
    console.log('retomada:', antes, '→', ahora ? `${ahora.historia.length}/${ahora.manoN}` : '⚠️ no volvió', '· guardada:', !!(await guardado()));
    continue;
  }
  const r = await jugar();
  if (r === 'sin carta' || r === 'sin boton' || r === 'sin mas') { console.log('⚠️ turno pegado:', r, v.phase); break; }
  await sleep(200);
}
{
  const v = await vista();
  console.log('en un celular →', await pantalla(), '· manos:', v?.historia.length, '· pantallas de pase:', pases);
  console.log('tabla final:', v?.players.map(p => `${p}:${v.st[p].tragos}`).join(' '), '· ganan:', v?.ganadores.join(', '));
}
await sleep(4200);
await toma('10-tabla');

// Consola limpia es criterio de aceptación (C-12): si el aparato se traba, acá queda el porqué
console.log('errores de consola:', b.errors.length ? b.errors.join(' | ') : 'ninguno');
if (b.logs.length) console.log('avisos de consola:', b.logs.slice(0, 5).join(' | '));

await b.close();
console.log('julepe (sin red): listo');
