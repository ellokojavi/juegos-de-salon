level: patch

- **Panel: no more bursts of identical "saw the campaign" rows.** A splash now counts as shown only once the page is in front of someone (a prerendered page or a background tab waits until it is visible), and the timeline writes one row per phone and campaign, on its first reach. Rows from a page that opened hidden carry `vis` (`hidden`/`prerender`) for a while, to learn where the four-in-a-second bursts of Nov 9–10 came from.
