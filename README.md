# 🎲 Juegos de Salón

App web (mobile-first) con juegos de salón para jugar con amigos: de naipes, de tomar, de deducción. Se abre desde el celular o tablet, se elige un juego en el menú principal, se ingresan los jugadores y el celular guía la partida. En español, inglés y portugués.

**Jugar:** https://juegosdesalon.cl/

<!-- generado: capturas:portada · lo reescribe python3 tools/readme.py actualizar -->
<p align="center"><img src="docs/screenshots/menu.png" width="220" alt="Menú principal"></p>
<!-- /generado -->

## Juegos

<!-- generado: juegos · lo reescribe python3 tools/readme.py actualizar -->
| Juego | Jugadores | Modos | Estado |
|---|---|---|---|
| ⏳ [Línea de Tiempo / Timeline / Linha do Tempo](#-línea-de-tiempo) | 1 a 6 | Un celular · Varios celulares · Jugar solo | v0.9 |
| 🔢 [Toque y Fama / Bulls and Cows / Toque e Fama](#-toque-y-fama) | 1 a 2 | Un celular · Dos celulares · Contra el celular | v0.4 |
| 🪢 [El Ahorcado / Hangman / Forca](#-el-ahorcado) | 1 a 6 | Un celular · Varios celulares · Jugar solo | v0.26 |
| ⚓ [Batalla Naval / Battleship / Batalha Naval](#-batalla-naval) | 1 a 2 | Un celular · Dos celulares · Contra el celular | v0.6 |
| 👑 [Cuarto Rey / Fourth King / Quarto Rei](#-cuarto-rey) | 4 a 6 | Un celular | v0.2 |
<!-- /generado -->

---

## 👑 Cuarto Rey

El clásico de naipes para tomar. El celular hace de mazo: cada jugador saca una carta y la app dice qué hacer, nombra a quién le toca tomar, guía los mini-juegos (Cuenta Cuentos, Chancho Inflado, Cultura Chupística, Nunca Nunca), propone penitencias y cuenta los reyes. Con el cuarto rey, fondo y pantalla final.

<!-- generado: capturas:cuarto-rey · lo reescribe python3 tools/readme.py actualizar -->
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/cuarto-rey/02-intro.png" width="180" alt="Intro y reglas"><br><sub>Intro y reglas</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/03-jugadores.png" width="180" alt="Jugadores y género"><br><sub>Jugadores y género</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/04-mesa.png" width="180" alt="Toca para sacar carta"><br><sub>Toca para sacar carta</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/05-carta.png" width="180" alt="Carta e instrucción"><br><sub>Carta e instrucción</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/cuarto-rey/06-minijuego.png" width="180" alt="Mini-juego con ayudas"><br><sub>Mini-juego con ayudas</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/07-salud.png" width="180" alt="¡Salud!"><br><sub>¡Salud!</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/08-pasale.png" width="180" alt="Pásale el celular"><br><sub>Pásale el celular</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/09-cuarto-rey.png" width="180" alt="¡Cuarto Rey!"><br><sub>¡Cuarto Rey!</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/cuarto-rey/10-final.png" width="180" alt="Ranking de sorbos"><br><sub>Ranking de sorbos</sub></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>
<!-- /generado -->

Especificación: [docs/juegos/cuarto-rey.md](docs/juegos/cuarto-rey.md)

## 🔢 Toque y Fama

Cada jugador elige un número secreto de cifras distintas y trata de adivinar el del rival. Por cada intento, el celular responde solo: **fama** es cifra correcta en su lugar, **toque** es cifra correcta en otro lugar. Nadie cuenta a mano, nadie hace trampa.

- **📱 Un celular:** se pasan el celular; la pantalla se tapa entre turnos.
- **📡 Dos celulares:** sala con código de 4 letras y QR. Cada celular guarda su secreto y responde a los intentos del rival. Al final ambos revelan y se verifica todo.
- **🤖 Contra el celular:** duelo contra un solver que adivina en 5 a 6 intentos.
- **💬 Chat de la sala:** en dos celulares hay un chat para picarse mientras adivinan, que sigue vivo en la pantalla final para celebrar o pedir revancha. Los mensajes nuevos se asoman al lado de la burbuja.

<!-- generado: capturas:toque-y-fama · lo reescribe python3 tools/readme.py actualizar -->
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/toque-y-fama/01-intro.png" width="180" alt="Modos de juego"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/02-secreto.png" width="180" alt="Número secreto"><br><sub>Número secreto</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/03-tablero.png" width="180" alt="Tablero y teclado"><br><sub>Tablero y teclado</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/04-pasale.png" width="180" alt="Pásale el celular"><br><sub>Pásale el celular</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/toque-y-fama/06-sala.png" width="180" alt="Sala con código y QR"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/07-dos-celulares.png" width="180" alt="Partida en dos celulares"><br><sub>Partida en dos celulares</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/08-verificado.png" width="180" alt="Secretos verificados"><br><sub>Secretos verificados</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/05-resultado.png" width="180" alt="Contra el celular"><br><sub>Contra el celular</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/toque-y-fama/09-chat.png" width="180" alt="Chat de la sala"><br><sub>Chat de la sala</sub></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>
<!-- /generado -->

Especificación: [docs/juegos/toque-y-fama.md](docs/juegos/toque-y-fama.md) · Estudio de factibilidad: [docs/juegos/toque-y-fama-factibilidad.md](docs/juegos/toque-y-fama-factibilidad.md)

## ⚓ Batalla Naval

El clásico de hundir la flota. Cada jugador esconde 5 barcos en un tablero de 10×10 y dispara por turnos: agua, tocado o hundido. Si aciertas, sigues disparando. Colocación por toque con girar, arrastrar y "al azar"; el celular responde solo y lleva el marcador.

- **📱 Un celular:** tu flota queda tapada entre turnos; al fallar, el resultado y "Pásale el celular a X" en una sola pantalla.
- **📡 Dos celulares:** sala con código y QR. Cada celular responde los disparos contra su propia flota; al final ambas flotas se revelan y verifican.
- **🤖 Contra el celular:** IA con cacería por paridad y persecución al acertar (hunde una flota en unos 50 disparos).

<!-- generado: capturas:batalla-naval · lo reescribe python3 tools/readme.py actualizar -->
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/batalla-naval/01-intro.png" width="180" alt="Modos de juego"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/02-flota.png" width="180" alt="Colocar la flota"><br><sub>Colocar la flota</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/03-batalla.png" width="180" alt="Batalla"><br><sub>Batalla</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/04-pase.png" width="180" alt="Resultado y pase"><br><sub>Resultado y pase</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/batalla-naval/06-sala.png" width="180" alt="Sala con código y QR"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/07-dos-celulares.png" width="180" alt="Partida en dos celulares"><br><sub>Partida en dos celulares</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/05-resultado.png" width="180" alt="Resultado con flotas"><br><sub>Resultado con flotas</sub></td>
    <td></td>
  </tr>
</table>
<!-- /generado -->

Especificación y diseño: [docs/juegos/batalla-naval.md](docs/juegos/batalla-naval.md)

## ⏳ Línea de Tiempo

Recibes hitos sin fecha y los ubicas en el lugar correcto de una línea de tiempo común. Si aciertas, la carta se queda; si fallas, se descarta y robas otra. Gana quien se queda sin cartas: la ronda se juega completa, y si más de uno queda sin cartas gana el que respondió más rápido. Se elige la temática al empezar y agregar una nueva es solo un archivo de datos. Las cartas no se repiten entre partidas seguidas: cada celular recuerda las que ya mostró.

<!-- generado: tematicas · lo reescribe python3 tools/readme.py actualizar -->
| Temática | Cartas | Años | De qué va |
|---|---|---|---|
| 📜 Historia | 98 | 2560 a. C. a 2022 | Hitos de la humanidad |
| 🎵 Música | 89 | 1600 a 2023 | De Beethoven a TikTok |
| 🇨🇱 Chile | 127 | 1520 a 2023 | Del terremoto del 60 al estallido |
| 🍿 Cultura pop | 110 | 1928 a 2023 | Cine, memes y videojuegos |
| 🇧🇷 Brasil | 140 | 1500 a 2025 | De Cabral a la COP30, con novelas y carnaval |
| ⚽ Fútbol | 123 | 1863 a 2025 | Mundiales, clubes, goles y fichajes |
| **Total** | **687** | | |
<!-- /generado -->

- **📱 Un celular:** de dos a seis jugadores, pasando el celular por turnos.
- **📡 Varios celulares:** sala con código y QR, hasta seis jugadores. El anfitrión abre la partida cuando están todos, y cada uno ve su propia mano.
- **🧍 Jugar solo:** vacía tu mano en la menor cantidad de intentos y supera tu récord por temática.
- **🗂 Todas a la vista (por defecto):** se despliega el doble de las cartas que hay que colocar para ganar —6, 10 o 14— desde el primer turno, y no entra ninguna carta nueva en toda la partida. Como la mesa solo se achica, las cartas difíciles de situar van quedando para el final, sobre una línea que para entonces ya está llena: el juego se pone más difícil solo.
- **🃏 Pozo común:** las mismas 6 cartas a la vista para todos, reponiéndose desde el mazo, y gana quien coloque primero las cartas acordadas. También se puede jugar con **🙋 mano propia**, cada uno con sus cartas y en privado.
- **💬 Chat de la sala:** en varios celulares hay un chat para comentar las jugadas mientras se espera el turno, que sigue vivo en la pantalla final. Los mensajes nuevos se asoman unos segundos al lado de la burbuja.

<!-- generado: capturas:linea-de-tiempo · lo reescribe python3 tools/readme.py actualizar -->
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/01-intro.png" width="180" alt="Modos de juego"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/02-tematica.png" width="180" alt="Temática y jugadores"><br><sub>Temática y jugadores</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/03-juego.png" width="180" alt="Mano y línea de tiempo"><br><sub>Mano y línea de tiempo</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/04-veredicto.png" width="180" alt="Veredicto y pase"><br><sub>Veredicto y pase</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/06-sala.png" width="180" alt="Sala con código y QR"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/07-varios-celulares.png" width="180" alt="Partida en varios celulares"><br><sub>Partida en varios celulares</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/05-resultado.png" width="180" alt="Resultado y ranking"><br><sub>Resultado y ranking</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/08-chat.png" width="180" alt="Chat de la sala"><br><sub>Chat de la sala</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/09-chat-aviso.png" width="180" alt="Aviso de mensaje nuevo"><br><sub>Aviso de mensaje nuevo</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/10-pozo-comun.png" width="180" alt="Pozo común"><br><sub>Pozo común</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/11-todas-a-la-vista.png" width="180" alt="Todas a la vista"><br><sub>Todas a la vista</sub></td>
    <td></td>
  </tr>
</table>
<!-- /generado -->

Especificación y diseño: [docs/juegos/linea-de-tiempo.md](docs/juegos/linea-de-tiempo.md)

---

## 🪢 El Ahorcado

<!-- generado: capturas:ahorcado · lo reescribe python3 tools/readme.py actualizar -->
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/ahorcado/01-intro.png" width="180" alt="Modos de juego"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/ahorcado/02-configuracion.png" width="180" alt="La palabra, los errores y quiénes juegan"><br><sub>La palabra, los errores y quiénes juegan</sub></td>
    <td align="center"><img src="docs/screenshots/ahorcado/03-escribir.png" width="180" alt="Cada uno le escribe al siguiente"><br><sub>Cada uno le escribe al siguiente</sub></td>
    <td align="center"><img src="docs/screenshots/ahorcado/04-juego.png" width="180" alt="Horca, pista, palabra y teclado"><br><sub>Horca, pista, palabra y teclado</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/ahorcado/05-veredicto.png" width="180" alt="La letra y el pase, juntos"><br><sub>La letra y el pase, juntos</sub></td>
    <td align="center"><img src="docs/screenshots/ahorcado/06-sala.png" width="180" alt="Sala con código y QR"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/ahorcado/07-varios-celulares.png" width="180" alt="Todos adivinando a la vez"><br><sub>Todos adivinando a la vez</sub></td>
    <td align="center"><img src="docs/screenshots/ahorcado/08-resultado.png" width="180" alt="Puntaje y palabras verificadas"><br><sub>Puntaje y palabras verificadas</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/ahorcado/09-solitario.png" width="180" alt="Jugar solo: la app reparte la palabra"><br><sub>Jugar solo: la app reparte la palabra</sub></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>
<!-- /generado -->

El ahorcado de toda la vida, con el arreglo que le falta desde siempre: **nadie se queda mirando**.
En vez de un verdugo aburrido y un adivinador, cada jugador le escribe la palabra al siguiente —el
último al primero— y todos adivinan la suya. Con dos es un duelo; con seis, una carrera. El puntaje
son **los errores que te sobraron**, así que no basta con sacar la palabra: hay que sacarla barata.
Poner una palabra imposible no da ni un punto, y de todas formas el de al lado te escribe la tuya.

| | 🤝 Cadena | 🎴 Mazo de la app |
|---|---|---|
| Quién la pone | Cada jugador, para el siguiente, con una pista obligatoria | La app, de la temática elegida |
| Para qué sirve la temática | Le sugiere seis palabras a quien escribe, que puede tomarlas, editarlas o ignorarlas | Es de donde sale la palabra |
| El secreto | No viaja: se compromete con hash y se verifica al final | No hay: sale de la semilla del mazo |

Cinco temáticas y una mezcla (Chile, Animales, Comida, Cine y series, Deportes), con palabra y pista
propias en cada idioma: no son traducciones, porque una palabra traducida cambia de largo y de
dificultad. Los errores permitidos se eligen —5, 6 u 8— y el último trazo del dibujo, siempre, son
los ojos en X. Se puede **comprar una letra** 💡: aparece la que falta más rara y cuesta un error.

Se juega **por turnos alternados**: pruebas una letra y el celular pasa al siguiente. Todos los
tableros avanzan a la vez, así que ver que al de al lado le queda una vida mientras a ti te quedan
cuatro llega en el momento en que sirve.

- **📱 Un celular:** de dos a seis, con pantalla tapada para escribir la palabra. Después de cada
  letra, el resultado y el "pásale el celular a X" en la misma pantalla.
- **📡 Varios celulares:** sala con código y QR, hasta seis, por turnos alternados: una letra cada
  uno y se ve la secuencia (D-66). La tira
  de rivales muestra vidas y avance, nunca las letras.
- **🧍 Jugar solo:** la app reparte una palabra de la temática elegida, con su pista, y la sacas tú.
  Sin rival: el celular no adivina. Como la palabra sale del mazo no hay secreto que comprometer,
  así que es el único modo que anda sin https (D-65).

Especificación y diseño: [docs/juegos/ahorcado.md](docs/juegos/ahorcado.md)

---

## Características comunes

- **Idiomas:** español (por defecto), inglés y portugués de Brasil. El toggle del menú guarda la elección en el dispositivo; nunca se detecta el idioma del navegador (D-47, D-48). Ver [Idiomas](#idiomas).
- **Sonido:** efectos sintetizados con Web Audio (sin archivos de audio). Botón 🔊/🔇 en cada pantalla.
- **Partidas guardadas:** cada juego guarda su estado en el dispositivo y ofrece continuar.
- **Instalable:** manifest PWA para agregar a la pantalla de inicio. La pantalla no se apaga mientras se juega.

### Idiomas

Toda la experiencia va en el idioma elegido: el menú y sus frases del pie, los cinco juegos
con todos sus modos, las salas, el chat, los errores de transporte, las pantallas de "pásale
el celular" y las cartas de todos los mazos de Línea de Tiempo. El portugués es el de
Brasil, informal, y los nombres se traducen igual que en inglés:

<!-- generado: idiomas · lo reescribe python3 tools/readme.py actualizar -->
| Español | English | Português |
|---|---|---|
| Juegos de Salón | Party Games | Jogos de Salão |
| Línea de Tiempo | Timeline | Linha do Tempo |
| Toque y Fama | Bulls and Cows | Toque e Fama |
| El Ahorcado | Hangman | Forca |
| Batalla Naval | Battleship | Batalha Naval |
| Cuarto Rey | Fourth King | Quarto Rei |
<!-- /generado -->

Cómo está armado (canon C-3):

- `assets/js/i18n.js` guarda el idioma en `localStorage` (`juegos-de-salon:lang`), dibuja el
  toggle 🇨🇱 ES · 🇬🇧 EN · 🇧🇷 PT y tiene los textos comunes del menú (`COMMON`).
- Cada juego tiene sus textos en `LOCALES = { es, en, pt }` de su `rules.js`; `game.js` no
  tiene ninguna cadena literal. Los textos fijos del HTML llevan `data-i18n`.
- El registro del menú (`games.js`), las 100 frases del pie (`frases.js`) y cada carta de
  Línea de Tiempo (`decks/*.js`) llevan los tres idiomas.
- **Los tres diccionarios tienen exactamente las mismas claves.** Lo verifica
  `node assets/js/i18n.test.mjs`: claves, largo de las listas, `{llaves}` de las plantillas
  y que no haya textos vacíos. Un texto que falta se vería como `undefined` en pantalla.
- Las traducciones se adaptan, no se calcan: en portugués las comunas de Santiago son
  bairros, la penitencia es una prenda y el "fondo" es "vira, vira, vira".
- Para agregar un idioma: sumarlo a `LANGS` y al toggle en `i18n.js`, y agregar el
  diccionario en `COMMON`, `games.js`, `frases.js`, los cuatro `rules.js`, `decks/index.js` y
  cada carta. El test de paridad dice qué falta.
- El panel del dueño es solo en español (excepción anotada en `docs/PANEL.md`) y el
  `manifest.webmanifest` también, porque es uno solo para toda la app.

<!-- generado: capturas:idiomas · lo reescribe python3 tools/readme.py actualizar -->
<table>
  <tr>
    <td align="center"><img src="docs/screenshots/cuarto-rey/11-menu-en.png" width="180" alt="Menú en inglés"><br><sub>Menú en inglés</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/12-mesa-en.png" width="180" alt="Mesa en inglés"><br><sub>Mesa en inglés</sub></td>
    <td></td>
    <td></td>
  </tr>
</table>
<!-- /generado -->

## Panel del dueño

`/panel/` es una página privada que muestra cuánto y desde dónde se juega: salas vivas y
celulares conectados, partidas por juego y modo, jugadores por partida, zona horaria, idioma
y hora del día. Entra con Google y solo lee el dueño del proyecto de Firebase. Son señales de
uso anonimizadas, no personas: de los modos sin red salen solo contadores, y nunca una IP, un
secreto, el chat ni quién ganó. Ver [docs/PANEL.md](docs/PANEL.md).

## Stack

HTML, CSS y JavaScript puro (módulos ES), sin build ni dependencias de npm. Se publica como sitio estático en GitHub Pages desde la rama `main`. El modo de dos celulares usa **Firebase Realtime Database** (plan gratuito) como sala en tiempo real; ver [firebase/README.md](firebase/README.md).

## Correr en local

```bash
python3 -m http.server 8765
```

y abrir http://localhost:8765 (los módulos ES necesitan servirse por HTTP). Tests de los motores, de los idiomas y de los módulos compartidos:

<!-- generado: pruebas · lo reescribe python3 tools/readme.py actualizar -->
```bash
node ahorcado/engine.test.mjs
node batalla-naval/engine.test.mjs
node linea-de-tiempo/engine.test.mjs
node toque-y-fama/engine.test.mjs
node assets/js/i18n.test.mjs
node assets/js/transport/cleanup.test.mjs
node assets/js/transport/dispose.test.mjs
node assets/js/transport/errors.test.mjs
node assets/js/transport/ratelimit.test.mjs
node assets/js/transport/stats.test.mjs
node panel/aggregate.test.mjs
```
<!-- /generado -->

## Mirar una pantalla

Para revisar cómo quedó una pantalla concreta, sin jugar una partida entera:

```bash
node tools/e2e/mirar.mjs ahorcado juego --ancho 320
node tools/e2e/mirar.mjs ahorcado resultado --idioma pt
```

Saca la captura y avisa si hay scroll horizontal o botones bajo 44 px, que es lo que el canon pide mirar en cada pantalla. Los caminos a cada pantalla están declarados arriba del archivo: agregar uno es sumar una entrada, no escribir un guion nuevo.

Para verlo en un celular de verdad —y pasarle el enlace a alguien— se sirve el árbol de trabajo por Tailscale, sin publicar nada (D-67):

```bash
tailscale serve --bg 8765          # queda en https://<equipo>.<tailnet>.ts.net/
tailscale serve --https=443 off    # y se baja así
```

Es la app completa y con HTTPS, así que sirven también los modos que necesitan contexto seguro. Antes esto lo hacía una carpeta `lab/` con espejos de cada juego; se sacó porque los espejos envejecían y esto cubre lo mismo mejor.

## Publicar una versión

Antes de hacer commit de una versión nueva, estampa la versión en el sitio (import maps y estilos con `?v=`), así el navegador no mezcla archivos viejos y nuevos:

```bash
python3 tools/set-version.py 0.4.6
```

## Mantener este README al día

Este archivo cuenta cosas que el código ya sabe —cuántos juegos hay, qué modos tiene cada
uno, cuántas cartas trae cada temática, qué tests corren— y muestra capturas de pantallas
que cambian. Nada de eso avisa cuando queda viejo, así que hay una herramienta:

```bash
python3 tools/readme.py revisar          # ¿quedó algo atrás del código?
python3 tools/readme.py actualizar       # reescribe los bloques generados
python3 tools/readme.py capturas <seccion> [--sin-red]   # rehace las capturas
python3 tools/readme.py sellar           # "ya lo releí con estos hechos"
```

- **Lo derivable se genera.** Todo lo que está entre `<!-- generado: ... -->` y
  `<!-- /generado -->` lo escribe `actualizar` desde [`tools/hechos.mjs`](tools/hechos.mjs),
  que importa los módulos de verdad (`games.js`, los `rules.js`, `decks/index.js`). Ahí
  adentro no se edita a mano: la tabla de juegos, las temáticas, los nombres por idioma, los
  tests, el índice de documentos y las galerías de capturas.
- **Lo que es prosa la escribe una persona**, y la herramienta no la toca: la delata.
  `revisar` compara los hechos de hoy contra los del último sello (`docs/hechos.json`) y
  nombra qué cambió y qué sección hay que releer. Cuando ya se releyó, `sellar` lo anota.
- **Las capturas se rehacen solas.** [`docs/capturas.json`](docs/capturas.json) dice de qué
  guion de [`tools/e2e/`](tools/e2e/README.md) y de qué toma sale cada imagen; `capturas`
  corre los guiones en Chrome headless, copia los PNG y los deja al doble del ancho con que
  se muestran. Las que necesitan una sala de Firebase van marcadas y se saltan con
  `--sin-red`. Hay que mirarlas antes de publicar: los problemas de diseño se ven (C-12).
- **El gancho para que pase siempre** es `set-version.py`, obligatorio antes de publicar
  (C-11): corre `revisar` y se planta si el README quedó atrás. Para una urgencia, `--igual`.

Agregar una pantalla al README: sacar la toma en el guion de e2e, sumar la entrada a
`docs/capturas.json`, y correr `capturas` y `actualizar`.

## Estructura

```
index.html                  Menú principal (se genera desde assets/js/games.js)
assets/css/base.css         Estilos y animaciones compartidos (tema fiesta, transición entre turnos)
assets/js/games.js          Registro de juegos (textos en es, en y pt)
assets/js/i18n.js           Idioma (ES/EN/PT): toggle, persistencia y textos comunes; i18n.test.mjs revisa la paridad
assets/js/frases.js         Frases del pie del menú, 100 por idioma
assets/js/sound.js          Efectos de sonido sintetizados y botón de silencio
assets/js/ui.js             Utilidades UI: confeti, vibración, wake lock, helpers DOM
assets/js/firebase-config.js Configuración pública de Firebase
cuarto-rey/                 Juego Cuarto Rey (index.html, game.js, rules.js, style.css)
toque-y-fama/               Juego Toque y Fama (engine.js + tests, game.js, rules.js)
batalla-naval/              Juego Batalla Naval (engine.js + tests, game.js, rules.js)
linea-de-tiempo/            Juego Línea de Tiempo (engine.js + tests, game.js, rules.js, decks/)
ahorcado/                   Juego El Ahorcado (engine.js + tests, game.js, rules.js, decks/)
assets/js/handoff.js        Transiciones compartidas: pásale el celular, pantalla tapada
assets/js/chat.js           Chat de sala compartido (modos de varios celulares)
assets/js/session.js        Memoria de partida compartida (retomar en cualquier modo)
assets/js/transport/        Transportes compartidos: local (mismo celular), firebase (sala) y stats (señales de uso)
panel/                      Panel privado del dueño (entrada con Google; ver docs/PANEL.md)
firebase/                   Reglas de seguridad de Realtime Database y notas
manifest.webmanifest        Manifest PWA (instalable en la pantalla de inicio)
tools/set-version.py        Estampa la versión (import maps + estilos) para evitar caché mezclada
tools/readme.py             README al día: bloques generados, capturas rehechas y aviso de lo que cambió
tools/hechos.mjs            La hoja de hechos de la app (juegos, modos, temáticas, tests) leída del código
tools/e2e/                  Partidas completas en Chrome headless; de ahí salen las capturas (su README)
docs/capturas.json          Catálogo de las capturas: pie de foto y de qué guion sale cada una
docs/                       Requerimientos, decisiones, especificaciones y capturas
```

## Documentación

<!-- generado: documentacion · lo reescribe python3 tools/readme.py actualizar -->
- [Cánones y estándares de Juegos de Salón](docs/CANONES.md)
- [Requerimientos](docs/REQUERIMIENTOS.md)
- [Decisiones de diseño y arquitectura](docs/DECISIONES.md)
- [Cómo agregar un juego nuevo](docs/AGREGAR-JUEGO.md)
- [Panel del dueño](docs/PANEL.md)
- [Pruebas de punta a punta (Chrome headless por CDP)](tools/e2e/README.md)
- [Firebase](firebase/README.md)
- [Diseño: El Ahorcado](docs/juegos/ahorcado.md)
- [Diseño: Batalla Naval](docs/juegos/batalla-naval.md)
- [Especificación: Cuarto Rey](docs/juegos/cuarto-rey.md)
- [Diseño: Línea de Tiempo](docs/juegos/linea-de-tiempo.md)
- [Toque y Fama — estudio de factibilidad y propuesta de mecánica](docs/juegos/toque-y-fama-factibilidad.md)
- [Especificación: Toque y Fama](docs/juegos/toque-y-fama.md)
- [Changelog](CHANGELOG.md)
<!-- /generado -->
