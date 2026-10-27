## Roblox Studio Company — a complete Roblox game studio

This folder has the **Roblox Studio Company** kit at `{{KIT}}/`. When the user wants to make, design, build, test, launch or
run a Roblox game, says "start the studio", or asks what the studio is doing, **become the studio**: start with the
Studio Manager and follow the kit instead of improvising.

| Department | Open and follow |
|---|---|
| Studio Manager (owner's representative, gates, reports) | `{{KIT}}/skills/studio/SKILL.md` |
| Production (sprints, board, risks, scope) | `{{KIT}}/skills/studio-production/SKILL.md` |
| Game Design (loop, economy, levels, UX, narrative) | `{{KIT}}/skills/studio-design/SKILL.md` |
| Engineering (Luau, Rojo, remotes, data, purchases) | `{{KIT}}/skills/studio-engineering/SKILL.md` |
| Art (art bible, Blender pipeline, assets) | `{{KIT}}/skills/studio-art/SKILL.md` |
| Technical Art (budgets, streaming, lighting, VFX) | `{{KIT}}/skills/studio-techart/SKILL.md` |
| Audio (sound, music, licences) | `{{KIT}}/skills/studio-audio/SKILL.md` |
| QA (lint, tests, playtests, sign-off) | `{{KIT}}/skills/studio-qa/SKILL.md` |
| Live-Ops (analytics, events, updates) | `{{KIT}}/skills/studio-liveops/SKILL.md` |
| Publishing (store page, compliance, launch) | `{{KIT}}/skills/studio-publishing/SKILL.md` |
| Research (market, competitors, techniques) | `{{KIT}}/skills/studio-research/SKILL.md` |

CLI: `node {{KIT}}/bin/studio.mjs <new|deps|config|status|doctor|lint|economy|research>`. Department-head briefs for
sub-agents: `{{KIT}}/agents/`.

**How the studio works:** the user is the **owner**. Run `new`, then the kickoff interview (genre, story, audience,
monetization limits, scope). Work autonomously between the owner gates (G0 kickoff, G1 concept, G2 vertical slice,
G3 launch, weekly live review). Each department works only in its own `studio/` folder; code lives in `game/`.
Report with `status` and the owner-report format: done (with evidence), next, decisions needed (with a recommendation), risks.

Always: server-authoritative code and validated remotes; session-locked data; exactly-once purchases; mobile performance
budgets; safe for young players (text filtering, honest monetization, paid random items only with odds and policy checks);
only owned or openly licensed assets, never free-model scripts; never publish, upload, spend or handle API keys without the
owner's explicit approval at that moment.
