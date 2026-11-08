/**
 * 🐤 Aletazo in La Copa: its texts in the three languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos`; `ui`, the keys its screen reads from T, all prefixed `fl`.
 * The name is Aletazo in every language; `flCredit` credits the original (its link is the game's name,
 * to Wikipedia in the player's language: the game has no official page since 2014). Plural forms are
 * [none, one, many]. The lines come from the lab's game (labs/flap/game.js).
 */
const ES = {
  juego: {
    nombre: 'Aletazo', habilidad: 'reflejos',
    como: [
      'Toca la pantalla para que el pájaro dé un aletazo y suba un poco.',
      'Pasa por los aros y los huecos de los muros. Por el medio de un aro vale doble.',
      'Tienes 3 vidas: si chocas o te saltas un aro, pierdes una. Cada 5 pasos sube el nivel.',
    ],
    puntaje: 'Cada aro o hueco vale 1 punto; por el medio de un aro, 2.',
    desempate: 'Si empatas, gana quien voló menos tiempo.',
  },
  ui: {
    flTap: '👆 Toca para aletear',
    flPaused: 'En pausa',
    flResume: 'Toca para seguir',
    flLevel: 'Nivel {n}',
    flLives: '{n} vidas',
    flWalls: '¡Muros! Pasa por el hueco',
    flOver: '¡Se acabó!',
    flTrialDone: '¡Listo!',
    flContinue: 'Continuar',
    flVerdicts: ['Recién saliendo del nido 🐣', 'Ya le estás agarrando el vuelo', '¡Vuelas bonito! ✨', '¡Pájaro de altura! 🦅', '¡Dueño del cielo! 👑'],
    flPoints: ['puntos', 'punto', 'puntos'],
    flBdGates: ['⭕ Ningún aro ni hueco.', '⭕ 1 aro o hueco cruzado.', '⭕ {n} aros y huecos cruzados.'],
    flBdCenters: ['', '🎯 1 vez por el medio: +1.', '🎯 {n} veces por el medio: +{n}.'],
    flBdLevel: '📈 Llegaste al nivel {n}.',
    flLema: 'Un toque, un aletazo.',
    flCredit: 'Inspirado en {juego}, de Dong Nguyen.',
    flWiki: 'https://es.wikipedia.org/wiki/Flappy_Bird',
  },
};

const EN = {
  juego: {
    nombre: 'Aletazo', habilidad: 'reflexes',
    como: [
      'Tap the screen to make the bird flap and rise a little.',
      'Fly through the hoops and the gaps in the walls. Through a hoop\'s middle counts double.',
      'You have 3 lives: crash or skip a hoop and you lose one. Every 5 gates the level goes up.',
    ],
    puntaje: 'Each hoop or gap is 1 point; through a hoop\'s middle, 2.',
    desempate: 'If you tie, whoever flew for less time wins.',
  },
  ui: {
    flTap: '👆 Tap to flap',
    flPaused: 'Paused',
    flResume: 'Tap to continue',
    flLevel: 'Level {n}',
    flLives: '{n} lives',
    flWalls: 'Walls! Go through the gap',
    flOver: 'Game over!',
    flTrialDone: 'Done!',
    flContinue: 'Continue',
    flVerdicts: ['Fresh out of the nest 🐣', 'Getting the hang of it', 'Flying pretty! ✨', 'High flyer! 🦅', 'King of the sky! 👑'],
    flPoints: ['points', 'point', 'points'],
    flBdGates: ['⭕ No hoops or gaps.', '⭕ 1 hoop or gap crossed.', '⭕ {n} hoops and gaps crossed.'],
    flBdCenters: ['', '🎯 1 time through the middle: +1.', '🎯 {n} times through the middle: +{n}.'],
    flBdLevel: '📈 You reached level {n}.',
    flLema: 'One tap, one flap.',
    flCredit: 'Inspired by {juego}, by Dong Nguyen.',
    flWiki: 'https://en.wikipedia.org/wiki/Flappy_Bird',
  },
};

const PT = {
  juego: {
    nombre: 'Aletazo', habilidad: 'reflexos',
    como: [
      'Toque a tela para o pássaro bater as asas e subir um pouco.',
      'Passe pelos aros e pelas brechas dos muros. Pelo meio de um aro vale dobrado.',
      'Você tem 3 vidas: se bater ou pular um aro, perde uma. A cada 5 passagens o nível sobe.',
    ],
    puntaje: 'Cada aro ou brecha vale 1 ponto; pelo meio de um aro, 2.',
    desempate: 'Se empatar, ganha quem voou por menos tempo.',
  },
  ui: {
    flTap: '👆 Toque para bater as asas',
    flPaused: 'Pausado',
    flResume: 'Toque para continuar',
    flLevel: 'Nível {n}',
    flLives: '{n} vidas',
    flWalls: 'Muros! Passe pela brecha',
    flOver: 'Acabou!',
    flTrialDone: 'Pronto!',
    flContinue: 'Continuar',
    flVerdicts: ['Acabou de sair do ninho 🐣', 'Pegando o jeito', 'Voando bonito! ✨', 'Voo de altura! 🦅', 'Dono do céu! 👑'],
    flPoints: ['pontos', 'ponto', 'pontos'],
    flBdGates: ['⭕ Nenhum aro ou brecha.', '⭕ 1 aro ou brecha atravessado.', '⭕ {n} aros e brechas atravessados.'],
    flBdCenters: ['', '🎯 1 vez pelo meio: +1.', '🎯 {n} vezes pelo meio: +{n}.'],
    flBdLevel: '📈 Você chegou ao nível {n}.',
    flLema: 'Um toque, uma batida de asa.',
    flCredit: 'Inspirado em {juego}, de Dong Nguyen.',
    flWiki: 'https://pt.wikipedia.org/wiki/Flappy_Bird',
  },
};

export default { es: ES, en: EN, pt: PT };
