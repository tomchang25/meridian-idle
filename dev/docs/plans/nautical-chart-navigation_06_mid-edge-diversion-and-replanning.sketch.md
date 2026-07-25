# Nautical Chart Navigation 06 — Mid-Edge Diversion And Replanning Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore player-commanded replanning from a canonical mid-edge position so a Fleet may reverse to the edge's prior node or continue to its next node, then follow selected waypoints to a different legal Port.

## Summary

Diversion first resolves the active Voyage to the command time, preserving completed traversal and actual Supply consumption. The untraveled future plan is then superseded by a new revision that begins with an immutable partial-edge connector to the chosen exit node and continues through a deterministic node-origin passage.

Authored water corridors identify legal forward and reverse relationships. The player may choose only known, unlocked destinations and legal waypoint sequences; content or balance changes never silently replan an active Voyage.

## Sketch

- Generalize the candidate planner origin from Port-only to either a navigation node or a materialized edge position, while retaining terminal-Port traversal rules.
- Directed edges likely need an authored corridor identity and explicit reverse-edge relationship. Verify whether all current paired edges can adopt this without inferring relationships from names.
- A diversion command must resolve explicit time before reading position. If the command crosses a boundary, replanning starts from the newly resolved node or edge rather than the stale displayed position.
- From a position on B-to-C, returning to B creates a reverse partial-edge connector for the already traversed portion; continuing to C creates a forward connector for the remaining portion. Duration and SubRegion traversal derive from the active immutable edge timeline.
- After the connector reaches B or C, a deterministic node-origin planner produces the selected route to the new Port, optionally through explicit legal waypoint nodes.
- Preserve completed traversal history and cost basis. The abandoned future portion produces no time, Supply consumption, risk, Event, or Port settlement.
- The active future plan may be replaced, but completed traversals and already-resolved effects remain immutable. A compact plan revision identity should prevent stale diversion confirmation.
- Diversion is unavailable during blocking Combat, unresolved manual decisions, non-reversible corridors, or other authored constraints. Disabled choices need explicit reasons.
- Runtime timers should be canceled and rescheduled from the new next boundary without allowing the superseded plan to arrive.
- Save validation should cover mid-edge position, connector direction, corridor coherence, revision identity, waypoint legality, and destination knowledge.

### Candidate files to inspect

- `src/core/content/world-content.ts`
- `src/core/model/game.ts`
- `src/core/navigation/passage-planner.ts`
- `src/core/rules/voyage.ts`
- `src/content/navigation-definitions.ts`
- `src/content/catalog-validation.ts`
- `src/runtime/game-runtime.ts`
- `src/runtime/use-game-store.ts`
- `src/platform/persistence/save-migrations.ts`
- `src/ui/dashboard/voyage/voyage-status-panel.tsx`
- `test/unit/passage-planner.test.ts`
- `test/unit/voyage.test.ts`
- `test/unit/game-runtime.test.ts`
- `test/unit/save-migrations.test.ts`

## Non-Goals

1. Free-form steering, arbitrary mid-ocean coordinates, or continuous physics.
2. Automatic rerouting caused only by later graph, unlock, or balance changes.
3. Tactical Combat movement, dynamic weather routing, currents, or safest-route optimization.
4. Automatic Trade Routes or multiple simultaneous Fleets.

## Acceptance Criteria

1. A player may resolve an underway Fleet to its exact mid-edge position, return legally to the prior node, and continue to a different known Port.
2. A player may instead finish the current edge, follow selected legal waypoints, and enter a different known Port.
3. Completed traversal, Supply consumption, cost basis, and effects remain unchanged when the future plan is replaced.
4. The abandoned future path cannot trigger arrival, Event, risk, or Supply effects after diversion.
5. Equal state, command time, choice, content snapshot, and seed produce the same connector, passage revision, and final outcome online and offline.
6. Illegal reversal, waypoint, destination, blocking state, or stale confirmation fails atomically with an explicit reason.
