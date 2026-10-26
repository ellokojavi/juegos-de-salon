/**
 * The seasonal templates (D-457): one row per date. The engine is ../js/season.js; how to add one
 * is in docs/SEASONS.md. Every field but `from`, `to` and `public` is optional: a template uses
 * only the touches it names.
 *
 *   from, to   the days it is on, 'MM-DD', both included, on the player's own calendar. A
 *              template may cross New Year ('12-31' to '01-01').
 *   public     false while it is in the lab: only lab key holders see it (D-395, D-409)
 *   built      the day it was last built or changed (the lab bar's order, D-399)
 *   css        its own stylesheet: the palette (`--fondo`) and the drawing of its corner. Written as
 *              new URL('<id>.css', import.meta.url) so the e2e scope follows it (D-391)
 *   icon       the browser tab's favicon: an emoji on a two-colour square, drawn in place
 *   hero       emojis that take turns with the home page's 🎲 cycle
 *   motes      emojis that replace one background particle in three
 *   flyby      an emoji that crosses the home page once per visit
 *   peek       { emoji, chance }: now and then it peeks from the bottom edge of the home page
 *   corner     true: a decoration in the top right corner, drawn by the template's css
 */
export const TEMPLATES = {
  halloween: {
    from: '10-26', to: '10-31',
    public: true, // the owner approved it on 2026-10-26
    built: '2026-10-26',
    css: new URL('halloween.css', import.meta.url).href,
    icon: { emoji: '🎃', colors: ['#ff7a1a', '#5b1fb8'] },
    hero: ['🎃', '👻', '🦇', '🍬', '🕸️'],
    motes: ['🦇', '🕷️', '🪲', '💀', '🎃', '👻', '🕸️'],
    flyby: '🦇',
    peek: { emoji: '👻', chance: 1 / 15 },
    corner: true,
  },
};
