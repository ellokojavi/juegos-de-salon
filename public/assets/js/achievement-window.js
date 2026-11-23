/**
 * The window that celebrates an achievement (lab flag `profile`, the owner's request 2026-11-22): drawn
 * like Uno al día's month-end window (month-end.js, its comic card, rays and fireworks), with the
 * achievement's round metal medal, no ribbon, that shows «?», shakes and flips to reveal it over diagonal stripes (the owner's pick, look B of three), its own message, how many
 * secret ones the player has, and «Ver mis logros». It opens after the game that earned it (`celebrate`,
 * asked by stats.js' trackFinish) or on the profile, once per achievement and phone.
 * `/profile/?achievement=demo` shows each one with a picker; nothing is recorded.
 *
 * Every other badge this phone can tell on its own (phone-facts.js `LOCAL_BADGES`) gets the same window right after
 * the game that earned it (the owner, 2026-11-23), its medal shown at once, without the «?» that turns over. The first
 * look (`firstLook`, after a game or on the profile) only notes what the player already had, secret ones too: what was
 * earned before this arrived is never announced.
 */
import { fireworks } from './month-end.js';
import { partyColors } from './party-colors.js';
import { readFacts, dueSecret, announced, markAnnounced } from './secret-achievements.js';

const ROOT = new URL('../../', import.meta.url);

