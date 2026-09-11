# Firebase

Proyecto: `juegos-de-salon` (plan Spark, gratuito). Creado el 2026-09-08 con la cuenta del dueño del repo.

- **Realtime Database:** `https://juegos-de-salon-default-rtdb.firebaseio.com` (us-central1).
- **Reglas de seguridad:** [database.rules.json](database.rules.json). Son la copia de lo publicado en la consola; si se cambian, hay que volver a publicarlas en *Realtime Database → Rules*.
- **App web:** `juegos-de-salon-web`. Su configuración pública está en `assets/js/firebase-config.js`.
- Google Analytics y Gemini quedaron desactivados (no se necesitan).

## Qué permiten las reglas

- Existen dos nodos: `rooms/<CODIGO>` (las salas) y `cleanup` (la papelera que las borra).
- El código de sala son 4 letras mayúsculas.
- Cualquiera con el código puede leer la sala.
- `createdAt`, `game` y `config` se escriben una sola vez (al crear la sala).
- `players/A` a `players/F` se pueden actualizar mientras la sala tenga menos de 6 horas (hasta seis jugadores).
- `messages/<id>` son de solo agregar (no se editan ni borran) y deben traer `t`, `from` (de A a F) y `at`.
- Una sala con más de 6 horas puede ser borrada por cualquiera (limpieza).
- Cualquier otro campo se rechaza.

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

## Probar las reglas por REST

```bash
DB=https://juegos-de-salon-default-rtdb.firebaseio.com
NOW=$(($(date +%s)*1000))
curl -X PATCH "$DB/rooms/ABCD.json" -d "{\"createdAt\":$NOW,\"game\":\"toque-y-fama\",\"config\":{\"digits\":4},\"players/A\":{\"name\":\"Javi\"}}"

# apuntar la sala en la papelera (debe pasar) y tratar de abrir el balde (debe fallar: recién apuntado)
DAY=$((NOW/86400000))
curl -X PATCH "$DB/cleanup/days/$DAY.json" -d "{\"lastAt\":$NOW,\"rooms/ABCD\":true}"
curl "$DB/cleanup/days/$DAY.json"   # -> Permission denied
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
