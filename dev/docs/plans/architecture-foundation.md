# Architecture Foundation

## Goal

Give Meridian the engine-layer foundations its roadmap already depends on — enforced layer boundaries, a unified repository layout, semantic event flow, deterministic time and randomness, a scenario harness, a framework-free runtime, and a canvas presentation contract — before the voyage/offline, events/combat, and nautical-chart work makes retrofitting them expensive. The shapes are adapted from patterns proven in the sibling tickstrike-web project so both repositories share one placement and architecture vocabulary.

## Requirements

1. Layer dependency rules are enforced by the verification pipeline, not only by documentation, because agent-driven development erodes convention-only boundaries silently.
2. The repository uses a single unified source layout whose layer taxonomy matches tickstrike-web (core, content, runtime, platform, ui, shared, presentation, harness), so placement rules, boundary rules, and agent guidance can be written once and shared across both projects. Server and deployment code stays outside the game source tree because it is not game code.
3. Domain rules report what happened as semantic events instead of writing presentation text into game state; player-visible activity copy is rendered from events in exactly one place outside the domain layer. Observable activity behavior is preserved.
4. Content is authored per domain in catalog modules validated for cross-reference integrity at test time, because the upcoming navigation graph and expanded world data make broken references (unknown endpoints, orphan nodes) the dominant content failure mode.
5. Game time and randomness flow through one injected clock and named per-domain random streams derived from a single seed, with a tested contract that the same seed plus the same commands reproduces the same event sequence — the prerequisite for deterministic offline resolution.
6. Browser tests can load authored world fixtures by URL and control time through a debug interface, so voyage arrival, auto-restock, and offline flows are testable without waiting on real time.
7. Game state, command dispatch, scheduling, and save orchestration are owned by a framework-free runtime that the UI subscribes to; starting a new game or loading a save invalidates all stale timers and in-flight work.
8. Canvas scenes consume only state snapshots and semantic events, never domain rules, and every canvas scene ships together with a semantic DOM mirror so browser-test coverage never regresses when visuals leave the DOM.

## Design

### Layer model

The unified layout keeps Meridian's existing clean-architecture roles and renames them to the shared taxonomy: the deterministic rules-and-state owner (core), authored world data (content), orchestration between rules and everything else (runtime), browser and persistence adapters (platform), DOM feature UI (ui), cross-feature presentation primitives (shared), canvas rendering and event-driven animation (presentation), and test scenarios plus the debug interface (harness). Route shell and deployment concerns stay outside these layers.

Allowed dependency directions, enforced by child 01 and re-mapped by child 02:

- Core depends on nothing outside itself. No UI framework imports.
- Content depends only on core contracts; core never knows a specific content identity.
- Runtime depends on core and platform. Platform may implement contracts that runtime or core own.
- UI depends on core, runtime, and shared — never directly on platform.
- Presentation depends on core snapshots and events only — never on rules internals or UI.
- Harness may reach anything; production layers never depend on harness.

### Child overview

| Child | Focus | Document |
| ----- | ----- | -------- |
| 01 | Layer boundary enforcement in the lint pipeline | implementation spec |
| 02 | Unified src layout migration (pure move, no logic change) | sketch |
| 03 | Semantic event flow through domain rule results | sketch |
| 04 | Per-domain content catalogs with cross-reference validation | plan only |
| 05 | Injected clock and named random streams with a same-seed replay contract | plan only |
| 06 | Scenario fixtures and debug interface for deterministic browser tests | plan only |
| 07 | Framework-free game runtime owning state, dispatch, and scheduling | plan only |
| 08 | Canvas presentation contract with semantic DOM mirror | plan only |

### Landing order and gates

Recommended order is 01 through 08, with these gates:

- 01 is independent and lands first; it protects every later child.
- 02 lands only after the currently in-flight feature branches merge, because a whole-tree move conflicts with every open branch. It must land before canvas work multiplies file count.
- 03 must land before the v5-core events/items/combat child and before child 08, because canvas timelines and combat presentation attach to events.
- 04 must land before the nautical-chart navigation graph is authored; graph content is where cross-reference validation pays for itself.
- 05 must land before the v5-core voyage/offline child; offline resolution is a deterministic replay and needs the clock and stream contract in place.
- 06 depends on 05 (time control requires the injected clock) and should land before 08 so canvas flows are born testable.
- 07 must land before offline resolution and expedition timers multiply scheduling inside the UI layer, and before 08, which needs a runtime-owned canvas stage lifecycle.
- 08 lands together with the first canvas scene and consumes 03, 06, and 07.

Children 04 through 08 stay plan-only until they are next to execute; their specs are written lazily against the codebase as it exists after earlier children ship.

### Relationship to other plans

This plan owns architecture shape only. The v5-core plan owns gameplay behavior for voyage/offline and events/items/combat; the nautical-chart-navigation plan owns navigation content and the chart surface. Where a gate above names one of those plans, the architecture child is a prerequisite of that work, not a replacement for it.

## Non-Goals

1. No gameplay, balance, formula, or content value changes in any child; every child preserves observable player behavior unless its spec states a deliberate exception.
2. No new state-management or UI framework dependencies; the runtime child uses the platform's native subscription primitive.
3. No visual redesign; child 08 defines the contract for canvas scenes, while scene content and look belong to the nautical-chart and scene plans.
4. No save schema changes; events are transient runtime data and never enter persisted state.
5. No automation gameplay features; determinism and scheduling work here is infrastructure, not the frozen automation extension.

## Acceptance Criteria

1. A change that imports across a forbidden layer boundary fails verification; the current codebase passes unchanged.
2. After the layout migration, verification and the development server both pass, no import references the old layout, and the structure standard documents the new layout in the same change.
3. Domain rules no longer contain player-facing copy; the activity feed renders identically to before from events, and rule tests assert events instead of display strings.
4. An authored content error — an unknown reference, duplicate identity, or unreachable destination — fails the test suite with a diagnostic naming the offending entry.
5. Running the same commands against the same seed produces an identical event sequence, verified by a contract test, including across a simulated reload.
6. A browser test can load a mid-voyage fixture by URL, advance simulated time past arrival, and observe arrival effects without real-time waiting.
7. Starting a new game or loading a save cancels all pending timers and in-flight work from the previous session, verified by a regression test.
8. With the first canvas scene shipped, browser tests assert scene-relevant game facts through the semantic mirror rather than canvas pixels.
