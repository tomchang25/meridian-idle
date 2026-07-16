# V5 Core 04 — Port Progression and Specialty Supply Sketch

Parent Plan: `v5-core.md`

## Goal

Explore different-Port Market settlement, Port XP and Level, catalog unlock milestones, and finite Regional Specialty supply. This slice turns manual trade into visible local progression while preventing same-Port trading, pricing bonuses, or reload from farming XP and stock.

## Summary

A pure settlement rule reads the closing Session's signed Product ledger and persisted unmodified Market Reference values. It computes independent Product contributions, applies the authored monotonic XP curve, advances one source Port, and derives all unlock effects from final Level.

Specialty supply belongs to Market Session state: 20 Units at Lv.50 and 40 at Lv.75. A new valid Session initializes supply from the current Port Level; only a later different-Port round trip can create another supply allocation.

## Sketch

- First entry into an unlocked Port initializes it at Lv.1. Port state persists XP; Level is derived from the authored threshold curve and capped at 100.
- Settlement eligibility requires an actual entered Port different from the active Session Port. Departure, elapsed time, event, combat, same-Port return, or UI navigation is insufficient.
- For each Product, contribution is absolute signed net quantity multiplied by the Session's persisted Market Reference Unit Value before Producer, Sale, Specialty, local-production, or Lv.100 modifiers.
- Buy and Sell of the same Product offset; different Products never offset. Empty or all-zero ledgers produce an explicit zero-gain result.
- One settlement may cross multiple Level thresholds. Unlock effects are derived from final Level: 4 at Lv.1, 7 at Lv.20, Specialty at Lv.50, all 10 and 40 Specialty Units at Lv.75, and `0.90` Buy mastery modifier at Lv.100.
- Port production classification always uses the full ten-Product catalog, not current unlocks or Level.
- New Session creation initializes Specialty supply only when the Specialty is unlocked; Lv.50–74 receives 20, Lv.75–100 receives 40, and earlier Levels receive zero.
- Buy Specialty decrements supply in the same atomic market transaction. Reload and repeated settlement identities cannot refill or double-award it.
- Arrival and settlement use a stable completed-operation or Session identity so retry, stale async completion, and hydration replay become no-ops.
- UI shows current XP／Level, the next milestone, newly crossed milestones, per-Product basis, zero-gain reason, and remaining Specialty supply without implying Guild or Skill progression.

### Candidate files to inspect

- `game/domain/content/`
- `game/domain/models/`
- `game/domain/rules/`
- `game/application/`
- `game/infrastructure/persistence/save-migrations.ts`
- `game/features/market/`
- `game/features/ports/`
- `tests/`

## Non-Goals

1. Voyage timing or offline arrival beyond the application seam that later invokes different-Port transition.
2. Guild XP, Charter, Skills, automation, Warehouse, Storage, or processing.
3. Dynamic ordinary Product stock, player-driven supply and demand, Port state, distance modifier, or spoilage.
4. Final XP balance beyond one authored monotonic curve with all required thresholds reachable in the Core dataset.

## Acceptance Criteria

1. Only actual entry into a different Port settles the previous Session; same-Port, empty, and same-Product net-zero cases grant no XP or supply refresh.
2. Product contributions use persisted unmodified Market Reference values, remain independent across Products, and cannot be inflated by `0.50／1.20／1.50／3.00`, `0.80`, or Lv.100 modifiers.
3. Port XP survives save and reload, Level remains between 1 and 100, and one settlement can correctly cross multiple milestones.
4. Purchase availability matches the 4／3／1／2 catalog tiers, while complete-catalog production classification remains stable at every Level.
5. Specialty supply is zero before Lv.50, 20 at Lv.50–74, and 40 at Lv.75–100; transaction, UI reopen, reload, and same-Port return cannot replenish it.
6. Retry or replay cannot duplicate XP, unlock feedback, Session creation, Category factors, or Specialty supply.
7. Focused curve boundary, multi-Product ledger, same-Port prevention, idempotency, supply depletion, persistence, pricing integration, and rendered feedback verification passes.
