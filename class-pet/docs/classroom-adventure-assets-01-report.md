# Classroom Adventure Assets 01 Report

**Status: REVIEW / ACCEPT FOR PROTOTYPE**

## Summary

Integrated five Meshy assets into the classroom adventure loop:

- Magical Moon Egg
- Empty Moon Nest / pedestal
- Moon Unicorn companion
- Magical Berry
- Magical Moon Lantern

The playable loop now works end to end:

1. Nest and Moon Egg appear in the habitat.
2. Teacher awards Stars.
3. Egg changes at 5, 10, 15, and 20 Stars.
4. Reward becomes ready without auto-starting.
5. Teacher starts the reward and chooses a preparation option.
6. Egg hatch sequence completes.
7. Moon Unicorn unlocks and persists.
8. Coins are awarded.
9. Magical Moon Lantern can be purchased once with Coins.
10. Lantern ownership and placement persist.
11. Magical Berry is available through the feed debug/test action with timed bite stages.

## Files Created Or Updated

### Blender / Asset Pipeline

- `blender/scripts/prepare_classroom_adventure_assets_01.py`
- `blender/assets/moon_egg_working.blend`
- `blender/assets/moon_nest_working.blend`
- `blender/assets/moon_unicorn_working.blend`
- `blender/assets/magical_berry_working.blend`
- `blender/assets/magical_lantern_working.blend`
- `blender/reports/classroom_adventure_asset_audit.md`
- `blender/reports/classroom_adventure_asset_audit.json`

### Game Assets

- `public/models/moon-egg.glb`
- `public/models/moon-nest.glb`
- `public/models/moon-unicorn.glb`
- `public/models/magic-berry.glb`
- `public/models/magic-lantern.glb`
- `public/models/classroom-adventure-assets.manifest.json`

### Game Code

- `src/pet3DRenderer.ts`
- `src/classroomAdventureUI.ts`
- `src/adventureContent.ts`
- `src/adventureStore.ts`
- `src/adventureStorage.ts`
- `scripts/validate-classroom-adventure.mjs`

### Previews

Saved under:

- `docs/previews/classroom-adventure-assets-01/`

Includes asset previews and classroom loop screenshots from 0 Stars through hatch, store purchase, and mobile layout.

## Asset Preparation

Original Meshy/download files were not overwritten. Each was imported or opened read-only, cleaned into a working `.blend`, and exported as a game GLB.

| Asset | Export | Triangles | Runtime status |
| --- | --- | ---: | --- |
| Moon Egg | `public/models/moon-egg.glb` | ~120k | REVIEW |
| Moon Nest | `public/models/moon-nest.glb` | ~120k | REVIEW |
| Moon Unicorn | `public/models/moon-unicorn.glb` | ~230k | REVIEW |
| Magical Berry | `public/models/magic-berry.glb` | ~120k | REVIEW |
| Magical Lantern | `public/models/magic-lantern.glb` | ~5k | PASS |

The source egg, nest, and berry were too heavy for a classroom browser scene, so they were decimated to roughly 120k triangles each. This was necessary after browser validation became unstable with the original high-poly versions.

## Runtime Integration

Added manifest-driven scene asset loading to `Pet3DRenderer`:

- Loads adventure GLBs into the existing Three scene.
- Supports named object visibility for egg stages and berry bite stages.
- Supports scene asset animation playback for `MoonEgg_Hatch` and `MoonUnicorn_Idle_Loop`.
- Supports subtle pulse reactions for Star milestones.
- Suppresses imported lantern lights and uses a controlled runtime glow/halo instead.

The adventure UI now uses `public/models/classroom-adventure-assets.manifest.json` rather than scattering asset placement constants in component code.

## Egg Progress And Hatch

Implemented egg stages:

- 0 Stars: intact egg
- 5 Stars: intact egg with pulse/shake reaction
- 10 Stars: first crack visible
- 15 Stars: larger crack state
- 20 Stars: reward-ready glow/crack state
- Hatch complete: shell/glow state plus Moon Unicorn reveal

`MoonEgg_Hatch` is present in the egg GLB. The classroom event currently uses the game-side story modal timing plus renderer pulse and hatch animation playback.

## Moon Unicorn

The Moon Unicorn source contains a rig. A simple `MoonUnicorn_Idle_Loop` was added and exported.

Current behavior:

- Hidden until the Moon Egg hatches.
- Appears near the nest after completion.
- Plays subtle idle loop.
- Persists through `unlockedItems` and `environmentProgress.slots.companion`.

Known limitation: GLB export reports more than four joint influences on some source vertices; Blender normalizes to the strongest four on export.

