/**
 * Aletazo — lab prototype: a one-tap flyer, inspired by Flappy Bird (Dong Nguyen, 2013), credited on the cover. Every tap gives the bird a wing flap upwards, gravity
 * pulls it down, and the course comes at it: hoops (dead center counts double), walls with a single
 * opening, spinning spikes. A new level every 5 gates, each one faster and tighter; 3 lives.
 *
 * The engine (physics, course, rules) is engine.js; the drawing is scene.js. This file is the screens,
 * the input, the sound and the texts, in Spanish, English and Portuguese (C-3).
 */
import { el, vibrate } from '../../assets/js/ui.js';
import { initSound, soundToggle, isMuted } from '../../assets/js/sound.js';
import { getLang, coverLangToggle, COMMON } from '../../assets/js/i18n.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { salidasFin } from '../../assets/js/fin.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { labAccess } from '../../assets/js/lab-access.js';
import { bloqueTabla, avisoPartida } from '../../assets/js/ranking.js';
import { rankingsVisibles } from '../../assets/js/jugador.js';
import { newGame, step, flap, verdictOf, LIVES, BR } from './engine.js';
import { escena } from './scene.js';

trackVisit();   // the site's traffic (D-208)

const GAME_ID = 'aletazo';
const BEST_KEY = 'juegos-de-salon:aletazo-best';
const LOCALES = {
  es: {
    nombre: 'Aletazo',
    lema: 'Un toque, un aletazo.',
    credito: ['Inspirado en ', ', de Dong Nguyen.'], wiki: 'https://es.wikipedia.org/wiki/Flappy_Bird',
    como: [
      ['👆', 'Toca para subir un poco.'],
      ['⭕', 'Pasa por aros y huecos. Al medio vale doble.'],
      ['❤️', '3 vidas. Si chocas o te saltas un aro, pierdes una.'],
    ],
    comoSeJuega: 'Cómo se juega', jugar: '🐤 Jugar', aJugar: '¡A jugar!', pista: '👆 Toca para aletear', muros: '¡Muros! Pasa por el hueco',
    nivel: 'Nivel {n}', vidas: '{n} vidas',
    record: '🏆 ¡Nuevo récord!', fin: '¡Se acabó!', tuMejor: 'Tu mejor: {n}', mejor: 'Récord: {n}',
    veredictos: ['Recién saliendo del nido 🐣', 'Ya le estás agarrando el vuelo', '¡Vuelas bonito! ✨', '¡Pájaro de altura! 🦅', '¡Dueño del cielo! 👑'],
    otraVez: 'Jugar otra vez', pausa: 'En pausa', seguir: 'Toca para seguir', laboratorio: '‹ Laboratorio',
    comentarAbrir: '💬 Sugerencias y comentarios',
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si el salto se sentía bien, si se ponía difícil muy rápido y qué le cambiarías.', ph: 'Por ejemplo: los muros llegan muy pronto.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  },
  en: {
    nombre: 'Aletazo',
    lema: 'One tap, one flap.',
    credito: ['Inspired by ', ', by Dong Nguyen.'], wiki: 'https://en.wikipedia.org/wiki/Flappy_Bird',
    como: [
      ['👆', 'Tap to rise a little.'],
      ['⭕', 'Fly through hoops and gaps. Dead center counts double.'],
      ['❤️', '3 lives. Crash or skip a hoop and you lose one.'],
    ],
    comoSeJuega: 'How to play', jugar: '🐤 Play', aJugar: 'Let\'s play!', pista: '👆 Tap to flap', muros: 'Walls! Go through the gap',
    nivel: 'Level {n}', vidas: '{n} lives',
    record: '🏆 New best!', fin: 'Game over!', tuMejor: 'Your best: {n}', mejor: 'Best: {n}',
    veredictos: ['Fresh out of the nest 🐣', 'Getting the hang of it', 'Flying pretty! ✨', 'High flyer! 🦅', 'King of the sky! 👑'],
    otraVez: 'Play again', pausa: 'Paused', seguir: 'Tap to continue', laboratorio: '‹ Lab',
    comentarAbrir: '💬 Suggestions and comments',
    comentario: { titulo: 'What did you think?', lead: 'Tell us if the flap felt right, if it got hard too fast and what you would change.', ph: 'For example: the walls come too soon.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'There is no internet right now: your comment is saved on this phone and will be sent later.', error: 'It could not be sent. Try again in a while.', cancelar: 'Cancel', cerrar: 'Close' },
  },
  pt: {
    nombre: 'Aletazo',
    lema: 'Um toque, uma batida de asa.',
    credito: ['Inspirado em ', ', de Dong Nguyen.'], wiki: 'https://pt.wikipedia.org/wiki/Flappy_Bird',
    como: [
      ['👆', 'Toque para subir um pouco.'],
      ['⭕', 'Passe por aros e brechas. No centro vale dobrado.'],
      ['❤️', '3 vidas. Se bater ou pular um aro, perde uma.'],
    ],
    comoSeJuega: 'Como se joga', jugar: '🐤 Jogar', aJugar: 'Vamos jogar!', pista: '👆 Toque para bater as asas', muros: 'Muros! Passe pela brecha',
    nivel: 'Nível {n}', vidas: '{n} vidas',
    record: '🏆 Novo recorde!', fin: 'Acabou!', tuMejor: 'Seu melhor: {n}', mejor: 'Recorde: {n}',
    veredictos: ['Acabou de sair do ninho 🐣', 'Pegando o jeito', 'Voando bonito! ✨', 'Voo de altura! 🦅', 'Dono do céu! 👑'],
    otraVez: 'Jogar de novo', pausa: 'Pausado', seguir: 'Toque para continuar', laboratorio: '‹ Laboratório',
    comentarAbrir: '💬 Sugestões e comentários',
    comentario: { titulo: 'O que achou?', lead: 'Conte se o salto parecia certo, se ficava difícil rápido demais e o que você mudaria.', ph: 'Por exemplo: os muros chegam cedo demais.', nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Agora não há internet: seu comentário ficou no celular e será enviado depois.', error: 'Não foi possível enviar. Tente de novo daqui a pouco.', cancelar: 'Cancelar', cerrar: 'Fechar' },
  },
};
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const fmt = (s, n) => String(s).replace('{n}', n);
const $ = id => document.getElementById(id);

/* ------------------------------------------------------------------ */
/* Sound: a few short synth tones, silenced by the app's 🔊 toggle     */
/* ------------------------------------------------------------------ */
// The context is opened by the tap on Play: opening it on the first flap froze that frame
let ac = null, master = null;
function unlockAudio() {
  try {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination); }
    if (ac.state !== 'running') ac.resume();
  } catch (_) { /* no audio: it plays silent */ }
}
function tone(f0, f1, dur, type = 'sine', vol = 0.12, delay = 0) {
  if (isMuted() || !ac || ac.state !== 'running') return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), s = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f1, s + dur);
    g.gain.setValueAtTime(vol, s); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g).connect(master); o.start(s); o.stop(s + dur + 0.02);
  } catch (_) { /* a missed beep is fine */ }
}
const SOUND = {
  flap: () => tone(420, 760, 0.09, 'triangle', 0.08),
  pass: () => tone(760, 1040, 0.12, 'sine', 0.1),
  perfect: () => { tone(880, 880, 0.08, 'square', 0.05); tone(1175, 1175, 0.08, 'square', 0.05, 0.07); tone(1568, 1568, 0.14, 'square', 0.05, 0.14); },
  hit: () => tone(220, 70, 0.28, 'sawtooth', 0.12),
  over: () => { tone(440, 330, 0.18, 'triangle', 0.1); tone(330, 220, 0.25, 'triangle', 0.1, 0.18); tone(220, 110, 0.4, 'triangle', 0.1, 0.42); },
};

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */
const stage = $('escenario'), hud = $('hud'), cover = $('portada'), result = $('resultado'), pauseEl = $('pausa'), aviso = $('aviso'), pista = $('pista');
const scene = escena($('lienzo'));
let W = scene.measure();
new ResizeObserver(() => { W = scene.measure(); if (g) { g.W = W; if (g.mode === 'demo' && !cover.hidden) g.band = demoBand(); } }).observe(stage);
new ResizeObserver(() => { if (g?.mode === 'demo' && !cover.hidden) g.band = demoBand(); }).observe($('tarjeta-portada'));

