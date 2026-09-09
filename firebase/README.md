# Firebase

Proyecto: `juegos-de-salon` (plan Spark, gratuito). Creado el 2026-09-08 con la cuenta del dueño del repo.

- **Realtime Database:** `https://juegos-de-salon-default-rtdb.firebaseio.com` (us-central1).
- **Reglas de seguridad:** [database.rules.json](database.rules.json). Son la copia de lo publicado en la consola; si se cambian, hay que volver a publicarlas en *Realtime Database → Rules*.
- **App web:** `juegos-de-salon-web`. Su configuración pública está en `assets/js/firebase-config.js`.
- Google Analytics y Gemini quedaron desactivados (no se necesitan).

## Qué permiten las reglas

- Solo existe el nodo `rooms/<CODIGO>` con código de 4 letras mayúsculas.
- Cualquiera con el código puede leer la sala.
- `createdAt`, `game` y `config` se escriben una sola vez (al crear la sala).
- `players/A` y `players/B` se pueden actualizar mientras la sala tenga menos de 6 horas.
- `messages/<id>` son de solo agregar (no se editan ni borran) y deben traer `t`, `from` (A o B) y `at`.
- Una sala con más de 6 horas puede ser borrada por cualquiera (limpieza).
- Cualquier otro campo se rechaza.

## Probar las reglas por REST

```bash
DB=https://juegos-de-salon-default-rtdb.firebaseio.com
NOW=$(($(date +%s)*1000))
curl -X PATCH "$DB/rooms/ABCD.json" -d "{\"createdAt\":$NOW,\"game\":\"toque-y-fama\",\"config\":{\"digits\":4},\"players/A\":{\"name\":\"Javi\"}}"
```
