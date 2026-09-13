/**
 * El Ahorcado — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7):
 *  - local: 2 a 6 jugadores en este celular, en serie · online: todos a la vez · solo: uno contra el mazo
 * Con mazo la palabra sale de la semilla y cada aparato la resuelve solo; con cadena vive en el
 * celular de quien la escribió, que responde letra por letra y la revela al final (C-10).
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti, shareLink, canShare } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { failWith } from '../assets/js/transport/errors.js';
import { showHandoff, passBlock, showCover } from '../assets/js/handoff.js';
import { createChat } from '../assets/js/chat.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart } from '../assets/js/transport/stats.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import {
  ALPHABETS, LIVES_OPTIONS, MAX_LETTERS, buildState, dealWords, normalize,
  positionsOf, randomNonce, randomSeed, rarest, readPos, sha256, shapeOf, shuffleSeeded, verifySetter, wordProblem,
} from './engine.js';
import { DECKS, getDeck } from './decks/index.js';
import { GAME_ID, DEFAULT_CONFIG, GALLOWS, PARTS, MAX_HINT, MIN_PLAYERS, MAX_PLAYERS, LOCALES } from './rules.js';

const lang = getLang();
const T = LOCALES[lang];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
const ALPHA = ALPHABETS[lang] || ALPHABETS.es;
/** Cuántas palabras del mazo se le ofrecen a quien escribe (D-62). */
const SUGGEST_N = 6;
/** Cuánto dura el cartel de acierto o error (D-63). Dos segundos y no uno: con uno la jugada
 *  pasaba antes de que el jugador levantara la vista del teclado. */
const FLASH_MS = 2000;
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);

/** De dónde sale la palabra, en el orden en que se muestra en la configuración (D-53). */
const SOURCES = [
  { id: 'chain', emoji: '🤝', label: () => T.srcChain, hint: () => T.srcChainHint },
  { id: 'deck', emoji: '🎴', label: () => T.srcDeck, hint: () => T.srcDeckHint },
];

let S = null;    // sesión: modo, transporte, roles locales, palabras propias, selección
let M = null;    // partida: config, nombres, palabras anunciadas y jugadas
let chat = null; // chat de sala: solo en varios celulares (canon C-15)

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
function newMatch(config) {
  return { config, players: config.players || null, names: {}, words: {}, plays: [], replies: [], reveals: {}, rematch: {}, presence: {}, verify: null, seen: new Set() };
}

/** Roles cuya palabra la reparte el mazo. Contra el celular, la del humano (A). */
function deckRoles() {
  if (!M.players) return [];
  if (S.mode === 'solo') return ['A'];
  return M.config.source === 'deck' ? M.players.slice() : [];
}
const idxOf = r => M.players.indexOf(r);
/** La cadena: cada uno le escribe la palabra al siguiente, y el último al primero (D-53). */
const targetOf = r => M.players[(idxOf(r) + 1) % M.players.length];
const setterOf = r => M.players[(idxOf(r) - 1 + M.players.length) % M.players.length];
const playCount = role => M.plays.filter(p => p.from === role).length;
/** En varios celulares todos juegan a la vez; pasándose el celular, por turnos. */
// Turnos alternados en las dos formas que se juegan de a varios: se sigue la secuencia y se
// compite. Jugando solo no hay turno que esperar (D-59, D-65, D-66).
const hasTurns = () => S.mode !== 'solo';

/** Jugadas con la respuesta pegada: con mazo el motor no la necesita, con cadena sí. */
function playsResolved() {
  const n = {};
  return M.plays.map(p => {
    const i = (n[p.from] = (n[p.from] ?? -1) + 1);
    const r = M.replies.find(x => x.to === p.from && x.n === i);
    return r ? { ...p, letter: r.letter, pos: r.pos } : p;
  });
}

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return; if (msg.id) M.seen.add(msg.id);
  switch (msg.t) {
    case 'hello': M.names[msg.from] = msg.name; break;
    case 'start': {
      if (M.players || msg.from !== 'A') return;                     // solo el anfitrión y una vez
      const order = (msg.order || []).filter(r => M.names[r]);
      if (order.length >= MIN_PLAYERS) { M.players = order; M.config = { ...M.config, seed: msg.seed ?? M.config.seed }; }
      break;
    }
    case 'word': {
      if (!M.players || M.words[msg.to] || deckRoles().includes(msg.to)) return;
      if (msg.from !== setterOf(msg.to)) return;                     // la palabra la pone quien va antes
      if (!msg.shape || !/^[. ]+$/.test(msg.shape)) return;
      M.words[msg.to] = { shape: msg.shape, hint: String(msg.hint || '').slice(0, MAX_HINT), hash: msg.hash || null };
      break;
    }
    case 'guess': case 'buy': {
      const v = view();
      if (v.lobby || v.phase !== 'play') return;
      const s = v.st[msg.from];
      if (!s || s.done || s.pending) return;
      if (v.current && v.current !== msg.from) return;               // fuera de turno
      if (msg.n !== playCount(msg.from)) return;                     // repetida o desordenada
      const ms = Number.isFinite(msg.ms) ? msg.ms : 0;
      if (msg.t === 'buy') { if (!s.canBuy) return; M.plays.push({ from: msg.from, buy: true, ms }); break; }
      const letter = normalize(msg.letter);
      if (letter.length !== 1 || !ALPHA.includes(letter) || s.used.includes(letter)) return;
      M.plays.push({ from: msg.from, letter, ms });
      break;
    }
    case 'reply': {
      if (!M.players || deckRoles().includes(msg.to)) return;
      if (msg.from !== setterOf(msg.to)) return;
      if (M.replies.some(r => r.to === msg.to && r.n === msg.n)) return;
      const pos = readPos(msg.pos);
      if (!pos) return;
      M.replies.push({ to: msg.to, n: msg.n, letter: normalize(msg.letter), pos });
      break;
    }
    case 'reveal': if (!M.reveals[msg.to] && msg.from === setterOf(msg.to)) M.reveals[msg.to] = { word: msg.word, salt: msg.salt }; break;
    case 'rematch': if (!M.rematch[msg.from]) M.rematch[msg.from] = msg.code || true; break;
    // El chat no es parte del estado de la partida: se dibuja y se olvida (canon C-15)
    case 'chat': if (chat) chat.add(msg, { live: !!S?.live }); return 'chat';
  }
  return null;
}

