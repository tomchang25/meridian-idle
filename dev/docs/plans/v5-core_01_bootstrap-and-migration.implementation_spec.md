# V5 Core 01 — Bootstrap and Migration Implementation Spec

Parent Plan: `v5-core.md`

## Goal

Replace the playable V3 Action runtime with one recoverable V5 world so a new or migrated player reaches Lisbon with a legal Fleet and no reachable V3 progression path.

## Summary

This child replaces the persisted game aggregate, hydration flow, IndexedDB load contract, and dashboard shell together. V3 v1 remains an input-only migration: it preserves only finite Gold and records all dropped V3 fields until acknowledged. New, absent, corrupt, malformed, unavailable, and write-failed storage paths stay visibly distinct; no automatic write can replace unread data before hydration settles.

The implementation adds a V5 aggregate and explicit application command boundary, keeps time and storage capabilities injected, and replaces Action Cards with a semantic V5 port shell. The database name, object store, and save key stay stable; database layout version stays independent of the bumped payload schema version.

## Relational Context

- The V5 aggregate is the only canonical player state; dashboard presentation reads it and sends intent to the application hook, never mutating game state or persistence directly.
- The application hook owns hydration status, save scheduling, repository capability, stale async protection, and the single transition from loaded raw payload to migrated V5 state.
- The repository owns IndexedDB mechanics and returns raw persisted values or explicit availability failures; it must not migrate, synthesize defaults, or overwrite unread values.
- Pure migration receives an unknown raw envelope and explicit time, returns a validated V5 envelope or a recoverable load classification, and never reads wall-clock APIs.
- Initial-state creation receives explicit time. V3 Action, offline resolver, content, selectors, and component paths are migration fixtures only when necessary; V5 runtime must not import or expose them.
- Autosave starts only after a settled absent/current/migrated result. Corrupt and unavailable paths retain the in-memory V5 session but have different recovery affordances.
- The existing database layout remains version 1. Payload schema moves from v1 to v2; no IndexedDB upgrade is implied by the runtime replacement.

## Scope

### Included

- V5 state, initial world, migration report, payload validation, hydration and recovery commands.
- IndexedDB raw-load and explicit failure semantics.
- Accessible Lisbon shell and focused migration, persistence, hydration, and rendered-state tests.

### Excluded

- Product catalog, Cargo, Market, Port XP, Voyage, Events, Items, Combat, Repair, and Expedition behavior.
- V3 gameplay compatibility after migration.

## Files to Change

| File                                                            | Change Size | Purpose                                                                 |
| --------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `game/domain/models/game.ts`                                    | Large       | Replace V3 aggregate with V5 persisted types.                           |
| `game/domain/state/initial-game-state.ts`                       | Large       | Create the legal V5 Lisbon world from explicit time.                    |
| `game/infrastructure/persistence/save-migrations.ts`            | Large       | Validate envelopes and migrate v1 to v2.                                |
| `game/infrastructure/persistence/indexed-db-save-repository.ts` | Medium      | Separate raw reads from payload migration and expose failures.          |
| `game/application/use-game-store.ts`                            | Large       | Coordinate hydration, recovery, acknowledgement, and bounded saves.     |
| `game/features/dashboard/`                                      | Large       | Replace Action presentation with V5 recovery-aware port shell.          |
| `tests/`                                                        | Large       | Cover migration, recovery, stale async, persistence, and accessibility. |

## Execution Outline

1. Define V5 canonical and load-state models, then create and test a valid initial Lisbon world.
2. Replace migration and repository boundaries so raw persistence cannot be overwritten before validation and hydration settlement.
3. Rebuild application orchestration around explicit load and recovery commands with Strict Mode-safe async ownership.
4. Replace the dashboard with a V5 shell, delete reachable V3 runtime paths, and add focused rendered-state coverage.
5. Run focused tests, repository verification, Phase 01 smoke journey, and closeout only after the phase terminal revision passes CI.

## Implementation Notes

- V1 Gold is copied only when it is finite and non-negative; invalid V1 payloads are corrupt rather than guessed. The migration report lists Captain, Fame, Knowledge, Skills, Mastery, selection state, logs, and running Action as dropped.
- The report acknowledgement is persisted V5 state but does not grant progression. Corrupt recovery requires an explicit new-game command.
- Use discriminated runtime load status rather than nullable booleans. A failed read and an absent read must remain distinguishable.
- Save errors change persistence status without discarding an otherwise valid in-memory V5 state. Stale load completions and unmounted effects have no state or write effect.

## Edge Cases

| Case                                        | Expected Handling                                                  |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Valid v1 save with running Action           | Preserve Gold, drop Action without resolving cycles, show report.  |
| Invalid, corrupt, or unknown envelope       | Preserve unread payload and render explicit recovery action.       |
| IndexedDB unavailable or read/write failure | Start a degraded in-memory session without claiming it is saved.   |
| Strict Mode remount or stale load           | Only the current load completion may settle state or enable saves. |

## Acceptance Criteria

1. A new game reaches a legal V5 Fleet docked at Lisbon with no playable V3 Action surface.
2. A valid v1 save preserves finite Gold exactly and reports all dropped V3 progression until acknowledged.
3. Absent, corrupt, invalid, unavailable, and write-failed persistence paths are distinct and recoverable without silent overwrite.
4. Reload preserves legal V5 state, migration acknowledgement, and recovery state according to the save contract.
5. Focused migration, hydration, persistence, stale-async, and rendered accessibility tests pass.
