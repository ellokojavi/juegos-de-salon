// Generala end to end, no network: a whole solo game, three on one phone with a reload mid-game
// (C-6) and the served generala. Checks that nothing comes preselected (C-8), that kept dice
// don't change on a roll, that the score recorded is what the scorecard showed and that a
// finished game is not offered for resuming. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ port: 9389, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const screen = () => ev(`document.querySelector('.screen.active').id`);
const view = () => ev(`JSON.stringify((({current,tiro,dados,keep,done,winners,vuelta,servida,history})=>({current,roll:tiro,dice:dados,keep,done,winners,round:vuelta,served:servida,n:history.length}))(__generala.view()))`).then(JSON.parse);
const names = async ns => ev(`(()=>{const n=${JSON.stringify(ns)};[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
const handoff = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return false;h.querySelector('.btn').click();return true})()`);

/**
 * A turn for whoever holds the phone: rolls, keeps the dice of the most repeated face, rolls
 * again and scores where the scorecard promises the most (or the first free one). Returns what the
 * scorecard promised and what got recorded.
 */
async function turn() {
  await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(120);
  const before = await view();
  const face = [1, 2, 3, 4, 5, 6].sort((x, y) => before.dice.filter(d => d === y).length - before.dice.filter(d => d === x).length)[0];
  await ev(`(()=>{const d=document.querySelectorAll('.dado-btn');${JSON.stringify(before.dice)}.forEach((v,i)=>{if(v===${face})d[i].click()});return 1})()`);
  const kept = await ev(`JSON.stringify(__generala.session().keep)`).then(JSON.parse);
  if (kept.some(k => !k)) { await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(120); }
  const after = await view();
  const changed = kept.some((g, i) => g && after.dice[i] !== before.dice[i]);
  // The box worth the most according to the scorecard
  const chosen = await ev(`(()=>{const c=[...document.querySelectorAll('.casilla.libre')];c.sort((a,b)=>Number(b.querySelector('.val').textContent)-Number(a.querySelector('.val').textContent));c[0].click();return JSON.stringify({cat:c[0].dataset.cat,val:Number(c[0].querySelector('.val').textContent)})})()`).then(JSON.parse);
  const button = await ev(`document.getElementById('btn-anotar').textContent`);
  await ev(`document.getElementById('btn-anotar').click(); 1`); await sleep(150);
  return { changed, chosen, button };
}

await b.go(`${SITE}/`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITE}/generala/`);
await b.shot('01-intro');
console.log('modes:', await ev(`[...document.querySelectorAll('.mode')].map(m=>m.innerText.split('\\n')[0]).join(' | ')`));

/* ---------------- Play solo ---------------- */
await ev(`document.querySelector('[data-mode=solo]').click(); 1`); await sleep(300);
ok(!(await ev(`!!document.querySelector('#setup-form .switch')`)), 'playing solo, "la generala servida gana" is not offered');
await names(['Javi']);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(400);
ok(await screen() === 'screen-play', 'playing solo reaches the table with no handoff');
ok(await ev(`!document.getElementById('btn-anotar')`), 'before rolling there is nothing to score');
await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(200);
ok(await ev(`document.getElementById('btn-anotar').disabled`), 'after rolling, "Anotar" waits for a box to be chosen (C-8)');
ok(await ev(`!document.querySelector('.casilla.on')`), 'no box comes preselected (C-8)');
await ev(`document.querySelector('.casilla.libre').click(); 1`); await sleep(100);
ok(/\d|✕|0/.test(await ev(`document.getElementById('btn-anotar').textContent`)) && !(await ev(`document.getElementById('btn-anotar').disabled`)), `the button says where it scores: "${await ev(`document.getElementById('btn-anotar').textContent`)}"`);
await ev(`document.body.click(); 1`); await sleep(100);
ok(await ev(`!document.querySelector('.casilla.on')`), 'a tap outside releases the box (C-8)');
await ev(`document.querySelectorAll('.dado-btn')[1].click(); 1`); await sleep(100);
await b.shot('02-table');

let wrong = 0, changes = 0;
for (let t = 0; t < 11; t++) {
  const before = await ev(`__generala.view().st.A.total`);
  const r = await turn();
  const after = await ev(`__generala.view()?.st.A.total`);
  if (after - before !== r.chosen.val) wrong++;
  if (r.changed) changes++;
}
ok(wrong === 0, 'each score added what the scorecard promised');
ok(changes === 0, 'kept dice do not change when rolling again');
await sleep(500);
ok(await screen() === 'screen-result', 'after 11 turns, the end');
console.log('solo →', await ev(`document.getElementById('result-title').textContent`), '·', await ev(`document.getElementById('result-sub').textContent`));
ok(!!(await ev(`localStorage.getItem('juegos-de-salon:generala:record-solo')`)), 'the phone\'s record stays');
ok(await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:generala:session')).done`) === true, 'the finished game is not offered for resuming');
await sleep(3800);   // the confetti would cover the screenshot (D-76)
await b.shot('03-final-solo');

