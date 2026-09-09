/**
 * Línea de Tiempo — configuración por defecto y textos en español e inglés.
 */
export const GAME_ID = 'linea-de-tiempo';
export const DEFAULT_CONFIG = { theme: 'historia', handSize: 5, difficulty: 'normal' };
export const HAND_SIZES = [3, 5, 7];
export const DIFFICULTIES = ['facil', 'normal', 'dificil'];
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

const ES = {
  docTitle: 'Línea de Tiempo ⏳ · Juegos de Salón', gameChip: '⏳ Línea de Tiempo', menu: '‹ Menú',
  title: 'Línea de Tiempo',
  lead: 'Recibes hitos sin fecha. Ubícalos en el lugar correcto de la línea de tiempo y quédate sin cartas antes que nadie.',
  howTitle: '🧭 Cómo se juega',
  howText: 'Cada uno parte con 5 cartas que muestran un hito, pero <b>no su año</b>. En tu turno eliges una carta y la ranura donde crees que va. Si aciertas, la carta se queda en la línea. Si fallas, se descarta y robas otra. Gana quien se queda sin cartas.',
  modeLocal: '📱 Un celular, hasta 6', modeLocalHint: 'Se pasan el celular por turnos.',
  modeOnline: '📡 Varios celulares', modeOnlineHint: 'Sala con código de 4 letras, hasta 6 jugadores.',
  modeCpu: '🤖 Contra el celular', modeCpuHint: 'Tú contra la máquina, con tres niveles.',
  // setup
  setupTitle: '¿Cómo jugamos?', theme: 'Temática', handSize: 'Cartas en mano', difficulty: 'Nivel del celular',
  short: 'Corta', normal: 'Normal', long: 'Larga', facil: 'Fácil', dificil: 'Difícil',
  players: 'Jugadores', playerPlaceholder: 'Jugador {n}', addPlayer: '+ Agregar jugador', maxPlayers: 'Máximo {n} jugadores', removePlayer: 'Quitar jugador',
  yourName: 'Tu nombre', cpuName: 'Celular', start: '¡A jugar!',
  errName: 'Falta el nombre.', errNames: 'Faltan nombres o están repetidos.',
  create: 'Crear sala', joinTitle: 'Unirse a una sala', codePlaceholder: 'CÓDIGO', join: 'Unirse', errCode: 'El código tiene 4 letras.',
  errNotFound: 'No existe esa sala. Revisa el código.', errFull: 'La sala ya está llena.', errExpired: 'Esa sala ya venció.', errOtherGame: 'Ese código es de otro juego.', errNet: 'No se pudo conectar. ¿Hay internet?',
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al resto o que escaneen el QR.', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  lobbyPlayers: 'En la sala', lobbyWaitHost: 'Esperando a que {name} empiece…', lobbyStart: '🚀 ¡Empezar!', lobbyNeedMore: 'Faltan jugadores',
  offline: '{name} se desconectó', waitingTurn: 'Esperando a {name}…', placedBy: '{name} colocó',
  // juego
  turnYou: '¡Te toca, {name}!', turnOther: 'Turno de {name}', cpuThinking: 'El celular está pensando…',
  carrying: 'Llevas', changeCard: 'Cambiar', yourHand: 'Tu mano', handOf: 'Mano de {name}', pickCard: 'Elige una carta', pickSlot: '¿Dónde va?', place: '📍 Colocar aquí',
  timeline: 'Línea de tiempo', cardsLeft: '{n}', poolLeft: 'Quedan {n} en el mazo',
  slotFirst: '↑ Antes de todo', slotLast: '↓ Después de todo', slotBetween: 'Aquí',
  correct: '¡Correcto!', wrong: '¡Te equivocaste!', wasYear: 'Era {year}', goesHere: 'Iba aquí ↓', drewNew: 'La carta se descarta y robas una nueva.',
  whyWrong: 'Fue en {year}: iba {where}.', wherePlaced: 'Tú la pusiste {where}.', between: 'entre {a} y {b}', beforeOf: 'antes de {b}', afterOf: 'después de {a}', tapContinue: 'Toca para seguir',
  hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!', hoContinue: 'Seguir',
  // resultado
  winTitle: '¡Ganó {name}!', winTitleMany: '¡Empate!', youWin: '¡Ganaste!', youLose: 'Perdiste… esta vez.',
  stats: '{ok} de {total} aciertos', ranking: 'Cómo terminaron', cardsHeld: '{n} cartas', cardHeld: '1 carta', noCards: 'sin cartas',
  finalLine: 'La línea quedó así', rematch: '🔁 Revancha', changeMode: 'Cambiar modo', backMenu: 'Volver al menú',
  resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
};

