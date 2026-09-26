/**
 * Batalla Naval — lógica de juego.
 * Misma arquitectura que Toque y Fama (D-20): un reductor de mensajes para todos los modos.
 *  - local: ambos jugadores en este celular · cpu: B es un bot (Hunter) · online: sala con chat (C-15)
 * Cada dispositivo responde los disparos contra SU flota.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti, shareLink, canShare, llegaSolo } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic, COMMON, withLang } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { failWith } from '../assets/js/transport/errors.js';
import { showHandoff, passBlock, showCover } from '../assets/js/handoff.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart } from '../assets/js/transport/stats.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import { UMBRAL } from '../assets/js/arrastre.js';
import { createChat } from '../assets/js/chat.js';
import { N, COLS, FLEET, SHIP_SIZE, cellName, parseCell, isCell, cellsOf, isValidPlacement, isValidLayout, randomLayout, rotateNear, occupancy, layoutKey, shoot, allSunk, Hunter, nextShooter, sha256, randomNonce, verifyPlayer } from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, LOCALES } from './rules.js';
import { FONDO_AGUA, barcoEn, barcoEntero, trozoDe } from './flota.js';

const lang = getLang();
const T = LOCALES[lang];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const other = r => (r === 'A' ? 'B' : 'A');
const store = createSessionStore(GAME_ID, { legacyKeys: ['juegos-de-salon:bn:session'] });
const names_ = createNameStore(GAME_ID);
const SHIP_EMOJI = '🚢';

let S = null;   // sesión
let M = null;   // partida
let chat = null; // chat de sala: solo en dos celulares (canon C-15)

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
    // El chat no es parte del estado: se dibuja y se olvida (canon C-15)
    case 'chat': if (chat) chat.add(msg, { live: !!S?.live }); return 'chat';
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
  // Cambiar de sala (la revancha crea una nueva) es irse de la anterior para siempre: se
  // despide en vez de solo soltar los oyentes, así no queda una sala muerta viéndose viva.
  if (S?.transport) S.transport.dispose();
  if (S?.turnTimer) clearTimeout(S.turnTimer);
  if (S?.finTimer) clearTimeout(S.finTimer);
  S = { mode, transport, roles, layouts: {}, draft: {}, bot, code, role, repliedShots: new Set(), lastShownShot: -1, cpuTimer: null, turnTimer: null, finTimer: null, lastTurnMine: null, hundimiento: null, uiRole: null, aim: null, fleetShown: false, live: false };
  M = newMatch(config);
  M.presence = {};
  setupChat(mode);
  // Lo que llega en los primeros instantes es la historia de la sala al entrar: se dibuja sin ruido
  const sess = S;
  setTimeout(() => { if (S === sess) S.live = true; }, 1500);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { if (apply(m) === 'chat') return; onChange(); });
  transport.onPresence(p => { M.presence = p; renderPresence(); });
}

/* ---------- Persistencia de la partida (todos los modos, canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  const done = view().phase === 'done';
  if (S.mode === 'online') {
    store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, layout: S.layouts[S.role] || null, done });
  } else {
    const layouts = {};
    for (const r of S.roles) if (S.layouts[r]) layouts[r] = S.layouts[r];
    store.save({ mode: S.mode, config: M.config, messages: S.transport.messages || [], private: { layouts, draft: S.draft }, done });
  }
}
function loadSession() { return store.load(); }
function clearSession() { store.clear(); }

/** Retoma una partida de un celular o contra el celular reproduciendo sus mensajes. */
function restoreLocal(saved) {
  const transport = createLocalTransport({ seed: saved.messages || [] });
  const bot = saved.mode === 'cpu' ? { role: 'B', hunter: new Hunter() } : null;
  startSession({ mode: saved.mode, transport, roles: ['A', 'B'], config: saved.config, names: {}, bot });
  for (const [r, lay] of Object.entries(saved.private?.layouts || {})) S.layouts[r] = lay;
  S.draft = saved.private?.draft || {};
  M.shots.forEach(x => { if (x.result !== null) { S.repliedShots.add(x.n); S.lastShownShot = Math.max(S.lastShownShot, x.n); } });
  S.uiRole = null; // fuerza la pantalla de pase / tapada al retomar
  keepAwake();
  onChange();
}

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

/**
 * Grilla 10×10 con etiquetas. cellClass(r,c) devuelve clases extra; onTap(r,c) opcional.
 * Las etiquetas viven DENTRO de la misma grilla (una fila y una columna más), así comparten
 * las pistas de tamaño con las casillas y quedan alineadas en cualquier navegador.
 */
