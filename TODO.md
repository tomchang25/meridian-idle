# TODO

The single forward surface — open this and you see everything: open work and brewing ideas. Every forward item lives in **exactly one** section here (or, once it earns a file, in `dev/docs/plans/`). There is deliberately **no "Done" tier** — done means delete the line; its record lives in `CHANGELOG.md`.

> **Language rule:** Write every TODO heading, instruction, and work item in English. Keep code identifiers, file paths, commands, and product names in their actual spelling.
>
> **The one rule (now about sections, not files):** The actionable tiers (`Plan` / `Chore` / `Bug`) are **one line each** — no paragraphs, no tables, no why. The moment an item needs real reasoning, it belongs in `## Draft` as its own `###` sub-section. When a Draft entry grows sub-structure, becomes actionable, or needs to be linked from elsewhere, it graduates to its own file in `dev/docs/plans/`.
>
> Within `## Draft`, no `####` headings or `**label:**` bold-label patterns — use plain-text labels (em dash, colon) and lists for sub-structure.
>
> **Tag format:** The `[scope]` tag in actionable lines is snake_case — a short lowercase identifier with no spaces, parentheses, or mixed case (for example, `[feature]` and `[bugfix]`).

Actionable line format: `[scope] one sentence — [ref plans/<file>.md if any]`

In-flight and ready-to-implement work lives in `## Active` — promoted from `## Plan` when building starts or the plan is ready to build; more than one entry is fine.

---

## Active

> Do not delete this reminder text.
> Flows currently being built or ready to implement may hold more than one entry. Keep one-line pointers in the same format as `## Plan`; promote them here when building starts or the plan is ready to build.
> Phase detail and progress live in the linked `dev/docs/plans/` file.
> Ship a phase: remove it from that file and append `CHANGELOG.md`, leaving this line untouched.
> When all phases ship: archive the plan file and delete this line.

- [v5] Repair V5 MVP content ownership, command feedback, seed handling, and deterministic Voyage verification — [ref plans/v5-core-mvp_correctness-repair.implementation_spec.md]
- [market] Add batch Goods trading, Cargo-complete selling, and target-based Supplies management — [ref plans/market_batch-trade-controls.implementation_spec.md]

---

## Plan

Queued work, large enough to have a pre-plan file in `dev/docs/plans/`. Promote a line to `## Active` when building starts; if it goes stale here, retire it to `## Draft`.

- [product] Build the V5 manual Product trade, Port progression, voyage risk, Items, combat, and Expedition core — [ref plans/v5-core.md]
- [navigation] Replace static Known waters and direct Port routes with an accessible nautical-chart departure surface, spatial passage graph, and boundary-aware Voyage flow — [ref plans/nautical-chart-navigation.md]

---

## Chore

One line, no reasoning, no backing document.

- [platform] Add save export and import.
- [platform] Define multi-tab ownership and conflict resolution.
- [platform] Build the production asset pipeline.
- [platform] Add PWA 192px and 512px raster icons.

---

## Bug

One line, no reasoning, no backing document.

---

## Draft

Preliminary concepts — larger than a one-liner, but a single `###` sub-section says enough. They are not necessarily actionable yet. Use one `###` heading per idea. When an idea outgrows its sub-section, becomes actionable, or needs a stable link, move it to its own `dev/docs/plans/<file>.md` and delete it here. Delete stale ideas that never grow.

### Supply event consequences

Food must mitigate starvation risk, with fishing, whaling, and island landings as alternative recovery paths. Water must mitigate dehydration risk, with water-storage equipment and island landings as alternatives. Medicine must treat disease and wounded crew. Munitions must avoid a severe naval-combat penalty. Spares must repair Fleet damage. Future Event resolution may consume the matching Supply or impose its defined adverse consequence when unavailable.
