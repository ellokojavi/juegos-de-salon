level: patch

- **Fewer end-to-end tests on each PR** (D-391). The scope reads what a page loads on demand (`import('…')`, `new URL('…')`), so a home page or lab search change runs 8 jobs instead of 76, and a new test stops any file or script the scope cannot place.
