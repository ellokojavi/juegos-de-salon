/**
 * El Camaleón — the game's data in Spanish, English, Portuguese and German: the topics with their
 * 16 words and the interface texts. Data only, no logic (the rules are in engine.js).
 * The word lists are our own (D-286, D-289: inspired by The Chameleon, not copied). See
 * docs/games/chameleon.md.
 */

export const GAME_ID = 'camaleon';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const GRID = 16;          // 4 × 4 words per topic
export const TARGET = 5;         // first to 5 points wins
export const POINTS = { escaped: 2, guessed: 1, caught: 1 };

/** Topics, in the same order in every language; each list has exactly GRID words. */
export const TOPIC_IDS = ['animals', 'food', 'sports', 'jobs', 'home', 'places'];
export const TOPIC_EMOJI = { animals: '🦁', food: '🍕', sports: '⚽', jobs: '👩‍🚒', home: '🛋️', places: '🏙️' };

const ES_TOPICS = {
  animals: { name: 'Animales', words: ['Perro', 'Gato', 'Caballo', 'Vaca', 'León', 'Tigre', 'Elefante', 'Jirafa', 'Mono', 'Delfín', 'Tiburón', 'Águila', 'Pingüino', 'Serpiente', 'Rana', 'Oso'] },
  food: { name: 'Comida', words: ['Pizza', 'Empanada', 'Sushi', 'Completo', 'Hamburguesa', 'Tallarines', 'Arroz', 'Ensalada', 'Sopa', 'Helado', 'Torta', 'Chocolate', 'Pan', 'Queso', 'Huevo', 'Papas fritas'] },
  sports: { name: 'Deportes', words: ['Fútbol', 'Tenis', 'Básquetbol', 'Vóleibol', 'Natación', 'Ciclismo', 'Boxeo', 'Golf', 'Rugby', 'Esquí', 'Surf', 'Atletismo', 'Ajedrez', 'Karate', 'Béisbol', 'Patinaje'] },
  jobs: { name: 'Oficios', words: ['Médico', 'Profesora', 'Bombero', 'Policía', 'Cocinero', 'Piloto', 'Abogada', 'Peluquero', 'Astronauta', 'Granjero', 'Dentista', 'Pintor', 'Cartero', 'Actriz', 'Jardinero', 'Ingeniera'] },
  home: { name: 'La casa', words: ['Sofá', 'Cama', 'Refrigerador', 'Lavadora', 'Televisor', 'Lámpara', 'Espejo', 'Ducha', 'Mesa', 'Silla', 'Alfombra', 'Cortina', 'Horno', 'Reloj', 'Almohada', 'Escalera'] },
  places: { name: 'Lugares', words: ['Playa', 'Hospital', 'Colegio', 'Aeropuerto', 'Cine', 'Supermercado', 'Estadio', 'Museo', 'Iglesia', 'Biblioteca', 'Gimnasio', 'Parque', 'Cárcel', 'Zoológico', 'Restaurante', 'Discoteca'] },
};

const EN_TOPICS = {
  animals: { name: 'Animals', words: ['Dog', 'Cat', 'Horse', 'Cow', 'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Monkey', 'Dolphin', 'Shark', 'Eagle', 'Penguin', 'Snake', 'Frog', 'Bear'] },
  food: { name: 'Food', words: ['Pizza', 'Pie', 'Sushi', 'Hot dog', 'Burger', 'Pasta', 'Rice', 'Salad', 'Soup', 'Ice cream', 'Cake', 'Chocolate', 'Bread', 'Cheese', 'Egg', 'Chips'] },
  sports: { name: 'Sports', words: ['Football', 'Tennis', 'Basketball', 'Volleyball', 'Swimming', 'Cycling', 'Boxing', 'Golf', 'Rugby', 'Skiing', 'Surfing', 'Running', 'Chess', 'Karate', 'Baseball', 'Skating'] },
  jobs: { name: 'Jobs', words: ['Doctor', 'Teacher', 'Firefighter', 'Police officer', 'Chef', 'Pilot', 'Lawyer', 'Hairdresser', 'Astronaut', 'Farmer', 'Dentist', 'Painter', 'Postman', 'Actress', 'Gardener', 'Engineer'] },
  home: { name: 'At home', words: ['Sofa', 'Bed', 'Fridge', 'Washing machine', 'TV', 'Lamp', 'Mirror', 'Shower', 'Table', 'Chair', 'Rug', 'Curtain', 'Oven', 'Clock', 'Pillow', 'Stairs'] },
  places: { name: 'Places', words: ['Beach', 'Hospital', 'School', 'Airport', 'Cinema', 'Supermarket', 'Stadium', 'Museum', 'Church', 'Library', 'Gym', 'Park', 'Prison', 'Zoo', 'Restaurant', 'Nightclub'] },
};

