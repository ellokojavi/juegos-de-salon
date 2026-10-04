/**
 * Die Rätsel von 🔗 Verbindungen auf Deutsch: las grillas de Conexiones en alemán, para el
 * laboratorio. Las mismas reglas que las de español (grillas.js): cuatro grupos de cuatro, del
 * más fácil al más difícil, por significado (D-128) y con distractores (D-102). Son propias del
 * idioma, no una traducción: los distractores tienen que funcionar en alemán (KIEFER es un pino y
 * una mandíbula; ANGEL, una caña de pescar y la bisagra de una puerta; MUTTER, la madre y la
 * tuerca; LÄUFER, un corredor y el alfil; OBEN, "arriba" y la película de Pixar).
 *
 * La ß se escribe SS (GIESSKANNE): cada palabra tiene que ser igual a su toLocaleUpperCase('de').
 * Las diéresis Ä, Ö y Ü sí van.
 *
 * Hochdeutsch para Alemania, Austria y Suiza (D-194): nada que conozca un solo país (ni SYLT, ni
 * SKAT, ni los Bundesländer) y palabras que se dicen igual en los tres (no SCHNÜRSENKEL, que en
 * Austria es Schuhband). MANHATTAN es cóctel e isla; FLÜGEL, ala de pollo y de avión.
 */
