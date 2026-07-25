# Nautical Chart Navigation 02a — Passage Contract Cleanup

Parent Plan: `nautical-chart-navigation.md`

## Goal

Clarify the fixed Port-transfer Passage contract before later navigation work adds boundary progress and multi-phase Expeditions. Persisted Passage state must describe sailing only, while the active player wait remains owned by Voyage timestamps.

## Summary

The current graph-derived Passage correctly freezes sailing boundaries, risk, and Food/Water requirements, but it persists two duration representations: one for sailing simulation and one that duplicates the active Voyage timestamp interval. This child renames the former to `plannedSailingDurationMilliseconds`, keeps `pacingMultiplier` in the frozen Passage, and moves `scheduledDurationMilliseconds` to the transient departure preview.

Fixed Port transfers retain their existing experience and economics. Departure still validates and deducts all required Food and Water, including proportional acquisition cost basis, in one atomic operation; x1 and x20 retain equal routes, sailing duration, risk, and Supplies, differing only in the timestamp-derived wait before arrival.

Because v6 saves already persist both old fields, the change introduces save schema v7. A v6-to-v7 payload migration preserves all valid active Voyage timestamps and frozen Passage inputs while renaming the sailing duration and removing the duplicate schedule. Earlier migrations remain sequential and unchanged.

## Relational Context

- `previewVoyagePassage` is the single read-only quote owner: it constructs the frozen planned Passage and separately exposes the scheduled wait needed by the Harbor and departure command.
- `departVoyage` re-derives and validates the preview against canonical state, atomically commits its required Supplies and cost basis, and writes the preview's scheduled wait exactly once as `plannedArrivesAt - departedAt` on `Voyage`.
- A persisted `PassageSnapshot` owns immutable sailing facts only: origin and destination, planned sailing duration, pacing multiplier, required Supplies, static risk, and resolved edge/SubRegion offsets. It must not own a duplicate wall-clock arrival interval.
- `Voyage` timestamps are the sole persisted authority for active wait, progress display, arrival scheduling, reload, offline resolution, and clock rollback behavior; UI consumers must not reconstruct a second schedule from Passage fields.
- `PassageEdgeSnapshot` offsets remain in simulation-time coordinates and the final planned-edge offset must equal `plannedSailingDurationMilliseconds`; later Children map those fixed sailing boundaries to wall-clock pacing without rereading mutable world content.
- `save-migrations.ts` owns payload version validation and sequential migration. v6 must be fully validated under its historical contract before v6-to-v7 rewrites its active Passage; normal runtime code must not branch on v6 fields.
- `VoyageSupplies` represents only mandatory baseline sailing Food and Water. Medicine, Munitions, and Spares remain general Fleet Supplies and are not folded into this contract.
- Do not advance future Child 04 behavior: fixed Port transfers continue to pre-commit Supplies at departure rather than consuming them by boundary or tick.

## Scope

### Included

- Rename persisted sailing duration to `plannedSailingDurationMilliseconds`.
- Remove persisted `scheduledDurationMilliseconds` from Passage and retain it only in `VoyagePassagePreview`.
- Express `VoyageSupplies` as an explicit Food/Water object.
- Bump save payloads to v7 and migrate valid v6 active Voyages without changing their arrival timestamps or frozen input values.
- Update quote construction, departure, Harbor display, tests, and the human-readable navigation report to the clarified ownership model.

### Excluded

- Incremental at-sea Supply consumption, shortages, or cost-basis movement.
- Canonical position anchors, edge boundary resolution, Events, manual pauses, or Event scheduling.
- Expedition objectives, Combat lifecycle, return choices, or mid-edge diversion and replanning.
- Harbor or chart interaction redesign.

## Files to Change

