/**
 * Blackjack: DOM controller and screen flow (C-2). Pure rules live in engine.js,
 * texts in rules.js.
 * Modes:
 *  - cpu: 1 player vs. the house (croupier)
 *  - online: 2 to 6 players, each on their own phone via Firebase rooms
 * Lab only (D-395).
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, withLang, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore, createNameStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { clearRoomError, tryRematch, tryRoom } from '../../assets/js/transport/errors.js';
import { roomFlow } from '../../assets/js/room-flow.js';
import { roomMessage, roomPhase } from '../../assets/js/room-state.js';
import { renderQr } from '../../assets/js/qr.js';
import { param } from '../../assets/js/parametros.js';
import { flag } from '../../assets/js/flags.js';
import { onScreen } from '../../assets/js/on-screen.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { bloqueJugador, conBandera, avisoPartida, bloqueTabla, finDePartida } from '../../assets/js/ranking.js';
import { ponerBuzon } from '../../assets/js/buzon.js';
import { leerYo, rankingsVisibles } from '../../assets/js/jugador.js';
import { salidasFin } from '../../assets/js/fin.js';
import { botonCompartir, botonInvitar, taglineLine } from '../../assets/js/compartir.js';
import { result } from '../../assets/js/share-templates.js';
import { roomInvite } from '../../assets/js/share-templates.js';
import {
  GAME_ID, MIN_PLAYERS, MAX_PLAYERS, ROLES, DEFAULT_CONFIG,
  DECK_OPTIONS, ROUND_OPTIONS, COIN_OPTIONS, LOCALES,
} from './rules.js';
import * as E from './engine.js';
import manifest from '../../assets/js/manifests/labs/blackjack.js';

trackVisit();

const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));

let state = null;
let mode = 'cpu'; // 'cpu' | 'online'
let setupConfig = { ...DEFAULT_CONFIG };
let pendingBet = DEFAULT_CONFIG.minBet;
let betStacks = {};
let betBump = false;
let bumpDenom = null;
let online = null; // { transport, code, role, config, match }
let animToken = 0;
let dealReveal = null; // { players: [[n, ...]], dealer: n, holeRevealed: bool, showOutcomes: bool }
let freshCardKey = null;
let clearing = false;
// When this table's game started, for the ranking's time; and the last result already recorded, so a redraw does not count it twice
let startedAt = Date.now();
let recorded = '';
// The felt is cleared before a new hand: the cards slide off towards the dealer and fade, one after another (style.css)
const CLEAR_MS = 620;
// The felt table, a visual treatment on trial (lab: #seccion-blackjack-felt): cards with corner indices, the bet as a chip,
// the shoe as a bar with its red card, each hand's result as a stamp
let felt = false;
let armedAction = null;
let armedContext = '';
let armedTimer = null;

function armKey() {
  if (!state) return '';
  const activeHand = state.players[state.activeIndex]?.activeHand ?? 0;
  return `${state.phase}:${state.round}:${state.bettingIndex}:${state.activeIndex}:${activeHand}`;
}

function disarm() {
  clearTimeout(armedTimer);
  armedAction = null;
  armedContext = '';
  armedTimer = null;
}

function arm(key) {
  clearTimeout(armedTimer);
  const ctx = armKey();
  armedAction = key;
  armedContext = ctx;
  armedTimer = setTimeout(() => {
    const active = armedContext === ctx && state && $('#screen-play').classList.contains('active');
    disarm();
    if (active) renderActionBox();
  }, 3000);
  SFX.tap();
  renderActionBox();
}

function confirmBtn({ id, key, label, confirmLabel, baseClass = 'btn btn--ghost', onConfirm }) {
  const armed = armedAction === key;
  return el('button', {
    class: armed ? `${baseClass} btn--danger` : baseClass,
    id,
    onClick: () => {
      if (armedAction === key) { disarm(); onConfirm(); return; }
      arm(key);
    },
  }, armed ? confirmLabel : label);
}

function myPlayerIndex() {
  if (mode !== 'online' || !online?.match?.players) return null;
  return online.match.players.indexOf(online.role);
}

function save() {
  const done = !!state && E.isOver(state);
  if (mode === 'online' && online) {
    store.save({
      mode: 'online',
      code: online.code,
      role: online.role,
      name: online.match.names[online.role],
      config: online.config,
      done,
    });
  } else {
    store.save({ mode: 'cpu', state, done });
  }
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  // The red room of a defeat covers the whole view, and only on its result
  document.documentElement.classList.toggle('bj-defeat', id === 'screen-result' && $('#screen-result').classList.contains('defeat'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done) return;
  if (saved.mode === 'cpu' && !saved.state) return;
  if (saved.mode === 'online' && !saved.code) return;

  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', {
        class: 'btn btn--cyan btn--sm',
        onClick: () => {
          SFX.tap();
          if (saved.mode === 'online') {
            joinOnline(saved.code, saved.name, saved.role).catch(() => {
              store.clear();
              renderResumeSlot();
            });
          } else {
            mode = 'cpu';
            state = saved.state;
            syncPendingBet();
            renderPlay();
          }
        },
      }, T.resume),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        onClick: () => { store.clear(); renderResumeSlot(); },
      }, T.delete),
    ),
  ));
}

function renderModes() {
  disarm();
  $('#modes').replaceChildren(
    el('button', { class: 'mode', 'data-mode': 'cpu', onClick: () => { SFX.tap(); openSetupCpu(); } },
      el('span', {}, el('b', {}, T.modeSolo), el('small', {}, T.modeSoloHint)),
      el('span', { class: 'go' }, '›')),
    el('button', { class: 'mode', 'data-mode': 'online', onClick: () => { SFX.tap(); renderSetupOnline(); } },
      el('span', {}, el('b', {}, T.modeOnline), el('small', {}, T.modeOnlineHint)),
      el('span', { class: 'go' }, '›')),
  );
  fillHow();
}
function fillHow() {
  for (const sel of ['#how', '#how-play']) $(sel)?.replaceChildren(...L.como.map(step => el('li', {}, ...coins(step))));
}

/* ---------------- Setup (shared options) ---------------- */
function renderSegmented(label, options, current, formatFn, onSelect) {
  return el('div', { class: 'opt-group' },
    el('span', { class: 'opt-label' }, label),
    el('div', { class: 'seg-row' },
      ...options.map(val => el('button', {
        type: 'button',
        class: 'seg-btn' + (current === val ? ' active' : ''),
        onClick: () => { SFX.tap(); onSelect(val); renderSetupOptions(); },
      }, ...[formatFn(val)].flat())),
    ),
  );
}

function renderSetupOptions() {
  $('#setup-options').replaceChildren(
    renderSegmented(T.decksLabel, DECK_OPTIONS, setupConfig.decks, v => String(v), v => { setupConfig.decks = v; }),
    renderSegmented(T.roundsLabel, ROUND_OPTIONS, setupConfig.maxRounds, v => (v === 0 ? T.unlimitedRounds : String(v)), v => { setupConfig.maxRounds = v; }),
    renderSegmented(T.coinsLabel, COIN_OPTIONS, setupConfig.startingCoins, v => coins('🪙 ' + v), v => { setupConfig.startingCoins = v; }),
  );
}

/**
 * The setup's name row. On the felt trial a signed-in player sees their account as a block, flag and name,
 * with «Cambiar» to type another one instead; the input stays in the row, hidden, holding the name.
 */
