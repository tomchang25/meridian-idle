# Supply Replenishment Policy and Arrival Auto-Restock

Parent Plan: none (standalone spec)

## Goal

Turn Supply targets into a durable Fleet provisioning policy so players set replenishment intent once instead of repeating the same work at every Port. Add predictable manual and arrival-time restocking while keeping Harbor focused on route readiness and departure.

## Summary

Provision Stores will persist one target for every Supply plus an `Auto-restock on Voyage arrival` setting. Editing a target saves policy only; it does not buy or discard inventory. The existing row Apply action remains the explicit way to reconcile one Supply, including deliberate no-refund discard when the target is below the quantity aboard.

A new `Restock all now` action and arrival automation will share one aggregate domain transition. They buy positive deficits only, validate the complete Cargo and Gold requirement before mutation, and either purchase every deficit or purchase nothing. Automatic restock runs after destination settlement, uses destination prices, never discards over-target Supplies, and records a success or failure without rolling back a completed arrival.

Harbor will show required, aboard, and missing Food and Water for each route. Harbor will not set targets, buy Supplies, switch city actions, or combine provisioning with departure.

## Requirements

1. The Fleet shall persist one non-negative whole-number target for every Supply and an arrival auto-restock boolean because this policy must survive city-action changes, Voyages, reloads, and offline arrival.
2. New games shall start with zero targets and arrival auto-restock disabled. Existing version-3 saves shall migrate each target from the matching quantity aboard and keep automation disabled so migration cannot create an unrequested purchase.
3. Supply target editing shall persist policy without changing Gold, Cargo stacks, cost basis, Market Session, Port XP, or Activity. The combined targets shall not exceed Fleet Cargo Capacity.
4. The existing per-Supply Apply action shall reconcile the latest persisted target against the latest canonical stack, buying a deficit or deliberately discarding a surplus under the existing one-Supply rules.
5. `Restock all now` shall purchase every positive target deficit in one atomic transaction at the current Port. It shall never discard an over-target Supply or partially purchase when aggregate Gold or Cargo Capacity is insufficient.
6. Arrival auto-restock shall use the same aggregate purchase rule after destination settlement, so destination Supply prices and destination Cargo state are authoritative.
7. Failed automatic restock shall preserve the completed arrival, destination Market Session, Port progression, Voyage result, Gold, and all Supply stacks. It shall add one warning Activity entry rather than surface the arrival resolver as a failed command.
8. Automatic restock identity and time shall derive from the Voyage and `plannedArrivesAt`, preserving deterministic equality across exact-boundary, delayed, reload, and offline resolution.
9. Harbor shall expose route Supply readiness and exact Food and Water shortages through visible text. Harbor shall not acquire or discard Supplies or switch city actions.
10. The persisted payload schema shall advance from version 3 to version 4 without changing the IndexedDB database layout version or deleting earlier migration paths.

## Relational Context

- Supply stacks remain canonical Fleet inventory; persisted targets and the toggle are Fleet-owned policy beside that inventory. React-local drafts must not remain a competing target authority.
- `QuantityControl` remains a controlled presentation primitive. Supplies Management reads canonical targets and sends target-setting, toggle, row-apply, and aggregate-restock intent to application commands.
- Target-setting commands validate safe whole numbers and aggregate target capacity, but do not perform a trade or write Activity. The autosave scheduler persists their resulting canonical state through the existing repository boundary.
- The existing row Apply path may still delegate one positive delta to `buySupply` or one negative delta to `discardSupply`. Aggregate manual and automatic restock consider only positive deficits.
- Aggregate restock eligibility, destination/current-Port pricing, Cargo use, Gold cost, stack quantity, and acquisition cost basis belong to pure Cargo-domain rules. Components may display a domain-derived plan and reason but must not reproduce those formulas.
- Aggregate restock must validate all deficits before creating a next state. Do not loop through `buySupply`, because sequential purchases would permit partial mutation and order-dependent outcomes.
- `useGameStore` remains the application mutation gateway and applies commands through functional state updates so target and inventory comparisons use the latest canonical state.
- `resolveVoyage` remains the sole arrival transition for foreground timers, reloads, and offline return. It calls `settlePortEntry` first and then attempts the shared restock rule against the settled destination state.
- Automatic restock failure is consumed by `resolveVoyage` as Activity, not returned as `RuleResult.error`; a provisioning failure must not misrepresent the successful Voyage arrival as a failed command.
- Automatic restock updates Supply cost basis at destination prices but does not alter `marketSession.netTrade`, Port XP, or the outbound Supplies already committed in `VoyageResult.supplyCost`.
- Harbor reads route requirements and canonical stacks to present readiness. `departVoyage` remains its only store mutation; Harbor does not switch city actions.
- Save loading appends a version-3-to-version-4 migration and composes older migrations through it. The IndexedDB repository continues storing the resulting envelope without knowing the new game-state fields.
- Current V5 design and plan documents must distinguish this finite dockside replenishment policy from excluded automatic trade routes, background logistics, Warehouses, and Long-Term Supply.

