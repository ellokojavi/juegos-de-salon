level: patch

- **Lab: the 💬 feedback form stays above the iPhone keyboard** (#883): on iOS the keyboard covered the Send button and the card could not scroll to it. Behind `flag('keyboard-lift')`, the layer now ends where the keyboard starts and scrolls to Send, through a shared `visualViewport` helper (`assets/js/keyboard.js`). Checked: Hangman and Toque y Fama use their own keys, and La Copa's PIN and name fields sit in the page, which iOS scrolls on its own; `overscroll-behavior: none` was already on `html` and `body`.
