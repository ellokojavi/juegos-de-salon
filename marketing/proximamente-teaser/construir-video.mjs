// "Se vienen cositas": dibuja animada.html cuadro a cuadro con Chrome (render(t) es determinista) y arma
// con ffmpeg el MP4 (1080×1080, sin audio). El GIF lo hace el dueño.
//   node marketing/proximamente-teaser/construir-video.mjs              # el MP4 de output/
//   node marketing/proximamente-teaser/construir-video.mjs --fotos 1.2,2.5   # cuadros sueltos, para mirar
//   … --3d                                                                    # la variante en 3D (animada-3d.html)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../tools/e2e/cdp.mjs';
const AQUI = dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf('--fotos');
const fotos = i > 0 ? process.argv[i + 1].split(',').map(Number) : null;
const TRES_D = process.argv.includes('--3d');
const PAGINA = TRES_D ? 'animada-3d.html' : 'animada.html', SUFIJO = TRES_D ? '-3d' : '';
const tmp = mkdtempSync(join(tmpdir(), 'video-pronto-'));
const b = await launch({ dir: `${tmp}/p`, out: tmp, width: 540, height: 540 });   // ×2: 1080×1080
await b.go(`file://${join(AQUI, PAGINA)}?render`, 2500);
await b.evaluate('document.fonts.ready.then(() => 1)');
const FPS = await b.evaluate('window.FPS'), DUR = await b.evaluate('window.DURATION');
const tiempos = fotos || Array.from({ length: FPS * DUR }, (_, n) => n / FPS);
for (const [n, t] of tiempos.entries()) {
  await b.evaluate(`window.render(${t}); 1`);
  await b.shot(`f${String(n).padStart(4, '0')}`);
}
b.close();
if (fotos) {
  for (const [n, t] of fotos.entries()) copyFileSync(`${tmp}/f${String(n).padStart(4, '0')}.png`, join(tmpdir(), `pronto${SUFIJO}-${t}.png`));
  console.log(fotos.map(t => join(tmpdir(), `pronto${SUFIJO}-${t}.png`)).join('\n'));
  process.exit(0);
}
const mp4 = join(AQUI, 'output', `se-vienen-cositas-6s${SUFIJO}.mp4`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${tmp}/f%04d.png`,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
console.log(`✓ ${mp4}`);
