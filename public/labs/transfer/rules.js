/**
 * Transfer: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/transfer.md.
 *
 * The map is the real Santiago Metro, centre stretch. Each level uses some of its lines; `solution` holds hand indices (the engine test proves every one works).
 */

export const GAME_ID = 'transfer';
export const HEARTS = 3;

/**
 * The stations, real ones of Santiago's Metro, placed by their real coordinates (OpenStreetMap,
 * © OpenStreetMap contributors, ODbL): x grows east and y south, about 10 units per 100 m. `label` is
 * the side its name goes (l, r, t, b, or tl: above to the left), chosen by hand so the dense centre stays legible.
 */
export const STATIONS = {
  heroes: { name: 'Los Héroes', x: 166, y: 284, label: 'l' }, moneda: { name: 'La Moneda', x: 212, y: 272, label: 'b' },
  uchile: { name: 'Universidad de Chile', x: 247, y: 262, label: 'tl' }, lucia: { name: 'Santa Lucía', x: 297, y: 248, label: 'b' },
  catolica: { name: 'Universidad Católica', x: 337, y: 221, label: 'r' }, baquedano: { name: 'Baquedano', x: 393, y: 199, label: 't' },
  salvador: { name: 'Salvador', x: 452, y: 150, label: 'r' }, montt: { name: 'Manuel Montt', x: 506, y: 109, label: 'r' },
  patronato: { name: 'Patronato', x: 277, y: 121, label: 'r' }, calycanto: { name: 'Puente Cal y Canto', x: 226, y: 151, label: 'r' },
  ana: { name: 'Santa Ana', x: 172, y: 205, label: 'l' }, toesca: { name: 'Toesca', x: 180, y: 347, label: 'l' },
  ohiggins: { name: "Parque O'Higgins", x: 196, y: 440, label: 'r' }, hospitales: { name: 'Hospitales', x: 199, y: 0, label: 'r' },
  armas: { name: 'Plaza de Armas', x: 250, y: 196, label: 'b' }, almagro: { name: 'Parque Almagro', x: 248, y: 337, label: 'r' },
  matta: { name: 'Matta', x: 311, y: 406, label: 'b' }, irarrazaval: { name: 'Irarrázaval', x: 436, y: 373, label: 'b' },
  quinta: { name: 'Quinta Normal', x: 0, y: 227, label: 't' }, cumming: { name: 'Cumming', x: 98, y: 215, label: 'b' },
  bellas: { name: 'Bellas Artes', x: 302, y: 189, label: 't' }, bustamante: { name: 'Parque Bustamante', x: 404, y: 251, label: 'r' },
  isabel: { name: 'Santa Isabel', x: 416, y: 294, label: 'r' },
};

/**
 * The lines: the real number and colour (a class in style.css), the stretch the levels use in its real
 * order, and `ends`, the real terminals the platforms are named after (the first towards stops[0]).
 */
const LINE = {
  l1: { id: 'l1', n: 1, ends: ['San Pablo', 'Los Dominicos'], stops: ['heroes', 'moneda', 'uchile', 'lucia', 'catolica', 'baquedano', 'salvador', 'montt'] },
  l2: { id: 'l2', n: 2, ends: ['Vespucio Norte', 'Hospital El Pino'], stops: ['patronato', 'calycanto', 'ana', 'heroes', 'toesca', 'ohiggins'] },
  l3: { id: 'l3', n: 3, ends: ['Plaza Quilicura', 'Fernando Castillo Velasco'], stops: ['hospitales', 'calycanto', 'armas', 'uchile', 'almagro', 'matta', 'irarrazaval'] },
  l5: { id: 'l5', n: 5, ends: ['Plaza de Maipú', 'Vicente Valdés'], stops: ['quinta', 'cumming', 'ana', 'armas', 'bellas', 'baquedano', 'bustamante', 'isabel', 'irarrazaval'] },
};
const cut = (line, from, to) => ({ ...line, stops: line.stops.slice(line.stops.indexOf(from), line.stops.indexOf(to) + 1) });

const ride = n => ({ t: 'ride', n });
const END = { t: 'end' };
const TURN = { t: 'turn' };
const change = (line, toward) => ({ t: 'change', line, toward });

