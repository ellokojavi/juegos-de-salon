/**
 * Línea de Tiempo — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7):
 *  - local: 2 a 6 jugadores en este celular · solo: un jugador vacía su mano · online: varios celulares
 * El estado se deriva de la semilla del mazo más las jugadas, así que no hacen falta respuestas.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti, shareLink, canShare } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock } from '../assets/js/handoff.js';
import { createChat } from '../assets/js/chat.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import { buildState, correctSlot, randomSeed, yearLabel, timeLabel } from './engine.js';
import { DECKS, getDeck } from './decks/index.js';
import { GAME_ID, DEFAULT_CONFIG, HAND_SIZES, MIN_PLAYERS, MAX_PLAYERS, VISIBLE, LOCALES } from './rules.js';

const lang = getLang();
const T = LOCALES[lang];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);
const RECORD_KEY = `juegos-de-salon:${GAME_ID}:record`;
/** Récord del solitario por temática y tamaño de mano (menos intentos es mejor). */
const records = {
  key: (theme, hand, shared) => `${theme}:${hand}${shared ? ':pozo' : ''}`,
  get(theme, hand, shared) { try { return (JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'))[this.key(theme, hand, shared)] || null; } catch (_) { return null; } },
  set(theme, hand, shared, n) { try { const all = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); all[this.key(theme, hand, shared)] = n; localStorage.setItem(RECORD_KEY, JSON.stringify(all)); } catch (_) { /* nada */ } },
};

const SEEN_KEY = `juegos-de-salon:${GAME_ID}:vistas`;
/** Cartas que quedan disponibles como mínimo al excluir las vistas hace poco. */
const MIN_DISPONIBLES = 70;
/**
 * Cartas vistas hace poco, por temática (D-34). Al armar una partida se excluyen las
 * más recientes, así jugar diez veces seguidas no repite siempre los mismos hitos.
 * La lista viaja en la config, de modo que todos los celulares de la sala excluyen lo mismo.
 */
const seen = {
  all() { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (_) { return {}; } },
  add(theme, ids) {
    try {
      const all = this.all();
      const antes = (all[theme] || []).filter(id => !ids.includes(id));
      all[theme] = [...antes, ...ids].slice(-200);
      localStorage.setItem(SEEN_KEY, JSON.stringify(all));
    } catch (_) { /* sin memoria, se juega igual */ }
  },
  recent(theme) {
    const total = getDeck(theme).cards.length;
    const max = Math.max(0, total - MIN_DISPONIBLES);
    return (this.all()[theme] || []).slice(-max);
  },
};
/** Config lista para empezar: semilla nueva y las cartas recién vistas fuera. */
const freshConfig = config => ({ ...config, seed: randomSeed(), skip: seen.recent(config.theme) });

let S = null;   // sesión: modo, transporte, roles locales, selección de la interfaz
let M = null;   // partida: config, nombres y jugadas
let chat = null; // chat de sala: solo en varios celulares (canon C-15)

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
function newMatch(config) {
  // `players` viene en la configuración salvo en varios celulares, donde lo fija el anfitrión con `start`.
  return { config, players: config.players || null, names: {}, moves: [], rematch: {}, presence: {}, seen: new Set() };
}

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return; if (msg.id) M.seen.add(msg.id);
  switch (msg.t) {
    case 'hello': M.names[msg.from] = msg.name; break;
    case 'start': {
      if (M.players || msg.from !== 'A') return;                  // solo el anfitrión y una vez
      const order = (msg.order || []).filter(r => M.names[r]);
      if (order.length >= MIN_PLAYERS) M.players = order;
      break;
    }
    case 'place': {
      const v = view();
      if (v.lobby || v.done || v.current !== msg.from) return;    // sin empezar o fuera de turno
      if (!v.hands[msg.from]?.includes(msg.card)) return;         // carta que no tiene
      // Ojo: `at` es campo reservado del transporte (marca de tiempo), la ranura viaja como `slot`
      if (!(msg.slot >= 0 && msg.slot <= v.line.length)) return;  // ranura inválida
      // `ms`: lo que tardó el jugador en responder. Sirve para desempatar al final (D-31).
      M.moves.push({ from: msg.from, card: msg.card, at: msg.slot, ms: Number.isFinite(msg.ms) ? msg.ms : 0 });
      break;
    }
    case 'rematch': if (!M.rematch[msg.from]) M.rematch[msg.from] = msg.code || true; break;
    // El chat no es parte del estado de la partida: se dibuja y se olvida (canon C-15)
    case 'chat': if (chat) chat.add(msg, { live: !!S?.live }); return 'chat';
  }
  return null;
}

/** Vista derivada: manos, línea, turno, ganador. Sin jugadores fijados, la partida aún no empieza. */
function view() {
  if (!M.players) return { lobby: true, done: false };
  const fuera = M.config.skip && M.config.skip.length ? new Set(M.config.skip) : null;
  const cards = fuera ? getDeck(M.config.theme).cards.filter(c => !fuera.has(c.id)) : getDeck(M.config.theme).cards;
  const st = buildState({ cards, seed: M.config.seed, players: M.players, handSize: M.config.handSize, moves: M.moves, shared: !!M.config.shared, visible: VISIBLE });
  return { ...st, cards };
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, code = null, role = null }) {
  if (S?.transport) S.transport.leave();
  S = { mode, transport, roles, code, role, uiRole: null, selCard: null, selSlot: null, lastShown: -1, live: false };
  M = newMatch(config);
  setupChat(mode);
  // Lo que llega en los primeros instantes es la historia de la sala que se relee al entrar:
  // se dibuja en el chat, pero sin sonido ni globito de no leídos.
  const sess = S;
  setTimeout(() => { if (S === sess) S.live = true; }, 1500);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { if (apply(m) === 'chat') return; onChange(); });
  transport.onPresence(p => { M.presence = p; if (view().lobby) renderLobby(); });
}

