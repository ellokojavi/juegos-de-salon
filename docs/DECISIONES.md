# Decisiones de diseño y arquitectura

Registro tipo ADR (Architecture Decision Record). Las decisiones se numeran y no se borran: si una cambia, se agrega una nueva que la reemplaza.

## D-01 · Stack: HTML/CSS/JS puro, sin build
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Sitio estático con módulos ES nativos. Sin bundler, sin framework, sin `package.json`.
**Por qué:** Se publica directo en GitHub Pages, cualquiera puede leer y modificar el código, y la complejidad de los juegos de salón no justifica un framework. Cumple RP-10.
**Consecuencias:** Hay que servir por HTTP en local (`python3 -m http.server`). Si el proyecto crece mucho (decenas de juegos, estado compartido), se reevalúa.

## D-02 · Un juego = una carpeta con su propia URL
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Cada juego vive en `/<id>/` con su `index.html`, `game.js`, `rules.js` y `style.css`. El menú se genera desde `assets/js/games.js`.
**Por qué:** URLs compartibles por juego, aislamiento total entre juegos (uno roto no rompe a los demás) y facilidad para agregar juegos (ver [AGREGAR-JUEGO.md](AGREGAR-JUEGO.md)).

## D-03 · Datos separados de la lógica
**Decisión:** Las reglas, textos, penitencias y categorías viven en `rules.js` como datos puros. `game.js` solo contiene la máquina de estados y el render.
**Por qué:** Permite ajustar reglas y variantes (CR-17) sin tocar lógica, y eventualmente cargar variantes desde JSON.

## D-04 · Orden de asiento = orden de ingreso, hacia la derecha
**Decisión:** Los jugadores se anotan en el orden en que están sentados, avanzando hacia la derecha. Así, el “compañero de la derecha” del jugador N es el N+1 y el de la izquierda es el N−1 (circular). El turno también avanza hacia la derecha.
**Por qué:** Es la convención más natural para pasar el celular por la mesa y permite que la app nombre a las personas (CR-06) en vez de solo decir “el de la derecha”.

## D-05 · Género para J y Q
**Decisión:** Al ingresar jugadores se elige ♂ hombre, ♀ mujer o ⚧ otro. J hace tomar a ♂ y ⚧; Q hace tomar a ♀ y ⚧. Si no hay nadie del género que corresponde, toma quien sacó la carta.
**Por qué:** Las reglas originales usan género. “Otro” toma en ambas para no dejar a nadie fuera de la fiesta (regla de la casa, documentada y fácil de cambiar en `resolveTargets`).

## D-06 · Fin de partida con el cuarto rey
**Decisión:** Al salir el cuarto rey, ese jugador se toma el vaso y la partida termina con pantalla final y opción de “otra ronda” con mazo nuevo y los mismos jugadores.
**Por qué:** Es la versión más común del juego y evita rondas largas sin tensión después del cuarto rey. Se descartó “seguir hasta agotar el mazo” (queda como variante posible, CR-17).

## D-07 · Mini-juegos: reglas + ayudas simples, no implementación completa
**Decisión:** Cuenta Cuentos, Chancho Inflado, Cultura Chupística y Nunca Nunca se juegan de viva voz. La app explica las reglas, indica quién parte y ofrece ayudas: temporizador de 5 s, categoría al azar, idea de “nunca nunca”, y selector de perdedor (suma 2 sorbos).
**Por qué:** Estos juegos son sociales por naturaleza; llevarlos a pantalla les quita gracia y alarga la versión inicial. Una implementación completa queda como mejora futura.

## D-08 · Chancho Inflado es “diferido”
**Decisión:** Quien saca el 6 puede inflar las mejillas en cualquier momento posterior. La app lo explica y deja marcar al perdedor de inmediato o seguir jugando (“Nadie perdió / seguir”).
**Por qué:** Así se juega habitualmente en Chile; la sorpresa es la gracia.

## D-09 · Contador de sorbos aproximado
**Decisión:** La app lleva un ranking de sorbos por jugador solo con fines lúdicos (pantalla final). Cuenta automáticamente las reglas deterministas y suma 2 sorbos al perdedor de mini-juegos o al que se arruga en una penitencia. El cuarto rey se cuenta como “fondo”.
**Por qué:** Da un cierre entretenido sin obligar a los jugadores a registrar nada durante el juego.

## D-10 · Persistencia en localStorage
**Decisión:** La partida completa (`juegos-de-salon:cuarto-rey:game`) y la lista de jugadores (`juegos-de-salon:players`) se guardan en `localStorage` tras cada acción. Al abrir el juego se ofrece “Continuar”.
**Por qué:** El celular pasa de mano en mano y se bloquea o cierra fácil. No se usa servidor (privacidad, RP-10).

