/**
 * Línea de Tiempo — configuración por defecto y textos en español, inglés y portugués.
 */
export const GAME_ID = 'linea-de-tiempo';
export const DEFAULT_CONFIG = { theme: 'historia', handSize: 5, shared: true, spread: true };
/** Cartas a la vista en el modo de pozo común (D-32). */
export const VISIBLE = 6;
/** Con todas a la vista se despliega el doble de la meta y no entra ninguna más (D-43). */
export const SPREAD_FACTOR = 2;
export const HAND_SIZES = [3, 5, 7];
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

const ES = {
  docTitle: 'Línea de Tiempo ⏳ · Juegos de Salón', gameChip: '⏳ Línea de Tiempo', menu: '‹ Menú',
  title: 'Línea de Tiempo',
  lead: 'Recibes hitos sin fecha. Ubícalos en el lugar correcto de la línea de tiempo y quédate sin cartas antes que nadie.',
  howTitle: '🧭 Cómo se juega',
  howText: 'Las cartas muestran un hito, pero <b>no su año</b>. En tu turno eliges una carta y la ranura donde crees que va. Si aciertas, la carta se queda en la línea. Si fallas, se descarta y todos ven en qué año fue. La ronda se termina siempre, y si más de uno llega a la meta gana el que respondió más rápido.',
  modeLocal: '📱 Un celular, hasta 6', modeLocalHint: 'Se pasan el celular por turnos.',
  modeOnline: '📡 Varios celulares', modeOnlineHint: 'Sala con código de 4 letras, hasta 6 jugadores.',
  modeSolo: '🧍 Jugar solo', modeSoloHint: 'Vacía tu mano en la menor cantidad de intentos y supera tu récord.',
  // setup
  setupTitle: '¿Cómo jugamos?', theme: 'Temática', handSize: 'Cartas en mano',
  cardsMode: 'Cartas', modeOwn: 'Mano propia', modeShared: 'Pozo común', modeAll: 'Todas a la vista',
  ownHint: 'Cada uno juega con su propia mano.',
  sharedHint: 'Todos eligen de las mismas {n} cartas a la vista y cada vez que sale una entra otra del mazo.',
  allHint: 'Se despliegan {n} cartas desde el primer turno y no entra ninguna más, así las más difíciles de situar van quedando para el final.',
  toWin: 'Cartas para ganar', visibleTitle: 'Cartas a la vista',
  short: 'Corta', normal: 'Normal', long: 'Larga',
  players: 'Jugadores', playerPlaceholder: 'Jugador {n}', addPlayer: '+ Agregar jugador', maxPlayers: 'Máximo {n} jugadores', removePlayer: 'Quitar jugador',
  yourName: 'Tu nombre', start: '¡A jugar!',
  errName: 'Falta el nombre.', errNames: 'Faltan nombres o están repetidos.',
  create: 'Crear sala', joinTitle: '¿Tienes un código? ¡Únete!', codePlaceholder: 'CÓDIGO', join: 'Unirse', errCode: 'El código tiene 4 letras.',
  errNotFound: 'No existe esa sala. Revisa el código.', errFull: 'La sala ya está llena.', errExpired: 'Esa sala ya venció.', errOtherGame: 'Ese código es de otro juego.', errNet: 'No se pudo conectar. ¿Hay internet?',
  errOffline: 'No se pudo abrir la sala. Puede ser tu internet o que haya mucha gente jugando. Intenta nuevamente en unos minutos o jugar en modo de un solo celular sin conexión a internet.',
  errTooMany: 'Abriste muchas salas seguidas. Espera un ratito y prueba de nuevo.',
  invitedTitle: '¡Invitado a jugar!', invited: '📩 Sala {code}', invitedHint: 'Escribe tu nombre y entra. La partida la configura quien te invitó.',
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al resto o que escaneen el QR.', shareLink: '📤 Compartir link', shareText: 'Únete a mi sala de {game} · {theme}. Código: {code}', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  lobbyPlayers: 'En la sala', lobbyWaitHost: 'Esperando a que {name} empiece…', lobbyStart: '🚀 ¡Empezar!', lobbyNeedMore: 'Faltan jugadores',
  lobbyCancel: 'Cancelar la sala', lobbyLeave: 'Salir de la sala',
  offline: '{name} se desconectó', waitingTurn: 'Esperando a {name}…', placedBy: '{name} colocó',
  // juego
  turnYou: '¡Te toca, {name}!', turnOther: 'Turno de {name}', soloTitle: 'Vacía tu mano', soloStatus: '{ok} aciertos en {n} {tries}', soloRecord: 'Récord: {n} {tries}', tryOne: 'intento', tryMany: 'intentos',
  yourHand: 'Tu mano', handOf: 'Mano de {name}', pickCard: 'Elige una carta', pickSlot: '¿Dónde va?', place: '📍 Colocar aquí',
  timeline: 'Línea de tiempo', cardsLeft: '{n}', poolLeft: 'Quedan {n} en el mazo',
  tableLeft: 'Quedan {n} cartas en la mesa', tableLeftOne: 'Queda 1 carta en la mesa',
  slotFirst: '↑ Antes de todo', slotLast: '↓ Después de todo', slotBetween: 'Aquí',
  correct: '¡Correcto!', wrong: '¡Te equivocaste!', correctOther: '¡{name} acertó!', wrongOther: '¡{name} se equivocó!',
  wasYear: 'Era {year}', goesHere: 'Iba aquí ↓', drewNew: 'La carta se descarta y robas una nueva.', drewNewOther: 'La carta se descarta y roba una nueva.',
  whyWrong: 'Fue en {year}: iba {where}.', wherePlaced: 'Tú la pusiste {where}.', wherePlacedOther: 'La puso {where}.', between: 'entre {a} y {b}', beforeOf: 'antes de {b}', afterOf: 'después de {a}', tapContinue: 'Toca para seguir',
  hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!', hoContinue: 'Seguir',
  // resultado
  winTitle: '¡Ganó {name}!', winTitleMany: '¡Empate!', youWin: '¡Ganaste!', youLose: 'Perdiste… esta vez.',
  soloDone: '¡Mano vacía!', soloResult: 'Lo lograste en {n} {tries} · {acc}% de aciertos',
  soloShort: 'Se acabaron las cartas', soloShortResult: 'Alcanzaste a colocar {ok} de las {n} cartas que necesitabas', newRecord: '🏆 ¡Nuevo récord!', prevRecord: 'Tu récord: {n} {tries}',
  wonOnTime: '⚡ Empataron sin cartas: ganó quien respondió más rápido', wonOnTimeShared: '⚡ Empataron: ganó quien respondió más rápido', timeSpent: '⏱ {t} respondiendo',
  stats: '{ok} de {total} aciertos', ranking: 'Cómo terminaron', cardsHeld: '{n} cartas', cardHeld: '1 carta', noCards: 'sin cartas',
  finalLine: 'La línea quedó así', rematch: '🔁 Revancha', changeMode: 'Cambiar modo', backMenu: 'Volver al menú',
  resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
  // chat de sala (solo varios celulares)
  chatTitle: 'Chat de la sala', chatOpen: 'Abrir el chat', chatClose: 'Cerrar el chat', chatSend: 'Enviar',
  chatPlaceholder: 'Escribe algo…', chatEmpty: 'Acá pueden comentar la partida. Se borra cuando termina.',
};

