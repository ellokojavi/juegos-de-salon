/**
 * 🗼 Babel in La Copa: its texts in the three languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos`; `ui`, the keys its screen reads from T, all prefixed `sk`.
 * The name is Babel in every language; `skCredit` credits the original (its link is the game's name). Plural forms are [none, one, many].
 */
const ES = {
  juego: {
    nombre: 'Babel', habilidad: 'reflejos',
    como: [
      'Toca la pantalla para soltar el bloque que se desliza sobre la torre.',
      'Lo que sobresale se corta y el siguiente sale más chico. Si no cae sobre la torre, se acaba.',
      'Si lo sueltas justo encima del de abajo, no se corta nada. Desde la cuarta vez seguida, el bloque vuelve a crecer.',
    ],
    puntaje: 'Cada piso vale 1 punto; 3 perfectos seguidos dan +3, y cada perfecto más en la racha suma +1, +2… hasta +5.',
    desempate: 'Si empatas, gana quien armó su torre en menos tiempo.',
  },
  ui: {
    skTap: 'Toca donde sea para soltar el bloque',
    skPaused: 'En pausa',
    skResume: 'Toca para seguir',
    skPerfect: '¡Perfecto!',
    skStreak: 'Perfecto ×{n}',
    skOver: 'Fin del juego',
    skTrialDone: '¡Listo!',
    skContinue: 'Continuar',
    skMusicOn: '🎵 Música: sí',
    skMusicOff: '🔇 Música: no',
    skMusicCredit: '🎵 Música: {tema}, en Pixabay',
    skMusicBy: '{name}, de {by}',
    skFloors: ['pisos', 'piso', 'pisos'],
    skBdBlocks: ['🧱 Ningún piso: 0 puntos.', '🧱 1 piso: 1 punto.', '🧱 {n} pisos: {n} puntos.'],
    skBdStreaks: ['', '🔥 1 racha de 3 o más perfectos: +{p}.', '🔥 {n} rachas de 3 o más perfectos: +{p}.'],
    skBdLength: '📏 Por lo largo de las rachas: +{p}.',
    skBdStreak: '🔥 La racha perfecta más larga: {n} seguidas.',
    skCredit: 'Inspirado en {juego}, de Ketchapp.',
  },
};

const EN = {
  juego: {
    nombre: 'Babel', habilidad: 'reflexes',
    como: [
      'Tap the screen to drop the block sliding over the tower.',
      'Whatever hangs over the edge is cut off, and the next block is smaller. If it misses the tower, the game ends.',
      'Drop it exactly on the one below and nothing is cut. From the fourth time in a row, the block grows back.',
    ],
    puntaje: 'Each floor is 1 point; 3 perfects in a row give +3, and each further perfect in the streak adds +1, +2… up to +5.',
    desempate: 'If you tie, whoever built their tower faster wins.',
  },
  ui: {
    skTap: 'Tap anywhere to drop the block',
    skPaused: 'Paused',
    skResume: 'Tap to continue',
    skPerfect: 'Perfect!',
    skStreak: 'Perfect ×{n}',
    skOver: 'Game over',
    skTrialDone: 'Done!',
    skContinue: 'Continue',
    skMusicOn: '🎵 Music: on',
    skMusicOff: '🔇 Music: off',
    skMusicCredit: '🎵 Music: {tema}, on Pixabay',
    skMusicBy: '{name} by {by}',
    skFloors: ['floors', 'floor', 'floors'],
    skBdBlocks: ['🧱 No floors: 0 points.', '🧱 1 floor: 1 point.', '🧱 {n} floors: {n} points.'],
    skBdStreaks: ['', '🔥 1 streak of 3 or more perfects: +{p}.', '🔥 {n} streaks of 3 or more perfects: +{p}.'],
    skBdLength: '📏 For the streaks\' length: +{p}.',
    skBdStreak: '🔥 Longest perfect streak: {n} in a row.',
    skCredit: 'Inspired by {juego}, by Ketchapp.',
  },
};

const PT = {
  juego: {
    nombre: 'Babel', habilidad: 'reflexos',
    como: [
      'Toque a tela para soltar o bloco que desliza sobre a torre.',
      'O que sobra para fora é cortado, e o próximo bloco fica menor. Se ele não cair sobre a torre, o jogo acaba.',
      'Se você soltar bem em cima do de baixo, nada é cortado. A partir da quarta vez seguida, o bloco volta a crescer.',
    ],
    puntaje: 'Cada andar vale 1 ponto; 3 perfeitos seguidos dão +3, e cada perfeito a mais na sequência soma +1, +2… até +5.',
    desempate: 'Se empatar, ganha quem montou a torre em menos tempo.',
  },
  ui: {
    skTap: 'Toque em qualquer lugar para soltar o bloco',
    skPaused: 'Pausado',
    skResume: 'Toque para continuar',
    skPerfect: 'Perfeito!',
    skStreak: 'Perfeito ×{n}',
    skOver: 'Fim de jogo',
    skTrialDone: 'Pronto!',
    skContinue: 'Continuar',
    skMusicOn: '🎵 Música: sim',
    skMusicOff: '🔇 Música: não',
    skMusicCredit: '🎵 Música: {tema}, no Pixabay',
    skMusicBy: '{name}, de {by}',
    skFloors: ['andares', 'andar', 'andares'],
    skBdBlocks: ['🧱 Nenhum andar: 0 pontos.', '🧱 1 andar: 1 ponto.', '🧱 {n} andares: {n} pontos.'],
    skBdStreaks: ['', '🔥 1 sequência de 3 ou mais perfeitos: +{p}.', '🔥 {n} sequências de 3 ou mais perfeitos: +{p}.'],
    skBdLength: '📏 Pelo comprimento das sequências: +{p}.',
    skBdStreak: '🔥 A maior sequência perfeita: {n} seguidas.',
    skCredit: 'Inspirado em {juego}, da Ketchapp.',
  },
};

export default { es: ES, en: EN, pt: PT };
