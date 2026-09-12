/**
 * Toque y Fama — lógica de juego.
 * Un solo reductor de mensajes sirve para los tres modos:
 *  - local:  ambos jugadores en este celular (transporte en memoria, roles A y B locales)
 *  - cpu:    A es humano, B es un bot con solver (transporte en memoria)
 *  - online: este celular tiene un rol; el otro celular el opuesto (transporte Firebase)
 * Cada dispositivo calcula automáticamente las respuestas para los intentos contra SU secreto.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti, shareLink, canShare } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { failWith } from '../assets/js/transport/errors.js';
import { score, isValid, randomSecret, Solver, sha256, randomNonce, verifyPlayer } from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, DIGIT_OPTIONS, LOCALES } from './rules.js';
import { createChat } from '../assets/js/chat.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart } from '../assets/js/transport/stats.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';

const lang = getLang();
const T = LOCALES[lang];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const triesWord = n => (n === 1 ? T.tryOne : T.tryMany);
const other = r => (r === 'A' ? 'B' : 'A');
const store = createSessionStore(GAME_ID, { legacyKeys: ['juegos-de-salon:tyf:session'] });
const names_ = createNameStore(GAME_ID);

let S = null;   // sesión: modo, transporte, roles locales, secretos, bot
let chat = null; // chat de sala: solo en dos celulares (canon C-15)
let M = null;   // partida: estado reconstruido desde los mensajes

/* ------------------------------------------------------------------ */
/* Estado de la partida (reductor)                                     */
/* ------------------------------------------------------------------ */
/**
 * Quién parte es determinista (no hay sorteo): en la primera partida parte el invitado (B) y en la
 * revancha parte quien perdió. Así el estado se reconstruye igual en ambos celulares y nadie puede manipularlo.
 */
function newMatch(config) {
  return { config, names: {}, commits: {}, starter: config.starter === 'A' ? 'A' : 'B', guesses: [], reveals: {}, rematch: {}, presence: {}, verify: {}, seen: new Set() };
}

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return; if (msg.id) M.seen.add(msg.id);
  const from = msg.from;
  switch (msg.t) {
    case 'hello': M.names[from] = msg.name; break;
    case 'commit': if (!M.commits[from]) M.commits[from] = { hash: msg.hash }; break;
    case 'guess': {
      const v = view();
      if (v.phase !== 'play' || v.pending || v.expected !== from) return;
      M.guesses.push({ from, value: msg.value, round: M.guesses.length, famas: null, toques: null });
      break;
    }
    case 'reply': {
      const g = M.guesses[msg.round];
      if (!g || g.famas !== null || g.from === from) return;
      g.famas = msg.famas; g.toques = msg.toques;
      if (S.bot && g.from === S.bot.role) S.bot.solver.learn(g.value, { famas: g.famas, toques: g.toques });
      break;
    }
    case 'reveal': if (!M.reveals[from]) M.reveals[from] = { secret: msg.secret, salt: msg.salt }; break;
    case 'rematch': if (!M.rematch[from]) M.rematch[from] = msg.code || true; break;
    // El chat no es parte del estado: se dibuja y se olvida (canon C-15)
    case 'chat': if (chat) chat.add(msg, { live: !!S?.live }); return 'chat';
  }
  return null;
}

/** Vista derivada del estado: fase, turno, resultado. */
function view() {
  const d = M.config.digits;
  const both = M.names.A && M.names.B;
  const committed = M.commits.A && M.commits.B;
  const starter = M.starter;
  const pending = M.guesses.find(g => g.famas === null) || null;
  const expected = starter ? (M.guesses.length % 2 === 0 ? starter : other(starter)) : null;
  // Resultado
  let done = false, winner = null, tie = false, replicaFor = null;
  for (let i = 0; i < M.guesses.length; i++) {
    const g = M.guesses[i];
    if (g.famas !== d) continue;
    if (g.from === starter && M.config.replica) {
      const rep = M.guesses[i + 1];
      if (!rep) { replicaFor = other(starter); break; }
      if (rep.famas === null) { replicaFor = other(starter); break; }
      done = true; if (rep.famas === d) tie = true; else winner = starter;
    } else { done = true; winner = g.from; }
    break;
  }
  let phase;
  if (!both) phase = 'lobby';
  else if (!committed) phase = 'secret';
  else if (!done) phase = 'play';
  else if (!(M.reveals.A && M.reveals.B)) phase = 'reveal';
  else phase = 'done';
  return { phase, pending, expected, done, winner, tie, replicaFor, starter };
}

