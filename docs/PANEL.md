# Panel del dueño

Página privada en `/panel/` que muestra cuánto y desde dónde se juega. Son **señales de
uso, no personas**: sirven para ver qué juegos gustan, cuántos jugadores se juntan y a
qué horas, no para identificar a nadie (D-44).

- Publicado: `https://juegosdesalon.cl/panel/`
- Local: `http://localhost:8765/panel/`

No aparece en el menú ni se indexa. El código es público como todo el repo: lo que protege
los datos son las reglas de Firebase, que solo dejan leer al UID del dueño.

## Las tres vistas (D-137)

Arriba, debajo del entorno y el rango, tres botones separan lo que se mira. La vista queda en la
URL (`/panel/#torneo`), así que un enlace o una recarga vuelven a la misma.

| Vista | Ahora | En el rango |
|---|---|---|
| **📊 Resumen** | Salas en juego, copas en curso, gente jugando un minijuego, celulares conectados. Las dos listas: copas en curso y salas vivas. | Partidas de juegos contra minijuegos de La Copa, en total y por día. Copas activas, celulares que jugaron. De dónde, idiomas, hora y cuota. |
| **🏆 La Copa** | Copas en curso con el minijuego de hoy, quién ya lo jugó (✓), quién lo está jugando (punto verde), quién va primero y el último resultado. | Copas activas y nuevas, inscritos, minijuegos jugados y sin terminar, participación. Por minijuego: jugadas, puntaje promedio, tiempo típico y en cuántas copas. Minijuegos por día. La lista de copas con su ganador o quién va primero. |
| **🎲 Juegos** | Salas vivas, como siempre. | Los juegos de una partida, sin La Copa: por juego y modo, jugadores por partida, por día y la bitácora de salas. |

**Qué es torneo y qué es juego** lo dice el registro (`torneo: true` en `games.js`), no el panel:
un segundo torneo entraría solo a su vista (C-16). El nombre de la pestaña también sale de ahí.

**De dónde, idiomas y hora** van solo en el resumen y enteros: los manda el celular al empezar
cualquier cosa, sea una partida o un minijuego, y no se pueden partir por juego.

## La Copa en el panel (D-137)

No usa señales aparte: lee `torneos/` tal como lo guarda la copa (el dueño ya podía leerlo en las
reglas). El calendario de cada copa dice qué minijuego tocó cada día, y cada resultado trae su
puntaje (0 a 100), su tiempo y su hora. Las cuentas de la copa (qué día va, la tabla) salen del
motor de la copa, `copa/engine.js`; el panel no las repite.

- **Jugando ahora:** tocó Empezar hace menos de media hora y todavía no hay resultado. Mira todos
  los días abiertos, porque el de ayer se puede jugar hasta el fin de hoy.
- **Minijuego sin terminar:** tocó Empezar y no dejó resultado, y ya no lo está jugando (pasó
  media hora o el día cerró). Se dibuja en gris detrás de las jugadas de su minijuego.
- **Participación:** minijuegos jugados de los que se podían jugar, en los días ya cerrados: uno
  por jugador inscrito por día. Quien se inscribió después de que un día cerró no debía ese día.
  Una copa sin días cerrados muestra "sin días cerrados", no 0 %.
- **Inscripción abierta:** según las fechas y según el admin: si la cerró (`closed`), no se dice abierta.
- **Tiempo típico:** la mediana, no el promedio: una persona que dejó el celular media hora
  encendido no mueve la cifra.
- **Va primero:** el dueño ve la tabla completa, incluidos los días que los jugadores todavía no
  pueden ver (cada uno ve un día recién cuando lo jugó o cuando cerró).
- **Sin entorno:** `torneos/` no está separado como `stats/<env>`, así que las copas de prueba
  salen junto a las reales. Las del laboratorio llevan la etiqueta "laboratorio".
- **Se baja entero:** las copas son pocas y chicas. Si algún día pesan, el paso siguiente es un
  índice por `meta/createdAt` en las reglas y pedir solo las del rango.

## Qué se ve

