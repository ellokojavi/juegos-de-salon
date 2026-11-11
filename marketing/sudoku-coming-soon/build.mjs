// The Sudoku "Coming soon" video for WhatsApp (the owner, 2026-11-11): 1080×1080, 6 s, no audio. The splash's
// clip (public/assets/splash/sudoku.mp4: a digit found by lines across the grid) under COMING SOON and the
// game's drawn icon, fading in and out of the background so it loops.
//
//   python3 -m http.server 8791 -d public &      (frame.html is copied there for the shot, then removed)
//   node marketing/sudoku-coming-soon/build.mjs
//
// Output: marketing/sudoku-coming-soon/output/sudoku-coming-soon-6s.mp4
import { copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SITE = process.env.SITE || 'http://localhost:8791';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const tmpPage = join(ROOT, 'public', '_sudoku-coming-soon.html');
const still = join(HERE, 'output', 'frame.png');
copyFileSync(join(HERE, 'frame.html'), tmpPage);
try {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  await p.goto(`${SITE}/_sudoku-coming-soon.html`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const hole = await p.$eval('.hole', e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), s: Math.round(r.width) }; });
  await p.screenshot({ path: still });
  await b.close();
  const clip = join(ROOT, 'public', 'assets', 'splash', 'sudoku.mp4');
  const out = join(HERE, 'output', 'sudoku-coming-soon-6s.mp4');
  // the clip's first 6 s (the first digit found and the view back out), rounded corners, over the still
  const r = 22;
  const mask = `geq=lum='p(X,Y)':a='if(gt(abs(X-W/2),W/2-${r})*gt(abs(Y-H/2),H/2-${r}),if(lte(hypot(abs(X-W/2)-(W/2-${r}),abs(Y-H/2)-(H/2-${r})),${r}),255,0),255)'`;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-loop', '1', '-t', '6', '-i', still, '-t', '6', '-i', clip,
    '-filter_complex', `[1:v]scale=${hole.s}:${hole.s},format=yuva420p,${mask}[c];[0:v][c]overlay=${hole.x}:${hole.y},fps=30,fade=in:st=0:d=0.25,fade=out:st=5.75:d=0.25,format=yuv420p[v]`,
    '-map', '[v]', '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
  console.log(out);
} finally {
  rmSync(tmpPage, { force: true });
  rmSync(still, { force: true });
}
