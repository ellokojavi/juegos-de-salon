/**
 * The home page's search, a lab experiment (`?search`, the owner's request): a 🔎 pill that opens into
 * a field with a dropdown of the games it finds (drawSearch, D-390), by the game's name in any language, its tagline, its
 * types and the keywords below, in Spanish and English ("lógica", "dados", "dice"). Accents and case do not count, and each
 * word typed must start some word of the game ("dad" finds Dudo). Until it ships, the keywords live
 * here and not in games.js.
 */
import { TIPOS } from '../../assets/js/games.js';

/**
 * What a player might type for each game, in Spanish (`es`) and English (`en`): what it is, what it
 * is played with and what it is like, beyond its name and tagline. Both are searched in any language.
 */
export const KEYWORDS = {
  copa: {
    es: ['torneo', 'semana', 'amigos', 'competencia', 'campeonato', 'grupo', 'diario', 'ranking'],
    en: ['tournament', 'cup', 'week', 'friends', 'competition', 'championship', 'group', 'daily', 'ranking'],
  },
  rutas: {
    es: ['metro', 'lineas', 'tren', 'girar', 'rotar', 'conectar', 'caminos', 'puzzle', 'rompecabezas', 'logica'],
    en: ['subway', 'metro', 'lines', 'train', 'rotate', 'turn', 'connect', 'pipes', 'routes', 'puzzle', 'logic'],
  },
  loteo: {
    es: ['lotes', 'dividir', 'numeros', 'casillas', 'rectangulos', 'grilla', 'shikaku', 'puzzle', 'rompecabezas', 'logica'],
    en: ['plots', 'divide', 'split', 'numbers', 'cells', 'rectangles', 'grid', 'shikaku', 'puzzle', 'logic'],
  },
  pintaminas: {
    es: ['pintar', 'dibujo', 'imagen', 'grilla', 'nonograma', 'picross', 'casillas', 'puzzle', 'rompecabezas', 'logica'],
    en: ['paint', 'picture', 'drawing', 'image', 'grid', 'nonogram', 'picross', 'cells', 'puzzle', 'logic'],
  },
  reinas: {
    es: ['reina', 'ajedrez', 'colores', 'zonas', 'grilla', 'puzzle', 'rompecabezas', 'logica'],
    en: ['queens', 'queen', 'chess', 'colors', 'regions', 'grid', 'puzzle', 'logic'],
  },
  'linea-de-tiempo': {
    es: ['historia', 'orden', 'ordenar', 'fechas', 'hitos', 'futbol', 'cultura', 'preguntas'],
    en: ['timeline', 'history', 'order', 'sort', 'dates', 'events', 'soccer', 'football', 'trivia', 'quiz'],
  },
  tango: {
    es: ['soles', 'lunas', 'sol', 'luna', 'binario', 'grilla', 'puzzle', 'rompecabezas', 'logica'],
    en: ['suns', 'moons', 'sun', 'moon', 'binary', 'grid', 'puzzle', 'logic'],
  },
  conexiones: {
    es: ['grupos', 'palabras', 'categorias', 'relacionar', 'asociar', 'cultura'],
    en: ['connections', 'groups', 'words', 'categories', 'link', 'associate', 'trivia'],
  },
  anio: {
    es: ['año', 'fechas', 'historia', 'adivinar', 'cultura', 'preguntas'],
    en: ['year', 'dates', 'history', 'guess', 'trivia', 'quiz'],
  },
  letras: {
    es: ['palabra', 'letras', 'adivinar', 'wordle', 'toque', 'fama', 'vocabulario'],
    en: ['word', 'letters', 'guess', 'wordle', 'bulls', 'cows', 'vocabulary'],
  },
  donde: {
    es: ['mapa', 'geografia', 'ciudades', 'paises', 'globo', 'mundo', 'viajes', 'cultura'],
    en: ['map', 'geography', 'cities', 'countries', 'globe', 'world', 'travel', 'trivia', 'where'],
  },
  'toque-y-fama': {
    es: ['numeros', 'adivinar', 'codigo', 'secreto', 'mastermind', 'duelo', 'logica'],
    en: ['numbers', 'guess', 'code', 'secret', 'mastermind', 'bulls', 'cows', 'duel', 'logic'],
  },
  zip: {
    es: ['trazo', 'camino', 'linea', 'numeros', 'unir', 'recorrido', 'puzzle', 'rompecabezas', 'logica'],
    en: ['path', 'line', 'trail', 'numbers', 'connect', 'route', 'puzzle', 'logic'],
  },
  desenredo: {
    es: ['nudos', 'hilos', 'cruces', 'enredo', 'desenredar', 'arrastrar', 'puzzle', 'rompecabezas', 'logica'],
    en: ['untangle', 'tangle', 'knots', 'threads', 'crossings', 'drag', 'puzzle', 'logic'],
  },
  'batalla-naval': {
    es: ['barcos', 'flota', 'hundir', 'mar', 'guerra', 'duelo', 'estrategia'],
    en: ['battleship', 'ships', 'fleet', 'sink', 'sea', 'war', 'duel', 'strategy'],
  },
  ahorcado: {
    es: ['palabras', 'letras', 'adivinar', 'vocabulario', 'vidas'],
    en: ['hangman', 'words', 'letters', 'guess', 'vocabulary', 'lives'],
  },
  dudo: {
    es: ['dados', 'cacho', 'mentiroso', 'mentir', 'apuesta', 'farol', 'previa', 'carrete', 'cubilete'],
    en: ['dice', 'liar', 'lie', 'bluff', 'bet', 'party', 'cup'],
  },
  'cuarto-rey': {
    es: ['cartas', 'naipes', 'baraja', 'tomar', 'beber', 'tragos', 'previa', 'carrete', 'rey'],
    en: ['cards', 'deck', 'drinking', 'drinks', 'party', 'king', 'kings'],
  },
  generala: {
    es: ['dados', 'escalera', 'full', 'poker', 'planilla', 'cubilete'],
    en: ['dice', 'yahtzee', 'straight', 'full', 'house', 'poker', 'scorecard'],
  },
  julepe: {
    es: ['cartas', 'naipes', 'baraja', 'bazas', 'apuesta'],
    en: ['cards', 'deck', 'tricks', 'bet'],
  },
};

