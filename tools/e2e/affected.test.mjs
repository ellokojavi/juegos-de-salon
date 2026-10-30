// Run: node tools/e2e/affected.test.mjs
// Which end-to-end scripts a PR needs (D-329): those whose pages load what it changed.
import assert from 'node:assert/strict';
import { references, closures, scriptPages, select, chooseJobs, siteGraph, affectedJobs } from './affected.mjs';
import { levelOf } from './affected.mjs';
import { noBrowser } from './changes.mjs';

// References: HTML, ES imports (static, re-exports, literal dynamic ones) and CSS, resolved from the file's folder
assert.deepEqual(references('hangman/index.html', '<link rel="stylesheet" href="../assets/css/base.css"><script type="module" src="game.js"></script><a href="https://x.cl/">'),
  ['assets/css/base.css', 'hangman/game.js']);
assert.deepEqual(references('hangman/game.js', "import { $ } from '../assets/js/ui.js';\nexport { x } from './rules.js';\nimport('../assets/js/sound.js');\nimport(`./${x}.js`);"),
  ['assets/js/ui.js', 'hangman/rules.js', 'assets/js/sound.js']);
assert.deepEqual([...new Set(references('assets/css/a.css', "@import url('b.css'); .x { background: url(../img/y.png) }"))].sort(), ['assets/css/b.css', 'assets/img/y.png']);

// Closures: a page has what it loads, not the pages it links to
const files = {
  'index.html': '<a href="hangman/"></a><script type="module" src="assets/js/home.js"></script>',
  'hangman/index.html': '<script type="module" src="game.js"></script>',
  'hangman/game.js': "import '../assets/js/ui.js';",
  'labs/case/index.html': '<script type="module" src="game.js"></script>',
  'labs/case/game.js': "import '../../assets/js/ui.js';",
  'assets/js/home.js': '', 'assets/js/ui.js': '',
};
const graph = closures(files);
assert.deepEqual(Object.keys(graph).sort(), ['', 'hangman', 'labs/case']);
assert.ok(graph.hangman.has('assets/js/ui.js') && !graph[''].has('hangman/game.js'));

// A script's pages, from `${SITE}/…`
assert.deepEqual([...scriptPages('go(`${SITE}/hangman/`); go(`${SITE}/`)', Object.keys(graph))].sort(), ['', 'hangman']);

const scripts = [
  { name: 'hangman/local.mjs', source: 'go(`${SITE}/hangman/`)' },
  { name: 'case/lab.mjs', source: 'go(`${SITE}/labs/case/`)' },
  { name: 'favorites.mjs', source: 'go(`${SITE}/`)' },
  { name: 'room-error.mjs', source: "for (const g of ['hangman']) go(`${SITE}/${g}/`)" },
  { name: 'loop.mjs', source: 'for (const r of routes) go(`${SITE}/${r}`)' },
];
const shared = f => noBrowser([f]);
const run = changes => select({ changes, graph, scripts, shared })?.scripts ?? 'all';
// One game: its scripts, the ones that name it, and the one that can't say where it goes
assert.deepEqual(run(['public/hangman/game.js']), ['hangman/local.mjs', 'room-error.mjs', 'loop.mjs']);
// Something shared: every page that loads it
assert.deepEqual(run(['public/assets/js/ui.js']), ['hangman/local.mjs', 'case/lab.mjs', 'room-error.mjs', 'loop.mjs']);
// Unit tests and notes inside public/, docs, the workshop no script imports: nothing
assert.deepEqual(run(['public/hangman/rules.test.mjs', 'docs/decisions/D-1.md', 'tools/release/changelog.mjs']), []);
// A changed script runs itself
assert.deepEqual(run(['tools/e2e/favorites.mjs']), ['favorites.mjs']);
// durations.json only groups the scripts: next to a game's change it adds nothing (it used to make it all)
assert.deepEqual(run(['public/hangman/game.js', 'tools/e2e/durations.json']), run(['public/hangman/game.js']));
// When in doubt, all: a file no page loads, tools/e2e's shared code, the e2e workflow, a tool a script imports
assert.equal(run(['public/sw.js']), 'all');
assert.equal(run(['tools/e2e/cdp.mjs']), 'all');
assert.equal(run(['.github/workflows/e2e.yml']), 'all');
assert.equal(select({ changes: ['tools/push/vapid.mjs'], graph, scripts: [{ name: 'daily.mjs', source: "import '../push/vapid.mjs'" }], shared }), null);
// Named only in a comment, it is not imported: no doubt, nothing runs (#1060)
assert.deepEqual(select({ changes: ['tools/release/readme.py'], graph, scripts: [{ name: 'k.mjs', source: '// tools/release/readme.py redoes them\n/* see release/readme.py */' }], shared }).scripts, []);

