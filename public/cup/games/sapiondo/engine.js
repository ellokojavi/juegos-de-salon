/**
 * Sapiondo in La Copa: pure, deterministic highway-crossing engine (no DOM).
 * Uses hash32(code:day) so every player in the same Cup gets the exact same traffic & fruits.
 */
import { hash32 } from '../semilla.js';

export const COLS = 7;
export const FINISH_ROW = 33;
export const STEP = 1 / 120;

export const WRAP_PAD = 3.2;
export const TRACK_W = COLS + WRAP_PAD * 2;
export const DIFFICULTIES = {
  normal: { speedScale: 0.84, minGap: 2.65, maxOcc: 0.40, maxExtraCars: 0 },
  hard: { speedScale: 0.95, minGap: 2.15, maxOcc: 0.48, maxExtraCars: 1 },
};
export const HOP_DUR = 0.105;
export const DASH_DUR = 0.145;

export const PTS_LANE = 1;
export const PTS_FRUIT = 1;
export const PTS_FINISH = 10;
export const LIVES = 3;
export const MAX_DASHES = 3;
export const SHIELD_DUR = 1.5;

export function createRng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sectorOf(row) {
  if (row >= 22) return 3;
  if (row >= 11) return 2;
  return 1;
}

const VEHICLE_SPECS = {
  sedan: { len: 1.22, kind: 'sedan' },
  taxi: { len: 1.22, kind: 'taxi' },
  pickup: { len: 1.48, kind: 'pickup' },
  bus: { len: 2.35, kind: 'bus' },
  racer: { len: 1.32, kind: 'racer' },
};

const SEDAN_COLORS = ['coral', 'teal', 'indigo', 'lime'];

export function wrapX(x) {
  const min = -WRAP_PAD;
  const max = COLS + WRAP_PAD;
  const span = max - min;
  return ((((x - min) % span) + span) % span) + min;
}

function buildMedianProps(rand) {
  const props = [];
  for (let c = 0; c < COLS; c++) {
    if (c === 3) continue;
    if (rand() < 0.28) props.push({ col: c, kind: rand() < 0.55 ? 'shrub' : 'cone' });
  }
  return props;
}

function buildWaterLane(row, rand, prevDir, diffCfg) {
  const dir = prevDir ? -prevDir : (rand() < 0.5 ? 1 : -1);
  const speed = (1.1 + rand() * 0.45) * diffCfg.speedScale;
  const count = 3;
  const boatLen = 2.05;
  const gap = TRACK_W / count;
  const start = -WRAP_PAD + rand() * 1.5;
  const vehicles = [];
  for (let i = 0; i < count; i++) {
    vehicles.push({
      id: `${row}-b${i}`,
      type: 'boat',
      len: boatLen,
      color: i % 2 === 0 ? 'boatA' : 'boatB',
      x: wrapX(start + i * gap),
      grazed: false,
    });
  }
  return { row, kind: 'water', sector: 3, dir, speed, vehicles, props: [] };
}