/** Vista derivada: palabras, patrones, vidas, turno y ganador. */
function view() {
  if (!M.players) return { lobby: true, phase: 'lobby', done: false, players: [], st: {} };
  const deck = getDeck(M.config.theme);
  const byId = Object.fromEntries(deck.cards.map(c => [c.id, c]));
  const dr = deckRoles();
  // A la vez, la misma palabra para toda la mesa; en serie, una distinta por jugador (D-54)
  const dealt = dr.length ? dealWords({ cards: deck.cards, seed: M.config.seed, roles: dr, same: S.mode === 'online' }) : {};
  const words = {}, declared = {}, cards = {};
  for (const r of M.players) {
    if (dr.includes(r)) {
      const c = byId[dealt[r]]; cards[r] = c;
      words[r] = c[lang].w;
      declared[r] = { shape: shapeOf(c[lang].w), hint: c[lang].hint };
    } else {
      const w = M.words[r];
      if (w) declared[r] = { shape: w.shape, hint: w.hint };
      const mine = S.secrets?.[r];
      if (mine) words[r] = mine.word;    // la puse yo: este aparato la resuelve sin preguntar
    }
  }
  // Quién está fuera ahora mismo: solo importa en la sala, y solo para no trabar el turno (D-66)
  const away = S.mode === 'online' ? M.players.filter(r => M.presence[r]?.online === false) : [];
  const st = buildState({ players: M.players, config: { ...M.config, turns: hasTurns(), away }, words, declared, plays: playsResolved(), lang });
  return { ...st, lobby: false, deck, cards, words, declared };
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, code = null, role = null, secrets = {} }) {
  // Cambiar de sala (la revancha crea una nueva) es irse de la anterior para siempre.
  if (S?.transport) S.transport.dispose();
  S = { mode, transport, roles, code, role, secrets, sent: {}, uiRole: null, uiWriter: null, uiWrite: null, sel: null, shownDone: new Set(), shownPlays: 0, hold: null, usedShown: {}, flashShown: {}, finAt: null, live: false, busy: false };
  M = newMatch(config);
  setupChat(mode);
  const sess = S;
  setTimeout(() => { if (S === sess) S.live = true; }, 1500);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { if (apply(m) === 'chat') return; onChange(); });
  transport.onPresence(p => { M.presence = p; if (view().lobby) renderLobby(); });
}

let chain = Promise.resolve();
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

/** Lo que hacen solos los roles de este celular: responder las jugadas del rival y revelar. */
async function act() {
  saveSession();
  if (!M?.players) return;
  const v = view();

  // 1. Responder las jugadas de quien está adivinando una palabra que escribí yo
  for (const [to, sec] of Object.entries(S.secrets)) {
    if (!M.players.includes(to)) continue;
    const suyas = M.plays.filter(x => x.from === to);
    for (let n = 0; n < suyas.length; n++) {
      if (M.replies.some(r => r.to === to && r.n === n)) continue;
      const antes = M.replies.filter(r => r.to === to && r.n < n).map(r => r.letter);
      if (antes.length !== n) break;          // falta responder una anterior: esta espera su turno
      const letter = suyas[n].buy ? rarest(sec.word, antes, lang) : suyas[n].letter;
      if (!letter) break;
      // Las posiciones viajan como texto, no como lista: Firebase no guarda una lista vacía, y una
      // letra que no está es justamente la lista vacía. Ver D-60.
      // Si el otro lado descartara esta respuesta, act() la volvería a mandar en cada vuelta:
      // un bucle de escrituras contra la sala. Se reintenta unas pocas veces y se para (D-60).
      const clave = `${to}:${n}`;
      if ((S.sent[clave] = (S.sent[clave] || 0) + 1) > 3) break;
      S.transport.send({ t: 'reply', from: setterOf(to), to, n, letter, pos: positionsOf(sec.word, letter).join(',') });
      break;                                  // una por vez: la siguiente sale con el estado ya al día
    }
  }

  // 2. Al terminar se revelan las palabras propias y se verifica al resto (C-10)
  if (v.done) {
    for (const [to, sec] of Object.entries(S.secrets)) {
      if (M.players.includes(to) && !M.reveals[to]) S.transport.send({ t: 'reveal', from: setterOf(to), to, word: sec.word, salt: sec.salt });
    }
    if (!M.verify && M.players.every(r => v.declared[r] && (deckRoles().includes(r) || M.reveals[r]))) await verifyAll();
  }
}

/** Comprueba el hash y recalcula todas las respuestas que dio cada uno (C-10). */
async function verifyAll() {
  const out = {};
  for (const r of M.players) {
    if (deckRoles().includes(r)) continue;
    const rev = M.reveals[r], dec = M.words[r];
    if (!rev || !dec?.hash) continue;
    out[r] = await verifySetter({ word: rev.word, salt: rev.salt, commit: dec.hash, replies: M.replies.filter(x => x.to === r) });
  }
  M.verify = out;
}

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  const done = M.players ? view().done : false;
  if (S.mode === 'online') store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, private: S.secrets, done });
  else store.save({ mode: S.mode, config: M.config, messages: S.transport.messages || [], private: S.secrets, done });
}
const loadSession = () => store.load();
const clearSession = () => store.clear();

