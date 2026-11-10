// The site footer's options (U-38): a screen outside a game ends with site-footer.js, never with
// loose links of its own. Every loose `link-btn` on a player page is listed here with why it may
// stay; a new one fails until it is either a footer option or added with its reason.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const BRIDGES = /^(ahorcado|copa|minijuegos|minigames)\//;

/** Where a loose quiet link is allowed: inside a game, on a result screen, or an inline action. */
const ALLOWED = {
  'index.html': 'clear filters, inside the home page list',
  'cup/game.js': 'the in-game 🐞 (#btn-comentario), the report button the board footer reuses, and the board\'s legacy links while cup-footer is in the lab',
  'today/index.html': 'repeat today\'s game, on the result',
  'assets/js/buzon.js': 'the one quiet inbox link of a result screen',
  'assets/js/uno-al-dia-avisos.js': '«Ahora no» inside the reminder card',
  'assets/js/uno-al-dia-ui.js': 'repeat today\'s game, on the result',
  'labs/artifacts/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
  'labs/code/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
  'labs/dominorama/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
  'labs/exploding-numbers/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
  'labs/flap/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
  'labs/memory/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
  'labs/stack/game.js': 'the game\'s 💬 comment while playing; on the cover it is the footer\'s option (footerInto)',
};

const walk = (dir, rel = '') => readdirSync(dir).flatMap(f => {
  const r = rel + f, u = new URL(f, dir);
  if (statSync(u).isDirectory()) return BRIDGES.test(r + '/') ? [] : walk(new URL(f + '/', dir), r + '/');
  return /\.(js|html)$/.test(f) && !f.includes('.test.') ? [r] : [];
});

const found = walk(root).filter(f => /class: 'link-btn/.test(readFileSync(new URL(f, root), 'utf8')));
for (const f of found) assert.ok(ALLOWED[f], `${f}: a loose link-btn; make it an option of site-footer.js (mountFooter options) or list it in ALLOWED with why`);

// La Copa's board passes its own report and leave as footer options, with no general inbox
const game = readFileSync(new URL('cup/game.js', root), 'utf8');
assert.match(game, /mountFooter\(body, \{[^}]*inbox: false, options: \[reporte, salir\(T\.leaveTile\)\]/);

// Their tile labels exist in the three languages, each with its emoji for the color circle
const rules = readFileSync(new URL('cup/rules.js', root), 'utf8');
for (const k of ['reportTile', 'leaveTile']) assert.equal([...rules.matchAll(new RegExp(`^  ${k}: '(\\S+) `, 'gmu'))].length, 3, `${k} in es, en and pt`);

// Every lab game's cover ends with the site footer too (C-17): a page with a game.js either mounts it
// in its index.html or calls footerInto from its game.js
const labs = new URL('labs/', root);
for (const g of readdirSync(labs)) {
  const dir = new URL(g + '/', labs);
  if (!statSync(new URL(g, labs)).isDirectory() || !readdirSync(dir).includes('game.js')) continue;
  const both = readFileSync(new URL('index.html', dir), 'utf8') + readFileSync(new URL('game.js', dir), 'utf8');
  assert.match(both, /mountFooter\(|footerInto\(/, `labs/${g}: its cover has no site footer (mountFooter in index.html, or footerInto)`);
}

console.log('site-footer.test.mjs ok');