export const GRILLAS = [
  {
    id: 'schuh',
    grupos: [
      { nombre: 'Teile eines Schuhs', palabras: ['SOHLE', 'ÖSE', 'ABSATZ', 'ZUNGE'] },
      { nombre: 'Beim Billard', palabras: ['QUEUE', 'KREIDE', 'BANDE', 'KUGEL'] },
      { nombre: 'Brennstoffe', palabras: ['HOLZ', 'KOHLE', 'BENZIN', 'DIESEL'] },
      { nombre: 'Werkzeuge', palabras: ['HAMMER', 'ZANGE', 'SÄGE', 'FEILE'] },
    ],
  },
  {
    id: 'himmel',
    grupos: [
      { nombre: 'Sternzeichen', palabras: ['WIDDER', 'STIER', 'LÖWE', 'FISCHE'] },
      { nombre: 'Planeten', palabras: ['SATURN', 'URANUS', 'ERDE', 'MERKUR'] },
      { nombre: 'Griechische Götter', palabras: ['ZEUS', 'HERA', 'APOLLON', 'HERMES'] },
      { nombre: 'Raumfahrtmissionen', palabras: ['GEMINI', 'SOJUS', 'WOSTOK', 'ARTEMIS'] },
    ],
  },
  {
    id: 'schach',
    grupos: [
      { nombre: 'Schachfiguren', palabras: ['LÄUFER', 'SPRINGER', 'BAUER', 'TURM'] },
      { nombre: 'Gewichtseinheiten', palabras: ['GRAMM', 'TONNE', 'PFUND', 'UNZE'] },
      { nombre: 'Währungen', palabras: ['EURO', 'YEN', 'RUPIE', 'FRANKEN'] },
      { nombre: 'Blasinstrumente', palabras: ['FLÖTE', 'TROMPETE', 'KLARINETTE', 'SAXOFON'] },
    ],
  },
  {
    id: 'haus',
    grupos: [
      { nombre: 'Möbel', palabras: ['SOFA', 'KOMMODE', 'SCHRANK', 'REGAL'] },
      { nombre: 'Küchengeräte', palabras: ['HERD', 'KÜHLSCHRANK', 'MIKROWELLE', 'TOASTER'] },
      { nombre: 'Teile eines Hauses', palabras: ['DACH', 'TÜR', 'FENSTER', 'TREPPE'] },
      { nombre: 'Gartengeräte', palabras: ['RECHEN', 'SPATEN', 'SCHLAUCH', 'GIESSKANNE'] },
    ],
  },
  {
    id: 'farben',
    grupos: [
      { nombre: 'Obst', palabras: ['KIRSCHE', 'PFIRSICH', 'HIMBEERE', 'MELONE'] },
      { nombre: 'Farben', palabras: ['TÜRKIS', 'OCKER', 'MAGENTA', 'ORANGE'] },
      { nombre: 'Edelsteine', palabras: ['RUBIN', 'SMARAGD', 'SAPHIR', 'TOPAS'] },
      { nombre: 'Bäume', palabras: ['EICHE', 'KIEFER', 'WEIDE', 'AHORN'] },
    ],
  },
  {
    id: 'schule',
    grupos: [
      { nombre: 'Schulfächer', palabras: ['CHEMIE', 'PHYSIK', 'GESCHICHTE', 'MUSIK'] },
      { nombre: 'Metalle', palabras: ['GOLD', 'SILBER', 'KUPFER', 'EISEN'] },
      { nombre: 'Gruppen von Menschen', palabras: ['STAMM', 'CLAN', 'BANDE', 'CLIQUE'] },
      { nombre: 'Schulsachen', palabras: ['HEFT', 'BLEISTIFT', 'RADIERGUMMI', 'LINEAL'] },
    ],
  },
  {
    id: 'party',
    grupos: [
      { nombre: 'Tropische Früchte', palabras: ['ANANAS', 'MANGO', 'PAPAYA', 'MARACUJA'] },
      { nombre: 'Pixar-Filme', palabras: ['CARS', 'SOUL', 'OBEN', 'COCO'] },
      { nombre: 'Tänze', palabras: ['SALSA', 'WALZER', 'TANGO', 'SAMBA'] },
      { nombre: 'Saucen', palabras: ['PESTO', 'AIOLI', 'KETCHUP', 'HOLLANDAISE'] },
    ],
  },
  {
    id: 'flugzeug',
    grupos: [
      { nombre: 'Satzzeichen', palabras: ['KOMMA', 'PUNKT', 'DOPPELPUNKT', 'BINDESTRICH'] },
      { nombre: 'Schriftarten', palabras: ['ARIAL', 'TIMES', 'CALIBRI', 'VERDANA'] },
      { nombre: 'Teile eines Huhns', palabras: ['BRUST', 'FLÜGEL', 'SCHENKEL', 'LEBER'] },
      { nombre: 'Teile eines Flugzeugs', palabras: ['FAHRWERK', 'COCKPIT', 'HECK', 'RUMPF'] },
    ],
  },
  {
    id: 'welt',
    grupos: [
      { nombre: 'Flüsse in Europa', palabras: ['DONAU', 'SEINE', 'THEMSE', 'RHEIN'] },
      { nombre: 'Inseln', palabras: ['KUBA', 'MALTA', 'SIZILIEN', 'KRETA'] },
      { nombre: 'Cocktails', palabras: ['MOJITO', 'DAIQUIRI', 'MARGARITA', 'MANHATTAN'] },
      { nombre: 'Hauptstädte', palabras: ['MADRID', 'WIEN', 'BERN', 'OSLO'] },
    ],
  },
  {
    id: 'kueche',
    grupos: [
      { nombre: 'Küchenhelfer', palabras: ['TRICHTER', 'SIEB', 'REIBE', 'KELLE'] },
      { nombre: 'Kräuter', palabras: ['BASILIKUM', 'OREGANO', 'ROSMARIN', 'THYMIAN'] },
      { nombre: 'Maler', palabras: ['REMBRANDT', 'MONET', 'DÜRER', 'PICASSO'] },
      { nombre: 'Preise', palabras: ['NOBEL', 'OSCAR', 'GRAMMY', 'PULITZER'] },
    ],
  },
  {
    id: 'mythen',
    grupos: [
      { nombre: 'Tierkinder', palabras: ['KALB', 'LAMM', 'WELPE', 'FERKEL'] },
      { nombre: 'Turngeräte', palabras: ['PFERD', 'BARREN', 'RINGE', 'RECK'] },
      { nombre: 'Sternbilder', palabras: ['ORION', 'KASSIOPEIA', 'PEGASUS', 'ANDROMEDA'] },
      { nombre: 'Fabelwesen', palabras: ['EINHORN', 'GREIF', 'PHÖNIX', 'DRACHE'] },
    ],
  },
  {
    id: 'bildschirm',
    grupos: [
      { nombre: 'Soziale Netzwerke', palabras: ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN'] },
      { nombre: 'Am Computer', palabras: ['KOPIEREN', 'EINFÜGEN', 'SPEICHERN', 'DRUCKEN'] },
      { nombre: 'Beim Friseur', palabras: ['SCHNEIDEN', 'FÄRBEN', 'FÖHNEN', 'GLÄTTEN'] },
      { nombre: 'Schläge', palabras: ['OHRFEIGE', 'KINNHAKEN', 'TRITT', 'KOPFNUSS'] },
    ],
  },
  {
    id: 'spiele',
    grupos: [
      { nombre: 'Brettspiele', palabras: ['SCHACH', 'DAME', 'MONOPOLY', 'SCRABBLE'] },
      { nombre: 'Kartenspiele', palabras: ['BRIDGE', 'POKER', 'ROMMÉ', 'CANASTA'] },
      { nombre: 'Olympische Sportarten', palabras: ['FECHTEN', 'RUDERN', 'BOGENSCHIESSEN', 'JUDO'] },
      { nombre: 'Auf dem Spielplatz', palabras: ['SCHAUKEL', 'RUTSCHE', 'SANDKASTEN', 'WIPPE'] },
    ],
  },
  {
    id: 'schloss',
    grupos: [
      { nombre: 'Sitzmöbel', palabras: ['BANK', 'STUHL', 'HOCKER', 'SESSEL'] },
      { nombre: 'Große Bauwerke', palabras: ['BURG', 'PALAST', 'FESTUNG', 'KATHEDRALE'] },
      { nombre: 'Zum Angeln', palabras: ['KÖDER', 'HAKEN', 'SCHNUR', 'ROLLE'] },
      { nombre: 'Teile einer Tür', palabras: ['SCHLOSS', 'SCHWELLE', 'ANGEL', 'RAHMEN'] },
    ],
  },
  {
    id: 'werkstatt',
    grupos: [
      { nombre: 'Familie', palabras: ['VATER', 'OMA', 'ONKEL', 'TANTE'] },
      { nombre: 'Vögel', palabras: ['STRAUSS', 'ADLER', 'SPATZ', 'AMSEL'] },
      { nombre: 'Komponisten', palabras: ['BACH', 'BEETHOVEN', 'MOZART', 'WAGNER'] },
      { nombre: 'Zum Befestigen', palabras: ['SCHRAUBE', 'DÜBEL', 'NAGEL', 'MUTTER'] },
    ],
  },
];

/** Das Rätsel der Proberunde (D-103): la grilla de la sesión de prueba, fuera del sorteo. */
export const GRILLA_ENSAYO = {
  id: 'ensayo',
  grupos: [
    { nombre: 'Farben', palabras: ['ROT', 'BLAU', 'GRÜN', 'GELB'] },
    { nombre: 'Obst', palabras: ['APFEL', 'BIRNE', 'TRAUBE', 'BANANE'] },
    { nombre: 'Bauernhoftiere', palabras: ['KUH', 'HUHN', 'SCHWEIN', 'SCHAF'] },
    { nombre: 'Dinge mit Tasten', palabras: ['KLAVIER', 'TASTATUR', 'TASCHENRECHNER', 'FERNBEDIENUNG'] },
  ],
};
