// The splash's clips (D-351): a few seconds of each game being played, recorded from the real game
// in headless Chrome, so the splash shows how it plays instead of a still card. For each game it
// opens its page with a fixed seed, starts, and plays the solution slowly while it shoots the board
// about 12 times a second; ffmpeg turns the frames into a small looping MP4 and its poster.
//
//   SITE=http://localhost:8771 node marketing/splash/capture.mjs [routes|plots|paint-mines]
//
// Output: public/assets/splash/<game>.mp4 and <game>.jpg (the last frame: the board solved).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { output } from '../../tools/e2e/output.mjs';
import { launch, sleep } from '../../tools/e2e/cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const DEST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'splash');
const OUT = output('/tmp/splash-clips');
const SIZE = 360; // px of the clip, square; the splash draws it at most at ~230 px (×1.5 for sharp screens)
const FPS = 12;

const GAMES = {
  routes: {
    url: '/routes/?test&seed=KQRST',
    board: '#rr-tablero',
    ready: `document.querySelectorAll('#rr-tablero .rr-pieza').length === 9 && !document.getElementById('cuenta')`,
    // Undo the scramble, one turn at a time: the lines join
    play: async ev => {
      const t = JSON.parse(await ev(`JSON.stringify(window.__rutas.t)`));
      for (const r of [...t.revuelta].reverse()) { await ev(`window.__rutas.girar(${JSON.stringify(r)}); 1`); await sleep(750); }
    },
  },
  plots: {
    url: '/plots/?test&mode=numbers',
    board: '#lt-tablero',
    hold: 1400, keep: 3,
    ready: `!!document.getElementById('lt-tablero') && !document.getElementById('cuenta')`,
    // The solution, plot by plot
    play: async ev => {
      const sol = JSON.parse(await ev(`JSON.stringify(window.__loteo.P.t.solucion)`));
      for (const r of sol) { await ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`); await sleep(420); }
    },
  },
  'paint-mines': {
    url: '/paint-mines/?test',
    board: '#pm-tablero',
    ready: `document.querySelectorAll('#pm-tablero .pm-casilla').length === 49 && !document.getElementById('cuenta')`,
    // Every free cell with its true color, row by row: the drawing appears
    play: async ev => {
      const t = JSON.parse(await ev(`JSON.stringify(window.__pintaminas.p)`));
      const brush = k => (k === 0 ? 'btn-fondo' : k === 1 ? 'btn-tinta' : 'btn-tinta2');
      for (let i = 0; i < t.sol.length; i++) {
        if (t.dadas.includes(i)) continue;
        await ev(`document.getElementById('${brush(t.sol[i])}').click(); document.querySelector('#pm-tablero .pm-casilla[data-i="${i}"]').click(); 1`);
        await sleep(t.sol[i] ? 110 : 45);
      }
    },
  },
};

const only = process.argv[2];
mkdirSync(DEST, { recursive: true });
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844 });
const ev = e => b.evaluate(e);
try {
  for (const [name, g] of Object.entries(GAMES)) {
    if (only && only !== name) continue;
    const frames = `${OUT}/${name}`;
    rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
    await b.go(`${SITE}${g.url}`, 1500);
    if (!(await b.until(`document.getElementById('btn-empezar')`, 8000))) throw new Error(`${name}: no Start`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    if (!(await b.until(g.ready, 10000))) throw new Error(`${name}: the board did not appear`);
    await sleep(600);
    // The board, with a margin, as a square
    const r = JSON.parse(await ev(`JSON.stringify(document.querySelector('${g.board}').getBoundingClientRect())`));
    const side = Math.max(r.width, r.height) + 16;
    const clip = { x: r.left + r.width / 2 - side / 2, y: r.top + r.height / 2 - side / 2, width: side, height: side, };
    let n = 0, recording = true;
    const shoot = async () => {
      const s = await b.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: SIZE / side } });
      writeFileSync(`${frames}/${String(n++).padStart(4, '0')}.png`, Buffer.from(s.result.data, 'base64'));
    };
    const loop = (async () => { while (recording) { const t0 = Date.now(); await shoot(); await sleep(Math.max(0, 1000 / FPS - (Date.now() - t0))); } })();
    await sleep(700);
    await g.play(ev);
    const solvedAt = n;
    await sleep(g.hold ?? 1400); // the solved board, held (Loteo brings its next board sooner: `keep` frames of it)
    recording = false; await loop;
    const mp4 = join(DEST, `${name}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${frames}/%04d.png`, '-frames:v', String(Math.min(n, solvedAt + (g.keep ?? n))),
      '-vf', `scale=${SIZE}:${SIZE}:flags=lanczos,tpad=stop_mode=clone:stop_duration=${g.keep ? 1.2 : 0},format=yuv420p`, '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-movflags', '+faststart', '-an', mp4]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${frames}/${String(Math.min(n - 1, solvedAt + Math.min(3, (g.keep ?? 4) - 1))).padStart(4, '0')}.png`, '-q:v', '5', join(DEST, `${name}.jpg`)]);
    console.log(`✓ ${name}: ${n} frames → ${mp4}`);
  }
} finally { process.exit(0); }
