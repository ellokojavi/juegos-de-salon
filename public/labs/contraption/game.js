/**
 * Artilugio — lab prototype: a contraption puzzle for one player, in the genre of The Incredible Machine
 * (Sierra, 1993), credited on the cover; the board, the parts, the levels and the look are our own.
 * Each level drops a ball that must end in the cup: the player places ramps, planks, trampolines and fans
 * from the tray on the grid, then taps ▶ Probar to watch the ball run. Fewer parts, more stars.
 *
 * The engine (board, placing, physics, levels) is engine.js; this file is the screens, the drawing, the
 * input, the sound and the texts, in Spanish, English and Portuguese (C-3).
 */
import { escena } from './scene.js';
import { el, vibrate } from '../../assets/js/ui.js';
import { initSound, soundToggle, isMuted } from '../../assets/js/sound.js';
import { getLang, langToggle } from '../../assets/js/i18n.js';
import { salidasFin } from '../../assets/js/fin.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import {
  LEVELS, COLS, ROWS, R, newBoard, place, move, remove, flip, partAt, fits, newRun, stepRun, starsOf, fixedSegments,
} from './engine.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'artilugio';
const KEY = 'juegos-de-salon:artilugio-stars';
const LOCALES = {
  es: {
    lema: 'Arma la máquina y lleva la pelota a la canasta.',
    credito: ['Un juego de máquinas como ', ', de Sierra (1993).'], wiki: 'https://es.wikipedia.org/wiki/The_Incredible_Machine',
    comoSeJuega: '🧠 Cómo se juega',
    como: [
      ['🧩', 'Elige una pieza abajo y toca el tablero para ponerla.'],
      ['↔️', 'Toca una pieza puesta para girarla, moverla o quitarla.'],
      ['▶️', 'Toca Probar: la pelota tiene que caer en la canasta 🧺.'],
    ],
    jugar: '⚙️ Jugar', nivel: 'Nivel {n}', objetivo: 'Lleva la pelota a la 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tabla', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Probar', parar: '■ Parar', limpiar: '🧹 Limpiar', girar: '↔ Girar', quitar: '🗑 Quitar',
    elige: 'Elige una pieza y toca el tablero.', toca: 'Toca el tablero para poner la {p}.', noCabe: 'Ahí no cabe.',
    movida: 'Toca otra casilla para moverla, o usa los botones.', sinPiezas: 'Prueba primero sin piezas, o pon una.',
    fallos: { spiked: '¡Pinchazo! 📌 Prueba otra cosa.', lost: 'Se cayó del tablero. Prueba otra cosa.', stuck: 'Se quedó atascada. Prueba otra cosa.' },
    gano: '¡Funciona!', linea: ['Con 1 pieza.', 'Con {n} piezas.'], siguiente: 'Siguiente nivel ›', otraVez: 'Jugar de nuevo este nivel',
    fin: '¡Armaste todas las máquinas! 🏆', laboratorio: '‹ Laboratorio', bloqueado: 'Bloqueado', niveles: 'Ver los niveles',
    comentarAbrir: '💬 Dejar un comentario',
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos qué nivel te costó, si las piezas se ponían fácil y qué pieza te gustaría.', ph: 'Por ejemplo: el nivel 3 me costó mucho.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  },
  en: {
    lema: 'Build the machine and get the ball into the basket.',
    credito: ['A machine game like ', ', by Sierra (1993).'], wiki: 'https://en.wikipedia.org/wiki/The_Incredible_Machine',
    comoSeJuega: '🧠 How to play',
    como: [
      ['🧩', 'Pick a part below and tap the board to place it.'],
      ['↔️', 'Tap a placed part to turn, move or remove it.'],
      ['▶️', 'Tap Try: the ball has to land in the basket 🧺.'],
    ],
    jugar: '⚙️ Play', nivel: 'Level {n}', objetivo: 'Get the ball to the 🧺',
    piezas: { ramp: 'Ramp', plank: 'Plank', spring: 'Trampoline', fan: 'Fan' },
    probar: '▶ Try', parar: '■ Stop', limpiar: '🧹 Clear', girar: '↔ Turn', quitar: '🗑 Remove',
    elige: 'Pick a part and tap the board.', toca: 'Tap the board to place the {p}.', noCabe: 'It does not fit there.',
    movida: 'Tap another cell to move it, or use the buttons.', sinPiezas: 'Try it with no parts first, or place one.',
    fallos: { spiked: 'Popped! 📌 Try something else.', lost: 'It fell off the board. Try something else.', stuck: 'It got stuck. Try something else.' },
    gano: 'It works!', linea: ['With 1 part.', 'With {n} parts.'], siguiente: 'Next level ›', otraVez: 'Play this level again',
    fin: 'You built every machine! 🏆', laboratorio: '‹ Lab', bloqueado: 'Locked', niveles: 'See the levels',
    comentarAbrir: '💬 Leave a comment',
    comentario: { titulo: 'What did you think?', lead: 'Tell us which level was hard, if placing parts was easy and what part you would like.', ph: 'For example: level 3 was very hard.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'There is no internet right now: your comment is saved on this phone and will be sent later.', error: 'It could not be sent. Try again in a while.', cancelar: 'Cancel', cerrar: 'Close' },
  },
  pt: {
    lema: 'Monte a máquina e leve a bola até a cesta.',
    credito: ['Um jogo de máquinas como ', ', da Sierra (1993).'], wiki: 'https://pt.wikipedia.org/wiki/The_Incredible_Machine',
    comoSeJuega: '🧠 Como se joga',
    como: [
      ['🧩', 'Escolha uma peça abaixo e toque o tabuleiro para colocá-la.'],
      ['↔️', 'Toque uma peça colocada para girar, mover ou tirar.'],
      ['▶️', 'Toque Testar: a bola tem que cair na cesta 🧺.'],
    ],
    jugar: '⚙️ Jogar', nivel: 'Nível {n}', objetivo: 'Leve a bola até a 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tábua', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Testar', parar: '■ Parar', limpiar: '🧹 Limpar', girar: '↔ Girar', quitar: '🗑 Tirar',
    elige: 'Escolha uma peça e toque o tabuleiro.', toca: 'Toque o tabuleiro para colocar a {p}.', noCabe: 'Aí não cabe.',
    movida: 'Toque outra casa para movê-la, ou use os botões.', sinPiezas: 'Teste primeiro sem peças, ou coloque uma.',
    fallos: { spiked: 'Furou! 📌 Tente outra coisa.', lost: 'Caiu do tabuleiro. Tente outra coisa.', stuck: 'Ficou presa. Tente outra coisa.' },
    gano: 'Funciona!', linea: ['Com 1 peça.', 'Com {n} peças.'], siguiente: 'Próximo nível ›', otraVez: 'Jogar este nível de novo',
    fin: 'Você montou todas as máquinas! 🏆', laboratorio: '‹ Laboratório', bloqueado: 'Bloqueado', niveles: 'Ver os níveis',
    comentarAbrir: '💬 Deixar um comentário',
    comentario: { titulo: 'O que achou?', lead: 'Conte qual nível foi difícil, se era fácil colocar as peças e que peça você gostaria.', ph: 'Por exemplo: o nível 3 foi muito difícil.', nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Agora não há internet: seu comentário ficou no celular e será enviado depois.', error: 'Não foi possível enviar. Tente de novo daqui a pouco.', cancelar: 'Cancelar', cerrar: 'Fechar' },
  },
};
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const fmt = (s, n) => String(s).replace(/\{[np]\}/, n);
const $ = id => document.getElementById(id);
const ICON = { ramp: '📐', plank: '🪵', spring: '🛝', fan: '🌀' };

/* Sound: short synth tones, silenced by the app's 🔊 toggle */
let ac = null;
function unlockAudio() { try { ac ??= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state !== 'running') ac.resume(); } catch (_) { /* silent */ } }
function tone(f0, f1, dur, type = 'sine', vol = 0.1, delay = 0) {
  if (isMuted() || !ac || ac.state !== 'running') return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), s = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f1, s + dur);
    g.gain.setValueAtTime(vol, s); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g).connect(ac.destination); o.start(s); o.stop(s + dur + 0.02);
  } catch (_) { /* a missed beep is fine */ }
}
const SOUND = {
  place: () => tone(520, 700, 0.07, 'triangle', 0.07),
  knock: () => tone(300, 180, 0.05, 'square', 0.04),
  boing: () => tone(200, 900, 0.18, 'sine', 0.1),
  won: () => { tone(660, 660, 0.1, 'triangle'); tone(880, 880, 0.1, 'triangle', 0.1, 0.1); tone(1320, 1320, 0.25, 'triangle', 0.1, 0.2); },
  fail: () => tone(300, 90, 0.35, 'sawtooth', 0.08),
};