/* ------------------------------------------------------------------ */
/* Sesión y agentes                                                    */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, bot = null, code = null, role = null }) {
  // Cambiar de sala (la revancha crea una nueva) es irse de la anterior para siempre: se
  // despide en vez de solo soltar los oyentes, así no queda una sala muerta viéndose viva.
  if (S?.transport) S.transport.dispose();
  S = { mode, transport, roles, secrets: {}, notes: {}, bot, code, role, repliedRounds: new Set(), lastShownRound: -1, cpuTimer: null, uiRole: null, live: false };
  M = newMatch(config);
  setupChat(mode);
  // Lo que llega en los primeros instantes es la historia de la sala al entrar: se dibuja sin ruido
  const sess = S;
  setTimeout(() => { if (S === sess) S.live = true; }, 1500);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { if (apply(m) === 'chat') return; onChange(); });
  transport.onPresence(p => { M.presence = p; renderPresence(); });
}

// Los cambios se procesan en serie (act() es asíncrono: sorteo y verificación usan SHA-256).
let chain = Promise.resolve();
function onChange() {
  chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e));
}

/** Acciones automáticas de los roles locales (responder, revelar, bot). */
async function act() {
  const v = view();
  for (const r of S.roles) {
    const sec = S.secrets[r];
    if (!sec) continue;
    if (v.phase === 'secret' && !M.commits[r]) { S.transport.send({ t: 'commit', from: r, hash: sec.hash }); }
    if (v.phase === 'play' && v.pending && v.pending.from !== r && !S.repliedRounds.has(v.pending.round)) {
      S.repliedRounds.add(v.pending.round);
      const { famas, toques } = score(v.pending.value, sec.secret);
      S.transport.send({ t: 'reply', from: r, round: v.pending.round, famas, toques });
    }
    if (v.phase === 'reveal' && !M.reveals[r]) { S.transport.send({ t: 'reveal', from: r, secret: sec.secret, salt: sec.salt }); }
  }
  // Bot
  if (S.bot) {
    const b = S.bot.role;
    if (v.phase === 'secret' && !S.secrets[b]) { await setSecret(b, randomSecret(M.config.digits, M.config)); }
    if (v.phase === 'play' && v.expected === b && !v.pending && !S.cpuTimer) {
      S.cpuTimer = setTimeout(() => { S.cpuTimer = null; const g = S.bot.solver.next(); if (g) S.transport.send({ t: 'guess', from: b, value: g }); }, 1400);
    }
  }
  if (v.phase === 'done' && !M.verify.A) { await verifyAll(); }
  saveSession();
}

async function setSecret(role, secret) {
  const salt = randomNonce(16);
  const hash = await sha256(secret + salt);
  S.secrets[role] = { secret, salt, hash };
  saveSession();
  onChange();
}

async function verifyAll() {
  for (const r of ['A', 'B']) {
    const rv = M.reveals[r];
    const repliesGiven = M.guesses.filter(g => g.from !== r && g.famas !== null).map(g => ({ value: g.value, famas: g.famas, toques: g.toques }));
    M.verify[r] = await verifyPlayer({ secret: rv.secret, salt: rv.salt, commit: M.commits[r].hash, repliesGiven });
  }
}

/* ------------------------------------------------------------------ */
/* Persistencia de la partida (todos los modos, canon C-6)             */
/* ------------------------------------------------------------------ */
function saveSession() {
  if (!S || !M) return;
  const done = view().phase === 'done';
  const secrets = {};
  for (const r of S.roles) if (S.secrets[r]) secrets[r] = S.secrets[r];
  const notes = {};
  for (const r of S.roles) if (S.notes[r]?.size) notes[r] = [...S.notes[r]];
  if (S.mode === 'online') {
    store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, secret: S.secrets[S.role] || null, notes: notes[S.role] || [], done });
  } else {
    store.save({ mode: S.mode, config: M.config, messages: S.transport.messages || [], private: { secrets, notes }, done });
  }
}
function loadSession() { return store.load(); }
function clearSession() { store.clear(); }