async function resume(saved) {
  if (saved.mode === 'online') return joinOnline(saved.code, saved.name, saved.role, saved.private || {});
  const transport = createLocalTransport({ seed: saved.messages || [] });
  startSession({
    mode: saved.mode, transport, roles: saved.config.players, config: saved.config, names: {},
    secrets: saved.private || {},
  });
  S.uiRole = null;      // al retomar se vuelve a la pantalla de pase: nadie sabe quién tenía el celular
  keepAwake();
  onChange();
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

function render() {
  if (!M) return;
  // Con un veredicto o una pantalla de pase arriba, no se redibuja: un mensaje que llega
  // (una respuesta, una jugada del rival) borraría lo que el jugador está leyendo. Al cerrarse,
  // el propio overlay vuelve a llamar a render() con el estado de ese momento.
  if (!$('#handoff').hidden || !$('#cover').hidden) return;
  if (chat) chat.show();
  const v = view();
  if (v.lobby) return renderLobby();
  if (v.phase === 'words') return renderWords(v);
  // El veredicto del último turno se muestra antes del resultado: si no, nadie ve su palabra
  if (showTurnVerdict(v)) return;
  if (v.done && !ultimaLetra(v)) return renderResult(v);
  renderPlay(v);
}

/**
 * Jugando solo, la letra que cierra la palabra merece verse: sin esto la pantalla de resultado
 * entraba encima del cartel y la última jugada pasaba sin que se viera (D-63, D-65).
 * Devuelve true mientras haya que seguir mostrando el tablero.
 */
function ultimaLetra(v) {
  if (S.mode !== 'solo' || !v.done) return false;
  if (S.finAt == null) {
    S.finAt = Date.now() + FLASH_MS;
    const sess = S;
    setTimeout(() => { if (S === sess) onChange(); }, FLASH_MS + 80);
    return true;
  }
  return Date.now() < S.finAt;
}

/**
 * Lo que pasó en el turno que acaba de terminar, antes de seguir (C-9).
 *
 *  - Un celular: después de CADA letra, porque después de cada letra el celular cambia de mano.
 *    El resultado y el "pásale el celular a X" van en la misma pantalla, nunca uno sin el otro.
 *  - Contra el celular y varios celulares: solo cuando alguien termina su palabra. Ahí nadie se
 *    pasa nada, y tapar la pantalla por cada letra sería estorbar (D-56).
 *  - En varios celulares, además, solo el propio: que a alguien le tapen la pantalla en plena
 *    carrera para contarle cómo le fue a otro es peor que no contárselo; para eso está la tira.
 */
function showTurnVerdict(v) {
  if (!v.ready) return false;
  // Jugando solo no hay veredicto de ronda: no hay a quién pasarle el celular y la pantalla
  // final dice exactamente lo mismo, así que eran dos "¡La sacaste!" seguidos (D-65).
  const cerrado = S.mode === 'solo' ? null
    : M.players.find(r => v.st[r].done && !S.shownDone.has(r) && (S.mode !== 'online' || r === S.role));
  const porLetra = S.mode === 'local' && !cerrado && M.plays.length > S.shownPlays;
  S.shownPlays = M.plays.length;
  if (!cerrado && !porLetra) return false;
  const quien = cerrado || M.plays[M.plays.length - 1].from;
  if (cerrado) S.shownDone.add(cerrado);
  S.sel = null;
  // Al celular no se le pasa el celular, y en varios celulares no se pasa nada
  const siguiente = S.mode === 'local' && v.current && v.current !== quien ? M.names[v.current] : null;
  if (chat) chat.close();
  const stage = cerrado ? roundVerdict(cerrado, v, siguiente) : letterVerdict(quien, v, siguiente);
  const gen = (S.verdictGen = (S.verdictGen || 0) + 1);
  const seguir = showHandoff([stage], () => { S.uiRole = view().current; onChange(); }, { tapAdvances: !siguiente });
  // El resultado de una letra sin pase de por medio se cierra solo: es el último que queda jugando
  if (!siguiente && !cerrado) setTimeout(() => { if (S.verdictGen === gen && !$('#handoff').hidden) seguir(); }, 1700);
  return true;
}

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

/* ---------- Sala (varios celulares) ---------- */
async function leaveRoom(btn) {
  SFX.tap();
  if (btn) btn.disabled = true;
  clearSession();
  await S.transport.dispose();
  location.href = location.pathname;
}

function renderLobby() {
  if (S.mode !== 'online' || !M) return;
  showScreen('screen-lobby');
  const box = $('#lobby-box'); box.innerHTML = '';
  const url = `${location.origin}${location.pathname}?sala=${S.code}`;
  const joined = ROLES.filter(r => M.names[r]);
  box.append(
    el('div', { class: 'muted', style: 'font-weight:800' }, T.lobbyCode),
    el('div', { class: 'code-big' }, S.code),
    el('div', { class: 'qr', id: 'qr' }),
    el('p', { class: 'muted', style: 'font-size:0.9rem' }, T.lobbyShare),
    shareButton(url),
    el('p', { class: 'lead', style: 'margin:12px 0 4px' }, `${T.lobbyPlayers} (${joined.length}/${MAX_PLAYERS})`),
    el('div', { class: 'lobby-players' }, ...joined.map(r => el('span', { class: 'p' + (r === S.role ? ' me' : '') + (M.presence[r]?.online === false ? ' off' : '') }, M.names[r]))),
    S.role === 'A'
      ? el('button', { class: 'btn btn--yellow', disabled: joined.length < MIN_PLAYERS, onClick: () => { SFX.pass(); S.transport.send({ t: 'start', from: 'A', order: joined, seed: M.config.seed }); } }, joined.length < MIN_PLAYERS ? T.lobbyNeedMore : T.lobbyStart)
      : el('p', { class: 'waiting' }, el('span', { class: 'dots' }, fmt(T.lobbyWaitHost, { name: M.names.A || '…' }))),
    el('button', { class: 'btn btn--ghost btn--sm', style: 'margin-top:10px', onClick: e => leaveRoom(e.currentTarget) }, S.role === 'A' ? T.lobbyCancel : T.lobbyLeave),
  );
  renderQr(url);
}

function shareButton(url) {
  const btn = el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%;max-width:320px' }, canShare() ? T.shareLink : T.copyLink);
  btn.addEventListener('click', async () => {
    SFX.tap();
    const deck = getDeck(M.config.theme);
    const r = await shareLink({ title: T.title, text: fmt(T.shareText, { game: T.title, theme: `${deck.emoji} ${deck.name[lang]}`, code: S.code }), url });
    if (r === 'copied') { btn.textContent = T.copied; setTimeout(() => { btn.textContent = canShare() ? T.shareLink : T.copyLink; }, 2000); }
  });
  return btn;
}

async function renderQr(url) {
  try {
    if (!window.qrcode) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; sc.onload = res; sc.onerror = rej; document.head.append(sc); });
    const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    const box = $('#qr'); if (box) box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (_) { const box = $('#qr'); if (box) box.remove(); }
}

/* ---------- Escribir la palabra (cadena) ---------- */
/** Quién tiene que escribir ahora en este celular, y para quién. */
function pendingWrite(v) {
  const falta = r => !v.declared[r];
  if (S.mode === 'online') { const t = falta(targetOf(S.role)) ? targetOf(S.role) : null; return t ? { setter: S.role, target: t } : null; }
  const setter = M.players.find(r => falta(targetOf(r)));
  return setter ? { setter, target: targetOf(setter) } : null;
}

/**
 * Palabras del mazo para ofrecerle a quien escribe (D-62). Salen de la temática elegida, que con
 * cadena no repartía nada y por eso no se entendía para qué se pedía. Son una ayuda, no una regla:
 * quien escribe puede tomar una, editarla o ignorarlas y poner la suya.
 * Se calculan en este celular y no viajan: la palabra sigue siendo secreta (C-10).
 */
function suggestFor(setter) {
  const deck = getDeck(M.config.theme);
  // Las que ya se pusieron desde este mismo celular no se vuelven a ofrecer
  const usadas = new Set(Object.values(S.secrets || {}).map(x => normalize(x.word)));
  // La semilla corre con el jugador: cada uno ve otras, y la misma partida ofrece lo mismo al volver
  return shuffleSeeded(deck.cards, (M.config.seed >>> 0) + idxOf(setter) * 7919)
    .filter(c => c[lang]?.w && !usadas.has(normalize(c[lang].w)))
    .slice(0, SUGGEST_N);
}