## Scope

### Included

- Persisted Supply targets and arrival auto-restock setting.
- Aggregate restock planning and atomic purchase.
- Manual `Restock all now` and retained row Apply/discard behavior.
- Destination-priced automatic restock after Voyage arrival.
- Harbor route readiness and shortages.
- Save migration, accessible responsive UI, documentation, and focused automated coverage.

### Excluded

- Automatic discard or target-based Product trading.
- `Provision and Depart` or any Harbor-side purchase command.
- Automatic Voyage selection, trade routes, Warehouses, Guilds, or background logistics.
- Supply price, route requirement, Cargo Capacity, Market Session, or Port XP formula changes.
- Adding automatic purchases to `VoyageResult.supplyCost`.
- IndexedDB layout changes or multi-tab ownership.

## Files to Change

| File                                                           | Change Size | Purpose                                                                                                    |
| -------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `game/domain/models/game.ts`                                   | Medium      | Add Fleet replenishment policy fields and advance current game-state schema to version 4.                  |
| `game/domain/state/initial-game-state.ts`                      | Small       | Initialize zero Supply targets and disabled arrival automation.                                            |
| `game/domain/rules/cargo.ts`                                   | Large       | Validate target policy, derive aggregate restock plans, and apply one all-or-nothing deficit purchase.     |
| `game/domain/rules/voyage.ts`                                  | Medium      | Present route readiness data and coordinate post-settlement automatic restock with deterministic Activity. |
| `game/application/use-game-store.ts`                           | Medium      | Expose target, toggle, row-apply, and aggregate-restock commands over the latest canonical state.          |
| `game/infrastructure/persistence/save-migrations.ts`           | Large       | Advance payload version and append version-3 policy defaults while preserving earlier migration chains.    |
| `game/features/dashboard/city-actions/supplies-panel.tsx`      | Large       | Replace local target drafts with policy controls, automation explanation, and aggregate manual restock.    |
| `game/features/dashboard/city-actions/harbor-panel.tsx`        | Medium      | Show required, aboard, and missing Supplies without provisioning or workspace navigation mutations.        |
| `game/features/dashboard/city-actions/city-action-panel.tsx`   | Small       | Keep Harbor as a read-only route-readiness consumer except for departure.                                  |
| `game/features/dashboard/meridian-dashboard.module.css`        | Medium      | Style policy, aggregate action, route readiness, focus, and responsive states.                             |
| `tests/cargo.test.ts`                                          | Medium      | Cover policy validation, aggregate totals, no-discard behavior, cost basis, and atomic failures.           |
| `tests/voyage.test.ts`                                         | Large       | Cover destination-price success, failure without arrival rollback, deterministic time, and replay no-op.   |
| `tests/use-game-store.test.tsx`                                | Medium      | Cover latest-state policy commands, aggregate wiring, persistence scheduling, and timer integration.       |
| `tests/save-migrations.test.ts`                                | Medium      | Cover version-3 defaults, chained older migration, current validation, and version-4 round trips.          |
| `tests/dashboard.test.tsx`                                     | Large       | Cover canonical controls, toggle, aggregate reasons, route readiness, and no Harbor provisioning controls. |
| `e2e/application.smoke.spec.ts`                                | Small       | Exercise persisted targets, aggregate provisioning, arrival automation, and destination inventory.         |
| `dev/docs/design/meridian-idle_v5.md`                          | Small       | Record dockside replenishment policy and its Gold, Cargo, pricing, and failure semantics as product truth. |
| `dev/docs/design/meridian-idle_v5_automation-and-logistics.md` | Small       | Exclude this finite Fleet policy from the frozen background logistics and automatic-route extension.       |
| `dev/docs/plans/v5-core.md`                                    | Small       | Clarify that excluded automation does not include the approved dockside Supply replenishment policy.       |

## Execution Outline

1. Extend Fleet state and Cargo-domain policy/restock rules, then add focused tests for target validity and aggregate atomicity.
2. Advance the save schema to version 4 and prove current, version-3, and chained older payload handling before any UI depends on the fields.
3. Integrate automatic restock after destination settlement and protect deterministic exact, delayed, reload, failure, and replay outcomes in Voyage tests.
4. Expose application commands and latest-state orchestration, including manual aggregate errors and automatic failure that does not become `commandError`.
5. Convert Supplies Management to canonical policy controls and add accessible aggregate preview, disabled reasons, checkbox explanation, and `Restock all now`.
6. Add Harbor readiness while preserving Harbor departure as its only store mutation and without workspace navigation.
7. Update responsive styling, dashboard and smoke coverage, and the authoritative V5 design/planning boundaries, then run focused checks and the repository verification contract.

