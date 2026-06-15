# Classroom Adventure V1 Implementation Report

## Result

**Status: PASS FOR VERTICAL-SLICE PROTOTYPE**

The application is now framed as a shared classroom adventure rather than a
needs-management dashboard. The complete Moon Egg loop works:

`Teacher award -> Stars -> Meter -> Milestones -> Queued reward -> Class choice -> Hatch event -> Coins -> Permanent unlock -> Scrapbook -> Reload`

The accepted Meshy dragon, environment, grounding, animation manifest,
crossfades, timed sneeze FX, and ambient personality scheduler remain in use.

## Files Added

- `src/adventureTypes.ts`
- `src/adventureContent.ts`
- `src/adventureStorage.ts`
- `src/adventureStore.ts`
- `src/classroomAdventureUI.ts`
- `scripts/validate-classroom-adventure.mjs`
- `docs/classroom-adventure-migration-audit.md`
- `docs/classroom-adventure-v1-report.md`
- `docs/classroom-adventure-teacher-test-script.md`

## Files Changed

- `src/main.ts`
- `src/pet3DRenderer.ts`
- `src/soundEffects.ts`
- `package.json`
- `package-lock.json`

Timestamped pre-migration copies are under
`backups/classroom-adventure-v1/`.

## Architecture

Adventure content, state, storage, and presentation are separate:

- Content definitions describe goals, milestones, choices, and outcomes.
- A versioned repository owns local-storage migration and normalization.
- The adventure store owns progression rules and permanent outcomes.
- The UI renders the habitat and invokes store/renderer actions.
- The existing Three.js renderer remains responsible for the dragon and
  environment.

Malformed or missing goal IDs fall back to the validated Moon Egg definition.
Environment progress uses named slots so garden, bridge, airship, trophy,
companion, sleeping-area, and seasonal content can be added later.

## State Migration

The new save key is `class-pet-adventure-v2`.

- Existing pets and the original `class-pet-store` remain untouched.
- Existing pet Coins seed Dragon Coins once.
- Existing XP can seed up to five introductory Stars.
- Happiness, hunger, energy, XP, and level are copied into `legacyArchive`.
- No legacy data is silently deleted.
- The old needs-decay timer has been removed.

## Main Screen

The permanent child-facing HUD now shows:

- Today's Adventure
- `Warm the Moon Egg`
- One Adventure Meter
- Class Stars
- Dragon Coins
- Reward Ready only when appropriate
- The dragon, habitat, Egg, companion, and permanent decorations

Happiness, fullness, energy, XP, and the large pet-action rail are no longer
visible. Legacy interactions remain in **More**.

## Teacher Workflow

The lock icon or **Award Stars** opens five configurable reason buttons.
Selecting one completes an award, closes the panel, updates the Meter, and
plays a short optional reaction. This is a two-tap workflow.

Teacher controls include:

- Award Stars
- Undo last ordinary award
- Quiet Mode
- Pause animations
- Save reward for later
- Start available reward
- Daily target
- Reward mode
- Class and dragon names
- Recent history
- Demo/debug milestone controls

Keyboard shortcuts: `1`, `2`, `3`, `5`, `Space`, `Escape`, and `M`. Shortcuts
ignore inputs, selects, and text areas.

## Moon Egg Vertical Slice

- 0 Stars: dim still Egg
- 5 Stars: brighter Egg and small shake
- 10 Stars: first crack and queued small class choice
- 15 Stars: stronger crack/glow
- 20 Stars: queued hatch reward and Reward Ready button

The hatch never starts automatically. The class chooses warm crystals or a
soft nest. The staged event is approximately 17 seconds at normal motion and
can be skipped. It reveals Pip the Moon Wisp, awards 15 Dragon Coins, updates
the habitat, and creates a scrapbook entry.

## Reward Modes

- Teacher Choice: implemented
- Class Vote: implemented with teacher-confirmed winner
- Automatic: configuration scaffolding; currently uses the same safe choice UI
- Surprise: configuration scaffolding; reveal concealment is future polish

## Micro-Reactions

Routine awards select short manifest-driven reactions while avoiding immediate
repeats. Milestones can use stronger reactions. Quiet Mode preserves all
progress while muting audio and suppressing award reactions. Animation pause
sets the mixer time scale to zero.

## Persistence And Permanent Progress

The following survive reload:

- Stars and Meter
- reached milestones
- queued rewards
- completed adventures
- Dragon Coins
- Pip the Moon Wisp
- scrapbook entries
- purchased Star Lantern
- teacher settings and names
- Quiet Mode and animation pause

The first deterministic shop purchase is the 10-Coin Star Lantern. It appears
permanently in the habitat.

## Validation

Automated Playwright validation exercised the real browser UI and passed:

- Meter reached 20
- 10-Star activity queued
- reward waited for teacher start
- class choice completed
- adventure completed
- companion unlocked
- 15 Coins awarded
- Star Lantern purchased
- scrapbook created
- reward queue cleared
- reload restored companion and lantern
- Undo restored the previous Star total
- Quiet Mode toggled
- no browser runtime errors

`npm run build`: **PASS**

There is no separate lint or unit-test command in the project. Vite retains
its existing bundle-size warning.

## Previews

Thirteen browser captures are in:

`docs/previews/classroom-adventure-v1/`

They cover the habitat, teacher controls, award panel, Egg stages, Reward
Ready, class choice, hatch, permanent unlock, scrapbook, shop, purchase, and
mobile layout.

## Known Limitations

- Egg, shell, companion, and lantern are polished DOM placeholders layered
  into the Three.js habitat, not final 3D assets.
- Automatic and Surprise reward modes need distinct presentation behavior.
- Award reasons are typed/configurable in state but do not yet have a
  dedicated reason editor UI.
- The current Moon Egg goal remains completed after hatch; the next-day goal
  rotation is future work.
- No backend sync or multi-device classroom account exists yet.
- The legacy `GameUI` remains in the codebase for transition safety but is no
  longer the application entry screen.

## Next Recommended Work

Create a production 3D Moon Egg/Pip asset and a second data-driven daily goal.
That will test whether the content and environment-slot abstractions hold
without adding more framework complexity.