/* Progress: the stars of each level solved, on this phone */
let stars = [];
try { stars = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { stars = []; }
const unlocked = i => i === 0 || (stars[i - 1] || 0) > 0;
// The level the cover offers: the first one not solved yet (the last one when every one is)
const firstOpen = () => { const i = LEVELS.findIndex((_, k) => !stars[k]); return i < 0 ? LEVELS.length - 1 : i; };
let current = firstOpen();

/* ------------------------------------------------------------------ */
/* The cover                                                           */
/* ------------------------------------------------------------------ */
function show(id) { document.body.classList.toggle('jugando', id === 's-juego'); document.body.classList.remove('ganado'); for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id); scrollTo(0, 0); }
function texts() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  $('btn-volver').textContent = L.laboratorio;
  $('lema').textContent = L.lema;
  $('credito').replaceChildren(L.credito[0], el('a', { href: L.wiki, target: '_blank', rel: 'noopener', id: 'link-tim' }, 'The Incredible Machine'), L.credito[1]);
  $('como-titulo').textContent = L.comoSeJuega;
  $('pasos').replaceChildren(...L.como.map(([e, t]) => el('li', {}, el('span', { 'aria-hidden': 'true' }, e), el('span', {}, t))));
  $('btn-jugar').textContent = L.jugar;
  $('btn-probar').textContent = L.probar; $('btn-limpiar').textContent = L.limpiar;
  $('btn-girar').textContent = L.girar; $('btn-quitar').textContent = L.quitar;
  $('btn-otra').textContent = L.otraVez;
  $('pie').replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => abrirComentario({ T: L.comentario, contexto: { juego: GAME_ID, nivel: current + 1, pantalla: $('s-juego').classList.contains('active') ? 'juego' : 'portada', url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160) } }),
  }, L.comentarAbrir));
  levelChips();
}
function levelChips() {
  $('niveles').replaceChildren(...LEVELS.map((_, i) => el('button', {
    type: 'button', class: `chip-btn${i === current ? ' on' : ''}`, 'data-nivel': i + 1, disabled: !unlocked(i),
    'aria-label': unlocked(i) ? fmt(L.nivel, i + 1) : `${fmt(L.nivel, i + 1)} · ${L.bloqueado}`,
    onClick: () => { current = i; levelChips(); },
  }, unlocked(i) ? String(i + 1) : '🔒', stars[i] ? el('small', {}, '★'.repeat(stars[i])) : '')));
}

