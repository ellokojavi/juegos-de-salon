/**
 * Artefactos — lab prototype: a contraption puzzle for one player, in the genre of The Incredible Machine
 * (Sierra, 1993), credited on the cover; the board, the parts, the levels and the look are our own.
 * Each level drops a ball that must end in the cup: the player places ramps, planks, trampolines and fans
 * from the tray on the grid, then taps ▶ Probar to watch the ball run. Fewer parts, more stars.
 *
 * The engine (board, placing, physics, levels) is engine.js; this file is the screens, the drawing, the
 * input, the sound and the texts, in Spanish, English and Portuguese (C-3).
 */
import { escena } from './scene.js';
import { POOL } from './levels.js';
import { el, vibrate } from '../../assets/js/ui.js';
import { initSound, soundToggle, isMuted } from '../../assets/js/sound.js';
import { getLang, coverLangToggle } from '../../assets/js/i18n.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { salidasFin } from '../../assets/js/fin.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import {
  LEVELS, COLS, ROWS, R, newBoard, place, move, remove, flip, partAt, fits, newRun, stepRun, starsOf, fixedSegments,
} from './engine.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'artifacts';
const KEY = 'juegos-de-salon:artifacts';
const LOCALES = {
  es: {
    lema: 'Arma la máquina y lleva la pelota a la canasta.',
    credito: ['Un juego de máquinas como ', ', de Sierra (1993).'], wiki: 'https://es.wikipedia.org/wiki/The_Incredible_Machine',
    comoSeJuega: '🧠 Cómo se juega',
    como: [
      ['🧩', 'Arrastra una pieza de abajo al tablero.'],
      ['↔️', 'Toca una rampa o un ventilador para girarlo; arrastra para moverlo; suéltalo fuera para quitarlo.'],
      ['▶️', 'Toca Probar: la pelota tiene que quedar en la canasta 🧺.'],
      ['⏱️', '5 etapas, cada una más difícil, contra un reloj de 6 minutos.'],
    ],
    jugar: '⚙️ Jugar', nivel: 'Nivel {n}', objetivo: 'Lleva la pelota a la 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tabla', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Probar', parar: '■ Parar', limpiar: '🧹 Limpiar', girar: '↔ Girar', quitar: '🗑 Quitar',
    elige: 'Arrastra una pieza al tablero (o tócala y toca una casilla).', toca: 'Toca el tablero para poner la {p}.', noCabe: 'Ahí no cabe.',
    movida: 'Toca para girarla · arrástrala para moverla · suéltala fuera para quitarla.', movidaFija: 'Arrástrala para moverla · suéltala fuera para quitarla.', suelta: 'Suelta para ponerla.', soltarQuitar: 'Suelta aquí para devolverla a la bandeja.', soltarTablero: 'Llévala al tablero.', quitada: 'De vuelta a la bandeja.', deshecho: 'Deshecho.', deshacer: '↶ Deshacer', sinPiezas: 'Prueba primero sin piezas, o pon una.', pista: '💡 Pista', pistaDice: 'Prueba poner una {p} donde brilla. Cada pista cuesta una ★.', sinPista: 'Ya tienes todo lo de la respuesta: prueba.', rendirse: '🏳️ Rendirse', rendirseSeguro: '¿Seguro? Toca otra vez', rendida: 'Etapa saltada.',
    fallos: { spiked: '¡Pinchazo! 📌 Prueba otra cosa.', boom: '¡Bum! 💥 Tocó el fondo. Prueba otra cosa.', stuck: 'Se quedó atascada. Prueba otra cosa.' },
    gano: '¡Funciona!', linea: ['Con 1 pieza.', 'Con {n} piezas.'], siguiente: 'Siguiente etapa ›', otraVez: 'Jugar otra vez', formato: '5 etapas · {n}', mejor: '🏆 Récord: {n}', etapa: 'Etapa {n} de 5', superada: '¡Etapa {n} superada!', enTiempo: 'En {n}.', verResultado: 'Ver el resultado ›', record: '🏆 ¡Nuevo récord!', sinTiempo: '⏱️ ¡Se acabó el tiempo!', finJuego: '¡Listo!', superadas: '{n} de 5 etapas superadas.', columnas: ['Etapa', 'Dificultad', 'Piezas', 'Tiempo', 'Puntos'], rapidez: '⚡ Rapidez (usaste {n})', total: 'Total', leyenda: 'Cada etapa vale 10, más 5 / 3 / 1 por usar pocas piezas (★★★ / ★★ / ★), más hasta 10 por rapidez.', tuMejor: 'Tu récord: {n}',
    fin: '¡Armaste todas las máquinas! 🏆', laboratorio: '‹ Laboratorio', otro: '🎲 Otro', dificultad: ['Aprendiendo', 'Fácil', 'Fácil +', 'Medio', 'Medio +', 'Difícil', 'Experto'],
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
      ['▶️', 'Tap Try: the ball has to end up in the basket 🧺.'],
      ['⏱️', '5 stages, each one harder, against a 6-minute clock.'],
    ],
    jugar: '⚙️ Play', nivel: 'Level {n}', objetivo: 'Get the ball to the 🧺',
    piezas: { ramp: 'Ramp', plank: 'Plank', spring: 'Trampoline', fan: 'Fan' },
    probar: '▶ Try', parar: '■ Stop', limpiar: '🧹 Clear', girar: '↔ Turn', quitar: '🗑 Remove',
    elige: 'Drag a part onto the board (or tap it, then tap a cell).', toca: 'Tap the board to place the {p}.', noCabe: 'It does not fit there.',
    movida: 'Tap to turn it · drag to move it · drop it outside to remove it.', movidaFija: 'Drag to move it · drop it outside to remove it.', suelta: 'Let go to place it.', soltarQuitar: 'Let go here to put it back in the tray.', soltarTablero: 'Bring it onto the board.', quitada: 'Back in the tray.', deshecho: 'Undone.', deshacer: '↶ Undo', sinPiezas: 'Try it with no parts first, or place one.', pista: '💡 Hint', pistaDice: 'Try a {p} where it glows. Each hint costs one ★.', sinPista: 'You already have everything the answer needs: try it.', rendirse: '🏳️ Give up', rendirseSeguro: 'Sure? Tap again', rendida: 'Stage skipped.',
    fallos: { spiked: 'Popped! 📌 Try something else.', boom: 'Boom! 💥 It hit the bottom. Try something else.', stuck: 'It got stuck. Try something else.' },
    gano: 'It works!', linea: ['With 1 part.', 'With {n} parts.'], siguiente: 'Next stage ›', otraVez: 'Play again', formato: '5 stages · {n}', mejor: '🏆 Best: {n}', etapa: 'Stage {n} of 5', superada: 'Stage {n} cleared!', enTiempo: 'In {n}.', verResultado: 'See the result ›', record: '🏆 New best!', sinTiempo: '⏱️ Time is up!', finJuego: 'Done!', superadas: '{n} of 5 stages cleared.', columnas: ['Stage', 'Difficulty', 'Parts', 'Time', 'Points'], rapidez: '⚡ Speed (you used {n})', total: 'Total', leyenda: 'Each stage is worth 10, plus 5 / 3 / 1 for using few parts (★★★ / ★★ / ★), plus up to 10 for speed.', tuMejor: 'Your best: {n}',
    fin: 'You built every machine! 🏆', laboratorio: '‹ Lab', otro: '🎲 Another', dificultad: ['Learning', 'Easy', 'Easy +', 'Medium', 'Medium +', 'Hard', 'Expert'],
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
      ['▶️', 'Toque Testar: a bola tem que ficar na cesta 🧺.'],
      ['⏱️', '5 etapas, cada uma mais difícil, contra um relógio de 6 minutos.'],
    ],
    jugar: '⚙️ Jogar', nivel: 'Nível {n}', objetivo: 'Leve a bola até a 🧺',
    piezas: { ramp: 'Rampa', plank: 'Tábua', spring: 'Cama elástica', fan: 'Ventilador' },
    probar: '▶ Testar', parar: '■ Parar', limpiar: '🧹 Limpar', girar: '↔ Girar', quitar: '🗑 Tirar',
    elige: 'Arraste uma peça para o tabuleiro (ou toque nela e numa casa).', toca: 'Toque o tabuleiro para colocar a {p}.', noCabe: 'Aí não cabe.',
    movida: 'Toque para girar · arraste para mover · solte fora para tirar.', movidaFija: 'Arraste para mover · solte fora para tirar.', suelta: 'Solte para colocar.', soltarQuitar: 'Solte aqui para devolver à bandeja.', soltarTablero: 'Leve ao tabuleiro.', quitada: 'De volta à bandeja.', deshecho: 'Desfeito.', deshacer: '↶ Desfazer', sinPiezas: 'Teste primeiro sem peças, ou coloque uma.', pista: '💡 Dica', pistaDice: 'Tente uma {p} onde brilha. Cada dica custa uma ★.', sinPista: 'Você já tem tudo o que a resposta pede: teste.', rendirse: '🏳️ Desistir', rendirseSeguro: 'Certeza? Toque de novo', rendida: 'Etapa pulada.',
    fallos: { spiked: 'Furou! 📌 Tente outra coisa.', boom: 'Bum! 💥 Bateu no fundo. Tente outra coisa.', stuck: 'Ficou presa. Tente outra coisa.' },
    gano: 'Funciona!', linea: ['Com 1 peça.', 'Com {n} peças.'], siguiente: 'Próxima etapa ›', otraVez: 'Jogar de novo', formato: '5 etapas · {n}', mejor: '🏆 Recorde: {n}', etapa: 'Etapa {n} de 5', superada: 'Etapa {n} superada!', enTiempo: 'Em {n}.', verResultado: 'Ver o resultado ›', record: '🏆 Novo recorde!', sinTiempo: '⏱️ Acabou o tempo!', finJuego: 'Pronto!', superadas: '{n} de 5 etapas superadas.', columnas: ['Etapa', 'Dificuldade', 'Peças', 'Tempo', 'Pontos'], rapidez: '⚡ Rapidez (você usou {n})', total: 'Total', leyenda: 'Cada etapa vale 10, mais 5 / 3 / 1 por usar poucas peças (★★★ / ★★ / ★), mais até 10 por rapidez.', tuMejor: 'Seu recorde: {n}',
    fin: 'Você montou todas as máquinas! 🏆', laboratorio: '‹ Laboratório', otro: '🎲 Outro', dificultad: ['Aprendendo', 'Fácil', 'Fácil +', 'Médio', 'Médio +', 'Difícil', 'Expert'],
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
/** A burst of noise: the bang of the explosion */
function noise(dur) {
  if (isMuted() || !ac || ac.state !== 'running') return;
  try {
    const n = ac.sampleRate * dur, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const src = ac.createBufferSource(), g = ac.createGain(); g.gain.value = 0.25;
    src.buffer = buf; src.connect(g).connect(ac.destination); src.start();
  } catch (_) { /* silent */ }
}
const SOUND = {
  place: () => tone(520, 700, 0.07, 'triangle', 0.07),
  flip: () => { tone(700, 500, 0.05, 'triangle', 0.06); tone(500, 760, 0.06, 'triangle', 0.06, 0.05); },
  lift: () => tone(600, 300, 0.12, 'sine', 0.07),
  knock: () => tone(300, 180, 0.05, 'square', 0.04),
  boing: () => tone(200, 900, 0.18, 'sine', 0.1),
  won: () => { tone(660, 660, 0.1, 'triangle'); tone(880, 880, 0.1, 'triangle', 0.1, 0.1); tone(1320, 1320, 0.25, 'triangle', 0.1, 0.2); },
  fail: () => tone(300, 90, 0.35, 'sawtooth', 0.08),
  boom: () => { tone(160, 40, 0.6, 'sawtooth', 0.14); tone(90, 30, 0.8, 'square', 0.08, 0.05); noise(0.5); },
};

