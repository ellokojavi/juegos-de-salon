/**
 * Toque y Fama — configuración por defecto y textos en español e inglés.
 */
export const GAME_ID = 'toque-y-fama';
export const DEFAULT_CONFIG = { digits: 4, replica: true, zeroFirst: true };
export const DIGIT_OPTIONS = [3, 4, 5];

const ES = {
  docTitle: 'Toque y Fama 🔢 · Juegos de Salón', gameChip: '🔢 Toque y Fama', menu: '‹ Menú',
  title: 'Toque y Fama',
  lead: 'Cada uno elige un número secreto de cifras distintas. Adivina el del rival antes de que adivine el tuyo.',
  howTitle: '🧠 Cómo se juega',
  howText: 'Por cada intento recibes pistas: <b>fama</b> es una cifra correcta en su lugar, <b>toque</b> es una cifra correcta en otro lugar. Gana quien llega a todas las famas. El celular cuenta solo, nadie hace trampa.',
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
  // lobby
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al rival o que escanee el QR.', lobbyWaiting: 'Esperando al rival…', lobbyJoined: '¡{name} se unió!', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  // secret
  secretTitle: 'Tu número secreto', secretFor: 'Número secreto de {name}', secretHint: '{n} cifras distintas. Que nadie mire.', secretHintNoZero: '{n} cifras distintas, sin cero al inicio. Que nadie mire.',
  confirm: '¡Vamos!', hide: 'Tapar pantalla', tapToReveal: 'Toca para ver', secretSaved: 'Número secreto guardado 🔒',
  waitingSecret: 'Esperando a que {name} elija su número secreto…', bothReady: '¡Los dos listos!',
  // play
  turnYou: '¡Te toca! Adivina el de {name}', turnOther: 'Le toca a {name}…', waitingReply: 'Esperando la respuesta…', starts: 'Parte {name}',
  blockHint: '💡 Mantén presionada una cifra para bloquearla si crees que no está en el número del rival. Repite para desbloquear.',
  mySecret: 'Tu número secreto', tapToShow: 'toca para ver', tapToHide: 'toca para ocultar',
  guess: 'Probar', famas: 'famas', toques: 'toques', fama: 'fama', toque: 'toque', none: 'nada',
  boardOf: 'Intentos de {name}', noGuesses: 'Aún sin intentos', tries: '{n} intentos',
  replicaNotice: '¡{name} acertó! {other} tiene derecho a réplica: un último intento.',
  cpuThinking: 'El celular está pensando…', cpuGuessed: 'El celular probó {value}: {famas} famas, {toques} toques.',
  offline: 'Rival desconectado. Esperando que vuelva…', reconnecting: 'Reconectando…',
  // handoff
  hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!', hoResult: 'Respuesta', hoContinue: 'Seguir',
  // result
  winTitle: '¡Ganó {name}!', tieTitle: '¡Empate!', youWin: '¡Ganaste!', youLose: 'Perdiste… esta vez.',
  inTries: 'en {n} intentos', secretsWere: 'Los números secretos eran', verified: 'verificado ✅', notVerified: '⚠️ no coincide (¿trampa?)',
  rematch: '🔁 Revancha', rematchWaiting: 'Esperando a {name} para la revancha…', changeMode: 'Cambiar modo', backMenu: 'Volver al menú',
  resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
};

const EN = {
  docTitle: 'Bulls and Cows 🔢 · Party Games', gameChip: '🔢 Bulls and Cows', menu: '‹ Menu',
  title: 'Bulls and Cows',
  lead: 'Each player picks a secret number with no repeated digits. Crack your rival\'s number before they crack yours.',
  howTitle: '🧠 How to play',
  howText: 'Every guess gets clues: a <b>bull</b> is a right digit in the right spot, a <b>cow</b> is a right digit in the wrong spot. First to score all bulls wins. The phone keeps score, so nobody can cheat.',
  example: 'Example: secret number 1234, guess 1356 → 1 bull (the 1) and 1 cow (the 3).',
  modeLocal: '📱 One phone, two players', modeLocalHint: 'Pass the phone around. The screen hides between turns.',
  modeOnline: '📡 Two phones', modeOnlineHint: 'A room with a 4-letter code. Each player on their own phone.',
  modeCpu: '🤖 Versus the phone', modeCpuHint: 'Duel: you guess its number while it guesses yours.',
  setupTitle: 'How do we play?', digits: 'Digits', replica: 'Right of reply', replicaHint: 'If the starter hits, the other player gets one last guess.',
  zeroFirst: 'Allow leading zero', yourName: 'Your name', p1: 'Player 1', p2: 'Player 2', cpuName: 'Phone',
  start: 'Let\'s play!', create: 'Create room', joinTitle: 'Join a room', codePlaceholder: 'CODE', join: 'Join',
  errName: 'Name missing.', errNames: 'Names missing or repeated.', errCode: 'The code has 4 letters.',
  errNotFound: 'That room doesn\'t exist. Check the code.', errFull: 'That room is full.', errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.', errNet: 'Could not connect. Is there internet?',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell your rival the code or let them scan the QR.', lobbyWaiting: 'Waiting for your rival…', lobbyJoined: '{name} joined!', copyLink: '📋 Copy link', copied: 'Copied!',
  secretTitle: 'Your secret number', secretFor: '{name}\'s secret number', secretHint: '{n} different digits. No peeking.', secretHintNoZero: '{n} different digits, no leading zero. No peeking.',
  confirm: 'Let\'s go!', hide: 'Hide screen', tapToReveal: 'Tap to reveal', secretSaved: 'Secret number saved 🔒',
  waitingSecret: 'Waiting for {name} to pick a secret number…', bothReady: 'Both ready!',
  turnYou: 'Your turn! Guess {name}\'s number', turnOther: '{name}\'s turn…', waitingReply: 'Waiting for the reply…', starts: '{name} starts',
  blockHint: '💡 Long-press a digit to block it if you think it isn\'t in your rival\'s number. Long-press again to unblock.',
  mySecret: 'Your secret number', tapToShow: 'tap to show', tapToHide: 'tap to hide',
  guess: 'Guess', famas: 'bulls', toques: 'cows', fama: 'bull', toque: 'cow', none: 'nothing',
  boardOf: '{name}\'s guesses', noGuesses: 'No guesses yet', tries: '{n} guesses',
  replicaNotice: '{name} got it! {other} has the right of reply: one last guess.',
  cpuThinking: 'The phone is thinking…', cpuGuessed: 'The phone tried {value}: {famas} bulls, {toques} cows.',
  offline: 'Rival disconnected. Waiting for them to come back…', reconnecting: 'Reconnecting…',
  hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!', hoResult: 'Reply', hoContinue: 'Continue',
  winTitle: '{name} wins!', tieTitle: 'It\'s a tie!', youWin: 'You win!', youLose: 'You lose… this time.',
  inTries: 'in {n} guesses', secretsWere: 'The secret numbers were', verified: 'verified ✅', notVerified: '⚠️ mismatch (cheating?)',
  rematch: '🔁 Rematch', rematchWaiting: 'Waiting for {name} for the rematch…', changeMode: 'Change mode', backMenu: 'Back to menu',
  resumeTitle: '⏯ There\'s an unfinished game', resume: 'Continue', delete: 'Delete',
};

export const LOCALES = { es: ES, en: EN };