function renderWords(v) {
  const pend = pendingWrite(v);
  showScreen('screen-word');
  // En varios celulares todos escriben a la vez: la palabra que manda otro llega como mensaje y
  // redibuja la pantalla. Si el formulario se rehiciera, borraría lo que este jugador va tecleando.
  const clave = pend ? `${pend.setter}:${pend.target}` : '';
  if (pend && S.uiWrite === clave && $('#word-form').children.length) return;
  S.uiWrite = clave;
  const form = $('#word-form'), actions = $('#word-actions'), err = $('#word-error'), status = $('#word-status');
  form.innerHTML = ''; actions.innerHTML = ''; err.textContent = ''; status.textContent = '';

  if (!pend) {
    const faltan = M.players.filter(r => !v.declared[r]);
    $('#word-title').textContent = T.wordSaved;
    $('#word-sub').textContent = '';
    status.textContent = faltan.length === 1
      ? fmt(T.waitingWords, { name: M.names[setterOf(faltan[0])] || '…' })
      : fmt(T.waitingWordsMany, { n: faltan.length });
    status.className = 'center muted dots';
    return;
  }

  // En un celular hay que tapar la pantalla antes de que escriba el siguiente (C-9)
  if (S.mode === 'local' && S.uiWriter !== pend.setter) {
    showCover({ label: T.coverLabel, name: M.names[pend.setter], button: T.coverTap, onReveal: () => { S.uiWriter = pend.setter; SFX.pass(); render(); } });
    return;
  }
  S.uiWriter = pend.setter;

  $('#word-title').textContent = fmt(T.wordTitle, { name: M.names[pend.target] || '' });
  $('#word-sub').textContent = T.wordHint;
  const wordIn = el('input', { class: 'word-in', type: 'text', maxlength: MAX_LETTERS + 6, placeholder: T.wordPlaceholder, autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false' });
  const hintIn = el('input', { type: 'text', maxlength: MAX_HINT, placeholder: T.hintPlaceholder, autocomplete: 'off' });
  // Las sugerencias van arriba de los campos: se miran antes de ponerse a pensar una (D-62)
  const deck = getDeck(M.config.theme);
  const sugeridas = suggestFor(pend.setter);
  if (sugeridas.length) {
    const chips = el('div', { class: 'suggest' }, ...sugeridas.map(c => el('button', {
      type: 'button', class: 'sug',
      onClick: () => {
        wordIn.value = normalize(c[lang].w);
        hintIn.value = c[lang].hint;
        err.textContent = '';
        SFX.tap(); vibrate(8);
        $$('button', chips).forEach(b => b.classList.remove('on'));
        chips.querySelector(`[data-id="${c.id}"]`)?.classList.add('on');
      },
      'data-id': c.id,
    }, el('span', { class: 'em' }, c.emoji || '🎲'), el('b', {}, normalize(c[lang].w)))));
    // Si después la escribe a su manera, la sugerencia deja de estar marcada: ya no es esa
    wordIn.addEventListener('input', () => $$('button', chips).forEach(b => b.classList.remove('on')));
    form.append(el('div', { class: 'field' },
      el('label', {}, fmt(T.suggestLabel, { theme: `${deck.emoji} ${deck.name[lang]}` })),
      chips,
      el('p', { class: 'sub' }, T.suggestHint),
    ));
  }
  form.append(
    el('div', { class: 'field' }, el('label', {}, T.wordPlaceholder), wordIn),
    el('div', { class: 'field' }, el('label', {}, T.hintLabel), hintIn),
  );
  const fail = key => { err.textContent = T[key] || key; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const save = el('button', { class: 'btn btn--yellow', onClick: async () => {
    const problem = wordProblem(wordIn.value, lang);
    if (problem) return fail(problem);
    if (!hintIn.value.trim()) return fail('errHint');
    save.disabled = true;
    SFX.tap();
    try {
      await setWord(pend.setter, pend.target, wordIn.value, hintIn.value.trim());
    } catch (_) {
      // Comprometer la palabra necesita crypto.subtle, y eso pide https o localhost (C-10).
      // Sin eso el botón se quedaba muerto y sin decir nada: pasa al abrir el juego por la IP
      // de la red para probarlo desde un celular.
      save.disabled = false;
      fail('errSecure');
    }
  } }, T.wordSave);
  actions.append(save);
  setTimeout(() => wordIn.focus(), 50);
}

/** Guarda la palabra en este celular y publica solo su forma, su pista y el hash (C-10). */
async function setWord(setter, target, word, hint) {
  const w = normalize(word);
  const salt = randomNonce(16);
  const hash = await sha256(w + salt);
  S.secrets[target] = { word: w, salt, hash };
  S.uiWriter = null;
  S.uiWrite = null;
  S.transport.send({ t: 'word', from: setter, to: target, shape: shapeOf(w), hint, hash });
}

/* ---------- Partida ---------- */
function gallowsSvg(wrong, lives, animate) {
  const parts = PARTS[lives] || PARTS[6];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 120 150');
  svg.setAttribute('aria-hidden', 'true');
  const path = (d, cls) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); p.setAttribute('pathLength', '1'); p.setAttribute('class', cls);
    return p;
  };
  GALLOWS.forEach((d, i) => svg.append(path(d, 'frame' + (i === 3 ? ' rope' : ''))));
  parts.slice(0, wrong).forEach((d, i) => svg.append(path(d, 'part' + (animate && i === wrong - 1 ? ' draw' : ''))));
  return svg;
}

function renderPlay(v) {
  showScreen('screen-play');
  // Con turnos alternados, la jugada del celular duraría un parpadeo: se retiene su tablero un
  // momento después de que juega, para que se alcance a ver qué probó y cómo le fue (D-59).
  const reten = S.hold && S.hold.until > Date.now() ? S.hold.role : null;
  // Sin turnos no hay "current": jugando solo el tablero es siempre el propio
  const me = S.mode === 'online' ? S.role : (reten || v.current || S.roles[0]);
  const mine = S.mode === 'online' ? v.current === S.role : !reten && S.roles.includes(me);
  // El tablero retenido es siempre el propio (D-63): ahí no se puede jugar, pero el título sigue
  // hablándole al jugador. Decirle "le toca a Javi" sobre su propio tablero es un parpadeo confuso.
  const mio = !!reten && S.roles.includes(reten);

  // Pantalla de pase suelta: solo en un celular, y solo para entrar al primer turno o al retomar.
  // Después de cada jugada el pase viaja pegado a su veredicto, que es lo que pide el canon C-9.
  // Contra el celular no existe: el aparato no le pasa el aparato a nadie.
  if (S.mode === 'local' && S.uiRole !== v.current) {
    showHandoff([passBlock({ label: T.hoPass, name: M.names[v.current], button: T.hoReady })], () => { S.uiRole = view().current; S.sel = null; onChange(); }, { tapAdvances: false });
    return;
  }

  const s = v.st[me];
  if (!s) return;
  flashFor(me, s);
  const puedeJugar = !!(mine && !s.done && !s.pending);

  // Cronómetro de la jugada: parte cuando el jugador ya ve el tablero
  const key = `${me}:${s.used.length}`;
  if (S.turnKey !== key) { S.turnKey = key; S.turnStart = Date.now(); }

  const esperando = s.done ? M.players.find(r => !v.st[r].done) : null;
  $('#status-who').textContent = s.done ? (s.solved ? T.solvedTitle : T.hangedTitle)
    // Sin turnos —varios celulares— nadie espera a nadie: decir "te toca" ahí sobra y confunde
    : !hasTurns() ? fmt(T.yourWord, { name: M.names[me] || '' })
    : mine || mio ? fmt(T.turnYou, { name: M.names[me] || '' })
    : fmt(T.turnOther, { name: M.names[v.current] || M.names[me] || '' });
  // El aviso es sobre los demás: quien mira la pantalla nunca está desconectado de sí mismo
  const offline = S.mode === 'online' ? M.players.find(r => r !== S.role && M.presence[r]?.online === false && M.names[r] && !v.st[r].done) : null;
  $('#status-sub').textContent = offline ? fmt(T.offline, { name: M.names[offline] })
    : esperando ? fmt(T.waitingTurn, { name: M.names[esperando] })
    : s.pending ? '…'
    : '';

  // Sonido y sacudida de la última letra (en un celular ya sonó en el veredicto del turno)
  if (soundFor(me, s)) {
    if (!s.last?.ok && !s.last?.buy) { const w = $('#word'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); }
    if (s.lives === 1 && !s.done) setTimeout(() => SFX.heartbeat(), 400);
  }

  // El dibujo
  const box = $('#gallows'); box.innerHTML = '';
  box.classList.toggle('last', s.lives === 1 && !s.done);
  box.append(gallowsSvg(s.wrong, M.config.lives, true));

  // Vidas y pista
  const lives = $('#lives'); lives.innerHTML = '';
  lives.classList.toggle('danger', s.lives <= 1);
  for (let i = 0; i < M.config.lives; i++) lives.append(el('span', { class: 'dot' + (i < s.lives ? '' : ' gone') }));
  lives.append(el('span', { class: 'n' }, s.lives === 1 ? T.oneLifeLeft : fmt(T.livesLeft, { n: s.lives })));
  const hint = $('#hint'); hint.innerHTML = '';
  hint.append(el('b', {}, T.hintIs), el('span', {}, s.hint || '—'));

  // La palabra
  const word = $('#word'); word.innerHTML = '';
  word.classList.toggle('long', s.shape.length > 10);
  s.pattern.split('').forEach((c, i) => {
    if (c === ' ') return word.append(el('span', { class: 'sp' }));
    const shown = c !== '.';
    const comprada = shown && s.boughtSet.has(s.at[i]);
    word.append(el('span', { class: 'ch' + (shown ? (comprada ? ' on bought' : ' on') : '') }, shown ? c : ''));
  });

  // Los demás: vidas y avance, nunca qué letras (D-55)
  const rivals = $('#rivals'); rivals.innerHTML = '';
  if (M.players.length > 1) {
    for (const r of M.players) {
      const rs = v.st[r];
      const pct = rs.total ? Math.round(100 * (rs.total - rs.left) / rs.total) : 0;
      // Con turnos, de quién es el turno es lo que más se mira: va marcado en la tira (D-66)
      rivals.append(el('div', { class: 'r' + (r === me ? ' me' : '') + (r === v.current ? ' turn' : '') + (rs.hanged ? ' dead' : '') + (rs.solved ? ' won' : '') + (M.presence[r]?.online === false ? ' off' : '') },
        el('div', { class: 'who' }, el('span', {}, M.names[r] || '…'), el('span', { class: 'lv' }, rs.hanged ? '💀' : `${rs.lives}❤`)),
        el('div', { class: 'bar' }, el('i', { style: `width:${rs.solved ? 100 : pct}%` })),
      ));
    }
  }

  // Teclado. Mientras le toca a otro no hay nada que tocar, así que no se muestra: una botonera
  // entera apagada ocupa media pantalla para decir "todavía no" (D-66).
  const kb = $('#keyboard'); kb.innerHTML = '';
  kb.hidden = !puedeJugar;
  for (const letter of ALPHA) {
    const usada = s.used.includes(letter);
    const ok = usada && Object.values(s.at).includes(letter);
    kb.append(el('button', {
      type: 'button', disabled: !puedeJugar || usada,
      class: (S.sel === letter ? 'sel' : '') + (usada ? (ok ? ' hit' : ' miss') : ''),
      onClick: () => { S.sel = S.sel === letter ? null : letter; SFX.tap(); vibrate(8); renderPlay(view()); },
    }, letter));
  }

  // Confirmar: nada se preselecciona y el botón dice qué letra va a probar (C-8, D-38)
  const confirm = $('#confirm'); confirm.innerHTML = '';
  if (puedeJugar) {
    if (M.config.buy && s.canBuy) {
      confirm.append(el('button', { class: 'btn btn--ghost buy', onClick: () => askBuy(me) }, T.buyBtn, el('small', {}, `· ${T.buyCost}`)));
    }
    confirm.append(el('button', {
      class: 'btn btn--yellow', disabled: !S.sel,
      onClick: () => {
        if (!S.sel || S.busy) return;
        S.busy = true; setTimeout(() => { S.busy = false; }, 250);
        SFX.flip();
        S.transport.send({ t: 'guess', from: me, letter: S.sel, n: playCount(me), ms: S.turnStart ? Date.now() - S.turnStart : 0 });
        S.sel = null;
      },
    }, S.sel ? fmt(T.tryLetter, { letter: S.sel }) : T.pickLetter));
  }
  if (chat && mine) chat.closeIfIdle();
}

/** Comprar una letra: cuesta un error, así que se confirma (C-8). */
function askBuy(role) {
  SFX.tap();
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'verdict' },
      el('div', { class: 'big ok' }, T.buyTitle),
      el('div', { class: 'note' }, T.buyText),
    ),
    el('div', { class: 'btn-row btn-row--ask', style: 'width:100%;max-width:420px;margin-top:12px' },
      el('button', { class: 'btn btn--yellow', onClick: e => { e.stopPropagation(); closeOverlay(); S.transport.send({ t: 'buy', from: role, n: playCount(role), ms: S.turnStart ? Date.now() - S.turnStart : 0 }); } }, T.buyYes),
      el('button', { class: 'btn btn--ghost', onClick: e => { e.stopPropagation(); closeOverlay(); render(); } }, T.buyNo),
    ),
  );
  showHandoff([stage], () => {}, { tapAdvances: false });
}
function closeOverlay() { const b = $('#handoff'); b.hidden = true; b.innerHTML = ''; b.className = 'handoff'; }

