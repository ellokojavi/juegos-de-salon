/**
 * Twins: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/twins.md.
 */

export const GAME_ID = 'twins';
/** Where the idea comes from, credited on the cover only (never on the result). */
export const CREDIT_URL = 'https://www.linkedin.com/games/sumbreak';

const ES = {
  ui: {
    docTitle: 'Gemelos 🔢 · Juegos de Salón', gameChip: '🔢 Gemelos', menu: '‹ Laboratorio',
    title: 'Gemelos', lead: 'Un tablero nuevo cada día, el mismo para todos.',
    howTitle: '🔢 Cómo se juega',
    credit: 'Inspirado en Sumbreak, de LinkedIn.',
    modeToday: '🔢 Jugar hoy', modeTodayHint: 'Tablero n.º {n}',
    modeTodayAgain: '🔢 Ver tu resultado', modeTodayDone: 'Hoy hiciste {score} de 100. Mañana hay otro tablero.',
    modeSeed: '🔢 Jugar', seedLabel: 'Tablero {seed}',
    resumeTitle: '⏯ Hay un tablero a medias', resume: 'Continuar', delete: 'Borrar',
    boardLabel: 'Tablero n.º {n}', left: 'Quedan {n} números', leftOne: 'Queda 1 número',
    undo: '↩ Deshacer', hintBtn: '💡 Pista (−{cost})',
    hintSay: 'Arrastra el número que late sobre su gemelo.',
    hintUndid: 'Por ahí ya no se podía dejar un solo número: deshice {n} jugadas. Arrastra el número que late sobre su gemelo.',
    hintUndidOne: 'Por ahí ya no se podía dejar un solo número: deshice 1 jugada. Arrastra el número que late sobre su gemelo.',
    stuck: 'No queda ninguna jugada. Deshaz o pide una pista.',
    scoreTitle: '{score} de 100', solvedIn: 'Lo resolviste en {time}.',
    hintsOne: '1 pista: −{cost}.', hintsMany: '{n} pistas: −{cost}.', nextBoard: 'Mañana hay otro tablero.',
    shareRotulo: '📤 Compartir', shareContext: 'Tablero n.º {n}',
  },
  como: [
    '🎯 Junta los números hasta que quede uno solo.',
    '👆 Arrastra un número sobre uno igual que esté a su lado, arriba o abajo: se suman, 8\u00a0+\u00a08\u00a0=\u00a016.',
    '⏱ Mientras más rápido, más puntos. Deshacer es gratis y cada pista resta 10.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Twins 🔢 · Parlor Games', gameChip: '🔢 Twins', menu: '‹ Lab',
    title: 'Twins', lead: 'A new board every day, the same for everyone.',
    howTitle: '🔢 How to play',
    credit: 'Inspired by Sumbreak, by LinkedIn.',
    modeToday: '🔢 Play today', modeTodayHint: 'Board #{n}',
    modeTodayAgain: '🔢 See your result', modeTodayDone: 'Today you scored {score} out of 100. Another board tomorrow.',
    modeSeed: '🔢 Play', seedLabel: 'Board {seed}',
    resumeTitle: '⏯ There is a board in progress', resume: 'Continue', delete: 'Delete',
    boardLabel: 'Board #{n}', left: '{n} numbers left', leftOne: '1 number left',
    undo: '↩ Undo', hintBtn: '💡 Hint (−{cost})',
    hintSay: 'Drag the pulsing number onto its twin.',
    hintUndid: 'That way could no longer end in a single number: I undid {n} moves. Drag the pulsing number onto its twin.',
    hintUndidOne: 'That way could no longer end in a single number: I undid 1 move. Drag the pulsing number onto its twin.',
    stuck: 'No moves left. Undo or ask for a hint.',
    scoreTitle: '{score} out of 100', solvedIn: 'You solved it in {time}.',
    hintsOne: '1 hint: −{cost}.', hintsMany: '{n} hints: −{cost}.', nextBoard: 'Another board tomorrow.',
    shareRotulo: '📤 Share', shareContext: 'Board #{n}',
  },
  como: [
    '🎯 Merge the numbers until only one is left.',
    '👆 Drag a number onto an equal one right beside, above or below it: they add up, 8\u00a0+\u00a08\u00a0=\u00a016.',
    '⏱ The faster, the more points. Undo is free and each hint takes 10 off.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Gêmeos 🔢 · Jogos de Salão', gameChip: '🔢 Gêmeos', menu: '‹ Laboratório',
    title: 'Gêmeos', lead: 'Um tabuleiro novo a cada dia, o mesmo para todos.',
    howTitle: '🔢 Como se joga',
    credit: 'Inspirado em Sumbreak, do LinkedIn.',
    modeToday: '🔢 Jogar hoje', modeTodayHint: 'Tabuleiro n.º {n}',
    modeTodayAgain: '🔢 Ver seu resultado', modeTodayDone: 'Hoje você fez {score} de 100. Amanhã tem outro tabuleiro.',
    modeSeed: '🔢 Jogar', seedLabel: 'Tabuleiro {seed}',
    resumeTitle: '⏯ Há um tabuleiro pela metade', resume: 'Continuar', delete: 'Apagar',
    boardLabel: 'Tabuleiro n.º {n}', left: 'Faltam {n} números', leftOne: 'Falta 1 número',
    undo: '↩ Desfazer', hintBtn: '💡 Dica (−{cost})',
    hintSay: 'Arraste o número que pulsa sobre o seu gêmeo.',
    hintUndid: 'Por ali já não dava para deixar um só número: desfiz {n} jogadas. Arraste o número que pulsa sobre o seu gêmeo.',
    hintUndidOne: 'Por ali já não dava para deixar um só número: desfiz 1 jogada. Arraste o número que pulsa sobre o seu gêmeo.',
    stuck: 'Não sobrou nenhuma jogada. Desfaça ou peça uma dica.',
    scoreTitle: '{score} de 100', solvedIn: 'Você resolveu em {time}.',
    hintsOne: '1 dica: −{cost}.', hintsMany: '{n} dicas: −{cost}.', nextBoard: 'Amanhã tem outro tabuleiro.',
    shareRotulo: '📤 Compartilhar', shareContext: 'Tabuleiro n.º {n}',
  },
  como: [
    '🎯 Junte os números até sobrar um só.',
    '👆 Arraste um número sobre um igual que esteja ao lado, acima ou abaixo: eles se somam, 8\u00a0+\u00a08\u00a0=\u00a016.',
    '⏱ Quanto mais rápido, mais pontos. Desfazer é grátis e cada dica tira 10.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
