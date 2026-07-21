# V5 Core 04 — Port Progression and Specialty Supply

Parent Plan: `v5-core.md`

## Goal

Make different-Port Market settlement advance Port progression from the closing Session's immutable economic record. Finite Specialty supply must remain tied to a newly created Session so reloads and same-Port activity cannot farm progression or stock.

## Summary

Market Sessions will persist one unmodified rounded Reference Unit Value for every Product in addition to their Category factors. Settlement will use only those saved values and the signed per-Product ledger, then create the destination Session from the destination's derived Level. A save-payload migration will introduce the new snapshot field for existing version 4 saves and reject malformed Session or Voyage state instead of allowing it to mutate the world.

The result preserves existing Buy and Sell pricing while making Port XP independent of future authored price changes. Specialty supply remains zero before Level 50, 20 at Levels 50–74, and 40 at Level 75 or higher.

## Relational Context

- `MarketSession` is the persisted authority for Category factors, Reference Unit Values, Specialty supply, and signed Product net trade; UI and pricing helpers only read it.
- `createMarketSession` creates both factors and the Product Reference snapshot before a Session is exposed; the snapshot must use the same round-half-up rule as displayed Reference prices.
- Product Buy and Sell own ledger mutation, while `settlePortEntry` consumes the completed Session's ledger and Reference snapshot once when entering a different known Port.
- Port XP is canonical persisted state and Port Level remains a derived selector; no command or UI may persist duplicate unlock flags.
- The persistence boundary owns payload validation and sequential version 4 to 5 migration. It may derive missing historical Reference snapshots from the saved factors, but normal runtime code must not fall back to recomputing a missing snapshot.
- Voyage arrival is the caller of settlement. An invalid destination must leave state unchanged rather than create a Market Session for an unauthored Port.

## Scope

### Included

- Persisted per-Product Market Reference snapshots.
- Different-Port XP settlement from saved reference values.
- Version 4 to 5 save migration and validation for the expanded Session contract.
- Regression coverage for snapshot-based progression and save migration.

### Excluded

- Changes to Buy or Sell modifiers, catalog tiers, or Specialty purchase commands.
- Events, combat, Items, Expeditions, or UI progression presentation.
- Economy rebalance or content catalog expansion.

## Files to Change

| File                                                 | Change Size | Purpose                                                             |
| ---------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `game/domain/models/game.ts`                         | Small       | Add the persisted Session Reference map and payload schema version. |
| `game/domain/rules/market.ts`                        | Medium      | Create and read stable Reference snapshots.                         |
| `game/domain/rules/progression.ts`                   | Small       | Settle Port XP from saved values and reject unknown destinations.   |
| `game/infrastructure/persistence/save-migrations.ts` | Large       | Migrate version 4 Sessions and validate persisted world state.      |
| `game/domain/state/initial-game-state.ts`            | Small       | Stamp new worlds with the current payload schema.                   |
| `test/unit/progression.test.ts`                      | Small       | Prove per-Product persisted Reference values determine XP.          |
| `test/unit/save-migrations.test.ts`                  | Medium      | Cover version 4 Session migration and malformed payload rejection.  |

## Execution Outline

1. Add the Session Reference snapshot and populate it during deterministic Session creation using the established price rounding rule.
2. Update progression to read the closing snapshot exclusively and retain same-Port and unknown-destination no-op behavior.
3. Bump the save schema, append the version 4 migration, and validate the added persisted structures before hydration accepts them.
4. Add focused progression and migration regression tests, then run the repository verification suite.

## Implementation Notes

- The snapshot contains each authored Product, not only Products currently unlocked or traded, so the market record remains complete for the Session lifetime.
- Existing version 4 saves retain their historical Category factors. Their migration derives the missing snapshot from those factors once and stamps version 5.
- Product Buy and Sell still calculate their unrounded final transaction prices from the persisted factor, as required by the parent plan; the snapshot specifically owns the rounded unmodified Reference value used for XP.
- Unknown or missing snapshot entries earn no XP in the pure settlement rule, while persisted current saves with incomplete snapshots are rejected as corrupt during hydration.

## Edge Cases

| Case                                   | Expected Handling                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Same-Port return                       | Keep the active Session, factors, ledger, XP, and Specialty supply unchanged.                               |
| Multiple Products with opposite trades | Offset only within each Product's signed ledger; sum absolute Product contributions.                        |
| Existing version 4 save                | Migrate saved factors to one complete Reference snapshot without changing Gold, Cargo, or Session identity. |
| Unknown destination                    | Do not award XP, move the Fleet, or create a Session.                                                       |
| Malformed current Session              | Hydration reports a recoverable corrupt save rather than deriving arbitrary progress.                       |

## Acceptance Criteria

1. Different-Port settlement uses the closing Session's persisted per-Product unmodified Reference values, and later authored-price changes cannot alter its XP.
2. Same-Port transitions, empty ledgers, and same-Product net-zero trades do not grant XP or refresh Specialty supply.
3. Port Level remains derived from persisted XP and controls the existing 4／3／1／2 catalog availability and 0／20／40 Specialty allocation.
4. Existing version 4 saves migrate to version 5 with stable Reference snapshots; malformed current Session or Voyage data is recoverable rather than authoritative.
5. Focused progression and save-migration tests plus `npm run verify` pass.