| Sección | Qué muestra | De dónde sale |
|---|---|---|
| **Ahora** | Salas en juego, celulares conectados, salas vivas (las que latieron hace menos de media hora, D-89), juegos en curso. Lista de salas con código, juego, nombres, quién está conectado, **jugadas**, **mensajes de chat** y última jugada (D-138). Una sala cuenta como *en juego* solo si entró un rival. Solo las del entorno elegido (D-45). | `rooms/` en vivo (índice por `createdAt`), cruzado por código con `stats/<env>` |
| **Últimos 7 / 30 días** | Partidas empezadas, en dos celulares (solo las que tuvieron rival), sin red, entradas de un celular a una partida, partidas de hoy (día UTC) y salas donde nunca entró nadie más (D-138). | `stats/<env>/days/<día>` |
| **Partidas por juego** | Barra por juego, partida por modo: 📡 dos celulares, 📱 un celular, 🤖 contra el celular, 🧍 solo. Los modos salen del registro, y uno nuevo entra solo (C-16). | `rooms` (📡) y `local/<juego>/<modo>/<n>` |
| **Jugadores por partida** | Cuántas partidas de 1, 2, … hasta el juego más numeroso del menú (hoy 6, `MAX_PLAYERS`). | `n` de los contadores sin red y cantidad de nombres de cada sala |
| **Por día** | Partidas por día, separando dos celulares del resto. | ídem |
| **De dónde** | Zona horaria del celular (ciudad y región). Cuenta celulares que empezaron o entraron a una partida, no partidas. | `origin/<zona>` |
| **Idioma del navegador** | `es-CL`, `pt-BR`, … De dónde es la persona. | `lang/<idioma>` |
| **Idioma elegido para jugar** | El del toggle de la app, con su nombre en español. En cuál prefiere jugar, que no es lo mismo que de dónde es (D-46). | `applang/<idioma>` |
| **A qué hora se juega** | Hora local de cada celular, 0 a 23. | `hour/<h>` |
| **Cuota** | Enlace a la consola de uso de Firebase. Los "celulares conectados" son la mejor aproximación a las conexiones simultáneas del plan gratuito. | — |

**Salas cerradas**: una sala que sus jugadores cancelaron (todos con `left`, ver D-50) no
aparece en "Ahora". Se borra sola en el acto, así que casi nunca alcanza a verse; si alguna
sobrevive al borrado, mostrarla sería decir que hay gente jugando donde ya no hay nadie. Una
sala donde nadie está conectado **sí** sigue apareciendo, apagada: esa partida se puede
retomar hasta que la sala venza (C-6).

**Celulares conectados** cuenta los jugadores con `online: true` en salas vivas. Los modos
sin red no abren conexión (mandan un solo `fetch`), así que no aparecen ahí ni gastan cuota.

**Entorno**: el selector separa lo publicado (`prod`) de las pruebas (`dev`): el computador, la
red de la casa (10/8, 172.16/12, 192.168/16, `.local`) y Tailscale (`*.ts.net`, D-67, D-138).
Las pruebas de punta a punta pegan contra Firebase de verdad y caen en `dev`, así que no ensucian
las cifras reales. `lab` quedó solo para leer lo que se guardó mientras existió el laboratorio.

**Qué cuenta cada cifra** (D-138):

- **Jugadas** son los mensajes de sala que hizo una persona: un disparo, un intento, una apuesta.
  Cada juego los declara en `jugadas` de `assets/js/games.js`. No cuentan las respuestas
  automáticas (`reply`), el anti-trampa (`commit`, `reveal`), las entradas (`hello`), la revancha
  ni el chat. Un juego que no declara `jugadas` cuenta todo menos entradas y chat.
- **Mensajes de chat**: solo cuántos. El panel nunca muestra qué dicen.
- **Partidas** se anotan al empezar, no al terminar: sin red, al elegir el modo; en sala, al
  crearla. Una sala donde nunca entró un segundo jugador no es una partida y se cuenta aparte.
- **Entradas de un celular a una partida**, y también *De dónde*, los idiomas y la hora, suben
  una vez cada vez que un celular empieza o entra a una partida: el mismo celular que juega cinco
  revanchas suma cinco. No son personas.
- **Los días son días UTC**: en Chile el día del panel cambia a las 21:00 (verano) o 20:00
  (invierno). La hora de *A qué hora se juega* sí es la local del celular, tomada al empezar.

Vale también para la lista de "Ahora", aunque ahí cueste un rodeo: `rooms/` es el nodo real
del transporte y es uno solo para todos los entornos, así que una partida de prueba abre una
sala tan real como la de un jugador. El panel cruza cada sala viva por código contra lo que
`stats/<env>` registró hoy y ayer, y las que quedan fuera las nombra debajo de la lista en vez
de esconderlas: si una sala real no alcanzó a registrarse, tiene que poder verse (D-45).

