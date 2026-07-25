# Nautical Chart Navigation 05 — Expedition Objective Lifecycle Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore a multi-phase maritime Expedition that sails from a home Port to a sea objective, pauses for Adventure or Combat, accepts a manual return-route choice, and settles only when the Fleet actually returns to a Port.

## Summary

An Expedition is not one Passage. It owns an outbound Passage, an objective phase, an explicit wait for the player when necessary, and a later return Passage chosen from the Fleet's actual objective location and remaining state.

The favored lifecycle freezes sailing simulation and baseline consumption while waiting for a manual decision. Expedition departure requires the outbound requirement plus an authored minimum objective and shortest-return reserve so at least one normal return remains available before Event losses; longer return choices are enabled only when the remaining Fleet state can support them.

## Sketch

- Add a candidate Expedition aggregate above Voyage passage progress rather than stretching one Passage snapshot to include sailing, Adventure, Combat, decision wait, and return time.
- Likely phases are outbound, objective, Combat or Adventure resolution, awaiting return route, returning, and completed. Verify how the existing Event and Combat contracts represent blocking decisions before the implementation spec.
- Maritime objectives should be authored content attached to a navigation node and SubRegion, not a Port and not the SubRegion itself. This keeps the stop location deterministic while preserving SubRegion eligibility.
- Outbound and return Passages remain independently quoted immutable sailing plans. The total Expedition duration is an observed sum of completed sailing and activity phases, never a value promised at home-Port departure.
- Reaching the objective materializes a node position and clears the sailing boundary schedule. Manual decision wait freezes simulation, pacing, and baseline Supply consumption.
- Objective and Combat costs belong to their owning activity contracts. Sailing Food and Water remain owned by the boundary resolver from Child 04.
- Return planning begins only after the objective permits departure. It may accept authored waypoint choices, but it starts from the objective node and must end at a known legal Port.
- The readiness rule should require outbound Supplies, authored objective minimums, and the shortest legal return reserve at home-Port departure. Event losses may still create a recovery state; they must not silently grant Supplies or auto-select a player decision.
- Only actual final Port entry performs Market, progression, restock, and docked settlement. Visiting a mission site or harbor approach is not Port entry.

### Candidate files to inspect

- `src/core/model/game.ts`
- `src/core/content/world-content.ts`
- `src/core/rules/voyage.ts`
- `src/core/rules/cargo.ts`
- `src/core/events/game-events.ts`
- `src/core/navigation/passage-planner.ts`
- `src/content/navigation-definitions.ts`
- `src/runtime/game-runtime.ts`
- `src/platform/persistence/save-migrations.ts`
- `src/ui/dashboard/voyage/voyage-status-panel.tsx`
- `test/unit/voyage.test.ts`
- `test/unit/determinism.test.ts`
- `test/unit/save-migrations.test.ts`

## Non-Goals

1. Delivering the final volume of pirate hunts, wreck searches, patrols, or other maritime mission content.
2. Defining tactical Combat rules, loot tables, Items, or injury systems already owned by their core systems.
3. Mid-edge reversal or arbitrary player diversion while a Passage remains underway.
4. Free-form sailing, runtime geography intersection, or automatic Trade Routes.

## Acceptance Criteria

1. A Fleet can sail from a Port to a deterministic sea objective, pause there, complete its activity, choose a legal return Passage, and settle only upon actual Port entry.
2. Waiting for a manual objective or return decision does not advance sailing simulation or consume baseline sailing Supplies.
3. Outbound, objective, and return costs remain separately attributable and deterministic across reload and offline return.
4. Departure guarantees a normal minimum return reserve before Event losses, while unaffordable optional return choices remain disabled with an explicit reason.
5. Equal state, seed, decisions, and explicit time reproduce the same phase transitions, costs, and final settlement.
