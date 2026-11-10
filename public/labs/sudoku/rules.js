/**
 * Sudoku: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/sudoku.md.
 */

export const GAME_ID = 'sudoku';
export const LEVELS = ['easy', 'hard'];
export const LEVEL_EMOJI = { easy: '🟢', hard: '🔴' };

const ES = {
  ui: {
    docTitle: 'Sudoku 🔢 · Juegos de Salón', gameChip: '🔢 Sudoku', menu: '‹ Laboratorio',
    title: 'Sudoku', lead: 'Llena el tablero con los números del 1 al 9, sin repetir.',
    howTitle: '🔢 Cómo se juega',
    levels: { easy: 'Fácil', hard: 'Difícil' },
    levelHints: { easy: 'Muchas pistas, para entrar en calor', hard: 'Pocas pistas y hay que pensar con notas' },
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ Ese número no va ahí: −10',
    notes: '✏️ Notas', erase: '🧽 Borrar', undo: '↩️ Deshacer',
    pickCell: 'Toca una casilla vacía y luego un número.',
    resumeTitle: '⏯ Hay un sudoku a medias', resume: 'Continuar', delete: 'Borrar',
    solved: '¡Resuelto!', solvedLine: 'Nivel {level}, en {time}.', scoreResult: '⭐ {score} puntos', scoreDetail: 'Sin errores: 100.', scoreDetailMistakes: '100 menos {n} × 10 por los números mal puestos.',
    again: '🔁 Otro sudoku {level}', otherLevel: 'Cambiar dificultad',
    shareRotulo: '📤 Compartir', shareContext: 'Solo', shareText: 'Resolví un sudoku {level} en {time}: {score} puntos. ¿Te atreves?',
  },
  como: [
    '🎯 Completa el tablero: cada fila, cada columna y cada cuadro de 3×3 lleva los números del 1 al 9 una sola vez.',
    '👆 Toca una casilla y después el número: 100 puntos al terminar, 10 menos por cada número mal puesto.',
    '✏️ Con Notas anotas los números posibles de una casilla, para no perderte.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Sudoku 🔢 · Parlor Games', gameChip: '🔢 Sudoku', menu: '‹ Lab',
    title: 'Sudoku', lead: 'Fill the board with the numbers 1 to 9, without repeating.',
    howTitle: '🔢 How to play',
    levels: { easy: 'Easy', hard: 'Hard' },
    levelHints: { easy: 'Lots of clues, to warm up', hard: 'Few clues, think with notes' },
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ That number does not go there: −10',
    notes: '✏️ Notes', erase: '🧽 Erase', undo: '↩️ Undo',
    pickCell: 'Tap an empty cell, then a number.',
    resumeTitle: '⏯ There is a sudoku in progress', resume: 'Continue', delete: 'Delete',
    solved: 'Solved!', solvedLine: 'Level {level}, in {time}.', scoreResult: '⭐ {score} points', scoreDetail: 'No mistakes: 100.', scoreDetailMistakes: '100 minus {n} × 10 for the wrong numbers.',
    again: '🔁 Another {level} sudoku', otherLevel: 'Change difficulty',
    shareRotulo: '📤 Share', shareContext: 'Solo', shareText: 'I solved a {level} sudoku in {time}: {score} points. Dare to try?',
  },
  como: [
    '🎯 Complete the board: every row, every column and every 3×3 box holds the numbers 1 to 9 once.',
    '👆 Tap a cell, then the number: 100 points when you finish, 10 less for each wrong number.',
    '✏️ With Notes you jot down a cell\'s possible numbers, so you do not get lost.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Sudoku 🔢 · Jogos de Salão', gameChip: '🔢 Sudoku', menu: '‹ Laboratório',
    title: 'Sudoku', lead: 'Preencha o tabuleiro com os números de 1 a 9, sem repetir.',
    howTitle: '🔢 Como se joga',
    levels: { easy: 'Fácil', hard: 'Difícil' },
    levelHints: { easy: 'Muitas pistas, para aquecer', hard: 'Poucas pistas, pense com notas' },
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ Esse número não vai aí: −10',
    notes: '✏️ Notas', erase: '🧽 Apagar', undo: '↩️ Desfazer',
    pickCell: 'Toque numa casa vazia e depois num número.',
    resumeTitle: '⏯ Há um sudoku pela metade', resume: 'Continuar', delete: 'Apagar',
    solved: 'Resolvido!', solvedLine: 'Nível {level}, em {time}.', scoreResult: '⭐ {score} pontos', scoreDetail: 'Sem erros: 100.', scoreDetailMistakes: '100 menos {n} × 10 pelos números errados.',
    again: '🔁 Outro sudoku {level}', otherLevel: 'Mudar dificuldade',
    shareRotulo: '📤 Compartilhar', shareContext: 'Solo', shareText: 'Resolvi um sudoku {level} em {time}: {score} pontos. Encara?',
  },
  como: [
    '🎯 Complete o tabuleiro: cada linha, cada coluna e cada quadrado 3×3 tem os números de 1 a 9 uma só vez.',
    '👆 Toque numa casa e depois no número: 100 pontos ao terminar, 10 a menos por número errado.',
    '✏️ Com Notas você anota os números possíveis de uma casa, para não se perder.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
