/**
 * Uno al día's month-end window (the owner's request, 2026-10-30): when a season ends, the player's
 * first visit tells them their final place, before the table (D-424). The podium (1st, 2nd, 3rd) gets a
 * medal, never a cup (that is La Copa's), fireworks and comic rays; everyone else, their place in
 * big. Both thank them for playing and invite them to next month. It is not a splash campaign: it
 * always runs, once per season and phone, in the recap window's slot (recap.js), and its «See the
 * table» opens the season's table window. In the lab behind its flag, asked in recap.js (lab: #seccion-uad-month-end).
 * `?recap=month-end-demo&place=N` shows it with a made-up season. The pure parts are tested by node.
 */

const ROOT = new URL('../../', import.meta.url);

/** The window's words, in the three languages (C-3); `{name}`, `{mes}`, `{sig}`, `{p}`, `{n}`, `{s}`, `{d}`. */
export const TEXTS = {
  es: {
    kicker: 'Uno al día · {mes}',
    title1: '¡Número uno del mes!', title2: '¡Segundo lugar!', title3: '¡Tercer lugar!', titleRest: '¡Terminó el mes!',
    praise1: '{name}, fuiste el número uno de Uno al día en {mes}. {d} días jugando sin aflojar: ese primer lugar es puro trabajo.',
    praise2: '{name}, te llevaste la plata en Uno al día de {mes}. {d} días peleándolo, y se notó.',
    praise3: '{name}, te llevaste el bronce en Uno al día de {mes}. {d} días para subirte al podio a pulso. ¡Bien jugado!',
    place: 'Quedaste en el lugar {p} de {n}, con {s} puntos.',
    pts: '{s} pts',
    thanks: 'Gracias por jugar en Juegos de Salón. 💛',
    invite1: 'Uno al día de {sig} parte de cero: ¿defiendes tu medalla?',
    inviteRest: 'En {sig} todos parten de cero: es tu oportunidad de subir al podio.',
    play: '▶ Jugar {sig}', table: 'Ver la tabla', close: 'Cerrar',
  },
  en: {
    kicker: 'One a Day · {mes}',
    title1: 'Number one of the month!', title2: 'Second place!', title3: 'Third place!', titleRest: 'The month is over!',
    praise1: '{name}, you were number one in One a Day in {mes}. {d} days of play without letting up: that first place was hard earned.',
    praise2: '{name}, you took silver in One a Day in {mes}. {d} days of fighting for it, and it showed.',
    praise3: '{name}, you took bronze in One a Day in {mes}. {d} days to climb onto the podium. Well played!',
    place: 'You finished #{p} of {n}, with {s} points.',
    pts: '{s} pts',
    thanks: 'Thanks for playing Juegos de Salón. 💛',
    invite1: 'One a Day starts from zero in {sig}: will you defend your medal?',
    inviteRest: 'In {sig} everyone starts from zero: your chance to reach the podium.',
    play: '▶ Play {sig}', table: 'See the table', close: 'Close',
  },
  pt: {
    kicker: 'Um por dia · {mes}',
    title1: 'Número um do mês!', title2: 'Segundo lugar!', title3: 'Terceiro lugar!', titleRest: 'O mês terminou!',
    praise1: '{name}, você foi o número um do Um por dia em {mes}. {d} dias jogando sem parar: esse primeiro lugar é puro trabalho.',
    praise2: '{name}, você levou a prata no Um por dia de {mes}. {d} dias de luta, e deu para ver.',
    praise3: '{name}, você levou o bronze no Um por dia de {mes}. {d} dias para subir ao pódio na raça. Muito bem!',
    place: 'Você ficou em {p}º de {n}, com {s} pontos.',
    pts: '{s} pts',
    thanks: 'Obrigado por jogar no Juegos de Salón. 💛',
    invite1: 'O Um por dia de {sig} começa do zero: vai defender sua medalha?',
    inviteRest: 'Em {sig} todos começam do zero: é sua chance de subir ao pódio.',
    play: '▶ Jogar {sig}', table: 'Ver a tabela', close: 'Fechar',
  },
};
const textsOf = lang => TEXTS[lang] || TEXTS.es;
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const monthName = (m, lang) => { try { return new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' }).format(new Date(`${m}-15T12:00:00Z`)); } catch (_) { return m; } };
export const nextMonth = m => { const [y, n] = m.split('-').map(Number); return n === 12 ? `${y + 1}-01` : `${y}-${String(n + 1).padStart(2, '0')}`; };

/**
 * What the window says, or null when the player is not in the season's table (then only the table
 * is shown, as before). `days`: the days of that month this phone played.
 */
export function monthEndView({ month, recap }, lang = 'es', { days = 0 } = {}) {
  const me = recap?.me;
  if (!me) return null;
  const T = textsOf(lang);
  const v = {
    name: me.name, mes: monthName(month, lang), sig: monthName(nextMonth(month), lang),
    p: me.lugar, n: recap.players, s: Number(me.total).toLocaleString(lang), d: days,
  };
  const podium = me.lugar <= 3 ? me.lugar : 0;
  return {
    place: me.lugar, podium,
    kicker: fmt(T.kicker, v),
    title: fmt(podium ? T[`title${podium}`] : T.titleRest, v),
    lines: podium
      ? [fmt(T[`praise${podium}`], v), fmt(T.pts, v), T.thanks, fmt(T.invite1, v)]
      : [fmt(T.place, v), T.thanks, fmt(T.inviteRest, v)],
    play: fmt(T.play, v), table: T.table, close: T.close,
    href: new URL('today/', ROOT).href,
  };
}

/** A medal in SVG; its metal follows the place (CSS `.me-p1` … `.me-p3`). */
function medal(n) {
  return `<svg class="me-medalla" viewBox="0 0 150 190" aria-hidden="true">
    <defs><linearGradient id="me-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--m1)"/><stop offset=".55" stop-color="var(--m2)"/><stop offset="1" stop-color="var(--m3)"/></linearGradient>
    <clipPath id="me-c"><circle cx="75" cy="122" r="52"/></clipPath></defs>
    <path d="M40 0h28l20 70H60z" fill="#ff2e88"/><path d="M82 0h28L90 70H62z" fill="#2ee6d6"/>
    <circle cx="75" cy="122" r="58" fill="var(--m3)"/><circle cx="75" cy="122" r="52" fill="url(#me-g)"/>
    <circle cx="75" cy="122" r="40" fill="none" stroke="var(--m3)" stroke-width="2" stroke-dasharray="3 4" opacity=".6"/>
    <g clip-path="url(#me-c)"><rect class="me-brillo" x="45" y="60" width="22" height="130" fill="#fff" opacity=".45" transform="skewX(-20)"/></g>
    <text x="75" y="140" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="52" fill="var(--m3)">${n}</text>
  </svg>`;
}

/** Fireworks on a canvas: rockets that rise and burst. Returns its stop; nothing under reduced motion. */
function fireworks(cv) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  const ctx = cv.getContext('2d'), dpr = globalThis.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  const cols = ['#ffd23f', '#ff2e88', '#2ee6d6', '#9dff3a', '#ff7a1a', '#ffffff'];
  let parts = [], rockets = [], t = 0, stop = false;
  const burst = (x, y) => {
    const c = cols[Math.random() * cols.length | 0];
    for (let i = 0; i < 70; i++) { const a = Math.PI * 2 * i / 70, s = (2 + Math.random() * 3) * dpr; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c }); }
  };
  (function frame() {
    if (stop || !cv.isConnected) return;
    t++;
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = 'lighter';
    // Ten seconds of rockets, then the last sparks fall
    if (t < 600 && t % 30 === 1) rockets.push({ x: cv.width * (0.15 + Math.random() * 0.7), y: cv.height, vy: -(9 + Math.random() * 4) * dpr, top: cv.height * (0.08 + Math.random() * 0.25) });
    rockets = rockets.filter(r => { r.y += r.vy; ctx.fillStyle = '#fff'; ctx.fillRect(r.x, r.y, 2 * dpr, 6 * dpr); if (r.y <= r.top) { burst(r.x, r.y); return false; } return true; });
    parts = parts.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05 * dpr; p.vx *= 0.98; p.vy *= 0.98; p.life -= 0.012;
      ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2 * dpr, 0, 7); ctx.fill();
      return p.life > 0;
    });
    ctx.globalAlpha = 1;
    if (t < 600 || parts.length || rockets.length) requestAnimationFrame(frame);
  })();
  return () => { stop = true; };
}