## Implementation Notes

- Model the policy with fields equivalent to `supplyTargets: Record<SupplyId, number>` and `autoRestockOnArrival: boolean`. A target setter accepts zero through the remaining policy capacity after the other targets, preventing an inherently impossible total policy.
- Editing a target persists immediately. Row Apply therefore reads its target from the latest canonical state rather than accepting a component draft argument. A lower target does not discard until the player explicitly selects that row's Apply action.
- Derive each aggregate deficit as `max(target - quantity, 0)`. Sum all deficit units and destination/current-Port prices, validate the complete cost and free Cargo Capacity, then update Gold and every affected stack once. A positive manual success produces one aggregate Activity entry, not one entry per Supply.
- A zero-deficit aggregate plan is a no-op. Disable the manual aggregate button with a visible `Targets already met` reason, and do not add routine arrival Activity when automation finds nothing to buy.
- On automatic success, add one deterministic success Activity. On automatic failure, add one deterministic warning containing the actionable Gold or Cargo reason. Use Voyage-derived IDs and `plannedArrivesAt`; do not use resolver callback time.
- Apply arrival steps in this order: confirm due Voyage, settle destination, attempt automatic restock when enabled, retain settled state on restock failure, then publish the Voyage result and newest-first Activity list within the existing 24-entry cap.
- Migration shall introduce an explicit historical version-3 state shape. Version-2 migration continues producing its historical version-3 result and then passes through the new version-4 migration. Version-4 validation checks all five targets and the boolean; the IndexedDB database version remains unchanged.
- Use a native checkbox for arrival automation with visible copy that it buys deficits only and never discards. Aggregate preview and disabled reasons must remain associated with their action for assistive technology.
- Harbor route rows display required, aboard, and missing Food and Water with text, not color alone. Harbor does not include a provisioning or city-action navigation control.
- Update the smoke journey but do not run browser smoke outside the repository's final browser-acceptance boundary unless the user explicitly requests it.

## Edge Cases

| Case                                                   | Expected Handling                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Some Supplies are below target and others are above    | Buy every deficit atomically; preserve all over-target quantities and cost basis.                               |
| Combined deficits exceed available Gold or free Cargo  | Buy nothing; manual use reports an error and automatic arrival records one warning after arrival succeeds.      |
| Targets are already met                                | Manual aggregate action is disabled; automatic arrival performs no mutation and adds no routine log noise.      |
| A target is lowered below quantity aboard              | Save the lower policy without mutation; only explicit row Apply discards the difference without refund.         |
| A target edit would make total targets exceed Capacity | Reject the target change with an accessible reason and preserve the previous policy.                            |
| Arrival restock succeeds                               | Charge destination prices, update cost basis, and leave committed outbound `VoyageResult.supplyCost` unchanged. |
| Arrival restock fails                                  | Preserve destination, settlement, result, Gold, Supplies, and arrival Activity; add one restock warning.        |
| Automation is disabled                                 | Arrival does not evaluate, purchase, or log automatic restock.                                                  |
| Exact-boundary and long-offline resolution             | Produce identical inventory, Gold, timestamps, Activity IDs/order, Market Session, and Voyage result.           |
| Resolver is called again after completion              | Perform no additional purchase or Activity because the Voyage is already resolved.                              |
| A version-3 save contains Supplies                     | Seed each target from its matching quantity and disable automation.                                             |
| Harbor route lacks Food, Water, or both                | Show exact shortages; do not purchase, alter targets, or change city actions.                                   |

## Acceptance Criteria

1. Supply targets and arrival automation retain their values through city-action changes, Voyage, save, reload, and offline resolution.
2. Target editing changes policy without changing inventory or economy, and impossible aggregate targets cannot be saved.
3. Players can manually restock all deficits in one atomic purchase while retaining explicit per-row discard control.
4. Enabled arrival automation buys all deficits at destination prices, never discards over-target Supplies, and creates no partial purchase.
5. Failed arrival restock leaves the completed arrival and all settlement effects intact while clearly recording why replenishment did not occur.
6. Exact, delayed, reload, offline, and replay paths preserve one deterministic arrival and at most one automatic restock outcome.
7. Harbor shows route Supply readiness and exact shortages without owning provisioning or city-action navigation.
8. Version-1, version-2, and version-3 saves migrate to a valid version-4 policy without automatic purchase or IndexedDB layout change.
9. Policy, restock, readiness, disabled, success, and failure states remain keyboard operable, text-identifiable, and usable at supported responsive breakpoints.
10. Focused automated coverage and `npm run verify` pass; the updated browser journey remains ready for the permitted final smoke boundary.
