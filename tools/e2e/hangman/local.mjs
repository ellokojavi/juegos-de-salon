import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9345, dir: `${OUT}/p`, out: OUT });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const v = () => b.evaluate(`(()=>{const s=window.__ahorcado.view();if(!s||s.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:s.phase,current:s.current,done:s.done,
    st:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,{pattern:x.pattern,lives:x.lives,used:x.used.length,bought:x.bought,solved:x.solved,hanged:x.hanged,score:x.score}]))})})()`).then(JSON.parse);
// Uncovers the covered screen (C-9) or closes the handoff/verdict overlay on top
const tap = async (ms = 420) => {
  await b.evaluate(`(()=>{const c=document.getElementById('cover');if(!c.hidden){c.querySelector('button').click();return 'cover'}
    const h=document.getElementById('handoff');if(!h.hidden){const x=h.querySelector('button');if(x){x.click();return 'btn'}h.click();return 'tap'}return 'none'})()`);
  await sleep(ms);
};
const overlay = () => b.evaluate(`(()=>{const c=document.getElementById('cover'),h=document.getElementById('handoff');
  return !c.hidden?'cover:'+c.innerText.replace(/\\n/g,' '):!h.hidden?'handoff:'+h.innerText.replace(/\\n/g,' '):''})()`);
// Writes the word and hint for the pending chain link
const writeWord = async (word, hint) => {
  const r = await b.evaluate(`(()=>{const ins=[...document.querySelectorAll('#word-form input')];if(ins.length<2)return 'no-form';
    ins[0].value='${word}';ins[0].dispatchEvent(new Event('input',{bubbles:true}));
    ins[1].value='${hint}';ins[1].dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);
  if (r !== 'ok') return r;
  await click('#word-actions .btn'); await sleep(500);
  return 'ok';
};
/** Tries a letter: picks the most useful one on the keyboard (or one that misses on purpose) and confirms. */
const playLetter = async (hit = true) => {
  const pick = await b.evaluate(`(()=>{const s=window.__ahorcado.view();
    // Playing solo there are no turns: the board is always the only player's (D-65)
    const me=s.current||s.players[0];if(!me)return 'no-turn';
    // Deck words come lowercase and accented; the keyboard is uppercase without accents (D-57)
    const w=(s.words[me]||'').toUpperCase().replace(/Ñ/g,'\\u0001').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\u0001/g,'Ñ');
    if(!w)return 'no-word';
    const free=[...document.querySelectorAll('#keyboard button')].filter(k=>!k.disabled).map(k=>k.textContent);
    if(!free.length)return 'no-keys';
    const inside=free.filter(l=>w.includes(l)), outside=free.filter(l=>!w.includes(l));
    const chosen=${hit} ? (inside[0]||outside[0]) : (outside[0]||inside[0]);
    const k=[...document.querySelectorAll('#keyboard button')].find(x=>x.textContent===chosen);
    k.click();return chosen})()`);
  if (pick.length > 1) return pick;
  await sleep(120);
  const c = await b.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];const x=bs[bs.length-1];
    if(!x||x.disabled)return 'no-confirm';x.click();return 'ok'})()`);
  if (c !== 'ok') return c;
  await sleep(650);
  return pick;
};
/** Buys a letter (D-58): opens the confirmation and accepts. */
const buyLetter = async () => {
  const r = await clickText('#confirm .btn', '💡|Comprar|Buy|Comprar');
  if (r !== 'ok') return 'no-button';
  await sleep(300);
  await clickText('#handoff .btn', 'S(í|i)|Yes|Sim|Comprar|Buy');
  await sleep(650);
  return 'ok';
};

// Each word's verdict stays until tapped (C-8b, D-56): all of them must be closed
// to reach the result.
const untilResult = async () => {
  for (let i = 0; i < 8; i++) {
    if (await b.active() === 'screen-result' && !(await overlay())) return 'ok';
    await tap(450);
  }
  return await b.active();
};

await b.go(`${SITE}/hangman/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/hangman/`);
console.log('modes:', await b.evaluate(`[...document.querySelectorAll('.mode')].map(m=>m.textContent.replace(/\\s+/g,' ').trim()+(m.disabled?' (off)':'')).join(' | ')`));
await b.shot('01-intro');

