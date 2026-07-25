# Nautical Chart Navigation 05 — NavPoint Hold And Passage Continuation

Parent Plan: `nautical-chart-navigation.md`

## Goal

Allow the Fleet to complete a Passage at an authored holdable NavPoint, remain there safely without ongoing simulation effects, and later commit a new Passage to a known legal Port. Make the Fleet's current stage and remaining committed navigation leg understandable without treating the stop as a Port or an Expedition.

## Summary

Cape St. Vincent becomes the first authored holdable NavPoint. The departure chart can select it as a Passage terminal and quote the same deterministic distance, duration, risk, waters, and Food/Water requirements used for Port destinations. Reaching it completes that immutable Passage and its existing Supply accounting, clears the active Voyage, persists the Fleet at the exact NavPoint, and preserves the last Market Session without Port XP, Market refresh, restock, or docked operations.

Holding position is a stable location, not a timed Action. It has no completion timestamp, percentage, Supply ledger, Event exposure, or runtime wakeup and may survive arbitrary foreground, background, offline, and reload time unchanged. The holding interface shows only the completed origin, current NavPoint, and an `Orders required` gate. It lets the player inspect known legal Ports and commit a new independent Passage from the held node; only that Passage resumes sailing time and Supply consumption.

Fleet persistence retains its last docked Port and adds an explicit held-NavPoint identity plus completed origin. Rules derive the physical location from the held NavPoint when present, so they cannot mistake a held Fleet for one docked at its preserved Market Session Port. Save schema v9 adds those fields to every v8 Fleet without changing its route, progress, accounting, or arrival behavior.

During a Passage, the status surface gains a prominent itinerary summary with the current navigation leg, next waypoint, and remaining edge count. Text and semantic structure carry the same meaning as the visual rail, including reduced-motion and narrow-screen presentations.

## Relational Context

- `Fleet.holdingNavPointId` is the physical-location override while present; otherwise `Fleet.locationPortId` is the docked physical location. A Port permits docked operations; a held NavPoint permits only holding-position commands. `MarketSession.portId` remains the last docked economic session while at sea and must never be used as the Fleet's current physical location.
- `PassageSnapshot` and planner output use origin and destination navigation-node identities. Endpoint eligibility is caller policy: docked departure may target a known Port or explicitly holdable NavPoint, while holding departure may target a known legal Port. Intermediate Ports remain terminal and cannot be traversed accidentally.
- Authored navigation content explicitly marks holdable points. A headland does not become holdable merely because it is a NavPoint, and harbor approaches remain through-navigation nodes rather than selectable sea stops.
- `resolveVoyage` remains the only elapsed-time and Supply authority. A completed Port destination calls the existing Port-entry settlement; a completed NavPoint destination instead materializes holding location and emits its semantic arrival without Market, progression, auto-restock, or docked effects.
- Every Passage, including one ending at a NavPoint, keeps Child 04's independent Supply ceiling and final remainder settlement. Holding owns no ledger and a later Passage starts from a fresh quote.
- Voyage absence no longer implies docked state. Runtime scheduling reads only an active Voyage boundary, while UI and every Port command read the Fleet location discriminator before exposing or applying docked behavior.
- Returning from a NavPoint to the same Port as the preserved Market Session must still change physical location to that Port while leaving the Session, Specialty supply, and Port XP unchanged.
- The holding location retains the completed Passage origin needed for the approved `[completed origin] — [current NavPoint] — [Orders required]` itinerary. Presentation derives labels from content and does not persist layout geometry or percentage.
- Schema v9 appends a v8 migration that gives every Port-only Fleet a null held-NavPoint identity and origin. Earlier migrations remain unchanged and continue sequentially through v8.
- Timed NavPoint Activities, Repeat, cancellation accounting, Crew-scaled consumption, shortage consequences, interactive Event decisions, Combat, and mid-edge diversion remain separate owners and must not be represented by placeholder fields in the holding contract.

## Scope

### Included

