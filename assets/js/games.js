/**
 * Registro central de juegos.
 * Para agregar un juego nuevo: crear carpeta /<id>/ con su index.html
 * y agregar una entrada aquí. Los textos van por idioma ({ es, en, pt }).
 * El menú principal se genera desde esta lista.
 */
export const GAMES = [
  {
    id: 'copa',
    emoji: '🏆',
    name: { es: 'La Copa', en: 'The Cup', pt: 'A Copa' },
    tagline: { es: 'Un torneo de una semana entre amigos, con un minijuego distinto cada día.', en: 'A week-long tournament among friends, with a different minigame every day.', pt: 'Um torneio de uma semana entre amigos, com um minijogo diferente por dia.' },
    players: '2–10',
    duration: '7',
    // No dura minutos sino días. Va en los tres idiomas (D-170): la copa elige el de sus palabras
    durationUnit: { es: 'días', en: 'days', pt: 'dias' },
    // Cómo se juega, para la tabla del README: una copa no tiene modos de un celular o de sala.
    formato: { es: 'Cada uno en su celular, un juego por día', en: 'Each on their own phone, one game a day', pt: 'Cada um no seu celular, um jogo por dia' },
    // Un torneo no es una partida: cada día manda su señal con `players: 1` y no pesa en MAX_PLAYERS.
    torneo: true,
    // Tiene de todo: aparece con cualquier tipo que se elija en los filtros de la portada
    tipos: ['palabras', 'logica', 'cultura'],
    path: 'copa/',
    // Salió del laboratorio (D-175): se abre desde el menú. /labs/ sigue para probar (la Copa de 3
    // días, la práctica con semilla y las demos).
    available: true,
  },
  {
    id: 'linea-de-tiempo',
    tipos: ['cultura'],
    emoji: '⏳',
    name: { es: 'Línea de Tiempo', en: 'Timeline', pt: 'Linha do Tempo' },
    tagline: { es: 'Ubica los hitos en el orden correcto. Seis temáticas, de la historia al fútbol.', en: 'Put the milestones in the right order. Six themes, from history to soccer.', pt: 'Coloque os marcos na ordem certa. Seis temas, da história ao futebol.' },
    players: '1–6',
    duration: '10–20',
    jugadas: ['place'],
    path: 'linea-de-tiempo/',
    available: true,
  },
  {
    id: 'toque-y-fama',
    tipos: ['logica'],
    emoji: '🔢',
    name: { es: 'Toque y Fama', en: 'Bulls and Cows', pt: 'Toque e Fama' },
    tagline: { es: 'Adivina el número secreto con toques y famas.', en: 'Crack the secret number with bulls and cows.', pt: 'Descubra o número secreto com toques e famas.' },
    players: '1–2',
    duration: '5–12',
    jugadas: ['guess'],
    path: 'toque-y-fama/',
    available: true,
  },
  {
    id: 'ahorcado',
    tipos: ['palabras'],
    emoji: '🪢',
    name: { es: 'El Ahorcado', en: 'Hangman', pt: 'Forca' },
    tagline: { es: 'Adivina tu palabra antes de quedarte sin vidas. Acá nadie se queda mirando.', en: 'Crack your word before you run out of lives. Nobody sits this one out.', pt: 'Descubra sua palavra antes de ficar sem vidas. Aqui ninguém fica só olhando.' },
    players: '1–6',
    duration: '5–12',
    jugadas: ['word', 'guess', 'buy'],
    path: 'ahorcado/',
    available: true,
  },
  {
    id: 'dudo',
    tipos: ['mesa'],
    emoji: '🎲',
    name: { es: 'Dudo', en: 'Liar\'s Dice', pt: 'Dado Mentiroso' },
    tagline: { es: 'Apuesta cuántos dados hay en la mesa y aguanta la cara.', en: 'Bid how many dice are on the table and keep a straight face.', pt: 'Aposte quantos dados tem na mesa sem entregar o jogo.' },
    players: '1–6',
    duration: '10–20',
    jugadas: ['bid', 'dudo', 'calza'],
    path: 'dudo/',
    available: true,
  },
  {
    id: 'batalla-naval',
    tipos: ['logica'],
    emoji: '⚓',
    name: { es: 'Batalla Naval', en: 'Battleship', pt: 'Batalha Naval' },
    tagline: { es: 'Hunde la flota del rival antes de que hunda la tuya.', en: 'Sink your rival\'s fleet before they sink yours.', pt: 'Afunde a frota do rival antes que ele afunde a sua.' },
    players: '1–2',
    duration: '10–20',
    jugadas: ['shot'],
    path: 'batalla-naval/',
    available: true,
  },
  {
    id: 'julepe',
    tipos: ['mesa'],
    emoji: '🍹',
    name: { es: 'Julepe', en: 'Julep', pt: 'Paga o Bolo' },
    tagline: { es: 'Dices si vas o te pasas. Si vas y no haces dos bazas, te tomas todo el plato.', en: 'Say if you are in or out. Go in, miss two tricks, and you drink the whole pot.', pt: 'Você diz se entra ou passa. Se entrar e não fizer duas vazas, bebe o bolo inteiro.' },
    players: '1–6',
    duration: '15–30',
    jugadas: ['va', 'paso', 'cambia', 'juega', 'regala'],
    path: 'julepe/',
    // Fuera del menú por ahora: las reglas no quedaron claras y se están reescribiendo (D-88).
    // El juego sigue entero en /julepe/, solo no se ofrece desde acá.
    available: false,
  },
  {
    id: 'cuarto-rey',
    tipos: ['mesa'],
    emoji: '👑',
    name: { es: 'Cuarto Rey', en: 'Fourth King', pt: 'Quarto Rei' },
    tagline: { es: 'Naipes, sorbos y el temido cuarto rey.', en: 'Cards, sips and the dreaded fourth king.', pt: 'Cartas, goles e o temido quarto rei.' },
    players: '4–6',
    duration: '20–40',
    path: 'cuarto-rey/',
    available: true,
  },
];

