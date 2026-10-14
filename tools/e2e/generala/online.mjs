// Generala with two phones against real Firebase: room, turns with the current player's dice in
// view of the other, mid-game reconnection, a whole game and a rematch. Does not run in CI: it opens
// rooms in the production Firebase (tools/e2e/ci.mjs). Prints ✗ if anything fails.
//
// Each "phone" is a Chrome with its own profile and its own origin, so they don't share
// localStorage (see this folder's README).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const hosts = ['localhost', '127.0.0.1'].map(h => SITE.replace('localhost', h));
const A = await launch({ port: 9390, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9391, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const devs = { A, B };
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const screen = d => d.evaluate(`document.querySelector('.screen.active')?.id`);
const view = d => d.evaluate(`JSON.stringify((v=>v&&({current:v.current,roll:v.tiro,dice:v.dados,done:v.done,winners:v.winners,n:v.history.length,totals:Object.fromEntries(Object.entries(v.st).map(([r,x])=>[r,x.total]))}))(__generala.view()))`).then(JSON.parse);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const waitFor = async (fn, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(250); } return false; };

/* ---------------- Room ---------------- */
await A.go(`${hosts[0]}/generala/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${hosts[0]}/generala/`);
await A.evaluate(`document.querySelector('[data-mode=online]').click(); 1`); await sleep(400);
ok(await A.evaluate(`!!document.querySelector('#setup-form .switch')`), 'whoever creates the room chooses whether the served generala wins');
// Without the served one, so the game reaches all 11 rounds
await A.evaluate(`document.querySelector('#setup-form .switch').click(); 1`);
await setName(A, 'Javi');
await A.evaluate(`document.querySelector('#setup-actions .btn--yellow').click(); 1`);
await waitFor(() => A.evaluate(`!!document.querySelector('.code-big')`), 12000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
ok(/^[A-Z]{4}$/.test(code || ''), `room ${code}`);

// B joins through the invitation link, which is how it really arrives (RP-18)
await B.go(`${hosts[1]}/generala/?room=${code}`); await B.evaluate(`localStorage.clear(); 1`);
await B.go(`${hosts[1]}/generala/?room=${code}`); await sleep(1000);
ok(!(await B.evaluate(`!!document.querySelector('#setup-form .switch')`)), 'whoever arrives through the link does not see the settings');
await setName(B, 'Cata');
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse/i.test(x.textContent)).click(); 1`);
await waitFor(async () => (await screen(B)) === 'screen-lobby', 12000);
await waitFor(() => A.evaluate(`document.querySelectorAll('#lobby-box .lobby-players .p').length === 2`));
await A.shot('online-01-room');
await A.evaluate(`document.querySelector('#lobby-box .btn--yellow').click(); 1`);
ok(await waitFor(async () => (await screen(A)) === 'screen-play' && (await screen(B)) === 'screen-play'), 'both reach the table');

/* ---------------- Turns ---------------- */
const roleOf = { A: 'A', B: 'B' };
let sawDice = 0, otherRollButton = 0, reloaded = false, g = 0;
while (g++ < 60) {
  const v = await view(A);
  if (!v || v.done) break;
  const d = devs[v.current];
  const other = v.current === 'A' ? B : A;
  if (await other.evaluate(`!!document.getElementById('btn-tirar')`)) otherRollButton++;
  await d.evaluate(`document.getElementById('btn-tirar').click(); 1`);
  // The other one sees the current player's dice
  if (await waitFor(async () => JSON.stringify((await view(other))?.dice) === JSON.stringify((await view(d)).dice) && (await view(other)).roll === 1, 6000)) sawDice++;
  if (g === 3) await other.shot('online-02-watching');
  await d.evaluate(`document.querySelector('.casilla.libre').click(); 1`); await sleep(100);
  await d.evaluate(`document.getElementById('btn-anotar').click(); 1`);
  const n = v.n + 1;
  await waitFor(async () => (await view(A))?.n === n && (await view(B))?.n === n, 8000);
  if (!reloaded && n === 8) {
    // B reloads mid-game and goes back to the same room on its own (C-6)
    reloaded = true;
    await B.go(`${hosts[1]}/generala/?room=${code}`);
    ok(await waitFor(async () => (await screen(B)) === 'screen-play' && (await view(B))?.n === 8, 12000), 'B reloads and goes back to the same game, at the same point');
    ok(await B.evaluate(`__generala.session().role`) === roleOf.B, 'with the same role');
  }
}
ok(otherRollButton === 0, `whoever does not have the turn does not see the roll button (saw it ${otherRollButton} times)`);
ok(sawDice >= 20, `the other phone sees the current player's dice (${sawDice} of 22)`);
ok(await waitFor(async () => (await screen(A)) === 'screen-result' && (await screen(B)) === 'screen-result', 8000), 'both reach the end');
const end = await view(A);
ok(end.n === 22, `22 scores (${end.n})`);
console.log('end A →', await A.evaluate(`document.getElementById('result-title').textContent`), '· B →', await B.evaluate(`document.getElementById('result-title').textContent`), '·', JSON.stringify(end.totals));
await sleep(3800);
await A.shot('online-03-final');

/* ---------------- Rematch ---------------- */
await A.evaluate(`document.getElementById('btn-otra').click(); 1`);
await waitFor(async () => (await screen(A)) === 'screen-lobby', 12000);
await B.evaluate(`document.getElementById('btn-otra').click(); 1`);
ok(await waitFor(async () => (await screen(B)) === 'screen-lobby' && await B.evaluate(`document.querySelector('.code-big')?.textContent`) === await A.evaluate(`document.querySelector('.code-big')?.textContent`), 12000), 'the rematch opens another room and both join');
// The rematch room is closed: leaving on purpose deletes it (D-50)
await B.evaluate(`[...document.querySelectorAll('#lobby-box .btn--ghost')].pop().click(); 1`); await sleep(1500);
await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn--ghost')].pop().click(); 1`); await sleep(1500);

for (const [n, d] of Object.entries(devs)) {
  ok(!d.errors.length, `${n}: no errors on the page ${JSON.stringify(d.errors)}`);
  console.log(`${n} console:`, JSON.stringify(d.logs.filter(l => !/vibrate/i.test(l))));
  d.close();
}
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ generala online');
