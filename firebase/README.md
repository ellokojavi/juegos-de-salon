# Firebase

Proyecto: `juegos-de-salon` (plan Spark, gratuito). Creado el 2026-09-08.

> **Ojo con la cuenta.** El proyecto está a nombre de **`jbotmacmini@gmail.com`**, la cuenta de
> la máquina, que **no** es la identidad con la que se commitea (`jirigoyen@gmail.com`, GitHub
> `ellokojavi`). Entrar a la consola con la cuenta equivocada hace que el proyecto no aparezca
> en la lista, que es exactamente lo que parece una cuenta sin proyectos. Para cualquier cambio
> en la consola —reglas, Authentication, borrar datos— hay que entrar con `jbotmacmini@gmail.com`.

- **Realtime Database:** `https://juegos-de-salon-default-rtdb.firebaseio.com` (us-central1).
- **Reglas de seguridad:** [database.rules.json](database.rules.json). Son la copia de lo publicado en la consola; si se cambian, hay que volver a publicarlas en *Realtime Database → Rules*.
- **App web:** `juegos-de-salon-web`. Su configuración pública está en `assets/js/firebase-config.js`.
- Google Analytics y Gemini quedaron desactivados (no se necesitan).

## Qué permiten las reglas

- Existen tres nodos: `rooms/<CODIGO>` (las salas), `cleanup` (la papelera que las borra) y
  `stats` (las señales de uso que lee el panel del dueño, D-44).
- El código de sala son 4 letras mayúsculas.
- Cualquiera con el código puede leer la sala.
- `createdAt`, `game` y `config` se escriben una sola vez (al crear la sala).
- `players/A` a `players/F` se pueden actualizar mientras la sala tenga menos de 6 horas (hasta seis jugadores).
- `messages/<id>` son de solo agregar (no se editan ni borran) y deben traer `t`, `from` (de A a F) y `at`.
- Una sala con más de 6 horas puede ser borrada por cualquiera (limpieza).
- Cualquier otro campo se rechaza.
- **Solo el dueño** (su UID en las reglas) puede listar `rooms/` entero y leer `stats/`.
  Nadie más: ni con el código de una sala se llega a `stats/`.

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
  salas que nombra ya vencieron. Por eso `rooms/` sigue sin poder listarse.
- Barrer es leer los baldes de los días anteriores a hoy, borrar esas salas y borrar el balde.
  Lo hace un celular cada vez que crea o entra a una sala, como mucho una vez cada 6 horas.
- `sweptDay` evita repetir trabajo, pero cualquiera puede adelantarla (solo hacia adelante y
  nunca más allá de hoy), así que el barrido siempre repasa los últimos 8 días igual.

Lógica y tests: [`assets/js/transport/cleanup.js`](../assets/js/transport/cleanup.js) ·
`node assets/js/transport/cleanup.test.mjs`.

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
  lang/es-CL: 12
  hour/21: 5                           hora local del celular
```

- `rooms/<CÓDIGO>` se crea una sola vez; cada `players/<rol>` también. Nada se edita ni se borra.
- Los contadores solo aceptan **subir exactamente en uno**: los celulares mandan
  `{".sv": {"increment": 1}}` por REST y las reglas rechazan cualquier otro valor.
- La zona horaria va con `__` en vez de `/` (`America__Sao_Paulo`), porque la barra no
  puede ir en una clave y el guion bajo ya lo usan los nombres.
- `stats/` no entra en la papelera: son unos cientos de bytes por partida.

Módulo y tests: [`assets/js/transport/stats.js`](../assets/js/transport/stats.js) ·
`node assets/js/transport/stats.test.mjs`.

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

> **El proyecto cuelga de una sola cuenta.** `jbotmacmini@gmail.com` es hoy la única
> propietaria, y es una cuenta de máquina. Perder su acceso es perder la base de datos de la
> app publicada. Conviene agregar `jirigoyen@gmail.com` como *Propietario* en
> [IAM](https://console.cloud.google.com/iam-admin/iam?project=juegos-de-salon), aunque el
> panel no lo necesite para funcionar.

## Probar las reglas por REST

```bash
DB=https://juegos-de-salon-default-rtdb.firebaseio.com
NOW=$(($(date +%s)*1000))
curl -X PATCH "$DB/rooms/ABCD.json" -d "{\"createdAt\":$NOW,\"game\":\"toque-y-fama\",\"config\":{\"digits\":4},\"players/A\":{\"name\":\"Javi\"}}"

# apuntar la sala en la papelera (debe pasar) y tratar de abrir el balde (debe fallar: recién apuntado)
DAY=$((NOW/86400000))
curl -X PATCH "$DB/cleanup/days/$DAY.json" -d "{\"lastAt\":$NOW,\"rooms/ABCD\":true}"
curl "$DB/cleanup/days/$DAY.json"   # -> Permission denied

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