/**
 * Los minijuegos de La Copa que se juegan sueltos desde la portada (D-142), de a uno y sin copa:
 * abren `minijuegos/<id>/` (D-149, D-162), la pantalla de práctica de La Copa con un link que no
 * dice "copa": no guarda nada y no cuenta para ninguna copa. Van aparte de GAMES porque no son una
 * carpeta con su `rules.js`: el README y las pruebas de idioma de los juegos no los recorren. Su
 * página y su tarjeta social las genera `node tools/og.mjs tarjetas` a partir de minijuegos/index.html.
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
    emoji: '🔗',
    name: { es: 'Conexiones', en: 'Connections', pt: 'Conexões' },
    tagline: { es: 'Arma cuatro grupos de cuatro palabras que tienen algo en común.', en: 'Sort sixteen words into four groups of four that share something.', pt: 'Monte quatro grupos de quatro palavras que têm algo em comum.' },
    tipos: ['palabras', 'cultura'],
    duration: '3–8',
  },
  {
    id: 'letras',
    emoji: '🔤',
    name: { es: 'Toque y Fama: Palabra', en: 'Bulls and Cows: Word', pt: 'Toque e Fama: Palavra' },
    tagline: { es: 'Adivina la palabra secreta de cinco letras con toques y famas.', en: 'Crack the five-letter secret word with bulls and cows.', pt: 'Descubra a palavra secreta de cinco letras com toques e famas.' },
    tipos: ['palabras', 'logica'],
    duration: '3–8',
  },
  {
    id: 'anio',
    emoji: '📅',
    name: { es: '¿En qué año?', en: 'What Year?', pt: 'Em que ano?' },
    tagline: { es: 'Adivina en qué año pasó cada hito. Mientras más cerca, más puntos.', en: 'Guess the year each milestone happened. The closer you get, the more points.', pt: 'Adivinhe em que ano aconteceu cada marco. Quanto mais perto, mais pontos.' },
    tipos: ['cultura'],
    duration: '2–5',
  },
  {
    id: 'reinas',
    emoji: '👑',
    name: { es: 'Reinas', en: 'Queens', pt: 'Rainhas' },
    tagline: { es: 'Pon una reina en cada fila, columna y zona de color, sin que se toquen.', en: 'Place one queen in every row, column and color zone, with none touching.', pt: 'Coloque uma rainha em cada linha, coluna e zona de cor, sem que se toquem.' },
    tipos: ['logica'],
    duration: '2–5',
  },
  {
    id: 'tango',
    emoji: '☀️',
    name: { es: 'Tango', en: 'Tango', pt: 'Tango' },
    tagline: { es: 'Llena la grilla con soles y lunas sin poner tres iguales seguidos.', en: 'Fill the grid with suns and moons without ever putting three in a row.', pt: 'Preencha a grade com sóis e luas sem colocar três iguais seguidos.' },
    tipos: ['logica'],
    duration: '3–8',
  },
  {
    id: 'zip',
    emoji: '〰️',
    name: { es: 'Zip', en: 'Zip', pt: 'Zip' },
    tagline: { es: 'Une los números en orden con un solo trazo que pase por todas las casillas.', en: 'Connect the numbers in order with a single line that fills every square.', pt: 'Ligue os números em ordem com um só traço que passe por todas as casas.' },
    tipos: ['logica'],
    duration: '3',
  },
  {
    id: 'desenredo',
    emoji: '🧶',
    name: { es: 'Desenredo', en: 'Untangle', pt: 'Desenrola' },
    tagline: { es: 'Arrastra los nudos hasta que ningún hilo se cruce.', en: 'Drag the knots until no threads cross.', pt: 'Arraste os nós até que nenhum fio se cruze.' },
    tipos: ['logica'],
    duration: '4',
  },
  {
    id: 'donde',
    emoji: '📍',
    name: { es: '¿Dónde queda?', en: 'Where Is It?', pt: 'Onde fica?' },
    tagline: { es: 'Ubica cinco ciudades en el globo. Mientras más cerca, más puntos.', en: 'Find five cities on the globe. The closer your pin, the more points.', pt: 'Encontre cinco cidades no globo. Quanto mais perto o alfinete, mais pontos.' },
    tipos: ['cultura'],
    duration: '2–5',
  },
].map(m => ({ ...m, players: '1', path: `minijuegos/${m.id}/`, available: !m.labs, suelto: true }));

/**
 * Los tipos de juego con que se filtra la portada (D-142), en el orden en que se ofrecen.
 * Cada juego dice los suyos en `tipos`; uno sin tipos solo se ve sin filtro de tipo.
 */
