// Liar's Dice end to end, the 📜 classic rules (D-487, D-490): the folded Variants row, the
// open obligada round (its notice, the rivals' dice face up, your own as ❓), the one-time calzar
// hint, against the phone and with three players on one phone. For everyone since D-495.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: +(process.env.WIDTH || 390) });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
const screen = () => ev(`document.querySelector('.screen.active').id`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const proceed = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);
const bid = face => ev(`(()=>{const p=[...document.querySelectorAll('.pinta')].filter(x=>!x.disabled&&!x.getAttribute("aria-disabled"));if(!p.length)return 'no';(p[${face}]||p[0]).click();const ok=document.querySelector('#actions .btn--yellow');if(!ok||ok.disabled)return 'no';ok.click();return 'ok'})()`);
const doubt = () => ev(`(()=>{const b=document.querySelector('#actions .btn-row .btn');if(!b)return 'no';b.click();return 'ok'})()`);
const toggle = label => ev(`[...document.querySelectorAll('#setup-form .toggle-row')].find(r=>r.textContent.includes(${JSON.stringify(label)}))?.querySelector('.switch')?.click(), 1`);
let fails = 0;
const check = (ok, what) => { console.log(ok ? '✓' : '✗', what); if (!ok) fails++; };

async function setup(mode, names) {
  await b.go(`${SITE}/liars-dice/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITE}/liars-dice/`); await sleep(900);
  await ev(`document.querySelectorAll('.mode')[${mode}].click(); 1`); await sleep(300);
  for (let i = 2; i < names.length; i++) { await ev(`document.querySelector('#setup-actions .btn--ghost').click(); 1`); await sleep(100); }
  await ev(`(()=>{const n=${JSON.stringify(names)};[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
  check(await ev(`document.querySelector('#setup-form details.variants').hidden`), 'the Variants row is hidden until the classic rules are on');
  await toggle('📜'); await toggle('🫨');
  check(!(await ev(`document.querySelector('#setup-form details.variants').hidden`)), 'with the classic rules on, the Variants row shows, folded');
}

/** Plays until `until()` is true or the game ends; returns what it saw along the way. */
async function play(until, max = 400) {
  const seen = { obligadaNotice: 0, hidden: 0, faces: 0, calzarHint: 0 };
  for (let k = 0; k < max && (await screen()) !== 'screen-result'; k++) {
    if (await overlay()) {
      // Playtest: no die may sit under an overlay that is not the reveal (the pass screen, the notices)
      if (await ev(`!document.querySelector('#handoff .reveal') && !!document.querySelector('#mine .die, #rivals .die, #bid-board .die')`)) {
        seen.diceUnder = (seen.diceUnder || 0) + 1;
        if (seen.diceUnder === 1) await b.shot('dice-under-overlay');
      }
      if (await ev(`!!document.querySelector('#handoff .obligada-notice')`)) {
        seen.obligadaNotice++;
        if (seen.obligadaNotice === 1) await b.shot('obligada-notice');
      }
      await proceed(); await sleep(250); continue;
    }
    if (!(await ev(`!!document.querySelector('#actions .btn')`))) { await sleep(250); continue; }
    const v = await ev(`(()=>{const v=window.__dudo.view();return {ob:v.obligada,can:v.canCalzar}})()`);
    if (v.ob) {
      if (await ev(`!!document.querySelector('#mine .hidden-die') && !document.querySelector('#mine .die:not(.hidden-die)')`)) seen.hidden++;
      if (await ev(`!!document.querySelector('#rivals .rival.seen .die:not(.hidden-die)')`)) seen.faces++;
      if (await ev(`(()=>{const q=document.querySelector('#rivals .die--sm.hidden-die');return !!q&&q.getBoundingClientRect().width>=24})()`)) seen.ownStrip = (seen.ownStrip || 0) + 1;
      // One ❓ in the strip per die you hold (rooms playtest: three dice showed a single ❓)
      if (await ev(`(()=>{const v=window.__dudo.view();const i=window.__dudo.match().players.indexOf(v.current);const x=document.querySelectorAll('#rivals .rival')[i];return !!x&&x.querySelectorAll('.hidden-die').length!==v.st[v.current].dice})()`)) seen.stripBad = (seen.stripBad || 0) + 1;
      if (seen.hidden === 1) await b.shot('obligada-table');
      // A face the obligada round closes says why, under the faces (playtest)
      if (await ev(`!!document.querySelector('.pinta.closed') && !!document.querySelector('#actions .face-why')`)) {
        if (!seen.obligadaWhy) await b.shot('obligada-why');
        seen.obligadaWhy = (seen.obligadaWhy || 0) + 1;
      }
    }
    if (await ev(`!!document.querySelector('#actions .calzar-hint.one-die')`)) { if (!seen.oneDie) await b.shot('calzar-one-die'); seen.oneDie = (seen.oneDie || 0) + 1; }
    if (await ev(`!!document.querySelector('#actions .calzar-hint')`)) { if (!seen.calzarHint) await b.shot('calzar-hint'); seen.calzarHint++; }
    if (until && (await until(seen))) return seen;
    const r = k % 3 === 2 ? await doubt() : await bid(0);
    if (r === 'no') await doubt();
    await sleep(250);
  }
  return seen;
}

/* ---------- Against the phone: a duel, obligada with two players left ---------- */
await setup(2, ['Javi']);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(600);
check(await ev(`window.__dudo.match().config.traditional === true`), 'the classic rules travel in the config');
const duel = await play(null);
check(duel.obligadaNotice > 0, `the obligada round is announced in a duel (${duel.obligadaNotice} times)`);
check(duel.hidden > 0, 'in the obligada round your own die shows as ❓');
check(duel.faces > 0, "in the obligada round the phone's die shows face up");
check(duel.ownStrip > 0, 'in the obligada round your own ❓ in the strip is die-sized');

/* ---------- Against the phone with Pasar on: a pass is a play, the game goes on (playtest, the bot's pass froze it) ---------- */
await setup(2, ['Javi']);
await ev(`(()=>{const r=document.querySelector('#setup-form details.variants .toggle-row');r.querySelector('.switch').click();return 1})()`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(600);
check(await ev(`window.__dudo.match().config.pasar === true`), 'Pasar travels in the config');
await play(null);
check(await screen() === 'screen-result', 'with Pasar on, a game against the phone reaches the end');

/* ---------- Three on one phone ---------- */
await setup(0, ['Javi', 'Cata', 'Nico']);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(500);
const tres = await play(null, 700);
check(tres.obligadaNotice > 0, 'three on one phone: the obligada round is announced');
check(tres.hidden > 0 && tres.faces > 0, "three on one phone: the others' dice face up, your own as ❓");
check(tres.calzarHint > 0, 'the first time calzar opens, a line says what it is');
check(duel.obligadaWhy > 0 || tres.obligadaWhy > 0, 'in the obligada round, a closed face says why under the faces');
check(!tres.stripBad && !duel.stripBad, `in the obligada round your strip shows one ❓ per die you hold (${(tres.stripBad || 0) + (duel.stripBad || 0)} wrong)`);
check(!tres.diceUnder, `three on one phone: no die under the pass screen or a notice (${tres.diceUnder || 0})`);
console.log(`  (calzar opened by one die, with its reason: ${(duel.oneDie || 0) + (tres.oneDie || 0)} times)`);

/* ---------- Three on one phone, Pasar and the siciliana on: the reasons a first-timer needs (playtest) ---------- */
await setup(0, ['Javi', 'Cata', 'Nico']);
await ev(`[...document.querySelectorAll('#setup-form details.variants .toggle-row .switch')].forEach(s=>s.click()), 1`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(500);
check(await ev(`window.__dudo.match().config.siciliana === true && window.__dudo.match().config.pasar === true`), 'Pasar and the siciliana travel in the config');
const toTurn = async () => { for (let k = 0; k < 20 && !(await ev(`!!document.querySelector('#actions .btn--yellow')`)); k++) { await proceed(); await sleep(300); } };
await toTurn();
// No opening in aces: the ace is closed, and the reason is there before and after tapping it
check(await ev(`document.querySelectorAll('.pinta')[0].classList.contains('closed') && document.querySelectorAll('.pinta')[0].getAttribute('aria-disabled')==='true'`), 'opening, the ace is closed by the rule');
const why = await ev(`document.querySelector('#actions .face-why')?.textContent || ''`);
check(/ases/.test(why), `opening, a line says why the ace is closed ("${why}")`);
await ev(`document.querySelectorAll('.pinta')[0].click(); 1`); await sleep(120);
check(await ev(`document.querySelector('#actions .face-why').classList.contains('pulse') && !window.__dudo.session().sel`), 'tapping the closed ace points at the reason and picks nothing');
await b.shot('no-ace-why');
await bid(1); await sleep(400);
await toTurn();
// Pasar: the button and its line say whether the hand allows it, or that passing is a bluff
const paso = await ev(`(()=>{const v=window.__dudo.view();const d=v.rolls[v.current].d;const c=Object.values(d.reduce((a,x)=>({...a,[x]:(a[x]||0)+1}),{})).sort().join();const ok=c==='1,1,1,1,1'||c==='5'||c==='2,3';const btn=document.querySelector('#actions .btn.paso');const line=document.querySelector('#actions .paso-why');return {ok,btn:btn?.textContent,can:btn?.classList.contains('can'),line:line?.textContent}})()`);
check(paso.btn && paso.can === paso.ok, `the pass button matches the hand (${paso.ok ? 'can pass' : 'bluff'}: "${paso.btn}")`);
check(paso.ok ? /Tienes mano/.test(paso.line) : /farol/.test(paso.btn) && /farol/.test(paso.line), `the line under it says so ("${paso.line}")`);
await b.shot('pass-button');
await ev(`document.querySelector('#actions .btn.paso').click(); 1`); await sleep(400);
await toTurn();
await doubt(); await sleep(700);
check(await ev(`!!document.querySelector('#handoff .reveal .exact')`), "a doubted pass reveals the passer's hand and its verdict");
await b.shot('doubted-pass');
await proceed(); await sleep(400);
// The siciliana: a fresh game, the first bid doubted, and the reveal says why two dice go
await setup(0, ['Javi', 'Cata', 'Nico']);
await ev(`[...document.querySelectorAll('#setup-form details.variants .toggle-row .switch')][1].click(), 1`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(500);
await toTurn(); await bid(5); await sleep(400); await toTurn(); await doubt(); await sleep(700);
const sic = await ev(`document.querySelector('#handoff .siciliana-why')?.textContent || ''`);
check(/Primera apuesta/.test(sic), `doubting the game's first bid, the reveal says why two dice go ("${sic}")`);
await b.shot('siciliana-why');
// The pass screen is opaque: no fade from transparent shows the table through it
await proceed(); await sleep(400);
check(await ev(`(()=>{const h=document.getElementById('handoff');return !h.hidden&&getComputedStyle(h).animationName==='none'&&!document.querySelector('#bid-board').children.length&&!document.querySelector('#mine .die')})()`), 'the pass screen is opaque from its first frame, over an empty table');
await b.shot('pass-screen');

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
if (b.errors.length) fails++;
b.close();
if (fails) { console.log(`❌ ${fails} checks failed`); process.exit(1); }
