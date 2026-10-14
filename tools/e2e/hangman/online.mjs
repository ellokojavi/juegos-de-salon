// Hangman with three phones against real Firebase: chain, everyone guessing at once,
// mid-game reconnection and rematch.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const hosts = ['localhost', '127.0.0.1', '[::1]'].map(h => SITE.replace('localhost', h));
const A = await launch({ port: 9346, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9347, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9348, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const NAME = { A: 'Javi', B: 'Cata', C: 'Nico' };
/** Without this, a CDP that doesn't answer leaves the script silent and hung forever. */
const withTimeout = (promise, what, ms = 20000) => Promise.race([
  promise,
  new Promise((_, no) => setTimeout(() => no(new Error(`hung: ${what}`)), ms)),
]);
const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const v = d => d.evaluate(`(()=>{const s=window.__ahorcado.view();if(!s)return JSON.stringify({none:true});if(s.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:s.phase,done:s.done,current:s.current,
    st:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,{pattern:x.pattern,lives:x.lives,used:x.used.length,solved:x.solved,hanged:x.hanged,score:x.score}]))})})()`).then(JSON.parse);
const overlay = d => d.evaluate(`(()=>{const c=document.getElementById('cover'),h=document.getElementById('handoff');
  return !c.hidden?'cover':!h.hidden?'handoff:'+h.innerText.replace(/\\n/g,' ').slice(0,80):''})()`);
const tap = async (d, ms = 400) => {
  await d.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'none';const x=h.querySelector('button');if(x){x.click();return 'btn'}h.click();return 'tap'})()`);
  await sleep(ms);
};
const writeWord = async (d, word, hint) => {
  const r = await d.evaluate(`(()=>{const ins=[...document.querySelectorAll('#word-form input')];if(ins.length<2)return 'no-form';
    ins[0].value='${word}';ins[0].dispatchEvent(new Event('input',{bubbles:true}));
    ins[1].value='${hint}';ins[1].dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);
  if (r !== 'ok') return r;
  await click(d, '#word-actions .btn'); await sleep(1500);
  return 'ok';
};
/** Tries a letter on the phone of whoever is guessing it. No turns here: they play when they want. */
const playLetter = async (d, role, hit = true) => {
  const pick = await d.evaluate(`(()=>{const s=window.__ahorcado.view();const st=s.st['${role}'];
    if(!st||st.done||st.pending)return 'not-playing';
    const free=[...document.querySelectorAll('#keyboard button')].filter(k=>!k.disabled).map(k=>k.textContent);
    if(!free.length)return 'no-keys';
    // This phone does not know its own word (C-10): it plays like a person, by frequency
    const FREQ='EAOSRNILTCDUMPBGVYQHFZJXKWÑ';
    const chosen=${hit}?(FREQ.split('').find(l=>free.includes(l))||free[0]):(free[free.length-1]);
    const k=[...document.querySelectorAll('#keyboard button')].find(x=>x.textContent===chosen);
    if(!k)return 'no-key';k.click();return chosen})()`);
  if (pick.length > 1) return pick;
  await sleep(150);
  const c = await d.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];const x=bs[bs.length-1];
    if(!x||x.disabled)return 'no-confirm';x.click();return 'ok'})()`);
  if (c !== 'ok') return c;
  await sleep(1000);
  return pick;
};

for (const [i, k] of [[0, 'A'], [1, 'B'], [2, 'C']]) { await devs[k].go(hosts[i] + '/hangman/', 1800); await devs[k].evaluate(`localStorage.clear(); 1`); }
// A creates the room with a chain
await A.go(hosts[0] + '/hangman/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(500);
await setName(A, NAME.A);
await clickText(A, '#setup-form .seg--src button', 'Cadena|Chain|Corrente'); await sleep(150);
await clickText(A, '#setup-actions .btn', 'Crear|Create'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room:', code, '| screen A:', await A.active());
await A.shot('01-lobby-A');
// B and C join through the link
for (const [i, k] of [[1, 'B'], [2, 'C']]) {
  const d = devs[k];
  await d.go(`${hosts[i]}/hangman/?room=${code}`, 2200);
  await setName(d, NAME[k]);
  await clickText(d, '#setup-actions .btn', 'Unirse|Join'); await sleep(4500);
  console.log(`${k} joined → screen:`, await d.active(), '| role:', await d.evaluate(`window.__ahorcado.session().role`));
}
await sleep(2500);
console.log('in the room:', await A.evaluate(`[...document.querySelectorAll('.lobby-players .p')].map(x=>x.textContent).join(', ')`));
console.log('C has no start button:', await C.evaluate(`!!document.querySelector('#lobby-box .waiting')`));
await A.shot('02-lobby');
// A starts
await clickText(A, '#lobby-box .btn', 'Empezar|Start'); await sleep(4500);
for (const k of ['A', 'B', 'C']) console.log(`${k} after starting:`, await devs[k].active(), '| writes for:', await devs[k].evaluate(`document.getElementById('word-title').textContent`));
await A.shot('03-word');
// Each one writes for the next, all at once: here nobody covers the screen (D-53)
const WORDS = { A: ['CORDILLERA', 'La pared del este'], B: ['EMPANADA', 'Se pide de pino o de queso'], C: ['TERREMOTO', 'Tiembla o se toma'] };
await Promise.all(['A', 'B', 'C'].map(k => writeWord(devs[k], ...WORDS[k])));
await sleep(4000);
for (const k of ['A', 'B', 'C']) console.log(`${k} now playing:`, await devs[k].active(), '|', JSON.stringify((await v(devs[k])).phase));
await A.shot('04-play');
{
  // The flash also on several phones, where nothing blocks on purpose (D-56, D-63).
  // A is the one who opens the room, so the first turn is theirs.
  const l = await A.evaluate(`(()=>{const k=[...document.querySelectorAll('#keyboard button')].find(x=>!x.disabled);if(!k)return 'no';k.click();return k.textContent})()`);
  await sleep(150);
  await A.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];bs[bs.length-1].click();return 1})()`);
  await sleep(300);
  console.log('flash in the room:', await A.evaluate(`(()=>{const f=document.querySelector('.flash');if(!f)return 'none';window.__flash=f;return f.className+' · '+f.innerText.replace(/\\n/g,' ')})()`), '| letter:', l);
  await sleep(1100);
  console.log('that flash went away on its own:', await A.evaluate(`!!window.__flash && !document.contains(window.__flash)`));
}
console.log('the rivals strip shows no letters (D-55):', await A.evaluate(`[...document.querySelectorAll('#rivals .r')].map(x=>x.innerText.replace(/\\n/g,' ')).join(' | ')`));

