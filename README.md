# 🎲 Juegos de Salón

App web (mobile-first) con juegos de salón para jugar con amigos: de naipes, de tomar, de deducción. Se abre desde el celular o tablet, se elige un juego en el menú principal, se ingresan los jugadores y el celular guía la partida. En español e inglés.

**Jugar:** https://ellokojavi.github.io/juegos-de-salon/

<p align="center"><img src="docs/screenshots/menu.png" width="220" alt="Menú principal"></p>

## Juegos

| Juego | Jugadores | Modos | Estado |
|---|---|---|---|
| 👑 [Cuarto Rey / Fourth King](#-cuarto-rey) | 4 a 6 | Un celular en la mesa | v0.3 |
| 🔢 [Toque y Fama / Bulls and Cows](#-toque-y-fama) | 1 a 2 | Un celular · Dos celulares · Contra el celular | v0.5 |
| ⏳ [Línea de Tiempo / Timeline](#-línea-de-tiempo) | 1 a 6 | Un celular · Varios celulares · Solitario | v0.9 |
| ⚓ [Batalla Naval / Battleship](#-batalla-naval) | 1 a 2 | Un celular · Dos celulares · Contra el celular | v0.6 |

---

## 👑 Cuarto Rey

El clásico de naipes para tomar. El celular hace de mazo: cada jugador saca una carta y la app dice qué hacer, nombra a quién le toca tomar, guía los mini-juegos (Cuenta Cuentos, Chancho Inflado, Cultura Chupística, Nunca Nunca), propone penitencias y cuenta los reyes. Con el cuarto rey, fondo y pantalla final.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/cuarto-rey/02-intro.png" width="180" alt="Intro"><br><sub>Intro y reglas</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/03-jugadores.png" width="180" alt="Jugadores"><br><sub>Jugadores y género</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/04-mesa.png" width="180" alt="Mesa"><br><sub>Toca para sacar carta</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/05-carta.png" width="180" alt="Carta"><br><sub>Carta e instrucción</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/cuarto-rey/06-minijuego.png" width="180" alt="Mini-juego"><br><sub>Mini-juego con ayudas</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/07-salud.png" width="180" alt="Salud"><br><sub>¡Salud!</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/09-cuarto-rey.png" width="180" alt="Cuarto Rey"><br><sub>¡Cuarto Rey!</sub></td>
    <td align="center"><img src="docs/screenshots/cuarto-rey/10-final.png" width="180" alt="Final"><br><sub>Ranking de sorbos</sub></td>
  </tr>
</table>

Especificación: [docs/juegos/cuarto-rey.md](docs/juegos/cuarto-rey.md)

## 🔢 Toque y Fama

Cada jugador elige un número secreto de cifras distintas y trata de adivinar el del rival. Por cada intento, el celular responde solo: **fama** es cifra correcta en su lugar, **toque** es cifra correcta en otro lugar. Nadie cuenta a mano, nadie hace trampa.

- **📱 Un celular:** se pasan el celular; la pantalla se tapa entre turnos.
- **📡 Dos celulares:** sala con código de 4 letras y QR. Cada celular guarda su secreto y responde a los intentos del rival. Al final ambos revelan y se verifica todo.
- **🤖 Contra el celular:** duelo contra un solver que adivina en 5 a 6 intentos.
- **💬 Chat de la sala:** en dos celulares hay un chat para picarse mientras adivinan. Los mensajes nuevos se asoman al lado de la burbuja. Muere con la partida.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/toque-y-fama/01-intro.png" width="180" alt="Intro"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/02-secreto.png" width="180" alt="Secreto"><br><sub>Número secreto</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/03-tablero.png" width="180" alt="Tablero"><br><sub>Tablero y teclado</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/04-pasale.png" width="180" alt="Pásale"><br><sub>Pásale el celular</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/toque-y-fama/06-sala.png" width="180" alt="Sala"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/07-dos-celulares.png" width="180" alt="Dos celulares"><br><sub>Partida en dos celulares</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/08-verificado.png" width="180" alt="Verificado"><br><sub>Secretos verificados</sub></td>
    <td align="center"><img src="docs/screenshots/toque-y-fama/05-resultado.png" width="180" alt="Resultado"><br><sub>Contra el celular</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/toque-y-fama/09-chat.png" width="180" alt="Chat de la sala"><br><sub>Chat de la sala</sub></td>
    <td></td><td></td><td></td>
  </tr>
</table>

Especificación: [docs/juegos/toque-y-fama.md](docs/juegos/toque-y-fama.md) · Estudio de factibilidad: [docs/juegos/toque-y-fama-factibilidad.md](docs/juegos/toque-y-fama-factibilidad.md)

## ⚓ Batalla Naval

El clásico de hundir la flota. Cada jugador esconde 5 barcos en un tablero de 10×10 y dispara por turnos: agua, tocado o hundido. Si aciertas, sigues disparando. Colocación por toque con girar, arrastrar y "al azar"; el celular responde solo y lleva el marcador.

- **📱 Un celular:** tu flota queda tapada entre turnos; al fallar, el resultado y "Pásale el celular a X" en una sola pantalla.
- **📡 Dos celulares:** sala con código y QR. Cada celular responde los disparos contra su propia flota; al final ambas flotas se revelan y verifican.
- **🤖 Contra el celular:** IA con cacería por paridad y persecución al acertar (hunde una flota en unos 50 disparos).

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/batalla-naval/01-intro.png" width="180" alt="Intro"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/02-flota.png" width="180" alt="Colocar flota"><br><sub>Colocar la flota</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/03-batalla.png" width="180" alt="Batalla"><br><sub>Batalla</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/04-pase.png" width="180" alt="Pase"><br><sub>Resultado y pase</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/batalla-naval/06-sala.png" width="180" alt="Sala"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/07-dos-celulares.png" width="180" alt="Dos celulares"><br><sub>Partida en dos celulares</sub></td>
    <td align="center"><img src="docs/screenshots/batalla-naval/05-resultado.png" width="180" alt="Resultado"><br><sub>Resultado con flotas</sub></td>
    <td></td>
  </tr>
</table>

Especificación y diseño: [docs/juegos/batalla-naval.md](docs/juegos/batalla-naval.md)

## ⏳ Línea de Tiempo

Recibes hitos sin fecha y los ubicas en el lugar correcto de una línea de tiempo común. Si aciertas, la carta se queda; si fallas, se descarta y robas otra. Gana quien se queda sin cartas: la ronda se juega completa, y si más de uno queda sin cartas gana el que respondió más rápido. Se elige la temática al empezar: **Historia** (98 hitos de la humanidad), **Música** (89, de Beethoven a TikTok), **Chile** (114, del terremoto del 60 al estallido) y **Cultura pop** (110, cine, memes y videojuegos). Las cartas no se repiten entre partidas seguidas: cada celular recuerda las que ya mostró. Agregar una temática nueva es solo un archivo de datos.

- **📱 Un celular:** de dos a seis jugadores, pasando el celular por turnos.
- **📡 Varios celulares:** sala con código y QR, hasta seis jugadores. El anfitrión abre la partida cuando están todos, y cada uno ve su propia mano.
- **🧍 Jugar solo:** vacía tu mano en la menor cantidad de intentos y supera tu récord por temática.
- **🃏 Pozo común (opcional):** en vez de una mano privada, las mismas 6 cartas a la vista para todos. Gana quien coloque primero las cartas acordadas.
- **💬 Chat de la sala:** en varios celulares hay un chat para comentar las jugadas mientras se espera el turno. Los mensajes nuevos se asoman unos segundos al lado de la burbuja. Muere con la partida.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/01-intro.png" width="180" alt="Intro"><br><sub>Modos de juego</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/02-tematica.png" width="180" alt="Temática"><br><sub>Temática y jugadores</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/03-juego.png" width="180" alt="Juego"><br><sub>Mano y línea de tiempo</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/04-veredicto.png" width="180" alt="Veredicto"><br><sub>Veredicto y pase</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/06-sala.png" width="180" alt="Sala"><br><sub>Sala con código y QR</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/07-varios-celulares.png" width="180" alt="Varios celulares"><br><sub>Partida en varios celulares</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/05-resultado.png" width="180" alt="Resultado"><br><sub>Resultado y ranking</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/08-chat.png" width="180" alt="Chat de la sala"><br><sub>Chat de la sala</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/09-chat-aviso.png" width="180" alt="Aviso de mensaje nuevo"><br><sub>Aviso de mensaje nuevo</sub></td>
    <td align="center"><img src="docs/screenshots/linea-de-tiempo/10-pozo-comun.png" width="180" alt="Pozo común"><br><sub>Pozo común</sub></td>
    <td></td><td></td>
  </tr>
</table>

Especificación y diseño: [docs/juegos/linea-de-tiempo.md](docs/juegos/linea-de-tiempo.md)

---

## Características comunes

- **Idiomas:** español (por defecto) e inglés. El toggle del menú guarda la elección en el dispositivo.
- **Sonido:** efectos sintetizados con Web Audio (sin archivos de audio). Botón 🔊/🔇 en cada pantalla.
- **Partidas guardadas:** cada juego guarda su estado en el dispositivo y ofrece continuar.
- **Instalable:** manifest PWA para agregar a la pantalla de inicio. La pantalla no se apaga mientras se juega.

## Stack

HTML, CSS y JavaScript puro (módulos ES), sin build ni dependencias de npm. Se publica como sitio estático en GitHub Pages desde la rama `main`. El modo de dos celulares usa **Firebase Realtime Database** (plan gratuito) como sala en tiempo real; ver [firebase/README.md](firebase/README.md).

## Correr en local

```bash
python3 -m http.server 8080
```

y abrir http://localhost:8080 (los módulos ES necesitan servirse por HTTP). Tests del motor de Toque y Fama:

```bash
node toque-y-fama/engine.test.mjs
node batalla-naval/engine.test.mjs
node linea-de-tiempo/engine.test.mjs
```

## Publicar una versión

Antes de hacer commit de una versión nueva, estampa la versión en el sitio (import maps y estilos con `?v=`), así el navegador no mezcla archivos viejos y nuevos:

```bash
python3 tools/set-version.py 0.4.6
```

## Estructura

```
index.html                  Menú principal (se genera desde assets/js/games.js)
assets/css/base.css         Estilos y animaciones compartidos (tema fiesta, transición entre turnos)
assets/js/games.js          Registro de juegos (textos por idioma)
assets/js/i18n.js           Idioma (ES/EN): toggle, persistencia y textos comunes
assets/js/sound.js          Efectos de sonido sintetizados y botón de silencio
assets/js/ui.js             Utilidades UI: confeti, vibración, wake lock, helpers DOM
assets/js/firebase-config.js Configuración pública de Firebase
cuarto-rey/                 Juego Cuarto Rey (index.html, game.js, rules.js, style.css)
toque-y-fama/               Juego Toque y Fama (engine.js + tests, game.js, rules.js)
batalla-naval/              Juego Batalla Naval (engine.js + tests, game.js, rules.js)
linea-de-tiempo/            Juego Línea de Tiempo (engine.js + tests, game.js, rules.js, decks/)
assets/js/handoff.js        Transiciones compartidas: pásale el celular, pantalla tapada
assets/js/chat.js           Chat de sala compartido (modos de varios celulares)
assets/js/session.js        Memoria de partida compartida (retomar en cualquier modo)
assets/js/transport/        Transportes compartidos: local (mismo celular) y firebase (sala)
firebase/                   Reglas de seguridad de Realtime Database y notas
tools/set-version.py        Estampa la versión (import maps + estilos) para evitar caché mezclada
docs/                       Requerimientos, decisiones, especificaciones y capturas
```

## Documentación

- [Cánones y estándares de los juegos](docs/CANONES.md)
- [Requerimientos](docs/REQUERIMIENTOS.md)
- [Decisiones de diseño y arquitectura](docs/DECISIONES.md)
- [Cómo agregar un juego nuevo](docs/AGREGAR-JUEGO.md)
- [Especificación: Cuarto Rey](docs/juegos/cuarto-rey.md)
- [Especificación: Toque y Fama](docs/juegos/toque-y-fama.md)
- [Factibilidad: Toque y Fama con dos celulares](docs/juegos/toque-y-fama-factibilidad.md)
- [Especificación y diseño: Batalla Naval](docs/juegos/batalla-naval.md)
- [Especificación y diseño: Línea de Tiempo](docs/juegos/linea-de-tiempo.md)
- [Changelog](CHANGELOG.md)