/**
 * Where the cover's demo flies: the free strip above the card, measured from the card's top (in stage
 * heights), so the bird and its hoops show whole instead of half behind the card. Null when the strip is
 * too thin to fly in (a short phone): there the demo is only a background behind the card.
 */
const DEMO_R = 0.17 * 0.7;   // a demo hoop's radius above the card (engine.js: r × 0.7)
function demoBand() {
  const s = stage.getBoundingClientRect(), c = $('tarjeta-portada').getBoundingClientRect();
  if (!s.height) return null;
  const top = DEMO_R + 0.03, bottom = (c.top - s.top) / s.height - DEMO_R - BR;
  return bottom >= top ? [top, bottom] : null;
}

let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) { /* no storage: no best kept */ }
let g = null, paused = false, startedAt = 0, counting = false;
// A tester's start (the tester ribbon): the level and points the next game starts from, then a test game
// that keeps no best and sends no stats. lab: #seccion-aletazo
let desde = null, prueba = false;

function say(text, shine = false) {
  aviso.textContent = text;
  aviso.className = 'aviso';
  if (shine) { void aviso.offsetWidth; aviso.className = 'aviso brilla'; }
}
function paintHud() {
  $('marcador').textContent = g.score;
  $('vidas').replaceChildren(...Array.from({ length: LIVES }, (_, i) => el('span', { class: i < g.hearts ? '' : 'off' }, '❤️')));
  $('vidas').setAttribute('aria-label', fmt(L.vidas, g.hearts));
  $('nivel').textContent = fmt(L.nivel, g.level);
}

