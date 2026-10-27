/**
 * The structured data og.mjs writes (#887): every page in the sitemap carries one JSON-LD that
 * parses and says what Google's rich results need; a lab page carries none.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://juegosdesalon.cl';
const fails = [];
const ld = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => m[1]);

const sitemap = readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
if (locs.length < 10) fails.push(`the sitemap lists only ${locs.length} pages`);
for (const loc of locs) {
  const file = join(ROOT, 'public', loc.slice(SITE.length), 'index.html');
  if (!existsSync(file)) { fails.push(`${loc}: no page`); continue; }
  const html = readFileSync(file, 'utf8');
  if (/name="robots" content="noindex/.test(html)) fails.push(`${loc}: in the sitemap but noindex`);
  const blocks = ld(html);
  if (blocks.length !== 1) { fails.push(`${loc}: ${blocks.length} JSON-LD blocks`); continue; }
  let d;
  try { d = JSON.parse(blocks[0]); } catch (e) { fails.push(`${loc}: JSON-LD does not parse (${e.message})`); continue; }
  if (d.url !== loc) fails.push(`${loc}: JSON-LD url is ${d.url}`);
  if (!d.name || !d.description) fails.push(`${loc}: JSON-LD without name or description`);
  if (d['@type'] !== 'WebSite') {
    if (d.isAccessibleForFree !== true || d.offers?.price !== '0') fails.push(`${loc}: not marked free`);
    if (!['es', 'en', 'pt', 'de'].every(l => d.inLanguage?.includes(l))) fails.push(`${loc}: inLanguage is not the four languages`);
    if (!(d.numberOfPlayers?.minValue >= 1 && d.numberOfPlayers.maxValue >= d.numberOfPlayers.minValue)) fails.push(`${loc}: bad numberOfPlayers`);
    if ('aggregateRating' in d) fails.push(`${loc}: a rating we do not have`);
  }
}
for (const dir of readdirSync(join(ROOT, 'public/labs'), { withFileTypes: true }).filter(d => d.isDirectory())) {
  const file = join(ROOT, 'public/labs', dir.name, 'index.html');
  if (existsSync(file) && ld(readFileSync(file, 'utf8')).length) fails.push(`/labs/${dir.name}/: a lab page with JSON-LD`);
}
if (!readFileSync(join(ROOT, 'public/robots.txt'), 'utf8').includes(`Sitemap: ${SITE}/sitemap.xml`)) fails.push('robots.txt does not name the sitemap');

fails.forEach(f => console.log('✗', f));
if (fails.length) process.exit(1);
console.log(`✓ JSON-LD on ${locs.length} indexed pages, none in the lab`);
