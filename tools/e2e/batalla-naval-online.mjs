// Batalla Naval, dos celulares: dos instancias de Chrome contra Firebase real
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const A = await launch({ port: 9422, dir: `${OUT}/pA`, out: OUT });
const B = await launch({ port: 9423, dir: `${OUT}/pB`, out: OUT });
const bv = d => d.evaluate(`JSON.stringify(window.__bn.view())`).then(JSON.parse);
const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>/${re}/.test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const tapCell = (d, grid, name) => d.evaluate(`(()=>{const r=parseInt('${name}'.slice(1))-1,c='ABCDEFGHIJ'.indexOf('${name}'[0]);const x=document.querySelector('${grid} .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const fireAt = async (d, name) => { await tapCell(d, '#enemy-grid', name); const r = await click(d, '#fire-btn'); await sleep(300); return r; };
const shipCells = (d, role) => d.evaluate(`(()=>{const L=__bn.session().layouts['${role}'].layout;const S={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2};const out=[];for(const [id,p] of Object.entries(L)){for(let i=0;i<S[id];i++){const r=p.dir==='h'?p.r:p.r+i,c=p.dir==='h'?p.c+i:p.c;out.push('ABCDEFGHIJ'[c]+(r+1))}}return JSON.stringify(out)})()`).then(JSON.parse);
const missCell = async (d, role) => { const cells = await shipCells(d, role); for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) { const n = 'ABCDEFGHIJ'[c] + (r + 1); if (!cells.includes(n)) return n; } };

await A.go('http://localhost:8765/batalla-naval/'); await A.evaluate(`localStorage.clear(); 1`); await A.go('http://localhost:8765/batalla-naval/');
await B.go('http://127.0.0.1:8765/batalla-naval/'); await B.evaluate(`localStorage.clear(); 1`);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(300); await A.shot('20-setup-online');
await A.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await clickText(A, '#setup-actions .btn', 'Crear'); await sleep(4000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| A:', await A.active()); await A.shot('21-lobby');
await B.go(`http://127.0.0.1:8765/batalla-naval/?sala=${code}`, 1500);
await B.evaluate(`(()=>{document.querySelector('#setup-form input').value='Cata';return 1})()`);
await clickText(B, '#setup-actions .btn', 'Unirse'); await sleep(4000);
console.log('tras unirse → A:', await A.active(), 'B:', await B.active());
// flotas al azar
await clickText(A, '#place-actions .btn', 'azar'); await click(A, '#place-sail .btn'); await sleep(1500); await A.shot('22-waiting-fleet-A');
console.log('A esperando:', await A.evaluate(`document.getElementById('place-status').textContent`));
await clickText(B, '#place-actions .btn', 'azar'); await click(B, '#place-sail .btn'); await sleep(3500);
console.log('A:', JSON.stringify(await bv(A)), '\nB:', JSON.stringify(await bv(B)));
await A.shot('23-play-A'); await B.shot('23-play-B');
// B parte: falla; A falla; luego B hunde todo con tiro extra (conoce la flota de A a través de A)
const targetsA = await shipCells(A, 'A'); const targetsB = await shipCells(B, 'B');
console.log('B agua:', await fireAt(B, await missCell(A, 'A'))); await sleep(3000);
console.log('turno →', (await bv(A)).shooter);
console.log('A agua:', await fireAt(A, await missCell(B, 'B'))); await sleep(3000);
// reconexión de B a mitad de partida
await B.go(`http://127.0.0.1:8765/batalla-naval/?sala=${code}`, 6000);
console.log('B tras recargar:', await B.active(), JSON.stringify(await bv(B)), '| flota guardada:', await B.evaluate(`!!__bn.session()?.layouts?.B`));
await B.shot('24-reloaded-B');
let guard = 0;
for (const t of targetsA) {
  const v = await bv(B); if (v.phase !== 'play') break;
  if (v.shooter !== 'B') { console.log('turno inesperado', v.shooter); break; }
  const r = await fireAt(B, t); if (r !== 'ok') { console.log('fallo disparo', t, r); break; }
  await sleep(2500);
  if (++guard === 3) { await A.shot('25-mid-A'); await B.shot('25-mid-B'); }
}
await sleep(6000);
console.log('final A:', await A.active(), await A.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + [...document.querySelectorAll('#result-fleets small')].map(x=>x.textContent).join(' / ')`));
console.log('final B:', await B.active(), await B.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent`));
await A.shot('26-result-A'); await B.shot('26-result-B');
// revancha propuesta por A (perdedor); B se une sola
await click(A, '#result-actions .btn'); await sleep(8000);
console.log('rematch → A:', await A.active(), JSON.stringify(await bv(A)), 'code:', await A.evaluate(`__bn.session().code`), 'rol:', await A.evaluate(`__bn.session().role`));
console.log('rematch → B:', await B.active(), JSON.stringify(await bv(B)), 'code:', await B.evaluate(`__bn.session().code`), 'rol:', await B.evaluate(`__bn.session().role`));
console.log('errors A:', JSON.stringify(A.errors), JSON.stringify(A.logs), '\nerrors B:', JSON.stringify(B.errors), JSON.stringify(B.logs));
A.close(); B.close();
