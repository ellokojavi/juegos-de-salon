// Dibuja teaser.html cuadro a cuadro (render(t) es determinista) y se los pasa a ffmpeg. Sin audio.
//   node render.mjs [salida.mp4]
//   node render.mjs --fotos <dir> --tiempos 0.5,1.4,2.4,3.2,5.5   → PNG sueltos, para mirar
// Usa el Chrome de ../promo-video/navegador.mjs (Playwright).
import { abrir } from '../promo-video/navegador.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf('--' + n); return i < 0 ? null : args[i + 1]; };
const out = args[0] && !args[0].startsWith('--') ? args[0] : path.join(dir, 'output/el-caso-6s.mp4');
const fotos = flag('fotos');
const browser = await abrir();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(dir, 'teaser.html') + '?render');
await page.evaluate(() => document.fonts.ready);
const FPS = await page.evaluate(() => window.FPS), DUR = await page.evaluate(() => window.DURATION);
const stage = await page.$('#stage');
let ff;
if (!fotos) { fs.mkdirSync(path.dirname(out), { recursive: true }); ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] }); }
else fs.mkdirSync(fotos, { recursive: true });
const tiempos = flag('tiempos') ? flag('tiempos').split(',').map(Number) : null;
const cuadros = tiempos ? tiempos.map(s => Math.round(s * FPS)) : Array.from({ length: Math.round(DUR * FPS) }, (_, n) => n);
for (const n of cuadros) {
  await page.evaluate(t => window.render(t), n / FPS);
  const png = await stage.screenshot({ type: 'png' });
  if (fotos) fs.writeFileSync(path.join(fotos, `f${String(n).padStart(4, '0')}.png`), png);
  else if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
}
await browser.close();
if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
console.log('listo', fotos || out);
