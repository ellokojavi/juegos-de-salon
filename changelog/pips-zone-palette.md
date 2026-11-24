level: patch

- **Dominorama: zones that touch never look alike.** Each zone now takes the palette color farthest from its neighbours (side or corner), measured in Oklab, instead of the next one in order; before, two touching zones could even get the same color. Amber and mint left the palette for a clearer orange. Over 900 generated boards the closest touching pair went from identical to clearly distinct.
