# V5 Core

## Goal

Replace the V3 action prototype with a complete manual maritime trading game built around port-produced Products, persistent market sessions, finite Specialty supply, Port progression, deterministic voyages, simple combat, Items, and one Region-unlocking Expedition. The delivered loop must remain understandable and reproducible across foreground play, reload, offline return, migration, and storage failure without depending on any frozen extension.

## Requirements

1. V5 uses one player Fleet and a manual-only economy; V3 Captain, Knowledge, Action, Action Mastery, Captain Skill, and repeating Action behavior do not remain playable runtime paths.
2. Product Family supplies Base Price and Category metadata, while Product is the only tradable inventory identity; every Port has a fixed ten-Product production catalog whose purchase availability is derived from that Port's Level.
3. Every Market Session persists one Category Market Factor per relevant Category in the `0.85–1.20` range, its remaining finite Specialty supply, and signed net trade per Product; presentation reads never generate or refresh market state.
4. Buy Price uses Market Reference Value, the fixed `0.80` Producer Buy Modifier, and the Lv.100 `0.90` Port modifier. Sell Price uses exactly one destination modifier: produced locally `0.50`, ordinary non-local `1.20`, same-Region Specialty `1.50`, or cross-Region Specialty `3.00`.
5. A Port's complete ten-Product catalog determines whether it produces a Product even while that Product remains locked to the player, because player progression must not change the destination's economic classification.
6. Regional Specialty unlocks at Port Lv.50 with 20 Units per new Market Session and increases to 40 Units at Lv.75. Reopen, transaction, reload, departure, or same-Port return never replenish it; a different-Port session transition is required.
7. Products and the five Supply types share one Cargo Capacity and accept positive integer quantities only. Every mutation validates location, Fleet state, unlock, supply, quantity, Gold, capacity, and inventory before applying one atomic result.
8. Product and Supply inventory preserve actual acquisition cost. Sale Profit, Supplies Cost, Repair Cost, Cargo Loss, and Trade Net Profit remain separate and observable instead of being inferred from Gold delta.
9. Port XP settles only when the Fleet actually enters a different Port. It uses absolute net Product quantity multiplied by the persisted Session Market Reference Value, excluding Producer, Sale, Specialty, and Lv.100 modifiers so pricing bonuses do not distort progression.
10. Port Level 1, 20, 50, 75, and 100 respectively provide four Basic Products, three Advanced Products, one Regional Specialty, the final two Products plus doubled Specialty supply, and a ten-percent Buy discount.
11. Voyage uses an immutable persisted snapshot, explicit time, a saved RNG seed, static route risk, ordered event resolution, and the same domain transition for foreground, resume, hydration, and offline return.
12. Sailing Events may consume Supplies, damage Fleet HP, remove Cargo, delay or divert the Fleet, trigger shared Combat, and award Items. Items do not consume Cargo Capacity, and required Region progress never relies only on an unbounded random drop.
13. Trade and Expedition Combat share the terminating player-first HP／Attack resolver. Defeat cannot delete the save, destroy permanent Items, kill a character, or permanently remove the Fleet; ports provide a priced recovery path through Repair.
14. One manual Expedition combines Fleet condition, Product delivery, Supplies, Items, events, combat, progress, retreat, and completion to unlock West Africa without automation or Skill checks.
15. V3 v1 migration preserves Gold one-to-one, stops any running Action without granting uncommitted future cycles, reports every dropped V3 progression category, and creates one legal V5 world. Invalid saves remain recoverable and cannot be silently overwritten during hydration.
16. Each child delivers its required domain state, application commands, persistence, migration, responsive UI, accessibility, error handling, and focused tests rather than deferring basic presentation or verification to final hardening.

## Design

### Release Boundary

The plan is complete only when a player can start or migrate, trade manually across Ports, grow Port Levels, cycle finite Specialty supply, survive or recover from voyage risk, obtain Items, and complete the West Africa Expedition. Automation, logistics, Skills, Quality, dynamic Pirate Danger, Patrol, dynamic supply and demand, Port conditions, distance-based Specialty value, and spoilage remain outside this release.

The first content set may be smaller than the final world catalog, but it must include Lisbon, a same-Region trading partner, a cross-Region destination, coherent route content, at least one Product Category with meaningful price variation, one Regional Specialty, recoverable Pirate Combat, Item rewards, and the West Africa Expedition path.

### Product and Market Contract

Product Family owns Base Price and Category; Product owns tradable identity and optional Specialty origin. Port content owns the complete ten-Product production catalog and each Product's unlock tier. A locked Product is still locally produced for Sell modifier classification.

For Product `p`, Port `d`, and the current Session:

```text
RawReference(p, d) = BasePrice(p) × CategoryFactor(category(p), d)

Reference(p, d) = round(RawReference(p, d))

Buy(p, d) = round(RawReference(p, d) × 0.80 × masteryBuyModifier(d))

Sell(p, d) = round(RawReference(p, d) × exclusiveSaleModifier(p, d))
```

