/**
 * Cryptic: screens and drawing (C-2), the only file that touches the DOM. The rules are in
 * engine.js, the texts in rules.js, the clues in clues.js. Screens: intro → play → step (each clue's
 * answer, then the next) → result (the day's score out of 100). The game is saved after every move to resume
 * it (C-6); each day's result is kept on the phone for the streak. Lab only (D-395).
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { finDePartida } from '../../assets/js/ranking.js';
import { botonCompartir, taglineLine } from '../../assets/js/compartir.js';
import { result } from '../../assets/js/share-templates.js';
import { GAME_ID, CLUE_LANG, LOCALES } from './rules.js';
import { CLUES } from './clues.js';
import * as E from './engine.js';
import { flapboard } from './flapboard.js';
import { openProposal } from './propose.js';
import { leerYo } from '../../assets/js/jugador.js';
import { tiene } from '../../assets/js/parametros.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/cryptic.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const DAYS_KEY = `juegos-de-salon:${GAME_ID}:days`;
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const BANK = CLUES[CLUE_LANG];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const today = () => E.localDate();

let state = null;
/** The clue being played: its round, its bank entry and its level's name. */
const round = () => E.current(state);
const clue = () => BANK[round().index];
const LEVEL = { e: T.levelE, m: T.levelM, h: T.levelH };
const save = () => store.save({ mode: 'solo', state, done: !!state && E.gameOver(state) });
/** A saved game of the three-clue kind (an older save, one clue a day, is left behind). */
const isGame = g => !!g && Array.isArray(g.clues) && g.clues.length > 0;

/** Each day's result on this phone: { 'YYYY-MM-DD': { solved, score, state } }, `solved` meaning finished. */
function readDays() { try { return JSON.parse(localStorage.getItem(DAYS_KEY) || '{}') || {}; } catch (_) { return {}; } }
function writeDay(date, game) {
  const days = readDays();
  days[date] = { solved: true, score: E.score(game, BANK), state: game };
  try { localStorage.setItem(DAYS_KEY, JSON.stringify(days)); } catch (_) { /* no storage: the streak is not kept */ }
}
/** Today's game, if it was finished on this phone. */
const doneToday = () => { const d = readDays()[today()]; return isGame(d?.state) ? d : null; };

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/** This phone's player, if they entered: their own clues are not theirs to play. */
const me = () => leerYo()?.jid || null;
const picksToday = () => E.dayPicks(BANK, today(), me());

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  // A game half played (C-6): a practice clue, or today's clues while it is still today
  if (!saved || saved.done || !isGame(saved.state) || (!saved.state.practice && saved.state.date !== today())) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { SFX.tap(); state = saved.state; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderModes() {
  const done = doneToday();
  // One way to play: the yellow start button (C-8); practice is a quiet second button under it
  $('#modes').replaceChildren(...[
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'today', onClick: () => { SFX.tap(); startToday(); } },
      done ? T.modeTodayAgain : T.modeToday),
    el('p', { class: 'muted center today-note', id: 'today-note' },
      done ? fmt(T.modeTodayDone, { score: done.score }) : fmt(T.modeTodayHint, { n: E.numberOf(today()) })),
    // The clues are in Spanish: said on the cover, before the first tap
    lang !== CLUE_LANG ? el('p', { class: 'notice notice--warn' }, T.inSpanish) : null,
    el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-practice-cover', 'data-mode': 'practice', onClick: () => { SFX.tap(); startPractice(); } }, T.modePractice),
  ].filter(Boolean));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function begin(game) {
  state = game;
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
  renderPlay();
}

function startToday() {
  const d = today();
  const saved = store.load();
  if (isGame(saved?.state) && !saved.done && !saved.state.practice && saved.state.date === d) { state = saved.state; return renderPlay(); }
  const kept = doneToday();
  if (kept) { state = kept.state; return renderResult(); }
  begin(E.newDay(d, picksToday()));
}

function startPractice() {
  // Any clue but today's three, and never one of the player's own
  const pool = E.practicePool(BANK, picksToday().map(p => p.index), me());
  begin(E.newPractice(pool[Math.floor(Math.random() * pool.length)] ?? 0));
}

