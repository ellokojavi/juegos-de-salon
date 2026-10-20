/**
 * The home page's search box, a lab experiment (`?search`, the owner's request): a field above the
 * filters that narrows the list while typing, by the game's name in any language, its tagline, its
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

export const TEXTS = {
  es: { placeholder: 'Busca un juego: lógica, dados, palabras…', label: 'Buscar un juego', none: 'Ningún juego con «{q}».', clear: 'Borrar la búsqueda' },
  en: { placeholder: 'Find a game: logic, dice, words…', label: 'Find a game', none: 'No game matches “{q}”.', clear: 'Clear the search' },
  pt: { placeholder: 'Busque um jogo: lógica, dados, palavras…', label: 'Buscar um jogo', none: 'Nenhum jogo com “{q}”.', clear: 'Apagar a busca' },
  de: { placeholder: 'Spiel suchen: Logik, Würfel, Wörter…', label: 'Spiel suchen', none: 'Kein Spiel passt zu „{q}“.', clear: 'Suche löschen' },
};

/**
 * Draws the box at the top of the filters and calls `onChange(ids)` while typing: a Set of the ids
 * found, or null when the box is empty. Returns `clear()`, for the home page's "show all".
 */
export function drawSearch({ into, lang, games, onChange }) {
  const T = TEXTS[lang] || TEXTS.es;
  const input = document.createElement('input');
  Object.assign(input, { type: 'search', id: 'buscar', placeholder: T.placeholder, autocomplete: 'off', enterKeyHint: 'search' });
  input.setAttribute('aria-label', T.label);
  input.spellcheck = false;
  const borrar = document.createElement('button');
  Object.assign(borrar, { type: 'button', className: 'buscar-borrar', textContent: '✕', hidden: true });
  borrar.setAttribute('aria-label', T.clear);
  const caja = document.createElement('div');
  caja.className = 'buscar';
  caja.append(input, borrar);
  const nada = document.createElement('p');
  nada.className = 'buscar-nada'; nada.hidden = true; nada.setAttribute('aria-live', 'polite');
  const style = document.createElement('style');
  style.textContent = `
    .buscar { position: relative; }
    .buscar input { width: 100%; box-sizing: border-box; min-height: 44px; padding: 10px 44px 10px 16px; border-radius: 999px;
      font: inherit; font-weight: 700; font-size: 1rem; color: var(--ink); background: var(--glass); border: 1px solid var(--glass-border); }
    .buscar input::placeholder { color: var(--muted); font-weight: 600; }
    .buscar input:focus { outline: 2px solid var(--cyan); outline-offset: 1px; }
    .buscar input::-webkit-search-cancel-button { display: none; }
    .buscar-borrar { position: absolute; right: 0; top: 0; width: 44px; height: 44px; border: 0; background: none; color: var(--muted); font: inherit; font-weight: 800; cursor: pointer; }
    .buscar-borrar[hidden], .buscar-nada[hidden] { display: none; }
    .buscar-nada { text-align: center; color: var(--muted); font-weight: 700; margin: 4px 0 0; }`;
  document.head.append(style);
  const update = () => {
    const ids = search(input.value, games);
    borrar.hidden = !input.value;
    nada.hidden = !ids || ids.size > 0;
    nada.textContent = T.none.replace('{q}', input.value.trim());
    onChange(ids);
  };
  input.addEventListener('input', update);
  // Enter on a phone keyboard closes it, so the results are seen whole
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  borrar.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  into.prepend(caja, nada);
  return { clear: () => { if (input.value) { input.value = ''; update(); } } };
}
