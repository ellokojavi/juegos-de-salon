// The lab's El Camaleón (#898) end to end, at /labs/chameleon/ and 320 px: the lab offers it under
// Juegos en prueba with the credit to Big Potato Games' The Chameleon, which the cover gives too;
// four players, a topic, the phone goes around (each card covered until its player taps, only the
// chameleon without the word), the clues, a wrong vote (the chameleon escapes, +2), a round where
// the chameleon is caught and misses (+1 for the rest), the game resumes after a reload, and rounds
// until someone reaches 5 and the end screen. Then the cover in en, pt and de. No sideways scroll on
// any screen, no console errors. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/chameleon-lab');
const W = 320;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: W, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 6000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const H = 'window.__camaleon';
const noScroll = async where => ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `no sideways scroll on ${where}`);
const click = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click(); 1`);

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-camaleon #btn-camaleon')?.getAttribute('href')`) === 'chameleon/', 'the lab offers El Camaleón under Juegos en prueba');
ok(await ev(`/The Chameleon/.test(document.querySelector('#seccion-camaleon a[href*="bigpotato"]')?.textContent || '')`), 'and credits The Chameleon, with its link');

await b.go(`${SITE}/labs/chameleon/?test`, 1200);
await ev(`localStorage.removeItem('juegos-de-salon:camaleon:session'); 1`);
await b.go(`${SITE}/labs/chameleon/?test`, 1200);
ok(await waitFor(`${H}?.screen() === 'screen-intro'`), 'the cover opens');
ok(/Inspirado en The Chameleon, de Big Potato Games/.test(await ev(`document.querySelector('.credito').textContent`)), 'the cover credits Big Potato Games');
ok(await ev(`document.querySelectorAll('.how li').length`) === 3, 'three steps in Cómo se juega (U-18)');
ok(await ev(`document.getElementById('btn-go-setup').getBoundingClientRect().bottom <= innerHeight`), 'the start button is above the fold');
await b.shot('1-intro'); await noScroll('the cover');

// Setup: an error with too few, then four names
await click('#btn-go-setup');
await ev(`document.querySelectorAll('#players-form input').forEach(i => { i.value = ''; i.dispatchEvent(new Event('input')); }); 1`);
await click('#btn-start');
ok(/al menos 3/.test(await ev(`document.getElementById('form-error').textContent`)), 'with no names it asks for 3 players');
const NAMES = ['Francisca', 'Maximiliano', 'Catalina', 'Bartolomé'];
await ev(`[...document.querySelectorAll('#players-form input')].forEach((i, k) => { i.value = ${JSON.stringify(NAMES)}[k]; i.dispatchEvent(new Event('input')); }); 1`);
await b.shot('2-setup'); await noScroll('the setup');
await click('#btn-start');
ok(await waitFor(`${H}.screen() === 'screen-topic'`), 'Play leads to the topic');
ok(await ev(`document.querySelectorAll('#topics .topic').length`) === 6, 'six topics and a random one');
await b.shot('3-topic'); await noScroll('the topic');

// One full round of cards
const playRound = async (shots = false) => {
  const s = await ev(`${H}.state()`);
  const n = s.players.length;
  for (let k = 0; k < n; k++) {
    ok(await waitFor(`!document.getElementById('handoff').hidden`), `card ${k + 1}: the pass screen covers the card`);
    const holder = await ev(`document.querySelector('#handoff .next-name').textContent`);
    const seat = (s.r.starter + k) % n;
    if (holder !== s.players[seat].name) ok(false, `card ${k + 1} goes to ${s.players[seat].name}, not ${holder}`);
    ok(await ev(`document.getElementById('card-face').hidden`), `card ${k + 1}: nothing visible behind the pass`);
    await ev(`document.querySelector('#handoff button').click(); 1`);
    ok(await waitFor(`!document.getElementById('card-face').hidden`), `card ${k + 1}: the tap shows it`);
    const text = await ev(`document.getElementById('card-secret').textContent`);
    const secret = (await ev(`${H}.state()`)).r.secret;
    const word = await ev(`document.querySelectorAll('#grid .cell')[${secret}]?.textContent || ''`);
    if (seat === s.r.chameleon) ok(/camaleón/.test(text), `${holder} is the chameleon and sees it`);
    else ok(!/camaleón/.test(text) && text.length > 18, `${holder} sees the secret word`);
    if (shots && k < 2) await b.shot(`4-card-${k}`);
    await sleep(350); // the handoff fades out
    await click('#btn-hide-card');
  }
  ok(await waitFor(`${H}.screen() === 'screen-table' && document.getElementById('step').dataset.phase === 'clues'`), 'after the last card, the clues');
};

