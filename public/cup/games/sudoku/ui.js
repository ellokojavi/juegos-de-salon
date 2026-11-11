/**
 * #️⃣ Sudoku (id `sudoku`) — its screen in La Copa, Uno al día and on its standalone page /sudoku/, moved
 * from the lab (labs/sudoku/game.js) as Aletazo was (D-517's way): the board (🟢 easy, the 6×6 mini with
 * 2×3 boxes; 🔴 hard, the classic 9×9), the pad with how many of each digit are left, ✏️ Notes, ↩️ Undo,
 * 💡 Hint (−15) and 🏳️ Give up, both asking twice, a wrong digit in red (−10), the celebration of a right
 * digit and of a completed row, column or box. The engine is engine.js; its exports, like this file's,
 * are named in English (D-316): La Copa's interface is mapped to them in cup/games/index.js.
 *
 * The levels are La Copa's variants (D-331): `selector` is the lab's electric lever (Pintaminas' hard-mode
 * switch), `cover` the lab's demo board that solves itself, in the variant's size. Hard turns the page
 * red-violet (`body.sd-hard`) while it is on screen: see `fondo`.
 *
 * What the cup page now provides stays out: the lab's countdown, clock, best score, ranking, sharing and
 * usage signal. The whole state is saved after every move with `ctx.guardar`, so a reloaded day resumes
 * where it was; a finished game shows finished.
 */
import * as E from './engine.js';
import TEXTOS from './texts.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import { loadCss } from '../../../assets/js/load-css.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const ICON = new URL('./icon.svg', import.meta.url).href;
const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const CONFIRMAR_MS = 3000;
const espera = ms => new Promise(r => setTimeout(r, ms));
/** `cover` gets neither `el` nor `T`: a small `el` of its own, and the texts in the page's language. */
function h(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k === 'class') n.className = v; else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  for (const x of hijos.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}
const textosDeLaPagina = () => (TEXTOS[(globalThis.document?.documentElement.lang || 'es').slice(0, 2)] || TEXTOS.es).ui;
async function enLaPagina(n) {
  for (let k = 0; k < 40 && !n.isConnected; k++) await espera(25);
  return n.isConnected;
}

/** A cell's place on its board, as classes: the thick lines between boxes and the last row and column. */
function edges(G, i) {
  const r = Math.floor(i / G.n), c = i % G.n;
  return (c === G.n - 1 ? ' ec' : c % G.bw === G.bw - 1 ? ' bc' : '') + (r === G.n - 1 ? ' er' : r % G.bh === G.bh - 1 ? ' br' : '');
}

/* ------------------------------------------------------------------ */
/* The hard level's page                                               */
/* ------------------------------------------------------------------ */

/**
 * The page turns red-violet while the hard level is on screen, as in the lab: every piece drawn in hard
 * carries `.sd-dificil`, and the background follows the active screen (on the result, the last game's).
 * One observer watches the screens, so nothing has to remember to clear it (Pintaminas' way).
 */
