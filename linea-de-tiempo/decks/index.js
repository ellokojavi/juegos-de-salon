/**
 * Registro de temáticas. Para agregar una: crear el archivo del mazo y sumarlo aquí.
 * Cada carta: { id, year, emoji, es, en, pt } (ver docs/juegos/linea-de-tiempo.md).
 */
import { HISTORIA } from './historia.js';
import { MUSICA } from './musica.js';
import { CHILE } from './chile.js';
import { POP } from './pop.js';

export const DECKS = [
  { id: 'historia', emoji: '📜', name: { es: 'Historia', en: 'History', pt: 'História' }, hint: { es: 'Hitos de la humanidad', en: 'Milestones of humankind', pt: 'Marcos da humanidade' }, cards: HISTORIA },
  { id: 'musica', emoji: '🎵', name: { es: 'Música', en: 'Music', pt: 'Música' }, hint: { es: 'De Beethoven a TikTok', en: 'From Beethoven to TikTok', pt: 'De Beethoven ao TikTok' }, cards: MUSICA },
  { id: 'chile', emoji: '🇨🇱', name: { es: 'Chile', en: 'Chile', pt: 'Chile' }, hint: { es: 'Del terremoto del 60 al estallido', en: 'From the 1960 quake to the uprising', pt: 'Do terremoto de 1960 aos protestos de 2019' }, cards: CHILE },
  { id: 'pop', emoji: '🍿', name: { es: 'Cultura pop', en: 'Pop culture', pt: 'Cultura pop' }, hint: { es: 'Cine, memes y videojuegos', en: 'Movies, memes and video games', pt: 'Cinema, memes e videogames' }, cards: POP },
];

export const getDeck = id => DECKS.find(d => d.id === id) || DECKS[0];
