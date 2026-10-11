/**
 * El globo de la portada que invita a agregar Juegos de Salón a la pantalla de inicio (D-232), y la
 * hoja con los pasos de cada celular. Los textos van en `COMMON[lang].ins` (i18n.js).
 *
 * - Sale solo en un celular (iPhone o Android) que todavía no abre la app instalada.
 * - La ✕ lo apaga para siempre en ese navegador, igual que "Ya la agregué" o instalarla.
 * - En Android, si Chrome ofrece su propio dialogo de instalar (`beforeinstallprompt`), "Agregar"
 *   abre ese dialogo; si no, la hoja con los pasos del menú.
 * - Dentro de WhatsApp, Instagram u otra app no se puede agregar a inicio: la hoja pide abrir el
 *   link en Safari o en Chrome.
 */
import { el } from './ui.js';

/** La marca de "no mostrar más": la ✕, "Ya la agregué" o la app ya instalada. */
export const INSTALAR_NO_KEY = 'juegos-de-salon:instalar:no';

export const descartado = (storage = globalThis.localStorage) => { try { return storage.getItem(INSTALAR_NO_KEY) === '1'; } catch (_) { return false; } };
export function descartar(si = true, storage = globalThis.localStorage) {
  try { if (si) storage.setItem(INSTALAR_NO_KEY, '1'); else storage.removeItem(INSTALAR_NO_KEY); } catch (_) { /* sin memoria: vuelve a salir */ }
}

/** Las apps que abren los links con su propio navegador, donde no se puede agregar a inicio. */
const OTRA_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Messenger|TikTok|Snapchat|Twitter|LinkedInApp|GSA\/|; wv\)/;

/**
 * Qué pasos le tocan a este celular, o null si el globo no va:
 *   'ios-safari' · 'ios-chrome' · 'android' (Chrome y los que usan su menú ⋮) · 'samsung' ·
 *   'otra-app-ios' · 'otra-app-android'
 * Un computador, un iPhone con otro navegador (Firefox, Edge) o la app ya instalada: null.
 */
export function pasosDe({ nav = globalThis.navigator, win = globalThis.window } = {}) {
  const ua = String(nav?.userAgent || '');
  // El iPad con iPadOS se presenta como Mac: se reconoce por la pantalla táctil
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints || 0) > 1);
  const android = /Android/.test(ua);
  if (!ios && !android) return null;
  if (nav?.standalone || win?.matchMedia?.('(display-mode: standalone)')?.matches) return null;
  if (OTRA_APP.test(ua)) return ios ? 'otra-app-ios' : 'otra-app-android';
  if (ios) {
    if (/CriOS/.test(ua)) return 'ios-chrome';
    if (/FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)) return null;
    return 'ios-safari';
  }
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  return 'android';
}

/** Los pasos de cada celular: [texto, ícono, nota?] con las claves de `T.ins`. */
const PASOS = {
  'ios-safari': [['iosShare', '⬆️', 'iosShareNote'], ['iosAdd', '+'], ['iosConfirm', '✅']],
  'ios-chrome': [['chromeIosShare', '⬆️'], ['iosAdd', '+'], ['iosConfirm', '✅']],
  android: [['androidMenu', '⋮'], ['androidAdd', '📲'], ['androidConfirm', '✅']],
  samsung: [['samsungMenu', '☰'], ['samsungAdd', '📲'], ['samsungConfirm', '✅']],
};

/** "Toca **Compartir**" → nodos con negritas. */
const conNegritas = texto => String(texto).split(/\*\*(.+?)\*\*/).map((t, i) => (i % 2 ? el('b', {}, t) : t));

/**
 * Pone el globo en la portada, si le toca a este celular.
 * @param {object} o
 * @param {object} o.T   los textos comunes del idioma de quien mira (COMMON[lang])
 * @param {string} o.url  la portada en ese idioma (homeUrl), la que se copia para abrirla en el navegador
 * @param {() => void} [o.tap]  el sonido del toque
 * @param {number} [o.espera]  cuánto espera antes de salir, para no tapar la portada al llegar
 */