/*
 * A game, as Tren en Vilo's: five stages of growing difficulty against one clock. Each stage is drawn
 * from its tier of the generated pool (levels.js): 1 part, 1 part among decoys, 2 parts, then 3 and 3
 * among decoys. The first game of the day draws with the day's seed, the same five for everyone; «Jugar
 * otra vez» draws a new five. The clock runs while building and testing, and stops while a stage's
 * summary is open or the page is hidden; at 0:00 the game ends where it is.
 *
 * Score: each stage passed is 10, plus 5 / 3 / 1 for its stars (the fewest parts, one more, more), plus
 * up to 10 for speed (all of it with the five in 2:00 or less, none at the end of the clock), scaled by
 * the stages passed: at most 5 × 15 + 10 = 85.
 */
export const STAGE_TIERS = [1, 2, 3, 5, 6];
const CLOCK_MS = 6 * 60 * 1000, FAST_MS = 2 * 60 * 1000;
const PUNTOS_ETAPA = 10, PUNTOS_ESTRELLAS = [0, 1, 3, 5], PUNTOS_RAPIDEZ = 10;
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const daySeed = day => [...day].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
/** The five stages for a seed: one level of each tier in STAGE_TIERS. */
export function stagesFor(seed) {
  const r = seeded(seed);
  return STAGE_TIERS.map(t => { const tier = POOL.filter(l => l.tier === t); return tier[Math.floor(r() * tier.length)]; });
}
let save = { best: 0, day: null };
try {
  // Once: the best kept while the game was called Artilugio comes along to its English key (D-535)
  const old = 'juegos-de-salon:artilugio-stages';
  if (!localStorage.getItem(KEY) && localStorage.getItem(old)) { localStorage.setItem(KEY, localStorage.getItem(old)); localStorage.removeItem(old); }
  save = { ...save, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
} catch (_) { /* nothing kept */ }
const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) { /* not kept */ } };
// The game in play: its stages, the one being built, what each scored, and the clock
let game = null, level = null;
function newGame(seed) {
  game = { seed, stages: stagesFor(seed), at: 0, done: [], left: CLOCK_MS, paused: true, over: false };
}
const mmss = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
function speedPoints() {
  const used = CLOCK_MS - game.left, passed = game.done.filter(d => d.ok).length;
  const k = Math.max(0, Math.min(1, (CLOCK_MS - used) / (CLOCK_MS - FAST_MS)));
  return game.left <= 0 ? 0 : Math.round(PUNTOS_RAPIDEZ * k * passed / STAGE_TIERS.length);
}
const totalOf = () => game.done.reduce((a, d) => a + d.pts, 0) + speedPoints();

