// Julepe end to end, no network: a table of three against the phone and a game on one phone.
// Checks that nobody can play an illegal card, that the pot builds up with each julepe,
// that the drinks handed out add up and that the game can be resumed (C-6). The shots carry the
// names of the README screenshots (docs/capturas.json).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const b = await launch({ port: 9387, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
const taken = new Set();
const shot = async name => { if (!taken.has(name)) { taken.add(name); await b.shot(name); } };
const screen = () => ev(`document.querySelector('.screen.active').id`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const view = () => ev(`JSON.stringify(window.__julepe.view() || null)`).then(t => JSON.parse(t || 'null'));
const saved = () => ev(`JSON.parse(localStorage.getItem('juegos-de-salon:julepe:session') || 'null')`);
const proceed = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);

/** The human player's turn, whatever the phase. Always goes in, never passes. */
const play = () => ev(`(()=>{
  const v = window.__julepe.view(); if (!v) return 'no game';
  const btn = () => document.querySelector('#actions .btn--yellow');
  if (v.phase === 'declara') { const b = btn(); if (!b) return 'no'; b.click(); return 'go'; }
  if (v.phase === 'cambia') {
    const c = document.querySelector('#mine .pcard'); if (c) c.click();
    const b = btn(); if (!b) return 'no'; b.click(); return 'exchange';
  }
  if (v.phase === 'baza') {
    const c = document.querySelector('#mine .pcard:not(.off)'); if (!c) return 'no card';
    c.click();
    const b = btn(); if (!b || b.disabled) return 'no button';
    const t = b.textContent.trim(); b.click(); return t;
  }
  if (v.phase === 'regala') {
    for (let i = 0; i < 12; i++) {
      const b = btn(); if (b && !b.disabled) { b.click(); return 'give'; }
      const plus = [...document.querySelectorAll('.give-pm button')].filter(x => x.textContent === '+' && !x.disabled)[0];
      if (!plus) return 'no plus';
      plus.click();
    }
  }
  return 'none';
})()`);

/** Could any greyed-out card really be played? That is the question that matters in this game. */
const legalOk = () => ev(`(()=>{
  const v = window.__julepe.view();
  if (!v || v.phase !== 'baza') return 'n/a';
  const me = window.__julepe.session().mode === 'online' ? window.__julepe.session().role : (window.__julepe.session().uiRole || 'A');
  if (v.turno !== me || !v.cartas[me]) return 'n/a';
  const shown = [...document.querySelectorAll('#mine .pcard')].map(c => c.getAttribute('aria-label'));
  const greyed = [...document.querySelectorAll('#mine .pcard.off')].length;
  return shown.length - greyed;
})()`);