/**
 * Veredicto de una letra: qué probó, si estaba y cómo quedó su palabra. Es la pantalla que se ve
 * entre turno y turno en un celular, así que dice todo lo que el que viene necesita saber.
 */
function letterVerdict(role, v, nextName) {
  const s = v.st[role];
  const last = s.last || {};
  const veces = Object.values(s.at).filter(c => c === last.letter).length;
  soundFor(role, s);
  const titulo = last.buy ? T.buyBtn : last.ok ? T.hitTitle : T.missTitle;
  const detalle = last.buy ? fmt(T.bought, { name: M.names[role], letter: last.letter })
    : last.ok ? fmt(veces > 1 ? T.letterIn : T.letterInOne, { letter: last.letter, n: veces })
    : fmt(T.letterOut, { letter: last.letter });
  const letras = el('div', { class: 'word-big' });
  s.pattern.split('').forEach(c => {
    if (c === ' ') return letras.append(el('span', { class: 'sp' }));
    letras.append(el('span', { class: c === '.' ? 'hole' : '' }, c === '.' ? '_' : c));
  });
  const vidas = el('div', { class: 'lives' });
  for (let i = 0; i < M.config.lives; i++) vidas.append(el('span', { class: 'dot' + (i < s.lives ? '' : ' gone') }));
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'verdict' },
      el('div', { class: 'big ' + (last.ok || last.buy ? 'ok' : 'no') }, titulo),
      el('div', { class: 'note' }, detalle),
      letras,
      vidas,
    ),
  );
  // El fondo rojo es para quien falló, y en un celular el que falló es el que está mirando
  setTimeout(() => $('#handoff').classList.toggle('bad', !last.ok && !last.buy), 0);
  if (nextName) {
    stage.append(el('div', { style: 'width:60%;height:1px;background:var(--glass-border);margin:12px auto 2px' }));
    const pb = passBlock({ label: T.hoPass, name: nextName, button: T.hoReady, small: true });
    stage.append(pb);
    stage.setAdvance = fn => pb.setAdvance(() => { SFX.pass(); fn(); });
  }
  return stage;
}

