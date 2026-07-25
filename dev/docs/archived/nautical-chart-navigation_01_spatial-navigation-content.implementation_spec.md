# Nautical Chart Navigation 01 — Spatial Navigation Content, Planner, And Chart Inspector

Parent Plan: `nautical-chart-navigation.md`

## Goal

Replace the three direct-route records' monopoly on world shape with an authored, validated navigation graph — Regions, SubRegions, Ports at chart positions, hidden navigation points, and weighted directed edges — plus the deterministic passage planner and shared estimator that quote any Port-to-Port journey. A dev-only chart inspector at `/debug/chart` renders the authored world and previews planned passages so content can be verified visually before any Voyage execution changes.

## Summary

Content gains Region, SubRegion, navigation-point, and directed-edge records alongside the existing Ports; catalog validation extends to graph integrity. A pure planner (directed Dijkstra with deterministic tie-breakers) and a single estimator produce Port-to-Port passage quotes from Fleet speed and content-owned constants. Nothing in Voyage execution changes: `ROUTES`, `departVoyage`, and the persisted `Voyage` payload stay untouched until Child 02 adopts the quote at departure.

Fleet speed becomes canonical Fleet state, fixed at 100 for now. Durations move to normal-play scale (20× the legacy debug-scale route durations) under the approved 2026-07 rebalance; the harness owns a 20× debug time scale so debug play and tests keep the legacy 2–5 second pacing. The chart inspector shows both scales on every quote.

## Relational Context

- `src/content/*-definitions.ts` modules are plain authored data re-exported through `src/content/content-catalog.ts`; the graph follows the same pattern and joins `WORLD_CONTENT` as lookups.
- `src/core/content/world-content.ts` owns the shapes core understands; Region, SubRegion, navigation point, and edge types are defined there and authored in content, preserving the core-never-imports-content rule.
- `src/content/catalog-validation.ts` is the test-time integrity gate; graph validation extends it with new diagnostic codes and keeps the existing Route checks until Child 02 retires direct routes.
- `Fleet` in `src/core/model/game.ts` is persisted state; adding `speed` requires an initial-state value and a save-schema migration in `src/platform/persistence/save-migrations.ts`.
- `src/app/debug/debug-tools.tsx` is the dev-tool registry (its comment already reserves `/debug/chart`); tools lazy-load and tree-shake out of production.
- The planner and estimator are pure core functions consumed later by Child 02's departure command and Child 03's Harbor chart; the inspector is their first consumer.

## Authored World Baseline

Approved balance decision (2026-07-25): distances are re-authored on the graph, normal-play durations are 20× the legacy route durations, and Supplies re-derive from a consumption formula. The debug time scale (20×) preserves the legacy 2–5 s observed pacing.

Formulas, with `TIME_PER_DISTANCE_UNIT_MS = 200_000` and Fleet speed 100:

```text
edge duration (unrounded) = edge distance / speed × traversal modifier × TIME_PER_DISTANCE_UNIT_MS
passage duration          = round-half-up(sum of unrounded edge durations)
required Supply           = ceil(passage duration in seconds × rate)   // food 0.02/s, water 0.02/s
risk summary              = 1 - product(1 - edge static risk)
debug-observed duration   = passage duration / DEBUG_TIME_SCALE       // DEBUG_TIME_SCALE = 20
```

Nodes — Ports keep their ids; navigation points are new:

| Node               | Kind            | Notes                                    |
| ------------------ | --------------- | ---------------------------------------- |
| `lisbon-approach`  | harbor-approach | Approach for Lisbon                      |
| `faro-approach`    | harbor-approach | Approach for Faro; through traffic legal |
| `tangier-approach` | harbor-approach | Approach for Tangier                     |
| `cape-st-vincent`  | headland        | Junction between Lisbon and Faro waters  |

Regions formalize the existing Port `regionId` strings: `iberian-atlantic` (Iberian Atlantic), `maghreb-coast` (Maghreb Coast). SubRegions: `tagus-approaches` and `algarve-coast` under `iberian-atlantic`; `gibraltar-approaches` under `maghreb-coast`.

Edges (each authored as a directed pair; berth edges connect a Port to its approach and carry zero risk):

| Edge                                  | Distance | Static risk | SubRegion spans                          |
| ------------------------------------- | -------- | ----------- | ---------------------------------------- |
| `lisbon` ⇄ `lisbon-approach`          | 2        | 0           | tagus-approaches 2                       |
| `lisbon-approach` ⇄ `cape-st-vincent` | 8        | 0.05        | tagus-approaches 4, algarve-coast 4      |
| `cape-st-vincent` ⇄ `faro-approach`   | 8        | 0.05        | algarve-coast 8                          |
| `faro-approach` ⇄ `tangier-approach`  | 28       | 0.11        | algarve-coast 8, gibraltar-approaches 20 |
| `faro` ⇄ `faro-approach`              | 2        | 0           | algarve-coast 2                          |
| `tangier` ⇄ `tangier-approach`        | 2        | 0           | gibraltar-approaches 2                   |