await b.go(`${SITE}/`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITE}/labs/julep/`);
await shot('01-intro');
console.log('modes:', await ev(`[...document.querySelectorAll('.mode')].map(m=>m.innerText.split('\\n')[0]).join(' | ')`));

/* ---------------- Against the phone ---------------- */
await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await shot('02-setup');
await ev(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(700);
{
  const v = await view();
  console.log('hand 1 · pot:', v.plato, '· trump:', v.triunfo, '· my cards:', v.cartas.A?.join(' '));
}

let rounds = 0, julepes = 0, illegal = 0, maxPot = 0;
while ((await screen()) !== 'screen-result' && rounds++ < 400) {
  if (await overlay()) {
    if (await ev(`!!document.querySelector('#handoff .julepe')`)) { julepes++; await shot('06-julepe'); }
    await proceed(); await sleep(300); continue;
  }
  const v = await view();
  if (!v) { await sleep(200); continue; }
  maxPot = Math.max(maxPot, v.plato);
  if (v.phase === 'declara' && v.turno === 'A') await shot('03-declaration');
  if (v.phase === 'cambia' && v.turno === 'A') await shot('04-exchange');
  if (v.phase === 'baza' && v.turno === 'A' && v.bazas.length >= 1) await shot('05-trick');
  if (v.phase === 'regala' && v.turno === 'A') await shot('07-handout');
  if (v.turno !== 'A') { await sleep(250); continue; }
  const legal = await legalOk();
  if (legal === 0) illegal++;
  const r = await play();
  if (r === 'no card' || r === 'no button' || r === 'no plus') { console.log('⚠️ turn stuck:', r, v.phase); break; }
  await sleep(220);
}
{
  const v = await view();
  console.log('against the phone →', await screen(), '·', await ev(`document.getElementById('result-title').textContent`));
  console.log('hands:', v.historia.length, '· julepes seen:', julepes, '· highest pot:', maxPot, '· turns with no legal card:', illegal);
  const drunk = v.players.reduce((a, p) => a + v.st[p].tragos, 0);
  const dealt = v.historia.reduce((a, h) => a + (h.vacia ? 0 : h.plato * h.julepes.length + Object.values(h.regalos).flat().length * 2), 0);
  console.log('drinks taken:', drunk, '· drinks handed out by the rules:', dealt, drunk === dealt ? '(adds up)' : '⚠️ DOES NOT ADD UP');
}
await ev(`document.getElementById('result-history').open = true; 1`); await sleep(300);
await sleep(4200);   // the confetti lasts 4 s and would cover the screenshot's title (D-76)
await shot('08-result');

/* ---------------- Three on one phone ---------------- */
await b.go(`${SITE}/labs/julep/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITE}/labs/julep/`);
await ev(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(300);
await ev(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await ev(`document.querySelectorAll('.largos button')[0].click(); 1`);   // short game
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(600);
// Dealing takes a blink, so wait for the handoff screen to appear instead of looking
// just once: without that, the test said "no" depending on how the clock had fallen.
let handoffAppears = false;
for (let i = 0; i < 12 && !handoffAppears; i++) { handoffAppears = await overlay(); if (!handoffAppears) await sleep(250); }
await shot('09-handoff');
console.log('on one phone, the handoff is asked for before looking at the cards:', handoffAppears ? 'yes' : '⚠️ no');

let handoffs = 0, resumed = false;
rounds = 0;
while ((await screen()) !== 'screen-result' && rounds++ < 500) {
  if (await overlay()) { handoffs++; await proceed(); await sleep(260); continue; }
  const v = await view();
  if (!v) { await sleep(200); continue; }
  // Halfway through the second hand it reloads: the game has to come back where it was (C-6)
  if (!resumed && v.manoN === 1 && v.phase === 'baza') {
    resumed = true;
    const before = JSON.stringify(v.historia.length) + '/' + v.manoN;
    await b.go(`${SITE}/labs/julep/`); await sleep(400);
    await ev(`(()=>{const b=[...document.querySelectorAll('#resume-slot .btn')][0]; if(b) b.click(); return 1})()`);
    await sleep(700);
    const now = await view();
    console.log('resumed:', before, '→', now ? `${now.historia.length}/${now.manoN}` : '⚠️ did not come back', '· saved:', !!(await saved()));
    continue;
  }
  const r = await play();
  if (r === 'no card' || r === 'no button' || r === 'no plus') { console.log('⚠️ turn stuck:', r, v.phase); break; }
  await sleep(200);
}
{
  const v = await view();
  console.log('on one phone →', await screen(), '· hands:', v?.historia.length, '· handoff screens:', handoffs);
  console.log('final table:', v?.players.map(p => `${p}:${v.st[p].tragos}`).join(' '), '· winners:', v?.ganadores.join(', '));
}
await sleep(4200);
await shot('10-table');

// A clean console is an acceptance criterion (C-12): if the device locks up, the why stays here
console.log('console errors:', b.errors.length ? b.errors.join(' | ') : 'none');
if (b.logs.length) console.log('console warnings:', b.logs.slice(0, 5).join(' | '));

await b.close();
console.log('julepe (no network): done');
