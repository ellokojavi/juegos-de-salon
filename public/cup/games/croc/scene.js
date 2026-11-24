/**
 * Croc!: 2.5D top-down HTML5 Canvas renderer.
 * No shadowBlur (kept fast on 3x phones; DPR capped at 2x).
 */
import { COLS, sectorOf } from './engine.js';

const SEDAN_PALETTE = {
  coral: { body: '#ff5d6c', roof: '#ff8a95', dark: '#b82c3a' },
  teal: { body: '#27d6c7', roof: '#6ff2e6', dark: '#14847b' },
  indigo: { body: '#6b7cff', roof: '#9ba7ff', dark: '#3e4ab8' },
  lime: { body: '#7be04a', roof: '#a7f082', dark: '#459421' },
};

const FISH_COLORS = [
  { body: 'rgba(251, 146, 60, 0.82)', fin: 'rgba(234, 88, 12, 0.85)', hi: 'rgba(254, 215, 170, 0.65)' },
  { body: 'rgba(250, 204, 21, 0.82)', fin: 'rgba(202, 138, 4, 0.85)', hi: 'rgba(254, 249, 195, 0.65)' },
  { body: 'rgba(125, 211, 252, 0.82)', fin: 'rgba(56, 189, 248, 0.85)', hi: 'rgba(240, 249, 255, 0.65)' },
  { body: 'rgba(251, 113, 133, 0.8)', fin: 'rgba(225, 29, 72, 0.82)', hi: 'rgba(255, 228, 230, 0.6)' },
];

const SEASON_SHIRTS = {
  halloween: { base: '#5b1fb8', band: '#ff7a1a', trim: '#1e1b4b', accent: '#fde047' },
  thanksgiving: { base: '#b45309', band: '#78350f', trim: '#fef3c7', accent: '#fbbf24' },
  christmas: { base: '#d62828', band: '#198754', trim: '#f8fafc', accent: '#ffd94a' },
  newyear: { base: '#1e293b', band: '#334155', trim: '#f8fafc', accent: '#ffd94a' },
  winter: { base: '#2563eb', band: '#60a5fa', trim: '#f8fafc', accent: '#e0f2fe' },
  summer: { base: '#06b6d4', band: '#fb7185', trim: '#fef08a', accent: '#fde047' },
  default: { base: '#0ea5e9', band: '#ffd94a', trim: '#f8fafc', accent: '#ffffff' },
};

function pickShirtTheme(date = new Date()) {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '');
    const asked = q.get('season');
    if (asked === 'off' || q.has('test')) return SEASON_SHIRTS.default;
    if (asked && SEASON_SHIRTS[asked]) return SEASON_SHIRTS[asked];
  } catch (_) { /* ignore */ }
  const md = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (md >= '10-26' && md <= '10-31') return SEASON_SHIRTS.halloween;
  if (md >= '11-20' && md <= '11-30') return SEASON_SHIRTS.thanksgiving;
  if (md >= '12-15' && md <= '12-26') return SEASON_SHIRTS.christmas;
  if (md >= '12-27' || md <= '01-03') return SEASON_SHIRTS.newyear;
  if (md >= '12-01' || md <= '02-29') return SEASON_SHIRTS.winter;
  if (md >= '06-21' && md <= '09-21') return SEASON_SHIRTS.summer;
  return SEASON_SHIRTS.default;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, rOuter, rInner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? rOuter : rInner;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** How long the frog dances on reaching the pond (ui.js keeps drawing that long). */
