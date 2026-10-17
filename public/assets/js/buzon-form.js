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
 * plainly what the address is for: only to reply to the player. Not saved on the device.
 */
const CORREO = {
  es: { correo: 'Tu correo (opcional)', correoNota: 'Solo para responderte. No lo usamos para nada más, no se publica y después lo borramos.', correoMalo: 'Revisa el correo: parece incompleto.' },
  en: { correo: 'Your email (optional)', correoNota: "Only so we can reply to you. We don't use it for anything else, it's never published, and we delete it afterwards.", correoMalo: 'Check your email: it looks incomplete.' },
  pt: { correo: 'Seu e-mail (opcional)', correoNota: 'Só para te responder. Não usamos para mais nada, não é publicado e depois o apagamos.', correoMalo: 'Confira o e-mail: parece incompleto.' },
  de: { correo: 'Deine E-Mail (optional)', correoNota: 'Nur, damit wir dir antworten können. Wir nutzen sie für nichts anderes, sie wird nicht veröffentlicht und danach gelöscht.', correoMalo: 'Prüf deine E-Mail-Adresse: Sie scheint unvollständig zu sein.' },
};
export const textosCorreo = (idioma = (typeof document !== 'undefined' && document.documentElement.lang) || 'es') => CORREO[String(idioma).slice(0, 2)] || CORREO.es;
export const IDIOMAS_CORREO = Object.keys(CORREO);

/** The email input and its note; `valor()` is the address, '' if empty, or null if it's malformed. */
export function campoCorreo(T = {}, id = 'feedback-correo') {
  const C = { ...textosCorreo(), ...T };
  const input = el('input', { class: 'labs-nombre labs-correo', id, type: 'email', inputmode: 'email', maxlength: '120', autocomplete: 'email', placeholder: C.correo, 'aria-label': C.correo, 'aria-describedby': `${id}-nota` });
  const nota = el('p', { class: 'muted labs-correo-nota', id: `${id}-nota`, style: 'margin:0;font-size:.85em' }, C.correoNota);
  const valor = () => { const t = input.value.trim(); return t ? (correoValido(t) || null) : ''; };
  return { input, nota, valor, malo: C.correoMalo };
}

/** El formulario de comentarios en una capa sobre la página: el 🐞 del laboratorio y el link al final de cada vista de un juego del laboratorio (D-268). */
export function abrirComentario({ T, contexto: ctx, enviar = undefined, alEnviar = undefined }) {
  if (document.querySelector('.labs-capa')) return;
  let capa = null;
  const caja = formularioComentario({ T, contexto: ctx, enviar, alEnviar, alCerrar: () => capa.remove() });
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
  const nombre = el('input', { class: 'labs-nombre', maxlength: '40', autocomplete: 'name', placeholder: T.nombre, 'aria-label': T.nombre, value: nombreGuardado });
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
