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
      ['🧩', 'Arrastra una pieza de abajo al tablero.'],
      ['↔️', 'Toca una rampa o un ventilador para girarlo; arrastra para moverlo; suéltalo fuera para quitarlo.'],
      ['▶️', 'Toca Probar: la pelota tiene que caer en la canasta 🧺.'],
    ],
    jugar: '⚙️ Jugar', nivel: 'Nivel {n}', objetivo: 'Lleva la pelota a la 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tabla', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Probar', parar: '■ Parar', limpiar: '🧹 Limpiar', girar: '↔ Girar', quitar: '🗑 Quitar',
    elige: 'Arrastra una pieza al tablero (o tócala y toca una casilla).', toca: 'Toca el tablero para poner la {p}.', noCabe: 'Ahí no cabe.',
    movida: 'Toca para girarla · arrástrala para moverla · suéltala fuera para quitarla.', movidaFija: 'Arrástrala para moverla · suéltala fuera para quitarla.', suelta: 'Suelta para ponerla.', soltarQuitar: 'Suelta aquí para devolverla a la bandeja.', soltarTablero: 'Llévala al tablero.', quitada: 'De vuelta a la bandeja.', deshecho: 'Deshecho.', deshacer: '↶ Deshacer', sinPiezas: 'Prueba primero sin piezas, o pon una.',
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
      ['🧩', 'Drag a part from below onto the board.'],
      ['↔️', 'Tap a ramp or a fan to turn it; drag to move it; drop it outside to remove it.'],
      ['▶️', 'Tap Try: the ball has to land in the basket 🧺.'],
    ],
    jugar: '⚙️ Play', nivel: 'Level {n}', objetivo: 'Get the ball to the 🧺',
    piezas: { ramp: 'Ramp', plank: 'Plank', spring: 'Trampoline', fan: 'Fan' },
    probar: '▶ Try', parar: '■ Stop', limpiar: '🧹 Clear', girar: '↔ Turn', quitar: '🗑 Remove',
    elige: 'Drag a part onto the board (or tap it, then tap a cell).', toca: 'Tap the board to place the {p}.', noCabe: 'It does not fit there.',
    movida: 'Tap to turn it · drag to move it · drop it outside to remove it.', movidaFija: 'Drag to move it · drop it outside to remove it.', suelta: 'Let go to place it.', soltarQuitar: 'Let go here to put it back in the tray.', soltarTablero: 'Bring it onto the board.', quitada: 'Back in the tray.', deshecho: 'Undone.', deshacer: '↶ Undo', sinPiezas: 'Try it with no parts first, or place one.',
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
      ['🧩', 'Arraste uma peça de baixo para o tabuleiro.'],
      ['↔️', 'Toque numa rampa ou ventilador para girar; arraste para mover; solte fora para tirar.'],
      ['▶️', 'Toque Testar: a bola tem que cair na cesta 🧺.'],
    ],
    jugar: '⚙️ Jogar', nivel: 'Nível {n}', objetivo: 'Leve a bola até a 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tábua', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Testar', parar: '■ Parar', limpiar: '🧹 Limpar', girar: '↔ Girar', quitar: '🗑 Tirar',
    elige: 'Arraste uma peça para o tabuleiro (ou toque nela e numa casa).', toca: 'Toque o tabuleiro para colocar a {p}.', noCabe: 'Aí não cabe.',
    movida: 'Toque para girar · arraste para mover · solte fora para tirar.', movidaFija: 'Arraste para mover · solte fora para tirar.', suelta: 'Solte para colocar.', soltarQuitar: 'Solte aqui para devolver à bandeja.', soltarTablero: 'Leve ao tabuleiro.', quitada: 'De volta à bandeja.', deshecho: 'Desfeito.', deshacer: '↶ Desfazer', sinPiezas: 'Teste primeiro sem peças, ou coloque uma.',
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
  flip: () => { tone(700, 500, 0.05, 'triangle', 0.06); tone(500, 760, 0.06, 'triangle', 0.06, 0.05); },
  lift: () => tone(600, 300, 0.12, 'sine', 0.07),
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
  $('btn-probar').textContent = L.probar; $('btn-limpiar').textContent = L.limpiar; $('btn-deshacer').textContent = L.deshacer;
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
  current = i; board = newBoard(i); history = []; run = null; picked = null; chosen = null; trail = []; won = false; popped = false; ghost = null;
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
  $('bandeja').replaceChildren(...Object.keys(board.level.tray).map(t => {
    const b = el('button', {
      type: 'button', class: `chip-btn${picked === t ? ' on' : ''}`, 'data-pieza': t, disabled: !!run || !(board.left[t] > 0),
    }, el('span', { class: 'pieza-ico', 'aria-hidden': 'true' }, ICON[t]), ` ${L.piezas[t]}`, el('b', {}, `×${board.left[t]}`));
    // A press on a tray part starts a drag; released where it began, it is a tap that picks it (tap to place)
    b.addEventListener('pointerdown', e => { if (!b.disabled) grab(e, { kind: 'new', type: t }); });
    b.addEventListener('click', e => { if (e.detail === 0) pick(t); });   // the keyboard's Enter / Space
    return b;
  }));
}
function pick(t) {
  picked = picked === t ? null : t; chosen = null;
  say(picked ? fmt(L.toca, L.piezas[t].toLowerCase()) : L.elige);
  tray(); controls(); draw();
}
function controls() {
  const tools = !!chosen && !run;
  $('btn-girar').hidden = !tools || !flippable(chosen); $('btn-quitar').hidden = !tools; $('btn-limpiar').hidden = tools;
  $('btn-probar').textContent = run ? L.parar : L.probar;
  $('btn-probar').disabled = !!run && run.state === 'won';
  $('btn-limpiar').disabled = !!run || !board.placed.length;
  $('btn-deshacer').disabled = !!run || !history.length;
}
const flippable = p => p.type === 'ramp' || p.type === 'fan';
const hintFor = p => flippable(p) ? L.movida : L.movidaFija;

