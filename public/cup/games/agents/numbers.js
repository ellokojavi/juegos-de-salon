/**
 * 🕵️ Agentes' numbers (D-421), apart from the engine so the texts (merged into rules.js) can say
 * them without loading the four decks of clues.
 */
// One of the clues has one agent less (CORTAS): you cannot know in advance that they are all of 3,
// and it leaves room for one more trap
export const POR_PISTA = 3, CUANTAS = 4, CORTAS = 1, NEUTRALES = 3;
export const AGENTES = POR_PISTA * CUANTAS - CORTAS;
export const RESTA_NEUTRAL = 15, RESTA_ASESINO = 40;
/** The trial (D-103): two clues (3 and 2 agents), one neutral and the assassin. */
export const ENSAYO = { cuantas: 2, neutrales: 1 };