## Qué se registra y qué no

Sale del celular, por día y por entorno (`assets/js/transport/stats.js`):

- **Dos celulares:** `rooms/<CÓDIGO>` con juego, hora del servidor, versión de la app, los
  nombres de quienes entraron (`players/A..F`), el país de cada celular (`co/A..F`, dos
  letras) y quién ganó (`end`). Esos nombres ya viajan a la sala para que el rival los vea;
  acá solo los lee el dueño. El país y el ganador se anotan desde la versión 0.33.6 (D-79).
- **Un celular, contra el celular, solo:** un contador por juego, modo y cantidad de
  jugadores. **Ningún nombre.**
- **Cualquier modo:** contador de zona horaria, idioma del navegador, idioma elegido en el
  juego y hora local.

No sale nunca: dirección IP (no hay servidor que la vea y no se consulta a nadie), los
secretos de las partidas, el chat, ni el nombre de nadie en los modos sin red. Quién ganó sí
sale, pero solo de las salas: de una partida en un celular no se sabe ni quién jugó (D-79).
Todo es mejor esfuerzo: si el envío falla, nadie se entera y la partida sigue igual.

## La bitácora de salas (D-79)

Al final del panel hay una lista de las **salas jugadas** en el rango elegido arriba, de la
más nueva a la más vieja y paginada de a 20:

| Cuándo | Juego | Jugadores | Ganador |
|---|---|---|---|
| Día y hora de la sala, y su código | Nombre del juego | Cada nombre con la bandera de su país | 🏆 el que ganó, 🤝 si fue empate |

- **Las pruebas no salen.** Corren en el entorno `dev` y el panel abre en `prod`; para verlas
  se cambia el entorno arriba (D-45).
- **Las salas donde nunca entró nadie más tampoco**, porque no son una partida. Hay una
  casilla para incluirlas.
- **Guion en el ganador** quiere decir que no quedó registro: una sala de antes de que esto
  existiera, o un final que no alcanzó a enviarse. No es lo mismo que un empate.

## Los rangos (D-80)

El selector de arriba manda en toda la página, incluida la bitácora: **7, 30, 60 y 90 días, 1
año y lo que va del año** (desde el 1 de enero). La lista vive en `panel/aggregate.js`, así que
agregar un rango es sumar una línea.

- **Se baja lo que el rango pide, y nunca menos de lo ya bajado.** Mirar la semana no descarga
  un año; volver de un año a la semana no descarga nada. Mientras llega, el título dice
  "cargando…".
- **La barra "cuándo se juega" cambia de grano:** por día hasta 30, por semana hasta 90 (con la
  fecha del lunes) y por mes de ahí en adelante.
- Hacia atrás solo hay lo que se haya registrado: el panel existe desde la v0.20, y el país y el
  ganador desde la v0.33.6 (D-79).

## Cómo entrar (una sola vez, en la consola de Firebase)

1. **Authentication → Método de acceso → Google → Habilitar.** Es la única forma de
   entrar que acepta el panel. Los jugadores siguen sin autenticarse: no les cambia nada.
2. **Authentication → Settings → Authorized domains:** agregar `juegosdesalon.cl`, que es
   el dominio donde vive el sitio (`localhost` ya viene). Ojo: no sirve autorizar
   `ellokojavi.github.io`, porque redirige con un 301 y el acceso con Google ocurre en el
   dominio final.
3. Abrir `/panel/` y tocar **Entrar con Google** con la cuenta que va a mirar el panel. Como
   las reglas todavía no la conocen, el panel muestra el **UID** de esa cuenta en vez de
   dejar pasar. El selector de cuentas sale siempre, a propósito: entrar con la equivocada
   da un UID igual de válido y el error no se nota hasta después de publicar las reglas.
4. Poner ese UID en las dos líneas `.read` de
   [firebase/database.rules.json](../firebase/database.rules.json) (`rooms` y `stats`), y
   publicar las reglas en **Realtime Database → Rules → Publish**
   ([enlace directo](https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules)).
5. Recargar el panel.

