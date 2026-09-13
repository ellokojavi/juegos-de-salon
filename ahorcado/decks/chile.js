/**
 * Mazo Chile: lo que aparece en cualquier sobremesa chilena.
 * Formato: { id, emoji, es: { w, hint }, en: {...}, pt: {...} }.
 * Las palabras NO son traducciones: cada idioma elige la suya, porque una palabra
 * traducida cambia de largo y de dificultad (ver docs/juegos/ahorcado.md).
 */
export const CHILE = [
  { id: 'cl-cordillera', emoji: '🏔', es: { w: 'cordillera', hint: 'La pared de roca que tapa el este' }, en: { w: 'andes', hint: 'The mountain wall along Chile' }, pt: { w: 'cordilheira', hint: 'A parede de rocha a leste' } },
  { id: 'cl-empanada', emoji: '🥟', es: { w: 'empanada', hint: 'De pino, y ojalá sin pasas' }, en: { w: 'empanada', hint: 'Baked pastry, beef and olive inside' }, pt: { w: 'empanada', hint: 'Pastel assado de carne e azeitona' } },
  { id: 'cl-terremoto', emoji: '🍷', es: { w: 'terremoto', hint: 'Vino con helado de piña. Uno basta' }, en: { w: 'tremor', hint: 'What the ground does here, often' }, pt: { w: 'terremoto', hint: 'Vinho com sorvete de abacaxi' } },
  { id: 'cl-copihue', emoji: '🌺', es: { w: 'copihue', hint: 'La flor nacional, colgando del bosque' }, en: { w: 'copihue', hint: 'The national flower, a red bell' }, pt: { w: 'copihue', hint: 'A flor nacional, um sino vermelho' } },
  { id: 'cl-atacama', emoji: '🏜', es: { w: 'atacama', hint: 'El desierto más seco del mundo' }, en: { w: 'atacama', hint: 'The driest desert on the planet' }, pt: { w: 'atacama', hint: 'O deserto mais seco do mundo' } },
  { id: 'cl-pisco', emoji: '🍸', es: { w: 'pisco', hint: 'La base del trago de moda' }, en: { w: 'pisco', hint: 'The grape brandy in the sour' }, pt: { w: 'pisco', hint: 'A aguardente de uva do sour' } },
  { id: 'cl-valparaiso', emoji: '⛴', es: { w: 'valparaiso', hint: 'Cerros, ascensores y puerto' }, en: { w: 'seaport', hint: 'Hills, funiculars and cargo ships' }, pt: { w: 'valparaiso', hint: 'Morros, funiculares e porto' } },
  { id: 'cl-asado', emoji: '🔥', es: { w: 'asado', hint: 'El plan de todos los domingos' }, en: { w: 'barbecue', hint: 'The Sunday plan, with smoke' }, pt: { w: 'churrasco', hint: 'O plano de todo domingo' } },
  { id: 'cl-micro', emoji: '🚌', es: { w: 'micro', hint: 'Se toma parado y va llena' }, en: { w: 'bus', hint: 'Crowded, and never on time' }, pt: { w: 'onibus', hint: 'Lotado e sempre atrasado' } },
  { id: 'cl-cueca', emoji: '💃', es: { w: 'cueca', hint: 'Pañuelo en la mano, en septiembre' }, en: { w: 'cueca', hint: 'The handkerchief dance of September' }, pt: { w: 'cueca', hint: 'A dança do lenço, em setembro' } },
  { id: 'cl-chiloe', emoji: '🏝', es: { w: 'chiloe', hint: 'Isla de palafitos, mitos y curanto' }, en: { w: 'island', hint: 'Stilt houses, myths and rain' }, pt: { w: 'ilha', hint: 'Palafitas, mitos e muita chuva' } },
  { id: 'cl-condor', emoji: '🦅', es: { w: 'condor', hint: 'Mira todo desde muy arriba' }, en: { w: 'condor', hint: 'Watches everything from very high' }, pt: { w: 'condor', hint: 'Observa tudo lá de cima' } },
  { id: 'cl-patagonia', emoji: '🐧', es: { w: 'patagonia', hint: 'Viento, glaciares y pingüinos' }, en: { w: 'patagonia', hint: 'Wind, glaciers and penguins' }, pt: { w: 'patagonia', hint: 'Vento, geleiras e pinguins' } },
  { id: 'cl-sopaipilla', emoji: '🫓', es: { w: 'sopaipilla', hint: 'Se fríe cuando llueve' }, en: { w: 'fritter', hint: 'Fried dough, for rainy days' }, pt: { w: 'frito', hint: 'Massa frita para dias de chuva' } },
  { id: 'cl-volantin', emoji: '🪁', es: { w: 'volantin', hint: 'Sube con hilo y baja cortado' }, en: { w: 'kite', hint: 'Goes up on a string, comes down cut' }, pt: { w: 'pipa', hint: 'Sobe na linha e desce cortada' } },
  { id: 'cl-huesillo', emoji: '🥤', es: { w: 'huesillo', hint: 'Va con mote, en verano' }, en: { w: 'peach', hint: 'Dried, floating in a summer drink' }, pt: { w: 'pessego', hint: 'Seco, boiando na bebida de verão' } },
  { id: 'cl-completo', emoji: '🌭', es: { w: 'completo', hint: 'Palta, tomate y mucha mayo' }, en: { w: 'hotdog', hint: 'Avocado, tomato and lots of mayo' }, pt: { w: 'cachorro', hint: 'Abacate, tomate e muita maionese' } },
  { id: 'cl-salitre', emoji: '⛏', es: { w: 'salitre', hint: 'Hizo ricas a las oficinas del norte' }, en: { w: 'nitrate', hint: 'Made the northern desert rich' }, pt: { w: 'salitre', hint: 'Enriqueceu o deserto do norte' } },
  { id: 'cl-guitarron', emoji: '🎸', es: { w: 'guitarron', hint: 'Veinticinco cuerdas para payar' }, en: { w: 'guitar', hint: 'Twenty-five strings for folk duels' }, pt: { w: 'violao', hint: 'Vinte e cinco cordas de desafio' } },
  { id: 'cl-lluvia', emoji: '🌧', es: { w: 'lluvia', hint: 'En el sur cae casi todo el año' }, en: { w: 'rain', hint: 'In the south, almost all year' }, pt: { w: 'chuva', hint: 'No sul, quase o ano inteiro' } },
];
