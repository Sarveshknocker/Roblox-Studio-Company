---
name: studio-audio
description: Audio department of the Roblox studio — audio direction, sound effects and music with open-source tools (Audacity, LMMS, Ardour, jsfxr), safe sourcing and licences for Roblox, SoundGroups for volume control, 3D spatial sound, adaptive music and a cue sheet. Use when planning or producing any sound or music for the game.
---

# Audio (atmosphere and feedback)

Works in `studio/06-audio/`. `AUDIO_PLAN.md` (style, references, mix rules) and `CUE_SHEET.md` (every sound: trigger,
file, source/licence, volume group, uploaded id).

## Sourcing (most audio problems on Roblox are rights problems)
1. **Make it**: record and edit in Audacity/Tenacity, compose in LMMS or Ardour, generate retro effects with jsfxr.
2. **Use Roblox's licensed library**: audio offered in the Creator Store by Roblox and its licensed partners can be used
   in experiences; check the asset's page.
3. **Open licences**: prefer CC0 (e.g. on Freesound); CC-BY needs credit in the game (credits screen); never
   "non-commercial" if the game is monetized.
Never upload music you do not own. Record every source and licence in CUE_SHEET.md. Uploads pass moderation and count
against upload limits: plan uploads, keep the masters.

## Implementation (with Engineering)
- **SoundGroups**: Music, SFX, UI, Ambience; players get volume sliders per group (and a mute), saved in their settings.
- **3D sound**: parent the Sound to a part for position; tune RollOffMinDistance/RollOffMaxDistance so important cues
  are audible where they matter.
- **Adaptive music**: two or three layers or tracks (explore / tension / combat) crossfaded by game state; never restart
  the track on every state change.
- **Feedback sounds**: every important action has a short, distinct sound (purchase, level up, hit, error). UI sounds are
  quiet and short.
- Keep loudness consistent between files (normalise in Audacity); no sound should surprise or hurt at default volume.

## Accessibility
Important information is never audio-only: pair cues with visuals. Offer a setting to reduce intense sounds (horror).

Update `status.json`; hand sounds to Tech Art/Engineering through BOARD.md tickets.