/** Retoma una partida de un celular o contra el celular reproduciendo sus mensajes. */
function restoreLocal(saved) {
  const transport = createLocalTransport({ seed: saved.messages || [] });
  const bot = saved.mode === 'cpu' ? { role: 'B', solver: new Solver(saved.config.digits, saved.config) } : null;
  startSession({ mode: saved.mode, transport, roles: ['A', 'B'], config: saved.config, names: {}, bot });
  for (const [r, sec] of Object.entries(saved.private?.secrets || {})) S.secrets[r] = sec;
  for (const [r, list] of Object.entries(saved.private?.notes || {})) S.notes[r] = new Set(list);
  // No repetir las transiciones ya vistas ni volver a responder intentos ya respondidos
  M.guesses.forEach(g => { if (g.famas !== null) { S.repliedRounds.add(g.round); S.lastShownRound = Math.max(S.lastShownRound, g.round); } });
  S.uiRole = null; // fuerza la pantalla de pase / tapada al retomar
  keepAwake();
  onChange();
}

/* ------------------------------------------------------------------ */
/* Navegación y componentes                                            */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

/** Teclado numérico con casillas. onSubmit(value). */
function keypad({ digits, zeroFirst, onSubmit, hidden = false, submitLabel = T.guess, notes = null, onNotesChange = null }) {
  let value = '';
  const LONG_PRESS_MS = 450;
  const boxes = Array.from({ length: digits }, () => el('div', { class: 'box' }));
  const entry = el('div', { class: 'entry' }, ...boxes);
  const keys = [];
  const ok = el('button', { class: 'ok', disabled: true, onClick: () => { if (isValid(value, digits, { zeroFirst })) { SFX.tap(); const v = value; value = ''; refresh(); onSubmit(v); } } }, submitLabel);
  const del = el('button', { class: 'del', onClick: () => { value = value.slice(0, -1); SFX.tap(); refresh(); } }, '⌫');
  const refresh = () => {
    boxes.forEach((b, i) => { b.textContent = value[i] || ''; b.className = 'box' + (value[i] ? ' filled' : '') + (hidden && value[i] ? ' hidden-digit' : '') + (i === value.length ? ' active' : ''); });
    keys.forEach(k => { const d = k.dataset.d; const blocked = notes ? notes.has(d) : false; k.classList.toggle('blocked', blocked); k.disabled = !blocked && (value.includes(d) || value.length >= digits || (value.length === 0 && d === '0' && !zeroFirst)); });
    ok.disabled = !isValid(value, digits, { zeroFirst });
  };
  const key = d => {
    let timer = null, longPressed = false;
    const b = el('button', { 'data-d': d,
      onClick: () => {
        if (longPressed) { longPressed = false; return; }
        if (notes && notes.has(d)) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); vibrate([20, 30, 20]); return; }
        if (value.length < digits && !value.includes(d)) { value += d; vibrate(8); SFX.tap(); refresh(); }
      },
      onPointerdown: () => {
        if (!notes) return;
        timer = setTimeout(() => {
          timer = null; longPressed = true;
          if (notes.has(d)) notes.delete(d); else { notes.add(d); value = value.replace(d, ''); }
          vibrate([30, 40, 30]); SFX.dice(); refresh(); onNotesChange && onNotesChange();
        }, LONG_PRESS_MS);
      },
      onPointerup: () => { if (timer) { clearTimeout(timer); timer = null; } },
      onPointerleave: () => { if (timer) { clearTimeout(timer); timer = null; } },
      onPointercancel: () => { if (timer) { clearTimeout(timer); timer = null; } },
      onContextmenu: e => { if (notes) e.preventDefault(); },
    }, d);
    return b;
  };
  for (let d = 1; d <= 9; d++) keys.push(key(String(d)));
  keys.push(key('0'));
  const pad = el('div', { class: 'keypad' }, ...keys.slice(0, 9), del, keys[9], ok);
  refresh();
  return el('div', {}, entry, pad);
}

