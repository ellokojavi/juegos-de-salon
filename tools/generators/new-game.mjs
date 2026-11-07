#!/usr/bin/env node
/**
 * A new game, born in the lab and passing every rule (#1249 step 9, D-395):
 *
 *   node tools/generators/new-game.mjs <id> [--name-es "…"] [--name-en "…"] [--name-pt "…"] [--emoji 🎯] [--root <dir>]
 *
 * <id> is the English name, lowercase and hyphenated: it is the folder, the id, the keys and the docs
 * (C-20). It writes, under `--root` (the repo by default):
 *
 *   public/labs/<id>/   game.json, index.html, style.css, rules.js, engine.js, engine.test.mjs, game.js
 *   public/assets/js/manifests/labs/<id>.js   the manifest as a module (tools/generators/manifests.mjs)
 *   public/labs/index.html                    its card in 🎲 Juegos en prueba (D-409)
 *   docs/games/<id>.md                        the spec with C-13's sections
 *   tools/e2e/<id>/game.mjs                   an end-to-end stub that plays it to the result
 *
 * The game itself is a placeholder to replace: a race to TARGET on one phone, two to six players,
 * each turn adds 1 or 2 (a pure state machine in engine.js). Around it is everything the canons ask:
 * the lab's door and noindex, the shared shell and tokens only (DESIGN.md), LOCALES es/en/pt with the
 * same keys, the session store (C-6), the panel signal (C-7), the result's exits from fin.js (C-19)
 * and its share through compartir.js. tools/generators/new-game.test.mjs proves it passes, untouched.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The files of a new game, as { relative path: text }. */
export function newGameFiles(id, { nameEs, nameEn, namePt, emoji = '🎯' } = {}) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) throw new Error(`"${id}" is not an English id: lowercase words joined by hyphens (C-20)`);
  const title = id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const name = { es: nameEs || title, en: nameEn || nameEs || title, pt: namePt || nameEs || title };
  const camel = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  const q = s => JSON.stringify(s).slice(1, -1).replace(/'/g, "\\'"); // inside a '…' JS string
  const h = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fill = text => text.replaceAll('__HOOK__', `__${camel}`).replaceAll('__ID__', id).replaceAll('__EMOJI__', emoji)
    .replaceAll('__NAME_ES__', q(name.es)).replaceAll('__NAME_EN__', q(name.en)).replaceAll('__NAME_PT__', q(name.pt))
    .replaceAll('__HNAME_ES__', h(name.es));

  const manifest = {
    id, path: `labs/${id}/`, emoji, name,
    tagline: { es: 'Una carrera a diez en un celular: suma uno o dos por turno.', en: 'A race to ten on one phone: add one or two each turn.', pt: 'Uma corrida até dez num celular: some um ou dois por vez.' },
    keywords: { es: ['carrera', 'turnos', 'grupo'], en: ['race', 'turns', 'group'], pt: ['corrida', 'turnos', 'grupo'] },
    players: { min: 2, max: 6 }, duration: '2–5', tipos: ['logic'], labs: true, available: false,
    modes: ['local'], ai: false, memory: `juegos-de-salon:${id}:session`, languages: ['es', 'en', 'pt'],
    firebasePaths: [], canonExceptions: [],
  };

  return {
    [`public/labs/${id}/game.json`]: JSON.stringify(manifest, null, 2) + '\n',
    [`public/labs/${id}/index.html`]: fill(INDEX),
    [`public/labs/${id}/style.css`]: fill(STYLE),
    [`public/labs/${id}/rules.js`]: fill(RULES),
    [`public/labs/${id}/engine.js`]: fill(ENGINE),
    [`public/labs/${id}/engine.test.mjs`]: fill(ENGINE_TEST),
    [`public/labs/${id}/game.js`]: fill(GAME),
    [`docs/games/${id}.md`]: fill(DOC),
    [`tools/e2e/${id}/game.mjs`]: fill(E2E),
  };
}

