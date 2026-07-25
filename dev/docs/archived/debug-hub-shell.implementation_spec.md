# Debug Hub Shell

Parent Plan: none (standalone spec)

## Goal

Give Meridian a dev-only `/debug` hub that owns developer tooling, separate from ordinary play, and move the scenario harness off the root URL onto `/debug/game`. This establishes the placement rule — every dev tool is one catalog entry under `/debug/*` — before the nautical-chart work adds a diagnostic chart tool, so test entry, tuning/diagnostic tools, and the real game never tangle the way they did late in the sibling tickstrike project.

## Summary

Today the app has no router: `src/app/main.tsx` renders `GameSurface`, and `GameSurface` reads `?scenario=` on _any_ path, so the harness rides on the real game's URL. This change introduces a tiny dev-only router. `src/app/app.tsx` becomes the single dispatch point: in development it routes `/debug` to a hub index and `/debug/game` to the scenario testbed; everything else, and every path in a production build, renders ordinary play.

The scenario testbed is the current `GameSurface` harness path (read `?scenario=`, build a hand-driven clock and authored world, publish the debug interface, render `DashboardView`) moved verbatim into `src/app/debug/scenario-testbed.tsx`. Ordinary play is just `MeridianDashboard`, which already self-wires its own store. `GameSurface` is deleted because its two responsibilities now live in those two places.

All `/debug` code sits behind the `import.meta.env.DEV` tree-shaking guard: `app.tsx` creates the debug router as `import.meta.env.DEV ? lazy(...) : undefined`, exactly the pattern tickstrike uses, so the production bundle ships no hub, catalog, or testbed chunk and a production visitor to any `/debug` path gets the game. A one-entry catalog (`debug-tools.tsx`) is the single place that lists a tool's id, path, title, description, and lazy component; the hub renders the catalog and the router matches it, so adding the future `/debug/chart` diagnostic is one catalog entry rather than another hand-written conditional.

The harness entry is hard-moved, not aliased: `?scenario=` works only at `/debug/game`, and the two Playwright specs that enter through `/?scenario=…` are rewritten to `/debug/game?scenario=…` in the same change. `/` never reads a scenario again. Because e2e runs against the Vite dev server, `/debug/*` is reachable in the test.

## Requirements

1. In development, `/debug` renders a hub index listing every registered dev tool with working links; `/debug/game` renders the scenario testbed with its `?scenario=` selection preserved; unknown `/debug/*` falls back to the hub rather than white-screening.
2. Ordinary play renders on `/` and every non-`/debug` path and never reads `?scenario=` or publishes the debug interface.
3. A production build ships no hub, catalog, or testbed code, and any `/debug` path in production renders the game.
4. The scenario harness — authored-world load, hand-driven clock, and `window.__MERIDIAN__` interface — behaves exactly as before, only at its new `/debug/game` URL.
5. Adding a new dev tool is one catalog entry, not a new hand-written route conditional.

## Relational Context

- `src/app/app.tsx` is the only router and the single dispatch point between ordinary play and dev tooling; the DEV-guarded `lazy(...) : undefined` shape is load-bearing, because a static import of the debug modules would pull the testbed and harness UI into the production bundle. Wrong shape to avoid: importing `@/app/debug/*` unconditionally at module top level.
- Ordinary play is `MeridianDashboard` (`src/ui/dashboard/meridian-dashboard.tsx`), which owns its store via `useGameStore`. The testbed renders `DashboardView` over a store it builds from a scenario, so screen and debug interface read one store — this split already exists inside `GameSurface` and is only being relocated.
- `src/app/debug/scenario-testbed.tsx` is the only production-reachable module that imports `@/harness/*`. `src/app/**` carries no ESLint layer-boundary restriction (it is the route shell), so this import is already legal and no lint rule changes; the rule forbidding harness imports from core/content/runtime/platform/ui stays intact.
- `findScenario(null)` returns `undefined` (no default scenario). At `/debug/game` with a missing or unknown `?scenario=`, the testbed renders ordinary play, matching `GameSurface`'s current fallback.
- In a client-only SPA there is no SSR, so the testbed reads `window.location` directly instead of `GameSurface`'s `useSyncExternalStore` hydration guard; the guard is dropped as dead weight.
- The two `test/e2e/harness-scenarios.spec.ts` entries at `/?scenario=…` must move to `/debug/game?scenario=…` in this same change or they hit the hub index and fail; that spec's final `/` navigation (asserting ordinary play is unharnessed) stays `/`, and `application.smoke.spec.ts` stays on `/`.
- `dev/standards/project_structure.addendum.md` states "only the route shell (`src/app`) may wire the harness"; narrow it to the debug route and record the dev-only `/debug` surface.

