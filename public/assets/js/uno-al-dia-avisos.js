/**
 * Los avisos de Uno al día en la pantalla (D-230): la oferta con la hora, la campana de /today/ y sus
 * hojas y el globo del ícono. El recordatorio de cada día es el aviso diario, a la hora que elige
 * el jugador (D-230): no hay recordatorio en el calendario. La lógica del navegador es la de La Copa
 * (push.js); lo que decide cuándo llega cada aviso, tools/push/uno-al-dia.mjs.
 *
 * Reglas de la experiencia (las de D-221, docs/PWA-NOTIFICACIONES.md):
 * - El permiso se pide solo después de un toque en una hora: el "No" del sistema es definitivo.
 * - La oferta sale la segunda vez que termina Uno al día; "Ahora no" la apaga. La campana queda siempre.
 * - En iPhone, sin la app instalada, se explica cómo agregarla; dentro de otra app, que se abra en Safari.
 * - Después de cada Uno al día, el celular le cuenta a Firebase su último día y su racha, para que el
 *   aviso sepa si ya jugó y qué racha decir.
 */
import { el } from './ui.js';
import { COMMON } from './i18n.js';
import {
  avisosVisibles, celular, camino as caminoDe, permiso, pedirPermiso, suscribir, suscripcionActual, subIdDe,
  paraGuardar, zonaHoraria, avisoDePrueba, anular,
} from './push.js';
import { estado, leer, recorrer, numDia, semanaDe } from './uno-al-dia.js';
import { trackUnoAlDia } from './transport/stats.js';

const KEY = 'juegos-de-salon:uno-al-dia:avisos';
export const HORAS = [9, 13, 19];
const textos = lang => (COMMON[lang] || COMMON.es).uad;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const conNegritas = texto => String(texto).split(/\*\*(.+?)\*\*/).map((t, i) => (i % 2 ? el('b', {}, t) : t));

export const leerAvisos = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
const guardarAvisos = x => { try { localStorage.setItem(KEY, JSON.stringify(x)); } catch (_) { /* sin memoria */ } };

/** ¿Este celular puede recibir avisos de Uno al día? (navegador, clave VAPID, laboratorio de avisos) */
export const disponible = () => { try { return avisosVisibles() && caminoDe(celular()) !== 'no'; } catch (_) { return false; } };

/** 'apagado', 'activo' o 'bloqueado'. */
export function estadoAvisos() {
  const g = leerAvisos(), cam = caminoDe(celular());
  if (cam === 'push' && permiso() === 'denied') return 'bloqueado';
  if (g.subId && permiso() === 'granted') return 'activo';
  return 'apagado';
}

/**
 * Lo que el aviso necesita saber de este celular: el último día jugado (número), la racha y los
 * comodines de ese día, la mejor racha y cuántos días jugó la semana de ese día.
 */
export function datosAviso() {
  const d = leer();
  const fechas = Object.keys(d.dias).sort();
  const ult = fechas.at(-1);
  if (!ult) return {};
  const r = recorrer(d.dias, ult, { regalos: d.regalos || [] });
  const sp = semanaDe(ult);
  return { u: numDia(ult), c: r.racha, k: r.comodines, m: r.mejor, sp, sn: fechas.filter(f => semanaDe(f) === sp).length };
}

async function J() { return (await import('./jugador.js')).jugador(); }

/** Suscribe este celular y guarda lo que pidió. Lanza si algo falla. */
async function activar({ h = 9, d = true, r = true, w = true, lang, silencioso = false }) {
  const j = await J();
  let sub = await suscribir();
  let subId = await subIdDe(sub.endpoint);
  const guardar = () => j.guardarAvisosDia(subId, paraGuardar(sub, { lang, tz: zonaHoraria() }), { h, d, r, w, ...datosAviso() });
  try { await guardar(); } catch (e) {
    // La suscripción quedó a nombre de otra identidad de este celular: se anula y se pide otra
    if (e?.code !== 'permiso') throw e;
    await anular();
    sub = await suscribir();
    subId = await subIdDe(sub.endpoint);
    await guardar();
  }
  guardarAvisos({ subId, h, d, r, w });
  if (!silencioso) {
    trackUnoAlDia('activos');
    try { await avisoDePrueba({ titulo: textos(lang).avTitulo, texto: fmt(textos(lang).avListo, { h }), url: new URL('../../today/', import.meta.url).href }); } catch (_) { /* el aviso de prueba es un adorno */ }
  }
}

