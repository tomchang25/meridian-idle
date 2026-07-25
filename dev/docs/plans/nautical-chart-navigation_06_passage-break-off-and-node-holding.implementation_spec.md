# Nautical Chart Navigation 06 — Passage Break-Off And Node Holding

Parent Plan: `nautical-chart-navigation.md`

## Goal

Let the player withdraw from a committed Passage while underway. A committed Passage stays immutable, but the commitment itself becomes revocable: the Fleet sails only to the nearest legal node on its current edge, holds there, and continues under the Passage continuation Child 05 already delivered.

## Summary

Child 05 made a non-Port node a legal place to stop and a legal place to depart from. What it did not give the player is the ability to change their mind between those two moments. This Child adds exactly that one primitive and composes the rest from what already exists.

Breaking off resolves the active Voyage to the command time, then commits an ordinary single-edge Passage from the Fleet's resolved mid-edge position to either the edge's prior node or its next node. Completed traversal, consumed Supplies, and cost basis stay exactly as resolved. The abandoned route produces no further time, Supply, risk, or arrival effect. When the connector completes, the Fleet holds at that node, or settles normally if the node is a Port.

Node occupancy stops being an authored privilege. A Fleet may hold at any navigation node it legitimately reaches, because being at a node is a physical fact rather than a content decision. What remains authored is chart selectability: which nodes a player may pick as a destination. `canHoldPosition` is therefore replaced by `isChartDestination`, and NavPoint destination selection gains the knowledge gate that Port selection already has.

Break-off is a two-step journey, not an atomic reroute. The connector consumes real sailing time, so the onward Passage is quoted and committed after the Fleet arrives at the node. This keeps every Passage immutable and keeps holding the single place where a new commitment is made.

## Relational Context

- A Fleet is docked, underway, or holding, and never two of those at once. `voyage` present means underway; `holdingNavPointId` present means holding; neither means docked at `locationPortId`. Departure must clear the holding identity so the discriminator stays exclusive while a Voyage is active.
- Node occupancy carries no eligibility. `NavPoint.isChartDestination` governs only whether the chart offers that node as a selectable destination, and never whether the Fleet may be there.
- A break-off connector is an ordinary `PlannedPassageSnapshot` with one edge. It introduces no new Passage kind, no plan revision identity, and no splice into the abandoned plan. Stale confirmation is prevented by the existing quote-identity mechanism.
- The abandoned Passage is discarded rather than settled. Its `requiredSupplies` was a ceiling for a journey that will not happen, so no final remainder settlement runs for it. The accruing ledger's sub-unit remainder transfers into the connector, because the connector is the physical tail of the same continuous sail.
- `resolveVoyage` remains the only elapsed-time and Supply authority. A break-off command resolves to the command time before reading position, and never reads a displayed or interpolated position.
- Authored corridors own reverse relationships. `NavEdge.corridorId` makes the reverse edge authored data rather than an inference from identifier spelling, and a corridor's two directed edges must mirror endpoints, distance, risk, and span order.
- Span order is direction-significant. An edge's spans are traversed in array order, so a corridor's inbound edge must carry the reversed span sequence of its outbound edge.
- Schema v10 adds only the mid-edge departure marker to a planned Passage. Every v9 Passage receives `departedMidEdge: false` without changing its route, progress, ledger, timestamps, seed, or arrival behavior.
- Declining a break-off is always safe. The original Passage verified its full requirement at departure, so continuing remains funded even when neither exit is affordable.
- Waypoint sequences, mid-edge holding, queued onward Passages, Combat and Event blocking, and automatic replanning after content changes remain separate owners and must not be represented by placeholder fields in the break-off contract.

## Scope

### Included

- Universal node occupancy, with authored eligibility narrowed to chart destination selection.
- Authored corridor identity, mirrored corridor validation, and corrected inbound span ordering.
- Deterministic break-off preview and commitment to the prior or next node from a resolved mid-edge position.
- Ledger remainder transfer into the connector without settling the abandoned Passage.
- Harbor-approach destination knowledge inheritance from the Port it serves.
- Underway break-off surface with per-exit quotes and explicit disabled reasons, and a holding surface that accepts any reached node.
- Save schema v10 validation and migration of current v9 saves and active Voyages.
- Focused content, planner, rules, persistence, runtime, component, and determinism coverage.

