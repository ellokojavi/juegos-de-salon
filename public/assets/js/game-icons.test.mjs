// Game icons (docs/DESIGN.md rule 9): a screen that shows a game's icon in the page uses gameIcon()
// / withIcon() from game-icon.js, so a game drawn as an icon (Sudoku) shows its drawing everywhere.
// It scans public/ for a game's `.emoji` written into DOM-building code; text-only places keep the
// emoji stand-in and are listed below with their reason. Uso: node public/assets/js/game-icons.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

// A game's emoji: a game entry (g, G, j, J, game, juego, elegido), La Copa's table or a lookup by id
const GAME_EMOJI = /\b(?:J|G|g|j|game|juego|elegido)\.emoji\b|JUEGOS_COPA(?:_ES)?(?:\[[^\]]*\]|\.[a-z]+)\??\.emoji|(?:gameById|juegoDia)\([^)]*\)\??\.emoji|JC\[[^\]]*\]\??\.emoji/;
// …written into the page: an element, a node, its text or its HTML
const DOM = /\bel\(|\bnode\(|textContent|replaceChildren|\.append\(|innerHTML|<span|conEmoji\(/;

// The text-only places (and the owner's own pages): file, a piece of the line, why the emoji stays
const ALLOWED = [
  ['public/today/index.html', 'fmt(T.hoyListo', 'a sentence formatted as text ("You played #️⃣ Sudoku…"): the emoji stands in'],
  ['public/labs/daily-score/index.html', '${emoji(', "a lab prototype built as an HTML string, the owner's only"],
];

const files = execFileSync('git', ['ls-files', 'public'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
  .filter(f => /\.(js|html)$/.test(f) && !/\.test\.mjs$/.test(f))
  .filter(f => !/^public\/(ahorcado|copa|minijuegos|minigames)\//.test(f)) // generated bridges
  .filter(f => !/\/manifests\//.test(f) && !/^public\/panel\//.test(f)); // data; the owner's panel is text

const used = new Set();
const hits = [];
for (const f of files) {
  readFileSync(ROOT + f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments
    const a = ALLOWED.findIndex(([af, piece]) => af === f && line.includes(piece));
    if (a >= 0) { used.add(a); return; }
    if (GAME_EMOJI.test(line) && DOM.test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 140)}`);
  });
}
assert.deepEqual(hits, [], `A game's emoji is written into the page: use gameIcon()/withIcon() from public/assets/js/game-icon.js (docs/DESIGN.md rule 9), or list a text-only place in ALLOWED with its reason:\n${hits.join('\n')}`);
const stale = ALLOWED.filter((_, i) => !used.has(i)).map(([f, p]) => `${f} (${p})`);
assert.deepEqual(stale, [], `An allowed place no longer exists: drop it from ALLOWED:\n${stale.join('\n')}`);
console.log(`✓ no screen writes a game's emoji into the page outside gameIcon() (${files.length} files, ${ALLOWED.length} text places allowed)`);