| File                                                  | Change Size | Purpose                                                                                  |
| ----------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `src/core/model/game.ts`                              | Medium      | Define the v7 state and sailing-only Passage contract.                                   |
| `src/core/state/initial-game-state.ts`                | Small       | Create schema-v7 initial state.                                                          |
| `src/core/rules/voyage.ts`                            | Medium      | Separate preview schedule from persisted Passage and preserve departure behavior.        |
| `src/platform/persistence/save-migrations.ts`         | Large       | Add v6 validation and v6-to-v7 payload migration while retaining older chains.           |
| `src/runtime/game-runtime.ts`                         | Small       | Use the current game-state type through the runtime persistence boundary.                |
| `src/ui/dashboard/city-actions/harbor-panel.tsx`      | Small       | Render transient preview wait rather than a Passage field.                               |
| `test/unit/voyage.test.ts`                            | Medium      | Prove duration ownership, pacing parity, and unchanged commitment/arrival behavior.      |
| `test/unit/save-migrations.test.ts`                   | Medium      | Cover current v7 round-trip, valid v6 active migration, and corrupt historical payloads. |
| `test/unit/dashboard.test.tsx`                        | Small       | Update typed preview and underway fixtures to the split contract.                        |
| `dev/docs/reports/nautical_chart_navigation_map.html` | Small       | Keep the human-readable contract summary accurate.                                       |

## Execution Outline

1. Establish the v7 model types and initial-state version so current code writes only the sailing-only Passage shape.
2. Split the quote schedule from its Passage in voyage rules, use it for arrival timestamps, and update the Harbor consumer without altering quote staleness or Supply commitment.
3. Append a v6-to-v7 migration and historical validators in the persistence owner, then route v1–v5 payloads through their existing v6 migration before the new final step.
4. Update focused domain, persistence, and dashboard fixtures to assert timestamp-derived waiting, sailing-edge invariants, and v6 compatibility.
5. Update the visual report, run the required source verification, and retain the existing no-browser-smoke boundary for this intermediate child.

## Implementation Notes

- `GameState` is the canonical application-state type; its `schemaVersion` and newly written save payload must be v7. Historical payload types stay explicitly versioned only inside migration code.
- The preview schedule remains part of quote identity because a changed pacing multiplier must make a displayed quote stale. After departure, only timestamps represent that schedule.
- Validate v6 payloads before migration with their historical `simulationDurationMilliseconds`, `scheduledDurationMilliseconds`, and timestamp-equality rule. Migrate only valid data by copying the simulation value to `plannedSailingDurationMilliseconds` and omitting the scheduled field.
- v7 validation checks positive monotonic timestamps and the planned-edge final offset against the renamed sailing duration. It must not infer a schedule from floating-point pacing or require an equality that future pacing rules may legitimately change.
- Preserve legacy-route snapshots and their historical timestamps; they do not gain invented edge history during this cleanup.
- Keep the existing departure-time `consumeSupply` calls and `supplyCost` snapshot intact. This child changes contract clarity, not when or how Supplies are charged.

## Edge Cases

| Case                                                                    | Expected Handling                                                                                                 |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Valid active v6 planned Passage                                         | Migrates to v7 with the same timestamps, required Supplies, risk, resolved offsets, and renamed sailing duration. |
| Valid active v6 legacy-route Passage                                    | Migrates without adding graph-edge history; arrival remains governed by preserved timestamps.                     |
| v6 payload with mismatched schedule and timestamps                      | Is rejected as corrupt before migration.                                                                          |
| Planned Passage whose final edge offset does not equal sailing duration | Is rejected as corrupt.                                                                                           |
| Same sailing passage at x1 and x20                                      | Stores equal sailing data and Supplies; only `plannedArrivesAt - departedAt` differs.                             |
| Changed pacing after quote display                                      | Keeps the quote stale rather than departing under a different wait schedule.                                      |

## Acceptance Criteria

1. Fixed Port transfers retain the same legal path, static risk, Food/Water requirement, atomic cost-basis commitment, and exactly-once arrival behavior.
2. Persisted Passage duration describes planned sailing only, while an active Voyage represents its wait interval only through departure and planned-arrival timestamps.
3. Equal sailing simulation produces equal economics at x1 and x20 while only the timestamp-derived player wait differs.
4. Valid v6 active saves migrate to v7 without losing their historical Voyage timing or frozen Passage inputs, and malformed historical timelines fail recoverably.
5. The Harbor and human-readable navigation report communicate the same clarified duration ownership.
