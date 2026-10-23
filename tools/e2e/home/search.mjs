// The home page's search, for everyone since D-403 (D-387, D-390) end to end: a 🔎 pill in the row of
// ✨ Nuevos and 🔥 Populares that opens into a field over that row; while typing, a dropdown names up to
// five games (the list below does not move) and "see them all" filters the list; ✕ brings the pills
// back. On a computer, ↓ ↑ Enter and Escape drive the dropdown (D-393). Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { networkInterfaces } from 'node:os';
import { ACTIVE, CAMPAIGNS } from '../../../public/assets/js/splash.js';
const OUT = output('/tmp/home-search');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const type = async q => { await ev(`{ const i = document.getElementById('buscar'); i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event('input')); } 1`); await sleep(200); };
const visible = `window.__portada.visibles`;
const all = `document.querySelectorAll('#games .game-card[data-id]').length`;
const sugs = `[...document.querySelectorAll('#buscar-lista .sug')].map(x => x.dataset.id)`;
const key = k => ev(`document.getElementById('buscar').dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', bubbles: true, cancelable: true })); 1`);
const selected = `(document.querySelector('#buscar-lista .sel') || {}).id || ''`;
const shown = sel => `(e => !!e && e.getBoundingClientRect().width > 0)(document.querySelector('${sel}'))`;

await b.go(`${SITE}/?test`);
ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && await waitFor(`!!document.querySelector('.buscar-pill')`), 'every player sees the 🔎 search, with no parameter and no lab key (D-403)');
// Without a lab key nothing in development turns on, even with its parameter (D-395): the page is
// opened through this machine's network address, which the lab treats as any other site
const lan = Object.values(networkInterfaces()).flat().find(a => a && a.family === 'IPv4' && !a.internal)?.address;
if (lan) {
  const port = new URL(SITE).port || '80';
  await b.go(`http://${lan}:${port}/?test&lab&splash=${Object.keys(CAMPAIGNS).find(id => !ACTIVE.some(a => a.id === id)) || 'x'}`);
  ok(await waitFor(`document.querySelectorAll('.game-card').length > 3`) && (await sleep(1200), await ev(`!!document.querySelector('.buscar-pill') && !document.getElementById('barra') && !document.getElementById('splash-titulo')`)), 'without a lab key, ?lab and a splash preview show nothing, and the search is there anyway');
  // The same address on localhost, where the lab opens by itself, does show them: the check above is not empty
  await b.go(`${SITE}/?test&lab`);
  ok(await waitFor(`!!document.getElementById('barra')`), 'with the lab open, the same address shows the bar');
} else console.log('· no network address: the lab-key check is skipped');

await b.go(`${SITE}/?test`);
ok(await waitFor(shown('.atajos .buscar-pill')), 'a 🔎 pill sits in the row of Nuevos and Populares');
ok(await ev(`!${shown('#buscar')} && document.querySelector('.atajos').scrollWidth <= document.querySelector('.atajos').clientWidth + 1`), 'folded, the field is hidden and the row fits at 320 px');
await b.shot('pill');
// With favorites, the 🔎 still goes first, left of ⭐ (D-396)
await ev(`localStorage.setItem('juegos-de-salon:favoritos', JSON.stringify(['dudo'])); 1`);
await b.go(`${SITE}/?test`);
await waitFor(shown('.atajos .buscar-pill'));
ok(await ev(`(r => { const kids = [...r.children].filter(k => k.getBoundingClientRect().width > 0); const left = Math.min(...kids.map(k => k.getBoundingClientRect().left)); const pill = r.querySelector('.buscar-pill').getBoundingClientRect(), fav = r.querySelector('.ficha-fav')?.getBoundingClientRect(); return pill.left === left && (r.querySelector('.ficha-fav') ? pill.right <= fav.left : true); })(document.querySelector('.atajos'))`), 'the 🔎 pill goes first, left of ⭐ Favoritos when it shares the row (at 320 px ⭐ takes its own line)');
ok(await ev(`document.querySelector('.atajos').scrollWidth <= document.querySelector('.atajos').clientWidth + 1`), 'with ⭐ in it, the row still fits at 320 px');
await b.shot('pill-favorites');
await ev(`localStorage.removeItem('juegos-de-salon:favoritos'); 1`);
await b.go(`${SITE}/?test`);
await waitFor(shown('.atajos .buscar-pill'));
const sitio = `JSON.stringify([...document.querySelectorAll('.atajos > button')].map(b => Math.round(b.getBoundingClientRect().left)))`;
const antes = await ev(sitio);
await ev(`document.querySelector('.buscar-pill').click(); 1`);
ok(await ev(`document.querySelector('.atajos .buscar').getAnimations().some(a => a.animationName === 'buscar-abre')`), 'the field grows out of the pill (D-398)');
ok(await ev(`Math.abs(document.querySelector('.buscar-lupa').getBoundingClientRect().width - document.querySelector('.buscar-pill .ficha-emoji').getBoundingClientRect().width) < 0.5`), 'the field\'s 🔎 is the pill\'s size all along: it slides, it does not shrink (D-402)');
ok(await waitFor(`${shown('#buscar')} && getComputedStyle(document.querySelector('.atajos [data-tipo="popular"]')).opacity === '0' && document.activeElement.id === 'buscar'`), 'tapped, the field covers the row and the pills under it fade out, with the cursor in it');
ok(await ev(sitio) === antes, 'opening moves nothing in the row: the field lies over it (D-402)');
ok(await ev(shown('.tipos')), 'the types stay below');
await type('dados');
ok(await ev(`${sugs}.includes('dudo') && ${sugs}.length <= 5`), '"dados" names Dudo in the dropdown');
ok(await ev(`${visible}.length === ${all}`), 'the list below does not move while typing');
ok(await ev(`/dados/.test(document.querySelector('#buscar-lista .sug[data-id="dudo"]').textContent)`) || await ev(`/dado/.test(document.querySelector('#buscar-lista .sug[data-id="dudo"]').textContent)`), 'it says which word found it');
await b.shot('dropdown');
await type('logica');
ok(await ev(`${sugs}.length === 5 && /\\d+/.test(document.querySelector('.buscar-todos').textContent)`), '"logica" names five and offers to see them all');
await ev(`document.querySelector('.buscar-todos').click(); 1`);
ok(await waitFor(`${visible}.includes('reinas') && !${visible}.includes('dudo') && document.getElementById('buscar-lista').hidden`), '"see them all" filters the list and folds the dropdown');
ok(await ev(`!document.getElementById('filtros-cuenta').hidden`), 'the count line shows how many');
await type('xyzzy');
ok(await ev(`!!document.querySelector('#buscar-lista .buscar-nada') && ${sugs}.length === 0`), 'nothing found says so in the dropdown');
await ev(`document.querySelector('.buscar-cerrar').click(); 1`);
ok(await ev(`document.querySelector('.atajos').classList.contains('cerrando') && ${shown('#buscar')}`), '✕ first folds the field back into the pill (D-398)');
// The fold really plays (D-402): a restarted animation, not the opening's one frozen at its end
ok(await ev(`(a => !!a && a.playState === 'running')(document.querySelector('.atajos .buscar').getAnimations().find(a => a.animationName === 'buscar-pliega'))`), 'the fold is its own running animation, so the field does not freeze folded');
ok(await ev(`getComputedStyle(document.querySelector('.buscar-pill')).opacity === '0' || getComputedStyle(document.querySelector('.buscar-pill')).transitionProperty.split(', ').every(p => p !== 'opacity')`), 'the pill\'s 🔎 does not fade in, so it does not blink when the field hands over (D-402)');
ok(await waitFor(`!${shown('#buscar')} && ${shown('.atajos .buscar-pill')} && ${shown('.atajos [data-tipo="popular"]')} && ${visible}.length === ${all}`), '✕ brings the pills back and every game');
await ev(`document.querySelector('.buscar-pill').click(); 1`);
await type('toque');
ok(await ev(`!!document.querySelector('#buscar-lista a.sug[data-id="toque-y-fama"][href]')`), 'a suggestion is a link to its game');
await ev(`document.querySelector('#buscar-lista a.sug[data-id="toque-y-fama"]').click(); 1`);
ok(await waitFor(`location.pathname.includes('bulls-and-cows')`), 'tapping it opens the game');