function gridEl({ small = false, cellClass = () => '', cellArt = null, onTap = null, id = null }) {
  const grid = el('div', { class: 'grid' });
  grid.append(el('div', { class: 'lbl corner' }), ...COLS.split('').map(l => el('div', { class: 'lbl' }, l)));
  for (let r = 0; r < N; r++) {
    grid.append(el('div', { class: 'lbl' }, r + 1));
    for (let c = 0; c < N; c++) {
      const cell = el('div', { class: 'cell ' + cellClass(r, c), 'data-r': r, 'data-c': c });
      if (cellArt) { const arte = cellArt(r, c); if (arte) cell.append(arte); }
      if (onTap) cell.addEventListener('click', () => onTap(r, c, cell));
      grid.append(cell);
    }
  }
  return el('div', { class: 'grid-wrap' + (small ? ' small' : ''), id }, grid);
}

/** Clases de una casilla de mi propio tablero: barco + impactos recibidos. */
function myCellClass(layout, shotsReceived, highlightLast = false) {
  const occ = occupancy(layout);
  const hit = {};
  shotsReceived.forEach(s => { hit[s.cell] = s.result; if (s.cells) s.cells.forEach(x => { hit[x] = 'hundido'; }); });
  const last = highlightLast && shotsReceived.length ? shotsReceived[shotsReceived.length - 1].cell : null;
  return (r, c) => { const n = cellName(r, c); return (occ[n] ? 'ship ' : '') + (hit[n] || '') + (n === last ? ' last' : ''); };
}

/**
 * El dibujo del tablero enemigo: solo los barcos **hundidos**, que son los únicos que el rival
 * ya mostró. La respuesta de un hundimiento trae el barco y sus casillas en orden desde la popa
 * (`cellsOf`), así que de ahí sale qué trozo va en cada una y si el barco está de pie o acostado.
 */
function enemyCellArt(myShots) {
  const arte = {};
  for (const s of myShots) {
    if (s.result !== 'hundido' || !s.ship || !s.cells) continue;
    const pos = s.cells.map(parseCell);
    const dir = pos.length > 1 && pos[0].r === pos[1].r ? 'h' : 'v';
    pos.forEach((p, i) => { arte[cellName(p.r, p.c)] = { id: s.ship, i, dir }; });
  }
  return (r, c) => {
    const t = arte[cellName(r, c)];
    if (!t) return null;
    const svg = trozoDe(t.id, t.i);
    if (svg && t.dir === 'v') svg.classList.add('v');
    return svg;
  };
}

/** Cuánto dura el hundimiento en pantalla, de punta a punta. */
const HUNDIR_MS = 1400;

/**
 * Decora una grilla ya dibujada con el hundimiento en curso (D-93): el fuego corre por el casco
 * desde la casilla que se disparó y después el casco entero se va bajo el agua.
 *
 * Los retardos se calculan **contra el reloj**, no desde cero, así que salen negativos si la
 * grilla se vuelve a dibujar a mitad de camino. Un `animation-delay` negativo arranca la
 * animación ya empezada: el repintado retoma el hundimiento donde iba en vez de reiniciarlo,
 * que es lo que pasaba antes porque `renderPlay` rehace la grilla entera en cada mensaje.
 */
function pintaHundimiento(wrap, h) {
  const celdas = h.shot.cells;
  if (!celdas || !celdas.length) return;
  const PASO = 90;
  const impacto = Math.max(0, celdas.indexOf(h.shot.cell));
  const tFin = PASO * Math.max(impacto, celdas.length - 1 - impacto) + 90;
  const corrido = Date.now() - h.inicio;
  celdas.forEach((nombre, i) => {
    const { r, c } = parseCell(nombre);
    const cell = wrap.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;
    const mio = Math.abs(i - impacto) * PASO;
    cell.style.setProperty('--t', mio - corrido + 'ms');
    cell.style.setProperty('--tFin', tFin - corrido + 'ms');
    cell.classList.add('hundiendo');
    if (nombre === h.shot.cell) cell.classList.add('impacto');
    // Hasta que a esta casilla le llegue el fuego se sigue viendo como estaba (ver `aun-vivo`
    // en style.css). Lo hace un temporizador y no un fotograma porque Chrome no anima ni las
    // variables de la paleta ni el `content` del emoji.
    if (mio > corrido) { cell.classList.add('aun-vivo'); setTimeout(() => cell.classList.remove('aun-vivo'), mio - corrido); }
    // Y al terminar, la casilla vuelve a ser una casilla hundida y nada más: si las clases se
    // quedaran puestas, el `forwards` del último fotograma seguiría mandando y el siguiente
    // repintado —el próximo disparo— las sacaría de golpe, a la vista.
    setTimeout(() => cell.classList.remove('hundiendo', 'impacto', 'aun-vivo'), Math.max(0, HUNDIR_MS - corrido));
    // La espuma se programa una sola vez por hundimiento, no en cada repintado.
    if (i === Math.floor(celdas.length / 2) && !h.espuma) {
      h.espuma = true;
      setTimeout(() => espuma(wrap, r, c), Math.max(0, tFin + 270 - corrido));
    }
  });
}

