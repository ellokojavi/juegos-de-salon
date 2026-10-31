// node tools/e2e/narrow.test.mjs — a change narrowed to the names it reaches (D-516)
import assert from 'node:assert/strict';
import { before, changedNames, narrowed, parseChange, scan } from './narrow.mjs';
import { names, usedOn, select, READ_BY } from './affected.mjs';

// A unified patch from two versions (enough context to place each hunk)
function patchOf(a, b) {
  const x = a.split('\n'), y = b.split('\n');
  let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++;
  let j = 0; while (j < x.length - i && j < y.length - i && x[x.length - 1 - j] === y[y.length - 1 - j]) j++;
  const ctx = Math.min(i, 2), tail = Math.min(j, 2);
  const old = x.slice(i, x.length - j), neu = y.slice(i, y.length - j);
  const lines = [...x.slice(i - ctx, i).map(l => ' ' + l), ...old.map(l => '-' + l), ...neu.map(l => '+' + l), ...x.slice(x.length - j, x.length - j + tail).map(l => ' ' + l)];
  return `@@ -${i - ctx + 1},${ctx + old.length + tail} +${i - ctx + 1},${ctx + neu.length + tail} @@\n${lines.join('\n')}`;
}

const TEXTS = `import { x } from './y.js';

export const COMMON = {
  es: {
    appTitle: 'Juegos',
    appSub: 'Cortos', appFree: 'Gratis',
    backGuard: {
      title: '¿Salir?',
      stay: 'Seguir',
    },
  },
  en: {
    appTitle: 'Games',
    appSub: 'Short', appFree: 'Free',
    backGuard: {
      title: 'Leave?',
      stay: 'Stay',
    },
  },
};

export function title(lang) {
  return COMMON[lang].appTitle;
}

function helper(n) {
  return n + 1;
}

export function twice(n) {
  return helper(helper(n));
}
`;
const edit = (from, to) => { const after = TEXTS.replace(from, to); return changedNames('public/i18n.js', after, patchOf(TEXTS, after)); };

assert.ok(scan(TEXTS), 'the sample balances');
assert.ok(scan("const s = `a ${b({ c: 1 })} d`;\n"), 'a template with an object inside balances');
assert.equal(before(TEXTS.replace("'Gratis'", "'Libre'"), patchOf(TEXTS, TEXTS.replace("'Gratis'", "'Libre'"))), TEXTS, 'the patch undone gives the file before');
assert.equal(before('a\nb\nc', '@@ -1,2 +1,2 @@\n-z\n+q\n b'), null, 'a patch that does not fit the file narrows nothing');

// A text changes: only its key, in either language
assert.deepEqual(edit("appFree: 'Free'", "appFree: 'Free of charge'"), ['appFree', 'appSub'], 'by line: the keys that share it count too');
assert.deepEqual(edit("title: 'Leave?',", "title: 'Leave the game?',"), ['backGuard']);
assert.deepEqual(edit("stay: 'Seguir',", "stay: '▶ Seguir',"), ['backGuard'], 'a nested text is its top key');
assert.deepEqual(edit("appTitle: 'Games',", "appTitle: 'Party games',"), ['appTitle', 'title'], 'a helper of the file that reads the key counts too');
// A new key next to the others
assert.deepEqual(edit("    appSub: 'Short', appFree: 'Free',\n", "    appSub: 'Short', appFree: 'Free',\n    appNew: 'New',\n"), ['appNew']);
// A language added or a brace moved: every key, so the whole file
assert.equal(edit("  en: {\n", "  pt: { appTitle: 'Jogos' },\n  en: {\n"), null);
// A helper changes: it and those that use it
assert.deepEqual(edit('return n + 1;', 'return n + 2;'), ['helper', 'twice']);
// An import or other top-level code: the whole file
assert.equal(edit("import { x } from './y.js';", "import { x, z } from './y.js';"), null);
assert.equal(changedNames('public/a.js', 'export function f() { return 2; }\nf();\n', patchOf('export function f() { return 1; }\nf();\n', 'export function f() { return 2; }\nf();\n')), null, 'a declaration the file runs when it loads reaches every page');
// Only comments or blank lines in between: nothing to narrow on their own
assert.equal(changedNames('public/a.css', 'a{}', '@@ -1 +1 @@\n-b{}\n+a{}'), null, 'not JavaScript');
assert.equal(narrowed('tools/x.js', TEXTS, '@@'), 'tools/x.js', 'only site files are narrowed');
assert.deepEqual(parseChange('public/a.js#uses=f,g'), { file: 'public/a.js', uses: ['f', 'g'] });
assert.deepEqual(parseChange('public/a.js'), { file: 'public/a.js', uses: null });

// Which pages a narrowed change reaches
assert.ok(names("import { COMMON } from './i18n.js';\nel.textContent = t.appFree;", ['appFree']));
assert.ok(!names('// appFree in a comment\nconst appFreeX = 1;', ['appFree']), 'a comment or a longer name is not a use');
assert.ok(names('<p data-i18n="appFree"></p>', ['appFree']), 'an HTML attribute that names the key');
const files = {
  'index.html': '<script type="module" src="home.js"></script>',
  'home.js': "import { COMMON } from './assets/i18n.js'; t.appFree;",
  'hangman/index.html': '<script type="module" src="game.js"></script>',
  'hangman/game.js': "import { COMMON } from '../assets/i18n.js'; t.appTitle;",
  'assets/i18n.js': TEXTS,
};
const graph = { '': new Set(['index.html', 'home.js', 'assets/i18n.js']), hangman: new Set(['hangman/index.html', 'hangman/game.js', 'assets/i18n.js']) };
assert.deepEqual(usedOn('assets/i18n.js', ['appFree'], ['', 'hangman'], graph, files), ['']);
assert.equal(usedOn('assets/i18n.js', ['nowhere'], ['', 'hangman'], graph, files), null, 'a name no file writes may be reached another way: the whole file');
const scripts = [
  { name: 'home/cards.mjs', source: "await page(`${SITE}/`)" },
  { name: 'hangman/local.mjs', source: "await page(`${SITE}/hangman/`)" },
  { name: 'smoke.mjs', source: '' },
  { name: 'installable.mjs', source: "await page(`${SITE}/`)" },
];
const run = changes => select({ changes, graph, scripts, shared: () => false, files })?.scripts;
assert.deepEqual(run(['public/assets/i18n.js#uses=appTitle']), ['hangman/local.mjs', 'smoke.mjs'].filter(s => run(['public/assets/i18n.js#uses=appTitle']).includes(s)));
assert.ok(!run(['public/assets/i18n.js#uses=appTitle']).includes('home/cards.mjs'), "a text only the game shows doesn't run the home page's scripts");
assert.ok(run(['public/assets/i18n.js']).includes('home/cards.mjs'), 'the whole file still reaches every page');
assert.deepEqual(run(['public/assets/i18n.js#uses=appFree', 'public/assets/i18n.js']).sort(), run(['public/assets/i18n.js']).sort(), 'whole and narrowed in one list: whole wins');
// Files whose readers are known
assert.ok(READ_BY.some(r => r.test('manifest.pt.webmanifest')));
assert.deepEqual(run(['public/manifest.en.webmanifest']), ['smoke.mjs', 'installable.mjs'].filter(s => run(['public/manifest.en.webmanifest']).includes(s)));
assert.ok(run(['public/manifest.en.webmanifest']).includes('installable.mjs'));
assert.deepEqual(run(['public/assets/og/huellas.json']), [], "the cards' fingerprints run no script");

console.log('narrow: a change reaches only the pages that name what it changed, green');
