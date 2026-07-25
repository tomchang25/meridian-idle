# Nautical Chart Navigation 04 — Boundary-Aware Progress Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore deterministic advancement along the persisted edge path so the chart can narrate current waters and future maritime content can resolve at SubRegion or Event boundaries. This child hardens foreground, reload, visibility resume, hydration, clock rollback, and offline return without introducing canonical hourly ticks.

## Summary

The current Voyage has one departure and arrival boundary. Canonical state does not advance while underway; a 250-millisecond hook only interpolates visual progress, and one resolver settles the destination when the planned arrival timestamp is reached.

The likely extension retains that explicit-time model. The immutable passage snapshot provides ordered edge timing and SubRegion spans, presentation derives continuous ship position without saving animation progress, and the shared resolver processes only meaningful crossed boundaries in deterministic order. A quiet Voyage may still jump directly to arrival.

## Sketch

- `useVoyageClock` and `VoyageStatusPanel` currently derive progress from departure and planned arrival timestamps. Preserve presentation interpolation, but derive the selected edge, chart position, current narrated SubRegion, and remaining time from the immutable passage schedule rather than adding frame-by-frame store mutation.
- `resolveVoyage` currently performs one exact-boundary arrival. The candidate resolver should accept explicit `now`, clamp clock rollback, and iterate crossed edge, SubRegion, Event, and arrival boundaries in chronological order until reaching `now` or a manual decision.
- Do not create one persisted mutation per hour or per animation frame. Persist only state needed for exactly-once effects, manual pauses, changed arrival timing, or recovery; pure positional progress remains derived from timestamps and the immutable snapshot.
- Child 06 of V5 Core is expected to establish ordered Event beats, delay, diversion, Combat, Items, and idempotency. Verify its shipped contract before this child's implementation spec and adapt path boundaries to that single resolver rather than creating parallel graph events.
- Edge static risk and SubRegion spans should determine eligible Event context from copied snapshot inputs. Runtime graph edits must not move an active Voyage into different waters or change its Event exposure.
- A delay should update the remaining schedule through one deterministic persisted transition and account for additional Supplies through the established Event contract. A diversion should select only a legal authored Port outcome and replace the remaining committed path explicitly; it must not silently run current shortest-path logic against mutable content.
- Market Session transition, source Port XP settlement, auto-restock, docked state, and arrival feedback remain one atomic destination-entry boundary after every earlier beat resolves.
- Application entry points should converge on the same resolver for foreground scheduling, visibility resume, post-hydration settlement, and offline return. Browser timer callbacks schedule work but do not define elapsed time or event count.
- Save validation should cover ordered edge identity, endpoint coherence, monotonic timestamps, SubRegion spans, event boundary state, decision pauses, delay or diversion state, and destination legality. Corrupt snapshots remain recoverable without partial arrival.
- Domain tests should compare one-shot long-offline resolution, many incremental calls, save/reload between boundaries, exact-boundary calls, replay, and clock rollback. Application tests should cover Strict Mode scheduling and each browser lifecycle entry point without relying on timer tick count.
- The underway chart should expose origin, planned or actual destination, current narrated waters, path progress, remaining time, committed and extra Supplies, risk or Event state, and interruption reason through both visual and semantic presentation.

### Candidate files to inspect

- `src/core/model/game.ts`
- `src/core/rules/voyage.ts`
- `src/core/rules/progression.ts`
- `src/core/navigation/passage-planner.ts`
- `src/runtime/use-game-store.ts`
- `src/platform/persistence/save-migrations.ts`
- `src/ui/dashboard/voyage/use-voyage-clock.ts`
- `src/ui/dashboard/voyage/voyage-status-panel.tsx`
- `src/ui/dashboard/scene/port-scene-panel.tsx`
- `test/unit/voyage.test.ts`
- `test/unit/use-game-store.test.tsx`
- `test/unit/save-migrations.test.ts`
- `test/unit/dashboard.test.tsx`
- `test/e2e/application.smoke.spec.ts`
- `dev/docs/plans/v5-core_06_events-items-combat-and-recovery.sketch.md`

## Non-Goals

1. Per-hour canonical ticks, interval-count progression, or persisted animation-frame position.
2. New maritime mission types, dynamic weather, currents, Pirate Danger, Patrol, or tactical ship control.
3. A second Event, Combat, Port settlement, offline reward, or Market transition owner.
4. Replanning an active Voyage merely because graph content, unlocks, or balancing changed after departure.

## Acceptance Criteria

1. Equal snapshot, seed, decisions, and explicit time produce the same current edge, SubRegion narrative, ordered effects, delay or diversion, and final Port entry online and offline.
2. Quiet Voyages may resolve directly to arrival, while crossed effect boundaries apply in chronological order and at most once.
3. Smooth chart position and countdown remain derived presentation; gameplay correctness does not depend on animation frames, interval callbacks, or browser foreground time.
4. Manual Event decisions pause resolution and are never selected automatically during offline return.
5. Only actual Port entry settles Market Session, Port XP, restocking, and docked operations after every preceding boundary has resolved.
6. Incremental resolution, one-shot long-offline resolution, reload between boundaries, clock rollback, and replay produce equivalent canonical outcomes.
7. Invalid or obsolete persisted paths fail recoverably without partial Event effects, arbitrary rerouting, or unintended Port entry.
8. Underway route, current waters, progress, remaining time, Supplies, Event interruption, and arrival remain understandable through visual and semantic chart presentation.
