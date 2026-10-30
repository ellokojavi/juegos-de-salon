/**
 * 🕵️ Agentes: its texts in the four languages (C-3), merged into rules.js (D-331, D-421).
 * `juego` is its entry in `juegos` (name, skill, steps, scoring, tiebreak); `ui`, the keys its
 * screen reads from T, all prefixed `ag`. The numbers come from the engine's constants.
 * `agDemo` is the waiting room's self-playing drawing: a clue, six cards, its three agents and
 * the assassin that looks like it, in each language's own words.
 */
import { CUANTAS, NEUTRALES, RESTA_NEUTRAL, RESTA_ASESINO } from './numbers.js';

const ES = {
  juego: {
    nombre: 'Agentes', habilidad: 'asociar',
    como: [
      `Cada palabra es el nombre en clave de un espía. Toca las que van con la pista: «MAR · 3» son 3. Llegan ${CUANTAS} pistas.`,
      `Evita las ${NEUTRALES} neutrales (−${RESTA_NEUTRAL}) y al asesino (−${RESTA_ASESINO}): se parecen a una pista y la cortan.`,
      'Si dudas, mantén apretada una carta para marcarla, o pasa de pista.',
    ],
    puntaje: `Los agentes encontrados valen hasta 100 puntos; cada neutral resta ${RESTA_NEUTRAL} y el asesino ${RESTA_ASESINO}.`,
    desempate: 'Si empatas, gana quien tardó menos.',
  },
  ui: {
    agStamp: 'Clasificado',
    agCredit: 'Inspirado en {juego}, de Vlaada Chvátil (Czech Games Edition).',
    agDemo: [
      { pista: 'MAR', cartas: ['LUNA', 'OLA', 'RÍO', 'BARCO', 'NUBE', 'ISLA'], agentes: [1, 3, 5], asesino: 2 },
      { pista: 'NOCHE', cartas: ['VELA', 'PAN', 'BÚHO', 'AUTO', 'DÍA', 'LUNA'], agentes: [0, 2, 5], asesino: 4 },
      { pista: 'CIRCO', cartas: ['TIGRE', 'PAYASO', 'MESA', 'CARPA', 'ZOO', 'LIBRO'], agentes: [1, 3, 0], asesino: 4 },
    ],
    agClue: 'Pista {n} de {t}', agMissing: 'Te faltan {n}', agMissingOne: 'Te falta 1',
    agPass: '⏭️ Siguiente pista', agFinish: '🏁 Terminar', agFinishSure: '🏁 Sí, terminar',
    agLeftOne: 'Queda 1 agente sin encontrar. ¿Terminas igual?', agLeft: 'Quedan {n} agentes sin encontrar. ¿Terminas igual?',
    agMarksHelp: '💡 Mantén apretada una carta para marcarla como sospecha 📌. Repite para descartarla 🚫 y otra vez para quitar la marca.',
    agDiscarded: '🚫 Descartada: mantenla apretada para quitarle la marca.',
    agMarkSuspect: '📌 Marcada, sin destapar. Tócala para destaparla.', agMarkDiscard: '🚫 Descartada: así no la destapas por error.', agMarkNone: 'Sin marca.',
    agSuspectLabel: '(sospecha)', agDiscardLabel: '(descartada)',
    agGood: '¡Bien! Es de los tuyos.', agOther: '¡Es de los tuyos! Pero de otra pista: igual suma.',
    agNeutral: `Neutral: −${RESTA_NEUTRAL}. Se corta la pista.`, agAssassin: `¡El asesino! −${RESTA_ASESINO}. Se corta la pista.`,
    agSealDone: 'Completa', agSealCut: 'Cortada', agSealPassed: 'Pasada',
    agEndWin: '¡Misión cumplida!', agEndHalf: 'Misión a medias', agEndFail: 'Misión fracasada', agEndAssassin: 'Te descubrió el asesino',
    agTrapHit: '💀 Caíste con {w}: parecía de {p}, pero no era de los tuyos.', agTrapDodged: '💀 Esquivaste al asesino: {w}, que parecía de {p}.',
    agTempts: '≈ {p}', agWholeBoard: '🗺️ El tablero entero',
    agBdFound: '🕵️ Encontraste {n} de {t} agentes: +{pts}.', agBdNeutralOne: '⬜ Tocaste 1 neutral: −{pts}.', agBdNeutrals: '⬜ Tocaste {n} neutrales: −{pts}.',
    agBdAssassin: '💀 Tocaste al asesino: −{pts}.',
  },
};