/**
 * Cartel breve de acierto o error sobre el tablero, que se va solo (D-63).
 * Va en los modos donde la jugada no abre ninguna pantalla: contra el celular, donde el turno
 * cambiaba de golpe, y varios celulares, donde a propósito nada interrumpe (D-56). En un celular
 * no: ahí el resultado y el "pásale el celular" ya van juntos en su propia pantalla (C-9).
 */
function flashFor(role, s) {
  if (S.mode === 'local') return;
  const n = s.used.length;
  const visto = S.flashShown[role];
  S.flashShown[role] = n;
  if (visto === undefined || n <= visto || !s.last) return;   // al entrar o al retomar no hay nada que anunciar
  const last = s.last;
  const chip = el('div', { class: `flash ${last.buy ? 'buy' : last.ok ? 'hit' : 'miss'}` },
    el('b', {}, last.buy ? T.buyDone : last.ok ? T.hitTitle : T.missTitle),
    el('span', {}, last.letter));
  ($('#screen-play .board') || $('#screen-play')).append(chip);
  setTimeout(() => chip.remove(), FLASH_MS);
}

/** Sonido y vibración de la última letra, una sola vez por jugada. */
function soundFor(role, s) {
  if (s.used.length <= (S.usedShown[role] || 0)) return false;
  S.usedShown[role] = s.used.length;
  S.streaks = S.streaks || {};
  if (s.last?.buy) { SFX.dice(); vibrate(20); }
  else if (s.last?.ok) { S.streaks[role] = (S.streaks[role] || 0) + 1; SFX.letterHit(S.streaks[role]); vibrate(12); }
  else { S.streaks[role] = 0; SFX.letterMiss(); vibrate([40, 40, 40]); }
  return true;
}

/** Veredicto de una ronda: la palabra completa, y las letras que faltaban caen en rojo. */
function roundVerdict(role, v, nextName) {
  const s = v.st[role];
  const real = v.words[role] || M.reveals[role]?.word || s.pattern;
  // Quien mira la pantalla es el que jugó, salvo que haya jugado el celular: ahí es noticia ajena (C-8b)
  const propio = S.mode === 'online' ? role === S.role : true;
  const titulo = s.solved
    ? (propio ? T.solvedTitle : fmt(T.solvedOther, { name: M.names[role] }))
    : (propio ? T.hangedTitle : fmt(T.hangedOther, { name: M.names[role] }));
  if (s.solved) { SFX.win(); vibrate([30, 40, 30]); if (propio) confetti({ count: 90, duration: 1800 }); } else { SFX.hang(); vibrate([120, 60, 200]); }
  const letras = el('div', { class: 'word-big' });
  normalize(real).split('').forEach((c, i) => {
    if (c === ' ') return letras.append(el('span', { class: 'sp' }));
    const yaEstaba = s.shown.has(i);
    const span = el('span', { class: yaEstaba ? '' : 'late' }, c);
    if (!yaEstaba) span.style.animationDelay = `${i * 90}ms`;
    letras.append(span);
  });
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'verdict' },
      el('div', { class: 'big ' + (s.solved ? 'ok' : 'no') }, titulo),
      el('div', { class: 'muted', style: 'font-weight:800;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em' }, T.wordWas),
      letras,
      el('div', { class: 'note' }, s.solved ? fmt(T.scoreWas, { n: s.score }) : T.scoreZero),
    ),
  );
  setTimeout(() => $('#handoff').classList.toggle('bad', !s.solved && propio), 0);
  if (nextName) {
    stage.append(el('div', { style: 'width:60%;height:1px;background:var(--glass-border);margin:12px auto 2px' }));
    const pb = passBlock({ label: T.hoPass, name: nextName, button: T.hoReady, small: true });
    stage.append(pb);
    stage.setAdvance = fn => pb.setAdvance(() => { SFX.pass(); fn(); });
  } else stage.append(el('div', { class: 'hint', style: 'margin-top:14px;background:none' }, T.tapContinue + ' ›'));
  return stage;
}