/* Undo: a snapshot of the board before every change */
let history = [];
function remember() { history.push({ placed: board.placed.map(p => ({ ...p })), left: { ...board.left } }); if (history.length > 40) history.shift(); }
function undo() {
  const h = history.pop(); if (!h) return;
  board.placed = h.placed; board.left = h.left; chosen = null; picked = null;
  SOUND.place(); say(L.deshecho); tray(); controls(); draw();
}

/** Where on the board a pointer is, in cells (fractions), or null when it is off the board. */
function boardAt(e, lift = 0) {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * COLS, y = (e.clientY - r.top) / r.height * ROWS;
  if (x < -0.3 || x > COLS + 0.3 || y < -0.3 || y > ROWS + 0.3) return null;
  return [x, y - lift];
}
function cellAt(e) { const [x, y] = boardAt(e) || [-1, -1]; return [Math.floor(x), Math.floor(y)]; }
/** The cell a two-cell part would snap to with its middle under (x, y). */
const snap = (x, y) => [Math.max(0, Math.min(COLS - 2, Math.round(x - 1))), Math.max(0, Math.min(ROWS - 1, Math.floor(y)))];

/*
 * Dragging. A press on a tray part or a placed one becomes a drag once it moves a few pixels; the part
 * then floats as a ghost, snapped to the grid (green where it fits, red where it does not), lifted above
 * the finger on a touch screen so the finger never hides it. Let go on the board: placed or moved. Let go
 * off the board: a placed part goes back to the tray. A press that does not move is a tap.
 */