function buildLane(row, finishRow, rand, prevDir, diffCfg) {
  if (row === 0) return { row, kind: 'safe', sector: 1, dir: 0, speed: 0, vehicles: [], props: [] };
  if (row === 11) return { row, kind: 'median', sector: 2, dir: 0, speed: 0, vehicles: [], props: buildMedianProps(rand) };
  if (row === 21) return { row, kind: 'median', sector: 3, dir: 0, speed: 0, vehicles: [], props: buildMedianProps(rand) };
  if (row === 22) return buildWaterLane(row, rand, prevDir, diffCfg);
  if (row >= finishRow) return { row, kind: 'finish', sector: 3, dir: 0, speed: 0, vehicles: [], props: [] };

  const sector = sectorOf(row);
  const dir = prevDir ? (rand() < 0.78 ? -prevDir : prevDir) : (rand() < 0.5 ? 1 : -1);

  let pool;
  let baseSpeed;
  let count;
  if (sector === 1) {
    pool = ['sedan', 'taxi', 'pickup'];
    baseSpeed = 1.25 + rand() * 0.95;
    count = (rand() < 0.3 ? 3 : 2) + diffCfg.maxExtraCars;
  } else if (sector === 2) {
    pool = ['sedan', 'taxi', 'pickup', 'bus'];
    baseSpeed = 1.65 + rand() * 1.15;
    count = (rand() < 0.4 ? 3 : 2) + diffCfg.maxExtraCars;
  } else {
    pool = ['sedan', 'pickup', 'bus', 'racer', 'racer'];
    baseSpeed = 2.05 + rand() * 1.45;
    count = (rand() < 0.5 ? 3 : 2) + diffCfg.maxExtraCars;
  }
  baseSpeed *= diffCfg.speedScale;

  const vehicles = [];
  const chosen = [];
  let totalLen = 0;
  for (let i = 0; i < count; i++) {
    let type = pool[Math.floor(rand() * pool.length)];
    if (type === 'bus' && chosen.includes('bus')) type = 'sedan';
    const spec = VEHICLE_SPECS[type];
    if (totalLen + spec.len > TRACK_W * diffCfg.maxOcc) break;
    chosen.push(type);
    totalLen += spec.len;
  }
  if (chosen.length === 0) {
    chosen.push('sedan');
    totalLen = VEHICLE_SPECS.sedan.len;
  }

  const free = Math.max(diffCfg.minGap * chosen.length, TRACK_W - totalLen);
  const weights = chosen.map(() => 0.65 + rand() * 0.7);
  const wSum = weights.reduce((a, b) => a + b, 0);
  let cursor = -WRAP_PAD + rand() * 2.5;
  const speed = chosen.includes('racer') ? baseSpeed * 1.15 : baseSpeed;

  for (let i = 0; i < chosen.length; i++) {
    const type = chosen[i];
    const spec = VEHICLE_SPECS[type];
    const gap = Math.max(diffCfg.minGap, (free * weights[i]) / wSum);
    vehicles.push({
      id: `${row}-${i}`,
      type,
      len: spec.len,
      color: type === 'sedan' ? SEDAN_COLORS[Math.floor(rand() * SEDAN_COLORS.length)] : type,
      x: wrapX(cursor),
      grazed: false,
    });
    cursor += spec.len + gap;
  }

  return { row, kind: 'road', sector, dir, speed, vehicles, props: [] };
}

function buildFruits(lanes, rand) {
  const fruits = [];
  for (const lane of lanes) {
    if (lane.kind !== 'road') continue;
    const chance = lane.sector === 1 ? 0.34 : lane.sector === 2 ? 0.42 : 0.48;
    if (rand() > chance) continue;
    const colPool = [1, 2, 4, 5, 0, 6];
    const col = colPool[Math.floor(rand() * colPool.length)];
    let kind = 'strawberry';
    const roll = rand();
    if (lane.sector === 3 && roll < 0.55) kind = 'star';
    else if (lane.sector >= 2 && roll < 0.5) kind = 'mango';
    else if (roll < 0.2) kind = 'mango';
    fruits.push({ id: `f-${lane.row}-${col}`, row: lane.row, col, kind, pts: PTS_FRUIT, taken: false });
  }
  return fruits;
}

export function newGame({ seed = 4821, finishRow = FINISH_ROW, difficulty = 'normal', lives = LIVES, dashes = MAX_DASHES, mode = 'ready' } = {}) {
  const diffKey = difficulty === 'hard' ? 'hard' : 'normal';
  const diffCfg = DIFFICULTIES[diffKey];
  const cleanSeed = Math.max(1, Math.floor(Number(seed) || 4821));
  const rand = createRng(cleanSeed);
  const lanes = [];
  let prevDir = 0;
  for (let r = 0; r <= finishRow; r++) {
    const lane = buildLane(r, finishRow, rand, prevDir, diffCfg);
    if (lane.dir) prevDir = lane.dir;
    lanes.push(lane);
  }
  const fruits = buildFruits(lanes, rand);

  return {
    seed: cleanSeed,
    difficulty: diffKey,
    mode,
    finishRow,
    elapsed: 0,
    lanes,
    fruits,
    frog: {
      col: 3, row: 0, fromCol: 3, fromRow: 0, toCol: 3, toRow: 0,
      x: 3, y: 0, z: 0, hopT: 0, hopDur: HOP_DUR, isDash: false, dir: 'up', eyeAlert: 0,
    },
    queued: null,
    dashes,
    maxDashes: dashes,
    lives,
    maxLives: lives,
    shield: 0,
    maxRow: 0,
    distanceScore: 0,
    bonusScore: 0,
    lifePenalty: 0,
    timeBonus: 0,
    score: 0,
    fruitsTaken: 0,
    closeCalls: 0,
    dashesUsed: 0,
    demoTimer: 0.35,
    events: [],
  };
}

