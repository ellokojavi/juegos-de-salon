// The dice's scene shows only on the page it was for (D-237, D-375). Uso: node public/assets/js/llegada.test.mjs
import assert from 'node:assert/strict';
import { esPara } from './llegada.js';

assert.equal(esPara({ para: '/hangman/' }, '/hangman/'), true, 'the game the dice opened shows the scene');
assert.equal(esPara({ para: '/hangman/' }, '/hangman/index.html'), true, 'also served as index.html');
assert.equal(esPara({ para: '/hangman/' }, '/'), false, 'back on the home page before the game loaded: no scene, the dice can roll');
assert.equal(esPara({ para: '/hangman/' }, '/zip/'), false, 'another page: no scene');
assert.equal(esPara({ emoji: '🎯' }, '/zip/'), true, 'a scene from before D-375 (no `para`) still shows');
assert.equal(esPara(null, '/'), false);
console.log('✓ the dice scene shows only on its game');
