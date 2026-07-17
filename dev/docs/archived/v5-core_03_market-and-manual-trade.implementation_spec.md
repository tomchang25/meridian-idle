# V5 Core 03 — Market Session and Manual Trade

Parent Plan: `v5-core.md`

## Implemented Contract

`MarketSession` persists a stable per-category factor map, session identity, specialty stock, and signed Product ledger. xorshift32 creates factors only when a Session is created. Shared pricing exposes integer round-half-up Reference, Producer Buy (including Lv.100 discount), and one exclusive Sell modifier. Product buy/sell updates Gold, Cargo, stack basis, specialty stock, net trade, and activity in one state transition.

## Verification

Focused market tests prove deterministic factor bounds, Producer pricing, atomic partial-sale accounting, and cross-region Specialty classification.
