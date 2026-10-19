/**
 * Registro central de juegos.
 * Para agregar un juego nuevo: crear su carpeta public/<carpeta>/ con su index.html y agregar una
 * entrada aquí. Los textos van por idioma ({ es, en, pt }). El menú principal se genera desde esta lista.
 *
 * El `id` y la carpeta son dos cosas (D-192): el id es un dato —lo guardan las salas de Firebase, el
 * panel y el localStorage— y no cambia nunca; la carpeta es la URL (`path`) y va en inglés. Los
 * juegos de antes conservan su id en español ('ahorcado' vive en /hangman/) y su ruta vieja
 * (/<id>/) queda como página puente, que genera `node tools/release/og.mjs cards`.
 */
export const GAMES = [
  {
    id: 'copa',
    emoji: '🏆',
    name: { es: 'La Copa', en: 'The Cup', pt: 'A Copa', de: 'Der Pokal' },
    tagline: { es: 'Un torneo de una semana entre amigos, con un juego distinto cada día.', en: 'A week-long tournament among friends, with a different game every day.', pt: 'Um torneio de uma semana entre amigos, com um jogo diferente por dia.', de: 'Ein Turnier unter Freunden, eine Woche lang, mit einem anderen Spiel pro Tag.' },
    players: '2–10',
    duration: '7',
    // No dura minutos sino días. Va en los tres idiomas (D-170): la copa elige el de sus palabras
    durationUnit: { es: 'días', en: 'days', pt: 'dias', de: 'Tage' },
    // Cómo se juega, para la tabla del README: una copa no tiene modos de un celular o de sala.
    formato: { es: 'Cada uno en su celular, un juego por día', en: 'Each on their own phone, one game a day', pt: 'Cada um no seu celular, um jogo por dia', de: 'Jeder auf seinem Handy, ein Spiel pro Tag' },
    // Un torneo no es una partida: cada día manda su señal con `players: 1` y no pesa en MAX_PLAYERS.
    torneo: true,
    // Tiene de todo: aparece con cualquier tipo que se elija en los filtros de la portada
    tipos: ['words', 'logic', 'trivia'],
    path: 'cup/',
    // Salió del laboratorio (D-175): se abre desde el menú. /labs/ sigue para probar (la Copa de 3
    // días, la práctica con semilla y las demos).
    available: true,
  },
  {
    id: 'linea-de-tiempo',
    tipos: ['trivia'],
    emoji: '⏳',
    name: { es: 'Línea de Tiempo', en: 'Timeline', pt: 'Linha do Tempo', de: 'Zeitstrahl' },
    tagline: { es: 'Ubica los hitos en el orden correcto. Seis temáticas, de la historia al fútbol.', en: 'Put the milestones in the right order. Six themes, from history to soccer.', pt: 'Coloque os marcos na ordem certa. Seis temas, da história ao futebol.', de: 'Bring die Ereignisse in die richtige Reihenfolge. Sechs Themen, von Geschichte bis Fußball.' },
    players: '1–6',
    duration: '10–20',
    jugadas: ['place'],
    path: 'timeline/',
    available: true,
  },
  {
    id: 'toque-y-fama',
    tipos: ['logic'],
    emoji: '🔢',
    name: { es: 'Toque y Fama', en: 'Bulls and Cows', pt: 'Toque e Fama', de: 'Bullen und Kühe' },
    tagline: { es: 'Adivina el número secreto con toques y famas.', en: 'Crack the secret number with bulls and cows.', pt: 'Descubra o número secreto com toques e famas.', de: 'Knack die Geheimzahl mit Bullen und Kühen.' },
    players: '1–2',
    duration: '5–12',
    jugadas: ['guess'],
    path: 'bulls-and-cows/',
    available: true,
  },
  {
    id: 'ahorcado',
    tipos: ['words'],
    emoji: '🪢',
    name: { es: 'El Ahorcado', en: 'Hangman', pt: 'Forca', de: 'Galgenmännchen' },
    tagline: { es: 'Adivina tu palabra antes de quedarte sin vidas. Acá nadie se queda mirando.', en: 'Crack your word before you run out of lives. Nobody sits this one out.', pt: 'Descubra sua palavra antes de ficar sem vidas. Aqui ninguém fica só olhando.', de: 'Errate dein Wort, bevor dir die Leben ausgehen. Hier schaut keiner nur zu.' },
    players: '1–6',
    duration: '5–12',
    jugadas: ['word', 'guess', 'buy'],
    path: 'hangman/',
    available: true,
  },
  {
    id: 'dudo',
    tipos: ['tabletop'],
    emoji: '🎲',
    name: { es: 'Dudo', en: 'Liar\'s Dice', pt: 'Dado Mentiroso', de: 'Lügenwürfel' },
    tagline: { es: 'Apuesta cuántos dados hay en la mesa y aguanta la cara.', en: 'Bid how many dice are on the table and keep a straight face.', pt: 'Aposte quantos dados tem na mesa sem entregar o jogo.', de: 'Wette, wie viele Würfel auf dem Tisch liegen, und verzieh keine Miene.' },
    players: '1–6',
    duration: '10–20',
    jugadas: ['bid', 'dudo', 'calza'],
    path: 'liars-dice/',
    available: true,
  },
  {
    id: 'generala',
    tipos: ['tabletop'],
    emoji: '📝',
    name: { es: 'Generala', en: 'Generala', pt: 'General', de: 'Generala' },
    tagline: { es: 'Tira cinco dados hasta tres veces y llena tu planilla. Escalera, full, póker… ¡y generala!', en: 'Roll five dice up to three times and fill your score card. Straight, full house… and generala!', pt: 'Jogue cinco dados até três vezes e preencha sua cartela. Sequência, full, quadra… e general!', de: 'Wirf fünf Würfel bis zu dreimal und füll deinen Block. Straße, Full House … und Generala!' },
    players: '1–6',
    duration: '15–30',
    jugadas: ['roll', 'score'],
    path: 'generala/',
    // En la portada como "Próximamente" (D-248): el juego está entero en /generala/, pero se
    // anuncia antes de abrirse. Al abrirlo, entra también a Uno al día (D-247).
    available: false,
  },
  {
    id: 'batalla-naval',
    tipos: ['logic'],
    emoji: '⚓',
    name: { es: 'Batalla Naval', en: 'Battleship', pt: 'Batalha Naval', de: 'Schiffe versenken' },
    tagline: { es: 'Hunde la flota del rival antes de que hunda la tuya.', en: 'Sink your rival\'s fleet before they sink yours.', pt: 'Afunde a frota do rival antes que ele afunde a sua.', de: 'Versenk die Flotte deines Gegners, bevor er deine versenkt.' },
    players: '1–2',
    duration: '10–20',
    jugadas: ['shot'],
    path: 'battleship/',
    available: true,
  },
  {
    id: 'julepe',
    tipos: ['tabletop'],
    emoji: '🍹',
    name: { es: 'Julepe', en: 'Julep', pt: 'Paga o Bolo', de: 'Julepe' },
    tagline: { es: 'Dices si vas o te pasas. Si vas y no haces dos bazas, te tomas todo el plato.', en: 'Say if you are in or out. Go in, miss two tricks, and you drink the whole pot.', pt: 'Você diz se entra ou passa. Se entrar e não fizer duas vazas, bebe o bolo inteiro.', de: 'Sag, ob du mitgehst oder passt. Gehst du mit und machst keine zwei Stiche, trinkst du den ganzen Topf.' },
    players: '1–6',
    duration: '15–30',
    jugadas: ['va', 'paso', 'cambia', 'juega', 'regala'],
    path: 'julep/',
    // Fuera del menú por ahora: las reglas no quedaron claras y se están reescribiendo (D-88).
    // El juego sigue entero en /julep/, solo no se ofrece desde acá.
    available: false,
  },
  {
    id: 'cuarto-rey',
    tipos: ['tabletop'],
    emoji: '👑',
    name: { es: 'Cuarto Rey', en: 'Fourth King', pt: 'Quarto Rei', de: 'Der vierte König' },
    tagline: { es: 'Naipes, sorbos y el temido cuarto rey.', en: 'Cards, sips and the dreaded fourth king.', pt: 'Cartas, goles e o temido quarto rei.', de: 'Karten, Schlucke und der gefürchtete vierte König.' },
    players: '4–6',
    duration: '20–40',
    path: 'fourth-king/',
    available: true,
  },
];

