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
import { GAME_ID, HEARTS, CITIES, pickCities, tripsOf, LOCALES } from './rules.js';
// The five trips, each on its own metro (rules.js). `mapCity` is the city of the level being drawn or read.
let mapCity = Object.keys(CITIES)[0];
const CITY = () => CITIES[mapCity];
// The run's five cities are drawn when it starts and saved with it
const LV = () => tripsOf(state?.cities || Object.keys(CITIES).slice(0, 5));
const ST = () => CITY().stations;
const lineOf = id => Object.values(CITIES).flatMap(c => c.levels).flatMap(l => l.lines).find(l => l.id === id);
const cityName = id => CITIES[id].name[lang] || CITIES[id].name.es;
import * as E from './engine.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/transfer.js';
import { onScreen } from '../../assets/js/on-screen.js';

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
const level = () => { const lv = LV()[state.level]; mapCity = lv.city; return lv; };

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

/* ---------------- The cover's demo ---------------- */
// Each city's transfer trip (its level 3) in turn: its cards in the route, then the train riding them —
// gliding, turning its arrow at the transfer, lighting each card — and arriving. While the cover is on
// screen only (onScreen); with reduced motion, the first map stands still.
let demoK = 0;
const onCover = () => $('#screen-intro').classList.contains('active');
const demoNext = onScreen($('#demo'), () => { demoCycle(); });
async function demoCycle() {
  if (!onCover()) return setTimeout(demoNext, 600);
  const ids = Object.keys(CITIES), lv = CITIES[ids[demoK++ % ids.length]].levels[2];
  const map = drawMap(lv, { train: { at: lv.start.station, line: lv.start.line, toward: lv.start.toward } });
  $('#demo-map').replaceChildren(map);
  const cards = lv.solution.map(c => cardEl(lv.hand[c], { tabindex: '-1', class: 'tr-card tr-card--placed' + (lv.hand[c].line ? ' tr-line--' + lv.hand[c].line : '') }, lv));
  $('#demo-plan').replaceChildren(...cards);
  if (reduced) return;
  const result = E.run(lv, lv.solution.map(c => lv.hand[c])), ride = new Ride(map, { quiet: true });
  await sleep(900);
  for (let i = 0; i < result.steps.length && onCover(); i++) {
    const step = result.steps[i];
    cards.forEach((n, k) => n.classList.toggle('is-now', k === i));
    for (const st of step.path) await ride.hop(st, step.line);
    await ride.face({ at: step.station, line: step.line, toward: step.toward });
  }
  cards.forEach(n => n.classList.remove('is-now'));
  if (onCover()) await ride.arrive();
  await sleep(1600);
  demoNext();
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
  // One mode: five trips, each on a metro drawn from the nine (their flags)
  $('#modes').replaceChildren(el('button', { class: 'mode', 'data-mode': 'solo', onClick: () => { SFX.tap(); start(); } },
    el('span', {}, el('b', {}, T.modeSolo), el('small', {}, Object.values(CITIES).map(c => c.emoji).filter((e, i, all) => all.indexOf(e) === i).join(' ') + ' · ' + T.modeHint)), el('span', { class: 'go' }, '›')));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function start() {
  const cities = pickCities();
  state = { ...E.newGame(tripsOf(cities), { hearts: HEARTS }), cities };
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
const lineName = id => { const l = lineOf(id); return l.name || fmt(T.lineN, { n: l.n }); };
/** The platform's name: the real terminal it heads to (a line's `ends`, by the stretch's end it points at). */
const headingOf = (lv, lineId, toward) => {
  const l = lv.lines.find(x => x.id === lineId);
  return fmt(T.heading, { station: l.ends[toward === l.stops[0] ? 0 : 1] });
};
// Drawn icons (no emoji): a track with stops for riding, a stop bar for the end of the line, a U-turn
// for the other platform, the two opposite arrows of a transfer (⇄). currentColor is the line's colour.
const ICON = {
  ride: '<path d="M3 16h22"/><path d="M19 10l6 6-6 6"/><circle cx="7" cy="16" r="1.3" fill="currentColor"/><circle cx="13" cy="16" r="1.3" fill="currentColor"/>',
  end: '<path d="M3 16h18"/><path d="M15 10l6 6-6 6"/><path d="M27 8v16"/>',
  turn: '<path d="M22 25V12a6 6 0 0 0-12 0v13"/><path d="M5 20l5 6 5-6"/>',
  change: '<path d="M5 11h21"/><path d="M21 6l5 5-5 5"/><path d="M27 21H6"/><path d="M11 16l-5 5 5 5"/>',
};
const cardIcon = card => el('span', { class: 'tr-card__icon', 'aria-hidden': 'true', html: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${ICON[card.t]}</svg>` });
function cardEl(card, attrs = {}, lv = level()) {
  const sub = card.t === 'change' ? el('small', {}, headingOf(lv, card.line, card.toward)) : null;
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
const measure = (() => { const c = document.createElement('canvas').getContext('2d'); return (t, font = '700 13px') => { c.font = `${font} Nunito, system-ui, sans-serif`; return c.measureText(t).width; }; })();
/** A name's box placed on side `side` of a dot at (x, y): [x0, y0, x1, y1]. */
// A station with a name per line (Buenos Aires: «C. Pellegrini / Diagonal Norte») shows one per row
const rows = id => ST()[id].name.split(' / ');
const ROW = 15;
function nameBox(id, side, x, y) {
  const [dx, dy0, anchor] = LABEL[side], r = rows(id), tw = Math.max(...r.map(t => measure(t)));
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
/**
 * Where each line heads: past both ends of its stretch, a short stub with an arrowhead and the real
 * terminal it runs to («Los Dominicos»), in the line's colour, so a player who changes lines knows which
 * platform to take without knowing the map (the owner, 2026-11-12).
 */
const DIR_FONT = 'italic 800 12px';   // .tr-dir__name
function dirTags(lv, pos, names = []) {
  // Each line's two directions at its ends: a stub, an arrow and the terminal's name. The stub's length and the
  // name's side are chosen to stay clear of the lines, the stations and the other directions
  const segs = lv.lines.flatMap(l => { const p = shape(l, id => pos(id), pos.xy); return p.slice(1).map((q, i) => [p[i], q]); });
  const dots = [...new Set(lv.lines.flatMap(l => l.stops))].map(id => pos(id));
  const tags = [];
  for (const l of lv.lines) {
    const pts = shape(l, id => pos(id), pos.xy);
    [[0, 1, 0], [pts.length - 1, pts.length - 2, 1]].forEach(([e, b, k]) => {
      const p = pts[e], q = pts[b], len = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, u = [(p[0] - q[0]) / len, (p[1] - q[1]) / len];
      const text = l.ends[k], tw = measure(text, DIR_FONT);
      // A stretch that ends at its terminal says it already: that station's own name is the direction
      // (also «Colosseo» for Colosseo-Fori Imperiali); a loop that comes back on itself (Chicago's Brown Line) has none
      if (rows(l.stops[k ? l.stops.length - 1 : 0]).some(r => text.startsWith(r)) || l.untagged?.includes(k)) return;
      let best = null, bestCost = Infinity;
      for (const reach of [22, 36, 50, 64, 80]) for (const side of ['ahead', 'left', 'right']) {
        const tip = [p[0] + u[0] * reach, p[1] + u[1] * reach];
        let tx, ty, anchor;
        if (side === 'ahead') {
          anchor = u[0] > 0.3 ? 'start' : u[0] < -0.3 ? 'end' : 'middle';
          tx = tip[0] + u[0] * 6; ty = tip[1] + (Math.abs(u[1]) > 0.3 ? u[1] * 10 + (u[1] > 0 ? 8 : 0) : 4);
        } else if (Math.abs(u[0]) > 0.3) {   // a sideways line: the name above or below its arrow
          anchor = u[0] > 0 ? 'start' : 'end'; tx = tip[0] - u[0] * 4; ty = tip[1] + (side === 'left' ? -9 : 17);
        } else {                             // an upright line: the name left or right of its arrow
          anchor = side === 'left' ? 'end' : 'start'; tx = tip[0] + (side === 'left' ? -9 : 9); ty = tip[1] + 4;
        }
        const left = anchor === 'start' ? tx : anchor === 'end' ? tx - tw : tx - tw / 2;
        const box = [left, ty - 10, left + tw, ty + 3];
        let cost = reach / 100 + (side === 'ahead' ? 0 : 0.1);
        for (const n of names) if (meets(box, n, 12)) cost += 40;
        for (const t of tags) { if (meets(box, t.box, 10)) cost += 10; if (crosses(box, [[t.from, t.tip]])) cost += 5; }
        if (crosses(box, segs)) cost += 5;
        for (const [x, y] of dots) { if (meets(box, [x - 22, y - 22, x + 22, y + 22])) cost += 3; if (meets(box, [x - 12, y - 12, x + 12, y + 12])) cost += 30; if (Math.hypot(x - tip[0], y - tip[1]) < 14) cost += 5; }
        for (const n of names) if (crosses(n, [[p, tip]])) cost += 20;
        if (cost < bestCost) { bestCost = cost; best = { line: l.id, from: p, tip, u, text, x: tx, y: ty, anchor, box }; }
      }
      tags.push(best);
    });
  }
  return tags;
}
function placeNames(lv, used, pos, tags = []) {
  const segs = lv.lines.flatMap(l => { const p = shape(l, id => pos(id), pos.xy); return p.slice(1).map((q, i) => [p[i], q]); });
  const crowd = id => used.filter(o => o !== id && Math.hypot(ST()[o].x - ST()[id].x, ST()[o].y - ST()[id].y) < 2).length;
  const order = used.slice().sort((a, b) => crowd(b) - crowd(a));
  const placed = {}, boxes = tags.map(t => t.box);
  segs.push(...tags.map(t => [t.from, t.tip]));
  // Each line goes on past its last stations, where its direction is written: names keep out of the way
  const ext = [];
  for (const l of lv.lines) {
    const p = shape(l, id => pos(id), pos.xy);
    for (const [e, b] of [[p[0], p[1]], [p[p.length - 1], p[p.length - 2]]]) {
      const d = Math.hypot(e[0] - b[0], e[1] - b[1]) || 1;
      ext.push([e, [e[0] + (e[0] - b[0]) / d * 50, e[1] + (e[1] - b[1]) / d * 50]]);
    }
  }
  for (const id of order) {
    const [x, y] = pos(id);
    const tries = [ST()[id].label, ...SIDES].filter((v, i, all) => v && all.indexOf(v) === i);
    let best = null, bestCost = Infinity;
    for (const side of tries) {
      const box = nameBox(id, side, x, y);
      let cost = 0;
      for (const o of boxes) if (meets(box, o, 10)) cost += 10;
      for (const o of used) if (o !== id) { const [ox, oy] = pos(o); if (meets(box, [ox - 10, oy - 10, ox + 10, oy + 10])) cost += 10; }
      if (crosses(box, segs)) cost += 5;
      if (crosses(box, ext)) cost += 8;
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
  // The stations' names first, then the directions in the room they leave
  const sides = placeNames(lv, used, pos);
  const tags = dirTags(lv, pos, used.map(id => nameBox(id, sides[id], ...pos(id))));
  // The frame grows to hold every name and every direction
  let minX = -16, maxX = 16, minY = -16, maxY = 16;
  for (const t of tags) { minX = Math.min(minX, t.box[0]); maxX = Math.max(maxX, t.box[2]); minY = Math.min(minY, t.box[1]); maxY = Math.max(maxY, t.box[3]); }
  for (const id of used) {
    const [x, y] = pos(id), b = nameBox(id, sides[id], x, y);
    minX = Math.min(minX, b[0], x - 16); maxX = Math.max(maxX, b[2], x + 16); minY = Math.min(minY, b[1], y - 16); maxY = Math.max(maxY, b[3], y + 16);
  }
  const toPx = ([x, y]) => [(x - x0) * k - minX + PAD / 2, (y - y0) * k - minY + PAD / 2];
  // The stations are this map's city's, kept here: the cover's demo and the game draw different cities
  const stations = ST(), at = id => toPx([stations[id].x, stations[id].y]);
  const shift = ([x, y]) => [x - minX + PAD / 2, y - minY + PAD / 2];
  return { used, at, toPx, sides, tags: tags.map(t => ({ ...t, from: shift(t.from), tip: shift(t.tip), x: shift([t.x, t.y])[0], y: shift([t.x, t.y])[1] })), w: maxX - minX + PAD, h: maxY - minY + PAD };
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

/** The train's moves on a drawn map (each short, so a whole plan rides in a few seconds). */
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const tween = (ms, fn) => new Promise(done => {
  if (reduced) { fn(1); return done(); }
  const t0 = performance.now();
  const tick = now => { const t = Math.min(1, (now - t0) / ms); fn(t); if (t < 1) requestAnimationFrame(tick); else done(); };
  requestAnimationFrame(tick);
});
class Ride {
  constructor(map, { quiet = false } = {}) {
    this.quiet = quiet;
    this.map = map; this.geo = map.geo; this.mover = map.querySelector('#tr-mover'); this.arrow = this.mover.querySelector('.tr-arrow');
    this.at = this.geo.lv.start.station; this.p = this.geo.at(this.at); this.ang = +this.arrow.dataset.ang || 0;
    map.querySelector(`.tr-stop[data-station="${this.at}"]`)?.classList.add('is-lit');
  }
  place([x, y], k = 1) { this.mover.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})${k !== 1 ? ` scale(${k.toFixed(3)})` : ''}`); this.p = [x, y]; }
  turnTo(ang) { this.ang = ang; this.arrow.style.display = ''; this.arrow.setAttribute('transform', `rotate(${ang.toFixed(1)})`); }
  /** The points along `line` from the station the train is at to `to`, bends included. */
  route(to, line) {
    const { lv, at, toPx } = this.geo, l = lv.lines.find(x => x.id === line);
    const pts = [], ids = [];
    l.stops.forEach((id, i) => { pts.push(at(id)); ids.push(id); const b = (l.bends || []).find(x => x.after === id); if (b && i + 1 < l.stops.length) { pts.push(toPx(b.at)); ids.push(null); } });
    const a = ids.indexOf(this.at), b = ids.indexOf(to);
    if (a < 0 || b < 0) return [this.p, at(to)];
    return a <= b ? pts.slice(a, b + 1) : pts.slice(b, a + 1).reverse();
  }
  /** Along a polyline: the point at `d` px from its start, and the heading there. */
  static along(pts, d) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0);
      if (d <= L || i === pts.length - 1) { const k = L ? Math.min(1, d / L) : 1; return [[x0 + (x1 - x0) * k, y0 + (y1 - y0) * k], Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI]; }
      d -= L;
    }
    return [pts[0], 0];
  }
  /** The arrow turns by the short way round, from where it points to `ang`. */
  async spin(ang, ms = 220) {
    const from = this.ang, delta = ((ang - from + 540) % 360) - 180;
    if (Math.abs(delta) < 1) return this.turnTo(ang);
    await tween(ms, t => this.turnTo(from + delta * easeInOut(t)));
  }
  /** One station on: speed up, glide, slow down, and settle on the dot with a small dip. */
  async hop(to, line) {
    const pts = this.route(to, line), total = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
    const [, head] = Ride.along(pts, 0.01);
    await this.spin(head, 120);
    await tween(Math.min(380, 170 + total * 1.6), t => { const [p, a] = Ride.along(pts, total * easeInOut(t)); this.place(p); this.turnTo(a); });
    this.at = to;
    this.map.querySelector(`.tr-stop[data-station="${to}"]`)?.classList.add('is-lit');
    if (!this.quiet) SFX.tap?.();
    await tween(140, t => this.place(this.p, 1 - 0.12 * Math.sin(Math.PI * t)));
  }
  /** After a card: the arrow turns to where the train heads now (the other platform, a transfer). */
  async face(train) {
    const { lv, at, toPx } = this.geo, ahead = aheadOf(lv, train, at, toPx);
    if (!ahead) return;
    const ang = Math.atan2(ahead[1] - this.p[1], ahead[0] - this.p[0]) * 180 / Math.PI;
    const changed = Math.abs(((ang - this.ang + 540) % 360) - 180) > 1;
    await this.spin(ang, 280);
    if (changed) await tween(160, t => this.place(this.p, 1 + 0.12 * Math.sin(Math.PI * t)));
  }
  /** A closed station: the train starts towards it and stops short. */
  async bump(to, line) {
    const pts = this.route(to, line), from = this.p, [p] = Ride.along(pts, 14);
    await tween(160, t => this.place([from[0] + (p[0] - from[0]) * easeInOut(t), from[1] + (p[1] - from[1]) * easeInOut(t)]));
    await tween(220, t => this.place([p[0] + (from[0] - p[0]) * easeInOut(t), p[1] + (from[1] - p[1]) * easeInOut(t)]));
  }
  /** A route that fails: the train shakes where it stopped. */
  async shake() {
    const [x, y] = this.p;
    await tween(300, t => this.place([x + Math.sin(t * Math.PI * 6) * 4 * (1 - t), y]));
    this.p = [x, y];
  }
  /** At the destination: the ring pulses. */
  async arrive() {
    this.mover.classList.add('is-arrived');
    await tween(360, t => this.place(this.p, 1 + 0.25 * Math.sin(Math.PI * t)));
  }
}