/** Píldoras de pista. En los tableros van abreviadas (3F 1T) para que quepan en una línea; en la pantalla de respuesta, con palabra completa. */
function clueChips(g, big = false) {
  const d = M.config.digits;
  const wrap = el('div', { class: big ? 'reply-clue' : 'clue' });
  const F = n => big ? `${n} ${n === 1 ? T.fama : T.famas}` : `${n}${T.famaShort}`;
  const Tq = n => big ? `${n} ${n === 1 ? T.toque : T.toques}` : `${n}${T.toqueShort}`;
  if (g.famas === d) wrap.append(el('span', { class: 'f' }, `🎯 ${F(g.famas)}`));
  else {
    if (g.famas) wrap.append(el('span', { class: 'f' }, F(g.famas)));
    if (g.toques) wrap.append(el('span', { class: 't' }, Tq(g.toques)));
    if (!g.famas && !g.toques) wrap.append(el('span', { class: 'z' }, big ? T.none : '0'));
  }
  return wrap;
}

function showHandoff(stages, onDone) {
  const box = $('#handoff');
  box.hidden = false; box.className = 'handoff'; box.innerHTML = '';
  let i = 0;
  const next = () => {
    if (i >= stages.length) { box.classList.add('leaving'); setTimeout(() => { box.hidden = true; box.innerHTML = ''; onDone && onDone(); }, 300); return; }
    box.innerHTML = ''; box.append(stages[i++]); vibrate(15);
  };
  box.onclick = e => { if (!e.target.closest('button')) next(); };
  next();
  return next;
}

function passStage(name) {
  let adv = null;
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'phone' }, '📱'),
    el('div', { class: 'hint', style: 'font-size:1.05rem' }, T.hoPass),
    el('div', { class: 'next-name' }, name),
    el('button', { class: 'btn btn--cyan', onClick: e => { e.stopPropagation(); SFX.pass(); adv && adv(); } }, T.hoReady),
  );
  stage.setAdvance = fn => { adv = fn; };
  return stage;
}

function replyStage(g) {
  return el('div', { class: 'stage pop' },
    el('div', { class: 'hint' }, `${M.names[g.from]} · ${T.hoResult}`),
    el('div', { class: 'reply-big' }, g.value),
    clueChips(g, true),
    el('div', { class: 'hint', style: 'margin-top:14px' }, T.hoContinue + ' ›'),
  );
}

/** Respuesta al intento y, debajo, el pase del celular al siguiente jugador (una sola pantalla). */
function replyAndPassStage(g, nextName) {
  let adv = null;
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'hint' }, `${M.names[g.from]} · ${T.hoResult}`),
    el('div', { class: 'reply-big' }, g.value),
    clueChips(g, true),
    el('div', { class: 'pass-divider' }),
    el('div', { class: 'phone', style: 'font-size:3rem' }, '📱'),
    el('div', { class: 'hint', style: 'font-size:1.05rem' }, T.hoPass),
    el('div', { class: 'next-name', style: 'font-size:clamp(2.4rem, 12vw, 3.6rem)' }, nextName),
    el('button', { class: 'btn btn--cyan', onClick: e => { e.stopPropagation(); SFX.pass(); adv && adv(); } }, T.hoReady),
  );
  stage.setAdvance = fn => { adv = fn; };
  return stage;
}

function showCover(name, onReveal) {
  const c = $('#cover');
  c.hidden = false; c.innerHTML = '';
  c.append(el('div', {}, el('div', { class: 'eye' }, '🙈'), el('div', { class: 'hint', style: 'color:var(--muted);font-weight:800' }, T.hoPass), el('div', { class: 'big' }, name), el('button', { class: 'btn btn--cyan', style: 'margin-top:18px', onClick: () => { c.hidden = true; SFX.reveal(); onReveal && onReveal(); } }, T.tapToReveal)));
}

