# Guía de usabilidad

La guía que aplica el agente de usabilidad (D-132) en cada revisión. Reúne lo que el dueño ya
decidió. **Crece con cada dilema resuelto**: la respuesta del dueño se anota aquí con su número de
issue, para no volver a preguntarla.

Cada regla tiene un ID (U-n) para citarla en los PR y en los issues.

## Textos

- **U-1 · Frases completas y explícitas.** Sin comas que fragmentan ni abreviaciones de la jerga de
  la app. Los modos y pantallas se nombran completos. Más largo pero inequívoco vale más que breve.
- **U-2 · Emojis al inicio de línea o en botones y títulos**, no en medio de una frase.
- **U-3 · Los textos nuevos se acuerdan con el dueño** antes de publicarse. Corregir ortografía,
  gramática o concordancia no es un texto nuevo.
- **U-4 · Nombres propios sin artículo:** "La Copa: Valdenenas", nunca "la Valdenenas".
- **U-5 · Un mismo concepto, una misma palabra** en toda la app (día de gracia, inscripción,
  competidores, link, PIN).
- **U-6 · El plural y el singular concuerdan con el número** ("1 jugador inscrito", "2 pistas").
- **U-7 · Los juegos por significado, no por juegos de palabras** (D-128): en Conexiones, lo que
  las cosas son; nada de "___ roja" o "esconden un animal".

## Pantallas y botones

- **U-10 · Botones de 44 px o más** y sin scroll horizontal (C-8). Lo verifica `revisarPantalla`.
- **U-11 · Botones con aire:** separados de lo que tienen arriba y centrados en su caja cuando van
  solos. El botón que cierra un tablero va debajo de lo que resume, no encima (La Gran Final).
- **U-12 · Nada se encima:** nombres largos parten línea; etiquetas de empatados se apilan.
- **U-13 · Lo que se muestra es lo que se juega:** el laboratorio tiene la misma UX que producción.
- **U-14 · Cada cosa en su momento de la copa** (D-116): la invitación antes de partir, la tabla
  parcial mientras se juega, el resumen al terminar, "sacar" nunca con la copa terminada.
- **U-15 · Las acciones que no se deshacen piden confirmación** (rendirse, eliminar la copa,
  cerrar la inscripción, mover el inicio). Eliminar pide escribir el nombre.

- **U-16 · Las reglas están a mano sin estorbar:** plegadas debajo del tablero en cada minijuego
  (D-133), con las mismas palabras de los botones.

## Interacciones

- **U-20 · El reloj corre solo mientras se juega:** parte con la cuenta regresiva, se pausa con la
  pantalla oculta y se detiene al terminar el tablero (D-105, D-130).
- **U-21 · Nada cambia a mitad de un día:** contenido, grilla o reglas nuevas entran para los días
  que todavía no empiezan (D-128).
- **U-22 · Un reintento nunca traba:** si algo llegó aunque el celular mostró error, el segundo
  intento sigue normal (D-123).
- **U-23 · Lo que se escribe no se pierde** con una actualización de la pantalla (campos enfocados,
  reportes guardados).

## Compartir

- **U-30 · Formato de los mensajes:** título en negrita con "La Copa: {nombre}", una idea por
  línea con su emoji al inicio, y el link solo en la última línea ("🔗 …").
- **U-31 · Completo:** el resultado dice copa, día, juego, jugador y puntaje; la tabla dice quién
  falta y marca "(-1J)" a quien lleva menos juegos.
- **U-32 · Sin spoilers:** lo que se comparte no revela respuestas ni los minijuegos que vienen.

## Resuelto con el dueño

Las respuestas a dilemas (issues con la etiqueta `usabilidad`) se anotan aquí:

- *(todavía ninguno)*
