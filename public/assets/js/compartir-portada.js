/**
 * El botón de compartir de la portada abre una hoja (D-223, D-232) con el video promocional y dos
 * maneras de compartir:
 *
 * - **Invitar a jugar:** lo de siempre (D-226): el texto de la app y, en un celular, la tarjeta
 *   social del idioma.
 * - **Compartir el video:** un mensaje corto con el link del video en YouTube, para mostrar de qué
 *   se trata. El chat arma la vista previa con su miniatura.
 *
 * The video is the vertical Short (D-410), in two tabs, Español and English: Spanish opens on the
 * Spanish tab and every other language on the English one. It plays on its own, muted (browsers only
 * autoplay without sound), from youtube-nocookie.com, and "Compartir el video" sends the tab's Short.
 * `SHORTS` holds the latest upload of each (marketing/promo-video/README.md, "Lo subido"): a new
 * upload is changed here. The sheet opens in every language (it replaces D-254).
 */
import { el } from './ui.js';
import { compartir, comparteArchivos, cabecera, conLink } from './compartir.js';

/** The Shorts, by tab: its YouTube id and the tab's label, in its own language (D-410). */
export const SHORTS = {
  es: { youtube: 'zM9v2UwEsM8', label: '🇪🇸 Español' },
  en: { youtube: 'UubTGcUoQD8', label: '🇬🇧 English' },
};
/** The tab that opens first: Spanish in Spanish, English in every other language. */
export const pestanaDe = lang => (lang === 'es' ? 'es' : 'en');
export const TRAILER = SHORTS.es;
export const urlTrailer = id => `https://youtube.com/shorts/${id}`;
const embebido = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}&rel=0&modestbranding=1`;

/** El mensaje del video (U-30): cabecera, una idea por línea y el link de YouTube al final. */
export function textoVideo({ C, trailer = TRAILER }) {
  const t = C.shareSheet;
  return conLink([cabecera({ emoji: '🎬', titulo: C.appTitle, contexto: t.videoContext }), t.videoLines.join('\n')].join('\n\n'), urlTrailer(trailer.youtube));
}

/**
 * El botón de la barra (el mismo ícono de antes) y la hoja que abre. `app` es `compartirApp(...)`.
 * Devuelve el botón; `abrir()` queda en `boton.abrir` para las pruebas.
 */
export function botonCompartirPortada({ C, app, url, icono, lang = 'es', tap = () => {}, doc = document }) {
  const t = C.shareSheet;
  const boton = el('button', { type: 'button', class: 'icon-btn', id: 'btn-compartir-portada', title: C.share, 'aria-label': C.share, 'aria-haspopup': 'dialog' });
  boton.innerHTML = icono;
  let capa = null, antes = null;
  const cerrar = () => {
    if (!capa) return;
    capa.remove(); capa = null;
    doc.removeEventListener('keydown', alTeclear);
    antes?.focus?.();
  };
  const alTeclear = e => { if (e.key === 'Escape') cerrar(); };

  // Lo que pasó al compartir se dice en el mismo botón un rato: en un computador el texto se copia
  const avisar = (b, r) => {
    if (r !== 'copied' && r !== 'downloaded') return;
    const rotulo = b.querySelector('b'), original = rotulo.textContent;
    rotulo.textContent = t.copied;
    setTimeout(() => { if (rotulo.isConnected) rotulo.textContent = original; }, 2000);
  };
  const opcion = (id, titulo, nota, accion) => {
    const b = el('button', { type: 'button', class: 'opcion', id },
      el('span', {}, el('b', {}, titulo), el('small', {}, nota)), el('span', { class: 'go', 'aria-hidden': 'true' }, '›'));
    b.addEventListener('click', async () => { tap(); avisar(b, await accion()); });
    return b;
  };

  // The tab on show: its Short plays in the card and is the one "Compartir el video" sends
  let pestana = pestanaDe(lang);
  function video() {
    const caja = el('div', { class: 'hoja-video hoja-video--vertical', role: 'tabpanel', id: 'panel-video' });
    const pestanas = el('div', { class: 'hoja-pestanas', role: 'tablist', 'aria-label': t.videoTitle });
    const poner = k => {
      pestana = k;
      pestanas.querySelectorAll('button').forEach(b => { const on = b.dataset.k === k; b.setAttribute('aria-selected', String(on)); b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1; });
      caja.setAttribute('aria-labelledby', `pestana-video-${k}`);
      caja.replaceChildren(el('iframe', { src: embebido(SHORTS[k].youtube), title: `${t.videoTitle} · ${SHORTS[k].label}`,
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '', referrerpolicy: 'strict-origin-when-cross-origin' }));
    };
    for (const k of Object.keys(SHORTS)) {
      const b = el('button', { type: 'button', role: 'tab', class: 'hoja-pestana', 'data-k': k, id: `pestana-video-${k}`, 'aria-controls': 'panel-video' }, SHORTS[k].label);
      b.addEventListener('click', () => { if (k !== pestana) { tap(); poner(k); } });
      pestanas.append(b);
    }
    pestanas.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const ks = Object.keys(SHORTS), k = ks[(ks.indexOf(pestana) + (e.key === 'ArrowRight' ? 1 : ks.length - 1)) % ks.length];
      poner(k); pestanas.querySelector(`[data-k="${k}"]`).focus();
    });
    poner(pestana);
    return [pestanas, caja];
  }

  function abrir() {
    cerrar();
    antes = doc.activeElement;
    const panel = el('div', { class: 'hoja hoja-compartir', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-compartir-titulo', id: 'hoja-compartir' },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
      el('h2', { id: 'hoja-compartir-titulo' }, t.title),
      ...video(),
      opcion('btn-invitar-portada', t.invite, t.inviteNote, async () => {
        const archivo = comparteArchivos() ? await app.imagen() : null;
        return compartir({ titulo: app.titulo, texto: app.texto, url, imagen: archivo });
      }),
      opcion('btn-compartir-video', t.video, t.videoNote, () => compartir({ titulo: C.appTitle, texto: textoVideo({ C, trailer: SHORTS[pestana] }), que: 'video' })),
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { tap(); cerrar(); } }, t.close)));
    capa = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: cerrar }), panel);
    doc.body.append(capa);
    doc.addEventListener('keydown', alTeclear);
    panel.querySelector('.hoja-pestana.on')?.focus();
  }

  boton.addEventListener('click', () => { tap(); abrir(); });
  boton.abrir = abrir;
  return boton;
}
