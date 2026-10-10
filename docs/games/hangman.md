# Diseño: El Ahorcado 🪢

**Ruta:** `/hangman/` (id `ahorcado`) · **Jugadores:** 1 a 6 · **Desde:** v0.26 (2026-09-12) · **Estado:** publicado (v0.26, los tres modos) · **Idiomas:** es, en (“Hangman”), pt (“Forca”) y de (“Galgenmännchen”, D-191, D-197)

## Resumen

Quinto juego de la app. El ahorcado de toda la vida, con el arreglo que le falta desde siempre:
**nadie se queda mirando**. En vez de un verdugo aburrido y un adivinador, cada jugador adivina
su propia palabra, por turnos de una letra, y al final se comparan. Con dos jugadores es un duelo;
con seis, una carrera.

Sigue los [cánones](../CANONES.md). Dos excepciones documentadas, ambas en “Excepciones a los cánones”.

### Decisiones que deja este juego

| | |
|---|---|
| D-53 | El ahorcado se juega en cadena: nadie se queda mirando |
| D-54 | La misma palabra para todos solo cuando juegan a la vez |
| D-55 | La tira de rivales muestra vidas y avance, nunca letras |
| D-56 | Una letra errada no bloquea la pantalla (excepción a C-8b) |
| D-57 | Acentos plegados, Ñ con tecla propia y solo en español |
| D-58 | Comprar una letra cuesta un error y revela la más rara |
| D-59 | Los turnos se alternan letra a letra, no palabra por palabra |

## Reglas

| Regla | Decisión |
|---|---|
| Objetivo | Revelar tu palabra antes de quedarte sin vidas. |
| Vidas | 6 por defecto. Configurable: difícil 5, normal 6, fácil 8. Cada letra errada cuesta una (en el código, `lives`; hasta 0.84.0 la pantalla decía "errores permitidos"). |
| Una letra | Se toca una tecla y se confirma (C-8). Si está, aparece en todas sus posiciones; si no, se dibuja un trazo. |
| Comprar una letra 💡 | Revela la letra que falta **más rara** y cuesta una vida. Solo con 2 vidas o más. Sin tope: cada compra se paga sola. |
| Turno | **Se alterna letra a letra** (D-59): pruebas una y le toca al siguiente que siga vivo. |
| Ronda | Cada jugador adivina exactamente una palabra; todas avanzan a la vez, una letra por turno. |
| Puntaje | Las vidas que te quedaron (1 a 8). Te colgaron, 0. |
| Ranking | Primero los que la sacaron (más vidas, menos letras, menos tiempo); después los colgados, por cuánto revelaron (D-61). |
| Desempate | Menos letras gastadas; si sigue empatado, menos tiempo acumulado. |
| Fin | Termina cuando todos revelaron su palabra o los colgaron. Gana el puntaje más alto; si no la sacó nadie, no hay ganador (D-61). |

Nadie suma puntos por **poner** una palabra, solo por adivinar. Una palabra imposible no te da
nada: apenas le quita puntos al de al lado, y él te la devuelve en la misma partida.

### De dónde sale la palabra (D-53)

La sección **Palabra** de la configuración ofrece dos formas, en un selector de una sola fila con
el emoji arriba y el nombre completo debajo (D-52). **Cadena viene elegida por defecto**, porque es
la gracia del juego: elegirle la palabra a alguien que te está mirando.

| | 🤝 Cadena | 🎴 Mazo del celular |
|---|---|---|
| Quién la pone | Cada jugador le escribe la palabra **al siguiente**; el último se la escribe al primero | El celular, de la temática elegida |
| Pista | Obligatoria, la escribe quien pone la palabra (máx. 40 caracteres) | La trae la carta |
| Con 2 jugadores | El ahorcado clásico, cada uno le pone una al otro | Cada uno con su palabra |
| Secreto | La palabra **no viaja**: se compromete con hash y se verifica al final (C-10) | No hay secreto: la palabra sale de la semilla del mazo |

