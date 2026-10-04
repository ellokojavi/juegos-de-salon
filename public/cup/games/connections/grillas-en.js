/**
 * Las grillas de 🔗 Conexiones en inglés (D-170). Las mismas reglas que las de español
 * (grillas.js): cuatro grupos de cuatro, del más fácil al más difícil, por significado (D-128) y
 * con distractores (D-102). Son propias del idioma, no una traducción: los distractores tienen
 * que funcionar en inglés (MANHATTAN es un trago y una isla; SALSA, un baile y una salsa).
 */
export const GRILLAS = [
  {
    id: 'shoe',
    grupos: [
      { nombre: 'Parts of a shoe', palabras: ['SOLE', 'INSOLE', 'LACE', 'TONGUE'] },
      { nombre: 'Pool table things', palabras: ['CUE', 'CHALK', 'POCKET', 'RACK'] },
      { nombre: 'Fuels', palabras: ['WOOD', 'COAL', 'GASOLINE', 'DIESEL'] },
      { nombre: 'Tools', palabras: ['HAMMER', 'WRENCH', 'PLIERS', 'SCREWDRIVER'] },
    ],
  },
  {
    id: 'sky',
    grupos: [
      { nombre: 'Zodiac signs', palabras: ['ARIES', 'TAURUS', 'LEO', 'PISCES'] },
      { nombre: 'Planets', palabras: ['SATURN', 'URANUS', 'EARTH', 'MERCURY'] },
      { nombre: 'Greek gods', palabras: ['ZEUS', 'HERA', 'APOLLO', 'HERMES'] },
      { nombre: 'Space missions', palabras: ['GEMINI', 'SOYUZ', 'VOSTOK', 'ARTEMIS'] },
    ],
  },
  {
    id: 'chess',
    grupos: [
      { nombre: 'Chess pieces', palabras: ['BISHOP', 'KNIGHT', 'PAWN', 'ROOK'] },
      { nombre: 'Units of weight', palabras: ['OUNCE', 'GRAM', 'TON', 'KILO'] },
      { nombre: 'Currencies', palabras: ['POUND', 'EURO', 'YEN', 'RUPEE'] },
      { nombre: 'Wind instruments', palabras: ['FLUTE', 'TRUMPET', 'CLARINET', 'SAXOPHONE'] },
    ],
  },
  {
    id: 'house',
    grupos: [
      { nombre: 'Furniture', palabras: ['SOFA', 'DRESSER', 'BOOKCASE', 'NIGHTSTAND'] },
      { nombre: 'Kitchen appliances', palabras: ['DISHWASHER', 'OVEN', 'FRIDGE', 'MICROWAVE'] },
      { nombre: 'Parts of a house', palabras: ['ROOF', 'DOOR', 'WINDOW', 'STAIRS'] },
      { nombre: 'Garden tools', palabras: ['RAKE', 'SHOVEL', 'HOSE', 'SHEARS'] },
    ],
  },
  {
    id: 'colors',
    grupos: [
      { nombre: 'Fruits', palabras: ['CHERRY', 'PEACH', 'RASPBERRY', 'PLUM'] },
      { nombre: 'Colors', palabras: ['TURQUOISE', 'OCHRE', 'MAGENTA', 'ORANGE'] },
      { nombre: 'Gemstones', palabras: ['RUBY', 'EMERALD', 'SAPPHIRE', 'TOPAZ'] },
      { nombre: 'Trees', palabras: ['OAK', 'PINE', 'WILLOW', 'MAPLE'] },
    ],
  },
  {
    id: 'school',
    grupos: [
      { nombre: 'School subjects', palabras: ['CHEMISTRY', 'PHYSICS', 'HISTORY', 'MUSIC'] },
      { nombre: 'Metals', palabras: ['GOLD', 'SILVER', 'COPPER', 'IRON'] },
      { nombre: 'Groups of people', palabras: ['TRIBE', 'CLAN', 'BAND', 'GANG'] },
      { nombre: 'School supplies', palabras: ['NOTEBOOK', 'PENCIL', 'ERASER', 'RULER'] },
    ],
  },
  {
    id: 'party',
    grupos: [
      { nombre: 'Tropical fruits', palabras: ['PINEAPPLE', 'MANGO', 'PAPAYA', 'GUAVA'] },
      { nombre: 'Pixar movies', palabras: ['COCO', 'CARS', 'SOUL', 'BRAVE'] },
      { nombre: 'Dances', palabras: ['SALSA', 'MERENGUE', 'TANGO', 'SAMBA'] },
      { nombre: 'Sauces', palabras: ['PESTO', 'AIOLI', 'KETCHUP', 'GRAVY'] },
    ],
  },
  {
    id: 'plane',
    grupos: [
      { nombre: 'Punctuation marks', palabras: ['COMMA', 'PERIOD', 'COLON', 'HYPHEN'] },
      { nombre: 'Fonts', palabras: ['ARIAL', 'TIMES', 'CALIBRI', 'VERDANA'] },
      { nombre: 'Cuts of beef', palabras: ['SIRLOIN', 'BRISKET', 'RIBEYE', 'FLANK'] },
      { nombre: 'Parts of a plane', palabras: ['WING', 'COCKPIT', 'TAIL', 'FUSELAGE'] },
    ],
  },
  {
    id: 'world',
    grupos: [
      { nombre: 'Rivers of Europe', palabras: ['DANUBE', 'SEINE', 'THAMES', 'RHINE'] },
      { nombre: 'Islands', palabras: ['CUBA', 'MALTA', 'CYPRUS', 'CRETE'] },
      { nombre: 'Cocktails', palabras: ['MOJITO', 'DAIQUIRI', 'MARGARITA', 'MANHATTAN'] },
      { nombre: 'Cities named after women', palabras: ['FLORENCE', 'VICTORIA', 'ADELAIDE', 'CHARLOTTE'] },
    ],
  },
  {
    id: 'kitchen',
    grupos: [
      { nombre: 'Kitchen utensils', palabras: ['WHISK', 'COLANDER', 'GRATER', 'LADLE'] },
      { nombre: 'Herbs', palabras: ['BASIL', 'OREGANO', 'ROSEMARY', 'THYME'] },
      { nombre: 'Painters', palabras: ['REMBRANDT', 'MONET', 'DALI', 'PICASSO'] },
      { nombre: 'Awards', palabras: ['NOBEL', 'OSCAR', 'GRAMMY', 'EMMY'] },
    ],
  },
  {
    id: 'myths',
    grupos: [
      { nombre: 'Baby animals', palabras: ['CALF', 'LAMB', 'PUPPY', 'PIGLET'] },
      { nombre: 'Gymnastics apparatus', palabras: ['VAULT', 'BARS', 'RINGS', 'BEAM'] },
      { nombre: 'Constellations', palabras: ['ORION', 'CASSIOPEIA', 'PEGASUS', 'ANDROMEDA'] },
      { nombre: 'Mythical creatures', palabras: ['UNICORN', 'GRIFFIN', 'PHOENIX', 'MERMAID'] },
    ],
  },
  {
    id: 'screen',
    grupos: [
      { nombre: 'Social networks', palabras: ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN'] },
      { nombre: 'Done on a computer', palabras: ['COPY', 'PASTE', 'SAVE', 'PRINT'] },
      { nombre: 'Done at the hair salon', palabras: ['CUT', 'DYE', 'COMB', 'STRAIGHTEN'] },
      { nombre: 'Ways to hit someone', palabras: ['PUNCH', 'SLAP', 'KICK', 'HEADBUTT'] },
    ],
  },
  {
    id: 'games',
    grupos: [
      { nombre: 'Board games', palabras: ['CHESS', 'CHECKERS', 'MONOPOLY', 'SCRABBLE'] },
      { nombre: 'Card games', palabras: ['POKER', 'BRIDGE', 'RUMMY', 'BLACKJACK'] },
      { nombre: 'Olympic sports', palabras: ['FENCING', 'ROWING', 'ARCHERY', 'JUDO'] },
      { nombre: 'Things in a playground', palabras: ['SWING', 'SLIDE', 'SANDBOX', 'SEESAW'] },
    ],
  },
];

/** La grilla de la sesión de prueba (D-103), fuera del sorteo. */
export const GRILLA_ENSAYO = {
  id: 'ensayo',
  grupos: [
    { nombre: 'Colors', palabras: ['RED', 'BLUE', 'GREEN', 'YELLOW'] },
    { nombre: 'Fruits', palabras: ['APPLE', 'PEAR', 'GRAPE', 'BANANA'] },
    { nombre: 'Farm animals', palabras: ['COW', 'HEN', 'PIG', 'SHEEP'] },
    { nombre: 'Things with keys', palabras: ['PIANO', 'KEYBOARD', 'CALCULATOR', 'REMOTE'] },
  ],
};