function texts() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  $('btn-volver').textContent = L.laboratorio;
  $('lema').textContent = L.lema;
  // The credit to the game it comes from, like Shinobi's and Babel's to Ketchapp
  $('credito').replaceChildren(L.credito[0], el('a', { href: L.wiki, target: '_blank', rel: 'noopener', id: 'link-flappy-bird' }, 'Flappy Bird'), L.credito[1]);
  $('btn-como').textContent = `${L.comoSeJuega} ▾`;
  $('pasos').replaceChildren(...L.como.map(([e, t]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, e), el('span', {}, t))));
  $('btn-jugar').textContent = L.jugar;
  $('mejor-portada').replaceChildren(...(best ? [fmt(L.mejor, ''), el('b', {}, String(best))] : []));
  $('pausa-titulo').textContent = L.pausa; $('pausa-seguir').textContent = L.seguir;
  $('btn-otra').textContent = L.otraVez;
  // The page ends with the site's footer, the game's own comment as its option (U-38)
  footerInto($('pie'), { screen: 'flap-cover', inbox: false, options: [el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => abrirComentario({ T: L.comentario, contexto: contexto() }),
  }, L.comentarAbrir)], lang });
}
const contexto = () => ({
  juego: GAME_ID, pantalla: g?.mode === 'play' ? 'juego' : result.hidden ? 'portada' : 'resultado',
  puntaje: g?.score, nivel: g?.level, url: location.pathname + location.search,
  pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

/**
 * Aletazo's ranking (D-212): the `aletazo` table, Week · All time · Friends, under the stage, below the
 * fold, as every game played alone shows it. On the cover with signing in; on the result, with the
 * notice that saves the run first (a tester's start never counts).
 */
const rankingEl = $('ranking');
function tabla({ entrar = true } = {}) {
  const R = (COMMON[lang] || COMMON.es).rk;
  return bloqueTabla({ tabla: GAME_ID, titulo: String(R.titleOf).replace('{game}', L.nombre), entrar });
}
function rankingCover() { rankingEl.replaceChildren(tabla()); }
function rankingResult(n, ms) {
  const tablaFin = tabla({ entrar: false });
  const cuenta = !prueba && rankingsVisibles();
  rankingEl.replaceChildren(...(cuenta ? [avisoPartida({ juego: GAME_ID, s: n, ms, alAnotar: () => tablaFin.recargar() })] : []), tablaFin);
}

/** The cover: the card over a demo that flies itself, above the card when there is room. */
function toCover() {
  result.hidden = true; hud.hidden = true; cover.hidden = false;
  document.body.classList.remove('jugando');
  texts();
  rankingCover();
  g = newGame({ W, mode: 'demo', band: demoBand() });
  scene.clear();
}
/**
 * Jugar and Jugar otra vez: the classic 3, 2, 1… ¡A jugar! (D-102, D-105) over the bird gliding on its
 * own (wings still, no hoops), blurred; on «¡A jugar!» the blur fades as the overlay leaves and the real game starts from the
 * bird where it is, hovering level with «Toca para aletear» until the first tap. The countdown is not
 * play time: the clock starts with that tap.
 */
function startGame() {
  if (counting) return;
  counting = true;
  unlockAudio();
  cover.hidden = true; result.hidden = true; hud.hidden = true;
  // The game's screen, like Stack's and Stick's: the tester ribbon's «T» hides, so it never covers the HUD's level
  document.body.classList.add('jugando');
  scrollTo(0, 0);
  g = newGame({ W, mode: 'glide' });
  scene.clear();
  stage.classList.add('contando');
  cuentaRegresiva({ titulo: `🐤 ${L.nombre}`, ya: L.aJugar }).then(ms => {
    stage.style.setProperty('--sale', `${ms}ms`);
    stage.classList.remove('contando');
    prueba = !!desde;
    g = newGame({ W, y: Math.max(0.3, Math.min(0.6, g.bird.y)), ...(desde || {}) });
    desde = null;
    counting = false;
    hud.hidden = false; paintHud(); say('');
    pista.textContent = L.pista; pista.hidden = false; pista.classList.remove('fuera');
    stage.focus({ preventScroll: true });
  });
}
function showResult() {
  const n = g.score, isBest = !prueba && n > best;
  if (isBest) { best = n; try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) { /* not kept */ } }
  if (!prueba) trackFinish({ detalle: `${n} pts · ${g.passed} gates · ${g.perfects} center · ${g.walls} walls · level ${g.level} · ${Math.round((Date.now() - startedAt) / 1000)}s` });
  hud.hidden = true; document.body.classList.remove('jugando');
  const stamp = $('res-sello');
  stamp.textContent = isBest ? L.record : L.fin; stamp.className = `sello ${isBest ? 'record' : 'fin'}`;
  $('res-puntos').textContent = n;
  $('res-veredicto').textContent = L.veredictos[verdictOf(n)];
  $('res-mejor').replaceChildren(...(isBest ? [] : [fmt(L.tuMejor, ''), el('b', {}, String(best))]));
  $('res-salidas').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  rankingResult(n, Date.now() - startedAt);
  result.hidden = false;
  $('btn-otra').focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */
function press(e) {
  e?.preventDefault();
  if (!g) return;
  if (paused) { paused = false; pauseEl.hidden = true; last = performance.now(); return; }
  if (g.mode === 'ready') { pista.classList.add('fuera'); startedAt = Date.now(); if (!prueba) trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); }
  if (g.mode === 'ready' || g.mode === 'play') flap(g);
}
stage.addEventListener('pointerdown', e => { if (e.target.closest('.capa')) return; press(e); });
addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && g && (g.mode === 'ready' || g.mode === 'play' || paused) && !e.target.closest?.('button, a, input, textarea')) press(e);
});
// A call or another app pauses it; a tap brings it back
document.addEventListener('visibilitychange', () => { if (document.hidden && g?.mode === 'play') { paused = true; pauseEl.hidden = false; } });
$('btn-jugar').addEventListener('click', startGame);
$('btn-otra').addEventListener('click', startGame);
// A short phone folds the three steps under «Cómo se juega ▾», so Jugar stays in the first screen (U-39)
$('btn-como').addEventListener('click', () => {
  const card = $('tarjeta-portada'), open = card.classList.toggle('abierta');
  $('btn-como').setAttribute('aria-expanded', String(open));
  $('btn-como').textContent = `${L.comoSeJuega} ${open ? '▴' : '▾'}`;
});

