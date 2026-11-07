# Rules for making rules (D-541)

How a rule enters this repository, whatever doc it lives in (canons C-n, usability U-n, decisions D-n,
design system). Plan and progress: issue #1249.

## The three forms

Every rule declares one form:

| Form | Meaning | Must name |
|---|---|---|
| 🤖 **check** | A blocking test fails when the rule is broken. | The test file. |
| 📈 **ratchet** | A test stops the debt from growing; a debt list that only shrinks holds what is left. | The test and the debt list. |
| 👁 **judged** | It cannot be measured; a reviewer judges it. | The reviewer (an agent or the owner) and why it cannot be measured. |

## The ten rules

1. **No rule without its enforcement.** A rule is 🤖, 📈 or 👁 as above; one without a form is incomplete.
2. **One registry, generated index.** Every rule is listed in `docs/rules.json`; the readable index is generated from it, never hand-edited.
3. **Old debt is ratcheted, never fixed in a big bang.** Freeze what exists, block the new, shrink it when a PR touches the file anyway.
4. **Every exception has a reason.** An allowlist entry says why; an entry that no longer matches anything fails the test.
5. **The same fix twice gets a check.** The PR that fixes a problem the second time adds the test that stops a third.
6. **Three times is a module.** A rule repeated in three or more games becomes a shared module in `public/assets/js/`.
7. **Every PR checks its rules.** `rules.mjs check` at the end of a PR says which rules the diff touches and flags any 👁 without a reviewer.
8. **Data before code.** A fact about a game written in two places moves to its manifest.
9. **Games are born from the generator.** A new game starts from `tools/generators/new-game.mjs`; one built by hand fails the conformance test.
10. **Every bug leaves a seed.** A reproducible bug becomes a replay test.

Rules 2, 7, 8, 9 and 10 name tools that the steps of #1249 build; until each lands, the rule is a target, not yet a gate.
