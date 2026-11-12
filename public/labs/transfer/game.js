/**
 * Transfer: state machine and drawing (C-2), the only file that touches the DOM. The rules are in
 * engine.js, the levels and texts in rules.js. Screens: intro → play (five trips) → result.
 * The run is saved after every change to resume it (C-6). Lab only (D-395).
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { botonCompartir, cabecera } from '../../assets/js/compartir.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import { GAME_ID, HEARTS, LEVELS, STATIONS, LOCALES } from './rules.js';
const LINES = Object.fromEntries(LEVELS.flatMap(l => l.lines).map(l => [l.id, l]));
import * as E from './engine.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/transfer.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const name = id => STATIONS[id]?.name || id;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let state = null;
let busy = false;           // the train is running
let verdict = null;         // the last run's result, shown under the board
const save = () => store.save({ mode: 'solo', state, done: !!state && E.isOver(state) });
const level = () => LEVELS[state.level];

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  footer(id === 'screen-intro' ? 'cover' : id.replace('screen-', ''));
}

// The cover ends with the site's footer, the game's own comment as its option (C-17, U-38)
function footer(screen) {
  const comment = el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: L.comentario, contexto: { juego: GAME_ID, pantalla: screen, viaje: state ? state.level + 1 : 0, idioma: lang, url: location.pathname } }); },
  }, T.comentarAbrir);
  const pie = $('#pie');
  if (screen === 'cover') footerInto(pie, { screen: `${GAME_ID}-cover`, inbox: false, options: [comment], lang });
  else pie.replaceChildren(comment);
}

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.state) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { state = saved.state; verdict = null; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderModes() {
  $('#modes').replaceChildren(el('button', { class: 'mode', 'data-mode': 'solo', onClick: () => { SFX.tap(); start(); } },
    el('span', {}, el('b', {}, T.modeSolo), el('small', {}, T.modeSoloHint)), el('span', { class: 'go' }, '›')));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function start() {
  state = E.newGame(LEVELS, { hearts: HEARTS });
  verdict = null;
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
  renderPlay();
}

/* ---------------- Cards ---------------- */
function cardLabel(card) {
  if (card.t === 'ride') return card.n === 1 ? T.rideOne : fmt(T.rideN, { n: card.n });
  if (card.t === 'end') return T.end;
  if (card.t === 'turn') return T.turn;
  return fmt(T.changeTo, { line: lineName(card.line) });
}
const lineName = id => fmt(T.lineN, { n: LINES[id].n });
/** The platform's name: the real terminal it heads to (a line's `ends`, by the stretch's end it points at). */
const headingOf = (lv, lineId, toward) => {
  const l = lv.lines.find(x => x.id === lineId);
  return fmt(T.heading, { station: l.ends[toward === l.stops[0] ? 0 : 1] });
};
const cardIcon = card => ({ ride: '➡️', end: '⏭️', turn: '🔄', change: '🔀' })[card.t];
function cardEl(card, attrs = {}) {
  const sub = card.t === 'change' ? el('small', {}, headingOf(level(), card.line, card.toward)) : null;
  return el('button', { type: 'button', class: 'tr-card' + (card.line ? ' tr-line--' + card.line : ''), ...attrs },
    el('span', { class: 'tr-card__icon' }, cardIcon(card)), el('b', {}, cardLabel(card)), sub);
}

/* ---------------- The map ---------------- */
// A schematic like a station's map: straight runs at 0°, 45° and 90° between stations and bends
// (rules.js), each corner rounded, so the lines read cleanly and still show their shape.
const UNIT = 50, PAD = 12;   // px per stretch between stations: even spacing
// Far enough from the dot that the train's ring (r 15) never covers its own station's name
const LABEL = { l: [-22, 4, 'end'], tl: [-15, -19, 'end'], tr: [15, -19, 'start'], br: [15, 30, 'start'], r: [22, 4, 'start'], t: [0, -23, 'middle'], b: [0, 33, 'middle'] };
function labelBox(id, x, y) {
  const [dx, dy, anchor] = LABEL[STATIONS[id].label || 'r'], tw = STATIONS[id].name.length * 7.4;
  const left = anchor === 'start' ? x + dx : anchor === 'end' ? x + dx - tw : x - tw / 2;
  return [Math.min(x - 16, left), Math.min(y - 16, y + dy - 11), Math.max(x + 16, left + tw), Math.max(y + 16, y + dy + 3)];
}
function frame(lv) {
  const used = [...new Set(lv.lines.flatMap(l => l.stops))];
  const xs = used.map(s => STATIONS[s].x), ys = used.map(s => STATIONS[s].y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const k = UNIT;
  // The frame grows to hold every name (about 7.4 units per letter at 13 px)
  const place0 = id => [(STATIONS[id].x - x0) * k, (STATIONS[id].y - y0) * k];
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const id of used) {
    const [x, y] = place0(id), b = labelBox(id, x, y);
    minX = Math.min(minX, b[0]); maxX = Math.max(maxX, b[2]); minY = Math.min(minY, b[1]); maxY = Math.max(maxY, b[3]);
  }
  const toPx = ([x, y]) => [(x - x0) * k - minX + PAD / 2, (y - y0) * k - minY + PAD / 2];
  const at = id => toPx([STATIONS[id].x, STATIONS[id].y]);
  return { used, at, toPx, w: maxX - minX + PAD, h: maxY - minY + PAD };
}
/** Straight segments with every corner rounded (radius `r`, smaller when the segments are short). */
function curve(points, r = 18) {
  let d = 'M' + points[0].map(Math.round).join(',');
  for (let i = 1; i < points.length - 1; i++) {
    const [p0, p1, p2] = [points[i - 1], points[i], points[i + 1]];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a = [p1[0] - (p1[0] - p0[0]) / l1 * rr, p1[1] - (p1[1] - p0[1]) / l1 * rr];
    const c = [p1[0] + (p2[0] - p1[0]) / l2 * rr, p1[1] + (p2[1] - p1[1]) / l2 * rr];
    d += ` L${a.map(Math.round)} Q${p1.map(Math.round)} ${c.map(Math.round)}`;
  }
  return d + ' L' + points[points.length - 1].map(Math.round).join(',');
}
/** A line's drawn points: its stations with its bends between them, in the frame. */
function shape(l, at, toPx) {
  const pts = [];
  l.stops.forEach((id, i) => {
    pts.push(at(id));
    const bend = (l.bends || []).find(b => b.after === id);
    if (bend && i + 1 < l.stops.length) pts.push(toPx(bend.at));
  });
  return pts;
}

