/**
 * Visual regression (#1249, step 15): each game's intro screen, in Spanish at 390×812 and at 1× (kept at half that),
 * compared pixel by pixel with its reference in `tools/e2e/visual/ref/<game>-<screen>.png`.
 * A screen that moved more than the tolerance is ❌; `--update` rewrites the references, and that is
 * the approval: a PR that changes how a screen looks shows the new PNG in its diff.
 *
 *   node tools/e2e/visual.mjs [out]                  # every screen
 *   node tools/e2e/visual.mjs [out] --part hangman   # one game (what CI runs, one job per game)
 *   node tools/e2e/visual.mjs [out] --update [--part hangman]
 *
 * Deterministic on purpose: `?test` (the test store), a fixed clock and time zone, a seeded
 * Math.random, reduced motion with every animation and transition off, no caret and no focus.
 * The fonts are the site's own (assets/fonts/), so the text renders alike on any machine. The
 * screens come from `visualScreens()` in paths.mjs; the PNG reader, writer and diff are png.mjs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
const hasAnyReference = () => { try { return readdirSync(new URL('./visual/ref/', import.meta.url)).some(f => f.endsWith('.png')); } catch { return false; } };
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from './cdp.mjs';
import { output } from './output.mjs';
import { visualScreens } from './paths.mjs';
import { decode, encode, compare, half } from './png.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REF = join(HERE, 'visual', 'ref');
const OUT = output();
const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const part = args.includes('--part') ? args[args.indexOf('--part') + 1] : null;
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const WIDTH = 390, HEIGHT = 812;
// A pixel differs when a channel moves more than DELTA; a screen fails when more than MAX_RATIO of
// its pixels differ. Antialiasing between Chrome builds stays well under both; a moved button, a new
// colour or a changed line of text does not.
const DELTA = 48, MAX_RATIO = 0.003;

const screens = visualScreens().filter(s => !part || s.part === part);
if (!screens.length) { console.log(`✗ no visual screen named "${part}"`); process.exit(1); }

// Before any of the page's code: a fixed clock that still ticks, a seeded Math.random
const FREEZE = `(() => {
  const T0 = Date.UTC(2026, 2, 10, 18, 0, 0), start = performance.now(), Real = Date;
  const now = () => T0 + Math.floor(performance.now() - start);
  class D extends Real { constructor(...a) { super(...(a.length ? a : [now()])); } static now() { return now(); } }
  globalThis.Date = D;
  let s = 0x2f6b1c3d; Math.random = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();`;
const STILL_CSS = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}`;

const b = await launch({ port: 9471, dir: `${OUT}/profile`, out: OUT, width: WIDTH, height: HEIGHT });
await b.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: true });
await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'light' }] });
await b.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Santiago' });
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: FREEZE });

mkdirSync(REF, { recursive: true });
let failed = 0;
for (const s of screens) {
  const name = `${s.part}-${s.screen}`;
  const url = `${SITE}/${s.route}?test`;
  await b.open(url, 3000);
  // A clean phone in Spanish, as look.mjs leaves it
  await b.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); 1`);
  await b.open(url, 3000);
  for (const step of s.steps) { await b.evaluate(`(()=>{ ${step} ; return 1})()`); await b.settle(1500); }
  await b.evaluate(`(()=>{const st=document.createElement('style');st.textContent=${JSON.stringify(STILL_CSS)};document.head.append(st);
    document.activeElement?.blur?.();scrollTo(0,0);return document.fonts.ready.then(()=>1)})()`);
  await b.settle(1500);
  await sleep(200);
  if (b.errors.length) { console.log(`✗ ${name}: the page threw: ${b.errors.splice(0).join(' | ').slice(0, 300)}`); failed++; }
  const shot = Buffer.from((await b.send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64');
  writeFileSync(join(OUT, `${name}.png`), shot);
  // Kept and compared at half size (195×406): a fifth of the weight, and a glyph's antialiasing
  // averages out, while a moved button or a changed colour does not
  const now = half(decode(shot));
  const ref = join(REF, `${name}.png`);
  if (UPDATE) {
    // A screen that did not really change keeps its file, so a PR's diff only shows what moved
    const same = existsSync(ref) && compare(decode(readFileSync(ref)), now, { delta: DELTA }).ratio <= MAX_RATIO;
    if (!same) writeFileSync(ref, encode(now));
    console.log(`${same ? '·' : '✎'} ${name}${same ? ' unchanged' : ' reference written'}`);
    continue;
  }
  // Before the first references come from GitHub's runner (the "Visual references" workflow, #1249),
  // there is nothing to compare: say so and pass, rather than compare against another machine's rendering
  if (!existsSync(ref) && !hasAnyReference()) { console.log(`· ${name}: no references yet; make them with the "Visual references" workflow`); continue; }
  if (!existsSync(ref)) { failed++; console.log(`❌ ${name}: no reference (run node tools/e2e/visual.mjs --update --part ${s.part} and commit it)`); continue; }
  const r = compare(decode(readFileSync(ref)), now, { delta: DELTA });
  const pct = (r.ratio * 100).toFixed(2);
  if (r.ratio > MAX_RATIO) {
    failed++;
    if (r.diff) writeFileSync(join(OUT, `${name}-diff.png`), encode(r.diff));
    console.log(`❌ ${name}: ${r.sizes || `${pct} % of the pixels changed`} (more than ${(MAX_RATIO * 100).toFixed(1)} %). If it is meant, approve it: node tools/e2e/visual.mjs --update --part ${s.part}; the new and the diff images are in ${OUT}`);
  } else console.log(`✓ ${name} (${pct} % differs)`);
}
b.close();
const total = readdirSync(REF).filter(f => f.endsWith('.png')).reduce((n, f) => n + statSync(join(REF, f)).size, 0);
console.log(`${screens.length} screen(s), references ${(total / 1024).toFixed(0)} KB in total`);
process.exit(failed ? 1 : 0);