let drag = null;
const SLOP = 7;
function grab(e, what) {
  if (run || !board) return;
  e.preventDefault();
  unlockAudio();
  drag = { ...what, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId, lift: e.pointerType === 'mouse' ? 0 : 0.9 };
}
addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return mouseGhost(e);
  if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < SLOP) return;
  if (!drag.moved) {
    drag.moved = true; vibrate(8);
    if (drag.kind === 'move') { dragging = drag.part; chosen = null; controls(); }
    picked = null; tray();
    document.body.classList.add('arrastrando');
  }
  const at = boardAt(e, drag.lift);
  if (!at) { ghost = null; say(drag.kind === 'move' ? L.soltarQuitar : L.soltarTablero); $('tablero').classList.add('fuera'); draw(); return; }
  $('tablero').classList.remove('fuera');
  const [c, r] = snap(...at);
  const g = drag.kind === 'new' ? { type: drag.type, c, r, dir: 1 } : { ...drag.part, c, r };
  g.ok = fits(board, g, drag.kind === 'move' ? drag.part : null);
  if (ghost && g.ok && (ghost.c !== c || ghost.r !== r)) vibrate(4);   // a tick on each snap
  ghost = g; say(g.ok ? L.suelta : L.noCabe); draw();
});
addEventListener('pointerup', e => { if (drag && e.pointerId === drag.id) drop(e); });
addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { endDrag(); draw(); } });
function endDrag() { drag = null; dragging = null; ghost = null; document.body.classList.remove('arrastrando'); $('tablero').classList.remove('fuera'); }
function drop(e) {
  const d = drag;
  if (!d.moved) {
    endDrag();
    if (d.kind === 'new') pick(d.type);
    else tapPart(d.part);
    return;
  }
  const at = boardAt(e, d.lift), g = ghost;
  endDrag();
  if (d.kind === 'move' && !at) {
    remember(); remove(board, d.part); SOUND.lift(); vibrate(20); say(L.quitada);
  } else if (g && g.ok) {
    remember();
    const p = d.kind === 'new' ? place(board, d.type, g.c, g.r, 1) : (move(board, d.part, g.c, g.r), d.part);
    SOUND.place(); vibrate(15); chosen = p; scene.burst(p.c + 1, p.r + 0.6, [scene.C.yellow, '#ffffff'], 8, 2.5);
    say(hintFor(p));
  } else if (at) { say(L.noCabe); vibrate([10, 30, 10]); }
  tray(); controls(); draw();
}
/** One tap on a placed part: a ramp or a fan turns round at once; any part becomes the chosen one. */
function tapPart(p) {
  if (flippable(p)) { remember(); flip(p); SOUND.flip(); vibrate(10); scene.burst(p.c + 1, p.r + 0.5, [scene.C.cyan, '#ffffff'], 6, 2); }
  chosen = p; say(hintFor(p));
  tray(); controls(); draw();
}

