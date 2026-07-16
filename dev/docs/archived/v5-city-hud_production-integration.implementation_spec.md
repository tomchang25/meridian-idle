# V5 City HUD Production Integration Implementation Spec

Parent Plan: none (standalone spec)

Status: Completed.

## Goal

Replace the current all-at-once V5 dashboard with the approved city-command HUD while preserving every existing gameplay, recovery, persistence, feedback, and accessibility contract.

## Summary

The playable root dashboard adopts the approved three-column maritime HUD. The Top Bar presents Meridian Idle, Gold, Cargo, current Port Level, and textual save status. The Left Sidebar presents current Fleet, region, and Port progression plus an explicitly unavailable Captain placeholder. The center presents a state-driven pixel-art Port or Voyage scene, mutually exclusive Market, Supplies Management, and Harbor city commands while docked, real Voyage progress while underway, and the complete canonical Activity Log. The Right Sidebar presents detailed Product Cargo and Provisioning ledgers without duplicating the primary command surface.

All displayed values come from the existing V5 state, authored content, or domain selectors. City-command selection and the display clock remain local presentation state and are never persisted. Buy, Sell, Supply, Discard, and Depart controls continue to call the existing store commands; eligibility and disabled reasons continue to come from domain rules. Voyage arrival remains automatic through the existing store timer, so the production HUD removes the manual Check arrival control and derives visible progress and remaining time from the persisted Voyage snapshot.

Loading, corrupt-save recovery, migration acknowledgement, command errors, saving and unavailable persistence states, secure-randomness failure, and latest Voyage details remain visible and semantic. Once integrated, the approved fixture route and demo-only components are removed so there is one HUD implementation and no production fixture data.

## Requirements

1. Keep all visible HUD copy in English and retain the approved original pixel-art maritime direction.
2. Show only Meridian Idle, Gold, Cargo, current Port Level, and save status in the global Top Bar.
3. Use current game state for Fleet, region, known Port, Cargo, Supply, Market, route, Voyage, result, and Activity information; mark unavailable player progression explicitly instead of inventing values.
4. Show only one docked city operation at a time through local Market, Supplies Management, and Harbor selection.
5. Keep all existing Product Buy/Sell, Supply Buy/Discard, and Voyage Depart commands and their domain-authored disabled reasons.
6. Replace manual arrival checking with semantic Voyage progress and remaining time derived from the active Voyage snapshot while preserving automatic deterministic resolution in the store.
7. Keep Product Cargo and Provisioning details visible in the Right Sidebar without duplicating primary transaction controls there.
8. Show every canonical Activity entry currently retained by state and preserve the detailed latest Voyage result in a polite live region.
9. Preserve loading, corrupt recovery, migration, command-error, saving, saved, and storage-unavailable behavior.
10. Reflow from a three-column desktop HUD to readable intermediate and narrow layouts without hiding required content, changing DOM order, or causing horizontal page scrolling.

## Relational Context

- `MeridianDashboard` reads canonical state, save status, runtime capability, and commands from `useGameStore`; it renders and dispatches intent but does not own game formulas, command validation, persistence, randomness, or Voyage resolution.
- Market prices, Product purchase errors, Supply purchase errors, Port levels, Cargo use, and Voyage departure errors remain derived through their existing domain functions. Presentation may format their output but must not reimplement eligibility or pricing.
- City-action selection is component-local UI state. It is discarded on unmount and must not enter `V5GameState`, IndexedDB, migration, or the application store.
- The presentation clock is component-local reconstructable state used only to derive progress and remaining time from `Voyage.departedAt` and `Voyage.plannedArrivesAt`. Its interval has symmetrical cleanup and never dispatches gameplay commands.
- `useGameStore` remains the sole automatic arrival coordinator through its existing timeout and `resolveVoyage` command. Removing the dashboard button does not remove or duplicate that application path.
- `useGameStore` reports `loading` until repository hydration settles so server and client render the same recovery boundary before timestamped Activity state is displayed. Its Voyage timeout rechecks the injected clock and reschedules after clock rollback before calling the same resolver.
- Product and Supply mutation buttons call the existing store commands with their current identities and quantities. Harbor departure calls `departVoyage`; secure-randomness capability remains an additional presentation-level disabled reason before that command.
- Activity entries and `latestVoyageResult` are read from canonical state. The HUD does not synthesize persisted log entries or mutate result acknowledgement.
- Loading and corrupt-save branches remain outside the normal HUD and cannot render mutation controls before hydration or recovery choice.
- The dashboard CSS Module owns all production HUD layout and visual behavior. Global CSS continues to own base tokens, focus indication, and reduced-motion defaults.
- Dashboard component tests continue to mock `useGameStore` and assert observable state-to-view and command behavior. The visual prototype tests and route are removed rather than becoming a second production contract.

## Scope

### Included

- Production three-column HUD and pixel scenes.
- Docked city-command selection and existing commands.
- Derived Voyage progress with automatic-arrival presentation.
- Long-term and short-term sidebars.
- Canonical Activity and latest-result presentation.
- Existing save, recovery, migration, error, and disabled states.
- Responsive production layouts and rendered regression coverage.
- Removal of the approved visual prototype route and fixtures.

### Excluded

- Domain, command, save-schema, persistence, migration, route-content, or Market formula changes.
- New Captain, Fame, Officer, weather, offline-reward, Settings, Expedition, or other placeholder gameplay.
- New artwork files, copied external assets, sound, or canvas rendering.
- Voyage cancellation, manual arrival, alternate resolution, or persisted UI selection.

## Files to Change

