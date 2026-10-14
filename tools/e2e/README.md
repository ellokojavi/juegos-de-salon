# Pruebas de punta a punta (Chrome headless por CDP)

Scripts que juegan partidas completas en Chrome headless, sin dependencias de npm: usan el
protocolo de depuración de Chrome por WebSocket (`cdp.mjs`). Cada script recibe una carpeta
de salida donde deja capturas PNG, e imprime en consola lo que verificó.

## Requisitos

- Google Chrome instalado en `/Applications/Google Chrome.app` (ruta en `cdp.mjs`), u otro navegador con `CHROME=/ruta/al/chrome`.
- Node 20 o superior (usa `fetch` y `WebSocket` nativos).
- El sitio servido en `http://localhost:8765`:

```bash
python3 -m http.server 8765 -d public
```

## Uso

```bash
mkdir -p /tmp/e2e && node tools/e2e/battleship/local.mjs /tmp/e2e
```

Con otra sesión probando al mismo tiempo (D-135), cada una sirve su copia en su puerto y se lo
pasa a los guiones en `SITIO` (**todos** lo leen; sin él, el 8765). Los puertos de Chrome no se
eligen: `cdp.mjs` abre cada Chrome con `--remote-debugging-port=0`, el sistema le da uno libre y
`launch` lo lee del archivo `DevToolsActivePort` del perfil (D-213). Dos sesiones, o dos guiones
de la misma, corren a la vez sin pisarse. El puerto que de verdad usó cada Chrome queda en `b.port`.

```bash
SITIO=http://localhost:8791 node tools/e2e/hangman/online.mjs /tmp/e2e
```

`PUERTO_CDP` sigue existiendo para quien quiera puertos fijos (para conectarse a mano a un Chrome
del guion, por ejemplo): el primer Chrome del guion usa `PUERTO_CDP`, el segundo el siguiente, y
así. Es opcional; sin él no hay nada que coordinar.

## En GitHub (D-193, D-307, D-308)

`ci.mjs` corre los guiones que no tocan el Firebase de producción, y GitHub lo usa en cada PR
(`.github/workflows/e2e.yml`). Un guion falla si sale con error, si imprime una línea con ✗ o ❌, o
si pasa los 15 minutos (ahí `ci.mjs` le manda SIGTERM, para que cierre su Chrome, y SIGKILL si a los
5 s sigue vivo). Los que solo imprimen lo que ven igual caen si algo se rompe del todo. Los
`online.mjs`, los `chat.mjs` y los de la lista `TAMBIEN_FIREBASE` de `ci.mjs` abren salas de verdad
y siguen a mano. Los de `OBSOLETOS` prueban algo que ya no existe y esperan que alguien los reescriba.

**En grupos** (D-307): [`grupos.mjs`](grupos.mjs) reparte los guiones en grupos parejos según lo
que tardó cada uno de verdad ([`duraciones.json`](duraciones.json), en segundos), para que ninguno
pase de ~4,5 min y todos quepan de una en los 20 runners que GitHub da a la vez. Cada grupo es un
job que corre sus guiones uno tras otro (que queden parejos y con cada guion una vez lo prueba
`node tools/e2e/grupos.test.mjs`); el resumen de la corrida trae la tabla con cada guion, su
tiempo y su resultado, y el artefacto `capturas-g<n>` trae, en una carpeta por guion, las capturas de
lo que falló o pasó al segundo intento. Un guion nuevo entra solo, con 90 s supuestos hasta que se
mida: cada job deja un aviso "Duraciones" con lo que tardó cada guion, y
`node tools/e2e/grupos.mjs medir` lo pasa a `duraciones.json` (la ronda de procesos, cuando los
grupos se desparejan). Un guion que pase de unos 4 minutos se reparte en partes (`PARTES` en
`ci.mjs`, D-204): `cup/torneo.mjs` en `copa`, `laboratorio` y `demos`, y `cup-games/idiomas.mjs` en
una por juego. Cada parte le llega al guion como `--parte <nombre>`; sin parte, el guion corre entero
(así lo corren `readme.py capturas` y quien lo prueba a mano).