export function globoInstalar({ T, url: enlace = '.', tap = () => {}, espera = 2500, doc = globalThis.document, nav = globalThis.navigator, win = globalThis.window } = {}) {
  const t = T.ins;
  const pasos = pasosDe({ nav, win });
  if (!pasos || descartado()) return null;

  // Chrome en Android ofrece su propio dialogo: se guarda para abrirlo con "Agregar"
  let dialogo = null;
  win.addEventListener('beforeinstallprompt', e => { e.preventDefault(); dialogo = e; });
  win.addEventListener('appinstalled', () => { descartar(); quitar(); cerrarHoja(); });

  let globo = null, hojaAbierta = null;
  function quitar() {
    if (!globo) return;
    const g = globo; globo = null;
    g.classList.add('fuera');
    setTimeout(() => g.remove(), 250);
  }
  function cerrarHoja() { hojaAbierta?.remove(); hojaAbierta = null; }
  const botonCerrar = (texto = t.close) => el('button', { class: 'btn btn--ghost', type: 'button', onClick: () => { tap(); cerrarHoja(); } }, texto);

  function hoja(id, ...hijos) {
    cerrarHoja();
    const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${id}-titulo`, id },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), ...hijos);
    hojaAbierta = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: cerrarHoja }), panel);
    doc.body.append(hojaAbierta);
    panel.querySelector('button')?.focus();
    return panel;
  }

  function hojaPasos() {
    const paso = (n, [texto, icono, nota]) => el('div', { class: 'hoja-paso' },
      el('span', { class: 'hoja-num' }, String(n)),
      el('div', {}, el('p', {}, ...conNegritas(t[texto])), nota ? el('small', { class: 'muted' }, t[nota]) : null),
      el('span', { class: 'hoja-icono', 'aria-hidden': 'true' }, icono));
    const despues = el('p', { class: 'hoja-caja', hidden: true }, t.doneNext);
    const ya = el('button', { class: 'btn btn--yellow', type: 'button', id: 'btn-ya-agregue', onClick: () => {
      tap(); descartar(); quitar(); despues.hidden = false; ya.remove();
    } }, t.done);
    hoja('hoja-agregar',
      el('h2', { id: 'hoja-agregar-titulo' }, t.sheetTitle),
      ...PASOS[pasos].map((p, i) => paso(i + 1, p)),
      despues,
      el('div', { class: 'btn-row' }, ya, botonCerrar()));
  }

  function hojaOtraApp() {
    const url = new URL(enlace, doc.baseURI).href;
    hoja('hoja-otra-app-portada',
      el('h2', { id: 'hoja-otra-app-portada-titulo' }, pasos === 'otra-app-ios' ? t.otherTitleIos : t.otherTitleAndroid),
      el('p', { class: 'muted' }, ...conNegritas(pasos === 'otra-app-ios' ? t.otherLeadIos : t.otherLeadAndroid)),
      el('p', { class: 'hoja-link' }, url.replace(/^https?:\/\//, '')),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn btn--yellow', type: 'button', onClick: async ev => {
          tap();
          const b = ev.currentTarget;
          try { await nav.clipboard.writeText(url); b.textContent = t.copied; } catch (_) { b.textContent = url; }
        } }, t.copy),
        botonCerrar()));
  }

  async function agregar() {
    tap();
    if (dialogo) {
      const d = dialogo; dialogo = null;
      try {
        await d.prompt();
        const { outcome } = await d.userChoice;
        if (outcome === 'accepted') { descartar(); quitar(); }
        return;
      } catch (_) { /* si falla, los pasos */ }
    }
    if (pasos.startsWith('otra-app')) hojaOtraApp(); else hojaPasos();
  }

  setTimeout(() => {
    if (descartado() || doc.getElementById('globo-instalar')) return;
    globo = el('aside', { class: 'globo-instalar', id: 'globo-instalar', 'data-pasos': pasos, 'aria-label': t.sheetTitle },
      el('img', { class: 'globo-icono', src: new URL('../icons/apple-touch-icon.png', import.meta.url).href, alt: '', width: 48, height: 48 }),
      el('div', { class: 'globo-texto' }, el('b', {}, t.title), el('span', {}, t.sub)),
      el('button', { class: 'btn btn--yellow btn--sm globo-agregar', type: 'button', id: 'btn-globo-agregar', onClick: agregar }, t.add),
      el('button', { class: 'globo-cerrar', type: 'button', id: 'btn-globo-cerrar', 'aria-label': t.dismiss, title: t.dismiss,
        onClick: () => { tap(); descartar(); quitar(); } }, '✕'));
    doc.body.append(globo);
  }, espera);

  return { agregar, quitar };
}
