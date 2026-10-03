import { fuera } from './audiencia.js';

/**
 * Las palabras secretas de 🔤 Toque y Fama: Palabra. Cinco letras distintas, sin tilde (la Ñ
 * vale), comunes en Chile. Las reglas del test (copa/juegos/juegos.test.mjs): cinco letras,
 * todas distintas, solo A–Z y Ñ, y sin repetir palabras en la lista.
 *
 * Los intentos pueden ser cualquier combinación de cinco letras distintas: no hay diccionario,
 * igual que en Toque y Fama cualquier número de cifras distintas vale como intento.
 */
export const PALABRAS = [
  'ACERO', 'AGUDO', 'ANCHO', 'ANTES', 'BARCO', 'BLUSA', 'BOLSA', 'BRAZO', 'BRISA', 'BURLA',
  'BUSTO', 'CABRO', 'CALDO', 'CAMPO', 'CANTO', 'CARNE', 'CERDO', 'CESTO', 'CIELO', 'CINTA',
  'CLAVE', 'COBRE', 'COSTA', 'CUERO', 'CULPA', 'CURSO', 'CURVA', 'DULCE', 'FIRMA', 'FLACO',
  'FLOTA', 'FORMA', 'FRENO', 'FRUTA', 'FUEGO', 'GOLPE', 'GRANO', 'GRUPO', 'GUAPO', 'HIELO',
  'HONDA', 'HUASO', 'HUECO', 'HUEVO', 'HUMOR', 'JOVEN', 'JUEGO', 'JULIO', 'JUNIO', 'LABIO',
  'LENTO', 'LIBRO', 'LUCHA', 'LUNES', 'MANGO', 'MARCO', 'MIEDO', 'MONTE', 'MOSCA',
  'MUNDO', 'MUSGO', 'MUSLO', 'NEGRO', 'NOCHE', 'NORTE', 'NUBES', 'NUEVO', 'PALCO', 'PARED',
  'PASTO', 'PECHO', 'PERLA', 'PIANO', 'PINTA', 'PISCO', 'PLATO', 'PLAZO', 'PLUMA', 'PALMO',
  'POSTE', 'PRADO', 'PRIMO', 'PULSO', 'PUNTO', 'QUESO', 'RELOJ', 'RIEGO', 'RUBIO', 'RUIDO',
  'SABIO', 'SALTO', 'SANTO', 'SOBRE', 'SUCIO', 'SUDOR', 'SUELO', 'SUEÑO', 'TANGO', 'TARDE',
  'TECHO', 'TIGRE', 'TRIGO', 'TURNO', 'VERSO', 'VIAJE', 'VOLAR', 'LIMBO', 'CISNE', 'DISCO',
  'ROSCA', 'TRUCO', 'HOGAR', 'LUGAR', 'MIRLO', 'PULGA', 'PERSA', 'RUMBO', 'TIMON', 'VIRUS', 'ZURDO',
];

/**
 * En inglés y en portugués (D-170): las de cada idioma, no una traducción. Las mismas reglas,
 * sin Ñ: cinco letras distintas de la A a la Z. En portugués, sin tilde ni Ç (FOGÃO, BRAÇO no
 * entran), como el español deja fuera las tildes.
 */