/** The card in /labs/, first in 🎲 Juegos en prueba. */
export const labCard = (id, emoji, nameEs) => `        <section class="panel seccion" id="seccion-${id}">
          <h2>${emoji} ${nameEs}</h2>
          <p class="muted" style="margin:0">Recién nacido del generador (node tools/generators/new-game.mjs): una carrera a diez en un celular, para reemplazar por el juego de verdad.</p>
          <a class="btn btn--yellow" id="btn-${id}" href="${id}/">${emoji} Jugar ${nameEs}</a>
        </section>

`;

const ANCHOR = '<h2>🎲 Juegos en prueba</h2>\n';

/** Writes the game under `root`; refuses to overwrite. Returns the paths written. */
export async function generate(id, opts = {}, root = REPO) {
  const files = newGameFiles(id, opts);
  for (const rel of Object.keys(files)) if (existsSync(join(root, rel))) throw new Error(`${rel} already exists`);
  for (const [rel, text] of Object.entries(files)) { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); }
  // The manifest as a module, as tools/generators/manifests.mjs writes it
  const { renderModule } = await import('./manifests.mjs');
  const mod = join(root, 'public/assets/js/manifests/labs', `${id}.js`);
  mkdirSync(dirname(mod), { recursive: true });
  writeFileSync(mod, renderModule(JSON.parse(files[`public/labs/${id}/game.json`])));
  const written = [...Object.keys(files), `public/assets/js/manifests/labs/${id}.js`];
  // Its card in /labs/
  const labs = join(root, 'public/labs/index.html');
  if (existsSync(labs)) {
    const html = readFileSync(labs, 'utf8');
    const m = JSON.parse(files[`public/labs/${id}/game.json`]);
    if (!html.includes(ANCHOR)) throw new Error('public/labs/index.html lost its "🎲 Juegos en prueba" heading');
    writeFileSync(labs, html.replace(ANCHOR, ANCHOR + labCard(id, m.emoji, m.name.es)));
    written.push('public/labs/index.html');
  }
  return written;
}

/* ------------------------------------------------------------------ */
/* The templates: __ID__, __HOOK__, __EMOJI__, __NAME_xx__ are filled */
/* ------------------------------------------------------------------ */

const INDEX = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="theme-color" content="#150726">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>__HNAME_ES__ __EMOJI__ · Juegos de Salón</title>
  <!-- A lab game (D-395): behind the lab's door (D-281) and not indexed -->
  <script src="../../assets/js/labs-puerta.js"></script>
  <meta name="robots" content="noindex, nofollow">
  <!-- No language flash (D-194): the page waits for the chosen language's texts, 1.5 s at most -->
  <script>
    (function () {
      try {
        var u = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
        var l = u || localStorage.getItem('juegos-de-salon:lang') || 'es';
        if (l === 'es') return;
        var h = document.documentElement, listo = function () { h.classList.remove('i18n-pendiente'); };
        h.classList.add('i18n-pendiente');
        document.addEventListener('DOMContentLoaded', listo);
        setTimeout(listo, 1500);
      } catch (_) { /* no storage: it paints as always */ }
    })();
  </script>
  <meta name="description" content="Una carrera a diez en un celular. 2–6 jugadores.">
  <link rel="manifest" href="../../manifest.webmanifest">
  <script>
    // The chosen language's manifest, before the browser reads it (D-222)
    (function () {
      try {
        var l = (new URLSearchParams(location.search).get('lang') || localStorage.getItem('juegos-de-salon:lang') || '').toLowerCase();
        var m = document.querySelector('link[rel="manifest"]');
        if (m && /^(en|pt)$/.test(l)) m.href = m.href.replace(/manifest\\.webmanifest$/, 'manifest.' + l + '.webmanifest');
      } catch (_) { /* the Spanish one stays */ }
    })();
  </script>
  <link rel="icon" href="../../assets/icon.svg" type="image/svg+xml">
  <script src="../../assets/js/vigia.js"></script>
  <link rel="preload" href="../../assets/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../../assets/fonts/bangers-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../../assets/css/base.css">
  <link rel="stylesheet" href="style.css">
  <link rel="apple-touch-icon" href="../../assets/icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-title" content="Juegos de Salón">
  <script type="module">import '../../assets/js/instalable.js';</script>
