/**
 * Sapiondo in La Copa: es, en, pt texts merged into cup/rules.js (C-3).
 */
const ES = {
  juego: {
    nombre: 'Saporín',
    habilidad: 'reflejos',
    como: [
      'Desliza adelante, izquierda o derecha en el tablero para cruzar sin retroceder.',
      'Desliza largo adelante para hacer Dash; frutas y pases cerca recargan cargas.',
      'Agarra frutas y pasa cerca de los autos para recargar tu Dash.',
    ],
    puntaje: '🛣️ +1 por carril, 🏁 +10 al llegar, 🍓 +1 por fruta y 💔 -1 por vida perdida.',
    desempate: 'Si empatan al llegar, gana el menor tiempo; si no, quien llegó más lejos.',
  },
  ui: {
    spLema: 'Cruza la autopista sin mirar atrás.',
    spDist: 'Carril {row}/{total}',
    spDashReady: '⚡ DASH LISTO',
    spDashWait: '⚡ {s}s',
    spSector1: 'Avenida',
    spSector2: 'Costanera',
    spSector3: 'Autopista nocturna',
    spCloseCall: '¡CERCA!',
    spPaused: 'En pausa',
    spResume: 'Toca para seguir',
    spWin: '🏆 ¡Cruzaste la laguna!',
    spCrash: '💥 ¡Te pilló el tránsito!',
    spContinue: 'Continuar',
    spBdDist: '🐸 Llegaste al carril {n} de {total}.',
    spBdBonus: ['', '🍓 1 fruta recogida.', '🍓 {n} frutas recogidas.'],
    spBdLives: '💔 -{n} por vidas perdidas.',
  },
};

const EN = {
  juego: {
    nombre: 'Dash Hopper',
    habilidad: 'reflexes',
    como: [
      'Swipe forward, left, or right on the board to cross lanes with no turning back.',
      'Swipe far forward to Dash; fruit and close calls restore charges.',
      'Snatch fruit and graze bumpers to recharge your Dash.',
    ],
    puntaje: '🛣️ +1 per lane, 🏁 +10 at finish, 🍓 +1 per fruit, and 💔 -1 per life lost.',
    desempate: 'If tied at finish, faster time wins; otherwise furthest distance wins.',
  },
  ui: {
    spLema: 'Cross the highway with no turning back.',
    spDist: 'Lane {row}/{total}',
    spDashReady: '⚡ DASH READY',
    spDashWait: '⚡ {s}s',
    spSector1: 'Suburb Ave',
    spSector2: 'City Highway',
    spSector3: 'Night Expressway',
    spCloseCall: 'CLOSE CALL!',
    spPaused: 'Paused',
    spResume: 'Tap to continue',
    spWin: '🏆 You reached the pond!',
    spCrash: '💥 Flattened by traffic!',
    spContinue: 'Continue',
    spBdDist: '🐸 Reached lane {n} of {total}.',
    spBdBonus: ['', '🍓 1 fruit collected.', '🍓 {n} fruit collected.'],
    spBdLives: '💔 -{n} for lives lost.',
  },
};

const PT = {
  juego: {
    nombre: 'Sapichão',
    habilidad: 'reflexos',
    como: [
      'Deslize para frente, esquerda ou direita no tabuleiro para cruzar sem voltar.',
      'Deslize longo para frente para dar Dash; frutas e por um triz recarregam cargas.',
      'Pegue frutas e passe raspando nos carros para recarregar o Dash.',
    ],
    puntaje: '🛣️ +1 por faixa, 🏁 +10 ao chegar, 🍓 +1 por fruta e 💔 -1 por vida perdida.',
    desempate: 'Se empatarem ao chegar, vence o menor tempo; senão, quem foi mais longe.',
  },
  ui: {
    spLema: 'Atravesse a rodovia sem olhar para trás.',
    spDist: 'Faixa {row}/{total}',
    spDashReady: '⚡ DASH PRONTO',
    spDashWait: '⚡ {s}s',
    spSector1: 'Avenida',
    spSector2: 'Via Expressa',
    spSector3: 'Rodovia Noturna',
    spCloseCall: 'POR UM TRIZ!',
    spPaused: 'Pausado',
    spResume: 'Toque para continuar',
    spWin: '🏆 Chegou à lagoa!',
    spCrash: '💥 Pego pelo trânsito!',
    spContinue: 'Continuar',
    spBdDist: '🐸 Chegou à faixa {n} de {total}.',
    spBdBonus: ['', '🍓 1 fruta pega.', '🍓 {n} frutas pegas.'],
    spBdLives: '💔 -{n} por vidas perdidas.',
  },
};

export default { es: ES, en: EN, pt: PT };
