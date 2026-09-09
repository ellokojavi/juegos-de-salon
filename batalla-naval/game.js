/**
 * Batalla Naval — lógica de juego.
 * Misma arquitectura que Toque y Fama (D-20): un reductor de mensajes para todos los modos.
 *  - local: ambos jugadores en este celular · cpu: B es un bot (Hunter) · online: fase 2 (pendiente)
 * Cada dispositivo responde los disparos contra SU flota.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock, showCover } from '../assets/js/handoff.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { N, COLS, FLEET, SHIP_SIZE, cellName, parseCell, isCell, cellsOf, isValidPlacement, isValidLayout, randomLayout, occupancy, layoutKey, shoot, allSunk, Hunter, nextShooter, sha256, randomNonce, verifyPlayer } from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, LOCALES } from './rules.js';

const lang = getLang();
const T = LOCALES[lang];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const other = r => (r === 'A' ? 'B' : 'A');
const NAME_KEY = 'juegos-de-salon:bn:name';
const SESSION_KEY = 'juegos-de-salon:bn:session';
const SHIP_EMOJI = '🚢';

let S = null;   // sesión
let M = null;   // partida

/* ------------------------------------------------------------------ */
/* Estado de la partida                                                */
/* ------------------------------------------------------------------ */
function newMatch(config) {
  return { config, names: {}, commits: {}, starter: config.starter === 'A' ? 'A' : 'B', shots: [], reveals: {}, rematch: {}, verify: {}, seen: new Set() };
}

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return; if (msg.id) M.seen.add(msg.id);
  const from = msg.from;
  switch (msg.t) {
    case 'hello': M.names[from] = msg.name; break;
    case 'commit': if (!M.commits[from]) M.commits[from] = { hash: msg.hash }; break;
    case 'shot': {
      const v = view();
      if (v.phase !== 'play' || v.pending || v.shooter !== from || !isCell(msg.cell)) return;
      if (M.shots.some(s => s.from === from && s.cell === msg.cell)) return;
      M.shots.push({ from, n: M.shots.length, cell: msg.cell, result: null, ship: null, cells: null });
      break;
    }
    case 'reply': {
      const s = M.shots[msg.n];
      if (!s || s.result !== null || s.from === from) return;
      s.result = msg.result; s.ship = msg.ship || null; s.cells = msg.cells || null;
      if (S.bot && s.from === S.bot.role) S.bot.hunter.learn(s.cell, { result: s.result, ship: s.ship, cells: s.cells });
      break;
    }
    case 'reveal': if (!M.reveals[from]) M.reveals[from] = { layout: msg.layout, salt: msg.salt }; break;
    case 'rematch': if (!M.rematch[from]) M.rematch[from] = msg.code || true; break;
  }
}

/** Disparos respondidos hechos por `from`. */
const repliesBy = from => M.shots.filter(s => s.from === from && s.result !== null);

function view() {
  const both = M.names.A && M.names.B;
  const committed = M.commits.A && M.commits.B;
  const pending = M.shots.find(s => s.result === null) || null;
  let shooter = M.starter;
  for (const s of M.shots) { if (s.result === null) break; shooter = nextShooter(s.from, s.result, M.config.extraShot); }
  let winner = null;
  if (allSunk(repliesBy('A'))) winner = 'A';
  else if (allSunk(repliesBy('B'))) winner = 'B';
  const done = !!winner;
  let phase;
  if (!both) phase = 'lobby';
  else if (!committed) phase = 'placing';
  else if (!done) phase = 'play';
  else if (!(M.reveals.A && M.reveals.B)) phase = 'reveal';
  else phase = 'done';
  const last = M.shots.length ? M.shots[M.shots.length - 1] : null;
  return { phase, pending, shooter, done, winner, last };
}

/* ------------------------------------------------------------------ */
/* Sesión y agentes                                                    */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, bot = null, code = null, role = null }) {
  if (S?.transport) S.transport.leave();
  S = { mode, transport, roles, layouts: {}, draft: {}, bot, code, role, repliedShots: new Set(), lastShownShot: -1, cpuTimer: null, uiRole: null, aim: null, fleetShown: false };
  M = newMatch(config);
  M.presence = {};
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { apply(m); onChange(); });
  transport.onPresence(p => { M.presence = p; renderPresence(); });
}

/* ---------- Persistencia (solo dos celulares) ---------- */
function saveSession() {
  if (!S || S.mode !== 'online') return;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ code: S.code, role: S.role, name: M.names[S.role], config: M.config, layout: S.layouts[S.role] || null, done: view().phase === 'done' })); } catch (_) { /* nada */ }
}
function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; } }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (_) { /* nada */ } }

