# Genre playbooks (Roblox)

For each genre: loop, session shape, retention hooks, monetization that fits, classic mistakes. These are starting points
from common patterns; the research department checks them against current top games before G1.

## Obby / platformer
- Loop: run → jump section → checkpoint → next stage. Session: 5–20 min.
- Hooks: stage count, timers/leaderboards, cosmetics (trails), skip-stage product (only if difficulty is fair without it).
- Mistakes: unfair jumps on mobile, no checkpoints, invisible kill parts, same section repeated.

## Simulator (collect → sell → upgrade → rebirth)
- Loop: collect resource → sell/convert → buy better tool/backpack → new area → rebirth multiplier. Session: 20–40 min.
- Hooks: areas, pets/companions, rebirth multipliers, daily rewards, limited events.
- Monetization: 2x currency pass, auto-collect, extra pet slots, currency packs; eggs = paid random items (odds + policy).
- Mistakes: exponential prices outrunning income (simulate!), inflation after rebirth, pay-to-win leaderboards.

## Tycoon
- Loop: buy dropper/conveyor → earn passively → buy next upgrade → expand base. Session: 20–60 min.
- Hooks: visible base growth, satisfying build animations, rebirth, social visiting.
- Mistakes: long waits between buttons (dead zones), base reset without reward, server-side cash trusted from client.

## Horror / escape
- Loop: explore → find clue/item → avoid threat → escape chapter. Session: 15–30 min, replays via roles/maps.
- Hooks: chapters, co-op roles, jumpscares tuned for the audience's age band, revives.
- Monetization: revives (careful: not pay-to-win in PvP), cosmetics, chapter passes. Respect the maturity label.
- Mistakes: dark scenes unreadable on phones, jumpscares that break accessibility (offer a setting), AI pathing stuck.

## Roleplay / life
- Loop: pick role → do role tasks → earn → customize house/vehicle/avatar → socialize. Session: long, social.
- Hooks: houses, vehicles, jobs, events, friends.
- Mistakes: unfiltered text (signs, names: must use TextService filtering), griefing tools, no moderation tools.

## Fighting / battlegrounds
- Loop: queue/spawn → fight → earn → unlock moves/characters → fight again. Session: 10–30 min.
- Hooks: ranked, characters/move sets, combos, events.
- Engineering: hit detection server-side with lag compensation; cooldowns enforced on the server.
- Mistakes: client-authoritative hits (exploiters), pay-to-win moves, unreadable combat on mobile.

## Tower defense
- Loop: place units → wave → earn → upgrade/merge → harder wave. Session: 15–30 min per match.
- Hooks: unit collection, maps, co-op, modes. Units as paid random items → odds + policy.
- Mistakes: path/targeting cost exploding with many units (performance), one dominant unit.

## Survival / crafting
- Loop: gather → craft → build/defend → survive night → progress. Session: long.
- Mistakes: unbounded part counts from building (budgets, cleanup), save size (DataStore limits), duplication via trading.

## Racing / vehicles
- Loop: race → earn → buy/upgrade vehicle → harder track. Physics on the server or with network ownership rules set
  deliberately; anti-teleport checks.

## Puzzle / mystery
- Loop: observe → hypothesize → solve → reveal. Short, story-led; replay through new chapters.

## Social hangout / party games
- Loop: join → minigame round → points → cosmetics. Fast rounds, low skill floor, strong round variety.
