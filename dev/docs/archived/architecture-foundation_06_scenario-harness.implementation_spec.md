# Architecture Foundation 06 — Scenario Fixtures and Debug Interface

Parent Plan: `architecture-foundation.md`

## Goal

Let a browser test start from an authored world named in the URL and move simulated time by hand, so voyage arrival and auto-restock are testable in milliseconds instead of by waiting out their real duration.

## Summary

The only browser test today drives the whole flow through the UI and then waits up to eight seconds of real time for a voyage to arrive. Every future time-dependent flow — offline return, expedition timers — would add more waiting, and none of them can be reached at all without first replaying every preceding step by hand.

This change adds a harness layer holding three things: scenarios that build an authored world and register themselves by existing, a clock the test drives, and a small debug interface published on the page. The route shell becomes the composition root that wires them: when the URL names a scenario it starts the store from that world on the hand-driven clock and publishes the interface; otherwise it renders exactly what it renders today and publishes nothing.

Two seams make this possible. The store accepts an authored starting state and skips hydration when given one, and it exposes voyage resolution so the interface can settle work that advancing time has made due — the pending timer is scheduled against real milliseconds and will not fire just because simulated time moved. The dashboard splits into a component that owns a store for ordinary play and a view over an already-created store, so the harness and the screen read one store rather than two.

Layer rules are extended so no production layer can import the harness; only the route shell may, which is what keeps this a test seam rather than a back door into game code.

The harness clock starts from a fixed simulated epoch rather than the wall clock, so a scenario reproduces identically on every run.

## Relational Context

- The route shell renders the surface component, which is the only production module permitted to import the harness. Core, content, runtime, platform, and UI are all restricted from importing it by lint.
- The store gains an authored-state dependency. When present it seeds state directly, reports storage as unavailable, treats itself as already hydrated, and skips the load effect entirely, so a scenario is never overwritten by a save.
- The store also returns voyage resolution. The debug interface calls it after advancing simulated time because the store's arrival timer is a real timer: moving a simulated clock does not make it fire.
- The dashboard previously created its own store inside the component that also renders the screen. It splits so the store-owning component and the view are separate; calling the store hook conditionally would be illegal, and rendering the view with a provided store while a second store hydrated in the background would produce two savers competing over one record.
- The surface resolves the scenario through an external-store read with a null server snapshot, because the server render cannot see the URL. This is the mechanism that avoids a hydration mismatch without setting state inside an effect.
- Scenario modules build their world by calling the same rules the game uses, so a fixture cannot drift from real behavior the way a hand-written state literal would.
- The registry discovers scenario modules by glob, so adding a file is the whole registration step; this requires the bundler client types to be referenced by the TypeScript project.
- The debug interface is removed when the surface unmounts, so navigating from a scenario to ordinary play leaves nothing published.
- Wrong shape to avoid: reading the wall clock inside the harness. The fixed epoch is what makes a scenario reproducible.
- Wrong shape to avoid: exposing mutation beyond time control on the debug interface. It reads state and moves time; anything richer becomes a second way to play the game that no rule guards.

## Scope

### Included

- A harness layer: scenario type, glob registry, hand-driven clock, debug interface.
- Two starting scenarios: mid-voyage and docked-wealthy.
- Store seams for authored state and voyage settlement.
- A route-shell composition root that wires the harness only when a scenario is named.
- Lint rules forbidding harness imports from production layers.
- Browser tests proving scenario loading, time advance, and absence in ordinary play.

### Excluded

- Replacing the existing full-journey smoke test, which still has value as an unharnessed path.
- Offline resolution, expedition timers, or any new gameplay.
- A visible scenario picker; selection is by URL only.
- Sharing fixtures with unit tests, which build their worlds directly from rules already.

## Files to Change

| File                                      | Change Size | Purpose                                        |
| ----------------------------------------- | ----------- | ---------------------------------------------- |
| `src/harness/types.ts`                    | Small       | New: the scenario contract                     |
| `src/harness/scenarios/*.scenario.ts`     | Small       | New: authored starting worlds                  |
| `src/harness/scenario-registry.ts`        | Small       | New: glob registration and URL lookup          |
| `src/harness/harness-clock.ts`            | Small       | New: hand-driven clock on a fixed epoch        |
| `src/harness/debug-api.ts`                | Medium      | New: the published interface and its lifecycle |
| `src/app/game-surface.tsx`                | Medium      | New: composition root wiring harness to store  |
| `src/app/page.tsx`                        | Small       | Render the surface                             |
| `src/runtime/use-game-store.ts`           | Medium      | Authored-state seam; expose voyage settlement  |
| `src/ui/dashboard/meridian-dashboard.tsx` | Small       | Split store ownership from the view            |
| `src/vite-env.d.ts`                       | Small       | New: bundler client types for glob             |
| `eslint.config.mjs`                       | Small       | Forbid harness imports from production layers  |
| `e2e/harness-scenarios.spec.ts`           | Medium      | New: the harness contract in a browser         |

## Execution Outline

1. Add the harness layer: scenario contract, two scenarios, registry, clock, debug interface.
2. Add the store seams — authored state and exposed settlement — and split the dashboard so one store backs both the view and the interface.
3. Add the surface composition root and point the route at it.
4. Extend the lint rules to forbid harness imports from production layers.
5. Add the browser tests and run verification including the browser suite.

## Implementation Notes

- Advancing time settles by calling the store's own voyage resolution, which no-ops when the arrival is not yet due, so an advance that falls short is harmless.
- The scenario read must not set state inside an effect; use the external-store read with a server snapshot so the first client render reconciles cleanly.
- The store reference the interface reads is refreshed after commit, never during render.

## Edge Cases

| Case                                          | Expected Handling                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| Unknown scenario name in the URL              | Ignored; ordinary play renders and nothing is published                      |
| No scenario in the URL                        | Dashboard behaves exactly as before, with no debug interface                 |
| Advancing less than the remaining voyage time | Settlement no-ops; the voyage stays in progress                              |
| Navigating from a scenario to ordinary play   | The interface is removed on unmount                                          |
| Server render                                 | Sees no scenario and renders ordinary play, matching the first client render |

## Acceptance Criteria

1. A browser test loads a mid-voyage world by URL, advances simulated time past arrival, and observes settlement without waiting on real time.
2. Ordinary play renders unchanged and publishes no debug interface.
3. No production layer outside the route shell can import the harness.
4. A scenario produces the same world on every run.
