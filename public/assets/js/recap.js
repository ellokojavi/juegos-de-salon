/**
 * The recap window (D-423): when a cup of La Copa this phone played has ended, or a season of Uno
 * al día (D-424, daily-recap.js), the next visit to the home page tells how it ended: the final table, how each place moved day by day (a small line
 * per row), the player's own row marked, a link to the cup and a ✕. It takes the splash's place on
 * that visit (splash.css draws both), so the home page never stacks two windows; the splash comes
 * on the next one.
 *
 * In the lab (D-395, D-409): it opens only for a lab key holder until the owner validates it.
 * `?recap=demo` shows it with La Copa's podium demo and `?recap=season-demo` with a made-up season,
 * without recording anything. `?recap=season` is the link of the notification that a season ended
 * (tools/push/daily.mjs): it opens last month's season for whoever taps it.
 *
 * Which cup is due is read here, from localStorage, with no network and nothing of La Copa's
 * loaded. Only when one is due does the home page open /cup/recap/, a page of La Copa's with no
 * screen, in a hidden frame: it reads the cup and builds its table with the cup's engine
 * (cup/recap.js) and posts it back. So the home page never loads the engine, and a change to the
 * engine does not run the home page's scripts (D-377, D-378). The pure parts are tested by node.
 */
import { param, tiene } from './parametros.js';

const ROOT = new URL('../../', import.meta.url);

/**
 * The window's words, in the four languages (C-3). They live here, not in i18n.js, like the
 * splash's: every page loads i18n.js, and only the home page this window. The cup's sentence is the
 * `fin` notification's (cup/rules.js), so both say the same.
 */
