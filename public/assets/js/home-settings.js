/**
 * The home page's ⚙️ settings (lab flag home-settings): one button in the top bar that holds the
 * language, the sound and the games kept for no signal, so the bar has one row and the space above
 * the title goes back to the page. It moves the controls the bar already draws into its panel, so
 * each keeps its own behaviour (the language reloads, the sound remembers, the cloud opens its sheet).
 * lab: #seccion-home-settings
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';
import { loadCss } from './load-css.js';

export const TEXTS = {
  es: { title: 'Ajustes', language: 'Idioma', sound: 'Sonido', offline: 'Juegos sin señal' },
  en: { title: 'Settings', language: 'Language', sound: 'Sound', offline: 'Games with no signal' },
  pt: { title: 'Ajustes', language: 'Idioma', sound: 'Som', offline: 'Jogos sem sinal' },
};

/** Moves the language, sound and offline controls of `bar` into one ⚙️ panel. Returns the button's wrap. */
export function mountHomeSettings({ bar, lang = getLang(), tap = () => {}, doc = globalThis.document } = {}) {
  const t = TEXTS[lang] || TEXTS.es;
  loadCss(new URL('../css/home-settings.css', import.meta.url));
  const row = (label, control) => el('div', { class: 'settings-row' }, el('span', { class: 'settings-label' }, label), control);
  const langSlot = bar.querySelector('#lang-slot');
  const sound = bar.querySelector('#sound-slot .sound-toggle');
  const cloud = bar.querySelector('#offline-ready-slot .offline-ready');
  const rows = [];
  if (langSlot?.firstChild) rows.push(row(t.language, langSlot.firstChild));
  if (sound) rows.push(row(t.sound, sound));
  let cloudRow = null;
  if (cloud) {
    cloudRow = row(t.offline, cloud);
    // The cloud shows only while offline mode is on: its row follows it
    const follow = () => { cloudRow.hidden = cloud.hidden; };
    follow();
    new MutationObserver(follow).observe(cloud, { attributes: true, attributeFilter: ['hidden'] });
    rows.push(cloudRow);
  }
  const panel = el('div', { class: 'settings-pop', id: 'settings-pop', role: 'dialog', 'aria-label': t.title, hidden: true },
    el('div', { class: 'settings-title display display--sm' }, t.title), ...rows);
  const btn = el('button', {
    type: 'button', class: 'icon-btn settings-btn', id: 'btn-settings', title: t.title, 'aria-label': t.title,
    'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'settings-pop',
  }, '⚙️');
  const wrap = el('span', { class: 'settings-wrap' }, btn, panel);
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => {
    tap();
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', String(!panel.hidden));
  });
  // The cloud's sheet opens over the page: the panel steps aside for it
  cloud?.addEventListener('click', close);
  doc.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  doc.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  langSlot?.remove();
  bar.querySelector('#sound-slot')?.remove();
  bar.querySelector('#offline-ready-slot')?.remove();
  bar.classList.add('with-settings');
  bar.querySelector('.tools').prepend(wrap);
  return wrap;
}
