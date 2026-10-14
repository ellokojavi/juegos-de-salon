// Cap of rooms per phone (C-7, D-41): past the limit, the game says so and doesn't touch the network.
// The history is seeded in localStorage instead of opening 20 real rooms against Firebase.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
// With several sessions at once, each serves its worktree on its own port (D-135)
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';

const OUT = output();
const b = await launch({ port: 9443, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });

const error = () => b.evaluate(`document.querySelector('#setup-error')?.textContent || ''`);

async function attempt(game, rooms, label) {
  await b.go(`${SITE}/${game}/`);
  await b.evaluate(`(()=>{
    localStorage.clear();
    const now = Date.now();
    const h = Array.from({length: ${rooms}}, (_, i) => now - (i + 1) * 1000);
    localStorage.setItem('juegos-de-salon:rooms-created', JSON.stringify(h));
    return 1;
  })()`);
  await b.go(`${SITE}/${game}/`);
  await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
  await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);

  const t0 = Date.now();
  await b.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`);
  for (let i = 0; i < 30 && !(await error()); i++) await sleep(200);
  const ms = Date.now() - t0;
  const text = await error();
  console.log(`${label} · with ${rooms} rooms → ${JSON.stringify(text)} (${ms} ms)`);
  return { text, ms };
}

// 20 is the cap per hour: with 19 you can still play.
const under = await attempt('toque-y-fama', 19, 'under the cap');
console.log('under the cap: no complaint →', under.text === '', '| screen:', await b.active());

const cap = await attempt('toque-y-fama', 20, 'at the cap');
await b.shot('room-cap');
console.log('at the cap: warns                 →', /muchas salas/.test(cap.text));
console.log('warns at once, without network    →', cap.ms < 2000);
console.log('stays on the setup screen         →', await b.active());

const tl = await attempt('linea-de-tiempo', 20, 'timeline');
const bs = await attempt('batalla-naval', 20, 'battleship');
const hm = await attempt('ahorcado', 20, 'hangman');
console.log('línea de tiempo →', /muchas salas/.test(tl.text));
console.log('batalla naval   →', /muchas salas/.test(bs.text));
console.log('el ahorcado     →', /muchas salas/.test(hm.text));
console.log('errors:', JSON.stringify(b.errors));
console.log('logs:', JSON.stringify(b.logs));
b.close();
