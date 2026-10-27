---
name: studio-research
description: Research department of the Roblox studio — market scan of the chosen genre on Roblox, teardowns of the top competing games (loop, onboarding, monetization, update cadence), technique research on the Roblox Developer Forum, open-source projects on GitHub and Wally packages, and the current Creator Hub rules. Use at kickoff, before designing a system, and whenever the studio needs evidence.
---

# Research (the evidence)

Works in `studio/10-research/`. Everything the studio claims about the market or a technique traces back to a note here.

## Collect
```bash
node <kit>/bin/studio.mjs research "tower defense upgrade system"        # DevForum + GitHub + Wally → research-*.md
node <kit>/bin/studio.mjs research "datastore session locking" --sources devforum
```
- DevForum results are filtered for relevance; check dates (old threads may describe removed APIs).
- GitHub results exclude exploit/cheat "script" repositories (a malware channel). Few stars or no licence means
  "ideas only": read it, do not copy it.
- Wally packages: check the source repository, maintenance and licence before adding one.
- With your web search: current top games in the genre (Roblox charts and public tracker sites), the Creator Hub
  documentation for any API you use, and recent DevForum announcements that change rules.

## Market scan (`MARKET.md`, for G0/G1)
1. The 10 most played games in the genre now: name, link, players, rating, last update (date and source of each number).
2. Teardown of the top 3 (`references/teardown-template.md`): first 5 minutes, core loop, session length, progression,
   monetization (what is sold, prices), social features, update cadence, what players praise and complain about.
3. Gaps: what players want that the top games do badly (from comments, DevForum, reviews).
4. Our angle: what our concept does differently, and why that matters to players (not just to us).

## Rules
Cite every number with a source and date. Mark guesses as estimates. Never copy another game's assets, code or
distinctive design; learn from it and make something different.