let chain = Promise.resolve();
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

async function act() {
  const v = view();
  for (const r of S.roles) {
    const lay = S.layouts[r];
    if (!lay) continue;
    if (v.phase === 'placing' && !M.commits[r]) S.transport.send({ t: 'commit', from: r, hash: lay.hash });
    if (v.phase === 'play' && v.pending && v.pending.from !== r && !S.repliedShots.has(v.pending.n)) {
      S.repliedShots.add(v.pending.n);
      const prev = M.shots.filter(s => s.from === v.pending.from && s.n < v.pending.n).map(s => s.cell);
      const res = shoot(lay.layout, prev, v.pending.cell);
      S.transport.send({ t: 'reply', from: r, n: v.pending.n, result: res.result, ship: res.ship || null, cells: res.cells || null });
    }
    if (v.phase === 'reveal' && !M.reveals[r]) S.transport.send({ t: 'reveal', from: r, layout: lay.layout, salt: lay.salt });
  }
  if (S.bot) {
    const b = S.bot.role;
    if (v.phase === 'placing' && !S.layouts[b]) await setLayout(b, randomLayout());
    if (v.phase === 'play' && v.shooter === b && !v.pending && !S.cpuTimer) {
      S.cpuTimer = setTimeout(() => { S.cpuTimer = null; S.transport.send({ t: 'shot', from: b, cell: S.bot.hunter.next() }); }, 1300);
    }
  }
  if (v.phase === 'done' && !M.verify.A) await verifyAll();
  saveSession();
}

async function setLayout(role, layout) {
  const salt = randomNonce(16);
  const hash = await sha256(layoutKey(layout) + salt);
  S.layouts[role] = { layout, salt, hash };
  saveSession();
  onChange();
}

async function verifyAll() {
  for (const r of ['A', 'B']) {
    const rv = M.reveals[r];
    const repliesGiven = repliesBy(other(r)).map(s => ({ cell: s.cell, result: s.result, ship: s.ship }));
    M.verify[r] = await verifyPlayer({ layout: rv.layout, salt: rv.salt, commit: M.commits[r].hash, repliesGiven });
  }
}

/* ------------------------------------------------------------------ */
/* Componentes                                                         */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

/** Grilla 10×10 con etiquetas. cellClass(r,c) devuelve clases extra; onTap(r,c) opcional. */
function gridEl({ small = false, cellClass = () => '', onTap = null, id = null }) {
  const cols = el('div', { class: 'cols' }, ...COLS.split('').map(l => el('div', { class: 'lbl' }, l)));
  const rows = el('div', { class: 'rows' }, ...Array.from({ length: N }, (_, i) => el('div', { class: 'lbl' }, i + 1)));
  const grid = el('div', { class: 'grid' });
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const cell = el('div', { class: 'cell ' + cellClass(r, c), 'data-r': r, 'data-c': c });
    if (onTap) cell.addEventListener('click', () => onTap(r, c, cell));
    grid.append(cell);
  }
  return el('div', { class: 'grid-wrap' + (small ? ' small' : ''), id }, el('div', { class: 'corner' }), cols, rows, grid);
}

/** Clases de una casilla de mi propio tablero: barco + impactos recibidos. */
function myCellClass(layout, shotsReceived, highlightLast = false) {
  const occ = occupancy(layout);
  const hit = {};
  shotsReceived.forEach(s => { hit[s.cell] = s.result; if (s.cells) s.cells.forEach(x => { hit[x] = 'hundido'; }); });
  const last = highlightLast && shotsReceived.length ? shotsReceived[shotsReceived.length - 1].cell : null;
  return (r, c) => { const n = cellName(r, c); return (occ[n] ? 'ship ' : '') + (hit[n] || '') + (n === last ? ' last' : ''); };
}

/** Clases de una casilla del tablero enemigo: mis disparos. */
function enemyCellClass(myShots, aim) {
  const mark = {};
  myShots.forEach(s => { if (s.result) { mark[s.cell] = s.result; if (s.cells) s.cells.forEach(x => { mark[x] = 'hundido'; }); } });
  return (r, c) => { const n = cellName(r, c); return (mark[n] || '') + (aim === n ? ' aim' : ''); };
}

function fleetScore(sunkIds) {
  return el('span', { class: 'fleet' }, ...FLEET.map(f => el('span', { class: sunkIds.includes(f.id) ? 'sunk' : '' }, SHIP_EMOJI)));
}

/* ------------------------------------------------------------------ */
/* Render principal                                                    */
/* ------------------------------------------------------------------ */
function render() {
  if (!M) return;
  const v = view();
  switch (v.phase) {
    case 'lobby': renderLobby(); break;
    case 'placing': renderPlace(); break;
    case 'play': case 'reveal': renderPlay(v); break;
    case 'done': renderResult(v); break;
  }
}

