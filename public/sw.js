/**
 * El service worker de la app (D-221). Vive en la raíz para que su alcance sea todo el sitio.
 *
 * No toca la red ni guarda nada: sin evento `fetch`, cada página se pide igual que sin él, y
 * ningún celular puede quedar pegado con una versión vieja del sitio. Un modo sin conexión (RP-13)
 * sería otro paso, con su propio cuidado.
 *
 * Muestra los avisos de La Copa (D-223) y, al tocarlos, abre la copa en el día que toca: enfoca
 * la pestaña de la app si ya está abierta, o abre una.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/** Un aviso llega como JSON: `{ title, body, url, tag }`. Lo que no se entiende no se muestra. */
self.addEventListener('push', e => {
  let a = null;
  try { a = e.data ? e.data.json() : null; } catch (_) { a = null; }
  if (!a || !a.title) return;
  e.waitUntil(self.registration.showNotification(a.title, {
    body: a.body || '',
    icon: 'assets/icons/icon-192.png',
    tag: a.tag || undefined,
    renotify: !!a.tag,
    data: { url: a.url || './' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const misma = abiertas.find(c => c.url === url) || abiertas.find(c => new URL(c.url).origin === self.location.origin);
    if (misma) {
      if (misma.url !== url && 'navigate' in misma) await misma.navigate(url);
      return misma.focus();
    }
    return self.clients.openWindow(url);
  })());
});
