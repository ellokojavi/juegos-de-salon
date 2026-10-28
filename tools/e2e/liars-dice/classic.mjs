// Liar's Dice end to end, the 🧪 classic rules (lab, D-487, D-490): the folded Variants row, the
// open obligada round (its notice, the rivals' dice face up, your own as ❓), the one-time calzar
// hint, against the phone and with three players on one phone. localhost opens the lab by itself.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: +(process.env.WIDTH || 390) });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
const screen = () => ev(`document.querySelector('.screen.active').id`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const proceed = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);
const bid = face => ev(`(()=>{const p=[...document.querySelectorAll('.pinta')].filter(x=>!x.disabled);if(!p.length)return 'no';(p[${face}]||p[0]).click();const ok=document.querySelector('#actions .btn--yellow');if(!ok||ok.disabled)return 'no';ok.click();return 'ok'})()`);
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
  await toggle('🧪'); await toggle('🫨');
  check(!(await ev(`document.querySelector('#setup-form details.variants').hidden`)), 'with the classic rules on, the Variants row shows, folded');
}

/** Plays until `until()` is true or the game ends; returns what it saw along the way. */
async function play(until, max = 400) {
  const seen = { obligadaNotice: 0, hidden: 0, faces: 0, calzarHint: 0 };
  for (let k = 0; k < max && (await screen()) !== 'screen-result'; k++) {
    if (await overlay()) {
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
      if (seen.hidden === 1) await b.shot('obligada-table');
    }
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

/* ---------- Three on one phone ---------- */
await setup(0, ['Javi', 'Cata', 'Nico']);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(500);
const tres = await play(null, 700);
check(tres.obligadaNotice > 0, 'three on one phone: the obligada round is announced');
check(tres.hidden > 0 && tres.faces > 0, "three on one phone: the others' dice face up, your own as ❓");
check(tres.calzarHint > 0, 'the first time calzar opens, a line says what it is');

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
if (b.errors.length) fails++;
b.close();
if (fails) { console.log(`❌ ${fails} checks failed`); process.exit(1); }
