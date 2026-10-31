level: patch

- **Workshop**: a PR that edits one function of a shared module, or one text in `i18n.js`, now runs the end-to-end tests of only the pages that use it; the app manifests and the link cards' fingerprints no longer run every test (D-516).
