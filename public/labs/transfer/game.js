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
import { GAME_ID, HEARTS, CITIES, DEFAULT_CITY, LOCALES } from './rules.js';
// The city being played: its stations and five levels (rules.js)
let cityId = DEFAULT_CITY;
const CITY = () => CITIES[cityId] || CITIES[DEFAULT_CITY];
const LV = () => CITY().levels;
const ST = () => CITY().stations;
const lineOf = id => LV().flatMap(l => l.lines).find(l => l.id === id);
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
const name = id => ST()[id]?.name || id;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let state = null;
let busy = false;           // the train is running
let verdict = null;         // the last run's result, shown under the board
const save = () => store.save({ mode: 'solo', state, done: !!state && E.isOver(state) });
const level = () => LV()[state.level];

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
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { state = saved.state; cityId = state.city || DEFAULT_CITY; verdict = null; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderModes() {
  // One button per city: each is five trips on its own network
  $('#modes').replaceChildren(...Object.entries(CITIES).map(([id, c]) => el('button', { class: 'mode', 'data-mode': 'solo', 'data-city': id, onClick: () => { SFX.tap(); start(id); } },
    el('span', {}, el('b', {}, c.emoji + ' ' + (c.name[lang] || c.name.es)), el('small', {}, T.modeHint)), el('span', { class: 'go' }, '›'))));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function start(city = cityId) {
  cityId = CITIES[city] ? city : DEFAULT_CITY;
  state = { ...E.newGame(LV(), { hearts: HEARTS }), city: cityId };
  verdict = null;
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1, detalle: cityId }); // usage signal (C-7, D-210)
  renderPlay();
}