const PT_TOPICS = {
  animals: { name: 'Animais', words: ['Cachorro', 'Gato', 'Cavalo', 'Vaca', 'Leão', 'Tigre', 'Elefante', 'Girafa', 'Macaco', 'Golfinho', 'Tubarão', 'Águia', 'Pinguim', 'Cobra', 'Sapo', 'Urso'] },
  food: { name: 'Comida', words: ['Pizza', 'Pastel', 'Sushi', 'Cachorro-quente', 'Hambúrguer', 'Macarrão', 'Arroz', 'Salada', 'Sopa', 'Sorvete', 'Bolo', 'Chocolate', 'Pão', 'Queijo', 'Ovo', 'Batata frita'] },
  sports: { name: 'Esportes', words: ['Futebol', 'Tênis', 'Basquete', 'Vôlei', 'Natação', 'Ciclismo', 'Boxe', 'Golfe', 'Rúgbi', 'Esqui', 'Surfe', 'Atletismo', 'Xadrez', 'Caratê', 'Beisebol', 'Patinação'] },
  jobs: { name: 'Profissões', words: ['Médico', 'Professora', 'Bombeiro', 'Policial', 'Cozinheiro', 'Piloto', 'Advogada', 'Cabeleireiro', 'Astronauta', 'Fazendeiro', 'Dentista', 'Pintor', 'Carteiro', 'Atriz', 'Jardineiro', 'Engenheira'] },
  home: { name: 'A casa', words: ['Sofá', 'Cama', 'Geladeira', 'Máquina de lavar', 'Televisão', 'Abajur', 'Espelho', 'Chuveiro', 'Mesa', 'Cadeira', 'Tapete', 'Cortina', 'Forno', 'Relógio', 'Travesseiro', 'Escada'] },
  places: { name: 'Lugares', words: ['Praia', 'Hospital', 'Escola', 'Aeroporto', 'Cinema', 'Supermercado', 'Estádio', 'Museu', 'Igreja', 'Biblioteca', 'Academia', 'Parque', 'Prisão', 'Zoológico', 'Restaurante', 'Balada'] },
};