canvas.addEventListener('pointerdown', e => {
  if (run || !board) return;
  e.preventDefault();
  const [c, r] = cellAt(e), hit = partAt(board, c, r);
  if (hit) return grab(e, { kind: 'move', part: hit });
  if (picked) {
    const [sc, sr] = snap(...boardAt(e));
    remember();
    const p = place(board, picked, sc, sr, 1);
    if (p) { SOUND.place(); vibrate(15); chosen = p; scene.burst(p.c + 1, p.r + 0.6, [scene.C.yellow, '#ffffff'], 8, 2.5); picked = board.left[picked] > 0 ? picked : null; say(hintFor(p)); }
    else { history.pop(); say(L.noCabe); }
  } else if (chosen) {
    const [sc, sr] = snap(...boardAt(e));
    remember();
    if (move(board, chosen, sc, sr)) { SOUND.place(); say(hintFor(chosen)); } else { history.pop(); chosen = null; say(L.elige); }
  }
  tray(); controls(); draw();
});
$('btn-girar').addEventListener('click', () => { if (chosen && flippable(chosen)) { remember(); flip(chosen); SOUND.flip(); controls(); draw(); } });
$('btn-quitar').addEventListener('click', () => { if (chosen) { remember(); remove(board, chosen); chosen = null; SOUND.lift(); say(L.quitada); tray(); controls(); draw(); } });
$('btn-limpiar').addEventListener('click', () => { remember(); for (const p of [...board.placed]) remove(board, p); chosen = null; picked = null; say(L.elige); tray(); controls(); draw(); });
$('btn-deshacer').addEventListener('click', undo);
// The keyboard: R turns the chosen part, Delete removes it, Ctrl+Z undoes
addEventListener('keydown', e => {
  if (!board || run || !$('s-juego').classList.contains('active') || e.target.closest?.('input, textarea')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  else if (chosen && (e.key === 'r' || e.key === 'R')) $('btn-girar').click();
  else if (chosen && (e.key === 'Delete' || e.key === 'Backspace')) $('btn-quitar').click();
  else if (e.key === 'Escape') { chosen = null; picked = null; say(L.elige); tray(); controls(); draw(); }
});
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
let ghost = null, dragging = null, popped = false, won = false, roll = 0;
function size() { if (scene.size()) draw(); }
new ResizeObserver(size).observe($('tablero'));
function draw() { scene.draw({ board, run, chosen, ghost, dragging, trail, roll, won/**
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
      ['🧩', 'Arrastra una pieza de abajo al tablero.'],
      ['↔️', 'Toca una rampa o un ventilador para girarlo; arrastra para moverlo; suéltalo fuera para quitarlo.'],
      ['▶️', 'Toca Probar: la pelota tiene que caer en la canasta 🧺.'],
    ],
    jugar: '⚙️ Jugar', nivel: 'Nivel {n}', objetivo: 'Lleva la pelota a la 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tabla', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Probar', parar: '■ Parar', limpiar: '🧹 Limpiar', girar: '↔ Girar', quitar: '🗑 Quitar',
    elige: 'Arrastra una pieza al tablero (o tócala y toca una casilla).', toca: 'Toca el tablero para poner la {p}.', noCabe: 'Ahí no cabe.',
    movida: 'Toca para girarla · arrástrala para moverla · suéltala fuera para quitarla.', movidaFija: 'Arrástrala para moverla · suéltala fuera para quitarla.', suelta: 'Suelta para ponerla.', soltarQuitar: 'Suelta aquí para devolverla a la bandeja.', soltarTablero: 'Llévala al tablero.', quitada: 'De vuelta a la bandeja.', deshecho: 'Deshecho.', deshacer: '↶ Deshacer', sinPiezas: 'Prueba primero sin piezas, o pon una.',
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
      ['🧩', 'Drag a part from below onto the board.'],
      ['↔️', 'Tap a ramp or a fan to turn it; drag to move it; drop it outside to remove it.'],
      ['▶️', 'Tap Try: the ball has to land in the basket 🧺.'],
    ],
    jugar: '⚙️ Play', nivel: 'Level {n}', objetivo: 'Get the ball to the 🧺',
    piezas: { ramp: 'Ramp', plank: 'Plank', spring: 'Trampoline', fan: 'Fan' },
    probar: '▶ Try', parar: '■ Stop', limpiar: '🧹 Clear', girar: '↔ Turn', quitar: '🗑 Remove',
    elige: 'Drag a part onto the board (or tap it, then tap a cell).', toca: 'Tap the board to place the {p}.', noCabe: 'It does not fit there.',
    movida: 'Tap to turn it · drag to move it · drop it outside to remove it.', movidaFija: 'Drag to move it · drop it outside to remove it.', suelta: 'Let go to place it.', soltarQuitar: 'Let go here to put it back in the tray.', soltarTablero: 'Bring it onto the board.', quitada: 'Back in the tray.', deshecho: 'Undone.', deshacer: '↶ Undo', sinPiezas: 'Try it with no parts first, or place one.',
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
      ['🧩', 'Arraste uma peça de baixo para o tabuleiro.'],
      ['↔️', 'Toque numa rampa ou ventilador para girar; arraste para mover; solte fora para tirar.'],
      ['▶️', 'Toque Testar: a bola tem que cair na cesta 🧺.'],
    ],
    jugar: '⚙️ Jogar', nivel: 'Nível {n}', objetivo: 'Leve a bola até a 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tábua', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Testar', parar: '■ Parar', limpiar: '🧹 Limpar', girar: '↔ Girar', quitar: '🗑 Tirar',
    elige: 'Arraste uma peça para o tabuleiro (ou toque nela e numa casa).', toca: 'Toque o tabuleiro para colocar a {p}.', noCabe: 'Aí não cabe.',
    movida: 'Toque para girar · arraste para mover · solte fora para tirar.', movidaFija: 'Arraste para mover · solte fora para tirar.', suelta: 'Solte para colocar.', soltarQuitar: 'Solte aqui para devolver à bandeja.', soltarTablero: 'Leve ao tabuleiro.', quitada: 'De volta à bandeja.', deshecho: 'Desfeito.', deshacer: '↶ Desfazer', sinPiezas: 'Teste primeiro sem peças, ou coloque uma.',
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
  flip: () => { tone(700, 500, 0.05, 'triangle', 0.06); tone(500, 760, 0.06, 'triangle', 0.06, 0.05); },
  lift: () => tone(600, 300, 0.12, 'sine', 0.07),
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
  $('btn-probar').textContent = L.probar; $('btn-limpiar').textContent = L.limpiar; $('btn-deshacer').textContent = L.deshacer;
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
  current = i; board = newBoard(i); history = []; run = null; picked = null; chosen = null; trail = []; won = false; popped = false; ghost = null;
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
  $('bandeja').replaceChildren(...Object.keys(board.level.tray).map(t => {
    const b = el('button', {
      type: 'button', class: `chip-btn${picked === t ? ' on' : ''}`, 'data-pieza': t, disabled: !!run || !(board.left[t] > 0),
    }, el('span', { class: 'pieza-ico', 'aria-hidden': 'true' }, ICON[t]), ` ${L.piezas[t]}`, el('b', {}, `×${board.left[t]}`));
    // A press on a tray part starts a drag; released where it began, it is a tap that picks it (tap to place)
    b.addEventListener('pointerdown', e => { if (!b.disabled) grab(e, { kind: 'new', type: t }); });
    b.addEventListener('click', e => { if (e.detail === 0) pick(t); });   // the keyboard's Enter / Space
    return b;
  }));
}
function pick(t) {
  picked = picked === t ? null : t; chosen = null;
  say(picked ? fmt(L.toca, L.piezas[t].toLowerCase()) : L.elige);
  tray(); controls(); draw();
}
function controls() {
  const tools = !!chosen && !run;
  $('btn-girar').hidden = !tools || !flippable(chosen); $('btn-quitar').hidden = !tools; $('btn-limpiar').hidden = tools;
  $('btn-probar').textContent = run ? L.parar : L.probar;
  $('btn-probar').disabled = !!run && run.state === 'won';
  $('btn-limpiar').disabled = !!run || !board.placed.length;
  $('btn-deshacer').disabled = !!run || !history.length;
}
const flippable = p => p.type === 'ramp' || p.type === 'fan';
const hintFor = p => flippable(p) ? L.movida : L.movidaFija;

/* Undo: a snapshot of the board before every change */
let history = [];
function remember() { history.push({ placed: board.placed.map(p => ({ ...p })), left: { ...board.left } }); if (history.length > 40) history.shift(); }
function undo() {
  const h = history.pop(); if (!h) return;
  board.placed = h.placed; board.left = h.left; chosen = null; picked = null;
  SOUND.place(); say(L.deshecho); tray(); controls(); draw();
}

/** Where on the board a pointer is, in cells (fractions), or null when it is off the board. */
function boardAt(e, lift = 0) {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * COLS, y = (e.clientY - r.top) / r.height * ROWS;
  if (x < -0.3 || x > COLS + 0.3 || y < -0.3 || y > ROWS + 0.3) return null;
  return [x, y - lift];
}
function cellAt(e) { const [x, y] = boardAt(e) || [-1, -1]; return [Math.floor(x), Math.floor(y)]; }
/** The cell a two-cell part would snap to with its middle under (x, y). */
const snap = (x, y) => [Math.max(0, Math.min(COLS - 2, Math.round(x - 1))), Math.max(0, Math.min(ROWS - 1, Math.floor(y)))];

/*
 * Dragging. A press on a tray part or a placed one becomes a drag once it moves a few pixels; the part
 * then floats as a ghost, snapped to the grid (green where it fits, red where it does not), lifted above
 * the finger on a touch screen so the finger never hides it. Let go on the board: placed or moved. Let go
 * off the board: a placed part goes back to the tray. A press that does not move is a tap.
 */
let drag = null;
const SLOP = 7;
function grab(e, what) {
  if (run || !board) return;
  e.preventDefault();
  unlockAudio();
  drag = { ...what, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId, lift: e.pointerType === 'mouse' ? 0 : 0.9 };
}
addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return mouseGhost(e);
  if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < SLOP) return;
  if (!drag.moved) {
    drag.moved = true; vibrate(8);
    if (drag.kind === 'move') { dragging = drag.part; chosen = null; controls(); }
    picked = null; tray();
    document.body.classList.add('arrastrando');
  }
  const at = boardAt(e, drag.lift);
  if (!at) { ghost = null; say(drag.kind === 'move' ? L.soltarQuitar : L.soltarTablero); $('tablero').classList.add('fuera'); draw(); return; }
  $('tablero').classList.remove('fuera');
  const [c, r] = snap(...at);
  const g = drag.kind === 'new' ? { type: drag.type, c, r, dir: 1 } : { ...drag.part, c, r };
  g.ok = fits(board, g, drag.kind === 'move' ? drag.part : null);
  if (ghost && g.ok && (ghost.c !== c || ghost.r !== r)) vibrate(4);   // a tick on each snap
  ghost = g; say(g.ok ? L.suelta : L.noCabe); draw();
});
addEventListener('pointerup', e => { if (drag && e.pointerId === drag.id) drop(e); });
addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { endDrag(); draw(); } });
function endDrag() { drag = null; dragging = null; ghost = null; document.body.classList.remove('arrastrando'); $('tablero').classList.remove('fuera'); }
function drop(e) {
  const d = drag;
  if (!d.moved) {
    endDrag();
    if (d.kind === 'new') pick(d.type);
    else tapPart(d.part);
    return;
  }
  const at = boardAt(e, d.lift), g = ghost;
  endDrag();
  if (d.kind === 'move' && !at) {
    remember(); remove(board, d.part); SOUND.lift(); vibrate(20); say(L.quitada);
  } else if (g && g.ok) {
    remember();
    const p = d.kind === 'new' ? place(board, d.type, g.c, g.r, 1) : (move(board, d.part, g.c, g.r), d.part);
    SOUND.place(); vibrate(15); chosen = p; scene.burst(p.c + 1, p.r + 0.6, [scene.C.yellow, '#ffffff'], 8, 2.5);
    say(hintFor(p));
  } else if (at) { say(L.noCabe); vibrate([10, 30, 10]); }
  tray(); controls(); draw();
}
/** One tap on a placed part: a ramp or a fan turns round at once; any part becomes the chosen one. */
function tapPart(p) {
  if (flippable(p)) { remember(); flip(p); SOUND.flip(); vibrate(10); scene.burst(p.c + 1, p.r + 0.5, [scene.C.cyan, '#ffffff'], 6, 2); }
  chosen = p; say(hintFor(p));
  tray(); controls(); draw();
}