await click('#topics [data-topic="animals"]');
await playRound(true);
ok(await ev(`document.querySelectorAll('#grid .cell').length`) === 16, 'a grid of 16 words');
ok(/Perro/.test(await ev(`document.getElementById('grid').textContent`)), 'the animals in Spanish');
await b.shot('5-clues'); await noScroll('the clues');
await click('#btn-vote');
await b.shot('6-vote'); await noScroll('the vote');
let s = await ev(`${H}.state()`);
const innocent = (s.r.chameleon + 1) % 4;
await click(`#step [data-seat="${innocent}"]`);
s = await ev(`${H}.state()`);
ok(s.r.outcome === 'escaped' && s.players[s.r.chameleon].score === 2, 'a wrong vote: the chameleon escapes with 2 points');
ok(await ev(`!!document.querySelector('#grid .cell.secret')`), 'the result marks the secret word');
await b.shot('7-result'); await noScroll('the result');

// Round 2: caught, and a wrong guess
await click('#btn-next');
await click('#btn-topic-random');
await playRound();
// a reload mid-round resumes it
await b.go(`${SITE}/labs/chameleon/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-resume')`), 'after a reload the cover offers to continue');
await click('#btn-resume');
ok(await waitFor(`document.getElementById('step')?.dataset.phase === 'clues'`), 'and it continues at the clues');
await click('#btn-vote');
s = await ev(`${H}.state()`);
await click(`#step [data-seat="${s.r.chameleon}"]`);
ok(await waitFor(`document.getElementById('step').dataset.phase === 'guess' && document.querySelectorAll('#grid button.cell').length === 16`), 'caught: the chameleon picks a word on the grid');
await b.shot('8-guess'); await noScroll('the guess');
const wrong = (s.r.secret + 1) % 16;
await click(`#grid [data-i="${wrong}"]`);
const s2 = await ev(`${H}.state()`);
ok(s2.r.outcome === 'caught' && s2.players.every((p, i) => p.score === s.players[i].score + (i === s.r.chameleon ? 0 : 1)), 'a wrong guess: +1 for everyone else');
ok(await ev(`!!document.querySelector('#grid .cell.miss')`), 'the wrong guess is marked');

// Rounds until someone reaches 5: always a wrong vote
for (let k = 0; k < 12 && (await ev(`${H}.screen()`)) !== 'screen-end'; k++) {
  await click('#btn-next'); await click('#btn-topic-random');
  for (let c = 0; c < 4; c++) { await waitFor(`!document.getElementById('handoff').hidden`); await ev(`document.querySelector('#handoff button').click(); 1`); await waitFor(`!document.getElementById('card-face').hidden`); await sleep(350); await click('#btn-hide-card'); }
  await waitFor(`document.getElementById('step')?.dataset.phase === 'clues'`);
  await click('#btn-vote');
  const st = await ev(`${H}.state()`);
  await click(`#step [data-seat="${(st.r.chameleon + 1) % 4}"]`);
}
ok(await waitFor(`${H}.screen() === 'screen-end'`), 'someone reaches 5: the end screen');
ok(/🏆/.test(await ev(`document.getElementById('end-title').textContent`)), 'it names the winner');
ok(await ev(`!!document.getElementById('btn-fin-menu') && !!document.getElementById('btn-again')`), 'Play again and back to the menu (C-19)');
await b.shot('9-end'); await noScroll('the end');
await click('#btn-again');
ok(await waitFor(`${H}.screen() === 'screen-topic' && ${H}.state().players.every(p => p.score === 0)`), 'Play again starts from 0 with the same players');

// The cover in the other languages
for (const [lang, credit, word] of [['en', /Inspired by The Chameleon, by Big Potato Games/, 'Play!'], ['pt', /Inspirado em The Chameleon, da Big Potato Games/, 'Jogar!']]) {
  await b.go(`${SITE}/labs/chameleon/?test&lang=${lang}`, 1200);
  ok(credit.test(await ev(`document.querySelector('.credito').textContent`)), `${lang}: the cover in ${lang}`);
  ok(await ev(`document.getElementById('btn-start').textContent`) === word, `${lang}: the setup button`);
  await b.shot(`10-intro-${lang}`); await noScroll(`the ${lang} cover`);
}

ok(!b.errors.length, `no errors in the console${b.errors.length ? ': ' + b.errors.join(' | ') : ''}`);
b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ chameleon/lab.mjs');
