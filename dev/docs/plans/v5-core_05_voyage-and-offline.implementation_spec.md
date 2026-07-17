# V5 Core 05 — Deterministic Voyage and Offline Arrival

Parent Plan: `v5-core.md`

## Goal

Make one persisted Voyage snapshot resolve to the same Port arrival across foreground timers, reload, resume, and offline return. Invalid persisted operation data must not create an arbitrary arrival or mutate Market progression.

## Summary

Departure will copy route-derived Food and Water requirements into an immutable persisted Voyage snapshot after validating all preconditions and deducting their cost basis once. `resolveVoyage(state, now)` remains the sole arrival transition; it will validate the persisted snapshot before crossing its planned boundary, settle the closing Market Session atomically, and leave invalid state untouched with an explicit error.

The React layer continues to schedule resolution only. It does not own elapsed-time semantics, duplicate arrival effects, or an alternate offline reward path.

## Relational Context

- Authored routes provide departure inputs; `departVoyage` copies those values into the persisted Voyage owner so later route-object mutation cannot change an in-progress operation.
- Fleet Supplies and total cost basis are canonical Fleet state. Departure consumes Food and Water in one immutable state transition before adding the Voyage snapshot.
- `resolveVoyage` receives explicit time, owns completion idempotency, and is called by every timer, hydration, visibility, and offline entry point; presentation code only schedules it.
- Voyage arrival calls `settlePortEntry` once with the persisted destination and seed. Settlement owns location, source XP, and destination Session creation.
- Save hydration validates the Voyage's route identity, endpoints, timestamps, required Supplies, seed, and related Market location before treating it as canonical state.
- Automatic Supply restocking runs only after a valid completed arrival and must not convert an invalid Voyage into a partial Port transition.

## Scope

### Included

- Defensive immutable copy of route Supply requirements at departure.
- Persisted Voyage snapshot validation in hydration and the pure resolver.
- Regression coverage for mutable content isolation and invalid arrival rejection.
- Integration with version 5 save validation introduced by Child 04.

### Excluded

- Sailing Events, Combat, Cargo Loss, diversion, delay, Item rewards, and Expedition operations.
- Route balance, Fleet Speed, browser smoke, or visual Voyage UI changes.
- Alternative elapsed-time resolvers or timer-driven gameplay state.

## Files to Change

| File                                                 | Change Size | Purpose                                                                      |
| ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `game/domain/rules/voyage.ts`                        | Medium      | Copy departure requirements and reject invalid snapshots before arrival.     |
| `game/infrastructure/persistence/save-migrations.ts` | Medium      | Reject malformed persisted Voyage data during hydration.                     |
| `game/domain/models/game.ts`                         | Small       | Preserve the payload schema contract shared with Session validation.         |
| `tests/voyage.test.ts`                               | Medium      | Verify immutable snapshots, exact arrival, and invalid-state no-op behavior. |
| `tests/save-migrations.test.ts`                      | Small       | Cover recoverable malformed current saves.                                   |

## Execution Outline

1. Make departure construct an independent persisted Supply-requirement snapshot while retaining its existing atomic consumption behavior.
2. Validate route identity, endpoints, timestamps, requirements, seed, and docked origin before resolver completion can call settlement.
3. Extend load validation so malformed persisted Voyage state is surfaced as corrupt recovery rather than reaching the resolver.
4. Add focused domain and persistence regressions, then run the repository verification suite.

## Implementation Notes

- The resolver must use `plannedArrivesAt` for `arrivedAt`, Result data, and activity time so callback timing and long offline intervals do not change the outcome.
- Before the planned boundary and after `voyage` is cleared, resolution is an identity-preserving no-op. A malformed snapshot returns an error with the original state identity.
- Validate snapshots against known route and Port content before settlement. Do not synthesize a destination Session to recover malformed data.
- A finite Voyage has no generic offline cap: any valid snapshot resolves after its persisted boundary, regardless of elapsed duration.

## Edge Cases

| Case                                                   | Expected Handling                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Route content changes after departure                  | The persisted Food and Water snapshot remains unchanged.                                       |
| Clock rollback or pre-arrival resolution               | Preserve the exact current state without progress.                                             |
| Exact boundary or long offline return                  | Complete one arrival at the planned boundary and record one Result.                            |
| Replay after completion                                | Preserve the completed state without duplicate XP, Session, activity, or restock.              |
| Invalid route, endpoint, seed, or requirement snapshot | Return an explicit resolver error; hydration treats persisted payloads as recoverably corrupt. |

## Acceptance Criteria

1. Departure creates one independent persisted Voyage snapshot and deducts committed Food, Water, and cost basis exactly once.
2. Foreground, reload, resume, and long offline resolution use the same resolver and produce one identical valid arrival result.
3. Resolver replay, same-Port behavior, and clock rollback cannot duplicate Supplies Cost, Port XP, Category factors, Specialty supply, activity, or Result records.
4. Invalid persisted Voyage data cannot arrive at an unauthored Port or create a Market Session; it remains recoverable through the existing corrupt-save path.
5. Focused Voyage and persistence tests plus `npm run verify` pass; browser smoke remains deferred to final main-plan acceptance or an explicit request.
