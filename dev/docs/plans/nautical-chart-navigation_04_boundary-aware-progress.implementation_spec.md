# Nautical Chart Navigation 04 — Boundary-Aware Progress And Sailing Consumption

Parent Plan: `nautical-chart-navigation.md`

## Goal

Advance an active Voyage deterministically through its immutable Edge and SubRegion timeline while baseline Food, Water, and proportional acquisition cost basis follow actual resolved sailing time. Establish a persisted position and consumption contract that later Expedition pauses and mid-edge diversion can reuse without introducing tick-based gameplay.

## Summary

The active Voyage gains a canonical resolution anchor that records its resolved simulation offset, current node or edge position, ordered timeline cursor, last explicit resolution time, next gameplay boundary, and sailing-consumption ledger. Smooth countdown and ship movement remain timestamp-derived presentation; gameplay state changes only when the shared resolver crosses a meaningful boundary or a command explicitly materializes the current position.

Food and Water remain whole Fleet units. Each Supply has a fixed-point elapsed-time accumulator: resolved sailing time adds snapshotted consumption units, every completed whole unit deducts one Supply and its proportional cost basis, and the fractional remainder survives saves and future plan revisions. Completing the committed sailing phase settles any final fraction so total consumption equals the quoted `ceil` requirement. Pauses accrue nothing, and abandoning an untraveled future in a later diversion must preserve the ledger rather than reset or settle it.

One pure explicit-time resolver handles foreground wakeups, hydration, reload, clock rollback, and long offline return. It processes every crossed boundary in deterministic order, may jump directly to arrival when no gameplay interruption exists, and settles destination entry only after all due sailing consumption and position transitions. Runtime timers schedule only the next boundary and are wake mechanisms, never elapsed-time authority.

Save schema v8 validates the anchor, cursor, position, fixed-point remainder, cumulative consumption, and next-boundary coherence. Existing in-progress v7 Voyages migrate as prepaid compatibility Voyages because their Supplies were already fully deducted: they receive boundary-aware position progress but are never refunded or charged twice, while legacy-route snapshots remain arrival-only when no Edge timeline exists.

## Relational Context

- `PassageSnapshot` remains the immutable authority for the committed route, simulation duration, pacing, Edge/Span offsets, and quoted Supply ceiling. The active Voyage ledger snapshots consumption rates at departure, so the resolver must not read mutable navigation content to reinterpret active sailing costs.
- `Voyage` owns persisted progress and cumulative sailing accounting. Presentation may interpolate beyond the last anchor for display, but it never writes progress, consumes Supplies, or decides that a boundary was crossed.
- Passage preview and departure continue to require the full quoted Food and Water before sailing. Departure changes from immediate deduction to initializing an accruing ledger; destination settlement still receives the final accumulated `supplyCost`.
- The resolver is a pure rule receiving `GameState`, content needed for final Port settlement, and explicit `now`. `GameRuntime` calls it and schedules its reported next boundary; timer callbacks, React effects, and visibility cadence cannot determine progress.
- Supply quantity and cost basis leave the Fleet atomically at whole-unit consumption boundaries. The fixed-point remainder is accounting state, not fractional Fleet cargo, and must remain attached to the sailing phase across a future Child 06 plan revision.
- A later Child 05 Expedition may compose separate outbound and return sailing phases around a blocking objective. Each completed phase settles its own remainder; objective, Combat, and manual-decision wait time never advances the sailing ledger.
- Coincident boundaries use one stable order: Food unit, Water unit, Span/Edge position completion, then destination settlement. Arrival auto-restock therefore observes the final sailing consumption.
- v7 and earlier migration steps remain intact. The new v7-to-v8 step preserves already-deducted quantities and `supplyCost` through an explicit prepaid compatibility mode; it does not reconstruct or refund unavailable per-Supply historical cost basis.
- Planned compatibility Voyages may expose boundary position from their stored Edge timeline. Legacy-route compatibility Voyages have no legal Edge coordinates and therefore retain deterministic arrival-only resolution instead of inventing a mid-edge location.
- Invalid persisted anchors fail during save validation, and an invalid runtime transition returns the original state without partial Supply consumption, position movement, or Port settlement.

