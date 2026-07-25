# Nautical Chart Navigation 02 — Passage Planning And Voyage Contract

Parent Plan: `nautical-chart-navigation.md`

## Goal

Make the deterministic passage planner authoritative for real Voyage departure and persistence while preserving offline-safe, exactly-once destination settlement. Establish a snapshotted Voyage pacing seam so wait time can be compressed without changing passage economics, risk, path, or deterministic outcomes.

## Summary

Harbor departure will stop selecting authored direct `Route` records. It will preview known Port destinations through the Child 01 planner and shared estimator, then submit the destination and displayed quote identity; the domain recomputes the quote from current canonical state and rejects stale, unreachable, locked, or under-provisioned requests atomically.

A successful departure will consume Food, Water, and their acquisition cost basis exactly once, then persist an immutable ordered passage snapshot. The snapshot owns resolved edge and SubRegion boundary offsets, aggregate distance, simulation duration, Supply requirements, static risk, seed, and arrival schedule, so an active Voyage never depends on later graph or balance changes. Passing another Port's harbor approach remains traversal only; only the committed destination invokes Port settlement.

Voyage pacing is separate from simulation. The base `simulationDuration` continues to drive Supplies and future event/boundary calculations, while `scheduledDuration = max(1, round(simulationDuration / pacingMultiplier))` controls only player wait and boundary timestamps. The multiplier defaults to `1`, is snapshotted at departure, and does not change an active Voyage if a future Difficulty setting changes. No production Settings UI is added here. `/debug/game?timeScale=20` exercises the same departure contract with multiplier `20` in an ephemeral save-isolated runtime; scenario harness clocks remain unchanged.

Persistence advances to schema version 6. Existing active Voyages retain their persisted endpoints, timestamps, risk, requirements, Supply cost basis, and seed in an explicit legacy immutable snapshot rather than being rerouted through current graph content. Known valid legacy route identities migrate deterministically; unknown or inconsistent active payloads remain recoverably corrupt. Once migration and callers use passage snapshots, the legacy direct-route catalog and its validation authority are removed.

## Relational Context

- `HarborPanel` reads destination previews from `useGameStore`; it must not import graph content, direct routes, or reproduce estimation formulas.
- `GameRuntime` supplies the configured pacing multiplier, exposes previews, obtains the secure seed, and dispatches departure; core Voyage rules remain the authority for recomputation, stale-quote rejection, atomic Supply deduction, and snapshot construction.
- Preview and departure both call the Child 01 planner and estimator against canonical Fleet location, speed, known Ports, and world content. The UI quote is evidence for stale detection, never trusted authority.
- `simulationDuration` owns passage economics and deterministic simulation offsets. `scheduledDuration` owns wall-clock waiting only; scaling the global `Clock`, Supply rates, risk, edge order, or event inputs is the wrong shape.
- Arrival scheduling continues to compare `plannedArrivesAt` with the runtime clock, and resolution continues to call destination Port settlement exactly once. It never reloads the graph to finish an active Voyage.
- The persisted passage snapshot is the single owner of Voyage path and aggregate quote data. New Voyages store planned ordered edges; migrated Voyages use a legacy aggregate variant without inventing an edge path.
- Save migration validates legacy identity and endpoint/totals consistency against frozen compatibility data, not the mutable navigation catalog. Invalid active payloads follow the existing recoverable-corruption path.
- Production runtime defaults to pacing `1`. Exact supported debug time-scale flags create an ephemeral runtime with the same system clock and Voyage rules; scenario harnesses retain their explicit manual clock.

## Scope

### Included

- Planner-backed destination previews and atomic departure revalidation.
- Immutable planned and legacy Voyage snapshot contracts.
- Voyage-only snapshotted pacing and isolated debug `timeScale=20`.
- Schema-v6 active-Voyage migration and retirement of direct `Route` authority.
- Focused UI, persistence, determinism, runtime scheduling, and documentation updates.

### Excluded

- Production Difficulty/Settings UI or persistence for a selected multiplier.
- Nautical-chart departure redesign, path animation, or final Harbor interaction.
- Intermediate Event/boundary resolution, dynamic route preferences, or Fleet upgrades.
- Changes to Market, progression, restock, or destination settlement semantics.

## Files to Change

