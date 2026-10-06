# Firebase

Proyecto: `juegos-de-salon` (plan Spark, gratuito). Creado el 2026-09-08.

> **Ojo con la cuenta.** El proyecto está a nombre de **`jbotmacmini@gmail.com`**, la cuenta de
> la máquina, que **no** es la identidad con la que se commitea (`jirigoyen@gmail.com`, GitHub
> `ellokojavi`). Entrar a la consola con la cuenta equivocada hace que el proyecto no aparezca
> en la lista, que es exactamente lo que parece una cuenta sin proyectos. Para cualquier cambio
> en la consola —reglas, Authentication, borrar datos— hay que entrar con `jbotmacmini@gmail.com`.

- **Realtime Database:** `https://juegos-de-salon-default-rtdb.firebaseio.com` (us-central1).
- **Reglas de seguridad:** [database.rules.json](database.rules.json). Son la copia de lo publicado en la consola; si se cambian, hay que volver a publicarlas en *Realtime Database → Rules*.
- **App web:** `juegos-de-salon-web`. Su configuración pública está en `public/assets/js/firebase-config.js`.
- Google Analytics y Gemini quedaron desactivados (no se necesitan).

## Publicar las reglas

Las reglas de [`database.rules.json`](database.rules.json) **no se publican solas**: no hay
deploy que las suba. Se pegan a mano y se toca *Publish*, con la cuenta dueña del proyecto
(`jbotmacmini@gmail.com`):

<https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules>

Mientras un cambio en el archivo no esté publicado, las escrituras nuevas se rechazan y nadie
se entera: el transporte y las señales de uso son mejor esfuerzo y fallan callados.

## Qué permiten las reglas

- Existen tres nodos: `rooms/<CODIGO>` (las salas), `cleanup` (la papelera que las borra) y
  `stats` (las señales de uso que lee el panel del dueño, D-44).
- El código de sala son 4 letras mayúsculas.
- Cualquiera con el código puede leer la sala.
- `createdAt`, `game` y `config` se escriben una sola vez (al crear la sala).
- **Una sala está viva mientras late** (D-89): `lastAt` es la hora del servidor de la última
  jugada, la refresca cualquiera que esté adentro y vale media hora. Pasada esa media hora —o las
  seis horas desde `createdAt`, que son el tope duro— la sala no acepta nada más. Una sala sin
  `lastAt` es de antes del latido: vale el tope de seis horas.
- `players/A` a `players/F` se pueden actualizar mientras la sala esté viva (hasta seis jugadores).
  Ahí va también `left` (booleano): la despedida de quien se fue a propósito (D-50).
- `messages/<id>` son de solo agregar (no se editan ni borran) y deben traer `t`, `from` (de A a F) y `at`.
- Una sala vencida (media hora sin latido, o más de 6 horas) puede ser borrada por cualquiera (limpieza).
- Una sala **viva** solo se puede borrar cuando todos los jugadores que están adentro tienen
  `left: true`: es la sala cancelada, que se cierra en el acto en vez de esperar a que venza.
  Una sala sin ningún jugador apuntado no se puede borrar.
- Cualquier otro campo se rechaza.
- **Solo el dueño** (su UID en las reglas) puede listar `rooms/` entero y leer `stats/`.
  Nadie más: ni con el código de una sala se llega a `stats/`.

## La Copa (`torneos`, `torneoKeys`, `torneoSeats`)

Los torneos de varios días (D-94, [docs/games/cup.md](../docs/games/cup.md)) viven en su
propio árbol porque duran una semana y las salas mueren a la media hora (D-89).

- **Necesitan el acceso anónimo de Firebase Auth** (D-96): *Authentication → Sign-in method →
  Anonymous → Enable*. Cada navegador entra anónimo, y las reglas usan su `auth.uid`.
