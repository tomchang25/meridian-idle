# V5 Core 01 — Bootstrap and Migration Sketch

Parent Plan: `v5-core.md`

## Goal

Explore the replacement of the V3 action prototype with one legal V5 world, a single Fleet at Lisbon, and a sequential save transition that preserves Gold while reporting every dropped V3 progression category. This slice establishes hydration and recovery authority before later Product, Market, Voyage, and progression state is added.

## Summary

The favored shape replaces the playable runtime boundary in one child rather than extending the V3 state with optional V5 sections. V3 compatibility remains as a narrow migration input: stored Gold maps one-to-one, a running Action stops without post-checkpoint cycle resolution, and all non-equivalent fields appear in a persisted migration report until acknowledged.

The shell delivered here renders V5 identity, Lisbon location, basic Fleet resources, hydration status, migration status, recovery actions, and explicit unavailable feature states. It does not keep V3 cards or create fake Market controls.

## Sketch

- Verify the current v1 envelope, IndexedDB database, object store, and save key, then append a V5 payload transition without coupling payload version to database layout version.
- Candidate V5 state owns world unlocks, one Fleet location, Gold, empty Product and Item inventories, five empty Supply stacks, Port progress initialized for Lisbon, no active operation, and structured load or migration status.
- Migration copies only a finite valid V3 Gold value. Captain, Fame, Knowledge, Skills, Action Mastery, selected Region／Category, V3 logs, and running Action fields are listed as dropped; no synthetic V5 XP, Items, Port levels, or offline Action reward is granted.
- A migration report is durable until player acknowledgement so reload cannot hide data loss, but the acknowledgement is not gameplay progression.
- Hydration must distinguish absent save, current V5 save, migrated v1 save, invalid or corrupt payload, repository unavailable, and write failure.
- Autosave remains disabled until hydration and migration settle. Corrupt payload recovery requires an explicit new-game action and cannot silently replace the unread payload.
- Application-provided time creates initial checkpoints and migration timestamps; pure state creation and payload migration do not call wall-clock APIs.
- V3 domain content and resolvers may remain only as minimal migration fixtures if live evidence requires them; they must not remain reachable from V5 runtime or UI.
- Root effects must tolerate development remount, stale repository completion, and cleanup without duplicate load, acknowledgement, or save mutation.

### Candidate files to inspect

- `game/domain/models/game.ts`
- `game/domain/state/initial-game-state.ts`
- `game/domain/content/actions.ts`
- `game/domain/rules/action-selectors.ts`
- `game/domain/rules/check-resolver.ts`
- `game/domain/rules/offline-resolver.ts`
- `game/application/use-game-store.ts`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/infrastructure/persistence/indexed-db-save-repository.ts`
- `game/features/dashboard/meridian-dashboard.tsx`
- `game/features/dashboard/meridian-dashboard.module.css`
- `tests/save-migrations.test.ts`
- `tests/offline-resolver.test.ts`
- `tests/action-card.test.tsx`

## Non-Goals

1. Product catalog, Cargo transactions, Supply purchase, Market pricing, Voyage, Combat, Items reward, Port XP, or Expedition behavior.
2. Resolving a V3 running Action beyond the stored checkpoint or converting V3 progression into unrelated V5 value.
3. Renaming the IndexedDB database, object store, or primary save key unless live evidence proves the existing layout cannot carry the new payload.
4. Long-lived V3／V5 runtime unions, legacy UI, or frozen-extension placeholders.

## Acceptance Criteria

1. A new game creates one legal V5 world with the Fleet docked at Lisbon and no reachable V3 Captain or Action gameplay.
2. A valid v1 save preserves finite Gold exactly, stops its Action without future-cycle rewards, and reports every dropped V3 category until acknowledged.
3. Invalid and corrupt payloads remain recoverable without silent overwrite; absent save and storage unavailable are distinct rendered states.
4. Autosave cannot write V5 initial state before hydration settles, while a storage-unavailable session remains playable with explicit degraded status.
5. Reload preserves V5 world identity, Fleet location, Gold, migration acknowledgement, and recovery state according to the save contract.
6. Focused migration, payload validation, round-trip, hydration ordering, stale async, storage failure, and shell accessibility verification passes without retaining a playable V3 runtime.
