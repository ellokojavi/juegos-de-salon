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
  howText: 'Debes adivinar el número secreto de tu contendor antes de que adivine el tuyo. Por cada intento recibes pistas: <b>fama</b> es una cifra correcta en su lugar, <b>toque</b> es una cifra correcta en otro lugar. Gana quien llega a todas las famas. El celular cuenta solo, nadie hace trampa.',
  example: 'Ejemplo: número secreto 1234, intento 1356 → 1 fama (el 1) y 1 toque (el 3).',
  modeLocal: '📱 Un celular, dos jugadores', modeLocalHint: 'Se pasan el celular. La pantalla se tapa entre turnos.',
  modeOnline: '📡 Dos celulares', modeOnlineHint: 'Sala con código de 4 letras. Cada uno en su celular.',
  modeCpu: '🤖 Contra el celular', modeCpuHint: 'Duelo: tú adivinas el suyo y él intenta adivinar el tuyo.',
  // setup
  setupTitle: '¿Cómo jugamos?', digits: 'Cifras', replica: 'Derecho a réplica', replicaHint: 'Si el que parte acierta, el otro tiene un último intento.',
  zeroFirst: 'Permitir cero al inicio', yourName: 'Tu nombre', p1: 'Jugador 1', p2: 'Jugador 2', cpuName: 'Celular',
  start: '¡A jugar!', create: 'Crear sala', joinTitle: 'Unirse a una sala', codePlaceholder: 'CÓDIGO', join: 'Unirse',
  errName: 'Falta el nombre.', errNames: 'Faltan nombres o están repetidos.', errCode: 'El código tiene 4 letras.',
  errNotFound: 'No existe esa sala. Revisa el código.', errFull: 'La sala ya está llena.', errExpired: 'Esa sala ya venció.', errOtherGame: 'Ese código es de otro juego.', errNet: 'No se pudo conectar. ¿Hay internet?',
  errOffline: 'No se pudo abrir la sala. Puede ser tu internet o que haya mucha gente jugando. Intenta nuevamente en unos minutos o jugar en modo de un solo celular sin conexión a internet.',
  errTooMany: 'Abriste muchas salas seguidas. Espera un ratito y prueba de nuevo.',
  // lobby
  chatTitle: 'Chat de la sala', chatOpen: 'Abrir el chat', chatClose: 'Cerrar el chat', chatSend: 'Enviar',
  chatPlaceholder: 'Escribe algo…', chatEmpty: 'Acá pueden picarse mientras adivinan. Se borra cuando termina la partida.',
  invitedTitle: '¡Invitado a jugar!', invited: '📩 Sala {code}', invitedHint: 'Escribe tu nombre y entra. La partida la configura quien te invitó.',
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al rival o que escanee el QR.', lobbyWaiting: 'Esperando al rival…', lobbyJoined: '¡{name} se unió!', shareLink: '📤 Compartir link', shareText: 'Únete a mi sala de {game}. Código: {code}', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  // secret
  secretTitle: 'Tu número secreto', secretFor: 'Número secreto de {name}', secretHint: '{n} cifras distintas. Que nadie mire.', secretHintNoZero: '{n} cifras distintas, sin cero al inicio. Que nadie mire.',
  confirm: '¡Vamos!', hide: 'Tapar pantalla', tapToReveal: 'Toca para ver', secretSaved: 'Número secreto guardado 🔒',
  waitingSecret: 'Esperando a que {name} elija su número secreto…', bothReady: '¡Los dos listos!',
  // play
  turnYou: '¡Te toca! Adivina el de {name}', turnOther: 'Le toca a {name}…', waitingReply: 'Esperando la respuesta…', round: 'Ronda {n}',
  blockHint: '💡 Mantén presionada una cifra para bloquearla si crees que no está en el número del rival. Repite para desbloquear.',
  mySecret: 'Tu número secreto', tapToShow: 'toca para ver', tapToHide: 'toca para ocultar',
  guess: 'Probar', famas: 'famas', toques: 'toques', fama: 'fama', toque: 'toque', none: 'nada', famaShort: 'F', toqueShort: 'T',
  boardOf: 'Intentos de {name}', noGuesses: 'Aún sin intentos', tries: '{n} {word}', tryOne: 'intento', tryMany: 'intentos',
  replicaNotice: '¡{name} acertó! {other} tiene derecho a réplica: un último intento.',
  cpuThinking: 'El celular está pensando…', cpuGuessed: 'El celular probó {value}: {famas} famas, {toques} toques.',
  offline: 'Rival desconectado. Esperando que vuelva…', reconnecting: 'Reconectando…',
  // handoff
  hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!', hoResult: 'Respuesta', hoContinue: 'Seguir',
  // result
  winTitle: '¡Ganó {name}!', tieTitle: '¡Empate!', youWin: '¡Ganaste!', youLose: 'Perdiste… esta vez.',
  inTries: 'en {n} {word}', secretsWere: 'Los números secretos eran', replayTitle: '🔎 Ver todos los intentos', verified: 'verificado ✅', notVerified: '⚠️ no coincide (¿trampa?)',
  rematch: '🔁 Revancha', rematchWaiting: 'Esperando a {name} para la revancha…', changeMode: 'Cambiar modo', backMenu: 'Volver al menú',
  resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
};