**Con cadena, la temática sugiere** (D-62). Arriba de los campos, quien escribe ve seis palabras
del mazo de la temática elegida, con su emoji: tocar una llena la palabra y la pista, y después las
puede editar o ignorar y poner la suya. Sin eso la temática no hacía nada con cadena, que es la opción por defecto.
Las sugerencias se calculan en ese celular y no viajan: la palabra sigue siendo secreta (C-10).

**La misma palabra para todos solo cuando juegan a la vez** (D-54). En varios celulares, el mazo
reparte una sola palabra para toda la mesa: es la comparación más justa que existe. En un celular
las rondas van en serie, así que ahí reparte una palabra distinta por jugador; si no, el segundo
jugaría sabiendo la respuesta.

### Temáticas del mazo

Chile 🇨🇱 · Animales 🐾 · Comida 🍕 · Cine y series 🎬 · Deportes ⚽ · Mezcla 🎲

Cada carta es una entrada con palabra y pista en los cuatro idiomas (el alemán desde D-191), como las cartas de Línea de Tiempo. **No son traducciones**: cada idioma
tiene su propia palabra para esa carta, porque una palabra traducida cambia de largo y de
dificultad. Las cuatro listas tienen el mismo largo y las
mismas claves, y lo verifica `public/assets/js/i18n.test.mjs` (C-3). Palabras de 4 a 12 letras, sin
nombres propios salvo en Cine y series.

### Acentos, Ñ y mayúsculas (D-57)

Todo se compara normalizado: mayúsculas, sin tildes y con Ç plegada a C. Tocar la **A** revela
también las **Á**, y se muestra la palabra con su tilde puesta. La **Ñ tiene tecla propia y solo en
español**: es una letra distinta, no una N con adorno, y en inglés, portugués y alemán no existe. El
teclado queda en 27 teclas en español y 26 en los otros tres. En alemán no hay teclas Ä, Ö, Ü ni ß:
las palabras alemanas del mazo las evitan, y el alfabeto y las frecuencias (`ALPHABETS`, `FREQ` en
`engine.js`) tienen su propia entrada `de` (D-191).

### Lo que se descartó

- **Modo tramposo** (evil hangman: la app no fija palabra y esquiva quedándose con la familia de
  candidatas más grande, con el conjunto comprometido por hash para demostrar que hizo trampa dentro
  de las reglas). Es entretenido y es honesto, pero es un juego distinto adentro de este. Queda
  anotado para una versión posterior.
- **Que el verdugo sume puntos** si cuelga a su víctima: premia poner palabras imposibles, que es
  justo lo que arruina al ahorcado.
- **Récord de rachas jugando solo**: cuántas palabras seguidas sacaste. Le daría al solitario algo
  que perseguir, como el récord de Línea de Tiempo. Queda pendiente: hoy cada palabra es una partida
  suelta.

## Modos

| Modo | Jugadores | Transporte |
|---|---|---|
| 📱 Un celular | 2 a 6 | `local` |
| 📡 Varios celulares | 2 a 6 | `firebase` |
| 🧍 Jugar solo | 1 | `local` |

En **un celular** primero cada uno escribe su palabra tapando la pantalla y después se juega por
turnos alternados: una letra y el celular cambia de mano (D-59). El resultado de la letra y el
"pásale el celular a X" van en la misma pantalla, nunca uno sin el otro (C-9). Anda hasta seis, pero
de cuatro para arriba la vuelta de escribir se hace larga.

En **varios celulares** se juega **por turnos alternados**, igual que pasándose un celular: una
letra cada uno, en el orden en que entraron (D-66). Quien no tiene el turno ve su tablero con el
teclado bloqueado, y la tira de rivales marca a quién le toca. Si alguien cierra la pestaña, el
turno lo saltea para que la sala no se trabe. El anfitrión
(rol A) abre la partida cuando están todos. Hay chat de sala (C-15) y sigue vivo en la pantalla
final. Cada uno en su celular es una comodidad, no otro juego: el puntaje sigue siendo las vidas
que te quedaron, y el reloj solo desempata.

