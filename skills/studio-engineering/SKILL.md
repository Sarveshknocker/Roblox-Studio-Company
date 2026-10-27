---
name: studio-engineering
description: Engineering department of the Roblox studio — Luau code in a Rojo project with a pinned open-source toolchain (Rokit, Rojo, Selene, StyLua, Lune), server-authoritative architecture, validated and rate-limited RemoteEvents, session-locked player data with ProfileStore, exactly-once developer-product purchases, performance on mobile, and unit tests for game logic. Use when building, reviewing or fixing any game system.
---

# Engineering (the builders)

Code lives in `game/` (a Rojo project); decisions live in `studio/03-engineering/ARCHITECTURE.md`.

## Toolchain (all open source, pinned in `game/rokit.toml`)
| Tool | Job |
|---|---|
| Rokit | installs the exact tool versions below for everyone and for CI |
| Rojo | syncs `game/src` into Roblox Studio (`rojo serve`, then connect with the Rojo Studio plugin); builds `.rbxl` |
| Selene | lints Luau (`selene src`) |
| StyLua | formats Luau (`stylua src tests`) |
| Lune | runs Luau outside Roblox, used for unit tests (`lune run tests/run.luau`) |
| luau-lsp | editor type checking and autocomplete (VS Code / VSCodium extension) |

`node <kit>/bin/studio.mjs doctor .` checks what is installed and prints the fix for anything missing.
CI: `studio.mjs new` installs `.github/workflows/roblox-ci.yml` (Selene, StyLua, Lune tests, Rojo build) if absent.

## Project layout (template: `templates/game/`)
```
game/src/shared/Pure/      pure logic, no Roblox APIs: Validate, RateLimiter, Progression, ReceiptLedger (unit-tested)
game/src/shared/Config/    Economy.luau, generated from studio/02-design/economy.json (`studio.mjs config`)
game/src/shared/Remotes    the list of every RemoteEvent
game/src/server/Net        the only way to listen to clients: rate limit + validation + pcall
game/src/server/Services/  PlayerData (ProfileStore), Economy, Purchases, … one module per system
game/src/client/           UI and input; displays state, asks the server to act
game/tests/                Lune specs for everything in shared/Pure
```
Rules: server modules never trust arguments; client modules never decide outcomes; shared/Pure modules have no
`require` of Roblox objects so they run in Lune; one system per module with a `start()`; no global state outside modules.

## The non-negotiables
1. **Server authority.** Currency, damage, cooldowns, rewards, prices, positions that matter: computed on the server.
   Clients send intent ("BuyUnlock zone2"), never results ("I now have 9999 coins").
2. **Every remote through `Net.on`** with one `Validate` check per argument (exact count, type, range, allowed set) and a
   rate limit. Never `RemoteFunction:InvokeClient` (a client can hang the server). Prefer RemoteEvents; use
   RemoteFunctions only client→server with validation and timeouts.
3. **Data**: ProfileStore sessions (`studio.mjs deps game` fetches it pinned and checksum-verified). Template changes are
   additive (`Reconcile`); renaming the store loses data. Never `SetAsync` player data; never save on every change.
   Trading or gifting needs atomic two-player transactions; design review before building it.
4. **Purchases**: `Purchases.luau` grants each developer product exactly once (PurchaseId ledger in saved data) and
   returns `PurchaseGranted` only after the save. Exactly one script sets `ProcessReceipt`.
5. **Text**: anything a player types that others can see goes through `TextService:FilterStringAsync` (or TextChatService),
   including pet names, signs and messages. Use the filtered result for the right audience.
6. **No unsafe code**: no `loadstring`, no `require(<asset id>)`, no `getfenv`/`setfenv`, no HttpService calls from
   the client, no secrets (webhooks, API keys) in the place. Free models: never insert ones that contain scripts.
7. **Clean up**: disconnect connections and destroy instances you create (or use a cleanup helper such as Janitor/Trove);
   per-player tables are cleared on `PlayerRemoving`.
8. **Performance** (with Tech Art budgets): one loop for many objects instead of one per object, `task.wait`/`task.spawn`
   (never `wait`/`spawn`), no `Instance.new` in per-frame code, `StreamingEnabled` on, physics owned deliberately.

## Workflow per feature
1. Read the ticket and the design numbers; write the module interface first in ARCHITECTURE.md.
2. Greybox implementation with placeholder parts; pure logic in `shared/Pure` with a Lune spec.
3. `node <kit>/bin/studio.mjs lint game` (Roblox security/performance rules), `selene src`, `stylua src tests`,
   `lune run tests/run.luau` — all clean before handing to QA.
4. Playtest in Studio with 2+ players (Test → Clients and Servers) for anything networked.
5. Update `status.json` and move the ticket to `review`.

## Useful open-source libraries (check licence and maintenance before adding)
ProfileStore (data, Apache-2.0), Janitor / Trove (cleanup), roblox-lua-promise (async), Fusion or react-lua (UI),
Blink or Zap (typed, compact networking for heavy traffic), Cmdr (admin console), Iris (debug UI). Add through Wally
(`wally.toml`) or vendor with the licence file; record each in ARCHITECTURE.md.

## References
- `references/security-checklist.md` — what QA and reviewers check on every networked feature.