export const TEXTS = {
  es: { cupKicker: 'La Copa terminó', win: '🥇 ¡Ganaste la copa!', winTie: '🥇 ¡Ganaste la copa junto con {names}!', end: '🥇 Ganó {name}. Quedaste {pos}.', endMany: '🥇 Ganaron {names}. Quedaste {pos}.', ord: '{n}º', colPlace: '#', colName: 'Jugador', colDays: 'Día a día', colPts: 'Pts', up: 'Subió {n}', down: 'Bajó {n}', same: 'Igual', seeCup: '🏆 Ver la copa', colWeeks: 'Por semana', seasonKicker: 'Terminó la temporada', seasonTitle: 'Uno al día: {mes}', seasonWin: '🥇 ¡Ganaste la temporada, con {s} pts!', seasonWinTie: '🥇 ¡Ganaste la temporada junto con {names}, con {s} pts!', seasonEnd: 'Quedaste #{p} de {n}, con {s} pts. Ganó {name}.', seasonEndMany: 'Quedaste #{p} de {n}, con {s} pts. Ganaron {names}.', seasonNone: '🥇 Ganó {name}, con {s} pts.', seasonNew: 'La temporada de {mes} ya empezó: todos parten de 0.', seeDaily: '📅 Ir a Uno al día', close: 'Cerrar' },
  en: { cupKicker: 'The Cup is over', win: '🥇 You won the cup!', winTie: '🥇 You won the cup, tied with {names}!', end: '🥇 {name} won. You finished {pos}.', endMany: '🥇 {names} won. You finished {pos}.', ord: '#{n}', colPlace: '#', colName: 'Player', colDays: 'Day by day', colPts: 'Pts', up: 'Up {n}', down: 'Down {n}', same: 'Same', seeCup: '🏆 See the cup', colWeeks: 'Weekly', seasonKicker: 'The season is over', seasonTitle: 'One a Day: {mes}', seasonWin: '🥇 You won the season, with {s} pts!', seasonWinTie: '🥇 You won the season, tied with {names}, with {s} pts!', seasonEnd: 'You finished #{p} of {n}, with {s} pts. {name} won.', seasonEndMany: 'You finished #{p} of {n}, with {s} pts. {names} won.', seasonNone: '🥇 {name} won, with {s} pts.', seasonNew: "{mes}'s season has begun: everyone starts at 0.", seeDaily: '📅 Go to One a Day', close: 'Close' },
  pt: { cupKicker: 'A Copa terminou', win: '🥇 Você ganhou a copa!', winTie: '🥇 Você ganhou a copa junto com {names}!', end: '🥇 {name} ganhou. Você ficou em {pos}.', endMany: '🥇 {names} ganharam. Você ficou em {pos}.', ord: '{n}º', colPlace: '#', colName: 'Jogador', colDays: 'Dia a dia', colPts: 'Pts', up: 'Subiu {n}', down: 'Caiu {n}', same: 'Igual', seeCup: '🏆 Ver a copa', colWeeks: 'Por semana', seasonKicker: 'A temporada terminou', seasonTitle: 'Um por dia: {mes}', seasonWin: '🥇 Você ganhou a temporada, com {s} pts!', seasonWinTie: '🥇 Você ganhou a temporada junto com {names}, com {s} pts!', seasonEnd: 'Você ficou em #{p} de {n}, com {s} pts. {name} ganhou.', seasonEndMany: 'Você ficou em #{p} de {n}, com {s} pts. {names} ganharam.', seasonNone: '🥇 {name} ganhou, com {s} pts.', seasonNew: 'A temporada de {mes} já começou: todos partem do 0.', seeDaily: '📅 Ir ao Um por dia', close: 'Fechar' },
  de: { cupKicker: 'Der Pokal ist vorbei', win: '🥇 Du hast den Pokal gewonnen!', winTie: '🥇 Du hast den Pokal gewonnen, punktgleich mit {names}!', end: '🥇 {name} hat gewonnen. Du bist auf Platz {pos} gelandet.', endMany: '🥇 {names} haben gewonnen. Du bist auf Platz {pos} gelandet.', ord: '{n}', colPlace: '#', colName: 'Spieler', colDays: 'Tag für Tag', colPts: 'Pkt.', up: '{n} hoch', down: '{n} runter', same: 'Gleich', seeCup: '🏆 Zum Pokal', colWeeks: 'Pro Woche', seasonKicker: 'Die Saison ist vorbei', seasonTitle: 'Spiel des Tages: {mes}', seasonWin: '🥇 Du hast die Saison gewonnen, mit {s} Pkt.!', seasonWinTie: '🥇 Du hast die Saison gewonnen, punktgleich mit {names}, mit {s} Pkt.!', seasonEnd: 'Du bist auf Platz {p} von {n} gelandet, mit {s} Pkt. Gewonnen hat {name}.', seasonEndMany: 'Du bist auf Platz {p} von {n} gelandet, mit {s} Pkt. Gewonnen haben {names}.', seasonNone: '🥇 Gewonnen hat {name}, mit {s} Pkt.', seasonNew: 'Die Saison im {mes} hat begonnen: Alle starten bei 0.', seeDaily: '📅 Zum Spiel des Tages', close: 'Schließen' },
};
const textsOf = lang => TEXTS[lang] || TEXTS.es;

/** The cups this phone played, as cup/cuenta.js remembers them: `[{ code, nombre, copa, fin }]`. */
export const MINE_KEY = 'juegos-de-salon:copa:mias';
/** The cups whose recap this phone already saw, by code. */
export const SEEN_KEY = 'juegos-de-salon:copa:resumen-visto';
/** A cup is told only this long after it ended: whoever comes back a month later is not. */
export const RECAP_MS = 7 * 24 * 60 * 60 * 1000;

