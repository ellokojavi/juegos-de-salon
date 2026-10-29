/**
 * The structured data says what the page shows (#883 §7.4): on every indexed page, opened in Spanish
 * as a crawler opens it, the JSON-LD's name is on the page, and a game's FAQPage answer is, word for
 * word, the text its "Cómo se juega" block renders (facts line and rules). `json-ld.test.mjs` checks
 * the shape without a browser; this checks it against the rendered cover, where a rules text that
 * changes in `rules.js` but not in the generated JSON-LD (or the other way) shows up.
 *
 *   node tools/e2e/structured-data.mjs [<out folder>] [--only hangman,generala]
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';
import { output } from './output.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/e2e/structured-data');
mkdirSync(OUT, { recursive: true });

const i = process.argv.indexOf('--only');
const only = i < 0 ? [] : process.argv[i + 1].split(',');
const routes = [...readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/juegosdesalon\.cl(.*?)<\/loc>/g)]
  .map(m => m[1]).filter(r => !only.length || only.some(o => r.includes(`/${o}/`)));

// What the page renders: its JSON-LD, its title and visible text, and each "Cómo se juega" block's text
const READ = `(()=>{
  const norm = s => s.replace(/\\s+/g, ' ').trim();
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
  const how = [...document.querySelectorAll('details')].filter(d => /c[oó]mo se juega/i.test(d.querySelector('summary')?.textContent || ''))
    .map(d => { d.open = true; return norm(d.innerText.slice(d.querySelector('summary').innerText.length)); })
    // A Cup game's own page shows it open, as a panel under its title (#883)
    .concat([...document.querySelectorAll('#como-titulo')].map(t => norm(t.parentElement.innerText.slice(t.innerText.length))));
  return JSON.stringify({ ld, how, path: location.pathname, text: norm(document.title + ' ' + document.body.innerText) });
})()`;

/** A text's sentences, each with its closing mark */
const sentences = t => t.match(/[^.!?]+[.!?]+["»”]?|[^.!?]+$/g).map(s => s.trim()).filter(Boolean);

let failures = 0;
const b = await launch({ dir: `${OUT}/profile`, out: OUT });
for (const route of routes) {
  await b.open(`${SITE}${route}`);
  await b.evaluate(`localStorage.clear(); 1`);
  await b.open(`${SITE}${route}`);
  await b.settle(1000);
  let p = JSON.parse(await b.evaluate(READ));
  // A language door (/pt/, /en/, /de/) sends the browser on to the app: what it says is its served HTML
  if (p.path !== route) {
    const html = await (await fetch(`${SITE}${route}`)).text();
    p = { how: [], text: html.match(/<title>(.*?)<\/title>/s)[1], ld: [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1])) };
  }
  const errors = [];
  const [data, faq] = p.ld;
  if (!data) errors.push('no JSON-LD');
  else if (!p.text.includes(data.name)) errors.push(`the JSON-LD names «${data.name}», the page does not`);
  if (faq) {
    // Every sentence of the answer, in order, in what the block shows: the page may say more
    // (a scoring table, a line for an option that is on), never something else
    const page = p.how.join(' ');
    let at = 0;
    const missing = sentences(faq.mainEntity[0].acceptedAnswer.text).filter(s => { const k = page.indexOf(s, at); if (k < 0) return true; at = k + s.length; return false; });
    if (!p.how.length) errors.push('a FAQPage, but no «Cómo se juega» on the page');
    else if (missing.length) errors.push(`the FAQPage says what «Cómo se juega» does not show (or not in that order): «${missing.join(' ')}»`);
  } else if (p.how.length) errors.push('«Cómo se juega» on the page, but no FAQPage');
  if (errors.length) { failures++; errors.forEach(m => console.log(`✗ ${route}: ${m}`)); }
  else console.log(`✓ ${route}: «${data.name}»${faq ? ', its FAQPage is the «Cómo se juega» it shows' : ''}`);
}
await b.close();
if (failures) { console.log(`✗ ${failures} pages whose structured data is not what they show`); process.exit(1); }
console.log(`✓ structured data matches ${routes.length} rendered pages`);
