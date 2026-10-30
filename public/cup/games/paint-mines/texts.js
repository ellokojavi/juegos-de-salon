/**
 * 🖌️ Pintaminas — its texts in the four languages (C-3), merged into rules.js (D-331).
 * `juego`: its entry in `juegos` (steps, scoring, tie-break and its two variants, D-331); `ui`: the
 * keys its screen reads from T, all prefixed `pm`. The drawings and the colors are data in
 * dibujos.js (by id); their words are here: `pmDibujos` (the whole sentence of the reveal, so each
 * language agrees in gender and number) and `pmColores`.
 * Templates: {c} a color, {n} a count, {pts} points, {p} a percentage, {juego} the linked game name.
 */
const ES = {
  juego: {
    nombre: 'Pintaminas', habilidad: 'deducir',
    como: [
      'Pinta la grilla y descubre el dibujo escondido.',
      'Cada número dice cuántas de sus 8 vecinas son iguales a ella: del mismo color, o sin pintar.',
      'Elige «Pinta» o «No pinta» y toca una casilla. Nunca hay que adivinar.',
    ],
    puntaje: 'Partes con 100 puntos. Cada error resta 15 y cada ayuda, 10. Si te rindes, vale la parte que pintaste.',
    desempate: 'Si empatas, gana quien tardó menos.',
    variantes: {
      easy: { nombre: 'Fácil', sub: 'Un color' },
      hard: {
        nombre: '⚡ Difícil', sub: 'Dos colores',
        como: [
          'Pinta la grilla con sus dos colores y descubre el dibujo escondido.',
          'Cada número dice cuántas de sus 8 vecinas son iguales a ella: del mismo color, o sin pintar.',
          'Elige un color o «No pinta» y toca una casilla. Nunca hay que adivinar.',
        ],
      },
    },
  },
  ui: {
    pmModo: [{ titulo: 'Modo fácil', sub: 'Un color' }, { titulo: '⚡ Modo difícil', sub: 'Dos colores' }],
    pmCredito: 'Inspirado en {juego}, de ARRKKA.',
    pmEjemplo: 'El 5: cinco de sus vecinas se pintan, como ella.',
    pmEjemploDos: 'El 3: tres de sus vecinas son de su color.',
    pmPincel: 'Pincel', pmTinta: 'Pinta {c}', pmFondo: 'No pinta',
    pmErrores: ['Sin errores', '1 error', '{n} errores'], pmQuedan: 'Faltan {n}',
    pmCelda: { tinta: 'pintada de {c}, {n}', fondo: 'sin pintar, {n}', nada: 'por descubrir' },
    pmMalTinta: '❌ Se pintaba de {c}: −{pts}.', pmMalFondo: '❌ No se pintaba: −{pts}.',
    pmAyuda: '💡 Ayuda (−{pts})', pmAyudaSeguro: 'Toca de nuevo para usar la ayuda (−{pts})', pmAyudaVer: '💡 Ver la ayuda',
    pmAyudaDice: '💡 La casilla que late se deduce de los números marcados.',
    pmRendirse: '🏳️ Rendirse', pmRendirseSeguro: '🏳️ ¿Seguro?',
    pmFin: { perfecto: '¡Perfecto!', listo: '¡Pintado!', rendido: 'Te rendiste' },
    pmBdInicio: 'Partes con 100 puntos.',
    pmBdErrores: ['Sin errores.', '1 error: −{pts}.', '{n} errores: −{pts}.'],
    pmBdAyudas: ['💡 1 ayuda: −{pts}.', '💡 {n} ayudas: −{pts}.'],
    pmBdPiso: 'El puntaje no baja de 0.',
    pmBdRendido: '🏳️ Te rendiste con el {p} % pintado: el puntaje vale ese {p} %.',
    pmColores: { azul: 'azul', rojo: 'rojo', verde: 'verde', amarillo: 'amarillo', naranjo: 'naranjo', morado: 'morado', café: 'café', blanco: 'blanco', rosado: 'rosado' },
    pmDibujos: {
      pez: '¡Era un pez!', luna: '¡Era una luna!', velero: '¡Era un velero!', bota: '¡Era una bota!', llave: '¡Era una llave!',
      nota: '¡Era una nota musical!', rayo: '¡Era un rayo!', pato: '¡Era un pato!', perro: '¡Era un perro!', cohete: '¡Era un cohete!',
      pregunta: '¡Era un signo de pregunta!', platano: '¡Era un plátano!', cactus: '¡Era un cactus!', guitarra: '¡Era una guitarra!',
      martillo: '¡Era un martillo!', bandera: '¡Era una bandera!', taza: '¡Era una taza!', frutilla: '¡Era una frutilla!',
      cerezas: '¡Eran unas cerezas!', helado: '¡Era un helado!', arbol: '¡Era un árbol!', casa: '¡Era una casa!', lapiz: '¡Era un lápiz!',
      zanahoria: '¡Era una zanahoria!',
    },
  },
};