/* ---------- Lobby (dos celulares) ---------- */
function renderPresence() {
  if (!S || S.mode !== 'online' || !M) return;
  const v = view();
  if (v.phase === 'lobby') renderLobby();
  const p = M.presence[other(S.role)];
  if (v.phase === 'play' && p && p.online === false) $('#status-sub').textContent = T.offline;
}

function renderLobby() {
  showScreen('screen-lobby');
  const box = $('#lobby-box'); box.innerHTML = '';
  const url = `${location.origin}${location.pathname}?sala=${S.code}`;
  const joined = M.names.A && M.names.B;
  box.append(
    el('div', { class: 'muted', style: 'font-weight:800' }, T.lobbyCode),
    el('div', { class: 'code-big' }, S.code),
    el('div', { class: 'qr', id: 'qr' }),
    el('p', { class: 'muted' }, T.lobbyShare),
    el('button', { class: 'btn btn--ghost btn--sm', onClick: async e => { try { await navigator.clipboard.writeText(url); e.target.textContent = T.copied; } catch (_) { prompt('URL', url); } } }, T.copyLink),
    el('p', { class: 'waiting', style: 'margin-top:12px' }, joined ? fmt(T.lobbyJoined, { name: M.names[other(S.role)] }) : el('span', { class: 'dots' }, T.lobbyWaiting)),
  );
  renderQr(url);
}

async function renderQr(url) {
  try {
    if (!window.qrcode) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; s.onload = res; s.onerror = rej; document.head.append(s); });
    const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    const box = $('#qr'); if (box) box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (_) { const box = $('#qr'); if (box) box.remove(); }
}

/* ---------- Colocación ---------- */
function renderPlace() {
  const rolesNeeding = S.roles.filter(r => !S.layouts[r] && !(S.bot && S.bot.role === r));
  showScreen('screen-place');
  if (!rolesNeeding.length) {
    const waitingFor = ['A', 'B'].find(r => !M.commits[r]);
    $('#place-title').textContent = T.fleetSaved; $('#place-count').textContent = ''; $('#place-hint').textContent = '';
    $('#place-grid').innerHTML = ''; $('#place-ships').innerHTML = ''; $('#place-actions').innerHTML = ''; $('#place-sail').innerHTML = '';
    $('#place-status').innerHTML = ''; $('#place-status').append(el('span', { class: 'dots' }, fmt(T.waitingFleet, { name: M.names[waitingFor] || '…' })));
    return;
  }
  const r = rolesNeeding[0];
  const build = () => buildPlacement(r);
  if (S.mode === 'local' && S.uiRole !== r) { S.uiRole = r; $('#place-grid').innerHTML = ''; showCover({ label: T.hoPass, name: M.names[r], button: T.tapToReveal, onReveal: () => { SFX.reveal(); build(); } }); }
  else build();
}