/** The window's words (C-3); each secret achievement's message by its id. */
export const TEXTS = {
  es: {
    kicker: '🤫 Logro secreto desbloqueado', kickerBadge: '🎖️ ¡Nuevo logro!', count: 'Llevas {n} de {total} logros secretos', go: '🎖️ Ver mis logros', later: 'Seguir jugando', close: 'Cerrar',
    // The other badges a game can earn: the profile's name and what it asks (achievement-window.test.mjs keeps them equal)
    badges: { 'streak-10': ["10 seguidos", "Racha de 10 días en Uno al día"], 'streak-30': ["30 seguidos", "Racha de 30 días en Uno al día"], 'streak-100': ["100 seguidos", "Racha de 100 días en Uno al día"], 'month-full': ["Mes completo", "Jugaste todos los días de un mes"], 'early-bird': ["Madrugador", "3 juegos antes de las 7 a. m., 7 mañanas"], 'explorer': ["Explorador", "Jugaste 10 juegos distintos"], 'collector': ["Coleccionista", "Jugaste todos los juegos"], 'plays-100': ["100 partidas", "Terminaste 100 partidas"], 'plays-1000': ["1.000 partidas", "Terminaste 1.000 partidas"], 'obsession': ["Se llama obsesión", "Jugaste un mismo juego 10 veces seguidas"], 'premiere': ["De estreno", "Jugaste un juego nuevo en su semana de estreno"], 'regular': ["De la casa", "Jugaste 100 días distintos"], 'weekends': ["Finde a tope", "Jugaste sábado y domingo, 4 fines de semana"], 'mondays': ["Odio los lunes", "Jugaste antes de las 8 a. m., 4 lunes"] },
    // The names are the profile's (profile/texts.js); achievement-window.test.mjs keeps them equal
    names: { 'night-owl': 'Noctámbulo', 'triple-crown': 'Triple corona', 'one-year': 'Un año', fiestas: 'Dieciochero', halloween: 'Noche de brujas', xmas: 'Viejito Pascuero', 'new-year': 'Año nuevo' },
    msg: {
      'night-owl': 'Tres juegos entre medianoche y las 4. Los búhos te saludan; mañana, café doble.',
      'triple-crown': 'Campeón de copa, campeón del mes y número 1 de un juego. Pocos llegan aquí arriba.',
      'one-year': 'Un año jugando con tu nombre. Gracias por quedarte: esta torta es tuya.',
     
      fiestas: 'Jugaste un 18 de septiembre. ¡Viva Chile! Entre empanada y empanada, un juego.',
      halloween: 'Jugaste un 31 de octubre. ¿Dulce o truco? Un juego, claro.',
      xmas: 'Jugaste en Navidad. Entre regalos y pan de pascua, igual sacaste tiempo para un juego. ¡Jo, jo, jo!',
      'new-year': 'Jugaste el 1 de enero. Año nuevo, las mismas ganas de jugar.',
    },
  },
  en: {
    kicker: '🤫 Secret achievement unlocked', kickerBadge: '🎖️ New achievement!', count: 'You have {n} of {total} secret achievements', go: '🎖️ See my achievements', later: 'Keep playing', close: 'Close',
    // The other badges a game can earn: the profile's name and what it asks (achievement-window.test.mjs keeps them equal)
    badges: { 'streak-10': ["10 in a row", "A 10-day One a Day streak"], 'streak-30': ["30 in a row", "A 30-day One a Day streak"], 'streak-100': ["100 in a row", "A 100-day One a Day streak"], 'month-full': ["Full month", "You played every day of a month"], 'early-bird': ["Early bird", "3 games before 7 a.m., on 7 mornings"], 'explorer': ["Explorer", "You played 10 different games"], 'collector': ["Collector", "You played every game"], 'plays-100': ["100 games", "You finished 100 games"], 'plays-1000': ["1,000 games", "You finished 1,000 games"], 'obsession': ["Called obsession", "You played the same game 10 times in a row"], 'premiere': ["Premiere", "You played a new game in its launch week"], 'regular': ["One of the family", "You played on 100 different days"], 'weekends': ["Weekend warrior", "You played Saturday and Sunday, 4 weekends"], 'mondays': ["I hate Mondays", "You played before 8 a.m., 4 Mondays"] },
    names: { 'night-owl': 'Night owl', 'triple-crown': 'Triple crown', 'one-year': 'One year', fiestas: 'Fiestas Patrias', halloween: 'Halloween', xmas: "Santa's helper", 'new-year': 'New Year' },
    msg: {
      'night-owl': 'Three games between midnight and 4 a.m. The owls salute you; tomorrow, double coffee.',
      'triple-crown': 'Cup champion, month champion and number 1 in a game. Few make it up here.',
      'one-year': 'A year playing with your name. Thanks for staying: this cake is yours.',
     
      fiestas: "You played on September 18. ¡Viva Chile! A game between empanadas.",
      halloween: 'You played on October 31. Trick or treat? A game, of course.',
      xmas: 'You played on Christmas Day. Between presents and cake, you still found time for a game. Ho ho ho!',
      'new-year': 'You played on January 1. New year, same urge to play.',
    },
  },
  pt: {
    kicker: '🤫 Conquista secreta desbloqueada', kickerBadge: '🎖️ Nova conquista!', count: 'Você tem {n} de {total} conquistas secretas', go: '🎖️ Ver minhas conquistas', later: 'Continuar jogando', close: 'Fechar',
    // The other badges a game can earn: the profile's name and what it asks (achievement-window.test.mjs keeps them equal)
    badges: { 'streak-10': ["10 seguidos", "Sequência de 10 dias no Um por dia"], 'streak-30': ["30 seguidos", "Sequência de 30 dias no Um por dia"], 'streak-100': ["100 seguidos", "Sequência de 100 dias no Um por dia"], 'month-full': ["Mês completo", "Você jogou todos os dias de um mês"], 'early-bird': ["Madrugador", "3 jogos antes das 7h, em 7 manhãs"], 'explorer': ["Explorador", "Você jogou 10 jogos diferentes"], 'collector': ["Colecionador", "Você jogou todos os jogos"], 'plays-100': ["100 partidas", "Você terminou 100 partidas"], 'plays-1000': ["1.000 partidas", "Você terminou 1.000 partidas"], 'obsession': ["Se chama obsessão", "Você jogou o mesmo jogo 10 vezes seguidas"], 'premiere': ["De estreia", "Você jogou um jogo novo na semana de estreia"], 'regular': ["De casa", "Você jogou em 100 dias diferentes"], 'weekends': ["Fim de semana top", "Você jogou sábado e domingo, 4 fins de semana"], 'mondays': ["Odeio segundas", "Você jogou antes das 8h, 4 segundas"] },
    names: { 'night-owl': 'Coruja', 'triple-crown': 'Tríplice coroa', 'one-year': 'Um ano', fiestas: 'Fiestas Patrias', halloween: 'Halloween', xmas: 'Papai Noel', 'new-year': 'Ano Novo' },
    msg: {
      'night-owl': 'Três jogos entre meia-noite e 4h. As corujas te saúdam; amanhã, café duplo.',
      'triple-crown': 'Campeão de copa, campeão do mês e número 1 de um jogo. Poucos chegam aqui em cima.',
      'one-year': 'Um ano jogando com seu nome. Obrigado por ficar: este bolo é seu.',
     
      fiestas: 'Você jogou num 18 de setembro. Viva o Chile! Entre uma empanada e outra, um jogo.',
      halloween: 'Você jogou num 31 de outubro. Doces ou travessuras? Um jogo, claro.',
      xmas: 'Você jogou no Natal. Entre presentes e panetone, ainda achou tempo para um jogo. Ho ho ho!',
      'new-year': 'Você jogou no dia 1º de janeiro. Ano novo, a mesma vontade de jogar.',
    },
  },
};
/** Every secret achievement's metal and emoji (the badges' catalogue, badges.js, says the same). */
export const SECRETS = {
  'night-owl': { tier: 'silver', icon: '🦉' }, 'triple-crown': { tier: 'gold', icon: '💎' }, 'one-year': { tier: 'gold', icon: '🎂' },
  fiestas: { tier: 'bronze', icon: '🪁' }, halloween: { tier: 'bronze', icon: '🎃' }, xmas: { tier: 'bronze', icon: '🎅' }, 'new-year': { tier: 'bronze', icon: '🎆' },
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const METAL = { gold: 1, silver: 2, bronze: 3 };

/** The achievement's medal in SVG: the month-end's round metal with its emoji on the face, no ribbon (the owner, 2026-11-22). */
function medal(face) {
  return `<svg class="aw-medalla" viewBox="0 0 120 120" aria-hidden="true">
    <defs><linearGradient id="aw-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--m1)"/><stop offset=".55" stop-color="var(--m2)"/><stop offset="1" stop-color="var(--m3)"/></linearGradient>
    <clipPath id="aw-c"><circle cx="60" cy="60" r="52"/></clipPath></defs>
    <g class="aw-cara">
      <circle cx="60" cy="60" r="58" fill="var(--m3)"/><circle cx="60" cy="60" r="52" fill="url(#aw-g)"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="var(--m3)" stroke-width="2" stroke-dasharray="3 4" opacity=".6"/>
      <text class="aw-emoji" x="60" y="77" text-anchor="middle" font-size="50">${face}</text>
      <g clip-path="url(#aw-c)"><rect class="me-brillo" x="30" y="-2" width="22" height="130" fill="#fff" opacity=".45" transform="skewX(-20)"/></g>
      <g class="aw-dorso"><circle cx="60" cy="60" r="58" fill="#2a0a4a"/><circle cx="60" cy="60" r="50" fill="#3d1466" stroke="#ff2e88" stroke-width="3" stroke-dasharray="6 5"/><text x="60" y="80" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="60" fill="#ffd23f">?</text></g>
    </g>
  </svg>`;
}

/**
 * Confetti bursting out of the medal as it turns over (the owner, 2026-11-22: confetti for the reveal, then the
 * fireworks behind): pieces thrown up and out from `x, y`, falling over the card for about two and a half seconds.
 */
function confettiBurst(cv, x, y) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  const ctx = cv.getContext('2d'), dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const cols = partyColors();
  const parts = Array.from({ length: 140 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, v = 6 + Math.random() * 9;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5, c: cols[Math.random() * cols.length | 0] };
  });
  let stop = false;
  const t0 = performance.now();
  (function frame(t) {
    if (stop || !cv.isConnected) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const left = 1 - Math.max(0, (t - t0 - 1800) / 800);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.vx *= 0.985; p.r += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(left, 0); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (left > 0) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
  return () => { stop = true; };
}

/**
 * Opens the window for `badge` (`{ id, tier, icon, name, text? }`). `secret`: `{ n, total }` for a secret one, or
 * null for any other badge: its medal shows at once, its line is `text`, no count. Resolves with 'go' or 'close'.
 * `profileHref`: where «Ver mis logros» goes.
 */
export function showAchievement(badge, { lang = 'es', secret = { n: 1, total: 8 }, profileHref = new URL('profile/#badges', ROOT).href, extra = null } = {}) {
  if (document.querySelector('.splash-capa')) return Promise.resolve('close');
  for (const [id, url] of [['month-end-css', new URL('assets/css/month-end.css', ROOT)], ['achievement-css', new URL('assets/css/achievement-window.css', ROOT)]]) {
    if (!document.getElementById(id)) document.head.append(Object.assign(document.createElement('link'), { id, rel: 'stylesheet', href: url.href }));
  }
  const T = TEXTS[lang] || TEXTS.es;
  const layer = document.createElement('div');
  layer.className = `splash-capa me-capa me-p${METAL[badge.tier] || 1} aw-capa${secret ? '' : ' aw-abierta'}`;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; };
  const card = el('section', 'me-tarjeta aw-tarjeta');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'aw-titulo');
  card.insertAdjacentHTML('beforeend', medal(badge.icon));
  card.append(el('div', 'me-kicker', secret ? T.kicker : T.kickerBadge));
  const h = el('h2', 'me-titulo aw-titulo', badge.name);
  h.id = 'aw-titulo';
  card.append(h, el('p', 'me-linea', T.msg[badge.id] || badge.text || ''));
  let count = null;
  if (secret) {
    count = el('div', 'aw-cuenta', fmt(T.count, secret));
    const dots = el('div', 'aw-puntos');
    for (let i = 0; i < secret.total; i++) dots.append(el('i', i < secret.n ? (i === secret.n - 1 ? 'on nuevo' : 'on') : ''));
    count.append(dots);
  }
  const go = el('a', 'btn btn--yellow me-jugar', T.go);
  go.href = profileHref;
  const later = el('button', 'me-tabla', T.later);
  later.type = 'button';
  const x = el('button', 'me-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', T.close);
  card.append(...[count, go, later, x].filter(Boolean));
  layer.append(el('div', 'aw-franjas'), el('canvas', 'me-fuegos'));
  layer.append(card, el('canvas', 'aw-confeti'));
  if (extra) layer.append(extra);
  document.body.append(layer);
  // The medal turns over at 1.55 s: confetti bursts out of it then, and the fireworks follow behind the card.
  // A badge that is not secret has nothing to turn over: its confetti comes as the card lands.
  const at = secret ? 1550 : 600;
  let stopFire = () => {}, stopConfetti = () => {};
  const t = setTimeout(() => {
    const m = card.querySelector('.aw-medalla')?.getBoundingClientRect();
    if (m) stopConfetti = confettiBurst(layer.querySelector('.aw-confeti'), m.left + m.width / 2, m.top + m.height / 2);
  }, at);
  const t2 = setTimeout(() => { stopFire = fireworks(layer.querySelector('.me-fuegos')); }, at + 750);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  return new Promise(res => {
    const close = how => {
      clearTimeout(t); clearTimeout(t2); stopFire(); stopConfetti();
      document.removeEventListener('keydown', onKey);
      layer.classList.add('sale');
      setTimeout(() => { layer.remove(); document.body.style.overflow = prevOverflow; res(how); }, 180);
    };
    const onKey = e => { if (e.key === 'Escape') close('close'); };
    document.addEventListener('keydown', onKey);
    x.addEventListener('click', () => close('close'));
    later.addEventListener('click', () => close('close'));
    go.addEventListener('click', () => res('go'));
  });
}

