/**
 * Cuarto Rey — datos del juego en español e inglés: mazo, reglas por carta,
 * mini-juegos, penitencias, categorías y textos de interfaz.
 * Solo datos, sin lógica. Ver docs/juegos/cuarto-rey.md.
 */

export const SUITS = [
  { symbol: '♠', color: 'black' },
  { symbol: '♥', color: 'red' },
  { symbol: '♦', color: 'red' },
  { symbol: '♣', color: 'black' },
];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 6;
export const SORBOS = 2; // sorbos estándar por regla

/**
 * Reglas por carta (independientes del idioma). Los textos están en LOCALES.
 * kind: drink (targets) · minigame (game) · penitencia · gift · king
 */
export const CARD_RULES = {
  A:  { kind: 'drink', targets: 'all' },
  2:  { kind: 'drink', targets: 'right' },
  3:  { kind: 'drink', targets: 'left' },
  4:  { kind: 'minigame', game: 'cuentacuentos' },
  5:  { kind: 'penitencia' },
  6:  { kind: 'minigame', game: 'chancho' },
  7:  { kind: 'minigame', game: 'cultura' },
  8:  { kind: 'gift' },
  9:  { kind: 'minigame', game: 'nunca' },
  10: { kind: 'drink', targets: 'self' },
  J:  { kind: 'drink', targets: 'men' },
  Q:  { kind: 'drink', targets: 'women' },
  K:  { kind: 'king' },
};

