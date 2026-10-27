# Changelog

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