function nameRow(num, input) {
  const yo = felt ? leerYo() : null;
  // Alone at the table (no number), the name starts at the row's own left edge, like any field
  const cls = 'player-row' + (num ? '' : ' no-num');
  if (!yo?.n || input.value !== yo.n) return el('div', { class: cls }, num ? el('span', { class: 'num' }, num) : '', input);
  input.hidden = true;
  const shown = el('span', { class: 'signed-name' }, conBandera(yo.co, yo.n));
  const change = el('button', {
    type: 'button', class: 'name-change', onClick: () => {
      SFX.tap(); shown.remove(); change.remove(); input.hidden = false; input.focus(); input.select();
    },
  }, T.changeName);
  return el('div', { class: cls + ' signed' }, num ? el('span', { class: 'num' }, num) : '', shown, input, change);
}

function openSetupCpu() {
  mode = 'cpu';
  setupConfig = { ...DEFAULT_CONFIG };
  const remembered = nameStore.list() || [];
  $('#screen-setup h2').textContent = T.whoPlays;
  $('.setup-hint').textContent = T.setupHint;
  $('#setup-form').replaceChildren(
    nameRow(null, el('input', {
      type: 'text', value: (felt && leerYo()?.n) || remembered[0] || '', maxlength: 14, autocomplete: 'off',
      placeholder: fmt(T.playerPlaceholder, { n: 1 }),
    })),
  );
  renderSetupOptions();
  $('#form-error').textContent = '';
  $('#setup-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-start', onClick: () => { SFX.tap(); startCpu(); } }, T.start),
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, C.atras),
  );
  showScreen('screen-setup');
}

function startCpu() {
  disarm();
  const name = $('#setup-form input')?.value.trim();
  if (!name) { $('#form-error').textContent = T.formError; vibrate(60); return; }
  animToken++;
  dealReveal = null;
  freshCardKey = null;
  clearing = false;
  $('.bj-table')?.classList.remove('clearing');
  nameStore.setList([name]);
  startedAt = Date.now();
  state = E.newGame([name], setupConfig);
  syncPendingBet();
  save();
  trackStart({ game: GAME_ID, mode: 'cpu', players: 1, nombres: [name] });
  renderPlay();
}

/* ---------------- Online setup & rooms ---------------- */
function renderSetupOnline(inviteCode = '') {
  mode = 'online';
  setupConfig = { ...DEFAULT_CONFIG };
  const invited = !!inviteCode;
  showScreen('screen-setup');
  $('#screen-setup h2').textContent = invited ? T.invitedTitle : T.setupOnline;
  $('.setup-hint').textContent = invited ? T.invitedHint : T.onlineHint;

  const remembered = nameStore.list() || [];
  // On the felt trial, the signed-in player plays under their account's name, not typed again (D-212)
  let myName = (felt && leerYo()?.n) || remembered[0] || '';
  const err = $('#form-error');
  clearRoomError(err);

  $('#setup-form').replaceChildren(
    nameRow('👤', el('input', {
      type: 'text', value: myName, maxlength: 14, autocomplete: 'off',
      placeholder: T.yourNameLabel,
      onInput: e => { myName = e.target.value; },
    })),
  );

  if (invited) {
    $('#setup-options').replaceChildren();
  } else {
    renderSetupOptions();
  }

  const fail = msg => {
    clearRoomError(err);
    err.textContent = msg;
    err.classList.remove('shake');
    void err.offsetWidth;
    err.classList.add('shake');
    SFX.error();
    vibrate([30, 30, 30]);
  };
  disarm();
  const roomOpts = { err, fail, T, local: () => { SFX.tap(); openSetupCpu(); }, localLabel: C.playOnePhone };

  const codeInput = el('input', {
    type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: inviteCode,
    autocapitalize: 'characters', autocomplete: 'off', readOnly: invited,
  });

  const joinBtn = el('button', {
    class: 'btn btn--cyan',
    onClick: async () => {
      const n = myName.trim();
      const c = codeInput.value.trim().toUpperCase();
      if (!n) return fail(T.errName);
      if (!/^[A-Z]{4}$/.test(c)) return fail(T.errCode);
      nameStore.setList([n]);
      SFX.tap();
      await tryRoom(joinBtn, () => joinOnline(c, n), { busy: C.joining, ...roomOpts });
    },
  }, T.join);

  const actions = $('#setup-actions');
  actions.replaceChildren();
  if (invited) {
    actions.append(el('div', { class: 'panel stack' },
      el('p', { class: 'lead center' }, fmt(T.invited, { code: inviteCode })),
      el('div', { class: 'field' }, codeInput),
      joinBtn));
  } else {
    const createBtn = el('button', {
      class: 'btn btn--yellow',
      onClick: async () => {
        const n = myName.trim();
        if (!n) return fail(T.errName);
        nameStore.setList([n]);
        SFX.tap();
        await tryRoom(createBtn, () => createOnline(n, { ...setupConfig }), { busy: C.opening, ...roomOpts });
      },
    }, T.create);
    actions.append(
      createBtn,
      el('div', { class: 'or' }, `— ${C.or} —`),
      el('div', { class: 'panel stack' },
        el('p', { class: 'lead center' }, T.joinTitle),
        el('div', { class: 'field' }, codeInput),
        joinBtn),
    );
  }
  actions.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, C.atras));
}

function applyRoomMessage(msg) {
  const M = online.match;
  const res = roomMessage(M, msg, {
    minPlayers: MIN_PLAYERS,
    onStart: m => {
      const names = M.players.map(r => M.names[r] || r);
      state = E.newGame(names, { ...online.config, seed: m.seed || 1, rng: E.mulberry32(m.seed || 1) });
      syncPendingBet();
      trackStart({ game: GAME_ID, mode: 'online', players: names.length, nombres: names });
    },
  });
  if (res === 'seen') return;
  if (res === 'handled') {
    if (msg.t === 'rematch' && E.isOver(state)) renderResult();
    else if (roomPhase(M) === 'lobby') renderLobby();
    else renderPlay();
    return;
  }

  if (msg.t === 'bj' && state) {
    if (!E.canApplyOnlineAction(state, M.players, msg)) return;
    const prev = state;
    const payload = msg.act === 'leave' ? { ...msg, playerIndex: M.players.indexOf(msg.from) } : msg;
    const next = applyAction(prev, msg.act, payload);
    if (next === prev) return;
    state = next;
    syncPendingBet();
    save();
    if (E.isOver(state)) {
      const winners = state.winner?.winners.map(i => state.players[i].name) || [];
      online.transport.noteWinner?.({ role: online.role, name: winners.join(', ') || 'House' });
    }
    animateTransition(prev, next);
  }
}

async function startOnline(transport, code, role, name, config) {
  if (online?.transport) online.transport.dispose();
  mode = 'online';
  state = null;
  online = {
    transport,
    code,
    role,
    config: { ...DEFAULT_CONFIG, ...(config || {}) },
    match: { seen: new Set(), names: { [role]: name }, players: null, presence: {}, rematch: {} },
  };
  history.replaceState(null, '', `${location.pathname}?room=${code}`);
  save();

  transport.onMessage(msg => applyRoomMessage(msg));
  transport.onPresence(p => {
    online.match.presence = p;
    if (roomPhase(online.match) === 'lobby') renderLobby();
  });
  await transport.send({ t: 'hello', name });
  renderLobby();
}

const room = () => roomFlow({ game: GAME_ID, maxPlayers: MAX_PLAYERS, defaultConfig: DEFAULT_CONFIG, start: startOnline });
async function createOnline(name, config) { await room().create(name, config); }
async function joinOnline(code, name, previousRole = null) { await room().join(code, name, previousRole); }

async function rematchOnline() {
  const M = online.match;
  const offer = ROLES.map(r => M.rematch[r]).find(c => typeof c === 'string');
  const myName = M.names[online.role];
  if (offer) return joinOnline(offer, myName);
  const t = await import('../../assets/js/transport/firebase.js').then(m => m.createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS }));
  const code = await t.create({ config: online.config, name: myName });
  await online.transport.send({ t: 'rematch', code });
  setTimeout(() => startOnline(t, code, 'A', myName, online.config), 600);
}