/**
 * Opens the window. Resolves with 'table' when the player asked for the table, else with 'close';
 * `onLeave` runs when it closes or its link is followed (that is when the season counts as seen).
 */
export function showMonthEnd(view, { onLeave } = {}) {
  if (document.querySelector('.splash-capa')) return Promise.resolve('close');
  if (!document.getElementById('month-end-css')) {
    document.head.append(Object.assign(document.createElement('link'), { id: 'month-end-css', rel: 'stylesheet', href: new URL('assets/css/month-end.css', ROOT).href }));
  }
  const layer = document.createElement('div');
  layer.className = `splash-capa me-capa${view.podium ? ` me-p${view.podium}` : ' me-resto'}`;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; };
  const card = el('section', 'me-tarjeta');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'me-titulo');
  if (view.podium) card.insertAdjacentHTML('beforeend', medal(view.podium));
  card.append(el('div', 'me-kicker', view.kicker));
  if (!view.podium) card.append(el('div', 'me-lugar', `${view.place}.º`));
  const h = el('h2', 'me-titulo', view.title);
  h.id = 'me-titulo';
  card.append(h);
  for (const [i, l] of view.lines.entries()) card.append(el('p', view.podium && i === 1 ? 'me-pts' : 'me-linea', l));
  const go = el('a', 'btn me-jugar', view.play);
  go.href = view.href;
  const table = el('button', 'me-tabla', view.table);
  table.type = 'button';
  const x = el('button', 'me-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', view.close);
  card.append(go, table, x);
  if (view.podium) layer.append(el('div', 'me-rayos'), el('canvas', 'me-fuegos'));
  layer.append(card);
  document.body.append(layer);
  const stopFire = view.podium ? fireworks(layer.querySelector('canvas')) : () => {};
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  return new Promise(res => {
    const close = how => {
      onLeave?.();
      stopFire();
      document.removeEventListener('keydown', onKey);
      layer.classList.add('sale');
      setTimeout(() => { layer.remove(); document.body.style.overflow = prevOverflow; res(how); }, 180);
    };
    const onKey = e => { if (e.key === 'Escape') close('close'); };
    document.addEventListener('keydown', onKey);
    x.addEventListener('click', () => close('close'));
    table.addEventListener('click', () => close('table'));
    go.addEventListener('click', () => onLeave?.());
  });
}
