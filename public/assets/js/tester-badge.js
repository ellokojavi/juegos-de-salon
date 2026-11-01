/**
 * The «tester» tag next to the home page's title, only for lab key holders (D-395): a subtle chip,
 * the same word in every language, that opens a sheet saying what the key gives. Everyone else
 * sees the title as it always was. Its texts live here, in the three languages (C-3).
 */
import { el } from './ui.js';
import { labAccess } from './lab-access.js';

const T = {
  es: {
    title: '🧪 Eres tester',
    intro: 'Tu teléfono tiene una llave de tester. Con ella ves Juegos de Salón un paso antes que el resto:',
    items: [
      ['🧪 Labs', 'Entras a /labs/, con los juegos y las mejoras que están en prueba, cada uno con su explicación.'],
      ['🎮 Lo nuevo, ya activo', 'Los juegos y funciones que todavía están en prueba se te activan solos en el sitio, aunque los demás aún no los vean.'],
      ['💬 Tu opinión', 'Lo que pruebes, coméntalo desde su tarjeta en Labs o con 🐞: así decidimos qué se lanza.'],
    ],
    note: 'La llave queda guardada en este teléfono. Si borras los datos del sitio, abre otra vez tu link de tester.',
    go: '🧪 Ir a Labs', close: 'Cerrar',
  },
  en: {
    title: '🧪 You are a tester',
    intro: 'This phone holds a tester key. With it you see Juegos de Salón a step ahead of everyone else:',
    items: [
      ['🧪 Labs', 'You can open /labs/, with the games and improvements being tried out, each with its explanation.'],
      ['🎮 What is new, already on', 'Games and features still being tried out turn on for you across the site, before anyone else sees them.'],
      ['💬 Your opinion', 'Whatever you try, comment on it from its card in Labs or with 🐞: that is how we decide what launches.'],
    ],
    note: 'The key is saved on this phone. If you clear the site\'s data, open your tester link again.',
    go: '🧪 Go to Labs', close: 'Close',
  },
  pt: {
    title: '🧪 Você é tester',
    intro: 'Este celular tem uma chave de tester. Com ela você vê o Juegos de Salón um passo antes dos outros:',
    items: [
      ['🧪 Labs', 'Você entra em /labs/, com os jogos e as melhorias em teste, cada um com sua explicação.'],
      ['🎮 O que é novo, já ativo', 'Os jogos e funções ainda em teste são ativados para você no site, antes que os outros os vejam.'],
      ['💬 Sua opinião', 'O que você testar, comente pelo cartão no Labs ou com 🐞: é assim que decidimos o que é lançado.'],
    ],
    note: 'A chave fica salva neste celular. Se você apagar os dados do site, abra de novo o seu link de tester.',
    go: '🧪 Ir para o Labs', close: 'Fechar',
  },
};

function sheet(t, labsUrl) {
  const close = () => { capa.remove(); chip?.focus?.(); };
  const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tester-titulo', id: 'tester-hoja' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
    el('h2', { id: 'tester-titulo' }, t.title),
    el('p', {}, t.intro),
    ...t.items.map(([h, p]) => el('p', {}, el('b', {}, h), el('br'), p)),
    el('p', { class: 'muted' }, t.note),
    el('div', { class: 'btn-row' },
      el('a', { class: 'btn btn--yellow', href: labsUrl, id: 'tester-labs' }, t.go),
      el('button', { type: 'button', class: 'btn btn--ghost', onClick: close }, t.close)));
  const capa = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
  capa.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.body.append(capa);
  panel.querySelector('#tester-labs').focus();
}

let chip = null;
/** Puts the chip after `title` when this visitor holds a lab key. */
export async function testerBadge(title, { lang = 'es', labsUrl = new URL('../../labs/', import.meta.url).href, access = labAccess } = {}) {
  if (!title || !(await access()) || document.getElementById('tester-chip')) return;
  const t = T[lang] || T.es;
  chip = el('button', { type: 'button', class: 'tester-chip', id: 'tester-chip', 'aria-haspopup': 'dialog', 'aria-label': t.title, onClick: () => sheet(t, labsUrl) }, 'tester');
  title.after(chip);
  // On the title's top right corner, over it, never pushing anything: where its text ends, not its box
  const place = () => {
    const r = document.createRange(); r.selectNodeContents(title);
    const t = r.getBoundingClientRect(), box = title.offsetParent?.getBoundingClientRect();
    if (!box || !t.width) return;
    const left = Math.min(t.right - box.left - 18, box.width - chip.offsetWidth - 4);
    chip.style.left = `${Math.max(4, left)}px`;
    chip.style.top = `${t.top - box.top - 10}px`;
  };
  place();
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
  // The language toggle rewrites the title: the chip follows its new width
  new MutationObserver(place).observe(title, { childList: true, characterData: true, subtree: true });
}

export const TESTER_TEXTS = T;