function recomputeScore(g) {
  g.distanceScore = g.maxRow * PTS_LANE + (g.mode === 'win' ? PTS_FINISH : 0);
  g.bonusScore = g.fruitsTaken * PTS_FRUIT;
  g.lifePenalty = Math.max(0, (g.maxLives || LIVES) - (g.lives | 0));
  g.timeBonus = 0;
  g.score = Math.max(0, g.distanceScore + g.bonusScore - g.lifePenalty);
}

function startHop(g, action) {
  const f = g.frog;
  let toCol = f.col;
  let toRow = f.row;
  let isDash = false;
  let dir = f.dir;

  if (action === 'left') {
    if (f.col <= 0) return false;
    toCol = f.col - 1;
    dir = 'left';
  } else if (action === 'right') {
    if (f.col >= COLS - 1) return false;
    toCol = f.col + 1;
    dir = 'right';
  } else if (action === 'up') {
    if (f.row >= g.finishRow) return false;
    toRow = f.row + 1;
    dir = 'up';
  } else if (action === 'dash') {
    if (g.dashes <= 0 || f.row >= g.finishRow) return false;
    toRow = Math.min(g.finishRow, f.row + 2);
    dir = 'up';
    isDash = true;
    g.dashes--;
    g.dashesUsed++;
  } else {
    return false;
  }

  f.fromCol = f.col;
  f.fromRow = f.row;
  f.toCol = toCol;
  f.toRow = toRow;
  f.hopT = 0;
  f.hopDur = isDash ? DASH_DUR : HOP_DUR;
  f.isDash = isDash;
  f.dir = dir;
  g.events.push({ type: isDash ? 'dash' : 'hop', dir, col: toCol, row: toRow });
  return true;
}

export function act(g, action) {
  if (!g || g.mode === 'win' || g.mode === 'crash') return false;
  if (g.mode === 'ready') g.mode = 'play';
  const f = g.frog;
  const hopping = f.hopT < f.hopDur && (f.fromCol !== f.toCol || f.fromRow !== f.toRow);
  if (hopping) {
    if (f.hopT / f.hopDur >= 0.25) g.queued = action;
    return true;
  }
  return startHop(g, action);
}

function triggerCloseCall(g, col, row, aerial = false) {
  g.closeCalls++;
  if (!aerial && g.dashes < (g.maxDashes || MAX_DASHES)) g.dashes++;
  g.frog.eyeAlert = 0.6;
  g.events.push({ type: 'closeCall', col, row, aerial });
}

function checkCollectFruit(g, row, col) {
  for (const fr of g.fruits) {
    if (fr.taken || fr.row !== row || fr.col !== col) continue;
    fr.taken = true;
    g.fruitsTaken++;
    if (g.dashes < (g.maxDashes || MAX_DASHES)) g.dashes++;
    recomputeScore(g);
    g.events.push({ type: 'fruit', kind: fr.kind, col, row, pts: PTS_FRUIT });
  }
}

function finishHop(g) {
  const f = g.frog;
  const midRow = f.fromRow + 1;
  const wasDash = f.isDash;
  f.col = f.toCol;
  f.row = f.toRow;
  f.fromCol = f.col;
  f.fromRow = f.row;
  f.x = f.col;
  f.y = f.row;
  f.z = 0;
  f.hopT = 0;
  f.isDash = false;

  if (f.row > g.maxRow) {
    g.maxRow = f.row;
    recomputeScore(g);
  }

  checkCollectFruit(g, f.row, f.col);

  if (wasDash && f.toRow - midRow >= 1 && g.shield <= 0) {
    const midLane = g.lanes[midRow];
    if (midLane && midLane.kind === 'road') {
      const fx = f.col + 0.5;
      const cleared = midLane.vehicles.some(v => fx >= v.x - 0.3 && fx <= v.x + v.len + 0.3);
      if (cleared) triggerCloseCall(g, f.col, midRow, true);
    }
  }

  if (f.row >= g.finishRow) {
    if (g.mode === 'demo') {
      Object.assign(g, newGame({ seed: g.seed + 1, finishRow: g.finishRow, mode: 'demo' }));
      return;
    }
    g.mode = 'win';
    recomputeScore(g);
    g.events.push({ type: 'win', score: g.score, elapsed: g.elapsed });
    return;
  }

  if (g.queued) {
    const next = g.queued;
    g.queued = null;
    startHop(g, next);
  }
}

