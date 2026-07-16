# V5 Core 05 — Deterministic Voyage and Offline Arrival Sketch

Parent Plan: `v5-core.md`

## Goal

Explore manual Port-to-Port Voyage, Food and Water commitment, persisted operation snapshots, elapsed-time resolution, and atomic arrival. This slice makes foreground waiting, background resume, reload, and offline return produce one identical Port and Market transition.

## Summary

Departure creates an immutable Voyage snapshot from route content, Fleet state, explicit time, required Food and Water, and a saved RNG seed. Online heartbeat, visibility resume, hydration, and offline return invoke the same pure resolver; UI timers remain derived and never own gameplay time.

This child lands the safe ordered travel and arrival backbone. It reserves the ordered event-beat seam and seed required by Child 06, but does not yet resolve damaging Events, Items, Combat, loss, or diversion.

## Sketch

- Route content owns origin, destination, direction, distance, static risk, and Supply-consumption inputs. Fleet Speed and the route contract produce one deterministic planned arrival boundary with shared unit and rounding rules.
- Departure validates the Fleet is docked at the route origin, the destination and route are unlocked, no mutually exclusive operation is active, Cargo is legal, and required Food and Water are present.
- Required Food and Water are deducted atomically at departure and their acquisition cost basis is recorded in the Voyage Result-in-progress. This makes committed cost and reload behavior explicit while later Events may add further consumption.
- Snapshot identity, origin, planned destination, route, timestamps, static risk, required Supplies, Fleet combat inputs, and seed persist before elapsed resolution can begin.
- Resolver accepts state, content, and explicit `now`; it clamps negative elapsed time to zero, handles exact arrival, long absence, already-completed identity, invalid route content, and stale invocation.
- Finite Voyage resolution has no generic reward cap that can prevent arrival. If `now` reaches or exceeds the persisted boundary, the Voyage reaches its current deterministic completion state regardless of absence length.
- Safe arrival atomically completes the operation, updates location, settles the source Market Session and Port progression, creates and persists the destination Session, and emits one structured Result.
- A return to the same Session Port without entering another Port preserves factors, net trade, progression, and Specialty supply. Normal Port-to-Port routes target a different Port; the same-Port rule remains available for later forced return.
- React effects coordinate one timer or resume listener with symmetrical cleanup. Durable completion is protected by operation identity rather than effect invocation count.
- UI shows route, destination, static risk, committed Food／Water cost, departure rejection, remaining time, locked Port operations, arrival summary, and persistence status.

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `game/features/ports/`
- `tests/`

## Non-Goals

1. Damaging Sailing Events, extra Supply consumption, Items reward, Pirate Combat, Cargo Loss, delay, diversion, or forced return.
2. Dynamic Pirate Danger, Patrol, Skills, automatic routes, Expedition, or multiple simultaneous operations.
3. Distance-based Specialty Sale modifier or border spoilage.
4. Browser timer callbacks as gameplay authority or a generic offline cap that blocks finite arrival.

## Acceptance Criteria

1. The player can depart only from the current route origin toward an unlocked reachable destination with sufficient Food and Water and no active operation.
2. Departure deducts required Food and Water plus their cost basis exactly once and persists one immutable Voyage snapshot before elapsed resolution.
3. Foreground completion, repeated heartbeat, background resume, mid-Voyage reload, hydration after arrival, and long offline return produce the same location, accounting, source settlement, and destination Session.
4. Exact arrival time completes once; clock rollback creates no negative progress; stale or repeated resolution cannot duplicate Supply cost, Port XP, Category factors, Specialty supply, activity, or Result.
5. Port transactions remain unavailable in transit, and UI exposes destination, static risk, committed cost, remaining time, locked reason, arrival summary, and save status accessibly.
6. Focused route validation, departure atomicity, time boundary, clock rollback, long absence, identity idempotency, Market transition, Strict Mode cleanup, persistence, and rendered-state verification passes.
