// Tembleque at /wobbles/, out of the lab (D-517's way, D-601), with flags/wobbles pinned to all: the cover's lever
// picks the level and its picture follows; each (the owner's prototype kept whole, docs/games/wobbles.md) starts a
// round from its card and ends on its game-over card, in es/en/pt, with the exit to the menu, and its ‹ comes back
// to the cover. The old lab paths are bridges, levels included, and Rankings has a tab per level (D-559).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT, clock: true });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

// Its launch flag, pinned to all on this phone (the page sends a visitor home while it is off)
const pinFlag = () => b.evaluate("localStorage.setItem('juegos-de-salon:flags', JSON.stringify({ ...JSON.parse(localStorage.getItem('juegos-de-salon:flags') || '{}'), wobbles: { state: 'all' } })); 1");
await b.go(SITE + '/wobbles/'); await pinFlag();
await b.go(SITE + '/wobbles/'); await sleep(600);
ok(await b.evaluate("location.pathname === '/wobbles/' && !document.querySelector('meta[name=robots]') && /canonical/.test(document.head.innerHTML)"), 'the cover opens at /wobbles/, with its link card and no noindex');
ok(await b.evaluate("window.__wobbles.level === 'easy' && document.getElementById('btn-level').getAttribute('aria-checked') === 'false' && !document.getElementById('pic').classList.contains('hard')"), 'the lever starts on easy, with the 2D picture');
ok(await b.evaluate("!!document.querySelector('#screen-intro details.panel, #btn-instrucciones')"), 'the steps start folded, or in the Instrucciones dialog (D-550, C-8)');
// The picture is a loop of the real game (tools/generators/wobbles-cover.mjs): only the level on the lever plays
const clips = "[...document.querySelectorAll('#pic video')].map(v => v.getAttribute('src') + ':' + (v.paused ? 'paused' : 'playing') + ':' + v.loop + v.muted).join(' ')";
await sleep(800);
ok(await b.evaluate(clips) === 'cover/easy.mp4:playing:truetrue cover/hard.mp4:paused:truetrue', `the easy loop plays, muted, and hard waits (${await b.evaluate(clips)})`);
// Its level's table under Entrar, as on every solo game's cover (missing at launch, 2026-11-22)
const rankTitle = "document.querySelector('#rk-table .rk-ranking')?.dataset.tabla + ' | ' + document.querySelector('#rk-table .rk-titulo')?.textContent";
ok(/^wobbles_easy \| .*Tembleque · 🟢 Fácil$/.test(await b.evaluate(rankTitle)), `the cover shows the easy level's ranking (${await b.evaluate(rankTitle)})`);
ok(/Empezar$/.test(await b.evaluate("document.getElementById('btn-play').textContent")) && (await b.evaluate("document.getElementById('btn-play').textContent")).startsWith('⚖️'), 'its button says ⚖️ Empezar, as every cover does');
await b.shot('cover-easy');
const howEasy = await b.evaluate("document.getElementById('how').textContent");
ok(!/\b[23]D\b/.test(await b.evaluate('document.body.innerText')), 'the cover never says 2D or 3D');
await b.evaluate("document.getElementById('btn-level').click(); 1"); await sleep(700);
ok(await b.evaluate("window.__wobbles.level === 'hard' && document.getElementById('btn-level').getAttribute('aria-checked') === 'true' && document.getElementById('pic').classList.contains('hard') && document.body.classList.contains('wb-hard')"), 'flipping the lever shows hard, the 3D picture and the red cover');
await sleep(800);
ok(await b.evaluate(clips) === 'cover/easy.mp4:paused:truetrue cover/hard.mp4:playing:truetrue', `the lever swaps the loops: hard plays, easy pauses (${await b.evaluate(clips)})`);
ok(/^wobbles_hard \| .*Tembleque · 🔴 Difícil$/.test(await b.evaluate(rankTitle)), `the lever swaps the ranking to hard (${await b.evaluate(rankTitle)})`);
await b.shot('cover-hard');
ok(await b.evaluate("document.getElementById('how').textContent") !== howEasy, 'how to play changes with the lever');
await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(900);
ok(await b.evaluate('location.pathname') === '/wobbles/hard/', '⚖️ Empezar opens the level the lever shows');

