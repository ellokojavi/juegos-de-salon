/**
 * Batalla Naval — configuración por defecto y textos en español e inglés.
 */
export const GAME_ID = 'batalla-naval';
export const DEFAULT_CONFIG = { extraShot: true, confirmShot: true };

const ES = {
  docTitle: 'Batalla Naval ⚓ · Juegos de Salón', gameChip: '⚓ Batalla Naval', menu: '‹ Menú',
  title: 'Batalla Naval',
  lead: 'Coloca tu flota en secreto y hunde la del rival antes de que hunda la tuya.',
  howTitle: '🧭 Cómo se juega',
  howText: 'Cada uno esconde 5 barcos en su tablero de 10×10. Por turnos disparas a una casilla del rival: <b>agua</b> si no hay nada, <b>tocado</b> si le diste a un barco y <b>hundido</b> cuando completaste todas sus casillas. Si aciertas, sigues disparando. Gana quien hunde los 5 barcos.',
  modeLocal: '📱 Un celular, dos jugadores', modeLocalHint: 'Se pasan el celular. Tu flota queda tapada entre turnos.',
  modeOnline: '📡 Dos celulares', modeOnlineHint: 'Sala con código de 4 letras. Cada uno en su celular.',
  modeCpu: '🤖 Contra el celular', modeCpuHint: 'La IA coloca su flota y caza la tuya sin piedad.',
  setupTitle: '¿Cómo jugamos?', extraShot: 'Tiro extra al acertar', extraShotHint: 'Si tocas o hundes, disparas de nuevo.', confirmShot: 'Confirmar cada disparo', confirmShotHint: 'Eliges la casilla y luego tocas ¡Fuego!',
  yourName: 'Tu nombre', p1: 'Jugador 1', p2: 'Jugador 2', cpuName: 'Celular', start: '¡A jugar!',
  errName: 'Falta el nombre.', errNames: 'Faltan nombres o están repetidos.',
  create: 'Crear sala', joinTitle: 'Unirse a una sala', codePlaceholder: 'CÓDIGO', join: 'Unirse', errCode: 'El código tiene 4 letras.',
  errNotFound: 'No existe esa sala. Revisa el código.', errFull: 'La sala ya está llena.', errExpired: 'Esa sala ya venció.', errOtherGame: 'Ese código es de otro juego.', errNet: 'No se pudo conectar. ¿Hay internet?',
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al rival o que escanee el QR.', lobbyWaiting: 'Esperando al rival…', lobbyJoined: '¡{name} se unió!', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  offline: 'Rival desconectado. Esperando que vuelva…', rematchWaiting: 'Esperando a {name} para la revancha…',
  resumeTitle: '⏯ Hay una batalla a medias', resume: 'Continuar', delete: 'Borrar',
  // colocación
  placeTitle: 'Coloca tu flota', placeFor: 'Flota de {name}', placeHint: 'Toca un barco y luego una casilla. Gira con ↻. Que nadie mire.',
  ships: { carrier: 'Portaaviones', battleship: 'Acorazado', cruiser: 'Crucero', submarine: 'Submarino', destroyer: 'Destructor' },
  rotate: '↻ Girar {dir}', random: '🎲 Al azar', clear: '🧹 Limpiar', sail: '⚓ ¡Zarpar!', placed: '{n} de 5 barcos',
  fleetSaved: 'Flota lista 🔒', waitingFleet: 'Esperando a que {name} coloque su flota…', tapToReveal: 'Toca para ver', hoPass: 'Pásale el celular a', hoReady: '¡Listo, soy yo!',
  // batalla
  turnYou: '¡Te toca! Dispara a {name}', turnOther: '{name} está apuntando…', extraGo: '{result} Sigues disparando', waitingReply: 'Esperando la respuesta…',
  fire: '🎯 ¡Fuego!', pickCell: 'Elige una casilla', enemyBoard: 'Flota de {name}', myBoard: 'Mi flota', showFleet: 'toca para ver mi flota', hideFleet: 'toca para ocultar',
  agua: 'Agua', tocado: '¡Tocado!', hundido: '¡Hundido!', sunkShip: 'Hundiste el {ship} de {name}', sunkMine: '¡Te hundieron el {ship}!',
  cpuShot: 'El celular disparó a {cell}: {result}', shotAt: '{name} disparó a {cell}',
  hoResult: 'Resultado', hoContinue: 'Seguir',
  // resultado
  winTitle: '¡Ganó {name}!', youWin: '¡Ganaste!', youLose: 'Te hundieron… esta vez.', stats: '{shots} disparos · {acc}% puntería', fleetsWere: 'Las flotas eran',
  verified: 'verificado ✅', notVerified: '⚠️ no coincide (¿trampa?)', replayTitle: '🔎 Ver todos los disparos', shotsOf: 'Disparos de {name}',
  rematch: '🔁 Revancha', changeMode: 'Cambiar modo', backMenu: 'Volver al menú',
};

