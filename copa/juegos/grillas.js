/**
 * Las grillas de 🔗 Conexiones. Se escriben a mano, en chileno, y cada copa usa una.
 *
 * Cada grilla: cuatro grupos de cuatro palabras, del más fácil (nivel 0, amarillo) al más
 * difícil (nivel 3, morado). Las reglas del test (copa/juegos/juegos.test.mjs):
 * - 16 palabras distintas por grilla, en mayúsculas y de 14 caracteres como mucho (caben en
 *   una casilla de un celular de 320 px).
 * - Un distractor es bienvenido (una palabra que parece de otro grupo), pero cada palabra
 *   tiene que ser del suyo sin discusión cuando se mira la grilla entera.
 * - Nada de groserías fuertes (C-1).
 */
export const GRILLAS = [
  {
    id: 'fiestas',
    grupos: [
      { nombre: 'Fiestas Patrias', palabras: ['FONDA', 'RAMADA', 'CUECA', 'VOLANTÍN'] },
      { nombre: 'En la mesa de la once', palabras: ['MARRAQUETA', 'HALLULLA', 'PALTA', 'TÉ'] },
      { nombre: 'Pastelería de barrio', palabras: ['CHILENITO', 'BERLÍN', 'CALZONES ROTOS', 'KUCHEN'] },
      { nombre: 'Tragos con nombre raro', palabras: ['TERREMOTO', 'COLA DE MONO', 'JOTE', 'PISCOLA'] },
    ],
  },
  {
    id: 'geografia',
    grupos: [
      { nombre: 'Ciudades del norte', palabras: ['ARICA', 'IQUIQUE', 'ANTOFAGASTA', 'CALAMA'] },
      { nombre: 'Islas', palabras: ['CHILOÉ', 'RAPA NUI', 'NAVARINO', 'MOCHA'] },
      { nombre: 'Ríos', palabras: ['BIOBÍO', 'MAIPO', 'MAULE', 'LOA'] },
      { nombre: 'Volcanes', palabras: ['VILLARRICA', 'OSORNO', 'CALBUCO', 'LLAIMA'] },
    ],
  },
  {
    id: 'chilenismos',
    grupos: [
      { nombre: 'Formas de decir plata', palabras: ['LUCAS', 'CHAUCHAS', 'BILLETE', 'MONEDAS'] },
      { nombre: 'Formas de decir amigo', palabras: ['COMPADRE', 'CUMPA', 'SOCIO', 'YUNTA'] },
      { nombre: 'Formas de decir fiesta', palabras: ['CARRETE', 'MALÓN', 'TOCATA', 'JUERGA'] },
      { nombre: 'Formas de decir tonto', palabras: ['GIL', 'LESO', 'PAVO', 'TARADO'] },
    ],
  },
  {
    id: 'futbol',
    grupos: [
      { nombre: 'Jugadores de la Generación Dorada', palabras: ['VIDAL', 'SÁNCHEZ', 'MEDEL', 'ARÁNGUIZ'] },
      { nombre: 'Estadios', palabras: ['MONUMENTAL', 'NACIONAL', 'SAN CARLOS', 'SAUSALITO'] },
      { nombre: 'Puestos en la cancha', palabras: ['ARQUERO', 'VOLANTE', 'LATERAL', 'PUNTERO'] },
      { nombre: 'Apodos de clubes', palabras: ['CACIQUE', 'CHUNCHO', 'CRUZADOS', 'PIRATAS'] },
    ],
  },
  {
    id: 'musica',
    grupos: [
      { nombre: 'Instrumentos andinos', palabras: ['CHARANGO', 'QUENA', 'ZAMPOÑA', 'BOMBO'] },
      { nombre: 'Bandas chilenas', palabras: ['LOS JAIVAS', 'LA LEY', 'LOS BUNKERS', 'LOS TRES'] },
      { nombre: 'Cosas del Festival de Viña', palabras: ['GAVIOTA', 'MONSTRUO', 'ANTORCHA', 'QUINTA VERGARA'] },
      { nombre: 'Tienen apellido Parra', palabras: ['VIOLETA', 'NICANOR', 'ÁNGEL', 'ISABEL'] },
    ],
  },
  {
    id: 'tele',
    grupos: [
      { nombre: 'Personajes de 31 Minutos', palabras: ['TULIO', 'BODOQUE', 'JUANÍN', 'POLICARPO'] },
      { nombre: 'Personajes de Condorito', palabras: ['YAYITA', 'DON CHUMA', 'COMEGATO', 'PEPE CORTISONA'] },
      { nombre: 'Canales de televisión', palabras: ['TVN', 'MEGA', 'CHV', 'CANAL 13'] },
      { nombre: 'Juegos de patio', palabras: ['RAYUELA', 'EMBOQUE', 'TROMPO', 'LUCHE'] },
    ],
  },
  {
    id: 'comida',
    grupos: [
      { nombre: 'Platos típicos', palabras: ['CAZUELA', 'CHARQUICÁN', 'POROTOS', 'CURANTO'] },
      { nombre: 'Mariscos', palabras: ['LOCO', 'PIURE', 'CHORITO', 'MACHA'] },
      { nombre: 'Le ponen al completo italiano', palabras: ['PALTA', 'TOMATE', 'MAYO', 'VIENESA'] },
      { nombre: 'Frutos del sur', palabras: ['MAQUI', 'MURTA', 'CALAFATE', 'AVELLANA'] },
    ],
  },
  {
    id: 'micro',
    grupos: [
      { nombre: 'Tipos de pan', palabras: ['AMASADO', 'COLIZA', 'DOBLADITA', 'MARRAQUETA'] },
      { nombre: 'Se ven en la micro', palabras: ['TIMBRE', 'PASILLO', 'CHOFER', 'PASAMANOS'] },
      { nombre: 'Tiendas chilenas', palabras: ['FALABELLA', 'RIPLEY', 'PARIS', 'HITES'] },
      { nombre: 'Se "toman" en Chile', palabras: ['MICRO', 'ONCE', 'PELO', 'SOL'] },
    ],
  },
  {
    id: 'sudamerica',
    grupos: [
      { nombre: 'Capitales', palabras: ['LIMA', 'QUITO', 'CARACAS', 'ASUNCIÓN'] },
      { nombre: 'Monedas', palabras: ['SOL', 'PESO', 'REAL', 'GUARANÍ'] },
      { nombre: 'Próceres', palabras: ["O'HIGGINS", 'SAN MARTÍN', 'BOLÍVAR', 'SUCRE'] },
      { nombre: 'Ríos', palabras: ['AMAZONAS', 'ORINOCO', 'PARANÁ', 'MAGDALENA'] },
    ],
  },
  {
    id: 'raqueta',
    grupos: [
      { nombre: 'Se juegan con raqueta', palabras: ['TENIS', 'PÁDEL', 'SQUASH', 'BÁDMINTON'] },
      { nombre: 'Tenistas chilenos', palabras: ['RÍOS', 'MASSÚ', 'GONZÁLEZ', 'JARRY'] },
      { nombre: 'Palabras del tenis', palabras: ['SET', 'QUIEBRE', 'VOLEA', 'SAQUE'] },
      { nombre: 'Apellidos que son colores', palabras: ['ROJAS', 'BLANCO', 'MORENO', 'PARDO'] },
    ],
  },
  {
    id: 'naturaleza',
    grupos: [
      { nombre: 'Árboles nativos', palabras: ['ARAUCARIA', 'ALERCE', 'QUILLAY', 'PEUMO'] },
      { nombre: 'Pájaros', palabras: ['CHINCOL', 'LOICA', 'TIUQUE', 'QUELTEHUE'] },
      { nombre: 'Mamíferos', palabras: ['PUDÚ', 'GUANACO', 'CHINGUE', 'DEGÚ'] },
      { nombre: 'Están en el escudo', palabras: ['CÓNDOR', 'HUEMUL', 'ESTRELLA', 'PLUMAS'] },
    ],
  },
  {
    id: 'santiago',
    grupos: [
      { nombre: 'Comunas', palabras: ['PROVIDENCIA', 'MAIPÚ', 'ÑUÑOA', 'RENCA'] },
      { nombre: 'Estaciones de metro', palabras: ['BAQUEDANO', 'TOBALABA', 'PAJARITOS', 'LOS DOMINICOS'] },
      { nombre: 'Avenidas', palabras: ['ALAMEDA', 'IRARRÁZAVAL', 'GRECIA', 'MATTA'] },
      { nombre: 'Cerros', palabras: ['SAN CRISTÓBAL', 'SANTA LUCÍA', 'MANQUEHUE', 'CALÁN'] },
    ],
  },
];
