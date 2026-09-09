/**
 * Registro de temáticas. Para agregar una: crear el archivo del mazo y sumarlo aquí.
 * Cada carta: { id, year, emoji, es, en } (ver docs/juegos/linea-de-tiempo.md).
 */
import { HISTORIA } from './historia.js';
import { MUSICA } from './musica.js';

export const DECKS = [
  { id: 'historia', emoji: '📜', name: { es: 'Historia', en: 'History' }, hint: { es: 'Hitos de la humanidad', en: 'Milestones of humankind' }, cards: HISTORIA },
  { id: 'musica', emoji: '🎵', name: { es: 'Música', en: 'Music' }, hint: { es: 'De Beethoven a TikTok', en: 'From Beethoven to TikTok' }, cards: MUSICA },
];

export const getDeck = id => DECKS.find(d => d.id === id) || DECKS[0];