- `torneos/<código>` (5 letras sin I ni O) lo lee quien tenga el código; `torneos/` entero, solo el dueño.
- `meta` se escribe una vez y trae las ventanas de cada día ya calculadas (`win/<d>/{a,b,h}`),
  `joinUntil` y `final`: las reglas comparan `now` contra números, no saben de zonas horarias.
- `players/<pid>` lo crea el propio jugador antes de la final; después solo lo cambia el admin.
- `started`, `results` y `wild` se escriben una sola vez, por el jugador sentado y dentro de la
  ventana de su día. El comodín, además, solo antes de `started` y nunca el día de la final.
- `torneoKeys/<código>/<pid>` guarda el hash del PIN y `torneoSeats/<código>/<pid>/<uid>` los
  celulares sentados como ese jugador. **Ninguna de las dos se puede leer**: sentarse exige mandar
  el mismo hash. El admin puede cambiar el hash y borrar los asientos (PIN nuevo).
- Las copas no se borran todavía (LIG-31).

## Publicar las reglas (D-122, D-218)

Se publican solas en cada fusión a `main`: el job `reglas` de `.github/workflows/publicar.yml`
corre `reglas.mjs publicar` con el secreto `FIREBASE_ADMIN_JSON` de GitHub, antes de publicar el
sitio. A mano, para revisar o si falta el secreto:

```bash
node tools/firebase/reglas.mjs publicar    # sube database.rules.json y verifica que quedó
node tools/firebase/reglas.mjs revisar     # ¿lo publicado es lo del repo?
```

