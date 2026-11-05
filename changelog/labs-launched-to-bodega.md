level: patch

- **Labs: a feature published for everyone goes to La Bodega on its own** (D-534). When `/labs/` opens it reads the flags and moves every card under ✨ Mejoras en prueba whose flag is *all* into ✨ Mejoras lanzadas, folded and dated by the day it went live, with its switch. No PR: the cleanup PR that removes the gate moves its HTML for good. Until now a launched card waited there until someone moved it by hand.
