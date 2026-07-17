# V5 Core MVP Content Ledger

This ledger fixes the authored content and deterministic decisions for the V5 Core MVP delivery experiment. It is the product-data authority for Child 01 through Child 05; later phases must not change these values unless a new product decision explicitly supersedes this ledger.

## Initial World

The initial world unlocks the Iberian Atlantic and Maghreb Coast regions. Lisbon, Faro, and Tangier are known and reachable from the start. West Africa remains locked and has no playable Port, Route, Expedition, Item, Combat, Repair, Event, or other Child 06–08 runtime path in this MVP.

| Fleet field       |                Initial value |
| ----------------- | ---------------------------: |
| Location          |                       Lisbon |
| Gold              |                        2,000 |
| Cargo Capacity    |                     60 Units |
| HP / maximum HP   |                    100 / 100 |
| Attack            |                           10 |
| Speed             | 10 distance units per second |
| Product inventory |                        Empty |
| Supply inventory  |            Five empty stacks |
| Active operation  |                         None |

All three known Ports begin at Level 1 with 0 XP. The starting Market Session is Lisbon. All Ports use the same Supply identities and fixed global unit prices. Supplies consume one Cargo Unit each:

| Supply     | Food | Water | Medicine | Munitions | Spares |
| ---------- | ---: | ----: | -------: | --------: | -----: |
| Unit Price |    8 |     4 |       30 |        18 |     24 |

## Product Content

Product Family supplies the base price and Category. Product is the only Cargo identity. A Product can appear in more than one Port catalog, while every Specialty has one unique origin Port and Region.

| Product ID           | Product Family       | Category  | Base Price | Specialty origin         |
| -------------------- | -------------------- | --------- | ---------: | ------------------------ |
| cod                  | Cod                  | Food      |         30 | —                        |
| tuna                 | Tuna                 | Food      |         35 | —                        |
| barley               | Barley               | Food      |         20 | —                        |
| olive-oil            | Olive Oil            | Food      |         40 | —                        |
| salt                 | Salt                 | Food      |         15 | —                        |
| wine                 | Wine                 | Food      |         60 | —                        |
| wool-cloth           | Wool Cloth           | Textile   |         75 | —                        |
| rope                 | Rope                 | Textile   |         35 | —                        |
| leather              | Leather              | Textile   |         70 | —                        |
| iron-ingot           | Iron Ingot           | Metal     |        110 | —                        |
| copper-ingot         | Copper Ingot         | Metal     |         95 | —                        |
| ceramic              | Ceramic              | Luxury    |         65 | —                        |
| glassware            | Glassware            | Luxury    |         90 | —                        |
| lisbon-cork          | Lisbon Cork          | Luxury    |        150 | Lisbon, Iberian Atlantic |
| faro-pig             | Faro Pig             | Livestock |        100 | Faro, Iberian Atlantic   |
| tangier-dyed-leather | Tangier Dyed Leather | Textile   |        140 | Tangier, Maghreb Coast   |

Each catalog below is complete even when the player has not unlocked all of its Products. The Level column controls purchase availability only; it never changes destination-production classification for sale pricing.

| Port    | Region           | Lv.1 (4)                                    | Lv.20 (3)                | Lv.50 Specialty (1)  | Lv.75 (2)             |
| ------- | ---------------- | ------------------------------------------- | ------------------------ | -------------------- | --------------------- |
| Lisbon  | Iberian Atlantic | cod, olive-oil, wool-cloth, iron-ingot      | salt, wine, rope         | lisbon-cork          | ceramic, glassware    |
| Faro    | Iberian Atlantic | tuna, olive-oil, wool-cloth, salt           | wine, rope, copper-ingot | faro-pig             | iron-ingot, glassware |
| Tangier | Maghreb Coast    | barley, olive-oil, wool-cloth, copper-ingot | salt, wine, leather      | tangier-dyed-leather | iron-ingot, ceramic   |