function renderLobby() {
  if (mode !== 'online' || !online || roomPhase(online.match) !== 'lobby') return;
  showScreen('screen-lobby');
  const M = online.match;
  const url = withLang(`${location.origin}${location.pathname}?room=${online.code}`);
  const joined = ROLES.filter(r => M.names[r]);
  const inviteText = () => roomInvite({ C, tagline: taglineLine(manifest.tagline, lang), emoji: manifest.emoji, game: T.title, code: online.code, name: M.names[online.role] });

  $('#lobby-box').replaceChildren(
    el('div', { class: 'muted', style: 'font-weight:800' }, T.lobbyCode),
    el('div', { class: 'code-big' }, online.code),
    el('div', { class: 'qr', id: 'qr' }),
    el('p', { class: 'muted', style: 'font-size:0.9rem' }, T.lobbyShare),
    botonInvitar({ T, titulo: T.title, url, texto: inviteText, alTocar: () => SFX.tap() }),
    el('p', { class: 'lead', style: 'margin:12px 0 4px' }, `${T.lobbyPlayers} (${joined.length}/${MAX_PLAYERS})`),
    el('div', { class: 'lobby-players' }, ...joined.map(r => el('span', {
      class: 'p' + (r === online.role ? ' me' : '') + (M.presence[r]?.online === false ? ' off' : ''),
    }, M.names[r]))),
    online.role === 'A'
      ? el('button', {
        class: 'btn btn--yellow',
        disabled: joined.length < MIN_PLAYERS,
        onClick: () => {
          SFX.tap();
          const seed = Math.floor(Math.random() * 2147483647) || 1;
          online.transport.send({ t: 'start', from: 'A', order: joined, seed });
        },
      }, joined.length < MIN_PLAYERS ? T.lobbyNeedMore : T.lobbyStart)
      : el('p', { class: 'waiting' }, el('span', { class: 'dots' }, fmt(T.lobbyWaitHost, { name: M.names.A || '…' }))),
    el('button', {
      class: 'btn btn--ghost btn--sm',
      onClick: async e => {
        e.currentTarget.disabled = true;
        SFX.tap();
        store.clear();
        await online.transport.dispose();
        location.href = location.pathname;
      },
    }, online.role === 'A' ? T.lobbyCancel : T.lobbyLeave),
  );
  renderQr(url);
}

