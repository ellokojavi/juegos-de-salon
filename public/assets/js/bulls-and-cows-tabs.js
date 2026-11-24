/**
 * Toque y Fama's 🔢 Número and 🔤 Palabra as two tabs of one page (#767 follow-up): the toggle
 * swaps the page in place instead of loading the other one. Número is this folder's game and
 * Palabra is La Copa's standalone page (/word/), two different engines, so a tab change fetches
 * the other page's HTML (precached by the service worker), puts its stylesheets and its body in,
 * runs a fresh copy of its entry module, and pushes its URL; the phone's Back button swaps back.
 * Wrapped in a view transition, the old screen stays until the new one has drawn and the top bar
 * does not move. Anything that fails falls back to a normal page load.
 */
let vez = 0;
let enCurso = false;
let montada = location.pathname;   // the tab on screen

const marcarBarra = () => { const b = document.querySelector('.topbar'); if (b) b.style.viewTransitionName = 'tyf-topbar'; };

async function cambiar(url, { push = true } = {}) {
  if (enCurso) return;
  enCurso = true;
  const destino = new URL(url, location.href);
  try {
    const res = await fetch(destino.pathname, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(String(res.status));
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    // The body's module scripts: the game's entry (`import './game.js'`) and the cover's footer
    const scripts = [...doc.body.querySelectorAll('script[type="module"]')].map(x => x.textContent);
    const modulo = scripts.map(t => t.match(/^\s*import\s+['"]([^'"]+)['"];?\s*$/)?.[1]).find(Boolean);
    if (!modulo) throw new Error('no entry module');
    const entrada = new URL(modulo, destino);
    entrada.searchParams.set('tab', String(++vez));   // a new copy of the module: an imported one never runs again

    // The new page's stylesheets, loaded before anything changes on screen
    const href = l => new URL(l.getAttribute('href'), destino).href;
    const nuevas = [...doc.querySelectorAll('head link[rel="stylesheet"]')].map(href);
    const viejas = [...document.querySelectorAll('head link[rel="stylesheet"]')];
    const tengo = new Set(viejas.map(l => l.href));
    await Promise.all(nuevas.filter(h => !tengo.has(h)).map(h => new Promise(ok => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = h; l.onload = l.onerror = ok;
      document.head.append(l);
    })));

    const poner = async () => {
      for (const l of viejas) if (!nuevas.includes(l.href)) l.remove();
      document.title = doc.title;
      for (const a of [...document.body.attributes]) document.body.removeAttribute(a.name);
      for (const a of [...doc.body.attributes]) document.body.setAttribute(a.name, a.value);
      document.body.replaceChildren(...[...doc.body.childNodes].filter(n => n.nodeName !== 'SCRIPT').map(n => document.importNode(n, true)));
      if (push) history.pushState({ tyfTab: true }, '', destino.pathname + location.search);
      montada = destino.pathname;
      window.scrollTo(0, 0);
      marcarBarra();
      await import(entrada.href);
      // The rest (the footer) run as they would on load, relative to the URL just pushed
      for (const t of scripts) if (!t.match(/^\s*import\s+['"]/)) {
        const x = document.createElement('script'); x.type = 'module'; x.textContent = t; document.body.append(x);
      }
    };
    const quieto = !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) await poner();
    else { marcarBarra(); await document.startViewTransition(poner).updateCallbackDone; }
  } catch (_) {
    location.href = destino.pathname + location.search;
  } finally {
    enCurso = false;
  }
}

/** Opens the other tab: `numero` (/bulls-and-cows/) or `palabra` (/word/). */
export function abrirTab(tab) {
  // Relative: the two folders are siblings, also on a PR preview under a subpath
  cambiar(new URL(tab === 'palabra' ? '../word/' : '../bulls-and-cows/', location.href).href);
}

// Back and Forward between the two tabs swap in place too (registered once, whichever tab loaded first)
if (!window.__tyfTabs) {
  window.__tyfTabs = true;
  addEventListener('popstate', () => {
    if (location.pathname !== montada && /\/(word|bulls-and-cows)\/$/.test(location.pathname)) cambiar(location.href, { push: false });
  });
}
