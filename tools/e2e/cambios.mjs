// ¿Un PR puede saltarse las pruebas de punta a punta? Solo si no toca nada que llegue al navegador
// (D-205): documentación, marketing, los agentes y los .md fuera del sitio. Ante la duda, se corren.
// Lo usa `ci.mjs --lista --cambios <archivo>` en el workflow de GitHub.

/** Lo que ninguna prueba de punta a punta mira. */
const SIN_NAVEGADOR = [
  r => r.startsWith('docs/'),
  r => r.startsWith('marketing/'),
  r => r.startsWith('.claude/'),
  r => r.endsWith('.md') && !r.startsWith('public/') && !r.startsWith('tools/e2e/'),
];

/** true si la lista no está vacía y nada de ella llega al navegador. */
export const soloDocumentos = archivos => {
  const lista = archivos.map(a => a.trim()).filter(Boolean);
  return lista.length > 0 && lista.every(r => SIN_NAVEGADOR.some(f => f(r)));
};
