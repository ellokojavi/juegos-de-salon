/**
 * Toque y Fama — configuración por defecto y textos en español, inglés y portugués.
 */
export const GAME_ID = 'toque-y-fama';
export const DEFAULT_CONFIG = { digits: 4, replica: true, zeroFirst: true };
export const DIGIT_OPTIONS = [3, 4, 5];

const ES = {
  docTitle: 'Toque y Fama 🔢 · Juegos de Salón', gameChip: '🔢 Toque y Fama', menu: '‹ Menú',
  title: 'Toque y Fama',
  lead: 'Cada uno elige un número secreto de cifras distintas. Adivina el del rival antes de que adivine el tuyo.',
  howTitle: '🧠 Cómo se juega',
  howText: 'Por cada intento recibes pistas: una <b>fama</b> es una cifra correcta en su lugar y un <b>toque</b> es una cifra correcta en otro lugar. Gana quien adivina primero.',
  example: 'Ejemplo: número secreto 1234, intento 1356 → 1 fama (el 1) y 1 toque (el 3).',
  modeLocal: '📱 Un celular, dos jugadores', modeLocalHint: 'Se pasan el celular. La pantalla se tapa entre turnos.',
  modeOnline: '📡 Dos celulares', modeOnlineHint: 'Cada uno juega en su celular.',
  modeSolo: '🧍 Jugar solo', modeSoloHint: 'El celular elige el número secreto y tú lo adivinas.',
  // setup
  setupTitle: '¿Cómo jugamos?', digits: 'Cifras', replica: 'Derecho a réplica', replicaHint: 'Si quien empieza adivina, el otro tiene un último intento para empatar.',
  zeroFirst: 'Permitir cero al inicio', yourName: 'Tu nombre', p1: 'Jugador 1', p2: 'Jugador 2',
  start: '¡A jugar!', create: 'Crear sala', joinTitle: 'Unirse a una sala', codePlaceholder: 'CÓDIGO', join: 'Unirse',
  errName: 'Falta el nombre.', errNames: 'Faltan nombres o están repetidos.', errCode: 'El código tiene 4 letras.',
  errNotFound: 'No existe esa sala. Revisa el código.', errFull: 'La sala ya está llena.', errExpired: 'Esa sala ya venció.', errOtherGame: 'Ese código es de otro juego.', errNet: 'No se pudo conectar. ¿Hay internet?',
  errOffline: 'No se pudo abrir la sala. Puede ser tu internet o que haya mucha gente jugando. Intenta nuevamente en unos minutos o jugar en modo de un solo celular sin conexión a internet.',
  errTooMany: 'Abriste muchas salas seguidas. Espera un ratito y prueba de nuevo.',
  // lobby
  chatTitle: 'Chat de la sala', chatOpen: 'Abrir el chat', chatClose: 'Cerrar el chat', chatSend: 'Enviar',
  chatPlaceholder: 'Escribe algo…', chatEmpty: 'Acá pueden picarse mientras adivinan. Se borra cuando termina la partida.',
  invitedTitle: '¡Invitado a jugar!', invited: '📩 Sala {code}', invitedHint: 'Escribe tu nombre y entra. La partida la configura quien te invitó.',
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al rival o que escanee el QR.', lobbyWaiting: 'Esperando al rival', lobbyJoined: '¡{name} se unió!', shareLink: '📤 Compartir link', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  lobbyCancel: 'Cancelar la sala', lobbyLeave: 'Salir de la sala',
  // secret
  secretTitle: 'Tu número secreto', secretFor: 'Número secreto de {name}', secretHint: '{n} cifras distintas. Que nadie mire.', secretHintNoZero: '{n} cifras distintas, sin cero al inicio. Que nadie mire.',
  confirm: '¡Vamos!', hide: 'Tapar pantalla', tapToReveal: 'Toca para ver', secretSaved: 'Número secreto guardado 🔒',
  waitingSecret: 'Esperando a que {name} elija su número secreto', bothReady: '¡Los dos listos!',
  // play
  turnYou: '¡Te toca! Adivina el de {name}', turnOther: 'Le toca a {name}…', waitingReply: 'Esperando la respuesta…', round: 'Ronda {n}',
  blockHint: '💡 Mantén apretada una cifra para tacharla. Repite para destacharla.',
  mySecret: 'Tu número secreto', tapToShow: 'toca para ver', tapToHide: 'toca para ocultar',
  guess: 'Probar', famas: 'famas', toques: 'toques', fama: 'fama', toque: 'toque', none: 'nada', famaShort: 'F', toqueShort: 'T',
  boardOf: 'Intentos de {name}', noGuesses: 'Aún sin intentos', tries: '{n} {word}', tryOne: 'intento', tryMany: 'intentos',
  replicaNotice: '¡{name} acertó! {other} tiene un último intento para empatar.',
  // jugar solo = el juego de La Copa (D-142). Estas claves las lee también cup/games/number/ui.js
  soloHow: [
    'El número secreto tiene 4 cifras distintas y puede empezar con cero.',
    'Escribe un número y toca Probar para ver sus famas y sus toques.',
    'Tienes 10 intentos y el reloj corre mientras juegas.',
  ],
  scoringTitle: '🏅 Puntaje',
  soloScoring: 'Son 100 puntos si lo sacas al primer intento y 10 menos por cada intento después del primero. Si no lo sacas, son 0 puntos.',
  soloStart: '🔢 Empezar', soloTitle: '🔢 Adivina el número', soloTimer: '⏱ {t}',
  triesLeft: 'Te quedan {n} intentos.', tryLeft1: 'Te queda 1 intento.', yourGuesses: 'Tus intentos',
  solved: '¡Lo sacaste!', notSolved: 'Se acabaron los intentos. El número era {v}.', seeResults: 'Ver resultado',
  offline: 'Rival desconectado. Esperando que vuelva…', reconnecting: 'Reconectando…',
  // handoff
  hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!', hoResult: 'Respuesta', hoContinue: 'Seguir',
  // result
  winTitle: '¡Ganó {name}!', tieTitle: '¡Empate!', youWin: '¡Ganaste!', youLose: 'Perdiste… esta vez.',
  inTries: 'en {n} {word}', secretsWere: 'Los números secretos eran', replayTitle: '🔎 Ver todos los intentos', verified: 'verificado ✅', notVerified: '⚠️ no coincide (¿trampa?)',
  rematch: '🔁 Revancha', rematchWaiting: 'Esperando a {name} para la revancha', changeMode: 'Cambiar modo', backMenu: 'Volver al menú',
  soloWin: '¡Lo adivinaste!', soloLose: 'No lo adivinaste', yourScore: 'Tu puntaje', soloSummary: 'Usaste {n} {word} y el reloj marcó {t}.',
  newRecord: '🏆 ¡Nuevo récord!', prevRecord: 'Tu récord es {s} puntos en {t}.', soloSecretWas: 'El número secreto era', playAgain: '🔁 Jugar otra vez',
  resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
};

