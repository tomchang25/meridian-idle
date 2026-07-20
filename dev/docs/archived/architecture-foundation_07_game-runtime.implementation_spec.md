# Architecture Foundation 07 — Framework-Free Game Runtime

Parent Plan: `architecture-foundation.md`

## Goal

Move game state, command dispatch, arrival scheduling, and save orchestration out of the React hook into a framework-free runtime the UI subscribes to, and make replacing the world cancel everything the previous world had in flight.

## Summary

The store hook currently owns everything: state and command error in React state, hydration in one effect, debounced saving in another, and the voyage arrival timer in a third. Each effect re-derives its own guards, and nothing ties them together — a save in flight, a pending arrival, and a hydration that has not landed all belong to whichever world happened to exist when they started, with no way to tell that world apart from the next one. Starting a new game while a save is loading is enough to have the loaded world overwrite the fresh one.

This change introduces a runtime class holding state, the commands, and all three schedules, with one generation counter stamped onto every asynchronous or scheduled step. Replacing the world bumps the generation and clears the timers, so anything belonging to the previous world is dropped when it lands rather than applied to the current one. The hook becomes a subscription: it constructs the runtime once per mount, hydrates it, disposes it on unmount, and reads snapshots through React's external-store subscription.

The hook's return shape is unchanged, so no UI component or existing test changes. What changes is that the world no longer lives inside React, which is what lets a later child drive it from a worker or resolve offline time without a mounted component.

One subtlety is fixed along the way: the runtime is created once per mount rather than keyed on dependency identity. Callers routinely pass inline dependency objects, and rebuilding the runtime whenever one changed identity would abandon a pending hydration mid-flight.

## Relational Context

- The runtime owns state, save status, and command error as one snapshot object, because React's external-store subscription compares snapshot identity; publishing them separately would tear the three apart across renders.
- Every timer and promise callback captures the generation active when it was scheduled and checks it before touching state. This is the single mechanism behind arrival cancellation, save cancellation, and stale hydration rejection; removing it from any one of them reopens that path.
- Replacing the world clears the last-saved marker as well as the timers, so the new world is saved rather than mistaken for already-persisted content.
- Hydration marks itself complete before installing the loaded world, because save scheduling refuses to run before hydration; marking it after would silently skip the first save.
- The hook constructs the runtime in a state initializer, not a memo keyed on dependencies. Dependencies are injection points fixed at mount; treating them as reactive would destroy and rebuild the world whenever a caller passed a fresh object literal.
- The hook disposes the runtime on unmount, which cancels timers and drops subscribers, so an unmounted surface cannot keep writing saves.
- The store's public return shape is preserved exactly, including the clock and voyage settlement the harness depends on, so the dashboard, the harness surface, and every existing test are untouched.
- The repository contract moves to the runtime and is structural rather than derived from the persistence class, so the runtime does not depend on a platform implementation to describe what it needs.
- Wrong shape to avoid: keeping any game state in React alongside the runtime. React holds a subscription and nothing else; two owners would drift.

## Scope

### Included

- A runtime class owning state, commands, arrival scheduling, saving, and hydration.
- Generation-based invalidation across all scheduled and in-flight work.
- Rewriting the hook as a thin subscription with an unchanged public shape.
- Regression tests for stale arrivals, stale hydration, disposal, saving, and notification.

### Excluded

- Offline resolution and worker execution, which this enables but does not implement.
- Any change to the hook's public shape, to UI components, or to gameplay.
- Replacing the persistence implementation or the save schema.

## Files to Change

| File                            | Change Size | Purpose                                                        |
| ------------------------------- | ----------- | -------------------------------------------------------------- |
| `src/runtime/game-runtime.ts`   | Large       | New: the framework-free runtime and its invalidation           |
| `src/runtime/use-game-store.ts` | Large       | Reduced to construction, hydration, disposal, and subscription |
| `tests/game-runtime.test.ts`    | Medium      | New: scheduling, invalidation, disposal, and save behavior     |

## Execution Outline

1. Add the runtime with state, commands, and the three schedules, each stamped with the active generation.
2. Rewrite the hook as a subscription over it, preserving the return shape exactly so nothing downstream moves.
3. Add regression tests for the invalidation paths, then run verification including the browser suite.

## Implementation Notes

- Arrival scheduling re-arms itself when it wakes early, because a clock the harness drives can move in steps that do not match real elapsed time.
- Commands that refuse — an ineligible departure, a target already met — publish the reason without touching state or rescheduling, matching the previous behavior exactly.
- Disposal bumps the generation as well as clearing timers, so a callback already queued cannot apply after teardown.

## Edge Cases

| Case                                           | Expected Handling                                            |
| ---------------------------------------------- | ------------------------------------------------------------ |
| New game started while a save is loading       | The loaded world is dropped; the fresh world stands          |
| New game started while a voyage is in flight   | The pending arrival is abandoned and never settles           |
| Runtime disposed with a debounced save pending | Nothing is written                                           |
| Arrival timer waking before the arrival is due | Re-arms for the remaining time rather than settling early    |
| Repository rejecting a save                    | Save status reports storage unavailable; state is unaffected |

## Acceptance Criteria

1. Starting a new game or loading a save cancels every pending timer and in-flight step from the previous world, verified by regression tests.
2. Game state, dispatch, scheduling, and saving live outside React; the hook holds only a subscription.
3. The store's public shape, the UI, and existing tests are unchanged.
4. The full unit and browser suites pass.
