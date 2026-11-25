// The share templates (share-templates.js, docs/SHARING.md): every template, in every language and for
// every game, gives a message in the U-30 format; and no page builds a share's text by hand.
// Usage: node public/assets/js/share-templates.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KINDS, message, header, taglineOf, roomInvite, appInvite, videoShare, gameLink, soloResult, invite, result, table, formatProblems } from './share-templates.js';
import { COMMON, IDIOMAS } from './i18n.js';
import { ALL_GAMES } from './games.js';

let n = 0;
const ok = (text, what) => { assert.deepEqual(formatProblems(text), [], `${what}:\n${text}`); n++; };

// The check itself catches what it is for
assert.deepEqual(formatProblems('🪢 *El Ahorcado* · Sala WFBN\n\n👋 Javi te invita.'), []);
assert.ok(formatProblems('📅 *Uno al día*\n🔥 Racha').length, 'no blank line after the header');
assert.ok(formatProblems('⚔️ Javi te reta a un duelo').length, 'no header');
assert.ok(formatProblems('🪢 *X* · Sala A\n\n👋  te invita').length, 'a name that did not arrive');
assert.ok(formatProblems('🎲 *X*\n\n🔗 https://x').length, 'the link inside');
assert.ok(formatProblems('🎲 *X*\n\nHola {name}').length, 'a placeholder left');
assert.throws(() => message({ kind: 'otro', head: { emoji: '🎲', title: 'X' } }));
assert.equal(header({ emoji: '🏆', title: 'La Copa: V', context: 'Día 3 de 7' }), '🏆 *La Copa: V* · Día 3 de 7');
assert.equal(message({ kind: 'invite', head: { emoji: '🎲', title: 'X' }, tagline: '🎮 T', lines: ['a', '', 'b'], paragraphs: ['', 'c'] }), '🎲 *X*\n\n🎮 T\na\nb\n\nc');
assert.deepEqual([...KINDS], ['room', 'invite', 'app', 'game', 'result', 'table', 'video']);

const langs = IDIOMAS.map(i => i.code || i).filter(l => COMMON[l]);
assert.ok(langs.length >= 3, `languages: ${langs}`);
const games = ALL_GAMES.filter(g => g.available && !g.bodega);
for (const lang of langs) {
  const C = COMMON[lang];
  ok(appInvite({ C, games: 32 }), `app ${lang}`);
  ok(videoShare({ C }), `video ${lang}`);
  for (const g of games) {
    const name = g.name?.[lang] || g.name?.es || g.id, tagline = taglineOf(g.tagline, lang);
    ok(roomInvite({ C, emoji: g.emoji, game: name, code: 'WFBN', name: 'Javi', tagline }), `room ${g.id} ${lang}`);
    ok(gameLink({ C, emoji: g.emoji, name, tagline }), `game ${g.id} ${lang}`);
    ok(soloResult({ C, emoji: g.emoji, game: name, tagline }), `solo ${g.id} ${lang}`);
  }
  // A room invite before the inviter's name arrived does not read "👋  te invita"
  ok(roomInvite({ C, emoji: '🪢', game: 'X', code: 'WFBN', name: '' }), `room without a name ${lang}`);
  ok(roomInvite({ C, emoji: '🪢', game: 'X', code: 'WFBN', name: '  ' }), `room with a blank name ${lang}`);
}
ok(invite({ head: { emoji: '📅', title: 'Uno al día', context: 'Te desafío' }, lines: ['🔥 Llevo 5 días. ¿Te atreves?'] }), 'uno al día invite');
ok(result({ head: { emoji: '📅', title: 'Uno al día n.° 41' }, lines: ['🟩🟩', '🔥 Racha: 5 días'] }), 'uno al día result');
ok(table({ head: { emoji: '📊', title: 'La Copa: V', context: 'Tabla' }, paragraphs: ['⏳ Faltan: Pepe'] }), 'cup table');

// No page builds a share's text by hand: the header comes from share-templates.js (cabecera() is its old
// name, kept for compartir.js), and no text holds a header pattern of its own
const root = fileURLToPath(new URL('../../', import.meta.url));
const BRIDGES = /^(ahorcado|copa|minijuegos|minigames)\//;
const OWN = new Set(['assets/js/share-templates.js', 'assets/js/compartir.js']);
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f), r = relative(root, p);
    if (BRIDGES.test(`${r}/`) || f === 'node_modules') continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (r.endsWith('.js') && !r.endsWith('.test.mjs')) files.push(r);
  }
})(root);
const hand = [];
for (const r of files) {
  if (OWN.has(r)) continue;
  const src = readFileSync(join(root, r), 'utf8');
  if (/\bcabecera\(/.test(src)) hand.push(`${r}: calls cabecera(); use a template of share-templates.js`);
  if (/`\$\{[^}`]+\} \*\$\{/.test(src)) hand.push(`${r}: builds a "{emoji} *{title}*" header by hand`);
  if (/\{emoji\} \*\{/.test(src)) hand.push(`${r}: a text with its own "{emoji} *{…}*" header`);
}
assert.deepEqual(hand, [], 'every share text goes through share-templates.js (docs/SHARING.md)');

console.log(`share-templates: ${n} messages in the U-30 format, ${files.length} files with no hand-built header`);