## Scope

### Included

- Persisted planned-Voyage position, boundary cursor, next-boundary, and sailing-consumption ledger.
- Fixed-point Food and Water accrual with whole-unit quantity and proportional cost-basis deduction.
- Explicit-time processing of Supply, SubRegion span, Edge, and arrival boundaries.
- Runtime next-boundary scheduling across activation, hydration, reload, clock rollback, and offline return.
- Schema v8 validation and prepaid migration for active historical Voyages.
- Existing Voyage status presentation of current resolved waters and consumed-versus-required Supplies.
- Focused determinism, migration, runtime, store, and component coverage plus the human navigation report.

### Excluded

- Expedition objectives, Adventure, Combat, Event interruption, or manual decision states.
- Diversion commands, reverse corridors, waypoints, or replacement of an active future route.
- Fractional Fleet Supply quantities, frame-based mutation, canonical ticks, or interval-count progression.
- A new underway nautical-chart interaction surface or final ship-position artwork.

## Files to Change

| File                                                  | Change Size | Purpose                                                                 |
| ----------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `src/core/model/game.ts`                              | Large       | Define persisted progress, position, consumption ledger, and schema v8. |
| `src/core/navigation/passage-planner.ts`              | Medium      | Share deterministic fixed-point rate and quoted-consumption semantics.  |
| `src/core/rules/voyage.ts`                            | Large       | Initialize and resolve ordered boundaries and actual Supply accounting. |
| `src/core/state/initial-game-state.ts`                | Small       | Stamp fresh worlds with schema v8.                                      |
| `src/runtime/game-runtime.ts`                         | Large       | Replace arrival-only wakeup with next-boundary scheduling.              |
| `src/platform/persistence/save-migrations.ts`         | Large       | Validate v8 and migrate active v7 Voyages without double consumption.   |
| `src/ui/dashboard/voyage/voyage-status-panel.tsx`     | Medium      | Expose resolved waters and consumed Supply totals.                      |
| `test/unit/passage-planner.test.ts`                   | Small       | Preserve quote totals under fixed-point consumption math.               |
| `test/unit/voyage.test.ts`                            | Large       | Prove boundary order, accounting parity, rollback, and offline results. |
| `test/unit/determinism.test.ts`                       | Medium      | Compare one-shot, incremental, and save/reload resolution.              |
| `test/unit/game-runtime.test.ts`                      | Medium      | Prove next-boundary scheduling and stale-timer safety.                  |
| `test/unit/use-game-store.test.tsx`                   | Medium      | Prove hydration and Strict Mode use the shared resolver exactly once.   |
| `test/unit/save-migrations.test.ts`                   | Large       | Cover v8 validation and prepaid/legacy migration.                       |
| `test/unit/dashboard.test.tsx`                        | Small       | Update Voyage fixtures and visible resolved accounting assertions.      |
| `dev/docs/reports/nautical_chart_navigation_map.html` | Small       | Add boundary progress and consumption ownership to the human overview.  |

## Execution Outline

1. Extend the canonical model and shared estimator math with snapshotted fixed-point consumption rates, a reusable sailing ledger, an exact position anchor, and deterministic boundary descriptions.
2. Change departure to initialize accruing progress without removing Supplies, then replace arrival-only resolution with an atomic loop that maps explicit scheduled time to simulation offset and applies every due boundary in stable order.
3. Add schema v8 validation and append the v7 migration, preserving active historical Voyages as prepaid and keeping topology-free legacy routes on the arrival-only compatibility path.
4. Generalize `GameRuntime` from one arrival timer to one next-boundary timer, retaining generation guards, hydration ownership, rollback rescheduling, and debounced persistence.
5. Update the existing underway status surface to distinguish quoted, consumed, and current resolved-water information while leaving smooth percentage and countdown derived.
6. Add focused planner, rule, migration, runtime, hook, determinism, and component scenarios; update the human report and run the required full verification without intermediate-child browser smoke.