/* ------------------------------------------------------------------ */
/* The workshop                                                        */
/* ------------------------------------------------------------------ */
const canvas = $('lienzo');
let board = null, run = null, picked = null, chosen = null, trail = [], startedAt = 0;

function startLevel(i) {
  current = i; board = newBoard(i); run = null; picked = null; chosen = null; trail = []; won = false; popped = false; ghost = null;
  $('resultado').hidden = true; document.body.classList.remove('ganado');
  $('nivel').textContent = fmt(L.nivel, i + 1); $('objetivo').textContent = L.objetivo;
  say(L.elige);
  startedAt = Date.now();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  tray(); controls();
  show('s-juego');
  requestAnimationFrame(size);
}
function say(t) { $('mensaje').textContent = t; }
function tray() {
  $('bandeja').replaceChildren(...Object.keys(board.level.tray).map(t => el('button', {
    type: 'button', class: `chip-btn${picked === t ? ' on' : ''}`, 'data-pieza': t, disabled: !!run || !(board.left[t] > 0),
    onClick: () => { picked = picked === t ? null : t; chosen = null; say(picked ? fmt(L.toca, L.piezas[t].toLowerCase()) : L.elige); tray(); controls(); draw(); },
  }, `${ICON[t]} ${L.piezas[t]}`, el('b', {}, `×${board.left[t]}`))));
}
function controls() {
  $('acciones-pieza').hidden = !chosen || !!run;
  $('btn-girar').disabled = !chosen || !(chosen.type === 'ramp' || chosen.type === 'fan');
  $('btn-probar').textContent = run ? L.parar : L.probar;
  $('btn-probar').disabled = !!run && run.state === 'won';
  $('btn-limpiar').disabled = !!run || !board.placed.length;
}

