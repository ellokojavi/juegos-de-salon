# App instalable y avisos al celular (PWA + Web Push)

**Estado:** aprobado por el dueño (D-221); el PR 1 está hecho (v0.105.0) · **Fecha:** 2026-10-05 ·
**Toca:** RP-11, RP-13, LIG-33, D-99

Es el detalle de D-221, que **corrige a D-99** en lo que dice de los avisos automáticos. El diseño de
las pantallas está dibujado en un lienzo aparte (privado del dueño), que el dueño aprobó con un
cambio: las hojas y las tarjetas van sobre el morado oscuro de la app (como la hoja del chat,
`.chat-panel`), no sobre fondo claro.

## En corto

Sí se puede, y **sin servidor pagado ni cuentas nuevas**:

1. La app ya es instalable a medias: tiene `manifest.webmanifest` (RP-11), pero sin service worker
   ni íconos PNG. Falta eso para que Android ofrezca "Instalar" y para que el celular reciba avisos.
2. Los avisos usan **Web Push**, el estándar de los navegadores. Mandarlos es gratis: el que
   reparte es el servicio del propio navegador (Google en Android/Chrome, Apple en iPhone, Mozilla
   en Firefox). No hay proveedor que pagar.
3. El "servidor" que decide **cuándo** avisar es un **workflow programado de GitHub Actions**
   (cada 15 minutos), con la llave de la cuenta de servicio que ya está en los secretos
   (`FIREBASE_ADMIN_JSON`, D-218). Lee la base, ve a quién le toca un aviso y lo manda.
4. Las suscripciones se guardan en Realtime Database, en una rama que **nadie puede leer** salvo
   el administrador, igual que `torneoKeys`.

D-99 descartó los avisos porque "necesitan un servidor y un proveedor pago". Con Web Push y
GitHub Actions no hace falta ninguno de los dos.

## Lo que hay que saber de cada celular

| | Android (Chrome, Edge, Samsung, Firefox) | iPhone / iPad |
|---|---|---|
| Recibir avisos | Desde el navegador, sin instalar | **Solo con la app agregada a la pantalla de inicio**, desde Safari, iOS 16.4 o más |
| Pedir permiso | Tras un toque del usuario | Tras un toque del usuario, y dentro de la app instalada |
| Instalar | El navegador ofrece "Instalar app" si hay manifest + service worker + ícono PNG | A mano: Compartir → "Agregar a inicio". No hay botón automático |
| Service worker | Obligatorio | Obligatorio hasta iOS 18.3; desde iOS 18.4 existe *Declarative Web Push*, que no lo necesita |

| Lo que guarda la app | Compartido entre el navegador y la app instalada | **Separado**: la app instalada empieza sin nada de lo que había en Safari |

Consecuencia de diseño: en iPhone los avisos **no se pueden activar en la pestaña de Safari**, y la
app instalada no sabe quién es el jugador. Los dos problemas se resuelven en la experiencia del
jugador (abajo). Se detecta con `navigator.standalone` y `matchMedia('(display-mode: standalone)')`.

## Qué avisos, y por qué esos

El enganche verdadero de la app es **La Copa**: un torneo de una semana, un juego por día, con día
de gracia. Hoy depende de que el admin se acuerde de compartir el recordatorio (D-99). Es el caso
perfecto para un aviso: hay una fecha, hay algo pendiente y le importa a la persona.

| Aviso | Cuándo | A quién | Ejemplo |
|---|---|---|---|
| **Se abrió el día** | Entre 9:00 y 10:00 del jugador (no a las 00:00) | Inscritos que activaron avisos | "🔗 Día 3: Conexiones. Ya puedes jugar." |
| **Se te acaba el plazo** | Unas 4 horas antes de que cierre el día (el de gracia, o la final) | Solo a quien **no** ha jugado ese día | "⏳ Te quedan 4 horas para jugar el día 3. Si no lo juegas, son 0 puntos." |
| **Terminó la copa** | Al cerrar (o al terminarla el admin, D-161) | Todos los inscritos con avisos | "🥇 Ganó Ana. Quedaste 2.°." |
| **La Gran Final** | En la mañana del último día, en vez de "se abrió el día" | Inscritos con avisos | "🏁 Hoy es La Gran Final y vale doble. Vas 2.°, a 3 puntos de Ana." |
| Alguien se inscribió | Al inscribirse alguien | Solo el admin | "Pedro se inscribió en tu copa. Ya son 5 jugadores inscritos." |