### Excluded

- Holding at a mid-edge position rather than at a node.
- Selecting waypoint sequences, or any routing that the current linear graph cannot exercise.
- Queuing an onward Passage before the connector completes, or any atomic single-confirmation reroute.
- Combat, Event, Adventure, or manual-decision blocking rules, beyond leaving their seam intact.
- Automatic replanning triggered by later graph, unlock, or balance changes.

## Files to Change

| File                                                  | Change Size | Purpose                                                                                     |
| ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `src/core/content/world-content.ts`                   | Small       | Replace hold eligibility with chart-destination eligibility and add corridor identity.      |
| `src/content/navigation-definitions.ts`               | Small       | Author corridor identity and reverse inbound span order through the directed pair.          |
| `src/content/catalog-validation.ts`                   | Medium      | Validate corridor pairing, mirrored spans, and chart-destination eligibility.               |
| `src/core/model/game.ts`                              | Small       | Mark a mid-edge departure on a planned Passage and stamp schema v10.                        |
| `src/core/navigation/passage-planner.ts`              | Small       | Name node endpoints accurately in denial reasons.                                           |
| `src/core/rules/voyage.ts`                            | Large       | Quote and commit break-off connectors, branch node arrival, and clear holding on departure. |
| `src/core/events/game-events.ts`                      | Small       | Represent break-off semantically.                                                           |
| `src/core/state/initial-game-state.ts`                | Small       | Initialize schema v10 at Lisbon Port.                                                       |
| `src/platform/persistence/save-migrations.ts`         | Medium      | Validate v10 and append the lossless v9 mid-edge marker migration.                          |
| `src/runtime/activity-rendering.ts`                   | Small       | Render the break-off activity entry.                                                        |
| `src/runtime/game-runtime.ts`                         | Medium      | Resolve to command time, expose break-off preview and commit, and reschedule the boundary.  |
| `src/runtime/use-game-store.ts`                       | Small       | Expose the break-off commands to the dashboard.                                             |
| `src/ui/dashboard/voyage/voyage-status-panel.tsx`     | Large       | Offer both exits with quotes, requirements, and explicit disabled reasons.                  |
| `src/ui/dashboard/voyage/nav-point-hold-panel.tsx`    | Medium      | Present any held node, including one reached by break-off.                                  |
| `src/ui/dashboard/city-actions/nautical-chart.tsx`    | Medium      | Render authored chart destinations rather than holdable points.                             |
| `src/ui/dashboard/city-actions/harbor-panel.tsx`      | Small       | Follow the renamed destination eligibility.                                                 |
| `src/ui/dashboard/meridian-dashboard.module.css`      | Medium      | Style the break-off exits and their disabled states.                                        |
| `test/unit/content.test.ts`                           | Small       | Cover corridor pairing and mirrored span validation.                                        |
| `test/unit/voyage.test.ts`                            | Large       | Prove break-off accounting, both exits, holding, continuation, and refusal cases.           |
| `test/unit/save-migrations.test.ts`                   | Medium      | Cover v10 validation and lossless v9 active-Voyage migration.                               |
| `test/unit/game-runtime.test.ts`                      | Medium      | Cover command-time resolution, timer rescheduling, and stale confirmation.                  |
| `test/unit/determinism.test.ts`                       | Small       | Prove identical break-off results across incremental, offline, and reload resolution.       |
| `test/unit/dashboard.test.tsx`                        | Medium      | Cover the underway exit surface and the holding surface it leads to.                        |
| `dev/docs/reports/nautical_chart_navigation_map.html` | Small       | Add break-off, node occupancy, and corridor ownership to the human overview.                |

## Execution Outline