/** The board's tap: place the picked part, choose a placed one, or move the chosen one there. */
function cellAt(e) {
  const r = canvas.getBoundingClientRect();
  return [Math.floor((e.clientX - r.left) / r.width * COLS), Math.floor((e.clientY - r.top) / r.height * ROWS)];
}
canvas.addEventListener('pointerdown', e => {
  if (run || !board) return;
  e.preventDefault();
  let [c, r] = cellAt(e);
  const hit = partAt(board, c, r);
  if (picked) {
    c = Math.min(c, COLS - 2);
    const p = place(board, picked, c, r, 1);
    if (p) { SOUND.place(); vibrate(15); chosen = p; picked = board.left[picked] > 0 ? picked : null; say(L.movida); }
    else say(L.noCabe);
  } else if (hit) { chosen = chosen === hit ? null : hit; say(chosen ? L.movida : L.elige); }
  else if (chosen) {
    c = Math.min(c, COLS - 2);
    if (move(board, chosen, c, r)) { SOUND.place(); say(L.movida); } else say(L.noCabe);
  }
  tray(); controls(); draw();
});
$('btn-girar').addEventListener('click', () => { if (chosen && flip(chosen)) { SOUND.place(); draw(); } });
$('btn-quitar').addEventListener('click', () => { if (chosen) { remove(board, chosen); chosen = null; say(L.elige); tray(); controls(); draw(); } });
$('btn-limpiar').addEventListener('click', () => { for (const p of [...board.placed]) remove(board, p); chosen = null; picked = null; say(L.elige); tray(); controls(); draw(); });
$('btn-probar').addEventListener('click', () => {
  unlockAudio();
  if (run) { run = null; say(L.elige); tray(); controls(); draw(); return; }
  picked = null; chosen = null; trail = []; ghost = null; popped = false; won = false;
  run = newRun(board); last = performance.now(); acc = 0;
  say(''); tray(); controls();
});
$('btn-jugar').addEventListener('click', () => { unlockAudio(); startLevel(current); });
$('btn-siguiente').addEventListener('click', () => {
  if (current + 1 < LEVELS.length) startLevel(current + 1);
  else { current = firstOpen(); show('s-portada'); levelChips(); }
});
$('btn-otra').addEventListener('click', () => startLevel(current));

function finish(state) {
  if (state === 'won') {
    SOUND.won(); vibrate([30, 40, 30]);
    const n = board.placed.length, s = starsOf(current, n);
    stars[current] = Math.max(stars[current] || 0, s);
    try { localStorage.setItem(KEY, JSON.stringify(stars)); } catch (_) { /* not kept */ }
    trackFinish({ detalle: `level ${current + 1} · ${n} parts · ${s} stars · ${Math.round((Date.now() - startedAt) / 1000)}s` });
    const last = current + 1 >= LEVELS.length;
    $('res-titulo').textContent = last ? L.fin : L.gano;
    $('res-estrellas').textContent = '★'.repeat(s) + '☆'.repeat(3 - s);
    $('res-linea').textContent = fmt(L.linea[n === 1 ? 0 : 1], n);
    document.body.classList.add('ganado');
    $('btn-siguiente').textContent = last ? L.niveles : L.siguiente;
    $('res-salidas').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
    $('resultado').hidden = false;
    $('btn-siguiente').focus({ preventScroll: true });
  } else {
    SOUND.fail(); vibrate(60);
    say(L.fallos[state]);
  }
}

/* ------------------------------------------------------------------ */
/* Drawing (scene.js) and the loop                                     */
/* ------------------------------------------------------------------ */
const scene = escena(canvas);
let ghost = null, popped = false, won = false, roll = 0;
function size() { if (scene.size()) draw(); }
new ResizeObserver(size).observe($('tablero'));
/** The free cells the picked part can go to, to light them up */
function freeCells() {
  if (!picked || run) return null;
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) if (fits(board, { type: picked, c, r })) out.push([c, r], [c + 1, r]);
  return out;
}
function draw() { scene.draw({ board, run, chosen, ghost, trail, roll, won, popped, free: freeCells() }); }
// With a mouse, the picked part (or the chosen one) follows the pointer as a ghost before the click
canvas.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || run || !board || !(picked || chosen)) { if (ghost) { ghost = null; draw(); } return; }
  let [c, r] = cellAt(e); c = Math.min(c, COLS - 2);
  if (!picked && partAt(board, c, r)) { ghost = null; draw(); return; }
  const g = picked ? { type: picked, c, r, dir: 1 } : { ...chosen, c, r };
  g.ok = fits(board, g, picked ? null : chosen);
  ghost = g; draw();
});
canvas.addEventListener('pointerleave', () => { ghost = null; draw(); });

