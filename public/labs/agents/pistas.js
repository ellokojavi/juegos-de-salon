/**
 * Las pistas de Agentes (laboratorio, D-286), en español de Chile. Cada una trae:
 *  - `si`: palabras que van claramente con la pista (de aquí salen las del tablero).
 *  - `casi`: palabras que se le parecen pero no van: de aquí sale el asesino, que tienta.
 *
 * Una palabra puede estar en varias pistas: el generador nunca pone en un tablero una palabra
 * que vaya con dos de sus pistas, ni un asesino que vaya de verdad con alguna.
 */
export const PISTAS = [
  { pista: 'MAR', si: ['OLA', 'BARCO', 'SAL', 'PLAYA', 'ANCLA', 'ISLA', 'MAREA', 'PUERTO', 'TIBURÓN'], casi: ['RÍO', 'LAGO', 'PISCINA'] },
  { pista: 'NAVIDAD', si: ['REGALO', 'ÁRBOL', 'VIEJITO', 'PESEBRE', 'CENA', 'ESTRELLA', 'CAMPANA', 'DICIEMBRE', 'RENO'], casi: ['CUMPLEAÑOS', 'PASCUA', 'TORTA'] },
  { pista: 'FÚTBOL', si: ['ARCO', 'PELOTA', 'GOL', 'ÁRBITRO', 'CANCHA', 'PENAL', 'CAMISETA', 'ESTADIO', 'HINCHA'], casi: ['TENIS', 'RED', 'RAQUETA'] },
  { pista: 'COCINA', si: ['OLLA', 'SARTÉN', 'HORNO', 'CUCHARA', 'RECETA', 'DELANTAL', 'FUEGO', 'SAL', 'CUCHILLO'], casi: ['BAÑO', 'MESA', 'REFRIGERADOR'] },
  { pista: 'INVIERNO', si: ['FRÍO', 'LLUVIA', 'NIEVE', 'BUFANDA', 'ESTUFA', 'PARAGUAS', 'GORRO', 'JULIO', 'SOPA'], casi: ['OTOÑO', 'HOJA', 'VIENTO'] },
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
  { pista: 'TIEMPO', si: ['RELOJ', 'HORA', 'MINUTO', 'CALENDARIO', 'AÑO', 'ALARMA', 'SEGUNDO', 'SIGLO', 'ARENA'], casi: ['CLIMA', 'LLUVIA', 'VIEJO'] },
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
  { pista: 'CHILE', si: ['EMPANADA', 'CUECA', 'COPIHUE', 'HUASO', 'VINO', 'ANDES', 'SANTIAGO', 'PEBRE', 'DIECIOCHO'], casi: ['ARGENTINA', 'TANGO', 'MÉXICO'] },
  { pista: 'DORMIR', si: ['CAMA', 'ALMOHADA', 'SUEÑO', 'SIESTA', 'FRAZADA', 'BOSTEZO', 'PIJAMA', 'RONQUIDO', 'COLCHÓN'], casi: ['DESCANSO', 'SOFÁ', 'NOCHE'] },
  { pista: 'PINTURA', si: ['PINCEL', 'CUADRO', 'TELA', 'MUSEO', 'ACUARELA', 'PALETA', 'COLOR', 'ARTISTA', 'RETRATO'], casi: ['FOTO', 'DIBUJO', 'ESCULTURA'] },
];
