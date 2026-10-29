// A splash teaser as a looping MP4 (D-430; a GIF until #846, five times heavier): a drawn scene of a game that is coming, not its play. The
// scene is a page in marketing/splash/teaser/ that draws one frame at a time with the game's own
// sprites (window.frame(i) returns it as a PNG); this serves the repo, opens it in headless Chrome,
// takes every frame and lets ffmpeg make the MP4 (scaled up with no smoothing, so the pixel art stays
// crisp), its first frame as the poster and a still for reduced motion.
//
//   node marketing/splash/teaser.mjs [<name>]           records every scene in teaser/, or only <name>
//   node marketing/splash/teaser.mjs new <name> <game>   starts a new one from the engine's template
//                                                       (<game>: its folder under public/, e.g. labs/stack)
//
// Output: public/assets/splash/<name>-teaser.mp4, <name>-teaser-start.png and <name>-teaser.png
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { output } from '../../tools/e2e/output.mjs';
import { launch } from '../../tools/e2e/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEST = join(ROOT, 'public', 'assets', 'splash');
// Its argument is a scene's name, not an output folder: output() would take it as one
const OUT = output('/tmp/splash-teaser', [process.argv[0], process.argv[1]]);
const SCALE = 4; // the art is 128×80: the MP4 is 512×320. A scene drawn at full size (Stack's, with the game's own drawing) sets window.SCALE = 1
// The frame the still is taken from (for reduced motion): the scene's window.STILL, else 80% into the clip.
// Tren en Vilo's predates the engine and keeps its own
const STILL = { bridges: 90 };

// The repo served as files, only for the scene page and the sprites it imports
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(ROOT) || !existsSync(path) || !statSync(path).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const SITE = `http://127.0.0.1:${server.address().port}`;

if (process.argv[2] === 'new') {
  const [, , , name, game] = process.argv;
  if (!name || !game) { console.error('usage: node marketing/splash/teaser.mjs new <name> <game folder under public/>'); process.exit(1); }
  const dest = join(ROOT, 'marketing', 'splash', 'teaser', `${name}.html`);
  if (existsSync(dest)) { console.error(`${dest} already exists`); process.exit(1); }
  writeFileSync(dest, readFileSync(join(ROOT, 'marketing', 'splash', 'teaser', '_template.html'), 'utf8').replaceAll('{{name}}', name).replaceAll('{{game}}', game));
  console.log(`✓ ${dest}: write its story, then: node marketing/splash/teaser.mjs ${name}`);
  process.exit(0);
}
const only = process.argv[2];
const SCENES = readdirSync(join(ROOT, 'marketing', 'splash', 'teaser')).filter(f => f.endsWith('.html') && !f.startsWith('_')).map(f => f.slice(0, -5));
mkdirSync(DEST, { recursive: true });
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 600, height: 400 });
try {
  for (const name of SCENES) {
    if (only && only !== name) continue;
    const frames = `${OUT}/${name}`;
    rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
    await b.go(`${SITE}/marketing/splash/teaser/${name}.html?capture`, 800);
    if (!(await b.until('window.ready', 8000))) throw new Error(`${name}: the scene did not load`);
    const [n, fps, own, still] = await b.evaluate('[window.FRAMES, window.FPS, window.SCALE, window.STILL]');
    const scale = own || SCALE;
    const at = STILL[name] ?? still ?? Math.floor(n * 0.8);
    for (let i = 0; i < n; i++) {
      const png = await b.evaluate(`window.frame(${i})`);
      writeFileSync(`${frames}/${String(i).padStart(4, '0')}.png`, Buffer.from(png.split(',')[1], 'base64'));
    }
    const clip = join(DEST, `${name}-teaser.mp4`), up = scale === 1 ? 'null' : `scale=iw*${scale}:ih*${scale}:flags=neighbor`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${frames}/%04d.png`,
      '-vf', up, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '20', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', clip]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${frames}/0000.png`, '-vf', up, join(DEST, `${name}-teaser-start.png`)]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${frames}/${String(at).padStart(4, '0')}.png`, '-vf', up, join(DEST, `${name}-teaser.png`)]);
    console.log(`✓ ${name}: ${n} frames → ${clip} (${Math.round(statSync(clip).size / 1024)} KB)`);
  }
} finally { server.close(); process.exit(0); }
