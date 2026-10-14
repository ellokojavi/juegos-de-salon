#!/usr/bin/env node
/**
 * The installable app's PNG icons (D-221), drawn with Chrome from public/assets/icon.svg.
 *
 *   node tools/release/icons.mjs            # remakes public/assets/icons/*.png
 *
 * The SVG alone is not enough: Android does not offer to install without a 192 PNG and a 512 one,
 * and the iPhone uses the `apple-touch-icon` (180, square and without transparency: the iPhone
 * rounds its corners itself). The `maskable` one is what Android crops into a circle or a drop: the
 * die goes in the center, inside the safe zone (the middle 80 %), and the background reaches the edge.
 *
 * The die is an emoji, so it is drawn with the emoji font of whoever runs this (Noto on Linux,
 * Apple on macOS). The PNGs are committed: GitHub does not remake them.
 */
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public/assets/icons');

/** The icon's background, the same gradient as icon.svg. */
const svg = readFileSync(join(ROOT, 'public/assets/icon.svg'), 'utf8');
const gradient = svg.match(/<defs>[\s\S]*<\/defs>/)[0];
const die = svg.match(/<text[^>]*>([^<]*)<\/text>/)[1];

/** `rounded`: with the SVG's corners (transparent). `scale`: the die's size. */
const drawing = ({ size, rounded, scale }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size / 2}" height="${size / 2}" style="display:block">
  ${gradient}
  <rect width="128" height="128" rx="${rounded ? 28 : 0}" fill="url(#g)"/>
  <text x="64" y="${64 + 22 * scale}" font-size="${64 * scale}" text-anchor="middle">${die}</text>
</svg>`;

export const ICONS = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1 },
  { file: 'maskable-512.png', size: 512, rounded: false, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 0.92 },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const { launch } = await import('../e2e/cdp.mjs');
  mkdirSync(OUT, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'icons-'));
  for (const i of ICONS) {
    // deviceScaleFactor 2 (cdp.mjs): the drawing measures half the PNG in page pixels
    const b = await launch({ port: 0, dir: join(tmp, i.file), out: tmp, width: i.size / 2, height: i.size / 2 });
    await b.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent;overflow:hidden}</style>${drawing(i)}`;
    await b.go(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`, 800);
    const r = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: i.size / 2, height: i.size / 2, scale: 1 } });
    writeFileSync(join(OUT, i.file), Buffer.from(r.result.data, 'base64'));
    b.close();
    console.log(`✓ ${i.file} (${i.size}×${i.size})`);
  }
  process.exit(0);
}