canvas.addEventListener('pointerdown', e => {
  if (run || !board) return;
  e.preventDefault();
  const [c, r] = cellAt(e), hit = partAt(board, c, r);
  if (hit) return grab(e, { kind: 'move', part: hit });
  if (picked) {
    const [sc, sr] = snap(...boardAt(e));
    remember();
    const p = place(board, picked, sc, sr, 1);
    if (p) { SOUND.place(); vibrate(15); chosen = p; scene.burst(p.c + 1, p.r + 0.6, [scene.C.yellow, '#ffffff'], 8, 2.5); picked = board.left[picked] > 0 ? picked : null; say(hintFor(p)); }
    else { history.pop(); say(L.noCabe); }
  } else if (chosen) {
    const [sc, sr] = snap(...boardAt(e));
    remember();
    if (move(board, chosen, sc, sr)) { SOUND.place(); say(hintFor(chosen)); } else { history.pop(); chosen = null; say(L.elige); }
  }
  tray(); controls(); draw();
});
$('btn-girar').addEventListener('click', () => { if (chosen && flippable(chosen)) { remember(); flip(chosen); SOUND.flip(); controls(); draw(); } });
$('btn-quitar').addEventListener('click', () => { if (chosen) { remember(); remove(board, chosen); chosen = null; SOUND.lift(); say(L.quitada); tray(); controls(); draw(); } });
$('btn-limpiar').addEventListener('click', () => { remember(); for (const p of [...board.placed]) remove(board, p); chosen = null; picked = null; say(L.elige); tray(); controls(); draw(); });
$('btn-deshacer').addEventListener('click', undo);
// The keyboard: R turns the chosen part, Delete removes it, Ctrl+Z undoes
addEventListener('keydown', e => {
  if (!board || run || !$('s-juego').classList.contains('active') || e.target.closest?.('input, textarea')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  else if (chosen && (e.key === 'r' || e.key === 'R')) $('btn-girar').click();
  else if (chosen && (e.key === 'Delete' || e.key === 'Backspace')) $('btn-quitar').click();
  else if (e.key === 'Escape') { chosen = null; picked = null; say(L.elige); tray(); controls(); draw(); }
});
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
let ghost = null, dragging = null, popped = false, won = false, roll = 0;
function size() { if (scene.size()) draw(); }
new ResizeObserver(size).observe($('tablero'));
function draw() { scene.draw({ board, run, chosen, ghost, dragging, trail, roll, won, popped }); }
// With a mouse, the picked part follows the pointer as a ghost before the click
function mouseGhost(e) {
  if (e.pointerType !== 'mouse' || run || !board || !picked || drag) return;
  const at = boardAt(e);
  if (!at || e.target !== canvas) { if (ghost) { ghost = null; draw(); } return; }
  const [c, r] = snap(...at), g = { type: picked, c, r, dir: 1 };
  g.ok = fits(board, g); ghost = g; draw();
}
canvas.addEventListener('pointerleave', () => { if (!drag && ghost) { ghost = null; draw(); } });

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
  demo.scene.draw({ board: demo.board, run: demo.run, chosen: null, ghost: null, trail: demo.trail, roll: demo.roll, won: demo.won, popped: false });
}