/* ---------------- Cards ---------------- */
function cardLabel(card) {
  if (card.t === 'ride') return card.n === 1 ? T.rideOne : fmt(T.rideN, { n: card.n });
  if (card.t === 'end') return T.end;
  if (card.t === 'turn') return T.turn;
  return fmt(T.changeTo, { line: lineName(card.line) });
}
const lineName = id => { const l = lineOf(id); return l.name || fmt(T.lineN, { n: l.n }); };
/** The platform's name: the real terminal it heads to (a line's `ends`, by the stretch's end it points at). */
const headingOf = (lv, lineId, toward) => {
  const l = lv.lines.find(x => x.id === lineId);
  return fmt(T.heading, { station: l.ends[toward === l.stops[0] ? 0 : 1] });
};
// Drawn icons (no emoji): a track with stops for riding, a stop bar for the end of the line, a U-turn
// for the other platform, the two opposite arrows of a transfer (⇄). currentColor is the line's colour.
const ICON = {
  ride: '<path d="M3 16h20"/><path d="M19 11l6 5-6 5"/><circle cx="7" cy="16" r="2.4" fill="currentColor"/><circle cx="14" cy="16" r="2.4" fill="currentColor"/>',
  end: '<path d="M3 16h18"/><path d="M15 10l6 6-6 6"/><path d="M27 8v16"/>',
  turn: '<path d="M22 25V12a6 6 0 0 0-12 0v13"/><path d="M5 20l5 6 5-6"/>',
  change: '<path d="M5 11h21"/><path d="M21 6l5 5-5 5"/><path d="M27 21H6"/><path d="M11 16l-5 5 5 5"/>',
};
const cardIcon = card => el('span', { class: 'tr-card__icon', 'aria-hidden': 'true', html: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${ICON[card.t]}</svg>` });
function cardEl(card, attrs = {}) {
  const sub = card.t === 'change' ? el('small', {}, headingOf(level(), card.line, card.toward)) : null;
  return el('button', { type: 'button', class: 'tr-card' + (card.line ? ' tr-line--' + card.line : ''), ...attrs },
    cardIcon(card), el('b', {}, cardLabel(card)), sub);
}

/* ---------------- The map ---------------- */
// A schematic like a station's map: straight runs at 0°, 45° and 90° between stations and bends
// (rules.js), each corner rounded, so the lines read cleanly and still show their shape.
const UNIT = 50, PAD = 12;   // px per stretch between stations: even spacing
// Far enough from the dot that the train's ring (r 15) never covers its own station's name
const LABEL = { l: [-22, 4, 'end'], tl: [-15, -19, 'end'], tr: [15, -19, 'start'], br: [15, 30, 'start'], bl: [-15, 30, 'end'], r: [22, 4, 'start'], t: [0, -23, 'middle'], b: [0, 33, 'middle'] };
// Names are measured in the map's own font (.tr-name: 700 13px Nunito), so the placement matches the drawing
const measure = (() => { const c = document.createElement('canvas').getContext('2d'); return t => { c.font = '700 13px Nunito, system-ui, sans-serif'; return c.measureText(t).width; }; })();
/** A name's box placed on side `side` of a dot at (x, y): [x0, y0, x1, y1]. */
// A station with a name per line (Buenos Aires: «C. Pellegrini / Diagonal Norte») shows one per row
const rows = id => ST()[id].name.split(' / ');
const ROW = 15;
function nameBox(id, side, x, y) {
  const [dx, dy0, anchor] = LABEL[side], r = rows(id), tw = Math.max(...r.map(measure));
  // Above the dot the extra rows grow upwards, beside it they centre, below it they grow down
  const dy = dy0 - (dy0 < -5 ? (r.length - 1) * ROW : Math.abs(dy0) < 10 ? (r.length - 1) * ROW / 2 : 0);
  const left = anchor === 'start' ? x + dx : anchor === 'end' ? x + dx - tw : x - tw / 2;
  return [left, y + dy - 13, left + tw, y + dy + 4 + (r.length - 1) * ROW];
}
const SIDES = ['r', 'l', 'b', 't', 'tr', 'tl', 'br', 'bl'];
const meets = (a, b, gap = 0) => a[0] - gap < b[2] && b[0] - gap < a[2] && a[1] - gap < b[3] && b[1] - gap < a[3];
function crosses(box, segs) {
  for (const [p, q] of segs) {
    const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 3);
    for (let i = 0; i <= n; i++) {
      const x = p[0] + (q[0] - p[0]) * i / n, y = p[1] + (q[1] - p[1]) * i / n;
      if (x > box[0] - 5 && x < box[2] + 5 && y > box[1] - 5 && y < box[3] + 5) return true;
    }
  }
  return false;
}
/**
 * Where each name goes on this map: the station's own `label` first, then the other seven sides, the
 * first one that touches no name placed before, no other dot, no line and stays clear of the train's
 * ring on its own dot. The most crowded stations choose first. `labels.js` checks the result in the page.
 */
function placeNames(lv, used, pos) {
  const segs = lv.lines.flatMap(l => { const p = shape(l, id => pos(id), pos.xy); return p.slice(1).map((q, i) => [p[i], q]); });
  const crowd = id => used.filter(o => o !== id && Math.hypot(ST()[o].x - ST()[id].x, ST()[o].y - ST()[id].y) < 2).length;
  const order = used.slice().sort((a, b) => crowd(b) - crowd(a));
  const placed = {}, boxes = [];
  for (const id of order) {
    const [x, y] = pos(id);
    const tries = [ST()[id].label, ...SIDES].filter((v, i, all) => v && all.indexOf(v) === i);
    let best = null, bestCost = Infinity;
    for (const side of tries) {
      const box = nameBox(id, side, x, y);
      let cost = 0;
      for (const o of boxes) if (meets(box, o, 14)) cost += 10;
      for (const o of used) if (o !== id) { const [ox, oy] = pos(o); if (meets(box, [ox - 10, oy - 10, ox + 10, oy + 10])) cost += 10; }
      if (crosses(box, segs)) cost += 5;
      if (cost < bestCost) { best = side; bestCost = cost; }
      if (!cost) break;
    }
    placed[id] = best;
    boxes.push(nameBox(id, best, x, y));
  }
  return placed;
}
function frame(lv) {
  const used = [...new Set(lv.lines.flatMap(l => l.stops))];
  const xs = used.map(s => ST()[s].x), ys = used.map(s => ST()[s].y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const k = UNIT;
  const xy = ([x, y]) => [(x - x0) * k, (y - y0) * k];
  const pos = id => xy([ST()[id].x, ST()[id].y]);
  pos.xy = xy;
  const sides = placeNames(lv, used, pos);
  // The frame grows to hold every name
  let minX = -16, maxX = 16, minY = -16, maxY = 16;
  for (const id of used) {
    const [x, y] = pos(id), b = nameBox(id, sides[id], x, y);
    minX = Math.min(minX, b[0], x - 16); maxX = Math.max(maxX, b[2], x + 16); minY = Math.min(minY, b[1], y - 16); maxY = Math.max(maxY, b[3], y + 16);
  }
  const toPx = ([x, y]) => [(x - x0) * k - minX + PAD / 2, (y - y0) * k - minY + PAD / 2];
  const at = id => toPx([ST()[id].x, ST()[id].y]);
  return { used, at, toPx, sides, w: maxX - minX + PAD, h: maxY - minY + PAD };
}
/** Straight segments with every corner rounded (radius `r`, smaller when the segments are short). */
function curve(points, r = 18) {
  points = points.filter((p, i) => !i || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 0.5);
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

/** The point the train faces: the next station (or bend) towards `toward`; at the end, away from the one before. */
function aheadOf(lv, train, at, toPx) {
  const l = lv.lines.find(x => x.id === train.line);
  if (!l) return null;
  const pts = [], ids = [];
  l.stops.forEach((id, i) => {
    pts.push(at(id)); ids.push(id);
    const bend = (l.bends || []).find(b => b.after === id);
    if (bend && i + 1 < l.stops.length) { pts.push(toPx(bend.at)); ids.push(null); }
  });
  const i = ids.indexOf(train.at), dir = l.stops.indexOf(train.toward) > l.stops.indexOf(train.at) ? 1 : -1;
  if (i < 0) return null;
  if (pts[i + dir]) return pts[i + dir];
  const back = pts[i - dir];
  return back ? [2 * pts[i][0] - back[0], 2 * pts[i][1] - back[1]] : null;
}

function drawMap(lv, { train, lit = [] } = {}) {
  const { used, at, toPx, sides, w, h } = frame(lv);
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
    // The name on the side placeNames chose
    const [dx, , anchor] = LABEL[sides[id]], box = nameBox(id, sides[id], cx, cy);
    const t = svg('text', { x: cx + dx, y: box[1] + 13, class: 'tr-name', 'text-anchor': anchor });
    rows(id).forEach((row, k) => { const span = svg('tspan', { x: cx + dx, dy: k ? ROW : 0 }); span.textContent = row; t.append(span); });
    g.append(t);
    root.append(g);
  }
  if (train) {
    const [cx, cy] = at(train.at);
    root.append(svg('circle', { cx, cy, r: 15, class: 'tr-train-ring' }));
    // The arrow: which way the train heads, towards the next station (or the next bend) on its line
    const ahead = aheadOf(lv, train, at, toPx);
    if (ahead) {
      const ang = Math.atan2(ahead[1] - cy, ahead[0] - cx) * 180 / Math.PI;
      root.append(svg('path', { class: 'tr-arrow', d: 'M19,-7 L29,0 L19,7 Z', transform: `translate(${Math.round(cx)},${Math.round(cy)}) rotate(${Math.round(ang)})` }));
    }
    // The train, drawn (no emoji): a front with its window and two lights, centred on the ring
    const g = svg('g', { class: 'tr-train', id: 'tr-train', transform: `translate(${Math.round(cx)},${Math.round(cy) - 1})` });
    g.append(svg('rect', { x: -7, y: -8, width: 14, height: 15, rx: 4, class: 'tr-train__body' }),
      svg('rect', { x: -4.5, y: -5.5, width: 9, height: 5, rx: 1.5, class: 'tr-train__window' }),
      svg('circle', { cx: -3.5, cy: 3, r: 1.3, class: 'tr-train__light' }), svg('circle', { cx: 3.5, cy: 3, r: 1.3, class: 'tr-train__light' }),
      svg('path', { d: 'M-5 7l-2 3M5 7l2 3', class: 'tr-train__feet' }));
    root.append(g);
  }
  return root;
}

/* ---------------- Play ---------------- */
function renderPlay() {
  if (E.isOver(state)) return renderResult();
  const lv = level();
  $('#level').textContent = fmt(T.levelOf, { n: state.level + 1, total: LV().length });
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
  $('#map-credit').textContent = (CITY().name[lang] || CITY().name.es) + ' · ' + T.mapCredit;
  $('#map').replaceChildren(drawMap(lv, { train: { at: lv.start.station, line: lv.start.line, toward: lv.start.toward } }));
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
  const { state: next, result } = E.go(LV(), state);
  // The ride: the train lights each station it passes
  const lit = [lv.start.station];
  for (let i = 0; i < result.steps.length; i++) {
    for (const s of result.steps[i].path) {
      lit.push(s);
      $('#map').replaceChildren(drawMap(lv, { train: { at: s, line: result.steps[i].line, toward: result.steps[i].toward }, lit }));
      if (!reduced) await sleep(320);
    }
  }
  const last = result.steps[result.steps.length - 1];
  if (last) $('#map').replaceChildren(drawMap(lv, { train: { at: last.station, line: last.line, toward: last.toward }, lit }));
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
  const lv = LV()[verdict.levelIndex];
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
  trackFinish({ ganador: null, detalle: `${E.totalStars(state)}/${LV().length * HEARTS} ⭐` });
  renderResult();
}

/* ---------------- Result (C-19) ---------------- */
function renderResult() {
  const stars = E.totalStars(state), max = LV().length * HEARTS;
  const title = fmt(T.resultTitle, { stars, max });
  $('#result-title').textContent = title;
  $('#result-lead').textContent = fmt(T.resultLead, { city: (CITY().name[lang] || CITY().name.es) });
  $('#result-trips').replaceChildren(...state.stars.map((s, i) => el('li', {}, el('span', {}, fmt(T.levelOf, { n: i + 1, total: LV().length })), el('b', {}, s ? '⭐'.repeat(s) : '—'))));
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); start(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: (CITY().name[lang] || CITY().name.es) }), title, state.stars.map(s => s ? '⭐'.repeat(s) : '▫️').join(' · ')].join('\n\n') }),
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
  $('#btn-hint').addEventListener('click', () => { SFX.tap(); state = E.hint(LV(), state); save(); renderPlay(); });
  renderModes();
  renderResumeSlot();
  showScreen('screen-intro');
}

// The hook for the end-to-end tests (C-14)
window.__transfer = {
  state: () => state, cities: Object.keys(CITIES), levels: () => LV(),
  // Draws one level's map of one city (the labels check walks them all)
  drawLevel: (i, city = cityId) => { cityId = city; const lv = LV()[i]; $('#map').replaceChildren(drawMap(lv, { train: { at: lv.start.station, line: lv.start.line, toward: lv.start.toward } })); },
  start, send: sendTrain, place: i => { state = E.place(state, i); renderHand(); } };
init();
