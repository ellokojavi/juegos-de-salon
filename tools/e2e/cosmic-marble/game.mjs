// Cosmic Marble (lab): starts a run, rolls the marble, reloads and resumes it (C-6), then ends it and
// checks the result (C-19). The conformance checks run it in every language (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };
const URL = SITE + '/labs/cosmic-marble/?seed=7';

await b.go(URL); await b.evaluate('localStorage.clear(); 1'); await b.go(URL);
await b.shot('cover');
// One tap, one run (C-14, D-576): a double tap starts it once
await b.evaluate("const p = document.getElementById('btn-play'); p.click(); p.click(); 1"); await sleep(1200);
ok(await b.active() === 'screen-play', 'the run starts');
ok(await b.evaluate("__cosmicMarble.S.stageIdx === 0 && __cosmicMarble.S.lives === 3"), 'stage 1 of 5, three lives');
const x0 = await b.evaluate('__cosmicMarble.S.x + "," + __cosmicMarble.S.y');
await b.evaluate("__cosmicMarble.keys.add('ArrowUp'); __cosmicMarble.keys.add('ArrowRight'); 1"); await sleep(1500);
await b.evaluate("__cosmicMarble.keys.clear(); 1");
ok(await b.evaluate('__cosmicMarble.S.x + "," + __cosmicMarble.S.y') !== x0, 'the keys roll the marble');
await b.shot('play');

// Memory (C-6): a reload offers to go on at the start of the same stage
await b.go(URL); await sleep(500);
ok(await b.evaluate("!!document.getElementById('btn-resume')"), 'a reload offers to continue');
await b.evaluate("document.getElementById('btn-resume').click(); 1"); await sleep(1200);
ok(await b.active() === 'screen-play', 'it resumes the run');

// The end: one stage cleared and the lives gone
await b.evaluate("const S = __cosmicMarble.S; S.results.push({ i: S.stage.i, t: 20, par: 25, pts: 20 }); S.cleared = 1; S.falls = 3; __cosmicMarble.finish(false, 'lives'); 1");
await sleep(2000);
ok(await b.active() === 'screen-result', 'it reaches the result');
ok(/^11 /.test(await b.evaluate("document.getElementById('result-score').textContent")), 'the score: 20 − 3 × 3 = 11');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
