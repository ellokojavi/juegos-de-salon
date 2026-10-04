/**
 * Julepe — datos y textos en español, inglés y portugués.
 * Solo datos, sin lógica. Ver docs/games/julep.md.
 *
 * El nombre cambia en cada idioma porque en cada idioma se reconoce otra cosa (D-48, D-84):
 * en español es **Julepe**; en inglés, **Julep**, que es un trago y suena igual; y en portugués
 * de Brasil, **Paga o Bolo**, porque "el bolo" es como se llama allá el pozo que se junta.
 */

export const GAME_ID = 'julepe';
export const DEFAULT_CONFIG = { manos: 8 };
/** Cuántas manos puede durar una partida. La del medio es la que viene puesta. */
export const LARGOS = [5, 8, 12];
/** Cuántos rivales del aparato caben en la mesa de "contra el celular" (MAX_PLAYERS − 1). */
export const RIVALES = [1, 2, 3, 4, 5];
export const RIVALES_POR_DEFECTO = 2;

/* ================================================================== */
/* ESPAÑOL                                                             */
/* ================================================================== */
const ES = {
  paloNames: { '♠': 'picas', '♥': 'corazones', '♦': 'diamantes', '♣': 'tréboles' },
  rankNames: { A: 'as', K: 'rey', Q: 'reina', J: 'jota' },
  ui: {
    // estáticos (index.html)
    docTitle: 'Julepe 🍹 · Juegos de Salón', gameChip: '🍹 Julepe', menu: '‹ Menú',
    title: 'Julepe', lead: 'Si vas y no ganas dos de las cinco bazas, te tomas el plato entero.',
    leadExplain: 'Una partida tiene varias manos. En cada mano se juegan cinco bazas de una carta por jugador.',
    rulesSummary: '🍹 ¿Cómo se juega?',
    whoPlays: '¿Quiénes juegan?',
    setupHint: 'Anótense en el orden en que están sentados, hacia la derecha.',
    lobbyTitle: 'Sala creada', historyTitle: '🍹 Mano por mano',
    beforeTitle: '🍹 Antes de partir',
    beforeText: 'Cada uno con su vaso servido. Los sorbos que te toquen los tomas cuando quieras.',

    // modos (C-5)
    modeLocal: '📱 Un celular', modeLocalHint: 'Se pasan el celular y cada uno mira sus cartas a escondidas.',
    modeOnline: '📡 Varios celulares', modeOnlineHint: 'Cada uno juega en su celular y ve solo sus cartas.',
    modeCpu: '🤖 Contra el celular', modeCpuHint: 'Juegas contra 1 a 5 rivales del celular, que no ven tus cartas.',

    // configuración
    playerPlaceholder: 'Jugador {n}', removePlayer: 'Quitar jugador', addPlayer: '+ Agregar jugador',
    start: '¡A jugar!', yourName: 'Tu nombre', cpuName: 'Celular', cpuNameN: 'Celular {n}',
    handsLabel: '¿Cuántas manos?', handsHint: 'Al terminar todas las manos gana quien tomó menos.',
    handsOption: '{n} manos',
    rivalsLabel: '¿Cuántos rivales?', rivalsHint: 'Con más rivales cuesta más hacer dos bazas y el plato es más grande.',
    rivalsOption: '{n} rivales', rivalsOne: '1 rival',
    errMin: 'Se necesitan al menos {n} jugadores.', errNames: 'Todos los jugadores necesitan un nombre.',
    errDup: 'Hay nombres repetidos. Pónganse apodos.',
    errName: 'Escribe tu nombre.', errCode: 'El código son cuatro letras.',

    // sala (C-7)
    setupOnline: 'Sala de Julepe', invitedTitle: '¡Invitado a jugar!',
    invitedHint: 'Escribe tu nombre y entra. La partida la arma quien creó la sala.',
    yourNameLabel: 'Tu nombre', create: '🍹 Crear sala', join: 'Unirse',
    joinTitle: '¿Te pasaron un código?', codePlaceholder: 'CÓDIGO', invited: '📩 Sala {code}',
    lobbyCode: 'Código', lobbyShare: 'Dile el código al resto o que escaneen el QR.',
    lobbyPlayers: 'En la sala', lobbyStart: '¡A jugar!', lobbyNeedMore: 'Faltan jugadores',
    lobbyWaitHost: 'Esperando a que {name} parta la partida',
    lobbyCancel: 'Cancelar la sala', lobbyLeave: 'Salir de la sala',
    shareLink: '📤 Compartir link', copyLink: '📋 Copiar link', copied: '¡Copiado!',
    rematch: '🔁 Revancha', changeMode: 'Cambiar de modo',

    // fallas de sala (C-14)
    errNotFound: 'No existe esa sala. Revisa el código.', errFull: 'La sala ya está llena.',
    errExpired: 'Esa sala ya venció.', errOtherGame: 'Ese código es de otro juego.',
    errNet: 'No se pudo conectar. ¿Hay internet?',
    errOffline: 'No se pudo abrir la sala. Puede ser tu internet o que haya mucha gente jugando. Intenta nuevamente en unos minutos o juega en modo de un solo celular sin conexión a internet.',
    errTooMany: 'Abriste muchas salas seguidas. Espera un ratito y prueba de nuevo.',
    errSecure: 'Para jugar en varios celulares hace falta una conexión segura (https).',

    // chat de sala (C-15)
    chatTitle: 'Chat de la sala', chatOpen: 'Abrir el chat', chatClose: 'Cerrar el chat', chatSend: 'Enviar',
    chatPlaceholder: 'Escribe algo…', chatEmpty: 'Acá pueden picarse mientras se reparten los sorbos. Se borra cuando termina la sala.',

    // memoria de partida (C-6)
    resumeTitle: '⏯ Hay una partida a medias', resumeText: 'Mano {n}. El plato tiene {plato} sorbos.',
    resume: 'Continuar', delete: 'Borrar',

    rules: [
      'Cuando el plato está vacío, cada uno pone <b>dos sorbos</b> en él.',
      'Se reparten cinco cartas a cada uno y se da vuelta otra: su palo es el <b>triunfo</b> y le gana a los demás palos.',
      'Por turno, desde la derecha de quien repartió, cada uno dice si <b>va</b> o <b>se pasa</b>. Pasarse no cuesta nada.',
      'Ir es comprometerse a ganar <b>dos bazas</b> de las cinco. Si va uno solo, quien repartió queda obligado a jugar.',
      'Los que van cambian hasta tres cartas y se juegan las cinco bazas.',
      'Hay que tirar del palo de salida y, si se puede, más alto que la mayor de ese palo en la mesa. Sin ese palo, hay que tirar triunfo.',
      'Quien fue y ganó dos bazas o más se salva y <b>reparte dos sorbos por baza</b> entre los demás.',
      'Quien fue y no ganó dos bazas <b>se toma el plato entero</b>: eso es el julepe. El plato pasa a la mano siguiente una vez por cada julepeado.',
    ],

    // la mesa
    potLabel: 'El plato', potSips: '{n} sorbos', potOne: '1 sorbo',
    potKept: 'El plato sigue acumulado',
    handOf: 'Mano {n} de {total}', trumpLabel: 'Triunfo', dealerIs: 'Reparte {name}',
    turnOf: 'Le toca a {name}', yourTurn: '¡Te toca!', waitingFor: 'Esperando a {name}…',
    dealing: 'Repartiendo…', yourCards: 'Tus cartas', tricksLabel: 'Bazas', cardOf: '{rank} de {suit}',

    // declaración
    declareTitle: '¿Vas o te pasas?',
    declareHint: 'Si vas, necesitas dos bazas o te tomas el plato entero.',
    goDo: '¡Voy!', passDo: 'Me paso',
    declWent: 'va', declPassed: 'se pasó', declForced: 'obligado', declThinking: 'decidiendo…',
    allPassedTitle: 'Se pasaron todos',
    allPassedText: 'Nadie quiso jugar esta mano. El plato queda acumulado y reparte {name}.',

    // cambio
    changeTitle: 'Cambia hasta tres cartas',
    changeHint: 'Toca las que quieras soltar y te llegan otras tantas.',
    changeDo: 'Cambiar {n}', changeOne: 'Cambiar 1 carta', changeKeep: 'Me quedo con estas',
    changedSome: '{name} cambió {n} cartas', changedOne: '{name} cambió 1 carta', changedNone: '{name} se quedó con las suyas',

    // bazas
    trickOf: 'Baza {n} de 5', pickCard: 'Elige una carta', playDo: 'Tirar {card}',
    lockedWhy: 'Las cartas apagadas no se pueden tirar: {why}',
    whyFollow: 'hay que tirar del palo de salida', whyTop: 'hay que tirar más alto que la mayor del palo de salida',
    whyTrump: 'sin el palo de salida, hay que tirar triunfo',
    trickWon: 'La baza es de {name}', trickWonYou: '¡La baza es tuya!',
    opensTrick: '{name} abre la baza', opensTrickYou: 'Abres tú la baza',

    // reparto de sorbos
    giveTitle: 'Te salvaste: reparte {n} sorbos',
    giveLeft: 'Te quedan {n} sorbos por repartir', giveLeftOne: 'Te queda 1 sorbo por repartir',
    giveDone: 'Listo, confirma abajo', giveDo: '¡Repartidos!',
    giveWait: '{name} está repartiendo sus sorbos…',
    gaveLine: '{name} le pasó {n} sorbos a {to}',

    // cierre de la mano
    handOverTitle: 'Se acabó la mano',
    julepeTitle: '¡JULEPE!', julepeYou: 'No llegaste a dos bazas: te tomas el plato entero.',
    julepeOther: '{name} no llegó a dos bazas y se toma el plato entero.',
    julepeBoth: '{names} no llegaron a dos bazas y se toman el plato entero, cada uno.',
    drinksNow: '{n} sorbos', savedTitle: '¡Todos se salvaron!',
    savedText: 'Nadie se julepeó, así que el plato se vacía.',
    potNext: 'El plato de la próxima mano: {n} sorbos',
    tricksOf: '{n} bazas', tricksOfOne: '1 baza', tricksNone: 'ninguna baza',
    goOn: 'Toca para seguir',
    sealVerified: 'Cartas verificadas ✅', sealBad: '⚠️ Las cartas de {name} no cuadran',
    sealWait: 'Faltan cartas por destapar', sealOpen: 'Sin sobres: en esta sala las cartas viajan a la vista',
    showHand: 'Lo que tenía cada uno',

    // pase del celular (C-9)
    hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!',
    coverLabel: 'Que nadie más mire. Las cartas son de', coverTap: 'Ver mis cartas',

    // final
    winner: '¡Ganó {name}, que tomó menos que nadie!', winnerYou: '¡Ganaste! Terminaste más seco que nadie.',
    loserYou: 'Ganó {name}. Tú tomaste más.', winnerTie: '¡Empate entre {names}!',
    endStats: '{manos} manos jugadas', endSips: 'Sorbos de la noche (aprox.)',
    sipsOf: '{n} sorbos', julepesOf: '{n} julepes',
    endAgain: '¡Otra partida!', changePlayers: 'Cambiar jugadores', backMenu: 'Volver al menú',
    histHand: 'Mano {n}', histVoid: 'Se pasaron todos', histPot: 'plato de {n}',
    histJulepe: 'julepe: {names}', histSaved: 'se salvó {names}',
  },
};