function buildPlacement(role) {
  const d = S.draft[role] = S.draft[role] || { layout: {}, sel: FLEET[0].id, dir: 'h' };
  $('#place-title').textContent = S.mode === 'local' ? fmt(T.placeFor, { name: M.names[role] }) : T.placeTitle;
  $('#place-hint').textContent = T.placeHint;
  $('#place-status').textContent = '';
  const placedCount = () => FLEET.filter(f => d.layout[f.id]).length;
  let drag = null; // { ship, offset, dir }

  const flash = cell => { cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake'); vibrate([20, 30, 20]); SFX.error(); };

  const paint = () => {
    $('#place-count').textContent = fmt(T.placed, { n: placedCount() });
    const occ = occupancy(d.layout);
    const gridBox = $('#place-grid'); gridBox.innerHTML = '';
    const g = gridEl({ cellClass: (r, c) => { const id = occ[cellName(r, c)]; return id ? ('ship' + (id === d.sel ? ' sel' : '')) : ''; }, onTap: onCellTap });
    gridBox.append(g);
    // Barco seleccionado ya colocado: botón ↻ sobre su esquina superior derecha
    if (d.sel && d.layout[d.sel]) {
      const p = d.layout[d.sel]; const size = SHIP_SIZE[d.sel];
      const corner = p.dir === 'h' ? { r: p.r, c: p.c + size - 1 } : { r: p.r, c: p.c };
      const cell = g.querySelector(`.cell[data-r="${corner.r}"][data-c="${corner.c}"]`);
      if (cell) cell.append(el('button', { type: 'button', class: 'rot', 'aria-label': T.rotate.replace('{dir}', ''), onClick: e => { e.stopPropagation(); rotateSelected(); }, onPointerdown: e => e.stopPropagation() }, '↻'));
    }
    // arrastre de barcos ya colocados
    const grid = g.querySelector('.grid');
    grid.addEventListener('pointerdown', onPointerDown);
    grid.addEventListener('pointermove', onPointerMove);
    grid.addEventListener('pointerup', onPointerUp);
    grid.addEventListener('pointercancel', onPointerUp);
    // fichas de barcos
    const ships = $('#place-ships'); ships.innerHTML = '';
    for (const f of FLEET) {
      ships.append(el('button', { type: 'button', class: 'ship-chip' + (d.sel === f.id ? ' sel' : '') + (d.layout[f.id] ? ' done' : ''), onClick: () => { d.sel = f.id; SFX.tap(); paint(); } },
        el('span', { class: 'segs' }, ...Array.from({ length: f.size }, () => el('i'))), T.ships[f.id]));
    }
    const actions = $('#place-actions'); actions.innerHTML = '';
    actions.append(
      el('button', { class: 'btn btn--ghost', onClick: () => { rotateSelected(); } }, fmt(T.rotate, { dir: d.dir === 'h' ? '↔' : '↕' })),
      el('button', { class: 'btn btn--ghost', onClick: () => { d.layout = randomLayout(); d.sel = null; SFX.dice(); paint(); } }, T.random),
      el('button', { class: 'btn btn--ghost', onClick: () => { d.layout = {}; d.sel = FLEET[0].id; SFX.tap(); paint(); } }, T.clear),
    );
    const sail = $('#place-sail'); sail.innerHTML = '';
    sail.append(el('button', { class: 'btn btn--yellow', disabled: !isValidLayout(d.layout), onClick: async () => { if (!isValidLayout(d.layout)) return; SFX.pass(); await setLayout(role, d.layout); } }, T.sail));
  };

  const cellAt = (r, c) => $('#place-grid').querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  const shipAt = (r, c) => occupancy(d.layout)[cellName(r, c)] || null;

  function onCellTap(r, c, cell) {
    if (drag && drag.moved) return; // fue un arrastre
    const here = shipAt(r, c);
    if (here) { // tocar un barco puesto: seleccionarlo (amarillo + botón ↻); tocarlo de nuevo lo deselecciona
      d.sel = here === d.sel ? null : here; if (d.sel) d.dir = d.layout[here].dir; SFX.tap(); vibrate(8); paint(); return;
    }
    if (d.sel && d.layout[d.sel]) { // barco puesto seleccionado + casilla vacía: moverlo ahí
      const target = { r, c, dir: d.layout[d.sel].dir };
      const without = { ...d.layout }; delete without[d.sel];
      if (isValidPlacement(without, d.sel, target)) { d.layout[d.sel] = target; SFX.reveal(); vibrate(10); paint(); } else flash(cell);
      return;
    }
    if (!d.sel) { // sin barco seleccionado: elegir el primero libre
      const free = FLEET.find(f => !d.layout[f.id]); if (!free) return; d.sel = free.id;
    }
    const placement = { r, c, dir: d.dir };
    if (isValidPlacement(d.layout, d.sel, placement)) {
      d.layout[d.sel] = placement; SFX.reveal(); vibrate(10);
      const nextFree = FLEET.find(f => !d.layout[f.id]); d.sel = nextFree ? nextFree.id : null;
      paint();
    } else flash(cell);
  }

  function rotateSelected() {
    SFX.tap();
    if (d.sel && d.layout[d.sel]) {
      const p = d.layout[d.sel]; const rotated = { ...p, dir: p.dir === 'h' ? 'v' : 'h' };
      if (isValidPlacement(d.layout, d.sel, rotated)) { d.layout[d.sel] = rotated; d.dir = rotated.dir; paint(); }
      else { const cell = cellAt(p.r, p.c); if (cell) flash(cell); }
    } else { d.dir = d.dir === 'h' ? 'v' : 'h'; paint(); }
  }

  function cellFromPoint(x, y) {
    const t = document.elementFromPoint(x, y); const cell = t && t.closest('.cell');
    return cell && cell.closest('#place-grid') ? { r: +cell.dataset.r, c: +cell.dataset.c } : null;
  }
  function onPointerDown(e) {
    const cell = e.target.closest('.cell'); if (!cell) return;
    const r = +cell.dataset.r, c = +cell.dataset.c; const ship = shipAt(r, c); if (!ship) return;
    const p = d.layout[ship];
    drag = { ship, dir: p.dir, offset: p.dir === 'h' ? c - p.c : r - p.r, orig: p, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* nada */ }
  }
  function onPointerMove(e) {
    if (!drag) return;
    const at = cellFromPoint(e.clientX, e.clientY); if (!at) return;
    const target = drag.dir === 'h' ? { r: at.r, c: at.c - drag.offset, dir: 'h' } : { r: at.r - drag.offset, c: at.c, dir: 'v' };
    if (target.r === drag.orig.r && target.c === drag.orig.c && !drag.moved) return;
    drag.moved = true;
    const without = { ...d.layout }; delete without[drag.ship];
    const ok = isValidPlacement(without, drag.ship, target);
    // previsualización
    $$('#place-grid .cell').forEach(x => x.classList.remove('ghost-ok', 'ghost-bad'));
    cellsOf(SHIP_SIZE[drag.ship], target).forEach(x => { const cell = cellAt(x.r, x.c); if (cell) cell.classList.add(ok ? 'ghost-ok' : 'ghost-bad'); });
    drag.target = ok ? target : null;
  }
  function onPointerUp() {
    if (!drag) return;
    const dr = drag; drag = null;
    if (dr.moved) { if (dr.target) { d.layout[dr.ship] = dr.target; SFX.reveal(); vibrate(10); } else SFX.error(); paint(); setTimeout(() => { drag = null; }, 0); }
  }
  paint();
}

/* ---------- Batalla ---------- */
function renderPlay(v) {
  showScreen('screen-play');
  const shooterLocal = S.roles.includes(v.shooter) && !(S.bot && S.bot.role === v.shooter);
  // Modo un celular: pase del celular cuando cambia el tirador (tras una respuesta)
  if (S.mode === 'local' && v.last && v.last.result !== null && v.last.n > S.lastShownShot) {
    S.lastShownShot = v.last.n;
    const turnPasses = v.phase === 'play' && v.shooter !== v.last.from;
    if (turnPasses || v.phase !== 'play') {
      const stage = shotResultStage(v.last, turnPasses ? M.names[v.shooter] : null);
      showHandoff([stage], () => { S.uiRole = v.shooter; S.aim = null; S.fleetShown = false; render(); }, { tapAdvances: !turnPasses });
      playResultSound(v.last.result);
      return;
    }
  }
  if (S.mode === 'local' && v.shooter && S.uiRole !== v.shooter && !v.pending && $('#handoff').hidden) {
    const stage = passBlock({ label: T.hoPass, name: M.names[v.shooter], button: T.hoReady });
    showHandoff([stage], () => { S.uiRole = v.shooter; S.aim = null; S.fleetShown = false; render(); }, { tapAdvances: false });
    return;
  }
  // Rol que "mira" la pantalla
  const me = S.mode === 'local' ? v.shooter : (S.mode === 'online' ? S.role : 'A');
  const enemy = other(me);
  // Estado
  const who = $('#status-who'), sub = $('#status-sub');
  const lastMine = v.last && v.last.from === me && v.last.result ? v.last : null;
  if (v.phase !== 'play') { who.textContent = '…'; sub.textContent = T.waitingReply; }
  else if (shooterLocal && v.shooter === me) { who.textContent = fmt(T.turnYou, { name: M.names[enemy] }); sub.textContent = lastMine && lastMine.result !== 'agua' && M.config.extraShot ? fmt(T.extraGo, { result: T[lastMine.result] }) : (v.pending ? T.waitingReply : T.pickCell); }
  else { who.textContent = fmt(T.turnOther, { name: M.names[v.shooter] }); sub.textContent = v.last && v.last.from !== me && v.last.result ? fmt(T.cpuShot, { cell: v.last.cell, result: T[v.last.result] }) : ''; }
  // Marcador
  const score = $('#score'); score.innerHTML = '';
  const sunkOf = target => repliesBy(other(target)).filter(s => s.result === 'hundido').map(s => s.ship);
  score.append(
    el('div', { class: 'side' }, el('span', {}, M.names[me]), fleetScore(sunkOf(me))),
    el('div', { class: 'side' }, el('span', {}, M.names[enemy]), fleetScore(sunkOf(enemy))),
  );
  // Tablero enemigo
  $('#enemy-title').textContent = fmt(T.enemyBoard, { name: M.names[enemy] });
  const myShots = M.shots.filter(s => s.from === me);
  const canShoot = shooterLocal && v.shooter === me && !v.pending && v.phase === 'play';
  const fire = cell => { if (!canShoot) return; S.aim = null; S.transport.send({ t: 'shot', from: me, cell }); SFX.flip(); };
  const enemyBox = $('#enemy-grid'); enemyBox.innerHTML = '';
  enemyBox.append(gridEl({ cellClass: enemyCellClass(myShots, S.aim), onTap: (r, c, cellEl) => {
    if (!canShoot) return;
    const n = cellName(r, c);
    if (myShots.some(s => s.cell === n)) { cellEl.classList.remove('shake'); void cellEl.offsetWidth; cellEl.classList.add('shake'); return; }
    if (!M.config.confirmShot) return fire(n);
    S.aim = S.aim === n ? null : n; SFX.tap(); vibrate(8);
    $$('#enemy-grid .cell').forEach(x => x.classList.toggle('aim', S.aim === cellName(+x.dataset.r, +x.dataset.c)));
    $('#fire-btn').disabled = !S.aim;
  } }));
  const fireRow = $('#fire-row'); fireRow.innerHTML = '';
  if (M.config.confirmShot && canShoot) fireRow.append(el('button', { class: 'btn btn--yellow', id: 'fire-btn', disabled: !S.aim, onClick: () => fire(S.aim) }, T.fire));
  // Toast del último resultado (mío o del rival)
  if (v.last && v.last.result) {
    const t = el('div', { class: 'toast ' + v.last.result }, v.last.from === me ? `${v.last.cell}: ${T[v.last.result]}` : fmt(T.shotAt, { name: M.names[v.last.from], cell: v.last.cell }) + ` · ${T[v.last.result]}`);
    if (v.last.result === 'hundido') t.append(el('div', { class: 'muted', style: 'font:800 0.85rem var(--font-body)' }, v.last.from === me ? fmt(T.sunkShip, { ship: T.ships[v.last.ship], name: M.names[enemy] }) : fmt(T.sunkMine, { ship: T.ships[v.last.ship] })));
    fireRow.append(t);
    if (v.last.n > S.lastShownShot) { S.lastShownShot = v.last.n; playResultSound(v.last.result); }
  }
  // Mi flota
  const mine = $('#mine-wrap'); mine.innerHTML = '';
  const lay = S.layouts[me]?.layout;
  if (lay) {
    const received = M.shots.filter(s => s.from === enemy && s.result !== null);
    const g = gridEl({ small: true, cellClass: myCellClass(lay, received, true) });
    const wrap = el('div', { class: 'mine-cover' + (S.mode !== 'local' || S.fleetShown ? ' shown' : '') }, g,
      el('div', { class: 'veil', onClick: e => { S.fleetShown = true; e.currentTarget.parentElement.classList.add('shown'); SFX.tap(); } }, `🙈 ${T.showFleet}`));
    mine.append(el('div', { class: 'board-title' }, T.myBoard), wrap);
    if (S.mode === 'local') mine.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { S.fleetShown = !S.fleetShown; wrap.classList.toggle('shown', S.fleetShown); } }, S.fleetShown ? T.hideFleet : T.showFleet));
  }
}

