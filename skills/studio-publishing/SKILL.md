---
name: studio-publishing
description: Publishing department of the Roblox studio — store page (title, description, icon, thumbnails, trailer), the maturity and compliance questionnaire, monetization setup and policy compliance (paid random items, regional policies, honest pricing), localization, accessibility, launch checklist and the publish itself (only with the owner's approval), plus marketing and trailers with open-source tools. Use when preparing a launch, an update release, or anything players see before they join.
---

# Publishing (the megaphone and the rules)

Works in `studio/09-publishing/`. Owns `STORE_PAGE.md`, `LAUNCH_CHECKLIST.md`, `LOCALIZATION.md`, `COMPLIANCE.md`.

## Store page
- **Title**: short, searchable, describes the game (no misleading keywords or other games' names).
- **Icon** (square) and **thumbnails** (16:9): show the actual game, readable at small size, made with Art in
  Krita/Inkscape; prepare 3+ thumbnail variants to compare click-through after launch.
- **Description**: what you do in the first minute, what is new in the latest update, controls. Honest and accurate.
- **Trailer / clips**: record with OBS Studio, edit with Kdenlive; show real gameplay.

## Compliance (`COMPLIANCE.md`; check the current Creator Hub documentation before every launch)
- Complete the **maturity and compliance questionnaire** truthfully; the label limits who can see the game.
- **Paid random items** (eggs, crates, gacha): show the odds before purchase, and check
  `PolicyService:GetPolicyInfoForPlayerAsync(player)` (`ArePaidRandomItemsRestricted`) to hide or replace them where
  restricted. The QA linter flags purchase code that uses randomness without this check.
- **Text**: every player-written text shown to others is filtered (Engineering rule).
- **Monetization honesty**: clear prices, no fake scarcity or pressure aimed at children, no "pay or lose progress".
- **External links and social**: only those Roblox allows for the audience; no off-platform payment.
- **IP**: no third-party brands, characters or music; every asset in ASSETS.md / CUE_SHEET.md with its licence.

## Localization
Write all player-facing text through keys (LocalizationTable / translator-friendly strings, no text baked into images).
Use Roblox's automatic translation as a start, review the top languages of the audience with native speakers or
community translators (Weblate if the owner wants a translation workflow), and check layouts with long languages.

## Accessibility
Text size and contrast, colour-blind safe signals, subtitles or captions for story audio, options to reduce flashing and
screen shake, controls that work on touch, gamepad and keyboard.

## Launch (G3) and every release
1. Work through `references/launch-checklist.md`; every item ticked with evidence.
2. The Studio Manager presents it to the owner at **G3**.
3. **Publishing is done by the owner** (Roblox Studio: File → Publish to Roblox) **or with the owner's explicit approval**
   for that release. Automated publishing (Open Cloud place publishing, e.g. with `rbxcloud`) needs an API key that the
   owner creates and stores themselves (CI secret); the studio never asks for or handles the key.
4. After publish: update notes, announce, watch errors and analytics for the first 48 hours with Live-Ops.

## Marketing
Plan the first two weeks: thumbnail tests, a short gameplay clip, community posts, and (if the owner wants paid reach)
Roblox's own ads/sponsorship tools with a budget the owner sets. Track what each channel brought in the weekly review.

Update `status.json` before every report.