const EN = {
  docTitle: 'Bulls and Cows 🔢 · Party Games', gameChip: '🔢 Bulls and Cows', menu: '‹ Menu',
  title: 'Bulls and Cows',
  lead: 'Each player picks a secret number with no repeated digits. Crack your rival\'s number before they crack yours.',
  howTitle: '🧠 How to play',
  howText: 'You must guess your opponent\'s secret number before they guess yours. Every guess gets clues: a <b>bull</b> is a right digit in the right spot, a <b>cow</b> is a right digit in the wrong spot. First to score all bulls wins. The phone keeps score, so nobody can cheat.',
  example: 'Example: secret number 1234, guess 1356 → 1 bull (the 1) and 1 cow (the 3).',
  modeLocal: '📱 One phone, two players', modeLocalHint: 'Pass the phone around. The screen hides between turns.',
  modeOnline: '📡 Two phones', modeOnlineHint: 'A room with a 4-letter code. Each player on their own phone.',
  modeCpu: '🤖 Versus the phone', modeCpuHint: 'Duel: you guess its number while it guesses yours.',
  setupTitle: 'How do we play?', digits: 'Digits', replica: 'Right of reply', replicaHint: 'If the starter hits, the other player gets one last guess.',
  zeroFirst: 'Allow leading zero', yourName: 'Your name', p1: 'Player 1', p2: 'Player 2', cpuName: 'Phone',
  start: 'Let\'s play!', create: 'Create room', joinTitle: 'Join a room', codePlaceholder: 'CODE', join: 'Join',
  errName: 'Name missing.', errNames: 'Names missing or repeated.', errCode: 'The code has 4 letters.',
  errNotFound: 'That room doesn\'t exist. Check the code.', errFull: 'That room is full.', errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.', errNet: 'Could not connect. Is there internet?',
  errOffline: 'Couldn\'t open the room. It might be your connection or too many people playing. Try again in a few minutes, or play in one-phone mode, which needs no internet.',
  errTooMany: 'You\'ve opened a lot of rooms in a row. Wait a bit and try again.',
  chatTitle: 'Room chat', chatOpen: 'Open the chat', chatClose: 'Close the chat', chatSend: 'Send',
  chatPlaceholder: 'Say something…', chatEmpty: 'Trash talk while you guess. It disappears when the game ends.',
  invitedTitle: 'Invited to play!', invited: '📩 Room {code}', invitedHint: 'Type your name and jump in. Whoever invited you sets up the game.',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell your rival the code or let them scan the QR.', lobbyWaiting: 'Waiting for your rival…', lobbyJoined: '{name} joined!', shareLink: '📤 Share link', shareText: 'Join my {game} room. Code: {code}', copyLink: '📋 Copy link', copied: 'Copied!',
  secretTitle: 'Your secret number', secretFor: '{name}\'s secret number', secretHint: '{n} different digits. No peeking.', secretHintNoZero: '{n} different digits, no leading zero. No peeking.',
  confirm: 'Let\'s go!', hide: 'Hide screen', tapToReveal: 'Tap to reveal', secretSaved: 'Secret number saved 🔒',
  waitingSecret: 'Waiting for {name} to pick a secret number…', bothReady: 'Both ready!',
  turnYou: 'Your turn! Guess {name}\'s number', turnOther: '{name}\'s turn…', waitingReply: 'Waiting for the reply…', round: 'Round {n}',
  blockHint: '💡 Long-press a digit to block it if you think it isn\'t in your rival\'s number. Long-press again to unblock.',
  mySecret: 'Your secret number', tapToShow: 'tap to show', tapToHide: 'tap to hide',
  guess: 'Guess', famas: 'bulls', toques: 'cows', fama: 'bull', toque: 'cow', none: 'nothing', famaShort: 'B', toqueShort: 'C',
  boardOf: '{name}\'s guesses', noGuesses: 'No guesses yet', tries: '{n} {word}', tryOne: 'guess', tryMany: 'guesses',
  replicaNotice: '{name} got it! {other} has the right of reply: one last guess.',
  cpuThinking: 'The phone is thinking…', cpuGuessed: 'The phone tried {value}: {famas} bulls, {toques} cows.',
  offline: 'Rival disconnected. Waiting for them to come back…', reconnecting: 'Reconnecting…',
  hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!', hoResult: 'Reply', hoContinue: 'Continue',
  winTitle: '{name} wins!', tieTitle: 'It\'s a tie!', youWin: 'You win!', youLose: 'You lose… this time.',
  inTries: 'in {n} {word}', secretsWere: 'The secret numbers were', replayTitle: '🔎 See all guesses', verified: 'verified ✅', notVerified: '⚠️ mismatch (cheating?)',
  rematch: '🔁 Rematch', rematchWaiting: 'Waiting for {name} for the rematch…', changeMode: 'Change mode', backMenu: 'Back to menu',
  resumeTitle: '⏯ There\'s an unfinished game', resume: 'Continue', delete: 'Delete',
};