- Explicit persisted held-NavPoint location state alongside the preserved last Port.
- Authored holdable-NavPoint eligibility with Cape St. Vincent as the first stop.
- Deterministic Port-to-NavPoint and NavPoint-to-Port Passage preview, commitment, and resolution.
- Safe indefinite holding with no time, Supply, Event, or Port effects.
- Holding-position chart commands and prominent Passage leg/waypoint status.
- Save schema v9 validation and migration of current Port-only saves and active Voyages.
- Focused content, planner, rules, persistence, runtime, component, and determinism coverage.

### Excluded

- NavPoint Action rounds, rewards, Repeat, cancellation, or Action Supply accounting.
- Crew, morale, starvation, dehydration, direct shortage consequences, or recovery.
- Event decisions, timeout defaults, Combat, Adventure, formal Expedition behavior, or Region unlock.
- NavPoint-to-NavPoint chaining, arbitrary waypoints, or mid-edge diversion.

## Files to Change

| File                                                  | Change Size | Purpose                                                                             |
| ----------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `src/core/model/game.ts`                              | Medium      | Define persisted held-NavPoint state alongside the last Port; stamp schema v9.      |
| `src/core/content/world-content.ts`                   | Small       | Expose authored hold-position eligibility.                                          |
| `src/content/navigation-definitions.ts`               | Small       | Mark Cape St. Vincent as the first holdable NavPoint.                               |
| `src/core/navigation/passage-planner.ts`              | Large       | Generalize deterministic planning from Port endpoints to approved graph nodes.      |
| `src/core/rules/voyage.ts`                            | Large       | Quote from canonical location and branch NavPoint arrival from Port settlement.     |
| `src/core/rules/progression.ts`                       | Medium      | Materialize Port location even when returning to the preserved same-Port Session.   |
| `src/core/rules/cargo.ts`                             | Medium      | Gate Port-only provisioning and inventory commands by exact location.               |
| `src/core/rules/market.ts`                            | Small       | Resolve current Market authority only from a Port location.                         |
| `src/core/events/game-events.ts`                      | Small       | Represent departure endpoints and NavPoint arrival semantically.                    |
| `src/core/state/initial-game-state.ts`                | Small       | Initialize schema v9 at Lisbon Port.                                                |
| `src/platform/persistence/save-migrations.ts`         | Large       | Validate v9 and append lossless v8 location/endpoint migration.                     |
| `src/ui/dashboard/city-actions/harbor-panel.tsx`      | Large       | Select holdable NavPoints from Port and present their Passage preview.              |
| `src/ui/dashboard/city-actions/nautical-chart.tsx`    | Large       | Render selectable holdable points and generic current/selected nodes accessibly.    |
| `src/ui/dashboard/voyage/voyage-status-panel.tsx`     | Medium      | Show current leg, next waypoint, remaining edges, and semantic itinerary status.    |
| `src/ui/dashboard/voyage/nav-point-hold-panel.tsx`    | Large       | Present safe holding state, orders gate, and known-Port continuation choices.       |
| `src/ui/dashboard/meridian-dashboard.tsx`             | Medium      | Select docked, underway, or holding surfaces from canonical location.               |
| `src/ui/dashboard/scene/port-scene-panel.tsx`         | Medium      | Stop presenting a held NavPoint as the previous Port.                               |
| `src/ui/dashboard/sidebars/dashboard-sidebars.tsx`    | Medium      | Report Fleet holding state without claiming current Port standing.                  |
| `src/ui/dashboard/dashboard-top-bar.tsx`              | Small       | Label physical NavPoint position separately from Port Level.                        |
| `test/unit/voyage.test.ts`                            | Large       | Prove NavPoint arrival, safe hold, continuation, accounting, and Port settlement.   |
| `test/unit/save-migrations.test.ts`                   | Large       | Cover v9 validation and lossless v8 active-Voyage migration.                        |
| `dev/docs/reports/nautical_chart_navigation_map.html` | Small       | Add exact location, safe holding, and continuation ownership to the human overview. |

## Execution Outline