Usa la llave de una cuenta de servicio guardada fuera del repo en
`~/.config/juegos-de-salon/firebase-admin.json` (o `FIREBASE_LLAVE=/ruta`). Se crea una vez en
[Cuentas de servicio](https://console.firebase.google.com/u/0/project/juegos-de-salon/settings/serviceaccounts/adminsdk)
→ Generar nueva clave privada. Da acceso de administrador a todo el proyecto: no se comparte, y si
se filtra se revoca ahí mismo. Sin la llave, se sigue pudiendo pegar a mano en la consola.

## La Copa: inscripción cerrada e inicio movible (D-110)

- `torneos/<code>/closed` (`true` o nada): solo lo escribe el celular sentado como admin. Con la
  copa cerrada, las reglas no dejan crear jugadores nuevos.
- `torneos/<code>/meta` se escribe al crear y, después, **solo el admin puede reescribirlo** para
  mover el inicio: sin ningún `started`, con el mismo nombre, días, calendario, admin y
  `createdAt`, y con la ventana del día 1 todavía abierta y empezando antes de 32 días.
- Una copa del laboratorio (`meta/lab = true`, D-115) se puede reescribir aunque ya se haya
  jugado: así su admin la pasa al día siguiente. La marca `lab` no se puede quitar ni poner después.
- `torneos/<code>/meta/name` lo puede cambiar solo el admin, en cualquier momento antes de que la
  copa termine (`now < meta/end`), con el mismo largo de 1 a 40 (D-148).

- `torneos/<code>/fin` (D-161): la hora del servidor en que el admin terminó la copa antes. Solo lo
  escribe el celular sentado como admin, **una vez**, con la copa ya partida y sin terminar. Desde ahí
  las reglas no dejan escribir `started`, `results` ni `wild`, inscribirse, renombrar la copa ni
  reescribir `meta`.

- **Eliminar la copa** (D-117): el celular sentado como admin puede borrar de una vez
  `torneos/<code>`, `torneoKeys/<code>` y `torneoSeats/<code>` (solo el nodo entero, nunca a medias).

## La Copa: el link propio (`torneoAlias`, D-121)

`torneoAlias/<alias>` = `{ code, hasta }`. Se lee sin cuenta (solo dice a qué código apunta). Se
escribe si no existe, si venció (`hasta < now`) o si apunta a la misma copa, y siempre por el
admin de esa copa y con `meta/alias` igual al alias; se borra solo por ese admin. `hasta` es el fin
de la copa más 7 días.

## Jugadores y rankings (`jugadores`, `jugadorKeys`, `jugadorSeats`, `jugadorNombres`, `jugadorCopas`, `records`, `torneoPodios`, D-212)

El mismo mecanismo que La Copa, para toda la app:

- `jugadores/<jid>` = `{ n, at, juegos: { <juego>: { n, at } } }`. Se lee sin cuenta por jid (no se
  lista). Se crea una vez, con el asiento en la misma escritura; `juegos/<juego>/n` solo sube de a uno.
- `jugadorKeys/<jid>`: sha256 del PIN. Nadie lo lee. Se crea con el jugador; lo cambia quien está sentado.
- `jugadorSeats/<jid>/<uid>`: el celular `uid` escribe por `jid` si trae el hash de `jugadorKeys`.
  Quien está sentado puede reemplazar todos los asientos (cambiar el PIN saca a los demás).
- `jugadorNombres/<clave>/<jid>` = `true`: quiénes usan ese nombre. Se lee por clave, para entrar.
- `records/<tabla>/<período>/<jid>` = `{ s, ms, k, at, n }`, con `.indexOn: k`. Se lee sin cuenta.
  Escribe solo el jugador sentado, con `k` recalculado, `n` igual a su nombre y `k` menor que el
  guardado. La tabla y el período se validan por forma, sin nombrar juegos (C-16). Una tabla que
  termina en `_victorias` (D-215), y la de `partidas` (D-219), además exige `ms` = 0 y que `s` suba
  exactamente de a uno. Cada fila puede llevar `co`, el país del jugador (dos letras, D-219).
- `jugadores/<jid>/co`: el país del jugador, una vez, por quien está sentado (D-219).
- `torneoPodios/<código>`: el podio de una copa terminada, con `.indexOn: end`. Se lee sin cuenta.
  Lo escribe una vez alguien sentado en esa copa (`por`), con la copa terminada, sin `lab`, y con
  los nombres y `j` que la copa tiene.
- `torneos/<código>/players/<pid>/j`: el jugador de los rankings detrás del de la copa. Lo escribe
  quien está sentado como los dos.
- `jugadorCopas/<jid>/<código>` = `{ p, at }`: las copas del jugador, para "Tus copas" en cualquier
  celular (D-220). Solo la leen sus celulares. La escribe quien está sentado como el jugador y como
  `p` en la copa, con `players/<p>/j` igual al jugador; la borra quien está sentado como el jugador.

Un **jugador heredado** (`jugadores/<jid>.legado = true`, de la historia de La Copa) no tiene
PIN: `jugadorKeys/<jid>` se puede crear para él, una vez, y quien lo reclama borra `legado` en la
misma escritura, sentado con ese PIN. Los carga `node tools/firebase/rankings-historia.mjs --escribir`.

El dueño (su UID) puede escribir y borrar en todas estas ramas, para moderar.

## Uno al día (`unoAlDia`, `invitados`, D-230)

- `unoAlDia/<jid>/<n>` = `{ j, s, ms, at, w? }`: el primer intento de Uno al día del día `n` (días
  desde 1970). Lo escribe una vez quien está sentado como ese jugador; `w` (la marca de que ya se
  sumó a la semana) se agrega una vez. La lee cualquiera.
- `invitados/<jid>/<uid>` = `{ d, at, j? }`: el celular `uid` terminó su primer Uno al día con una
  invitación de `jid`. Lo escribe ese celular, una vez, y no si está sentado como `jid`. Solo lo lee
  el jugador `jid`.
- En `records`, el período puede ser también un día (`d20731`). Para la tabla `uno-al-dia`, el
  puntaje del día tiene que ser el de su historia, y la semana suma un día de la historia (`u`) que
  todavía no tenía `w`. Detalle y límites en [docs/UNO-AL-DIA.md](../docs/UNO-AL-DIA.md).
- El dueño lee `unoAlDia/` e `invitados/` enteros, para el bloque de Uno al día del panel.

## Avisos al celular (`push`, `pushCopa`, `pushEnviados`, `pushDia`, `pushEnviadosDia`, D-223, D-224, D-230)

- `push/<subId>` = `{ endpoint, keys: { p256dh, auth }, lang, tz, uid, at }`: la suscripción Web
  Push de un celular. `subId` son 32 caracteres hexadecimales (los primeros del sha256 del
  endpoint). **Nadie la lee**: solo la cuenta de servicio que manda los avisos (`tools/push/avisar.mjs`, D-224), que no pasa por
  las reglas. La escribe y la borra solo el celular de ese `uid`, con la forma validada (`endpoint`
  https, `lang` entre los cuatro idiomas, `at` no posterior a la hora del servidor).
- `pushCopa/<código>/<pid>/<subId>` = `{ dia, plazo, at }`: qué avisos quiere ese jugador en esa
  copa. Nadie la lee. La escribe quien está sentado como el jugador, y solo con una suscripción
  suya (`push/<subId>/uid`, que puede ir en la misma escritura); la borra quien está sentado como
  el jugador ("Silenciar esta copa"). Quien está sentado como el admin borra `pushCopa/<código>`
  entera, y solo entera, al eliminar la copa.
- `pushEnviados/<código>/<subId>/<clave>` = la hora en que se entregó ese aviso (`dia:3`,
  `plazo:3`, `final`, `fin`, `insc:<pid>`), para no repetirlo. Nadie la lee ni la escribe: solo
  `tools/push/avisar.mjs`, con la cuenta de servicio (D-224), que también la limpia.
- `pushDia/<subId>` = `{ h, d, r, w, u, c, k, m, sp, sn, at }`: lo que pidió ese celular de los avisos
  de Uno al día (la hora `h`, de 0 a 23, y si quiere el diario, el de la racha y el de la semana) y,
  para el texto, su último día jugado `u`, su racha, comodines (0 a 2) y mejor racha, y la semana de
  ese día con cuántos días jugó (D-230). Nadie lo lee; lo escribe el celular cuya identidad
  (`auth.uid`) es la de `push/<subId>/uid`, que puede ir en la misma escritura. Cualquier otro campo
  se rechaza.
- `pushEnviadosDia/<subId>/<clave>` = hora de entrega (`dia:<n>`, `racha:<n>`, `semana:<s>`, `adios`):
  los escribe y limpia solo `tools/push/avisar.mjs`, con la cuenta de servicio.
- Aquí el dueño no tiene excepción: su UID no lee ni escribe estas ramas.

## Reportes (`feedback`)

El botón 🐞 de La Copa (D-101, D-104) escribe en `feedback/<id>` **por REST y sin cuenta**:
`texto` (hasta 1000 caracteres), `nombre` opcional, `contexto` (JSON, hasta 500), `v` y `at` del
servidor. Se escribe una sola vez y **se lee sin cuenta**: `node tools/firebase/reportes.mjs` los muestra
(`--dias 3` para los recientes). No llevan PIN ni datos de la cuenta.

## La papelera (`cleanup`)

Nadie borra su sala al terminar de jugar, así que los mismos celulares que juegan hacen el aseo
(D-39, canon C-7). El plan gratuito no tiene Cloud Functions: no hay dónde correr un cron.

```
cleanup/
  sweptDay: 20341            día ya barrido (marca de agua pública)
  days/20342/
    lastAt: 1757500000000    marca del último apunte, con el reloj del servidor
    rooms/ABCD: true         códigos creados ese día
```

- Al crear o entrar a una sala se apunta su código en el balde de su día (`lastAt` se pisa con
  la hora del servidor). Los códigos solo se agregan: no se pisan ni se editan.
- **Un balde solo se puede leer y borrar 6 horas después de su último apunte.** Esa es la
  condición que hace que la papelera nunca delate una sala viva: cuando se abre, todas las
  salas que nombra ya vencieron, porque ninguna pasa de seis horas (D-89). Por eso `rooms/` sigue sin poder listarse.
- Barrer es leer los baldes de los días anteriores a hoy, borrar esas salas y borrar el balde.
  Lo hace un celular cada vez que crea o entra a una sala, como mucho una vez cada 6 horas.
- `sweptDay` evita repetir trabajo, pero cualquiera puede adelantarla (solo hacia adelante y
  nunca más allá de hoy), así que el barrido siempre repasa los últimos 8 días igual.

Lógica y tests: [`public/assets/js/transport/cleanup.js`](../public/assets/js/transport/cleanup.js) ·
`node public/assets/js/transport/cleanup.test.mjs`.

## La despedida (`left`)

La papelera es la puerta de atrás: recién puede tocar una sala cuando venció. La de adelante
es la despedida (D-50, canon C-7): quien se va **a propósito** —cancela la sala en el lobby,
se sale, cambia de modo, se muda a la sala de la revancha— escribe `left: true` en su rol y,
si al releer no queda nadie sin despedirse, borra la sala en el acto.

- `online: false` no alcanza: eso es quedarse sin señal o cerrar la pestaña, y esa partida se
  puede retomar mientras la sala viva (C-6). Al reconectar, `left` vuelve a `false`.
- Son dos escrituras y en ese orden, porque las reglas miran la sala **antes** del borrado.
- La regla enumera los seis roles: las reglas de Firebase no saben recorrer hijos.

Lógica y tests: [`public/assets/js/transport/dispose.js`](../public/assets/js/transport/dispose.js) ·
`node public/assets/js/transport/dispose.test.mjs`.

> **Una sola vez, al publicar esto:** las salas creadas antes de la papelera no están apuntadas
> en ningún balde y nadie las va a barrer. Se borran a mano desde *Realtime Database → Datos*,
> eliminando el nodo `rooms` completo (no hay partidas en curso que valgan más de 6 horas).

## Las señales de uso (`stats`)

Lo que los juegos apuntan para el panel del dueño ([docs/PANEL.md](../docs/PANEL.md)),
por entorno (`prod`, `lab`, `dev`) y por día:

```
stats/prod/days/20342/
  rooms/ABCD: { game, at, v, players: { A: "Javi", B: "Cata" } }   dos celulares
  local/toque-y-fama/cpu/1: 7          partidas sin red: juego / modo / jugadores → cuántas
  origin/America__Santiago: 12         celulares que empezaron o entraron a una partida
  lang/es-CL: 12                      idioma del navegador
  applang/en: 4                       idioma elegido en el juego (D-46)
  hour/21: 5                           hora local del celular
  aviso/dia: 3                         avisos de La Copa tocados, por tipo (D-233)
  pwa/android: 2                       aperturas desde la app instalada (?pwa), por sistema
  mandados/plazo: 4                    avisos entregados, por tipo: solo los escribe avisar.mjs
stats/prod/push: { vuelta, vivas, torneos }   la última vuelta de avisar.mjs y cuántas suscripciones siguen vivas
```

- `rooms/<CÓDIGO>` se crea una sola vez; cada `players/<rol>` también. Nada se edita ni se borra.
- Los contadores solo aceptan **subir exactamente en uno**: los celulares mandan
  `{".sv": {"increment": 1}}` por REST y las reglas rechazan cualquier otro valor.
- La zona horaria va con `__` en vez de `/` (`America__Sao_Paulo`), porque la barra no
  puede ir en una clave y el guion bajo ya lo usan los nombres.
- `stats/` no entra en la papelera: son unos cientos de bytes por partida.
- **Las claves se validan por forma, no por lista** (canon C-16, D-73): el juego
  (`^[a-z-]{1,40}$`), el modo (`^[a-z][a-z-]{0,15}$`, la misma forma que `MODE_KEY` en
  `public/assets/js/games.js`), la cantidad de jugadores (`^[1-9][0-9]?$`) y el entorno
  (`^[a-z]{2,10}$`). Así un juego o un modo nuevo empieza a contarse el día que sale
  publicado, sin tener que acordarse de venir a republicar las reglas. Una lista acá rechaza
  la señal en el servidor, la partida ni se entera y el dato no existe nunca más.
- Lo que **sí** obliga a tocar las reglas: una categoría de señal nueva (cualquier cosa que no
  sea `rooms`, `local`, `origin`, `lang`, `applang` o `hour`), porque `$other` las rechaza.
- Los avisos (D-233): `aviso/<tipo>` y `pwa/<sistema>` los suben los celulares, en uno; la clave
  se valida por forma (`^[a-z]{1,12}$`), y la lista de tipos vive en `stats.js` (`TIPOS_AVISO`).
  `mandados/<tipo>` y `stats/<env>/push` no los escribe ningún celular: solo `avisar.mjs`, con la
  cuenta de servicio, que no pasa por las reglas.

Módulo y tests: [`public/assets/js/transport/stats.js`](../public/assets/js/transport/stats.js) ·
`node public/assets/js/transport/stats.test.mjs` · `node public/panel/adapta.test.mjs` (compara la forma de
las reglas con la del código).

## El panel: Authentication y el UID del dueño (una sola vez)

**Acá se cruzan dos cuentas y el orden importa.** El trabajo de consola va con la cuenta dueña
del proyecto (`jbotmacmini@gmail.com`); el UID que va en las reglas es el de la cuenta con la
que se quiere *mirar* el panel (`jirigoyen@gmail.com`). Son distintas a propósito: la regla
compara el UID de Firebase Authentication, no el permiso de Google Cloud, así que para pasar la
regla no hace falta ser propietario del proyecto.

La consola de Firebase de esta cuenta está **en inglés**, así que los nombres de abajo van
como aparecen en pantalla. Traducirlos al español manda a buscar menús que no existen.

1. Con `jbotmacmini@gmail.com`: **Authentication → Sign-in method → Google → Enable.**
   Pide un *Support email for project*: sirve la misma cuenta dueña.
2. Con `jbotmacmini@gmail.com`: **Authentication → Settings → Authorized domains → Add
   domain:** agregar `juegosdesalon.cl`, que es donde vive el sitio. No sirve autorizar
   `ellokojavi.github.io`: redirige con un 301 y el acceso con Google ocurre en el
   dominio final.
3. Entrar a `/panel/` **con `jirigoyen@gmail.com`**: como las reglas todavía no conocen ese
   UID, la página lo muestra en pantalla en vez de dejar pasar.
4. Poner ese UID en las dos líneas `.read` de [database.rules.json](database.rules.json)
   (`rooms` y `stats`) y publicar las reglas con `jbotmacmini@gmail.com` en
   *Realtime Database → Rules → Publish*.

**Los pasos 1 a 4 ya están hechos**, con el UID de `jirigoyen@gmail.com`. Quedan escritos por
si hay que cambiar de cuenta alguna vez. El UID no es un secreto: no sirve para entrar a
ninguna parte, solo dice qué usuario ya autenticado puede leer.

Mientras el UID no esté, las reglas fallan cerradas: nadie lee `stats/` ni lista `rooms/`.
Los jugadores no se autentican nunca; activar Google no les cambia nada.

Si algún día hacen falta dos cuentas, la regla deja de ser una comparación y pasa a ser una
lista: `auth != null && (auth.uid === 'UNO' || auth.uid === 'OTRO')`, en los dos lugares.

> **Dos propietarios, a propósito.** El proyecto lo creó `jbotmacmini@gmail.com`, una cuenta
> de máquina, y durante un tiempo fue la única propietaria: perder su acceso habría sido
> perder la base de datos de la app publicada. Desde el 2026-09-11 `jirigoyen@gmail.com`
> también es *Propietario* en
> [IAM](https://console.cloud.google.com/iam-admin/iam?project=juegos-de-salon). Si alguna vez
> queda una sola de nuevo, vale la pena volver a sumar la segunda.
>
> Ser propietario en IAM y poder entrar al panel son cosas distintas: el panel compara el UID
> de Authentication, no el permiso de IAM. Agregar un propietario **no** le da acceso al panel,
> y quitarlo no se lo saca.

## Probar las reglas por REST

```bash
DB=https://juegos-de-salon-default-rtdb.firebaseio.com
NOW=$(($(date +%s)*1000))
# la sala y el jugador van en dos pasos: las reglas de `players/` miran el `createdAt` que ya
# está en la base, así que en una sola escritura todavía no existe y se rechaza
curl -X PATCH "$DB/rooms/ABCD.json" -d "{\"createdAt\":$NOW,\"game\":\"toque-y-fama\",\"config\":{\"digits\":4}}"
curl -X PUT "$DB/rooms/ABCD/players/A.json" -d '{"name":"Javi","online":true}'

# apuntar la sala en la papelera (debe pasar) y tratar de abrir el balde (debe fallar: recién apuntado)
DAY=$((NOW/86400000))
curl -X PATCH "$DB/cleanup/days/$DAY.json" -d "{\"lastAt\":$NOW,\"rooms/ABCD\":true}"
curl "$DB/cleanup/days/$DAY.json"   # -> Permission denied

# borrar la sala viva sin despedirse (debe fallar), despedirse y volver a borrar (debe pasar)
curl -X DELETE "$DB/rooms/ABCD.json"                                           # -> Permission denied
curl -X PATCH "$DB/rooms/ABCD/players/A.json" -d '{"online":false,"left":true}'
curl -X DELETE "$DB/rooms/ABCD.json"                                           # -> null

# señales de uso: subir un contador de a uno (debe pasar), pisarlo con otro valor (debe fallar), leer (debe fallar)
curl -X PATCH "$DB/stats/dev/days/$DAY.json" -d '{"local/toque-y-fama/cpu/1":{".sv":{"increment":1}},"origin/America__Santiago":{".sv":{"increment":1}}}'
curl -X PUT "$DB/stats/dev/days/$DAY/local/toque-y-fama/cpu/1.json" -d '50'   # -> Permission denied
curl "$DB/stats/dev/days/$DAY.json"                                            # -> Permission denied
```

## Cuotas y límites del plan Spark

La app es estática: no hay servidor propio, así que lo multijugador entero depende de esta
base. El techo no viene del diseño estático sino del plan gratuito:

| Recurso | Tope habitual | Qué significa jugando |
|---|---|---|
| Conexiones simultáneas | ~100 | ≈50 partidas de dos celulares, ≈16 de seis |
| Descarga | ~10 GB/mes | |
| Almacenamiento | 1 GB | Poco relevante desde D-39: la papelera borra lo vencido |

**No hay alerta de facturación que poner: el plan Spark no tiene facturación.** Pasado el
tope, Firebase rechaza conexiones nuevas y el jugador no puede entrar a la sala; no se
degrada con elegancia, se cae. Desde v0.18 al menos se le dice al jugador (D-40).

Confirmar los números en la consola antes de fijar umbrales: Google los ha cambiado.

### Vigilarlo (RP-22, pendiente)

1. **Firebase Console → Realtime Database → Uso**: línea base de conexiones, almacenamiento
   y descarga con el tráfico real.
2. **Google Cloud Monitoring** (el proyecto Firebase ya es proyecto GCP): política de alerta
   sobre conexiones activas de RTDB, umbral ~80 de 100, notificando por correo.

### Si el uso crece de verdad

El tope de salas por celular (D-41) ataja el abuso accidental, no al decidido: quien quiera
abusar le pega a la REST API con `curl`. Lo único que cierra esa puerta es **autenticación
anónima** (`signInAnonymously`) con reglas que exijan `auth != null`, que además permitiría
reglas por usuario en vez de "cualquiera con el código". Es otro modelo de seguridad y
merece su propia decisión; el paso a Blaze resuelve el techo pero abre la puerta a una
boleta por abuso, así que pide tope de gasto.