</head>
<body>
  <main class="app" id="app">
    <div class="topbar">
      <a class="back" href="../" id="btn-menu" data-i18n="menu">‹ Laboratorio</a>
      <div class="tools"><span class="chip" data-i18n="gameChip">__EMOJI__ __HNAME_ES__</span><span id="sound-slot"></span></div>
    </div>

    <!-- ============ INTRO ============ -->
    <section class="screen stack active" id="screen-intro">
      <div class="intro-hero">
        <span class="icon">__EMOJI__</span>
        <h1 class="display display--xl rainbow" data-i18n="title">__HNAME_ES__</h1>
        <p class="lead" data-i18n="lead"></p>
        <div id="lang-slot"></div>
      </div>
      <div class="stack">
        <div id="resume-slot"></div>
        <div class="modes" id="modes"></div>
        <!-- The rules go after the main action (U-39): the goal first and three points (U-18) -->
        <div class="panel">
          <p class="lead" data-i18n="howTitle"></p>
          <ol class="how" id="how"></ol>
        </div>
      </div>
    </section>

    <!-- ============ SETUP ============ -->
    <section class="screen stack" id="screen-setup">
      <h2 class="display display--lg center" data-i18n="whoPlays"></h2>
      <div id="setup-form"></div>
      <div class="form-error" id="form-error"></div>
      <div class="stack" id="setup-actions">
        <button class="btn btn--yellow" id="btn-start" data-i18n="start"></button>
      </div>
    </section>

    <!-- ============ PLAY ============ -->
    <section class="screen stack" id="screen-play">
      <p class="lead center" id="turn"></p>
      <ol class="race" id="race" data-tablero="carrera"></ol>
      <div class="btn-row" id="moves"></div>
    </section>

    <!-- ============ RESULT (C-19) ============ -->
    <section class="screen stack" id="screen-result">
      <div class="result-hero">
        <span class="trophy">🏆</span>
        <div class="display display--md" id="result-title">—</div>
      </div>
      <div class="stack" id="result-actions"></div>
      <div id="result-exits"></div>
    </section>
  </main>

  <div class="handoff" id="handoff" hidden></div>

  <script type="module">import './game.js';</script>
</body>
</html>
`;

const STYLE = `/* ==========================================================
   __NAME_ES__: the game's own styles (lab, born from tools/generators/new-game.mjs).
   The shell (screens, the cover's hero, modes, fields, player rows, the result's hero) lives once in
   base.css (DESIGN.md §2); this file keeps only what is the game's own, on the tokens (DESIGN.md §1).
   ========================================================== */

.how { margin: 0; padding-left: 1.3em; display: grid; gap: var(--s-6); }

/* ---------- The race ---------- */
.race { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-8); }
.race li { display: flex; justify-content: space-between; gap: var(--s-12); padding: var(--s-10) var(--s-14); border-radius: var(--r-12); background: var(--well); }
.race li.now { outline: 2px solid var(--cyan); }
.race b { font-family: var(--font-num); font-size: var(--fs-120); }
`;

const RULES = `/**
 * __NAME_EN__: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/__ID__.md.
 */

export const GAME_ID = '__ID__';
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const TARGET = 10;      // the first to reach it wins
export const DEFAULT_CONFIG = { target: TARGET };

const ES = {
  ui: {
    docTitle: '__NAME_ES__ __EMOJI__ · Juegos de Salón', gameChip: '__EMOJI__ __NAME_ES__', menu: '‹ Laboratorio',
    title: '__NAME_ES__', lead: 'Una carrera a diez en un celular que pasa de mano en mano.',
    howTitle: '__EMOJI__ Cómo se juega',
    modeLocal: 'Un celular', modeLocalHint: 'De 2 a 6, pasándolo',
    whoPlays: '¿Quiénes juegan?', playerPlaceholder: 'Jugador {n}', start: '¡A jugar!', formError: 'Faltan nombres',
    turnOf: 'Turno de {name}', plusOne: '+1', plusTwo: '+2',
    resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
    winner: '¡Ganó {name}!', again: '¡Otra partida!', shareRotulo: '📤 Compartir', shareContext: 'En un celular',
  },
  como: ['🎯 Llega primero a diez.', '👆 En tu turno suma uno o dos.', '📱 Pasa el celular al siguiente.'],
};

