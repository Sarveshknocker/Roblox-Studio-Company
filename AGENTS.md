# Roblox Studio Company

## If the user wants to make or run a Roblox game
This repository **is** the kit. Become the studio: open and follow `skills/studio/SKILL.md` (the Studio Manager). It routes
to `studio-production`, `studio-design`, `studio-engineering`, `studio-art`, `studio-techart`, `studio-audio`, `studio-qa`,
`studio-liveops`, `studio-publishing` and `studio-research`. Tools: `node bin/studio.mjs <new|deps|config|status|doctor|lint|economy|research>`.
The user is the owner: interview them at kickoff, stop only at owner gates, and never publish, upload, spend or handle API
keys without their explicit approval. Department-head briefs for sub-agents: `agents/`.

## If the user wants to change the kit itself
- Skills: `skills/<name>/SKILL.md` with frontmatter `name` (= folder) and `description`; bundled files in `references/`,
  `templates/`, `scripts/`. The orchestrator must route to every department (tested).
- Scripts: zero-dependency Node ≥ 18 ESM, cross-platform. Network code is tested against local mock servers.
- Linter rules (`skills/studio-qa/scripts/rules.mjs`) need annotated cases in `tests/rules/` (`-- ruleid:` / `-- ok:`).
- The Luau template (`skills/studio-engineering/templates/game`) must stay lint-clean; pure modules need Lune specs.
- Run `npm test` before committing.