let chain = Promise.resolve();
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

async function act() {
  saveSession();
  if (!M?.players) return;
  const v = view();
  // Se anota lo repartido al empezar, cada cierto rato y al terminar (D-34)
  if (S.seenAt == null || v.done || v.history.length >= S.seenAt + 6) {
    S.seenAt = v.history.length;
    seen.add(M.config.theme, [...new Set([...v.line, ...Object.values(v.hands).flat()])]);
  }
}

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  const done = view().done;
  if (S.mode === 'online') store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, done });
  else store.save({ mode: S.mode, config: M.config, messages: S.transport.messages || [], done });
}
function loadSession() { return store.load(); }
function clearSession() { store.clear(); }

async function resume(saved) {
  if (saved.mode === 'online') return joinOnline(saved.code, saved.name, saved.role);
  return restoreLocal(saved);
}

function restoreLocal(saved) {
  const transport = createLocalTransport({ seed: saved.messages || [] });
  startSession({ mode: saved.mode, transport, roles: saved.config.players, config: saved.config, names: {} });
  S.lastShown = M.moves.length - 1;
  S.uiRole = null; // fuerza la pantalla de pase al retomar
  keepAwake();
  onChange();
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

function eventRow(cardId, byId, fresh = false) {
  const c = byId[cardId];
  return el('div', { class: 'event' + (fresh ? ' fresh' : '') },
    el('span', { class: 'y' }, yearLabel(c.year, lang)),
    el('span', { class: 'em' }, c.emoji),
    el('span', { class: 't' }, c[lang]),
  );
}

function render() {
  if (!M) return;
  const v = view();
  // El chat acompaña la sala, la partida y también el resultado: ahí se celebra y se cierra
  // la conversación. Muere con la sala, no con la partida (D-35).
  if (chat) chat.show();
  if (v.lobby) return renderLobby();
  if (v.done) return renderResult(v);
  renderPlay(v);
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

/* ---------- Sala (varios celulares) ---------- */
function renderLobby() {
  if (S.mode !== 'online' || !M) return;
  showScreen('screen-lobby');
  const box = $('#lobby-box'); box.innerHTML = '';
  const url = `${location.origin}${location.pathname}?sala=${S.code}`;
  const joined = ROLES.filter(r => M.names[r]);
  const host = 'A';
  box.append(
    el('div', { class: 'muted', style: 'font-weight:800' }, T.lobbyCode),
    el('div', { class: 'code-big' }, S.code),
    el('div', { class: 'qr', id: 'qr' }),
    el('p', { class: 'muted', style: 'font-size:0.9rem' }, T.lobbyShare),
    shareButton(url),
    el('p', { class: 'lead', style: 'margin:12px 0 4px' }, `${T.lobbyPlayers} (${joined.length}/${MAX_PLAYERS})`),
    el('div', { class: 'lobby-players' }, ...joined.map(r => el('span', { class: 'p' + (r === S.role ? ' me' : '') + (M.presence[r]?.online === false ? ' off' : '') }, M.names[r]))),
    S.role === host
      ? el('button', { class: 'btn btn--yellow', disabled: joined.length < MIN_PLAYERS, onClick: () => { SFX.pass(); S.transport.send({ t: 'start', from: 'A', order: joined }); } }, joined.length < MIN_PLAYERS ? T.lobbyNeedMore : T.lobbyStart)
      : el('p', { class: 'waiting' }, el('span', { class: 'dots' }, fmt(T.lobbyWaitHost, { name: M.names[host] || '…' }))),
  );
  renderQr(url);
}

/** Botón de compartir: diálogo nativo del sistema si existe; si no, copia el enlace. */
function shareButton(url) {
  const btn = el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%;max-width:320px' }, canShare() ? T.shareLink : T.copyLink);
  btn.addEventListener('click', async () => {
    SFX.tap();
    // El texto que ve quien recibe el enlace lleva la temática que eligió el anfitrión
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

function renderPlay(v) {
  showScreen('screen-play');
  const isLocalTurn = S.roles.includes(v.current);
  // Solitario y varios celulares: el veredicto de cada jugada se muestra a todos.
  // Un acierto (o la jugada de otro) se cierra solo; un error propio se queda hasta que el jugador toque,
  // con fondo rojo y una explicación de dónde iba la carta.
  if (S.mode !== 'local' && v.history.length > S.lastShown + 1) {
    if (S.sticky && !$('#handoff').hidden) return;        // el jugador aún lee su error: lo nuevo espera
    const last = v.history[v.history.length - 1];
    S.lastShown = v.history.length - 1;
    if (chat) chat.close();
    const mine = S.roles.includes(last.from);
    const stage = verdictStage(last, v, null);
    const gen = (S.verdictGen = (S.verdictGen || 0) + 1);
    S.sticky = mine && !last.ok;
    const next = showHandoff([stage], () => { if (S.verdictGen === gen) S.sticky = false; S.selCard = null; S.selSlot = null; render(); });
    // Solo el temporizador del veredicto vigente puede cerrarlo; un error propio se queda hasta tocar
    if (!S.sticky) setTimeout(() => { if (S.verdictGen === gen && !$('#handoff').hidden) next(); }, 2400);
    return;
  }

  // Modo un celular: mostrar el resultado de la jugada anterior y pasar el celular
  if (S.mode === 'local' && v.history.length > S.lastShown + 1) {
    const last = v.history[v.history.length - 1];
    S.lastShown = v.history.length - 1;
    const turnPasses = v.current !== last.from;
    const stage = verdictStage(last, v, turnPasses ? M.names[v.current] : null);
    showHandoff([stage], () => { S.uiRole = v.current; S.selCard = null; S.selSlot = null; render(); }, { tapAdvances: !turnPasses });
    return;
  }
  if (S.mode === 'local' && S.uiRole !== v.current) {
    const stage = passBlock({ label: T.hoPass, name: M.names[v.current], button: T.hoReady });
    showHandoff([stage], () => { S.uiRole = v.current; S.selCard = null; S.selSlot = null; render(); }, { tapAdvances: false });
    return;
  }

  // Cronómetro del turno: parte cuando el jugador ya ve el tablero y puede jugar.
  // No se muestra durante la partida; solo se suma y aparece al final (D-31).
  const turnKey = `${v.current}:${v.history.length}`;
  if (isLocalTurn && S.turnKey !== turnKey) { S.turnKey = turnKey; S.turnStart = Date.now(); }

  // Rol que mira la pantalla
  const me = S.mode === 'online' ? S.role : (S.mode === 'solo' ? 'A' : v.current);
  // Si el chat quedó abierto y llega mi turno, se cierra para dejar ver el tablero
  // (salvo que esté escribiendo algo: eso no se bota).
  if (chat && isLocalTurn) chat.closeIfIdle();
  const okCount = v.history.filter(h => h.ok).length;
  $('#status-who').textContent = S.mode === 'solo' ? T.soloTitle : (isLocalTurn ? fmt(T.turnYou, { name: M.names[v.current] }) : fmt(T.turnOther, { name: M.names[v.current] }));
  const offline = S.mode === 'online' ? M.players?.length && ROLES.find(r => M.presence[r]?.online === false && M.names[r]) : null;
  const record = S.mode === 'solo' ? records.get(M.config.theme, M.config.handSize, M.config.shared) : null;
  $('#status-sub').textContent = S.mode === 'solo' ? `${fmt(T.soloStatus, { ok: okCount, n: v.history.length, tries: triesWord(v.history.length) })}${record ? ' · ' + fmt(T.soloRecord, { n: record, tries: triesWord(record) }) : ''}`
    : isLocalTurn ? (S.selCard ? T.pickSlot : T.pickCard)
    : offline ? fmt(T.offline, { name: M.names[offline] })
    : (S.mode === 'online' ? fmt(T.waitingTurn, { name: M.names[v.current] }) : '');

  // Marcador
  const score = $('#score'); score.innerHTML = '';
  // Con pozo común el número es lo colocado sobre la meta; con mano propia, lo que queda por colocar
  if (S.mode !== 'solo') for (const p of M.players) {
    score.append(el('span', { class: 'p' + (p === v.current ? ' turn' : '') }, M.names[p],
      el('span', { class: 'n' }, v.shared ? `${v.scores[p]}/${v.target}` : v.hands[p].length)));
  }

  // Mano
  const hand = v.hands[me] || [];
  // La carta se elige tocándola, nunca sola: en la tira hay que desplazarse y un toque que
  // se va en scroll no puede terminar colocando la primera carta (D-38).
  if (S.selCard && !hand.includes(S.selCard)) S.selCard = null;
  $('#hand-title').textContent = v.shared ? T.visibleTitle : (S.mode === 'local' ? fmt(T.handOf, { name: M.names[me] }) : T.yourHand);
  $('#pool-left').textContent = fmt(T.poolLeft, { n: v.poolLeft });
  const handBox = $('#hand'); handBox.innerHTML = '';
  for (const id of hand) {
    const c = v.byId[id];
    handBox.append(el('button', { class: 'card' + (S.selCard === id ? ' sel' : ''), disabled: !isLocalTurn, onClick: () => { S.selCard = id; S.selSlot = null; SFX.tap(); vibrate(8); renderPlay(view()); } },
      el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c[lang])));
  }

  // La carta elegida se marca en la propia mano; no hay barra aparte (D-33)
  handBox.classList.toggle('dim', !!(isLocalTurn && S.selCard));

  // Línea de tiempo con ranuras
  const line = $('#line'); line.innerHTML = '';
  const sel = S.selCard ? v.byId[S.selCard] : null;
  const slot = i => el('div', { class: 'slot' + (S.selSlot === i ? ' on' : ''), onClick: () => {
    if (!isLocalTurn || !S.selCard) return;
    S.selSlot = S.selSlot === i ? null : i; SFX.tap(); vibrate(8); renderPlay(view());
  } },
    S.selSlot === i && sel
      ? el('span', { class: 'ghost' }, el('span', { class: 'y' }, '?'), el('span', { class: 'em' }, sel.emoji), el('span', { class: 't' }, sel[lang]))
      : el('span', {}, i === 0 ? T.slotFirst : i === v.line.length ? T.slotLast : T.slotBetween));
  if (isLocalTurn) line.append(slot(0));
  v.line.forEach((id, i) => {
    const fresh = v.history.length && v.history[v.history.length - 1].ok && v.history[v.history.length - 1].card === id;
    line.append(eventRow(id, v.byId, fresh));
    if (isLocalTurn) line.append(slot(i + 1));
  });

  // Confirmar
  const row = $('#place-row'); row.innerHTML = '';
  if (isLocalTurn) {
    const elegida = S.selCard ? v.byId[S.selCard] : null;
    row.append(el('button', { class: 'btn btn--yellow', disabled: S.selSlot === null || !S.selCard, onClick: () => {
      SFX.flip();
      S.transport.send({ t: 'place', from: v.current, card: S.selCard, slot: S.selSlot, ms: S.turnStart ? Date.now() - S.turnStart : 0 });
      S.selCard = null; S.selSlot = null;
    } }, T.place, elegida && S.selSlot !== null ? el('small', {}, `${elegida.emoji} ${elegida[lang]}`) : null));
  }
  const fresh = line.querySelector('.event.fresh'); if (fresh) fresh.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function playVerdictSound(ok) { if (ok) { SFX.reveal(); vibrate([30, 30]); } else { SFX.timeUp(); vibrate([120, 60, 120, 60, 200]); } }

/** Pantalla entre turnos: veredicto de la jugada y, si cambia el turno, el pase del celular. */
/** "entre 1453 · Cae Constantinopla y 1492 · Colón…", o "antes de…" / "después de…" en los bordes. */
function whereText([a, b], byId) {
  const lbl = id => `<b>${yearLabel(byId[id].year, lang)}</b> · ${byId[id][lang]}`;
  if (a && b) return fmt(T.between, { a: lbl(a), b: lbl(b) });
  if (b) return fmt(T.beforeOf, { b: lbl(b) });
  return fmt(T.afterOf, { a: lbl(a) });
}

function verdictStage(last, v, nextName) {
  const c = v.byId[last.card];
  playVerdictSound(last.ok);
  // Si jugó otro, el veredicto habla de él: "¡Cata se equivocó!", no "¡Te equivocaste!"
  const mine = S.mode === 'local' || S.roles.includes(last.from);
  const quien = M.names[last.from];
  const titulo = mine ? (last.ok ? T.correct : T.wrong) : fmt(last.ok ? T.correctOther : T.wrongOther, { name: quien });
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'verdict' },
      el('div', { class: 'big ' + (last.ok ? 'ok' : 'no') }, titulo),
      el('div', { class: 'card-big' }, el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c[lang]), el('span', { class: 'y' }, yearLabel(c.year, lang))),
      el('div', { class: 'note' }, last.ok ? `${quien} 👏` : (mine ? `${quien} · ${T.drewNew}` : `${quien} · ${T.drewNewOther}`)),
      last.ok ? null : el('div', { class: 'why', html: `${fmt(T.whyWrong, { year: `<b>${yearLabel(c.year, lang)}</b>`, where: whereText(last.correctBetween, v.byId) })}<br>${fmt(mine ? T.wherePlaced : T.wherePlacedOther, { where: whereText(last.placedBetween, v.byId) })}` }),
    ),
  );
  // El fondo rojo del error es solo para el que se equivocó: al resto le llega como noticia
  setTimeout(() => $('#handoff').classList.toggle('bad', !last.ok && mine), 0);
  if (nextName) {
    stage.append(el('div', { class: 'pass-divider', style: 'width:60%;height:1px;background:var(--glass-border);margin:10px auto 2px' }));
    const pb = passBlock({ label: T.hoPass, name: nextName, button: T.hoReady, small: true });
    stage.append(pb);
    stage.setAdvance = fn => pb.setAdvance(() => { SFX.pass(); fn(); });
  } else stage.append(el('div', { class: 'hint', style: 'margin-top:14px' }, (last.ok ? T.hoContinue : T.tapContinue) + ' ›'));
  return stage;
}

const cardsLabel = n => (n === 0 ? T.noCards : n === 1 ? T.cardHeld : fmt(T.cardsHeld, { n }));
const triesWord = n => (n === 1 ? T.tryOne : T.tryMany);

function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  if (!already) showScreen('screen-result');
  const winners = v.winner || [];
  const meRole = S.mode === 'online' ? S.role : null;
  const many = winners.length > 1;
  const okOf = p => v.history.filter(h => h.from === p && h.ok).length;
  const totalOf = p => v.history.filter(h => h.from === p).length;
  // Empate a cartas: ganó quien respondió en menos tiempo (D-31)
  const llegaron = v.shared ? M.players.filter(p => v.scores[p] >= v.target) : M.players.filter(p => v.hands[p].length === 0);
  const porTiempo = winners.length === 1 && llegaron.length > 1;
  $('#result-note').textContent = S.mode === 'solo' ? '' : (porTiempo ? (v.shared ? T.wonOnTimeShared : T.wonOnTime) : '');
  $('#result-note').hidden = !porTiempo || S.mode === 'solo';
  if (S.mode === 'solo') {
    const tries = totalOf('A'), acc = tries ? Math.round(100 * okOf('A') / tries) : 0;
    const prev = records.get(M.config.theme, M.config.handSize, M.config.shared);
    const isRecord = !prev || tries < prev;
    if (!already && isRecord) records.set(M.config.theme, M.config.handSize, M.config.shared, tries);
    $('#result-title').textContent = T.soloDone;
    $('#result-sub').textContent = `${fmt(T.soloResult, { n: tries, acc, tries: triesWord(tries) })} · ${fmt(T.timeSpent, { t: timeLabel(v.times.A || 0) })} · ${isRecord ? T.newRecord : fmt(T.prevRecord, { n: prev, tries: triesWord(prev) })}`;
    $('#result-trophy').textContent = isRecord ? '🏆' : '✅';
  } else {
    $('#result-title').textContent = many ? T.winTitleMany : fmt(T.winTitle, { name: M.names[winners[0]] });
    $('#result-sub').textContent = (meRole ? (winners.includes(meRole) ? T.youWin : T.youLose) + ' · ' : '') + fmt(T.stats, { ok: okOf(winners[0]), total: totalOf(winners[0]) });
    $('#result-trophy').textContent = meRole && !winners.includes(meRole) ? '😵' : (many ? '🤝' : '🏆');
  }

  const rank = $('#result-ranking'); rank.innerHTML = '';
  // Si dos jugadores caen en el mismo segundo, se muestran décimas: si no, el ranking
  // parecería arbitrario justo cuando el tiempo es lo que decidió la partida (D-31).
  const distintos = d => new Set(M.players.map(p => timeLabel(v.times[p] || 0, { decimals: d }))).size === M.players.length;
  let decimals = 0;
  while (decimals < 2 && !distintos(decimals)) decimals++;
  $('#result-ranking').parentElement.hidden = S.mode === 'solo';
  // Menos cartas primero; a igualdad de cartas manda el tiempo (D-31)
  const order = M.players.slice().sort((a, b) =>
    (v.shared ? v.scores[b] - v.scores[a] : v.hands[a].length - v.hands[b].length) || (v.times[a] || 0) - (v.times[b] || 0) || okOf(b) - okOf(a));
  order.forEach((p, i) => {
    // "Sin cartas" no se repite: ya se dice arriba y así la fila cabe en una línea
    const quedan = !v.shared && v.hands[p].length ? `${cardsLabel(v.hands[p].length)} · ` : '';
    rank.append(el('li', { class: winners.includes(p) ? 'top' : '' },
      el('span', { class: 'pos' }, ['🥇', '🥈', '🥉'][i] || `${i + 1}.`),
      el('span', { class: 'name' }, M.names[p]),
      el('span', { class: 'info' },
        `${quedan}${fmt(T.stats, { ok: okOf(p), total: totalOf(p) })} · `,
        el('span', { class: 'time' }, `⏱ ${timeLabel(v.times[p] || 0, { decimals })}`),
      ),
    ));
  });
  const rline = $('#result-line'); rline.innerHTML = '';
  v.line.forEach(id => rline.append(eventRow(id, v.byId)));
  if (!already) { $('#result-replay').open = false; if (!meRole || winners.includes(meRole)) { confetti({ count: 220, duration: 3500 }); SFX.win(); } else SFX.timeUp(); }

  const box = $('#result-actions'); box.innerHTML = '';
  // Revancha propuesta por otro: me uno a su sala nueva
  if (S.mode === 'online' && !S.switching) {
    const proposed = ROLES.filter(r => r !== S.role).map(r => M.rematch[r]).find(c => typeof c === 'string');
    if (proposed && proposed !== S.code) { S.switching = true; joinOnline(proposed, M.names[S.role]).catch(e => { console.error(e); S.switching = false; }); }
  }
  box.append(
    el('button', { class: 'btn btn--yellow', onClick: rematch }, T.rematch),
    el('button', { class: 'btn btn--ghost', onClick: () => { clearSession(); S.transport.leave(); location.href = location.pathname; } }, T.changeMode),
    el('a', { class: 'btn btn--ghost', href: '../' }, T.backMenu),
  );
}