Lo que **no** se avisa, a propósito:

- **Salas en vivo** (Dudo, Julepe, etc.): se juegan con la gente al lado; un aviso de "te toca"
  sobra y obligaría a un servidor en tiempo real.
- **Marketing** ("¡vuelve a jugar!", "hay un juego nuevo"): un aviso que no sirve a quien lo recibe
  hace que desactive todos. Si alguna vez se quiere, va con su propia casilla, apagada por defecto.
- Tope: **máximo 2 avisos por persona al día** por copa. Cada aviso trae un `tag` por copa y día,
  así el siguiente reemplaza al anterior en la bandeja en vez de apilarse.

Con esto el admin sigue teniendo sus mensajes armados para el grupo de WhatsApp (D-99 no se borra
entero: la pica del grupo sigue ahí). El aviso es personal y la tarjeta compartida es social.

## Experiencia del jugador (UX)

### Principios

1. **El permiso se pide cuando el jugador ya tiene un motivo**: después de jugar el día o al quedar
   inscrito en una copa que todavía no parte. Nunca al abrir la app ni en la portada.
2. **Primero se pregunta con un botón propio y después sale el diálogo del sistema.** El "No" del
   sistema es definitivo: el sitio ya no puede volver a preguntar, y la persona tiene que ir a los
   ajustes. Por eso el diálogo del sistema sale solo cuando la persona ya dijo que sí.
3. **Un "Ahora no" se respeta**: la tarjeta que ofrece los avisos no vuelve en esa copa. El botón
   🔔 de la copa queda siempre a mano para quien cambie de idea.
4. **Nunca se ofrece algo que el celular no puede hacer.** Si el navegador no tiene avisos (un
   iPhone con iOS anterior a 16.4, por ejemplo), el botón no aparece.
5. **Cada aviso le sirve a quien lo recibe**: dice qué pasa y hasta cuándo, y al tocarlo se abre
   la copa en el juego del día, listo para empezar.
6. **Apagar es tan fácil como encender**, desde la copa y, en Android, desde el mismo aviso.
7. **Se pide una vez por celular y no una vez por copa.** Si el celular ya tiene los avisos
   permitidos, la copa siguiente los trae encendidos con una línea que lo dice
   ("🔔 Te avisaremos de esta copa · Cambiar"), sin volver a preguntar.

### Dónde se ofrece

| Momento | Pantalla | Qué ve el jugador |
|---|---|---|
| **Acaba de jugar el día** (el mejor momento: ganó o perdió, y ya piensa en mañana) | Resultado del día (`resultado()`), debajo del puntaje | Tarjeta: "🔔 ¿Te avisamos cuando se abra el día 4? Te llega un aviso en la mañana y otro antes del cierre si todavía no juegas." · **Avisarme** · *Ahora no* |
| **Se inscribió y la copa todavía no parte** | Tablero, arriba | "🔔 La copa parte el lunes. ¿Te avisamos ese día?" · **Avisarme** · *Ahora no* |
| **Creó la copa** (admin) | Tablero recién creada, después de invitar | Lo mismo, y además el admin recibe "Pedro se inscribió en tu copa" |
| **Siempre** | Tablero, botón chico en la cabecera | 🔔 con su estado (más abajo) |

La tarjeta sale **una sola vez por copa**, en el primero de esos momentos que le toque al jugador.

### El camino según el celular

La app detecta en qué está el jugador y le muestra solo el camino que le sirve:

