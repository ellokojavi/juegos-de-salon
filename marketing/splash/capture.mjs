// The splash's clips (D-351): a few seconds of each game being played, recorded from the real game
// in headless Chrome, so the splash shows how it plays instead of a still card. For each game it
// opens its page with a fixed seed, starts, and plays the solution slowly while it shoots the board
// about 12 times a second; ffmpeg turns the frames into a small looping MP4 and its poster.
//
//   SITE=http://localhost:8771 node marketing/splash/capture.mjs [routes|plots|paint-mines|bridges]
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
// argv[2] is the game to record, not the output folder: always the fallback
const OUT = output('/tmp/splash-clips', []);
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
  bridges: {
    // 🚅 Tren en Vilo in its neon look: a level-1 stage (Math.random pinned, so the same one each time),
    // its solution's beams dragged in one by one with the mouse, then 🚂 Probar and the train crosses
    url: '/bridges/?test',
    speed: 1.6, // played faster than it was recorded: the owner found it slow
    board: '.tv-lienzo',
    // The scene at its own shape, as big as the splash draws it (a hero, full width): no square, no margin
    native: 720,
    // The gauge's words (Carga, máx.) hidden: one clip serves the four languages, so the dial speaks alone
    before: `window.__rnd = Math.random; Math.random = () => 0.99; document.head.insertAdjacentHTML('beforeend', '<style>.tv-medidor-titulo, .tv-medidor text { display: none }</style>'); 1`,
    hold: 0, keep: 4,
    ready: `!!document.querySelector('.tv-lienzo') && !document.getElementById('cuenta')`,
    play: async (ev, b) => {
      const { beams, deck } = JSON.parse(await ev(`(() => { const t = window.__trenCopa, e = t.etapas[t.J.etapa]; return JSON.stringify({ beams: e.solucion, deck: t.J.vigas.map(v => [v.a, v.b]) }); })()`));
      const k = ([a, b]) => [a.join(','), b.join(',')].sort().join('|');
      const has = new Set(deck.map(k));
      const at = async ([x, y]) => JSON.parse(await ev(`(() => { const c = document.querySelector('.tv-lienzo'), r = c.getBoundingClientRect(), s = c._m.escala; return JSON.stringify([r.left + (${x} + 1.3) * s, r.top + (c._v.arriba - (${y})) * s]); })()`));
      const mouse = (type, [x, y]) => b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
      // Two passes: a beam that starts at a joint not laid yet waits for the second
      for (const beam of [...beams, ...beams]) {
        const now = JSON.parse(await ev(`JSON.stringify(window.__trenCopa.J.vigas.map(v => [v.a, v.b]))`)).map(k);
        if (has.has(k(beam)) || now.includes(k(beam))) continue;
        const [p, q] = [await at(beam[0]), await at(beam[1])];
        await mouse('mousePressed', p);
        for (let i = 1; i <= 8; i++) { await mouse('mouseMoved', [p[0] + (q[0] - p[0]) * i / 8, p[1] + (q[1] - p[1]) * i / 8]); await sleep(40); }
        await mouse('mouseReleased', q);
        await sleep(450);
      }
      await ev(`Math.random = window.__rnd; 1`);
      await sleep(500);
      await ev(`document.getElementById('btn-probar').click(); 1`);
      // Until the train reaches the far side, and a moment on, before the stage's summary covers the board
      for (let t = 0; t < 150; t++) { if (await ev(`window.__trenCopa.J.hechas.length > 0`)) break; await sleep(100); }
      await sleep(900);
    },
  },
};

const only = process.argv[2];
mkdirSync(DEST, { recursive: true });
// The bridge's scene is drawn as wide as its page allows (560 px at most): a wider window gives a sharper clip
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: only === 'bridges' ? 600 : 390, height: 844 });
const ev = e => b.evaluate(e);
try {
  for (const [name, g] of Object.entries(GAMES)) {
    if (only && only !== name) continue;
    const frames = `${OUT}/${name}`;
    rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
    await b.go(`${SITE}${g.url}`, 1500);
    if (g.before) await ev(g.before);
    if (!(await b.until(`document.getElementById('btn-empezar')`, 8000))) throw new Error(`${name}: no Start`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    if (!(await b.until(g.ready, 10000))) throw new Error(`${name}: the board did not appear`);
    await sleep(600);
    // The board, with a margin, as a square
    const r = JSON.parse(await ev(`JSON.stringify(document.querySelector('${g.board}').getBoundingClientRect())`));
    const side = Math.max(r.width, r.height) + 16;
    const clip = g.native ? { x: r.left, y: r.top, width: r.width, height: r.height }
      : { x: r.left + r.width / 2 - side / 2, y: r.top + r.height / 2 - side / 2, width: side, height: side, };
    const W = g.native || SIZE, H = g.native ? 2 * Math.round(g.native * r.height / r.width / 2) : SIZE;
    let n = 0, recording = true;
    const shoot = async () => {
      const s = await b.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: W / clip.width } });
      writeFileSync(`${frames}/${String(n++).padStart(4, '0')}.png`, Buffer.from(s.result.data, 'base64'));
    };
    const loop = (async () => { while (recording) { const t0 = Date.now(); await shoot(); await sleep(Math.max(0, 1000 / FPS - (Date.now() - t0))); } })();
    await sleep(700);
    await g.play(ev, b);
    const solvedAt = n;
    await sleep(g.hold ?? 1400); // the solved board, held (Loteo brings its next board sooner: `keep` frames of it)
    recording = false; await loop;
    const mp4 = join(DEST, `${name}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS * (g.speed ?? 1)), '-i', `${frames}/%04d.png`, '-frames:v', String(Math.min(n, solvedAt + (g.keep ?? n))),
      '-vf', `scale=${W}:${H}:flags=lanczos,tpad=stop_mode=clone:stop_duration=${g.keep ? 1.2 : 0},format=yuv420p`, '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-movflags', '+faststart', '-an', mp4]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${frames}/${String(Math.min(n - 1, solvedAt + Math.min(3, (g.keep ?? 4) - 1))).padStart(4, '0')}.png`, '-q:v', '5', join(DEST, `${name}.jpg`)]);
    // And its first frame, the poster while it loads, so the solved board does not flash before it plays
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-frames:v', '1', '-q:v', '5', join(DEST, `${name}-start.jpg`)]);
    console.log(`✓ ${name}: ${n} frames → ${mp4}`);
  }
} catch (err) { console.error(`✗ ${err.message}`); process.exitCode = 1; } finally { process.exit(); }
