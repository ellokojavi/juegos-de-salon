/**
 * The fact on each card in ⏳ Línea Relámpago, Línea de Tiempo's solo mode (D-277, D-314).
 *
 *   1. on a miss, the verdict tells the fact (no longer "it went between…") and the clock pauses:
 *      ⏸ at the top, the draining bar, and the time frozen while reading
 *   2. closing the verdict starts the clock again
 *   3. the pause has a cap: with the verdict open, after 6 s the clock runs again
 *   4. on a hit, the verdict also tells the fact, with the clock paused and the bar (D-314):
 *      it closes by itself when the bar runs out, or earlier with a tap
 *   5. at the end, the line is the review: the misses with their fact showing and the rest one tap away
 *   6. in English, the fact in English
 *
 * Usage: SITE=http://localhost:87xx node tools/e2e/timeline/fact.mjs <output>
 */
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const OUT = output('/tmp/ldt-fact');
const SITE = process.env.SITE || 'http://localhost:8765';
const URL = `${SITE}/timeline/`;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ok = (cond, text) => console.log(`  ${cond ? '✅' : '❌'} ${text}`);
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const ms = () => b.evaluate(`window.__ldt.solo().ms`);
const clock = () => b.evaluate(`JSON.stringify({ t: document.getElementById('solo-cron').textContent, paused: document.getElementById('solo-cron').classList.contains('en-pausa') })`).then(JSON.parse);
const verdict = () => b.evaluate(`(()=>{const h=document.getElementById('handoff');return JSON.stringify({
  visible: !h.hidden, fact: h.querySelector('.verdict .dato .dato-t')?.textContent || '', bar: !!h.querySelector('.verdict .dato-pausa'),
  where: !!h.querySelector('.verdict .why') })})()`).then(JSON.parse);

async function play(right) {
  const info = await b.evaluate(`(async()=>{
    const L = await import('${SITE}/cup/games/timeline/engine.js');
    const s = window.__ldt.solo();
    const p = L.generar(s.codigo, 1, { tema: s.tema, excluir: s.skip });
    const e = L.estado(p, s.jugadas);
    const id = document.querySelector('#solo-juego .hand .card').dataset.card;
    const at = L.huecoCorrecto(e.linea, p.mano.find(c => c.id === id));
    return JSON.stringify({ at, wrong: at === 0 ? e.linea.length : 0 });
  })()`).then(JSON.parse);
  await b.evaluate(`document.querySelector('#solo-juego .hand .card').click(); 1`); await sleep(80);
  await b.evaluate(`document.querySelector('#solo-juego .line .slot[data-slot="${right ? info.at : info.wrong}"]').click(); 1`); await sleep(80);
  await click('#btn-colocar'); await sleep(500);
}
const close = async () => { await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(350); };
async function start(deck, lang = '') {
  await b.go(URL + (lang ? `?lang=${lang}` : ''), 1200);
  await b.evaluate(`localStorage.clear(); 1`);
  await b.go(URL + (lang ? `?lang=${lang}` : ''), 1200);
  await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho|allein/i.test(m.textContent)).click(); 1`); await sleep(300);
  await b.evaluate(`document.querySelector('.theme-card[data-tema="${deck}"]').click(); 1`); await sleep(100);
  await click('#btn-solo-empezar'); await sleep(900);
}

/* 1 · A miss tells the fact and pauses the clock ---------------------------------- */
await start('chile');
await sleep(1200);
await play(false);
const v1 = await verdict();
console.log('miss:', JSON.stringify(v1));
ok(v1.visible && v1.fact.startsWith('💡') && v1.fact.length > 20, 'the miss tells the card\'s fact');
ok(!v1.where, 'and no longer says which milestones it went between');
ok(v1.bar, 'with the free-time bar');
await b.shot('fact-1-miss');
const c1 = await clock();
ok(c1.paused, 'the clock at the top shows ⏸');
const a1 = await ms();
await sleep(2500);
const a2 = await ms();
ok(Math.abs(a2 - a1) < 300, `while reading, time doesn't run (${a1} → ${a2} ms)`);

