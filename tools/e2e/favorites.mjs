// The home page favorites (D-238): each card's ⭐ marks without opening the game, the
// "⭐ Favoritos" chip appears with the first one and shows only those, they are remembered on
// reload, and the die and Favoritos go in the type row where it fits and on their own line where
// it doesn't, in the four languages.
// Usage: node tools/e2e/favorites.mjs /tmp/favorites
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/favorites');
let bad = 0;
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) bad++; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const read = () => b.evaluate(`JSON.stringify({
  chip: !document.querySelector('.ficha-fav').hidden,
  on: document.querySelector('.ficha-fav').getAttribute('aria-pressed'),
  filter: __portada.filtro.tipo, visible: __portada.visibles, favorites: __portada.favoritos,
  count: document.getElementById('filtros-cuenta').hidden ? '' : document.getElementById('filtros-cuenta').textContent,
  url: location.search,
})`).then(JSON.parse);
// The ⭐ is tapped with a real finger: if it stayed inside the link, the tap would open the game
const tapStar = async id => {
  const r = await b.evaluate(`(() => { const e = document.querySelector('.fav[data-id="${id}"]'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }); })()`).then(JSON.parse);
  await b.tap(r.x, r.y); await sleep(300);
  return r;
};

await b.go(`${SITE}/`, 1500);
await b.evaluate(`localStorage.removeItem('juegos-de-salon:favoritos'); 1`);
await b.go(`${SITE}/`, 1500);
let e = await read();
check(!e.chip && !e.favorites.length, 'without favorites, the ⭐ Favoritos chip is not there');
const n = await b.evaluate(`document.querySelectorAll('.fav').length`);
const cup = await b.evaluate(`!!document.querySelector('.game-card.torneo').closest('.game-slot')`);
check(n >= 10 && !cup, `each game has its ⭐ (${n}) and La Copa doesn't`);

const r = await tapStar('ahorcado');
check(r.w >= 44 && r.h >= 44, `the ⭐ has a 44 px tap target (${r.w}×${r.h})`);
e = await read();
check(e.url === '' && e.favorites.join() === 'ahorcado', 'tapping the ⭐ marks the game and does not open it');
check(e.chip, 'with the first favorite the ⭐ Favoritos chip appears');
check(await b.evaluate(`document.querySelector('.fav[data-id="ahorcado"]').getAttribute('aria-pressed')`) === 'true', 'the marked ⭐ says aria-pressed="true"');
await tapStar('dudo');

await b.evaluate(`document.querySelector('.ficha-fav').click(); 1`); await sleep(400);
e = await read();
check(e.filter === 'favorites' && [...e.visible].sort().join() === 'ahorcado,dudo', `with ⭐ Favoritos only the two show (${e.visible.join()})`);
check(/2/.test(e.count) && e.url === '?type=favorites', `the count says how many and the filter goes in the URL (${e.count} · ${e.url})`);

// Unmarking while in Favoritos, the card stays in view: it can be marked again
await tapStar('dudo');
e = await read();
check(e.visible.includes('dudo') && e.favorites.join() === 'ahorcado', 'unmarking in Favoritos does not take it out of view');
await tapStar('dudo');

// The home page's order follows popularity (D-361), so the two are compared in any order
// They are remembered on reload, and the link with ?type=favorites comes back filtered
await b.go(`${SITE}/?type=favorites`, 1500);
e = await read();
check(e.favorites.join() === 'ahorcado,dudo' && e.filter === 'favorites' && [...e.visible].sort().join() === 'ahorcado,dudo', 'on reload they stay marked and filtered');

// Unmarking the last one while in Favoritos: all show and the chip goes away
await tapStar('ahorcado'); await tapStar('dudo');
e = await read();
check(!e.chip && !e.filter && e.visible.length > 10 && e.url === '', 'with no favorites to show, all show and the chip goes away');

// A ?type=favorites link on a phone without favorites: all of them, no noise
await b.go(`${SITE}/?type=favorites`, 1500);
e = await read();
check(!e.filter && e.visible.length > 10 && e.count === '', '?type=favorites without favorites shows all');
b.close();