## Implementation Notes

- Map scheduled time to simulation progress from the immutable `departedAt`, `plannedArrivesAt`, and planned duration endpoints so every pacing multiplier reaches the same simulation boundaries and exact final offset.
- Represent Supply remainder with an integer fixed-point scale. A long call may cross multiple whole-unit thresholds; subtract all completed units and retain only the remainder rather than replaying timer callbacks.
- Derive the next wake from the earliest future Food, Water, Span, Edge, or arrival boundary. Equal timestamps are processed by the stable boundary order, and repeated resolution at the same timestamp is a no-op.
- Position materialization distinguishes an exact node from an Edge plus simulation offset. Span and Edge cursors must agree with that position and the resolved offset; decorative chart geometry is not canonical position.
- Completing the committed phase flushes a non-zero final Supply remainder and asserts cumulative consumed quantities equal `requiredSupplies`. Future diversion replaces only untraveled route boundaries and must carry the unflushed ledger forward.
- Quiet Edge and SubRegion transitions do not create activity-feed entries. They are persisted progress facts for status, future Events, Expeditions, and diversion.

## Edge Cases

| Case                                     | Expected Handling                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Long offline return                      | One resolver call crosses all due boundaries once and produces the same state and costs as incremental calls.           |
| Exact coincident boundaries              | Food, Water, position completion, and arrival apply in the documented stable order with no duplicate effects.           |
| Clock rollback                           | State and anchor remain unchanged; runtime schedules from the existing next boundary against the corrected clock.       |
| Save/reload mid-edge                     | Anchor, cursor, remainder, and next boundary round-trip and continue without losing or repeating consumption.           |
| x1 versus x20                            | Real timestamps differ, while simulation position, total Supplies, cost basis, and boundary order remain equal.         |
| Zero Supply consumption rate             | No unit boundary is scheduled for that Supply and the quoted requirement remains zero.                                  |
| Migrated active planned Voyage           | Position boundaries continue, historical Supplies remain prepaid, and arrival does not deduct or refund them.           |
| Migrated legacy-route Voyage             | It resolves only its original arrival boundary and never fabricates Edge/SubRegion position.                            |
| Invalid persisted or runtime progress    | Load is recoverably rejected or resolution is an atomic no-op with an explicit error; no partial cost or arrival lands. |
| Future diversion before a unit threshold | Completed sailing remainder survives replacement of the old future and contributes to the next Supply threshold.        |
| Future objective or decision pause       | The finalized outbound phase stays immutable and no new sailing consumption accrues until a return phase begins.        |

## Acceptance Criteria

1. Equal snapshot, pacing, seed, and explicit time produce the same canonical node or mid-edge position, current waters, Food, Water, and cost basis online, offline, and after reload.
2. Food and Water remain whole Fleet units while fixed-point elapsed-time remainder survives intermediate resolution and future route replacement without free or duplicated sailing.
3. One-shot and incremental resolution cross Supply, Span, Edge, and arrival boundaries in the same stable order and apply each effect at most once.
4. Departure verifies the full quoted requirement without consuming it immediately; completing the unchanged fixed transfer consumes exactly that quote and reports the same final Supply cost basis as before.
5. Smooth countdown and percentage remain derived presentation, while visible resolved waters and consumed-versus-required Supplies come from canonical progress.
6. Only actual destination entry settles Market, progression, auto-restock, activity, and docked operations, after final sailing consumption.
7. Existing active saves migrate without Supply refunds or double charges, while invalid anchors and obsolete topology fail recoverably without partial mutation.
8. Runtime scheduling uses only the resolver's next boundary as a wakeup and remains deterministic across activation, Strict Mode remount, stale timers, clock rollback, and long offline elapsed time.
