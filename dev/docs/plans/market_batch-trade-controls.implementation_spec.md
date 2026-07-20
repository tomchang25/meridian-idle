# Market Batch Trade Controls

Parent Plan: none (standalone spec)

## Goal

Replace one-unit Product and Supply actions with precise batch controls. Make every Product held in Cargo sellable while keeping locked local Goods visible and making low-value local sales difficult to mistake.

## Summary

Market Exchange gains explicit Buy and Sell modes. Buy continues to show every entry in the current Port's complete Catalog, including entries above the current Port Level as visibly locked rows. Sell instead shows every positive-quantity Product stack in Fleet Cargo, including Products absent from the local Catalog, so imported Cargo is never hidden from sale.

Each Goods row uses a controlled quantity editor with `-10`, `-1`, native range, numeric input, `+1`, and `+10` controls. The selected value is the quantity for this transaction; the row previews quantity, unit price, and total before an explicit Buy or Sell command. A locally produced Product in Sell mode receives both a distinct warning treatment and explicit low-value local-sale text.

Provision Stores uses the same quantity editor for a different semantic: the value is the desired final quantity aboard. One Apply action buys the positive difference or discards the negative difference. Buying shows the quantity to buy and total Gold cost; discarding shows only the quantity to discard, with no refund display. No-op and invalid changes cannot be applied and expose a visible reason.

## Requirements

1. Market Exchange shall provide distinct Buy and Sell modes because their list ownership and transaction intent differ.
2. Buy mode shall list the current Port's complete Catalog in authored order. Entries above the current Port Level remain visible, identify their required level, and cannot be purchased.
3. Sell mode shall list every positive-quantity Product stack in Fleet Cargo exactly once, whether or not the current Port produces that Product. Empty stacks shall not appear.
4. Goods quantity controls shall support step changes of 10 and 1, range input, and exact numeric input. Their value represents the current transaction quantity and is bounded by the valid amount for that action.
5. Goods rows shall preview unit price, quantity, and total Gold, then require an explicit Buy or Sell action. The transaction remains atomic through the existing domain rules.
6. A Product present in the destination Port's complete Catalog shall have explicit local-production and low-sale-value warning text plus a distinct non-color-only visual treatment in Sell mode.
7. Each Supply row shall edit an absolute final quantity aboard. Apply shall buy `target - current` when positive, discard `current - target` when negative, and do nothing when equal.
8. A Supply increase shall show the purchased quantity and total Gold cost. A Supply decrease shall show the discarded quantity without refund copy or a refund value.
9. Locked, disabled, selected, invalid, and warning states shall be available through visible text and native HTML or appropriate ARIA semantics, with full keyboard and responsive access.

## Relational Context

- Authored Port Catalog entries remain the authority for Buy-mode membership, ordering, unlock levels, and local-production classification; global Product content must not be used to offer non-local Products for purchase.
- Fleet Product stacks remain the authority for Sell-mode membership and maximum sale quantity. Market presentation reads those stacks but does not mutate persisted state directly.
- Buy/Sell selection and draft Goods quantities are presentation state owned by Market Exchange. Supply targets are presentation state owned by Provision Stores. None of these drafts enter the persisted game schema.
- The shared quantity editor is a controlled dashboard presentation primitive. It reports a bounded whole-number intent to its owning row and never calls domain or application commands itself.
- Market Exchange calls application Product commands with an explicit quantity; the application store forwards that quantity to the existing Product buy/sell domain rules instead of retaining the current hard-coded quantity of one.
- Product pricing, purchase eligibility, Cargo usage, Specialty stock, sale classification, accounting, net trade, and activity remain owned by market and Cargo domain rules. Components may display their derived results but must not duplicate those formulas.
- Provision Stores sends one absolute Supply target to the application store. The store compares that target with the latest canonical stack inside its state update and delegates exactly one positive delta to the existing Supply buy or discard domain rule, preserving atomic validation and command-error behavior.
- Fixed global Supply prices and purchase errors remain derived from content, Gold, and shared Cargo Capacity. A target draft may be invalid, but Apply must defer to domain validation and must not partially mutate state.
- Existing save scheduling observes the resulting canonical state changes; this work adds no persistence fields, migration, or alternate save path.
- Dashboard component tests own visible mode, locked/warning, quantity, disabled-reason, and command-wiring coverage. Domain and application tests own maximum-purchase derivation, explicit quantities, and target-to-delta orchestration.

## Scope

### Included

- Batch Product purchases and sales.
- Cargo-complete Product selling.
- Buy/Sell Market Exchange modes and local-sale warnings.
- Target-based Supply buying and discarding.
- Shared accessible quantity controls and responsive styling.
- Focused domain, application, component, and smoke-test updates for the changed contracts.

### Excluded

- Explaining Market Reference or its relationship to Buy and Sell prices.
- Changing price formulas, sale modifiers, unlock levels, Specialty stock, Cargo Capacity, or cost-basis rules.
- Multi-Product carts, queued orders, bulk actions across several rows, or transaction confirmation dialogs.
- Save-schema or content changes.

## Files to Change

