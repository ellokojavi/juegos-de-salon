/**
 * Seasonal touches (D-457, D-622): small nods to a date —Halloween first— that dress the site for a few
 * days and take nothing away from the games. This is the engine; the dates and what each one shows
 * are templates, one row each in ../season/templates.js (adding one: docs/SEASONS.md). On a
 * template's days the page gets `season-<id>` on <html> and the touches the template names; the
 * day after its last one it goes away by itself, with no PR.
 *
 * Every page loads it, the games included (D-622): tester-boot.js, which vigia.js puts on every page
 * but the panel, imports it. What moves across the screen stays on the home page. It never covers a button, takes a tap or
 * changes a text the player reads: the decorations are `aria-hidden`, and with
 * `prefers-reduced-motion` nothing moves.
 *
 *   ?season=<id>   turns a template on any day (to look at it before its dates)
 *   ?season=off    turns it off
 *   ?test          off, so the scripts and the screenshots see the site as always
 *
 * While a template is in the lab (`public: false`) it never turns on by its dates: only its preview,
 * `?season=<id>` (the panel's Live Preview), shows it, and only to a lab key holder (D-395, D-623).
 * The panel's 🎨 Skins (D-477, controls.js) can move a template to other days or switch it off,
 * with no PR: `controls/skins/<id>`, read before deciding.
 * lab: #seccion-temporadas
 */
import { param, tiene } from './parametros.js';
import { labAccess } from './lab-access.js';
import { TEMPLATES } from '../season/templates.js';
import { loadControls, skinOn } from './controls.js';

export { TEMPLATES };
const BASE_CSS = new URL('../css/season.css', import.meta.url).href;

const mmdd = d => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Whether a day ('MM-DD') falls in from…to, both included; a range may cross New Year. */
export const within = (day, from, to) => (from <= to ? from <= day && day <= to : day >= from || day <= to);

const ymd = d => `${d.getFullYear()}-${mmdd(d)}`;
/** The template a day falls in, if any, after the panel's skins switches (pure, for node). */
export function seasonOf(date = new Date(), templates = TEMPLATES, controls = {}) {
  const day = mmdd(date);
  return Object.keys(templates).find(id => skinOn(controls?.skins?.[id], ymd(date), () => within(day, templates[id].from, templates[id].to))) || null;
}

/** Which template this page shows, and whether that still needs a lab key; null for none. */
export function chooseSeason({ search = globalThis.location?.search ?? '', date = new Date(), templates = TEMPLATES, controls = {} } = {}) {
  const asked = param('season', search);
  if (asked === 'off') return null;
  if (asked && templates[asked]) return { id: asked, lab: !templates[asked].public, forced: true };
  if (tiene('test', search)) return null;
  // A skin in the lab never turns on by its dates, not even for a lab key: only its preview shows it (D-623)
  const id = seasonOf(date, templates, controls);
  return id && templates[id].public ? { id, lab: false, forced: false } : null;
}

