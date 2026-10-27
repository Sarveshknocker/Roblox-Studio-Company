---
name: studio-design
description: Game Design department of the Roblox studio — core loop, the 3Cs (character, camera, controls), progression and economy (currencies, prices, XP curves, Robux products simulated with economy.mjs), level greyboxing, UX/HUD wireframes, onboarding, narrative and quests, using genre playbooks for obbies, simulators, tycoons, horror, fighting, tower defense, roleplay and more. Use when designing or balancing anything in the game.
---

# Game Design (the rule-makers)

Works in `studio/02-design/`. Designers decide rules, numbers, maps and screens. They do not write final code or art.

## 1. GDD.md (one living document)
Use `references/gdd-template.md`. Start as one page at G1; grow by sections as features are approved. Every rule has a
number (jump power, cooldown, price), and every number lives in one place: `economy.json` or a named config module.

## 2. Core loop first
Write it as **verb → reward → upgrade → repeat**, with the time each step takes. Find the genre in
`references/genre-playbooks.md`: it lists the loop, the session shape, retention hooks and the classic mistakes.
The greybox must make the loop fun with no art. If playtesters do not want "one more round" in greybox, change the loop.

## 3. The 3Cs
- **Character**: WalkSpeed, JumpPower/JumpHeight, acceleration feel, abilities with cooldowns.
- **Camera**: default follow camera unless the concept needs otherwise; never take camera control without a reason.
- **Controls**: must work on touch, gamepad and keyboard. Touch: buttons ≥ 44 px, reachable by thumbs, nothing important
  under the jump button. Use ContextActionService/`UserInputService` bindings that exist on all three.

## 4. Economy and progression (simulate, don't guess)
Write `studio/02-design/economy.json` (format in `references/economy-design.md`) and run:
```bash
node <kit>/skills/studio-design/scripts/economy.mjs studio/02-design/economy.json --days 14
```
→ `ECONOMY_REPORT.md`: time to each unlock and level, currency balance over sessions, dead zones (long stretches with
nothing new), inflation (balance piling up with nothing to buy), how fast all content runs out, and what each Robux
product is worth in play time. Fix every warning or justify it. Re-run after every price or reward change.

## 5. Levels (greybox)
- Block out with plain parts in Studio (or TrenchBroom/LDtk for planning). Mark the critical path, rest points, sightlines,
  and spawn/safe areas. Measure in studs; record key distances in `LEVELS.md`.
- Obbies: difficulty curve rises with short breathers; every jump is possible on mobile.
- Keep play spaces streaming-friendly: content grouped in regions (see `studio-techart`).

## 6. UX and HUD
Wireframes in `UX.md` (Penpot if the owner wants visuals). One primary action per screen, currency top, shop one tap away,
safe-area aware on phones (`ScreenGui.ScreenInsets`), readable at small sizes, colour-blind safe.
**Onboarding**: the first 60 seconds teach the core verb by doing it; no walls of text. Define the onboarding funnel steps
for Live-Ops (`studio-liveops`).

## 7. Narrative and quests
World premise, factions/characters, and quests as short, skippable beats in `NARRATIVE.md`. Branching dialogue can be
written in Ink or Yarn (open source) and exported to Luau tables. All player-visible text is localizable.

## 8. Monetization design (within the owner's limits from G0)
Design passes and products that respect the player: cosmetics, convenience, time savers that do not decide PvP outcomes.
Any **paid random item** must show odds before purchase and respect regional restrictions (`studio-publishing`).
Never design around pressure on children (fake timers, "only 1 left", nagging pop-ups).

## Hand-offs
Numbers → `economy.json` (Engineering reads it into `src/shared/Config`). Tickets → Production. Update `status.json`.
