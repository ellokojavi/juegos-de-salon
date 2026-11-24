/**
 * The home page's top bar with the profile (lab flag profile, lab: #seccion-profile): 🏅 becomes a pill
 * with the player's flag and name, as a ranking row shows them, and a ›, and opens /profile/; the sound button
 * leaves the bar (it is in the profile's ⚙️ and in every game). Without a player, «👤 Entrar» opens the
 * same page, which invites to sign in. The streak is not repeated here: Uno al día's card shows it.
 * The language toggle shrinks to the current flag and a ▾, which opens the three (the covers' `langButton`);
 * the profile's ⚙️ keeps the full toggle too. What it shows is the phone's own: no read waits for the network.
 *
 * Every other page gets the same (the owner, 2026-11-21): `profileEverywhere`, which tester-boot.js runs on
 * every page with the flag on, puts the pill at the end of the top bar and turns its language into the
 * flag with a ▾; a game's cover drops its own «🏅 <name>» button (the PIN and signing out are in the
 * profile's ⚙️). The offline ☁️ stays on the home page only.
 */
import { leerYo } from './jugador.js';
import { markVia } from './profile-usage.js';
import { bandera } from './records.js';
import { langButton, getLang } from './i18n.js';

/** The button's name, as the profile page's title (profile/texts.js `pageTitle`). */
export const LABEL = { es: 'Tu perfil', en: 'Your profile', pt: 'Seu perfil' };
/** What the pill says with no player on this phone. */
export const GUEST = { es: 'Entrar', en: 'Sign in', pt: 'Entrar' };

export function profileButton({ lang = 'es', doc = document } = {}) {
  const b = doc.getElementById('btn-rankings');
  if (!b) return;
  b.href = 'profile/';
  b.hidden = false;
  b.parentElement?.append(b);   // the bar's last place, after share, as on every other page (the owner, 2026-11-22)
  pillFace(b, { lang, doc });
  doc.getElementById('sound-slot')?.remove();
  // The same order as every cover's bar (the owner, 2026-11-22): language, share, the page's own button
  // (☁️ here, 🔊 in a game), and the pill last, at the right edge
  const tools = b.parentElement, share = doc.getElementById('share-slot');
  if (share && tools?.contains(share)) tools.insertBefore(share, tools.firstChild);
  if (tools && tools.lastElementChild !== b) tools.append(b);
  const slot = doc.getElementById('lang-slot');
  if (slot && !slot.querySelector('.lang-btn')) slot.replaceChildren(compactLang(doc));
}

/** The pill's face: the player's flag and name and a ›, or «👤 Entrar» with no player on this phone. */
function pillFace(b, { lang = 'es', doc = document } = {}) {
  const yo = leerYo();
  b.classList.add('pf-home');
  for (const k of ['title', 'aria-label']) b.setAttribute(k, LABEL[lang] || LABEL.es);
  b.dataset.pf = sigOf(yo);
  const flag = doc.createElement('span');
  flag.className = 'pf-home-flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.textContent = yo?.n ? bandera(yo.co) || '👤' : '👤';
  const name = doc.createElement('span');
  name.className = 'pf-home-name';
  name.textContent = yo?.n || GUEST[lang] || GUEST.es;
  // A › says the pill opens something (the owner's pick, 2026-11-21: option C)
  const go = doc.createElement('span');
  go.className = 'pf-home-go';
  go.setAttribute('aria-hidden', 'true');
  go.textContent = '›';
  // On a narrow phone's game bar the pill is round, with 👤: the name does not fit, and a lone country
  // flag beside the language's flag would read as a second language (no initial: the owner, 2026-11-21)
  const icon = doc.createElement('span');
  icon.className = 'pf-home-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '👤';
  b.replaceChildren(flag, name, go, icon);
}

/** A ▾ after a language button's flag: it says the button opens the three languages. */
function withCaret(lb, doc = document) {
  lb.classList.add('pf-lang');
  const btn = lb.querySelector('button');
  if (btn && !btn.querySelector('.pf-lang-caret')) {
    const caret = doc.createElement('span');
    caret.className = 'pf-lang-caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '▾';
    btn.append(caret);
  }
  return lb;
}

/** The language as one flag with a ▾ (`langButton`), in place of the three flags. */
const compactLang = (doc = document) => withCaret(langButton(), doc);

/** Whether this page is the profile itself: it needs no way to itself. */
const isProfile = (doc = document) => /\/profile\/?$/.test(doc.location?.pathname || '');

/** The pill's signature: what it shows, to redraw it only when that changes. */
const sigOf = yo => (yo?.n ? `${yo.n}|${yo.co || ''}` : '');

/**
 * Every page's top bar with the profile (lab flag profile). Idempotent: a page that draws its bar again
 * (a cover re-rendered, a game going back to its cover) gets its pill and ▾ again, and signing in or out
 * on the page renames the pill. `profileHref`: where the profile is, from this module's own address.
 */
export function profileEverywhere({ doc = document, profileHref = new URL('../../profile/', import.meta.url).href } = {}) {
  const root = doc.documentElement;
  root.classList.add('pf-on');
  const lang = getLang();
  const fix = () => {
    const yo = leerYo(), sig = sigOf(yo);
    root.classList.toggle('pf-signed', !!yo?.n);
    // The home page: profileButton draws its bar; here only a pill that no longer says who is on this phone
    const home = doc.getElementById('btn-rankings');
    if (home) { if (home.classList.contains('pf-home') && home.dataset.pf !== sig) pillFace(home, { lang, doc }); return; }
    const tools = doc.querySelector('.topbar .tools');
    if (!tools) return;
    // The language: a cover's round flag gets its ▾; a page with the three flags in the bar gets the button
    tools.querySelectorAll('.lang-btn').forEach(lb => withCaret(lb, doc));
    const full = tools.querySelector('#lang-slot > .lang-toggle');
    if (full) full.parentElement.replaceChildren(compactLang(doc));
    if (isProfile(doc)) return;
    let pill = tools.querySelector('.pf-home');
    if (pill && pill.dataset.pf === sig) return;
    if (!pill) {
      pill = doc.createElement('a');
      pill.className = 'icon-btn pf-home pf-bar';
      pill.href = profileHref;
      tools.append(pill);
    }
    pillFace(pill, { lang, doc });
  };
  fix();
  // The way in, for the owner's 🎖️ Profile (D-615): a tap on the pill leaves its mark in this tab
  if (!root.dataset.pfVia) {
    root.dataset.pfVia = '1';
    doc.addEventListener('click', e => { if (e.target?.closest?.('.pf-home, #btn-rankings')) markVia('pill'); }, true);
  }
  // The first time, a bubble from the pill says the player's things live there (profile-hint.js)
  if (!isProfile(doc)) setTimeout(() => import('./profile-hint.js').then(m => {
    m.demoReset(doc.location);
    m.pillBubble(doc.querySelector('.topbar .pf-home'), { doc, lang });
  }).catch(() => {}), 1200);
  // Pages draw their bar and sign players in and out after loading: one look per frame at most
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fix(); });
  }).observe(doc.body, { childList: true, subtree: true });
  // A page the browser brings back with ‹ (its back-forward cache) or that waited in another tab still shows
  // who was on the phone then: after signing out in the profile, the pill must say «Entrar» (the owner, 2026-11-22)
  const win = doc.defaultView;
  win?.addEventListener('pageshow', fix);
  win?.addEventListener('storage', fix);
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'visible') fix(); });
}
