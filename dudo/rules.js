/**
 * Dudo — datos y textos en español, inglés y portugués.
 * Solo datos, sin lógica. Ver docs/juegos/dudo.md.
 */

export const GAME_ID = 'dudo';
export const DEFAULT_CONFIG = { dice: 5, calzar: true, chileno: true };

/**
 * Como se nombran las pintas en una mesa chilena. Van aparte de LOCALES porque son de un solo
 * idioma: en inglés y en portugués no hay un juego de nombres equivalente instalado, así que ahí
 * las pintas se dicen por su número y el interruptor ni se ofrece (D-71).
 */
export const CHILENO = {
  one: { 1: 'as', 2: 'tonto', 3: 'tren', 4: 'cuadra', 5: 'quinta', 6: 'sexta' },
  many: { 1: 'ases', 2: 'tontos', 3: 'trenes', 4: 'cuadras', 5: 'quintas', 6: 'sextas' },
  label: 'Nombres chilenos',
  hint: 'Ases, tontos, trenes, cuadras, quintas y sextas, como se dice en la mesa. Apagado, se dicen por su número.',
};

/* ================================================================== */
/* ESPAÑOL                                                             */
/* ================================================================== */
const ES = {
  // Los nombres de cada pinta, en singular y en plural ("un as", "cuatro cincos")
  pintaOne: { 1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis' },
  pintaMany: { 1: 'ases', 2: 'doses', 3: 'treses', 4: 'cuatros', 5: 'cincos', 6: 'seises' },
  ui: {
    // estáticos (index.html)
    docTitle: 'Dudo 🎲 · Juegos de Salón', gameChip: '🎲 Dudo', menu: '‹ Menú',
    title: 'Dudo', lead: 'Cada uno mira solo sus dados. Se apuesta cuántos hay en toda la mesa y el que sigue sube o dice dudo.',
    rulesSummary: '🎲 ¿Cómo se juega?',
    modesTitle: '¿Cómo van a jugar?',
    m1: '📱 Un celular', m1sub: 'De 2 a 6. Se pasan el celular y cada uno mira sus dados tapando la pantalla.',
    m2: '📶 Varios celulares', m2sub: 'Sala con código de 4 letras. Los dados no viajan: se comprometen y se destapan al dudar.',
    m3: '🤖 Contra el celular', m3sub: 'Duelo. El celular apuesta con probabilidad y solo mira sus propios dados.',
    soon: 'Próximamente',
    whoPlays: '¿Quiénes juegan?',
    setupHint: 'Anótense en el orden en que están sentados. Cada uno parte con cinco dados.',
    addPlayer: '+ Agregar jugador', start: '¡A jugar!',
    calzarLabel: 'Se puede calzar', calzarHint: 'Acertar la cantidad exacta recupera un dado. Desde la mitad de la mesa y con tres jugadores o más.',
    endAgain: '¡Otra partida!', changePlayers: 'Cambiar jugadores', backMenu: 'Volver al menú',
    historyTitle: '🎲 Cómo se fue dando',
    // dinámicos (game.js)
    resumeTitle: '⏯ Hay una partida a medias', resumeText: 'Ronda {round}. Le tocaba a {name}.', resume: 'Continuar', delete: 'Borrar',
    playerPlaceholder: 'Jugador {n}', removePlayer: 'Quitar jugador', maxPlayers: 'Máximo {n} jugadores',
    errMin: 'Se necesitan al menos {n} jugadores.', errNames: 'Todos los jugadores necesitan un nombre.', errDup: 'Hay nombres repetidos. Pónganse apodos.',
    yourName: 'Tu nombre', cpuName: 'Celular',
    rules: [
      'Cada uno tira cinco dados y mira solo los suyos.',
      'Se apuesta cuántos dados de una pinta hay <b>en toda la mesa</b>: "cuatro quintas" son cuatro dados con un 5.',
      'Los <b>ases son comodín</b>: cuentan como la pinta que se haya apostado.',
      'El que sigue sube la apuesta —más cantidad, o la misma cantidad con pinta mayor— o dice <b>dudo</b>.',
      'Al dudar se destapa todo y se cuenta. Si había tantos o más, pierde un dado quien dudó; si había menos, quien apostó.',
      '<b>Calzar</b> es decir que la cantidad es exacta: si aciertas recuperas un dado, si fallas pierdes uno. Hace falta una mesa de tres.',
      'Quien se queda sin dados sale. Gana el último con dados.',
    ],
    diceLeft: '{n} dados', diceLeftOne: '1 dado',
    tableDice: '{n} dados en la mesa',
    yourDice: 'Tus dados', turnOf: 'Le toca a', yourTurn: '¡Te toca!',
    aceWild: 'Los ases son comodín',
    opens: 'Abre la ronda: apuesta lo que quieras.',
    standing: '{name} dijo', standingYou: 'Dijiste',
    pickPinta: 'Elige la pinta', pickAmount: '¿Cuántos hay en la mesa?',
    bidDo: 'Apuesto {n} {pinta}', bidNothing: 'Apostar', dudoDo: '¡Dudo!', calzaDo: '¡Calzo!',
    dudoHint: 'Dudar de {n} {pinta}', calzaHint: 'Decir que son {n} justos',
    round: 'Ronda {n}',
    // Destape
    revealTitle: 'Se destapa la mesa', revealCount: 'Había {n} {pinta}', revealCountOne: 'Había 1 {pinta}',
    saidDudo: '{name} dudó de {n} {pinta}', saidCalza: '{name} calzó {n} {pinta}',
    losesDie: '{name} pierde un dado', gainsDie: '{name} recupera un dado',
    isOut: '{name} se quedó sin dados', exactYes: '¡Justo!', exactNo: 'No era exacto',
    goOn: 'Toca para seguir',
    verified: 'Dados verificados ✅', notVerified: '⚠️ Los dados de {name} no coinciden',
    // Pase y pantalla tapada
    hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!',
    coverLabel: 'Que nadie más mire. Son los dados de', coverTap: 'Ver mis dados',
    // Final
    winner: '¡Ganó {name}!', winnerYou: '¡Ganaste!', loserYou: 'Te quedaste sin dados',
    endStats: '{rounds} rondas', endStatsOne: 'Una sola ronda',
    histDudo: '{who} dudó de {n} {pinta} · había {count}', histCalza: '{who} calzó {n} {pinta} · había {count}',
    histLost: '{name} −1', histGained: '{name} +1',
  },
};

/* ================================================================== */
/* ENGLISH                                                             */
/* ================================================================== */
const EN = {
  pintaOne: { 1: 'ace', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' },
  pintaMany: { 1: 'aces', 2: 'twos', 3: 'threes', 4: 'fours', 5: 'fives', 6: 'sixes' },
  ui: {
    docTitle: 'Liar\'s Dice 🎲 · Party Games', gameChip: '🎲 Liar\'s Dice', menu: '‹ Menu',
    title: 'Liar\'s Dice', lead: 'You only see your own dice. Bid how many are on the whole table and the next player raises or calls your bluff.',
    rulesSummary: '🎲 How do you play?',
    modesTitle: 'How are you playing?',
    m1: '📱 One phone', m1sub: '2 to 6 players. Pass the phone around; each one peeks at their dice behind a cover.',
    m2: '📶 Several phones', m2sub: 'Room with a 4-letter code. Dice never travel: they are committed and opened when someone calls.',
    m3: '🤖 Versus the phone', m3sub: 'Duel. The phone bids on probability and only ever looks at its own dice.',
    soon: 'Coming soon',
    whoPlays: 'Who\'s playing?',
    setupHint: 'Sign up in the order you\'re sitting. Everyone starts with five dice.',
    addPlayer: '+ Add player', start: 'Play!',
    calzarLabel: 'Spot on allowed', calzarHint: 'Calling the exact count wins a die back. From half the table on, and only with three players or more.',
    endAgain: 'Another game!', changePlayers: 'Change players', backMenu: 'Back to menu',
    historyTitle: '🎲 How it went',
    resumeTitle: '⏯ There\'s a game in progress', resumeText: 'Round {round}. It was {name}\'s turn.', resume: 'Continue', delete: 'Delete',
    playerPlaceholder: 'Player {n}', removePlayer: 'Remove player', maxPlayers: 'Up to {n} players',
    errMin: 'You need at least {n} players.', errNames: 'Every player needs a name.', errDup: 'Some names are repeated. Use nicknames.',
    yourName: 'Your name', cpuName: 'Phone',
    rules: [
      'Everyone rolls five dice and sees only their own.',
      'You bid how many dice of a face are <b>on the whole table</b>: "four fives".',
      '<b>Aces are wild</b>: they count as whatever face was bid.',
      'The next player raises —more dice, or the same count on a higher face— or calls <b>liar</b>.',
      'On a call everything is opened and counted. If there were that many or more, the caller loses a die; if fewer, the bidder does.',
      '<b>Spot on</b> means the count is exact: get it right and you win a die back, get it wrong and you lose one. Needs three players.',
      'Run out of dice and you\'re out. Last player with dice wins.',
    ],
    diceLeft: '{n} dice', diceLeftOne: '1 die',
    tableDice: '{n} dice on the table',
    yourDice: 'Your dice', turnOf: 'It\'s on', yourTurn: 'Your turn!',
    aceWild: 'Aces are wild',
    opens: 'You open the round: bid whatever you like.',
    standing: '{name} said', standingYou: 'You said',
    pickPinta: 'Pick the face', pickAmount: 'How many on the table?',
    bidDo: 'Bid {n} {pinta}', bidNothing: 'Bid', dudoDo: 'Liar!', calzaDo: 'Spot on!',
    dudoHint: 'Call {n} {pinta}', calzaHint: 'Say it\'s exactly {n}',
    round: 'Round {n}',
    revealTitle: 'Open them up', revealCount: 'There were {n} {pinta}', revealCountOne: 'There was 1 {pinta}',
    saidDudo: '{name} called {n} {pinta}', saidCalza: '{name} said {n} {pinta} exactly',
    losesDie: '{name} loses a die', gainsDie: '{name} wins a die back',
    isOut: '{name} is out of dice', exactYes: 'Exactly!', exactNo: 'Not exact',
    goOn: 'Tap to go on',
    verified: 'Dice verified ✅', notVerified: '⚠️ {name}\'s dice don\'t match',
    hoPass: 'Pass the phone to', hoReady: 'Got it, that\'s me!',
    coverLabel: 'Nobody else look. These dice belong to', coverTap: 'See my dice',
    winner: '{name} wins!', winnerYou: 'You win!', loserYou: 'You ran out of dice',
    endStats: '{rounds} rounds', endStatsOne: 'A single round',
    histDudo: '{who} called {n} {pinta} · there were {count}', histCalza: '{who} said {n} {pinta} exactly · there were {count}',
    histLost: '{name} −1', histGained: '{name} +1',
  },
};

/* ================================================================== */
/* PORTUGUÊS (BR)                                                      */
/* ================================================================== */
const PT = {
  pintaOne: { 1: 'ás', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis' },
  pintaMany: { 1: 'ases', 2: 'dois', 3: 'três', 4: 'quatros', 5: 'cincos', 6: 'seis' },
  ui: {
    docTitle: 'Dado Mentiroso 🎲 · Jogos de Salão', gameChip: '🎲 Dado Mentiroso', menu: '‹ Menu',
    title: 'Dado Mentiroso', lead: 'Cada um vê só os próprios dados. Aposta-se quantos tem na mesa inteira e o próximo aumenta ou duvida.',
    rulesSummary: '🎲 Como se joga?',
    modesTitle: 'Como vocês vão jogar?',
    m1: '📱 Um celular', m1sub: 'De 2 a 6. Passem o celular e cada um olha seus dados com a tela tampada.',
    m2: '📶 Vários celulares', m2sub: 'Sala com código de 4 letras. Os dados não viajam: ficam comprometidos e abrem na hora da dúvida.',
    m3: '🤖 Contra o celular', m3sub: 'Duelo. O celular aposta por probabilidade e só olha os próprios dados.',
    soon: 'Em breve',
    whoPlays: 'Quem vai jogar?',
    setupHint: 'Cadastrem-se na ordem em que estão sentados. Cada um começa com cinco dados.',
    addPlayer: '+ Adicionar jogador', start: 'Bora jogar!',
    calzarLabel: 'Pode cravar', calzarHint: 'Acertar a quantidade exata devolve um dado. Da metade da mesa em diante, e só com três jogadores ou mais.',
    endAgain: 'Mais uma partida!', changePlayers: 'Trocar jogadores', backMenu: 'Voltar ao menu',
    historyTitle: '🎲 Como foi',
    resumeTitle: '⏯ Tem uma partida pela metade', resumeText: 'Rodada {round}. Era a vez de {name}.', resume: 'Continuar', delete: 'Apagar',
    playerPlaceholder: 'Jogador {n}', removePlayer: 'Tirar jogador', maxPlayers: 'No máximo {n} jogadores',
    errMin: 'São necessários pelo menos {n} jogadores.', errNames: 'Todo jogador precisa de um nome.', errDup: 'Tem nomes repetidos. Usem apelidos.',
    yourName: 'Seu nome', cpuName: 'Celular',
    rules: [
      'Cada um joga cinco dados e vê só os seus.',
      'Aposta-se quantos dados de uma face tem <b>na mesa inteira</b>: "quatro cincos".',
      'Os <b>ases são curinga</b>: contam como a face que foi apostada.',
      'O próximo aumenta a aposta —mais quantidade, ou a mesma com face maior— ou fala <b>duvido</b>.',
      'Na dúvida abre tudo e conta. Se tinha aquilo ou mais, perde um dado quem duvidou; se tinha menos, quem apostou.',
      '<b>Cravar</b> é dizer que a quantidade é exata: acertou, ganha um dado de volta; errou, perde um. Precisa de três na mesa.',
      'Quem fica sem dados sai. Ganha o último com dados.',
    ],
    diceLeft: '{n} dados', diceLeftOne: '1 dado',
    tableDice: '{n} dados na mesa',
    yourDice: 'Seus dados', turnOf: 'É a vez de', yourTurn: 'É a sua vez!',
    aceWild: 'Os ases são curinga',
    opens: 'Você abre a rodada: aposte o que quiser.',
    standing: '{name} falou', standingYou: 'Você falou',
    pickPinta: 'Escolha a face', pickAmount: 'Quantos tem na mesa?',
    bidDo: 'Aposto {n} {pinta}', bidNothing: 'Apostar', dudoDo: 'Duvido!', calzaDo: 'Cravo!',
    dudoHint: 'Duvidar de {n} {pinta}', calzaHint: 'Dizer que são {n} certinhos',
    round: 'Rodada {n}',
    revealTitle: 'Abre a mesa', revealCount: 'Tinha {n} {pinta}', revealCountOne: 'Tinha 1 {pinta}',
    saidDudo: '{name} duvidou de {n} {pinta}', saidCalza: '{name} cravou {n} {pinta}',
    losesDie: '{name} perde um dado', gainsDie: '{name} ganha um dado',
    isOut: '{name} ficou sem dados', exactYes: 'Certinho!', exactNo: 'Não era exato',
    goOn: 'Toque para seguir',
    verified: 'Dados verificados ✅', notVerified: '⚠️ Os dados de {name} não batem',
    hoPass: 'Passe o celular para', hoReady: 'Pronto, sou eu!',
    coverLabel: 'Ninguém mais olhe. Os dados são de', coverTap: 'Ver meus dados',
    winner: '{name} ganhou!', winnerYou: 'Você ganhou!', loserYou: 'Você ficou sem dados',
    endStats: '{rounds} rodadas', endStatsOne: 'Uma rodada só',
    histDudo: '{who} duvidou de {n} {pinta} · tinha {count}', histCalza: '{who} cravou {n} {pinta} · tinha {count}',
    histLost: '{name} −1', histGained: '{name} +1',
  },
};

export const LOCALES = { es: ES, en: EN, pt: PT };