Every displayed Reference and final unit price uses round-half-up and has a minimum of one Gold. Buy and Sell use the unrounded Raw Reference and round only after their complete formula. The mastery Buy modifier is `0.90` only at Lv.100 and `1.00` otherwise.

Exclusive Sell classification is evaluated in this order:

1. Destination produces Product: `0.50`.
2. Specialty outside its origin Port but inside its origin Region: `1.50`.
3. Specialty in another Region: `3.00`.
4. Ordinary Product not produced at destination: `1.20`.

Specialty profitability is intentionally high. Its supply is the limiter: 20 Units at Lv.50 and 40 at Lv.75, persisted inside the Session and replenished only by a true different-Port round trip.

### Fleet, Cargo, Provisioning, and Accounting

The Fleet is the single owner of location, active operation, Cargo, Supplies, HP, Attack, and Items. Product and Supplies share Cargo Capacity. Used capacity, remaining capacity, affordability, eligibility, prices, weighted averages, and previews remain derived from canonical state and content.

Product and Supply stacks retain quantity and total acquisition cost basis. Product sales remove proportional cost basis, while consuming Supplies recognizes their cost in the owning Voyage or Expedition Result. Discard never refunds Gold. Repair records its actual Gold and Supply cost. Selling an entire Product stack removes all residual cost basis so rounding cannot leave value attached to an empty stack.

Partial Product sale, Cargo Loss, discard, and Supply consumption remove `round-half-up(total cost basis × removed quantity / stack quantity)`, capped at the current total; removing the whole stack removes the exact remainder. The next state's total cost basis is always the previous total minus the recorded removal.

### Market Session and Port Progression

One active Market Session belongs to the Fleet's current Port. It contains persisted Category factors, Specialty supply, and signed Product net trades. Remote information can show authored catalog data and last-observed factors, but it cannot generate remote current prices or gain transaction authority.

Entering a different Port atomically settles the previous Session, advances the source Port, closes the old Session, generates and persists destination factors and supply, and creates the new Session. Same-Port return preserves the old Session and provides no progression or supply refresh.

Port progression uses unmodified Market Reference Value:

```text
Port Basis = Σ abs(Product Net Quantity) × Session Reference Unit Value
```

The content-owned curve converts basis to XP and Level. Different Products never offset one another, while Buy and Sell of the same Product do. Unlock state is derived from Level rather than persisted as duplicate flags.

### Deterministic Voyage, Events, and Items

Departure creates an immutable operation snapshot with identity, origin, planned destination, route, timestamps, static risk, required Food and Water, combat inputs, and RNG seed. Online heartbeat, resume, hydration, and offline return all invoke the same resolver. A finite Voyage resolves whenever its persisted arrival boundary is reached; no generic offline reward cap may prevent a legitimate arrival.

The resolver produces ordered, identified beats for normal travel, extra Supply consumption, damage, loss, delay, diversion, Combat, and Item rewards. Reprocessing a completed beat is a no-op. The latest unacknowledged structured Result remains persisted; bounded activity history stores readable summaries without becoming a second gameplay owner.

Items remain part of Core because they support voyages, combat, and Expeditions. They have stable identity, do not use Cargo Capacity, and may provide explicit event alternatives. Core does not include equipment builds, Item crafting, rarity economy, or dedicated farming.

### Simple Combat and Recovery

Combat receives already-calculated HP and Attack inputs and does not know ship, Item, Skill, or UI names. Player attacks first; a surviving enemy retaliates; both Attack values have a minimum of one. The resolver always terminates and returns ordered rounds plus a context-specific result.

Trade defeat can remove Cargo or Supplies, damage the Fleet, and deterministically return or divert it. Expedition defeat retreats. Permanent Fleet destruction, character death, save deletion, and permanent Item destruction are forbidden. Port Repair is always the explicit recovery path when the Fleet survives in a damaged condition.

### Expedition and Region Unlock

The West Africa Expedition is manual and mutually exclusive with normal Voyage. Preparation selects Product, Supplies, and Items from the same Fleet inventory. Progress consumes resources and resolves deterministic event or combat beats. Retreat preserves the configured portion of progress plus remaining inventory; completion requires arrival, positive Fleet HP, authored requirements, and Product delivery.

Completion unlocks the Region, Ports, and Routes exactly once. Newly entered Ports begin at Lv.1. Expedition progress does not award unrelated Port XP.

### Save Transition and Recovery

V5 replaces the V3 runtime rather than maintaining a long-lived version union. The sequential v1 transition preserves stored Gold one-to-one. Captain, Fame, Knowledge, Skills, Action Mastery, selected Action presentation, V3 logs, and running Action state are dropped with an explicit migration report; a running Action receives no speculative post-checkpoint cycles.

Hydration settles absent, loaded, migrated, corrupt, or storage-unavailable state before autosave can write. Corrupt payload recovery is an explicit user action. Storage failure preserves the in-memory session when safe and keeps persistence visibly degraded.

### Child Overview

Children land in observable vertical slices. Each becomes executable only after its sketch is replaced by a live-code-verified implementation spec.

