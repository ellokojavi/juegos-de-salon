# changelog/

Una entrada por PR, **sin número** (D-300): `changelog/<rama>.md`, que crea
`node tools/release/changelog.mjs nueva [parche|menor|mayor]`.

```
nivel: parche

- **Qué cambió**, para quien juega, en el tono de `CHANGELOG.md`.
```

El número se pone solo, en el orden en que los PR entran a `main`
(`node tools/release/changelog.mjs ver` muestra cuál le toca a cada una), y el agente de procesos
las junta en `CHANGELOG.md` en su ronda. No escribas `## X.Y.Z` en `CHANGELOG.md` desde un PR: el
check `pruebas` lo frena (`changelog.mjs migrar` lo pasa aquí).