/* ---------------- Card & Table Rendering ---------------- */
function cardEl(card, { hidden = false, small = false, dealing = false } = {}) {
  const cls = 'pcard'
    + (small ? ' pcard--sm' : '')
    + (hidden ? ' back' : (E.isRedSuit(card.suit) ? ' red' : ''))
    + (dealing ? ' dealing' : '');
  if (hidden) return el('div', { class: cls }, el('span', { class: 's' }, '✦'));
  return el('div', { class: cls },
    el('span', { class: 'r' }, card.rank),
    el('span', { class: 's' }, card.suit),
    felt ? el('span', { class: 'c', 'aria-hidden': 'true' }, card.rank + card.suit) : '',
  );
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const CHIP_DENOMS = [100, 50, 20, 10, 5, 1];

function exactChipBreakdown(amount) {
  const stacks = {};
  let left = Math.max(0, Math.floor(amount));
  for (const d of CHIP_DENOMS) {
    const count = Math.floor(left / d);
    if (count > 0) {
      stacks[d] = count;
      left -= count * d;
    }
  }
  return stacks;
}

const CHIP_PALETTE = {
  1: { face: '#e8e8ee', rim: '#9ca3af', side: '#525866', text: '#1a1a1a' },
  5: { face: '#ffd23f', rim: '#d4a017', side: '#9a4a00', text: '#3a1200' },
  10: { face: '#2ee6d6', rim: '#12b5a8', side: '#0b756d', text: '#03302c' },
  20: { face: '#9dff3a', rim: '#68cc18', side: '#3b7a0b', text: '#0b2800' },
  50: { face: '#ff7a1a', rim: '#d45a00', side: '#873400', text: '#2a0e00' },
  100: { face: '#ff2e88', rim: '#c2185b', side: '#7a0f3a', text: '#ffffff' },
};

function parseSvg(markup) {
  const wrap = document.createElement('div');
  wrap.innerHTML = markup.trim();
  return wrap.firstChild;
}

function chipStackSvg(denom, count, bump) {
  const c = CHIP_PALETTE[denom] || CHIP_PALETTE[10];
  const shown = Math.min(count, 10);
  const h = 5.5;
  const step = 6.5;
  const slices = [];

  for (let i = 0; i < shown; i++) {
    const cy = 88 - i * step;
    const isTop = i === shown - 1;
    const gCls = isTop && bump ? ' class="chip-top-drop"' : '';
    const topLabel = isTop
      ? `<ellipse cx="32" cy="${cy}" rx="16.5" ry="6" fill="none" stroke="rgba(255,255,255,0.78)" stroke-width="1.4" stroke-dasharray="4 3"/>
         <text x="32" y="${cy + 3.2}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="9" fill="${c.text}">${denom}</text>`
      : '';
    slices.push(`<g${gCls}>
      <path d="M9 ${cy} A23 9 0 0 0 55 ${cy} L55 ${cy + h} A23 9 0 0 1 9 ${cy + h} Z" fill="${c.side}"/>
      <rect x="13" y="${cy + 3}" width="3.5" height="${h - 0.5}" rx="1" fill="rgba(255,255,255,0.82)"/>
      <rect x="30.2" y="${cy + 6}" width="3.6" height="${h - 0.5}" rx="1" fill="rgba(255,255,255,0.82)"/>
      <rect x="47.5" y="${cy + 3}" width="3.5" height="${h - 0.5}" rx="1" fill="rgba(255,255,255,0.82)"/>
      <ellipse cx="32" cy="${cy}" rx="23" ry="9" fill="${c.face}" stroke="${c.rim}" stroke-width="1.2"/>
      ${topLabel}
    </g>`);
  }

  return parseSvg(`<svg class="chip-stack-svg" viewBox="0 0 64 106" aria-hidden="true">
    <ellipse cx="32" cy="95" rx="25" ry="9" fill="rgba(0,0,0,0.45)"/>
    ${slices.join('')}
  </svg>`);
}

function chipBtnSvg(denom) {
  const c = CHIP_PALETTE[denom] || CHIP_PALETTE[10];
  return parseSvg(`<svg viewBox="0 0 56 56" aria-hidden="true">
    <ellipse cx="28" cy="32" rx="24" ry="22" fill="${c.side}"/>
    <circle cx="28" cy="26" r="23" fill="${c.face}" stroke="${c.rim}" stroke-width="1.5"/>
    <circle cx="28" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="3" stroke-dasharray="6 5"/>
    <circle cx="28" cy="26" r="15" fill="none" stroke="${c.rim}" stroke-width="1.2"/>
    <text x="28" y="30" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="13" fill="${c.text}">+${denom}</text>
  </svg>`);
}

function renderBetStage(player, minReq) {
  const bump = betBump;
  const targetDenom = bumpDenom;
  betBump = false;
  bumpDenom = null;

  const towers = CHIP_DENOMS
    .filter(d => (betStacks[d] || 0) > 0)
    .map(denom => {
      const count = betStacks[denom];
      return el('button', {
        type: 'button',
        class: 'chip-tower',
        title: `-${denom}`,
        onClick: () => {
          if (pendingBet <= minReq) return;
          SFX.tap();
          if (pendingBet - denom >= minReq) {
            pendingBet -= denom;
            betStacks[denom] = count - 1;
          } else {
            pendingBet = minReq;
            betStacks = exactChipBreakdown(minReq);
          }
          betBump = true;
          bumpDenom = denom;
          renderActionBox();
        },
      },
      chipStackSvg(denom, count, bump && (!targetDenom || targetDenom === denom)),
      el('span', { class: 'chip-tower-lbl' }, `${denom}×${count}`));
    });

  return el('div', { class: 'bet-stage' },
    el('div', { class: 'bet-amount' + (bump ? ' bump' : '') }, ...coins(fmt(T.betNow, { n: pendingBet }))),
    el('div', { class: 'chip-stacks' }, ...towers),
    el('p', { class: 'setup-hint' }, ...coins(fmt(T.coinsNow, { n: player.coins }))),
  );
}

function syncPendingBet() {
  if (!state || state.phase !== 'betting') return;
  const p = state.players[state.bettingIndex];
  if (!p) return;
  const minReq = Math.min(state.minBet, p.coins);
  const maxBet = p.coins >= 2 ? p.coins - (p.coins % 2) : p.coins;
  pendingBet = Math.max(minReq, Math.min(p.lastBet || state.minBet, maxBet));
  betStacks = exactChipBreakdown(pendingBet);
}

function outcomeText(hand) {
  if (!hand.outcome) return '';
  if (hand.outcome === 'blackjack') return fmt(T.outBlackjack, { n: hand.payout - hand.bet });
  if (hand.outcome === 'win') return fmt(T.outWin, { n: hand.payout - hand.bet });
  if (hand.outcome === 'push') return T.outPush;
  if (hand.outcome === 'surrender') return fmt(T.outSurrender, { n: hand.bet - hand.payout });
  if (hand.outcome === 'bust') return T.outBust;
  return T.outLose;
}

function renderDealer() {
  const { dealer } = state;
  const visibleCount = dealReveal ? dealReveal.dealer : dealer.cards.length;
  const holeRevealed = dealReveal ? dealReveal.holeRevealed : dealer.holeRevealed;
  const shownCards = dealer.cards.slice(0, visibleCount);

  const cardsRow = el('div', { class: 'cards-row' });
  let scoreText = T.dealerHidden;
  let scoreCls = 'score-pill';

  if (shownCards.length > 0) {
    shownCards.forEach((c, i) => {
      const hidden = i === 1 && !holeRevealed;
      cardsRow.append(cardEl(c, { hidden, dealing: freshCardKey === `d-${i}` }));
    });
    if (holeRevealed) {
      const v = E.handValue(shownCards);
      scoreText = String(v.total);
      if (v.isBust) scoreCls += ' bust';
      else if (v.isBlackjack) scoreCls += ' bj';
    } else {
      scoreText = String(E.cardPoints(shownCards[0].rank)) + ' + ?';
    }
  }

  $('#dealer-box').replaceChildren(
    el('div', { class: 'bj-head' },
      el('span', {}, T.dealerLabel),
      el('span', { class: scoreCls }, scoreText),
    ),
    cardsRow,
  );
}

function renderSeats() {
  const nodes = state.players.map((p, pi) => {
    const isTurn = (state.phase === 'betting' && state.bettingIndex === pi)
      || (state.phase === 'playing' && !dealReveal && state.turnPlayer === pi);
    const isOut = p.left || p.bustedOut;

    const seat = el('div', { class: 'bj-seat' + (isTurn ? ' active' : '') + (isOut ? ' out' : '') });
    const statusBadge = p.left ? T.outLeft : (p.bustedOut && p.hands.length === 0 ? T.outBroke : fmt(T.coinsNow, { n: p.coins }));
    seat.append(el('div', { class: 'bj-seat-top' },
      el('span', { class: 'bj-seat-name' }, p.name),
      el('span', { class: 'bj-seat-coins' }, ...coins(statusBadge)),
    ));

    // On the felt, a seat waiting for the deal keeps its place laid out (score slot, empty row, the bet's spot):
    // the table has its playing size from the first bet on, and the next round does not shrink it
    if (felt && p.hands.length === 0 && !isOut) {
      const betting = state.phase === 'betting' && state.bettingIndex === pi;
      seat.append(el('div', { class: 'bj-hands' }, el('div', { class: 'bj-hand' },
        el('div', { class: 'bj-hand-meta' }, el('span', { class: 'score-pill slot', 'aria-hidden': 'true' }, '0')),
        el('div', { class: 'cards-row' }),
        el('div', { class: 'bet-spot' + (betting ? '' : ' empty') }, chipSpotSvg(), el('b', { class: 'pending-bet' }, String(betting ? pendingBet : 0))))));
    }

    if (p.hands.length > 0) {
      const handsWrap = el('div', { class: 'bj-hands' });
      p.hands.forEach((h, hi) => {
        const activeHand = state.phase === 'playing' && !dealReveal && state.turnPlayer === pi && state.turnHand === hi;
        const handEl = el('div', { class: 'bj-hand' + (activeHand ? ' active-hand' : '') });
        const limit = dealReveal ? (dealReveal.players[pi]?.[hi] ?? h.cards.length) : h.cards.length;
        const shownCards = h.cards.slice(0, limit);
        const val = shownCards.length ? E.handValue(shownCards, { isSplit: h.split }) : null;
        const showOutcome = h.outcome && (!dealReveal || dealReveal.showOutcomes);
        const label = p.hands.length > 1 ? fmt(T.handN, { n: hi + 1 }) + ' · ' : '';
        const metaLeft = label + fmt(T.betNow, { n: h.bet });
        const metaRight = showOutcome
          ? el('span', { class: 'outcome-tag ' + h.outcome }, outcomeText(h))
          : (val ? el('span', { class: 'score-pill' + (val.isBust ? ' bust' : (val.isBlackjack ? ' bj' : '')) }, String(val.total))
            : (felt ? el('span', { class: 'score-pill slot', 'aria-hidden': 'true' }, '0') : ''));

        handEl.append(el('div', { class: 'bj-hand-meta' }, el('span', { class: 'bet-text' }, ...coins(metaLeft)), metaRight));
        // On the felt the row is there from the bet on, empty: the table opens at its full size and each card lands in its place
        if (shownCards.length > 0 || felt) {
          handEl.append(el('div', { class: 'cards-row' },
            ...shownCards.map((c, ci) => cardEl(c, {
              small: state.players.length > 2,
              dealing: freshCardKey === `p-${pi}-${hi}-${ci}`,
            }))));
        }
        if (felt) {
          handEl.append(el('div', { class: 'bet-spot' }, chipSpotSvg(), el('b', {}, String(h.bet))));
          if (showOutcome) handEl.append(el('div', { class: 'stamp ' + h.outcome }, outcomeText(h)));
        }
        handsWrap.append(handEl);
      });
      seat.append(handsWrap);
    }
    // On the felt the plate rides with the first hand's bet spot, right above it (style.css), whatever the seat's height
    const firstHand = felt && seat.querySelector('.bj-hand');
    if (firstHand) firstHand.append(seat.querySelector('.bj-seat-top'));
    return seat;
  });

  $('#seats-box').replaceChildren(...nodes);
}

function renderActionBox() {
  if (armedAction && armedContext !== armKey()) disarm();
  const box = $('#action-box');
  const myIdx = myPlayerIndex();

  if (dealReveal) {
    box.replaceChildren(el('p', { class: 'waiting center' }, dealReveal.house ? T.houseTurn : T.dealing));
    return;
  }

  if (state.phase === 'betting') {
    const p = state.players[state.bettingIndex];
    if (mode === 'online' && myIdx !== state.bettingIndex) {
      box.replaceChildren(el('p', { class: 'waiting center' }, fmt(T.waitBet, { name: p.name })));
      return;
    }
    const minReq = Math.min(state.minBet, p.coins);
    const maxBet = p.coins >= 2 ? p.coins - (p.coins % 2) : p.coins;
    const addChip = n => {
      if (pendingBet + n > maxBet) return;
      SFX.tap();
      SFX.reveal();
      flyChip(n, pileEl(n), betSpotEl());
      pendingBet += n;
      betStacks[n] = (betStacks[n] || 0) + 1;
      betBump = true;
      bumpDenom = n;
      renderActionBox();
    };
    $$('#seats-box .pending-bet').forEach(b => { b.textContent = String(pendingBet); });
    box.replaceChildren(
      el('p', { class: 'lead center' }, fmt(T.bettingTurn, { name: p.name })),
      renderBetStage(p, minReq),
      // The first step, every betting round: one stitched line right above the chips it points at; the button is the next step on its own
      felt ? el('p', { class: 'bet-hint' }, T.betHint, el('i', { 'aria-hidden': 'true' }, '↓')) : '',
      el('div', { class: 'casino-chips' },
        ...[10, 20, 50, 100].map(n => el('button', {
          type: 'button',
          class: 'casino-chip',
          'data-denom': String(n),
          disabled: pendingBet + n > maxBet,
          onClick: () => addChip(n),
        }, chipBtnSvg(n))),
      ),
      el('div', { class: 'chips-row' },
        el('button', { class: 'bet-chip', disabled: pendingBet <= minReq, onClick: () => {
          SFX.tap();
          // Each chip above the minimum goes back to its own pile, one after another
          const keep = exactChipBreakdown(minReq);
          const spot = betSpotEl();
          let k = 0;
          for (const d of Object.keys(betStacks).map(Number).sort((x, y) => y - x)) {
            for (let i = 0; i < (betStacks[d] || 0) - (keep[d] || 0); i++) flyChip(d, spot, pileEl(d), 70 * k++);
          }
          pendingBet = minReq; betStacks = keep; betBump = true; renderActionBox();
        } }, T.chipClear),
        el('button', { class: 'bet-chip', disabled: pendingBet >= maxBet, onClick: () => { SFX.tap(); SFX.reveal(); pendingBet = maxBet; betStacks = exactChipBreakdown(maxBet); betBump = true; renderActionBox(); } }, T.chipMax),
      ),
      el('div', { class: 'actions-grid' },
        confirmBtn({ id: 'btn-leave', key: 'leave-bet', label: T.leaveTable, confirmLabel: T.confirmLeave, onConfirm: () => leaveTable(state.bettingIndex) }),
        el('button', { class: 'btn btn--yellow', id: 'btn-bet', onClick: () => placeBet(pendingBet) }, T.placeBet),
      ),
    );
    return;
  }

  if (state.phase === 'playing') {
    const p = state.players[state.turnPlayer];
    if (mode === 'online' && myIdx !== state.turnPlayer) {
      box.replaceChildren(el('p', { class: 'waiting center' }, fmt(T.waitTurn, { name: p.name })));
      return;
    }
    const btns = [
      el('button', { class: 'btn btn--cyan', id: 'btn-hit', disabled: !E.canHit(state), onClick: hit }, T.hit),
      el('button', { class: 'btn btn--yellow', id: 'btn-stand', disabled: !E.canStand(state), onClick: stand }, T.stand),
    ];
    if (E.canDouble(state)) {
      btns.push(el('button', { class: 'btn btn--pink', id: 'btn-double', onClick: doubleDown }, T.double));
    }
    if (E.canSplit(state)) {
      btns.push(el('button', { class: 'btn btn--ghost', id: 'btn-split', onClick: split }, T.split));
    }
    if (E.canSurrender(state)) {
      btns.push(confirmBtn({ id: 'btn-surrender', key: 'surrender', label: T.surrender, confirmLabel: T.confirmSurrender, onConfirm: surrender }));
    }
    box.replaceChildren(
      el('p', { class: 'lead center' }, fmt(T.turnOf, { name: p.name })),
      el('div', { class: 'actions-grid' }, ...btns),
    );
    return;
  }

  if (state.phase === 'roundEnd') {
    const willEnd = state.redCardOut
      || (state.maxRounds > 0 && state.round >= state.maxRounds)
      || !state.players.some(pl => !pl.left && !pl.bustedOut && pl.coins > 0);
    const isHost = mode !== 'online' || online.role === 'A';
    const me = myIdx !== null ? state.players[myIdx] : state.players[0];
    const canMeLeave = !willEnd && me && !me.left && me.coins > 0;

    box.replaceChildren(
      isHost
        ? el('button', { class: 'btn btn--yellow', id: 'btn-next-round', onClick: nextRound }, willEnd ? T.seeResults : T.nextRound)
        : el('p', { class: 'waiting center' }, fmt(T.waitNext, { name: state.players[0].name })),
      ...(canMeLeave
        ? [confirmBtn({ id: 'btn-leave-round', key: 'leave-round', label: T.leaveTable, confirmLabel: T.confirmLeave, baseClass: 'btn btn--ghost btn--sm', onConfirm: () => leaveTable(myIdx ?? 0) })]
        : []),
    );
  }
}

function visibleShoeRemaining() {
  const base = E.shoeRemaining(state);
  if (!dealReveal) return base;
  const totalRound = state.dealer.cards.length
    + state.players.reduce((s, p) => s + p.hands.reduce((hs, h) => hs + h.cards.length, 0), 0);
  const revealedRound = dealReveal.dealer
    + dealReveal.players.reduce((s, hs) => s + hs.reduce((a, b) => a + b, 0), 0);
  return base + Math.max(0, totalRound - revealedRound);
}

function renderPlay() {
  if (E.isOver(state)) return renderResult();
  $('#round-chip').textContent = state.maxRounds > 0
    ? fmt(T.roundBadge, { r: state.round, max: state.maxRounds })
    : fmt(T.roundOpen, { r: state.round });
  const shoeLeft = visibleShoeRemaining();
  $('#shoe-chip').textContent = fmt(T.shoeInfo, { n: shoeLeft, total: state.shoe.length });
  if (felt) renderFeltBits(shoeLeft);
  const alertEl = $('#red-alert');
  alertEl.hidden = !state.redCardOut;
  alertEl.textContent = T.redCardAlert;

  // One player alone needs no «Turno de Ana» over the buttons (the felt hides it, to keep the screen in one view)
  $('#screen-play').classList.toggle('solo', state.players.length === 1);
  renderDealer();
  renderSeats();
  renderActionBox();
  showScreen('screen-play');
  fitPlay();
}

/* ---------------- The felt table (lab: #seccion-blackjack-felt) ---------------- */
/**
 * The felt fills the phone's height: the play screen is given exactly what is left of the view under the top bar,
 * and the table (a flex child, style.css) takes all of it the bar, the buttons and «Cómo se juega» do not use.
 */
function fitPlay() {
  const s = $('#screen-play');
  if (!felt || !s?.classList.contains('active')) { if (s) s.style.minHeight = ''; return; }
  s.style.minHeight = '';
  const top = s.getBoundingClientRect().top + scrollY;
  const below = document.documentElement.scrollHeight - (s.getBoundingClientRect().bottom + scrollY);
  s.style.minHeight = Math.max(0, innerHeight - top - below) + 'px';
}
addEventListener('resize', () => fitPlay());

/** A text with 🪙: on the felt (flag blackjack-felt) each 🪙 becomes the table's yellow chip, which iPhone drew as a grey moon. */
function coins(text) {
  if (!felt || !String(text).includes('🪙')) return [text];
  return String(text).split('🪙').flatMap((part, i) => i ? [el('span', { class: 'seg-chip' }, chipSpotSvg(5)), part.replace(/^ /, '')] : [part]).filter(x => x !== '');
}

/** On the felt, a chip flies between the player's pile (its button) and the bet's spot: added, it lands on the
 *  bet; cleared, it goes back to its own pile. A copy flies over the page, so the boxes can re-render under it. */
function flyChip(denom, from, to, delay = 0) {
  if (!felt || !from || !to || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const size = Math.min(a.width, a.height);
  const chip = el('div', { class: 'bj-flying-chip', 'aria-hidden': 'true' }, chipBtnSvg(denom));
  Object.assign(chip.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
  document.body.append(chip);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const scale = Math.max(0.5, Math.min(b.width, b.height) * 0.7 / size);
  chip.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx / 2}px, ${dy / 2 - 40}px) scale(${(1 + scale) / 2 * 1.08})`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.9 },
  ], { duration: 460, delay, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'both' }).finished.then(() => chip.remove(), () => chip.remove());
}
const betSpotEl = () => $('#seats-box .bet-spot:not(.empty)') || $('#seats-box .bet-spot');
const pileEl = denom => $(`#action-box .casino-chip[data-denom="${denom}"]`);

function chipSpotSvg(value = 10) {
  const c = CHIP_PALETTE[value];
  return parseSvg(`<svg viewBox="0 0 56 56" aria-hidden="true">
    <ellipse cx="28" cy="32" rx="24" ry="22" fill="${c.side}"/>
    <circle cx="28" cy="26" r="23" fill="${c.face}" stroke="${c.rim}" stroke-width="1.5"/>
    <circle cx="28" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="3" stroke-dasharray="6 5"/>
    <circle cx="28" cy="26" r="15" fill="none" stroke="${c.rim}" stroke-width="1.2"/>
  </svg>`);
}

/** The shoe as a bar that empties, with the red card's place marked, and the table's two lines in an arc. */
function renderFeltBits(shoeLeft) {
  const total = state.shoe.length;
  const cutAt = 100 * (1 - state.cutIndex / total);
  $('#shoe-chip').replaceChildren(el('span', { class: 'shoe' },
    el('span', {}, fmt(T.shoeInfo, { n: shoeLeft, total })),
    el('span', { class: 'shoe-bar', role: 'presentation' },
      el('i', { style: `width:${(100 * shoeLeft / total).toFixed(1)}%` }),
      el('u', { style: `left:${cutAt.toFixed(1)}%` }))));
  const arc = $('#felt-arc');
  if (arc.dataset.lang === lang) return;
  arc.dataset.lang = lang;
  arc.replaceChildren(parseSvg(`<svg viewBox="0 0 340 70">
    <path id="felt-p1" d="M20 6 Q170 50 320 6" fill="none"/><path id="felt-p2" d="M40 31 Q170 71 300 31" fill="none"/>
    <text text-anchor="middle"><textPath href="#felt-p1" startOffset="50%"></textPath></text>
    <text class="sub" text-anchor="middle"><textPath href="#felt-p2" startOffset="50%"></textPath></text>
  </svg>`));
  const [a, b] = arc.querySelectorAll('textPath');
  a.textContent = T.feltPays;
  b.textContent = T.feltStands;
}

/* ---------------- The cover's demo (lab: #seccion-blackjack-felt) ---------------- */
// A hand dealt on the cover, over and over: the player's two cards and the dealer's, then a Blackjack.
// Steps on a clock of DEMO_MS; drawn through onScreen, so it sleeps while scrolled away (C-1, #883)
const DEMO_MS = 5200;
const DEMO_STEPS = [
  { at: 300, who: 'p', card: { rank: 'A', suit: '♠' } },
  { at: 750, who: 'd', card: { rank: '7', suit: '♥' } },
  { at: 1200, who: 'p', card: { rank: 'K', suit: '♦' } },
  { at: 1650, who: 'd', card: null },
  { at: 2200, win: true },
];
function startCoverDemo() {
  const box = $('#bj-demo');
  if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  box.hidden = false;
  $('.intro-hero .bj-logo')?.setAttribute('hidden', '');
  const dealer = el('div', { class: 'cards-row' });
  const player = el('div', { class: 'cards-row' });
  const score = el('span', { class: 'score-pill' }, '');
  const banner = el('div', { class: 'bj-demo-win' }, T.outBlackjack.replace(/\s*\+\{n\}/, ''));
  box.replaceChildren(dealer, el('div', { class: 'bj-demo-player' }, player, score), banner);
  let shown = -1, t0 = null;
  const reset = () => { dealer.replaceChildren(); player.replaceChildren(); score.textContent = ''; score.hidden = true; box.classList.remove('win'); shown = -1; };
  const frame = now => {
    t0 ??= now;
    const t = (now - t0) % DEMO_MS;
    if (t < 200 && shown >= 0) reset();
    while (shown + 1 < DEMO_STEPS.length && DEMO_STEPS[shown + 1].at <= t) {
      const s = DEMO_STEPS[++shown];
      if (s.win) { box.classList.add('win'); continue; }
      const card = s.card ? cardEl(s.card, { dealing: true }) : cardEl(null, { hidden: true, dealing: true });
      // The row is centred, so a new card shifts the ones already dealt: they glide there (FLIP), not jump
      const row = s.who === 'p' ? player : dealer;
      const before = [...row.children].map(c => [c, c.getBoundingClientRect().left]);
      row.append(card);
      for (const [c, x] of before) {
        const dx = x - c.getBoundingClientRect().left;
        if (dx && !matchMedia('(prefers-reduced-motion: reduce)').matches) c.animate?.([{ translate: dx + 'px 0' }, { translate: '0 0' }], { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
      if (s.who === 'p') {
        const cards = DEMO_STEPS.slice(0, shown + 1).filter(x => x.who === 'p').map(x => x.card);
        score.hidden = false;
        score.textContent = String(E.handValue(cards).total);
      }
    }
    next();
  };
  const next = onScreen(box, frame);
  reset();
  next();
}

/* ---------------- Actions & Casino Deal Sequences ---------------- */
function applyAction(prev, act, extra = {}) {
  if (act === 'bet') return E.placeBet(prev, extra.amount);
  if (act === 'hit') return E.hit(prev);
  if (act === 'stand') return E.stand(prev);
  if (act === 'double') return E.doubleDown(prev);
  if (act === 'split') return E.split(prev);
  if (act === 'surrender') return E.surrender(prev);
  if (act === 'next') return E.nextRound(prev);
  if (act === 'leave') return E.leaveTable(prev, extra.playerIndex);
  return prev;
}

async function runDealerReveal(token, next, { initialDealer = 2 } = {}) {
  dealReveal = {
    players: next.players.map(p => p.hands.map(h => h.cards.length)),
    dealer: Math.min(initialDealer, next.dealer.cards.length),
    holeRevealed: false,
    showOutcomes: false,
    house: true,
  };
  freshCardKey = null;
  renderPlay();

  await wait(450);
  if (token !== animToken) return;
  dealReveal.holeRevealed = true;
  freshCardKey = 'd-1';
  SFX.flip();
  SFX.reveal();
  renderPlay();

  for (let d = 2; d < next.dealer.cards.length; d++) {
    await wait(600);
    if (token !== animToken) return;
    dealReveal.dealer = d + 1;
    freshCardKey = `d-${d}`;
    SFX.flip();
    SFX.reveal();
    renderPlay();
  }

  await wait(600);
  if (token !== animToken) return;
  dealReveal = null;
  freshCardKey = null;
  const anyPlayerBj = next.players.some(p => p.hands.some(h => h.outcome === 'blackjack'));
  const dealerBj = E.handValue(next.dealer.cards).isBlackjack;
  const anyWon = next.players.some(p => p.hands.some(h => h.outcome === 'win'));
  if (anyPlayerBj) showBlackjackFx('win');
  else if (dealerBj) showBlackjackFx('lose');
  else if (anyWon) SFX.win();
  renderPlay();
}

function showBlackjackFx(kind) {
  document.querySelectorAll('.bj-fx').forEach(n => n.remove());
  const app = $('#app');
  app?.classList.remove('bj-shake');

  const isWin = kind === 'win';
  const graphic = isWin
    ? el('img', { class: 'bj-logo', src: 'icon.svg', alt: '', width: 84, height: 84 })
    : el('span', { class: 'bj-fx-icon', 'aria-hidden': 'true' }, '🎩');
  const overlay = el('div', { class: `bj-fx bj-fx--${kind}`, role: 'status' },
    el('div', { class: 'bj-fx-card' },
      graphic,
      el('div', { class: 'bj-fx-title' }, isWin ? T.fxPlayerBj : T.fxDealerBj),
    ),
  );
  document.body.append(overlay);

  if (isWin) {
    confetti();
    SFX.fourthKing();
    vibrate([40, 60, 100]);
  } else {
    void app?.offsetWidth;
    app?.classList.add('bj-shake');
    setTimeout(() => app?.classList.remove('bj-shake'), 700);
    SFX.hang();
    SFX.heartbeat();
    vibrate([90, 40, 140]);
  }

  setTimeout(() => overlay.remove(), 1900);
}

/** Paints with a view transition on the felt table (flag blackjack-felt); at once without it, or under reduced motion. */
function morph(paint) {
  if (!felt || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { paint(); return Promise.resolve(); }
  return document.startViewTransition(paint).updateCallbackDone.catch(() => {});
}

async function animateTransition(prev, next) {
  const token = ++animToken;
  freshCardKey = null;

  try {
    // 1. Entering deal (betting -> playing or immediate roundEnd)
    if (prev.phase === 'betting' && (next.phase === 'playing' || next.phase === 'roundEnd')) {
      clearing = false;
      $('.bj-table')?.classList.remove('clearing');
      const pCounts = next.players.map(p => p.hands.map(() => 0));
      dealReveal = { players: pCounts, dealer: 0, holeRevealed: false, showOutcomes: false };
      // The bet goes down: the felt table opens up and the betting box folds away in one smooth move
      await morph(renderPlay);

      for (let pass = 0; pass < 2; pass++) {
        for (let pi = 0; pi < next.players.length; pi++) {
          if (next.players[pi].hands.length === 0) continue;
          await wait(400);
          if (token !== animToken) return;
          pCounts[pi][0] = pass + 1;
          freshCardKey = `p-${pi}-0-${pass}`;
          SFX.flip();
          SFX.reveal();
          renderPlay();
        }
        await wait(400);
        if (token !== animToken) return;
        dealReveal.dealer = pass + 1;
        freshCardKey = `d-${pass}`;
        SFX.flip();
        if (pass === 0) SFX.reveal(); // hole card stays suspensefully face down
        renderPlay();
      }

      if (next.phase === 'roundEnd') {
        await runDealerReveal(token, next);
        return;
      }
      await wait(250);
      if (token !== animToken) return;
      dealReveal = null;
      freshCardKey = null;
      SFX.turn();
      renderPlay();
      return;
    }

    // 2. Player drew a card (hit / double / split)
    if (prev.phase === 'playing') {
      const pi = prev.turnPlayer;
      const hi = prev.turnHand;
      const nextHand = next.players[pi]?.hands[hi];
      const prevLen = prev.players[pi]?.hands[hi]?.cards.length ?? 0;

      if (nextHand && nextHand.cards.length > prevLen) {
        const drawnIdx = nextHand.cards.length - 1;
        freshCardKey = `p-${pi}-${hi}-${drawnIdx}`;
        SFX.flip();
        SFX.reveal();

        if (next.phase === 'roundEnd') {
          // Show player's new card before flipping dealer hole card
          dealReveal = {
            players: next.players.map(p => p.hands.map(h => h.cards.length)),
            dealer: 2,
            holeRevealed: false,
            showOutcomes: false,
          };
          renderPlay();
          await wait(750);
          if (token !== animToken) return;
          await runDealerReveal(token, next);
          return;
        }
      } else if (next.phase === 'roundEnd') {
        await runDealerReveal(token, next);
        return;
      }
    }

    dealReveal = null;
    renderPlay();
  } finally {
    if (token === animToken && dealReveal) {
      dealReveal = null;
      freshCardKey = null;
      renderPlay();
    }
  }
}

function dispatch(act, extra = {}) {
  if (clearing) return;
  if (!(mode === 'online' && online) && dealReveal) return;
  disarm();
  SFX.tap();
  // On the felt, the dealt cards and stamps fade off the table before the next round's bets
  const table = $('.bj-table');
  if (felt && act === 'next' && !(mode === 'online' && online) && table
      && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clearing = true;
    const btn = $('#btn-next-round');
    if (btn) btn.disabled = true;
    table.classList.add('clearing');
    setTimeout(() => {
      clearing = false;
      table.classList.remove('clearing');
      commitDispatch(act, extra);
    }, CLEAR_MS);
    return;
  }
  commitDispatch(act, extra);
}

function commitDispatch(act, extra = {}) {
  if (mode === 'online' && online) {
    online.transport.send({ t: 'bj', from: online.role, act, ...extra });
    return;
  }
  const prev = state;
  const next = applyAction(prev, act, extra);
  state = next;

  syncPendingBet();
  save();
  if (E.isOver(state)) {
    const winners = state.winner?.winners.map(i => state.players[i].name) || [];
    trackFinish({ ganador: winners.join(', ') || 'House' });
  }
  animateTransition(prev, next);
}

function placeBet(amount) { dispatch('bet', { amount }); }
function hit() {
  const cards = felt && $('#seats-box .bj-hand.active-hand .cards-row');
  if (cards) { const r = cards.getBoundingClientRect(); showTapHand(r.left + r.width * 0.72, r.top + r.height * 0.55); }
  dispatch('hit');
}
function stand() { dispatch('stand'); }
function doubleDown() { dispatch('double'); }
function split() { dispatch('split'); }
function surrender() { dispatch('surrender'); }
function nextRound() { dispatch('next'); }
function leaveTable(playerIndex) { dispatch('leave', { playerIndex }); }

/* ---------------- Result (C-19) ---------------- */
function resultHeading() {
  if (state.players.length === 1) {
    const p = state.players[0];
    const diff = p.coins - state.startingCoins;
    if (diff > 0) return fmt(T.winnerSoloWin, { diff });
    if (diff === 0) return T.winnerSoloEven;
    return fmt(T.winnerSoloLose, { diff: -diff });
  }
  const { winners, topCoins } = state.winner;
  if (winners.length > 1) {
    return fmt(T.winnerTie, { coins: topCoins, names: winners.map(i => state.players[i].name).join(', ') });
  }
  return fmt(T.winnerMulti, { name: state.players[winners[0]].name, coins: topCoins });
}

function endReasonText() {
  if (state.endReason === 'redCard') return T.endRedCard;
  if (state.endReason === 'broke') return T.endBroke;
  if (state.endReason === 'left') return T.endLeft;
  return T.endRounds;
}

function renderResult() {
  const title = resultHeading();
  // The hero's emoji is said once (D-353): the big trophy or 💸 above, so the title on screen drops its own (the shared text keeps it)
  $('#result-title').textContent = title.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, '');
  $('#result-reason').textContent = endReasonText();
  // On the felt, the house's win is not celebrated: a player who ends with fewer coins than they sat down with
  // (alone, or this phone's player online) gets a red room and a sinking 💸 instead of confetti; even, neither
  const me = mode === 'online' ? state.players[myPlayerIndex()] : (state.players.length === 1 ? state.players[0] : null);
  const outcome = !felt || !me ? 'won' : me.coins < state.startingCoins ? 'lost' : me.coins === state.startingCoins ? 'even' : 'won';
  $('#screen-result').classList.toggle('defeat', outcome === 'lost');
  $('#screen-result .trophy').textContent = outcome === 'lost' ? '💸' : outcome === 'even' ? '🤝' : '🏆';

  const sorted = [...state.players].sort((a, b) =>
    (b.coins - a.coins) || ((b.handsWon || 0) - (a.handsWon || 0)) || ((b.blackjacks || 0) - (a.blackjacks || 0)));
  const top = sorted[0];
  $('#standings').replaceChildren(...sorted.map((p, i) => {
    const isTop = top && p.coins === top.coins && (p.handsWon || 0) === (top.handsWon || 0) && (p.blackjacks || 0) === (top.blackjacks || 0) && p.coins > 0;
    const label = `${i + 1}. ${p.name} · ${p.handsWon === 1 ? T.handsWonOne : fmt(T.handsWonN, { n: p.handsWon || 0 })}`;
    return el('li', { class: isTop ? 'top' : '' },
      el('span', {}, label),
      el('b', {}, ...coins(`🪙 ${p.coins}`)));
  }));

  // Alone, the hero already says the coins: no one-row table repeating them (D-353)
  $('#standings').hidden = state.players.length === 1;

  const shareCtx = mode === 'cpu' ? T.shareContextSolo : T.shareContextOnline;
  // The message carries the table (U-30, U-31): one line per player by coins; alone, the title already says them
  const shareBody = state.players.length > 1
    ? [title, ...sorted.map((p, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${p.name} 🪙 ${p.coins}`)].join('\n')
    : title;
  $('#result-actions').replaceChildren(
    el('button', {
      class: 'btn btn--yellow', id: 'btn-again',
      onClick: e => {
        SFX.tap();
        if (mode === 'online') {
          tryRematch(e.currentTarget, rematchOnline, { T, busy: C.opening });
          return;
        }
        animToken++;
        dealReveal = null;
        freshCardKey = null;
        clearing = false;
        $('.bj-table')?.classList.remove('clearing');
        startedAt = Date.now();
        state = E.newGame(
          state.players.map(p => p.name),
          { decks: state.decks, maxRounds: state.maxRounds, startingCoins: state.startingCoins, minBet: state.minBet },
        );
        syncPendingBet();
        save();
        renderPlay();
      },
    }, mode === 'online' ? T.rematch : T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({
        titulo: T.title,
        url: location.origin + location.pathname,
        texto: result({ tagline: taglineLine(manifest.tagline, lang), head: { emoji: manifest.emoji, title: T.title, context: shareCtx }, paragraphs: [shareBody] }),
      }),
    }),
    // Change mode (C-19): back to the cover's modes
    el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-change-mode', onClick: () => { SFX.tap(); showScreen('screen-intro'); } }, T.changeMode),
  );
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  resultRankings();
  if (outcome === 'won') confetti();
  else if (outcome === 'lost') { SFX.hang(); vibrate([90, 40, 140]); }
  showScreen('screen-result');
}

/**
 * The rankings of a result (C-19, D-212): alone against the house, the coins left are the score (blackjack_solo):
 * a signed-in player's notice under the hero, otherwise «¿Quieres que esta partida cuente?» after the buttons,
 * and the game's table after the exits; online, the win goes to the victories (finDePartida). The feedback link
 * last. Recorded once per game, not on each redraw.
 */
function resultRankings() {
  const key = [online?.code || 'cpu', state.round, ...state.players.map(p => p.name + ':' + p.coins)].join('|');
  const first = key !== recorded;
  recorded = key;
  const podio = $('#result-podio'), rank = $('#result-rank');
  if (mode === 'online' && online) {
    podio.replaceChildren(); rank.replaceChildren();
    if (first) {
      const roles = online.match.players;
      finDePartida({ juego: GAME_ID, modo: 'online', rol: online.role, ganadores: (state.winner?.winners || []).map(i => roles[i]), nombres: online.match.names, alTocar: () => SFX.tap() });
    }
    return;
  }
  if (!first) return;
  const me = state.players[0];
  const s = Math.max(0, me.coins), ms = Math.max(0, Date.now() - startedAt);
  const table = bloqueTabla({ tabla: `${GAME_ID}_solo`, titulo: fmt(C.rk.titleOf, { game: T.title }), alTocar: () => SFX.tap(), entrar: false });
  rank.replaceChildren(table);
  $('#screen-result .rk-contar-solo')?.remove();
  if (rankingsVisibles() && leerYo()) {
    podio.replaceChildren(avisoPartida({ juego: GAME_ID, variante: 'solo', s, ms, alAnotar: () => table.recargar() }));
  } else {
    podio.replaceChildren();
    if (rankingsVisibles()) {
      const offer = avisoPartida({ juego: GAME_ID, variante: 'solo', s, ms, alAnotar: () => table.recargar(), nombre: me.name, alTocar: () => SFX.tap() });
      offer.classList.add('rk-contar-solo');
      $('#result-actions').after(offer);
    }
  }
  ponerBuzon($('#screen-result'), { juego: GAME_ID });
}

/* On the felt, «Pedir» shows the table's gesture for it: a hand taps the cloth twice by your cards, as a
 * player asks a real dealer for a card. Only the picture: the button is what asks. */
function showTapHand(x, y) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hand = el('div', { class: 'bj-tap-hand', 'aria-hidden': 'true' }, el('span', {}, '👆'), el('i', {}), el('i', {}));
  Object.assign(hand.style, { left: `${x}px`, top: `${y}px` });
  document.body.append(hand);
  setTimeout(() => hand.remove(), 900);
}

/* ---------------- Init ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  renderModes();
  renderResumeSlot();
  flag('blackjack-felt').then(on => {
    felt = on;
    document.documentElement.classList.toggle('bj-felt', on);
    if (on) { startCoverDemo(); fillHow(); }
    // The table fills the height the actions leave it: the actions box keeps the tallest height it has had at this
    // width, so a turn's shorter buttons never stretch the table and every seat stays where it was
    if (on && 'ResizeObserver' in window) {
      let tallest = 0, width = innerWidth;
      new ResizeObserver(([e]) => {
        const box = e.target;
        if (innerWidth !== width) { width = innerWidth; tallest = 0; box.style.minHeight = ''; return; }
        const h = box.getBoundingClientRect().height;
        if (h > tallest) { tallest = h; box.style.minHeight = h + 'px'; }
      }).observe($('#action-box'));
    }
    if (state && $('#screen-play').classList.contains('active')) renderPlay();
  }).catch(() => {});
  $('#rk-slot')?.append(bloqueJugador({ alTocar: () => SFX.tap() }));
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });

  const roomCode = (param('room') || '').toUpperCase();
  if (/^[A-Z]{4}$/.test(roomCode)) {
    const saved = store.load();
    if (saved && saved.mode === 'online' && saved.code === roomCode && !saved.done) {
      joinOnline(roomCode, saved.name, saved.role).catch(() => renderSetupOnline(roomCode));
    } else {
      renderSetupOnline(roomCode);
    }
  }
}

window.__blackjack = { state: () => state, placeBet, hit, stand, doubleDown, split, surrender, nextRound, leaveTable, showBlackjackFx };
init();