const EN = {
  docTitle: 'Battleship ⚓ · Party Games', gameChip: '⚓ Battleship', menu: '‹ Menu',
  title: 'Battleship',
  lead: 'Hide your fleet and sink your rival\'s before they sink yours.',
  howTitle: '🧭 How to play',
  howText: 'Each player hides 5 ships on a 10×10 board. Take turns firing at a cell on your rival\'s board: <b>miss</b> if there\'s nothing, <b>hit</b> if you struck a ship and <b>sunk</b> when you\'ve hit all its cells. Hit and you fire again. First to sink all 5 ships wins.',
  modeLocal: '📱 One phone, two players', modeLocalHint: 'Pass the phone around. Your fleet stays hidden between turns.',
  modeOnline: '📡 Two phones', modeOnlineHint: 'A room with a 4-letter code. Each player on their own phone.',
  modeCpu: '🤖 Versus the phone', modeCpuHint: 'The AI places its fleet and hunts yours without mercy.',
  setupTitle: 'How do we play?', extraShot: 'Extra shot on a hit', extraShotHint: 'Hit or sink and you fire again.', confirmShot: 'Confirm every shot', confirmShotHint: 'Pick the cell, then tap Fire!',
  yourName: 'Your name', p1: 'Player 1', p2: 'Player 2', cpuName: 'Phone', start: 'Let\'s play!',
  errName: 'Name missing.', errNames: 'Names missing or repeated.',
  create: 'Create room', joinTitle: 'Join a room', codePlaceholder: 'CODE', join: 'Join', errCode: 'The code has 4 letters.',
  errNotFound: 'That room doesn\'t exist. Check the code.', errFull: 'That room is full.', errExpired: 'That room has expired.', errOtherGame: 'That code belongs to another game.', errNet: 'Could not connect. Is there internet?',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell your rival the code or let them scan the QR.', lobbyWaiting: 'Waiting for your rival…', lobbyJoined: '{name} joined!', copyLink: '📋 Copy link', copied: 'Copied!',
  offline: 'Rival disconnected. Waiting for them to come back…', rematchWaiting: 'Waiting for {name} for the rematch…',
  resumeTitle: '⏯ There\'s an unfinished battle', resume: 'Continue', delete: 'Delete',
  placeTitle: 'Place your fleet', placeFor: '{name}\'s fleet', placeHint: 'Tap a ship, then a cell. Rotate with ↻. No peeking.',
  ships: { carrier: 'Carrier', battleship: 'Battleship', cruiser: 'Cruiser', submarine: 'Submarine', destroyer: 'Destroyer' },
  rotate: '↻ Rotate {dir}', random: '🎲 Random', clear: '🧹 Clear', sail: '⚓ Set sail!', placed: '{n} of 5 ships',
  fleetSaved: 'Fleet ready 🔒', waitingFleet: 'Waiting for {name} to place their fleet…', tapToReveal: 'Tap to reveal', hoPass: 'Pass the phone to', hoReady: 'Ready, it\'s me!',
  turnYou: 'Your turn! Fire at {name}', turnOther: '{name} is aiming…', extraGo: '{result} Fire again', waitingReply: 'Waiting for the reply…',
  fire: '🎯 Fire!', pickCell: 'Pick a cell', enemyBoard: '{name}\'s fleet', myBoard: 'My fleet', showFleet: 'tap to show my fleet', hideFleet: 'tap to hide',
  agua: 'Miss', tocado: 'Hit!', hundido: 'Sunk!', sunkShip: 'You sank {name}\'s {ship}', sunkMine: 'They sank your {ship}!',
  cpuShot: 'The phone fired at {cell}: {result}', shotAt: '{name} fired at {cell}',
  hoResult: 'Result', hoContinue: 'Continue',
  winTitle: '{name} wins!', youWin: 'You win!', youLose: 'You got sunk… this time.', stats: '{shots} shots · {acc}% accuracy', fleetsWere: 'The fleets were',
  verified: 'verified ✅', notVerified: '⚠️ mismatch (cheating?)', replayTitle: '🔎 See all shots', shotsOf: '{name}\'s shots',
  rematch: '🔁 Rematch', changeMode: 'Change mode', backMenu: 'Back to menu',
};

export const LOCALES = { es: ES, en: EN };
