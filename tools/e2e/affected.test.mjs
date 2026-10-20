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
// When in doubt, all: a file no page loads, tools/e2e's shared code, the e2e workflow, a tool a script imports
assert.equal(run(['public/sw.js']), 'all');
assert.equal(run(['tools/e2e/cdp.mjs']), 'all');
assert.equal(run(['.github/workflows/e2e.yml']), 'all');
assert.equal(select({ changes: ['tools/push/vapid.mjs'], graph, scripts: [{ name: 'daily.mjs', source: "import '../push/vapid.mjs'" }], shared }), null);

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