> **Ya está hecho.** El UID en las reglas es el de `jirigoyen@gmail.com`. Estos pasos quedan
> por si alguna vez hay que cambiar de cuenta: son esas dos líneas `.read` y volver a
> publicar. Para que sirvan dos cuentas a la vez, la comparación pasa a ser una lista:
> `auth != null && (auth.uid === 'UNO' || auth.uid === 'OTRO')`.

Mientras el UID no esté en las reglas, nadie (ni el dueño) puede leer `stats/` ni listar
`rooms/`: las reglas fallan cerradas.

Hasta que las reglas nuevas estén publicadas, cada partida deja en la consola del navegador
un `401` del `fetch` de registro: es el rechazo esperado y desaparece al publicarlas. Después
de eso, un `401` en ese `fetch` es una señal de que las reglas y el código se desalinearon.

## Archivos

```
panel/
  index.html          Pantalla de entrada y el panel. Solo en español (ver abajo)
  style.css           Lo específico del panel; el resto sale de base.css
  panel.js            Entrada con Google, lecturas en vivo y dibujo
  aggregate.js        Agregación pura (sin DOM ni Firebase)
  aggregate.test.mjs  node panel/aggregate.test.mjs
  copas.js            La Copa: copas en curso, cifras del rango y bitácora (puro, sobre el motor de la copa)
  copas.test.mjs      node panel/copas.test.mjs
  adapta.test.mjs     node panel/adapta.test.mjs — que el panel se entere solo (C-16)
assets/js/transport/
  stats.js            Registro desde los juegos y el transporte, por REST
  stats.test.mjs      node assets/js/transport/stats.test.mjs
  dispose.js          Despedida de una sala: lo que hace que una cancelada no se vea viva
  dispose.test.mjs    node assets/js/transport/dispose.test.mjs
```

`window.__panel.seed({ rooms, days, torneos, vista })` dibuja el panel con datos sembrados sin
entrar (gancho de solo lectura, C-14): sirve para probar la página sin cuenta ni base.
`node tools/e2e/mirar.mjs panel torneo` (o `resumen`, `juegos`) lo siembra con copas armadas
con el motor de verdad y abre esa vista.

## Cuando entra un juego, un modo o un idioma nuevo

**No hay que tocar el panel** (canon C-16, D-73). Esta página no tiene listas propias: los
juegos y los modos los lee de `assets/js/games.js`, los entornos de `transport/stats.js` y los
idiomas de `i18n.js`. Un juego nuevo aparece con su emoji y su nombre apenas manda su primera
señal; un modo nuevo es una línea en `MODES` de `games.js` y entra con su ícono, su color y su
lugar en la leyenda.

Lo que llega y el panel **no** conoce tampoco se pierde: se dibuja con su clave cruda por
nombre —`juego-nuevo`, un modo con `·` por ícono, un idioma que el navegador sabe nombrar—.
Pasa siempre, porque la app publicada empieza a mandar lo nuevo antes de que nadie mire el
panel, y porque lo de un juego que ya se fue del menú queda guardado igual.

- Para verlo: `node tools/e2e/mirar.mjs panel datos`, que siembra el panel con un juego, un
  modo y un idioma que no existen en el registro.
- Para que no se rompa: `node panel/adapta.test.mjs`, que falla si vuelve a aparecer una lista
  copiada en el panel o una enumeración en las reglas de la base.
- El tope de jugadores por partida sale de `MAX_PLAYERS`, derivado del juego más numeroso. Los
  roles de sala (`A`–`F`) siguen topando en seis: un juego de más de seis en dos celulares
  necesita además crecer el transporte y el patrón `$p` de las reglas.
- Lo único que obliga a tocar las reglas de Firebase y publicarlas a mano es una **categoría**
  de señal nueva (algo que no sea juego, modo, jugadores, zona horaria, idioma ni hora).

## Excepciones a los cánones

- **C-3 (idiomas):** el panel es solo en español. No es una pantalla de jugador: lo lee
  una persona, y mantener tres idiomas ahí es costo sin beneficio.
- **C-4 (sonido) y C-6 (memoria de partida):** no aplican; no es un juego.

## Qué queda fuera de esta versión

- Duración de la partida y cuántos intentos tomó: no interesa por ahora. Quién ganó sí se
  anota, desde la 0.33.6 (D-79).
- Uso real de la cuota de Firebase (conexiones, descarga): no se lee desde el navegador.
  Sigue pendiente RP-22 con Cloud Monitoring.
- Geolocalización por IP: descartada a propósito; la zona horaria alcanza.
