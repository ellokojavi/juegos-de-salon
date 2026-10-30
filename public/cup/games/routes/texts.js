/**
 * 🚇 Rutas rotas: its texts in the four languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos` (name, skill, steps, scoring, tiebreak); `ui`, the keys its
 * screen reads from T, all prefixed `rr`. The Undo and Give up buttons reuse the cup's `undo` and `giveUp`.
 */
const ES = {
  juego: {
    nombre: 'Rutas rotas', habilidad: 'espacial',
    como: [
      'Une cada color en una sola línea, sin cortes entre piezas.',
      'Arrastra de una pieza a otra: el rectángulo entre ellas da media vuelta y sus piezas quedan al revés. Un toque gira una sola.',
      'Son 5 etapas en 7 minutos. Deshacer y reiniciar son gratis.',
    ],
    puntaje: 'Cada etapa vale 17 puntos. Con las cinco, hasta 10 más por rapidez, y hasta 5 por usar el mínimo de giros.',
    desempate: 'Si empatas, gana quien tardó menos.',
  },
  ui: {
    rrStage: 'Etapa {n} de {t}',
    rrScoreboard: 'Giros: {g} · Mínimo: {m}',
    rrClock: '⏳ {t}',
    rrRestart: 'Reiniciar',
    rrGiveUpSure: '¿Seguro?',
    rrUndone: 'Deshiciste el último giro: no cuenta.',
    rrRestarted: 'De vuelta al comienzo: los giros vuelven a 0.',
    rrStageDone: '🚇 ¡Etapa {n} lista!',
    rrStagePerfect: '🚇 ¡Etapa {n} en el mínimo!',
    rrEndPerfect: '¡Todas en el mínimo!',
    rrEndDone: '¡Rutas unidas!',
    rrEndTime: 'Se acabó el tiempo',
    rrEndGaveUp: 'Te rendiste',
    rrExBad: 'Antes: líneas cortadas.',
    rrExOk: 'Tras media vuelta: unidas.',
    rrCredit: 'Inspirado en {juego}, de Bricks and Chips.',
    rrBdStages: '🚇 Etapas ({n} de {t}): +{p}.',
    rrBdSpeed: '⏱ Rapidez ({t}): +{p}.',
    rrBdNoSpeed: '⏱ Rapidez: +0 (faltaron etapas).',
    rrBdTurns: '🔄 Giros ({g}, mínimo {m}): +{p}.',
    rrBdStage: '{c} Etapa {n}: {g} giros (mínimo {m}).',
    rrBdRestartOne: 'Reiniciaste 1 vez.',
    rrBdRestarts: 'Reiniciaste {n} veces.',
  },
};

const EN = {
  juego: {
    nombre: 'Broken Routes', habilidad: 'spatial',
    como: [
      'Join each color into a single line, with no breaks between pieces.',
      'Drag from one piece to another: the rectangle between them turns half a turn and its pieces end up upside down. A tap turns just one.',
      'There are 5 stages in 7 minutes. Undo and restart are free.',
    ],
    puntaje: 'Each stage is worth 17 points. With all five, up to 10 more for speed, and up to 5 for using the fewest turns.',
    desempate: 'On a tie, the faster player wins.',
  },
  ui: {
    rrStage: 'Stage {n} of {t}',
    rrScoreboard: 'Turns: {g} · Fewest: {m}',
    rrClock: '⏳ {t}',
    rrRestart: 'Restart',
    rrGiveUpSure: 'Sure?',
    rrUndone: 'You undid the last turn: it doesn’t count.',
    rrRestarted: 'Back to the start: turns go back to 0.',
    rrStageDone: '🚇 Stage {n} done!',
    rrStagePerfect: '🚇 Stage {n} in the fewest turns!',
    rrEndPerfect: 'All in the fewest turns!',
    rrEndDone: 'Routes joined!',
    rrEndTime: 'Time’s up',
    rrEndGaveUp: 'You gave up',
    rrExBad: 'Before: broken lines.',
    rrExOk: 'After half a turn: joined.',
    rrCredit: 'Inspired by {juego}, by Bricks and Chips.',
    rrBdStages: '🚇 Stages ({n} of {t}): +{p}.',
    rrBdSpeed: '⏱ Speed ({t}): +{p}.',
    rrBdNoSpeed: '⏱ Speed: +0 (stages missing).',
    rrBdTurns: '🔄 Turns ({g}, fewest {m}): +{p}.',
    rrBdStage: '{c} Stage {n}: {g} turns (fewest {m}).',
    rrBdRestartOne: 'You restarted 1 time.',
    rrBdRestarts: 'You restarted {n} times.',
  },
};

const PT = {
  juego: {
    nombre: 'Rotas Quebradas', habilidad: 'espacial',
    como: [
      'Ligue cada cor numa linha só, sem cortes entre as peças.',
      'Arraste de uma peça a outra: o retângulo entre elas dá meia-volta e suas peças ficam de ponta-cabeça. Um toque gira uma só.',
      'São 5 etapas em 7 minutos. Desfazer e reiniciar são de graça.',
    ],
    puntaje: 'Cada etapa vale 17 pontos. Com as cinco, até 10 a mais pela rapidez, e até 5 por usar o mínimo de giros.',
    desempate: 'Se empatar, ganha quem levou menos tempo.',
  },
  ui: {
    rrStage: 'Etapa {n} de {t}',
    rrScoreboard: 'Giros: {g} · Mínimo: {m}',
    rrClock: '⏳ {t}',
    rrRestart: 'Reiniciar',
    rrGiveUpSure: 'Certeza?',
    rrUndone: 'Você desfez o último giro: ele não conta.',
    rrRestarted: 'De volta ao começo: os giros voltam a 0.',
    rrStageDone: '🚇 Etapa {n} pronta!',
    rrStagePerfect: '🚇 Etapa {n} no mínimo!',
    rrEndPerfect: 'Todas no mínimo!',
    rrEndDone: 'Rotas ligadas!',
    rrEndTime: 'Acabou o tempo',
    rrEndGaveUp: 'Você desistiu',
    rrExBad: 'Antes: linhas cortadas.',
    rrExOk: 'Após meia-volta: ligadas.',
    rrCredit: 'Inspirado em {juego}, da Bricks and Chips.',
    rrBdStages: '🚇 Etapas ({n} de {t}): +{p}.',
    rrBdSpeed: '⏱ Rapidez ({t}): +{p}.',
    rrBdNoSpeed: '⏱ Rapidez: +0 (faltaram etapas).',
    rrBdTurns: '🔄 Giros ({g}, mínimo {m}): +{p}.',
    rrBdStage: '{c} Etapa {n}: {g} giros (mínimo {m}).',
    rrBdRestartOne: 'Você reiniciou 1 vez.',
    rrBdRestarts: 'Você reiniciou {n} vezes.',
  },
};

export default { es: ES, en: EN, pt: PT };