export const TIPOS = {
  palabras: { emoji: '🔤', name: { es: 'Palabras', en: 'Words', pt: 'Palavras' } },
  logica: { emoji: '🧩', name: { es: 'Lógica', en: 'Logic', pt: 'Lógica' } },
  cultura: { emoji: '🧠', name: { es: 'Cultura', en: 'Trivia', pt: 'Cultura' } },
  mesa: { emoji: '🎲', name: { es: 'Cartas/Dados', en: 'Cards/Dice', pt: 'Cartas/Dados' } },
};

/** Todo lo que ofrece la portada: los juegos y, después, los minijuegos sueltos. */
export const PORTADA = [...GAMES, ...SUELTOS.filter(m => !m.labs)];

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

// Con los sueltos: el panel también los nombra cuando mandan su señal de uso (C-16)
const BY_ID = Object.fromEntries([...GAMES, ...SUELTOS].map(g => [g.id, g]));

/** El juego con ese id, o `null` si no está registrado. */
export const gameById = id => BY_ID[id] || null;

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
 * más. El nombre va en español porque solo lo lee el dueño en el panel; lo que ve el jugador
 * sale de `LOCALES` de cada juego (C-3).
 */
export const MODES = {
  online: { icon: '📡', label: 'dos celulares', room: true },
  local: { icon: '📱', label: 'un celular' },
  cpu: { icon: '🤖', label: 'contra el celular' },
  solo: { icon: '🧍', label: 'solo' },
  // El día jugado de un torneo: el panel lo mide en su propia vista, con los datos del torneo
  copa: { icon: '🏆', label: 'día de La Copa', torneo: true },
};

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
export const isLocalMode = mode => MODE_KEY.test(String(mode || '')) && !MODES[mode]?.room;

/**
 * ¿Es un torneo (un juego que dura días y se juega en minijuegos) o un juego de una partida?
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
