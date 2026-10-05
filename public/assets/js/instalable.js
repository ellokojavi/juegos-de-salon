/**
 * Registra el service worker de la raíz (`/sw.js`, D-220). Lo importa cada página que lleva el
 * manifest: con los dos, la app se puede instalar en el celular.
 *
 * Mejor esfuerzo y después de cargar: si el navegador no tiene service workers, o el registro
 * falla, la página sigue igual.
 */
export const RAIZ = new URL('../../', import.meta.url);

export function registrar({ nav = globalThis.navigator, raiz = RAIZ } = {}) {
  if (!nav?.serviceWorker) return Promise.resolve(null);
  return nav.serviceWorker.register(new URL('sw.js', raiz).pathname, { scope: raiz.pathname })
    .catch(() => null);
}

if (globalThis.window?.addEventListener) {
  if (document.readyState === 'complete') registrar();
  else window.addEventListener('load', () => registrar(), { once: true });
}
