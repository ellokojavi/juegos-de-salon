// The gameplay clips of the making-of page (/making-of/): a few seconds of four real games, recorded
// in headless Chrome in English, encoded by ffmpeg as small looping MP4s.
// - Shinobi and Babel: the demo their cover plays by itself, recorded in the page from its canvas
//   (captureStream and MediaRecorder, as marketing/splash/capture.mjs does): real time, native resolution.
// - Liar's Dice (against the phone) and Where Is It? (spun to the city, pin, confirm, the arc), played by
//   this script and filmed as 2x screenshots. CDP's screencast would be smoother but only gives 1x
//   frames, too soft when projected; screenshots manage ~7 a second, so `live` films in real time and
//   `step` films a scripted motion (the globe's spin) one frame per step, played back at 24 fps.
//
//   python3 -m http.server 8791 -d public &
//   SITE=http://localhost:8791 node tools/generators/making-of-clips.mjs [shinobi|babel|liars-dice|where]
//
// Output: public/making-of/clips/<game>.mp4 and <game>.jpg (a frame near the end, the poster).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from '../e2e/cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8791';
const DEST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'making-of', 'clips');
const WORK = join(tmpdir(), 'making-of-clips');
const W = 390, H = 844;

const mp4 = (name, input, vf) => {
  mkdirSync(DEST, { recursive: true });
  const out = join(DEST, `${name}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...input, '-vf', `${vf},format=yuv420p`, '-an', '-c:v', 'libx264',
    '-preset', 'slow', '-crf', '28', '-movflags', '+faststart', out]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-sseof', '-0.6', '-i', out, '-frames:v', '1', '-q:v', '4', join(DEST, `${name}.jpg`)]);
  console.log(`${name} → public/making-of/clips/${name}.mp4`);
};

/** A film of 2x screenshots on a clock of its own: `live` in real time, `step` one frame per scripted step. */
function film(b) {
  const frames = [];
  let clock = 0;
  const grab = async () => (await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 88 })).result.data;
  return {
    frames,
    async live(ms) {
      const end = Date.now() + ms;
      while (Date.now() < end) { const t0 = Date.now(); frames.push({ t: clock, data: await grab() }); clock += (Date.now() - t0) / 1000; }
    },
    async step(dt = 1 / 24) { frames.push({ t: clock, data: await grab() }); clock += dt; },
  };
}

/** A film → MP4: each frame held until the next one's time. */
function encodeFilm(name, f, { width, hold = 1.2 }) {
  const dir = join(WORK, name);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const file = i => join(dir, `${String(i).padStart(5, '0')}.jpg`);
  const list = [];
  f.frames.forEach((fr, i) => {
    writeFileSync(file(i), Buffer.from(fr.data, 'base64'));
    const next = f.frames[i + 1]?.t ?? fr.t + hold;
    list.push(`file '${file(i)}'`, `duration ${Math.max(0.01, next - fr.t).toFixed(3)}`);
  });
  list.push(`file '${file(f.frames.length - 1)}'`);
  writeFileSync(join(dir, 'list.txt'), list.join('\n'));
  mp4(name, ['-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt')], `scale=${width}:-2:flags=lanczos,fps=24`);
}

/** The cover's self-playing demo canvas, recorded in the page for `ms`, over the page's night. */
async function cover(b, name, selector, ms, width) {
  await b.until(`!!document.querySelector('${selector}')`, 8000);
  await sleep(800);
  const b64 = await b.evaluate(`new Promise(done => {
    const c = document.querySelector('${selector}');
    const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
    const x = o.getContext('2d'), sky = x.createLinearGradient(0, 0, 0, o.height);
    sky.addColorStop(0, '#2a0f4a'); sky.addColorStop(1, '#1a0b2e');
    let on = true;
    const frame = () => { if (!on) return; x.fillStyle = sky; x.fillRect(0, 0, o.width, o.height); x.drawImage(c, 0, 0); requestAnimationFrame(frame); };
    frame();
    const rec = new MediaRecorder(o.captureStream(30), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8e6 });
    const parts = [];
    rec.ondataavailable = e => parts.push(e.data);
    rec.onstop = () => { on = false; const r = new FileReader(); r.onload = () => done(String(r.result).split(',')[1]); r.readAsDataURL(new Blob(parts, { type: 'video/webm' })); };
    rec.start(); setTimeout(() => rec.stop(), ${ms});
  })`);
  const dir = join(WORK, name);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'clip.webm'), Buffer.from(b64, 'base64'));
  mp4(name, ['-i', join(dir, 'clip.webm')], `fps=30,scale=${width}:-2:flags=lanczos`);
}

const clean = `document.getElementById('tester-ribbon')?.remove(); 1`;

const GAMES = {
  shinobi: async b => { await b.go(`${SITE}/shinobi/?test&lang=en`, 2500); await cover(b, 'shinobi', '.sn-demo', 9000, 720); },
  babel: async b => { await b.go(`${SITE}/babel/?test&lang=en`, 2500); await cover(b, 'babel', '.sk-demo', 9000, 720); },

  // Against the phone: two bids, the phone answers, a doubt, the dice revealed
  'liars-dice': async b => {
    const ev = e => b.evaluate(e);
    await b.go(`${SITE}/liars-dice/?test&lang=en`, 2000);
    await ev(`localStorage.clear(); 1`);
    await b.go(`${SITE}/liars-dice/?test&lang=en`, 2500); await ev(clean);
    await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
    await ev(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
    await ev(`[...document.querySelectorAll('#setup-form .toggle-row')].find(r=>r.textContent.includes('🫨'))?.querySelector('.switch.on')?.click(); document.querySelector('#setup-actions .btn--yellow').click(); 1`);
    await sleep(1500); await ev(clean);
    const f = film(b);
    await f.live(1200);
    for (let turn = 0; turn < 30; turn++) {
      if (await ev(`document.getElementById('handoff').hidden === false && !!document.querySelector('#handoff .count')`)) { await f.live(3500); break; }
      if (!(await ev(`!!document.querySelector('#actions .btn')`))) { await f.live(300); continue; }
      if (turn >= 2) { await ev(`[...document.querySelectorAll('#actions .btn')].find(x=>/doubt|dudo|liar/i.test(x.textContent))?.click(); 1`); await f.live(700); continue; }
      await ev(`[...document.querySelectorAll('.pinta')].filter(x=>!x.disabled)[${turn === 0 ? 3 : 0}]?.click(); 1`); await f.live(900);
      await ev(`document.querySelector('#actions .btn--yellow')?.click(); 1`); await f.live(1800);
    }
    encodeFilm('liars-dice', f, { width: 600 });
  },

  // The globe: spun to the city, a pin near it, confirm, the arc and the distance; twice
  where: async b => {
    const ev = e => b.evaluate(e);
    const G = `document.querySelector('canvas.mapa-globo').globo`;
    await b.go(`${SITE}/where/?test&lang=en`, 2500); await ev(clean);
    await ev(`document.getElementById('btn-empezar')?.click(); 1`); await sleep(4800); await ev(clean);
    const target = () => ev(`(async()=>{
      const { CIUDADES } = await import('/cup/games/where/ciudades.js');
      const N = await import('/cup/games/where/nombres.js');
      const shown = document.querySelector('.donde-ciudad')?.innerText.split('\\n').pop().split(',')[0].trim();
      const c = CIUDADES.find(c => N.ciudad(c.ciudad, 'en') === shown || c.ciudad === shown);
      return c ? [c.lat, c.lon] : null;
    })()`);
    const f = film(b);
    for (let round = 0; round < 2; round++) {
      await f.live(900);
      const t = await target();
      if (!t) throw new Error('city not found');
      // Spin there smoothly, as a drag would: one frame per step
      const from = JSON.parse(await ev(`JSON.stringify(${G}.vista().centro)`));
      const dlon = ((t[1] - from[1] + 540) % 360) - 180;
      const steps = 30;
      for (let i = 1; i <= steps; i++) {
        const k = 0.5 - Math.cos(Math.PI * i / steps) / 2;
        await ev(`${G}.girarA(${from[0] + (t[0] - from[0]) * k}, ${from[1] + dlon * k}); 1`);
        await f.step();
      }
      await f.live(500);
      // The pin: a little off the city, as a player would put it
      const p = JSON.parse(await ev(`JSON.stringify(${G}.aPantalla(${t[0] + 2.2}, ${t[1] - 2.8}))`));
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p[0], y: p[1], button: 'left', clickCount: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p[0], y: p[1], button: 'left', clickCount: 1 });
      await f.live(1000);
      await ev(`document.getElementById('btn-confirmar')?.click(); 1`);
      await f.live(round === 0 ? 2600 : 2200);
      if (round === 0) await ev(`document.getElementById('btn-siguiente')?.click(); 1`);
    }
    encodeFilm('where', f, { width: 600 });
  },
};

const only = process.argv[2];
for (const [name, run] of Object.entries(GAMES)) {
  if (only && only !== name) continue;
  const b = await launch({ dir: join(WORK, `chrome-${name}`), out: join(WORK, 'shots'), width: W, height: H });
  try { await run(b); } finally { b.close(); }
}
process.exit(0);