/**
 * Los juegos de La Copa, que también se juegan desde la portada (D-142), de a uno y sin copa: son
 * juegos como los demás (D-198) y abren `<slug>/` (D-149, D-162, D-192), la pantalla de práctica de
 * La Copa con un link que no dice "copa": no cuenta para ninguna copa y, si hay jugador, va a los rankings (D-212). Van aparte
 * de GAMES solo por cómo están hechos: no son una carpeta con su `rules.js` (su motor y su pantalla
 * viven en cup/games/), así que el README y las pruebas de idioma de los juegos no los recorren. Su
 * página y su tarjeta social las genera `node tools/release/og.mjs cards` a partir de cup/suelto/index.html.
 *
 * Uno con `labs: true` todavía no va en la portada, pero su link ya se comparte: tiene página y
 * tarjeta igual (como La Copa, D-101).
 *
 * Línea Relámpago y Toque y Fama: adivina el número no están: son el modo solo de Línea de Tiempo
 * y de Toque y Fama. La Gran Final tampoco: repite los otros y es el cierre de la copa.
 *
 * Se juegan en el idioma de quien juega, con contenido propio de cada idioma (D-170).
 */
export const SUELTOS = [
  {
    id: 'conexiones',
    slug: 'connections',
    emoji: '🔗',
    name: { es: 'Conexiones', en: 'Connections', pt: 'Conexões', de: 'Verbindungen' },
    tagline: { es: 'Arma cuatro grupos de cuatro palabras que tienen algo en común.', en: 'Sort sixteen words into four groups of four that share something.', pt: 'Monte quatro grupos de quatro palavras que têm algo em comum.', de: 'Sortier sechzehn Wörter in vier Gruppen, die etwas gemeinsam haben.' },
    tipos: ['words', 'trivia'],
    duration: '3–8',
  },
  {
    id: 'letras',
    slug: 'word',
    emoji: '🔤',
    name: { es: 'Toque y Fama: Palabra', en: 'Bulls and Cows: Word', pt: 'Toque e Fama: Palavra', de: 'Bullen und Kühe: Wort' },
    tagline: { es: 'Adivina la palabra secreta de cinco letras con toques y famas.', en: 'Crack the five-letter secret word with bulls and cows.', pt: 'Descubra a palavra secreta de cinco letras com toques e famas.', de: 'Knack das geheime Wort aus fünf Buchstaben mit Bullen und Kühen.' },
    tipos: ['words', 'logic'],
    duration: '3–8',
  },
  {
    id: 'anio',
    slug: 'year',
    emoji: '📅',
    name: { es: '¿En qué año?', en: 'What Year?', pt: 'Em que ano?', de: 'Welches Jahr?' },
    tagline: { es: 'Adivina en qué año pasó cada hito. Mientras más cerca, más puntos.', en: 'Guess the year each milestone happened. The closer you get, the more points.', pt: 'Adivinhe em que ano aconteceu cada marco. Quanto mais perto, mais pontos.', de: 'Rate, in welchem Jahr jedes Ereignis war. Je näher, desto mehr Punkte.' },
    tipos: ['trivia'],
    duration: '2–5',
  },
  {
    id: 'reinas',
    slug: 'queens',
    emoji: '👑',
    name: { es: 'Reinas', en: 'Queens', pt: 'Rainhas', de: 'Damen' },
    tagline: { es: 'Pon una reina en cada fila, columna y zona de color, sin que se toquen.', en: 'Place one queen in every row, column and color zone, with none touching.', pt: 'Coloque uma rainha em cada linha, coluna e zona de cor, sem que se toquem.', de: 'Setz eine Dame in jede Zeile, Spalte und Farbzone, ohne dass sie sich berühren.' },
    tipos: ['logic'],
    duration: '2–5',
  },
  {
    id: 'tango',
    slug: 'tango',
    emoji: '☀️',
    name: { es: 'Tango', en: 'Tango', pt: 'Tango', de: 'Tango' },
    tagline: { es: 'Llena la grilla con soles y lunas sin poner tres iguales seguidos.', en: 'Fill the grid with suns and moons without ever putting three in a row.', pt: 'Preencha a grade com sóis e luas sem colocar três iguais seguidos.', de: 'Füll das Raster mit Sonnen und Monden, nie drei gleiche nebeneinander.' },
    tipos: ['logic'],
    duration: '3–8',
  },
  {
    id: 'zip',
    slug: 'zip',
    emoji: '〰️',
    name: { es: 'Zip', en: 'Zip', pt: 'Zip', de: 'Zip' },
    tagline: { es: 'Une los números en orden con un solo trazo que pase por todas las casillas.', en: 'Connect the numbers in order with a single line that fills every square.', pt: 'Ligue os números em ordem com um só traço que passe por todas as casas.', de: 'Verbinde die Zahlen der Reihe nach mit einer Linie durch alle Felder.' },
    tipos: ['logic'],
    duration: '3',
  },
  {
    id: 'desenredo',
    slug: 'untangle',
    emoji: '🧶',
    name: { es: 'Desenredo', en: 'Untangle', pt: 'Desenrola', de: 'Entwirren' },
    tagline: { es: 'Arrastra los nudos hasta que ningún hilo se cruce.', en: 'Drag the knots until no threads cross.', pt: 'Arraste os nós até que nenhum fio se cruze.', de: 'Zieh die Knoten, bis sich keine Fäden mehr kreuzen.' },
    tipos: ['logic'],
    duration: '4',
  },
  {
    id: 'donde',
    slug: 'where',
    emoji: '📍',
    name: { es: '¿Dónde queda?', en: 'Where Is It?', pt: 'Onde fica?', de: 'Wo liegt das?' },
    tagline: { es: 'Ubica cinco ciudades en el globo. Mientras más cerca, más puntos.', en: 'Find five cities on the globe. The closer your pin, the more points.', pt: 'Encontre cinco cidades no globo. Quanto mais perto o alfinete, mais pontos.', de: 'Finde fünf Städte auf dem Globus. Je näher deine Nadel, desto mehr Punkte.' },
    tipos: ['trivia'],
    duration: '2–5',
  },
  {
    // En el laboratorio (D-257): tiene página y tarjeta, pero no sale en la portada. Su página es
    // /labs/case/ (D-267); `diario`: sin semilla en el link se juega el caso del día, el mismo para
    // todos, y al recargar sigue donde iba
    id: 'caso',
    slug: 'case',
    emoji: '🔍',
    name: { es: 'El caso', en: 'The Case', pt: 'O Caso', de: 'Der Fall' },
    tagline: { es: 'Descubre quién es criminal entre 20 sospechosos. Las pistas nunca mienten.', en: 'Find out who the criminals are among 20 suspects. The clues never lie.', pt: 'Descubra quem é criminoso entre 20 suspeitos. As pistas nunca mentem.', de: 'Finde heraus, wer von 20 Verdächtigen kriminell ist. Die Hinweise lügen nie.' },
    tipos: ['logic'],
    duration: '5–10',
    labs: true,
    diario: true,
  },
  {
    // Out of the lab since D-332, with Loteo and Pintaminas: their page was /labs/<slug>/, now a bridge (`deLabs`)
    id: 'rutas',
    slug: 'routes',
    emoji: '🚇',
    name: { es: 'Rutas rotas', en: 'Broken Routes', pt: 'Rotas Quebradas', de: 'Kaputte Linien' },
    tagline: { es: 'Une todas las líneas del metro girando partes del tablero.', en: 'Join every subway line by flipping parts of the board.', pt: 'Ligue todas as linhas do metrô girando partes do tabuleiro.', de: 'Verbinde alle U-Bahn-Linien, indem du Teile des Bretts drehst.' },
    tipos: ['logic'],
    duration: '7',
    deLabs: true,
    nuevoDesde: '2026-10-15',
  },
  {
    // Two variants (D-331): 🔢 Numbers and ⚡💧 Utilities, picked in the waiting room
    id: 'loteo',
    slug: 'plots',
    emoji: '📐',
    name: { es: 'Loteo', en: 'Plots', pt: 'Loteamento', de: 'Parzellen' },
    tagline: { es: 'Divide el tablero en lotes: cada número dice cuántas casillas tiene el suyo.', en: 'Split the board into plots: each number says how many squares its plot has.', pt: 'Divida o tabuleiro em lotes: cada número diz quantas casas tem o seu.', de: 'Teil das Brett in Parzellen auf: Jede Zahl sagt, wie viele Felder ihre hat.' },
    tipos: ['logic'],
    duration: '5–15',
    deLabs: true,
    nuevoDesde: '2026-10-15',
  },
  {
    // Two variants (D-331): easy (one color) and hard (two colors), picked in the waiting room
    id: 'pintaminas',
    slug: 'paint-mines',
    emoji: '🖌️',
    name: { es: 'Pintaminas', en: 'Paint Mines', pt: 'Pinta-Minas', de: 'Malminen' },
    tagline: { es: 'Pinta la grilla y descubre el dibujo escondido.', en: 'Paint the grid and uncover the hidden picture.', pt: 'Pinte a grade e descubra o desenho escondido.', de: 'Mal das Raster aus und entdeck das versteckte Bild.' },
    tipos: ['logic'],
    duration: '3–6',
    deLabs: true,
    nuevoDesde: '2026-10-15',
  },
  // Los del laboratorio viven en /labs/<slug>/ (D-267): al salir pasan a /<slug>/
].map(m => ({ ...m, players: '1', path: `${m.labs ? 'labs/' : ''}${m.slug}/`, available: !m.labs, suelto: true }));

