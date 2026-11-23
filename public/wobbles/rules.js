/**
 * Tembleque / The Wobbles: the cover's texts (C-3). The game has two levels, each a page of its own that
 * keeps its texts inside (the owner's prototypes, kept whole): easy/ and hard/. The player never reads
 * "2D" or "3D" (the owner): the levels are only easy and hard, and how to play follows the lever.
 */
export const GAME_ID = 'wobbles';

const ES = {
  // How to play, for the level the lever shows (the steps of each level, as its page says them)
  como: {
    easy: [
      'La garra pasea la pieza sola: toca la pantalla para soltarla sobre la tabla.',
      'Mantén la tabla nivelada: si la burbuja del nivel llega al final del rojo, la tabla se vuelca y se acaba.',
      'Tienes 3 vidas: cada pieza que cae al agua te cuesta una. Las piezas llegan cada vez más rápido.',
    ],
    hard: [
      'Arrastra la pieza sobre el disco y suéltala: su sombra muestra dónde cae. Antes de soltarla puedes girarla.',
      'Gira el tablero para mirar la pila por todos lados y reparte el peso: si el disco se inclina demasiado, se vuelca y se acaba.',
      'Tienes 3 vidas: cada pieza que cae al vacío te cuesta una. Cada vez tienes menos tiempo para ubicarlas.',
    ],
  },
  ui: {
    docTitle: 'Tembleque ⚖️ · Juegos de Salón',
    menu: '‹ Menú',
    gameChip: '⚖️ Tembleque',
    title: 'Tembleque',
    lead: 'Apila piezas en la balanza sin que se caigan.',
    howTitle: 'Cómo se juega',
    play: 'Empezar',
    switch: [{ title: 'Modo fácil', sub: 'La garra lleva la pieza y tú tocas para soltarla' }, { title: 'Modo difícil', sub: 'Mueves y giras cada pieza sobre un disco que se ladea' }],
    comentarAbrir: '💬 Sugerencias y comentarios',
  },
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendió, si fue fácil o difícil y qué le cambiarías.', ph: 'Por ejemplo: en el modo difícil no supe cómo girar la pieza.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};

const EN = {
  como: {
    easy: [
      'The claw carries the piece back and forth by itself: tap the screen to drop it on the plank.',
      'Keep the plank level: if the bubble of the level reaches the end of the red, the plank tips over and the game ends.',
      'You have 3 lives: each piece that falls in the water costs you one. The pieces come faster and faster.',
    ],
    hard: [
      'Drag the piece over the disc and let go: its shadow shows where it lands. Before letting go you can turn it.',
      'Turn the board to look at the pile from every side and spread the weight: if the disc leans too far, it tips over and the game ends.',
      'You have 3 lives: each piece that falls off costs you one. You get less and less time to place them.',
    ],
  },
  ui: {
    docTitle: 'The Wobbles ⚖️ · Juegos de Salón',
    menu: '‹ Menu',
    gameChip: '⚖️ The Wobbles',
    title: 'The Wobbles',
    lead: 'Stack pieces on the scale without letting them fall.',
    howTitle: 'How to play',
    play: 'Start',
    switch: [{ title: 'Easy mode', sub: 'The claw carries the piece and you tap to drop it' }, { title: 'Hard mode', sub: 'You move and turn each piece over a tipping disc' }],
    comentarAbrir: '💬 Suggestions and comments',
  },
  comentario: { titulo: 'What did you think?', lead: 'Tell us if it made sense, if it was easy or hard, and what you’d change.', ph: 'For example: in hard mode I didn’t know how to turn the piece.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', cancelar: 'Cancel', cerrar: 'Close' },
};

const PT = {
  como: {
    easy: [
      'A garra leva a peça de um lado para o outro sozinha: toque na tela para soltá-la sobre a tábua.',
      'Mantenha a tábua nivelada: se a bolha do nível chegar ao fim do vermelho, a tábua vira e o jogo acaba.',
      'Você tem 3 vidas: cada peça que cai na água custa uma. As peças chegam cada vez mais rápido.',
    ],
    hard: [
      'Arraste a peça sobre o disco e solte: a sombra mostra onde ela cai. Antes de soltar você pode girá-la.',
      'Gire o tabuleiro para ver a pilha de todos os lados e distribua o peso: se o disco inclinar demais, ele vira e o jogo acaba.',
      'Você tem 3 vidas: cada peça que cai no vazio custa uma. Você tem cada vez menos tempo para posicioná-las.',
    ],
  },
  ui: {
    docTitle: 'Tremelique ⚖️ · Juegos de Salón',
    menu: '‹ Menu',
    gameChip: '⚖️ Tremelique',
    title: 'Tremelique',
    lead: 'Empilhe peças na balança sem deixá-las cair.',
    howTitle: 'Como se joga',
    play: 'Começar',
    switch: [{ title: 'Modo fácil', sub: 'A garra leva a peça e você toca para soltá-la' }, { title: 'Modo difícil', sub: 'Você move e gira cada peça sobre um disco que balança' }],
    comentarAbrir: '💬 Sugestões e comentários',
  },
  comentario: { titulo: 'O que você achou?', lead: 'Conte se deu para entender, se foi fácil ou difícil e o que você mudaria.', ph: 'Por exemplo: no modo difícil não soube girar a peça.', nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', cancelar: 'Cancelar', cerrar: 'Fechar' },
};

export const LOCALES = { es: ES, en: EN, pt: PT };
