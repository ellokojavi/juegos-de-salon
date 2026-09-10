/**
 * Chat de sala compartido por los juegos con modo de varios celulares (canon C-15).
 *
 * Vive fuera de las pantallas del juego (hermano de #handoff), así que los re-render
 * de la partida no borran lo que el jugador está escribiendo. Es solo una vista: los
 * mensajes llegan por el mismo transporte que las jugadas, con `t: 'chat'`, y el juego
 * se los pasa con `add()`. No guarda nada: el chat muere con la sala.
 *
 * Uso:
 *   const chat = createChat({ mount: $('#chat'), T, nameOf, isMine, onSend });
 *   chat.add(msg, { live: true });   // desde el reductor
 *   chat.show() / chat.hide();
 */
import { el, vibrate } from './ui.js';
import { SFX } from './sound.js';

export const CHAT_MAX = 120;    // caracteres por mensaje
const KEEP = 60;                // mensajes que se mantienen en pantalla
const MIN_GAP = 1200;           // ms mínimos entre dos envíos del mismo celular
const PEEK_MS = 4200;           // cuánto se asoma la etiqueta con el mensaje nuevo
const ROLE_COLORS = ['--cyan', '--yellow', '--lime', '--pink', '--orange', '--purple'];
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Color estable por rol, para reconocer quién habla de un vistazo. */
export const chatColor = role => `var(${ROLE_COLORS[Math.max(0, ROLES.indexOf(role)) % ROLE_COLORS.length]})`;

/**
 * @param {HTMLElement} mount  contenedor propio del chat (fuera de las .screen)
 * @param {object} T           textos del juego: chatTitle, chatPlaceholder, chatEmpty, chatOpen, chatSend
 * @param {(role:string)=>string} nameOf   nombre visible de un rol
 * @param {(role:string)=>boolean} isMine  si el rol es de este celular
 * @param {(text:string)=>void} onSend     envía el mensaje por el transporte
 */
