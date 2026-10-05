/**
 * La app instalable (D-221). Lo importa cada página que lleva el manifest:
 *
 * - Le pone a la app el nombre del idioma elegido (D-222): "Juegos de Salón", "Party Games",
 *   "Jogos de Salão" o "Salonspiele". Android lo toma del manifest, que hay uno por idioma
 *   (`manifest.<idioma>.webmanifest`; el español es `manifest.webmanifest`), y el iPhone de
 *   `apple-mobile-web-app-title`, que si no está usa el título de la página ("El Ahorcado 🪢 · …").
 * - Registra el service worker de la raíz (`/sw.js`).
 *
 * Mejor esfuerzo: si el navegador no tiene service workers, o algo falla, la página sigue igual.
 */
import { COMMON, getLang } from './i18n.js';

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

if (globalThis.window?.addEventListener) {
  try { nombrar(); } catch (_) { /* el nombre queda el del español */ }
  if (document.readyState === 'complete') registrar();
  else window.addEventListener('load', () => registrar(), { once: true });
}