/* ---------- Resultado ---------- */
function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  if (!already) showScreen('screen-result');
  const winners = v.winner || [];
  const meRole = S.mode === 'online' ? S.role : null;
  const many = winners.length > 1;
  // Se colgaron todos: no hay a quién coronar, y el trofeo sobra (D-61)
  const nadie = !winners.length;
  // Jugando solo no se le gana a nadie: la partida sale o no sale, y no hay ranking que mostrar
  const soloYo = M.players.length === 1;
  const mia = soloYo ? v.st[M.players[0]] : null;
  $('#result-title').textContent = soloYo ? (mia.solved ? T.solvedTitle : T.hangedTitle)
    : nadie ? T.winTitleNone
    : many ? T.winTitleMany
    : fmt(T.winTitle, { name: M.names[winners[0]] || '' });
  $('#result-sub').textContent = soloYo ? (mia.solved ? fmt(T.soloScore, { n: mia.score, letters: mia.used.length }) : '')
    : meRole && !nadie ? (winners.includes(meRole) ? T.youWin : T.youLose) : '';
  $('#result-trophy').textContent = soloYo ? (mia.solved ? '🏆' : '💀')
    : nadie ? '💀' : (meRole && !winners.includes(meRole) ? '😵' : (many ? '🤝' : '🏆'));

  // Jugando solo el panel del ranking quedaría vacío, y el rótulo en plural sobre una sola
  // palabra se lee mal: la tarjeta ya dice "la palabra era"
  $('#ranking-panel').hidden = soloYo;
  $('#words-title').hidden = soloYo;
  const rank = $('#result-ranking'); rank.innerHTML = '';
  (soloYo ? [] : v.rank).forEach((p, i) => {
    const s = v.st[p];
    const info = s.solved ? fmt(T.rankLine, { n: s.score, letters: s.used.length }) : fmt(T.rankHanged, { letters: s.used.length });
    rank.append(el('li', { class: winners.includes(p) ? 'top' : '' },
      el('span', { class: 'pos' }, ['🥇', '🥈', '🥉'][i] || `${i + 1}.`),
      el('span', { class: 'name' }, M.names[p] || ''),
      el('span', { class: 'info' }, info + (s.bought ? ` · ${fmt(T.rankBought, { n: s.bought })}` : ''), el('span', { class: 'time' }, ` ⏱ ${(s.ms / 1000).toFixed(0)}s`)),
    ));
  });

  const words = $('#result-words'); words.innerHTML = '';
  for (const p of M.players) {
    const real = v.words[p] || M.reveals[p]?.word || '';
    const ver = M.verify?.[p];
    words.append(el('div', { class: 'w' },
      el('div', {}, el('span', { class: 'who' }, soloYo ? T.soloWordWas : fmt(T.wordOf, { name: M.names[p] || '' })), el('span', { class: 't' }, normalize(real))),
      ver ? el('span', { class: 'ver' + (ver.ok ? '' : ' bad') }, ver.ok ? T.verified : T.notVerified) : null,
    ));
  }

  const festejo = soloYo ? mia.solved : (!meRole || winners.includes(meRole));
  if (!already) { if (festejo) { confetti({ count: 220, duration: 3500 }); SFX.win(); } else SFX.timeUp(); }

  const box = $('#result-actions'); box.innerHTML = '';
  if (S.mode === 'online' && !S.switching) {
    const proposed = ROLES.filter(r => r !== S.role).map(r => M.rematch[r]).find(c => typeof c === 'string');
    if (proposed && proposed !== S.code) { S.switching = true; joinOnline(proposed, M.names[S.role]).catch(e => { console.error(e); S.switching = false; }); }
  }
  box.append(
    el('button', { class: 'btn btn--yellow', onClick: rematch }, T.rematch),
    S.mode === 'online' ? el('button', { class: 'btn btn--ghost', onClick: e => leaveRoom(e.currentTarget) }, T.changeMode) : el('button', { class: 'btn btn--ghost', onClick: () => { clearSession(); location.href = location.pathname; } }, T.changeMode),
    el('a', { class: 'btn btn--ghost', href: '../' }, T.backMenu),
  );
}

async function rematch() {
  SFX.tap();
  const config = freshConfig(M.config);
  if (S.mode === 'online') {
    if (M.rematch[S.role]) return;
    const proposed = ROLES.filter(r => M.names[r] && r !== S.role).map(r => M.rematch[r]).find(c => typeof c === 'string');
    if (proposed) { S.switching = true; return joinOnline(proposed, M.names[S.role]); }
    const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
    const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
    S.switching = true;
    const code = await t.create({ config, name: M.names[S.role] });
    S.transport.send({ t: 'rematch', from: S.role, code });
    M.rematch[S.role] = code;
    setTimeout(() => startOnline(t, code, 'A', M.names[S.role], config), 600);
    return;
  }
  startLocalMode(S.mode, { ...M.names }, { ...config, players: M.players.slice() });
}

const freshConfig = config => ({ ...config, seed: randomSeed() });

/* ---------- Varios celulares ---------- */
async function startOnline(transport, code, role, name, config, secrets = {}) {
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role, secrets });
  history.replaceState(null, '', `${location.pathname}?sala=${code}`);
  keepAwake();
  saveSession();
  render();
}
async function createOnline(name, config) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const code = await t.create({ config, name });
  await startOnline(t, code, 'A', name, config);
}
async function joinOnline(code, name, previousRole = null, secrets = {}) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG, secrets);
}

/* ------------------------------------------------------------------ */
/* Modos y arranque                                                    */
/* ------------------------------------------------------------------ */
function startLocalMode(mode, names, config) {
  clearSession();
  const transport = createLocalTransport();
  startSession({ mode, transport, roles: config.players, config, names });
  keepAwake();
  trackStart({ game: GAME_ID, mode, players: config.players.length }); // señal de uso (D-44)
}

function renderModes() {
  const box = $('#modes'); box.innerHTML = '';
  const modes = [['local', T.modeLocal, T.modeLocalHint], ['online', T.modeOnline, T.modeOnlineHint], ['solo', T.modeSolo, T.modeSoloHint]];
  for (const [m, label, hint] of modes) box.append(el('button', { class: 'mode', onClick: () => { SFX.tap(); renderSetup(m); } }, el('span', {}, el('b', {}, label), el('small', {}, hint)), el('span', { class: 'go' }, '›')));
}