/* ================================================================== */
/* Interface texts                                                     */
/* ================================================================== */
const ES = {
  docTitle: 'El Camaleón 🦎 · Juegos de Salón',
  menu: '‹ Menú', gameChip: '🦎 El Camaleón', title: 'El Camaleón',
  lead: 'Todos saben la palabra secreta menos uno. Descubran al camaleón antes de que se escape.',
  credit: 'Inspirado en The Chameleon, de Big Potato Games.',
  goSetup: '¡Armar la mesa!',
  howTitle: '🦎 Cómo se juega',
  how1: 'Todos ven la palabra secreta en el celular, menos el camaleón, que solo ve el tema.',
  how2: 'Por turno, cada uno dice una palabra que tenga que ver con la secreta. El camaleón tiene que disimular.',
  how3: 'Después votan. Si pillan al camaleón, todavía se salva si adivina la palabra.',
  scoring: 'Escapar sin que lo pillen le da 2 puntos al camaleón y adivinar la palabra, 1. Si falla, los demás ganan 1. Gana el primero en llegar a 5.',
  whoPlays: '¿Quiénes juegan?',
  setupHint: 'Anótense en el orden en que están sentados. Son de 3 a 8 jugadores.',
  playerPlaceholder: 'Jugador {n}', addPlayer: '+ Agregar jugador', removePlayer: 'Quitar jugador', start: '¡A jugar!',
  errorFew: 'Faltan nombres: se necesitan al menos 3 jugadores.', errorRepeated: 'Hay dos jugadores con el mismo nombre.',
  resumeTitle: '🦎 Hay una partida a medias', resumeText: 'Ronda {round}, con {names}.', resume: 'Seguir', delete: 'Borrar',
  topicTitle: 'Elige el tema', topicRandom: '🎲 Al azar', roundLabel: 'Ronda {n}',
  passTo: 'Pásale el celular a', seeCard: 'Ver mi carta',
  yourWord: 'La palabra secreta es', youAreChameleon: '¡Eres el camaleón!',
  chameleonHint: 'No sabes la palabra. Escucha a los demás y disimula.',
  hideCard: 'Listo, tapar',
  cluesTitle: 'Una pista cada uno',
  cluesText: 'Empieza {name} y se sigue hacia la derecha. Cada uno dice una sola palabra.',
  goVote: '¡A votar!',
  voteTitle: '¿Quién es el camaleón?',
  voteText: 'A la cuenta de tres, todos apuntan. Toca al más apuntado. Si hay empate, decide {name}.',
  caughtTitle: '¡Pillaron a {name}!',
  guessText: '{name}, si adivinas la palabra secreta, te salvas.',
  resultEscaped: '🦎 ¡El camaleón se escapó!', resultGuessed: '🦎 ¡El camaleón adivinó!', resultCaught: '🎉 ¡Pillaron al camaleón!',
  resultWhoEscaped: 'Era {name}, y acusaron a {accused}. +2 para el camaleón.',
  resultWhoGuessed: 'Era {name} y adivinó la palabra. +1 para el camaleón.',
  resultWhoCaught: 'Era {name}, y dijo «{guess}». +1 para todos los demás.',
  secretWas: 'La palabra era', scoreTitle: '📊 Puntos', points: '{n} pts', point: '1 pt',
  nextRound: 'Siguiente ronda',
  winnerTitle: '🏆 ¡Ganó {name}!', winnerTie: '🏆 ¡Empate entre {names}!',
  again: '¡Otra partida!', changePlayers: 'Cambiar jugadores', backMenu: 'Volver al menú',
  and: ' y ',
};

const EN = {
  docTitle: 'Chameleon 🦎 · Party Games',
  menu: '‹ Menu', gameChip: '🦎 Chameleon', title: 'Chameleon',
  lead: 'Everyone knows the secret word except one. Find the chameleon before it gets away.',
  credit: 'Inspired by The Chameleon, by Big Potato Games.',
  goSetup: 'Set the table!',
  howTitle: '🦎 How to play',
  how1: 'Everyone sees the secret word on the phone, except the chameleon, who only sees the topic.',
  how2: 'Taking turns, each player says one word related to the secret one. The chameleon has to blend in.',
  how3: 'Then you vote. If the chameleon is caught, it still escapes by guessing the word.',
  scoring: 'Escaping unseen gives the chameleon 2 points, and guessing the word gives 1. If it misses, everyone else gets 1. First to 5 wins.',
  whoPlays: 'Who is playing?',
  setupHint: 'Write your names in the order you are sitting. 3 to 8 players.',
  playerPlaceholder: 'Player {n}', addPlayer: '+ Add player', removePlayer: 'Remove player', start: 'Play!',
  errorFew: 'Names are missing: you need at least 3 players.', errorRepeated: 'Two players have the same name.',
  resumeTitle: '🦎 There is a game in progress', resumeText: 'Round {round}, with {names}.', resume: 'Continue', delete: 'Delete',
  topicTitle: 'Pick the topic', topicRandom: '🎲 Random', roundLabel: 'Round {n}',
  passTo: 'Pass the phone to', seeCard: 'See my card',
  yourWord: 'The secret word is', youAreChameleon: 'You are the chameleon!',
  chameleonHint: 'You do not know the word. Listen to the others and blend in.',
  hideCard: 'Done, hide it',
  cluesTitle: 'One clue each',
  cluesText: '{name} starts, then go to the right. Each player says a single word.',
  goVote: 'Vote!',
  voteTitle: 'Who is the chameleon?',
  voteText: 'On the count of three, everyone points. Tap the one most pointed at. If there is a tie, {name} decides.',
  caughtTitle: '{name} was caught!',
  guessText: '{name}, guess the secret word and you escape.',
  resultEscaped: '🦎 The chameleon got away!', resultGuessed: '🦎 The chameleon guessed it!', resultCaught: '🎉 The chameleon was caught!',
  resultWhoEscaped: 'It was {name}, and you accused {accused}. +2 for the chameleon.',
  resultWhoGuessed: 'It was {name}, who guessed the word. +1 for the chameleon.',
  resultWhoCaught: 'It was {name}, who said “{guess}”. +1 for everyone else.',
  secretWas: 'The word was', scoreTitle: '📊 Points', points: '{n} pts', point: '1 pt',
  nextRound: 'Next round',
  winnerTitle: '🏆 {name} wins!', winnerTie: '🏆 A tie between {names}!',
  again: 'Play again!', changePlayers: 'Change players', backMenu: 'Back to the menu',
  and: ' and ',
};

