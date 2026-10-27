# economy.json format and design rules

```json
{
  "name": "Candy Factory",
  "sessionMinutes": 25,
  "sessionsPerDay": 1.5,
  "currencies": ["Coins", "Gems"],
  "sources": [
    { "id": "collect", "currency": "Coins", "perMinute": 120, "growthPerLevel": 0.08 },
    { "id": "daily", "currency": "Gems", "perSession": 5 }
  ],
  "levels": { "xpPerMinute": 60, "base": 100, "exponent": 1.45, "max": 60 },
  "unlocks": [
    { "id": "backpack2", "currency": "Coins", "price": 1500, "level": 2, "effect": { "income": 0.25 } },
    { "id": "zone2", "currency": "Coins", "price": 12000, "level": 6, "effect": { "income": 0.6 } }
  ],
  "robux": [
    { "id": "gems_small", "kind": "product", "robux": 49, "grants": { "Gems": 100 } },
    { "id": "coins2x", "kind": "pass", "robux": 199, "effect": { "multiplier": { "Coins": 2 } }, "competitive": false }
  ],
  "targets": { "allContentDays": 14, "maxDeadZoneMinutes": 15, "firstUnlockMinutes": 3 }
}
```

- `growthPerLevel`: income multiplier added per player level (0.08 = +8% per level).
- `effect.income`: permanent multiplier added when the unlock is bought.
- Levels: XP needed for level L = `base × L^exponent`.
- `competitive: true` marks anything that affects PvP or leaderboards; the simulator flags it if sold for Robux.

## Rules of thumb (the simulator checks them)
- First unlock within ~3 minutes; then something new at least every 10–15 minutes of play in the first days.
- Prices should grow a little faster than income, so later goals take longer but stay reachable.
- Every currency needs sinks at every stage; a balance that only grows means inflation and boredom.
- Robux products should save time, not replace play; a product worth less than a few minutes of play feels like a ripoff,
  one worth many days collapses the progression.
- Simulate the paying player too (with passes active): content must not run out in a day.