| File                                                    | Change Size | Purpose                                                                                          |
| ------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `game/features/dashboard/meridian-dashboard.tsx`        | Large       | Map real V5 state and commands into the approved HUD and derive display-only Voyage progress.    |
| `game/features/dashboard/meridian-dashboard.module.css` | Large       | Replace the current card dashboard with the approved HUD, pixel scenes, and responsive behavior. |
| `game/application/use-game-store.ts`                    | Medium      | Expose hydration truthfully and keep automatic Voyage arrival live across clock rollback.        |
| `app/layout.tsx`                                        | Small       | Declare the English document language and accurate product metadata.                             |
| `app/page.tsx`                                          | Small       | Use English, V5-accurate route metadata.                                                         |
| `tests/dashboard.test.tsx`                              | Large       | Protect city selection, command wiring, progress, recovery, feedback, and result behavior.       |
| `tests/use-game-store.test.tsx`                         | Medium      | Protect loading status, timer cleanup, clock rollback rescheduling, and exactly-once arrival.    |
| `e2e/application.smoke.spec.ts`                         | Small       | Follow the production city-command journey and updated accessible names.                         |
| `app/hud-demo/page.tsx`                                 | Delete      | Remove the approved fixture route after production integration.                                  |
| `game/features/dashboard/city-hud-demo.tsx`             | Delete      | Remove duplicate fixture presentation and demo-only state.                                       |
| `game/features/dashboard/city-hud-demo.module.css`      | Delete      | Remove duplicate prototype styling after it becomes the production baseline.                     |
| `tests/city-hud-demo.test.tsx`                          | Delete      | Remove prototype-only coverage in favor of production dashboard assertions.                      |

## Execution Outline

1. Rebuild `MeridianDashboard` around the approved semantic regions, map every fixture field to canonical V5 state or an explicit unavailable placeholder, and keep current loading, recovery, feedback, result, and command boundaries.
2. Add local city selection and a cleanup-safe presentation clock, render one docked city operation or the active Voyage status, and remove only the manual arrival button from the view.
3. Replace the dashboard CSS Module with the approved maritime geometry and scene composition, adapting fixture selectors to production error, migration, result, disabled-reason, empty, and save states.
4. Rewrite dashboard rendered coverage around production city selection, commands, Voyage progress, and all preserved state branches; update the existing smoke journey to navigate city commands, then remove the demo route, component, styles, and tests.
5. Run focused tests and full verification, manually report the remaining browser visual, responsive, keyboard, reduced-motion, and assistive-technology review boundary, and close the superseded prototype and production tracking artifacts.

## Implementation Notes

- Supply display labels are presentation mappings for all five current IDs: Food, Water, Medicine, Rope, and Sails. Do not rename domain identities.
- Region display names may format authored kebab-case IDs for presentation; authored IDs remain unchanged.
- Voyage progress clamps to `0..100`, treats non-positive snapshot duration defensively, and formats remaining duration without changing resolution time.
- No interval runs while docked. Strict Mode replay must leave exactly one active presentation interval after cleanup.
- Market cards retain complete authored catalog visibility, including locked products and their unlock level. Locked state and command reasons remain textual.
- Right-side local sale previews call `sellPrice`; they do not cache or persist a duplicate value.
- The Activity Log renders the full state array in canonical order, which is already newest-first and capped by domain rules.
- CSS animation remains atmospheric and is enabled only under `prefers-reduced-motion: no-preference`.

## Edge Cases

| Case                                               | Expected Handling                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Storage unavailable                                | The full HUD remains usable while the Top Bar states that the session is not saved.                                                       |
| Corrupt save                                       | Only non-destructive recovery information and the new-game choice render.                                                                 |
| Migration plus command error                       | Both remain visible before the active operation without replacing city controls.                                                          |
| Product or Supply unavailable                      | Its control is disabled and associated with a visible, wrapping reason.                                                                   |
| Secure randomness unavailable                      | Harbor departure is disabled with the existing explicit capability reason.                                                                |
| Active or reloaded Voyage                          | City commands are absent, progress is reconstructed from snapshot timestamps, and store-owned automatic resolution remains authoritative. |
| Elapsed display reaches zero before render settles | Progress clamps at completion while the store timer resolves the canonical state; no presentation command fires.                          |
| Empty Product Cargo                                | The Right Sidebar shows a textual empty state and retains capacity information.                                                           |
| Narrow viewport or zoom reflow                     | Long-term status, center operations, logs, and short-term ledgers remain available in DOM order without horizontal page scrolling.        |

## Acceptance Criteria

1. The playable root route uses the approved English three-column city HUD and no fixture route or demo-state control remains.
2. Every visible resource, status, price, requirement, progress value, ledger entry, and log comes from current V5 state, authored content, or existing domain derivation, except clearly labelled unavailable future player systems.
3. Docked players can switch among Market, Supplies Management, and Harbor and use all existing Buy, Sell, Buy Supply, Discard, and Depart commands with visible disabled reasons.
4. Underway players see the pixel Voyage scene, destination, risk, Supply commitment, remaining time, and semantic progress without a manual arrival button; arrival still resolves automatically.
5. Product Cargo and Provisioning details remain visible separately from the selected city operation, and all canonical Activity entries plus detailed latest Voyage results remain available.
6. Loading, corrupt recovery, migration acknowledgement, command errors, save states, and randomness degradation retain truthful semantic presentation.
7. Desktop, intermediate, and narrow layouts preserve information and action access, keyboard focus, non-color status, and reduced-motion behavior.
8. Focused rendered tests and full repository verification pass without changing domain, application, persistence, migration, or content contracts.
