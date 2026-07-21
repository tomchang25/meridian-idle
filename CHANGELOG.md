# Changelog

## Unreleased

### Added

- 2026-07-21 — [harness] Browser tests can now start from an authored world named in the URL and advance simulated time, reaching a Voyage arrival in under a second instead of waiting out its real duration.
- 2026-07-16 — [v5] V5 now starts or migrates into a recoverable Lisbon Fleet world without V3 Action gameplay.
- React／TypeScript Web application skeleton。
- GDD 對應的三欄航海 Dashboard。
- Action、判定公式、持續執行與離線結算骨架。
- IndexedDB versioned save boundary 與 PWA shell。
- Web-native development standards、workflows 與 tests。

### Changed

- 2026-07-21 — [architecture] Layer dependency rules are now enforced by lint, so a forbidden cross-layer import fails verification instead of drifting unnoticed.
- 2026-07-21 — [architecture] Game source now lives under one `src/` layout sharing the tickstrike-web layer taxonomy, with the `@/` alias pointing at it.
- 2026-07-21 — [architecture] Domain rules now report outcomes as semantic events, and player-facing activity copy is rendered in one place outside the domain layer.
- 2026-07-21 — [content] World data is now authored per domain behind one catalog, and cross-references are validated at test time, including the Route endpoint, measurement, and reachability checks that previously did not exist.
- 2026-07-21 — [architecture] Time now reaches the game through one injected clock, and randomness through streams built from an explicit seed, with a contract test pinning same-seed replay across a save round-trip.
- 2026-07-21 — [architecture] Core rules now receive authored content as an argument instead of importing it, so the deterministic layer no longer names a particular world and the boundary is enforced by lint.
- 2026-07-21 — [architecture] Every random domain including the Market now derives its seed the same way, so adding a domain no longer needs an exception; Category Factors keep their authored band and existing saves keep the factors they were created with.
- 2026-07-21 — [architecture] The game now runs outside React in a framework-free runtime; replacing the world cancels the previous world's pending arrival, save, and hydration.
- 2026-07-17 — [supplies] Supply prices are now fixed globally and no longer vary by Port or time.
- 2026-07-16 — [v5] The playable dashboard now uses a responsive city-command HUD with state-driven pixel scenes, focused Port operations, automatic Voyage progress, and separate Fleet ledgers.
- 2026-07-17 — [market] Market Exchange now hides internal Reference values and previews average acquisition cost plus color-coded projected profit for selected Cargo sales.
- 2026-07-17 — [market] Market Buy now shows a held Product's average acquisition cost.
- 2026-07-17 — [ledger] Product Cargo now compares weighted-average acquisition cost with the current local unit sale price.
- 2026-07-17 — [ledger] Cargo Hold now shows Supplies, Products, and free capacity together with proportional group distributions.
- 2026-07-17 — [ui] Circular Fleet and Provisioning icons now center legible glyphs.

### Supply Replenishment Policy and Arrival Auto-Restock

- 2026-07-17 — [supplies] Fleet Supply targets now support atomic manual restocking and optional destination-priced replenishment after Voyage arrival.

### V5 Core MVP Correctness Repair

- 2026-07-21 — [market] Product pricing and Port settlement now read Category and Base Price from a Product Family, so pricing and progression no longer depend on metadata duplicated onto each Product.
- 2026-07-21 — [voyage] Voyage departure now draws a secure seed and visibly refuses to depart when secure randomness is unavailable, leaving Supplies, save, and Voyage state unchanged.
- 2026-07-21 — [market] Buy controls are now disabled with a stated reason whenever Gold, Cargo Capacity, Port unlock, or finite Specialty stock blocks a purchase, and a failed order surfaces an actionable message that clears on the next successful command.