| File                                                  | Change Size | Purpose                                                                                                                          |
| ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/model/game.ts`                              | Medium      | Define the immutable passage snapshot variants and schema-v6 Voyage shape.                                                       |
| `src/core/rules/voyage.ts`                            | Large       | Own preview, quote identity, departure revalidation, pacing derivation, Supply commitment, and snapshot-based resolution inputs. |
| `src/core/content/world-content.ts`                   | Small       | Remove the legacy direct-route content contract.                                                                                 |
| `src/content/content-catalog.ts`                      | Medium      | Remove direct-route exports/lookups and retain navigation content as the sole routing source.                                    |
| `src/content/catalog-validation.ts`                   | Medium      | Remove route diagnostics and validate only the navigation graph authority.                                                       |
| `src/content/route-definitions.ts`                    | Delete      | Retire authored direct routes after migration compatibility is local to persistence.                                             |
| `src/runtime/game-runtime.ts`                         | Medium      | Configure Voyage pacing, expose previews, dispatch quote-checked departure, and preserve arrival scheduling.                     |
| `src/runtime/use-game-store.ts`                       | Medium      | Expose destination preview/departure and pass runtime pacing options.                                                            |
| `src/ui/dashboard/city-actions/harbor-panel.tsx`      | Medium      | Keep the existing cards while replacing direct routes with known-destination previews.                                           |
| `src/ui/dashboard/voyage/voyage-status-panel.tsx`     | Small       | Read display totals from the immutable snapshot.                                                                                 |
| `src/ui/dashboard/scene/port-scene-panel.tsx`         | Small       | Read underway risk and endpoints from the snapshot.                                                                              |
| `src/platform/persistence/save-migrations.ts`         | Large       | Add schema-v6 validation and deterministic legacy active-Voyage migration.                                                       |
| `src/app/debug/scenario-testbed.tsx`                  | Medium      | Add save-isolated `timeScale=20` ordinary debug play without changing scenarios.                                                 |
| `src/harness/harness-clock.ts`                        | Small       | Remove the competing global scaled-clock helper while retaining the debug scale constant.                                        |
| `src/harness/scenarios/mid-voyage.scenario.ts`        | Small       | Construct the current immutable Voyage snapshot shape.                                                                           |
| `test/unit/*.test.ts(x)`                              | Large       | Update affected fixtures and cover quote, pacing, migration, runtime, content, UI, and determinism behavior.                     |
| `dev/docs/reports/nautical_chart_navigation_map.html` | Small       | Update the human overview from future Child 02/direct routes to the landed contract.                                             |

## Execution Outline

1. Introduce the snapshot model and pure passage-preview/departure contract, then pin quote parity, stale rejection, pacing separation, Supply cost basis, and immutable copied inputs with focused core tests.
2. Add schema-v6 migration and validation using frozen legacy compatibility data; prove valid in-flight Voyages preserve their saved contract and malformed ones remain recoverable.
3. Wire runtime and store previews/departure around the new contract, preserving timer generation cancellation, hydration, reload, rollback, and exactly-once arrival behavior.
4. Rewire the existing Harbor cards and underway panels to snapshot-backed data, then update UI and scenario fixtures without introducing the Child 03 chart redesign.
5. Add isolated debug pacing, remove the global scaled-clock path, and prove x1 versus x20 changes only scheduled timestamps.
6. Remove direct-route content and validation after all callers migrate, update the human report, and run the repository verification contract.

## Implementation Notes

- Build a stable quote identity from canonical passage inputs and computed output; do not include presentation formatting. Departure recomputes and compares it before any mutation.
- Resolve ordered edge records into immutable simulation end offsets, including identity, endpoints, static risk, and SubRegion boundary offsets. Do not persist distance, traversal modifier, or effective Fleet speed as competing formula inputs; aggregate display distance and simulation duration remain on the passage snapshot.
- Apply pacing only after the estimator returns its rounded base duration. Use positive round-half-up semantics and a one-millisecond minimum for the scheduled duration.
- A legacy snapshot records the saved direct-route identity and preserved aggregate values with pacing `1`; unavailable historical distance/path data remains absent rather than inferred.
- Changing runtime pacing affects only later departures because each Voyage stores its applied multiplier and scheduled duration.
- Recognize only the supported debug value `20`. With no scenario and that flag, use a fresh initial state and production system clock without IndexedDB hydration; without the flag, preserve the current persistent x1 dashboard; scenario mode ignores it.

## Edge Cases

| Case                                                                  | Expected Handling                                                                                              |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Fleet state, knowledge, Supplies, or legal path changes after preview | Departure rejects the stale quote without consuming anything.                                                  |
| Passage crosses another Port approach                                 | Traversal continues; no Market, XP, restock, or docked transition occurs there.                                |
| Pacing changes while underway                                         | The active Voyage keeps its snapshotted multiplier and arrival timestamp.                                      |
| Clock is before departure or exactly at arrival                       | Rollback does not resolve; the exact arrival boundary resolves once.                                           |
| Reload or long offline interval crosses arrival                       | The same snapshot resolves destination settlement exactly once.                                                |
| Valid legacy Voyage references old route content                      | Its saved aggregate contract finishes unchanged without graph lookup.                                          |
| Unknown or internally inconsistent legacy active Voyage               | Migration rejects it through recoverable corruption handling.                                                  |
| `timeScale=20` is used in ordinary debug play                         | Wait is compressed to one twentieth while path, Supplies, risk, seed inputs, and simulation duration match x1. |

## Acceptance Criteria

1. Preview and departure produce the same deterministic fastest legal passage from equal canonical state, and stale or invalid requests fail atomically with an explicit reason.
2. New departures persist an immutable ordered passage snapshot and consume required Food, Water, and acquisition cost basis exactly once.
3. x1 and x20 departures retain identical path, simulation duration, Supplies, risk, and deterministic inputs; only scheduled timestamps differ, and an active Voyage is unaffected by later pacing changes.
4. Passing a harbor approach never enters its Port; only the committed destination performs Market transition, progression, arrival restocking, and docked operations.
5. Existing valid active Voyages preserve their saved endpoints, timing, requirements, risk, Supply cost, seed, and exactly-once arrival across schema migration.
6. Foreground timers, reload, clock rollback, exact arrival, and long offline return continue through one explicit-time resolver with equivalent results.
7. Direct `Route` content is no longer a live quoting or departure authority.
8. `/debug/game?timeScale=20` uses the production Voyage contract in isolated ephemeral state, while normal debug play remains persistent x1 and scenarios retain manual clocks.
