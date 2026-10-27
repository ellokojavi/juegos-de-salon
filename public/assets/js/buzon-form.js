/**
 * The feedback form (D-104, D-265, D-317, D-345): one component for the lab's 🐞, the end of a lab
 * game and the "💬 Suggestions and comments" inbox in production. Loaded only when someone taps to
 * write (buzon.js imports it on demand), so game endings don't get heavier.
 */
import { el } from './ui.js';
import { versionOf } from './transport/stats.js';
import { enviarReporte, correoValido } from '../../cup/reportes.js';

/** The kinds a message can be tagged with (D-345). The rules accept exactly these (`feedback/$id/tipo`). */
export const TIPOS = ['sugerencia', 'problema', 'idea', 'otro'];

const NOMBRE = 'juegos-de-salon:copa:reporte-nombre';

/**
 * The optional email field (D-317), the same in every feedback form, in the page's language. It says
 * plainly what the address is for: only to reply to the player, and when it is deleted: on the reply,
 * or after 90 days without one (`feedback.mjs expire`, D-463). Its note links the privacy page. Not
 * saved on the device.
 */
/** Days an address waits for a reply before it is deleted (D-463); `feedback.mjs` deletes it. */
export const DIAS_CORREO = 90;
/** The privacy page (D-463), from this module: it works on the site and on a PR preview alike. */
export const PRIVACY_URL = new URL('../../privacy/', import.meta.url).href;
const CORREO = {
  es: { correo: 'Tu correo (opcional)', correoNota: 'Solo para responderte, y nunca se publica. Lo borramos al responderte o a los 90 días.', privacidad: 'Privacidad', correoMalo: 'Revisa el correo: parece incompleto.' },
  en: { correo: 'Your email (optional)', correoNota: 'Only to reply to you, and never published. We delete it when we reply or after 90 days.', privacidad: 'Privacy', correoMalo: 'Check your email: it looks incomplete.' },
  pt: { correo: 'Seu e-mail (opcional)', correoNota: 'Só para te responder, e nunca é publicado. Apagamos ao responder ou depois de 90 dias.', privacidad: 'Privacidade', correoMalo: 'Confira o e-mail: parece incompleto.' },
  de: { correo: 'Deine E-Mail (optional)', correoNota: 'Nur für unsere Antwort, nie veröffentlicht. Wir löschen sie nach der Antwort oder nach 90 Tagen.', privacidad: 'Datenschutz', correoMalo: 'Prüf deine E-Mail-Adresse: Sie scheint unvollständig zu sein.' },
};
export const textosCorreo = (idioma = (typeof document !== 'undefined' && document.documentElement.lang) || 'es') => CORREO[String(idioma).slice(0, 2)] || CORREO.es;
export const IDIOMAS_CORREO = Object.keys(CORREO);

/** The email input and its note; `valor()` is the address, '' if empty, or null if it's malformed. */
export function campoCorreo(T = {}, id = 'feedback-correo') {
  const C = { ...textosCorreo(), ...T };
  const input = el('input', { class: 'labs-nombre labs-correo', id, type: 'email', inputmode: 'email', maxlength: '120', autocomplete: 'email', placeholder: C.correo, 'aria-label': C.correo, 'aria-describedby': `${id}-nota` });
  const nota = el('p', { class: 'muted labs-correo-nota', id: `${id}-nota`, style: 'margin:0;font-size:.85em' },
    `${C.correoNota} `, el('a', { href: PRIVACY_URL, target: '_blank', rel: 'noopener', style: 'color:inherit' }, C.privacidad || CORREO.es.privacidad));
  const valor = () => { const t = input.value.trim(); return t ? (correoValido(t) || null) : ''; };
  return { input, nota, valor, malo: C.correoMalo };
}

/** El formulario de comentarios en una capa sobre la página: el 🐞 del laboratorio y el link al final de cada vista de un juego del laboratorio (D-268). */
export function abrirComentario({ T, contexto: ctx, enviar = undefined, alEnviar = undefined }) {
  if (document.querySelector('.labs-capa')) return;
  let capa = null;
  let soltar = () => {};
  const cerrar = () => { capa.remove(); soltar(); };
  const caja = formularioComentario({ T, contexto: ctx, enviar, alEnviar, alCerrar: cerrar });
  caja.classList.add('labs-caja');
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  capa = el('div', { class: 'labs-capa' }, caja);
  capa.addEventListener('click', e => { if (e.target === capa) cerrar(); });
  document.body.append(capa);
  caja.querySelector('textarea').focus();
  // The page behind stays put while the form is open, so only the card moves (the owner's request)
  soltar = fijarFondo();
}

