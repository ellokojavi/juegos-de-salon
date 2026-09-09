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
    tagline: { es: 'Adivina el número secreto. En un celular, en dos, o contra el celular.', en: 'Crack the secret number. One phone, two phones, or versus the phone.' },
    players: '1–2',
    duration: '5–12',
    path: 'toque-y-fama/',
    available: true,
  },
  {
    id: 'batalla-naval',
    emoji: '⚓',
    name: { es: 'Batalla Naval', en: 'Battleship' },
    tagline: { es: 'Hunde la flota del rival antes de que hunda la tuya. En un celular o contra el celular.', en: 'Sink your rival\'s fleet before they sink yours. One phone or versus the phone.' },
    players: '1–2',
    duration: '10–20',
    path: 'batalla-naval/',
    available: true,
  },
];