/* ================================================================== */
/* ENGLISH                                                             */
/* ================================================================== */
const EN = {
  paloNames: { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' },
  rankNames: { A: 'ace', K: 'king', Q: 'queen', J: 'jack' },
  ui: {
    docTitle: 'Julep 🍹 · Party Games', gameChip: '🍹 Julep', menu: '‹ Menu',
    title: 'Julep', lead: 'If you go in and don\'t win two of the five tricks, you drink the whole pot.',
    leadExplain: 'A game has several hands. Each hand is five tricks of one card per player.',
    rulesSummary: '🍹 How do you play?',
    whoPlays: 'Who is playing?',
    setupHint: 'Sign up in the order you are sitting, going to the right.',
    lobbyTitle: 'Room created', historyTitle: '🍹 Hand by hand',
    beforeTitle: '🍹 Before you start',
    beforeText: 'Everyone with a full glass. You take the sips you get whenever you want.',

    modeLocal: '📱 One phone', modeLocalHint: 'Pass the phone around and each player peeks at their cards in secret.',
    modeOnline: '📡 Several phones', modeOnlineHint: 'Everyone plays on their own phone and sees only their own cards.',
    modeCpu: '🤖 Versus the phone', modeCpuHint: 'You play against 1 to 5 rivals on the phone, who can\'t see your cards.',

    playerPlaceholder: 'Player {n}', removePlayer: 'Remove player', addPlayer: '+ Add player',
    start: 'Deal me in!', yourName: 'Your name', cpuName: 'Phone', cpuNameN: 'Phone {n}',
    handsLabel: 'How many hands?', handsHint: 'When all the hands are over, whoever drank the least wins.',
    handsOption: '{n} hands',
    rivalsLabel: 'How many rivals?', rivalsHint: 'With more rivals two tricks are harder and the pot is bigger.',
    rivalsOption: '{n} rivals', rivalsOne: '1 rival',
    errMin: 'You need at least {n} players.', errNames: 'Every player needs a name.',
    errDup: 'Some names are repeated. Use nicknames.',
    errName: 'Type your name.', errCode: 'The code is four letters.',

    setupOnline: 'Julep room', invitedTitle: 'You were invited!',
    invitedHint: 'Type your name and join. Whoever created the room sets the game up.',
    yourNameLabel: 'Your name', create: '🍹 Create room', join: 'Join',
    joinTitle: 'Got a code?', codePlaceholder: 'CODE', invited: '📩 Room {code}',
    lobbyCode: 'Code', lobbyShare: 'Read the code out or let them scan the QR.',
    lobbyPlayers: 'In the room', lobbyStart: 'Start!', lobbyNeedMore: 'Waiting for players',
    lobbyWaitHost: 'Waiting for {name} to start the game',
    lobbyCancel: 'Cancel the room', lobbyLeave: 'Leave the room',
    shareLink: '📤 Share link', copyLink: '📋 Copy link', copied: 'Copied!',
    rematch: '🔁 Rematch', changeMode: 'Change mode',

    errNotFound: 'No such room. Check the code.', errFull: 'That room is full.',
    errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.',
    errNet: 'Could not connect. Is there internet?',
    errOffline: 'The room could not be opened. It may be your internet or too many people playing. Try again in a few minutes or play in the one phone mode, which needs no internet.',
    errTooMany: 'You opened too many rooms in a row. Wait a bit and try again.',
    errSecure: 'Playing on several phones needs a secure connection (https).',

    chatTitle: 'Room chat', chatOpen: 'Open the chat', chatClose: 'Close the chat', chatSend: 'Send',
    chatPlaceholder: 'Say something…', chatEmpty: 'Talk trash here while the sips get handed out. It disappears with the room.',

    resumeTitle: '⏯ There is a game in progress', resumeText: 'Hand {n}. The pot holds {plato} sips.',
    resume: 'Continue', delete: 'Delete',

    rules: [
      'When the pot is empty, everyone puts <b>two sips</b> into it.',
      'Five cards each, and one more is turned face up: its suit is <b>trump</b> and beats the other suits.',
      'Taking turns, starting to the right of the dealer, everyone says whether they are <b>in</b> or <b>out</b>. Folding costs nothing.',
      'Going in means committing to win <b>two tricks</b> out of five. If only one player goes in, the dealer has to play.',
      'Whoever is in swaps up to three cards, and the five tricks are played.',
      'You must play the suit led and, if you can, higher than the highest card of that suit on the table. With none of that suit, you must play trump.',
      'Whoever went in and won two tricks or more is safe and <b>hands out two sips per trick</b> to the others.',
      'Whoever went in and didn\'t win two tricks <b>drinks the whole pot</b>: that is a julep. The pot carries over to the next hand once for each player who got juleped.',
    ],

    potLabel: 'The pot', potSips: '{n} sips', potOne: '1 sip',
    potKept: 'The pot is still stacked up',
    handOf: 'Hand {n} of {total}', trumpLabel: 'Trump', dealerIs: '{name} deals',
    turnOf: '{name}\'s turn', yourTurn: 'Your turn!', waitingFor: 'Waiting for {name}…',
    dealing: 'Dealing…', yourCards: 'Your cards', tricksLabel: 'Tricks', cardOf: '{rank} of {suit}',

    declareTitle: 'Are you in or out?',
    declareHint: 'If you go in, you need two tricks or you drink the whole pot.',
    goDo: 'I am in!', passDo: 'I am out',
    declWent: 'in', declPassed: 'out', declForced: 'dragged in', declThinking: 'deciding…',
    allPassedTitle: 'Everybody folded',
    allPassedText: 'Nobody wanted this hand. The pot stays where it is and {name} deals.',

    changeTitle: 'Swap up to three cards',
    changeHint: 'Tap the ones you want to drop and you get the same number back.',
    changeDo: 'Swap {n}', changeOne: 'Swap 1 card', changeKeep: 'I will keep these',
    changedSome: '{name} swapped {n} cards', changedOne: '{name} swapped 1 card', changedNone: '{name} kept their cards',

    trickOf: 'Trick {n} of 5', pickCard: 'Pick a card', playDo: 'Play {card}',
    lockedWhy: 'The dimmed cards cannot be played: {why}',
    whyFollow: 'you have to play the suit led', whyTop: 'you have to play higher than the highest card of the suit led',
    whyTrump: 'with none of the suit led, you have to play trump',
    trickWon: 'The trick goes to {name}', trickWonYou: 'The trick is yours!',
    opensTrick: '{name} leads', opensTrickYou: 'You lead',

    giveTitle: 'You are safe: hand out {n} sips',
    giveLeft: '{n} sips left to hand out', giveLeftOne: '1 sip left to hand out',
    giveDone: 'Done, confirm below', giveDo: 'Handed out!',
    giveWait: '{name} is handing out sips…',
    gaveLine: '{name} passed {n} sips to {to}',

    handOverTitle: 'Hand over',
    julepeTitle: 'JULEP!', julepeYou: 'You fell short of two tricks: you drink the whole pot.',
    julepeOther: '{name} fell short of two tricks and drinks the whole pot.',
    julepeBoth: '{names} fell short of two tricks and each drinks the whole pot.',
    drinksNow: '{n} sips', savedTitle: 'Everybody made it!',
    savedText: 'Nobody got juleped, so the pot empties out.',
    potNext: 'Next hand\'s pot: {n} sips',
    tricksOf: '{n} tricks', tricksOfOne: '1 trick', tricksNone: 'no tricks',
    goOn: 'Tap to carry on',
    sealVerified: 'Cards verified ✅', sealBad: '⚠️ {name}\'s cards do not add up',
    sealWait: 'Some hands are still face down', sealOpen: 'No sealed deal: in this room the cards travel in the open',
    showHand: 'What everyone had',

    hoPass: 'Pass the phone to', hoReady: 'Got it, that is me!',
    coverLabel: 'Nobody else look. These cards belong to', coverTap: 'See my cards',

    winner: '{name} wins, having drunk the least!', winnerYou: 'You win! You finished drier than anyone.',
    loserYou: '{name} wins. You drank more.', winnerTie: 'It is a tie between {names}!',
    endStats: '{manos} hands played', endSips: 'Sips tonight (roughly)',
    sipsOf: '{n} sips', julepesOf: '{n} juleps',
    endAgain: 'Another game!', changePlayers: 'Change players', backMenu: 'Back to menu',
    histHand: 'Hand {n}', histVoid: 'everybody folded', histPot: 'pot of {n}',
    histJulepe: 'julep: {names}', histSaved: '{names} made it',
  },
};

/* ================================================================== */
/* PORTUGUÊS (Brasil)                                                  */
/* ================================================================== */
const PT = {
  paloNames: { '♠': 'espadas', '♥': 'copas', '♦': 'ouros', '♣': 'paus' },
  rankNames: { A: 'ás', K: 'rei', Q: 'dama', J: 'valete' },
  ui: {
    docTitle: 'Paga o Bolo 🍹 · Jogos de Salão', gameChip: '🍹 Paga o Bolo', menu: '‹ Menu',
    title: 'Paga o Bolo', lead: 'Se entrar e não fizer duas das cinco vazas, você bebe o bolo inteiro.',
    leadExplain: 'Uma partida tem várias mãos. Em cada mão se jogam cinco vazas de uma carta por jogador.',
    rulesSummary: '🍹 Como se joga?',
    whoPlays: 'Quem vai jogar?',
    setupHint: 'Se anotem na ordem em que estão sentados, para a direita.',
    lobbyTitle: 'Sala criada', historyTitle: '🍹 Mão por mão',
    beforeTitle: '🍹 Antes de começar',
    beforeText: 'Cada um com seu copo servido. Os goles que couberem a você, você toma quando quiser.',

    modeLocal: '📱 Um celular', modeLocalHint: 'Vocês passam o celular e cada um olha suas cartas escondido.',
    modeOnline: '📡 Vários celulares', modeOnlineHint: 'Cada um joga no seu celular e vê só as suas cartas.',
    modeCpu: '🤖 Contra o celular', modeCpuHint: 'Você joga contra 1 a 5 rivais do celular, que não veem suas cartas.',

    playerPlaceholder: 'Jogador {n}', removePlayer: 'Tirar jogador', addPlayer: '+ Adicionar jogador',
    start: 'Bora jogar!', yourName: 'Seu nome', cpuName: 'Celular', cpuNameN: 'Celular {n}',
    handsLabel: 'Quantas mãos?', handsHint: 'Ao terminar todas as mãos, ganha quem bebeu menos.',
    handsOption: '{n} mãos',
    rivalsLabel: 'Quantos rivais?', rivalsHint: 'Com mais rivais é mais difícil fazer duas vazas e o bolo é maior.',
    rivalsOption: '{n} rivais', rivalsOne: '1 rival',
    errMin: 'São necessários pelo menos {n} jogadores.', errNames: 'Todo jogador precisa de um nome.',
    errDup: 'Tem nomes repetidos. Botem apelidos.',
    errName: 'Escreva seu nome.', errCode: 'O código são quatro letras.',

    setupOnline: 'Sala de Paga o Bolo', invitedTitle: 'Você foi convidado!',
    invitedHint: 'Escreva seu nome e entre. Quem criou a sala é que monta a partida.',
    yourNameLabel: 'Seu nome', create: '🍹 Criar sala', join: 'Entrar',
    joinTitle: 'Te passaram um código?', codePlaceholder: 'CÓDIGO', invited: '📩 Sala {code}',
    lobbyCode: 'Código', lobbyShare: 'Fala o código pro resto ou deixa escanearem o QR.',
    lobbyPlayers: 'Na sala', lobbyStart: 'Bora!', lobbyNeedMore: 'Faltam jogadores',
    lobbyWaitHost: 'Esperando {name} começar a partida',
    lobbyCancel: 'Cancelar a sala', lobbyLeave: 'Sair da sala',
    shareLink: '📤 Compartilhar link', copyLink: '📋 Copiar link', copied: 'Copiado!',
    rematch: '🔁 Revanche', changeMode: 'Mudar de modo',

    errNotFound: 'Essa sala não existe. Confere o código.', errFull: 'A sala já está cheia.',
    errExpired: 'Essa sala já venceu.', errOtherGame: 'Esse código é de outro jogo.',
    errNet: 'Não deu pra conectar. Tem internet?',
    errOffline: 'Não deu pra abrir a sala. Pode ser sua internet ou muita gente jogando. Tente novamente em alguns minutos ou jogue no modo de um celular só, que não precisa de internet.',
    errTooMany: 'Você abriu muitas salas seguidas. Espera um pouquinho e tenta de novo.',
    errSecure: 'Pra jogar em vários celulares precisa de uma conexão segura (https).',

    chatTitle: 'Chat da sala', chatOpen: 'Abrir o chat', chatClose: 'Fechar o chat', chatSend: 'Enviar',
    chatPlaceholder: 'Escreve algo…', chatEmpty: 'Zoem aqui enquanto os goles rolam. Some junto com a sala.',

    resumeTitle: '⏯ Tem uma partida pela metade', resumeText: 'Mão {n}. O bolo está com {plato} goles.',
    resume: 'Continuar', delete: 'Apagar',

    rules: [
      'Quando o bolo está vazio, cada um bota <b>dois goles</b> nele.',
      'Cinco cartas pra cada um e mais uma virada: o naipe dela é o <b>trunfo</b> e ganha dos outros naipes.',
      'Na sua vez, a partir da direita de quem deu as cartas, cada um diz se <b>entra</b> ou <b>passa</b>. Passar não custa nada.',
      'Entrar é se comprometer a fazer <b>duas vazas</b> das cinco. Se entrar um só, quem deu as cartas é obrigado a jogar.',
      'Quem entrou troca até três cartas e se jogam as cinco vazas.',
      'Tem que jogar do naipe da saída e, se puder, mais alto que a maior desse naipe na mesa. Sem esse naipe, tem que trunfar.',
      'Quem entrou e fez duas vazas ou mais se salva e <b>distribui dois goles por vaza</b> entre os outros.',
      'Quem entrou e não fez duas vazas <b>bebe o bolo inteiro</b>: isso é pagar o bolo. O bolo passa para a mão seguinte uma vez por cada um que pagou.',
    ],

    potLabel: 'O bolo', potSips: '{n} goles', potOne: '1 gole',
    potKept: 'O bolo continua acumulado',
    handOf: 'Mão {n} de {total}', trumpLabel: 'Trunfo', dealerIs: 'Quem dá é {name}',
    turnOf: 'É a vez de {name}', yourTurn: 'É a sua vez!', waitingFor: 'Esperando {name}…',
    dealing: 'Distribuindo…', yourCards: 'Suas cartas', tricksLabel: 'Vazas', cardOf: '{rank} de {suit}',

    declareTitle: 'Entra ou passa?',
    declareHint: 'Se entrar, precisa de duas vazas ou bebe o bolo inteiro.',
    goDo: 'Entro!', passDo: 'Passo',
    declWent: 'entrou', declPassed: 'passou', declForced: 'obrigado', declThinking: 'decidindo…',
    allPassedTitle: 'Passou geral',
    allPassedText: 'Ninguém quis essa mão. O bolo fica acumulado e quem dá é {name}.',

    changeTitle: 'Troque até três cartas',
    changeHint: 'Toque nas que quiser largar e você recebe a mesma quantidade.',
    changeDo: 'Trocar {n}', changeOne: 'Trocar 1 carta', changeKeep: 'Fico com essas',
    changedSome: '{name} trocou {n} cartas', changedOne: '{name} trocou 1 carta', changedNone: '{name} ficou com as dela',

    trickOf: 'Vaza {n} de 5', pickCard: 'Escolha uma carta', playDo: 'Jogar {card}',
    lockedWhy: 'As cartas apagadas não podem ser jogadas: {why}',
    whyFollow: 'tem que jogar do naipe da saída', whyTop: 'tem que jogar mais alto que a maior do naipe da saída',
    whyTrump: 'sem o naipe da saída, tem que trunfar',
    trickWon: 'A vaza é de {name}', trickWonYou: 'A vaza é sua!',
    opensTrick: '{name} sai', opensTrickYou: 'Você sai',

    giveTitle: 'Você se salvou: distribua {n} goles',
    giveLeft: 'Faltam {n} goles pra distribuir', giveLeftOne: 'Falta 1 gole pra distribuir',
    giveDone: 'Pronto, confirme embaixo', giveDo: 'Distribuídos!',
    giveWait: '{name} está distribuindo os goles…',
    gaveLine: '{name} passou {n} goles pra {to}',

    handOverTitle: 'Acabou a mão',
    julepeTitle: 'PAGOU O BOLO!', julepeYou: 'Você não chegou a duas vazas: bebe o bolo inteiro.',
    julepeOther: '{name} não chegou a duas vazas e bebe o bolo inteiro.',
    julepeBoth: '{names} não chegaram a duas vazas e cada um bebe o bolo inteiro.',
    drinksNow: '{n} goles', savedTitle: 'Todo mundo se salvou!',
    savedText: 'Ninguém pagou o bolo, então ele zera.',
    potNext: 'O bolo da próxima mão: {n} goles',
    tricksOf: '{n} vazas', tricksOfOne: '1 vaza', tricksNone: 'nenhuma vaza',
    goOn: 'Toque pra seguir',
    sealVerified: 'Cartas verificadas ✅', sealBad: '⚠️ As cartas de {name} não batem',
    sealWait: 'Ainda faltam mãos pra virar', sealOpen: 'Sem lacre: nesta sala as cartas viajam à vista',
    showHand: 'O que cada um tinha',

    hoPass: 'Passe o celular pra', hoReady: 'Pronto, sou eu!',
    coverLabel: 'Ninguém mais olhe. As cartas são de', coverTap: 'Ver minhas cartas',

    winner: '{name} ganhou, bebeu menos que todo mundo!', winnerYou: 'Você ganhou! Terminou mais seco que todos.',
    loserYou: '{name} ganhou. Você bebeu mais.', winnerTie: 'Deu empate entre {names}!',
    endStats: '{manos} mãos jogadas', endSips: 'Goles da noite (mais ou menos)',
    sipsOf: '{n} goles', julepesOf: '{n} bolos pagos',
    endAgain: 'Outra partida!', changePlayers: 'Mudar jogadores', backMenu: 'Voltar ao menu',
    histHand: 'Mão {n}', histVoid: 'passou geral', histPot: 'bolo de {n}',
    histJulepe: 'pagou o bolo: {names}', histSaved: '{names} se salvou',
  },
};

/* ================================================================== */
/* DEUTSCH                                                             */
/* ================================================================== */
const DE = {
  paloNames: { '♠': 'Pik', '♥': 'Herz', '♦': 'Karo', '♣': 'Kreuz' },
  rankNames: { A: 'Ass', K: 'König', Q: 'Dame', J: 'Bube' },
  ui: {
    docTitle: 'Julepe 🍹 · Salonspiele', gameChip: '🍹 Julepe', menu: '‹ Menü',
    title: 'Julepe', lead: 'Wenn du mitgehst und keine zwei der fünf Stiche holst, trinkst du den ganzen Topf.',
    leadExplain: 'Ein Spiel hat mehrere Runden. In jeder Runde gibt es fünf Stiche, je eine Karte pro Spieler.',
    rulesSummary: '🍹 Wie spielt man?',
    whoPlays: 'Wer spielt mit?',
    setupHint: 'Tragt euch in der Sitzreihenfolge ein, nach rechts herum.',
    lobbyTitle: 'Raum erstellt', historyTitle: '🍹 Runde für Runde',
    beforeTitle: '🍹 Bevor es losgeht',
    beforeText: 'Jeder mit vollem Glas. Deine Schlucke trinkst du, wann du willst.',

    modeLocal: '📱 Ein Handy', modeLocalHint: 'Ihr gebt das Handy herum und jeder schaut heimlich auf seine Karten.',
    modeOnline: '📡 Mehrere Handys', modeOnlineHint: 'Jeder spielt auf seinem Handy und sieht nur seine Karten.',
    modeCpu: '🤖 Gegen das Handy', modeCpuHint: 'Du spielst gegen 1 bis 5 Gegner im Handy, die deine Karten nicht sehen.',

    playerPlaceholder: 'Spieler {n}', removePlayer: 'Spieler entfernen', addPlayer: '+ Spieler hinzufügen',
    start: 'Los geht’s!', yourName: 'Dein Name', cpuName: 'Handy', cpuNameN: 'Handy {n}',
    handsLabel: 'Wie viele Runden?', handsHint: 'Nach der letzten Runde gewinnt, wer am wenigsten getrunken hat.',
    handsOption: '{n} Runden',
    rivalsLabel: 'Wie viele Gegner?', rivalsHint: 'Mit mehr Gegnern sind zwei Stiche schwerer und der Topf wird größer.',
    rivalsOption: '{n} Gegner', rivalsOne: '1 Gegner',
    errMin: 'Ihr braucht mindestens {n} Spieler.', errNames: 'Alle Spieler brauchen einen Namen.',
    errDup: 'Manche Namen sind doppelt. Nehmt Spitznamen.',
    errName: 'Gib deinen Namen ein.', errCode: 'Der Code hat vier Buchstaben.',

    setupOnline: 'Julepe-Raum', invitedTitle: 'Du bist eingeladen!',
    invitedHint: 'Gib deinen Namen ein und komm rein. Wer den Raum erstellt hat, startet das Spiel.',
    yourNameLabel: 'Dein Name', create: '🍹 Raum erstellen', join: 'Beitreten',
    joinTitle: 'Hast du einen Code?', codePlaceholder: 'CODE', invited: '📩 Raum {code}',
    lobbyCode: 'Code', lobbyShare: 'Sag den anderen den Code oder lass sie den QR-Code scannen.',
    lobbyPlayers: 'Im Raum', lobbyStart: 'Los geht’s!', lobbyNeedMore: 'Zu wenig Spieler',
    lobbyWaitHost: 'Warte, bis {name} das Spiel startet',
    lobbyCancel: 'Raum auflösen', lobbyLeave: 'Raum verlassen',
    shareLink: '📤 Link teilen', copyLink: '📋 Link kopieren', copied: 'Kopiert!',
    rematch: '🔁 Revanche', changeMode: 'Modus wechseln',

    errNotFound: 'Diesen Raum gibt es nicht. Prüf den Code.', errFull: 'Der Raum ist schon voll.',
    errExpired: 'Dieser Raum ist abgelaufen.', errOtherGame: 'Dieser Code gehört zu einem anderen Spiel.',
    errNet: 'Keine Verbindung. Hast du Internet?',
    errOffline: 'Der Raum ließ sich nicht öffnen. Vielleicht liegt es an deinem Internet oder es spielen gerade sehr viele. Versuch es in ein paar Minuten nochmal oder spiel auf einem Handy ganz ohne Internet.',
    errTooMany: 'Du hast zu viele Räume hintereinander geöffnet. Warte kurz und versuch es nochmal.',
    errSecure: 'Für mehrere Handys braucht es eine sichere Verbindung (https).',

    chatTitle: 'Raum-Chat', chatOpen: 'Chat öffnen', chatClose: 'Chat schließen', chatSend: 'Senden',
    chatPlaceholder: 'Schreib was…', chatEmpty: 'Hier dürft ihr euch necken, während die Schlucke verteilt werden. Alles wird gelöscht, wenn der Raum endet.',

    resumeTitle: '⏯ Da ist noch ein Spiel offen', resumeText: 'Runde {n}. Im Topf sind {plato} Schlucke.',
    resume: 'Weiter', delete: 'Löschen',

    rules: [
      'Wenn der Topf leer ist, gibt jeder <b>zwei Schlucke</b> hinein.',
      'Jeder bekommt fünf Karten und eine weitere wird aufgedeckt: Ihre Farbe ist <b>Trumpf</b> und sticht alle anderen Farben.',
      'Reihum, rechts vom Geber beginnend, sagt jeder, ob er <b>mitgeht</b> oder <b>passt</b>. Passen kostet nichts.',
      'Mitgehen heißt, du musst <b>zwei der fünf Stiche</b> holen. Geht nur einer mit, muss der Geber mitspielen.',
      'Wer mitgeht, tauscht bis zu drei Karten, dann werden die fünf Stiche gespielt.',
      'Du musst die ausgespielte Farbe bedienen und, wenn möglich, höher als die höchste Karte dieser Farbe auf dem Tisch. Hast du die Farbe nicht, musst du Trumpf spielen.',
      'Wer mitging und zwei Stiche oder mehr holt, ist gerettet und <b>verteilt zwei Schlucke pro Stich</b> an die anderen.',
      'Wer mitging und keine zwei Stiche holt, <b>trinkt den ganzen Topf</b>: Das ist der Julepe. Der Topf wandert in die nächste Runde, einmal für jeden, den es erwischt hat.',
    ],

    potLabel: 'Der Topf', potSips: '{n} Schlucke', potOne: '1 Schluck',
    potKept: 'Der Topf bleibt stehen',
    handOf: 'Runde {n} von {total}', trumpLabel: 'Trumpf', dealerIs: '{name} gibt',
    turnOf: '{name} ist dran', yourTurn: 'Du bist dran!', waitingFor: 'Warte auf {name}…',
    dealing: 'Karten werden verteilt…', yourCards: 'Deine Karten', tricksLabel: 'Stiche', cardOf: '{suit} {rank}',

    declareTitle: 'Gehst du mit oder passt du?',
    declareHint: 'Wenn du mitgehst, brauchst du zwei Stiche, sonst trinkst du den ganzen Topf.',
    goDo: 'Ich geh mit!', passDo: 'Ich passe',
    declWent: 'geht mit', declPassed: 'passt', declForced: 'muss mit', declThinking: 'überlegt…',
    allPassedTitle: 'Alle haben gepasst',
    allPassedText: 'Niemand wollte diese Runde spielen. Der Topf bleibt stehen und {name} gibt.',

    changeTitle: 'Tausch bis zu drei Karten',
    changeHint: 'Tippe die Karten an, die du loswerden willst, und du bekommst gleich viele neue.',
    changeDo: '{n} tauschen', changeOne: '1 Karte tauschen', changeKeep: 'Ich behalte sie',
    changedSome: '{name} hat {n} Karten getauscht', changedOne: '{name} hat 1 Karte getauscht', changedNone: '{name} behält die eigenen Karten',

    trickOf: 'Stich {n} von 5', pickCard: 'Wähle eine Karte', playDo: '{card} spielen',
    lockedWhy: 'Die grauen Karten darfst du nicht spielen: {why}',
    whyFollow: 'du musst die ausgespielte Farbe bedienen', whyTop: 'du musst höher spielen als die höchste Karte der ausgespielten Farbe',
    whyTrump: 'ohne die ausgespielte Farbe musst du Trumpf spielen',
    trickWon: 'Der Stich geht an {name}', trickWonYou: 'Der Stich gehört dir!',
    opensTrick: '{name} spielt aus', opensTrickYou: 'Du spielst aus',

    giveTitle: 'Gerettet: Verteile {n} Schlucke',
    giveLeft: 'Noch {n} Schlucke zu verteilen', giveLeftOne: 'Noch 1 Schluck zu verteilen',
    giveDone: 'Fertig, bestätige unten', giveDo: 'Verteilt!',
    giveWait: '{name} verteilt gerade Schlucke…',
    gaveLine: '{name} gab {to} {n} Schlucke',

    handOverTitle: 'Runde vorbei',
    julepeTitle: 'JULEPE!', julepeYou: 'Keine zwei Stiche: Du trinkst den ganzen Topf.',
    julepeOther: '{name} hat keine zwei Stiche und trinkt den ganzen Topf.',
    julepeBoth: '{names} haben keine zwei Stiche und trinken jeweils den ganzen Topf.',
    drinksNow: '{n} Schlucke', savedTitle: 'Alle gerettet!',
    savedText: 'Niemanden hat es erwischt, also wird der Topf geleert.',
    potNext: 'Topf für die nächste Runde: {n} Schlucke',
    tricksOf: '{n} Stiche', tricksOfOne: '1 Stich', tricksNone: 'kein Stich',
    goOn: 'Tippen für weiter',
    sealVerified: 'Karten geprüft ✅', sealBad: '⚠️ Die Karten von {name} stimmen nicht',
    sealWait: 'Noch nicht alle Karten aufgedeckt', sealOpen: 'Ohne Umschläge: In diesem Raum gehen die Karten offen herum',
    showHand: 'Was jeder auf der Hand hatte',

    hoPass: 'Gib das Handy an', hoReady: 'Okay, das bin ich!',
    coverLabel: 'Alle anderen wegschauen. Das sind die Karten von', coverTap: 'Meine Karten',

    winner: '{name} gewinnt und hat am wenigsten getrunken!', winnerYou: 'Du gewinnst! Keiner blieb trockener als du.',
    loserYou: '{name} gewinnt. Du hast mehr getrunken.', winnerTie: 'Unentschieden zwischen {names}!',
    endStats: '{manos} Runden gespielt', endSips: 'Schlucke heute Abend (ca.)',
    sipsOf: '{n} Schlucke', julepesOf: '{n}× Julepe',
    endAgain: 'Noch ein Spiel!', changePlayers: 'Spieler ändern', backMenu: 'Zurück zum Menü',
    histHand: 'Runde {n}', histVoid: 'alle gepasst', histPot: 'Topf mit {n}',
    histJulepe: 'Julepe: {names}', histSaved: 'gerettet: {names}',
  },
};

export const LOCALES = { es: ES, en: EN, pt: PT, de: DE };