/* ---------------- Three on one phone, with a reload ---------------- */
await b.go(`${SITE}/generala/`);
await ev(`document.querySelector('[data-mode=local]').click(); 1`); await sleep(300);
await ev(`document.querySelector('#setup-actions .btn--ghost').click(); 1`); await sleep(150);
ok(await ev(`document.querySelector('#setup-form .switch').classList.contains('on')`), '"la generala servida gana" comes on, in view');
await names(['Javi', 'Cata', 'Nico']);
await b.shot('04-setup');
// Without the served one: the game has to reach the 11 rounds
await ev(`document.querySelector('#setup-form .switch').click(); 1`);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(500);
ok(await ev(`!document.getElementById('handoff').hidden`), 'on one phone it starts with the handoff (C-9)');
let handoffs = 0, resultBeforeHandoff = 0, reloaded = false;
for (let g = 0; g < 200 && (await screen()) !== 'screen-result'; g++) {
  if (await ev(`!document.getElementById('handoff').hidden`)) {
    if (await ev(`!!document.querySelector('#handoff .anoto')`)) resultBeforeHandoff++;
    if (handoffs === 2) await b.shot('05-handoff');
    await handoff(); handoffs++; await sleep(450); continue;
  }
  if (!reloaded && (await view()).round === 4) {
    // Resuming mid-game (C-6): nobody knows who had the phone
    reloaded = true;
    await b.go(`${SITE}/generala/`);
    ok(await ev(`!!document.getElementById('btn-continuar')`), `on reload, continuing is offered: "${await ev(`document.querySelector('#resume-slot .muted').textContent`)}"`);
    await ev(`document.getElementById('btn-continuar').click(); 1`); await sleep(600);
    ok(await ev(`!document.getElementById('handoff').hidden`), 'on resuming, the handoff screen comes back');
    continue;
  }
  await turn();
}
ok(reloaded, 'it reloaded mid-game');
ok(resultBeforeHandoff >= 30, `each handoff first shows what was scored (${resultBeforeHandoff})`);
const end = await view();
ok(end.done && end.n === 33, `three players, 33 scores (${end.n})`);
console.log('three on one phone →', await ev(`document.getElementById('result-title').textContent`), '·', await ev(`[...document.querySelectorAll('#result-podio .fila')].map(f=>f.innerText.replace(/\\n/g,' ')).join(' / ')`));
await ev(`document.getElementById('result-cards').open = true; 1`);
await sleep(3800);
await b.shot('06-final');

/* ---------------- The served generala ---------------- */
await ev(`document.getElementById('btn-otra').click(); 1`); await sleep(500);
await handoff(); await sleep(450);
// The served one comes on in "Otra partida" only if it was: this table turned it off
ok((await view()).current === 'A', 'another game with the same table');
await b.go(`${SITE}/generala/`);
await ev(`document.querySelector('[data-mode=local]').click(); 1`); await sleep(300);
await names(['Javi', 'Cata']);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(500);
await handoff(); await sleep(450);
await turn(); await sleep(300);
await handoff(); await sleep(450);
await ev(`__generala.session().transport.send({t:'roll',from:'B',d:'33333',k:'00000'}); 1`); await sleep(500);
ok(await ev(`!!document.querySelector('#handoff .servida')`), 'the served generala is celebrated');
await b.shot('07-served');
await ev(`document.getElementById('handoff').click(); 1`); await sleep(700);
ok(await screen() === 'screen-result', 'and the game ends');
ok(/Cata/.test(await ev(`document.getElementById('result-title').textContent`)), `whoever rolled it wins: ${await ev(`document.getElementById('result-title').textContent`)}`);
ok(await ev(`document.querySelector('#result-podio .fila').classList.contains('gana')`), 'the winner goes first even with fewer points');

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
ok(!b.errors.length, 'no errors on the page');
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ generala local');