export const PALABRAS_EN = [
  'ABOUT', 'ACTOR', 'ADULT', 'AFTER', 'AGENT', 'ALIEN', 'ANGEL', 'ANGRY', 'APRIL', 'BACON',
  'BADGE', 'BEACH', 'BEARD', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLOCK', 'BLOND', 'BOARD',
  'BRAIN', 'BRAND', 'BREAD', 'BRICK', 'BRIDE', 'BRING', 'BROWN', 'BRUSH', 'CABIN', 'CAMEL',
  'CANDY', 'CHAIR', 'CHALK', 'CHARM', 'CHART', 'CHEAP', 'CHEST', 'CHIEF', 'CHILD', 'CLAIM',
  'CLEAN', 'CLIMB', 'CLOAK', 'CLOTH', 'CLOUD', 'CLOWN', 'COAST', 'CORAL', 'COUNT', 'CRANE',
  'CRASH', 'CREAM', 'CRIME', 'CROWN', 'CRUMB', 'DANCE', 'DEPTH', 'DIRTY', 'DOUBT', 'DOZEN',
  'DRAFT', 'DRAIN', 'DREAM', 'DRINK', 'DRIVE', 'EARLY', 'EARTH', 'EIGHT', 'EMPTY', 'FAINT',
  'FAITH', 'FALSE', 'FANCY', 'FIELD', 'FIGHT', 'FLAME', 'FLASH', 'FLOAT', 'FLOUR', 'FOCUS',
  'FORCE', 'FRAME', 'FRESH', 'FRONT', 'FROST', 'FRUIT', 'GHOST', 'GIANT', 'GLOVE', 'GRACE',
  'GRADE', 'GRAIN', 'GRAPE', 'GRAPH', 'GUARD', 'GUEST', 'GUIDE', 'HABIT', 'HEART', 'HONEY',
  'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'JUICE', 'KNIFE', 'LASER', 'LAUGH', 'LEMON', 'LIGHT',
  'LUNCH', 'MAGIC', 'MAJOR', 'MANGO', 'MARCH', 'MATCH', 'MOUSE', 'MOUTH', 'MUSIC', 'NIGHT',
  'NOISE', 'NORTH', 'OCEAN', 'OFTEN', 'ORBIT', 'PAINT', 'PARTY', 'PIANO', 'PILOT', 'PLACE',
  'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND', 'PRICE', 'PRIDE', 'PRINT', 'PROUD', 'QUIET',
  'RADIO', 'RIVAL', 'ROAST', 'ROBIN', 'ROUGH', 'ROUND', 'ROYAL', 'SAINT', 'SCALE', 'SCARF',
  'SHAPE', 'SHARK', 'SHIRT', 'SHORE', 'SHOUT', 'SLICE', 'SMILE', 'SNAKE', 'SOLAR', 'SOUTH',
  'SPACE', 'SPARK', 'SPICE', 'SPORT', 'STAIR', 'STAMP', 'STONE', 'STORM', 'STORY', 'SUGAR',
  'SWING', 'TABLE', 'TIGER', 'TOWEL', 'TRAIN', 'TRUCK', 'UNCLE', 'VOICE', 'WATER',
  'WHALE', 'WHEAT', 'WORLD', 'WRIST', 'YOUTH', 'ZEBRA',
];

export const PALABRAS_PT = [
  'ALUNO', 'AMIGO', 'ANTES', 'BARCO', 'BEIJO', 'BICHO', 'BLUSA', 'BOLHA', 'BOLSA', 'BRAVO',
  'BRISA', 'CALDO', 'CALOR', 'CAMPO', 'CANTO', 'CARNE', 'CERTO', 'CHEIO', 'CHUVA', 'CINTO',
  'CINZA', 'CLIMA', 'COBRE', 'COFRE', 'COLAR', 'CORDA', 'CURSO', 'CUSTO', 'DIGNO',
  'DISCO', 'DOCES', 'DUPLO', 'FARDO', 'FEIRA', 'FESTA', 'FILME', 'FIRMA', 'FLUXO', 'FOLHA',
  'FORMA', 'FREIO', 'FRUTA', 'FUNDO', 'GALHO', 'GARFO', 'GOLFE', 'GOLPE', 'GORDA', 'GRAVE',
  'GRUPO', 'HUMOR', 'JEITO', 'JOGAR', 'JOVEM', 'JUNTO', 'JUSTO', 'LARGO', 'LENTO',
  'LIMBO', 'LINDO', 'LITRO', 'LIVRO', 'LOUCA', 'LUGAR', 'LUVAS', 'MAGRO', 'MAIOR',
  'MARCO', 'METRO', 'MILHO', 'MOEDA', 'MORTE', 'MOSCA', 'MUITO', 'MULTA',
  'MUNDO', 'MUSGO', 'NOBRE', 'NORTE', 'NUVEM', 'OBRAS', 'OLHAR', 'ORDEM', 'OUTRA', 'PADRE',
  'PALCO', 'PARDO', 'PASTO', 'PEDIR', 'PEDRA', 'PEITO', 'PERNA', 'PIANO', 'PILHA',
  'PINGO', 'PISTA', 'PLANO', 'PLUMA', 'POMAR', 'PONTE', 'POSTE', 'POUCA', 'PRATO', 'PRAZO',
  'PRETO', 'PRIMO', 'PULGA', 'PUNHO', 'QUASE', 'RAMOS', 'REINO', 'RESTO', 'RISCO', 'ROUPA',
  'SABOR', 'SALTO', 'SANTO', 'SELVA', 'SENHA', 'SERVO', 'SINAL', 'SOBRE', 'SOLAR', 'SURDO',
  'TALCO', 'TARDE', 'TECLA', 'TELHA', 'TEMPO', 'TERNO', 'TIGRE', 'TOCAR', 'TRIGO', 'TROCA',
  'TURMA', 'TURNO', 'VENTO', 'VERSO', 'VIDRO', 'VIOLA', 'VOLTA', 'VULTO', 'ZEBRA',
];