const EN = {
  juego: {
    nombre: 'Paint Mines', habilidad: 'deduction',
    como: [
      'Paint the grid and uncover the hidden picture.',
      'Each number says how many of its 8 neighbors are like it: the same color, or unpainted.',
      'Pick “Paint” or “Don’t paint” and tap a square. You never have to guess.',
    ],
    puntaje: 'You start with 100 points. Each mistake takes off 15 and each hint, 10. If you give up, it’s worth the part you painted.',
    desempate: 'On a tie, the faster player wins.',
    variantes: {
      easy: { nombre: 'Easy', sub: 'One color' },
      hard: {
        nombre: '⚡ Hard', sub: 'Two colors',
        como: [
          'Paint the grid in its two colors and uncover the hidden picture.',
          'Each number says how many of its 8 neighbors are like it: the same color, or unpainted.',
          'Pick a color or “Don’t paint” and tap a square. You never have to guess.',
        ],
      },
    },
  },
  ui: {
    pmModo: [{ titulo: 'Easy mode', sub: 'One color' }, { titulo: '⚡ Hard mode', sub: 'Two colors' }],
    pmCredito: 'Inspired by {juego}, by ARRKKA.',
    pmEjemplo: 'The 5: five of its neighbors are painted, like it.',
    pmEjemploDos: 'The 3: three of its neighbors are its color.',
    pmPincel: 'Brush', pmTinta: 'Paint {c}', pmFondo: 'Don’t paint',
    pmErrores: ['No mistakes', '1 mistake', '{n} mistakes'], pmQuedan: '{n} to go',
    pmCelda: { tinta: 'painted {c}, {n}', fondo: 'unpainted, {n}', nada: 'not found yet' },
    pmMalTinta: '❌ It was {c}: −{pts}.', pmMalFondo: '❌ It wasn’t painted: −{pts}.',
    pmAyuda: '💡 Hint (−{pts})', pmAyudaSeguro: 'Tap again to use the hint (−{pts})', pmAyudaVer: '💡 See the hint',
    pmAyudaDice: '💡 The pulsing square can be worked out from the marked numbers.',
    pmRendirse: '🏳️ Give up', pmRendirseSeguro: '🏳️ Sure?',
    pmFin: { perfecto: 'Perfect!', listo: 'Painted!', rendido: 'You gave up' },
    pmBdInicio: 'You start with 100 points.',
    pmBdErrores: ['No mistakes.', '1 mistake: −{pts}.', '{n} mistakes: −{pts}.'],
    pmBdAyudas: ['💡 1 hint: −{pts}.', '💡 {n} hints: −{pts}.'],
    pmBdPiso: 'The score never goes below 0.',
    pmBdRendido: '🏳️ You gave up with {p}% painted: the score is worth that {p}%.',
    pmColores: { azul: 'blue', rojo: 'red', verde: 'green', amarillo: 'yellow', naranjo: 'orange', morado: 'purple', café: 'brown', blanco: 'white', rosado: 'pink' },
    pmDibujos: {
      pez: 'It was a fish!', luna: 'It was a moon!', velero: 'It was a sailboat!', bota: 'It was a boot!', llave: 'It was a key!',
      nota: 'It was a musical note!', rayo: 'It was a lightning bolt!', pato: 'It was a duck!', perro: 'It was a dog!', cohete: 'It was a rocket!',
      pregunta: 'It was a question mark!', platano: 'It was a banana!', cactus: 'It was a cactus!', guitarra: 'It was a guitar!',
      martillo: 'It was a hammer!', bandera: 'It was a flag!', taza: 'It was a mug!', frutilla: 'It was a strawberry!',
      cerezas: 'They were cherries!', helado: 'It was an ice cream!', arbol: 'It was a tree!', casa: 'It was a house!', lapiz: 'It was a pencil!',
      zanahoria: 'It was a carrot!',
    },
  },
};

