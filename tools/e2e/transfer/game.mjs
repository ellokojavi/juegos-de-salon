// Transfer (lab): plays the five trips to the result (one wrong route first), then the conformance
// checks run it in every language (tools/e2e/conformance.mjs). Born from tools/generators/new-game.mjs.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

await b.go(SITE + '/labs/transfer/'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/transfer/');
await b.shot('cover');
await b.evaluate("document.querySelector('.mode').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-play', 'the game starts');
// Trip 1, a wrong route first: it costs a heart and offers another try
await b.evaluate("document.querySelector('[data-card]').click(); document.getElementById('btn-go').click(); 1");
await b.until("!!document.getElementById('btn-retry')", 5000);
await b.evaluate("document.getElementById('btn-retry').click(); 1"); await sleep(200);
ok(await b.evaluate('__transfer.state().hearts') === 2, 'a wrong route costs a heart');
for (let lv = 0; lv < 5; lv++) {
  await b.evaluate("document.getElementById('btn-clear').click(); 1");
  const sol = await b.evaluate('__transfer.levels[__transfer.state().level].solution');
  for (const c of sol) await b.evaluate(`document.querySelector('[data-card="${c}"]').click(); 1`);
  if (lv === 3) await b.shot('trip-4');
  await b.evaluate("document.getElementById('btn-go').click(); 1");
  ok(await b.until("!!document.getElementById('btn-next')", 8000), 'trip ' + (lv + 1) + ' arrives');
  if (lv === 4) await b.shot('trip-5-arrived');
  await b.evaluate("document.getElementById('btn-next').click(); 1"); await sleep(300);
}
ok(await b.active() === 'screen-result', 'it reaches the result');
ok(await b.evaluate("document.getElementById('result-title').textContent") === '14 de 15 ⭐', 'the stars add up');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