/* ------------------------------------------------------------------ */
/* The cover                                                           */
/* ------------------------------------------------------------------ */
function show(id) { document.body.classList.toggle('jugando', id === 's-juego'); document.body.classList.remove('ganado'); for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id); scrollTo(0, 0); foot(); }
// The cover ends with the site's footer, the game's own comment as its option; other screens keep the comment alone (U-38)
let comment = null;
const foot = () => { if (!comment) return; if ($('s-portada').classList.contains('active')) footerInto($('pie'), { screen: 'artifacts-cover', inbox: false, options: [comment()], lang }); else $('pie').replaceChildren(comment()); };
function texts() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  $('btn-volver').textContent = L.laboratorio;
  $('lema').textContent = L.lema;
  $('credito').replaceChildren(L.credito[0], el('a', { href: L.wiki, target: '_blank', rel: 'noopener', id: 'link-tim' }, 'The Incredible Machine'), L.credito[1]);
  $('como-titulo').textContent = L.comoSeJuega;
  $('pasos').replaceChildren(...L.como.map(([e, t]) => el('li', {}, el('span', { 'aria-hidden': 'true' }, e), el('span', {}, t))));
  $('btn-jugar').textContent = L.jugar;
  $('btn-probar').textContent = L.probar; $('btn-limpiar').textContent = L.limpiar; $('btn-deshacer').textContent = L.deshacer;
  $('btn-girar').textContent = L.girar; $('btn-pista').textContent = L.pista; $('btn-rendirse').textContent = L.rendirse; $('btn-quitar').textContent = L.quitar;
  $('btn-otra').textContent = L.otraVez;
  comment = () => el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => abrirComentario({ T: L.comentario, contexto: { juego: GAME_ID, etapa: game ? game.at + 1 : null, nivelId: level?.id, pantalla: $('s-juego').classList.contains('active') ? 'juego' : 'portada', url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160) } }),
  }, L.comentarAbrir);
  foot();
  levelChips();
}
function levelChips() {
  // The cover: the format, and the best on this phone
  $('niveles').replaceChildren(
    el('span', { class: 'chip chip--gold', id: 'formato' }, fmt(L.formato, mmss(CLOCK_MS))),
    save.best ? el('span', { class: 'chip', id: 'mejor' }, fmt(L.mejor, save.best)) : '');
}