const EN = {
  docTitle: 'Timeline ⏳ · Party Games', gameChip: '⏳ Timeline', menu: '‹ Menu',
  title: 'Timeline',
  lead: 'You get milestones with no date. Put them in the right spot on the timeline and run out of cards before anyone else.',
  howTitle: '🧭 How to play',
  howText: 'Cards show a milestone but <b>not its year</b>. On your turn you pick a card and the slot where you think it belongs. Get it right and the card stays on the timeline. Get it wrong and it is discarded and everyone sees what year it was. The round is always played out to the end, and if more than one player reaches the goal, the fastest one wins.',
  modeLocal: '📱 One phone, up to 6', modeLocalHint: 'Pass the phone around, turn by turn.',
  modeOnline: '📡 Several phones', modeOnlineHint: 'A room with a 4-letter code, up to 6 players.',
  modeSolo: '🧍 Play alone', modeSoloHint: 'Empty your hand in as few tries as you can and beat your record.',
  setupTitle: 'How do we play?', theme: 'Theme', handSize: 'Cards in hand',
  cardsMode: 'Cards', modeOwn: 'Own hand', modeShared: 'Shared pool', modeAll: 'All on the table',
  ownHint: 'Everyone plays their own hand.',
  sharedHint: 'Everyone picks from the same {n} open cards and a new one comes in from the deck each time one leaves.',
  allHint: 'All {n} cards are laid out from the very first turn and no card is ever added, so the hardest ones to place are left for the end.',
  toWin: 'Cards to win', visibleTitle: 'Cards on the table',
  short: 'Short', normal: 'Normal', long: 'Long',
  players: 'Players', playerPlaceholder: 'Player {n}', addPlayer: '+ Add player', maxPlayers: 'Max {n} players', removePlayer: 'Remove player',
  yourName: 'Your name', start: 'Let\'s play!',
  errName: 'Name missing.', errNames: 'Names missing or repeated.',
  create: 'Create room', joinTitle: 'Got a code? Jump in!', codePlaceholder: 'CODE', join: 'Join', errCode: 'The code has 4 letters.',
  errNotFound: 'That room doesn\'t exist. Check the code.', errFull: 'That room is full.', errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.', errNet: 'Could not connect. Is there internet?',
  errOffline: 'Couldn\'t open the room. It might be your connection or too many people playing. Try again in a few minutes, or play in one-phone mode, which needs no internet.',
  errTooMany: 'You\'ve opened a lot of rooms in a row. Wait a bit and try again.',
  invitedTitle: 'Invited to play!', invited: '📩 Room {code}', invitedHint: 'Type your name and jump in. Whoever invited you sets up the game.',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell the others the code or let them scan the QR.', shareLink: '📤 Share link', shareText: 'Join my {game} room · {theme}. Code: {code}', copyLink: '📋 Copy link', copied: 'Copied!',
  lobbyPlayers: 'In the room', lobbyWaitHost: 'Waiting for {name} to start…', lobbyStart: '🚀 Start!', lobbyNeedMore: 'Need more players',
  lobbyCancel: 'Cancel the room', lobbyLeave: 'Leave the room',
  offline: '{name} disconnected', waitingTurn: 'Waiting for {name}…', placedBy: '{name} placed',
  turnYou: 'Your turn, {name}!', turnOther: '{name}\'s turn', soloTitle: 'Empty your hand', soloStatus: '{ok} correct in {n} {tries}', soloRecord: 'Record: {n} {tries}', tryOne: 'try', tryMany: 'tries',
  yourHand: 'Your hand', handOf: '{name}\'s hand', pickCard: 'Pick a card', pickSlot: 'Where does it go?', place: '📍 Place it here',
  timeline: 'Timeline', cardsLeft: '{n}', poolLeft: '{n} left in the deck',
  tableLeft: '{n} cards left on the table', tableLeftOne: '1 card left on the table',
  slotFirst: '↑ Before everything', slotLast: '↓ After everything', slotBetween: 'Here',
  correct: 'Correct!', wrong: 'Wrong!', correctOther: '{name} nailed it!', wrongOther: '{name} got it wrong!',
  wasYear: 'It was {year}', goesHere: 'It goes here ↓', drewNew: 'The card is discarded and you draw a new one.', drewNewOther: 'The card is discarded and they draw a new one.',
  whyWrong: 'It happened in {year}: it belongs {where}.', wherePlaced: 'You put it {where}.', wherePlacedOther: 'They put it {where}.', between: 'between {a} and {b}', beforeOf: 'before {b}', afterOf: 'after {a}', tapContinue: 'Tap to continue',
  hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!', hoContinue: 'Continue',
  winTitle: '{name} wins!', winTitleMany: 'It\'s a tie!', youWin: 'You win!', youLose: 'You lose… this time.',
  soloDone: 'Hand empty!', soloResult: 'You did it in {n} {tries} · {acc}% correct',
  soloShort: 'The cards ran out', soloShortResult: 'You managed to place {ok} of the {n} cards you needed', newRecord: '🏆 New record!', prevRecord: 'Your record: {n} {tries}',
  wonOnTime: '⚡ Tied with no cards: the fastest one wins', wonOnTimeShared: '⚡ Tied: the fastest one wins', timeSpent: '⏱ {t} answering',
  stats: '{ok} of {total} correct', ranking: 'How it ended', cardsHeld: '{n} cards', cardHeld: '1 card', noCards: 'no cards',
  finalLine: 'The timeline ended like this', rematch: '🔁 Rematch', changeMode: 'Change mode', backMenu: 'Back to menu',
  resumeTitle: '⏯ There\'s an unfinished game', resume: 'Continue', delete: 'Delete',
  // room chat (several phones only)
  chatTitle: 'Room chat', chatOpen: 'Open the chat', chatClose: 'Close the chat', chatSend: 'Send',
  chatPlaceholder: 'Say something…', chatEmpty: 'Talk trash about the game here. It disappears when the game ends.',
};


