// Only the game being played loads (D-468): no page or shared module pulls in every Cup game's code
// or stylesheet, and each game with a stylesheet loads it itself.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, '..', '..');
const index = readFileSync(join(HERE, 'index.js'), 'utf8');
const folders = readdirSync(HERE, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(join(HERE, d.name, 'ui.js'))).map(d => d.name);

// index.js names every game's screen with a literal import(), so affected.mjs can follow it, and imports none up front
for (const f of folders) assert.ok(index.includes(`import('./${f}/ui.js')`), `index.js does not load ${f}/ui.js with import()`);
assert.ok(!/^import\s[^;]*from\s+'\.\/[\w-]+\/(engine|ui)\.js'/m.test(index), 'index.js imports a game up front');

// La Copa's shared screens import no game's engine or screen
for (const f of ['cup/game.js', 'cup/desglose.js', 'cup/rules.js', 'cup/engine.js']) {
  const s = readFileSync(join(PUBLIC, f), 'utf8');
  assert.ok(!/^import\s[^;]*from\s+'[./]*games\/[\w-]+\/(engine|ui)\.js'/m.test(s), `${f} imports a Cup game up front`);
}

// A game's stylesheet comes with its screen, never as a link in a page
for (const f of folders.filter(f => existsSync(join(HERE, f, 'style.css')))) {
  assert.ok(readFileSync(join(HERE, f, 'ui.js'), 'utf8').includes("loadCss(new URL('./style.css', import.meta.url))"), `${f}/ui.js does not load its style.css`);
}
const pages = [];
const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'index.html') pages.push(p); } };
walk(PUBLIC);
for (const p of pages) assert.ok(!/cup\/games\/[\w-]+\/style\.css|"games\/[\w-]+\/style\.css/.test(readFileSync(p, 'utf8')), `${p.slice(PUBLIC.length)} links a Cup game's stylesheet`);

console.log(`cup/games lazy: ${folders.length} games, ${pages.length} pages OK`);
