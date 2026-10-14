/**
 * Playing solo in Línea de Tiempo: La Copa's ⏳ Línea Relámpago (D-142).
 *
 *   1. setup asks only for the deck (all six, Brasil included) and explains how to play
 *   2. ten milestones: one placed and nine in the hand; a miss leaves the card in its place, in red
 *   3. reloading mid-game offers to resume, and resuming comes back with the same plays
 *   4. the result: score from 0 to 100, hits, time, card, record per deck, and the end
 *      buttons visible at 812 px (C-8)
 *   5. playing again leaves out the cards just seen (D-34) and beats the record
 *   6. a saved game from the old solitaire (with `messages`) is not offered
 *   7. English and Portuguese
 *
 * Usage: SITE=http://localhost:87xx node tools/e2e/timeline/solo.mjs <output>
 */
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LANGS } from '../../../public/assets/js/i18n.js';

const OUT = output('/tmp/ldt-solo');
const SITE = process.env.SITE || 'http://localhost:8765';
const CDP = Number(process.env.CDP_PORT) || 9456;
const URL = `${SITE}/timeline/`;
const b = await launch({ port: CDP, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ok = (cond, text) => console.log(`  ${cond ? '✅' : '❌'} ${text}`);
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const solo = () => b.evaluate(`JSON.stringify(window.__ldt.solo())`).then(JSON.parse);
const board = () => b.evaluate(`JSON.stringify({
  line: document.querySelectorAll('#solo-juego .line .event').length,
  hand: document.querySelectorAll('#solo-juego .hand .card').length,
  red: document.querySelectorAll('#solo-juego .line .event.fallo').length,
  clock: document.getElementById('solo-cron').textContent,
  status: document.querySelector('#solo-juego .status').innerText.replace(/\\n/g,' · '),
})`).then(JSON.parse);
const noSideScroll = () => b.evaluate(`document.documentElement.scrollWidth <= window.innerWidth`);
/** The ten cards of the saved game, from the same engine that deals them */
const cardsOf = () => b.evaluate(`(async()=>{const L=await import('${SITE}/cup/games/timeline/engine.js');const s=JSON.parse(localStorage.getItem('juegos-de-salon:linea-de-tiempo:session'));const p=L.generar(s.codigo,1,{tema:s.tema,excluir:s.skip});return JSON.stringify([p.base.id,...p.mano.map(c=>c.id)])})()`).then(JSON.parse);

/** Plays the first card of the hand, right or wrong. The year comes from the same engine that deals it. */
async function play(right) {
  const info = await b.evaluate(`(async()=>{
    const L = await import('${SITE}/cup/games/timeline/engine.js');
    const s = window.__ldt.solo();
    const p = L.generar(s.codigo, 1, { tema: s.tema, excluir: s.skip });
    const e = L.estado(p, s.jugadas);
    const id = document.querySelector('#solo-juego .hand .card').dataset.card;
    const card = p.mano.find(c => c.id === id);
    const at = L.huecoCorrecto(e.linea, card);
    return JSON.stringify({ at, wrong: at === 0 ? e.linea.length : 0 });
  })()`).then(JSON.parse);
  await b.evaluate(`document.querySelector('#solo-juego .hand .card').click(); 1`); await sleep(80);
  await b.evaluate(`document.querySelector('#solo-juego .line .slot[data-slot="${right ? info.at : info.wrong}"]').click(); 1`); await sleep(80);
  await click('#btn-colocar'); await sleep(500);
}
const closeVerdict = async () => { await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(350); };
const finish = async () => {
  for (let g = 0; g < 12 && (await b.evaluate(`document.querySelectorAll('#solo-juego .hand .card').length`)); g++) { await play(true); await closeVerdict(); }
  await sleep(300);
};

async function configure(deck, lang = '') {
  await b.go(URL + (lang ? `?lang=${lang}` : ''), 1200);
  await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho|allein/i.test(m.textContent)).click(); 1`); await sleep(300);
  if (deck) { await b.evaluate(`document.querySelector('.theme-card[data-tema="${deck}"]').click(); 1`); await sleep(100); }
}

await b.go(URL); await b.evaluate(`localStorage.clear(); 1`);

/* 1 · Setup ------------------------------------------------------------------- */
await b.go(URL, 1200);
console.log('modes:', await b.evaluate(`[...document.querySelectorAll('.mode')].map(x=>x.innerText.replace(/\\n/g,' — ')).join(' | ')`));
await b.shot('solo-0-intro');
await configure('chile');
const setup = await b.evaluate(`JSON.stringify({
  decks: [...document.querySelectorAll('.theme-card')].map(c=>c.dataset.tema),
  name: !!document.querySelector('#setup-form input'),
  deal: !!document.querySelector('#setup-form .seg'),
  how: document.querySelectorAll('.solo-como li').length,
  open: document.querySelector('.solo-como').open,
  startVisible: document.getElementById('btn-solo-empezar').getBoundingClientRect().bottom <= innerHeight,
})`).then(JSON.parse);
console.log('setup:', JSON.stringify(setup));
ok(setup.decks.length === 6 && setup.decks.includes('brasil'), 'all six decks, Brasil included');
ok(!setup.name && !setup.deal, 'no name, no dealing option and no hand size');
ok(setup.how === 3 && setup.open, 'explains how to play, shown open the first time');
await b.shot('solo-1-config');

/* 2 · The game ------------------------------------------------------------------ */
await click('#btn-solo-empezar'); await sleep(900);
console.log('screen:', await b.active(), '| start:', JSON.stringify(await board()));
const t0 = await board();
ok(t0.line === 1 && t0.hand === 9, 'one placed and nine in the hand');
ok((await solo())?.tema === 'chile', 'saved with the chosen deck');
await b.shot('solo-2-game');
await play(false);
const err = await b.evaluate(`JSON.stringify({visible:!document.getElementById('handoff').hidden, red:document.getElementById('handoff').classList.contains('bad'), text:document.getElementById('handoff').innerText.replace(/\\n+/g,' | ').slice(0,200)})`).then(JSON.parse);
console.log('miss:', JSON.stringify(err));
ok(err.visible && err.red, 'the miss shows in red');
await b.shot('solo-3-error');
await sleep(2000);
ok(await b.evaluate(`!document.getElementById('handoff').hidden`), 'and stays until tapped (C-8b)');
await closeVerdict();
const t1 = await board();
console.log('after the miss:', JSON.stringify(t1));
ok(t1.line === 2 && t1.red === 1 && t1.hand === 8, 'the card stayed on the line, marked in red');
// With its fact, the hit stays for the 6 s of its bar (D-314)
await play(true); await sleep(6600);
ok(await b.evaluate(`document.getElementById('handoff').hidden`), 'the hit closes by itself');

/* 3 · Resume ---------------------------------------------------------------------- */
const before = await solo();
await b.go(URL, 1200);
console.log('resume offers:', await b.evaluate(`document.querySelector('#resume-slot .muted')?.textContent`));
await click('#resume-slot .btn'); await sleep(900);
const t2 = await board();
console.log('resumed:', await b.active(), JSON.stringify(t2), '| saved before:', before.jugadas.length, 'plays,', before.ms, 'ms');
ok(t2.line === 3 && t2.hand === 7 && t2.red === 1, 'comes back with the same plays');
ok((await solo()).ms >= before.ms, 'the clock goes on from where it was');

/* 4 · The result ------------------------------------------------------------------ */
await finish();
console.log('when the hand is done:', JSON.stringify(await board()));
ok(await b.evaluate(`!!document.getElementById('btn-fin')`), 'Ver resultado shows up');
await b.shot('solo-4-end-of-line');
await click('#btn-fin'); await sleep(1200);
const res = () => b.evaluate(`JSON.stringify({
  screen: document.querySelector('.screen.active').id,
  trophy: document.getElementById('sr-trophy').textContent,
  title: document.getElementById('sr-title').textContent,
  points: document.getElementById('sr-puntos').textContent,
  sub: document.getElementById('sr-sub').textContent,
  record: document.getElementById('sr-record').hidden ? '' : document.getElementById('sr-record').textContent,
  card: document.getElementById('sr-tarjeta').textContent,
  buttons: [...document.querySelectorAll('#sr-actions .btn')].map(x=>x.textContent),
  buttonsVisible: [...document.querySelectorAll('#sr-actions .btn')].every(x=>x.getBoundingClientRect().bottom <= innerHeight),
  finalLine: document.querySelectorAll('#sr-line .event').length,
})`).then(JSON.parse);
const r1 = await res();
console.log('result 1:', JSON.stringify(r1));
ok(r1.points === '89' && r1.card === '🟥🟩🟩🟩🟩🟩🟩🟩🟩', '8 of 9 is 89 points, with its card');
ok(r1.buttonsVisible, 'the end buttons show without scrolling at 812 px (C-8)');
ok(r1.finalLine === 10, 'the final line has the ten milestones');
ok(await b.evaluate(`JSON.parse(localStorage.getItem('juegos-de-salon:linea-de-tiempo:session')).done === true`), 'finished: it is marked done');
ok(await noSideScroll(), 'no horizontal scroll');
await b.shot('solo-5-result');
await b.evaluate(`document.getElementById('sr-replay').open = true; 1`); await sleep(300);
await b.shot('solo-6-final-line');
await b.evaluate(`document.getElementById('sr-replay').open = false; window.scrollTo(0,0); 1`);

/* 5 · Play again: other cards and a record ------------------------------------------ */
const seen1 = await cardsOf();
await click('#btn-solo-otra'); await sleep(900);
const s2 = await solo();
const seen2 = await cardsOf();
const repeated = seen2.filter(id => seen1.includes(id)).length;
console.log('again:', await b.active(), '| deck:', s2.tema, '| excluded:', s2.skip.length, '| repeated from the previous one:', repeated);
ok(s2.tema === 'chile' && s2.jugadas.length === 0, 'same deck, new game');
ok(repeated === 0, 'doesn\'t repeat the cards just seen (D-34)');
await finish(); await click('#btn-fin'); await sleep(1200);
const r2 = await res();
console.log('result 2:', JSON.stringify(r2));
ok(r2.points === '100' && /récord/i.test(r2.record), 'perfect line: 100 points and a new record');
await b.shot('solo-7-perfect');
// Changing mode goes back to the intro with nothing to resume. It's the second-to-last button:
// Compartir was added above (D-165) and Volver al menú goes below
await b.evaluate(`[...document.querySelectorAll('#sr-actions .btn')].at(-2).click(); 1`); await sleep(500);
ok((await b.active()) === 'screen-intro' && (await b.evaluate(`!document.querySelector('#resume-slot .panel')`)), 'Cambiar modo goes back to the intro');

/* 6 · The old solitaire is not offered ---------------------------------------------- */
await b.evaluate(`localStorage.setItem('juegos-de-salon:linea-de-tiempo:session', JSON.stringify({v:1,game:'linea-de-tiempo',at:Date.now(),mode:'solo',config:{theme:'historia',handSize:5,shared:false,spread:false,seed:1,players:['A']},messages:[{t:'hello',from:'A',name:'Javi'}],done:false})); 1`);
await b.go(URL, 1200);
ok(await b.evaluate(`!document.querySelector('#resume-slot .panel')`), 'a game from the old solitaire is not offered to resume');

/* 7 · The other languages, all the ones on offer (D-199) ---------------------------- */
for (const lang of LANGS.filter(l => l !== 'es')) {
  await configure('brasil', lang);
  const folded = await b.evaluate(`JSON.stringify({open: document.querySelector('.solo-como').open, start: document.getElementById('btn-solo-empezar').getBoundingClientRect().bottom <= innerHeight})`).then(JSON.parse);
  ok(!folded.open && folded.start, `${lang}: already played, so the rules are folded and Empezar shows without scrolling`);
  await b.shot(`solo-${lang}-1-config`);
  await click('#btn-solo-empezar'); await sleep(900);
  console.log(`${lang} game:`, JSON.stringify(await board()));
  await b.shot(`solo-${lang}-2-game`);
  await play(false);
  await b.shot(`solo-${lang}-3-error`);
  await closeVerdict();
  await finish(); await click('#btn-fin'); await sleep(1200);
  const r = await res();
  console.log(`${lang} result:`, JSON.stringify(r));
  ok(r.buttonsVisible && (await noSideScroll()), `${lang}: buttons visible and no horizontal scroll`);
  await b.shot(`solo-${lang}-4-result`);
}
await b.go(`${URL}?lang=es`, 600);

console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
process.exit(0);