function playResultSound(result) { if (result === 'agua') SFX.splash(); else if (result === 'tocado') SFX.hit(); else SFX.sink(); vibrate(result === 'agua' ? 10 : result === 'tocado' ? [30, 30] : [60, 40, 120]); }

/** Etapa del pase en modo un celular: resultado del último disparo y, si el turno cambia, el pase debajo. */
function shotResultStage(shot, nextName) {
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'hint' }, `${M.names[shot.from]} · ${T.hoResult}`),
    el('div', { class: 'shot-big' }, shot.cell),
    el('div', { class: 'shot-result ' + shot.result }, T[shot.result] + (shot.result === 'hundido' ? ` · ${T.ships[shot.ship]}` : '')),
  );
  if (nextName) {
    stage.append(el('div', { class: 'pass-divider' }));
    const pb = passBlock({ label: T.hoPass, name: nextName, button: T.hoReady, small: true });
    stage.append(pb);
    stage.setAdvance = fn => pb.setAdvance(() => { SFX.pass(); fn(); });
  } else stage.append(el('div', { class: 'hint', style: 'margin-top:14px' }, T.hoContinue + ' ›'));
  return stage;
}

/* ---------- Resultado ---------- */
function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  if (!already) showScreen('screen-result');
  const meRole = S.mode === 'cpu' ? 'A' : (S.mode === 'online' ? S.role : null);
  const title = $('#result-title'), sub = $('#result-sub'), trophy = $('#result-trophy');
  title.textContent = fmt(T.winTitle, { name: M.names[v.winner] });
  const stats = r => { const mine = repliesBy(r); const hits = mine.filter(s => s.result !== 'agua').length; return fmt(T.stats, { shots: mine.length, acc: mine.length ? Math.round(100 * hits / mine.length) : 0 }); };
  sub.textContent = (meRole ? (meRole === v.winner ? T.youWin : T.youLose) + ' · ' : '') + stats(v.winner);
  trophy.textContent = meRole && meRole !== v.winner ? '😵' : '🏆';
  const fleets = $('#result-fleets'); fleets.innerHTML = '';
  for (const r of ['A', 'B']) {
    const ver = M.verify[r];
    const received = repliesBy(other(r));
    fleets.append(el('div', { class: 'f' }, el('b', {}, M.names[r]), el('small', {}, stats(r)), gridEl({ small: true, cellClass: myCellClass(M.reveals[r].layout, received) }), el('small', {}, S.mode === 'online' && ver ? (ver.ok ? T.verified : T.notVerified) : '')));
  }
  const replay = $('#result-replay'); if (!already) replay.open = false;
  const shotsBox = $('#result-shots'); shotsBox.innerHTML = '';
  for (const r of ['A', 'B']) {
    shotsBox.append(el('div', {}, el('div', { class: 'board-title' }, fmt(T.shotsOf, { name: M.names[r] })),
      el('ol', {}, ...repliesBy(r).map(s => el('li', {}, el('span', {}, s.cell), el('span', { class: 'r ' + s.result }, T[s.result] + (s.ship ? ` ${SHIP_EMOJI}` : '')))))));
  }
  if (!already) { if (!meRole || meRole === v.winner) { confetti({ count: 220, duration: 3500 }); SFX.win(); } else SFX.siren(); }
  renderResultActions();
}