/**
 * En alemán, para el laboratorio: las mismas reglas, sin Ñ. Sin Ä, Ö, Ü ni ß (BLÜTE, SCHÖN no
 * entran), como el portugués deja fuera las tildes y la Ç.
 */
export const PALABRAS_DE = [
  'ABEND', 'ADLER', 'ANGST', 'ANKER', 'APFEL', 'ARMUT', 'BADEN', 'BAUEN', 'BAUER', 'BIRNE',
  'BLECH', 'BLICK', 'BLITZ', 'BLOND', 'BLUME', 'BODEN', 'BOGEN', 'BOHNE', 'BRAUN', 'BRAUT',
  'BRIEF', 'BRUST', 'BUCHT', 'DACHS', 'DAMPF', 'DATUM', 'DOCHT', 'DRAHT', 'FADEN', 'FALKE',
  'FARBE', 'FISCH', 'FLACH', 'FLUCH', 'FRECH', 'FUCHS', 'GABEL', 'GEIST', 'GLANZ', 'GRUBE',
  'GURKE', 'HABEN', 'HAFEN', 'HAGEL', 'HONIG', 'HOBEL', 'HOLEN', 'HOSEN', 'HOTEL', 'HUMOR',
  'HUNDE', 'INSEL', 'JACKE', 'JUBEL', 'KABEL', 'KAMEL', 'KAMIN', 'KAMPF', 'KATZE', 'KELCH',
  'KLANG', 'KLEID', 'KLEIN', 'KNOPF', 'KOHLE', 'KOMET', 'KRAFT', 'KRANZ', 'KREIS', 'KRONE',
  'KUGEL', 'KUNST', 'LACHS', 'LAGER', 'LAMPE', 'LAUNE', 'LICHT', 'LINDE', 'LOBEN', 'LOCKE',
  'LUNGE', 'MACHT', 'MAGEN', 'MALEN', 'MARKT', 'MAUER', 'MILCH', 'MONAT', 'MUSIK', 'MUTIG',
  'NABEL', 'NACHT', 'NADEL', 'NARBE', 'NUDEL', 'ONKEL', 'ORGEL', 'OSTEN', 'PAKET', 'PALME',
  'PAUSE', 'PFEIL', 'PFERD', 'PFUND', 'PILOT', 'PILZE', 'PLATZ', 'PREIS', 'PRINZ', 'PROBE',
  'PUDEL', 'PUNKT', 'QUARK', 'RADIO', 'RATEN', 'RAUCH', 'RAUPE', 'REGAL', 'RINDE', 'ROMAN',
  'RUFEN', 'RUHIG', 'SAGEN', 'SAHNE', 'SAUER', 'SCHAF', 'SCHAL', 'SORTE', 'SPATZ', 'SPECK',
  'SPIEL', 'SPORT', 'STARK', 'STAUB', 'STEIN', 'STERN', 'STIRN', 'STOCK', 'STOLZ', 'STROM',
  'STUFE', 'STUHL', 'STURM', 'TAFEL', 'TAUBE', 'TEICH', 'THEMA', 'TIGER', 'TISCH', 'TRAUM',
  'TRUHE', 'VOGEL', 'WAGEN', 'WEICH', 'WOCHE', 'WOLKE', 'WURST', 'ZANGE', 'ZEBRA', 'ZUNGE',
  'ZWEIG', 'ZWERG',
];

/** Las palabras secretas de un idioma; sin idioma conocido, las de español. */
/** Las que solo se dicen en Chile: una copa que no es para Chile no las usa (D-186, D-187). */
export const LOCALES = new Set(['CABRO', 'HUASO', 'PISCO']);
export const palabrasDe = (lang, { aud = null } = {}) => {
  const lista = { en: PALABRAS_EN, pt: PALABRAS_PT, de: PALABRAS_DE }[lang] || PALABRAS;
  return fuera('cl', aud) ? lista.filter(p => !LOCALES.has(p)) : lista;
};