const EN = {
  ui: {
    docTitle: '__NAME_EN__ __EMOJI__ · Parlor Games', gameChip: '__EMOJI__ __NAME_EN__', menu: '‹ Lab',
    title: '__NAME_EN__', lead: 'A race to ten on one phone passed from hand to hand.',
    howTitle: '__EMOJI__ How to play',
    modeLocal: 'One phone', modeLocalHint: 'From 2 to 6, passing it',
    whoPlays: 'Who is playing?', playerPlaceholder: 'Player {n}', start: 'Let\\'s play!', formError: 'Names are missing',
    turnOf: '{name}\\'s turn', plusOne: '+1', plusTwo: '+2',
    resumeTitle: '⏯ There is a game in progress', resume: 'Continue', delete: 'Delete',
    winner: '{name} wins!', again: 'Play again!', shareRotulo: '📤 Share', shareContext: 'On one phone',
  },
  como: ['🎯 Be the first to reach ten.', '👆 On your turn add one or two.', '📱 Pass the phone on.'],
};

const PT = {
  ui: {
    docTitle: '__NAME_PT__ __EMOJI__ · Jogos de Salão', gameChip: '__EMOJI__ __NAME_PT__', menu: '‹ Laboratório',
    title: '__NAME_PT__', lead: 'Uma corrida até dez num celular que passa de mão em mão.',
    howTitle: '__EMOJI__ Como se joga',
    modeLocal: 'Um celular', modeLocalHint: 'De 2 a 6, passando',
    whoPlays: 'Quem joga?', playerPlaceholder: 'Jogador {n}', start: 'Vamos jogar!', formError: 'Faltam nomes',
    turnOf: 'Vez de {name}', plusOne: '+1', plusTwo: '+2',
    resumeTitle: '⏯ Há uma partida pela metade', resume: 'Continuar', delete: 'Apagar',
    winner: '{name} ganhou!', again: 'Outra partida!', shareRotulo: '📤 Compartilhar', shareContext: 'Num celular',
  },
  como: ['🎯 Chegue primeiro a dez.', '👆 Na sua vez some um ou dois.', '📱 Passe o celular adiante.'],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
`;

const ENGINE = `/**
 * __NAME_EN__: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 * A placeholder to replace: a race to \`target\`, each turn adds 1 or 2 and passes the phone.
 */

/** A new game for these names. */
export function newGame(names, { target = 10 } = {}) {
  if (!Array.isArray(names) || names.length < 1) throw new Error('newGame: at least one player');
  return { target, players: names.map(name => ({ name, score: 0 })), turn: 0, moves: 0, winner: null };
}

/** The state after the player whose turn it is adds \`n\` (1 or 2); the same state when the move is not valid. */
export function play(state, n) {
  if (state.winner !== null || (n !== 1 && n !== 2)) return state;
  const players = state.players.map((p, i) => (i === state.turn ? { ...p, score: Math.min(state.target, p.score + n) } : p));
  const won = players[state.turn].score >= state.target;
  return { ...state, players, moves: state.moves + 1, winner: won ? state.turn : null, turn: won ? state.turn : (state.turn + 1) % players.length };
}

export const isOver = state => state.winner !== null;
`;

const ENGINE_TEST = `// node public/labs/__ID__/engine.test.mjs: the rules (C-12)
import assert from 'node:assert/strict';
import { newGame, play, isOver } from './engine.js';
import { LOCALES, TARGET } from './rules.js';

let s = newGame(['Ana', 'Beto'], { target: TARGET });
assert.equal(s.turn, 0);
assert.equal(play(s, 3), s, 'only 1 or 2');
s = play(s, 2);
assert.deepEqual(s.players.map(p => p.score), [2, 0]);
assert.equal(s.turn, 1, 'the turn passes');
while (!isOver(s)) s = play(s, 2);
assert.equal(s.winner, 0, 'the first to reach the target wins');
assert.equal(s.players[0].score, TARGET);
assert.equal(play(s, 1), s, 'nothing moves after the end');
assert.throws(() => newGame([]));

// The texts: the same keys in every language, none empty (C-3)
const keys = Object.keys(LOCALES.es.ui).sort();
for (const [lang, L] of Object.entries(LOCALES)) {
  assert.deepEqual(Object.keys(L.ui).sort(), keys, lang + ': same keys as es');
  for (const k of keys) assert.ok(L.ui[k].trim(), lang + '.' + k + ' is not empty');
  assert.ok(L.como.length <= 3, lang + ': up to three steps (U-18)');
}
console.log('__ID__ engine: ok');
`;

const GAME = `/**
 * __NAME_EN__: state machine and drawing (C-2), the only file that touches the DOM. The rules are in
 * engine.js, the texts in rules.js. Screens: intro → setup → play (the phone goes around) → result.
 * The game is saved after every move to resume it (C-6). Lab only (D-395).
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore, createNameStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { botonCompartir, cabecera } from '../../assets/js/compartir.js';
import { GAME_ID, MIN_PLAYERS, MAX_PLAYERS, DEFAULT_CONFIG, LOCALES } from './rules.js';
import * as E from './engine.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/__ID__.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\\{(\\w+)\\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));

let state = null;
const save = () => store.save({ mode: 'local', state, done: !!state && E.isOver(state) });

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------------- Intro and setup ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.state) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { state = saved.state; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderModes() {
  $('#modes').replaceChildren(el('button', { class: 'mode', 'data-mode': 'local', onClick: () => { SFX.tap(); renderSetup(); } },
    el('span', {}, el('b', {}, T.modeLocal), el('small', {}, T.modeLocalHint)), el('span', { class: 'go' }, '›')));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function renderSetup() {
  const remembered = nameStore.list() || [];
  const draft = remembered.length >= MIN_PLAYERS ? remembered.slice(0, MAX_PLAYERS) : Array(MIN_PLAYERS).fill('');
  $('#setup-form').replaceChildren(...draft.map((v, i) => el('div', { class: 'player-row' },
    el('span', { class: 'num' }, String(i + 1)),
    el('input', { type: 'text', value: v, maxlength: 14, autocomplete: 'off', placeholder: fmt(T.playerPlaceholder, { n: i + 1 }) }))));
  $('#form-error').textContent = '';
  showScreen('screen-setup');
}

function start() {
  const names = $$('#setup-form input').map(i => i.value.trim()).filter(Boolean);
  if (names.length < MIN_PLAYERS) { $('#form-error').textContent = T.formError; vibrate(60); return; }
  nameStore.setList(names);
  state = E.newGame(names, DEFAULT_CONFIG);
  save();
  trackStart({ game: GAME_ID, mode: 'local', players: names.length, nombres: names }); // usage signal (C-7, D-210)
  renderPlay();
}

/* ---------------- Play ---------------- */
function renderPlay() {
  if (E.isOver(state)) return renderResult();
  $('#turn').textContent = fmt(T.turnOf, { name: state.players[state.turn].name });
  $('#race').replaceChildren(...state.players.map((p, i) => el('li', { class: i === state.turn ? 'now' : '' },
    el('span', {}, p.name), el('b', {}, p.score + ' / ' + state.target))));
  $('#moves').replaceChildren(
    el('button', { class: 'btn btn--cyan', id: 'btn-plus-1', onClick: () => move(1) }, T.plusOne),
    el('button', { class: 'btn btn--yellow', id: 'btn-plus-2', onClick: () => move(2) }, T.plusTwo));
  showScreen('screen-play');
}

function move(n) {
  SFX.tap();
  state = E.play(state, n);
  save();
  if (E.isOver(state)) trackFinish({ ganador: state.players[state.winner].name });
  renderPlay();
}

/* ---------------- Result (C-19) ---------------- */
function renderResult() {
  const name = state.players[state.winner].name;
  $('#result-title').textContent = fmt(T.winner, { name });
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { state = E.newGame(state.players.map(p => p.name), DEFAULT_CONFIG); save(); renderPlay(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: T.shareContext }), fmt(T.winner, { name })].join('\\n\\n') }),
    }));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  confetti();
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
  $('#btn-start').addEventListener('click', () => { SFX.tap(); start(); });
  renderModes();
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14)
window.__HOOK__ = { state: () => state, move };
init();
`;

const DOC = `# __EMOJI__ __NAME_EN__ (lab, in Juegos en prueba)

