/**
 * Registro central de juegos.
 * Para agregar un juego nuevo: crear carpeta /<id>/ con su index.html
 * y agregar una entrada aquí. El menú principal se genera desde esta lista.
 */
export const GAMES = [
  {
    id: 'cuarto-rey',
    name: 'Cuarto Rey',
    emoji: '👑',
    tagline: 'Naipes, sorbos y el temido cuarto rey.',
    players: '4 a 6 jugadores',
    duration: '20 a 40 min',
    needs: 'Solo el celular (el mazo va incluido) y tus tragos',
    path: 'cuarto-rey/',
    available: true,
  },
  {
    id: 'proximamente-1',
    name: 'Próximamente',
    emoji: '🎲',
    tagline: 'Más juegos en camino para el carrete.',
    players: '',
    duration: '',
    needs: '',
    path: '#',
    available: false,
  },
];
