# Launch checklist (G3)

Tick each item with evidence (file, screenshot, report). The Studio Manager presents the completed list to the owner.

## Game quality
- [ ] QA release sign-off (`studio/07-qa/reports/release-<version>.md`): automated checks green, no open blockers
- [ ] Data safety test: join → earn → leave → rejoin on another server; nothing lost or duplicated
- [ ] Purchases tested in Studio test mode: each product granted exactly once; passes detected
- [ ] Performance: low-end phone run recorded in PERF_REPORT.md within budgets
- [ ] Onboarding funnel events fire in the expected order; economy events logged

## Store page
- [ ] Title, description, genre, icon, thumbnails (3+ variants), optional trailer
- [ ] Allowed devices, server size, and private/public settings reviewed

## Compliance
- [ ] Maturity and compliance questionnaire completed truthfully
- [ ] Paid random items: odds shown, PolicyService check in place (or none sold)
- [ ] Player text filtered everywhere it is shown to others
- [ ] All assets and audio have recorded licences; no third-party IP
- [ ] No secrets in the place; lint report shows zero critical/high findings

## Monetization
- [ ] Game passes and developer products created; ids copied into economy.json and `studio.mjs config` re-run
- [ ] Prices match the simulated economy report; no pay-to-win in competitive modes

## Localization and accessibility
- [ ] Text uses localization keys; top audience languages reviewed; layouts checked with long text
- [ ] Controls work on touch, gamepad, keyboard; contrast and text size checked; flashing/shake can be reduced

## Owner approval
- [ ] Owner reviewed this list and approved publishing (date, in DECISIONS.md)
- [ ] Publish done by the owner (or by CI with the owner's own Open Cloud key, for this release)
