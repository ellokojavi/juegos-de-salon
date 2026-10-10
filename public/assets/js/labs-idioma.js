/**
 * Un idioma en el laboratorio (D-191). Lo carga i18n.js solo en el dispositivo que entró por
 * `/labs/<idioma>/` (o por un link con `?lang=<idioma>`), y hace tres cosas en todas las páginas:
 *
 * - **Mientras se juega en el idioma del laboratorio, la navegación no se sale de él:** un link
 *   al menú (`../`) o al laboratorio de siempre (`/labs/`) lleva a la portada del laboratorio del
 *   idioma. Con otro idioma elegido en el toggle, el menú es el de siempre: la portada del
 *   laboratorio está escrita en su idioma, y volver a ella después de elegir español se veía como
 *   un toggle pegado en alemán (D-195). Un link con `data-labs-libre` pasa siempre.
 * - **🐞 en la barra de arriba** abre el formulario de comentarios. Donde no hay "‹ Menú" (la
 *   portada), dos pestañas al borde: 🧪 vuelve al laboratorio y 🐞.
 * - **Los comentarios** van a `feedback/` como los de La Copa (D-104), con el contexto de dónde
 *   se escribieron: página, pantalla, idioma que se veía, tamaño de la pantalla y versión. Se
 *   leen con `node tools/firebase/reportes.mjs`. Si no hay red, quedan guardados y se reenvían (D-109).
 *
 * Los textos van en el idioma del laboratorio, que es el de quienes prueban.
 */
import { el } from './ui.js';
import { LABS_IDIOMA, getLang } from './i18n.js';
import { versionOf } from './transport/stats.js';
import { enviarReporte, reenviarPendientes } from '../../cup/reportes.js';

const TEXTOS = {
  de: {
    labor: 'Deutsch-Labor',
    volver: 'Zurück zum Labor',
    abrir: 'Feedback geben',
    titulo: 'Feedback zum Deutsch-Labor',
    lead: 'Was klingt komisch, ist abgeschnitten oder falsch übersetzt? Schreib einfach, was dir auffällt – gern auch auf Englisch oder Spanisch.',
    ph: 'Zum Beispiel: Auf dem Startbildschirm ist „Galgenmännchen“ abgeschnitten.',
    nombre: 'Dein Name (optional)',
    enviar: 'Senden',
    enviando: 'Wird gesendet …',
    cancelar: 'Abbrechen',
    vacio: 'Schreib erst etwas rein.',
    gracias: 'Danke! 🙌 Dein Feedback ist angekommen.',
    guardado: 'Gerade kein Netz: Dein Feedback ist auf dem Handy gespeichert und wird später automatisch gesendet.',
    error: 'Das hat nicht geklappt. Versuch es gleich nochmal.',
    cerrar: 'Schließen',
    contexto: 'Das wird mitgeschickt',
  },
};

const NOMBRE = 'juegos-de-salon:copa:reporte-nombre';

export function iniciarLabs(idioma) {
  const T = TEXTOS[idioma];
  if (!T || typeof document === 'undefined') return;
  const raiz = new URL('../../', import.meta.url);
  const portada = new URL(`labs/${idioma}/`, raiz);

  // La navegación se queda en el laboratorio
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href]');
    if (!a || a.hasAttribute('data-labs-libre') || a.target === '_blank') return;
    if (getLang() !== idioma) return;
    let destino;
    try { destino = new URL(a.getAttribute('href'), location.href); } catch (_) { return; }
    if (destino.origin !== raiz.origin) return;
    const ruta = destino.pathname;
    if (ruta === raiz.pathname || ruta === `${raiz.pathname}index.html` || ruta === `${raiz.pathname}labs/`) {
      e.preventDefault();
      location.href = portada.href;
    }
  }, true);

  // 🐞 va en la barra de arriba, junto al sonido, donde no tapa nada del juego. Una página sin
  // "‹ Menú" (la portada) no tiene cómo volver: ahí van las dos pestañas al borde, 🧪 y 🐞.
  const poner = () => {
    const tools = document.querySelector('.topbar .tools');
    const bicho = (clase) => el('button', { type: 'button', class: clase, 'aria-label': T.abrir, title: T.abrir, onClick: () => abrir(T, idioma) }, '🐞');
    if (tools && document.querySelector('.topbar .back')) { tools.prepend(bicho('icon-btn labs-bicho')); return; }
    if (location.pathname === portada.pathname) return;   // la portada del laboratorio tiene su botón
    document.body.append(el('div', { class: 'labs-tabs' },
      el('a', { class: 'labs-tab', href: portada.href, 'aria-label': T.volver, title: T.volver }, '🧪'), bicho('labs-tab')));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner();

  reenviarPendientes().catch(() => {});
}

