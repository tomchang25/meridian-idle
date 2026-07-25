# Nautical Chart Navigation 02a — Passage Contract Cleanup Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Tighten the fixed Port-transfer contract delivered by Child 02 so its persisted names and ownership remain clear when later children add boundary progress, incremental consumption, Expeditions, and diversion.

## Summary

Child 02 correctly makes the graph-derived passage authoritative, but its persisted aggregate still carries a scheduled duration already encoded by Voyage timestamps, and its simulation-duration name can be mistaken for total Expedition time. This cleanup keeps the current player experience and departure-time Supply commitment unchanged while making Passage mean sailing only.

The favored shape retains the resolved edge and SubRegion simulation offsets, renames the aggregate to planned sailing duration, moves scheduled duration to the transient preview, and expresses mandatory Food and Water directly. Later children can then replace fixed-transfer commitment with actual-traversal consumption without treating mission, Combat, or player-decision time as edge sailing.

## Sketch

- The current passage snapshot likely needs `simulationDurationMilliseconds` renamed to `plannedSailingDurationMilliseconds`; verify every persisted validator, quote identity, migration, and display consumer before finalizing the name.
- `scheduledDurationMilliseconds` is likely redundant in persisted Passage state because departure and planned-arrival timestamps preserve the applied wait interval. Keep it in the transient preview so the Harbor can display and quote pacing before departure.
- Keep the snapshotted pacing multiplier because later boundary scheduling must map sailing offsets to player wait time without changing an active plan when Difficulty changes.
- Replace the indirect Food／Water mapped type with an explicit two-field shape. Medicine, Munitions, and Spares remain Fleet Supplies but are not baseline sailing requirements in this child.
- Preserve Child 02 behavior: a fixed Port transfer validates and deducts its full Food, Water, and proportional acquisition cost basis atomically at departure. Document this as the current transfer commitment policy, not the future Expedition consumption model.
- The schema-v6 validator should prove the final edge offset equals planned sailing duration and that Voyage timestamps are monotonic. It should not persist or recompute a duplicate scheduled-duration field.
- The existing valid version-5 active-Voyage migration should preserve its historical timestamps, Supply requirement, cost basis, risk, and legacy identity without inventing edge history.
- Focused tests should prove unchanged x1/x20 path economics, timestamp-derived waiting, atomic commitment, legacy migration, and rejection of malformed edge timelines.

### Candidate files to inspect

- `src/core/model/game.ts`
- `src/core/rules/voyage.ts`
- `src/platform/persistence/save-migrations.ts`
- `src/runtime/game-runtime.ts`
- `src/ui/dashboard/city-actions/harbor-panel.tsx`
- `src/ui/dashboard/voyage/voyage-status-panel.tsx`
- `test/unit/voyage.test.ts`
- `test/unit/save-migrations.test.ts`
- `test/unit/dashboard.test.tsx`
- `dev/docs/reports/nautical_chart_navigation_map.html`

## Non-Goals

1. Incremental at-sea Supply consumption or shortages.
2. Canonical edge position, boundary iteration, manual pauses, or Event resolution.
3. Expedition objectives, Combat lifecycle, return-route choice, or mid-edge diversion.
4. Harbor or nautical-chart interaction redesign.

## Acceptance Criteria

1. Fixed Port transfers retain the same path, risk, Supply requirement, cost basis, pacing, and exactly-once arrival behavior.
2. Persisted Passage duration describes sailing only, and the active wait interval is represented once by Voyage timestamps.
3. Equal sailing simulation produces equal economics at x1 and x20 while only the timestamp-derived player wait differs.
4. Existing valid active saves retain their historical contract, and malformed timelines fail recoverably.
