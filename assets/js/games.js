/**
 * Registro central de juegos.
 * Para agregar un juego nuevo: crear carpeta /<id>/ con su index.html
 * y agregar una entrada aquí. Los textos van por idioma ({ es, en }).
 * El menú principal se genera desde esta lista.
 */
export const GAMES = [
  {
    id: 'cuarto-rey',
    emoji: '👑',
    name: { es: 'Cuarto Rey', en: 'Fourth King' },
    tagline: { es: 'Naipes, sorbos y el temido cuarto rey.', en: 'Cards, sips and the dreaded fourth king.' },
    players: '4–6',
    duration: '20–40',
    path: 'cuarto-rey/',
    available: true,
  },
  {
    id: 'toque-y-fama',
    emoji: '🔢',
    name: { es: 'Toque y Fama', en: 'Bulls and Cows' },
    tagline: { es: 'Próximamente: adivina el número secreto del rival.', en: 'Coming soon: guess your rival\'s secret number.' },
    players: '2',
    duration: '5–12',
    path: '#',
    available: false,
  },
];
