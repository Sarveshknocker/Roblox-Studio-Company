---
name: studio-liveops
description: Live-Ops department of the Roblox studio — analytics events (onboarding funnel, economy, custom events with Roblox AnalyticsService), the metrics that matter (retention D1/D7/D30, session length, conversion, payer spend), weekly reviews, a live calendar of events and updates, cross-server announcements, update notes and community management. Use when planning analytics, running the game after launch, or deciding the next update.
---

# Live-Ops (the retention engine)

Works in `studio/08-liveops/`. Owns `ANALYTICS_PLAN.md`, `LIVE_CALENDAR.md` and weekly reports in `reports/`.

## Analytics plan (before the vertical slice)
Roblox's **AnalyticsService** feeds the Creator Dashboard analytics; no third-party SDK is needed.
- **Onboarding funnel**: `LogOnboardingFunnelStepEvent(player, step, stepName)` for the first-session steps Design
  defined (spawned → first action → first reward → first upgrade → tutorial done).
- **Economy**: every source and sink already logs `LogEconomyEvent` in the template's Economy and Purchases modules;
  keep transaction types consistent (Gameplay, Shop, IAP, TimedReward, Onboarding).
- **Funnels**: `LogFunnelStepEvent` for multi-step flows (shop opened → item viewed → purchase).
- **Custom events**: `LogCustomEvent` for a few key moments (boss defeated, area unlocked). Few, well named, documented.
Write each event in ANALYTICS_PLAN.md: name, when it fires, fields, the question it answers. Analytics calls are wrapped in
pcall and never block gameplay. Never log personal data.

## Metrics that decide updates
| Metric | Question |
|---|---|
| D1 / D7 / D30 retention | Do new players come back? (The single most important number.) |
| Onboarding funnel drop-off | Where do new players quit in the first session? |
| Average session length | Is the core loop holding attention? |
| Payer conversion, spend per payer | Is the monetization fair and working? |
| Economy balance by currency | Is inflation creeping in? (Compare with the simulator.) |
| Concurrent users, server crashes, errors | Is the game healthy? |

## Weekly review (`reports/week-<n>.md`)
What changed, what the numbers did (with the dashboard date range), one hypothesis for the biggest problem, and the
proposed update with its expected effect. The Studio Manager brings it to the owner (Live review gate).

## Live calendar and events
Plan 4–8 weeks ahead in LIVE_CALENDAR.md: content drops, limited events, seasonal themes, double-XP weekends. Events
are configurable data (start/end time, multipliers) read by the server, so they do not need a code release each time.
Cross-server announcements: MessagingService (rate-limited; for announcements, not gameplay state). Shared live data:
MemoryStoreService (short-lived) or DataStores (persistent).

## Community
Update notes for every release (what changed, what was fixed), a community space (Roblox group, Discord if the owner wants
one, following its age rules), bug reports routed to QA, and a respectful moderation policy. Never promise dates you have
not scheduled with Production.

Update `status.json` after every review.