Un PR que no toca nada del navegador (`docs/`, `marketing/`, `.claude/`, los `.md` fuera de `public/`
y de esta carpeta, `tools/agents/`, `tools/firebase/`, `firebase/` y los workflows que no son
`e2e.yml`) no corre ningún guion: `ci.mjs --grupos --cambios <archivo>` sale vacía, y
[`cambios.mjs`](cambios.mjs) decide qué cuenta (D-205, D-299; lo prueba
`node tools/e2e/cambios.test.mjs`).

Un guion que falla se repite **una vez**, en el acto, dentro de su grupo (`CI_REINTENTOS=1`, D-299).
Si pasa al segundo intento, queda en verde con un aviso ⚠️ **Intermitente** que lo nombra, y las
capturas del primer intento quedan en el artefacto: hay que mirar por qué falla a veces, no darlo
por bueno. Si falla dos veces, el grupo sale en rojo, con un aviso que nombra el guion.

**Al publicar** (D-302, D-308): cada corrida que pasa con guiones deja una marca, el artefacto
`e2e-arbol-<árbol>`, con el árbol que probó (en un PR, el merge de prueba con main). `publicar.yml`
corre [`ya-probado.mjs`](ya-probado.mjs): si el árbol que va a publicar ya tiene marca, o solo
cambia lo que no llega al navegador sobre un padre que la tiene, no repite la punta a punta. Si no,
la corre entera (cuándo no la repite lo prueba `node tools/e2e/ya-probado.test.mjs`), y si sale
en rojo no publica y el job `avisar` abre un issue "main en rojo: Punta a
punta"; cuando `main` vuelve a verde, `cerrar-aviso` lo cierra con el link a la corrida (D-273).

**Esperar a una condición, no una pausa fija** (D-307): `cdp.mjs` tiene `abrir(url, tope)` (navega
y espera el `load` y que la página se asiente), `asentar(tope)` (sin cambios en el DOM por 150 ms y
las animaciones finitas terminadas) y `hasta(expr, tope)` (hasta que la expresión dé verdadero).
El tope es la pausa fija de antes: nunca se espera más, y casi siempre mucho menos. Un guion nuevo
usa estas en vez de `sleep` y de `go(url, ms)`; `sleep` queda para lo que de verdad depende del
reloj (dejar correr un temporizador, un doble toque).

```bash
node tools/e2e/ci.mjs              # todos los de CI, uno tras otro, con resumen
node tools/e2e/ci.mjs --grupos     # los grupos que correría GitHub (JSON)
node tools/e2e/grupos.mjs ver      # los mismos, con su tiempo estimado
node tools/e2e/ci.mjs cup/torneo.mjs   # solo ese
node tools/e2e/ci.mjs cup/torneo.mjs:demos   # solo esa parte
CI_REINTENTOS=1 node tools/e2e/ci.mjs a.mjs b.mjs   # como en GitHub: con segundo intento
```

`mirar.mjs` no es una prueba: abre una pantalla suelta para revisarla de a una, sin jugar la
partida. `node tools/e2e/mirar.mjs ahorcado juego --ancho 320` saca la captura y avisa si hay
scroll horizontal, botones bajo 44 px (C-8) y cuánto aire hay entre el tablero y sus botones (D-309).
Además, **cada `b.shot()` de cualquier guion mide ese aire** (`aire-comun.mjs`) e imprime ✗ si un
botón queda a menos de 24 px de un `data-tablero`: el guion sale en rojo (con `AIRE_INFORMAR=1`
imprime el aire de cada captura, aunque cumpla). `--idioma de` (o `en`, `pt`) la abre en ese idioma. El
panel se mira con datos sembrados: `mirar.mjs panel <toma>`, con `datos`, `ahora`, `torneo`, `juegos`,
`audiencia`, `trafico`, `salud` (D-251), `copa-ficha`, `copa-dias`, `copa-historia`, `juego-ficha` o `sala-ficha` (D-207); `torneo` trae también una semana de avisos sembrados (D-233). Los
caminos a cada pantalla están en [`caminos.mjs`](caminos.mjs), que comparte con las pruebas de idiomas.

`contacto.mjs` tampoco: arma una hoja con **todas** las capturas del README de una sección,
al tamaño en que el README las muestra, para mirarlas juntas antes de publicar (D-76).

```bash
node tools/e2e/contacto.mjs cuarto-rey --salida /tmp/contacto
```