**Jugando solo** el celular reparte una palabra de la temática elegida, con su pista, y el jugador la
saca. No hay rival: la máquina no adivina nada (D-65). Como la palabra sale del mazo y no la escribe
nadie, tampoco hay secreto que comprometer, así que este es el único modo que anda sin https.

La pantalla final es distinta: no hay ranking ni "ganó fulano", solo si la sacaste y con cuántas
vidas, y debajo la palabra que era.

**Rankings (D-215):** con un jugador de los rankings abierto en el celular (nombre y PIN,
D-212, abiertos a todos desde D-217), cada partida terminada se cuenta en `jugadores/<jid>/juegos/ahorcado`
y, si ganó, suma una victoria en la tabla `ahorcado_victorias` (semana y siempre): en sala, la de su
rol; contra el celular, la del humano; en un celular, la del jugador que se llama como él. Un
empate no es victoria. La tabla (semana, siempre y amigos) va en la intro, debajo de los modos
(`finDePartida` y `bloqueVictorias` de `public/assets/js/ranking.js`), y en `/records/`. Jugando
solo no se anota nada: no hay rival a quien ganarle.

### Uno al día (`/hangman/?today`, D-230)

Cuando El Ahorcado es el juego de Uno al día, `/hangman/?today` no ofrece modos: la intro lleva la
línea de Uno al día y un solo botón, **Jugar el de hoy**, que abre directo 🧍 Jugar solo con el
🎴 mazo del celular (Mezcla, 6 vidas y comprar letras, lo de siempre) y el nombre que se recuerda
(o "Jugador 1"). La palabra sale de la semilla del día (`semillaDel` → `azarDel(semilla, 'ahorcado')`
como semilla del mazo), así que es la misma para todos los que juegan en el mismo idioma. Al
terminar se anota el puntaje del día, **las vidas que quedan llevadas a 100** (0 si lo colgaron;
`puntajeAhorcado` en `uno-al-dia.js`), y la tarjeta de Uno al día va arriba de los botones del
resultado. El primer intento cuenta; los siguientes son práctica. No hay revancha (#226): la
tarjeta ya ofrece 🎲 Jugar otro y Repetir el de hoy. Si hoy toca otro juego, la página se va al de hoy. Se prueba con
`tools/e2e/uno-al-dia-grupo.mjs`.

## Flujo

```
Intro (modos) → Setup (nombres, vidas, de dónde sale la palabra, temática) → [Lobby: código + QR]
   → Palabra (solo con cadena: cada uno escribe la del siguiente, con pista) → Juego → Resultado → Revancha
```

Son las pantallas de `index.html`: `screen-intro`, `screen-setup`, `screen-lobby`, `screen-word`,
`screen-play` y `screen-result`.

### Interfaz

- **El dibujo**: horca y monito en SVG, con el neón de la app. La horca (base, poste, viga y soga)
  está desde el principio en trazo apagado; cada error dibuja una parte del monito con
  `stroke-dasharray`, como si alguien la trazara. El último trazo, en las tres dificultades, son los
  ojos en X: es el remate. Con una vida, la soga queda latiendo. Respeta
  `prefers-reduced-motion`: sin animación, el trazo aparece y ya.

  | Errores | Trazos |
  |---|---|
  | 5 (difícil) | cabeza · cuerpo · los dos brazos · las dos piernas · cara |
  | 6 (normal) | cabeza · cuerpo · brazo · brazo · las dos piernas · cara |
  | 8 (fácil) | cabeza · cuerpo · brazo · brazo · pierna · pierna · manos · cara |

- **La palabra** arriba, en Bangers, grande, con rayas por las letras que faltan. Si es larga, baja
  el tamaño y pasa a dos líneas: nunca scroll horizontal (C-8). Los espacios de una frase corta
  vienen revelados.
- **El teclado** abajo, pegado (`sticky`), grilla alfabética de 44 px, letras en `var(--font-num)`
  (Nunito 900): en Bangers y a esa densidad, la I y la L son el mismo palito. Las letras acertadas
  quedan cian, las falladas atenuadas y tachadas.
- **Nada se preselecciona** (D-38): se toca una letra, se agranda, y el botón que flota abajo dice
  sobre qué actúa —**🔤 Probar la A**—, igual que “¡Fuego!” en Batalla Naval. Un toque fuera la
  deselecciona.
- **La tira de rivales** (varios celulares): un chip por jugador con su nombre, sus vidas y cuánto
  lleva revelado en barra. **Nunca qué letras** (D-55): mirar el tablero del de al lado no puede
  ser una forma de jugar.
- **💡 Comprar una letra** es un botón aparte del teclado, con el precio escrito (“cuesta una
  vida”), y pide confirmar. Se deshabilita cuando queda una sola vida.
- **Al perder**, las letras que faltaban caen en su lugar en rojo, una por una, y recién ahí
  aparece el veredicto.
- **Sonido** (C-4): cada acierto suena medio tono más arriba que el anterior, así que una racha se
  escucha como una escala; el error es seco y sacude la pantalla; con una sola vida entra un
  latido bajo. Confeti y sonido al ganar (C-1).

### Lo que apareció al construirlo

- **En un celular, cada letra termina en una pantalla**: el resultado (“¡Va! La O aparece 2 veces”),
  la palabra como quedó, las vidas que sobran y, debajo, el pase al siguiente. No es un aviso de
  error —eso sería estorbar (D-56)—: es el traspaso, y por eso espera al jugador en vez de cerrarse.
- **El veredicto de una ronda es solo para quien la jugó.** En varios celulares cada uno adivina su
  palabra en su celular: taparle la pantalla a alguien que está en plena carrera para contarle cómo le fue a otro
  es peor que no contárselo. Los demás lo ven en la tira de rivales, que es donde ya están mirando.
- **Un veredicto en pantalla congela el dibujo.** Mientras hay un overlay arriba, la partida no se
  vuelve a dibujar: un mensaje que llega —una respuesta, la jugada de otro— borraría lo que el
  jugador está leyendo. Al cerrarse, el propio overlay vuelve a pasar por el estado de ese momento.
- **El celular no juega si nadie lo está mirando.** Sin esa regla, el bot adivinaba su palabra
  entera mientras el jugador leía el veredicto de la suya, y el duelo se perdía adentro de una
  pantalla que ya no estaba.
- **El formulario de la palabra no se rehace si ya se está escribiendo en él.** En varios celulares
  todos escriben al mismo tiempo, y la palabra que manda otro llega como mensaje: redibujar la
  pantalla borraba lo tecleado, el mismo problema que el canon C-15 le atajó al chat.
- **Al celular no se le pasa el celular:** cuando el que sigue es el bot no hay pantalla de pase, y
  su veredicto habla en tercera persona (“¡Celular la sacó!”), como el de cualquier rival (C-8b).

### Memoria de partida (C-6)

Se guarda con `createSessionStore('ahorcado')` después de cada letra, cada compra y cada palabra
escrita, incluida la palabra a medio escribir. Al retomar en un celular se vuelve a la pantalla de
pase o a la tapada: nadie sabe quién tenía el teléfono. La intro muestra “⏯ Hay una partida a
medias” con Continuar y Borrar.

## Protocolo de mensajes

Todo el estado se deriva de **la semilla del mazo más la lista de mensajes**.

```jsonc
{ "t": "hello",  "from": "A", "name": "Javi" }
{ "t": "start",  "from": "A", "order": ["A","B","C"], "seed": 91238 }
// Cadena: la palabra que A le puso a B viaja como forma, pista y hash. La palabra no (C-10)
{ "t": "word",   "from": "A", "to": "B", "shape": ".....", "hint": "Se pela y se come", "hash": "9f2…" }
{ "t": "guess",  "from": "B", "letter": "A", "n": 0, "ms": 1200 }   // n: qué jugada suya es
{ "t": "buy",    "from": "B", "n": 1, "ms": 900 }                   // 💡 comprar una letra
{ "t": "reply",  "from": "A", "to": "B", "n": 0, "letter": "A", "pos": "1,4" }  // solo cadena; "" si no está
{ "t": "reveal", "from": "A", "to": "B", "word": "PALTA", "salt": "x7…" }
{ "t": "rematch","from": "A", "code": "KXTR" }
{ "t": "chat",   "from": "C", "text": "esa la tenía" }      // no es estado
```

- `view()` deriva: patrón revelado de cada jugador, letras usadas, errores, compras, tiempo y puntaje.
- `pos` va como **texto** y no como lista: Firebase no guarda una lista vacía, y la letra que no
  está es justamente la lista vacía. Lo lee `readPos()` del motor (D-60).
- `n` numera las jugadas de cada jugador: es lo que aparea cada `guess` con su `reply` y lo que
  deja descartar repetidas sin depender del orden de llegada.
- Con mazo no hace falta `reply`: la palabra está en el código y cada aparato calcula lo mismo. Es
  el mismo trato que Línea de Tiempo con los años: quien abra la consola se arruina el juego solo.
- Con cadena, al final cada aparato verifica el hash **y** recalcula todas las respuestas que dio el
  rival, letra por letra. El resultado se muestra: “verificado ✅” o “⚠️ no coincide”.
- Jugadas fuera de turno, repetidas o con letras ya usadas se descartan en el reductor.
- `chat` es la excepción: se dibuja y se olvida, sin volver a dibujar la partida.

## Archivos

```
public/hangman/
  index.html       Pantallas, barra superior, #handoff, #cover, #chat
  style.css        El dibujo, el teclado, la tira de rivales
  rules.js         GAME_ID, DEFAULT_CONFIG, LOCALES = { es, en, pt, de }
  decks/index.js   Temáticas: chile, animales, comida, cine, deportes, mezcla
  decks/<tema>.js  Cartas con palabra y pista en los cuatro idiomas
  engine.js        normalize, isValidWord, reveal, rarest, score, view, cpuGuess
  engine.test.mjs  Tests del motor
  game.js          Máquina de estados y render
```

Registro en `public/assets/js/games.js` (`players: '1–6'`, `duration: '5–12'`); sus módulos entran solos al
import map de la copia que se publica (C-11, D-205). Gancho `window.__ahorcado` para las pruebas (C-14) y
`trackStart({ game: 'ahorcado', mode, players })` en los modos sin red (D-44).

## Excepciones a los cánones

- **C-8b · Una letra errada no bloquea la pantalla** (D-56). El canon pide que el error se quede en
  pantalla hasta que el jugador toque. Acá el error es la jugada normal del juego —en una partida
  hay cinco o seis— y en varios celulares los turnos siguen corriendo: un aviso que hay que cerrar
  seis veces convierte el juego en un trámite. La señal sí es inconfundible (fondo rojo, sacudida,
  sonido propio, la tecla tachada y el trazo nuevo), y lo que sí se queda hasta que toquen es el
  veredicto de la ronda: te colgaron, o la sacaste.
- **C-10 · Sin hash cuando no hay secreto repartido.** Con mazo la palabra sale de la semilla y la
  tienen todos los aparatos; con cadena en un celular, la app guarda las dos y no hay a quién
  engañar. El compromiso con hash corre donde de verdad hay un secreto por aparato: cadena en
  varios celulares. Jugando solo no hay ninguno, porque la palabra sale del mazo (D-65).