async function rematch() {
  SFX.tap();
  if (S.mode === 'online') {
    if (M.rematch[S.role]) return;
    const others = ROLES.filter(r => M.names[r] && r !== S.role);
    const proposed = others.map(r => M.rematch[r]).find(c => typeof c === 'string');
    if (proposed) { S.switching = true; return joinOnline(proposed, M.names[S.role]); }
    const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
    const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
    const config = freshConfig(M.config);   // mantiene tema, cartas y pozo común
    S.switching = true;
    const code = await t.create({ config, name: M.names[S.role] });
    S.transport.send({ t: 'rematch', from: S.role, code });
    M.rematch[S.role] = code;
    setTimeout(() => startOnline(t, code, 'A', M.names[S.role], config), 600);
    return;
  }
  startLocalMode(S.mode, { ...M.names }, freshConfig(M.config));
}

/* ---------- Varios celulares ---------- */
async function startOnline(transport, code, role, name, config) {
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role });
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
async function joinOnline(code, name, previousRole = null) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG);
}

/* ------------------------------------------------------------------ */
/* Modos y arranque                                                    */
/* ------------------------------------------------------------------ */
function startLocalMode(mode, names, config) {
  clearSession();
  const transport = createLocalTransport();
  startSession({ mode, transport, roles: config.players, config, names });
  keepAwake();
}

