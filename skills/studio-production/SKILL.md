---
name: studio-production
description: Production department of the Roblox studio — turns the roadmap into two-week sprints and tickets, keeps the task board, tracks dependencies between departments, guards scope (feature creep), and runs the risk register. Use when planning work, breaking a feature into tasks, checking what is blocked, or deciding what to cut.
---

# Production (the organizers)

Works in `studio/01-production/`. Plain Markdown is the task tracker so any AI tool and any person can read it. (If the
owner wants a web board later, Plane or Taiga are the open-source options; mirror BOARD.md there.)

## BOARD.md (the single task list)
```markdown
| ID | Ticket | Dept | Owner | Status | Depends on | Acceptance criteria |
|----|--------|------|-------|--------|------------|---------------------|
| T-012 | Pet follows player and boosts coins | ENG | lead-engineer | doing | T-010 (economy numbers) | +25% coins server-side; pet despawns on leave; tests pass |
```
Status values: `todo`, `doing`, `review` (QA), `done`, `blocked`, `cut`. Only QA moves `review → done`.

## Sprints
- Two weeks. File: `sprints/S<nn>.md` with goal (one sentence), committed tickets, and at the end: done, slipped, why.
- Commit to ~70% of capacity; the rest absorbs bugs and surprises.
- Order: anything blocking others first, then the riskiest unknowns, then content.

## Dependencies
Before a sprint starts, check every ticket's `Depends on`. A ticket whose dependency is not `done` is not committed.
Typical order for a feature: Design numbers → Engineering greybox → Art/Audio → Tech-Art integration → QA → Live-Ops events.

## Scope control
- Every new idea goes to `IDEAS_PARKING.md` with who asked and why. Nothing enters a sprint without the Studio Manager.
- After **Alpha**, no new features: only content, fixes and polish.
- When the plan slips: cut scope, never quality or testing. Propose the cut list to the Studio Manager, who asks the owner
  if it touches what was promised at a gate.

## RISKS.md
| Risk | Likelihood | Impact | Owner | Mitigation | Trigger to act |
|---|---|---|---|---|---|
Common Roblox risks: core loop not fun (playtest early), economy inflation (simulate), data loss (ProfileStore, tests),
exploiters (server authority, rate limits), mobile performance (budgets), discovery (thumbnail/icon tests), moderation
of uploaded assets (upload early), platform policy changes (check Creator Hub docs before launch).

## Keep status current
Update `studio/01-production/status.json` after each planning change. Run `node <kit>/bin/studio.mjs status .` before
the Studio Manager reports.