/** The badges already celebrated or shown as new on the profile, on this phone; and whether the first look was taken. */
const BASE_KEY = 'juegos-de-salon:logros-base';
const SEEN_PREFIX = 'juegos-de-salon:profile-badges:';
function seenOnProfile(storage) {
  const out = {};
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith(SEEN_PREFIX)) Object.assign(out, JSON.parse(storage.getItem(k) || '{}') || {});
    }
  } catch (_) { /* nothing kept */ }
  return out;
}

/**
 * The first look on this phone (the owner, 2026-11-23: what was already earned when this arrives is never
 * announced): every badge `list` says is earned, secret or not, is noted as told without a window. True when it
 * was the first look. `list` is badges.js `earned(facts).list`, with every fact this place knows.
 */
export function firstLook(list = [], storage = globalThis.localStorage) {
  try { if (storage?.getItem(BASE_KEY)) return false; } catch (_) { return false; }
  for (const b of list) if (b.got) markAnnounced(b.id, storage);
  try { storage?.setItem(BASE_KEY, String(Date.now())); } catch (_) { /* not kept */ }
  return true;
}

/**
 * The first badge this phone can tell alone (`local`), earned and neither celebrated (`done`) nor shown on the
 * profile (`seen`), or null. `list` is badges.js `earned(facts).list`. Pure.
 */