/* 2 · Closing the verdict starts the clock again --------------------------------- */
await close();
ok(!(await clock()).paused, 'when closed, the ⏸ goes away');
const t1 = await b.evaluate(`window.__ldt.solo().ms`);

/* 4 · A hit also tells its fact (D-314) ------------------------------------------ */
await play(true);   // saves the time with the play
const t2 = await b.evaluate(`window.__ldt.solo().ms`);
ok(t2 > t1, `and the clock runs again (${t1} → ${t2} ms)`);
const v4 = await verdict();
console.log('hit:', JSON.stringify(v4));
ok(v4.visible && v4.fact.startsWith('💡') && v4.fact.length > 20 && v4.bar, 'the hit also tells the fact, with the bar');
ok((await clock()).paused, 'and the clock paused while reading');
await b.shot('fact-2-hit');
await sleep(2500);
ok((await verdict()).visible, 'it doesn\'t close before it can be read');
await sleep(4000);
ok(!(await verdict()).visible && !(await clock()).paused, 'it closes by itself when the bar runs out, and the clock goes on');
await play(true);
ok((await verdict()).visible, 'another hit, another fact');
await close();
ok(!(await verdict()).visible && !(await clock()).paused, 'a tap closes it earlier');

/* 3 · The pause has a cap -------------------------------------------------------- */
await play(false);
ok((await clock()).paused, 'another miss, another pause');
await sleep(6600);
const c3 = await clock();
ok(!c3.paused && (await verdict()).visible, 'after 6 s the clock runs, even with the verdict still open');
await close();

/* 5 · The review at the end ------------------------------------------------------ */
for (let g = 0; g < 12 && (await b.evaluate(`document.querySelectorAll('#solo-juego .hand .card').length`)); g++) { await play(true); await close(); }
await sleep(400);
const end = await b.evaluate(`JSON.stringify({
  notice: [...document.querySelectorAll('#solo-juego .stack p')].map(p=>p.textContent).join(' '),
  red: document.querySelectorAll('#solo-juego .line .event.fallo').length,
  redOpen: [...document.querySelectorAll('#solo-juego .line .event.fallo .ev-dato')].filter(d=>!d.hidden).length,
  folded: [...document.querySelectorAll('#solo-juego .line .event:not(.fallo) .ev-dato')].filter(d=>d.hidden).length,
})`).then(JSON.parse);
console.log('end:', JSON.stringify(end));
ok(end.notice.includes('💡'), 'invites tapping a milestone to learn more');
ok(end.red === 2 && end.redOpen === 2, 'the two misses, with their fact showing');
ok(end.folded >= 7, 'the hits, with the fact folded');
await b.evaluate(`document.querySelector('#solo-juego .line .event:not(.fallo)').click(); 1`); await sleep(150);
ok(await b.evaluate(`!document.querySelector('#solo-juego .line .event:not(.fallo) .ev-dato').hidden`), 'a tap opens a hit\'s fact');
await b.shot('fact-3-review');
await click('#btn-fin'); await sleep(900);
const sr = await b.evaluate(`JSON.stringify({ open: [...document.querySelectorAll('#sr-line .event.fallo .ev-dato')].filter(d=>!d.hidden).length })`).then(JSON.parse);
ok(sr.open === 2, 'in the result, "La línea quedó así" also brings the misses\' facts');

/* 6 · In English ----------------------------------------------------------------- */
await start('historia', 'en');
await play(false);
const en = await verdict();
console.log('en:', JSON.stringify(en));
const enCard = await b.evaluate(`(async()=>{const {DECKS}=await import('${SITE}/timeline/decks/index.js');const t=document.querySelector('#handoff .card-big .t').textContent;const c=DECKS.find(d=>d.id==='historia').cards.find(c=>c.en===t);return c?.dato?.en||''})()`);
ok(en.fact === `💡 ${enCard}` && !!enCard, 'the fact shows in English');

console.log('errors:', JSON.stringify(b.errors));
ok(!b.errors.length, 'console without errors');
b.close();