1. Introduce persisted held-NavPoint state and node-ended Passage planning, append schema v9 migration, and update current-location helpers so every rule distinguishes Port authority from a held NavPoint.
2. Mark and validate Cape St. Vincent as holdable, then generalize the planner and estimator integration to legal node endpoints while preserving Port terminal behavior and existing Port-to-Port quote parity.
3. Extend departure and the shared resolver so a NavPoint destination completes Supply accounting into holding position, while a Port destination alone invokes existing settlement and same-Port return correctly restores docked location.
4. Extend runtime commands for endpoint-neutral preview and departure, retaining the existing secure-seed, stale-quote, next-boundary, hydration, and save scheduling contracts with no timer while holding.
5. Add selectable holdable points, the prominent underway leg indicator, and the semantic holding/orders surface, then update surrounding scene, top bar, and sidebar state so no surface claims the Fleet is docked.
6. Add focused content, planner, rule, migration, runtime, determinism, and component coverage; update the human navigation report and run the full implementation verification required for source changes.

## Implementation Notes

- Treat `holdingNavPointId ?? locationPortId` as the current physical node throughout core and UI. `locationPortId` intentionally remains the last docked Port while holding, because it anchors existing Port progress and Market Session data; Port operations must still explicitly reject a held Fleet.
- The planner may accept arbitrary graph-node identities internally, but public Voyage preview must enforce the approved origin/destination policy before producing a quote.
- Resolve a due NavPoint arrival at its immutable planned boundary even after a long offline return, then stop. Later wall time must not alter the held state.
- The underway indicator derives `current leg`, `next waypoint`, and `edges remaining` from immutable edges plus canonical completed-edge progress. The holding rail contains no fabricated future destination.
- Keep the existing 16:9 chart canvas and provide equivalent semantic node controls and route text outside visual geometry.

## Edge Cases

| Case                                        | Expected Handling                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Long offline return beyond NavPoint arrival | Resolve exactly to holding at planned arrival; all later elapsed time has no effect.                       |
| Return to the preserved same Port           | Restore Port location without refreshing Market Session, Specialty supply, or XP.                          |
| Unknown or non-holdable NavPoint target     | Deny preview and departure without an approximate path or partial mutation.                                |
| Stale quote after location or Fleet change  | Reject departure and preserve holding or docked state.                                                     |
| Insufficient return Supplies while holding  | Show the deterministic disabled reason; holding remains safe indefinitely.                                 |
| Clock rollback while underway or holding    | Underway progress does not reverse; holding remains unchanged and schedules nothing.                       |
| v8 active Voyage migration                  | Preserve route, progress, ledger, timestamps, seed, and Port destination semantics exactly.                |
| Narrow screen or reduced motion             | Preserve ordered stage text, controls, and progress without depending on animation or horizontal overflow. |

## Acceptance Criteria

1. From Lisbon, the player can select Cape St. Vincent, inspect a deterministic Passage quote, depart, and resolve to an exact held NavPoint without entering a Port.
2. Holding position can survive arbitrary foreground, background, offline, and reload time without progress, Food or Water consumption, Event effects, or runtime wakeups.
3. Underway status identifies the current navigation leg, next waypoint, and remaining edges, while held status exposes the completed origin, current NavPoint, and Orders required gate without inventing a future destination.
4. From Cape St. Vincent, the player can preview known legal Ports, see explicit Supply or reachability denials, and commit a new immutable Passage.
5. NavPoint arrival never changes Market Session, Port XP, Specialty supply, restock, or docked-operation availability; actual Port arrival remains the only settlement boundary.
6. Returning to the same Port preserves its existing Session while correctly restoring docked location; returning to a different Port performs the existing settlement exactly once.
7. Equal state, content, seed, pacing, and explicit time produce identical Port-to-NavPoint, holding, continuation, Supply, and final Port results across incremental, offline, and save/reload resolution.
8. Current saves migrate losslessly to schema v9, while malformed held locations, endpoint identities, or non-holdable stops fail recoverably without fabricated positions or partial effects.
9. Chart selection, itinerary state, disabled reasons, and continuation commands remain understandable and operable with keyboard, touch, assistive technology, reduced motion, and narrow responsive layouts.
