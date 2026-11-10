/**
 * Sudoku: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/sudoku.md.
 */

export const GAME_ID = 'sudoku';
export const LEVELS = ['easy', 'hard'];
export const LEVEL_EMOJI = { easy: '🟢', hard: '🔴' };

const ES = {
  ui: {
    docTitle: 'Sudoku 🧮 · Juegos de Salón', gameChip: '🧮 Sudoku', menu: '‹ Laboratorio',
    title: 'Sudoku', lead: 'Llena el tablero con los números del 1 al 9, sin repetir.',
    howTitle: '🧮 Cómo se juega',
    levels: { easy: 'Fácil', hard: 'Difícil' },
    switch: [{ title: 'Modo fácil', sub: 'Muchas pistas, para entrar en calor' }, { title: 'Modo difícil', sub: 'Pocas pistas: hay que pensar con notas' }],
    play: '¡A jugar!',
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ Ese número no va ahí: −10',
    notes: '✏️ Notas', undo: '↩️ Deshacer', giveUp: '🏳️ Rendirse', giveUpSure: '🏳️ ¿Seguro?',
    gaveUp: 'Te rendiste', solutionTitle: 'Esta era la solución:',
    pickCell: 'Toca una casilla vacía y luego un número.',
    resumeTitle: '⏯ Hay un sudoku a medias', resume: 'Continuar', delete: 'Borrar',
    solved: '¡Resuelto!', solvedLine: 'Nivel {level}, en {time}.', scoreResult: '⭐ {score} puntos', scoreDetail: 'Sin errores: 100.', scoreDetailMistakes: 'Números mal puestos: {n} (−10 cada uno).',
    again: '🔁 Otro sudoku {level}', otherLevel: 'Cambiar dificultad',
    demo: { row: '➡️ Fila: del 1 al 9, sin repetir', col: '⬇️ Columna: tampoco se repite', box: '🔲 Cuadro de 3×3: lo mismo', fill: '✨ ¡Solo cabe el {d}!' },
    best: '🏅 Tu mejor en {level}: {score} puntos · {time}', noBest: '🏅 Aún no tienes récord en {level}: ¡estrénalo!',
    rankingOf: 'Ranking de Sudoku {level}',
    shareRotulo: '📤 Compartir', shareContext: 'Solo', shareText: 'Resolví un sudoku {level} en {time}: {score} puntos. ¿Te atreves?',
  },
  como: [
    '🎯 Cada fila, columna y cuadro lleva del 1 al 9, sin repetir.',
    '👆 Toca una casilla y luego el número.',
    '⭐ 100 puntos; cada número mal puesto resta 10.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Sudoku 🧮 · Parlor Games', gameChip: '🧮 Sudoku', menu: '‹ Lab',
    title: 'Sudoku', lead: 'Fill the board with the numbers 1 to 9, without repeating.',
    howTitle: '🧮 How to play',
    levels: { easy: 'Easy', hard: 'Hard' },
    switch: [{ title: 'Easy mode', sub: 'Lots of clues, to warm up' }, { title: 'Hard mode', sub: 'Few clues: think with notes' }],
    play: 'Let\'s play!',
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ That number does not go there: −10',
    notes: '✏️ Notes', undo: '↩️ Undo', giveUp: '🏳️ Give up', giveUpSure: '🏳️ Sure?',
    gaveUp: 'You gave up', solutionTitle: 'This was the solution:',
    pickCell: 'Tap an empty cell, then a number.',
    resumeTitle: '⏯ There is a sudoku in progress', resume: 'Continue', delete: 'Delete',
    solved: 'Solved!', solvedLine: 'Level {level}, in {time}.', scoreResult: '⭐ {score} points', scoreDetail: 'No mistakes: 100.', scoreDetailMistakes: 'Wrong numbers: {n} (−10 each).',
    again: '🔁 Another {level} sudoku', otherLevel: 'Change difficulty',
    demo: { row: '➡️ Row: 1 to 9, no repeats', col: '⬇️ Column: no repeats either', box: '🔲 3×3 box: the same', fill: '✨ Only the {d} fits!' },
    best: '🏅 Your best on {level}: {score} points · {time}', noBest: '🏅 No record on {level} yet: set one!',
    rankingOf: 'Sudoku {level} leaderboard',
    shareRotulo: '📤 Share', shareContext: 'Solo', shareText: 'I solved a sudoku on {level} in {time}: {score} points. Dare to try?',
  },
  como: [
    '🎯 Every row, column and box holds 1 to 9, no repeats.',
    '👆 Tap a cell, then the number.',
    '⭐ 100 points; each wrong number takes off 10.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Sudoku 🧮 · Jogos de Salão', gameChip: '🧮 Sudoku', menu: '‹ Laboratório',
    title: 'Sudoku', lead: 'Preencha o tabuleiro com os números de 1 a 9, sem repetir.',
    howTitle: '🧮 Como se joga',
    levels: { easy: 'Fácil', hard: 'Difícil' },
    switch: [{ title: 'Modo fácil', sub: 'Muitas pistas, para aquecer' }, { title: 'Modo difícil', sub: 'Poucas pistas: pense com notas' }],
    play: 'Vamos jogar!',
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ Esse número não vai aí: −10',
    notes: '✏️ Notas', undo: '↩️ Desfazer', giveUp: '🏳️ Desistir', giveUpSure: '🏳️ Certeza?',
    gaveUp: 'Você desistiu', solutionTitle: 'Esta era a solução:',
    pickCell: 'Toque numa casa vazia e depois num número.',
    resumeTitle: '⏯ Há um sudoku pela metade', resume: 'Continuar', delete: 'Apagar',
    solved: 'Resolvido!', solvedLine: 'Nível {level}, em {time}.', scoreResult: '⭐ {score} pontos', scoreDetail: 'Sem erros: 100.', scoreDetailMistakes: 'Números errados: {n} (−10 cada um).',
    again: '🔁 Outro sudoku {level}', otherLevel: 'Mudar dificuldade',
    demo: { row: '➡️ Linha: de 1 a 9, sem repetir', col: '⬇️ Coluna: também não repete', box: '🔲 Quadrado 3×3: o mesmo', fill: '✨ Só cabe o {d}!' },
    best: '🏅 Seu melhor no {level}: {score} pontos · {time}', noBest: '🏅 Ainda sem recorde no {level}: estreie!',
    rankingOf: 'Ranking do Sudoku {level}',
    shareRotulo: '📤 Compartilhar', shareContext: 'Solo', shareText: 'Resolvi um sudoku {level} em {time}: {score} pontos. Encara?',
  },
  como: [
    '🎯 Cada linha, coluna e quadrado tem de 1 a 9, sem repetir.',
    '👆 Toque numa casa e depois no número.',
    '⭐ 100 pontos; cada número errado tira 10.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
