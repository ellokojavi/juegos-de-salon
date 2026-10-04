# Cómo aportar

Gracias por querer sumar algo a Juegos de Salón. La app es HTML, CSS y JavaScript con módulos
ES: sin build, sin npm y sin cuenta de nada para trabajar en ella.

## El camino: fork y PR

1. Haz un **fork** de `ellokojavi/juegos-de-salon` en GitHub y clónalo.
2. Crea una **rama con nombre de tema** (`dudo-modo-rapido`, no `v0-90`).
3. Trabaja, prueba (abajo) y abre un **PR hacia `main`**. Las pruebas corren solas en el PR y
   muestran ✅ o ❌ en dos checks, `pruebas` y `Punta a punta`; con uno en rojo no se fusiona.
4. El dueño lo revisa, lo fusiona y lo publica. `main` está protegida: nada entra sin PR, y lo
   que entra a `main` sale al tiro en https://juegosdesalon.cl/.

Una idea grande (un juego nuevo, un cambio de reglas) conviene conversarla antes en un issue,
para no hacer trabajo que después no calza.

## Levantarlo

```bash
python3 -m http.server 8765 -d public   # el sitio es public/; los módulos ES necesitan HTTP
```

y abrir http://localhost:8765/. Para mirarlo en el celular, cualquier forma de servir `public/`
en la red local sirve.

**Ojo:** los modos de varios celulares usan la base de Firebase **de producción** (la
configuración pública está en `public/assets/js/firebase-config.js`). Una sala abierta desde tu
computador es una sala de verdad: aparece en el panel del dueño. No rompe nada, pero ábrelas lo
justo.

## Antes de escribir código

- **[docs/CANONES.md](docs/CANONES.md)**: las reglas de hoy de todos los juegos (idiomas, sonido, modos,
  memoria de partida, interfaz táctil, anti-trampa, pruebas, documentación). Al final tiene una
  lista de chequeo.
- **[docs/USABILIDAD.md](docs/USABILIDAD.md)**: cómo se escriben los textos y dónde van los botones.
- **[docs/AGREGAR-JUEGO.md](docs/AGREGAR-JUEGO.md)**, si es un juego nuevo.
- **[docs/DECISIONES.md](docs/DECISIONES.md)**: por qué las cosas son como son. Antes de cambiar algo
  que parece raro, búscalo ahí.

Lo que más se olvida:

- **Todo texto va en español, inglés, portugués de Brasil y alemán**, con las mismas claves en
  todos (C-3). Español chileno, tuteo. Los demás adaptados, no calcados. El glosario del alemán
  está en [docs/ALEMAN.md](docs/ALEMAN.md).
- **Reusar antes de inventar**: el arrastre, el teclado, el chat, las pantallas de pasar el
  celular y lo que se comparte ya existen en `public/assets/` (D-102).
- **Botones de 44 px y sin scroll horizontal** a 320 px de ancho (C-8).

## Pruebas

GitHub corre en cada PR todos los `*.test.mjs` y `*.test.py` y revisa que el README esté al día.
Lo mismo, en tu computador:

```bash
for f in $(git ls-files '*.test.mjs'); do node "$f" || echo "FALLA $f"; done
for f in $(git ls-files '*.test.py'); do python3 "$f" || echo "FALLA $f"; done
python3 tools/release/readme.py revisar
node tools/release/og.mjs revisar
```

Las pruebas de punta a punta (`tools/e2e/`) juegan partidas completas en Chrome; ver su README.
Para mirar una pantalla suelta: `node tools/e2e/mirar.mjs <juego> <pantalla> --ancho 320`.

## Lo que hace el dueño al fusionar (no lo hagas en tu PR)

- **El número de versión**, que es su entrada en `CHANGELOG.md` (D-205): se asigna al
  fusionar, en el orden en que entran los PR. Describe tu cambio en el PR y basta.
- **El número de las decisiones** (D-n): si tu cambio necesita una, escríbela como `D-??` y se
  numera al fusionar.
- **Publicar las reglas de Firebase** (`firebase/database.rules.json`): necesitan una llave que
  solo tiene el dueño. Si tu PR las cambia, dilo en la descripción.
- **El panel del dueño** (`public/panel/`) no se puede abrir sin su cuenta; para mirarlo hay datos
  sembrados (`node tools/e2e/mirar.mjs panel datos`).

## Con Claude Code

Si trabajas con Claude Code, lee `CLAUDE.md` solo: ahí están las mismas reglas y las
herramientas. Algunas partes son del dueño (fusionar, publicar reglas, leer reportes y el panel
con su llave); en un fork, Claude se queda en abrir el PR.

## Licencia

Al aportar, aceptas que tu código se publique con la [licencia MIT](LICENSE) del proyecto.