## Magical Berry Feed

The berry GLB contains:

- `MagicBerry_Full`
- `MagicBerry_Bite1`
- `MagicBerry_Bite2`
- `MagicBerry_Bite3`
- `MagicBerry_Core`

Feed bite timing is manifest-driven for `Pet_Eat_Talk`:

- Full: frame 1
- Bite 1: frame 18
- Bite 2: frame 34
- Bite 3: frame 50
- Hide/core: frame 64

The `More` panel now includes **Feed Magical Berry**. It lazy-loads the berry, swaps bite states, prevents stacking while already feeding, and falls back to the normal feed animation if the berry fails to load.

## Magical Moon Lantern Store

Store item:

- ID: `magic_moon_lantern`
- Cost: 25 Dragon Coins
- Purchase type: permanent
- Duplicate purchase prevented
- Persists through `unlockedItems` and `environmentProgress.slots.lantern`

The Moon Egg reward now awards 30 Coins so the vertical slice can demonstrate a meaningful purchase immediately after hatch.

Imported lights from the lantern GLB were disabled because they overexposed the entire habitat. The renderer adds a subtle runtime point light and warm halo instead.

## Persistence And Migration

Existing placeholder IDs are migrated safely:

- `moon_companion_01` -> `moon_unicorn_01`
- `star_lantern_01` -> `magic_moon_lantern`

No saved progress is deleted. Existing class Stars, Coins, milestones, scrapbook, and unlock state remain compatible.

## Validation

Commands run:

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4180 PLAYWRIGHT_CHROMIUM_PATH=/Users/patrickrooney/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell node scripts/validate-classroom-adventure.mjs
```

Final validation result:

```json
{
  "meterReached20": true,
  "activityQueuedAt10": true,
  "adventureCompleted": true,
  "companionUnlocked": true,
  "scrapbookCreated": true,
  "coinsAwardedAndSpent": true,
  "lanternPurchased": true,
  "rewardCleared": true,
  "undoRestoresStars": true,
  "quietModeToggleWorks": true,
  "runtimeErrors": []
}
```

`npm run build` passes. Vite still warns that the main JS chunk is over 500 kB; that was already a reasonable future code-splitting concern and is more noticeable now that the adventure stack is richer.

## Preview Notes

The final lantern screenshot shows the lantern clearly on the left side of the habitat without washing out the dragon or ground.

Some preview screenshot captures can be flaky when the WebGL scene is busy. The validator now treats screenshots as non-fatal review artifacts while keeping runtime assertions strict.

## PASS / REVIEW / FAIL

| Feature | Status | Notes |
| --- | --- | --- |
| Egg placement | PASS | Egg sits in nest area and is visible from game camera |
| Egg stages | REVIEW | Stage visibility works; crack overlays are first-pass authored |
| Hatching | REVIEW | Full loop works; hatch animation can be made more theatrical later |
| Unicorn reveal | PASS | Unlocks, appears, persists |
| Unicorn idle | REVIEW | Subtle loop exists; needs visual review at classroom distance |
| Berry feeding | REVIEW | Bite states and timing work; paw/mouth attachment is approximate |
| Lantern store purchase | PASS | Can buy once with Coins and persists |
| Lantern habitat placement | PASS | Visible left-side decoration |
| Lantern flicker/glow | REVIEW | Runtime glow is gentle; can be tuned after projector review |
| Persistence | PASS | Reload retains completion, unicorn, and lantern |

## Performance Concerns

The Meshy egg, nest, unicorn, and berry are still relatively heavy. The egg, nest, and berry were decimated to keep browser validation stable. The unicorn remains ~230k triangles because it is a hero reward and rigged, but it should be reviewed on lower-end classroom hardware.

Recommended next optimization pass:

1. Generate lower-poly versions of the Moon Egg and Nest from Meshy or Blender remesh/retopo.
2. Convert large textures to 1k or 2k where quality allows.
3. Lazy-load the Moon Unicorn only after hatch in production builds.
4. Code-split the adventure UI and renderer if bundle size becomes a startup issue.

## Recommended Next Step

Review the full loop in the browser at projector distance:

1. Reset demo progress.
2. Award four `+5` Star rewards.
3. Start Reward.
4. Choose either class option.
5. Confirm the Moon Unicorn reveal feels exciting enough.
6. Buy the Magical Moon Lantern.
7. Use **More -> Feed Magical Berry** and check whether the berry reads near the dragon.

After that, the highest-value polish pass is making the hatch moment more magical with better particles, shell movement, and a short dragon reaction timed to the reveal.
