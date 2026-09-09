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
  modeOnline: '📡 Varios celulares', modeOnlineHint: 'Próximamente: sala con código, cada uno en su celular.',
  modeCpu: '🤖 Contra el celular', modeCpuHint: 'Tú contra la máquina, con tres niveles.',
  // setup
  setupTitle: '¿Cómo jugamos?', theme: 'Temática', handSize: 'Cartas en mano', difficulty: 'Nivel del celular',
  short: 'Corta', normal: 'Normal', long: 'Larga', facil: 'Fácil', dificil: 'Difícil',
  players: 'Jugadores', playerPlaceholder: 'Jugador {n}', addPlayer: '+ Agregar jugador', maxPlayers: 'Máximo {n} jugadores', removePlayer: 'Quitar jugador',
  yourName: 'Tu nombre', cpuName: 'Celular', start: '¡A jugar!',
  errName: 'Falta el nombre.', errNames: 'Faltan nombres o están repetidos.',
  // juego
  turnYou: '¡Te toca, {name}!', turnOther: 'Turno de {name}', cpuThinking: 'El celular está pensando…',
  carrying: 'Llevas', changeCard: 'Cambiar', yourHand: 'Tu mano', handOf: 'Mano de {name}', pickCard: 'Elige una carta', pickSlot: '¿Dónde va?', place: '📍 Colocar aquí',
  timeline: 'Línea de tiempo', cardsLeft: '{n}', poolLeft: 'Quedan {n} en el mazo',
  slotFirst: '↑ Antes de todo', slotLast: '↓ Después de todo', slotBetween: 'Aquí',
  correct: '¡Correcto!', wrong: 'Nop…', wasYear: 'Era {year}', goesHere: 'Iba aquí ↓', drewNew: 'Robas una carta nueva',
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
  modeOnline: '📡 Several phones', modeOnlineHint: 'Coming soon: a room with a code, each on their own phone.',
  modeCpu: '🤖 Versus the phone', modeCpuHint: 'You against the machine, with three levels.',
  setupTitle: 'How do we play?', theme: 'Theme', handSize: 'Cards in hand', difficulty: 'Phone level',
  short: 'Short', normal: 'Normal', long: 'Long', facil: 'Easy', dificil: 'Hard',
  players: 'Players', playerPlaceholder: 'Player {n}', addPlayer: '+ Add player', maxPlayers: 'Max {n} players', removePlayer: 'Remove player',
  yourName: 'Your name', cpuName: 'Phone', start: 'Let\'s play!',
  errName: 'Name missing.', errNames: 'Names missing or repeated.',
  turnYou: 'Your turn, {name}!', turnOther: '{name}\'s turn', cpuThinking: 'The phone is thinking…',
  carrying: 'Carrying', changeCard: 'Change', yourHand: 'Your hand', handOf: '{name}\'s hand', pickCard: 'Pick a card', pickSlot: 'Where does it go?', place: '📍 Place it here',
  timeline: 'Timeline', cardsLeft: '{n}', poolLeft: '{n} left in the deck',
  slotFirst: '↑ Before everything', slotLast: '↓ After everything', slotBetween: 'Here',
  correct: 'Correct!', wrong: 'Nope…', wasYear: 'It was {year}', goesHere: 'It goes here ↓', drewNew: 'You draw a new card',
  hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!', hoContinue: 'Continue',
  winTitle: '{name} wins!', winTitleMany: 'It\'s a tie!', youWin: 'You win!', youLose: 'You lose… this time.',
  stats: '{ok} of {total} correct', ranking: 'How it ended', cardsHeld: '{n} cards', cardHeld: '1 card', noCards: 'no cards',
  finalLine: 'The timeline ended like this', rematch: '🔁 Rematch', changeMode: 'Change mode', backMenu: 'Back to menu',
  resumeTitle: '⏯ There\'s an unfinished game', resume: 'Continue', delete: 'Delete',
};

export const LOCALES = { es: ES, en: EN };