The Product data deliberately demonstrates both Specialty sale paths: Faro Pig sold to Lisbon is a same-Region Specialty sale, while Lisbon Cork sold to Tangier is a cross-Region Specialty sale. Those destination catalogs do not produce the corresponding Specialty.

## Progression And Routes

Port level is the greatest integer level whose threshold is no greater than accumulated XP, capped at 100. The following piecewise function defines every threshold without a generated table:

```text
threshold(1..20)   = 100 × (level − 1)
threshold(21..50)  = 1,900 + 200 × (level − 20)
threshold(51..75)  = 7,900 + 300 × (level − 50)
threshold(76..100) = 15,400 + 450 × (level − 75)
```

Therefore Level 20, 50, 75, and 100 begin at 1,900, 7,900, 15,400, and 26,650 XP respectively. Market settlement uses the persisted integer Market Reference Value, not a price modifier or a rounded transaction total.

| Route ID       | Origin  | Destination | Distance |  Duration | Static risk | Food | Water |
| -------------- | ------- | ----------- | -------: | --------: | ----------: | ---: | ----: |
| lisbon-faro    | Lisbon  | Faro        |       20 | 2 seconds |        0.10 |    1 |     1 |
| faro-lisbon    | Faro    | Lisbon      |       20 | 2 seconds |        0.10 |    1 |     1 |
| lisbon-tangier | Lisbon  | Tangier     |       50 | 5 seconds |        0.20 |    2 |     2 |
| tangier-lisbon | Tangier | Lisbon      |       50 | 5 seconds |        0.20 |    2 |     2 |
| faro-tangier   | Faro    | Tangier     |       35 | 4 seconds |        0.15 |    2 |     1 |
| tangier-faro   | Tangier | Faro        |       35 | 4 seconds |        0.15 |    2 |     1 |

```
durationMilliseconds = roundHalfUp(distance / speed × 1,000)
```

Child 05 records static risk in the Voyage snapshot but does not resolve Events, Combat, loss, delay, diversion, or rewards. Those behaviors remain absent until their explicitly excluded later Children.

## Deterministic Rules

- The time unit is integer Unix milliseconds. A Voyage arrives when `now >= plannedArrivesAt`; resolver calls clamp negative elapsed time to zero.
- `roundHalfUp` accepts only finite non-negative values and returns `floor(value + 0.5)`. Examples: `1.49 → 1`, `1.50 → 2`, `2.50 → 3`, `0.50 → 1`.
- Market Reference, Buy Price, Sell Price, and proportional cost-basis removal use this same rule, then apply the documented minimum of one Gold where applicable.
- The deterministic pseudo-random generator is xorshift32. It receives a non-zero unsigned 32-bit seed and returns its next unsigned 32-bit state; a sampled fraction is `state / 2^32`.
- Application code obtains a new non-zero seed through an injectable seed source backed by `crypto.getRandomValues`. If no cryptographic source is available, a command that needs a new Session or Voyage fails visibly and leaves canonical state unchanged. Tests inject fixed seeds.
- A Category Market Factor consumes one generator value and is `0.85 + floor(sample × 36) / 100`, giving inclusive hundredth values from `0.85` through `1.20`. Categories are sampled once in stable lexical Category-ID order and the complete result is persisted before presentation reads it.
- A Voyage saves its generated seed before elapsed-time resolution. Foreground heartbeat, visibility resume, hydration, and offline resolution reuse that snapshot and do not draw a second seed.

## Fixed Economic Rules

- Producer Buy Modifier is `0.80`; the Level 100 Port Buy Modifier is `0.90`; all other levels use `1.00`.
- A new Session gives its local Specialty 0 Units before Level 50, 20 Units at Levels 50–74, and 40 Units at Levels 75–100.
- Ordinary Products have no finite Market supply in this MVP.
- Sale classification remains exclusive and ordered: destination production `0.50`, same-Region Specialty `1.50`, cross-Region Specialty `3.00`, then ordinary non-produced Product `1.20`.
