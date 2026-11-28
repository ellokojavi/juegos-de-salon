/**
 * Cosmic Marble (Canica Cósmica): the page (C-2). Screens: cover → the run (course.js draws it on its
 * canvas) → the result. Lab only (D-395).
 *
 * Memory (C-6): the run is saved at the start of every stage (its seed, the order of the worlds, the
 * lives and the stages cleared). A reload offers to continue: the same course comes back from the
 * start of that stage, so reloading never skips a stage nor undoes a life lost.
 */
import { $, $$, el, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { finDePartida } from '../../assets/js/ranking.js';
import { botonCompartir, taglineLine } from '../../assets/js/compartir.js';
import { result } from '../../assets/js/share-templates.js';
import { GAME_ID, LOCALES } from './rules.js';
import { beats, LIFE_PTS, STAGES } from './engine.js';
import * as course from './course.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/cosmic-marble.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const BEST_KEY = 'juegos-de-salon:cosmic-marble:best';
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const mmss = s => { s = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

let last = null;   // the run that just ended, for the result

function showScreen(id) {
  if (id !== 'screen-play') course.stop();
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('jugando', id === 'screen-play');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------------- Cover ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.snap) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-resume', onClick: () => { SFX.tap(); startRun(saved.snap); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

/* ---------------- A run ---------------- */
function startRun(from) {
  // One tap, one run (C-14): a second tap while the course is already up does nothing
  if ($('#screen-play').classList.contains('active')) return;
  showScreen('screen-play');
  if (!from) trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
  course.play(from);
}

course.connect({
  onStage: snap => store.save({ mode: 'solo', snap, done: false }),
  onEnd: end => {
    last = end;
    store.save({ mode: 'solo', snap: null, done: true });
    trackFinish({ ganador: null, detalle: String(end.score.pts) });
    renderResult();
  },
});

/* ---------------- Result (C-19) ---------------- */
function loadBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || 'null'); } catch (_) { return null; } }

function renderResult() {
  const { won, score, elapsed, results } = last;
  const old = loadBest();
  const isBest = beats({ pts: score.pts, time: Math.floor(elapsed) }, old);
  if (isBest) try { localStorage.setItem(BEST_KEY, JSON.stringify({ score: score.pts, time: Math.floor(elapsed) })); } catch (_) { /* no storage */ }
  $('#result-trophy').textContent = won ? '🏆' : '💔';
  $('#result-title').textContent = won ? T.winTitle : T.overTitle;
  $('#result-score').textContent = `${score.pts} ${T.pts}`;
  $('#result-best').textContent = isBest ? T.newBest : old ? fmt(T.best, { s: old.score }) : '';
  $('#result-lines').replaceChildren(
    ...(results.length ? results.map(o => el('li', {}, fmt(T.stageLine, { name: o.name, t: mmss(o.t), par: mmss(o.par), p: o.pts }))) : [el('li', {}, T.noStage)]),
    el('li', {}, score.lost ? fmt(T.livesLine, { n: score.lost, p: score.lost * LIFE_PTS }) : T.noLives),
    el('li', {}, fmt(T.timeLine, { t: mmss(elapsed) })));
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); startRun(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: result({ head: { emoji: manifest.emoji, title: T.title, context: T.shareContext }, tagline: taglineLine(manifest.tagline, lang), lines: [fmt(T.shareLine, { s: score.pts, n: Math.min(results.length, STAGES) })] }) }),
    }));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  // Whether this game records scores is the owner's call (D-212): until then a run is a game played
  // alone, which the rankings do not count
  finDePartida({ juego: GAME_ID, modo: 'solo', alTocar: () => SFX.tap() });
  if (won) confetti();
  showScreen('screen-result');
  renderResumeSlot();
}

/* ---------------- Start ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
  // Instrucciones and Entrar as dialogs behind the lab flag cover-dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
  $('#btn-play').addEventListener('click', () => { SFX.tap(); startRun(); });
  // Back from the run: the top bar's ‹ leaves the course for the cover, where it can be resumed
  $('#btn-menu').addEventListener('click', e => {
    if (!$('#screen-play').classList.contains('active')) return;
    e.preventDefault(); showScreen('screen-intro'); renderResumeSlot();
  });
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14), next to course.js's own (state, finish, step…)
Object.assign(window.__cosmicMarble, { page: { startRun, last: () => last } });
init();
