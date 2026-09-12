/**
 * Batalla Naval — configuración por defecto y textos en español, inglés y portugués.
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
  errOffline: 'No se pudo abrir la sala. Puede ser tu internet o que haya mucha gente jugando. Intenta nuevamente en unos minutos o jugar en modo de un solo celular sin conexión a internet.',
  errTooMany: 'Abriste muchas salas seguidas. Espera un ratito y prueba de nuevo.',
  invitedTitle: '¡Invitado a jugar!', invited: '📩 Sala {code}', invitedHint: 'Escribe tu nombre y entra. La partida la configura quien te invitó.',
  lobbyTitle: 'Sala creada', lobbyCode: 'Código', lobbyShare: 'Dile el código al rival o que escanee el QR.', lobbyWaiting: 'Esperando al rival…', lobbyJoined: '¡{name} se unió!', shareLink: '📤 Compartir link', shareText: 'Únete a mi sala de {game}. Código: {code}', copyLink: '📋 Copiar link', copied: '¡Copiado!',
  lobbyCancel: 'Cancelar la sala', lobbyLeave: 'Salir de la sala',
  offline: 'Rival desconectado. Esperando que vuelva…', rematchWaiting: 'Esperando a {name} para la revancha…',
  resumeTitle: '⏯ Hay una batalla a medias', resume: 'Continuar', delete: 'Borrar',
  // colocación
  placeTitle: 'Coloca tu flota', placeFor: 'Flota de {name}', placeHint: 'Toca un barco y luego una casilla. Toca un barco puesto para seleccionarlo: gíralo con ↻, muévelo tocando otra casilla o arrástralo.',
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
  errOffline: 'Couldn\'t open the room. It might be your connection or too many people playing. Try again in a few minutes, or play in one-phone mode, which needs no internet.',
  errTooMany: 'You\'ve opened a lot of rooms in a row. Wait a bit and try again.',
  invitedTitle: 'Invited to play!', invited: '📩 Room {code}', invitedHint: 'Type your name and jump in. Whoever invited you sets up the game.',
  lobbyTitle: 'Room created', lobbyCode: 'Code', lobbyShare: 'Tell your rival the code or let them scan the QR.', lobbyWaiting: 'Waiting for your rival…', lobbyJoined: '{name} joined!', shareLink: '📤 Share link', shareText: 'Join my {game} room. Code: {code}', copyLink: '📋 Copy link', copied: 'Copied!',
  lobbyCancel: 'Cancel the room', lobbyLeave: 'Leave the room',
  offline: 'Rival disconnected. Waiting for them to come back…', rematchWaiting: 'Waiting for {name} for the rematch…',
  resumeTitle: '⏯ There\'s an unfinished battle', resume: 'Continue', delete: 'Delete',
  placeTitle: 'Place your fleet', placeFor: '{name}\'s fleet', placeHint: 'Tap a ship, then a cell. Tap a placed ship to select it: rotate it with ↻, move it by tapping another cell, or drag it.',
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


const PT = {
  docTitle: 'Batalha Naval ⚓ · Jogos de Salão', gameChip: '⚓ Batalha Naval', menu: '‹ Menu',
  title: 'Batalha Naval',
  lead: 'Posicione sua frota em segredo e afunde a do rival antes que ele afunde a sua.',
  howTitle: '🧭 Como se joga',
  howText: 'Cada um esconde 5 navios no seu tabuleiro de 10×10. Nos turnos você atira em uma casa do rival: <b>água</b> se não tem nada, <b>acertou</b> se atingiu um navio e <b>afundou</b> quando completou todas as casas dele. Se acertar, você continua atirando. Ganha quem afunda os 5 navios.',
  modeLocal: '📱 Um celular, dois jogadores', modeLocalHint: 'Vocês passam o celular. Sua frota fica coberta entre os turnos.',
  modeOnline: '📡 Dois celulares', modeOnlineHint: 'Sala com código de 4 letras. Cada um no seu celular.',
  modeCpu: '🤖 Contra o celular', modeCpuHint: 'A IA posiciona a frota dela e caça a sua sem piedade.',
  setupTitle: 'Como vamos jogar?', extraShot: 'Tiro extra ao acertar', extraShotHint: 'Se acertar ou afundar, você atira de novo.', confirmShot: 'Confirmar cada tiro', confirmShotHint: 'Você escolhe a casa e depois toca em Fogo!',
  yourName: 'Seu nome', p1: 'Jogador 1', p2: 'Jogador 2', cpuName: 'Celular', start: 'Bora jogar!',
  errName: 'Falta o nome.', errNames: 'Faltam nomes ou estão repetidos.',
  create: 'Criar sala', joinTitle: 'Entrar em uma sala', codePlaceholder: 'CÓDIGO', join: 'Entrar', errCode: 'O código tem 4 letras.',
  errNotFound: 'Essa sala não existe. Confira o código.', errFull: 'A sala já está cheia.', errExpired: 'Essa sala já expirou.', errOtherGame: 'Esse código é de outro jogo.', errNet: 'Não foi possível conectar. Tem internet?',
  errOffline: 'Não foi possível abrir a sala. Pode ser a sua internet ou muita gente jogando ao mesmo tempo. Tente de novo em alguns minutos ou jogue no modo de um celular só, que não precisa de internet.',
  errTooMany: 'Você abriu muitas salas seguidas. Espere um pouquinho e tente de novo.',
  invitedTitle: 'Convidado para jogar!', invited: '📩 Sala {code}', invitedHint: 'Escreva seu nome e entre. Quem te convidou configura a partida.',
  lobbyTitle: 'Sala criada', lobbyCode: 'Código', lobbyShare: 'Diga o código ao rival ou deixe ele escanear o QR.', lobbyWaiting: 'Esperando o rival…', lobbyJoined: '{name} entrou!', shareLink: '📤 Compartilhar link', shareText: 'Entre na minha sala de {game}. Código: {code}', copyLink: '📋 Copiar link', copied: 'Copiado!',
  lobbyCancel: 'Cancelar a sala', lobbyLeave: 'Sair da sala',
  offline: 'Rival desconectado. Esperando ele voltar…', rematchWaiting: 'Esperando {name} para a revanche…',
  resumeTitle: '⏯ Tem uma batalha pela metade', resume: 'Continuar', delete: 'Apagar',
  // posicionamento
  placeTitle: 'Posicione sua frota', placeFor: 'Frota de {name}', placeHint: 'Toque em um navio e depois em uma casa. Toque em um navio já posicionado para selecioná-lo: gire com ↻, mova tocando em outra casa ou arraste.',
  ships: { carrier: 'Porta-aviões', battleship: 'Encouraçado', cruiser: 'Cruzador', submarine: 'Submarino', destroyer: 'Destróier' },
  rotate: '↻ Girar {dir}', random: '🎲 Aleatório', clear: '🧹 Limpar', sail: '⚓ Zarpar!', placed: '{n} de 5 navios',
  fleetSaved: 'Frota pronta 🔒', waitingFleet: 'Esperando {name} posicionar a frota…', tapToReveal: 'Toque para ver', hoPass: 'Passe o celular para', hoReady: 'Pronto, sou eu!',
  // batalha
  turnYou: 'Sua vez! Atire em {name}', turnOther: '{name} está mirando…', extraGo: '{result} Continue atirando', waitingReply: 'Esperando a resposta…',
  fire: '🎯 Fogo!', pickCell: 'Escolha uma casa', enemyBoard: 'Frota de {name}', myBoard: 'Minha frota', showFleet: 'toque para ver minha frota', hideFleet: 'toque para esconder',
  agua: 'Água', tocado: 'Acertou!', hundido: 'Afundou!', sunkShip: 'Você afundou o {ship} de {name}', sunkMine: 'Afundaram o seu {ship}!',
  cpuShot: 'O celular atirou em {cell}: {result}', shotAt: '{name} atirou em {cell}',
  hoResult: 'Resultado', hoContinue: 'Continuar',
  // resultado
  winTitle: '{name} ganhou!', youWin: 'Você ganhou!', youLose: 'Afundaram você… desta vez.', stats: '{shots} tiros · {acc}% de pontaria', fleetsWere: 'As frotas eram',
  verified: 'verificado ✅', notVerified: '⚠️ não confere (roubou?)', replayTitle: '🔎 Ver todos os tiros', shotsOf: 'Tiros de {name}',
  rematch: '🔁 Revanche', changeMode: 'Mudar o modo', backMenu: 'Voltar ao menu',
};

export const LOCALES = { es: ES, en: EN, pt: PT };
