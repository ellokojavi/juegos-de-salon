// Two phones: two Chrome instances (different origins → separate localStorage) against real Firebase.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each one serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
// The other phone comes in through 127.0.0.1: another origin, another localStorage
const SITE_B = SITE.replace('localhost', '127.0.0.1');
const OUT = output();
const A = await launch({ port: 9424, dir: `${OUT}/pA`, out: OUT });
const B = await launch({ port: 9425, dir: `${OUT}/pB`, out: OUT });
await A.go(`${SITE}/bulls-and-cows/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${SITE}/bulls-and-cows/`);
await B.go(`${SITE_B}/bulls-and-cows/`); await B.evaluate(`localStorage.clear(); 1`); await B.go(`${SITE_B}/bulls-and-cows/`);
// A creates a room
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300); await A.shot('20-setup-online');
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await A.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`); await sleep(4000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('room created:', code, 'screen A:', await A.active()); await A.shot('21-lobby-A');
// B joins by URL with ?room=
await B.go(`${SITE_B}/bulls-and-cows/?room=${code}`, 1500); await B.shot('22-join-B');
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(b=>/Unirse|Join/.test(b.textContent)).click(); 1`); await sleep(4000);
console.log('B screen:', await B.active(), 'A screen:', await A.active()); await A.shot('23-lobby-A-joined'); await B.shot('23-secret-B');
// Secrets
await sleep(1500);
console.log('A secret:', await A.typeNum('1234')); await sleep(1000); await A.shot('24-waiting-A');
console.log('B secret:', await B.typeNum('5678')); await sleep(3500);
console.log('A:', JSON.stringify(await A.view()), '\nB:', JSON.stringify(await B.view()));
await A.shot('25-play-A'); await B.shot('25-play-B');
// Both at once (D-367): A cracks it on the first guess, B on the second, so A waits for B and wins
const plan = { A: ['5678'], B: ['1243', '1234'] };
let guard = 0, waitedOk = false;
while (guard++ < 20) {
  const vA = await A.view(); if (!vA || vA.phase !== 'play') break;
  for (const [role, dev] of [['A', A], ['B', B]]) {
    if (!(await dev.hasPad())) continue;
    const mine = await dev.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${role}').length`);
    const guess = plan[role][mine]; if (!guess) continue;
    console.log('guess', role, '→', guess, await dev.typeNum(guess));
  }
  await sleep(3500);
  const who = await A.evaluate(`document.getElementById('status-who')?.textContent`);
  if (/sacaste|cracked/.test(who || '') && !waitedOk) { waitedOk = true; console.log('A waits for B:', who); await A.shot('26-waiting-A'); await B.shot('26-mid-B'); }
  if (guard === 1) {
    // Reconnection mid-game: B reloads and must resume with its secret
    await B.go(`${SITE_B}/bulls-and-cows/?room=${code}`, 6000);
    console.log('B after reloading mid-game:', await B.active(), JSON.stringify(await B.view()), 'secret saved:', await B.evaluate(`!!__tyf.session()?.secrets?.B`));
  }
}
if (!waitedOk) console.log('✗ A never showed the waiting screen after cracking it');
await sleep(4000);
const fin = await A.view();
if (fin.phase !== 'done' || fin.winner !== 'A') console.log('✗ expected A to win with fewer guesses:', JSON.stringify(fin));
console.log('final A:', await A.active(), await A.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
console.log('final B:', await B.active(), await B.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
await A.shot('27-result-A'); await B.shot('27-result-B');
// Rematch: B proposes, A accepts automatically
await B.evaluate(`document.querySelector('#result-actions .btn').click(); 1`); await sleep(7000);
console.log('rematch → A:', await A.active(), JSON.stringify(await A.view()), 'code A:', await A.evaluate(`__tyf.session().code`));
console.log('rematch → B:', await B.active(), JSON.stringify(await B.view()), 'code B:', await B.evaluate(`__tyf.session().code`));
await A.shot('28-rematch-A'); await B.shot('28-rematch-B');
// In the new room: B proposed (it's A now), A came in as B. They play secrets and one turn.
console.log('new-room roles → A:', await A.evaluate(`__tyf.session().role`), 'B:', await B.evaluate(`__tyf.session().role`));
console.log('secret A2:', await A.typeNum('2468'), 'secret B2:', await B.typeNum('1357')); await sleep(3500);
const v2 = await A.view(); console.log('new game view:', JSON.stringify(v2));
if (!v2.parallel) console.log('✗ the rematch room is not simultaneous');
console.log('both guess at once in new room:', await A.typeNum('9876'), await B.typeNum('9875')); await sleep(3500);
console.log('guesses A:', await A.evaluate(`JSON.stringify(__tyf.match().guesses)`), '\nguesses B:', await B.evaluate(`JSON.stringify(__tyf.match().guesses)`));
await A.shot('29-newgame-A'); await B.shot('29-newgame-B');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs), '\nerrors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();