/* ---------------- Play ---------------- */
/** The clue with its definition underlined once the second hint is out, or once it is over. */
function clueNodes(r, c) {
  const end = ' ' + E.enumeration(c.a);
  const at = r.hints >= 2 || E.isOver(r) ? c.c.indexOf(c.d) : -1;
  if (at < 0) return [c.c + end];
  return [c.c.slice(0, at), el('u', { class: 'def' }, c.d), c.c.slice(at + c.d.length) + end];
}

/** The boxes show what is typed; the next empty one is marked while the field has focus, so the cursor advances alone. */
function renderTiles() {
  const want = E.normalize(clue().a);
  const typed = E.normalize($('#answer').value).slice(0, want.length);
  $('#tiles').style.setProperty('--n', String(want.length));
  $('#tiles').replaceChildren(...[...want].map((_, i) => el('span', {
    class: 'tile' + (typed[i] ? ' tile--on' : '') + (i === typed.length ? ' tile--at' : ''),
  }, typed[i] || '')));
}

/** Only letters go in, at most one per box, and the caret stays at the end: the boxes fill left to right. */
function onType(ev) {
  const input = $('#answer');
  if (!ev?.isComposing) {
    const n = E.normalize(clue().a).length;
    const letters = [...input.value].filter(ch => /\p{L}/u.test(ch)).slice(0, n).join('');
    if (letters !== input.value) input.value = letters;
  }
  renderTiles();
}

function caretToEnd() {
  const input = $('#answer');
  const end = input.value.length;
  input.setSelectionRange?.(end, end);
}

/** The hints given on this clue, and the button for the next one with what it costs and how many the day has left. */
function renderHints() {
  const c = clue();
  const r = round();
  const lines = [fmt(T.hintKind, { kind: L.kinds[c.k] }), T.hintDef, fmt(T.hintFirst, { letter: E.normalize(c.a)[0] })];
  $('#hints').replaceChildren(...lines.slice(0, r.hints).map(t => el('li', {}, t)));
  const btn = $('#btn-hint');
  btn.textContent = fmt(T.hintBtn, { cost: E.HINT_COST[c.l] });
  btn.hidden = !E.canHint(state);
  // How many of the day's three are left, under the buttons (a practice clue has its own three: no line)
  const left = E.hintsLeft(state);
  $('#hints-left').textContent = !left ? T.hintsNone : left === 1 ? T.hintsLeftOne : fmt(T.hintsLeft, { n: left });
  $('#hints-left').hidden = state.practice;
}

function renderPlay() {
  const r = round();
  if (E.isOver(r)) return E.gameOver(state) && (state.practice || doneToday()) ? renderResult() : renderStep();
  const c = clue();
  $('#clue-label').textContent = state.practice ? T.practiceLabel : fmt(T.clueNumber, { n: E.numberOf(state.date) });
  $('#clue-step').textContent = state.practice
    ? fmt(T.practiceWorth, { level: LEVEL[c.l], p: E.POINTS[c.l] })
    : fmt(T.stepLabel, { level: LEVEL[c.l], i: state.step + 1, p: E.POINTS[c.l] });
  $('#clue-lang').hidden = lang === CLUE_LANG;
  $('#clue').replaceChildren(...clueNodes(r, c));
  const input = $('#answer');
  input.value = '';
  input.setAttribute('aria-label', T.placeholder);
  $('#feedback').hidden = true;
  const give = $('#btn-give-up');
  delete give.dataset.armed;
  give.textContent = T.giveUp;
  renderTiles();
  renderHints();
  showScreen('screen-play');
  input.focus({ preventScroll: true });
}

function say(text, kind) {
  const f = $('#feedback');
  f.className = 'notice notice--' + kind;
  f.textContent = text;
  f.hidden = false;
}

function submit(ev) {
  ev?.preventDefault();
  const input = $('#answer');
  const c = clue();
  const { state: next, verdict } = E.guess(state, input.value, c);
  if (verdict === 'empty' || verdict === 'over') return;
  if (verdict === 'length') {
    SFX.error(); vibrate(40);
    say(fmt(T.lengthWrong, { n: E.normalize(c.a).length, m: E.normalize(input.value).length }), 'warn');
    return;
  }
  state = next;
  save();
  if (verdict === 'right') { SFX.win(); vibrate([30, 40, 30]); return clueOver(); }
  // A wrong guess is the normal move (C-8b, D-56): colour, shake, sound and a line that stays until the next one
  SFX.error(); vibrate(60);
  say(fmt(T.wrong, { g: round().guesses.at(-1) }), 'bad');
  const card = $('.clue-card');
  card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  // The guess is in the red line: the field and the boxes empty for the next one
  input.value = '';
  renderTiles();
  input.focus({ preventScroll: true });
}

