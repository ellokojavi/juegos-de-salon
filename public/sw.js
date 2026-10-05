/**
 * El service worker de la app (D-220). Vive en la raíz para que su alcance sea todo el sitio.
 *
 * Por ahora no toca la red ni guarda nada: sin evento `fetch`, cada página se pide igual que sin
 * él, y ningún celular puede quedar pegado con una versión vieja del sitio. Existe para que la app
 * se pueda instalar y, más adelante, para recibir los avisos de La Copa (docs/PWA-NOTIFICACIONES.md).
 * Un modo sin conexión (RP-13) sería otro paso, con su propio cuidado.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
