# V5 Core 03 — Market Session and Manual Trade Sketch

Parent Plan: `v5-core.md`

## Goal

Explore persisted Category pricing, Market Session authority, manual Product Buy／Sell, exclusive destination modifiers, and complete Product accounting. This slice makes manual trade playable at the current Port without allowing UI or reload to change prices.

## Summary

One active Market Session persists Category factors, Port identity, and signed net trade. Domain pricing derives Market Reference, Buy, and Sell prices with a single round-half-up rule; application transactions atomically coordinate Gold, Cargo, cost basis, Session ledger, activity result, and save scheduling.

Remote Port information uses authored catalog data and the last actually observed factors. It never generates a remote current Session or receives transaction authority.

## Sketch

- Session creation receives explicit RNG input and produces one factor in `0.85–1.20` for every relevant Category, then persists the complete result before presentation can read it.
- Market Reference is Base Price multiplied by current Category factor. Buy adds `0.80` and the current Port's derived mastery modifier; Sell applies exactly one modifier after testing the destination's full production catalog and Specialty origin.
- Sell classification is ordered: destination-produced `0.50`, same-Region Specialty `1.50`, cross-Region Specialty `3.00`, ordinary non-produced `1.20`. Specialty never stacks with `1.20`.
- A locked Product in the destination's complete catalog still receives `0.50` on sale. Player unlock state controls Buy only.
- Every final unit price is at least one integer Gold and uses round-half-up. Preview and command share the same pricing result rather than duplicating formulas.
- Product Buy validates location, catalog unlock, quantity, Gold, capacity, and Product availability, then updates actual acquisition cost basis and positive Session net trade.
- Product Sell validates location and held quantity, removes proportional cost basis, adds revenue, records realized Sale Profit, and updates negative Session net trade.
- Selling an entire stack clears all residual cost basis. Partial sale preserves the remaining stack's exact total cost basis contract.
- Product transaction results show Base Price, Category factor, Reference, Producer or Sale modifier, unit price, quantity, revenue or cost, removed cost basis, realized profit, and resulting inventory.
- Unknown Product, Category, factor, Port, or catalog identity enters an explicit recoverable state; the application never regenerates the whole Session to hide invalid content.

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/domain/state/initial-game-state.ts`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/market/`
- `game/features/cargo/`
- `tests/`

## Non-Goals

1. Different-Port Session transition, Port XP settlement, Specialty finite supply, or Level unlock advancement.
2. Voyage, offline arrival, Sailing Event, Cargo Loss, Combat, Repair, Items reward, or Expedition.
3. Dynamic supply and demand, dumping, shortage, Port condition, Quality, bid／ask spread, or finite ordinary Product stock.
4. Automatic transaction, Warehouse, Storage, or processing.

## Acceptance Criteria

1. The current Session's Category factors and every derived price remain unchanged across UI reopen, preview, Buy, Sell, and reload.
2. Buy prices exactly apply Reference, `0.80`, and the current derived mastery modifier; Sell prices apply exactly one of `0.50／1.20／1.50／3.00` with shared round-half-up behavior.
3. Destination production classification uses the complete authored catalog regardless of player unlock, and Specialty never stacks its modifier with ordinary non-produced demand.
4. Buy and Sell atomically update Gold, Product quantity, total cost basis, Session net trade, structured result, and save state; any failed validation produces no partial mutation.
5. Partial and full-stack sales preserve correct Sold Cost Basis, Realized Sale Profit, remaining cost basis, and integer Gold results.
6. Remote views cannot create prices or trade, while current-Port UI exposes the complete price breakdown, inventory, previews, net trade, and actionable disabled reasons accessibly.
7. Focused RNG injection, persistence, pricing table, rounding, catalog classification, accounting, invalid content, atomic command, and rendered-state verification passes.
