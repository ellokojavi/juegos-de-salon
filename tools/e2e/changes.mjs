// Can a PR skip the end-to-end tests? Only if it touches nothing that reaches the browser
// (D-205, D-299): documentation, marketing, the agents, the workshop that no script or page
// imports (`tools/agents/`, `tools/firebase/`), the Firebase rules (the CI scripts don't open
// rooms in it, D-193), the workflows other than this one and the .md files outside the site.
// When in doubt, they run. Used by `ci.mjs --groups --changes <file>` in the GitHub workflow; the
// PRs that do reach the browser run only the scripts their changes reach (affected.mjs, D-329).

/** What no end-to-end test looks at. */
const NO_BROWSER = [
  r => r.startsWith('docs/'),
  r => r.startsWith('marketing/'),
  r => r.startsWith('.claude/'),
  r => r.endsWith('.md') && !r.startsWith('public/') && !r.startsWith('tools/e2e/'),
  // D-299: the workshop the site and the scripts don't depend on (it imports them, not the other way round)
  r => r.startsWith('tools/agents/'),
  r => r.startsWith('tools/firebase/'),
  r => r.startsWith('firebase/'),
  r => r.startsWith('.github/') && r !== '.github/workflows/e2e.yml',
  // How long each script took: it only sorts the scripts into groups, it checks nothing (D-428)
  r => r === 'tools/e2e/durations.json',
];

/** true if the list is not empty and nothing in it reaches the browser. */
export const noBrowser = files => {
  const list = files.map(a => a.trim()).filter(Boolean);
  return list.length > 0 && list.every(r => NO_BROWSER.some(f => f(r)));
};
