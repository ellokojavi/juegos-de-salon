/**
 * El service worker de la app (D-221). Vive en la raíz para que su alcance sea todo el sitio.
 *
 * No toca la red ni guarda nada: sin evento `fetch`, cada página se pide igual que sin él, y
 * ningún celular puede quedar pegado con una versión vieja del sitio. Un modo sin conexión (RP-13)
 * sería otro paso, con su propio cuidado.
 *
 * Muestra los avisos de La Copa (D-223) y, al tocarlos, abre la copa en el día que toca: enfoca
 * la pestaña de la app si ya está abierta, o abre una. En Android, los botones del aviso (D-229)
 * abren su propia dirección: Jugar, el día; Silenciar esta copa, la copa con `&mute`.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/** Un aviso llega como JSON: `{ title, body, url, tag, acciones? }`. Lo que no se entiende no se muestra. */
self.addEventListener('push', e => {
  let a = null;
  try { a = e.data ? e.data.json() : null; } catch (_) { a = null; }
  if (!a || !a.title) return;
  const acciones = Array.isArray(a.acciones) ? a.acciones.filter(x => x && x.action && x.title).slice(0, 2) : [];
  // El aviso de Uno al día pone el globo del ícono (un 1: falta jugar el de hoy, D-230)
  if (String(a.tag || '').startsWith('uad-dia') && self.navigator?.setAppBadge) self.navigator.setAppBadge(1).catch(() => {});
  e.waitUntil(self.registration.showNotification(a.title, {
    body: a.body || '',
    icon: 'assets/icons/icon-192.png',
    tag: a.tag || undefined,
    renotify: !!a.tag,
    actions: acciones.map(({ action, title }) => ({ action, title })),
    data: { url: a.url || './', acciones: Object.fromEntries(acciones.map(x => [x.action, x.url || a.url || './'])) },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const datos = e.notification.data || {};
  const url = new URL((e.action && datos.acciones?.[e.action]) || datos.url || './', self.registration.scope).href;
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