let ultimaDificil = false;
function fondo() {
  const activa = document.querySelector('.screen.active');
  if (activa?.id === 'screen-resultado') { document.body.classList.toggle('sd-hard', ultimaDificil); return; }
  if (activa?.id === 'screen-jugar' && !activa.querySelector('#jugar-body')?.children.length) return;
  const dificil = !!activa?.querySelector('.sd-dificil');
  if (activa?.id === 'screen-jugar') ultimaDificil = dificil;
  document.body.classList.toggle('sd-hard', dificil);
}
let vigia = null;
function vigilarFondo() {
  if (typeof document === 'undefined') return;
  if (!vigia && typeof MutationObserver !== 'undefined') {
    vigia = new MutationObserver(fondo);
    vigia.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
}

/* ------------------------------------------------------------------ */
/* Waiting room                                                        */
/* ------------------------------------------------------------------ */

/**
 * The cover's demo (the lab's): a real solved board with six holes, each the only one in its row, column
 * and box. In turn each hole lights its row, its column and its box, saying the rule, and then its digit
 * pops in. It follows the level: the 6×6 on easy, the 9×9 on hard. It sleeps off screen (onScreen) and
 * stands solved with reduced motion.
 */
const DEMOS = {
  easy: { solution: '561432432156613245254613125364346521'.split('').map(Number), holes: [0, 10, 14, 23, 25, 33] },
  hard: { solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179'.split('').map(Number), holes: [0, 16, 31, 42, 64, 62] },
};
const STEP_MS = 950;
const PHASES = ['row', 'col', 'box', 'fill'];
let demoVez = 0;
export function cover({ variante } = {}) {
  vigilarFondo();
  const level = variante === 'hard' ? 'hard' : 'easy';
  const { solution, holes } = DEMOS[level];
  const G = E.geom(solution), N = G.n;
  const T = textosDeLaPagina();
  const decir = (phase, d) => fmtLocal(T.sdDemo[phase], { n: N, box: `${G.bh}×${G.bw}`, d });
  const cells = solution.map((d, i) => h('span', { class: 'sd-dcell' + edges(G, i) }, holes.includes(i) ? '' : String(d)));
  const box = h('div', { class: 'sd-demo', 'data-n': N, style: `--n:${N}` }, ...cells);
  const caption = h('p', { class: 'sd-demo-caption', id: 'sd-demo-caption' }, decir('row'));
  const raiz = h('figure', { class: `sd-portada${level === 'hard' ? ' sd-dificil' : ''}`, 'aria-hidden': 'true' },
    h('img', { class: 'sd-logo', src: ICON, alt: '', width: 96, height: 96 }), box, caption);
  if (QUIETO()) {
    holes.forEach(i => { cells[i].textContent = String(solution[i]); cells[i].classList.add('filled'); });
    return raiz;
  }
  const vez = ++demoVez;
  const total = (holes.length * PHASES.length + 3) * STEP_MS;
  let t0 = 0, last = -1;
  const paint = step => {
    const k = Math.floor(step / PHASES.length), phase = PHASES[step % PHASES.length];
    cells.forEach(c => c.classList.remove('lit', 'target'));
    if (step === 0) holes.forEach(i => { cells[i].textContent = ''; cells[i].classList.remove('filled', 'pop'); });
    if (k >= holes.length) { caption.textContent = T.sdDemo.done; box.classList.add('done'); return; }
    box.classList.remove('done');
    const i = holes[k], r = Math.floor(i / N), c = i % N;
    const inUnit = j => {
      const jr = Math.floor(j / N), jc = j % N;
      if (phase === 'row') return jr === r;
      if (phase === 'col') return jc === c;
      if (phase === 'box') return Math.floor(jr / G.bh) === Math.floor(r / G.bh) && Math.floor(jc / G.bw) === Math.floor(c / G.bw);
      return false;
    };
    cells.forEach((cell, j) => cell.classList.toggle('lit', inUnit(j)));
    cells[i].classList.add('target');
    if (phase === 'fill') {
      cells[i].textContent = String(solution[i]);
      cells[i].classList.add('filled', 'pop');
      caption.textContent = decir('fill', solution[i]);
    } else caption.textContent = decir(phase);
  };
  let visto = false;
  const desde = performance.now();
  const frame = now => {
    if (box.isConnected) visto = true;
    if (vez !== demoVez || (!box.isConnected && (visto || now - desde > 5000))) return;
    if (box.isConnected) {
      if (!t0) t0 = now;
      const step = Math.floor(((now - t0) % total) / STEP_MS);
      if (step !== last) { last = step; paint(step); }
    }
    next();
  };
  const next = onScreen(box, frame);
  next();
  return raiz;
}

/** The name in the waiting room: the drawn icon (there is no sudoku emoji) and its line. */
export function title({ el, J }) {
  return el('div', { class: 'sd-cabeza' },
    el('h2', { class: 'sd-titulo' }, el('span', { class: 'display display--lg rainbow sd-nombre' }, J.nombre)),
    el('p', { class: 'sd-lema' }, textosDeLaPagina().sdLema));
}

/**
 * The level lever (the lab's, Pintaminas' hard-mode switch, the owner's request): down with a green knob is
 * easy, up with a red knob is hard. Flipping it calls `cambiar`, which redraws the waiting room: the new
 * lever starts where the old one was and swings over, with a ring of electricity, a flash and sparks.
 */
let desde = null;
let parpadeoVez = 0;
export function selector({ el, T, SFX, vibrate, variante, cambiar }) {
  vigilarFondo();
  const dificil = variante === 'hard';
  const animar = desde !== null && desde !== dificil && !QUIETO();
  desde = null;
  const titulo = el('b', {}), sub = el('span', { class: 'muted' });
  const plate = el('span', { class: 'sd-plate', 'aria-hidden': 'true' },
    el('span', { class: 'sd-track', html: '<svg viewBox="0 0 70 60"><path class="sd-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'sd-bolt b1' }, '⚡'), el('span', { class: 'sd-bolt b2' }, '⚡'), el('span', { class: 'sd-bolt b3' }, '⚡'),
    el('span', { class: 'sd-arm' }, el('span', { class: 'sd-knob' })), el('span', { class: 'sd-axle' }));
  const caja = el('button', {
    type: 'button', class: 'sd-lever', id: 'btn-level', role: 'switch', 'aria-label': T.sdModo[1].titulo,
    onClick: () => {
      desde = dificil;
      if (!dificil) { relampago(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      cambiar(dificil ? 'easy' : 'hard');
    },
  }, plate, el('span', { class: 'sd-label' }, titulo, sub));
  const poner = on => {
    caja.classList.toggle('on', on); caja.classList.toggle('sd-dificil', on);
    caja.setAttribute('aria-checked', String(on));
    titulo.textContent = T.sdModo[+on].titulo; sub.textContent = T.sdModo[+on].sub;
  };
  poner(dificil);
  if (animar) {
    caja.classList.toggle('on', !dificil);
    (async () => {
      if (!await enLaPagina(caja)) return;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      caja.classList.toggle('on', dificil);
      const w = el('span', { class: 'sd-wave' + (dificil ? ' hard' : ''), 'aria-hidden': 'true' });
      plate.append(w);
      setTimeout(() => w.remove(), 900);
      caja.classList.remove('zap'); void caja.offsetWidth; caja.classList.add('zap');
    })();
  }
  if (dificil) parpadear(caja);
  return caja;
}

/** The flash over the whole view when switching to hard. */
function relampago() {
  if (QUIETO()) return;
  const x = document.createElement('div');
  x.className = 'sd-flash';
  x.setAttribute('aria-hidden', 'true');
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}

/** While hard is on, the lever's glow flickers like a bad contact; still with reduced motion. */
function parpadear(caja) {
  const vez = ++parpadeoVez;
  if (QUIETO()) return;
  const paso = () => {
    if (vez !== parpadeoVez || !caja.isConnected) { caja.style.removeProperty('--glow'); return; }
    const r = Math.random();
    const glow = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    caja.style.setProperty('--glow', glow.toFixed(2));
    setTimeout(paso, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  enLaPagina(caja).then(si => si && paso());
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

/** The play head shows the elapsed time (D-384): faster breaks a tie. Building a 9×9 board takes a moment. */
export const clock = true;
export const caro = true;

let partidas = 0;

export function mount(raiz, ctx) {
  const { p, T, el, SFX, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  vigilarFondo();
  const vez = ++partidas;
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Array.isArray(ctx.jugadas.cells) ? ctx.jugadas : null;
  let state = previa && previa.cells.length === p.givens.length ? { ...E.dayGame(p), ...previa, givens: p.givens, solution: p.solution } : E.dayGame(p);
  const G = E.geom(state);
  const dificil = G.n === 9;
  let selected = -1, notesMode = false, flash = 0;

  const score = el('p', { class: 'sd-puntos', id: 'sd-puntos', 'aria-live': 'polite' });
  const board = el('div', { class: 'sd-board', id: 'sd-board', 'data-tablero': 'sudoku', 'data-n': G.n, style: `--n:${G.n}`, role: 'grid' },
    ...[...Array(G.cells)].map((_, i) => el('button', { type: 'button', class: 'sd-cell', 'data-i': i, onClick: () => select(i) })));
  const cells = [...board.children];
  const pad = el('div', { class: 'sd-pad', id: 'sd-pad', style: `--n:${G.n}` },
    ...[...Array(G.n)].map((_, k) => el('button', { type: 'button', class: 'sd-key', 'data-d': k + 1, id: `sd-key-${k + 1}`, onClick: () => press(k + 1) },
      el('b', {}, String(k + 1)), el('small', {}))));
  const keys = [...pad.children];
  const btnNotes = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-notes', 'aria-pressed': 'false', onClick: () => { SFX.tap(); notesMode = !notesMode; draw(); } }, T.sdNotes);
  const btnUndo = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-undo', onClick: () => undoMove() }, T.sdUndo);
  const btnHint = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-hint', onClick: () => hint() }, T.sdHint);
  const btnGiveUp = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-give-up', onClick: () => giveUp() }, T.sdGiveUp);
  const tools = el('div', { class: 'sd-tools' }, btnNotes, btnUndo, btnHint, btnGiveUp);
  const line = el('p', { class: 'muted center sd-line', id: 'sd-line', 'aria-live': 'polite' });
  const fin = el('div', { class: 'stack sd-fin', id: 'sd-fin' });
  const juego = el('div', { class: `stack sd-juego${dificil ? ' sd-dificil' : ''}` }, score, board, pad, tools, line, fin);
  raiz.append(juego);

  const guardar = () => ctx.guardar?.({ ...state, last: undefined });

  // The hint and Give up: the first tap arms the button for 3 s, the second one acts (U-15)
  let armado = null, armadoTimer = 0;
  const armar = clave => {
    armado = clave; SFX.tap(); vibrate(15);
    clearTimeout(armadoTimer);
    armadoTimer = setTimeout(() => { armado = null; if (raiz.isConnected) draw(); }, CONFIRMAR_MS);
    draw();
  };
  const desarmar = () => { armado = null; clearTimeout(armadoTimer); };

  const say = (texto, ms = 1800) => {
    clearTimeout(flash);
    line.textContent = texto;
    flash = setTimeout(() => { flash = 0; if (!E.isOver(state)) draw(); }, ms);
  };

  function draw() {
    const bad = new Set([...E.conflicts(state), ...E.wrong(state)]);
    const sel = selected, selDigit = sel >= 0 ? state.cells[sel] : 0;
    const n = E.counts(state);
    cells.forEach((cell, i) => {
      const d = state.cells[i];
      cell.className = 'sd-cell' + edges(G, i)
        + (E.isGiven(state, i) ? ' given' : E.isHinted(state, i) ? ' hinted' : d ? ' mine' : '')
        + (i === sel ? ' sel' : sel >= 0 && G.peers[sel].includes(i) ? ' peer' : '')
        + (selDigit && d === selDigit && i !== sel ? ' same' : '')
        + (bad.has(i) ? ' bad' : '');
      if (d) cell.replaceChildren(String(d));
      else if (state.notes[i]) cell.replaceChildren(el('span', { class: 'sd-notes' }, ...[...Array(G.n)].map((_, k) => el('i', {}, E.hasNote(state, i, k + 1) ? String(k + 1) : ''))));
      else cell.replaceChildren();
    });
    keys.forEach(key => {
      const left = G.n - n[+key.dataset.d];
      key.classList.toggle('full', left <= 0);
      key.querySelector('small').textContent = left > 0 ? String(left) : '✓';
    });
    btnNotes.classList.toggle('on', notesMode);
    btnNotes.setAttribute('aria-pressed', String(notesMode));
    btnUndo.disabled = !state.history.length || E.isOver(state);
    btnHint.classList.toggle('armado', armado === 'hint');
    btnHint.textContent = armado === 'hint' ? T.sdHintSure : T.sdHint;
    btnGiveUp.classList.toggle('armado', armado === 'giveUp');
    btnGiveUp.textContent = armado === 'giveUp' ? T.sdGiveUpSure : T.sdGiveUp;
    score.textContent = fmt(T.sdScore, { n: E.score(state) });
    if (!flash && !E.isOver(state)) line.textContent = sel < 0 ? T.sdPickCell : '';
  }

  /** A right digit pops with a soft ring (yellow for a hint), and a unit it completes gets a light that runs along it. */
  function celebrate(i, { hinted = false } = {}) {
    const play = (node, cls, delay = 0) => {
      if (!node) return;
      node.classList.remove(cls); void node.offsetWidth;
      node.style.setProperty('--k', `${delay}ms`);
      node.classList.add(cls);
      node.addEventListener('animationend', () => node.classList.remove(cls), { once: true });
    };
    play(cells[i], hinted ? 'pop-hint' : 'pop-ok');
    for (const unit of E.completedUnits(state, i)) {
      const from = unit.indexOf(i);
      unit.forEach((j, k) => play(cells[j], 'sweep', 120 + Math.abs(k - from) * 45));
    }
  }

  function select(i) {
    if (E.isOver(state)) return;
    if (armado) desarmar();
    selected = i; SFX.tap(); draw();
  }

  function press(d) {
    if (E.isOver(state)) return;
    if (selected < 0 || E.isGiven(state, selected) || E.isHinted(state, selected)) { vibrate(30); return; }
    const before = state;
    state = notesMode && !state.cells[selected] ? E.toggleNote(state, selected, d) : E.setDigit(state, selected, d);
    if (state === before) return;
    SFX.tap();
    const missed = state.mistakes > (before.mistakes || 0);
    if (missed) { SFX.error(); vibrate(80); say(T.sdMistake); }
    const right = !missed && state.cells[selected] && state.cells[selected] === state.solution[selected];
    after();
    if (right && !E.isOver(state)) { SFX.reveal(); vibrate(12); celebrate(selected); }
  }

  function erase() {
    if (selected < 0 || E.isOver(state)) return;
    const before = state;
    state = E.erase(state, selected);
    if (state !== before) { SFX.tap(); after(); }
  }

  function undoMove() {
    const before = state;
    state = E.undo(state);
    if (state !== before) { SFX.tap(); after(); }
  }

  function hint() {
    if (E.isOver(state)) return;
    if (armado !== 'hint') { armar('hint'); return; }
    desarmar();
    const before = state;
    state = E.useHint(state, selected);
    if (state === before) return;
    const x = state.last;
    selected = x.i;
    after();
    if (!E.isOver(state)) { SFX.reveal(); celebrate(x.i, { hinted: true }); say(fmt(T.sdHintWhy[x.why] || T.sdHintWhy.solution, { d: x.d }), 4500); }
  }

  function giveUp() {
    if (E.isOver(state)) return;
    if (armado !== 'giveUp') { armar('giveUp'); return; }
    desarmar();
    state = E.giveUp(state);
    after();
  }

  function after() {
    if (armado) desarmar();
    guardar();
    draw();
    if (E.isOver(state)) terminar();
  }

  /**
   * The end: the board full and right, or given up. The clock stops here, not on "See results" (D-130),
   * and in a cup the result goes out now (D-150). Given up, the board shows the solution: the givens in
   * white, the rest in cyan.
   */
  function terminar({ recien = true } = {}) {
    fuera.abort();
    selected = -1;
    draw();
    const e = { ...state, last: undefined };
    ctx.pararReloj?.(e);
    pad.remove(); tools.remove();
    board.classList.add('terminado');
    if (state.gaveUp) {
      cells.forEach((cell, i) => { cell.className = 'sd-cell' + edges(G, i) + (E.isGiven(state, i) ? ' given' : ' solucion'); cell.replaceChildren(String(state.solution[i])); });
      line.textContent = T.sdSolution;
    } else line.textContent = '';
    if (recien) { if (state.gaveUp) SFX.tap(); else { SFX.reveal(); vibrate([30, 50, 30]); } }
    const sello = state.gaveUp ? T.sdFin.rendido : !state.mistakes && !state.hints ? T.sdFin.perfecto : T.sdFin.listo;
    fin.replaceChildren(
      el('p', { class: `sd-sello${state.gaveUp ? ' mal' : ''}`, id: 'sd-sello' }, sello),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar({ ...state, last: undefined }); } }, ctx.textoFin || T.seeResults));
    if (recien) requestAnimationFrame(() => fin.scrollIntoView?.({ block: 'nearest', behavior: QUIETO() ? 'auto' : 'smooth' }));
  }

  // A keyboard on a computer: digits, arrows, Backspace erases; N toggles the notes
  const fuera = new AbortController();
  addEventListener('keydown', ev => {
    if (vez !== partidas || !board.isConnected) { fuera.abort(); return; }
    if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.target.closest?.('input, textarea')) return;
    const move = { ArrowUp: -G.n, ArrowDown: G.n, ArrowLeft: -1, ArrowRight: 1 }[ev.key];
    if (move) { ev.preventDefault(); select(selected < 0 ? Math.floor(G.cells / 2) : (selected + move + G.cells) % G.cells); }
    else if (/^[1-9]$/.test(ev.key) && +ev.key <= G.n) press(+ev.key);
    else if (ev.key === 'Backspace' || ev.key === 'Delete' || ev.key === '0') erase();
    else if (ev.key.toLowerCase() === 'n') { notesMode = !notesMode; draw(); }
  }, { signal: fuera.signal });

  draw();
  if (E.isOver(state)) terminar({ recien: false });

  // For the end-to-end scripts (C-14): the state, a move, and a way to fill the board
  window.__sudoku = {
    state: () => state,
    play: (i, d) => { selected = i; notesMode = false; press(d); },
    solveAllBut: (left = 1) => {
      const empty = state.cells.map((d, i) => (d === state.solution[i] ? -1 : i)).filter(i => i >= 0);
      for (const i of empty.slice(0, Math.max(0, empty.length - left))) state = E.setDigit(state, i, state.solution[i]);
      after();
    },
  };
}

/** What goes to the cup and to the result: 0 to 100 already (100, −10 a wrong digit, −15 a hint; 0 given up), and its card. */
export function result(e) {
  const s = e ? E.score(e) : 0;
  return { s, t: E.card(e), resumen: `${s}/100` };
}

/** How the score was reached (D-106), line by line; the cup adds the total. */
export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e) return null;
  if (e.gaveUp) return [T.sdBdRendido];
  const n = e.mistakes || 0, a = e.hints || 0;
  return [
    T.sdBdInicio,
    n ? fmt(T.sdBdErrores[n === 1 ? 1 : 2], { n, pts: E.SCORE_MISTAKE * n }) : T.sdBdErrores[0],
    a ? fmt(T.sdBdPistas[a === 1 ? 0 : 1], { n: a, pts: E.SCORE_HINT * a }) : null,
    E.SCORE_FULL - E.SCORE_MISTAKE * n - E.SCORE_HINT * a < 0 ? T.sdBdPiso : null,
  ].filter(Boolean);
}
