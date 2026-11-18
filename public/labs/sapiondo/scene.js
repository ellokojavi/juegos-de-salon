/**
 * Sapiondo: 2.5D top-down HTML5 Canvas renderer.
 * No shadowBlur (kept fast on 3x phones; DPR capped at 2x).
 */
import { COLS, FINISH_ROW, sectorOf } from './engine.js';

const SEDAN_PALETTE = {
  coral: { body: '#ff5d6c', roof: '#ff8a95', dark: '#b82c3a' },
  teal: { body: '#27d6c7', roof: '#6ff2e6', dark: '#14847b' },
  indigo: { body: '#6b7cff', roof: '#9ba7ff', dark: '#3e4ab8' },
  lime: { body: '#7be04a', roof: '#a7f082', dark: '#459421' },
};

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

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 360;
  let h = 640;
  let dpr = 1;
  let camY = 0;
  let clock = 0;
  let shake = 0;
  let hitShake = 0;
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

  function drawLane(lane, rowY, tile, padX) {
    const x0 = padX;
    const roadW = COLS * tile;

    if (lane.kind === 'safe' || lane.kind === 'median') {
      // Grassy / paved median with subtle 2.5D curb bevel
      const isMedian = lane.kind === 'median';
      ctx.fillStyle = isMedian ? (lane.sector === 3 ? '#2c3654' : '#325a48') : '#2c6b3f';
      ctx.fillRect(0, rowY, w, tile);
      // Top highlight & bottom curb edge
      ctx.fillStyle = isMedian ? 'rgba(255,255,255,0.08)' : 'rgba(130, 235, 145, 0.14)';
      ctx.fillRect(0, rowY, w, tile * 0.12);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, rowY + tile * 0.86, w, tile * 0.14);

      // Decorative crosswalk stripes or median markers
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let c = 0; c < COLS; c++) {
        if (isMedian) {
          ctx.fillRect(x0 + (c + 0.25) * tile, rowY + tile * 0.42, tile * 0.5, tile * 0.14);
        }
      }
      // Props (shrubs / cones)
      for (const p of lane.props) {
        const px = x0 + (p.col + 0.5) * tile;
        const py = rowY + tile * 0.5;
        if (p.kind === 'shrub') {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath();
          ctx.ellipse(px, py + tile * 0.1, tile * 0.26, tile * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3cb857';
          ctx.beginPath();
          ctx.arc(px, py - tile * 0.04, tile * 0.23, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#6fe377';
          ctx.beginPath();
          ctx.arc(px - tile * 0.06, py - tile * 0.1, tile * 0.11, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#ff7b29';
          ctx.beginPath();
          ctx.moveTo(px, py - tile * 0.22);
          ctx.lineTo(px + tile * 0.15, py + tile * 0.14);
          ctx.lineTo(px - tile * 0.15, py + tile * 0.14);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - tile * 0.08, py - tile * 0.04, tile * 0.16, tile * 0.06);
        }
      }
      return;
    }

    if (lane.kind === 'water') {
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, rowY, w, tile);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, rowY + tile * 0.08, w, tile * 0.84);
      // Animated water shimmer ripples
      ctx.fillStyle = 'rgba(224, 242, 254, 0.28)';
      const drift = (clock * lane.dir * lane.speed * tile * 0.45) % tile;
      for (let rx = -tile; rx < w + tile; rx += tile * 1.1) {
        ctx.fillRect(rx + drift, rowY + tile * 0.28, tile * 0.42, tile * 0.07);
        ctx.fillRect(rx - drift * 0.6 + tile * 0.4, rowY + tile * 0.66, tile * 0.36, tile * 0.07);
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, rowY, w, tile * 0.08);
      ctx.fillRect(0, rowY + tile * 0.92, w, tile * 0.08);
      return;
    }

    if (lane.kind === 'finish') {
      // Andean Park & Shimmering Lily Pond
      ctx.fillStyle = '#1f7045';
      ctx.fillRect(0, rowY - tile * 2, w, tile * 3);
      ctx.fillStyle = '#147a94';
      drawRoundedRect(ctx, x0 + tile * 0.15, rowY - tile * 0.7, roadW - tile * 0.3, tile * 1.55, tile * 0.45);
      ctx.fill();
      ctx.fillStyle = 'rgba(46, 230, 214, 0.22)';
      drawRoundedRect(ctx, x0 + tile * 0.35, rowY - tile * 0.5, roadW - tile * 0.7, tile * 1.1, tile * 0.35);
      ctx.fill();
      // Lily pads
      for (const c of [1, 3, 5]) {
        const lx = x0 + (c + 0.5) * tile;
        const ly = rowY + tile * 0.35 + Math.sin(clock * 2 + c) * tile * 0.04;
        ctx.fillStyle = '#36c963';
        ctx.beginPath();
        ctx.arc(lx, ly, tile * 0.27, 0.25, Math.PI * 2 - 0.25);
        ctx.lineTo(lx, ly);
        ctx.closePath();
        ctx.fill();
      }
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
      const wakeX = dir > 0 ? vx - tile * 0.28 : vx + vw;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.35)';
      ctx.fillRect(wakeX, vy + vh * 0.28, tile * 0.28, vh * 0.14);
      ctx.fillRect(wakeX, vy + vh * 0.58, tile * 0.22, vh * 0.14);

      const hull = v.color === 'boatB' ? '#e11d48' : '#d97706';
      const dark = v.color === 'boatB' ? '#9f1239' : '#92400e';
      ctx.fillStyle = dark;
      drawRoundedRect(ctx, vx, vy + tile * 0.04, vw, vh, tile * 0.22);
      ctx.fill();
      ctx.fillStyle = hull;
      drawRoundedRect(ctx, vx, vy, vw, vh * 0.9, tile * 0.22);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      drawRoundedRect(ctx, vx + vw * 0.1, vy + vh * 0.14, vw * 0.8, vh * 0.62, tile * 0.14);
      ctx.fill();
      const cabX = dir > 0 ? vx + vw * 0.56 : vx + vw * 0.18;
      ctx.fillStyle = '#f8fafc';
      drawRoundedRect(ctx, cabX, vy + vh * 0.22, vw * 0.26, vh * 0.46, tile * 0.08);
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

  function drawFrogSprite(cx, cy, tile, z, dir, { alpha = 1, tint = null, eyeAlert = 0, crashed = false, win = false } = {}) {
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
    ctx.rotate(rot);

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

    // Draw vehicles
    for (let r = minVisible; r <= maxVisible; r++) {
      const lane = g.lanes[r];
      if (!lane || lane.kind !== 'road') continue;
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

    // Draw Sapiondo!
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
    drawFrogSprite(fx, fy, tile, f.z, f.dir, {
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