function boatUnderFrog(lane, fx) {
  return lane.vehicles.some(b => fx >= b.x - 0.14 && fx <= b.x + b.len + 0.14);
}

function splashWater(g, laneIdx) {
  const f = g.frog;
  if (g.mode === 'demo') {
    Object.assign(g, newGame({ seed: g.seed + 1, finishRow: g.finishRow, mode: 'demo' }));
    return;
  }
  g.lives = Math.max(0, (g.lives | 0) - 1);
  if (g.lives > 0) {
    g.shield = SHIELD_DUR;
    recomputeScore(g);
    const shoreRow = Math.max(0, laneIdx - 1);
    const shoreCol = Math.max(0, Math.min(COLS - 1, Math.round(f.x)));
    f.col = shoreCol; f.row = shoreRow;
    f.fromCol = shoreCol; f.fromRow = shoreRow;
    f.toCol = shoreCol; f.toRow = shoreRow;
    f.x = shoreCol; f.y = shoreRow; f.z = 0; f.hopT = 0; f.isDash = false;
    g.queued = null;
    g.events.push({ type: 'hit', col: shoreCol, row: laneIdx, lives: g.lives, vehicle: 'water' });
    return;
  }
  g.mode = 'crash';
  g.queued = null;
  recomputeScore(g);
  g.events.push({ type: 'crash', col: f.x, row: laneIdx, vehicle: 'water' });
}

function checkTraffic(g) {
  const f = g.frog;
  if (f.isDash && f.z > 0.5) return;
  const hopping = f.fromCol !== f.toCol || f.fromRow !== f.toRow;
  const laneIdx = Math.round(f.y);
  const lane = g.lanes[laneIdx];
  if (!lane) return;
  if (lane.kind === 'water') {
    if (hopping) return;
    if (f.x < -0.35 || f.x > COLS - 0.65 || !boatUnderFrog(lane, f.x + 0.5)) splashWater(g, laneIdx);
    return;
  }
  if (g.shield > 0 || lane.kind !== 'road') return;

  const frogCenter = f.x + 0.5;
  const frogHalf = 0.23;

  for (const v of lane.vehicles) {
    const vLeft = v.x + 0.08;
    const vRight = v.x + v.len - 0.08;
    const fLeft = frogCenter - frogHalf;
    const fRight = frogCenter + frogHalf;

    if (fRight > vLeft && fLeft < vRight) {
      if (g.mode === 'demo') {
        Object.assign(g, newGame({ seed: g.seed + 1, finishRow: g.finishRow, mode: 'demo' }));
        return;
      }
      g.lives = Math.max(0, (g.lives | 0) - 1);
      if (g.lives > 0) {
        g.shield = SHIELD_DUR;
        recomputeScore(g);
        g.events.push({ type: 'hit', col: f.x, row: laneIdx, lives: g.lives, vehicle: v.type });
        return;
      }
      g.mode = 'crash';
      g.queued = null;
      recomputeScore(g);
      g.events.push({ type: 'crash', col: f.x, row: laneIdx, vehicle: v.type });
      return;
    }

    const minGap = Math.max(vLeft - fRight, fLeft - vRight);
    if (minGap > 0 && minGap <= 0.42) {
      if (!v.grazed && g.mode === 'play') {
        v.grazed = true;
        triggerCloseCall(g, f.x, laneIdx, false);
      }
    } else if (minGap > 1.2) {
      v.grazed = false;
    }
  }
}

function laneClearAt(lane, col, lookAheadSec = 0.16) {
  if (!lane) return true;
  if (lane.kind === 'water') return boatUnderFrog(lane, col + 0.5 + lane.dir * lane.speed * lookAheadSec * 0.5);
  if (lane.kind !== 'road') return true;
  const fx = col + 0.5;
  for (const v of lane.vehicles) {
    const nx = wrapX(v.x + lane.dir * lane.speed * lookAheadSec);
    if (fx + 0.35 > v.x && fx - 0.35 < v.x + v.len) return false;
    if (fx + 0.35 > nx && fx - 0.35 < nx + v.len) return false;
  }
  return true;
}