```
                          toca "Avisarme"
                                │
     ┌──────────────────────────┼─────────────────────────────┬────────────────────────┐
 Android / computador     iPhone en Safari             iPhone dentro de otra app     iPhone ya instalada
 (o iPhone con la app     o Chrome, iOS 16.4+          (WhatsApp, Instagram…)        (abierta desde el ícono)
  ya instalada)                 │                             │                             │
     │                   Hoja "Agrega la app         "Para recibir avisos,          (= Android: directo
 Diálogo del sistema      a tu inicio", 3 pasos       abre este link en Safari"      al diálogo del sistema)
     │                    con dibujos                 · Copiar link
 ✅ Aviso de prueba             │
    al instante          El jugador abre la app desde el ícono
                                │
                         "Eres Ana en La Copa: Los Primos.
                          Escribe tu PIN para seguir."
                                │
                         🔔 Activar avisos → diálogo del sistema → ✅ aviso de prueba
```

**Android y computador**: un toque en **Avisarme**, el diálogo del sistema y listo. No hace falta
instalar nada: Chrome, Edge, Samsung Internet y Firefox reciben avisos con la página cerrada. El
navegador ofrece "Instalar app" por su cuenta; la app no insiste.

**iPhone en Safari** (y Chrome en iPhone, que también puede agregar a inicio desde iOS 16.4):
una hoja que se desliza desde abajo con tres pasos, cada uno con el dibujo del botón que hay que
tocar:

1. "Toca **Compartir**" (con el ícono del cuadrado y la flecha, y una flecha que apunta adonde está
   el botón en ese iPhone. En iOS 26 Compartir quedó dentro del menú **⋯**, así que el paso cambia
   según la versión).
2. "Elige **Agregar a inicio**. Si no lo ves, baja en la lista."
3. "Abre **Juegos** desde el ícono nuevo y toca 🔔 otra vez."

La hoja tiene un botón **Ya la agregué** que explica el paso 3 y un **Cerrar**. No se puede saber
desde Safari si la persona la instaló, así que la hoja no vuelve a salir sola.

**El paso delicado de iPhone: la app instalada empieza vacía.** En iPhone la app de la pantalla de
inicio no comparte nada con Safari: ni el `localStorage`, ni el acceso anónimo de Firebase, ni el
asiento en la copa. Al abrirla por primera vez no sabe quién es el jugador. La propuesta:

- Antes de mostrar la hoja, la página cambia su propia dirección (sin recargar) a
  `/cup/?K7Q2X&app=<pid>`. El código de la copa y el `pid` no son secretos: el PIN sí, y no va en
  el link.
- La app instalada parte en esa dirección, abre la copa y pide **solo el PIN**: "Eres Ana en La
  Copa: Los Primos. Escribe tu PIN para seguir." Es el mismo PIN de siempre (D-96), y el mismo
  camino que usa hoy quien cambia de celular. Si la persona también tiene jugador para los
  rankings (D-212), se le ofrece entrar con ese PIN.
- Justo después: **🔔 Activar avisos**. Es un toque nuevo, que es lo que pide iPhone para mostrar
  el diálogo del sistema.
- **Hay que probarlo en iPhones reales.** Lo que publican otros proyectos no coincide en si iOS
  abre la app en la dirección de la página o en el `start_url` del manifest, y puede cambiar entre
  versiones. Es la primera tarea del PR 2, con iOS 17, 18 y 26. Si iOS usa el `start_url`, el plan
  B es que la app instalada abra en "Tus copas" con **Entrar a mi copa** (código, nombre y PIN),
  que ya existe.

**Dentro de WhatsApp, Instagram u otra app**: ahí no se puede agregar a inicio. Se dice
"Para recibir avisos, abre este link en Safari" con un botón **Copiar link**. En Android no hace
falta: WhatsApp abre los links en Chrome.

### El botón 🔔 de la copa

