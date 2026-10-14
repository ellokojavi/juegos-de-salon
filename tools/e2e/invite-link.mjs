// Whoever arrives by a room link can only join that room: no creating another one.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
const OUT = output();
const BASE = process.argv[3] || process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const b = await launch({ port: 9484, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const GAMES = ['toque-y-fama', 'batalla-naval', 'linea-de-tiempo', 'ahorcado', 'dudo'];
const CODE = 'ZQTE';

const screen = () => b.evaluate(`(()=>{
  const acc = [...document.querySelectorAll('#setup-actions .btn')].map(x=>x.textContent.trim());
  const code = document.querySelector('#setup-actions input.code');
  return JSON.stringify({
    screen: document.querySelector('.screen.active')?.id,
    title: document.querySelector('#screen-setup h2')?.textContent,
    buttons: acc,
    create: acc.some(t=>/crear|create/i.test(t)),
    invitation: document.querySelector('#setup-actions .lead')?.textContent || '',
    code: code ? code.value : null,
    readOnly: code ? code.readOnly : null,
  })})()`).then(JSON.parse);

for (const game of GAMES) {
  await b.go(`${BASE}/${game}/`, 1200); await b.evaluate(`localStorage.clear(); 1`);
  // with a link: only join
  await b.go(`${BASE}/${game}/?room=${CODE}`, 1800);
  const guest = await screen();
  console.log(`${game} with a link →`, JSON.stringify(guest));
  if (guest.create) console.log('  ⚠️ still offers to create a room');
  await b.shot(`invite-${game}`);
  // without a link: the several-phones mode still offers to create
  await b.go(`${BASE}/${game}/`, 1500);
  await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(500);
  const normal = await screen();
  console.log(`${game} without a link →`, JSON.stringify({ create: normal.create, buttons: normal.buttons, readOnly: normal.readOnly }));
}
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
