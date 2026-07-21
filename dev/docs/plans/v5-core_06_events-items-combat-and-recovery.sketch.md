# V5 Core 06 — Events, Items, Combat, and Recovery Sketch

Parent Plan: `v5-core.md`

## Goal

Explore deterministic Sailing Events, Item rewards, shared HP／Attack Combat, Cargo and Supply loss, diversion, and Port Repair on the persisted Voyage backbone. This slice turns static route risk into recoverable manual-trade danger without introducing dynamic Pirate Danger or Patrol.

## Summary

The Voyage resolver expands into ordered, identified beats generated from snapshot seed and static route risk. Every beat produces a structured delta and applies at most once. Combat remains a pure player-first HP／Attack resolver; application resolution coordinates Fleet condition, inventory cost basis, actual destination, Market transition, financial result, and persistent feedback.

Items remain Core inventory with stable identity and no Cargo cost. The first set supports explicit Event or Expedition alternatives and rewards, but not equipment builds, crafting, rarity economy, or dedicated farming.

## Sketch

- Event content owns eligibility, weight, timing window, and structured outcomes. Snapshot seed and content produce the same ordered beats in one-shot offline resolution or incremental foreground resolution.
- Static route risk influences authored Event or Pirate Encounter selection but never grows permanently and never creates Region danger state.
- Each beat has stable identity and status. Already-applied Supply consumption, damage, loss, delay, diversion, Combat, or reward becomes a no-op on replay.
- Additional Supply consumption removes quantity and weighted acquisition cost basis and appears separately from departure's committed Food／Water cost.
- Cargo Loss removes Product quantity and proportional cost basis, records financial loss, produces no revenue or Market net trade, and never rolls back source Port XP already settled by an earlier Session.
- Item reward and consumption use stable Item IDs, do not affect Cargo Capacity, and apply exactly once. Required Region progress always has a deterministic non-random completion path.
- Combat receives calculated player and enemy HP／Attack, clamps each Attack to at least one, resolves player attack before surviving-enemy retaliation, terminates, and returns ordered round records.
- Trade victory continues toward the current actual destination. Defeat applies authored recoverable loss and chooses deterministic origin return or reachable diversion; only the actual entered Port receives Market transition.
- Fleet HP persists after Voyage. Port Repair validates docked location, Gold, required Rope & Sails, current damage, and content price, then records Repair Cost and restored HP atomically.
- Full Voyage Result separates route timing, committed and extra Supplies, Events, Combat, HP, Product and Item deltas, Cargo Loss, actual destination, Session settlement, Port XP, and Trade Net Profit.
- UI distinguishes normal arrival, delay, victory, defeat return, diversion, still in progress, and recoverable content error without relying on color alone.

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/voyage/`
- `game/features/combat/`
- `game/features/items/`
- `game/features/repair/`
- `test/unit/`

## Non-Goals

1. Dynamic Pirate Danger, Danger growth, Patrol, Skills, tactical combat, Defense, hit chance, positioning, or player combat buttons.
2. Permanent Fleet destruction, character death, save deletion, or permanent Item destruction on defeat.
3. Equipment builds, Item crafting, rarity economy, dedicated farming, or random-only Region unlock.
4. Expedition-specific progress and completion behavior.

## Acceptance Criteria

1. The same Voyage snapshot, seed, content, and elapsed boundary produce identical ordered Events, Combat rounds, resource deltas, Items, delay, diversion, and actual arrival online and offline.
2. Every identified beat applies at most once across incremental resolution, one-shot resolution, reload, stale async completion, and repeated hydration.
3. Combat always terminates with player-first order and Attack at least one; victory, defeat, return, and diversion each produce a complete structured Result.
4. Product and Supply loss preserve remaining quantity and cost basis, report Cargo or Supplies Cost without sale revenue, and do not create Market net trade or retroactive XP changes.
5. Item reward and consumption never change Cargo Capacity, never duplicate on reload, and cannot be the only unbounded-random path to required progression.
6. Repair provides an atomic, priced, visible recovery path for a damaged Fleet and records Gold, Rope & Sails, restored HP, and Repair Cost correctly.
7. Only the actual entered Port performs Session transition and progression; an unentered planned destination never creates Category factors or supply.
8. Focused determinism, beat idempotency, Combat termination, accounting, diversion, Item persistence, Repair, online／offline parity, and rendered-result verification passes.
