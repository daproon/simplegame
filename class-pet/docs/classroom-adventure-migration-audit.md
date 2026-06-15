# Classroom Adventure Migration Audit

## Current Architecture

- Entry point: `src/main.ts`
- State: custom singleton store in `src/store.ts`
- Persistence: JSON in `localStorage` under `class-pet-store`
- UI: one imperative `GameUI` class in `src/gameUI.ts`
- 3D integration: isolated `Pet3DRenderer` in `src/pet3DRenderer.ts`
- Audio: Web Audio and dragon OGG playback through `src/soundEffects.ts`
- Content/data: static TypeScript definitions in `src/gameData.ts`

## Existing Systems

- Multiple pet records and current-pet selection
- Legacy level, XP, happiness, hunger, energy, coins, and inventory
- Feed, play, rest, dance, sneeze, jumping-jacks, and animation-test controls
- Teacher coin-award panel
- Local persistence
- Meshy dragon GLB, manifest action mappings, ambient scheduler, timed FX,
  grounding, crossfades, and environment GLB

The pre-migration build passed on June 13, 2026. Vite reported only the
existing large-chunk warning.

## Reusable Systems

- Keep the complete Meshy renderer and manifest-driven animation pipeline.
- Keep local storage, but place it behind a versioned repository.
- Keep pet records for compatibility and selection/debug access.
- Keep existing interactions in a secondary More/debug panel.
- Reuse dragon reactions for short Star feedback and milestones.
- Reuse the environment canvas as the hero presentation.

## Systems To Retire From The Main Experience

- Needs dashboard and permanent hunger, fullness, happiness, energy, and XP
  bars
- Automatic needs decay
- Child-facing row of pet-maintenance buttons
- Direct teacher distribution of Dragon Coins
- Food-first shop
- Level/perk framing as the primary class objective

Legacy fields remain archived in pet records and are not silently deleted.

## Migration Risks

- Existing saves may be partial or from older schemas.
- The legacy UI directly reads old pet fields.
- Re-rendering the scene can recreate WebGL renderers if updates are not
  handled carefully.
- Long reward events must not be launched by milestone detection.
- Undo must not reverse permanent adventure outcomes.
- Keyboard shortcuts must ignore focused form controls.
- The Moon Egg is temporary DOM/Three-adjacent presentation art and should be
  replaceable with a production 3D asset later.

## Planned Components

- `src/adventureTypes.ts`: typed state and content contracts
- `src/adventureContent.ts`: validated Moon Egg vertical-slice definition
- `src/adventureStorage.ts`: versioned local-storage repository and migration
- `src/adventureStore.ts`: classroom progression actions
- `src/classroomAdventureUI.ts`: storybook habitat, teacher controls, event,
  scrapbook, shop, and debug views
- Existing renderer additions: animation pause API only
- Existing audio additions: global mute/quiet support

## Assumptions

- One shared class state is appropriate for this prototype.
- Existing pet coins migrate once into Dragon Coins; legacy pet coins remain
  archived for compatibility.
- Legacy XP contributes a capped introductory Star amount only on first
  migration.
- The prototype daily target is 20 Stars.
- Long adventure presentation is compressed to a skippable staged event so it
  can be tested quickly while retaining the explicit teacher-start gate.
- Teacher Choice and Class Vote are fully supported; Automatic and Surprise
  are safe configuration modes with simpler presentation.