export const DANCE_S = 1.8;

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 360;
  let h = 640;
  let dpr = 1;
  let camY = 0;
  let clock = 0;
  let shake = 0;
  let hitShake = 0;
  let danceT = 0; // seconds since the frog reached the pond: its little victory dance
  const QUIET = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particles = [];
  const popups = [];
  const ghosts = [];

  function measure() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { w, h };
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w, h };
  }

  function clear() {
    particles.length = 0;
    popups.length = 0;
    ghosts.length = 0;
    camY = 0;
    shake = 0;
  }

  function spawnBurst(col, row, color, count = 10, speed = 2.6) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const sp = speed * (0.5 + Math.random() * 0.7);
      particles.push({
        x: col + 0.5,
        y: row + 0.5,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.45 + Math.random() * 0.2,
        maxLife: 0.65,
        r: 0.08 + Math.random() * 0.07,
        color,
      });
    }
  }

  function fx(ev, g, labels = {}) {
    if (ev.type === 'hop') {
      spawnBurst(g.frog.fromCol, g.frog.fromRow, 'rgba(255,255,255,0.45)', 5, 1.4);
    } else if (ev.type === 'dash') {
      spawnBurst(g.frog.fromCol, g.frog.fromRow, '#2ee6d6', 12, 3.2);
      popups.push({ x: g.frog.fromCol + 0.5, y: g.frog.fromRow + 0.8, text: '⚡ DASH!', color: '#2ee6d6', life: 0.65, maxLife: 0.65 });
    } else if (ev.type === 'fruit') {
      const col = ev.kind === 'star' ? '#ffd94a' : ev.kind === 'mango' ? '#ff9f43' : '#ff5d8f';
      spawnBurst(ev.col, ev.row, col, 14, 3.1);
      popups.push({ x: ev.col + 0.5, y: ev.row + 0.6, text: `+${ev.pts}`, color: col, life: 0.9, maxLife: 0.9 });
    } else if (ev.type === 'closeCall') {
      spawnBurst(ev.col, ev.row, '#ffd94a', 14, 3.4);
      const txt = labels.closeCall || 'CLOSE CALL!';
      popups.push({ x: ev.col + 0.5, y: ev.row + 0.8, text: txt, color: '#ffd94a', life: 1.05, maxLife: 1.05 });
      shake = Math.max(shake, 0.2);
    } else if (ev.type === 'hit') {
      const col = ev.vehicle === 'water' ? '#38bdf8' : '#ff4d6d';
      spawnBurst(ev.col, ev.row, col, 14, 3.2);
      popups.push({ x: ev.col + 0.5, y: ev.row + 0.8, text: '-1 ❤️', color: col, life: 0.9, maxLife: 0.9 });
      shake = 0.32;
      hitShake = 0.45;
    } else if (ev.type === 'crash') {
      spawnBurst(ev.col, ev.row, '#ff4d6d', 20, 4.2);
      spawnBurst(ev.col, ev.row, '#ffd94a', 8, 2.8);
      shake = 0.45;
    } else if (ev.type === 'win') {
      spawnBurst(g.frog.col, g.frog.row, '#2ee6d6', 18, 3.5);
      spawnBurst(g.frog.col, g.frog.row, '#ffd94a', 18, 3.8);
    }
  }

  function tick(dt, g) {
    clock += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 1.4);
    if (hitShake > 0) hitShake = Math.max(0, hitShake - dt);

    if (g) {
      danceT = g.mode === 'win' ? danceT + dt : 0;
      const targetCam = Math.max(0, Math.min(g.finishRow - 3, g.frog.y));
      camY += (targetCam - camY) * Math.min(1, dt * 11);
      if (g.frog.isDash && Math.random() < 0.75) {
        ghosts.push({ x: g.frog.x, y: g.frog.y, z: g.frog.z, dir: g.frog.dir, life: 0.22, maxLife: 0.22 });
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.y += dt * 0.9;
      p.life -= dt;
      if (p.life <= 0) popups.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
  }

  /* The scenery of the rest lanes and the finish (the owner chose them, 2026-11-18): a grass verge between
     curbs with a lamp, a bench and a butterfly, and a wetland with reeds, a heron, a duck and lily pads */
  const rnd = (a, b, row) => { const t = Math.sin(a * 12.9898 + b * 78.233 + row * 3.7) * 43758.5453; return t - Math.floor(t); };
  const shade = (x, y, rx, ry) => { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); };
  const tuft = (x, y, s, col) => { ctx.lineCap = 'round';
    for (const [a, k, c] of [[-0.55, 0.8, '#1f5c33'], [0.5, 0.85, '#1f5c33'], [-0.2, 1, col], [0.25, 0.95, col], [0, 1.1, '#9df58f']]) {
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, s * 0.11); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a * s * 0.2, y - s * k * 0.6, x + a * s * 0.65, y - s * k); ctx.stroke(); } };
  const flower = (x, y, r, col) => {
    ctx.strokeStyle = '#2f7d3c'; ctx.lineWidth = Math.max(1, r * 0.35); ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y + r * 3.2); ctx.stroke();
    ctx.fillStyle = '#3cb857'; ctx.beginPath(); ctx.ellipse(x + r * 0.9, y + r * 2.4, r * 0.9, r * 0.4, -0.5, 0, 7); ctx.fill();
    for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.3; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.75, r * 0.45, a, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.3, r * 0.15, a, 0, 7); ctx.fill(); }
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r * 0.6); g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#e8a400'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 7); ctx.fill(); };
  const lily = (x, y, r, bloom) => {
    ctx.fillStyle = 'rgba(0,40,60,0.35)'; ctx.beginPath(); ctx.ellipse(x + r * 0.12, y + r * 0.14, r, r * 0.8, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#7be38a'); g.addColorStop(1, '#249a48');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0.35, Math.PI * 2 - 0.35); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,90,40,0.6)'; ctx.lineWidth = 1; for (let k = 0; k < 7; k++) { const a = 0.6 + k * 0.75; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.68); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(180,255,190,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.92, r * 0.72, 0, 3.6, 5.2); ctx.stroke();
    if (bloom) { for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.38; ctx.fillStyle = k % 2 ? '#ffc2d8' : '#ff8ab5'; ctx.beginPath(); ctx.ellipse(x - r * 0.2 + Math.cos(a) * r * 0.22, y - r * 0.15 + Math.sin(a) * r * 0.22, r * 0.12, r * 0.28, a + Math.PI / 2, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#ffd94a'; ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.15, r * 0.09, 0, 7); ctx.fill(); } };
  const tree = (x, y, r) => { shade(x + r * 0.35, y + r * 0.55, r * 1.05, r * 0.45);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(x - r * 0.12, y, r * 0.24, r * 0.55);
    for (const [dx, dy, rr, c] of [[0, 0, 1, '#1d6b33'], [-0.35, -0.2, 0.62, '#2a8a42'], [0.35, -0.15, 0.6, '#2a8a42'], [-0.1, -0.45, 0.55, '#3cae55'], [-0.25, -0.55, 0.28, '#6fe377']]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * r, y - r * 0.35 + dy * r, rr * r, 0, 7); ctx.fill(); }
    for (const [dx, dy] of [[0.3, -0.5], [-0.45, -0.1], [0.1, 0.1]]) { ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(x + dx * r, y - r * 0.35 + dy * r, r * 0.07, 0, 7); ctx.fill(); } };
  const shrub = (x, y, r) => { shade(x + r * 0.2, y + r * 0.45, r * 1.1, r * 0.4);
    for (const [dx, dy, rr, c] of [[-0.45, 0.1, 0.62, '#257a3a'], [0.45, 0.1, 0.62, '#257a3a'], [0, -0.05, 0.8, '#2f9a48'], [-0.2, -0.3, 0.42, '#55c96a'], [-0.3, -0.42, 0.18, '#a6f59a']]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, 7); ctx.fill(); } };
  const reed = (x, y, hgt) => { ctx.strokeStyle = '#4f7d2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - hgt * 0.5, x + 1, y - hgt); ctx.stroke();
    ctx.strokeStyle = '#6aa83a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 6, y - hgt * 0.4, x - 9, y - hgt * 0.7); ctx.stroke();
    const g = ctx.createLinearGradient(x - 3, 0, x + 3, 0); g.addColorStop(0, '#4a2810'); g.addColorStop(0.5, '#8a5428'); g.addColorStop(1, '#4a2810'); ctx.fillStyle = g;
    drawRoundedRect(ctx, x - 3, y - hgt * 0.95, 7, hgt * 0.3, 3); ctx.fill(); ctx.strokeStyle = '#4f7d2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 0.5, y - hgt * 0.95); ctx.lineTo(x + 0.5, y - hgt * 1.08); ctx.stroke(); };
  const bench = (bx, by, bw, s) => { shade(bx + bw / 2 + 3, by + s * 0.5, bw * 0.55, s * 0.12);
    for (let k = 0; k < 3; k++) { const g = ctx.createLinearGradient(0, by + k * s * 0.13, 0, by + k * s * 0.13 + s * 0.1); g.addColorStop(0, '#c48a55'); g.addColorStop(1, '#7a4a24'); ctx.fillStyle = g; ctx.fillRect(bx, by + k * s * 0.13, bw, s * 0.1); }
    ctx.fillStyle = '#2b2f3a'; for (const lx of [bx + s * 0.06, bx + bw - s * 0.12]) { ctx.fillRect(lx, by - s * 0.04, s * 0.06, s * 0.5); } };
  const rock = (x, y, r) => { shade(x + r * 0.2, y + r * 0.45, r * 1.05, r * 0.35);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#c9ced8'); g.addColorStop(1, '#5b6170');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(80,140,60,0.6)'; ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.3, r * 0.4, r * 0.18, 0, 0, 7); ctx.fill(); };
  const lamp = (x, y, s) => { ctx.fillStyle = 'rgba(255,217,74,0.16)'; ctx.beginPath(); ctx.arc(x, y, s * 0.34, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,217,74,0.22)'; ctx.beginPath(); ctx.arc(x, y, s * 0.22, 0, 7); ctx.fill();
    shade(x + s * 0.08, y + s * 0.06, s * 0.14, s * 0.06); ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(x, y, s * 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a5060'; ctx.beginPath(); ctx.arc(x, y, s * 0.09, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6c2'; ctx.beginPath(); ctx.arc(x, y, s * 0.055, 0, 7); ctx.fill(); };
  const butterfly = (x, y, s, col) => { const f = Math.abs(Math.sin(clock * 9)) * 0.7 + 0.3; ctx.fillStyle = col;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sx * s * 0.45 * f, y - s * 0.15, s * 0.45 * f, s * 0.35, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + sx * s * 0.35 * f, y + s * 0.25, s * 0.3 * f, s * 0.25, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#2b1d10'; ctx.fillRect(x - 1, y - s * 0.4, 2, s * 0.8); };
  const dragonfly = (x, y, s) => { ctx.fillStyle = 'rgba(200,240,255,0.55)'; for (const [dx, dy, a] of [[-0.35, -0.12, -0.3], [0.35, -0.12, 0.3], [-0.3, 0.12, 0.3], [0.3, 0.12, -0.3]]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, s * 0.32, s * 0.09, a, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#1aa3c9'; ctx.fillRect(x - 1.5, y - s * 0.2, 3, s * 0.75); ctx.fillStyle = '#0d5f7a'; ctx.beginPath(); ctx.arc(x, y - s * 0.22, s * 0.08, 0, 7); ctx.fill(); };
  const duck = (x, y, s) => { ctx.fillStyle = 'rgba(0,40,60,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, s * 0.6, s * 0.18, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a6a48'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.5, s * 0.28, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6b4f33'; ctx.beginPath(); ctx.ellipse(x - s * 0.1, y - s * 0.02, s * 0.3, s * 0.15, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1f7a4a'; ctx.beginPath(); ctx.arc(x + s * 0.38, y - s * 0.25, s * 0.17, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(x + s * 0.52, y - s * 0.27); ctx.lineTo(x + s * 0.72, y - s * 0.22); ctx.lineTo(x + s * 0.52, y - s * 0.18); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x + s * 0.3, y - s * 0.12, s * 0.16, 2); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + s * 0.42, y - s * 0.29, 1.5, 0, 7); ctx.fill(); };
  const heron = (x, y, s) => { ctx.fillStyle = 'rgba(0,40,60,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.02, s * 0.35, s * 0.08, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c99a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - s * 0.06, y); ctx.lineTo(x - s * 0.02, y - s * 0.45); ctx.moveTo(x + s * 0.06, y); ctx.lineTo(x + s * 0.03, y - s * 0.45); ctx.stroke();
    const g = ctx.createLinearGradient(0, y - s * 0.8, 0, y - s * 0.4); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c7ccd6'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y - s * 0.6, s * 0.3, s * 0.17, -0.25, 0, 7); ctx.fill(); ctx.fillStyle = '#d9dde5'; ctx.beginPath(); ctx.ellipse(x - s * 0.08, y - s * 0.58, s * 0.2, s * 0.1, -0.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#f2f4f8'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 0.68); ctx.bezierCurveTo(x + s * 0.4, y - s * 0.85, x + s * 0.1, y - s * 1.0, x + s * 0.3, y - s * 1.15); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + s * 0.3, y - s * 1.17, s * 0.08, 0, 7); ctx.fill(); ctx.fillStyle = '#f0b429'; ctx.beginPath(); ctx.moveTo(x + s * 0.36, y - s * 1.2); ctx.lineTo(x + s * 0.62, y - s * 1.15); ctx.lineTo(x + s * 0.36, y - s * 1.13); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + s * 0.32, y - s * 1.19, 1.4, 0, 7); ctx.fill(); ctx.strokeStyle = '#2b2f3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + s * 0.28, y - s * 1.2); ctx.lineTo(x + s * 0.12, y - s * 1.24); ctx.stroke(); };
  const curb = (yy, hgt, top, tile) => { const g = ctx.createLinearGradient(0, yy, 0, yy + hgt); g.addColorStop(0, top ? '#ffffff' : '#d4d9e2'); g.addColorStop(1, top ? '#b9c0cc' : '#8a91a0'); ctx.fillStyle = g; ctx.fillRect(0, yy, w, hgt);
    for (let x = 0; x < w; x += tile * 0.55) { ctx.fillStyle = 'rgba(40,45,60,0.45)'; ctx.fillRect(x, yy, 1.5, hgt); } };

  const wrapPos = (x, span) => ((x % span) + span) % span;

  function drawWaterLane(lane, rowY, tile) {
    // River depth gradient: lighter shallows at banks, deeper channel in the center
    const riverGrad = ctx.createLinearGradient(0, rowY, 0, rowY + tile);
    riverGrad.addColorStop(0, '#115e75');
    riverGrad.addColorStop(0.18, '#0e7490');
    riverGrad.addColorStop(0.5, '#084c61');
    riverGrad.addColorStop(0.82, '#0e7490');
    riverGrad.addColorStop(1, '#115e75');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, rowY, w, tile);

    // Submerged riverbed stones & drifting caustics
    for (let i = 0; i < 10; i++) {
      const sx = rnd(i, 91, lane.row) * w;
      const sy = rowY + tile * (0.18 + rnd(i, 92, lane.row) * 0.64);
      const rx = tile * (0.14 + rnd(i, 93, lane.row) * 0.2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(3, 37, 52, 0.28)' : 'rgba(34, 166, 179, 0.14)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, rx * 0.42, 0, 0, 7);
      ctx.fill();
    }

    const causticSpan = w + tile * 2;
    const causticShift = clock * lane.dir * lane.speed * tile * 0.18;
    ctx.fillStyle = 'rgba(125, 211, 252, 0.1)';
    for (let i = 0; i < 9; i++) {
      const cx = wrapPos(rnd(i, 94, lane.row) * causticSpan + causticShift, causticSpan) - tile;
      const cy = rowY + tile * (0.2 + rnd(i, 95, lane.row) * 0.6);
      const rw = tile * (0.28 + rnd(i, 96, lane.row) * 0.22);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, tile * 0.08, 0, 0, 7);
      ctx.fill();
    }

    // Swaying underwater seaweed along the shallows
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const sx = (0.06 + rnd(i, 101, lane.row) * 0.88) * w;
      const topBank = i % 2 === 0;
      const baseY = rowY + (topBank ? tile * 0.1 : tile * 0.9);
      const swayDir = topBank ? 1 : -1;
      for (let b = 0; b < 3; b++) {
        const bx = sx + (b - 1) * tile * 0.055;
        const len = tile * (0.14 + rnd(i * 3 + b, 102, lane.row) * 0.1);
        const sway = Math.sin(clock * 2.1 + i * 1.4 + b * 0.7) * tile * 0.045;
        const tipX = bx + lane.dir * tile * 0.09 + sway;
        const tipY = baseY + swayDir * len;
        ctx.strokeStyle = b === 1 ? 'rgba(34, 197, 94, 0.42)' : 'rgba(21, 128, 61, 0.48)';
        ctx.lineWidth = Math.max(1.8, tile * 0.036);
        ctx.beginPath();
        ctx.moveTo(bx, baseY);
        ctx.quadraticCurveTo(bx + lane.dir * tile * 0.04 - sway * 0.5, baseY + swayDir * len * 0.55, tipX, tipY);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Swimming & jumping river fish
    const fishSpan = w + tile * 2;
    for (let i = 0; i < 4; i++) {
      const speedMul = 0.28 + rnd(i, 97, lane.row) * 0.25;
      const fx = wrapPos(rnd(i, 98, lane.row) * fishSpan + clock * lane.dir * lane.speed * tile * speedMul, fishSpan) - tile;
      const sway = Math.sin(clock * 2.2 + i * 1.9) * tile * 0.04;
      const fy = rowY + tile * (0.24 + rnd(i, 99, lane.row) * 0.52) + sway;
      const fLen = tile * (0.22 + rnd(i, 100, lane.row) * 0.08);
      const tailWag = Math.sin(clock * 9 + i * 2.3) * fLen * 0.28;
      const pal = FISH_COLORS[i % FISH_COLORS.length];

      // Periodic jump for two of the fish
      const jumpCycle = (clock * 0.36 + i * 0.47) % 1;
      const jumping = i < 2 && jumpCycle < 0.28;
      const jt = jumping ? jumpCycle / 0.28 : 0;
      const jumpArc = jumping ? Math.sin(jt * Math.PI) * tile * 0.28 : 0;

      if (jumping && (jt < 0.25 || jt > 0.75)) {
        const ringR = tile * (0.07 + (jt < 0.25 ? jt : 1 - jt) * 0.52);
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.58)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(fx, fy, ringR, ringR * 0.42, 0, 0, 7);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(fx, fy - jumpArc);
      if (jumping) ctx.rotate(-lane.dir * (0.5 - jt) * 0.9);
      ctx.scale(lane.dir, 1);

      ctx.fillStyle = pal.fin;
      ctx.beginPath();
      ctx.moveTo(-fLen * 0.42, 0);
      ctx.lineTo(-fLen * 0.88, -fLen * 0.26 + tailWag);
      ctx.lineTo(-fLen * 0.88, fLen * 0.26 + tailWag);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = jumping ? '#fef08a' : pal.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, fLen * 0.55, fLen * 0.25, 0, 0, 7);
      ctx.fill();

      ctx.fillStyle = jumping ? 'rgba(255, 255, 255, 0.8)' : pal.hi;
      ctx.beginPath();
      ctx.ellipse(fLen * 0.08, -fLen * 0.07, fLen * 0.26, fLen * 0.07, 0, 0, 7);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(fLen * 0.34, -fLen * 0.04, Math.max(1.2, fLen * 0.055), 0, 7);
      ctx.fill();
      ctx.restore();
    }

    // Sparser curved moving waves flowing in lane.dir
    ctx.save();
    ctx.lineCap = 'round';
    const waveBands = [
      { yFrac: 0.30, step: tile * 2.15, speedMul: 0.42, len: tile * 0.58, phase: 0.0 },
      { yFrac: 0.68, step: tile * 2.45, speedMul: 0.58, len: tile * 0.64, phase: 2.5 },
    ];
    for (const band of waveBands) {
      const wrapW = w + band.step * 2;
      const shift = clock * lane.dir * lane.speed * tile * band.speedMul;
      const count = Math.ceil(wrapW / band.step);
      for (let i = 0; i < count; i++) {
        const wx = wrapPos(i * band.step + shift, wrapW) - band.step;
        const bob = Math.sin(clock * 2.2 + i * 1.3 + band.phase) * tile * 0.02;
        const wy = rowY + tile * band.yFrac + bob;
        const crestH = tile * 0.045;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
        ctx.lineWidth = Math.max(2, tile * 0.06);
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + band.len * 0.5, wy - crestH, wx + band.len, wy);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(240, 249, 255, 0.52)';
        ctx.lineWidth = Math.max(1.2, tile * 0.024);
        ctx.beginPath();
        ctx.moveTo(wx + band.len * 0.12, wy - tile * 0.01);
        ctx.quadraticCurveTo(wx + band.len * 0.5, wy - crestH - tile * 0.01, wx + band.len * 0.88, wy - tile * 0.01);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Organic riverbanks & shallow shoreline foam
    const bankHeight = tile * 0.085;
    for (const isTop of [true, false]) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.beginPath();
      if (isTop) {
        ctx.moveTo(0, rowY);
        ctx.lineTo(w, rowY);
        for (let x = w; x >= 0; x -= 12) {
          ctx.lineTo(x, rowY + bankHeight + Math.sin(x / tile * 2.1 + lane.row) * tile * 0.02);
        }
      } else {
        ctx.moveTo(0, rowY + tile);
        ctx.lineTo(w, rowY + tile);
        for (let x = w; x >= 0; x -= 12) {
          ctx.lineTo(x, rowY + tile - bankHeight + Math.sin(x / tile * 2.3 + lane.row + 1.5) * tile * 0.02);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
      ctx.lineWidth = Math.max(1, tile * 0.022);
      ctx.beginPath();
      const foamY = isTop ? rowY + bankHeight + tile * 0.015 : rowY + tile - bankHeight - tile * 0.015;
      for (let x = 0; x <= w; x += 12) {
        const fy = foamY + Math.sin(x / tile * 2.2 + lane.row + (isTop ? 0 : 1.5)) * tile * 0.02;
        if (x === 0) ctx.moveTo(x, fy);
        else ctx.lineTo(x, fy);
      }
      ctx.stroke();
    }
  }

  function drawLane(lane, rowY, tile, padX) {
    const x0 = padX;
    const roadW = COLS * tile;

    if (lane.kind === 'safe' || lane.kind === 'median') { // the verge: curbs, grass, a lamp, a bin, a bench and a butterfly
      curb(rowY, tile * 0.11, true, tile); curb(rowY + tile * 0.89, tile * 0.11, false, tile);
      const g = ctx.createLinearGradient(0, rowY + tile * 0.11, 0, rowY + tile * 0.89); g.addColorStop(0, '#4fb35c'); g.addColorStop(1, '#2f8a40'); ctx.fillStyle = g; ctx.fillRect(0, rowY + tile * 0.11, w, tile * 0.78);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, rowY + tile * 0.11, w, tile * 0.05);
      for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(30,90,40,0.35)'; ctx.beginPath(); ctx.ellipse(rnd(i, 71, lane.row) * w, rowY + tile * (0.3 + rnd(i, 72, lane.row) * 0.5), tile * 0.25, tile * 0.07, 0, 0, 7); ctx.fill(); }
      for (let i = 0; i < 34; i++) tuft(rnd(i, 1, lane.row) * w, rowY + tile * (0.4 + rnd(i, 2, lane.row) * 0.45), tile * 0.17, rnd(i, 3, lane.row) < 0.5 ? '#7ee07a' : '#3fa04e');
      for (let i = 0; i < 10; i++) flower(rnd(i, 4, lane.row) * w, rowY + tile * (0.28 + rnd(i, 5, lane.row) * 0.32), tile * 0.05, ['#ff5d8f', '#ffffff', '#b98cff', '#ffb347'][i % 4]);
      shrub(x0 + 0.55 * tile, rowY + tile * 0.48, tile * 0.25); lamp(x0 + 2.5 * tile, rowY + tile * 0.5, tile); bench(x0 + 5.15 * tile, rowY + tile * 0.33, tile * 0.95, tile);
      ctx.fillStyle = '#2f9a48'; drawRoundedRect(ctx, x0 + 4.35 * tile, rowY + tile * 0.32, tile * 0.24, tile * 0.34, 3); ctx.fill(); ctx.fillStyle = '#1f6b33'; ctx.fillRect(x0 + 4.35 * tile, rowY + tile * 0.32, tile * 0.24, tile * 0.06);
      butterfly(x0 + 3.6 * tile + Math.sin(clock * 1.3) * tile * 0.4, rowY + tile * 0.35 + Math.cos(clock * 2) * tile * 0.08, tile * 0.12, '#ffd94a');
      return;
    }

    if (lane.kind === 'water') {
      drawWaterLane(lane, rowY, tile);
      return;
    }

    if (lane.kind === 'finish') { // the wetland, up to the top of the screen
      const top = rowY - tile * 12, H = rowY + tile - top;
      const g = ctx.createLinearGradient(0, top, 0, rowY); g.addColorStop(0, '#1f6b3a'); g.addColorStop(1, '#3a9a52'); ctx.fillStyle = g; ctx.fillRect(0, top, w, H);
      for (let i = 0; i < 30; i++) { ctx.fillStyle = rnd(i, 81, lane.row) < 0.5 ? 'rgba(20,70,35,0.35)' : 'rgba(120,200,110,0.18)'; ctx.beginPath(); ctx.ellipse(rnd(i, 82, lane.row) * w, top + rnd(i, 83, lane.row) * (H - tile), tile * (0.5 + rnd(i, 84, lane.row)), tile * 0.25, 0, 0, 7); ctx.fill(); }
      for (let i = 0; i < 160; i++) tuft(rnd(i, 41, lane.row) * w, top + rnd(i, 42, lane.row) * (H - tile * 1.2), tile * 0.2, rnd(i, 43, lane.row) < 0.5 ? '#6ad078' : '#2f8a42');
      for (let i = 0; i < 12; i++) flower(rnd(i, 85, lane.row) * w, top + rnd(i, 86, lane.row) * (H - tile * 2), tile * 0.05, ['#ffd94a', '#ffffff', '#b98cff'][i % 3]);
      // mud bank, then the winding pond with a lighter shallow edge
      const shore = (off) => { ctx.beginPath(); ctx.moveTo(-10, rowY + tile * 1.1); for (let x = -10; x <= w + 10; x += 6) ctx.lineTo(x, rowY - tile * 0.45 + off + Math.sin(x / tile * 1.3) * tile * 0.16 + Math.sin(x / tile * 3.1) * tile * 0.05); ctx.lineTo(w + 10, rowY + tile * 1.1); ctx.closePath(); };
      ctx.fillStyle = '#7a5a36'; shore(-tile * 0.12); ctx.fill(); ctx.fillStyle = '#3aa6b8'; shore(0); ctx.fill();
      const wg = ctx.createLinearGradient(0, rowY - tile * 0.3, 0, rowY + tile); wg.addColorStop(0, '#1b88a8'); wg.addColorStop(1, '#0b4f6e'); ctx.fillStyle = wg; shore(tile * 0.12); ctx.fill();
      ctx.strokeStyle = 'rgba(224,242,254,0.3)'; ctx.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const xx = (rnd(k, 87, lane.row) * w + clock * 12) % w; ctx.beginPath(); ctx.moveTo(xx, rowY + tile * (0.1 + rnd(k, 88, lane.row) * 0.6)); ctx.lineTo(xx + tile * 0.4, rowY + tile * (0.1 + rnd(k, 88, lane.row) * 0.6)); ctx.stroke(); }
      for (let k = 0; k < 3; k++) { const r = ((clock * 0.5 + k / 3) % 1) * tile * 0.5; ctx.strokeStyle = `rgba(224,242,254,${0.4 * (1 - r / (tile * 0.5))})`; ctx.beginPath(); ctx.ellipse(x0 + 2.2 * tile, rowY + tile * 0.4, r, r * 0.4, 0, 0, 7); ctx.stroke(); }
      for (const [c, b] of [[0.9, false], [2.1, true], [3.4, false], [4.6, true], [5.9, false]]) lily(x0 + c * tile, rowY + tile * (0.35 + (c % 2) * 0.15), tile * 0.24, b);
      rock(x0 + 0.2 * tile, rowY - tile * 0.35, tile * 0.22); rock(x0 + 6.6 * tile, rowY - tile * 0.25, tile * 0.18);
      for (let i = 0; i < 18; i++) reed(rnd(i, 44, lane.row) * w, rowY - tile * (0.15 + rnd(i, 45, lane.row) * 0.45) + tile * 0.25, tile * (0.8 + rnd(i, 46, lane.row) * 0.5));
      duck(x0 + 4 * tile + Math.sin(clock * 0.5) * tile * 0.5, rowY + tile * 0.75, tile * 0.38);
      heron(x0 + roadW * 0.82, rowY + tile * 0.15, tile);
      dragonfly(x0 + 3 * tile + Math.sin(clock * 1.7) * tile, rowY - tile * 1.2 + Math.sin(clock * 3.3) * tile * 0.2, tile * 0.3);
      return;
    }

    // Asphalt road lane
    const roadBg = lane.sector === 3 ? '#15192a' : lane.sector === 2 ? '#1e2338' : '#262b42';
    ctx.fillStyle = roadBg;
    ctx.fillRect(0, rowY, w, tile);

    // Roadside shoulders
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, rowY, x0, tile);
    ctx.fillRect(x0 + roadW, rowY, w - (x0 + roadW), tile);

    // Subtle dashed lane divider at top of lane
    ctx.fillStyle = lane.sector === 3 ? 'rgba(46, 230, 214, 0.18)' : 'rgba(255, 255, 255, 0.16)';
    for (let c = 0; c < COLS; c++) {
      ctx.fillRect(x0 + (c + 0.2) * tile, rowY, tile * 0.55, Math.max(1.5, tile * 0.045));
    }
  }

  function drawVehicle(v, dir, sector, rowY, tile, padX) {
    const vx = padX + v.x * tile;
    const vw = v.len * tile;
    const vh = tile * 0.68;
    const vy = rowY + (tile - vh) / 2 - tile * 0.03;

    if (v.type === 'boat') {
      const bob = Math.sin(clock * 3.8 + v.x * 1.7) * tile * 0.016;
      const by = vy + bob;
      const sternX = dir > 0 ? vx : vx + vw;
      const cy = by + vh * 0.48;

      // V-shaped Kelvin wake & inner ripples fading behind the stern
      const wakeStartX = sternX + dir * vw * 0.25;
      const wakeLen = tile * 1.2;
      const wakeEndX = sternX - dir * wakeLen;
      const wakeGrad = ctx.createLinearGradient(wakeStartX, cy, wakeEndX, cy);
      wakeGrad.addColorStop(0, 'rgba(240, 249, 255, 0.58)');
      wakeGrad.addColorStop(0.45, 'rgba(186, 230, 253, 0.35)');
      wakeGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = wakeGrad;
      ctx.lineWidth = Math.max(1.8, tile * 0.055);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(wakeStartX, cy + side * vh * 0.34);
        ctx.quadraticCurveTo(
          sternX - dir * tile * 0.15,
          cy + side * vh * 0.54,
          wakeEndX,
          cy + side * vh * 0.86,
        );
        ctx.stroke();
      }

      // Animated stern foam rings drifting backward
      for (let k = 0; k < 4; k++) {
        const phase = (clock * 1.35 + k * 0.25 + v.x * 0.13) % 1;
        const fx = sternX - dir * phase * tile * 0.92;
        const alpha = (1 - phase) * 0.55;
        ctx.strokeStyle = `rgba(240, 249, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(1.4, tile * (0.045 - phase * 0.02));
        ctx.beginPath();
        ctx.arc(fx, cy, vh * (0.2 + phase * 0.34), dir > 0 ? Math.PI * 0.68 : -Math.PI * 0.32, dir > 0 ? Math.PI * 1.32 : Math.PI * 0.32);
        ctx.stroke();
      }
      ctx.restore();

      // Water shadow under hull
      ctx.fillStyle = 'rgba(3, 25, 42, 0.38)';
      drawRoundedRect(ctx, vx + dir * tile * 0.02, by + tile * 0.06, vw, vh, tile * 0.22);
      ctx.fill();

      const hull = v.color === 'boatB' ? '#e11d48' : '#d97706';
      const dark = v.color === 'boatB' ? '#9f1239' : '#92400e';
      ctx.fillStyle = dark;
      drawRoundedRect(ctx, vx, by + tile * 0.04, vw, vh, tile * 0.22);
      ctx.fill();
      ctx.fillStyle = hull;
      drawRoundedRect(ctx, vx, by, vw, vh * 0.9, tile * 0.22);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      drawRoundedRect(ctx, vx + vw * 0.1, by + vh * 0.14, vw * 0.8, vh * 0.62, tile * 0.14);
      ctx.fill();
      const cabX = dir > 0 ? vx + vw * 0.56 : vx + vw * 0.18;
      ctx.fillStyle = '#f8fafc';
      drawRoundedRect(ctx, cabX, by + vh * 0.22, vw * 0.26, vh * 0.46, tile * 0.08);
      ctx.fill();
      return;
    }

    // Headlight cones (stronger in night expressway!)
    const coneAlpha = sector === 3 ? 0.26 : sector === 2 ? 0.15 : 0.08;
    const frontX = dir > 0 ? vx + vw : vx;
    const rearX = dir > 0 ? vx : vx + vw;
    const coneLen = tile * (sector === 3 ? 1.55 : 1.0);
    const beamGrad = ctx.createLinearGradient(frontX, vy + vh / 2, frontX + dir * coneLen, vy + vh / 2);
    beamGrad.addColorStop(0, `rgba(255, 240, 175, ${coneAlpha})`);
    beamGrad.addColorStop(1, 'rgba(255, 240, 175, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(frontX, vy + vh * 0.18);
    ctx.lineTo(frontX + dir * coneLen, vy - vh * 0.25);
    ctx.lineTo(frontX + dir * coneLen, vy + vh * 1.25);
    ctx.lineTo(frontX, vy + vh * 0.82);
    ctx.closePath();
    ctx.fill();

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    drawRoundedRect(ctx, vx + tile * 0.03, vy + tile * 0.09, vw, vh, tile * 0.16);
    ctx.fill();

    // Vehicle body palette
    let pal;
    if (v.type === 'taxi') pal = { body: '#f7c931', roof: '#ffe47a', dark: '#b3860b' };
    else if (v.type === 'pickup') pal = { body: '#e57c35', roof: '#f7a568', dark: '#9c4c18' };
    else if (v.type === 'bus') pal = { body: '#3b9eff', roof: '#7cc2ff', dark: '#1f5da3' };
    else if (v.type === 'racer') pal = { body: '#f8fafc', roof: '#dbeafe', dark: '#94a3b8' };
    else pal = SEDAN_PALETTE[v.color] || SEDAN_PALETTE.coral;

    // 2.5D lower skirt / bumper
    ctx.fillStyle = pal.dark;
    drawRoundedRect(ctx, vx, vy + tile * 0.05, vw, vh, tile * 0.15);
    ctx.fill();

    // Main body
    ctx.fillStyle = pal.body;
    drawRoundedRect(ctx, vx, vy, vw, vh * 0.9, tile * 0.15);
    ctx.fill();

    // Roof / cab
    if (v.type === 'bus') {
      ctx.fillStyle = pal.roof;
      drawRoundedRect(ctx, vx + vw * 0.06, vy + vh * 0.1, vw * 0.88, vh * 0.68, tile * 0.1);
      ctx.fill();
      // Bus roof vents
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(vx + vw * 0.25, vy + vh * 0.24, vw * 0.16, vh * 0.4);
      ctx.fillRect(vx + vw * 0.58, vy + vh * 0.24, vw * 0.16, vh * 0.4);
    } else if (v.type === 'pickup') {
      // Cab + open cargo bed
      const bedX = dir > 0 ? vx + vw * 0.07 : vx + vw * 0.5;
      ctx.fillStyle = '#30384e';
      drawRoundedRect(ctx, bedX, vy + vh * 0.14, vw * 0.42, vh * 0.62, tile * 0.06);
      ctx.fill();
      const cabX = dir > 0 ? vx + vw * 0.52 : vx + vw * 0.14;
      ctx.fillStyle = pal.roof;
      drawRoundedRect(ctx, cabX, vy + vh * 0.12, vw * 0.32, vh * 0.66, tile * 0.08);
      ctx.fill();
    } else {
      ctx.fillStyle = pal.roof;
      drawRoundedRect(ctx, vx + vw * 0.24, vy + vh * 0.12, vw * 0.48, vh * 0.66, tile * 0.1);
      ctx.fill();
    }

    // Windshield facing travel direction
    const glassX = dir > 0 ? vx + vw * 0.66 : vx + vw * 0.18;
    ctx.fillStyle = '#18243d';
    drawRoundedRect(ctx, glassX, vy + vh * 0.15, vw * 0.16, vh * 0.6, tile * 0.05);
    ctx.fill();

    // Taxi sign or Racer flashing emergency siren!
    if (v.type === 'taxi') {
      ctx.fillStyle = '#18243d';
      ctx.fillRect(vx + vw * 0.45, vy + vh * 0.28, vw * 0.1, vh * 0.34);
    } else if (v.type === 'racer') {
      const flash = Math.floor(clock * 10) % 2 === 0;
      ctx.fillStyle = flash ? '#ff3355' : '#2e9aff';
      ctx.fillRect(vx + vw * 0.43, vy + vh * 0.18, vw * 0.14, vh * 0.26);
      ctx.fillStyle = flash ? '#2e9aff' : '#ff3355';
      ctx.fillRect(vx + vw * 0.43, vy + vh * 0.46, vw * 0.14, vh * 0.26);
    }

    // Headlights & red taillights
    const hlX = dir > 0 ? frontX - tile * 0.06 : frontX;
    ctx.fillStyle = '#fff5b8';
    ctx.fillRect(hlX, vy + vh * 0.15, tile * 0.06, vh * 0.18);
    ctx.fillRect(hlX, vy + vh * 0.58, tile * 0.06, vh * 0.18);

    const tlX = dir > 0 ? rearX : rearX - tile * 0.06;
    ctx.fillStyle = '#ff385c';
    ctx.fillRect(tlX, vy + vh * 0.16, tile * 0.055, vh * 0.18);
    ctx.fillRect(tlX, vy + vh * 0.56, tile * 0.055, vh * 0.18);
  }

  function drawFruit(fr, rowY, tile, padX) {
    if (fr.taken) return;
    const cx = padX + (fr.col + 0.5) * tile;
    const bob = Math.sin(clock * 4.2 + fr.row) * tile * 0.06;
    const cy = rowY + tile * 0.5 + bob;

    // Ground glow & shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, rowY + tile * 0.72, tile * 0.2, tile * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fr.kind === 'star' ? 'rgba(255, 217, 74, 0.25)' : 'rgba(255, 93, 143, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, tile * 0.34, 0, Math.PI * 2);
    ctx.fill();

    if (fr.kind === 'star') {
      ctx.fillStyle = '#ffd94a';
      drawStar(ctx, cx, cy, tile * 0.24, tile * 0.11);
      ctx.fill();
      ctx.fillStyle = '#fff7cc';
      drawStar(ctx, cx - tile * 0.02, cy - tile * 0.02, tile * 0.11, tile * 0.05);
      ctx.fill();
    } else if (fr.kind === 'mango') {
      ctx.fillStyle = '#ff9f43';
      ctx.beginPath();
      ctx.ellipse(cx, cy, tile * 0.2, tile * 0.24, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe07d';
      ctx.beginPath();
      ctx.ellipse(cx - tile * 0.05, cy - tile * 0.06, tile * 0.07, tile * 0.11, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#36c963';
      ctx.beginPath();
      ctx.ellipse(cx + tile * 0.07, cy - tile * 0.21, tile * 0.09, tile * 0.05, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Strawberry
      ctx.fillStyle = '#ff3d6e';
      ctx.beginPath();
      ctx.moveTo(cx, cy + tile * 0.24);
      ctx.quadraticCurveTo(cx + tile * 0.23, cy + tile * 0.04, cx + tile * 0.16, cy - tile * 0.14);
      ctx.quadraticCurveTo(cx, cy - tile * 0.22, cx - tile * 0.16, cy - tile * 0.14);
      ctx.quadraticCurveTo(cx - tile * 0.23, cy + tile * 0.04, cx, cy + tile * 0.24);
      ctx.fill();
      // Leaf cap
      ctx.fillStyle = '#4be368';
      ctx.beginPath();
      ctx.ellipse(cx, cy - tile * 0.17, tile * 0.14, tile * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Seeds
      ctx.fillStyle = '#ffe48f';
      for (const [sx, sy] of [[-0.06, -0.02], [0.06, -0.02], [0, 0.07], [-0.04, 0.12], [0.04, 0.12]]) {
        ctx.fillRect(cx + sx * tile, cy + sy * tile, tile * 0.03, tile * 0.03);
      }
    }
  }

  function drawFrogSprite(cx, cy, tile, z, dir, { alpha = 1, tint = null, eyeAlert = 0, crashed = false, win = false, wiggle = 0 } = {}) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Ground shadow stays on road plane while frog rises by z
    if (!tint) {
      const shScale = Math.max(0.45, 1 - z * 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + tile * 0.16, tile * 0.28 * shScale, tile * 0.16 * shScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const liftY = cy - z * tile * 0.58;
    const scale = 1 + z * 0.22;
    ctx.translate(cx, liftY);
    ctx.scale(scale, scale);

    const rot = dir === 'left' ? -0.45 : dir === 'right' ? 0.45 : 0;
    ctx.rotate(rot + wiggle);

    // Hind legs (kick back when airborne)
    const kick = z > 0.05 ? tile * 0.14 : 0;
    ctx.fillStyle = tint || '#2eb840';
    ctx.beginPath();
    ctx.ellipse(-tile * 0.23, tile * 0.14 + kick, tile * 0.11, tile * 0.16, 0.35, 0, Math.PI * 2);
    ctx.ellipse(tile * 0.23, tile * 0.14 + kick, tile * 0.11, tile * 0.16, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Front arms
    ctx.fillStyle = tint || '#46d654';
    ctx.beginPath();
    ctx.ellipse(-tile * 0.27, -tile * 0.04, tile * 0.08, tile * 0.12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(tile * 0.27, -tile * 0.04, tile * 0.08, tile * 0.12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Torso wearing seasonal sweater/shirt
    const shirtTheme = pickShirtTheme();
    const shirtW = tile * 0.46;
    const shirtH = tile * 0.38;
    const sx = -shirtW / 2;
    const sy = -tile * 0.08;
    if (tint) {
      ctx.fillStyle = tint;
      drawRoundedRect(ctx, sx, sy, shirtW, shirtH, tile * 0.14);
      ctx.fill();
    } else {
      ctx.save();
      drawRoundedRect(ctx, sx, sy, shirtW, shirtH, tile * 0.14);
      ctx.clip();
      ctx.fillStyle = shirtTheme.base;
      ctx.fillRect(sx, sy, shirtW, shirtH);
      ctx.fillStyle = shirtTheme.band;
      ctx.fillRect(sx, sy + shirtH * 0.36, shirtW, shirtH * 0.36);
      ctx.fillStyle = shirtTheme.trim;
      ctx.fillRect(sx, sy, shirtW, shirtH * 0.18);
      ctx.fillRect(sx, sy + shirtH * 0.84, shirtW, shirtH * 0.18);
      ctx.fillStyle = shirtTheme.accent;
      drawStar(ctx, 0, sy + shirtH * 0.54, tile * 0.07, tile * 0.032);
      ctx.fill();
      ctx.restore();
    }

    // Frog head
    ctx.fillStyle = tint || '#5de65a';
    ctx.beginPath();
    ctx.ellipse(0, -tile * 0.17, tile * 0.26, tile * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!tint) {
      // Rosy cheeks
      ctx.fillStyle = 'rgba(255, 118, 168, 0.58)';
      ctx.beginPath();
      ctx.ellipse(-tile * 0.16, -tile * 0.14, tile * 0.05, tile * 0.03, 0, 0, Math.PI * 2);
      ctx.ellipse(tile * 0.16, -tile * 0.14, tile * 0.05, tile * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big expressive eyes
      const eyeR = tile * (eyeAlert > 0 ? 0.105 : 0.09);
      for (const ex of [-tile * 0.14, tile * 0.14]) {
        const ey = -tile * 0.28;
        ctx.fillStyle = '#4be04c';
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 1.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();

        if (crashed) {
          ctx.strokeStyle = '#14192b';
          ctx.lineWidth = Math.max(1.5, tile * 0.035);
          ctx.beginPath();
          ctx.moveTo(ex - eyeR * 0.5, ey - eyeR * 0.5);
          ctx.lineTo(ex + eyeR * 0.5, ey + eyeR * 0.5);
          ctx.moveTo(ex + eyeR * 0.5, ey - eyeR * 0.5);
          ctx.lineTo(ex - eyeR * 0.5, ey + eyeR * 0.5);
          ctx.stroke();
        } else {
          const lookX = dir === 'left' ? -0.025 : dir === 'right' ? 0.025 : 0;
          const lookY = win ? 0 : -0.02;
          ctx.fillStyle = win ? '#ff8b00' : '#13192c';
          ctx.beginPath();
          ctx.arc(ex + lookX * tile, ey + lookY * tile, eyeR * 0.52, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + (lookX - 0.012) * tile, ey + (lookY - 0.015) * tile, eyeR * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  function drawSwipeIndicator(swipe, g, padX, tile, rowToScreenY) {
    if (!swipe || (!swipe.active && !(swipe.fade > 0))) return;
    if (!(swipe.forwardProgress >= 1 && swipe.dashReady)) return;
    const pulse = 0.5 + 0.5 * Math.sin(clock * 12);
    const baseAlpha = swipe.active ? 0.72 : Math.max(0, swipe.fade / 0.18) * 0.72;
    const f = g.frog;
    const fx = padX + (f.x + 0.5) * tile;
    const startY = rowToScreenY(f.y) + tile * 0.15;
    const targetRow = Math.min(g.finishRow, f.row + 2);
    const tipY = rowToScreenY(targetRow) + tile * 0.45;
    const shaftW = Math.max(16, tile * 0.36);
    const headW = Math.max(32, tile * 0.74);
    const headH = Math.min(Math.max(20, tile * 0.44), Math.max(20, (startY - tipY) * 0.42));

    const traceArrow = () => {
      ctx.beginPath();
      ctx.moveTo(fx, tipY);
      ctx.lineTo(fx + headW / 2, tipY + headH);
      ctx.lineTo(fx + shaftW / 2, tipY + headH);
      ctx.lineTo(fx + shaftW / 2, startY);
      ctx.lineTo(fx - shaftW / 2, startY);
      ctx.lineTo(fx - shaftW / 2, tipY + headH);
      ctx.lineTo(fx - headW / 2, tipY + headH);
      ctx.closePath();
    };

    ctx.save();
    // Outer pulsing glow layers (fast, no shadowBlur)
    traceArrow();
    ctx.lineJoin = 'round';
    ctx.globalAlpha = baseAlpha * (0.24 + pulse * 0.14);
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.globalAlpha = baseAlpha * (0.38 + pulse * 0.18);
    ctx.lineWidth = 7;
    ctx.stroke();

    // Translucent golden-yellow gradient fill
    ctx.globalAlpha = baseAlpha;
    const grad = ctx.createLinearGradient(fx, tipY, fx, startY);
    grad.addColorStop(0, '#fff7b2');
    grad.addColorStop(0.55, '#ffd94a');
    grad.addColorStop(1, '#ff9f1c');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertical "DASH" text along the arrow shaft with crisp shadow
    const textY = (startY + tipY + headH * 0.65) / 2;
    ctx.translate(fx, textY);
    ctx.rotate(-Math.PI / 2);
    ctx.globalAlpha = Math.min(1, baseAlpha * 1.25);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.max(12, Math.round(tile * 0.28))}px Nunito, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(14, 10, 28, 0.85)';
    ctx.fillText('DASH', 1.5, 1.5);
    ctx.fillStyle = '#fffbeb';
    ctx.fillText('DASH', 0, 0);
    ctx.restore();
  }

  function draw(g, swipe = null) {
    if (!g) return;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Background sky/road base
    const curSec = sectorOf(Math.round(g.frog.y));
    ctx.fillStyle = curSec === 3 ? '#0e111f' : curSec === 2 ? '#161b2e' : '#1b2238';
    ctx.fillRect(0, 0, w, h);

    // Grid metrics: fit 7 lanes cleanly with thin roadside margins
    const tile = Math.min(w / (COLS + 0.35), h / 8.8);
    const roadW = COLS * tile;
    const padX = (w - roadW) / 2;

    // Camera places frog ~26% up from bottom (leaving bottom area clear for overlay controls & top 70% for oncoming lanes!)
    const frogScreenY = h * 0.72;
    const rowToScreenY = row => frogScreenY - (row - camY) * tile - tile * 0.5;

    // Screen micro-shake on close call / crash
    if (shake > 0) {
      const mag = shake * 8;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Ground below row 0 (behind bottom thumb controls) so the start curb never floats over empty void
    const row0Y = rowToScreenY(0);
    if (row0Y + tile < h) {
      ctx.fillStyle = '#215431';
      ctx.fillRect(0, row0Y + tile, w, h - (row0Y + tile));
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, row0Y + tile, w, tile * 0.16);
    }

    // Draw visible lanes (bottom-up)
    const minVisible = Math.max(0, Math.floor(camY - 4));
    const maxVisible = Math.min(g.finishRow, Math.ceil(camY + h / tile + 2));

    for (let r = minVisible; r <= maxVisible; r++) {
      const lane = g.lanes[r];
      if (!lane) continue;
      drawLane(lane, rowToScreenY(r), tile, padX);
    }

    // Draw fruits on visible lanes
    for (const fr of g.fruits) {
      if (fr.taken || fr.row < minVisible || fr.row > maxVisible) continue;
      drawFruit(fr, rowToScreenY(fr.row), tile, padX);
    }

    // Draw vehicles & boats
    for (let r = minVisible; r <= maxVisible; r++) {
      const lane = g.lanes[r];
      if (!lane || (lane.kind !== 'road' && lane.kind !== 'water')) continue;
      const ry = rowToScreenY(r);
      for (const v of lane.vehicles) {
        drawVehicle(v, lane.dir, lane.sector, ry, tile, padX);
      }
    }

    // Draw dash ghost afterimages
    for (const gh of ghosts) {
      const gx = padX + (gh.x + 0.5) * tile;
      const gy = rowToScreenY(gh.y) + tile * 0.5;
      drawFrogSprite(gx, gy, tile, gh.z, gh.dir, {
        alpha: (gh.life / gh.maxLife) * 0.45,
        tint: '#2ee6d6',
      });
    }

    // Draw the frog!
    const f = g.frog;
    const shakeX = hitShake > 0 ? Math.sin(clock * 65) * tile * 0.14 * (hitShake / 0.45) : 0;
    const fx = padX + (f.x + 0.5) * tile + shakeX;
    const fy = rowToScreenY(f.y) + tile * 0.5;
    let frogAlpha = 1;
    if (g.shield > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(clock * 14);
      frogAlpha = 0.36 + pulse * 0.34;
      ctx.save();
      ctx.strokeStyle = `rgba(165, 243, 252, ${0.28 + pulse * 0.48})`;
      ctx.lineWidth = Math.max(2, tile * 0.06);
      ctx.beginPath();
      ctx.arc(fx, fy - f.z * tile * 0.58, tile * (0.42 + pulse * 0.08), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // The victory dance: three little hops with a side-to-side wiggle, then it settles (none with reduced motion).
    const dancing = g.mode === 'win' && danceT < DANCE_S && !QUIET();
    const danceZ = dancing ? Math.abs(Math.sin(danceT * Math.PI * 3 / DANCE_S)) * 0.4 : 0;
    const wiggle = dancing ? Math.sin(danceT * 14) * 0.3 : 0;
    drawFrogSprite(fx, fy, tile, Math.max(f.z, danceZ), dancing ? 'up' : f.dir, {
      wiggle,
      alpha: frogAlpha,
      eyeAlert: f.eyeAlert,
      crashed: g.mode === 'crash',
      win: g.mode === 'win',
    });

    // Particles
    for (const p of particles) {
      const px = padX + p.x * tile;
      const py = rowToScreenY(p.y - 0.5) + tile * 0.5;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.r * tile, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating score popups
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(tile * 0.3)}px Nunito, system-ui, sans-serif`;
    for (const p of popups) {
      const px = padX + p.x * tile;
      const py = rowToScreenY(p.y - 0.5) + tile * 0.5;
      const alpha = Math.min(1, (p.life / p.maxLife) * 1.4);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(10, 6, 20, 0.78)';
      ctx.fillText(p.text, px + 1.5, py + 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, px, py);
    }
    ctx.globalAlpha = 1;

    drawSwipeIndicator(swipe, g, padX, tile, rowToScreenY);
    ctx.restore();
  }

  return { measure, clear, fx, tick, draw };
}
