/**
 * Cuarto Rey — datos del juego: mazo, reglas por carta, mini-juegos,
 * penitencias y categorías. Solo datos, sin lógica de interfaz.
 * Ver docs/juegos/cuarto-rey.md para la especificación completa.
 */

export const SUITS = [
  { symbol: '♠', name: 'pica', color: 'black' },
  { symbol: '♥', name: 'corazón', color: 'red' },
  { symbol: '♦', name: 'diamante', color: 'red' },
  { symbol: '♣', name: 'trébol', color: 'black' },
];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const RANK_NAMES = {
  A: 'As', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete',
  8: 'Ocho', 9: 'Nueve', 10: 'Diez', J: 'Jota', Q: 'Reina', K: 'Rey',
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 6;
export const SORBOS = 2; // sorbos estándar por regla

/**
 * Reglas por carta.
 * kind:
 *  - drink      → alguien toma. `targets` indica quién.
 *  - minigame   → se juega un mini-juego (ver MINIGAMES).
 *  - penitencia → quien saca la carta cumple una penitencia.
 *  - gift       → quien saca la carta regala sorbos.
 *  - king       → cuenta reyes; el cuarto termina la partida.
 */
export const CARD_RULES = {
  A:  { kind: 'drink', targets: 'all',    title: '¡Todos toman!',          text: 'Todos los de la mesa toman dos sorbos. ¡Salud!' },
  2:  { kind: 'drink', targets: 'right',  title: 'Pa\' la derecha',         text: 'Tu compañero de la derecha toma dos sorbos.' },
  3:  { kind: 'drink', targets: 'left',   title: 'Pa\' la izquierda',       text: 'Tu compañero de la izquierda toma dos sorbos.' },
  4:  { kind: 'minigame', game: 'cuentacuentos', title: 'Cuenta Cuentos',   text: 'Hora de inventar una historia entre todos.' },
  5:  { kind: 'penitencia', title: 'Penitencia',                          text: 'Te tocó cumplir una penitencia. La mesa decide si la cumpliste.' },
  6:  { kind: 'minigame', game: 'chancho', title: 'Chancho Inflado',        text: 'Infla las mejillas y que te sigan.' },
  7:  { kind: 'minigame', game: 'cultura', title: 'Cultura Chupística',     text: 'Una categoría, una palabra cada uno, sin repetir.' },
  8:  { kind: 'gift', title: 'Regala sorbos',                              text: 'Tienes dos sorbos para regalar a quien quieras (o los dos a la misma persona).' },
  9:  { kind: 'minigame', game: 'nunca', title: 'Nunca Nunca',             text: 'Confiesa algo que nunca has hecho.' },
  10: { kind: 'drink', targets: 'self',   title: '¡Te toca a ti!',          text: 'Tomas dos sorbos. Sin reclamar.' },
  J:  { kind: 'drink', targets: 'men',    title: 'Toman los hombres',       text: 'Los hombres de la mesa toman dos sorbos.' },
  Q:  { kind: 'drink', targets: 'women',  title: 'Toman las mujeres',       text: 'Las mujeres de la mesa toman dos sorbos.' },
  K:  { kind: 'king', title: '¡Un Rey!',                                   text: 'Se cuenta un rey más. El cuarto se toma el vaso entero.' },
};

export const KING_MESSAGES = [
  { title: '¡Primer Rey!',   text: 'Tranquilos, recién empieza. Quedan tres reyes en el mazo.' },
  { title: '¡Segundo Rey!',  text: 'Ya van dos. La cosa se pone seria.' },
  { title: '¡Tercer Rey!',   text: 'Solo queda uno. Al próximo que le salga… se toma TODO el vaso.' },
  { title: '¡CUARTO REY!',   text: 'Se acabó. Te tomas todo lo que queda en el vaso. ¡Fondo, fondo, fondo!' },
];

/** Mini-juegos gatillados por cartas 4, 6, 7 y 9. */
export const MINIGAMES = {
  cuentacuentos: {
    name: 'Cuenta Cuentos',
    emoji: '📖',
    intro: 'Vamos a inventar una historia entre todos, una palabra a la vez.',
    rules: [
      'Quien sacó la carta parte diciendo la primera palabra de la historia.',
      'Siguiendo hacia la derecha, cada jugador agrega UNA palabra.',
      'La historia tiene que tener sentido (más o menos).',
      'Quien se demore más de 5 segundos, repita o rompa la historia, pierde y toma dos sorbos.',
    ],
    helper: 'timer',
  },
  chancho: {
    name: 'Chancho Inflado',
    emoji: '🐷',
    intro: 'Cuando quieras, infla las mejillas como un chancho.',
    rules: [
      'Quien sacó la carta puede inflar las mejillas en cualquier momento de la partida (no tiene que ser ahora).',
      'Apenas alguien lo note, también infla las mejillas y se queda callado.',
      'El último de la mesa en inflar las mejillas pierde y toma dos sorbos.',
      'Si alguien se ríe y se le escapa el aire… también toma.',
    ],
    helper: 'none',
  },
  cultura: {
    name: 'Cultura Chupística',
    emoji: '🧠',
    intro: 'Elige una categoría y todos van diciendo una palabra que calce.',
    rules: [
      'Quien sacó la carta elige la categoría (o pide una al celular).',
      'Siguiendo hacia la derecha, cada uno dice una palabra de esa categoría.',
      'No se puede repetir ni demorarse más de 5 segundos.',
      'Quien repita, se equivoque o se quede en blanco, pierde y toma dos sorbos.',
    ],
    helper: 'category',
  },
  nunca: {
    name: 'Nunca Nunca',
    emoji: '🙊',
    intro: 'Confiesa algo que NUNCA hayas hecho.',
    rules: [
      'Quien sacó la carta dice: “Nunca nunca he…” y completa la frase.',
      'Todos los que SÍ lo han hecho, toman dos sorbos.',
      'Si nadie lo ha hecho, quien lo dijo toma por fome.',
      'Se vale preguntar detalles después. Ahí está la gracia.',
    ],
    helper: 'nunca',
  },
};

export const PENITENCIAS = [
  'Imita a alguien de la mesa hasta que adivinen quién es.',
  'Canta el coro de la canción que elija la mesa, con sentimiento.',
  'Habla con acento argentino hasta tu próximo turno.',
  'Baila 15 segundos sin música. La mesa pone el ritmo con palmas.',
  'Cuenta tu peor panorama de carrete en 30 segundos.',
  'Haz 10 sentadillas mientras gritas el nombre de tu ex (o de tu mascota).',
  'Muestra la última foto de tu galería y explícala.',
  'Di un piropo a la persona de tu izquierda con cara seria.',
  'Haz una declaración de amor a tu vaso.',
  'Cuenta un chiste. Si nadie se ríe, tomas dos sorbos.',
  'Habla en tercera persona hasta tu próximo turno.',
  'Deja que la persona de tu derecha te ponga un apodo por el resto de la noche.',
  'Imita a un animal hasta que alguien adivine cuál es.',
  'Recita el abecedario al revés. Si te equivocas, dos sorbos.',
  'Haz una pose de modelo y mantenla hasta que saquen la próxima carta.',
  'Cuenta cuál fue tu peor corte de pelo y por qué.',
  'Vende un objeto de la mesa como si fueras de teletienda, 20 segundos.',
  'Da un discurso de agradecimiento como si hubieras ganado un premio.',
  'Repite un trabalenguas 3 veces seguidas sin equivocarte.',
  'Manda un audio de 10 segundos cantando al grupo de amigos.',
  'Haz una predicción de cómo va a terminar la noche para cada jugador.',
  'Elige a alguien y hazle la pregunta más incómoda que se te ocurra.',
  'Ponte de pie y anuncia el marcador del juego como relator deportivo.',
  'Bebe un sorbo con la mano no dominante y sin usar los dientes para nada.',
];

export const CATEGORIAS = [
  'Marcas de cerveza', 'Equipos de fútbol chilenos', 'Comunas de Santiago', 'Películas de Disney',
  'Marcas de autos', 'Nombres de cantantes chilenos', 'Sabores de helado', 'Países de Sudamérica',
  'Superhéroes', 'Verduras', 'Series de Netflix', 'Cosas que hay en un baño', 'Marcas de ropa deportiva',
  'Frutas', 'Razas de perros', 'Ciudades de Chile', 'Personajes de Los Simpson', 'Cócteles',
  'Instrumentos musicales', 'Videojuegos', 'Marcas de celulares', 'Palabras que terminen en -ción',
  'Cosas que se compran en el negocio de la esquina', 'Deportes olímpicos', 'Apps del celular',
  'Cosas que hay en una playa', 'Nombres de presidentes', 'Bandas de rock', 'Tipos de pan', 'Bebidas sin alcohol',
  'Colores', 'Profesiones', 'Animales de la selva', 'Cosas que se dicen en un carrete', 'Comidas chilenas',
];

export const NUNCA_NUNCA = [
  'Nunca nunca he mandado un mensaje a la persona equivocada.',
  'Nunca nunca me he quedado dormido en una micro y pasado mi parada.',
  'Nunca nunca he cantado karaoke en público.',
  'Nunca nunca he stalkeado a un ex en redes sociales.',
  'Nunca nunca he mentido para no ir a un evento.',
  'Nunca nunca he llorado con una película animada.',
  'Nunca nunca he perdido el celular en un carrete.',
  'Nunca nunca me he arrancado sin pagar de un lugar.',
  'Nunca nunca he fingido conocer a alguien que me saludó.',
  'Nunca nunca he comido algo que se cayó al suelo.',
  'Nunca nunca he mandado un audio borracho.',
  'Nunca nunca me he equivocado de nombre con alguien.',
  'Nunca nunca he llegado más de una hora tarde a algo importante.',
  'Nunca nunca he inventado una excusa médica.',
  'Nunca nunca he bailado solo frente al espejo.',
  'Nunca nunca he tenido una cita a ciegas.',
];
