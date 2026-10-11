// Dibuja promo.html cuadro a cuadro (render(t) es determinista) y se los pasa a ffmpeg. Sin audio.
//   node render.mjs [salida.mp4] [--wide] [--desde s] [--hasta s]
//   node render.mjs --fotos <dir> (--cada n | --tiempos 1.5,20.3)   → PNG sueltos, para mirar
//   --pagina <archivo.html>   otra página con el mismo contrato (render(t), DURATION, FPS, #stage); la usan otros assets de marketing/
import { abrir } from './navegador.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const out = args[0] && !args[0].startsWith('--') ? args[0] : path.join(dir, 'trabajo-vertical.mp4');
const fotos = flag('fotos'); const cada = Number(flag('cada', 15));
const browser = await abrir();
const wide = args.includes('--wide');
const page = await browser.newPage({ viewport: wide ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.resolve(flag('pagina', path.join(dir, 'promo.html'))) + '?render' + (wide ? '&wide' : ''));
await page.evaluate(() => document.fonts.ready);
const malas = await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().then(() => null, () => i.src)))); if (malas.some(Boolean)) console.log('no cargan', malas.filter(Boolean));
const FPS = await page.evaluate(() => window.FPS), DUR = await page.evaluate(() => window.DURATION);
const a = Number(flag('desde', 0)), b = Number(flag('hasta', DUR));
const stage = await page.$('#stage');
let ff;
if (!fotos) ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
else fs.mkdirSync(fotos, { recursive: true });
const n0 = Math.round(a * FPS), n1 = Math.round(b * FPS);
const tiempos = flag('tiempos') ? new Set(flag('tiempos').split(',').map(x => Math.round(Number(x) * FPS))) : null;
for (let n = n0; n < n1; n++) {
  if (fotos && (tiempos ? !tiempos.has(n) : n % cada)) continue;
  await page.evaluate(t => window.render(t), n / FPS);
  const png = await stage.screenshot({ type: 'png' });
  if (fotos) fs.writeFileSync(path.join(fotos, `f${String(n).padStart(4, '0')}.png`), png);
  else if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  if (n % 60 === 0) process.stdout.write(`${(n / FPS).toFixed(0)}s `);
}
await browser.close();
if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
console.log('\nlisto', fotos || out);
