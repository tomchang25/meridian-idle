# Nautical Chart Navigation 04 — Boundary Progress And Sailing Consumption Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore canonical advancement through resolved edge and SubRegion boundaries, including actual-traversal Supply consumption, so later Expedition and diversion work can materialize a deterministic node or mid-edge position without introducing ticks.

## Summary

The current fixed Voyage has one departure and arrival boundary, deducts its full baseline Supplies at departure, and derives all underway display progress from two timestamps. This child preserves derived animation but introduces a persisted resolution anchor only when gameplay crosses a meaningful boundary or a command needs an exact current position.

The likely resolver advances explicit time through ordered sailing boundaries, deducts Food, Water, and cost basis from actual resolved sailing time, and schedules only the next boundary. A quiet transfer may still resolve directly to arrival in one call. Mission objectives, Combat phases, return-route choice, and player diversion build on this foundation in later children.

## Sketch

- The resolved Passage timeline from Child 02a likely remains the immutable schedule for the active plan. Verify how its cumulative edge and SubRegion offsets map through the snapshotted pacing multiplier.
- Introduce a candidate resolution anchor containing the current node or edge, resolved sailing offset, edge/span cursor, explicit resolution time, and next scheduled boundary. Do not persist animation-frame interpolation.
- The shared resolver should clamp clock rollback and process every crossed edge, SubRegion, Supply, and arrival boundary in chronological order until reaching explicit `now` or a blocking state.
- Replace departure-time baseline consumption with deterministic actual-traversal consumption. Compute the delta between cumulative consumption at the old and new sailing offsets so one long-offline call and many short calls consume identical quantity and proportional acquisition cost basis.
- Departure may continue to require enough Food and Water for a committed fixed transfer as a readiness rule, but quantity and cost basis should leave the Fleet only as sailing resolves. The later Expedition child owns reserve policy across an unknown return choice.
- Runtime scheduling, visibility resume, hydration, reload, and offline return should all call the same resolver. Browser timers wake work but do not define elapsed time or boundary count.
- Destination entry remains one atomic final boundary after every earlier sailing consumption and position transition. Passing a harbor approach never settles its Port.
- Save validation should cover ordered offsets, cursor coherence, monotonic resolution anchors, cumulative consumption, next-boundary timing, and destination legality.
- Tests should compare direct arrival, many incremental resolutions, save/reload between edges and spans, exact-boundary calls, clock rollback, one-shot offline return, and x1/x20 pacing.

### Candidate files to inspect

- `src/core/model/game.ts`
- `src/core/rules/voyage.ts`
- `src/core/rules/cargo.ts`
- `src/core/navigation/passage-planner.ts`
- `src/runtime/game-runtime.ts`
- `src/runtime/use-game-store.ts`
- `src/platform/persistence/save-migrations.ts`
- `src/ui/dashboard/voyage/use-voyage-clock.ts`
- `src/ui/dashboard/voyage/voyage-status-panel.tsx`
- `test/unit/voyage.test.ts`
- `test/unit/game-runtime.test.ts`
- `test/unit/use-game-store.test.tsx`
- `test/unit/save-migrations.test.ts`

## Non-Goals

1. Canonical hourly ticks, interval-count progression, or persisted animation-frame position.
2. Expedition objectives, mission-site availability, Adventure duration, or Combat rules.
3. Player-selected return routes, mid-edge reversal, waypoints, or plan revisions.
4. Nautical-chart interaction redesign beyond exposing the resolved progress state.

## Acceptance Criteria

1. Equal snapshot, pacing, seed, and explicit time produce the same node or mid-edge position and actual sailing Supply consumption online and offline.
2. Quiet transfers may resolve directly to arrival, while crossed edge and SubRegion boundaries apply in chronological order and at most once.
3. One-shot and incremental resolution consume equal Food, Water, and cost basis without depending on timer or frame counts.
4. Smooth chart position remains derived presentation, while gameplay commands can materialize an exact deterministic position anchor.
5. Only actual destination entry settles Market, progression, restock, and docked operations.
6. Invalid progress anchors and obsolete timelines fail recoverably without partial consumption or arrival.