/** Lo que se manda junto al comentario, a la vista de quien lo escribe. */
function contexto(idioma) {
  const pantalla = document.querySelector('.screen.active')?.id || null;
  const titulo = (document.querySelector('.screen.active h1, .screen.active h2, h1')?.textContent || '').trim().slice(0, 60);
  return {
    labs: idioma, idioma: document.documentElement.lang || null,
    url: location.pathname + location.search, pantalla, titulo,
    pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
  };
}

/** El formulario de comentarios, para un botón propio (la portada del laboratorio lo tiene). */
export const abrirFeedback = () => abrir(TEXTOS[LABS_IDIOMA] || TEXTOS.de, LABS_IDIOMA || 'de');

function abrir(T, idioma) { abrirComentario({ T, contexto: contexto(idioma) }); }

/** El formulario de comentarios en una capa sobre la página: el 🐞 del laboratorio y el link al final de cada vista de un juego del laboratorio (D-268). */
export function abrirComentario({ T, contexto: ctx }) {
  if (document.querySelector('.labs-capa')) return;
  let capa = null;
  const caja = formularioComentario({ T, contexto: ctx, alCerrar: () => capa.remove() });
  caja.classList.add('labs-caja');
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  capa = el('div', { class: 'labs-capa' }, caja);
  capa.addEventListener('click', e => { if (e.target === capa) capa.remove(); });
  document.body.append(capa);
  caja.querySelector('textarea').focus();
}

/**
 * El formulario de comentarios, para ponerlo donde se quiera: en la capa del 🐞 o al final de un
 * juego del laboratorio (El caso, D-265). `T` trae sus textos (`titulo`, `lead`, `ph`, `nombre`,
 * `enviar`, `enviando`, `vacio`, `gracias`, `guardado`, `error`, `contexto` y, si se puede cerrar,
 * `cancelar` y `cerrar`); `contexto` va adjunto a la vista de quien escribe. Sin `alCerrar` no tiene
 * botón para cerrar: queda en la página, y después de enviar dice gracias en el mismo lugar.
 */
export function formularioComentario({ T, contexto: ctx, alCerrar = null }) {
  let nombreGuardado = '';
  try { nombreGuardado = localStorage.getItem(NOMBRE) || ''; } catch (_) { /* nada */ }
  const err = el('div', { class: 'labs-error', role: 'alert' });
  const texto = el('textarea', { class: 'labs-texto', maxlength: '1000', rows: '5', placeholder: T.ph, 'aria-label': T.titulo });
  const nombre = el('input', { class: 'labs-nombre', maxlength: '40', autocomplete: 'name', placeholder: T.nombre, 'aria-label': T.nombre, value: nombreGuardado });
  const enviar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-enviar-comentario' }, T.enviar);
  const cancelar = alCerrar ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: alCerrar }, T.cancelar) : null;
  const caja = el('div', { class: 'panel stack comentario', 'aria-label': T.titulo },
    el('h2', { class: 'display display--sm' }, `🐞 ${T.titulo}`),
    el('p', { class: 'muted', style: 'margin:0' }, T.lead),
    texto, nombre, err, enviar, cancelar,
    el('details', {}, el('summary', { class: 'muted' }, T.contexto), el('pre', { class: 'labs-contexto' }, JSON.stringify(ctx, null, 1))));
  enviar.addEventListener('click', async () => {
    const t = texto.value.trim();
    if (!t) { err.textContent = T.vacio; return; }
    const n = nombre.value.trim().slice(0, 40);
    try { if (n) localStorage.setItem(NOMBRE, n); } catch (_) { /* nada */ }
    enviar.disabled = true; enviar.textContent = T.enviando;
    const fin = msg => caja.replaceChildren(el('p', { class: 'labs-aviso', role: 'status' }, msg),
      alCerrar ? el('button', { type: 'button', class: 'btn btn--yellow', onClick: alCerrar }, T.cerrar) : '');
    try {
      await enviarReporte({
        texto: t.slice(0, 1000), nombre: n, contexto: JSON.stringify(ctx).slice(0, 500),
        v: versionOf(document.getElementById('importmap')?.textContent || '') || 'dev',
      });
      fin(T.gracias);
    } catch (e) {
      if (e?.guardado) { fin(T.guardado); return; }
      err.textContent = T.error;
      enviar.disabled = false; enviar.textContent = T.enviar;
    }
  });
  return caja;
}