/** The five levels, easiest first: one rule more each time. */
export const LEVELS = [
  { // 1 · counting stations, along the Alameda
    lines: [cut(LINE.l1, 'heroes', 'baquedano')], start: { station: 'heroes', line: 'l1', toward: 'baquedano' }, goal: 'lucia',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    lines: [cut(LINE.l1, 'heroes', 'montt')], start: { station: 'catolica', line: 'l1', toward: 'montt' }, goal: 'moneda',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer at Baquedano
    lines: [cut(LINE.l1, 'heroes', 'montt'), cut(LINE.l5, 'armas', 'isabel')], start: { station: 'heroes', line: 'l1', toward: 'montt' }, goal: 'bellas',
    hand: [change('l5', 'isabel'), ride(5), ride(4), change('l5', 'armas'), ride(1), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Universidad de Chile closed: around it
    lines: [cut(LINE.l1, 'heroes', 'baquedano'), cut(LINE.l2, 'patronato', 'ohiggins'), cut(LINE.l3, 'calycanto', 'matta'), cut(LINE.l5, 'cumming', 'baquedano')],
    closed: ['uchile'], start: { station: 'heroes', line: 'l1', toward: 'baquedano' }, goal: 'armas',
    hand: [ride(3), change('l2', 'patronato'), change('l5', 'baquedano'), change('l2', 'ohiggins'), ride(1), ride(2), change('l5', 'cumming'), ride(1)],
    slots: 4, solution: [1, 4, 2, 7],
  },
  { // 5 · passing through Bellas Artes
    lines: [cut(LINE.l1, 'heroes', 'baquedano'), cut(LINE.l2, 'calycanto', 'ohiggins'), cut(LINE.l3, 'calycanto', 'irarrazaval'), cut(LINE.l5, 'ana', 'irarrazaval')],
    via: 'bellas', start: { station: 'toesca', line: 'l2', toward: 'calycanto' }, goal: 'matta',
    hand: [ride(2), change('l5', 'irarrazaval'), END, change('l3', 'calycanto'), ride(1), change('l1', 'baquedano'), change('l3', 'irarrazaval'), ride(6)],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

const ES = {
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendió, si fue fácil o difícil y qué le cambiarías.', ph: 'Por ejemplo: no me di cuenta de que se podía voltear una carta.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  ui: {
    comentarAbrir: '💬 Sugerencias y comentarios',
    docTitle: 'Transbordo 🚉 · Juegos de Salón', gameChip: '🚉 Transbordo', menu: '‹ Laboratorio',
    title: 'Transbordo', lead: 'Arma la ruta con tus cartas y viaja por el Metro de Santiago.',
    howTitle: '🚉 Cómo se juega',
    modeSolo: 'Cinco viajes', modeSoloHint: 'Solo, cada uno más difícil',
    resumeTitle: '⏯ Hay un viaje a medias', resume: 'Continuar', delete: 'Borrar',
    levelOf: 'Viaje {n} de {total}', from: 'Sales de', to: 'Llegas a', via: 'Pasando por', closedLabel: 'Cerrada',
    heading: 'dirección {station}', plan: 'Tu ruta', hand: 'Tus cartas', go: '🚇 ¡Vamos!', clear: 'Vaciar', hintBtn: '💡 Pista (−❤️)',
    rideN: 'Avanza {n}', rideOne: 'Avanza 1', end: 'Hasta el final', turn: 'Otro andén', changeTo: 'Combina a {line}',
    lineN: 'Línea {n}', city: 'Metro de Santiago', mapCredit: 'Estaciones y trazados reales (© colaboradores de OpenStreetMap).',
    okLevel: '¡Llegaste! {stars}', next: 'Siguiente viaje ›', retry: 'Probar otra ruta', lostLevel: 'Sin corazones: seguimos con el próximo viaje.',
    pastEnd: 'La línea se acabó antes.', closed: '{station} está cerrada: el tren no pasa.', noChange: '{line} no pasa por {station}.',
    atTerminal: 'Ya estabas al final de la línea.', notGoal: 'Terminaste en {station}, no en {goal}.', missedVia: 'Faltó pasar por {station}.',
    emptyPlan: 'Pon al menos una carta en tu ruta.',
    resultTitle: '{stars} de {max} ⭐', resultLead: 'Cinco viajes por el Metro de Santiago.', again: '¡Otra vez!', shareRotulo: '📤 Compartir', shareContext: 'Cinco viajes',
  },
  como: ['🎯 Llega a la estación de destino.', '🃏 Toca tus cartas en orden y aprieta ¡Vamos!: el tren sigue tu ruta.', '❤️ Cada ruta que falla cuesta un corazón.'],
};

const EN = {
    comentario: { titulo: 'What did you think?', lead: 'Tell us if it made sense, if it was easy or hard, and what you’d change.', ph: 'For example: I didn’t realize I could flip a card.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', cancelar: 'Cancel', cerrar: 'Close' },
  ui: {
    comentarAbrir: '💬 Suggestions and comments',
    docTitle: 'Transfer 🚉 · Parlor Games', gameChip: '🚉 Transfer', menu: '‹ Lab',
    title: 'Transfer', lead: 'Build the route with your cards and ride the Santiago Metro.',
    howTitle: '🚉 How to play',
    modeSolo: 'Five trips', modeSoloHint: 'Solo, each one harder',
    resumeTitle: '⏯ There is a trip in progress', resume: 'Continue', delete: 'Delete',
    levelOf: 'Trip {n} of {total}', from: 'From', to: 'To', via: 'Via', closedLabel: 'Closed',
    heading: 'towards {station}', plan: 'Your route', hand: 'Your cards', go: '🚇 Go!', clear: 'Clear', hintBtn: '💡 Hint (−❤️)',
    rideN: 'Ride {n}', rideOne: 'Ride 1', end: 'To the end', turn: 'Other platform', changeTo: 'Change to {line}',
    lineN: 'Line {n}', city: 'Santiago Metro', mapCredit: 'Real stations and track layouts (© OpenStreetMap contributors).',
    okLevel: 'You made it! {stars}', next: 'Next trip ›', retry: 'Try another route', lostLevel: 'No hearts left: on to the next trip.',
    pastEnd: 'The line ended first.', closed: '{station} is closed: the train cannot pass.', noChange: '{line} does not stop at {station}.',
    atTerminal: 'You were already at the end of the line.', notGoal: 'You ended at {station}, not at {goal}.', missedVia: 'You did not pass {station}.',
    emptyPlan: 'Put at least one card in your route.',
    resultTitle: '{stars} of {max} ⭐', resultLead: 'Five trips on the Santiago Metro.', again: 'Again!', shareRotulo: '📤 Share', shareContext: 'Five trips',
  },
  como: ['🎯 Reach the destination station.', '🃏 Tap your cards in order and press Go!: the train follows your route.', '❤️ Each route that fails costs a heart.'],
};

const PT = {
    comentario: { titulo: 'O que você achou?', lead: 'Conte se deu para entender, se foi fácil ou difícil e o que você mudaria.', ph: 'Por exemplo: não percebi que dava para virar uma carta.', nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', cancelar: 'Cancelar', cerrar: 'Fechar' },
  ui: {
    comentarAbrir: '💬 Sugestões e comentários',
    docTitle: 'Baldeação 🚉 · Jogos de Salão', gameChip: '🚉 Baldeação', menu: '‹ Laboratório',
    title: 'Baldeação', lead: 'Monte a rota com suas cartas e viaje pelo Metrô de Santiago.',
    howTitle: '🚉 Como se joga',
    modeSolo: 'Cinco viagens', modeSoloHint: 'Sozinho, cada uma mais difícil',
    resumeTitle: '⏯ Há uma viagem pela metade', resume: 'Continuar', delete: 'Apagar',
    levelOf: 'Viagem {n} de {total}', from: 'Saída', to: 'Chegada', via: 'Passando por', closedLabel: 'Fechada',
    heading: 'sentido {station}', plan: 'Sua rota', hand: 'Suas cartas', go: '🚇 Vamos!', clear: 'Esvaziar', hintBtn: '💡 Dica (−❤️)',
    rideN: 'Avance {n}', rideOne: 'Avance 1', end: 'Até o fim', turn: 'Outra plataforma', changeTo: 'Baldeie para {line}',
    lineN: 'Linha {n}', city: 'Metrô de Santiago', mapCredit: 'Estações e traçados reais (© colaboradores do OpenStreetMap).',
    okLevel: 'Você chegou! {stars}', next: 'Próxima viagem ›', retry: 'Tentar outra rota', lostLevel: 'Sem corações: vamos para a próxima viagem.',
    pastEnd: 'A linha acabou antes.', closed: '{station} está fechada: o trem não passa.', noChange: '{line} não passa por {station}.',
    atTerminal: 'Você já estava no fim da linha.', notGoal: 'Você parou em {station}, não em {goal}.', missedVia: 'Faltou passar por {station}.',
    emptyPlan: 'Coloque pelo menos uma carta na sua rota.',
    resultTitle: '{stars} de {max} ⭐', resultLead: 'Cinco viagens pelo Metrô de Santiago.', again: 'De novo!', shareRotulo: '📤 Compartilhar', shareContext: 'Cinco viagens',
  },
  como: ['🎯 Chegue à estação de destino.', '🃏 Toque suas cartas em ordem e aperte Vamos!: o trem segue sua rota.', '❤️ Cada rota que falha custa um coração.'],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
