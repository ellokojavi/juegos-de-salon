/**
 * El dato de cada carta en ⏳ Línea Relámpago, el modo solo de Línea de Tiempo (D-277).
 *
 *   1. al errar, el veredicto cuenta el dato (y ya no "iba entre…") y el reloj se pausa: ⏸ arriba,
 *      la barra que se vacía, y el tiempo quieto mientras se lee
 *   2. al cerrar el veredicto el reloj vuelve a andar
 *   3. la pausa tiene tope: con el veredicto abierto, a los 6 s el reloj sigue
 *   4. al acertar, el dato va en una franja sobre el botón: no frena, elegir otra carta no la borra
 *      y se va sola
 *   5. al terminar, la línea es el repaso: los errores con su dato a la vista y el resto a un toque
 *   6. en inglés, el dato en inglés
 *
 * Uso: SITIO=http://localhost:87xx node tools/e2e/timeline/dato.mjs <salida>
 */
import { launch, sleep } from '../cdp.mjs';

const OUT = process.argv[2] || '/tmp/ldt-dato';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const URL = `${SITIO}/timeline/`;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ok = (cond, texto) => console.log(`  ${cond ? '✅' : '❌'} ${texto}`);
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const ms = () => b.evaluate(`window.__ldt.solo().ms`);
const reloj = () => b.evaluate(`JSON.stringify({ t: document.getElementById('solo-cron').textContent, pausa: document.getElementById('solo-cron').classList.contains('en-pausa') })`).then(JSON.parse);
const veredicto = () => b.evaluate(`(()=>{const h=document.getElementById('handoff');return JSON.stringify({
  visible: !h.hidden, dato: h.querySelector('.verdict .dato .dato-t')?.textContent || '', barra: !!h.querySelector('.verdict .dato-pausa'),
  donde: !!h.querySelector('.verdict .why') })})()`).then(JSON.parse);

