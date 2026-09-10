# Pruebas de punta a punta (Chrome headless por CDP)

Scripts que juegan partidas completas en Chrome headless, sin dependencias de npm: usan el
protocolo de depuración de Chrome por WebSocket (`cdp.mjs`). Cada script recibe una carpeta
de salida donde deja capturas PNG, e imprime en consola lo que verificó.

## Requisitos

- Google Chrome instalado en `/Applications/Google Chrome.app` (ruta en `cdp.mjs`).
- Node 20 o superior (usa `fetch` y `WebSocket` nativos).
- El sitio servido en `http://localhost:8765`:

```bash
python3 -m http.server 8765
```

## Uso

```bash
mkdir -p /tmp/e2e && node tools/e2e/batalla-naval-local.mjs /tmp/e2e
```

| Script | Qué prueba |
|---|---|
| `cuarto-rey.mjs` | Botón de sonido y mazo completo hasta el cuarto rey |
| `toque-y-fama-local.mjs` | Un celular y contra el celular, hasta el resultado |
| `toque-y-fama-online.mjs` | Dos celulares contra Firebase real: unión por URL, recarga a mitad, revancha |
| `batalla-naval-local.mjs` | Colocación, batalla en un celular y contra el celular |
| `batalla-naval-colocacion.mjs` | Seleccionar, girar, mover y deseleccionar barcos en la grilla |
| `batalla-naval-alineacion.mjs` | Que los números de fila queden alineados con las casillas en tres anchos |
| `batalla-naval-online.mjs` | Dos celulares contra Firebase real, con recarga y revancha |
| `linea-de-tiempo-local.mjs` | Un celular con tres jugadores y solitario |
| `linea-de-tiempo-solo.mjs` | Solitario: récord, plural, retomar |
| `linea-de-tiempo-error.mjs` | Pantalla de error que se queda hasta tocar; el rival espera |
| `linea-de-tiempo-online.mjs` | Tres celulares contra Firebase real, recarga y revancha |
| `toque-y-fama-chat.mjs` | Chat de sala en Toque y Fama: no leídos, etiqueta, y que muera con la partida |
| `linea-de-tiempo-pozo.mjs` | Pozo común: tira de 6, reposición por el final, meta y ajuste que viaja en la sala |
| `linea-de-tiempo-empate.mjs` | Que la ronda se termine y que el empate lo gane el más rápido |
| `linea-de-tiempo-chat.mjs` | Chat de sala: no leídos, freno al spam, veredicto que lo tapa, reconexión y muerte al terminar |
| `memoria-de-partida.mjs` | Guardar y retomar en los tres juegos (canon C-6) |
| `versionado.mjs` | Que todos los módulos carguen con `?v=` del import map |
| `compartir-sala.mjs` | Botón de compartir: diálogo nativo si existe, copiar si no |
| `enlace-invitacion.mjs` | Quien llega por un enlace solo puede unirse a esa sala, en los tres juegos |

## Cómo simulan varios celulares

Cada "celular" es una instancia de Chrome con su propio perfil (`dir`) y su propio puerto de
depuración. Para que no compartan `localStorage`, cada una usa un origen distinto del mismo
servidor: `localhost`, `127.0.0.1` y `[::1]`. Los scripts "online" hablan con el proyecto de
Firebase real, así que necesitan internet y dejan salas de prueba que caducan a las 6 horas.

## Cuidados

- **Chromes zombis:** si un script falla a medias, su Chrome puede quedar vivo escuchando en su
  puerto, y el siguiente script se conectaría a esa instancia vieja (con código viejo cargado).
  Antes de repetir: `pkill -f remote-debugging-port`. `cdp.mjs` ya cierra Chrome ante
  excepciones no capturadas, pero no ante un `kill` del proceso de node.
- Los puertos están fijos dentro de cada script (rango 93xx a 94xx); si dos scripts corren a la
  vez deben usar puertos distintos.
- En una pestaña oculta el navegador acelera los temporizadores de forma distinta; las esperas
  (`sleep`) están calibradas para headless.
