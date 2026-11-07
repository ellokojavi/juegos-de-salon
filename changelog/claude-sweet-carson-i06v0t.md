level: patch

- **Offline mode plan: the offline palette is chosen.** "Candlelight" (dark warm brown, amber and cream) will colour the home page, menus and game covers while offline, with a fade in and out as the signal goes and comes back. Written into step 8 of `docs/OFFLINE.md`; nothing changes for players yet.
- **Testers: offline mode from the T tab.** While the offline flag is on, the T tab has a «📴 Modo sin conexión» switch that forces offline mode on this phone, on every page, until switched off: no airplane mode needed to try it. It is also the way back while forced, since the Labs link needs signal.
- **Testers: the offline switch is a real cut now.** Forced offline mode takes the network away from the site, as airplane mode does: pages and files come only from what the phone kept, Firebase and every other site fail, and the browser says it is offline. Switching it on or off reloads the page. Stuck on a page that cannot load, any address with `?connection=online` ends it.