async function jugar(bien) {
  const info = await b.evaluate(`(async()=>{
    const L = await import('${SITIO}/cup/games/timeline/engine.js');
    const s = window.__ldt.solo();
    const p = L.generar(s.codigo, 1, { tema: s.tema, excluir: s.skip });
    const e = L.estado(p, s.jugadas);
    const id = document.querySelector('#solo-juego .hand .card').dataset.card;
    const at = L.huecoCorrecto(e.linea, p.mano.find(c => c.id === id));
    return JSON.stringify({ at, mal: at === 0 ? e.linea.length : 0 });
  })()`).then(JSON.parse);
  await b.evaluate(`document.querySelector('#solo-juego .hand .card').click(); 1`); await sleep(80);
  await b.evaluate(`document.querySelector('#solo-juego .line .slot[data-slot="${bien ? info.at : info.mal}"]').click(); 1`); await sleep(80);
  await click('#btn-colocar'); await sleep(500);
}
const cerrar = async () => { await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(350); };
async function empezar(tema, lang = '') {
  await b.go(URL + (lang ? `?lang=${lang}` : ''), 1200);
  await b.evaluate(`localStorage.clear(); 1`);
  await b.go(URL + (lang ? `?lang=${lang}` : ''), 1200);
  await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho|allein/i.test(m.textContent)).click(); 1`); await sleep(300);
  await b.evaluate(`document.querySelector('.theme-card[data-tema="${tema}"]').click(); 1`); await sleep(100);
  await click('#btn-solo-empezar'); await sleep(900);
}

/* 1 · El error cuenta el dato y pausa el reloj ------------------------------------ */
await empezar('chile');
await sleep(1200);
await jugar(false);
const v1 = await veredicto();
console.log('error:', JSON.stringify(v1));
ok(v1.visible && v1.dato.startsWith('💡') && v1.dato.length > 20, 'el error cuenta el dato de la carta');
ok(!v1.donde, 'y ya no dice entre qué hitos iba');
ok(v1.barra, 'con la barra del tiempo gratis');
await b.shot('dato-1-error');
const r1 = await reloj();
ok(r1.pausa, 'el reloj de arriba marca ⏸');
const a1 = await ms();
await sleep(2500);
const a2 = await ms();
ok(Math.abs(a2 - a1) < 300, `mientras se lee, el tiempo no corre (${a1} → ${a2} ms)`);

/* 2 · Cerrar el veredicto vuelve a andar el reloj -------------------------------- */
await cerrar();
ok(!(await reloj()).pausa, 'al cerrarlo, el ⏸ se va');
const t1 = await b.evaluate(`window.__ldt.solo().ms`);
await jugar(true);   // guarda el tiempo con la jugada
const t2 = await b.evaluate(`window.__ldt.solo().ms`);
ok(t2 > t1, `y el reloj vuelve a andar (${t1} → ${t2} ms)`);

/* 4 · El acierto: la franja ----------------------------------------------------- */
await sleep(1600);
const f = await b.evaluate(`JSON.stringify({ cerrado: document.getElementById('handoff').hidden, franja: document.querySelector('#solo-juego .place-row .dato-franja')?.textContent || '' })`).then(JSON.parse);
console.log('acierto:', JSON.stringify(f));
ok(f.cerrado && f.franja.startsWith('💡'), 'el acierto se cierra solo y deja el dato en una franja sobre el botón');
await b.shot('dato-2-franja');
await b.evaluate(`document.querySelector('#solo-juego .hand .card').click(); 1`); await sleep(200);
ok(await b.evaluate(`!!document.querySelector('#solo-juego .place-row .dato-franja') && !!document.querySelector('#btn-colocar')`), 'elegir otra carta no la borra, y el botón sigue ahí');
await b.evaluate(`document.querySelector('#solo-juego .hand .card').click(); 1`);
await sleep(6000);
ok(await b.evaluate(`!document.querySelector('#solo-juego .place-row .dato-franja')`), 'y se va sola');

/* 3 · La pausa tiene tope -------------------------------------------------------- */
await jugar(false);
ok((await reloj()).pausa, 'otro error, otra pausa');
await sleep(6600);
const r3 = await reloj();
ok(!r3.pausa && (await veredicto()).visible, 'a los 6 s el reloj sigue, aunque el veredicto siga abierto');
await cerrar();

/* 5 · El repaso del final -------------------------------------------------------- */
for (let g = 0; g < 12 && (await b.evaluate(`document.querySelectorAll('#solo-juego .hand .card').length`)); g++) { await jugar(true); await cerrar(); }
await sleep(400);
const fin = await b.evaluate(`JSON.stringify({
  aviso: [...document.querySelectorAll('#solo-juego .stack p')].map(p=>p.textContent).join(' '),
  rojas: document.querySelectorAll('#solo-juego .line .event.fallo').length,
  rojasAbiertas: [...document.querySelectorAll('#solo-juego .line .event.fallo .ev-dato')].filter(d=>!d.hidden).length,
  cerradas: [...document.querySelectorAll('#solo-juego .line .event:not(.fallo) .ev-dato')].filter(d=>d.hidden).length,
})`).then(JSON.parse);
console.log('final:', JSON.stringify(fin));
ok(fin.aviso.includes('💡'), 'invita a tocar un hito para saber más');
ok(fin.rojas === 2 && fin.rojasAbiertas === 2, 'los dos errores, con su dato a la vista');
ok(fin.cerradas >= 7, 'los aciertos, con el dato plegado');
await b.evaluate(`document.querySelector('#solo-juego .line .event:not(.fallo)').click(); 1`); await sleep(150);
ok(await b.evaluate(`!document.querySelector('#solo-juego .line .event:not(.fallo) .ev-dato').hidden`), 'un toque abre el dato de un acierto');
await b.shot('dato-3-repaso');
await click('#btn-fin'); await sleep(900);
const sr = await b.evaluate(`JSON.stringify({ abiertos: [...document.querySelectorAll('#sr-line .event.fallo .ev-dato')].filter(d=>!d.hidden).length })`).then(JSON.parse);
ok(sr.abiertos === 2, 'en el resultado, "La línea quedó así" también trae los datos de los errores');

/* 6 · En inglés ------------------------------------------------------------------ */
await empezar('historia', 'en');
await jugar(false);
const en = await veredicto();
console.log('en:', JSON.stringify(en));
const enCarta = await b.evaluate(`(async()=>{const {DECKS}=await import('${SITIO}/timeline/decks/index.js');const t=document.querySelector('#handoff .card-big .t').textContent;const c=DECKS.find(d=>d.id==='historia').cards.find(c=>c.en===t);return c?.dato?.en||''})()`);
ok(en.dato === `💡 ${enCarta}` && !!enCarta, 'el dato sale en inglés');

console.log('errores:', JSON.stringify(b.errors));
ok(!b.errors.length, 'consola sin errores');
b.close();