## D-11 · Identidad visual
**Decisión:** Fondo oscuro morado/azul con degradados y luces flotantes; acentos neón (rosado `#ff2e88`, amarillo `#ffd23f`, cian `#2ee6d6`, lima). Titulares en **Bangers** (cómic/fiesta), cuerpo en **Nunito** (redonda, legible). Botones grandes tipo “pill” con sombra sólida y rebote al presionar. Animaciones: volteo 3D de carta, pop de textos, confeti en el cuarto rey y al final.
**Por qué:** Refleja el ambiente de carrete nocturno pedido en RP-07, mantiene legibilidad con poca luz y respeta `prefers-reduced-motion`.

## D-12 · El celular reemplaza al mazo físico
**Decisión:** No se pide un naipe real: la app baraja 52 cartas y muestra la carta con palo y número.
**Por qué:** Cumple RP-06 (el celular guía) y evita desincronización entre mazo real y app. Si un grupo quiere usar naipe real, es una variante posible (CR-17).

## D-13 · Publicación en GitHub Pages desde `main`
**Decisión:** Repo público `ellokojavi/juegos-de-salon`, Pages sirviendo la raíz de `main`, con `.nojekyll`.
**Por qué:** Cero configuración de CI; cada push publica. URL: https://ellokojavi.github.io/juegos-de-salon/

## D-14 · Transición entre turnos como overlay de dos etapas
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Al cerrar una carta, un overlay a pantalla completa muestra (1) "¡Salud!" con los que toman, que avanza solo a los 2,6 s o al tocar, y (2) "Pásale el celular a X" con el botón "¡Dame la carta!". El estado del juego avanza antes de mostrar el overlay y la mesa se redibuja detrás.
**Por qué:** Separa tres momentos que antes se pisaban: decidir quién toma, tomar, y que el siguiente jugador reciba el celular listo para sacar carta (CR-19). Avanzar el estado primero garantiza que, si se cierra el navegador en la transición, la partida se retoma en el turno correcto.

## D-15 · Carta grande que se encoge al descubrirse
**Decisión:** Boca abajo la carta mide el 80 % del ancho (máx. 340 px) con brillo pulsante; al tocarla gira en 3D (0,75 s), se encoge al 38 % (0,5 s) y recién ahí aparece el panel de instrucciones. El tamaño del pip se define con unidades de contenedor (`cqw`) para que escale con la carta.
**Por qué:** Un objetivo grande es más fácil de tocar en una mesa con poca luz (CR-20), y encoger la carta deja las instrucciones visibles sin scroll en la mayoría de los celulares.

## D-16 · Internacionalización simple con diccionarios por idioma
**Decisión:** Un módulo compartido `assets/js/i18n.js` guarda el idioma en `localStorage` (`juegos-de-salon:lang`, por defecto `es`), entrega un toggle ES/EN y aplica textos estáticos vía atributos `data-i18n`. Cada juego expone `LOCALES = { es, en }` en su `rules.js` con reglas, mini-juegos, listas y textos de interfaz; la lógica del juego solo lee `LOCALES[lang]`. Cambiar de idioma recarga la página.
**Por qué:** Cumple RP-15 sin librerías ni build. Los datos por idioma viven junto a cada juego, así que agregar un juego o un idioma no toca el resto. Recargar al cambiar es más simple y seguro que re-renderizar todo en caliente, y no afecta la partida guardada.
**Consecuencias:** Las claves de las listas (penitencias, categorías) no son equivalentes uno a uno entre idiomas: la versión inglesa adapta referencias chilenas a genéricas. Una partida guardada en un idioma se retoma en el idioma activo.

## D-17 · Sonidos sintetizados con Web Audio, sin archivos
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Los efectos (`assets/js/sound.js`) se generan con osciladores y ruido filtrado en Web Audio: click de botón, whoosh al voltear, pop al descubrir, clink de brindis, glug al tomar, fanfarria de rey (corta) y de cuarto rey (grande, con tambor), tic y bocina del temporizador, dado al pedir otra opción, whoosh al pasar el celular, fanfarria final y buzz de error. El audio se desbloquea con el primer toque y hay un botón 🔊/🔇 persistente (`juegos-de-salon:muted`).
**Por qué:** Cumple RP-14 sin descargar ni licenciar archivos de audio, mantiene el sitio liviano y sin dependencias (D-01), y evita el problema de iOS con audio no iniciado por gesto del usuario. Si más adelante se quieren sonidos "reales", basta reemplazar la implementación de `SFX` manteniendo la misma interfaz.
**Consecuencias:** El sonido se apaga con el toggle pero no con el modo silencio del celular en todos los navegadores (iOS Safari sí respeta el switch físico para Web Audio en la mayoría de versiones).