const storage = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
const readList = key => { try { const v = JSON.parse(storage()?.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
export const minePlayed = () => readList(MINE_KEY);
export const seenCups = () => readList(SEEN_KEY);
export function markCupSeen(code) {
  try { storage()?.setItem(SEEN_KEY, JSON.stringify([code, ...seenCups().filter(c => c !== code)].slice(0, 50))); } catch (_) { /* no storage */ }
}

/**
 * The cup whose recap is due: ended (by its planned end), less than a week ago, not seen yet; the
 * most recent one. `mine` is what MINE_KEY holds.
 */
export function dueCup({ mine = minePlayed(), seen = seenCups(), now = Date.now() } = {}) {
  const due = mine.filter(c => c?.code && Number.isFinite(c.fin) && c.fin <= now && now - c.fin <= RECAP_MS && !seen.includes(c.code));
  due.sort((a, b) => b.fin - a.fin);
  return due[0] || null;
}
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const listOf = (names, lang) => { try { return new Intl.ListFormat(lang, { type: 'conjunction' }).format(names); } catch (_) { return names.join(', '); } };

/**
 * The places of a row as the points of its line, in a w×h box: 1st at the top, the last place at
 * the bottom. A place that is null (no points yet, D-424) has no point, and the line starts later.
 */
export function sparkPoints(lugares, n, { w = 56, h = 20, pad = 3 } = {}) {
  const k = lugares.length;
  const x = i => (k <= 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (k - 1));
  const y = l => (n <= 1 ? h / 2 : pad + ((l - 1) * (h - 2 * pad)) / (n - 1));
  return lugares.map((l, i) => (l == null ? null : [Math.round(x(i) * 10) / 10, Math.round(y(l) * 10) / 10]));
}

/** The lead: who won and where this player finished, as La Copa's notification says it. */
export function cupLead(recap, lang) {
  const R = textsOf(lang);
  const others = recap.winners.filter(r => !r.mine).map(r => r.name);
  const pos = fmt(R.ord, { n: recap.me.lugar });
  if (recap.me.lugar === 1) return others.length ? fmt(R.winTie, { names: listOf(others, lang) }) : R.win;
  return recap.winners.length > 1
    ? fmt(R.endMany, { names: listOf(recap.winners.map(r => r.name), lang), pos })
    : fmt(R.end, { name: recap.winners[0].name, pos });
}

let cssDone = false;
function loadStyles() {
  if (cssDone) return;
  cssDone = true;
  for (const [id, url] of [['splash-css', new URL('assets/css/splash.css', ROOT)], ['recap-css', new URL('assets/css/recap.css', ROOT)]]) {
    if (document.getElementById(id)) continue;
    document.head.append(Object.assign(document.createElement('link'), { id, rel: 'stylesheet', href: url.href }));
  }
}

const node = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const SVG = 'http://www.w3.org/2000/svg';
const svgNode = (tag, attrs) => { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

function spark(lugares, n) {
  const W = 56, H = 20;
  const s = svgNode('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'recap-linea', 'aria-hidden': 'true' });
  const pts = sparkPoints(lugares, n, { w: W, h: H }).filter(Boolean);
  if (pts.length > 1) s.append(svgNode('polyline', { points: pts.map(p => p.join(',')).join(' ') }));
  const last = pts[pts.length - 1];
  if (last) s.append(svgNode('circle', { cx: last[0], cy: last[1], r: 2.6 }));
  return s;
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

/**
 * Opens the window. `view`: `{ emoji, kicker, title, lead, rows, link: { label, href }, cols?, scale?, note? }`,
 * each row `{ lugar, name, total, lugares, delta, mine, fuera }`; `cols` names the line's column
 * (day by day, or week by week), `scale` is the last place a line can reach, `note` a line under the table. Resolves when it closes; `onLeave`
 * runs when the player closes it or follows its link (that is when it counts as seen).
 */
export function showRecap(view, { lang = 'es', onLeave } = {}) {
  if (document.querySelector('.splash-capa')) return Promise.resolve();
  loadStyles();
  const R = textsOf(lang);
  const layer = node('div', 'splash-capa recap-capa');
  const backdrop = node('div', 'splash-fondo');
  const card = node('section', 'splash recap');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'recap-titulo');

  const x = node('button', 'splash-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', R.close);

  const head = node('header', 'splash-cabeza');
  head.append(node('div', 'splash-emoji', view.emoji));
  head.append(node('p', 'splash-kicker', view.kicker));
  const h = node('h2', 'splash-titulo recap-titulo', view.title);
  h.id = 'recap-titulo';
  head.append(h, node('p', 'splash-lead recap-lead', view.lead));

  const n = view.scale || view.rows.length;
  const table = node('table', 'recap-tabla');
  const thead = node('thead');
  const hr = node('tr');
  for (const [cls, t] of [['recap-lugar', R.colPlace], ['recap-nombre', R.colName], ['recap-dias', view.cols || R.colDays], ['recap-pts', R.colPts]]) hr.append(node('th', cls, t));
  thead.append(hr);
  const tbody = node('tbody');
  for (const r of view.rows) {
    const tr = node('tr', [r.mine && 'mia', r.fuera && 'fuera'].filter(Boolean).join(' ') || null);
    tr.append(node('td', 'recap-lugar', MEDALS[r.lugar] || String(r.lugar)));
    tr.append(node('td', 'recap-nombre', r.name));
    const dias = node('td', 'recap-dias');
    dias.append(spark(r.lugares, n));
    const d = node('span', `recap-delta ${r.delta > 0 ? 'sube' : r.delta < 0 ? 'baja' : 'igual'}`, r.delta > 0 ? `▲${r.delta}` : r.delta < 0 ? `▼${-r.delta}` : '=');
    d.setAttribute('aria-label', r.delta > 0 ? fmt(R.up, { n: r.delta }) : r.delta < 0 ? fmt(R.down, { n: -r.delta }) : R.same);
    dias.append(d);
    tr.append(dias, node('td', 'recap-pts', Number(r.total).toLocaleString(lang)));
    tbody.append(tr);
  }
  table.append(thead, tbody);
  const wrap = node('div', 'recap-tabla-caja');
  wrap.append(table);

  const go = node('a', 'btn btn--yellow recap-ir', view.link.label);
  go.href = view.link.href;
  const later = node('button', 'splash-luego', R.close);
  later.type = 'button';

  card.append(x, head, wrap);
  if (view.note) card.append(node('p', 'recap-nota', view.note));
  card.append(go, later);
  layer.append(backdrop, card);
  document.body.append(layer);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const before = document.activeElement;
  card.tabIndex = -1;
  card.focus({ preventScroll: true });

  return new Promise(res => {
    const close = () => {
      onLeave?.();
      document.removeEventListener('keydown', onKey);
      layer.classList.add('sale');
      setTimeout(() => { layer.remove(); document.body.style.overflow = prevOverflow; before?.focus?.({ preventScroll: true }); }, 180);
      res();
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    for (const b of [x, later, backdrop]) b.addEventListener('click', close);
    go.addEventListener('click', () => onLeave?.());
  });
}

/** La Copa's recap as the window draws it. */
export function cupView({ code, alias, path, recap }, lang) {
  const R = textsOf(lang);
  return {
    emoji: '🏆', kicker: R.cupKicker, title: recap.name, lead: cupLead(recap, lang), rows: recap.rows,
    link: { label: R.seeCup, href: new URL(path || `cup/?${alias || code}`, ROOT).href },
  };
}

/** The month's name in the player's language: `octubre`, `October`. */
const monthName = (m, lang) => { try { return new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' }).format(new Date(`${m}-15T12:00:00Z`)); } catch (_) { return m; } };
const nextMonth = m => { const [y, n] = m.split('-').map(Number); return n === 12 ? `${y + 1}-01` : `${y}-${String(n + 1).padStart(2, '0')}`; };

/** The lead of a season: who won and, for a player in the table, their place and points. */
export function seasonLead(recap, lang) {
  const R = textsOf(lang);
  const pts = x => Number(x).toLocaleString(lang);
  const winners = recap.winners;
  const me = recap.me;
  if (!me) return fmt(R.seasonNone, { name: listOf(winners.map(r => r.name), lang), s: pts(winners[0].total) });
  const others = winners.filter(r => !r.mine).map(r => r.name);
  if (me.lugar === 1) return others.length ? fmt(R.seasonWinTie, { names: listOf(others, lang), s: pts(me.total) }) : fmt(R.seasonWin, { s: pts(me.total) });
  const v = { p: me.lugar, n: recap.players, s: pts(me.total) };
  return winners.length > 1 ? fmt(R.seasonEndMany, { ...v, names: listOf(winners.map(r => r.name), lang) }) : fmt(R.seasonEnd, { ...v, name: winners[0].name });
}

/** Uno al día's season as the window draws it (D-424). */
export function seasonView({ month, recap }, lang) {
  const R = textsOf(lang);
  return {
    emoji: '📅', kicker: R.seasonKicker, title: fmt(R.seasonTitle, { mes: monthName(month, lang) }), lead: seasonLead(recap, lang),
    rows: recap.rows, scale: recap.players, cols: R.colWeeks, note: fmt(R.seasonNew, { mes: monthName(nextMonth(month), lang) }),
    link: { label: R.seeDaily, href: new URL('today/', ROOT).href },
  };
}

/** How long the hidden frame may take to read the cup and answer, before the home page gives up. */
const FRAME_MS = 10000;

/** Opens /cup/recap/ in a hidden frame and waits for what it posts: `{ code, alias, path, recap }` or null. */
function askFrame(demo) {
  return new Promise(resolve => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    const done = found => { clearTimeout(timer); removeEventListener('message', onMessage); frame.remove(); resolve(found); };
    const onMessage = e => { if (e.source === frame.contentWindow && e.origin === location.origin && e.data?.type === 'recap') done(e.data.found || null); };
    const timer = setTimeout(() => done(null), FRAME_MS);
    addEventListener('message', onMessage);
    frame.src = new URL(`cup/recap/${demo ? '?demo' : ''}`, ROOT).href;
    document.body.append(frame);
  });
}

/**
 * What the home page calls before the splash: resolves true when it opened a recap (the splash
 * then waits for the next visit). La Copa's goes first; a season of Uno al día, on a visit with no
 * cup to tell. Never under the end-to-end scripts (`?test`, automation) unless `?recap=` asks.
 */
export async function startRecap({ lang = 'es', search = globalThis.location?.search ?? '' } = {}) {
  const mode = param('recap', search);
  if (!mode && (tiene('test', search) || globalThis.navigator?.webdriver === true)) return false;
  try {
    const season = await import('./daily-recap.js');
    // The notification that a season ended (D-424): last month's, for whoever taps it
    if (mode === 'season') {
      const month = season.monthBefore(season.localDate().slice(0, 7));
      const found = await season.loadSeasonRecap({ month });
      if (!found) return false;
      showRecap(seasonView(found, lang), { lang, onLeave: () => season.markSeasonSeen(month) });
      return true;
    }
    const cupDue = mode === 'demo' || (!mode && !!dueCup());
    const seasonDue = mode === 'season-demo' || (!mode && !!season.dueSeason());
    // Nothing due on this phone: no lab check, no network
    if (!cupDue && !seasonDue) return false;
    // Still in the lab (D-395). lab: #seccion-resumen-copa, lab: #seccion-resumen-temporada
    const { labAccess } = await import('./lab-access.js');
    if (!(await labAccess())) return false;
    if (cupDue) {
      const found = await askFrame(mode === 'demo');
      if (found?.recap) {
        showRecap(cupView(found, lang), { lang, onLeave: mode ? null : () => markCupSeen(found.code) });
        return true;
      }
    }
    if (!seasonDue) return false;
    const found = mode === 'season-demo' ? season.demoSeason() : await season.loadSeasonRecap();
    if (!found) return false;
    showRecap(seasonView(found, lang), { lang, onLeave: mode ? null : () => season.markSeasonSeen(found.month) });
    return true;
  } catch (_) { return false; }
}
