# El alemán

Juegos de Salón en alemán (**Salonspiele**). **Salió del laboratorio** (D-197): se ofrece a
todos en el toggle, con su puerta `https://juegosdesalon.cl/de/` y su tarjeta social, como el
inglés y el portugués. El link del laboratorio, `/labs/de/`, fue una página puente hacia `/de/`
hasta D-262, que la sacó.

Lo de abajo cuenta cómo se hizo y cómo pasó por el laboratorio (D-191), que queda para el próximo
idioma. El **glosario** sigue vigente: toda traducción al alemán lo respeta.

## Cómo funciona el laboratorio de un idioma

| Pieza | Dónde |
|---|---|
| `IDIOMAS` (todos los que tienen diccionario) y `LANGS` (los que se ofrecen aquí) | `public/assets/js/i18n.js` |
| La marca del dispositivo: `juegos-de-salon:labs-idioma` = `de` | la pone `/labs/de/` o `?lang=de` |
| Pestañas 🧪 (vuelve al laboratorio) y 🐞 (comentario) en todas las páginas; el formulario es `formularioComentario()`, que El caso del laboratorio pone también al final (D-265) | `public/assets/js/labs-idioma.js` |
| Mientras se juega en alemán, los links al menú (`../`) y a `/labs/` llevan a `/labs/de/` (D-195) | el mismo módulo (un link con `data-labs-libre` pasa) |
| Portada del laboratorio, en alemán, con todos los juegos | `public/labs/de/index.html` (borrada en D-262: el próximo idioma tendrá la suya) |
| Salir: "Labor verlassen" saca la marca y deja la app en inglés | la misma portada |

Las pruebas de paridad (`node public/assets/js/i18n.test.mjs`) recorren `IDIOMAS`, así que el alemán
tiene que estar completo igual que los otros: una clave que falta frena el PR.

## Qué se tradujo y qué se escribió desde cero

Primer borrador, hecho con IA a partir del español y revisado contra el glosario de abajo. Es lo
que los amigos del dueño van a corregir.

| Contenido | Tamaño (español) | Cómo |
|---|---|---|
| Textos de los 8 juegos (`rules.js`) y comunes (`COMMON`, `games.js`, `azar.js`) | ~50.000 caracteres | traducidos |
| Frases de carga (`frases.js`) | 100 | adaptadas, no calcadas |
| Cuarto Rey: penitencias, categorías, "Ich hab noch nie", minijuegos | ~4.000 caracteres | adaptados a un grupo alemán (Bundesliga, Späti, Schlagerstars) |
| Cartas de Línea de Tiempo | 687 cartas, 26.000 caracteres | traducidas, con títulos alemanes de películas y canciones |
| Palabras del Ahorcado | 100 palabras con pista | elegidas en alemán, sin Ä, Ö, Ü ni ß |
| Conexiones (`public/cup/games/connections/grillas-de.js`) | 15 grillas y la de ensayo | escritas en alemán, con distractores propios (KIEFER, SCHLOSS, BANK) |
| Palabra (`PALABRAS_DE`) | 162 palabras de cinco letras distintas | escritas en alemán, sin Ä, Ö, Ü ni ß |
| ¿Dónde queda? (`nombres.js`) | 195 países y 239 ciudades | exónimos alemanes (München, Wien, Elfenbeinküste) |

## Lo que se arregló para el alemán (y de paso para todos)

Medido con un pseudo-alemán (el inglés alargado ~40 % con diéresis y palabras soldadas) en todas
las pantallas de `tools/e2e/mirar.mjs` a 320 px, y después con los textos alemanes de verdad.

- **Los acentos de los títulos con degradado salían cortados** (`.rainbow`, `base.css`): la Ó de
  SALÓN y la Ã de SALÃO ya se veían a medias; en alemán desaparecían las diéresis de casi cada
  título (LÜGENWÜRFEL se leía LUGENWURFEL).
- **La barra de arriba se partía a 320 px**: el chip con el nombre del juego bajaba a dos líneas y
  arrastraba a "‹ Menú". Ya pasaba con "⚓ Batalla Naval"; en alemán, en 5 de 8 juegos
  ("Galgenmännchen", "Lügenwürfel", "Der vierte König"). Ahora el menú no se achica y el chip se
  corta con "…".
- **Guiones en alemán**: con `lang="de"` el texto se corta con guion según el diccionario del
  navegador ("Flugzeug-träger" en Batalla Naval) y, si igual no cabe, se parte antes de desbordar.
