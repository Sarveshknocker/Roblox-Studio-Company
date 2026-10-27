# Benchmark: what this kit takes from the best Roblox and agent tooling

| Need | Best open practice found | What this kit does |
|---|---|---|
| Code outside Studio, in git | Rojo + Rokit (the standard among professional Roblox teams) | template is a Rojo project with a pinned toolchain |
| Quality gates | Selene + StyLua + Lune tests in CI | `roblox-ci.yml` runs all four; pure modules have Lune specs |
| Player data | ProfileStore session locking (successor of ProfileService) | pinned and checksum-verified; template wraps it |
| Developer products | Idempotent ProcessReceipt with a saved PurchaseId ledger | Purchases.luau grants only after the save is confirmed |
| Remote security | Server authority, type checks, rate limits | `Net.on` with Validate and a token bucket; the linter flags violations |
| Free-model malware | Known backdoor patterns (require(id), loadstring, getfenv, byte strings) | 20-rule linter with an annotated corpus |
| Economy balance | Spreadsheet sims used by studios | `economy.mjs` minute-by-minute free vs paying simulation |
| Compliance | PolicyService paid-random-item checks, shown odds, text filtering | linter rule plus publishing checklist |
| Multi-agent teams | Studio role structures (producer, design, engineering, QA…) and AGENTS.md / skills conventions | 11 skills, 12 department-head briefs, owner gates, status.json evidence |
| Owner visibility | Status reports that hide nothing | `status` refuses done-without-evidence and decisions-without-recommendation |

## Deliberately left out
- Running code or plugins from unknown repositories. `research` filters exploit and cheat repos and labels everything
  else "ideas only" unless it is popular and licensed.
- Automatic publishing or Open Cloud uploads. The owner does these or approves them, and API keys never pass through the
  AI.