/* ------------------------------------------------------------------ */
/* The workshop                                                        */
/* ------------------------------------------------------------------ */
const canvas = $('lienzo');
let board = null, run = null, picked = null, chosen = null, trail = [], startedAt = 0;

function startLevel(lv) {
  level = lv;
  board = newBoard(lv); history = []; run = null; picked = null; chosen = null; trail = []; won = false; popped = false; ghost = null; hint = null; game.hints = 0; giveUpArmed(false);
  $('resultado').hidden = true; document.body.classList.remove('ganado');
  $('nivel').textContent = fmt(L.etapa, game.at + 1); $('dificultad').textContent = L.dificultad[lv.tier];
  $('etapas').replaceChildren(...STAGE_TIERS.map((_, i) => el('span', { class: i < game.at ? (game.done[i]?.ok ? 'ok' : 'no') : i === game.at ? 'ahora' : '' })));
  say(L.elige);
  startedAt = Date.now(); game.stageAt = game.left; game.paused = false;
  tray(); controls(); clock();
  show('s-juego');
  requestAnimationFrame(size);
}
function clock() {
  const c = $('reloj'); c.textContent = mmss(game.left);
  c.classList.toggle('apurado', game.left < 30000);
}
/** Jugar: a new game of five stages (the day's five the first time today), from stage 1. */
function startGame(seed) {
  newGame(seed);
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  startLevel(game.stages[0]);
}
function say(t) { $('mensaje').textContent = t; }
/*
 * The tray: each part is drawn as the object it is, ready to drag onto the board, one per copy left
 * (two ramps, two ramps); past MAX_COPIES, one with its ×n. A part with none left stays faint.
 */
