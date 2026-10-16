/**
 * Dragging the card onto the line (D-85): the real gesture, with pointer events.
 *
 * The other scripts choose with `el.click()`, which never goes through `pointerdown` and so
 * exercises none of this. Here we test what the player does with a finger:
 *   1. dragging from the hand to a slot leaves the card chosen, **without placing it**
 *   2. picking the placed card up again and taking it to another slot
 *   3. dropping it off the line sends it back to the hand
 *   4. a sideways swipe on the hand is a scroll, and chooses nothing (D-38)
 *   4b. a finger lifted outside the strip, with no pointer capture, still drops the card
 *
 * Played in solo mode, which is The Cup's ⏳ Lightning Line (D-142): the same drag from
 * assets/js/arrastre.js, mounted by cup/games/timeline/ui.js, and with no handoffs in between.
 *
 * Usage: SITE=http://localhost:87xx node tools/e2e/timeline/drag.mjs <output>
 */
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const out = output('/tmp/timeline-drag');
const SITE = process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: Number(process.env.CDP_PORT) || 9231, dir: `${out}/p`, out, width: 375, height: 812 });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
// The selection lives on the game screen: read from the marked card and the open slot
const sel = () => b.evaluate(`(()=>{const c=document.querySelector('#solo-juego .hand .card.sel');const r=document.querySelector('#solo-juego .line .slot.on');return JSON.stringify({card:c?c.dataset.card:null,slot:r?+r.dataset.slot:null})})()`).then(JSON.parse);
const moves = () => b.evaluate(`window.__ldt.solo().jugadas.length`);
const center = s => b.evaluate(`(()=>{const x=document.querySelector('${s}');if(!x)return null;const r=x.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)})})()`).then(v => (v ? JSON.parse(v) : null));

/**
 * A drag with a real finger, in several steps.
 * It has to be `dispatchTouchEvent`: `dispatchMouseEvent` does not generate pointer events in
 * this Chrome, so the whole gesture would go by without anything visibly failing.
 */
const finger = (type, p) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p.x, y: p.y, id: 1 }] });
async function drag(from, to, { steps = 10, tug = true, release = true } = {}) {
  await finger('touchStart', from);
  // First the card is tugged downwards and only then taken to its destination, which is how
  // it's done with a finger. A diagonal tug from the hand is a sideways swipe, and the module
  // lets it through as a scroll of the strip on purpose (D-38): the script has to mimic the gesture.
  if (tug) { await finger('touchMove', { x: from.x, y: from.y + (to.y < from.y ? -20 : 20) }); await sleep(16); }
  for (let i = 1; i <= steps; i++) {
    await finger('touchMove', { x: Math.round(from.x + (to.x - from.x) * i / steps), y: Math.round(from.y + (to.y - from.y) * i / steps) });
    await sleep(16);
  }
  if (release) { await finger('touchEnd', to); await sleep(250); }
}

await b.go(`${SITE}/timeline/`); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${SITE}/timeline/`);

// Play solo: the game screen with no handoffs in between
await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo/i.test(m.textContent)).click(); 1`); await sleep(300);
await clickText('.theme-card', 'Historia'); await sleep(100);
await click('#btn-solo-empezar'); await sleep(900);
console.log('screen:', await b.evaluate(`document.querySelector('.screen.active').id`));

/* 0 · Choosing must not rebuild the line: the rows stay where they are ---------- */
// The milestone rows are tagged; if any gets replaced, the tag is lost and the row also
// replays its entrance animation, which was the jump that could be seen (D-87).
await b.evaluate(`document.querySelectorAll('#solo-juego .line .event').forEach((e,i)=>e.__mark=i); 1`);
const tagged = await b.evaluate(`document.querySelectorAll('#solo-juego .line .event').length`);
await b.evaluate(`document.querySelector('#solo-juego .hand .card').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); 1`); await sleep(120);
const survivors = await b.evaluate(`[...document.querySelectorAll('#solo-juego .line .event')].filter(e=>e.__mark!==undefined).length`);
console.log('line rows:', tagged, '· still the same ones after pressing a card:', survivors);
console.log('  ' + (survivors === tagged && tagged > 0 ? '✅' : '❌') + ' choosing does not rebuild the line (D-87)');
// With `animation-fill-mode: both` the finished animation stays attached, so counting them
// is no use: what gives the redraw away is one of them running again.
const running = await b.evaluate(`[...document.querySelectorAll('#solo-juego .line .event')].filter(e=>e.getAnimations().some(a=>a.playState==='running')).length`);
console.log('  ' + (running === 0 ? '✅' : '❌') + ` and no row replayed its entrance animation (${running} running)`);

/* 1 · From the hand to a slot: chooses, does not place ------------------------- */
const card = await center('#solo-juego .hand .card');
const slot = await center('#solo-juego .line .slot');
const before = await moves();
console.log('  (card', JSON.stringify(card), '→ slot', JSON.stringify(slot), ')');
// Mid-gesture, with the card in the air: the only shot that shows what is being dragged
await drag(card, slot, { release: false });
console.log('with the card in the air:',
  await b.evaluate(`JSON.stringify({lifted: !!document.querySelector('.vilo.on'), text: document.querySelector('.vilo-carta .t')?.textContent, width: Math.round(document.querySelector('.vilo-carta')?.getBoundingClientRect().width), covered: document.body.classList.contains('arrastrando'), target: !!document.querySelector('#solo-juego .line .slot.on')})`));
