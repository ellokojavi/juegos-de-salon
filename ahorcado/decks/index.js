/**
 * Registro de temáticas. Para agregar una: crear el archivo del mazo y sumarlo aquí.
 * Cada carta: { id, emoji, es: { w, hint }, en: {...}, pt: {...} }.
 * "Mezcla" no tiene archivo propio: son todas las cartas juntas (ver docs/juegos/ahorcado.md).
 */
import { CHILE } from './chile.js';
import { ANIMALES } from './animales.js';
import { COMIDA } from './comida.js';
import { CINE } from './cine.js';
import { DEPORTES } from './deportes.js';

const TEMAS = [
  { id: 'chile', emoji: '🇨🇱', name: { es: 'Chile', en: 'Chile', pt: 'Chile' }, hint: { es: 'Cordillera, completos y volantines', en: 'Mountains, hot dogs and kites', pt: 'Cordilheira, cachorro-quente e pipas' }, cards: CHILE },
  { id: 'animales', emoji: '🐾', name: { es: 'Animales', en: 'Animals', pt: 'Animais' }, hint: { es: 'De la hormiga a la ballena', en: 'From the ant to the whale', pt: 'Da formiga à baleia' }, cards: ANIMALES },
  { id: 'comida', emoji: '🍕', name: { es: 'Comida', en: 'Food', pt: 'Comida' }, hint: { es: 'Lo que se pide y lo que se pelea', en: 'What you order and what you argue about', pt: 'O que se pede e o que se discute' }, cards: COMIDA },
  { id: 'cine', emoji: '🎬', name: { es: 'Cine y series', en: 'Movies and TV', pt: 'Cinema e séries' }, hint: { es: 'Títulos, criaturas y spoilers', en: 'Titles, creatures and spoilers', pt: 'Títulos, criaturas e spoilers' }, cards: CINE },
  { id: 'deportes', emoji: '⚽', name: { es: 'Deportes', en: 'Sports', pt: 'Esportes' }, hint: { es: 'Canchas, medallas y árbitros', en: 'Pitches, medals and referees', pt: 'Quadras, medalhas e árbitros' }, cards: DEPORTES },
];

export const DECKS = [
  ...TEMAS,
  { id: 'mezcla', emoji: '🎲', name: { es: 'Mezcla', en: 'Mixed', pt: 'Mistura' }, hint: { es: 'Todas las temáticas en la misma bolsa', en: 'Every theme in the same bag', pt: 'Todos os temas no mesmo saco' }, cards: TEMAS.flatMap(t => t.cards) },
];

export const getDeck = id => DECKS.find(d => d.id === id) || DECKS[DECKS.length - 1];
