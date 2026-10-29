// Create and join an online room, shared by every game with rooms (#860).
// Each game keeps its own startOnline (what a session holds differs); this only opens the transport.

/**
 * `start(transport, code, role, name, config, ...extra)` is the game's startOnline.
 * `join` returns the role the room gave, for the games that restore something of theirs after.
 */
export function roomFlow({ game, maxPlayers, defaultConfig, start }) {
  const transport = async () => {
    const { createFirebaseTransport } = await import('./transport/firebase.js');
    return createFirebaseTransport(maxPlayers ? { game, maxPlayers } : { game });
  };
  return {
    async create(name, config) {
      const t = await transport();
      const code = await t.create({ config, name });
      await start(t, code, 'A', name, config);
    },
    async join(code, name, previousRole = null, ...extra) {
      const t = await transport();
      const { role, config } = await t.join(code, { name, previousRole });
      await start(t, code, role, name, config || defaultConfig, ...extra);
      return role;
    },
  };
}
