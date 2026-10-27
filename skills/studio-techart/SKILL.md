---
name: studio-techart
description: Technical Art department of the Roblox studio — performance budgets for mobile, instance streaming, lighting and post-processing, VFX and particles, asset import checks, collision and render settings, and profiling with Roblox's MicroProfiler and Developer Console. Use when integrating assets, setting budgets, fixing frame drops or memory, or tuning how the game looks.
---

# Technical Art (the performance police)

Works in `studio/05-tech-art/`. Owns `BUDGETS.md` and `PERF_REPORT.md`; integrates Art's assets into `game/`.

## Budgets (kit defaults; agree final numbers at G1 and record them)
| Item | Default |
|---|---|
| Target | 60 fps on a mid-range phone, stable 30 fps on low-end; no hitch > 100 ms when entering areas |
| Triangles per mesh | hero ≤ 10k · props ≤ 2k · background ≤ 500 |
| Textures | ≤ 1024² (props ≤ 512²); reuse and atlas; SurfaceAppearance only where it shows |
| Parts | prefer fewer, larger parts; avoid unions for decoration; anchor everything static |
| Shadows | ≤ 3 shadow-casting lights visible at once; CastShadow off for small props |
| Particles | keep visible particles per emitter low (rate × lifetime ≈ under 200 on mobile); fewer emitters, better textures |
| Physics | decorative parts: CanCollide, CanTouch and CanQuery off; CollisionFidelity Box/Hull |
| Memory | track client memory in the Developer Console on a phone; investigate any steady growth |

These are this kit's conservative defaults, not Roblox's hard limits; check current import limits in the Creator docs.

## Streaming
`StreamingEnabled` is on in the template. Group each area under a Model with a sensible `ModelStreamingMode`; mark only
what must always exist as `Persistent`. Scripts never assume a part exists on the client: use `WaitForChild` with a
timeout or `ChildAdded`, and handle streamed-out parts.

## Lighting and look
Pick the Lighting technology deliberately (Future looks best but costs most); keep post-processing (Bloom, ColorCorrection,
DepthOfField, SunRays) subtle and test on a phone. Use Atmosphere and fog to hide distance. Make sure the game is
readable in its darkest area on a low-brightness phone.

## VFX
Particles, Beams, Trails with short lifetimes; pool and reuse emitters instead of creating them per hit; disable effects
outside the camera's view where practical. Screen shake and flashes have an off switch (accessibility).

## Import checks (every asset, before it enters the game)
Triangle count, texture sizes, scale against the reference cube, pivot, collision fidelity, materials, names, and the
ASSETS.md row (licence!). Reject or send back with the exact number that broke the budget.

## Profiling
- **MicroProfiler** (Ctrl+F6 in a client): find which work takes the frame time.
- **Developer Console** (F9): memory by category, network, server/client logs.
- **Script Profiler** in Studio for hot Luau code.
Record before/after numbers in `PERF_REPORT.md` with device, scene and what changed.

Update `status.json`; file performance bugs in `studio/07-qa/BUGS.md` through a ticket.