// Parts named after a game run only with that game
const choice = select({ changes: ['public/hangman/game.js'], graph, scripts: [{ name: 'cup-games/languages.mjs', source: 'SUELTOS' }], shared });
assert.deepEqual(chooseJobs(['cup-games/languages.mjs:hangman', 'cup-games/languages.mjs:case'], choice, Object.keys(graph)), ['cup-games/languages.mjs:hangman']);

// The real site: a lab game's change stays in the lab; La Copa's styles don't reach Generala
const real = siteGraph();
assert.ok(Object.keys(real).length > 20 && real.cup.size > 20, 'the graph reads the site');
const jobs = ['labs/routes.mjs', 'exploding-numbers/lab.mjs', 'generala/local.mjs', 'cup/seat.mjs'];
assert.deepEqual(affectedJobs(jobs, ['public/labs/exploding-numbers/engine.js'], shared), ['exploding-numbers/lab.mjs']);
assert.deepEqual(affectedJobs(jobs, ['public/cup/style.css'], shared), ['cup/seat.mjs']);
// Only the home page (D-388): its own scripts, not a game's that starts there and clicks its card
{
  const g = { '': new Set(['index.html']), hangman: new Set(['hangman/index.html']) };
  const scripts = [
    { name: 'home/dice.mjs', source: '`${SITE}/?test`' },
    { name: 'smoke.mjs', source: 'every page' },
    { name: 'favorites.mjs', source: "b.go(`${SITE}/?test`)" },
    { name: 'hangman/local.mjs', source: "b.go(`${SITE}/?test`); b.go(`${SITE}/hangman/`)" },
  ];
  assert.deepEqual(select({ changes: ['public/index.html'], graph: g, scripts, shared }).scripts, ['home/dice.mjs', 'smoke.mjs', 'favorites.mjs']);
}
// What a page loads on demand counts (D-391): import('…') in its HTML, and new URL('…') in a script
{
  const files = {
    'index.html': `<script type="module">if (x) import('./labs/home/search.js');</script><script type="module" src="assets/js/a.js"></script>`,
    'labs/home/search.js': '', 'assets/js/a.js': "const l = new URL('assets/css/b.css', ROOT); // see hangman/game.js", 'assets/css/b.css': '', 'hangman/game.js': '',
  };
  const g = closures(files);
  assert.ok(g[''].has('labs/home/search.js'), "an inline import('…') is part of the page");
  assert.ok(g[''].has('assets/css/b.css'), "new URL('…', ROOT) is part of the page");
  assert.ok(!g[''].has('hangman/game.js'), 'a file named in a comment is not');
}
console.log('affected: which end-to-end scripts a PR needs, green');

// The test level (D-346)
{
  const c = (pages, scripts = ['x.mjs']) => ({ scripts, pages: new Set(pages), changedScripts: new Set() });
  assert.equal(levelOf(c([], []), 30).level, 'N0', 'nothing a page loads: unit tests only');
  assert.equal(levelOf(c(['labs/bridges']), 30).level, 'N1', 'a lab game');
  assert.equal(levelOf(c(['hangman']), 30).level, 'N2', 'a production game');
  assert.equal(levelOf(c(['labs/bridges', 'hangman']), 30).level, 'N2', 'lab and production: the production one rules');
  assert.equal(levelOf(c(['']), 30).name, 'home', 'the home page alone: its own scripts (D-388)');
  assert.equal(levelOf(c(['', 'hangman']), 30).level, 'N3', 'the home page and a game: core');
  assert.equal(levelOf(c(Array.from({ length: 10 }, (_, i) => `g${i}`)), 30).level, 'N3', 'a third of the pages is core');
  assert.equal(levelOf(null, 30).level, 'N3', 'what the graph cannot narrow is core');
}

