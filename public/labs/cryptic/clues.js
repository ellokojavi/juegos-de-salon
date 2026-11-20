/**
 * Cryptic: the clue banks, one per language (data only, C-2). Every clue is our own.
 *
 * A clue reads two ways: a definition of the answer, at one end, and a wordplay that builds it.
 *   c  the clue as the player reads it, without the length (the game adds "(4)")
 *   a  the answer, in capitals, accents as written (the check ignores them, Ñ stays Ñ)
 *   k  the kind of wordplay, a key of KINDS in rules.js
 *   d  the definition, word for word as it appears in `c` (the second hint marks it)
 *   x  how it is solved, shown on the result
 *
 * A clue does not translate: another language gets its own bank, written on its own. Spanish only for
 * now; a player in English or Portuguese reads the Spanish clue with a notice that says so.
 * engine.test.mjs checks every clue (the definition is inside it, the anagrams and hidden words add up).
 */

const ES = [
  // Harder since the owner's ask (2026-11-19): a sentence that tells another story, no colon between the halves,
  // every piece clued too (a synonym, a note, a number, a symbol), the definition sideways (docs/games/cryptic.md)
  { c: 'Lo que siente Julieta, vuelto atrás, es adonde llevan todos los caminos', a: 'ROMA', k: 'reversal', d: 'adonde llevan todos los caminos', x: 'AMOR (lo que siente Julieta) vuelto atrás es ROMA, adonde llevan todos los caminos.' },
  { c: 'Con una nota y algo que sirve para jugar y dudar, va al frente', a: 'SOLDADO', k: 'charade', d: 'va al frente', x: 'SOL (una nota) + DADO (lo que sirve para jugar y dudar, como en el Dudo) = SOLDADO, el que va al frente.' },
  { c: 'Costosa es la col que deja un rastro brillante en el muro', a: 'CARACOL', k: 'charade', d: 'deja un rastro brillante en el muro', x: 'CARA (costosa) + COL = CARACOL, que deja un rastro de baba brillante en el muro.' },
  { c: 'Un tour con una nota tiene la cabeza llena de pepitas', a: 'GIRASOL', k: 'charade', d: 'tiene la cabeza llena de pepitas', x: 'GIRA (un tour) + SOL (una nota) = GIRASOL, con la cabeza llena de pepitas.' },
  { c: 'Un océano de infusiones, y ni te cases ni te embarques', a: 'MARTES', k: 'charade', d: 'ni te cases ni te embarques', x: 'MAR (un océano) + TÉS (infusiones) = MARTES: ni te cases ni te embarques.' },
  { c: 'Cinco romanos sacan pasaje sin vuelta, y solo se vive una', a: 'VIDA', k: 'charade', d: 'solo se vive una', x: 'V (cinco en números romanos) + IDA (un pasaje sin vuelta) = VIDA: solo se vive una.' },
  { c: 'Un número interminable junto a un roedor busca el cofre enterrado', a: 'PIRATA', k: 'charade', d: 'busca el cofre enterrado', x: 'PI (un número que nunca termina) + RATA (un roedor) = PIRATA, que busca el cofre enterrado.' },
  { c: 'Con dos notas y una negativa, las fichas caen una tras otra', a: 'DOMINÓ', k: 'charade', d: 'las fichas caen una tras otra', x: 'DO + MI (dos notas) + NO (una negativa) = DOMINÓ, el de las fichas que caen una tras otra.' },
  { c: 'El sodio da justo lo que cabe en un bolsillo vacío', a: 'NADA', k: 'charade', d: 'lo que cabe en un bolsillo vacío', x: 'NA (el símbolo del sodio) + DA = NADA, lo que cabe en un bolsillo vacío.' },
  { c: 'Lo dice quien se va, encomendándose al Creador', a: 'ADIÓS', k: 'charade', d: 'Lo dice quien se va', x: 'A + DIOS (el Creador) = ADIÓS, lo que dice quien se va.' },
  { c: 'Le cayó a Newton y tiene cuatro esquinas', a: 'MANZANA', k: 'definitions', d: 'Le cayó a Newton', x: 'MANZANA: la fruta que le cayó a Newton, y la cuadra de la ciudad, con sus cuatro esquinas.' },
  { c: 'Guarda los ahorros y aguanta a los que alimentan palomas', a: 'BANCO', k: 'definitions', d: 'Guarda los ahorros', x: 'BANCO: donde se guardan los ahorros, y el de la plaza, donde se sientan los que alimentan palomas.' },
  { c: 'Carga bultos en el altiplano y se aviva con un soplido', a: 'LLAMA', k: 'definitions', d: 'se aviva con un soplido', x: 'LLAMA: el animal que carga en el altiplano, y el fuego que se aviva al soplar.' },
  { c: 'Sube el auto con la rueda pinchada y se pasea por el tejado', a: 'GATA', k: 'definitions', d: 'Sube el auto con la rueda pinchada', x: 'GATA: la herramienta que levanta el auto para cambiar la rueda pinchada, y la que se pasea por el tejado.' },
  { c: 'Crece en la maceta y arma autos en las afueras', a: 'PLANTA', k: 'definitions', d: 'Crece en la maceta', x: 'PLANTA: la que crece en la maceta, y la fábrica donde se arman autos.' },
  { c: 'Se forma frente a la caja y se menea de alegría', a: 'COLA', k: 'definitions', d: 'se menea de alegría', x: 'COLA: la fila que se forma frente a la caja, y la que el perro menea de alegría.' },
  { c: 'Hace aserrín y recorta el horizonte', a: 'SIERRA', k: 'definitions', d: 'Hace aserrín', x: 'SIERRA: la herramienta que deja aserrín, y las montañas que recortan el horizonte.' },
  { c: 'Hermoso, aunque suene a lo que se depila', a: 'BELLO', k: 'homophone', d: 'Hermoso', x: 'BELLO (hermoso) suena igual que VELLO, lo que se depila.' },
  { c: 'Sin su letra muda, el saludo revienta en la orilla', a: 'OLA', k: 'deletion', d: 'revienta en la orilla', x: 'HOLA (el saludo) sin la H, su letra muda, es OLA, que revienta en la orilla.' },
  { c: 'A la flor le cortan la cabeza y queda la madre de los ositos', a: 'OSA', k: 'deletion', d: 'la madre de los ositos', x: 'ROSA (la flor) sin su cabeza, la R, es OSA, la madre de los ositos.' },
  { c: 'Bebe una infusión y termina picado con cebolla', a: 'TOMATE', k: 'charade', d: 'termina picado con cebolla', x: 'TOMA (bebe) + TÉ (una infusión) = TOMATE, que termina picado con cebolla en la ensalada chilena.' },
  { c: 'Una marraqueta que se regala mastica bambú', a: 'PANDA', k: 'charade', d: 'mastica bambú', x: 'PAN (una marraqueta) + DA (se regala) = PANDA, que mastica bambú.' },
  { c: 'Tiene hueso y por él se agarra la sartén', a: 'MANGO', k: 'definitions', d: 'por él se agarra la sartén', x: 'MANGO: la fruta con hueso, y el de la sartén, por donde se agarra.' },
  { c: 'Una monja alborotada termina en el sándwich', a: 'JAMÓN', k: 'anagram', d: 'termina en el sándwich', x: 'Las letras de MONJA, alborotadas, forman JAMÓN, que termina en el sándwich.' },
  { c: 'Bruto como Manila revuelta', a: 'ANIMAL', k: 'anagram', d: 'Bruto', x: 'Las letras de MANILA revueltas forman ANIMAL: un bruto.' },
  { c: 'Salta revuelto y se abre lleno de países', a: 'ATLAS', k: 'anagram', d: 'se abre lleno de países', x: 'Las letras de SALTA revueltas forman ATLAS, el libro lleno de países.' },
  { c: 'Seria y confundida, cumple años a fines de marzo', a: 'ARIES', k: 'anagram', d: 'cumple años a fines de marzo', x: 'Las letras de SERIA, confundidas, forman ARIES, el signo de quien cumple años a fines de marzo.' },
  { c: 'El roedor vuelve y hace un nudo', a: 'ATAR', k: 'reversal', d: 'hace un nudo', x: 'RATA (el roedor) vuelta al revés es ATAR: hacer un nudo.' },
  { c: 'La chaqueta de vuelta trae a las que graznan en el corral', a: 'OCAS', k: 'reversal', d: 'las que graznan en el corral', x: 'SACO (la chaqueta) de vuelta, al revés, es OCAS, las que graznan en el corral.' },
  { c: 'El comienzo de Lucía, Úrsula y Zoe es lo que se da al parir', a: 'LUZ', k: 'selector', d: 'lo que se da al parir', x: 'El comienzo de Lucía, Úrsula y Zoe: LUZ, la que se da al parir (dar a luz).' },
  { c: 'Di que se va, pero exige flores en el camarín', a: 'DIVA', k: 'charade', d: 'exige flores en el camarín', x: 'DI + VA = DIVA, la que exige flores en el camarín.' },
  { c: 'Un millar con una nota se corre en menos de cuatro minutos', a: 'MILLA', k: 'charade', d: 'se corre en menos de cuatro minutos', x: 'MIL (un millar) + LA (una nota) = MILLA, que los mejores corren en menos de cuatro minutos.' },
  { c: 'Canta a muchas voces y crece bajo el mar', a: 'CORAL', k: 'definitions', d: 'Canta a muchas voces', x: 'CORAL: la obra para cantar a muchas voces, y el que crece bajo el mar.' },
  { c: 'Una nota con la infusión del gaucho vende al mejor postor', a: 'REMATE', k: 'charade', d: 'vende al mejor postor', x: 'RE (una nota) + MATE (la infusión del gaucho) = REMATE, donde se vende al mejor postor.' },
  { c: 'Dice que sí, que es mío, y es primo lejano del hombre', a: 'SIMIO', k: 'charade', d: 'primo lejano del hombre', x: 'SÍ + MÍO = SIMIO, primo lejano del hombre.' },
  { c: 'Dijo que sí en el altar y la pone el carabinero en la muñeca', a: 'ESPOSA', k: 'definitions', d: 'Dijo que sí en el altar', x: 'ESPOSA: la que dijo que sí en el altar, y la que el carabinero pone en la muñeca.' },
  { c: 'Se sopla en el cumpleaños y la sopla el viento en el mar', a: 'VELA', k: 'definitions', d: 'Se sopla en el cumpleaños', x: 'VELA: la de la torta, que se sopla, y la del barco, que sopla el viento.' },
  { c: 'Rubén anotó, sin que se viera, al que pica en la mina con seis hermanos', a: 'ENANO', k: 'hidden', d: 'al que pica en la mina con seis hermanos', x: 'Sin que se vea, en «RubÉN ANOtó»: ENANO, el que pica en la mina con sus seis hermanos.' },
  // The owner's clue (2026-11-19)
  { c: 'Dos ingleses se miran de frente, de lunes a domingo', a: 'SIETE', k: 'homophone', d: 'de lunes a domingo', x: 'Dos que se miran de frente SE VEN, y dicho por ingleses suena a SEVEN: SIETE, los días de lunes a domingo.' },
  // The owner's clue (2026-11-19), with A inside PETÓ instead of an anagram
  { c: 'Un beso catalán abraza al primer amor y sigue al norte: va a pie', a: 'PEATÓN', k: 'container', d: 'va a pie', x: 'Beso en catalán es PETÓ; abraza la A, la primera letra de amor (PE·A·TÓ), y le sigue la N del norte: PEATÓN, el que va a pie.' },
  { c: 'Ojalá se alimente y te ayude a separar las ideas', a: 'COMA', k: 'definitions', d: 'te ayude a separar las ideas', x: 'COMA: «ojalá coma», que se alimente, y la coma, el signo que separa las ideas.' },
  { c: 'En la cumbre, de dos en dos, Camilo miraba Santiago. Hasta que se le salió un botón', a: 'CAMISA', k: 'selector', d: 'Hasta que se le salió un botón', x: 'Las cumbres de dos en dos: CA de Camilo, MI de miraba, SA de Santiago. CAMISA, a la que se le sale un botón.' },
  { c: 'Hombre americano con un litro extra en tequila. Qué maravilla de calorías doradas', a: 'MANTEQUILLA', k: 'charade', d: 'calorías doradas', x: 'MAN (hombre, en inglés) + TEQUILA con una L (un litro) de más, TEQUILLA = MANTEQUILLA, una maravilla de calorías doradas.' },
  { c: 'Sonaron cuatro notas y no quedó una pizca de dulce de leche en la cuchara', a: 'RELAMIDO', k: 'charade', d: 'no quedó una pizca de dulce de leche en la cuchara', x: 'RE + LA + MI + DO, cuatro notas = RELAMIDO: así queda la cuchara cuando no le queda ni una pizca de dulce de leche.' },
  // Ten of high difficulty, thought with the owner (2026-11-19): 1, 3, 5, 6 and 8 in the owner's words or close to them
  { c: 'El gas del brasero, con juicio, tiene razones que la razón no entiende', a: 'CORAZÓN', k: 'charade', d: 'tiene razones que la razón no entiende', x: 'CO (el monóxido de carbono, el gas del brasero) + RAZÓN (juicio) = CORAZÓN, que tiene razones que la razón no entiende.' },
  { c: 'Un calcetín en la oscuridad, cuando huye Cenicienta', a: 'MEDIANOCHE', k: 'charade', d: 'cuando huye Cenicienta', x: 'MEDIA (un calcetín) + NOCHE (la oscuridad) = MEDIANOCHE, cuando huye Cenicienta.' },
  { c: 'Tu papá tiene un hermano cuya hija dice verdades en latín y le crecen flores una vez de cuatro', a: 'PRIMAVERA', k: 'charade', d: 'le crecen flores una vez de cuatro', x: 'PRIMA (la hija del hermano de tu papá) + VERA (verdades, en latín) = PRIMAVERA, la estación de las flores, una de las cuatro del año.' },
  { c: 'Contra el rostro, esconde los ojos en el carnaval', a: 'ANTIFAZ', k: 'charade', d: 'esconde los ojos en el carnaval', x: 'ANTI (contra) + FAZ (el rostro) = ANTIFAZ, que esconde los ojos en el carnaval.' },
  { c: 'El ser del futuro al dar la vuelta es un dios', a: 'ARES', k: 'reversal', d: 'un dios', x: 'SERÁ (el verbo ser en futuro) dado vuelta es ARES, el dios griego de la guerra.' },
  { c: 'Me vino un fatal mareo justo al centro, que casi se me sale del cuerpo', a: 'ALMA', k: 'hidden', d: 'que casi se me sale del cuerpo', x: 'Justo al centro de «fatAL MAreo»: ALMA, la que casi se te sale del cuerpo.' },
  { c: 'Un japonés confundido bebe sin sed en la ducha', a: 'ESPONJA', k: 'anagram', d: 'bebe sin sed en la ducha', x: 'Las letras de JAPONÉS, confundidas, forman ESPONJA, que bebe sin sed en la ducha.' },
  { c: 'Un perro con seis caras no se abre sin su llave', a: 'CANDADO', k: 'charade', d: 'no se abre sin su llave', x: 'CAN (un perro) + DADO (seis caras) = CANDADO, que no se abre sin su llave.' },
  { c: 'Una nota de cierta edad pasó cien años en Macondo', a: 'SOLEDAD', k: 'charade', d: 'pasó cien años en Macondo', x: 'SOL (una nota) + EDAD = SOLEDAD, la de los cien años de Macondo.' },
  { c: 'Para las que rompe la embarazada, ya sin cabeza, siempre se olvida en el bus', a: 'PARAGUAS', k: 'charade', d: 'siempre se olvida en el bus', x: 'PARA (que no es «para», sino «detiene») + AGUAS (las que rompe la embarazada) sin su cabeza, GUAS = PARAGUAS, el que siempre se olvida en el bus.' },
  { c: 'Madonna sale quinta, enloquece y viaja', a: 'NÓMADA', k: 'anagram', d: 'viaja', x: 'Madonna sin su quinta letra queda MADONA; enloquecida, forma NÓMADA, la que viaja.' },
  { c: "El hombre junto a un frasco de vidrio. It's delicious!, exclama", a: 'MANJAR', k: 'charade', d: "It's delicious!, exclama", x: 'MAN (hombre, en inglés) + JAR (frasco, en inglés) = MANJAR, algo delicioso (y en Chile, el dulce de leche). El inglés de la exclamación avisa en qué idioma están las piezas.' },
  { c: 'A principios de 2892, encontré por fin el lugar indicado', a: 'DONDE', k: 'selector', d: 'el lugar indicado', x: 'Los principios de 2892, dicho Dos, Ocho, Nueve, Dos: DOND; y «encontré» por fin, su última letra: E. DOND + E = DONDE, el lugar indicado.' },
];

/** Spanish only for now (the owner, 2026-11-19): the mechanics first, the other banks once it works. */
export const CLUES = { es: ES };
