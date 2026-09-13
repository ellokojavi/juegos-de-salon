/**
 * Registro central de juegos.
 * Para agregar un juego nuevo: crear carpeta /<id>/ con su index.html
 * y agregar una entrada aquí. Los textos van por idioma ({ es, en, pt }).
 * El menú principal se genera desde esta lista.
 */
export const GAMES = [
  {
    id: 'linea-de-tiempo',
    emoji: '⏳',
    name: { es: 'Línea de Tiempo', en: 'Timeline', pt: 'Linha do Tempo' },
    tagline: { es: 'Ubica los hitos en el orden correcto. Historia o música, solo o hasta seis.', en: 'Put the milestones in the right order. History or music, alone or up to six.', pt: 'Coloque os marcos na ordem certa. História ou música, sozinho ou até seis.' },
    players: '1–6',
    duration: '10–20',
    path: 'linea-de-tiempo/',
    available: true,
  },
  {
    id: 'toque-y-fama',
    emoji: '🔢',
    name: { es: 'Toque y Fama', en: 'Bulls and Cows', pt: 'Toque e Fama' },
    tagline: { es: 'Adivina el número secreto. En un celular, en dos, o contra el celular.', en: 'Crack the secret number. One phone, two phones, or versus the phone.', pt: 'Descubra o número secreto. Em um celular, em dois, ou contra o celular.' },
    players: '1–2',
    duration: '5–12',
    path: 'toque-y-fama/',
    available: true,
  },
  {
    id: 'ahorcado',
    emoji: '🪢',
    name: { es: 'El Ahorcado', en: 'Hangman', pt: 'Forca' },
    tagline: { es: 'Adivina tu palabra antes de que se acaben los errores. Acá nadie se queda mirando.', en: 'Crack your word before the mistakes run out. Nobody sits this one out.', pt: 'Descubra sua palavra antes que os erros acabem. Aqui ninguém fica só olhando.' },
    players: '1–6',
    duration: '5–12',
    path: 'ahorcado/',
    available: true,
  },
  {
    id: 'batalla-naval',
    emoji: '⚓',
    name: { es: 'Batalla Naval', en: 'Battleship', pt: 'Batalha Naval' },
    tagline: { es: 'Hunde la flota del rival antes de que hunda la tuya. En un celular o contra el celular.', en: 'Sink your rival\'s fleet before they sink yours. One phone or versus the phone.', pt: 'Afunde a frota do rival antes que ele afunde a sua. Em um celular ou contra o celular.' },
    players: '1–2',
    duration: '10–20',
    path: 'batalla-naval/',
    available: true,
  },
  {
    id: 'cuarto-rey',
    emoji: '👑',
    name: { es: 'Cuarto Rey', en: 'Fourth King', pt: 'Quarto Rei' },
    tagline: { es: 'Naipes, sorbos y el temido cuarto rey.', en: 'Cards, sips and the dreaded fourth king.', pt: 'Cartas, goles e o temido quarto rei.' },
    players: '4–6',
    duration: '20–40',
    path: 'cuarto-rey/',
    available: true,
  },
];
