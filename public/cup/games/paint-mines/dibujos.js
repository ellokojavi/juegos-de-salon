/**
 * The Pintaminas drawings (D-289): 7×7, `#` is painted and `.` is not. Solving the board reveals the
 * drawing and what it was ("🐟 ¡Era un pez!"). They are irregular on purpose: a symmetric one can be
 * guessed by mirroring (the test rejects them). Each drawing is painted in its real colors (`colores`,
 * ids from PALETA; the owner's request): the yellow moon, the green cactus, the brown boot.
 * The data is language-free (D-331): `id` names the drawing, and its words ("¡Era un pez!") live in
 * texts.js (`pmDibujos`), like the color names (`pmColores`).
 * A new drawing: recognizable at 7×7, between 12 and 40 painted cells, its colors, and its sentence
 * in the four languages in texts.js.
 */
export const DIBUJOS = [
  { id: 'pez', emoji: '🐟', colores: ['azul'], filas: ['.......', '.####.#', '#.#####', '#######', '.####.#', '.......', '.......'] },
  { id: 'luna', emoji: '🌙', colores: ['amarillo'], filas: ['..###..', '.##....', '##.....', '##.....', '###...#', '.######', '..####.'] },
  { id: 'velero', emoji: '⛵', colores: ['blanco'], filas: ['...#...', '...##..', '...###.', '...#...', '#######', '.#####.', '..###..'] },
  { id: 'bota', emoji: '👢', colores: ['café'], filas: ['.###...', '.###...', '.###...', '.###...', '.#####.', '.######', '.######'] },
  { id: 'llave', emoji: '🔑', colores: ['amarillo'], filas: ['.......', '###....', '#.#####', '###.#.#', '.......', '.......', '.......'] },
  { id: 'nota', emoji: '🎵', colores: ['azul'], filas: ['...###.', '...#.##', '...#..#', '...#...', '.###...', '####...', '.##....'] },
  { id: 'rayo', emoji: '⚡', colores: ['amarillo'], filas: ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....'] },
  { id: 'pato', emoji: '🦆', colores: ['amarillo'], filas: ['....##.', '...####', '....##.', '.#####.', '#######', '.#####.', '.......'] },
  { id: 'perro', emoji: '🐕', colores: ['café'], filas: ['.##....', '####...', '.###...', '.######', '.######', '.#...#.', '.#...#.'] },
  { id: 'cohete', emoji: '🚀', colores: ['blanco'], filas: ['.....##', '....###', '...###.', '.####..', '..##...', '.#.#...', '#......'] },
  { id: 'pregunta', emoji: '❓', colores: ['rojo'], filas: ['.####..', '##..##.', '....##.', '...##..', '..##...', '.......', '..##...'] },
  { id: 'platano', emoji: '🍌', colores: ['amarillo'], filas: ['......#', '.....##', '.....##', '....###', '#..###.', '#####..', '.###...'] },
  { id: 'cactus', emoji: '🌵', colores: ['verde'], filas: ['...#...', '#..#...', '#..#..#', '####..#', '...####', '...#...', '..###..'] },
  { id: 'guitarra', emoji: '🎸', colores: ['naranjo'], filas: ['......#', '.....#.', '....#..', '.###...', '#####..', '####...', '.##....'] },
  { id: 'martillo', emoji: '🔨', colores: ['café'], filas: ['#####..', '#####..', '..#....', '..#....', '..#....', '..#....', '..#....'] },
  { id: 'bandera', emoji: '🚩', colores: ['rojo'], filas: ['#......', '#####..', '######.', '#####..', '#......', '#......', '#......'] },
  { id: 'taza', emoji: '☕', colores: ['blanco'], filas: ['.......', '#####..', '######.', '#####.#', '######.', '#####..', '.###...'] },
];

/**
 * The hard variant's drawings (D-291): two colors, `#` the first and `+` the second. Also irregular,
 * with at least 4 cells of each color. Their `colores`, in the order `#`, `+`, are the real ones and
 * are easy to tell apart (never yellow with orange: they get mixed up).
 */
export const DIBUJOS2 = [
  { id: 'frutilla', emoji: '🍓', colores: ['rojo', 'verde'], filas: ['...+...', '.+++.+.', '.#####.', '#######', '.######', '..###..', '...#...'] },
  { id: 'pez', emoji: '🐠', colores: ['azul', 'amarillo'], filas: ['..++...', '.###..+', '#.####+', '######+', '.###..+', '..++...', '.......'] },
  { id: 'cerezas', emoji: '🍒', colores: ['rojo', 'verde'], filas: ['.....+.', '....++.', '...+.+.', '..+..+.', '###.###', '###.###', '.#...#.'] },
  { id: 'helado', emoji: '🍦', colores: ['rosado', 'café'], filas: ['..##...', '.####..', '######.', '.+++++.', '..+++..', '..++...', '...+...'] },
  { id: 'arbol', emoji: '🌳', colores: ['verde', 'café'], filas: ['..###..', '.#####.', '######.', '.####..', '...+...', '...+...', '..+++..'] },
  { id: 'cohete', emoji: '🚀', colores: ['blanco', 'naranjo'], filas: ['.....##', '....###', '...###.', '.####..', '..##...', '.++#...', '++.....'] },
  { id: 'casa', emoji: '🏠', colores: ['amarillo', 'rojo'], filas: ['.....#.', '..+++#.', '.+++++.', '+++++++', '.#####.', '.##.##.', '.##.##.'] },
  { id: 'pato', emoji: '🦆', colores: ['blanco', 'naranjo'], filas: ['...##..', '..###++', '...##..', '.#####.', '#######', '.#####.', '..+.+..'] },
  { id: 'lapiz', emoji: '✏️', colores: ['amarillo', 'café'], filas: ['......+', '....#+.', '...###.', '..###..', '.###...', '+##....', '++.....'] },
  { id: 'zanahoria', emoji: '🥕', colores: ['naranjo', 'verde'], filas: ['....+.+', '....++.', '...##..', '..###..', '..##...', '.##....', '#......'] },
];

/** The paint colors, by id (each drawing's `colores` uses them). `cuadro` is its emoji square. The ids are data, not words. */
export const PALETA = [
  { id: 'azul', color: '#4da3ff', cuadro: '🟦' },
  { id: 'rojo', color: '#ff4d5e', cuadro: '🟥' },
  { id: 'verde', color: '#7ddc3a', cuadro: '🟩' },
  { id: 'amarillo', color: '#ffd23f', cuadro: '🟨' },
  { id: 'naranjo', color: '#ff9f1c', cuadro: '🟧' },
  { id: 'morado', color: '#b48bff', cuadro: '🟪' },
  { id: 'café', color: '#b8773f', cuadro: '🟫' },
  { id: 'blanco', color: '#f2eee4', cuadro: '⬜' },
  { id: 'rosado', color: '#ff7eb6', cuadro: '🩷' },
];
