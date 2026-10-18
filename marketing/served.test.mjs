// Every promotional file the site serves belongs to a marketing asset (D-356): the share cards, the
// splash clips, the email header, the video's thumbnail, a lab's link card. The file has to live in
// public/ (the site is public/ as served, D-192); its asset in marketing/ says how it is made, and
// `servido` in registro.json is that link. A new one with no owner fails here.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const registry = JSON.parse(readFileSync(join(ROOT, 'marketing/registro.json'), 'utf8'));
const walk = d => readdirSync(join(ROOT, d)).flatMap(f => statSync(join(ROOT, d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
const MEDIA = /\.(jpe?g|png|gif|webp|mp4|webm)$/;

// What is promotional: everything in the promo folders, and every image a page offers as its link card
const promo = new Set(['public/assets/og', 'public/assets/splash', 'public/assets/email']
  .filter(d => existsSync(join(ROOT, d))).flatMap(walk).filter(f => MEDIA.test(f)));
for (const page of walk('public').filter(f => f.endsWith('.html'))) {
  for (const [, url] of readFileSync(join(ROOT, page), 'utf8').matchAll(/og:image" content="https:\/\/juegosdesalon\.cl\/([^"?]+)"/g)) promo.add(`public/${url}`);
}

const glob = g => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`);
const owners = registry.assets.flatMap(a => (a.servido || []).map(g => ({ id: a.id, re: glob(g), g })));
for (const o of owners) assert.ok([...promo].some(f => o.re.test(f)) || walk('public').some(f => o.re.test(f)), `${o.id}: "${o.g}" in servido matches no file`);
const orphans = [...promo].filter(f => !owners.some(o => o.re.test(f)));
assert.deepEqual(orphans, [], `promotional files with no marketing asset: add them to "servido" of their asset in marketing/registro.json (or make one, D-178)`);
console.log(`✓ promotional files served: ${promo.size}, each with its asset in marketing/`);
