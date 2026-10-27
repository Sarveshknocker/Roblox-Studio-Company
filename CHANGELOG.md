# Changelog

## 0.1.1 — 2026-10-27
Fixes from the first review.
- **Purchases:** a product that grants an unknown currency (e.g. a typo in economy.json) could be marked as handled
  with nothing given. Grants are now all-or-nothing (`Pure/Grants.luau`, with Lune tests), applied *before* the
  PurchaseId is recorded, and checked against the data template at server start. `economy` validation also rejects
  grants and multipliers for unknown currencies.
- **Game passes bought mid-session** now work at once: the server handles `PromptGamePassPurchaseFinished` instead of
  reading ownership only on join (`UserOwnsGamePassAsync` is cached and can lag behind a purchase).
- **Linter:** remote handlers passed by name (`:Connect(onBuy)`) are now checked. Handlers from another module are
  reported as unverified. The docs now say plainly that the linter is a safety net, not a guarantee.
- **Template CI:** Selene and StyLua clean. Every check runs and posts its output as an annotation.

## 0.1.0 — 2026-10-27
First release.
- Studio Manager orchestrator with owner gates (G0 kickoff, G1 concept, G2 vertical slice, G3 launch, weekly live review)
  and ten department skills, each working in its own `studio/` folder with a validated `status.json`.
- `status`: aggregates every department into `studio/00-owner/STATUS.md`; it rejects done items without evidence and
  decisions without a recommendation.
- `new`: department folders and a Rojo + Luau game template (ProfileStore data, exactly-once purchases, validated and
  rate-limited remotes, analytics, a mobile-safe HUD, Lune unit tests, and Selene/StyLua CI).
- `economy`: a minute-by-minute economy and progression simulator (dead zones, content runway, inflation, pay-to-win,
  product value).
- `lint`: a Roblox security and performance linter with 20 rules, each covered by an annotated test corpus.
- `research`: DevForum, GitHub and Wally search with relevance filtering, exploit-repo filtering and trust labels.
- `deps`: ProfileStore pinned to a commit and verified by SHA-256. `doctor`: a toolchain check.
- An installer for AGENTS.md, Claude Code, Gemini CLI, Copilot, Cursor, Windsurf and Cline, plus Claude and Codex plugin
  manifests.