const EN = {
  docTitle: 'Bulls and Cows 🔢 · Party Games', gameChip: '🔢 Bulls and Cows', menu: '‹ Menu',
  title: 'Bulls and Cows',
  lead: 'Each player picks a secret number with no repeated digits. Crack your rival\'s number before they crack yours.',
  howTitle: '🧠 How to play',
  howText: 'Every guess gets clues: a <b>bull</b> is a right digit in the right spot and a <b>cow</b> is a right digit in the wrong spot. Whoever cracks it first wins.',
  example: 'Example: secret number 1234, guess 1356 → 1 bull (the 1) and 1 cow (the 3).',
  modeLocal: '📱 One phone, two players', modeLocalHint: 'Pass the phone around. The screen hides between turns.',
  modeOnline: '📡 Two phones', modeOnlineHint: 'Each player plays on their own phone.',
  modeSolo: '🧍 Play alone', modeSoloHint: 'The phone picks the secret number and you crack it.',
  setupTitle: 'How do we play?', digits: 'Digits', replica: 'Right of reply', replicaHint: 'If the starter cracks it, the other player gets one last guess to tie.',
  zeroFirst: 'Allow leading zero', yourName: 'Your name', p1: 'Player 1', p2: 'Player 2',
  start: 'Let\'s play!', create: 'Create room', joinTitle: 'Join a room', codePlaceholder: 'CODE', join: 'Join',
  errName: 'Name missing.', errNames: 'Names missing or repeated.', errCode: 'The code has 4 letters.',
  errNotFound: 'That room doesn\'t exist. Check the code.', errFull: 'That room is full.', errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.', errNet: 'Could not connect. Is there internet?',
  errOffline: 'Couldn\'t open the room. It might be your connection or too many people playing. Try again in a few minutes, or play in one-phone mode, which needs no internet.',
  errTooMany: 'You\'ve opened a lot of rooms in a row. Wait a bit and try again.',
  chatTitle: 'Room chat', chatOpen: 'Open the chat', chatClose: 'Close the chat', chatSend: 'Send',
  chatPlaceholder: 'Say something…', chatEmpty: 'Trash talk while you guess. It disappears when the game ends.',
  invitedTitle: 'Invited to play!', invited: '📩 Room {code}', invitedHint: 'Type your name and jump in. Whoever invited you sets up the game.',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell your rival the code or let them scan the QR.', lobbyWaiting: 'Waiting for your rival', lobbyJoined: '{name} joined!', shareLink: '📤 Share link', copyLink: '📋 Copy link', copied: 'Copied!',
  lobbyCancel: 'Cancel the room', lobbyLeave: 'Leave the room',
  secretTitle: 'Your secret number', secretFor: '{name}\'s secret number', secretHint: '{n} different digits. No peeking.', secretHintNoZero: '{n} different digits, no leading zero. No peeking.',
  confirm: 'Let\'s go!', hide: 'Hide screen', tapToReveal: 'Tap to reveal', secretSaved: 'Secret number saved 🔒',
  waitingSecret: 'Waiting for {name} to pick a secret number', bothReady: 'Both ready!',
  turnYou: 'Your turn! Guess {name}\'s number', turnOther: '{name}\'s turn…', waitingReply: 'Waiting for the reply…', round: 'Round {n}',
  blockHint: '💡 Long-press a digit to cross it out. Do it again to bring it back.',
  mySecret: 'Your secret number', tapToShow: 'tap to show', tapToHide: 'tap to hide',
  guess: 'Guess', famas: 'bulls', toques: 'cows', fama: 'bull', toque: 'cow', none: 'nothing', famaShort: 'B', toqueShort: 'C',
  boardOf: '{name}\'s guesses', noGuesses: 'No guesses yet', tries: '{n} {word}', tryOne: 'guess', tryMany: 'guesses',
  replicaNotice: '{name} got it! {other} gets one last guess to tie.',
  soloHow: [
    'The secret number has 4 different digits and can start with zero.',
    'Type a number and tap Guess to see its bulls and cows.',
    'You have 10 guesses and the clock runs while you play.',
  ],
  scoringTitle: '🏅 Scoring',
  soloScoring: 'You get 100 points if you crack it on the first guess and 10 less for each guess after the first. If you don\'t crack it, you get 0 points.',
  soloStart: '🔢 Start', soloTitle: '🔢 Crack the number', soloTimer: '⏱ {t}',
  triesLeft: '{n} guesses left.', tryLeft1: '1 guess left.', yourGuesses: 'Your guesses',
  solved: 'You cracked it!', notSolved: 'Out of guesses. The number was {v}.', seeResults: 'See result',
  offline: 'Rival disconnected. Waiting for them to come back…', reconnecting: 'Reconnecting…',
  hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!', hoResult: 'Reply', hoContinue: 'Continue',
  winTitle: '{name} wins!', tieTitle: 'It\'s a tie!', youWin: 'You win!', youLose: 'You lose… this time.',
  inTries: 'in {n} {word}', secretsWere: 'The secret numbers were', replayTitle: '🔎 See all guesses', verified: 'verified ✅', notVerified: '⚠️ mismatch (cheating?)',
  rematch: '🔁 Rematch', rematchWaiting: 'Waiting for {name} for the rematch', changeMode: 'Change mode', backMenu: 'Back to menu',
  soloWin: 'You cracked it!', soloLose: 'You didn\'t crack it', yourScore: 'Your score', soloSummary: 'You used {n} {word} and the clock read {t}.',
  newRecord: '🏆 New record!', prevRecord: 'Your record is {s} points in {t}.', soloSecretWas: 'The secret number was', playAgain: '🔁 Play again',
  resumeTitle: '⏯ There\'s an unfinished game', resume: 'Continue', delete: 'Delete',
};