/**
 * Los tipos de juego con que se filtra la portada (D-142), en el orden en que se ofrecen.
 * Cada juego dice los suyos en `tipos`; uno sin tipos solo se ve sin filtro de tipo.
 * La clave es la que va en la URL (`?type=logic`), en inglés como las rutas (D-192, D-214).
 */
export const TIPOS = {
  words: { emoji: '🔤', name: { es: 'Palabras', en: 'Words', pt: 'Palavras', de: 'Wörter' } },
  logic: { emoji: '🧩', name: { es: 'Lógica', en: 'Logic', pt: 'Lógica', de: 'Logik' } },
  trivia: { emoji: '🧠', name: { es: 'Cultura', en: 'Trivia', pt: 'Cultura', de: 'Wissen' } },
  tabletop: { emoji: '🎲', name: { es: 'Cartas/Dados', en: 'Cards/Dice', pt: 'Cartas/Dados', de: 'Karten/Würfel' } },
};

/** Los tipos de antes de D-214 (`?tipo=mesa`): un link viejo sigue filtrando lo mismo. */
export const TIPOS_VIEJOS = { palabras: 'words', logica: 'logic', cultura: 'trivia', mesa: 'tabletop' };

/**
 * The home page's order (D-255, D-361): most finished games first, counting the last four weeks of
 * offline games, rooms that ended, La Copa days played and Uno al día. It is still a fixed list,
 * so the page needs no database to draw itself, but it is no longer refreshed by hand: once a week
 * the processes round runs `node tools/agents/popularity.mjs update` and opens a PR with auto-merge
 * when the order changed. The two lines below are written by that tool; a game not in the list
 * goes after the ones that are, in the order of GAMES and SUELTOS.
 */
