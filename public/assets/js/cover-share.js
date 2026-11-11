/**
 * A game's cover shares its own link (flag `cover-share`): one round button in the top bar, before
 * sound, that sends the game's name, one line inviting to play and the link (U-30). The name and its
 * emoji come from the top bar's chip, which every game page has. The link is the page alone, never
 * its search or hash, so a room code or a seed is not passed on. Without a share menu it copies the
 * message and the button shows a check for two seconds.
 */
import { el, ICONO_COMPARTIR } from './ui.js';
import { getLang, COMMON } from './i18n.js';
import { compartir, cabecera } from './compartir.js';

/** `🪢 El Ahorcado` → { emoji: '🪢', name: 'El Ahorcado' }; a chip without an emoji gets 🎲. */
export function gameOfChip(text = '') {
  const t = String(text).trim();
  const [first, ...rest] = t.split(' ');
  return /\p{Extended_Pictographic}/u.test(first) && rest.length ? { emoji: first, name: rest.join(' ') } : { emoji: '🎲', name: t };
}

/** The message: the header with the game's name and the invitation line (the link goes after it). */
export const coverShareText = ({ C, emoji, name }) => [cabecera({ emoji, titulo: name }), C.shareGameCta].join('\n\n');

/** The page's own link, without search or hash. */
export const coverUrl = (loc = globalThis.location) => `${loc.origin}${loc.pathname}`;

export function mountCoverShare({ doc = document, lang = getLang() } = {}) {
  const tools = doc.querySelector('.topbar .tools');
  if (!tools || tools.querySelector('#btn-share-cover')) return null;
  const C = COMMON[lang] || COMMON.es;
  const btn = el('button', { type: 'button', class: 'icon-btn', id: 'btn-share-cover', title: C.shareGame, 'aria-label': C.shareGame });
  btn.innerHTML = ICONO_COMPARTIR;
  btn.addEventListener('click', async () => {
    const { emoji, name } = gameOfChip(tools.querySelector('.chip')?.textContent || doc.title);
    const r = await compartir({ titulo: name, texto: coverShareText({ C, emoji, name }), url: coverUrl(), que: 'cover' });
    // A title is never seen on a phone: the icon turns into a check while the message is copied
    if (r === 'copied') {
      btn.textContent = '✓'; btn.title = C.shareCopied; btn.setAttribute('aria-label', C.shareCopied);
      setTimeout(() => { btn.innerHTML = ICONO_COMPARTIR; btn.title = C.shareGame; btn.setAttribute('aria-label', C.shareGame); }, 2000);
    }
  });
  tools.insertBefore(btn, tools.querySelector('#sound-slot'));
  // Only on the cover: once the game starts the intro screen leaves and the button with it
  const intro = doc.getElementById('screen-intro');
  if (intro) {
    const sync = () => { btn.hidden = !intro.classList.contains('active'); };
    new MutationObserver(sync).observe(intro, { attributes: true, attributeFilter: ['class'] });
    sync();
  }
  return btn;
}