| File                                                 | Change Size | Purpose                                                                                                                                                          |
| ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/dashboard/city-actions/quantity-control.tsx` | Medium      | Add the controlled range, numeric, and step-button presentation primitive.                                                                                       |
| `src/ui/dashboard/city-actions/market-panel.tsx`     | Large       | Add Buy/Sell modes, mode-specific lists, batch previews/actions, locked rows, empty Sell state, and local-sale warnings.                                         |
| `src/ui/dashboard/city-actions/supplies-panel.tsx`   | Medium      | Replace separate one-unit actions with final-target editing, delta preview, and one Apply action.                                                                |
| `src/ui/dashboard/meridian-dashboard.module.css`     | Medium      | Style mode selection, quantity controls, previews, warnings, disabled states, and responsive layouts.                                                            |
| `src/runtime/use-game-store.ts`                      | Medium      | Accept Product quantities and expose one latest-state Supply-target command over existing domain transitions.                                                    |
| `src/core/rules/market.ts`                           | Small       | Expose the valid maximum Product purchase quantity as derived domain data for Buy controls.                                                                      |
| `tests/market.test.ts`                               | Small       | Cover maximum purchase quantities across Gold, Cargo, unlock, and Specialty constraints.                                                                         |
| `tests/use-game-store.test.tsx`                      | Small       | Cover explicit Product quantities and Supply target-to-buy/discard orchestration.                                                                                |
| `tests/dashboard.test.tsx`                           | Large       | Replace one-unit assumptions and cover modes, locked and cargo-only Goods, quantity controls, totals, warnings, Supply targets, and accessible disabled reasons. |
| `e2e/application.smoke.spec.ts`                      | Small       | Provision Food and Water through target controls so the existing voyage smoke path matches the new UI.                                                           |

## Execution Outline

1. Add the pure maximum-purchase derivation and change application command signatures, then cover the quantity and Supply-target contracts at domain and application layers.
2. Add the controlled quantity primitive with native inputs, bounded step behavior, explicit labels, and no domain knowledge.
3. Rebuild Market Exchange around Buy/Sell presentation state and their separate list authorities, wiring previews and explicit quantities through the application commands.
4. Replace Provision Stores actions with absolute targets and one Apply command, retaining domain-provided eligibility errors for invalid increases.
5. Update dashboard styling and component coverage together across desktop and narrow layouts, then update the existing voyage smoke selectors and run the repository verification contract.

## Implementation Notes

- The quantity primitive accepts only safe whole numbers and clamps step, range, and numeric changes to its supplied bounds. `-10`, `-1`, `+1`, and `+10` describe their effect in accessible names; range and numeric inputs have Product- or Supply-specific labels.
- Buy quantities default to one when at least one unit is valid and reconcile downward if Gold, shared Cargo space, or Specialty stock reduces the valid maximum. Locked or zero-maximum rows show zero, disable editing and Buy, and retain the domain-provided reason.
- Sell quantities default to one and are bounded by the held stack. Switching modes may discard row drafts; it must never execute or persist a trade.
- Expose Buy/Sell mode with native buttons and selected-state semantics. Sell mode renders an explicit empty state when no Products are held.
- Local-sale warning classification uses membership in the Port's complete Catalog, matching the existing `0.50` sale modifier even when that Catalog entry is not currently unlocked. Pair the distinct outline with text such as `Local product` and `Low local sale value`.
- Supply targets default to the current stack quantity and range from zero through Fleet Cargo Capacity. Other Cargo and Gold may make an increase within that absolute range invalid; show the existing purchase reason and disable Apply rather than silently lowering the requested target.
- For Supply increases, display `Buy N` and `Total: X Gold`. For decreases, display `Discard N` only. At equality, display `No change` and disable Apply. The visible button label remains `Apply` in both directions.
- Do not introduce a combined domain transaction or persisted draft model. Existing Product and Supply rules already own quantity validation and atomic accounting.

## Edge Cases

| Case                                                                             | Expected Handling                                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Held Product is absent from the local Catalog                                    | It appears in Sell mode with its destination sale price and can be sold up to the held quantity.                    |
| Held Product is also locally produced                                            | It appears once in Sell mode with explicit low-value local-sale warning treatment.                                  |
| Catalog Product is above the current Port Level                                  | It remains visible in Buy mode as locked with the required level and disabled controls.                             |
| Gold, Cargo space, or Specialty stock permits no purchase                        | Buy quantity is zero, Buy is disabled, and the actionable reason remains associated with the control.               |
| A completed trade changes another row's valid maximum                            | That row's draft reconciles to its new bounds without firing a command.                                             |
| No Product Cargo is held                                                         | Sell mode shows an empty state rather than Buy Catalog rows.                                                        |
| Supply target exceeds available Gold or shared Cargo space                       | The draft and delta preview remain visible, Apply is disabled, and the domain purchase reason is shown.             |
| Supply target is below current quantity                                          | Apply discards only the difference, shows no Gold total or refund copy, and preserves Gold.                         |
| Supply target equals current quantity                                            | Apply is disabled and no command is sent.                                                                           |
| Manual numeric input is empty, fractional, negative, or above its absolute bound | It cannot produce a command; the control resolves to a bounded safe whole-number value before Apply can be enabled. |

## Acceptance Criteria

1. Buy mode displays every Product in the current Port's complete Catalog, including visibly locked and non-actionable entries above the current Port Level.
2. Sell mode displays every held Product exactly once and allows a Product absent from the local Catalog to be sold.
3. A player can set a valid Goods transaction quantity through step buttons, range input, or numeric input and sees the correct quantity, unit price, and total before submitting one atomic transaction.
4. Goods commands buy or sell the selected quantity rather than one unit, and all existing Gold, Cargo, Specialty, accounting, net-trade, and activity effects remain correct.
5. Locally produced Goods in Sell mode have explicit low-value warning text and a distinct treatment that does not rely on color alone.
6. A player can set each Supply's final desired quantity and use one Apply action to buy or discard exactly the difference.
7. Supply increases show their purchase quantity and total cost; Supply decreases show their discard quantity without refund text or value.
8. Locked, no-op, unaffordable, over-capacity, and zero-availability actions are disabled with accessible visible reasons.
9. Quantity editing and mode selection remain keyboard operable and usable without horizontal loss of core actions at supported responsive breakpoints.
10. Focused automated coverage and the full repository verification suite pass with the new command and interaction contracts.