Born from \`node tools/generators/new-game.mjs __ID__\` (#1249 step 9). The game in it is a placeholder
to replace; everything around it already follows the canons.

## Resumen

- **Where:** \`/labs/__ID__/\`, behind the lab's door (D-281, D-395), \`noindex\`, its card in /labs/'s
  🎲 Juegos en prueba. Not in \`games.js\` while it is in the lab. Id \`__ID__\` in the usage signal and in
  \`localStorage\` (\`juegos-de-salon:__ID__:session\`, \`…:names\`). Its facts are in \`game.json\`.
- **For whom:** 2 to 6 players, one phone. In es, en and pt.

## Reglas

A race to ten: on your turn add 1 or 2 to your score and pass the phone; the first to reach ten wins.

## Modos

One phone (\`local\`), passed from hand to hand.

## Flujo

Intro (resume panel, the mode, how to play) → setup (the names, remembered) → play (whose turn, the
scores, +1 and +2) → result (the winner, Play again, Share through \`compartir.js\`, and the exit to the
lab from \`fin.js\`, C-19).

## Protocolo de mensajes

None: one phone, no room. The whole state is saved after every move (\`createSessionStore\`, C-6).

## Archivos

- \`public/labs/__ID__/game.json\`: the manifest (#1249), \`rules.js\`: data and LOCALES, \`engine.js\`: the pure rules,
  \`engine.test.mjs\`, \`game.js\`: screens and drawing, \`style.css\`: only its own, on the tokens.
- \`tools/e2e/__ID__/game.mjs\`: plays it to the result; \`node tools/e2e/conformance.mjs labs/__ID__\` checks the canons.

## Excepciones a los cánones

None.
`;

