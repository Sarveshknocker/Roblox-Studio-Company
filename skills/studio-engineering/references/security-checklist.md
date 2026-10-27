# Security checklist (exploit-proofing)

Assume every client is modified: exploiters can fire any remote with any arguments at any rate, read every LocalScript
and ModuleScript the client can see, and move their own character anywhere physics allows.

## Remotes
- [ ] Declared in `Shared/Remotes`, handled only through `Net.on`.
- [ ] Every argument validated: count, type, range, allowed set; NaN and infinity rejected; strings length-capped.
- [ ] Rate limit fits the action (shop: a few per second; combat: matches the fastest legitimate input).
- [ ] The handler re-checks game state on the server: does the player own it, can they afford it, is the cooldown over,
      are they close enough (distance check with a tolerance for latency)?
- [ ] No RemoteFunction:InvokeClient. Client→server RemoteFunctions have validation and return quickly.

## Economy and data
- [ ] Prices and rewards read from server config, never from the client.
- [ ] All balance changes in one server module (Economy) with analytics events.
- [ ] ProfileStore session per player; no SetAsync for player data; no duplication via rejoin or second server.
- [ ] Trading: both sides locked and saved atomically, with a confirmation step and logs.
- [ ] Developer products idempotent (PurchaseId ledger); game passes checked with UserOwnsGamePassAsync (cached, with pcall).

## Movement and combat
- [ ] Teleport/speed sanity checks on the server for anything that grants rewards (checkpoint skipping, kill auras).
- [ ] Hit detection validated server-side (range, line of sight, cooldown).
- [ ] Network ownership set deliberately for physics objects that affect others.

## Content and text
- [ ] Player text filtered for its audience before display.
- [ ] No free-model scripts; `studio.mjs lint` reports zero backdoor findings.
- [ ] No secrets in the place (webhooks, API keys); Open Cloud keys live only in the owner's tools.
