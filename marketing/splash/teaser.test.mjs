// The teaser rules a machine can check (marketing/splash/TEASERS.md): every scene in teaser/ draws
// with its game's own code under public/ (rule 1); and, since the engine, it runs on _teaser.js
// (rule 5) and draws no words in the clip (rule 4). Tren en Vilo's predates the engine (LEGACY).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const LEGACY = ['bridges.html'];
const dir = new URL('teaser/', import.meta.url);
const pages = readdirSync(dir).filter(f => f.endsWith('.html') && !f.startsWith('_'));
for (const f of pages) {
  const html = readFileSync(new URL(f, dir), 'utf8');
  assert.match(html, /['"](?:\.\.\/)+public\/[^'"]+\.js['"]/, `the teaser ${f} imports nothing from its game under public/: draw it with the game's own scene (TEASERS.md, rule 1)`);
  if (LEGACY.includes(f)) continue;
  assert.match(html, /from '\.\/_teaser\.js'/, `the teaser ${f} is not on the engine (_teaser.js): start it with teaser.mjs new (TEASERS.md, rule 5)`);
  assert.doesNotMatch(html, /\b(?:fill|stroke)Text\(/, `the teaser ${f} draws words in the clip: the splash's title carries them (TEASERS.md, rule 4)`);
}
console.log(`✓ teasers by the rules: ${pages.length}`);