/**
 * Pins the page under an overlay, the way the share and support sheets do: the body is fixed at its
 * scroll position, so a finger on the backdrop or past the card's end cannot scroll it (iOS ignores
 * `overflow: hidden` on the body). Returns the function that lets it go, back to the same place.
 */
export function fijarFondo(doc = document) {
  const y = doc.defaultView?.scrollY || 0;
  const antes = doc.body.getAttribute('style');
  Object.assign(doc.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  doc.documentElement.classList.add('fondo-fijo');
  return () => {
    if (antes === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', antes);
    doc.documentElement.classList.remove('fondo-fijo');
    doc.defaultView?.scrollTo(0, y);
  };
}

/**
 * El formulario de comentarios, para ponerlo donde se quiera: en la capa del 🐞 o al final de un
 * juego del laboratorio (El caso, D-265). `T` trae sus textos (`titulo`, `lead`, `ph`, `nombre`,
 * `enviar`, `enviando`, `vacio`, `gracias`, `guardado`, `error` y, si se puede cerrar,
 * `cancelar` y `cerrar`); `contexto` va adjunto, sin mostrarse. Sin `alCerrar` no tiene
 * botón para cerrar: queda en la página, y después de enviar dice gracias en el mismo lugar.
 * `enviar` lo reemplaza el modo de prueba de La Copa, que guarda en el celular y no en Firebase.
 */
export function formularioComentario({ T, contexto: ctx, alCerrar = null, enviar: mandar = enviarReporte, alEnviar = () => {} }) {
  let nombreGuardado = '';
  try { nombreGuardado = localStorage.getItem(NOMBRE) || ''; } catch (_) { /* nada */ }
  const err = el('div', { class: 'labs-error', role: 'alert' });
  const texto = el('textarea', { class: 'labs-texto', maxlength: '1000', rows: '5', placeholder: T.ph, 'aria-label': T.titulo });
  const nombre = el('input', { class: 'labs-nombre', maxlength: '40', autocomplete: 'given-name', placeholder: T.nombre, 'aria-label': T.nombre, value: nombreGuardado });
  const correo = campoCorreo(T);
  // The optional kind (D-345): one row of chips, none picked by default; tapping the picked one unpicks it
  let tipo = '';
  const chips = T.tipos ? el('div', { class: 'buzon-tipos', role: 'group', 'aria-label': T.tipo },
    ...TIPOS.map(k => el('button', { type: 'button', class: 'buzon-tipo', 'data-tipo': k, 'aria-pressed': 'false', onClick: e => {
      tipo = tipo === k ? '' : k;
      for (const b of e.currentTarget.parentElement.children) b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo));
    } }, T.tipos[k]))) : null;
  const enviar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-enviar-comentario' }, T.enviar);
  const cancelar = alCerrar ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: alCerrar }, T.cancelar) : null;
  const caja = el('div', { class: 'panel stack comentario', 'aria-label': T.titulo },
    el('h2', { class: 'display display--sm' }, `${T.tipos ? '💬' : '🐞'} ${T.titulo}`),
    el('p', { class: 'muted', style: 'margin:0' }, T.lead),
    chips, texto, nombre, correo.input, correo.nota, err, enviar, cancelar);
  enviar.addEventListener('click', async () => {
    const t = texto.value.trim();
    if (!t) { err.textContent = T.vacio; return; }
    const c = correo.valor();
    if (c === null) { err.textContent = correo.malo; correo.input.focus(); return; }
    const n = nombre.value.trim().slice(0, 40);
    try { if (n) localStorage.setItem(NOMBRE, n); } catch (_) { /* nada */ }
    enviar.disabled = true; enviar.textContent = T.enviando;
    const fin = msg => caja.replaceChildren(el('p', { class: 'labs-aviso', role: 'status' }, msg),
      alCerrar ? el('button', { type: 'button', class: 'btn btn--yellow', onClick: alCerrar }, T.cerrar) : '');
    try {
      await mandar({
        texto: t.slice(0, 1000), nombre: n, ...(tipo ? { tipo } : {}), ...(c ? { correo: c } : {}), contexto: JSON.stringify(ctx).slice(0, 500),
        v: versionOf(document.getElementById('importmap')?.textContent || '') || 'dev',
      });
      alEnviar();
      fin(T.gracias);
    } catch (e) {
      if (e?.guardado) { alEnviar(); fin(T.guardado); return; }
      err.textContent = T.error;
      enviar.disabled = false; enviar.textContent = T.enviar;
    }
  });
  return caja;
}
