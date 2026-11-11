import test from 'node:test';
import assert from 'node:assert/strict';
import { gameOfChip, coverShareText, coverUrl } from './cover-share.js';
import { COMMON, LANGS } from './i18n.js';

test('the chip gives the emoji and the name', () => {
  assert.deepEqual(gameOfChip('🪢 El Ahorcado'), { emoji: '🪢', name: 'El Ahorcado' });
  assert.deepEqual(gameOfChip('Generala'), { emoji: '🎲', name: 'Generala' });
});

test('the message has the header and the invitation in every language', () => {
  for (const l of LANGS) {
    const t = coverShareText({ C: COMMON[l], emoji: '🪢', name: 'X' });
    assert.ok(t.startsWith('🪢 *X*'));
    assert.ok(COMMON[l].shareGameCta && COMMON[l].shareGame, l);
  }
});

test('the link leaves out search and hash', () => {
  assert.equal(coverUrl({ origin: 'https://juegosdesalon.cl', pathname: '/hangman/', search: '?room=ABCD', hash: '#x' }), 'https://juegosdesalon.cl/hangman/');
});