const PT = {
  docTitle: 'Linha do Tempo ⏳ · Jogos de Salão', gameChip: '⏳ Linha do Tempo', menu: '‹ Menu',
  title: 'Linha do Tempo',
  lead: 'Você recebe marcos sem data. Coloque cada um no lugar certo da linha do tempo e fique sem cartas antes de todo mundo.',
  howTitle: '🧭 Como se joga',
  howText: 'As cartas mostram um marco, mas <b>não o ano</b>. Na sua vez você escolhe uma carta e o espaço onde acha que ela vai. Se acertar, a carta fica na linha. Se errar, ela é descartada e todo mundo vê em que ano foi. A rodada sempre vai até o fim, e se mais de um chega à meta ganha quem respondeu mais rápido.',
  modeLocal: '📱 Um celular, até 6', modeLocalHint: 'Vocês passam o celular a cada turno.',
  modeOnline: '📡 Vários celulares', modeOnlineHint: 'Sala com código de 4 letras, até 6 jogadores.',
  modeSolo: '🧍 Jogar sozinho', modeSoloHint: 'Esvazie sua mão no menor número de tentativas e supere seu recorde.',
  // configuração
  setupTitle: 'Como vamos jogar?', theme: 'Tema', handSize: 'Cartas na mão',
  cardsMode: 'Cartas', modeOwn: 'Mão própria', modeShared: 'Monte comum', modeAll: 'Todas na mesa',
  ownHint: 'Cada um joga com a própria mão.',
  sharedHint: 'Todos escolhem entre as mesmas {n} cartas à vista e cada vez que uma sai entra outra do baralho.',
  allHint: 'Aparecem {n} cartas desde o primeiro turno e nenhuma outra entra, então as mais difíceis de situar vão ficando para o final.',
  toWin: 'Cartas para ganhar', visibleTitle: 'Cartas à vista',
  short: 'Curta', normal: 'Normal', long: 'Longa',
  players: 'Jogadores', playerPlaceholder: 'Jogador {n}', addPlayer: '+ Adicionar jogador', maxPlayers: 'No máximo {n} jogadores', removePlayer: 'Remover jogador',
  yourName: 'Seu nome', start: 'Bora jogar!',
  errName: 'Falta o nome.', errNames: 'Faltam nomes ou estão repetidos.',
  create: 'Criar sala', joinTitle: 'Tem um código? Entre!', codePlaceholder: 'CÓDIGO', join: 'Entrar', errCode: 'O código tem 4 letras.',
  errNotFound: 'Essa sala não existe. Confira o código.', errFull: 'A sala já está cheia.', errExpired: 'Essa sala já expirou.', errOtherGame: 'Esse código é de outro jogo.', errNet: 'Não foi possível conectar. Tem internet?',
  errOffline: 'Não foi possível abrir a sala. Pode ser a sua internet ou muita gente jogando ao mesmo tempo. Tente de novo em alguns minutos ou jogue no modo de um celular só, que não precisa de internet.',
  errTooMany: 'Você abriu muitas salas seguidas. Espere um pouquinho e tente de novo.',
  invitedTitle: 'Convidado para jogar!', invited: '📩 Sala {code}', invitedHint: 'Escreva seu nome e entre. Quem te convidou configura a partida.',
  lobbyTitle: 'Sala criada', lobbyCode: 'Código', lobbyShare: 'Diga o código aos outros ou deixe eles escanearem o QR.', shareLink: '📤 Compartilhar link', shareText: 'Entre na minha sala de {game} · {theme}. Código: {code}', copyLink: '📋 Copiar link', copied: 'Copiado!',
  lobbyPlayers: 'Na sala', lobbyWaitHost: 'Esperando {name} começar…', lobbyStart: '🚀 Começar!', lobbyNeedMore: 'Faltam jogadores',
  lobbyCancel: 'Cancelar a sala', lobbyLeave: 'Sair da sala',
  offline: '{name} se desconectou', waitingTurn: 'Esperando {name}…', placedBy: '{name} colocou',
  // jogo
  turnYou: 'Sua vez, {name}!', turnOther: 'Vez de {name}', soloTitle: 'Esvazie sua mão', soloStatus: '{ok} acertos em {n} {tries}', soloRecord: 'Recorde: {n} {tries}', tryOne: 'tentativa', tryMany: 'tentativas',
  yourHand: 'Sua mão', handOf: 'Mão de {name}', pickCard: 'Escolha uma carta', pickSlot: 'Onde ela vai?', place: '📍 Colocar aqui',
  timeline: 'Linha do tempo', cardsLeft: '{n}', poolLeft: 'Faltam {n} no baralho',
  tableLeft: 'Faltam {n} cartas na mesa', tableLeftOne: 'Falta 1 carta na mesa',
  slotFirst: '↑ Antes de tudo', slotLast: '↓ Depois de tudo', slotBetween: 'Aqui',
  correct: 'Correto!', wrong: 'Você errou!', correctOther: '{name} acertou!', wrongOther: '{name} errou!',
  wasYear: 'Foi em {year}', goesHere: 'Ia aqui ↓', drewNew: 'A carta é descartada e você compra uma nova.', drewNewOther: 'A carta é descartada e quem jogou compra uma nova.',
  whyWrong: 'Foi em {year}: ia {where}.', wherePlaced: 'Você colocou {where}.', wherePlacedOther: 'Foi colocada {where}.', between: 'entre {a} e {b}', beforeOf: 'antes de {b}', afterOf: 'depois de {a}', tapContinue: 'Toque para continuar',
  hoPass: 'Passe o celular para', hoReady: 'Pronto, sou eu!', hoContinue: 'Continuar',
  // resultado
  winTitle: '{name} ganhou!', winTitleMany: 'Empate!', youWin: 'Você ganhou!', youLose: 'Você perdeu… desta vez.',
  soloDone: 'Mão vazia!', soloResult: 'Você conseguiu em {n} {tries} · {acc}% de acertos',
  soloShort: 'As cartas acabaram', soloShortResult: 'Você conseguiu colocar {ok} das {n} cartas de que precisava', newRecord: '🏆 Novo recorde!', prevRecord: 'Seu recorde: {n} {tries}',
  wonOnTime: '⚡ Empataram sem cartas: ganhou quem respondeu mais rápido', wonOnTimeShared: '⚡ Empataram: ganhou quem respondeu mais rápido', timeSpent: '⏱ {t} respondendo',
  stats: '{ok} de {total} acertos', ranking: 'Como terminaram', cardsHeld: '{n} cartas', cardHeld: '1 carta', noCards: 'sem cartas',
  finalLine: 'A linha ficou assim', rematch: '🔁 Revanche', changeMode: 'Mudar o modo', backMenu: 'Voltar ao menu',
  resumeTitle: '⏯ Tem uma partida pela metade', resume: 'Continuar', delete: 'Apagar',
  // chat da sala (só com vários celulares)
  chatTitle: 'Chat da sala', chatOpen: 'Abrir o chat', chatClose: 'Fechar o chat', chatSend: 'Enviar',
  chatPlaceholder: 'Escreva algo…', chatEmpty: 'Aqui vocês podem comentar a partida. Some quando ela termina.',
};

export const LOCALES = { es: ES, en: EN, pt: PT };
