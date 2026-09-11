# Panel del dueño

Página privada en `/panel/` que muestra cuánto y desde dónde se juega. Son **señales de
uso, no personas**: sirven para ver qué juegos gustan, cuántos jugadores se juntan y a
qué horas, no para identificar a nadie (D-44).

- Publicado: `https://juegosdesalon.cl/panel/`
- Local: `http://localhost:8765/panel/`

No aparece en el menú ni se indexa. El código es público como todo el repo: lo que protege
los datos son las reglas de Firebase, que solo dejan leer al UID del dueño.

## Qué se ve

| Sección | Qué muestra | De dónde sale |
|---|---|---|
| **Ahora** | Salas en juego, celulares conectados, salas de las últimas 6 h, juegos en curso. Lista de salas con código, juego, nombres, quién está conectado, mensajes y última jugada. Solo las del entorno elegido (D-45). | `rooms/` en vivo (índice por `createdAt`), cruzado por código con `stats/<env>` |
| **Últimos 7 / 30 días** | Partidas totales, en dos celulares, sin red, celulares que jugaron, partidas de hoy. | `stats/<env>/days/<día>` |
| **Partidas por juego** | Barra por juego, partida por modo: 📡 dos celulares, 📱 un celular, 🤖 contra el celular, 🧍 solo. | `rooms` (📡) y `local/<juego>/<modo>/<n>` |
| **Jugadores por partida** | Cuántas partidas de 1, 2, … 6 jugadores. | `n` de los contadores sin red y cantidad de nombres de cada sala |
| **Por día** | Partidas por día, separando dos celulares del resto. | ídem |
| **De dónde** | Zona horaria del celular (ciudad y región). Cuenta celulares que empezaron o entraron a una partida, no partidas. | `origin/<zona>` |
| **Idioma del navegador** | `es-CL`, `pt-BR`, … | `lang/<idioma>` |
| **A qué hora se juega** | Hora local de cada celular, 0 a 23. | `hour/<h>` |
| **Cuota** | Enlace a la consola de uso de Firebase. Los "celulares conectados" son la mejor aproximación a las conexiones simultáneas del plan gratuito. | — |

**Celulares conectados** cuenta los jugadores con `online: true` en salas vivas. Los modos
sin red no abren conexión (mandan un solo `fetch`), así que no aparecen ahí ni gastan cuota.

**Entorno**: el selector separa lo publicado (`prod`), el laboratorio (`lab`) y las pruebas
en `localhost` (`dev`). Las pruebas de punta a punta pegan contra Firebase de verdad y caen
en `dev`, así que no ensucian las cifras reales.

Vale también para la lista de "Ahora", aunque ahí cueste un rodeo: `rooms/` es el nodo real
del transporte y es uno solo para todos los entornos, así que una partida de prueba abre una
sala tan real como la de un jugador. El panel cruza cada sala viva por código contra lo que
`stats/<env>` registró hoy y ayer, y las que quedan fuera las nombra debajo de la lista en vez
de esconderlas: si una sala real no alcanzó a registrarse, tiene que poder verse (D-45).

## Qué se registra y qué no

Sale del celular, por día y por entorno (`assets/js/transport/stats.js`):

- **Dos celulares:** `rooms/<CÓDIGO>` con juego, hora del servidor, versión de la app y los
  nombres de quienes entraron (`players/A..F`). Esos nombres ya viajan a la sala para que
  el rival los vea; acá solo los lee el dueño.
- **Un celular, contra el celular, solo:** un contador por juego, modo y cantidad de
  jugadores. **Ningún nombre.**
- **Cualquier modo:** contador de zona horaria, idioma del navegador y hora local.

No sale nunca: dirección IP (no hay servidor que la vea y no se consulta a nadie), los
secretos de las partidas, el chat, quién ganó, ni el nombre de nadie en los modos sin red.
Todo es mejor esfuerzo: si el envío falla, nadie se entera y la partida sigue igual.

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
   publicar las reglas en **Realtime Database → Rules → Publish**.
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
assets/js/transport/
  stats.js            Registro desde los juegos y el transporte, por REST
  stats.test.mjs      node assets/js/transport/stats.test.mjs
```

`window.__panel.seed({ rooms, days })` dibuja el panel con datos sembrados sin entrar
(gancho de solo lectura, C-14): sirve para probar la página sin cuenta ni base.

## Excepciones a los cánones

- **C-3 (idiomas):** el panel es solo en español. No es una pantalla de jugador: lo lee
  una persona, y mantener dos idiomas ahí es costo sin beneficio.
- **C-4 (sonido) y C-6 (memoria de partida):** no aplican; no es un juego.

## Qué queda fuera de esta versión

- Resultado y duración de la partida (quién ganó, cuántos intentos): no interesa por ahora.
- Uso real de la cuota de Firebase (conexiones, descarga): no se lee desde el navegador.
  Sigue pendiente RP-22 con Cloud Monitoring.
- Geolocalización por IP: descartada a propósito; la zona horaria alcanza.
