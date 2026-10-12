nivel: parche

- **Herramientas: CI y publicación más rápidos.** Las pruebas de punta a punta corren en grupos
  parejos según lo que tarda cada guion, todos a la vez, con el segundo intento y las capturas por
  guion dentro del grupo; los guiones esperan a que la pantalla esté lista en vez de pausas fijas
  (D-307). Y publicar no repite la punta a punta si el árbol que llega a main ya la pasó en su PR
  (D-308).