export const POPULARIDAD_FECHA = '2026-10-18';
export const POPULARIDAD = ['copa', 'reinas', 'linea-de-tiempo', 'tango', 'conexiones', 'anio', 'letras', 'donde', 'toque-y-fama', 'zip', 'desenredo', 'batalla-naval', 'rutas', 'loteo', 'ahorcado', 'dudo', 'pintaminas', 'generala', 'julepe', 'cuarto-rey'];
const puesto = id => { const i = POPULARIDAD.indexOf(id); return i < 0 ? POPULARIDAD.length : i; };

/**
 * A new game carries a "New" label on its home card for a while (D-333, the owner's request): from
 * `nuevoDesde`, the day it reached the home page, for DIAS_NUEVO days. Every game added after D-333
 * brings its date, and games.test.mjs stops one that doesn't (YA_ESTABAN is the list from before).
 */
export const DIAS_NUEVO = 14;
export const esNuevo = (g, hoy = new Date()) => {
  if (!g?.nuevoDesde) return false;
  const desde = Date.parse(`${g.nuevoDesde}T00:00:00`);
  return hoy.getTime() >= desde && hoy.getTime() < desde + DIAS_NUEVO * 24 * 60 * 60 * 1000;
};

/**
 * Todo lo que ofrece la portada, de lo más jugado a lo menos (D-255). Los que vienen
 * "Próximamente" van al final, con y sin filtro: no se abren y no deben tapar a los que sí.
 * While a game carries its "New" label it goes on top, right after La Copa (D-335, the owner's
 * request: it has no plays yet, so by popularity it would be last); when the label goes, so does that.
 */
