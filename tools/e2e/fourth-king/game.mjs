// Fourth King end to end: the whole deck up to the fourth king, the sound button
// and English. Shots are named after the README screenshots
// (docs/capturas.json), so `python3 tools/release/readme.py screenshots cuarto-rey` redoes them.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ port: 9341, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
const taken = new Set();
const shot = async name => { if (!taken.has(name)) { taken.add(name); await b.shot(name); } };

const GENDERS = ['m', 'f', 'm', 'f']; // Javi, Cata, Pancho, Fran
const play = async (names, tableShot) => {
  await ev(`document.getElementById('btn-go-setup').click(); 1`); await sleep(300);
  await shot('03-players');
  // The remembered table may bring more rows than names (the migration below leaves five): the
  // extra ones are removed before filling, so none goes in empty or as "undefined".
  await ev(`(()=>{const n=${names.length};const rows=()=>document.querySelectorAll('#players-form .player-row');while(rows().length>n){const d=[...rows()].at(-1).querySelector('.del');if(d.disabled)break;d.click();}while(rows().length<n&&!document.getElementById('btn-add-player').disabled)document.getElementById('btn-add-player').click();return 1})()`);
  await ev(`(()=>{const n=${JSON.stringify(names)};[...document.querySelectorAll('#players-form input')].forEach((inp,i)=>{inp.value=n[i];inp.dispatchEvent(new Event('input',{bubbles:true}));});return 1})()`);
  // Gender is set too: the remembered table (the migration) brings others, and the English
  // screenshot would come out with "Javi ♀" and "Pancho ⚧".
  await ev(`(()=>{const g=${JSON.stringify(GENDERS)};[...document.querySelectorAll('#players-form .player-row')].forEach((f,i)=>f.querySelector('.gender button[data-g="'+g[i%g.length]+'"]').click());return 1})()`);
  await ev(`document.getElementById('btn-start').click(); 1`); await sleep(500);
  const table = await ev(`JSON.stringify(__cuartoRey.state().players.map(p=>p.name))`);
  const genders = await ev(`__cuartoRey.state().players.map(p=>p.gender).join('')`);
  const expected = names.map((_, i) => GENDERS[i % GENDERS.length]).join('');
  console.log(genders === expected ? `✓ the genders are the script's (${genders})` : `✗ the genders are not the script's: ${genders}, expected ${expected}`);
  console.log(table === JSON.stringify(names) ? `✓ the table is the script's ${names.length} names` : `✗ the table is not the script's names: ${table}`);
  await shot(tableShot);
};

await b.go(`${SITE}/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITE}/`);
console.log('menu sound btn:', await ev(`document.querySelector('.sound-toggle')?.textContent`));
await ev(`document.querySelector('.sound-toggle').click(); 1`);
console.log('after toggle:', await ev(`document.querySelector('.sound-toggle').textContent + ' muted=' + localStorage.getItem('juegos-de-salon:muted')`));
await ev(`document.querySelector('.sound-toggle').click(); 1`);

await b.go(`${SITE}/labs/fourth-king/`);
console.log('game sound btn:', await ev(`document.querySelector('.sound-toggle')?.textContent`), 'audio ctx ok:', await ev(`typeof AudioContext`));
await shot('02-intro');
await play(['Javi', 'Cata', 'Pancho', 'Fran'], '04-table');