| Estado | Se ve | Al tocarlo |
|---|---|---|
| Apagado | 🔔 **Activar avisos** | El camino de arriba |
| Encendido | 🔔 **Avisos activos** | Hoja con dos interruptores: "Cuando se abre un día" y "Antes del cierre, si no has jugado", más **Silenciar esta copa** y **Probar los avisos** |
| Bloqueado (la persona dijo "No" al sistema) | 🔕 **Avisos bloqueados** | Cómo desbloquearlos en ese celular: en Android, el candado junto a la dirección → Permisos → Notificaciones; en iPhone, Ajustes → Notificaciones → Juegos |
| El celular no puede | (no aparece) | — |

Cada vez que se abre la app, revisa en silencio que la suscripción siga viva. Si el permiso se
quitó desde los ajustes, el botón pasa a "bloqueados"; si el navegador renovó la suscripción, la
guarda de nuevo.

### La confirmación

Al activar, el celular se manda a sí mismo un aviso al instante, sin pasar por el servidor:
"✅ Listo. Te avisaremos de La Copa: Los Primos. El próximo aviso llega el martes en la mañana."
Así la persona ve cómo se verán y sabe que funcionó. Si ese aviso no aparece (el celular en
modo No molestar, por ejemplo), el botón **Probar los avisos** de la hoja sirve para revisarlo.

### Los avisos

| Aviso | Título | Texto | Al tocarlo |
|---|---|---|---|
| Se abrió el día | 🏆 La Copa: Los Primos | "🔗 Día 3: Conexiones. Ya puedes jugar." (el emoji del juego, como el recordatorio) | El día 3, en "Empezar" |
| Se te acaba el plazo | 🏆 La Copa: Los Primos | "⏳ Te quedan 4 horas para jugar el día 3. Si no lo juegas, son 0 puntos." | El día 3 |
| La Gran Final | 🏆 La Copa: Los Primos | "🏁 Hoy es La Gran Final y vale doble. Vas 2.°, a 3 puntos de Ana." | La Gran Final |
| Terminó | 🏆 La Copa: Los Primos | "🥇 Ganó Ana. Quedaste 2.°." (a quien ganó: "🥇 ¡Ganaste la copa!") | El podio |
| Alguien se inscribió (solo admin) | 🏆 La Copa: Los Primos | "Pedro se inscribió en tu copa. Ya son 5 jugadores inscritos." | El tablero |

- **Hora del jugador, no de la copa**: la zona horaria se guarda con la suscripción. El aviso de
  la mañana llega entre 9:00 y 10:00, y el del plazo unas 4 horas antes del cierre, pero nunca
  entre las 22:00 y las 8:00 de quien lo recibe. Si el plazo cae de noche para él, el aviso llega a
  las 20:00 y dice la hora exacta del cierre.
- **A lo más 2 avisos por copa al día.** Si alguien juega varias copas, los avisos del mismo
  momento se juntan en uno: "Tienes un día nuevo en 2 copas: Los Primos y La Oficina."
- **No se apilan**: cada aviso lleva una etiqueta por copa y día, así que el del plazo reemplaza
  al de la mañana en la bandeja.
- **En Android** el aviso trae dos botones: **Jugar** y **Silenciar esta copa**. iPhone no los
  muestra, y no hacen falta.
- El ícono es el de la app. En Android además va una silueta blanca para la barra de estado.
- **Idioma de quien lo recibe**, en los cuatro (C-3); el nombre de la copa va tal cual.
- **Al terminar la copa** se borran sus suscripciones solas. El permiso del celular queda, así que
  la próxima copa ya viene con avisos (principio 7).

### Textos para revisar (U-1, U-3, U-17)

Los botones caben en 320 px (U-17, unos 18 caracteres): **Avisarme**, **Ahora no**, **Activar avisos**,
**Avisos activos**, **Avisos bloqueados**, **Ya la agregué**, **Cerrar**, **Copiar link**, **Jugar**,
**Silenciar esta copa** y **Probar los avisos**. Apagar los avisos de una copa se dice siempre
"silenciar", en la hoja y en el aviso (U-5). Los textos largos van arriba del botón, en frases
completas. Todos se proponen así y el dueño los corrige en el PR (U-3).

