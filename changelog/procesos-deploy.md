nivel: parche

- **Herramientas: publicar sin choques ni sorpresas.** La entrada del CHANGELOG de cada PR va sin
  número en `changelog/<rama>.md` y la versión se pone sola al fusionar (D-300); los números de
  decisión se reservan con `tools/agents/decision.mjs reservar` y `DECISIONES.md` se junta sola al
  traer main (D-301); el sitio se publica solo si la punta a punta de main pasa (D-302); un solo
  push al terminar (D-303); y la revisión de usabilidad según la etapa del juego: corta en el
  laboratorio y completa en el PR que lo saca (D-304).
- **Pruebas de punta a punta:** no corren en un PR que solo toca el taller de los agentes, las
  reglas de Firebase o los otros workflows, y un guion que falla se repite una vez: si pasa, el
  check queda en verde con un aviso "Intermitente" que lo nombra (D-299).
