// The teaser engine (marketing/splash/TEASERS.md): what every teaser drawn with its game's own scene
// shares, so a new one is only its story. It gives the page:
// - a fixed clock: performance.now() is the clip's time, so the game's own effects (twinkles, sparks)
//   draw the same frames on every capture;
// - the game's canvas over a background of the teaser's, the same size and shape for all (512×320, 8/5);
// - the fade in and out of black, so the loop starts over cleanly;
// - the window.frame/FRAMES/FPS/SCALE contract that marketing/splash/teaser.mjs records;
// - beats(): the story as named moments, each with its progress from 0 to 1.
// It draws no words: the splash's title carries them (TEASERS.md, rule 4).

export const W = 512, H = 320;
let reloj = 0;
performance.now = () => reloj;

export const ease = k => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
export const noise = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

/**
 * The beat at `t` (seconds) of a story given as [[start, name], …] in order: `{ name, k }`, with `k`
 * the progress through it (the last beat runs to `end`).
 */
export function beats(list, t, end) {
  let i = list.length - 1;
  while (i > 0 && t < list[i][0]) i--;
  const from = list[i][0], to = i + 1 < list.length ? list[i + 1][0] : end;
  return { name: list[i][1], k: Math.min(1, Math.max(0, (t - from) / Math.max(0.001, to - from))) };
}

/**
 * Runs a teaser. `setup(canvas)` builds the game's scene on its canvas (sized by the page) and returns
 * whatever `draw` needs; `background(ctx, t)` paints what stands behind the transparent scene;
 * `draw(state, t)` moves and draws the scene at `t` seconds. The page needs
 * `<div class="marco"><canvas id="fondo"></canvas><canvas id="juego"></canvas></div>`.
 */
export function teaser({ seconds = 8, fps = 30, setup, background, draw }) {
  const fondo = document.getElementById('fondo'), juego = document.getElementById('juego');
  fondo.width = W; fondo.height = H;
  const ctx = fondo.getContext('2d');
  const state = setup(juego);
  const salida = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const o = salida.getContext('2d');
  const frames = fps * seconds;
  const frame = i => {
    const t = i / fps;
    reloj = t * 1000;
    background(ctx, t);
    draw(state, t);
    o.drawImage(fondo, 0, 0);
    o.drawImage(juego, 0, 0, W, H);
    const f = Math.max(0, 1 - t / 0.4, 1 - (seconds - t) / 0.5);
    if (f > 0) { o.fillStyle = `rgba(11,7,22,${Math.min(1, f).toFixed(3)})`; o.fillRect(0, 0, W, H); }
    return salida;
  };
  window.frame = i => frame(i).toDataURL('image/png');
  Object.assign(window, { FRAMES: frames, FPS: fps, SCALE: 1, ready: true });
  // Opened by hand, it plays in a loop, on a canvas of its own over the two
  if (!new URLSearchParams(location.search).has('capture')) {
    const vista = Object.assign(document.createElement('canvas'), { width: W, height: H });
    vista.style.cssText = 'position:absolute;inset:0;width:512px;height:320px';
    fondo.parentElement.append(vista);
    let i = 0; setInterval(() => { vista.getContext('2d').drawImage(frame(i), 0, 0); i = (i + 1) % frames; }, 1000 / fps);
  }
}
