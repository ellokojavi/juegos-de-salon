/**
 * Registro de temáticas. Para agregar una: crear el archivo del mazo y sumarlo aquí.
 * Cada carta: { id, emoji, es: { w, hint }, en: {...}, pt: {...}, de: {...} }.
 * "Mezcla" no tiene archivo propio: son todas las cartas juntas (ver docs/games/hangman.md).
 */
import { CHILE } from './chile.js';
import { ANIMALES } from './animales.js';
import { COMIDA } from './comida.js';
import { CINE } from './cine.js';
import { DEPORTES } from './deportes.js';

const TEMAS = [
  { id: 'chile', emoji: '🇨🇱', name: { es: 'Chile', en: 'Chile', pt: 'Chile', de: 'Chile' }, hint: { es: 'Cordillera, completos y volantines', en: 'Mountains, hot dogs and kites', pt: 'Cordilheira, cachorro-quente e pipas', de: 'Anden, Hotdogs und Drachen' }, cards: CHILE },
  { id: 'animales', emoji: '🐾', name: { es: 'Animales', en: 'Animals', pt: 'Animais', de: 'Tiere' }, hint: { es: 'De la hormiga a la ballena', en: 'From the ant to the whale', pt: 'Da formiga à baleia', de: 'Von der Ameise bis zum Wal' }, cards: ANIMALES },
  { id: 'comida', emoji: '🍕', name: { es: 'Comida', en: 'Food', pt: 'Comida', de: 'Essen' }, hint: { es: 'Lo que se pide y lo que se pelea', en: 'What you order and what you argue about', pt: 'O que se pede e o que se discute', de: 'Was man bestellt und worum man streitet' }, cards: COMIDA },
  { id: 'cine', emoji: '🎬', name: { es: 'Cine y series', en: 'Movies and TV', pt: 'Cinema e séries', de: 'Kino und Serien' }, hint: { es: 'Títulos, criaturas y spoilers', en: 'Titles, creatures and spoilers', pt: 'Títulos, criaturas e spoilers', de: 'Titel, Kreaturen und Spoiler' }, cards: CINE },
  { id: 'deportes', emoji: '⚽', name: { es: 'Deportes', en: 'Sports', pt: 'Esportes', de: 'Sport' }, hint: { es: 'Canchas, medallas y árbitros', en: 'Pitches, medals and referees', pt: 'Campos, medalhas e árbitros', de: 'Plätze, Medaillen und Schiris' }, cards: DEPORTES },
];

export const DECKS = [
  ...TEMAS,
  { id: 'mezcla', emoji: '🎲', name: { es: 'Mezcla', en: 'Mixed', pt: 'Mistura', de: 'Mix' }, hint: { es: 'Todas las temáticas en la misma bolsa', en: 'Every theme in the same bag', pt: 'Todos os temas no mesmo saco', de: 'Alle Themen in einem Topf' }, cards: TEMAS.flatMap(t => t.cards) },
];

export const getDeck = id => DECKS.find(d => d.id === id) || DECKS[DECKS.length - 1];
