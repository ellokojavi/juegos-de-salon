/**
 * Tembleque / The Wobbles: the cover (C-2). A lever picks the level, Sudoku's (Pintaminas' hard-mode
 * switch): down and green is easy, the 2D plank; up and red is hard, the 3D disc. The picture above shows
 * the level the lever shows, moving, and ⚖️ Empezar opens it; under Entrar, that level's ranking, as Sudoku's cover has. Each level is a page of its own that keeps
 * the owner's prototype whole: easy/ and hard/; their ‹ comes back here. Out of the lab, launched by flags/wobbles (D-517's way); docs/games/wobbles.md.
 */
import { $, el, vibrate } from '../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { trackVisit } from '../assets/js/transport/stats.js';
import { footerInto } from '../assets/js/site-footer.js';
import { abrirComentario } from '../assets/js/labs-idioma.js';
import { labAccess } from '../assets/js/lab-access.js';
import { flag } from '../assets/js/flags.js';
import { coverWithDialogs } from '../assets/js/cover-dialogs.js';
import { bloqueJugador, avisoPartida, bloqueTabla, bloqueRanking } from '../assets/js/ranking.js';
import { SOLO_LEVELS } from '../assets/js/games.js';
import { salidasFin } from '../assets/js/fin.js';
import { ponerBuzon } from '../assets/js/buzon.js';
import { rankingsVisibles } from '../assets/js/jugador.js';
import { GAME_ID, LOCALES } from './rules.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../assets/js/manifests/wobbles.js';

// Launched by a flag (D-517's way, lab: #seccion-wobbles): until flags/wobbles is on for this visitor (🚀 everyone,
// or 🧪 with a lab key) the cover and both levels send them to the home page. If Firebase cannot answer, it stays
flag('wobbles').then(on => { if (!on) location.replace(new URL('../', import.meta.url).href); }).catch(() => {});

const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const QUIET = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** The level the lever shows: easy until it is flipped, as in Sudoku. */
let chosen = 'easy';

/* ---------------- The picture: each level, as it really plays ---------------- */
// A loop of each level recorded from the real game (tools/generators/wobbles-cover.mjs, the owner's request,
// 2026-11-21): the camera follows the falling pieces and pushes in as they land, and the seam is a crossfade.
// No words on them, so one clip serves every language. Only the level the lever shows plays; with reduced
// motion neither plays, and its first frame (the poster) stands still.
const clip = level => `<video class="wb-${level === 'easy' ? '2d' : '3d'}" src="cover/${level}.mp4" poster="cover/${level}.jpg" muted loop playsinline disablepictureinpicture preload="${level === 'easy' ? 'auto' : 'none'}" aria-hidden="true"></video>`;

/** Plays the clip of the level on the lever and pauses the other. */
function playClip() {
  for (const v of $('#pic').querySelectorAll('video')) {
    const on = v.classList.contains(chosen === 'hard' ? 'wb-3d' : 'wb-2d');
    if (on && !QUIET()) { v.muted = true; v.play?.()?.catch?.(() => {}); } else v.pause?.();
  }
}

/** The picture, how to play and the ranking follow the lever. */
function drawPicture() {
  $('#pic').classList.toggle('hard', chosen === 'hard');
  playClip();
  $('#how').replaceChildren(...L.como[chosen].map(step => el('li', {}, step)));
  drawRanking();
}

/**
 * The level's table on the cover, under Entrar, as every solo game's cover has it (Sudoku's names its level:
 * «Ranking de Sudoku · 🟢 Fácil»). It was missing at launch (2026-11-22): the tables were only on each
 * level's result. `wobbles_easy` or `wobbles_hard`, the one the lever shows.
 */
let rankingShown = null;
function drawRanking() {
  const slot = document.getElementById('rk-table');
  if (!slot || rankingShown === chosen || !rankingsVisibles()) return;
  rankingShown = chosen;
  slot.replaceChildren(bloqueRanking({ juego: `${GAME_ID}_${chosen}`, titulo: rankingTitle(chosen), alTocar: () => SFX.tap() }));
}

/**
 * «Ranking de Tembleque · 🟢 Fácil»: the cover and each level's result name the level, as Sudoku's do (the player
 * agent, 2026-11-22: after a hard game the result said only «Ranking de Tembleque»). The dot and the colour stay
 * on the word's line at 320 px (no-break spaces).
 */
