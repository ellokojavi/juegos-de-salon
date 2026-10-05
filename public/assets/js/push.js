/**
 * Los avisos al celular (Web Push, D-221, D-223): qué puede hacer este celular, el permiso, la
 * suscripción y el aviso de prueba. Sin pantalla: la pone La Copa (cup/avisos.js).
 *
 * El camino depende del celular (docs/PWA-NOTIFICACIONES.md):
 *   'push'      Android, computador, o iPhone con la app ya instalada: se pide el permiso y listo.
 *   'instalar'  iPhone en Safari (o Chrome): los avisos llegan solo a la app de la pantalla de inicio.
 *   'otra-app'  iPhone dentro de WhatsApp, Instagram u otra app: ahí no se puede instalar.
 *   'no'        el navegador no tiene avisos: no se ofrecen.
 */
import { VAPID_PUBLICA } from './vapid.js';
import { envOf } from './transport/stats.js';

/**
 * Mientras no se manden avisos de verdad (PR 3), ofrecerlos prometería algo que no llega: se ven
 * solo en los celulares que los activaron en /labs/ y en el sitio local (como los rankings, D-212).
 */
export const AVISOS_EN_LABS = true;
export const LABS_AVISOS_KEY = 'juegos-de-salon:labs-avisos';

/**
 * La clave pública: la de vapid.js, o —solo en el sitio local— una de prueba guardada en el
 * navegador (`juegos-de-salon:vapid-prueba`), para probar sin la clave del dueño (tools/e2e/cup/avisos.mjs).
 */
export const VAPID_PRUEBA_KEY = 'juegos-de-salon:vapid-prueba';
export function clavePublica({ storage = globalThis.localStorage, loc = globalThis.location } = {}) {
  if (VAPID_PUBLICA) return VAPID_PUBLICA;
  try { return envOf(loc || {}) === 'dev' ? storage.getItem(VAPID_PRUEBA_KEY) || '' : ''; } catch (_) { return ''; }
}

export function avisosVisibles({ storage = globalThis.localStorage, loc = globalThis.location, clave = clavePublica({ storage, loc }) } = {}) {
  if (!clave) return false;
  if (!AVISOS_EN_LABS) return true;
  try { return envOf(loc || {}) === 'dev' || storage.getItem(LABS_AVISOS_KEY) === '1'; } catch (_) { return false; }
}

export function activarAvisos(si, storage = globalThis.localStorage) {
  try { if (si) storage.setItem(LABS_AVISOS_KEY, '1'); else storage.removeItem(LABS_AVISOS_KEY); } catch (_) { /* sin memoria */ }
}

/** Las apps que abren los links con su propio navegador, donde no se puede agregar a inicio. */
const OTRA_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Messenger|TikTok|Snapchat|Twitter|LinkedInApp|GSA\//;

/** Lo que hace falta saber del celular, leído una vez. Se pasa entero en las pruebas. */
export function celular({ nav = globalThis.navigator, win = globalThis.window } = {}) {
  const ua = String(nav?.userAgent || '');
  // El iPad con iPadOS se presenta como Mac: se reconoce por la pantalla táctil
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints || 0) > 1);
  const v = /OS (\d+)_(\d+)/.exec(ua);
  const version = v ? Number(v[1]) + Number(v[2]) / 100 : 0;
  const instalada = !!(nav?.standalone || win?.matchMedia?.('(display-mode: standalone)')?.matches);
  return {
    ios,
    version,
    instalada,
    otraApp: OTRA_APP.test(ua),
    push: !!(nav?.serviceWorker && win?.PushManager && win?.Notification),
  };
}

export function camino(c) {
  if (c.push && !(c.ios && c.otraApp)) return 'push';
  if (!c.ios) return 'no';
  if (c.otraApp) return 'otra-app';
  // Agregar a inicio con avisos llegó con iOS 16.4
  if (!c.instalada && (c.version === 0 || c.version >= 16.04)) return 'instalar';
  return 'no';
}

/** 'granted' · 'denied' · 'default' (todavía no se pregunta). */
export const permiso = (win = globalThis.window) => win?.Notification?.permission || 'denied';

/** El diálogo del sistema. Solo se llama después de que la persona tocó "Avisarme". */
export async function pedirPermiso(win = globalThis.window) {
  try { return await win.Notification.requestPermission(); } catch (_) { return permiso(win); }
}

/** La clave VAPID va al navegador como bytes; en el código vive en base64url. */
export function bytesDeClave(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64url.length % 4)) % 4);
  const bin = globalThis.atob(b64);
  return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}

/** La suscripción de este celular: la que ya tenía, o una nueva. `{ endpoint, keys: { p256dh, auth } }`. */
export async function suscribir({ nav = globalThis.navigator, clave = clavePublica() } = {}) {
  const reg = await nav.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesDeClave(clave) });
  return sub.toJSON();
}

/** Anula la suscripción de este celular (la próxima `suscribir` trae otra, con otro endpoint). */
export async function anular({ nav = globalThis.navigator } = {}) {
  try {
    const reg = await nav.serviceWorker.getRegistration();
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch (_) { /* no había */ }
}

/** La suscripción de este celular si ya existe, sin pedir nada. */
export async function suscripcionActual({ nav = globalThis.navigator } = {}) {
  try {
    const reg = await nav.serviceWorker.getRegistration();
    return (await reg?.pushManager?.getSubscription())?.toJSON() || null;
  } catch (_) { return null; }
}

/**
 * El nombre corto de una suscripción: los primeros 32 caracteres del sha256 de su endpoint. Así un
 * celular que se suscribe dos veces queda una sola vez, y la ruta de la base no lleva la dirección.
 */
export async function subIdDe(endpoint, subtle = globalThis.crypto.subtle) {
  const h = await subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/** Lo que se guarda de una suscripción (la base valida la forma, D-223). */
export function paraGuardar(sub, { lang, tz }) {
  return {
    endpoint: String(sub.endpoint),
    keys: { p256dh: String(sub.keys?.p256dh || ''), auth: String(sub.keys?.auth || '') },
    lang,
    tz: String(tz || 'UTC').slice(0, 64),
  };
}

/** La zona del celular: los avisos llegan en su hora, no en la de la copa. */
export const zonaHoraria = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (_) { return 'UTC'; } };

/**
 * El aviso que el celular se manda a sí mismo al activar los avisos, y el de "Probar los avisos":
 * muestra cómo se verán y confirma que funcionan, sin pasar por el servidor.
 */
export async function avisoDePrueba({ titulo, texto, url, nav = globalThis.navigator, raiz = new URL('../../', import.meta.url) }) {
  const reg = await nav.serviceWorker.ready;
  await reg.showNotification(titulo, {
    body: texto,
    icon: new URL('assets/icons/icon-192.png', raiz).pathname,
    tag: 'prueba',
    data: { url },
  });
}
