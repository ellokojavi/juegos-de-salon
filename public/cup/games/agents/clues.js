/**
 * Agentes' clues in Spanish from Chile (D-286, D-288, D-421): 100 of concrete things and 18 of ideas
 * (ABSTRACTAS, #383). Each one brings:
 *  - `si`: words that clearly go with the clue (the board's agents come from here).
 *  - `casi`: words that look like it but do not go: the assassin and the neutrals, which tempt.
 *
 * A word can be in several clues: the generator never puts on a board a word that goes with two of
 * its clues, nor an assassin that really goes with one. English, Portuguese and German have their
 * own decks (clues-en.js, clues-pt.js), adapted, not translated.
 */
export const CLASICAS = [
  { pista: 'MAR', si: ['OLA', 'BARCO', 'SAL', 'PLAYA', 'ANCLA', 'ISLA', 'MAREA', 'PUERTO', 'TIBURÓN'], casi: ['RÍO', 'LAGO', 'PISCINA'] },
  { pista: 'NAVIDAD', si: ['REGALO', 'ÁRBOL', 'VIEJITO', 'PESEBRE', 'CENA', 'ESTRELLA', 'CAMPANA', 'DICIEMBRE', 'RENO'], casi: ['CUMPLEAÑOS', 'HALLOWEEN', 'TORTA'] },
  { pista: 'FÚTBOL', si: ['ARCO', 'PELOTA', 'GOL', 'ÁRBITRO', 'CANCHA', 'PENAL', 'CAMISETA', 'ESTADIO', 'HINCHA'], casi: ['TENIS', 'RED', 'RAQUETA'] },
  { pista: 'COCINA', si: ['OLLA', 'SARTÉN', 'HORNO', 'CUCHARA', 'RECETA', 'DELANTAL', 'FUEGO', 'SAL', 'CUCHILLO'], casi: ['BAÑO', 'MESA', 'DORMITORIO'] },
  { pista: 'INVIERNO', si: ['FRÍO', 'LLUVIA', 'NIEVE', 'BUFANDA', 'ESTUFA', 'PARAGUAS', 'GORRO', 'ABRIGO', 'SOPA'], casi: ['OTOÑO', 'HOJA', 'VIENTO'] },
  { pista: 'ESCUELA', si: ['PROFESOR', 'CUADERNO', 'RECREO', 'PIZARRA', 'MOCHILA', 'PRUEBA', 'LÁPIZ', 'CURSO', 'UNIFORME'], casi: ['UNIVERSIDAD', 'LIBRO', 'OFICINA'] },
  { pista: 'HOSPITAL', si: ['DOCTOR', 'CAMILLA', 'JERINGA', 'ENFERMERA', 'REMEDIO', 'AMBULANCIA', 'VENDA', 'URGENCIA', 'RADIOGRAFÍA'], casi: ['FARMACIA', 'GIMNASIO', 'DENTISTA'] },
  { pista: 'ESPACIO', si: ['ASTRONAUTA', 'COHETE', 'LUNA', 'PLANETA', 'ESTRELLA', 'GALAXIA', 'SATÉLITE', 'MARTE', 'METEORITO'], casi: ['CIELO', 'AVIÓN', 'NUBE'] },
  { pista: 'CIRCO', si: ['PAYASO', 'CARPA', 'MALABARISTA', 'TRAPECIO', 'LEÓN', 'ACRÓBATA', 'MAGO', 'FUNCIÓN', 'NARIZ'], casi: ['TEATRO', 'FERIA', 'ZOOLÓGICO'] },
  { pista: 'MÚSICA', si: ['GUITARRA', 'NOTA', 'CANCIÓN', 'PIANO', 'RITMO', 'CONCIERTO', 'BATERÍA', 'MELODÍA', 'CORO'], casi: ['RADIO', 'BAILE', 'POEMA'] },
  { pista: 'DINERO', si: ['BANCO', 'BILLETE', 'MONEDA', 'SUELDO', 'AHORRO', 'TARJETA', 'CAJERO', 'DEUDA', 'PRECIO'], casi: ['ORO', 'TESORO', 'REGALO'] },
  { pista: 'JARDÍN', si: ['FLOR', 'PASTO', 'REGADERA', 'SEMILLA', 'MACETA', 'TIERRA', 'ROSA', 'PALA', 'MANGUERA'], casi: ['BOSQUE', 'PARQUE', 'ÁRBOL'] },
  { pista: 'NOCHE', si: ['LUNA', 'ESTRELLA', 'SUEÑO', 'OSCURIDAD', 'BÚHO', 'PIJAMA', 'VELA', 'MURCIÉLAGO', 'LINTERNA'], casi: ['TARDE', 'NEGRO', 'SOMBRA'] },
  { pista: 'VIAJE', si: ['MALETA', 'PASAPORTE', 'AVIÓN', 'MAPA', 'HOTEL', 'TURISTA', 'PASAJE', 'AEROPUERTO', 'VACACIONES'], casi: ['MUDANZA', 'TRABAJO', 'AUTO'] },
  { pista: 'GRANJA', si: ['VACA', 'GALLINA', 'TRACTOR', 'CERDO', 'GRANERO', 'OVEJA', 'HUEVO', 'CABALLO', 'ESPANTAPÁJAROS'], casi: ['ZOOLÓGICO', 'PERRO', 'LEÓN'] },
  { pista: 'PIRATA', si: ['TESORO', 'PARCHE', 'LORO', 'BARCO', 'ESPADA', 'CALAVERA', 'MAPA', 'ISLA', 'BANDERA'], casi: ['VAQUERO', 'SOLDADO', 'LADRÓN'] },
  { pista: 'FIESTA', si: ['GLOBO', 'TORTA', 'BAILE', 'MÚSICA', 'INVITADO', 'VELA', 'BRINDIS', 'DISFRAZ', 'CONFETI'], casi: ['FUNERAL', 'REUNIÓN', 'CENA'] },
  { pista: 'BOSQUE', si: ['ÁRBOL', 'HONGO', 'ZORRO', 'CABAÑA', 'LEÑA', 'MUSGO', 'ARDILLA', 'SENDERO', 'PIÑA'], casi: ['DESIERTO', 'SELVA', 'PARQUE'] },
  { pista: 'CINE', si: ['PELÍCULA', 'BUTACA', 'PANTALLA', 'CABRITAS', 'ENTRADA', 'ACTOR', 'ESTRENO', 'DIRECTOR', 'TAQUILLA'], casi: ['TEATRO', 'TELEVISIÓN', 'LIBRO'] },
  { pista: 'DESAYUNO', si: ['CAFÉ', 'TOSTADA', 'LECHE', 'MANTEQUILLA', 'MERMELADA', 'CEREAL', 'JUGO', 'HUEVO', 'PAN'], casi: ['ONCE', 'ALMUERZO', 'POSTRE'] },
  { pista: 'CASTILLO', si: ['REY', 'TORRE', 'PRINCESA', 'DRAGÓN', 'MURALLA', 'CABALLERO', 'TRONO', 'PUENTE', 'CORONA'], casi: ['PALACIO', 'IGLESIA', 'CASA'] },
  { pista: 'TIEMPO', si: ['RELOJ', 'HORA', 'MINUTO', 'CALENDARIO', 'AÑO', 'ALARMA', 'SEGUNDO', 'SIGLO', 'ARENA'], casi: ['REGLA', 'BALANZA', 'VIEJO'] },
  { pista: 'POLICÍA', si: ['PLACA', 'ESPOSAS', 'PATRULLA', 'LADRÓN', 'SIRENA', 'DETECTIVE', 'MULTA', 'CÁRCEL', 'PISTA'], casi: ['BOMBERO', 'SOLDADO', 'JUEZ'] },
  { pista: 'PLAYA', si: ['ARENA', 'TOALLA', 'QUITASOL', 'BLOQUEADOR', 'CASTILLO', 'CONCHA', 'TRAJE', 'OLA', 'SALVAVIDAS'], casi: ['PISCINA', 'DESIERTO', 'RÍO'] },
  { pista: 'OFICINA', si: ['COMPUTADOR', 'JEFE', 'REUNIÓN', 'ESCRITORIO', 'CORREO', 'IMPRESORA', 'CAFÉ', 'CORBATA', 'CARPETA'], casi: ['ESCUELA', 'BANCO', 'TIENDA'] },
  { pista: 'HIELO', si: ['PINGÜINO', 'NIEVE', 'PATÍN', 'GLACIAR', 'CUBO', 'ICEBERG', 'FRÍO', 'POLO', 'IGLÚ'], casi: ['AGUA', 'VIDRIO', 'NUBE'] },
  { pista: 'TREN', si: ['VÍA', 'ESTACIÓN', 'VAGÓN', 'BOLETO', 'TÚNEL', 'ANDÉN', 'LOCOMOTORA', 'MAQUINISTA', 'CARRIL'], casi: ['BUS', 'METRO', 'AUTO'] },
  { pista: 'FUEGO', si: ['LLAMA', 'HUMO', 'BOMBERO', 'FÓSFORO', 'CHIMENEA', 'CENIZA', 'FOGATA', 'LEÑA', 'CALOR'], casi: ['SOL', 'LUZ', 'ROJO'] },
  { pista: 'LIBRO', si: ['PÁGINA', 'AUTOR', 'CAPÍTULO', 'BIBLIOTECA', 'NOVELA', 'TAPA', 'LECTOR', 'CUENTO', 'ÍNDICE'], casi: ['CUADERNO', 'REVISTA', 'DIARIO'] },
  { pista: 'GATO', si: ['MAULLIDO', 'BIGOTE', 'RATÓN', 'OVILLO', 'GARRA', 'SIAMÉS', 'TEJADO', 'PELUSA', 'COLA'], casi: ['PERRO', 'TIGRE', 'CONEJO'] },
  { pista: 'ROJO', si: ['TOMATE', 'FRUTILLA', 'SANGRE', 'SEMÁFORO', 'CEREZA', 'LABIAL', 'CORAZÓN', 'BOMBERO', 'SANDÍA'], casi: ['ROSADO', 'NARANJA', 'MORADO'] },
  { pista: 'MONTAÑA', si: ['CUMBRE', 'NIEVE', 'ESCALADOR', 'VOLCÁN', 'CORDILLERA', 'CÓNDOR', 'ANDES', 'CERRO', 'MOCHILA'], casi: ['COLINA', 'ISLA', 'DESIERTO'] },
  { pista: 'DEPORTE', si: ['ATLETA', 'MEDALLA', 'ENTRENADOR', 'EQUIPO', 'CAMPEÓN', 'ZAPATILLA', 'TROFEO', 'CARRERA', 'GIMNASIO'], casi: ['JUEGO', 'BAILE', 'PASEO'] },
  { pista: 'MAGIA', si: ['VARITA', 'SOMBRERO', 'CONEJO', 'TRUCO', 'BRUJA', 'HECHIZO', 'CARTA', 'CAPA', 'MAGO'], casi: ['CIENCIA', 'SUERTE', 'SUEÑO'] },
  { pista: 'LLUVIA', si: ['PARAGUAS', 'CHARCO', 'NUBE', 'GOTA', 'TRUENO', 'BOTA', 'IMPERMEABLE', 'ARCOÍRIS', 'TORMENTA'], casi: ['NIEVE', 'DUCHA', 'RÍO'] },
  { pista: 'BEBÉ', si: ['PAÑAL', 'CHUPETE', 'MAMADERA', 'CUNA', 'COCHE', 'SONAJERO', 'BABERO', 'LLANTO', 'GATEO'], casi: ['NIÑO', 'ABUELO', 'MUÑECA'] },
  { pista: 'AUTO', si: ['RUEDA', 'MOTOR', 'VOLANTE', 'BENCINA', 'FRENO', 'BOCINA', 'PATENTE', 'MANEJAR', 'ESTACIONAMIENTO'], casi: ['BICICLETA', 'TREN', 'BARCO'] },
  { pista: 'CHILE', local: 'cl', si: ['EMPANADA', 'CUECA', 'COPIHUE', 'HUASO', 'VINO', 'ANDES', 'SANTIAGO', 'PEBRE', 'DIECIOCHO'], casi: ['ARGENTINA', 'TANGO', 'MÉXICO'] },
  { pista: 'DORMIR', si: ['CAMA', 'ALMOHADA', 'SUEÑO', 'SIESTA', 'FRAZADA', 'BOSTEZO', 'PIJAMA', 'RONQUIDO', 'COLCHÓN'], casi: ['DESCANSO', 'SOFÁ', 'CAFÉ'] },
  { pista: 'PINTURA', si: ['PINCEL', 'CUADRO', 'TELA', 'MUSEO', 'ACUARELA', 'PALETA', 'COLOR', 'ARTISTA', 'RETRATO'], casi: ['FOTO', 'DIBUJO', 'ESCULTURA'] },
  // Desde D-288: 60 más, para que quien juega todos los días no vea las mismas pistas
  { pista: 'VERANO', si: ['SOL', 'CALOR', 'VACACIONES', 'HELADO', 'PISCINA', 'BLOQUEADOR', 'BRONCEADO', 'SANDÍA', 'CHALAS', 'QUITASOL'], casi: ['PRIMAVERA', 'OTOÑO', 'DESIERTO'] },
  { pista: 'PERRO', si: ['LADRIDO', 'HUESO', 'CORREA', 'CACHORRO', 'COLLAR', 'PATA', 'CUCHA', 'VETERINARIO', 'PULGA', 'COLA'], casi: ['LOBO', 'ZORRO', 'COYOTE'] },
  { pista: 'BODA', si: ['NOVIA', 'NOVIO', 'ANILLO', 'VESTIDO', 'IGLESIA', 'BRINDIS', 'VALS', 'RAMO', 'VELO', 'ALTAR'], casi: ['DIVORCIO', 'CUMPLEAÑOS', 'BAUTIZO'] },
  { pista: 'SUPERMERCADO', si: ['CARRO', 'CAJA', 'OFERTA', 'BOLSA', 'GÓNDOLA', 'BOLETA', 'FILA', 'CAJERA', 'PASILLO', 'VERDURA'], casi: ['FERIA', 'ALMACÉN', 'BODEGA'] },
  { pista: 'AVIÓN', si: ['PILOTO', 'ALA', 'AEROPUERTO', 'PASAJE', 'AZAFATA', 'TURBINA', 'DESPEGUE', 'CINTURÓN', 'VENTANILLA', 'VUELO'], casi: ['HELICÓPTERO', 'PÁJARO', 'COHETE'] },
  { pista: 'TELÉFONO', si: ['LLAMADA', 'MENSAJE', 'PANTALLA', 'CARGADOR', 'CONTACTO', 'APLICACIÓN', 'CHIP', 'SELFI', 'BATERÍA', 'NÚMERO'], casi: ['RADIO', 'CARTA', 'TELEVISIÓN'] },
  { pista: 'CUMPLEAÑOS', si: ['TORTA', 'VELA', 'REGALO', 'GLOBO', 'PIÑATA', 'SORPRESA', 'INVITACIÓN', 'EDAD', 'CANCIÓN', 'DULCES'], casi: ['NAVIDAD', 'BODA', 'ANIVERSARIO'] },
  { pista: 'DINOSAURIO', si: ['FÓSIL', 'HUESO', 'EXTINCIÓN', 'METEORITO', 'TIRANOSAURIO', 'JURÁSICO', 'HUEVO', 'ESCAMA', 'MUSEO', 'GIGANTE'], casi: ['DRAGÓN', 'LAGARTO', 'COCODRILO'] },
  { pista: 'SELVA', si: ['MONO', 'LIANA', 'JAGUAR', 'LORO', 'SERPIENTE', 'HUMEDAD', 'AMAZONAS', 'TUCÁN', 'MOSQUITO', 'CASCADA'], casi: ['BOSQUE', 'DESIERTO', 'ZOOLÓGICO'] },
  { pista: 'DESIERTO', si: ['ARENA', 'CAMELLO', 'CACTUS', 'DUNA', 'OASIS', 'SED', 'ATACAMA', 'ESCORPIÓN', 'ESPEJISMO', 'SOL'], casi: ['PLAYA', 'SELVA', 'MONTAÑA'] },
  { pista: 'RELOJ', si: ['HORA', 'MINUTO', 'AGUJA', 'ALARMA', 'SEGUNDO', 'PULSERA', 'PÉNDULO', 'PILA', 'PUNTUAL', 'CUERDA'], casi: ['CALENDARIO', 'BRÚJULA', 'AGENDA'] },
  { pista: 'COMPUTADOR', si: ['TECLADO', 'MOUSE', 'PANTALLA', 'INTERNET', 'ARCHIVO', 'CORREO', 'IMPRESORA', 'VIRUS', 'CONTRASEÑA', 'NOTEBOOK'], casi: ['TELÉFONO', 'TELEVISIÓN', 'CALCULADORA'] },
  { pista: 'ZOOLÓGICO', si: ['JAULA', 'ELEFANTE', 'JIRAFA', 'CUIDADOR', 'LEÓN', 'CEBRA', 'PINGÜINO', 'MONO', 'OSO', 'HIPOPÓTAMO'], casi: ['GRANJA', 'CIRCO', 'ACUARIO'] },
  { pista: 'PANADERÍA', si: ['PAN', 'MARRAQUETA', 'HALLULLA', 'HARINA', 'HORNO', 'LEVADURA', 'PANADERO', 'MASA', 'KUCHEN', 'MIGA'], casi: ['PASTELERÍA', 'MOLINO', 'SUPERMERCADO'] },
  { pista: 'BOMBERO', si: ['MANGUERA', 'INCENDIO', 'CASCO', 'ESCALERA', 'SIRENA', 'HUMO', 'EXTINTOR', 'AGUA', 'VOLUNTARIO', 'CUARTEL'], casi: ['POLICÍA', 'AMBULANCIA', 'GUARDIA'] },
  { pista: 'PLAZA', si: ['BANCO', 'PALOMA', 'FUENTE', 'COLUMPIO', 'RESBALÍN', 'PASTO', 'ESTATUA', 'GLORIETA', 'FAROL', 'KIOSCO'], casi: ['PARQUE', 'JARDÍN', 'PATIO'] },
  { pista: 'BARCO', si: ['VELA', 'TIMÓN', 'CAPITÁN', 'ANCLA', 'PROA', 'POPA', 'MÁSTIL', 'MARINERO', 'CUBIERTA', 'NAUFRAGIO'], casi: ['PEZ', 'AVIÓN', 'NADADOR'] },
  { pista: 'PRIMAVERA', si: ['FLOR', 'ABEJA', 'POLEN', 'ALERGIA', 'TULIPÁN', 'MARIPOSA', 'BROTE', 'NIDO', 'PÉTALO', 'VOLANTÍN'], casi: ['VERANO', 'OTOÑO', 'JARDÍN'] },
  { pista: 'OTOÑO', si: ['HOJA', 'BELLOTA', 'COSECHA', 'MARRÓN', 'CASTAÑA', 'RASTRILLO', 'VENDIMIA', 'AMARILLO', 'HOJARASCA'], casi: ['INVIERNO', 'PRIMAVERA', 'ÁRBOL'] },
  { pista: 'TEATRO', si: ['ESCENARIO', 'TELÓN', 'ACTOR', 'OBRA', 'BUTACA', 'APLAUSO', 'GUION', 'MÁSCARA', 'ENSAYO', 'CAMARÍN'], casi: ['CINE', 'CIRCO', 'CONCIERTO'] },
  { pista: 'RESTAURANTE', si: ['GARZÓN', 'MENÚ', 'PROPINA', 'CUENTA', 'CHEF', 'RESERVA', 'PLATO', 'MANTEL', 'CARTA', 'POSTRE'], casi: ['PICNIC', 'CAFETERÍA', 'HOTEL'] },
  { pista: 'HOTEL', si: ['HABITACIÓN', 'LLAVE', 'RECEPCIÓN', 'MALETA', 'CAMA', 'PISCINA', 'HUÉSPED', 'TOALLA', 'BOTONES', 'SUITE'], casi: ['HOSPITAL', 'CASA', 'CAMPING'] },
  { pista: 'CAMPING', si: ['CARPA', 'FOGATA', 'LINTERNA', 'COLCHONETA', 'MOCHILA', 'ESTACA', 'MOSQUITO', 'LEÑA', 'CANTIMPLORA', 'BRÚJULA'], casi: ['HOTEL', 'CIRCO', 'PICNIC'] },
  { pista: 'PICNIC', si: ['MANTEL', 'CANASTA', 'SÁNDWICH', 'PASTO', 'HORMIGA', 'JUGO', 'PARQUE', 'FRUTA', 'TERMO', 'SERVILLETA'], casi: ['RESTAURANTE', 'ASADO', 'CAMPING'] },
  { pista: 'ASADO', si: ['PARRILLA', 'CARBÓN', 'CHORIZO', 'CARNE', 'PEBRE', 'ANTICUCHO', 'LONGANIZA', 'BRASAS', 'VINO', 'ENSALADA'], casi: ['HORNO', 'FOGATA', 'COCINA'] },
  { pista: 'DIECIOCHO', local: 'cl', si: ['CUECA', 'EMPANADA', 'FONDA', 'VOLANTÍN', 'TERREMOTO', 'CHICHA', 'PAÑUELO', 'RAMADA', 'HUASO', 'BANDERA'], casi: ['NAVIDAD', 'CARNAVAL', 'HALLOWEEN'] },
  { pista: 'VAMPIRO', si: ['COLMILLO', 'SANGRE', 'ATAÚD', 'CAPA', 'AJO', 'MURCIÉLAGO', 'DRÁCULA', 'ESTACA', 'TRANSILVANIA', 'CRUZ'], casi: ['FANTASMA', 'ZOMBI', 'LOBO'] },
  { pista: 'FANTASMA', si: ['SÁBANA', 'SUSTO', 'CADENA', 'ESPÍRITU', 'CEMENTERIO', 'APARICIÓN', 'ALMA', 'HALLOWEEN', 'CASONA'], casi: ['VAMPIRO', 'ZOMBI', 'MAGO'] },
  { pista: 'ROBOT', si: ['METAL', 'CIRCUITO', 'ANTENA', 'BATERÍA', 'ENGRANAJE', 'SENSOR', 'CHATARRA', 'ANDROIDE', 'TORNILLO', 'PROGRAMA'], casi: ['COMPUTADOR', 'MUÑECO', 'MARCIANO'] },
  { pista: 'REY', si: ['CORONA', 'TRONO', 'REINA', 'PRÍNCIPE', 'CETRO', 'REINO', 'CAPA', 'BUFÓN', 'PALACIO', 'SÚBDITO'], casi: ['PRESIDENTE', 'ALCALDE', 'JEFE'] },
  { pista: 'AJEDREZ', si: ['TABLERO', 'ALFIL', 'TORRE', 'PEÓN', 'CABALLO', 'JAQUE', 'REY', 'CASILLA', 'MATE', 'REINA'], casi: ['DAMAS', 'NAIPE', 'DADO'] },
  { pista: 'CARNAVAL', si: ['DISFRAZ', 'MÁSCARA', 'COMPARSA', 'CHALLA', 'SERPENTINA', 'DESFILE', 'TAMBOR', 'PLUMA', 'BAILE', 'BRASIL'], casi: ['CIRCO', 'HALLOWEEN', 'DIECIOCHO'] },
  { pista: 'ABUELA', si: ['TEJIDO', 'LENTES', 'NIETO', 'MECEDORA', 'CUENTO', 'SOPAIPILLA', 'CHAL', 'ARRUGA', 'CANAS', 'DENTADURA'], casi: ['MAMÁ', 'TÍA', 'BEBÉ'] },
  { pista: 'BAÑO', si: ['DUCHA', 'JABÓN', 'TOALLA', 'ESPEJO', 'CHAMPÚ', 'TINA', 'CEPILLO', 'LAVAMANOS', 'ESPUMA', 'PAPEL'], casi: ['COCINA', 'PISCINA', 'LAVADORA'] },
  { pista: 'ROPA', si: ['CAMISA', 'PANTALÓN', 'CALCETÍN', 'POLERA', 'CHAQUETA', 'BOTÓN', 'CIERRE', 'COLGADOR', 'TALLA', 'BOLSILLO'], casi: ['TELA', 'ZAPATO', 'LAVADORA'] },
  { pista: 'ZAPATO', si: ['CORDÓN', 'SUELA', 'TACO', 'BETÚN', 'ZAPATILLA', 'PLANTILLA', 'PIE', 'CALZADOR', 'BOTA', 'ZAPATERÍA'], casi: ['CALCETÍN', 'GUANTE', 'SOMBRERO'] },
  { pista: 'ISLA', si: ['NÁUFRAGO', 'PALMERA', 'COCO', 'CHILOÉ', 'BALSA', 'FARO', 'RAPANUI', 'AISLADO', 'TESORO', 'COSTA'], casi: ['PENÍNSULA', 'LAGO', 'CONTINENTE'] },
  { pista: 'FARMACIA', si: ['PASTILLA', 'RECETA', 'JARABE', 'VITAMINA', 'CURITA', 'TERMÓMETRO', 'ALCOHOL', 'CREMA', 'GENÉRICO', 'FARMACÉUTICO'], casi: ['HOSPITAL', 'SUPERMERCADO', 'PERFUMERÍA'] },
  { pista: 'DENTISTA', si: ['DIENTE', 'CARIES', 'MUELA', 'TAPADURA', 'FRENILLOS', 'ANESTESIA', 'SONRISA', 'HILO', 'TALADRO', 'ENJUAGUE'], casi: ['DOCTOR', 'PELUQUERÍA', 'FARMACIA'] },
  { pista: 'PELUQUERÍA', si: ['TIJERA', 'PEINE', 'CORTE', 'TINTURA', 'SECADOR', 'CHASCA', 'CHASQUILLA', 'ESPEJO', 'CHAMPÚ', 'BARBERO'], casi: ['BAÑO', 'DENTISTA', 'PELUCHE'] },
  { pista: 'TERREMOTO', si: ['SISMO', 'RÉPLICA', 'ESCOMBROS', 'TSUNAMI', 'GRIETA', 'RICHTER', 'EVACUACIÓN', 'TEMBLOR', 'EPICENTRO', 'MAGNITUD'], casi: ['VOLCÁN', 'HURACÁN', 'TORMENTA'] },
  { pista: 'VOLCÁN', si: ['LAVA', 'CRÁTER', 'ERUPCIÓN', 'CENIZA', 'MAGMA', 'HUMO', 'VILLARRICA', 'EXPLOSIÓN', 'CONO', 'OSORNO'], casi: ['CHIMENEA', 'TERREMOTO', 'FUEGO'] },
  { pista: 'TORMENTA', si: ['RAYO', 'TRUENO', 'RELÁMPAGO', 'VIENTO', 'NUBARRÓN', 'GRANIZO', 'APAGÓN', 'AGUACERO', 'ALERTA', 'PARAGUAS'], casi: ['ARCOÍRIS', 'NIEBLA', 'TERREMOTO'] },
  { pista: 'PESCA', si: ['CAÑA', 'ANZUELO', 'CARNADA', 'RED', 'LANCHA', 'PESCADOR', 'BOTE', 'MERLUZA', 'MUELLE', 'TRUCHA'], casi: ['CAZA', 'ACUARIO', 'BUCEO'] },
  { pista: 'ACUARIO', si: ['PECERA', 'BURBUJA', 'PEZ', 'ALGA', 'FILTRO', 'TORTUGA', 'MEDUSA', 'VIDRIO', 'ESCAMA', 'CORAL'], casi: ['PISCINA', 'PESCA', 'ZOOLÓGICO'] },
  { pista: 'MUSEO', si: ['CUADRO', 'ESCULTURA', 'VITRINA', 'GUÍA', 'EXPOSICIÓN', 'MOMIA', 'FÓSIL', 'SALA', 'ESTATUA', 'OBRA'], casi: ['BIBLIOTECA', 'TEATRO', 'IGLESIA'] },
  { pista: 'BIBLIOTECA', si: ['ESTANTE', 'SILENCIO', 'PRÉSTAMO', 'LECTOR', 'BIBLIOTECARIA', 'REVISTA', 'DICCIONARIO', 'ENCICLOPEDIA', 'CARNET', 'ESTUDIO'], casi: ['LIBRERÍA', 'MUSEO', 'ESCUELA'] },
  { pista: 'ELECCIONES', si: ['VOTO', 'URNA', 'CANDIDATO', 'PAPELETA', 'MESA', 'PRESIDENTE', 'CAMPAÑA', 'DEBATE', 'ENCUESTA', 'CONTEO'], casi: ['CONCURSO', 'SORTEO', 'CENSO'] },
  { pista: 'TELEVISIÓN', si: ['CONTROL', 'CANAL', 'NOTICIAS', 'TELESERIE', 'ANTENA', 'COMERCIAL', 'PROGRAMA', 'ANIMADOR', 'PANTALLA', 'SERIE'], casi: ['RADIO', 'CINE', 'COMPUTADOR'] },
  { pista: 'RADIO', si: ['LOCUTOR', 'DIAL', 'EMISORA', 'MICRÓFONO', 'FRECUENCIA', 'ONDA', 'ANTENA', 'OYENTE', 'PARLANTE', 'TRANSMISIÓN'], casi: ['TELEVISIÓN', 'TELÉFONO', 'TOCADISCOS'] },
  { pista: 'FERIA', local: 'cl', si: ['CASERO', 'PUESTO', 'VERDURA', 'FRUTA', 'KILO', 'TOLDO', 'PALTA', 'TOMATE', 'YAPA', 'CAJÓN'], casi: ['SUPERMERCADO', 'CIRCO', 'MALL'] },
  { pista: 'MALL', si: ['TIENDA', 'VITRINA', 'ESTACIONAMIENTO', 'VENDEDOR', 'LIQUIDACIÓN', 'PROBADOR', 'ASCENSOR', 'BOLSA', 'OFERTA', 'ESCALERA'], casi: ['FERIA', 'SUPERMERCADO', 'AEROPUERTO'] },
  { pista: 'GIMNASIO', si: ['PESA', 'TROTADORA', 'MÚSCULO', 'ENTRENADOR', 'SUDOR', 'ABDOMINAL', 'CAMARÍN', 'MANCUERNA', 'PROTEÍNA', 'RUTINA'], casi: ['HOSPITAL', 'PISCINA', 'ESTADIO'] },
  { pista: 'BICICLETA', si: ['PEDAL', 'CADENA', 'RUEDA', 'CASCO', 'MANUBRIO', 'TIMBRE', 'SILLÍN', 'RAYO', 'CICLOVÍA', 'PINCHAZO'], casi: ['MOTO', 'AUTO', 'PATINETA'] },
  { pista: 'CORREO', si: ['SOBRE', 'ESTAMPILLA', 'CARTERO', 'BUZÓN', 'REMITENTE', 'DIRECCIÓN', 'FIRMA', 'POSTAL', 'PAQUETE', 'CARTA'], casi: ['PALOMA', 'TELÉFONO', 'LIBRO'] },
  { pista: 'DETECTIVE', si: ['LUPA', 'HUELLA', 'SOSPECHOSO', 'CULPABLE', 'MISTERIO', 'PIPA', 'SHERLOCK', 'COARTADA', 'INTERROGATORIO', 'CRIMEN'], casi: ['ABOGADO', 'ESPÍA', 'JUEZ'] },
  { pista: 'ESPÍA', si: ['DISFRAZ', 'CÓDIGO', 'SECRETO', 'BINOCULARES', 'MISIÓN', 'CONTRASEÑA', 'INFILTRADO', 'SATÉLITE', 'CÁMARA', 'MICRÓFONO'], casi: ['DETECTIVE', 'POLICÍA', 'LADRÓN'] },
  { pista: 'LADRÓN', si: ['ROBO', 'BOTÍN', 'ANTIFAZ', 'CÁRCEL', 'ALARMA', 'ESCAPE', 'CARTERA', 'HUIDA', 'CÓMPLICE', 'ASALTO'], casi: ['PIRATA', 'DETECTIVE', 'POLICÍA'] },
  { pista: 'JAPÓN', si: ['SUSHI', 'SAMURÁI', 'KIMONO', 'TOKIO', 'ORIGAMI', 'ANIME', 'BONSÁI', 'KARATE', 'NINJA', 'FUJI'], casi: ['CHINA', 'COREA', 'TAILANDIA'] },
  { pista: 'ITALIA', si: ['PIZZA', 'ROMA', 'PASTA', 'VENECIA', 'GÓNDOLA', 'COLISEO', 'ESPAGUETI', 'LASAÑA', 'VESPA', 'TIRAMISÚ'], casi: ['ESPAÑA', 'FRANCIA', 'GRECIA'] },
];