/** "Lógica" → "logica": what is compared, so accents and capitals never get in the way. */
export const plain = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();
const words = s => plain(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

/** Every word a game can be found by: its name and tagline in every language, its types and its keywords. */
export function wordsOf(g) {
  const all = [
    ...Object.values(g.name || {}), ...Object.values(g.tagline || {}),
    ...(g.tipos || []).flatMap(t => [t, ...Object.values(TIPOS[t]?.name || {})]),
    ...Object.values(KEYWORDS[g.id] || {}).flat(),
  ];
  return new Set(all.flatMap(words));
}

// A typed word matches a game's word that starts with it ("dad" → "dados"), or one it starts with
// but for a short ending, so "reinas" also finds "reina" and "dados" finds "dado"
const matches = (typed, word) => word.startsWith(typed) || (word.length >= 4 && typed.startsWith(word) && typed.length - word.length <= 2);

/** The ids of the games that every typed word finds, or null when nothing is typed (no search). */
export function search(query, games) {
  const typed = words(query);
  if (!typed.length) return null;
  return new Set(games.filter(g => { const own = wordsOf(g); return typed.every(t => [...own].some(w => matches(t, w))); }).map(g => g.id));
}

/**
 * The word that found the game, as it is written (with its accents), to show next to it: the first
 * one a typed word matched that is not already in the game's name, or null when the name says it.
 * Words of three letters or fewer never show: typing "la" would name "las" from a tagline.
 */
export function matchedWord(query, g, lang = 'es') {
  // Only the name the player sees: "dados" finds Dudo through its Portuguese name, Dado Mentiroso,
  // but in Spanish what says it is the tagline
  const named = new Set(words(g.name?.[lang] ?? g.name?.es));
  const sources = [g.tagline?.[lang], ...(g.tipos || []).map(t => TIPOS[t]?.name?.[lang]), ...Object.values(KEYWORDS[g.id] || {}).flat(), ...Object.values(g.tagline || {})];
  for (const t of words(query)) {
    if ([...named].some(w => matches(t, w))) continue;
    for (const src of sources) for (const raw of String(src ?? '').split(/[^\p{L}\p{N}]+/u)) if (raw.length >= 4 && matches(t, plain(raw))) return raw.toLowerCase();
  }
  return null;
}

export const TEXTS = {
  es: { placeholder: 'Buscar: lógica, dados…', label: 'Buscar un juego', none: 'Ningún juego con «{q}».', clear: 'Cerrar la búsqueda', all: 'Ver los {n} juegos con «{q}»', one: 'Ver el juego con «{q}» en la lista', soon: 'Próximamente' },
  en: { placeholder: 'Search: logic, dice…', label: 'Find a game', none: 'No game matches “{q}”.', clear: 'Close the search', all: 'See the {n} games with “{q}”', one: 'See the game with “{q}” in the list', soon: 'Coming soon' },
  pt: { placeholder: 'Buscar: lógica, dados…', label: 'Buscar um jogo', none: 'Nenhum jogo com “{q}”.', clear: 'Fechar a busca', all: 'Ver os {n} jogos com “{q}”', one: 'Ver o jogo com “{q}” na lista', soon: 'Em breve' },
  de: { placeholder: 'Suchen: Logik, Würfel…', label: 'Spiel suchen', none: 'Kein Spiel passt zu „{q}“.', clear: 'Suche schließen', all: 'Die {n} Spiele mit „{q}“ zeigen', one: 'Das Spiel mit „{q}“ in der Liste zeigen', soon: 'Demnächst' },
};

/** How many games the dropdown names before "see them all". */
export const SUGGESTIONS = 5;

/**
 * A 🔎 pill in the row of ✨ Nuevos and 🔥 Populares (`into`'s `.atajos`). Tapped, it opens into a field
 * over that whole row, and while typing a dropdown under it names up to SUGGESTIONS games (a tap opens
 * one) and ends with "see the n games", which filters the list below through `onChange(ids)`. The list
 * does not move while typing. ✕ closes the field and brings the pills back. Returns `clear()`, for the
 * home page's "show all".
 */
export function drawSearch({ into, lang, games, onChange, pickName = (n, l) => n?.[l] ?? n?.es }) {
  const T = TEXTS[lang] || TEXTS.es;
  const row = into.querySelector('.atajos') || into;
  const el = (tag, props = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(props)) if (k === 'class') e.className = v; else if (k in e && typeof v !== 'string') e[k] = v; else e.setAttribute(k, v); e.append(...kids); return e; };
  const pill = el('button', { type: 'button', class: 'buscar-pill', 'aria-label': T.label, title: T.label, 'aria-expanded': 'false' }, el('span', { class: 'ficha-emoji', 'aria-hidden': 'true' }, '🔎'));
  const input = el('input', { type: 'search', id: 'buscar', placeholder: T.placeholder, autocomplete: 'off', enterkeyhint: 'search', 'aria-label': T.label, role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'buscar-lista', 'aria-autocomplete': 'list', spellcheck: 'false' });
  const cerrar = el('button', { type: 'button', class: 'buscar-cerrar', 'aria-label': T.clear, title: T.clear }, '✕');
  const lista = el('div', { class: 'buscar-lista', id: 'buscar-lista', role: 'listbox', hidden: true });
  const campo = el('div', { class: 'buscar' }, el('span', { class: 'buscar-lupa', 'aria-hidden': 'true' }, '🔎'), input, cerrar, lista);
  row.append(pill, campo);
  row.hidden = false;
  const style = document.createElement('style');
  style.textContent = `
    .filtros .atajos:has(.buscar-pill) { gap: 6px; }
    .filtros .atajos:has(.buscar-pill) button { padding-inline: 12px; }
    .filtros .atajos .buscar-pill { flex: 0 0 auto; min-width: 44px; padding-inline: 10px; }
    .filtros .atajos .buscar-pill .ficha-emoji { font-size: 1.15rem; }
    .filtros .atajos .buscar { display: none; }
    .filtros .atajos.buscando > :not(.buscar) { display: none !important; }
    .filtros .atajos.buscando .buscar { display: block; position: relative; z-index: 30; flex: 1 1 auto; }
    .buscar input { width: 100%; box-sizing: border-box; min-height: 44px; padding: 10px 44px 10px 40px; border-radius: 999px;
      font: inherit; font-weight: 700; font-size: 1rem; color: var(--ink); background: var(--glass); border: 1px solid var(--cyan); }
    .buscar input::placeholder { color: var(--muted); font-weight: 600; }
    .buscar input:focus { outline: none; }
    .buscar input::-webkit-search-cancel-button { display: none; }
    .buscar-lupa { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; }
    .buscar-cerrar { position: absolute; right: 0; top: 0; width: 44px; height: 44px; border: 0; background: none; color: var(--muted); font: inherit; font-weight: 800; cursor: pointer; }
    .buscar-lista { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 20; display: grid; padding: 6px; border-radius: 18px;
      background: #1a0a2e; border: 1px solid var(--glass-border); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5); text-align: left; }
    .buscar-lista[hidden] { display: none; }
    .buscar-lista a, .buscar-lista .sug { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 6px 10px; border-radius: 12px; color: var(--ink); text-decoration: none; font-weight: 700; }
    .buscar-lista a:hover, .buscar-lista a:focus-visible, .buscar-lista button:hover { background: var(--glass); outline: none; }
    .buscar-lista .sug-emoji { font-size: 1.3rem; width: 1.6rem; text-align: center; }
    .buscar-lista .sug-nombre { flex: 0 0 auto; }
    .buscar-lista .sug-por { color: var(--muted); font-weight: 600; font-style: italic; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .buscar-lista .sug.soon { opacity: 0.55; }
    .buscar-lista .buscar-todos { min-height: 44px; margin-top: 4px; border: 0; border-top: 1px solid var(--glass-border); border-radius: 0 0 12px 12px; background: none; color: var(--cyan); font: inherit; font-weight: 800; cursor: pointer; text-align: center; }
    .buscar-lista .buscar-nada { margin: 0; padding: 10px; text-align: center; color: var(--muted); font-weight: 700; }`;
  document.head.append(style);
  // Who is listening to the home page: the ⭐ chip moves to fit the row with the pill in it
  document.dispatchEvent(new CustomEvent('favoritos'));

  // Opening it brings the filters to the top of the screen, so the dropdown has room above the keyboard
  const subir = () => {
    const marca = document.getElementById('filtros-marca');
    const barra = document.getElementById('filtros-barra');
    if (!marca || !barra) return;
    const y = Math.ceil(marca.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(barra).top) || 0));
    if (y > scrollY) scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const abrir = () => { row.classList.add('buscando'); pill.setAttribute('aria-expanded', 'true'); input.focus({ preventScroll: true }); subir(); sugerir(); };
  const verTodos = ids => { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); input.blur(); onChange(ids); };
  const sugerir = () => {
    const q = input.value.trim();
    const ids = search(q, games);
    if (!ids) { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const found = games.filter(g => ids.has(g.id));
    const kids = found.slice(0, SUGGESTIONS).map(g => {
      const por = matchedWord(q, g, lang);
      const kidsOf = [el('span', { class: 'sug-emoji', 'aria-hidden': 'true' }, g.emoji), el('span', { class: 'sug-nombre' }, pickName(g.name, lang)), (por || !g.available) ? el('span', { class: 'sug-por' }, `· ${g.available ? por : T.soon}`) : ''];
      return g.available ? el('a', { class: 'sug', href: g.path, role: 'option', 'data-id': g.id }, ...kidsOf) : el('div', { class: 'sug soon', role: 'option', 'aria-disabled': 'true', 'data-id': g.id }, ...kidsOf);
    });
    if (found.length) kids.push(el('button', { type: 'button', class: 'buscar-todos', onclick: () => verTodos(ids) }, (found.length === 1 ? T.one : T.all).replace('{n}', found.length).replace('{q}', q)));
    else kids.push(el('p', { class: 'buscar-nada', 'aria-live': 'polite' }, T.none.replace('{q}', q)));
    lista.replaceChildren(...kids);
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  const cerrarTodo = () => { input.value = ''; lista.hidden = true; row.classList.remove('buscando'); pill.setAttribute('aria-expanded', 'false'); onChange(null); };
  pill.addEventListener('click', abrir);
  // The list below stays as it is while typing (the owner's choice): only the dropdown follows
  input.addEventListener('input', sugerir);
  input.addEventListener('focus', () => { if (input.value.trim()) sugerir(); });
  // Enter: the same as "see them all", and the keyboard goes away so the list is seen
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const ids = search(input.value, games); if (ids?.size) verTodos(ids); else input.blur(); }
    if (e.key === 'Escape') cerrarTodo();
  });
  cerrar.addEventListener('click', cerrarTodo);
  // A tap outside folds the dropdown away, leaving the field and what it filtered
  document.addEventListener('pointerdown', e => { if (!campo.contains(e.target)) { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); } });
  return { clear: () => { if (input.value || row.classList.contains('buscando')) cerrarTodo(); } };
}