function drawMap(lv, { train, lit = [] } = {}) {
  const { used, at, toPx, w, h } = frame(lv);
  const root = svg('svg', { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, class: 'tr-map', role: 'img' });
  for (const l of lv.lines) root.append(svg('path', { class: 'tr-track tr-line--' + l.id, d: curve(shape(l, at, toPx)) }));
  const closed = new Set(lv.closed || []);
  for (const id of used) {
    const [cx, cy] = at(id);
    const hub = lv.lines.filter(l => l.stops.includes(id)).length > 1;
    const cls = ['tr-stop', hub && 'is-hub', id === lv.goal && 'is-goal', id === lv.start.station && 'is-start', id === lv.via && 'is-via', closed.has(id) && 'is-closed', lit.includes(id) && 'is-lit'].filter(Boolean).join(' ');
    const g = svg('g', { class: cls, 'data-station': id });
    g.append(svg('circle', { cx, cy, r: hub ? 8 : 6 }));
    if (closed.has(id)) { const x = svg('text', { x: cx, y: cy + 4, class: 'tr-x' }); x.textContent = '✕'; g.append(x); }
    // The name on its chosen side (rules.js)
    const [dx, dy, anchor] = LABEL[STATIONS[id].label || 'r'];
    const t = svg('text', { x: cx + dx, y: cy + dy, class: 'tr-name', 'text-anchor': anchor });
    t.textContent = name(id);
    g.append(t);
    root.append(g);
  }
  if (train) {
    const [cx, cy] = at(train);
    root.append(svg('circle', { cx, cy, r: 15, class: 'tr-train-ring' }));
    const t = svg('text', { x: cx, y: cy + 1, class: 'tr-train', id: 'tr-train' });
    t.textContent = '🚇';
    root.append(t);
  }
  return root;
}

/* ---------------- Play ---------------- */
function renderPlay() {
  if (E.isOver(state)) return renderResult();
  const lv = level();
  $('#level').textContent = fmt(T.levelOf, { n: state.level + 1, total: LEVELS.length });
  $('#hearts').textContent = '❤️'.repeat(state.hearts) + '🤍'.repeat(state.maxHearts - state.hearts);
  const startLine = lv.start.line;
  const info = [
    el('li', {}, el('span', { class: 'muted' }, T.from), ' ', el('b', {}, name(lv.start.station)), ' · ',
      el('span', { class: 'tr-pill tr-line--' + startLine }, lineName(startLine)), ' ', headingOf(lv, startLine, lv.start.toward)),
    el('li', {}, el('span', { class: 'muted' }, T.to), ' ', el('b', {}, '🏁 ' + name(lv.goal))),
  ];
  if (lv.via) info.push(el('li', {}, el('span', { class: 'muted' }, T.via), ' ', el('b', {}, '⭐ ' + name(lv.via))));
  if (lv.closed) info.push(el('li', {}, el('span', { class: 'muted' }, T.closedLabel), ' ', el('b', {}, '⛔ ' + lv.closed.map(name).join(', '))));
  $('#trip').replaceChildren(...info);
  $('#map-credit').textContent = T.city + ' · ' + T.mapCredit;
  $('#map').replaceChildren(drawMap(lv, { train: lv.start.station }));
  renderHand();
  renderVerdict();
  showScreen('screen-play');
}