- **Lo que en el código caía al español sin avisar**: "a. C." → "v. Chr." (Línea de Tiempo y
  ¿En qué año?), fechas `de-DE` en La Copa (con coma, como en inglés), kilómetros `de-DE`, el
  alfabeto y las frecuencias del Ahorcado, el teclado QWERTZ de Palabra, las grillas y las
  palabras de La Copa, y los nombres de ¿Dónde queda?.
- **Firebase**: una copa con palabras en alemán guarda `lang: "de"`, que las reglas no dejaban
  escribir. Se publican después de fusionar con `node tools/firebase/reglas.mjs publicar` (D-122).
- `mirar.mjs --idioma de` funciona: pone la marca del laboratorio igual que lo hacía `/labs/de/`.

## Decidido con el dueño (D-194)

- **Hochdeutsch para los tres países, con ß** (ver el glosario): nada de un solo país.
- **Una copa en alemán va con la hora de Europa central** (Berlín, Viena, Zúrich): el día
  cambia a medianoche de allá, no del Pacífico.
- **Sin diéresis en Palabra ni en el Ahorcado, pero dicho**: las instrucciones avisan que las
  palabras con Ä, Ö y Ü van sin los puntos (Ä es A) y la ß como SS.
- **Sin destello**: en otro idioma que el español, la página no se pinta hasta tener sus textos.

## Cómo salió del laboratorio (D-197)

Los pasos que este documento dejaba anotados, y cómo quedaron:

- Hecho: sacarlo de `EN_LABS`, la puerta `/de/` con su tarjeta (`og.mjs` y `og/tarjeta.html`), el README, C-3 en CANONES, el CONTRIBUTING y el guion `idioma-por-url.mjs` (prueba `/de/` y el puente de `/labs/de/`).
- Revisado el 4 de octubre: **las imágenes que se comparten** (punto 4) caben en alemán. La tabla de
  La Copa (a mitad de semana y la final de 10 jugadores con podio) y los resultados, con el
  minijuego de nombre más largo ("Bullen und Kühe: Zahl knacken"), se ven bien y las diéresis no se
  cortan. La leyenda completa de la tabla, el caso más ancho y que ninguna demo muestra, mide 810 px
  de 1080 en alemán (en inglés, 858).
- Hecho el 4 de octubre (D-199): **los guiones de punta a punta** (punto 6) recorren todos los
  idiomas de `LANGS`, y cada juego tiene su prueba de idiomas. Encontraron dos cosas del alemán:
  en la antesala de Palabra la nota de las diéresis empujaba "Zurück zum Menü" fuera de la pantalla
  (se acortó: "Ä, Ö und Ü schreibst du als A, O und U."), y `timeline/solo.mjs` no encontraba el
  modo "Allein spielen".
- Pendiente: el video promocional, que sigue diciendo tres idiomas.

La lista original:

Ordenado por lo que más se nota.

1. **La revisión de los amigos**: leer los comentarios, corregir y repetir. Sobre todo Cuarto Rey
   (humor), las grillas de Conexiones (que los distractores funcionen) y las cartas chilenas y
   brasileñas de Línea de Tiempo (que se entiendan sin contexto).
2. **Sacarlo de `EN_LABS`** en `i18n.js`: con eso aparece para todos en el toggle.
3. **La puerta `/de/`** con su tarjeta social: `de/index.html` (copia de `public/en/`), `og.mjs`
   (`PUERTAS`, `GRATIS`, la conjunción "und", `LOCALE` `de_DE`), `tools/release/og/tarjeta.html`
   (`GRATIS`) y `node tools/release/og.mjs imagenes --todas` en el Mac del dueño. En `og/tarjeta.html` el
   nombre va en Bangers 52 px sin ayuda para cortar: "SCHIFFE VERSENKEN" no cabe en una línea.
   `homeUrl('de')` pasa a ser `/de/`.
4. **Imágenes que se comparten** (`compartir.js`, la imagen de la tabla en `public/cup/game.js`): el
   canvas no corta líneas. Los textos se achican hasta un mínimo y después se dibujan igual; la
   leyenda de la tabla no mide su ancho total. Revisar con textos alemanes largos.
5. **El README** (en inglés): la tabla de idiomas (`tools/release/readme.py`, `bloque_idiomas`), "three
   languages", la estructura con `de/`; regenerar `docs/hechos.json`. También C-3 en CANONES, el
   CONTRIBUTING y el video promocional ("tres idiomas", las tres banderas).
6. **Guiones de punta a punta** que asumen dos idiomas extra: `copa-idiomas.mjs` (las
   comprobaciones son `lang === 'en' ? … : <portugués>`), `sala-error.mjs`,
   `linea-de-tiempo-solo.mjs`, `idioma-por-url.mjs` (la puerta `/de/`).
