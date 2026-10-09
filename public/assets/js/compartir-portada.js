/**
 * El botón de compartir de la portada abre una hoja (la de D-223 y D-232) con el video
 * promocional y dos maneras de compartir:
 *
 * - **Invitar a jugar:** lo de siempre (D-226): el texto de la app y, en un celular, la tarjeta
 *   social del idioma.
 * - **Compartir el video:** un mensaje corto con el link del video en YouTube, para mostrar de qué
 *   se trata. El chat arma la vista previa con su miniatura.
 *
 * El video no se carga hasta que lo tocan: antes es su miniatura con ▶, así abrir la hoja no baja
 * nada de YouTube. Se embebe desde youtube-nocookie.com, que no deja cookies hasta reproducir.
 * `TRAILER` es la última versión subida al canal (marketing/promo-video/README.md, "Lo subido"):
 * al subir una nueva, se cambia aquí.
 */
import { el } from './ui.js';
import { compartir, comparteArchivos, cabecera, conLink } from './compartir.js';

export const TRAILER = { youtube: 'fQ4uFaPX_4g', poster: new URL('../img/trailer.jpg', import.meta.url).href };
export const urlTrailer = id => `https://youtu.be/${id}`;
const embebido = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

/** El mensaje del video (U-30): cabecera, una idea por línea y el link de YouTube al final. */
export function textoVideo({ C, trailer = TRAILER }) {
  const t = C.shareSheet;
  return conLink([cabecera({ emoji: '🎬', titulo: C.appTitle, contexto: t.videoContext }), t.videoLines.join('\n')].join('\n\n'), urlTrailer(trailer.youtube));
}

/**
 * El botón de la barra (el mismo ícono de antes) y la hoja que abre. `app` es `compartirApp(...)`.
 * Devuelve el botón; `abrir()` queda en `boton.abrir` para las pruebas.
 */
export function botonCompartirPortada({ C, app, url, icono, tap = () => {}, doc = document, trailer = TRAILER }) {
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

  function video() {
    const caja = el('div', { class: 'hoja-video' });
    const play = el('button', { type: 'button', class: 'hoja-video-play', 'aria-label': t.play },
      el('img', { src: trailer.poster, alt: '', loading: 'lazy' }), el('span', { class: 'hoja-video-icono', 'aria-hidden': 'true' }, `▶ ${t.play}`));
    play.addEventListener('click', () => {
      tap();
      caja.replaceChildren(el('iframe', { src: embebido(trailer.youtube), title: t.videoTitle,
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '', referrerpolicy: 'strict-origin-when-cross-origin' }));
    });
    caja.append(play);
    return caja;
  }

  function abrir() {
    cerrar();
    antes = doc.activeElement;
    const panel = el('div', { class: 'hoja hoja-compartir', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-compartir-titulo', id: 'hoja-compartir' },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
      el('h2', { id: 'hoja-compartir-titulo' }, t.title),
      video(),
      opcion('btn-invitar-portada', t.invite, t.inviteNote, async () => {
        const archivo = comparteArchivos() ? await app.imagen() : null;
        return compartir({ titulo: app.titulo, texto: app.texto, url, imagen: archivo });
      }),
      opcion('btn-compartir-video', t.video, t.videoNote, () => compartir({ titulo: C.appTitle, texto: textoVideo({ C, trailer }) })),
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { tap(); cerrar(); } }, t.close)));
    capa = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: cerrar }), panel);
    doc.body.append(capa);
    doc.addEventListener('keydown', alTeclear);
    panel.querySelector('.hoja-video-play')?.focus();
  }

  boton.addEventListener('click', () => { tap(); abrir(); });
  boton.abrir = abrir;
  return boton;
}
