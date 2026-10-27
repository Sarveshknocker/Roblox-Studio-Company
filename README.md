# Roblox Studio Company

**Turn any AI coding assistant into a complete Roblox game studio.** You are the owner. A **Studio Manager** represents
you to ten departments, each working in its own folder: Production, Game Design, Engineering, Art, Technical Art, Audio,
QA, Live-Ops, Publishing and Research. You give the vision; the studio designs, builds, tests and runs the game, using
open-source tools. It stops only when it needs your decision.

Works with Claude Code, Codex, Gemini CLI, GitHub Copilot, Cursor, Windsurf, Cline/Roo, and any tool that reads `AGENTS.md`.

## Install
```bash
npx github:Sarveshknocker/Roblox-Studio-Company init my-roblox-game
```
Or clone and run `node bin/studio.mjs init <folder>`. Claude Code users can also add the plugin:
`/plugin marketplace add Sarveshknocker/Roblox-Studio-Company`.

Then open the folder in your AI tool and say:

> **Start the studio: let's make a Roblox game.**

## What happens
1. **Kickoff (G0).** The Studio Manager asks you about genre, story, audience age, play style, session length, how far
   monetization may go, scope, art style, must-haves and reference games. Research scans the market and you get **three
   concepts** to choose from.
2. **Concept (G1).** You get a one-page GDD, core loop, economy sketch, market research and risks, and decide go, change
   or stop.
3. **Pre-production (G2).** The studio builds a greybox prototype, simulates the economy, then a **vertical slice**: one
   short section at final quality. You get to play it in Studio.
4. **Production → Alpha → Beta.** Every feature goes through the same pipeline: ticket → design numbers → server-side
   code with tests → art/audio to budget → QA lint, tests and playtest → analytics → sign-off.
5. **Launch (G3).** Launch checklist, store page, maturity questionnaire and pricing. **You** publish, or you explicitly
   approve the publish.
6. **Live-Ops.** A weekly analytics review and a proposed update for you to approve.

Ask at any time: **"Studio, give me a status report."** Every department keeps a `status.json`; the manager aggregates
them into `studio/00-owner/STATUS.md`. It covers what is done (each item with evidence), what is next, the decisions it
needs from you (options plus a recommendation), risks, and anything blocked.

## Your project after `new`
```
studio/
  00-owner/       KICKOFF, DECISIONS, ROADMAP, phase.json, STATUS.md   ← read this one
  01-production/  BOARD (tickets), RISKS, ideas parking lot
  02-design/      GDD, economy.json, levels, UX, narrative
  03-engineering/ ARCHITECTURE
  04-art/         art bible, asset register (source + licence for every asset)
  05-tech-art/    performance budgets and reports
  06-audio/       audio plan, cue sheet with licences
  07-qa/          test plan, bugs, lint and test reports
  08-liveops/     analytics plan, live calendar
  09-publishing/  store page, launch checklist, localization
  10-research/    market scan, competitor teardowns
game/             Rojo project in strict Luau, ready for Studio
```

## The game template (`game/`)
- **Toolchain:** Rokit-pinned Rojo, Selene, StyLua and Lune, plus a GitHub Actions CI that lints, format-checks, tests
  and builds.
- **Data:** ProfileStore session-locked saving (pinned commit, SHA-256 verified by `deps`), with leaderstats and graceful
  shutdown.
- **Purchases:** exactly-once developer products. A PurchaseId ledger is saved before `PurchaseGranted`, and game passes
  are checked with pcall.
- **Remotes:** server-authoritative. `Net.on(name, checks, handler, rateLimit)` validates every argument (NaN included)
  and rate-limits per player.
- **Analytics:** economy, onboarding funnel and custom events through AnalyticsService.
- **UI:** a mobile-safe HUD (device safe insets, large touch targets).
- **Tests:** pure Luau modules (Validate, RateLimiter, Progression, ReceiptLedger) with Lune unit tests.

## Tools the studio uses
| Command | What it does |
|---|---|
| `new [dir] --name "Game"` | department folders + game project + CI (never overwrites your files) |
| `status [dir]` | the owner report; refuses "done" without evidence and decisions without a recommendation |
| `economy economy.json` | minute-by-minute simulation of free and paying players: first reward, dead zones, content runway, inflation, pay-to-win, Robux value |
| `config [dir]` | economy.json → `Config/Economy.luau`, so the game runs the numbers that were simulated |
| `lint game` | Roblox security and performance linter: free-model backdoors, client-trusted remotes, missing validation and rate limits, unsafe DataStore use, leaks, paid random items without a policy check, and more (20 rules). A pattern-based safety net, not a proof of safety: QA still reviews every remote by hand |
| `research "pet simulator"` | Developer Forum, GitHub and Wally research; filters exploit and cheat repos, labels what is reusable |
| `deps game` | installs pinned, checksum-verified dependencies |
| `doctor` | checks your toolchain and explains fixes |

Run them with `node .studio-kit/bin/studio.mjs <command>`. Your AI assistant runs them for you.

## Rules the studio never breaks
- The server decides currency, rewards, damage and prices. The client only asks.
- Player data is never lost, and purchases are granted exactly once.
- Fun is proven in a greybox before any art is produced.
- Mobile first: performance budgets are hard limits.
- Safe for young players: filtered text, honest monetization, and paid random items only with odds shown and policy
  checks passed.
- Only owned or openly licensed assets, and never free-model scripts from unknown authors.
- **Nothing outward-facing without you.** The studio never publishes, uploads, changes prices, posts, or handles your API
  keys or passwords. You do those in your own tools, or approve them at that moment.

## Sister kits
[3D-animated-web-developer](https://github.com/Sarveshknocker/3D-animated-web-developer) (a website or trailer page for
your game) · [The Protectors](https://github.com/Sarveshknocker/The-protectors-) (security review) ·
[The AI Maker](https://github.com/Sarveshknocker/The-Ai-Maker-) (AI features) ·
[Idea Enhancer](https://github.com/Sarveshknocker/-Idea-Enhancer-and-Value-Maximiser) (business model) ·
[The Reconstructor](https://github.com/Sarveshknocker/The-Reconstructor) ·
[The Hardware Engineering](https://github.com/Sarveshknocker/The-Hardware-engineering)

## Develop the kit
`npm test` runs the linter corpus, simulator, scaffold, status, research (against mock servers), installer and manifest
tests. `npm run test:live` also queries the real public APIs. See `AGENTS.md`.

MIT licence. Credits: [CREDITS.md](CREDITS.md).