7. **Decisiones de producto**, no de código:
   - **Un público `de`** (como `cl` y `br`, D-187) solo si se escribe contenido propio de
     Alemania: un mazo alemán de Línea de Tiempo, grillas o palabras solo para alemanes.

## Glosario

Lo usaron todas las traducciones; un cambio aquí se aplica en todos los archivos.

### Variante: Hochdeutsch para los tres países (D-194)

El dueño eligió **alemán estándar común** (Hochdeutsch), que se entiende igual en Alemania,
Austria y Suiza, **con ß** (los suizos no la escriben, pero la leen sin problema).

- **Palabras que se usan en los tres**, no las de un solo país. Si una cosa tiene nombre distinto
  en cada país (Brötchen / Semmel / Brötli, Sahne / Obers / Rahm, Tüte / Sackerl / Sack), se
  busca otra forma de decirlo o se elige otro ejemplo.
- **Nada que solo conozca uno de los tres**: Späti, Pfandautomat, Bundesliga, Bundesländer,
  políticos o famosos de un solo país, Skat o Doppelkopf (en Austria se juega Schnapsen y en Suiza
  Jass), islas, ciudades o canales de un solo país. Sí lo que es común: el fútbol, la Navidad,
  Mau-Mau, UNO, los Alpes, el Danubio, la escuela, el tren, la fondue o el strudel si se conocen
  en los tres.
- **Formas del estándar**: Januar (no Jänner), Samstag (no Sonnabend), Kartoffel, Tomate,
  Treppe, "Tschüss" se evita (en una despedida, "Bis bald" o "Ciao").
- "Handy" sí: es la palabra de los tres.

### Tono

- Alemán estándar común (ver arriba), informal: **du**, nunca Sie. Frases cortas, humor liviano.
- Botones cortos (U-17): "Spielen", "Weiter", "Nochmal".
- Se prefiere la palabra corta: "Handy" (no "Smartphone"), "Runde", "Raum".
- Instrucciones según U-18.
- Compuestos de más de ~14 letras se evitan en botones, chips y títulos: la pantalla mide 320 px.

### Nombres

| es | en | de |
|---|---|---|
| Juegos de Salón | Party Games | Salonspiele |
| La Copa | The Cup | Der Pokal |
| Línea de Tiempo | Timeline | Zeitstrahl |
| Toque y Fama | Bulls and Cows | Bullen und Kühe |
| El Ahorcado | Hangman | Galgenmännchen |
| Dudo | Liar's Dice | Lügenwürfel |
| Generala | Generala | Generala (no Kniffel ni Yahtzee, que son marcas: D-246) |
| Batalla Naval | Battleship | Schiffe versenken |
| Julepe | Julep | Julepe |
| Cuarto Rey | Fourth King | Der vierte König |
| Línea Relámpago | Timeline Flash | Blitz-Zeitstrahl |
| Toque y Fama: adivina el número | Bulls and Cows: Crack the Number | Bullen und Kühe: Zahl knacken |
| Toque y Fama: Palabra | Bulls and Cows: Word | Bullen und Kühe: Wort |
| Conexiones | Connections | Verbindungen |
| Reinas | Queens | Damen |
| ¿En qué año? | What Year? | Welches Jahr? |
| ¿Dónde queda? | Where Is It? | Wo liegt das? |
| Desenredo | Untangle | Entwirren |
| La Gran Final | The Grand Final | Das große Finale |
| Palabras · Lógica · Cultura · Cartas/Dados | Words · Logic · Trivia · Cards/Dice | Wörter · Logik · Wissen · Karten/Würfel |

### Vocabulario

| es | de |
|---|---|
| Un celular · Varios celulares · Contra el celular | Ein Handy · Mehrere Handys · Gegen das Handy |
| sala · código de sala | Raum · Raumcode |
| jugador(es) | Spieler |
| ¡Tu turno! | Du bist dran! |
| ronda · partida · revancha | Runde · Spiel · Revanche |
| ‹ Menú | ‹ Menü |
| empate | Unentschieden |
| juego | Spiel |
| a. C. | v. Chr. |
| Dudo: dudar · calzar · as | Zweifeln! · Genau! (Punktlandung) · Ass |
| Generala: escalera · full · póker · servida · planilla · guardar · anotar · tachar | Straße · Full House · Viererpasch · im ersten Wurf · Block · behalten · eintragen · streichen |
| Toque y Fama: toque · fama | Kuh · Bulle |
| Batalla Naval: agua · tocado · hundido | Wasser · Treffer · versenkt |
| Cuarto Rey: penitencia · ¡tomar! · Yo nunca nunca | Aufgabe · Trink! · Ich hab noch nie |
| Julepe: palos · baza · triunfo | Pik, Herz, Karo, Kreuz · Stich · Trumpf |
