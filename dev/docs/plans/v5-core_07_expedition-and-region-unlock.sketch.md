# V5 Core 07 — Expedition and Region Unlock Sketch

Parent Plan: `v5-core.md`

## Goal

Explore one manual West Africa Expedition that composes the Core Fleet, Cargo, Supplies, Items, deterministic Events, Combat, retreat, Product delivery, and world unlock contracts. This slice proves that manual trade resources culminate in meaningful Region progression without automation or Skills.

## Summary

Expedition is a persisted operation mutually exclusive with Voyage. Preparation selects real Fleet inventory; a seeded ordered resolver advances authored progress nodes; retreat preserves configured progress and remaining resources; completion atomically delivers Product and unlocks West Africa exactly once.

The Expedition reuses Core Event, Item, Combat, loss, and accounting semantics. It adds only Expedition-specific preparation, progress, continue／retreat decisions, completion validation, and Region unlock feedback.

## Sketch

- Expedition content owns target Region, preparation requirements, Product delivery, progress nodes, Supply consumption, eligible Events, enemies, retreat retention, and completion boundary.
- Start validates the Fleet is docked at an allowed Port, no Voyage or Expedition is active, Fleet condition meets the minimum, required Product／Supplies／Items are available, and the Region remains locked.
- Starting persists one operation identity, seed, selected Cargo snapshot, progress, last-resolved checkpoint, and current decision state without duplicating inventory into a second owner.
- Ordered resolution reuses Item, Supply, damage, Cargo Loss, Combat, and beat-idempotency contracts from Child 06. Expedition-specific choice pauses at an explicit decision boundary and cannot be bypassed by offline time.
- Player continue and retreat are application commands. Continue validates current state and required cost; retreat resolves the authored retained-progress rule exactly once.
- Fleet HP zero, critical Supply depletion, authored forced retreat, or player retreat ends the attempt without Product delivery or Region unlock.
- Retreat keeps remaining Fleet inventory and Items and preserves the configured portion of progress. It does not grant unrelated Port XP.
- Completion validates arrival, positive Fleet HP, final progress, required Items or alternatives, and Product delivery, then consumes delivery inventory and cost basis, unlocks West Africa, exposes its Ports and Routes, and records one Expedition Result.
- Repeating completion, reloading the completion boundary, or starting after unlock cannot consume Product twice or duplicate world unlock.
- Newly unlocked Port state is created at Lv.1 on first entry, not at Expedition completion, and no other Port receives XP.
- UI presents preparation gaps, selected Cargo, five Supplies, Items and alternatives, progress, current node, Combat／Event result, retained retreat progress, delivery requirement, and Region unlock outcome.

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/expedition/`
- `game/features/items/`
- `game/features/combat/`
- `tests/`

## Non-Goals

1. Automatic Expedition, Trade Route integration, Guild, Skills, Skill checks, Quality requirements, or Patrol.
2. Multiple Expedition targets beyond the first West Africa content contract.
3. Random-only required Items, dedicated Item farming, equipment builds, or tactical combat.
4. Port XP or ordinary Market Session creation during Expedition progress before actual Port entry.

## Acceptance Criteria

1. The West Africa Expedition starts only from a legal preparation state and uses the same Fleet Product, Supplies, Items, HP, Attack, and cost-basis authority as manual trade.
2. The same operation snapshot, seed, decisions, and elapsed boundaries produce identical progress, Events, Combat, resource cost, loss, reward, and outcome across foreground, reload, and offline return.
3. Offline resolution stops at manual decision boundaries and never chooses continue, retreat, Item use, or delivery on the player's behalf.
4. Voluntary and forced retreat preserve the authored portion of progress plus remaining inventory, while withholding Product delivery and Region unlock.
5. Completion validates all requirements, consumes delivery Product and cost basis exactly once, unlocks West Africa exactly once, and exposes its Ports and Routes without granting unrelated Port XP.
6. A required completion path exists without an unbounded random Item drop, while optional Items can provide explicit alternatives or advantages.
7. Preparation, progress, decisions, retreat retention, delivery, and unlock feedback remain accessible and understandable on desktop, mobile, keyboard, and touch.
8. Focused preparation, mutual exclusion, deterministic progress, decision pause, retreat, delivery accounting, idempotent unlock, persistence, and rendered-state verification passes.
