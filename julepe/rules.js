/**
 * Julepe — datos y textos en español, inglés y portugués.
 * Solo datos, sin lógica. Ver docs/juegos/julepe.md.
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
    title: 'Julepe', lead: 'Ves tus cartas y decides en secreto si vas o pasas. Si vas y no ganas dos de las cinco tiradas, te tomas todos los tragos.',
    leadExplain: 'Una partida tiene varios juegos. Cada juego tiene 5 tiradas: en cada tirada todos juegan una carta. Un turno es cuando te toca a ti jugar.',
    rulesSummary: '🍹 ¿Cómo se juega?',
    whoPlays: '¿Quiénes juegan?',
    setupHint: 'Anótense en el orden en que están sentados. El reparto va rotando hacia la derecha.',
    lobbyTitle: 'Sala creada', historyTitle: '🍹 Mano por mano',
    beforeTitle: '🍹 Antes de partir',
    beforeText: 'Cada uno empieza con su vaso servido. El juego reparte sorbos: si te toca tomarte 20, son 20 sorbos, no un vaso. Los puedes tomar durante el juego y no necesariamente en un turno.',

    // modos (C-5)
    modeLocal: '📱 Un celular', modeLocalHint: 'Juegan entre 2 y 6 personas. Se pasan el celular y cada uno mira sus cartas sin mostrarlas al resto.',
    modeOnline: '📡 Varios celulares', modeOnlineHint: 'Si entras a la sala con tu celular mediante código, las cartas llegan solo a tu celular.',
    modeCpu: '🤖 Contra el celular', modeCpuHint: 'Elige entre 1 y 5 rivales virtuales (creados por el celular). Todos juegan sin saber las cartas del otro.',

    // configuración
    playerPlaceholder: 'Jugador {n}', removePlayer: 'Quitar jugador', addPlayer: '+ Agregar jugador',
    start: '¡A jugar!', yourName: 'Tu nombre', cpuName: 'Celular', cpuNameN: 'Celular {n}',
    handsLabel: '¿Cuántos juegos?', handsHint: 'La partida termina después de esos juegos y gana quien haya tomado menos.',
    handsOption: '{n} manos',
    rivalsLabel: '¿Cuántos rivales?', rivalsHint: 'Cuantos más haya en la mesa, más difícil es hacer dos bazas y más grande se pone el plato.',
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
    chatPlaceholder: 'Escribe algo…', chatEmpty: 'Acá pueden picarse mientras se reparten los tragos. Se borra cuando termina la sala.',

    // memoria de partida (C-6)
    resumeTitle: '⏯ Hay una partida a medias', resumeText: 'Mano {n}. El plato tiene {plato} tragos.',
    resume: 'Continuar', delete: 'Borrar',

    rules: [
      'Cada uno pone <b>dos tragos</b> en el plato. Solo se vuelve a poner cuando el plato queda vacío.',
      'Se reparten cinco cartas a cada uno y se da vuelta una más: ese palo es el <b>triunfo</b> y le gana a cualquier carta de los otros palos.',
      'Cada jugador mira sus cartas y dice en secreto si <b>va</b> o <b>se pasa</b>. Pasarse no cuesta nada, pero deja el plato para los demás.',
      'Ir es comprometerse a ganar <b>dos bazas</b> de las cinco. Si va uno solo, quien repartió se queda obligado y juega quiera o no.',
      'Los que van cambian hasta tres cartas y ahí se juegan las cinco bazas.',
      'Hay que <b>asistir</b> al palo con que salieron, <b>montar</b> si se puede ganar la baza, y <b>fallar</b> con un triunfo cuando no se tiene el palo. La app no te deja tirar una carta que no corresponde.',
      'Quien fue y ganó dos bazas o más se salva, y además <b>reparte dos tragos por baza</b> a quien quiera de la mesa.',
      'Quien fue y no llegó a dos bazas <b>se toma el plato entero</b>: eso es el julepe. Todo lo que se bebió vuelve al plato, así que la mano siguiente sale más cara.',
    ],

    // la mesa
    potLabel: 'El plato', potSips: '{n} tragos', potOne: '1 trago',
    anteNote: 'Cada uno puso {n} tragos', potKept: 'El plato sigue acumulado',
    handOf: 'Mano {n} de {total}', trumpLabel: 'Triunfo', dealerIs: 'Reparte {name}',
    turnOf: 'Le toca a {name}', yourTurn: '¡Te toca!', waitingFor: 'Esperando a {name}…',
    dealing: 'Repartiendo…', yourCards: 'Tus cartas', tricksLabel: 'Bazas', cardOf: '{rank} de {suit}',

    // declaración
    declareTitle: '¿Vas o te pasas?',
    declareHint: 'Si vas, tienes que ganar al menos dos bazas de las cinco. Si no llegas, te tomas el plato entero.',
    goDo: '¡Voy!', passDo: 'Me paso',
    declWent: 'va', declPassed: 'se pasó', declForced: 'obligado', declThinking: 'decidiendo…',
    forcedTitle: '¡Te quedaste obligado!',
    forcedText: 'Fue uno solo y tú repartiste, así que juegas igual. Necesitas dos bazas como todos.',
    allPassedTitle: 'Se pasaron todos',
    allPassedText: 'Nadie quiso jugar esta mano. El plato queda acumulado y reparte {name}.',

    // cambio
    changeTitle: 'Cambia hasta tres cartas',
    changeHint: 'Toca las que quieras soltar. Te llegan otras tantas.',
    changeDo: 'Cambiar {n}', changeOne: 'Cambiar 1 carta', changeKeep: 'Me quedo con estas',
    changedSome: '{name} cambió {n} cartas', changedOne: '{name} cambió 1 carta', changedNone: '{name} se quedó con las suyas',

    // bazas
    trickOf: 'Baza {n} de 5', pickCard: 'Elige una carta', playDo: 'Tirar {card}',
    lockedWhy: 'Las cartas apagadas no se pueden tirar: {why}',
    whyFollow: 'hay que asistir al palo de salida', whyTop: 'hay que montar si se puede ganar la baza',
    whyTrump: 'sin el palo de salida, hay que fallar con triunfo',
    trickWon: 'La baza es de {name}', trickWonYou: '¡La baza es tuya!',
    opensTrick: '{name} abre la baza', opensTrickYou: 'Abres tú la baza',

    // reparto de tragos
    giveTitle: 'Te salvaste: reparte {n} tragos',
    giveHint: 'Ganaste {bazas} bazas, así que reparte dos tragos por cada una. Puedes dárselos todos a la misma persona.',
    giveLeft: 'Te quedan {n} tragos por repartir', giveLeftOne: 'Te queda 1 trago por repartir',
    giveDone: 'Listo, confirma abajo', giveDo: '¡Repartidos!',
    giveWait: '{name} está repartiendo sus tragos…',
    gaveLine: '{name} le pasó {n} tragos a {to}',

    // cierre de la mano
    handOverTitle: 'Se acabó la mano',
    julepeTitle: '¡JULEPE!', julepeYou: 'No llegaste a dos bazas: te tomas el plato entero.',
    julepeOther: '{name} no llegó a dos bazas y se toma el plato entero.',
    julepeBoth: '{names} no llegaron a dos bazas y se toman el plato entero, cada uno.',
    drinksNow: '{n} tragos', savedTitle: '¡Todos se salvaron!',
    savedText: 'Nadie se julepeó, así que el plato se vacía y en la mano siguiente se vuelve a poner.',
    potNext: 'El plato de la próxima mano: {n} tragos',
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
    endStats: '{manos} manos jugadas', endSips: 'Tragos de la noche (aprox.)',
    sipsOf: '{n} tragos', julepesOf: '{n} julepes',
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
    title: 'Julep', lead: 'You see your cards and secretly decide whether you are in or out. If you are in and don\'t win two of the five plays, you drink all the sips.',
    leadExplain: 'A game has several hands. Each hand has 5 plays: in each play everyone plays a card. A turn is when it\'s your time to play.',
    rulesSummary: '🍹 How do you play?',
    whoPlays: 'Who is playing?',
    setupHint: 'Sign up in the order you are sitting. The deal moves on after every hand.',
    lobbyTitle: 'Room created', historyTitle: '🍹 Hand by hand',
    beforeTitle: '🍹 Before you start',
    beforeText: 'Everyone starts with a full glass. The game hands out sips: if you get twenty, that is twenty sips, not a full glass. You can take them during the hand, not necessarily in one turn.',

    modeLocal: '📱 One phone', modeLocalHint: '2 to 6 people play. You pass the phone and each player sees their cards without showing them to the rest.',
    modeOnline: '📡 Several phones', modeOnlineHint: 'Join the room with your phone using a code. Cards arrive only on your phone.',
    modeCpu: '🤖 Versus the phone', modeCpuHint: 'Choose 1 to 5 virtual rivals (created by the phone). Everyone plays without knowing each other\'s cards.',

    playerPlaceholder: 'Player {n}', removePlayer: 'Remove player', addPlayer: '+ Add player',
    start: 'Deal me in!', yourName: 'Your name', cpuName: 'Phone', cpuNameN: 'Phone {n}',
    handsLabel: 'How many hands?', handsHint: 'The game ends after those hands and whoever drank the least wins.',
    handsOption: '{n} hands',
    rivalsLabel: 'How many rivals?', rivalsHint: 'The more players at the table, the harder two tricks are and the bigger the pot gets.',
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
      'Everyone puts <b>two sips</b> into the pot. It is only refilled once the pot is empty.',
      'Five cards each, and one more is turned face up: that suit is <b>trump</b> and beats any card of the other suits.',
      'Each player looks at their cards and secretly says whether they are <b>in</b> or <b>out</b>. Folding costs nothing, but it leaves the pot to everyone else.',
      'Going in means committing to win <b>two tricks</b> out of five. If only one player goes in, the dealer is dragged in and has to play.',
      'Whoever is in swaps up to three cards, and then the five tricks are played.',
      'You must <b>follow suit</b>, you must <b>play higher</b> if you can win the trick, and you must <b>trump</b> when you are out of the suit led. The app will not let you play a card that breaks the rules.',
      'Whoever went in and won two tricks or more is safe, and also <b>hands out two sips per trick</b> to anyone at the table.',
      'Whoever went in and fell short of two tricks <b>drinks the whole pot</b>: that is a julep. Everything drunk goes back into the pot, so the next hand costs more.',
    ],

    potLabel: 'The pot', potSips: '{n} sips', potOne: '1 sip',
    anteNote: 'Everyone put in {n} sips', potKept: 'The pot is still stacked up',
    handOf: 'Hand {n} of {total}', trumpLabel: 'Trump', dealerIs: '{name} deals',
    turnOf: '{name}\'s turn', yourTurn: 'Your turn!', waitingFor: 'Waiting for {name}…',
    dealing: 'Dealing…', yourCards: 'Your cards', tricksLabel: 'Tricks', cardOf: '{rank} of {suit}',

    declareTitle: 'Are you in or out?',
    declareHint: 'If you go in, you have to win at least two of the five tricks. Fall short and you drink the whole pot.',
    goDo: 'I am in!', passDo: 'I am out',
    declWent: 'in', declPassed: 'out', declForced: 'dragged in', declThinking: 'deciding…',
    forcedTitle: 'You got dragged in!',
    forcedText: 'Only one player went in and you dealt, so you play anyway. You need two tricks like everybody else.',
    allPassedTitle: 'Everybody folded',
    allPassedText: 'Nobody wanted this hand. The pot stays where it is and {name} deals.',

    changeTitle: 'Swap up to three cards',
    changeHint: 'Tap the ones you want to drop. You get the same number back.',
    changeDo: 'Swap {n}', changeOne: 'Swap 1 card', changeKeep: 'I will keep these',
    changedSome: '{name} swapped {n} cards', changedOne: '{name} swapped 1 card', changedNone: '{name} kept their cards',

    trickOf: 'Trick {n} of 5', pickCard: 'Pick a card', playDo: 'Play {card}',
    lockedWhy: 'The dimmed cards cannot be played: {why}',
    whyFollow: 'you have to follow the suit led', whyTop: 'you have to play higher if you can win the trick',
    whyTrump: 'with none of the suit led, you have to trump',
    trickWon: 'The trick goes to {name}', trickWonYou: 'The trick is yours!',
    opensTrick: '{name} leads', opensTrickYou: 'You lead',

    giveTitle: 'You are safe: hand out {n} sips',
    giveHint: 'You won {bazas} tricks, so hand out two sips for each one. You can dump them all on the same person.',
    giveLeft: '{n} sips left to hand out', giveLeftOne: '1 sip left to hand out',
    giveDone: 'Done, confirm below', giveDo: 'Handed out!',
    giveWait: '{name} is handing out sips…',
    gaveLine: '{name} passed {n} sips to {to}',

    handOverTitle: 'Hand over',
    julepeTitle: 'JULEP!', julepeYou: 'You fell short of two tricks: you drink the whole pot.',
    julepeOther: '{name} fell short of two tricks and drinks the whole pot.',
    julepeBoth: '{names} fell short of two tricks and each drinks the whole pot.',
    drinksNow: '{n} sips', savedTitle: 'Everybody made it!',
    savedText: 'Nobody got juleped, so the pot empties out and gets refilled next hand.',
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
    title: 'Paga o Bolo', lead: 'Você vê suas cartas e decide em segredo se entra ou passa. Se entrar e não ganhar duas das cinco jogadas, bebe todos os goles.',
    leadExplain: 'Uma partida tem vários jogos. Cada jogo tem 5 jogadas: em cada jogada todos jogam uma carta. Um turno é quando te toca jogar.',
    rulesSummary: '🍹 Como se joga?',
    whoPlays: 'Quem vai jogar?',
    setupHint: 'Se anotem na ordem em que estão sentados. Quem dá as cartas muda a cada mão.',
    lobbyTitle: 'Sala criada', historyTitle: '🍹 Mão por mão',
    beforeTitle: '🍹 Antes de começar',
    beforeText: 'Cada um começa com seu copo servido. O jogo distribui goles: se você receber vinte, são vinte goles, não um copo. Você toma durante o jogo, não necessariamente em um turno.',

    modeLocal: '📱 Um celular', modeLocalHint: 'Jogam entre 2 e 6 pessoas. Vocês passam o celular e cada um olha suas cartas sem mostrar pro resto.',
    modeOnline: '📡 Vários celulares', modeOnlineHint: 'Entra na sala com seu celular usando código. As cartas chegam só no seu celular.',
    modeCpu: '🤖 Contra o celular', modeCpuHint: 'Escolha entre 1 e 5 rivais virtuais (criados pelo celular). Todos jogam sem saber as cartas do outro.',

    playerPlaceholder: 'Jogador {n}', removePlayer: 'Tirar jogador', addPlayer: '+ Adicionar jogador',
    start: 'Bora jogar!', yourName: 'Seu nome', cpuName: 'Celular', cpuNameN: 'Celular {n}',
    handsLabel: 'Quantos jogos?', handsHint: 'A partida acaba depois desses jogos e ganha quem bebeu menos.',
    handsOption: '{n} mãos',
    rivalsLabel: 'Quantos rivais?', rivalsHint: 'Quanto mais gente na mesa, mais difícil fazer duas vazas e maior fica o bolo.',
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
      'Cada um bota <b>dois goles</b> no bolo. Só se bota de novo quando o bolo zera.',
      'Cinco cartas pra cada um e mais uma virada: aquele naipe é o <b>trunfo</b> e ganha de qualquer carta dos outros naipes.',
      'Cada jogador olha suas cartas e diz em segredo se <b>entra</b> ou <b>passa</b>. Passar não custa nada, mas deixa o bolo pro resto.',
      'Entrar é se comprometer a fazer <b>duas vazas</b> das cinco. Se entrar um só, quem deu as cartas é obrigado a jogar também.',
      'Quem entrou troca até três cartas e aí se jogam as cinco vazas.',
      'Tem que <b>seguir o naipe</b> da saída, <b>cobrir</b> se der pra ganhar a vaza, e <b>trunfar</b> quando não tiver o naipe. O app não deixa você jogar carta fora da regra.',
      'Quem entrou e fez duas vazas ou mais se salva, e ainda <b>distribui dois goles por vaza</b> pra quem quiser da mesa.',
      'Quem entrou e não chegou a duas vazas <b>bebe o bolo inteiro</b>. Tudo o que foi bebido volta pro bolo, então a mão seguinte sai mais cara.',
    ],

    potLabel: 'O bolo', potSips: '{n} goles', potOne: '1 gole',
    anteNote: 'Cada um botou {n} goles', potKept: 'O bolo continua acumulado',
    handOf: 'Mão {n} de {total}', trumpLabel: 'Trunfo', dealerIs: 'Quem dá é {name}',
    turnOf: 'É a vez de {name}', yourTurn: 'É a sua vez!', waitingFor: 'Esperando {name}…',
    dealing: 'Distribuindo…', yourCards: 'Suas cartas', tricksLabel: 'Vazas', cardOf: '{rank} de {suit}',

    declareTitle: 'Entra ou passa?',
    declareHint: 'Se entrar, tem que fazer pelo menos duas das cinco vazas. Se não chegar, bebe o bolo inteiro.',
    goDo: 'Entro!', passDo: 'Passo',
    declWent: 'entrou', declPassed: 'passou', declForced: 'obrigado', declThinking: 'decidindo…',
    forcedTitle: 'Você ficou obrigado!',
    forcedText: 'Entrou um só e você deu as cartas, então joga do mesmo jeito. Precisa de duas vazas como todo mundo.',
    allPassedTitle: 'Passou geral',
    allPassedText: 'Ninguém quis essa mão. O bolo fica acumulado e quem dá é {name}.',

    changeTitle: 'Troque até três cartas',
    changeHint: 'Toque nas que quiser largar. Você recebe a mesma quantidade.',
    changeDo: 'Trocar {n}', changeOne: 'Trocar 1 carta', changeKeep: 'Fico com essas',
    changedSome: '{name} trocou {n} cartas', changedOne: '{name} trocou 1 carta', changedNone: '{name} ficou com as dela',

    trickOf: 'Vaza {n} de 5', pickCard: 'Escolha uma carta', playDo: 'Jogar {card}',
    lockedWhy: 'As cartas apagadas não podem ser jogadas: {why}',
    whyFollow: 'tem que seguir o naipe da saída', whyTop: 'tem que cobrir se der pra ganhar a vaza',
    whyTrump: 'sem o naipe da saída, tem que trunfar',
    trickWon: 'A vaza é de {name}', trickWonYou: 'A vaza é sua!',
    opensTrick: '{name} sai', opensTrickYou: 'Você sai',

    giveTitle: 'Você se salvou: distribua {n} goles',
    giveHint: 'Você fez {bazas} vazas, então distribua dois goles por vaza. Pode jogar todos na mesma pessoa.',
    giveLeft: 'Faltam {n} goles pra distribuir', giveLeftOne: 'Falta 1 gole pra distribuir',
    giveDone: 'Pronto, confirme embaixo', giveDo: 'Distribuídos!',
    giveWait: '{name} está distribuindo os goles…',
    gaveLine: '{name} passou {n} goles pra {to}',

    handOverTitle: 'Acabou a mão',
    julepeTitle: 'PAGOU O BOLO!', julepeYou: 'Você não chegou a duas vazas: bebe o bolo inteiro.',
    julepeOther: '{name} não chegou a duas vazas e bebe o bolo inteiro.',
    julepeBoth: '{names} não chegaram a duas vazas e cada um bebe o bolo inteiro.',
    drinksNow: '{n} goles', savedTitle: 'Todo mundo se salvou!',
    savedText: 'Ninguém pagou o bolo, então ele zera e na mão seguinte se bota de novo.',
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

export const LOCALES = { es: ES, en: EN, pt: PT };
