# V5 Core 02 — Product, Cargo, and Provisioning Sketch

Parent Plan: `v5-core.md`

## Goal

Explore canonical Product content, Port catalogs, Fleet Cargo, five Supply stacks, and shared Cargo Capacity. This slice gives the V5 shell a real content and inventory foundation while preserving the later Market child as the owner of Product Buy and Sell.

## Summary

Product Family owns Base Price and Category metadata; Product is the only inventory identity; each Port owns a complete ten-Product production catalog with fixed unlock tiers. Persisted Fleet inventory stores Product and Supply quantities plus total acquisition cost basis, while capacity, weighted averages, affordability, and eligibility remain derived.

The player can inspect authored Port catalogs, buy or discard Supplies at the current Port, and understand one shared capacity. Product stacks and discard semantics are established here, but market-priced Product acquisition begins in Child 03.

## Sketch

- Candidate content separates Product Family, Product, Category, Port catalog, Supply definition, Fleet definition, and initial world data without creating a tradable generic Goods record.
- Every Port catalog validates exactly ten unique Product IDs, exactly one Specialty at the Lv.50 tier, four Lv.1 entries, three Lv.20 entries, and two Lv.75 entries.
- Product identity remains stable across Cargo, Market, accounting, loss, Items interactions, and Expedition delivery. Family is metadata and never becomes a second inventory key.
- Fleet Cargo stores Product stacks and five stable Supply stacks under one integer Cargo Capacity. Quantity commands reject zero, negative, fractional, non-finite, unsafe, or malformed values.
- Supply prices come from Port content. Buy Supplies atomically updates Gold, Supply quantity, Supply total acquisition cost basis, used capacity, activity result, and dirty save state.
- Supply purchase never writes Product Market net trade or Port XP. Discard removes quantity and proportional cost basis without Gold, revenue, or progression.
- Product discard uses the same atomic quantity and cost-basis discipline even before Product Buy is available through UI.
- Content validation must reject unknown Family, Product, Category, Port, duplicate catalog entry, invalid tier count, invalid Specialty origin, non-positive Base Price, or non-positive capacity data before gameplay consumes it.
- UI presents the full catalog, unlock levels, current unlock state, five Supply stacks, Product Cargo, used and remaining capacity, actual Supply cost, Max, rejection reason, and keyboard／touch-safe controls.

### Candidate files to inspect

- `game/domain/models/`
- `game/domain/content/`
- `game/domain/state/initial-game-state.ts`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/cargo/`
- `game/features/ports/`
- `tests/`

## Non-Goals

1. Category Market Factor generation, Market Session, Product Buy／Sell, Sale modifiers, or Product sale accounting.
2. Specialty finite Session supply or Port XP gain.
3. Voyage Supply consumption, Sailing Events, Items reward, Combat, Repair, or Expedition.
4. Quality, Warehouse, Storage, processing, automation, Skills, or dynamic Port production state.

## Acceptance Criteria

1. Every playable Port exposes a valid ten-Product catalog with the required 4／3／1／2 tier distribution and one correctly attributed Specialty.
2. Product is the only Cargo identity; Family and Category remain authored metadata and never create duplicate inventory stacks.
3. Product and all five Supplies share one Cargo Capacity, and every invalid quantity, Gold, capacity, or location command leaves state unchanged.
4. Supply purchase and discard preserve quantity and total acquisition cost basis across save and reload without affecting Product net trade or Port XP.
5. The UI presents complete catalog tiers, current locked state, Product and Supply inventory, used and remaining capacity, previews, and actionable errors on desktop, mobile, keyboard, and touch.
6. Focused content validation, integer boundary, atomic command, cost-basis, migration default, persistence round-trip, and rendered-state verification passes.
