/**
 * The stall guard: a page whose modules never started (a file that never arrived on a stuck
 * connection) shows a way out instead of an empty screen forever (the owner, 2026-11-25: La Copa
 * stuck on «…» and Uno al día blank).
 *
 * A classic script, like vigia.js, which it reads: "started" is `__vigia.listoEn`, set by
 * trackVisit. After 1.5 s without starting it shows the waiting spinner (base.css's
 * `.waiting--screen`, the owner 2026-11-25: a blank page did not read as waiting); after 10 s in view without starting, it puts a notice and a button that reloads the
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
  // What the wait is "doing", one line at a time under the spinner (the owner, 2026-11-25: a fun wait
  // until the error comes). La Copa's «…» (waiting.js) uses them too, through G.funLine.
  var FUN = {
    es: ['Soplando los dados para la suerte…', 'Polvitos de misericoco, que tú no ves ni yo tampoco…', 'Peinando a las marionetas…', 'Esternocleidomastoideando…', 'Sobornando al dado con un caramelo…',
      'Sacando la ficha que se cayó bajo el sillón…', 'Discutiendo quién parte…', 'Despertando al árbitro…', 'Leyendo las reglas por primera vez…',
      'Escondiendo el comodín en la manga…', 'Revisando que nadie haga trampa (tú no)…', 'Buscando un lápiz que escriba…',
      'Ensayando la cara de póker…', 'Pidiéndole revancha a la abuela…', 'Contando las cartas… otra vez…', 'Calentando la silla de la suerte…'],
    en: ['Blowing on the dice for luck…', 'Misericoco dust, you can\'t see it and neither can I…', 'Combing the puppets…', 'Sternocleidomastoiding…', 'Bribing the die with a candy…',
      'Fishing the lost piece out from under the couch…', 'Arguing about who goes first…', 'Waking up the referee…', 'Reading the rules for the first time…',
      'Hiding the joker up a sleeve…', 'Checking nobody cheats (not you)…', 'Looking for a pencil that works…',
      'Practising the poker face…', 'Asking Grandma for a rematch…', 'Counting the cards… again…', 'Warming up the lucky chair…'],
    pt: ['Soprando os dados para dar sorte…', 'Pozinho de misericoco, que você não vê nem eu tampouco…', 'Penteando as marionetes…', 'Esternocleidomastoideando…', 'Subornando o dado com uma bala…',
      'Tirando a peça que caiu debaixo do sofá…', 'Discutindo quem começa…', 'Acordando o juiz…', 'Lendo as regras pela primeira vez…',
      'Escondendo o curinga na manga…', 'Conferindo se ninguém trapaceia (você não)…', 'Procurando um lápis que escreva…',
      'Treinando a cara de paisagem…', 'Pedindo revanche para a vovó…', 'Contando as cartas… de novo…', 'Esquentando a cadeira da sorte…'],
  };
  var G = w.__stallGuard = { shown: false, MS: MS, TEXTS: TEXTS, FUN: FUN };

  /** A line that shows after 2.5 s and then changes every 2 s, from a random start, never the same twice in a row; it stops once off the page. */
  G.funLine = function (l) {
    var list = FUN[l] || FUN[lang()];
    var i = Math.floor(Math.random() * list.length);
    var p = d.createElement('p');
    p.className = 'waiting-fun';
    p.setAttribute('aria-live', 'polite');
    // The first line only after 2.5 s of spinner: most waits end before it and nothing distracts
    var t = null;
    setTimeout(function () {
      if (!p.isConnected) return;
      p.textContent = list[i];
      t = setInterval(next, 2000);
    }, 2500);
    function next() {
      if (!p.isConnected) { clearInterval(t); return; }
      i = (i + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
      p.textContent = list[i];
    }
    return p;
  };

  function lang() {
    try { var v = localStorage.getItem('juegos-de-salon:lang'); if (TEXTS[v]) return v; } catch (_) { /* no storage */ }
    return 'es';
  }
  function started() { return !!(w.__vigia && w.__vigia.listoEn !== null); }

  var spinner = null;
  function dropSpinner() { if (spinner && spinner.parentNode) spinner.parentNode.removeChild(spinner); spinner = null; }
  function watchStart(node) {
    var t = setInterval(function () { if (started()) { clearInterval(t); if (node.parentNode) node.parentNode.removeChild(node); } }, 300);
  }
  setTimeout(function () {
    if (started() || G.shown) return;
    var main = d.querySelector('main') || d.body;
    if (!main) return;
    spinner = d.createElement('div');
    spinner.className = 'waiting waiting--screen waiting--center';
    spinner.id = 'stall-wait';
    spinner.setAttribute('role', 'status');
    spinner.appendChild(G.funLine());
    main.appendChild(spinner);
    watchStart(spinner);
  }, 1500);

  G.show = function () {
    if (G.shown || started()) return;
    var main = d.querySelector('main') || d.body;
    if (!main) return;
    G.shown = true;
    dropSpinner();
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
    watchStart(box);
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