function renderResultActions() {
  const box = $('#result-actions'); box.innerHTML = '';
  const o = S.mode === 'online' ? other(S.role) : null;
  const waiting = S.mode === 'online' && M.rematch[S.role] && !M.rematch[o];
  box.append(
    waiting ? el('p', { class: 'waiting' }, el('span', { class: 'dots' }, fmt(T.rematchWaiting, { name: M.names[o] }))) : el('button', { class: 'btn btn--yellow', onClick: rematch }, T.rematch),
    el('button', { class: 'btn btn--ghost', onClick: () => { clearSession(); S.transport.leave(); location.href = location.pathname; } }, T.changeMode),
    el('a', { class: 'btn btn--ghost', href: '../' }, T.backMenu),
  );
  // Revancha propuesta por el rival: me uno a su sala nueva
  if (S.mode === 'online') {
    const code = M.rematch[o];
    if (typeof code === 'string' && code !== S.code && !S.switching) { S.switching = true; joinOnline(code, M.names[S.role]).catch(e => { console.error(e); S.switching = false; }); }
  }
}

async function rematch() {
  SFX.tap();
  const v = view();
  const loser = other(v.winner);
  if (S.mode === 'online') {
    if (M.rematch[S.role]) return;
    const o = other(S.role);
    if (typeof M.rematch[o] === 'string') { S.switching = true; return joinOnline(M.rematch[o], M.names[S.role]); }
    const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
    const t = createFirebaseTransport({ game: GAME_ID });
    const config = { ...M.config, starter: loser === S.role ? 'A' : 'B' }; // yo seré A en la sala nueva
    S.switching = true;
    const code = await t.create({ config, name: M.names[S.role] });
    S.transport.send({ t: 'rematch', from: S.role, code });
    M.rematch[S.role] = code;
    renderResultActions();
    setTimeout(() => startOnline(t, code, 'A', M.names[S.role], config), 600);
    return;
  }
  startLocalMode(S.mode, { ...M.names }, { ...M.config, starter: loser });
}

