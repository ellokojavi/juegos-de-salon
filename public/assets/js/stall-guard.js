/**
 * The stall guard: a page whose modules never started (a file that never arrived on a stuck
 * connection) shows a way out instead of an empty screen forever (the owner, 2026-11-25: La Copa
 * stuck on «…» and Uno al día blank).
 *
 * A classic script, like vigia.js, which it reads: "started" is `__vigia.listoEn`, set by
 * trackVisit. After 10 s in view without starting, it puts a notice and a button that reloads the
 * page at the end of the page's <main>. Written without `?.` or `??`, so an old Safari reads it, and
 * it imports nothing: the texts are here, in the three languages (C-3), by the language i18n.js keeps.
 */
(function () {
  'use strict';
  var w = window, d = document;
  if (w.__stallGuard) return;
  var MS = 10000;
  var TEXTS = {
    es: { msg: 'No pudimos cargar la página. Revisa tu conexión y vuelve a intentarlo.', retry: 'Intentar de nuevo' },
    en: { msg: 'We couldn\'t load the page. Check your connection and try again.', retry: 'Try again' },
    pt: { msg: 'Não conseguimos carregar a página. Confira sua conexão e tente de novo.', retry: 'Tentar de novo' },
  };
  var G = w.__stallGuard = { shown: false, MS: MS, TEXTS: TEXTS };

  function lang() {
    try { var v = localStorage.getItem('juegos-de-salon:lang'); if (TEXTS[v]) return v; } catch (_) { /* no storage */ }
    return 'es';
  }
  function started() { return !!(w.__vigia && w.__vigia.listoEn !== null); }

  G.show = function () {
    if (G.shown || started()) return;
    var main = d.querySelector('main') || d.body;
    if (!main) return;
    G.shown = true;
    var T = TEXTS[lang()];
    var box = d.createElement('div');
    box.className = 'panel center';
    box.id = 'stall-guard';
    box.setAttribute('role', 'alert');
    var p = d.createElement('p');
    p.textContent = T.msg;
    var b = d.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--yellow';
    b.textContent = T.retry;
    b.addEventListener('click', function () { location.reload(); });
    box.appendChild(p);
    box.appendChild(b);
    main.appendChild(box);
    // Started late after all: the page draws itself and the notice goes
    var t = setInterval(function () { if (started()) { clearInterval(t); if (box.parentNode) box.parentNode.removeChild(box); } }, 500);
  };

  // Only a page that was in view: one opened in the background waits until it is seen
  function check() {
    if (started()) return;
    if (d.visibilityState === 'hidden') {
      d.addEventListener('visibilitychange', function again() {
        if (d.visibilityState === 'hidden') return;
        d.removeEventListener('visibilitychange', again);
        setTimeout(check, MS);
      });
      return;
    }
    G.show();
  }
  setTimeout(check, MS);
}());
