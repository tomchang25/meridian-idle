# Nautical Chart Navigation 02 — Passage Planning And Voyage Contract Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore deterministic pathfinding, aggregate passage estimation, departure validation, and the persisted Voyage transition from one authored direct route to an ordered edge path. This child must preserve current Port settlement, Supply accounting, explicit-time arrival, and old active-save recovery while preventing intermediate Port entry.

## Summary

The current Harbor selects one directed `Route` ID, and departure copies its aggregate endpoints, duration, risk, and Food／Water requirement into a persisted Voyage. The likely replacement derives a transient passage quote from canonical Fleet, world, and graph content, then snapshots the selected ordered path and all mutable resolution inputs when departure succeeds.

The route planner should choose fastest legal duration with deterministic tie-breakers. Voyage remains a finite explicit-time operation; this child does not introduce an hourly mutation loop or a second online-only simulation path.

## Sketch

- `game/domain/content/core-content.ts` currently exposes global `ROUTES` and a linear `getRoute`. The candidate planner should query the graph by stable node and edge identities and expose Port-to-Port passage quotes rather than presentation filtering raw content.
- Candidate pathfinding is directed Dijkstra or A* with estimated duration as the primary cost, total distance as the secondary cost, and stable edge identity as the final tie-break. Verify that any heuristic is admissible under authored traversal modifiers; otherwise prefer Dijkstra for deterministic simplicity.
- Legal traversal should account for destination knowledge, Region unlocks, edge availability, and terminal Port topology. Unknown intermediate sea points are allowed; locked sea content and intermediate Port berths are not.
- The quote should contain origin, destination, ordered edges, aggregate distance, duration, mandatory Food and Water, static-risk summary, traversed SubRegion narrative, and one disabled reason derived from canonical state.
- The current content ledger derives duration from distance and Fleet speed, while live code stores route duration directly and has no Fleet speed field. The implementation spec must verify the final Fleet-speed owner after V5 Core lands and preserve converted Core quotes through one shared estimator rather than retaining two authorities.
- Mandatory Food and Water should be derived from quoted duration and content-owned Fleet consumption rates, rounded once per Supply for the full passage. Departure continues to consume quantity and weighted acquisition cost basis atomically before persisting the Voyage.
- `departVoyage` currently accepts a route ID and revalidates the latest state. The candidate command may accept a destination identity or a quote identity, but domain departure must recompute the deterministic path from current canonical state and reject a stale or changed quote rather than trusting UI totals.
- The candidate Voyage snapshot should copy origin, planned destination, ordered edge identities, edge timing and risk inputs, SubRegion spans, aggregate requirements, timestamps, and seed. It must not depend on mutable graph content to complete an already-started Voyage.
- Current active saves persist one of six direct route IDs with aggregate totals. A schema migration must either map each known ID to the converted edge path while preserving all copied values or retain a legacy immutable passage representation that can finish exactly once. Unknown or inconsistent payloads remain recoverably corrupt; they must not be rerouted using current shortest-path content.
- `resolveVoyage` and `settlePortEntry` currently make arrival idempotent and reserve Market transition for the destination. Preserve that seam: sea points and SubRegion transitions never call Port settlement.
- Focused tests should cover deterministic tie-breaking, one-way edges, locked Regions, unreachable known Ports, same-SubRegion unequal distances, passing an intermediate Port approach, quote-versus-command parity, atomic Supply cost basis, snapshot immutability, migrated active Voyages, and exact-versus-long-offline arrival.

### Candidate files to inspect

- `game/domain/content/core-content.ts`
- `game/domain/models/game.ts`
- `game/domain/rules/voyage.ts`
- `game/domain/rules/cargo.ts`
- `game/domain/rules/progression.ts`
- `game/application/use-game-store.ts`
- `game/infrastructure/persistence/save-migrations.ts`
- `test/unit/content.test.ts`
- `test/unit/voyage.test.ts`
- `test/unit/progression.test.ts`
- `test/unit/save-migrations.test.ts`
- `test/unit/use-game-store.test.tsx`

## Non-Goals

1. Nautical-chart rendering or Harbor interaction changes.
2. Sailing Event, Combat, diversion, delay, or manual at-sea decision implementation beyond preserving their established Voyage extension seam.
3. Dynamic route preferences, safest-route selection, player-authored waypoints, or automatic Trade Routes.
4. Incremental per-hour Supply mutation or browser timer counts as canonical elapsed time.

## Acceptance Criteria

1. Equal state and graph content always produce the same fastest legal ordered edge path and aggregate quote.
2. Montpellier-versus-Marseille-style starts retain different totals even when their paths later share edges and SubRegions.
3. Passing a harbor approach never enters its Port; only the planned destination performs Market transition, progression, arrival restocking, and docked operations.
4. Preview and departure use one estimator, and stale, unreachable, locked, under-provisioned, or malformed passages fail atomically with an explicit reason.
5. Departure persists an immutable passage snapshot and deducts committed Food, Water, and cost basis exactly once.
6. Existing valid active Voyages migrate or finish with their original endpoints, timing, requirements, risk, and exactly-once settlement; invalid payloads remain recoverable.
7. Foreground and long-offline arrival retain the established deterministic explicit-time and replay-idempotency guarantees.