/**
 * Las de ideas (#383, pedido de Cris): la pista es un concepto y sus palabras son cosas que lo
 * evocan sin ser de su mismo rubro (SUERTE → TRÉBOL, HERRADURA, SIETE), así que hay que pensar
 * un poco más. Their temptations sit next to the idea without being it (SUERTE → ÉXITO, TALENTO):
 * not bad luck, which is luck too (GATO or MARTES cost points to whoever got it right).
 */
export const ABSTRACTAS = [
  { pista: 'MIEDO', si: ['OSCURIDAD', 'ARAÑA', 'PESADILLA', 'GRITO', 'SOMBRA', 'ALTURA', 'TRUENO', 'CALAVERA', 'ESCALOFRÍO'], casi: ['SORPRESA', 'NERVIOS', 'VERGÜENZA'] },
  { pista: 'SILENCIO', si: ['BIBLIOTECA', 'MIMO', 'MADRUGADA', 'SECRETO', 'MONJE', 'NIEVE', 'CEMENTERIO', 'DEDO', 'ESPACIO'], casi: ['RUIDO', 'MÚSICA', 'ECO'] },
  { pista: 'VELOCIDAD', si: ['RAYO', 'GUEPARDO', 'COHETE', 'BALA', 'FLECHA', 'HALCÓN', 'CARRERA', 'LUZ', 'TURBO'], casi: ['TORTUGA', 'CARACOL', 'SEMÁFORO'] },
  { pista: 'LIBERTAD', si: ['PÁJARO', 'ALAS', 'LLAVE', 'BANDERA', 'VACACIONES', 'HORIZONTE', 'VELERO', 'ESTATUA', 'CABALLO'], casi: ['CÁRCEL', 'JAULA', 'CANDADO'] },
  { pista: 'AMOR', si: ['CORAZÓN', 'ROSA', 'BESO', 'ANILLO', 'FLECHA', 'CARTA', 'CHOCOLATE', 'ABRAZO', 'CUPIDO', 'POEMA'], casi: ['AMISTAD', 'CELOS', 'DIVORCIO'] },
  { pista: 'PODER', si: ['CORONA', 'TRONO', 'ESPADA', 'ENERGÍA', 'PALACIO', 'ÁGUILA', 'LEÓN', 'CETRO', 'PRESIDENTE'], casi: ['FAMA', 'SUERTE', 'GOBIERNO'] },
  { pista: 'SUERTE', si: ['TRÉBOL', 'DADO', 'HERRADURA', 'LOTERÍA', 'MONEDA', 'CASINO', 'SIETE', 'AMULETO', 'RULETA'], casi: ['ÉXITO', 'RIQUEZA', 'TALENTO'] },
  { pista: 'LUZ', si: ['SOL', 'AMPOLLETA', 'VELA', 'FARO', 'LINTERNA', 'RAYO', 'LUCIÉRNAGA', 'LÁMPARA', 'FLASH'], casi: ['SOMBRA', 'NOCHE', 'ESPEJO'] },
  { pista: 'ALTURA', si: ['JIRAFA', 'RASCACIELOS', 'ESCALERA', 'AVIÓN', 'GLOBO', 'CÓNDOR', 'TORRE', 'NUBE', 'VÉRTIGO'], casi: ['POZO', 'SUBMARINO', 'CUEVA'] },
  { pista: 'FAMA', si: ['ESTRELLA', 'ALFOMBRA', 'AUTÓGRAFO', 'FOTÓGRAFO', 'ESCENARIO', 'APLAUSO', 'PREMIO', 'PAPARAZZI', 'SELFIE'], casi: ['DINERO', 'PODER', 'ÉXITO'] },
  { pista: 'INFANCIA', si: ['COLUMPIO', 'JUGUETE', 'CHUPETE', 'TOBOGÁN', 'CUENTO', 'TRICICLO', 'ESCONDIDA', 'VOLANTÍN', 'DIBUJO'], casi: ['VEJEZ', 'ADOLESCENCIA', 'NOSTALGIA'] },
  { pista: 'GUERRA', si: ['TANQUE', 'SOLDADO', 'BOMBA', 'TRINCHERA', 'MEDALLA', 'ESCUDO', 'CAÑÓN', 'GENERAL', 'ARMADURA'], casi: ['PAZ', 'PALOMA', 'AJEDREZ'] },
  { pista: 'PAZ', si: ['PALOMA', 'OLIVO', 'ABRAZO', 'TREGUA', 'CALMA', 'YOGA', 'LAGO', 'NOBEL', 'BLANCO'], casi: ['GUERRA', 'SILENCIO', 'SUEÑO'] },
  { pista: 'SECRETO', si: ['DIARIO', 'CANDADO', 'SUSURRO', 'CLAVE', 'CÓDIGO', 'TESORO', 'MAPA', 'SOBRE', 'CONTRASEÑA'], casi: ['CHISME', 'MENTIRA', 'SORPRESA'] },
  { pista: 'VIDA', si: ['SEMILLA', 'HUEVO', 'CUNA', 'LATIDO', 'RAÍZ', 'PRIMAVERA', 'PULMÓN', 'BROTE', 'AGUA'], casi: ['MUERTE', 'TIEMPO', 'SALUD'] },
  { pista: 'DULCE', si: ['MIEL', 'AZÚCAR', 'CARAMELO', 'TORTA', 'MANJAR', 'ALGODÓN', 'KUCHEN', 'HELADO', 'ABEJA'], casi: ['SALADO', 'AMARGO', 'LIMÓN'] },
  { pista: 'RUIDO', si: ['TRUENO', 'BOCINA', 'TALADRO', 'TAMBOR', 'SIRENA', 'PETARDO', 'MOTO', 'GRITO', 'CONCIERTO'], casi: ['SILENCIO', 'MÚSICA', 'ECO'] },
  { pista: 'VERDAD', si: ['ESPEJO', 'JURAMENTO', 'TESTIGO', 'CONFESIÓN', 'JUEZ', 'PRUEBA', 'HUELLA', 'DETECTOR', 'CIENCIA'], casi: ['MENTIRA', 'SECRETO', 'RUMOR'] },
];