| Child | Focus                                    | Observable outcome                                                                                    | Current document                                                                        |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 02    | Product, Cargo, and Provisioning         | The player can inspect Port catalogs and manage five Supplies while Product inventory authority lands | [Implementation spec](v5-core_02_product-cargo-and-provisioning.implementation_spec.md) |
| 03    | Market Session and Manual Trade          | Persisted Category prices drive atomic Buy／Sell and complete accounting                              | [Implementation spec](v5-core_03_market-and-manual-trade.implementation_spec.md)        |
| 04    | Port Progression and Specialty Supply    | Different-Port settlement unlocks catalog tiers and finite Specialty cycles without same-Port farming | [Implementation spec](v5-core_04_port-progression-and-specialty.implementation_spec.md) |
| 05    | Deterministic Voyage and Offline Arrival | Foreground and offline travel share one repeat-safe route and Session transition                      | [Implementation spec](v5-core_05_voyage-and-offline.implementation_spec.md)             |
| 06    | Events, Items, Combat, and Recovery      | Voyage risk produces deterministic Items, losses, Combat, diversion, and Repair                       | [Sketch](v5-core_06_events-items-combat-and-recovery.sketch.md)                         |
| 07    | Expedition and Region Unlock             | A manual Expedition can retreat or unlock West Africa exactly once                                    | [Sketch](v5-core_07_expedition-and-region-unlock.sketch.md)                             |
| 08    | Core Journey Hardening                   | The full loop remains playable across recovery, responsive, keyboard, and integration boundaries      | [Sketch](v5-core_08_core-hardening.sketch.md)                                           |

## Non-Goals

1. Automatic Trade Routes, Regional Guild, Guild progression, Warehouse, Storage, Workshop, Manufactory, Processing, Long-Term Supply, or Inter-Guild Transport.
2. Skills, Skill XP, checks, modifiers, or placeholder Skill state and UI.
3. Standard／Fine／Exceptional Quality or Quality-specific inventory and pricing.
4. Dynamic Pirate Danger, Patrol, Danger growth, or Danger reduction.
5. Player-trade-driven Category supply and demand, dumping, shortage, famine, prosperity, or another Port production state.
6. Distance-based Specialty multiplier, border spoilage, or route-DAG value calculation.
7. Multiple Fleets, tactical combat, permanent Fleet destruction, character death, equipment builds, Item crafting, or dedicated Item farming.
8. Final world content volume and final economy balance beyond a coherent, repeatable Core dataset.

## Acceptance Criteria

1. A new game begins with one legal Fleet at Lisbon and can complete a repeatable manual Buy, provision, voyage, Sell, repair, and return loop without any frozen extension.
2. A valid V3 v1 save preserves Gold exactly, stops its running Action without granting future cycles, reports every dropped category, and never exposes V3 Captain or Action gameplay after migration.
3. Invalid, corrupt, absent, and storage-unavailable saves produce distinct recoverable states; hydration cannot overwrite unread storage with V5 defaults.
4. Every Port exposes a ten-Product authored catalog, purchase availability matches Levels 1／20／50／75, and the complete catalog—not the player's unlocks—determines the `0.50` local-production Sell classification.
5. Category factors remain stable through UI reopen, Buy, Sell, reload, departure, and same-Port return. A true different-Port transition is required to generate a new Session.
6. Buy and Sell examples match the `0.80`, `0.90`, `0.50`, `1.20`, `1.50`, and `3.00` contracts with shared round-half-up behavior and no stacked Sale modifiers.
7. Specialty supply begins at 20 Units at Lv.50, becomes 40 at Lv.75, survives reload, cannot refresh inside one Session, and replenishes only after a different-Port transition and later return.
8. Product and Supplies never exceed shared Cargo Capacity. Invalid quantity, Gold, capacity, inventory, location, unlock, supply, Voyage, or Expedition commands leave canonical state unchanged.
9. Product sale, Supply consumption, Repair, and Cargo Loss preserve remaining cost basis and separately report Sale Profit, Supplies Cost, Repair Cost, Cargo Loss, and Trade Net Profit.
10. Same-Product round trips inside one Session and same-Port returns grant no Port XP; different Products settle independently using persisted unmodified Market Reference Value.
11. The same Voyage snapshot and seed produce identical events, Items, Combat, loss, diversion, arrival, Market transition, and Port progression in foreground, reload, resume, and offline resolution, with every effect applied once.
12. Combat always terminates, defeat remains recoverable, and Repair restores a playable Fleet without deleting the save or permanent Items.
13. The West Africa Expedition consumes the same Fleet inventory and Combat contract, preserves configured retreat progress, validates Product delivery, and unlocks its Region exactly once.
14. Market, Cargo, Port, Voyage, Combat, Items, Expedition, accounting, save, recovery, and activity feedback remain understandable on desktop and mobile, with keyboard access, semantic labels, visible focus, disabled reasons, and reduced-motion behavior.
15. Every child passes focused verification and the final integrated repository verification covers migration, persistence, pricing, capacity, accounting, progression, deterministic resolution, Combat termination, Expedition completion, and accessible rendered states.