1. Generalize node occupancy and rename authored eligibility to chart destination, then clear the holding identity at departure so the docked, underway, and holding discriminator is exclusive.
2. Author corridor identity and reversed inbound span order, validate mirrored corridors, and add harbor-approach destination knowledge inheritance.
3. Add the mid-edge departure marker, stamp schema v10, and append the v9 migration while leaving every earlier migration sequential and unchanged.
4. Derive both connector geometries from the immutable edge timeline, quote them against current Supplies, and commit the chosen one with the transferred ledger remainder and a discarded abandoned plan.
5. Extend runtime with command-time resolution, break-off preview and commitment, and boundary rescheduling that no superseded plan can survive.
6. Add the underway exit surface and generalize the holding surface, then update chart destination rendering so no surface offers a dominated or unauthorized destination.
7. Add focused content, planner, rule, migration, runtime, determinism, and component coverage; update the human navigation report and run the full implementation verification required for source changes.

## Implementation Notes

- Derive both connectors from the active `PlannedPassageSnapshot` alone. The forward connector carries the current edge's remaining duration and remaining spans; the reverse connector carries the traversed duration and traversed spans in reverse, over the corridor's authored reverse edge.
- A connector Passage names graph nodes in `originPortId` and `destinationPortId` so planning and validation stay uniform, and sets `departedMidEdge` so presentation labels its origin as open water rather than claiming the Fleet departed from that node.
- Resolve the Voyage to the command time before reading position, and requote both exits from the resolved state. If resolution crosses the arrival boundary, arrival wins and the break-off is refused rather than applied to a stale position.
- Transfer `remainderMicroUnitMilliseconds` from the abandoned ledger into the connector's ledger. Discarding it would let repeated break-offs shave baseline consumption.
- Reuse the existing generation and timer mechanism in `scheduleVoyageResolution`; the connector's next boundary replaces the superseded one, and the abandoned plan must never fire an arrival.
- Keep the existing 16:9 chart canvas and the Child 05 panel composition. The underway surface gains exits, not a second map owner.

## Edge Cases

| Case                                           | Expected Handling                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Resolved position lands exactly on a node      | Complete the break-off at that node with no connector, holding or settling immediately.             |
| Command time is already past planned arrival   | Resolve the arrival normally and refuse the break-off with an explicit reason.                      |
| Corridor has no authored reverse edge          | Disable the reverse exit with an explicit reason; the forward exit remains independently available. |
| Neither exit is affordable                     | Disable both with deterministic reasons; the original Passage remains funded and continues.         |
| Legacy-route Passage underway                  | Refuse break-off explicitly; that snapshot carries no edge timeline to derive a connector from.     |
| Exit node is the preserved Market Session Port | Restore docked location without refreshing the Session, Specialty supply, or XP.                    |
| Clock rollback between preview and commitment  | Reject the stale quote; progress does not reverse and no partial mutation occurs.                   |
| Offline return past the connector's arrival    | Resolve exactly to holding at the connector's planned arrival; later elapsed time has no effect.    |
| v9 active Voyage migration                     | Preserve route, progress, ledger, timestamps, seed, and destination semantics exactly.              |
| Narrow screen or reduced motion                | Preserve ordered exit text, controls, and reasons without depending on animation or overflow.       |

## Acceptance Criteria

1. An underway Fleet can break off, sail a connector back to its edge's prior node, hold there, and later commit a Passage to a different known Port.
2. An underway Fleet can instead break off forward, complete the current edge, hold at its next node, and continue from there.
3. Completed traversal, consumed Supplies, and cost basis are unchanged by breaking off, and the abandoned route produces no later time, Supply, risk, or arrival effect.
4. Baseline consumption across a broken-off journey matches actual resolved traversal, and repeated break-offs cannot reduce it below that total.
5. The Fleet may hold at any node it legitimately reaches, while only authored chart destinations and known Ports may be selected as a destination.
6. A harbor approach is never offered as a chart destination for a Port the player does not know.
7. Illegal reversal, unaffordable exits, legacy-route Passages, stale quotes, and post-arrival commands all fail atomically with an explicit reason and no partial mutation.
8. Equal state, command time, exit choice, content, seed, and pacing produce identical connector, holding, continuation, Supply, and final Port results across incremental, offline, and save/reload resolution.
9. Current saves migrate losslessly to schema v10, while malformed mid-edge markers, corridor identities, or held node identities fail recoverably without fabricated positions or partial effects.
10. Underway exits, their requirements and disabled reasons, and the holding surface they lead to remain understandable and operable with keyboard, touch, assistive technology, reduced motion, and narrow responsive layouts.