const EN = {
  juego: {
    nombre: 'Agents', habilidad: 'association',
    como: [
      `Every word is a spy’s codename. Tap the ones that go with the clue: “SEA · 3” means 3. ${CUANTAS} clues come.`,
      `Avoid the ${NEUTRALES} bystanders (−${RESTA_NEUTRAL}) and the assassin (−${RESTA_ASESINO}): they look like a clue and cut it short.`,
      'If you’re unsure, press and hold a card to mark it, or skip the clue.',
    ],
    puntaje: `The agents you find are worth up to 100 points; each bystander takes off ${RESTA_NEUTRAL} and the assassin ${RESTA_ASESINO}.`,
    desempate: 'On a tie, the faster player wins.',
  },
  ui: {
    agStamp: 'Classified',
    agCredit: 'Inspired by {juego}, by Vlaada Chvátil (Czech Games Edition).',
    agDemo: [
      { pista: 'SEA', cartas: ['MOON', 'WAVE', 'RIVER', 'SHIP', 'CLOUD', 'ISLAND'], agentes: [1, 3, 5], asesino: 2 },
      { pista: 'NIGHT', cartas: ['CANDLE', 'BREAD', 'OWL', 'CAR', 'DAY', 'MOON'], agentes: [0, 2, 5], asesino: 4 },
      { pista: 'CIRCUS', cartas: ['TIGER', 'CLOWN', 'TABLE', 'TENT', 'ZOO', 'BOOK'], agentes: [1, 3, 0], asesino: 4 },
    ],
    agClue: 'Clue {n} of {t}', agMissing: '{n} to go', agMissingOne: '1 to go',
    agPass: '⏭️ Next clue', agFinish: '🏁 Finish', agFinishSure: '🏁 Yes, finish',
    agLeftOne: '1 agent still hidden. Finish anyway?', agLeft: '{n} agents still hidden. Finish anyway?',
    agMarksHelp: '💡 Press and hold a card to mark it as a suspect 📌. Again to rule it out 🚫, and once more to clear the mark.',
    agDiscarded: '🚫 Ruled out: press and hold it to clear the mark.',
    agMarkSuspect: '📌 Marked, not revealed. Tap it to reveal it.', agMarkDiscard: '🚫 Ruled out: now you can’t reveal it by mistake.', agMarkNone: 'Mark cleared.',
    agSuspectLabel: '(suspect)', agDiscardLabel: '(ruled out)',
    agGood: 'Nice! One of yours.', agOther: 'One of yours! From another clue, but it still counts.',
    agNeutral: `Bystander: −${RESTA_NEUTRAL}. The clue is cut short.`, agAssassin: `The assassin! −${RESTA_ASESINO}. The clue is cut short.`,
    agSealDone: 'Complete', agSealCut: 'Cut', agSealPassed: 'Skipped',
    agEndWin: 'Mission accomplished!', agEndHalf: 'Mission half done', agEndFail: 'Mission failed', agEndAssassin: 'The assassin got you',
    agTrapHit: '💀 You fell for {w}: it looked like {p}, but it wasn’t one of yours.', agTrapDodged: '💀 You dodged the assassin: {w}, which looked like {p}.',
    agTempts: '≈ {p}', agWholeBoard: '🗺️ The whole board',
    agBdFound: '🕵️ You found {n} of {t} agents: +{pts}.', agBdNeutralOne: '⬜ You hit 1 bystander: −{pts}.', agBdNeutrals: '⬜ You hit {n} bystanders: −{pts}.',
    agBdAssassin: '💀 You hit the assassin: −{pts}.',
  },
};

