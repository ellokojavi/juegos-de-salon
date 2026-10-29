/**
 * The owner's release notifications (D-504): the panel's "🔔 Notify me when something goes live"
 * subscribes this device to the site's Web Push (the same as La Copa's, assets/js/push.js) and
 * keeps it in Firebase `ownerPush/<subId>`, which only the owner reads and writes. When publish.yml
 * puts a PR live (or fails to), tools/push/release.mjs sends each device there one notification
 * whose tap opens exactly what the PR launched.
 */
import { registrar } from '../assets/js/instalable.js';
import { celular, camino, permiso, pedirPermiso, suscribir, suscripcionActual, subIdDe, avisoDePrueba } from '../assets/js/push.js';

/** What is saved for a device (the rules check its shape). */
export function deviceRecord(sub, { at, device = '' }) {
  return {
    endpoint: String(sub.endpoint),
    keys: { p256dh: String(sub.keys?.p256dh || ''), auth: String(sub.keys?.auth || '') },
    at,
    ...(device ? { device: String(device).slice(0, 80) } : {}),
  };
}

/** A short name for the device, so the owner can tell their phone from their computer. */
export function deviceName(ua = '') {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Browser';
}

/**
 * Wires the button and its line of status. `save(id, record)` writes `ownerPush/<id>`; `exists(id)`
 * says whether this device is already there.
 */
/** The bell, on: it stays an icon; its name says that a tap sends a test. */
function marcarActivo(button) {
  button.dataset.on = '1';
  button.title = 'Notifications on here · tap to send a test';
  button.setAttribute('aria-label', button.title);
}

export function wireReleasePush({ button, status, save, exists }) {
  // A message shows a few seconds and goes, so the bar stays clean
  let tapa = 0;
  const say = t => { status.textContent = t; status.hidden = !t; clearTimeout(tapa); if (t) tapa = setTimeout(() => { status.hidden = true; }, 6000); };
  const way = camino(celular());
  if (way === 'no') { button.hidden = true; return; }
  registrar();
  (async () => {
    const sub = permiso() === 'granted' ? await suscripcionActual() : null;
    if (sub && await exists(await subIdDe(sub.endpoint))) { marcarActivo(button); }
  })().catch(() => {});
  button.addEventListener('click', async () => {
    if (way === 'instalar') return say('On an iPhone, notifications only reach the app on the home screen: Share → Add to Home Screen, open the panel from there, and tap again.');
    if (way === 'otra-app') return say('Open the panel in Safari, add it to the home screen, and tap again from there.');
    if (button.dataset.on === '1') {
      await avisoDePrueba({ titulo: '✅ Así llegará el aviso', texto: 'Cuando un PR quede en vivo, tócalo y te lleva directo a lo nuevo.', url: '/panel/' });
      return say('Test sent to this device.');
    }
    if (await pedirPermiso() !== 'granted') return say('Notifications are blocked for this site: allow them in the browser settings, then tap again.');
    try {
      const sub = await suscribir();
      const id = await subIdDe(sub.endpoint);
      // The server's clock, not the phone's: the rules ask `at <= now`, and a phone a few seconds ahead was refused
      await save(id, deviceRecord(sub, { at: { '.sv': 'timestamp' }, device: deviceName(navigator.userAgent) }));
      marcarActivo(button);
      say('🔔 On: this device gets a notification each time a PR goes live.');
    } catch (e) { say(`Could not turn them on: ${e?.message || e}`); }
  });
}
