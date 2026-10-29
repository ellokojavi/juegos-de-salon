// A teaser looks like its game (marketing/splash/README.md): every scene in teaser/ draws with the
// game's own code under public/ (its sprites, or its scene.js), never only with drawing of its own,
// which drifts from the game (the first Stack and Stick Ninja teasers, a flat side view and a full moon
// the games do not have).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('teaser/', import.meta.url);
const pages = readdirSync(dir).filter(f => f.endsWith('.html'));
for (const f of pages) {
  const html = readFileSync(new URL(f, dir), 'utf8');
  assert.match(html, /['"](?:\.\.\/)+public\/[^'"]+\.js['"]/, `the teaser ${f} imports nothing from its game under public/: draw it with the game's own sprites or scene (marketing/splash/README.md)`);
}
console.log(`✓ teasers drawn with their game's code: ${pages.length}`);
