/**
 * #️⃣ Sudoku in La Copa: its texts in the three languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos` (steps, scoring, tie-break and its two variants, the levels); `ui`, the keys its
 * screen reads from T, all prefixed `sd`. The lines come from the lab's game (labs/sudoku/rules.js).
 * Templates: {d} a digit, {n} a count or the board's side, {box} a box's size, {pts} points.
 * Plural forms are [one, many].
 */
const ES = {
  juego: {
    nombre: 'Sudoku', habilidad: 'deducir',
    como: [
      'Llena el tablero de 6×6 con los números del 1 al 6.',
      'Ningún número se repite en una fila, una columna ni un cuadro de 2×3.',
      'Toca una casilla y luego el número. Con Notas anotas los que podrían ir.',
    ],
    puntaje: 'Partes con 100 puntos. Cada número mal puesto resta 10 y cada pista, 15. Si te rindes, son 0 puntos.',
    errores: '❌ Cada número mal puesto resta 10.',
    desempate: 'Si empatas, gana quien tardó menos.',
    variantes: {
      easy: { nombre: '🟢 Fácil', sub: '6×6, del 1 al 6' },
      hard: {
        nombre: '🔴 Difícil', sub: '9×9, del 1 al 9',
        como: [
          'Llena el tablero de 9×9 con los números del 1 al 9.',
          'Ningún número se repite en una fila, una columna ni un cuadro de 3×3.',
          'Toca una casilla y luego el número. Con Notas anotas los que podrían ir.',
        ],
      },
    },
  },
  ui: {
    sdLema: 'El clásico de los números, en mini o en grande.',
    sdModo: [{ titulo: 'Modo fácil', sub: '6×6: menos casillas, más rápido' }, { titulo: 'Modo difícil', sub: '9×9 y casi vacío: piensa con notas' }],
    sdDemo: { row: '➡️ Fila: del 1 al {n}, sin repetir', col: '⬇️ Columna: tampoco se repite', box: '🔲 Cuadro de {box}: lo mismo', fill: '✨ ¡Solo cabe el {d}!', done: '🎉 ¡Resuelto!' },
    sdPickCell: 'Toca una casilla vacía y luego un número.',
    sdMistake: '❌ Ese número no va ahí: −10',
    sdNotes: '✏️ Notas', sdUndo: '↩️ Deshacer',
    sdHint: '💡 Pista', sdHintSure: '💡 ¿Seguro? −15',
    sdHintWhy: { single: '💡 Ahí solo cabe el {d}: su fila, su columna y su cuadro ya tienen los demás. −15', row: '💡 En esa fila, el {d} solo cabe ahí. −15', col: '💡 En esa columna, el {d} solo cabe ahí. −15', box: '💡 En ese cuadro, el {d} solo cabe ahí. −15', solution: '💡 Ahí va el {d}. −15' },
    sdGiveUp: '🏳️ Rendirse', sdGiveUpSure: '🏳️ ¿Seguro?',
    sdScore: '⭐ {n}',
    sdFin: { perfecto: '¡Perfecto!', listo: '¡Resuelto!', rendido: 'Te rendiste' },
    sdSolution: 'Esta era la solución:',
    sdBdInicio: 'Partes con 100 puntos.',
    sdBdErrores: ['Sin números mal puestos.', '❌ 1 número mal puesto: −{pts}.', '❌ {n} números mal puestos: −{pts}.'],
    sdBdPistas: ['💡 1 pista: −{pts}.', '💡 {n} pistas: −{pts}.'],
    sdBdPiso: 'El puntaje no baja de 0.',
    sdBdRendido: '🏳️ Te rendiste: 0 puntos.',
  },
};