// The keyboard (D-393)
await b.go(`${SITE}/?test`);
await waitFor(shown('.atajos .buscar-pill'));
await ev(`document.querySelector('.buscar-pill').click(); 1`);
await type('logica');
ok(await ev(`!document.querySelector('#buscar-lista .sel') && !document.getElementById('buscar').hasAttribute('aria-activedescendant')`), 'typing leaves nothing selected');
await key('ArrowDown'); await key('ArrowDown');
const second = await ev(`${sugs}[1]`);
ok(await ev(`${selected} === 'buscar-op-1' && document.getElementById('buscar').getAttribute('aria-activedescendant') === 'buscar-op-1' && document.getElementById('buscar-op-1').getAttribute('aria-selected') === 'true'`), '↓ ↓ selects the second option, named by aria-activedescendant');
await ev(`document.getElementById('buscar-op-3').dispatchEvent(new PointerEvent('pointerenter')); 1`);
ok(await ev(`${selected} === 'buscar-op-3' && document.querySelectorAll('#buscar-lista .sel').length === 1`), 'the mouse over an option selects it, and only it');
await type('logica');
ok(await ev(`!document.querySelector('#buscar-lista .sel')`), 'typing again clears the selection');
await key('ArrowUp');
ok(await ev(`document.querySelector('#buscar-lista .sel')?.classList.contains('buscar-todos')`), '↑ from nothing jumps to "see them all"');
await key('ArrowDown');
ok(await ev(`${selected} === 'buscar-op-0'`), 'past the end it wraps to the first');
await key('ArrowUp');
await key('Enter');
ok(await waitFor(`${visible}.includes('reinas') && !${visible}.includes('dudo') && document.getElementById('buscar-lista').hidden`), 'Enter on "see them all" filters the list');
await key('ArrowDown');
await waitFor(`!document.getElementById('buscar-lista').hidden`);
await key('Escape');
ok(await ev(`document.getElementById('buscar-lista').hidden && ${shown('#buscar')}`), 'a first Escape folds the dropdown');
await key('Escape');
ok(await waitFor(`!${shown('#buscar')} && ${shown('.atajos .buscar-pill')} && ${visible}.length === ${all}`), 'a second Escape closes the search');
await ev(`document.querySelector('.buscar-pill').click(); 1`);
await type('logica');
await key('ArrowDown'); await key('ArrowDown');
const href = await ev(`document.getElementById('buscar-op-1').href`);
await key('Enter');
ok(!!href && await waitFor(`location.href.split('?')[0] === ${JSON.stringify(href)}.split('?')[0]`), `↓ ↓ Enter opens the second game (${second})`);

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/search.mjs');
process.exit(failures ? 1 : 0);