/* ---------------- ONE PHONE · chain of 3 players ---------------- */
await click('.mode'); await sleep(350);
await clickText('#setup-form .btn--ghost', 'Agregar|Add'); await sleep(120);
await b.evaluate(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form .player-row input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await clickText('#setup-form .seg--src button', 'Cadena|Chain|Corrente'); await sleep(120);
await clickText('#setup-form .seg:not(.seg--src) button', '· 6'); await sleep(120);
console.log('chain and 6 mistakes:', await b.evaluate(`[...document.querySelectorAll('#setup-form .seg button.on')].map(x=>x.textContent.replace(/\\s+/g,' ').trim()).join(' | ')`));
await b.shot('02-setup');
await click('#setup-actions .btn'); await sleep(700);

// Each one writes for the next, with the covered screen in between (C-9, D-53)
console.log('covered before writing:', await overlay());
await b.shot('03-cover');
const CHAIN = [['MURCIELAGO', 'Vuela de noche'], ['ALCACHOFA', 'Se come hoja por hoja'], ['TRAMPOLIN', 'Salta antes del agua']];
for (const [w, h] of CHAIN) {
  await tap();
  if (w === CHAIN[0][0]) {
    await b.shot('04-word');
    // Theme suggestions: tapping one fills both fields and can be edited afterwards (D-62)
    console.log('suggestions:', await b.evaluate(`[...document.querySelectorAll('.suggest .sug')].map(x=>x.innerText.replace(/\\n/g,' ')).join(' · ')`));
    await click('.suggest .sug'); await sleep(250);
    console.log('on tapping one:', await b.evaluate(`(()=>{const i=[...document.querySelectorAll('#word-form input')];return JSON.stringify({word:i[0].value,hint:i[1].value,marked:!!document.querySelector('.suggest .sug.on')})})()`));
    await b.evaluate(`(()=>{const i=document.querySelectorAll('#word-form input')[0];i.value='X';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
    await sleep(150);
    console.log('editing it unmarks it:', await b.evaluate(`!document.querySelector('.suggest .sug.on')`));
  }
  console.log('word written:', w, '→', await writeWord(w, h));
}
await sleep(500);
let s = await v();
console.log('declared patterns:', JSON.stringify(Object.fromEntries(Object.entries(s.st).map(([r, x]) => [r, x.pattern]))));
// What travels is the pattern, the hint and the hash; the word lives apart, on this phone (C-10)
console.log('the word does not travel:', await b.evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('juegos-de-salon:ahorcado:session'));
  const w=(d.messages||[]).filter(m=>m.t==='word');
  return 'word messages='+w.length+' | keys='+[...new Set(w.flatMap(m=>Object.keys(m)))].join(',')
    +' | secrets stored apart for='+Object.keys(d.private||{}).join(',')})()`));

// Enter the first turn
console.log('handoff to the first turn:', await overlay());
await tap();
await b.shot('05-play');
console.log('initial board:', JSON.stringify(await v()));

// A letter that is not there: marked without blocking, and attached to the handoff (C-9, D-56, D-59)
console.log('wrong letter:', await playLetter(false));
// On one phone there is no flash: the verdict and handoff already take their own screen (D-63)
console.log('no flash on one phone:', await b.evaluate(`!document.querySelector('.flash')`));
console.log('verdict + handoff together:', await overlay());
await b.shot('06-letter-verdict');
await tap();
console.log('turn alternated:', (await v()).current);

// Buying a letter (D-58)
const before = await v();
console.log('purchase:', await buyLetter());
await tap(300);
const after = await v();
const who = Object.keys(before.st).find(r => after.st[r].bought > before.st[r].bought);
console.log('bought:', who, '| lives', before.st[who]?.lives, '→', after.st[who]?.lives, '| pattern', after.st[who]?.pattern);

// Mid-game memory (C-6, AH-11)
await b.go(`${SITE}/hangman/`, 1300);
console.log('after reload → continue:', await b.evaluate(`!!document.querySelector('#resume-slot .btn')`));
await click('#resume-slot .btn'); await sleep(1000);
await tap();
console.log('resumed:', JSON.stringify(await v()));

// A few moves so the board has something to show: used letters, the drawing
// started and the strip with lives already uneven (D-55)
let guard = 0;
for (let i = 0; i < 7; i++) {
  const r = await playLetter(i % 4 !== 3);
  if (r.length > 1) { console.log('stopped midway:', r); break; }
  await tap(300); await tap(200);
}
s = await v();
console.log('midway:', JSON.stringify(s));
await b.shot('07-play-middle');

// Finish the game always hitting
while (guard++ < 90) {
  s = await v();
  if (s.done) break;
  const r = await playLetter(true);
  if (r.length > 1) { console.log('stopped:', r, JSON.stringify(s)); break; }
  await tap(300); await tap(200);
}
s = await v();
console.log('end one phone:', JSON.stringify(s));
console.log('until the result:', await untilResult(), '| screen:', await b.active());
await sleep(2600); await b.shot('08-result');   // the confetti covers the ranking: let it fall
console.log('result:', await b.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-sub').textContent+' | '+document.getElementById('result-ranking').innerText.replace(/\\n/g,' · ')`));
console.log('words revealed:', await b.evaluate(`document.getElementById('result-words').innerText.replace(/\\n/g,' · ')`));

/* ---------------- PLAY SOLO ---------------- */
await b.go(`${SITE}/hangman/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/hangman/`);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(350);
// The word comes from the deck, so there is nowhere to pick it from and no one to write it for (D-65)
console.log('playing solo · theme:', await b.evaluate(`!!document.querySelector('.themes')`),
  '| no word selector:', await b.evaluate(`!document.querySelector('.seg--src')`),
  '| a single name:', await b.evaluate(`document.querySelectorAll('#setup-form input').length === 1`));
await clickText('.theme-card', 'Animales'); await sleep(120);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await click('#setup-actions .btn'); await sleep(900);
console.log('starts straight into play:', await b.active(), '| no rivals strip:', await b.evaluate(`document.getElementById('rivals').children.length === 0`));
console.log('deck hint:', await b.evaluate(`document.getElementById('hint').innerText.replace(/\\n/g,' ')`));
await b.shot('09-solo');
// The action bar must not float over the keyboard: it happened as soon as the screen got
// short, and it ate the last row of keys (C-8)
console.log('the bar does not cover the keyboard:', await b.evaluate(`(()=>{const t=[...document.querySelectorAll('#keyboard button')].slice(-1)[0];
  const c=document.querySelector('.confirm');if(!t||!c)return 'no bar';
  return t.getBoundingClientRect().bottom <= c.getBoundingClientRect().top})()`));
{
  // The letter flash here too, the other mode where nothing opens a screen (D-63)
  const l = await b.evaluate(`(()=>{const s=window.__ahorcado.view();const w=(s.words.A||'').toUpperCase();
    const k=[...document.querySelectorAll('#keyboard button')].find(x=>!x.disabled&&w.includes(x.textContent));
    if(!k)return 'no';k.click();return k.textContent})()`);
  await sleep(150);
  await b.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];bs[bs.length-1].click();return 1})()`);
  await sleep(260);
  console.log('flash after confirming:', await b.evaluate(`(()=>{const f=document.querySelector('.flash');return f?f.className+' · '+f.innerText.replace(/\\n/g,' '):'none'})()`), '| letter:', l);
}
guard = 0;
while (guard++ < 40) {
  s = await v();
  if (s.done) break;
  const r = await playLetter(true);
  if (r.length > 1) { console.log('stopped playing solo:', r); break; }
  await tap(300);
}
s = await v();
console.log('end playing solo:', JSON.stringify(s));
// A single notice: the final screen. The round verdict would say the same and is redundant (D-65)
console.log('no round verdict:', await b.evaluate(`document.getElementById('handoff').hidden`));
console.log('until the result:', await untilResult(), '| screen:', await b.active());
console.log('no one-player ranking:', await b.evaluate(`document.getElementById('ranking-panel').hidden`));
await sleep(2600); await b.shot('10-solo-result');
// Playing solo, the score goes to its table (D-274): with no player signed in, "¿quieres que cuente?" and the table
{
  const rk = await b.evaluate(`JSON.stringify({ pts: document.querySelector('.rk-solo-fin p')?.textContent || '', count: !!document.querySelector('.rk-solo-fin .rk-contar'), table: !!document.querySelector('.rk-solo-fin .rk-ranking') })`).then(JSON.parse);
  console.log(`${/\d+\/100/.test(rk.pts) && rk.count && rk.table ? '✓' : '✗'} playing solo: the score (${rk.pts}), ¿quieres que cuente? and the solo table`);
}
console.log('result:', await b.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-sub').textContent`));
console.log('the word:', await b.evaluate(`document.getElementById('result-words').innerText.replace(/\\n/g,' · ')`));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