### Qué se mide (panel, D-44)

El embudo, separado por Android, iPhone y computador:

> se ofreció → tocó **Avisarme** → (iPhone) vio la hoja → abrió la app instalada → el sistema dio
> permiso → suscripción guardada

Y después: avisos mandados, avisos tocados (`?aviso=<tipo>`), copas silenciadas y permisos
bloqueados. Con eso se ve dónde se cae la gente y si el esfuerzo en iPhone vale la pena.

### Cómo se prueba

- **Android y computador**: los guiones de `tools/e2e/` ya manejan Chrome. Chrome puede dar el
  permiso por su cuenta y recibir un aviso de prueba, así que el camino completo entra a CI.
- **La hoja de iPhone y los estados del botón**: con `mirar.mjs` imitando un iPhone (el
  identificador del navegador y el tamaño de pantalla), a 320 px y en los cuatro idiomas (C-8).
- **iPhone de verdad**: no se puede automatizar. El PR 2 trae una lista de pasos para probar a mano
  en iOS 17, 18 y 26, y el dueño la corre antes de fusionar.

## Arquitectura

```
Celular                                   Realtime Database                 GitHub Actions (cada 15 min)
───────                                   ─────────────────                 ────────────────────────────
/sw.js (service worker)                   push/<subId>  (nadie lo lee)      tools/push/avisar.mjs
  · evento push → showNotification          endpoint, keys, idioma, uid       · token admin (firebase-admin.mjs)
  · notificationclick → abre la URL       pushCopa/<código>/<pid>/<subId>     · lee torneos en curso
                                            (quién quiere avisos de qué)      · decide qué aviso toca
push.js (en la página)                    pushEnviados/<código>/<día>/<tipo>  · cifra y firma (Web Push, VAPID)
  · registra el SW                          (para no repetir)                 · POST al servicio del navegador
  · pide permiso tras un toque                                                · 404/410 → borra la suscripción
  · pushManager.subscribe(VAPID público)
  · guarda la suscripción
```

### 1. Service worker (`public/sw.js`)

- En la raíz, para que su alcance sea todo el sitio. GitHub Pages lo sirve con HTTPS, que es
  requisito.
- **Primera versión sin evento `fetch`**: no guarda nada en caché. Así no hay riesgo de que un
  celular quede pegado con una versión vieja del sitio (el sitio cambia varias veces por semana y
  `publicar.yml` estampa la versión en cada publicación). El modo sin conexión (RP-13) es un paso
  aparte y opcional, con su propio cuidado.
- Desde el PR 3, maneja `push` (muestra el aviso con título, texto, ícono, `tag` y URL) y `notificationclick`
  (enfoca la pestaña de la app si ya está abierta o abre la URL).
- `pushsubscriptionchange`: cuando el navegador renueva la suscripción, la guarda de nuevo.
- Las páginas puente de las rutas viejas no lo registran.

### 2. Manifest e íconos

- **Hecho en el PR 1:** íconos PNG de 192 y 512 px, uno `maskable` y el `apple-touch-icon` de 180
  px, en `public/assets/icons/`. El SVG solo no basta para que Android ofrezca instalar ni para el
  ícono de iPhone. Se rehacen desde `assets/icon.svg` con `node tools/release/iconos.mjs`.
- **Hecho:** el manifest lleva `id`, `scope` y los íconos. Hay uno por idioma, con el nombre de la app en ese idioma, y el iPhone lo toma de `apple-mobile-web-app-title` (D-222). Falta, para el PR 4, que `start_url`
  lleve `?pwa` y así el panel cuente cuántos abren desde la app instalada (D-44).