await b.shot('drag-0-lifted');
await finger('touchEnd', slot); await sleep(250);
const afterDrop = await sel();
console.log('after dragging to the slot:', JSON.stringify(afterDrop), '· moves:', await moves(), `(before ${before})`);
console.log('  ' + (afterDrop.card && afterDrop.slot !== null ? '✅' : '❌') + ' dropping leaves the card and the place chosen');
console.log('  ' + ((await moves()) === before ? '✅' : '❌') + ' dropping does NOT place: the button does that (C-8)');
console.log('  ' + (await b.evaluate(`!!document.querySelector('#solo-juego .line .slot.on .ghost')`) ? '✅' : '❌') + ' the slot was left open with the card inside');
console.log('  ' + (await b.evaluate(`!document.querySelector('#btn-colocar').disabled`) ? '✅' : '❌') + ' the confirm button was left enabled');
await b.shot('drag-1-chosen');

/* 2 · Pick the placed card up and take it to another slot ---------------------- */
const ghost = await center('#solo-juego .line .slot.on .ghost');
const other = await b.evaluate(`(()=>{const s=[...document.querySelectorAll('#solo-juego .line .slot')];const i=s.findIndex(x=>x.classList.contains('on'));const o=s[i===s.length-1?i-1:i+1];if(!o)return null;const r=o.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),i:+o.dataset.slot})})()`).then(v => (v ? JSON.parse(v) : null));
await drag(ghost, other);
const afterMove = await sel();
console.log('after picking it up and moving it:', JSON.stringify(afterMove), '· expected slot', other.i);
console.log('  ' + (afterMove.slot !== null && afterMove.card ? '✅' : '❌') + ' the placed card can be picked up and moved');

/* 3 · Dropping it off the line sends it back to the hand ----------------------- */
const ghost2 = await center('#solo-juego .line .slot.on .ghost');
await drag(ghost2, { x: ghost2.x, y: 30 }, { steps: 4 });
const afterDiscard = await sel();
console.log('after dropping it outside:', JSON.stringify(afterDiscard));
console.log('  ' + (afterDiscard.card === null && afterDiscard.slot === null ? '✅' : '❌') + ' dropped off the line it goes back to the hand, unchosen');

/* 4 · A sideways swipe on the hand is a scroll, not a choice (D-38) ------------ */
await b.evaluate(`window.scrollTo(0,0); 1`); await sleep(150);
const card2 = await center('#solo-juego .hand .card');
await drag(card2, { x: card2.x - 90, y: card2.y }, { steps: 6, tug: false });
const afterSwipe = await sel();
console.log('after swiping the hand sideways:', JSON.stringify(afterSwipe));
console.log('  ' + (afterSwipe.card === null ? '✅' : '❌') + ' the sideways swipe does not choose a card (D-38)');

/* 4b · A finger lifted where the strip can't hear it still drops the card ------- */
// Synthetic pointer events: the browser has no such pointer, so `setPointerCapture` fails,
// as it can on a phone when the first redraw destroys the touched card. The finger then
// lifts over the page, not over the strip. Before, the card stayed floating over every later
// screen (Pintaminas over La Copa's Administrar).
await b.evaluate(`window.scrollTo(0,0); 1`); await sleep(150);
const stuck = await b.evaluate(`(async()=>{
  const c=document.querySelector('#solo-juego .hand .card'); const r=c.getBoundingClientRect();
  const x=r.left+r.width/2, y=r.top+r.height/2, o={bubbles:true,cancelable:true,pointerId:77,pointerType:'touch',isPrimary:true};
  c.dispatchEvent(new PointerEvent('pointerdown',{...o,clientX:x,clientY:y}));
  for (let i=1;i<=4;i++){ document.querySelector('#solo-juego .hand').dispatchEvent(new PointerEvent('pointermove',{...o,clientX:x,clientY:y+12*i})); await new Promise(f=>setTimeout(f,16)); }
  const lifted=!!document.querySelector('.vilo.on');
  // A second finger lifting elsewhere does not end the first one's drag
  document.body.dispatchEvent(new PointerEvent('pointerup',{...o,pointerId:78,clientX:5,clientY:5}));
  const stillLifted=!!document.querySelector('.vilo.on');
  document.body.dispatchEvent(new PointerEvent('pointerup',{...o,clientX:x,clientY:y+48}));
  await new Promise(f=>setTimeout(f,100));
  return JSON.stringify({lifted, stillLifted, after: !!document.querySelector('.vilo.on'), covered: document.body.classList.contains('arrastrando')});
})()`).then(JSON.parse);
console.log('lifted outside the strip:', JSON.stringify(stuck));
console.log('  ' + (stuck.lifted && stuck.stillLifted ? '✅' : '❌') + ' the card lifts, and another finger lifting does not drop it');
console.log('  ' + (!stuck.after && !stuck.covered ? '✅' : '❌') + ' lifting the finger outside the strip drops the card: it does not stay floating');

/* 5 · And the button is still what places ------------------------------------- */
// The strip was shifted by the swipe: take the first fully visible card
const card3 = await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#solo-juego .hand .card')].find(c=>{const r=c.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth});const r=x.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)})})()`).then(JSON.parse);
const slot3 = await center('#solo-juego .line .slot');
await drag(card3, slot3);
const beforePlacing = await moves();
await click('#btn-colocar'); await sleep(700);
console.log('after confirming:', 'moves', await moves(), `(before ${beforePlacing})`);
console.log('  ' + ((await moves()) === beforePlacing + 1 ? '✅' : '❌') + ' the button does place');
await b.shot('drag-2-placed');

console.log('errors:', b.errors, b.logs);
process.exit(0);