Resulting passages (the parity table tests must pin):

| Passage          | Distance | Duration | Debug-observed | Food | Water | Risk summary | Legacy route          |
| ---------------- | -------- | -------- | -------------- | ---- | ----- | ------------ | --------------------- |
| Lisbon ⇄ Faro    | 20       | 40 s     | 2 s            | 1    | 1     | ≈ 0.0975     | 20 / 2 s / 1,1 / 0.1  |
| Faro ⇄ Tangier   | 32       | 64 s     | 3.2 s          | 2    | 2     | 0.11         | 35 / 4 s / 2,1 / 0.15 |
| Lisbon ⇄ Tangier | 48       | 96 s     | 4.8 s          | 2    | 2     | ≈ 0.1968     | 50 / 5 s / 2,2 / 0.2  |

Lisbon ⇄ Tangier traverses `faro-approach` without entering Faro, so the core world itself exercises the pass-nearby-without-docking guarantee.

Chart positions use an abstract 0–1000 × 0–1000 space (y down), roughly geographic; starting values (tune visually in the inspector): lisbon (280, 220), lisbon-approach (240, 280), cape-st-vincent (250, 520), faro (430, 560), faro-approach (420, 620), tangier (620, 840), tangier-approach (600, 780). Edge polyline geometry is optional presentation metadata; a straight line between node positions is the default.

## Scope

### Included

- Region, SubRegion, ChartPosition, NavPoint, and NavEdge contracts in core; authored records in content; graph lookups on `WorldContent`.
- Port chart positions and SubRegion membership.
- Graph validation diagnostics in `catalog-validation.ts`.
- Deterministic passage planner and shared estimator as pure core functions with focused tests, including the pinned parity table.
- `Fleet.speed` (initial 100) with save-schema migration.
- `TIME_PER_DISTANCE_UNIT_MS`, Supply consumption rates, and `DEBUG_TIME_SCALE = 20` as owned constants; a `createScaledClock` harness helper for later wiring.
- The `/debug/chart` inspector: full-graph SVG rendering, validation diagnostics display, and origin/destination quote preview at both time scales.

### Excluded

- Any change to `ROUTES`, `departVoyage`, `resolveVoyage`, the persisted `Voyage` payload, or the Harbor UI; legacy routes continue to drive actual sailing until Child 02.
- Wiring the scaled clock into playable debug flow or persistence (Child 02, when Voyages run on the planner).
- Region unlock semantics, locked-edge legality beyond destination knowledge, mission content, and dynamic conditions.
- Production chart rendering, accessibility interaction, and responsive layout (Child 03).

## Files to Change

| File                                           | Change Size | Purpose                                                                                                 |
| ---------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `src/core/content/world-content.ts`            | Medium      | Region/SubRegion/NavPoint/NavEdge/ChartPosition types; Port additions; graph lookups on `WorldContent`. |
| `src/content/region-definitions.ts` (new)      | Small       | Authored Regions and SubRegions.                                                                        |
| `src/content/navigation-definitions.ts` (new)  | Medium      | Nav points, directed edges, time and consumption constants.                                             |
| `src/content/port-definitions.ts`              | Small       | Chart positions and SubRegion membership.                                                               |
| `src/content/content-catalog.ts`               | Small       | Re-exports and `WORLD_CONTENT` graph lookups.                                                           |
| `src/content/catalog-validation.ts`            | Large       | Graph integrity diagnostics.                                                                            |
| `src/core/navigation/passage-planner.ts` (new) | Medium      | Directed Dijkstra, traversal legality, tie-breakers, quote estimation.                                  |
| `src/core/model/game.ts`                       | Small       | `Fleet.speed`; schema version bump.                                                                     |
| `src/core/state/initial-game-state.ts`         | Small       | Initial speed 100.                                                                                      |
| `src/platform/persistence/save-migrations.ts`  | Small       | Migrate prior saves by filling speed 100.                                                               |
| `src/harness/harness-clock.ts`                 | Small       | `DEBUG_TIME_SCALE` and `createScaledClock`.                                                             |
| `src/app/debug/debug-tools.tsx`                | Small       | Register `/debug/chart`.                                                                                |
| `src/app/debug/chart-inspector.tsx` (new)      | Medium      | SVG graph inspector with quote preview and diagnostics panel.                                           |
| `test/unit/content.test.ts`                    | Medium      | Graph validation coverage; shipped content passes clean.                                                |
| `test/unit/passage-planner.test.ts` (new)      | Medium      | Determinism, legality, tie-breakers, parity table.                                                      |
| `test/unit/save-migrations.test.ts`            | Small       | Speed backfill migration.                                                                               |