function askHint() {
  SFX.reveal();
  state = E.hint(state);
  save();
  $('#clue').replaceChildren(...clueNodes(round(), clue()));
  renderHints();
}

function giveUp() {
  SFX.tap();
  // Two taps: the first asks, so a slip does not lose the clue's points
  const btn = $('#btn-give-up');
  if (!btn.dataset.armed) { btn.dataset.armed = '1'; btn.textContent = T.giveUpSure; return; }
  state = E.giveUp(state);
  save();
  clueOver();
}

/** A clue just ended: the day is kept once its third is over; practice goes to its result, a day to the clue's answer. */
function clueOver() {
  if (E.gameOver(state)) {
    if (!state.practice) writeDay(state.date, state);
    trackFinish({ ganador: E.score(state, BANK) > 0 ? 'yo' : null });
  }
  return state.practice ? renderResult() : renderStep();
}

/* ---------------- Between clues: how it was solved, then the next one ---------------- */
/** A clue as it ended: its clue with the definition underlined, how it is solved and whose it is. */
function solutionNode(r, c, head = null) {
  return el('div', { class: 'solution' },
    head ? el('p', { class: 'solution-head' }, head) : null,
    el('p', { class: 'clue clue--small' }, ...clueNodes(r, c)),
    el('p', {}, c.x),
    c.by?.n ? el('p', { class: 'muted' }, fmt(T.credit, { n: c.by.n })) : null);
}
const triesText = r => (r.guesses.length === 1 ? T.triesOne : fmt(T.tries, { n: r.guesses.length }));

function renderStep() {
  const r = round();
  const c = clue();
  $('#step-mark').textContent = r.solved ? '✅' : '🏳️';
  $('#step-title').textContent = r.solved ? fmt(T.stepSolved, { p: E.pointsOf(r, c.l) }) : fmt(T.gaveUpTitle, { a: c.a });
  // Why it scored what it did (the player agent): the hints it cost, or that giving up is worth 0
  const why = !r.solved ? T.stepZero : !r.hints ? '' : fmt(r.hints === 1 ? T.stepHintsOne : T.stepHints, { worth: E.POINTS[c.l], h: r.hints, cost: E.HINT_COST[c.l] });
  $('#step-line').textContent = [r.solved ? triesText(r) : '', why].filter(Boolean).join(' · ');
  const last = E.gameOver(state);
  const btn = $('#btn-next');
  btn.textContent = last ? T.stepEnd : fmt(T.stepNext, { level: LEVEL[BANK[state.clues[state.step + 1].index].l] });
  btn.onclick = () => {
    SFX.tap();
    if (last) return renderResult();
    state = E.next(state);
    save();
    renderPlay();
  };
  $('#step-solution').replaceChildren(el('p', { class: 'lead' }, T.howSolved), solutionNode(r, c));
  if (r.solved) confetti();
  showScreen('screen-step');
}

/* ---------------- Result (C-19) ---------------- */
/** A clue in the share text, spoiler-free: its level's colour and ✅, one 💡 per hint, or 🏳️. */
const shareMark = r => `${LEVEL[BANK[r.index].l].split(' ')[0]} ${!r.solved ? '🏳️' : r.hints ? '💡'.repeat(r.hints) : '✅'}`;

function shareText() {
  const contexto = state.practice ? T.practiceLabel : fmt(T.shareContext, { n: E.numberOf(state.date) });
  const line = `${state.clues.map(shareMark).join('  ')}\n${E.score(state, BANK)}/100`;
  return result({ tagline: taglineLine(manifest.tagline, lang), head: { emoji: manifest.emoji, title: T.title, context: contexto }, paragraphs: [state.practice ? state.clues.map(shareMark).join('') : line] });
}

