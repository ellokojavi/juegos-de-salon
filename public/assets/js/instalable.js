/**
 * La app instalable (D-221). Lo importa cada página que lleva el manifest:
 *
 * - Le pone a la app el nombre del idioma elegido (D-222): "Juegos de Salón", "Parlor Games",
 *   "Jogos de Salão" o "Salonspiele". Android lo toma del manifest, que hay uno por idioma
 *   (`manifest.<idioma>.webmanifest`; el español es `manifest.webmanifest`), y el iPhone de
 *   `apple-mobile-web-app-title`, que si no está usa el título de la página ("El Ahorcado 🪢 · …").
 * - Registra el service worker de la raíz (`/sw.js`).
 * - Trae `llegada.js`: el juego que abre el dado del menú abre con el mismo dado encima, hasta
 *   que está dibujado (D-237).
 *
 * Mejor esfuerzo: si el navegador no tiene service workers, o algo falla, la página sigue igual.
 */
import './offline-cut.js'; // first: a tester's forced offline mode cuts the network before anything asks for it
import { COMMON, getLang } from './i18n.js';
import './llegada.js'; // el dado de Juego al azar, encima hasta que el juego está dibujado (D-237)

export const RAIZ = new URL('../../', import.meta.url);

/** El manifest de un idioma, relativo a la raíz del sitio. */
export const manifestDe = lang => (lang === 'es' ? 'manifest.webmanifest' : `manifest.${lang}.webmanifest`);

export function nombrar({ doc = globalThis.document, lang = getLang(), raiz = RAIZ } = {}) {
  const nombre = (COMMON[lang] || COMMON.es).appTitle;
  const link = doc?.querySelector('link[rel="manifest"]');
  if (!link) return null;
  link.href = new URL(manifestDe(COMMON[lang] ? lang : 'es'), raiz).href;
  let meta = doc.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!meta) {
    meta = doc.createElement('meta');
    meta.name = 'apple-mobile-web-app-title';
    doc.head.appendChild(meta);
  }
  meta.content = nombre;
  return nombre;
}

export function registrar({ nav = globalThis.navigator, raiz = RAIZ } = {}) {
  if (!nav?.serviceWorker) return Promise.resolve(null);
  return nav.serviceWorker.register(new URL('sw.js', raiz).pathname, { scope: raiz.pathname })
    .catch(() => null);
}

/**
 * Offline mode (D-538, PR 2; lab: #seccion-offline): tells the service worker whether the flag
 * `offline` is on for this visitor and which release this page is, so it stores that release's
 * files, or forgets everything when the flag is off. Asked after the page has loaded, never before.
 */
export async function avisarOffline({ nav = globalThis.navigator, doc = globalThis.document, encendido } = {}) {
  const sw = await nav?.serviceWorker?.ready;
  if (!sw?.active) return null;
  const on = encendido ?? await import('./flags.js').then(m => m.flag('offline')).catch(() => false);
  const release = doc?.querySelector('meta[name="release"]')?.content || 'dev';
  const forced = (() => { try { return globalThis.localStorage?.getItem('juegos-de-salon:offline-forced') === '1'; } catch (_) { return false; } })();
  // The flag went off while a tester's cut was on: the cut goes too, or the page would stay without network
  if (!on && forced && encendido === undefined) { try { globalThis.localStorage.removeItem('juegos-de-salon:offline-forced'); } catch (_) { /* no storage */ } globalThis.location?.reload(); }
  // Remembered for each page's first inline script, which paints an offline phone in the offline palette
  if (encendido === undefined) { try { globalThis.localStorage?.setItem('juegos-de-salon:offline-flag', on ? '1' : '0'); } catch (_) { /* no storage */ } }
  const msg = { type: 'offline', on: !!on, release, forced: !!on && forced };
  sw.active.postMessage(msg);
  // With the flag on, the page also watches the connection (connection.js, PR 3) and, offline, dims
  // what needs signal and shows the chip (offline-ui.js, PR 4)
  if (on && encendido === undefined) {
    // Asks the browser not to wipe this site's storage on its own (D-538, PR 5): Safari clears it after
    // about 7 days unvisited unless the app is installed, and with it the queued scores and the player
    nav?.storage?.persist?.().catch(() => false);
    Promise.all([import('./connection.js'), import('./offline-ui.js')])
      .then(([c, ui]) => ui.startOfflineUi({ connection: c.connection() })).catch(() => {});
    // La Copa's days played offline go up when the signal is back, from whatever page is open (D-544)
    import('./cup-outbox.js').then(m => m.subirCopaAlVolver()).catch(() => {});
  }
  return msg;
}

if (globalThis.window?.addEventListener) {
  try { nombrar(); } catch (_) { /* el nombre queda el del español */ }
  const empezar = () => registrar().then(() => avisarOffline()).catch(() => {});
  if (document.readyState === 'complete') empezar();
  else window.addEventListener('load', empezar, { once: true });
}
