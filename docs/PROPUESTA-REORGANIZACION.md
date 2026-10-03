# Propuesta: reorganizar carpetas sin romper nada

> Estado: **propuesta**, para que el dueño decida. Si se aprueba, se registra como decisión
> (D-n, el número siguiente al más alto en `main` y en los PR abiertos) y se ejecuta por fases.

## 1. Diagnóstico

Hoy la raíz del repo tiene 18 carpetas y 8 archivos visibles. Mirado de cerca, el problema **no** es la
estructura de cada juego: esa ya está canonizada (C-2) y se cumple (`index.html`, `style.css`,
`rules.js`, `engine.js`, `engine.test.mjs`, `game.js`, y `decks/` cuando hay mazos). El
problema es que en la raíz conviven tres cosas distintas, sin nada que las separe:

| Qué es | Carpetas / archivos hoy en la raíz | ¿Se publica? |
|---|---|---|
| **El sitio** (lo que ve el jugador) | `index.html`, `en/`, `pt/`, `ahorcado/`, `batalla-naval/`, `copa/`, `cuarto-rey/`, `dudo/`, `julepe/`, `linea-de-tiempo/`, `toque-y-fama/`, `minijuegos/`, `panel/`, `labs/`, `assets/`, `manifest.webmanifest`, `CNAME`, `.nojekyll` | Sí, y debe |
| **El taller** (cómo se hace) | `tools/`, `docs/`, `firebase/`, `marketing/` | Sí, **y no debería** |
| **El repo** (metadatos) | `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `LICENSE`, `.github/`, `.claude/` | Sí, **y no debería** |

GitHub Pages publica la rama entera, así que hoy son públicas, por ejemplo,
`juegosdesalon.cl/docs/DECISIONES.md`, `juegosdesalon.cl/tools/set-version.py`,
`juegosdesalon.cl/firebase/database.rules.json`, los 49 MB de `marketing/` y cada
`*.test.mjs`. No hay secretos (las llaves están fuera del repo, D-122), pero es ruido
publicado y peso de despliegue.

Otros desórdenes menores:

- `copa/juegos/` tiene 36 archivos planos que mezclan lógica (`zip.js`), interfaz (`ui-zip.js`),
  datos (`grillas-en.js`, `ciudades.js`, `nombres.js`) y generados (`mapa.js`).
- `tools/` mezcla, al mismo nivel, publicación (`set-version.py`, `og.mjs`, `readme.py`),
  Firebase (`reglas.mjs`, `en-curso.mjs`, `reportes.mjs`), generadores (`mapa.mjs`, `flota.py`)
  y agentes (`dilemas.mjs`, `documentar.mjs`); y `tools/e2e/` tiene 39 guiones planos.
- `tools/set-version.py` lleva a mano la lista `MODULES` (104 rutas) y `PAGES`: cada juego o
  módulo nuevo obliga a tocarla (paso 6 de `AGREGAR-JUEGO.md`), y olvidarlo no avisa.

## 2. La restricción que manda: carpeta = URL

Sitio estático, sin build: **la ruta de un archivo en el repo es su URL pública**. Y esas URL
viven fuera de nuestro control:

- los links de sala que se mandan por WhatsApp (`/batalla-naval/?sala=…`), que **son** la
  invitación a jugar;
- las tarjetas Open Graph y los `canonical` (`/minijuegos/zip/`), ya cacheadas por WhatsApp y
  Google;
- `localStorage` es por origen, no por ruta, así que eso no se rompe; pero los marcadores y el
  "agregar a pantalla de inicio" sí apuntan a rutas.

Por eso **descarto** la idea más intuitiva, `juegos/<id>/`: cambia todas las URL. GitHub Pages
no tiene redirecciones de servidor; habría que dejar una página "puente" en cada ruta vieja
(con lo que la raíz queda igual de llena), perder un salto en cada link de sala y rehacer las
tarjetas. Mucho riesgo para un beneficio cosmético.

**Conclusión:** los juegos se quedan en primer nivel *de la web*. Lo que hay que sacar del
primer nivel *del repo* es todo lo demás.

## 3. Propuesta: separar la raíz web de la raíz del repo

Mover el sitio, tal cual, a `sitio/` y publicar **solo esa carpeta** con un workflow de
GitHub Pages ("Deploy from GitHub Actions"). Dentro de `sitio/` todo queda con las mismas rutas
relativas, así que **las URL públicas no cambian ni un carácter** y los imports relativos
(`../assets/js/ui.js`) siguen funcionando sin tocarlos.

```
/                              ← raíz del repo: solo metadatos y carpetas de trabajo
├── README.md  CHANGELOG.md  CLAUDE.md  CONTRIBUTING.md  LICENSE
├── .github/workflows/
│   ├── pruebas.yml            (igual que hoy, rutas actualizadas)
│   └── publicar.yml           NUEVO: sube sitio/ a Pages en cada push a main
├── .claude/                   agentes y skills
├── sitio/                     ← RAÍZ WEB: lo único que se publica
│   ├── index.html  manifest.webmanifest  CNAME  .nojekyll
│   ├── en/  pt/
│   ├── ahorcado/  batalla-naval/  copa/  cuarto-rey/  dudo/
│   ├── julepe/  linea-de-tiempo/  toque-y-fama/
│   ├── minijuegos/<id>/       (páginas puente de cada minijuego, como hoy)
│   ├── panel/  labs/
│   └── assets/{css,js,img,og}/
├── docs/                      canones, decisiones, juegos/<id>.md, screenshots/ (igual que hoy)
├── tools/                     herramientas del taller
├── firebase/                  reglas de la base de datos
└── marketing/                 video y assets de marketing
```

La raíz pasa de 18 carpetas + 8 archivos visibles a **5 carpetas + 5 archivos**, cada una con un
propósito que se entiende por el nombre, y el patrón es el estándar de la industria
(`public/`, `site/`, `www/`): la raíz web separada del repo.

### Lo que gana

- La raíz se lee de un vistazo: "el sitio está en `sitio/`, el resto es taller".
- Se deja de publicar `docs/`, `tools/`, `firebase/`, `marketing/`, `CLAUDE.md`, etc.
- El workflow puede excluir del despliegue `*.test.mjs` y cualquier otro archivo de trabajo.
- Publicar pasa a depender de que `pruebas.yml` esté verde (el workflow de publicación puede
  exigirlo), en vez de publicar cualquier cosa que llegue a `main`.

### Lo que hay que ajustar (inventario)

| Pieza | Cambio |
|---|---|
| Configuración de Pages (la hace el dueño) | Source: "GitHub Actions" en vez de "Deploy from a branch". El dominio `juegosdesalon.cl` se mantiene; el `CNAME` viaja dentro de `sitio/`. |
| `.github/workflows/publicar.yml` | Nuevo: `actions/upload-pages-artifact` con `path: sitio` + `actions/deploy-pages`. |
| `tools/*` | Cada herramienta calcula `RAIZ`; se agrega `SITIO_DIR = RAIZ/'sitio'` y las rutas al sitio (`assets/js/games.js`, `assets/og/`, `<juego>/…`) pasan por ahí. Es una constante por archivo, no lógica nueva. ~30 archivos con referencias. |
| Servidor local | `python3 -m http.server 8765 -d sitio` (o `--directory`). Cambia en `.claude/launch.json`, `tools/og.mjs`, `tools/readme.py`, `tools/e2e/README.md`, `CLAUDE.md` y los agentes. Las URL de prueba (`localhost:8765/ahorcado/`) **no** cambian. |
| Tests `*.test.mjs` | Viajan con su módulo dentro de `sitio/`; sus imports relativos siguen iguales. `pruebas.yml` los encuentra con `git ls-files`, que ya es recursivo. |
| Docs y agentes | `CLAUDE.md`, `CANONES.md` (C-2, C-11), `AGREGAR-JUEGO.md`, `CONTRIBUTING.md`, `.claude/agents/*.md`: rutas `ahorcado/engine.test.mjs` → `sitio/ahorcado/engine.test.mjs`, etc. |
| `docs/capturas.json`, `docs/hechos.json` | Las rutas a guiones de `tools/e2e/` no cambian; las que apunten a módulos del sitio, sí. |
| `marketing/video-promo/promo.html`, `tools/og/tarjeta.html` | Importan módulos reales con rutas relativas (`../../assets/…`): pasan a `../../sitio/assets/…`. Se sirven desde la raíz del repo, no desde `sitio/`, igual que hoy. |
| Routines en la nube (documentación 3:54, usabilidad 5:00) | Revisar sus prompts: si nombran rutas del sitio, se actualizan. Las de `tools/…` no cambian. |

## 4. Mejoras internas (opcionales, independientes de la fase 1)

**4a. `MODULES` automático.** `set-version.py` arma la lista recorriendo `sitio/**/*.js` (sin
tests) y las páginas recorriendo `sitio/**/index.html`, con su prefijo calculado por
profundidad. Desaparece el paso 6 de `AGREGAR-JUEGO.md` y un olvido deja de ser posible. El
resultado se compara contra el import map actual antes de dar el cambio por bueno: deben ser
idénticos salvo el orden.

**4b. `copa/juegos/` por minijuego.** Una carpeta por minijuego, a imagen de C-2:

```
copa/juegos/
  index.js  semilla.js  audiencia.js  solo.js  mazos.js     ← lo común a todos
  zip/        logica.js  ui.js
  tango/      logica.js  ui.js
  reinas/     logica.js  ui.js
  donde/      logica.js  ui.js  ciudades.js  nombres.js  mapa.js  globo.js
  letras/     logica.js  ui.js  palabras.js
  conexiones/ logica.js  ui.js  grillas.js  grillas-en.js  grillas-pt.js
  …