const PT = {
  juego: {
    nombre: 'Pinta-Minas', habilidad: 'dedução',
    como: [
      'Pinte a grade e descubra o desenho escondido.',
      'Cada número diz quantas das suas 8 vizinhas são iguais a ela: da mesma cor, ou sem pintar.',
      'Escolha «Pinte» ou «Não pinte» e toque numa casa. Nunca precisa chutar.',
    ],
    puntaje: 'Você começa com 100 pontos. Cada erro tira 15 e cada ajuda, 10. Se desistir, vale a parte que você pintou.',
    desempate: 'Se empatar, ganha quem levou menos tempo.',
    variantes: {
      easy: { nombre: 'Fácil', sub: 'Uma cor' },
      hard: {
        nombre: '⚡ Difícil', sub: 'Duas cores',
        como: [
          'Pinte a grade com as duas cores dela e descubra o desenho escondido.',
          'Cada número diz quantas das suas 8 vizinhas são iguais a ela: da mesma cor, ou sem pintar.',
          'Escolha uma cor ou «Não pinte» e toque numa casa. Nunca precisa chutar.',
        ],
      },
    },
  },
  ui: {
    pmModo: [{ titulo: 'Modo fácil', sub: 'Uma cor' }, { titulo: '⚡ Modo difícil', sub: 'Duas cores' }],
    pmCredito: 'Inspirado em {juego}, da ARRKKA.',
    pmEjemplo: 'O 5: cinco das suas vizinhas são pintadas, como ela.',
    pmEjemploDos: 'O 3: três das suas vizinhas são da cor dela.',
    pmPincel: 'Pincel', pmTinta: 'Pinte {c}', pmFondo: 'Não pinte',
    pmErrores: ['Sem erros', '1 erro', '{n} erros'], pmQuedan: 'Faltam {n}',
    pmCelda: { tinta: 'pintada de {c}, {n}', fondo: 'sem pintar, {n}', nada: 'por descobrir' },
    pmMalTinta: '❌ Era {c}: −{pts}.', pmMalFondo: '❌ Não era para pintar: −{pts}.',
    pmAyuda: '💡 Ajuda (−{pts})', pmAyudaSeguro: 'Toque de novo para usar a ajuda (−{pts})', pmAyudaVer: '💡 Ver a ajuda',
    pmAyudaDice: '💡 A casa que pulsa dá para deduzir pelos números marcados.',
    pmRendirse: '🏳️ Desistir', pmRendirseSeguro: '🏳️ Certeza?',
    pmFin: { perfecto: 'Perfeito!', listo: 'Pintado!', rendido: 'Você desistiu' },
    pmBdInicio: 'Você começa com 100 pontos.',
    pmBdErrores: ['Sem erros.', '1 erro: −{pts}.', '{n} erros: −{pts}.'],
    pmBdAyudas: ['💡 1 ajuda: −{pts}.', '💡 {n} ajudas: −{pts}.'],
    pmBdPiso: 'A pontuação nunca fica abaixo de 0.',
    pmBdRendido: '🏳️ Você desistiu com {p}% pintado: a pontuação vale esses {p}%.',
    pmColores: { azul: 'azul', rojo: 'vermelho', verde: 'verde', amarillo: 'amarelo', naranjo: 'laranja', morado: 'roxo', café: 'marrom', blanco: 'branco', rosado: 'rosa' },
    pmDibujos: {
      pez: 'Era um peixe!', luna: 'Era uma lua!', velero: 'Era um veleiro!', bota: 'Era uma bota!', llave: 'Era uma chave!',
      nota: 'Era uma nota musical!', rayo: 'Era um raio!', pato: 'Era um pato!', perro: 'Era um cachorro!', cohete: 'Era um foguete!',
      pregunta: 'Era um ponto de interrogação!', platano: 'Era uma banana!', cactus: 'Era um cacto!', guitarra: 'Era uma guitarra!',
      martillo: 'Era um martelo!', bandera: 'Era uma bandeira!', taza: 'Era uma xícara!', frutilla: 'Era um morango!',
      cerezas: 'Eram cerejas!', helado: 'Era um sorvete!', arbol: 'Era uma árvore!', casa: 'Era uma casa!', lapiz: 'Era um lápis!',
      zanahoria: 'Era uma cenoura!',
    },
  },
};

export default { es: ES, en: EN, pt: PT };
