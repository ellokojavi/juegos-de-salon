/**
 * Los dibujos de Pintaminas (D-289): 7×7, `#` es tinta y `.` es fondo. Al resolver el tablero aparece
 * el dibujo, con su color y su nombre ("¡Un pez!"). `cuadro` es el emoji de su color para compartir.
 * Un dibujo nuevo: que se reconozca a 7×7, con tinta y fondo bien repartidos (ni casi todo de un
 * color ni casi todo del otro), y su nombre con artículo.
 */
export const DIBUJOS = [
  { nombre: 'Un corazón', emoji: '❤️', color: '#ff4d6d', cuadro: '🟥', filas: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'] },
  { nombre: 'Una estrella', emoji: '⭐', color: '#ffd23f', cuadro: '🟨', filas: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'] },
  { nombre: 'Un pez', emoji: '🐟', color: '#2ee6d6', cuadro: '🟦', filas: ['.......', '.####.#', '#.#####', '#######', '.####.#', '.......', '.......'] },
  { nombre: 'Una casa', emoji: '🏠', color: '#ff9f1c', cuadro: '🟧', filas: ['...#...', '..###..', '.#####.', '#######', '.##.##.', '.##.##.', '.##.##.'] },
  { nombre: 'Un árbol', emoji: '🌳', color: '#9dff3a', cuadro: '🟩', filas: ['..###..', '.#####.', '#######', '.#####.', '...#...', '...#...', '..###..'] },
  { nombre: 'Un hongo', emoji: '🍄', color: '#ff5a5f', cuadro: '🟥', filas: ['..###..', '.#####.', '#######', '#######', '..###..', '..###..', '..###..'] },
  { nombre: 'Un paraguas', emoji: '☂️', color: '#b48bff', cuadro: '🟪', filas: ['..###..', '.#####.', '#######', '...#...', '...#...', '...#...', '..##...'] },
  { nombre: 'Una carita', emoji: '🙂', color: '#ffd23f', cuadro: '🟨', filas: ['.#####.', '#######', '##.#.##', '#######', '#.###.#', '##...##', '.#####.'] },
  { nombre: 'Una copa', emoji: '🏆', color: '#ffc93c', cuadro: '🟨', filas: ['#######', '#.###.#', '#.###.#', '.#####.', '..###..', '...#...', '..###..'] },
  { nombre: 'Un fantasma', emoji: '👻', color: '#e8e4ff', cuadro: '⬜', filas: ['..###..', '.#####.', '##.#.##', '#######', '#######', '#######', '#.#.#.#'] },
  { nombre: 'Una luna', emoji: '🌙', color: '#ffe08a', cuadro: '🟨', filas: ['..###..', '.##....', '##.....', '##.....', '##.....', '.##....', '..###..'] },
  { nombre: 'Una flor', emoji: '🌼', color: '#ff6fa8', cuadro: '🟪', filas: ['.#.#.#.', '#######', '.#####.', '..###..', '...#...', '.#.#.#.', '..###..'] },
  { nombre: 'Una campana', emoji: '🔔', color: '#ffd23f', cuadro: '🟨', filas: ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '#######', '...#...'] },
  { nombre: 'Una manzana', emoji: '🍎', color: '#ff4d4d', cuadro: '🟥', filas: ['...#...', '..#....', '.##.##.', '#######', '#######', '#######', '.#####.'] },
  { nombre: 'Un diamante', emoji: '💎', color: '#6fd3ff', cuadro: '🟦', filas: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'] },
  { nombre: 'Un barco', emoji: '⛵', color: '#6fa8ff', cuadro: '🟦', filas: ['...#...', '...##..', '...###.', '...#...', '#######', '.#####.', '..###..'] },
  { nombre: 'Un gato', emoji: '🐱', color: '#ff9f1c', cuadro: '🟧', filas: ['#.....#', '##...##', '#######', '#.#.#.#', '#######', '.#####.', '..#.#..'] },
];