export function ordenPortada(hoy = new Date()) {
  const ofrecidos = [...GAMES, ...SUELTOS.filter(m => !m.labs)].sort((a, b) => puesto(a.id) - puesto(b.id));
  const arriba = g => (g.torneo ? 0 : esNuevo(g, hoy) ? 1 : 2);
  const disponibles = ofrecidos.filter(g => g.available).sort((a, b) => arriba(a) - arriba(b));
  return [...disponibles, ...ofrecidos.filter(g => !g.available)];
}
export const PORTADA = ordenPortada();

/**
 * The 🔥 "Popular" label (D-361, the owner's request): the first POPULARES games of the home page's
 * order, leaving out La Copa (it has its own card on top) and the games still carrying "New"
 * (that label says more, and they have no plays to rank yet). Only available games count.
 */
export const POPULARES = 3;
export function populares(hoy = new Date(), orden = ordenPortada(hoy)) {
  return new Set(orden.filter(g => g.available && !g.torneo && !esNuevo(g, hoy) && POPULARIDAD.includes(g.id)).slice(0, POPULARES).map(g => g.id));
}

/** Cuántos juegan como mínimo y como máximo ("1–6" → [1, 6]; "1" → [1, 1]). */
export function rangoJugadores(players) {
  const n = String(players || '').split(/[^\d]+/).filter(Boolean).map(Number);
  return n.length ? [Math.min(...n), Math.max(...n)] : [1, 1];
}