let handoffTested = false;
for (let i = 0; i < 60; i++) {
  const active = await ev(`document.querySelector('.screen.active').id`);
  if (active !== 'screen-play') break;
  await ev(`document.getElementById('card').click(); 1`); await sleep(1300);
  const kind = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.current?.card?.rank`);
  // The fourth king is the only one announced big, with confetti and no "next" button.
  // Freshly launched confetti covers the card, the names and the instruction: wait for it to
  // finish (3.5 s), because in headless Chrome it falls slower and halfway through covers the text.
  // The screen waits for the player's tap, so it doesn't move on by itself.
  if (await ev(`!!document.querySelector('#result .display--lg')`)) { await sleep(3000); await shot('09-fourth-king'); }
  else if (await ev(`!!document.querySelector('#result .helper')`)) await shot('06-minigame');
  else if (['A', '2', '3', '10', 'J', 'Q'].includes(kind)) await shot('05-card');
  if (kind === '4') { await ev(`[...document.querySelectorAll('#result .helper button')][0].click(); 1`); await sleep(1500); }
  if (kind === '5' || kind === '7') { await ev(`[...document.querySelectorAll('#result button')].find(b=>/Otra/.test(b.textContent)).click(); 1`); }
  const ok = await ev(`(()=>{const res=document.getElementById('result');const btns=[...res.querySelectorAll('button')];let b=btns.find(x=>/siguiente|Cumplida|Nadie perdió|Ver el resultado/i.test(x.textContent));if(!b&&'${kind}'==='8'){const pk=res.querySelectorAll('.picker button');pk[0].click();pk[1].click();b=btns.find(x=>/Regalados/.test(x.textContent));}if(!b)return 'NO BUTTON';b.click();return 'ok'})()`);
  if (ok !== 'ok') { console.log('FAIL at', kind, ok); break; }
  await sleep(200);
  if ((await ev(`document.getElementById('handoff').hidden`)) === false) {
    // The handoff is a single screen (C-9): on top "¡Salud!" with who drinks, below "pásale el
    // celular a X" with its button. Only the button advances: neither a tap outside it nor time (D-213).
    // Only a "¡Salud!" with people drinking will do: the same .cheers block also says
    // "¡Cumplida!" without chips, and that shot doesn't illustrate the screenshot caption ("¡Salud!").
    if (await ev(`document.querySelectorAll('#handoff .drinkers .chip').length > 1`)) await shot('07-cheers');
    await shot('08-pass');
    if (!handoffTested) {
      handoffTested = true;
      await ev(`document.getElementById('handoff').click(); 1`); await sleep(3200);
      const stays = await ev(`!document.getElementById('handoff').hidden && !!document.querySelector('#handoff .next-name')`);
      console.log(stays ? '✓ the handoff stays on screen after a tap outside the button and 3 s' : '✗ the handoff closed without tapping the button (C-9)');
    }
    await ev(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(450);
  }
}
await sleep(600);
const final = await ev(`document.querySelector('.screen.active').id`);
if (final === 'screen-end') {
  const cr = await ev(`JSON.stringify({ finished: __cuartoRey.state().finished, kings: __cuartoRey.state().kings, screen: __cuartoRey.screen() })`);
  console.log('__cuartoRey hook:', cr);
  if (!/"finished":true/.test(cr) || !/"kings":4/.test(cr)) console.log('✗ the hook does not see the game finished on the fourth king');
  await sleep(4200); // the confetti lasts 4 s and would cover the ranking and the whole list
  await shot('10-final');
  // The history (CR-18) is folded: it's opened for the screenshot and to count whether it logged every card.
  await ev(`(()=>{const d=document.getElementById('end-history');d.open=true;d.scrollIntoView({block:'start'});return 1})()`); await sleep(400);
  console.log('history:',
    await ev(`document.querySelectorAll('#history-list li').length`), 'of',
    await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.drawn`), 'cards | first:',
    await ev(`document.querySelector('#history-list li')?.innerText.replace(/\\n/g, ' · ')`), '| last:',
    await ev(`[...document.querySelectorAll('#history-list li')].at(-1)?.innerText.replace(/\\n/g, ' · ')`));
  await shot('13-history');
}
console.log('final screen:', final, '| screenshots:', [...taken].sort().join(' '));

// ---- the remembered table migrates from juegos-de-salon:players to createNameStore (C-6) ----
await b.go(`${SITE}/labs/fourth-king/`);
await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:players', JSON.stringify([{name:'Ana',gender:'f'},{name:'Beto',gender:'m'},{name:'Cami',gender:'x'},{name:'Dani',gender:'f'},{name:'Eli',gender:'m'}])); 1`);
await b.go(`${SITE}/labs/fourth-king/`);
await ev(`document.getElementById('btn-go-setup').click(); 1`); await sleep(300);
const migrated = await ev(`JSON.stringify({ rows: [...document.querySelectorAll('#players-form input')].map(i=>i.value), genders: [...document.querySelectorAll('#players-form .gender .on')].map(x=>x.dataset.g).join(''), newStore: JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:names')||'[]').length, oldStore: localStorage.getItem('juegos-de-salon:players') })`);
console.log('migrated table:', migrated);
console.log(migrated === JSON.stringify({ rows: ['Ana', 'Beto', 'Cami', 'Dani', 'Eli'], genders: 'fmxfm', newStore: 5, oldStore: null })
  ? '✓ the old table migrated to juegos-de-salon:cuarto-rey:names' : '✗ the old table did not migrate whole');

// ---- English: the menu toggle rules every screen (C-3) ----
await b.go(`${SITE}/`); await ev(`localStorage.removeItem('juegos-de-salon:cuarto-rey:session'); 1`);
await ev(`document.querySelector('.lang-toggle button[lang=en]').click(); 1`); await sleep(1200);
console.log('menu in English:', await ev(`document.querySelector('.game-card')?.innerText.replace(/\\n/g,' | ')`));
await shot('11-menu-en');
await b.go(`${SITE}/labs/fourth-king/`);
await play(['Javi', 'Cata', 'Pancho', 'Fran'], '12-table-en');
console.log('table in English:', await ev(`[...document.querySelectorAll('#screen-play .deck-count, #screen-play .tap')].map(x=>x.textContent.trim()).join(' | ')`));

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs));
b.close();
