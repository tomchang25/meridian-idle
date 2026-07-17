# V5 Core 02 — Product, Cargo, and Provisioning

Parent Plan: `v5-core.md`

## Implemented Contract

`core-content.ts` owns all three ten-product port catalogs and validates their 4／3／1／2 tier shape, specialty attribution, prices, and categories. `Fleet.products` and the five fixed Supply stacks share `usedCargo`; every stack stores quantity and actual total cost basis. Docked Supply buy and discard commands require positive safe integers and are atomic. The dashboard presents complete tiers, lock state, capacity, stacks, unit prices, and keyboard-safe controls.

## Verification

Focused content, cargo, persistence, and rendered-dashboard tests cover catalog validation, integer rejection, capacity, Gold, proportional basis removal, and migration defaults.
