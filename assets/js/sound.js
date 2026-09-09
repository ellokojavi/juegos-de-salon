/**
 * Efectos de sonido sintetizados con Web Audio (sin archivos de audio).
 * - Se desbloquea con el primer toque (requisito de iOS/Android).
 * - Botón de silencio persistente en localStorage (`juegos-de-salon:muted`).
 * Uso: import { SFX, soundToggle, initSound } ... SFX.flip();
 */
import { el } from './ui.js';

const KEY = 'juegos-de-salon:muted';
let ctx = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch (_) { /* nada */ }

export function isMuted() { return muted; }
export function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (_) { /* nada */ }
}

function ensure() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (_) { return null; }
}

/** Llamar una vez al cargar: desbloquea el audio con el primer gesto del usuario. */
export function initSound() {
  const unlock = () => { ensure(); };
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { once: true, passive: true }));
}

/* ---------- primitivas ---------- */
function tone({ freq = 440, to = null, type = 'sine', dur = 0.15, gain = 0.2, delay = 0, attack = 0.005, release = null }) {
  const c = ensure(); if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (release ?? dur));
  osc.connect(g).connect(c.destination);
  osc.start(t0); osc.stop(t0 + (release ?? dur) + 0.05);
}

let noiseBuf = null;
function noise({ dur = 0.25, gain = 0.2, from = 400, to = 2000, q = 1, delay = 0, type = 'bandpass' }) {
  const c = ensure(); if (!c) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource(); src.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0); src.stop(t0 + dur + 0.05);
}

/* ---------- efectos ---------- */
export const SFX = {
  /** Toque de botón: click suave. */
  tap() { tone({ freq: 700, to: 500, type: 'sine', dur: 0.06, gain: 0.08 }); },
  /** Voltear carta: whoosh. */
  flip() { noise({ dur: 0.35, gain: 0.25, from: 300, to: 3000, q: 0.8 }); },
  /** Carta descubierta: pop. */
  reveal() { tone({ freq: 660, to: 1320, type: 'triangle', dur: 0.12, gain: 0.18 }); tone({ freq: 1320, type: 'sine', dur: 0.2, gain: 0.1, delay: 0.1 }); },
  /** Brindis: clink clink de vasos. */
  cheers() {
    [0, 0.14].forEach(d => { tone({ freq: 2093, type: 'triangle', dur: 0.35, gain: 0.12, delay: d, attack: 0.002 }); tone({ freq: 3136, type: 'sine', dur: 0.25, gain: 0.06, delay: d, attack: 0.002 }); });
  },
  /** Tomar: glug glug. */
  drink() { [0, 0.12, 0.24].forEach((d, i) => tone({ freq: 180 - i * 20, to: 120, type: 'sine', dur: 0.1, gain: 0.15, delay: d })); },
  /** Rey 1 a 3: fanfarria corta. */
  king() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.14, gain: 0.07, delay: i * 0.11 })); },
  /** Cuarto rey: fanfarria grande + tambor. */
  fourthKing() {
    [392, 523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.16, gain: 0.08, delay: i * 0.13 }));
    [523, 659, 784, 1047].forEach(f => tone({ freq: f, type: 'triangle', dur: 0.9, gain: 0.07, delay: 0.7, release: 0.9 }));
    [0, 0.25, 0.5].forEach(d => tone({ freq: 90, to: 45, type: 'sine', dur: 0.3, gain: 0.35, delay: d }));
    noise({ dur: 1.2, gain: 0.12, from: 200, to: 6000, q: 0.5, delay: 0.7, type: 'highpass' });
  },
  /** Fin de partida: fanfarria + brillitos. */
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.1, delay: i * 0.1 }));
    [1568, 2093, 2637, 3136].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.3, gain: 0.05, delay: 0.6 + i * 0.08 }));
  },
  /** Tic del temporizador. */
  tick() { tone({ freq: 1000, type: 'square', dur: 0.03, gain: 0.05 }); },
  /** Se acabó el tiempo: bocina. */
  timeUp() { [0, 0.22, 0.44].forEach(d => tone({ freq: 220, to: 200, type: 'sawtooth', dur: 0.18, gain: 0.12, delay: d })); },
  /** Dado / otra opción. */
  dice() { [0, 0.06, 0.13].forEach(d => noise({ dur: 0.05, gain: 0.2, from: 1500, to: 1000, q: 2, delay: d })); },
  /** Pasar el celular: whoosh ascendente. */
  pass() { noise({ dur: 0.45, gain: 0.2, from: 200, to: 4000, q: 0.6 }); tone({ freq: 400, to: 900, type: 'sine', dur: 0.4, gain: 0.05 }); },
  /** Batalla Naval: agua (splash). */
  splash() { noise({ dur: 0.35, gain: 0.22, from: 900, to: 150, q: 0.7, type: 'lowpass' }); tone({ freq: 220, to: 90, type: 'sine', dur: 0.25, gain: 0.12 }); },
  /** Batalla Naval: tocado (explosión corta). */
  hit() { noise({ dur: 0.3, gain: 0.35, from: 3000, to: 300, q: 0.5, type: 'lowpass' }); tone({ freq: 160, to: 50, type: 'square', dur: 0.22, gain: 0.18 }); },
  /** Batalla Naval: hundido (explosión larga con burbujeo). */
  sink() {
    noise({ dur: 0.7, gain: 0.4, from: 2500, to: 120, q: 0.5, type: 'lowpass' });
    tone({ freq: 140, to: 35, type: 'sawtooth', dur: 0.6, gain: 0.16 });
    [0.5, 0.65, 0.8, 0.95].forEach((d, i) => tone({ freq: 500 + i * 120, to: 300, type: 'sine', dur: 0.08, gain: 0.06, delay: d }));
  },
  /** Batalla Naval: flota perdida (sirena). */
  siren() { [0, 0.5, 1.0].forEach(d => tone({ freq: 500, to: 800, type: 'triangle', dur: 0.45, gain: 0.1, delay: d })); },
  /** Error de formulario. */
  error() { tone({ freq: 160, to: 120, type: 'sawtooth', dur: 0.25, gain: 0.12 }); },
};

/** Botón 🔊/🔇 que alterna el silencio. */
export function soundToggle() {
  const btn = el('button', { type: 'button', class: 'sound-toggle', 'aria-pressed': muted ? 'true' : 'false', title: 'Sonido / Sound' }, muted ? '🔇' : '🔊');
  btn.addEventListener('click', () => {
    setMuted(!muted);
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    if (!muted) SFX.reveal();
  });
  return btn;
}