/** Después de cada Uno al día (y al abrir /today/): le cuenta al aviso su último día y su racha. */
export async function refrescar({ lang }) {
  const g = leerAvisos();
  if (!g.subId || permiso() !== 'granted' || !disponible()) return;
  try {
    const actual = await suscripcionActual();
    if (!actual) { guardarAvisos({}); return; }
    // El navegador renovó la suscripción: se vuelve a guardar con la misma elección
    if (await subIdDe(actual.endpoint) !== g.subId) { await activar({ ...g, lang, silencioso: true }); return; }
    await (await J()).guardarAvisosDia(g.subId, paraGuardar(actual, { lang, tz: zonaHoraria() }), { h: g.h, d: g.d, r: g.r, w: g.w, ...datosAviso() });
  } catch (_) { /* la próxima vez */ }
}

/** El globo del ícono en la app instalada: un 1 mientras falte jugar el de hoy (`navigator.setAppBadge`). */
export function globo() {
  try {
    if (!('setAppBadge' in navigator)) return;
    if (estado().dia) navigator.clearAppBadge?.(); else navigator.setAppBadge(1);
  } catch (_) { /* sin globo */ }
}

/* ------------------------------------------------------------------ */
/* Hojas                                                               */
/* ------------------------------------------------------------------ */

let abierta = null;
function hoja(id, ...hijos) {
  cerrar();
  const fondo = el('div', { class: 'hoja-fondo', onClick: cerrar });
  const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', id }, el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), ...hijos);
  abierta = el('div', { class: 'hoja-capa' }, fondo, panel);
  document.body.append(abierta);
  panel.querySelector('button')?.focus();
  return panel;
}
export function cerrar() { abierta?.remove(); abierta = null; }

/** Los textos de las hojas de La Copa que valen igual aquí (agregar a inicio, abrir en Safari, bloqueados). */
async function textosCopa(lang) {
  const { LOCALES } = await import('../../cup/rules.js');
  return LOCALES[lang] || LOCALES.es;
}

