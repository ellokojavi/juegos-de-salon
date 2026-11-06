/**
 * Waiting, or a failure with a way out (phase 7 of the design system, #1196; La Copa's `espera()`
 * until then): fills `body` with one line, `.waiting` with room around it while something loads, or
 * `.form-error` when it failed; a retry button when there is something to retry, and on a failure a
 * way home, so an error never strands the player (U-15). Any game with a waiting screen can use it.
 *
 *   showWaiting(body, 'Abriendo la copa…')
 *   showWaiting(body, 'No se pudo abrir', { error: true, retry: () => location.reload(), retryLabel: 'Reintentar', home: '/cup/', homeLabel: 'Volver' })
 */
import { el } from './ui.js';

export function showWaiting(body, text, { error = false, retry = null, retryLabel = '', home = null, homeLabel = '' } = {}) {
  body.replaceChildren(el('div', { class: error ? 'form-error' : 'waiting waiting--screen' }, text));
  if (retry) body.append(el('button', { class: 'btn btn--cyan', onClick: retry }, retryLabel));
  if (error && home) body.append(el('a', { class: 'btn btn--ghost btn--sm', href: home }, homeLabel));
}