const PT = {
  docTitle: 'Camaleão 🦎 · Jogos de Salão',
  menu: '‹ Menu', gameChip: '🦎 Camaleão', title: 'Camaleão',
  lead: 'Todos sabem a palavra secreta, menos um. Descubram o camaleão antes que ele escape.',
  credit: 'Inspirado em The Chameleon, da Big Potato Games.',
  goSetup: 'Montar a mesa!',
  howTitle: '🦎 Como se joga',
  how1: 'Todos veem a palavra secreta no celular, menos o camaleão, que só vê o tema.',
  how2: 'Na sua vez, cada um diz uma palavra ligada à secreta. O camaleão tem que disfarçar.',
  how3: 'Depois vocês votam. Se pegarem o camaleão, ele ainda se salva se adivinhar a palavra.',
  scoring: 'Escapar sem ser pego dá 2 pontos ao camaleão e adivinhar a palavra, 1. Se errar, os outros ganham 1. Ganha quem chegar primeiro a 5.',
  whoPlays: 'Quem vai jogar?',
  setupHint: 'Escrevam os nomes na ordem em que estão sentados. De 3 a 8 jogadores.',
  playerPlaceholder: 'Jogador {n}', addPlayer: '+ Adicionar jogador', removePlayer: 'Remover jogador', start: 'Jogar!',
  errorFew: 'Faltam nomes: são precisos pelo menos 3 jogadores.', errorRepeated: 'Há dois jogadores com o mesmo nome.',
  resumeTitle: '🦎 Há uma partida pela metade', resumeText: 'Rodada {round}, com {names}.', resume: 'Continuar', delete: 'Apagar',
  topicTitle: 'Escolha o tema', topicRandom: '🎲 Aleatório', roundLabel: 'Rodada {n}',
  passTo: 'Passe o celular para', seeCard: 'Ver minha carta',
  yourWord: 'A palavra secreta é', youAreChameleon: 'Você é o camaleão!',
  chameleonHint: 'Você não sabe a palavra. Ouça os outros e disfarce.',
  hideCard: 'Pronto, esconder',
  cluesTitle: 'Uma pista cada um',
  cluesText: '{name} começa e segue para a direita. Cada um diz uma única palavra.',
  goVote: 'Votar!',
  voteTitle: 'Quem é o camaleão?',
  voteText: 'Contando até três, todos apontam. Toque no mais apontado. Se houver empate, {name} decide.',
  caughtTitle: 'Pegaram {name}!',
  guessText: '{name}, se adivinhar a palavra secreta, você se salva.',
  resultEscaped: '🦎 O camaleão escapou!', resultGuessed: '🦎 O camaleão adivinhou!', resultCaught: '🎉 Pegaram o camaleão!',
  resultWhoEscaped: 'Era {name}, e vocês acusaram {accused}. +2 para o camaleão.',
  resultWhoGuessed: 'Era {name}, que adivinhou a palavra. +1 para o camaleão.',
  resultWhoCaught: 'Era {name}, que disse “{guess}”. +1 para todos os outros.',
  secretWas: 'A palavra era', scoreTitle: '📊 Pontos', points: '{n} pts', point: '1 pt',
  nextRound: 'Próxima rodada',
  winnerTitle: '🏆 {name} venceu!', winnerTie: '🏆 Empate entre {names}!',
  again: 'Jogar de novo!', changePlayers: 'Trocar jogadores', backMenu: 'Voltar ao menu',
  and: ' e ',
};

export const LOCALES = {
  es: { ui: ES, topics: ES_TOPICS },
  en: { ui: EN, topics: EN_TOPICS },
  pt: { ui: PT, topics: PT_TOPICS },
};