async function hojaInstalar({ lang, alTocar }) {
  const C = await textosCopa(lang), T = textos(lang);
  const paso = (n, texto, icono, nota) => el('div', { class: 'hoja-paso' },
    el('span', { class: 'hoja-num' }, String(n)),
    el('div', {}, el('p', {}, ...conNegritas(texto)), nota ? el('small', { class: 'muted' }, nota) : null),
    el('span', { class: 'hoja-icono', 'aria-hidden': 'true' }, icono));
  hoja('hoja-uad-instalar', el('h2', {}, C.avInstallTitle), el('p', { class: 'muted' }, C.avInstallLead),
    paso(1, C.avStep1, '⬆️', C.avStep1b), paso(2, C.avStep2, '+'), paso(3, T.avPaso3, '📅'),
    el('button', { class: 'btn btn--ghost', onClick: () => { alTocar?.(); cerrar(); } }, C.avClose));
}
async function hojaOtraApp({ lang, alTocar }) {
  const C = await textosCopa(lang), T = textos(lang);
  const url = location.href.split('#')[0];
  hoja('hoja-uad-otra-app', el('h2', {}, C.avOtherTitle), el('p', { class: 'muted' }, ...conNegritas(T.avOtraApp)),
    el('p', { class: 'hoja-link' }, url.replace(/^https?:\/\//, '')),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--yellow', onClick: async () => { alTocar?.(); try { await navigator.clipboard.writeText(url); } catch (_) { /* queda a la vista */ } } }, C.avCopy),
      el('button', { class: 'btn btn--ghost', onClick: () => { alTocar?.(); cerrar(); } }, C.avClose)));
}
async function hojaBloqueados({ lang, alTocar }) {
  const C = await textosCopa(lang);
  const cel = celular();
  hoja('hoja-uad-bloqueados', el('h2', {}, C.avBlockedTitle), el('p', { class: 'muted' }, C.avBlockedLead),
    el('p', { class: 'hoja-caja' }, ...conNegritas(cel.ios ? C.avBlockedIos : /Android/.test(navigator.userAgent) ? C.avBlockedAndroid : C.avBlockedOther)),
    el('button', { class: 'btn btn--ghost', onClick: () => { alTocar?.(); cerrar(); } }, C.avOk));
}

/** Los botones de hora: "Mañana · 9:00", "Almuerzo · 13:00", "Tarde · 19:00". */
function botonesHora({ lang, elegida = null, alElegir }) {
  const T = textos(lang);
  const rotulo = { 9: T.avManana, 13: T.avAlmuerzo, 19: T.avTarde };
  return el('div', { class: 'uad-horas', role: 'group' }, HORAS.map(h => el('button', {
    type: 'button', class: `btn btn--sm ${h === elegida ? 'btn--yellow' : 'btn--ghost'}`, 'data-h': String(h), 'aria-pressed': String(h === elegida),
    onClick: () => alElegir(h),
  }, rotulo[h])));
}

/**
 * Pedir los avisos a la hora `h`: el camino que le toca a este celular (D-221). Devuelve true si
 * quedaron activos.
 */
export async function pedir({ h = 9, lang, alTocar }) {
  alTocar?.();
  const cam = caminoDe(celular());
  if (cam === 'instalar') { await hojaInstalar({ lang, alTocar }); return false; }
  if (cam === 'otra-app') { await hojaOtraApp({ lang, alTocar }); return false; }
  if (permiso() === 'denied') { await hojaBloqueados({ lang, alTocar }); return false; }
  const p = permiso() === 'granted' ? 'granted' : await pedirPermiso();
  if (p === 'denied') { await hojaBloqueados({ lang, alTocar }); return false; }
  if (p !== 'granted') return false;
  await activar({ h, lang });
  return true;
}

/** Silenciar: los tres avisos se apagan de un toque. */
export async function silenciar() {
  trackUnoAlDia('silencio');
  const g = leerAvisos();
  if (g.subId) { try { await (await J()).quitarAvisosDia(g.subId); } catch (_) { /* queda anotado en el celular igual */ } }
  guardarAvisos({ no: true });
}

/** La hoja de los avisos activos: los tres interruptores, la hora, probar y silenciar. */
async function hojaAjustes({ lang, alTocar, alCambiar }) {
  const T = textos(lang), g = leerAvisos(), C = await textosCopa(lang);
  const sw = (id, titulo, sub, on) => {
    const input = el('input', { type: 'checkbox', role: 'switch', id });
    input.checked = on !== false;
    input.addEventListener('change', () => { alTocar?.(); guardar(); });
    return { input, nodo: el('label', { class: 'hoja-switch', for: id }, el('span', {}, el('b', {}, titulo), el('small', { class: 'muted' }, sub)), input) };
  };
  const d = sw('uad-av-dia', T.avDiario, T.avDiarioSub, g.d), r = sw('uad-av-racha', T.avRachaSw, T.avRachaSub, g.r), w = sw('uad-av-semana', T.avSemanaSw, T.avSemanaSub, g.w);
  let h = g.h ?? 9;
  const horas = el('div', { class: 'uad-hora' });
  const pintarHoras = () => horas.replaceChildren(el('p', { class: 'muted', style: 'margin:0' }, T.avHora), botonesHora({ lang, elegida: h, alElegir: x => { alTocar?.(); h = x; pintarHoras(); guardar(); } }));
  pintarHoras();
  async function guardar() {
    try { await activar({ h, d: d.input.checked, r: r.input.checked, w: w.input.checked, lang, silencioso: true }); } catch (_) { /* queda como estaba */ }
    alCambiar?.();
  }
  hoja('hoja-uad-ajustes', el('h2', {}, T.avHoja), d.nodo, horas, r.nodo, w.nodo,
    el('button', { class: 'btn btn--ghost', id: 'btn-uad-probar', onClick: async () => { alTocar?.(); try { await avisoDePrueba({ titulo: T.avTitulo, texto: T.avPrueba, url: new URL('../../today/', import.meta.url).href }); } catch (_) { /* nada */ } } }, T.avProbar),
    el('button', { class: 'btn btn--ghost btn--peligro', id: 'btn-uad-silenciar', onClick: async () => { alTocar?.(); await silenciar(); cerrar(); alCambiar?.(T.avSilenciado); } }, T.avSilenciar),
    el('button', { class: 'btn btn--ghost', onClick: () => { alTocar?.(); cerrar(); } }, C.avClose));
}

/* ------------------------------------------------------------------ */
/* Lo que se ve                                                        */
/* ------------------------------------------------------------------ */

/**
 * La oferta en la tarjeta del resultado: la segunda vez que termina Uno al día (D-230), si los
 * avisos están apagados y no dijo "Ahora no". Null si no corresponde.
 */
export function oferta({ lang, alTocar, primera }) {
  if (!primera || !disponible() || estadoAvisos() !== 'apagado' || leerAvisos().no) return null;
  if (estado().jugados !== 2) return null;
  trackUnoAlDia('oferta');
  const T = textos(lang);
  const caja = el('div', { class: 'panel uad-oferta', id: 'uad-oferta' },
    el('p', { class: 'lead', style: 'margin:0' }, T.avPregunta),
    botonesHora({ lang, alElegir: async h => {
      trackUnoAlDia('hora');
      try { if (await pedir({ h, lang, alTocar })) caja.replaceChildren(el('p', { class: 'uad-comodin', style: 'margin:0' }, fmt(T.avListo, { h }))); }
      catch (_) { caja.querySelector('.rk-error')?.remove(); caja.append(el('p', { class: 'rk-error' }, T.avError)); }
    } }),
    el('button', { class: 'link-btn', id: 'btn-uad-ahora-no', onClick: () => { alTocar?.(); trackUnoAlDia('ahorano'); guardarAvisos({ no: true }); caja.remove(); } }, T.avAhoraNo));
  return caja;
}

/**
 * La campana de /today/, con su estado: las horas (apagados), la hora y la hoja (activos) o cómo
 * desbloquearlos. Null si el celular no puede recibir avisos. `redibujar(aviso?)` vuelve a pintar la página.
 */
export function bloque({ lang, alTocar, redibujar }) {
  if (!disponible()) return null;
  const T = textos(lang);
  const caja = el('section', { class: 'panel uad-avisos', id: 'uad-avisos' });
  {
    const e = estadoAvisos();
    const g = leerAvisos();
    if (e === 'apagado') {
      caja.append(el('p', { class: 'lead', style: 'margin:0' }, T.avPregunta),
        botonesHora({ lang, alElegir: async h => { trackUnoAlDia('hora'); try { if (await pedir({ h, lang, alTocar })) redibujar?.(fmt(T.avListo, { h })); } catch (_) { redibujar?.(T.avError); } } }));
    } else if (e === 'activo') {
      caja.append(el('button', { class: 'btn btn--ghost', id: 'btn-uad-avisos', 'data-estado': 'activo', onClick: () => { alTocar?.(); hojaAjustes({ lang, alTocar, alCambiar: m => redibujar?.(m) }); } }, `${T.avActivos} · ${g.h ?? 9}:00`));
    } else {
      caja.append(el('button', { class: 'btn btn--ghost', id: 'btn-uad-avisos', 'data-estado': 'bloqueado', onClick: () => hojaBloqueados({ lang, alTocar }) }, T.avBloqueados));
    }
  }
  return caja;
}

