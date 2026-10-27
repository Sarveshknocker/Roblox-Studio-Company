# Plain-English glossary

| Term | Meaning |
|---|---|
| Core loop | The action players repeat (collect → sell → upgrade → collect more). If it is not fun, nothing else saves the game. |
| Greybox | A playable version made of plain blocks to test fun before any real art. |
| Vertical slice | One short part of the game finished to final quality, to prove the whole pipeline works. |
| Alpha / Beta | Alpha: every feature works, art may be placeholder; no new features after this. Beta: everything is in; only fixes. |
| Server-authoritative | The game server decides what is true (coins, damage, rewards). The player's device only asks. Stops cheating. |
| RemoteEvent / RemoteFunction | The messages between a player's device and the server. Every message from a player must be checked. |
| DataStore / ProfileStore | Roblox's save system, and the community library that saves player data safely (no duplication, no loss). |
| Session lock | Only one server may write a player's data at a time, so items cannot be duplicated by joining two servers. |
| Developer Product / Game Pass | Things bought with Robux: products can be bought many times (currency packs), passes once (2x coins). |
| Paid random item | A purchase with a random reward (a loot box). Roblox requires showing the odds and some countries restrict them. |
| Rojo | Open-source tool that syncs code from your computer into Roblox Studio, so the game lives in Git. |
| Luau | Roblox's programming language (a typed version of Lua). |
| Selene / StyLua | Open-source tools that check Luau code for mistakes and keep its formatting consistent. |
| Lune | Open-source tool that runs Luau outside Roblox, used here to run automatic tests. |
| Streaming | Roblox loads only the part of the map near the player, so big worlds run on phones. |
| Retention (D1, D7) | Share of new players who come back the next day / after a week. The most important health metric. |
| Funnel | The steps a new player goes through (join → tutorial → first upgrade); shows where people quit. |
| Live-Ops | Running the game after launch: updates, events, balance changes. |
| Maturity questionnaire | Roblox's form that sets the content label; required for a public game. |