function rankingTitle(level) {
  const name = (SOLO_LEVELS[GAME_ID]?.[level]?.[lang] || SOLO_LEVELS[GAME_ID]?.[level]?.es || '').replace(/ /g, '\u00a0');
  const game = manifest.name[lang] || manifest.name.es;
  return fmt(C.rk.titleOf, { game: name ? `${game}\u00a0· ${name}` : game });
}

/* ---------------- The level lever: Sudoku's (Pintaminas' electric switch), as is ---------------- */
/**
 * Down with a green knob is easy, up with a red knob is hard. Flipping it sends an electric wave around
 * the plate and turns the whole cover over: easy is the usual night, hard is a charged red-violet panel,
 * with a flash over the view, sparks and a glow that flickers like a bad contact.
 */
let flicker = 0;
function setTheme() {
  const hard = chosen === 'hard';
  document.body.classList.toggle('wb-hard', hard);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hard ? '#2a0612' : '#150726');
}
function lightning() {
  if (QUIET()) return;
  const x = el('div', { class: 'wb-flash', 'aria-hidden': 'true' });
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}
function wave(lever, hard) {
  const w = el('span', { class: 'wb-wave' + (hard ? ' hard' : ''), 'aria-hidden': 'true' });
  lever.querySelector('.wb-plate').append(w);
  setTimeout(() => w.remove(), 900);
  lever.classList.remove('zap'); void lever.offsetWidth; lever.classList.add('zap');
}
function startFlicker(lever) {
  const n = ++flicker;
  if (QUIET()) return;
  const step = () => {
    if (n !== flicker || !lever.isConnected || chosen !== 'hard') { lever.style.removeProperty('--glow'); return; }
    const r = Math.random();
    const glow = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    lever.style.setProperty('--glow', glow.toFixed(2));
    setTimeout(step, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  step();
}
function renderModes() {
  const hard = chosen === 'hard';
  const title = el('b', {}, T.switch[+hard].title), sub = el('span', { class: 'muted' }, T.switch[+hard].sub);
  const lever = el('button', {
    type: 'button', class: 'wb-lever' + (hard ? ' on' : ''), id: 'btn-level', role: 'switch',
    'aria-checked': String(hard), 'aria-label': T.switch[1].title,
    onClick: () => {
      chosen = chosen === 'hard' ? 'easy' : 'hard';
      const on = chosen === 'hard';
      if (on) { lightning(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      lever.classList.toggle('on', on);
      lever.setAttribute('aria-checked', String(on));
      title.textContent = T.switch[+on].title; sub.textContent = T.switch[+on].sub;
      if (!QUIET()) wave(lever, on);
      if (on) startFlicker(lever); else flicker++;
      setTheme(); drawPicture();
    },
  },
  el('span', { class: 'wb-plate', 'aria-hidden': 'true' },
    el('span', { class: 'wb-track', html: '<svg viewBox="0 0 70 60"><path class="wb-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'wb-bolt b1' }, '⚡'), el('span', { class: 'wb-bolt b2' }, '⚡'), el('span', { class: 'wb-bolt b3' }, '⚡'),
    el('span', { class: 'wb-arm' }, el('span', { class: 'wb-knob' })), el('span', { class: 'wb-axle' })),
  el('span', { class: 'wb-label' }, title, sub));
  // ⚖️ Empezar opens the level the lever shows; `?lang` goes along if it came
  const play = () => { SFX.tap(); location.href = (chosen === 'hard' ? 'hard/' : 'easy/') + location.search; };
  $('#modes').replaceChildren(lever,
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'solo', onClick: play }, `${manifest.emoji || '⚖️'} ${T.play}`));
  if (hard) startFlicker(lever);
  setTheme(); drawPicture();
}

// The cover ends with the site's footer, the game's own comment as its option (C-17, U-38)
function footer() {
  const comment = el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => abrirComentario({ T: L.comentario, contexto: { juego: GAME_ID, pantalla: 'cover', nivel: chosen, idioma: lang, url: location.pathname } }),
  }, T.comentarAbrir);
  footerInto($('#pie'), { screen: `${GAME_ID}-cover`, inbox: false, options: [comment], lang });
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#pic').innerHTML = clip('easy') + clip('hard');
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  renderModes();
  $('#rk-slot').append(bloqueJugador({ alTocar: () => SFX.tap() }));
  footer();
  // Behind the lab flag cover-dialogs, the steps and the sign-in open as dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
}


/* ---------------- The result (C-19), on each level's page ---------------- */
/*
 * Each level is the owner's prototype, a classic script: its game-over card says `wobbles:over` (score,
 * time, breakdown) and this adds what every result has, in C-19's order under the score and ↻ Again: the
 * rankings notice (one line), the exits from fin.js (back to the menu), the breakdown, the level's table
 * (wobbles_easy, wobbles_hard) and the 💬 link last. `wobbles:clear` empties it when a game starts.
 */
/** The level this page is: its table is the game's with the level as its variant. */
const resultLevel = /\/hard\/?$/.test(location.pathname) ? 'hard' : 'easy';
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const byId = id => document.getElementById(id);
const C = COMMON[lang] || COMMON.es;

function wireResult() {
  document.addEventListener('wobbles:clear', () => {
    for (const id of ['cAviso', 'cExits', 'cDetail', 'cRank']) byId(id)?.replaceChildren();
  });

  document.addEventListener('wobbles:over', ({ detail: { score, ms, lines } }) => {
    const s = Math.max(0, score | 0);
    byId('cExits').replaceChildren(salidasFin('suelto', { lang, raiz: '../../' }));
    // The breakdown is the long detail: after the exits (C-19, D-353)
    byId('cDetail').replaceChildren(el('ul', {}, lines.map(l => el('li', {}, l))));
    const rank = byId('cRank');
    rank.replaceChildren();
    byId('cAviso').replaceChildren();
    if (!rankingsVisibles()) return;
    const table = bloqueTabla({ tabla: `${GAME_ID}_${resultLevel}`, titulo: rankingTitle(resultLevel), entrar: false });
    rank.append(table);
    // Signed in, the score is recorded and said; not yet, the one-line offer to make it count
    byId('cAviso').append(avisoPartida({ juego: GAME_ID, variante: resultLevel, s, ms, alAnotar: () => table.recargar() }));
    ponerBuzon(byId('card'), { juego: GAME_ID });
  });
}

// The site's traffic (D-208), on the cover and on each level: a level is a page one can enter by, from a link
trackVisit();
// The cover or a level's result: the levels load this module too
if (document.getElementById('screen-intro')) {
  /* ---------------- Lab: the pieces a game starts with, in the «T» tester tab ---------------- */
/**
 * On the cover, for a lab key holder: − and + set how many pieces the plank or the disc starts with (0 to
 * 40), one number for both levels, kept on the phone; each level reads it when a game starts and lays them
 * with its own physics (docs/games/wobbles.md). Texts in the three languages.
 */
const START_KEY = 'balanza-lab:start-pieces', START_MAX = 40;
const START_T = { es: ['🧱 Piezas al empezar', 'Fácil y difícil, desde la próxima partida'], en: ['🧱 Pieces at the start', 'Easy and hard, from the next game'], pt: ['🧱 Peças ao começar', 'Fácil e difícil, a partir da próxima partida'] }[lang] || [];
function readStart() { try { return Math.max(0, Math.min(START_MAX, parseInt(localStorage.getItem(START_KEY), 10) || 0)); } catch (_) { return 0; } }
function startControl() {
  let n = readStart();
  const num = el('b', { id: 'tr-piezas', style: 'font:400 1.6rem/1 var(--font-display);min-width:2ch;text-align:center' }, String(n));
  const step = d => { n = Math.max(0, Math.min(START_MAX, n + d)); num.textContent = n; try { localStorage.setItem(START_KEY, String(n)); } catch (_) { /* no storage */ } };
  const btn = (txt, d) => el('button', { type: 'button', class: 'btn btn--ghost btn--sm', style: 'font-size:1.4rem', 'aria-label': d < 0 ? '-1' : '+1', onClick: () => { SFX.tap(); step(d); } }, txt);
  return el('div', { class: 'tr-sim' }, el('small', {}, START_T[0]),
    el('div', { class: 'tr-fila', style: 'justify-content:space-between' }, btn('−', -1), num, btn('+', 1)),
    el('p', { class: 'muted', style: 'margin:0;font-size:0.8rem' }, START_T[1]));
}
labAccess().then(ok => ok && import('../assets/js/tester-ribbon.js').then(m => m.setTesterContext(startControl()))).catch(() => {});

// The hook for the end-to-end tests (C-14)
  window.__wobbles = { id: manifest.id, get level() { return chosen; } };
  init();
} else {
  wireResult();
  // The nine cheers of a balanced drop, on trial (lab: #seccion-wobbles-cheers): off, it is always ¡Perfecto!; its switch is in the «T» tab
  flag('wobbles-cheers').then(on => { window.__wobblesCheers = on; }).catch(() => {});
  window.__wobblesResult = { level: resultLevel, table: `${GAME_ID}_${resultLevel}` };
}
