// The player's profile at /profile/ (lab flag profile): with the flag off the page is Rankings; without a player it
// invites to sign in, shows this phone's badges and the rankings; with one, its card, then 🎖️ badges (earned, locked
// with progress, secret), 🏅 its places in each game it played (a tap opens the game's table) and ⚙️ its settings;
// on the home page 🏅 becomes a pill with the player's flag and name, and the language one flag with a ▾; every other page's
// top bar (a game's cover, Uno al día, Rankings) ends in the same pill and its cover drops «🏅 <name>»; ⚙️ changes the name and
// the PIN (each with the PIN) and signs out. At 320 and 390 px nothing scrolls sideways and
// every tappable thing is 44 px or more (U-10). Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const OUT = output('/tmp/profile-page');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const full = async (b, name, W) => { const h = await b.evaluate('document.documentElement.scrollHeight'); await b.resize(W, h); await b.shot(name); await b.resize(W, W === 320 ? 640 : 844); };
const small = b => b.evaluate(`[...document.querySelectorAll('main button, main a.btn, main .topbar .back, main details.panel > summary')].filter(x => {
  if (!x.offsetHeight || x.closest('[hidden]')) return false;
  const r = x.getBoundingClientRect(), c = getComputedStyle(x), p = getComputedStyle(x, '::before');
  let h = r.height, w = r.width;
  if (p.content !== 'none' && p.position === 'absolute') {
    h = Math.max(h, r.height - parseFloat(c.borderTopWidth) - parseFloat(c.borderBottomWidth) - parseFloat(p.top) - parseFloat(p.bottom));
    w = Math.max(w, r.width - parseFloat(c.borderLeftWidth) - parseFloat(c.borderRightWidth) - parseFloat(p.left) - parseFloat(p.right));
  }
  return h < 43.5 || w < 43.5;
}).map(x => x.className || x.tagName).join(', ')`);

