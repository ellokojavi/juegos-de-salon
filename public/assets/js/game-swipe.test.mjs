// Swiping between games on a cover (game-swipe.js, flag game-swipe): the kept list and its neighbours.
// node public/assets/js/game-swipe.test.mjs
import assert from 'node:assert/strict';
import { rememberList, neighbours, LIST_KEY, LIST_MS } from './game-swipe.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), m }; };
globalThis.location = { href: 'https://juegosdesalon.cl/' };

const store = mem(), now = 1_000_000;
rememberList(['https://juegosdesalon.cl/hangman/', 'https://juegosdesalon.cl/tango/index.html', '/zip/'], { store, now });
assert.deepEqual(JSON.parse(store.getItem(LIST_KEY)).paths, ['/hangman/', '/tango/', '/zip/'], 'paths kept in order, index.html dropped');

assert.deepEqual(neighbours('/tango/', { store, now }), { prev: '/hangman/', next: '/zip/' });
assert.deepEqual(neighbours('/tango/index.html', { store, now }), { prev: '/hangman/', next: '/zip/' }, 'the page with index.html is the same page');
assert.deepEqual(neighbours('/zip/', { store, now }), { prev: '/tango/', next: '/hangman/' }, 'the last one wraps to the first');
assert.deepEqual(neighbours('/hangman/', { store, now }), { prev: '/zip/', next: '/tango/' }, 'and the first back to the last');
assert.equal(neighbours('/queens/', { store, now }), null, 'a page not in the list does nothing');
assert.equal(neighbours('/tango/', { store, now: now + LIST_MS + 1 }), null, 'a list from another visit is ignored');
assert.equal(neighbours('/tango/', { store: mem(), now }), null, 'no list, nothing');

const one = mem(); rememberList(['/tango/'], { store: one, now });
assert.equal(neighbours('/tango/', { store: one, now }), null, 'a list of one has nowhere to go');
// Storage that throws (private mode) never breaks the cover
assert.equal(neighbours('/tango/', { store: { getItem() { throw new Error('no'); } }, now }), null);
rememberList(['/a/'], { store: { setItem() { throw new Error('no'); } }, now });
console.log('✓ game-swipe: the list, its neighbours and their wrap');
