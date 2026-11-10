/**
 * Sudoku: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/sudoku.md.
 */

export const GAME_ID = 'sudoku';
export const LEVELS = ['easy', 'medium', 'hard'];
export const LEVEL_EMOJI = { easy: '🟢', medium: '🟡', hard: '🔴' };

const ES = {
  ui: {
    docTitle: 'Sudoku 🔢 · Juegos de Salón', gameChip: '🔢 Sudoku', menu: '‹ Laboratorio',
    title: 'Sudoku', lead: 'Llena el tablero con los números del 1 al 9, sin repetir.',
    howTitle: '🔢 Cómo se juega',
    levels: { easy: 'Fácil', medium: 'Mediano', hard: 'Difícil' },
    levelHints: { easy: 'Muchas pistas, para entrar en calor', medium: 'Menos pistas, hay que mirar más', hard: 'Pocas pistas y hay que pensar con notas' },
    levelLine: '{level} · {time}',
    notes: '✏️ Notas', erase: '🧽 Borrar', undo: '↩️ Deshacer',
    pickCell: 'Toca una casilla vacía y luego un número.',
    resumeTitle: '⏯ Hay un sudoku a medias', resume: 'Continuar', delete: 'Borrar',
    solved: '¡Resuelto!', solvedLine: 'Nivel {level}, en {time}.',
    again: '🔁 Otro sudoku {level}', otherLevel: 'Cambiar dificultad',
    shareRotulo: '📤 Compartir', shareContext: 'Solo', shareText: 'Resolví un sudoku {level} en {time}. ¿Te atreves?',
  },
  como: [
    '🎯 Completa el tablero: cada fila, cada columna y cada cuadro de 3×3 lleva los números del 1 al 9 una sola vez.',
    '👆 Toca una casilla y después el número; si se repite, se pinta de rojo.',
    '✏️ Con Notas anotas los números posibles de una casilla, para no perderte.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Sudoku 🔢 · Parlor Games', gameChip: '🔢 Sudoku', menu: '‹ Lab',
    title: 'Sudoku', lead: 'Fill the board with the numbers 1 to 9, without repeating.',
    howTitle: '🔢 How to play',
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    levelHints: { easy: 'Lots of clues, to warm up', medium: 'Fewer clues, look closer', hard: 'Few clues, think with notes' },
    levelLine: '{level} · {time}',
    notes: '✏️ Notes', erase: '🧽 Erase', undo: '↩️ Undo',
    pickCell: 'Tap an empty cell, then a number.',
    resumeTitle: '⏯ There is a sudoku in progress', resume: 'Continue', delete: 'Delete',
    solved: 'Solved!', solvedLine: 'Level {level}, in {time}.',
    again: '🔁 Another {level} sudoku', otherLevel: 'Change difficulty',
    shareRotulo: '📤 Share', shareContext: 'Solo', shareText: 'I solved a {level} sudoku in {time}. Dare to try?',
  },
  como: [
    '🎯 Complete the board: every row, every column and every 3×3 box holds the numbers 1 to 9 once.',
    '👆 Tap a cell, then the number; if it repeats, it turns red.',
    '✏️ With Notes you jot down a cell\'s possible numbers, so you do not get lost.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Sudoku 🔢 · Jogos de Salão', gameChip: '🔢 Sudoku', menu: '‹ Laboratório',
    title: 'Sudoku', lead: 'Preencha o tabuleiro com os números de 1 a 9, sem repetir.',
    howTitle: '🔢 Como se joga',
    levels: { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' },
    levelHints: { easy: 'Muitas pistas, para aquecer', medium: 'Menos pistas, olhe com atenção', hard: 'Poucas pistas, pense com notas' },
    levelLine: '{level} · {time}',
    notes: '✏️ Notas', erase: '🧽 Apagar', undo: '↩️ Desfazer',
    pickCell: 'Toque numa casa vazia e depois num número.',
    resumeTitle: '⏯ Há um sudoku pela metade', resume: 'Continuar', delete: 'Apagar',
    solved: 'Resolvido!', solvedLine: 'Nível {level}, em {time}.',
    again: '🔁 Outro sudoku {level}', otherLevel: 'Mudar dificuldade',
    shareRotulo: '📤 Compartilhar', shareContext: 'Solo', shareText: 'Resolvi um sudoku {level} em {time}. Encara?',
  },
  como: [
    '🎯 Complete o tabuleiro: cada linha, cada coluna e cada quadrado 3×3 tem os números de 1 a 9 uma só vez.',
    '👆 Toque numa casa e depois no número; se ele se repete, fica vermelho.',
    '✏️ Com Notas você anota os números possíveis de uma casa, para não se perder.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