function renderModes() {
  const box = $('#modes'); box.innerHTML = '';
  const modes = [['local', T.modeLocal, T.modeLocalHint, true], ['online', T.modeOnline, T.modeOnlineHint, true], ['solo', T.modeSolo, T.modeSoloHint, true]];
  for (const [m, label, hint, ok] of modes) box.append(el('button', { class: 'mode', disabled: !ok, onClick: () => { SFX.tap(); renderSetup(m); } }, el('span', {}, el('b', {}, label), el('small', {}, hint)), el('span', { class: 'go' }, ok ? '›' : '⏳')));
}

function renderResumeSlot() {
  const slot = $('#resume-slot'); slot.innerHTML = '';
  const saved = loadSession();
  if (!saved || saved.done) return;
  if (saved.mode === 'online' && !saved.code) return;
  const deck = getDeck(saved.config?.theme);
  const label = (saved.mode === 'online' ? `${T.lobbyCode}: ${saved.code}` : { local: T.modeLocal, solo: T.modeSolo }[saved.mode] || '') + (saved.config?.shared ? ` · ${T.modeShared}` : '');
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, `${deck.emoji} ${deck.name[lang]} · ${label}`),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: async () => { try { await resume(saved); } catch (e) { clearSession(); renderResumeSlot(); } } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSession(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderSetup(mode, prefillCode = '') {
  showScreen('screen-setup');
  // Quien llega por un enlace no viene a configurar nada: viene invitado
  $('#screen-setup h2').textContent = prefillCode ? T.invitedTitle : T.setupTitle;
  const config = { ...DEFAULT_CONFIG };
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  let draft = mode === 'local' ? ['', ''] : [nameStore.get()];

  // Temática
  const themes = el('div', { class: 'themes' });
  const paintThemes = () => {
    themes.innerHTML = '';
    for (const d of DECKS) themes.append(el('button', { type: 'button', class: 'theme-card' + (config.theme === d.id ? ' on' : ''), onClick: () => { config.theme = d.id; SFX.tap(); paintThemes(); } },
      el('span', { class: 'em' }, d.emoji), el('b', {}, d.name[lang]), el('small', {}, d.hint[lang])));
  };
  paintThemes();
  // Quien llega invitado no configura nada: la partida ya viene armada por el anfitrión.
  const invitado = !!prefillCode;
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

  // De dónde salen las cartas: mano propia de cada uno o una tira común a la vista (D-32)
  const modeHint = el('p', { class: 'muted', style: 'font-size:0.8rem;margin:2px 0 0' });
  const sizeLabel = el('label', {});
  const paintCards = () => {
    sizeLabel.textContent = config.shared ? T.toWin : T.handSize;
    modeHint.textContent = config.shared ? fmt(T.sharedHint, { n: VISIBLE }) : T.ownHint;
  };
  const modeSeg = el('div', { class: 'seg' }, ...[[true, T.modeShared], [false, T.modeOwn]].map(([val, label]) =>
    el('button', { type: 'button', class: config.shared === val ? 'on' : '', onClick: e => { config.shared = val; $$('button', modeSeg).forEach(b => b.classList.toggle('on', b === e.currentTarget)); SFX.tap(); paintCards(); } }, label)));
  if (!invitado) form.append(el('div', { class: 'field' }, el('label', {}, T.cardsMode), modeSeg, modeHint));

  // Cuántas cartas: en mano (mano propia) o para ganar (pozo común)
  const sizeLabels = { 3: T.short, 5: T.normal, 7: T.long };
  const seg = el('div', { class: 'seg' }, ...HAND_SIZES.map(n => el('button', { type: 'button', class: n === config.handSize ? 'on' : '', onClick: e => { config.handSize = n; $$('button', seg).forEach(b => b.classList.toggle('on', b === e.currentTarget)); SFX.tap(); } }, `${sizeLabels[n]} · ${n}`)));
  paintCards();
  if (!invitado) form.append(el('div', { class: 'field' }, sizeLabel, seg));

  const fail = msg => { err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const actions = $('#setup-actions'); actions.innerHTML = '';
  if (mode === 'online') {
    const codeInput = el('input', { type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: prefillCode, autocapitalize: 'characters', autocomplete: 'off' });
    const createBtn = el('button', { class: 'btn btn--yellow', onClick: async () => {
      const name = draft[0].trim(); if (!name) return fail(T.errName);
      nameStore.set(name); SFX.tap(); createBtn.disabled = true;
      try { await createOnline(name, freshConfig(config)); } catch (e) { console.error(e); fail(T.errNet); }
      createBtn.disabled = false;
    } }, T.create);
    const joinBtn = el('button', { class: 'btn btn--cyan', onClick: async () => {
      const name = draft[0].trim(); const code = codeInput.value.trim().toUpperCase();
      if (!name) return fail(T.errName);
      if (!/^[A-Z]{4}$/.test(code)) return fail(T.errCode);
      nameStore.set(name); SFX.tap(); joinBtn.disabled = true;
      try { await joinOnline(code, name); } catch (e) { fail({ 'not-found': T.errNotFound, full: T.errFull, expired: T.errExpired, 'other-game': T.errOtherGame }[e.message] || T.errNet); }
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
      actions.append(createBtn, el('div', { class: 'or' }, '— o —'), joinPanel(el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.joinTitle)));
    }
    return;
  }
  actions.append(el('button', { class: 'btn btn--yellow', onClick: () => {
    const list = draft.map(n => n.trim());
    if (mode === 'solo') {
      if (!list[0]) return fail(T.errName);
      nameStore.set(list[0]);
      SFX.tap();
      startLocalMode('solo', { A: list[0] }, { ...freshConfig(config), players: ['A'] });
    } else {
      if (list.some(n => !n) || new Set(list.map(n => n.toLowerCase())).size !== list.length) return fail(T.errNames);
      const players = ROLES.slice(0, list.length);
      const names = Object.fromEntries(players.map((p, i) => [p, list[i]]));
      SFX.tap();
      startLocalMode('local', names, { ...freshConfig(config), players });
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
    if (saved && saved.mode === 'online' && saved.code === code.toUpperCase() && !saved.done) joinOnline(saved.code, saved.name, saved.role).catch(() => { clearSession(); renderSetup('online', code.toUpperCase()); });
    else renderSetup('online', code.toUpperCase());
  }
}
init();
// Gancho de depuración (solo lectura) para pruebas automatizadas (canon C-14).
window.__ldt = { view: () => (M ? view() : null), match: () => M, session: () => S };
void correctSlot;