/* ------------------------------------------------------------------ */
/* Lo derivado: de acá lo lee cualquiera que necesite hablar de juegos  */
/* o de modos sin copiarse la lista (canon C-16).                      */
/* ------------------------------------------------------------------ */

/*
 * `jugadas`: los tipos de mensaje de sala que son una jugada de una persona (un disparo, un
 * intento, una apuesta). El panel cuenta solo esos (D-138): una sala también se llena de
 * mensajes que manda el juego solo —la respuesta a cada disparo, los compromisos y las
 * revelaciones del anti-trampa—, de las entradas y de la charla, y contarlos todos juntos
 * hacía decir "176 msjs" a una partida donde nadie escribió una palabra.
 */

/** Los ids, en el orden del menú. */
export const GAME_IDS = GAMES.map(g => g.id);

// Con los de La Copa: el panel también los nombra cuando mandan su señal de uso (C-16)
const BY_ID = Object.fromEntries([...GAMES, ...SUELTOS].map(g => [g.id, g]));

/** El juego con ese id, o `null` si no está registrado. */
export const gameById = id => BY_ID[id] || null;

/**
 * Cómo se nombra un juego en una URL (C-18, D-266): en inglés, como su carpeta (`reinas` →
 * `queens`). Los de La Copa que no tienen página propia llevan el suyo. El id no cambia (lo
 * guardan las salas, el panel y el celular): solo lo que se ve en la dirección.
 */
export const SLUGS_SIN_PAGINA = { linea: 'timeline-flash', numero: 'number' };
const SLUG_DE = { ...Object.fromEntries([...GAMES, ...SUELTOS].map(g => [g.id, g.slug || String(g.path || '').replace(/\/$/, '') || g.id])), ...SLUGS_SIN_PAGINA };
const ID_DE = Object.fromEntries(Object.entries(SLUG_DE).map(([id, slug]) => [slug, id]));
/** El nombre en la URL de un juego; un id que no está en la lista queda igual. */
export const slugDe = id => (Object.hasOwn(SLUG_DE, id) ? SLUG_DE[id] : id);
/** El id de un juego desde su nombre en la URL, o desde su id (los links de antes de D-266). */
export const idDeSlug = s => (Object.hasOwn(SLUG_DE, s) ? s : Object.hasOwn(ID_DE, s) ? ID_DE[s] : s);