$('sound-slot').append(soundToggle());
$('lang-slot').append(langToggle());
initSound();
texts();
requestAnimationFrame(frame);
// For the end-to-end script: the game's state, and a level's solution to play it like a player would
window.__artilugio = { get board() { return board; }, get run() { return run; }, LEVELS, start: startLevel, fits, fixedSegments };
 }
// With a mouse, the picked part follows the pointer as a ghost before the click
function mouseGhost(e) {
  if (e.pointerType !== 'mouse' || run || !board || !picked || drag) return;
  const at = boardAt(e);
  if (!at || e.target !== canvas) { if (ghost) { ghost = null; draw(); } return; }
  const [c, r] = snap(...at), g = { type: picked, c, r, dir: 1 };
  g.ok = fits(board, g); ghost = g; draw();
}
canvas.addEventListener('pointerleave', () => { if (!drag && ghost) { ghost = null; draw(); } });

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
  demo.scene.draw({ board: demo.board, run: demo.run, chosen: null, ghost: null, trail: demo.trail, roll: demo.roll, won: demo.won, popped: false });
}

$('sound-slot').append(soundToggle());
$('lang-slot').append(langToggle());
initSound();
texts();
requestAnimationFrame(frame);
// For the end-to-end script: the game's state, and a level's solution to play it like a player would
window.__artilugio = { get board() { return board; }, get run() { return run; }, LEVELS, start: startLevel, fits, fixedSegments };
