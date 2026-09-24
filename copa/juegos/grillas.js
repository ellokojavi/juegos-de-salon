/**
 * Las grillas de 🔗 Conexiones. Se escriben a mano y cada copa usa una.
 *
 * Cada grilla: cuatro grupos de cuatro palabras, del más fácil (nivel 0, amarillo) al más
 * difícil (nivel 3, morado). Tienen que costar (D-102): cada grilla trae **distractores**,
 * palabras que parecen de otro grupo (LUZ va en "verde" aunque también haya luz roja), y el
 * grupo morado suele ser un juego de palabras (esconden un animal, empiezan con una nota).
 * Temas generales, no solo chilenos: una grilla de comunas de Santiago se resolvía de memoria.
 *
 * Las reglas del test (copa/juegos/juegos.test.mjs):
 * - 16 palabras distintas por grilla, en mayúsculas y de 14 caracteres como mucho.
 * - Cada palabra es del suyo sin discusión cuando se mira la grilla entera: el distractor
 *   calza en otro grupo, pero ese grupo ya tiene sus cuatro sin él.
 * - Nada de groserías fuertes (C-1).
 */
export const GRILLAS = [
  {
    id: 'zapato',
    grupos: [
      { nombre: 'Partes de un zapato', palabras: ['SUELA', 'PLANTILLA', 'CORDÓN', 'LENGÜETA'] },
      { nombre: 'Cosas del billar', palabras: ['TACO', 'TIZA', 'BANDA', 'TRONERA'] },
      { nombre: '___ de mesa', palabras: ['TENIS', 'VINO', 'JUEGO', 'SAL'] },
      { nombre: 'Esconden un animal', palabras: ['ZAPATO', 'HERMOSO', 'PIRATA', 'MONOPOLIO'] },
    ],
  },
  {
    id: 'cielo',
    grupos: [
      { nombre: 'Signos del zodíaco', palabras: ['ARIES', 'TAURO', 'LEO', 'PISCIS'] },
      { nombre: 'Planetas', palabras: ['SATURNO', 'URANO', 'TIERRA', 'MERCURIO'] },
      { nombre: 'Dioses griegos', palabras: ['ZEUS', 'HERA', 'APOLO', 'HERMES'] },
      { nombre: 'Misiones espaciales', palabras: ['GÉMINIS', 'SOYUZ', 'VOSTOK', 'ARTEMISA'] },
    ],
  },
  {
    id: 'notas',
    grupos: [
      { nombre: 'Piezas de ajedrez', palabras: ['ALFIL', 'CABALLO', 'PEÓN', 'DAMA'] },
      { nombre: 'Unidades de peso', palabras: ['ONZA', 'GRAMO', 'QUINTAL', 'TONELADA'] },
      { nombre: 'Monedas', palabras: ['LIBRA', 'EURO', 'YEN', 'RUPIA'] },
      { nombre: 'Empiezan con una nota musical', palabras: ['DOMINGO', 'SOLAPA', 'MIRADA', 'FAROL'] },
    ],
  },
  {
    id: 'adivinanzas',
    grupos: [
      { nombre: 'Estar en las ___ (o en la ___)', palabras: ['NUBES', 'LUNA', 'BABIA', 'OTRA'] },
      { nombre: 'Tienen dientes', palabras: ['PEINE', 'SIERRA', 'AJO', 'ENGRANAJE'] },
      { nombre: 'Tienen cuello', palabras: ['BOTELLA', 'CAMISA', 'JIRAFA', 'PIE'] },
      { nombre: 'Tienen ojos pero no ven', palabras: ['AGUJA', 'PAPA', 'HURACÁN', 'PUENTE'] },
    ],
  },
  {
    id: 'colores',
    grupos: [
      { nombre: 'Frutas que son colores', palabras: ['NARANJA', 'LIMA', 'CEREZA', 'DURAZNO'] },
      { nombre: '___ negra', palabras: ['CAJA', 'OVEJA', 'VIUDA', 'LISTA'] },
      { nombre: '___ roja', palabras: ['ALFOMBRA', 'TARJETA', 'CRUZ', 'CAPERUCITA'] },
      { nombre: '___ verde', palabras: ['LUZ', 'TÉ', 'VIEJO', 'CHISTE'] },
    ],
  },
  {
    id: 'numeros',
    grupos: [
      { nombre: 'Asignaturas del colegio', palabras: ['QUÍMICA', 'FÍSICA', 'HISTORIA', 'MÚSICA'] },
      { nombre: 'Bodas de ___', palabras: ['ORO', 'PLATA', 'PAPEL', 'DIAMANTE'] },
      { nombre: 'Grupos de personas', palabras: ['TRIBU', 'CLAN', 'BANDA', 'PANDILLA'] },
      { nombre: 'Esconden un número', palabras: ['BRONCE', 'FAMILIA', 'CIENCIA', 'AYUNO'] },
    ],
  },
  {
    id: 'fiesta',
    grupos: [
      { nombre: 'Frutas tropicales', palabras: ['PIÑA', 'MANGO', 'PAPAYA', 'MARACUYÁ'] },
      { nombre: 'Películas de Pixar', palabras: ['COCO', 'CARS', 'SOUL', 'BRAVE'] },
      { nombre: 'Bailes', palabras: ['SALSA', 'MERENGUE', 'TANGO', 'SAMBA'] },
      { nombre: 'Salsas', palabras: ['PESTO', 'ALIOLI', 'CHIMICHURRI', 'BECHAMEL'] },
    ],
  },
  {
    id: 'avion',
    grupos: [
      { nombre: 'Signos de puntuación', palabras: ['COMA', 'PUNTO', 'GUION', 'PARÉNTESIS'] },
      { nombre: 'Tipos de letra', palabras: ['ARIAL', 'TIMES', 'CALIBRI', 'VERDANA'] },
      { nombre: 'Cortes de carne', palabras: ['LOMO', 'POSTA', 'PLATEADA', 'ASIENTO'] },
      { nombre: 'Partes de un avión', palabras: ['ALA', 'CABINA', 'TREN', 'COLA'] },
    ],
  },
  {
    id: 'mundo',
    grupos: [
      { nombre: 'Ríos de Europa', palabras: ['DANUBIO', 'SENA', 'TÁMESIS', 'RIN'] },
      { nombre: 'Islas', palabras: ['CUBA', 'MALTA', 'CHIPRE', 'CRETA'] },
      { nombre: 'Tragos', palabras: ['MOJITO', 'DAIQUIRI', 'MARGARITA', 'CAIPIRIÑA'] },
      { nombre: 'Ciudades con nombre de mujer', palabras: ['FLORENCIA', 'VICTORIA', 'LOURDES', 'ADELAIDA'] },
    ],
  },
  {
    id: 'cocina',
    grupos: [
      { nombre: 'Utensilios de cocina', palabras: ['BATIDOR', 'COLADOR', 'RALLADOR', 'CUCHARÓN'] },
      { nombre: 'Hierbas', palabras: ['ALBAHACA', 'ORÉGANO', 'ROMERO', 'LAUREL'] },
      { nombre: 'Pintores españoles', palabras: ['VELÁZQUEZ', 'DALÍ', 'MIRÓ', 'PICASSO'] },
      { nombre: 'Premios', palabras: ['NOBEL', 'OSCAR', 'GRAMMY', 'GOYA'] },
    ],
  },
  {
    id: 'mitos',
    grupos: [
      { nombre: 'Crías de animales', palabras: ['TERNERO', 'CORDERO', 'CACHORRO', 'LECHÓN'] },
      { nombre: 'Aparatos de gimnasia', palabras: ['POTRO', 'BARRA', 'ANILLAS', 'VIGA'] },
      { nombre: 'Constelaciones', palabras: ['ORIÓN', 'CASIOPEA', 'PEGASO', 'ANDRÓMEDA'] },
      { nombre: 'Criaturas míticas', palabras: ['UNICORNIO', 'GRIFO', 'FÉNIX', 'SIRENA'] },
    ],
  },
  {
    id: 'pantalla',
    grupos: [
      { nombre: 'Redes sociales', palabras: ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN'] },
      { nombre: 'Se hacen en el computador', palabras: ['COPIAR', 'PEGAR', 'GUARDAR', 'IMPRIMIR'] },
      { nombre: 'Se hacen en la peluquería', palabras: ['CORTAR', 'TEÑIR', 'PEINAR', 'ALISAR'] },
      { nombre: 'Golpes, en chileno', palabras: ['COMBO', 'CHARCHAZO', 'PATADA', 'CABEZAZO'] },
    ],
  },
];

/**
 * La grilla de la sesión de prueba (D-103): más fácil y fuera del sorteo, para que probar
 * Conexiones nunca adelante la grilla de verdad de una copa.
 */
export const GRILLA_ENSAYO = {
  id: 'ensayo',
  grupos: [
    { nombre: 'Colores', palabras: ['ROJO', 'AZUL', 'VERDE', 'AMARILLO'] },
    { nombre: 'Frutas', palabras: ['MANZANA', 'PERA', 'UVA', 'PLÁTANO'] },
    { nombre: 'Animales de la granja', palabras: ['VACA', 'GALLINA', 'CERDO', 'OVEJA'] },
    { nombre: 'Tienen teclas', palabras: ['PIANO', 'TECLADO', 'CALCULADORA', 'CONTROL'] },
  ],
};