const EN = {
  juego: {
    nombre: 'Sudoku', habilidad: 'deduction',
    como: [
      'Fill the 6×6 board with the numbers 1 to 6.',
      'No number repeats in a row, a column or a 2×3 box.',
      'Tap a cell, then the number. With Notes you jot down the ones that might fit.',
    ],
    puntaje: 'You start with 100 points. Each wrong number takes off 10 and each hint, 15. If you give up, it is 0 points.',
    errores: '❌ Each wrong number takes off 10.',
    desempate: 'On a tie, the faster player wins.',
    variantes: {
      easy: { nombre: '🟢 Easy', sub: '6×6, 1 to 6' },
      hard: {
        nombre: '🔴 Hard', sub: '9×9, 1 to 9',
        como: [
          'Fill the 9×9 board with the numbers 1 to 9.',
          'No number repeats in a row, a column or a 3×3 box.',
          'Tap a cell, then the number. With Notes you jot down the ones that might fit.',
        ],
      },
    },
  },
  ui: {
    sdLema: 'The numbers classic, mini or full size.',
    sdModo: [{ titulo: 'Easy mode', sub: '6×6: fewer cells, quicker' }, { titulo: 'Hard mode', sub: '9×9 and nearly empty: think with notes' }],
    sdDemo: { row: '➡️ Row: 1 to {n}, no repeats', col: '⬇️ Column: no repeats either', box: '🔲 {box} box: the same', fill: '✨ Only the {d} fits!', done: '🎉 Solved!' },
    sdPickCell: 'Tap an empty cell, then a number.',
    sdMistake: '❌ That number does not go there: −10',
    sdNotes: '✏️ Notes', sdUndo: '↩️ Undo',
    sdHint: '💡 Hint', sdHintSure: '💡 Sure? −15',
    sdHintWhy: { single: '💡 Only the {d} fits there: its row, column and box already have the rest. −15', row: '💡 In that row, the {d} fits only there. −15', col: '💡 In that column, the {d} fits only there. −15', box: '💡 In that box, the {d} fits only there. −15', solution: '💡 The {d} goes there. −15' },
    sdGiveUp: '🏳️ Give up', sdGiveUpSure: '🏳️ Sure?',
    sdScore: '⭐ {n}',
    sdFin: { perfecto: 'Perfect!', listo: 'Solved!', rendido: 'You gave up' },
    sdSolution: 'This was the solution:',
    sdBdInicio: 'You start with 100 points.',
    sdBdErrores: ['No wrong numbers.', '❌ 1 wrong number: −{pts}.', '❌ {n} wrong numbers: −{pts}.'],
    sdBdPistas: ['💡 1 hint: −{pts}.', '💡 {n} hints: −{pts}.'],
    sdBdPiso: 'The score does not go below 0.',
    sdBdRendido: '🏳️ You gave up: 0 points.',
  },
};

const PT = {
  juego: {
    nombre: 'Sudoku', habilidad: 'deduzir',
    como: [
      'Preencha o tabuleiro de 6×6 com os números de 1 a 6.',
      'Nenhum número se repete numa linha, numa coluna ou num quadrado de 2×3.',
      'Toque numa casa e depois no número. Com Notas você anota os que podem ir.',
    ],
    puntaje: 'Você começa com 100 pontos. Cada número errado tira 10 e cada dica, 15. Se desistir, são 0 pontos.',
    errores: '❌ Cada número errado tira 10.',
    desempate: 'Se empatar, ganha quem levou menos tempo.',
    variantes: {
      easy: { nombre: '🟢 Fácil', sub: '6×6, de 1 a 6' },
      hard: {
        nombre: '🔴 Difícil', sub: '9×9, de 1 a 9',
        como: [
          'Preencha o tabuleiro de 9×9 com os números de 1 a 9.',
          'Nenhum número se repete numa linha, numa coluna ou num quadrado de 3×3.',
          'Toque numa casa e depois no número. Com Notas você anota os que podem ir.',
        ],
      },
    },
  },
  ui: {
    sdLema: 'O clássico dos números, mini ou grande.',
    sdModo: [{ titulo: 'Modo fácil', sub: '6×6: menos casas, mais rápido' }, { titulo: 'Modo difícil', sub: '9×9 e quase vazio: pense com notas' }],
    sdDemo: { row: '➡️ Linha: de 1 a {n}, sem repetir', col: '⬇️ Coluna: também não repete', box: '🔲 Quadrado {box}: o mesmo', fill: '✨ Só cabe o {d}!', done: '🎉 Resolvido!' },
    sdPickCell: 'Toque numa casa vazia e depois num número.',
    sdMistake: '❌ Esse número não vai aí: −10',
    sdNotes: '✏️ Notas', sdUndo: '↩️ Desfazer',
    sdHint: '💡 Dica', sdHintSure: '💡 Certeza? −15',
    sdHintWhy: { single: '💡 Ali só cabe o {d}: a linha, a coluna e o quadrado já têm os outros. −15', row: '💡 Nessa linha, o {d} só cabe ali. −15', col: '💡 Nessa coluna, o {d} só cabe ali. −15', box: '💡 Nesse quadrado, o {d} só cabe ali. −15', solution: '💡 Ali vai o {d}. −15' },
    sdGiveUp: '🏳️ Desistir', sdGiveUpSure: '🏳️ Certeza?',
    sdScore: '⭐ {n}',
    sdFin: { perfecto: 'Perfeito!', listo: 'Resolvido!', rendido: 'Você desistiu' },
    sdSolution: 'Esta era a solução:',
    sdBdInicio: 'Você começa com 100 pontos.',
    sdBdErrores: ['Nenhum número errado.', '❌ 1 número errado: −{pts}.', '❌ {n} números errados: −{pts}.'],
    sdBdPistas: ['💡 1 dica: −{pts}.', '💡 {n} dicas: −{pts}.'],
    sdBdPiso: 'A pontuação não fica abaixo de 0.',
    sdBdRendido: '🏳️ Você desistiu: 0 pontos.',
  },
};

export default { es: ES, en: EN, pt: PT };
