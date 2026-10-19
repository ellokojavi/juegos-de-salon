# Decisiones de diseño y arquitectura

Registro tipo ADR (Architecture Decision Record). Las decisiones se numeran y no se borran: si una cambia, se agrega una nueva que la reemplaza.

**La regla de hoy está en [CANONES.md](CANONES.md); aquí está la historia, con su porqué** (D-213).
Cuando una decisión cambia una regla, el mismo PR cambia el canon y marca el Estado de la
decisión vieja.

- **Estado** es uno de cuatro: `vigente` · `corregida por D-x` (sigue valiendo, salvo lo que
  cambió la otra) · `reemplazada por D-x` (ya no rige: rige la otra) · `derogada` (ya no rige y
  nada la reemplaza).
- **Relación**, aparte en la misma línea, dice qué hace con otras reglas: cambia, corrige, amplía,
  completa o es excepción a.
- El número es el orden en que se fusionó, no el de la fecha: puede haber fechas que retroceden.

### Rutas de entonces y de hoy

Las rutas citadas en decisiones anteriores a D-192 son las de entonces; esta tabla dice dónde
viven hoy. Las rutas viejas de las páginas siguen funcionando como páginas puente.

| Antes | Hoy |
|---|---|
| `index.html`, `CNAME`, `en/`, `pt/`, `labs/`, `panel/` | lo mismo dentro de `public/` (D-192) |
| `assets/` | `public/assets/` |
| `assets/img/tierra-2004-09…` | `public/assets/img/earth-2004-09…` |
| `ahorcado/` | `public/hangman/` |
| `batalla-naval/` | `public/battleship/` |
| `copa/` | `public/cup/` |
| `copa/juegos/<juego>.js` y `ui-<juego>.js` | `public/cup/games/<carpeta>/` (`engine.js`, `ui.js`) |
| `cuarto-rey/` | `public/fourth-king/` |
| `dudo/` | `public/liars-dice/` |
| `julepe/` | `public/julep/` |
| `linea-de-tiempo/` | `public/timeline/` |
| `toque-y-fama/` | `public/bulls-and-cows/` |
| `/copa/?practica=<id>`, `/minijuegos/?<id>`, `/minijuegos/<id>/`, `/minigames/<slug>/` | `/<slug>/` en la raíz (D-198): `anio` → `year`, `conexiones` → `connections`, `desenredo` → `untangle`, `donde` → `where`, `letras` → `word`, `reinas` → `queens`, `tango`, `zip` |
| `minijuegos/index.html` (el molde) | `public/cup/suelto/index.html` |
| `docs/juegos/<id>.md` | `docs/games/<carpeta>.md` (`toque-y-fama-factibilidad.md` → `bulls-and-cows-factibilidad.md`) |
| `tools/og.mjs`, `tools/og/`, `tools/readme.py`, `tools/readme.test.py`, `tools/hechos.mjs`, `tools/set-version.py` | `tools/release/` |
| `tools/reglas.mjs`, `tools/reportes.mjs`, `tools/en-curso.mjs`, `tools/firebase-admin.mjs` | `tools/firebase/` |
| `tools/dilemas.mjs`, `tools/documentar.mjs`, `tools/documentar.test.mjs`, `tools/marketing.mjs` | `tools/agents/` |
| `tools/mapa.mjs`, `tools/flota.py` | `tools/generators/` |
| `tools/e2e/<juego>-<guion>.mjs` | `tools/e2e/<carpeta>/<guion>.mjs` (`linea-de-tiempo-veredicto.mjs` → `timeline/veredicto.mjs`; `copa.mjs` → `cup/torneo.mjs`) |
| `marketing/video-promo/` | `marketing/promo-video/` |
| `.claude/skills/video-promo/` | `.claude/skills/promo-video/` |
| `tools/agents/procesos.mjs`, `tools/e2e/caminos.mjs`, `.github/workflows/publicar.yml` and the rest of the workshop's Spanish names | their English names (D-316: `processes.mjs`, `paths.mjs`, `publish.yml`, `timeline/verdict.mjs`, `cup/tournament.mjs`…) |
| `lab/`, `tools/lab.py`, `tools/diccionario/`, `tools/diag/` | ya no existen (D-67, D-65, D-77) |

## Índice por tema

Dónde está la regla de hoy y qué decisiones la explican. Solo van las vigentes y las corregidas
que siguen explicando algo; las reemplazadas y derogadas quedan fuera.

| Tema | Regla de hoy (canon) | Decisiones vigentes que la explican |
|---|---|---|
| Estructura y rutas | C-2, C-18 | D-01, D-02, D-03, D-24, D-192, D-198, D-214, D-256, D-266, D-269, D-270, D-280, D-281, D-284, D-286, D-289, D-293, D-297, D-310, D-311, D-316 |
| Identidad y textos | C-1 | D-11, D-30, D-49, D-177, D-184, D-324 |
| Mazos de cartas con fecha | `docs/games/timeline.md` | D-37, D-277, D-278, D-314 |
| 🕵️ Agentes, el juego del laboratorio (tablero, pistas, trampas) | `docs/games/agents.md` | D-286, D-287, D-288 |
| 🖌️ Pintaminas, el Buscaminas de colores del laboratorio (dibujos y sus colores, pinceles, tablero sin adivinar, modo difícil, ayuda, rendirse) | `docs/games/paint-mines.md` | D-289, D-290, D-291, D-292, D-296, D-298, D-332 |
| 🚇 Rutas rotas (antes Rutas), el plano de metro del laboratorio (giros de rectángulos, mínimo exacto, cinco etapas, reloj de 7 minutos y puntaje por capas) | `docs/games/routes.md` | D-293, D-294, D-295, D-332 |
| 💥 Números explosivos, el solitario de números del laboratorio (pares iguales o que suman 10, filas que se van, ➕, tablero con salida, explosiones) | `docs/games/exploding-numbers.md` | D-297 |
| 📐 Loteo, el Shikaku del laboratorio (rectángulos con un número que es su área, solución única, cinco tableros contra el reloj: dos para calentar y tres difíciles; el modo ⚡💧 Servicios, con lotes del mismo tamaño y un ⚡ y un 💧 en cada uno) | `docs/games/plots.md` | D-310, D-311, D-312, D-332 |
| Idiomas | C-3 | D-47, D-74, D-170, D-191, D-194, D-197, D-199, D-231, D-244, D-256, D-269, D-270, D-286, D-289, D-293, D-297, D-310 |
| Sonido y vibración | C-4 | D-17, D-92 |
| Modos de juego | C-5 | D-27, D-65, D-129, D-142, D-213, D-246 |
| Portada: orden, filtros y favoritos | C-17 | D-142, D-144, D-149, D-196, D-214, D-238, D-239, D-240, D-241, D-255, D-305, D-333, D-335, D-351, D-355, D-361, D-362, D-363, D-364, D-369, D-373 |
| Juego al azar y Uno al día | [UNO-AL-DIA.md](UNO-AL-DIA.md) | D-188, D-230, D-235, D-237, D-239, D-247, D-305, D-334 |
| Salas y transporte | C-7, C-15 | D-18, D-20, D-29, D-35, D-39, D-41, D-50, D-89, D-138, D-320, D-321 |
| Anti-trampa y secretos | C-10, C-7 | D-19, D-21, D-55, D-70, D-81, D-82, D-97, D-246, D-367 |
| Memoria de partida | C-6 | D-25, D-150 |
| Interfaz táctil | C-8 | D-38, D-52, D-77, D-85, D-86, D-87, D-90, D-92, D-163, D-213, D-283, D-309, D-342, D-344 |
| Errores y pase del celular | C-8b, C-9, C-14 | D-36, D-40, D-56, D-60, D-123, D-213, D-277, D-314, D-319, D-322 |
| Compartir | C-7 | D-72, D-162, D-165, D-171, D-173, D-181, D-226, D-242, D-243, D-253, D-254, D-271, D-272 |
| Panel y señales de uso (privacidad) | C-16 | D-44, D-45, D-46, D-73, D-79, D-80, D-140, D-207, D-208, D-209, D-210, D-211, D-251, D-317, D-318, D-320, D-348, D-349, D-350, D-352 |
| Publicar y versión | C-11 | D-22, D-122, D-189, D-192, D-205, D-213, D-216, D-218, D-300, D-302, D-308, D-323 |
| README y capturas | C-13 | D-51, D-76, D-78, D-213, D-316 |
| Pruebas | C-12 | D-143, D-193, D-199, D-204, D-216, D-299, D-307, D-315 |
| La Copa (torneo, días, puntaje) | `docs/games/cup.md` | D-94, D-95, D-96, D-97, D-99, D-106, D-113, D-118, D-150, D-161, D-163, D-170, D-175, D-187, D-212, D-220, D-234, D-250, D-257, D-258, D-259, D-260, D-261, D-262, D-263, D-264, D-267, D-268, D-282, D-285, D-325, D-326, D-331, D-332, D-336, D-347, D-359 |
| Agentes (usabilidad, documentación, procesos, atención, ideas) | [USABILIDAD.md](USABILIDAD.md) | D-132, D-135, D-172, D-204, D-206, D-213, D-218, D-252, D-273, D-275, D-276, D-279, D-301, D-303, D-304, D-306, D-313, D-315, D-317, D-318, D-341, D-360, D-361, D-365 |
| Rankings y jugador (nombre y PIN) | C-7 | D-96, D-212, D-215, D-217, D-219, D-220, D-230, D-236, D-249, D-336, D-357, D-358, D-359 |
| Marketing | `marketing/README.md` | D-178 |
| App instalable y avisos al celular | C-2, [PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md) | D-221, D-222, D-223, D-224, D-225, D-227, D-228, D-229, D-230, D-232, D-233 |

---

## D-01 · Stack: HTML/CSS/JS puro, sin build
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Sitio estático con módulos ES nativos. Sin bundler, sin framework, sin `package.json`.
**Por qué:** Se publica directo en GitHub Pages, cualquiera puede leer y modificar el código, y la complejidad de los juegos de salón no justifica un framework. Cumple RP-10.
**Consecuencias:** Hay que servir por HTTP en local (`python3 -m http.server`). Si el proyecto crece mucho (decenas de juegos, estado compartido), se reevalúa.

## D-02 · Un juego = una carpeta con su propia URL
**Fecha:** 2026-09-08 · **Estado:** corregida por D-192
**Decisión:** Cada juego vive en `/<id>/` con su `index.html`, `game.js`, `rules.js` y `style.css`. El menú se genera desde `assets/js/games.js`.
**Por qué:** URLs compartibles por juego, aislamiento total entre juegos (uno roto no rompe a los demás) y facilidad para agregar juegos (ver [AGREGAR-JUEGO.md](AGREGAR-JUEGO.md)).

## D-03 · Datos separados de la lógica
**Fecha:** 2026-09-08 · **Estado:** corregida por D-68
**Decisión:** Las reglas, textos, penitencias y categorías viven en `rules.js` como datos puros. `game.js` solo contiene la máquina de estados y el render.
**Por qué:** Permite ajustar reglas y variantes (CR-17) sin tocar lógica, y eventualmente cargar variantes desde JSON.

## D-04 · Orden de asiento = orden de ingreso, hacia la derecha
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Los jugadores se anotan en el orden en que están sentados, avanzando hacia la derecha. Así, el “compañero de la derecha” del jugador N es el N+1 y el de la izquierda es el N−1 (circular). El turno también avanza hacia la derecha.
**Por qué:** Es la convención más natural para pasar el celular por la mesa y permite que la app nombre a las personas (CR-06) en vez de solo decir “el de la derecha”.

## D-05 · Género para J y Q
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Al ingresar jugadores se elige ♂ hombre, ♀ mujer o ⚧ otro. J hace tomar a ♂ y ⚧; Q hace tomar a ♀ y ⚧. Si no hay nadie del género que corresponde, toma quien sacó la carta.
**Por qué:** Las reglas originales usan género. “Otro” toma en ambas para no dejar a nadie fuera de la fiesta (regla de la casa, documentada y fácil de cambiar en `resolveTargets`).

## D-06 · Fin de partida con el cuarto rey
**Fecha:** 2026-09-08 · **Estado:** corregida por D-68
**Decisión:** Al salir el cuarto rey, ese jugador se toma el vaso y la partida termina con pantalla final y opción de “otra ronda” con mazo nuevo y los mismos jugadores.
**Por qué:** Es la versión más común del juego y evita rondas largas sin tensión después del cuarto rey. Se descartó “seguir hasta agotar el mazo” (queda como variante posible, CR-17).

## D-07 · Mini-juegos: reglas + ayudas simples, no implementación completa
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Cuenta Cuentos, Chancho Inflado, Cultura Chupística y Nunca Nunca se juegan de viva voz. La app explica las reglas, indica quién parte y ofrece ayudas: temporizador de 5 s, categoría al azar, idea de “nunca nunca”, y selector de perdedor (suma 2 sorbos).
**Por qué:** Estos juegos son sociales por naturaleza; llevarlos a pantalla les quita gracia y alarga la versión inicial. Una implementación completa queda como mejora futura.

## D-08 · Chancho Inflado es “diferido”
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Quien saca el 6 puede inflar las mejillas en cualquier momento posterior. La app lo explica y deja marcar al perdedor de inmediato o seguir jugando (“Nadie perdió / seguir”).
**Por qué:** Así se juega habitualmente en Chile; la sorpresa es la gracia.

## D-09 · Contador de sorbos aproximado
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** La app lleva un ranking de sorbos por jugador solo con fines lúdicos (pantalla final). Cuenta automáticamente las reglas deterministas y suma 2 sorbos al perdedor de mini-juegos o al que se arruga en una penitencia. El cuarto rey se cuenta como “fondo”.
**Por qué:** Da un cierre entretenido sin obligar a los jugadores a registrar nada durante el juego.

## D-10 · Persistencia en localStorage
**Fecha:** 2026-09-08 · **Estado:** corregida por D-25
**Decisión:** La partida completa (`juegos-de-salon:cuarto-rey:game`) y la lista de jugadores (`juegos-de-salon:players`) se guardan en `localStorage` tras cada acción. Al abrir el juego se ofrece “Continuar”.
**Por qué:** El celular pasa de mano en mano y se bloquea o cierra fácil. No se usa servidor (privacidad, RP-10).

## D-11 · Identidad visual
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Fondo oscuro morado/azul con degradados y luces flotantes; acentos neón (rosado `#ff2e88`, amarillo `#ffd23f`, cian `#2ee6d6`, lima). Titulares en **Bangers** (cómic/fiesta), cuerpo en **Nunito** (redonda, legible). Botones grandes tipo “pill” con sombra sólida y rebote al presionar. Animaciones: volteo 3D de carta, pop de textos, confeti en el cuarto rey y al final.
**Por qué:** Refleja el ambiente de carrete nocturno pedido en RP-07, mantiene legibilidad con poca luz y respeta `prefers-reduced-motion`.

## D-12 · El celular reemplaza al mazo físico
**Fecha:** 2026-09-08 · **Estado:** corregida por D-68
**Decisión:** No se pide un naipe real: la app baraja 52 cartas y muestra la carta con palo y número.
**Por qué:** Cumple RP-06 (el celular guía) y evita desincronización entre mazo real y app. Si un grupo quiere usar naipe real, es una variante posible (CR-17).

## D-13 · Publicación en GitHub Pages desde `main`
**Fecha:** 2026-09-08 · **Estado:** reemplazada por D-192
**Decisión:** Repo público `ellokojavi/juegos-de-salon`, Pages sirviendo la raíz de `main`, con `.nojekyll`.
**Por qué:** Cero configuración de CI; cada push publica. La URL de GitHub Pages (`ellokojavi.github.io/juegos-de-salon/`) quedó después detrás del dominio propio https://juegosdesalon.cl/, y redirige con un 301.

## D-14 · Transición entre turnos como overlay de dos etapas
**Fecha:** 2026-09-08 · **Estado:** corregida por D-213
**Decisión:** Al cerrar una carta, un overlay a pantalla completa muestra (1) "¡Salud!" con los que toman, que avanza solo a los 2,6 s o al tocar, y (2) "Pásale el celular a X" con el botón "¡Dame la carta!". El estado del juego avanza antes de mostrar el overlay y la mesa se redibuja detrás.
**Por qué:** Separa tres momentos que antes se pisaban: decidir quién toma, tomar, y que el siguiente jugador reciba el celular listo para sacar carta (CR-19). Avanzar el estado primero garantiza que, si se cierra el navegador en la transición, la partida se retoma en el turno correcto.

## D-15 · Carta grande que se encoge al descubrirse
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Boca abajo la carta mide el 80 % del ancho (máx. 340 px) con brillo pulsante; al tocarla gira en 3D (0,75 s), se encoge al 38 % (0,5 s) y recién ahí aparece el panel de instrucciones. El tamaño del pip se define con unidades de contenedor (`cqw`) para que escale con la carta.
**Por qué:** Un objetivo grande es más fácil de tocar en una mesa con poca luz (CR-20), y encoger la carta deja las instrucciones visibles sin scroll en la mayoría de los celulares.

## D-16 · Internacionalización simple con diccionarios por idioma
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Un módulo compartido `assets/js/i18n.js` guarda el idioma en `localStorage` (`juegos-de-salon:lang`, por defecto `es`), entrega un toggle ES/EN y aplica textos estáticos vía atributos `data-i18n`. Cada juego expone `LOCALES = { es, en }` en su `rules.js` con reglas, mini-juegos, listas y textos de interfaz; la lógica del juego solo lee `LOCALES[lang]`. Cambiar de idioma recarga la página.
**Por qué:** Cumple RP-15 sin librerías ni build. Los datos por idioma viven junto a cada juego, así que agregar un juego o un idioma no toca el resto. Recargar al cambiar es más simple y seguro que re-renderizar todo en caliente, y no afecta la partida guardada.
**Consecuencias:** Las claves de las listas (penitencias, categorías) no son equivalentes uno a uno entre idiomas: la versión inglesa adapta referencias chilenas a genéricas. Una partida guardada en un idioma se retoma en el idioma activo.

## D-17 · Sonidos sintetizados con Web Audio, sin archivos
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Los efectos (`assets/js/sound.js`) se generan con osciladores y ruido filtrado en Web Audio: click de botón, whoosh al voltear, pop al descubrir, clink de brindis, glug al tomar, fanfarria de rey (corta) y de cuarto rey (grande, con tambor), tic y bocina del temporizador, dado al pedir otra opción, whoosh al pasar el celular, fanfarria final y buzz de error. El audio se desbloquea con el primer toque y hay un botón 🔊/🔇 persistente (`juegos-de-salon:muted`).
**Por qué:** Cumple RP-14 sin descargar ni licenciar archivos de audio, mantiene el sitio liviano y sin dependencias (D-01), y evita el problema de iOS con audio no iniciado por gesto del usuario. Si más adelante se quieren sonidos "reales", basta reemplazar la implementación de `SFX` manteniendo la misma interfaz.
**Consecuencias:** El sonido se apaga con el toggle pero no con el modo silencio del celular en todos los navegadores (iOS Safari sí respeta el switch físico para Web Audio en la mayoría de versiones).

## D-18 · Transporte para juegos con varios celulares
**Fecha:** 2026-09-08 · **Estado:** corregida por D-89 · **Relación:** aprobada por el dueño del proyecto
**Decisión:** Los juegos con dos o más celulares hablan con una interfaz `Transport` (`createRoom`, `joinRoom`, `send`, `onMessage`, `onPresence`, `leave`). La primera implementación remota sería **Firebase Realtime Database** (salas por código de 4 letras, mensajes append-only, expiración a 6 h); se mantiene un transporte `local` para jugar en un solo celular.
**Por qué:** Desde GitHub Pages no hay servidor; una base en tiempo real gratuita funciona entre redes distintas (4G y Wi‑Fi), da reconexión y estado persistente sin código propio, y sirve para futuros juegos de 4 a 6 celulares. WebRTC (PeerJS o QR) queda como alternativa sin cuenta, limitada por NAT fuera de la misma Wi‑Fi. Detalle y comparación en [juegos/toque-y-fama-factibilidad.md](games/bulls-and-cows-factibilidad.md).
**Consecuencias:** Proyecto de Firebase `juegos-de-salon` creado el 2026-09-08 (plan Spark, sin Analytics ni Gemini). Reglas publicadas y versionadas en `firebase/database.rules.json`; configuración pública en `assets/js/firebase-config.js`. Ver [firebase/README.md](../firebase/README.md).

## D-19 · Quién parte en Toque y Fama: determinista, sin sorteo
**Fecha:** 2026-09-08 · **Estado:** corregida por D-367
**Decisión:** En la primera partida parte el invitado (rol B); en la revancha parte quien perdió (en empate, quien no partió). No hay sorteo.
**Por qué:** El sorteo con nonces públicos propuesto en el estudio era manipulable: quien confirma segundo ve el nonce del otro y puede elegir el suyo. Además, un sorteo asíncrono (SHA-256) impedía reconstruir la partida de forma síncrona al reconectar. Con el derecho a réplica activado, la ventaja de partir es mínima, así que una regla fija es justa, simple y reproducible en ambos celulares.

## D-20 · Un solo reductor de mensajes para los tres modos
**Fecha:** 2026-09-08 · **Estado:** corregida por D-129
**Decisión:** El estado de una partida de Toque y Fama se reconstruye siempre desde una lista de mensajes (`hello`, `commit`, `guess`, `reply`, `reveal`, `rematch`), tanto en un celular (transporte en memoria) como en dos (Firebase). En modo un celular ambos roles son locales; contra el celular, el rol B es un bot con solver por eliminación.
**Por qué:** Una sola lógica de juego probada en los tres modos; la reconexión es solo “volver a leer los mensajes”; y el mismo esquema sirve para futuros juegos con varios celulares.
**Consecuencias:** Toda regla de turno vive en `view()` (derivada), nunca en variables sueltas. Los mensajes se procesan en serie para evitar carreras.

## D-21 · Compromiso del secreto con sal privada
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Al fijar el secreto se publica `sha256(secreto + sal)` con una sal aleatoria privada de 16 bytes; al final se revela secreto y sal, y cada celular verifica el hash y recalcula todas las respuestas del rival.
**Por qué:** Con solo 5040 secretos posibles, un hash sin sal se rompe por fuerza bruta en milisegundos. La sal privada lo impide y la revelación final permite detectar respuestas falsas.

## D-22 · Versionado de archivos con import maps para evitar caché mezclada
**Fecha:** 2026-09-08 · **Estado:** corregida por D-205 · **Relación:** desde D-205 se estampa al publicar, en la copia que se sube, no en git
**Decisión:** Cada página lleva un `<script type="importmap">` que mapea todos los módulos JS del sitio a su ruta con `?v=VERSION`, y las hojas de estilo llevan el mismo sufijo. Se estampa con `python3 tools/set-version.py X.Y.Z` en cada publicación. Además, el menú dibuja la lista de juegos antes de cualquier decoración y las decoraciones van en `try/catch`.
**Por qué:** GitHub Pages y los navegadores cachean cada archivo por separado (10 minutos en Pages). Tras una publicación, un celular podía recibir el `index.html` nuevo con un `i18n.js` viejo; el código nuevo esperaba datos que el archivo viejo no tenía, fallaba, y el menú quedaba vacío (ocurrió con la v0.4.5). Con el import map, cambiar la versión cambia la URL de todos los módulos, incluidos los importados por otros módulos y los `import()` dinámicos, así que una página nueva siempre trae JS nuevo.
**Consecuencias:** Hay que correr el script al publicar (queda documentado en el README y en AGREGAR-JUEGO). Los import maps funcionan en Chrome 89+, Safari 16.4+ y Firefox 108+; en navegadores más antiguos los módulos cargan igual, solo sin el sufijo.

## D-23 · Reglas de Batalla Naval v1
**Fecha:** 2026-09-08 · **Estado:** vigente · **Relación:** aprobada por el dueño del proyecto
**Decisión:** Tablero 10×10, flota clásica de 5 barcos, barcos que pueden tocarse (solo no superponerse), tiro extra al acertar (configurable, por defecto sí), parte el invitado y en la revancha el perdedor, sin réplica.
**Por qué:** Es la versión más conocida, la más rápida de colocar en un celular y la más dinámica de jugar. El tiro extra es la costumbre chilena. La regla de “sin contacto” y la flota de 10 barcos quedan como variantes futuras porque alargan la colocación y la partida.
**Consecuencias:** Con tiro extra un turno es una secuencia de disparos; el reductor calcula quién dispara a partir del historial completo, no de un contador de turnos. No hay réplica porque el segundo jugador ya tuvo su secuencia completa cuando el primero termina.

## D-24 · Transportes compartidos entre juegos
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** `local.js` y `firebase.js` pasan de `toque-y-fama/transport/` a `assets/js/transport/`, parametrizados por `game`. Toque y Fama y Batalla Naval los importan desde ahí.
**Por qué:** Evita duplicar la lógica de salas, presencia y reconexión; cualquier juego futuro con varios celulares la reutiliza (D-18).

## D-25 · Memoria de partida en todos los modos y de todos los juegos
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** Todos los juegos guardan la partida en curso con `assets/js/session.js` (clave `juegos-de-salon:<id>:session`, caducidad 12 h) en **todos** los modos, y ofrecen "Continuar" en la intro. Los juegos con reductor guardan la lista de mensajes y retoman reproduciéndola con `createLocalTransport({ seed })`; los datos privados (número secreto, flota, notas) van aparte en `private`.
**Por qué:** Había disparidad: Cuarto Rey guardaba siempre, mientras Toque y Fama y Batalla Naval solo guardaban en modo dos celulares, así que salir al menú o recargar perdía la partida en un celular y contra el celular. Es el caso más común en un carrete: alguien toca "Menú" sin querer.
**Consecuencias:** Queda como canon C-6, obligatorio para los juegos futuros. Cuarto Rey migró a la clave común leyendo la antigua una vez.

## D-26 · Cánones escritos en el repo
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** `docs/CANONES.md` reúne las reglas de construcción de todos los juegos (C-1 a C-14) con una lista de chequeo final, y `CLAUDE.md` en la raíz apunta a él para que se cargue como contexto al abrir el proyecto.
**Por qué:** Las convenciones estaban repartidas entre decisiones sueltas y el código de cada juego. Un solo archivo evita que cada juego nuevo redescubra o contradiga lo ya acordado.

## D-27 · Línea de Tiempo: solitario en vez de IA
**Fecha:** 2026-09-09 · **Estado:** corregida por D-142
**Decisión:** El modo individual de Línea de Tiempo es un solitario con puntaje (vaciar la mano en la menor cantidad de intentos, con récord por temática y tamaño de mano), no una partida contra el celular.
**Por qué:** Toda la información del juego es pública: la máquina conoce los años, así que solo podía ganar o dejarse ganar a propósito. Eso no es un rival, es un número al azar. Un récord personal sí da motivo para volver a jugar.
**Consecuencias:** El canon C-5 admite que el tercer modo sea "contra el celular" o "jugar solo", según el juego tenga o no información oculta que le dé sentido a una IA.

## D-28 · Chat de sala solo en varios celulares
**Fecha:** 2026-09-09 · **Estado:** corregida por D-35
**Decisión:** Línea de Tiempo estrena un chat de texto en la sala y durante la partida, con el módulo compartido `assets/js/chat.js`. Está disponible únicamente en el modo de varios celulares, no aparece sobre el veredicto de una jugada ni en la pantalla final, y no se guarda en ninguna parte: muere con la partida.
**Por qué:** En varios celulares el turno ajeno es tiempo muerto y la gracia del juego es discutir si el hito va antes o después. En un celular la conversación ya ocurre en voz alta y en el solitario no hay con quién hablar, así que un chat ahí solo sería ruido. Las pantallas de acierto y error existen para que el jugador lea una explicación corta (C-8b): un chat encima competiría con eso.
**Cómo:** Los mensajes viajan por el mismo transporte que las jugadas (`{ t: 'chat', text }`), pero el reductor los dibuja y los olvida, y devuelve una marca para **no** volver a dibujar la partida: si el chat viviera dentro de `#screen-play`, cada mensaje recibido borraría lo que el jugador está escribiendo. Por eso el chat tiene su propio contenedor, hermano de `#handoff`, y por eso queda debajo de ese overlay en z-index, que es todo lo que se necesita para que el veredicto lo tape.
**Detalle (v0.10.1):** Además del globito de no leídos, el mensaje nuevo se asoma unos segundos en una etiqueta al lado de la burbuja. El globito responde "cuántos" y la etiqueta "qué": sin ella, saber qué dijeron obliga a abrir el chat justo cuando puede estar por llegar el turno.
**Consecuencias:** Queda como canon C-15 para los demás juegos con salas; en v0.11 se enciende también en Toque y Fama, donde la espera del número secreto del rival es el rato más muerto de todos. En el celular, el teclado no achica la ventana: el panel se levanta con `visualViewport` y el campo usa 16 px exactos para que iOS no haga zoom. Se agregan límites (120 caracteres, un mensaje cada 1,2 s) y las reglas de Firebase validan el largo del texto. La sala se lee con solo saber el código de cuatro letras: el chat **no es privado** y así se documenta.

## D-29 · El enlace de sala solo deja unirse
**Fecha:** 2026-09-09 · **Estado:** corregida por D-266
**Decisión:** Al abrir un enlace `?sala=CÓDIGO`, la pantalla de datos se titula "¡Invitado a jugar!" y muestra únicamente el bloque para unirse a esa sala: sin botón de "Crear sala", con el código fijo y de solo lectura, y sin los ajustes de la partida. Vale para los tres juegos con salas.
**Por qué:** Quien recibe una invitación veía la misma pantalla que quien empieza de cero, con "Crear sala" arriba y el código abajo. Tocar el botón de arriba abre una sala **distinta**, y los dos quedan esperándose en salas separadas sin entender por qué. Los ajustes (dígitos, temática, cartas en mano, reglas de disparo) tenían el mismo problema al revés: se podían tocar y no hacían nada, porque la configuración es la del anfitrión.
**Consecuencias:** Queda en el canon C-7. La pantalla del invitado dice de quién es la sala y que la partida la configura quien invitó. Prueba: `tools/e2e/invite-link.mjs`.

## D-30 · Las cifras no van en Bangers
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** En Toque y Fama, todo lo que es número (teclado, casillas de entrada, lista de intentos, pistas, número secreto propio y números revelados al final) pasa de Bangers a Nunito 900 con `font-variant-numeric: tabular-nums`, con el token compartido `--font-num`. Bangers se queda en los títulos, los nombres y el botón de probar.
**Por qué:** Jugadores reales reclamaron que el **7 se ve igual que el 1** en el teclado. Es cierto: en Bangers los dos son un trazo inclinado con un ganchito arriba, y a tamaño de tecla no se distinguen. En un juego que consiste en leer y comparar cifras, eso no es un detalle de estilo: es el juego funcionando mal.
**Consecuencias:** Queda en el canon C-1 y vale para cualquier juego nuevo. El teclado se ve menos "de fiesta", pero se lee. Se aplicó también a los años de Línea de Tiempo (y a las cartas que quedan en cada mano) y a las coordenadas de Batalla Naval: la casilla del aviso va en su propio `span`, porque el resto de la frase sigue en Bangers. Los números de fila de la grilla ya estaban en Nunito.

## D-31 · Línea de Tiempo: la ronda se termina y el empate lo gana el más rápido
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** La partida ya no termina en el instante en que alguien se queda sin cartas: se completa la ronda, así todos juegan la misma cantidad de turnos. Si más de uno termina sin cartas, gana quien haya acumulado **menos tiempo respondiendo**. El tiempo no se muestra durante la partida; aparece al final, para cada jugador, en el ranking.
**Por qué:** Antes ganaba automáticamente el que jugaba primero en el orden de turnos, que es una ventaja repartida por sorteo y no por mérito. Con la ronda completa, todos tienen las mismas oportunidades, y el desempate premia algo que el juego sí mide: quién resolvió más rápido.
**Cómo:** Cada dispositivo cronometra el turno desde que el jugador ve el tablero (después de la pantalla de pase o del veredicto anterior) hasta que confirma, y manda ese `ms` dentro del mensaje `place`. El motor lo suma por jugador y lo usa solo para desempatar; con `ms` ausente cuenta cero, así que las partidas guardadas antes de este cambio se siguen reproduciendo sin romperse. El fin de ronda es `moves.length % players.length === 0`.
**En pantalla:** El ranking muestra el tiempo de cada jugador en segundos; si dos caen en el mismo segundo, todos pasan a mostrarse con una décima, porque si no el orden parecería arbitrario justo cuando el tiempo es lo que decidió la partida. La fila del ranking no repite "sin cartas" (ya lo dice la nota de arriba), así cada jugador cabe en una línea.
**Consecuencias:** Cada jugada tiene un tope de 5 minutos (`MAX_MOVE_MS`): una ida al baño no puede decidir un desempate. Si alguien recarga la página a mitad de su turno, el cronómetro de ese turno parte de nuevo; se prefiere eso a guardar relojes en la sesión. El tiempo lo mide y lo declara el propio dispositivo del jugador: no es a prueba de tramposos y no pretende serlo (el canon C-10 es para la información oculta, no para esto). Un empate exacto al milisegundo sigue siendo posible y se muestra como empate.

## D-32 · Línea de Tiempo: pozo común
**Fecha:** 2026-09-10 · **Estado:** corregida por D-43
**Decisión:** La pantalla de configuración ofrece dos formas de repartir: **mano propia** (la de siempre) o **pozo común**, donde hay una sola tira de **6 cartas a la vista de todos** y cada uno juega de ahí. Cuando una carta sale de la tira —porque entró a la línea o porque se falló— entra otra del mazo **por el final**, así el orden de las que ya estaban no cambia. Con pozo común gana quien coloque primero la cantidad de cartas acordada; el selector que decía "Cartas en mano" pasa a decir "Cartas para ganar".
**Por qué:** Con mano propia cada uno juega su suerte: te puede tocar una mano fácil o una imposible, y nadie más ve lo que tienes. Con el pozo común todos miran las mismas cartas, así que el mérito es de quien elige mejor, y se puede comentar la jugada del otro (que es justo lo que hace el chat).
**Cómo:** El motor recibe `shared` y `visible`; la tira se deriva igual que todo lo demás, de la semilla más la lista de jugadas, así que los dispositivos llegan a la misma tira sin mensajes extra (canon C-7). Una carta fallada **no** vuelve a la tira: el veredicto acaba de mostrar su año a todo el mundo, así que dejarla sería regalarle el punto al siguiente. El ajuste viaja en la `config` de la sala, de modo que el que se une juega con lo que eligió el anfitrión.
**Por defecto (v0.16):** El pozo común quedó como opción marcada al abrir la configuración, y en la lista va primero. Con mano propia cada uno mira su mano en silencio; con el pozo común todos miran lo mismo y la partida se comenta sola, que es lo que se busca en un juego de salón.
**Consecuencias:** El final por meta se combina con lo de D-31: la ronda se juega completa y, si más de uno llega a la meta, gana el más rápido. Si el mazo se acaba, gana quien colocó más. El récord del solitario se guarda aparte (`tema:cartas:pozo`), porque son dos juegos distintos. El marcador muestra `colocadas/meta` en vez de las cartas que quedan.

## D-33 · Fuera la barra de "Llevas"
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Se elimina la barra fija que repetía, sobre la línea, la carta que el jugador tenía elegida ("Llevas … Cambiar ↑"). La carta elegida se sigue marcando en la mano (borde amarillo, el resto atenuado) y se dibuja dentro de la ranura elegida antes de confirmar.
**Por qué:** Se agregó para que no se perdiera de vista la carta al recorrer una línea larga, pero en la práctica queda pegada justo encima de la mano, mostrando la misma carta dos veces a dos centímetros de distancia. Probándolo en un celular real se ve redundante y confunde: parece un control más, no un recordatorio.
**Consecuencias:** Con una línea muy larga y sin ranura elegida todavía, el jugador ya no tiene el recordatorio a la vista. Si vuelve a molestar, la salida no es reponer la barra sino mostrarla **solo** cuando la mano se sale de la pantalla.

## D-34 · Mazos de Chile y cultura pop, y cartas que no se repiten
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Se agregan dos temáticas, **🇨🇱 Chile** (114 cartas) y **🍿 Cultura pop** (110), y un mecanismo para que jugar seguido no repita los mismos hitos: cada celular recuerda las cartas vistas por temática y, al armar una partida, las más recientes quedan fuera del mazo. La lista de excluidas viaja en `config.skip`.
**Por qué:** El juego funcionaba igual de bien en Santiago que en Oslo, que es otra manera de decir que no tenía nada propio. El mazo chileno es lo único de la app que hace que alguien diga "esta la sé". Y con noventa cartas y partidas de veinte, jugar tres veces la misma noche empezaba a mostrar las mismas cartas: eso mata la gracia de un juego que se trata de no saber.
**Cómo:** El filtro se aplica sobre la lista de cartas **antes** de barajar, así que sigue siendo determinista y todos los dispositivos de una sala arman el mismo mazo (canon C-7). Se guarda un máximo de 200 ids por temática y se excluyen solo las últimas, dejando siempre al menos 70 cartas disponibles: con manos de siete y seis jugadores nunca falta mazo. Una partida guardada de antes, sin `skip`, se sigue reproduciendo igual.
**Consecuencias:** Medido con diez partidas seguidas de la misma temática: **cero cartas repetidas entre una partida y la siguiente**, y 70 hitos distintos en 80 repartidos. La memoria es por celular, no por sala: quien crea la partida es el que aporta su historial, que es lo razonable porque es quien más ha jugado.

## D-35 · El chat sigue vivo en la pantalla final
**Fecha:** 2026-09-10 · **Estado:** vigente · **Relación:** revisa D-28
**Decisión:** El chat de sala ya no se apaga al terminar la partida: sigue disponible en la pantalla de victoria o derrota, en Línea de Tiempo y en Toque y Fama. Muere con la **sala**, no con la partida; la revancha crea una sala nueva y empieza con el chat en blanco.
**Por qué:** El final es justo cuando la gente tiene algo que decir: el que ganó quiere celebrarlo y el que perdió quiere reclamar o pedir revancha. Apagar el chat ahí cortaba la conversación en su mejor momento, y obligaba a coordinar la revancha fuera de la app. La razón original para apagarlo (que no compitiera con las pantallas de veredicto, D-28) sigue valiendo para el veredicto de cada jugada, que es un aviso corto que se cierra solo; la pantalla final no tiene apuro.
**Consecuencias:** La pantalla de resultado deja aire abajo (`body.chat-on`) para que la burbuja no tape los botones de revancha, cambiar modo y volver al menú (C-8). El canon C-15 se corrige: el chat muere con la sala.

## D-36 · El veredicto habla de quien jugó
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** En Línea de Tiempo, la pantalla de veredicto se dirige al jugador correcto: si la jugada fue mía dice “¡Te equivocaste!” o “¡Correcto!”; si fue de otro, “¡Cata se equivocó!” o “¡Cata acertó!”. La explicación también cambia de persona (“La puso antes de…”, “roba una nueva”), y el fondo rojo del error queda solo en la pantalla de quien se equivocó.
**Por qué:** En varios celulares el veredicto se muestra a todos. Decirle “¡Te equivocaste!” a alguien que estaba mirando es confuso y, con el fondo rojo, se siente como un reto inmerecido. Para el que mira es una noticia, no un error.
**Consecuencias:** El canon C-8b se precisa: la señal fuerte del error es para quien lo cometió. En un celular y en solitario no cambia nada, porque quien mira la pantalla es siempre quien acaba de jugar. Prueba: `tools/e2e/linea-de-tiempo-veredicto.mjs`.

## D-37 · Cartas que se puedan situar en el tiempo
**Fecha:** 2026-09-10 · **Estado:** corregida por D-278
**Decisión:** Una carta no puede describir un hecho que se repite en la historia sin algo que la ancle a su año. Se sacó “un gran incendio golpea los cerros de Valparaíso” y “el terremoto de marzo sacude la zona central”; “el movimiento estudiantil se toma el año” pasó a nombrar a Camila Vallejo, y el incendio de Valparaíso a decir que fue el mayor de su historia y cuántas casas se llevó.
**Por qué:** Chile tiene terremotos, incendios y marchas cada pocos años. Si la carta no dice cuál, el jugador no está pensando, está adivinando, y eso rompe el juego para todos.
**Consecuencias:** Regla para escribir mazos: superlativo, nombre propio o cifra que ancle el año. Si no hay ninguno, la carta no entra. Vale también para los mazos futuros.

## D-38 · La carta la elige el jugador, nunca la app
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Línea de Tiempo deja de preseleccionar la primera carta de la mano. Si el jugador no tocó ninguna, no hay nada elegido: las ranuras no reaccionan y el botón de confirmar se queda deshabilitado. Además, ese botón ahora **dice qué carta va a colocar**, con su emoji y su título.
**Por qué:** Un jugador reportó que eligió una carta, la puso en la línea y apareció otra. Es cierto y se reproduce: la mano es una tira que se desplaza a lo ancho, y en un celular un toque con un par de píxeles de arrastre se convierte en scroll y el `click` nunca ocurre. Como la app dejaba siempre preseleccionada la primera carta, el jugador tocaba la ranura, confirmaba… y colocaba una carta que nunca eligió. Con el pozo común (seis cartas a la vista) hay que desplazarse más, así que el problema se volvió más probable.
**Consecuencias:** Un toque perdido ya no coloca nada: el jugador ve que no pasó nada y vuelve a tocar. El botón nombrando la carta cierra el caso contrario (haber elegido otra sin darse cuenta), y se suma a las dos señales que ya existían: el borde amarillo en la tira y el fantasma de la carta dentro de la ranura. Regla general: **ninguna acción irreversible puede ejecutarse sobre algo que el jugador no eligió explícitamente** (canon C-8). Prueba: `tools/e2e/linea-de-tiempo-eleccion.mjs`.

## D-39 · Las salas vencidas se barren con una papelera pública
**Fecha:** 2026-09-10 · **Estado:** vigente · **Relación:** corregida por D-321 (the note goes in the write that creates the room)
**Decisión:** Firebase gana un nodo `cleanup` que es el índice de salas por borrar: `cleanup/days/<día>` junta los códigos creados ese día y `cleanup/sweptDay` es la marca de agua de lo ya barrido. Al crear o entrar a una sala, el celular apunta su código en el balde del día; además, como mucho una vez cada 6 horas, barre en segundo plano los baldes pendientes (siempre los últimos 8 días, y hasta 30 si venía atrasado) borrando esas salas y el balde. Un balde solo se puede leer y borrar 6 horas después de su último apunte.
**Por qué:** Una sala vence a las 6 horas pero nadie la borraba: el que la creó ya cerró el navegador, y la limpieza solo ocurría por casualidad, cuando una sala nueva sacaba el mismo código de cuatro letras que una vencida. La base crecía para siempre con partidas y chats muertos. El plan gratuito no tiene Cloud Functions, así que el barrendero tiene que ser el mismo celular que juega.
**Por qué un índice y no listar `rooms/`:** dejar leer `rooms/` entero regalaría los códigos de todas las salas **vivas**, y con el código se lee el chat (C-15). La condición de las 6 horas sobre el último apunte hace que un balde solo se pueda abrir cuando todas sus salas ya vencieron: el índice nunca delata una sala en juego.
**Dos cosas que aparecieron al probarlo contra Firebase de verdad:** las reglas no dejan borrar una sala que no existe, y eso es un caso corriente (un barrido anterior que se cortó, o un código reusado), así que un solo apunte huérfano habría dejado su balde —y todos los días siguientes— sin barrer para siempre: ahora un apunte sin sala cuenta como trabajo hecho. Y tampoco dejan pisar un código ya apuntado, así que el apunte va en una escritura separada del `lastAt`; si no, cada jugador que entraba a una sala dejaba un `permission_denied` en la consola. El que crea la sala la apunta con la hora del servidor, no con la del celular.
**Consecuencias:** (Amended by D-321: the creator notes the room in the same write that creates it, and a code can be noted again.) La marca de agua es pública y cualquiera puede adelantarla, por eso el barrido siempre repasa los últimos 8 días aunque la marca diga lo contrario. Un balde que no se deja leer o cuyas salas no se dejan borrar corta el barrido y queda para la próxima: nunca se salta un balde. Todo esto es "mejor esfuerzo": si falla, la partida sigue igual y barre el celular siguiente. Las salas creadas antes de esta versión no están apuntadas en ningún balde; se borran una sola vez a mano desde la consola de Firebase. Módulo `assets/js/transport/cleanup.js`, con tests en `cleanup.test.mjs`; reglas en `firebase/database.rules.json`.

## D-40 · Una falla de red no se cuenta como "no hay internet"
**Fecha:** 2026-09-10 · **Estado:** vigente · **Relación:** extended by D-319 (the button says it is waiting, and the one-phone way out is a button under the message)
**Decisión:** Crear o entrar a una sala espera primero la conexión con la base (`.info/connected`, 8 s) y después corre con tope (12 s). Los códigos `offline`, `busy` y `no-code` comparten un texto nuevo (`errOffline`) que nombra las dos causas posibles sin elegir una, y ofrece el modo de un solo celular. El mapa de código a texto, que estaba copiado igual en los tres juegos, vive ahora en `assets/js/transport/errors.js`.
**Por qué:** `join` distinguía sus errores, pero `create` mandaba todo a `errNet` — *"No se pudo conectar. ¿Hay internet?"*. El plan gratuito tiene techo de conexiones simultáneas: cuando se llena, el jugador leía que su internet estaba mala. Además, sin espera ni tope, quedarse sin señal se veía como un botón pegado para siempre, que es lo que C-14 prohíbe.
**Por qué un solo texto para tres causas:** desde el navegador no se pueden distinguir. Quedarse sin señal y toparse con el tope de conexiones producen exactamente el mismo síntoma: `.info/connected` nunca pasa a `true`. Inventar una causa sería mentirle al jugador con más precisión que antes, no con más verdad. El texto dice lo que se sabe ("puede ser tu internet o que haya mucha gente jugando") y da la salida que la app ya tenía.
**Lo que apareció al probarlo:** bloquear la URL de Firebase no sirve para provocar el error — el canal de RTDB es un WebSocket y se cuela igual. Hay que emular la red caída, y recién después de precargar el módulo del transporte: si no, lo que falla es la descarga del SDK desde gstatic y nunca se llega a probar la espera de conexión. Eso obligó a exponer el CDP crudo en `tools/e2e/cdp.mjs`.
**Consecuencias:** Los errores previstos ya no van a la consola; solo los inesperados (`failWith`), que es lo que hace útil el criterio de "consola limpia" de C-12. Módulo `assets/js/transport/errors.js` con tests en `errors.test.mjs`; prueba de punta a punta en `tools/e2e/room-error.mjs`, que verifica el mensaje en los tres juegos y en los dos idiomas.

## D-41 · Tope de salas por celular, sabiendo que no ataja al que quiere abusar
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Un celular puede abrir hasta 20 salas por hora y 80 por día, contadas en `localStorage`. El tope se revisa antes de tocar la red y falla con `too-many`, que tiene su propio texto. Si `localStorage` no se puede leer, se deja crear.
**Por qué:** El plan gratuito tiene techo de conexiones y de descarga mensual, y la app es estática: no hay servidor que modere nada. Esto ataja el caso realista —una pestaña en bucle, un script ingenuo, un error nuestro creando salas sin freno— a un costo mínimo.
**Lo que no hace, dicho claro:** no frena a nadie decidido. Quien quiera abusar le pega a la REST API con `curl` y jamás carga este módulo. Cerrar esa puerta de verdad pide autenticación anónima y reglas con `auth != null`: otro modelo de seguridad y otra decisión. Si alguna vez el uso muestra tráfico que no se reconoce, ese es el paso siguiente — no subir este tope.
**Por qué 20 y no 6:** la revancha abre una sala nueva (C-7) y una partida dura minutos, así que quien juega en serie abre muchas salas seguidas siendo legítimo. Un tope pensado para el promedio habría dejado afuera a los que más juegan. Un bucle descontrolado abre miles por hora: la distancia es tan grande que no hace falta afinar el número.
**Por qué falla abierto:** dejar pasar a un abusivo es barato; dejar a un jugador legítimo sin poder jugar porque su navegador está en modo privado, no. Es la misma postura que C-6 toma con la memoria de partida.
**Consecuencias:** El tope se revisa antes de la red, así que avisa al instante y no gasta una conexión para después descartarla. Solo cuenta la sala que quedó creada de verdad, no el intento. Módulo `assets/js/transport/ratelimit.js` con tests en `ratelimit.test.mjs`; prueba de punta a punta en `tools/e2e/room-cap.mjs`, que siembra el historial en vez de abrir 20 salas contra Firebase.

## D-42 · Un laboratorio con URL propia para probar interfaz
**Fecha:** 2026-09-11 · **Estado:** derogada · **Relación:** la derogó D-67
**Decisión:** Los cambios de interfaz que valga la pena mirar antes de decidir se prueban en `/lab/`, una carpeta con su propia URL que **espeja** el menú y los juegos que haga falta. Las páginas del laboratorio importan los módulos reales (`game.js`, `rules.js`, `engine.js`, `assets/js/*`): lo único propio es la presentación, en `lab.css` y en el HTML espejado. En reposo `lab.css` está vacío y el laboratorio se ve idéntico a la app.
**Por qué:** Un cambio de aspecto no se puede evaluar leyendo un diff ni mirando una captura suelta: hay que jugarlo en un celular de verdad, y ojalá pasárselo a otra persona. Sin un lugar donde hacerlo, la única forma era publicar el cambio en la app y arriesgarse, o dejarlo en local y no probarlo nunca en el aparato donde se juega. El laboratorio da una URL que se manda por WhatsApp sin tocar lo que funciona.
**Por qué espejar el HTML y no duplicar el juego:** duplicar `game.js` crea un segundo juego que se desincroniza en una semana y vuelve inútil la prueba. Espejando solo el `index.html` y apuntando al módulo real, un arreglo en el juego se ve en el laboratorio sin copiar nada. El costo es que la copia hay que rehacerla si cambia la estructura del `index.html` del juego, que es raro.
**Por qué `lab.css` solo agrega:** se carga después de `base.css` y del `style.css` del juego, nunca en su lugar. La prueba de que un experimento está bien aislado es que borrar `lab.css` deja las páginas funcionando con el aspecto actual. Si algo se rompe, es que se puso ahí una base en vez de un cambio.
**Por qué sin `?v=`:** el laboratorio siempre carga lo último, que es lo que uno quiere al probar. La contra, anotada en su README, es que el navegador cachea `lab.css` y las imágenes, y al iterar hay que forzar la recarga.
**Excepción a C-11:** un cambio que solo toca `lab/` no corre `set-version.py` ni sube el número de versión. Ese canon existe para que el navegador no mezcle archivos viejos y nuevos, y acá no cambió ningún archivo versionado: estampar `?v=` nuevo obligaría a todos los celulares a rebajar el JS y el CSS completos sin nada nuevo que bajar.
**Cómo se migra un experimento aprobado (`tools/lab.py`):** cada bloque de `lab.css` declara con `/* @destino <ruta> */` adónde va el día que se apruebe, y `promover` lo mueve solo: los estilos a su archivo, las imágenes a `assets/img/` con la versión en el nombre —porque `set-version.py` no estampa imágenes— y las rutas de `url()` reescritas según dónde caiga cada bloque, que es distinto desde `base.css` que desde el `style.css` de un juego. Se niega si el árbol de git está sucio: la migración reescribe archivos de producción y su diff tiene que poder leerse solo. Lo que **no** hace es fundir reglas duplicadas ni decidir qué probar: eso queda impreso como lista al terminar. Un migrador que adivina dónde va cada regla es peor que no tenerlo, porque se confía en él.
**Por qué `revisar` importa más que `promover`:** el espejo de un juego puede quedar viejo respecto del `index.html` real sin ningún síntoma —la página carga igual— y uno cree que está probando el juego cuando está probando una copia de hace dos meses. `revisar` compara cada espejo contra lo que debería ser hoy y falla si quedó atrás. Es la única parte de todo esto que ataja un error silencioso.
**Consecuencias:** El laboratorio comparte origen con la app, así que comparte `localStorage` (memoria de partida, idioma, nombre) y las salas de Firebase. Una partida a medias empezada en el laboratorio aparece en el juego publicado. Va con `noindex` y sin `manifest`. Primer uso: las insignias serigrafiadas, descartadas; quedan en los commits `8efd11c` y `d5071c9`.

## D-43 · Línea de Tiempo: todas las cartas a la vista desde el primer turno
**Fecha:** 2026-09-11 · **Estado:** corregida por D-52
**Decisión:** La sección "Cartas" de la configuración pasa de dos opciones a tres: **todas a la vista**, **pozo común** y **mano propia**. Con todas a la vista se despliegan de una vez **el doble de las cartas que hay que colocar para ganar** —6, 10 o 14 según la meta de 3, 5 o 7— y no entra ninguna carta nueva en toda la partida: cada carta que sale, porque entró a la línea o porque se falló, achica la mesa. Es la opción marcada al abrir la configuración, en el lugar que tenía el pozo común.
**Por qué:** Con el pozo común de 6 cartas que se repone, la dificultad es plana de principio a fin: siempre hay caras nuevas y una carta difícil se puede postergar indefinidamente sin costo, porque va a seguir ahí junto a otras cinco recién llegadas. Con la mesa completa y sin reposición la partida tiene curva: los primeros turnos se eligen las fáciles, y lo que queda al final es exactamente lo que nadie se atrevió a situar, sobre una línea de tiempo que además ya está llena de hitos y deja huecos cada vez más estrechos. El juego se pone más difícil solo, sin ninguna regla extra que explicar.
**Por qué el doble de la meta y no una cantidad fija:** la mesa tiene que alcanzar para que todos lleguen a la meta si juegan perfecto, y no mucho más. Con el doble justo, dos jugadores que no fallan nunca terminan empatados en la meta y desempata el tiempo (D-31); cada error le quita a alguien una carta que ya no vuelve. Una mesa más grande devolvería la dificultad plana del pozo común; una más chica haría que la partida se decidiera antes de empezar.
**Cómo:** El motor recibe `refill`. Es la única diferencia con el pozo común: el reparto, la tira compartida, el marcador de `colocadas/meta`, el fin de ronda y los desempates son los mismos (D-32). En la configuración viaja como `spread`, y de ahí se derivan el tamaño de la mesa (`2 × handSize`) y `refill: false`. Las partidas guardadas y las salas abiertas antes de este cambio no traen `spread`, así que se siguen reproduciendo como pozo común con reposición.
**En pantalla:** Con tres opciones el selector ya no cabe lado a lado en un celular, así que va apilado y cada opción lleva su nombre completo (C-8). El contador de arriba a la derecha deja de decir cuántas cartas quedan en el mazo —que en este modo no entra nunca— y dice cuántas quedan en la mesa, que es lo que el jugador está mirando agotarse. La ayuda de la configuración nombra el número concreto y se reescribe al cambiar la meta: "Se despliegan 14 cartas desde el primer turno…".
**Consecuencias:** La mesa se puede vaciar antes de que nadie llegue a la meta, y ahí gana quien colocó más, que ya era el final por mazo agotado del pozo común. En solitario eso significa que se puede terminar sin lograrlo: la pantalla final lo dice con sus propias palabras ("Se acabaron las cartas · Alcanzaste a colocar 1 de las 3 cartas que necesitabas") y **no** se guarda récord, porque si no una partida abandonada a los dos intentos quedaría como la mejor marca. El récord del solitario se guarda con su propia clave (`tema:cartas:mesa`), aparte de la del pozo común y la de mano propia.

## D-44 · Señales de uso para un panel privado del dueño, sin identificar a nadie
**Fecha:** 2026-09-11 · **Estado:** corregida por D-79, D-210, D-349
**Decisión:** Los juegos y el transporte dejan constancia de cada partida en `stats/<entorno>/days/<día>` de Firebase: las salas de dos celulares con juego, hora, versión y los nombres de quienes entraron; los modos sin red (un celular, contra el celular, solo) como un **contador** por juego, modo y cantidad de jugadores, sin nombre ni nada más; y de cualquier modo un contador de zona horaria, idioma del navegador y hora local. Una página nueva, `/panel/`, entra con Google y lo muestra; las reglas solo dejan leer `stats/` y listar `rooms/` al UID del dueño. Documentado en [PANEL.md](PANEL.md).
**Por qué:** Hasta acá no había forma de saber si alguien jugaba, qué juego gustaba ni cuántos se juntaban. La base solo tenía salas vivas que se borran a las 6 horas, nadie podía listarlas (D-39) y los modos sin red no tocaban la red. Un panel con historia pide un registro aparte que la papelera no barra.
**Por qué señales vagas y no personas:** el objetivo es ver uso, no identificar. Que alguien juegue desde Brasil o se llame "Fausto" no dice quién es. Por eso no se consulta ninguna geolocalización por IP (que además sería un tercero) y "de dónde" se contesta con la zona horaria del celular, que es gruesa y honesta. Los nombres de las salas ya viajan a Firebase para que el rival los vea; el registro no los expone más de lo que estaban, y ahora solo el dueño puede listarlos. De los modos sin red no sale ni un nombre, porque hasta hoy no salía nada, y la promesa de privacidad cambia de "no se envía ningún dato" a "no se envía nada que identifique a alguien" (requerimientos no funcionales).
**Por qué REST y no el SDK:** los modos sin red no cargan Firebase, y cargarlo para un contador habría abierto una conexión persistente por cada partida local, que es justo lo que cuenta contra el tope de conexiones simultáneas del plan gratuito (D-41). Un `fetch` con `keepalive` y `{".sv": {"increment": 1}}` suma de a uno en el servidor sin SDK, sin conexión abierta y sin esperar. Las reglas solo aceptan subir cada contador exactamente en uno y crear cada registro de sala una sola vez.
**Por qué Google y un UID en las reglas:** el plan Spark incluye Authentication gratis, los jugadores siguen sin autenticarse y las reglas de Firebase son el único lugar donde una app estática puede guardar un secreto de acceso. El UID no es secreto; sirve para que las reglas fallen cerradas mientras no esté puesto.
**Por qué un entorno en la ruta:** las pruebas de punta a punta pegan contra Firebase de verdad y habrían ensuciado las cifras. `prod`, `lab` y `dev` se separan por la URL desde donde se juega y el panel muestra `prod` por defecto.
**Consecuencias:** `stats/` crece unos cientos de bytes por partida y no se barre: a la escala de esta app es despreciable frente al giga del plan. Cada celular que entra a una sala suma en origen e idioma, así que esas cifras cuentan celulares, no partidas. Lo que entra a la papelera no cambia. Retomar una partida no cuenta como empezar otra; la revancha sí, porque abre partida nueva (C-7). El panel es solo en español (excepción a C-3 anotada en PANEL.md). Quién ganó y cuánto duró no se registran: no interesa por ahora. Módulos `assets/js/transport/stats.js` y `panel/aggregate.js`, con tests; reglas en `firebase/database.rules.json`; pasos de la consola en `firebase/README.md`. Sigue pendiente RP-22: la cuota real no se lee desde el navegador.


## D-45 · El panel separa por entorno también las salas vivas
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** La sección "Ahora" del panel muestra solo las salas del entorno elegido en el selector, cruzando cada sala viva por código contra los que `stats/<env>/days` registró hoy y ayer. Las que quedan fuera no desaparecen sin más: debajo de la lista se nombran con su código, diciendo que no quedaron registradas en ese entorno.
**Por qué:** El selector de entorno separaba `stats/<env>/days`, o sea las cifras de "Últimos 7 / 30 días" hacia abajo, pero "Ahora" lee `rooms/` directo. Y `rooms/` es el nodo real del transporte: hay una sola base, así que una partida de prueba en `localhost` o en el laboratorio abre una sala tan real como la de un jugador, con nombres y todo. Al estrenar el panel aparecieron ahí las salas de las pruebas de punta a punta —Javi, Cata y Nico— indistinguibles de gente jugando. Un panel que cuenta mal las salas en juego y los celulares conectados no sirve para lo que existe, que es mirar el uso real y aproximar la cuota del plan gratuito.
**Cómo:** El entorno no se puede guardar en `rooms/`: las reglas rechazan cualquier campo que no esté previsto, y agregar uno obligaría a tocar las reglas de las salas, que son las que sostienen el juego. Pero el dato ya existe por fuera, en `stats/<env>/days/<día>/rooms/<CÓDIGO>`, y el panel ya lo tiene cargado en memoria para dibujar el resto. El cruce es local, sin pedir nada más a la base. Se miran hoy y ayer y no más atrás, porque una sala vive seis horas como mucho y los códigos de cuatro letras se reciclan: uno de hace tres semanas podría colarse.
**Por qué se nombran las ocultas:** el registro de señales es mejor esfuerzo y falla callado (D-44). Si una sala real no llegó a registrarse, filtrar sin avisar la borraría del panel para siempre y no habría forma de notarlo. La línea de abajo convierte eso en algo visible, y de paso hace obvio cuándo uno está mirando el entorno equivocado (C-14).
**Consecuencias:** Mientras el snapshot de `stats/<env>/days` no ha llegado, no se filtra nada: se prefiere mostrar de más un instante antes que parpadear en blanco. Cambiar de entorno en el selector vuelve a dejar sin filtrar hasta que llega el snapshot nuevo. Las pruebas de punta a punta siguen abriendo salas reales contra Firebase, y eso no cambia: lo que cambia es que el panel ya no las cuenta como uso.

## D-46 · Dos idiomas en las señales de uso, no uno
**Fecha:** 2026-09-11 · **Estado:** corregida por D-47
**Decisión:** Además del idioma del navegador (`lang`, de `navigator.language`), se registra el idioma **elegido en el juego** (`applang`, de `getLang()`). El panel los muestra en dos secciones vecinas: "Idioma del navegador" e "Idioma elegido para jugar".
**Por qué:** Son preguntas distintas y la primera no contesta la segunda. `navigator.language` dice de dónde es la persona y con qué configuró su teléfono; el toggle de la app dice en cuál prefiere jugar. Un celular en `es-CL` jugando en inglés, o al revés, es exactamente el dato que decide si vale la pena seguir manteniendo dos idiomas (C-3) y cuál de los dos se lleva el esfuerzo de las traducciones. Con un solo número no se distingue "nadie juega en inglés" de "no hay nadie de habla inglesa".
**Cómo:** Sale del mismo `fingerprint()` que el resto, con `getLang()` inyectable para poder probarlo. Es un contador más, con el mismo contrato que los otros: sube de a uno y la clave va acotada. El valor es `es` o `en`, no un código de región: el juego solo ofrece esos dos.
**Consecuencias:** Las reglas tienen que aceptar la clave nueva, y **hay que republicarlas a mano en la consola**. Hasta que eso pase, la escritura se rechaza y no se entera nadie —el registro es mejor esfuerzo y falla callado (D-44)—, así que la sección aparece vacía. Por eso su texto de vacío dice "se empieza a contar desde esta versión" y no "nada todavía": distingue no tener datos de estar roto.

## D-47 · Español por defecto; inglés y portugués, solo a pedido
**Fecha:** 2026-09-11 · **Estado:** corregida por D-197, D-324
**Decisión:** Quien entra a juegosdesalon.cl ve la app en español mientras no elija otra cosa. El idioma del navegador (`navigator.language`) no se usa para elegir: sirve como señal de uso (D-46), nunca para decidir qué se muestra. Inglés y portugués son opcionales: se activan solo con el toggle del menú o de la intro de cada juego, y la elección queda en `localStorage` del dispositivo. Con la llegada del portugués, el juego ofrece tres idiomas y no dos, lo que corrige el detalle de D-46.
**Por qué:** El público es chileno y las mesas son de habla hispana; el humor, las referencias y las cartas están pensados primero en español (C-1). Detectar el idioma del teléfono parece amable pero falla en la mesa: un celular configurado en inglés en manos de alguien que juega en español muestra chistes traducidos que nadie pidió, y en una mesa el que sostiene el teléfono no siempre es el dueño. Un valor fijo y predecible (español) más un toggle a la vista es más simple de explicar y de probar que una heurística.
**Cómo:** `getLang()` devuelve lo guardado si es un idioma conocido y, si no, `'es'`. Ningún módulo lee `navigator.language` para decidir textos; solo `stats.js` lo registra como contador. Cada `index.html` declara `lang="es"` y el idioma elegido se aplica sobre `document.documentElement.lang` al cargar.
**Consecuencias:** Agregar un idioma es sumarlo a `LANGS`, al toggle y a los `LOCALES`; no cambia el arranque. Las pruebas de punta a punta parten siempre en español salvo que toquen el toggle. Si algún día se quiere ofrecer el idioma del navegador, será una sugerencia visible y no un cambio silencioso.

## D-48 · Portugués de Brasil como tercer idioma, en las mismas claves
**Fecha:** 2026-09-11 · **Estado:** corregida por D-197, D-222
**Decisión:** La app se puede jugar entera en portugués: menú, frases del pie, los cuatro juegos con sus modos, salas, chat, errores de transporte, pantallas de pase y las cartas de los cuatro mazos de Línea de Tiempo. Es portugués **de Brasil**, informal ("você", "celular", "bora jogar", "vira, vira, vira"), y se agrega como un tercer diccionario `pt` con exactamente las mismas claves que `es` y `en`: en `COMMON` de `i18n.js`, en `games.js`, en `FRASES`, en `LOCALES` de cada `rules.js`, en el nombre y la pista de cada mazo y en cada carta. Los nombres de los juegos se traducen, como ya se hacía en inglés: Quarto Rei, Toque e Fama, Batalha Naval, Linha do Tempo; los mini-juegos de Cuarto Rey pasan a Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco y Eu Nunca; los sorbos son "goles", la penitencia es "prenda".
**Por qué:** Brasil es el vecino más grande y el panel ya mostraba celulares en `pt-BR` (D-44). Se elige la variante brasileña y no la europea porque es la que van a leer casi todos los que toquen el botón, y porque las dos difieren justo en las palabras que la app más usa ("celular" contra "telemóvel", "você" contra "tu"). Un solo diccionario con las mismas claves, y no un idioma "parcial" que caiga al inglés donde falte, porque una pantalla a medias en dos idiomas se ve peor que no ofrecer el idioma: C-3 dice que toda la experiencia va en el idioma elegido.
**Cómo:** `LANGS = ['es', 'en', 'pt']` y una etiqueta 🇧🇷 PT en el toggle; `yearLabel` de Línea de Tiempo usa "a.C." para español y portugués y "BC" solo para inglés; el test del motor exige `pt` en cada carta y rechaza apóstrofos rectos dentro del texto. `room-error.mjs` prueba el mensaje de sala caída también en portugués. Las traducciones se adaptan (C-3): las comunas de Santiago son bairros, los equipos chilenos son times brasileiros, y las frases del pie se reescribieron con humor de rolê.
**Consecuencias:** Cada texto nuevo se escribe tres veces, y las claves tienen que coincidir en los tres diccionarios (`assets/js/i18n.test.mjs` lo verifica: claves, largo de listas, `{llaves}` y textos vacíos). El panel del dueño sigue en español (excepción anotada en PANEL.md) pero etiqueta `pt` en "Idioma elegido para jugar". El `manifest.webmanifest` sigue en español: es uno solo para la app y no cambia con el toggle. Una partida guardada en un idioma se retoma en el idioma activo, como ya pasaba entre español e inglés (D-16).

## D-49 · Las frases del pie dejan el humor de carrete por chistes genéricos de sobremesa
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Las 100 frases por idioma de `assets/js/frases.js` (D-48) se reemplazan enteras: ya no hacen chistes sobre los juegos de la app (Toque y Fama, Cuarto Rey, etc.) ni mezclan mensajes de agua, moderación o manejar sobrio. El contenido nuevo es humor genérico de sobremesa —chistes cortos, sobre la vida, para ligar y de WhatsApp—, pedido explícitamente por el dueño a partir de una lista de 200 frases en español que traía además una categoría de chistes de cumpleaños. Se descartó esa categoría completa por no tener sentido en el contexto del juego, y de las 163 frases restantes se descartaron duplicadas (algunas venían repetidas dentro de la lista original), una frase con una traducción rota en el propio español, tres chistes de pronunciación fingida en otro idioma (por el estereotipo que cargan y porque no se pueden adaptar a inglés o portugués sin perder el chiste) y algunas frases de ligar demasiado explícitas o que nombraban a personas reales, hasta llegar a las 100 exigidas por `assets/js/i18n.test.mjs`. Cada frase se tradujo adaptando el chiste (C-3), no calcándolo: los juegos de palabras que solo funcionan en español se reemplazaron por un chiste equivalente en inglés y en portugués de Brasil, no por una traducción literal.
**Por qué:** Es un pedido directo y explícito del dueño de reemplazar el contenido existente por uno nuevo. Selección y traducción quedaron en manos de Claude porque el pedido no especificaba cuáles de las 200 frases usar ni cómo resolver el choque con el tope de 100 por idioma que exige el test.
**Consecuencias:** Se pierde el humor específico de la app (las referencias a Toque y Fama, Cuarto Rey, etc.) y los mensajes de agua/moderación/no manejar tomado que mezclaban las frases anteriores; el pie del menú ya no tiene relación temática con los juegos. La selección de cuáles 100 frases entran es una decisión editorial de Claude, no una lista cerrada del dueño: si alguna no cuadra, se ajusta a mano en `assets/js/frases.js` respetando el tope de 100 por idioma y sin frases repetidas (C-13).

## D-50 · Una sala cancelada se cierra sola: despedida explícita y borrado en el acto
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** El transporte suma una despedida (`dispose()`, `assets/js/transport/dispose.js`) aparte de `leave()`. Quien se va **a propósito** —cancela la sala en el lobby, se sale de ella, cambia de modo al terminar, o se muda a la sala de la revancha— escribe `left: true` en su rol y, si con eso no queda nadie adentro, borra la sala en el acto. Las reglas de Firebase dejan borrar una sala viva únicamente cuando todos los jugadores que están adentro se despidieron. El panel deja de mostrar como vivas las salas en ese estado.
**Por qué:** Una sala vivía sus seis horas pasara lo que pasara: la papelera (D-39) recién puede tocarla cuando vence, porque el índice de limpieza se lee solo cuando ya no queda nada vivo adentro. Eso está bien para las partidas que se terminan solas, pero dejaba viva —y en el panel del dueño con nombre, código y "creada hace 5 min", igual que una partida de verdad— cada sala que alguien abrió y canceló: creó la sala, nadie llegó, se fue. Cada revancha dejaba otra. El panel existe para mirar el uso real (D-44) y estaba contando fantasmas.
**Por qué una despedida y no una desconexión:** `online: false` ya existía y no sirve para esto. Quedarse sin señal, bloquear el celular o cerrar la pestaña apagan `online`, y esas partidas se pueden retomar hasta que la sala venza (C-6): tratarlas como canceladas borraría salas que alguien está por volver a abrir. El caso más claro es el que más duele: crear la sala, salir a mandar el código por WhatsApp y volver. Por eso nada de esto cuelga de `pagehide` ni de `visibilitychange`, solo de un gesto del jugador, y al reconectar se limpia la despedida (`left: false`) por si quedó una a medias.
**Cómo:** Son dos pasos, porque las reglas miran la sala como está *antes* del borrado: primero la despedida, después el borrado si al releer los jugadores no queda nadie. Nada de eso lanza ni se muestra, y lleva un tope corto (`LEAVE_MS`, 4 s): quien ya se está yendo no puede quedarse con el botón pegado. Si algo falla, la sala queda marcada y la borra la papelera cuando venza. El nombre del que se fue no se borra: la sala sigue diciendo quién estuvo. La regla de borrado enumera los seis roles (A–F) porque las reglas de Firebase no saben recorrer hijos.
**Interfaz:** el lobby de los tres juegos con sala gana un botón al final, "Cancelar la sala" para quien la creó y "Salir de la sala" para quien se unió. Antes no había ninguna salida explícita: se volvía al menú con la flecha de arriba, que es una navegación y no una intención.
**Consecuencias:** Las reglas se **publican a mano** en la consola ([Realtime Database → Rules](https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules)), paso que ya se hizo para esta versión. Mientras unas reglas nuevas no estén publicadas, la despedida se escribe igual pero el borrado se rechaza y la sala espera su vencimiento; el panel igual deja de mostrarla viva, porque eso lo decide el cliente. Alguien que sepa el código de una sala puede escribir la despedida de otro rol y, si todos quedan despedidos, borrarla: es el mismo alcance que ya tenía cualquiera que supiera el código (puede leer la sala y escribir mensajes, C-15), y no abre nada nuevo. Una sala que se quedó sin jugadores apuntados no se borra: `deserted` exige que haya alguien adentro, para que la sala recién creada —que existe un instante sin jugadores— no sea borrable por nadie.

## D-51 · El README se sostiene solo: lo derivable se genera, lo escrito se delata, las capturas se rehacen
**Fecha:** 2026-09-11 · **Estado:** corregida por D-205 · **Relación:** desde D-205 `revisar` lo corre el check `pruebas`, no `set-version.py`
**Decisión:** El README deja de mantenerse a pulso. `tools/release/facts.mjs` importa los módulos reales y arma una hoja de hechos (juegos, modos, temáticas con su cuenta de cartas, idiomas, módulos, tests, documentos, capturas). `tools/release/readme.py` la usa para tres cosas: **generar** lo derivable dentro de marcas `<!-- generado: ... -->`; **delatar** lo que cambió desde el último sello (`docs/facts.json`) nombrando qué sección de prosa hay que releer, con `sellar` para anotar que se releyó; y **rehacer las capturas** corriendo los guiones de `tools/e2e/` según el catálogo `docs/capturas.json`, que dice de qué guion y de qué toma sale cada imagen. `set-version.py` corre `revisar` antes de estampar, así que un README viejo frena la publicación (C-11, C-13).
**Por qué:** El README es la cara del proyecto y la única documentación que lee alguien de afuera, y se pudre en silencio. Al escribir esto decía "las cartas de los cuatro mazos" cuando había seis, daba a Cuarto Rey una versión que su propia especificación no reconocía, y sus capturas eran de pantallas que ya habían cambiado. Nada de eso lo avisa un test: son datos repetidos a mano en prosa. Repetidos a mano y sin dueño, cada cambio de la app los deja un poco más falsos.
**Por qué no generarlo todo:** Porque lo que hace bueno a este README es lo que no se puede derivar: por qué el juego está entretenido, qué se siente al pasar el celular, el chiste de las temáticas. Un README generado entero sería un listado correcto que no lee nadie. Por eso la herramienta se parte en dos: escribe las tablas y deja la prosa en paz, pero no deja que la prosa envejezca callada.
**Por qué el sello y no la fecha del commit:** Comparar fechas de git (¿el README es más nuevo que el código?) grita con cualquier cambio, hasta el de una coma, y a un soplón que grita por todo no lo mira nadie. El sello compara **hechos**: las claves de los modos, los mazos, los tests. Un texto de ayuda que se corrige no molesta a nadie; un modo nuevo sí, y es el que efectivamente obliga a releer.
**Por qué las capturas salen de las pruebas y no de la mano:** Los guiones de `tools/e2e/` ya juegan partidas completas en Chrome headless y sacan capturas para revisarlas (C-12). Sacarlas de ahí no cuesta nada, garantiza que la imagen es de una partida de verdad y no de un estado armado, y hace que una pantalla nueva en el README sea una toma nueva en un guion: algo que después se puede repetir. Las que necesitan una sala de Firebase van marcadas y se saltan con `--sin-red`.
**Consecuencias:** Dentro de las marcas no se edita a mano: lo que se escriba ahí lo pisa `actualizar`. Agregar una pantalla al README son tres pasos (toma en el guion, entrada en el catálogo, `capturas` y `actualizar`). Las capturas se guardan al doble del ancho con que se muestran y con paleta de 256 colores, para que rehacerlas seguido no engorde el repo. Los guiones de e2e calibran sus esperas para una máquina desocupada: con el computador ocupado fallan a medias, y entonces `capturas` deja la imagen vieja en su lugar y lo dice. El estado de cada juego sale de la cabecera de su especificación (`docs/juegos/<id>.md`): si ahí dice una versión vieja, la tabla del README la repite, y ese es el archivo que hay que arreglar.

**Qué no cuenta como cambio:** el estampado de versión. `set-version.py` reescribe los seis `index.html` en cada publicación (C-11), así que medir la edad de una captura contra "la última vez que se tocó la carpeta del juego" dejaba viejas, publicación tras publicación, a las capturas de juegos que nadie había tocado. `git_fecha` se salta los commits —y los cambios sin commitear— cuyo único contenido en esos caminos son las marcas `?v=` y la versión del pie: compara las líneas quitadas contra las puestas con el número de versión borrado, que es lo que distingue un estampado de un módulo nuevo en el import map (la misma línea cambia en los dos casos). Lo prueba `python3 tools/release/readme.test.py`. Sin esa salvedad el aviso salía siempre y dejaba de querer decir algo, que es la única forma en que este canon se muere.

## D-52 · El selector de Cartas va en fila, como el toggle de idioma
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Las tres formas de repartir de Línea de Tiempo (todas a la vista, pozo común, mano propia) dejan de ser tres botones apilados y pasan a ser un selector de una sola fila (`.seg--cards`), con el mismo aire que el toggle de idioma: tres pastillas, la elegida en amarillo. El emoji va arriba y el **nombre completo** debajo, en dos líneas si hace falta.
**Por qué:** Apiladas, las tres opciones medían 169 px de alto en un celular de 375 px: un tercio de la pantalla para un ajuste que se toca una vez. La pantalla de configuración ya es larga (temática, jugadores, cartas, cartas para ganar) y el botón de jugar quedaba lejos. En fila el control mide 78 px y la pantalla entera se acorta casi 100 px, que es justo lo que hace falta para que el final de la configuración se vea sin desplazar tanto (C-8).
**Cómo:** El emoji sale del texto (`LOCALES` guarda solo el nombre) y pasa a `CARD_MODES` en `game.js`, que es donde vive el resto de lo que define cada modo. Así el botón puede dibujarlo en su propia línea, más grande, y el nombre queda libre para partirse en dos renglones (`text-wrap: balance`) en vez de abreviarse. Cabe en portugués —el idioma de nombres más largos— y a 320 px de ancho, sin scroll horizontal y con 68 px de alto por pastilla, bastante más que los 44 px del canon.
**Por qué el nombre completo y no una abreviatura:** el nombre es lo que distingue las tres formas de jugar, y la ayuda de abajo explica la elegida pero no nombra a las otras dos. Partir el texto en dos líneas cuesta unos píxeles; abreviarlo cuesta que alguien elija a ciegas.
**Consecuencias:** `seg--stack` deja de existir (era el único uso) y con él la regla que ponía el texto a la izquierda. Los scripts de punta a punta que buscaban `.seg--stack` apuntan ahora a `.seg--cards`; los que buscan por texto siguen igual, porque los nombres no cambiaron. Los emojis siguen viéndose en pantalla, así que la sección del README que describe las tres formas sigue siendo cierta tal cual está.

## D-53 · El ahorcado se juega en cadena: nadie se queda mirando
**Fecha:** 2026-09-12 · **Estado:** corregida por D-66
**Decisión:** En El Ahorcado, cada jugador le escribe la palabra **al siguiente** y el último al primero; todos adivinan una palabra y todos ponen una. La alternativa —la app reparte del mazo— queda como la otra opción del selector "La palabra" (`🤝 Cadena` / `🎴 Mazo de la app`), con cadena marcada por defecto. El puntaje son **los errores que le sobraron a quien adivinó**; quien pone una palabra no suma nada.
**Por qué:** El ahorcado de toda la vida reparte mal los papeles: uno juega y el otro mira cómo juega. Con la cadena el juego es simétrico sin dejar de ser el ahorcado, funciona igual con dos que con seis, y el modo "fiesta" no necesita código propio: es varios celulares con más gente adentro.
**Por qué el verdugo no suma:** si colgar a la víctima diera puntos, la jugada ganadora sería poner una palabra imposible, que es exactamente lo que arruina al ahorcado. Sin premio, una palabra impenetrable solo le quita puntos al de al lado —y él te escribe la tuya en la misma partida.
**Consecuencias:** Con cadena hay un secreto por celular, así que corre el compromiso con hash (C-10); con mazo no hay secreto que comprometer. En un celular la cadena obliga a una vuelta de pantallas tapadas antes de empezar: de cuatro jugadores para arriba se hace largo, y por eso la recomendación de la especificación es de dos a cuatro.

## D-54 · La misma palabra para todos, solo cuando juegan a la vez
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Con el mazo de la app, en varios celulares toda la mesa recibe **una sola palabra**; pasándose un celular, cada jugador recibe **una distinta**.
**Por qué:** La misma palabra para todos es la comparación más justa que existe: mismo largo, mismas letras, mismas trampas. Pero en un celular las rondas van en serie, y el segundo jugador estaría adivinando una palabra que acaba de ver revelarse en la pantalla. La regla no es "una o varias palabras": es que la palabra se comparte solo cuando nadie puede haberla visto antes.
**Consecuencias:** `dealWords({ same })` decide con el modo, no con la configuración, así que no hay un ajuste más que explicar. El reparto sale de la semilla y no depende de cuántos sean, de modo que dos celulares de la misma sala llegan a lo mismo sin hablarse.

## D-55 · La tira de rivales muestra vidas y avance, nunca qué letras
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, el chip de cada jugador muestra su nombre, las vidas que le quedan y una barra con cuánto lleva revelado. No muestra las letras que probó ni el patrón de su palabra.
**Por qué:** La tensión de la carrera está en ver que al otro le queda poco, no en copiarle la tarea. Con las letras a la vista, mirar el tablero ajeno pasaría a ser una forma de jugar —y en varios celulares con mazo, donde la palabra es la misma para todos, sería directamente la mejor forma de jugar.
**Consecuencias:** Las respuestas sí viajan por la sala (el reductor las necesita), así que quien abra la consola puede leerlas: es el mismo trato que Línea de Tiempo hace con los años de las cartas. Se acepta y se anota, porque taparlo costaría cifrar mensajes para atajar a quien ya decidió arruinarse el juego.

## D-56 · Una letra errada no bloquea la pantalla
**Fecha:** 2026-09-12 · **Estado:** vigente · **Relación:** excepción a C-8b
**Decisión:** En El Ahorcado, una letra que no está no abre un aviso que haya que cerrar **en los modos donde el celular no cambia de mano** —varios celulares y contra el celular—: se señala con fondo rojo, sacudida, sonido propio, la tecla tachada y el trazo nuevo del dibujo, y el juego sigue. Lo que sí se queda hasta que el jugador toque es el **veredicto de la ronda**: te colgaron, o la sacaste. En un celular es distinto y no por el error: ahí cada jugada termina con el celular cambiando de mano, así que el resultado de la letra y el “pásale el celular a X” van juntos en una pantalla que espera al jugador (C-9, D-59).
**Por qué:** El canon C-8b está escrito para el error que interrumpe —colocar mal una carta—, que pasa pocas veces por partida. Acá errar es la jugada normal: en una partida de seis vidas se falla cinco o seis veces, y en varios celulares todos están jugando al mismo tiempo. Un aviso que hay que cerrar seis veces convierte el juego en un trámite y, peor, le come el turno a quien está corriendo contra otros.
**Consecuencias:** La señal tiene que bastar sin texto, y por eso va por cuatro canales a la vez (color, movimiento, sonido y el dibujo que avanza). El veredicto de ronda mantiene el trato del canon: fondo rojo solo para el que se colgó, tercera persona para los demás.

## D-57 · Acentos plegados, Ñ con tecla propia y solo en español
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Las palabras se comparan normalizadas: mayúsculas, sin tildes y con la Ç plegada a C. Tocar la **A** revela también las **Á**, y la palabra se muestra con su tilde puesta. La **Ñ** es una tecla aparte y existe solo en el teclado español: 27 teclas en español, 26 en inglés y portugués.
**Por qué:** Pedir la tilde exacta convierte el juego en un examen de ortografía y castiga a quien escribe desde un teclado sin acentos. La Ñ es otra cosa: no es una N con adorno sino una letra distinta, y adivinar "año" tocando la N sería tan raro como adivinar "casa" tocando la Z. En inglés y portugués no existe, así que no ocupa una tecla.
**Consecuencias:** `normalize()` aparta la Ñ antes de descomponer el texto, porque en NFD la Ñ es justamente una N con una tilde encima. Una palabra con Ñ escrita en una partida en inglés se rechaza al escribirla, con el mismo aviso que una con números.

## D-58 · Comprar una letra cuesta un error y revela la más rara
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** El Ahorcado ofrece **comprar una letra**: revela la letra que falta más rara del idioma y cuesta un error. Se puede comprar mientras queden dos errores de margen, sin tope de compras, y va con confirmación.
**Por qué:** Le da al turno una decisión de verdad —¿gasto margen por información?— sin regla nueva que explicar, porque el precio se paga en la misma moneda del juego. No necesita tope: cada compra baja el puntaje, así que comprarlo todo es ganar la palabra y perder la partida. Se revela la más rara y no una al azar porque es la que más informa, y así la compra vale lo que cuesta.
**Consecuencias:** Se deshabilita con un solo error de margen —nadie puede comprarse su propia horca— y la letra comprada se pinta distinta (amarilla) de las adivinadas (cian), para que al final se vea cómo se sacó la palabra. Con cadena la elige el celular de quien puso la palabra, que es el único que la conoce, y viaja en la misma respuesta que una letra normal.

## D-59 · Los turnos se alternan letra a letra, no palabra por palabra
**Fecha:** 2026-09-12 · **Estado:** corregida por D-65, D-66
**Decisión:** En los modos por turnos de El Ahorcado —un celular y contra el celular— cada jugada pasa el turno al **siguiente que sigue vivo**: se prueba una letra y le toca al de al lado. Antes cada jugador terminaba su palabra entera y recién ahí pasaba el turno.
**Por qué:** Con rondas completas, el que espera es público de la partida del otro durante seis o siete letras seguidas, que es justo lo que este juego venía a arreglar (D-53). Alternando, todos los tableros avanzan a la vez y la carrera se ve: que al de al lado le quede una vida mientras a ti te quedan cuatro es información que llega en el momento en que sirve. Contra el celular cambia todavía más: antes la máquina jugaba su palabra entera después de que tú terminabas la tuya, y lo último de la partida era mirar.
**Cómo:** El turno sale de la lista de jugadas, no de una variable: `current` es el siguiente vivo después del que hizo la última jugada, y saltea a los que ya terminaron. Una jugada que todavía espera respuesta (cadena) no mueve el turno, así nadie juega encima de una pendiente. ~~Sin turnos —varios celulares— no cambia nada: ahí todos juegan a la vez desde siempre.~~ **D-66 llevó los turnos también a la sala.**
**Cómo se ve contra el celular:** su jugada duraría un parpadeo, así que su tablero se retiene 1,5 s después de que tira la letra, con "El celular probó la X" abajo. Sin esa retención, el turno volvía tan rápido que no se alcanzaba a ver qué había hecho.
**Consecuencias:** En un celular el aparato cambia de mano después de **cada letra**, así que el resultado de la jugada y el pase viajan juntos en una sola pantalla (C-9), y la pantalla de pase suelta queda solo para entrar al primer turno o al retomar una partida. Son más pantallas que antes, pero es el mismo ritmo que Línea de Tiempo: una jugada, un pase. El desempate por letras gastadas y el puntaje no cambian.

## D-60 · Las posiciones de una respuesta viajan como texto
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, el mensaje `reply` manda las posiciones de la letra como una cadena —`"1,4,8"`, o `""` cuando la letra no está— y no como una lista. Al recibir, `readPos()` acepta la cadena, la lista cruda (que es lo que manda el transporte local) y el campo ausente, y devuelve la lista o `null` si no sirve. Además, una respuesta que el otro lado no aplica se reintenta tres veces y se deja de mandar.
**Por qué:** Firebase no guarda una lista vacía: el campo simplemente no queda. Y en este juego la lista vacía no es un caso raro sino la mitad del juego —es la letra que no está—, así que la respuesta llegaba sin `pos`, el reductor la descartaba por no ser una lista, y el aparato de quien puso la palabra la volvía a mandar en cada vuelta. Una letra errada en varios celulares con cadena bastaba para dejar la sala escribiendo sin parar y colgar ese celular. Salió probando de punta a punta, no leyendo el código: el guion se quedaba mudo siempre en el mismo lugar.
**Por qué el tope de reintentos además del arreglo:** el arreglo tapa este caso, pero la forma es la peligrosa. Cualquier mensaje que un lado manda y el otro descarta se convierte en un bucle de escrituras contra la sala, que es lento y caro y no avisa. Con tope, un mensaje que no se puede aplicar deja la partida trabada —visible, y se retoma— en vez de hacer ruido para siempre.
**Consecuencias:** El protocolo de `docs/juegos/ahorcado.md` dice `"pos": "1,4"`. `readPos()` vive en `engine.js` y no en `game.js` justamente para poder probarlo: `engine.test.mjs` cubre el vacío, el ausente, la lista cruda y lo que no sirve. Ningún otro mensaje del juego manda listas que puedan quedar vacías (`order` de `start` tiene dos jugadores como mínimo).

## D-61 · Colgarse no gana, y entre colgados gana quien llegó más lejos
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, el ranking pone primero a todos los que sacaron su palabra —más margen, y a igualdad menos letras y menos tiempo— y después a los colgados, ordenados por **cuántas letras alcanzaron a revelar**. Si no la sacó nadie, no hay ganador: la pantalla dice "No la sacó nadie" con una calavera, y no se corona a nadie ni se le dice a nadie que perdió.
**Por qué:** El desempate por "menos letras gastadas" solo tiene sentido entre quienes sacaron la palabra: sacarla en seis letras es mejor que sacarla en diez. Entre colgados dice exactamente lo contrario —gastar menos letras es haber revelado menos antes de que se acabaran los errores—, así que premiaba al que peor lo hizo. Salió en la primera partida de prueba en varios celulares: los tres se colgaron y la pantalla coronó al que no había revelado ni una letra.
**Por qué nadie gana:** el puntaje del juego son los errores que te sobraron, y al colgado no le sobró ninguno. Coronar al mejor de los que perdieron es contarle al jugador algo que no pasó; con seis jugadores donde cinco se cuelgan y uno la saca, el ranking sigue teniendo sentido sin inventar un ganador donde no lo hay.
**Consecuencias:** `winner` es una lista vacía en vez de "el primero del ranking", así que la pantalla final tiene tres formas: ganador, empate y nadie. `buildState` necesita `total` y `left` para ordenar a los colgados, que ya los calculaba. Cubierto en `engine.test.mjs`.

## D-62 · Con cadena, la temática sugiere en vez de repartir
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Arriba de los campos, antes de pedir nada, El Ahorcado ofrece seis palabras del mazo de la temática elegida, con su emoji. Tocar una llena la palabra y la pista; después se pueden editar las dos, o ignorarlas y escribir la propia. Si se edita la palabra, la sugerencia deja de estar marcada. No se repiten las que ya se pusieron desde ese mismo celular, y cada jugador ve otras.
**Por qué:** Con cadena, la temática elegida en la configuración no hacía **nada**: `deckRoles()` devuelve lista vacía y no se reparte ninguna carta. Y cadena es la opción marcada por defecto, así que en el camino por defecto se le pedía al jugador una decisión que no tenía consecuencia —y que el mensaje de compartir la sala y la tarjeta de retomar anunciaban igual, como si se fuera a jugar con ella.
**Por qué sugerir y no obligar:** convertir la temática en regla ("tiene que ser de Comida") es una regla que nadie puede verificar y que queda en el honor de la mesa. Sugerir resuelve el problema real, que es la pantalla en blanco: pensar una palabra de la nada es lo que más demora la vuelta de escritura, sobre todo de cuatro jugadores para arriba, que es justo donde la especificación avisa que se hace larga.
**Por qué arriba de los campos:** puestas debajo se leían como un detalle opcional, después de que el jugador ya se quedó mirando el campo vacío. Arriba son lo primero que ve, que es el momento en que sirven; el campo libre queda debajo para quien ya sabe qué va a poner.
**Cómo se ven:** el emoji arriba y la palabra debajo, como las tarjetas de temática. Al lado, en dos columnas, la palabra más larga de los mazos —CORDILHEIRA, once letras— se partía a la mitad a 320 px; centrada usa todo el ancho de la pastilla y entra en una línea (C-8).
**Consecuencias:** Las sugerencias se calculan en el celular de quien escribe y **no viajan**: la palabra sigue siendo secreta (C-10). Salen de la semilla de la partida corrida por la posición del jugador, así que al retomar se ofrecen las mismas y en las pruebas son predecibles. La temática vuelve a tener sentido en los tres modos, de modo que el texto de compartir y el de retomar dejan de prometer algo que no pasaba.

## D-63 · Una letra confirmada se ve antes de que cambie el turno
**Fecha:** 2026-09-12 · **Estado:** corregida por D-65
**Decisión:** Al confirmar una letra, El Ahorcado pasa un cartel breve sobre el área del dibujo —"¡Va!" en cian, "No está" en rosa, "Comprada" en amarillo, con la letra al lado— que aparece y se va solo en un segundo, sin pedir ningún toque. Va en **contra el celular** y en **varios celulares**. Además, contra el celular el tablero propio se retiene 900 ms antes de que el turno pase al celular.
**Por qué:** Contra el celular la jugada no abría ninguna pantalla y el turno cambiaba en el acto: el tablero saltaba al del celular sin que se alcanzara a ver cómo había ido la letra propia. El celular ya tenía su retención por D-59; el jugador no. Ahora el trato es simétrico: cada uno tira, se ve cómo le fue, y recién ahí le toca al otro.
**Por qué también en varios celulares:** ahí nada interrumpe a propósito (D-56) y eso sigue igual —el cartel no se toca, no espera y no frena la carrera—, pero el color y la sacudida se pierden si el jugador está mirando la tira de rivales en vez del teclado. Un segundo de cartel lo recupera sin costo.
**Por qué no en un celular:** ahí cada letra ya termina en la pantalla de veredicto y pase, que dice lo mismo y además espera al jugador porque el aparato cambia de mano (C-9, D-59). Sumar el cartel sería un momento de más en cada letra.
**La barra de acciones no flota:** pegada al fondo del viewport se montaba sobre el teclado en cuanto el tablero no entraba —bastaban 16 px—, y tapaba la última fila de teclas. Va en el flujo, y en pantallas cortas el teclado se compacta hasta los 44 px del canon para que igual entre sin desplazar (C-8).
**Cuánto dura:** dos segundos. Con uno, la jugada pasaba antes de que el jugador levantara la vista del teclado, y en la sala eso es todo lo que se ve del turno ajeno.
**Cómo se ve:** un velo sobre el área del dibujo, no un cartel suelto. Suelto y centrado tapaba la palabra y la pista de forma sucia; como velo sobre esa zona se lee deliberado, y la palabra, la tira de rivales y el teclado quedan a la vista. Respeta `prefers-reduced-motion`: sin animación aparece y se va igual, porque es información y no adorno.
**Consecuencias:** Durante la retención del tablero propio no se puede jugar, pero el título sigue diciendo "¡Te toca, Javi!": hablarle en tercera persona sobre su propio tablero era un parpadeo confuso. El cartel se dispara por jugada nueva, así que al entrar o al retomar una partida a mitad no aparece ninguno.

## D-64 · El celular adivina con un diccionario de verdad, no con el mazo
**Fecha:** 2026-09-12 · **Estado:** derogada · **Relación:** la derogó D-65; duró unas horas
**Lo que la derogó:** el modo dejó de ser un duelo. Sin una máquina que adivine, el diccionario
de cien mil palabras y todo `tools/diccionario/` se fueron con ella. Queda anotada porque lo que
costó sacar esas listas —y las tres formas en que la extracción salió mal sin avisar— es lo que
haría falta saber si algún día vuelve a hacer falta un diccionario grande.
**Decisión:** Contra el celular, la IA filtra un diccionario del idioma en curso de más de cien mil palabras (`ahorcado/decks/dict-<idioma>.js`) y no las cien del mazo. El archivo pesa, así que se pide con `import()` al entrar a ese modo y llega mientras el jugador escribe su palabra; si no llegara, el celular sigue jugando con el mazo. Los otros dos modos no lo descargan nunca.
**Por qué:** El diccionario eran las cien cartas del mazo Mezcla. Con una palabra común que no estuviera ahí, el celular sacaba **10 de 74** y gastaba 5,7 errores de 6: no adivinaba, buscaba en una lista corta. Y como el juego empuja a usar las sugerencias del mazo (D-62), el diseño premiaba justo lo que hace el duelo menos interesante. Con el diccionario grande saca **69 de 74** con 2,5 errores.
**De dónde salen las palabras:** de los correctores de macOS, con `tools/diccionario/`. No hace falta red ni inventar listas a mano, y se regeneran con `bash tools/diccionario/generar.sh <idioma>`. La herramienta solo corre en macOS; las listas quedan versionadas, así que solo se necesita una vez.
**Lo que costó sacarlas bien:** la API de completado devuelve **como mucho veinte palabras por prefijo**, así que "par" nunca llega a "paraguas"; y devolver menos de veinte **no** quiere decir que estén todas —el corrector inglés contesta doce para "j" y se queda ahí, dejando afuera *january* y *journey*—. Por eso los primeros tres niveles se abren siempre y de ahí en más solo donde trunca. Además la corrida es larga y se cortaba a mitad de camino sin avisar: la primera versión salió con 138 mil palabras y **medio alfabeto afuera**, ni una con "camp", y parecía correcta justamente por lo grande. Ahora va letra inicial por letra inicial y en anchura.
**La poda:** dos de cada nueve palabras del español eran formas verbales que nadie escribe en un ahorcado (*ejecutaríamos*, *silbásemos*). `podar.py` las saca exigiendo que el infinitivo exista y usando solo sufijos inequívocos: los participios quedan **fuera** de la poda porque *pescado*, *helado*, *comida*, *salida* y *bebida* son sustantivos de todos los días. Baja un 19% el peso, no cambia el acierto y deja cada jugada en la mitad de tiempo.
**Consecuencias:** `dictionary(lang)` devuelve el mazo hasta que el grande llega, y `loadDictionary(lang)` lo trae. Los `dict-*.js` entran en `set-version.py` porque el import map también alcanza a los `import()` dinámicos: sin eso quedarían cacheados sin forma de invalidarlos (C-11). `cpuGuess` normaliza una sola vez por diccionario, que con cien mil palabras se nota. `ahorcado/dict.test.mjs` exige que **todas las iniciales** tengan palabras: es lo que atrapó las dos extracciones defectuosas, que ningún chequeo de tamaño habría visto.

## D-65 · Contra el celular se va; en su lugar queda jugar solo
**Fecha:** 2026-09-12 · **Estado:** corregida por D-66 · **Relación:** deroga D-64
**Decisión:** El tercer modo deja de ser un duelo contra la máquina y pasa a ser **🧍 Jugar solo**: un jugador, una palabra que reparte la app de la temática elegida, y a sacarla. La máquina ya no adivina nada. Se van con ella `cpuGuess` y `matches` del motor, los diccionarios `dict-<idioma>.js` (tres megas) y las herramientas de `tools/diccionario/`.
**Por qué:** que el celular tratara de adivinar *tu* palabra era una simetría forzada. El ahorcado es alguien que pone una palabra y alguien que la saca; poner al aparato del lado del que adivina no agrega un rival, agrega una animación de un rival. Y salía caro: para que adivinara de verdad hacía falta un diccionario de cien mil palabras por idioma, que es más peso que todo el resto del juego junto.
**Lo que se gana además:** jugando solo la palabra sale del mazo, así que no hay secreto que comprometer. Este modo no necesita `crypto.subtle` y por lo tanto anda por http, que es justo lo que hacía falta para probarlo desde un celular de la red local sin montar https.
**Un solo aviso al terminar:** jugando solo no hay veredicto de ronda. Decía lo mismo que la pantalla final —"¡La sacaste!" dos veces seguidas—, y encima entraba encima del cartel de la última letra, que así no se alcanzaba a ver. Ahora la letra que cierra la palabra se ve sobre el tablero completo y de ahí se pasa al resultado. En los otros modos el veredicto se queda: ahí sí hay a quién pasarle el celular o gente esperando.
**Consecuencias:** `hasTurns()` pasa a ser solo el modo de un celular —jugando solo no hay turno que esperar, y en varios celulares nunca lo hubo—, así que `current` puede venir en nulo y el tablero cae al único jugador. La pantalla final tiene una tercera forma: sin ranking, sin "ganó fulano" y con "la palabra era". El cartel de la letra (D-63) se queda, porque este modo tampoco abre ninguna pantalla; la retención del tablero propio se va, porque no hay a quién pasarle el turno.

## D-66 · En la sala también se juega por turnos
**Fecha:** 2026-09-12 · **Estado:** vigente · **Relación:** corrige D-53 y D-59
**Decisión:** En varios celulares se juega **por turnos alternados**, igual que pasándose un celular: una letra cada uno, en el orden en que entraron a la sala. Quien no tiene el turno ve su tablero con el teclado bloqueado y el título dice a quién le toca. La tira de rivales marca en amarillo de quién es el turno.
**Por qué:** La sala se había diseñado simultánea para que nadie se quedara mirando (D-53). Pero jugando de a dos —que es como se juega la mayoría de las veces— la simultaneidad se come justo lo que hace divertido un duelo: ver la jugada del otro y responder. No hay secuencia que seguir ni contra quién medirse en el momento; son dos solitarios que terminan comparando puntajes. El argumento de "nadie mira" tampoco se sostiene ahí: esperar un turno es un segundo.
**Lo que cuesta:** con cuatro o más, cada jugador espera a que tiren todos los demás antes de volver a jugar. Es el precio de que haya una secuencia, y se paga con los ojos en la tira de rivales, que ahora sí cuenta algo mientras esperas. Si se vuelve pesado con mesas grandes, la salida sería elegirlo en la sala y no cambiar el reductor.
**El celular que se va:** con turnos, un jugador que cierra la pestaña trabaría la sala para siempre. `nextAlive` saltea a quien está marcado fuera, y si vuelve entra de nuevo en la rueda. Los ausentes salen de `M.presence`, que ya existía para el aviso de desconexión, y viajan a `buildState` como `config.away`: el motor no sabe de red, solo recibe a quiénes saltear.
**Mientras le toca a otro no hay teclado:** una botonera entera apagada ocupa media pantalla para decir "todavía no". Se esconde, y con ella la barra de acciones; quedan el dibujo, la pista, la palabra y la tira, que es lo que hay para mirar mientras esperas. El teclado vuelve con el turno.
**Consecuencias:** `hasTurns()` pasa a ser "todos menos jugando solo". En la sala, `mine` deja de ser siempre verdadero y pasa a ser "es mi turno": el reductor ya descartaba las jugadas fuera de turno, pero ahora el teclado tampoco las deja intentar. El título de la pantalla nombra a quien juega, que en la sala puede no ser el dueño del tablero que estás viendo.

## D-67 · El laboratorio se va: se sirve el árbol de trabajo
**Fecha:** 2026-09-12 · **Estado:** vigente · **Relación:** deroga D-42; derogó solo el laboratorio de interfaz: D-101 (La Copa) y D-191 (idiomas) crearon otros laboratorios, con otro fin
**Decisión:** Se sacan `lab/` y `tools/lab.py`. Para mirar un cambio de interfaz en un celular de verdad se sirve el árbol de trabajo con `tailscale serve --bg 8765`, que da una URL `https://<equipo>.<tailnet>.ts.net/` alcanzable desde cualquier aparato del tailnet. Para revisar una pantalla suelta sin jugar una partida entera está `tools/e2e/look.mjs`.
**Por qué:** D-42 lo dijo con todas las letras: el laboratorio existía porque «la única forma era publicar el cambio y arriesgarse, o dejarlo en local y no probarlo nunca en el aparato donde se juega». Eso dejó de ser cierto: servir el árbol de trabajo por Tailscale da lo mismo y mejor, porque es **la app entera** y no un espejo, con HTTPS —así que sirven también los modos que necesitan contexto seguro— y sin nada que mantener al día.
**Lo que costaba:** los espejos son copias del `index.html` de cada juego, y envejecen. Pasó el mismo día que se sacó: al sumarle dos `id` al HTML del resultado, `lab.py revisar` empezó a fallar. Es un aviso útil, pero de un problema que el laboratorio se inventa a sí mismo. En su vida útil nunca se promovió un experimento: `lab.css` estuvo vacío desde el principio y el único que hubo se descartó.
**Lo que se pierde:** comparar app y experimento lado a lado en dos pestañas, y aislar un cambio de estilo en un archivo que se borra de una. Si alguna vez hace falta, sale más barato volver a armarlo que mantenerlo vacío por si acaso.
**Consecuencias:** `stats.js` deja de emitir el entorno `lab` y `envOf()` ya no mira la ruta, solo el host; el panel sigue sabiendo nombrar `lab` para lo que quedó guardado de antes. Se va el paso de "revisar espejos" de la lista de antes de publicar.

## D-68 · Cuarto Rey no lleva variantes configurables
**Fecha:** 2026-09-13 · **Estado:** vigente · **Relación:** acota D-03, D-06 y D-12
**Decisión:** Se saca CR-17 de los requerimientos. Cuarto Rey se juega de una sola forma: dos sorbos por regla, la partida termina con el cuarto rey y el celular reparte. Las tres variantes que se habían dejado anotadas —elegir la cantidad de sorbos, seguir hasta agotar el mazo, usar naipe real— no se van a construir.
**Por qué:** eran tres cosas distintas metidas en una línea, y ninguna se sostiene sola. Los sorbos configurables no son un número: "toma dos sorbos" está escrito en las cartas, en los overlays y en el ranking, en tres idiomas, así que la variante se paga entera en textos para cambiar un 2 por un 3 en una app donde el vaso lo sirve cada uno. Seguir hasta agotar el mazo revierte D-06, que eligió terminar con el cuarto rey justamente para no dejar rondas largas sin tensión. Y el naipe real revierte D-12: el celular dejaría de repartir y cada turno ganaría una pantalla de "¿qué carta salió?", que es fricción en el único momento en que el juego pide no tener ninguna.
**Lo que no cambia:** D-03 sigue valiendo por lo que hace hoy —las reglas son datos y por eso el juego existe en tres idiomas sin tocar lógica—, no por la variante que prometía. Si algún día aparece una variante que la mesa pida de verdad, cabe igual; lo que se descarta es construirla por si acaso.
**Consecuencias:** la especificación deja de listar las variantes entre las ideas futuras. De los pendientes de Cuarto Rey queda cerrado también CR-18, así que el juego no tiene requerimientos abiertos.

## D-69 · Dudo: cinco dados, ases comodín y calzar, pero sin ronda obligada
**Fecha:** 2026-09-13 · **Estado:** corregida por D-71
**Decisión:** El juego nuevo es **Dudo** 🎲 (2 a 6). Se juega con cinco dados por jugador, los ases son comodín, subir es más cantidad o la misma cantidad con pinta mayor —entrar a los ases cuesta la mitad y salir el doble más uno— y se puede **calzar** desde que la apuesta llega a la mitad de los dados de la mesa. **No** hay ronda obligada.
**Por qué este juego:** el menú tenía cartas, palabras, números y una grilla, y no tenía dados. Y es el juego donde el celular más mejora al original: no reemplaza un mazo como en Cuarto Rey, sino que reparte, **prohíbe la apuesta ilegal** y cuenta al instante, que es exactamente lo que se discute a gritos en la mesa real. Además casi no tiene contenido que traducir —no hay mazo—, así que los tres idiomas cuestan la interfaz y nada más.
**Por qué calzar con tope:** sin restricción es una apuesta gratis. Con muchos dados tapados, acertar la cantidad exacta es casi imposible, pero fallar cuesta lo mismo que dudar mal, así que el que va perdiendo lo intentaría siempre. Desde la mitad de la mesa la cuenta exacta ya es una decisión.
**Por qué sin ronda obligada:** es clásica en Chile y va a entrar, pero aparece tarde en la partida y hay que explicarla en tres idiomas justo cuando el juego recién se entendió. El motor la deja prevista: `countPinta` recibe `acesWild` y la apuesta legal se calcula aparte, así que sumarla no es rehacer nada. Queda como DU-14.
**Consecuencias:** el modo de varios celulares no entra en la v0.28 y se muestra "Próximamente", que es lo que C-5 manda para un modo que todavía no existe. El motor ya habla el protocolo de la sala, así que lo que falta es la sala, no el juego.

## D-70 · Los dados no salen de la semilla
**Fecha:** 2026-09-13 · **Estado:** vigente · **Relación:** excepción a C-7
**Decisión:** En Dudo, los dados de cada ronda **no** se derivan de la semilla compartida: cada celular tira los suyos con `crypto.getRandomValues` y publica `sha256(dados + sal)`. Al dudar, cada uno manda sus dados y su sal, y todos verifican los hashes anunciados al abrir la ronda (C-10).
**Por qué:** C-7 dice que todo lo repartible sale de la semilla, y para las cartas de Línea de Tiempo o la palabra del mazo del Ahorcado está bien: son públicas apenas se juegan. Los dados no. **El código de esta app es público**: si los dados salieran de una semilla que todos los celulares conocen, cualquiera podría abrir la consola y calcular los del rival, que es el juego entero. Es el mismo problema que ya tenía la flota de Batalla Naval, y se resuelve igual: el secreto vive en el celular de su dueño.
**Cómo queda C-7 igual:** el estado se sigue derivando de la lista de mensajes. Lo que cambia es que el mensaje que abre la ronda lleva un hash en vez de los dados, y que la ronda no se puede contar hasta que estén todos los `open`. En un celular y contra el celular los dados van en claro en el mismo mensaje —no hay a quién escondérselos— y por eso el destape es instantáneo: un solo camino en el motor para los tres modos.
**Consecuencias:** una sala no puede resolver una ronda si alguien se va sin destapar. A diferencia del Ahorcado (D-66), acá **no se saltea el turno de quien se fue**: en el Ahorcado cada uno tiene su tablero y saltarlo solo cambia el orden, pero en Dudo los dados del ausente son parte de la cuenta y descartarlos cambiaría el resultado, además de depender de la presencia, que cada celular ve distinto. Una sala trabada se cancela (D-50). Queda anotado para cuando se construya DU-09.

## D-71 · Dudo se dice en chileno, y en un duelo no se calza
**Fecha:** 2026-09-13 · **Estado:** vigente · **Relación:** ajusta D-69
**Decisión:** Tres cambios en Dudo, los tres sobre cómo se juega y cómo se lee la mesa.

**1. Calzar necesita tres jugadores.** Con dos, calzar deja de ser una apuesta: el que calza ve su
propia mano y solo hay **una** mano tapada, así que la cantidad exacta se calcula en vez de
arriesgarse. Se apaga solo cuando una mesa de seis se queda en dos, no solo al configurar la
partida, y por eso vive en el motor (`calzarOk` recibe cuántos siguen vivos) y no en la pantalla.
En la configuración, el interruptor de calzar aparece recién cuando hay tres nombres anotados:
ofrecer un ajuste que no va a poder usarse es peor que no ofrecerlo.

**2. En español, las pintas se llaman como en la mesa: ases, tontos, trenes, cuadras, quintas y
sextas.** Es la forma en que se juega Dudo en Chile —el juego se dice "cuatro quintas", no "cuatro
cincos"— y el canon manda español chileno informal (C-3, RP-12). Viene **encendido por defecto** y
se puede apagar para volver a los números, porque quien no conoce los nombres necesita una salida y
porque el juego también se juega fuera de Chile en español.
**Es una opción de un solo idioma.** En inglés y en portugués no hay un juego de nombres equivalente
instalado, así que las pintas van por su número y el interruptor no se ofrece. Por eso los nombres
viven en un `export const CHILENO` de `rules.js` y no dentro de `LOCALES`: no son una traducción que
falte en dos idiomas, son contenido de uno solo, y meterlos en `LOCALES` habría obligado a inventar
un equivalente en inglés y portugués solo para que cuadrara la prueba de paridad.

**3. Los dados de la botonera se dibujan en hueco.** Antes la botonera de pintas usaba el mismo dado
sólido que la mano del jugador, más chico. Dos cosas con la misma forma y el mismo peso visual son
dos cosas del mismo tipo, y no lo son: una es lo que te tocó y la otra es un botón para nombrar una
pinta. Ahora la botonera va con el contorno y los puntos en línea, y la cara sólida queda solo para
los dados de verdad. El elegido se rellena apenas, en cian, que es el color con que la app marca la
selección en todos los juegos.
**Consecuencias:** `MIN_CALZAR` queda en el motor y la prueba lo cubre con una mesa que empieza en
tres y termina en dos. Una partida guardada de antes no trae `chileno` en su configuración y se
retoma con los nombres encendidos, que es el valor por defecto.

## D-72 · La tarjeta que se ve al compartir un link
**Fecha:** 2026-09-13 · **Estado:** corregida por D-205 · **Relación:** desde D-205 `set-version.py` ya no corre `og.mjs tarjetas`: un bloque atrasado lo frena el check `pruebas`
**Decisión:** Cada página publicada —el menú y los seis juegos— lleva sus propias etiquetas de Open Graph y de Twitter, con su título, su bajada y una imagen propia de 1200×630 en `assets/og/`. Las etiquetas las escribe `node tools/release/og.mjs tarjetas` desde `assets/js/games.js`, dentro de un bloque `<!-- generado: og -->`, y `set-version.py` lo corre en cada publicación. Las imágenes las dibuja `tools/og/tarjeta.html` —con los estilos y los datos reales— y las fotografía `node tools/release/og.mjs imagenes`.
**Por qué por página y no una sola para todo el sitio:** en esta app el link que más se comparte no es la portada, es **la invitación a una sala**: `juegosdesalon.cl/toque-y-fama/?sala=WDDT`, pegado en un WhatsApp. Con una tarjeta única, esa invitación mostraba el nombre del sitio y nada más; ahora muestra de qué juego es la sala, para cuántos y cuánto dura, que es exactamente lo que necesita saber el que la recibe. Antes de esto no había ninguna etiqueta: un link pegado en un chat salía sin imagen y con el título pelado.
**Por qué generadas y no escritas a mano:** son siete páginas por veinte etiquetas. Escribirlas a mano es copiar el nombre y la bajada de cada juego a un segundo lugar, y ese segundo lugar envejece: `games.js` ya es de donde salen el menú y el README. `revisar` avisa si una página quedó atrás o si falta una imagen.
**Por qué JPEG y no PNG:** son letras grandes sobre un degradado, y en PNG pesaban 430 KB cada una: 3 MB en el repo por siete imágenes que solo miran los robots de los chats. En JPEG al 82% pesan 130 KB y a este tamaño no se distingue la diferencia. Se convierten con `sips`, la misma herramienta que ya usa `readme.py` para las capturas.
**La versión va en la URL de la imagen** (`dudo.jpg?v=0.29.1`): WhatsApp y las redes cachean la tarjeta por semanas, así que sin eso un dibujo nuevo no se vería hasta que a ellos se les ocurriera volver a mirar. Como el sufijo `?v=` es el mismo que usa el estampado de C-11, `readme.py` ya sabe que un cambio así no envejece ninguna captura.
**Consecuencias:** el `panel/` no lleva tarjeta —es privado y ya va con `noindex`—. Las imágenes se rehacen a mano porque necesitan navegador e internet (las fuentes son de Google Fonts); solo cambian si cambia un nombre, un emoji o el diseño de la tarjeta.

## D-73 · El panel se entera solo de los juegos nuevos
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** El panel del dueño no tiene listas propias. Los juegos y los modos viven en `assets/js/games.js` (`GAMES` y `MODES`, con `gameLabel`, `modeIcon`, `ROOM_MODE`, `LOCAL_MODES` y `MAX_PLAYERS` derivados), los entornos en `transport/stats.js` y los idiomas en `i18n.js`; el panel los importa y dibuja también lo que no reconoce, con su clave por nombre. Las reglas de la base validan el modo y la cantidad de jugadores por forma y no por enumeración. Queda escrito como canon C-16 y lo vigila `node panel/adapta.test.mjs`.
**Por qué:** el panel tenía cuatro listas copiadas —los juegos, los modos con su ícono, los idiomas con su nombre y los entornos del `<select>`— más una regla de CSS por modo y una enumeración de modos en las reglas de Firebase. Agregar un juego nuevo funcionaba de casualidad (el id se muestra tal cual si no está en el menú), pero agregar un **modo** fallaba de la peor manera posible: el contador ni salía del celular, porque `startChanges` filtraba contra su propia lista, y si salía, las reglas lo rechazaban con un 401 que nadie mira. El dato no se veía mal: no existía. Una lista copiada en una página que se abre una vez por semana no se mantiene sola, y el panel es justamente donde no se nota que falta algo.
**Por qué por forma y no por lista en las reglas:** una lista en las reglas rechaza en el servidor, la partida sigue igual (el registro es mejor esfuerzo, D-44) y el dato se pierde para siempre. Validar la forma (`^[a-z][a-z-]{0,15}$` para el modo, `^[1-9][0-9]?$` para la cantidad, `^[a-z]{2,10}$` para el entorno) deja pasar lo nuevo y sigue acotando lo que un extraño puede escribir: los contadores ya suben de a uno y solo por rutas con esa forma.
**Por qué preguntarle el nombre del idioma al navegador:** `Intl.DisplayNames` nombra cualquier código en español, así que un idioma nuevo en `i18n.js` aparece como "Francés" y no como `fr`, sin una tabla que mantener. Si el navegador no sabe, se muestra el código.
**Consecuencias:** hay que **publicar las reglas** en la consola de Firebase para que el cambio de validación tenga efecto; hasta entonces un modo nuevo seguiría rechazado. El tope de jugadores dejó de ser un 6 escrito en dos archivos, pero los roles de sala (`A`–`F`) y el patrón `$p` de las reglas siguen topando en seis: un juego de más de seis en dos celulares es otro cambio. Un modo desconocido en la base ahora suma al total del juego: lo que antes se descartaba como basura, si tiene forma de modo, cuenta.

> D-173 (antes D-73 duplicada) está más abajo, en su orden.

## D-74 · El idioma puede venir en el link
**Fecha:** 2026-09-13 · **Estado:** corregida por D-197 · **Relación:** amplía D-47
**Decisión:** Cualquier página de la app acepta `?lang=es|en|pt`. Al cargar, `i18n.js` lo aplica, lo guarda como cualquier elección y **saca el parámetro de la barra de direcciones**, dejando el resto de la URL intacto (el `?sala=` de una invitación sigue ahí). Además hay dos puertas de entrada, `/pt/` y `/en/`, que son dos archivos de veinte líneas: dejan el idioma elegido y mandan a la portada, que es una sola para los tres. Y **la invitación a una sala lleva el idioma pegado**: quien la recibe abre la app en el mismo idioma en que se la mandaron.
**Por qué no rompe D-47:** ese canon dice que el idioma **no se detecta** del navegador, y sigue siendo así. Acá no se adivina nada: alguien eligió el idioma —para sí mismo con el toggle, o para el que va a recibir el link— y esa elección viaja. Un `?lang=` que no sea uno de los tres se ignora en silencio y la app queda en español.
**Por qué rutas y no subdominios:** `pt.juegosdesalon.cl` es lo más bonito de leer, pero GitHub Pages sirve **un** dominio por repositorio (el `CNAME`), así que cada subdominio necesitaría otro destino de publicación o un proxy delante. Por una etiqueta de idioma es mucha máquina. Las carpetas cuestan dos archivos y no tocan la infraestructura.
**Por qué se saca el parámetro de la URL:** lo que circula tiene que ser la dirección de siempre —la que está en las tarjetas sociales, la que indexa el buscador, la que la gente copia—. El idioma ya quedó guardado, así que el parámetro no tiene nada más que hacer ahí; y donde sí hace falta que viaje, que es la invitación, lo pone el juego a propósito con `withLang()`.
**Las puertas también se comparten:** `/pt/` y `/en/` llevan sus propias etiquetas Open Graph y su propia imagen de 1200×630 en su idioma (D-72), y las tres se anuncian entre sí con `hreflang`. Pegar `juegosdesalon.cl/pt/` en un grupo de Brasil muestra la tarjeta en portugués.
**Consecuencias:** las páginas de los juegos no tienen una URL por idioma: adentro el idioma se elige y se guarda, así que no hay tres direcciones que ofrecerle al buscador. El panel es español solo y el parámetro no le hace nada. Prueba de punta a punta en `tools/e2e/lang-from-url.mjs`.

## D-75 · La app mide lo que se ve, no lo que la pantalla dice que mide
**Fecha:** 2026-09-13 · **Estado:** corregida por D-77
**Decisión:** `.app` pide `calc(100dvh - var(--safe-top) - var(--safe-bottom))` y no `100dvh`. El `body` ya reserva las muescas con su `padding`, así que pedir la pantalla entera adentro de una caja que ya se achicó dejaba la página **más alta que el celular por exactamente el alto de las muescas**: 81 px en un iPhone con muesca (47 arriba, 34 abajo).
**Cómo se vio:** en Dudo, la barra de apostar se apoya en el borde de abajo (`margin-top: auto`), así que se iba fuera de la pantalla con medio celular vacío más arriba. En los otros juegos el contenido baja desde arriba y esos 81 px de más solo se notaban como un scroll de la nada. Es un error del armazón compartido, no de Dudo: se arregla una vez en `base.css` y vale para los seis juegos, el menú y el panel.
**Por qué ninguna prueba lo vio:** en Chrome headless `env(safe-area-inset-*)` vale 0, así que la página medía exactamente lo que tenía que medir y todo pasaba. El error solo existe en un celular con muesca, que es justo donde se juega.
**Lo que queda para que no vuelva:** `node tools/e2e/look.mjs <juego> <pantalla> --muescas` simula 47 y 34, y el informe ahora dice dos cosas más: cuánto se pasa la página del alto del celular y qué botones caen por debajo del borde. Con el error puesto de vuelta, avisa "⚠️ 81 px" y nombra el botón de apostar.

---

## D-76 · Las capturas se sacan con la pantalla quieta
**Fecha:** 2026-09-13 · **Estado:** corregida por D-77
**Decisión:** Antes de disparar, `b.shot()` (`tools/e2e/cdp.mjs`) espera a que terminen las
animaciones finitas que estén corriendo, con un tope de 900 ms; las infinitas —las burbujas del
fondo, el `wiggle`, el `shimmer`— no se esperan nunca porque no terminan. Además, la lista de
jugadores de Cuarto Rey dejó de animarse entera: entra animada **solo la fila recién agregada**, y
entra desplazándose, no escalándose.
**Por qué:** en el README, la pantalla "¿Quiénes juegan?" mostraba las cuatro filas con anchos
distintos, como si la grilla estuviera mal armada. No lo estaba: cada fila entraba con un `pop`
—`scale(0.6) → 1.08 → 1`— escalonado de a 40 ms, y la captura se sacaba a los 300 ms, con las dos
primeras filas ya asentadas y las dos últimas todavía creciendo. Una animación de escala sobre una
fila de ancho completo **cambia su ancho mientras dura**, así que congelarla a la mitad es
fotografiar cuatro anchos distintos. El bug no estaba en el CSS de la fila: estaba en el instante
en que se apretaba el obturador, y el mismo instante afectaba a las fichas de "¡Salud!" y a
cualquier pantalla con entradas escalonadas.
**Por qué el tope es corto:** varias pantallas se pasan solas —el pase del celular a los 1,8 s, el
"¡Salud!" a los 2,6 s—. Una espera larga no sacaría una foto más quieta: sacaría otra pantalla.
**Por qué además se cambió la animación y no solo la espera:** la lista se redibuja entera cada vez
que alguien agrega o borra un jugador, así que las cuatro filas saltaban de nuevo por una fila
nueva. Eso se veía en el celular, no solo en la captura, y ninguna espera lo arregla.
**Y de paso, la fila angosta:** el selector de género le comía el ancho al nombre —en un celular de
320 px el campo quedaba en dos letras—. Bajo 400 px la fila se aprieta (número, separaciones y
botones) y bajo 340 px el selector se baja entero a una segunda línea, a lo ancho. Los botones de
género y la ✕ miden 44 px de alto, con área táctil ampliada la ✕ (C-8).
**Consecuencias:** hay una hoja de contacto, `node tools/e2e/contact-sheet.mjs [seccion]`, que arma un
PNG con todas las capturas de una sección al tamaño en que el README las muestra. Mirarla es parte
de publicar: las capturas se rehacen solas, pero nadie las revisaba de a una. Mirándola se
encontraron dos más —el ranking final y el "¡Cuarto Rey!" tapados por el confeti, y un "¡Salud!"
que en realidad decía "¡Cumplida!"—, que se arreglaron en el guion, no en el juego.

---

## D-77 · La app se arma con el alto chico de la pantalla
**Fecha:** 2026-09-13 · **Estado:** vigente · **Relación:** corrige D-75 (el alto) y ajusta D-76
**Decisión:** `.app` mide `calc(100svh - muescas)`, no `100dvh`. `svh` es el **alto chico**: el que
queda cuando el navegador muestra toda su interfaz. El `body` sigue pintando `100dvh` para que el
fondo llegue al borde. Y `look.mjs --muescas` dejó de simular las muescas con variables CSS: ahora
se las pide a Chrome (`Emulation.setSafeAreaInsetsOverride`), que es lo que la página lee con
`env(safe-area-inset-*)`.
**Por qué:** la barra de apostar de Dudo seguía saliéndose de la pantalla en un Android con la app
instalada, después de que D-75 diera el asunto por cerrado. La página del diagnóstico
(`tools/diag/`, abierta en ese mismo celular) mostró por qué: **`dvh` daba 1016 px y `svh` 960**. La
app se armaba con el valor de `dvh`, 56 px más larga que lo que se alcanza a ver, así que lo que se
apoya abajo —la barra de apostar— quedaba justo afuera: alcanzable deslizando, pero afuera. Las
muescas no tenían nada que ver: en ese aparato `env(safe-area-inset-*)` vale 0 y la ventana ya
excluye las barras del sistema.
**Por qué `svh` y no seguir con `dvh`:** `dvh` es el alto **de este instante**, y el instante puede
ser el bueno. Vale para animar, no para decidir dónde termina una pantalla: la app se arma una vez
y la barra tiene que estar adentro también cuando el navegador muestra su interfaz. Con `svh` lo
que puede sobrar es un poco de fondo abajo —invisible, porque el `body` pinta `100dvh`—; lo que
nunca pasa es que falte.
**Por qué el diagnóstico y no otro arreglo a ojo:** D-75 se validó con un sustituto —`--muescas`
sobreescribía `--safe-top` y `--safe-bottom`—, y un sustituto no mueve el viewport ni el `dvh`: por
eso daba verde con el error puesto. Con muescas de verdad la página mide exactamente el alto de la
pantalla, o sea que el error nunca estuvo ahí. Los números que lo decidieron no los tenía ninguna
prueba: los tenía el celular, y hubo que ir a buscarlos.
**Consecuencias:** `look.mjs` agrega una línea al informe —"se arma con el alto chico (svh)"— que
revisa la **regla**, no la medida, porque en Chrome headless `dvh` y `svh` valen lo mismo y una
medida nunca vería la diferencia. `tools/diag/` se publicó mientras duró el diagnóstico y se borró
apenas el celular confirmó el arreglo: era la única página del sitio que no es la app. Si vuelve a
hacer falta, está en la historia (`git show effd591:tools/diag/index.html`), y lo que mide —dvh,
svh, lvh, la ventana, las muescas y cuánto se pasa la página— es la lista de lo que hay que ir a
buscar al aparato cuando una pantalla se corta y en el escritorio se ve bien.

---

## D-78 · El README en inglés, el resto en español
**Fecha:** 2026-09-13 · **Estado:** corregida por D-316, D-324
**Decisión:** `README.md` se escribe en inglés. Todo lo demás sigue en español: los cánones, las
decisiones, las especificaciones de cada juego, los comentarios del código y los mensajes de las
herramientas. Lo que el README muestra generado también sale en inglés: los modos se leen del `en`
de cada `rules.js`, las temáticas del `en` de los mazos y el `pie` de `docs/capturas.json` se
escribe en inglés. Queda como canon en C-13.
**Por qué:** la app es chilena, se juega en chileno y se piensa en español, y eso no cambia. Pero el
README no es parte de la app: es la puerta del repositorio, y por ahí entra gente de cualquier
parte que no lee español. Todo lo demás lo lee quien trabaja en el proyecto.
**Por qué también los bloques generados:** si la prosa quedaba en inglés y las tablas en español,
`python3 tools/release/readme.py actualizar` devolvía la mitad del archivo al español en la primera
publicación. Un README bilingüe por accidente es peor que uno en cualquiera de los dos idiomas.
**Los títulos llevan los dos nombres:** `## 👑 Fourth King (Cuarto Rey)`. Primero el inglés, que es
por lo que alguien de afuera busca el juego, y entre paréntesis el nombre de verdad, que es como se
llama en la app y lo que va a ver en pantalla. La tabla de arriba muestra los tres
(`Fourth King / Cuarto Rey / Quarto Rei`). El ancla del índice sale del título completo
(`#-fourth-king-cuarto-rey`) y la arma `titulo_juego()` en `tools/release/readme.py`, la misma función que
dicta cómo se titula la sección: si cambia el título cambia el enlace, y no hay forma de que queden
apuntando a distinto lado.
**Consecuencias:** `tools/release/facts.mjs` guarda los modos en los dos idiomas, no solo en español, y
`jugadores` viaja como "1 to 6". Al agregar un juego hay un paso más explícito en
`docs/AGREGAR-JUEGO.md`: la sección del README y el `pie` de las capturas van en inglés.

---

## D-79 · El panel anota quién ganó y de qué país se jugó
**Fecha:** 2026-09-14 · **Estado:** vigente · **Relación:** cambia D-44
**Decisión:** El registro de una sala (`stats/<env>/days/<día>/rooms/<CÓDIGO>`) suma dos cosas:
`co/<rol>`, el país del celular de cada jugador en dos letras, y `end: { winner, name, at }`, quién
ganó esa partida. Con eso el panel muestra una **bitácora de salas jugadas**: cuándo, quiénes (con
la bandera al lado del nombre), qué juego y quién ganó, filtrada por el rango de 7 o 30 días que ya
tenía y paginada de a 20.
**Qué cambia de D-44:** esa decisión decía que del panel "nunca sale quién ganó". Ahora sí, porque
el dueño quiere leer las partidas como partidas y no solo como contadores. Lo demás de D-44 sigue
igual: sin IP, sin secretos, sin chat, y de los modos sin red no sale ni un nombre. La sala ya
guardaba los nombres, así que lo nuevo de verdad es el país y el resultado.
**Por qué el país sale del huso horario y no del idioma:** un celular chileno puesto en inglés dice
`en-US` y lo daría por estadounidense. Al navegador se le pregunta qué husos tiene cada país
(`Intl.Locale.getTimeZones`), así que no hay tabla de husos que mantener; el idioma queda de
respaldo y, si ninguno de los dos lo dice, la sala se muestra sin bandera. Preferimos un hueco a un
país inventado.
**Por qué se guarda el país y no el huso:** el huso es más fino que lo que se muestra y dice a qué
ciudad pertenece el celular. En el registro por día ya está el contador de husos, que es agregado y
no dice de quién es cada uno; acá, pegado a un nombre, se guarda solo lo que la lista enseña.
**Por qué lo manda cada celular al llegar al final:** el ganador lo sabe el juego, no el transporte.
Cada celular que llega a la pantalla final lo apunta y las reglas solo dejan escribirlo una vez: el
primero lo deja puesto y los demás rebotan, sin reintentos ni coordinación. Si no sale, no sale: es
mejor esfuerzo, como todo lo que va al panel.
**Por defecto no se ven las pruebas ni las salas vacías:** las partidas de prueba corren en el
entorno `dev` y el panel abre en `prod`, así que quedan fuera solas (D-45); y una sala donde nunca
entró un segundo jugador no es una partida, así que se muestra solo si se pide con la casilla.
**Consecuencias:** hay que **publicar las reglas** en la consola de Firebase; hasta entonces el país
y el ganador se rechazan en silencio y la lista los muestra en guion. Nada de esto es retroactivo:
las salas jugadas antes de esta versión salen sin bandera y sin ganador, y se muestran igual, porque
una sala de la que se sabe menos es una sala que igual pasó.

---

## D-80 · Seis rangos en el panel, y lo que se baja crece con ellos
**Fecha:** 2026-09-14 · **Estado:** vigente · **Relación:** amplía D-79
**Decisión:** El panel ofrece seis rangos —7, 30, 60 y 90 días, 1 año y lo que va del año—, y con
ellos se filtran **todas** las cifras de la página, incluida la bitácora de salas. La lista de
rangos vive en `panel/aggregate.js` (`RANGOS`): de ahí salen el selector, el título, la ventana que
se le pide a la base y el grano de la barra "cuándo se juega".
**Lo que se baja crece con el rango, y nunca al revés:** la suscripción arranca en el día más
antiguo que pida el rango elegido y solo se vuelve a pedir si alguien elige uno más largo. Mirar la
semana no descarga un año, y volver de un año a la semana no descarga nada. Antes se bajaban
siempre 30 días fijos.
**Por qué la barra cambia de grano:** un año en barras diarias son 365 barras de un píxel. Hasta 30
días va por día, hasta 90 por semana (rotulada con su lunes) y de ahí en adelante por mes. Agrupar
no puede perder ni inventar partidas, y eso lo vigila `panel/aggregate.test.mjs`.
**Por qué "este año" se cuenta en UTC:** los días se numeran en UTC y el panel rotula todas sus
fechas en UTC. Tomar el año del reloj local mientras los días son UTC hace que en las primeras horas
del 1 de enero el rango empiece en enero del año pasado y termine mañana. La diferencia dura unas
horas al año; la incoherencia duraría todas.
**Consecuencias:** un rango largo tarda en llegar, así que mientras no esté el título dice
"cargando…": un año a medio bajar se ve igual que un año sin partidas, y son cosas distintas (C-14).
Los datos solo llegan hasta donde llegue el registro: el panel existe desde la v0.20, y del país y
el ganador solo hay desde la v0.33.6 (D-79).

## D-81 · Las cartas de la sala viajan en sobres cerrados
**Fecha:** 2026-09-14 · **Estado:** vigente · **Relación:** amplía D-70
**Decisión:** En la sala de Julepe el reparto no viaja en claro ni sale de una semilla compartida:
cada celular genera un par de llaves al entrar (RSA-OAEP del propio navegador, `assets/js/sobre.js`)
y publica la pública junto con su nombre; quien reparte cierra la mano de cada jugador con la llave
de esa persona. El mensaje `reparte` lleva un sobre por rol y nadie más lo puede abrir.
**Por qué no la semilla:** es lo mismo que ya pasaba con los dados (D-70), pero peor. Un hash sirve
para *comprometer* un secreto que después se destapa entero; acá hay que **entregarle** cinco cartas
a alguien y que nadie más las vea mientras se juega, y para eso no hay hash que valga.
**Lo que no evita:** quien reparte arma las manos, así que pasan por su celular en claro. Es el
trato de la mesa real —el que baraja podría marcar las cartas— y por eso el reparto rota en cada
mano. Lo que sí queda probado al cerrar la mano es que nadie **jugó** una carta que no le tocó:
cada uno destapa sus ocho cartas y todos verifican contra lo que tiraron (C-10).
**Consecuencias:** hace falta contexto seguro (https o localhost). Sin `crypto.subtle` no se puede
cerrar nada, así que el reparto va en claro y el cierre de la mano lo dice con todas sus letras en
vez de fingir un secreto que no existe (C-14). La llave privada se guarda con la partida
(`private`, C-6): sin ella, un celular que recarga no podría volver a abrir su propia mano.

## D-82 · La reserva: tres cartas tapadas en vez de un mazo común
**Fecha:** 2026-09-14 · **Estado:** vigente
**Decisión:** En Julepe a cada jugador le tocan **ocho** cartas: las cinco de la mano y tres tapadas
de reserva. Cambiar saca de la reserva propia y no del resto del mazo. Además el cambio viaja por
**puestos** (`i: '0,3'`) y no por nombres de carta.
**Por qué:** si el resto del mazo fuera público —que es lo que haría falta para repartir el cambio
desde la mesa—, los tres naipes que pide el rival se sabrían de antemano, que es peor que verle la
mano. Y si el mensaje dijera "cambio el 10♠ y la J♠", le estaría contando a toda la sala dos cartas
que tenía. El puesto no dice nada y alcanza para rehacer la jugada al retomar (C-6) y para
verificarla al destapar (C-10).
**Por qué alcanza:** seis jugadores por ocho cartas más la que marca el triunfo son 49 de 52. El
mazo nunca se queda corto, así que no hay que barajar los descartes a mitad de mano.
**Consecuencias:** las probabilidades cambian un pelo respecto de la mesa real (las cartas de la
reserva no pueden estar en otra mano), y a cambio el cambio es tan secreto como el reparto.

## D-83 · Si va uno solo, el dador se queda obligado
**Fecha:** 2026-09-14 · **Estado:** vigente
**Decisión:** En Julepe, si de la declaración sale **un solo** jugador dispuesto a ir, el dador
entra a la fuerza y juega esa mano quiera o no, con las cartas que se repartió. Si el solitario es
el propio dador, se queda obligado el de su derecha. Si se pasan **todos**, la mano se anula: el
plato queda acumulado y reparte el siguiente.
**Por qué:** una mano de a uno no es una mano —el solitario ganaría las cinco bazas sin jugarlas—
y anularla cada vez que alguien tiene mano buena y el resto se arruga deja el juego dando vueltas
sin que pase nada. La regla es de la mesa de toda la vida y le pone filo al reparto: repartir
también arriesga.
**Consecuencias:** el obligado puede caer en julepe sin haber querido entrar, que es justamente la
historia que la mesa cuenta después. La pantalla se lo dice con esas palabras ("¡Te quedaste
obligado!") y el asiento lo marca distinto, para que nadie crea que apretó el botón equivocado.

## D-84 · El nombre del séptimo juego cambia en cada idioma
**Fecha:** 2026-09-14 · **Estado:** vigente · **Relación:** amplía D-48
**Decisión:** El juego se llama **Julepe** en español, **Julep** en inglés y **Paga o Bolo** en
portugués de Brasil.
**Por qué:** el criterio de esta app es que el nombre se reconozca en el idioma en que se juega
(Bulls and Cows, Liar's Dice, Forca). El Julepe es de la familia del Rams: su primo inglés se llama
**Loo** y el de Luisiana, **Bourré**; ninguno de los dos sirve de nombre en una app —"loo" hoy se
lee como el baño, y "bourré" lo conoce quien juega cartas en Nueva Orleans—. **Julep** sí: es
palabra inglesa corriente, es un trago, suena igual que el original y deja la frase "you got
juleped" a mano. En portugués no hay miembro de la familia: lo que sí se reconoce es **o bolo**, que
es como se llama allá el pozo que se junta, y "paga o bolo" cuenta el juego entero en tres palabras.
**Consecuencias:** las tarjetas sociales, el README y el menú muestran tres nombres distintos para
el mismo `id` (`julepe`), que es lo que ya hacen los otros seis. El castigo se sigue llamando
julepe dentro del juego en español y en inglés; en portugués es "pagar o bolo".

## D-85 · Arrastrar la carta a la línea es elegir, nunca colocar
**Fecha:** 2026-09-18 · **Estado:** corregida por D-86, D-87 · **Relación:** amplía C-8 y D-38
**Decisión:** En Línea de Tiempo la carta se puede **arrastrar** desde la mano hasta su lugar en la
línea, y la carta ya puesta se puede **retomar** y llevar a otra ranura, o soltar fuera de la línea
para devolverla a la mano. Soltar **elige**: deja la carta y el lugar marcados, exactamente como si
se hubieran tocado. Quien coloca sigue siendo el botón amarillo, que nombra la carta. El gesto vive
en un módulo compartido, `assets/js/arrastre.js`, que no sabe nada de las reglas de ningún juego.

**Por qué:** el problema concreto es el texto. En la mano, una carta mide 130 px y su título queda en
11 px; en un celular angosto —un Pixel normal, 393 px— eso no se alcanza a leer justo en el momento
en que hay que decidir dónde va. Al arrastrar, la carta sale de la tira y se dibuja en un clon de
268 px con el texto en 15 px, que es media pantalla de ancho y se lee de una. El arrastre no se
agregó por moderno: se agregó porque es la única postura en que la carta puede ser grande.

Que soltar no coloque no es timidez. Colocar es irreversible y se paga con la carta, así que el
canon pide elegir y después confirmar (C-8). Y como soltar deja el mismo estado que tocar, el
arrastre es un atajo hacia el camino de siempre: el motor, el transporte y el reductor no se
enteran, y quien prefiera tocar sigue tocando.

**Consecuencias:**
- **La carta en vilo va 60 px sobre el dedo.** Bajo el dedo, el pulgar tapa justo el texto que se
  agrandó: el remedio y la enfermedad en el mismo lugar.
- **Se elige al apretar, no al soltar.** La carta se enciende bajo el dedo. Si el gesto resulta ser
  desliz lateral —la mano es una tira que se desplaza— se devuelve la selección anterior, que es la
  protección de D-38 intacta. El eje lo reparte el navegador con `touch-action: pan-x`: se queda con
  el movimiento horizontal, que es scroll, y nos entrega el vertical. No hace falta toque largo.
- **`pointerdown` no cubre el teclado.** `Enter` sobre un botón llega como `click`, igual que el
  `el.click()` de los guiones de punta a punta. Los dos traen `detail === 0`; un toque de verdad trae
  1 o más y ya lo atendió `pointerdown`. Con eso, el mismo control sirve para las dos formas.
- **Los destinos se miden en coordenadas de documento**, no de pantalla, y se vuelven a medir cada
  vez que cambia el destino. Hacía falta: el destino se marca **abriendo la ranura** con la carta
  dentro, que es el mismo hueco que deja el camino de toques, y abrirlo corre la línea bajo el dedo.
  La alternativa —una barra que no mueve nada— se probó y se descartó: ver la carta en su lugar
  mientras se decide vale más que ahorrarse la medición.
- **Los dos hitos vecinos encienden su año**, en lima y sin tocar su borde. Dicen entre qué años cae
  la carta, que es la decisión que se está tomando y el mismo dato con que después se explica el
  error (C-8b). El borde encendido queda reservado al destino: con tres bordes del mismo color,
  ninguno dice "es aquí".
- **El puntero lo toma el contenedor, no la carta.** La carta arrastrada se destruye en el primer
  redibujo; `#hand` y `#line` sobreviven, y con ellos la captura y los oyentes.
- **Con una carta en el aire, la pantalla no se redibuja.** Lo que llegue mientras tanto se pinta al
  soltar. Sin eso, un mensaje de la sala se lleva el elemento que el dedo tiene tomado.
- El botón de confirmar se desvanece con opacidad mientras dura el gesto: estorba donde va el pulgar,
  y esconderlo con `display` movería la caja y echaría a perder lo medido.
- Batalla Naval mueve barcos con un arrastre propio, anterior a este módulo. No se migró en esta
  pasada; cuando se migre gana el clon en vilo y la vibración, y el módulo gana su primer destino
  de dos dimensiones, que es para lo que la clave del destino es cualquier cosa y no un índice.

## D-86 · El gesto de arrastrar no se lo puede llevar el navegador
**Fecha:** 2026-09-18 · **Estado:** vigente · **Relación:** corrige D-85
**Decisión:** `overscroll-behavior: none` va en `<html>` **y** en `<body>`, y `touch-action: pan-x`
va en toda la tira de la mano, no solo en las cartas.

**Por qué:** publicado el arrastre, en un celular de verdad tirar la carta hacia abajo disparaba el
**deslizar para actualizar** de Chrome. Es el peor final posible para este gesto: no es que no
funcione, es que recarga la página y se lleva la partida por delante.

Dos causas, sumadas. La primera: el `overscroll-behavior` del viewport se toma de `<html>`, y desde
`<body>` solo se propaga si `<html>` vale `auto`. Esa propagación estaba escrita en la hoja desde el
principio y nadie la había puesto a prueba, porque hasta ahora ningún gesto de la app tiraba hacia
abajo desde el borde superior. La segunda: `touch-action: pan-x` estaba solo en `.card`, y entre dos
cartas hay 6 px de hueco; el dedo mide bastante más, así que un toque que cae en el hueco lo toma la
página y se va en desplazamiento vertical.

**Consecuencias:**
- La regla vale para toda la app, no solo para Línea de Tiempo: cualquier juego que arrastre hereda
  el viewport ya protegido.
- **Ninguna prueba automatizada podía atrapar esto.** `Input.dispatchTouchEvent` de CDP inyecta el
  toque directamente en el renderizador, saltándose `touch-action` y el sobre-desplazamiento;
  `Input.synthesizeScrollGesture` sí pasa por el canal de gestos, pero Chrome headless no implementa
  el deslizar para actualizar, que es una función del navegador de Android. El gesto que fallaba no
  existe en ningún Chrome que se pueda automatizar desde aquí. Lo que sí queda: **un gesto nuevo se
  prueba en un celular de verdad antes de publicarlo** (D-67), y eso no lo reemplaza ningún guion.
- Al revisar esto apareció otra trampa: `/linea-de-tiempo/` es un documento distinto del menú, y
  GitHub Pages los sirve con `max-age=600`. El menú puede mostrar la versión nueva mientras el juego
  todavía corre la vieja desde la caché del celular, hasta diez minutos. Al verificar una publicación
  (C-11) hay que pedir **la página del juego**, no solo la portada.

## D-87 · Elegir no reconstruye la línea
**Fecha:** 2026-09-18 · **Estado:** vigente · **Relación:** corrige D-85
**Decisión:** Elegir una carta o un lugar repinta **solo las ranuras**, la mano y el botón. Las filas
de hitos no se tocan. La línea se reconstruye entera únicamente cuando cambia de verdad: cuando se
coloca una carta.

**Por qué:** cada toque reconstruía `#line` completo, y como `.event` lleva `animation: slideUp`, las
filas volvían a reproducir su animación de entrada: el tablero pegaba un salto al apretar una carta,
y otro cada vez que el destino cambiaba mientras se arrastraba. Arrastrando es peor que tocando,
porque ahí el salto se repite varias veces por segundo mientras el jugador mira la línea para decidir.

El error de fondo era tratar "cambió la selección" como "cambió la pantalla". No cambió: elegir una
carta no mueve ningún hito. Lo único que cambia es qué ranura está abierta y qué muestra adentro.

**Consecuencias:**
- `pintarLinea` (reconstruye) y `marcarRanuras` (repinta ranuras) quedan separadas, y con ellas
  `marcarEstado`, porque la línea de estado sí cambia con la selección ("elige una carta" →
  "elige el lugar") y antes venía de arrastre con el redibujo entero.
- Soltar tampoco reconstruye: soltar elige, y elegir no cambia la línea (D-85).
- La prueba es de identidad, no de aspecto: se marcan los nodos de las filas antes de apretar y se
  comprueba que sean los mismos después. Una captura no habría delatado nada, porque el estado final
  es idéntico: lo que molestaba era el camino, no el destino.

## D-88 · Julepe se retira del menú hasta que sus reglas se entiendan
**Fecha:** 2026-09-18 · **Estado:** vigente
**Decisión:** `julepe` pasa a `available: false` en `assets/js/games.js`. La tarjeta sigue en el
menú, apagada y sin click (el mismo trato que tuvieron Batalla Naval y Toque y Fama mientras se
construían), pero el juego entero sigue andando en `/julepe/`: quien tenga el link puede seguir
jugando, y nada de lo construido —motor, sala, cartas selladas, verificación— se toca.

**Por qué:** varias vueltas seguidas revisando el texto de reglas (qué es un palo, una baza, el
plato, "repartir en lo que dure la mano") no terminaron de aclarar el juego ni para quien lo estaba
explicando. Julepe es el juego con más reglas encadenadas de toda la app —declarar, cambiar cartas,
asistir, montar, fallar, el plato que se dobla solo— y ese peso todavía no está bien resuelto en
palabras simples. Publicarlo así es peor que no publicarlo: un juego que nadie entiende no se juega,
y las capturas y el README ya lo muestran como si estuviera listo.

**Lo que no cambia:** los quince requerimientos (JU-01 a JU-15) siguen marcados como cumplidos en
`docs/REQUERIMIENTOS.md` — el juego está construido y funciona, lo que falta es que se explique
bien. `docs/juegos/julepe.md` y la sección del README quedan, con una nota de que está pausado.

**Consecuencias:**
- La tabla de juegos del README (`tools/readme.py`, `bloque_juegos`) muestra "⏸ paused" en vez de
  la versión cuando `disponible` es falso, en lugar de mentir con un número de versión que sugiere
  que está en línea.
- La portada y sus tarjetas sociales (`tools/og.mjs`) dejan de nombrar a Julepe en la lista de
  juegos y en el emoji de la cabecera: se arman filtrando por `available`, así que no hubo que
  tocarlas.
- Reactivarlo es cambiar un booleano de vuelta a `true` una vez que las reglas se reescriban y se
  prueben con alguien que no las conozca de antes.

## D-89 · Una sala se cae a la media hora de quedar quieta
**Fecha:** 2026-09-19 · **Estado:** vigente
**Decisión:** Una sala vence **media hora después de la última jugada**, y sigue existiendo el tope
duro de seis horas desde que nació (D-15). Las dos cuentas las hacen las reglas de seguridad: la
sala gana un campo `lastAt` —el latido, con la hora del servidor— que el transporte refresca al
entrar y al jugar, como mucho una vez por minuto (`_touch` en `assets/js/transport/firebase.js`).
Sin latido fresco, las reglas dejan de aceptar jugadores y mensajes, y cualquiera puede borrar la
sala.

**Por qué:** seis horas era la vida de cualquier sala, jugara alguien o no. Una sala que se abrió a
las ocho y quedó vacía seguía ocupando su código de cuatro letras hasta las dos de la mañana, y
aparecía en el panel del dueño como si ahí hubiera gente. Las partidas duran entre cinco y cuarenta
minutos (`duration` en `games.js`): media hora quieta no es una pausa, es una sala abandonada.

**Por qué se queda el tope de seis horas:** la papelera (D-39) promete que un balde del índice solo
se puede leer cuando todas sus salas ya vencieron, y así el índice nunca delata el código de una
sala en juego (C-15). Esa promesa necesita que exista un plazo máximo: con vencimiento solo por
inactividad, una sala con gente jugando podría sobrevivir a su propio balde. Los seis horas dejan de
ser la vida normal de una sala y pasan a ser el tope que sostiene a la papelera.

**Compatible en los dos sentidos, porque las reglas se publican a mano:**
- Reglas nuevas con un cliente viejo en caché: esa sala nunca escribe `lastAt`, y las reglas tratan
  la ausencia del campo como "vale el tope de seis horas". La partida sigue como antes.
- Cliente nuevo con reglas viejas: el latido es un escrito aparte, en segundo plano y con el error
  tragado. Se rechaza, nadie lo nota y la sala vence a las seis horas.
Así ninguna de las dos mitades del despliegue tiene que esperar a la otra.

**Consecuencias:**
- Las reglas se **publican a mano** en la consola ([Realtime Database → Rules](https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules)).
  Hasta que se publiquen, todo sigue funcionando con las seis horas de siempre.
- Una partida que se deja a medias más de media hora ya no se puede retomar (C-6 vale hasta que la
  sala venza). Quien vuelve ve "esa sala ya venció" y arma una nueva.
- El panel descarta las salas sin latido fresco, con la misma cuenta que las reglas, así que deja de
  mostrar como vivas las salas que nadie puede usar.
- Un escrito más por sala cada minuto de juego, solo mientras se juega.

## D-90 · Arrastrar un barco es elegirlo
**Fecha:** 2026-09-20 · **Estado:** vigente
**Decisión:** En la colocación de la flota de Batalla Naval, un barco se puede arrastrar **desde su
ficha** (todavía fuera del tablero) y **desde el tablero**, y apenas el dedo pasa el umbral de
arrastre el barco arrastrado pasa a ser el **seleccionado**. Es la misma regla que Línea de Tiempo
(D-85): arrastrar elige, y lo irreversible sigue colgando de su botón —acá, zarpar—.

**Por qué:** la selección y el arrastre eran dos cosas distintas. Se podía tener el portaaviones en
amarillo, con su botón ↻ encima, y arrastrar el destructor: el que se movía no era el que la pantalla
decía que estaba elegido, y el ↻ seguía girando al otro. Y las fichas de los barcos sin colocar no se
podían arrastrar: había que tocar la ficha y después la casilla, un gesto que nadie intenta primero
cuando ve una ficha y un tablero.

**Cómo:** los oyentes de puntero pasan de la grilla a `#screen-place`. La grilla se rehace entera en
cada repintado —y se rehace, porque elegir pinta— así que colgados de ella se perdía la captura a
mitad del gesto; la pantalla sobrevive. Es la misma lección que dejó `assets/js/arrastre.js` en
Línea de Tiempo: el puntero lo toma el contenedor, no lo que se arrastra.

**Consecuencias:**
- Mientras no se pasa el umbral (`UMBRAL`, 8 px, el de la casa) no hay arrastre, así que el toque de
  siempre queda intacto: tocar un barco lo selecciona, tocarlo de nuevo lo deselecciona.
- Las fichas llevan `touch-action: none` (D-86): sin eso, arrastrar una hacia el tablero desplazaba
  la página en Android en vez de mover el barco.
- Soltar afuera del tablero, o sobre un lugar donde el barco no cabe, no coloca nada y suena el
  error —pero el barco arrastrado igual queda elegido, que es lo que el gesto pedía.
- **Mientras dura el arrastre no se dibuja el ↻.** Girar no es algo que se pueda hacer con el barco
  en el aire, y el botón se quedaba flotando sobre la casilla de donde salió, ofreciendo una acción
  que en ese momento no existe. Vuelve al soltar.
- **El puntero se toma cuando el gesto ya es un arrastre, no al apoyar el dedo.** La primera versión
  capturaba en `pointerdown`, y con eso el `click` que el navegador fabrica después se lo lleva el
  elemento que capturó: tocar un barco dejó de seleccionarlo y tocar una ficha dejó de elegirla.
  `assets/js/arrastre.js` ya lo hacía bien —captura dentro de `onMove`, pasado el umbral— y no se
  había mirado al escribir esto.
- **Ninguna prueba lo vio, y por eso ahora hay entrada de verdad.** Los guiones tocaban con
  `elemento.click()`, que se salta la cocina de eventos del navegador entera y pasaba en verde.
  `tools/e2e/cdp.mjs` gana `toque(x, y)` y `arrastre(x0, y0, x1, y1)`, que mandan el gesto por
  `Input.dispatchMouseEvent`; con la versión rota, el guion de colocación imprime `sel: null`.

## D-91 · La flota se dibuja en pixel art, vista desde arriba
**Fecha:** 2026-09-20 · **Estado:** vigente
**Decisión:** Los barcos de Batalla Naval dejan de ser bloques grises lisos. Cada casilla pinta un
**trozo de 16×16 píxeles** y los trozos calzan entre sí para armar el barco: popa, tramos del medio
y proa. Todos **empiezan y terminan en punta**, cada clase tiene su silueta y sus detalles
(portaaviones con pista y aviones, acorazado con torretas de cañones amarillos, submarino cilíndrico
con el periscopio arriba), y el agua es **una sola baldosa repetida** en todas las casillas, como un
tileset. Vive en `batalla-naval/flota.js`, que **genera** `python3 tools/fleet.py`.

**Por qué:** el tablero era un damero de rectángulos idénticos; la flota no se leía como flota y las
cinco clases de barco solo se distinguían por el largo. Con la silueta, el jugador ve de un vistazo
cuál es cuál —que es justo lo que hay que decidir mientras se coloca— y la pantalla deja de parecer
una hoja de cálculo.

**Por qué generado y no dibujado a mano:** son 17 trozos de 256 píxeles. Escritos a mano, cada barco
sale con distinto grosor de línea y distinta luz; con funciones (`casco`, `torreta`, `puente`,
`remaches`) todos tienen la misma mano y cambiar un detalle es cambiar una línea del script. Lo que
se edite a mano en `flota.js` se pierde en la próxima pasada, y eso está dicho arriba del archivo.

**Cómo se pinta:**
- **Los barcos van en el DOM**, un `<svg>` por casilla ocupada (17 dibujos en el peor caso), con los
  colores en variables CSS. Por eso el barco elegido es el **mismo trazado con otra paleta**
  (`.cell.sel`) y no hay que dibujarlo dos veces; girarlo es `transform: rotate(90deg)`.
- **El agua va de fondo** (`--agua`, una imagen `data:` armada una sola vez), no de contenido: cien
  casillas con su SVG serían miles de nodos para pintar mar quieto.
- Tocado y hundido siguen encima, y el barco se apaga debajo con un filtro en vez de taparse: se ve
  el trozo ardiendo, que es más claro que un cuadrado de color.

**Consecuencias:** `batalla-naval/flota.js` entra a la lista de módulos versionados de
`set-version.py` (C-11). Las fichas de la lista de barcos muestran el barco en chico en vez de tres
cuadraditos. Las capturas del README de este juego cambian y hay que rehacerlas.

## D-92 · De quién es el turno se ve sin leer
**Fecha:** 2026-09-20 · **Estado:** vigente
**Decisión:** En Batalla Naval el turno deja de vivir solo en el titular. Se dice con **cuatro
señales redundantes**, ninguna de las cuales hay que leer:
1. **La barra de estado cambia de color y de forma.** Rellena en lima con 🎯 cuando te toca
   (`.status.mine`), apagada en gris con ⏳ cuando no (`.status.theirs`).
2. **El tablero del rival se apaga cuando no puedes disparar** (`.enemy.locked`) y late con un
   halo cian cuando sí (`.enemy.live`). Apagado no es tapado: los impactos se siguen leyendo,
   porque el tablero se mira igual mientras se espera.
3. **Tocarlo fuera de turno responde**: el tablero se sacude, suena el error y la bajada explica
   qué pasó ("Espera tu turno: ahora dispara Cata"), como pide C-8b.
4. **Cuando llega tu turno, el celular avisa**: `SFX.turn()` y vibración; en sala, además, el
   título de la pestaña pasa a "🎯 ¡Te toca!" mientras la app está de fondo.

**Por qué:** los jugadores decían no entender cuándo les tocaba. La única diferencia entre las dos
pantallas era una frase en Bangers blanca del mismo tamaño en los dos estados —"¡Te toca! Dispara a
Javi" contra "Cata está apuntando…"—; a la distancia a la que se mira un celular sobre la mesa, las
dos se leen igual. Todo lo demás —el tablero, el marcador, los títulos— era idéntico, y el tablero
enemigo parecía tocable en los dos casos porque se veía igual de vivo. Dudo y Julepe ya resolvían
esto encendiendo el asiento de quien juega (`.seat.turn`); acá no había equivalente.

**Por qué redundantes:** el celular puede estar en silencio, boca abajo, o con
`prefers-reduced-motion`. Cada señal cubre el hueco de otra, y la más barata —el color— es la que
funciona de reojo.

**Por qué el aviso sonoro espera:** el turno suele llegar justo detrás del resultado del disparo del
rival. Los dos sonidos juntos se escuchan como uno solo y feo, así que `SFX.turn()` sale 650 ms
después cuando acaba de sonar un resultado.

**Consecuencias:** `turnYou` y `turnOther` pasan a ser titulares cortos y la instrucción baja a
`turnYouSub`/`turnOtherSub`; entra `notYourTurn`. Se van `pickCell` y `cpuShot`: la bajada del turno
ajeno ya no repite el disparo (lo canta el toast) y con eso se cae de paso un error viejo —en sala
con otra persona decía "El celular disparó a I7"—. `SFX.turn()` es nuevo en `assets/js/sound.js` y
queda disponible para los demás juegos, que también tienen que anunciar el cambio de turno (C-4).

## D-93 · Un barco se hunde en un segundo, no en un repintado
**Fecha:** 2026-09-20 · **Estado:** vigente
**Decisión:** Hundir un barco deja de ser un cambio de clase y pasa a durar **1,4 s en pantalla**:
1. **Fogonazo** en la casilla que se disparó: una onda blanca que se expande (620 ms).
2. **El fuego corre por el casco**, 90 ms por casilla, **hacia los dos lados desde el impacto**.
   Cada casilla se sigue viendo como estaba hasta que le llega su turno.
3. **El casco se va entero** —todos los trozos a la vez, cuando la cascada terminó— y vuelve a
   asomar hecho pecio, en su sitio.
4. **Espuma**: cuatro burbujas suben del medio del casco a los ~630 ms.

Pasa en los dos tableros: en el del rival cuando hundes tú, en el propio cuando te hunden.
Y **el resultado espera** a que el barco termine de irse, salvo en un celular, donde manda la
pantalla de pase (C-9).

**Por qué:** el hundimiento es el único momento en que el tablero del rival **dibuja el casco**.
Las casillas ya se conocían —para hundir hay que haberlas tocado todas—, pero el barco no: hasta
ese disparo eran cinco cuadrados naranjos, y recién al hundirse aparece el portaaviones con su
pista, o el submarino con el periscopio (D-91). Eso ocurría en un repintado: cinco cuadrados rojos
con fuego, de golpe, y el barco que acababas de matar no se veía nunca como barco. La cascada le
da tiempo al dibujo de leerse, y de paso canta el largo y el sentido.

Y había una asimetría que lo delataba: **`SFX.sink()` ya dura casi un segundo** —explosión, sierra
que cae y cuatro burbujas entre los 0,5 y los 0,95 s—. El sonido contaba un hundimiento entero
mientras la imagen tardaba 0 ms. La espuma va donde van las burbujas del sonido.

**Lo que costó, que no se ve en el resultado:**
- **El casco no se escora.** Con escora, cada trozo giraba sobre *su* centro y el acorazado se
  partía en cuatro baldosas con huecos. El arreglo obvio —girar todos sobre el centro del barco—
  es peor: el trozo vertical ya gira 90°, así que hacerlo sobre un punto lejano lo lanza una
  casilla entera. Hacerlo bien pide envolver cada dibujo en otro elemento; no vale ese precio.
- **El `translateY` va antes del giro**, o el barco vertical se hunde de costado: en su marco
  rotado, "abajo" apunta a un lado. Por eso `--giro` es una variable y no está escrito en el
  `transform`: la animación compone sobre él sin borrarlo ni duplicarse por orientación.
- **Los retardos se calculan contra el reloj y salen negativos.** `renderPlay` rehace la grilla
  entera en cada mensaje; un `animation-delay` negativo arranca la animación ya empezada, así que
  el repintado **retoma** el hundimiento donde iba en vez de reiniciarlo.
- **El "antes" de cada casilla es una clase, no un fotograma.** Chrome no anima variables CSS sin
  registrar ni `content`: los ignoraba en silencio y el barco aparecía ardiendo entero en el
  fotograma cero. Ahora `.aun-vivo` lo sostiene y la saca un temporizador por casilla. Las
  animaciones van en `forwards` —no en `both`— para que el relleno no la pise antes de tiempo.
- **El último fotograma es el estado de reposo.** Si la animación terminara con el casco hundido,
  el `forwards` lo dejaría colgado y el siguiente disparo lo devolvería de un salto a la vista.
  Además, así `prefers-reduced-motion` degrada solo: sin animación queda exactamente lo de hoy.

**Consecuencias:** `.cell .barco` gana la variable `--giro`. Entran las clases `hundiendo`,
`aun-vivo`, `impacto` y `burbuja`, y `HUNDIR_MS` en `game.js`. La pantalla de resultado de sala y
de contra el celular tarda 1,4 s más cuando la partida termina con un hundimiento, que es siempre.

## D-94 · La Copa: un torneo de varios días en vez de una sala más
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:** La primera modalidad que no es una partida: una **copa** de 7 días (y una de 3 para
probar, D-100) donde cada día se abre un minijuego igual para todos, que se juega una vez y da
puntos **por posición** (10-8-6-5-4-3-2-1-1-1), no por puntaje bruto. Cada día se puede jugar ese
día o el siguiente (día de gracia); la final vale doble y no tiene gracia; hay un comodín ×2 por
jugador; la inscripción sigue abierta hasta que empieza la final; los resultados de un día se ven
recién después de jugarlo o cuando cierra.
**Por qué:** lo que hace funcionar a los juegos diarios (Wordle, Connections) es el mismo desafío
para todos, una vez al día, con un puntaje comparable y una tarjeta que se comparte sin revelar la
respuesta. Los puntos por posición hacen que siete minijuegos con escalas distintas pesen lo mismo
y que un día aplastante no defina la copa. La gracia existe porque un grupo de amigos no juega
todos a la misma hora; la final sin gracia existe porque, si no, el campeón se sabría un día tarde.
**Consecuencias:** carpeta `copa/`, entrada `copa` en `games.js` con `torneo: true` (no cuenta en
`MAX_PLAYERS`: cada día manda su señal con un jugador) y el modo `copa` en `MODES` para el panel.
Los minijuegos elegidos, y por qué Conexiones y el Bimaru reemplazaron al Ahorcado y a una flota
escondida con suerte, están en `docs/juegos/copa.md`.

## D-95 · El tiempo desempata, y es tiempo activo
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:** El tiempo nunca es el puntaje principal de un minijuego: solo desempata. Y se mide
como **tiempo activo** (`reloj` en `copa/engine.js`): se pausa cuando la pantalla no está visible.
**Por qué:** en un celular te interrumpen. Castigar una llamada en medio del Número del Día no mide
nada. Pausar con la pantalla oculta deja una trampa posible (esconder la pestaña para pensar sin
ver), pero sin ver el tablero no se piensa mucho.
**Consecuencias:** el intento guarda `{ ms, desde }` y lo retoma igual después de recargar.

## D-96 · Una cuenta es nombre y PIN dentro de una copa, con acceso anónimo de Firebase
**Fecha:** 2026-09-23 · **Estado:** corregida por D-359
**Decisión:** No hay cuentas de la app. Dentro de cada copa, una persona es un `pid` con nombre y
PIN de 4 dígitos, y entra desde cualquier celular o computador con el link. Cada navegador inicia
sesión **anónima** en Firebase Auth; para escribir por un jugador, su `uid` tiene que estar sentado
en `torneoSeats/<código>/<pid>/<uid>`, y las reglas aceptan el asiento solo si trae el mismo hash
que `torneoKeys/<código>/<pid>`. Ninguna de las dos ramas se puede leer.
**Por qué:** el dueño pidió poder jugar un día en el celular y otro en el computador sin crear
cuentas. Las reglas de Realtime Database no calculan hashes, pero sí comparan textos: el hash viaja
en la escritura y se compara contra uno que nadie puede leer. Un PIN de 4 dígitos se puede adivinar
probando 10.000 veces en línea: separa cuentas entre amigos, no protege contra un atacante, y eso
es lo que se busca.
**Consecuencias:** **hay que habilitar el acceso anónimo** en la consola (Authentication → Sign-in
method → Anonymous), además de publicar las reglas. Si falta, crear o entrar a una copa falla con
un mensaje que lo dice (`errConfig`). El árbol se llama `torneos/` y no `copas/`: las reglas no
pueden nombrar juegos (C-16) y `panel/adapta.test.mjs` lo revisa.

## D-97 · El contenido del día sale de una semilla pública, y ¿Dudo o le creo? puntúa decisiones
**Fecha:** 2026-09-23 · **Estado:** corregida por D-102
**Decisión:** Todo lo de un día (el número, las cartas, la flota, los dados, el orden de las
palabras) sale de `hash32("código:día:sal")` con el generador de Línea de Tiempo. En ¿Dudo o le
creo?, cada mano da `100 × P(la elección era cierta)`, calculada con lo que el jugador veía, sin
importar lo que salió al destapar.
**Por qué:** una semilla pública es la única forma de que todos jueguen lo mismo sin servidor. El
precio es que quien lea el código puede calcular la respuesta; entre amigos no vale la pena un
servidor para impedirlo. En Dudo (D-70) los dados no salían de la semilla porque había un rival que
podía calcularlos; acá todos ven la misma mesa. Y puntuar el resultado de la mesa sería premiar la
suerte: una buena decisión puede perder al destapar.
**Consecuencias:** el mismo código da la misma copa en cualquier navegador; las pruebas lo comparan.

## D-98 · La Copa va solo en español por ahora
**Fecha:** 2026-09-23 · **Estado:** reemplazada por D-170
**Decisión:** La interfaz y el contenido de La Copa son solo en español, sin selector de idioma. Es
una excepción a C-3: la entrada de `games.js` declara `idiomas: ['es']`, su tarjeta del menú sí va
en los tres idiomas (y en inglés y portugués dice que por ahora es en español), y
`assets/js/i18n.test.mjs` no compara sus `LOCALES`.
**Por qué:** el contenido es chileno (grillas de Conexiones, chilenismos) y no se traduce: una copa
mixta español/portugués no sería pareja. Traducir la interfaz sin traducir el contenido dejaría una
copa a medias.
**Consecuencias:** LIG-32 queda pendiente: cada idioma necesita su propio contenido.

## D-99 · Los avisos del grupo los manda el admin, con mensajes armados
**Fecha:** 2026-09-23 · **Estado:** corregida por D-221
**Decisión:** La app no manda WhatsApp ni correos. El admin tiene cuatro mensajes armados que salen
por el diálogo de compartir del celular: invitación, **recordatorio del día**, tabla parcial y
resumen final. El recordatorio sirve cualquier día: antes de empezar dice cuándo parte y el primer
juego; durante la copa dice qué toca, hasta cuándo, si queda el de ayer en su gracia y quién falta.
Cada jugador comparte además su tarjeta del día, que nunca revela la respuesta.
**Por qué:** mandar avisos automáticos necesita un servidor y un proveedor pago; el diálogo de
compartir ya llega a WhatsApp y el grupo es donde se juega la pica. La tarjeta es la notificación.
**Consecuencias:** LIG-33 (avisos automáticos) queda para después.

## D-100 · La Copa de 3 días es solo para probar
**Fecha:** 2026-09-23 · **Estado:** corregida por D-266
**Decisión:** La portada y el formulario ofrecen solo la Copa de 7 días. La de 3 días (Línea,
Conexiones y la final) aparece con `?tres` en la URL o en el modo de prueba.
**Por qué:** el dueño la quiere para probar con amigos, no como producto. Promocionarla en la
portada la haría la opción por defecto de quien quiere algo corto.

## D-101 · La Copa se prueba en un laboratorio antes de llegar al menú
**Fecha:** 2026-09-23 · **Estado:** corregida por D-112, D-175, D-262, D-281
**Decisión:** La Copa sale del menú como juego jugable: su tarjeta se sigue viendo, apagada y con
"Próximamente" (`available: false`, `labs: true` en `games.js`), y se juega desde **`/labs/`**,
una página que no está enlazada desde el menú ni se indexa. El laboratorio ofrece tres pasos:
1. **Cada minijuego por separado** (`/copa/?practica=<id>`): contenido al azar, sin copa ni
   Firebase. Al final muestra la semilla y la deja en la URL (`&semilla=K7Q2X`), para repetir
   exactamente la misma partida.
2. **Una copa entera en un computador** (`/copa/?prueba`): el almacén local y el reloj adelantable.
3. **Una copa de verdad con amigos cercanos** (`/copa/?labs`): Firebase real, con la Copa de 3
   días disponible (D-100).

En la práctica, en el tablero y en el resultado del día hay un botón **🐞 Reportar un problema o
dejar un comentario** que guarda el texto, un nombre opcional y el contexto (copa, día, pantalla,
juego, semilla, versión y navegador) en `feedback/` de Firebase, que solo el dueño puede leer.
**Por qué:** el dueño quiere probar la mecánica de cada juego y después una copa real con amigos
cercanos, recibir comentarios y reportes, y recién entonces abrirla a todos. Una copa necesita
días reales para probarse, así que tiene que estar publicada; el laboratorio la publica sin
ofrecerla. Los reportes llevan el contexto porque "no me funcionó" sin copa, día ni semilla no se
puede reproducir.
**Consecuencias:** mientras esté en el laboratorio, el enlace de arriba de La Copa vuelve a
`/labs/` y no al menú. Las copas creadas desde el laboratorio son copas normales y sus links
traen la tarjeta social de siempre (`og.mjs` genera tarjeta para los juegos con `labs`). La
portada del README la marca `🧪 lab`. Los reportes se leen por ahora en la consola de Firebase
(*Realtime Database → Data → feedback*); que el panel los muestre queda pendiente. Hay que
publicar las reglas de nuevo por el nodo `feedback`.

## D-102 · La Copa no inventa UX: reusa la de los juegos que ya existen
**Fecha:** 2026-09-23 · **Estado:** corregida por D-107
**Decisión:** Después de probarla en el laboratorio, el dueño pidió no reinventar interfaz: lo
que ya existe en otro juego está probado. Por eso:
- **⏳ Línea Relámpago** es el modo solo de Línea de Tiempo: una mano de 9 cartas que se juegan
  en cualquier orden (10 hitos en total), las ranuras de la línea, el **arrastre compartido**
  (`assets/js/arrastre.js`, D-85), el botón que dice qué carta coloca y el veredicto con el error
  que se queda hasta tocarlo y dice dónde iba. Los estilos salieron de `linea-de-tiempo/style.css`
  a **`assets/css/linea.css`**, sin cambios, y los textos son los de Línea de Tiempo.
- **🔢 Toque y Fama: adivina el número** (antes "El Número del Día") y **🔤 Toque y Fama con
  letras** usan el teclado de Toque y Fama, que salió a **`assets/js/teclado.js`** con sus
  **notas** (toque largo para tachar), el tablero de intentos y las pistas de famas y toques. Sus
  estilos pasaron a **`assets/css/teclado.css`**. ¿En qué año? usa el mismo teclado.
- **Batalla Naval: Solitario** sale: con pocas pistas obligaba a adivinar. Lo reemplaza **👑
  Reinas** (el Queens de LinkedIn) el día 4, y **〰️ Zip** y **☀️ Tango** quedan en el laboratorio
  para probarlos. Los tres se generan con solución única.
- **¿Dudo o le creo?** sale: aburría. Lo reemplaza **🔤 Toque y Fama con letras** el día 5: una
  palabra de 5 letras distintas con famas y toques, y cada letra pintada con el color de su pista,
  como Wordle.
- **Conexiones** se rehace más difícil: temas generales, un distractor por grilla y juegos de
  palabras en el grupo morado.
**Por qué:** una interfaz nueva hay que probarla desde cero; una que ya se juega en la app trae
sus arreglos (D-85, D-86, D-87, D-38) y se aprende una sola vez. Para los juegos nuevos (Reinas,
Zip, Tango) la referencia es LinkedIn, que los juegan millones cada día.
**Consecuencias:** Línea de Tiempo y Toque y Fama cargan las hojas compartidas y Toque y Fama usa
el teclado compartido: un cambio ahí cambia los dos juegos. Las copas creadas antes con el
Solitario o Dudo en el calendario juegan Reinas y Toque y Fama con letras en esos días. Reinas y
Tango restan 10 puntos por jugada que rompe una regla, pero en Tango pasar por el sol para llegar
a la luna no cuenta como error: solo cuenta dejar la casilla rompiendo una regla. Zip no tiene
errores: todos los que terminan sacan 100 y el tiempo ordena el día.

## D-103 · Zip por niveles contra el reloj, sesión de prueba en cada juego, y ajustes a Reinas y Tango
**Fecha:** 2026-09-23 · **Estado:** corregida por D-167, D-250
**Decisión:** Lo que salió de probar la v0.44 en el laboratorio:
- **Zip** pasa a jugarse **por niveles contra el reloj**: tres minutos de tiempo activo para
  resolver la mayor cantidad de tableros, cada uno igual o más grande que el anterior (4 × 4 → 7 ×
  7). El puntaje son los niveles resueltos y el desempate, cuándo se resolvió el último. Además,
  llegar al último número sin pasar por todas las casillas **avisa cuántas faltan** y ya no deja
  seguir: el dueño "terminaba" en el último número y el juego no decía nada.
- **Sesión de prueba antes de cada día** ("🧪 Probar primero, no cuenta"): la misma mecánica con
  otro contenido —otra temática para Línea y ¿En qué año?, una grilla de práctica fuera del sorteo
  para Conexiones, tableros más chicos, un minuto de Zip— que no se guarda ni cuenta. Se arma con
  un código derivado del de la copa (`codigoEnsayo`), así que es la misma para todos.
- **Reinas:** un toque pone o saca la reina; el **toque largo** pone o saca la X, que solo sirve
  para descartar casillas (como las notas de Toque y Fama). El click que cierra el toque largo se
  traga, y solo ese: un toque rápido después no se pierde.
- **Tango:** la marca de distintas pasa de × a **≠**; hay **borrar todo** y **pista**, los dos con
  un segundo toque para confirmar, y **consejos** para cuando uno se atasca. La pista revela una
  casilla (primero una mal puesta; si no hay, la vacía con más vecinas llenas) y **cuesta 15
  puntos**, más que un error (10), porque entrega una casilla segura.
**Por qué:** un juego diario tiene que entenderse antes de jugarlo de verdad, porque el intento
es uno solo. Y un tablero que no dice por qué no terminó parece roto.

## D-104 · Los reportes se mandan sin cuenta y se leen sin cuenta
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:** El botón 🐞 de La Copa manda el reporte por REST a `feedback/`, sin sesión anónima ni
PIN (`copa/reportes.js`). Las reglas dejan escribir a cualquiera (una sola vez por reporte, con el
largo validado) y **leer a cualquiera**, para que `node tools/reports.mjs` los traiga sin la
cuenta del dueño y se puedan revisar en la conversación.
**Por qué:** el reporte fallaba con "Vuelve a entrar con tu nombre y tu PIN" (las reglas del nodo
no estaban publicadas, y además el envío dependía del acceso anónimo). El dueño pidió que fuera
libre y que Claude lo leyera cuando se le pida. Los reportes son comentarios de prueba: no llevan
PIN ni datos de la cuenta, solo el texto, un nombre opcional y el contexto (copa, día, pantalla,
juego, semilla, versión y navegador). El nombre, con una etiqueta a la vista, queda guardado en
el dispositivo (`localStorage`, no en la cuenta: en el laboratorio no la hay) para el próximo
reporte. Que se puedan leer públicamente es el precio de no tener
servidor; si eso cambia, se cierra la lectura al UID del dueño y se leen desde el panel.
**Después:** D-306 suma `tester`, la etiqueta de la llave del laboratorio (nunca la llave).

## D-105 · Cuenta regresiva antes de cada juego con reloj
**Fecha:** 2026-09-23 · **Estado:** corregida por D-258 · **Relación:** desde la 0.46 la cuenta va de 3 a 1: con 5 se hacía larga. Desde la 0.158.1 la capa es compartida (`assets/js/cuenta-regresiva.js`, D-102) y la usa también Agentes (D-286)
**Decisión:** Al tocar Empezar (el día, la sesión de prueba o la práctica) aparece una capa con
el nombre del juego y una cuenta de 3 a 1, un número por segundo, con un tic y una vibración
corta. Después dice **¡A jugar!** y se desvanece sola sobre el tablero. El tablero no se dibuja
y el reloj no corre hasta ese momento. Todos los minijuegos de La Copa la llevan, porque en
todos el tiempo desempata. Si se retoma una partida empezada, el tablero vuelve de una.
**Por qué:** el reloj partía con el toque, mientras la persona todavía acomodaba el teléfono. La
cuenta da el mismo punto de partida a todos.

## D-106 · Al terminar, cómo se calculó el puntaje
**Fecha:** 2026-09-23 · **Estado:** corregida por D-353
**Decisión:** El resultado del día, el de la práctica y el de la sesión de prueba traen un
recuadro **Cómo se calculó tu puntaje**, con la cuenta línea por línea y en frases completas
(`copa/desglose.js`, con las mismas funciones del motor): los grupos y los errores, las reinas en
conflicto, las pistas, los intentos, cada hito del año o cada ronda de la final. Los descuentos
en cero no se nombran. Cierra con el total y el desempate. En la copa suma cómo el lugar del día
se vuelve puntos (10-8-6-5-4-3-2-1) y si ese día valía el doble. El desglose no se sube a la
copa: si el resultado se mira otro día, el recuadro muestra la regla del juego.
**Por qué:** un puntaje suelto ("85/100") no dice qué hacer distinto mañana.

## D-107 · Reinas puntúa el tiempo, no los errores
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:** Poner una reina que choca con otra ya no resta: el tablero la marca en rojo y se
corrige. Lo que da puntos es el **tiempo activo en resolverlo**: hasta 30 segundos vale 100, y
después baja parejo hasta 10 a los 5 minutos (un 8 × 8 de LinkedIn se resuelve en uno o dos
minutos, que quedan entre 85 y 50). Más lento, 10; sin resolver, 0. En la ronda de Reinas de la
final, resolverlas vale 100: ahí el tiempo de toda la final ya desempata. La tarjeta muestra el
tiempo (`👑 ⏱ 1:23 ✅`). La pantalla le pasa el tiempo al motor con `ctx.tiempo()` al terminar.
**Por qué:** castigar el ensayo y error en un juego de deducción premia la cautela, no la
habilidad; y el tiempo ya era el desempate, así que la escala solo lo vuelve visible.

## D-108 · Toque y Fama: Palabra, con puntos por letra encontrada
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:** 🔤 Toque y Fama con letras pasa a llamarse **Toque y Fama: Palabra**, en la línea
de "Toque y Fama: adivina el número". El puntaje, de 0 a 100, deja de ser solo por intentos:
- **10 puntos por cada letra encontrada en su lugar** (fama), contando el lugar y no el intento:
  un lugar que ya dio fama no vuelve a sumar aunque se repita en otros intentos. Hasta 50.
- **Si saca la palabra, 50 más, menos 5 por cada intento después del primero** (50 al primero,
  15 al octavo).
Quien se acercó (por ejemplo 4 letras en su lugar, 40 puntos) gana más que quien no, y quien la
sacó (65 como mínimo) siempre gana más que quien no la sacó (50 como máximo). Mientras juega, la
pantalla dice cuántas letras lleva en su lugar y cuánto suman. La ronda de la final usa la misma
cuenta (con 6 intentos, de 75 a 100 si la saca).
**Por qué:** con "9 menos los intentos, 0 si no", quedar a una letra valía lo mismo que no haber
acertado ninguna.

## D-109 · El laboratorio con la UX de producción, la solución de Zip y los reportes que no se pierden
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:**
- **La práctica del laboratorio tiene la misma antesala que un día de la copa**: cómo se juega,
  el puntaje, **🧪 Probar primero (no cuenta)** con el contenido de prueba, y Empezar, con la cuenta
  regresiva y el resultado con su desglose. Lo que se prueba en el laboratorio es lo que se juega.
- **Zip:** si el tiempo se acaba con un nivel a medias, antes de ir al resultado se dibuja la
  solución de ese nivel (en celeste punteado, distinto del verde de un nivel resuelto).
- **Conexiones:** solo el grupo recién resuelto se anima; antes todos parpadeaban con cada toque
  porque la pantalla se redibuja entera (primer reporte del laboratorio).
- **Reportes:** si no se pueden enviar (sin red, o las reglas lo rechazan), quedan guardados en el
  dispositivo y se reenvían solos al abrir La Copa (`reenviarPendientes`, hasta 20).
**Por qué:** el laboratorio sirve para decidir si un juego entra; si su UX difiere de la de la copa,
lo que se decide no es lo que se publica. Y un reporte escrito es caro de conseguir: no se pierde.

## D-110 · El admin de una copa nueva, la inscripción, el inicio movible y las demos del laboratorio
**Fecha:** 2026-09-23 · **Estado:** corregida por D-262, D-266
**Decisión:**
- **Recién creada, la copa abre en Administrar**, con una guía de la primera vez (se ve mientras
  el admin siga solo y la copa no haya partido): compartir la invitación, esperar a que se
  inscriban (se puede desde ya, antes del inicio) y, si quiere, cerrar la inscripción. "Mensajes
  para el grupo" pasa a **"Mensajes para los competidores"**; Renombrar va a la derecha del nombre.
- **Cerrar y reabrir la inscripción**: `torneos/<code>/closed`, que solo escribe el admin; las
  reglas no dejan inscribirse a nadie nuevo con la copa cerrada. Los inscritos siguen entrando.
- **Mover el inicio a hoy o a mañana mientras nadie haya empezado un día**: `moverInicio`
  recalcula las ventanas. Las reglas dejan reescribir `meta` solo al admin, sin `started`, con el
  mismo nombre, días, calendario, admin y `createdAt`, y con el día 1 todavía abierto. La vista
  avisa si la copa ya partió sin que nadie jugara, o si parte hoy y quedan pocas horas.
- **Rendirse en Reinas** (el día y la ronda de la final): dos toques, la solución a la vista y 0
  puntos.
- **La Gran Final**: sin cuenta regresiva (cada ronda ya tiene su presentación), y el botón para
  seguir va debajo del tablero en las cinco rondas.
- **Demos del laboratorio** (`?prueba&demo=<escena>`, `copa/demo.js`): ocho escenas sembradas en el
  almacén local —copa recién creada, invitación, antes de partir, partió sin que nadie jugara,
  día 4 como jugador y como admin, el día de la final y el podio— para probar cada vista como
  en producción, sin Firebase ni esperar días.
**Por qué:** lo que el admin necesita saber justo después de crear la copa es qué hacer ahora; y
una copa creada con días de anticipación se desfasa si los amigos tardan en inscribirse.

## D-111 · La copa no usa la temática de Brasil
**Fecha:** 2026-09-23 · **Estado:** corregida por D-187
**Decisión:** Línea Relámpago, ¿En qué año? y la final eligen sus temáticas entre las de Línea
de Tiempo **menos Brasil** (`copa/juegos/mazos.js`). Las copas de prueba en curso pueden cambiar
de temática con esto (el sorteo es sobre una lista más corta).
**Por qué:** la copa se juega entre chilenos y la historia de Brasil no la resuelve casi nadie
que no sea brasileño.

## D-112 · Sin la barra del modo de prueba, y signos de Tango que se distinguen
**Fecha:** 2026-09-23 · **Estado:** vigente
**Decisión:**
- **Fuera la barra "Modo de prueba"** (+1 h, +1 día, Hoy) que aparecía abajo en `?prueba`. Servía
  para simular una copa entera adelantando el reloj; las demos del laboratorio (D-110) muestran
  cada punto de la copa sin eso, y el paso "Simular una copa" sale del laboratorio. El almacén de
  prueba sigue teniendo `adelantar()` para los guiones de punta a punta.
- **Tango:** las marcas entre casillas son más grandes y cada una tiene su color: **=** en celeste y
  **≠** en rosado. Antes eran iguales salvo por la raya y casi no se distinguían.
- **Zip:** al acabarse el tiempo, el reloj de arriba se congela en el tiempo final
  (`ctx.pararReloj()`) y la cuenta regresiva del nivel desaparece.
**Por qué:** la barra confundía al probar (nadie sabía para qué era), y un signo que no se lee a
la primera hace que el tablero parezca imposible.

## D-113 · Todos los minijuegos de 0 a 100, la hora del Pacífico, y "Invitar" solo antes de partir
**Fecha:** 2026-09-23 · **Estado:** corregida por D-194
**Decisión:**
- **Todos los minijuegos puntúan de 0 a 100**: Línea (la parte de cartas bien puestas), el número
  (100 menos 10 por intento extra), ¿En qué año? y la final (el promedio de sus hitos o rondas) y
  Zip (10 por nivel, hasta 100) se suman a los que ya iban de 0 a 100. Lo que decide la copa sigue
  siendo el lugar de cada día (D-94), así que ningún día pesaba más que otro; pero "2/10" al lado
  de "90/100" se leía como una ventaja, y ahora todos se leen igual.
- **Las copas nuevas usan la hora del Pacífico** (`America/Los_Angeles`), donde vive el dueño. La
  zona va en `meta.tz`, así que las copas ya creadas siguen con la de Chile. Administrar dice en
  qué zona van los días ("hora del Pacífico (Los Ángeles, California)").
- **"Invitar al grupo" sale del tablero cuando la copa ya partió**: el admin lo sigue teniendo en
  Administrar (todavía se puede entrar hasta la final). "Tus días" pasa a llamarse **Calendario**.
**Por qué:** lo que se ve tiene que contar la misma historia que las reglas.

## D-114 · La tarjeta bajo el puntaje, y TORRE en vez de DAMA
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** De los primeros reportes del laboratorio (`node tools/reports.mjs`):
- En el resultado del día y de la práctica, **la tarjeta para compartir va justo bajo el
  puntaje**, y la línea del tiempo (⏱) se muestra solo si la tarjeta no lo trae: en Reinas
  (`👑 ⏱ 1:23 ✅`) el tiempo aparecía dos veces.
- Conexiones: el grupo *Piezas de ajedrez* cambia **DAMA** por **TORRE**. "Dama" es el nombre del
  reglamento, pero en Chile se dice "reina", y un grupo que no se reconoce parece un error. REINA no
  se usa para no cruzarse con el minijuego Reinas.

## D-115 · Otra fecha de inicio, y pasar de día en las copas del laboratorio
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:**
- **El inicio puede ser hoy, mañana u otra fecha**, elegida en un calendario de hoy a 30 días
  más, al crear la copa y en Administrar (mientras nadie haya jugado). Las reglas aceptan un
  día 1 que empiece hasta 32 días después de ahora.
- **Copas de prueba:** las copas creadas desde el laboratorio llevan `meta.lab = true`. Su admin
  tiene en Administrar **"Pasar al día N"** (con confirmación): corre el inicio un día hacia atrás
  (`pasarDia`), así que lo de hoy queda como ayer, en su día de gracia, y se abre el día que sigue
  para todos. En el último día el botón es **"Terminar la copa"**. Lo jugado no se toca. Las
  reglas dejan reescribir `meta` de una copa `lab` aunque ya se haya jugado, siempre que no
  cambien nombre, días, calendario, admin, `createdAt` ni la marca `lab`. Las copas creadas antes
  de esta versión no la tienen.
**Por qué:** probar una copa de 7 días con amigos no puede tomar 7 días.

## D-116 · Cada cosa en su momento de la copa
**Fecha:** 2026-09-24 · **Estado:** corregida por D-176 · **Relación:** D-176 cambia la invitación solo en Administrar
**Decisión:** Una revisión de lo que depende de la etapa de la copa (antes de partir, en juego,
terminada) y de si la inscripción está cerrada:
- **Invitación** (en Administrar y en el tablero): solo antes de partir y con la inscripción abierta.
- **Recordatorio antes de partir**: si la inscripción está cerrada, no invita a inscribirse.
- **Tabla parcial**: solo mientras se juega; al terminar queda el resumen final.
- **Sacar a un jugador**: no se ofrece con la copa terminada (cambiaría el podio).
- **Quien abre el link de una copa terminada** ve "terminó" (no "va en el día 7 de 7") y que
  entre para ver el podio (no "ya está en la final").
Sigue abierta, a propósito, la inscripción tardía hasta la final (D-99): el admin la ve en
Administrar y la puede cerrar.
**Por qué:** un botón que no sirve en ese momento parece un error.

## D-117 · El admin puede eliminar la copa
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** Al final de Administrar hay un recuadro rojo **Eliminar la copa**. Pide dos
confirmaciones: un "¿seguro?" y después **escribir el nombre de la copa** (se compara sin
mayúsculas ni tildes). Borra de una vez `torneos/<code>`, `torneoKeys/<code>` y
`torneoSeats/<code>`; las reglas lo dejan solo al celular sentado como admin y solo para borrar
la copa entera. El admin ve "Copa eliminada"; quien la tenga abierta ve "Esta copa ya no existe:
su admin la eliminó", y su celular la olvida.
**Por qué:** las copas de prueba se acumulan, y una copa creada con un error no tenía salida.

## D-118 · Una copa se juega entre 2 y 10
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** El mínimo pasa de 3 a **2 jugadores** (el máximo sigue en 10). Con el admin solo,
la copa **no parte ni avanza de día**: el día de hoy muestra "hace falta al menos un competidor
más" en vez de Jugar, Empezar queda deshabilitado, y en una copa del laboratorio "Pasar al día"
no aparece. El reloj de la copa sigue corriendo; si el inicio pasa sin nadie más, el admin lo
mueve a hoy, mañana u otra fecha (D-110, D-115), porque nadie ha jugado. Se controla en la app y
en el almacén de prueba; las reglas de Firebase no saben contar jugadores, así que no lo impiden
(solo el propio admin podría saltárselo, jugando contra nadie).
**Por qué:** un duelo entre dos también es una copa; un torneo de uno, no.

## D-119 · El nombre de la copa, hasta 40 caracteres y con contador
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** El nombre de una copa se recortaba a 20 caracteres (el largo de un nombre de
jugador) aunque el campo dejaba escribir 30: "Copa Pirata (1ra prueba)" quedaba en "Copa Pirata (1ra
pru". Ahora llega a **40** (`COPA_MAX`, y las reglas aceptan hasta 40). Los campos de nombre
muestran un **contador** ("24 / 40", en amarillo al llegar al tope) y no dejan escribir más. Los
títulos largos parten línea en vez de salirse de la pantalla.
**Por qué:** un límite que no se ve se descubre cuando ya cortó el texto.

## D-120 · El calendario con fechas, el día de gracia explícito, y la invitación más simple
**Fecha:** 2026-09-24 · **Estado:** corregida por D-127
**Decisión:**
- **El tablero dice el día de la copa y su fecha** ("Día 2 de 7 · jueves 24 de septiembre"), y la
  tarjeta de hoy también ("Día 2 de 7 · jue 24"), como las tarjetas chicas del calendario.
- **El día de gracia se nombra**: el día de ayer que todavía se puede jugar dice "Día de gracia:
  puedes jugarlo hasta hoy a las 23:59" (antes, "Último día para jugarlo", que no explicaba por
  qué un día de ayer seguía abierto).
- **La invitación**: "7 días · Parte el viernes 25 de septiembre · 3 jugadores inscritos".
- **Inscribirse con un nombre que ya existe y su PIN correcto cuenta como entrar**, sin pasar por
  "Ya estoy inscrito". Con otro PIN, avisa que el nombre está tomado y que revise su PIN.
**Por qué:** del laboratorio: un día de ayer abierto sin explicación parece un error, y quien
vuelve a inscribirse casi siempre es alguien que ya estaba y cambió de teléfono.

## D-121 · El link propio de una copa (?pirata)
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** Al crear la copa, el admin puede darle un **link propio**:
`juegosdesalon.cl/copa/?pirata` en vez de `?KQRST`. Es un **alias**: la copa sigue guardada con
su código al azar, y `torneoAlias/<alias>` = `{ code, hasta }` apunta a ella.
- **Formato:** minúsculas, números y guiones, de 3 a 20; "Pirata" y " PIRATA " son el mismo, y
  tildes y ñ se simplifican. No puede tener la forma de un código (5 letras solas) ni ser una
  palabra de la URL (`prueba`, `labs`, …). El campo muestra en vivo cómo queda y si está libre.
- **Único mientras dure:** queda tomado hasta 7 días después de que la copa termina (`hasta`); se
  libera de inmediato si el admin la elimina, y se corre si mueve el inicio. Vencido, otra copa lo
  puede tomar: "pirata" de 2026 y "pirata" de 2027 son copas distintas con el mismo link.
- **Reglas:** el alias se escribe en la misma operación que crea la copa, así que si dos lo piden
  a la vez solo uno lo consigue; solo lo escribe el admin de la copa a la que apunta.
- **Links limpios:** los links que se comparten ya no llevan `&labs`: la copa sabe por dentro si es
  del laboratorio (D-115).
- **Lo que se acepta a cambio:** un link fácil hace la copa fácil de encontrar (cualquiera que
  pruebe `?pirata` la ve y, si la inscripción está abierta, se puede inscribir). La guía del admin
  le recuerda cerrar la inscripción cuando estén todos.
**Por qué:** el link es la invitación; tiene que poder decirse en voz alta.

## D-122 · Las reglas de Firebase se publican con un script
**Fecha:** 2026-09-24 · **Estado:** corregida por D-218
**Decisión:** `node tools/firebase/rules.mjs publicar` sube `firebase/database.rules.json` y la vuelve a
leer para verificar que quedó; `revisar` dice si lo publicado es lo del repo. Usa una **llave de
cuenta de servicio** que el dueño genera una vez en la consola y guarda fuera del repo
(`~/.config/juegos-de-salon/firebase-admin.json`, carpeta 700, archivo 600; `.gitignore` la
excluye por si acaso). Con ella firma un JWT, pide un token a Google y escribe
`.settings/rules.json`, lo mismo que el botón Publicar. No entra a la consola ni usa contraseñas.
**Por qué:** el paso manual de copiar y pegar las reglas se repetía en casi cada versión, y
mientras no se hacía, lo nuevo fallaba en producción sin que nadie se enterara.
**Cuidado:** esa llave da acceso de administrador a todo el proyecto. Si se filtra, se revoca en
la misma pantalla de la consola donde se creó.

## D-123 · Empezar y enviar el resultado aguantan un reintento
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** Con mala conexión, la escritura de "empecé" o del resultado puede llegar a Firebase
aunque el celular se canse de esperar y muestre "No pudimos conectarnos". Las reglas escriben
una sola vez, así que el reintento chocaba y el jugador quedaba trabado. Ahora, si la escritura
falla, el almacén mira si quedó hecha: si "empecé" ya está, se sigue jugando; si el resultado ya
está, cuenta como enviado.
**Por qué:** una jugadora de la copa Valdenenas vio ese error al tocar Empezar (se le resolvió al
reintentar), y revisando el caso apareció este riesgo.

## D-124 · Los mensajes para compartir: título con "La Copa:" y el link en su línea
**Fecha:** 2026-09-24 · **Estado:** corregida por D-165
**Decisión:** La tabla parcial se titula **"📊 La Copa: Valdenenas · Tabla de posiciones (día 2)"**
y cierra con **"⏳ ¡Día 2 en curso! Falta que jueguen: …"**; el resumen final, "🏁 La Copa: … ·
Terminó". Ya no se escribe "la {copa}", que con nombres propios quedaba "la Valdenenas". El link va
**dentro del texto, en su propia línea al final** ("🔗 https://…"): pasado aparte, Android lo
pegaba a la última frase.
El resultado individual queda completo: "🏆 La Copa: … · Día 1", "⏳ Línea Relámpago" y
"👤 Javier · 78/100", y debajo la tarjeta de colores.
**Por qué:** propuesta del dueño a partir del mensaje real de una copa.

## D-125 · El gráfico de posiciones muestra a todos, cada uno con su color
**Fecha:** 2026-09-24 · **Estado:** vigente
**Decisión:** En "Tu posición día a día" cada jugador tiene su línea de color (fijo por orden de
inscripción, de una paleta de 10 bien distintos), con su nombre y su lugar al final de la línea;
la propia va más gruesa y encima. Debajo, un botón por jugador con su color: tocarlo (o tocar un
punto) destaca su línea y apaga las demás; tocarlo otra vez, vuelven todas. Sigue mostrando solo
los días que el jugador ya puede ver (no delata lo de hoy).
**Por qué:** con el resto en gris no se podía seguir la carrera de nadie más que la propia.

## D-126 · La tabla parcial como imagen, y "(-1J)" para quien lleva menos juegos
**Fecha:** 2026-09-24 · **Estado:** corregida por D-141
**Decisión:**
- Bajo el gráfico de posiciones, **"📤 Compartir como imagen"** dibuja en el celular (canvas, con
  las fuentes de la app) una imagen de 1080 px de ancho: el nombre de la copa, "Tabla de
  posiciones · día N de 7", el gráfico con el color de cada jugador, la tabla y el link. Se
  comparte como archivo con el menú del sistema (WhatsApp, etc.); donde no se puede compartir
  archivos (computador), se descarga.
- Es la **tabla parcial tal como la ve quien comparte**. Para que no engañe, quien lleva menos
  juegos que el que más jugó va marcado junto a su nombre: **"Tomario (-1J)"** (`menosJuegos`).
  La misma marca va en el mensaje de texto "Tabla parcial" del admin y en el recuadro "Posiciones
  día a día" (al final de cada línea y en los botones de jugador), con la misma leyenda.
**Por qué:** una imagen se lee de un vistazo en el grupo; y en una tabla a mitad de día, el que
va último puede ser solo el que todavía no juega.

## D-127 · La invitación promocional
**Fecha:** 2026-09-25 · **Estado:** corregida por D-176
**Decisión:** La invitación que comparte el admin (y "Invitar al grupo" del tablero) es un
mensaje para animar a participar:

> 🏆 *La Copa: Valdenenas* · ¡Estás invitado!
> ¿Te la puedes? Son 7 días y 7 minijuegos, con una sola oportunidad al día. Todos juegan lo
> mismo y la tabla dice quién manda. Quien acumula más puntos se lleva la gloria. 🥇
> 📅 Parte el viernes 25 de septiembre. · ⏱️ Unos pocos minutos al día, desde tu celular.
> 👥 Ya se inscribieron: Javier, Mica y Tomarcos. · 🔑 Entra con tu nombre y un PIN de 4 números:
> 🔗 link

**Los minijuegos no se nombran: son sorpresa.** No lleva mensaje personal del admin. Sigue
ofreciéndose solo antes de que parta la copa y con la inscripción abierta (D-116).
**Por qué:** pedido del dueño; la invitación es lo primero que ve quien todavía no se decide.

## D-128 · Conexiones agrupa por significado, no por juegos de palabras
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** Los grupos de Conexiones son lo que las cuatro cosas **son o tienen en común**
(MADERA, PÓLVORA, PETRÓLEO y CARBÓN son combustibles). Salen los diez grupos de juegos de
palabras: "___ roja/negra/verde", "___ de mesa", "Bodas de ___", "Estar en las ___", "esconden un
animal/número", "empiezan con una nota musical" y "tienen dientes/cuello/ojos". Entran:
combustibles, herramientas, instrumentos de viento, muebles, electrodomésticos, partes de una
casa, herramientas de jardín, frutas, colores, piedras preciosas, árboles, metales y útiles
escolares. La dificultad queda en los **distractores** (LIBRA: moneda o peso; NARANJA: fruta o
color; TURQUESA: color o piedra). Un test impide volver a meter grupos de juegos de palabras.
**Sin cambiar a mitad del día:** la grilla de cada copa se elige por su código. Las copas cuyo día
de Conexiones empezó antes del corte (`CAMBIO_D128`, 26-09-2026 00:00 hora del Pacífico) siguen con
la grilla de antes (`GRILLAS_ANTES_D128`, intacta); las demás reciben la nueva. El corte tiene
que quedar después del momento en que se publica.
**Por qué:** feedback de jugadores: "tarjeta" y "caperucita" unidas por "roja" era demasiado
rebuscado; un grupo tiene que poder adivinarse pensando en las cosas, no en las palabras.

## D-129 · Toque y Fama: jugar solo en vez de contra el celular
**Fecha:** 2026-09-25 · **Estado:** corregida por D-142
**Decisión:** El tercer modo de Toque y Fama deja de ser "🤖 Contra el celular" (un duelo contra un
solver que adivinaba tu número) y pasa a ser **"🧍 Jugar solo"**: el celular elige un número
secreto y tú lo adivinas en la menor cantidad de intentos, con récord por cantidad de cifras y
cero al inicio, como Línea de Tiempo (D-27). No hay número propio, ni réplica, ni pantalla de
secreto. El solver sale del motor. En el tablero único de jugar solo, y en el de Toque y Fama de La
Copa, las pistas van con palabra completa ("2 famas", "1 toque", "nada"); en los dos tableros lado
a lado del duelo y en Letras (cinco letras de colores) siguen abreviadas ("2F 1T") porque a 320 px
no caben. La pista del teclado dice "número secreto"
en vez de "número del rival", que en La Copa no existe.
**Por qué:** lo pidió el dueño. Adivinar un número es entretenido por sí solo; el duelo contra una
máquina que siempre lo resuelve en 5 o 6 intentos no agregaba nada. Y La Copa, que reusa los
textos de Toque y Fama, hablaba de un rival que no hay.
**Consecuencias:** C-5 ya no pone a Toque y Fama como ejemplo de "contra el celular". Una partida
guardada del modo anterior no se ofrece para retomar. El panel verá el modo `solo` en vez de `cpu`
desde esta versión.

## D-130 · El tiempo se corta al terminar el tablero
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** En todos los minijuegos el reloj se detiene cuando el tablero termina (resuelto,
perdido, rendido o sin tiempo), no cuando se toca "Ver resultado": cada pantalla llama
`ctx.pararReloj()` al ver su estado final. Lo que se tarda en tocar el botón ya no cuenta para el
desempate. El reloj detenido se guarda con la partida, así que recargar la página no lo reanuda.
En la Gran Final solo lo detiene la última ronda.
**Por qué:** feedback del laboratorio: en Conexiones el tiempo seguía corriendo con el tablero
ya resuelto, mientras se miraban los grupos.

## D-131 · La tabla muestra los siete días de cada jugador
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** Cada fila de la tabla tiene un bloque por cada día de la copa, también los que no
abren: con los **puntos** si ya se ven (dorado si ganó el día, borde naranja si valía doble), **✓**
si jugó pero todavía no puedes ver sus puntos, **• por jugar** (borde amarillo) si el día está
abierto y no lo ha jugado, **– no jugó** (rojizo) si cerró sin jugarlo, y **vacío** si todavía
no abre. Una leyenda debajo explica los estados.
**Por qué:** pedido del dueño: que cada uno vea su grilla completa y qué le queda.

## D-132 · Un agente de usabilidad con ronda diaria y dilemas como issues
**Fecha:** 2026-09-25 · **Estado:** corregida por D-204, D-213, D-275, D-276, D-303, D-304, D-313
**Decisión:** Un subagente (`.claude/agents/usability.md`) revisa solo usabilidad: textos,
botones, interacciones, navegación y mensajes para compartir, con la guía `docs/USABILIDAD.md`
(reglas U-n, que crecen con cada decisión del dueño).
- **Cuándo:** cada PR que abre Claude pasa por él antes de mostrárselo al dueño, y hay una **ronda
  diaria a las 5:00 hora del Pacífico** (tarea programada en el Mac del dueño, que tiene la llave
  de Firebase y el servidor local).
- **Qué hace solo:** lo obvio (algo que no cumple lo ya decidido, ortografía, textos cortados o
  encimados, botones chicos o sin aire), en un PR que **no fusiona**.
- **Qué pregunta:** textos nuevos, puntajes, reglas, funciones, rediseños y todo lo discutible,
  como **issues de GitHub** con la etiqueta `usabilidad` (estados `pendiente` → `resuelto` o
  `archivado`). Se crean, resuelven, archivan y reabren desde la conversación con
  `node tools/agents/dilemmas.mjs`; la decisión se anota en la guía.
- Los guiones `copa.mjs` y `look.mjs` aceptan `SITIO=http://localhost:<puerto>` para probar una
  copia aparte del repo sin chocar con la que está sirviendo el puerto 8765.
**Por qué:** pedido del dueño: bugs como el reloj de Conexiones o los textos rebuscados se
tienen que encontrar solos, y las dudas llegarle ordenadas.

## D-133 · Las reglas de cada minijuego, plegadas debajo del tablero
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** En la pantalla de juego de cada minijuego (el día, la sesión de prueba y la práctica)
hay un panel **"📖 Reglas de {juego}"** plegado por defecto, **debajo del tablero y de sus
botones**: no se ve mientras se juega salvo que se baje, y está a un toque ante la duda. Trae
"Cómo se juega", el puntaje y, en la Gran Final, las cinco rondas. Las reglas se reescribieron con
**las mismas palabras de los botones** de cada pantalla (Probar, Colocar aquí, Confirmar, Barajar,
Limpiar, OK; "Errores disponibles") (U-5).
**Por qué:** pedido del dueño: ayudar ante la duda sin distraer.

## D-134 · Reinas: el dibujo de las reglas y sin bordes gruesos entre zonas
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** Las reglas de Reinas traen un dibujo antes del texto: un tablero de 5 × 5 resuelto
("Así: una reina por fila, por columna y por color.") y dos reinas que se tocan en diagonal ("Así
no: se tocan."), con los colores del tablero de verdad. Y **el tablero pierde los bordes gruesos
entre zonas**: todas las casillas llevan la misma línea fina y las zonas se distinguen solo por el
color, como en el juego original. **Lo decidió el dueño sabiendo que los bordes estaban por
accesibilidad** (C-8, no depender solo del color); el revisor de usabilidad no lo vuelve a marcar.
Riesgo conocido: dos pares de colores se parecían (naranja #f4b183 con durazno #f8cbad,
celeste #9dc3e6 con turquesa #b4dfe0). **Actualización 2026-09-28:** molestó y se rehízo la paleta `ZONAS`
de ui-reinas.js: entre los ocho colores que usa un tablero de 8 × 8, el par más parecido quedó
a 17 de ΔE2000 (antes, 7,8), sin rojos que se confundan con el choque.
**Por qué:** pedido del dueño (trabajado en otra sesión y publicado junto con D-133).

## D-135 · Varias sesiones de Claude a la vez: cada una en su copia del repo
**Fecha:** 2026-09-25 · **Estado:** corregida por D-213, D-300, D-301, D-303
**Decisión:** Cada sesión trabaja en su propio `git worktree`, con ramas de nombre de tema; la
versión se asigna al fusionar y los números D-n miran también los PR abiertos. Las pruebas usan
un puerto propio para el sitio y para Chrome (`SITIO`, `PUERTO_CDP`) y matan solo su Chrome.
Quedó en CLAUDE.md.
**Actualización (D-213):** los puertos de Chrome ya no se reparten a mano: `cdp.mjs` deja que el
sistema elija uno libre y cierra cada Chrome con su guion, también ante Ctrl-C o un `kill`.
`SITIO` sigue; `PUERTO_CDP` queda opcional, para quien quiera un puerto fijo.
**Por qué:** tres sesiones compartían la carpeta principal: un commit arrastró trabajo sin
terminar de otra, una rama se reescribió con el trabajo de otra sesión, y dos decisiones
distintas quedaron con el número D-129. Se reordenó la cadena de PRs y se renumeró. Además, el
`pkill -f remote-debugging-port` de una sesión mataba las pruebas de las demás.

## D-136 · Batalla Naval: girar un barco casi siempre gira
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** El botón ↻ de un barco puesto primero lo gira sobre su proa, como antes. Si ahí no
cabe (se sale del tablero o choca con otro), **gira igual** y se acomoda en el lugar válido más
cercano, medido desde el centro del barco, sin alejarse más de una casilla de lo que cubría
(`rotateNear` en `engine.js`). Solo si cerca no hay espacio no gira y parpadea, como antes.
**Por qué:** pedido del dueño con una captura: un acorazado vertical en H6–H9 no giraba porque
sobre H6 se salía por la derecha. Para el jugador importa que el barco gire cerca de donde está,
no que gire exactamente sobre la proa. Llevarlo lejos no tendría sentido.

## D-137 · El panel separa La Copa de los demás juegos, y mide sus minijuegos
**Fecha:** 2026-09-25 · **Estado:** corregida por D-207 · **Relación:** D-207 reemplaza sus tres vistas; medir La Copa desde `torneos/` sigue
**Decisión:** El panel del dueño tiene tres vistas: Resumen, La Copa y Juegos (`/panel/#torneo`).
La Copa se mide con sus propios datos de `torneos/` y no con la señal de uso que manda cada día
jugado: el calendario de cada copa dice qué minijuego fue, y cada resultado trae puntaje, tiempo
y hora. De ahí salen las copas en curso con quién está jugando ahora, y por minijuego las jugadas,
los que quedaron sin terminar, el puntaje promedio y el tiempo típico. Los juegos de una partida
se cuentan sin La Copa. Qué es torneo lo dice el registro (`torneo: true` en `games.js`).
**Por qué:** el dueño quiere ver en cualquier momento si hay copas o minijuegos en juego, y
comparar La Copa, el juego central, con los demás. La señal de uso solo decía "un día de La
Copa", sin minijuego, y sumaba esos días como si fueran partidas de un juego más.
**Alternativas descartadas:** mandar una señal nueva por minijuego (obligaba a tocar las reglas
de la base y solo servía desde hoy; `torneos/` ya tiene todo, también hacia atrás). Separar
las copas por entorno: `torneos/` no lo está y no hay de dónde sacarlo; las del laboratorio
llevan su etiqueta.

## D-138 · Chat en Batalla Naval y un panel que cuenta lo que dice
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** Batalla Naval, el único juego con sala que no tenía chat, lo estrena con el módulo
compartido (C-15). Y el panel deja de mezclar cosas distintas bajo una misma cifra:
- Las salas vivas muestran **jugadas** y **mensajes de chat** por separado, más la hora de la
  última jugada. Qué es una jugada lo declara cada juego en `jugadas` de `games.js`.
- "En juego" pide un rival; las salas donde nunca entró un segundo jugador no cuentan como
  partida en ninguna cifra (ya no contaban en la bitácora) y se muestran aparte.
- Los rótulos dicen lo que se cuenta: partidas *empezadas*, *entradas de un celular a una
  partida* (no celulares distintos), *día UTC*.
- La red de la casa y Tailscale caen en el entorno de pruebas, no en producción.
- La hora de una partida se toma al empezarla, no al abrir la página.
**Por qué:** una sala de Batalla Naval decía "176 msjs" y los jugadores no habían escrito nada. No
había chat: eran 86 disparos, sus 86 respuestas automáticas y los compromisos del anti-trampa. Al
revisar el resto del panel aparecieron otras cifras que se leían como algo que no eran: salas
abiertas sin nadie más contadas como partidas de dos celulares (y la bitácora, que sí las sacaba,
no cuadraba con el total), "celulares que jugaron" que sumaba una vez por cada revancha, días que
en Chile cambian a las 21:00, y las pruebas en un celular de verdad por Tailscale (D-67) contadas
como gente jugando.
**Por qué la lista en `games.js`:** es el registro que el panel ya lee (C-16). Qué mensaje es de una
persona y cuál lo manda el juego solo es algo que solo sabe cada juego: una regla genérica
("todo menos `hello`") es justo la que contaba respuestas como jugadas. Un juego que no declara
nada se cuenta con esa regla genérica: inflado, pero nunca en cero.
**Por qué el chat se guarda al colocar la flota:** la pantalla de colocación llena un celular de
812 px exacto; la burbuja tapaba Limpiar y la etiqueta del mensaje nuevo tapaba Al azar. Mientras
uno arma su flota no está conversando; apenas la deja lista y espera al rival, que es el rato
muerto, el chat vuelve con su globito de no leídos.
**Consecuencias:** un juego nuevo con sala declara sus `jugadas` al registrarse
(docs/AGREGAR-JUEGO.md). Quedan anotados sin arreglar, por ser de otra capa: `online` puede
quedar pegado si la despedida no sale a tiempo (el `onDisconnect` se cancela antes), un jugador
que vuelve desde otro navegador toma un rol nuevo y aparece dos veces en juegos de 3 a 6, y dos
salas con el mismo código el mismo día comparten registro. Que La Copa contara sus días como
partidas sin red lo resolvió el Portal de La Copa (D-137). Las copas de laboratorio suman en
producción a propósito, porque hoy todas las copas reales se crean desde `/labs/`; se revisa
cuando La Copa salga del laboratorio.


## D-139 · Tango y Zip: un dibujo en las reglas, como Reinas
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** Las reglas de Tango y de Zip traen un dibujo antes del texto, igual que Reinas
(D-134), en la pantalla de antes de jugar y en el panel plegado de reglas (D-133). **Tango:** un
tablero de 6 × 6 resuelto con una marca = y una ≠ que se cumplen ("Así: tres soles y tres lunas
en cada fila y en cada columna, y las marcas = y ≠ se cumplen.") y tres soles seguidos en rojo
("Así no: tres iguales seguidos."). **Zip:** el mismo 4 × 4 dos veces: un trazo que pasa por todas
las casillas ("Así: un solo trazo que pasa por todas las casillas y toca los números en orden.") y
uno que toca 1 → 4 en orden pero deja cuatro casillas sin pintar, marcadas en rojo ("Así no: llegó
al 4, pero quedaron casillas sin pintar."). El error de Zip se eligió porque es el que más se
comete: llegar al último número creyendo que basta.
**Por qué:** pedido del dueño; en Zip, que se vea que hay que cubrir toda la grilla.

## D-140 · Las partidas sin red se ven en vivo en el panel
**Fecha:** 2026-09-25 · **Estado:** corregida por D-210
**Decisión:** Al empezar una partida sin red (un celular, contra el celular, solo), `trackStart`
deja un registro en `stats/<env>/days/<día>/live/<id>` con juego, modo, cantidad de jugadores,
versión y país del celular, y le sube `beat` cada minuto mientras la pantalla está a la vista y
alguien la tocó hace menos de cinco minutos. "Otra vez" para el latido de la partida anterior.
El panel muestra en "Ahora" las que latieron hace menos de tres minutos (lista *Partidas sin
red* y cuadro *partidas sin red ahora*, en Resumen y en Juegos). Los días de La Copa quedan
fuera: ya se ven en *Copas en curso*. El registro va en el balde del día en que empezó, que el
panel ya baja, así que no hay lectura nueva. Las reglas solo dejan crear el registro una vez y
subir `beat` con la hora del servidor.
**Por qué:** el dueño miraba el panel mientras Mica jugaba Batalla Naval contra el celular y el
panel mostraba cero: "Ahora" solo veía salas, y una partida sin red no dejaba nada en la base
mientras se jugaba. Sin red es la mayoría de las partidas (100 de 121 en la semana).
**Alternativas descartadas:** latir sin mirar si alguien toca la pantalla (un celular olvidado
en la pantalla final se vería jugando horas); abrir una conexión de Firebase (gasta cuota de
conexiones simultáneas y carga el SDK en modos que no lo cargan, D-41); mandar nombres (de los
modos sin red no sale ninguno, C-7).
**Límite conocido:** una partida retomada después de recargar no vuelve a aparecer, porque los
juegos llaman `trackStart` al empezar y no al retomar.

## D-141 · La imagen de la tabla: gráfico y tabla en el mismo eje
**Fecha:** 2026-09-25 · **Estado:** corregida por D-153
**Decisión:** La imagen que sale de "📤 Compartir" (D-126) deja de apilar el gráfico sobre la
tabla. Ahora van **lado a lado y comparten el eje**: a la izquierda, una columna por cada día que
ya se ve, sin saltarse ninguno (del D1 al último, hasta los 7 de la copa); a la derecha, la tabla
con lugar, flecha, nombre ("(-1J)" incluido) y puntos. La línea de cada jugador termina en su
fila, así cada nombre aparece una sola vez. Queda cuadrada (1080 × 1080) hasta 10 jugadores; con
más, las filas se achican y la imagen se alarga. Los **empatados** en un día comparten lugar:
sus líneas van lado a lado, separadas unos píxeles como en un plano de metro, para que ninguna
tape a otra y se vea que iban juntos. Un nombre que no cabe achica la letra y, si aún no cabe,
se corta con "…". La leyenda de "(-1J)" (en la imagen y en el tablero) pasa a decir
**"(-1J), (-2J)… = uno, dos o más juegos por jugar"**: explica también "(-2J)", y "por jugar"
no le suena a reproche a quien todavía puede jugar el día de hoy (dilema #54). El laboratorio suma la demo **llena** (10 jugadores, 7 días, dos con juegos de
menos) para mirar la máxima densidad.
**Por qué:** pedido del dueño: una imagen más compacta que retrate la tabla y cómo llegó a ella.
Se eligió entre tres propuestas (línea que llega a la fila, tabla con el camino de cada uno,
podio con gráfico); con esta ningún cambio de lugar queda fuera, y el dueño pidió que se vieran
todos.

## D-142 · Los minijuegos de La Copa se juegan sueltos, y la portada se filtra
**Fecha:** 2026-09-25 · **Estado:** corregida por D-149, D-170, D-214, D-255, D-266 · **Relación:** reemplaza el solitario de D-27 y D-129; D-149 quita el filtro de cuántos juegan y saca los sueltos de `/copa/`
**Decisión:** Tres cambios que van juntos:
1. **La portada ofrece los minijuegos de La Copa sueltos**, de un jugador: Conexiones, Toque y
   Fama: Palabra, ¿En qué año?, Reinas, Tango y Zip. Viven en `SUELTOS` de `assets/js/games.js`
   (nombre y bajada en los tres idiomas) y abren la práctica de La Copa (`copa/?practica=<id>`).
   Abierta desde la portada, la práctica es el minijuego suelto: vuelve al menú, no ofrece la
   sesión de prueba ni muestra la semilla, y manda `trackStart({ game: <id>, mode: 'solo' })`.
   Desde el laboratorio llega con `&labs` y queda como estaba. La pantalla sigue en español
   (D-98): en inglés y portugués la tarjeta lo dice con una píldora "🇪🇸 In Spanish".
2. **El modo solo de Toque y Fama y de Línea de Tiempo pasa a ser su minijuego de La Copa**
   (🔢 adivina el número y ⏳ Línea Relámpago): mismas reglas y puntaje de 0 a 100, reloj de
   tiempo activo y récord por mejor puntaje (a igualdad, menor tiempo). Se montan las mismas
   pantallas de La Copa (`ui-numero.js`, `ui-linea.js`), que ahora aceptan `ctx.lang`, con lo
   común en `copa/juegos/solo.js`. Esos dos sí van en los tres idiomas y tienen memoria de
   partida (C-6). Reemplaza el solitario de D-27/D-129 en esos dos juegos.
3. **La portada se filtra** por cuántos juegan (Todos · Solo · Con amigos) y por tipo (Palabras,
   Lógica, Cultura general, Cartas y dados; `TIPOS` y `tipos` en `games.js`). El tipo se prende
   y se apaga con un toque; sin tipo se ven todos. El filtro va en la URL
   (`?jugadores=solo&tipo=logica`), así volver desde un juego lo deja igual y un link filtrado se
   puede compartir. Con filtro se dice cuántos se ven y hay "Quitar filtros"; si no queda ninguno,
   se dice y se ofrece lo mismo. "Próximamente" pasa al lado del nombre del juego y no se apaga
   con el resto de la tarjeta: abajo a la derecha no se veía.

**Por qué:** lo pidió el dueño. Los minijuegos ya estaban probados en el laboratorio y en copas
de verdad, y sueltos son un motivo más para entrar. En Toque y Fama y Línea de Tiempo el
minijuego es mejor solitario que el que había (un reloj, un tope de intentos y un puntaje que se
compara) y así hay una sola versión de cada uno. Con catorce tarjetas la lista ya no se recorre
de un vistazo.
**Alternativas descartadas:** meter los sueltos en `GAMES` (el README, las tarjetas sociales y
las pruebas de idioma suponen una carpeta por juego con su `rules.js`). Mandar el modo solo de
Toque y Fama y Línea de Tiempo a la práctica de La Copa (perdían el inglés, el portugués y la
memoria de partida). La Gran Final suelta: repite los otros y es el cierre de la copa.
**Consecuencias:** El panel ve cada suelto como un juego con modo `solo`, y lo nombra porque
`gameLabel` también busca en `SUELTOS` (C-16). Un minijuego nuevo de La Copa no aparece solo en
la portada: hay que sumarlo a `SUELTOS` con su tipo, y `i18n.test.mjs` exige que exista en La
Copa y que su nombre en español sea el mismo. El récord viejo de esos dos solitarios queda sin
uso, y una partida guardada del solitario viejo no se ofrece para retomar.

## D-143 · Las pruebas sin navegador corren solas en GitHub
**Fecha:** 2026-09-25 · **Estado:** corregida por D-193, D-216
**Decisión:** `.github/workflows/tests.yml` corre en cada PR y en cada fusión a main:
todos los `*.test.mjs` y `*.test.py` del repo (los busca con `git ls-files`, sin lista),
`tools/readme.py revisar` y `tools/og.mjs revisar`. El PR muestra ✅ o ❌ antes de fusionar.
Las pruebas de punta a punta (`tools/e2e/`), las capturas y la revisión de usabilidad siguen a
mano.
**Por qué:** desde D-135 varias sesiones trabajan en paralelo y fusionan seguido. Cada una corre
los tests en su rama, pero nadie los corría sobre main después de juntar dos ramas. Además la
lista de CLAUDE.md se había quedado atrás: `arrastre.test.mjs` y `julepe/engine.test.mjs` no
estaban, así que no los corría nadie. Sin npm ni build, todo tarda unos segundos.
**Alternativas descartadas:** correr también `tools/e2e/` (necesita Chrome y un servidor, tarda
minutos y sus capturas igual hay que mirarlas). Una lista fija de tests en el workflow (se
quedaría atrás igual que la de CLAUDE.md).
**Consecuencias:** un test nuevo entra solo al llamarse `*.test.mjs` o `*.test.py`. Un test que
necesite red o llaves no puede correr ahí: tiene que funcionar sin ellas o quedar fuera del
patrón. Los avisos de capturas viejas de `readme.py revisar` no hacen fallar el workflow.

## D-144 · Los filtros de la portada caben en dos filas
**Fecha:** 2026-09-25 · **Estado:** corregida por D-149 · **Relación:** desde D-149 queda solo la fila de tipos
**Decisión:** los filtros de la portada son siempre dos filas: cuántos juegan arriba y los tipos
abajo, los cuatro en una sola fila. Para que quepan, dos tipos se acortan ("Cultura general" →
"Cultura", "Cartas y dados" → "Cartas/Dados"; en inglés "Cards/Dice", en portugués "Cultura" y
"Cartas/Dados") y, cuando el ancho no alcanza con el emoji al lado (bajo 520 px, o sea en
cualquier celular), el emoji sube arriba del nombre, como en una barra de pestañas. Debajo de
los filtros (y del "Se ven n de m", si está) va una línea tenue que se apaga en las puntas:
ahí terminan los filtros y empiezan los juegos.
**Por qué:** lo propuso el dueño. En un celular de 375 px los tipos se partían en dos filas, y en
portugués o a 320 px los filtros ocupaban cuatro: empujaban los juegos fuera de la primera
pantalla. Sin separación, la última ficha y la primera tarjeta se leían como un solo bloque.
**Alternativas descartadas:** una fila de tipos con scroll horizontal (C-8 lo prohíbe y esconde
opciones); achicar la letra hasta que quepan con el emoji al lado (a 320 px quedaba ilegible).

## D-145 · Con el filtro "Solo", el juego abre directo en su modo solo
**Fecha:** 2026-09-25 · **Estado:** reemplazada por D-149 · **Relación:** ya no hay filtro de cuántos juegan
**Decisión:** si la portada está filtrada en "Solo", las tarjetas de los juegos que tienen más de
un modo llevan `?modo=solo`, y el juego se salta la pantalla de modos: Toque y Fama y Línea de
Tiempo abren su minijuego solo, El Ahorcado su configuración de solo, y Dudo y Batalla Naval la
de contra el celular. Lo hace `llegaSolo(entrar)` de `ui.js`, que cada juego llama al arrancar con
su propia entrada. No salta si se llega a una sala (`?sala=`) ni si hay una partida para
retomar: esa oferta vive en la pantalla de modos (C-6). El parámetro se borra de la URL al
llegar, así recargar deja en la portada del juego.
**Por qué:** lo pidió el dueño. Quien filtró por "Solo" ya contestó la pregunta; hacérsela de
nuevo en cada juego es un paso de más y hace dudar de si el filtro sirvió.
**Consecuencias:** un juego nuevo con modo solo tiene que llamar a `llegaSolo` en su `init`, o
el filtro lo abrirá en la pantalla de modos. "Con amigos" no salta nada: ahí quedan dos modos
(un celular o en sala) y la elección es real.

## D-146 · Tango: casillas de día y de noche, y la luna plateada
**Fecha:** 2026-09-25 · **Estado:** vigente
**Decisión:** en la grilla de Tango y en el dibujo de las reglas, la casilla con sol lleva fondo
ámbar y la casilla con luna fondo azul noche. La luna se pinta plateada con un filtro CSS
(`grayscale(1) brightness(1.5)`) sobre el mismo emoji 🌙. Las casillas dadas llevan el mismo
color, más intenso; la casilla revelada por una pista se marca con un anillo cian, y no con el
fondo cian de antes, para no tapar el día y la noche. Un choque sigue ganándole a todo: fondo y
borde rojos. Además, las casillas deshabilitadas (dadas, reveladas, tablero terminado) ya no
heredan el color gris al 30% que Chrome da a los botones deshabilitados, que apagaba el emoji
justo en las dadas.
**Por qué:** lo pidió el dueño: ☀️ y 🌙 son los dos amarillos y, de un vistazo, el tablero no se
lee. Con dos señales, el fondo y el ícono, se separan aunque uno no distinga bien los colores.
**Alternativas descartadas:** 🌑 (cada teléfono la dibuja distinto, y en algunos es una bola
negra que se pierde sobre el morado); solo el filtro o solo el fondo (una sola señal); dibujar
el sol y la luna sin emoji, como LinkedIn (más nítido, pero rompe con el resto de La Copa).

## D-147 · La tabla dice "(provisoria)" mientras alguien puede cambiarla
**Fecha:** 2026-09-26 · **Estado:** vigente
**Decisión:** El título de la tabla lleva "(provisoria)" cuando el último día que muestra sigue
abierto (incluido su día de gracia) y al menos un jugador no lo ha jugado: "Tabla de posiciones
(provisoria) · día 3 de 7" en la imagen que se comparte (D-141), "Tabla (provisoria)" en el
tablero y "Tabla de posiciones (provisoria) · día 3" en el mensaje. Lo decide `provisoria()` en
`copa/engine.js`, con la tabla tal como la ve quien mira: si no ha jugado el día de hoy, su tabla
llega hasta ayer, y esa solo es provisoria si ayer sigue en su día de gracia con alguien sin jugar.
**Por qué:** lo pidió el dueño, a partir de una imagen de la Copa Pirata con dos jugadores terceros
y uno de ellos con "(-1J)": la tabla parecía definitiva y no lo era. "Provisoria" y no "parcial":
la app ya dice "la posición es provisoria hasta que el día cierre" (U-1), y "Tabla parcial" es el
nombre del mensaje que se manda en cualquier momento de la copa.
**Alternativas descartadas:** una línea aparte que diga cuántos faltan (el dueño prefirió el título).
Calcular si los que faltan pueden de verdad cambiar un lugar: con los puntos por posición, quien
juega mueve también los puntos de los demás, y la regla simple se entiende sin explicarla.
**Consecuencias:** un jugador que se saltó un día que ya cerró sigue con su "(-1J)", pero no vuelve
provisoria la tabla: sus puntos de ese día ya no cambian. El número de día del título (imagen y
mensaje) pasa a ser el último día que muestra la tabla (`ultimoDiaVisto`), no el de hoy
(dilema #67, decisión del dueño): la marca y el número hablan del mismo día. La línea "⏳ ¡Día N en
curso!" del mensaje sigue diciendo el día que corre.

## D-148 · El admin puede cambiar el nombre de la copa
**Fecha:** 2026-09-26 · **Estado:** vigente
**Decisión:** En Administrar, un panel "Nombre de la copa" muestra cómo se llama y ofrece
"✏️ Cambiar nombre": el mismo campo de 1 a 40 caracteres con contador de cuando se crea (D-119),
con Guardar y Cancelar. Se puede mientras la copa no termine. Las reglas de Firebase suman un
`.write` propio en `meta/name` para el admin, con `now < meta/end`; la regla de `meta` entero sigue
exigiendo el mismo nombre, así mover el inicio no lo cambia de paso.
**Por qué:** lo pidió el dueño. El link no depende del nombre (código o alias, D-121), así que
cambiarlo no rompe nada de lo que ya se compartió.
**Alternativas descartadas:** permitirlo también con la copa terminada: el resumen final ya se
compartió con ese nombre y el podio quedaría con otro.
**Consecuencias:** los mensajes que ya se mandaron por WhatsApp siguen con el nombre viejo. La
confirmación para eliminar la copa pide escribir el nombre de ese momento. Hay que publicar las
reglas (`node tools/rules.mjs publicar`) para que el botón funcione en las copas de verdad; en las
de prueba (almacén local) funciona sin eso.

## D-149 · La portada se filtra solo por tipo, y los minijuegos sueltos salen de /copa/
**Fecha:** 2026-09-26 · **Estado:** corregida por D-162, D-198, D-214, D-255
**Decisión:** Dos cambios:
1. **Se va el filtro de cuántos juegan** (Todos · Solo · Con amigos, D-142). La portada se filtra
   solo por tipo (Palabras, Lógica, Cultura, Cartas/Dados), igual que antes: se prende y se
   apaga con un toque y va en la URL (`?tipo=logica`). Con él se va D-145: ninguna tarjeta lleva
   `?modo=solo` y `llegaSolo` de `ui.js` desaparece; cada juego pregunta su modo adentro, en su
   pantalla de modos. Un link viejo con `?jugadores=` abre la portada sin ese filtro y lo borra
   de la URL.
2. **Los minijuegos sueltos se abren en `/minijuegos/?<id>`** (`/minijuegos/?reinas`), y no en
   `/copa/?practica=<id>`. Es una página propia, con solo las pantallas de jugar y del
   resultado, que carga el mismo `copa/game.js` (lo reconoce por `<body data-suelto>`). El título
   de la pestaña y la ficha de arriba dicen el minijuego (`👑 Reinas`), no "La Copa", y la
   semilla no va en la URL. Dentro de una copa nada cambia, y la práctica del laboratorio sigue
   en `/copa/?practica=<id>&labs`. Un link viejo a `/copa/?practica=<id>` sin `&labs` se va a
   `/minijuegos/?<id>`.
**Por qué:** lo pidió el dueño. Con "Solo" la pregunta de cuántos juegan se contestaba dos veces
de maneras que no siempre calzaban (un juego de 1 a 6 aparecía en las dos), y el tipo es lo que
de verdad ayuda a elegir. Un minijuego jugado desde el menú no es parte de ninguna copa: un link
que dice "copa" confunde a quien lo recibe.
**Alternativas descartadas:** una carpeta por minijuego (`/reinas/`): seis páginas iguales con su
import map, para un link apenas más corto. Copiar las pantallas de La Copa a la página nueva
(dos versiones del mismo minijuego que se separarían).
**Consecuencias:** la bajada de la antesala sigue diciendo "Minijuego de La Copa": dice de dónde
viene, no dónde se está. Las señales del panel no cambian (`game: <id>, mode: 'solo'`).
`set-version.py` estampa también `minijuegos/index.html`.

## D-150 · El resultado se envía apenas termina el tablero
**Fecha:** 2026-09-26 · **Estado:** vigente
**Decisión:** En un día de La Copa el resultado se escribe en la copa en el momento en que el
tablero termina (resuelto, perdido, rendido o sin tiempo), sin esperar a que se toque "Ver
resultado". Cada minijuego ya llamaba a `ctx.pararReloj()` en ese momento (D-130); ahora le pasa
el mismo estado final que después le pasa a `ctx.terminar()`, y `jugar()` calcula el resultado,
lo guarda en el dispositivo y lo envía por detrás, sin cambiar de pantalla. "Ver resultado" solo
muestra la pantalla de resultado: espera ese envío y, si falló, lo reintenta con el aviso y el
botón "Reintentar" de siempre. En la Gran Final lo manda la última ronda, con las cinco.
**Por qué:** lo pidió el dueño. Antes, quien terminaba el tablero y cerraba la pestaña sin tocar
el botón no tenía resultado en la copa, y si no volvía antes de que cerrara el día, lo perdía
(la escritura tardía la rechaza la ventana del día).
**Consecuencias:** al volver a abrir un día ya terminado se va directo a la pantalla de
resultado, no al tablero con el botón. Una partida que quedó terminada con la versión anterior
se envía sola al abrirla, porque el tablero vuelve a avisar que terminó. La práctica y la sesión
de prueba no cambian: su `pararReloj` ignora el estado.

## D-151 · El ×2 de la final va en cian; el del comodín, en dorado
**Fecha:** 2026-09-26 · **Estado:** vigente
**Decisión:** la píldora "×2" tiene dos colores: dorada cuando es el comodín de un jugador y cian
(`chip--final` en `copa/style.css`) cuando es la final, que vale doble para todos. Vale en la
tarjeta del día, en el calendario y en los resultados del día, donde en la final todos llevan la
píldora cian junto al nombre. El texto sigue siendo "×2".
**Por qué:** lo pidió el dueño. Tiene que quedar claro que la final vale doble, pero con el mismo
dorado parecía que todos habían usado el comodín ese día, y se podía pensar que un comodín en la
final daba ×4. No puede: el comodín no se usa en la final (motor, pantalla y reglas de Firebase) y
`multiplicador` nunca pasa de 2.
**Alternativas descartadas:** sacar la píldora de los resultados de la final (0.66.3): dejaba de
decir que ese día vale doble.

## D-152 · La leyenda de la tabla explica el dorado y el borde naranjo
**Fecha:** 2026-09-26 · **Estado:** vigente
**Decisión:** La leyenda de los bloques (D-131) separa "puntos" (bloque gris) de "ganó el día"
(bloque dorado) y suma "vale doble" (borde naranjo: el comodín, o la final para todos). Los dos
nuevos aparecen solo cuando ya hay alguno en la tabla, igual que "jugado".
**Por qué:** lo pidió el dueño: el borde naranjo no se explicaba en ninguna parte, y la muestra de
"puntos" era dorada, así que tampoco se entendía que el dorado es el 1º del día.
**Alternativas descartadas:** mostrar "vale doble" desde el primer día, para que se sepa que
existe: alarga la leyenda con algo que todavía no aparece; el comodín ya se explica en las reglas
y en su propio panel.
**Consecuencias:** la final nunca vale ×4: el comodín no se puede usar ese día (`puedeComodin`) y
`multiplicador` elige entre ×2 y ×1, no multiplica.

## D-153 · La imagen de la tabla dice qué pasó cada día, y el podio va en galvanos
**Fecha:** 2026-09-28 · **Estado:** corregida por D-154
**Decisión:** En la imagen que sale de "📤 Compartir" (D-141), cada punto del gráfico dice qué
pasó ese día, además del lugar: un círculo lleno con **los puntos del día** (ya multiplicados);
con **anillo dorado y píldora "×2"** si usó el comodín; con anillo cian en la final, cuya columna
dice **"Final ×2"**; un círculo chico y hueco con **"–"** si **no jugó** un día que ya cerró, y
uno punteado con **"?"** si **falta jugar** (el día sigue abierto), con el tramo de línea que
llega a él también punteado. `marcaDelDia` (motor) decide cuál. Una **leyenda** dibuja los mismos
puntos, solo los que aparecen en el gráfico. "(-1J)" deja de ser texto pegado al nombre: es una
**pill** con borde punteado, como el punto "?", y su nota dice "juegos que le faltan por jugar".
Con la copa **terminada**: el campeón lleva 🏆 junto al nombre, el podio va en **galvanos** de oro,
plata y bronce (degradado, filete y remaches, con la letra grabada) y no hay pills, porque ya
nadie puede jugar. La imagen pasa a **1080 × 1350 (4:5)**; con más de 10 jugadores se alarga. La
tabla se angosta (empieza en x = 550) para darle más ancho al gráfico, y el nombre achica la letra
para que quepan él, su pill o la copa, y los puntos.
**Por qué:** pedido del dueño: en la misma imagen se tenía que ver, día por día, los puntos, el
comodín, quién no sumó por no jugar y quién todavía puede jugar. Las pills y los galvanos también
los pidió él, sobre la maqueta.
**Alternativas descartadas:** subir el tope del alto de las filas para llenar la imagen 4:5 con
pocos jugadores; el dueño prefirió dejar ese aire por ahora.
**Consecuencias:** en los empates de tres o más, los puntos del grupo se achican (hasta 9 px de
radio) para ir juntos sin taparse. El tablero de la app no cambia: sus chips siguen con "(-1J)".

## D-154 · La imagen de la tabla mide lo que necesita, entre cuadrada y 4:5
**Fecha:** 2026-09-28 · **Estado:** vigente
**Decisión:** La imagen de "📤 Compartir" (D-153) deja de medir siempre 1080 × 1350. Se arma de
arriba abajo: títulos, filas, rótulos de los días, leyenda (justo debajo) y link. Las filas crecen
hasta llenar el 4:5, con tope de 128 px; con ese tope, la imagen se acorta a lo que necesita, sin
bajar de cuadrada (1080 × 1080). Con más de 10 jugadores sigue alargándose. Lo que todavía sobra
se reparte arriba y abajo del bloque. Los puntos del gráfico (hasta 22 px de radio), la letra de
la tabla (hasta 42 px) y la separación entre lugar, flecha y nombre crecen con la fila, y la tabla
parte en x = 530 para que quepa el nombre con su pill.
**Por qué:** el dueño vio la Copa Pirata (6 jugadores) y el espaciado quedó raro: con el alto fijo
en 4:5 y las filas topadas en 104 px, sobraban unos 100 px bajo el subtítulo y otros tantos entre
los días y la leyenda.
**Alternativas descartadas:** subir solo el tope de las filas (con 3 jugadores quedaban gigantes);
dejar el 4:5 fijo y centrar el bloque (el aire se movía, no se iba).

## D-155 · ¿Dónde queda?: un minijuego de mapa, primero en el laboratorio
**Fecha:** 2026-09-28 · **Estado:** corregida por D-156, D-174
**Decisión:** Un minijuego nuevo de La Copa, **📍 ¿Dónde queda?**: cinco ciudades, una por una,
con su país ("Valparaíso, Chile"), y se toca un mapa del mundo donde se cree que queda cada una.
Cada ciudad vale hasta 100 puntos y se pierden 4 por cada 100 km de error (a 2.500 km, 0); el
puntaje es el promedio de las cinco (D-113). La tarjeta usa las marcas de ¿En qué año?: 🎯 a
25 km o menos, 🟩 hasta 500, 🟨 hasta 1.250, 🟧 hasta 2.000 y ⬛ más lejos.
- **Las ciudades:** la capital de cada uno de los 193 países de la ONU y de sus dos observadores
  (el Vaticano y Palestina), más ciudades famosas (306 en total). Cada partida saca dos fáciles,
  dos medianas y una difícil, en ese orden y de países distintos. Capitales que eligió el dueño: La
  Paz (Bolivia) y Ámsterdam (Países Bajos); en el resto, la sede del gobierno (Jerusalén para
  Israel, Ramala para Palestina, Sri Jayawardenepura Kotte para Sri Lanka).
- **El mapa es propio y sin nombres** (`copa/juegos/mapa.js`, 90 KB): Natural Earth 1:50m, de
  dominio público, en proyección de Miller, generado por `node tools/map.mjs generar`. `revisar`
  comprueba que cada ciudad cae dentro de su país. Tuvalu no trae bordes en esa escala y va como
  un rombo en su capital.
- **Gestos:** arrastrar corre el mapa, pellizcar o tocar dos veces lo acerca (también la rueda y
  los botones + y −), y un toque pone el alfiler; tocar en otro lugar lo mueve. Confirmar es el
  botón (C-8).
- **La vista inicial llena el alto de la caja** (dilema #85, opción B del dueño): en un celular
  vertical, el mundo entero era una franja de 175 px con mar vacío arriba y abajo. Parte centrada
  en 10° O (Sudamérica, Europa y África a la vista) y alejando se ve el mundo entero. Los botones
  + y − van abajo a la derecha, sobre el océano Índico: no tapan Asia ni la Patagonia.
- **Solo en el laboratorio** (`labs: true`, sin calendario ni tarjeta en la portada): se juega en
  `/copa/?practica=donde&labs`. Pasa a una copa sumándolo a `CALENDARIOS` (engine.js).
**Por qué:** lo pidió el dueño, a la manera de los juegos en que se pone un alfiler en el mapa.
Un mapa de internet trae escritos los nombres de las ciudades, así que se dibuja uno propio. Con
el país a la vista, una capital desconocida sigue siendo jugable y el juego pasa a ser de
precisión. Sin los niveles, casi todas las partidas serían de capitales como Funafuti.
**Alternativas descartadas:** arrastrar el alfiler (arrastrar ya corre el mapa, y D-85 reserva el
arrastre para `arrastre.js`); un mapa de teselas (necesita red y trae nombres); sumar Kosovo y
Taiwán (el dueño prefirió la lista de la ONU con sus observadores).
**Consecuencias:** un minijuego más en el paso 1 del laboratorio. El mapa se rehace a mano; solo
cambia si cambian los bordes o la proyección.

## D-156 · ¿Dónde queda? se juega en un globo que gira sin fin, y su portada gira sola
**Fecha:** 2026-09-28 · **Estado:** corregida por D-158, D-159 · **Relación:** reemplaza el mapa plano de D-155 y la vista inicial del dilema #85
**Decisión:** El mapa plano en proyección de Miller se cambia por un **globo**: una proyección
ortográfica dibujada en un canvas (`copa/juegos/globo.js`). Arrastrar lo gira sin tope en
longitud (pasados los 180° sigue); pellizcar, el doble toque, la rueda y + / − lo acercan hasta 40
veces; un toque pone el alfiler. El doble toque solo acerca: el toque espera 320 ms antes de
poner el alfiler, por si llega el segundo (pedido del dueño; antes el primer toque ya lo ponía). La respuesta centra el globo entre el alfiler y la ciudad, los
acerca a los dos y los une con el arco más corto sobre la esfera. Cada ciudad parte con el globo
entero, mirando al Atlántico (10° N, 40° O). Los colores son los del afiche de "Próximamente":
mar azul con brillo, tierra verde clara, meridianos y paralelos cada 30°.
La **portada** del minijuego (la antesala de la práctica y de un día de copa) deja el emoji por el
mismo globo en chico, girando a 8° por segundo con el alfiler en Brasil y la estrella en
Valparaíso, como el afiche; con movimiento reducido queda quieto (C-8). Un minijuego puede tener
portada exportando `portada()` desde su pantalla; los demás siguen con su emoji.
- **El mapa** (`mapa.js`, 81 KB) pasa a décimas de grado sin proyectar, e incluye la Antártica:
  el globo lo gira. Donde un país cruza el borde del globo, el recorte sigue el borde.
- **Las pruebas** tocan cada ciudad girando el globo hasta tenerla de frente (`canvas.globo`
  expone `girarA` y `aPantalla`, que la respuesta también usa).
**Por qué:** lo pidió el dueño: un globo esférico que se pueda recorrer sin fin, y una portada
animada como el afiche. En el mapa plano el Pacífico quedaba cortado en los bordes (Fiyi a un
lado, Samoa al otro) y en un celular vertical sobraba mar (#85); el globo no tiene bordes.
**Alternativas descartadas:** el mapa plano con vuelta infinita (sigue deformando cerca de los
polos y no es lo que se pidió); una librería de mapas (d3-geo) desde un CDN: una dependencia
externa para unas 150 líneas de trigonometría.
**Consecuencias:** en el globo entero solo se ve medio mundo: hay que girarlo para llegar a la
ciudad. La vista inicial del dilema #85 (llenar el alto de la caja) ya no aplica: el globo cabe
entero y se ve como globo. La portada dibuja 30 cuadros por segundo con uno de cada cuatro puntos
del mapa, y se detiene cuando sale de la pantalla.

## D-157 · ¿Dónde queda? suma ciudades de segunda línea
**Fecha:** 2026-09-28 · **Estado:** vigente
**Decisión:** A las 306 ciudades de D-155 se suman 223 de segunda línea (529 en total): ciudades
regionales que no son capitales ni de las más famosas, como Porto Alegre, Salta, Copiapó, Castro,
Trujillo, Bilbao, Gdansk, Chengdú, Luxor, Mombasa o Queenstown. Van casi todas en los niveles 2 y
3; el nivel 1 no cambia. Cada partida sigue siendo dos fáciles, dos medianas y una difícil.
**Por qué:** lo pidió el dueño, para que ubicar el alfiler tenga más incertidumbre. Con solo
capitales y ciudades famosas, la mediana y la difícil eran casi siempre una capital: se aprendían
rápido o eran islas imposibles. Ahora la difícil puede ser Portland o Breslavia, que se saben más
o menos dónde quedan pero no con precisión.
**Consecuencias:** `tools/map.mjs revisar` comprueba que las 529 caen dentro de su país. Chile
suma 13 (Copiapó, Calama, Rancagua, Talca, Chillán, Los Ángeles, Osorno, Castro, Puerto Natales,
Ovalle, Vallenar, Tocopilla y Pucón): de a una por partida, porque cada partida es de países
distintos.

## D-158 · El globo de ¿Dónde queda? va sin fronteras
**Fecha:** 2026-09-29 · **Estado:** vigente
**Decisión:** El globo deja de trazar los bordes de los países: la tierra es un solo relleno
verde sobre el mar, y lo único que la separa del agua es el color. Vale para el juego y para la
portada. El mapa (`mapa.js`) sigue siendo por país, porque `tools/map.mjs revisar` y las pruebas
comprueban cada ciudad contra su país.
**Por qué:** lo pidió el dueño. Sin fronteras, ubicar una ciudad dentro de su país deja de ser
calcar un contorno y pasa a depender de saber dónde queda el país: más incertidumbre, en la línea
de D-157.
**Consecuencias:** los países chicos sin costa (Luxemburgo, Andorra, Eswatini) ya no se distinguen
de sus vecinos.
**Además, la portada gira con perspectiva:** el dueño pidió sacar el alfiler y la estrella del
globo que gira, salvo que se vieran con perspectiva. Se dejan, con perspectiva: el aro de la
ciudad está pintado sobre la esfera, así que se achata en la dirección del radio tanto como el
coseno del ángulo con que se mira; el alfiler se achica (hasta un 35 %) y se desvanece al irse por
detrás. En el juego las marcas siguen planas: ahí se miran de frente y tienen que leerse.

## D-159 · El globo de ¿Dónde queda? es una imagen satelital
**Fecha:** 2026-09-29 · **Estado:** corregida por D-202, D-245
**Decisión:** El globo muestra la Tierra vista desde el satélite: **Blue Marble Next Generation**
de la NASA (dominio público), la de septiembre de 2004, con relieve y fondo marino. Se eligió
septiembre porque es el mes con menos nieve en los dos hemisferios: el Sahara, Arabia, el Atacama
y el interior de Australia se ven como desiertos, el Amazonas y el Congo como selva, Groenlandia y
la Antártica como hielo. Sin nombres ni fronteras (D-158).
- **Cómo se dibuja:** con WebGL, en un canvas debajo del de las marcas: cada píxel del disco se
  invierte a latitud y longitud y se lee de la imagen (`satelite()` en `globo.js`). Encima siguen
  la sombra del borde, el brillo, la retícula (más tenue) y las marcas.
- **Dos imágenes** en `assets/img/`: una de 2048 px de ancho (0,5 MB) que llega rápido y otra de
  4096 px (1,6 MB) que la reemplaza al bajar, si el celular la acepta. El nombre lleva el mes de
  la imagen, porque `set-version.py` no estampa imágenes. Las rehace
  `node tools/map.mjs satelite` (necesita internet y `sips`, de macOS).
- **Sin WebGL, o si ninguna imagen llega,** el globo se dibuja como antes, con el mapa vectorial
  verde. Mientras baja la primera, el globo espera vacío (D-245). El mapa vectorial (`mapa.js`)
  queda también para las pruebas: cada ciudad cae en su país y sobre tierra.
- **El zoom máximo baja de 40 a 16 veces** (unos 2 km por píxel en un celular): más allá la
  imagen de 4096 px ya no tiene detalle. Sigue sobrando precisión para el puntaje (un punto cada
  25 km). La respuesta acerca hasta 12 veces.
**Por qué:** lo pidió el dueño: un mapa físico, con color de las zonas y volumen, para reconocer
por ejemplo los desiertos, y con imagen satelital y no dibujada.
**Alternativas descartadas:** los mapas físicos dibujados de Natural Earth (el dueño pidió
satélite); la imagen de diciembre de la NASA (medio hemisferio norte bajo la nieve); una de 8192 px
(6 MB, mucho para un celular).
**Consecuencias:** la primera vez se bajan unos 2 MB más; el navegador los guarda. En la portada
el globo que gira también es satelital.

## D-160 · El globo satelital se ve nítido al acercarse: teselas
**Fecha:** 2026-09-29 · **Estado:** corregida por D-201
**Decisión:** Además de la imagen entera de 4096 px (D-159), la de la NASA de 21600 × 10800 se
corta en **128 teselas** de 1350 px (16 columnas por 8 filas, 22,5° por lado) en
`assets/img/tierra-2004-09/`. Cuando el globo se acerca más de lo que da la imagen entera, se bajan
y se pintan encima solo las teselas que se ven; zoom afuera queda la imagen entera. El globo
guarda en la tarjeta de video hasta 36 teselas y suelta las que llevan más rato sin verse.
**Por qué:** el dueño vio la imagen estirada al acercar: con 4096 px para toda la Tierra, a 16
veces cada píxel de la imagen ocupa varios de la pantalla. Las teselas dan la resolución completa
de la fuente (más de 5 veces más nítida) sin bajarla entera.
**Alternativas descartadas:** una imagen de 8192 px (6 MB, sigue siendo la mitad de nítida y la
bajaría todo el mundo); la imagen completa como una sola textura (no cabe en la memoria de muchos
celulares).
**Consecuencias:** el repo suma 30 MB de teselas, unos 235 KB cada una; un jugador que acerca en
una ciudad baja entre 1 y 9. Sin mipmap en las teselas (solo se usan acercando, y así no hay
costura en la línea de cambio de fecha). Las rehace `node tools/map.mjs satelite`.

## D-161 · El admin puede terminar la copa antes, y la tabla final se exporta
**Fecha:** 2026-09-29 · **Estado:** vigente
**Decisión:** En Administrar, desde que la copa parte hasta que termina, el panel **Terminar la
copa antes** cierra la copa en ese momento. Se guarda solo la hora del servidor en
`torneos/<código>/fin`, una vez y sin vuelta atrás; la copa que se ve sale de ahí
(`conCierre`/`cerrarEn` en `engine.js`): termina en `fin`, las ventanas abiertas se cortan en `fin` y
los días que todavía no se habían abierto quedan **anulados** (no van en la tabla, en el gráfico ni
en la planilla, y no suman para nadie). El panel nombra a quienes todavía no juegan el día de hoy o
el de gracia, y avisa si quedan días sin jugar. Terminada la copa —sola o por el admin— Administrar
ofrece **Tabla final**: la imagen que ya se compartía (D-153, con el podio en galvanos) y una
**planilla CSV** (`copa/planilla.js`) con la tabla final, el lugar de cada uno después de cada día y
el detalle de cada día (resultado, puntaje, tiempo, posición, puntos y si valía doble).
**Por qué:** el dueño lo pidió para el caso del colista que no va a jugar el último día: sin esto,
todos esperan hasta las 23:59 para ver un podio que ya está decidido. Guardar la hora del cierre en
vez de reescribir `meta` deja las reglas simples (una línea más en `started`, `results`, `wild`,
la inscripción y el nombre) y deja a la vista que la copa se cerró antes y cuándo.
**Alternativas descartadas:** reescribir `meta.end` y las ventanas (las reglas de `meta` solo dejan
moverla sin empezar, y abrirlas para esto abre también mover fechas a media copa); dejar que
terminarla antes vuelva a abrirse (el podio ya se compartió); una planilla por hoja en .xlsx
(necesita una biblioteca; el CSV abre igual en Excel y en Google Sheets).
**Consecuencias:** cambio de reglas: publicar con `node tools/rules.mjs publicar`. Si la final no
alcanzó a abrirse, nadie tiene días ×2 salvo el comodín. Quien está jugando cuando el admin la
termina ve "El tiempo para jugar este día ya se terminó" al enviar. El CSV va separado por punto y
coma y con BOM, para que Excel en español lo abra en columnas y con acentos. Nueva demo del
laboratorio: `final-admin`.

## D-162 · Cada minijuego suelto tiene su página y su tarjeta social
**Fecha:** 2026-09-29 · **Estado:** corregida por D-198 · **Relación:** cambia la alternativa que D-149 había descartado
**Decisión:** Los minijuegos sueltos se abren en `/minijuegos/<id>/` (`/minijuegos/reinas/`), una
página por minijuego con su propia tarjeta social (título, bajada e imagen de 1200×630 en
`assets/og/<id>.jpg`). Las páginas no se escriben a mano: `node tools/og.mjs tarjetas` las genera
copiando `minijuegos/index.html` un nivel más abajo, con su título, su tarjeta y
`<body data-suelto="<id>">`, y `revisar` avisa si una quedó atrás. Como `set-version.py` corre
`tarjetas` después de estampar, salen con el import map de la versión nueva. Los textos salen de
`SUELTOS` en `games.js`, que suma ¿Dónde queda? con `labs: true`: tiene página y tarjeta, pero
todavía no va en la portada. Los links de antes (`/minijuegos/?reinas` y `/copa/?practica=reinas`
sin `&labs`) se van a la página nueva.
**Por qué:** lo pidió el dueño: un link a un minijuego pegado en WhatsApp mostraba la tarjeta de
La Copa o la del menú. Los robots que arman la tarjeta no corren JavaScript: leen el HTML tal como
llega, y con una sola página para todos (`?reinas`) todos los links traían la misma.
**Alternativas descartadas:** escribir las páginas a mano (lo que D-149 quería evitar: siete
copias del import map que se separarían); una página que redirige (el robot se queda con la
tarjeta de la primera, o sigue la redirección y llega a la genérica).
**Consecuencias:** la práctica del laboratorio sigue en `/copa/?practica=<id>&labs` y su link
trae la tarjeta de La Copa: para compartir un minijuego se comparte `/minijuegos/<id>/`.
`tools/og.mjs imagenes` acepta `PUERTO` y `PUERTO_CDP`, y se detiene si su puerto está ocupado
(antes fotografiaba la copia de otra sesión sin avisar).

## D-163 · El admin elige los juegos de la copa y su orden
**Fecha:** 2026-09-29 · **Estado:** vigente
**Decisión:** Al crear una copa, después de elegir la duración aparece **¿Qué se juega cada día?**
con la mano y la línea de Línea de Tiempo (`linea.css`, `arrastre.js`): arriba, en la mano, los
juegos que **quedan fuera**; abajo, la semana, un día por fila y la final fija al último. Un día se
arrastra a otro lugar de la semana (por su agarre ⠿ en un celular, para que el resto de la fila
deje desplazar la página) y los demás se corren para hacerle lugar; un juego de la mano se arrastra
hasta el día que reemplaza, y el reemplazado vuelve a la mano. Tocando se llega a lo mismo: el
juego y después dónde va (una ranura "Mover aquí" o el día que se reemplaza). El pozo son los nueve minijuegos (`POZO`): los seis del calendario de
siempre más Zip, Tango y ¿Dónde queda?. La copa de 7 días lleva seis de los nueve y la de 3, dos.
La lista parte con **una propuesta al azar** que evita dos días seguidos de la misma habilidad
(las dos de Toque y Fama, o Reinas, Zip y Tango), y 🎲 propone otra. La final no cambia: sus cinco
rondas son las de siempre, aunque la copa no tenga alguno de esos juegos.
**Por qué:** lo pidió el dueño, para que cada grupo arme la semana a su gusto; la propuesta al azar
es para quien no quiere pensarlo, que así crea la copa sin un paso más. Con los seis de siempre en
siete días no había nada que elegir, solo el orden: por eso entran Zip, Tango y ¿Dónde queda?,
que ya estaban listos para la copa. No se inventa UX (D-102): es la mano, la línea y el arrastre
de Línea de Tiempo, que el dueño pidió reusar. Arrastrando un día no se abren ranuras, como al
tocar: la lista crecería bajo el dedo y el destino se correría; los demás días se corren en su
lugar. Por lo mismo, la ayuda que cambia con lo elegido va en una línea de alto fijo.
**Consecuencias:** es una excepción a "nada se preselecciona" (C-8, D-38), pedida por el dueño:
la propuesta viene armada, pero nada se confirma sin tocar **Crear la copa**, y cambiarla no
cuesta nada. Por eso soltar sí cambia la semana, sin botón de confirmar: arrastrar sigue siendo
elegir (D-85), y lo irreversible es crear la copa. Mientras el juego va en el aire, la ayuda
dice "Suéltalo…" y no "Toca…" (pedido del dueño), en la misma celda de alto fijo que las otras. El calendario ya se guardaba en `meta.cal` y todas las pantallas lo leen de ahí
(la invitación lo leía de `CALENDARIOS` y se corrigió), así que las copas ya creadas no cambian y
las reglas de Firebase tampoco (aceptan cualquier texto de hasta 100 caracteres). La regla de la
final dejó de decir "una de cada minijuego de la copa". `CALENDARIOS` queda para las demos.

## D-164 · El 〰️ de Zip lleva contorno claro, y el laboratorio juega en las páginas de cada minijuego
**Fecha:** 2026-09-30 · **Estado:** corregida por D-266
**Decisión:** Dos cambios:
1. **Emojis oscuros con contorno claro.** El 〰️ de Zip se dibuja casi negro y sobre el fondo
   morado no se veía. Sigue siendo el mismo emoji, con un contorno blanco (`.emoji-claro` en
   `base.css`) donde va solo sobre fondo oscuro: la tarjeta de la portada, la imagen para compartir,
   la lista del laboratorio, la ficha de arriba y las pantallas de La Copa. La lista de emojis que lo
   llevan es `EMOJI_OSCUROS` en `assets/js/ui.js`; `con(clase, emoji)` y `conEmoji(emoji, texto)`
   ponen la clase. En los botones amarillos y en los textos que se comparten queda tal cual.
2. **La práctica del laboratorio se juega en `/minijuegos/<id>/?labs`** para los minijuegos que
   tienen página (D-162), con todo lo del laboratorio: sesión de prueba, semilla en la URL, repetir
   la misma partida y volver al laboratorio. Los que no tienen página (Línea Relámpago, el número,
   la final) siguen en `/copa/?practica=<id>&labs`. Un link viejo del laboratorio se va a la página
   nueva con su semilla.
**Por qué:** lo pidió el dueño. Un link copiado desde el laboratorio traía la tarjeta de La Copa y
no la del minijuego; y el 〰️ casi no se veía en la miniatura de WhatsApp ni en la portada.
**Alternativas descartadas:** cambiar el emoji de Zip (el dueño quiso el mismo); pintarlo blanco
con un filtro (deja de ser el emoji); poner el contorno en la caja del emoji (blanquea el fondo).

## D-165 · Todo lo que se comparte sigue un mismo estándar, con WhatsApp en mente
**Fecha:** 2026-10-01 · **Estado:** corregida por D-171, D-226 · **Relación:** ordena D-173, D-124, D-126 y D-141
**Decisión:** Lo que la app comparte sale de un solo módulo, `assets/js/compartir.js`, con tres
reglas:
1. **El texto** abre con una cabecera — `{emoji} *{título}* · {contexto}` —, sigue con una idea
   por línea, cada una con su emoji, y cierra con el link solo en su línea ("🔗 …"). El link va
   siempre **dentro** del texto, también en las salas y en la portada (antes iba aparte, y Android
   lo pegaba a la última frase, D-124).
2. **La imagen**, cuando hay, lleva arriba **la misma cabecera** —el título en amarillo y el
   contexto debajo— y abajo **el mismo link**. Quien la ve suelta en el grupo sabe de qué copa, de
   qué día o de qué juego es, y adónde ir. Se manda **junto con** su texto, que repite lo que dice.
3. **Las invitaciones** (a una sala, a una copa, a la app) van sin imagen dibujada: el link ya trae
   su tarjeta social (D-72, D-162), que es la imagen que muestra WhatsApp.

Cada cosa que se comparte, y con qué cabecera:

| Qué | Dónde | Cabecera | Imagen |
|---|---|---|---|
| Invitación a una sala | los 6 juegos con sala | `🃏 *Julepe* · Sala WFBN` | la tarjeta del link |
| Invitación a la copa | Administrar, tablero | `🏆 *La Copa: X* · ¡Estás invitado!` | la tarjeta del link |
| Recordatorio | Administrar | `🏆 *La Copa: X* · Parte el …` / `· Día 3 de 7` | la tarjeta del link |
| Resultado del día | resultado de la copa | `🏆 *La Copa: X* · Día 3 de 7` | **nueva**: el resultado |
| Tabla parcial | tablero **y** Administrar | `📊 *La Copa: X* · Tabla de posiciones · día 3 de 7` | la tabla (D-141) |
| Tabla final | podio, Administrar, exportar | `🏁 *La Copa: X* · Tabla final` | la tabla final con galvanos |
| Minijuego jugado solo | minijuego suelto, Toque y Fama y Línea de Tiempo solos | `🔢 *Toque y Fama* · Jugando solo` | **nueva**: el resultado |
| La app | portada | `🎲 *Juegos de Salón* · 15 juegos para el celular` (desde D-226) | la tarjeta de la portada, como imagen (D-226) |

- **La tabla es una sola**, se comparta desde donde se comparta: el botón del gráfico, "Tabla
  parcial" y "Resumen final" de Administrar, el podio y exportar mandan la misma imagen con el
  texto completo (la lista con "(-1J)" y quién falta, o el campeón, el podio y las medallas). Antes
  el admin mandaba solo texto, el gráfico mandaba la imagen con un título pelado y, terminada la
  copa, la imagen seguía diciendo "Tabla de posiciones · día 7 de 7".
- **El resultado de un minijuego de La Copa lleva imagen** (`laminaResultado`): la copa y el día en
  la cabecera, y adentro el juego, quién lo jugó, el puntaje en grande, el tiempo y la tarjeta de
  colores, que no revela la respuesta (U-32). El texto dice lo mismo en el mismo orden, y ahora
  también el día "de cuántos" y el tiempo (si la tarjeta no lo trae ya, D-114).
- **Jugar solo un minijuego también se comparte** —suelto en `/minijuegos/<id>/`, o dentro de Toque
  y Fama y Línea de Tiempo—, con la misma imagen de resultado y un reto ("🤔 ¿Me ganas?") hacia la
  página del juego. En los tres idiomas (`COMMON`). En el laboratorio no se ofrece.
- **La invitación a una sala** pasa a `🃏 *Julepe* · Sala WFBN` + `👋 Javi te invita a jugar en
  juegosdesalon.cl.`: dice lo mismo que D-173 (quién, a qué, dónde y el código) con la forma de los
  demás. El botón, que estaba copiado igual en seis juegos, es `botonInvitar`.
- **Sin menú del sistema** (un computador): la imagen se descarga y el texto queda copiado, para
  pegarlo junto a ella; antes se perdía el texto.
- Los emojis oscuros (〰️, D-164) llevan en la imagen un halo claro; `EMOJI_OSCUROS` vive ahora en
  `compartir.js` (`ui.js` lo reexporta).

**Por qué:** lo pidió el dueño: que una tabla de posiciones se vea igual se comparta desde donde se
comparta, y que el resultado de un minijuego de copa diga de qué copa es, en la imagen y en el
texto. WhatsApp es por donde se difunde la app: una imagen sin contexto, reenviada a otro grupo,
no lleva a nadie a ninguna parte.
**Alternativas descartadas:** un emoji fijo (🏆) para todo lo de la copa, con el tipo en el
contexto ("🏆 … · 📊 Tabla"): dos emojis seguidos en la primera línea se leen peor, y el 📊 y el 🏁
de D-124 ya distinguen a simple vista qué es cada mensaje. Dibujar imagen también para las
invitaciones: la tarjeta social del link ya es esa imagen, y dos imágenes por mensaje confunden.
**Consecuencias:** el título de la imagen de la tabla dice ahora "📊 La Copa: X" (antes "🏆 X"), y
el archivo de la tabla terminada se llama `copa-<x>-tabla-final.png`. Los resultados de las
partidas de los seis juegos con sala (quién ganó un Dudo) todavía no se comparten; si se agregan,
usan `laminaResultado` y una cabecera con el juego. `tools/e2e/cdp.mjs` acepta `CHROME` para
correr las pruebas fuera de un Mac.

## D-166 · Reinas: arrastrar desde una casilla vacía pinta X
**Fecha:** 2026-10-01 · **Estado:** corregida por D-168 · **Relación:** amplía D-103
**Decisión:** En Reinas, apoyar el dedo en una casilla **vacía** y llevarlo a otra pinta una X en
cada casilla vacía por donde pasa, como en el Queens de LinkedIn: descartar una fila o una columna
deja de ser ocho toques largos. Las reglas del gesto:
- **Es arrastre solo al entrar en otra casilla.** Un toque que tiembla dentro de la misma casilla
  sigue siendo toque (reina) o, a los 450 ms, toque largo (X). Si el toque largo ya puso la X y el
  dedo sigue, pinta las siguientes.
- **Pinta solo casillas vacías**: las reinas y las X que ya estaban quedan igual. Empezar sobre una
  reina o una X no pinta nada (y ya no es toque largo al salir de la casilla).
- **No salta casillas**: si el dedo va rápido, se rellenan las del medio (`camino` de `ui-reinas.js`).
- **Cada X pintada es una jugada de toque largo** (`-(i + 1)`): el motor, la memoria de partida y
  el desglose no cambian. El click que llega al soltar se traga, como después del toque largo;
  el del teclado (sin puntero) nunca.
- **El tablero ya no desplaza la página**: `touch-action: none` en la grilla, como en Zip. Sin eso,
  el celular toma el arrastre como scroll y lo corta.

**Por qué:** El dueño lo pidió: en el Queens original es la forma natural de descartar filas
enteras, y con el toque largo cada X costaba medio segundo.

**Alternativas descartadas:** que arrastrar desde una X borre X (como algunos clones): no se pidió
y un arrastre accidental borraría deducciones; un modo "lápiz X" con botón: un paso más y otro
estado que recordar.

## D-167 · Reinas: el toque cicla reina → X → vacía
**Fecha:** 2026-10-01 · **Estado:** vigente · **Relación:** cambia el toque de D-103
**Decisión:** Un toque pasa la casilla por un ciclo: **vacía → reina → X → vacía**. El primer
toque sigue poniendo la reina, como desde D-103; tocarla otra vez la cambia por una X, y una
tercera vez la deja vacía. El **toque largo** sigue poniendo o sacando la X, como atajo, pero la
ayuda ya no lo menciona: lo que explica es el ciclo y el arrastre (D-166).
- **Las jugadas guardan el toque nuevo como `'c' + índice`.** Las de antes de D-167 guardaban el
  índice, que pone o saca la reina, y se siguen leyendo así: una partida a medio jugar al publicar
  no cambia al recargarla.
- **Error es poner una reina que choca**, venga del toque o del ciclo; cambiar una reina por X no.
- Sacar una reina pasa de un toque a dos (reina → X → vacía). Casi siempre esa X sirve: si la reina
  no iba ahí, la casilla queda descartada.

**Por qué:** El dueño lo pidió: el toque largo pide intuición y memoria, nada en la pantalla lo
sugiere. El ciclo se descubre solo, tocando de nuevo lo que se acaba de poner.

**Alternativas descartadas:** el orden del Queens de LinkedIn (vacía → X → reina): allá la X va
primero porque se usa más, pero aquí cambiaría lo que el primer toque hace hoy, y las X en
cantidad ya las pinta el arrastre. Quitar el toque largo: a quien ya lo aprendió no le estorba.

## D-168 · Reinas: arrastrar desde una X las borra
**Fecha:** 2026-10-01 · **Estado:** vigente · **Relación:** amplía D-166
**Decisión:** El arrastre hace lo que diga la casilla donde empieza: desde una **vacía** pinta X
en las vacías por donde pasa (D-166), desde una **X** borra las X por donde pasa, y desde una
**reina** no hace nada. Las reinas nunca se tocan al arrastrar. Cada X borrada es una jugada de
toque largo (que pone o saca la X), así que el motor no cambia. Si el toque largo ya sacó la X
de la primera casilla y el dedo sigue, el arrastre sigue borrando.

**Por qué:** El dueño lo pidió: deshacer una fila de X tenía que ser casilla por casilla. Con
borrar como espejo de pintar, el gesto se entiende solo: el arrastre repite lo que hay donde empieza.

**Alternativas descartadas:** D-166 había descartado borrar por miedo a un arrastre accidental que
borre deducciones. Para empezar a borrar hay que apoyar el dedo justo en una X y llevarlo a otra
casilla, y una X borrada de más se vuelve a pintar con el mismo gesto.

## D-169 · Reinas: 🧹 Borrar todo
**Fecha:** 2026-10-01 · **Estado:** vigente
**Decisión:** Reinas trae el botón **🧹 Borrar todo**, al lado de Rendirse: deja el tablero en
blanco (sin reinas ni X) para empezar de nuevo. Como en Tango, el primer toque solo lo arma
("¿Seguro? Toca de nuevo para borrar") y el segundo, dentro de 3 segundos, borra. Con el tablero
ya en blanco el botón queda apagado.
- **Es una jugada más (`'B'`)**: la memoria de partida la recupera al volver.
- **El reloj sigue corriendo** y los errores ya hechos se mantienen: puntúa el tiempo (D-107), y
  empezar de nuevo no es empezar otro tablero.

**Por qué:** El dueño lo pidió: cuando las X y las reinas de un intento enredan más de lo que
ayudan, deshacerlas casilla por casilla cuesta más que empezar en limpio.

**Alternativas descartadas:** reiniciar también el reloj: sería un tablero gratis después de
haberlo mirado entero.

## D-170 · La Copa y sus minijuegos en inglés y portugués: lo personal en tu idioma, lo del grupo en el de la copa
**Fecha:** 2026-10-01 · **Estado:** vigente · **Relación:** reemplaza D-98 y cierra LIG-32
**Decisión:** La Copa y los minijuegos sueltos pasan a los tres idiomas (C-3). Una regla para
saber qué idioma manda: **lo personal va en el idioma de quien mira; lo del grupo, en el de la
copa.**
1. **Juegos y minijuegos sueltos** (sin copa): todo en el idioma de quien juega, que se cambia con
   el toggle de la intro. Lo que se comparte sale en ese idioma y el link lleva `?lang=` (D-74).
   Es C-3 tal como estaba.
2. **Cada copa tiene un idioma**, que se elige al crearla ("¿En qué idioma van las palabras?") y
   parte en el de quien la crea. Se guarda en `meta.lang` (`en` o `pt`; el español no se escribe,
   así las copas de antes siguen iguales) y no cambia. Manda en lo que el grupo tiene en común:
   - **Las palabras** de 🔗 Conexiones y 🔤 Toque y Fama: Palabra (también la ronda de la final):
     tienen que ser las mismas para todos o la copa deja de ser pareja.
   - **Lo que va al grupo:** invitación, recordatorio, tabla, resumen final, "Compartir mi
     resultado", la imagen y la planilla. El chat del grupo es uno solo.
   - **El link que se comparte** lleva `?lang=` de la copa, así quien entra por primera vez llega
     en ese idioma.
3. **La pantalla de la copa** (reglas, botones, tablero, desglose) va en el idioma de quien mira:
   el toggle está en la portada, en la invitación y en la antesala del minijuego suelto, nunca a
   mitad de un juego. Si las palabras de la copa van en otro idioma, la invitación y la antesala de
   Conexiones, Palabra y la final lo dicen ("🌐 Las palabras de esta copa van en inglés").
   Los hitos de Línea Relámpago y ¿En qué año? y las ciudades de ¿Dónde queda? son las mismas
   cartas en todos los idiomas: se muestran en el de quien mira sin cambiar lo que se juega.

El contenido con palabras **es propio de cada idioma, no una traducción**: 13 grillas de
Conexiones en inglés y 13 en portugués (`grillas-en.js`, `grillas-pt.js`, por significado y con
distractores que funcionan en ese idioma, D-102 y D-128), más de 100 palabras secretas por idioma
(`palabras.js`, sin Ñ ni tildes, con su teclado sin Ñ) y los nombres de los 195 países y de las
ciudades que cambian de nombre (`nombres.js`).

**Por qué:** lo pidió el dueño, que eligió esta modalidad entre tres: todo por persona, todo por
copa, o mixta. D-98 había dejado la copa en español porque una copa mixta español/portugués "no
sería pareja"; lo que no es parejo son las palabras, no las reglas. Fijar las palabras y los
mensajes por copa y dejar libre la pantalla mantiene la copa pareja sin dejar afuera a quien no
habla el idioma del grupo.

**Alternativas descartadas:** todo por copa, sin toggle adentro (lo más simple, pero quien no lee
el idioma de la copa no entiende ni las reglas). Todo por persona, también lo compartido (el
chat del grupo recibiría mensajes en tres idiomas). Traducir las grillas y las palabras de
español (los distractores y los chilenismos no sobreviven a la traducción). Un toggle a mitad de
juego (recarga la página y no hace falta).

**Consecuencias:** `games.js` ya no declara `idiomas: ['es']` en La Copa ni en los sueltos, y
`i18n.test.mjs` compara los `LOCALES` de la copa como los de cualquier juego, con el nombre de
cada suelto igual al de su minijuego en los tres idiomas. Los textos de cada minijuego (nombre,
cómo se juega, puntaje) viven en `LOCALES[lang].juegos` y las rondas de la final en
`LOCALES[lang].rondas`; `MINIJUEGOS` sigue exportado en español para el panel y las herramientas.
Los motores reciben `lang` (textos) y `palabras` (idioma de la copa) en `generar` y `ensayo`.
Las reglas de Firebase aceptan `meta.lang` y no dejan cambiarlo. Una copa nueva en inglés o
portugués necesita las reglas publicadas (`node tools/rules.mjs publicar`, D-122).

## D-171 · Con imagen, el texto no repite lo que la imagen dice
**Fecha:** 2026-10-01 · **Estado:** vigente · **Relación:** cambia la regla 2 de D-165
**Decisión:** Cuando lo que se comparte lleva imagen, el texto ya no la repite. Lleva la
cabecera (D-165), solo lo que la imagen **no** trae y el link al final:

| Qué | Antes (D-165) | Ahora |
|---|---|---|
| Tabla parcial | cabecera, la tabla escrita y quién falta | cabecera y "⏳ ¡Día 2 en curso! Falta que jueguen: …" |
| Tabla final | cabecera, campeón, podio y medallas | cabecera y las medallas (más días ganados, la remontada, al descenso) |
| Resultado del día | cabecera, juego, quién, puntaje, tiempo y tarjeta | cabecera |
| Minijuego jugado solo | cabecera, puntaje, tiempo, tarjeta y el reto | cabecera y "🤔 ¿Me ganas?" |

Lo que no lleva imagen (las invitaciones y el recordatorio) sigue igual: ahí el texto es todo.

**Por qué:** lo pidió el dueño al ver la tabla en WhatsApp: la imagen y, debajo, la misma tabla
escrita, ocho líneas más que nadie lee. La imagen es lo que se mira; el texto es para lo que ella
no puede decir.

**Alternativas descartadas:** sacar solo la tabla parcial (lo pidió el dueño así, pero la misma
repetición estaba en la tabla final, el resultado del día y el resultado jugando solo, y pidió
consistencia). Dejar la tarjeta de colores en el texto, al estilo Wordle (ya está en la imagen,
en grande).

**Consecuencias:** `shareCardText` y `shareFinalChamp` salen de los textos de La Copa.
`textoResultadoSolo()` en `compartir.js` arma el texto de jugar solo y lo prueba
`compartir.test.mjs`; `tools/e2e/copa.mjs` comprueba que el resultado del día, la tabla parcial y
el resumen final no repitan la imagen. Si la imagen no se puede compartir (un computador), se
descarga y el texto se copia igual: la imagen sigue llegando.

## D-172 · Un agente de documentación con ronda diaria en la nube
**Fecha:** 2026-10-02 · **Estado:** corregida por D-276, D-303, D-304, D-313
**Decisión:** Un subagente (`.claude/agents/documentation.md`) revisa una vez al día lo que entró
a `main` y deja la documentación al día: `CHANGELOG.md`, decisiones, requerimientos, la doc de
cada juego, `CLAUDE.md`, el README con sus capturas y las tarjetas sociales.
- **Memoria:** `docs/documentation.json` guarda hasta qué commit de `main` revisó, lo que quedó
  pendiente, los problemas que ya se le preguntaron al dueño (`conocidos`) y el historial de
  rondas. Cada ronda parte de ahí, así que un día que no corre no deja nada sin revisar, y lo que no
  alcanzó a hacer no se olvida.
- **Herramienta:** `tools/agents/document.mjs` (`revisar`, `anotar`, `historial`) lista lo que entró y
  comprueba lo que no necesita leer prosa: decisiones citadas que no existen o repetidas, huecos
  o desorden en la numeración, Estados fuera de los cuatro de D-213 y correcciones sin marcar, IDs
  repetidos en requerimientos y usabilidad, rutas citadas en las guías que no existen, guiones que
  `tools/e2e/README.md` no nombra y la versión sin entrada en el CHANGELOG. Su prueba es `tools/agents/document.test.mjs`. Cualquier sesión la puede correr.
- **No es solo la ronda:** como el de usabilidad, revisa cada PR antes de proponer su fusión (lo que
  trae y sus comprobaciones, con `revisar --desde <base>`, que mira la rama; los arreglos, en la
  rama del PR) y se le puede pedir a mano.
- **Cuándo:** una Routine de Claude Code en la nube, todos los días a las **3:54 hora del
  Pacífico**, antes de la ronda de usabilidad (5:00, D-132). No necesita la llave de Firebase ni el
  Mac del dueño.
- **Qué hace:** solo documentación, en un PR `Documentación al día: <fecha>` que **no fusiona**.
  Si no entró nada nuevo, no abre PR.
- **Qué no hace:** tocar código, reglas de Firebase o versiones, ni tomar decisiones: si un cambio
  parece pedir una que nadie tomó, la pregunta va en el PR.
- **Capturas:** las rehace con `--sin-red`; las de partidas en línea necesitan llegar a Firebase
  (`www.gstatic.com` y `*.firebaseio.com`) y, si el entorno no llega, el PR lo dice.
**Por qué:** lo pidió el dueño. Con varias sesiones fusionando seguido (D-135), el README, las
capturas y el CHANGELOG se quedaban atrás: el 2026-10-02 las diez secciones del README tenían
capturas más viejas que el código.
**Consecuencias:** la primera ronda encontró D-73 dos veces (el panel que se entera solo y la
invitación que dice quién invita, de septiembre). El dueño pidió renumerar: el panel se queda con
D-73 y la invitación pasa a D-173, en su mismo lugar del archivo y con una nota; se corrigieron
las citas que hablaban de la invitación.
**Alternativas descartadas:** una tarea en el Mac del dueño como la de usabilidad (depende de que
esté prendido, y la documentación no necesita la llave). Que cada sesión deje todo documentado
al fusionar (ya es la regla, C-13, y aun así se atrasa).

## D-173 · La invitación dice quién invita
**Fecha:** 2026-09-13 · **Estado:** corregida por D-165 · **Relación:** amplía D-72; nació como D-73, repetida con la del panel; se renumeró el 2026-10-02 (D-172)
**Decisión:** Al compartir una sala, el mensaje es **"{nombre} te invita a jugar {juego} en juegosdesalon.cl - Sala: {código}"**. El texto es uno solo para los cuatro juegos con sala y vive en `COMMON` de `assets/js/i18n.js`, no en el `rules.js` de cada uno. Nombra a **quien toca compartir**, no al anfitrión: en una sala de seis cualquiera puede pasar el link, y el que invita es el que lo pasa.
**Por qué:** el mensaje decía "Únete a mi sala de Línea de Tiempo. Código: WFBN" — sin nombre. Llega por WhatsApp a alguien que muchas veces no conoce la app, y lo primero que hace falta saber es de parte de quién viene. El resto —de qué se trata el juego, para cuántos, cuánto dura— ya no hace falta escribirlo: lo pone la tarjeta que el chat arma solo con el link (D-72), y por eso también se sacó la temática que algunos juegos metían en el texto.
**Por qué compartido y no por juego:** eran cuatro juegos por tres idiomas, doce frases que decían lo mismo con doce redacciones distintas. La única parte que cambia es el nombre del juego, y ese ya viaja como `{game}`.
**Al copiar también viaja el mensaje.** Sin diálogo nativo —en un computador, o si el navegador no comparte— el portapapeles se llevaba **solo la URL** y el texto se perdía: quien invitaba tenía que escribir a mano de qué se trataba. Ahora se copia el mensaje y el link, en dos líneas.
**Y la tarjeta se dibuja adentro de una franja segura:** cada chat recorta la imagen al alto de su ventanita y lo que se come son los lados. Con 1200×630 recortada a 1,5:1 se van 127 px por lado, y ahí quedaba justo la última letra del título —la N de "SALÓN" salía cortada en WhatsApp—. Ahora todo lo que se lee vive dentro del 88% central, y `node tools/og.mjs imagenes` avisa si algo se acerca al borde. El degradado del fondo es lo único que puede perderse.

## D-174 · ¿Dónde queda? se juega suelto desde la portada
**Fecha:** 2026-10-02 · **Estado:** vigente · **Relación:** cierra lo que D-155 y D-162 dejaron en el laboratorio
**Decisión:** ¿Dónde queda? deja de llevar `labs: true` en `SUELTOS` (`assets/js/games.js`): su
tarjeta aparece en la portada como los demás minijuegos sueltos, encendida y sin "Próximamente",
y abre `/minijuegos/donde/`, que ya existía con su tarjeta social (D-162). Dentro de La Copa no
cambia nada: ya se podía elegir para cualquier día desde D-163.
**Por qué:** lo pidió el dueño. El globo, las 529 ciudades y los nombres en los tres idiomas
(D-170) ya estaban probados en el laboratorio y en copas de verdad.
**Consecuencias:** la portada ofrece siete minijuegos sueltos. La captura del menú en el README se
rehace. `labs` en `BASE` de `copa/rules.js` no se usa para la portada y queda como estaba.

## D-175 · La Copa sale del laboratorio y llega al menú
**Fecha:** 2026-10-02 · **Estado:** vigente · **Relación:** cierra el periodo de laboratorio de D-101
**Decisión:** La Copa queda activa en el menú principal (`available: true` y sin `labs` en
`games.js`): su tarjeta abre `/copa/`, sin "Próximamente". El botón "‹ Menú" de La Copa vuelve al
menú; solo quien llega desde el laboratorio (`?labs`) vuelve a `/labs/`.
- **El laboratorio sigue** para probar: la Copa de 3 días (D-100), la práctica con semilla, las
  demos y la copa simulada. Las copas creadas desde ahí siguen marcadas en el panel.
- **Lo que se ofrece desde el menú es la Copa de 7 días**, como siempre fue el plan (D-100).

**Por qué:** El dueño lo pidió: la copa ya se probó con amigos (los reportes de 🐞, las rondas de
usabilidad y los arreglos de La Copa en inglés y portugués) y ya se comparte por su link.

## D-176 · En Administrar, la invitación sigue mientras alguien pueda entrar
**Fecha:** 2026-10-02 · **Estado:** corregida por D-177 · **Relación:** cambia la invitación de D-116 solo en Administrar; D-177 corrige el día del aviso: sale desde el día 3, no desde el 2
**Decisión:** El mensaje **Invitación** de Administrar ya no desaparece cuando parte la copa: está
mientras alguien nuevo pueda inscribirse, es decir, con la inscripción abierta (hasta la final o
hasta que el admin la cierre) y sin llegar al máximo de jugadores. Ya partida, la línea "📅 Parte
el …" se cambia por "📅 Ya partió: va en el día {d} de {n} y todavía puedes entrar." y, desde el
día 2, el aviso de que los días cerrados quedan en 0 (el mismo que ve quien entra tarde). El botón
"Invitar al grupo" del tablero sigue solo antes de partir.
**Por qué:** lo pidió el dueño: con la copa andando quería sumar a alguien y la invitación ya no
estaba. La inscripción tardía está abierta a propósito (D-99, D-116), pero no había cómo invitar.
**Consecuencias:** `shareInviteText` lleva `{cuando}` en vez de la fecha, que sale de
`shareInviteStart` o `shareInviteGoing`.

## D-177 · Textos de explicación más cortos y una palabra por concepto
**Fecha:** 2026-10-02 · **Estado:** vigente
**Decisión:** Se revisaron todas las explicaciones de los juegos (reglas, ayudas, modos, antesalas,
Administrar y las frases del menú) y se acortaron un 37 % (193 textos, de unos 24.200 a 15.300
caracteres en español), con la misma información para jugar. El criterio quedó como U-8: cada
regla se dice una vez por pantalla. De paso se corrigieron los textos que decían algo distinto de
lo que hace el juego (El Ahorcado por turnos, Julepe sin "en secreto" y con el plato y el montar
bien explicados, las reglas de ases y de calzar en Dudo, cómo se gana en Línea de Tiempo, el
chancho de Cuarto Rey, el empate por réplica en Toque y Fama, la final sin día de gracia y la
copa llena en La Copa). El aviso de inscripción tardía de La Copa sale desde el día 3: el día 2
el día 1 sigue en su día de gracia. La sesión de prueba avisa que es más corta que el juego.
Palabras que el dueño fijó (U-5): **tachar** (no bloquear), **el celular** (no la app ni la IA),
**jugador** (no competidor), **administrador** (no admin, en lo que ven los jugadores),
**sorbos** en Julepe (no tragos) y **vidas** en El Ahorcado (no errores permitidos ni margen).
Las reglas de Línea de Tiempo quedan plegadas (U-16). Tango queda con 3 consejos.
**Por qué:** lo pidió el dueño: los textos eran largos y repetían la misma regla en pantallas
seguidas (en La Copa, las reglas de cada minijuego se leen dos veces al día).
**Consecuencias:** las imágenes de las tarjetas para compartir (`node tools/og.mjs imagenes`)
siguen con la frase vieja del menú hasta rehacerlas en el Mac del dueño: en la nube Chrome no
carga las fuentes. Las capturas del README que muestran estos textos se rehacen.
**Alternativas descartadas:** acortar más allá del 40 % (se perdían reglas o se volvía telegrama,
contra U-1); un botón para anotar al perdedor del chancho más tarde (cambio de diseño, aparte).

## D-178 · Los assets de marketing viven en el repo, cada uno con su memoria
**Fecha:** 2026-10-02 · **Estado:** vigente
**Decisión:** El video promocional y lo que venga de marketing son objetos del repositorio, en
`marketing/`: una carpeta por asset con sus fuentes, sus archivos finales (solo la última
versión, en `salida/`), su forma de rehacerse y un README que es su memoria. `marketing/registro.json`
los lista con versión, fecha, archivos y estado.
- **Memoria:** el README de cada asset guarda lo que el dueño fue pidiendo en cada vuelta (en sus
  palabras cuando importa), sus gustos destilados ("Lo que el dueño quiere"), cómo está hecho, las
  trampas conocidas y la historia de versiones. Se lee entero antes de tocar el asset y se
  actualiza al terminar cada vuelta.
- **Para que ninguna sesión empiece de cero:** `CLAUDE.md` lo dice, y el skill
  `.claude/skills/video-promo/` se carga solo cuando se trabaja en el video, nuevo o existente.
- **El video** (`marketing/video-promo/`) se rehace entero con `construir.sh`: juega cada juego en
  la app real con azar fijo, renderiza `promo.html` cuadro a cuadro en los dos formatos (16:9 para
  YouTube y vertical) y le pone la canción del dueño. Las capturas no van al repo: se rehacen.
**Por qué:** el video se hizo en cinco vueltas en dos sesiones, y lo aprendido (qué le gusta al
dueño, la canción, las trampas del render) estaba solo en las conversaciones y en carpetas
temporales que se borran.
**Consecuencias:** los mp4 pesan (~25 MB cada uno) y se publican con el sitio en GitHub Pages; al
reemplazarlos, el repo crece con cada versión. Si eso molesta, se pasan a Git LFS o a un release.

## D-179 · Desenredo: el Untangle de Tatham, por niveles como Zip
**Fecha:** 2026-10-02 · **Estado:** vigente · **Relación:** salió del laboratorio en D-190
**Decisión:** Un minijuego nuevo de La Copa, **🧶 Desenredo** (*Untangle*, *Desenrola*), que se
juega también suelto en `minijuegos/desenredo/`. Nudos unidos por hilos que se cruzan; se arrastran
los nudos hasta que ningún hilo cruce a otro.
- **Formato de Zip** (D-103): diez niveles de 6 a 15 nudos, uno más cada vez, y un reloj de
  **cuatro minutos** de tiempo activo. Cada nivel resuelto vale 10 puntos; con los diez se termina
  antes. El desempate es cuándo se resolvió el último nivel. Si el tiempo se acaba a medias, los
  nudos se mueven a una solución, en cian (D-109).
- **Siempre tiene solución, no una sola.** El generador arma primero el dibujo resuelto (nudos al
  azar con distancia mínima e hilos de los pares más cercanos a los más lejanos, sin cruzarse, sin
  pasar cerca de otro nudo y con hasta 4 por nudo; ninguno con menos de 2) y después reparte los
  nudos en un círculo en desorden, como Planarity, buscando uno con cruces de sobra.
- **Qué cuenta como cruce:** dos hilos sin nudo en común que se tocan (también encimados en la
  misma recta) y un hilo que pasa a menos de 24 unidades (de 1000) de un nudo que no es suyo. Lo
  segundo es lo que se ve en pantalla como cruce y cierra la trampa de amontonar todos los nudos.
  Todo en enteros, con productos cruzados exactos: igual en cualquier navegador.
- **El gesto:** el tablero toma el puntero (como Zip, D-85) y el nudo se elige por cercanía dentro
  de 24 px, aunque se dibuje de 11 px de radio (C-8). Mientras se arrastra se resaltan sus vecinos
  y sus hilos, y los cruces se pintan en vivo; el nivel se da por resuelto **al soltar**, no a
  mitad de un arrastre.
- **Habilidad propia, `espacial`:** ya había tres de `lógica` (Reinas, Zip y Tango) y el sorteo del
  calendario evita dos días seguidos de la misma habilidad.
**Por qué:** lo pidió el dueño tras la propuesta: un juego de mirar y mover, distinto de los de
deducir, que entra en un celular y se compara bien entre amigos con el mismo tablero.
**Consecuencias:** la sesión de prueba dura un minuto. `&zipSeg=` acorta también su reloj en el
modo de prueba. La imagen de su tarjeta social se rehace con `node tools/og.mjs imagenes`.
**Alternativas descartadas:** un tablero único puntuado por tiempo, como Reinas (la propuesta
inicial; el dueño prefirió niveles); generar con rectas al azar como Planarity (los tamaños saltan
de 6 a 10 a 15 nudos y no dan diez niveles parejos); prohibir soltar un nudo encima de otro (el
cruce por cercanía ya lo resuelve sin un gesto que rebota).

## D-180 · (número sin usar)
Este número no se usó: se saltó al numerar. Queda vacío para que nadie lo llene ni lo dé por perdido.

## D-181 · Cada imagen de tarjeta guarda su huella, y una atrasada no se publica
**Fecha:** 2026-10-02 · **Estado:** corregida por D-205, D-226 · **Relación:** amplía D-72; desde D-205 frena el check `pruebas`, no `set-version.py` (ya no hay `--igual`); desde D-226, de los textos de la portada solo cuentan los que la tarjeta dibuja (`appTitle` y `appSub`)
**Decisión:** `node tools/release/og.mjs imagenes` anota en `assets/og/huellas.json` la huella de cada
imagen que hace: un hash del dibujo (`tools/og/tarjeta.html`) y de lo que la imagen dice (el emoji,
el nombre, la bajada, los jugadores y la duración del juego en `games.js`, o los textos de la
portada). `node tools/release/og.mjs revisar` la compara con la de hoy y da error si una imagen falta o se
hizo con otro dibujo u otros textos. Lo corren CI (en cada PR) y `set-version.py` antes de
estampar, que no estampa sin `--igual`. `imagenes` rehace solo las atrasadas; `--todas`, todas.
**Por qué:** las píldoras desalineadas de jugadores y duración volvieron por tercera vez (0.84.2,
0.84.3 y la de Desenredo en 0.85.0). El arreglo estaba en el dibujo, pero una imagen hecha desde
una rama anterior a ese arreglo salía con el dibujo viejo, y `revisar` solo miraba que el archivo
existiera. El error no está en el CSS sino en que nada delataba una imagen vieja.
**Consecuencias:** cambiar `tarjeta.html` marca las 19 imágenes y obliga a rehacerlas (con Chrome
y fuentes de Google: en el Mac del dueño, no en la nube). Cambiar una bajada marca solo la de ese
juego. `base.css` no entra en la huella: cambia seguido por cosas que la tarjeta no usa.
**Alternativas descartadas:** rehacer todas las imágenes en cada publicación (lento, necesita
internet y Chrome, y llena el diff de bytes); comparar fechas de archivo (git no las conserva).

## D-182 · Desenredo: los hilos son cuerdas con una curva leve
**Fecha:** 2026-10-02 · **Estado:** corregida por D-185 · **Relación:** amplía D-179
**Decisión:** Los hilos de Desenredo se dibujan como cuerda y no como segmento recto: una curva
de Bézier leve (se aparta de la recta a lo más un 6 % de su largo, con tope de 34 unidades de
1000) y tres capas (borde oscuro de 6,5 px, alma de 4 px del color del hilo y hebras cortadas
encima que hacen de torcido). La forma de cada hilo sale de sus dos nudos (`cuerda` en
`desenredo.js`): unos van en S suave y otros en arco, y la mantienen al moverse. **Los cruces se
siguen decidiendo sobre la recta**: la curva es solo dibujo.
**Por qué:** lo pidió el dueño tras comparar en una maqueta hilos rectos y orgánicos: con la
curva leve el juego se ve de lana, como su 🧶, sin tocar las reglas. Una curva más marcada habría
obligado a contar los cruces sobre la curva (lo que se ve tiene que ser lo que cuenta), con un
cálculo 500 veces más pesado y niveles que habría que volver a validar.
**Consecuencias:** con una curva tan leve, lo que se ve y lo que se cuenta coinciden salvo en un
roce casi tangente. De paso: el nudo que se arrastra llevaba la clase `vilo`, que `linea.css`
oculta (es la carta en vuelo del arrastre compartido), y desaparecía mientras se movía. Ahora es
`tomado`, y el guion de punta a punta revisa que se vea.
**Alternativas descartadas:** curvas más marcadas contando cruces sobre la curva (ver arriba);
curvas que se doblan para esquivar a sus vecinas (otro juego, y más difícil saber cuándo está
resuelto).

## D-183 · Desenredo: la cuerda lleva una segunda onda y dos cabos
**Fecha:** 2026-10-02 · **Estado:** corregida por D-185 · **Relación:** amplía D-182
**Decisión:** Sobre la curva leve de cada hilo va una segunda onda, más corta y más baja: de 2 a
4 vueltas según el largo (una cada ~150 unidades), de alto 1,6 % del largo con tope de 8, con su
fase propia y apagada en las puntas (envolvente seno), así el hilo sigue naciendo en el centro del
nudo. La cuerda se dibuja con los puntos unidos por curvas suaves (Catmull-Rom). La textura pasa a
dos cabos: la hebra oscura y un brillo claro, cortados y desfasados, que se alternan.
**Por qué:** lo pidió el dueño: con una sola curva la cuerda se veía bien, pero la torsión no se
sentía natural.
**Consecuencias:** las dos ondas juntas se apartan de la recta a lo más 42 de 1000 unidades en los
hilos largos (34 + 8); los cruces se siguen contando sobre la recta (D-182). El test lo acota.

## D-184 · Instrucciones concisas: reglas escritas y un tope que lo vigila
**Fecha:** 2026-10-02 · **Estado:** vigente · **Relación:** amplía D-177
**Decisión:** Las instrucciones de cada juego siguen U-18 (`docs/USABILIDAD.md`): la meta primero
y con verbo (no "Hay nudos unidos por hilos"), a lo más 3 puntos de una idea cada uno, nada de lo
que el dibujo de ejemplo ya muestra, sin anunciar colores ni mensajes que se ven jugando, y el
puntaje en una frase sin topes que salen solos de la regla. Una prueba en
`copa/juegos/juegos.test.mjs` lo vigila en los tres idiomas: 3 puntos, 280 caracteres para "Cómo
se juega", 170 para el puntaje, y que el primer punto no empiece describiendo la pantalla.
Desenredo bajó de 337 a 209 caracteres: "se ven en rojo" lo mostraba el dibujo, "Hay nudos unidos
por hilos" describía la pantalla y "hasta 100" salía solo de 10 niveles de 10 puntos.
**Por qué:** el dueño vio que la antesala de Desenredo, escrita después de D-177, no seguía esos
recortes. D-177 fue una pasada a mano; sin una regla escrita y una prueba, cada juego nuevo
vuelve a escribir largo.
**Consecuencias:** el tope es un techo y no una meta (la mitad de los minijuegos queda bajo 210);
Tango (273) y Zip (258) quedan cerca. `CLAUDE.md` y la lista de chequeo de `CANONES.md` lo
nombran. La prueba mide largo y forma, no claridad: eso sigue siendo del agente de usabilidad.
**Alternativas descartadas:** un tope por punto (los juegos con un punto largo y dos cortos, como
Palabra, quedan bien); topes distintos por idioma (inglés y portugués quedan a ±10 % del español).

## D-185 · Desenredo: menos ondulación en la cuerda
**Fecha:** 2026-10-02 · **Estado:** vigente · **Relación:** corrige D-183 y la curva de base de D-182
**Decisión:** La segunda onda baja a menos de la mitad (0,7 % del largo, tope 3,5 de 1000) y se
alarga (2 a 3 vueltas, una cada ~230 unidades), y la curva de base queda un poco más tensa (4,5 %
del largo, tope 26). La textura de dos cabos sigue igual.
**Por qué:** el dueño vio la cuerda de 0.85.3 demasiado ondulada.

## D-186 · La copa puede ser internacional: sin temas de Chile ni de Brasil
**Fecha:** 2026-10-03 · **Estado:** reemplazada por D-187 · **Relación:** internacional pasó a ser 🌎 global
**Decisión:** Al crear una copa se elige **¿Qué temas incluye?**: con temas locales (como hasta
ahora, y lo que viene marcado) o internacional. Una copa internacional lleva `meta.intl: true` y
deja fuera lo que se conoce solo en Chile o en Brasil:
- **Línea Relámpago, ¿En qué año? y la final:** la temática Chile (Brasil ya estaba fuera, D-111)
  y, en las demás, las cartas marcadas `local` (la fundación de Colo-Colo y la Copa América de
  Chile). El fútbol de Brasil se queda: sus Mundiales son de todo el mundo.
- **Conexiones:** las grillas marcadas `local`: en español, los golpes "en chileno" y los cortes
  de carne chilenos; en portugués, las de folclore, clubes, cortes, danzas, árboles y pintores de
  Brasil. Quedan 10, 13 y 7 grillas (español, inglés y portugués).
- **Palabra:** CABRO, HUASO y PISCO.
- **¿Dónde queda?:** las ciudades de Chile y de Brasil que no son su capital, salvo Río de Janeiro
  y São Paulo. Sus niveles se pensaron para un grupo chileno (Antofagasta es nivel 1).
La invitación y el tablero lo dicen ("🌍 Copa internacional…"). Las reglas de Firebase aceptan
`intl` como `true`, igual que `lab`.
**Por qué:** lo pidió el dueño, para jugar con gente de otros países.
**Consecuencias:** una copa sin la marca genera exactamente lo mismo que antes (se comparó en
15.120 tableros), así que las copas en curso no cambian. Lo local se marca en los datos (`local`
en cartas y grillas, la lista `LOCALES` de palabras, `local()` en `donde.js`): una carta o grilla
nueva con contenido local se marca al escribirla. Los minijuegos sueltos no cambian.
**Alternativas descartadas:** decidirlo por el idioma de la copa (un grupo chileno puede jugar en
inglés, y uno extranjero en español); sacar también Brasil del fútbol (sus Mundiales se conocen en
todas partes).

## D-187 · El público de la copa: 🌎 global, 🇨🇱 Chile o 🇧🇷 Brasil
**Fecha:** 2026-10-03 · **Estado:** vigente · **Relación:** reemplaza D-186
**Decisión:** "¿Qué temas incluye?" (local o internacional) pasa a ser **¿Para qué público es?**,
con tres opciones: 🌎 Global, 🇨🇱 Chile y 🇧🇷 Brasil. Se guarda en `meta.aud` (`global`, `cl` o
`br`). Lo local va marcado con su país: `local: 'cl'` o `'br'` en cartas y grillas, las temáticas
Chile y Brasil, las palabras chilenas y las ciudades que no son capitales (`local()` en
`donde.js` devuelve el país). `copa/juegos/audiencia.js` decide qué queda fuera:
- **🌎 Global:** lo de los dos países. Genera exactamente lo mismo que "Internacional" de D-186.
- **🇨🇱 Chile:** lo de Brasil (la temática Brasil sigue fuera, como en D-111).
- **🇧🇷 Brasil:** lo de Chile. **Y entra la temática Brasil**, que antes no entraba a ninguna copa.
El formulario parte en el público del idioma de quien crea la copa (español → Chile, portugués →
Brasil, inglés → global). La invitación y el tablero dicen el público con su bandera.
**Por qué:** lo pidió el dueño, para definir la audiencia de cada país y no solo "con o sin" lo
local.
**Consecuencias:** las copas sin `aud` se juegan como antes (todo lo local salvo la temática
Brasil): se comparó en 15.120 tableros. Las `intl: true` de D-186 se leen como global, y las
reglas de Firebase aceptan los dos campos. Un país nuevo es una entrada en `AUDIENCIAS` y su
marca en el contenido.
**Alternativas descartadas:** que Chile deje entrar también lo de Brasil (un grupo chileno no
resuelve la temática Brasil, D-111); deducir el público del idioma (son cosas distintas: un grupo
brasileño puede jugar en español).


## D-188 · Juego al azar: un dado que rueda sobre el menú
**Fecha:** 2026-10-03 · **Estado:** vigente · **Relación:** el paso al juego, en D-237
**Decisión:** El menú tiene un botón **🎲 Juego al azar** bajo la bajada. Al tocarlo, un dado
blanco de cantos redondos, con un juego en cada cara, entra rodando sobre la misma portada,
rebota tres veces y cae con el elegido adelante; abajo dice "¡Te tocó! <juego>" y a los 1,3 s se
abre su pantalla principal. Tocar mientras rueda lo abre de inmediato.
- **Qué puede salir:** las tarjetas que se ven y se pueden abrir, menos La Copa (es una semana con
  amigos, no una partida para sacar al azar). Con un filtro de tipo puesto, sale uno de esos.
  Entran los minijuegos sueltos de la portada.
- **El dado es WebGL** (`assets/js/dado3d.js`, sin librerías): una malla de cubo de cantos
  redondos, luz difusa, brillo y un emoji por cara en una textura. Los botes y la sombra del
  suelo son animaciones CSS; el giro, uno solo que frena parejo de principio a fin.
- Con "reducir movimiento" el dado aparece quieto; sin WebGL aparece el emoji del elegido.
**Por qué:** lo pidió el dueño. Se probó primero en `/labs/menu/` (D-42) y se iteró ahí: la
primera versión, un cubo de `div`s en 3D, se veía tosca; con las esquinas redondeadas a punta de
capas quedaban huecos negros, y recalcular el sombreado de 80 capas en cada cuadro la trababa en
el celular. En WebGL un cuadro se dibuja en 0,3 ms y la tirada corre a 60 cuadros por segundo.
**Consecuencias:** el espejo `labs/menu/` se borra al promoverlo. Una tirada no se cancela
(dilema #139, opción A): tirar es un compromiso; tocar durante la tirada abre el juego y "atrás"
vuelve al menú.
**Alternativas descartadas:** el cubo de capas de HTML (se veía de cartón y no se podía redondear
sin huecos); una librería 3D (un archivo grande para un solo dado, en una app sin dependencias).

## D-189 · Aportes de afuera: fork, PR y `main` protegida
**Fecha:** 2026-10-03 · **Estado:** vigente
**Decisión:** Quien quiera aportar lo hace con un **fork y un PR** hacia `main`, siguiendo
[CONTRIBUTING.md](../CONTRIBUTING.md). `main` queda protegida en GitHub: no se sube directo, todo
entra por PR y con la prueba `pruebas` en verde (no pide aprobaciones: el dueño fusiona los suyos
solo). El proyecto pasa a tener **licencia MIT**. En un PR de afuera no se estampa versión ni se
escribe el CHANGELOG, y las decisiones van como `D-??`: se numeran al fusionar, como ya se hacía
entre sesiones (D-135).
**Por qué:** un amigo del dueño quiere sumar funciones. Sin protección, un colaborador con acceso
de escritura podía subir a `main`, que se publica al tiro en juegosdesalon.cl sin pasar por las
pruebas. Sin licencia, legalmente nadie más tenía derecho a usar el código. Y las reglas del
proyecto estaban escritas para el dueño y sus sesiones de Claude, sin un punto de entrada para
alguien nuevo.
**Consecuencias:** los modos con sala de quien prueba desde su fork abren salas en la base de
producción (avisado en la guía). Publicar reglas de Firebase, el panel y los reportes siguen
siendo del dueño: necesitan su llave.
**Alternativas descartadas:** sumarlo como colaborador con escritura (podría saltarse el PR); una
licencia GPL (el dueño eligió MIT).

## D-190 · Desenredo sale del laboratorio
**Fecha:** 2026-10-03 · **Estado:** vigente · **Relación:** cierra lo que D-179 dejó en el laboratorio
**Decisión:** Desenredo deja de llevar `labs: true` en `SUELTOS` (`public/assets/js/games.js`) y en `BASE`
(`public/cup/rules.js`): su tarjeta aparece en la portada, encendida y sin "Próximamente", y abre
`/minigames/untangle/`, que ya tenía su tarjeta social. En La Copa sigue en el `POZO` desde D-179:
el admin lo puede poner en cualquier día y el calendario al azar lo puede proponer.
**Por qué:** lo pidió el dueño: el juego ya está en condiciones de pasar a producción, tras las
vueltas de las cuerdas (D-182, D-183, D-185) y de las instrucciones (D-184).
**Consecuencias:** la portada ofrece ocho minijuegos sueltos y el dado del menú (D-188) también
puede caer en él. La captura del menú en el README se rehace.

## D-191 · Un idioma nuevo entra por el laboratorio: el alemán
**Fecha:** 2026-10-03 · **Estado:** corregida por D-195, D-197, D-231
**Decisión:** El alemán (**Salonspiele**) se suma completo —los textos de los ocho juegos, las
frases, los mazos, las grillas y palabras de La Copa y los nombres de ¿Dónde queda?— pero **solo
se ofrece en el laboratorio**: en el dispositivo que entra por `/labs/de/` o por un link con
`?lang=de`. En `public/assets/js/i18n.js`, `IDIOMAS` son todos los que tienen diccionario (las pruebas
de paridad los recorren todos) y `LANGS` los que se ofrecen en ese dispositivo; `EN_LABS` dice
cuáles están en el laboratorio. Ahí, `public/assets/js/labs-idioma.js` hace que los links al menú y a
`/labs/` vuelvan a `/labs/de/` y pone un botón 🐞 en la barra de arriba que manda comentarios a
`feedback/` (D-104) con el contexto: página, pantalla, idioma, tamaño y versión. "Labor
verlassen" saca la marca y deja la app en inglés. Ver [ALEMAN.md](ALEMAN.md).
**Por qué:** el dueño quiere que amigos que hablan alemán lo revisen antes de publicarlo. Un
borrador hecho con IA no puede aparecer en el toggle de todos, pero los amigos tienen que poder
jugarlo de verdad, en su celular, con salas y copas reales. Un dispositivo marcado no se sale del
laboratorio sin querer: un "‹ Menú" que llevara a la portada de siempre lo dejaría sin forma de
volver ni de comentar.
**Arreglos que salieron de medir el alemán** (con un pseudo-alemán ~40 % más largo y después con
los textos de verdad, a 320 px):
- Los títulos con degradado (`.rainbow`) cortaban los acentos sobre mayúscula (ya pasaba con
  SALÓN y SALÃO): un relleno arriba agranda la caja pintada.
- La barra de arriba: "‹ Menú" no se achica y el chip del juego se corta con "…" en vez de bajar
  a dos líneas (ya pasaba con "⚓ Batalla Naval").
- Con `lang="de"`, guiones automáticos (`hyphens: auto`) y, si igual no cabe, la palabra se parte.
- Lo que caía al español sin avisar: "v. Chr.", fechas y números `de-DE`, el alfabeto del
  Ahorcado, el teclado QWERTZ de Palabra (con un hueco donde el español tiene la Ñ, así la Z en
  inglés y la Y en alemán ya no cuelgan al final de la segunda fila).
- De paso: Palabra mostraba "null" mientras no se encontraba ninguna letra, y el título de la
  pestaña de La Copa decía "Juegos de Salón" en cualquier idioma.
**Consecuencias:** las reglas de Firebase aceptan `lang: "de"` en una copa (se publican al
fusionar, D-122). Sacar el alemán del laboratorio es quitarlo de `EN_LABS` y sumar su puerta
`/de/` con la tarjeta social; lo que falta está en ALEMAN.md. Otro idioma puede entrar igual.
**Alternativas descartadas:** sumarlo al toggle de todos con un aviso de borrador (se ve en el
toggle de quien no lo pidió); una copia aparte de la app en `/labs/de/` (se desactualiza al tiro y
no prueba las salas de verdad); que el alemán faltante cayera al inglés (esconde lo que falta
traducir: la prueba de paridad no lo vería).

## D-192 · El sitio en `public/`, las carpetas en inglés y el taller ordenado
**Fecha:** 2026-10-03 · **Estado:** corregida por D-198, D-205 · **Relación:** reemplaza D-13 y corrige D-02
**Decisión:** La raíz del repo deja de ser la raíz del sitio. Todo lo que se sirve vive en
**`public/`** y es lo único que se publica: `.github/workflows/publish.yml` lo sube a GitHub Pages
en cada fusión a main (sin los `*.test.mjs`), después de correr `tests.yml`; si una prueba falla,
el sitio no cambia. Las **carpetas van en inglés**, también las que son URL: `/hangman/`, `/cup/`,
`/timeline/`, `/bulls-and-cows/`, `/liars-dice/`, `/battleship/`, `/julep/`, `/fourth-king/` y
`/minigames/<slug>/` (`connections`, `word`, `year`, `queens`, `tango`, `zip`, `untangle`, `where`).
El **id de cada juego no cambia** (`'ahorcado'`, `'copa'`, `'reinas'`…): es un dato que guardan las
salas de Firebase, las estadísticas del panel, las reglas y el `localStorage`; la carpeta pasa a ser
`path` en `games.js` (y `slug` en los minijuegos sueltos). Cada **ruta vieja queda como página
puente** —la genera `og.mjs tarjetas`, con la tarjeta de la página nueva— que redirige
conservando lo que va detrás (`?sala=…`, `?pirata`, `&lang=…`, `#…`). Además:
- `set-version.py` arma el import map recorriendo `public/**/*.js` y estampa toda página de
  `public/` que cargue módulos: desaparece la lista `MODULES` que había que mantener a mano.
- Los minijuegos de La Copa tienen carpeta propia: `public/cup/games/<slug>/` con `engine.js`,
  `ui.js` y sus datos; lo común (`index.js`, `semilla.js`, `audiencia.js`, `mazos.js`, `solo.js`)
  queda en `games/`.
- `tools/` se ordena por función: `release/` (versión, README, tarjetas), `firebase/` (reglas,
  reportes, en curso), `generators/` (mapa, flota), `agents/` (dilemas, documentación) y
  `e2e/<juego>/`. Las especificaciones pasan a `docs/games/<carpeta>.md`; el video, a
  `marketing/promo-video/` (y su skill, a `promo-video`).
**Por qué:** la raíz mezclaba el sitio con el taller (18 carpetas y 8 archivos), y GitHub Pages
publicaba todo: `docs/`, `tools/`, las reglas de Firebase, 49 MB de video y cada test eran
públicos en juegosdesalon.cl. El dueño pidió además nombres en inglés por convención, para
internacionalizar la navegación. Separar el id de la carpeta es lo que permite renombrar sin
perder nada guardado.
**Consecuencias:** una vez, el dueño cambia Settings → Pages → Source a "GitHub Actions" (el
dominio se mantiene). Los links viejos siguen funcionando con un salto más; Google tarda unas
semanas en cambiar sus resultados a las URL nuevas (las puentes llevan `canonical` a la nueva). Las
huellas de las tarjetas (D-181) se migraron sin rehacer imágenes: solo cambiaron las rutas desde
donde importa el dibujo, y cada huella vieja se comprobó contra el dibujo anterior antes de
reemplazarla. Los comandos de las herramientas cambian de ruta (`node tools/release/og.mjs`…), y
los Routines que los nombran se actualizan al fusionar.
**Alternativas descartadas:** dejar las URL en español y mover solo el taller (no internacionaliza
la navegación); un `404.html` que redirija en vez de páginas puente (deja la raíz más limpia, pero
un link viejo pegado en un chat quedaba sin tarjeta y Google veía 404); cambiar también los ids
(rompía las salas abiertas, las copas en curso, el panel y las partidas guardadas); una sola
carpeta `juegos/` para todos (cambiaba las URL sin ganar nada a cambio).

## D-193 · Las pruebas de punta a punta corren solas en GitHub
**Fecha:** 2026-10-02 · **Estado:** corregida por D-216, D-302, D-307 · **Relación:** completa D-143
**Decisión:** `.github/workflows/e2e.yml` corre las pruebas de `tools/e2e/` en Chrome en cada PR
y en cada fusión a main, un job por guion y en paralelo. El PR muestra cuál falló y deja sus
capturas como artefacto. `tools/e2e/ci.mjs` decide cuáles: todos los guiones menos las
herramientas (`mirar`, `contacto`) y **los que abren salas en el Firebase de producción**
(`*-online`, `*-chat` y una lista corta en `ci.mjs`), que siguen a mano. Un guion falla si sale
con error, si imprime una línea con ✗ o ❌, o si pasa los 15 minutos.
**Por qué:** el dueño pidió automatizar lo más posible. Correrlas a mano costaba unos minutos por
guion y se corrían solo los del juego que se tocaba. Un cambio en algo compartido (el arrastre,
`i18n.js`, el transporte) podía romper otro juego sin que nadie lo viera hasta jugarlo.
**Alternativas descartadas:** correr también los que usan Firebase: llenarían el panel de salas
falsas y escribirían en la base de producción desde cada PR. Un solo job con todos: tardaría
más de media hora y un guion colgado taparía a los demás. Exigir que cada guion tenga sus
chequeos con ✗: muchos solo imprimen lo que ven para que lo lea una persona; en CI igual caen
si algo se rompe del todo, y pasarlos a chequeos se hace de a uno, cuando se toque cada guion.
Al correrlos todos por primera vez, dos estaban atrasados: `linea-de-tiempo-solo` buscaba
"Cambiar modo" por su posición, y Compartir (D-165) lo corrió de lugar (arreglado);
`linea-de-tiempo-error` juega contra el celular, un modo que Línea de Tiempo ya no tiene (D-142),
y queda en la lista `OBSOLETOS` de `ci.mjs` hasta que alguien lo reescriba.
**Consecuencias:** un guion nuevo entra solo. Si abre salas de verdad, va en la lista de
`ci.mjs`. Las capturas del README siguen a mano: un artefacto de CI no reemplaza mirarlas.

## D-194 · El alemán: Hochdeutsch para los tres países, hora de Europa central, diéresis dichas y sin destello
**Fecha:** 2026-10-03 · **Estado:** vigente
**Decisión:** Cuatro ajustes que pidió el dueño al probar el laboratorio alemán (D-191):
- **Alemán estándar común (Hochdeutsch) para Alemania, Austria y Suiza, con ß**: palabras que se
  usan en los tres y nada que conozca uno solo (Späti, Bundesliga, Skat, Brötchen/Semmel). Los
  suizos no escriben la ß pero la leen sin problema. El criterio está en el glosario de
  [ALEMAN.md](ALEMAN.md); todo el borrador se revisó con él.
- **Una copa en alemán cambia de día a medianoche de Europa central** (`Europe/Berlin`, que es
  también la hora de Viena y Zúrich): `zonaDeIdioma` en `public/cup/engine.js` elige la zona según el
  idioma de las palabras al crearla, y la nota bajo "Empieza" cambia al elegir el idioma. Las
  demás copas siguen en la hora del Pacífico (D-113). Después de creada, todo usa `meta.tz`.
- **Las diéresis se dejan fuera, pero se dice**: en Palabra y en el Ahorcado no hay teclas Ä, Ö,
  Ü ni ß. Las instrucciones en alemán lo dicen: "Umlaute stehen ohne Punkte: Ä ist A" (y en el
  Ahorcado, la ß se escribe SS). Las listas de palabras siguen evitándolas.
- **Sin destello de idioma**: el HTML trae los textos en español y los módulos los cambiaban al
  cargar, así que quien juega en otro idioma veía "Dudo" una fracción de segundo antes de
  "Lügenwürfel" (pasaba también en inglés y portugués). Un script en el `<head>` de cada página
  deja la página sin pintar (`html.i18n-pendiente`) hasta `DOMContentLoaded`, cuando los módulos
  ya pusieron los textos; un tope de 1,5 s la muestra igual si algo falla. En español no cambia
  nada.
**Por qué:** con la hora del Pacífico, el día de una copa alemana partía a las 9:00. Sin decirlo,
un alemán busca la tecla Ü y no la encuentra. Y el destello se nota en cada página que se abre.
**Alternativas descartadas:** escribir las diéresis como AE, OE y UE (es la convención alemana sin
teclado alemán, pero cambia el largo de las palabras y el dueño prefirió quitar los puntos); una
zona por país (Alemania, Austria y Suiza comparten la hora).

## D-195 · En el laboratorio de un idioma, el menú depende del idioma elegido
**Fecha:** 2026-10-03 · **Estado:** vigente · **Relación:** ajusta D-191
**Decisión:** En un dispositivo marcado por el laboratorio alemán, "‹ Menú" lleva a `/labs/de/`
**solo mientras se juega en alemán**. Con otro idioma elegido en el toggle, lleva al menú de
siempre. En la portada del laboratorio, elegir otro idioma también lleva al menú de siempre en ese
idioma. El alemán sigue en el toggle de ese celular y 🐞 sigue en la barra.
**Por qué:** el dueño elegía español y al volver al menú quedaba "pegado en alemán": el toggle
guardaba bien el español, pero "‹ Menú" lo llevaba a la portada del laboratorio, que está escrita
en alemán.

## D-196 · Los filtros de la portada quedan pegados arriba
**Fecha:** 2026-10-03 · **Estado:** vigente · **Relación:** complementa D-142 y D-149
**Decisión:** Al bajar por la lista de juegos, la barra de tipos (y la línea "Se ven N de M ·
Ver todos") se queda pegada arriba, con fondo oscuro desenfocado que tapa también la franja de la
muesca. Tocar un tipo estando pegada lleva la lista filtrada a su primera tarjeta, justo debajo.
**Por qué:** lo pidió el dueño. Sin esto, cambiar de tipo desde abajo obligaba a subir, y al
filtrar a media lista se quedaba mirando el medio de una lista más corta.

## D-197 · El alemán sale del laboratorio
**Fecha:** 2026-10-04 · **Estado:** corregida por D-262 · **Relación:** cierra el paso de D-191 para el alemán; corrige D-47, D-48 y D-74
**Decisión:** El alemán se ofrece a todos, como el inglés y el portugués: `EN_LABS` queda vacío,
el toggle muestra 🇩🇪 DE en cualquier dispositivo y hay puerta `/de/` con su tarjeta social
(`menu-de.jpg`, `de_DE`). El link del laboratorio, `/labs/de/`, pasa a ser una página puente hacia
`/de/` (la genera `og.mjs tarjetas`, como las de D-192): sus revisores lo tienen guardado. La
sección del alemán sale de `/labs/`. El **mecanismo** del laboratorio de idiomas (`EN_LABS`,
`LABS_KEY`, `labs-idioma.js`) queda, sin ningún idioma: el próximo entra por ahí (D-191).
**Por qué:** el dueño dio por buena la revisión: "ya tenemos la versión en alemán en producción".
**Consecuencias:** un dispositivo que tenía la marca del laboratorio (`juegos-de-salon:labs-idioma`)
deja de ver 🧪 y 🐞 y de volver al laboratorio al tocar "‹ Menú"; si estaba en alemán, sigue en
alemán. Las huellas de las 19 imágenes de tarjetas (D-181) se migraron sin rehacerlas: al publicar
el alemán cambian los idiomas que entran en la huella y el dibujo ganó el "gratis" en alemán, pero
ninguna de esas imágenes cambia; cada huella se comprobó contra el cálculo anterior. `menu-de.jpg`
se hizo en la nube (`og.mjs imagenes` usa ImageMagick donde no hay `sips`), con las fuentes de la
app; sus emojis son los de Linux, no los de Apple. Las imágenes que se comparten se revisaron
en alemán el mismo día y caben; quedan pendientes los guiones de punta a punta que solo recorren
inglés y portugués (ver docs/ALEMAN.md).
**Alternativas descartadas:** borrar también el mecanismo del laboratorio (el próximo idioma lo
necesitaría de nuevo); dejar `/labs/de/` como estaba (mostraría un laboratorio que ya no es).

## D-198 · No hay minijuegos: los juegos de La Copa son juegos
**Fecha:** 2026-10-03 · **Estado:** vigente · **Relación:** complementa D-142, D-149, D-162 y D-192
**Decisión:** La app deja de distinguir entre juegos y minijuegos. Conexiones, Reinas, Tango, Zip,
Desenredo, ¿Dónde queda?, ¿En qué año? y Toque y Fama: Palabra son juegos como los demás:
- **Sus direcciones pasan a la raíz**, como las de cualquier juego: `/queens/`, `/tango/`,
  `/connections/`… Las de antes (`/minigames/<slug>/`, `/minijuegos/<id>/` y las genéricas
  `/minigames/?reinas`) quedan como páginas puente generadas. El molde de esas páginas pasa de
  `public/minigames/index.html` a `public/cup/suelto/index.html`.
- **La Copa habla de juegos:** "cada día un juego distinto", "Seis juegos y la final", la columna
  "Juego" de la planilla y la invitación, en los cuatro idiomas (juego, game, jogo, Spiel). El
  panel, igual.
- **En el código** el registro de La Copa se llama `JUEGOS_COPA` / `juegosCopa(lang)` (antes
  `MINIJUEGOS` / `minijuegos(lang)`), y el panel cuenta `porJuego`.
- Los ids no cambian (`reinas`, `conexiones`…): los guardan las copas, el panel y el
  `localStorage`. `SUELTOS` sigue aparte de `GAMES` en `games.js` solo por cómo están hechos
  (su motor vive en `cup/games/`, sin `rules.js`), no por lo que son.

Los "minijuegos" de **Cuarto Rey** (Cuenta Cuentos, Chancho Inflado, Cultura Chupística, Nunca
Nunca) son otra cosa —lo que manda hacer una carta— y conservan su nombre. Las decisiones y el
CHANGELOG anteriores no se reescriben: cuentan lo que era cierto entonces.
**Por qué:** lo pidió el dueño: la distinción ya no sirve. Desde D-142 los juegos de La Copa
están en la portada, con sus filtros y su tarjeta, al lado de los otros; llamarlos "mini" los hacía
parecer menos, y la URL `/minigames/` lo repetía en cada link compartido.

## D-199 · Todas las pantallas se prueban en todos los idiomas
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** complementa C-3, C-12, D-193 y D-197
**Decisión:** Las pruebas de punta a punta recorren **todos los idiomas de `LANGS`**, no una lista
escrita en cada guion:
- **Cada juego tiene su prueba de idiomas**, `tools/e2e/<carpeta>/languages.mjs` (y
  `cup-games/languages.mjs` para los juegos de La Copa que se juegan sueltos). Recorre cada pantalla
  de `tools/e2e/paths.mjs` en cada idioma y la compara con la misma en español: la página en
  ese idioma y en la misma pantalla, nada a medio armar (`undefined`, `NaN`, `{marcador}`), nada
  en español (ni un texto de los diccionarios que en ese idioma diga otra cosa, ni una línea larga
  idéntica a la de la pantalla en español) y nada que el texto más largo rompa (scroll
  horizontal, botones bajo 44 px o que se salgan por abajo y que el español no tenga). La lógica
  es una sola, `tools/e2e/languages-common.mjs`; GitHub corre cada juego en su propio job (D-193).
- **Los caminos a cada pantalla salen de `look.mjs`** a `tools/e2e/paths.mjs`, que comparten:
  una pantalla nueva para mirar queda también probada en todos los idiomas. Se sumaron La Copa
  (portada y formulario, con `?prueba`) y los juegos sueltos que no tenían camino (antesala y
  juego empezado).
- **Los guiones que miran algo de un idioma** —`cup/languages.mjs`, la parte en otros idiomas de
  `timeline/solo.mjs`, `room-error.mjs` e `lang-from-url.mjs`— recorren `LANGS` y sacan lo que
  esperan de los diccionarios (`LOCALES`, `SUELTOS`), no de textos copiados al guion. `sala-error`
  ahora falla en rojo si un juego no muestra su `errOffline`; antes solo lo imprimía.
**Por qué:** lo pidió el dueño: "Guiones de La Copa y de Línea de Tiempo, así como todo juego
existente, debe probar alemán además. Y en general todos los idiomas disponibles". Con el alemán
en producción (D-197), los guiones seguían probando solo inglés y portugués, y cada idioma nuevo
habría obligado a reescribirlos. Leer `LANGS` y los diccionarios hace que el próximo idioma quede
probado el día que entra, también desde el laboratorio (D-191).
**Consecuencias:** la primera pasada encontró dos cosas del alemán: en la antesala de Palabra, la
nota de las diéresis empujaba "Zurück zum Menü" por debajo del borde (se acortó la frase), y
`timeline/solo.mjs` no encontraba el modo "Allein spielen" (se cayó a mitad de la pasada alemana).
Las pruebas de idiomas suman unos 2 minutos por juego en CI, en paralelo. Comparan contra el
español, así que no repiten lo que ya está mal en español: eso lo cuentan los guiones de cada juego.
**Alternativas descartadas:** un solo guion para todos los juegos (en CI no se vería cuál falló);
revisar solo las claves de los diccionarios (ya lo hace `i18n.test.mjs`, y no ve un texto escrito
a mano en el HTML ni un botón que el alemán saca de la pantalla); mirar las capturas a ojo en cada
idioma (no escala: son más de cien tomas).

## D-200 · ¿Dónde queda?: el globo se gira con dos dedos y la brújula endereza el norte
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** complementa D-155
**Decisión:** Además de arrastrar y pellizcar, dos dedos que giran hacen girar el mapa en torno a
ellos, como en los mapas del celular. El giro empieza pasados 12° de torsión, para que un pellizco
no lo tuerza, y al soltar a menos de 6° del norte el mapa queda derecho. Con el mapa girado aparece
una brújula sobre los botones + y −, con la N apuntando al norte; tocarla lo endereza. Cada ciudad
empieza con el norte arriba.
- La vista del motor lleva un `rumbo` (grados, contra el reloj): `ver` y `tocado` lo aplican, y el
  globo y la imagen satelital también. El arrastre de un dedo se lleva a la vista derecha antes de
  girar el globo, así lo que está bajo el dedo lo sigue.
**Por qué:** lo pidió el dueño, para corregir los puntos cardinales: girando el globo hacia un
polo, o buscando una ciudad en un país largo, uno quiere orientar el mapa a su modo. Es el gesto
que todos conocen de los mapas (no reinventar, D-102), y la brújula, la forma conocida de volver.

## D-201 · Las teselas satelitales se cortan con PIL, no con sips
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** corrige D-160
**Decisión:** `node tools/generators/map.mjs satelite` corta las 128 teselas con
`tools/generators/tiles.py` (PIL, que el repo ya usa en `readme.py`) y no con sips. Las teselas
se rehicieron: ahora cada `fila-columna.jpg` es de verdad su cuadrado de 22,5°.
**Por qué:** el dueño vio otra vez el polo norte "mal parchado": al acercarse, encima del Ártico
aparecía un abanico estirado con los lagos de África. sips tiene dos trampas: con
`--cropOffset 0 0` corta del centro y no de la esquina (la fila 0, el Ártico, salió con la franja
del ecuador, y la columna 0 con la del centro), e ignora algunos cortes que tocan el borde. Con
eso casi todas las teselas quedaron corridas, aunque solo cerca del polo se notaba a la vista.
**Alternativas descartadas:** seguir con sips esquivando el `0 0` (dar vuelta la imagen, `0.0`):
probado, y sus cortes en el borde siguen fallando sin avisar.

## D-202 · ¿Dónde queda?: el zoom llega a 64 veces
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** cambia el tope de D-159
**Decisión:** El globo se acerca hasta 64 veces (antes 16): en un celular, unos 600 m por píxel y
unos 200 km de lado a lado. La respuesta sigue acercando hasta 12.
**Por qué:** hubo quejas de que el zoom no alcanzaba. El tope de 16 se puso cuando solo estaba la
imagen de 4096 px (D-159) y quedó igual al llegar las teselas (D-160). Y se pensó en la imagen, no
en el dedo: a 16, un toque erra por unos 10 píxeles, unos 20 a 25 km, justo el margen del 🎯. A
64 erra por unos 6 km. Pasado 16 la imagen se ablanda (cada píxel de la fuente ocupa hasta cuatro
de la pantalla), pero costas, ríos, lagos y cordilleras se siguen leyendo.
**Alternativas descartadas:** la imagen de la NASA de 500 m por píxel (unas 2.000 teselas y
240 MB en el repo, y las ciudades casi no se ven en ella); un tope de 48 (el dueño eligió 64).

## D-203 · ¿Dónde queda? se juega a pantalla completa
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** complementa C-8, D-133, D-159 y D-202
**Decisión:** El globo de ¿Dónde queda? ocupa la ventana entera y todo lo demás flota encima,
suelto y en La Copa por igual; reemplaza a la vista en caja:
- **Arriba**, la barra (‹ Menú y 🔊) con el reloj en una píldora al medio; debajo, la ciudad
  ("Ciudad 1 de 5" y su nombre) y las **reglas plegadas** como un widget que se abre sobre el
  globo y se desplaza por dentro (D-133). El nombre del juego no se repite: lo dice la ciudad.
- **Abajo**, la pista de girar, + y − y la acción: Confirmar, o el resultado y Siguiente.
- **El globo se centra entre la ciudad y la acción** y puede pasar 60 px por debajo de ellas;
  la respuesta encuadra el alfiler y la ciudad en esa franja. El tope de acercamiento se mide en
  radio del globo en píxeles, no en veces el globo: en un computador el globo entero es el doble
  que en un celular. Es 11000, unas 64 veces el globo de un celular (D-202, unos 600 m por píxel).
- **La cáscara se entera por el juego**: `pantallaCompleta` en su `ui.js` hace que `cup/game.js`
  ponga `pantalla-completa` en el `body` al montarlo, y `mostrar()` la quita al cambiar de pantalla.
  Otro juego de La Copa puede pedir lo mismo.
**Por qué:** En un computador el globo quedaba en una caja de unos 410×320 px, un 13 % de la
pantalla, y en un celular en la mitad. Un mapa es mejor mientras más grande se vea.
**Consecuencias:** Lo que flota no puede quedar dentro de algo con `transform` (la animación de
entrada de la pantalla se apaga en este modo) ni con `align-self: center`, que Chrome también
aplica a lo fijo. La pantalla no se desplaza: lo que no quepa tiene que desplazarse dentro de su
widget, como las reglas abiertas.
**Actualización 2026-10-06 (PR #248):** la píldora del reloj ya no se centra en la ventana: en la
prueba del laboratorio, con "🧪 Prueba", se montaba sobre "‹ Laboratorio" (C-8). `pantallaCompleta`
de `cup/game.js` mete `#jugar-head` dentro de la barra, entre volver y el sonido, y al salir lo
devuelve a la pantalla de jugar. Si no cabe, `ajustarCabeza` deja la píldora de prueba en 🧪
(`.justo`) y, si ni así, la saca (`.sin-chip`); el reloj no se parte (`nowrap`).

## D-204 · Publicar más rápido: los guiones largos en partes y la revisión de un PR, acotada
**Fecha:** 2026-10-04 · **Estado:** corregida por D-213, D-304, D-307 · **Relación:** amplía D-132, D-172 y D-193
**Decisión:** Lo que hace esperar un PR se acorta sin sacar ninguna revisión:
- **CI en partes.** El check `Punta a punta` tarda lo que su job más lento. `cup/tournament.mjs`
  (9 min) se corre en tres jobs (`--parte copa`, `laboratorio`, `demos`) y `cup-games/languages.mjs`
  (7 min) en uno por juego. La lista de partes vive en `PARTES` de `tools/e2e/ci.mjs`; sin parte,
  cada guion sigue corriendo entero.
- **El agente de usabilidad, en un PR, mira solo lo que el PR cambia**: si no toca nada visible
  termina sin correr nada; si toca un juego, mira sus pantallas con `look.mjs`; si toca La
  Copa, corre solo la parte del torneo que le toca. No repite lo que GitHub ya corre. Los reportes
  🐞, el marketing (U-34) y la copa entera quedan para la ronda diaria.
- **Usabilidad y documentación se lanzan a la vez** antes de proponer una fusión, no una después
  de la otra: uno toca la app (en su propio PR) y el otro los documentos (en la rama del PR).
- **`readme.py capturas` corre los guiones de a tres a la vez** (`CAPTURAS_JUNTOS`), cada uno con
  sus puertos de Chrome (D-135) y el más largo primero: rehacer todas las secciones tarda poco más
  que `cup/tournament.mjs`, no la suma de todos los guiones.
**Por qué:** Pedido del dueño: las publicaciones se demoraban, sobre todo por las revisiones de
usabilidad y las imágenes. Medido en GitHub: `Pruebas` tarda 25 s y `Publicar` 1 min, pero
`Punta a punta` ~10 min, y dos guiones explicaban todo (los demás terminan antes de 3,5 min). La
revisión de usabilidad de cada PR jugaba la copa entera aunque el PR fuera de otro juego.
**Consecuencias:** Una parte nueva de un guion largo se suma a `PARTES`; las partes tienen que
poder correr solas, sin depender del estado que dejó la anterior.

## D-205 · La versión se estampa al publicar, no en git
**Fecha:** 2026-10-04 · **Estado:** corregida por D-299, D-300, D-302 · **Relación:** reemplaza el estampado a mano de C-11; corrige D-22, D-51, D-72, D-181 y D-192; amplía D-193 y D-204
**Decisión:** Las páginas de `public/` en git ya no llevan versión: ni import map, ni `?v=` en las
hojas de estilo y las imágenes de las tarjetas, y el pie del menú dice `v0.0.0`.
- **El número es la primera entrada de `CHANGELOG.md`** (`## X.Y.Z — fecha`), que se escribe al
  fusionar, como antes. `tools/release/version.mjs` y `set-version.py --version` lo leen de ahí.
- **`publish.yml` estampa la copia que sube** (`set-version.py --sitio _site`), con la clave de
  caché `X.Y.Z-<commit>`: cada publicación invalida la caché aunque alguien fusione sin subir la
  versión. Después comprueba que el sitio en línea sirva esa clave (C-11), hasta 5 minutos.
  `tests.yml` estampa una copia que se tira en cada PR, para que un estampado roto se vea ahí.
- **El README y las tarjetas atrasados los frena el check `pruebas`** de cada PR y de cada
  publicación, ya no `set-version.py`.
- **Un PR que solo trae documentación** (`docs/`, `marketing/`, `.claude/` y los `.md` fuera de
  `public/` y `tools/e2e/`) **no corre las pruebas de punta a punta**: la lista de `ci.mjs --lista
  --cambios` sale vacía (`tools/e2e/changes.mjs`). El check queda en verde en segundos.
- **Si `Punta a punta` sale en rojo en `main`**, el job `avisar` abre un issue "main en rojo: Punta
  a punta" con los guiones que fallaron y el link a la corrida, o comenta el que ya esté abierto.
  La publicación no lo espera.
**Por qué:** Pedido del dueño, para publicar más rápido. Cada estampado reescribía unos 55
archivos, así que dos PR abiertos siempre chocaban y el segundo tenía que traer `main`,
reestampar y correr CI de nuevo (pasó en #172 y #175 el mismo día), aunque `main` no exige estar
al día (solo exige el check `pruebas`). Sin la versión en git, chocan solo en la línea del
CHANGELOG. Y como ya no se trae `main` a cada PR, lo fusionado se prueba de verdad recién en
`main`: por eso esa corrida ahora avisa.
**Consecuencias:** Para mirar el sitio estampado en local, se estampa una copia
(`set-version.py --sitio /tmp/sitio`); `public/` no se estampa nunca. Sin estampar, las
estadísticas de una prueba local salen sin versión (`versionOf` no encuentra el import map), como
ya pasaba en `dev`. Las capturas no envejecen por el commit que sacó la versión: `readme.py` no
cuenta la línea del import map como cambio.

## D-206 · El worktree de una sesión se borra al fusionar su PR
**Fecha:** 2026-10-04 · **Estado:** corregida por D-218 · **Relación:** completa D-135
**Decisión:** La copia de trabajo que D-135 manda crear (`../juegos-de-salon-<tema>`) se borra
cuando su PR entra a `main`, junto con la rama local: `git worktree remove` y `git branch -d`,
desde la carpeta principal (y `git worktree prune` si alguna se borró a mano). Los dos se niegan
si hay trabajo que no está en `main`, y entonces se mira antes de forzar. Sin trabajo en curso, en
`Projects/` se ve una sola carpeta `juegos-de-salon`. Quedó en CLAUDE.md.
**Por qué:** D-135 dijo cómo abrir la copia pero no cómo cerrarla. Al 2026-10-04 se habían
acumulado 26 carpetas `juegos-de-salon-*` (2,1 GB), todas de ramas ya fusionadas, y el dueño las
leyó como proyectos distintos: no se distinguía el trabajo en curso del abandonado. Borrarlas no
pierde nada —el historial vive en el repo— y `git worktree list` vuelve a ser una lista corta de
lo que de verdad está abierto. La regla la escribió una sesión del 2026-10-04 como D-197, en una
rama que nunca se subió (ese número quedó para el alemán); se rescató al limpiar las carpetas.

## D-207 · El panel se navega: secciones, fichas y la hora del Pacífico
**Fecha:** 2026-10-04 · **Estado:** corregida por D-266, D-348 · **Relación:** reemplaza las tres vistas de D-137
**Decisión:** El panel deja de ser una página larga con tres pestañas y pasa a navegarse como un
sitio: cuatro secciones (Ahora, La Copa, Juegos, Audiencia) y una ficha por cada cosa que existe.
La de una copa tiene la tabla completa, la grilla jugador × día (puntaje, tiempo, puntos, jugando,
sin terminar, no jugó, comodín) y su historia evento por evento; la de un juego, sus modos, la
duración típica de sus salas, sus salas y sus partidas sin red con hora; la de una sala, quién
jugó, quién ganó y cuánto duró. Toda vista vive en el `#` de la URL (`public/panel/rutas.js`) y
los enlaces de antes siguen sirviendo. Cada cifra de Ahora filtra la lista que la suma. Lo pidió
el dueño con estas condiciones:
- **La hora es la del Pacífico** (Los Ángeles), la misma con que La Copa parte sus días. Los
  contadores de `stats/` siguen por día UTC y se rotulan así.
- **Las copas de prueba no se ocultan**: ya se parecen a las de producción. Llevan su etiqueta y
  tienen un filtro propio.
- **Cada nombre lleva la bandera de su país**, para saber dónde se juega. Las salas ya lo tenían
  (D-79); La Copa guarda ahora `co` al crear o inscribirse (regla nueva en
  `torneos/<código>/players/<pid>/co`), y los reportes 🐞 lo llevan en su contexto.
- **Se busca por código o link propio, no por nombre**: juntar todo lo de una persona es seguirla,
  y el panel mira señales (D-44).
- **Lo que leen los reportes queda en el navegador**: el panel no escribe en la base.
De paso, una copa que el admin terminó antes (`fin`, D-161) ya no sale en curso hasta su fecha:
el panel le aplica el cierre igual que la copa.
**Por qué:** Con tres pestañas nada se podía abrir: una copa era una fila de texto, no había dónde
ver quién jugó qué día ni la historia de una sala, y las cifras no llevaban a la lista que las
formaba. Los datos ya estaban en la base; faltaba poder recorrerlos. La hora del Pacífico evita
leer la ventana de un día de copa en un reloj y sus jugadas en otro.
**Consecuencias:** `panel.js` dibuja por ruta; `copas.js` suma `fichaCopa`, `historiaCopa` y
`buscarCopa`; `aggregate.js`, la hora del panel, las partidas sin red del rango (`localLog`), el
país de las salas y la sala por código. La regla de `co` es nueva y opcional: hay que publicarla
**antes** de que salga la versión que lo escribe, porque una inscripción con `co` y las reglas
viejas se rechaza. Queda para después (propuesta del 2026-10-04): una línea de tiempo de toda la
app, los reportes en el panel (LIG-44), una sección de salud de los datos y señales nuevas
(cuándo entró el rival, cuándo cerró el admin la inscripción).

## D-208 · El tráfico del sitio, aunque nadie juegue
**Fecha:** 2026-10-04 · **Estado:** corregida por D-266, D-349 · **Relación:** completa D-44
**Decisión:** Cada página que se abre manda una señal, aunque nadie llegue a jugar, y el panel
la muestra en una sección nueva, **Tráfico** (`#/trafico`). Una **visita** es una pestaña: se
cuenta una vez, en la página donde empezó, con de dónde llegó (solo el dominio: `google_com`,
`instagram_com`, `directo`), la marca del link (`?de=` o `utm_source`), si el navegador ya había
venido, el aparato y el país. Cada página que se abre después suma una **vista**. Si la visita
empieza una partida o un juego de la copa, suma **juegan** en su página de entrada: así se ve qué
entradas terminan jugando. Todo va en contadores por día en `stats/<env>/days/<día>`
(`vistas`, `entradas`, `juegan`, `ref`, `via`, `retorno`, `disp`, `pais`), con reglas nuevas.
Se eligió esto en vez de un servicio de afuera (Cloudflare Web Analytics) por pedido del dueño:
queda en el panel, junto a las partidas, y con las mismas reglas de privacidad.
- **WhatsApp no dice de dónde viene nadie.** Por eso los links que comparte la app llevan
  `de=link` al final (`marcarCompartido` en `compartir.js`): una visita que llega por una
  invitación se cuenta como tal aunque el chat no lo diga. Va detrás de todo y con `=`, así que
  ningún juego lo confunde con un código de copa o de sala.
- **Las páginas puente y las de idioma** (`/dudo/`, `/en/`…) redirigen en el acto y se llevarían
  el origen: lo dejan guardado en la pestaña antes de irse, y la primera página lo usa una vez.
- **"Ya había venido"** es una marca en el navegador (`localStorage`) que no viaja ni identifica a
  nadie: quien borra los datos o usa modo privado cuenta como primera vez.
- **El panel no se cuenta**: es el dueño mirando.
**Por qué:** El panel solo veía a quien empezaba a jugar. No se sabía cuánta gente entra y se va,
por dónde llega ni qué páginas convierten en partidas, que es lo que hace falta para saber si
una publicación o un link compartido trae gente.
**Consecuencias:** Una escritura por página abierta, por REST y sin abrir conexión (D-41): no gasta
la cuota de conexiones simultáneas. Las reglas nuevas hay que publicarlas antes de que salga la
versión; sin ellas cada visita recibe un 401 callado y no se cuenta, sin romper nada. Una página
de entrada nueva tiene que llamar a `trackVisit()`: `stats.test.mjs` lo exige para cada `game.js`,
la portada y el laboratorio.

## D-209 · La bandera junto a cada nombre, también para los de antes
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** completa D-207
**Decisión:** Todo nombre de jugador que muestra el panel lleva la bandera de su país, si se
conoce: en las fichas, en "va primero", en quien juega un día anterior, en los retirados y en
cada evento de la historia de una copa (que ahora empieza siempre por el nombre de quien lo hizo).
Quien se inscribió en una copa antes de que se guardara el país lo anota solo la próxima vez que
abre su copa: el celular escribe `co` en su propio registro, una vez, y una regla nueva lo deja
(su asiento, y solo si no había uno). Los juegos de La Copa jugados sueltos se nombran con su
nombre en el panel (antes salían con su clave: `letras`).
**Por qué:** Lo pidió el dueño: la bandera tiene que estar junto a cada nombre, en La Copa y en
cualquier juego. Sin completar a los de antes, las copas en curso se verían sin banderas hasta
la próxima.
**Consecuencias:** Quien no vuelva a abrir su copa queda sin bandera. Las partidas sin red siguen
sin nombres (D-44): ahí solo hay país.

## D-210 · Las partidas sin red dicen quién jugó y cómo terminó
**Fecha:** 2026-10-04 · **Estado:** corregida por D-213 · **Relación:** cambia D-44 para los modos sin red, y D-140
**Decisión:** Una partida contra el celular, en un solo celular o en solitario manda, además de
juego, modo y país, **quién juega** y **cómo terminó**. El nombre no se pide para esto: son los
nombres que la partida ya tiene (los de un celular pasándose, o el de quien juega contra el
celular) o, si no hay, el último que la persona escribió en la app: el de ese juego, el de La
Copa o el de cualquier otro (`nombreDelCelular`). Si nunca escribió uno, la partida sale "sin
nombre", con su bandera. Al terminar, cada juego anota quién ganó, si fue empate, o un detalle
(`80/100 · 6 intentos · 2:30` jugando solo) en `live/<id>/fin`, una vez, y deja de latir.
En el panel, la sección Juegos lista todas las partidas sin red del rango con esos datos, y la
ficha de cada juego, las suyas.
**Por qué:** El dueño tiene amigos jugando Toque y Fama solos y no los veía: el panel solo
mostraba "una partida sin red en Chile". Eligió esto entre pedir un nombre al empezar (un paso
más para quien juega) y seguir sin nombres con más detalle.
**Consecuencias:** El nombre es el que la persona ya usa en la app y solo lo lee el dueño, igual
que los de las salas. Las partidas de antes no tienen ni nombre ni final. Cuarto Rey no tiene
ganador: manda los nombres, no el final. Reglas nuevas en `stats/<env>/days/<día>/live/<id>`
(`name` y `fin`).

## D-211 · Cada copa, sala y partida sin red dice en qué idioma se jugó
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** completa D-46 y D-207
**Decisión:** Cada sala guarda el idioma en que juega cada jugador (`rooms/<código>/l/<rol>`, el
que eligió en la app, no el del navegador) y cada partida sin red el suyo (`live/<id>/l`). Las
copas ya lo tenían (`meta.lang`). El panel lo muestra como una etiqueta corta (`ES`, `PT`, o
`ES · PT` si en una sala cada uno jugó en el suyo) en todas las listas y fichas, y suma un
desglose: copas por idioma en La Copa y "En qué idioma" en la ficha de cada juego.
**Por qué:** Lo pidió el dueño: saber en qué idioma se juega cada copa y cada juego. El contador
del idioma elegido (`applang`, D-46) decía cuánto, pero no de qué partida.
**Consecuencias:** Lo de antes no tiene idioma y no lleva etiqueta. Reglas nuevas, solo agregan.

## D-212 · Un jugador es un nombre y un PIN para todos los juegos, y sus récords van a rankings
**Fecha:** 2026-10-04 · **Estado:** corregida por D-217, D-249, D-357 · **Relación:** amplía D-96 fuera de La Copa; completa C-7 (lo que sale de quien entra con su jugador)
**Decisión:** Quien quiere aparecer en los rankings entra con **su nombre y un PIN de 4 dígitos**,
como en La Copa, pero una vez para toda la app y en cualquier celular. Es opcional y se ofrece
plegado en la antesala de cada juego suelto (junto al ranking, debajo de "Empezar": antes lo
empujaba fuera de la pantalla en alemán y portugués, dilema #186; desde D-249 va justo bajo Empezar y Volver al menú, como tarjeta destacada), en su resultado y en `/records/`: sin entrar, todo se
juega igual y nada sale del celular.
- **Identidad.** Un jugador es un `jid` (8 letras y números) en `jugadores/<jid>` = `{ n, at }`.
  El PIN nunca se guarda: `jugadorKeys/<jid>` tiene su hash, que nadie lee, y cada celular se
  sienta en `jugadorSeats/<jid>/<uid>` con el mismo hash, con el acceso anónimo de Firebase. Las
  reglas solo aceptan el asiento si el hash coincide: el mismo mecanismo de D-96.
- **Nombres repetidos.** Se permiten. `jugadorNombres/<clave>/<jid>` lista quiénes usan cada
  nombre (sin mayúsculas, tildes ni espacios de más). Para entrar, el celular prueba el PIN contra
  cada uno; si ninguno lo acepta y hay otros con ese nombre, pregunta antes de crear uno nuevo.
  Dos personas con el mismo nombre y el mismo PIN son, por diseño, el mismo jugador. En las tablas
  no hay tag: la fila propia se marca "tú".
- **Récords.** `records/<tabla>/<período>/<jid>` = `{ s, ms, k, at, n }`, solo el mejor de cada
  uno. La tabla es el id del juego (`reinas`), el juego con su variante (`reinas_copa`, los días de
  una copa) o `todoterreno`. El período es `siempre` o la semana ISO (`s2026-41`, que parte el lunes
  a medianoche en Chile). `k = (100000 − s) × 10⁸ + ms` ordena por más puntos y menos tiempo: el
  top es una sola consulta (`orderByChild('k')`, `limitToFirst`). Las reglas recalculan `k`, exigen
  que el nombre sea el del jugador y que el récord nuevo sea mejor que el guardado.
- **Lo que se muestra.** La antesala de cada juego tiene su ranking con pestañas Semana, Siempre,
  Amigos y Copa (dilema #187: "En La Copa" no cabía): las 10 primeras y, si quien mira quedó más abajo, sus vecinos. Se leen 100
  filas de una vez; más abajo de eso, los vecinos se piden aparte. **Amigos** son los de tus copas
  que también entraron con su jugador: el jugador de la copa guarda `players/<pid>/j`. El
  **Todoterreno** suma tu mejor puntaje en cada juego suelto. **Campeones de La Copa**: cuando una
  copa termina, el primero que la abre guarda su podio en `torneoPodios/<código>` (una vez, con los
  nombres que la copa tiene) y de ahí sale el medallero (oro, plata, bronce), en la portada de La
  Copa y en `/records/`. La portada del sitio solo suma un botón 🏆 en la barra: no tiene espacio para más.
- **Partidas.** Con jugador, cada partida terminada suma uno en `jugadores/<jid>/juegos/<juego>`
  (`n` y `at`), aunque no sea récord: es su historial y deja servida una racha.
- **Qué cuenta.** Los juegos sueltos de la portada, jugados como cualquiera los juega: sin el
  laboratorio y sin una semilla elegida en el link, que dejaría repetir el mismo tablero. Los días
  de una copa cuentan en la pestaña "Copa", salvo las copas del laboratorio. Toque y Fama solo y Línea
  Relámpago siguen con su récord local por ahora. Rendirse (0 puntos) cuenta como partida jugada, pero no entra a
  las tablas: un 0 no es un récord (dilema #185).
- **Primero en el laboratorio.** Mientras `RANKINGS_EN_LABS` sea `true` (`jugador.js`), las
  piezas de ranking, la invitación a entrar y el 🏆 de la portada solo aparecen en los celulares
  que los activaron en `/labs/` (una marca en el `localStorage`) y siempre en pruebas. Así se
  prueban contra las reglas y el Firebase de verdad, con amigos, antes de abrirlos a todos. Las
  copas terminadas guardan su podio desde ya.
- **La historia de La Copa** (`node tools/firebase/rankings-history.mjs`, que sin `--escribir`
  solo muestra lo que haría): el podio de cada copa terminada y el mejor día de cada persona en
  cada juego suelto, en la pestaña "Copa". Quien jugó antes de los rankings queda como **jugador
  heredado**, uno por nombre, sin PIN (`jugadores/<jid>.legado`, con un jid que sale del nombre:
  correrlo de nuevo no duplica). La primera vez que alguien entra con ese nombre, la app pregunta
  si esos puntajes son suyos; si dice que sí, les pone su PIN. El primero que lo reclama se los
  queda: entre amigos se arregla, y el dueño puede corregirlo en la consola.
**Por qué:** El dueño pidió rankings de cada juego y de La Copa con una identidad que la gente
pueda reusar sin crear cuentas, aceptando que los nombres se repitan. Nombre y PIN ya era lo que
La Copa usaba y entendían sus jugadores. Guardar solo el mejor de cada uno, con su clave de orden,
deja leer cualquier tabla con una consulta chica y escribir solo cuando alguien mejora.
**Consecuencias:** El puntaje se calcula en el celular, como en La Copa (D-97): las reglas acotan
lo absurdo, pero quien edite el JavaScript puede inventar un 100. Sin servidor (RP-10) no se puede
impedir; el dueño puede borrar o renombrar desde la consola (las reglas le dan escritura en estas
ramas). Un PIN de 4 dígitos se adivina probando 10.000 veces en línea: separa a amigos, no protege
contra un atacante, y la pantalla pide no usar el del banco. Olvidar el PIN no tiene arreglo:
se crea otro jugador. En localhost y con `?prueba` el almacén es el de prueba
(`jugador-local.js`, que hace cumplir lo mismo que las reglas), para que los guiones no escriban
en los rankings de verdad; `?records=firebase` fuerza Firebase. Hay que **publicar las reglas**
(`node tools/firebase/rules.mjs publicar`); el acceso anónimo ya está habilitado por D-96.

## D-213 · Una fuente por regla: los cánones dicen la regla de hoy
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** corrige D-132, D-135 y D-204; completa D-189; sube a los cánones lo que vivía solo en D-56, D-60, D-70, D-77, D-81, D-86, D-92 y D-123
**Decisión:** Después de una auditoría completa de las reglas del negocio, el dueño resolvió:
- **Cada regla vive en un solo lugar.** `CANONES.md` dice la regla de hoy; este archivo es la
  historia, con su porqué. Cuando una decisión cambia una regla, el mismo PR cambia el canon y
  marca el Estado de la decisión vieja. El Estado es uno de cuatro: `vigente`, `corregida por
  D-x`, `reemplazada por D-x` o `derogada`. Lo demás (cambia, amplía, completa, excepción a) va
  aparte, en **Relación**.
- **`AGREGAR-JUEGO.md` son pasos cortos** que remiten a C-2 y a la lista de chequeo. **`CLAUDE.md`**
  queda como índice y reglas de sesión.
- **C-9 y C-8b:** si después viene un pase de celular, el resultado queda hasta tocar el botón.
  Cerrarse solo vale solo sin pase (sala, jugar solo).
- **C-8, "nada se preselecciona",** vale para las jugadas que se confirman. Un ajuste puede traer
  un valor por defecto si se ve y se puede cambiar antes de empezar.
- **C-5:** un juego de grupo (más de dos) elige si ofrece un celular, varios o los dos; lo que no
  ofrece no se muestra. Los juegos de dos siguen con los tres modos.
- **Capturas atrasadas del README:** en un PR común son un aviso. Solo "actualiza el README" exige
  dejarlas en cero.
- **Para fusionar:** ✅ en `pruebas` y en `Punta a punta`.
- **El agente de usabilidad arregla en la rama del mismo PR**, como el de documentación, y no
  estampa versión en el CHANGELOG.
- **U-3:** los textos nuevos salen con la mejor propuesta, anotada en el PR, y el dueño corrige
  después, como con los dilemas sin backlog del 2026-10-03.
- **C-14:** el gancho de pruebas es un `window.__…` de solo lectura nombrado en la especificación
  del juego, no necesariamente su id.
- **Las especificaciones de los juegos siguen una plantilla común:** las secciones de C-13 más
  "Excepciones a los cánones". Los juegos de La Copa siguen en `cup.md`.
- **Suben a los cánones** reglas que vivían solo en decisiones: la semilla y sus excepciones (D-70,
  D-81), las listas vacías en Firebase (D-60), el alto `100svh` y las muescas (D-77),
  `touch-action` y `overscroll-behavior` en el arrastre (D-86), el turno que se ve sin leer
  (D-92), la excepción de C-8b (D-56) y el reintento que comprueba (D-123).

**Por qué:** la auditoría encontró cánones que contradecían decisiones nuevas (C-7 decía que de
los modos sin red no sale ningún nombre, y D-210 lo cambió), una excepción (D-70) a una regla que
no estaba en los cánones, `AGREGAR-JUEGO.md` con claves viejas, unas veinte decisiones superadas
sin marcar e IDs repetidos en `REQUERIMIENTOS.md`. Con la misma regla escrita en dos lugares, el
que se atrasa no avisa: quien lee el canon viejo cree que esa es la regla de hoy.
**Consecuencias:** quien cambia una regla toca dos cosas en el mismo PR: el canon y el Estado de
la decisión que deja atrás. Para decidir algo nuevo se lee primero el canon, y aquí solo el porqué.
Este archivo abre con una tabla de rutas de entonces y de hoy y un índice por tema que lleva de
cada canon a las decisiones que lo explican. Las decisiones viejas no se reescriben: se marcó su
Estado y se pusieron al día solo los comandos de las que siguen siendo procedimiento (D-51, D-72,
D-78, D-122, D-132, D-172 y D-181). D-180, que nunca se usó, queda como número vacío, y D-173 pasó
a su lugar en el orden. Quedan para PR aparte: llevar Cuarto Rey al canon, y los guardianes
automáticos (`games.test.mjs`, un `document.mjs` más estricto y el puerto libre en `cdp.mjs`).
Al llevar Cuarto Rey al canon, su partida también avisa cómo terminó (`trackFinish`), sin
ganador: el cuarto rey es un castigo, así que solo va el detalle (`👑 Javi · 29 cartas`). Eso
corrige lo que D-210 decía de él ("manda los nombres, no el final"). Y su pase ya no es el overlay
de dos etapas de D-14: el "¡Salud!" y "Pásale el celular a X" van en una sola pantalla de
`handoff.js`, que solo avanza con el botón (C-9).
**Actualización 2026-10-05:** los guardianes llegaron en su PR. `public/assets/js/games.test.mjs`
exige a cada juego de `GAMES` motor, tests, gancho `window.__…` y especificación con la plantilla
de C-13, o una excepción que cite su decisión; `document.mjs` revisa además la numeración, los
Estados, las correcciones sin marcar, los IDs repetidos y las rutas citadas en las guías, y ya no
pide la lista de pruebas en `CLAUDE.md` (GitHub las corre todas); `cdp.mjs` toma un puerto libre
para cada Chrome y lo cierra con su guion, y `ci.mjs` le pasa SIGTERM antes de SIGKILL.

## D-214 · El filtro de la portada va en inglés en la URL: `?type=logic`
**Fecha:** 2026-10-04 · **Estado:** vigente · **Relación:** cambia la URL de D-142 y D-149; sigue a D-192
**Decisión:** El tipo de juego va en la URL como `?type=`, con claves en inglés: `words`, `logic`,
`trivia` y `tabletop` (Cartas/Dados). Son las mismas claves de `TIPOS` y de `tipos` en
`games.js`. Un link de antes (`?tipo=mesa`, `?tipo=logica`) sigue filtrando lo mismo
(`TIPOS_VIEJOS`) y la portada lo reescribe como `?type=`.
**Por qué:** Lo pidió el dueño: desde D-192 las rutas van en inglés, y `?tipo=mesa` se quedó en
español. Los links filtrados se comparten, así que son parte de la cara pública como las rutas.
**Consecuencias:** Los nombres que ve el jugador no cambian. Los tipos no se guardan en Firebase
ni en el `localStorage`, así que no hay datos que migrar. Quedan en español `?sala=`,
`?practica=` y `?semilla=`; `?sala=` va en cada link de invitación y se cambia aparte.

## D-215 · Victorias por juego de grupo, y récords de Toque y Fama solo y Línea Relámpago
**Fecha:** 2026-10-05 · **Estado:** corregida por D-217 · **Relación:** amplía D-212
**Decisión:** Los rankings suman dos tipos de tabla, con la misma forma de `records/` (D-212):
- **Victorias** de los juegos de grupo (los que se juegan en sala: Línea de Tiempo, Toque y Fama,
  El Ahorcado, Dudo, Batalla Naval y Julepe): `records/<juego>_victorias/<período>/<jid>`, con
  `s` = cuántas y `ms` = 0. Las reglas exigen que suban de a uno. Al terminar una partida, el
  celular anota la del jugador abierto: en sala, la de su rol; contra el celular, la del humano;
  en un solo celular, la del jugador que se llama como el jugador abierto. Un empate no es
  victoria, y toda partida terminada se cuenta en `jugadores/<jid>/juegos/<juego>`. Jugando solo
  (el Ahorcado) no hay victorias. La tabla va en la intro de cada juego, debajo de los modos, y en
  `/records/`. Cuarto Rey no tiene ganador y no tiene tabla.
- **Récords de jugar solo:** Toque y Fama solo en `toque-y-fama_solo` y Línea Relámpago en una
  tabla por temática (`linea-de-tiempo_rel-<temática>`), con el mismo 0–100 y el tiempo. El ranking
  va en la antesala, debajo de Empezar; en el resultado, con jugador, el aviso de los rankings
  reemplaza al récord del celular. No suman al Todoterreno, que es de los juegos sueltos.
**Por qué:** Lo pidió el dueño: cada juego con su ranking, y los de grupo, que no tienen puntaje
comparable, con sus victorias. Usar la misma forma de tabla deja gratis el top, los vecinos, los
amigos y la semana.
**Consecuencias:** En un solo celular, alguien puede jugar contra sí mismo con dos nombres y sumar
victorias: entre amigos se ve, y el dueño puede corregirlo en la consola. Si en un solo celular
nadie se llama como el jugador abierto, la partida no se anota. Siguen en el laboratorio (D-212).

## D-216 · Auto-merge por defecto, con la punta a punta exigida en `main`
**Fecha:** 2026-10-05 · **Estado:** vigente · **Relación:** corrige D-143 y D-193 (qué exige `main`)
**Decisión:** Todo PR listo para fusionarse lleva el auto-merge de GitHub
(`gh pr merge <n> --auto --merge`): se fusiona solo cuando pasan sus pruebas. Para que eso
signifique "todas", `main` exige dos checks: `pruebas`, como antes, y `punta-a-punta`, un job
nuevo de `.github/workflows/e2e.yml` que espera a todos los guiones y sale en rojo si alguno
falla (en un PR solo de documentación, en verde). Se activa cuando el PR está listo: los agentes
de usabilidad y documentación terminaron, sus arreglos están subidos y el CHANGELOG ya tiene la
entrada de la versión.
**Por qué:** El dueño pidió una fusión y esperó una hora: las pruebas habían pasado, pero la app
solo despierta a la sesión cuando el CI falla, no cuando pasa. Con el auto-merge, la fusión no
depende de que alguien esté mirando. Sin `punta-a-punta` exigido, el auto-merge habría fusionado
apenas pasara `pruebas`, sin esperar a Chrome.
**Consecuencias:** Lo que va después de fusionar (publicar las reglas de Firebase, borrar la
copia y la rama) sigue siendo de la sesión, en cuanto ve el PR fusionado. Dos PR con auto-merge
que escriben el CHANGELOG chocan en esa línea: el segundo queda en conflicto, GitHub no lo
fusiona, y su sesión trae `main` y renumera. Los checks exigidos son un ajuste del repositorio
(Settings → Branches → `main`), no del código.

## D-217 · Los rankings salen del laboratorio
**Fecha:** 2026-10-05 · **Estado:** vigente · **Relación:** corrige D-212 y D-215 (dónde se ven)
**Decisión:** Los rankings se ven para todos, sin pasar por `/labs/`: el 🏆 de la portada,
`/records/`, la tabla de cada juego, la invitación a entrar y el medallero de La Copa.
`RANKINGS_EN_LABS` queda en `false` y la sección de Rankings sale de `/labs/`. La puerta
(`rankingsVisibles`, `activarRankings`) se conserva para probar en el laboratorio lo próximo de
los rankings antes de abrirlo.
**Por qué:** Lo pidió el dueño, después de cargar la historia de La Copa (D-212) y sumar las
victorias y los récords de jugar solo (D-215).
**Consecuencias:** Quien abre un juego ve su ranking y la invitación a entrar con nombre y PIN.
Las reglas de Firebase no cambian.

## D-218 · Lo de después de fusionar no espera a nadie
**Fecha:** 2026-10-05 · **Estado:** corregida por D-252 · **Relación:** completa D-216; corrige D-122 y D-206 (quién publica las reglas y borra la copia)
**Decisión:** Con el auto-merge (D-216) un PR se fusiona cuando nadie mira, así que lo que venía
después pasa a hacerse solo:
- **Las reglas de Firebase** las publica `publish.yml` en cada fusión, en un job `reglas` que
  corre antes del sitio: `rules.mjs publicar` no sube nada si ya están y verifica lo que sube; si
  Firebase las rechaza, el sitio no se publica. Usa el secreto `FIREBASE_ADMIN_JSON` (la llave de
  la cuenta de servicio, que carga el dueño en GitHub); sin él, avisa y se publican a mano.
- **Las copias de trabajo** las borra `tools/agents/clean-worktrees.mjs` al empezar cada sesión
  (hook SessionStart de `.claude/settings.json`): las que tienen su rama en `main` por un merge y
  nada sin commitear. Nombra las fusionadas con cambios pendientes y las que siguen en curso. Nunca
  toca la carpeta principal, la copia desde donde se corre, las de la app (`.claude/worktrees/`) ni
  una rama recién creada sin commits propios. GitHub borra la rama remota al fusionar
  (`delete_branch_on_merge`).
- **Enterarse de lo que falla:** cada PR lleva, con el auto-merge, el monitor de CI de la app
  (`auto_fix`), que despierta a la sesión con una prueba en rojo, un conflicto o un comentario.
  El CI no se sondea.
**Por qué:** El dueño pidió que la sesión revisara cada 5 minutos si las pruebas habían pasado.
El entorno de Claude no permite programar revisiones periódicas del CI, y tampoco hacía falta: la
fusión ya era automática; lo que quedaba colgando era lo de después, y eso se resuelve con
GitHub Actions, un hook y el aviso de fallas.
**Consecuencias:** La llave de Firebase vive también como secreto de GitHub: la carga el dueño,
no Claude (`gh secret set FIREBASE_ADMIN_JSON < ~/.config/juegos-de-salon/firebase-admin.json`).
Una copia que otra sesión todavía usa después de fusionar se borra al abrir la siguiente sesión;
lo que quede sin commitear se respeta.

## D-219 · /records/ se ordena: lo general arriba, Juegos o Copas abajo, y la bandera junto a cada nombre
**Fecha:** 2026-10-05 · **Estado:** corregida por D-236 · **Relación:** amplía D-212 y D-215
**Decisión:** La página de rankings se ordena para leerse de arriba abajo:
- Arriba, lo que vale para todos los juegos: tu jugador, el **Ranking general** (el Todoterreno)
  y **Más partidas jugadas**, una tabla nueva (`records/partidas/<período>/<jid>`) que suma una
  por cada partida terminada con nombre y PIN, en cualquier juego. Como las victorias, sube de a
  uno y las reglas lo exigen.
- Debajo, un filtro grande: **🎮 Juegos** (de a uno: los sueltos, Toque y Fama solo y Línea
  Relámpago, con sus temáticas adentro; en grupo: las victorias) y **🏆 Copas** (los campeones,
  las últimas copas y el mejor día de copa, juego por juego). La elección queda en la dirección
  (`#juegos/reinas`, `#copas`); el `#copa` de antes sigue llevando a Copas.
- **La bandera del país junto a cada nombre**, en todas las tablas, el medallero, las últimas
  copas y "Juegas como". El jugador guarda su país (`jugadores/<jid>/co`, el de su celular, como
  La Copa: D-209) y cada fila lo lleva (`co`), así la tabla se dibuja sin leer nada más. Quien ya
  había entrado lo completa solo al abrir cualquier página. El podio de una copa lleva el país de
  cada uno (el de la copa).
**Por qué:** Lo pidió el dueño: la página tenía todo, pero en una sola columna larga, sin
separar juegos de copas, y sin saber de dónde es cada uno.
**Consecuencias:** `rankings-history.mjs` completa lo de antes: la bandera de los jugadores
heredados, sus récords y los podios (desde las copas), y la tabla de partidas con lo que cada
jugador ya había jugado. Reglas nuevas: `jugadores/<jid>/co`, `co` en las filas y en los podios,
y `partidas` entre las tablas que suben de a uno; las publica `publish.yml` (D-218).

## D-220 · "Tus copas" sigue al jugador, no solo al celular
**Fecha:** 2026-10-05 · **Estado:** corregida por D-336, D-359 · **Relación:** amplía D-212 y la cuenta de La Copa (C-6)
**Decisión:** La lista "Tus copas" de la portada de La Copa suma, a las que recuerda este celular,
las del jugador que entró con nombre y PIN, de cualquier celular:
- Cada vez que un celular con jugador abre una copa en que está sentado, además de enlazar al
  jugador de la copa (`players/<pid>/j`, D-212) anota la copa en `jugadorCopas/<jid>/<código>` =
  `{ p: pid, at }`. Las reglas piden estar sentado como el jugador y como `p` en la copa, y que la
  copa tenga a `p` enlazado a ese jugador. Solo la leen los celulares del jugador.
- La portada dibuja de una las del celular y después agrega las del jugador que no conoce (con el
  nombre de la copa y el de quien juega, leídos de la copa), con la misma regla: hasta una semana
  después de terminar. Una copa que su admin borró sale de la lista.
- Al abrir una de esas copas, este celular todavía no está sentado: la pantalla de entrar parte en
  "Ya estoy inscrito" con su nombre elegido, y falta solo **el PIN de esa copa**. El PIN del
  jugador no sienta en la copa: cada copa sigue con el suyo (D-96).
**Por qué:** El dueño entró con su jugador y no vio una copa que jugaba en otro celular: la lista
vivía solo en el `localStorage`, y el jugador no sabía en qué copas estaba (la copa sí sabía qué
jugador tenía).
**Consecuencias:** Regla nueva, `jugadorCopas`; la publica `publish.yml` (D-218). Las copas ya
enlazadas antes de esto entran a la lista la próxima vez que se abren con el jugador, o de una con
`node tools/firebase/rankings-history.mjs --escribir`, que las anota a su jugador enlazado o, si
no lo hay, al heredado de su nombre (también las del laboratorio).

## D-221 · La app se instala de verdad, y La Copa avisará al celular a quien lo pida
**Fecha:** 2026-10-05 · **Estado:** corregida por D-230 · **Relación:** corrige D-99, completa RP-11
**Decisión:** Juegos de Salón pasa a ser una app instalable completa (PWA) y tendrá avisos al
celular (Web Push) para La Copa, solo para quien los active. El plan, la experiencia del jugador y
la arquitectura están en [PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md). Va en cuatro PR; este
trae el primero:
- **Instalable:** íconos PNG de 192, 512 y `maskable`, y el `apple-touch-icon` del iPhone
  (`public/assets/icons/`, se rehacen con `node tools/release/icons.mjs`); el manifest con `id`,
  `scope` y esos íconos; y un service worker en la raíz (`public/sw.js`) que **no toca la red**:
  sin evento `fetch`, nada se guarda en caché y ningún celular puede quedar con una versión vieja.
- Cada página de la app (las que llevan el manifest) agrega el `apple-touch-icon` y registra el
  service worker con `import '<…>assets/js/instalable.js'`, después de sus hojas de estilo: el
  import map que pone `set-version.py` va antes de la primera, y un módulo antes de él lo dejaría
  sin efecto.
- **Los avisos** (PR 2 a 4): Web Push estándar, sin proveedor pago. Los manda un workflow
  programado de GitHub Actions con la llave de servicio que ya existe (D-218); las suscripciones
  van a una rama de la base que nadie puede leer. Solo avisos de La Copa: se abrió el día, se te
  va a pasar el plazo, la final y el cierre. A lo más 2 por copa al día, en la hora del jugador.
- **Sin recordatorios de calendario por ahora** (LIG-29): el dueño pidió solo avisos al celular.
**Por qué:** Lo pidió el dueño, para que los jugadores vuelvan. D-99 había descartado los avisos
automáticos porque "necesitan un servidor y un proveedor pago": Web Push es gratis (lo reparte el
servicio del propio navegador) y GitHub Actions hace de servidor. El mensaje del admin al grupo
(D-99) sigue igual: el aviso es personal y el grupo es social.
**Consecuencias:** En iPhone los avisos llegan solo a la app agregada a la pantalla de inicio, y
esa app no comparte nada con Safari: la experiencia lo resuelve pidiendo el PIN (D-96) al abrirla, y
el PR 2 lo prueba primero en iPhones reales. Una página nueva de la app copia las tres líneas del
`<head>` (manifest, ícono del iPhone e `instalable.js`); `instalable.test.mjs` las exige y revisa
que cada juego del registro tenga su manifest. El modo sin conexión (RP-13) sigue pendiente y
sería otro paso.

## D-222 · La app instalada se llama como en el idioma del jugador
**Fecha:** 2026-10-05 · **Estado:** vigente · **Relación:** completa D-221 y corrige D-48 (el manifest ya no es uno solo en español)
**Decisión:** El ícono de la app instalada dice **Juegos de Salón**, **Party Games**, **Jogos de
Salão** o **Salonspiele**: el `appTitle` del idioma elegido (C-3), el mismo nombre de la portada.
- Hay un manifest por idioma: `manifest.webmanifest` (español) y `manifest.<idioma>.webmanifest`,
  iguales salvo `name`, `short_name`, `description` (el `appSub`) y `lang`. Comparten el `id`: es
  una sola app.
- Un script corto, justo después del `<link rel="manifest">` de cada página, lo cambia al del idioma
  elegido mientras se lee la página: cambiarlo después, desde un módulo, a veces llegaba tarde y
  Chrome se quedaba con el del español. `instalable.js` lo repite al cargar, y
  pone el mismo nombre en `apple-mobile-web-app-title`, que es el que usa el iPhone. Sin ese meta,
  el iPhone proponía el título de la página ("El Ahorcado 🪢 · Juegos de Salón").
**Por qué:** Lo pidió el dueño: la app instalada decía solo "Juegos" (el `short_name` de antes), y
en el iPhone el nombre del juego que estaba abierto.
**Consecuencias:** El nombre se elige al instalar: quien cambia de idioma después conserva el de
entonces hasta reinstalar (Android puede ofrecer actualizarlo solo). En algunos Android un nombre
largo se corta bajo el ícono ("Juegos de Sa…"). `instalable.test.mjs` exige que cada manifest calce
con `COMMON` de `i18n.js`, y `tools/e2e/installable.mjs` revisa el nombre en los cuatro idiomas.

## D-223 · Los avisos de La Copa se activan con la campana, primero en el laboratorio
**Fecha:** 2026-10-05 · **Estado:** corregida por D-224, D-227 · **Relación:** completa D-221
**Decisión:** El PR 2 del plan de avisos ([PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md)): el
jugador activa los avisos de una copa, el celular se suscribe y la base guarda la suscripción. Los
avisos de verdad los manda el PR 3.
- **La campana** va en la cabecera de la copa, con su estado: **Activar avisos**, **Avisos
  activos** (abre los ajustes: los dos avisos, "Probar los avisos" y "Silenciar esta copa") o
  **Avisos bloqueados** (cómo desbloquearlos en ese celular). Si el celular no puede, no aparece.
- **La tarjeta** que los ofrece sale una vez por copa: antes de que parta, después de jugar un día
  si queda otro, o al abrir la copa desde la app instalada. "Ahora no" la apaga en esa copa.
- **El permiso del sistema se pide solo después de tocar "Avisarme"**: su "No" es definitivo.
  Al activar, el celular se manda un aviso de confirmación, sin pasar por el servidor.
- **Una vez por celular:** si ya activó avisos en otra copa, la nueva los trae puestos, con la
  línea "Te avisaremos de esta copa" y "Cambiar".
- **iPhone:** en Safari, la campana abre los tres pasos para agregar la app a inicio; dentro de
  WhatsApp o Instagram, pide abrir el link en Safari. La dirección pasa a llevar `&app=<pid>` (el
  PIN nunca), y la app instalada abre en "Ya estoy inscrito" con el nombre ya elegido (corregida
  por D-227: en iPhone la app instalada abre en la portada, y la hoja da el código de la copa).
- **La base:** `push/<subId>` y `pushCopa/<código>/<pid>/<subId>`, que nadie lee; las escribe solo
  el celular dueño, sentado como el jugador. Ver firebase/README.md.
- **La clave VAPID** la genera el dueño una vez (`node tools/push/vapid.mjs`): la pública queda en
  `public/assets/js/vapid.js` y la privada, como el secreto `VAPID_PRIVADA`. Sin clave, los avisos
  no se ofrecen. En el sitio local sirve una de prueba guardada en el navegador.
- **Detrás del laboratorio** (`AVISOS_EN_LABS` en `push.js`), como los rankings (D-212): se ven en
  el sitio local y en los celulares que los activan en `/labs/`.
**Por qué:** Lo pidió el dueño, con el diseño que aprobó (la experiencia de PWA-NOTIFICACIONES.md,
las hojas sobre el morado oscuro de la app). Mientras no se manden avisos, ofrecerlos a todos
prometería algo que no llega; en el laboratorio se prueba en iPhones reales, que no se pueden
automatizar.
**Consecuencias:** El PR 3 abre los avisos a todos (`AVISOS_EN_LABS = false`) cuando mande el
primero (corregida por D-224: se abren cuando el dueño confirme que llegó uno de verdad). Si la base rechaza una suscripción porque quedó a nombre de otra identidad anónima del
mismo celular, el celular la anula y pide otra, que sí puede guardar. `tools/e2e/cup/notifications.mjs` recorre todo en Chrome con un servicio de avisos falso; la
prueba en iPhone queda como lista de pasos en PWA-NOTIFICACIONES.md.

## D-224 · Los avisos de La Copa los manda GitHub cada 15 minutos, sin dependencias
**Fecha:** 2026-10-05 · **Estado:** corregida por D-228, D-229 · **Relación:** completa D-221 y D-223; corrige las consecuencias de D-223
**Decisión:** El PR 3 del plan de avisos ([PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md)): el
workflow `.github/workflows/notifications.yml` corre `tools/push/notify.mjs` cuatro veces por hora.
- **Qué toca** lo decide `tools/push/schedule.mjs` con la lógica de la copa (`cup/engine.js`):
  **se abrió el día** (desde las 9:00, si pidió "Cuando se abre un día" y no lo ha jugado), **se
  te acaba el plazo** (4 horas antes del cierre, o desde las 20:00 si cierra de noche; solo a quien
  no lo jugó), **La Gran Final** (con su lugar en la tabla), **terminó la copa** (quién ganó, durante
  un día) y, solo al admin, **quién se inscribió**. Los textos van en `cup/rules.js`, en los cuatro
  idiomas, y cada aviso sale en el idioma y la hora de la suscripción.
- **Nunca de noche**: nada antes de las 8:00 ni desde las 22:00 de quien recibe.
- **De a uno**: cada vuelta manda a lo más un aviso por copa y celular (el plazo antes que el del
  día); el siguiente sale en la vuelta que viene. Los del mismo día comparten `tag`, así el nuevo
  reemplaza al anterior en la bandeja.
- **Lo mandado se anota** en `pushEnviados/<código>/<subId>/<clave>`, que solo toca la cuenta de
  servicio: no se repite, y una falla pasajera (429, 5xx) se reintenta en la vuelta siguiente. Una
  suscripción que el servicio da por muerta (404 o 410) se borra con sus copas, y lo de una copa
  borrada o terminada hace más de una semana se limpia.
- **Web Push sin dependencias** (`tools/push/webpush.mjs`, con `node:crypto`): el cifrado
  `aes128gcm` (RFC 8291) calza byte a byte con el ejemplo del RFC, y la firma VAPID (RFC 8292).
- **Para probar:** `--simular` dice qué mandaría sin mandar ni anotar; `--prueba <código>` manda
  un aviso de prueba a cada celular con avisos en esa copa. Los dos están en el botón *Run
  workflow* de Actions → Avisos.
- **Necesita dos secretos**: `FIREBASE_ADMIN_JSON` (el de `publish.yml`, D-218) y `VAPID_PRIVADA`
  (lo carga `node tools/push/vapid.mjs`, D-223). Sin ellos, avisa y termina en verde.
- **Siguen en el laboratorio** (`AVISOS_EN_LABS = true`): se abren a todos con un cambio de una
  línea cuando el dueño confirme, con `--prueba`, que un aviso de verdad llega a su Android y a su
  iPhone. (Corregida por D-228: llegó a los dos y se abrieron.)
**Por qué:** Lo pidió el dueño ("pasa a fase 3"). GitHub Actions ya tiene la llave de la base y no
cuesta nada; su atraso de minutos no importa porque cada aviso vale por una ventana de horas, no
por un minuto. Sin el SDK de Firebase Cloud Messaging ni una librería de Web Push no hay
dependencias que mantener, como en el resto de `tools/`. Abrir los avisos antes de ver uno de
verdad en un iPhone prometería algo que quizá no llega.
**Consecuencias:** Si el repo pasa 60 días sin commits, GitHub apaga los workflows programados.
Un celular puede recibir dos avisos el mismo día (el del día y el del plazo del anterior). Las
pruebas (`tools/push/*.test.mjs`) usan relojes inventados y una base falsa: el envío real se
prueba con `--prueba`.

## D-225 · La clave VAPID está puesta, y la app instalada del iPhone hereda el laboratorio de avisos
**Fecha:** 2026-10-05 · **Estado:** corregida por D-227 · **Relación:** completa D-223 y D-224
**Decisión:** El paso previo a la prueba real de los avisos ([PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md)):
- **La clave VAPID** se generó una vez con `node tools/push/vapid.mjs`: la pública quedó en
  `public/assets/js/vapid.js` y la privada, como el secreto `VAPID_PRIVADA` de GitHub, sin pasar por
  ningún archivo ni pantalla. No se rehace (`--forzar`): cambiarla deja sin avisos a todos los
  suscritos. Con la clave en el repo, la de prueba del navegador ya no se usa, ni en el sitio local.
- **La app instalada del iPhone hereda el laboratorio:** no comparte el `localStorage` de Safari, así
  que el "Activar en este celular" de `/labs/` no llegaba y la campana no aparecía justo donde los
  avisos funcionan. Si La Copa abre **en la app instalada** con `&app=<pid>` (la dirección que arma la
  hoja de agregar a inicio, que sale solo si la campana ya se veía en Safari), activa el laboratorio
  de avisos en ese almacenamiento (`heredarLabsDeApp` en `push.js`). En una pestaña no: esa
  dirección pudo llegar copiada a otro celular. (Corregida por D-227: iOS abre la app instalada en la
  portada, sin `&app=`, así que la herencia no llegaba; se quitó y la campana se ve siempre ahí.)
**Por qué:** Lo pidió el dueño, para hacer la prueba real en su iPhone antes de abrir los avisos a
todos (D-224).
**Consecuencias:** Cuando `AVISOS_EN_LABS` pase a `false`, la herencia deja de hacer falta y no hace
nada. `push.test.mjs` y `tools/e2e/cup/notifications.mjs` la prueban (y que un link con `&app=` en una
pestaña no la active).

## D-226 · Compartir la app lleva su tarjeta como imagen, en el idioma en que se mira
**Fecha:** 2026-10-05 · **Estado:** vigente · **Relación:** cambia la regla 3 de D-165 para la app y la huella de la tarjeta de la portada de D-181; usa D-72, D-74 y D-171
**Decisión:** El 📤 de la portada manda **la tarjeta social de la portada** (`assets/og/menu.jpg`,
`menu-en.jpg`, `menu-pt.jpg`, `menu-de.jpg`, D-72) **como imagen**, la del idioma en que se mira,
junto con un texto con el estándar de D-165: la cabecera con cuántos juegos hay
(`🎲 *Juegos de Salón* · 15 juegos para el celular`), una idea por línea (La Copa, en grupo, solo,
sin cuenta) y el link a la portada de ese idioma al final. Con imagen, el texto no repite lo que
ella dice (D-171): el nombre, la bajada y "gratis, sin instalar" ya están en la tarjeta.
- **`compartirApp()`** (`compartir.js`) arma el texto desde `COMMON[lang].shareApp` y baja la
  tarjeta una sola vez; `shareButton()` (`ui.js`) acepta `imagen` y la manda solo donde el celular
  comparte archivos (`comparteArchivos()`).
- **En un computador no se descarga nada:** se copia el texto, como antes. Una invitación que baja
  un JPEG al tocarla sorprende; el link pegado igual trae su tarjeta.
- **La tarjeta se baja antes**, en un momento libre de la portada y solo donde se va a mandar: el
  menú del sistema tiene que abrirse enseguida después del toque, o Safari lo niega.
- Si no se pudo bajar, se comparte solo el texto, que con su link trae la tarjeta igual.
**Por qué:** Lo pidió el dueño ("mejora el botón de Share de la portada con imagen y texto,
aprovechando todo lo que hemos hecho ya", en el idioma elegido). Pegada como texto, la invitación
a la app dependía de que el chat armara la vista previa del link, que WhatsApp a veces no arma o
arma tarde; la imagen va siempre. Se reusa la tarjeta, que ya está en los cuatro idiomas, con el
nombre, la bajada, los emojis de los juegos y el dominio: dibujar otra con `lamina()` sería una
segunda versión de la misma imagen que envejece aparte.
**Alternativas descartadas:** una lámina nueva de 1080 con la lista de juegos (otra imagen que
mantener, y la lista no cabe legible); descargar la imagen en el computador (D-165 lo hace con los
resultados, que sin imagen no dicen nada; la app sí).
**Consecuencias:** las invitaciones a una sala o a una copa siguen solo con texto (D-165). Si la
tarjeta de la portada cambia (`og.mjs imagenes`), cambia también lo que se comparte. La huella de esa
tarjeta (D-181) mira ahora solo los textos que dibuja (`appTitle` y `appSub`), no todo `COMMON`:
sumar el texto de compartir la daba por atrasada sin que cambiara un píxel. Lo prueban
`compartir.test.mjs` y `tools/e2e/share-home.mjs` (los cuatro idiomas, y el computador).

## D-227 · En la app instalada del iPhone, los avisos se ven sin el laboratorio
**Fecha:** 2026-10-05 · **Estado:** vigente · **Relación:** corrige D-225 (la herencia del laboratorio) y D-223 (la app instalada abre en la copa)
**Decisión:** En la prueba a mano del dueño (iPhone, Safari), la app agregada a inicio **abrió en la
portada**: iOS usa el `start_url` del manifest, no la dirección que había en Safari. Así, `&app=<pid>`
nunca llega, la herencia de D-225 no hace nada y la campana no salía en el único lugar donde el
iPhone recibe avisos.
- **La campana se ve siempre en la app instalada del iPhone** (`avisosVisibles` en `push.js`, con
  la clave puesta), aunque `AVISOS_EN_LABS` siga en `true`: ahí no hay barra de direcciones para
  llegar a `/labs/`, y la app no ve lo que se activó en Safari. Se quita `heredarLabsDeApp`.
  La tarjeta "Último paso: activa los avisos" sale también ahí, aunque la dirección no traiga `&app=`.
- **Los pasos de la hoja "Agrega la app a tu inicio" dan el código de la copa**: el paso 3 y "Ya
  la agregué" dicen que la app parte en la portada y que se entra a La Copa con ese código, el
  nombre y el PIN de la copa.
- La dirección sigue llevando `&app=<pid>`: si alguna versión de iOS la respetara, la copa abre con
  el nombre ya elegido (D-223).
**Por qué:** Lo vio el dueño en su iPhone; la prueba real de los avisos (D-224) necesita la campana
dentro de la app instalada.
**Consecuencias:** Quien instala la app en un iPhone ve los avisos antes de que se abran a todos.
Son pocos y es justo lo que se quiere probar. `push.test.mjs` y `tools/e2e/cup/notifications.mjs` lo
prueban.

## D-228 · Los avisos de La Copa se abren a todos
**Fecha:** 2026-10-05 · **Estado:** vigente · **Relación:** corrige las consecuencias de D-224; cierra la etapa de laboratorio de D-223
**Decisión:** `AVISOS_EN_LABS = false` en `push.js`: la campana de avisos sale en todas las copas,
en cualquier celular que pueda recibirlos, sin activarla antes en `/labs/`. Se quita la sección
"🔔 Avisos de La Copa" del laboratorio. La puerta queda en el código: `true` los vuelve a cerrar,
y entonces valen otra vez `/labs/` (con `activarAvisos`) y la app instalada del iPhone (D-227).
**Por qué:** El dueño hizo la prueba real el 2026-10-05: con la clave puesta (D-225), *Run
workflow* con **prueba** en su copa mandó "Así se verán los avisos de esta copa." y llegó a su
Android (Chrome, sin instalar) y a su iPhone (la app agregada a inicio, D-227). Era la condición
de D-224 para abrirlos.
**Consecuencias:** Desde ahora cualquier inscrito puede pedir avisos, y el workflow `notifications.yml`
los manda cada 15 minutos sin que nadie mire. Lo que falta medir (cuántos los activan, cuántos se
tocan) es el PR 4 de [PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md). `tools/e2e/cup/notifications.mjs` no
cambia: en el sitio local los avisos ya se veían sin el laboratorio.

## D-229 · Los avisos: tope de 2 al día, empates en plural, el día exacto, botones y copas juntas
**Fecha:** 2026-10-05 · **Estado:** corregida por D-266 · **Relación:** corrige D-224 (sin tope, un ganador, abría el tablero, sin botones ni copas juntas)
**Decisión:** Lo que D-224 dejó afuera del plan de [PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md),
en `tools/push/schedule.mjs`, `notify.mjs`, `public/sw.js` y la copa:
- **Tope:** a lo más **2 avisos por copa y celular en un día** de quien recibe (`TOPE`). Cuenta
  entregas, no claves: el aviso de dos inscritos es uno. Si se vencen dos plazos a la vez (la final
  y el día anterior, la noche del último día), van en un aviso: "Te quedan 4 horas para jugar los
  días 6 y 7. Si no los juegas, son 0 puntos."
- **Empate en el primer lugar** (mismos puntos, días ganados y final, como la tabla): "🥇 Ganaron
  Ana y Beto. Quedaste 3.º"; a quien empató arriba, "🥇 ¡Ganaste la copa junto con Beto!".
  Las listas de nombres van con `Intl.ListFormat` en el idioma de quien recibe ("Ana y Beto",
  "Ana e Beto"), también en el de la inscripción.
- **El día exacto:** el del día, el plazo y la final abren la copa con `&dia=<d>`, y la copa parte
  en ese día, listo para empezar, si todavía se puede jugar; si no, el tablero. El del cierre abre
  el tablero, que ya muestra el podio.
- **Botones en Android:** esos avisos traen **Jugar** (el día) y **Silenciar esta copa**, que abre
  la copa con `&silenciar`: la silencia como el botón de los ajustes y lo dice. El service worker no
  escribe en la base: lo hace la copa, con el jugador ya sentado. iPhone no muestra botones.
- **Copas juntas:** si a un celular le toca el día nuevo de varias copas en la misma vuelta, va un
  solo aviso ("🎲 Tienes un día nuevo en 2 copas: Los Primos y La Oficina.") que abre la portada
  de La Copa, y se anota en cada copa. Plazos, final y cierre siguen siendo de cada copa.
**Por qué:** El dueño lo pidió después de ver llegar los avisos a su Android y su iPhone ("ejecuta
las 3 pendientes"). El tope y los plazos juntos evitan el aviso de más que hace que alguien los
apague; el día exacto y los botones ahorran toques; el empate no deja a un ganador afuera.
**Consecuencias:** `schedule.test.mjs` y `notify.test.mjs` prueban el tope, los plazos juntos, el
empate y las copas juntas; `tools/e2e/cup/notifications.mjs`, `&dia=` y `&silenciar`. Los botones se
prueban a mano en Android: Chrome headless no los muestra. Si con el tope se pierde un plazo (dos
avisos ya ese día), el del día siguiente o el de gracia lo cubren.

## D-230 · Uno al día: un juego por día, el mismo para todos, con racha y avisos que pide el jugador
**Fecha:** 2026-10-05 · **Estado:** corregida por D-239, D-262, D-266 · **Relación:** amplía D-188 (el dado de Juego al azar abre el juego del día) y D-212 (un período nuevo, el del día, y la tabla de rachas); corrige D-221 (los avisos ya no son solo de La Copa: suma los que el jugador pide para Uno al día); completa RP-44
**Decisión:** Una modalidad nueva en la portada, junto a Juego al azar. Cada día, a la medianoche
del jugador, sale un juego con su contenido, el mismo para todos, a partir de la fecha
(`uno-al-dia:<fecha>`, como las semillas de La Copa, D-97). Entran todos los juegos que tienen modo
para uno: los solitarios, El Ahorcado con el mazo del celular, y Batalla Naval y Dudo contra el
celular. El dado de D-188 rueda cada vez que se abre el juego de hoy, aunque siempre caiga en el
mismo. Después de jugar se puede invitar a un amigo con un dato verdadero de quien invita (su
racha, su puesto), y el amigo juega el mismo desafío. Cuando el invitado termina su primer día, quien
invitó gana un comodín de racha, y eso se anuncia en la tarjeta de invitar. La tarjeta para compartir el
resultado no nombra el juego de hoy, ni en el texto ni en la imagen (dilema #215, excepción a
U-31). Se lleva la racha, el calendario y los puntajes en el celular y, con jugador, en
Firebase, con ranking del día, de la semana y de rachas. Los avisos (el del día, el de la racha que
se corta y el de la semana) los activa el jugador y elige la hora. El detalle está en
[UNO-AL-DIA.md](UNO-AL-DIA.md).
**Por qué:** El dueño quiere audiencia que vuelva cada día y que use más juegos. La Copa ya
demostró que "un juego por día" engancha, pero necesita un grupo y dura una semana. Uno al día
no tiene ni lo uno ni lo otro.
**Consecuencias:** Un período nuevo en los rankings (el diseño decía `dAAAA-MM-DD`; el PR 3 lo
hizo `d<n>`, el número del día desde 1970, como `d20731`), un historial por jugador con
reglas de "una vez por día", y cada juego solitario acepta `?hoy` (la página calcula la fecha, el
juego y la semilla, así que el link no lleva la fecha ni deja elegir el tablero; el diseño decía
`?dia=`, y el PR 1 lo cambió). Los avisos de "vuelve a jugar"
siguen fuera (D-221): estos solo salen si el jugador los pidió, y se calman solos si no los usa.
Es un diseño aprobado que se planeó en cinco PR y se construyó en ocho, los siete primeros detrás del
laboratorio (`UNO_AL_DIA_EN_LABS`), según "Por partes" de [UNO-AL-DIA.md](UNO-AL-DIA.md).
Con menos de 9 juegos en el mazo, la espera para repetir uno es de dos días menos que los que hay
(con los 7 del PR 1, cinco días), porque 7 días con 7 juegos repetía el mismo orden cada semana.
El acceso iba en la misma fila que Juego al azar, a su derecha (el dueño, 2026-10-05); desde D-239
va en una tarjeta junto a La Copa, y el botón queda como alternativa en `/labs/` y con `?uad=boton`. El PR 1 (el núcleo, los 7
solitarios, todo en el celular) llegó en v0.115.0. El PR 2 (v0.116.0) sumó El Ahorcado, Batalla
Naval y Dudo desde el mazo del 12 de octubre (con 10 juegos, la espera vuelve a ser de 7 días):
`?hoy` abre directo su modo para uno, y la palabra, la flota del celular y los dados de cada ronda
salen de la semilla del día (`azarDel`). Son partidas locales, así que no adelantan secretos: en una
sala se sigue tirando con el azar del navegador (D-70, C-10). Perdiendo en Batalla Naval cuentan las
casillas acertadas, no los barcos hundidos como decía el diseño, topadas en 39 para que perder
valga siempre menos que ganar. El PR 3 (v0.117.0) suma el jugador: la
historia en `unoAlDia/<jid>/<n>`, los rankings `uno-al-dia/d<n>`, `uno-al-dia/s<semana>` y
`uno-al-dia-racha/siempre`, los comodines (no se guardan: salen de recorrer la historia, uno cada 7
días seguidos, tope 2) y las invitaciones (`today/?inv=<jid>`, `invitados/<jid>/<uid>`, un comodín
para quien invitó). Las reglas exigen que el puntaje del día sea el de la historia y que la semana
sume cada día una sola vez, pero **no pueden revisar** que el número del día sea el de hoy (no
convierten texto en número para compararlo con la hora del servidor) ni la mejor racha, que calcula
el celular: un tramposo podría inflar su racha o anotar otro día. Se aceptó en el
laboratorio (y el PR 6 lo dejó así); si molesta, el workflow de los avisos puede recalcular las rachas desde la historia.
Al entrar, los días viejos del celular suben solo a la historia, sin sus rankings.
Detalle en "Lo que el PR 3 hizo" de [UNO-AL-DIA.md](UNO-AL-DIA.md). El PR 4 (v0.118.0) suma los avisos: cada celular
guarda lo que pidió y su último día y racha en `pushDia/<subId>`, y `tools/push/daily.mjs` los
decide dentro de la vuelta de `notify.mjs` (lo mandado, en `pushEnviadosDia`); abren
`today/?aviso=uad<tipo>` y se cuentan en el panel como `uaddia`, `uadracha`, `uadsemana` y
`uadadios` (sin guion: las reglas de las señales piden solo letras). Quedó distinto del diseño: no se juntan con los de La Copa en un solo aviso (cada uno
lleva su tope de 2 al día), y el de la semana dice solo cuántos días jugó, sin puesto ni "donde más
mejoraste". Además, el globo del ícono (`setAppBadge`) y "Agregar al calendario" (un `.ics` con un
evento diario). Detalle en "Lo que el PR 4 hizo" de [UNO-AL-DIA.md](UNO-AL-DIA.md). El PR 5
(v0.119.0) suma el panel: los 10 juegos cuentan el de hoy con un modo propio (`uno-al-dia`,
`MODO_UNO_AL_DIA` en games.js) y `#/juegos` trae el bloque "📅 Uno al día" (partidas de todos y, de
quienes entraron con jugador, la vuelta al día siguiente y a los 7 días, las rachas por tramo y las
invitaciones aceptadas), para lo que las reglas dejan al dueño leer `unoAlDia/` e `invitados/`
enteros. Uno al día siguió en el laboratorio hasta v0.121.0 (abajo). Detalle en "Lo que
el PR 5 hizo" de [UNO-AL-DIA.md](UNO-AL-DIA.md) y en [PANEL.md](PANEL.md). El PR 6 (v0.120.0) trae
lo que el dueño decidió el 2026-10-06 (decisiones 11 a 13 de [UNO-AL-DIA.md](UNO-AL-DIA.md)): El
Ahorcado, Batalla Naval y Dudo jugados con `?hoy` ya no muestran la revancha (dilema #226), porque
la tarjeta ofrece 🎲 Jugar otro y Repetir el de hoy; bajo el resultado de los solitarios queda solo
el ranking de Uno al día (el del juego no se muestra, aunque el primer intento igual entra a él);
"Agregar al calendario" pasa a **⏰ Agregar recordatorio**, con una línea que dice que es un
recordatorio en el calendario del celular, porque se confundía con el calendario de `/today/`. Que
un tramposo pueda inflar su mejor racha no importa por ahora; sí medir el uso: cada acción suma uno
a `stats/<env>/days/<día>/uad/<evento>` (`EVENTOS_UAD` y `trackUnoAlDia` en `stats.js`, sin decir
quién; una regla nueva en `database.rules.json` acepta solo subir de a uno), y el bloque "📅 Uno al
día" del panel lo muestra en "Qué se hace" y "Avisos y recordatorio" (desde v0.120.2, "Avisos"), con las vistas de `/today/` y
las visitas que entraron por ahí. En v0.120.1 (dilema #230, decisión 14), con los avisos activos
`/today/` ya no ofrece "⏰ Agregar recordatorio": repetiría el aviso. El mismo día (v0.120.2) el dueño lo dejó más simple: **el recordatorio es el aviso diario de la app**, programado a la hora elegida, y el del calendario (el `.ics`) se sacó entero; la señal `recordatorio` también.
**Sale del laboratorio en v0.121.0** (decisión del dueño, 2026-10-06; decisión 16 de [UNO-AL-DIA.md](UNO-AL-DIA.md)): `UNO_AL_DIA_EN_LABS = false`, así que el botón de la portada, `/today/`, los rankings y los avisos son para todos, y en `/labs/` queda solo probar la otra forma del acceso (la tarjeta junto a La Copa). **El n.° 1 pasó al 6 de octubre de 2026**, el día en que se abrió (`LANZAMIENTO`): el mazo es el mismo corrido un día, así que El Ahorcado, Batalla Naval y Dudo entran desde el mazo del 13 de octubre, no del 12. Desde ahí `LANZAMIENTO` queda fijo: moverlo cambiaría el juego de días ya jugados.

## D-231 · El selector de idioma lleva las banderas siempre
**Fecha:** 2026-10-05 · **Estado:** corregida por D-244 · **Relación:** corrige la nota de `base.css` de D-191 (en un celular angosto se escondía la bandera)
**Decisión:** Pedido del dueño: todos los selectores de idioma llevan sus banderas, y queda un
estándar de diseño para el widget (C-3). En un celular de hasta 440 px, con cuatro idiomas, el
toggle escondía las banderas para no empujar el sonido y compartir fuera de la barra de arriba:
así, en el celular, que es donde más se juega, nunca se veían.
- La bandera ya no se esconde: en una pantalla angosta sube **encima** del código, y el toggle
  queda del ancho que tenía con el código solo (unos 180 px). En una pantalla ancha va al lado.
- Las banderas y los nombres de cada idioma salen de `BANDERAS` y `NOMBRES_IDIOMA` en `i18n.js`,
  y la prueba de paridad exige uno por idioma de `IDIOMAS`.
- Cada botón dice su idioma en su idioma (`aria-label`, `title`, `lang`): la bandera es decorativa.
**Por qué:** La bandera se reconoce antes que el código, sobre todo para quien no lee español.
Apilarla mantiene el ancho y los 44 px de alto (C-8), así que la barra no cambia.
**Consecuencias:** Las banderas son emoji, no imágenes SVG, por decisión del dueño: en Windows se
ven como dos letras (ES, GB…; CL hasta D-244) y se acepta, porque la app se juega en celulares. Hay un solo toggle en la app: el estándar queda en C-3.

## D-232 · Un globo en la portada invita a agregar la app a inicio (primero en el laboratorio; para todos desde v0.121.0)
**Fecha:** 2026-10-05 · **Estado:** corregida por D-262 · **Relación:** completa D-221; reusa la hoja de pasos de D-223
**Decisión:** La portada muestra, a los 2,5 segundos, un globo abajo con el ícono de la app,
**"Juegos de Salón como app"**, una línea y el botón **Agregar**, que abre los pasos de ese
celular en la hoja de abajo de los avisos (D-223).
- **Los pasos dependen del celular** (`pasosDe` en `assets/js/instalar.js`): Safari y Chrome en
  iPhone (Compartir → Agregar a inicio → Agregar), Chrome en Android (menú ⋮ → Agregar a la
  pantalla principal o Instalar app → Instalar) y Samsung Internet (menú ☰). Dentro de WhatsApp,
  Instagram u otra app no se puede agregar: la hoja pide abrir el link de la portada en Safari o en
  Chrome, con un botón para copiarlo. En el computador, en Firefox o Edge del iPhone y en la app ya
  instalada, el globo no sale.
- **En Android, si Chrome ofrece su propio diálogo de instalar** (`beforeinstallprompt`), "Agregar"
  abre ese diálogo en vez de los pasos.
- **La ✕ lo apaga para siempre** en ese navegador (`juegos-de-salon:instalar:no`), igual que
  "Ya la agregué" o instalar la app desde el diálogo de Chrome.
- **La hoja de abajo pasa a `base.css`**: la usan los avisos de La Copa y el globo, con el mismo
  diseño. Los pasos del iPhone dicen lo mismo que los de los avisos (U-5).
- **Detrás del laboratorio** (`INSTALAR_EN_LABS`), como los avisos (D-223): se ve en el sitio local
  y en los celulares que lo activan en `/labs/`, donde también se puede volver a mostrar después
  de cerrarlo.
**Por qué:** Lo pidió el dueño: que la portada promocione agregar la app, con un llamado simple y
después instrucciones claras para Safari y Chrome en iPhone y Android, que se pueda cerrar y no
vuelva. La app instalada (D-221) es la que recibe los avisos en iPhone y se abre de un toque.
**Consecuencias:** Para abrirlo a todos basta `INSTALAR_EN_LABS = false`. Los nombres de los menús
de cada navegador cambian con sus versiones: si un paso deja de calzar, se corrige en
`COMMON[lang].ins` (i18n.js). Lo prueban `instalar.test.mjs` y `tools/e2e/install-prompt.mjs` (cada
celular, la ✕, el diálogo de Chrome y los cuatro idiomas a 320 px); en iPhones y Android reales se
prueba a mano desde `/labs/`. **Sale del laboratorio en v0.121.0** (decisión del dueño, 2026-10-06): `INSTALAR_EN_LABS = false`, así que el globo sale en la portada de todos los celulares donde se puede agregar la app; en `/labs/` queda solo el botón para volver a mostrarlo después de cerrarlo con la ✕.

## D-233 · Los avisos se miden en el panel: mandados, tocados, la app instalada y la última vuelta
**Fecha:** 2026-10-05 · **Estado:** corregida por D-266 · **Relación:** completa D-224 y D-228; el PR 4 de [PWA-NOTIFICACIONES.md](PWA-NOTIFICACIONES.md); señales como D-44 y D-208
**Decisión:** El panel (`#/torneo`) suma el bloque "🔔 Avisos al celular". Lo que lo alimenta:
- **Tocados:** la dirección de cada aviso lleva `&aviso=<tipo>` (`dia`, `plazo`, `final`, `fin`,
  `insc`, `copas`, `prueba`). La página lo cuenta al abrirse en `stats/<env>/days/<día>/aviso/<tipo>`,
  sea o no la primera de la visita, y lo saca de la dirección: recargar o volver no lo suma de nuevo.
- **La app instalada:** el `start_url` de los cuatro manifests pasa a `./?pwa` (el `id` no cambia:
  sigue siendo la misma app). Se cuenta en `pwa/<sistema>` (`android`, `ios`, `otro`) y sale de la
  dirección igual.
- **Mandados:** `notify.mjs` suma los entregados de cada vuelta por día y tipo en
  `stats/prod/days/<día>/mandados/<tipo>` (`pushEnviados` se limpia a la semana) y deja en
  `stats/prod/push` la hora de la vuelta, las suscripciones vivas y las copas con avisos. `--prueba`
  suma en `mandados/prueba`; `--simular` no escribe nada.
- **Reglas:** `aviso` y `pwa` aceptan solo subir en uno, con la clave validada por forma (C-16); `mandados` y
  `push` no los escribe ningún celular (la cuenta de servicio no pasa por las reglas).
**Por qué:** Lo pidió el dueño (la fase 4 del plan): saber si los avisos traen gente de vuelta y
notar a tiempo si GitHub apagó el workflow programado, que no avisa.
**Consecuencias:** Las señales nuevas son contadores, como el tráfico (D-208): no identifican a nadie.
El embudo de la campana (se ofreció → Avisarme → permiso) no se mide todavía. Una suscripción que
deja de existir sin que el servicio lo diga sigue contando como viva hasta que un envío falle.

## D-234 · "Tus copas" marca las terminadas y las esconde tras un interruptor
**Fecha:** 2026-10-06 · **Estado:** corregida por D-336 · **Relación:** amplía D-220
**Decisión:** En la lista "Tus copas" de la portada de La Copa, una copa cuyo `fin` ya pasó lleva
la etiqueta **Terminó** (el texto `mineOver`, que no se usaba) y un fondo más apagado. Las
terminadas no se ven de entrada: si hay alguna, al pie de la lista va el interruptor **Mostrar
copas terminadas (n)**, que parte apagado cada vez que se abre la portada (no se recuerda). Si
todas terminaron, la lista dice "No tienes copas en curso." sobre el interruptor. Siguen en la lista hasta
una semana después de terminar, como antes.
**Por qué:** El dueño, con su jugador, veía las copas terminadas igual que las en curso y no
distinguía cuáles quedaban por jugar.
**Consecuencias:** `tools/e2e/cup/player-cups.mjs` prueba que el interruptor parte apagado,
que esconde la terminada y que al prenderlo aparece con su etiqueta. Una copa del celular cerrada
antes de tiempo se marca al llegar a su `fin` planeado: el celular guarda `meta.end`.

## D-235 · Del dado al juego, con fundido y sin corte
**Fecha:** 2026-10-05 · **Estado:** reemplazada por D-237 · **Relación:** completa D-188
**Decisión:** Cuando el dado de Juego al azar abre el juego (a los 1,3 s de caer, o al tocar), ya
no corta de golpe a la otra página:
- **Al irse** (0,42 s), el dado se achica y se desvanece con su nombre, y la capa oscura toma el
  fondo de la app (`--fondo` en `base.css`, el mismo del `body`).
- **Al llegar**, el juego aparece con un fundido de 0,45 s sobre ese mismo fondo. El dado deja la
  marca `azar-llega` en `sessionStorage`; `assets/js/llegada.js`, que trae `instalable.js` (lo
  cargan todas las páginas en el `<head>`), la borra y pone `.azar-llega` en `<html>` antes de que
  el juego dibuje. La clase se quita poco después de cargar: lo que el juego dibuje luego aparece
  como siempre. Entrar a un juego por su tarjeta no cambia.
- El juego se pide (`<link rel="prefetch">`) mientras el dado rueda, para que no quede esperando.
- Con "reducir movimiento" se va al juego sin la salida, como antes.
**Por qué:** lo pidió el dueño: el paso del dado al juego era brusco. La capa del dado es casi
negra y el juego trae un fondo más claro, así que el corte se notaba aunque cargara rápido.
Se descartaron las *view transitions* entre documentos: Firefox no las tiene y habría que
apagarlas a mano en cada otra navegación del sitio.
**Consecuencias:** abrir el juego tarda 0,42 s más. Si `sessionStorage` no está disponible, el
juego aparece sin fundido.

## D-236 · Cambiar el PIN va en "Juegas como", no en los rankings
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige "tu jugador" de D-219; amplía D-212
**Decisión:** El panel plegado "👤 Tu jugador" de `/records/` mezclaba las partidas de cada juego con un
campo "PIN nuevo" sin explicación. Se separa:
- **En Records queda "👤 Tus partidas"**, abierta, con una fila por juego. Sin jugador o sin
  partidas no sale.
- **Lo de la cuenta va en "Juegas como 🇨🇱 Javi"** (`bloqueJugador`, el mismo en Records, La Copa
  y los juegos): al tocarlo se despliegan una línea que dice para qué sirve el PIN y que cambiarlo
  saca a los otros celulares, el campo "PIN nuevo", el botón **Cambiar el PIN** y **Salir**.
- `jugador()` guarda la promesa y no el jugador: dos piezas que lo pedían mientras cargaba
  recibían jugadores distintos, y lo que una escuchaba (entrar, salir) no le llegaba a la otra.
  Con el cambio de arriba, "Salir" dejó de redibujar "Juegas como" en Records.
**Por qué:** El dueño lo encontró confuso: Records es una vista de récords, no de administración
de cuenta.
**Consecuencias:** "Salir" pasa a estar a un toque más, dentro del nombre. Cambiar el PIN se puede
desde cualquier página que muestre "Juegas como", no solo desde Records.

## D-237 · Del dado al juego sin pantalla vacía: el juego abre con el mismo dado encima
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** reemplaza a D-235; completa D-188 y D-230
**Decisión:** El dado de Juego al azar (y el de Uno al día) no se borra antes de abrir el juego:
- **Al irse**, el menú guarda la escena del dado en `sessionStorage` (`azar-llega`: una foto del
  lienzo leída en el mismo momento en que se dibuja, el emoji y, si ya cayó, "¡Te tocó!" con el
  nombre) y navega de inmediato. El navegador sigue mostrando el dado hasta que la página del juego
  pinta.
- **Al llegar**, `assets/js/llegada.js` (lo trae `instalable.js`, en el `<head>` de cada página)
  pone encima la misma escena, quieta (`.azar-capa.velo` en `base.css`, donde ahora vive toda la
  capa del dado). El cambio de página no se ve.
- La escena **espera a que el juego dibuje su pantalla** (una `.screen.active` que no sea
  `#screen-espera`, la de "cargando"), con un tope de 4 s, y recién ahí se desvanece en 0,45 s
  mientras el dado se achica. Debajo ya está el juego, entero.
- El juego se sigue pidiendo (`prefetch`) mientras el dado rueda.
**Por qué:** lo pidió el dueño: con D-235 quedaba un momento de pantalla vacía entre el dado y el
juego, porque el dado se desvanecía antes de navegar y el juego aparecía desde cero mientras
cargaba. Se probaron y descartaron:
- **Las *view transitions* entre páginas:** el dado de WebGL no salía en la imagen que el navegador
  guarda de la página vieja, y la nueva se capturaba antes de que el juego dibujara con su JS.
  Además, Firefox no las tiene.
- **El *prerender* del juego:** la escena tendría que aparecer encima de una página ya pintada, y
  se vería un destello.
**Consecuencias:** sin pantalla vacía en ningún navegador, aunque la red sea lenta: mientras carga,
se ve el dado. Abrir el juego ya no suma los 0,42 s de D-235. Si `sessionStorage` no está
disponible, el juego abre como antes de D-235. Una página de juego nueva que no use `.screen.active`
deja el dado encima hasta 4 s.

## D-238 · Juegos favoritos en la portada, con su propio filtro
**Fecha:** 2026-10-06 · **Estado:** corregida por D-241 · **Relación:** completa D-142 y D-149; respeta D-144; D-241 cambia dónde va la ficha ⭐ Favoritos
**Decisión:** cada tarjeta de la portada lleva una ☆ en la esquina de arriba. Al tocarla, el juego
queda marcado como favorito (⭐ amarilla) y no se abre; al tocarla otra vez, se desmarca.
- **El filtro** es una ficha "⭐ Favoritos" en su propia línea, arriba de los tipos (corregida
  por D-241: va primera en la fila de los tipos cuando cabe, y en su línea solo cuando no). Aparece
  recién con el primer favorito, así que a quien no usa la ⭐ no le cambia nada.
- **Funciona como un tipo más:** se elige uno o el otro, la cuenta dice "Se ven n de m" con "Ver
  todos" y va en la URL (`?type=favorites`). Un link así, en un celular sin favoritos, muestra
  todos sin avisar nada. El dado de Juego al azar (D-188) sale de las tarjetas que se ven, así
  que con Favoritos elegido sortea entre los favoritos.
- **Desmarcar estando en Favoritos** no saca la tarjeta de la vista: se puede volver a marcar.
  Si ya no queda ningún favorito, se ven todos y la ficha se va.
- **Dónde se guardan:** en el `localStorage` del navegador (`juegos-de-salon:favoritos`), por id
  de juego. Sin cuenta ni Firebase, en `public/assets/js/favoritos.js`.
- **Dónde va la ⭐:** al lado de la tarjeta y no adentro (`.game-slot`), porque un botón dentro de
  un link no se puede tocar sin abrir el juego. Cae sobre la columna de la ›, con 44 px de toque
  (C-8), y no tapa el texto.
- **La Copa no lleva ⭐:** es una semana con amigos, no una partida que se elige.
**Por qué:** lo pidió un amigo (#233). La portada ofrece 15 juegos y quien vuelve juega casi
siempre los mismos dos o tres. Los tipos agrupan por género, no por gusto.
**Alternativas descartadas:**
- **Una quinta ficha en la fila de tipos:** cinco fichas no caben en una fila ni a 375 px, en
  ningún idioma, y desde D-149 los tipos van en una sola fila (D-144).
- **La ficha con la ⭐ sola, sin el nombre:** tampoco cabía a 320 px. (D-241 retoma las dos: la ficha entra
  primera en la fila cuando cabe, con su nombre o con la ⭐ sola y menos aire, y se mide en la página.)
- **Ordenar los favoritos primero, sin filtro:** el pedido era un filtro, y reordenar movería las
  tarjetas de lugar cada vez que alguien marca una.
- **Guardarlos con el jugador (D-212), para que lo sigan entre celulares:** queda para después.
  El `localStorage` alcanza, y no obliga a tener nombre y PIN.
**Consecuencias:** con un favorito marcado, los filtros ocupan una línea más, también cuando van
pegados arriba (D-196; desde D-241, solo donde la ficha no cabe en la fila de los tipos). `tools/e2e/favorites.mjs` lo prueba de punta a punta. Su chequeo a 320 px
encontró que la portada ya se corría de lado en alemán en el Chrome de Linux, que no sabe partir
"Galgenmännchen": la columna de `.games` crecía hasta la palabra entera. Ahora la columna no pasa
del ancho de la pantalla (`minmax(0, 1fr)`) y el nombre se parte aunque falte el diccionario.

## D-239 · La Copa y Uno al día, mitad y mitad en la portada
**Fecha:** 2026-10-06 · **Estado:** corregida por D-266 · **Relación:** corrige D-230 (dónde va el acceso a Uno al día)
**Decisión:** En la portada, Uno al día deja de ser un botón al lado de Juego al azar y pasa a una
tarjeta de media fila junto a La Copa: los dos son accesos de más jerarquía que los juegos, en una
fila de dos tarjetas (`.fila-alta`, `.game-card.alta`).
- **El emoji va a la izquierda del título**, en 40 px; la bajada y las píldoras ocupan todo el
  ancho. Cada tarjeta mide unos 160 px de alto, casi 90 menos que con el emoji arriba.
- **Jugadores y duración, en una línea**: en media fila, "👥 2–10 jugadores" no cabía al lado de
  "⏱ 7 días" (179 px pedidos en 138, a 375 px). La tarjeta alta muestra "👥 2–10": la palabra
  queda escondida a la vista (`.unidad`), pero el lector de pantalla la sigue leyendo. La tarjeta
  ancha de los juegos la sigue mostrando.
- **Los títulos van en color**, para distinguirlos de los juegos, que van en blanco: La Copa en un
  degradé dorado (el de su borde) y Uno al día en uno celeste (el de su tarjeta ya jugada). El de
  La Copa se ve así también en su tarjeta ancha.
- Con la tarjeta, el dado vuelve a decir **🎲 Juego al azar**. El botón al lado del dado, con
  "🎲 Al azar", queda para probarlo desde `/labs/` ("Al lado del dado") o con `?uad=boton`.
**Por qué:** lo eligió el dueño mirando las dos formas en un celular: la tarjeta le da a Uno al día
el mismo peso que a La Copa. Se probó con el emoji arriba, como los juegos, y el emoji a la
izquierda ganó porque ahorra alto sin achicar el texto.
**Consecuencias:** `formaAcceso()` devuelve `'tarjeta'` por defecto; el laboratorio guarda
`'boton'` si alguien elige la otra. `tools/e2e/daily.mjs` mira la fila, las píldoras en una
línea a 320 px en los cuatro idiomas y la forma de `/labs/`.

## D-240 · La portada tiene su canon: C-17
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** junta lo vigente de D-142, D-144, D-149, D-170, D-188, D-196, D-198, D-214, D-217, D-226, D-232, D-238 y D-239
**Decisión:** las reglas de la portada pasan a un canon, C-17 en [CANONES.md](CANONES.md): qué
se ofrece y en qué orden, los accesos de arriba, los filtros (tipo y ⭐ Favoritos), la URL, la
barra pegada, la fila de tipos, el ancho de 320 px, que dentro de una tarjeta no haya nada
tocable, la barra de arriba y cómo se prueba. No cambia nada de la app. De Uno al día, C-17 dice
dónde va y cómo es su tarjeta (D-239); el resto sigue en [UNO-AL-DIA.md](UNO-AL-DIA.md).
**Por qué:** lo pidió el dueño. Hasta ahora la portada solo existía en decisiones que se
corregían unas a otras: para saber cómo funcionaba había que leer seis y descartar lo que ya no
valía. En D-238 eso hizo que se citara D-144 como vigente cuando D-149 ya lo había corregido.
**Consecuencias:** un PR que cambia la portada edita C-17 en el mismo PR (como cualquier canon), y
la lista de chequeo de un juego nuevo pide que entre bien a la portada.

## D-241 · ⭐ Favoritos entra en la fila de los tipos cuando cabe
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige D-238 (dónde va la ficha); respeta D-144
**Decisión:** La ficha ⭐ Favoritos va primera en la fila de los tipos y ya no en una línea propia,
siempre que quepa. `acomodarFav` (portada) prueba tres formas, de la más completa a la más corta, y
deja la primera con la que la fila no se desborda:
1. **En la fila, con su nombre**, como las otras fichas.
2. **En la fila, con la ⭐ sola** (44 px, el nombre en el `aria-label`) y un poco menos de aire
   entre las fichas y dentro de ellas (`.tipos.apretada`: 4 px entre fichas, 3 px adentro).
3. **En su línea, arriba de los tipos**, como en D-238.
Se vuelve a medir al marcar o desmarcar el primer favorito, cuando cambia el ancho (girar el
celular) y cuando cargan las fuentes.
**Por qué:** lo pidió el dueño: la línea de más empujaba los juegos hacia abajo. Medido: con la ⭐
sola y menos aire, la fila cabe desde 360 px en los cuatro idiomas, y desde 430 px va con su
nombre (en inglés, desde 375). A 320 px solo cabe en inglés. Los celulares de hoy miden de 360 a
430 px, así que casi siempre cabe.
**Alternativas descartadas:**
- **La ⭐ siempre en la fila:** a 320 px y en algunos idiomas a 360 px, la fila se sale de la
  pantalla (C-8).
- **Fijar un ancho desde el que entra:** el largo de los tipos cambia con el idioma y con las fuentes
  de cada celular (en el Chrome de Linux, otras medidas). Medir en el momento no se equivoca.
- **La ⭐ al lado de Juego al azar:** cabía siempre, pero no quedaba pegada arriba con los filtros
  al bajar (D-196) y juntaba un botón que hace algo con uno que filtra.
**Consecuencias:** `tools/e2e/favorites.mjs` mira dónde va a 320, 390 y 900 px en los cuatro
idiomas, que la fila de tipos siga en una línea y que nada se salga.

## D-242 · El botón de compartir de la portada usa el ícono de los sistemas operativos
**Fecha:** 2026-10-06 · **Estado:** corregida por D-243 · **Relación:** completa D-226 (el botón que comparte la app); D-243 le da color
**Decisión:** El botón redondo de compartir de la barra de arriba (`shareButton` en
`public/assets/js/ui.js`, que hoy usa solo la portada) deja el emoji 📤 y muestra el ícono de
compartir de los sistemas operativos: una caja abierta con una flecha hacia arriba, dibujada en SVG
con `currentColor`. Al copiar, el ✅ de dos segundos sigue igual.
**Por qué:** lo pidió el dueño. El 📤 se dibuja distinto en cada celular y en Android parece una
bandeja de salida, no "compartir"; la flecha que sale de la caja es la que la gente ya reconoce.
**Alternativas descartadas:**
- **Los tres puntos unidos de Android:** en un iPhone no se lee como compartir, y la flecha sí se
  entiende en los dos.
- **Cambiar también el 📤 de los botones con texto** ("📤 Compartir link"): ahí el texto ya dice la
  acción y el emoji al inicio sigue U-2; el pedido era el botón redondo, que no tiene texto.
**Consecuencias:** el 📤 queda en los botones con texto de los juegos y de La Copa.
`tools/e2e/share-home.mjs` sigue mirando que el botón diga ✅ al copiar.

## D-243 · El ícono de compartir va en los colores de la página
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige D-242 (el color del ícono)
**Decisión:** El ícono de compartir de la portada (D-242) deja el blanco del texto: la caja va en
celeste (`--cyan`) y la flecha en rosado (`--pink`), cada una con un degradé de claro a su color y,
debajo, una copia más oscura corrida 1,6 px, como la sombra de abajo de los botones de la página
(`.btn--cyan`, `.btn--pink`). Mide 26 px dentro del botón de 44.
**Por qué:** lo pidió el dueño: en blanco se veía monocromático al lado de 🔊 y 🏆, que son emojis a
color, y del resto de la portada.
**Alternativas descartadas:**
- **Con un borde oscuro alrededor:** se veía pesado y más chico a 26 px.
- **La flecha amarilla:** se confundía con el 🏆 de al lado; la rosada lo separa y repite el par
  celeste y rosado de la portada.
**Consecuencias:** el degradé usa ids fijos (`icono-compartir-caja`, `icono-compartir-flecha`):
el botón va una sola vez por página. Si algún día va dos veces, cada copia necesita ids propios.


## D-244 · El español va con la bandera de España
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige D-231 (la bandera del español)
**Decisión:** Pedido del dueño, para estandarizar: en el selector de idioma, ES lleva 🇪🇸 en vez
de 🇨🇱 (`BANDERAS` en `i18n.js`). La bandera identifica el idioma, no el país de quien juega.
**Por qué:** 🇨🇱 hacía ver el español como el idioma de un país, al lado de 🇬🇧 EN y 🇩🇪 DE, que se
leen como idiomas. Para quien llega de afuera, 🇪🇸 dice "español" sin pensarlo.
**Consecuencias:** Solo cambia el selector. Las banderas de Chile que son contenido (la temática
Chile, el público 🇨🇱 de La Copa, la bandera del país junto al nombre en los rankings) siguen igual.
El portugués sigue con 🇧🇷: es el de Brasil (D-48).

## D-245 · El globo de ¿Dónde queda? espera a la imagen satelital
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige D-159 (qué se ve mientras baja la imagen)
**Decisión:** Con WebGL, mientras la imagen satelital no llega, el globo no se dibuja (ni el de la
portada ni el del juego): queda el fondo. Al llegar la de 2048 px aparece con un fundido de 0,3 s
(sin fundido con movimiento reducido, C-8). El mapa vectorial queda para cuando no hay WebGL,
cuando las dos imágenes fallan o cuando ninguna llegó a los 4 s (`esperando()` de `satelite()` en
`globo.js`); ahí la imagen lo reemplaza al llegar, como antes.
**Por qué:** lo pidió el dueño: al cargar la página se veía el globo dibujado, verde y azul, una
fracción de segundo antes de pasar al satelital, y se notaba como un salto.
**Alternativas descartadas:** dibujar solo el mar mientras tanto (sigue siendo un globo distinto
que cambia); precargar la imagen en el HTML (acorta la espera, pero no la quita).
**Consecuencias:** con una red lenta el globo tarda hasta 4 s en aparecer; las marcas y los
toques funcionan igual, porque no dependen del dibujo. El tope existe porque una red que cuelga el
pedido sin fallarlo dejaba el globo vacío mientras corre el reloj.

## D-246 · Generala: el juego de dados, con los dados en claro y la servida que gana
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** excepción a C-7 (la semilla) y C-10 (los secretos)
**Decisión:** Generala entra como juego de salón (`/generala/`, id `generala`, 📝), con la versión
latinoamericana de la planilla: Unos a Seises por la suma de la cara, Escalera 20, Full 30, Póker 40
(cinco más servidos), Generala 50 y Doble generala 100 (solo con la generala anotada con sus 50).
Once casillas, once turnos, gana quien suma más. La escalera acepta el as arriba (3-4-5-6-1).
**La generala servida gana la partida al tiro** con dos jugadores o más, como ajuste encendido por
defecto. Tres modos: un celular (2 a 6), varios celulares (2 a 6) y jugar solo con récord y tabla
`generala_solo`. En portugués se llama General; en alemán, Generala. **Los dados viajan en claro**:
quien tiene el turno los tira en su celular y los manda en `roll`, sin hash y sin semilla.
**Por qué:** lo pidió el dueño después de la investigación de candidatos (Impostor, Stop, Generala,
Dominós, Rebaño): es el que sirve en todos los modos, también sin coincidir (cada uno llena su
planilla), y reusa los dados de Dudo.
- **Los dados en claro:** en la mesa todos ven el cubilete, así que no hay nada que esconder (C-10).
  Sacarlos de la semilla compartida (C-7) sería peor: el código es público y con la semilla se
  pueden calcular los próximos tiros y elegir qué guardar sabiendo lo que viene. Que alguien se mande
  cinco seises modificando su página es como cargar un dado: se acepta entre amigos.
- **La servida que gana:** es la regla que más se juega en Chile y Argentina, y el momento que la
  mesa recuerda. Va como ajuste porque hay mesas que la juegan como 50 y nada más.
- **Sin rival de máquina:** no hay información oculta ni jugada contra otro; un rival que tira sus
  dados no agrega nada (C-5, D-27). Jugar solo con récord sí.
**Alternativas descartadas:**
- **Kniffel o Yahtzee:** son marcas (Schmidt, Hasbro) y otro juego (bono de 63, chance, otras
  casillas). El alemán usa el nombre Generala con casillas alemanas (Straße, Full House, Viererpasch).
- **Comprometer los dados con hash, como en Dudo (D-70):** no esconde nada que no se vea, y quien
  tira sigue eligiendo su azar.
- **Anotar un juego que no salió por su valor ("escalera de mentira"):** es una regla de casa poco
  común; se tacha.
**Consecuencias:** el emoji 📝 (la planilla) es propio porque 🎲 ya es Dudo. Las victorias van en
`generala_victorias` (D-215). Ver [docs/games/generala.md](games/generala.md).

## D-247 · Generala en Uno al día, desde el tercer mazo y con los dados de la semilla
**Fecha:** 2026-10-06 · **Estado:** corregida por D-248 · **Relación:** amplía D-230
**Decisión:** Generala entra al mazo de Uno al día el **23 de octubre de 2026**, el primer día del
tercer mazo. Con `?hoy` abre jugar solo y **sus dados salen de la semilla del día**:
`azarDel(semilla, 'generala:<turno>:<tiro>')`, consumido en orden de posición, así quien guarda lo
mismo que otro recibe lo mismo. El puntaje del día es un tercio del total, hasta 100
(`puntajeDia` de `engine.js`).
**Por qué:** un juego entra al mazo recién cuando se baraja el siguiente. Con una fecha anterior, el
segundo mazo (del 13 al 22) cambiaría según el día en que se fusione el PR, y ese mazo ya se puede
estar jugando. Con el 23, ningún día cambia aunque se fusione tarde (lo prueba
`uno-al-dia.test.mjs`). La semilla en jugar solo no adelanta nada a un rival, como en los solitarios
de La Copa (D-97). Un tercio del total, porque 300 ya es una partida excelente y el máximo es 360.
**Alternativas descartadas:** dados al azar en Uno al día (no sería el mismo desafío para todos);
puntaje por el total crudo (Uno al día compara de 0 a 100 entre juegos).
**Consecuencias:** desde el tercer mazo hay 11 juegos. Si el PR se fusionara después del 23, hay que
mover `DESDE_GENERALA` al primer día del mazo siguiente.

## D-248 · Generala se anuncia como "Próximamente" antes de abrirse
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige D-247 (cuándo entra a Uno al día)
**Decisión:** Generala se publica con `available: false`: la portada la muestra como las de Julepe,
con "Próximamente" junto al nombre, sin abrirla, fuera del dado de Juego al azar y de los favoritos
(C-17). La página `/generala/` funciona entera para quien tenga el link. **No entra todavía al mazo
de Uno al día**: `JUEGOS_DIA` queda como estaba, y al abrirla se suma con un `desde` que sea el
primer día de un mazo que no haya empezado (D-247). En la tabla del README, un juego fuera del menú
que nunca se publicó dice "🔜 coming soon" y no "⏸ paused", que es para el que se sacó (Julepe).
**Por qué:** lo pidió el dueño, para anunciar el juego antes de abrirlo (la imagen para compartir en
alemán dice "bald auf juegosdesalon.cl"). Sumarlo a Uno al día con la fecha fija del 23 de octubre
habría puesto en el mazo un juego que la portada todavía no ofrece.
**Consecuencias:** abrirlo es cambiar `available` a `true` en `games.js`, sumarlo a `JUEGOS_DIA` y
`GRUPO` con su fecha, y marcar GE-09 y GE-12 en REQUERIMIENTOS. El `?hoy` de `/generala/` ya está
hecho y probado en `engine.test.mjs`.

## D-249 · La invitación a entrar va arriba, como una tarjeta con su botón
**Fecha:** 2026-10-06 · **Estado:** vigente · **Relación:** corrige D-212 (dónde va entrar en la antesala; dilema #186)
**Decisión:** sin jugador, la invitación a entrar con nombre y PIN es una tarjeta con borde cian y
un botón "Entrar" a la vista (`bloqueJugador({ destacado: true })`), plegada en una sola fila. Va:
en la antesala de cada juego suelto, **justo bajo "Empezar" y "Volver al menú"** (arriba de las reglas, o
entre los dos, bajaba esos botones fuera de la pantalla en alemán en ¿Dónde queda? y ¿En qué año?, C-8); en el
resultado, bajo el puntaje (como antes, ahora destacada); en la tarjeta del resultado de Uno al día,
**antes de los botones** y sin esperar a lo demás de la red; y en `/today/`, bajo "Hoy" y antes de
la racha. En Uno al día la tarjeta lleva debajo del título "Guarda tu racha en cualquier celular…".
Con jugador, ahí sale "🏅 Juegas como Mica", y el ranking sigue al final.
**Por qué:** lo pidió el dueño. Mica jugó varios días sin entrar y no aparecía en ningún ranking: la
invitación quedaba al final de la antesala, bajo las reglas, y en Uno al día bajo todo lo demás, donde
nadie la veía. De 28 jugadores, 25 eran heredados de La Copa sin reclamar. Pegada a Empezar la ve
todo el que va a jugar, también en las antesalas largas, sin bajar el botón principal.
**Consecuencias:** quien aparezca en una pantalla nueva con ranking usa `destacado: true` junto a su botón principal; el
bloque sin destacar queda para `/records/` y el pie de los rankings.

## D-250 · Zip tiene diez niveles: con los diez son 100 puntos y se termina antes
**Fecha:** 2026-10-08 · **Estado:** vigente · **Relación:** corrige D-103 (Zip sin fin); iguala Zip a Desenredo (D-179)
**Decisión:** Zip deja de repetir el 7 × 7 sin fin: son **diez niveles** (`TAMANOS`, de 4 × 4 a
7 × 7) y quien los resuelve todos termina ahí, con **100 puntos**, sin esperar el reloj. Entre quienes
los resuelven todos, gana quien terminó antes; quien no alcanza suma 10 por nivel y, si empata en
niveles, gana quien resolvió su último nivel antes. El encabezado dice "Nivel 3 de 10" (el tamaño ya se ve en la grilla, y con él no cabía a 320 px) y el
final, "¡Resolviste los 10 niveles!". Es el formato que Desenredo ya tenía.
**Por qué:** lo pidió el dueño ("completarlos todos te da 100; si no, o si más de uno los completa,
entra el tiempo"). Además arregla un desempate al revés: con niveles sin fin, el puntaje topaba en
100 con diez, pero el desempate era la hora del **último** nivel resuelto, así que quien seguía
resolviendo el 11 a los 2:50 perdía contra quien había hecho diez a los 2:40 y no alcanzó otro.
**Alternativas descartadas:** sumar puntos por el tiempo que sobra (90 por los diez y hasta 10 por
rapidez): el tiempo ya decide el empate, y "10 por nivel" se explica en una línea, igual que en
Desenredo.
**Consecuencias:** `finPartida` de Zip termina también con `hechos >= NIVELES`, y la pantalla
retoma una partida terminada con los diez mostrando el último resuelto. El puntaje (`10 × hechos`)
y el dato de desempate (`ultimo`) no cambian de forma, así que las copas en curso siguen valiendo.

## D-251 · El vigía: lo que le falla a quien juega, en la sección Salud del panel
**Fecha:** 2026-10-09 · **Estado:** vigente · **Relación:** amplía D-44 y D-208 (una categoría de señal nueva); amplía D-207 (una sección más)
**Decisión:** Cada página que carga módulos (todas menos el panel y las puente) lleva en el `<head>`,
antes de las hojas de estilo, `public/assets/js/vigia.js`: un script clásico que anota por día y
entorno las cargas con fallas por tipo y página (`falla/<tipo>/<página>`: `arranque`, `recurso`,
`js`, `promesa` y `alguna`), cada error con su detalle (`err/<firma>`: tipo, mensaje, archivo y
línea, página, navegador y versión) y cuánto tardó cada página en arrancar (`listo/<página>/<tramo>`).
"Arrancó" lo avisa `trackVisit`; a los 20 s sin aviso, y con la pestaña a la vista todo el rato, la
carga cuenta como que no arrancó. El panel lo muestra en **🩺 Salud** (`#/salud`), con un punto
rosado en la navegación si hoy o ayer una página no arrancó.
**Por qué:** el sitio no tiene servidor ni build: un módulo que no llega, una sintaxis que un Safari
viejo no lee o un import roto dejan la página en blanco, y hasta hoy la única forma de saberlo era
que alguien lo contara por 🐞. Las señales de uso tampoco lo veían: una página que no arrancó no
manda ni su vista.
**Cómo se diseñó, y qué cambió al criticarlo:**
- *Primero, escuchar errores desde stats.js.* No sirve para el caso que más importa: si los módulos no
  cargan, stats.js tampoco. Por eso el vigía es un script clásico sin imports, escrito sin `?.`, `??`,
  `let` ni flechas, y repite la dirección de la base, el entorno y el día (una prueba exige que digan
  lo mismo que firebase-config.js, stats.js y cleanup.js).
- *Un script más bloquea la página.* Va antes de las hojas de estilo, que bloquean igual: se pide en
  paralelo con ellas y pesa unos 4 kB, así que no suma un viaje. `set-version.py` le pone `?v=` como a
  las hojas, porque el import map no alcanza a los scripts clásicos.
- *Contar cargas de nuevo duplicaba el tráfico.* Las cargas que arrancaron ya son `vistas/<página>`
  (D-208); el vigía solo suma las que no arrancaron, y el panel junta las dos. Salud no repite
  ninguna cifra de Tráfico: muestra tasas de falla sobre esas cargas.
- *Un error en un bucle inundaría la base.* Cada error se manda una vez por carga, como mucho diez
  por carga, y nada después de `pagehide` (lo que se corta al cerrar no es una falla). Se ignora lo
  que no es de la app: extensiones, "Script error." sin archivo, `ResizeObserver loop` y los fetch
  cancelados (`AbortError`).
- *El detalle y la cuenta en un mismo envío se perdían.* Las reglas dejan escribir el detalle una sola
  vez y un PATCH de varias rutas es atómico: el segundo celular con el mismo error se llevaba su
  cuenta en el rechazo. Van en dos envíos.
- *La firma por mensaje exacto partía un error en cien.* Los números del mensaje y la línea no
  separan; Chrome antepone "Uncaught" y Safari no, así que se quita. Sí separan la página y la familia
  del navegador, para que el panel diga dónde falla; el panel vuelve a juntar por tipo, mensaje y archivo.
- *Privacidad (D-44).* Ni IP, ni dirección completa: se cortan `?` y `#`, donde van los códigos de sala
  y de copa, también dentro del mensaje. Del navegador, solo familia y versión mayor (`chrome129`,
  `ios16`, `instagram`): en iOS todos son Safari por dentro y lo que importa es la versión del sistema.
  El mensaje se acota a 160 caracteres y solo lo lee el dueño.
- *Un error viejo no es una alarma.* Si la versión más nueva del rango (de los errores, las salas y
  las partidas sin red) no lo tuvo, sale en gris con "no se ve desde la X".
**Alternativas descartadas:** un servicio de errores de terceros (Sentry y parecidos): manda la IP y
el navegador entero a otro, y es una dependencia más para un sitio sin build. Un registro por error
con su hora, en vez de cuentas por día: crece sin tope y no responde mejor la pregunta ("¿qué falla,
dónde y cuánto?"). Medir LCP u otras métricas web: "cuánto tardó en poder jugar" es lo que siente
quien juega y sale de una sola resta.
**Consecuencias:** las reglas tienen tres categorías nuevas (`falla`, `listo`, `err`), que publica
`publish.yml` al fusionar. Un juego nuevo lleva la línea del vigía en su `index.html`: lo exige
`vigia.test.mjs`. `window.__vigia.fallas` dice lo que se mandó en esa carga, para las pruebas (C-14).

## D-252 · Ninguna copia de trabajo queda sin uso
**Fecha:** 2026-10-09 · **Estado:** vigente · **Relación:** corrige D-218 (qué copias borra el hook); completa D-135 y D-206
**Decisión:** Una copia de trabajo (worktree) vive mientras tiene trabajo en curso o un PR abierto.
La sesión que la crea la borra apenas sabe que no va a dar PR, y al terminar deja solo las copias
con PR abierto. `tools/agents/clean-worktrees.mjs`, que corre al empezar cada sesión, barre además:
- las **fusionadas**, como antes, ahora también las de la app (`.claude/worktrees/`);
- las **vacías**: sin commits propios ni cambios, creadas hace más de un día;
- las **abandonadas**: con commits fuera de `main`, sin PR abierto y sin moverse hace más de tres
  días. Antes de borrarlas sube su rama a GitHub (`origin/<rama>`); si no puede subirla, la deja.
Nunca toca la carpeta principal, la copia desde donde se corre, una con cambios sin commitear ni una
con PR abierto. Sin `gh` no sabe qué PR están abiertos y no da nada por abandonado.
**Por qué:** lo pidió el dueño. El hook de D-218 solo borraba las fusionadas, y se acumulaban: una
copia del 4 de octubre con trabajo que nunca llegó a PR (`tyf-puntaje-deduccion`), dos de la app
con su PR fusionado hace días y una creada para un dilema que ya estaba resuelto.
**Alternativas descartadas:** borrar las abandonadas sin subirlas (se pierde trabajo); solo
nombrarlas, como antes (se quedaban semanas).
**Consecuencias:** una rama abandonada se retoma con `git worktree add ../juegos-de-salon-<tema>
<rama>`. Una sesión de la app que vuelve a una copia ya fusionada la encuentra borrada.

## D-253 · Compartir, desde la portada, abre una hoja con el video
**Fecha:** 2026-10-09 · **Estado:** corregida por D-254 · **Relación:** completa D-226; usa la hoja de D-223 y D-232
**Decisión:** El botón de compartir de la portada ya no abre directo el menú del sistema: abre una
hoja con el video promocional en 16:9 y dos opciones.
- **El video** se ve primero como su miniatura con "▶ Ver el video"; al tocarlo se embebe desde
  `youtube-nocookie.com` (sin cookies hasta reproducir). Abrir la hoja no baja nada de YouTube.
- **Invitar a jugar** es lo de antes (D-226): el texto de la app y, en un celular, la tarjeta social
  del idioma, que se baja de antemano para que el menú se abra al tiro.
- **Compartir el video** manda un texto corto con el link de YouTube al final (U-30). El chat arma
  la vista previa con la miniatura del video. En inglés, portugués y alemán, el texto avisa que el
  video está en español.
- El video que se muestra es `TRAILER` en `public/assets/js/compartir-portada.js`: al subir una
  versión nueva al canal, se cambia ahí (lo dice "Para YouTube" en la memoria del video).
**Por qué:** lo pidió el dueño: que compartir muestre el trailer y deje mandar o la invitación o el
video como pieza publicitaria. Vio la propuesta (capturas en el PR #263) y aprobó las tres
decisiones: compartir el link y no el archivo, el video en un solo lugar del código, y que esas
visitas se cuenten en YouTube.
**Alternativas descartadas:** mandar el mp4 como archivo (son ~10 MB que el celular tendría que
bajar antes de abrir el menú, y Safari niega el menú si el toque quedó atrás); alojar el video en el
sitio (GitHub Pages no está hecho para servir video; YouTube ya lo sirve en la calidad de cada
pantalla).
**Consecuencias:** el link del video lleva a YouTube y no al sitio, así que esas visitas no se
marcan con `de=link` (D-208); se ven en las estadísticas de YouTube.

## D-254 · La hoja con el video, solo en el idioma del video
**Fecha:** 2026-10-09 · **Estado:** vigente · **Relación:** corrige D-253
**Decisión:** La hoja de compartir de la portada (D-253) sale solo en un idioma que tiene video
promocional: hoy, español. En inglés, portugués y alemán, el botón comparte directo el mensaje de la
app con su tarjeta, como antes (D-226). Los videos van por idioma en `TRAILERS`
(`public/assets/js/compartir-portada.js`): un video en otro idioma se suma como una entrada más, con
su miniatura, y la hoja aparece sola en ese idioma. Los textos de la hoja en inglés, portugués y
alemán quedan listos para ese momento, sin el aviso "en español".
**Por qué:** lo pidió el dueño al probarla: la hoja y el video están en español, y en otro idioma
basta el compartir de siempre hasta que haya versiones del video en otros idiomas.
**Alternativas descartadas:** mostrar el video en español con el aviso en los otros idiomas (lo de
D-253; no le sirve a quien no habla español).

## D-255 · La portada, de lo más jugado a lo menos
**Fecha:** 2026-10-09 · **Estado:** corregida por D-335, D-361 · **Relación:** cambia el orden de D-142 y D-149 (primero `GAMES`, después `SUELTOS`); corregida por D-335 (un juego nuevo va arriba mientras dice "Nuevo")
**Decisión:** Los juegos disponibles de la portada van ordenados por cuántas partidas se jugaron,
de más a menos, con los de `GAMES` y los de La Copa sueltos mezclados. El orden es una lista fija,
`POPULARIDAD` en `games.js`; los que vienen "Próximamente" siguen al final. La primera vuelta
cuenta las partidas de producción del 11 de septiembre al 9 de octubre de 2026 (todo lo que
guarda `stats/prod/days`): las de cada modo sin red, una por sala de dos celulares, las de cada
día de las copas (`torneos/<código>/results`) y las de Uno al día. La Copa va primera (209 días
de copa jugados); después Toque y Fama (87), Línea de Tiempo (84, con el día "Línea" de las
copas), Reinas (73), Tango (57), Ahorcado (54), Batalla Naval (47), ¿Dónde queda? (38), Letras
(33), Zip (30), Conexiones (29), Año (21), Dudo (15), Desenredo (12) y Cuarto Rey (2). Julepe (4) y
Generala (1) también están en la lista, aunque hoy van al final por "Próximamente".
**Por qué:** lo pidió el dueño: que lo que más se juega quede arriba.
**Alternativas descartadas:** ordenar en vivo con los datos de Firebase (la portada tendría que
leer la base antes de dibujarse, y el orden cambiaría solo de un día a otro).
**Consecuencias:** el orden no se actualiza solo: se rehace la cuenta y la lista cuando el dueño
lo pide. Un juego nuevo que no está en la lista va después de los que sí.

## D-256 · El caso: un prototipo de misterio en el laboratorio, solo en español
**Fecha:** 2026-10-09 · **Estado:** reemplazada por D-261, D-264, D-267 · **Relación:** excepción a C-3 (idiomas) y C-2 (estructura); ampliada por D-257 (la versión de La Copa); D-261 y D-264 corrigieron partes de sus reglas, y D-267 borró el prototipo
**Decisión:** Se prueba en `/labs/case/` un juego de deducción al estilo de *Clues by Sam*: veinte
sospechosos, pistas que siempre dicen la verdad, y nunca hay que adivinar. Solo en español y fuera de
`games.js`, para mostrárselo a amigos. Hay un caso del día (la semilla es la fecha) y casos con código
(`?c=`). Marcar a alguien que todavía no se puede deducir no se acepta ni cuenta como error, y no dice
si estaba bien. El puntaje son los errores; el tiempo desempata.
**Por qué:** lo pidió el dueño, después de la lista de candidatos de misterio y acertijos: es el que
más se parece a lo que ya funciona (un puzzle que sale de una semilla, como Reinas o Tango), cuesta
poco en idiomas (las pistas salen de plantillas) y no compite con nada de la app. Probarlo primero
con amigos dice si engancha antes de pagar los cuatro idiomas y La Copa.
**Alternativas descartadas:** hacerlo de una vez juego de La Copa (obliga a los cuatro idiomas y a
su puntaje de 0 a 100 antes de saber si gusta); contar como error el intento antes de tiempo (castiga
probar, y el original tampoco deja adivinar).
**Consecuencias:** no está en el menú ni en el README como juego; el laboratorio lo ofrece en su
propia sección. Si entra, pasa a `cup/games/` con su id y esta página se va. Ver
[docs/games/case.md](games/case.md).

## D-257 · El caso como juego de La Copa, en el laboratorio y en los cuatro idiomas
**Fecha:** 2026-10-09 · **Estado:** corregida por D-267 · **Relación:** amplía D-256
**Decisión:** El caso pasa a ser un juego de La Copa (`public/cup/games/case/`, id `caso`, 🔍): se
juega suelto en `/case/` (con `labs: true` en `SUELTOS`, así que tiene página y tarjeta pero no sale
en la portada) y en la práctica del laboratorio, pero **no entra a `POZO`** hasta que el dueño lo
saque del laboratorio: una copa todavía no lo puede elegir. Puntúa 100 con el caso resuelto, menos
10 por error, con mínimo 10, y 0 sin resolver; el tiempo desempata. Las pistas dejan de ser frases y
pasan a ser datos (`{ t, a, b, k, g, h }`); la frase la arma `texto()` en el idioma de quien juega
con las plantillas de `casoTexto` (es, en, pt, de), y quien habla de sí mismo lo hace en primera
persona. La antesala tiene una portada animada: cartas que se dan vuelta solas y una lupa que las
recorre. La pantalla repite la del prototipo (cartas que giran al empezar, zoom a la elegida,
sellos al marcar, la pista que ilumina a quiénes nombra).
**Por qué:** lo pidió el dueño mientras prueba el prototipo con amigos: tenerlo listo como juego de
La Copa para sumarlo apenas lo apruebe. Dejarlo fuera de `POZO` permite probarlo de punta a punta
(antesala, prueba, juego, desglose) sin que caiga en una copa de verdad.
**Alternativas descartadas:** traducir las frases ya armadas (no se puede: cada idioma arma la
oración distinto y en alemán el oficio cambia de caso); un puntaje por tiempo como Reinas (aquí lo
difícil es no equivocarse, no ir rápido).
**Consecuencias:** los nombres de los sospechosos son los mismos en todos los idiomas. Los oficios
van en singular masculino en la carta en alemán y portugués (Koch, criminoso) y conviene que alguien
que los hable los revise. El prototipo de `/labs/case/` sigue con su propio motor en español; cuando
El caso salga del laboratorio, esa página se va o pasa a usar este motor. Ver
[docs/games/cup.md](games/cup.md).

## D-258 · El reloj parte con la pantalla de juego a la vista, no con la cuenta
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** corrige D-105 (cuándo parte el reloj)
**Decisión:** En todos los juegos de La Copa (el día, la sesión de prueba, la práctica y los
juegos sueltos), el reloj parte cuando el "¡A jugar!" ya se fue de la pantalla, no cuando aparece.
El tablero se sigue armando debajo con el "¡A jugar!" (`cuentaRegresiva` se resuelve ahí y
devuelve cuánto falta para que la capa se vaya, `CUENTA_SALE_MS`), pero el reloj nace con ese
retraso. Un juego con animación de entrada la declara con `entrada()` en su registro, y el reloj
espera también eso: en El caso, lo que tardan las cartas en darse vuelta (unos 1.030 ms; 0 con
movimiento reducido).
**Por qué:** lo pidió el dueño: el tiempo de la cuenta no es tiempo de juego. Con D-105 el reloj
partía con el "¡A jugar!", y los 0,9 s que tarda en irse (más la vuelta de las cartas en El caso)
se contaban aunque todavía no se podía jugar.
**Alternativas descartadas:** armar el tablero recién cuando se fue la capa (se ve un instante la
pantalla vacía); que cada juego arranque su propio reloj (el reloj es de la cáscara, D-130).
**Consecuencias:** como `reloj.leer` no cuenta tiempo negativo, el reloj marca 0:00 hasta que
parte. Retomar una partida no cambia: el tablero vuelve de una y el reloj sigue donde estaba.

## D-259 · El caso, menos lineal: pistas que hay que combinar
**Fecha:** 2026-10-10 · **Estado:** corregida por D-263, D-264 · **Relación:** amplía D-257
**Decisión:** El generador de El caso elige las pistas para que haya que pensar más. Cada pista
candidata recibe una nota (`notaPista`): vale más la que destapa a alguien **solo combinada con las
pistas que ya se saben**, menos la que lo dice todo sola, y los tipos que piden razonar (más que,
tantos como, par o impar, al menos, a lo más) valen más que "hay exactamente N" en grupos chicos.
Si en un paso todo lo que se deduce sale de una sola pista, se busca otra pista para el último que
habló que obligue a combinar. Se suma un tipo nuevo: "Exactamente uno de Ana y Beto es criminal".
Se miran más candidatas (36, y 60 para destrabar), y cada caso sale en unos 65 ms.
**Por qué:** lo pidió el dueño: el caso era muy lineal, con deducciones simples. Medido en 40 casos,
el 88 % de las deducciones salía de una sola pista y el 65 % de las pistas eran "hay exactamente N".
Ahora, cerca de un tercio de las deducciones pide combinar pistas y "hay exactamente N" baja a
menos de un cuarto. Sigue sin haber que adivinar nunca.
**Alternativas descartadas:** dar menos pistas (el juego dejaría de garantizar que nunca hay que
adivinar); esconder lo que es quien habla (rompe la regla de que lo marcado se sabe).
**Consecuencias:** `juegos.test.mjs` frena un caso muy lineal (menos de 25 % de deducciones
combinadas) o con demasiadas pistas de "hay exactamente N" (más de 35 %). Las copas ya jugadas no
cambian (El caso todavía no está en `POZO`); el caso de una semilla dada sí cambia. **El prototipo de
`/labs/case/` usa el mismo motor** (su `engine.js` solo adapta el de La Copa al español), así que los dos
tienen la misma dificultad; lo guardado en el prototipo pasa a `juegos-de-salon:caso:v2:<semilla>`. **La
prueba de La Copa no es más fácil**: es un caso completo, y la antesala lo dice (`trialNoteFull`, con
`pruebaCompleta` en el registro). En una comparación, los dos grupos se iluminan en dos colores, amarillo
y rosado, y la frase los pinta igual (#282). "Tantos como" no sale con cero y cero.

## D-260 · El caso: condicionales, parejas y el más difícil de varios candidatos
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** amplía D-259
**Decisión:** El caso suma dos tipos de pista que solas no destapan a nadie y piden otro razonamiento:
**condicionales** ("Si Óscar es criminal, Rodrigo es inocente", con sus cuatro combinaciones) y
**parejas** ("Ana y Beto son los dos inocentes o los dos criminales"). Nunca nombran a quien habla ni a
alguien que ya se sabe. El generador arma **4 casos por semilla y se queda con el que más hace pensar**
(`dificultad`: jugado de punta a punta, suma por cada deducción que pide combinar pistas y resta por
cada paso con varias personas deducibles a la vez). Al repartir, prefiere pistas que todavía no
destapan a nadie, y si un paso destapa a muchos o todo sale de una sola pista, cambia la pista del
último que habló.
**Por qué:** el dueño lo sentía monótono aun después de D-259. Medido en 40 casos: las deducciones que
piden combinar pistas pasan de 51 % a 55 %, las personas deducibles por paso bajan de 1,66 a 1,50 y
una de cada siete pistas es condicional o pareja.
**Consecuencias:** un caso tarda unos 300 ms en armarse (antes 50 ms) y en un celular hasta un
segundo. Por eso el motor guarda lo armado por semilla, y la antesala de La Copa (el día y la práctica)
lo arma mientras se lee (`precalentar`, para los juegos que se marcan `caro` en el registro): tocar
Empezar o Probar primero no deja el botón trabado. `juegos.test.mjs` exige al menos 45 % de
deducciones combinadas. El caso de una semilla cambia (El caso todavía no está en `POZO`).

## D-261 · El caso: marcar antes de tiempo cuenta como error
**Fecha:** 2026-10-10 · **Estado:** corregida por D-263 · **Relación:** corrige D-256 (el intento antes de tiempo)
**Decisión:** En El caso (La Copa y el prototipo), marcar a alguien que todavía no se puede deducir
no se acepta y **cuenta como error** (resta 10, como equivocarse), sin decir si lo marcado estaba
bien. Se guarda como jugada `{ i, v, falta }` y la carta queda con ✕. El mensaje dice "Todavía no se
puede saber qué es Ana: cuenta como error.", y la regla de "Cómo se juega" lo explica.
**Por qué:** lo eligió el dueño: con D-256 el intento no costaba nada, y se podía tantear persona
por persona hasta dar con la que se deduce, sin pensar. Era lo que más hacía monótono el juego.
**Alternativas descartadas:** medio error (5 puntos), y dejarlo gratis.
**Consecuencias:** el puntaje premia estar seguro antes de marcar. `tools/e2e/case/lab.mjs` lo
prueba.

## D-262 · El laboratorio queda solo con lo que no ha salido
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** corrige D-101, D-110, D-197, D-230 y D-232
**Decisión:** `/labs/` ofrece solo lo que todavía no está en producción: hoy, El caso. Se van la
práctica de cada juego de La Copa, las diez demos, el botón de la Copa de 3 días, las secciones de
Uno al día y de Agregar a inicio, y el puente `/labs/de/`. Con ellas se van las puertas que ya
estaban abiertas para todos (`UNO_AL_DIA_EN_LABS`, `INSTALAR_EN_LABS`) y la forma del acceso a Uno
al día guardada en el celular: queda `?uad=boton|no` en el link. `?labs` en `/cup/` ya no ofrece la
Copa de 3 días; sigue con `?tres` y en el modo de prueba (D-100).
**Por qué:** lo pidió el dueño: lo que ya está en producción no se necesita en el laboratorio.
**Alternativas descartadas:** borrar también las demos. Siguen en el código, sin link, porque las
usan las pruebas de punta a punta (`cup/tournament.mjs`, `cup/notifications.mjs`, `lang-from-url.mjs`) y las
capturas del README (`?prueba&demo=<escena>`).
**Consecuencias:** `cup/tournament.mjs` (parte `laboratorio`) prueba que la página tenga solo El caso;
`daily.mjs` prueba el botón al lado del dado con `?uad=boton`. Un juego nuevo que se pruebe
antes de salir vuelve a tener su sección en `/labs/` y se saca al salir.

## D-263 · El caso: comparaciones sin grupos que se cruzan, y una ayuda que cuesta 15
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** corrige D-259 (las comparaciones) y D-261 (el puntaje)
**Decisión:** Las comparaciones ("hay más criminales en la columna C que en la fila 3") ya no hablan
de dos grupos que comparten a alguien. Y El caso (La Copa y el prototipo) suma **💡 Ayuda**: con un
segundo toque para confirmar, elige entre quienes ya se pueden deducir al que pide menos pistas, lo
deja elegido y dice cuáles juntar ("Mira a Pía: junta lo que dicen Bárbara y Nico."); esas pistas
se destacan en la lista hasta marcarlo. Resta 15, como la pista de Tango, se guarda como jugada
`{ ayuda: i }` y en la tarjeta su celda va en 🟨. Si se cierra el mensaje, "💡 Ver la ayuda" lo
vuelve a mostrar sin cobrar. Se llama "Ayuda" (en alemán, "Tipp") porque "pista" ya es lo que dice
cada sospechoso.
**Por qué:** lo propuso Claude y lo aprobó el dueño. Con D-261 un paso trabado ya no se podía
tantear, y la parte más confusa de los pasos difíciles era la persona que contaba en los dos lados
de una comparación. Sin cruces el caso sigue igual de difícil (57 % de las deducciones combinan
pistas, medido en 40 casos) y la ayuda evita quedarse atascado sin regalarle nada a quien no la usa.
**Alternativas descartadas:** una ayuda gratis; una que diga directamente qué es alguien.
**Consecuencias:** `juegos.test.mjs` prueba que la ayuda siempre señala a alguien deducible, que
las pistas que nombra alcanzan y que no quedan comparaciones con grupos cruzados;
`tools/e2e/case/lab.mjs`, el botón en el prototipo.

## D-264 · El caso: tocar una pista ilumina solo a quien nombra
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** corrige D-256 (lo que ilumina una pista) y D-259 (en una comparación, los dos colores
de la grilla quedan para quienes nombra, no para los dos grupos)
**Decisión:** Tocar una pista (La Copa y el prototipo) ya no ilumina a todo el grupo del que habla,
sino solo a las personas que nombra por su nombre: "Todos los que están a la izquierda de Omar son
criminales" ilumina a Omar; "Si Ana es criminal, Beto es inocente", a Ana y a Beto; "En la fila 2
hay tres criminales", a nadie. Quien la dice sigue en celeste. Lo calcula `sujetos()` del motor.
**Por qué:** lo pidió el dueño: ver a quiénes abarca el grupo es parte de pensar el caso, y la
grilla lo estaba haciendo por el jugador.
**Consecuencias:** `tools/e2e/case/lab.mjs` prueba que se ilumine exactamente a quienes nombra;
`juegos.test.mjs`, `sujetos()`.

## D-265 · El caso del laboratorio termina con un formulario para comentar
**Fecha:** 2026-10-10 · **Estado:** corregida por D-267 · **Relación:** amplía D-256; reusa el formulario de D-191 y el envío de D-104
**Decisión:** El final del prototipo de El caso (`/labs/case/`) suma, debajo de los botones, el
formulario "🐞 ¿Qué te pareció?", abierto en la página y no detrás de un botón. Es el mismo de los
comentarios del laboratorio del alemán, que pasa a ser `formularioComentario()` en `labs-idioma.js`
(la capa del 🐞 lo usa igual), y manda a `feedback/` el texto, el nombre opcional y el caso con sus
errores, ayudas y tiempo.
**Por qué:** lo pidió el dueño, para que los amigos que lo prueban comenten. Recién terminado es
cuando más se acuerdan de dónde se trabaron.
**Consecuencias:** se lee con `node tools/firebase/reports.mjs`. `tools/e2e/case/lab.mjs` lo
prueba con el envío interceptado, sin escribir en Firebase.

## D-266 · Las URL, en inglés: carpetas, parámetros y sus valores
**Fecha:** 2026-10-10 · **Estado:** corregida por D-316 · **Relación:** sigue a D-192 (las carpetas) y D-214 (`?type=`); corrige D-29, D-100, D-110, D-142, D-164, D-207, D-208, D-229, D-230, D-233 y D-239 (el nombre de sus parámetros)
**Decisión:** Todo lo que se ve en una dirección va en inglés: las carpetas (ya desde D-192), los
nombres de los parámetros y sus valores en palabras (C-18). Lo que la app escribe o genera (las
invitaciones, los links que se comparten, los avisos al celular, los de Uno al día, lo que deja en
la barra) usa siempre el nombre nuevo; los de antes se siguen leyendo, porque ya circulan por
WhatsApp, y al abrir la página `trackVisit()` los reescribe en inglés en la barra.

| Antes | Ahora | Qué es |
|---|---|---|
| `?sala=ABCD` | `?room=ABCD` | la invitación a una sala |
| `?semilla=K7Q2X` | `?seed=K7Q2X` | el contenido de una partida suelta |
| `/cup/?practica=reinas` | `/cup/?practice=queens` | un juego suelto desde el laboratorio |
| `?prueba` | `?test` | el almacén local, para los guiones |
| `?tres` | `?three` | ofrece La Copa de 3 días |
| `?hoy` | `?today` | Uno al día |
| `&dia=3` (La Copa), `?dia=AAAA-MM-DD` (El caso) | `&day=3`, `?day=AAAA-MM-DD` | el día que abre un aviso, el caso de esa fecha |
| `&silenciar` | `&mute` | el botón del aviso que silencia la copa |
| `&aviso=plazo` | `&notif=deadline` | qué aviso abrió la página |
| `?de=link` | `?from=link` | la marca de lo compartido |
| `&zipSeg=8` | `&timer=8` | solo en prueba: el reloj de Zip y Desenredo |
| `?uad=boton` · `tarjeta` · `no` | `?daily=button` · `card` · `off` | dónde va Uno al día en la portada |
| `&demo=nueva`, `invitado`, `espera`, `sin-jugar`, `jugador`, `podio`, `llena` | `&demo=new`, `guest`, `waiting`, `not-started`, `player`, `podium`, `full` | las escenas de prueba de La Copa |
| `&aviso=dia`, `plazo`, `fin`, `insc`, `copas`, `prueba`, `uaddia`, `uadracha`, `uadsemana`, `uadadios` | `&notif=day`, `deadline`, `end`, `signup`, `cups`, `test`, `dailyday`, `dailystreak`, `dailyweek`, `dailybye` | los tipos de aviso |
| `/cup/suelto/?linea&hoy`, `?practica=<id>` | `/cup/suelto/?timeline-flash&today`, `?practice=<carpeta>` | el juego, con el nombre de su carpeta; los que no tienen página: `timeline-flash`, `number` |
| `#/ahora`, `#/torneo/OFICI`, `#/juegos`, `#/juego/ahorcado`, `#/sala/ABCD`, `#/trafico`, `#/audiencia`, `#/salud` | `#/now`, `#/cup/OFICI`, `#/games`, `#/game/hangman`, `#/room/ABCD`, `#/traffic`, `#/audience`, `#/health` | las direcciones del panel |

Siguen igual los que ya estaban en inglés o no son palabras: `lang`, `type`, `labs`, `c`, `inv`,
`app`, `pwa`, `records=firebase`, `utm_source`, los del panel `r` y `e`, el código de una copa
(`?K7Q2X`) y su link propio (`?pirata`, que lo elige quien la crea).
**Cómo:** `public/assets/js/parametros.js` tiene la tabla y lo usa todo el sitio: `param('room')` lee
`?room=` o `?sala=`, `tiene('test')` lee `?test` o `?prueba`, los valores salen siempre en inglés, y
`enIngles()` reescribe una búsqueda vieja sin tocar lo demás (las palabras sueltas de La Copa solo
cambian si son una bandera). El juego en la URL sale de `slugDe()` / `idDeSlug()` en `games.js`; el
id del juego no cambia (lo guardan las salas, el panel y el celular). Las claves que cuenta el panel
tampoco: `notif=deadline` se cuenta en `aviso/plazo`, como siempre (`AVISO_CLAVE`), así las cifras
no se cortan. Las palabras nuevas quedan reservadas para el link propio de una copa (ninguna copa
usaba una).
**Por qué:** lo pidió el dueño ("you are still creating labels in Spanish for URLs and variables"):
el sitio ya tenía las carpetas en inglés, pero `/case/?labs&semilla=LBWDC` seguía mezclando idiomas.
Con una tabla de alias no se rompe ningún link que ya circula.
**Consecuencias:** `node public/assets/js/parametros.test.mjs` prueba los alias, la reescritura y los
juegos, y además busca en `public/` y `tools/push/` una URL armada con un nombre de antes. Los
nombres de las variables del código siguen en español: la regla es sobre lo que se ve en la URL.
Las páginas puente no cambian (pasan la búsqueda tal cual y la página nueva la traduce), ni el
`?juego=` de `tools/release/og/card.html` (hoy `marketing/share-cards/card.html`, D-356), que es una herramienta y no una página del sitio.

## D-267 · El caso se prueba en un solo lugar: /labs/case/, con el juego completo
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** reemplaza el prototipo de D-256; corrige D-257 (dónde vive), D-265 (el comentario va en la pantalla de La Copa)
**Decisión:** El caso tiene una sola versión para probar: `https://juegosdesalon.cl/labs/case/`, la
pantalla de La Copa (portada, prueba, 3, 2, 1, juego, ayuda, resultado con su desglose, en los
cuatro idiomas). El prototipo de `/labs/case/` se borra y lo que solo él tenía pasa al juego:
- **El caso del día:** sin semilla en el link se juega el del día, el mismo para todos
  (`semillaDel(fecha)`), y el link queda limpio; la antesala lo dice.
- **Sigue donde iba al recargar:** las jugadas y el tiempo por caso, en el celular, sin repetir la cuenta.
- **El final:** compartir lleva la semilla (quien lo recibe juega el mismo caso, también al día
  siguiente), "🔍 Otro caso" abre uno al azar, "📅 El caso de hoy" vuelve al del día y el formulario
  "¿Qué te pareció?" va abierto al final de todo juego que se juega desde el laboratorio.
Lo activa `diario: true` en `games.js`. Los juegos del laboratorio viven en `/labs/<slug>/`
(`games.js` arma el `path`) y `/<slug>/` queda como página puente hasta que salgan (`og.mjs`).
**Por qué:** lo pidió el dueño: "No quiero dos versiones de prueba para testear el juego, el caso."
Con dos, los amigos probaban cosas distintas y lo que se arreglaba en una no se veía en la otra.
**Consecuencias:** `tools/e2e/case/lab.mjs` prueba la página nueva entera. Al salir del
laboratorio se saca `labs: true` y la página pasa a `/case/`; `diario` puede quedarse.

## D-268 · En el laboratorio, el link al comentario va al final de cada vista
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** amplía D-265 y D-267
**Decisión:** Un juego que se juega desde el laboratorio (hoy El caso, en `/labs/case/`) termina
cada vista con "💬 Dejar un comentario": la antesala (con la portada), la prueba y el juego. Abre
el formulario de comentarios en una capa (`abrirComentario` de `labs-idioma.js`) con el juego, la
semilla y la vista. Durante la cuenta del 3, 2, 1 no está. En el resultado el formulario va abierto
y es lo último de la pantalla, debajo de "Volver al laboratorio".
**Por qué:** lo pidió el dueño: que quien prueba pueda comentar en cualquier momento, sin esperar
a terminar, pero sin estorbar la cuenta.
**Consecuencias:** `tools/e2e/case/lab.mjs` prueba que esté al final de la antesala y del juego, que
no esté en la cuenta, que abra y cierre la capa, y que el formulario sea lo último del resultado.

## D-269 · Acertijos con truco, un prototipo en el laboratorio
**Fecha:** 2026-10-10 · **Estado:** derogada · **Relación:** el dueño lo probó y no le gustó: se sacó el mismo día (v0.146.1); usa D-265 y D-268 (el comentario); excepción a C-3 como D-256
**Decisión:** `/labs/riddles/` tiene cinco acertijos con truco al estilo de *Brain Test*: el animal
más grande, los cuadrados, la llave bajo la pregunta, la nube que tapa el sol y el kilo de plumas.
Cada uno con su gesto (tocar, elegir, arrastrar), un narrador burlón, 💡 Pista, un resultado con una
casilla por acertijo y el comentario al final de cada vista. Solo acertijos que no dependen del
idioma, para que se jueguen igual en los cuatro. (El doc del juego, `docs/games/riddles.md`, se borró con él.)
**Por qué:** lo pidió el dueño después de la investigación de *Brainstorm Test: Tricky Puzzle*: un
juego de niveles hechos a mano no calza con los juegos que arman su contenido solos, pero un
"acertijo del día" corto sí podría; el prototipo es para ver si a los amigos les gusta.
**Alternativas descartadas:** copiar acertijos de juegos de palabras (no se traducen) y armar el
juego completo con cientos de niveles antes de saber si gusta.
**Consecuencias:** `tools/e2e/riddles/lab.mjs` lo juega entero en los cuatro idiomas. Si gusta, los
acertijos pasan a un registro con sus textos en `rules.js` y entran a Uno al día o a La Copa.

## D-270 · La clave: cartas transparentes que juntas dicen un código
**Fecha:** 2026-10-10 · **Estado:** vigente · **Relación:** usa D-102 (el teclado compartido) y D-268 (el comentario); excepción a C-3 como D-256
**Decisión:** `/labs/code/` es un prototipo en que un código de 5 cifras de siete segmentos se
reparte entre una base fija y 4 cartas transparentes, cada una girada o volteada al azar. Se
toca una carta para ponerla sobre la base y elegirla, y con ↻ (media vuelta) y ⇋ (de lado) se
orienta; con todas derechas los trazos forman el código, que se escribe en el teclado de Toque y
Fama. Nada avisa que una carta quedó bien; un trazo encima de otro sí se nota (se ve rayado con los
colores de las cartas que chocan, sin texto), porque cada trazo del código está en una sola capa y la solución nunca tiene choques. El
motor garantiza que con todas puestas no hay otra forma sin choques de leer la clave. Detalle en [games/code.md](games/code.md).
**Por qué:** lo pidió el dueño: "figures/shapes that combined in a specific set of positions create
a code that can then be entered in a number or word pad… Start with two shapes". Probó la v1 de
dos figuras (una se arrastraba sobre la otra hasta que los bordes cortados calzaran, con un brillo
al calzar) y pidió "4 u 8 cartas girables y flipeables en vez de 2": con dos se resolvía en segundos
tocando ↻ y ⇋ a ciegas hasta que brillara (dilema #296). Después sacó el modo de 8 cartas
("demasiado compleja") y pidió que un trazo encima de otro se notara y no valiera.
**Alternativas descartadas:** girar de a 90° (una cifra de siete segmentos girada un cuarto de vuelta
no es una cifra), el brillo al calzar y la esquina cortada (regalan la orientación), y arrastrar cada
carta (con 8, tocar es más rápido y cabe en el celular).
**Consecuencias:** `engine.test.mjs` prueba el grupo de orientaciones y la lectura única;
`tools/e2e/code/lab.mjs`, el juego entero con los choques. Después pidió una cifra más (5) y que las
cartas flotaran y brillaran más al azar. Como el de cifras se volvió mecánico, se sumó **Palabra**
(en español): letras de catorce segmentos y cartas de dos caras, donde voltear muestra otros trazos. El
dueño lo aprobó para el laboratorio (v0.147.0).

## D-271 · Los mensajes de la app nombran todo lo principal, y el agente de documentación los mantiene
**Fecha:** 2026-10-11 · **Estado:** corregida por D-272 · **Relación:** amplía D-226 (el texto de la app) y D-172 (el agente de documentación); usa U-30
**Decisión:** El mensaje con que se comparte la app (`shareApp.lines`, el mismo en el celular y en
el computador, donde se copia sin la tarjeta) nombra **todo lo principal**, una línea cada cosa y en
los cuatro idiomas: 🏆 La Copa, 📅 Uno al día, 👥 jugar en grupo, 🧩 jugar solo, 🏅 rankings y
🔓 sin cuenta. La lista vive en `LO_PRINCIPAL` (`compartir.js`) y `compartir.test.mjs` frena un
mensaje al que le falte una o que tenga una línea que la lista no conoce. El mensaje del video
(`shareSheet.videoLines`) suma "un desafío nuevo cada día", y la bajada de la tarjeta del link
(`og.mjs`), que se armaba solo con los juegos de grupo, suma Uno al día y los minijuegos para jugar
solo. **El agente de documentación los mantiene** (U-35): `document.mjs revisar` los muestra tal
como salen, y si entró algo principal que no nombran, los actualiza en los cuatro idiomas, en su
PR, aunque sean textos de la app.
**Por qué:** lo pidió el dueño: revisar los textos de compartir y "asegúrate que el agente de
documentación siempre actualice estos mensajes para mantenerlos frescos y evitar que queden antiguos
o bien muestren una versión parcial del set de features". El mensaje era de D-226 (5 de octubre) y
no decía nada de Uno al día (abierto a todos desde v0.121.0) ni de los rankings (D-217); la tarjeta
del link no nombraba los minijuegos.
**Alternativas descartadas:** dejarlo solo como instrucción al agente (una prueba no se olvida) y
detectar sola una "novedad principal" en los commits (no hay cómo distinguirla de un cambio chico:
lo decide el agente, y la lista lo obliga a decirlo en un solo lugar). Un juego nuevo no es algo
principal: ya lo cuenta la cabecera ("15 juegos para el celular") y lo nombra la tarjeta.
**Consecuencias:** el mensaje pasa de 4 a 6 líneas. La regla es U-35; el agente la sigue desde
`.claude/agents/documentation.md`, como excepción a "no tocas código de la app".

## D-272 · Lo principal también es la app instalable con sus avisos y los cuatro idiomas
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** corrige D-271 (la lista de lo principal); usa D-221, D-224, D-230, D-232 y C-3
**Decisión:** `LO_PRINCIPAL` suma 📲 la app instalable con sus avisos y 🌎 los cuatro idiomas, y el
mensaje de compartir la app los nombra en dos líneas más, en los cuatro idiomas: "📲 Como app: la
agregas a tu pantalla de inicio y, si quieres, te avisa cuando te toca jugar." y "🌎 En español,
inglés, portugués y alemán.". El mensaje queda en 8 líneas.
**Por qué:** el agente de documentación preguntó, al revisar D-271, si los idiomas, los avisos y la
app instalable contaban como algo principal; el dueño: "Claro que cuenta". Instalar y los avisos van
juntos porque los avisos se piden desde la app (en el iPhone, solo instalada, D-227).
**Alternativas descartadas:** una línea para cada una de las tres (el mensaje pasaba de 9 líneas para
un chat) y dejar los idiomas fuera del mensaje en español (quien lo recibe puede reenviarlo a quien
no habla español).
**Consecuencias:** el mensaje del video y la bajada de la tarjeta del link no cambian: la tarjeta ya
dice "sin instalar", que se refiere a que no hay que bajar nada de una tienda.

## D-273 · Un agente de procesos, y decisiones de un toque
**Fecha:** 2026-10-11 · **Estado:** corregida por D-275, D-276, D-302 · **Relación:** completa D-132 y D-172 (los agentes de usabilidad y de documentación) y D-216 (el auto-merge)
**Decisión:** Un tercer agente (`.claude/agents/processes.md`) corre una vez al día y no arregla
cosas sueltas: **cierra lo que quedó abierto** (PR que esperan, issues viejos, lo que los otros
agentes arrastran de una ronda a otra) y **convierte cada error que se repite en un mecanismo**
que lo frena solo. Una vez es un accidente; dos veces, un patrón. Construye a lo más un mecanismo
por ronda, de preferencia un test, y si no, un dato leído del código, una comprobación, un paso de
un workflow y, solo al final, una instrucción. Toca el taller (`tools/`, tests, workflows, guías
de agentes), no el código de los juegos.
- **Memoria:** `docs/processes.json` (hasta qué commit miró, los patrones con sus veces, los
  mecanismos con su PR y lo aprobado que ya hizo). **Señales:** `tools/agents/processes.mjs revisar`.
- **Decisiones de un toque:** lo que necesita al dueño va en **un** issue con la etiqueta
  `procesos` y una casilla Sí y una No por decisión (`processes.mjs decidir`). GitHub se lo manda
  al correo; marcar una casilla despierta `.github/workflows/approve.yml`, que corre
  `tools/agents/approve.mjs` y hace al instante lo que esa casilla dice, sin un modelo de por medio,
  y anota el resultado al lado. Solo obedece al dueño, en un issue suyo, si el bloque de acciones
  no cambió en la misma edición, una vez por decisión y con acciones de una lista cerrada:
  `fusionar`, `cerrar-pr`, `cerrar-issue`, `comentar`, `correr` (e2e o publicar), `encolar` (para
  la ronda siguiente) y `nada`. El agente deja el trabajo hecho antes de preguntar, para que el Sí
  casi siempre sea "fusiónalo". Si una acción falla, la decisión no queda tomada: desmarcar y
  volver a marcar la reintenta.
- **Fusionar con el token del workflow** no despierta a `publish.yml` ni a `e2e.yml` (GitHub no
  encadena workflows con ese token): `fusionar` espera los checks obligatorios, fusiona y los
  corre a mano. Por eso el aviso de `e2e.yml` ya no exige un push.
- **El aviso "main en rojo" se cierra solo** cuando `main` vuelve a verde (`e2e.yml`, job
  `cerrar-aviso`): el #276 quedó abierto un día después de arreglado.
**Por qué:** lo pidió el dueño ("un jefe general cuyo propósito sea mantener automatización,
semi-automatización y consistencia"), con el menor esfuerzo de su parte, y aprobar "con un tap en
algún ícono" desde el correo. Al mirar el repo, lo que más inconsistencias dejaba no era lo que
nadie detectaba sino lo detectado que no se cerraba: seis PR de las rondas de usabilidad y
documentación esperando (el más viejo, del 5 de octubre), y el texto de compartir mantenido por
una instrucción hasta que D-271 le puso un test.
**Alternativas descartadas:** otro agente que patrulla y arregla (más PR esperando al dueño);
cada dos días (con unas 20 fusiones diarias, lo abierto se pudre entre una ronda y otra; la
memoria ya acumula los patrones); responder el correo con texto (hay que escribir); un link en el
correo que aprueba al abrirse (los correos abren los links solos para revisarlos, y aprobarían sin
el dueño; además pide un servidor con una llave de GitHub); un link firmado con página de
confirmación en un Cloudflare Worker (son dos toques igual que la casilla, con un servidor más).
**Consecuencias:** la ronda corre en la nube a las 4:30 hora del Pacífico, después de la de
documentación (3:54). El correo llega solo los días con algo que decidir.

## D-274 · Rankings: que cuente la partida recién jugada, el solitario en la portada y Ahorcado solo
**Fecha:** 2026-10-11 · **Estado:** corregida por D-353 · **Relación:** amplía D-212 y D-215
**Decisión:** Tres cambios para que los rankings se llenen:
- **"¿Quieres que esta partida cuente?"**: al terminar una partida sin jugador abierto (jugando solo
  en Toque y Fama, Generala, Ahorcado y Línea Relámpago, y en todos los juegos de grupo contra el
  celular, en sala o en un celular), sale un bloque aparte —fondo propio, borde dorado y una entrada
  con un pequeño salto— con el formulario de nombre y PIN de siempre y el nombre que escribió para
  jugar ya puesto. Al entrar o crear su jugador, se anota esa partida (y la victoria, si fue suya).
  Va después de los botones del final, para que sigan a la vista (C-8). Lo hacen `avisoPartida` y
  `finDePartida` de `ranking.js`; en los juegos de grupo se pone solo, después de `#result-actions`.
- **La portada de Toque y Fama, Generala y Ahorcado** muestra la tabla de los mejores puntajes
  jugando solo arriba de la de victorias: es como más se juegan.
- **Ahorcado jugando solo tiene ranking** (`ahorcado_solo`): el puntaje de Uno al día (las vidas
  que quedaron sobre las del principio, de 0 a 100), y el tiempo desempata. También en `/records/`.
**Por qué:** el dueño vio vacío el ranking de Toque y Fama sabiendo que se juega mucho. Los datos
(29 días): 43 partidas solo, 33 contra el celular y 23 salas, y en Firebase ni una victoria de
juegos de grupo; de 31 jugadores registrados, 6 anotaron alguna vez. Los rankings se guardaban
bien: lo que faltaba era que la gente entrara, y la portada mostraba la tabla que menos se usa.
El bloque aparte lo pidió el dueño, para que quien no lo ve siempre lo note.
**Consecuencias:** `tools/e2e/hangman/local.mjs` y `bulls-and-cows/local.mjs` prueban que el
final ofrezca que la partida cuente.

## D-275 · El feedback 🐞 llega como issues y lo atiende el agente de procesos
**Fecha:** 2026-10-11 · **Estado:** corregida por D-279, D-306, D-341 · **Relación:** amplía D-273 (el agente de procesos) y D-104 (los reportes de La Copa); corrige D-273 en que no tocaba el código de los juegos, y D-132 en que los reportes 🐞 eran de la ronda de usabilidad
**Decisión:** `.github/workflows/feedback.yml` sube cada hora los reportes nuevos de `feedback/`
(`tools/agents/feedback.mjs`) como issues con la etiqueta `feedback`, uno por reporte y nunca dos
veces el mismo. El agente de procesos los atiende en su ronda: arregla lo que tiene un arreglo
claro (en su PR, con `Closes #n`), pregunta con una decisión de un toque lo que es una idea o un
pedido, y cierra lo resuelto, repetido o que no se entiende, diciendo por qué. Para eso puede tocar
el código de la app, con los cánones, los cuatro idiomas, la prueba de punta a punta del juego y su
entrada del `CHANGELOG.md`.
- **Privacidad:** el repo es público. El issue lleva el texto tal cual, el juego, la versión y la
  pantalla, pero **no el nombre** que puso el jugador **ni su navegador**. Un @ o un # del texto no
  menciona a nadie ni enlaza nada.
- **Por qué en GitHub y no leyendo Firebase:** la ronda corre en la nube, y desde ahí no se llega a
  Firebase (el proxy responde 403); GitHub sí llega. Además, cada reporte queda con su respuesta y
  su arreglo enlazados.
**Por qué:** lo pidió el dueño: que el agente de procesos "evalúe y resuelva los ítems de feedback
que vayan llegando". Hasta ahora los leía la ronda de usabilidad (`reports.mjs --dias 2`), sin
registro de cuáles se atendieron: un reporte de un día sin ronda se perdía.
**Alternativas descartadas:** el resumen del reporte en vez del texto (exige que la ronda corra en
el Mac del dueño, con la app abierta); el texto con el nombre del jugador (el dueño prefirió dejarlo
fuera).
- **Los issues los abre el bot de los workflows, no la cuenta del dueño:** GitHub no avisa a
  nadie de lo que hace su propia cuenta, y los agentes usan la del dueño. Por eso el feedback lo
  sube `feedback.yml` y las decisiones de un toque las abre `decide.yml` (que lanza
  `processes.mjs decidir`); `approve.mjs` acepta los issues del bot. El primer issue de decisiones
  (#310) lo abrió la cuenta del dueño y no le llegó.
**Consecuencias:** al empezar, los nueve reportes que ya había se suben juntos y la primera ronda
cierra los que ya se resolvieron. GitHub le avisa al dueño por correo de cada issue nuevo.

## D-276 · El agente de procesos es el jefe de los otros agentes, y todo corre en el Mac mini
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** corrige D-132 y D-172 (cada uno con su hora) y D-273 (su ronda en la nube)
**Decisión:** El agente de procesos **responde** por lo que hacen los agentes de documentación y de
usabilidad, que **ejecutan**:
- **Encargos del dueño:** lo que el dueño pide y ejecuta otro agente ("revisa la frescura del
  README") se le pide al de procesos. Él decide a quién le toca, escribe el encargo con criterios
  de aceptación que se puedan comprobar, lo lanza, comprueba el resultado él mismo (lo devuelve una
  vez si falta algo) y le responde al dueño con la evidencia.
- **Despacho:** los otros dos ya no tienen hora propia. La ronda diaria del de procesos los lanza
  cuando hay algo que revisar: a documentación si entró algo a `main` desde su última ronda; a
  usabilidad si cambió algo de `public/` desde su último despacho, y una vez por semana aunque no
  (`processes.mjs revisar` lo calcula; `processes.mjs despacho` lo anota). Revisa lo que entregan.
- **Dónde:** una sola tarea programada de la app de Claude en el Mac mini del dueño, a las 4:30 hora
  del Pacífico, en vez de tres rutinas (documentación en la nube a las 3:54, usabilidad en el Mac a
  las 5:07 y procesos en la nube a las 4:30). Las otras se apagan.
**Por qué:** lo pidió el dueño: "si yo quisiera hacer una revisión de frescura de la documentación
[…] me gustaría que tú fueses el jefe encargado y yo básicamente te pido responsabilidad a ti. Pero
el que ejecuta es el agente de documentación", y que el de procesos determine "cuándo es el momento
correcto para echarlo a correr". Lanzar a los otros como subagentes exige que corran en el mismo
lugar, y en el Mac se llega a Firebase, a Chrome y a la llave del dueño (en la nube no). El Mac
mini está siempre despierto.
**Alternativas descartadas:** dejar las tres rutinas y que el de procesos solo supervise (el
calendario no quedaba en sus manos); todo en la nube (sin Firebase ni un Chrome confiable para las
capturas).
**Consecuencias:** si la app de Claude no está abierta en el Mac mini, la ronda corre al abrirla.
Los días sin cambios, los ejecutores no corren. Revisar un PR antes de fusionarlo sigue igual: la
sesión dueña lanza a los dos agentes (CLAUDE.md).

## D-277 · El veredicto de una carta con fecha cuenta su dato, y leerlo no cuesta tiempo
**Fecha:** 2026-10-11 · **Estado:** corregida por D-314 · **Relación:** excepción a C-8b (la explicación del error); completa D-95 (el tiempo activo) y D-278
**Decisión:** Cada carta de los mazos de Línea de Tiempo puede llevar un **dato** en los cuatro
idiomas (un porqué o una anécdota de hasta 110 caracteres, sin años), y el veredicto lo cuenta en
vez de decir entre qué hitos iba la carta:
- **Al errar**, en el veredicto que se queda hasta tocarlo. En ⏳ Línea Relámpago (solo, práctica,
  Uno al día y copa) y en cada hito de 📅 ¿En qué año?, el reloj se **pausa** mientras se lee, con **tope de 6 s**:
  arriba marca ⏸ y una barra bajo el dato se vacía.
- **Al acertar**, en una franja sobre el botón de colocar que no frena nada y se va sola a los 6 s.
- **Al terminar**, la línea como quedó es el repaso: los errores con su dato a la vista y el resto a
  un toque.

Entraron con datos Chile e Historia, y en el PR siguiente Música, Cultura pop, Brasil y Fútbol; una
carta sin dato dice dónde iba, como antes.
**Por qué:** lo pidió el dueño al ver "Fue en 1738: iba antes de 1925 · … Tú la pusiste entre 1980
y 1989 · …": que un año está entre otros dos no le enseña nada a nadie, y el año grande de la carta
ya dice qué estuvo mal. Un dato sí deja algo, al errar y al acertar. Lo que lo complica es el
reloj: si leer cuesta tiempo, el jugador aprende a saltárselo; si la pausa no tiene fin, sirve para
pensar la jugada siguiente. Con tope de 6 s alcanza para leer una frase y no para otra cosa, y el
veredicto tapa el tablero.
**Alternativas descartadas:** el dato en el acierto dentro del veredicto, alargando su cierre
(frena el juego en cada carta: la franja lo deja leer sin pedirlo); pausar el reloj sin tope;
reescribir el "iba entre…" más corto (sigue sin enseñar nada).
**Consecuencias:** el test del motor frena un dato largo, con año o con el año de otra carta, y
exige el dato en todas las cartas de los mazos que ya los tienen (`CON_DATOS`). Los datos se
escriben verificados: un error en un dato se lee como lección. La regla para escribirlos está en
`docs/games/timeline.md`.

## D-278 · Las cartas con fecha: ni dicen su año ni piden un dato que el jugador no sabe
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** corrige D-37
**Decisión:** De los mazos de Línea de Tiempo (que también usan ¿En qué año?, Línea Relámpago y la
final de La Copa) salen dos clases de cartas, y no se reescriben: se sacan.
- **Las que dicen su año**: las Constituciones de 1833, 1925 y 1980, la final de Italia 90 y la
  Eco-92. El test del motor ya no deja entrar una carta que diga su año, entero o abreviado ("90",
  "’92"), en ninguno de los cuatro idiomas. Un año que no es el de la carta sí puede ir (*2001:
  Odisea del espacio*, *1989* de Taylor Swift): es una trampa legítima.
- **Las que no se pueden situar**: un hecho que se repitió (el incendio de Valparaíso, los
  incendios forestales de 2017, los terremotos de Santiago de 1647 y de Valparaíso de 1906, "la
  crisis financiera") o un proceso sin fecha (la era del swing, la bossa nova, la cumbia, el reggae,
  la salsa, el punk, el Auto-Tune, la electrónica en los festivales, TikTok como fábrica de éxitos,
  Bad Bunny como el más escuchado, el perro Doge, Baby Shark, el comienzo de las independencias
  latinoamericanas).

Salieron 23 cartas. Música, que ya tenía 89, recibió 12 hitos puntuales y conocidos (la muerte de
Lennon, Freddie Mercury y Kurt Cobain, el Nobel de Dylan…) y queda en 91. El test exige ahora 90
cartas por mazo, lo que ya pedía la guía.
**Por qué:** El incendio de Valparaíso ya se había anclado como pedía D-37 ("el mayor de su
historia, casi 3.000 casas") y seguía sin poder situarse: el superlativo y la cifra son datos que
la carta le enseña al jugador, no algo que él sepa. Reescribir una carta para anclarla agrega una
pregunta de trivia al juego; el juego es ordenar hechos que uno reconoce. En el otro extremo, una
carta que dice su año no se juega: se lee.
**Consecuencias:** La regla para escribir cartas, en `docs/games/timeline.md`: el ancla tiene que
ser algo que el jugador sepa (un nombre, un hecho único), no un superlativo o una cifra que solo la
carta dice. Si no la hay, la carta no entra.

## D-279 · Los issues de feedback llevan el nombre de quien lo manda
**Fecha:** 2026-10-11 · **Estado:** corregida por D-366 · **Relación:** corrige D-275 (el issue iba sin el nombre)
**Decisión:** El issue de cada reporte 🐞 suma una línea **Quién** con el nombre que el jugador
escribió en el formulario, si escribió uno. El navegador sigue fuera. Los nueve issues que ya
estaban se completaron con su nombre.
**Por qué:** lo pidió el dueño al ver los primeros issues: "no dice el nombre de quien reporta, lo
que me ayudaría para hacer follow-up personal". El repo es público, así que el nombre queda a la
vista, pero el nodo `feedback/` de Firebase ya se lee sin llave (`.read: true`): el issue no expone
nada que no se pudiera ver. El nombre es opcional y lo elige el jugador (40 caracteres como mucho).
**Alternativas descartadas:** dejarlo solo en `reports.mjs` o en el panel (el dueño tendría que ir
a buscarlo; el correo del issue es donde lee el reporte).
**Después:** D-306 suma la etiqueta de la llave del laboratorio, que llega aunque no se escriba nombre.

## D-280 · El laboratorio tiene dos grupos: Proyectos activos y La Bodega
**Fecha:** 2026-10-11 · **Estado:** corregida por D-361 · **Relación:** amplía D-262
**Decisión:** `/labs/` se ordena en dos grupos: **🧪 Proyectos activos**, lo que se está probando
ahora, y **📦 La Bodega**, los proyectos que no prosperaron. Los de La Bodega se siguen jugando en su
página, pero ya no se trabajan. Hoy van a La Bodega El caso (`/labs/case/`) y La clave
(`/labs/code/`), y Proyectos activos queda vacío, con un aviso que lo dice.
**Por qué:** pedido del dueño: ni El caso ni La clave prosperaron, y el laboratorio tiene que
mostrar de un vistazo qué está vivo. Borrarlos perdería el trabajo; dejarlos al lado de lo nuevo
confunde a quien prueba.
**Consecuencias:** un proyecto nuevo entra en Proyectos activos (y el aviso de vacío se saca);
uno que se abandona pasa a La Bodega moviendo su `<section class="seccion">`. Los dos siguen con
`labs: true` en `games.js`. Lo verifican `tools/e2e/case/lab.mjs` y `tools/e2e/code/lab.mjs`.
**La Bodega, plegada (v0.168.2, pedido del dueño):** cada juego de La Bodega se muestra solo con su
título, dentro de un `<details class="plegada">` atenuado, y un toque lo abre con su descripción y
su botón; los proyectos activos van abiertos. Así lo guardado no pesa lo mismo que lo vivo. Pasar
un proyecto a La Bodega es, entonces, moverlo y envolverlo así. Lo verifica `tools/e2e/case/lab.mjs`.

## D-281 · El laboratorio tiene puerta: sin la llave se va al menú, y nada de él se indexa
**Fecha:** 2026-10-11 · **Estado:** corregida por D-284 · **Relación:** corrige D-101
**Decisión:** Cada página de `/labs/` carga primero `public/assets/js/labs-puerta.js`, un script
clásico que esconde la página hasta comprobar la llave. La llave llega una vez en el link que
manda el dueño (`/labs/?key=…`), se guarda en el celular y se borra del link; sin ella, o con una
equivocada, la página manda al menú sin mostrarse. El código solo guarda la huella SHA-256 de la
llave (`HUELLA`): la llave no está en el repo. En localhost y en Tailscale (`*.ts.net`, D-67) se
abre sola, para los guiones y para el dueño.
Además, nada del laboratorio se indexa: `/labs/case/` (que genera `og.mjs`) y las páginas puente
que llevan ahí (`/case/`, `/minigames/case/`, `/minijuegos/caso/`) suman `noindex, nofollow`, como
ya tenían `/labs/` y `/labs/code/`. La tabla de juegos del README nombra a los del laboratorio sin
link.
**Por qué:** pedido del dueño: que los robots no lleguen a Labs y tampoco gente que no fue
invitada. D-101 solo lo sacaba del menú, pero `/labs/case/` y sus puentes se anunciaban con tarjeta
y canonical, sin `noindex`, y el README los enlazaba. No se usa `robots.txt` con `Disallow`: un
robot que no puede entrar no ve el `noindex` y la URL podría indexarse igual si alguien la enlaza.
**Consecuencias:** es una puerta, no una cerradura: GitHub Pages sirve archivos estáticos, así que
el código del laboratorio se puede bajar igual; frena a los curiosos y a los robots que corren
JavaScript. Un cierre de verdad necesitaría un servidor delante (por ejemplo Cloudflare Access).
Un link que comparte un juego del laboratorio (el "Compartir" de El caso) solo abre para quien ya
tiene la llave. Para cambiarla: `printf %s 'llave-nueva' | sha256sum` y el resultado en `HUELLA`;
quien tenía la vieja queda afuera. `public/assets/js/labs-puerta.test.mjs` prueba la puerta y
exige que cada página de `/labs/` la cargue y que ninguna, ni sus puentes, se indexe.

## D-282 · El caso: las pistas ya usadas se tachan solas
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** amplía D-256 (el ✓ que tacha una pista); respeta D-261 y D-263
**Decisión:** En El caso, una pista se tacha sola cuando **ya están marcadas todas las personas
que abarca** (las de su grupo, o de sus dos grupos en una comparación). Se ve igual que una tachada
a mano. El ✓ sigue: tacha antes a mano y destacha, también una tachada sola, que entonces queda a
la vista. Lo calcula `usadas()` del motor, que mira solo lo que el jugador ya marcó, nunca la
solución; como lo tachado sale de la grilla, si alguien que la pista abarca volviera a quedar sin
marcar, la pista volvería a aparecer, y una tachada a mano no.
**Por qué:** lo pidió un jugador por el 🐞 (#320: «Se podrian auto tachar las pistas ya usadas») y el
dueño eligió la lectura del dilema #302 que no regala nada: una pista cuyo grupo ya está todo
marcado no puede aportar, y eso ya se ve en la grilla. Con 20 personas y una pista por acierto la
lista crecía y había que ir tachando a mano.
**Alternativas descartadas:** tachar la que el motor sabe que ya no aporta (sería una ayuda gratis,
y la 💡 Ayuda cuesta 15, D-263); dejar solo el ✓ a mano; pintar distinto la tachada sola (se
entiende sola: pasa justo al marcar a alguien, U-8).
**Consecuencias:** las pistas que abarcan a casi todos ("hay más criminales en la fila 1 que en la
2") se tachan tarde. Una pista tachada sola nunca es de las que nombra la ayuda. Las tachadas siguen
sin guardarse al recargar, pero las que se tachan solas vuelven solas. `juegos.test.mjs` prueba
`usadas()`; `tools/e2e/case/lab.mjs`, el tachado solo, el ✓ a mano y el destachar, y
`tools/e2e/paths.mjs` suma la toma `caso pistas`.

## D-283 · Reinas: ↩️ Deshacer el último gesto
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** amplía D-169 · cierra el dilema #301 (reporte 🐞 #319)
**Decisión:** Bajo el tablero de Reinas, a la izquierda de 🧹 Borrar todo, va **↩️ Deshacer**
(EN *Undo*, PT *Desfazer*, DE *Rückgängig*). Cada toque quita el último gesto y vuelve a dibujar,
uno tras otro hasta el tablero del comienzo; sin nada que deshacer, el botón está apagado. Vale en
La Copa (el día y la ronda de la final), en el juego suelto y en Uno al día, que usan la misma pantalla.
- **Un gesto, un paso:** un toque, un toque largo, un arrastre entero (todas las X que pintó o
  borró) o un Borrar todo, que así se puede deshacer. La pantalla anota dónde empieza cada gesto en
  la lista de jugadas; esos cortes viven en memoria, así que después de recargar la partida
  Deshacer quita una jugada por toque.
- **Deshacer no es una jugada:** quita jugadas de la lista guardada y el motor no cambia. El reloj
  sigue y el puntaje es el tiempo (D-107), así que no cambia cómo se cuenta. Los errores que se
  deshacen dejan de contarse, pero en Reinas ya no restan.
- **No pide confirmación**, a diferencia de Borrar todo y Rendirse (U-15): lo que deshace se rehace
  con el mismo toque que lo hizo.
- **La fila de botones:** Deshacer y Borrar todo juntos, y 🏳️ Rendirse, que es definitivo, en su
  propia línea. Cada botón en una sola línea de texto; el que no cabe baja (a 320 px, en alemán, los
  tres van uno bajo otro). Antes los dos botones partían sus palabras en sílabas.
- **Hecho para repetirse:** el botón y los pasos viven en `public/cup/games/deshacer.js`
  (`pasos()` y `botonDeshacer()`), para sumarlo después a Tango y Zip sin rehacerlo. Lo prueba
  `public/cup/games/deshacer.test.mjs`, con el motor de Reinas.

**Por qué:** Un jugador lo pidió con un 🐞 («Faltan boton UNDO> birrar todo es muy agresivo»): una
suposición de varios pasos se desarmaba a mano o se borraba entera. El Queens de LinkedIn lo trae.
El dueño aprobó la opción A del dilema.
**Alternativas descartadas:** deshacer de a una jugada (un arrastre de ocho X pedía ocho toques);
guardar Deshacer como jugada en la lista (agrandaba lo guardado sin necesidad: no hay nada que
reproducir ni verificar fuera del celular); sumarlo a Tango en el mismo PR (queda para después).

## D-284 · Cada persona tiene su propia llave del laboratorio
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** corrige D-281 · **Storage moved by D-345** (the fingerprints live in Firebase, not in `labs-puerta.js`)
**Decisión:** La puerta del laboratorio acepta una lista de llaves, una por persona, en vez de una
sola: `HUELLAS` en `labs-puerta.js`, con una línea `'etiqueta': 'huella'` por cada una. Se dan y se
quitan con `node tools/agents/labs-key.mjs nueva <etiqueta> | quitar <etiqueta> | listar`: `nueva`
crea una llave al azar que empieza con la etiqueta (`ratoncito-…`, pedido del dueño: que cada uno
reconozca su link), agrega su huella SHA-256 y muestra el link (`/labs/?key=…`) una sola vez;
la llave no se guarda en ningún lado. La primera, además de la del dueño, es la de `MI`.
**Por qué:** pedido del dueño, para darle acceso a otra persona con una URL única que ella guarde.
Con una llave compartida, sacar a una persona obligaba a cambiarles la llave a todas; con una por
persona se borra su línea y nadie más se entera. Una llave quitada deja de abrir aunque estuviera
guardada en el celular, porque la puerta la compara de nuevo en cada visita.
**Consecuencias:** cada llave nueva o quitada es un cambio a `labs-puerta.js` que entra con un PR, y
rige cuando el sitio se publica. Pedir una llave es pedir que funcione (pedido del dueño,
2026-10-12): quien la crea abre ese PR y le activa el auto-merge en el mismo movimiento, sin
esperar otra orden; un PR de solo llaves no lleva CHANGELOG ni pasa por los agentes. La etiqueta es pública (el repo lo es): iniciales o un apodo, no un
nombre completo. Una llave perdida no se recupera: se quita y se da otra.
`tools/agents/labs-key.test.mjs` prueba la herramienta, y `labs-puerta.test.mjs` que cada persona
entre con la suya y que una quitada ya no abra.

## D-285 · La Copa: un celular que perdió su asiento vuelve a entrar con su PIN
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** completa D-96 (qué pasa cuando un celular pierde su asiento)
**Contexto:** el dueño entró a su copa desde el aviso del día, con el día abierto, y al tocar
Empezar leyó "El tiempo para jugar este día ya se terminó.". Las reglas de Firebase niegan igual
(PERMISSION_DENIED) un día cerrado que un celular que ya no está sentado como su jugador, y
`store-firebase.js` traducía toda negación al empezar o al enviar como "ventana". El celular cree
estar sentado porque lo recuerda en `localStorage`, pero el asiento es del `uid` anónimo de Firebase:
se pierde si el navegador borra la sesión de Firebase y deja el `localStorage`, o si el admin le da
un PIN nuevo al jugador.
**Decisión:** ante una negación al empezar o al enviar el resultado, el almacén lee la copa y mira
el día con la hora del servidor (y el cierre del admin, D-161). Si el día sigue abierto, la causa
es el asiento (`permiso`), y la pantalla lleva a **Ya estoy inscrito** con el nombre del jugador ya
elegido y la frase "Este celular dejó de entrar como {name}. Escribe tu PIN para seguir jugando."
Con el PIN vuelve al tablero y juega; un resultado que no alcanzó a enviarse sigue guardado en el
celular y se reenvía al volver al día. Si el día de verdad se cerró, el mensaje es el de siempre.
Lo prueba `tools/e2e/cup/seat.mjs`.
**Alternativas descartadas:** leer el asiento antes de cada escritura (`torneoSeats` no se puede
leer, a propósito); mostrar solo el aviso genérico de permiso (obligaba a buscar a mano dónde
escribir el PIN).

## D-286 · Agentes: un Codenames mini, para uno solo, en Proyectos activos del laboratorio
**Fecha:** 2026-10-11 · **Estado:** corregida por D-287, D-288 · **Relación:** amplía D-280 (el primer proyecto activo del laboratorio)
**Contexto:** el dueño pidió investigar *Codenames* (Vlaada Chvátil, Czech Games Edition, 2015) y
ver si una versión mini podía entrar a La Copa. El original es de equipos: un jefe de espías da una
palabra y un número, y su equipo busca a sus agentes entre 25 palabras sin tocar al asesino. En La
Copa no hay jefe de espías: cada uno juega solo, contra el reloj del día.
**Decisión:** el juego da las pistas y el jugador adivina. Un tablero de **12 palabras**: 9 agentes
(3 pistas de 3), 2 neutrales y 1 asesino. Las pistas llegan de a una, con su número («MAR · 3»).
Un agente de la pista suma; uno de otra pista también suma y no corta; un neutral (−15) o el
asesino (−40) cortan la pista. "Siguiente pista" se planta y pasa. Puntaje 0–100: 100 × agentes/9,
menos las restas. Las pistas son una lista curada (`pistas.js`, 40 en español de Chile), cada una
con 9 asociaciones fuertes y 3 tentaciones; el generador elige 3 pistas que no se pisen, ninguna
palabra del tablero es una de las pistas, el asesino sale de las tentaciones (por eso engaña) y los
neutrales de otras pistas. Sin semilla es el tablero del día, el mismo para todos. Entra al
laboratorio como **proyecto activo**, solo en español, con el formulario de comentarios al final
(D-265, D-268). **La portada y el final dicen de dónde viene**: "Inspirado en Codenames, de Vlaada
Chvátil (Czech Games Edition).", con un link a la página oficial (pedido del dueño: ser honestos
con el origen); el laboratorio lo dice también.
**Por qué:** el juego da las pistas porque una IA o un rival no caben en La Copa, y una lista curada
asegura que las pistas sean justas: el test revisa 300 tableros. 12 palabras caben en un celular
sin scroll de lado y se juegan en un par de minutos, como los otros juegos de la copa.
**Alternativas descartadas:** el tablero de 25 (no cabe y dura mucho); que el jugador dé las pistas
(no hay quién adivine); generar las pistas con un modelo de lenguaje en vivo (costoso y sin garantía
de que sean justas).
**Consecuencias:** `public/labs/agents/engine.test.mjs` prueba la lista y que cada tablero sea
justo; `tools/e2e/agents/lab.mjs`, la partida entera. Si a los amigos les gusta, el paso siguiente
es llevarlo a La Copa en los cuatro idiomas (una lista de pistas por idioma).

## D-287 · Agentes: 15 cartas, 4 pistas (una de 2), trampas que tientan y un color por pista
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** corrige D-286 (el tablero y sus trampas)
**Contexto:** el dueño, jugando el prototipo, lo encontró fácil: en 12 cartas, 9 eran agentes (75 %),
y las 2 neutrales salían de pistas que no estaban en juego, así que se descartaban a primera vista.
Probó en el teléfono, por Tailscale, una vuelta a la vez: una fila más, un grupo más, neutrales que
tientan y una pista más corta.
**Decisión:** un tablero de **15 cartas en 3×5** (las columnas siguen siendo 3, así que el ancho de
las cartas no cambia): **4 pistas**, tres de 3 agentes y **una de 2** («· 2», cuál cambia cada
tablero), **3 neutrales y 1 asesino**. Las neutrales salen ahora de las mismas tentaciones (`casi`)
que el asesino, de preferencia de otra pista que la suya: las 4 cartas que no son tuyas se parecen a
alguna pista, y cada una lleva `tienta`, que el tablero final muestra («≈ TREN»). **Cada pista tiene
su color** (verde, celeste, rosado, violeta; ni amarillo, que es de las marcas, ni rojo, que es del
asesino): el cartel de la pista en curso lo lleva, cada agente destapado toma el de su pista, y los
de pistas ya cerradas se apagan, para que se vea que ya no cuentan para la jugada (pedido del dueño).
Las restas siguen en −15 y −40; un agente vale 100/11. Las cartas bajan a 56 px de alto para que el
tablero quepa en un celular común sin mover la pantalla.
**Por qué:** 11 de 15 (73 %) obliga a dudar; que las trampas tienten hace que haya que pensar cada
toque, y la pista corta quita la certeza de que siempre son 3. Los colores responden a que con 4
pistas ya no se sabía qué agentes eran de la jugada actual.
**Alternativas descartadas:** 5×5 (no cabe a lo ancho en un celular); 3 pistas y 5 neutrales (más
difícil, pero las neutrales no tentaban); 2 asesinos (castiga demasiado: −80).
**Consecuencias:** `engine.test.mjs` revisa en 300 tableros que cada pista tenga los agentes que dice,
que sumen 11, y que el asesino y las neutrales tienten a la pista que dicen; `tools/e2e/agents/lab.mjs`
juega una partida de 4 pistas. La tarjeta y el video de `marketing/agentes-tarjeta/` dicen 15 palabras.

## D-288 · Agentes: el cuento de los espías en la portada, 100 pistas y un calendario sin repeticiones
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** amplía D-286 y D-287
**Contexto:** el dueño preguntó por qué cada carta es un «agente»: no se entendía. En *Codenames*
cada palabra es el nombre en clave de un espía, pero el prototipo nunca lo contaba. Además pidió
variedad para quien juega todos los días: con 40 pistas y 4 al azar por día, una misma pista salía
hasta 7 veces en 30 días.
**Decisión:** la portada cuenta el juego en una línea, bajo el título: «Cada palabra es el nombre en
clave de un espía. Con las pistas, encuentra a los tuyos.» Las pistas pasan de 40 a **100** (60
nuevas, con 10 palabras y 3 tentaciones cada una). El tablero del día sale de un **calendario**
(`pistasDelDia`): recorre todas las pistas en vueltas barajadas, día a día desde el 1 de octubre de
2026, y una pista no vuelve antes de **15 días**. Es determinista, así que el tablero de hoy sigue
siendo el mismo para todos. «Otro tablero» sigue al azar.
**Por qué:** el cuento convierte «agente», «asesino» y el sello de Clasificado en algo que se entiende
sin conocer *Codenames*. Con 100 pistas y el calendario, una pista vuelve entre 16 y 37 días después
(25 en promedio), y como cada una tiene más palabras de las que usa el tablero, tampoco vuelven los mismos agentes.
**Alternativas descartadas:** hablar solo de «palabras» y dejar el tema en el título (el asesino
quedaba sin sentido); cambiar el nombre del juego; ventanas por ronda fija de 25 días (en el cambio de
ronda una pista podía volver al día siguiente).
**Consecuencias:** el crédito a *Codenames* sale del resultado (pedido del dueño: repetido ahí sobraba) y queda en la portada y en el laboratorio, que es donde se decide jugar. Cambia el tablero de los días ya jugados (es un prototipo). `engine.test.mjs`
revisa un año de tableros del día: ninguno al azar, todos con las pistas del calendario, ninguna pista
antes de 15 días, y que en el año salgan las 100.

## D-289 · Pintaminas: un Buscaminas de colores en Proyectos activos del laboratorio
**Fecha:** 2026-10-11 · **Estado:** corregida por D-290 · **Relación:** amplía D-280 (un segundo proyecto activo); ampliada por D-291 (el modo difícil) y D-292 (la ayuda)
**Contexto:** el dueño pidió investigar *ColorSweeper* (ARRKKA, publicado por Com2uS en 2026): un
Buscaminas en que cada casilla tiene un color y su número dice cuántas de sus 8 vecinas son de su
mismo color, con puzzles que se resuelven sin adivinar y, al terminar, un dibujo (como los
nonogramas). Pidió un prototipo y eligió el nombre entre cuatro: **Pintaminas**.
**Decisión:** una grilla de **7×7 con 2 colores**, tinta y fondo, que esconde un dibujo (17 dibujos
hechos a mano, que pueden salir espejados). Se dan algunas casillas con su color y su número; el
jugador elige pincel (🎨 Tinta o ⬜ Fondo) y toca una casilla: si acierta, aparece su número y da
más pistas; si erra, la casilla se destapa con su color verdadero, marcada, y resta 15. Puntaje
100 − 15 por error. El generador agrega casillas dadas hasta que un solucionador que razona como un
jugador (todas o ninguna, y una regla dentro de otra) lo resuelve entero, y después saca las que
sobran: nunca hay que adivinar. Sin semilla es el tablero del día. Usa la cuenta 3, 2, 1 compartida,
la línea antes del comentario y el crédito honesto: «Inspirado en ColorSweeper, de ARRKKA.», con link,
en la portada y en el laboratorio. Solo en español. La tarjeta para compartir muestra dónde se
equivocó, no el dibujo, para no arruinarlo a quien juega el mismo día.
**Por qué:** es deducción pura para uno, dura unos minutos y tiene un final que premia (el dibujo):
lo que funciona en La Copa. El pincel en dos botones se entiende mejor que un toque largo, y que el
error destape la casilla deja seguir jugando.
**Alternativas descartadas:** 4 colores (más difícil de leer en un celular); perder al primer error,
como en el Buscaminas (castiga demasiado a quien recién aprende); llamarlo Vecinas, Minas y colores
o Mosaico (lo eligió el dueño).
**Consecuencias:** `public/labs/paint-mines/engine.test.mjs` revisa los dibujos y 300 tableros (se
resuelven sin adivinar, sin dadas de sobra); `tools/e2e/paint-mines/lab.mjs` juega una partida
entera. Si gusta, el paso siguiente es La Copa (junto a Tango, que también es de dos colores: cuidar
que no se sientan repetidos).

## D-290 · Pintaminas: «Pinta» y «No pinta», un color al azar por tablero y dibujos irregulares
**Fecha:** 2026-10-11 · **Estado:** corregida por D-298 · **Relación:** corrige D-289; corregida por D-298 (el color ya no sale al azar: cada dibujo trae el suyo)
**Contexto:** el dueño probó Pintaminas en el teléfono: «tinta o fondo» era un mal nombre, y los
dibujos simétricos (corazón, estrella, árbol…) se adivinaban por espejo, sin deducir.
**Decisión:** los pinceles se llaman **«Pinta {color}»**, con un color que cada tablero toma al azar
de `PALETA` (azul, rojo, verde, amarillo, naranjo, morado), y **«No pinta»**, gris como las casillas
que no se pintan. El error lo dice así: «❌ Se pintaba de morado: −15.» o «❌ No se pintaba: −15.».
Los 17 dibujos pasan a ser **irregulares** (un pez, una bota, un rayo, un perro, un cohete, una
guitarra…), y el test rechaza uno simétrico de lado a lado o de arriba abajo.
**Por qué:** «pintar o no» es lo que hace el jugador, y el color al azar hace que cada tablero se vea
distinto aunque repita dibujo. Un dibujo irregular obliga a deducir cada casilla.
**Alternativas descartadas:** un color fijo por dibujo (el corazón siempre rojo: delataba el dibujo
por el color); seguir llamándolos tinta y fondo.
**Consecuencias:** `engine.test.mjs` revisa la paleta y la asimetría de cada dibujo.

## D-291 · Pintaminas: un modo difícil de dos colores, con un interruptor eléctrico y premio ×1.5
**Fecha:** 2026-10-11 · **Estado:** corregida por D-298, D-332 · **Relación:** amplía D-289; corregida por D-298 (los dos colores son los del dibujo, ya no al azar) y por D-332 (sin el premio ×1.5: el difícil también va de 0 a 100); ampliada por D-292 (la ayuda y el brillo del interruptor)
**Contexto:** el dueño preguntó qué pasaría con un segundo color. Con dos colores, un número que se
cumple solo dice que las demás vecinas *no son de ese color* (pueden ser del otro o sin pintar): hay
que cruzar más números. Pidió probarlo como modo difícil, que se active con un interruptor eléctrico
de palanca que se electrifique al activarse, y que pague 1,5 veces el puntaje.
**Decisión:** en la portada, un **interruptor de palanca** («⚡ Modo difícil · Dos colores · puntaje
×1.5»): una placa de metal con una palanca de mango rojo; al subirla, la placa titila en celeste y
amarillo y saltan chispas ⚡, con un zumbido y una vibración. Encendido, el tablero usa **dos colores**
(dos de `PALETA` al azar; desde v0.167.2, un dibujo puede traer los suyos en `colores`, y las cerezas
salen siempre rojas con el tallo verde, pedido del dueño) y 10 dibujos propios de dos colores (`DIBUJOS2`: una frutilla, unas cerezas,
un helado…), con **tres pinceles** («Pinta rojo», «Pinta verde», «No pinta») y un borde eléctrico.
El puntaje se multiplica por **1,5** (`PREMIO_DIFICIL`): sin errores son 150. El link lo lleva
(`?colors=2`), «Otro tablero» lo conserva y el celular recuerda la posición del interruptor.
**Por qué:** el modo normal queda para aprender; el difícil, para quien ya lo domina, con un premio
que lo hace valer. El solucionador pasa a llevar, por casilla, los colores que todavía puede tener:
el mismo razonamiento sirve para uno o dos colores, y el generador sigue asegurando que nunca se adivina.
**Alternativas descartadas:** dos colores siempre (abruma al que recién aprende); un premio fijo en
puntos (×1.5 escala con lo bien que se juega).
**Consecuencias:** `engine.test.mjs` revisa los dibujos de dos colores (irregulares, con al menos 4
casillas de cada color) y 300 tableros difíciles que se resuelven sin adivinar (en promedio con 5
dadas); `tools/e2e/paint-mines/lab.mjs` enciende y apaga el interruptor y juega una partida difícil.

## D-292 · Pintaminas: la ayuda 💡, y el brillo del interruptor que parpadea al azar
**Fecha:** 2026-10-11 · **Estado:** vigente · **Relación:** amplía D-289 y D-291
**Contexto:** el dueño se trabó en un tablero difícil: la siguiente jugada salía de cruzar tres
números (una regla dentro de otra). Pidió una ayuda. Pidió también que el brillo del modo difícil
cubra el rectángulo entero del interruptor y se prenda y apague al azar.
**Decisión:** un botón **«💡 Ayuda (−10)»** bajo los pinceles. Al tocarlo, el solucionador
(`ayuda(sol, conocidas)`, el mismo que asegura que nunca se adivina) busca la primera casilla que se
puede deducir con lo que se ve: esa casilla late en amarillo y los números que la explican quedan
marcados, sin decir de qué color es. Cada ayuda resta 10 (antes del ×1.5 del modo difícil) y el
desglose las cuenta. El interruptor encendido brilla entero (borde, resplandor y fondo) con una
intensidad que `game.js` cambia a destiempo: casi siempre encendido, a veces una ráfaga corta, a
veces un bajón, como una luz con mal contacto. Con movimiento reducido queda encendido y quieto.
**Por qué:** igual que en El caso (D-263), una ayuda que señala dónde mirar y deja la deducción al
jugador destraba sin regalar la partida.
**Alternativas descartadas:** que la ayuda pinte la casilla (regala la jugada); dar una casilla más al
empezar (no ayuda a quien se traba a mitad de camino).
**Consecuencias:** `engine.test.mjs` juega tableros de uno y dos colores solo con ayudas hasta el final
(siempre hay una casilla que se puede deducir); `tools/e2e/paint-mines/lab.mjs` pide una ayuda y
revisa el puntaje y el desglose.

## D-293 · Rutas: girar rectángulos de un plano de metro hasta unir las líneas, en el mínimo de giros
**Fecha:** 2026-10-12 · **Estado:** corregida por D-294 · **Relación:** amplía D-280 (un tercer proyecto activo)
**Contexto:** el dueño pidió estudiar *Junction Nine* (Bricks and Chips): 9 piezas en 3×3 con tramos
de líneas de colores; una jugada gira 180° cualquier rectángulo del tablero, y el desafío es unir todas
las líneas en el mínimo de giros, que el juego conoce («185.794.560 tableros» = 9! × 2⁹). Pidió un
prototipo y le puso el nombre: **Rutas**. En v0.167.3 el dueño lo renombró **Rutas rotas** (las líneas parten
cortadas y hay que unirlas); el link `/labs/routes/` y el id `rutas` siguen iguales.
**Decisión:** el motor arma un **plano de metro** al azar (4 líneas de colores que van de borde a borde
del tablero, pasando de pieza en pieza por una de las dos puertas de cada lado, sin piezas vacías ni
repetidas) y lo desordena con 5 giros al azar desde la meta. El **mínimo exacto** se calcula buscando
desde los dos extremos a la vez (cada giro se deshace con el mismo giro), y un tablero vale si su
mínimo es de 3 a 5. Se juega **arrastrando** de una pieza a otra: se marca el rectángulo en amarillo y
al soltar gira media vuelta (las piezas viajan y se dan vuelta con animación); un toque gira una sola
pieza. Se gana cuando todos los bordes entre piezas calzan, aunque sea en otro orden que el original.
Arriba, «Giros: n · Mínimo: m»; **↺ Reiniciar** es gratis. Puntaje tipo golf: 100 si se iguala el
mínimo, −15 por cada giro de más, nunca menos de 10. Como los demás proyectos: tablero del día, cuenta
3, 2, 1, la línea antes del comentario y el crédito «Inspirado en Junction Nine, de Bricks and Chips.»
con su link, en la portada y en el laboratorio. Solo en español.
**Por qué:** es distinto a lo que hay (no se deduce: se planifica), dura un par de minutos y tiene un
puntaje natural. Reiniciar gratis hace que buscar el mínimo se sienta como un golf y no como un castigo.
**Alternativas descartadas:** botones para elegir esquinas en vez de arrastrar (más toques); contar
los reinicios en el puntaje (castiga probar, que es el juego).
**Consecuencias:** `public/labs/routes/engine.test.mjs` revisa los giros, el mínimo contra una búsqueda
simple y 60 tableros (justos y con mínimo de 3 a 5); `tools/e2e/routes/lab.mjs` arrastra, reinicia y
termina una partida.

## D-294 · Rutas: cinco etapas de dificultad creciente
**Fecha:** 2026-10-12 · **Estado:** corregida por D-295 · **Relación:** corrige D-293
**Contexto:** el dueño pidió que Rutas sea un juego de etapas con dificultad creciente, en vez de un
solo tablero.
**Decisión:** cada partida son **5 etapas** (`ETAPAS`): 3 líneas y mínimo 2; 4 líneas y mínimo 3;
4 y 4; 5 y 4; 5 y 5. El mínimo de cada etapa es **exacto**: el generador rehace el tablero hasta que
dé justo el que pide. Arriba, «Etapa n de 5», cinco puntos (verde la hecha en el mínimo, amarilla la
hecha con giros de más, blanca la actual, como la tarjeta para compartir); el mínimo lo dice el
marcador de abajo («Giros: n · Mínimo: m»). Al unir las líneas de una etapa se dice
«🚇 ¡Etapa 2 lista!» (o «…en el mínimo!») y llega la siguiente. Cada etapa se puntúa como antes (100
en el mínimo, −15 por giro de más, nunca menos de 10) y la partida vale **el promedio**. El resultado
muestra cada etapa («🟨 Etapa 3: 5 giros (mínimo 4) · 85/100») y la tarjeta para compartir, una línea por
etapa (🟩 en el mínimo, 🟨 si no) sin delatar los tableros. Cada etapa sale de la semilla de la
partida con su número (`dia:<fecha>:etapa-3`). Además, de la revisión de usabilidad: el lema ya no
repite el paso del mínimo, Reiniciar se apaga sin giros y se va al terminar la etapa, el marco que
marca el rectángulo es blanco (el amarillo se confundía con la línea amarilla) y en los cruces hay una
sola estación. Y el **mínimo cuenta las dos soluciones**: el tablero entero dado vuelta también une todas
las líneas, así que la búsqueda hacia atrás parte de la meta y de esa otra (antes, en 8 de 60 tableros
el mínimo dicho era un giro más que el real).
**Por qué:** subir de a poco enseña a ver los giros antes de que lleguen los tableros difíciles, y el
promedio premia jugar bien todas las etapas.
**Alternativas descartadas:** sumar los puntajes (la escala dejaría de ser 0 a 100, como en La Copa);
etapas con mínimo 6 o más (calcularlo exacto en el celular se pone lento).
**Consecuencias:** `engine.test.mjs` revisa que cada etapa tenga su mínimo exacto y sus líneas, que
la dificultad no baje y, a fuerza bruta, que con un giro menos no se llega a ninguna de las dos soluciones; `tools/e2e/routes/lab.mjs` juega las cinco etapas.

## D-295 · Rutas: reloj de 7 minutos, puntaje por capas (completar, rapidez, giros) y rendirse
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-294 (el puntaje)
**Contexto:** el dueño pidió que el puntaje premie, en este orden, completar las etapas, la rapidez y
los giros, también pensando en La Copa: quien completa todas tiene que llevarse más que quien completa
menos, aunque lo haga lento, y quien completa todas rápido y bien, lo máximo. Pidió un reloj de 7
minutos para empezar y un botón para rendirse.
**Decisión:** la partida tiene **7 minutos** (`TIEMPO_S`; arriba, «⏱ 6:42», en rojo el último
minuto). El puntaje (`puntajePartida`) va **por capas**: **17 por etapa completada** (las cinco, 85) y
un bono de hasta **15**, menor que una etapa, así que completar más siempre gana: hasta **10 por
rapidez** (10 si las cinco se terminan en un minuto o menos, 0 al acabarse el reloj, en línea recta
entre medio; solo si se completan todas) y hasta **5 por giros** (5 si todas las etapas hechas fueron
en el mínimo, 0 con el doble o más). Al acabarse el reloj se acaba la partida y cuentan las etapas
hechas. **🏳️ Rendirse** pide un segundo toque («Toca de nuevo para rendirte», como la ayuda de
Pintaminas) y cuenta igual las etapas hechas. El resultado muestra las tres capas («🚇 Etapas (5 de 5):
+85.», «⏱ Rapidez (2:10): +8.», «🔄 Giros (24, mínimo 18): +3.») y cada etapa; el sello dice
«Se acabó el tiempo» o «Te rendiste» si no se completó.
**Por qué:** con el bono menor que una etapa, el orden completar > rapidez > giros se cumple siempre
(4 etapas en el mínimo dan como máximo 73, porque la rapidez solo cuenta con las cinco; 5 lentas y con el doble de giros, 85), y la rapidez pesa el
doble que los giros. Reiniciar sigue gratis en puntos, pero el reloj corre.
**Alternativas descartadas:** el promedio de puntajes por etapa (D-294: no premiaba la rapidez);
bono de rapidez por etapa (se podía alcanzar a quien completaba más).
**Consecuencias:** `engine.test.mjs` revisa los casos límite y que más rápido nunca dé menos;
`tools/e2e/routes/lab.mjs` revisa el puntaje contra el motor, rendirse y el final por tiempo (con
`?test&time=12`, que solo vale en el modo de prueba). En La Copa, con el mismo puntaje desempata quien
terminó antes, como en Desenredo y Zip.

## D-296 · Pintaminas: rendirse, y el puntaje vale la parte pintada
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** amplía D-289
**Contexto:** el dueño pidió un botón para rendirse en Pintaminas, como el de Rutas (D-295).
**Decisión:** bajo los pinceles, **🏳️ Rendirse** junto a la 💡 ayuda, en una fila de dos botones
iguales. Pide un segundo toque («🏳️ ¿Seguro?», 3 segundos), como en Rutas. Al rendirse se destapa el
dibujo entero (lo que no se alcanzó a pintar, más apagado), el sello dice «Te rendiste» y el puntaje
**vale la parte pintada**: (100 − errores − ayudas) × lo pintado de lo que había que pintar (× 1,5 en
el modo difícil). El desglose lo dice («🏳️ Te rendiste con el 33 % pintado: el puntaje vale ese 33 %.»).
Sin confeti.
**Por qué:** como en Rutas, rendirse se lleva lo que alcanzó a hacer; así nunca vale más que terminar.
**Alternativas descartadas:** 0 al rendirse (castiga probar y dejar; en Rutas también cuentan las
etapas hechas).
**Consecuencias:** `engine.test.mjs` revisa el avance y el puntaje al rendirse;
`tools/e2e/paint-mines/lab.mjs` se rinde a mitad de partida.

## D-297 · Números explosivos: prototipo del laboratorio, inspirado en Number Match
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** como D-289 (Pintaminas) y D-293 (Rutas)
**Contexto:** el dueño pidió evaluar Number Match (Easybrain, 50 M+ descargas) y, si valía la pena,
hacer un prototipo; el nombre y las explosiones también los pidió él.
**Decisión:** un juego para uno solo en `/labs/exploding-numbers/` (id `numeros-explosivos`), en
Proyectos activos. Las reglas son las del juego de lápiz y papel del que viene Number Match (Take
Ten): grilla de 9 columnas con números del 1 al 9; se tachan de a pares dos **iguales o que suman
10**, si están **juntos de lado, de arriba abajo o en diagonal** (lo estallado no estorba) o uno al
final de una fila y el otro al comienzo de la siguiente. Una fila estallada entera se va. **➕** copia
al final los números que quedan, 3 veces por partida; con pares a la vista pide un segundo toque.
- **Tablero del día** (36 números, 4 filas), el mismo para todos; `?seed=` da otro. Se arma con una
  salida: sus pares van anidados como paréntesis en el orden de lectura, así que se limpia entero sin
  ➕. Un mal orden igual puede trabarlo.
- **Puntaje sobre 100:** limpiar vale 70 y cada ➕ sin usar 10; si no se limpia (rendirse, o sin
  pares ni ➕), la parte estallada de los 70, contando lo agregado. La 💡 ayuda (dos toques, como en
  Pintaminas) marca un par y resta 10. 🏳️ Rendirse con dos toques.
- **Las explosiones** (pedido del dueño): cada par estalla con una onda, un destello, un 💥 de
  historieta, chispas de su color y pedazos del número; el tablero tiembla. Una fila entera explota
  de punta a punta y se aplasta; al limpiarlo todo, el resumen aparece de inmediato (una sola pantalla
  final, como los otros juegos) y tres estallidos grandes salen de su puntaje, con confeti. Cada número
  lleva en el borde el color de su familia (1 y 9, 2 y 8…). Con movimiento reducido, sin explosiones.
- **La portada** juega sola un tablero chico de 2 filas en su orden, hasta «¡Limpio!».
**Por qué:** es un solitario corto, de reglas que caben en tres líneas, que se juega con el pulgar y
tiene la vuelta diaria de los otros del laboratorio. Las explosiones le dan lo que el original no
tiene. Un tablero que siempre tiene salida evita la frustración de los tableros imposibles.
**Alternativas descartadas:** el puntaje sin tope del original (+1 por par, +10 por fila, +150 al
limpiar), que no se compara entre amigos; ➕ sin límite (vuelve el tablero infinito); tableros al azar
(pueden no tener salida).
**Consecuencias:** `engine.test.mjs` limpia 400 tableros con su orden; `tools/e2e/exploding-numbers/lab.mjs`
juega uno entero. Las casillas miden menos de 44 px a 375 px de ancho (9 columnas, como el original).

## D-298 · Pintaminas: cada dibujo se pinta con sus colores de verdad
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-290 (un color al azar por tablero) y D-291 (dos colores al azar en el modo difícil)
**Contexto:** desde v0.167.2 las cerezas salían rojas con el tallo verde, como son, y los otros
dibujos seguían con colores al azar de `PALETA`: un cactus morado, una bota azul. El dueño pidió que
todos salgan con sus colores de verdad.
**Decisión:** cada dibujo de `DIBUJOS` y `DIBUJOS2` trae sus colores en `colores` (`dibujos.js`): uno
en el modo normal, dos en el difícil (la luna amarilla, el cactus verde, la bota café; la frutilla
roja con hojas verdes, el árbol verde con el tronco café). El tablero se pinta con ellos y el pincel
dice ese color («Pinta café»). `PALETA` suma **café, blanco y rosado** (9 colores). Amarillo y
naranjo siguen sin ir juntos en un dibujo: lo revisa el test, ya no el generador. Los tableros no
cambian: `generar` sigue sacando la baraja de antes sin usarla, para que el azar de las dadas sea el
mismo y los links de antes den el mismo tablero.
**Por qué:** un dibujo con sus colores se reconoce y se disfruta más al destaparse. D-290 había
descartado el color fijo porque delataba el dibujo; el dueño prefiere el dibujo reconocible.
**Alternativas descartadas:** seguir al azar con excepciones dibujo por dibujo (como las cerezas);
cambiar el azar del generador (rompía los links de tableros ya jugados).
**Consecuencias:** `engine.test.mjs` exige que cada dibujo traiga sus colores (de `PALETA`, uno por
color del dibujo, distintos, nunca amarillo con naranjo) y que el tablero salga con ellos. Un dibujo
nuevo tiene que traer `colores`.

## D-299 · La punta a punta no corre en lo que no llega al navegador, y un guion que falla se repite una vez
**Fecha:** 2026-10-12 · **Estado:** corregida por D-307 · **Relación:** corrige D-205; amplía D-193
**Contexto:** el dueño pidió que publicar sea eficaz, sin errores y con el menor cómputo posible.
Medido en GitHub del 2 al 12 de octubre: 712 corridas de `Punta a punta` (58 jobs cada una cuando
corre entera), unos 56.700 minutos de runner. De los 143 PR fusionados desde el 5 de octubre, 9
corrieron los 58 guiones sin tocar nada que un guion mire (`tools/agents/`, workflows, reglas de
Firebase). Y de las 7 veces que `main` salió en rojo, 5 volvieron a verde en la corrida siguiente
sin que nadie tocara ese juego: cada una abrió un issue "main en rojo" y se investigó a mano.
**Decisión:**
- **`tools/e2e/changes.mjs` (`sinNavegador`) salta también** `tools/agents/`, `tools/firebase/`,
  `firebase/` (los guiones de CI no abren salas, D-193) y `.github/` salvo `e2e.yml`. El resto del
  taller (`tools/e2e/`, `tools/release/`, `tools/push/`, `tools/generators/`) sigue corriendo todo:
  ante la duda, se corren.
- **Un guion que falla se repite una vez en su job** (`e2e.yml`). Si pasa al segundo intento, el job
  queda en verde con un aviso ⚠️ "Intermitente" que nombra el guion, y las capturas del primer
  intento quedan como artefacto. Si falla dos veces, el job sale en rojo, como antes.
**Por qué:** un PR del taller esperaba ~8 min y ocupaba 58 de los 20 runners que GitHub da a la vez,
retrasando a los PR que sí tocan el sitio. Un rojo intermitente en un PR obligaba a repetir la
corrida entera (58 jobs) o a empujar un commit vacío; en `main` abría un issue falso. Repetir solo el
guion que falló cuesta su minuto y medio.
**Alternativas descartadas:** repetir hasta tres veces (esconde lo que falla seguido); repetir la
corrida entera desde un workflow (58 jobs por un guion); elegir los guiones por juego según el diff
(de 195 PR desde el 3 de octubre, solo 11 tocaban juegos aislados sin nada compartido: queda como
opción para el dueño, con sus riesgos).
**Consecuencias:** un aviso "Intermitente" es un guion para arreglar: el agente de procesos los cuenta
como patrón (`e2e-intermitente-<guion>`). `changes.test.mjs` fija qué se salta y qué no.

## D-300 · El CHANGELOG por archivo: cada PR deja su entrada sin número y la versión se pone sola
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-205 y D-135 (la versión se asigna al fusionar)
**Contexto:** del 3 al 12 de octubre entraron 125 PR y 89 veces hubo que traer `main` a una rama;
en 64 se resolvió a mano un choque en la primera línea de `CHANGELOG.md`, porque todos agregaban su
`## X.Y.Z` en el mismo lugar, y varias terminaron con la versión renumerada o hacia atrás (el patrón
`version-hacia-atras`). El dueño aprobó la opción del informe de procesos.
**Decisión:**
- **Un PR no escribe en `CHANGELOG.md`**: deja su entrada en `changelog/<rama>.md`, sin número.
  Primera línea `nivel: parche` (o `menor`, o `mayor`), y después las líneas `- …` de siempre.
  `node tools/release/changelog.mjs nueva [nivel]` la crea.
- **La versión de hoy** es la primera entrada de `CHANGELOG.md` subida una vez por cada entrada de
  `changelog/`, en el orden en que llegaron a `main`: manda el commit de la línea principal que
  agregó cada archivo (`git log --first-parent`). `set-version.py --version` y `publish.yml` la
  leen de `changelog.mjs version`; `publish.yml` deja en el resumen de la corrida qué número le
  tocó a cada entrada (`changelog.mjs ver`). Una sola cuenta, en `changelog.mjs`.
- **El agente de procesos las junta** en su ronda (`changelog.mjs juntar`, en su PR): pasan a
  `CHANGELOG.md` con su número y su fecha, y se borran de `changelog/`. La versión publicada no
  cambia al fusionar eso, aunque otro PR haya entrado entretanto (lo prueba `changelog.test.mjs`).
- **El check `pruebas`** (`changelog.mjs revisar --base HEAD^1`) frena una entrada de `changelog/`
  que no se entiende y un PR que agrega un `## X.Y.Z` a `CHANGELOG.md` (salvo el que junta), y
  avisa sin frenar si el PR cambia `public/` sin entrada. Necesita la historia: `tests.yml` y
  `publish.yml` sacan el repo con `fetch-depth: 0` y `filter: blob:none` (los commits y los
  árboles, no el contenido de los archivos viejos).
- **Un PR abierto de antes**, con su entrada numerada en `CHANGELOG.md`, la pasa a `changelog/`
  con `node tools/release/changelog.mjs migrar` antes de traer `main`: deja `CHANGELOG.md` como
  estaba en su base y escribe `changelog/<rama>.md` con el nivel que tenía.
**Por qué:** dos archivos nuevos distintos nunca chocan, y el número que dependía del orden de
fusión ahora sale de ese orden en vez de adivinarlo antes.
**Alternativas descartadas:** que `publish.yml` escriba `CHANGELOG.md` en `main` (la rama exige
los checks y el token del workflow no los dispara); `merge=union` en `CHANGELOG.md` (junta las
dos entradas, pero con el mismo número); ordenar por nombre o por fecha de creación (un PR creado
antes y fusionado después movería versiones ya publicadas).
**Consecuencias:** `version.mjs` (`versionHoy`) y `set-version.py` leen la versión de
`changelog.mjs`. El agente de usabilidad pone la entrada de su ronda en `changelog/` como cualquier
PR; en el PR de otra sesión, la entrada es de esa sesión.

## D-301 · Los números de decisión se reservan, y DECISIONES.md se fusiona decisión por decisión
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-135 (el número de una decisión)
**Contexto:** "el siguiente al más alto en `main` y en los PR abiertos" (D-135) no alcanza cuando
dos sesiones lo miran a la vez: 10 renumeraciones del 3 al 12 de octubre (en el código, los
commits y las guías), y el mismo día de esta decisión #372 y #374 traían el mismo número. Y 52 de
las 89 puestas al día chocaron en `docs/DECISIONES.md`, casi siempre por dos decisiones agregadas
al final o dos números sumados a la misma fila del índice.
**Decisión:**
- **El número se reserva antes de escribirlo:** `node tools/agents/decision.mjs reservar [--cuantas n]`
  toma el siguiente libre (en `main`, en los PR abiertos y en las reservas) y lo sube como rama
  `reserva/D-n` con `git push --force-with-lease=<rama>:` (vacío: "que no exista"); GitHub la niega
  si otra sesión llegó antes, y se prueba el siguiente. `document.mjs revisar` no cuenta como
  hueco un número reservado. La ronda de procesos borra las reservas que ya están en `main`
  (`decision.mjs limpiar`) y anota "número sin usar" las abandonadas.
- **`docs/DECISIONES.md` tiene su driver de fusión** (`.gitattributes`: `merge=decisiones`,
  configurado en la copia por `reservar` o `decision.mjs instalar`). Al traer `main`, junta
  decisión por decisión: las nuevas de cada lado entran en orden; una cambiada de un solo lado
  queda con ese cambio; en el índice, las filas se juntan por su tema, y dos lados que suman
  decisiones distintas a la misma fila quedan con las dos. Lo que los dos lados cambian distinto
  (la misma decisión, el mismo número para dos decisiones, otra cosa de la misma fila) queda en
  conflicto, como siempre. GitHub no usa el driver: solo la copia local, que es donde se resuelve.
**Por qué:** pasados por el driver, 36 de los 53 choques de DECISIONES.md del 3 al 12 de octubre
se habrían juntado solos (30 igual que a mano; en los otros 6 la persona había agregado algo más en
el merge, y en uno había dejado D-282 repetida); los 17 que quedan en conflicto eran números
repetidos, que la reserva evita.
**Alternativas descartadas:** `merge=union` en todo el archivo (con una fila del índice editada en
los dos lados deja las dos filas, y una decisión editada en los dos lados, mezclada); un archivo
por decisión (el cambio más grande, y el índice seguiría siendo uno).
**Consecuencias:** en un fork no se puede reservar: la decisión sigue como `D-??` (D-189).
`decision.test.mjs` prueba el driver con git de verdad.

## D-302 · Publicar espera la punta a punta de main
**Fecha:** 2026-10-12 · **Estado:** corregida por D-308 · **Relación:** corrige D-205 y D-193 (la punta a punta de `main` corría aparte y no frenaba la publicación) y D-273 (la fusión de un toque corría los dos workflows)
**Contexto:** `main` no exige estar al día antes de fusionar, así que lo fusionado se prueba de
verdad recién en `main`, y `publish.yml` no lo esperaba: de los 7 rojos de `main` del 4 al 12 de
octubre, los 7 se publicaron igual. Con el segundo intento de D-299, un rojo ya no es una falla
pasajera, y esperar cuesta lo que tarda la punta a punta (~8 min).
**Decisión:** `publish.yml` llama a `e2e.yml` (`workflow_call`) junto con `tests.yml`, y las
reglas de Firebase y el sitio se publican solo si pasan las dos. `e2e.yml` ya no corre por su cuenta
en cada push a `main` (sería la misma corrida dos veces); sigue en cada PR y a mano. Su job
`avisar` abre el issue "main en rojo" desde dentro de Publicar, y `cerrar-aviso` lo cierra cuando
vuelve a verde. La fusión de un toque (`approve.mjs fusionar`) corre solo `publish.yml`.
**Por qué:** pedido del dueño: que lo que se publica esté probado entero.
**Alternativas descartadas:** `workflow_run` (correría el `publish.yml` de `main` sobre otro
commit, y una fusión de un toque no lo despierta); exigir que la rama esté al día antes de
fusionar (cada PR tendría que traer `main` y correr todo de nuevo).
**Consecuencias:** publicar tarda unos 8 minutos más. Un rojo de verdad deja el sitio en la versión
anterior hasta que `main` vuelva a verde. `processes.mjs revisar` mira la última corrida de
`publish.yml` para saber si `main` está en verde.

## D-303 · Un solo push al terminar
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-135 (cómo se trabaja en una rama), D-132 y D-172 (los agentes subían sus arreglos al PR cada uno)
**Contexto:** cada push a un PR lanza los 58 guiones de la punta a punta y cancela la corrida
anterior. Del 2 al 12 de octubre, 274 corridas se cancelaron así (un tercio de los minutos de
runner), 194 de ellas porque el push siguiente llegó en menos de 3 minutos: la sesión y los dos
agentes empujando de a un commit.
**Decisión:** los commits se hacen en local y se suben **juntos, una vez**, cuando el trabajo está
listo. En el PR de una sesión, los agentes de usabilidad y de documentación hacen sus commits sin
push, y la sesión dueña sube todo cuando terminan. Las rondas de los agentes y de procesos, igual:
un push al final. Un arreglo que pide el CI o un comentario es otro push, y está bien.
**Por qué:** el dueño eligió esto antes que hacer esperar 3 minutos a cada corrida del PR.
**Alternativas descartadas:** una espera de 3 minutos en el job `lista` de `e2e.yml` (se
descartó por ahora: suma 3 minutos a cada PR).
**Consecuencias:** `CLAUDE.md` y las guías de los tres agentes lo dicen donde dicen cómo entregar.

## D-304 · La revisión de usabilidad según la etapa del juego
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-132, D-172 y D-204 (qué revisan los agentes en un PR)
**Contexto:** un juego pasa por un PR que lo trae al laboratorio, PR de ajustes dentro de él y un PR
que lo saca. En los del laboratorio (35 de 119 PR del sitio desde el 5 de octubre) el juego cambia
mucho y lo juega poca gente; en el que lo saca, el agente revisaba un diff de una línea (`labs:
true`) justo cuando el juego llega a todos.
**Decisión:** `node tools/agents/covers.mjs revisar` dice la etapa en su primera línea:
- **🧪 Solo del laboratorio** (todo lo de `public/` está en `public/labs/`): documentación y
  usabilidad corta: la revisión de portadas (U-36) y las pantallas que cambiaron, a 320 px.
- **🎓 Saca un juego del laboratorio** (pierde `labs: true` en `games.js` o en `cup/rules.js`, o su
  carpeta sale de `public/labs/`): pasada completa de usabilidad al juego entero —todas sus
  pantallas, los cuatro idiomas, 390 y 320 px, sus textos y mensajes, su portada y su lugar en la
  portada general— y documentación con el README y la tarjeta social.
- **Todo lo demás:** los dos agentes, como siempre.
**Por qué:** pedido del dueño: la revisión fuerte va donde el juego llega a todos. En el
laboratorio no se saca del todo: 8 de los ~15 PR con arreglos de usabilidad de esos días eran del
laboratorio, casi siempre de portadas y de textos cortados a 320 px, que la revisión corta mira.
**Consecuencias:** `covers.test.mjs` prueba la etapa y la salida del laboratorio (por la bandera y
por la carpeta). Las guías de usabilidad, documentación y procesos lo dicen en su modo PR.

## D-305 · Las píldoras de La Copa y Uno al día, abajo a la izquierda
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** completa D-239 (cómo se ordena la tarjeta de media fila)
**Decisión:** en las dos tarjetas de media fila de la portada, las píldoras (👥 jugadores y ⏱ días
en La Copa; la racha o cómo va hoy en Uno al día) van abajo a la izquierda de la tarjeta, aparte de
la bajada. La última fila de la grilla (`grid-template-rows: auto auto 1fr`) se lleva el alto que
sobra y las píldoras se apoyan en su borde de abajo (`align-self: end`), así quedan a la misma
altura en las dos tarjetas aunque una bajada sea más larga que la otra. Lo pidió el dueño: antes la
píldora de Uno al día quedaba pegada a su bajada, a media tarjeta, y se leía como parte del texto.
- **"Jugar el de hoy" pasa a "Jugar hoy"** (EN *Play today*, PT *Jogar hoje*; el alemán ya decía
  *Heute spielen*), también por pedido del dueño: a 320 px y con racha, "🔥 12 · Jugar el de hoy" no
  cabía en la píldora y se partía en dos líneas. Es la misma clave (`uad.jugar`) en todas partes, así
  que cambia también el botón del desafío de un amigo y el de los juegos que abren con `?today`
  (Ahorcado, Generala, Batalla Naval y Dudo): una acción, una palabra (U-5).
**Alternativas descartadas:** una línea o un fondo que separe las píldoras (más ruido en una
tarjeta chica); igualar el largo de las bajadas (cambia con el idioma).

## D-306 · El feedback dice con qué llave se entró, no muestra su JSON y se sube cada 15 minutos
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** amplía D-104 (un campo más en el reporte), D-279 (quién manda el feedback) y D-284 (una llave por persona); corrige D-275 en que se subía cada hora
**Decisión:** tres cambios al feedback 🐞, los tres pedidos por el dueño:
- **Quien entró al laboratorio con su llave manda también su etiqueta.** Cuando una llave abre la
  puerta, `labs-puerta.js` guarda su etiqueta (`juegos-de-salon:labs-quien`, nunca la llave) y
  `enviarReporte` (`cup/reportes.js`) la agrega al reporte como `tester`, en todos los formularios
  (el 🐞, el del final de cada juego del laboratorio y el de La Copa). El issue la muestra en una
  línea **Llave** y `reports.mjs` entre paréntesis. Las reglas de `feedback/` aceptan `tester`
  (hasta 24 letras, como una etiqueta).
- **El formulario ya no muestra el contexto.** El desplegable "Lo que se envía junto" mostraba el
  JSON tal cual (`labs`, `pantallaTam`, `navegador`…): la estructura interna, en una pantalla que
  ve cualquier jugador. El contexto se sigue mandando igual; solo se deja de mostrar, y se van sus
  textos en los cuatro idiomas.
- **El feedback se sube cada 15 minutos, no cada hora** (`feedback.yml`, cron `7,22,37,52`): el
  dueño pidió que cada comentario quede como issue. Eso ya pasaba (D-275), pero GitHub atrasa los
  horarios y con uno por hora el workflow corrió unas 4 veces al día. Instantáneo no se puede sin
  servidor: el sitio es estático y el formulario no tiene con qué abrir un issue.
**Por qué:** el nombre escrito es opcional y a veces es un apodo ("Tu admirador secreto"); la
etiqueta la puso el dueño al dar el link, así que sabe a quién preguntarle. No revela nada privado:
la etiqueta ya es pública en el repo (D-284) y nunca viaja la llave. Mostrar el JSON servía para
depurar, pero en una app de cara al jugador deja ver cómo está armada por dentro.
**Alternativas descartadas:** meter la etiqueta dentro de `contexto` (no tocaba las reglas, pero el
contexto se corta a 500 letras y lo último se pierde); mostrar el contexto en palabras ("se envía la
página y el tamaño de la pantalla"), que suma texto a un formulario que debe ser corto.

## D-307 · La punta a punta en grupos parejos, y los guiones esperan a una condición, no una pausa fija
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-193 y D-204 (un job por guion) y D-299 (dónde se repite un guion que falla)
**Contexto:** el dueño pidió acelerar el CI. Medido en las últimas 60 corridas de PR: la punta a
punta tardaba 9,7 min de mediana (16,9 en el p90). Eran 58 jobs, uno por guion, para 20 runners: la
mitad esperaba en la cola, y cada job pagaba ~17 s de preparación. Y el camino crítico eran dos
guiones de 5 min (`cup/languages.mjs` y `cup/tournament.mjs:copa`), hechos casi todo de pausas fijas
(`sleep`, `go(url, 1500)`, 700 ms entre paso y paso de `paths.mjs`).
**Decisión:**
- **Grupos:** `tools/e2e/groups.mjs` reparte los guiones en grupos parejos según lo que tardó cada
  uno (`tools/e2e/durations.json`): el más largo primero, al grupo más liviano, los grupos que hagan
  falta para no pasar de ~4,5 min (o del guion más largo), hasta 18. `e2e.yml` corre un job por
  grupo (`ci.mjs --grupos`), todos a la vez. Cada job deja un aviso "Duraciones" con lo que tardó
  cada guion, y `groups.mjs medir` lo pasa a `durations.json` (la ronda de procesos, una vez por
  semana). Un guion nuevo cuenta como 90 s hasta que se mide.
- **Dentro del grupo, lo de cada guion:** la tabla del resumen nombra cada guion con su tiempo y su
  resultado (⚠️ si pasó al segundo intento); el segundo intento es por guion, en el acto
  (`CI_REINTENTOS=1` en `ci.mjs`, en vez de un paso del workflow); el artefacto `capturas-g<n>` trae
  una carpeta por guion, solo de lo que falló o pasó al segundo intento; y un guion que falla dos
  veces deja un aviso que lo nombra.
- **Esperas por condición:** `cdp.mjs` suma `abrir(url, tope)` (navega, espera el `load` y que la
  página se asiente), `asentar(tope)` (sin cambios en el DOM por 150 ms y las animaciones finitas
  terminadas) y `hasta(expr, tope)`. El tope es la pausa de antes: nunca se espera más, y casi
  siempre mucho menos. Los usan los guiones de idiomas (`languages-common.mjs`), `cup/languages.mjs` y la
  vuelta de cada día de `cup/tournament.mjs`. Un paso `1` de `paths.mjs` sigue siendo una espera de
  700 ms a propósito (que pase el confeti, que el celular juegue). Ningún chequeo se sacó.
**Por qué:** pedido del dueño; los números van en Consecuencias.
**Alternativas descartadas:** un job por guion con más runners (GitHub da 20 a un repo gratis);
acortar la cuenta de 3 a 1 en el modo de prueba (es código de la app, y la cuenta es parte de lo
que se prueba); cambiar `go()` para todos los guiones de una vez (algunos esperan a propósito a que
pase algo con el reloj: se cambian de a uno, mirándolos).
**Consecuencias:** medido aquí, guion por guion: `cup/tournament.mjs:copa` de 294 a 237 s,
`cup/languages.mjs` de 304 a 173 s, `hangman/languages.mjs` de 128 a 61 s, `generala/languages.mjs` de
162 a 90 s, `cup-games/languages.mjs:queens` de 117 a 81 s; los 221 chequeos de la copa y los de cada
idioma, iguales. Los 59 trabajos quedan en 13 grupos de ~4,4 min (`groups.mjs ver`): 13 jobs en vez
de 58, todos de una en los runners. Lo medido en GitHub antes y después va en el PR.
Un guion nuevo usa `abrir`, `asentar` y `hasta`; `sleep` queda para lo que de verdad depende del reloj.

## D-308 · Publicar no repite la punta a punta de lo que ya pasó en el PR
**Fecha:** 2026-10-12 · **Estado:** vigente · **Relación:** corrige D-302 (publicar corría la punta a punta entera en cada fusión)
**Contexto:** desde D-302, publicar esperaba la punta a punta de `main`: la primera publicación así
tardó 8 min (antes, ~2). Pero casi siempre era la misma prueba dos veces: de los 96 últimos PR
fusionados, en 79 el árbol que llegó a `main` era idéntico, archivo por archivo, al merge de prueba
que su punta a punta ya había pasado (`main` no exige ramas al día, así que en los otros 9 con
guiones `main` había avanzado entre la prueba y la fusión; en los 8 restantes, el PR no tenía
guiones o no tenía corrida).
**Decisión:** cada corrida de `e2e.yml` que pasa con guiones sube una marca, el artefacto
`e2e-arbol-<árbol>` (7 días), con el SHA del árbol que probó. `publish.yml` corre primero
`tools/e2e/already-tested.mjs`: si el árbol del commit que publica tiene marca de una corrida de este
repo (no de un fork, que corre su propia versión del workflow), salta la punta a punta; si solo
cambia lo que no llega al navegador (`changes.mjs`) sobre un padre con marca, también, y deja la
suya. Si no, o si algo falla al preguntar, la corre entera, como en D-302. Las pruebas sin
navegador corren siempre.
**Por qué:** pedido del dueño: no pagar dos veces la misma prueba, sin publicar nada que no se haya
probado igual.
**Alternativas descartadas:** exigir ramas al día en `main` (la marca serviría siempre, pero cada PR
tendría que traer `main` y correr todo otra vez cada vez que entra otro: se le deja al dueño);
comparar el commit del PR en vez del árbol (un merge de prueba y la fusión de verdad son commits
distintos con el mismo contenido).
**Consecuencias:** publicar tarda ~2 min cuando el árbol ya pasó (lo de antes de D-302) y ~8 cuando
no. Una marca dura 7 días: un PR que se fusiona más tarde sin volver a correr la punta a punta la
corre en `main`. `already-tested.test.mjs` prueba la decisión, y que una marca de un fork no vale.

## D-309 · Aire entre el tablero y sus botones, igual en todos los juegos
**Fecha:** 2026-10-13 · **Estado:** vigente · **Relación:** completa U-11 (que pedía botones "con aire" sin decir cuánto) y C-8
**Contexto:** en Agentes, el tablero final quedaba a 10 px de "Compartir mi resultado". El
inventario de los juegos mostró lo mismo en otros diez (Caso, Tango, Zip, Desenredar, la línea de
Línea de Tiempo, Generala, el mar de Batalla Naval, y los repasos de las pantallas de resultado), y
otros entre 13 y 26 px: cada juego había resuelto la separación por su cuenta, con márgenes
sueltos, y nada lo verificaba.
**Decisión:** todo tablero de juego —y el bloque que resume la partida en un resultado (un
repaso, el podio, las palabras)— lleva `data-tablero`, y `base.css` le da `--aire-tablero`
(**28 px**) hasta lo que viene debajo, y gana sobre el margen propio del juego (`!important`). Lo
que ya separa se descuenta: el gap del contenedor (`--gap-contenedor`; el `.stack`, 12 px) y el
relleno de la barra de botones de abajo (`--aire-ya`, que el juego declara en su tablero: 10 px en
Línea de Tiempo, Batalla Naval y Generala, 12 en el Ahorcado, 20 en el Julepe). Uno dentro de otro no
suma. Los márgenes sueltos que hacían lo mismo (`margin-top: 14px` en
`#result-actions`, `margin-top: 12px !important`) salen. Lo verifica `tools/e2e/spacing-common.mjs`:
**cada captura de cualquier guion** mide la distancia del tablero al primer botón de abajo y marca
✗ si es menos de 24 px, y `look.mjs` la informa en cada pantalla.
**Por qué:** pedido del dueño: "da un poco de aire entre el tablero de juego y los botones… que se
convierta en algo estándar".
**Alternativas descartadas:** arreglar cada juego con su margen (es lo que había y se desordenó);
un guion con caminos a cada pantalla (las capturas de los guiones de partida ya pasan por todas, y
uno nuevo se vigila solo).
**Consecuencias:** un juego nuevo marca su tablero con `data-tablero` (C-8) y queda con el mismo aire;
si un botón queda pegado, su guion sale en rojo.

## D-310 · Loteo: prototipo del laboratorio, inspirado en Shikaku
**Fecha:** 2026-10-13 · **Estado:** vigente · **Relación:** como D-289 (Pintaminas), D-293 (Rutas rotas) y D-297 (Números explosivos)
**Contexto:** el dueño pidió un prototipo de Shikaku (Nikoli, 1989) para el laboratorio. Se armó con
un nombre provisorio, «Parcelas», y antes de publicarlo eligió **Loteo**.
**Decisión:** un juego para uno solo en `/labs/plots/` (id `loteo`), en Proyectos activos. Las reglas
son las de Shikaku: una grilla con algunos números se divide entera en rectángulos, cada uno con
exactamente un número, que es su área. Cada tablero tiene **solución única**.
- **El gesto:** arrastrar de una esquina a otra dibuja un lote (el arrastre de Rutas rotas), con su
  medida en vivo («2×3 = 6»). Si vale, se pinta de un color claro (dos vecinos nunca del mismo) y
  reemplaza los lotes que pisa; si no, el marco tiembla en rojo y el aviso dice por qué (sin número,
  con dos números, o el área: «El 6 pide 6 casillas; ese tiene 4.»). Tocar un lote lo borra; tocar un
  1 lo dibuja.
- **Cinco tableros** (pedido del dueño, antes de fusionar: eran tres), con el reloj subiendo (sin
  límite), como las etapas de Rutas rotas: dos para calentar los dedos (5×5 y 6×6) y tres difíciles
  (7×7, 7×7 y 8×8), con lotes más grandes, ninguno a la vista de entrada y más pasos de deducción. El
  de hoy (`dia:<fecha>`) es el mismo para todos; `?seed=` da otro.
- **El generador** parte la grilla al azar (en los fáciles prefiere áreas de 3 a 8 y pocas de 1; en
  los difíciles, de 4 a 10, sin 1 y casi sin 2), reparte los números lejos entre sí (en los difíciles,
  además, lejos de las esquinas de su lote) y le pide al resolvedor que no haya otra solución y a
  `deducir` que se resuelva sin adivinar. Los fáciles se quedan con el primero que sirve; los difíciles
  arman varios y se quedan con el que pide más rondas de deducción y deja menos lotes a la vista.
- **Puntaje sobre 100:** 12 por tablero resuelto y, solo con los cinco, hasta 40 por rapidez (40 en
  5 minutos o menos, 0 en 15 o más, en línea recta entre medio). La 💡 ayuda (dos toques, como en
  Pintaminas) pone un lote de la solución, con el borde punteado, y resta 10.
- **Los controles**, abajo en una fila (pedido del dueño): ↩ Deshacer (gratis), 🧹 Borrar (dos
  toques; deja el tablero vacío y Deshacer lo trae de vuelta) y 🏳️ Rendirse (dos toques; vale los
  tableros hechos y muestra cómo se resolvía el de ese momento). La 💡 ayuda va aparte, más chica,
  debajo: no es un control del tablero.
- **La portada** resuelve sola un 5×5, lote por lote, con el marco creciendo como cuando se arrastra,
  y al final dice «¡Listo!» grande sobre el tablero.
**Por qué:** es un puzzle de lógica de reglas que caben en dos líneas, con un gesto que ya existe en
el laboratorio, y la solución única hace que siempre se pueda deducir sin adivinar. Los colores
convierten el tablero resuelto en un mosaico.
**Alternativas descartadas:** un solo tablero grande (las etapas dan un comienzo fácil); tres
tableros de 5×5 a 7×7 (la primera versión: el dueño pidió más y más difíciles); un límite de tiempo como Rutas rotas (aquí el reloj solo paga la rapidez: un tablero de
lógica a medias no se corta); validar el lote recién al terminar el tablero (el original no avisa,
pero aquí el aviso enseña la regla mientras se juega).
**Consecuencias:** `engine.test.mjs` genera tableros de cada etapa y comprueba que tengan una sola
solución, que se deduzcan sin adivinar, que esta los resuelva, que los números no queden pegados y que
las difíciles pidan más rondas y dejen menos lotes a la vista que las fáciles; `tools/e2e/plots/lab.mjs`
juega los cinco de punta a punta y prueba Borrar. El
nombre está en un solo lugar en `game.js` (`T.nombre`), además del título de la página, la tarjeta del
laboratorio y los documentos.

## D-311 · Loteo: el modo «Servicios», con lotes del mismo tamaño
**Fecha:** 2026-10-13 · **Estado:** corregida por D-312 · **Relación:** amplía D-310; el selector, con el espíritu de la palanca de Pintaminas (D-290); corregida por D-312 (los difíciles, más difíciles: ahora 6×6 de 6 y dos 8×8 de 8, sin el 8×8 de 4, con ningún lote a la vista de entrada y deducciones más profundas)
**Contexto:** el dueño pidió, en la portada de Loteo, un modo que se activa para jugarlo («Utilities»;
en la app, «Servicios»): en vez de números, la grilla trae íconos de servicios, ⚡ luz y 💧 agua, y
cada lote lleva exactamente un ⚡ y un 💧. Antes de construirlo se midió con lotes al azar y un ⚡ y un
💧 al azar en cada uno: **sin un tamaño fijo, casi ningún tablero tiene solución única (1 a 2 %)**; con
todos los lotes del mismo tamaño, sí. Con el generador de esta decisión (2000 tableros de cada uno):
6×6 de 3, 81 % únicos; 6×6 de 4, 29 %; 6×6 de 6, 47 %; 8×8 de 4, 15 %; 8×8 de 8, 33 %. Todos los
únicos se deducen sin adivinar.
**Decisión:** un segundo modo de Loteo, con las mismas reglas de juego (dibujar, borrar, deshacer,
🧹 Borrar, 🏳️ Rendirse, 💡 Ayuda, reloj, puntaje y final):
- **Las reglas:** dividir el tablero entero en lotes rectangulares **todos del mismo tamaño**, que se
  dice arriba del tablero («Lotes de 4 casillas», junto al reloj), y **cada lote con exactamente un ⚡
  y un 💧**. Un lote que no vale tiembla en rojo y el aviso dice por qué: «Ese lote tiene 3 casillas;
  cada lote tiene 4.», «Le falta 💧.» o «Tiene dos ⚡: cada lote lleva uno.».
- **Cinco tableros**, como el modo de números (y el mismo puntaje): dos para calentar, 6×6 en lotes
  de 3 y 6×6 en lotes de 4, y tres difíciles, 6×6 de 6, 8×8 de 4 y 8×8 de 8. Elegidos midiendo los
  pasos de `deducirServicios` (rondas, y lotes a la vista de entrada, de 120 tableros por etapa):
  2,9 y 9,9; 3,2 y 6,3; 5,3 y 1,4; 6,1 y 4,7; 4,7 y 1,9. Un tamaño distinto en cada tablero hace que
  «Lotes de n casillas» diga algo nuevo cada vez.
- **El generador** (`generarServicios`) parte la grilla en rectángulos del tamaño pedido (todas las
  formas: 1×4, 2×2, 4×1…), pone en cada uno un ⚡ y un 💧 en casillas distintas (barajadas con
  Fisher-Yates, determinista con la semilla) y se queda con uno de solución única (un resolvedor que
  cuenta hasta 2) que `deducirServicios` resuelva sin adivinar: un ícono o una casilla que solo cabe en
  un lote posible lo fija, y una casilla que solo alcanzan los lotes de un mismo ⚡ (o 💧) obliga a ese
  lote a cubrirla. Los fáciles se quedan con el primero; los difíciles arman 20 y se quedan con el que
  pide más pasos. Cada tablero tarda unos milisegundos.
- **Sin 🌐 internet:** se midió un tercer servicio. Da más tableros únicos (8×8 de 4: 32 % en vez de
  15 %), pero más fáciles (3,1 rondas y 12,8 lotes a la vista en vez de 4,0 y 9,1): no se usa.
- **La portada:** un selector de dos opciones, «🔢 Números» y «⚡💧 Servicios», bajo el crédito. Al
  cambiar, cambian el lema, los pasos y la demo (un 4×4 en lotes de 4, que se resuelve solo). El
  celular recuerda el modo y el link lo dice: `?mode=utilities` (C-18; `?mode=numbers` fuerza el de
  números). «Otro tablero» y «El de hoy» lo conservan.
- **La señal de uso** cuenta las partidas de este modo como `mode: 'servicios'`; la tarjeta para
  compartir y el final dicen «⚡💧 Servicios».
**Por qué:** el tamaño fijo es lo que hace única la solución, y además es una regla que se entiende
de un vistazo. Con él, el modo se juega con el mismo gesto y la misma pantalla que el de números.
**Alternativas descartadas:** lotes de cualquier tamaño (1 a 2 % de tableros únicos, y la regla no
dice cuántas casillas buscar); una palanca de encendido como la de Pintaminas (aquí no hay un modo
«apagado»: son dos modos, y un selector de dos opciones dice cuál está elegido); el 🌐 en la última
etapa (más fácil, no más difícil); dos tableros de 8×8 de 4 al final (uno de 8×8 de 8 deja menos lotes
a la vista y cambia el tamaño).
**Consecuencias:** `engine.test.mjs` genera 120 tableros de cada etapa del modo y comprueba que tengan
una sola solución, que se deduzcan sin adivinar, que cada lote de la solución sea del tamaño justo con
un ⚡ y un 💧, que las difíciles pidan más pasos que las fáciles, que tarden menos de 300 ms, la
validación con sus motivos y la tarjeta; `tools/e2e/plots/utilities.mjs` juega el modo de punta a punta.

## D-312 · Loteo, modo Servicios: los difíciles, más difíciles
**Fecha:** 2026-10-13 · **Estado:** vigente · **Relación:** corrige D-311 (sus etapas difíciles)
**Contexto:** el dueño pasó el modo «⚡💧 Servicios» «con algo, pero no mucha, dificultad» y pidió
endurecerlo con tres palancas: elegir mejor los tableros, exigir deducciones más profundas y poner los
íconos donde confunden.
**Decisión:** solo en los tres tableros difíciles (los dos de calentar quedan iguales, con los mismos
tableros):
- **Deducciones más profundas:** `deducirServicios` cuenta las veces que hace falta la regla (2) de
  `propagar` (una casilla cuyos lotes posibles llevan todos el mismo ícono) y, si las reglas simples se
  traban, mira un paso adelante (un lote que lleva a una casilla sin lote no va). Un difícil sirve solo si
  no muestra ningún lote de entrada y pide al menos `exige` de esas deducciones (3, 4 y 6); de 8 que
  sirvan, se queda con el más difícil.
- **Íconos que confunden:** `ubicarIconos` los pone de preferencia en el borde del lote que toca a otro
  lote, cerca de los íconos del vecino.
- **Etapas:** 6×6 de 6 y dos 8×8 de 8. El 8×8 de 4 salió: con lotes tan chicos siempre dejaba lotes a
  la vista (2,4 en promedio).
- **La portada lo explica** («Si un lote deja una casilla sin lote posible, no va.», «los 3 últimos, difíciles»), y
  al empezar el primer difícil el aviso dice «Difíciles: si un lote deja una casilla sin lote posible, no
  va.» (en dos líneas a 320 px, para no mover el tablero).
- `lotesPosibles` cuenta con sumas acumuladas: el generador tarda menos de 250 ms en el peor caso.
**Medido** (promedio por tablero, antes → ahora): lotes a la vista de entrada 1,4 / 4,7 / 1,9 → 0 / 0 / 0;
rondas de deducción ~5 → ~9; deducciones profundas → ~5 por tablero. Mirar un paso adelante casi
nunca hace falta: la regla (2) ya es bastante exigente.
**Alternativas descartadas:** tableros de 10×10 (no caben en un teléfono); un tercer servicio (hace los
tableros más fáciles, D-311); terreno donde no se puede construir (cambia las reglas; queda para después
si esto no alcanza).
**Consecuencias:** `engine.test.mjs` exige que los difíciles no muestren lotes de entrada (85 % o más) y
pidan 3 o más deducciones profundas por tablero; `tools/e2e/plots/utilities.mjs` revisa el aviso del
tablero 3.

## D-313 · Los PR de las rondas de usabilidad y documentación se fusionan solos
**Fecha:** 2026-10-13 · **Estado:** vigente · **Relación:** corrige D-132 y D-172 (sus PR "no se fusionan"); extiende D-216 (auto-merge por defecto) a las rondas que lanza el agente de procesos (D-276)
**Decisión:** El PR de cada ronda de usabilidad y de documentación lleva auto-merge, como todo PR
listo (D-216): entra solo cuando `pruebas` y `punta-a-punta` pasan. La ronda parte siempre de
`main`, nunca de la rama de otro PR. Si cambia algo de `public/`, lleva su entrada sin número en
`changelog/` (D-300). Un PR con una pregunta cuya respuesta cambia lo que trae no lleva
auto-merge. Los reportes 🐞 dejan de ser de la ronda de usabilidad (ya eran del agente de
procesos desde D-275): su guía lo dice.
**Por qué:** había seis PR de rondas esperando, el más viejo del 5 de octubre: la documentación
quedaba atrás aunque el agente ya la había escrito, cada ronda partía de una base vieja y los PR
chocaban entre ellos. Lo aprobó el dueño el 11 de octubre (issue #321, decisión 3). El cambio se
escribió ese día como "D-274" en una copia que nunca llegó a GitHub, y ese número lo tomó otra
decisión; entra ahora con número reservado (D-301).
**Alternativas descartadas:** seguir revisando cada ronda a mano (se acumulaban); que el agente de
procesos fusione las rondas (un día más de atraso, y otro paso que puede fallar).
**Consecuencias:** el dueño ve los arreglos de las rondas ya publicados y los corrige después,
como con los textos (U-3).

## D-314 · El acierto también cuenta el dato de la carta, en el veredicto
**Fecha:** 2026-10-14 · **Estado:** vigente · **Relación:** corrige D-277 (la franja del acierto); toma una de sus alternativas descartadas
**Decisión:** En Línea de Tiempo y ⏳ Línea Relámpago (solo, práctica, Uno al día y copa), el
veredicto de un **acierto** cuenta el dato de la carta igual que el de un error, bajo la carta con
su año. Se cierra solo cuando se vacía la barra de 6 s (`PAUSA_DATO_MS`), o antes con un toque; en
Línea Relámpago el reloj se pausa mientras tanto, como en el error. En sala (varios celulares), la
jugada de otro con dato también espera los 6 s, con la barra; en un celular el veredicto se cierra
con un toque, como antes. Una carta sin dato cierra el acierto como antes (1,4 s en Relámpago,
2,4 s en sala). La franja sobre el botón de colocar desaparece.
**Por qué:** lo pidió el dueño: el dato "solo aparece cuando el usuario pierde". La franja chica,
abajo y pasajera no se notaba, y el dato de un acierto es igual de interesante que el de un error.
**Alternativas descartadas:** dejar la franja y hacerla más grande o más larga (sigue apareciendo
cuando el jugador ya mira la carta siguiente); cerrar el acierto con un toque siempre (sin barra
no se sabe que se cierra solo, y en Relámpago frenaría a quien no quiere leer).
**Consecuencias:** cada acierto con dato frena el juego hasta 6 s, que no cuentan en el reloj. El
guion `tools/e2e/timeline/fact.mjs` revisa que el acierto muestre el dato, pause el reloj y se
cierre solo o con un toque.

## D-315 · La carpeta de proyectos se limpia sola, también las ramas y la basura de pruebas
**Fecha:** 2026-10-14 · **Estado:** vigente · **Relación:** completa D-252 (qué barre `clean-worktrees.mjs`) y D-276 (la ronda del agente de procesos); completa D-213 (los guiones de `tools/e2e/`)
**Decisión:** Pedido del dueño: en el Mac mini, la carpeta de proyectos tiene `juegos-de-salon` y
solo las copias con trabajo en curso, todos los días y no solo al abrir una sesión.
- **La ronda diaria del agente de procesos corre `node tools/agents/clean-worktrees.mjs`** desde la
  carpeta principal y cuenta en su informe qué borró, qué dejó y por qué. El hook de inicio de
  sesión sigue igual.
- **Ramas locales sin copia:** la herramienta borra las que ya entraron a `main` y las que no
  tienen rama en GitHub (se borró al fusionar, o nunca se subió) pero cuyos commits están todos en
  GitHub. Una con commits que no están en GitHub **se nombra y se deja**: no se sube, porque puede
  ser historia de antes de una reescritura. Nunca `main`, la rama de una copia viva ni la de un PR
  abierto; sin `gh`, solo las que ya entraron a `main`.
- **Basura de pruebas:** una carpeta sin seguimiento en la raíz de una copia, con nombre de
  argumento perdido (`undefined`, `null`, o que empieza con `-`) y dentro solo perfiles de Chrome
  (una carpeta con `Local State`) y capturas o datos (`.png`, `.jpg`, `.webm`, `.json`, `.txt`,
  `.log`), no cuenta como cambio sin commitear, y se borra con la copia. Cualquier otro archivo la
  vuelve real, y los cambios reales siguen sin tocarse nunca.
- **La causa se cierra en los guiones:** la carpeta de salida sale de `salida()`
  (`tools/e2e/output.mjs`), que acepta el primer argumento solo si es una carpeta de verdad; si no,
  la que el guion da por defecto o una nueva en el directorio temporal. `launch` (`cdp.mjs`) se
  niega a abrir Chrome con un perfil en `undefined/` o `--parte/`, y `tools/e2e/output.test.mjs`
  falla si un guion vuelve a leer `process.argv[2]` a mano.
**Por qué:** en la limpieza del 13 de octubre quedaron vivas dos copias fusionadas
(`caso-labs-portada`, `telemetria`) por carpetas `undefined/` (64 MB) y `--parte/` (75 MB): los
guiones hacían `const OUT = process.argv[2]`, y corridos sin carpeta (`undefined`) o con un flag
primero (`tournament.mjs --parte copa`) dejaban capturas y un perfil de Chrome dentro de la copia. Y
había 74 ramas locales viejas en la carpeta principal, que nada borraba.
**Alternativas descartadas:** limpiar a mano (vuelve a pasar); subir a GitHub las ramas con commits
propios antes de borrarlas, como las copias abandonadas (tras la reescritura del 13 subiría historia
vieja); ignorar `undefined/` en `.gitignore` (escondería la basura sin borrarla y sin arreglar la
causa).
**Consecuencias:** el informe de cada ronda de procesos dice cómo quedó la carpeta; un guion nuevo de
punta a punta usa `salida()` (la prueba lo exige).

## D-316 · Repository language: English, for everything internal
**Date:** 2026-10-14 · **Status:** current · **Relation:** amends D-78 (only the README was English), C-13 and D-266 (code variable names stayed Spanish); extends D-192 and D-266 (folders and URLs were already English) to everything internal
**Decision:** Owner's request: everything internal to the repo is in English, content and names
alike. That covers documents (canons, decisions, specs, requirements, changelog, agent and skill
instructions, `CLAUDE.md`), code comments and identifiers, file and folder names, tool messages,
commit messages, PR titles and bodies, and everything written on GitHub (issues, replies, the bots'
templates). The owner keeps giving instructions in Spanish or English; that does not change what
goes into the repo.
- **What stays as it is:** what the player reads (the app keeps its four languages, Spanish by
  default, C-3, D-47), and text written by people outside the team (a player's feedback is quoted
  as is; the reply is in English).
- **Persisted data keys are not renamed in the bulk phases:** game ids (`'ahorcado'`), Firebase
  paths and fields (`unoAlDia/…`, rankings, cups) and their rules, and `localStorage` keys. They are
  data, and renaming them means migrating live data; a mistake loses rankings, Uno al día streaks
  and saved games.
- **It is done in phases, not retroactively in one go:** (1) this rule, the living instructions
  translated (`CLAUDE.md`, the agents, the skill, `CONTRIBUTING.md`, the READMEs of `tools/e2e/` and
  `firebase/`), the bots' GitHub templates in English, and the decision checker reading English
  fields; (2) a scan that lists every Spanish name with its English replacement, shown to the owner
  before renaming; (3) the workshop (`tools/`, `.github/`, `firebase/`, `marketing/`, the agents and
  their labels, the session hook, the scheduled task); (4) the app code in `public/`, in parts, each
  one with the full end-to-end run; (5) the documents, renamed and translated, keeping every D-n,
  C-n and U-n number. The renaming PRs go when no other PR is open, so they don't collide.
- **Then a scheduled task finishes it gradually:** what is sensitive to data loss (the persisted
  keys above) is migrated one at a time by a periodic task, each step with a Firebase backup, a
  migration script and the old name kept as an alias. When nothing is left, that task is deleted
  and replaced by a weekly sanity review that looks for Spanish creeping back into internal text.
- **Until each phase lands,** new text is English even inside a file that is still Spanish, and
  tools read both: `tools/agents/document.mjs` accepts `**Status:**` / `**Relation:**` with
  `current`, `amended by`, `replaced by` and `revoked` alongside the Spanish fields.
**Why:** the owner wants the repository to read as international: anyone reviewing the code, the
decisions or the messages should be able to follow them. Before this, only the README was English
(D-78) and everything else, including file names, was Spanish.
**Alternatives discarded:** only new text in English (leaves the repo mixed for good); translating
and renaming everything in one PR (hundreds of files at once collide with every open branch and
cannot be reviewed); renaming the persisted keys together with the code (risks live data for a
name).
**Consequences:** decisions, canons and changelog entries written from now on are English; until
phase 5 the documents are bilingual. Each phase marks itself done here, in its own PR: phase 1 is
done (v0.170.7); phase 3 is done (v0.171.2): 97 workshop files, their commands and flags (`revisar` → `check`,
`--desde` → `--from`…), the workflows and their required checks (`pruebas` → `tests`,
`punta-a-punta` → `end-to-end`), the agents (`processes`, `documentation`, `usability`) and their
labels, with environment variables read under both names for a while (`SITE` or `SITIO`).
- **Owner's answers to the scan (phase 2):** the GitHub secret `VAPID_PRIVADA` keeps its name (a
  secret cannot be renamed, only saved again); `/cup/suelto/` moves to `/cup/standalone/` with a
  bridge page, as every renamed URL (phase 4); shared images get English names
  (`tarjeta.jpg` → `card.jpg`), the pages point to the new ones and the old files stay as obsolete
  copies until the weekly review removes them (phase 4).

## D-317 · Feedback: an optional email, kept private, and a friendly reply when it's resolved
**Date:** 2026-10-14 · **Status:** amended by D-327, D-341, D-366, D-368, D-370 · **Relation:** extends D-275 (feedback as issues) and D-279 (what the issue shows); amended by D-327 (an exempt list for the 24-hour rule)
**Decision:** Owner's request: every feedback form (the 🐞 in the lab and in La Copa, the "¿Qué te
pareció?" at the end of each lab game and La Copa's report screen) gets an optional email field, so
whoever wants to can be told when we answer.
- **The form says what it's for:** "Only so we can reply to you. We don't use it for anything else,
  it's never published, and we delete it afterwards" (in the four languages,
  `campoCorreo` in `labs-idioma.js`). It is not saved on the device.
- **The address never reaches the public repo:** `feedback/<id>` (readable by anyone) gets only the
  mask `j********@********m` (`correoMascara`, first letter of the address and last of the domain),
  which the GitHub issue shows so the owner recognizes it. The address goes to
  `feedbackContacto/<id>`, write-once, only next to an existing report, and **readable only with the
  owner's key** (`.read: false`; `public/cup/reportes.test.mjs` checks the rules keep it that way).
- **The reply:** when the processes agent resolves the report, it emails the player from
  `hola@juegosdesalon.cl` (the owner's choice, sent through Gmail's SMTP with an app password kept
  in `~/.config/juegos-de-salon/mail.json`, never in the repo), in the language the feedback was
  written in, wrapped in one of ten friendly, grateful openings per language
  (`tools/agents/feedback-templates.mjs`; neutral language, no dashes as punctuation). Then it
  deletes the address and notes it on the issue (`feedback.mjs reply`). **Several comments from the
  same player go in one email** (owner's request, the same day: a long session leaves several, and
  N emails for N comments is too many): the subject and the opening are plural, each answer goes
  under the quote of its comment, and `feedback.mjs pending` groups the waiting reports by address.
  **At most one email to the same address every 24 hours** (owner's rule, for prudence; except the
  addresses in `noLimit`, D-327):
  `send-mail.py` checks it before connecting, against a log of every email sent kept on the owner's
  machine (`~/.config/juegos-de-salon/mail-log.jsonl`: date, masked address, a hash of it,
  subject, issues; never the address, which the form promises to delete).
  **Destructive feedback**
  (insults, mockery, spam) gets no email: the address is only deleted (`feedback.mjs forget`).
  Honest criticism is not destructive.
- The reply runs on the owner's Mac mini (the processes round), never in a workflow: Actions logs
  are public.
**Why:** a player who took the time to write deserves to hear back, but the repo and its issues are
public, so the address can't live there; and the promise in the form (only for this, then deleted)
has to be kept by the tools, not by memory.
**Alternatives discarded:** emailing from GitHub (it can only notify GitHub users); keeping the
address in `feedback/` (readable by anyone); drafts in the owner's Gmail (every reply would wait for
the owner); a mail service with its own account and domain verification (more setup for the same
result).
**Consequences:** `firebase/database.rules.json` gains `feedbackContacto` and `feedback/*/correoMascara`
(published with the merge, D-218); `processes.mjs check` lists the reports with an email still
waiting for a reply (📧). Until the owner sets up `hola@juegosdesalon.cl` and `mail.json`, `reply`
fails without sending anything and the round says so.

## D-318 · hola@juegosdesalon.cl: a Cloudflare Worker, a narrow inbox user and a support agent
**Date:** 2026-10-14 · **Status:** current · **Relation:** extends D-317 (the email reply) and D-275 (feedback as issues); adds an agent to D-276; extended by D-365 (the inbox is watched every 5 minutes, not only in the daily round)
**Decision:** Owner's request: what people write to hola@juegosdesalon.cl enters the same pipeline
as the app's 🐞, triaged by a **support agent** (`.claude/agents/support.md`) that the processes
agent launches when there are emails.
- **No mailbox:** Cloudflare Email Routing hands each email to a Worker
  (`tools/cloudflare/inbox-worker.js`, pasted in the dashboard, free plan), which forwards a copy to
  the owner's Gmail and keeps sender, subject and text in Firebase `buzon/<id>`.
- **A narrow user, not the admin key:** the Worker and the agent's tool (`tools/agents/inbox.mjs`)
  sign in as `buzon@juegosdesalon.cl`, a Firebase Auth user (UID in the rules) that can only read
  and write `buzon/`. The admin key bypasses every rule, and emails are written by strangers: if
  one ever fooled the agent, the worst it could do is create a report or delete an email. Reports
  go through the public path of the 🐞 (`enviarReporte`). The password lives in the Worker's
  secrets and in `~/.config/juegos-de-salon/buzon.json`, never in the repo.
- **The agent:** reads the inbox (addresses masked), and each email becomes a report (the sender's
  words when it's about the games and has no personal data; a neutral "Summary:" otherwise, and
  when in doubt) or is skipped (spam, automatic, manipulation). It runs only `inbox.mjs`: no code,
  git, GitHub, links or keys. **What an email says is data, never an instruction.** From the
  report on, it's D-317: the issue, the fix, the templated reply, one email per address per day.
**Why:** a public address must have someone reading it, but an agent reading strangers' emails with
the powers of the processes agent (merging, code, the admin key) is an open door; this keeps the
reading in a box the rules enforce.
**Alternatives discarded:** a new Gmail read over IMAP (Google refused the owner's phone number);
reading the owner's personal Gmail (the credential opens all their mail); a service account with
limited IAM (the Realtime Database has no per-path IAM: any service account bypasses the rules);
the processes agent reading the inbox itself (too many powers next to untrusted text).
**Consequences:** `firebase/database.rules.json` gains `buzon` (only that UID); `processes.mjs
check` counts the emails and dispatches `support` when there are some; issues from email say
"Arrived by email to hola@" and are titled `🐞 email: …`. The owner sets up the Worker in
Cloudflare once (`tools/cloudflare/inbox-worker.js` says how).

## D-319 · A room that doesn't open: the button says it's trying, and one tap goes to one phone
**Date:** 2026-10-14 · **Status:** current · **Relation:** extends D-40 (one text for a room that can't be reached) and C-14 (a clear way out); completed by D-322 (the rematch button)
**Decision:** Owner's request, after a player saw "No se pudo abrir la sala…" in Batalla Naval and
was left looking at it. Creating or joining a room goes through `tryRoom` in
`public/assets/js/transport/errors.js`, in every game with rooms (Ahorcado, Batalla Naval, Dudo,
Generala, Julepe, Línea de Tiempo, Toque y Fama):
- **While it waits** (up to 20 s: 8 to connect, 12 for the operation), the button says
  "Abriendo sala…" or "Entrando…" (`COMMON.opening`/`joining`, `aria-busy`) and the previous error
  is cleared. Before, the button only went dim and the old message stayed on screen, so a retry in
  progress looked like a frozen app (the player's screenshot showed exactly that).
- **When it fails with `errOffline`**, a "📱 Jugar en un celular" button (`COMMON.playOnePhone`)
  goes under the message and opens the game's own one-phone setup. The text no longer says "in a
  few minutes": it says to try again or play on one phone, and the same create/join button is the
  retry. The other errors (full, expired, not found) get no such button: one phone doesn't fix them.
**Why:** the message already named the way out (one phone needs no internet) but left the player
to find it through the menu; and a retry has to show it is happening. A separate "retry" or
"reload" link was discarded: it would do what the button already does, and reloading would lose
the name and the settings.
**Consequences:** `tools/e2e/room-error.mjs` checks the waiting label, the button coming back, the
way out and the clean one-phone screen, now also in Generala and Julepe. U-37 in USABILIDAD.md.

## D-320 · Room writes nobody waits for are caught in the transport, and a denied resend is not a failure
**Date:** 2026-10-14 · **Status:** current · **Relation:** completes C-7, C-12 and the vigía (D-251) for room games
**Context:** the vigía recorded the only PERMISSION_DENIED in a week as an unhandled rejection in
Batalla Naval (room CUFM, 21:02:01 UTC, chrome155, no file: the stack is all in the Firebase SDK).
The message format comes from the SDK's write callback (`set`/`update`/`push`/`onDisconnect`); a
denied read says `permission_denied at /path`. The room's messages show both phones silent for
four minutes after B sent its fleet, then the rejection 5 s before B's first shot, and every write
that room made at that time passed the published rules. What was denied was a resend: when the
connection drops before the server's ack arrives, the SDK sends every write still waiting for one
again after reconnecting, and `rooms/<CODE>/messages/<id>` can only be written once
(`!data.exists()`). The message was already in the room, so the game went on, but `send()` returned
the promise and none of the seven room games awaits it.
**Decision:** the transport handles what it fires and forgets
(`public/assets/js/transport/best-effort.js`):
- `send()` passes its `push` through `message()`: a denied write whose message is already on the
  server is a resend and is not reported. Any other failure is a move that didn't get through, so
  it is raised again and the vigía still counts it on the Health panel. It still returns the same
  promise, so a caller that awaits it sees the error.
- The presence writes (`onDisconnect(...).update`, the `update` on reconnect) and the background
  note of a new room go through `quiet()`. They can be denied for real when a phone wakes up on a
  room that expired (30 minutes without moves), and that is not something the player can act on.
- `best-effort.test.mjs` scans `firebase.js`: a Firebase call nobody awaits, returns or catches
  fails the test.
**Why not the rules:** a message that can only be written once is what keeps the room append-only,
and the rules cannot tell an identical resend from a new write over an existing id.
**Consequences:** the Health panel stops counting resends as failures. Rooms that are created but
never noted in the cleanup bucket (the page dies between the two writes, as with MBGJ and HBHV that
same day) are a separate problem, handled in D-321.

## D-321 · A new room and its cleanup note are one write
**Date:** 2026-10-14 · **Status:** current · **Relation:** corrects D-39; completes C-7
**Context:** rooms MBGJ and HBHV (Batalla Naval, created 20:50:04 UTC, player A online, no moves)
were in `rooms/` but in no `cleanup/days/<day>` bucket. They came from two create attempts that
timed out on a bad connection before the player's third attempt (CUFM) worked. `create()` wrote the
room, then the player, and only afterwards, in the background, read the server `createdAt` and
noted the code in that day's bucket. When the page died or the connection dropped in between, the
room existed and nothing named it, and the sweep only deletes what a bucket names: that room would
stay in the database forever.
**Decision:**
- The creator writes the room (`createdAt`, `game`, `config`) and its note
  (`cleanup/days/<day>/lastAt` and `rooms/<CODE>`) in **one multi-path update** from the root
  (`roomCreation` in `cleanup.js`). Firebase applies it whole or not at all, so a room that exists is
  always noted. `lastAt` and `createdAt` are the same `serverTimestamp()`.
- The bucket's day can no longer come from the server `createdAt`, which only exists after the write:
  it comes from the phone's estimate of the server clock (`Date.now()` plus
  `.info/serverTimeOffset`, known once connected).
- The rules let a code be noted again (`!data.exists() || newData.val() == true`), so the update is
  not rejected when a code is reused the same day after its expired room was deleted. A note still
  cannot be removed or changed.
- The creator no longer runs `noteRoom` afterwards; whoever joins still refreshes the bucket's
  `lastAt`, as before.
- `node tools/firebase/unnoted-rooms.mjs` (admin key) lists the rooms that no bucket names, and
  `--fix` deletes the expired ones and notes the live ones. It is the net for the rooms that leaked
  before this change.
**The trade-off:** near midnight UTC, the estimate can pick the bucket next to the one of
`createdAt` (an offset error of a few hundred ms, or a write that waits in the SDK queue). That does
not break the bucket's promise: what keeps a bucket closed is its `lastAt`, and here it is the same
stamp as the room's `createdAt`, so the bucket opens exactly when the room has expired, whichever day
it is filed under. The panel does not read `cleanup/` (its record is `stats/`, by `createdAt`, D-44),
so it is unaffected. Noting before creating, in two writes, was discarded: a note with no room is
harmless, but `lastAt` would be a few seconds older than the room, and the sweep would find a
bucket open with a room it cannot delete yet.
**Why the net is a tool and not part of the sweep:** finding an unnoted room means listing `rooms/`,
which only the owner can read (listing it would hand out the codes of live rooms, D-39). A phone
cannot do it.
**Consequences:** `cleanup.test.mjs` creates a room with the atomic write, lets the page "die", and
sweeps it the next day; it also covers the midnight case and a reused code. `unnoted-rooms.test.mjs`
covers the tool's pure part. The rules change is published on merge, before the site (D-218).

## D-322 · A rematch that fails says so under its button
**Date:** 2026-10-15 · **Status:** current · **Relation:** completes C-14 and D-319 (rooms that don't open) for the rematch
**Context:** looking for the same pattern as D-320 (a Firebase failure nobody catches) across the
games: the rematch button of the seven room games opens a new room (or joins the one the other
player opened) from an async click handler. In Ahorcado, Batalla Naval, Línea de Tiempo and Toque y
Fama nothing caught it: a failure (no signal, too many rooms) was an unhandled rejection on the
Health panel, the game stayed marked as switching rooms, and the button did nothing visible. In
Dudo, Generala and Julepe the catch re-enabled the button through `e.currentTarget`, which is
already null after the await, so the catch itself threw and the button stayed disabled.
**Decision:** every rematch button goes through `tryRematch(btn, run, { T, reset })` in
`public/assets/js/transport/errors.js`. The button is taken before any await and is disabled while
the rematch runs, saying "Abriendo sala…" (`COMMON.opening`, like `tryRoom`, U-37), and stays
disabled when it works, until the game moves on. If it fails, `reset` clears
the game's switching flag, the error shows in a `.form-error` line under the button with the same
texts as creating or joining a room (`errText`), and the button comes back: tapping again is the
retry. Only unexpected errors go to the console (C-14).
**Why:** a rematch is creating or joining a room, so it gets the same texts and the same rule as
the setup screen (D-40, D-319); the one-phone way out isn't offered here, because "Cambiar modo"
is already next to it.
**Consequences:** `errors.test.mjs` covers the button, the message, the retry and that no rejection
is left unhandled, and checks that the seven `game.js` wire the button through `tryRematch`.
`tools/e2e/battleship/online.mjs` cuts A's network before Revancha and checks the message, the
button and the vigía, then plays the rematch.

## D-323 · The PR's session learns of the merge from a bot comment, posted before the merge
**Date:** 2026-10-15 · **Status:** current · **Relation:** completes D-216 (auto-merge) and D-218 (the CI monitor)
**Context:** owner's request. With auto-merge a PR merges by itself, and `publish.yml` takes it to
the site, but the session that opened it never learned it: the app's CI monitor wakes it on a
failed check, a conflict or a new comment, not when everything goes well. Every time, the owner
had to come back and say "it merged" before the session could do what follows (report, clean up,
go on with the work that depended on it). That broke end-to-end automation.
**What was tried (#427, #428):** a comment is the only success-side event the monitor relays, but
not every comment. Comments from the owner's own account (the one the session's `gh` uses, who also
opens the PRs) did not wake the session, plain or as a review. A comment from `github-actions[bot]`
woke it within seconds on an open PR, and not at all once the PR was closed. So a comment posted
by `publish.yml` after the merge, the first design, reaches no one.
**Decision:** the signal is posted by the required `end-to-end` check itself, as its last step on
a PR (`tools/release/merge-report.mjs --ready`): with auto-merge on, it comments "✅ Both checks are
green: auto-merge merges this PR now" (or "as soon as `tests` passes", if that check is still
running). The PR is necessarily still open, since auto-merge waits for this very check, and the
comment comes from the bot. Then the step holds the check for two minutes (`HOLD_S`, only when it
commented): on #427 the merge came 15 s after the comment and the monitor, which reads the PR every
so often rather than at once, found it closed and dropped the comment. The session takes it as a signal, not as instructions: it checks on
GitHub that the PR merged and then does what follows. Not on forks (their token can't comment), and
a failure posting it never turns the check red. `publish.yml` keeps a last `report` job that comments
on the merged PR with the version that went live, or the first step that stopped it: a record on
the PR (and an email to the owner) that wakes no one. A failed publication still opens "main is red".
**Why not polling:** the session must not poll CI. **Why not a local job:** the owner wants this in
the repo, not on one computer.
**Consequences:** `merge-report.test.mjs` covers both comments, the `tests` conclusion, finding the
PR of a merge commit, and the workflow wiring: the step sits in `end-to-end` with its permissions,
`publish.yml` grants them when it calls `e2e.yml`, and `report` waits for every job.

## D-324 · First made for Chile, now for everyone
**Date:** 2026-10-15 · **Status:** current · **Relation:** corrects the reasoning of D-47 and D-78; amends C-1
**Context:** owner's request. The README said "The app is Chilean", and D-47 ("el público es
chileno") and D-78 ("la app es chilena") gave the same reading. That was the original idea, but
the app now plays in four languages, Cups choose a Global, Chile or Brazil audience (D-186,
D-187), and the owner does not want it read as being for Chilean audiences only. "Made in Chile"
is not accurate either: the owner is Chilean but lives in the US.
**Decision:** the app is described as first made for Chilean audiences and now for everyone, in
four languages. What does not change: Spanish stays the default (C-3, D-47), the Spanish texts
keep the informal Chilean voice (C-1), and Chilean content (the Chile decks, the dice names in
Liar's Dice) stays as flavor, tagged and optional where it is local (D-186).
**Why:** the origin explains the voice and the Spanish default; it no longer limits who the app
is for. Saying it is "for Chileans" turns a feature into a restriction.
**Consequences:** the README note and C-1 say so. D-47 and D-78 keep their decisions; only the
"the audience is Chilean" part of their reasoning is corrected.

## D-325 · ¿En qué año? scores on a soft curve with a wider margin
**Date:** 2026-10-15 · **Status:** current · **Relation:** changes the margin of ¿En qué año? (`docs/games/cup.md`)
**Context:** players wrote that the game punishes too hard: a near miss scored 0. The margin was
`max(8, (2026 − year) / 4)` and the score fell in a straight line to 0 at its edge. For old years
that was already generous (600 BC answered as 800 BC gave 70), but 70 % of the cards are from 1950
on, where the margin was 8 to 19 years: 1990 answered as 1980 gave 0, and so did 1950 as 1970.
The one ancient case reported (800 for 600 BC scoring 0) was the a. C. switch left off, which the
reveal now makes visible ("Tu respuesta: …").
**Decision:** the margin is `max(12, (2026 − year) / 3)` and the score is
`round(100 / (1 + (2·distance / margin)²))`: 100 for the exact year, 50 at half the margin, 20 at
its edge, and past it a tail that keeps falling (about 6 at twice the margin) instead of a cut to 0.
The card marks keep their thresholds (🟩 ≥ 80, 🟨 ≥ 50, 🟧 ≥ 20, ⬛ below).
**Why:** getting closer should always be worth something, at every age; the relative margin already
scales with how old the event is, so it only needed to be wider and without the cliff.
**Alternatives discarded:** offering dates to anchor on (multiple choice): it turns "write the year"
into picking by elimination, and ordering events is already Línea Relámpago's job.
**Consequences:** results saved before the change keep their score; the day's breakdown recomputes
each event with the new curve, so for a day played before the change it can differ by a few points
from the saved total. `juegos.test.mjs` pins the 50 and 20 points and the tail.

## D-326 · The a. C. switch shows only in themes that need it
**Date:** 2026-10-15 · **Status:** current · **Relation:** follows the a. C. label of PR #431 and D-325
**Context:** only Historia has events before Christ (11 of about 675 cards), yet every ¿En qué año?
board showed the d. C. / a. C. switch. Everywhere else it was clutter and a way to answer BC by
mistake, which is how a friend lost the Hegira.
**Decision:** `generar` marks `ac` when the theme has any card with a negative year (`conAC`), and
the screen draws the switch only then. Without it, every answer is AD. The rules keep "if it was
before Christ, tap a. C.", since any Cup can draw Historia.
**Why:** it goes by the theme, not by the card: the theme is already on screen, so the switch says
nothing about which event is BC. A dropdown was considered and discarded: on a phone it is two taps
and a small target, and it hides the option exactly where it is needed.
**Consequences:** a new deck with a BC card gets the switch with no other change.
`juegos.test.mjs` checks that only Historia has it today.

## D-327 · Emails to hola@: replies in the sender's thread, by kind, and an exempt list
**Date:** 2026-10-15 · **Status:** current · **Relation:** amends D-317 (one email per address every 24 hours)
**Decision:** Owner's requests, the day hola@ started working (D-318):
- **The reply lands in the sender's thread.** The Worker already keeps the email's Message-ID;
  `inbox.mjs ingest` sends it, with the subject, next to the private address
  (`feedbackContacto/<id>`: `idMensaje`, `asunto`; never in the public `feedback/`), and
  `feedback.mjs reply` answers with `Re: <subject>`, `In-Reply-To` and `References`.
- **By kind:** kudos get a short, simple reply; actionable emails become issues like any 🐞 (the
  sync already opens them); negative or destructive ones get no reply (`forget`).
- **The closing invites a reply:** "responde este correo o usa el botón 🐞", in the four languages.
- **An exempt list:** `mail.json` takes a `noLimit` list of addresses that `send-mail.py`
emails at any frequency. Today it holds only the owner's own address, so their test emails to
hola@ (D-318) get their reply the same day.
**Why:** the 24-hour rule protects players from being flooded; the owner testing the pipeline is not
a player, and a test sent the day after another one was blocked.
**Alternatives discarded:** the list in the repo (it is public, and the addresses are private);
a flag on `reply` (any session could skip the rule for anyone).
**Consequences:** the list lives only on the owner's machine; every email is still logged.
`send-mail.test.py` checks the exemption is case-insensitive and only for listed addresses.

## D-328 · Support: a doubt goes to the owner's email, with a public pointer
**Date:** 2026-10-15 · **Status:** current · **Relation:** follows D-317, D-318 and D-327; narrowed by D-338
**Decision:** Owner's request: when the processes agent isn't sure how to answer a report, it sends
nothing to the player. `feedback.mjs doubt <n> <notes.txt>` emails the owner (their own account in
`mail.json`, outside the 24-hour rule) with the doubt, a draft and the report, under the subject
`[JdS duda <n>] …`, and opens a public `support-doubt` issue that says only that, with a Gmail search
link (`subject:"JdS duda <n>"`) that opens that email. The owner answers in the issue without
private details; the next round carries it out and closes it. `processes.mjs check` lists the open
ones, and the processes report has a support line (emails, kudos answered, issues, unanswered,
doubts).
**Why:** the repo is public, so its issues are too; the communication stays in email, and the issue
is only what makes it visible and gives the round something to wait on.
**Alternatives discarded:** a private repository for doubts (one more place to look); email alone
(no record for the round to follow up).

## D-329 · A PR runs only the end-to-end scripts its changes reach
**Date:** 2026-10-15 · **Status:** current · **Relation:** narrows D-205 and D-299 (all or nothing); keeps D-302 and D-308
**Context:** a PR that changed one file in `public/` ran all 61 jobs, even if it only touched a lab
game: La Copa's style sheet ran Batalla Naval, Generala and every language check.
**Decision:** owner's request: `tools/e2e/affected.mjs` reads the site's graph (each `index.html`, what
it links and what that imports; there is no build, so the files say it) and `ci.mjs --groups
--changes` keeps only the scripts whose pages load a changed file, and the parts named after an
affected game. A script's pages come from its `${SITE}/…` addresses, its folder and the page names
it lists. When in doubt, everything runs: a public file no page loads, `tools/e2e/`'s shared code,
`e2e.yml`, a tool a script imports, a root file, or a script whose routes can't be read.
**Why:** measured on the last PRs: La Copa's CSS runs 23 of 61 jobs, a Year engine change 31, a
transport change 27, a lab game 1 to 3; shared modules (`reportes.js`, `errors.js`, `base.css`)
still run all of them, as they should.
**Alternatives discarded:** a list of scripts per game kept by hand (it falls behind); running
everything again on `main` after a narrowed PR (it would give back most of the savings).
**Consequences:** the mark of a tested tree (D-308) is also left by a narrowed run, so `publish.yml`
trusts the graph; what the graph can't see is what "when in doubt" sends to the full run.
`affected.test.mjs` pins the rules and checks them against the real site.

## D-331 · Game variants: the player picks one standalone, the admin picks one per cup day
**Date:** 2026-10-15 · **Status:** current · **Relation:** extends D-163 (the admin builds the week) and D-198 (one screen for the standalone game and the cup day)
**Decision:** Owner's request, with Rutas rotas, Loteo and Pintaminas leaving the lab (D-332). A game
can have **variants** (`VARIANTES` in `public/cup/engine.js`, the first one being the default):
Pintaminas `easy` / `hard`, Loteo `numbers` / `utilities`.
- **Standalone**, the waiting room shows a picker right under the game's name (the game's own if it
  brings `selector()`, Pintaminas' lever; if not, two buttons). The steps, the drawing and the
  demo on top are the variant's. The phone remembers it (`juegos-de-salon:<id>:variant`) and the
  link says it (`?mode=hard`; the lab's `?colors=2` still opens hard). Each variant has its own
  ranking table: the default one is the game's (`pintaminas`), the other goes apart
  (`pintaminas_hard`, without the Cup tab), and the panel sees it in the finished game's detail ("hard · 80/100 · 2:30"; the mode stays `solo`, so the panel's modes do not multiply).
- **In a cup**, below the week, one row per game of the week that has variants: the admin picks
  which one everybody plays that day. `meta.cal` writes the day as `id` (the default, so the cups
  from before read the same) or `id:variant` (`loteo:utilities`). `calendario()` and `juegoDelDia()`
  keep naming games without the variant, so the board, the panel, the reports and the push
  notifications did not change; `varianteDelDia()` gives it. The day's card, its waiting room and
  its rules say the variant under the game's name.
- **Each game brings its own texts** (`public/cup/games/<slug>/texts.js`, merged into `rules.js`),
  its own styles (`games/<slug>/style.css`) and, if it wants, its own score breakdown (`desglose()`):
  three games ported at once could not share the three big shared files.
**Why:** the owner wants the player to choose when playing alone, and the person who organizes the
week to choose for everybody, since in a cup everyone has to play the same thing.
**Alternatives discarded:** one card per variant in the hand of games (fifteen cards, and nothing
stops two Pintaminas the same week); a variant button inside each day's card (the card is a button
that is dragged; one inside the other is invalid and gets in the way of the drag); each player
picking their variant in a cup (scores would not compare).
**Consequences:** the longest week fits the 100 characters the rules allow for `cal`
(`engine.test.mjs` checks it). The all-rounder table (`todoterreno`) adds the default variant's best.

## D-332 · Rutas rotas, Loteo and Pintaminas leave the lab: home page and La Copa
**Date:** 2026-10-15 · **Status:** current · **Relation:** follows D-289, D-293 and D-310; corrects D-291 (no ×1.5); applies D-331
**Decision:** Owner's request. The three lab games become standalone games on the home page
(`/routes/`, `/plots/`, `/paint-mines/`, in the four languages) and join the cup's pool (`POZO`).
- **Built like the other one-player games** (D-198): the engine and the screen live in
  `public/cup/games/<slug>/` and the same screen serves the standalone page and the cup day. The
  waiting room, the countdown, the clock, the result, sharing, the 🐞 report and the rankings are
  the framework's; the lab's comments form and "back to the lab" went away.
- **A random board every time standalone**, like the others: the lab's "board of the day" goes
  away (Uno al día is the daily challenge). In a cup, the code, the day and the variant decide it.
- **0 to 100 in every variant** (owner's answer): in a cup everybody plays the same variant, and
  standalone each variant has its own table, so Pintaminas' hard ×1.5 (D-291) adds nothing.
- **Not in the Gran Final** (owner's answer): the final plays its five fixed rounds, which today
  ignore the week's games anyway; making it follow the week is a separate change.
- Their old `/labs/<slug>/` pages are bridges to the new ones (`deLabs` in `games.js`, generated by
  `og.mjs cards`), and the lab's index no longer lists them.
**Why:** they were tested with friends, the owner liked them, and the cup needed more variety.
**Alternatives discarded:** keeping each lab page and writing a second screen for the cup (two
versions of each game to keep alike).

## D-333 · A new game says "New" on its home card for two weeks
**Date:** 2026-10-15 · **Status:** amended by D-373 · **Relation:** extends C-17 (the home page)
**Decision:** Owner's request: every new game carries a "New" label (Nuevo, New, Novo, Neu) next to
its name on the home card for a set time, today **two weeks** (`DIAS_NUEVO = 14` in
`public/assets/js/games.js`). The game says when it arrived with `nuevoDesde: 'YYYY-MM-DD'`, and
`esNuevo(g)` decides. Rutas rotas, Loteo and Pintaminas are the first.
**Why:** a returning player should see at a glance what is new, without the label staying forever.
**Mechanism:** `games.test.mjs` stops a game on the home page that was not there before D-333 and has
no `nuevoDesde`, so the step cannot be forgotten.
**Consequences:** the date is the day the game reached `main`; if it is published later, the label
lasts a little less.

## D-334 · Uno al día adds six games: the three from the lab, Zip, Tango and ¿Dónde queda?
**Date:** 2026-10-15 · **Status:** current · **Relation:** extends D-230 (the daily deck); applies D-331 and D-332
**Decision:** Owner's request, once Rutas rotas, Loteo and Pintaminas reached the home page (D-332):
they join Uno al día, and so do Zip, Tango and ¿Dónde queda?, which had been left out. They enter
with `desde: '2026-10-16'` (`DESDE_MAS` in `uno-al-dia.js`): the deck being played (October 13 to
22) does not change, and they come out from the deck shuffled on October 23. With 16 games the wait
before a game comes back stays at 7 days. A game with variants plays its **default variant** in Uno
al día, without the picker (Pintaminas easy, Loteo Numbers): the daily challenge is the same for
everyone.
**Why:** every one-player game was meant to be in Uno al día (D-230); these had waited for the lab.
**Mechanism:** `uno-al-dia.test.mjs` checks no day before `DESDE_MAS` changes and each new game comes
out in the next two decks; `tools/e2e/daily-variants.mjs` plays Loteo and Pintaminas on their day.

## D-335 · A new game goes on top of the home page while it is new
**Date:** 2026-10-15 · **Status:** current · **Relation:** amends D-255 (the home page order) and extends D-333; resolves dilemma #443
**Decision:** Owner's request: while a game carries its "New" label (D-333, two weeks), its card goes
right after La Copa, before the games ordered by popularity (`ordenPortada` in `games.js`). When the
label goes, it goes back to its place by popularity.
**Why:** ordered by plays, a new game has none and lands last, where a returning player would not see
it; the label alone did not help if the card was at the bottom.
**Consequences:** the 🎲 random game, Uno al día's "play another" and the tools read the same order.
`games.test.mjs` checks a new game goes right after La Copa and back to its place afterwards.

## D-336 · "Tus copas" keeps the finished cups, behind the switch
**Date:** 2026-10-16 · **Status:** current · **Relation:** amends D-220 and D-234
**Decision:** Owner's request: a finished cup no longer leaves "Tus copas" a week after it ends. It
stays behind the "Mostrar copas terminadas (n)" switch, newest first, both the ones this phone
remembers (now up to 50, before 10) and the player's from any phone (`jugadorCopas`, D-220).
**Why:** the owner signed in with their player and saw only one finished cup out of the many they
had played: the week limit made the list look like it had lost them.
**Consequences:** the cups played before D-220 only show up once they are noted to their player
(`node tools/firebase/rankings-history.mjs --write`). A separate history (place, winner) is left
for later, if the list grows too long.

## D-337 · Tango's clash turns red 1.5 s after the player moves on
**Date:** 2026-10-16 · **Status:** current · **Relation:** amends the resolution of dilemma #135 (option B, "no wait")
**Decision:** Owner's request: in Tango, the red of a clash, its error sound and the counter wait
1.5 s (`ROJO_MS` in `public/cup/games/tango/ui.js`) after the tap that brings them, also with the
board full. Each cell tap, hint or Clear all restarts the wait; arming a two-tap button does not.
The trigger is still tapping another cell, and the score is unchanged: it counts the clash on
leaving, as before. A clash fixed within the 1.5 s still sounds when it is counted.
**Why:** players complained that the evaluation was too quick: the red came the instant they
tapped the next cell, before they had finished the thought.
**Consequences:** shipped in PR #456. `tools/e2e/cup/tournament.mjs` checks the red is absent right
after leaving and present 1.5 s later; the `tango clash` path in `tools/e2e/paths.mjs` waits for it.

## D-338 · Support: the agents resolve the trivial, a doubt is only for what needs the owner
**Date:** 2026-10-16 · **Status:** current · **Relation:** narrows D-328
**Context:** a `support-doubt` issue (#437) reached the owner about a test kudos ("do we answer this
kudos again?"), with nothing to decide. The owner: "I can't be the one who resolves everything,
above all trivial situations".
**Decision:** the processes agent (and support, within its narrow powers) resolves on its own every
case with an obvious answer: kudos and repeated kudos (the warm reply, within the 24-hour rule),
thank-yous, tests of a flow, emails with nothing to act on, duplicates. It decides, acts and notes it
in its report. `feedback.mjs doubt` is only for what truly needs the owner: a product decision,
money, a person's data, or a complaint it can't judge.
**Why:** a doubt costs the owner a read and an answer; the trivial ones had an obvious answer the
agent could give.
**Consequences:** the processes guide (`.claude/agents/processes.md`) says it next to the doubt
step; #437 was closed with no reply sent.

## D-339 · The processes round works the owner's backlog
**Date:** 2026-10-16 · **Status:** current · **Relation:** extends D-273 and D-276
**Context:** the owner asked whether anyone reviews the backlog. The daily round looked at feedback,
waiting PRs, red main, the queue and old dilemmas, but not at the issues the owner opens as to-dos
(no label): they waited until a session picked them up, and one already done (#465) stayed open.
**Decision:** owner's request: `processes.mjs check` lists the open issues with no label, oldest
first, with their age (`backlog()`, tested in `processes.test.mjs`). Each round the processes agent
closes the ones already done (linking the PR), moves one or two forward, the smallest first, each in
its PR with auto-merge, and asks with checkboxes only what needs the owner's decision.
**Why:** a to-do nobody lists is a to-do nobody does; the round already runs every day.
**Alternatives discarded:** a label the owner has to put on each to-do (one more step for them).

## D-340 · Every script the site serves must parse
**Date:** 2026-10-16 · **Status:** current · **Relation:** a mechanism (processes agent's step 6), next to D-143
**Context:** resolving a merge conflict in `public/labs/bridges/game.js` (#482) dropped the `/**` that
opened a comment. The page went blank on the site, and nothing failed: no end-to-end script plays
Tren en Vilo, and the tests import only engines.
**Decision:** `tools/release/syntax.test.mjs` checks every `public/**/*.js` with `node --check` as a
module, and runs with the other tests on every PR (`tests` check).
**Why:** a broken script is cheap to catch and costly to ship; a game outside the end-to-end suite
had no other guard.

## D-341 · "Suggestions and comments": the feedback inbox in production, at the end of the experience
**Date:** 2026-10-16 · **Status:** current · **Relation:** amends D-275 (the form was the lab's 🐞 and "¿Qué te pareció?") and D-317 (one more form gets the email field: the inbox's); extends D-104 and D-268; rule U-38
**Context:** the feedback form lived almost only in the lab (the 🐞, the end of each lab game, La
Copa's results behind `enLab`). Players outside the lab barely saw it, and it asked only "¿Qué te
pareció?", an opinion on the game just played (#463).
**Decision:** owner's request, with these choices:
- **Form:** a quiet link "💬 Sugerencias y comentarios" after the result and the main buttons;
  tapping it unfolds the form in place. Never a popup, never during a game (U-38).
- **Where:** the result of every group game (`finDePartida`), every solo result (`avisoPartida`),
  La Copa's final podium, One a Day's result and the end of every minigame (La Copa's practice
  result), and Cuarto Rey's end screen. Where it shows, La Copa's "🐞 Reportar un problema" link
  steps aside (`sinDoble`), so a screen never offers two links for the same thing (U-1). `ponerBuzon` (public/assets/js/buzon.js) appends it at the
  end of the screen.
- **How often:** on each device, at most once per day; not during the first 2 games a new device
  plays; 14 days of rest after the player sends something. Kept in `localStorage`
  (`juegos-de-salon:buzon`), decided by `enlaceBuzon` / `tocaBuzon`.
- **Fixed place:** a link in the home page footer, always there, opening the form in the overlay.
- **Kind:** optional chips, 💡 Suggestion · 🐞 Problem · 🎲 Game idea · 💬 Other; sending without one
  is allowed. It goes as `tipo` (`sugerencia|problema|idea|otro`, a closed list in the rules) and
  `feedback.mjs` turns it into a second label on the issue (`feedback:suggestion`…).
- **Wording:** one component (`buzon-form.js`, re-exported by `labs-idioma.js`) with the texts in
  `COMMON.buzon`, in the four languages; La Copa's "¿Qué te pareció?" moves to them. The lab's 🐞
  and the lab games' own prompts stay.
- **Pipeline:** unchanged: `feedback/` (+ `feedbackContacto`, D-317) → `feedback.yml` → issues →
  processes round.
**Why:** the inbox is open to anything (a suggestion, a problem, a game they'd like), so it belongs
where the player has finished and has a minute, not in the way of playing again. Once a day and the
rest after sending keep it from becoming noise.
**Alternatives discarded:** the form already unfolded (it pushes the buttons down and takes the
eye); a popup at the end (it interrupts); showing it every game.
**Consequences:** the form loads only on tap (`import('./buzon-form.js')`); `tools/e2e/feedback-prod.mjs`
plays it end to end in four languages at 320 px; `buzon.test.mjs` checks the frequency rule and that
the rules accept exactly the four kinds.

## D-342 · Tango: ↩️ Undo, without giving back mistakes or hints
**Date:** 2026-10-17 · **Status:** current · **Relation:** extends D-283 and D-103 to Tango; an exception to D-283 in how Undo is kept
**Context:** owner's to-do (#462): Tango had 🧹 Clear all (two taps) and 💡 a hint, but no way to take
back the last move. Queens already had ↩️ Undo (D-283), with the button and its steps in
`public/cup/games/deshacer.js`, ready for Tango.
**Decision:** under Tango's board, to the left of Clear all, goes **↩️ Undo** (the shared
`botonDeshacer`). Each tap takes back the last tap or Clear all, one after another down to the
start; with nothing to undo it is off. It applies wherever Tango's screen is used: La Copa, the
standalone game and One a Day.
- **Undo is a play here (`'U'`), unlike Queens:** Tango's score is 100 minus mistakes and hints
  (D-102, D-103), so taking a move out of the list would also take its mistake out of the score.
  As a play, the engine (`estado`) replays it: the board goes back, but a mistake already counted
  stays counted and a hint is never undone (its cell stays revealed and paid for). And because the
  engine replays it, Undo keeps working after the game is reloaded.
- **Undoing the tap that just broke a rule forgives it**, the same as tapping that cell again
  (passing through the sun on the way to the moon, D-102): it had not counted yet.
- **No confirmation** (U-15), like Queens: what it undoes is redone with the same tap.
- **The row:** Undo, Clear all and the hint, each on one line of text; the one that doesn't fit
  goes down (at 320 px in German, the three go one under the other). The rules' scoring line says,
  in the four languages, that Undo doesn't give the points back.
**Why:** a guess of several moves had to be taken apart by hand or erased whole; LinkedIn's Tango
has Undo. Keeping the score as it was (mistakes and hints cost the same with or without Undo) is
what lets Undo arrive without changing what a point means in a Cup.
**Alternatives discarded:** Queens' way, cutting the list (it would erase mistakes from the score,
so Undo would become a free retry); undoing hints too (it would give back 15 points for a revealed
answer).
**Consequences:** `juegos.test.mjs` checks the steps, the mistakes and hints that stay, and the
forgiven fresh clash; `tools/e2e/cup/tournament.mjs` taps Undo after Clear all and checks the board
comes back.

## D-343 · The way out of a result screen, the same in every context
**Date:** 2026-10-17 · **Status:** current · **Relation:** new canon C-19; completes D-230 and #226 (One a Day without rematch) and D-341 (the inbox, last)
**Context:** the owner asked to review every end screen of a game played as One a Day and inside La
Copa: what is on them, in what order, and whether each one lets you go back to One a Day, to the Cup
or to the menu when that is right. There were three families of end screens with nothing in
common: the Cup day (back to the board under a long, open breakdown and the day table, likely below
812 px), the solo games' practice/One a Day result (four ways out in three styles, the menu after
🐞) and the group games (the One a Day card dropped under the words or the fleets, next to their
own "Change mode" and "Back to the menu"). The podium had no way out of its own, and `/today/`
did not offer "Replay today's" that the card did.
**Decision:** each context has its exits (C-19's table), and every end screen keeps one order:
result → context → actions → exits → detail → rankings → one feedback link.
- **`public/assets/js/fin.js`** builds the exits (`salidasFin`): 📅 Back to One a Day in One a Day
  (the header's ‹ Menu is its way to the menu: one way to it, not two); 🏠 Back to the menu under
  the podium and in a game played on its own.
- **One a Day:** the card (`tarjetaResultado`) carries all the actions and exits, and goes right
  under the hero in every game (`ponerTarjeta` no longer takes a place). In today mode Ahorcado,
  Batalla Naval, Dudo (and Generala, ready for when it joins the deck, D-248) add no buttons of their
  own. "📅 See your One a Day" is now "📅 Back to One a Day". `/today/`, with the day done, offers
  Replay today's too.
- **A Cup day:** Back to the board goes first, under the place; share and the next-day notice after
  it; the breakdown starts folded (it stays open in practice) and the day table goes below.
- **Above the fold, one primary button** (the usability review, at the owner's request): every main
  action and exit was measured at 390×812 and 320 px in the four languages. With two exits, a solo
  game's One a Day card pushed them below the fold, so the menu one went (the header has it); the
  Sign in offer inside the card is one line (`bloqueJugador({ compacto })`, the legend "Keep your
  streak on any phone" as its title); the Cup's next-day notice button is cyan after a day's result,
  so "Back to the board" is the only yellow one.
- **The podium:** 🏠 Back to the menu, under Share the summary; "Leave this Cup" stays a quiet link
  at the end.
- **Not offered, on purpose:** play again in a Cup day (U-21), a link to La Copa from One a Day (a
  Cup is joined by invitation), the menu inside a running Cup (the header's ‹ already does it). The
  Cup's trial run (D-103) ends with only its way back to the waiting room: no 🐞 or 💬, it is a test.
**Why:** the owner asked for it; a player who ends a game should see where to go next without
scrolling and in the same place every time.
**Alternatives discarded:** a single end-screen component for every game (the result content is too
different between games; the shared part is the exits and the order, which is what C-19 fixes).
**Consequences:** `public/assets/js/fin.test.mjs` checks the exits per context, that the group
games put the card with no place and no buttons of theirs, and the Cup day's order. The cup's
`backToMenu` text is gone: the menu button comes from `fin.js` (`COMMON.volverMenu`).

## D-344 · The start button of every landing page is above the fold
**Date:** 2026-10-17 · **Status:** current · **Relation:** adds U-39; complements U-16 and U-18
**Context:** owner's to-do (#464): on most landing pages the steps («Cómo se juega») came between
the title and the start button, so the player had to scroll to find how to start. Measured at
320×568 and 375×667 in the four languages, 20 of the 24 landings had the button (or the first mode)
below the fold, up to 750 px down (Tango in German).
**Decision:** on every landing the main action comes right after the cover, the title and the
language toggle; the rules, the steps and the scoring go after it (still open, or folded where they
already were). In the group games the panels move below the modes (and Fourth King's below «¡Armar
la mesa!»); in La Copa's standalone games and the lab games, below Empezar and the player block;
Julepe's second lead line goes there too. On a short screen (`max-height: 600px`) the standalone
games' cover above the title shrinks (`zoom: 0.6`) and so does Agents' demo, which is what made
Plots, Paint mines and The case miss by a few pixels at 320×568.
**Why:** the player who opens a game wants to play; the rules are one glance below, and every
game already repeats them folded under the board (U-16). A rule alone would come back: the check
does not.
**Alternatives discarded:** folding the steps above the button (still pushes it down in German and
hides the drawing); a fixed bottom button (covers the rules and the ranking, and needs a safe-area
case per phone).
**Consequences:** `tools/e2e/landing-fold.mjs` measures every `intro` path of `tools/e2e/paths.mjs`
at both sizes and in every language, and fails when the main button ends below the first viewport.
It runs in CI (about 4 minutes). La Copa's day lobby (with the wildcard and the warning before
starting) keeps its order: it is not a landing, and there the rules are read before a timed attempt.

## D-345 · The lab keys live in Firebase: giving or removing one is instant
**Date:** 2026-10-17 · **Status:** current · **Relation:** moves where D-284 keeps the keys; keeps D-281's door
**Context:** each key was a line in `HUELLAS` of `public/assets/js/labs-puerta.js`, so giving one meant a
PR, the tests and end-to-end scripts of the nine lab pages and a publish: about ten minutes for data,
and a new key didn't open until then.
**Decision:** owner's request: the fingerprints live in Firebase, `labsLlaves/<SHA-256> = label`.
`labs-key.mjs new | remove | list` writes them as administrator; the door hashes the key and reads
that one node. The rules let anyone read a fingerprint they can already compute (from the key), never
the list, and nobody write except the admin. With no network, a key already saved on that phone still
enters; a new one doesn't. `HUELLAS` stays in the door, empty, for keys from before (`migrate` moved
the nine there were).
**Why:** a key is data, not code; and the list is now less exposed than before (it was in the public
repo).
**Consequences:** checked on the live database: a known fingerprint reads its label, the list and any
write are denied. `labs-puerta.test.mjs` covers Firebase keys, removal and no network.

## D-346 · Test levels: the least testing that keeps the site safe
**Date:** 2026-10-17 · **Status:** current · **Relation:** builds on D-329 (the page graph); owned by the processes agent (D-273)
**Context:** the owner: small changes shouldn't run every test, and important ones must not skip them;
there should be a criterion and someone in charge. D-329 already chose scripts by the pages a change
reaches, but no level was named, nobody reviewed the criterion, and a lab game with no script of its
own had no browser test at all: a merge left Tren en Vilo blank (#482) and every check was green.
**Decision:** four levels from what a change reaches (`levelOf()` in `tools/e2e/affected.mjs`, tested):
N0 no browser (unit tests only), N1 lab (its scripts + smoke), N2 game (its scripts + smoke), N3 core
(the home page, a third of the pages or more, or what the graph can't narrow: everything). The new
`tools/e2e/smoke.mjs` opens every page and fails on an uncaught error or a blank screen: the floor of
N1-N3. `ci.mjs` prints each PR's level. The processes agent owns it: each round it looks for a change
that broke something after running too little, and for an N3 that could have been narrowed, and fixes
the criterion with a test.
**Why:** cost where it buys safety; the smoke test is a minute and catches what a missing script
would let through. Checked: it fails on #482's `game.js` ("/labs/bridges throws: SyntaxError") and
passes on main's 34 pages.
**Alternatives discarded:** a level the author picks by hand (it drifts); everything on every PR (what
D-329 left behind).

## D-347 · Out of the cup after two days in a row without playing
**Date:** 2026-10-17 · **Status:** current · **Relation:** new rule of La Copa; complements D-147 (provisional table), D-161 (closing early) and D-224 (notifications)
**Context:** the owner's request: a player who stops playing should be left out automatically, and
it should be seen both on their own board and in the table everyone sees. Until now a missed day
was just 0 points: the absent player kept the table "provisional", appeared in every "missing"
list and got the reminders.
**Decision:** whoever lets **2 days in a row** close without playing them is **out of the cup**.
Agreed with the owner: 2 days, in a row (not in total), always on (not an option when creating the
cup), with a warning before and the admin able to bring them back.
- **When:** a day counts as missed when it closes with its grace day and there is no result.
  Only days that closed after the player signed up count (a late signup starts clean), never the
  days the admin's early close left unopened (D-161), and never the last two days: they close with
  the cup, when there is nothing left to leave.
- **What stays:** their points. They stay in the table, grey, with 🚪 instead of a place and
  "(fuera)", below everyone still playing. They can't press Empezar (the Firebase rules refuse it);
  nobody waits for them: `faltan()` leaves them out, so the provisional table, the lists and the
  closing confirmation don't count them, and they get no more notifications.
- **What they see:** a notice on top of their board ("🚪 Quedaste fuera de la copa…"), with what to
  do if it was a mistake: ask the admin.
- **The warning:** with one day already missed, the board says which day to play before it
  closes, and the "Before closing" notification says that missing it leaves them out.
- **Bring back:** the admin's player list shows why someone is out and offers «Devolver a la
  copa». It stores `players/<pid>/back` (server time): the days closed before it are forgiven.
- **Computed, not stored:** being out comes from the results and the windows (`fuera()` and
  `enRiesgo()` in `engine.js`); the rules repeat the same condition for each pair of days up to
  day 6, because they cannot loop.
**Why:** a missed day already cost its points; what hurt was the absent player holding the cup
back. Two days, each with its grace, is about three days without showing up: long enough not to
punish someone who forgot once, short enough for a 7-day cup.
**Alternatives discarded:** taking them out of the table (their points were real, and the history
would change); 3 days (in a 5-day cup it would almost never apply); counting days in total (it
punishes forgetting, not leaving); making it optional (one more choice when creating the cup, and a
rule that changes between cups).
**Consequences:** if every player stops playing, all of them are out and the cup goes on with
nobody able to play it until it ends; the admin can bring them back. The demo has two new scenes
(`?test&demo=out` and `&demo=risk`) and `paths.mjs` three screens (`out`, `out-table`, `risk`).

## D-348 · The panel by domain: three bands, the period before, versions and CSV
**Date:** 2026-10-18 · **Status:** current · **Relation:** corrects D-207 (the sections); adds counters to D-44 and D-208
**Context:** the owner, as an analyst: `/panel/` should be a critical statistical source to understand
Juegos de Salón, split into reasonable domains, with reports from which operational, tactical and
strategic conclusions come easily; data that is missing can be captured.
**Decision:** the panel is navigated by **domain**: 📊 Summary (the front page, with Now inside), 👥
Group, 🧍 Individual, 🏆 La Copa, 📅 Uno al día, 🌎 Users (which takes Audience in), 📈 Traffic and 🩺
Health. The old addresses open the section that took their place (`#/games` → Group, `#/audience`
→ Users, `#/now` still opens).
- **Three bands in every domain:** 🩺 Pulse (operational: the numbers against the period before),
  🔍 Diagnosis (tactical: funnels and breakdowns to adjust a game, a text or a notification) and 🧭
  Trend (strategic: by week or month, cohorts).
- **The period before:** every main number says how it changed against the period of the same
  length right before it (green when it improves, pink when it worsens). The panel loads both.
- **The main metric:** games **finished** (rooms with an ending, offline games finished and La
  Copa games played), on top of Summary.
- **Versions on the timelines:** each period's bar names the versions that first showed up in it
  (from `v` in rooms and live games), to read "we changed X" next to "Y happened".
- **CSV:** every table can be downloaded.
- **Group and individual** are split by a registry flag (`individual` in `MODES`: solo and Uno
  al día), not by a list in the panel (C-16).
- **New counters** (under `stats/<env>/days/<day>/`, with no identifier): `fin/<game>/<mode>`
  (an offline game finished), `otra/<game>` (a replay, detected in `stats.js`), `comparte/<what>`
  (something shared, from `compartir()`), `vuelta/<band>` (days since the last visit, computed in
  the browser: `nueva`, `d1`, `d2-7`, `d8-30`, `d31`) and `frec/<band>` (how many of the last 28
  days the browser came, once a day).
- **New reports:** rooms step by step and their median length; finished and replayed; the real
  difficulty of each individual game (score and time quartiles from its endings, and how many were
  left halfway); La Copa step by step, participation by day of the cup and who was left out
  (D-347); what is shared and the visits each share brings (the viral factor); returns and
  frequency; users, cohorts and stickiness (D-349).
**Why:** the old sections showed data; an analyst needs questions answered at three horizons and
a way to connect a change with its effect.
**Alternatives discarded:** a separate analytics tool (it would send players' data to a third
party); keeping the sections and adding tabs (the domains mixed in Games and Audience).
**Consequences:** the new counters start the day they are published: there is no data back. The
first weeks of Users look all new, as the panel says. `public/panel/dominios.js` holds the pure
accounts (`dominios.test.mjs`); `look.mjs panel summary|group|individual|daily|users` shows them.

## D-349 · A random id per browser, to count users and cohorts
**Date:** 2026-10-18 · **Status:** current · **Relation:** corrects D-44 ("signals, not people") and D-208 ("no identifier")
**Context:** with counters only, the panel could not say how many people play a day, a week or a
month, nor whether those who came back. The owner chose to include it (D-348's phase 3).
**Decision:** each browser keeps a random 10-character id (`juegos-de-salon:dispositivo` in
`localStorage`) and marks itself active each day in `stats/<env>/days/<day>/activos/<id>`: 1 if it
visited, 2 if it started something. Nothing else goes with it: no name, no IP, no game, no page,
and it is never joined with rooms, Cups, rankings or the feedback. The panel only counts: active
per day, in 7 and 30 days, new ones, stickiness and cohorts by week with their returns on days 1,
7 and 30. Only the owner reads `stats/`, as always.
**Why:** retention and real reach are the strategic questions the panel could not answer; an id
that only says "the same browser as yesterday" answers them without knowing who it is.
**Alternatives discarded:** an id joined with the player's name or the rankings (that would be
following a person); hashing the IP (there is no server, and it would identify more).
**Consequences:** someone who clears their data, uses private mode or changes phone counts as new.
The panel says the counting starts with this decision. The search still does not look up people
(D-207).

## D-350 · The owner's panel in English
**Date:** 2026-10-18 · **Status:** current · **Relation:** changes the panel's exception to C-3 (it was Spanish only, PANEL.md)
**Context:** the owner asked for the whole panel ("el portal") in English, as its only language.
**Decision:** `/panel/` shows everything in English: sections, bands, notes, labels, dates
(`en-US`), the names of the games (`name.en` in `games.js`), the languages and countries (named in
English) and the mode labels of `MODES`, which only the panel reads. There is no toggle: one
language to keep. What the players see does not change: the app stays in its four languages, with
Spanish by default (C-3).
**Why:** the panel is read like an analyst's source, and the owner wants it in English; a second
language there would only double the texts.
**Consequences:** the panel's tests expect English; PANEL.md's exception to C-3 says English only.

## D-351 · A promotional splash over the home page, off by default and seen once
**Date:** 2026-10-18 · **Status:** amended by D-355 · **Relation:** extends C-17 (the home page)
**Context:** the owner wants to tell players about what is worth telling (three new games, a new
mode, a novelty) with a promotional window over the home page: most of the screen, the page
darkened behind, images and a link to each thing. It must not break the experience: it is not
always on, and whoever already saw it does not see it again.
**Decision:** `public/assets/js/splash.js` holds the campaigns (`CAMPAIGNS`, texts in the four
languages; each item is a game of `games.js` by id or its own content) and
the switch, `ACTIVE`, null by default. `node tools/agents/splash.mjs on <id> [--until YYYY-MM-DD] | off | list`
rewrites that line, and the change goes out in a PR with auto-merge. The home page shows the active
campaign 350 ms after drawing, once per phone: closing it (✕, the button, the backdrop, Esc) or
following one of its links records the id in `localStorage` (`juegos-de-salon:splash-visto`), so a
different campaign shows again to everyone. `?splash=<id>` shows any campaign on demand without
recording it (the owner's preview); `?test` and a browser driven by automation never see it, so the
end-to-end scripts are not blocked. Its sheet (`splash.css`) loads only when a window opens. On a
phone the items become rows and the texts are cut to two lines, so three items fit in a 320×640
screen without scrolling; with more, the window scrolls inside itself. **Each item shows a few
seconds of real play** (the owner's request, on seeing the first version with the link cards: they
repeated the texts): a muted looping MP4 of the board being solved, recorded from the game itself
in headless Chrome by `marketing/splash-clips/capturar.mjs` (now `marketing/splash/capture.mjs`, D-355) (360 px, 25–50 KB each), with the solved
board as its poster, still under reduced motion. **Each item is the way in** (also the owner's
request: the first button only closed the window): the clip, the name and ▶ Play open the game; the
way out is a quiet "Ahora no" under them, the ✕, the backdrop or Esc. The demo is
`/labs/splash/`: the real home page behind and the window over it, by campaign and language.
**Why:** a line in the repo is the simplest switch an agent or the owner can flip, and it reaches
everyone with the version, with no new Firebase path, rules or read on every visit.
**Alternatives discarded:** a Firebase flag (instant, but a read on every home page load and new
rules for a switch used a few times a year); showing it on every visit or every day (it would break
the experience the owner asked to protect); a separate page (players arrive at the home page).
**Consequences:** turning it on or off takes a publish (minutes, with auto-merge). A phone that
clears its data sees the campaign again. A new game in a campaign needs its clip recorded (one
entry in `capturar.mjs`). Views and clicks are not counted yet. **Amended by D-355**: every
campaign gets a full usability pass before it goes live and is kept in `marketing/splash/`.

## D-352 · A weekly report, as a PDF on disk and by email
**Date:** 2026-10-18 · **Status:** current · **Relation:** builds on D-348 (the panel's accounts) and D-317 (send-mail.py)
**Context:** the owner asked for a review every Sunday, once Saturday is over, of the most important
numbers and events of Juegos de Salón, as a PDF saved on disk and emailed to the owner.
**Decision:** `node tools/reports/weekly.mjs --send` builds it and a scheduled task of the app on the
owner's Mac mini (`weekly-report`, Sundays at 08:00 local time) runs it.
- **The week:** Sunday to Saturday (UTC days, like the panel), the last one already closed, against
  the week before.
- **What it says:** highlights, the headline (games finished, started, active browsers, visits,
  shares), day by day, and one block per domain of the panel (group, individual with its real
  difficulty, La Copa with its funnel and who was left out, One a Day, users, traffic, health), and
  the week's events: the versions released (the ones with something new in detail, the patches
  counted), the Cups created and how many player reports arrived.
- **Same numbers as the panel:** `tools/reports/weekly-data.mjs` only calls the panel's accounts
  (`dominios.js`, `aggregate.js`, `copas.js`); `weekly-html.mjs` is the page; headless Chrome
  (`tools/e2e/cdp.mjs`) prints it. Both pure parts are tested (`weekly-data.test.mjs`).
- **Where it goes:** the PDF in `~/Documents/Juegos de Salón/Weekly reports/` (`--out` changes it), and
  the email to the owner's own account (`toOwner` of `send-mail.py`, which now takes `attachments`).
  In English, like the panel (D-350).
**Why:** the panel answers when someone looks; a weekly report makes someone look, and keeps the
history of each week on disk.
**Alternatives discarded:** a GitHub workflow (the PDF would not be on the owner's disk, and the mail
account and the Firebase key would have to be secrets there); a report written by an agent from
scratch each week (its numbers would drift from the panel's).
**Consequences:** it needs the owner's Firebase key and mail account on the Mac mini, and the app
open on Sunday morning (a task due while the app is closed runs when it opens).

## D-353 · A result says each thing once
**Date:** 2026-10-18 · **Status:** current · **Relation:** extends C-19 and D-343 (what a result screen shows); corrects D-274 (the count-this offer is the one-line card); corrects D-106 (the standalone breakdown, folded and without the total or the time)
**Context:** the owner asked for a full pass over every result screen looking for redundant or
unnecessary information, "simply for the sake of simplicity", and then approved every proposal and
asked for a standard so future games follow it, inside the canons rather than in a new document.
The pass found the same facts said two or three times and long blocks above the buttons.
**Decision:** C-19 gains "What a result says, once", and these changes apply it:
- **Standalone La Copa games** (and One a Day on them): the 🧮 breakdown is folded and goes after the
  exits. Outside a Cup it no longer repeats the total ("Total: 80 puntos") or the time ("Tu tiempo
  fue…"), both already in the hero. In ¿En qué año? the open breakdown pushed Play again and Back
  to the menu below the fold, and in Reinas the menu button was cut.
- **One a Day card:** "Hoy: 80 puntos." is gone (the hero says it). The line comes back only to say
  how you compare ("Mejor que el 72 % de los que jugaron hoy.") or that this try was practice. "👋
  Invita a un amigo" is a folded row under a result; `/today/` keeps it open.
- **"¿Quieres que esta partida cuente en el ranking?"** (El Ahorcado, Dudo, Julepe, Generala, Toque
  y Fama, Línea de Tiempo, Batalla Naval…): the same one-line Sign in card as the rest, instead of
  the open form of about 370 px. Tapping it opens the form with the name already in, so the PIN is
  still all it takes, which is what D-274 wanted.
- **The Cup's podium:** the "🏆 Campeón" award line only appears for a shared title (a single
  champion is already the title and the 🥇). The chart's own "📤 Compartir" is gone once the Cup is
  over: it did the same as Share the summary.
- **Batalla Naval:** the subtitle no longer repeats the winner's shots and aim (each fleet carries
  its own); it says only "Perdiste" when you lost. Its buttons go right under the result, before the
  fleets.
- **Julepe:** "1 julepe", not "1 julepes".
- 🐞 and 💬 never show together: already true (`sinDoble`, D-341).
**Why:** a result is read in a glance on a phone; every repeated line pushes the next action down.
**Alternatives discarded:** a separate playbook document (it would repeat the canons, D-213);
removing the breakdown (D-106: the score is still explained, one tap away).
**Consequences:** `fin.test.mjs` checks the folded breakdown, the one-line count-this card, the
missing "Hoy: X puntos", the podium's single share and the singular julepe. The smaller findings of
the pass (the "Tu puntaje" label, the name in the header chip and the title, `/today/`'s equal
streak tiles) are left as they are for now.

## D-354 · The move to English gets an owner and a ratchet
**Date:** 2026-10-18 · **Status:** current · **Relation:** completes D-316 (its phase 2, and who carries out phases 3 to 5)
**Context:** the owner asked why files and names are still Spanish when D-316 says everything
internal is English (`AGREGAR-JUEGO.md`, for one). D-316 planned the move in phases, but after
phase 1 nobody owned the rest: there was no list, no issue and no round that moved it forward.
Meanwhile new text did go in English, which is what D-316 asks until each phase lands.
**Decision:**
- **Phase 2, done:** `node tools/agents/english.mjs scan` lists every tracked path with a Spanish
  word, and `docs/english-renames.json` keeps each one with its English name, its phase (3 the
  workshop, 4 the app code, 5 the documents) and its state. At the start, 230 names: 206 to rename
  and 24 kept on purpose, with their reason:
  - the bridge pages of the old Spanish URLs (`public/dudo/` and the like, D-192);
  - the link-card images named by the game id (`og/ahorcado.jpg`), which are data.
- **The owner of phases 3 to 5 is the processes agent:** `processes.mjs check` counts what is left,
  and when no other PR is open it renames the next part (`english.mjs next`, up to ten names) in its
  round's PR, with `git mv`, every reference updated, and the tests and the end-to-end suite green.
  Persisted keys (game ids, Firebase paths, `localStorage` keys) stay out of it, as D-316 says.
- **A ratchet:** `tools/agents/english.test.mjs` fails when a Spanish name appears that the list
  does not have, and when a proposed name is still Spanish or two would collide. So the list only
  shrinks.
- **Identifiers inside the code** are renamed with their file in phase 4, not listed one by one.
**Why:** a rule with no owner and no mechanism stays a wish; here it becomes a count the processes
agent sees every day and a test that stops new Spanish names.
**Alternatives discarded:** renaming everything in one PR (D-316 rules it out: it would collide with
every open PR and could break links and published assets); leaving it to whoever touches a file
(that is what stalled it).
**Consequences:** the proposals in `docs/english-renames.json` are a starting point: whoever renames
a part reads its proposal and fixes it if it is wrong before `git mv` (`ADD-GAME.md`, `ONE-A-DAY.md`).

## D-355 · A splash campaign passes usability before it goes live, and is kept in marketing
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-351; builds on D-132 (the usability agent), D-178 (marketing assets) and D-304 (how much usability a PR gets)
**Context:** the first campaign (`tres-juegos-demo`) went live in a one-line PR, without the usability
agent: its texts and clips are the first thing every player sees, and nobody had read them in the four
languages. The owner asked that every future splash pass the usability review, and that the
campaigns made be kept in a folder of their own inside `marketing/`.
**Decision:** a PR that turns a campaign on or changes one gets a **full usability pass of that
campaign, whatever its stage**. It is mechanical, not a memory: `covers.mjs check` reads the diff of
`splash.js` and prints 📣 with the campaign and its texts in the four languages; the usability agent's
step 6 says what to look at; `tools/e2e/paths.mjs` gives each campaign a screen (`look.mjs splash <id>`),
so the language tests go through every campaign too; and `splash.mjs on` reminds it. Turning a
campaign off is not reviewed: it shows nothing new. **`marketing/splash/`** is the asset's memory:
its README (how a campaign is made), `capture.mjs` and `clips.md` (moved from `marketing/splash-clips/`),
and `campaigns/<id>/` for each campaign, with a README (what, dates, PR, how it went) and its
screenshots at 390 px in the four languages; `marketing/splash/campaigns.test.mjs` fails if a
campaign in `CAMPAIGNS` has no folder.
**Why:** a rule that only lives in a document is what let the first campaign through; a 📣 line in
the check the agent already runs, and a test, make it hard to skip.
**Alternatives discarded:** a CI check that blocks the merge until someone ticks a box (one more gate
for a few PRs a year); reviewing only the texts (the clips and links fail too).
**Consequences:** turning on a campaign is no longer a one-minute PR: it waits for the usability
agent. A new campaign needs its folder before its PR passes the tests.

## D-356 · Promotional material lives in marketing/, and what the site serves names its asset
**Date:** 2026-10-18 · **Status:** current · **Relation:** extends D-178 (marketing assets); keeps D-192 (public/ is the site as served); builds on D-181 (share cards)
**Context:** the owner asked that everything promotional (share images, promo MP4s, splash pages)
live in order in `marketing/`. Some of it already did (the video, the teasers, the Agents card), but
the share cards' drawing was in `tools/release/og/`, and the files the site serves (the share images,
the splash clips, the email header, the video's thumbnail) had no asset that said how they were made.
**Decision:** the **sources** of every promotional piece live in `marketing/<asset>/`: its README (the
memory), its drawing or template, its build script and its originals. The **files the site serves**
stay in `public/` (the site is `public/` as served, so the local server and the publish need no
copy step), and each asset lists them in `servido` in `marketing/registro.json`.
`marketing/served.test.mjs` fails if a promotional file in `public/` (everything in
`public/assets/og/`, `splash/` and `email/`, and every page's `og:image`) belongs to no asset, or if a
`servido` entry matches no file. The share cards become an asset, `marketing/share-cards/`, with
`card.html` moved there from `tools/release/og/`; `og.mjs` stays in `tools/release/` because it also
writes the pages' card blocks and the bridge pages, which are the site.
**Why:** one place to look for any promotional piece, without breaking the rule that what is served
is what is in `public/`.
**Alternatives discarded:** keeping the served files only in `marketing/` and copying them into the
site when publishing (the local server would not show them without an extra step, and it breaks
D-192); moving `og.mjs` too (half of what it writes is the site).
**Consequences:** a new promotional file in the site needs its asset's `servido` entry. Changing
`card.html` changes every card's fingerprint (D-181): the move recomputed them, the drawing did not
change. The README's screenshots (`docs/screenshots/`) are documentation, not promotion: they stay.

## D-357 · A La Copa win by name alone joins the only player with that name
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-212 (the champions' medal table)
**Context:** Pepenbauer won two cups, one with their player and one with only their name, and the
medal table showed two Pepenbauer rows with one gold each: wins with a player add up by its jid, and
wins without one by name, and the two never met. The owner asked to merge these cases, also for the
cups already played.
**Decision:** `medallero()` (`public/assets/js/records.js`) folds a name-only row into the row of a
player with the same name (`claveNombre`) **when exactly one player has that name**. With two or more
players of that name the row stays apart, because it cannot be told whose it is. It is done when the
table is read, not in Firebase, so it applies to every cup already stored and to future ones.
**Why:** a returning champion who forgot to sign in once is far more common than two different people
with the same name, and with a single player of that name the merge is very likely right.
**Alternatives discarded:** writing the jid into the stored podiums (a data fix only for the past
cups, which would have to be repeated); merging by name always (it would add up two different people
who share a name).
**Consequences:** a name-only win can join someone else's player if two different people use the
same name and only one of them has a player; it is the trade accepted.

## D-358 · The usual name and PIN carry a player's history into La Copa
**Date:** 2026-10-18 · **Status:** current · **Relation:** builds on D-212 and D-220; D-357 stays as the fallback for wins nobody signs
**Context:** a champion who joins a cup without signing in to their player on that phone loses the
win from their history: the podium is saved by name alone. The owner wants someone to get history
and continuity just by using their usual name and PIN.
**Decision:** (1) when a phone with no player creates, joins or sits in a cup, the cup PIN it typed
is tried as the player PIN for that name (`J.entrar`); if it opens a player, the phone enters as
them, a toast says so, and the cup links as before. A hint under the cup PIN tells players this.
(2) When a player sits in a finished cup whose podium was saved without them, `firmarPodio()` writes
their jid into `torneoPodios/<code>/p/<pid>/j`. The rules allow that one field only if it was empty,
only from a phone seated as that cup player, and only with the jid the cup player is linked to. So a
win is claimed by proving both PINs: the cup's and the player's.
**Why:** most people use one PIN everywhere, so this needs no new screen and no new step. Tying the
claim to the cup seat means nobody can sign someone else's win.
**Alternatives discarded:** an id made from the name and the PIN hash (a 4-digit PIN is guessed in a
second from it, and changing the PIN or name would split the person); a separate "claim this win"
screen (more steps for the same proof); dropping D-357 now (Pepenbauer's stored win would split
again until they reopen that cup).
**Consequences:** someone whose cup PIN differs from their player PIN still joins as before and
gets no history from that cup unless they sign in to their player on that phone first.

## D-359 · With a player signed in, La Copa asks for no cup PIN
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-96 (the cup PIN) and D-220 (the two PINs); builds on D-358
**Context:** with a player on the phone, La Copa still asked for a second PIN, the cup's. The owner:
the player's PIN plus being signed up in the cup is enough. The cup PIN stays for people with no
player (the owner chose that over requiring a player for La Copa).
**Decision:** with a player signed in on the phone (`leerYo()`), creating or joining a cup hides the
PIN fields; the cup player gets a random key nobody needs, so the seat and the admin's "new PIN" work
as before, and the cup player is linked to the player at once. Opening a cup where this phone's player
is linked to a cup player seats the phone with no screen (`sentarseSolo`); on "Ya estoy inscrito",
that player needs no PIN, and any other still does. The seat value is then the jid
(`sentarseComoJugador`), and the rules accept it only if `players/<pid>/j` is that jid and
`jugadorSeats/<jid>/<uid>` exists, which only a phone that typed the player's PIN has. A name already
in the cup that is not linked to this player is turned away with `errRepetido` ("entra por Ya estoy
inscrito", where the cup PIN still works).
**Why:** one PIN for everything is what makes the player worth having, and the proof is the same: the
player's PIN, checked by the rules.
**Alternatives discarded:** requiring a player to play La Copa (one more step for first-timers); no
key at all for those cup players (the admin's reset and the rules' seat check rely on it).
**Consequences:** someone who joined with a player and later plays from a phone without it needs the
cup PIN they never saw: they sign in to their player instead, or the admin gives them a new PIN.

## D-360 · A game-ideas agent: three ideas a week, each with evidence, as one-tap decisions
**Date:** 2026-10-18 · **Status:** current · **Relation:** extends D-273 and D-276 (the processes agent dispatches it and follows up its issues); reuses D-273's one-tap decisions, D-280 (Proyectos activos and La Bodega) and D-304 (a prototype is a lab-only PR); applies D-338 (the owner's time)
**Context:** the owner asked for a brainstorming agent that knows the games, knows what is popular
elsewhere and proposes improvements: meta-game dynamics, existing features, new games. Until now
every new game came from the owner asking to investigate one (Codenames, ColorSweeper, Junction
Nine, Number Match, Shikaku); there was no ledger of what was tried and why it stopped (El caso and
La clave went to La Bodega, D-280), the home page's order is a frozen count (D-255) and the panel's
new numbers (D-348: finish rate, abandons, cup days skipped, returns, shares) had no reader asking
"what should we try?". The feedback inbox's 🎲 game-idea kind (D-341) had no owner either.
**Decision:** a fifth agent, `.claude/agents/ideas.md`, with its tool `tools/agents/ideas.mjs` and
its memory `docs/ideas.json`:
- **Evidence first.** `ideas.mjs check` reads as administrator what the panel reads and prints the
  games by plays against `POPULARIDAD` (a game that moved three places or more, or is missing, is
  an idea: refresh the order), the one-player games with the weakest finish (ten starts or more),
  the room funnel, La Copa by game and by day, Uno al día's returns, users and shares, the lab's
  two groups, the `feedback:game-idea` and open `feedback:suggestion` issues, and the ledger. An
  idea quotes those numbers or those requests, never a metric of its own.
- **Three lanes:** meta-game (what brings a player back and brings a friend), existing games (the
  weak numbers), new games (what is popular elsewhere and fits the house: phone first, 3 to 10
  minutes, four languages or none, 0 to 100 with a seed, deducible without guessing, the
  inspiration credited on the cover page).
- **At most three ideas per round, one issue, once a week**, opened through `processes.mjs decide`
  (D-273) so it reaches the owner by email with a Yes and a No per idea. Each idea carries its
  evidence, its cost in PRs (a new game is all of `docs/AGREGAR-JUEGO.md`), how it is tried first
  (a lab project, a flag, a variant) and the panel number that would prove it. A Yes queues the
  prototype for the processes round, which launches a session to build it as a lab-only PR
  (D-304); a No is recorded with the owner's reason. No new issue while the last one is unanswered.
- **The ledger remembers.** `docs/ideas.json` keeps every idea with its status (`proposed` →
  `approved` or `discarded`; `approved` → `prototyped` → `graduated` or `shelved`) and why, and
  `taste`: one line per thing the owner's answers taught, the way the marketing memory keeps "Lo que
  el dueño quiere" (D-178). A discarded or shelved idea is not proposed again as new; it comes back
  only with what changed.
- **It builds nothing.** It touches `docs/ideas.json` and nothing else; its PR carries only that
  file, with auto-merge (D-313). The processes agent dispatches it once a week (`toDispatch`,
  `dispatches.ideas`) and on the owner's request, and reviews its issue against the criteria in its
  guide. What is decided in `docs/DECISIONES.md` is not re-proposed (D-65, D-68, D-198, D-255,
  D-288, D-331, D-332 are the ones it most often brushes against).
**Why:** the owner's request. An idea generator without evidence produces noise, and the owner is
already the bottleneck of every decision (D-338): the agent's value is to turn the numbers the
panel now has, the players' requests and what is popular outside into few, grounded proposals, and
to remember the answers so the same idea is not pitched twice.
**Alternatives discarded:** a daily round (the owner cannot answer ideas every day, and the numbers
move by the week); letting it open the prototype PR itself on a Yes (the processes round already
owns the queue and the agents' review; one path for every build); a free-form backlog document
(nobody reads a list; a ledger with statuses and reasons is what the next round needs).
**Consequences:** `processes.mjs check` lists `ideas` among the dispatches once a week;
`processes.test.mjs` and `ideas.test.mjs` cover the pure parts; `CLAUDE.md` names the agent. The
first round proposes the first three ideas; this PR opens none.

## D-361 · The home page's order every week, a 🔥 "Popular" label in the lab, and the lab in three groups
**Date:** 2026-10-18 · **Status:** amended by D-363, D-369, D-373 · **Relation:** corrects D-255 (the order, refreshed by hand from plays) and D-280 (the lab's two groups); extends D-333 (the "New" sticker) and D-351 (the splash demo's bar)
**Context:** the game-ideas agent's first check (D-360) showed 18 games three or more places away from
the order D-255 counted on October 9. The owner asked for the order to update every week, to put the
best of the app in front of a new player, and for a 🔥 "Popular" label on the top three; then, to try
the label in the lab before shipping it, to separate the lab's games from its other improvements, to
keep and grow the splash demo's experiments bar ("experimentos en el Landing page"), and to give the
label the same look as "New", in other colors and with the flame.
**Decision:**
- **The order counts games finished, every week.** `tools/agents/popularity.mjs` counts the last four
  weeks with the panel's accounts: offline games that ended (the per-game log or the D-348 counter,
  whichever says more for that game), rooms that ended and La Copa days played (under their game, and
  all together as La Copa). Finished, not started: a game people often leave halfway should not be the
  first thing a new player meets. `POPULARIDAD` stays a fixed list in `games.js`, so the home page
  still needs no database to draw (D-255's reason holds); `update` rewrites it and its date,
  `POPULARIDAD_FECHA`. The processes round runs it once the list is a week old (`processes.mjs check`
  says so) and the change goes in its PR. This PR applies the first count. New games keep going on
  top while they say "New" (D-335), and the filters keep the same order.
- **🔥 "Popular" on the top three** (`populares` in `games.js`): the first three of the order that are
  not La Copa (it has its own card) and do not say "New" (that label says more). The same sticker as
  "New" (dark, tilted, white edge, gradient through the letters, breathing glow, wobble, still with
  reduced motion) in fire colors, with the 🔥 outside the gradient. Text: Popular, Popular, Popular,
  Beliebt. **It is in the lab, not on the home page** (`POPULAR_EN_PORTADA = false`): only `/?popular`
  shows it. Shipping it is turning that flag on, in its own PR, with the usability agent's full pass.
- **The lab's experiments bar is kept and grown.** `public/labs/experiments.css` is the bar the
  splash demo had, shared. `/labs/home/` shows the real home page with one switch per experiment of
  `public/labs/home/experiments.js` (each one a URL parameter the home page reads), the language, and
  the way back to the lab. A new home page experiment is an entry there plus its parameter; when it
  ships, the entry goes.
- **The lab in three groups:** 🎲 Juegos en prueba (`#activos`), ✨ Mejoras en prueba (`#mejoras`: the
  splash and the home page's experiments) and 📦 La Bodega. `ideas.mjs` reads the three.
**Why:** the owner's requests. A list counted once by hand drifted in nine days; a weekly count keeps
the home page honest without making it read the database. Trying a label on the real page, in the
four languages, before players see it, is what the lab is for, and the owner liked the splash bar.
**Alternatives discarded:** ordering live from Firebase (D-255: the page would wait for the database);
counting starts (it rewards games people abandon); labelling La Copa or a "New" game as popular.
**Consequences:** `popularity.test.mjs`, `games.test.mjs` and `tools/e2e/home/lab.mjs` cover it; C-17
says the new order and the label.

## D-362 · "✨ Nuevo" and "🔥 Populares" as filters, in the lab
**Date:** 2026-10-18 · **Status:** amended by D-369 · **Relation:** extends D-361 (the home page's experiments, the popular label), D-333 (New), D-142 and D-238 (the filters and ⭐ Favoritos)
**Decision:** the owner's request: two more chips above the four types, in a row of their own: **✨ Nuevo**
shows the games that say "New" (`esNuevo`), **🔥 Populares** the three with the label (`populares`).
Same pill as ⭐ Favoritos; each one shows only when it has games; tapping it again clears it; the link
keeps it (`?type=new`, `?type=popular`). Texts: Nuevo / Populares, New / Popular, Novo / Populares,
Neu / Beliebt. **In the lab** (D-361): only with `?picks`, a switch of `/labs/home/` (✨ Filtros). It
ships together with the popular label, in its own PR, with the usability agent's full pass.
**Why:** the owner's request; a returning player looking for what is new, or a new one for what others
play, gets there in one tap. Tried in the lab first, as the owner asked for the label.
**Consequences:** `tools/e2e/home/lab.mjs` checks the row above the types in the four languages at
320 px and that each chip filters; C-17 says it.

## D-363 · The home page's experiments run on the real home page, without a frame
**Date:** 2026-10-18 · **Status:** current · **Relation:** corrects D-361 (`/labs/home/` showed the home page in a frame)
**Context:** the owner, on an iPhone: "the menu is not floating in Labs". Safari on an iPhone grows a
frame to the full height of its page, so the home page inside `/labs/home/` never scrolled itself and its
sticky filter bar never stuck; in Chrome it did.
**Decision:** `/labs/home/` opens the home page itself (`/?test&lab&lang=es&popular&picks`, every
experiment on). With `?lab` the home page draws the experiments bar (`drawBar` in
`public/labs/home/experiments.js`): ‹ Lab, one switch per experiment and the language; each one reloads
the page with the new address. `public/labs/experiments.css` keeps only the bar (above everything, the
install banner included); the splash demo keeps its own frame, where nothing needs to scroll.
**Why:** what is tried has to behave as it will for a player, on the phone the owner uses.
**Consequences:** `tools/e2e/home/lab.mjs` checks that `/labs/home/` lands on the home page with the bar,
that the filters stick when the page scrolls, and that the bar never shows without `?lab`.

## D-364 · The floating menu carries the app's name, and ⭐ Favoritos joins Nuevo and Populares, in the lab
**Date:** 2026-10-18 · **Status:** amended by D-369 · **Relation:** extends D-362 (the ✨ Nuevos / 🔥 Populares row) and D-241 (where ⭐ Favoritos goes)
**Context:** the owner asked whether the floating menu could carry the logo or the title, and noticed the
⭐ Favoritos star was missing: with the new row it was squeezed, as a bare ⭐, in front of the four types.
**Decision:**
- **⭐ Favoritos in the Nuevo / Populares row** when that row is on (`?picks`): first in it, with its
  name; with its name and less air; or the ⭐ alone, whichever fits first (`acomodarFav` measures). From
  360 px it keeps its name in the four languages; at 320 px, only in German. It still appears only once a
  game is marked (D-238), and without the row it goes where D-241 put it.
- **🎲 Juegos de Salón on top of the floating menu** (`?brand`, a third switch "🎲 Título" at
  `/labs/home/`): the app's name in the title's font and rainbow, only while the filters float, never in
  their place under the real title; a tap goes back to the top.
**Why:** the owner's requests. Scrolling a long list, the floating menu still says where you are; and
the star in the row of quick picks is one line less than in its own (156 px floating at 320 px with a
favorite, the title included, against 178 without the title).
**Also:** the chip says **Nuevos** (Novos in Portuguese), in the plural like Populares (the owner's
correction of D-362's "Nuevo"); the bare ⭐ is centered in its chip (it sat 5 px from one side and 17
from the other, also in the types row since D-241); the title is 44 px tall (C-8).
**Consequences:** `tools/e2e/home/lab.mjs` checks both; C-17 says them. They ship with D-361's label and
D-362's filters.

## D-365 · Every job in one registry, and the frequent ones run on the Mac without Claude
**Date:** 2026-10-18 · **Status:** current · **Relation:** extends D-318 (the hola@ inbox) and D-276 (the round on the Mac mini)
**Context:** an email to hola@ waited for the daily round to become an issue. The owner asked to be
more responsive at very low cost, and that every job of the project be orchestrated centrally, none out
of sight, in a way that scales. The jobs were spread out: two scheduled workflows, two scheduled tasks
in the Claude app, a session hook, and nothing listing them together. A Claude app task checking the
inbox every 15 minutes would open 96 sessions a day, almost all to find nothing.
**Decision:**
- **`tools/jobs/jobs.json` lists every job**, wherever it runs: `github` (a scheduled workflow), `mac`
  (a launchd job on the Mac mini), `app` (a scheduled task in the Claude app) or `hook`. Each says
  what it does and which decisions it follows. `node tools/jobs/jobs.mjs status` shows them all with
  their last run.
- **`jobs.test.mjs` keeps it whole:** a scheduled workflow missing from the registry, or with another
  cron, fails the `tests` check.
- **A frequent job that usually finds nothing is a `mac` job:** a plain script that checks for free and
  calls Claude only when there is work. `jobs.mjs install` writes the launchd plists from the registry
  (`cl.juegosdesalon.<id>`); they run `jobs.mjs run <id>` from the main folder (one at a time, logged
  in `~/Library/Logs/juegos-de-salon/`, last run in `~/.config/juegos-de-salon/jobs/`).
- **The first one is `inbox-watch`**, every 5 minutes: it counts the emails in `buzon/`; with one, it runs
  the support agent headless (`claude -p --agent support`, Haiku, allowed only `inbox.mjs`, Read and
  Write) and launches `feedback.yml` so the issue appears at once. The hourly app task tried the same day
  is deleted.
**Why:** one place to see and change what runs; checking costs nothing, only the work found costs tokens.
**Consequences:** a new job is an entry in `jobs.json` (and, if it's `mac`, `jobs.mjs install` on the Mac
mini). The processes round still triages what the watcher misses. `tools/jobs/README.md` explains it.

## D-366 · Feedback issues mask the player's name, and the email mask keeps both ends of each side
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-279 (the full name on the issue) and D-317 (the email mask)
**Decision:** Owner's request, after issue #538 showed a player's full name on the public repo:
- **Who** shows each word of the name by its first letter, the rest asterisks, one per letter
  (`Cristina Alvarado` → `C******* A*******`; `enmascararNombre` in `public/cup/reportes.js`,
  used by `tools/agents/feedback.mjs`). Enough for the owner to recognize who it is.
- **The email mask** keeps the first and last letter of each side of the @, with a fixed eight
  asterisks between them so the length says nothing: `j********n@g********m` (`enmascarar`, same
  file). The address stays only in the private `feedbackContacto/<id>`, as before.
- The reply's greeting takes the name from the report in `feedback/<id>`, not from the issue.
- The Firebase rule and `feedback.mjs` accept the older mask too, so a cached app's report still gets
  in. The open `feedback` issues were re-masked by hand; GitHub keeps their edit history.
**Why:** the repo is public and its issues are indexed; masking when the issue is created is the only
thing that keeps the name off GitHub. D-279 argued `feedback/` is already readable without a key,
which is true but a much smaller exposure than an indexed issue.
**Consequences:** `feedback.test.mjs` checks that the full name never reaches the body;
`reportes.test.mjs` checks both masks and that the rule lets the new and old ones in.

## D-367 · Bulls and Cows on two phones: both guess at once
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-19 (on two phones nobody starts: both guess at once)
**Decision:** In 📡 two-phone rooms both players guess at the same time, each at their own pace, without
waiting for the other. A player who cracks the number waits, watching the rival's board, until the rival
cracks it too; then the final screen shows for both. Fewer guesses wins; the same number of guesses is a
tie. The right of reply is gone there (both always get the same chances) and its switch only shows in 📱
one phone, which stays turn-based. Rooms carry `config.parallel: true`; a room without it (opened before)
plays by turns. Each guess carries `n`, its number in its player's own list, and a reply names it with
`of` and `n`, because with both guessing at once each phone may see the two guesses in a different order.
**Why:** A player's suggestion by email (#538): the two halves of the game are independent, so waiting for
the rival's turn on two phones was dead time. It stays one player against another: both boards are on
screen and the result waits for both.
**Consequences:** `view()` in `public/bulls-and-cows/game.js` has a parallel branch (`canGuess`,
`solvedIn`); who starts (D-19) only matters on one phone.

## D-368 · When we build a player's idea, the reply follows one standard and closes the issue
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-317
**Decision:** When a change comes from a player's feedback, the email reply goes out only once the change
is live (merged and published), and its answer has three parts: thanks for their time and the idea, what
changed and how it plays now, and what stayed as it was. `feedback.mjs reply` then comments on the issue
what we answered (quoted, without the address), adds the `replied` label and closes it as completed.
**Why:** The owner's request with #538: the player hears back when they can try it, and the issue shows
what they were told without anyone doing it by hand.
**Consequences:** `.claude/agents/processes.md` (step 3, the email reply) describes it; the test is in
`tools/agents/feedback.test.mjs`.

## D-369 · 🔥 Popular, the ✨ Nuevos / 🔥 Populares filters and the name on the floating menu reach everyone
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-361, D-362 and D-364 (they were in the lab); keeps D-363 (the lab bar) for the next experiments
**Decision:** the owner, after trying them in the lab: "hagamos merge en producción". The 🔥 Popular label
on the top three, the row of ✨ Nuevos and 🔥 Populares chips (with ⭐ Favoritos first in it) and
"🎲 Juegos de Salón" on top of the floating filters are on for every player; `POPULAR_EN_PORTADA` and the
`?popular`, `?picks` and `?brand` parameters go away, and so do their switches: `/labs/home/` keeps the
bar (‹ Lab and the language) and its list of experiments, empty today. One last adjustment the owner
asked for: the floating menu's frosted background reaches 4 px below its last row, so the space under
the filters (12 px) matches the space above the title's letters (11 px), without moving the list.
The title does not take room in the page: the floating filters stop 36 px below the top and the title
fills that space, out of the flow, so the list never jumps when the menu starts floating (a first
version pushed it 44 px down, and the end-to-end tap on a ⭐ missed in CI).
**Why:** the owner's decision; the usability agent's full pass over the home page in the four languages
went with it, as D-361 asked.
**Consequences:** `tools/e2e/home/popular.mjs` checks what players see (the label, the chips and their
filtering, ⭐ in the row and centered, the title and its tap, the two spaces); `tools/e2e/home/lab.mjs`
keeps the lab's groups and the bar. The lab card says nothing is being tried on the home page today.

## D-370 · A reply in the sender's own thread does not quote their email
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-317
**Decision:** When `feedback.mjs reply` answers in the thread of the player's email (D-327), it leaves out the
quote of that email: the player sees it right above. A report that is not that email (a 🐞 report, or an
email from another thread answered in the same reply) is still quoted above its answer. A test email
(`--test-to`) has no thread, so it quotes everything.
**Why:** The owner's rule after the reply to #538: quoting what is already on screen in the thread is noise.
**Consequences:** `inThread` in `tools/agents/feedback.mjs` decides it; the test is in `tools/agents/feedback.test.mjs`.

## D-373 · The "New" and "Popular" stickers, softer
**Date:** 2026-10-18 · **Status:** current · **Relation:** amends D-333 (the "New" sticker) and D-361 (🔥 "Popular", the same sticker in fire)
**Decision:** both stickers keep their tilt, the shimmer through their letters and the wobble, but blend
with the card: a see-through fill (45 % of their dark color) instead of a solid one, a 1 px edge in a
faint tint of their own color (cyan for "New", orange for "Popular") instead of the 2 px white one, a
lighter shadow, and a breathing glow about a third as strong.
**Why:** the owner's request: on the cards they looked too strong. The owner approved this version on
their phone.
**Consequences:** only the CSS in `public/index.html` changes; the canon's "New" item describes the new look.