/* ------------------------------------------------------------------ */
/* The loop: a fixed step, so the feel is the same on every phone      */
/* ------------------------------------------------------------------ */
const STEP = 1 / 120;
let last = performance.now(), acc = 0;
function play(e) {
  if (e.type === 'flap') SOUND.flap();
  else if (e.type === 'pass') SOUND.pass();
  else if (e.type === 'perfect') SOUND.perfect();
  else if (e.type === 'hit') { SOUND.hit(); vibrate(60); }
  else if (e.type === 'over') SOUND.over();
  else if (e.type === 'level') say(fmt(L.nivel, e.level), true);
  else if (e.type === 'walls') say(L.muros, true);
  else if (e.type === 'end') showResult();
  scene.fx(e, g);
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (g && !paused) {
    acc += dt;
    while (acc >= STEP) {
      step(g, STEP); scene.tick(STEP, g); acc -= STEP;
      if (g.events.length) {
        const evs = g.events.splice(0);
        if (g.mode !== 'demo') { evs.forEach(play); if (evs.some(e => e.type !== 'flap')) paintHud(); }
      }
    }
  }
  if (g) scene.draw(g);
  requestAnimationFrame(frame);
}

/**
 * For a lab key: «Empezar en nivel» in the tester ribbon (the «T» on the right edge), to try the levels and
 * the times of day without playing up to them. The level and the points the game starts from, then the
 * usual countdown; a test game keeps no best and sends no stats. Texts only for testers, in Spanish like
 * Babel's «Simular final».
 */