export function dueBadge(list = [], local = new Set(), done = {}, seen = {}) {
  return list.find(b => !b.secret && local.has(b.id) && b.got && !done[b.id] && !seen[b.id]) || null;
}

/**
 * After a game (stats.js' trackFinish, lab flag profile): the first local secret achievement earned and not yet
 * celebrated on this phone opens its window, once. `wait`: a moment for the result screen to draw first.
 */
export async function celebrate({ lang = 'es', wait = 1200, storage = globalThis.localStorage } = {}) {
  const [{ earned }, { phoneFacts }] = await Promise.all([import('./badges.js'), import('./phone-facts.js')]);
  const list = earned(phoneFacts(storage), {}).list;
  if (firstLook(list, storage)) return null;
  const id = dueSecret(readFacts(storage), announced(storage));
  if (!id) return celebrateBadge({ lang, wait, storage, list });
  await new Promise(r => setTimeout(r, wait));
  if (document.querySelector('.splash-capa')) return null;
  markAnnounced(id, storage);
  const T = TEXTS[lang] || TEXTS.es;
  const done = announced(storage);
  showAchievement({ id, ...SECRETS[id], name: T.names[id] }, { lang, secret: { n: Object.keys(SECRETS).filter(k => done[k]).length, total: Object.keys(SECRETS).length } });
  return id;
}

/** After a game, when no secret one is due: the first badge this phone just earned opens its window, once. */
async function celebrateBadge({ lang, wait, storage, list }) {
  const { LOCAL_BADGES } = await import('./phone-facts.js');
  const b = dueBadge(list, LOCAL_BADGES, announced(storage), seenOnProfile(storage));
  if (!b) return null;
  await new Promise(r => setTimeout(r, wait));
  if (document.querySelector('.splash-capa')) return null;
  markAnnounced(b.id, storage);
  const [name, text] = (TEXTS[lang] || TEXTS.es).badges[b.id] || [b.id, ''];
  showAchievement({ id: b.id, tier: b.tier, icon: b.icon, name, text }, { lang, secret: null });
  return b.id;
}