const MAX_COPIES = 3;
function tray() {
  const items = [];
  for (const t of Object.keys(board.level.tray)) {
    const n = board.left[t] || 0, copies = n > MAX_COPIES ? 1 : Math.max(1, n);
    for (let i = 0; i < copies; i++) {
      const cv = el('canvas', { class: 'pieza-dibujo', 'aria-hidden': 'true' });
      const b = el('button', {
        type: 'button', class: `pieza${picked === t ? ' on' : ''}${n ? '' : ' agotada'}`, 'data-pieza': t, disabled: !!run || !n,
        'aria-label': `${L.piezas[t]} ×${n}`, title: L.piezas[t],
      }, cv, n > MAX_COPIES ? el('b', {}, `×${n}`) : '');
      // A press on a tray part starts a drag; released where it began, it is a tap that picks it (tap to place)
      b.addEventListener('pointerdown', e => { if (!b.disabled) grab(e, { kind: 'new', type: t }); });
      b.addEventListener('click', e => { if (e.detail === 0) pick(t); });   // the keyboard's Enter / Space
      items.push([b, cv, t]);
    }
  }
  $('bandeja').replaceChildren(...items.map(([b]) => b));
  // drawn once laid out (the screen may still be hidden on this frame)
  requestAnimationFrame(() => { for (const [, cv, t] of items) escena(cv).piece(t); });
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
  $('btn-pista').disabled = !!run; $('btn-rendirse').disabled = !!run && run.state === 'won';
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
  if (hint && board.placed.some(q => same(hint, q))) hint = null;
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
/* A hint: where one part of the answer goes, one the board does not have yet. Each one costs a star, down to none. */
const same = (a, b) => a.type === b.type && a.c === b.c && a.r === b.r && (!flippable(a) || (a.dir ?? 1) === (b.dir ?? 1));
$('btn-pista').addEventListener('click', () => {
  if (run || !board) return;
  const want = level.solution.find(p => !board.placed.some(q => same(p, q)));
  if (!want) { hint = null; say(L.sinPista); draw(); return; }
  if (!hint || !same(hint, want)) game.hints++;   // the same hint shown again costs nothing more
  hint = { dir: 1, ...want }; SOUND.flip();
  say(fmt(L.pistaDice, L.piezas[want.type].toLowerCase())); draw();
});
/* Giving up a stage: a second tap confirms it; the stage counts as not passed and the next one starts */
let armed = null;
function giveUpArmed(on) {
  clearTimeout(armed); armed = on ? setTimeout(() => giveUpArmed(false), 3000) : null;
  $('btn-rendirse').textContent = on ? L.rendirseSeguro : L.rendirse; $('btn-rendirse').classList.toggle('btn--danger', on);
}
$('btn-rendirse').addEventListener('click', () => {
  if (!game || game.over || !$('resultado').hidden) return;
  if (!armed) return giveUpArmed(true);
  giveUpArmed(false); run = null; trail = [];
  game.done.push({ ok: false, pts: 0, stars: 0, ms: game.stageAt - game.left, id: level.id });
  SOUND.fail(); say(L.rendida);
  game.at++;
  if (game.at >= STAGE_TIERS.length) endGame(); else startLevel(game.stages[game.at]);
});
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
$('btn-jugar').addEventListener('click', () => {
  unlockAudio();
  const day = today(), first = save.day !== day;
  if (first) { save.day = day; keep(); }
  startGame(first ? daySeed(day) : Math.floor(Math.random() * 2 ** 31));
});
$('btn-siguiente').addEventListener('click', nextStage);
$('btn-otra').addEventListener('click', () => { unlockAudio(); startGame(Math.floor(Math.random() * 2 ** 31)); });
function nextStage() {
  if ($('resultado').hidden) return;
  clearTimeout(game.auto);
  game.at++;
  if (game.at >= STAGE_TIERS.length) endGame(); else startLevel(game.stages[game.at]);
}
// The page hidden (a call, another app) stops the clock; back, it runs again
document.addEventListener('visibilitychange', () => { if (game && !game.over) last = performance.now(); });

/** The game's end: every stage played, or the clock at 0:00. The result explains the sum. */
function endGame() {
  if (game.over) return;
  game.over = true; game.paused = true; run = null;
  for (let i = game.done.length; i < STAGE_TIERS.length; i++) game.done.push({ ok: false, pts: 0, stars: 0, ms: 0 });
  const total = totalOf(), passed = game.done.filter(d => d.ok).length, isBest = total > (save.best || 0);
  if (isBest) { save.best = total; keep(); }
  trackFinish({ detalle: `${total} pts · ${passed}/5 stages · ${game.done.map(d => d.ok ? d.stars : 0).join('')} stars · ${mmss(CLOCK_MS - game.left)} used · seed ${game.seed}` });
  $('fin-sello').textContent = isBest ? L.record : game.left <= 0 ? L.sinTiempo : L.finJuego;
  $('fin-sello').className = `sello ${isBest ? 'record' : 'fin'}`;
  $('fin-puntos').textContent = total;
  $('fin-linea').textContent = fmt(L.superadas, passed);
  $('fin-tabla').replaceChildren(
    el('thead', {}, el('tr', {}, ...L.columnas.map(c => el('th', {}, c)))),
    el('tbody', {}, ...game.done.map((d, i) => el('tr', { class: d.ok ? '' : 'no' },
      el('td', {}, String(i + 1)), el('td', {}, L.dificultad[STAGE_TIERS[i]]),
      el('td', { class: 'estrellas-td' }, d.ok ? '★'.repeat(d.stars) + '☆'.repeat(3 - d.stars) : '—'),
      el('td', {}, d.ok ? mmss(d.ms) : '—'),
      el('td', {}, d.ok ? `${PUNTOS_ETAPA} + ${d.pts - PUNTOS_ETAPA}` : '0'))),
      el('tr', { class: 'rapidez' }, el('td', { colspan: 4 }, fmt(L.rapidez, mmss(CLOCK_MS - game.left))), el('td', {}, `+${speedPoints()}`)),
      el('tr', { class: 'total' }, el('td', { colspan: 4 }, L.total), el('td', {}, String(total)))));
  $('fin-leyenda').textContent = L.leyenda;
  $('fin-mejor').textContent = isBest ? '' : fmt(L.tuMejor, save.best);
  $('fin-salidas').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  show('s-fin');
  levelChips();
  $('btn-otra').focus({ preventScroll: true });
}

function finish(state) {
  if (game.over) return;
  if (state === 'won') {
    SOUND.won(); vibrate([30, 40, 30]);
    const n = board.placed.length, st = Math.max(0, starsOf(level, n) - game.hints), ms = game.stageAt - game.left;
    const pts = PUNTOS_ETAPA + PUNTOS_ESTRELLAS[st];
    game.done.push({ ok: true, stars: st, ms, pts, id: level.id });
    game.paused = true;   // the summary stops the clock
    const lastOne = game.at + 1 >= STAGE_TIERS.length;
    $('res-titulo').textContent = fmt(L.superada, game.at + 1);
    $('res-estrellas').textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
    $('res-linea').textContent = `${fmt(L.linea[n === 1 ? 0 : 1], n)} ${fmt(L.enTiempo, mmss(ms))} +${pts}`;
    document.body.classList.add('ganado');
    $('btn-siguiente').textContent = lastOne ? L.verResultado : L.siguiente;
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
let ghost = null, hint = null, dragging = null, popped = false, won = false, roll = 0;
function size() { if (scene.size()) draw(); }
new ResizeObserver(size).observe($('tablero'));
function draw() { scene.draw({ board, run, chosen, ghost, hint, dragging, trail, roll, won, popped }); }
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
  // The game's clock: it runs while building and testing a stage, and ends the game at 0:00
  if (game && !game.over && !game.paused && onBoard && !document.hidden) {
    game.left -= dt * 1000; clock();
    if (game.left <= 0) { game.left = 0; clock(); SOUND.fail(); endGame(); }
  }
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
        else if (e.type === 'boom') { popped = true; trail = []; scene.explode(e.x, e.y); SOUND.boom(); vibrate([40, 30, 80]); }
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
      }, s === 'won' ? 650 : s === 'boom' ? 1100 : 450);   // the explosion plays out before the verdict
    }
  }
  // Once the ball stops (a win, a failure, Parar), its trail plays out instead of hanging there
  if ((!run || run.state !== 'running') && trail.length) trail.splice(0, 2);
  if (onBoard && board) draw();
  demoFrame(dt);
  requestAnimationFrame(frame);
}

