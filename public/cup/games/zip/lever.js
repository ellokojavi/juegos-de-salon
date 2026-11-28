/**
 * 〰️ Zip — the Normal / Hard lever (lab: #seccion-zip-hard). The standard lever of the lab's hard
 * modes (Pintaminas', Sudoku's, Croc's), by the owner's request: down with a green knob is Normal,
 * up with a red knob is Hard. Flipping it calls `cambiar`, which redraws the waiting room: the new
 * lever starts where the old one was and swings over, with a ring of electricity, a flash and sparks.
 * All classes start with `zl-`; ui.js loads `style.css` next to it.
 */
const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const espera = ms => new Promise(r => setTimeout(r, ms));
async function enLaPagina(n) {
  for (let k = 0; k < 40 && !n.isConnected; k++) await espera(25);
  return n.isConnected;
}

let desde = null;
let parpadeoVez = 0;
export function selector({ el, T, SFX, vibrate, variante, cambiar }) {
  const dificil = variante === 'hard';
  const animar = desde !== null && desde !== dificil && !QUIETO();
  desde = null;
  const modo = v => T.zipModo?.[v] || { titulo: v, sub: '' };
  const titulo = el('b', {}), sub = el('span', { class: 'muted' });
  const plate = el('span', { class: 'zl-plate', 'aria-hidden': 'true' },
    el('span', { class: 'zl-track', html: '<svg viewBox="0 0 70 60"><path class="zl-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'zl-bolt b1' }, '⚡'), el('span', { class: 'zl-bolt b2' }, '⚡'), el('span', { class: 'zl-bolt b3' }, '⚡'),
    el('span', { class: 'zl-arm' }, el('span', { class: 'zl-knob' })), el('span', { class: 'zl-axle' }));
  const caja = el('button', {
    type: 'button', class: 'zl-lever', id: 'btn-level', role: 'switch', 'aria-label': modo('hard').titulo,
    onClick: () => {
      desde = dificil;
      if (!dificil) { relampago(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      cambiar(dificil ? 'normal' : 'hard');
    },
  }, plate, el('span', { class: 'zl-label' }, titulo, sub));
  const poner = on => {
    caja.classList.toggle('on', on);
    caja.setAttribute('aria-checked', String(on));
    const m = modo(on ? 'hard' : 'normal');
    titulo.textContent = m.titulo; sub.textContent = m.sub;
  };
  poner(dificil);
  if (animar) {
    caja.classList.toggle('on', !dificil);
    (async () => {
      if (!await enLaPagina(caja)) return;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      caja.classList.toggle('on', dificil);
      const w = el('span', { class: 'zl-wave' + (dificil ? ' hard' : ''), 'aria-hidden': 'true' });
      plate.append(w);
      setTimeout(() => w.remove(), 900);
      caja.classList.remove('zap'); void caja.offsetWidth; caja.classList.add('zap');
    })();
  }
  if (dificil) parpadear(caja);
  return caja;
}

/** The flash over the whole view when switching to Hard. */
function relampago() {
  if (QUIETO()) return;
  const x = document.createElement('div');
  x.className = 'zl-flash';
  x.setAttribute('aria-hidden', 'true');
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}

/** While Hard is on, the lever's glow flickers like a bad contact. */
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
