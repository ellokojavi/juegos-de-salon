level: patch

- **Uno al día**: on /today/, a day uploaded more than a day late now shows 0 points in the calendar and its detail, with a short note that it counts for the streak, not for points, so the days add up to the season total (#879). The on-time window (`onTime`) has one definition in `daily-points.js`, shared by the browser and the backfill.
