// ¡Upa, papá! in 6 seconds: draws animada.html frame by frame with Chrome (render(t) is
// deterministic) and builds the MP4 with ffmpeg (1080×1080, no audio).
//   node marketing/tres-nuevos/construir-video.mjs                 # the MP4 in output/
//   node marketing/tres-nuevos/construir-video.mjs --fotos 1.2,2.5 # single frames, to look at
import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../tools/e2e/cdp.mjs';
const AQUI = dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf('--fotos');
const fotos = i > 0 ? process.argv[i + 1].split(',').map(Number) : null;
const tmp = mkdtempSync(join(tmpdir(), 'video-tres-nuevos-'));
const b = await launch({ dir: `${tmp}/p`, out: tmp, width: 540, height: 540 });   // ×2: 1080×1080
await b.go(`file://${join(AQUI, 'animada.html')}?render`, 2500);
await b.evaluate('document.fonts.ready.then(() => 1)');
const FPS = await b.evaluate('window.FPS'), DUR = await b.evaluate('window.DURATION');
const tiempos = fotos || Array.from({ length: FPS * DUR }, (_, n) => n / FPS);
for (const [n, t] of tiempos.entries()) {
  await b.evaluate(`window.render(${t}); 1`);
  await b.shot(`f${String(n).padStart(4, '0')}`);
}
b.close();
if (fotos) {
  for (const [n, t] of fotos.entries()) copyFileSync(`${tmp}/f${String(n).padStart(4, '0')}.png`, join(tmpdir(), `tres-nuevos-${t}.png`));
  console.log(fotos.map(t => join(tmpdir(), `tres-nuevos-${t}.png`)).join('\n'));
  process.exit(0);
}
const mp4 = join(AQUI, 'output', 'tres-nuevos-6s.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${tmp}/f%04d.png`,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
console.log(`✓ ${mp4}`);