/** Cuatro burbujas subiendo de una casilla, si la grilla que las pidió sigue en pantalla. */
function espuma(wrap, r, c) {
  const cell = wrap.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  if (!cell || !cell.isConnected) return;
  for (let k = 0; k < 4; k++) {
    const b = el('i', { class: 'burbuja', style: `--dx:${((k - 1.5) * 8).toFixed(0)}px;animation-delay:${k * 150}ms` });
    cell.append(b);
    setTimeout(() => b.remove(), 1400);
  }
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
/**
 * El turno, en el título de la pestaña. En dos celulares el aparato puede estar en el bolsillo
 * o la app de fondo cuando te toca: el título es lo único que se ve sin abrir nada.
 */
function tabTurn(on) { document.title = on ? `🎯 ${T.turnYou} · ${T.docTitle}` : T.docTitle; }

function render() {
  if (!M) return;
  const v = view();
  if (v.phase !== 'play') tabTurn(false);
  // El chat acompaña la sala, la espera de la flota rival, la batalla y el resultado; muere con
  // la sala (C-15, D-35). Mientras uno coloca su propia flota se guarda: la pantalla llena el
  // celular justo, la burbuja tapaba los botones de abajo y ahí nadie está conversando. Lo que
  // llega en ese rato espera en el globito.
  if (chat) (v.phase === 'placing' && !S.layouts[S.role] ? chat.hide() : chat.show());
  if (chat && v.phase === 'play' && v.shooter === S.role && !v.pending) chat.closeIfIdle();
  switch (v.phase) {
    case 'lobby': renderLobby(); break;
    case 'placing': renderPlace(); break;
    case 'play': case 'reveal': renderPlay(v); break;
    case 'done': {
      // El hundimiento que gana la partida es el que más merece verse, y era el único que no se
      // veía: la pantalla saltaba al resultado en el mismo repintado. Ahora el resultado espera
      // a que el barco termine de irse (D-93). En un celular no espera: ahí manda la pantalla
      // de pase, que ya canta el resultado del disparo antes que nada (C-9).
      const resta = S.mode !== 'local' && S.hundimiento ? HUNDIR_MS - (Date.now() - S.hundimiento.inicio) : 0;
      if (resta > 0) { clearTimeout(S.finTimer); S.finTimer = setTimeout(render, resta + 40); renderPlay(v); break; }
      renderResult(v);
      break;
    }
  }
}

/** Crea (o bota) el chat de sala. Solo tiene sentido con un jugador por celular. */
function setupChat(mode) {
  if (chat) { chat.destroy(); chat = null; }
  const mount = $('#chat');
  if (!mount) return;
  mount.hidden = true;
  if (mode !== 'online') return;
  chat = createChat({
    mount, T,
    nameOf: r => M.names[r] || '…',
    isMine: r => r === S.role,
    onSend: text => S.transport.send({ t: 'chat', from: S.role, text }),
  });
}

/* ---------- Lobby (dos celulares) ---------- */
function renderPresence() {
  if (!S || S.mode !== 'online' || !M) return;
  const v = view();
  if (v.phase === 'lobby') renderLobby();
  const p = M.presence[other(S.role)];
  if (v.phase === 'play' && p && p.online === false) $('#status-sub').textContent = T.offline;
}

/**
 * Irse de la sala a propósito: este rol se despide y, si no queda nadie, la sala se borra
 * en el acto en vez de quedar seis horas pareciendo viva (D-50). Cerrar la pestaña no pasa
 * por acá: esa partida se puede retomar y la sala tiene que seguir esperando (C-6).
 */
async function leaveRoom(btn) {
  SFX.tap();
  if (btn) btn.disabled = true;
  clearSession();
  await S.transport.dispose();
  location.href = location.pathname;
}

function renderLobby() {
  showScreen('screen-lobby');
  const box = $('#lobby-box'); box.innerHTML = '';
  // Con el idioma pegado: quien reciba la invitación abre la app como quien la mandó (D-74)
  const url = withLang(`${location.origin}${location.pathname}?sala=${S.code}`);
  const joined = M.names.A && M.names.B;
  box.append(
    el('div', { class: 'muted', style: 'font-weight:800' }, T.lobbyCode),
    el('div', { class: 'code-big' }, S.code),
    el('div', { class: 'qr', id: 'qr' }),
    el('p', { class: 'muted' }, T.lobbyShare),
    shareButton(url),
    el('p', { class: 'waiting', style: 'margin-top:12px' }, joined ? fmt(T.lobbyJoined, { name: M.names[other(S.role)] }) : el('span', { class: 'dots' }, T.lobbyWaiting)),
    el('button', { class: 'btn btn--ghost btn--sm', style: 'margin-top:10px', onClick: e => leaveRoom(e.currentTarget) }, S.role === 'A' ? T.lobbyCancel : T.lobbyLeave),
  );
  renderQr(url);
}

/** Botón de compartir: diálogo nativo del sistema si existe; si no, copia el enlace. */
/**
 * "Javi te invita a jugar X en juegosdesalon.cl - Sala: WFBN". Nombra a quien toca compartir,
 * que es quien está invitando; el resto —de qué se trata el juego, para cuántos, cuánto dura—
 * lo pone la tarjeta que el chat arma sola con el link (D-72).
 */
function textoInvitacion() {
  return fmt(COMMON[lang].invite, { name: M.names[S.role] || '', game: T.title, code: S.code });
}

function shareButton(url) {
  const btn = el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%;max-width:320px' }, canShare() ? T.shareLink : T.copyLink);
  btn.addEventListener('click', async () => {
    SFX.tap();
    const r = await shareLink({ title: T.title, text: textoInvitacion(), url });
    if (r === 'copied') { btn.textContent = T.copied; setTimeout(() => { btn.textContent = canShare() ? T.shareLink : T.copyLink; }, 2000); }
  });
  return btn;
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
  S.placing = { role, deselect: () => { if (d.sel && d.layout[d.sel]) { d.sel = null; paint(); } } };
  $('#place-title').textContent = S.mode === 'local' ? fmt(T.placeFor, { name: M.names[role] }) : T.placeTitle;
  $('#place-hint').textContent = T.placeHint;
  $('#place-status').textContent = '';
  const placedCount = () => FLEET.filter(f => d.layout[f.id]).length;
  let drag = null;          // { ship, dir, offset, moved, x, y, target }
  let justDragged = false;  // el click que viene después de soltar no es un toque

  const flash = cell => { cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake'); vibrate([20, 30, 20]); SFX.error(); };

  const paint = () => {
    $('#place-count').textContent = fmt(T.placed, { n: placedCount() });
    const occ = occupancy(d.layout);
    const gridBox = $('#place-grid'); gridBox.innerHTML = '';
    const g = gridEl({
      cellClass: (r, c) => { const id = occ[cellName(r, c)]; return id ? ('ship' + (id === d.sel ? ' sel' : '')) : ''; },
      cellArt: (r, c) => barcoEn(d.layout, r, c),
      onTap: onCellTap,
    });
    gridBox.append(g);
    // Barco seleccionado ya colocado: botón ↻ sobre su esquina superior derecha.
    // Mientras se arrastra no se dibuja: girar no es algo que se pueda hacer con el barco en el
    // aire, y el botón quedaba flotando sobre la casilla de donde salió.
    if (d.sel && d.layout[d.sel] && !(drag && drag.moved)) {
      const p = d.layout[d.sel]; const size = SHIP_SIZE[d.sel];
      const corner = p.dir === 'h' ? { r: p.r, c: p.c + size - 1 } : { r: p.r, c: p.c };
      const cell = g.querySelector(`.cell[data-r="${corner.r}"][data-c="${corner.c}"]`);
      if (cell) cell.append(el('button', { type: 'button', class: 'rot', 'aria-label': T.rotate.replace('{dir}', ''), onClick: e => { e.stopPropagation(); rotateSelected(); }, onPointerdown: e => e.stopPropagation() }, '↻'));
    }
    // fichas de barcos
    const ships = $('#place-ships'); ships.innerHTML = '';
    for (const f of FLEET) {
      ships.append(el('button', { type: 'button', 'data-ship': f.id, class: 'ship-chip' + (d.sel === f.id ? ' sel' : '') + (d.layout[f.id] ? ' done' : ''), onClick: () => { d.sel = f.id; SFX.tap(); paint(); } },
        barcoEntero(f.id), T.ships[f.id]));
    }
    const actions = $('#place-actions'); actions.innerHTML = '';
    actions.append(
      el('button', { class: 'btn btn--ghost rotar', onClick: () => { rotateSelected(); } }, fmt(T.rotate, { dir: d.dir === 'h' ? '↔' : '↕' })),
      el('button', { class: 'btn btn--ghost', onClick: () => { d.layout = randomLayout(); d.sel = null; SFX.dice(); paint(); } }, T.random),
      el('button', { class: 'btn btn--ghost', onClick: () => { d.layout = {}; d.sel = FLEET[0].id; SFX.tap(); paint(); } }, T.clear),
    );
    const sail = $('#place-sail'); sail.innerHTML = '';
    sail.append(el('button', { class: 'btn btn--yellow', disabled: !isValidLayout(d.layout), onClick: async () => { if (!isValidLayout(d.layout)) return; SFX.pass(); await setLayout(role, d.layout); } }, T.sail));
    saveSession(); // conserva el borrador de la flota si el jugador sale a mitad de la colocación
  };

  const cellAt = (r, c) => $('#place-grid').querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  const shipAt = (r, c) => occupancy(d.layout)[cellName(r, c)] || null;

  function onCellTap(r, c, cell) {
    if (justDragged) return; // fue un arrastre, no un toque
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
      const p = d.layout[d.sel]; const rotated = rotateNear(d.layout, d.sel); // si no cabe sobre la proa, lo más cerca (D-136)
      if (rotated) { d.layout[d.sel] = rotated; d.dir = rotated.dir; paint(); }
      else { const cell = cellAt(p.r, p.c); if (cell) flash(cell); }
    } else { d.dir = d.dir === 'h' ? 'v' : 'h'; paint(); }
  }

  function cellFromPoint(x, y) {
    const t = document.elementFromPoint(x, y); const cell = t && t.closest('.cell');
    return cell && cell.closest('#place-grid') ? { r: +cell.dataset.r, c: +cell.dataset.c } : null;
  }

  /**
   * Arrastrar un barco, tanto desde su ficha (todavía fuera del tablero) como desde el tablero.
   *
   * Dos cosas que aprendimos en Línea de Tiempo y valen igual acá (D-85, D-86):
   *  - **El puntero lo toma la pantalla, no la grilla.** La grilla se rehace entera en cada
   *    repintado, y con ella se iría la captura a mitad del gesto.
   *  - **Arrastrar es elegir.** Apenas el dedo se mueve de verdad (UMBRAL), el barco arrastrado
   *    pasa a ser el seleccionado: antes se podía tener uno en amarillo y mover otro.
   * Mientras no se pase del umbral no hay arrastre, así que el toque de siempre sigue intacto.
   */
  const dragApi = {
    down(e) {
      if (e.button > 0) return;
      const chip = e.target.closest && e.target.closest('.ship-chip');
      const cell = e.target.closest && e.target.closest('#place-grid .cell');
      let ship = null, dir = d.dir, offset = 0;
      if (chip) { ship = chip.dataset.ship; dir = d.layout[ship] ? d.layout[ship].dir : d.dir; }
      else if (cell) {
        const r = +cell.dataset.r, c = +cell.dataset.c; ship = shipAt(r, c);
        if (ship) { const p = d.layout[ship]; dir = p.dir; offset = p.dir === 'h' ? c - p.c : r - p.r; }
      }
      if (!ship) return;
      drag = { ship, dir, offset, moved: false, x: e.clientX, y: e.clientY, target: null };
    },
    move(e) {
      if (!drag) return;
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < UMBRAL) return;
        drag.moved = true;
        // El puntero se toma recién acá, cuando el gesto ya es un arrastre. Tomarlo al apoyar
        // el dedo le cambia el destino al `click` que viene después —se lo lleva el elemento
        // que capturó— y entonces tocar un barco no lo seleccionaba: el toque moría en la
        // pantalla sin llegar nunca a la casilla.
        try { $('#screen-place').setPointerCapture(e.pointerId); } catch (_) { /* nada */ }
        d.sel = drag.ship; d.dir = drag.dir;
        paint();   // el barco arrastrado queda elegido, y el ↻ se va mientras dure el gesto
      }
      $$('#place-grid .cell').forEach(x => x.classList.remove('ghost-ok', 'ghost-bad'));
      drag.target = null;
      const at = cellFromPoint(e.clientX, e.clientY); if (!at) return;   // afuera del tablero: sin destino
      const target = drag.dir === 'h' ? { r: at.r, c: at.c - drag.offset, dir: 'h' } : { r: at.r - drag.offset, c: at.c, dir: 'v' };
      const without = { ...d.layout }; delete without[drag.ship];
      const ok = isValidPlacement(without, drag.ship, target);
      cellsOf(SHIP_SIZE[drag.ship], target).forEach(x => { const cell = cellAt(x.r, x.c); if (cell) cell.classList.add(ok ? 'ghost-ok' : 'ghost-bad'); });
      if (ok) drag.target = target;
    },
    up(e) {
      if (!drag) return;
      const dr = drag; drag = null;
      try { $('#screen-place').releasePointerCapture(e.pointerId); } catch (_) { /* nada */ }
      if (!dr.moved) return;   // fue un toque: lo resuelve onCellTap o la ficha
      justDragged = true; setTimeout(() => { justDragged = false; }, 0);
      if (dr.target) { d.layout[dr.ship] = dr.target; d.sel = dr.ship; SFX.reveal(); vibrate(10); }
      else SFX.error();
      paint();
    },
    dragging: () => !!(drag && drag.moved) || justDragged,
  };
  S.placing.drag = dragApi;
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
  const canShoot = shooterLocal && v.shooter === me && !v.pending && v.phase === 'play';
  const myTurn = v.phase === 'play' && shooterLocal && v.shooter === me;
  // El hundimiento en curso: el más nuevo de la partida, mientras siga durando en pantalla.
  const ultimoHundido = [...M.shots].reverse().find(x => x.result === 'hundido' && x.cells);
  if (ultimoHundido && S.hundimiento?.n !== ultimoHundido.n) S.hundimiento = { n: ultimoHundido.n, shot: ultimoHundido, inicio: Date.now(), espuma: false };
  const hundiendo = S.hundimiento && Date.now() - S.hundimiento.inicio < HUNDIR_MS ? S.hundimiento : null;
  /**
   * Estado. Dos frases distintas del mismo tamaño y del mismo color se leen igual de lejos,
   * así que la barra cambia de color y de forma según de quién sea el turno (D-92). El ícono
   * va en su propio elemento: es una señal, no una palabra de la frase.
   */
  const bar = $('#screen-play .status'), who = $('#status-who'), sub = $('#status-sub');
  const lastMine = v.last && v.last.from === me && v.last.result ? v.last : null;
  const setStatus = (kind, ico, titulo, bajada) => {
    bar.className = 'status ' + kind;
    who.replaceChildren(el('span', { class: 'ico' }, ico), titulo);
    sub.textContent = bajada;
  };
  // Con la partida terminada la barra no puede quedarse en "…" durante todo el hundimiento:
  // mientras el barco se va, dice cuál fue.
  if (v.phase !== 'play' && hundiendo) setStatus('theirs', '💥', T.hundido, hundiendo.shot.from === me
    ? fmt(T.sunkShip, { ship: T.ships[hundiendo.shot.ship], name: M.names[enemy] })
    : fmt(T.sunkMine, { ship: T.ships[hundiendo.shot.ship] }));
  else if (v.phase !== 'play') setStatus('theirs', '⏳', '…', T.waitingReply);
  else if (myTurn) setStatus('mine', '🎯', T.turnYou, lastMine && lastMine.result !== 'agua' && M.config.extraShot
    ? fmt(T.extraGo, { result: T[lastMine.result] })
    : (v.pending ? T.waitingReply : fmt(T.turnYouSub, { name: M.names[enemy] })));
  else setStatus('theirs', '⏳', fmt(T.turnOther, { name: M.names[v.shooter] }), T.turnOtherSub);
  tabTurn(S.mode === 'online' && myTurn);
  // Te llegó el turno: además de verse, se oye y se siente. Si el disparo del rival acaba de
  // sonar, el aviso lo espera: dos sonidos encima se escuchan como uno solo y mal.
  if (myTurn && S.lastTurnMine !== myTurn) {
    const tras = v.last && v.last.result && v.last.n > S.lastShownShot ? 650 : 0;
    clearTimeout(S.turnTimer);
    S.turnTimer = setTimeout(() => { SFX.turn(); vibrate([40, 60, 40]); bar.classList.remove('pop'); void bar.offsetWidth; bar.classList.add('pop'); }, tras);
  }
  S.lastTurnMine = myTurn;
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
  const fire = cell => { if (!canShoot) return; S.aim = null; S.transport.send({ t: 'shot', from: me, cell }); SFX.flip(); };
  const enemyBox = $('#enemy-grid'); enemyBox.innerHTML = '';
  // El tablero ocupa media pantalla: es el cartel más grande que hay para decir si puedes
  // disparar o no. Vivo cuando te toca, apagado cuando no.
  enemyBox.classList.toggle('live', canShoot);
  enemyBox.classList.toggle('locked', !canShoot);
  /**
   * Tocarlo fuera de turno no puede ser un silencio: el canon pide una señal inconfundible y
   * una explicación de qué pasó (C-8b), y es además como se aprende la regla —tocando—.
   * El aviso no se cierra solo: lo reemplaza la jugada del rival cuando llegue.
   */
  const denegar = () => {
    const tablero = enemyBox.querySelector('.grid-wrap');
    if (tablero) { tablero.classList.remove('shake'); void tablero.offsetWidth; tablero.classList.add('shake'); }
    bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
    if (v.phase === 'play' && !v.pending && v.shooter !== me) sub.textContent = fmt(T.notYourTurn, { name: M.names[v.shooter] });
    SFX.error(); vibrate([20, 30, 20]);
  };
  enemyBox.append(gridEl({ cellClass: enemyCellClass(myShots, S.aim), cellArt: enemyCellArt(myShots), onTap: (r, c, cellEl) => {
    if (!canShoot) return denegar();
    const n = cellName(r, c);
    if (myShots.some(s => s.cell === n)) { cellEl.classList.remove('shake'); void cellEl.offsetWidth; cellEl.classList.add('shake'); return; }
    if (!M.config.confirmShot) return fire(n);
    S.aim = S.aim === n ? null : n; SFX.tap(); vibrate(8);
    $$('#enemy-grid .cell').forEach(x => x.classList.toggle('aim', S.aim === cellName(+x.dataset.r, +x.dataset.c)));
    $('#fire-btn').disabled = !S.aim;
  } }));
  if (hundiendo && hundiendo.shot.from === me) pintaHundimiento(enemyBox, hundiendo);
  const fireRow = $('#fire-row'); fireRow.innerHTML = '';
  if (M.config.confirmShot && canShoot) fireRow.append(el('button', { class: 'btn btn--yellow', id: 'fire-btn', disabled: !S.aim, onClick: () => fire(S.aim) }, T.fire));
  // Toast del último resultado (mío o del rival)
  if (v.last && v.last.result) {
    // La casilla va en su propio span: las cifras no se leen en Bangers (D-30).
    // `fmt` deja {cell} sin reemplazar, así que sirve de marca para partir el texto.
    const withCoord = (text, cell) => { const [antes, despues = ''] = text.split('{cell}'); return [antes, el('span', { class: 'coord' }, cell), despues]; };
    const t = el('div', { class: 'toast ' + v.last.result }, ...(v.last.from === me
      ? withCoord(`{cell}: ${T[v.last.result]}`, v.last.cell)
      : [...withCoord(fmt(T.shotAt, { name: M.names[v.last.from] }), v.last.cell), ` · ${T[v.last.result]}`]));
    if (v.last.result === 'hundido') t.append(el('div', { class: 'muted', style: 'font:800 0.85rem var(--font-body)' }, v.last.from === me ? fmt(T.sunkShip, { ship: T.ships[v.last.ship], name: M.names[enemy] }) : fmt(T.sunkMine, { ship: T.ships[v.last.ship] })));
    fireRow.append(t);
    if (v.last.n > S.lastShownShot) { S.lastShownShot = v.last.n; playResultSound(v.last.result); }
  }
  // Mi flota
  const mine = $('#mine-wrap'); mine.innerHTML = '';
  const lay = S.layouts[me]?.layout;
  if (lay) {
    const received = M.shots.filter(s => s.from === enemy && s.result !== null);
    const g = gridEl({ small: true, cellClass: myCellClass(lay, received, true), cellArt: (r, c) => barcoEn(lay, r, c) });
    const wrap = el('div', { class: 'mine-cover' + (S.mode !== 'local' || S.fleetShown ? ' shown' : '') }, g,
      el('div', { class: 'veil', onClick: e => { S.fleetShown = true; e.currentTarget.parentElement.classList.add('shown'); SFX.tap(); } }, `🙈 ${T.showFleet}`));
    mine.append(el('div', { class: 'board-title' }, T.myBoard), wrap);
    if (hundiendo && hundiendo.shot.from === enemy) pintaHundimiento(mine, hundiendo);
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
  // Quién ganó, para la lista de salas del panel del dueño (D-79). Solo en sala, y una sola
  // vez: al volver a dibujar la misma pantalla no se repite. Mejor esfuerzo, como todo lo
  // que va al panel: si no sale, la partida no se entera.
  if (!already && S.mode === 'online') {
    S.transport?.noteWinner?.({ role: v.winner, name: M.names[v.winner] });
  }
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
    fleets.append(el('div', { class: 'f' }, el('b', {}, M.names[r]), el('small', {}, stats(r)), gridEl({ small: true, cellClass: myCellClass(M.reveals[r].layout, received), cellArt: (rr, cc) => barcoEn(M.reveals[r].layout, rr, cc) }), el('small', {}, S.mode === 'online' && ver ? (ver.ok ? T.verified : T.notVerified) : '')));
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
    el('button', { class: 'btn btn--ghost', onClick: e => leaveRoom(e.currentTarget) }, T.changeMode),
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
  if (!saved || saved.done) return;
  if (saved.mode === 'online' && !saved.code) return;
  const label = saved.mode === 'online' ? `${T.lobbyCode}: ${saved.code}` : { local: T.modeLocal, cpu: T.modeCpu }[saved.mode] || '';
  const resume = async () => {
    if (saved.mode === 'online') { try { await joinOnline(saved.code, saved.name, saved.role, saved.layout); } catch (e) { clearSession(); renderResumeSlot(); } }
    else restoreLocal(saved);
  };
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, label),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: resume }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSession(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

/* ------------------------------------------------------------------ */
/* Modos y arranque                                                    */
/* ------------------------------------------------------------------ */
function startLocalMode(mode, names, config) {
  clearSession();
  const transport = createLocalTransport();
  const bot = mode === 'cpu' ? { role: 'B', hunter: new Hunter() } : null;
  startSession({ mode, transport, roles: ['A', 'B'], config, names, bot });
  keepAwake();
  trackStart({ game: GAME_ID, mode, players: mode === 'cpu' ? 1 : 2 }); // señal de uso para el panel (D-44)
}

function renderModes() {
  const box = $('#modes'); box.innerHTML = '';
  const modes = [['local', T.modeLocal, T.modeLocalHint, true], ['online', T.modeOnline, T.modeOnlineHint, true], ['cpu', T.modeCpu, T.modeCpuHint, true]];
  for (const [m, label, hint, available] of modes) box.append(el('button', { class: 'mode', disabled: !available, onClick: () => { SFX.tap(); renderSetup(m); } }, el('span', {}, el('b', {}, label), el('small', {}, hint)), el('span', { class: 'go' }, available ? '›' : '⏳')));
}

function renderSetup(mode, prefillCode = '') {
  showScreen('screen-setup');
  // Quien llega por un enlace no viene a configurar nada: viene invitado
  $('#screen-setup h2').textContent = prefillCode ? T.invitedTitle : T.setupTitle;
  const config = { ...DEFAULT_CONFIG };
  const savedName = names_.get();
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  const inputs = {};
  const nameField = (key, label, value = '') => { inputs[key] = el('input', { type: 'text', maxlength: 14, placeholder: label, value, autocomplete: 'off' }); return el('div', { class: 'field' }, el('label', {}, label), inputs[key]); };
  if (mode === 'local') form.append(nameField('A', T.p1), nameField('B', T.p2)); else form.append(nameField('A', T.yourName, savedName));
  const sw = (key, label, hint) => { const b = el('button', { type: 'button', class: 'switch' + (config[key] ? ' on' : ''), onClick: () => { config[key] = !config[key]; b.classList.toggle('on', config[key]); SFX.tap(); } }); return el('div', { class: 'toggle-row' }, el('div', {}, el('b', {}, label), hint ? el('small', {}, hint) : null), b); };
  // Quien llega invitado no configura nada: la partida ya viene armada por el anfitrión.
  if (!prefillCode) form.append(sw('extraShot', T.extraShot, T.extraShotHint), sw('confirmShot', T.confirmShot, T.confirmShotHint));
  const actions = $('#setup-actions'); actions.innerHTML = '';
  const fail = msg => { err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const getName = k => inputs[k].value.trim();
  const remember = n => names_.set(n);
  if (mode === 'local') actions.append(el('button', { class: 'btn btn--yellow', onClick: () => { const a = getName('A'), b = getName('B'); if (!a || !b || a.toLowerCase() === b.toLowerCase()) return fail(T.errNames); SFX.tap(); startLocalMode('local', { A: a, B: b }, config); } }, T.start));
  else if (mode === 'cpu') actions.append(el('button', { class: 'btn btn--yellow', onClick: () => { const a = getName('A'); if (!a) return fail(T.errName); remember(a); SFX.tap(); startLocalMode('cpu', { A: a, B: T.cpuName }, config); } }, T.start));
  else {
    const codeInput = el('input', { type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: prefillCode, autocapitalize: 'characters', autocomplete: 'off' });
    const createBtn = el('button', { class: 'btn btn--yellow', onClick: async () => { const a = getName('A'); if (!a) return fail(T.errName); remember(a); SFX.tap(); createBtn.disabled = true; try { await createOnline(a, config); } catch (e) { failWith(e, T, fail); } createBtn.disabled = false; } }, T.create);
    const joinBtn = el('button', { class: 'btn btn--cyan', onClick: async () => {
      const a = getName('A'); const code = codeInput.value.trim().toUpperCase();
      if (!a) return fail(T.errName); if (!/^[A-Z]{4}$/.test(code)) return fail(T.errCode);
      remember(a); SFX.tap(); joinBtn.disabled = true;
      try { await joinOnline(code, a); } catch (e) { failWith(e, T, fail); }
      joinBtn.disabled = false;
    } }, T.join);
    // Con un enlace de sala solo se puede entrar a ESA sala: crear otra desde aquí confunde.
    const joinPanel = extra => el('div', { class: 'panel' }, extra, el('div', { class: 'field' }, codeInput), joinBtn);
    if (prefillCode) {
      codeInput.readOnly = true;
      actions.append(joinPanel(el('div', {},
        el('p', { class: 'lead', style: 'margin-bottom:2px' }, fmt(T.invited, { code: prefillCode })),
        el('p', { class: 'muted', style: 'margin:0 0 8px' }, T.invitedHint),
      )));
    } else {
      actions.append(createBtn, el('div', { class: 'or' }, `— ${COMMON[lang].or} —`), joinPanel(el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.joinTitle)));
    }
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
  document.documentElement.style.setProperty('--agua', FONDO_AGUA);   // el mar de todas las casillas
  // El arrastre de barcos: los oyentes van en la pantalla, que sobrevive a los repintados de la
  // grilla, y le pasan el gesto a la colocación que esté viva (buildPlacement).
  for (const [evento, paso] of [['pointerdown', 'down'], ['pointermove', 'move'], ['pointerup', 'up'], ['pointercancel', 'up']]) {
    $('#screen-place').addEventListener(evento, e => { S?.placing?.drag?.[paso](e); });
  }
  // Tocar en cualquier parte fuera de la grilla deselecciona el barco elegido. Solo se salvan
  // las dos cosas que trabajan con la selección: la ficha de un barco (tocarla es elegirlo) y el
  // botón de girar (gira el que está elegido). Al azar y Limpiar rehacen la selección por su
  // cuenta, y Zarpar se lleva la pantalla entera.
  $('#screen-place').addEventListener('click', e => {
    if (!S?.placing || $('#screen-place').classList.contains('active') === false) return;
    if (S.placing.drag?.dragging()) return; // soltar un barco no es tocar afuera
    // composedPath conserva los nodos aunque la grilla se haya redibujado durante el mismo toque
    const trabaja = e.composedPath().some(n => n.id === 'place-grid' || (n.classList && (n.classList.contains('ship-chip') || n.classList.contains('rotar'))));
    if (trabaja) return;
    S.placing.deselect();
  });
  renderModes();
  renderResumeSlot();
  llegaSolo(() => renderSetup('cpu')); // desde la portada filtrada en Solo (D-145)
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
void GAME_ID;
