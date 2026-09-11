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