## Scope

### Included

- Dev-only router in `src/app/app.tsx`, a `/debug` hub index, and a one-entry tool catalog.
- Relocating the harness path from `GameSurface` into `src/app/debug/scenario-testbed.tsx`; deleting `GameSurface`.
- Moving the Playwright harness entry to `/debug/game` and updating the structure addendum.

### Excluded

- Any second dev tool, including the nautical-chart diagnostic (`/debug/chart` lands with that work).
- A shared header/navigation shell beyond a plain hub index (tickstrike has four tools; Meridian has one).
- Any gameplay, harness-contract, scenario-content, or dashboard behavior change.

## Files to Change

| File                                          | Change Size | Purpose                                                             |
| --------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `src/app/app.tsx`                             | Small (new) | Dev-only router: `/debug*` to the debug router, else ordinary play  |
| `src/app/debug/debug-router.tsx`              | Small (new) | Matches a `/debug/*` path to a catalog tool, else the hub index     |
| `src/app/debug/debug-tools.tsx`               | Small (new) | One-entry catalog: id, path, title, description, DEV lazy component |
| `src/app/debug/debug-hub.tsx`                 | Small (new) | Hub index listing catalog entries                                   |
| `src/app/debug/debug-hub.module.css`          | Small (new) | Minimal readable styling for the dev hub                            |
| `src/app/debug/scenario-testbed.tsx`          | Small (new) | The relocated harness surface (scenario, clock, debug API, view)    |
| `src/app/main.tsx`                            | Small       | Render `<App />` instead of `<GameSurface />`                       |
| `src/app/game-surface.tsx`                    | Delete      | Its two roles move to `App` and the testbed                         |
| `test/e2e/harness-scenarios.spec.ts`          | Small       | Enter the harness at `/debug/game?scenario=…`                       |
| `dev/standards/project_structure.addendum.md` | Small       | Harness-wiring rule narrowed to the debug route                     |

## Execution Outline

1. Add `src/app/debug/scenario-testbed.tsx` by moving `GameSurface`'s harness path (scenario read, clock, `installDebugApi`, `DashboardView`) into it, dropping the SSR guard.
2. Add the catalog, hub index, and debug router; the catalog is the only list of tools.
3. Add `src/app/app.tsx` with the DEV-guarded debug router and the ordinary-play fallback; point `main.tsx` at `<App />` and delete `game-surface.tsx`.
4. Move the two `harness-scenarios.spec.ts` entries to `/debug/game`; leave the ordinary-play assertions on `/`.
5. Update the structure addendum.
6. Run governance, the full verification suite, and the Playwright acceptance suite against the Vite dev server.

## Implementation Notes

- `app.tsx`: `const DebugRouter = import.meta.env.DEV ? lazy(() => import("@/app/debug/debug-router").then((m) => ({ default: m.DebugRouter }))) : undefined;` then `if (DebugRouter && location.pathname.startsWith("/debug")) return <Suspense fallback={null}><DebugRouter /></Suspense>;` else `<MeridianDashboard />`. One DEV-guarded import keeps `app.tsx` tiny and the whole `src/app/debug` subtree out of production.
- The catalog entry's component is `lazy(() => import("@/app/debug/scenario-testbed").then((m) => ({ default: m.ScenarioTestbed })))`. Keep per-tool props out of the catalog; a tool reads its own config (the testbed reads `?scenario=` itself).
- The hub uses `<a href>` links, not client-side navigation; a full load per dev tool is fine and keeps the shell dependency-free.
- Keep the testbed's `installDebugApi` effect and hand-driven clock exactly as `GameSurface` had them; this change relocates, it does not re-solve the harness lifecycle.

## Edge Cases

| Case                                        | Expected Handling                                |
| ------------------------------------------- | ------------------------------------------------ |
| Unknown `/debug/<x>` in development         | Hub index renders, never a white screen          |
| Any `/debug` path in a production build     | Ordinary play renders, exactly as today          |
| `/debug/game` with missing/invalid scenario | Ordinary play renders (matches the old fallback) |

## Acceptance Criteria

1. In development, `/debug` shows an index of the registered dev tools and its link opens the scenario testbed; unknown `/debug/*` shows the hub, not a blank page.
2. The scenario harness works at `/debug/game` with `?scenario=` selection and the `window.__MERIDIAN__` interface, and behaves exactly as it did on the root URL.
3. Ordinary play renders on `/` and every non-`/debug` path and never publishes the debug interface.
4. A production build serves the game on every path and contains no hub, catalog, or testbed code.
5. Adding a dev tool requires only a new catalog entry.
6. Every Playwright spec that passed before passes after, entering the harness at `/debug/game`.