| Script | Qué prueba |
|---|---|
| `fourth-king/partida.mjs` | Botón de sonido, mazo completo hasta el cuarto rey y el menú en inglés; que la mesa sean justo los nombres del guion, aunque la mesa recordada traiga más filas |
| `bulls-and-cows/local.mjs` | Un celular y jugar solo (dos veces, para ver el récord), hasta el resultado |
| `bulls-and-cows/online.mjs` | Dos celulares contra Firebase real: unión por URL, recarga a mitad, revancha |
| `battleship/local.mjs` | Colocación, batalla en un celular y contra el celular |
| `battleship/colocacion.mjs` | Seleccionar, girar, mover y deseleccionar barcos en la grilla |
| `battleship/alineacion.mjs` | Que los números de fila queden alineados con las casillas en tres anchos |
| `battleship/online.mjs` | Dos celulares contra Firebase real, con recarga y revancha |
| `battleship/chat.mjs` | Chat de sala: se guarda al colocar la flota propia, globito y etiqueta, no mueve la partida, vuelve al recargar y sigue en el resultado. |
| `hangman/local.mjs` | Cadena de tres en un celular, comprar una letra, retomar y el solitario |
| `hangman/online.mjs` | Tres celulares contra Firebase real: cadena, reconexión a mitad y revancha |
| `liars-dice/local.mjs` | Duelo contra el celular y partida de tres en un celular, con retomar a mitad |
| `liars-dice/online.mjs` | Tres celulares contra Firebase real: sala, destape verificado, recarga a mitad y revancha |
| `generala/local.mjs` | Jugar solo entero, tres en un celular con recarga a mitad y la generala servida: nada elegido de antemano (C-8), los guardados no cambian y se anota lo que la planilla prometía |
| `generala/online.mjs` | Dos celulares contra Firebase real: los dados de quien juega a la vista del otro, recarga a mitad, partida entera y revancha |
| `case/lab.mjs` | El caso en `/labs/case/` (D-267): el laboratorio lo ofrece en La Bodega (D-280), plegado a su título mientras los proyectos activos van abiertos, y un toque lo abre y muestra Jugar; `/case/` lleva ahí; sin semilla es el caso del día y el link queda limpio; con la pantalla de La Copa, marcar antes de tiempo cuenta como error (D-261), al recargar sigue donde iba sin la cuenta, y el caso se resuelve sin adivinar; el final ofrece compartir, otro caso, el de hoy y el formulario de comentarios, con el envío interceptado (D-265) |
| `agents/lab.mjs` | Agentes del laboratorio (D-286, D-287): el laboratorio lo ofrece en Proyectos activos, con el crédito a Codenames y su link, que también están en la portada y el final; la portada lleva el sello de Clasificado y juega sola una pista (3 agentes y el asesino); sin semilla es el tablero de hoy, y con semilla la portada no escribe "null"; Empezar pasa por la cuenta 3, 2, 1 de La Copa (D-105) y recién después llega el tablero de 15 cartas; con semilla se juegan entero las 4 pistas: un agente suma, uno de otra pista suma sin cortar, el asesino y un neutral cortan la pista (sello Cortada), completarla le pone el sello Completa y pasa a la siguiente, que llega descifrándose; un agente encontrado antes cuenta para su pista, que se completa con los que le faltan; las marcas: un toque largo marca 📌 sin destapar, la línea de avisos dice que quedó marcada sin destapar (un toque que duró de más no parece elegido) y la ayuda bajo el tablero se va, otro 🚫, que al tocarla no se destapa, y otro la quita; al terminar se destapan las cartas que nadie tocó, el puntaje sube hasta el del motor y, con el asesino, el sello es "Te descubrió el asesino"; el final explica la trampa (con qué pista tentaba el asesino, también bajo su carta), muestra el tablero destapado, compartir, otro tablero, el de hoy y el comentario al final. A 375 px |
| `routes/lab.mjs` | Rutas rotas del laboratorio (D-293, D-294, D-295): el laboratorio lo ofrece en Proyectos activos con el crédito a Junction Nine, que también está en la portada; Empezar pasa por la cuenta 3, 2, 1 y parte en la etapa 1 de 5 con Reiniciar apagado y el reloj en 7 minutos; cada pieza se dibuja como dice el motor; arrastrar marca un rectángulo y al soltar gira (cada pieza queda donde y como dice el motor) y cuenta el giro; reiniciar vuelve al comienzo con 0 giros; en cada una de las 5 etapas, deshacer la revuelta une las líneas y llega la siguiente; el resultado da el puntaje por capas que dice el motor con lo que anotó el juego y el tiempo usado, el desglose muestra las tres capas y cada etapa, cuenta el reinicio y trae compartir, otro tablero y el comentario tras una línea; rendirse pide un segundo toque y da 0/100 sin etapas; con un reloj de prueba de 12 s, al acabarse cuentan las etapas hechas. A 375 px |
| `exploding-numbers/lab.mjs` | Números explosivos del laboratorio (D-297): el laboratorio lo ofrece en Proyectos activos con el crédito a Number Match, que también está en la portada; la portada se juega sola (los pares estallan); Empezar pasa por la cuenta 3, 2, 1 y arma el tablero de 4 filas; un par que no se une tiembla y dice por qué; uno que se une estalla (chispas y 💥); la 💡 Ayuda pide un segundo toque y marca un par; ➕ con pares a la vista pide un segundo toque y copia abajo los que quedan; con el orden del motor se limpia entero, las filas se van y paga 100/100; el resultado trae compartir, otro tablero, el de hoy y el comentario tras una línea; rendirse pide un segundo toque y vale la parte estallada. A 375 px |
| `plots/lab.mjs` | Loteo del laboratorio (D-310): el laboratorio lo ofrece en Proyectos activos con el crédito a Shikaku, que también está en la portada; el 5×5 de la portada se resuelve solo (los lotes se pintan) y termina en «¡Listo!»; Empezar pasa por la cuenta 3, 2, 1 y arma el tablero 1 de 5 con los números del motor; un rectángulo sin número, con varios o del área equivocada tiembla en rojo y dice por qué; uno que vale se pinta de su color y tocarlo lo borra; la 💡 Ayuda pide un segundo toque y pone un lote de la solución, que Deshacer saca; abajo van ↩ Deshacer, 🧹 Borrar y 🏳️ Rendirse en una fila, con la ayuda aparte; 🧹 Borrar pide un segundo toque, deja el tablero vacío y se apaga, y Deshacer lo trae de vuelta; con la solución del motor se resuelven los 5 tableros (5×5, 6×6, 7×7, 7×7 y 8×8) y el puntaje es el del motor con el tiempo que anotó el juego; el resultado trae compartir, otro tablero, el de hoy y el comentario tras una línea; rendirse pide un segundo toque, vale el tablero hecho y muestra cómo se resolvía. A 375 px (`ANCHO=320` a 320) |
| `plots/servicios.mjs` | Loteo, el modo ⚡💧 Servicios (D-311, D-312): el selector de la portada cambia el lema, los pasos (con «si un lote deja a un ⚡ sin su 💧, no va») y la demo (un 4×4 con ⚡ y 💧 que se resuelve solo), el celular lo recuerda y el link lo dice (`?mode=utilities`, que entra directo); «Lotes de n casillas» arriba del tablero y los íconos del motor; un lote del tamaño equivocado, al que le falta un servicio o con dos del mismo se rechaza con su aviso; uno que vale se pinta; con la solución del motor se resuelven los 5 tableros (6×6 de 3, 6×6 de 4, 6×6 de 6 y dos 8×8 de 8), el tablero 3 avisa que vienen los difíciles («Difíciles: si un lote deja una casilla sin lote posible…») y el 4 ya no, el puntaje es el del motor y el final dice el modo; «Otro tablero» y «El de hoy» lo conservan. A 375 px (`ANCHO=320` a 320) |
| `paint-mines/lab.mjs` | Pintaminas del laboratorio (D-289, D-290, D-291, D-292): el laboratorio lo ofrece en Proyectos activos con el crédito a ColorSweeper, que también está en la portada; la portada se pinta sola y sin semilla es el tablero de hoy; Empezar pasa por la cuenta 3, 2, 1; con semilla se juega entero contra el motor: acertar muestra el número, errar resta 15 y destapa el color verdadero marcado, el pincel elegido se nota; al terminar aparece el dibujo y dice qué era; la 💡 Ayuda marca una casilla sin pintar y los números que la explican, y lo dice; el resultado da 75/100 con un error y una ayuda (el desglose la cuenta), compartir, otro tablero, el de hoy y el comentario tras una línea; el interruptor del modo difícil parte apagado, se enciende (y se electrifica) y se apaga; con `?colors=2` viene encendido, el tablero tiene dos colores y tres pinceles, el marcador lo dice, sin errores paga 150/150 y «Otro tablero» sigue en difícil. Rendirse (D-296): pide un segundo toque, destapa el dibujo con lo que faltaba apagado y el puntaje vale la parte pintada. A 375 px |
| `code/lab.mjs` | La clave del laboratorio (D-270): el laboratorio la ofrece en La Bodega (D-280); la portada (título, ilustración y tres pasos, Palabra solo en español, sin el modo de 8); tocar una carta la pone y la elige, ✕ la saca, y sin orientar no se lee el código; un trazo encima de otro se ve rayado, sin texto; con las 4 derechas se lee el código sin choques; uno equivocado cuenta y el bueno abre con compartir y el formulario; en Palabra, voltear muestra la otra cara y la palabra se lee y abre. A 320 px y en los cuatro idiomas |
| `julep/local.mjs` | Mesa de tres contra el celular y partida en un celular, con retomar a mitad |
| `julep/online.mjs` | Tres celulares contra Firebase real: reparto cerrado, sello de cartas verificadas, recarga a mitad y chat |
| `timeline/local.mjs` | Un celular con tres jugadores, con retomar a mitad |
| `timeline/solo.mjs` | Jugar solo (⏳ Línea Relámpago): solo la temática, error en rojo, retomar, puntaje, récord por temática, cartas sin repetir, y en cada idioma |
| `timeline/error.mjs` | Pantalla de error que se queda hasta tocar; el rival espera |
| `timeline/online.mjs` | Tres celulares contra Firebase real, recarga y revancha |
| `bulls-and-cows/chat.mjs` | Chat de sala en Toque y Fama: no leídos, etiqueta, y que muera con la partida |
| `timeline/eleccion.mjs` | Que se coloque la carta elegida y que sin elegir no se pueda colocar nada |
| `timeline/dato.mjs` | El dato de cada carta en Línea Relámpago (D-277): el error lo cuenta con el reloj en pausa y tope de 6 s, el acierto lo deja en una franja que se va sola, el final es el repaso, y en inglés |
| `timeline/veredicto.mjs` | Que el veredicto hable en tercera persona cuando se equivocó otro |
| `timeline/mazos.mjs` | Todas las temáticas y que diez partidas seguidas no repitan cartas |
| `timeline/pozo.mjs` | Pozo común: tira de 6, reposición por el final, meta y ajuste que viaja en la sala |
| `timeline/mesa.mjs` | Todas a la vista: mesa del doble de la meta y sin reposición |
| `timeline/arrastre.mjs` | El gesto de arrastrar con eventos táctiles: elegir sin colocar, retomar, soltar fuera y desliz lateral |
| `timeline/empate.mjs` | Que la ronda se termine y que el empate lo gane el más rápido |
| `timeline/chat.mjs` | Chat de sala: no leídos, freno al spam, veredicto que lo tapa, reconexión y muerte al terminar |
| `memoria-de-partida.mjs` | Guardar y retomar en los tres juegos (canon C-6) |
| `versionado.mjs` | Que todos los módulos carguen con `?v=` del import map. Desde D-205 `public/` no lo lleva: correrlo contra una copia estampada (`set-version.py --sitio /tmp/sitio`, servida y pasada en `SITIO`) |
| `instalable.mjs` | La app instalable (D-221): en la portada, un juego, La Copa, un juego suelto y `/records/`, Chrome registra `/sw.js` con alcance `/`, lee el manifest sin errores y deja instalar. En los cuatro idiomas, en la portada y en un juego, revisa que la app se llame con el `appTitle` del idioma, en el manifest y en el `apple-mobile-web-app-title` (D-222). Contra una copia estampada (`SITIO`) prueba además que el import map no se rompa |
| `instalar.mjs` | El globo de la portada que invita a agregar la app a inicio (D-232): con el celular de cada uno (Safari y Chrome en iPhone, Chrome y Samsung en Android, WhatsApp), revisa los pasos de la hoja, el diálogo propio de Chrome, que la ✕ y "Ya la agregué" lo apaguen para siempre, que no salga en el computador ni en la app instalada, y que quepa a 320 px en los cuatro idiomas |
| `uno-al-dia.mjs` | Uno al día (D-230): con el reloj fijo en el día n.° 1, la tarjeta de la portada junto a La Copa (D-239: las píldoras de las dos en una línea, el dado que vuelve a decir "Juego al azar" y el botón al lado del dado desde `/labs/`), el dado que cae en el juego de hoy, la línea de la intro, un link de otro juego que se va al de hoy, la tarjeta del resultado (racha, compartir sin decir el juego, con imagen), sin el ranking del juego, el segundo intento como práctica, el botón "Listo" y `/today/` con su racha ("Hoy jugaste" con el emoji del juego y "Próximo juego en…"), su calendario (el emoji y el puntaje en una píldora) y la tendencia de cada juego, a 320 px y en los cuatro idiomas |
| `uno-al-dia-jugador.mjs` | Uno al día con jugador (D-230), con el almacén de prueba: Sara juega el de hoy, entra y su día sube a la historia y a los rankings (del día y de rachas); `/today/` muestra el ranking con sus cuatro pestañas y los comodines dicen para qué sirven; invitar manda su link en primera persona; Pedro, en otro "celular", ve "🔥 Sara te desafía", juega, ve el duelo y le da un comodín a Sara, que lo ve una vez al volver |
| `uno-al-dia-avisos.mjs` | Los avisos de Uno al día (D-230), con un servicio de avisos falso: la oferta con las tres horas la segunda vez que se termina, elegir una suscribe y guarda `pushDia`, la campana de `/today/` (hora, interruptores, Silenciar), que no haya recordatorio en el calendario (el recordatorio es el aviso diario, decisión 15 de D-230), los avisos bloqueados, y los caminos de iPhone en Safari y dentro de WhatsApp |
| `uno-al-dia-grupo.mjs` | Uno al día con El Ahorcado, Batalla Naval y Dudo (D-230): con el reloj fijo en un día en que toca cada uno, que `?today` abra directo el modo para uno, la línea de la intro, que la palabra, la flota del celular y los dados salgan de la semilla del día, el puntaje de su fórmula, la tarjeta arriba de los botones del juego, sin revancha (#226), el segundo intento como práctica, un link de otro juego que se va al de hoy, `/today/` y el dado que nombra a los de grupo |
| `compartir-sala.mjs` | Botón de compartir: diálogo nativo si existe, copiar si no |
| `favoritos.mjs` | Los favoritos de la portada (D-238, D-241): la ⭐ se toca con el dedo y marca sin abrir el juego, la ficha ⭐ Favoritos sale con el primero y deja ver solo esos (y va en la URL), desmarcar ahí no saca la tarjeta de la vista, se recuerdan al recargar, `?type=favorites` sin favoritos muestra todos, y dónde va ⭐ Favoritos (D-241): primera en la fila de tipos a 390 px y en un computador, y a 320 px donde quepa (en su línea si no), siempre con los tipos en una fila y sin salirse, en los cuatro idiomas |
| `compartir-portada.mjs` | El botón de compartir de la portada (D-226, D-242), en los cuatro idiomas: en español abre la hoja con el video, sin cargarlo hasta que lo tocan, y "Compartir el video" manda el link de YouTube (D-253); en los demás comparte directo, sin hoja (D-254). En todos, la tarjeta social del idioma como imagen, el texto con su cabecera y el link a la portada de ese idioma; en un computador, solo el texto copiado y nada descargado |
| `enlace-invitacion.mjs` | Quien llega por un enlace solo puede unirse a esa sala, en los cuatro juegos con sala |
| `sala-error.mjs` | Sin llegar a Firebase: el mensaje de cada juego con sala, Toque y Fama en cada idioma y los demás repartidos entre ellos |
| `idioma-por-url.mjs` | El idioma que viene en el link, en cada idioma: `?lang=`, las puertas (`/en/`, `/pt/`, `/de/`) y las invitaciones a sala y a copa |
| `sala-tope.mjs` | Pasado el tope de salas por celular, avisa al instante y sin tocar la red |
| `hangman/idiomas.mjs` | El Ahorcado en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `battleship/idiomas.mjs` | Batalla Naval en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `bulls-and-cows/idiomas.mjs` | Toque y Fama en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `timeline/idiomas.mjs` | Línea de Tiempo en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `liars-dice/idiomas.mjs` | Dudo en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `generala/idiomas.mjs` | Generala en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `julep/idiomas.mjs` | Julepe en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `fourth-king/idiomas.mjs` | Cuarto Rey en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `cup-games/idiomas.mjs` | Los juegos sueltos de La Copa en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |

## Todos los idiomas (D-199)

Cada juego tiene su `<carpeta>/idiomas.mjs` (`hangman/`, `battleship/`, `bulls-and-cows/`,
`timeline/`, `liars-dice/`, `generala/`, `julep/`, `fourth-king/`, y `cup-games/` para los juegos de La Copa
que se juegan sueltos). Recorren cada pantalla de [`caminos.mjs`](caminos.mjs) en cada idioma de
`LANGS` —un idioma nuevo entra solo— y la comparan con la misma pantalla en español:

- la página está en ese idioma (`<html lang>`) y llega a la misma pantalla;
- no asoma `undefined`, `NaN`, `[object …]` ni un `{marcador}` sin reemplazar;
- no quedó nada en español: ni un texto de los diccionarios (`LOCALES` del juego y `COMMON`) que
  en ese idioma diga otra cosa, ni una línea larga idéntica a la de la pantalla en español, que
  es como se delata un texto escrito a mano fuera de los diccionarios;
- el texto más largo no rompe la pantalla (C-8): sin scroll horizontal, botones bajo 44 px ni
  botones que se salgan por abajo que el español no tenga.

La lógica vive en [`idiomas-comun.mjs`](idiomas-comun.mjs), y cada toma queda como captura
`<pantalla>-<idioma>.png`. Una pantalla nueva para revisar en todos los idiomas se agrega a
`caminos.mjs`, el mismo catálogo que usa `mirar.mjs`; un juego nuevo, con un `idiomas.mjs` de
tres líneas. `cup/idiomas.mjs` hace lo mismo con la portada de La Copa y su formulario.

## De acá salen las capturas del README

Varias de estas tomas son las imágenes que muestra el README. El catálogo
[`docs/capturas.json`](../../docs/capturas.json) dice cuál sale de qué guion y con qué
nombre, y `python3 tools/release/readme.py capturas <seccion>` corre los guiones que hagan falta y
copia los PNG a `docs/screenshots/` (ver D-51). Por eso, al renombrar o sacar una toma de
un guion conviene correr `python3 tools/release/readme.py revisar`: avisa si dejó una imagen huérfana.

Rehacerlas no es revisarlas: después de `capturas`, la hoja de contacto (`contacto.mjs`) las
pone juntas y ahí se ve lo que una imagen sola no delata —una fila más ancha que la de arriba,
una pantalla que no corresponde al pie, algo tapado por el confeti— (D-76).

## Cómo simulan varios celulares

Cada "celular" es una instancia de Chrome con su propio perfil (`dir`) y su propio puerto de
depuración, que elige el sistema. Para que no compartan `localStorage`, cada una usa un origen distinto del mismo
servidor: `localhost`, `127.0.0.1` y `[::1]`. Los scripts "online" hablan con el proyecto de
Firebase real, así que necesitan internet y dejan salas de prueba que caducan a la media hora de quedar quietas (D-89).

## Cuidados

- **La carpeta de salida** (D-315): `const OUT = salida()` (o `salida('/tmp/<guion>')` con una por
  defecto), de `tools/e2e/salida.mjs`. Toma el primer argumento solo si es una carpeta de verdad:
  corrido sin carpeta o con un flag primero (`torneo.mjs --parte copa`), el guion ya no deja
  `undefined/` ni `--parte/` con un perfil de Chrome dentro de la copia. `salida.test.mjs` falla si
  un guion lee `process.argv[2]` a mano, y `launch` no abre Chrome con un perfil así.
- **Chromes zombis:** cada Chrome muere con su guion, termine como termine: bien, con una
  excepción, con Ctrl-C o con un `kill` (SIGINT, SIGTERM, SIGHUP; `cdp.mjs`). No hace falta
  `pkill`. La única salida que se lo salta es un `kill -9` al proceso de node. Si alguna vez queda
  uno vivo, se busca por **su perfil**, que es la carpeta de salida del guion, y no por el puerto:
  `pgrep -af "user-data-dir=/tmp/e2e/"` para verlo y `pkill -f "user-data-dir=/tmp/e2[e]/"` para
  matarlo (con corchete: sin él, el patrón calza con el propio shell). Nunca
  `pkill -f remote-debugging-port` a secas, que mata las pruebas de todas las sesiones. Un Chrome
  vivo con el mismo perfil hace que el siguiente no abra: `launch` lo dice en el error.
- El `port` que cada guion le pasa a `launch` ya no es un puerto: solo lo usa `PUERTO_CDP` para
  saber qué Chrome es cuál. Un guion que necesite el puerto lo lee de `b.port`.
- En una pestaña oculta el navegador acelera los temporizadores de forma distinta; las esperas
  (`sleep`) están calibradas para headless.

## La Copa

`node tools/e2e/cup/torneo.mjs <salida> [--siete]` juega una Copa de 3 días (o la de 7 con `--siete`) con
tres jugadores en un solo Chrome, con el almacén de prueba y el reloj adelantado día por día. Cada
jugador es la misma pestaña con el `sessionStorage` limpio. Revisa en cada pantalla que no haya
scroll horizontal ni botones bajo 44 px (C-8), y captura el recordatorio, la tabla parcial y el
resumen que compartiría la admin.

`node tools/e2e/cup/idiomas.mjs <salida>` crea una copa en cada idioma que no es el español
(D-170, D-199): revisa que la copa guarde el idioma de sus palabras, que la pantalla siga el idioma
de quien mira (otro, el siguiente de la lista) y que lo que se comparte al grupo salga en el de la
copa, con su `?lang=`. Después abre cinco juegos sueltos en cada idioma (el teclado de Palabra sin
Ñ, la grilla de Conexiones del idioma) y recorre la portada y el formulario de crear contra el
español. Los textos esperados salen de los diccionarios, no están escritos en el guion.

`node tools/e2e/cup/copas-del-jugador.mjs <salida>` prueba que "Tus copas" siga al jugador (D-220):
un celular entra con su jugador y abre una copa en que está sentado; otro celular, que nunca la vio,
entra con el mismo jugador, la encuentra en la portada y al abrirla tiene su nombre ya elegido.
Usa el almacén de prueba de la copa y el de los jugadores.

`node tools/e2e/cup/zip-diez.mjs <salida>` juega los diez niveles de Zip en la práctica, con la
semilla fija, y revisa que la partida termine ahí, antes del reloj (D-250): el aviso "¡Resolviste
los 10 niveles!" sin texto de más, sin cuenta regresiva ni solución a la vista, el reloj de arriba
quieto y 100 puntos en el resultado.

`node tools/e2e/cup/avisos.mjs [salida]` recorre los avisos de La Copa (D-223) con el almacén de
prueba, la clave VAPID de `vapid.js` (D-225) y un servicio de avisos falso (nada sale del Chrome): la tarjeta y
"Ahora no", la campana que activa los avisos y el aviso de confirmación, los ajustes y "Silenciar
esta copa", los avisos bloqueados, y el camino de iPhone (agregar a inicio, dentro de Instagram, y
los pasos que dan el código de la copa, porque iOS abre la app en la portada, D-227, y la app
instalada que abre con el nombre ya elegido si la dirección lleva `&app=`). También lo que abre un
aviso (D-229): `&day=<d>` parte en ese día listo para empezar (o en el tablero, si no se puede
jugar) y `&mute` silencia la copa. Los botones del aviso en Android se prueban a mano: Chrome
headless no los muestra. Deja capturas de cada hoja.

`node tools/e2e/cup/asiento.mjs [salida]` le quita el asiento al celular de la demo `player` (como
cuando pierde su sesión de Firebase o el admin da un PIN nuevo), entra por el aviso del día y toca
Empezar: revisa que no diga que el día se cerró, que pida el PIN con el nombre ya elegido y que,
con el PIN, el día empiece (D-285).