function renderResumeSlot() {
  const slot = $('#resume-slot'); slot.innerHTML = '';
  const saved = loadSession();
  if (!saved || saved.done) return;
  if (saved.mode === 'online' && !saved.code) return;
  const deck = getDeck(saved.config?.theme);
  const src = SOURCES.find(s => s.id === saved.config?.source) || SOURCES[0];
  const label = saved.mode === 'online' ? `${T.lobbyCode}: ${saved.code}` : { local: T.modeLocal, solo: T.modeSolo }[saved.mode] || '';
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, `${deck.emoji} ${deck.name[lang]} · ${label} · ${src.emoji} ${src.label()}`),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: async () => { try { await resume(saved); } catch (_) { clearSession(); renderResumeSlot(); } } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSession(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderSetup(mode, prefillCode = '') {
  showScreen('screen-setup');
  $('#screen-setup h2').textContent = prefillCode ? T.invitedTitle : T.setupTitle;
  // Jugando solo la palabra sale siempre del mazo: no hay a quién pedirle que la escriba
  const config = { ...DEFAULT_CONFIG, source: mode === 'solo' ? 'deck' : DEFAULT_CONFIG.source };
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  let draft = mode === 'local' ? ['', ''] : [nameStore.get()];
  const invitado = !!prefillCode;

  // Temática
  const themes = el('div', { class: 'themes' });
  const paintThemes = () => {
    themes.innerHTML = '';
    for (const d of DECKS) themes.append(el('button', { type: 'button', class: 'theme-card' + (config.theme === d.id ? ' on' : ''), onClick: () => { config.theme = d.id; SFX.tap(); paintThemes(); } },
      el('span', { class: 'em' }, d.emoji), el('b', {}, d.name[lang]), el('small', {}, d.hint[lang])));
  };
  paintThemes();
  if (!invitado) form.append(el('div', { class: 'field' }, el('label', {}, T.theme), themes));

  // Jugadores
  const playersBox = el('div');
  const addBtn = el('button', { class: 'btn btn--ghost btn--sm', style: 'width:100%', onClick: () => { if (draft.length < MAX_PLAYERS) { draft.push(''); paintPlayers(); } } }, T.addPlayer);
  const paintPlayers = () => {
    playersBox.innerHTML = '';
    draft.forEach((name, i) => {
      const input = el('input', { type: 'text', maxlength: 14, placeholder: fmt(T.playerPlaceholder, { n: i + 1 }), value: name, autocomplete: 'off', onInput: e => { draft[i] = e.target.value; } });
      playersBox.append(el('div', { class: 'player-row' }, el('span', { class: 'num' }, i + 1), input,
        el('button', { class: 'del', type: 'button', 'aria-label': T.removePlayer, disabled: draft.length <= MIN_PLAYERS, onClick: () => { draft.splice(i, 1); paintPlayers(); } }, '✕')));
    });
    addBtn.disabled = draft.length >= MAX_PLAYERS;
    addBtn.textContent = draft.length >= MAX_PLAYERS ? fmt(T.maxPlayers, { n: MAX_PLAYERS }) : T.addPlayer;
  };
  if (mode === 'local') { paintPlayers(); form.append(el('div', { class: 'field' }, el('label', {}, T.players), playersBox, addBtn)); }
  else {
    const input = el('input', { class: 'name', type: 'text', maxlength: 14, placeholder: T.yourName, value: draft[0], autocomplete: 'off', onInput: e => { draft[0] = e.target.value; } });
    form.append(el('div', { class: 'field field--name' }, el('label', {}, T.yourName), input));
  }

  // Comprometer la palabra con hash necesita crypto.subtle, o sea https o localhost (C-10). Sin
  // eso la cadena no se puede jugar, y conviene decirlo acá y no después de escribirla: pasa al
  // abrir el juego por la IP de la red para probarlo desde un celular.
  const seguro = window.isSecureContext && !!window.crypto?.subtle;
  if (!seguro) config.source = 'deck';

  // De dónde sale la palabra (D-53). Jugando solo no se elige.
  const srcHint = el('p', { class: 'sub' }, '');
  const paintSrc = () => {
    const actual = SOURCES.find(s => s.id === config.source);
    srcHint.textContent = seguro ? actual.hint() : T.srcNeedsHttps;
    srcHint.classList.toggle('warn', !seguro);
    $$('button', srcSeg).forEach((b, i) => b.classList.toggle('on', SOURCES[i].id === config.source));
  };
  const srcSeg = el('div', { class: 'seg seg--src' }, ...SOURCES.map(s =>
    el('button', {
      type: 'button', disabled: !seguro && s.id === 'chain',
      onClick: () => { config.source = s.id; SFX.tap(); paintSrc(); },
    }, el('span', { class: 'em' }, s.emoji), el('span', { class: 'txt' }, s.label()))));
  paintSrc();
  if (!invitado && mode !== 'solo') form.append(el('div', { class: 'field' }, el('label', {}, T.wordSource), srcSeg, srcHint));

  // Errores permitidos
  const livesLabels = { 5: T.livesHard, 6: T.livesNormal, 8: T.livesEasy };
  const livesSeg = el('div', { class: 'seg' }, ...LIVES_OPTIONS.map(n => el('button', { type: 'button', class: n === config.lives ? 'on' : '', onClick: e => { config.lives = n; $$('button', livesSeg).forEach(b => b.classList.toggle('on', b === e.currentTarget)); SFX.tap(); } }, `${livesLabels[n]} · ${n}`)));
  if (!invitado) form.append(el('div', { class: 'field' }, el('label', {}, T.lives), livesSeg));

  // Comprar letras
  const sw = el('button', { type: 'button', class: 'switch' + (config.buy ? ' on' : ''), 'aria-label': T.buyLabel, 'aria-pressed': String(config.buy), onClick: () => { config.buy = !config.buy; sw.classList.toggle('on', config.buy); sw.setAttribute('aria-pressed', String(config.buy)); SFX.tap(); } });
  if (!invitado) form.append(el('div', { class: 'field' }, el('div', { class: 'toggle-row' }, el('div', { class: 'txt' }, el('b', {}, T.buyLabel), el('small', {}, T.buyHint)), sw)));

  const fail = msg => { err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const actions = $('#setup-actions'); actions.innerHTML = '';
  if (mode === 'online') {
    const codeInput = el('input', { type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: prefillCode, autocapitalize: 'characters', autocomplete: 'off' });
    const createBtn = el('button', { class: 'btn btn--yellow', onClick: async () => {
      const name = draft[0].trim(); if (!name) return fail(T.errName);
      nameStore.set(name); SFX.tap(); createBtn.disabled = true;
      try { await createOnline(name, { ...config, seed: randomSeed() }); } catch (e) { failWith(e, T, fail); }
      createBtn.disabled = false;
    } }, T.create);
    const joinBtn = el('button', { class: 'btn btn--cyan', onClick: async () => {
      const name = draft[0].trim(); const code = codeInput.value.trim().toUpperCase();
      if (!name) return fail(T.errName);
      if (!/^[A-Z]{4}$/.test(code)) return fail(T.errCode);
      nameStore.set(name); SFX.tap(); joinBtn.disabled = true;
      try { await joinOnline(code, name); } catch (e) { failWith(e, T, fail); }
      joinBtn.disabled = false;
    } }, T.join);
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
    return;
  }
  actions.append(el('button', { class: 'btn btn--yellow', onClick: () => {
    const list = draft.map(n => n.trim());
    if (mode === 'solo') {
      if (!list[0]) return fail(T.errName);
      nameStore.set(list[0]); SFX.tap();
      startLocalMode('solo', { A: list[0] }, { ...config, seed: randomSeed(), players: ['A'] });
    } else {
      if (list.some(n => !n) || new Set(list.map(n => n.toLowerCase())).size !== list.length) return fail(T.errNames);
      const players = ROLES.slice(0, list.length);
      const names = Object.fromEntries(players.map((p, i) => [p, list[i]]));
      SFX.tap();
      startLocalMode('local', names, { ...config, seed: randomSeed(), players });
    }
  } }, T.start));
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
    if (saved && saved.mode === 'online' && saved.code === code.toUpperCase() && !saved.done) {
      joinOnline(saved.code, saved.name, saved.role, saved.private || {}).catch(() => { clearSession(); renderSetup('online', code.toUpperCase()); });
    } else renderSetup('online', code.toUpperCase());
  }
}
init();
// Gancho de depuración (solo lectura) para pruebas automatizadas (canon C-14).
window.__ahorcado = { view: () => (M ? view() : null), match: () => M, session: () => S };