/** A favicon drawn from an emoji on a two-colour square, like the site's own (assets/icon.svg). */
export function iconUrl({ emoji, colors: [a, b] }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="128" height="128" rx="28" fill="url(#g)"/><text x="64" y="86" font-size="64" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function start() {
  try {
    const pick = chooseSeason({ controls: tiene('test') ? {} : await loadControls() });
    if (!pick || (pick.lab && !(await labAccess()))) { if (!param('season') && !tiene('test')) forget(); return null; }
    const t = TEMPLATES[pick.id];
    document.documentElement.classList.add('season', `season-${pick.id}`);
    for (const href of [BASE_CSS, t.css].filter(Boolean)) {
      const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
      // Its palette, remembered for the next page's first paint (vigia.js): a public skin on its own days only
      if (href === t.css && !pick.forced && !pick.lab) link.addEventListener('load', () => remember(pick.id, t), { once: true });
      document.head.append(link);
    }
    const icon = document.querySelector('link[rel="icon"]');
    if (icon && t.icon) { icon.type = 'image/svg+xml'; icon.href = iconUrl(t.icon); }
    if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    decorate(t, pick.forced);
    return { id: pick.id, ...t };
  } catch (_) { return null; } // a decoration never stops a page
}

/**
 * The first paint (D-457): this module runs after the page is drawn, so a skin's background came in a
 * fraction of a second late and the old one flashed. The palette it draws is kept on the phone and
 * vigia.js, a plain script in every page's <head>, puts it on <html> before the first paint while
 * today is in its days. A page with no skin today forgets it.
 */
export const GUESS_KEY = 'juegos-de-salon:season-guess';
function remember(id, t) {
  try {
    const fondo = getComputedStyle(document.documentElement).getPropertyValue('--fondo').trim();
    if (fondo) localStorage.setItem(GUESS_KEY, JSON.stringify({ id, from: t.from, to: t.to, fondo }));
  } catch (_) {}
}
function forget() {
  try { localStorage.removeItem(GUESS_KEY); } catch (_) {}
  document.documentElement.style.removeProperty('--fondo');
}

const still = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pickOne = list => list[Math.floor(Math.random() * list.length)];
const deco = (cls, text = '') => {
  const d = Object.assign(document.createElement('div'), { className: `season-deco ${cls}`, textContent: text });
  d.setAttribute('aria-hidden', 'true');
  return d;
};
const once = el => el.addEventListener('animationend', e => { if (e.target === el && /season-(fly|hide|loom|scuttle|stare|shamble|strut)$/.test(e.animationName)) el.remove(); });

/** The touches a template names. `forced` (?season=<id>): the rare ones show every time, to look at them. */
function decorate(t, forced) {
  if (t.corner) document.body.append(deco('season-corner'));
  if (t.motes?.length) motes(t.motes);
  if (t.fall?.emojis?.length && !still()) fall(t.fall);
  const home = !!document.getElementById('hero-emoji');
  if (!home || still()) return;
  if (t.flyby) { const f = deco('season-flyby', t.flyby); once(f); document.body.append(f); }
  if (t.peek && (forced || Math.random() < t.peek.chance)) {
    const p = deco('season-peek', t.peek.emoji); once(p);
    setTimeout(() => document.body.append(p), 4000);
  }
  if (t.scares?.length) scares(t.scares);
  if (t.strut) strut(t.strut);
}

const rnd = (a, b) => a + Math.random() * (b - a);
/**
 * Things that never stop falling, behind the page (season.css): `{ emojis, count, pace, sway }` drops
 * `count` at a time, each from a random column, taking `pace` [min, max] seconds to cross the screen
 * and swaying `sway` px to each side, at its own rhythm, so they never fall in step.
 */
function fall({ emojis, count = 14, pace = [9, 17], sway = 18 }) {
  const box = deco('season-fall');
  for (let i = 0; i < count; i++) {
    const e = Object.assign(document.createElement('span'), { textContent: pickOne(emojis) });
    const dur = rnd(...pace);
    e.style.cssText = `left:${rnd(0, 96).toFixed(1)}%;font-size:${rnd(16, 28).toFixed(0)}px;--sway:${sway}px;--spin:${Math.round(sway * 1.4)}deg;animation-duration:${dur.toFixed(1)}s,${(rnd(2.4, 4) * (sway < 18 ? 1.5 : 1)).toFixed(1)}s;animation-delay:-${rnd(0, dur).toFixed(1)}s,-${rnd(0, 3).toFixed(1)}s`;
    box.append(e);
  }
  document.body.append(box);
}

/**
 * Turkeys walking across the bottom of the home page, right to left (the 🦃 faces left):
 * `{ emoji, count, every }`, a line of `count` the first time at 3 s and then every `every` ms.
 */
function strut({ emoji = '🦃', count = 1, every = 25000 }) {
  const go = () => {
    if (document.hidden) return;
    for (let i = 0; i < count; i++) {
      const s = deco('season-strut', emoji); once(s);
      s.style.animationDelay = `${(i * 0.55).toFixed(2)}s, ${(i * 0.55).toFixed(2)}s`;
      if (i) s.style.fontSize = `${Math.round(54 - i * 10)}px`;
      document.body.append(s);
    }
  };
  setTimeout(() => { go(); setInterval(go, every); }, 3000);
}

/** How each scare moves (season.css); an emoji not listed looms. */
const SCARE = { '💀': 'season-loom', '🕷️': 'season-scuttle', '👀': 'season-stare', '🧟': 'season-shamble' };
const EVERY = 40000;
/** A big fright every 40 s while the page is in view, each a random one but never the last one again. */
function scares(emojis) {
  let last = null;
  const next = () => {
    if (document.hidden) return; // a tab in the background does not pile them up
    const e = pickOne(emojis.length > 1 ? emojis.filter(x => x !== last) : emojis);
    last = e;
    const s = deco(SCARE[e] || 'season-loom', e); once(s);
    document.body.append(s);
  };
  setTimeout(() => { next(); setInterval(next, EVERY); }, 8000);
}

/** One background particle in three (ui.js `sparkles`) becomes one of the template's emojis. */
function motes(emojis) {
  const dress = wrap => [...wrap.children].forEach((s, i) => {
    if (i % 3) return;
    s.textContent = pickOne(emojis);
    s.classList.add('season-mote');
  });
  const now = document.querySelector('.bg-sparkles');
  if (now) return dress(now);
  // The page draws them after its modules load: wait for them, but not forever
  const watch = new MutationObserver(() => { const w = document.querySelector('.bg-sparkles'); if (w) { watch.disconnect(); dress(w); } });
  watch.observe(document.body, { childList: true });
  setTimeout(() => watch.disconnect(), 5000);
}

/**
 * The template on this page, once it is known: `{ id, ...template }`, or null. Last in the module:
 * a public template reaches decorate() with no await on the way, so every helper above must
 * already exist (it threw "Cannot access 'deco' before initialization" and showed only the palette).
 */
export const season = typeof document === 'undefined' ? Promise.resolve(null) : start();
