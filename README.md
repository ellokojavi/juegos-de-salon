# 🍻 Juegos de Salón

App web (mobile-first) con juegos de salón para el carrete. Se abre desde el celular o tablet, se elige un juego en el menú principal, se ingresan los jugadores y el celular guía la partida.

**Probar:** https://ellokojavi.github.io/juegos-de-salon/

## Juegos disponibles

| Juego | Estado | Jugadores |
|---|---|---|
| 👑 [Cuarto Rey](cuarto-rey/) | v0.1 (demo) | 4 a 6 |

## Stack

HTML, CSS y JavaScript puro (módulos ES), sin build ni dependencias. Se publica como sitio estático en GitHub Pages desde la rama `main`.

## Correr en local

```bash
python3 -m http.server 8080
```

y abrir http://localhost:8080 (los módulos ES necesitan servirse por HTTP, no funcionan con `file://`).

## Estructura

```
index.html              Menú principal (se genera desde assets/js/games.js)
assets/css/base.css     Estilos y animaciones compartidos (tema fiesta)
assets/js/games.js      Registro de juegos
assets/js/ui.js         Utilidades UI: confeti, vibración, wake lock, helpers DOM
cuarto-rey/             Juego Cuarto Rey (index.html, game.js, rules.js, style.css)
docs/                   Requerimientos, decisiones y especificaciones
```

## Documentación

- [Requerimientos](docs/REQUERIMIENTOS.md)
- [Decisiones de diseño y arquitectura](docs/DECISIONES.md)
- [Cómo agregar un juego nuevo](docs/AGREGAR-JUEGO.md)
- [Especificación: Cuarto Rey](docs/juegos/cuarto-rey.md)
- [Changelog](CHANGELOG.md)