// By turns: only whoever's turn it is plays, and the others watch with the keyboard locked (D-66)
let guard = 0, reloaded = false;
while (guard++ < 60) {
  const s = await withTimeout(v(A), 'state of A');
  if (s.done) break;
  const turn = s.current;
  if (!turn) { console.log('no turn assigned:', JSON.stringify(s)); break; }
  // Those whose turn it isn't cannot play
  if (guard === 1) {
    for (const k of ['A', 'B', 'C']) {
      // While it's someone else's turn there is no keyboard or bar: nothing to tap (D-66)
      const v = await devs[k].evaluate(`JSON.stringify({keyboard:!document.getElementById('keyboard').hidden,
        bar:document.getElementById('confirm').children.length>0, title:document.getElementById('status-who').textContent})`).then(JSON.parse);
      console.log(`  ${k}${k === turn ? ' (their turn)' : ''}: keyboard ${v.keyboard ? 'yes' : 'no'} · bar ${v.bar ? 'yes' : 'no'} · "${v.title}"`);
    }
  }
  const d = devs[turn];
  if (await withTimeout(overlay(d), `overlay of ${turn}`)) { await tap(d, 300); continue; }
  const r = await withTimeout(playLetter(d, turn, true), `move of ${turn}`, 30000);
  console.log(`round ${guard} → ${turn} plays: ${r} |`, ['A', 'B', 'C'].map(k => `${k} ${s.st[k].pattern} ${s.st[k].lives}❤`).join(' · '));
  for (const k of ['A', 'B', 'C']) if (await overlay(devs[k])) await tap(devs[k], 200);
  if (guard === 3 && !reloaded) {
    reloaded = true;
    await A.shot('05-mid-A');
    // C drops and comes back mid-game
    await C.go(`${hosts[2]}/hangman/?room=${code}`, 6000);
    console.log('C after reload:', await C.active(), '| role:', await C.evaluate(`window.__ahorcado.session()?.role`), '|', JSON.stringify((await v(C)).st?.C));
    await C.shot('05-reconnect-C');
  }
}
for (const k of ['A', 'B', 'C']) { for (let i = 0; i < 4; i++) await tap(devs[k], 400); }
await sleep(1500);
console.log('end as seen by A:', JSON.stringify(await v(A)));
console.log('end as seen by C:', JSON.stringify(await v(C)));
for (const k of ['A', 'B', 'C']) console.log(`${k} screen:`, await devs[k].active());
await sleep(2600); await A.shot('06-result');
console.log('result:', await A.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-ranking').innerText.replace(/\\n/g,' · ')`));
console.log('words verified (C-10):', await A.evaluate(`document.getElementById('result-words').innerText.replace(/\\n/g,' · ')`));
// Rematch: C proposes it and the others follow
await click(C, '#result-actions .btn'); await sleep(9000);
for (const k of ['A', 'B', 'C']) console.log(`${k} after rematch → screen:`, await devs[k].active(), '| room:', await devs[k].evaluate(`window.__ahorcado.session()?.code`), '| in room:', await devs[k].evaluate(`document.querySelectorAll('.lobby-players .p').length`));
for (const k of ['A', 'B', 'C']) console.log(`errors ${k}:`, JSON.stringify(devs[k].errors), JSON.stringify(devs[k].logs));
A.close(); B.close(); C.close();
