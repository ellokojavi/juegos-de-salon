// Dos celulares: dos instancias de Chrome (orígenes distintos → localStorage separado) contra Firebase real.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const A = await launch({ port: 9424, dir: `${OUT}/pA`, out: OUT });
const B = await launch({ port: 9425, dir: `${OUT}/pB`, out: OUT });
await A.go('http://localhost:8765/toque-y-fama/'); await A.evaluate(`localStorage.clear(); 1`); await A.go('http://localhost:8765/toque-y-fama/');
await B.go('http://127.0.0.1:8765/toque-y-fama/'); await B.evaluate(`localStorage.clear(); 1`); await B.go('http://127.0.0.1:8765/toque-y-fama/');
// A crea sala
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300); await A.shot('20-setup-online');
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await A.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`); await sleep(4000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala creada:', code, 'screen A:', await A.active()); await A.shot('21-lobby-A');
// B se une por URL con ?sala=
await B.go(`http://127.0.0.1:8765/toque-y-fama/?sala=${code}`, 1500); await B.shot('22-join-B');
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(b=>/Unirse|Join/.test(b.textContent)).click(); 1`); await sleep(4000);
console.log('B screen:', await B.active(), 'A screen:', await A.active()); await A.shot('23-lobby-A-joined'); await B.shot('23-secret-B');
// Secretos
await sleep(1500);
console.log('A secret:', await A.typeNum('1234')); await sleep(1000); await A.shot('24-waiting-A');
console.log('B secret:', await B.typeNum('5678')); await sleep(3500);
console.log('A:', JSON.stringify(await A.view()), '\nB:', JSON.stringify(await B.view()));
await A.shot('25-play-A'); await B.shot('25-play-B');
// Turnos alternados hasta terminar
let guard = 0;
while (guard++ < 16) {
  const vA = await A.view(); if (!vA || vA.phase === 'done') break;
  const dev = vA.expected === 'A' ? A : B;
  const role = vA.expected;
  if (!(await dev.hasPad())) { await sleep(800); continue; }
  const mine = await dev.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${role}').length`);
  const guess = role === 'A' ? (mine === 0 ? '5687' : '5678') : (mine === 0 ? '1243' : '1234');
  console.log('turn', role, '→', guess, await dev.typeNum(guess));
  await sleep(3500);
  if (guard === 2) {
    await A.shot('26-mid-A'); await B.shot('26-mid-B');
    // Reconexión a mitad de partida: A recarga y debe retomar con su secreto
    await A.go(`http://localhost:8765/toque-y-fama/?sala=${code}`, 6000);
    console.log('A tras recargar a mitad:', await A.active(), JSON.stringify(await A.view()), 'secreto guardado:', await A.evaluate(`!!__tyf.session()?.secrets?.A`));
    await A.shot('26-reloaded-A');
  }
}
await sleep(4000);
console.log('final A:', await A.active(), await A.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
console.log('final B:', await B.active(), await B.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
await A.shot('27-result-A'); await B.shot('27-result-B');
// Revancha: B propone, A acepta automáticamente
await B.evaluate(`document.querySelector('#result-actions .btn').click(); 1`); await sleep(7000);
console.log('rematch → A:', await A.active(), JSON.stringify(await A.view()), 'code A:', await A.evaluate(`__tyf.session().code`));
console.log('rematch → B:', await B.active(), JSON.stringify(await B.view()), 'code B:', await B.evaluate(`__tyf.session().code`));
await A.shot('28-rematch-A'); await B.shot('28-rematch-B');
// En la sala nueva: B propuso (es A ahora), A entró como B. Juegan secretos y un turno.
console.log('new-room roles → A:', await A.evaluate(`__tyf.session().role`), 'B:', await B.evaluate(`__tyf.session().role`));
console.log('secret A2:', await A.typeNum('2468'), 'secret B2:', await B.typeNum('1357')); await sleep(3500);
const v2 = await A.view(); console.log('new game view:', JSON.stringify(v2));
const dev2 = (v2.expected === (await A.evaluate(`__tyf.session().role`))) ? A : B;
console.log('first turn in new room:', await dev2.typeNum('9876')); await sleep(3500);
console.log('guesses A:', await A.evaluate(`JSON.stringify(__tyf.match().guesses)`), '\nguesses B:', await B.evaluate(`JSON.stringify(__tyf.match().guesses)`));
await A.shot('29-newgame-A'); await B.shot('29-newgame-B');
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs), '\nerrors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();