/**
 * Cómo se nombra un juego fuera del menú (el panel, por ejemplo).
 * Un id que no está en la lista se devuelve tal cual: puede ser un juego recién publicado,
 * uno que se fue, o una versión vieja de la app que todavía manda señales. En los tres casos
 * hay que poder verlo, no perderlo en silencio (C-16).
 */
export function gameLabel(id, lang = 'es') {
  const g = BY_ID[id];
  return g ? `${g.emoji} ${g.name[lang] || g.name.es}` : String(id || '?');
}

/**
 * Los modos que existen, en el orden en que se ofrecen (C-5). `online` es el de la sala y
 * se cuenta por sala; los demás son sin red y suben un contador (`local/<juego>/<modo>/<n>`).
 *
 * Agregar un modo es agregar una línea acá: el registro de señales lo manda, las reglas de
 * la base lo aceptan por forma y el panel lo dibuja con su ícono y su color, sin tocar nada
 * más. The label is in English because only the owner reads it, in the panel, which is English
 * only (D-350); what the player sees comes from each game's `LOCALES` (C-3).
 */
export const MODES = {
  online: { icon: '📡', label: 'two phones', room: true },
  local: { icon: '📱', label: 'one phone' },
  cpu: { icon: '🤖', label: 'vs. the phone' },
  // `individual`: played by one person; the panel splits its domains by this flag (D-348)
  solo: { icon: '🧍', label: 'solo', individual: true },
  // One a Day (D-230): today's game, the same for everyone, in its one-player mode
  'uno-al-dia': { icon: '📅', label: 'One a Day', individual: true },
  // A played tournament day: the panel measures it in its own view, with the tournament's data
  copa: { icon: '🏆', label: 'a La Copa day', torneo: true },
};
/** El modo de las partidas de Uno al día (D-230): lo usan los juegos al contarlas y el panel al leerlas. */
export const MODO_UNO_AL_DIA = 'uno-al-dia';

/** Todos los modos conocidos, en orden. */
export const MODE_IDS = Object.keys(MODES);

/** El modo de la sala: el que se cuenta por sala y no por contador. */
export const ROOM_MODE = MODE_IDS.find(m => MODES[m].room);

/** Los que suben un contador de partida sin red: todos menos el de la sala. */
export const LOCAL_MODES = MODE_IDS.filter(m => !MODES[m].room);

/**
 * Forma de una clave de modo. Se valida la forma y no la lista: un modo que el código empezó
 * a mandar antes de que el panel supiera de él tiene que llegar igual (C-16).
 */
export const MODE_KEY = /^[a-z][a-z-]{0,15}$/;

/** ¿Esta clave es un modo sin red, que sube contador? Vale para uno que todavía no existe. */
/** A mode played by one person (D-348): solo and Uno al día. */
export const isIndividualMode = mode => !!MODES[mode]?.individual;

export const isLocalMode = mode => MODE_KEY.test(String(mode || '')) && !MODES[mode]?.room;

/**
 * ¿Es un torneo (un juego que dura días y se juega un juego por día) o un juego de una partida?
 * El panel separa por esto y no por nombre, así que un segundo torneo entraría solo (C-16).
 */
export const isTorneo = id => !!BY_ID[id]?.torneo;

/** El ícono del modo; uno desconocido se muestra con su clave, que es mejor que nada. */
export const modeIcon = mode => MODES[mode]?.icon || '·';

/**
 * Cuántas personas caben en el juego más numeroso ("1–6" → 6). De acá sale el tope con que
 * se guardan y se agrupan los jugadores por partida: si algún día entra un juego de ocho,
 * el tope sube solo. Ojo: los roles de sala (`A`–`F`) y las reglas de la base también tienen
 * que crecer para que un juego así funcione en dos celulares.
 */
export const MAX_PLAYERS = Math.max(...GAMES.filter(g => !g.torneo).map(g => Number(String(g.players).split(/[^\d]+/).filter(Boolean).pop()) || 1));