function drawMap(lv, { train, lit = [] } = {}) {
  mapCity = lv.city;
  const { used, at, toPx, sides, tags, w, h } = frame(lv);
  const root = svg('svg', { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, class: 'tr-map', role: 'img' });
  for (const l of lv.lines) root.append(svg('path', { class: 'tr-track tr-line--' + l.id, d: curve(shape(l, at, toPx)) }));
  for (const t of tags) {
    const ang = Math.round(Math.atan2(t.u[1], t.u[0]) * 180 / Math.PI);
    const g = svg('g', { class: 'tr-dir tr-line--' + t.line });
    g.append(svg('path', { class: 'tr-dir__stub', d: `M${t.from.map(Math.round)} L${t.tip.map(Math.round)}` }),
      svg('path', { class: 'tr-dir__head', d: 'M-5,-5 L3,0 L-5,5', transform: `translate(${t.tip.map(Math.round)}) rotate(${ang})` }));
    const label = svg('text', { x: Math.round(t.x), y: Math.round(t.y), class: 'tr-dir__name', 'text-anchor': t.anchor });
    label.textContent = t.text;
    g.append(label);
    root.append(g);
  }
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
  // The geometry stays on the map, so the ride can move the train without drawing it again
  root.geo = { lv, at, toPx };
  if (train) {
    const [cx, cy] = at(train.at);
    // The train, its ring and its arrow move as one: the ring and the train never turn, the arrow does
    const mover = svg('g', { class: 'tr-mover', id: 'tr-mover', transform: `translate(${Math.round(cx)},${Math.round(cy)})` });
    mover.append(svg('circle', { cx: 0, cy: 0, r: 15, class: 'tr-train-ring' }));
    // The arrow: which way the train heads, towards the next station (or the next bend) on its line
    const ahead = aheadOf(lv, train, at, toPx);
    const arrow = svg('path', { class: 'tr-arrow', d: 'M19,-7 L29,0 L19,7 Z' });
    if (ahead) { const ang = Math.atan2(ahead[1] - cy, ahead[0] - cx) * 180 / Math.PI; arrow.setAttribute('transform', `rotate(${Math.round(ang)})`); arrow.dataset.ang = ang; }
    else arrow.style.display = 'none';
    mover.append(arrow);
    // The train, drawn (no emoji): a front with its window and two lights, centred on the ring
    const g = svg('g', { class: 'tr-train', id: 'tr-train', transform: 'translate(0,-1)' });
    g.append(svg('rect', { x: -7, y: -8, width: 14, height: 15, rx: 4, class: 'tr-train__body' }),
      svg('rect', { x: -4.5, y: -5.5, width: 9, height: 5, rx: 1.5, class: 'tr-train__window' }),
      svg('circle', { cx: -3.5, cy: 3, r: 1.3, class: 'tr-train__light' }), svg('circle', { cx: 3.5, cy: 3, r: 1.3, class: 'tr-train__light' }),
      svg('path', { d: 'M-5 7l-2 3M5 7l2 3', class: 'tr-train__feet' }));
    mover.append(g);
    root.append(mover);
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
  $('#map-credit').textContent = T.mapCredit;
  $('#city').textContent = CITIES[lv.city].emoji + ' ' + cityName(lv.city);
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
  // The ride: the train glides from station to station (it speeds up, slows down and settles), lights each
  // one it passes, and its arrow turns to where it heads after each card (the other platform, a transfer)
  const map = drawMap(lv, { train: { at: lv.start.station, line: lv.start.line, toward: lv.start.toward } });
  $('#map').replaceChildren(map);
  const ride = new Ride(map);
  // …and the card it is following lights up in the route (cards run in order, empty slots skipped)
  const running = [...$('#plan').children].filter(n => n.classList.contains('tr-card'));
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    running.forEach((n, k) => n.classList.toggle('is-now', k === i));
    for (const s of step.path) await ride.hop(s, step.line);
    const failed = !result.ok && i === result.steps.length - 1;
    if (failed && result.reason === 'closed') await ride.bump(result.closed, step.line);
    await ride.face({ at: step.station, line: step.line, toward: step.toward });
    if (failed) await ride.shake();
  }
  running.forEach(n => n.classList.remove('is-now'));
  if (result.ok) await ride.arrive();
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
  $('#result-lead').textContent = T.resultLead;
  $('#result-trips').replaceChildren(...state.stars.map((s, i) => el('li', {}, el('span', {}, CITIES[LV()[i].city].emoji + ' ' + cityName(LV()[i].city)), el('b', {}, s ? '⭐'.repeat(s) : '—'))));
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); start(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: T.shareContext }), title, state.stars.map((s, i) => CITIES[LV()[i].city].emoji + ' ' + (s ? '⭐'.repeat(s) : '▫️')).join('\n')].join('\n\n') }),
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
  demoNext();
}

// The hook for the end-to-end tests (C-14)
window.__transfer = {
  state: () => state, cities: Object.keys(CITIES), levels: () => LV(),
  // Draws a trip's map, or with `city` a level of that city's pool (the labels check walks them all)
  drawLevel: (i, city) => { const lv = city ? CITIES[city].levels[i] : LV()[i]; if (!lv) return false; $("#map").replaceChildren(drawMap(lv, { train: { at: lv.start.station, line: lv.start.line, toward: lv.start.toward } })); return true; },
  start, send: sendTrain, place: i => { state = E.place(state, i); renderHand(); } };
init();