## Execution Outline

1. Define the graph contracts in core, author the baseline world in content, and extend `WORLD_CONTENT`.
2. Scaffold the `/debug/chart` inspector early — render Ports, nav points, edges, and labels from authored content so positions and topology are visually checkable while the rest lands.
3. Extend catalog validation with the graph diagnostics and surface them in the inspector's diagnostics panel.
4. Implement the planner and estimator with the deterministic cost model; add the parity, legality, and tie-breaker tests.
5. Add the origin/destination quote preview (both time scales, per-edge breakdown) to the inspector.
6. Add `Fleet.speed`, the initial-state value, and the save migration; land the harness constants; run the repository verification suite.

## Implementation Notes

- Ports and navigation points share one graph-node id namespace. A Port node is terminal by rule, not by flag: the planner may include a Port node only as the passage origin or final destination, which is what makes berth edges un-transitable for through traffic.
- Planner cost ordering is unrounded duration, then total distance, then the ordered edge-id sequence compared lexicographically. Rounding happens once, in the estimator, over the summed unrounded durations.
- Traversal legality in this child: the destination Port must be in `world.knownPortIds`; intermediate sea nodes need no knowledge; Region unlock legality is deferred until unlock state exists (V5 Core 07) and must be noted as an input seam on the planner signature.
- The estimator takes speed as an input rather than reading state, so Child 02 can call it against canonical Fleet state and the inspector can call it with 100.
- Validation additions (each with a stable code and offending entry): duplicate region/subregion/nav-point/edge ids, unknown edge endpoints, non-positive distance, risk outside [0,1], non-positive traversal modifier, span SubRegion unknown, span distances not summing to edge distance, SubRegion parent Region unknown, Port SubRegion unknown, Port chart position missing or out of bounds, Port without exactly one berth edge pair to a harbor-approach point, berth edges connecting anything other than a Port and its approach, and any known Port with no legal graph path from the starting Port. Existing Route diagnostics stay.
- The inspector imports content and core directly (dev-only tool; the registry lazy-loads it, keeping it out of the production bundle) and holds no game runtime, store, or persisted state. Selection is local component state.
- Show hidden topology honestly in the inspector: node kind shapes, directed-pair edges as one line with distance/risk labels, SubRegion span boundaries as tick marks or colored segments, and the current diagnostics list — this tool is also the authoring feedback loop for tuning chart positions.
- `createScaledClock(base, factor)` wraps a `Clock` so simulated time advances `factor`× real elapsed time. It lands with tests but is not yet wired into `/debug/game`; the interaction between scaled timestamps and persisted saves is Child 02's problem.

## Edge Cases

| Case                                                | Expected Handling                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| Equal-duration candidate paths                      | Distance then edge-id-sequence tie-breakers pick one stable path.               |
| Destination unknown, unauthored, or equal to origin | Explicit denial with a reason; never a partial or approximate quote.            |
| Only path would transit an intermediate Port berth  | That candidate is illegal; if no legal path remains, the quote is a denial.     |
| Span distances disagree with edge distance          | Content validation failure naming the edge.                                     |
| Port with zero or multiple approach connections     | Content validation failure naming the Port.                                     |
| Known Port unreachable through the graph            | Content validation failure naming the Port.                                     |
| Prior-version save without `fleet.speed`            | Migration fills 100; hydration accepts the migrated save.                       |
| Rounding half-up at the passage level               | Applied once over summed unrounded durations, so edge count cannot skew totals. |

## Acceptance Criteria

1. The authored baseline validates clean, and the parity-table test pins every passage's distance, duration, debug-observed duration, Food, Water, and risk summary exactly as specified above.
2. Equal planner inputs always produce the same ordered edge path and quote; tie-breaker and legality behavior is covered by focused tests, including Lisbon ⇄ Tangier traversing `faro-approach` without the Faro Port node.
3. Each authored-content failure class produces a named diagnostic with the offending entry, and every diagnostic renders in the inspector's panel.
4. `/debug/chart` renders all Ports, navigation points, edges, and SubRegion context from authored data and previews a selected passage with per-edge breakdown at normal and debug time scales; the production bundle does not grow.
5. New games start with Fleet speed 100, prior saves migrate to it, and Voyage execution, Harbor UI, and e2e behavior are unchanged in this child.
6. `npm run verify` passes.
