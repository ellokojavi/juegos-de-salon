/**
 * TODO(port): this game's texts in the four languages (C-3), merged into rules.js (D-331).
 * `juego`: its entry in `juegos` (nombre, habilidad, como, puntaje, desempate and, with variants,
 * `variantes`); `ui`: the keys its screen reads from T, each one prefixed with the game's own prefix.
 */
const ES = { juego: { nombre: 'Loteo', habilidad: 'lógica', como: ['Divide el tablero en lotes rectangulares.'], puntaje: 'Hasta 100 puntos.', variantes: { numbers: { nombre: '🔢 Números' }, utilities: { nombre: '⚡💧 Servicios' } } }, ui: {} };
const otro = nombre => ({ ...ES, juego: { ...ES.juego, nombre } });
export default { es: ES, en: otro('Plots'), pt: otro('Loteamento'), de: otro('Parzellen') };