// The flag off: the page is Rankings
{
  const b = await launch({ dir: `${OUT}/off`, out: OUT, clock: true });
  b.flags({ profile: 'off' });
  await b.go(`${SITE}/profile/?test`, 2500);
  ok(/\/records\/\?test(#|$)/.test(await b.evaluate('location.href')), 'flag off: /profile/ goes to Rankings');
  b.close();
}

for (const W of [320, 390]) {
  const b = await launch({ dir: `${OUT}/p${W}`, out: OUT, width: W, height: W === 320 ? 640 : 844, clock: true });
  // The home page as the owner sees it in Labs: its icon view (flag home-carousels), with the profile's pill
  b.flags({ profile: 'all', 'home-carousels': 'all' });
  const ev = e => b.evaluate(e);
  // A guest (a clean phone, so the script can run again)
  await b.go(`${SITE}/profile/?test`, 1500);
  await ev('localStorage.clear()');
  await b.go(`${SITE}/profile/?test`, 3000);
  ok(await ev(`!!document.querySelector('#pf-page .rk-invita[open] #rk-entrar')`), `${W}: a guest is invited to sign in, the form open`);
  // 👋 The welcome: open by itself on the first visit, closed after; «¿Cómo funciona?» opens it again (the owner, 2026-11-22)
  ok(await ev(`(() => { const i = document.getElementById('pf-intro'); return !!i && !i.hidden && i.querySelectorAll('.pf-intro-list li').length === 3 && document.querySelector('.pf-help').getAttribute('aria-expanded') === 'true' && i.getBoundingClientRect().right <= ${W} && !!localStorage.getItem('juegos-de-salon:profile-intro') && !!localStorage.getItem('juegos-de-salon:profile-bubble'); })()`), `${W}: 👋 the first visit opens the welcome: three points, and the pill's bubble is retired`);
  ok(await ev(`(() => { const i = document.getElementById('pf-intro').getBoundingClientRect(), n = document.getElementById('pf-page').firstElementChild.getBoundingClientRect(); return Math.round(n.top - i.bottom) === 12; })()`), `${W}: 👋 the welcome keeps 12 px of air above the next block`);
  await b.shot(`intro-${W}`);
  const si = await small(b);
  ok(!si, `${W}: 👋 the welcome, every tappable thing is 44 px or more${si ? ` (${si})` : ''}`);
  await ev(`document.querySelector('.pf-intro-ok').click()`); await sleep(300);
  ok(await ev(`document.getElementById('pf-intro').hidden && !document.querySelector('.pf-help').hidden`), `${W}: 👋 «Entendido» closes it`);
  await b.go(`${SITE}/profile/?test`, 3000);
  ok(await ev(`document.getElementById('pf-intro').hidden && !document.querySelector('.pf-help').hidden`), `${W}: 👋 the next visit starts with it closed`);
  ok(await ev(`(() => { const h = document.querySelector('.pf-title-row h1').getBoundingClientRect(), i = document.querySelector('.pf-help').getBoundingClientRect(), s = document.getElementById('pf-sub').getBoundingClientRect(); return i.left >= h.right - 6 && i.left - h.right < 4 && i.top < h.top + h.height / 2 && i.right <= ${W} && s.top >= h.bottom - 2 && Math.abs((h.left + h.right) / 2 - ${W} / 2) < 4; })()`), `${W}: 👋 ⓘ sits at the title's right, the title still centred, no line of its own`);
  await b.shot(`intro-closed-${W}`);
  await ev(`document.querySelector('.pf-help').click()`); await sleep(500);
  ok(await ev(`!document.getElementById('pf-intro').hidden`), `${W}: 👋 ⓘ opens it again`);
  await ev(`document.querySelector('.pf-intro-x').click()`); await sleep(300);
  ok(await ev(`document.getElementById('pf-intro').hidden`), `${W}: 👋 ✕ closes it too`);
  ok(await ev(`document.querySelectorAll('#pf-page .pf-group .pf-badge').length`) >= 5, `${W}: a guest sees the badges this phone can earn`);
  ok(await ev(`document.querySelectorAll('#pf-page .rk-ranking, #pf-page .rk-lista').length`) >= 2, `${W}: a guest sees the rankings, as on /records/`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: guest, no sideways scroll`);
  const s0 = await small(b);
  ok(!s0, `${W}: guest, every tappable thing is 44 px or more${s0 ? ` (${s0})` : ''}`);
  await full(b, `guest-${W}`, W);
  // A player: two rivals, then the player with games, a 14-day streak and four early mornings
  await ev(`(async () => {
    const { jugador } = await import('/assets/js/jugador.js');
    const J = await jugador();
    for (const [n, s] of [['Cata', 95], ['Fran', 70]]) { await J.crear(n, '1111'); for (const g of ['reinas', 'tango']) await J.anotar({ juego: g, s, ms: 50000 }); J.salir(); }
    await J.crear('Javi', '1234');
    for (const [g, k] of Object.entries({ reinas: 6, conexiones: 4, tango: 3, zip: 2, donde: 1, desenredo: 1, pintaminas: 2, agentes: 1 }))
      for (let i = 0; i < k; i++) await J.anotar({ juego: g, s: 60 + i * 5 + (g === 'reinas' ? 40 : 0), ms: 42000 + i * 1000 });
    const dias = {}, t = new Date();
    for (let i = 0; i < 14; i++) { const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i); dias[d.toLocaleDateString('en-CA')] = { j: 'reinas', s: 80, ms: 40000, at: d.getTime(), n: 1 }; }
    localStorage.setItem('juegos-de-salon:uno-al-dia', JSON.stringify({ dias }));
    const h = {}; for (let i = 1; i <= 4; i++) h['2026-11-0' + i] = { e: 3 };
    localStorage.setItem('juegos-de-salon:play-hours', JSON.stringify(h));
    localStorage.setItem('juegos-de-salon:play-run', JSON.stringify({ g: 'queens', n: 3, best: 10 }));
    localStorage.setItem('juegos-de-salon:logros-anunciados', JSON.stringify({ xmas: 1 }));
    localStorage.setItem('juegos-de-salon:logros-base', '1');   // not this phone's first look: what it earns is told
    localStorage.setItem('juegos-de-salon:play-marks', JSON.stringify({ days: { xmas: true, halloween: true }, wk: ['2025-01-04', '2025-01-11', '2025-01-18'], mon: ['2025-01-06'], played: ['2025-01-01', '2025-01-02'] }));
  })()`);
  // Seven cups of La Copa's test store (its podium demo), five of them ended, two in progress
  await ev(`(async () => {
    const { escena } = await import('/cup/demo.js');
    const now = Date.now(), jid = JSON.parse(localStorage.getItem('juegos-de-salon:jugador')).jid;
    const cups = JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba') || '{}');
    const db = JSON.parse(localStorage.getItem('juegos-de-salon:prueba:records-db') || '{}');
    db.jugadorCopas = { ...(db.jugadorCopas || {}), [jid]: {} };
    for (let i = 0; i < 7; i++) {
      const { L, e } = escena('podium', { now: now - (i < 2 ? -5 : i * 9) * 86400000 });
      const code = 'PFC' + 'ABCDEFG'[i] + 'Z';
      L.meta.name = 'Copa ' + (i + 1);
      cups[code] = L;
      db.jugadorCopas[jid][code] = { p: e.yo, at: now - i * 1000 };
    }
    localStorage.setItem('juegos-de-salon:copa:prueba', JSON.stringify(cups));
    localStorage.setItem('juegos-de-salon:prueba:records-db', JSON.stringify(db));
  })()`);
  await b.go(`${SITE}/profile/?test`, 4000);
  // 🎃 earned and not yet told: its window opens once, like One a Day's month-end one, with «Ver mis logros» (the owner, 2026-11-22)
  ok(await ev(`(() => { const w = document.querySelector('.aw-capa'); return !!w && w.querySelector('.aw-titulo')?.textContent === 'Noche de brujas' && !w.querySelector('path') && /logros secretos/.test(w.textContent) && !/chapita/i.test(w.textContent) && !!w.querySelector('a.btn'); })()`), `${W}: 🎃 a secret achievement just earned opens its window: a round medal, no ribbon, «Ver mis logros»`);
  ok(await ev(`(() => { const c = document.querySelector('.aw-capa .me-tarjeta')?.getBoundingClientRect(), m = document.querySelector('.aw-medalla')?.getBoundingClientRect(); return !!c && c.left >= 0 && c.right <= ${W} && m.top >= 0 && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: 🎃 its window fits the screen`);
  ok(await ev(`!!document.querySelector('.aw-capa .aw-franjas') && !!document.querySelector('.aw-medalla .aw-dorso')`), `${W}: 🎃 its medal first shows «?» over diagonal stripes, then turns over (look B)`);
  await sleep(2200);
  ok(await ev(`getComputedStyle(document.querySelector('.aw-dorso')).opacity === '0'`), `${W}: 🎃 the medal turned over: the achievement shows`);
  ok(await ev(`(() => { const c = document.querySelector('.aw-capa .aw-confeti'); return !!c && c.width > 0 && getComputedStyle(c).pointerEvents === 'none'; })()`), `${W}: 🎃 confetti bursts out of the medal as it turns over, the fireworks behind`);
  await b.shot(`achievement-${W}`);
  await ev(`document.querySelector('.aw-capa .me-x').click()`); await sleep(400);
  ok(await ev(`!document.querySelector('.aw-capa') && !!JSON.parse(localStorage.getItem('juegos-de-salon:logros-anunciados') || '{}').halloween`), `${W}: 🎃 told once: the phone remembers it`);
  // 🎲 Any other badge the phone can tell alone opens the same window after the game that earned it, its medal at once
  // (the owner, 2026-11-23); the first look only notes what the player already had
  const plays0 = await ev(`localStorage.getItem('juegos-de-salon:partidas')`);
  ok(await ev(`(async () => { const m = await import('/assets/js/achievement-window.js'); localStorage.removeItem('juegos-de-salon:logros-base'); localStorage.setItem('juegos-de-salon:partidas', '100'); const r = await m.celebrate({ wait: 0 }); return r === null && !document.querySelector('.aw-capa') && !!JSON.parse(localStorage.getItem('juegos-de-salon:logros-anunciados'))['plays-100'] && !!localStorage.getItem('juegos-de-salon:logros-base'); })()`), `${W}: 🎲 the first look only notes the badges the player already had: no window`);
  ok(await ev(`(async () => { const m = await import('/assets/js/achievement-window.js'); localStorage.setItem('juegos-de-salon:partidas', '1000'); const r = await m.celebrate({ wait: 0 }); const w = document.querySelector('.aw-capa'); return r === 'plays-1000' && !!w && w.classList.contains('aw-abierta') && w.querySelector('.aw-titulo').textContent === '1.000 partidas' && /Nuevo logro/.test(w.textContent) && /Terminaste 1.000 partidas/.test(w.textContent) && !w.querySelector('.aw-cuenta') && getComputedStyle(w.querySelector('.aw-dorso')).display === 'none'; })()`), `${W}: 🎲 1000 games just finished: its window, the medal shown at once, «¡Nuevo logro!» and what it asked`);
  await sleep(1500);
  ok(await ev(`(() => { const c = document.querySelector('.aw-capa .me-tarjeta')?.getBoundingClientRect(), m = document.querySelector('.aw-medalla')?.getBoundingClientRect(); return !!c && c.left >= 0 && c.right <= ${W} && m.top >= 0 && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: 🎲 its window fits the screen`);
  await b.shot(`badge-window-${W}`);
  await ev(`document.querySelector('.aw-capa .me-x').click()`); await sleep(400);
  ok(await ev(`(async () => { const m = await import('/assets/js/achievement-window.js'); return (await m.celebrate({ wait: 0 })) === null && !document.querySelector('.aw-capa'); })()`), `${W}: 🎲 told once`);
  await ev(`localStorage.setItem('juegos-de-salon:partidas', ${JSON.stringify(plays0 ?? '0')})`);
  ok(await ev(`document.querySelector('.pf-player')?.textContent.includes('Javi')`), `${W}: the card names the player`);
  ok(await ev(`!document.querySelector('.pf-avatar') && !!document.querySelector('.pf-card .pf-player .rk-flag, .pf-card .pf-player')`), `${W}: the card is the player's flag and name, no initial in a circle`);
  // The figures pop in once the server answers (the owner, 2026-11-23), then stay
  await sleep(1600);
  ok(/14/.test(await ev(`document.querySelector('.pf-stat b')?.textContent`)), `${W}: the card shows the 14-day streak`);
  ok(await ev(`!!document.querySelector('[data-badge="streak-10"]:not(.pf-badge--locked)')`), `${W}: 🔥 10 in a row is earned`);
  ok(/14 \/ 30/.test(await ev(`document.querySelector('[data-badge="streak-30"]')?.textContent`)), `${W}: 🔥 30 in a row shows its progress, 14 / 30`);
  ok(/4 \/ 7/.test(await ev(`document.querySelector('[data-badge="early-bird"]')?.textContent`)), `${W}: 🌅 the early bird counts the mornings, 4 / 7`);
  ok(await ev(`document.querySelector('[data-badge="obsession"]')?.classList.contains('pf-badge--silver')`), `${W}: 😬 Se llama obsesión is earned with one game 10 times in a row`);
  ok(await ev(`!document.querySelector('[data-badge="weekends"]')?.classList.contains('pf-badge--locked')`), `${W}: 🛋️ Finde a tope joins Uno al día's weekends and the phone's`);
  ok(/1[67] \/ 100/.test(await ev(`document.querySelector('[data-badge="regular"]')?.textContent`)), `${W}: 🏠 De la casa counts Uno al día's days and the phone's, 16 / 100`);
  ok(/1 \/ 4/.test(await ev(`document.querySelector('[data-badge="mondays"]')?.textContent`)), `${W}: ☕ Odio los lunes counts the Mondays, 1 / 4`);
  ok(/Viejito Pascuero/.test(await ev(`document.querySelector('[data-badge="xmas"]')?.textContent`)), `${W}: 🎅 the secret Christmas badge shows its name once earned`);
  ok(await ev(`!!document.querySelector('[data-badge="new-year"].pf-badge--locked, [data-badge="new-year"]:not(:has(.pf-name))') || !/Año nuevo/.test(document.querySelector('[data-badge="new-year"]')?.textContent || '')`), `${W}: 🎆 New Year stays secret until earned`);
  const spill = await ev(`[...document.querySelectorAll('.pf-badge')].filter(x => { const n = x.querySelector('.pf-name'), r = n.getBoundingClientRect(), c = x.getBoundingClientRect(); return n.scrollWidth > n.clientWidth + 1 || r.left < c.left - 0.5 || r.right > c.right + 0.5; }).map(x => x.dataset.badge).join(', ')`);
  ok(!spill, `${W}: every badge's name fits inside its card${spill ? ` (${spill})` : ''}`);
  ok(await ev(`!!document.querySelector('[data-badge="number-one"]:not(.pf-badge--locked) .pf-new')`), `${W}: 🥇 number 1 is earned and new`);
  ok(await ev(`(async () => { window.__profile.redraw(); await new Promise(r => setTimeout(r, 120)); const v = [...document.querySelectorAll('.pf-stat b')].map(b => b.textContent); return !document.querySelector('.pf-stat .pf-pop, .pf-stat .pf-dots') && /14/.test(v[0]) && /^20$/.test(v[1]); })()`), `${W}: drawn again, the figures stay as they stood: no dots, no pop again`);
  // The day it reaches everyone (the owner, 2026-11-23): what a phone had already earned is never announced, secret ones too
  await ev(`localStorage.removeItem('juegos-de-salon:logros-base'); localStorage.removeItem('juegos-de-salon:logros-anunciados')`);
  // Every figure the card puts up, as it was put up: the first are hopping dots, never this phone's partial count (the owner, 2026-11-23)
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__figs = []; new MutationObserver(rs => { for (const r of rs) for (const n of r.addedNodes) if (n.querySelectorAll) for (const x of n.querySelectorAll('.pf-stat b[data-count]')) window.__figs.push({ k: x.dataset.count, dots: !!x.querySelector('.pf-dots'), t: x.textContent }); }).observe(document, { childList: true, subtree: true });` });
  await b.go(`${SITE}/profile/?test`, 5000);
  {
    const figs = await ev(`window.__figs`);
    const first = Object.fromEntries(['streak', 'plays', 'cups'].map(k => [k, figs.find(x => x.k === k)]));
    ok(Object.values(first).every(x => x?.dots && !/\d/.test(x.t)), `${W}: before the server answers, each figure is three hopping dots, never a partial number (${JSON.stringify(first)})`);
    ok(/^20$/.test(await ev(`document.querySelector('.pf-stat b[data-count="plays"]')?.textContent`)) && !(await ev(`!!document.querySelector('.pf-dots')`)), `${W}: then the server's figure pops in, the dots gone`);
    // The dots hold the number's place: the card does not jump when the figure arrives (D-570)
    const jump = await ev(`(() => { const s = document.querySelector('.pf-card .pf-stats'), h0 = s.getBoundingClientRect().height, bs = [...s.querySelectorAll('b')], keep = bs.map(x => x.innerHTML);
      bs.forEach(x => { x.innerHTML = '<span class="pf-dots"><i></i><i></i><i></i></span>'; }); const h1 = s.getBoundingClientRect().height, sp = bs[1].querySelector('.pf-dots').getBoundingClientRect(), bb = bs[1].getBoundingClientRect();
      const r = { dh: Math.round(h1 - h0), dx: Math.round((sp.left + sp.right) / 2 - (bb.left + bb.right) / 2) }; window.__keepFigs = keep; return r; })()`);
    ok(!jump.dh && Math.abs(jump.dx) <= 1, `${W}: the dots sit centred where the number goes, the card the same height (${JSON.stringify(jump)})`);
    await ev(`document.querySelector('.pf-card').scrollIntoView()`); await b.shot(`card-dots-${W}`);
    await ev(`[...document.querySelectorAll('.pf-card .pf-stats b')].forEach((x, i) => { x.innerHTML = window.__keepFigs[i]; })`);
  }
  ok(await ev(`(() => { const d = JSON.parse(localStorage.getItem('juegos-de-salon:logros-anunciados') || '{}'); return !document.querySelector('.aw-capa') && !!localStorage.getItem('juegos-de-salon:logros-base') && !!d.halloween && !!d['streak-10']; })()`), `${W}: 🎲 a phone's first look announces nothing it had already earned, secret or not: it only notes them`);
  ok(await ev(`[...document.querySelectorAll('[data-badge="night-owl"] .pf-name')].map(x => x.textContent).join()`) !== 'Noctámbulo', `${W}: a secret badge keeps its name until earned`);
  // 🎬 A badge a game's window celebrated is earned on the profile even if the page's facts say otherwise, and the
  // next visit reveals it once: grey to its metal with a flash, «¡Nueva!» kept through every draw, brought into view (the owner, 2026-11-22)
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('juegos-de-salon:logros-anunciados') || '{}'); d.premiere = Date.now(); localStorage.setItem('juegos-de-salon:logros-anunciados', JSON.stringify(d)); })()`);
  // A reload, not a hash change: only the hash would not draw the page again
  await ev(`location.hash = 'badges'; location.reload()`); await sleep(1200);
  ok(await ev(`(() => { const x = document.querySelector('[data-badge="premiere"]'); return !!x && !x.classList.contains('pf-badge--locked') && x.classList.contains('pf-badge--reveal') && !!x.querySelector('.pf-new') && document.getAnimations().some(a => a.animationName === 'pf-unlock'); })()`), `${W}: 🎬 a badge its window celebrated is earned here and revealed`);
  await sleep(4500);
  ok(await ev(`(() => { const x = document.querySelector('[data-badge="premiere"]'), r = x?.getBoundingClientRect(); return !!x?.querySelector('.pf-new') && r.top >= 0 && r.bottom <= innerHeight; })()`), `${W}: 🎬 after every draw it is still new, and in view`);
  await b.shot(`badge-revealed-${W}`);
  await ev(`location.reload()`); await sleep(4000);
  ok(await ev(`(() => { const x = document.querySelector('[data-badge="premiere"]'); return !!x && !x.classList.contains('pf-badge--locked') && !x.classList.contains('pf-badge--reveal') && !x.querySelector('.pf-new'); })()`), `${W}: 🎬 the next visit: still earned, revealed only once`);
  // `?reveal` replays the last badge earned, to try it as often as wanted, and records nothing (the owner, 2026-11-23)
  await b.go(`${SITE}/profile/?test&reveal=premiere#badges`, 1500);
  ok(await ev(`(() => { const x = document.querySelector('[data-badge="premiere"]'); return !!x && x.classList.contains('pf-badge--reveal') && !!x.querySelector('.pf-new') && document.querySelectorAll('.pf-badge--reveal').length === 1; })()`), `${W}: 🎬 ?reveal=premiere replays that badge's reveal`);
  await b.go(`${SITE}/profile/?test&reveal#badges`, 1500);
  ok(await ev(`(() => { const x = document.querySelectorAll('.pf-badge--reveal'); return x.length === 1 && !x[0].classList.contains('pf-badge--locked'); })()`), `${W}: 🎬 ?reveal replays the last badge earned, just one`);
  await b.go(`${SITE}/profile/?test#badges`, 3000);
  ok(await ev(`!document.querySelector('.pf-badge--reveal')`), `${W}: 🎬 ?reveal recorded nothing: without it, no reveal`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: badges, no sideways scroll`);
  await full(b, `badges-${W}`, W);
  // Scrolled, the section bar stays on top and stands apart from the badges under it (the owner, 2026-11-22)
  await ev(`scrollTo(0, 900)`); await sleep(400);
  ok(await ev(`(() => { const t = document.querySelector('.pf-tabs'), r = t.getBoundingClientRect(), c = getComputedStyle(t), a = Number((c.backgroundColor.match(/[\\d.]+(?=\\)$)/) || [1])[0]); return r.top >= 0 && r.top < 20 && (c.backgroundColor.startsWith('rgb(') || a >= 0.9) && parseFloat(c.borderTopWidth) >= 1; })()`), `${W}: scrolled, the section bar stays on top, nearly opaque and edged`);
  await b.shot(`badges-scrolled-${W}`);
  await ev(`scrollTo(0, 0)`);
  await ev(`document.querySelector('[data-tab=rankings]').click()`); await sleep(2500);
  ok(await ev(`document.querySelectorAll('.pf-game').length`) === 8, `${W}: 🏅 lists the eight games the player played`);
  ok(await ev(`document.querySelector('.pf-game[data-game="reinas"] .pf-game-place')?.textContent.startsWith('1')`), `${W}: 🏅 Reinas shows the player's first place`);
  ok(await ev(`[...document.querySelectorAll('.pf-places .pf-place')].slice(0, 2).every(x => /pf-place--/.test(x.className) && x.querySelector('i').textContent && /^(1|2|3)/.test(x.querySelector('b').textContent) === /gold|silver|bronze/.test(x.className))`), `${W}: 🏅 the overall places wear their medal and metal`);
  ok(await ev(`document.querySelectorAll('.pf-game:not([hidden])').length`) === 6, `${W}: 🏅 six games show, the rest behind «Ver más»`);
  await ev(`document.querySelector('.pf-game[data-game="tango"]').click()`); await sleep(1500);
  ok(await ev(`!!document.querySelector('.pf-game[data-game="tango"] + .pf-game-table .rk-fila.yo')`), `${W}: a tap on Tango opens its table with the player's row`);
  // 🏆 Your cups: name, dates, the final place and who won, five at a time
  await sleep(2500);
  ok(await ev(`document.querySelectorAll('.pf-cup').length`) === 5, `${W}: 🏆 five cups show`);
  ok(await ev(`(() => { const c = [...document.querySelectorAll('.pf-cup')]; const over = c.filter(x => !x.classList.contains('pf-cup--live')); return c.slice(0, 2).every(x => x.classList.contains('pf-cup--live')) && over.length && over.every(x => /^Copa \\d/.test(x.querySelector('.pf-cup-name').textContent) && x.querySelector('.pf-cup-txt small').textContent.includes('–') && /\\d/.test(x.querySelector('.pf-cup-place').textContent) && x.querySelector('.pf-cup-champ')?.textContent.length > 2); })()`), `${W}: 🏆 the ones in progress first; each ended one with its name, dates, the player's place and who won`);
  await ev(`document.querySelector('.pf-cups .pf-more').click()`); await sleep(300);
  ok(await ev(`document.querySelectorAll('.pf-cup').length === 7 && !document.querySelector('.pf-cups .pf-more')`), `${W}: 🏆 «Ver 2 copas más» shows the rest`);
  await ev(`document.querySelector('.pf-cups').scrollIntoView()`); await sleep(200);
  await b.shot(`cups-${W}`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: rankings, no sideways scroll`);
  const s1 = await small(b);
  ok(!s1, `${W}: rankings, every tappable thing is 44 px or more${s1 ? ` (${s1})` : ''}`);
  await full(b, `rankings-${W}`, W);
  // A tap on a rival's name opens their profile at a glance (the owner, 2026-11-22)
  ok(await ev(`(() => { const r = [...document.querySelectorAll('.pf-tab .rk-fila[data-peek]')].find(x => x.textContent.includes('Cata')); if (!r) return false; r.scrollIntoView({ block: 'center' }); r.click(); return r.getAttribute('role') === 'button'; })()`), `${W}: 👀 a rival's name in a ranking is a button`);
  await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'); return !!p && p.querySelector('.pf-peek-name')?.textContent.includes('Cata') && !p.querySelector('.pf-peek-kicker') && p.querySelectorAll('.pf-peek-stats .pf-stat').length === 3 && [...p.querySelectorAll('.pf-peek-games li')].map(x => x.dataset.game).sort().join() === 'reinas,tango' && [...p.querySelectorAll('.pf-peek-games li small')].map(x => x.textContent).sort().join() === '1.º histórico,2.º histórico' && !p.querySelector('.pf-peek-games')?.textContent.match(/partida/); })()`), `${W}: 👀 a rival's sheet: their name, three figures and their most played games, each with their all-time place, not how often they play it`);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek').getBoundingClientRect(); return p.left >= 0 && p.right <= ${W} && p.top >= 0 && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: 👀 the sheet fits the screen`);
  const sp = await small(b);
  ok(!sp, `${W}: 👀 the sheet, every tappable thing is 44 px or more${sp ? ` (${sp})` : ''}`);
  await b.shot(`peek-${W}`);
  await ev(`document.querySelector('#pf-peek .hoja-cabeza .icon-btn').click()`); await sleep(300);
  ok(await ev(`!document.getElementById('pf-peek') && !document.body.style.position`), `${W}: 👀 ✕ closes it and frees the page`);
  await ev(`[...document.querySelectorAll('.pf-tab .rk-fila[data-peek]')].find(x => x.textContent.includes('Fran')).click()`); await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'); return !!p && p.querySelector('.pf-peek-name')?.textContent.includes('Fran') && p.querySelectorAll('.pf-peek-stats .pf-stat').length === 3 && !!p.querySelector('.pf-peek-games') && !p.querySelector('.pf-peek-hidden') && !/null|undefined/.test(p.textContent); })()`), `${W}: 👀 every rival shows the same sheet: nothing to hide (D-605)`);
  await b.shot(`peek-rival-${W}`);
  await ev(`document.querySelector('#pf-peek .pf-peek-ok').click()`); await sleep(300);
  await ev(`(() => { const r = document.querySelector('.pf-tab .rk-fila.yo[data-peek]'); r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`); await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'); return !!p && !p.querySelector('.pf-peek-kicker') && !/Así te ven/.test(p.textContent) && p.querySelector('.pf-peek-name').textContent.includes('Javi') && p.querySelectorAll('.pf-peek-stats .pf-stat').length === 3 && p.querySelectorAll('.pf-peek-badges li').length > 0 && !p.querySelector('.pf-peek-hidden'); })()`), `${W}: 👀 your own name (Enter works too) opens exactly the sheet others see, your activity shown by default`);
  await b.shot(`peek-you-${W}`);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`); await sleep(300);
  ok(await ev(`!document.getElementById('pf-peek')`), `${W}: 👀 Escape closes it`);
  await ev(`document.querySelector('[data-tab=settings]').click()`); await sleep(800);
  ok(await ev(`!!document.querySelector('.pf-settings .lang-toggle') && !!document.querySelector('.pf-settings .sound-toggle') && !!document.querySelector('#pf-account') && !document.querySelector('.pf-tab .rk-yo')`), `${W}: ⚙️ has your account, the language and the sound`);
  ok(await ev(`!document.querySelector('#pf-page .offline-ready')`), `${W}: ⚙️ has no offline ☁️: it stays on the home page`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: settings, no sideways scroll`);
  const s2 = await small(b);
  ok(!s2, `${W}: settings, every tappable thing is 44 px or more${s2 ? ` (${s2})` : ''}`);
  await full(b, `settings-${W}`, W);
  // 👁️ Your public profile (D-605): no switch and no bubble, only «Ver cómo me ven los demás», which opens exactly the sheet others see
  ok(await ev(`!document.querySelector('.pf-public .switch, .pf-public-bubble') && !!document.querySelector('.pf-public .pf-see-public')`), `${W}: 👁️ your public profile has no switch: nothing to hide`);
  await ev(`document.querySelector('.pf-public').scrollIntoView({ block: 'center' })`); await sleep(300);
  await b.shot(`public-${W}`);
  await ev(`document.querySelector('.pf-public .pf-see-public').click()`); await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'); return !!p && !p.querySelector('.pf-peek-kicker') && !/Así te ven/.test(p.textContent) && p.querySelectorAll('.pf-peek-stats .pf-stat').length === 3 && p.querySelectorAll('.pf-peek-games li').length === 3 && !p.querySelector('.pf-peek-hidden'); })()`), `${W}: 👁️ «Ver cómo me ven los demás» shows exactly the sheet others see, with your activity`);
  await b.shot(`peek-open-${W}`);
  await ev(`document.querySelector('#pf-peek .pf-peek-ok').click()`); await sleep(300);
  // 🎖️ The pill's bubble: shown until the profile is opened or ✕ (?profile-intro=demo shows it again)
  await b.go(`${SITE}/?test`, 3000);
  ok(await ev(`!document.getElementById('pf-bubble')`), `${W}: 🎖️ no bubble once the profile was opened`);
  // A guest never gets it (the owner, 2026-11-23)
  await ev(`localStorage.setItem('e2e-yo', localStorage.getItem('juegos-de-salon:jugador') || ''); localStorage.removeItem('juegos-de-salon:jugador')`);
  await b.go(`${SITE}/?test&profile-intro=demo`, 4500);
  ok(await ev(`!document.getElementById('pf-bubble') && !!document.querySelector('.topbar .pf-home')`), `${W}: 🎖️ a guest gets no bubble, only the pill`);
  await ev(`localStorage.getItem('e2e-yo') && localStorage.setItem('juegos-de-salon:jugador', localStorage.getItem('e2e-yo')); localStorage.removeItem('e2e-yo')`);
  await b.go(`${SITE}/?test&profile-intro=demo`, 3500);
  ok(await ev(`document.querySelectorAll('.shelf').length > 0`), `${W}: 🎖️ the home page is the icon view (home-carousels)`);
  ok(await ev(`(() => { const x = document.getElementById('pf-bubble')?.getBoundingClientRect(), p = document.querySelector('.topbar .pf-home').getBoundingClientRect(); return !!x && x.left >= 0 && x.right <= ${W} && x.top > p.bottom && x.top - p.bottom < 24 && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: 🎖️ the bubble rises right under the pill and fits the screen`);
  await sleep(700); await b.shot(`bubble-${W}`);
  ok(await ev(`(() => { const x = document.querySelector('.pf-bubble-x'); return x.offsetWidth >= 44 && x.offsetHeight >= 44; })()`), `${W}: 🎖️ its ✕ is 44 px`);
  ok(await ev(`(() => { const b = document.getElementById('pf-bubble'), t = b.querySelector('.pf-bubble-txt'), x = b.querySelector('.pf-bubble-x'); let w = 0; for (const c of t.children) { const r = document.createRange(); r.selectNodeContents(c); for (const q of r.getClientRects()) w = Math.max(w, q.right); } const tb = b.querySelector('b'), lh = parseFloat(getComputedStyle(tb).lineHeight) || 20; return x.getBoundingClientRect().left - w < 16 && tb.getBoundingClientRect().height < lh * 1.5 && b.getBoundingClientRect().height < 110 && !b.querySelector('b').textContent.includes('\\n'); })()`), `${W}: 🎖️ the bubble is as wide as its text: no empty band before the ✕`);
  await ev(`document.querySelector('.pf-bubble-x').click()`); await sleep(400);
  ok(await ev(`!document.getElementById('pf-bubble') && !!localStorage.getItem('juegos-de-salon:profile-bubble')`), `${W}: 🎖️ ✕ closes it for good`);
  await b.go(`${SITE}/?test`, 3000);
  ok(await ev(`!document.getElementById('pf-bubble')`), `${W}: 🎖️ and it does not come back`);
  // The home page's top bar
  ok(await ev(`(() => { const a = document.getElementById('btn-rankings'); return a.classList.contains('pf-home') && a.getAttribute('href') === 'profile/' && a.querySelector('.pf-home-name')?.textContent === 'Javi' && !!a.querySelector('.pf-home-flag')?.textContent && a.querySelector('.pf-home-go')?.textContent === '›' && !a.textContent.includes('🔥'); })()`), `${W}: on the home page 🏅 is a pill with the player's flag, name and ›, no streak (Uno al día's card has it), to /profile/`);
  ok(await ev(`!!document.querySelector('#offline-ready-slot')`), `${W}: offline mode's ☁️ stays on the home page`);
  ok(await ev(`(() => { const a = document.getElementById('btn-rankings'), t = document.querySelector('.portada-barra .tools'); return a.getBoundingClientRect().right <= t.getBoundingClientRect().right + 1 && a.scrollWidth <= a.clientWidth + 1; })()`), `${W}: the name pill fits the bar`);
  ok(await ev(`!document.getElementById('sound-slot')`), `${W}: the sound button left the home page's bar`);
  ok(await ev(`(() => { const t = [...document.querySelectorAll('.portada-barra .tools > *')].filter(x => x.offsetParent || x.id === 'share-slot'); const i = id => t.findIndex(x => x.id === id); return i('share-slot') < i('offline-ready-slot') && t[t.length - 1]?.id === 'btn-rankings'; })()`), `${W}: the home page's bar has the covers' order: share, then ☁️, the pill last`);
  ok(await ev(`(() => { const l = document.querySelector('#lang-slot .pf-lang'); return !!l && !document.querySelector('#lang-slot > .lang-toggle') && l.querySelector('.icon-btn').textContent.includes('▾'); })()`), `${W}: the home page's language is one flag with a ▾`);
  await b.shot(`home-${W}`);
  await ev(`document.querySelector('.pf-lang .icon-btn').click()`); await sleep(300);
  ok(await ev(`(() => { const p = document.querySelector('.pf-lang .lang-pop'); if (!p || p.hidden) return false; const r = p.getBoundingClientRect(); return p.querySelectorAll('button').length === 3 && r.left >= 0 && r.right <= ${W}; })()`), `${W}: its ▾ opens the three languages, inside the screen`);
  await b.shot(`home-lang-${W}`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: home, no sideways scroll`);
  // Every other page's top bar: a game's cover, Uno al día, Rankings
  for (const page of ['queens', 'today', 'records']) {
    await b.go(`${SITE}/${page}/?test`, 3000);
    ok(await ev(`(() => { const t = document.querySelector('.topbar .tools'), a = t?.querySelector('.pf-home'); if (!a || t.lastElementChild !== a || !/\\/profile\\/$/.test(a.getAttribute('href'))) return false; const r = a.getBoundingClientRect(), tr = document.querySelector('.topbar').getBoundingClientRect(); return r.right <= tr.right + 1 && r.height >= 43.5 && r.width >= 43.5 && Math.abs(r.top - t.getBoundingClientRect().top) < 2; })()`), `${W}: /${page}/ ends its top bar with the profile's pill, on the same row, 44 px or more`);
    ok(await ev(`${W} >= 375 ? document.querySelector('.topbar .pf-home-name')?.textContent === 'Javi' : getComputedStyle(document.querySelector('.topbar .pf-home-icon')).display !== 'none' && getComputedStyle(document.querySelector('.topbar .pf-home-name')).display === 'none'`), `${W}: /${page}/'s pill shows ${W >= 375 ? 'the name' : '👤, no initial'}`);
    ok(await ev(`(() => { const l = document.querySelectorAll('.topbar .lang-btn'); return l.length === 1 && l[0].classList.contains('pf-lang') && !document.querySelector('.topbar .lang-toggle:not(.lang-pop .lang-toggle)'); })()`), `${W}: /${page}/'s language is one flag button`);
    await ev(`document.querySelector('.topbar .pf-lang .icon-btn').click()`); await sleep(300);
    ok(await ev(`(() => { const p = document.querySelector('.topbar .lang-pop'); if (!p || p.hidden) return false; const r = p.getBoundingClientRect(); return r.left >= 0 && r.right <= ${W}; })()`), `${W}: /${page}/'s language opens inside the screen`);
    await ev(`document.body.click()`);
    ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: /${page}/, no sideways scroll`);
    await b.shot(`${page}-${W}`);
  }
  await b.go(`${SITE}/queens/?test`, 3000);
  // Signed out elsewhere, a page brought back with ‹ (the browser's back-forward cache) says «Entrar» (the owner, 2026-11-22)
  ok(await ev(`(async () => { const k = 'juegos-de-salon:jugador', v = localStorage.getItem(k); localStorage.removeItem(k); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await new Promise(r => setTimeout(r, 100)); const ok = document.querySelector('.topbar .pf-home-name')?.textContent === 'Entrar' && !document.documentElement.classList.contains('pf-signed'); localStorage.setItem(k, v); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await new Promise(r => setTimeout(r, 100)); return ok && document.querySelector('.topbar .pf-home-name')?.textContent === 'Javi'; })()`), `${W}: a page brought back after signing out says «Entrar», and the name once signed in again`);
  ok(await ev(`!document.getElementById('btn-cuenta')?.offsetParent && !document.querySelector('main .rk-yo')?.offsetParent`), `${W}: a signed-in player's cover has no «🏅 <name>» button: the PIN is in the profile`);
  // 👤 Your account (D-600): change the name and the PIN with the PIN, then sign out
  await b.go(`${SITE}/profile/?test#settings`, 3000);
  const fill = (id, v) => ev(`(() => { const i = document.getElementById('${id}'); i.value = '${v}'; i.dispatchEvent(new Event('input')); })()`);
  const rows = () => ev(`[...document.querySelectorAll('#pf-account .pf-change')].length`);
  ok(await rows() === 2, `${W}: 👤 the name and the PIN each have «Cambiar»`);
  await ev(`document.querySelectorAll('#pf-account .pf-change')[0].click()`); await sleep(200);
  ok(await ev(`!document.querySelector('#pf-account .pf-form').hidden && document.activeElement?.id === 'pf-new-name'`), `${W}: «Cambiar» opens the name's form`);
  await full(b, `account-name-${W}`, W);
  const s3 = await small(b);
  ok(!s3, `${W}: account, every tappable thing is 44 px or more${s3 ? ` (${s3})` : ''}`);
  await fill('pf-new-name', 'Javiera'); await fill('pf-name-pin', '9999');
  await ev(`document.getElementById('pf-save-name').click()`); await sleep(1500);
  ok(await ev(`document.querySelector('#pf-account .rk-error')?.textContent.length > 0 && document.querySelector('.pf-player').textContent.includes('Javi') && !document.querySelector('.pf-player').textContent.includes('Javiera')`), `${W}: a wrong PIN renames nothing and says so`);
  await sleep(5600);
  await fill('pf-name-pin', '1234');
  await ev(`document.getElementById('pf-save-name').click()`); await sleep(2500);
  ok(await ev(`document.querySelector('.pf-player')?.textContent.includes('Javiera') && /Javiera/.test(document.getElementById('pf-renamed')?.textContent || '')`), `${W}: the PIN renames: the card shows the new name and says so`);
  await sleep(5600);
  await ev(`document.querySelectorAll('#pf-account .pf-change')[1].click()`); await sleep(200);
  await fill('pf-pin-current', '1234'); await fill('pf-pin-new', '4321');
  await ev(`document.getElementById('pf-save-pin').click()`); await sleep(2500);
  ok(await ev(`document.querySelectorAll('#pf-account .pf-form')[1].querySelector('.rk-ok')?.textContent.length > 0`), `${W}: the current PIN changes the PIN`);
  await ev(`document.getElementById('pf-logout').click()`); await sleep(200);
  ok(await ev(`!document.querySelector('.pf-logout-ask').hidden`), `${W}: «Salir de tu cuenta» asks once`);
  await b.shot(`account-logout-${W}`);
  await ev(`document.getElementById('pf-logout-yes').click()`); await sleep(1500);
  ok(await ev(`!localStorage.getItem('juegos-de-salon:jugador') && !document.getElementById('pf-account') && !!document.querySelector('#rk-entrar')`), `${W}: signing out leaves the page as a guest's, which invites to sign in`);
  await sleep(5600);
  await ev(`(async () => { const { jugador } = await import('/assets/js/jugador.js'); window.__r = (await (await jugador()).entrar('Javiera', '4321')).estado; })()`); await sleep(1500);
  ok(await ev(`window.__r === 'dentro'`), `${W}: the new name and the new PIN sign in again`);
  b.close();
}
console.log(failures ? `✗ profile page: ${failures} failure(s)` : '✓ profile page');
process.exit(failures ? 1 : 0);