const PT = {
  docTitle: 'Toque e Fama 🔢 · Jogos de Salão', gameChip: '🔢 Toque e Fama', menu: '‹ Menu',
  title: 'Toque e Fama',
  lead: 'Cada um escolhe um número secreto com algarismos diferentes. Descubra o do rival antes que ele descubra o seu.',
  howTitle: '🧠 Como se joga',
  howText: 'A cada tentativa você recebe pistas: uma <b>fama</b> é um algarismo certo no lugar certo e um <b>toque</b> é um algarismo certo em outro lugar. Ganha quem descobre primeiro.',
  example: 'Exemplo: número secreto 1234, tentativa 1356 → 1 fama (o 1) e 1 toque (o 3).',
  modeLocal: '📱 Um celular, dois jogadores', modeLocalHint: 'Vocês passam o celular. A tela fica coberta entre os turnos.',
  modeOnline: '📡 Dois celulares', modeOnlineHint: 'Cada um joga no seu celular.',
  modeSolo: '🧍 Jogar sozinho', modeSoloHint: 'O celular escolhe o número secreto e você descobre.',
  // configuração
  setupTitle: 'Como vamos jogar?', digits: 'Algarismos', replica: 'Direito de resposta', replicaHint: 'Se quem começa acertar, o outro tem uma última tentativa para empatar.',
  zeroFirst: 'Permitir zero no início', yourName: 'Seu nome', p1: 'Jogador 1', p2: 'Jogador 2',
  start: 'Bora jogar!', create: 'Criar sala', joinTitle: 'Entrar em uma sala', codePlaceholder: 'CÓDIGO', join: 'Entrar',
  errName: 'Falta o nome.', errNames: 'Faltam nomes ou estão repetidos.', errCode: 'O código tem 4 letras.',
  errNotFound: 'Essa sala não existe. Confira o código.', errFull: 'A sala já está cheia.', errExpired: 'Essa sala já expirou.', errOtherGame: 'Esse código é de outro jogo.', errNet: 'Não foi possível conectar. Tem internet?',
  errOffline: 'Não foi possível abrir a sala. Pode ser a sua internet ou muita gente jogando ao mesmo tempo. Tente de novo em alguns minutos ou jogue no modo de um celular só, que não precisa de internet.',
  errTooMany: 'Você abriu muitas salas seguidas. Espere um pouquinho e tente de novo.',
  // sala
  chatTitle: 'Chat da sala', chatOpen: 'Abrir o chat', chatClose: 'Fechar o chat', chatSend: 'Enviar',
  chatPlaceholder: 'Escreva algo…', chatEmpty: 'Aqui vocês podem se provocar enquanto tentam adivinhar. Some quando a partida termina.',
  invitedTitle: 'Convidado para jogar!', invited: '📩 Sala {code}', invitedHint: 'Escreva seu nome e entre. Quem te convidou configura a partida.',
  lobbyTitle: 'Sala criada', lobbyCode: 'Código', lobbyShare: 'Diga o código ao rival ou deixe ele escanear o QR.', lobbyWaiting: 'Esperando o rival', lobbyJoined: '{name} entrou!', shareLink: '📤 Compartilhar link', copyLink: '📋 Copiar link', copied: 'Copiado!',
  lobbyCancel: 'Cancelar a sala', lobbyLeave: 'Sair da sala',
  // segredo
  secretTitle: 'Seu número secreto', secretFor: 'Número secreto de {name}', secretHint: '{n} algarismos diferentes. Ninguém pode olhar.', secretHintNoZero: '{n} algarismos diferentes, sem zero no início. Ninguém pode olhar.',
  confirm: 'Vamos!', hide: 'Cobrir a tela', tapToReveal: 'Toque para ver', secretSaved: 'Número secreto guardado 🔒',
  waitingSecret: 'Esperando {name} escolher o número secreto', bothReady: 'Os dois prontos!',
  // jogo
  turnYou: 'Sua vez! Descubra o número de {name}', turnOther: 'Vez de {name}…', waitingReply: 'Esperando a resposta…', round: 'Rodada {n}',
  blockHint: '💡 Segure um algarismo para riscá-lo. Repita para desfazer.',
  mySecret: 'Seu número secreto', tapToShow: 'toque para ver', tapToHide: 'toque para esconder',
  guess: 'Tentar', famas: 'famas', toques: 'toques', fama: 'fama', toque: 'toque', none: 'nada', famaShort: 'F', toqueShort: 'T',
  boardOf: 'Tentativas de {name}', noGuesses: 'Ainda sem tentativas', tries: '{n} {word}', tryOne: 'tentativa', tryMany: 'tentativas',
  replicaNotice: '{name} acertou! {other} tem uma última tentativa para empatar.',
  // jogar sozinho
  soloHow: [
    'O número secreto tem 4 algarismos diferentes e pode começar com zero.',
    'Escreva um número e toque em Tentar para ver as famas e os toques dele.',
    'Você tem 10 tentativas e o relógio corre enquanto você joga.',
  ],
  scoringTitle: '🏅 Pontuação',
  soloScoring: 'São 100 pontos se você acertar na primeira tentativa e 10 a menos por cada tentativa depois da primeira. Se não descobrir, são 0 pontos.',
  soloStart: '🔢 Começar', soloTitle: '🔢 Descubra o número', soloTimer: '⏱ {t}',
  triesLeft: 'Faltam {n} tentativas.', tryLeft1: 'Falta 1 tentativa.', yourGuesses: 'Suas tentativas',
  solved: 'Você descobriu!', notSolved: 'Acabaram as tentativas. O número era {v}.', seeResults: 'Ver resultado',
  offline: 'Rival desconectado. Esperando ele voltar…', reconnecting: 'Reconectando…',
  // passagem do celular
  hoPass: 'Passe o celular para', hoReady: 'Pronto, sou eu!', hoResult: 'Resposta', hoContinue: 'Continuar',
  // resultado
  winTitle: '{name} ganhou!', tieTitle: 'Empate!', youWin: 'Você ganhou!', youLose: 'Você perdeu… desta vez.',
  inTries: 'em {n} {word}', secretsWere: 'Os números secretos eram', replayTitle: '🔎 Ver todas as tentativas', verified: 'verificado ✅', notVerified: '⚠️ não confere (roubou?)',
  rematch: '🔁 Revanche', rematchWaiting: 'Esperando {name} para a revanche', changeMode: 'Mudar o modo', backMenu: 'Voltar ao menu',
  soloWin: 'Você descobriu!', soloLose: 'Você não descobriu', yourScore: 'Sua pontuação', soloSummary: 'Você usou {n} {word} e o relógio marcou {t}.',
  newRecord: '🏆 Novo recorde!', prevRecord: 'Seu recorde é {s} pontos em {t}.', soloSecretWas: 'O número secreto era', playAgain: '🔁 Jogar de novo',
  resumeTitle: '⏯ Tem uma partida pela metade', resume: 'Continuar', delete: 'Apagar',
};