// Where ⭐ Favoritos goes (D-241), in each language: at 390 px and on a computer (the home page
// doesn't go wider than a phone), first in the type row; at 320 px, where it fits (English fits
// in the row; the other three, on their own line). Since D-369 the row is the ✨ Nuevos / 🔥 Populares one when it
// shows. The types always go in one row and nothing overflows.
const WIDTHS = [[320, 'where it fits'], [390, 'row'], [900, 'row']];
const at320 = [];
for (const [width, expect] of WIDTHS) for (const lang of ['es', 'en', 'pt']) {
  const c = await launch({ dir: `${OUT}/p${width}${lang}`, out: OUT, width, height: 700 });
  await c.go(`${SITE}/?lang=${lang}`, 1500);
  await c.evaluate(`localStorage.setItem('juegos-de-salon:favoritos', '["ahorcado","tango"]'); 1`);
  await c.go(`${SITE}/?lang=${lang}&type=favorites`, 1500);
  const f = await c.evaluate(`JSON.stringify((() => { const types = document.querySelector('.filtros .tipos');
    const bs = [...types.querySelectorAll('button')].filter(x => !x.hidden);
    const fav = document.querySelector('.ficha-fav'), rf = fav.getBoundingClientRect(), row = types.getBoundingClientRect();
    const tops = new Set(bs.map(x => Math.round(x.getBoundingClientRect().top)));
    // Since D-369 ⭐ goes first in the ✨ Nuevos / 🔥 Populares row when it shows; otherwise in the types
    const picks = document.querySelector('.filtros .atajos'), inPicks = fav.parentNode === picks;
    const inRow = inPicks || fav.parentNode === types, named = getComputedStyle(fav.lastChild).display !== 'none';
    const own = inPicks ? [...picks.querySelectorAll('button')].filter(x => !x.hidden) : bs;
    return { shape: inRow ? (inPicks ? 'picks' : 'row') + (named ? ' with name' : '') : 'line', first: !inRow || own[0] === fav,
      above: inRow || rf.bottom <= row.top, tap: rf.height >= 44 && rf.width >= 44,
      rows: tops.size, overflows: bs.some(x => x.getBoundingClientRect().right > row.right + 1), width: document.documentElement.scrollWidth,
      // If something overflows the screen, which (against the requested width and not innerWidth:
      // on an emulated phone, the screen widens with what overflows). The background sparkles don't count
      outside: [...document.querySelectorAll('body *')].filter(x => x.getBoundingClientRect().right > ${width} + 0.5 && !x.closest('[hidden], .bg-sparkles'))
        .map(x => (x.id ? '#' + x.id : x.className ? '.' + String(x.className).split(' ')[0] : x.tagName) + ' «' + x.textContent.trim().slice(0, 24) + '» in ' + (x.parentElement.className || x.parentElement.tagName) + ':' + Math.round(x.getBoundingClientRect().right)
          + ' font ' + getComputedStyle(x).fontFamily.slice(0, 30)).slice(0, 6) };
  })())`).then(JSON.parse);
  const shape = expect === 'row' ? f.shape.startsWith('picks') : true;
  if (width === 320) at320.push(f.shape);
  check(shape && f.first && f.above && f.tap && f.rows === 1 && !f.overflows && f.width <= width,
    `${lang} at ${width} px: ⭐ Favoritos ${expect === 'row' ? 'in the row' : 'where it fits'}, the types in one row and nothing overflows (${JSON.stringify(f)})`);
  await c.evaluate(`scrollTo(0, 0); 1`);
  await c.shot(`home-${width}-${lang}`);
  check(!c.errors.length, `${lang} at ${width} px: no console errors ${JSON.stringify(c.errors)}`);
  c.close();
}
// At 320 px the 🔎 pill shares the ✨ / 🔥 row (D-396, for everyone since D-403): ⭐ goes where it fits in each
// language (D-364), checked above; here, that it always found a place
check(at320.length === 3 && at320.every(s => /^(picks|row|line)/.test(s)), `at 320 px, ⭐ finds a place beside the 🔎 pill in every language (${at320.join(', ')})`);
if (bad) process.exit(1);
