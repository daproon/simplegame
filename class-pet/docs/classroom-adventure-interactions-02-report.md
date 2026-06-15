# Classroom Adventure Interactions 02 Report

**Status: REVIEW**

## Summary

This pass adds the first classroom-bank interaction loop on top of the
adventure system:

- Adventure mode is now configurable and defaults off in teacher settings.
- The child-facing bottom bar now prioritises:
  - `Feed Berry`
  - `Play`
  - `Pet`
  - `More`
- Feed, Play, and Pet each cost 10 Class Stars.
- Hunger and Happiness bars are visible.
- The Magical Berry is much larger and follows a paw-to-mouth path during
  feeding.
- Play uses the new Fantasy Soccer Ball asset and a three-pass tap-back loop.
- Pet shows a tap prompt and plays a gentle coo-style dragon reaction using
  accepted existing dragon animation clips.

## New / Updated Assets

- Source: `/Users/patrickrooney/Downloads/Meshy_AI_Soccer_Ball_fantasy__0615092241_texture.blend`
- Working file: `blender/assets/fantasy_soccer_ball_working.blend`
- Export: `public/models/fantasy-soccer-ball.glb`
- Report: `blender/reports/fantasy_soccer_ball_asset_report.md`
- Previews:
  - `docs/previews/classroom-adventure-assets-01/fantasy_soccer_ball_front.png`
  - `docs/previews/classroom-adventure-assets-01/fantasy_soccer_ball_three_quarter.png`

The source soccer ball was about 743k triangles. The game export was decimated
to 80k triangles for runtime use.

## Adventure Asset Placement

Updated `public/models/classroom-adventure-assets.manifest.json`:

- Moon Nest moved further right and scaled up.
- Moon Egg moved further right and scaled up.
- Moon Unicorn moved into the nest/egg area and scaled up.
- Hatched egg state now hides the egg and shell fragments so the Unicorn owns
  the nest spot after hatching.
- Soccer ball manifest entry added as `fantasy_soccer_ball`.

## Gameplay Rules

- `classStars` now acts as a spendable classroom bank.
- Adventure Meter remains progress and does not decrease when Stars are spent.
- Feed sets Hunger to 100.
- Play costs 10 Stars, consumes 35 Hunger, and increases Happiness.
- Pet costs 10 Stars, consumes 25 Hunger, and increases Happiness.
- Play/Pet are blocked when the dragon is hungry and trigger a hungry fallback
  animation instead.

## UI Changes

- Teacher controls remain behind the lock button.
- Award Stars, Scrapbook, Habitat Shop, legacy animation tests, and the old
  direct Feed Magical Berry button moved into `More`.
- Adventure mode toggle added to teacher settings.
- Adventure HUD and 3D egg/nest/unicorn layer are hidden while Adventure mode
  is off.

## Validation

- `npm run build`: PASS
- `scripts/validate-classroom-adventure.mjs`: PASS
  - The smoke now explicitly enables Adventure mode before testing the Moon
    Egg loop.
- `scripts/validate-dragon-interactions.mjs`: PASS
  - Feed spends Stars and fills Hunger.
  - Pet spends Stars and raises Happiness.
  - Play spends Stars, runs the tap-back soccer loop, reduces Hunger, and
    raises Happiness.
  - Browser runtime errors: none.

## Remaining Manual Review

- Review the soccer ball size and screen-space path in the actual classroom
  camera. It is intentionally readable, but may need a small position/scale
  tweak after visual testing.
- Review the enlarged berry path. It is much more readable than before, but it
  is still a runtime prop path rather than a true hand bone attachment.
- The Pet coo is a first-pass interaction using existing safe animation clips,
  not a new baked Blender action.
- Adventure mode now defaults off, so remember to enable it in the teacher
  panel when reviewing the Moon Egg vertical slice.
