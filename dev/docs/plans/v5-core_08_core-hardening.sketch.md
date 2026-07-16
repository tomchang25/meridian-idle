# V5 Core 08 — Core Journey Hardening Sketch

Parent Plan: `v5-core.md`

## Goal

Explore the final cross-system journey, failure, recovery, responsive, accessibility, and regression seams required to treat V5 Core as one maintainable manual maritime game. This child adds no foundational mechanic and sends any discovered ownership gap back to its owning feature.

## Summary

Hardening uses player journeys, state-transition matrices, content audits, failure-mode coverage, and cross-layer verification rather than a second integration store. Shared presentation is extracted only when at least two stable features use the same semantics; accounting, pricing, capacity, time, and progression formulas remain in their canonical domain owners.

The child proves new game, migration, Product trading, Port growth, Specialty cycling, voyage risk, Items, Combat recovery, and Expedition completion under reload, offline, storage, responsive, keyboard, focus, and Strict Mode boundaries.

## Sketch

- Primary journey covers new or migrated game, Lisbon catalog and provisioning, ordinary Product trade, same-Region route, Port settlement, Specialty unlock, 20／40 supply cycle, cross-Region `3.00` sale, voyage Event, Item reward, Pirate defeat, Repair, return trade, and West Africa Expedition.
- Pricing matrix covers every Category factor boundary, round-half-up edge, Producer `0.80`, Lv.100 `0.90`, produced `0.50`, ordinary non-produced `1.20`, same-Region Specialty `1.50`, and cross-Region Specialty `3.00` without modifier stacking.
- Failure matrix covers loading, absent save, migrated save, corrupt payload, storage unavailable, write failure, invalid content identity, invalid factor, empty inventory, insufficient Gold／capacity／Supply, locked Product, depleted Specialty, damaged Fleet, active operation, repeated resolution, and stale async completion.
- Transition matrix covers docked, Voyage, delayed, diverted, returned, defeated, repairing, Expedition preparation, Expedition decision, retreat, completion, and Region unlock.
- Cross-feature selectors remain single-source: catalog classification, price, cost basis, Cargo capacity, Specialty supply, route eligibility, Result totals, Port XP, and unlock state are never copied into components.
- Activity history remains bounded and uses stable identity. Full structured Results persist only while the player needs acknowledgement or continuation; summaries cannot become a second game-state reconstruction source.
- Desktop and mobile expose the same core actions and information. Tables may adapt to cards, but Base Price, factors, modifiers, supply, cost basis, risk, outcome, and disabled reason remain available.
- Semantic controls, logical focus, visible focus, labelled regions, invalid and busy state, non-color status, touch targets, zoom reflow, contrast, live status discipline, and reduced motion receive an explicit audit.
- Effects for hydration, autosave, timers, visibility, and async repository work remain repeatable with symmetrical cleanup; durable transitions deduplicate by revision or operation identity.
- Tests divide domain formulas, application transactions, persistence orchestration, component interaction, and complete journey behavior. Snapshots do not replace semantic or numerical assertions.
- Content validation proves every playable route, Port, Category, Product, Specialty, Event, Item, enemy, Repair entry, and Expedition requirement resolves to valid authored identity.

### Candidate files to inspect

- `app/`
- `game/domain/`
- `game/application/`
- `game/infrastructure/persistence/`
- `game/features/`
- `game/shared/`
- `tests/`

## Non-Goals

1. Any frozen extension, dynamic supply and demand, Port conditions, distance-based value, spoilage, multiple Fleets, or tactical combat.
2. A parallel integration store, duplicate selectors, presentation-owned mutation, or a new framework for hypothetical reuse.
3. Final world content quantity or final economy balance beyond one coherent and repeatable Core journey.
4. Save export／import, multi-tab ownership, production asset pipeline, or unrelated PWA platform chores.

## Acceptance Criteria

1. New and supported migrated players can complete ordinary and Specialty trade, Port progression, voyage risk, Combat recovery, Items, and the West Africa Expedition without frozen-extension state or UI.
2. Every pricing and accounting path uses the canonical formulas and reports the same result across preview, command, activity, Result, save, reload, and offline return.
3. Every major failure and recovery state remains actionable without silent progress overwrite, and storage-unavailable play remains explicitly non-persistent.
4. No repeated effect, timer, stale async completion, hydration replay, or operation retry duplicates Gold, inventory, cost basis, Specialty supply, XP, Item, Combat outcome, Repair, Session, Result, or Region unlock.
5. Desktop and mobile expose equivalent information and actions with complete keyboard, focus, labels, disabled reasons, contrast, touch, zoom, and reduced-motion behavior.
6. Content validation, focused regressions, migration and persistence coverage, full Core journeys, repository verification, and production build all pass; manual-only browser and assistive-technology checks are recorded.
