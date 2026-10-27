// The fonts are served from the site (#851): no page asks Google for them, every @font-face file
// exists with its license, and every page that links base.css preloads Nunito's latin file, so the
// text does not wait for base.css to be read before its font starts downloading.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, '..', '..');
const FONTS = join(PUBLIC, 'assets', 'fonts');

const walk = dir => readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(PUBLIC).filter(f => /\.(html|css|m?js)$/.test(f) && !/\.test\.m?js$/.test(f));

// 1. Nobody asks Google's font servers (Firebase's SDK on www.gstatic.com is another matter)
const google = files.filter(f => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, 'utf8')));
assert.deepEqual(google.map(f => relative(PUBLIC, f)), [], 'these files still load fonts from Google; the fonts live in assets/fonts/ (#851)');

// 2. Every font base.css declares exists, and the license travels with them
const css = readFileSync(join(HERE, 'base.css'), 'utf8');
const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map(m => m[0]);
assert.ok(faces.length >= 4, 'base.css declares the Bangers and Nunito faces');
for (const face of faces) {
  assert.match(face, /font-display:\s*swap/, `a face without font-display: swap: ${face}`);
  const url = face.match(/url\(['"]?([^'")]+)/)[1];
  assert.ok(existsSync(join(HERE, url)), `base.css names ${url}, which is not there`);
}
for (const family of ['Bangers', 'Nunito']) assert.ok(faces.some(f => f.includes(`'${family}'`)), `base.css declares ${family}`);
const license = readFileSync(join(FONTS, 'OFL.txt'), 'utf8');
for (const family of ['Bangers', 'Nunito']) assert.ok(license.includes(`The ${family} Project Authors`), `OFL.txt keeps ${family}'s copyright`);
assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);

// 3. Every page that links base.css preloads the body's font from the same folder, before the sheet
const missing = [];
for (const f of files.filter(f => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  const sheet = html.match(/<link rel="stylesheet" href="([^"]*)assets\/css\/base\.css">/);
  if (!sheet) continue;
  const preload = `<link rel="preload" href="${sheet[1]}assets/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>`;
  const at = html.indexOf(preload);
  if (at < 0 || at > sheet.index) missing.push(relative(PUBLIC, f));
}
assert.deepEqual(missing, [], `these pages link base.css without preloading Nunito before it; add, right before the sheet:
<link rel="preload" href="<same prefix>assets/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>`);

console.log(`fonts: ${faces.length} faces served from the site, the pages preload Nunito, green`);
