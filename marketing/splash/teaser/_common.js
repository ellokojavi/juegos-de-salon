// What the teaser scenes share: a 128×80 art buffer drawn with whole pixels, a seeded chance and the
// window.frame/FRAMES/FPS contract that marketing/splash/teaser.mjs reads.
export const W = 128, H = 80;
export function scene({ fps = 15, seconds = 8, draw }) {
  const art = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = art.getContext('2d');
  const view = document.getElementById('c');
  view.width = W; view.height = H;
  const frames = fps * seconds;
  const frame = i => { draw(ctx, i / fps, i); view.getContext('2d').drawImage(art, 0, 0); };
  window.frame = i => { frame(i); return art.toDataURL('image/png'); };
  window.FRAMES = frames; window.FPS = fps; window.ready = true;
  if (!new URLSearchParams(location.search).has('capture')) { let i = 0; setInterval(() => { frame(i); i = (i + 1) % frames; }, 1000 / fps); }
}
export const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const noise = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
export const ease = k => 1 - (1 - Math.min(1, Math.max(0, k))) ** 2;
/** In and out of black, so the loop starts over cleanly. */
export function fade(ctx, t, seconds) {
  const f = Math.max(0, 1 - t / 0.4, 1 - (seconds - t) / 0.5);
  if (f > 0) rect(ctx, 0, 0, W, H, `rgba(11,7,22,${Math.min(1, f).toFixed(3)})`);
}
// A "?" of 5×7, outlined, as the Tren en Vilo teaser's
const Q = ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'];
export function ask(ctx, x, y, color = '#ffd23f') {
  Q.forEach((row, j) => [...row].forEach((p, i) => { if (p === '#') { rect(ctx, x + i - 1, y + j, 3, 1, '#14081f'); rect(ctx, x + i, y + j - 1, 1, 3, '#14081f'); } }));
  Q.forEach((row, j) => [...row].forEach((p, i) => { if (p === '#') rect(ctx, x + i, y + j, 1, 1, color); }));
}