- **Hecho:** las 19 páginas de la app (las que ya tenían manifest) llevan el `apple-touch-icon` y
  registran el service worker; `public/assets/js/instalable.test.mjs` lo exige. Las puertas por
  idioma, las páginas puente, el panel y el laboratorio no lo llevan, a propósito: no son la app.

### 3. Suscribirse (`public/assets/js/push.js`)

- La clave pública VAPID va en el código (es pública, como `firebase-config.js`). La privada es un
  secreto nuevo de GitHub, `VAPID_PRIVADA`, que se genera una sola vez con
  `node tools/push/vapid.mjs` (sin dependencias: `node:crypto` genera el par P-256).
- `subId` = hash del `endpoint` (así un mismo celular no se suscribe dos veces).
- En la copa, al activar avisos se escribe `pushCopa/<código>/<pid>/<subId> = true`. Las reglas
  piden que ese `uid` esté sentado como ese `pid` (igual que para jugar), así nadie suscribe a otro.

### 4. Reglas de Firebase

```jsonc
"push": {
  "$subId": {
    ".read": false,                              // solo el administrador
    ".write": "auth != null && (!data.exists() || data.child('uid').val() == auth.uid)",
    ".validate": "newData.hasChildren(['endpoint','keys','lang','uid','at']) && newData.child('uid').val() == auth.uid && newData.child('endpoint').val().beginsWith('https://')"
  }
},
"pushCopa": {
  "$code": { "$pid": { "$subId": {
    ".read": false,
    ".write": "auth != null && root.child('torneoSeats/' + $code + '/' + $pid + '/' + auth.uid).exists()"
  } } }
}
```

El `endpoint` de una suscripción no identifica a la persona, pero sí permite mandarle avisos: por
eso nadie lo lee. Las reglas se publican solas con `publicar.yml` (D-218).

### 5. El que manda (`tools/push/avisar.mjs` + `.github/workflows/avisos.yml`)

- Sin dependencias, como el resto de `tools/firebase/`: Web Push son ~150 líneas con `node:crypto`
  (cifrado `aes128gcm` del RFC 8291 y firma VAPID ES256 del RFC 8292).
- Cada corrida: lee las copas en curso, calcula con `engine.js` (el mismo que usa la app, así el
  "qué día es" no se duplica) qué avisos tocan en la ventana actual, descarta los ya marcados en
  `pushEnviados` y manda.
- Si el servicio responde 404 o 410, la suscripción murió: se borra.
- `node tools/push/avisar.mjs --simular` imprime qué mandaría sin mandar nada (para pruebas y para
  el panel). `--prueba <subId>` manda un aviso de prueba a un celular.
- Workflow con `schedule: '*/15 * * * *'` y `workflow_dispatch`. GitHub no garantiza la hora
  exacta (se atrasa 5–20 minutos en horas de carga), por eso los avisos se planifican por
  **ventana** ("entre las 9:00 y las 10:00, si no se mandó"), nunca por minuto exacto.
- Si el repo pasa 60 días sin commits, GitHub apaga los workflows programados. Con el ritmo actual
  no pasa; el panel puede mostrar la hora del último envío para notarlo.

### 6. Panel del dueño

Una fila nueva: suscripciones vivas, avisos mandados por tipo y cuántos se tocaron (el
`notificationclick` abre la URL con `?aviso=<tipo>` y se cuenta como cualquier señal, D-44). Eso
responde la pregunta de fondo: si los avisos de verdad traen gente de vuelta.

## Alternativas que se descartaron