/* ------------------------------------------------------------------ */
/* Render principal                                                    */
/* ------------------------------------------------------------------ */
function render() {
  if (!M) return;
  const v = view();
  // El chat acompaña la sala, la partida y el resultado; muere con la sala (canon C-15, D-35)
  if (chat) chat.show();
  if (chat && v.phase === 'play' && v.expected === S.role && !v.pending) chat.closeIfIdle();
  switch (v.phase) {
    case 'lobby': renderLobby(); break;
    case 'secret': renderSecret(v); break;
    case 'play': renderPlay(v); break;
    case 'reveal': renderPlay(v); break;
    case 'done': renderResult(v); break;
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

function renderPresence() {
  if (!S || S.mode !== 'online' || !M) return;
  const v = view();
  if (v.phase === 'lobby') renderLobby();
  const o = other(S.role);
  const p = M.presence[o];
  if (v.phase === 'play' && p) $('#status-sub').textContent = p.online === false ? T.offline : statusSub(v);
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
  const box = $('#lobby-box');
  box.innerHTML = '';
  const url = `${location.origin}${location.pathname}?sala=${S.code}`;
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
function shareButton(url) {
  const btn = el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%;max-width:320px' }, canShare() ? T.shareLink : T.copyLink);
  btn.addEventListener('click', async () => {
    SFX.tap();
    const r = await shareLink({ title: T.title, text: fmt(T.shareText, { game: T.title, code: S.code }), url });
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

/** Fase de secreto: cada rol local sin secreto lo ingresa (en modo un celular, por turnos con pantalla tapada). */
function renderSecret() {
  const rolesNeeding = S.roles.filter(r => !S.secrets[r] && !(S.bot && S.bot.role === r));
  showScreen('screen-secret');
  const entry = $('#secret-entry');
  if (!rolesNeeding.length) {
    const waitingFor = ['A', 'B'].find(r => !M.commits[r]);
    $('#secret-title').textContent = T.secretSaved;
    $('#secret-hint').textContent = '';
    entry.innerHTML = '';
    $('#secret-status').innerHTML = '';
    $('#secret-status').append(el('span', { class: 'dots' }, fmt(T.waitingSecret, { name: M.names[waitingFor] || '…' })));
    return;
  }
  const r = rolesNeeding[0];
  const name = M.names[r];
  const build = () => {
    $('#secret-title').textContent = S.mode === 'local' ? fmt(T.secretFor, { name }) : T.secretTitle;
    $('#secret-hint').textContent = fmt(M.config.zeroFirst ? T.secretHint : T.secretHintNoZero, { n: M.config.digits });
    $('#secret-status').textContent = '';
    entry.innerHTML = '';
    entry.append(keypad({ digits: M.config.digits, zeroFirst: M.config.zeroFirst, hidden: S.mode === 'local', submitLabel: T.confirm, onSubmit: async val => { SFX.reveal(); await setSecret(r, val); } }));
  };
  if (S.mode === 'local' && S.uiRole !== r) { S.uiRole = r; entry.innerHTML = ''; showCover(name, build); } else build();
}

/** Recordatorio del número propio. En modo un celular parte oculto (el celular pasa de mano). */
function mySecretChip(role) {
  const secret = S.secrets[role].secret;
  let shown = S.mode !== 'local';
  const num = el('span', { class: 'num' });
  const hint = el('span', { class: 'hint' });
  const refresh = () => { num.textContent = shown ? secret : '•'.repeat(secret.length); hint.textContent = shown ? T.tapToHide : T.tapToShow; chip.classList.toggle('shown', shown); };
  const chip = el('button', { type: 'button', class: 'my-secret', onClick: () => { shown = !shown; vibrate(8); refresh(); } },
    el('span', { class: 'label' }, `🔒 ${T.mySecret}`), num, hint);
  refresh();
  return chip;
}

function statusSub(v) {
  if (v.replicaFor) return fmt(T.replicaNotice, { name: M.names[other(v.replicaFor)], other: M.names[v.replicaFor] });
  if (v.pending) return T.waitingReply;
  return fmt(T.round, { n: Math.floor(M.guesses.length / 2) + 1 });
}

function renderPlay(v) {
  showScreen('screen-play');
  $('#secret-entry').innerHTML = '';
  const myTurnRole = S.roles.includes(v.expected) && !(S.bot && S.bot.role === v.expected) ? v.expected : null;
  // Modo un celular: al completarse una respuesta, mostrar el resultado y pasar el celular
  if (S.mode === 'local') {
    const last = M.guesses[M.guesses.length - 1];
    if (last && last.famas !== null && last.round > S.lastShownRound) {
      S.lastShownRound = last.round;
      // Si sigue el juego: respuesta + pase en una sola pantalla. Si terminó: solo la respuesta.
      const passing = v.phase === 'play' && v.expected && v.expected !== S.uiRole;
      const stage = passing ? replyAndPassStage(last, M.names[v.expected]) : replyStage(last);
      const adv = showHandoff([stage], () => { S.uiRole = v.expected; renderPlay(view()); });
      if (passing) { stage.setAdvance(adv); $('#handoff').onclick = null; } // solo el botón avanza
      SFX.reveal();
      return;
    }
    // Si ya hay una transición en pantalla (respuesta → pase), un re-dibujo no debe reemplazarla.
    if (v.phase === 'play' && v.expected && S.uiRole !== v.expected && !v.pending && $('#handoff').hidden) {
      const ps = passStage(M.names[v.expected]);
      const adv = showHandoff([ps], () => { S.uiRole = v.expected; renderPlay(view()); });
      ps.setAdvance(adv);
      return;
    }
  }
  // CPU: anunciar el intento del celular
  if (S.mode === 'cpu') {
    const last = M.guesses[M.guesses.length - 1];
    if (last && last.from === S.bot.role && last.famas !== null && last.round > S.lastShownRound) { S.lastShownRound = last.round; SFX.reveal(); }
  }
  // Estado
  const who = $('#status-who'), sub = $('#status-sub');
  if (v.phase === 'reveal') { who.textContent = '…'; sub.textContent = T.waitingReply; }
  else if (myTurnRole) { who.textContent = fmt(T.turnYou, { name: M.names[other(myTurnRole)] }); sub.textContent = statusSub(v); }
  else { who.textContent = S.mode === 'cpu' && v.expected === S.bot.role ? T.cpuThinking : fmt(T.turnOther, { name: M.names[v.expected] }); sub.textContent = statusSub(v); }
  // Entrada (con recordatorio del número propio)
  const entry = $('#play-entry');
  entry.innerHTML = '';
  const reminderRole = S.mode === 'online' ? S.role : S.mode === 'cpu' ? 'A' : myTurnRole;
  if (reminderRole && S.secrets[reminderRole] && v.phase === 'play') entry.append(mySecretChip(reminderRole));
  if (myTurnRole && !v.pending && v.phase === 'play') {
    S.notes[myTurnRole] = S.notes[myTurnRole] || new Set();
    entry.append(
      keypad({ digits: M.config.digits, zeroFirst: M.config.zeroFirst, notes: S.notes[myTurnRole], onNotesChange: saveSession, onSubmit: val => { S.transport.send({ t: 'guess', from: myTurnRole, value: val }); } }),
      el('p', { class: 'block-hint' }, T.blockHint),
    );
  }
  // Tableros
  const boards = $('#boards');
  boards.innerHTML = '';
  for (const r of boardOrder()) boards.append(boardEl(r, v.expected === r && v.phase === 'play'));
  // Auto-scroll a la última fila
  const lastLi = boards.querySelector('li:last-child'); if (lastLi && M.guesses.length > 3) lastLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function boardOrder() { return S.mode === 'online' ? [S.role, other(S.role)] : ['A', 'B']; }

/** Tablero de intentos de un jugador (se usa en el juego y en el resultado). */
function boardEl(r, isTurn = false) {
  const mine = M.guesses.filter(g => g.from === r);
  const list = el('ol', {}, ...mine.map(g => el('li', { class: g.famas === M.config.digits ? 'hit' : '' }, el('span', { class: 'val' }, g.value), g.famas === null ? el('span', { class: 'clue' }, el('span', { class: 'z' }, '…')) : clueChips(g))));
  return el('div', { class: 'board' + (isTurn ? ' turn' : '') },
    el('h3', {}, fmt(T.boardOf, { name: M.names[r] })),
    el('div', { class: 'count' }, mine.length ? fmt(T.tries, { n: mine.length, word: triesWord(mine.length) }) : T.noGuesses),
    mine.length ? list : el('div', { class: 'empty' }, '—'),
  );
}

function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  if (!already) showScreen('screen-result');
  const meRole = S.mode === 'online' ? S.role : (S.mode === 'cpu' ? 'A' : null);
  const title = $('#result-title'), sub = $('#result-sub'), trophy = $('#result-trophy');
  if (v.tie) { title.textContent = T.tieTitle; trophy.textContent = '🤝'; sub.textContent = ''; }
  else {
    title.textContent = fmt(T.winTitle, { name: M.names[v.winner] });
    const tries = M.guesses.filter(g => g.from === v.winner).length;
    sub.textContent = (meRole ? (meRole === v.winner ? T.youWin + ' ' : T.youLose + ' ') : '') + fmt(T.inTries, { n: tries, word: triesWord(tries) });
    trophy.textContent = meRole && meRole !== v.winner ? '😵' : '🏆';
  }
  const secrets = $('#result-secrets'); secrets.innerHTML = '';
  for (const r of ['A', 'B']) {
    const ver = M.verify[r];
    // La verificación solo tiene sentido cuando el rival está en otro celular
    const verText = S.mode === 'online' && ver ? (ver.ok ? T.verified : T.notVerified) : '';
    secrets.append(el('div', { class: 's' }, el('small', {}, M.names[r]), el('div', { class: 'n' }, M.reveals[r].secret), el('small', {}, verText)));
  }
  // Repaso de la partida: colapsado por defecto para que los botones queden a la vista
  const replay = $('#result-replay');
  if (!already) replay.open = false;
  const rb = $('#result-boards'); rb.innerHTML = '';
  for (const r of boardOrder()) rb.append(boardEl(r));
  if (!already) { if (!meRole || meRole === v.winner || v.tie) { confetti({ count: 220, duration: 3500 }); SFX.win(); } else SFX.timeUp(); }
  renderResultActions(v);
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
  // Revancha propuesta por el rival (online): me uno a su sala nueva
  if (S.mode === 'online') {
    const code = M.rematch[o];
    if (typeof code === 'string' && code !== S.code && !S.switching) { S.switching = true; joinOnline(code, M.names[S.role]).catch(e => { console.error(e); S.switching = false; }); }
  }
}

/** En la revancha parte quien perdió (en empate, el que no partió). */
function nextStarterFor(roleMap) {
  const v = view();
  const loser = v.tie ? other(M.starter) : other(v.winner);
  return roleMap(loser);
}

async function rematch() {
  SFX.tap();
  if (S.mode === 'online') {
    if (M.rematch[S.role]) return;
    const o = other(S.role);
    if (typeof M.rematch[o] === 'string') { S.switching = true; return joinOnline(M.rematch[o], M.names[S.role]); }
    // Yo propongo: creo la sala nueva (seré A) y aviso. El rival entra como B.
    const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
    const t = createFirebaseTransport({ game: GAME_ID });
    const config = { ...M.config, starter: nextStarterFor(loser => (loser === S.role ? 'A' : 'B')) };
    S.switching = true;
    const code = await t.create({ config, name: M.names[S.role] });
    S.transport.send({ t: 'rematch', from: S.role, code });
    M.rematch[S.role] = code;
    renderResultActions(view());
    setTimeout(() => startOnline(t, code, 'A', M.names[S.role], config), 600);
  } else {
    const names = { ...M.names }, mode = S.mode;
    const config = { ...M.config, starter: nextStarterFor(loser => loser) };
    startLocalMode(mode, names, config);
  }
}

/* ------------------------------------------------------------------ */
/* Modos                                                               */
/* ------------------------------------------------------------------ */
function startLocalMode(mode, names, config) {
  clearSession();
  const transport = createLocalTransport();
  const bot = mode === 'cpu' ? { role: 'B', solver: new Solver(config.digits, config) } : null;
  startSession({ mode, transport, roles: ['A', 'B'], config, names, bot });
  keepAwake();
  trackStart({ game: GAME_ID, mode, players: mode === 'cpu' ? 1 : 2 }); // señal de uso para el panel (D-44)
}

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

async function joinOnline(code, name, previousRole = null, savedSecret = null, savedNotes = null) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG);
  if (savedNotes) S.notes[role] = new Set(savedNotes);
  if (savedSecret) { S.secrets[role] = savedSecret; onChange(); }
}

/* ------------------------------------------------------------------ */
/* Pantallas de inicio                                                 */
/* ------------------------------------------------------------------ */
function renderModes() {
  const box = $('#modes'); box.innerHTML = '';
  const modes = [['local', T.modeLocal, T.modeLocalHint], ['online', T.modeOnline, T.modeOnlineHint], ['cpu', T.modeCpu, T.modeCpuHint]];
  for (const [m, label, hint] of modes) box.append(el('button', { class: 'mode', onClick: () => { SFX.tap(); renderSetup(m); } }, el('span', {}, el('b', {}, label), el('small', {}, hint)), el('span', { class: 'go' }, '›')));
}

function renderResumeSlot() {
  const slot = $('#resume-slot'); slot.innerHTML = '';
  const saved = loadSession();
  if (!saved || saved.done) return;
  if (saved.mode === 'online' && !saved.code) return;
  const label = saved.mode === 'online' ? `${T.lobbyCode}: ${saved.code}` : { local: T.modeLocal, cpu: T.modeCpu }[saved.mode] || '';
  const resume = async () => {
    if (saved.mode === 'online') { try { await joinOnline(saved.code, saved.name, saved.role, saved.secret, saved.notes); } catch (e) { clearSession(); renderResumeSlot(); } }
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
  if (mode === 'local') form.append(nameField('A', T.p1), nameField('B', T.p2));
  else form.append(nameField('A', T.yourName, savedName));
  // Config (el que se une a una sala usa la config del anfitrión)
  const seg = el('div', { class: 'seg' }, ...DIGIT_OPTIONS.map(d => el('button', { type: 'button', class: d === config.digits ? 'on' : '', onClick: e => { config.digits = d; $$('button', seg).forEach(b => b.classList.toggle('on', b === e.currentTarget)); SFX.tap(); } }, d)));
  const sw = (key, label, hint) => { const b = el('button', { type: 'button', class: 'switch' + (config[key] ? ' on' : ''), onClick: () => { config[key] = !config[key]; b.classList.toggle('on', config[key]); SFX.tap(); } }); return el('div', { class: 'toggle-row' }, el('div', {}, el('b', {}, label), hint ? el('small', {}, hint) : null), b); };
  // Quien llega invitado no configura nada: la partida ya viene armada por el anfitrión.
  if (!prefillCode) form.append(el('div', { class: 'field' }, el('label', {}, T.digits), seg), sw('replica', T.replica, T.replicaHint), sw('zeroFirst', T.zeroFirst));
  const actions = $('#setup-actions'); actions.innerHTML = '';
  const fail = (msg) => { err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const getName = k => inputs[k].value.trim();
  const remember = n => names_.set(n);
  if (mode === 'local') {
    actions.append(el('button', { class: 'btn btn--yellow', onClick: () => { const a = getName('A'), b = getName('B'); if (!a || !b || a.toLowerCase() === b.toLowerCase()) return fail(T.errNames); SFX.tap(); startLocalMode('local', { A: a, B: b }, config); } }, T.start));
  } else if (mode === 'cpu') {
    actions.append(el('button', { class: 'btn btn--yellow', onClick: () => { const a = getName('A'); if (!a) return fail(T.errName); remember(a); SFX.tap(); startLocalMode('cpu', { A: a, B: T.cpuName }, config); } }, T.start));
  } else {
    const codeInput = el('input', { type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: prefillCode, autocapitalize: 'characters', autocomplete: 'off' });
    const busy = (b, on) => { b.disabled = on; };
    const createBtn = el('button', { class: 'btn btn--yellow', onClick: async () => { const a = getName('A'); if (!a) return fail(T.errName); remember(a); SFX.tap(); busy(createBtn, true); try { await createOnline(a, config); } catch (e) { failWith(e, T, fail); } busy(createBtn, false); } }, T.create);
    const joinBtn = el('button', { class: 'btn btn--cyan', onClick: async () => {
      const a = getName('A'); const code = codeInput.value.trim().toUpperCase();
      if (!a) return fail(T.errName); if (!/^[A-Z]{4}$/.test(code)) return fail(T.errCode);
      remember(a); SFX.tap(); busy(joinBtn, true);
      try { await joinOnline(code, a); } catch (e) { failWith(e, T, fail); }
      busy(joinBtn, false);
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
      actions.append(createBtn, el('div', { class: 'or' }, '— o —'), joinPanel(el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.joinTitle)));
    }
    if (prefillCode) setTimeout(() => inputs.A.focus(), 100);
  }
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
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
    if (saved && saved.code === code.toUpperCase() && !saved.done) { joinOnline(saved.code, saved.name, saved.role, saved.secret, saved.notes).catch(() => { clearSession(); renderSetup('online', code.toUpperCase()); }); }
    else renderSetup('online', code.toUpperCase());
  }
}
init();
// Gancho de depuración (solo lectura) para pruebas automatizadas.
window.__tyf = { view: () => (M ? view() : null), match: () => M, session: () => S };