function renderHand() {
  const lv = level();
  $('#plan').replaceChildren(...state.plan.map((c, i) => (c === null
    ? el('div', { class: 'tr-slot', 'data-slot': i }, String(i + 1))
    : cardEl(lv.hand[c], { 'data-slot': i, class: 'tr-card tr-card--placed' + (lv.hand[c].line ? ' tr-line--' + lv.hand[c].line : '') + (i < state.hinted ? ' is-hinted' : ''), onClick: () => { if (busy || verdict) return; SFX.tap(); state = E.unplace(state, i); save(); renderHand(); } }))));
  $('#hand').replaceChildren(...lv.hand.map((card, i) => cardEl(card, {
    'data-card': i, disabled: state.plan.includes(i) ? '' : null,
    onClick: () => { if (busy || verdict) return; SFX.tap(); state = E.place(state, i); save(); renderHand(); },
  })));
  const full = state.plan.some(c => c !== null);
  $('#btn-go').disabled = busy || !!verdict || !full;
  $('#btn-clear').disabled = busy || !!verdict || state.plan.every((c, i) => c === null || i < state.hinted);
  $('#btn-hint').disabled = busy || !!verdict || state.hearts <= 1 || state.hinted >= lv.solution.length;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sendTrain() {
  if (busy || verdict) return;
  const lv = level();
  if (!state.plan.some(c => c !== null)) { $('#verdict').replaceChildren(el('p', { class: 'notice notice--bad' }, T.emptyPlan)); return; }
  busy = true;
  SFX.tap();
  renderHand();
  const { state: next, result } = E.go(LEVELS, state);
  // The ride: the train lights each station it passes
  const lit = [lv.start.station];
  for (let i = 0; i < result.steps.length; i++) {
    for (const s of result.steps[i].path) {
      lit.push(s);
      $('#map').replaceChildren(drawMap(lv, { train: s, lit }));
      if (!reduced) await sleep(320);
    }
  }
  verdict = { result, next, levelIndex: state.level };
  busy = false;
  if (result.ok) { SFX.win(); vibrate([30, 40, 30]); } else { vibrate(120); }
  renderHand();
  renderVerdict();
}

function failText(r, lv) {
  const vars = { station: name(r.closed || r.via || r.at), goal: name(lv.goal), line: r.line ? lineName(r.line) : '' };
  return fmt(T[r.reason], vars);
}

function renderVerdict() {
  const box = $('#verdict');
  if (!verdict) return box.replaceChildren();
  const { result, next } = verdict;
  const lv = LEVELS[verdict.levelIndex];
  const moveOn = () => { SFX.tap(); state = next; verdict = null; save(); if (E.isOver(state)) finish(); else renderPlay(); };
  if (result.ok) {
    const stars = next.stars[next.stars.length - 1];
    box.replaceChildren(el('div', { class: 'panel pop tr-verdict is-ok' },
      el('p', { class: 'lead' }, fmt(T.okLevel, { stars: '⭐'.repeat(stars) })),
      el('button', { class: 'btn btn--yellow', id: 'btn-next', onClick: moveOn }, T.next)));
    return;
  }
  const rows = [el('p', { class: 'lead' }, '❌ ' + failText(result, lv))];
  if (result.lost) rows.push(el('p', { class: 'muted' }, T.lostLevel), el('button', { class: 'btn btn--yellow', id: 'btn-next', onClick: moveOn }, T.next));
  else rows.push(el('button', { class: 'btn btn--cyan', id: 'btn-retry', onClick: () => { SFX.tap(); state = next; verdict = null; save(); renderPlay(); } }, T.retry));
  box.replaceChildren(el('div', { class: 'panel pop tr-verdict is-bad' }, ...rows));
}

function finish() {
  trackFinish({ ganador: null, detalle: `${E.totalStars(state)}/${LEVELS.length * HEARTS} ⭐` });
  renderResult();
}

/* ---------------- Result (C-19) ---------------- */
function renderResult() {
  const stars = E.totalStars(state), max = LEVELS.length * HEARTS;
  const title = fmt(T.resultTitle, { stars, max });
  $('#result-title').textContent = title;
  $('#result-trips').replaceChildren(...state.stars.map((s, i) => el('li', {}, el('span', {}, fmt(T.levelOf, { n: i + 1, total: LEVELS.length })), el('b', {}, s ? '⭐'.repeat(s) : '—'))));
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); start(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: T.shareContext }), title, state.stars.map(s => s ? '⭐'.repeat(s) : '▫️').join(' · ')].join('\n\n') }),
    }));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  if (stars) confetti();
  showScreen('screen-result');
}

/* ---------------- Start ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  $('#btn-go').addEventListener('click', sendTrain);
  $('#btn-clear').addEventListener('click', () => { SFX.tap(); state = { ...state, plan: state.plan.map((c, i) => (i < state.hinted ? c : null)) }; save(); renderHand(); });
  $('#btn-hint').addEventListener('click', () => { SFX.tap(); state = E.hint(LEVELS, state); save(); renderPlay(); });
  renderModes();
  renderResumeSlot();
  showScreen('screen-intro');
}

// The hook for the end-to-end tests (C-14)
window.__transfer = { state: () => state, levels: LEVELS, drawLevel: i => $('#map').replaceChildren(drawMap(LEVELS[i])), start, send: sendTrain, place: i => { state = E.place(state, i); renderHand(); } };
init();