const PT = {
  docTitle: 'Toque e Fama 🔢 · Jogos de Salão', gameChip: '🔢 Toque e Fama', menu: '‹ Menu',
  title: 'Toque e Fama',
  lead: 'Cada um escolhe um número secreto com algarismos diferentes. Descubra o do rival antes que ele descubra o seu.',
  howTitle: '🧠 Como se joga',
  howText: 'Você precisa descobrir o número secreto do adversário antes que ele descubra o seu. A cada tentativa você recebe pistas: <b>fama</b> é um algarismo certo no lugar certo, <b>toque</b> é um algarismo certo em outro lugar. Ganha quem chega a todas as famas. O celular conta sozinho, ninguém rouba.',
  example: 'Exemplo: número secreto 1234, tentativa 1356 → 1 fama (o 1) e 1 toque (o 3).',
  modeLocal: '📱 Um celular, dois jogadores', modeLocalHint: 'Vocês passam o celular. A tela fica coberta entre os turnos.',
  modeOnline: '📡 Dois celulares', modeOnlineHint: 'Sala com código de 4 letras. Cada um no seu celular.',
  modeCpu: '🤖 Contra o celular', modeCpuHint: 'Duelo: você tenta descobrir o número dele e ele tenta descobrir o seu.',
  // configuração
  setupTitle: 'Como vamos jogar?', digits: 'Algarismos', replica: 'Direito de resposta', replicaHint: 'Se quem começa acerta, o outro tem uma última tentativa.',
  zeroFirst: 'Permitir zero no início', yourName: 'Seu nome', p1: 'Jogador 1', p2: 'Jogador 2', cpuName: 'Celular',
  start: 'Bora jogar!', create: 'Criar sala', joinTitle: 'Entrar em uma sala', codePlaceholder: 'CÓDIGO', join: 'Entrar',
  errName: 'Falta o nome.', errNames: 'Faltam nomes ou estão repetidos.', errCode: 'O código tem 4 letras.',
  errNotFound: 'Essa sala não existe. Confira o código.', errFull: 'A sala já está cheia.', errExpired: 'Essa sala já expirou.', errOtherGame: 'Esse código é de outro jogo.', errNet: 'Não foi possível conectar. Tem internet?',
  errOffline: 'Não foi possível abrir a sala. Pode ser a sua internet ou muita gente jogando ao mesmo tempo. Tente de novo em alguns minutos ou jogue no modo de um celular só, que não precisa de internet.',
  errTooMany: 'Você abriu muitas salas seguidas. Espere um pouquinho e tente de novo.',
  // sala
  chatTitle: 'Chat da sala', chatOpen: 'Abrir o chat', chatClose: 'Fechar o chat', chatSend: 'Enviar',
  chatPlaceholder: 'Escreva algo…', chatEmpty: 'Aqui vocês podem se provocar enquanto tentam adivinhar. Some quando a partida termina.',
  invitedTitle: 'Convidado para jogar!', invited: '📩 Sala {code}', invitedHint: 'Escreva seu nome e entre. Quem te convidou configura a partida.',
  lobbyTitle: 'Sala criada', lobbyCode: 'Código', lobbyShare: 'Diga o código ao rival ou deixe ele escanear o QR.', lobbyWaiting: 'Esperando o rival…', lobbyJoined: '{name} entrou!', shareLink: '📤 Compartilhar link', shareText: 'Entre na minha sala de {game}. Código: {code}', copyLink: '📋 Copiar link', copied: 'Copiado!',
  // segredo
  secretTitle: 'Seu número secreto', secretFor: 'Número secreto de {name}', secretHint: '{n} algarismos diferentes. Ninguém pode olhar.', secretHintNoZero: '{n} algarismos diferentes, sem zero no início. Ninguém pode olhar.',
  confirm: 'Vamos!', hide: 'Cobrir a tela', tapToReveal: 'Toque para ver', secretSaved: 'Número secreto guardado 🔒',
  waitingSecret: 'Esperando {name} escolher o número secreto…', bothReady: 'Os dois prontos!',
  // jogo
  turnYou: 'Sua vez! Descubra o número de {name}', turnOther: 'Vez de {name}…', waitingReply: 'Esperando a resposta…', round: 'Rodada {n}',
  blockHint: '💡 Segure um algarismo para bloqueá-lo se você acha que ele não está no número do rival. Repita para desbloquear.',
  mySecret: 'Seu número secreto', tapToShow: 'toque para ver', tapToHide: 'toque para esconder',
  guess: 'Tentar', famas: 'famas', toques: 'toques', fama: 'fama', toque: 'toque', none: 'nada', famaShort: 'F', toqueShort: 'T',
  boardOf: 'Tentativas de {name}', noGuesses: 'Ainda sem tentativas', tries: '{n} {word}', tryOne: 'tentativa', tryMany: 'tentativas',
  replicaNotice: '{name} acertou! {other} tem direito de resposta: uma última tentativa.',
  cpuThinking: 'O celular está pensando…', cpuGuessed: 'O celular tentou {value}: {famas} famas, {toques} toques.',
  offline: 'Rival desconectado. Esperando ele voltar…', reconnecting: 'Reconectando…',
  // passagem do celular
  hoPass: 'Passe o celular para', hoReady: 'Pronto, sou eu!', hoResult: 'Resposta', hoContinue: 'Continuar',
  // resultado
  winTitle: '{name} ganhou!', tieTitle: 'Empate!', youWin: 'Você ganhou!', youLose: 'Você perdeu… desta vez.',
  inTries: 'em {n} {word}', secretsWere: 'Os números secretos eram', replayTitle: '🔎 Ver todas as tentativas', verified: 'verificado ✅', notVerified: '⚠️ não confere (roubou?)',
  rematch: '🔁 Revanche', rematchWaiting: 'Esperando {name} para a revanche…', changeMode: 'Mudar o modo', backMenu: 'Voltar ao menu',
  resumeTitle: '⏯ Tem uma partida pela metade', resume: 'Continuar', delete: 'Apagar',
};

export const LOCALES = { es: ES, en: EN, pt: PT };
