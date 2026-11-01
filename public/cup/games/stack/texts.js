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
    puntaje: 'Cada bloque que pones en la torre vale 2 puntos, hasta 100.',
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
    skFloors: ['pisos', 'piso', 'pisos'],
    skBlocks: ['Ningún bloque', '1 bloque', '{n} bloques'],
    skBdBlocks: ['🧱 Ningún bloque en la torre: 0 puntos.', '🧱 1 bloque en la torre: 2 puntos.', '🧱 {n} bloques en la torre: {p} puntos.'],
    skBdPerfects: ['🎯 Ninguna caída perfecta.', '🎯 1 caída perfecta.', '🎯 {n} caídas perfectas.'],
    skBdStreak: '🔥 La racha perfecta más larga: {n} seguidas.',
    skBdCap: '🏆 Llegaste al máximo: 100 puntos.',
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
    puntaje: 'Each block you place on the tower is worth 2 points, up to 100.',
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
    skFloors: ['floors', 'floor', 'floors'],
    skBlocks: ['No blocks', '1 block', '{n} blocks'],
    skBdBlocks: ['🧱 No blocks on the tower: 0 points.', '🧱 1 block on the tower: 2 points.', '🧱 {n} blocks on the tower: {p} points.'],
    skBdPerfects: ['🎯 No perfect drops.', '🎯 1 perfect drop.', '🎯 {n} perfect drops.'],
    skBdStreak: '🔥 Longest perfect streak: {n} in a row.',
    skBdCap: '🏆 You reached the top: 100 points.',
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
    puntaje: 'Cada bloco que você coloca na torre vale 2 pontos, até 100.',
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
    skFloors: ['andares', 'andar', 'andares'],
    skBlocks: ['Nenhum bloco', '1 bloco', '{n} blocos'],
    skBdBlocks: ['🧱 Nenhum bloco na torre: 0 pontos.', '🧱 1 bloco na torre: 2 pontos.', '🧱 {n} blocos na torre: {p} pontos.'],
    skBdPerfects: ['🎯 Nenhuma queda perfeita.', '🎯 1 queda perfeita.', '🎯 {n} quedas perfeitas.'],
    skBdStreak: '🔥 A maior sequência perfeita: {n} seguidas.',
    skBdCap: '🏆 Você chegou ao máximo: 100 pontos.',
    skCredit: 'Inspirado em {juego}, da Ketchapp.',
  },
};

export default { es: ES, en: EN, pt: PT };