/* The loop: a fixed step, so the ball runs the same on every phone (and as the tests play it) */
const STEP = 1 / 120;
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const onBoard = $('s-juego').classList.contains('active');
  if (onBoard) scene.tick(dt);
  if (run && run.state === 'running') {
    acc += dt;
    while (acc >= STEP && run.state === 'running') {
      const vx = run.ball.vx;
      stepRun(run, STEP); acc -= STEP;
      roll += vx * STEP / R;
      for (const e of run.events.splice(0)) {
        if (e.type === 'knock') SOUND.knock();
        else if (e.type === 'boing') { SOUND.boing(); if (e.part) scene.boing(e.part); scene.burst(run.ball.x, run.ball.y + R, [scene.C.lime, '#ffffff'], 8, 3); }
        else if (e.type === 'spiked') { popped = true; scene.burst(e.x, e.y, [scene.C.pink, scene.C.red, '#ffffff'], 26, 5); }
        else if (e.type === 'won') { won = true; const g = board.level.goal; scene.burst(g.c + 1, g.r + 0.3, [scene.C.yellow, scene.C.pink, scene.C.cyan, scene.C.lime], 46, 7); }
      }
    }
    trail.push([run.ball.x, run.ball.y]); if (trail.length > 18) trail.shift();
    if (run.state !== 'running') {
      const s = run.state;
      // the result waits a moment, so the pop or the confetti is seen
      setTimeout(() => {
        finish(s);
        if (s !== 'won') { run = null; popped = false; trail = []; tray(); controls(); draw(); } else controls();
      }, s === 'won' ? 650 : 450);
    }
  }
  if (onBoard && board) draw();
  demoFrame(dt);
  requestAnimationFrame(frame);
}

/* The cover's demo: a level playing its own solution over and over, behind the title */
const demo = { scene: escena($('demo')), board: null, run: null, trail: [], wait: 0, n: 0, roll: 0, won: false };
function demoNext() {
  const order = [5, 2, 3, 4, 1, 0], i = order[demo.n++ % order.length];
  demo.board = newBoard(i); LEVELS[i].solution.forEach(p => place(demo.board, p.type, p.c, p.r, p.dir ?? 1));
  demo.run = newRun(demo.board); demo.trail = []; demo.wait = 0; demo.won = false;
}
new ResizeObserver(() => demo.scene.size()).observe($('demo'));
function demoFrame(dt) {
  if (!$('s-portada').classList.contains('active')) return;
  if (!demo.board) demoNext();
  demo.scene.tick(dt);
  if (demo.run.state === 'running') {
    for (let t = 0; t < dt && demo.run.state === 'running'; t += STEP) {
      demo.roll += demo.run.ball.vx * STEP / R; stepRun(demo.run, STEP);
      for (const e of demo.run.events.splice(0)) {
        if (e.type === 'boing' && e.part) demo.scene.boing(e.part);
        if (e.type === 'won') { demo.won = true; const g = demo.board.level.goal; demo.scene.burst(g.c + 1, g.r + 0.3, [demo.scene.C.yellow, demo.scene.C.pink, demo.scene.C.cyan], 30, 6); }
      }
    }
    demo.trail.push([demo.run.ball.x, demo.run.ball.y]); if (demo.trail.length > 18) demo.trail.shift();
  } else if ((demo.wait += dt) > 1.6) demoNext();
  demo.scene.draw({ board: demo.board, run: demo.run, chosen: null, ghost: null, trail: demo.trail, roll: demo.roll, won: demo.won, popped: false, free: null });
}

$('sound-slot').append(soundToggle());
$('lang-slot').append(langToggle());
initSound();
texts();
requestAnimationFrame(frame);
// For the end-to-end script: the game's state, and a level's solution to play it like a player would
window.__artilugio = { get board() { return board; }, get run() { return run; }, LEVELS, start: startLevel, fits, fixedSegments };
