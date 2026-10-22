// Every page of the site opens: no uncaught error and something on screen (D-346). The floor of
// every PR that changes the browser: a lab game with no script of its own was still left blank by a
// broken comment (#482) and nothing failed. It builds its routes from the pages in public/, so it
// runs whenever any page is affected (affected.mjs), and it checks them all: about a minute.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '../../public');
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const bad = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };

/** The site's pages, minus the bridge pages that only redirect (D-192). */
const pages = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f === 'index.html' && !/Bridge page|Página puente/.test(readFileSync(p, 'utf8'))) pages.push(relative(PUBLIC, dirname(p)).split('\\').join('/')); } };
walk(PUBLIC);
pages.sort();
/** Pages with no screen of their own (`<meta name="screen" content="none">`, like /cup/recap/, D-423): they must open without errors, not show text. */
const noScreen = new Set(pages.filter(p => /<meta name="screen" content="none">/.test(readFileSync(join(PUBLIC, p, 'index.html'), 'utf8'))));

const b = await launch({ dir: `${OUT}/p`, out: OUT });
let ok = 0;
for (const page of pages) {
  const before = b.errors.length;
  await b.go(`${SITE}/${page ? `${page}/` : ''}`, 1500);
  const errors = b.errors.slice(before);
  const seen = await b.evaluate(`JSON.stringify({ text: (document.body?.innerText || '').trim().length, hidden: getComputedStyle(document.documentElement).visibility === 'hidden', at: location.pathname })`).then(JSON.parse).catch(() => ({ text: 0 }));
  if (errors.length) bad(`/${page} throws: ${errors[0].slice(0, 160)}`);
  else if (!noScreen.has(page) && (seen.hidden || seen.text < 20)) bad(`/${page} is blank (${seen.text} characters of text${seen.hidden ? ', hidden' : ''})`);
  else ok++;
}
await sleep(100);
b.close?.();
console.log(`${ok === pages.length ? '✓' : '✗'} smoke: ${ok} of ${pages.length} pages open with something on screen and no error`);
process.exit(process.exitCode || 0);
