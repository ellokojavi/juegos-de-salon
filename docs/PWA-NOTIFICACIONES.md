# Propuesta: app instalable y avisos al celular (PWA + Web Push)

**Estado:** propuesta, espera la decisión del dueño · **Fecha:** 2026-10-05 · **Toca:** RP-13, LIG-29,
LIG-33, D-99

Si el dueño la aprueba, entra como decisión nueva (D-n, numerada al fusionar) que **reemplaza a
D-99** en lo que dice de los avisos automáticos, y este documento pasa a ser su detalle.

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

Consecuencia de diseño: en iPhone el aviso **no se puede ofrecer en la pestaña de Safari**. Ahí la
app muestra cómo agregarla a inicio (con un dibujo del botón Compartir) y recién dentro de la
app instalada ofrece los avisos. Se detecta con `navigator.standalone` /
`matchMedia('(display-mode: standalone)')`.

## Qué avisos, y por qué esos

El enganche verdadero de la app es **La Copa**: un torneo de una semana, un juego por día, con día
de gracia. Hoy depende de que el admin se acuerde de compartir el recordatorio (D-99). Es el caso
perfecto para un aviso: hay una fecha, hay algo pendiente y le importa a la persona.

| Aviso | Cuándo | A quién | Ejemplo |
|---|---|---|---|
| **Se abrió el día** | 9:00 del día, en la zona de la copa (no a las 00:00) | Inscritos que activaron avisos | "🏆 Copa Los Primos · Día 3: Conexiones. Ya puedes jugar." |
| **Se te acaba el plazo** | 20:00 del último día en que vale (el de gracia, o el de la final) | Solo a quien **no** ha jugado ese día | "⏳ Te quedan 4 horas para jugar el día 3. Si no, suma 0." |
| **Terminó la copa** | Al cerrar (o al terminarla el admin, D-161) | Todos los inscritos con avisos | "🥇 Ganó Ana. Mira cómo quedó la tabla." |
| Alguien se unió *(opcional)* | Al inscribirse alguien | Solo el admin | "Pedro entró a tu copa (5 jugadores)." |

Lo que **no** se avisa, a propósito:

- **Salas en vivo** (Dudo, Julepe, etc.): se juegan con la gente al lado; un aviso de "te toca"
  sobra y obligaría a un servidor en tiempo real.
- **Marketing** ("¡vuelve a jugar!", "hay un juego nuevo"): un aviso que no sirve a quien lo recibe
  hace que desactive todos. Si alguna vez se quiere, va con su propia casilla, apagada por defecto.
- Tope: **máximo 2 avisos por persona al día** por copa. Cada aviso trae un `tag` por copa y día,
  así el siguiente reemplaza al anterior en la bandeja en vez de apilarse.

Con esto el admin sigue teniendo sus mensajes armados para el grupo de WhatsApp (D-99 no se borra
entero: la pica del grupo sigue ahí). El aviso es personal y la tarjeta compartida es social.

## Cómo lo ve el jugador (U-n)

- **Nunca se pide permiso al abrir la app.** Se ofrece en el momento en que tiene sentido: al
  inscribirse en una copa, en la pantalla de "ya jugaste hoy", con un botón
  **"🔔 Avísame cuando se abra el próximo día"**. Si dice que no, no se vuelve a ofrecer en esa copa.
- El permiso del navegador es de una sola vez: si el usuario lo bloquea, ya no se puede volver a
  pedir; solo cambiarlo en los ajustes. Por eso se pregunta primero con un botón propio y el diálogo
  del sistema sale solo si toca "Sí".
- En la copa, un interruptor "🔔 Avisos de esta copa" para apagarlos. Cada aviso trae, además,
  el enlace a la copa (al tocarlo abre `/cup/?CÓDIGO` directo en el día).
- En iPhone sin instalar: "Para recibir avisos en iPhone, agrega Juegos de Salón a tu pantalla de
  inicio: toca Compartir y luego *Agregar a inicio*."
- Textos en los cuatro idiomas (C-3). El aviso va en el idioma **de quien lo recibe**, que se guarda
  con la suscripción (no el de la copa).

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
- Maneja `push` (muestra el aviso con título, texto, ícono, `tag` y URL) y `notificationclick`
  (enfoca la pestaña de la app si ya está abierta o abre la URL).
- `pushsubscriptionchange`: cuando el navegador renueva la suscripción, la guarda de nuevo.
- Las páginas puente de las rutas viejas no lo registran.

### 2. Manifest e íconos

- Agregar íconos PNG de 192 y 512 px (y uno `maskable`), y `apple-touch-icon` de 180 px: el SVG
  solo no basta para que Android ofrezca instalar ni para el ícono de iPhone. Se generan desde
  `assets/icon.svg` con Chrome, como ya se hacen las tarjetas (`tools/release/og.mjs`).
- `"id": "/"`, `"scope": "/"`, `"start_url": "/?pwa"` (la `?pwa` deja medir en el panel cuántos
  abren desde la app instalada, D-44).
- Los juegos ya llevan `<link rel="manifest">`; les faltan las entradas por idioma (`/en/`, `/pt/`,
  `/de/`), el laboratorio y el panel, además de la meta `apple-mobile-web-app-capable` y el ícono de
  Apple en todas. Una prueba revisa que estén en cada página que no sea puente.

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
| Recordatorios `.ics` (LIG-29) | Complemento barato: sirve a quien no quiere avisos o no instala la app en iPhone. Se puede hacer igual, aparte. |

## Plan de desarrollo, en PR chicos

| PR | Qué trae | Se puede probar sin… |
|---|---|---|
| **1. Instalable de verdad** | Íconos PNG, manifest completo, `sw.js` mínimo (sin caché, sin push), metas de Apple, prueba de que todas las páginas los llevan, guion e2e que verifica que el SW se registra | Avisos |
| **2. Suscribirse** | `push.js`, botón "🔔 Avísame" en La Copa, guía de "Agregar a inicio" en iPhone, reglas `push` y `pushCopa`, textos en 4 idiomas, la clave VAPID pública | Mandar nada (se ve la suscripción guardada) |
| **3. Mandar** | `tools/push/` (vapid, webpush, avisar con `--simular`), pruebas unitarias del cifrado contra los vectores del RFC 8291 y del calendario de avisos contra `engine.js`, workflow `avisos.yml` | — |
| **4. Medir** | Fila del panel, `?aviso=` en las señales, `?pwa` en el inicio | — |
| *(después)* | Modo sin conexión (RP-13), Declarative Web Push para iPhone, aviso al admin cuando alguien entra | — |

El dueño hace una sola cosa a mano: correr `node tools/push/vapid.mjs` y pegar la clave privada como
secreto `VAPID_PRIVADA` en GitHub.

## Riesgos

- **iPhone es el freno**: la mayoría no agrega apps web a inicio. Medir en el panel cuántos se
  suscriben por plataforma antes de invertir más; el mensaje del admin al grupo sigue cubriendo a
  todos.
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
- RFC 8030 (Web Push), RFC 8291 (cifrado de mensajes), RFC 8292 (VAPID)