for (const level of ['easy', 'hard']) {
  for (const lang of ['es', 'en', 'pt']) {
    await b.go(SITE + `/wobbles/${level}/?seed=7&spin=0&lang=` + lang); await sleep(600);
    ok(await b.evaluate("!!window.__balanza && !document.getElementById('card').hidden"), `${level} ${lang}: the cover card shows`);
    await b.evaluate("document.getElementById('cBtn').click(); 1"); await sleep(600);
    ok(await b.evaluate("window.__balanza.state === 'play' && document.getElementById('card').hidden"), `${level} ${lang}: a round starts`);
    await b.evaluate('window.__balanza.finish(); 1'); await sleep(300);
    ok(await b.evaluate("window.__balanza.state === 'over' && !document.getElementById('card').hidden"), `${level} ${lang}: it ends on its game-over card`);
    ok(await b.evaluate("!!document.querySelector('#cExits #btn-fin-menu') && !document.querySelector('#btn-fin-lab') && document.querySelectorAll('#cDetail li').length >= 3"), `${level} ${lang}: the result has fin.js's exit to the menu and the breakdown after it (C-19)`);
    ok(await b.evaluate("(()=>{const r=document.getElementById('btn-fin-menu').getBoundingClientRect(),c=document.getElementById('cBtn').getBoundingClientRect();return c.bottom<=innerHeight&&r.bottom<=innerHeight+document.querySelector('#card .in').scrollHeight})()"), `${level} ${lang}: ↻ and the exit are on the card`);
    if (lang === 'es') await b.shot(level + '-over');
  }
  ok(await b.evaluate("new URL(document.querySelector('a[href=\"../\"]').href).pathname === '/wobbles/'"), `${level}: its ‹ goes back to the cover`);
}
// Lab: the cover's «T» tab sets the pieces both levels start with (on localhost the lab is open)
await b.go(SITE + '/wobbles/'); await b.evaluate("localStorage.removeItem('balanza-lab:start-pieces'); 1"); await b.go(SITE + '/wobbles/'); await sleep(1200);
await b.evaluate("document.querySelector('.tr-tab')?.click(); [1, 2, 3].forEach(() => document.querySelector('.tr-sim button[aria-label=\"+1\"]')?.click()); 1"); await sleep(300);
ok(await b.evaluate("document.getElementById('tr-piezas')?.textContent === '3' && localStorage.getItem('balanza-lab:start-pieces') === '3'"), 'the cover\'s tester tab sets the starting pieces');
// Lab: the hard level starts with the pieces the tester tab asks for, spread on the disc, and they count as nothing
await b.go(SITE + '/wobbles/hard/?seed=7&spin=0'); await b.evaluate("localStorage.setItem('balanza-lab:start-pieces', '8'); 1");
await b.go(SITE + '/wobbles/hard/?seed=7&spin=0'); await sleep(600);
await b.evaluate("document.getElementById('cBtn').click(); 1"); await sleep(800);
ok(await b.evaluate("(() => { const S = window.__balanza.S; return S.phase === 'play' && S.plat.looks.length + S.bodies.length >= 6 && S.score === 0 && S.lives === 3; })()"), 'hard: a game starts with the tester\'s pieces on the disc, no points, 3 lives');
await b.go(SITE + '/wobbles/easy/?seed=7'); await b.evaluate("localStorage.setItem('balanza-lab:start-pieces', '6'); 1");
await b.go(SITE + '/wobbles/easy/?seed=7'); await sleep(600);
await b.evaluate("document.getElementById('cBtn').click(); 1"); await sleep(800);
ok(await b.evaluate("(() => { const S = window.__balanza.S; return S.phase === 'play' && S.plank.parts.filter(q => !q.lip).length + S.bodies.length >= 4 && S.score === 0 && S.lives === 3; })()"), 'easy: a game starts with the tester\'s pieces on the plank, no points, 3 lives');
await b.evaluate("localStorage.removeItem('balanza-lab:start-pieces'); 1");
// The old lab paths lead to the new ones, with what was behind them (C-18)
for (const [from, to] of [['/labs/wobbles/', '/wobbles/'], ['/labs/wobbles/easy/?seed=7', '/wobbles/easy/'], ['/labs/wobbles/hard/?seed=7', '/wobbles/hard/']]) {
  await b.go(SITE + from); await sleep(900);
  ok(await b.evaluate(`location.pathname === '${to}' && location.search === '${from.split('?')[1] ? '?' + from.split('?')[1] : ''}'`), `${from} is a bridge to ${to}`);
}
// Rankings has one tab per level once it is launched (D-559, SOLO_LEVELS)
await b.go(SITE + '/records/?test'); await pinFlag();
await b.go(SITE + '/records/?test'); await sleep(1200);
ok(await b.evaluate("!!document.querySelector('#rk-juegos button[data-id=\"wobbles_easy\"]') && !!document.querySelector('#rk-juegos button[data-id=\"wobbles_hard\"]')"), 'Rankings has a tab for each level, once launched');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
