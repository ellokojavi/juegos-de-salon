/**
 * The «you've been challenged» screen of Duels (lab flag rivals, the owner, 2026-11-25): once per new
 * duel someone else started, the first time this phone sees it open with no round of mine played, the
 * screen splits into my colour and the rival's, a «VS» stamps down and a sword cuts it in two along the
 * diagonal, with a wind-cut swish (it follows the 🔊 switch). «Aceptar el duelo» goes to my first round.
 * The profile's «Avisos de duelos» switch turns it off; with reduced motion it shows without moving.
 */
import { estado } from './duels.js';
import { isMuted } from './sound.js';

const SEEN = 'juegos-de-salon:duels-challenged';
const OFF = 'juegos-de-salon:duel-alerts';
const ROOT = new URL('../../', import.meta.url);

export function alertsOn(store = globalThis.localStorage) {
  try { return store.getItem(OFF) !== 'off'; } catch (_) { return true; }
}
export function setAlerts(on, store = globalThis.localStorage) {
  try { on ? store.removeItem(OFF) : store.setItem(OFF, 'off'); } catch (_) { /* no storage: stays on */ }
}
const readSeen = store => { try { const v = JSON.parse(store.getItem(SEEN) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } };

/**
 * The duel to announce, or null: started by someone else (I am `b`), still open, none of my rounds
 * played yet and not announced on this phone. The newest first. Pure.
 */
export function dueChallenge(lista = [], me, seen = {}, t = Date.now()) {
  return lista
    .filter(d => d && d.b === me && d.a !== me && !seen[d.id])
    .filter(d => { const e = estado(d, me, t); return !e.termino && e.mias.every(x => !x); })
    .sort((x, y) => (y.at || 0) - (x.at || 0))[0] || null;
}

/** The wind-cut swish: a long airy sweep up, then a soft tail down (Web Audio, no file). */
function swish(at) {
  if (isMuted()) return;
  try {
    const ac = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    const sweep = (t, d, f0, f1, g, q) => {
      const n = Math.ceil(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), x = buf.getChannelData(0);
      for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
      const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(g, t + d * 0.55); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f).connect(v).connect(ac.destination); src.start(t);
    };
    const t = ac.currentTime + at;
    sweep(t - 0.25, 0.45, 300, 4000, 0.6, 1);
    sweep(t + 0.05, 0.6, 3000, 600, 0.15, 0.7);
    setTimeout(() => ac.close().catch(() => {}), (at + 1.5) * 1000);
  } catch (_) { /* no audio: the screen still plays */ }
}

/**
 * Draws the screen for duel `d` (me: { jid, n }); `T` the duels' texts, `info` its line (game and
 * format), `href` my first round. Returns the layer.
 */
export function showChallenge(d, me, { T, info = '', href = '#' } = {}) {
  if (!document.getElementById('duel-challenge-css')) document.head.append(Object.assign(document.createElement('link'), { id: 'duel-challenge-css', rel: 'stylesheet', href: new URL('assets/css/duel-challenge.css', ROOT).href }));
  const e = estado(d, me.jid);
  const mk = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const ini = s => (String(s || '?').trim()[0] || '?').toUpperCase();
  const layer = mk('div', 'dc-capa');
  layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', T.challengeLabel.replace('{n}', e.rivalN));
  const player = (cls, name) => { const p = mk('div', `dc-jugador ${cls}`); p.append(mk('div', 'dc-av', ini(name)), mk('div', 'dc-nombre', name)); return p; };
  const vs = mk('div', 'dc-vs'); vs.setAttribute('aria-hidden', 'true');
  vs.append(mk('span', 'dc-vs-a', 'VS'), mk('span', 'dc-vs-b', 'VS'));
  const sword = mk('div', 'dc-espada'); sword.setAttribute('aria-hidden', 'true');
  sword.innerHTML = '<svg viewBox="0 0 170 22"><rect x="0" y="8" width="26" height="6" rx="3" fill="#7a3b12"/><rect x="24" y="1" width="8" height="20" rx="3" fill="#ffd23f"/><path d="M32 6 L160 8 L170 11 L160 14 L32 16 Z" fill="#e6f2ff" stroke="#150726" stroke-width="1.5"/></svg>';
  const go = mk('a', 'btn btn--yellow dc-aceptar', T.challengeAccept); go.href = href;
  const later = mk('button', 'dc-despues', T.challengeLater); later.type = 'button';
  const pie = mk('div', 'dc-pie'); pie.append(mk('p', 'dc-info', info), go, later);
  // The title in the home page's colours: the same shimmering rainbow as «Juegos de Salón» (.rainbow, base.css)
  const kicker = mk('p', 'dc-kicker'); kicker.append(mk('span', 'rainbow', T.challengeKicker));
  const escena = mk('div', 'dc-escena');
  escena.append(mk('div', 'dc-mitad dc-mitad-a'), mk('div', 'dc-mitad dc-mitad-b'), mk('div', 'dc-lineas'),
    kicker, player('dc-yo', me.n), player('dc-rival', e.rivalN), vs, mk('div', 'dc-corte'), sword, pie, mk('div', 'dc-flash'));
  layer.append(escena);
  const close = () => { layer.remove(); document.removeEventListener('keydown', esc); };
  const esc = ev => { if (ev.key === 'Escape') close(); };
  later.addEventListener('click', close);
  document.addEventListener('keydown', esc);
  document.body.append(layer);
  requestAnimationFrame(() => layer.classList.add('dc-run'));
  if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) swish(0.95);
  setTimeout(() => go.focus({ preventScroll: true }), 1500);
  return layer;
}

/** Shows the newest unannounced challenge, if alerts are on, and remembers it; returns the duel or null. */
export function maybeChallenge(lista, me, opts = {}, store = globalThis.localStorage) {
  if (!me?.jid || !alertsOn(store) || document.querySelector('.dc-capa')) return null;
  const seen = readSeen(store);
  const d = dueChallenge(lista, me.jid, seen);
  if (!d) return null;
  seen[d.id] = Date.now();
  try { store.setItem(SEEN, JSON.stringify(seen)); } catch (_) { /* shown once more next time */ }
  showChallenge(d, me, typeof opts === 'function' ? opts(d) : opts);
  return d;
}
