/**
 * Sesión de partida compartida por todos los juegos (canon C-6 en docs/CANONES.md).
 *
 * Guarda la partida en curso en localStorage bajo `juegos-de-salon:<juego>:session`
 * para poder retomarla si el jugador vuelve al menú, recarga o cierra el navegador.
 * Vale para TODOS los modos (un celular, contra el celular y dos celulares).
 *
 * Forma del registro:
 *   { v: 1, game, mode, config, names, messages, private, code, role, done, at }
 *   - messages: la lista de mensajes del juego (los juegos con reductor la reproducen tal cual)
 *   - private:  datos que no viajan por la red (número secreto, flota, notas)
 *   - state:    alternativa para juegos sin reductor (Cuarto Rey guarda su estado completo)
 */
const PREFIX = 'juegos-de-salon:';
const TTL = 12 * 60 * 60 * 1000; // 12 horas

export function createSessionStore(game, { ttl = TTL, legacyKeys = [] } = {}) {
  const key = `${PREFIX}${game}:session`;
  return {
    key,
    /** Guarda la partida. Devuelve true si se pudo escribir. */
    save(data) {
      try { localStorage.setItem(key, JSON.stringify({ v: 1, game, at: Date.now(), ...data })); return true; }
      catch (_) { return false; } // modo privado o cuota llena: el juego sigue igual
    },
    /** Devuelve la partida guardada, o null si no hay, venció o es de otro juego. */
    load() {
      try {
        let raw = localStorage.getItem(key);
        if (!raw) { // migración desde claves antiguas
          for (const k of legacyKeys) { const old = localStorage.getItem(k); if (old) { raw = old; localStorage.removeItem(k); break; } }
          if (!raw) return null;
        }
        const data = JSON.parse(raw);
        if (!data || (data.game && data.game !== game)) return null;
        if (data.at && Date.now() - data.at > ttl) { this.clear(); return null; }
        return data;
      } catch (_) { return null; }
    },
    clear() { try { localStorage.removeItem(key); } catch (_) { /* nada */ } },
  };
}

/**
 * Nombre del jugador recordado entre partidas (`juegos-de-salon:<juego>:name`, texto plano: el
 * panel lo lee como "quién juega en este celular", D-210).
 * Un juego de grupo en un celular recuerda además la mesa entera con `list()`/`setList()`, en
 * `juegos-de-salon:<juego>:names` (JSON). `legacyKeys` son claves viejas de esa lista: si la nueva
 * está vacía, la primera que tenga una lista se copia a la nueva y se borra (Cuarto Rey guardaba la
 * suya en `juegos-de-salon:players`).
 */
export function createNameStore(game, { legacyKeys = [] } = {}) {
  const key = `${PREFIX}${game}:name`;
  const listKey = `${PREFIX}${game}:names`;
  const parse = raw => { try { const v = JSON.parse(raw || 'null'); return Array.isArray(v) ? v : null; } catch (_) { return null; } };
  return {
    get() { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } },
    set(name) { try { localStorage.setItem(key, name); } catch (_) { /* nada */ } },
    /** La última mesa, o null si no hay. */
    list() {
      try {
        const actual = parse(localStorage.getItem(listKey));
        if (actual) return actual;
        for (const k of legacyKeys) {
          const vieja = parse(localStorage.getItem(k));
          if (!vieja) continue;
          // La vieja se borra solo si la nueva quedó escrita (setItem lanza si no); igual se usa
          try { localStorage.setItem(listKey, JSON.stringify(vieja)); localStorage.removeItem(k); } catch (_) { /* nada */ }
          return vieja;
        }
        return null;
      } catch (_) { return null; }
    },
    setList(list) { try { localStorage.setItem(listKey, JSON.stringify(list)); } catch (_) { /* nada */ } },
  };
}
