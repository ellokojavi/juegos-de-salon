/**
 * Transporte local compartido por los juegos: ambos jugadores (o un jugador y el bot) en el mismo dispositivo.
 * Es un bus de mensajes en memoria con la misma interfaz que el transporte de Firebase.
 */
export function createLocalTransport({ seed = [] } = {}) {
  // `seed`: mensajes de una partida guardada. Se reproducen al registrar onMessage,
  // de modo que el estado se reconstruye igual que la primera vez (canon C-6).
  const messages = seed.slice();
  const listeners = [];
  return {
    kind: 'local',
    code: null,
    roles: ['A', 'B'],            // roles que controla este dispositivo
    async create() { return null; },
    async join() { },
    messages,
    send(msg) {
      const m = { ...msg, at: Date.now(), id: `m${messages.length}` };
      messages.push(m);
      queueMicrotask(() => listeners.forEach(cb => cb(m)));
    },
    onMessage(cb) { listeners.push(cb); messages.forEach(m => cb(m)); },
    onPresence() { },
    leave() { listeners.length = 0; },
  };
}
