# Nautical Chart Navigation 02 — Voyage Contract And Migration Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore moving Voyage departure, the persisted snapshot, and old active-save recovery from one authored direct route onto the ordered edge path quoted by the Child 01 planner. This child must preserve current Port settlement, Supply accounting, explicit-time arrival, and old active-save recovery while preventing intermediate Port entry.

## Summary

Child 01 ships the deterministic planner and shared estimator; this child makes them authoritative for actual sailing. The current Harbor selects one directed `Route` ID, and departure copies its aggregate endpoints, duration, risk, and Food／Water requirement into a persisted Voyage. The likely replacement derives a transient passage quote from canonical Fleet, world, and graph content, then snapshots the selected ordered path and all mutable resolution inputs when departure succeeds.

Voyage remains a finite explicit-time operation; this child does not introduce an hourly mutation loop or a second online-only simulation path. With Voyages running on the planner, the harness debug time scale from Child 01 (`DEBUG_TIME_SCALE = 20`) can be wired into debug play, resolving its interaction with persisted timestamps here.

## Sketch

- `departVoyage` currently accepts a route ID and revalidates the latest state. The candidate command may accept a destination identity or a quote identity, but domain departure must recompute the deterministic path from current canonical state via the Child 01 planner and reject a stale or changed quote rather than trusting UI totals.
- Mandatory Food and Water come from the shared estimator (quoted duration × content-owned consumption rates, rounded once per Supply for the full passage). Departure continues to consume quantity and weighted acquisition cost basis atomically before persisting the Voyage.
- Fleet speed landed in Child 01 as canonical Fleet state fixed at 100; the departure command reads it from state so a later upgrade system changes quotes without touching this contract.
- The candidate Voyage snapshot should copy origin, planned destination, ordered edge identities, edge timing and risk inputs, SubRegion spans, aggregate requirements, timestamps, and seed. It must not depend on mutable graph content to complete an already-started Voyage.
- Current active saves persist one of six direct route IDs with aggregate totals. A schema migration must either map each known ID to the converted edge path while preserving all copied values or retain a legacy immutable passage representation that can finish exactly once. Unknown or inconsistent payloads remain recoverably corrupt; they must not be rerouted using current shortest-path content. Note the 2026-07-25 rebalance: an in-flight legacy Voyage keeps its persisted legacy totals; only new departures quote at the new scale.
- Retiring `ROUTES` and `getRoute` happens here, after the migration defines the payload transition and deterministic fallback; Child 01 deliberately left them untouched.
- `resolveVoyage` and `settlePortEntry` currently make arrival idempotent and reserve Market transition for the destination. Preserve that seam: sea points and SubRegion transitions never call Port settlement.
- Legal traversal already accounts for destination knowledge and terminal Port topology (Child 01); Region-unlock legality joins the planner seam once V5 Core 07 ships unlock state.
- Wiring `createScaledClock` into `/debug/game` ordinary play needs a decision on persisted timestamps (scaled clock time enters `departedAt`／`plannedArrivesAt`); keep debug-scaled saves isolated from production saves or accept the divergence explicitly.
- Focused tests should cover quote-versus-command parity, stale-quote rejection, atomic Supply cost basis, snapshot immutability, migrated active Voyages, passing an intermediate Port approach during real resolution, and exact-versus-long-offline arrival.

### Candidate files to inspect

- `src/core/navigation/passage-planner.ts`
- `src/core/content/world-content.ts`
- `src/core/model/game.ts`
- `src/core/rules/voyage.ts`
- `src/core/rules/cargo.ts`
- `src/core/rules/progression.ts`
- `src/content/route-definitions.ts`
- `src/content/navigation-definitions.ts`
- `src/runtime/use-game-store.ts`
- `src/harness/harness-clock.ts`
- `src/platform/persistence/save-migrations.ts`
- `test/unit/passage-planner.test.ts`
- `test/unit/voyage.test.ts`
- `test/unit/progression.test.ts`
- `test/unit/save-migrations.test.ts`
- `test/unit/use-game-store.test.tsx`

## Non-Goals

1. Nautical-chart rendering or Harbor interaction changes.
2. Sailing Event, Combat, diversion, delay, or manual at-sea decision implementation beyond preserving their established Voyage extension seam.
3. Dynamic route preferences, safest-route selection, player-authored waypoints, or automatic Trade Routes.
4. Incremental per-hour Supply mutation or browser timer counts as canonical elapsed time.
5. Changes to the planner's cost model or the authored baseline quotes pinned by the Child 01 spec.

## Acceptance Criteria

1. Departure recomputes the deterministic path and quote from current canonical state through the Child 01 planner; stale, unreachable, locked, under-provisioned, or malformed passages fail atomically with an explicit reason.
2. Passing a harbor approach never enters its Port; only the planned destination performs Market transition, progression, arrival restocking, and docked operations.
3. Departure persists an immutable ordered passage snapshot and deducts committed Food, Water, and cost basis exactly once.
4. Existing valid active Voyages migrate or finish with their original endpoints, timing, requirements, risk, and exactly-once settlement; invalid payloads remain recoverable.
5. Direct `Route` records are retired from live departure without leaving a second quoting authority.
6. Foreground and long-offline arrival retain the established deterministic explicit-time and replay-idempotency guarantees.