```

Estas rutas son de módulos JS, no de páginas: no las ve el jugador ni salen en ningún link, así
que moverlas no rompe URL. Sí invalida la caché del navegador para esos archivos, lo que el
`?v=` del import map ya resuelve.

**4c. `tools/` por función** y `tools/e2e/<juego>/`. Es la de menor beneficio y mayor costo:
los comandos `node tools/og.mjs …` están en `CLAUDE.md`, en los agentes, en los prompts de las
Routines y en la memoria de las sesiones. **Recomiendo no hacerla**, o hacerla solo para los
guiones de `e2e/`, que se invocan con menos frecuencia.

## 5. Cómo hacerlo sin romper nada

1. **Esperar una ventana sin PR abiertos.** Mover 400 archivos choca con cualquier rama viva
   (hoy: #127 y #134). Fusionar o rebasar esas primero, y avisar a las sesiones activas
   (`ListAgents`) que no abran ramas nuevas mientras dura.
2. **Un PR por fase**, en este orden: fase 1 (`sitio/` + workflow), luego 4a, luego 4b. Cada
   uno solo con `git mv` + ajuste de rutas, sin cambios de comportamiento, para que `git log
   --follow` y `git blame` sigan funcionando.
3. **Verificación antes de fusionar la fase 1**, en la rama:
   - todos los `*.test.mjs` y `*.test.py`, `readme.py revisar` y `og.mjs revisar` en verde;
   - el import map que genera `set-version.py` es idéntico al de `main` (mismo `diff`);
   - los e2e principales (`copa.mjs`, un online de dos celulares, `idioma-por-url.mjs`,
     `enlace-invitacion.mjs`) y `mirar.mjs` sirviendo `sitio/`;
   - un recorrido con `curl` de cada URL pública conocida (las de `games.js`, `en/`, `pt/`,
     `minijuegos/<id>/`, `panel/`, `labs/`, `assets/og/*.jpg`, `manifest.webmanifest`) contra
     el servidor local de la rama: todas 200;
   - el mismo recorrido, contra `localhost`, de 3 o 4 rutas de taller (`docs/…`, `tools/…`):
     ahora deben dar 404.
4. **Cambio de despliegue** (el único paso con sitio en juego): con `node tools/en-curso.mjs`
   sin salas vivas, el dueño cambia la fuente de Pages a "GitHub Actions", se fusiona y se
   vuelve a correr el recorrido de URL contra `https://juegosdesalon.cl/`. Si algo falla, se
   vuelve a "Deploy from a branch" en un clic: la rama `main` anterior sigue intacta.
5. **Documentar**: decisión nueva en `DECISIONES.md`, C-2 y C-11 actualizados,
   `AGREGAR-JUEGO.md`, `CLAUDE.md`, CHANGELOG y versión al fusionar.

## 6. Qué decide el dueño

1. ¿Fase 1 (`sitio/` + publicar con Actions)? **Recomendada.** Es la que resuelve el desorden
   de la raíz.
2. ¿El nombre de la carpeta? `sitio/` (en español, como el resto del taller) o `public/`
   (el nombre más estándar).
3. ¿Fase 4a (`MODULES` automático)? **Recomendada**: chica, y quita una fuente de errores.
4. ¿Fase 4b (`copa/juegos/` por minijuego)? Útil si van a seguir sumándose minijuegos.
5. ¿Fase 4c (`tools/` por función)? **No recomendada.**