export function autopilot(g, dt) {
  if (g.mode !== 'demo') return;
  g.demoTimer -= dt;
  const f = g.frog;
  if (f.fromCol !== f.toCol || f.fromRow !== f.toRow || g.demoTimer > 0) return;

  const nextLane = g.lanes[f.row + 1];
  const afterLane = g.lanes[f.row + 2];
  if (laneClearAt(nextLane, f.col, 0.25)) { startHop(g, 'up'); g.demoTimer = 0.22; return; }
  if (g.dashes > 0 && laneClearAt(afterLane, f.col, 0.25)) { startHop(g, 'dash'); g.demoTimer = 0.28; return; }
  const curLane = g.lanes[f.row];
  if (f.col < COLS - 1 && laneClearAt(curLane, f.col + 1, 0.2) && laneClearAt(nextLane, f.col + 1, 0.25)) startHop(g, 'right');
  else if (f.col > 0 && laneClearAt(curLane, f.col - 1, 0.2) && laneClearAt(nextLane, f.col - 1, 0.25)) startHop(g, 'left');
  g.demoTimer = 0.24;
}

export function step(g, dt) {
  if (!g || g.mode === 'win' || g.mode === 'crash') return;

  if (g.mode === 'play') {
    g.elapsed += dt;
    if (g.shield > 0) g.shield = Math.max(0, g.shield - dt);
  } else if (g.mode === 'demo') {
    autopilot(g, dt);
  }

  for (const lane of g.lanes) {
    if (lane.kind !== 'road' && lane.kind !== 'water') continue;
    const dx = lane.dir * lane.speed * dt;
    for (const v of lane.vehicles) v.x = wrapX(v.x + dx);
  }

  const f = g.frog;
  if (f.eyeAlert > 0) f.eyeAlert = Math.max(0, f.eyeAlert - dt);
  const hopping = f.fromCol !== f.toCol || f.fromRow !== f.toRow;
  if (hopping) {
    f.hopT += dt;
    const p = Math.min(1, f.hopT / f.hopDur);
    const ease = 1 - Math.pow(1 - p, 2);
    f.x = f.fromCol + (f.toCol - f.fromCol) * ease;
    f.y = f.fromRow + (f.toRow - f.fromRow) * ease;
    f.z = Math.sin(p * Math.PI) * (f.isDash ? 1.0 : 0.45);
    if (p >= 1) finishHop(g);
  } else if (g.lanes[f.row]?.kind === 'water' && boatUnderFrog(g.lanes[f.row], f.x + 0.5)) {
    const wLane = g.lanes[f.row];
    f.x += wLane.dir * wLane.speed * dt;
    f.col = Math.max(0, Math.min(COLS - 1, Math.round(f.x)));
    f.fromCol = f.col;
    f.toCol = f.col;
  }

  if (g.mode === 'play' || g.mode === 'demo') checkTraffic(g);
}

/* ------------------------------------------------------------------ */
/* La Copa                                                             */
/* ------------------------------------------------------------------ */

export function generateDay(code, day, { sal = '', ensayo = false } = {}) {
  return {
    semilla: hash32(`${code}:${day}${sal ? `:${sal}` : ''}`),
    finishRow: ensayo ? 15 : FINISH_ROW,
  };
}

export const score = e => Math.max(0, Math.round(Number(e?.score) || 0));

export function card(e) {
  const rows = Math.max(0, e?.maxRow | 0);
  const total = Math.max(1, e?.finishRow | 0);
  const fruits = Math.max(0, e?.fruitsTaken | 0);
  const close = Math.max(0, e?.closeCalls | 0);
  const end = e?.won ? '🏁' : '💥';
  return `🐸 ${rows}/${total} · 🍓${fruits} ⚡${close} ${end}`;
}

export const DAY_K = 35;
export const dayScore = s => Math.max(0, Math.min(100, Math.round(100 * (1 - Math.exp(-(Number(s) || 0) / DAY_K)))));
