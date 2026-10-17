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
 *   leen con `node tools/firebase/reports.mjs`. Si no hay red, quedan guardados y se reenvían (D-109).
 *
 * Los textos van en el idioma del laboratorio, que es el de quienes prueban.
 */
import { el } from './ui.js';
import { LABS_IDIOMA, getLang } from './i18n.js';
import { reenviarPendientes } from '../../cup/reportes.js';

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
  },
};

// The form, the overlay and the email field moved to buzon-form.js (D-341); re-exported for the lab games
export { formularioComentario, abrirComentario, campoCorreo, textosCorreo, IDIOMAS_CORREO } from './buzon-form.js';
import { abrirComentario } from './buzon-form.js';

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

/** Lo que se manda junto al comentario. No se muestra: es para el dueño, no para quien escribe. */
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