const DE = {
  docTitle: 'Bullen und Kühe 🔢 · Salonspiele', gameChip: '🔢 Bullen und Kühe', menu: '‹ Menü',
  title: 'Bullen und Kühe',
  lead: 'Jeder wählt eine geheime Zahl ohne doppelte Ziffern. Knack die Zahl deines Gegners, bevor er deine knackt.',
  howTitle: '🧠 So geht’s',
  howText: 'Für jeden Versuch bekommst du Hinweise: Ein <b>Bulle</b> ist eine richtige Ziffer an der richtigen Stelle, eine <b>Kuh</b> eine richtige Ziffer an der falschen Stelle. Wer die Zahl zuerst knackt, gewinnt.',
  example: 'Beispiel: geheime Zahl 1234, Versuch 1356 → 1 Bulle (die 1) und 1 Kuh (die 3).',
  modeLocal: '📱 Ein Handy, zwei Spieler', modeLocalHint: 'Ihr reicht das Handy weiter. Zwischen den Zügen wird der Bildschirm verdeckt.',
  modeOnline: '📡 Zwei Handys', modeOnlineHint: 'Jeder spielt auf seinem eigenen Handy.',
  modeSolo: '🧍 Allein spielen', modeSoloHint: 'Das Handy wählt die geheime Zahl und du knackst sie.',
  // Einstellungen
  setupTitle: 'Wie spielen wir?', digits: 'Ziffern', replica: 'Recht auf Antwort', replicaHint: 'Knackt der Startspieler die Zahl, hat der andere noch einen letzten Versuch zum Ausgleich.',
  zeroFirst: 'Null am Anfang erlauben', yourName: 'Dein Name', p1: 'Spieler 1', p2: 'Spieler 2',
  start: 'Los geht’s!', create: 'Raum erstellen', joinTitle: 'Einem Raum beitreten', codePlaceholder: 'CODE', join: 'Beitreten',
  errName: 'Der Name fehlt.', errNames: 'Namen fehlen oder sind doppelt.', errCode: 'Der Code hat 4 Buchstaben.',
  errNotFound: 'Diesen Raum gibt es nicht. Prüf den Code.', errFull: 'Der Raum ist schon voll.', errExpired: 'Dieser Raum ist abgelaufen.', errOtherGame: 'Dieser Code gehört zu einem anderen Spiel.', errNet: 'Keine Verbindung. Hast du Internet?',
  errOffline: 'Der Raum ließ sich nicht öffnen. Vielleicht liegt es an deinem Internet oder es spielen gerade sehr viele. Versuch es in ein paar Minuten nochmal oder spiel mit einem Handy, dafür brauchst du kein Internet.',
  errTooMany: 'Du hast viele Räume hintereinander geöffnet. Warte kurz und versuch es nochmal.',
  // Raum
  chatTitle: 'Raum-Chat', chatOpen: 'Chat öffnen', chatClose: 'Chat schließen', chatSend: 'Senden',
  chatPlaceholder: 'Schreib was…', chatEmpty: 'Hier könnt ihr euch beim Raten necken. Der Chat wird gelöscht, wenn das Spiel endet.',
  invitedTitle: 'Du bist eingeladen!', invited: '📩 Raum {code}', invitedHint: 'Gib deinen Namen ein und steig ein. Wer dich eingeladen hat, stellt das Spiel ein.',
  lobbyTitle: 'Raum erstellt', lobbyCode: 'Code', lobbyShare: 'Sag deinem Gegner den Code oder lass ihn den QR-Code scannen.', lobbyWaiting: 'Warte auf deinen Gegner', lobbyJoined: '{name} ist dabei!', shareLink: '📤 Link teilen', copyLink: '📋 Link kopieren', copied: 'Kopiert!',
  lobbyCancel: 'Raum auflösen', lobbyLeave: 'Raum verlassen',
  // Geheimzahl
  secretTitle: 'Deine geheime Zahl', secretFor: 'Geheime Zahl von {name}', secretHint: '{n} verschiedene Ziffern. Lass niemanden hinschauen.', secretHintNoZero: '{n} verschiedene Ziffern, ohne Null am Anfang. Lass niemanden hinschauen.',
  confirm: 'Los!', hide: 'Verdecken', tapToReveal: 'Tippen zum Ansehen', secretSaved: 'Geheime Zahl gespeichert 🔒',
  waitingSecret: 'Warte, bis {name} eine geheime Zahl wählt', bothReady: 'Beide bereit!',
  // Spiel
  turnYou: 'Du bist dran! Rate die Zahl von {name}', turnOther: '{name} ist dran…', waitingReply: 'Warte auf die Antwort…', round: 'Runde {n}',
  blockHint: '💡 Halte eine Ziffer gedrückt, um sie durchzustreichen. Nochmal, um das zurückzunehmen.',
  mySecret: 'Deine geheime Zahl', tapToShow: 'tippen zum Zeigen', tapToHide: 'tippen zum Verbergen',
  guess: 'Raten', famas: 'Bullen', toques: 'Kühe', fama: 'Bulle', toque: 'Kuh', none: 'nichts', famaShort: 'B', toqueShort: 'K',
  boardOf: 'Versuche von {name}', noGuesses: 'Noch keine Versuche', tries: '{n} {word}', tryOne: 'Versuch', tryMany: 'Versuche',
  replicaNotice: '{name} hat sie geknackt! {other} hat noch einen letzten Versuch zum Ausgleich.',
  // allein spielen
  soloHow: [
    'Die geheime Zahl hat 4 verschiedene Ziffern und kann mit Null beginnen.',
    'Gib eine Zahl ein und tippe auf Raten, um ihre Bullen und Kühe zu sehen.',
    'Du hast 10 Versuche und die Uhr läuft, während du spielst.',
  ],
  scoringTitle: '🏅 Punkte',
  soloScoring: 'Knackst du sie beim ersten Versuch, gibt es 100 Punkte, für jeden weiteren Versuch 10 weniger. Knackst du sie nicht, gibt es 0 Punkte.',
  soloStart: '🔢 Starten', soloTitle: '🔢 Zahl knacken', soloTimer: '⏱ {t}',
  triesLeft: 'Noch {n} Versuche.', tryLeft1: 'Noch 1 Versuch.', yourGuesses: 'Deine Versuche',
  solved: 'Geknackt!', notSolved: 'Keine Versuche mehr. Die Zahl war {v}.', seeResults: 'Ergebnis',
  offline: 'Gegner getrennt. Warte, bis er zurückkommt…', reconnecting: 'Verbinde neu…',
  // Handy weitergeben
  hoPass: 'Gib das Handy an', hoReady: 'Bereit, ich bin’s!', hoResult: 'Antwort', hoContinue: 'Weiter',
  // Ergebnis
  winTitle: '{name} gewinnt!', tieTitle: 'Unentschieden!', youWin: 'Du hast gewonnen!', youLose: 'Verloren… diesmal.',
  inTries: '({n} {word})', secretsWere: 'Die geheimen Zahlen waren', replayTitle: '🔎 Alle Versuche ansehen', verified: 'geprüft ✅', notVerified: '⚠️ passt nicht (geschummelt?)',
  rematch: '🔁 Revanche', rematchWaiting: 'Warte auf {name} für die Revanche', changeMode: 'Modus ändern', backMenu: 'Zurück zum Menü',
  soloWin: 'Geknackt!', soloLose: 'Nicht geknackt', yourScore: 'Deine Punkte', soloSummary: 'Du hast {n} {word} gebraucht, die Uhr zeigte {t}.',
  newRecord: '🏆 Neuer Rekord!', prevRecord: 'Dein Rekord: {s} Punkte in {t}.', soloSecretWas: 'Die geheime Zahl war', playAgain: '🔁 Nochmal spielen',
  resumeTitle: '⏯ Ein Spiel ist noch offen', resume: 'Weiter', delete: 'Löschen',
};

export const LOCALES = { es: ES, en: EN, pt: PT, de: DE };