| Opción | Por qué no |
|---|---|
| **Firebase Cloud Messaging** (SDK de mensajería) | Funciona, pero agrega un SDK más al celular y al service worker, y por debajo es el mismo Web Push. Con VAPID directo el SW es más chico y no depende de Firebase para avisar. Queda como plan B si Web Push directo diera problemas con algún navegador. |
| **Cloud Functions** con disparadores | Exige el plan Blaze (con tarjeta) de Firebase. |
| Cloudflare Workers con cron | Gratis y más puntual, pero suma una cuenta y un lugar más donde vive código. Si GitHub Actions se queda corto en puntualidad, es el siguiente paso. |
| OneSignal u otro proveedor | Pone a un tercero entre la app y los jugadores; el panel y la privacidad quedan afuera. |
| App nativa (Capacitor, TWA en Play Store) | Mucho más costo para el mismo resultado; la TWA podría venir después para estar en Play Store. |
| Recordatorios `.ics` (LIG-29) | El dueño lo dejó fuera por ahora (2026-10-05): solo avisos al celular, para quien los quiera. |

## Plan de desarrollo, en PR chicos

| PR | Qué trae | Se puede probar sin… |
|---|---|---|
| **1. Instalable de verdad** ✅ v0.105.0 | Íconos PNG, manifest completo, `sw.js` mínimo (sin caché, sin push), ícono de Apple, prueba de que todas las páginas los llevan, guion e2e que verifica que el SW se registra y que Chrome deja instalar | Avisos |
| **2. Suscribirse** | Primero, la prueba en iPhones reales de cómo abre la app instalada. Después: `push.js`, la tarjeta y el botón 🔔 de La Copa con sus cuatro estados, la hoja de iPhone, el "escribe tu PIN" de la app instalada, el aviso de confirmación, reglas `push` y `pushCopa`, textos en 4 idiomas y la lista de pasos para probar a mano en iPhone | Mandar nada (se ve la suscripción guardada y llega el aviso de confirmación) |
| **3. Mandar** | `tools/push/` (vapid, webpush, avisar con `--simular`), pruebas unitarias del cifrado contra los vectores del RFC 8291 y del calendario de avisos contra `engine.js`, workflow `avisos.yml` | — |
| **4. Medir** | Fila del panel, `?aviso=` en las señales, `?pwa` en el inicio | — |
| *(después)* | Modo sin conexión (RP-13), Declarative Web Push para iPhone | — |

El dueño hace una sola cosa a mano: correr `node tools/push/vapid.mjs` y pegar la clave privada como
secreto `VAPID_PRIVADA` en GitHub.

## Riesgos

- **iPhone es el freno**: la mayoría no agrega apps web a inicio, y la app instalada empieza
  sin saber quién es el jugador. El embudo del panel dice dónde se cae la gente; el mensaje del
  admin al grupo sigue cubriendo a todos.
- **iOS cambia de una versión a otra** (dónde está Compartir, cómo abre la app instalada). La hoja
  de iPhone se revisa con cada versión nueva de iOS.
- **Un service worker mal hecho deja celulares con la versión vieja.** Por eso el primero no
  cachea nada y el modo sin conexión va aparte.
- **Avisos de más = avisos apagados.** El tope de 2 al día y "solo si no jugaste" son parte del
  diseño, no un detalle.
- **Puntualidad de GitHub Actions**: aceptable para avisos de día; no sirve para nada en tiempo real.

## Fuentes

- [Meet Declarative Web Push (WebKit)](https://webkit.org/?p=16535)
- [Requisitos de Web Push en iOS (Pushpad)](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications)
- [Web push para iOS (OneSignal)](https://documentation.onesignal.com/docs/web-push-for-ios)
- [Los workflows programados de GitHub Actions no son puntuales](https://runhooks.app/blog/github-actions-scheduled-workflows-unreliable/)
- [Workflows programados de GitHub Actions: límites](https://cronuru.com/guides/github-actions-scheduled-workflows)
- [iOS: la app de inicio con almacenamiento aparte y su `start_url` (un caso real)](https://github.com/uzayr-iqbal-hamid/hypr-remote/issues/1)
- [Agregar a inicio en iOS: notas de uso](https://naildrivin5.com/blog/2023/08/24/braindump-of-pwa-on-ios.html)
- RFC 8030 (Web Push), RFC 8291 (cifrado de mensajes), RFC 8292 (VAPID)