/*
 * The cover's demo: a level building itself and then playing, over and over, behind the title. Each part
 * of the answer rises from below the board and glides into its slot (lit in cyan), one after another, as a
 * player would drag it; then the ball drops and the machine works.
 */
const demo = { scene: escena($('demo')), board: null, run: null, trail: [], wait: 0, roll: 0, won: false, parts: [], k: 0, t: 0 };
const GLIDE = 0.75, PAUSE = 0.25;   // seconds a part takes to glide in, and the pause after it lands
const ease = x => 1 - (1 - x) ** 3;
function demoNext() {
  const lv = POOL[Math.floor(Math.random() * POOL.length)];
  demo.board = newBoard(lv); demo.board.placed = [];
  demo.parts = lv.solution.map(p => ({ dir: 1, ...p }));
  demo.k = 0; demo.t = 0; demo.run = null; demo.trail = []; demo.wait = 0; demo.won = false;
}
new ResizeObserver(() => demo.scene.size()).observe($('demo'));
function demoFrame(dt) {
  if (!$('s-portada').classList.contains('active')) return;
  if (!demo.board) demoNext();
  demo.scene.tick(dt);
  let moving = null, target = null;
  if (!demo.run) {
    // Building: the part in hand glides from below the board, along a soft arc, to its slot
    const goal = demo.parts[demo.k];
    demo.t += dt;
    const k = Math.min(1, demo.t / GLIDE), e = ease(k), fromC = goal.c + (demo.k % 2 ? -2 : 2), fromR = ROWS + 0.5;
    moving = { ...goal, c: fromC + (goal.c - fromC) * e, r: fromR + (goal.r - fromR) * e - Math.sin(k * Math.PI) * 1.2 };
    target = k < 1 ? goal : null;
    if (k >= 1 && demo.t >= GLIDE) {
      if (!demo.board.placed.includes(goal)) { demo.board.placed.push(goal); demo.scene.burst(goal.c + 1, goal.r + 0.6, [demo.scene.C.yellow, '#ffffff'], 8, 2.5); }
      moving = null;
      if (demo.t >= GLIDE + PAUSE) { demo.k++; demo.t = 0; if (demo.k >= demo.parts.length) demo.run = newRun(demo.board); }
    }
  } else if (demo.run.state === 'running') {
    for (let t = 0; t < dt && demo.run.state === 'running'; t += STEP) {
      demo.roll += demo.run.ball.vx * STEP / R; stepRun(demo.run, STEP);
      for (const e of demo.run.events.splice(0)) {
        if (e.type === 'boing' && e.part) demo.scene.boing(e.part);
        if (e.type === 'won') { demo.won = true; const g = demo.board.level.goal; demo.scene.burst(g.c + 1, g.r + 0.3, [demo.scene.C.yellow, demo.scene.C.pink, demo.scene.C.cyan], 30, 6); }
      }
    }
    demo.trail.push([demo.run.ball.x, demo.run.ball.y]); if (demo.trail.length > 18) demo.trail.shift();
  } else {
    if (demo.trail.length) demo.trail.splice(0, 2);
    if ((demo.wait += dt) > 1.6) demoNext();
  }
  demo.scene.draw({ board: demo.board, run: demo.run, chosen: null, ghost: moving && { ...moving, ok: true }, hint: target, trail: demo.trail, roll: demo.roll, won: demo.won, popped: false });
}

$('sound-slot').append(soundToggle());
$('lang-slot').append(coverLangToggle());
initSound();
texts();
requestAnimationFrame(frame);
// For the end-to-end script: the game's state, and a level's solution to play it like a player would
window.__artifacts = { get board() { return board; }, get run() { return run; }, get game() { return game; }, LEVELS, POOL, get level() { return level; }, startGame, stagesFor, fits, fixedSegments };
