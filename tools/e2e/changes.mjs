// ¿Un PR puede saltarse las pruebas de punta a punta? Solo si no toca nada que llegue al navegador
// (D-205, D-299): documentación, marketing, los agentes, el taller que ningún guion ni página
// importa (`tools/agents/`, `tools/firebase/`), las reglas de Firebase (los guiones de CI no abren
// salas en él, D-193), los workflows que no son el de estas pruebas y los .md fuera del sitio.
// Ante la duda, se corren. Lo usa `ci.mjs --lista --cambios <archivo>` en el workflow de GitHub.

/** Lo que ninguna prueba de punta a punta mira. */
const SIN_NAVEGADOR = [
  r => r.startsWith('docs/'),
  r => r.startsWith('marketing/'),
  r => r.startsWith('.claude/'),
  r => r.endsWith('.md') && !r.startsWith('public/') && !r.startsWith('tools/e2e/'),
  // D-299: el taller del que el sitio y los guiones no dependen (lo importan a ellos, no al revés)
  r => r.startsWith('tools/agents/'),
  r => r.startsWith('tools/firebase/'),
  r => r.startsWith('firebase/'),
  r => r.startsWith('.github/') && r !== '.github/workflows/e2e.yml',
];

/** true si la lista no está vacía y nada de ella llega al navegador. */
export const sinNavegador = archivos => {
  const lista = archivos.map(a => a.trim()).filter(Boolean);
  return lista.length > 0 && lista.every(r => SIN_NAVEGADOR.some(f => f(r)));
};
