// El video de 6 s de la tarjeta de Agentes (D-286): dibuja animada.html cuadro a cuadro con Chrome
// (render(t) es determinista) y arma con ffmpeg el MP4 (1200×630, sin audio) y el GIF para WhatsApp.
//   node marketing/agentes-tarjeta/construir-video.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../tools/e2e/cdp.mjs';
const AQUI = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'video-agentes-'));
const b = await launch({ dir: `${tmp}/p`, out: tmp, width: 600, height: 315 });
await b.go(`file://${join(AQUI, 'animada.html')}?render`, 2500);
await b.evaluate('document.fonts.ready.then(() => 1)');
const FPS = await b.evaluate('window.FPS'), DUR = await b.evaluate('window.DURATION');
for (let n = 0; n < FPS * DUR; n++) {
  await b.evaluate(`window.render(${n / FPS}); 1`);
  await b.shot(`f${String(n).padStart(4, '0')}`);
}
b.close();
const mp4 = join(AQUI, 'output', 'agentes-6s.mp4'), gif = join(AQUI, 'output', 'agentes-6s.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${tmp}/f%04d.png`,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
// El GIF: 600 px de ancho, 15 cuadros por segundo, en bucle
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf',
  'fps=15,scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
  '-loop', '0', gif]);
console.log(`✓ ${mp4}\n✓ ${gif}`);