function renderResult() {
  const total = E.score(state, BANK);
  const parts = [];
  if (state.practice) {
    const r = state.clues[0];
    const c = BANK[r.index];
    $('#result-stars').textContent = r.solved ? '✅' : '🏳️';
    $('#result-title').textContent = r.solved ? T.solvedTitle : fmt(T.gaveUpTitle, { a: c.a });
    parts.push(fmt(T.practicePoints, { p: total, worth: E.POINTS[c.l] }));
    if (r.solved) parts.push(triesText(r));
    parts.push(T.practiceNote);
  } else {
    $('#result-stars').textContent = total === 100 ? '🏆' : total >= 50 ? '⭐' : '🗝️';
    $('#result-title').textContent = fmt(T.scoreTitle, { score: total });
    const n = E.streak(readDays(), today());
    if (n) parts.push(n === 1 ? T.streakOne : fmt(T.streakMany, { n }));
  }
  $('#result-line').textContent = parts.join(' · ');
  $('#result-mine').textContent = state.mine ? T.yourDayLine : '';
  $('#result-mine').hidden = !state.mine;
  // How each clue is solved, with what it scored
  $('#result-solutions').replaceChildren(...state.clues.map(r => {
    const c = BANK[r.index];
    return solutionNode(r, c, `${LEVEL[c.l]} · ${fmt(T.points, { p: E.pointsOf(r, c.l) })}`);
  }));
  $('#result-next').textContent = state.practice ? '' : T.nextClue;
  $('#result-next').hidden = state.practice;

  const share = botonCompartir({
    rotulo: T.shareRotulo, id: 'btn-share', clase: state.practice ? 'btn btn--cyan' : 'btn btn--yellow', alTocar: () => SFX.tap(),
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: shareText() }),
  });
  const practice = el('button', { class: state.practice ? 'btn btn--yellow' : 'btn btn--cyan', id: 'btn-practice', onClick: () => { SFX.tap(); startPractice(); } }, T.practiceAgain);
  $('#result-actions').replaceChildren(...(state.practice ? [practice, share] : [share, practice]));
  // «Propón tu críptico»: under the actions, at the end of every game
  $('#result-propose').replaceChildren(
    el('p', { class: 'lead', style: 'margin:0' }, T.proposeAsk),
    el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-propose', type: 'button', onClick: () => { SFX.tap(); openProposal({ T, lang, ...(tiene('test') ? { send: testSend } : {}) }); } }, T.proposeBtn));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  // A solo game: no win to count in the rankings yet (whether it keeps a score is the owner's call, D-212)
  finDePartida({ juego: GAME_ID, modo: 'solo', alTocar: () => SFX.tap() });
  if (total >= 50) confetti();
  renderModes();
  showScreen('screen-result');
}

/** With `?test` a proposal stays on the phone (the e2e scripts read it), as the feedback form does (buzon.js). */
const TEST_SENT = 'juegos-de-salon:buzon:prueba';
async function testSend(r) {
  const list = JSON.parse(localStorage.getItem(TEST_SENT) || '[]');
  list.push({ ...r, at: Date.now() });
  localStorage.setItem(TEST_SENT, JSON.stringify(list));
}

/* ---------------- Start ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  // Instrucciones and Entrar as dialogs behind the lab flag cover-dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
  flapboard($('#flapboard'), lang);
  $('#answer-form').addEventListener('submit', submit);
  const answer = $('#answer');
  answer.addEventListener('input', onType);
  for (const ev of ['focus', 'click', 'keyup']) answer.addEventListener(ev, caretToEnd);
  $('#btn-hint').addEventListener('click', askHint);
  $('#btn-give-up').addEventListener('click', giveUp);
  renderModes();
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14): the game, the clue being played and its answer
window.__cryptic = {
  state: () => state, clue: () => (state ? clue() : null), answer: () => (state ? clue().a : null),
  /** Opens bank clue `i` as practice: the e2e scripts try the longest answer. */
  practice: i => begin(E.newPractice(i)),
  bank: () => BANK.map(c => c.a),
};
// With `?test`, today's three clues, and signing a clue as a player's (`by`) to try a day with their own clue in it
if (tiene('test')) Object.assign(window.__cryptic, { today: () => picksToday().map(p => p.index), sign: (i, by) => { BANK[i].by = by; renderModes(); } });
init();