/* ---------- Dos celulares ---------- */
async function startOnline(transport, code, role, name, config) {
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role });
  history.replaceState(null, '', `${location.pathname}?sala=${code}`);
  keepAwake();
  saveSession();
  render();
}
async function createOnline(name, config) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID });
  const code = await t.create({ config, name });
  await startOnline(t, code, 'A', name, config);
}
async function joinOnline(code, name, previousRole = null, savedLayout = null) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG);
  if (savedLayout) { S.layouts[role] = savedLayout; onChange(); }
}

function renderResumeSlot() {
  const slot = $('#resume-slot'); slot.innerHTML = '';
  const saved = loadSession();
  if (!saved || saved.done || !saved.code) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, `${T.lobbyCode}: ${saved.code}`),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: async () => { try { await joinOnline(saved.code, saved.name, saved.role, saved.layout); } catch (e) { clearSession(); renderResumeSlot(); } } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSession(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

/* ------------------------------------------------------------------ */
/* Modos y arranque                                                    */
/* ------------------------------------------------------------------ */
function startLocalMode(mode, names, config) {
  const transport = createLocalTransport();
  const bot = mode === 'cpu' ? { role: 'B', hunter: new Hunter() } : null;
  startSession({ mode, transport, roles: ['A', 'B'], config, names, bot });
  keepAwake();
}

function renderModes() {
  const box = $('#modes'); box.innerHTML = '';
  const modes = [['local', T.modeLocal, T.modeLocalHint, true], ['online', T.modeOnline, T.modeOnlineHint, true], ['cpu', T.modeCpu, T.modeCpuHint, true]];
  for (const [m, label, hint, available] of modes) box.append(el('button', { class: 'mode', disabled: !available, onClick: () => { SFX.tap(); renderSetup(m); } }, el('span', {}, el('b', {}, label), el('small', {}, hint)), el('span', { class: 'go' }, available ? '›' : '⏳')));
}

function renderSetup(mode, prefillCode = '') {
  showScreen('screen-setup');
  const config = { ...DEFAULT_CONFIG };
  const savedName = (() => { try { return localStorage.getItem(NAME_KEY) || ''; } catch (_) { return ''; } })();
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  const inputs = {};
  const nameField = (key, label, value = '') => { inputs[key] = el('input', { type: 'text', maxlength: 14, placeholder: label, value, autocomplete: 'off' }); return el('div', { class: 'field' }, el('label', {}, label), inputs[key]); };
  if (mode === 'local') form.append(nameField('A', T.p1), nameField('B', T.p2)); else form.append(nameField('A', T.yourName, savedName));
  const sw = (key, label, hint) => { const b = el('button', { type: 'button', class: 'switch' + (config[key] ? ' on' : ''), onClick: () => { config[key] = !config[key]; b.classList.toggle('on', config[key]); SFX.tap(); } }); return el('div', { class: 'toggle-row' }, el('div', {}, el('b', {}, label), hint ? el('small', {}, hint) : null), b); };
  form.append(sw('extraShot', T.extraShot, T.extraShotHint), sw('confirmShot', T.confirmShot, T.confirmShotHint));
  const actions = $('#setup-actions'); actions.innerHTML = '';
  const fail = msg => { err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const getName = k => inputs[k].value.trim();
  const remember = n => { try { localStorage.setItem(NAME_KEY, n); } catch (_) { /* nada */ } };
  if (mode === 'local') actions.append(el('button', { class: 'btn btn--yellow', onClick: () => { const a = getName('A'), b = getName('B'); if (!a || !b || a.toLowerCase() === b.toLowerCase()) return fail(T.errNames); SFX.tap(); startLocalMode('local', { A: a, B: b }, config); } }, T.start));
  else if (mode === 'cpu') actions.append(el('button', { class: 'btn btn--yellow', onClick: () => { const a = getName('A'); if (!a) return fail(T.errName); remember(a); SFX.tap(); startLocalMode('cpu', { A: a, B: T.cpuName }, config); } }, T.start));
  else {
    const codeInput = el('input', { type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: prefillCode, autocapitalize: 'characters', autocomplete: 'off' });
    const createBtn = el('button', { class: 'btn btn--yellow', onClick: async () => { const a = getName('A'); if (!a) return fail(T.errName); remember(a); SFX.tap(); createBtn.disabled = true; try { await createOnline(a, config); } catch (e) { console.error(e); fail(T.errNet); } createBtn.disabled = false; } }, T.create);
    const joinBtn = el('button', { class: 'btn btn--cyan', onClick: async () => {
      const a = getName('A'); const code = codeInput.value.trim().toUpperCase();
      if (!a) return fail(T.errName); if (!/^[A-Z]{4}$/.test(code)) return fail(T.errCode);
      remember(a); SFX.tap(); joinBtn.disabled = true;
      try { await joinOnline(code, a); } catch (e) { fail({ 'not-found': T.errNotFound, full: T.errFull, expired: T.errExpired, 'other-game': T.errOtherGame }[e.message] || T.errNet); }
      joinBtn.disabled = false;
    } }, T.join);
    actions.append(createBtn, el('div', { class: 'or' }, '— o —'), el('div', { class: 'panel' }, el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.joinTitle), el('div', { class: 'field' }, codeInput), joinBtn));
    if (prefillCode) setTimeout(() => inputs.A.focus(), 100);
  }
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(langToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  sparkles(12);
  renderModes();
  renderResumeSlot();
  const code = new URLSearchParams(location.search).get('sala');
  if (code && /^[A-Z]{4}$/i.test(code)) {
    const saved = loadSession();
    if (saved && saved.code === code.toUpperCase() && !saved.done) joinOnline(saved.code, saved.name, saved.role, saved.layout).catch(() => { clearSession(); renderSetup('online', code.toUpperCase()); });
    else renderSetup('online', code.toUpperCase());
  }
}
init();
// Gancho de depuración (solo lectura) para pruebas automatizadas.
window.__bn = { view: () => (M ? view() : null), match: () => M, session: () => S };
void GAME_ID; void parseCell;