export const PISTAS = [...CLASICAS, ...ABSTRACTAS];

/**
 * What only Chile knows (D-187): a clue marked `local: 'cl'` (CHILE, DIECIOCHO, FERIA, the street
 * market) and these words stay out of a 🌎 Global or 🇧🇷 Brazil cup. Elsewhere they mean something
 * else or nothing (COCHE is a car in Spain, TACO a Mexican dish, ONCE a number).
 */
export const LOCALES = Object.fromEntries([
  'VIEJITO', 'CABRITAS', 'ONCE', 'FRUTILLA', 'BENCINA', 'PATENTE', 'CHALAS', 'BOLETA', 'MARRAQUETA',
  'HALLULLA', 'KUCHEN', 'RESBALÍN', 'VOLANTÍN', 'GARZÓN', 'PEBRE', 'ANTICUCHO', 'CHALLA', 'SOPAIPILLA',
  'POLERA', 'TACO', 'CHILOÉ', 'RAPANUI', 'TAPADURA', 'CHASCA', 'CHASQUILLA', 'VILLARRICA', 'OSORNO',
  'TELESERIE', 'CASERO', 'YAPA', 'PALTA', 'TROTADORA', 'AMPOLLETA', 'MANJAR', 'COCHE', 'MAMADERA', 'CUCHA',
  'DIECIOCHO', 'FRENILLOS',
].map(w => [w, 'cl']));
