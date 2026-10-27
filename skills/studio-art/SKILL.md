---
name: studio-art
description: Art department of the Roblox studio — art direction and art bible, concept to Blender models, textures and materials, characters and animation for Roblox rigs, UI art, icons and thumbnails, with an open-source pipeline (Blender, Krita, Inkscape, Material Maker) and an asset register that records every source and licence. Use when deciding the look of the game or producing any visual asset.
---

# Art (the visual creators)

Works in `studio/04-art/`. Sources (`.blend`, `.kra`, `.svg`) live in `studio/04-art/source/`; exported files in
`studio/04-art/export/`. Every asset gets a row in `ASSETS.md` (source/author, licence, file, uploaded asset id).

## 1. Art bible (before production)
Style in one sentence, 3–5 reference images described in words (and linked), palette (5–7 colours with hex), shape
language (round/friendly vs. sharp/dangerous), material rules (which Roblox materials, when to use SurfaceAppearance),
lighting mood (agreed with Tech Art), UI style. Readability first: the player's goal and danger must read on a phone.

## 2. Pipeline (all free and open source)
| Step | Tool | Output |
|---|---|---|
| Concept, mood, UI mockups | Krita | `.kra` → `.png` |
| Icons, logos, vector UI | Inkscape | `.svg` → `.png` |
| Modelling, UVs, rigging, animation | Blender | `.blend` → `.fbx` (or glTF where Roblox's importer supports it) |
| Materials | Material Maker / Blender | PBR maps for SurfaceAppearance |
| Pixel art | Pixelorama / LibreSprite | `.png` |

Import with Roblox's 3D Importer; verify scale with a 1-stud reference cube in the first export, then keep the export
settings in the art bible. Name meshes and materials clearly (`Prop_Barrel_A`), apply transforms, set pivots where the
object rests or rotates.

## 3. Budgets (set by Tech Art; check before export)
Kit defaults (tune in `studio/05-tech-art/BUDGETS.md`): hero objects ≤ 10k triangles, common props ≤ 2k, background
≤ 500; textures ≤ 1024² (props 512²), shared atlases where possible; few unique materials per scene. Low-poly with good
colour beats detailed meshes that drop frames on phones.

## 4. Characters and animation
Use Roblox's standard rigs (R15) for anything the player controls so avatars, emotes and animations work. Custom NPC rigs
are fine when they never use player avatars. Animate in Blender (or the Studio Animation Editor), keep loops seamless,
and export each animation separately; record animation ids in ASSETS.md after upload.

## 5. UI art
Turn Design's wireframes into assets with 9-slice friendly borders, readable at 360 px wide screens, high contrast text,
and icons that work without colour. Thumbnails and icons: designed by Publishing with Art; make several variants for
thumbnail tests.

## 6. Rules
- Only original work, open licences that allow commercial use (prefer CC0), or assets bought with a commercial licence.
  Record the licence in ASSETS.md. No copyrighted characters, logos or brands.
- Never insert free models that contain scripts; take only meshes/textures you can inspect, from trusted sources.
- Everything uploaded passes Roblox moderation: upload early, keep the source so you can fix and re-upload.

Update `status.json` after each delivery; hand assets to Tech Art through a BOARD.md ticket.
