---
name: studio-qa
description: QA department of the Roblox studio — test plans, automated checks (Roblox security/performance linter, Selene, StyLua, Lune unit tests), multiplayer playtests in Studio, the exploit checklist, a device matrix for phones, consoles and PC, bug reports, regression lists and release sign-off. Use when testing anything, before closing a ticket, or before any release.
---

# QA (the gatekeepers)

Works in `studio/07-qa/`. Only QA moves a ticket from `review` to `done`.

## Automated checks (every change)
```bash
node <kit>/bin/studio.mjs lint game --out studio/07-qa     # Roblox-specific risks → LINT_REPORT.md (fails on high/critical)
cd game && selene src && stylua --check src tests && lune run tests/run.luau
```
The linter finds what general linters miss: free-model backdoors (`require(<asset id>)`, `loadstring`, `getfenv`,
obfuscated strings), client-trusted remote values, unvalidated or unthrottled remotes, `InvokeClient`, DataStore calls
without pcall and SetAsync on player data, loops that never yield, server code using LocalPlayer or RenderStepped,
client HttpService, leaked per-frame connections, and paid random items without the policy check.
A reviewed exception is allowed only with `-- studio-ignore: <rule-id> <reason>`.

**Limits:** the linter matches patterns and does not understand the code, so a clean report is not proof of safety.
Handlers passed by name (`:Connect(onBuy)`) are followed within the same file. A handler from another module is
reported as unverified, and you must review it by hand. Every remote still gets the manual exploit checklist below.

## Test plan (`TEST_PLAN.md`)
For each feature: acceptance criteria from the ticket, happy path, edge cases (0, max, full inventory, rejoin mid-action,
leaving during a purchase), and exploit cases from `studio-engineering/references/security-checklist.md`.

## Playtests
- **Studio multiplayer**: Test → Clients and Servers with 2–4 players for anything networked.
- **Devices**: at least one low-end Android phone, one iPhone, PC with keyboard, and a gamepad. Use Studio's device
  emulator for layouts, but test performance on real phones.
- **Fun playtests**: 3–5 people who have not seen the game; watch silently, note where they get stuck or bored; record in
  `reports/playtest-<date>.md`. This decides G1/G2 more than any number.

## Bugs (`BUGS.md`)
One row per bug: severity (blocker / major / minor / cosmetic), exact steps, expected, actual, device, build, status.
Blockers stop a release. Fixed bugs get a regression line in `REGRESSION.md` that is re-tested before every release.

## Release sign-off
All checks pass, no open blockers, regression list re-run, data safety re-tested (join, earn, leave, rejoin on another
server: nothing lost or duplicated), purchases tested in Studio's test mode. QA writes the sign-off in
`reports/release-<version>.md` and updates `status.json`.
