/**
 * Sudoku: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/sudoku.md.
 */

export const GAME_ID = 'sudoku';
export const LEVELS = ['easy', 'hard'];
export const LEVEL_EMOJI = { easy: '🟢', hard: '🔴' };

const ES = {
  ui: {
    docTitle: 'Sudoku #️⃣ · Juegos de Salón', gameChip: 'Sudoku', menu: '‹ Laboratorio',
    title: 'Sudoku', lead: 'Llena el tablero sin repetir números en ninguna fila, columna ni cuadro.',
    howTitle: 'Cómo se juega',
    levels: { easy: 'Fácil', hard: 'Difícil' },
    switch: [{ title: 'Modo fácil', sub: '6×6: menos celdas y dígitos, más rápido' }, { title: 'Modo difícil', sub: '9×9 y pocas pistas: hay que pensar con notas' }],
    play: '¡A jugar!',
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ Ese número no va ahí: −10',
    notes: '✏️ Notas', undo: '↩️ Deshacer', giveUp: '🏳️ Rendirse', giveUpSure: '🏳️ ¿Seguro?',
    hint: '💡 Pista', hintSure: '💡 ¿Seguro? −15',
    hintWhy: { single: '💡 Ahí solo cabe el {d}: su fila, su columna y su cuadro ya tienen los demás. −15', row: '💡 En esa fila, el {d} solo cabe ahí. −15', col: '💡 En esa columna, el {d} solo cabe ahí. −15', box: '💡 En ese cuadro, el {d} solo cabe ahí. −15', solution: '💡 Ahí va el {d}. −15' },
    gaveUp: 'Te rendiste', solutionTitle: 'Esta era la solución:',
    pickCell: 'Toca una casilla vacía y luego un número.',
    resumeTitle: '⏯ Hay un sudoku a medias', resume: 'Continuar', delete: 'Borrar',
    solved: '¡Resuelto!', solvedLine: 'Nivel {level}, en {time}.', scoreResult: '⭐ {score} puntos', scoreDetail: 'Sin errores: 100.', scoreDetailMistakes: 'Números mal puestos: {n} (−10 cada uno).', scoreDetailHints: 'Pistas: {n} (−15 cada una).',
    again: '🔁 Otro sudoku {level}', otherLevel: 'Cambiar dificultad',
    demo: { row: '➡️ Fila: del 1 al {n}, sin repetir', col: '⬇️ Columna: tampoco se repite', box: '🔲 Cuadro de {box}: lo mismo', fill: '✨ ¡Solo cabe el {d}!' },
    best: '🏅 Tu mejor en {level}: {score} puntos · {time}', noBest: '🏅 Aún no tienes récord en {level}: ¡estrénalo!',
    rankingOf: 'Ranking de Sudoku {level}',
    shareRotulo: '📤 Compartir', shareContext: 'Solo', shareText: 'Resolví un sudoku {level} en {time}: {score} puntos. ¿Te atreves?',
  },
  como: [
    '🎯 Fácil: 6×6, del 1 al 6. Difícil: 9×9, del 1 al 9. Sin repetir en ninguna fila, columna ni cuadro.',
    '👆 Toca una casilla y luego el número.',
    '⭐ 100 puntos; cada número mal puesto resta 10 y cada pista, 15.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Sudoku #️⃣ · Parlor Games', gameChip: 'Sudoku', menu: '‹ Lab',
    title: 'Sudoku', lead: 'Fill the board without repeating a number in any row, column or box.',
    howTitle: 'How to play',
    levels: { easy: 'Easy', hard: 'Hard' },
    switch: [{ title: 'Easy mode', sub: '6×6: fewer cells and digits, quicker' }, { title: 'Hard mode', sub: '9×9 and few clues: think with notes' }],
    play: 'Let\'s play!',
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ That number does not go there: −10',
    notes: '✏️ Notes', undo: '↩️ Undo', giveUp: '🏳️ Give up', giveUpSure: '🏳️ Sure?',
    hint: '💡 Hint', hintSure: '💡 Sure? −15',
    hintWhy: { single: '💡 Only the {d} fits there: its row, column and box already have the rest. −15', row: '💡 In that row, the {d} fits only there. −15', col: '💡 In that column, the {d} fits only there. −15', box: '💡 In that box, the {d} fits only there. −15', solution: '💡 The {d} goes there. −15' },
    gaveUp: 'You gave up', solutionTitle: 'This was the solution:',
    pickCell: 'Tap an empty cell, then a number.',
    resumeTitle: '⏯ There is a sudoku in progress', resume: 'Continue', delete: 'Delete',
    solved: 'Solved!', solvedLine: 'Level {level}, in {time}.', scoreResult: '⭐ {score} points', scoreDetail: 'No mistakes: 100.', scoreDetailMistakes: 'Wrong numbers: {n} (−10 each).', scoreDetailHints: 'Hints: {n} (−15 each).',
    again: '🔁 Another {level} sudoku', otherLevel: 'Change difficulty',
    demo: { row: '➡️ Row: 1 to {n}, no repeats', col: '⬇️ Column: no repeats either', box: '🔲 {box} box: the same', fill: '✨ Only the {d} fits!' },
    best: '🏅 Your best on {level}: {score} points · {time}', noBest: '🏅 No record on {level} yet: set one!',
    rankingOf: 'Sudoku {level} leaderboard',
    shareRotulo: '📤 Share', shareContext: 'Solo', shareText: 'I solved a sudoku on {level} in {time}: {score} points. Dare to try?',
  },
  como: [
    '🎯 Easy: 6×6, 1 to 6. Hard: 9×9, 1 to 9. No repeats in any row, column or box.',
    '👆 Tap a cell, then the number.',
    '⭐ 100 points; each wrong number takes off 10, each hint 15.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Sudoku #️⃣ · Jogos de Salão', gameChip: 'Sudoku', menu: '‹ Laboratório',
    title: 'Sudoku', lead: 'Preencha o tabuleiro sem repetir números em nenhuma linha, coluna ou quadrado.',
    howTitle: 'Como se joga',
    levels: { easy: 'Fácil', hard: 'Difícil' },
    switch: [{ title: 'Modo fácil', sub: '6×6: menos casas e dígitos, mais rápido' }, { title: 'Modo difícil', sub: '9×9 e poucas pistas: pense com notas' }],
    play: 'Vamos jogar!',
    levelLine: '{level} · {time}', scoreLine: '⭐ {score}', mistake: '❌ Esse número não vai aí: −10',
    notes: '✏️ Notas', undo: '↩️ Desfazer', giveUp: '🏳️ Desistir', giveUpSure: '🏳️ Certeza?',
    hint: '💡 Dica', hintSure: '💡 Certeza? −15',
    hintWhy: { single: '💡 Ali só cabe o {d}: a linha, a coluna e o quadrado já têm os outros. −15', row: '💡 Nessa linha, o {d} só cabe ali. −15', col: '💡 Nessa coluna, o {d} só cabe ali. −15', box: '💡 Nesse quadrado, o {d} só cabe ali. −15', solution: '💡 Ali vai o {d}. −15' },
    gaveUp: 'Você desistiu', solutionTitle: 'Esta era a solução:',
    pickCell: 'Toque numa casa vazia e depois num número.',
    resumeTitle: '⏯ Há um sudoku pela metade', resume: 'Continuar', delete: 'Apagar',
    solved: 'Resolvido!', solvedLine: 'Nível {level}, em {time}.', scoreResult: '⭐ {score} pontos', scoreDetail: 'Sem erros: 100.', scoreDetailMistakes: 'Números errados: {n} (−10 cada um).', scoreDetailHints: 'Dicas: {n} (−15 cada uma).',
    again: '🔁 Outro sudoku {level}', otherLevel: 'Mudar dificuldade',
    demo: { row: '➡️ Linha: de 1 a {n}, sem repetir', col: '⬇️ Coluna: também não repete', box: '🔲 Quadrado {box}: o mesmo', fill: '✨ Só cabe o {d}!' },
    best: '🏅 Seu melhor no {level}: {score} pontos · {time}', noBest: '🏅 Ainda sem recorde no {level}: estreie!',
    rankingOf: 'Ranking do Sudoku {level}',
    shareRotulo: '📤 Compartilhar', shareContext: 'Solo', shareText: 'Resolvi um sudoku {level} em {time}: {score} pontos. Encara?',
  },
  como: [
    '🎯 Fácil: 6×6, de 1 a 6. Difícil: 9×9, de 1 a 9. Sem repetir em nenhuma linha, coluna ou quadrado.',
    '👆 Toque numa casa e depois no número.',
    '⭐ 100 pontos; cada número errado tira 10 e cada dica, 15.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