const EN = {
  docTitle: 'Timeline ⏳ · Party Games', gameChip: '⏳ Timeline', menu: '‹ Menu',
  title: 'Timeline',
  lead: 'You get milestones with no date. Put them in the right spot on the timeline and run out of cards before anyone else.',
  howTitle: '🧭 How to play',
  howText: 'Everyone starts with 5 cards showing a milestone but <b>not its year</b>. On your turn you pick a card and the slot where you think it belongs. Get it right and the card stays on the timeline. Get it wrong and you discard it and draw another. First to run out of cards wins.',
  modeLocal: '📱 One phone, up to 6', modeLocalHint: 'Pass the phone around, turn by turn.',
  modeOnline: '📡 Several phones', modeOnlineHint: 'A room with a 4-letter code, up to 6 players.',
  modeCpu: '🤖 Versus the phone', modeCpuHint: 'You against the machine, with three levels.',
  setupTitle: 'How do we play?', theme: 'Theme', handSize: 'Cards in hand', difficulty: 'Phone level',
  short: 'Short', normal: 'Normal', long: 'Long', facil: 'Easy', dificil: 'Hard',
  players: 'Players', playerPlaceholder: 'Player {n}', addPlayer: '+ Add player', maxPlayers: 'Max {n} players', removePlayer: 'Remove player',
  yourName: 'Your name', cpuName: 'Phone', start: 'Let\'s play!',
  errName: 'Name missing.', errNames: 'Names missing or repeated.',
  create: 'Create room', joinTitle: 'Join a room', codePlaceholder: 'CODE', join: 'Join', errCode: 'The code has 4 letters.',
  errNotFound: 'That room doesn\'t exist. Check the code.', errFull: 'That room is full.', errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.', errNet: 'Could not connect. Is there internet?',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell the others the code or let them scan the QR.', copyLink: '📋 Copy link', copied: 'Copied!',
  lobbyPlayers: 'In the room', lobbyWaitHost: 'Waiting for {name} to start…', lobbyStart: '🚀 Start!', lobbyNeedMore: 'Need more players',
  offline: '{name} disconnected', waitingTurn: 'Waiting for {name}…', placedBy: '{name} placed',
  turnYou: 'Your turn, {name}!', turnOther: '{name}\'s turn', cpuThinking: 'The phone is thinking…',
  carrying: 'Carrying', changeCard: 'Change', yourHand: 'Your hand', handOf: '{name}\'s hand', pickCard: 'Pick a card', pickSlot: 'Where does it go?', place: '📍 Place it here',
  timeline: 'Timeline', cardsLeft: '{n}', poolLeft: '{n} left in the deck',
  slotFirst: '↑ Before everything', slotLast: '↓ After everything', slotBetween: 'Here',
  correct: 'Correct!', wrong: 'Wrong!', wasYear: 'It was {year}', goesHere: 'It goes here ↓', drewNew: 'The card is discarded and you draw a new one.',
  whyWrong: 'It happened in {year}: it belongs {where}.', wherePlaced: 'You put it {where}.', between: 'between {a} and {b}', beforeOf: 'before {b}', afterOf: 'after {a}', tapContinue: 'Tap to continue',
  hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!', hoContinue: 'Continue',
  winTitle: '{name} wins!', winTitleMany: 'It\'s a tie!', youWin: 'You win!', youLose: 'You lose… this time.',
  stats: '{ok} of {total} correct', ranking: 'How it ended', cardsHeld: '{n} cards', cardHeld: '1 card', noCards: 'no cards',
  finalLine: 'The timeline ended like this', rematch: '🔁 Rematch', changeMode: 'Change mode', backMenu: 'Back to menu',
  resumeTitle: '⏯ There\'s an unfinished game', resume: 'Continue', delete: 'Delete',
};

export const LOCALES = { es: ES, en: EN };