const E2E = `// __NAME_EN__ (lab): plays a game on one phone to the result, then the conformance checks run it in
// every language (tools/e2e/conformance.mjs). Born from tools/generators/new-game.mjs.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

await b.go(SITE + '/labs/__ID__/'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/__ID__/');
await b.evaluate("document.querySelector('.mode').click(); 1"); await sleep(300);
await b.evaluate("[...document.querySelectorAll('#setup-form input')].forEach((i, k) => { i.value = ['Ana', 'Beto'][k]; }); 1");
await b.evaluate("document.getElementById('btn-start').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-play', 'the game starts');
for (let i = 0; i < 12 && await b.active() === 'screen-play'; i++) { await b.evaluate("document.getElementById('btn-plus-2').click(); 1"); await sleep(150); }
ok(await b.active() === 'screen-result', 'it reaches the result');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\\"labs/\\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const id = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!id) { console.error('usage: node tools/generators/new-game.mjs <id> [--name-es …] [--name-en …] [--name-pt …] [--emoji …] [--root <dir>]'); process.exit(2); }
  const written = await generate(id, { nameEs: opt('--name-es'), nameEn: opt('--name-en'), namePt: opt('--name-pt'), emoji: opt('--emoji') }, opt('--root') || REPO);
  for (const f of written) console.log('wrote ' + f);
  console.log('\nNext: node public/assets/js/conformance.test.mjs, then make it a game (docs/ADD-GAME.md).');
}
