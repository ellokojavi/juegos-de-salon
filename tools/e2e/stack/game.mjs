// 🗼 Babel, out of the lab (D-445), end to end at its standalone page /babel/: the waiting room with
// the self-building tower and the credit to Ketchapp's Stack with its link; Empezar goes through the
// countdown to the tower at 0 with "Toca donde sea"; a real tap drops the block; perfect drops say
// "Perfecto ×n"; a late one cuts it; losing focus pauses and the tap back only resumes; missing the
// tower ends the game, and «Continuar» gives a point a floor plus streak bonuses, with the breakdown and the share card.
// At 320 px nothing scrolls sideways. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/stack-game');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const P = `window.__stack`;

// The waiting room
await b.go(`${SITE}/babel/?test`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.sk-demo')`), 'with the cover\'s tower');
await ev(`window.__shot = document.querySelector('.sk-demo').toDataURL(); 1`);
await sleep(1500);
ok(await ev(`document.querySelector('.sk-demo').toDataURL() !== window.__shot`), 'the cover\'s tower builds itself');
ok(/Inspirado en Stack, de Ketchapp/.test(await ev(`document.getElementById('sk-credito')?.textContent || ''`)) && /ketchappgames\.com/.test(await ev(`document.getElementById('link-stack')?.href || ''`)), 'it credits Ketchapp\'s Stack, with its link');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');

// The game
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('sk-escenario') && !document.getElementById('cuenta')`, 9000), 'Empezar opens the tower after the countdown');
ok(await ev(`document.getElementById('sk-marcador').textContent`) === '0', 'the score starts at 0');
ok(/Toca donde sea/.test(await ev(`document.getElementById('sk-aviso').textContent`)), 'and says to tap anywhere');
await sleep(Math.max(0, await ev(`${P}.perfecto() - performance.now()`)));
const r = await ev(`document.getElementById('sk-escenario').getBoundingClientRect().toJSON()`);
await b.tap(r.x + r.width / 2, r.y + r.height / 2);
ok(await waitFor(`${P}.S.g.slabs.length === 2`, 2000), 'a real tap drops the block');
await ev(`for (let k = 0; k < 3; k++) ${P}.soltarEn(${P}.perfecto()); 1`);
ok(/Perfecto ×\d/.test(await ev(`document.getElementById('sk-aviso').textContent`)), 'perfect drops say Perfecto ×n');
const area = `(s => s.w * s.d)(${P}.S.g.slabs.at(-1))`;
const antes = await ev(area);
await ev(`${P}.soltarEn(${P}.perfecto() + 120); 1`);
ok(await ev(area) < antes, 'a late drop cuts the block');
ok(await ev(`document.getElementById('sk-marcador').textContent`) === '5', 'the score says 5');
await b.shot('02-game');

// Paused: the tap back only resumes
await ev(`window.dispatchEvent(new Event('blur')); 1`);
ok(await ev(`!document.getElementById('sk-pausa').hidden`), 'losing focus pauses the game');
await sleep(1200);
await b.tap(r.x + r.width / 2, r.y + r.height / 2);
ok(await ev(`document.getElementById('sk-pausa').hidden && ${P}.S.g.slabs.length - 1 === 5`), 'a tap resumes without dropping');

// 320 px
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300);
ok(await noSideScroll(), 'no sideways scroll in the game at 320 px');
await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

// The end
await ev(`${P}.soltarEn(${P}.S.g.moving.t0); 1`);
ok(await waitFor(`/Fin del juego/.test(document.getElementById('sk-aviso')?.textContent || '')`, 1000), 'missing the tower says Fin del juego');
ok(await waitFor(`!!document.getElementById('btn-fin')`, 4000), 'and «Continuar» follows');
ok(/^5 pisos$/.test(await ev(`document.getElementById('sk-marcador').textContent`)), 'up top it says 5 pisos');
await b.shot('03-end');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`Number(document.querySelector('#screen-resultado.active .score-big')?.textContent) >= 5`, 5000), 'the result: a point a floor, plus any streak bonus, no /100');
ok(/5 pisos: 5 puntos/.test(await ev(`document.getElementById('explicacion')?.textContent || ''`)), 'the breakdown counts the blocks');
ok(/🟩/.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'the share card shows the tower');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('04-result');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ stack/game.mjs');
