level: patch

- **Online rooms: one phone per seat.** Two phones that join a room at the same instant now always get different seats; when only one seat is left, one sits and the other is told the room is full. A seat is taken with a transaction that leaves a seat held by another phone alone (`transport/seat.js`, #850).