labAccess().then(ok => {
  if (!ok) return;
  return import('../../assets/js/tester-ribbon.js').then(({ testerRibbon, setTesterContext, foldTesterRibbon }) => {
    testerRibbon({ lang, labsUrl: new URL('../', import.meta.url).href });
    const num = (id, label, value, max) => el('input', { type: 'number', min: id === 'tr-nivel' ? 1 : 0, max, value, id, 'aria-label': label, inputmode: 'numeric' });
    const nivel = num('tr-nivel', 'Nivel', 6, 40), puntos = num('tr-puntos', 'Puntos', 18, 999);
    const fila = (txt, input) => el('label', { class: 'tr-fila' }, el('span', {}, txt), input);
    setTesterContext(el('div', { class: 'tr-sim' }, el('small', {}, '🐤 Empezar en nivel'),
      fila('Nivel', nivel), fila('Puntos', puntos),
      el('p', { class: 'muted', style: 'margin:0;font-size:0.8rem' }, 'Cada 20 puntos cambia la hora: 0 día, 20 tarde, 40 noche.'),
      el('button', { type: 'button', class: 'btn btn--cyan btn--sm', id: 'tr-empezar', onClick: () => {
        const n = (inp, lo, hi, d) => Math.max(lo, Math.min(hi, Math.round(Number(inp.value)) || d));
        desde = { level: n(nivel, 1, 40, 1), score: n(puntos, 0, 999, 0) };
        foldTesterRibbon();
        startGame();
      } }, 'Empezar')));
  });
}).catch(() => {});

$('sound-slot').append(soundToggle());
$('lang-slot').append(coverLangToggle());
initSound();
toCover();
requestAnimationFrame(frame);
// For the end-to-end script: the game in play
window.__aletazo = { get g() { return g; }, start: startGame };