export function createChat({ mount, T, nameOf, isMine, onSend }) {
  const rows = [];              // mensajes ya dibujados, para recortar los viejos
  let unread = 0;
  let open = false;
  let lastSent = 0;
  let lastFrom = null;          // agrupa mensajes seguidos del mismo jugador

  const badge = el('span', { class: 'chat-badge', hidden: true }, '0');
  // Etiqueta que se asoma al lado de la burbuja con el mensaje recién llegado
  const peek = el('button', { class: 'chat-peek', type: 'button', hidden: true, onClick: () => toggle(true) });
  let peekTimer = null;
  const fab = el('button', { class: 'chat-fab', type: 'button', 'aria-label': T.chatOpen, onClick: () => toggle(true) }, '💬', badge);
  const list = el('div', { class: 'chat-list' }, el('p', { class: 'chat-empty' }, T.chatEmpty));
  const input = el('input', {
    type: 'text', maxlength: CHAT_MAX, placeholder: T.chatPlaceholder,
    autocomplete: 'off', autocorrect: 'on', enterkeyhint: 'send', 'aria-label': T.chatTitle,
  });
  const form = el('form', { class: 'chat-form', onSubmit: e => { e.preventDefault(); submit(); } },
    input,
    el('button', { class: 'chat-send', type: 'submit', 'aria-label': T.chatSend }, '➤'),
  );
  const panel = el('div', { class: 'chat-panel' },
    el('div', { class: 'chat-head' },
      el('b', {}, T.chatTitle),
      el('button', { class: 'chat-x', type: 'button', 'aria-label': T.chatClose, onClick: () => toggle(false) }, '✕'),
    ),
    list, form,
  );
  const sheet = el('div', { class: 'chat-sheet', hidden: true },
    el('div', { class: 'chat-scrim', onClick: () => toggle(false) }),
    panel,
  );
  mount.classList.add('chat');
  mount.append(fab, peek, sheet);

  /* ---------- teclado del celular ----------
     El teclado no achica la ventana en iOS: tapa lo que hay abajo. visualViewport
     dice cuánto tapa y el panel se levanta esa distancia (ver docs, D-28). */
  const vv = window.visualViewport;
  const onViewport = () => {
    if (!vv) return;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    mount.style.setProperty('--kb', `${kb}px`);
    if (open) scrollDown();
  };
  if (vv) { vv.addEventListener('resize', onViewport); vv.addEventListener('scroll', onViewport); }

  const onKey = e => { if (e.key === 'Escape' && open) toggle(false); };
  document.addEventListener('keydown', onKey);

  function scrollDown() { list.scrollTop = list.scrollHeight; }

  /** Asoma el mensaje nuevo al lado de la burbuja y lo esconde solo. Uno a la vez: el último manda. */
  function showPeek(role, text) {
    clearTimeout(peekTimer);
    peek.innerHTML = '';
    peek.append(
      el('span', { class: 'who', style: `color:${chatColor(role)}` }, nameOf(role)),
      el('span', { class: 'txt' }, text),
    );
    peek.hidden = false;
    peek.classList.remove('leaving'); void peek.offsetWidth; peek.classList.add('in');
    peekTimer = setTimeout(hidePeek, PEEK_MS);
  }

  function hidePeek() {
    clearTimeout(peekTimer);
    if (peek.hidden) return;
    peek.classList.remove('in'); peek.classList.add('leaving');
    peekTimer = setTimeout(() => { peek.hidden = true; peek.classList.remove('leaving'); }, 300);
  }

  function paintBadge() {
    badge.hidden = unread === 0;
    badge.textContent = unread > 9 ? '9+' : String(unread);
    fab.classList.toggle('has-unread', unread > 0);
  }

  function toggle(v) {
    open = v;
    sheet.hidden = !v;
    fab.hidden = v;
    if (v) hidePeek();
    if (v) {
      unread = 0; paintBadge(); scrollDown();
      // El foco automático abre el teclado y tapa media pantalla: mejor que lo pida el jugador.
      setTimeout(scrollDown, 60);
    } else { input.blur(); }
  }

  function submit() {
    const text = input.value.trim().replace(/\s+/g, ' ').slice(0, CHAT_MAX);
    if (!text) return;
    const now = Date.now();
    if (now - lastSent < MIN_GAP) {   // freno simple contra el spam de un solo dedo
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      vibrate(20);
      return;
    }
    lastSent = now;
    input.value = '';
    onSend(text);
    scrollDown();
  }

  /** Dibuja un mensaje. `live` distingue lo que llega ahora de la historia que se relee al reconectar. */
  function add(msg, { live = true } = {}) {
    const text = String(msg.text || '').slice(0, CHAT_MAX);
    if (!text) return;
    const empty = list.querySelector('.chat-empty'); if (empty) empty.remove();
    const mine = isMine(msg.from);
    const grouped = lastFrom === msg.from;
    lastFrom = msg.from;
    const row = el('div', { class: 'chat-msg' + (mine ? ' mine' : '') + (grouped ? ' grouped' : '') },
      grouped ? null : el('span', { class: 'who', style: `color:${mine ? 'var(--muted)' : chatColor(msg.from)}` }, nameOf(msg.from)),
      el('span', { class: 'txt' }, text),
    );
    list.append(row);
    rows.push(row);
    while (rows.length > KEEP) rows.shift().remove();
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    if (open && (atBottom || mine)) scrollDown();
    if (!live || mine) return;
    if (!open) { unread++; paintBadge(); showPeek(msg.from, text); }
    SFX.chat(); vibrate(12);
  }

  return {
    el: mount,
    add,
    open: () => toggle(true),
    close: () => toggle(false),
    /** Cierra solo si no hay nada escrito: el juego lo usa cuando llega el turno del jugador. */
    closeIfIdle() { if (open && !input.value.trim()) toggle(false); },
    show() { mount.hidden = false; onViewport(); },
    hide() { toggle(false); hidePeek(); mount.hidden = true; },
    destroy() {
      clearTimeout(peekTimer);
      if (vv) { vv.removeEventListener('resize', onViewport); vv.removeEventListener('scroll', onViewport); }
      document.removeEventListener('keydown', onKey);
      mount.innerHTML = ''; mount.hidden = true;
    },
  };
}
