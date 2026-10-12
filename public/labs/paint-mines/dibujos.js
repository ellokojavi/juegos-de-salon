/**
 * Los dibujos de Pintaminas (D-289): 7×7, `#` se pinta y `.` no. Al resolver el tablero aparece el
 * dibujo y su nombre ("¡Era un pez!"). Son irregulares a propósito: uno simétrico se adivina por
 * espejo (el test los rechaza). Cada dibujo se pinta con sus colores de verdad (`colores`, nombres de
 * PALETA; pedido del dueño): la luna amarilla, el cactus verde, la bota café.
 * Un dibujo nuevo: que se reconozca a 7×7, entre 12 y 40 casillas pintadas, su nombre con artículo y
 * sus colores.
 */
export const DIBUJOS = [
  { nombre: 'Un pez', emoji: '🐟', colores: ['azul'], filas: ['.......', '.####.#', '#.#####', '#######', '.####.#', '.......', '.......'] },
  { nombre: 'Una luna', emoji: '🌙', colores: ['amarillo'], filas: ['..###..', '.##....', '##.....', '##.....', '###...#', '.######', '..####.'] },
  { nombre: 'Un velero', emoji: '⛵', colores: ['blanco'], filas: ['...#...', '...##..', '...###.', '...#...', '#######', '.#####.', '..###..'] },
  { nombre: 'Una bota', emoji: '👢', colores: ['café'], filas: ['.###...', '.###...', '.###...', '.###...', '.#####.', '.######', '.######'] },
  { nombre: 'Una llave', emoji: '🔑', colores: ['amarillo'], filas: ['.......', '###....', '#.#####', '###.#.#', '.......', '.......', '.......'] },
  { nombre: 'Una nota musical', emoji: '🎵', colores: ['azul'], filas: ['...###.', '...#.##', '...#..#', '...#...', '.###...', '####...', '.##....'] },
  { nombre: 'Un rayo', emoji: '⚡', colores: ['amarillo'], filas: ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....'] },
  { nombre: 'Un pato', emoji: '🦆', colores: ['amarillo'], filas: ['....##.', '...####', '....##.', '.#####.', '#######', '.#####.', '.......'] },
  { nombre: 'Un perro', emoji: '🐕', colores: ['café'], filas: ['.##....', '####...', '.###...', '.######', '.######', '.#...#.', '.#...#.'] },
  { nombre: 'Un cohete', emoji: '🚀', colores: ['blanco'], filas: ['.....##', '....###', '...###.', '.####..', '..##...', '.#.#...', '#......'] },
  { nombre: 'Un signo de pregunta', emoji: '❓', colores: ['rojo'], filas: ['.####..', '##..##.', '....##.', '...##..', '..##...', '.......', '..##...'] },
  { nombre: 'Un plátano', emoji: '🍌', colores: ['amarillo'], filas: ['......#', '.....##', '.....##', '....###', '#..###.', '#####..', '.###...'] },
  { nombre: 'Un cactus', emoji: '🌵', colores: ['verde'], filas: ['...#...', '#..#...', '#..#..#', '####..#', '...####', '...#...', '..###..'] },
  { nombre: 'Una guitarra', emoji: '🎸', colores: ['naranjo'], filas: ['......#', '.....#.', '....#..', '.###...', '#####..', '####...', '.##....'] },
  { nombre: 'Un martillo', emoji: '🔨', colores: ['café'], filas: ['#####..', '#####..', '..#....', '..#....', '..#....', '..#....', '..#....'] },
  { nombre: 'Una bandera', emoji: '🚩', colores: ['rojo'], filas: ['#......', '#####..', '######.', '#####..', '#......', '#......', '#......'] },
  { nombre: 'Una taza', emoji: '☕', colores: ['blanco'], filas: ['.......', '#####..', '######.', '#####.#', '######.', '#####..', '.###...'] },
];

/**
 * Los del modo difícil (D-291): dos colores, `#` el primero y `+` el segundo. También irregulares, con
 * al menos 4 casillas de cada color. Sus `colores`, en el orden `#`, `+`, son los de verdad y se
 * distinguen bien entre sí (nunca amarillo con naranjo: se confunden).
 */
export const DIBUJOS2 = [
  { nombre: 'Una frutilla', emoji: '🍓', colores: ['rojo', 'verde'], filas: ['...+...', '.+++.+.', '.#####.', '#######', '.######', '..###..', '...#...'] },
  { nombre: 'Un pez', emoji: '🐠', colores: ['azul', 'amarillo'], filas: ['..++...', '.###..+', '#.####+', '######+', '.###..+', '..++...', '.......'] },
  { nombre: 'Unas cerezas', emoji: '🍒', colores: ['rojo', 'verde'], filas: ['.....+.', '....++.', '...+.+.', '..+..+.', '###.###', '###.###', '.#...#.'] },
  { nombre: 'Un helado', emoji: '🍦', colores: ['rosado', 'café'], filas: ['..##...', '.####..', '######.', '.+++++.', '..+++..', '..++...', '...+...'] },
  { nombre: 'Un árbol', emoji: '🌳', colores: ['verde', 'café'], filas: ['..###..', '.#####.', '######.', '.####..', '...+...', '...+...', '..+++..'] },
  { nombre: 'Un cohete', emoji: '🚀', colores: ['blanco', 'naranjo'], filas: ['.....##', '....###', '...###.', '.####..', '..##...', '.++#...', '++.....'] },
  { nombre: 'Una casa', emoji: '🏠', colores: ['amarillo', 'rojo'], filas: ['.....#.', '..+++#.', '.+++++.', '+++++++', '.#####.', '.##.##.', '.##.##.'] },
  { nombre: 'Un pato', emoji: '🦆', colores: ['blanco', 'naranjo'], filas: ['...##..', '..###++', '...##..', '.#####.', '#######', '.#####.', '..+.+..'] },
  { nombre: 'Un lápiz', emoji: '✏️', colores: ['amarillo', 'café'], filas: ['......+', '....#+.', '...###.', '..###..', '.###...', '+##....', '++.....'] },
  { nombre: 'Una zanahoria', emoji: '🥕', colores: ['naranjo', 'verde'], filas: ['....+.+', '....++.', '...##..', '..###..', '..##...', '.##....', '#......'] },
];

/** Los colores con que se pinta, por su nombre (los usa `colores` de cada dibujo). `cuadro` es su emoji. */
export const PALETA = [
  { nombre: 'azul', color: '#4da3ff', cuadro: '🟦' },
  { nombre: 'rojo', color: '#ff4d5e', cuadro: '🟥' },
  { nombre: 'verde', color: '#7ddc3a', cuadro: '🟩' },
  { nombre: 'amarillo', color: '#ffd23f', cuadro: '🟨' },
  { nombre: 'naranjo', color: '#ff9f1c', cuadro: '🟧' },
  { nombre: 'morado', color: '#b48bff', cuadro: '🟪' },
  { nombre: 'café', color: '#b8773f', cuadro: '🟫' },
  { nombre: 'blanco', color: '#f2eee4', cuadro: '⬜' },
  { nombre: 'rosado', color: '#ff7eb6', cuadro: '🩷' },
];