// Played, not just imported (D-378): a Cup game's file, or an engine La Copa takes from a group game, reaches
// that game's page, La Copa and cup/suelto and the declared reuses, not the screens of La Copa's other games
{
  const { playedOn } = await import('./affected.mjs');
  const screen = files => new Set(['cup/game.js', ...files]);
  const graph = { cup: screen([]), 'cup/suelto': screen([]), queens: screen([]), zip: screen([]), 'bulls-and-cows': new Set(), hangman: new Set(), timeline: new Set() };
  const all = Object.keys(graph);
  assert.deepEqual(playedOn('cup/games/queens/engine.js', all, graph).sort(), ['bulls-and-cows', 'cup', 'cup/suelto', 'hangman', 'queens', 'timeline'],
    "Queens' engine: its page and La Copa's, not Zip's screen (the others are not screens: they keep it)");
  assert.deepEqual(playedOn('bulls-and-cows/engine.js', ['cup', 'cup/suelto', 'queens', 'zip', 'bulls-and-cows'], graph).sort(), ['bulls-and-cows', 'cup', 'cup/suelto'],
    'a group engine La Copa plays: its own page and La Copa, not the other games\' screens');
  assert.deepEqual(playedOn('cup/games/number/engine.js', ['cup', 'queens', 'bulls-and-cows'], graph).sort(), ['bulls-and-cows', 'cup'], 'a declared reuse keeps its page');
  assert.deepEqual(playedOn('cup/game.js', ['cup', 'queens', 'zip'], graph), ['cup', 'queens', 'zip'], "La Copa's own screen code reaches every screen");
  assert.deepEqual(playedOn('assets/js/ui.js', ['cup', 'queens'], graph), ['cup', 'queens'], 'a shared module reaches every page');
}
console.log('affected: played, not just imported, green');

// A picture a script names by its path from the root (a splash teaser) reaches the pages that load the
// script, not every page (D-430)
{
  const { assetsNamed } = await import('./affected.mjs');
  assert.deepEqual(assetsNamed('assets/js/splash.js', `{ img: 'assets/splash/bridges-teaser.gif', still: "assets/splash/bridges-teaser.png" }`, {}),
    ['assets/splash/bridges-teaser.gif', 'assets/splash/bridges-teaser.png']);
  const g = closures({ 'index.html': '<script type="module" src="assets/js/splash.js"></script>', 'assets/js/splash.js': `const x = 'assets/splash/a.gif';`, 'hangman/index.html': '<p></p>' });
  assert.ok(g[''].has('assets/splash/a.gif') && !g.hangman.has('assets/splash/a.gif'));
}

// A folder a script fetches files from by name (`new URL('earth-2004-09/', import.meta.url)`) reaches
// every file under it, and a deleted file that nothing names any more narrows nothing (D-460)
{
  const { assetsNamed, loads } = await import('./affected.mjs');
  assert.deepEqual(assetsNamed('cup/games/where/globo.js', "new URL('earth-2004-09/', import.meta.url); new URL('../../../', import.meta.url)", {}),
    ['cup/games/where/earth-2004-09/'], 'a named folder counts; a bare climb to the root does not');
  const g = closures({ 'where/index.html': '<script type="module" src="../cup/games/where/globo.js"></script>', 'cup/games/where/globo.js': "const T = new URL('earth-2004-09/', import.meta.url);", 'hangman/index.html': '<p></p>' });
  assert.ok(loads(g.where, 'cup/games/where/earth-2004-09/5-4.webp') && !loads(g.hangman, 'cup/games/where/earth-2004-09/5-4.webp'));
  const s = [{ name: 'where.mjs', source: 'go(`${SITE}/where/`)' }, { name: 'hangman/local.mjs', source: 'go(`${SITE}/hangman/`)' }];
  const pick = (changes, exists) => select({ changes, graph: g, scripts: s, shared: f => noBrowser([f]), exists })?.scripts ?? 'all';
  assert.deepEqual(pick(['public/cup/games/where/earth-2004-09/5-4.webp']), ['where.mjs'], 'a tile reaches the page that loads its folder');
  assert.deepEqual(pick(['public/assets/img/old.jpg', 'public/cup/games/where/globo.js'], () => false), ['where.mjs'], 'a deleted file nothing names narrows nothing');
  assert.equal(pick(['public/assets/img/runtime.jpg'], () => true), 'all', 'a file that is there and nothing names may be fetched at run time: all');
}
console.log('affected: media folders and deleted files, green');