/* ================================================================== */
/* ESPAÑOL                                                             */
/* ================================================================== */
const ES = {
  rankNames: { A: 'As', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez', J: 'Jota', Q: 'Reina', K: 'Rey' },
  suitNames: { '♠': 'pica', '♥': 'corazón', '♦': 'diamante', '♣': 'trébol' },
  cards: {
    A:  { title: '¡Todos toman!',        text: 'Todos los de la mesa toman dos sorbos. ¡Salud!' },
    2:  { title: 'Pa\' la derecha',       text: 'Tu compañero de la derecha toma dos sorbos.' },
    3:  { title: 'Pa\' la izquierda',     text: 'Tu compañero de la izquierda toma dos sorbos.' },
    4:  { title: 'Cuenta Cuentos',        text: 'Hora de inventar una historia entre todos.' },
    5:  { title: 'Penitencia',            text: 'Te tocó cumplir una penitencia. La mesa decide si la cumpliste.' },
    6:  { title: 'Chancho Inflado',       text: 'Infla las mejillas y que te sigan.' },
    7:  { title: 'Cultura Chupística',    text: 'Una categoría, una palabra cada uno, sin repetir.' },
    8:  { title: 'Regala sorbos',         text: 'Tienes dos sorbos para regalar a quien quieras (o los dos a la misma persona).' },
    9:  { title: 'Nunca Nunca',           text: 'Confiesa algo que nunca has hecho.' },
    10: { title: '¡Te toca a ti!',        text: 'Tomas dos sorbos. Sin reclamar.' },
    J:  { title: 'Toman los hombres',     text: 'Los hombres de la mesa toman dos sorbos.' },
    Q:  { title: 'Toman las mujeres',     text: 'Las mujeres de la mesa toman dos sorbos.' },
    K:  { title: '¡Un Rey!',              text: 'Se cuenta un rey más. El cuarto se toma el vaso entero.' },
  },
  kings: [
    { title: '¡Primer Rey!',  text: 'Tranquilos, recién empieza. Quedan tres reyes en el mazo.' },
    { title: '¡Segundo Rey!', text: 'Ya van dos. La cosa se pone seria.' },
    { title: '¡Tercer Rey!',  text: 'Solo queda uno. Al próximo que le salga… se toma TODO el vaso.' },
    { title: '¡CUARTO REY!',  text: 'Se acabó. Te tomas todo lo que queda en el vaso. ¡Fondo, fondo, fondo!' },
  ],
  minigames: {
    cuentacuentos: { name: 'Cuenta Cuentos', emoji: '📖', intro: 'Vamos a inventar una historia entre todos, una palabra a la vez.', helper: 'timer',
      rules: ['Quien sacó la carta parte diciendo la primera palabra de la historia.', 'Siguiendo hacia la derecha, cada jugador agrega UNA palabra.', 'La historia tiene que tener sentido (más o menos).', 'Quien se demore más de 5 segundos, repita o rompa la historia, pierde y toma dos sorbos.'] },
    chancho: { name: 'Chancho Inflado', emoji: '🐷', intro: 'Cuando quieras, infla las mejillas como un chancho.', helper: 'none',
      rules: ['Quien sacó la carta puede inflar las mejillas en cualquier momento de la partida (no tiene que ser ahora).', 'Apenas alguien lo note, también infla las mejillas y se queda callado.', 'El último de la mesa en inflar las mejillas pierde y toma dos sorbos.', 'Si alguien se ríe y se le escapa el aire… también toma.'] },
    cultura: { name: 'Cultura Chupística', emoji: '🧠', intro: 'Elige una categoría y todos van diciendo una palabra que calce.', helper: 'category',
      rules: ['Quien sacó la carta elige la categoría (o pide una al celular).', 'Siguiendo hacia la derecha, cada uno dice una palabra de esa categoría.', 'No se puede repetir ni demorarse más de 5 segundos.', 'Quien repita, se equivoque o se quede en blanco, pierde y toma dos sorbos.'] },
    nunca: { name: 'Nunca Nunca', emoji: '🙊', intro: 'Confiesa algo que NUNCA hayas hecho.', helper: 'nunca',
      rules: ['Quien sacó la carta dice: “Nunca nunca he…” y completa la frase.', 'Todos los que SÍ lo han hecho, toman dos sorbos.', 'Si nadie lo ha hecho, quien lo dijo toma por fome.', 'Se vale preguntar detalles después. Ahí está la gracia.'] },
  },
  penitencias: [
    'Imita a alguien de la mesa hasta que adivinen quién es.', 'Canta el coro de la canción que elija la mesa, con sentimiento.', 'Habla con acento argentino hasta tu próximo turno.',
    'Baila 15 segundos sin música. La mesa pone el ritmo con palmas.', 'Cuenta tu peor panorama de carrete en 30 segundos.', 'Haz 10 sentadillas mientras gritas el nombre de tu ex (o de tu mascota).',
    'Muestra la última foto de tu galería y explícala.', 'Di un piropo a la persona de tu izquierda con cara seria.', 'Haz una declaración de amor a tu vaso.',
    'Cuenta un chiste. Si nadie se ríe, tomas dos sorbos.', 'Habla en tercera persona hasta tu próximo turno.', 'Deja que la persona de tu derecha te ponga un apodo por el resto de la noche.',
    'Imita a un animal hasta que alguien adivine cuál es.', 'Recita el abecedario al revés. Si te equivocas, dos sorbos.', 'Haz una pose de modelo y mantenla hasta que saquen la próxima carta.',
    'Cuenta cuál fue tu peor corte de pelo y por qué.', 'Vende un objeto de la mesa como si fueras de teletienda, 20 segundos.', 'Da un discurso de agradecimiento como si hubieras ganado un premio.',
    'Repite un trabalenguas 3 veces seguidas sin equivocarte.', 'Manda un audio de 10 segundos cantando al grupo de amigos.', 'Haz una predicción de cómo va a terminar la noche para cada jugador.',
    'Elige a alguien y hazle la pregunta más incómoda que se te ocurra.', 'Ponte de pie y anuncia el marcador del juego como relator deportivo.', 'Bebe un sorbo con la mano no dominante y sin usar los dientes para nada.',
  ],
  categorias: [
    'Marcas de cerveza', 'Equipos de fútbol chilenos', 'Comunas de Santiago', 'Películas de Disney', 'Marcas de autos', 'Nombres de cantantes chilenos', 'Sabores de helado', 'Países de Sudamérica',
    'Superhéroes', 'Verduras', 'Series de Netflix', 'Cosas que hay en un baño', 'Marcas de ropa deportiva', 'Frutas', 'Razas de perros', 'Ciudades de Chile', 'Personajes de Los Simpson', 'Cócteles',
    'Instrumentos musicales', 'Videojuegos', 'Marcas de celulares', 'Palabras que terminen en -ción', 'Cosas que se compran en el negocio de la esquina', 'Deportes olímpicos', 'Apps del celular',
    'Cosas que hay en una playa', 'Nombres de presidentes', 'Bandas de rock', 'Tipos de pan', 'Bebidas sin alcohol', 'Colores', 'Profesiones', 'Animales de la selva', 'Cosas que se dicen en un carrete', 'Comidas chilenas',
  ],
  nuncaNunca: [
    'Nunca nunca he mandado un mensaje a la persona equivocada.', 'Nunca nunca me he quedado dormido en una micro y pasado mi parada.', 'Nunca nunca he cantado karaoke en público.',
    'Nunca nunca he stalkeado a un ex en redes sociales.', 'Nunca nunca he mentido para no ir a un evento.', 'Nunca nunca he llorado con una película animada.',
    'Nunca nunca he perdido el celular en un carrete.', 'Nunca nunca me he arrancado sin pagar de un lugar.', 'Nunca nunca he fingido conocer a alguien que me saludó.',
    'Nunca nunca he comido algo que se cayó al suelo.', 'Nunca nunca he mandado un audio borracho.', 'Nunca nunca me he equivocado de nombre con alguien.',
    'Nunca nunca he llegado más de una hora tarde a algo importante.', 'Nunca nunca he inventado una excusa médica.', 'Nunca nunca he bailado solo frente al espejo.', 'Nunca nunca he tenido una cita a ciegas.',
  ],
  ui: {
    // estáticos (index.html)
    docTitle: 'Cuarto Rey 👑 · Juegos de Salón', gameChip: '👑 Cuarto Rey', menu: '‹ Menú',
    title: 'Cuarto Rey', lead: 'El clásico de los carretes en casa. Saca una carta, obedece y reza para que no te toque el cuarto rey.',
    beforeTitle: '🍹 Antes de partir',
    beforeText: 'Cada jugador con su vaso a tope de su trago favorito. Una vez que parte el juego, <b>nadie toma</b> si no es por regla. El celular hace de mazo: pásenlo por la mesa hacia la derecha.',
    rulesSummary: '🃏 ¿Qué hace cada carta?', goSetup: '¡Armar la mesa!',
    whoPlays: '¿Quiénes juegan?', setupHint: 'Anótense en el orden en que están sentados, <b>hacia la derecha</b>. El género sirve para las cartas J y Q.',
    addPlayer: '+ Agregar jugador', maxPlayers: 'Máximo {n} jugadores', start: '¡A jugar!',
    cardsLeft: 'Quedan <b id="deck-count">52</b> cartas', turnLabel: 'Le toca a', cardBack: 'Cuarto', cardBackSmall: '👑 REY 👑', tap: 'Toca para sacar carta',
    fourthOut: '¡Salió el cuarto rey!', fourthText: 'Se toma todo lo que le queda en el vaso. La mesa cuenta: ¡fondo, fondo, fondo!',
    sipsTitle: '📊 Sorbos de la noche (aprox.)', again: '¡Otra ronda!', changePlayers: 'Cambiar jugadores', backMenu: 'Volver al menú',
    // dinámicos (game.js)
    resumeTitle: '⏯ Hay una partida a medias', resumeText: 'Le tocaba a {name}. Quedan {cards} cartas y han salido {kings} reyes.', resume: 'Continuar', delete: 'Borrar',
    playerPlaceholder: 'Jugador {n}', removePlayer: 'Quitar jugador',
    genders: { m: 'Hombre', f: 'Mujer', x: 'Otro (toma con J y con Q)' },
    errMin: 'Se necesitan al menos {n} jugadores.', errNames: 'Todos los jugadores necesitan un nombre.', errDup: 'Hay nombres repetidos. Pónganse apodos.',
    drew: '{name} sacó {rank} de {suit}', next: '¡Listo, siguiente!',
    noMen: 'No hay hombres en la mesa… así que tomas tú.', noWomen: 'No hay mujeres en la mesa… así que tomas tú.',
    giftLeft: 'Te quedan {n} sorbos por regalar.', giftLeftOne: 'Te queda 1 sorbo por regalar.', giftDone: '¡Listo! Confirma abajo.', gifted: '¡Regalados!',
    penitenciaFor: 'Penitencia pa\' {name}', otherPenitencia: '🎲 Otra penitencia', done: '✅ ¡Cumplida!', chickened: '😳 Se arrugó: toma {n} sorbos',
    chanchoBig: '🐷 Cuando quieras…', chanchoHint: 'Sigan jugando. Cuando pase, marquen al perdedor aquí o en cualquier momento.',
    whoLost: '¿Quién perdió? Toma {n} sorbos.', nobodyLost: 'Nadie perdió / seguir',
    timerHint: 'Cuenta de 5 segundos para quien se traba', timerStart: '⏱ Iniciar 5 s', timeUp: '¡TIEMPO!',
    suggestedCategory: 'Categoría sugerida', otherCategory: '🎲 Otra categoría',
    noIdeas: '💡 ¿Sin ideas?', otherIdea: '🎲 Otra idea', nuncaStarts: '{name} parte: “Nunca nunca he…”',
    kingsCount: '👑 {k} de 4', seeResult: '🏆 Ver el resultado',
    deckOver: 'Se acabó el mazo', sips: '{n} sorbos', plusChug: ' + fondo',
    endStats: '{cards} cartas en {mins} min. Los sorbos son una estimación: los mini-juegos y penitencias se cuentan cuando marcan al perdedor.',
    hoCheers: '¡Salud!', hoGift: '¡Regalo!', hoDone: '¡Cumplida!', hoChickened: '¡Se arrugó!', hoLost: '¡Perdió!', hoGoOn: '¡Sigan!', hoKings: '¡Van {k} reyes!', hoReady: '¡Listo!',
    hoDrinkOne: 'Toma {n} sorbos', hoDrinkMany: 'Toman {n} sorbos', hoTap: 'Toca para seguir', hoPass: 'Pásale el celular a', hoGiveCard: '¡Dame la carta!',
  },
};

/* ================================================================== */
/* ENGLISH                                                             */
/* ================================================================== */
const EN = {
  rankNames: { A: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', J: 'Jack', Q: 'Queen', K: 'King' },
  suitNames: { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' },
  cards: {
    A:  { title: 'Everybody drinks!',     text: 'Everyone at the table takes two sips. Cheers!' },
    2:  { title: 'To the right',          text: 'The player on your right takes two sips.' },
    3:  { title: 'To the left',           text: 'The player on your left takes two sips.' },
    4:  { title: 'Story Time',            text: 'Time to make up a story together.' },
    5:  { title: 'Dare',                  text: 'You got a dare. The table decides whether you pulled it off.' },
    6:  { title: 'Puffer Pig',            text: 'Puff your cheeks and make them follow.' },
    7:  { title: 'Categories',            text: 'One category, one word each, no repeats.' },
    8:  { title: 'Give away sips',        text: 'You have two sips to give to whoever you want (or both to the same person).' },
    9:  { title: 'Never Have I Ever',     text: 'Confess something you have never done.' },
    10: { title: 'Your turn to drink!',   text: 'You take two sips. No complaints.' },
    J:  { title: 'Guys drink',            text: 'The guys at the table take two sips.' },
    Q:  { title: 'Girls drink',           text: 'The girls at the table take two sips.' },
    K:  { title: 'A King!',               text: 'One more king counted. The fourth one chugs the whole glass.' },
  },
  kings: [
    { title: 'First King!',  text: 'Relax, it\'s just getting started. Three kings left in the deck.' },
    { title: 'Second King!', text: 'That\'s two. Things are getting serious.' },
    { title: 'Third King!',  text: 'Only one left. Whoever draws the next one… chugs the WHOLE glass.' },
    { title: 'FOURTH KING!', text: 'It\'s over. Drink everything left in your glass. Chug, chug, chug!' },
  ],
  minigames: {
    cuentacuentos: { name: 'Story Time', emoji: '📖', intro: 'Let\'s make up a story together, one word at a time.', helper: 'timer',
      rules: ['Whoever drew the card says the first word of the story.', 'Going to the right, each player adds ONE word.', 'The story has to make sense (more or less).', 'Whoever takes more than 5 seconds, repeats, or breaks the story loses and takes two sips.'] },
    chancho: { name: 'Puffer Pig', emoji: '🐷', intro: 'Whenever you want, puff your cheeks like a pig.', helper: 'none',
      rules: ['Whoever drew the card can puff their cheeks at any point in the game (it doesn\'t have to be now).', 'As soon as someone notices, they puff their cheeks too and stay quiet.', 'The last one at the table to puff their cheeks loses and takes two sips.', 'If someone laughs and lets the air out… they drink too.'] },
    cultura: { name: 'Categories', emoji: '🧠', intro: 'Pick a category and everyone names something that fits.', helper: 'category',
      rules: ['Whoever drew the card picks the category (or asks the phone for one).', 'Going to the right, each player says one word from that category.', 'No repeats and no taking more than 5 seconds.', 'Whoever repeats, gets it wrong, or blanks out loses and takes two sips.'] },
    nunca: { name: 'Never Have I Ever', emoji: '🙊', intro: 'Confess something you have NEVER done.', helper: 'nunca',
      rules: ['Whoever drew the card says: “Never have I ever…” and finishes the sentence.', 'Everyone who HAS done it takes two sips.', 'If nobody has done it, the one who said it drinks for being boring.', 'Asking for details afterwards is allowed. That\'s the fun part.'] },
  },
  penitencias: [
    'Impersonate someone at the table until they guess who it is.', 'Sing the chorus of a song the table picks, with feeling.', 'Speak with a fake accent until your next turn.',
    'Dance for 15 seconds with no music. The table claps the beat.', 'Tell your worst night-out story in 30 seconds.', 'Do 10 squats while shouting your ex\'s name (or your pet\'s).',
    'Show the last photo in your gallery and explain it.', 'Give the person on your left a compliment with a straight face.', 'Declare your love to your glass.',
    'Tell a joke. If nobody laughs, take two sips.', 'Talk in the third person until your next turn.', 'Let the person on your right give you a nickname for the rest of the night.',
    'Imitate an animal until someone guesses which one.', 'Say the alphabet backwards. Mess up and it\'s two sips.', 'Strike a model pose and hold it until the next card is drawn.',
    'Tell the story of your worst haircut and why.', 'Sell an object from the table like a TV infomercial, 20 seconds.', 'Give an acceptance speech as if you just won an award.',
    'Say a tongue twister 3 times in a row without mistakes.', 'Send a 10-second voice note of you singing to the group chat.', 'Predict how the night will end for each player.',
    'Pick someone and ask them the most awkward question you can think of.', 'Stand up and announce the game score like a sports commentator.', 'Take a sip with your non-dominant hand without using your teeth at all.',
  ],
  categorias: [
    'Beer brands', 'Football clubs', 'Neighborhoods in your city', 'Disney movies', 'Car brands', 'Pop singers', 'Ice cream flavors', 'South American countries',
    'Superheroes', 'Vegetables', 'Netflix shows', 'Things in a bathroom', 'Sportswear brands', 'Fruits', 'Dog breeds', 'Capital cities', 'Simpsons characters', 'Cocktails',
    'Musical instruments', 'Video games', 'Phone brands', 'Words ending in -tion', 'Things you buy at a corner store', 'Olympic sports', 'Apps on your phone',
    'Things at the beach', 'Names of presidents', 'Rock bands', 'Types of bread', 'Non-alcoholic drinks', 'Colors', 'Jobs', 'Jungle animals', 'Things people say at a party', 'Street foods',
  ],
  nuncaNunca: [
    'Never have I ever texted the wrong person.', 'Never have I ever fallen asleep on the bus and missed my stop.', 'Never have I ever sung karaoke in public.',
    'Never have I ever stalked an ex on social media.', 'Never have I ever lied to skip an event.', 'Never have I ever cried at an animated movie.',
    'Never have I ever lost my phone on a night out.', 'Never have I ever left a place without paying.', 'Never have I ever pretended to know someone who said hi to me.',
    'Never have I ever eaten something that fell on the floor.', 'Never have I ever sent a drunk voice note.', 'Never have I ever called someone by the wrong name.',
    'Never have I ever been more than an hour late to something important.', 'Never have I ever made up a medical excuse.', 'Never have I ever danced alone in front of the mirror.', 'Never have I ever been on a blind date.',
  ],
  ui: {
    docTitle: 'Fourth King 👑 · Party Games', gameChip: '👑 Fourth King', menu: '‹ Menu',
    title: 'Fourth King', lead: 'The classic house-party card game. Draw a card, obey it, and pray you don\'t get the fourth king.',
    beforeTitle: '🍹 Before you start',
    beforeText: 'Everyone fills their glass with their favorite drink. Once the game starts, <b>nobody drinks</b> unless a rule says so. The phone is the deck: pass it around the table to the right.',
    rulesSummary: '🃏 What does each card do?', goSetup: 'Set up the table!',
    whoPlays: 'Who\'s playing?', setupHint: 'Sign up in the order you\'re sitting, <b>going to the right</b>. Gender is used for the J and Q cards.',
    addPlayer: '+ Add player', maxPlayers: 'Max {n} players', start: 'Let\'s play!',
    cardsLeft: '<b id="deck-count">52</b> cards left', turnLabel: 'It\'s your turn', cardBack: 'Fourth', cardBackSmall: '👑 KING 👑', tap: 'Tap to draw a card',
    fourthOut: 'The fourth king is out!', fourthText: 'They chug everything left in their glass. Everyone counts: chug, chug, chug!',
    sipsTitle: '📊 Sips of the night (approx.)', again: 'Another round!', changePlayers: 'Change players', backMenu: 'Back to menu',
    resumeTitle: '⏯ There\'s an unfinished game', resumeText: 'It was {name}\'s turn. {cards} cards left and {kings} kings drawn.', resume: 'Continue', delete: 'Delete',
    playerPlaceholder: 'Player {n}', removePlayer: 'Remove player',
    genders: { m: 'Guy', f: 'Girl', x: 'Other (drinks on J and Q)' },
    errMin: 'You need at least {n} players.', errNames: 'Every player needs a name.', errDup: 'Some names are repeated. Use nicknames.',
    drew: '{name} drew the {rank} of {suit}', next: 'Done, next!',
    noMen: 'No guys at the table… so you drink.', noWomen: 'No girls at the table… so you drink.',
    giftLeft: 'You have {n} sips left to give.', giftLeftOne: 'You have 1 sip left to give.', giftDone: 'All set! Confirm below.', gifted: 'Given!',
    penitenciaFor: 'Dare for {name}', otherPenitencia: '🎲 Another dare', done: '✅ Done!', chickened: '😳 Chickened out: take {n} sips',
    chanchoBig: '🐷 Whenever you want…', chanchoHint: 'Keep playing. When it happens, mark the loser here or at any time.',
    whoLost: 'Who lost? Takes {n} sips.', nobodyLost: 'Nobody lost / keep going',
    timerHint: '5-second countdown for whoever freezes', timerStart: '⏱ Start 5 s', timeUp: 'TIME\'S UP!',
    suggestedCategory: 'Suggested category', otherCategory: '🎲 Another category',
    noIdeas: '💡 Out of ideas?', otherIdea: '🎲 Another idea', nuncaStarts: '{name} starts: “Never have I ever…”',
    kingsCount: '👑 {k} of 4', seeResult: '🏆 See the result',
    deckOver: 'The deck ran out', sips: '{n} sips', plusChug: ' + chug',
    endStats: '{cards} cards in {mins} min. Sips are an estimate: mini-games and dares count when you mark the loser.',
    hoCheers: 'Cheers!', hoGift: 'A gift!', hoDone: 'Done!', hoChickened: 'Chickened out!', hoLost: 'Lost!', hoGoOn: 'Keep going!', hoKings: '{k} kings so far!', hoReady: 'Ready!',
    hoDrinkOne: 'Takes {n} sips', hoDrinkMany: 'Take {n} sips', hoTap: 'Tap to continue', hoPass: 'Pass the phone to', hoGiveCard: 'Give me the card!',
  },
};

export const LOCALES = { es: ES, en: EN };
