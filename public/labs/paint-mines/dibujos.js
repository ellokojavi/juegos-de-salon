/**
 * Los dibujos de Pintaminas (D-289): 7×7, `#` se pinta y `.` no. Al resolver el tablero aparece el
 * dibujo y su nombre ("¡Era un pez!"). Son irregulares a propósito: uno simétrico se adivina por
 * espejo (el test los rechaza). El color de cada tablero sale al azar de PALETA, no del dibujo.
 * Un dibujo nuevo: que se reconozca a 7×7, entre 12 y 40 casillas pintadas, y su nombre con artículo.
 */
export const DIBUJOS = [
  { nombre: 'Un pez', emoji: '🐟', filas: ['.......', '.####.#', '#.#####', '#######', '.####.#', '.......', '.......'] },
  { nombre: 'Una luna', emoji: '🌙', filas: ['..###..', '.##....', '##.....', '##.....', '###...#', '.######', '..####.'] },
  { nombre: 'Un velero', emoji: '⛵', filas: ['...#...', '...##..', '...###.', '...#...', '#######', '.#####.', '..###..'] },
  { nombre: 'Una bota', emoji: '👢', filas: ['.###...', '.###...', '.###...', '.###...', '.#####.', '.######', '.######'] },
  { nombre: 'Una llave', emoji: '🔑', filas: ['.......', '###....', '#.#####', '###.#.#', '.......', '.......', '.......'] },
  { nombre: 'Una nota musical', emoji: '🎵', filas: ['...###.', '...#.##', '...#..#', '...#...', '.###...', '####...', '.##....'] },
  { nombre: 'Un rayo', emoji: '⚡', filas: ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....'] },
  { nombre: 'Un pato', emoji: '🦆', filas: ['....##.', '...####', '....##.', '.#####.', '#######', '.#####.', '.......'] },
  { nombre: 'Un perro', emoji: '🐕', filas: ['.##....', '####...', '.###...', '.######', '.######', '.#...#.', '.#...#.'] },
  { nombre: 'Un cohete', emoji: '🚀', filas: ['.....##', '....###', '...###.', '.####..', '..##...', '.#.#...', '#......'] },
  { nombre: 'Un signo de pregunta', emoji: '❓', filas: ['.####..', '##..##.', '....##.', '...##..', '..##...', '.......', '..##...'] },
  { nombre: 'Un plátano', emoji: '🍌', filas: ['......#', '.....##', '.....##', '....###', '#..###.', '#####..', '.###...'] },
  { nombre: 'Un cactus', emoji: '🌵', filas: ['...#...', '#..#...', '#..#..#', '####..#', '...####', '...#...', '..###..'] },
  { nombre: 'Una guitarra', emoji: '🎸', filas: ['......#', '.....#.', '....#..', '.###...', '#####..', '####...', '.##....'] },
  { nombre: 'Un martillo', emoji: '🔨', filas: ['#####..', '#####..', '..#....', '..#....', '..#....', '..#....', '..#....'] },
  { nombre: 'Una bandera', emoji: '🚩', filas: ['#......', '#####..', '######.', '#####..', '#......', '#......', '#......'] },
  { nombre: 'Una taza', emoji: '☕', filas: ['.......', '#####..', '######.', '#####.#', '######.', '#####..', '.###...'] },
];

/**
 * Los del modo difícil (D-291): dos colores, `#` el primero y `+` el segundo. También irregulares, con
 * al menos 4 casillas de cada color.
 */
export const DIBUJOS2 = [
  { nombre: 'Una frutilla', emoji: '🍓', filas: ['...+...', '.+++.+.', '.#####.', '#######', '.######', '..###..', '...#...'] },
  { nombre: 'Un pez', emoji: '🐠', filas: ['..++...', '.###..+', '#.####+', '######+', '.###..+', '..++...', '.......'] },
  { nombre: 'Unas cerezas', emoji: '🍒', filas: ['.....+.', '....++.', '...+.+.', '..+..+.', '###.###', '###.###', '.#...#.'] },
  { nombre: 'Un helado', emoji: '🍦', filas: ['..##...', '.####..', '######.', '.+++++.', '..+++..', '..++...', '...+...'] },
  { nombre: 'Un árbol', emoji: '🌳', filas: ['..###..', '.#####.', '######.', '.####..', '...+...', '...+...', '..+++..'] },
  { nombre: 'Un cohete', emoji: '🚀', filas: ['.....##', '....###', '...###.', '.####..', '..##...', '.++#...', '++.....'] },
  { nombre: 'Una casa', emoji: '🏠', filas: ['.....#.', '..+++#.', '.+++++.', '+++++++', '.#####.', '.##.##.', '.##.##.'] },
  { nombre: 'Un pato', emoji: '🦆', filas: ['...##..', '..###++', '...##..', '.#####.', '#######', '.#####.', '..+.+..'] },
  { nombre: 'Un lápiz', emoji: '✏️', filas: ['......+', '....#+.', '...###.', '..###..', '.###...', '+##....', '++.....'] },
  { nombre: 'Una zanahoria', emoji: '🥕', filas: ['....+.+', '....++.', '...##..', '..###..', '..##...', '.##....', '#......'] },
];

/** Los colores con que se pinta: cada tablero toma uno al azar. `cuadro` es su emoji para compartir. */
export const PALETA = [
  { nombre: 'azul', color: '#4da3ff', cuadro: '🟦' },
  { nombre: 'rojo', color: '#ff4d5e', cuadro: '🟥' },
  { nombre: 'verde', color: '#7ddc3a', cuadro: '🟩' },
  { nombre: 'amarillo', color: '#ffd23f', cuadro: '🟨' },
  { nombre: 'naranjo', color: '#ff9f1c', cuadro: '🟧' },
  { nombre: 'morado', color: '#b48bff', cuadro: '🟪' },
];
