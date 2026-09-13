# Diseño: Dudo 🎲

**Ruta:** `/dudo/` · **Jugadores:** 2 a 6 · **Versión:** 0.28 · **Idiomas:** es, en, pt (“Dado Mentiroso”)

## 1. Resumen

Cada jugador tira cinco dados y solo ve los suyos. Por turnos se apuesta **cuántos dados de una
pinta hay en toda la mesa** —"cuatro cincos"— y el siguiente sube la apuesta o dice **dudo**. Al
dudar se destapan todos los dados y se cuenta: si había tantos como se apostó o más, pierde un dado
quien dudó; si había menos, pierde un dado quien apostó. Quien se queda sin dados sale. Gana el
último que le quede alguno.

El celular hace lo que en la mesa real se hace mal: reparte los dados, **no deja hacer una apuesta
ilegal**, cuenta al instante —que es justo lo que se discute a gritos— y lleva quién va perdiendo.

## 2. Reglas

- **Cinco dados** por jugador al empezar. De 2 a 6 jugadores.
- **Los ases (⚀) son comodín**: cuentan como la pinta que se haya apostado.
- Una apuesta es **cantidad + pinta**: "cuatro cincos" son cuatro dados con cara 5, contando los
  ases como cincos.
- **Subir** es decir más cantidad con cualquier pinta, o la misma cantidad con una pinta mayor.
- **Apostar ases** cuesta la mitad: desde "seis cincos" se puede pasar a "tres ases" (la mitad
  redondeada hacia arriba). **Salir de los ases** cuesta el doble más uno: desde "tres ases" hay que
  ir a "siete" de lo que sea.
- **Dudo** lo dice el que tiene el turno, sobre la apuesta que acaba de escuchar. Se destapa todo y
  se cuenta la pinta apostada más los ases.
- **Calzar** es decir que la cantidad apostada es **exacta**. Si acierta, recupera un dado (nunca
  más de cinco); si falla, pierde uno. Solo se puede calzar cuando la apuesta ya llegó a la mitad de
  los dados que quedan en la mesa: antes es una apuesta gratis.
- **Quien pierde un dado abre la ronda siguiente**; quien calza bien, también.
- Sin dados, fuera de la partida. Gana el último con dados.

### Lo que no está y por qué

**La ronda obligada** (cuando alguien queda con un dado, esa ronda se juega sin comodín y sin
cambiar de pinta) es clásica en Chile y no está en esta versión. Es una regla que aparece tarde en
la partida y hay que explicarla en tres idiomas justo cuando el juego ya se entendió; entra después,
cuando la mesa pida el juego largo. El motor la tiene prevista: la resolución recibe `acesWild` y la
apuesta legal recibe `obligada`, así que sumarla no es rehacer nada.

## 3. Modos

| Modo | Jugadores | Cómo |
|---|---|---|
| 📱 Un celular | 2 a 6 | Se pasa el celular. Cada uno mira sus dados con la pantalla tapada y apuesta; al terminar el turno, pase al siguiente (C-9). |
| 📶 Varios celulares | 2 a 6 | **Todavía no** (DU-09): en la intro va deshabilitado con "Próximamente", como manda C-5. El motor ya habla el protocolo —hash al abrir la ronda, destape al dudar (C-10)—; falta la sala. |
| 🤖 Contra el celular | 1 | Duelo contra el aparato, que juega con probabilidad y **solo con sus propios dados**. |

## 4. De dónde salen los dados, y por qué no de la semilla

En los otros juegos con sala, todo lo que hay que repartir sale de la semilla (C-7): las cartas de
Línea de Tiempo, la palabra del mazo del Ahorcado. Acá **no se puede**, y es la decisión que define
el juego: el código es público, así que si los dados salieran de una semilla que todos los celulares
conocen, cualquiera podría calcular los dados del rival abriendo la consola. Es exactamente el
problema que ya resolvió Batalla Naval con la flota: **cada celular tira sus propios dados** y los
guarda; lo que se publica es `sha256(dados + sal)`.

Al dudar, cada uno manda sus dados y su sal, y todos verifican los hashes que se habían anunciado al
empezar la ronda. Si uno no calza, la pantalla lo dice: **"⚠️ no coincide"**. En un celular y contra
el celular no hay a quién esconderle nada: los dados van en claro en la lista de mensajes, tapados
por la pantalla del pase.

## 5. Estado y protocolo

La partida se deriva de la lista de mensajes (C-7). Cada ronda es una secuencia:

```
roll* → bid+ → (dudo | calza) → open*
```

| Mensaje | Campos | Cuándo |
|---|---|---|
| `roll` | `d` (dados en claro, "3,3,5,1,6") o `h` (hash) | Al abrir la ronda, uno por jugador vivo |
| `bid` | `n` cantidad, `p` pinta (1 a 6) | En su turno |
| `dudo` | — | En su turno, si ya hay apuesta |
| `calza` | — | En su turno, si la apuesta llegó a la mitad de la mesa |
| `open` | `d` dados, `salt` sal | Después de dudar, uno por jugador vivo |

Un `roll` con `d` se resuelve solo; uno con `h` obliga a esperar el `open`. Es el mismo camino para
los tres modos: el motor cuenta cuando conoce todos los dados de la ronda, y mientras tanto la fase
es `open` y la pantalla dice a quién se espera.

```json
{
  "mode": "local",
  "config": { "dice": 5, "calzar": true, "players": ["A", "B"] },
  "names": { "A": "Javi", "B": "Cata" },
  "messages": [{ "t": "roll", "from": "A", "d": "3,3,5,1,6" }, { "t": "bid", "from": "A", "n": 4, "p": 5 }],
  "done": false
}
```

En los modos que hay hoy los dados van en claro dentro de los mensajes, así que retomar es
reproducir la lista y nada más: no hace falta `private`. Cuando exista la sala, el mensaje que abre
la ronda llevará el hash y cada celular guardará **sus** dados y su sal en `private` hasta el
destape: revelarlos antes sería revelar la mano.

## 6. Interfaz

1. **Intro:** de qué se trata, los tres modos y, si hay partida a medias, continuar.
2. **Setup:** nombres (2 a 6) y el ajuste de calzar.
3. **Mesa:** arriba la tira de rivales con cuántos dados le quedan a cada uno (nunca cuáles);
   al centro, tus dados; abajo, la apuesta que está en pie y la botonera.
4. **Apostar:** se elige la pinta (seis botones grandes con la cara del dado) y después la cantidad,
   que arranca en la mínima legal. Nada viene preseleccionado y el botón dice qué va a hacer:
   **"Apuesto 4 cincos"** (C-8).
5. **Al dudar:** se destapan todos los dados en una sola pantalla, con los que cuentan marcados y el
   total grande, y dice quién perdió el dado. De ahí se pasa a la ronda siguiente.
6. **Final:** quién ganó, cuántas rondas duró y, plegado, el repaso de las rondas.

## 7. Memoria de partida (C-6)

Se guarda en todos los modos con `createSessionStore('dudo')`: la configuración, los nombres y la
lista de mensajes. Retomar es volver a reproducirla. En un celular se vuelve a la pantalla de pase,
porque al retomar nadie sabe quién tenía el aparato en la mano.

## 8. Archivos

```
dudo/index.html · dudo/style.css · dudo/rules.js · dudo/game.js
dudo/engine.js · dudo/engine.test.mjs
```
