/**
 * Despedida limpia de una sala (canon C-7, D-50).
 *
 * Una sala vive seis horas y nadie la borra antes: la papelera (`cleanup.js`) recién puede
 * tocarla cuando venció. Eso está bien para las salas que se terminaron solas, pero deja
 * vivas —y en el panel del dueño, como si alguien estuviera jugando— las que la persona
 * canceló a propósito: creó la sala, nadie llegó, y se fue.
 *
 * Acá está la otra punta: cuando alguien se va **a propósito** (cancelar la sala, salirse,
 * cambiar de modo) deja dicho que se fue, y si con eso no queda nadie adentro, la sala se
 * borra en el acto:
 *
 *   rooms/<CÓDIGO>/players/<ROL>: { name, online: false, left: true }
 *
 * `left` es una despedida, no una desconexión: quedarse sin señal o cerrar la pestaña solo
 * apaga `online`, porque esa partida se puede retomar y la sala tiene que seguir esperando
 * (C-6). Por eso nada de esto cuelga de `pagehide`: solo de un gesto del jugador.
 *
 * El nombre no se borra: la sala sigue mostrando quién estuvo, y el rol queda tomado por si
 * el mismo celular vuelve. Las reglas dejan borrar una sala viva únicamente cuando todos los
 * que están adentro se despidieron, así que esto no puede voltear una partida ajena.
 *
 * Todo el acceso a la base entra por `api` para poder probar esto con node sin Firebase:
 *   { read(ruta), update(ruta, cambios), remove(ruta) }
 */

/** Lo que se escribe al despedirse: el rol queda fuera, pero su nombre sigue ahí. */
export function farewell() {
  return { online: false, left: true };
}

/** ¿No queda nadie? Hay jugadores apuntados y todos se despidieron. */
export function deserted(players) {
  const roles = Object.keys(players || {});
  return roles.length > 0 && roles.every(r => players[r]?.left === true);
}

/**
 * Se despide de la sala y, si con eso no queda nadie, la borra. Devuelve { left, removed }.
 *
 * Son dos pasos y no uno porque las reglas miran la sala como está *antes* de borrarla: la
 * despedida tiene que haber llegado para que el borrado sea legal. Nada de esto lanza: irse
 * de una sala no puede fallarle en la cara a quien ya se está yendo. Si algo no sale, la
 * sala queda marcada y la papelera la borra cuando venza.
 */
export async function disposeRoom(api, code, role) {
  const out = { left: false, removed: false };
  if (!code || !role) return out;
  try { await api.update(`rooms/${code}/players/${role}`, farewell()); out.left = true; }
  catch (_) { return out; }
  let players = null;
  try { players = await api.read(`rooms/${code}/players`); }
  catch (_) { return out; }
  if (!deserted(players)) return out;   // queda alguien: la sala sigue siendo suya
  // Puede fallar sin que sea un problema: si justo entró alguien, las reglas lo impiden.
  try { await api.remove(`rooms/${code}`); out.removed = true; } catch (_) { /* que la barra la papelera */ }
  return out;
}