const PT = {
  juego: {
    nombre: 'Agentes', habilidad: 'associação',
    como: [
      `Cada palavra é o codinome de um espião. Toque as que combinam com a pista: “MAR · 3” são 3. Chegam ${CUANTAS} pistas.`,
      `Evite as ${NEUTRALES} neutras (−${RESTA_NEUTRAL}) e o assassino (−${RESTA_ASESINO}): parecem de uma pista e a interrompem.`,
      'Na dúvida, segure uma carta para marcá-la, ou passe a pista.',
    ],
    puntaje: `Os agentes encontrados valem até 100 pontos; cada neutra tira ${RESTA_NEUTRAL} e o assassino ${RESTA_ASESINO}.`,
    desempate: 'Em caso de empate, ganha quem demorou menos.',
  },
  ui: {
    agStamp: 'Confidencial',
    agCredit: 'Inspirado em {juego}, de Vlaada Chvátil (Czech Games Edition).',
    agDemo: [
      { pista: 'MAR', cartas: ['LUA', 'ONDA', 'RIO', 'BARCO', 'NUVEM', 'ILHA'], agentes: [1, 3, 5], asesino: 2 },
      { pista: 'NOITE', cartas: ['VELA', 'PÃO', 'CORUJA', 'CARRO', 'DIA', 'LUA'], agentes: [0, 2, 5], asesino: 4 },
      { pista: 'CIRCO', cartas: ['TIGRE', 'PALHAÇO', 'MESA', 'LONA', 'ZOO', 'LIVRO'], agentes: [1, 3, 0], asesino: 4 },
    ],
    agClue: 'Pista {n} de {t}', agMissing: 'Faltam {n}', agMissingOne: 'Falta 1',
    agPass: '⏭️ Próxima pista', agFinish: '🏁 Terminar', agFinishSure: '🏁 Sim, terminar',
    agLeftOne: 'Ainda falta 1 agente. Terminar mesmo assim?', agLeft: 'Ainda faltam {n} agentes. Terminar mesmo assim?',
    agMarksHelp: '💡 Segure uma carta para marcá-la como suspeita 📌. De novo para descartá-la 🚫 e mais uma vez para tirar a marca.',
    agDiscarded: '🚫 Descartada: segure-a para tirar a marca.',
    agMarkSuspect: '📌 Marcada, sem revelar. Toque nela para revelar.', agMarkDiscard: '🚫 Descartada: assim você não a revela sem querer.', agMarkNone: 'Sem marca.',
    agSuspectLabel: '(suspeita)', agDiscardLabel: '(descartada)',
    agGood: 'Boa! É dos seus.', agOther: 'É dos seus! Mas de outra pista: vale do mesmo jeito.',
    agNeutral: `Neutra: −${RESTA_NEUTRAL}. A pista é interrompida.`, agAssassin: `O assassino! −${RESTA_ASESINO}. A pista é interrompida.`,
    agSealDone: 'Completa', agSealCut: 'Interrompida', agSealPassed: 'Passada',
    agEndWin: 'Missão cumprida!', agEndHalf: 'Missão pela metade', agEndFail: 'Missão fracassada', agEndAssassin: 'O assassino te pegou',
    agTrapHit: '💀 Você caiu em {w}: parecia de {p}, mas não era dos seus.', agTrapDodged: '💀 Você escapou do assassino: {w}, que parecia de {p}.',
    agTempts: '≈ {p}', agWholeBoard: '🗺️ O tabuleiro inteiro',
    agBdFound: '🕵️ Você encontrou {n} de {t} agentes: +{pts}.', agBdNeutralOne: '⬜ Você tocou 1 neutra: −{pts}.', agBdNeutrals: '⬜ Você tocou {n} neutras: −{pts}.',
    agBdAssassin: '💀 Você tocou o assassino: −{pts}.',
  },
};

export default { es: ES, en: EN, pt: PT };
